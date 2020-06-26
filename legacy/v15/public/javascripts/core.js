// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

// Three.js
var scene, renderer, light, sky, stats;
var offscene;
var loaded = 0;

// World
var blockSize = 16;
var blockGeometry = new THREE.BoxGeometry( blockSize, blockSize, blockSize );
var chunks = [];

// Stats
var prevTime = performance.now();
var statistics = [];

// Camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, blockSize*10000);
var player;

// Mouse
var mouse = new THREE.Vector2();
var previousBlock = {
	object: undefined
}

let playerDim = {
	torso: blockSize*0.5,
	torsoHeight: blockSize*0.75,
	armSize: blockSize*0.25,
	armHeight: blockSize*0.75,
	legSize: blockSize*0.25,
	legHeight: blockSize*0.75,
	headSize: blockSize*0.55,
	height: blockSize*1.8
}
var players = {};

function init() {
	console.log('Initalizing BlockCraft...')
	console.log('Socket ID:', socket.id)
	// Initialize pointer lock
	initPointerLock();
	// Setup scene
	offscene = new THREE.Scene();

	// Add the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	// Add player controls

	player = new Player(camera);
	scene.add( player.controls.getObject() );

	// Add light

	light = new Light();

    // Add statistics to record
    statistics.push(new Stat("Pos", player.position, false, 2))

    // Finalize by adding the renderer

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	document.body.appendChild( renderer.domElement );
	stats = new Stats();
	document.body.appendChild( stats.dom );

	var maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

	window.addEventListener( 'resize', onWindowResize, false );

	loaded += 1;
}

// Initialize server
let initialized = false;
socket.on('init', function (data) {
	// Check if already initialized
	if (initialized)
		location.reload(true);

	let serverPlayers = data.serverPlayers;

	// Receive current server players
	for (let id in serverPlayers) {
		if (id != socket.id) {
			players[id] = serverPlayers[id];
			if (players[id]) {
				addPlayer(players, id);
			}
		}
	}

	// Receive world seed
	noise = new SimplexNoise(data.worldSeed);
	world.seed = data.worldSeed;

	// Add pre-existing entities
	var newEntities = data.entities;
	for (let id in newEntities) {
		let entity = newEntities[id];
		addEntity(entity);
	}

	initialized = true;
})

// Update chunk
socket.on('receiveChunk', function (data) {
	for (let chunk of data) {
		world.cells[`${chunk.pos.x},${chunk.pos.y},${chunk.pos.z}`] = RLEdecode(chunk.cell);
		updateCellGeometry(chunk.pos.x*cellSize, chunk.pos.y*cellSize, chunk.pos.z*cellSize);
		player.chunksToLoad.push(chunk.pos)
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
	if (!initialized)
		return;

	addChat({text: players[id].name + " has left the server", 
		color: "yellow"
	});
	scene.remove(players[id].entity);
	offscene.remove(players[id].entity);
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

function animate() {
	requestAnimationFrame( animate );

	// Get the frame's delta
	var time = performance.now();
	var delta = ( time - prevTime );
	delta /= 1000;

	if (loaded == 2)
		$("#start-button").text("Start")

	// Player update
	if (player.hp > 0 && initialized) {
		player.update(delta, world);
	}

	// Update server players

	for (let id in players) {
		let p = players[id];
		if (p.entity) {
			updatePlayer(p);
		}
	}

	// Emit events to server

	socket.emit('packet', {
		pos: player.position,
		vel: player.velocity,
		onObject: player.onObject,
		rot: player.controls.getObject().rotation.toVector3(), // Rotation of body
		dir: camera.getWorldDirection(), // Rotation of head
		walking: (new Vector(player.velocity.x, player.velocity.z)).getMag() > 2,
		punching: player.punching
	});

	// Scene update

	light.update();
	stats.update();

	prevTime = time;

	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	var crosshairSize = 50

	var width = $("html").innerWidth()
	$("#crosshair").css("left", width/2 - crosshairSize/2)
	var height = $("html").innerHeight()
	$("#crosshair").css("top", height/2 - crosshairSize/2)

}