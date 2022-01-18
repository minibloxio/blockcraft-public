import Ola from "ola";
import * as THREE from "three";
import "../style.css";
import game from './Game';
import { camera, connectionDelay, g, isState, players, scene } from './globals';
import masterRenderer from './graphics/MasterRenderer';
import hud from './gui/HUD';
import { connectError, refreshServers, showServerSelect, updateMenu } from './gui/mainmenu/serverlist';
import { showSettings } from "./gui/mainmenu/settings";
import "./gui/mainmenu/tabs";
import "./input/input";
import initPointerLock, { onWindowResize, requestPointerLock } from "./input/pointerlock";
import inventory from "./items/Inventory";
import { round, updateGUISize } from './lib/helper';
import chat from './managers/ChatManager';
import chunkManager from './managers/ChunkManager';
import entityManager from './managers/EntityManager';
import PlayerManager from "./managers/PlayerManager";
import textureManager from './managers/TextureManager';
import workerManager from './managers/WorkerManager';
import world, { updateVoxelGeometry } from './managers/WorldManager';
import player from './Player';
import { getCookie, setCookie } from "./resources/cookie";
import { animateServerEntities, animateServerPlayers, updatePlayers } from './server';
import { addKeyboardControls, addVideoControls } from './settings';
import stage from './Stage';
import stats from "./stats/stats.js";
import { initStatistics } from './stats/statslist';

/*
Authenticates the player and provides server details from each running server.
Handles menu progression logic.
*/


// Setup
let lastConnection = Date.now() - connectionDelay;

// Initialize server connection
function connect(url) {
    console.log("Connecting to server with url: " + url);
    if (url in g.servers) {
        g.currentServer = g.servers[url];
    }
    g.socket.io.uri = url;
    g.socket.connect();
}

