import "../style.css";
import { io } from "socket.io-client";
import * as THREE from "three";
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// Import classes (TURN THESE INTO SINGLETONS)
import { getCookie, setCookie } from "./resources/cookie";
import Stat from "./classes/Stats.js";
import { Stats } from './resources/stats.js';

// Import singletons
import game from './classes/Game';
import chunkManager from './classes/ChunkManager';
import entityManager from './classes/EntityManager';
import workerManager from "./classes/WorkerManager";
import skinManager from './classes/SkinManager';
import chat from './classes/ChatManager';
import hud from './classes/HUD';
import inventory from "./classes/items/Inventory";
import world from './classes/World';
import player from './classes/Player';
import { camera, scene } from './globals';
import initPointerLock from "./pointerlock";

// Import functions
import { addVideoControls, addKeyboardControls } from './settings';


import changelog from "../json/changelog.json"

import Ola from "ola";

/*
    Authenticates the player and provides server details from each running server.
    Handles menu progression logic.
*/

// Setup
let renderer;

let stats, composer, players;

// Stats
let prevTime = performance.now();
let statistics = [];

let mouse = new Ola({ x: 0, y: 0 }, 10); // Mouse

let lastUpdate = Date.now();
let state = 0; // State of where the player is in the authentication process (0: Start Menu, 1: Server Select, 2: Connecting to Server, 3: Loading Game, 4: Loading Chunks, 5: In Game, 6: Disconnecting)
let states = {
    "start": 0,
    "serverSelect": 1,
    "connecting": 2,
    "loading": 3,
    "loadingChunks": 4,
    "inGame": 5,
    "disconnecting": 6,
};

function isState(check) { return state == states[check]; }

let socket = io({
    autoConnect: false,
    forceNew: true,
    reconnectionAttempts: 2,
});

let loaded = 0;
let loadedAnimate = new Ola(0);
let maxLoaded = 6;
let maxChunks = 0; // Chunks need to be loaded before pointerlock can be enabled

const serverNames = {
    "gold": "Gold Server (formerly North America East)",
    "coal": "Coal Server (formerly North America West)",
    "iron": "Iron Server (formerly Europe West)",
    "wood": "Wood Server (New map!)",
}

const serverList = Object.keys(serverNames).map((x) => `https://${x}.blockcraft.online`)

let servers = {};
let currentServer = undefined;
let joined = false;
let disconnected = 0; // Disconnection progress
let disconnectedAnimate = new Ola(0); // Disconnection progress
let maxDisconnected = 5;
let connectionDelay = 2000;
let lastConnection = Date.now() - connectionDelay;

function refreshServers() {
    // Disconnect servers
    for (let link in servers) {
        let server = servers[link];
        server.socket.disconnect();
    }

    // Connect to servers
    servers = {};
    currentServer = undefined;

    $("#server-container").empty();
    for (let i = 0; i < serverList.length; i++) {
        let serverLink = serverList[i];
        servers[serverLink] = {
            socket: io(serverLink, {
                forceNew: true,
                reconnection: false,
            }),
            link: serverLink,
            info: {},
        };

        let server = servers[serverLink];

        // Connected to server
        server.socket.on('connect', function () {
            setTimeout(function () {
                server.socket.emit('serverInfoRequest', Date.now())
            }, 500);
        });

        // Error connecting to server
        server.socket.on('connect_error', function (error) {
            //console.error(error);
        });

        // Disconnected from server
        server.socket.on('disconnect', function (reason) {
            if (reason == "transport close") {
                console.log("Server down!");
                server.socket.disconnect();
            }
        })

        // Received server info
        server.socket.on('serverInfoResponse', function (data) {
            // Update server info
            console.log(data.link)
            servers[data.link].info = data;

            // Player names
            let playerNames = [];
            for (id in data.players) playerNames.push(data.players[id]);
            if (playerNames.length > 0) {
                playerNames = "Usernames: " + playerNames.join(", ");
            }

            // Update server list
            let latency = Date.now() - data.ping;
            let serverHTML = $(`
                <div class='server' data-link='${data.link}' onClick='clickServer(event)'  ondblclick='clickServer(event, true)'>
                    <p>Region: ${serverNames[data.region]}</p>
                    <p>Players: ${Object.keys(data.players).length}/20</p>
                    <div class="animated"><p id="player-names">${playerNames}</p></div>
                    <div>
                        <p class="serverInfo">${latency}ms</p>
                        <canvas id="${data.region}" class="serverBar" width="30" height="24"></canvas>
                    </div>

                    <div>
                        <p class="serverInfo" style="margin-bottom: 0; top: 54px;">${msToTime(data.uptime)} </p>
                        <canvas id="${data.region}-2" class="serverBar" style="top: 54px;" width="30" height="24"></canvas>
                    </div>
                </div>
            `)

            // Check if it's the first server
            if (!currentServer && !$("#direct-connect-input").val().length) {
                currentServer = data;

                setJoinButton(data);

                serverHTML.css({
                    "background-color": "rgba(0,0,0,0.7)",
                    "outline": "2px solid white",
                });
            }

            $("#server-container").append(serverHTML);

            let ctx_ = $("#" + data.region)[0].getContext("2d");
            let numOfBars = Math.max(5 - Math.floor(latency / 60), 1);
            let color;
            switch (numOfBars) {
                case 1:
                    color = "red";
                    break;
                case 2:
                    color = "orange";
                    break;
                case 3:
                    color = "yellow";
                    break;
                case 4:
                    color = "green";
                    break;
                case 5:
                    color = "lime";
                    break;
            }
            for (let i = 0; i < numOfBars; i++) {
                drawRectangle(i * 6, 16 - i * 4, 5, (i + 1) * 4, color, { ctx: ctx_ });
            }
            for (let i = numOfBars; i < 5; i++) {
                drawRectangle(i * 6, 16 - i * 4, 5, (i + 1) * 4, "grey", { ctx: ctx_ });
            }

            ctx_ = $("#" + data.region + "-2")[0].getContext("2d");
            drawCircle(15, 12, 11, "white", { ctx: ctx_, fill: false, outline: true, outlineColor: "white", outlineWidth: 2 });
            drawCircle(15, 12, 2, "white", { ctx: ctx_ });
            drawRectangle(14, 3, 2, 7, "white", { ctx: ctx_ });

            server.socket.disconnect();
        })
    }
}

