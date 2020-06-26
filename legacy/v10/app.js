// Initialize server variables
var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var options = {
	key: fs.readFileSync('./cert/ia.key'),
	cert: fs.readFileSync('./cert/server.crt'),
	ca: fs.readFileSync('./cert/ca.crt')
}

// Create HTTPS server
var server = https.createServer(options, app);
var path = require('path');
var readline = require('readline'); // Command line input
var fs = require('fs');
var io = require('socket.io')(server);

var World = require('./modules/World.js');

var SimplexNoise = require('simplex-noise'),
    simplex = new SimplexNoise(Math.random)

// Create port
var serverPort = process.env.PORT || 3001;
server.listen(serverPort, function () {
	console.log('Started an https server on port ' + serverPort);
})
var public = __dirname + '/public/';
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
	"test": {
		id: "test",
		name: "Herobrine",
		pos: {x: blockSize * 4,y: blockSize * 50,z: blockSize * 4},
		rot: {x: 0,y: 0,z: 0},
		dir: {x: 0,y: 0,z: 0},
		hp: 10,
		walking: true,
		punching: true
	}
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

var setBlocks = [];
var updatedBlocks = [];

var punches = [];

// Server-client connection architecture
io.on('connection', function(socket_) {
	let socket = socket_;
	players[socket.id] = {
		id: socket.id,
		name: "Player"+Math.floor(Math.random()*9999),
		pos: {x: 0,y: 0,z: 0},
		rot: {x: 0,y: 0,z: 0},
		dir: {x: 0,y: 0,z: 0},
		hp: 10,
		walking: false,
		punching: false
	}
	io.emit('addPlayer', players[socket.id])
	console.log(socket.id.substr(0, 5), "has joined at", new Date().toLocaleTimeString())

	// Send initialization data to client (world data, online players)
	socket.emit('init', {
		serverPlayers: players,
		serverMap: world.cells,
		worldSeed: world.seed,
		setBlocks: setBlocks
	});

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
		if (players[socket.id]) {
			players[socket.id].pos = data.pos;
			players[socket.id].rot = data.rot;
			players[socket.id].dir = data.dir;
			players[socket.id].walking = data.walking;
			players[socket.id].punching = data.punching;
		}
	})

	// Player interactivity
	socket.on('respawn', function (data) {
		if (players[socket.id])
			players[socket.id].hp = 10;
	})

	socket.on('punchPlayer', function (id) {
		if (players[id]) {
			players[id].hp -= 0.5;
		}
	})

	// World functionality
	socket.on('setBlock', function (data) {
		// Update server world
		players[socket.id].punching = true;
		world.setVoxel(data.x, data.y, data.z, data.t);
		setBlocks.push(data);
		updatedBlocks.push(data);
	})

	socket.on('loadChunk', function (data) {
		let receivedChunks = [];
		for (let chunk of data) {
			world.generateCell(chunk.x, chunk.y, chunk.z);
			receivedChunks.push({
				pos: chunk,
				cell: world.encodeCell(chunk.x*cellSize, chunk.y*cellSize, chunk.z*cellSize)
			})
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
var tick = 0;
setInterval(function () {
	tick += 1;
	// Regeneration
	if (tick % 100 == 0) {
		for (let id in players) {
			if (players[id].hp > 0)
				players[id].hp = Math.min(players[id].hp+0.5, 10);
		}
	}

	// Send updated data to client
	io.emit('update', {
		serverPlayers: players,
		updatedBlocks: updatedBlocks
	})

	updatedBlocks = [];
}, 50)

module.exports = app;