// Disconnect server
export function disconnectServer() {
    if (!isState("inGame")) return;

    $(".menu-button").hide();
    $("#disconnecting-bar").show();
    document.exitPointerLock();

    g.initialized = false;
    g.joined = false;
    g.currentServer = undefined;
    g.maxDisconnected = Object.keys(chunkManager.currChunks).length;
    g.disconnectedAnimate = new Ola(0);
    g.socket.disconnect();

    console.log("Disconnecting from server... (Cells to unload: " + g.maxDisconnected + ")");

    // Reset chunk manager
    chunkManager.reqChunks = {};

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

    g.state += 1;
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
        } else if (g.currentServer) {
            $("#server-bar").text(`Join server (${g.currentServer.region})`);
            $("#server-bar").css({ "background-color": "green" });
        }

    })

    if (DEV_MODE) { // TODO: Add callbacks to nextState() so setTimeout isn't needed 
        nextState()
        $("#direct-connect-input").val("localhost:3001")
        nextState()
        nextState()
        setTimeout(nextState, 2000)
    }
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

        g.state += 1;
    } else if (isState("serverSelect") && (g.currentServer || $("#direct-connect-input").val()) && Date.now() - lastConnection > connectionDelay) { // Server Select -> Connecting to Server
        // Direct connection
        let directConnect = $("#direct-connect-input").val();
        if (directConnect) {
            connect(directConnect);
        } else {
            connect(g.currentServer.link);
        }

        $("#server-bar").text(`Connecting to server...`);
        $("#server-bar").css({ "background-color": "orange" });

        // Wait for connection to server
        g.state += 1;
    } else if (isState("loading") && g.loaded > g.maxLoaded) { // Loading Game -> Loading Chunks
        console.log("Loading chunks...")
        g.loadedAnimate = new Ola(Object.keys(chunkManager.currChunks).length);
        g.state += 1;
    } else if (isState("loadingChunks") && Object.keys(chunkManager.currChunks).length >= g.maxChunks) { // Loading Chunks -> In Game
        console.log("Requesting pointer lock");
        requestPointerLock();
        updateGUISize();
        chat.initChat();

        $(".menu-button").hide();
        $("#ingame-bar").show();
        g.state += 1;
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

export function prevState() {
    if (isState("loading")) { // Go back to server select menu
        showServerSelect();

        g.state = 1;
    } else if (isState("loadingChunks")) {
        showServerSelect();

        g.state = 1;
    } else if (isState("disconnecting")) { // Go back to server select menu
        showServerSelect();

        g.loaded -= 1;
        g.state -= 5;
    }
}



export const axesHelper = new THREE.AxesHelper(0.5);
axesHelper.position.z -= 3;

// Initialize game
function init() {
    let t = Date.now();
    console.log('Initalizing game...')
    window.addEventListener('resize', onWindowResize, false); // Add resize event

    camera.add(axesHelper);

    addVideoControls(); // Add video settings
    addKeyboardControls(); // Add keyboard controls
    initStatistics(); // Add statistics to record
    masterRenderer.init()
    initPointerLock(); // Initialize pointer lock
    updateGUISize(); // Update the GUI size

    workerManager.init();

    console.log('Game initialized in ' + (Date.now() - t) + 'ms') // Log time

    animate(); // Start the animation loop
}


// #########################################################################
// GAME LOOP
// #########################################################################
let then = performance.now();
let prevTime = performance.now();

function animate() { // TODO: Clean up
    requestAnimationFrame(animate);

    // Get the frame's delta
    var time = performance.now();
    g.elapse = time - then;

    g.delta = (time - prevTime) / 1000;
    g.delta = Math.min(g.delta, 0.1)

    let logicTime = performance.now();
    game.startMemoryMonitor();

    updateMenu(nextState); // Update the menu
    player.update(g.delta, world); // Update player
    chunkManager.update(player); // Update chunks
    animateServerPlayers(); // Update server players
    animateServerEntities(g.delta); // Animate server entities
    sendPacket(); // Send events to server
    axesHelper.lookAt(new THREE.Vector3(0, 0, 100000000));
    game.logicTime = performance.now() - logicTime;


    let renderTime = performance.now();
    stage.update(); // Update the stage
    masterRenderer.render(scene, camera);
    game.renderTime = performance.now() - renderTime;

    let canvasTime = performance.now();
    hud.update(); // Update the HUD
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


// Send packet to server
function sendPacket() {
    if (Date.now() - game.lastPacket > game.packetDelay) {
        game.lastPacket = Date.now();
        g.socket.emit('packet', {
            pos: player.position,
            vel: player.newMove,
            onObject: player.onObject,
            rot: player.controls.getObject().rotation.toVector3(), // Rotation of body
            dir: camera.getWorldDirection(new THREE.Vector3()), // Rotation of head
            walking: (new THREE.Vector3(player.velocity.x, 0, player.velocity.z)).length() > 2, // CHANGED
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


// Get cookie username

let name = getCookie("Name");
if (name)
    $("#name-input").val(name);



// Connection to server successful
g.socket.on('connect', function () {
    console.log("Connected successfully with id: " + g.socket.id);
    lastConnection = Date.now();

    showSettings();
    g.state += 1;
});

// Reconnection attempt
g.socket.io.on('reconnect_attempt', function () {
    console.log("Attempting to reconnect...");
})

// Reconnection to server unsuccessful
g.socket.io.on('reconnect_failed', function () {
    console.log("Reconnection failed!");
    g.socket.disconnect();
    connectError();
})

// Disconnected from server
let disconnectId = undefined;
let disconnectCounter = 5;
g.socket.on('disconnect', function (reason) {
    console.log("Disconnected from server due to:", reason);

    if (reason == "io server disconnect") { // Served closed the connection
        disconnectServer();
    }

    if (reason == "transport close") {
        g.socket.disconnect();
        chat.addChat({
            text: "The server has restarted for a new update.",
            color: "red",
        })
        disconnectId = setInterval(function () {
            chat.addChat({
                text: `Your browser will refresh in ${disconnectCounter} seconds.`,
                color: "red",
            })
            disconnectCounter -= 1;
            if (disconnectCounter == 0) {
                clearInterval(disconnectId);
                window.location.reload(true);
            }
        }, 1000);
    }
})

// Kicked from server
g.socket.on('kick', function (reason) {
    let msg = reason ? "Kicked from server due to: " + reason : "Kicked from server";
    console.log(msg);
    disconnectServer();
    connectError("kicked", reason);
})

// Update session token
g.socket.on('uniqueToken', function (token) {
    setCookie('token', token, 365);
    game.token = token;
})

// Initialize client
g.socket.on('joinResponse', function (data) {
    // Check if already initialized
    if (g.initialized) console.log("Already initialized game!"); //location.reload(true);

    // Check if blacklisted
    if (data.blacklisted) {
        g.initialized = false;
        g.joined = false;
        g.currentServer = undefined;
        disconnectServer();
        prevState();
        connectError("banned", data.reason);
        return;
    }

    // Initialize axesHelper
    axesHelper.visible = game.debug;

    // Receive common world attritutes
    Object.assign(world, data.world);

    // Initalize player
    player.init();
    player.join(data);

    // Set chunk pos
    chunkManager.cellPos = world.computeCellFromPlayer(player.position.x, player.position.y, player.position.z);
    console.log("Starting chunk pos:", chunkManager.cellPos);

    // Receive current server players
    let serverPlayers = data.serverPlayers;
    for (let id in serverPlayers) {
        if (id != g.socket.id) {
            players[id] = serverPlayers[id];
            if (!players[id]) continue;
            PlayerManager.addPlayer(players, id);
        }
    }

    // Add pre-existing entities
    for (let id in data.world.entities) {
        entityManager.addEntity(data.world.entities[id]);
    }

    // Init voxel workers
    let worldData = {
        cellSize: world.cellSize,
        cellSliceSize: world.cellSliceSize,
        tileSize: world.tileSize,
        tileTextureWidth: world.tileTextureWidth,
        tileTextureHeight: world.tileTextureHeight,
        blockSize: world.blockSize,
        blockUVS: world.blockUVS,
        blockId: world.blockId,
        blockOrder: world.blockOrder,
        cells: world.cells,
    };

    workerManager.updateVoxelData(worldData);

    // Update to server tick
    game.tick = new Ola(data.tick);

    // Update item search
    inventory.updateItemSearch('');

    g.initialized = true;
    console.log("Successfully joined the server (" + data.info.region + ")");
    game.region = data.info.region;
})

// Load textures
g.socket.on('textureData', function (data) {
    if (g.loaded < g.maxLoaded) {
        world.tileSize = data.tileSize;
        world.tileTextureWidth = data.tileTextureWidth;
        world.tileTextureHeight = data.tileTextureHeight;
        textureManager.loadTextures(data);
    }
})

// Update chunk
g.socket.on('receiveChunk', async function (data) {
    await workerManager.updateRLEWorker(data); // Send decoding to the rleWorker
})

// Add newcoming players
g.socket.on('addPlayer', function (data) {
    if (!g.joined) return;
    // Add to players
    if (data.id != g.socket.id) { // Check if not own player
        players[data.id] = data;

        PlayerManager.addPlayer(players, data.id);
    }
})

// Remove player
g.socket.on('removePlayer', function (id) {
    if (!g.initialized || !players[id])
        return;

    chat.addChat({
        text: players[id].name + " has left the server",
        color: "yellow",
        timer: 3000,
    });
    scene.remove(players[id].entity);
    delete players[id];
})

// Receive knockback
g.socket.on('knockback', function (data) {
    let lateralForce = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
    lateralForce.normalize();
    lateralForce.multiplyScalar(data.force);
    player.knockbackVelocity.x = lateralForce.x;
    player.knockbackVelocity.y = data.explosion ? lateralForce.y : 300;
    player.knockbackVelocity.z = lateralForce.z;
})

// Receive punch
g.socket.on('punch', function (id) {
    if (id != g.socket.id && players && players[id]) {
        PlayerManager.updatePlayerColor(players[id], new THREE.Color(1, 0.5, 0.5))
        clearTimeout(players[id].punchId);
        players[id].punchId = setTimeout(function () {
            PlayerManager.updatePlayerColor(players[id], new THREE.Color(1, 1, 1))
        }, 400);
    }
})

// Receive damage
g.socket.on('damage', function (data) {
    camera.rotation.z = Math.PI / 12;
})

// Teleport player
g.socket.on('teleport', function (data) {
    player.setCoords(data.pos);
    camera.rotation.z = Math.PI / 12;
})

g.socket.on('update', async function (data) {
    await updateClient(JSON.parse(data));
})

g.socket.on('messageAll', function (data) {
    chat.addChat(data);
})

g.socket.on('message', function (data) {
    chat.addChat(data);
    if (data.type == "whisper") {
        player.lastWhisper = data.id;
    }
})

g.socket.on('refresh', function () {
    location.reload(true);
})

let lastUpdate = Date.now();

function updateClient(data) {
    if (!g.joined || !g.initialized) return;

    // Update player
    let serverPlayers = data.serverPlayers;
    updatePlayers(serverPlayers);

    // Update blocks
    let updatedBlocks = data.updatedBlocks;
    let updatedChunks = {};
    for (let block of updatedBlocks) {
        world.setVoxel(block.x, block.y, block.z, block.t);

        for (let offset of chunkManager.neighborOffsets) {
            let ox = (block.x + offset[0]);
            let oy = (block.y + offset[1]);
            let oz = (block.z + offset[2]);
            let cellId = world.computeCellId(ox, oy, oz);
            updatedChunks[cellId] = true;
        }
    }

    for (let id in updatedChunks) {
        let cell = world.computeCoordsFromId(id);
        updateVoxelGeometry(cell.x, cell.y, cell.z, true, true);
    }

    // Add new entities
    for (let entity of data.newEntities) entityManager.addEntity(entity);

    // Update existing entities TODO: cleanup
    let updatedEntities = data.entities;
    for (let id in updatedEntities) {
        let entity = updatedEntities[id];
        if (entity.type == "item" && world.entities[id]) {
            world.entities[id].onObject = entity.onGround;

            if (entity.name == "arrow" && !entity.onObject) {
                world.entities[id].pos = entity.pos;
                world.entities[id].vel.set(entity.vel);
            } else {
                world.entities[id].pos = entity.pos;
            }

            if (world.entities[id].mesh && world.entities[id].mesh.position.length() == 0) {
                world.entities[id].mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z)
            }
        }
    }

    // Update client player
    if (player) player.updateClient(serverPlayers[g.socket.id]);

    // Update tick
    game.updates.push(Date.now() - game.lastUpdate);
    if (game.updates.length > 20) game.updates.shift();
    game.ups = 1000 / game.updates.average();
    let tickDiff = Math.abs(data.tick - game.tick.value);
    if (tickDiff > 1000) {
        game.tick = new Ola(data.tick);
    } else {
        game.tick.value = data.tick;
    }
    game.lastUpdate = Date.now();
    game.tps = 1000 / data.tps;

    // Latency check
    if (Date.now() - lastUpdate > 500) {
        lastUpdate = Date.now();
        g.socket.emit('latency', data.t);
    }
}


