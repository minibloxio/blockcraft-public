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
	for (let id in data.world.entities) {
		addEntity(data.world.entities[id]);
	}

	// Update to server tick
	tick = new Ola(data.tick);

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
	let lateralForce = new Vector(data.dir.x, data.dir.z);
	lateralForce.normalize();
	lateralForce.mult(data.force);
	player.knockbackVelocity.x = lateralForce.x;
	player.knockbackVelocity.y = data.force;
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
			world.entities[id].pos = entity.pos
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