// Set join button
function setJoinButton(server) {
    if (isState("serverSelect") && !$("#direct-connect-input").val().length) {
        $("#server-bar").text(`Join server (${server.region})`);
        $("#server-bar").css({ "background-color": "green" });
    }
}

// Clicked on a server
function clickServer(event, doubleClick) {
    let server = $(event.target).closest(".server");
    let url = server.data("link");
    if (url in servers) {
        currentServer = servers[url];
    }

    // Outline selected server
    $("#server-container").children().css({
        "background-color": "rgba(0,0,0,0.5)",
        "outline": "none",
    });
    server.css({
        "background-color": "rgba(0,0,0,0.7)",
        "outline": "2px solid white",
    });

    // Remove direct connect cookie
    $("#direct-connect-input").val('');
    deleteCookie('directConnect');

    // Set join button
    setJoinButton(currentServer.info);

    // Auto join server
    if (doubleClick) {
        $("#start-button").click();
    }
}

// Initialize server connection
function connect(url) {
    console.log("Connecting to server with url: " + url);
    if (url in servers) {
        currentServer = servers[url];
    }

    socket.io.uri = url;
    socket.connect();
}

// Error connecting to server
function connectError(type, reason) {
    reason = reason ? " (" + reason + ")" : "";
    let bar = $("#server-bar");
    if (type == "banned") {
        bar.text("Banned from server" + reason);
        bar.css({ "background-color": "red" });
    } else if (type == "kicked") {
        bar.text("Kicked from server" + reason);
        bar.css({ "background-color": "red" });
    } else {
        console.error("Error connecting to server!");
        $("#direct-connect-input").val('');
        deleteCookie('directConnect');

        bar.text("Connection failed");
        bar.css({ "background-color": "red" });
    }

    setTimeout(function () {
        if ($("#direct-connect-input").val()) {
            bar.text(`Direct Connect`);
        } else if (currentServer) {
            bar.text(`Join server (${currentServer.region})`);
        } else {
            bar.text(`Join server`);
        }
        bar.css({ "background-color": "green" });

        if (!type) state -= 1;
    }, connectionDelay);
}

// Join server
function joinServer() {
    if (!initialized) {
        let name = $("#name-input").val() || "";

        let joinInfo = {
            name: name,
            token: getCookie('token'),
            skin: player.skin,
        }
        socket.emit('join', joinInfo)
        loaded += 1;
        console.log("Joining server...")
    }
}

