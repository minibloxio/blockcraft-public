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

const colors = require('colors');

// Create portf
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
  	} else if (input === 'save') {
  		let path =  __dirname + '/saves/test.json';
  		world.saveToFile(fs, io, path);
  	} else if (input) {
  		io.emit('messageAll', {
			text: "[Server] " + input,
			color: "cyan"
		});
  	}
});



// Get textures
let blockOrder = ["water", "bedrock", "stone", "cobblestone", "dirt", "cobblestone", "grass", "wood", "leaves", "coal_ore", "diamond_ore", "iron_ore", "gold_ore", "crafting_table", "planks", "snow", "snowy_grass", "ice", "ice_packed", "sand", "sandstone", "clay", "gravel", "obsidian", "glowstone", "glass"];

let itemOrder = ["stick", "wood_sword", "wood_pickaxe", "wood_axe", "wood_shovel", "bow", "arrow", "diamond"];

let textures = {};
fs.readdir(public + '/textures/blocks', function (err, data) {
	textures["blocks"] = data;
})
fs.readdir(public + '/textures/items', function (err, data) {
	textures["items"] = data;
})
textures.blockOrder = blockOrder;
textures.itemOrder = itemOrder;

// Setup world
var players = {};

const cellSize = 16;
const tileSize = 16;
const tileTextureWidth = 512;
const tileTextureHeight = 64;
const buildHeight = 128;
const world = new World({
	cellSize,
	tileSize,
	tileTextureWidth,
	tileTextureHeight,
	buildHeight,
	blockOrder,
	itemOrder,
});
var updatedBlocks = [];
var newEntities = [];

// Load save file
let save_path = __dirname + '/saves/test.json';
fs.readFile(save_path, function (err, data) {
	if (err) {
		console.log("Unable to load save file from", save_path)
		console.log("Creating new world...")
		return;
	}

	let saveFile = JSON.parse(data)
	world.loadSaveFile(saveFile)

  	console.log("Done loading world at", new Date())
})

