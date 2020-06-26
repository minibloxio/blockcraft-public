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

// Add local modules
var Vector = require('./modules/Vector.js');
var Function = require('./modules/Function.js');
var Ball = require('./modules/Ball.js');

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
  	if (input === 'refresh') {
  		resetTable();
  		io.emit('refresh');
  	} else if (input.split(" ")[0] === "ban") {
  		console.log(input.split(" ")[1])
  	}
});

// Send client refresh
io.emit('refresh', '');
io.emit('console', 'The game has updated, please hard refresh the code using ctrl-f5 to continue playing the game.')

// Setup server
var players = {};

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
	socket.emit('init', players);

	console.log(socket.id.substr(0, 5), "has joined")

	socket.on('packet', function (data) {
		players[socket.id].pos = data.pos;
		players[socket.id].rot = data.rot;
	})

	socket.on('disconnect', function () {
		console.log(socket.id.substr(0, 5), "has left")
		io.emit('removePlayer', socket.id);
		delete players[socket.id];
	});

});

setInterval(function () {
	io.emit('update', players)
}, 50)

module.exports = app;
