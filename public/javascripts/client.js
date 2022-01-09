// Connection to server successful
socket.on('connect', function() {
    console.log("Connected successfully with id: " + socket.id);
    lastConnection = Date.now();

    showSettings();
    state += 1;

    // if (loadedAnimate.value >= maxLoaded) { // If the player has joined and the game is loaded
    // 	joinServer();
    // }
})

// Reconnection attempt
socket.io.on('reconnect_attempt', function() {
    console.log("Attempting to reconnect...");
})

// Reconnection to server unsuccessful
socket.io.on('reconnect_failed', function() {
    console.log("Reconnection failed!");
    socket.disconnect();
    connectError();
})

// Disconnected from server
let disconnectId = undefined;
let disconnectCounter = 5;
socket.on('disconnect', function(reason) {
    console.log("Disconnected from server due to:", reason);

    if (reason == "io server disconnect") { // Served closed the connection
        disconnectServer();
    }

    if (reason == "transport close") {
        socket.disconnect();
        chat.addChat({
            text: "The server has restarted for a new update.",
            color: "red",
        })
        disconnectId = setInterval(function() {
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
socket.on('kick', function(reason) {
    let msg = reason ? "Kicked from server due to: " + reason : "Kicked from server";
    console.log(msg);
    disconnectServer();
    connectError("kicked", reason);
})

// Update session token
socket.on('uniqueToken', function(token) {
    setCookie('token', token, 365);
    game.token = token;
})

// Initialize client
socket.on('joinResponse', function(data) {
    // Check if already initialized
    if (initialized) console.log("Already initialized game!"); //location.reload(true);

    // Check if blacklisted
    if (data.blacklisted) {
        initialized = false;
        joined = false;
        currentServer = undefined;
        disconnectServer();
        prevState();
        connectError("banned", data.reason);
        return;
    }

    // Receive common world attritutes
    Object.assign(world, data.world);

    // Initalize player
    player.init();
    player.join(data);

    axesHelper.visible = game.debug;

    // Receive current server players
    players = {};
    let serverPlayers = data.serverPlayers;
    for (let id in serverPlayers) {
        if (id != socket.id) {
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

    initialized = true;
    console.log("Successfully joined the server (" + data.info.region + ")");
    game.region = data.info.region;
})

// Load textures
socket.on('textureData', function(data) {
    if (loaded < maxLoaded) {
        world.tileSize = data.tileSize;
        world.tileTextureWidth = data.tileTextureWidth;
        world.tileTextureHeight = data.tileTextureHeight;
        textureManager.loadTextures(data);
    }
})

// Update chunk
socket.on('receiveChunk', async function(data) {
    await workerManager.updateRLEWorker(data); // Send decoding to the rleWorker
})

// Add newcoming players
socket.on('addPlayer', function(data) {
    if (!joined) return;
    // Add to players
    if (data.id != socket.id) { // Check if not own player
        players[data.id] = data;

        PlayerManager.addPlayer(players, data.id);
    }
})

// Remove player
socket.on('removePlayer', function(id) {
    if (!initialized || !players[id])
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
socket.on('knockback', function(data) {
    let lateralForce = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
    lateralForce.normalize();
    lateralForce.multiplyScalar(data.force);
    player.knockbackVelocity.x = lateralForce.x;
    player.knockbackVelocity.y = data.explosion ? lateralForce.y : 300;
    player.knockbackVelocity.z = lateralForce.z;
})

// Receive punch
socket.on('punch', function(id) {
    if (id != socket.id && players && players[id]) {
        PlayerManager.updatePlayerColor(players[id], new THREE.Color(1, 0.5, 0.5))
        clearTimeout(players[id].punchId);
        players[id].punchId = setTimeout(function() {
            PlayerManager.updatePlayerColor(players[id], new THREE.Color(1, 1, 1))
        }, 400);
    }
})

// Receive damage
socket.on('damage', function(data) {
    camera.rotation.z = Math.PI / 12;
})

// Teleport player
socket.on('teleport', function(data) {
    player.setCoords(data.pos);
    camera.rotation.z = Math.PI / 12;
})

socket.on('update', async function(data) {
    await updateClient(JSON.parse(data));
})

socket.on('messageAll', function(data) {
    chat.addChat(data);
})

socket.on('message', function(data) {
    chat.addChat(data);
    if (data.type == "whisper") {
        player.lastWhisper = data.id;
    }
})

socket.on('refresh', function() {
    location.reload(true);
})

function updateClient(data) {
    if (!joined || !initialized) return;

    // Update player
    let serverPlayers = data.serverPlayers;
    updatePlayers(serverPlayers);

    // Update blocks
    let updatedBlocks = data.updatedBlocks;
    let updatedChunks = {};
    for (let block of updatedBlocks) {
        world.setVoxel(block.x, block.y, block.z, block.t);

        for (let offset of neighborOffsets) {
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

    // Update existing entities PUT THIS IN THE WORLD CLASS FUNCTION
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
    if (player) player.updateClient(serverPlayers[socket.id]);

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
        socket.emit('latency', data.t);
    }
}