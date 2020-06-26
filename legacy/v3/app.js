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

var Chunk = require('./modules/Chunk.js');

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
var players = {
	"test": {
		id: "test",
		pos: {x: 0,y: 150,z: 0},
		rot: {x: 0,y: 0,z: 0},
		dir: {x: 0,y: 0,z: 0}
	}
};

var map = new Chunk();

var minedBlocks = [];
var placedBlocks = [];

var punches = [];

// Server-client connection architecture
io.on('connection', function(socket_) {
	let socket = socket_;
	players[socket.id] = {
		id: socket.id,
		pos: {x: 0,y: 0,z: 0},
		rot: {x: 0,y: 0,z: 0},
		dir: {x: 0,y: 0,z: 0}
	}
	io.emit('addPlayer', players[socket.id])



	socket.emit('init', {
		serverPlayers: players,
		serverMap: map.map,
		serverMatrix: map.matrix
	});

	console.log(socket.id.substr(0, 5), "has joined at", new Date().toLocaleTimeString())

	socket.on('packet', function (data) {
		if (players[socket.id]) {
			players[socket.id].pos = data.pos;
			players[socket.id].rot = data.rot;
			players[socket.id].dir = data.dir;
		}
	})

	socket.on('mineBlock', function (data) {
		if (map.isValid(data)) {
			map.matrix[data.x][data.z][data.y] = "air";
		}

		minedBlocks.push(data);
	})

	socket.on('placeBlock', function (data) {
		if (map.isValid(data)) {
			map.matrix[data.x][data.z][data.y] = "stone";
		} else {
			// invalid placement
		}

		placedBlocks.push(data);
	})

	socket.on('disconnect', function () {
		console.log(socket.id.substr(0, 5), "has left at", new Date().toLocaleTimeString())
		io.emit('removePlayer', socket.id);
		delete players[socket.id];
	});

});

setInterval(function () {
	io.emit('update', {
		serverPlayers: players,
		mined: minedBlocks,
		placed: placedBlocks
	})

	minedBlocks = [];
	placedBlocks = [];
}, 50)

module.exports = app;