// Disconnect server
function disconnectServer() {
    if (!isState("inGame")) return;

    $(".menu-button").hide();
    $("#disconnecting-bar").show();
    document.exitPointerLock();

    initialized = false;
    joined = false;
    currentServer = undefined;
    maxDisconnected = Object.keys(chunkManager.currChunks).length;
    disconnectedAnimate = new Ola(0);
    socket.disconnect();

    console.log("Disconnecting from server... (Cells to unload: " + maxDisconnected + ")");

    // Remove all chunks
    world.cells = {};

    // Remove all players
    for (let id in players) {
        scene.remove(players[id].entity);
        delete players[id];
    }

    // Remove all entities
    for (let id in world.entities) {
        if (!world.entities[id].mesh) continue;

        let mesh = world.entities[id].mesh;
        if (mesh.type == "Group") {
            for (let i = 0; i < mesh.children.length; i++) {
                let child = mesh.children[i];
                child.geometry.dispose();
                child.material.dispose();
            }
            scene.remove(mesh);
        } else {
            mesh.geometry.dispose();
            mesh.material.dispose();
            scene.remove(mesh);
        }

        delete world.entities[id];
    }

    state += 1;
}


// Menu progression logic
$(document).ready(function () {
    // Initialize game
    init();

    // Refresh servers
    $("#refresh-servers").click(function () {
        refreshServers()
    })

    // Menu progression (0: Start Menu, 1: Server Select, 2: Loading Game, 3: In Game)
    $("#start-button").click(function (event) {
        nextState(event);
    })

    // Enter username input
    $("#name-input").keyup(function (event) {
        if (event.keyCode == 13) nextState();
    })

    // Enter direct connect input
    $("#direct-connect-input").keyup(function (event) {
        if (event.keyCode == 13) {
            nextState();
            return;
        }

        let val = $("#direct-connect-input").val();
        setCookie("directConnect", val, 365);
        if (val) {
            $("#server-bar").text(`Direct Connect`);
            $("#server-bar").css({ "background-color": "green" });
        } else if (currentServer) {
            $("#server-bar").text(`Join server (${currentServer.region})`);
            $("#server-bar").css({ "background-color": "green" });
        }

    })
})

// Menu progression states
function nextState(e) {
    if (isState("start")) { // Start Menu -> Server Select
        player.skin = "steve";

        if (e) { // Choose skin
            let x = e.pageX;
            let y = e.pageY;
            let offset = $("#steve-bar").offset();
            let steve = x > offset.left && x < offset.left + $("#steve-bar").width() && y > offset.top && y < offset.top + $("#steve-bar").height();
            if (steve) {
                player.skin = "steve";
            } else {
                player.skin = "alex";
            }
        }

        showServerSelect();

        state += 1;
    } else if (isState("serverSelect") && (currentServer || $("#direct-connect-input").val()) && Date.now() - lastConnection > connectionDelay) { // Server Select -> Connecting to Server
        // Direct connection
        let directConnect = $("#direct-connect-input").val();
        if (directConnect) {
            connect(directConnect);
        } else {
            connect(currentServer.link);
        }

        $("#server-bar").text(`Connecting to server...`);
        $("#server-bar").css({ "background-color": "orange" });

        // Wait for connection to server
        state += 1;
    } else if (isState("loading") && loaded > maxLoaded) { // Loading Game -> Loading Chunks
        console.log("Loading chunks...")
        loadedAnimate = new Ola(Object.keys(chunkManager.currChunks).length);
        state += 1;
    } else if (isState("loadingChunks") && Object.keys(chunkManager.currChunks).length >= maxChunks) { // Loading Chunks -> In Game
        console.log("Requesting pointer lock");
        requestPointerLock();
        updateGUISize();
        chat.initChat();

        $(".menu-button").hide();
        $("#ingame-bar").show();
        state += 1;
    } else if (isState("inGame")) { // In Game

        if (e) {
            let x = e.pageX;
            let y = e.pageY;
            let disconnectButton = x > $("#disconnect-bar").offset().left && x < $("#disconnect-bar").offset().left + $("#disconnect-bar").width() && y > $("#disconnect-bar").offset().top && y < $("#disconnect-bar").offset().top + $("#disconnect-bar").height();

            if (disconnectButton) { // Disconnect from server
                disconnectServer();
            } else { // Return to game
                requestPointerLock();
            }
        } else {
            requestPointerLock();
        }
    } else if (isState("disconnecting")) { // Disconnecting from server

    }
}

function prevState() {
    if (isState("loading")) { // Go back to server select menu
        showServerSelect();

        state = 1;
    } else if (isState("loadingChunks")) {
        showServerSelect();

        state = 1;
    } else if (isState("disconnecting")) { // Go back to server select menu
        showServerSelect();

        loaded -= 1;
        state -= 5;
    }
}

