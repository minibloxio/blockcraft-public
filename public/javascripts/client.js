// Initialize server
let initialized = false;
socket.on('init', function (data) {
	// Check if already initialized
	if (initialized)
		location.reload(true);

	// Receive common world attritutes
	Object.assign(world, data.world)

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
	var newEntities = data.entities;
	for (let id in newEntities) {
		let entity = newEntities[id];
		addEntity(entity);
	}

	// Update light
	if (light) {
		light.t = data.tick * light.daySpeed;
	}

	initialized = true;
})

// Update chunk



socket.on('receiveChunk', function (data) {
	for (let chunk of data) {
		rleWorker.postMessage(chunk); // Send decoding to the rleWorker
	}
})

rleWorker.addEventListener('message', e => {
	let chunk = e.data;

	world.cells[`${chunk.pos.x},${chunk.pos.y},${chunk.pos.z}`] = chunk.cell;

  	//updateCellGeometry(chunk.pos.x*cellSize, chunk.pos.y*cellSize, chunk.pos.z*cellSize);
	player.chunksToLoad.push(chunk.pos)
})

// Add newcoming players
socket.on('addPlayer', function (data) {
	// Add to players
	if (data.id != socket.id) { // Check if not own player1``
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
	player.knockbackVelocity.x = data.x*100;
	player.knockbackVelocity.y = 200;
	player.knockbackVelocity.z = data.z*100;
})

socket.on('update', function (data) {
	if (!initialized)
		return;
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
		if (entity.type == "item") {
			world.entities[id].mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
		}
	}

	// Update client
	if (player) {
		player.updateClient(serverPlayers[socket.id]);
	}

	if (light) {
		light.t = data.tick * light.daySpeed;
	}
})

socket.on('messageAll', function (data) {
	addChat({
		text: data.text,
		color: data.color,
		name: data.name
	})
})

socket.on('refresh', function () {
	location.reload(true);
})

// Handle disconnection
window.onbeforeunload = function () {
    socket.emit('disconnect')
};