function pick(obj,props){if(!obj||!props)return;var picked={};props.forEach(function(prop){picked[prop]=obj[prop]});return picked};

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
		dead: false,
		toolbar: [{v: 2, c: 1, class: "item"}, {v: 3, c: 1, class: "item"}, {v: 4, c: 1, class: "item"}, {v: 5, c: 1, class: "item"}, {v: 6, c: 1, class: "item"}, {v: 7, c: 64, class: "item"}],
		walking: false,
		punching: false,
		currSlot: 0,
		pickupDelay: Date.now(),
		ping: [],
	}

	socket.on('join', function (data) {
		// Set name

		io.emit('addPlayer', players[socket.id])
		let text = players[socket.id].name + " has joined at " + new Date().toLocaleTimeString();
		console.log(text.yellow)

		// Send initialization data to client (world data, online players)
		socket.emit('init', {
			serverPlayers: players,
			world: Object.assign({}, world, {cells: {}, cellDeltas: undefined}),
			tick: world.tick,
		});
	})

	// Save world to file
	socket.on('save', function (data) {
		let filename = data || 'test.json'
		let path =  __dirname + '/saves/' + filename;
  		world.saveToFile(fs, io, path);
	})

	// Transmit texture info to client
	socket.emit('textureData', textures);

	// Update player info
	socket.on('playerInfo', function (data) {
		if (players[socket.id] && data.name != players[socket.id].name && data.name) { // Check for validity
			let text = players[socket.id].name + " changed their name to " + data.name
			console.log(text.yellow)
			io.emit('messageAll', {
				text: text,
				color: "yellow"
			});
			players[socket.id].name = data.name;
		}
	})

	// Receive packet from the client
	socket.on('packet', function (data) {
		if (!players[socket.id])
			return;

		// Update player data
		Object.assign(players[socket.id], data)
	})

	// Receive latency check
	socket.on('latency', function (tick) {
		if (!players[socket.id])
			return;

		// Update ping
		players[socket.id].ping.push(Date.now()-tick);
		if (players[socket.id].ping.length > 30)
			players[socket.id].ping.shift();
	})

	socket.on('updateInventory', function (data) {
		if (!players[socket.id])
			return;

		players[socket.id].toolbar = data;
	})

	// Player interactivity
	socket.on('respawn', function (data) {
		if (players[socket.id]) {
			players[socket.id].hp = 10;
			players[socket.id].dead = false;
		}
	})

	socket.on('punchPlayer', function (data) {
		if (players[data.id] && players[socket.id] && !players[socket.id].dead && players[data.id].mode == "survival") {
			let dmg = 0.5;

			let entity = data.curr;

			if (entity && entity.class == "item" && world.itemId["wood_sword"]) {
				dmg = 1.5;
			}

			// Check if blocking
			if (players[data.id].blocking) {
				dmg /= 2;
				data.force /= 2;
			}

			players[data.id].hp -= data.crit ? dmg*1.5 : dmg;
			players[data.id].dmgType = players[socket.id].name;
			io.to(`${data.id}`).emit('knockback', data)
			io.emit('punch', data.id);
		}
	})

	socket.on('takeDamage', function (data) {
		if (players[socket.id] && players[socket.id].mode == "survival") {
			players[socket.id].hp -= data.dmg;
			players[socket.id].dmgType = data.type;
		}
	})

	socket.on('fireArrow', function (data) {
		let {blockSize} = world;
		players[socket.id].pickupDelay = Date.now() + 2000;  // Disable pickup while dropping items

		for (let t of players[socket.id].toolbar) {
			if (t && t.v == world.itemId["arrow"] && t.c > 0) {
				t.c = Math.max(0, t.c-1);
				break;
			}
		}

		let entityId = Function.randomString(5);
		let force = blockSize*10*data.force;
		let entity = {
			pos: {x: data.x, y: data.y, z: data.z},
			vel: {x: data.dir.x*force, y: data.dir.y*force, z: data.dir.z*force},
			acc: {x: 0, y: 0, z: 0},
			force: data.force,
			lethal: true,
			type: "item",
			v: world.itemId["arrow"],
			class: "item",
			id: entityId,
			playerId: data.id,
			t: Date.now(),
			onObject: false
		}
		world.entities[entityId] = entity;
		newEntities.push(entity)
	})

	// World functionality
	socket.on('setBlock', function (data) {
		let {blockSize} = world;
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
				class: "block",
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
		let {blockSize} = world;
		players[socket.id].pickupDelay = Date.now() + 2000;  // Disable pickup while dropping items
		for (let t of players[socket.id].toolbar) {
			if (!t)
				continue;
			if (t.v == data.v && t.class == data.class) {
				t.c = Math.max(0, t.c-1);

				let entityId = Function.randomString(5);
				let entity = {
					pos: {x: data.x, y: data.y, z: data.z},
					vel: {x: data.dir.x*blockSize*3, y: blockSize*2, z: data.dir.z*blockSize*3},
					acc: {x: 0, y: 0, z: 0},
					type: "item",
					class: data.class,
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

	// Request chunk
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
			console.log("<"+players[socket.id].name+"> " + data)
			io.emit('messageAll', {
				name: players[socket.id].name,
				text: data
			});
		}
	})

	// Commands
	socket.on('settime', function (data) {
		let text = "Time has been set to " + data;
		console.log(text.green)
		world.tick = data;
	})

	socket.on('disconnect', function () {
		let text = players[socket.id].name + " has left at " + new Date().toLocaleTimeString();
		console.log(text.yellow)
		io.emit('removePlayer', socket.id);
		delete players[socket.id];
	});
});

// Update server function
let dt = 50;
let autoSave = Date.now();
setInterval(function () {
	if (!world || Object.keys(players).length == 0) 
		return;

	world.tick += 1;
	// Regeneration
	if (world.tick % 100 == 0) {
		for (let id in players) {
			if (players[id].hp > 0)
				players[id].hp = Math.min(players[id].hp+0.5, 10);
		}
	}

	// Update players
	for (let id in players) {
		let player = players[id];

		if (player.hp <= 0 && !player.dead) {
			player.dead = true;
			let txt = player.name;

			if (player.dmgType == "fall")
				txt += " fell off a cliff";
			else
				txt += " was slain by " + player.dmgType

			console.log(txt);

			io.emit('messageAll', {
	            text: txt
          	})
		}
	}

	// Auto save
	if (Date.now() - autoSave > 1000 * 60 * 5) {
		autoSave = Date.now();
		let path =  __dirname + '/saves/test.json';
  		world.saveToFile(fs, io, path);
	}

	world.update(dt/1000, players, newEntities, io);

	// Send updated data to client
	io.emit('update', {
		serverPlayers: players,
		updatedBlocks: updatedBlocks,
		newEntities: newEntities,
		entities: world.entities,
		tick: world.tick,
		t: Date.now()
	})

	updatedBlocks = [];
	newEntities = [];
}, dt)

module.exports = app;