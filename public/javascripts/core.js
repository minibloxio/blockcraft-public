// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

// Three.js
let scene, renderer, world, chunkManager, stage, sky, stats, composer, colorShader, inScreen;
let loaded = 0;
let loadedAnimate = new Ola(0);
let maxLoaded = 6;
let tick = new Ola(0)

let sprite = undefined;

// Stats
var prevTime = performance.now();
var statistics = [];

// Camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000000);
var player;

// Mouse
var mouse = new Ola({x: 0, y: 0}, 10);

var players = {};

var rleWorker = new Worker('javascripts/workers/rle-worker.js');

let voxelWorkers = [];
for (let i = 0; i < 4; i++) {
	voxelWorkers.push(new Worker('javascripts/workers/voxel-worker.js'));
	voxelWorkers[i].addEventListener('message', e => {
	  updateVoxelMesh(e);
	})
}

function init() {
	console.log('Initalizing BlockCraft...')
	console.log('Socket ID:', socket.id)
	// Initialize pointer lock
	initPointerLock();

	// Add scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	// Add world
	world = new World();

	// Add chunk manager
	chunkManager = new ChunkManager();

	// Add player
	player = new Player(camera);
	scene.add( player.controls.getObject() );

	// Add light
	stage = new Stage();

	// Add settings
	addVideoControls();

    // Add statistics to record
    statistics.push(new Stat("Gamemode", player, "mode", 2))
    statistics.push(new Stat("Pos", player.position, false, 2, function (pos) {
    	return pos.clone().divideScalar(16);
    }))
    statistics.push(new Stat("Chunk Pos", player.position, false, 2, function (pos) {
    	return world.computeCellFromPlayer(pos.x, pos.y, pos.z);
    }))
    statistics.push(new Stat("Vel", player.velocity, false, 2))
    statistics.push(new Stat("Dir", player.direction, false, 2))
    statistics.push(new Stat("Speed", player, "speed", 2))
    statistics.push(new Stat("Fly", player, "fly", 2))
    statistics.push(new Stat("Clip", player, "clip", 2))

    // Finalize by adding the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	
	// Add statistics
	stats = new Stats();
	document.body.appendChild( stats.dom );

	// Add shader passes
	composer = new THREE.EffectComposer(renderer);
	composer.addPass(new THREE.RenderPass(scene, camera));

	document.body.appendChild( renderer.domElement );

	colorShader = {
		uniforms: {
		  tDiffuse: { value: null },
		  color:    { value: new THREE.Color(0x2e41f4) },
		},
		vertexShader: `
		  varying vec2 vUv;
		  void main() {
		    vUv = uv;
		    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
		  }
		`,
		fragmentShader: `
		  uniform vec3 color;
		  uniform sampler2D tDiffuse;
		  varying vec2 vUv;
		  void main() {
		    vec4 previousPassColor = texture2D(tDiffuse, vUv);
		    gl_FragColor = vec4(
		        previousPassColor.rgb * color,
		        previousPassColor.a);
		  }
		`,
	};

	colorPass = new THREE.ShaderPass(colorShader);
	colorPass.renderToScreen = true;
	colorPass.enabled = false;
	composer.addPass(colorPass);

	// Add resize event
	window.addEventListener( 'resize', onWindowResize, false );

	// Show welcome page
	document.getElementById("welcome-button").click()

	loaded += 1; // Increase loading stage
}

function animate() {
	requestAnimationFrame( animate );

	// Get the frame's delta
	var time = performance.now();
	delta = ( time - prevTime );
	delta /= 1000;

	delta = Math.min(delta, 0.1)

	// Animate start menu
	if (loadedAnimate.value >= maxLoaded) {
		$("#loading-bar").text("Start")
	} else if (loadedAnimate.value < maxLoaded && $("#loading-bar").text() != "Start") {
		let text = Math.min(100, round(loadedAnimate.value/maxLoaded*100, 0));
		$("#loading-bar").text("Loading " + text + "%")
	}
	loadedAnimate.value = loaded;
	$("#loading-bar").width(100*(Math.min(loadedAnimate.value, maxLoaded)/maxLoaded)+"%")

	// Player update
	if (player.hp > 0 && initialized) {
		player.update(delta, world);
	}

	// Update chunks
	chunkManager.update(player);

	// Update server players

	for (let id in players) {
		let p = players[id];
		if (p.entity) {
			updatePlayer(p);
		}
	}

	// Update server entities

	for (let id in world.entities) {
		let e = world.entities[id]
		e.mesh.position.lerp(e.pos, delta*10)

		if (e.class == "item")
			e.mesh.rotation.y += delta;
	}

	// Emit events to server

	socket.emit('packet', {
		pos: player.position,
		vel: player.velocity,
		onObject: player.onObject,
		rot: player.controls.getObject().rotation.toVector3(), // Rotation of body
		dir: camera.getWorldDirection(new THREE.Vector3()), // Rotation of head
		walking: (new Vector(player.velocity.x, player.velocity.z)).getMag() > 2,
		punching: player.punchT < 2,
		blocking: player.blockT > 0,
		currSlot: player.currentSlot,
		mode: player.mode,
	});

	// Scene update

	stage.update();
	stats.update();

	prevTime = time;

	composer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	var crosshairSize = 50

	var width = $("html").innerWidth()
	$("#crosshair").css("left", width/2 - crosshairSize/2)
	var height = $("html").innerHeight()
	$("#crosshair").css("top", height/2 - crosshairSize/2)

}