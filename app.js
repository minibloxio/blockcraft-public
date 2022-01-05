// Server config
var config = require('./config.json');
const serverPort = process.env.PORT || config.port || 3001;

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
const httpsServer = https.createServer(options, app);
const path = require('path');
const readline = require('readline'); // Command line input
const { Server } = require("socket.io");
const io = new Server(httpsServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

// Cluster (used for multiple Node.js servers)
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

// Worker threads (used for offloading chunk generation)
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

// Import server modules
const Function = require('./modules/Function.js');
const World = require('./modules/World.js');
const GameServer = require('./modules/Server.js');
var filter = require('leo-profanity');

// Listen to server port
httpsServer.listen(serverPort, function () {
	logger.info('Started an https server on port ' + serverPort);
})

// Send CORS header
app.use(function (req, res, next) {
	res.header("Cross-Origin-Embedder-Policy", "require-corp");
	res.header("Cross-Origin-Opener-Policy", "same-origin");
	next();
});

// Serve static files
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

rl.on('line', (input) => {
	if (input === 'refresh') { // Refresh all clients
		io.emit('refresh');
	} else if (input === 'save') {
		let path = __dirname + '/saves/test.json';
		world.saveToFile(fs, io, path, logger);
		saveToLog();
	} else if (input === 'purge') {
		world.purge(); // Purge all chunks
	} else if (input) { // Message to all clients
		io.emit('messageAll', {
			name: 'Server',
			text: input,
			color: "cyan"
		});
	}
});

// Server logging
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;

const myFormat = printf(({ level, message, timestamp }) => {
	return `[${timestamp}] ${level}: ${message}`;
});

const logger = createLogger({
	transports: [
		new transports.Console({
			format: combine(
				timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
				align(),
				colorize(),
				myFormat,
			),
			level: "silly",
		}),
		new transports.File({
			filename: 'logs/server.log',
			format: combine(
				timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
				align(),
				myFormat,
			),
			level: "verbose",
		})
	]
});

// Init server
let server = new GameServer();

// Players
let players = {};

// Operators
let operators = [];

// Setup world
const world = new World();
world.init({
	blockOrder: server.blockOrder,
	itemOrder: server.itemOrder,
});

worker.postMessage({ cmd: 'seed', seed: world.seed });
worker.postMessage({ cmd: "setup", blockOrder: server.blockOrder, itemOrder: server.itemOrder });

// Load save file
let save_path = __dirname + '/saves/test.json';
fs.readFile(save_path, function (err, data) {
	if (err) {
		logger.warn("Unable to load save file from", save_path)
		logger.warn("Creating new world...")
		return;
	}

	world.loadSaveFile(data, worker, logger);

})

// Worker process
worker.on('message', (data) => {
	let { socketId, chunks } = data;

	let receivedChunks = [];

	for (let chunk of chunks) {
		receivedChunks.push({
			pos: chunk,
			cell: world.encodeCell(chunk.x, chunk.y, chunk.z),
			cellSize: world.cellSize,
		})
	}
	io.to(socketId).emit('receiveChunk', receivedChunks);
})

// Get date
let date = new Date();
function getDate() {
	return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}

// Server logging
let log_path = __dirname + '/logs/server.json';
let sessions = {};
fs.readFile(log_path, function (err, data) {
	if (err) {
		logger.warn("Unable to load log file from " + log_path)
		logger.warn("Creating new log...")
		return;
	}
	sessions = JSON.parse(data);
})

function saveToLog() {
	let data = JSON.stringify(sessions);
	fs.writeFile(log_path, data, function (err) {
		if (err) throw err;
	});
}

function addLog(id, stat, value) {
	if (sessions[id] === undefined) {
		sessions[id] = {
			d: getDate(), // Date
			s: {}
		}
	}

	if (sessions[id].s[stat] === undefined) {
		sessions[id].s[stat] = value || 0;
	}
	if (Number.isInteger(sessions[id].s[stat])) sessions[id].s[stat]++;
}

// Server-client connection architecture
io.on('connection', function (socket_) {
	let socket = socket_;
	var address = socket.client.request.headers['cf-connecting-ip'] || socket.client.request.headers['x-real-ip'] || socket.client.request.headers['host'];

	// Session info request (server)
	socket.on('sessionInfoRequest', function (data) {
		socket.emit('sessionInfo', JSON.stringify(sessions));
	});

	// Server info request
	socket.on('serverInfoRequest', function (data) {
		let playerInfo = {};
		for (let id in players) {
			playerInfo[id] = players[id].name;
		}

		let info = {
			ping: data,
			players: playerInfo,
			region: config.region,
			uptime: Date.now() - server.startTime,
			link: config.link,
		}
		socket.emit('serverInfoResponse', info);
	})

	// Transmit texture info to client
	socket.emit('textureData', server.textures);

	// Join request from the client
	socket.on('join', function (data) {
		// Set player object
		players[socket.id] = server.addPlayer(socket.id, data);

		let player = players[socket.id];

		// Log player connection
		addLog(socket.id, "ip", address);
		addLog(socket.id, "tc", Date.now()); // Time connected
		addLog(socket.id, "n", player.name);

		// Check player token
		if (data.token) {
			addLog(socket.id, 't', data.token);
		} else {
			let uniqueToken = Function.randomString(10);;
			addLog(socket.id, 't', uniqueToken);
			socket.emit('uniqueToken', uniqueToken);
		}

		saveToLog(); // Save log

		// Send update to everyone
		io.emit('addPlayer', player)
		let text = player.name + " has joined the server";
		logger.info(text)

		io.emit('messageAll', {
			text: text,
			color: "yellow"
		})

		// Determine spawn position
		let maxSpawnDistance = 32; // Maximum distance from spawn
		let randomX = Function.random(-maxSpawnDistance, maxSpawnDistance);
		let randomZ = Function.random(-maxSpawnDistance, maxSpawnDistance);

		let groundHeight = world.buildHeight * world.blockSize; // Set high so the first player can load the chunks underneath
		// Determine ground level
		if (world.buildHeight) {
			for (let i = world.buildHeight; i > 0; i--) {
				if (world.getVoxel(randomX, i, randomZ) > 0) { // Non-air block, can spawn here
					groundHeight = i * world.blockSize + 1.8; // Account for player height
					break;
				}
			}
		}

		// Send server data to client (world data, online players)
		socket.emit('joinResponse', {
			serverPlayers: players,
			world: Object.assign({}, world, { cells: {}, cellDeltas: undefined }),
			tick: world.tick,
			startPos: {
				x: randomX * world.blockSize,
				y: groundHeight,
				z: randomZ * world.blockSize
			},
			info: config,
		});
	})

	// Update player info
	socket.on('playerInfo', function (data) {
		let player = players[socket.id];
		if (!player || data.name == player.name || !data.name) return; // Player not found or name is the same

		let text = player.name + " changed their name to " + data.name;
		logger.info(text);
		io.emit('messageAll', {
			name: "Server",
			text: text,
			color: "aqua"
		});
		player.name = data.name;

		// Update log
		addLog(socket.id, "n", player.name);
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
		players[socket.id].ping.push(Date.now() - tick);
		if (players[socket.id].ping.length > 30)
			players[socket.id].ping.shift();
	})

	// World functionality
	socket.on('setBlock', function (data) {
		let player = players[socket.id];
		if (!player) return;

		let { blockSize } = world;

		// Update punching status
		if (!data.cmd) player.punching = true;
		world.setVoxel(data.x, data.y, data.z, data.t, true, true);
		world.updatedBlocks.push(data);

		// Check if block is being broken or placed
		if (data.t == 0 && player.mode == "survival") { // BLOCK MINED
			// Add block as server-side entity
			let entityId = Function.randomString(5);
			data.pos = { x: (data.x + 0.5) * blockSize - blockSize / 8, y: (data.y + 0.5) * blockSize - blockSize / 8, z: (data.z + 0.5) * blockSize - blockSize / 8 };
			data.vel = { x: Function.random(5, -5), y: blockSize * 2, z: Function.random(5, -5) };
			world.entities[entityId] = server.addEntity(entityId, data)
			world.newEntities.push(world.entities[entityId])

			addLog(socket.id, "bm"); // Block mined
		} else if (data.t > 0 && !data.cmd && player.mode == "survival") { // BLOCK PLACED
			// Remove item from toolbar
			world.removePlayerItem(player, server.blockOrder[data.t-1]);
			addLog(socket.id, "bp"); // Block placed
		}
	})

	socket.on('dropItems', function (data) {
		let player = players[socket.id];
		if (!player) return;

		let { blockSize } = world;
		let droppedItems = false;

		for (let item of data) {
			if (item.force) {
				let entityId = Function.randomString(5);
				item.vel = { x: item.dir.x * blockSize * 3, y: blockSize * 2, z: item.dir.z * blockSize * 3 };
				world.entities[entityId] = server.addEntity(entityId, item);
				world.newEntities.push(world.entities[entityId]);
				droppedItems = true;
				continue;
			}
			for (let t of player.toolbar) {
				if (!t) continue;
				if (t.v == item.v && t.class == item.class) {
					t.c = Math.max(0, t.c - item.c);

					// Add item as server-side entity
					let entityId = Function.randomString(5);
					item.vel = { x: item.dir.x * blockSize * 3, y: blockSize * 2, z: item.dir.z * blockSize * 3 };
					world.entities[entityId] = server.addEntity(entityId, item);
					world.newEntities.push(world.entities[entityId])
					droppedItems = true;
					break;
				}
			}
		}

		if (droppedItems) player.pickupDelay = Date.now() + 2000;  // Disable pickup while dropping items
	})

	// Request chunk
	socket.on('requestChunk', function (data) {
		let chunksToGenerate = [];
		let chunksToSend = [];

		// Loop through each chunk
		for (let chunk of data) {
			let id = `${chunk.x},${chunk.y},${chunk.z}`
			let cell = world.cells[id];
			if (!cell) {

				let cellSizeCubed = Math.pow(world.cellSize, 3);
				world.cells[id] = new Uint8Array(new SharedArrayBuffer(cellSizeCubed));

				let data = {
					id: id,
					chunk: chunk,
					cell: world.cells[id],
					cellDelta: world.cellDeltas[id],
				}

				if (!world.cellDeltas[id]) {
					world.cellDeltas[id] = new Uint8Array(new SharedArrayBuffer(cellSizeCubed));
					data.cellDelta = world.cellDeltas[id];
				} else {
                    data.cellExists = true;
                }

				chunksToGenerate.push(data);
			}
			else {
				chunksToSend.push({
					pos: chunk,
					cell: world.encodeCell(chunk.x, chunk.y, chunk.z),
				})
			}
		}

		worker.postMessage({ cmd: "generateChunks", socketId: socket.id, chunkData: chunksToGenerate });

		socket.emit('receiveChunk', chunksToSend);

		addLog(socket.id, "cr"); // Chunk request
	})

	// Update player inventory
	socket.on('updateInventory', function (data) {
		let player = players[socket.id];
		if (!player) return;
		player.toolbar = data;
	})

	// Player interactivity
	socket.on('respawn', function () {
		let player = players[socket.id];
		if (!player) return;

		if (player) {
			player.hp = 10;
			player.dead = false;
		}

		addLog(socket.id, "r"); // Respawn
	})

	// Receive player punch event
	socket.on('punchPlayer', function (data) {
		let player = players[socket.id];
		if (!player) return;

		if (players[data.id] && player && !player.dead && players[data.id].mode == "survival") {
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

			players[data.id].hp -= data.crit ? dmg * 1.5 : dmg;
			players[data.id].dmgType = player.name;
			io.to(`${data.id}`).emit('knockback', data)
			io.volatile.emit('punch', data.id);
		}
	})

	// Take player damage if in survival mode
	socket.on('takeDamage', function (data) {
		let player = players[socket.id];
		if (!player) return;

		if (player.mode == "survival") {
			player.hp -= data.dmg;
			player.dmgType = data.type;
		}
	})

	// Throw item
	socket.on('throwItem', function (data) {
		let player = players[socket.id];
		if (!player) return;

		let { blockSize } = world;
		player.pickupDelay = Date.now() + 1000;  // Disable pickup while dropping items

		world.removePlayerItem(player, data.name);

		let entityId = Function.randomString(5);
		let force = blockSize * 30;
		let entity = server.addEntity(entityId, {
			pos: data.pos || { x: player.pos.x, y: player.pos.y, z: player.pos.z },
			vel: { x: data.dir.x * force, y: data.dir.y * force, z: data.dir.z * force },
			name: data.name,
			v: world.itemId[data.name],
			class: "item",
			playerId: socket.id,
		})
		world.entities[entityId] = entity;
		world.newEntities.push(entity)
	})

	// Fire server-side arrow
	socket.on('fireArrow', function (data) {
		let player = players[socket.id];
		if (!player) return;

		let { blockSize } = world;
		player.pickupDelay = Date.now() + 1000;  // Disable pickup while dropping items

		world.removePlayerItem(player, "arrow");

		let entityId = Function.randomString(5);
		let force = blockSize * 10 * data.force;
		let entity = server.addEntity(entityId, {
			pos: data.pos, 
			vel: { x: data.dir.x * force, y: data.dir.y * force, z: data.dir.z * force }, 
			force: data.force, 
			lethal: true,
			v: world.itemId["arrow"],
			class: "item",
			playerId: socket.id,
            name: "arrow",
		})
		world.entities[entityId] = entity;
		world.newEntities.push(entity)
	})

	// Chat
	socket.on('message', function (data) {
		let player = players[socket.id];
		if (!player) return;

		logger.verbose("<" + player.name + "> " + data)
		io.emit('messageAll', {
			name: player.name,
			text: filter.clean(data),
		});

		addLog(socket.id, "ms"); // Messages sent
	})

	socket.on('messagePlayer', function (data) {
		let player = players[socket.id];
		if (!player) return;

		logger.verbose("<" + player.name + " whispers to " + players[data.id].name + "> " + data)
		io.to(`${data.id}`).emit('message', {
			type: "whisper",
			id: socket.id,
			name: player.name + " whispers to you",
			text: filter.clean(data.text),
			color: "grey",
		});

		addLog(socket.id, "ms");
	})

	socket.on('replyPlayer', function (data) {
		let player = players[socket.id];
		if (!player) return;

		logger.verbose("<" + player.name + " replies to " + players[data.id].name + "> " + data)
		io.to(`${data.id}`).emit('message', {
			type: "whisper",
			id: socket.id,
			name: player.name + " replies to you",
			text: filter.clean(data.text),
			color: "grey",
		});

		addLog(socket.id, "ms");
	})

	// COMMANDS

	// Set the time of day
	socket.on('settime', function (data) {
		let text = "<" + players[socket.id].name + "> set the time to " + data;
		logger.info(text)
		world.tick = data;
	})

	// Clear inventory
	socket.on('clearInventory', function (data) {
		if (!players[socket.id]) return;
		players[socket.id].toolbar = [];
	})

	// Clear hand
	socket.on('clearHand', function (data) {
		if (!players[socket.id]) return;
		players[socket.id].toolbar[data] = null;
	})

	// Give player item
	socket.on('giveItem', function (data) {
		if (!players[socket.id]) return;
		World.addItem(players[socket.id], data);
	})

	// Set player's operater status
	socket.on('setOperator', function (data) {
		if (!players[socket.id]) return;

		let password = config.operatorPassword;
		if (data.password == password && players[data.id].operator != data.isOp) {
			players[data.id].operator = data.isOp;
			io.emit('messageAll', {
				name: "Server",
				text: (data.isOp ? "Enabled" : "Disabled") + " operator status for " + players[data.id].name,
				color: "aqua"
			});
		} else if (data.password != password) {
			socket.emit('message', {
				name: "Server",
				text: "Incorrect password",
				color: "aqua"
			});
		} else if (players[data.id].operator == data.isOp) {
			socket.emit('message', {
				name: "Server",
				text: players[data.id].name + " is already " + (data.isOp ? "enabled" : "disabled") + " operator status",
				color: "aqua"
			});
		}
	})

	// Kick player from server
	socket.on('kickPlayer', function (data) {
		if (!players[socket.id]) return;

		if (players[socket.id].operator) {
			io.emit('messageAll', {
				name: "Server",
				text: "Kicked " + players[data.id].name + " from the server due to: " + data.reason,
				color: "aqua"
			});
			io.to(`${data.id}`).emit('kick', data.reason);
			io.to(`${data.id}`).disconnectSockets();
		} else {
			socket.emit('message', {
				name: "Server",
				text: "You do not have operator status to kick players",
				color: "aqua"
			});
		}
	})

	// Kill player
	socket.on('killPlayer', function (data) {
		if (!players[socket.id]) return;

		if (players[socket.id].operator) {
			io.emit('messageAll', {
				name: "Server",
				text: "Killed " + players[data.id].name,
				color: "aqua"
			});
			io.to(`${data.id}`).emit('kill');
			players[data.id].hp = 0;
			players[data.id].dead = true;
		} else {
			socket.emit('message', {
				name: "Server",
				text: "You do not have operator status to kill players",
				color: "aqua"
			});
		}
	})

    // Kill all players
    socket.on('killPlayers', function (data) {
        if (!players[socket.id]) return;

        if (players[socket.id].operator) {
            io.emit('messageAll', {
                name: "Server",
                text: "Killed all players",
                color: "aqua"
            });
            for (let id in players) {
                io.to(`${id}`).emit('kill');
                players[id].hp = 0;
                players[id].dead = true;
            }
        } else {
            socket.emit('message', {
                name: "Server",
                text: "You do not have operator status to kill players",
                color: "aqua"
            });
        }
    })

    // Kill entities
    socket.on('killEntities', function () {
        if (!players[socket.id]) return;

        if (players[socket.id].operator) {
            for (let id in world.entities) {
                let type = "block";
                if (world.itemId[world.entities[id].v-1]) type = "item";
                world.removeItem(id, world.entities[id].v, type);
            }
        } else {
            socket.emit('message', {
                name: "Server",
                text: "You do not have operator status to kill entities",
                color: "aqua"
            });
        }
    })

	// DISCONNECT
	socket.on('disconnect', function () {
		if (players[socket.id] && players[socket.id].connected) {
			let text = players[socket.id].name + " has left the server";
			logger.info(text)
			addLog(socket.id, "td", Date.now());
		}
		io.emit('removePlayer', socket.id);
		delete players[socket.id];
	});
});

// Update server function
let dt = 50;
let autosaveTimer = Date.now();
let autosaveWarningFlag = true;
setInterval(function () {
	if (!world || Object.keys(players).length == 0) {
		autosaveTimer = Date.now(); // Don't autosave when nobody's online
		return;
	}

	world.tick += 1;
	// Regeneration
	if (world.tick % 100 == 0) {
		for (let id in players) {
			if (players[id].hp > 0)
				players[id].hp = Math.min(players[id].hp + 0.5, 10);
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

			logger.info(txt);

			io.emit('messageAll', {
				text: txt
			})

			addLog(id, "d"); // Deaths
		}
	}

	// Auto save
	let autosaveInterval = 1000 * 60 * 10; // 10 Minutes
	let autosaveWarning = 1000 * 10; // 10 seconds
	if (Date.now() - autosaveTimer > autosaveInterval - 1000 * 10 && autosaveWarningFlag) {
		autosaveWarningFlag = false;
		let txt = "Server will auto save in " + parseInt(autosaveWarning / 1000) + " s";
		io.emit('messageAll', {
			text: txt,
			color: "purple",
			discard: true
		})
	}

	if (Date.now() - autosaveTimer > autosaveInterval) {
		autosaveTimer = Date.now();
		autosaveWarningFlag = true;

		let path = __dirname + '/saves/test.json';
		world.saveToFile(fs, io, path, logger);
		saveToLog();
	}

	world.update(dt / 1000, players, io);

	// Send updated data to client
	io.emit('update', {
		serverPlayers: players,
		updatedBlocks: world.updatedBlocks,
		newEntities: world.newEntities,
		entities: world.entities,
		tick: world.tick,
		t: Date.now()
	})

	world.updatedBlocks = [];
	world.newEntities = [];
}, dt)

module.exports = app;