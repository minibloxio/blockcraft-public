// Three.js
let scene, camera, renderer, world, chunkManager, entityManager, textureManager, workerManager, stage, stats, composer, player, players;

// Stats
let prevTime = performance.now();
let statistics = [];

let mouse = new Ola({ x: 0, y: 0 }, 10); // Mouse
let game = new Game(); // Add game

// Update GUI size
function updateGUISize() {
    inventory.resize();
    chat.resize();
    hud.resize();
}

const axesHelper = new THREE.AxesHelper(0.5);
axesHelper.position.z -= 3;
const localToCameraAxesPlacement = new THREE.Vector3(0, 0, -3); // make sure to update this on window resize

// Initialize game
function init() {
    let t = Date.now();
    console.log('Initalizing game...')
    window.addEventListener('resize', onWindowResize, false); // Add resize event

    scene = new THREE.Scene(); // Add scene
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000); // Camera

    camera.add(axesHelper);
    axesHelper.visible = game.debug;

    world = new World(); // Init world
    chunkManager = new ChunkManager(); // Add chunk manager
    entityManager = new EntityManager(); // Add entity manager
    textureManager = new TextureManager(); // Add texture manager
    workerManager = new WorkerManager(); // Web worker manager
    player = new Player(camera); // Add player
    stage = new Stage(); // Initialize the stage (light, sun, moon, stars, etc.)

    addVideoControls(); // Add video settings
    addKeyboardControls(); // Add keyboard controls
    initStatistics(); // Add statistics to record
    initRenderer(); // Finalize by adding the renderer
    initPointerLock(); // Initialize pointer lock
    updateGUISize(); // Update the GUI size

    console.log('Game initialized in ' + (Date.now() - t) + 'ms') // Log time

    animate(); // Start the animation loop
}


// Initialize statistics
function initStatistics() {
    statistics.push(new Stat("Server", game, "region"));
    statistics.push(new Stat("Socket ID", socket, "id"));
    statistics.push(new Stat("Token", game, "token"));
    statistics.push([
        new Stat("FPS", game, "fps", 0),
        new Stat("UPS", game, "ups", 1),
        new Stat("TPS", game, "tps", 1),
        new Stat("Ping", function(key) {
            return player[key] ? player[key].average() : 0;
        }, "ms", 1, "ping"),
    ]);
    statistics.push(new Stat("MEM", function() {
        return Math.round(performance.memory.usedJSHeapSize / 1048576);
    }, "mb", 0));
    statistics.push(new Stat("Gamemode", player, "mode"));
    statistics.push(new Stat("Pos", player.position, false, 1, function(pos) {
        return pos.clone().divideScalar(world.blockSize);
    }));
    statistics.push(new Stat("Chunk Pos", player.position, false, 0, function(pos) {
        return world.computeCellFromPlayer(pos.x, pos.y, pos.z);
    }));
    statistics.push(new Stat("Biome", player, "biome"));
    statistics.push(new Stat("Vel", player.velocity, false, 1));
    statistics.push(new Stat("Speed", player, "speed", 2));
    statistics.push(new Stat("Fly", player, "fly"));
    statistics.push([
        new Stat("FOV", camera, "fov"),
        new Stat("Base", game, "fov"),
        new Stat("Delta", player, "deltaFov", 2)
    ]);
    statistics.push(new Stat("Facing", function() {
        let compass = new THREE.Vector3(0, 0, 0);
        camera.getWorldDirection(compass);
        if (Math.abs(compass.x) > Math.abs(compass.z)) {
            return compass.x > 0 ? "East  (→)" : "West  (←)";
        } else {
            return compass.z > 0 ? "South (↓)" : "North (↑)";
        }
    }));
}

// Initalize the renderer
function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Add statistics
    stats = new Stats();
    document.body.appendChild(stats.dom);

    // Add shader passes
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    document.body.appendChild(renderer.domElement);

    // Add a color shader
    colorPass = new THREE.ShaderPass(colorShader);
    colorPass.renderToScreen = true;
    colorPass.enabled = false;
    composer.addPass(colorPass);
}

// Game loop
let elasped, delta;
let then = performance.now();

function animate() {
    requestAnimationFrame(animate);

    // Get the frame's delta
    var time = performance.now();
    elasped = time - then;

    delta = (time - prevTime) / 1000;
    delta = Math.min(delta, 0.1)

    updateMenu(); // Update the menu
    player.update(delta, world); // Update player
    chunkManager.update(player); // Update chunks
    animateServerPlayers(); // Update server players
    animateServerEntities(delta); // Animate server entities

    // Send events to server
    sendPacket();

    // Scene update
    stage.update();
    stats.update();

    axesHelper.lookAt(new THREE.Vector3(0, 0, 100000000));

    composer.render(scene, camera);

    updateHUD(); // Update the HUD



    prevTime = time;

    // Update fps
    player.fps = round(stats.fps, 1);
    game.fpsList.unshift(performance.now() - time);
    if (game.fpsList.length > 50) {
        game.fps = 1000 / game.fpsList.average();
        game.fpsList.length = 25;
    }
}

// Window resize
function onWindowResize() {
    if (!initialized) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    var crosshairSize = 50;

    var width = $("html").innerWidth();
    $("#crosshair").css("left", width / 2 - crosshairSize / 2);
    var height = $("html").innerHeight();
    $("#crosshair").css("top", height / 2 - crosshairSize / 2);

    updateGUISize();
}