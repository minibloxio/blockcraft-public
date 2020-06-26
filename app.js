// Initialize server variables
const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const options = {
	key: fs.readFileSync('./cert/ia.key'),
	cert: fs.readFileSync('./cert/server.crt'),
	ca: fs.readFileSync('./cert/ca.crt')
}

// Create HTTPS server
const server = https.createServer(options, app);
const path = require('path');
const readline = require('readline'); // Command line input
const io = require('socket.io')(server);
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const Vector = require('./modules/Vector.js');
const Function = require('./modules/Function.js');
const World = require('./modules/World.js');

const SimplexNoise = require('simplex-noise'),
    simplex = new SimplexNoise(Math.random)

// Create port
const serverPort = process.env.PORT || 3001;
server.listen(serverPort, function () {
	console.log('Started an https server on port ' + serverPort);
})
const public = __dirname + '/public/';
app.use(express.static(path.join(__dirname, 'public')));
app.use('/*', function (req, res, next) {
	res.redirect('/')
	next()
})

// Server input commands

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Commmand line input
rl.on('line', (input) => {
  	if (input === 'refresh') { // Refresh all clients
  		io.emit('refresh');
  	}
});

// Setup server
var blockSize = 16;
var players = {
	/*"test": {
		id: "test",
		name: "Herobrine",
		pos: {x: blockSize * 4,y: blockSize * 50,z: blockSize * 4},
		rot: {x: 0,y: 0,z: 0},
		dir: {x: 0,y: 0,z: 0},
		hp: 10,
		walking: true,
		punching: true
	}*/
};

const cellSize = 8;
const tileSize = 16;
const tileTextureWidth = 80;
const tileTextureHeight = 64;
const world = new World({
	cellSize,
	tileSize,
	tileTextureWidth,
	tileTextureHeight,
});

var updatedBlocks = [];
var newEntities = [];

var punches = [];

// Server-client connection architecture
io.on('connection', function(socket_) {
	let socket = socket_;
	players[socket.id] = {
		id: socket.id,
		name: "Player"+Math.floor(Math.random()*9999),
		pos: {x: 0,y: 0,z: 0},
		vel: {x: 0,y: 0,z: 0},
		rot: {x: 0,y: 0,z: 0},
		dir: {x: 0,y: 0,z: 0},
		hp: 10,
		toolbar: [],
		walking: false,
		punching: false,
		pickupDelay: Date.now()
	}
	socket.on('join', function () {
		io.emit('addPlayer', players[socket.id])
		console.log(socket.id.substr(0, 5), "has joined at", new Date().toLocaleTimeString())

		// Send initialization data to client (world data, online players)
		socket.emit('init', {
			serverPlayers: players,
			serverMap: world.cells,
			worldSeed: world.seed,
			entities: world.entities,
			tick: tick
		});
	})

	// Update player info
	socket.on('playerInfo', function (data) {
		if (players[socket.id] && data.name != players[socket.id].name && data.name) { // Check for validity
			io.emit('messageAll', {
				text: players[socket.id].name + " changed their name to " + data.name,
				color: "yellow"
			});
			players[socket.id].name = data.name;
		}
	})

	// Receive packet from the client
	socket.on('packet', function (data) {
		if (!players[socket.id])
			return;

		players[socket.id].pos = data.pos;
		players[socket.id].vel = data.vel;
		players[socket.id].onObject = data.onObject;
		players[socket.id].rot = data.rot;
		players[socket.id].dir = data.dir;
		players[socket.id].walking = data.walking;
		players[socket.id].punching = data.punching;
	})

	socket.on('updateInventory', function (data) {
		if (!players[socket.id])
			return;

		players[socket.id].toolbar = data;
	})

	// Player interactivity
	socket.on('respawn', function (data) {
		if (players[socket.id])
			players[socket.id].hp = 10;
	})

	socket.on('punchPlayer', function (data) {
		if (players[data.id]) {
			players[data.id].hp -= 0.5;
			io.to(`${data.id}`).emit('knockback', data.dir)
		}
	})

	// World functionality
	socket.on('setBlock', function (data) {
		// Update server world
		players[socket.id].punching = true;
		world.setVoxel(data.x, data.y, data.z, data.t, true, true);
		updatedBlocks.push(data);

		// Add item entity if block is mined
		if (data.t == 0) {
			let entityId = Function.randomString(5);
			let entity = {
				pos: {x: (data.x+0.5)*blockSize-blockSize/8, y: (data.y+0.5)*blockSize-blockSize/8, z: (data.z+0.5)*blockSize-blockSize/8},
				vel: {x: Function.random(2, -2), y: blockSize*2, z: Function.random(2, -2)},
				acc: {x: 0, y: 0, z: 0},
				type: "item",
				v: data.v,
				id: entityId
			}
			world.entities[entityId] = entity;
			newEntities.push(entity)
		} else if (data.t > 0) { // Remove from player inventory if block is placed
			for (let t of players[socket.id].toolbar) {
				if (!t)
					continue;
				if (t.v == data.t) {
					t.c = Math.max(0, t.c-1);
				}		
			}
		}
	})

	socket.on('dropItem', function (data) {
		players[socket.id].pickupDelay = Date.now() + 2000;  // Disable pickup while dropping items
		for (let t of players[socket.id].toolbar) {
			if (!t)
				continue;
			if (t.v == data.v) {
				t.c = Math.max(0, t.c-1);

				let entityId = Function.randomString(5);
				let entity = {
					pos: {x: data.x, y: data.y, z: data.z},
					vel: {x: data.dir.x*blockSize*3, y: blockSize*2, z: data.dir.z*blockSize*3},
					acc: {x: 0, y: 0, z: 0},
					type: "item",
					v: data.v,
					id: entityId,
					t: Date.now()
				}
				world.entities[entityId] = entity;
				newEntities.push(entity)

				break;
			}
		}
	})

	socket.on('requestChunk', function (data) {
		let receivedChunks = [];
		for (let chunk of data) {
			if (chunk) {
				world.generateCell(chunk.x, chunk.y, chunk.z);
				receivedChunks.push({
					pos: chunk,
					cell: world.encodeCell(chunk.x*cellSize, chunk.y*cellSize, chunk.z*cellSize)
				})
			}
		}
		socket.emit('receiveChunk', receivedChunks);
	})

	// Chat
	socket.on('message', function (data) {
		if (players[socket.id]) {
			io.emit('messageAll', {
				name: players[socket.id].name,
				text: data
			});
		}
	})

	socket.on('disconnect', function () {
		console.log(socket.id.substr(0, 5), "has left at", new Date().toLocaleTimeString())
		io.emit('removePlayer', socket.id);
		delete players[socket.id];
	});
});

// Update server function
var tick = -1000;
let dt = 50;
setInterval(function () {
	tick += 1;
	// Regeneration
	if (tick % 100 == 0) {
		for (let id in players) {
			if (players[id].hp > 0)
				players[id].hp = Math.min(players[id].hp+0.5, 10);
		}
	}

	world.update(dt/1000, players, newEntities);

	// Send updated data to client
	io.emit('update', {
		serverPlayers: players,
		updatedBlocks: updatedBlocks,
		newEntities: newEntities,
		entities: world.entities,
		tick: tick
	})

	updatedBlocks = [];
	newEntities = [];
}, dt)

module.exports = app;
