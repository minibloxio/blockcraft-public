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
var players = {};

class Map {
	constructor() {
		this.size= 8;
		this.height = 8;
		this.blockSize = 16;
		this.world = {x: 0, y: 0, z: 0}
		this.map = [];
		this.matrix = [];

		// Create map
		for (var x = 0; x < this.size; x++) {
			this.map.push([])
			for (var z = 0; z < this.size; z++) {
				this.map[x].push([])
			}
		}

		// Create matrix
		for (var x = 0; x < this.size; x++) {
			this.matrix.push([])
			
			for (var z = 0; z < this.size; z++) {
				this.matrix[x].push([])
				for (var y = 0; y < this.height; y++) {
					this.matrix[x][z].push([])
				}
			}
			
		}
		
		// Terrain generation
		for(var i=0;i<this.size;i++) {
			for(var j=0;j<this.size;j++) {
				let height = Math.floor(((simplex.noise2D(i/100, j/100)+1)/2)*this.height);
				this.map[i][j] = height;
			}
		}

		// Generate map
		for (var x = 0; x < this.matrix.length; x++) {
			for (var z = 0; z < this.matrix[x].length; z++) {
				for (var y = 0; y < this.height; y++) {
					if (y == 0) {
						this.matrix[x][z][y] = "bedrock";
					} else if (y == this.map[x][z]) {
						this.matrix[x][z][y] = "grass";	
					} else if (y < this.map[x][z] && y > this.map[x][z]-2) {
						this.matrix[x][z][y] = "dirt";
					} else if (y <= this.map[x][z]-2) {
						this.matrix[x][z][y] = "stone";
					} else {
						this.matrix[x][z][y] = "air";
					}
				}
			}
		}
	}

	isValid(pos) {
		if (this.matrix[pos.x] && this.matrix[pos.x][pos.z] && this.matrix[pos.x][pos.z][pos.y])
			return true;
	}
}

var map = new Map();

var minedBlocks = [];
var placedBlocks = [];

// Server-client connection architecture
io.on('connection', function(socket_) {
	let socket = socket_;
	players[socket.id] = {
		id: socket.id,
		pos: {
			x: 0,
			y: 0,
			z: 0
		},
		rot: {
			x: 0,
			y: 0,
			z: 0
		}
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