// Show server select page
function showServerSelect() {
    refreshServers();

    $(".input").hide(); // Hide input fields
    $(".menu-button").hide(); // Hide menu buttons
    $(".tab-container").hide(); // Hide tab containers

    let directConnect = getCookie("directConnect");
    if (directConnect) {
        $("#direct-connect-input").val(directConnect).focus();
        $("#server-bar").text(`Direct Connect`);
        $("#server-bar").css({ "background-color": "green" });
    } else {
        $("#server-bar").text("Finding Servers...");
        $("#server-bar").css({ "background-color": "orange" });
    }

    $("#direct-connect-input").show();
    $("#server-bar").show();

    $("#server-select").show();
    $("#server-button")[0].click();

    $("#background-image").show();
}

// Show settings page
function showSettings() {
    $(".menu-button").hide();
    $("#loading-bar").show();

    $(".input").hide();
    $("#name-input").show();

    $(".tab-container").hide();
    $("#settings").show();
    $("#video-button")[0].click();
}


// Update menu state
function updateMenu() {

    // Animate menu
    if (isState("serverSelect")) { // Server select

    } else if (isState("loading")) { // Loading game

        // Update loading progress
        if (loadedAnimate.value >= maxLoaded) {
            $("#loading-bar").text("Spawn")

            if (!joined) {
                joined = true;
                joinServer();
            }
        } else if (loadedAnimate.value < maxLoaded && !$("#loading-bar").text().includes("Spawn")) {
            let text = Math.min(100, round(loadedAnimate.value / maxLoaded * 100, 0));
            $("#loading-bar").text("Loading " + text + "%")
        }

        // Set loading progress
        loadedAnimate.value = loaded;
        $("#loading-bar").width(100 * (Math.min(loadedAnimate.value, maxLoaded) / maxLoaded) + "%")

    } else if (isState("loadingChunks")) { // Loading chunks

        let chunksLoaded = Object.keys(chunkManager.currChunks).length;
        loadedAnimate.value = chunksLoaded;
        $("#loading-bar").width(100 * (Math.min(loadedAnimate.value, maxChunks) / maxChunks) + "%");
        $("#loading-bar").text("Chunks Loaded (" + chunksLoaded + "/" + maxChunks + ")");

        if (chunksLoaded >= maxChunks) {
            nextState();
        }
    } else if (initialized && isState("inGame") && !player.controls.enabled) { // In game

        $("#loading-bar").text("Return to game");
        $("#loading-bar").width(100 + "%");

    } else if (isState("disconnecting")) { // Disconnecting

        disconnectedAnimate.value = maxDisconnected - chunkManager.chunksToUnload.length;
        let text = Math.min(100, round(disconnectedAnimate.value / maxDisconnected * 100, 0));
        $("#disconnecting-bar").text("Disconnecting " + text + "%");
        $("#disconnecting-bar").width(100 * (Math.min(disconnectedAnimate.value, maxDisconnected) / maxDisconnected) + "%");

        if (disconnectedAnimate.value >= maxDisconnected) {
            for (let id in cellIdToMesh) { // Dispose of all remaining meshes
                world.deleteCell(id, true);
            }
            chunkManager.removeAllDebugLines();
            prevState();
        }
    }
}

