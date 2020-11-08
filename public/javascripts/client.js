// Initialize server
let initialized = false;
socket.on('init', function (data) {
	// Check if already initialized
	if (initialized)
		location.reload(true);

	// Receive common world attritutes
	Object.assign(world, data.world)

	// Initalize player
	player.init(world.blockSize);

	// Initialize recipes
	initRecipes();

	// Receive current server players
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

	// Update to server tick
	tick = new Ola(data.tick);

	initialized = true;
})

// Load textures
socket.on('textureData', function (data) {
	loadTextures(data);
})

// Update chunk

socket.on('receiveChunk', function (data) {
	rleWorker.postMessage(data); // Send decoding to the rleWorker
})

rleWorker.addEventListener('message', e => {
	let {cellSize} = world;

	for (let chunk of e.data) {
		let cellId = `${chunk.pos.x},${chunk.pos.y},${chunk.pos.z}`;

		world.cells[cellId] = new Uint8Array(new SharedArrayBuffer(16 * 16 * 16));
		world.cells[cellId].set(chunk.cell);

		chunk.pos.id = cellId;

		chunkManager.chunksToLoad.push(chunk.pos)
	}

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
	} 

	for (let voxelWorker of voxelWorkers) {
		voxelWorker.postMessage(worldData);
	}
})

// Add newcoming players
socket.on('addPlayer', function (data) {
	// Add to players
	if (data.id != socket.id) { // Check if not own player
		players[data.id] = data;

		addPlayer(players, data.id);
	}

	addChat({
		text: data.name + " has joined the server", 
		color:"yellow"
	});
})

socket.on('removePlayer', function (id) {
	if (!initialized || !players[id])
		return;

	addChat({text: players[id].name + " has left the server", 
		color: "yellow"
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
	if (id != socket.id && players[id]) {
		updatePlayerColor(id, new THREE.Color(1, 0.5, 0.5))
		setTimeout(function () {
			updatePlayerColor(id, new THREE.Color(1, 1, 1))
		}, 500)
	}
})

socket.on('update', function (data) {
	if (!initialized)
		return;

	let {blockSize} = world;

	// Update player
	var serverPlayers = data.serverPlayers
	updatePlayers(serverPlayers);

	// Update blocks
	var updatedBlocks = data.updatedBlocks;
	for (let block of updatedBlocks) {
		world.setVoxel(block.x, block.y, block.z, block.t);
		updateVoxelGeometry(block.x, block.y, block.z);
	}

	// Add new entities
	var newEntities = data.newEntities;
	for (let entity of newEntities) {
		addEntity(entity);
	}

	// Update existing entities PUT THIS IN THE WORLD CLASS FUNCTION
	var updatedEntities = data.entities;
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

	socket.emit('latency', data.t);
})

socket.on('messageAll', function (data) {
	addChat({
		text: data.text,
		color: data.color,
		name: data.name,
		discard: data.discard
	})
})

socket.on('refresh', function () {
	location.reload(true);
})

// Handle disconnection
window.onbeforeunload = function () {
    socket.emit('disconnect')
};