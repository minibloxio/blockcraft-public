// Connection to server successful
socket.on('connect', function () {
	console.log("Connected successfully with id: " + socket.id);

	showSettings();
    state += 1;

	// if (loadedAnimate.value >= maxLoaded) { // If the player has joined and the game is loaded
	// 	joinServer();
	// }
})

// Reconnection attempt
socket.io.on('reconnect_attempt', function () {
	console.log("Attempting to reconnect...");
})

// Reconnection to server unsuccessful
socket.io.on('reconnect_failed', function () {
	console.log("Reconnection failed!");
	socket.disconnect();
	connectError();
})

// Disconnected from server
socket.on('disconnect', function (reason) {
	console.log("Disconnected from server due to:", reason);

	// if (reason == "transport close") {
	// 	location.reload(true);
	// }
})

// Initialize client
socket.on('joinResponse', function (data) {
	// Check if already initialized
	if (initialized) console.log("Already initialized game!");//location.reload(true);

	// Receive common world attritutes
	Object.assign(world, data.world)

	// Initalize player
	player.join(data.startPos);

	// Initialize recipes
	initRecipes();

	// Receive current server players
	players = {};
	let serverPlayers = data.serverPlayers;
	for (let id in serverPlayers) {
		if (id != socket.id) {
			players[id] = serverPlayers[id];
			if (players[id]) {
				addPlayer(players, id);
			}
		}
	}

	// Add pre-existing entities
	for (let id in data.world.entities) {
		addEntity(data.world.entities[id]);
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
	    cells: world.cells,
	};

	for (let voxelWorker of voxelWorkers) voxelWorker.postMessage(worldData);

	// Update to server tick
	tick = new Ola(data.tick);

	initialized = true;
	console.log("Successfully joined the server (" + data.info.region + ")");
})

// Load textures
socket.on('textureData', function (data) {
	if (loaded < maxLoaded) {
		//loadTextures(data);
		textureManager.loadTextures(data);
	}
})

// Update chunk
socket.on('receiveChunk', async function (data) {
	await rleWorker.postMessage(data); // Send decoding to the rleWorker
})

// Add newcoming players
socket.on('addPlayer', function (data) {
	if (!joined) return;
	// Add to players
	if (data.id != socket.id) { // Check if not own player
		players[data.id] = data;
		console.log(data);

		addPlayer(players, data.id);
	}
})

socket.on('removePlayer', function (id) {
	if (!initialized || !players[id])
		return;

	addChat({text: players[id].name + " has left the server", 
		color: "yellow",
		timer: 3000,
	});
	scene.remove(players[id].entity);
	delete players[id];
})

socket.on('knockback', function (data) {
	let lateralForce = new Vector(data.dir.x, data.dir.z);
	lateralForce.normalize();
	lateralForce.mult(data.force);
	player.knockbackVelocity.x = lateralForce.x;
	player.knockbackVelocity.y = 300;
	player.knockbackVelocity.z = lateralForce.y;
})

socket.on('punch', function (id) {
	if (id != socket.id && players && players[id]) {
		updatePlayerColor(id, new THREE.Color(1, 0.5, 0.5))
		setTimeout(function () {
			updatePlayerColor(id, new THREE.Color(1, 1, 1))
		}, 500)
	}
})

socket.on('update', async function (data) {
	await updateClient(data);
})

socket.on('messageAll', function (data) {
	addChat({
		text: data.text,
		color: data.color,
		name: data.name,
		discard: data.discard,
		timer: data.timer || 5000,
	})
})

socket.on('refresh', function () {
	location.reload(true);
})

function updateClient(data) {
	if (!joined || !initialized) return;

	// Update player
	let serverPlayers = data.serverPlayers;
	updatePlayers(serverPlayers);

	// Update blocks
	let updatedBlocks = data.updatedBlocks;
	for (let block of updatedBlocks) {
		world.setVoxel(block.x, block.y, block.z, block.t);
		updateVoxelGeometry(block.x, block.y, block.z, true); // Update if in different chunk?
	}

	// Add new entities
	let newEntities = data.newEntities;
	for (let entity of newEntities) {
		addEntity(entity);
	}

	// Update existing entities PUT THIS IN THE WORLD CLASS FUNCTION
	let updatedEntities = data.entities;
	for (let id in updatedEntities) {
		let entity = updatedEntities[id];
		if (entity.type == "item" && world.entities[id]) {
			world.entities[id].pos = entity.pos;
			if (world.entities[id].mesh.position.length() == 0) {
				world.entities[id].mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z)
			}
		}
	}

	// Update client
	if (player) {
		player.updateClient(serverPlayers[socket.id]);
	}

	tick.value = data.tick;

	if (Date.now() - lastUpdate > 500) {
		lastUpdate = Date.now();
		socket.emit('latency', data.t);
	}
}