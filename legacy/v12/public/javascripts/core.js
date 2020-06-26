// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

// Three.js
var scene, renderer, light, sky, stats;
var offscene;

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

	/*// Add chunk lines

	let line_group = new THREE.Group();
	for (let x = -5; x <= 5; x++) {
		for (let z = -5; z <= 5; z++) {
			var line_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
			var points = [];
			points.push( new THREE.Vector3( x*blockSize*cellSize, 0, z*blockSize*cellSize ) );
			points.push( new THREE.Vector3( x*blockSize*cellSize, blockSize*cellSize*10, z*blockSize*cellSize ) );

			var line_geometry = new THREE.BufferGeometry().setFromPoints( points );
			var line = new THREE.Line( line_geometry, line_material );

			line_group.add(line);
		}
	}
	for (let x = -5; x <= 5; x++) {
		for (let z = -5; z <= 5; z++) {
			for (let y = 0; y <= 10; y++) {
				var line_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
				var points = [];
				points.push( new THREE.Vector3( x*blockSize*cellSize, blockSize*cellSize*y, z*blockSize*cellSize ) );
				points.push( new THREE.Vector3( (x+1)*blockSize*cellSize, blockSize*cellSize*y, (z)*blockSize*cellSize ) );

				var line_geometry = new THREE.BufferGeometry().setFromPoints( points );
				var line = new THREE.Line( line_geometry, line_material );

				line_group.add(line);

				var points = [];
				points.push( new THREE.Vector3( x*blockSize*cellSize, blockSize*cellSize*y, z*blockSize*cellSize ) );
				points.push( new THREE.Vector3( (x)*blockSize*cellSize, blockSize*cellSize*y, (z+1)*blockSize*cellSize ) );

				var line_geometry = new THREE.BufferGeometry().setFromPoints( points );
				var line = new THREE.Line( line_geometry, line_material );

				line_group.add(line);
			}
		}
	}

	scene.add(line_group)*/

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
}

// Initialize server
let initialized = false;
socket.on('init', function (data) {
	// Check if already initialized
	/*if (initialized)
		location.reload(true);*/

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

	noise = new SimplexNoise(data.worldSeed);
	world.seed = data.worldSeed;

	// Add world loaded from server

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

	addChat({text: players[id].name + " has left the server", 
		color: "yellow"
	});
	scene.remove(players[id].entity);
	offscene.remove(players[id].entity);
	delete players[id];
})

socket.on('update', function (data) {
	// Update player
	var serverPlayers = data.serverPlayers
	for (let id in players) {
		let p = players[id];
		if (p.pos && p.rot) {
			// Set new player location
			p.pos.set({x: serverPlayers[id].pos.x, y: serverPlayers[id].pos.y, z: serverPlayers[id].pos.z});
			p.rot.set({x: serverPlayers[id].rot.x, y: serverPlayers[id].rot.y, z: serverPlayers[id].rot.z});
			p.dir.set({x: serverPlayers[id].dir.x, y: serverPlayers[id].dir.y, z: serverPlayers[id].dir.z});

			// Update player data
			p.hp = serverPlayers[id].hp;
			if (p.hp <= 0 && p.entity.visible) {
				p.entity.visible = false;
				addChat({
					text: p.name + " was slain"
				})
			} else if (p.hp > 0) {
				p.entity.visible = true;
			}

			// Update animations
			p.walking = serverPlayers[id].walking;
			p.punching = serverPlayers[id].punching;

			// Update player name if necessary (performance intensive)
			if (p.name != serverPlayers[id].name) {
				p.name = serverPlayers[id].name;

				p.entity.remove(p.nameTag)

				var name_geometry = new THREE.TextGeometry( p.name, {
					font: minecraft_font,
					size: 3,
					height: 0.5
				} );
				name_geometry.center();

				p.nameTag = new THREE.Mesh(name_geometry, new THREE.MeshBasicMaterial({color: 0xeeeeee}));
				p.nameTag.castShadow = true;
				p.nameTag.position.y += blockSize*3/4
				p.entity.add(p.nameTag);
			}
		}
	}

	// Update blocks
	var updatedBlocks = data.updatedBlocks;
	for (let block of updatedBlocks) {
		world.setVoxel(block.x, block.y, block.z, block.t);
		updateVoxelGeometry(block.x, block.y, block.z);
	}

	// Add new entities
	var newEntities = data.newEntities;
	for (let entity of newEntities) {
		if (entity.type == "item") {
			let uvVoxel = entity.v-1;
			var item_geometry = new THREE.BufferGeometry();
		    const {positions, normals, uvs, indices} = world.generateGeometryDataForItem(uvVoxel);
		    const positionNumComponents = 3;
			item_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
			const normalNumComponents = 3;
			item_geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
			const uvNumComponents = 2;
			item_geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
			item_geometry.setIndex(indices);
			item_geometry.computeBoundingSphere();
			var item_mesh = new THREE.Mesh(item_geometry, material);
			item_mesh.name = "item"
			item_mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);

			world.entities[entity.id] = entity;
			world.entities[entity.id].mesh = item_mesh;

			scene.add(world.entities[entity.id].mesh);
		} else if (entity.type == "remove_item") {

			world.entities[entity.id].mesh.geometry.dispose();
			world.entities[entity.id].mesh.material.dispose();
			scene.remove(world.entities[entity.id].mesh);
			delete world.entities[entity.id];
		}
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
	if (serverPlayers[socket.id].hp > player.hp) {
		heartUp = true;
	}
	player.hp = serverPlayers[socket.id].hp;
	if (player.hp <= 0) { // Add client death message

	}

	player.toolbar = serverPlayers[socket.id].toolbar;
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

	// Player update
	if (player.hp > 0 && initialized) {
		player.select(true);
		player.mine();
		player.placeBlock();
		player.checkCollision(delta);
		player.update(delta);
		player.updateChunks(world);
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