// Update GUI size
export function updateGUISize() {
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

    camera.add(axesHelper);

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
    statistics.push([
        new Stat("FPS", game, "fps", 0),
        new Stat("UPS", game, "ups", 1),
        new Stat("TPS", game, "tps", 1),
        new Stat("Ping", function (key) {
            return player[key] ? player[key].average() : 0;
        }, "ms", 1, "ping"),
    ]);
    statistics.push([
        new Stat("LT", function () {
            return game.logicTime;
        }, "ms", 2),
        new Stat("RT", function () {
            return game.renderTime;
        }, "ms", 2),
        new Stat("CT", function () {
            return game.canvasTime;
        }, "ms", 2),
        new Stat("Total", function () {
            return game.logicTime + game.canvasTime + game.renderTime;
        }, "ms", 2),
    ]);
    statistics.push([
        new Stat("RC", function () {
            return renderer.info.render.calls;
        }),
        new Stat("Tri", function () {
            return renderer.info.render.triangles / 1000;
        }, "k", 2),
        new Stat("F", function () {
            return renderer.info.render.frame;
        }),
    ]);
    statistics.push([
        new Stat("LIM", function () {
            if (!performance.memory) return 0;
            return performance.memory.jsHeapSizeLimit / 1048576;
        }, "mb", 0),
        new Stat("TOT", function () {
            if (!performance.memory) return 0;
            return performance.memory.totalJSHeapSize / 1048576;
        }, "mb", 0),
        new Stat("USED", function () {
            if (!performance.memory) return 0;
            return performance.memory.usedJSHeapSize / 1048576;
        }, "mb", 0),
        new Stat("INC", function () {
            if (!performance.memory) return 0;
            return game.memIncrease.average() / 1024;
        }, "kb", 0),
        new Stat("DEC", function () {
            if (!performance.memory) return 0;
            return game.memDecrease.average() / 1048576;
        }, "mb", 1),
    ]);
    statistics.push([
        new Stat("Geo", function () {
            return renderer.info.memory.geometries;
        }),
        new Stat("Tex", function () {
            return renderer.info.memory.textures;
        }),
    ]);
    statistics.push(new Stat("Server", game, "region"));
    statistics.push(new Stat("Socket ID", socket, "id"));
    statistics.push(new Stat("Token", game, "token"));
    statistics.push(new Stat("Gamemode", player, "mode"));
    statistics.push(new Stat("Pos", player.position, false, 1, function (pos) {
        return pos.clone().divideScalar(world.blockSize);
    }));
    statistics.push(new Stat("Chunk Pos", player.position, false, 0, function (pos) {
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
    statistics.push(new Stat("Facing", function () {
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
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    document.body.appendChild(renderer.domElement);

    // Add a color shader
    let colorPass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            color: { value: new THREE.Color(0x2e41f4) },
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
    });
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

    let logicTime = performance.now();
    game.startMemoryMonitor();

    updateMenu(); // Update the menu
    player.update(delta, world); // Update player
    chunkManager.update(player); // Update chunks
    animateServerPlayers(); // Update server players
    animateServerEntities(delta); // Animate server entities
    sendPacket(); // Send events to server
    axesHelper.lookAt(new THREE.Vector3(0, 0, 100000000));
    game.logicTime = performance.now() - logicTime;


    let renderTime = performance.now();
    stage.update(); // Update the stage
    composer.render(scene, camera);
    game.renderTime = performance.now() - renderTime;

    let canvasTime = performance.now();
    updateHUD(); // Update the HUD
    stats.update();
    game.canvasTime = performance.now() - canvasTime;

    prevTime = time;

    // Update fps and memory usage
    player.fps = round(stats.fps, 1);
    game.fpsList.unshift(performance.now() - time);
    if (game.fpsList.length > 50) {
        game.fps = 1000 / game.fpsList.average();
        game.fpsList.length = 25;
    }

    game.endMemoryMonitor();
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

// Send packet to server
function sendPacket() {
    if (Date.now() - game.lastPacket > game.packetDelay) {
        game.lastPacket = Date.now();
        socket.emit('packet', {
            pos: player.position,
            vel: player.velocity,
            onObject: player.onObject,
            rot: player.controls.getObject().rotation.toVector3(), // Rotation of body
            dir: camera.getWorldDirection(new THREE.Vector3()), // Rotation of head
            walking: (new Vector(player.velocity.x, player.velocity.z)).getMag() > 2,
            sneaking: player.key.sneak,
            punching: player.punchT < 2,
            blocking: player.blockT > 0,
            currSlot: player.currentSlot,
            mode: player.mode,
            fps: round(stats.fps, 1),
            showInventory: inventory.showInventory,
        });
    }
}


// INDEX.HTML FILE CODE

$("#welcome-button")[0].click();
// Prevent right-click
document.addEventListener('contextmenu', event => event.preventDefault());
let cookieExpiryTime = 30; // 30 days

// Change tab
function changeTab(evt, cityName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Tab links
$("#welcome-button").click(function (event) {
    changeTab(event, "welcome");
})
$("#changelog-button").click(function (event) {
    changeTab(event, "changelog");
})
$("#server-button").click(function (event) {
    changeTab(event, "server");
})
$("#video-button").click(function (event) {
    changeTab(event, "video-settings");
})
$("#keyboard-button").click(function (event) {
    changeTab(event, "keyboard-settings");
})

// Load the changelog
for (let change of changelog) {
    let date = change.date;
    let version = change.version;
    let changes = change.changes.split("|");

    let message = $("<span>v" + version + " | " + date + "</span><br><br>");
    $("#changelog").append(message);

    for (let comment of changes) {

        let message = $("<span>- " + comment + "</span><br>");
        $("#changelog").append(message);
    }

    $("#changelog").append($("<br>"));
}

// Get cookie username

let name = getCookie("Name");
if (name)
    $("#name-input").val(name);
