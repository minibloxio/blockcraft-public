// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

var scene, renderer, light, sky, stats;

var offscene;

var prevTime = performance.now();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000000000 );
var player;

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

	player = new Player(camera, blocks);
	scene.add( player.controls.getObject() );

	// Add light

	light = new Light();

	// Add chunks / terrain generation

	chunks.push(new Chunk(0, 0));

	for (var i = 0; i < chunks.length; i++) {
		chunks[i].generate();
		chunks[i].update(true);
	}

	// Skybox
    var skyGeometry = new THREE.CubeGeometry(1500, 1500, 1500);
    
    var skyMaterials = [
      // back side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }),
      // front side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }), 
      // Top side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-top.jpg'),
        side: THREE.DoubleSide
      }), 
      // Bottom side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-bottom.jpg'),
        side: THREE.DoubleSide
      }), 
      // right side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }), 
      // left side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }) 
    ];

    //add sky & materials
    var skyMaterial = new THREE.MeshFaceMaterial(skyMaterials);
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Add the renderer

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

var mouse = new THREE.Vector2();
var previousBlock = {
	object: undefined
}

var timeCost = Date.now()

var players = {};

// Initialize server players
socket.on('init', function (data) {
	for (let id in data) {
		if (id != socket.id)
			players[id] = data[id];
			if (players[id]) {
				players[id].body = new THREE.Mesh(new THREE.BoxGeometry(blockSize*0.8, blockSize*1.8, blockSize*0.8), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}));
				players[id].body.castShadow = true;
				players[id].body.receiveShadow = true;
				players[id].pos = Ola({x:0, y:0, z:0}, 50);
				players[id].rot = Ola({x:0, y:0, z:0}, 50);
				scene.add(players[id].body);
				//blocks.push(players[id].body);
			}
	}
})

// Add newcoming players
socket.on('addPlayer', function (data) {
	// Add to players
	if (data.id != socket.id) { // Check if not own player
		players[data.id] = data;

		// Add player to three.js scene
		players[data.id].body = new THREE.Mesh(new THREE.BoxGeometry(blockSize*0.8, blockSize*1.8, blockSize*0.8), new THREE.MeshStandardMaterial({
		  color: 0xf1c27d
		}));
		players[data.id].body.castShadow = true;
		players[data.id].body.receiveShadow = true;
		players[data.id].pos = Ola({x:0, y:0, z:0}, 50);
		players[data.id].rot = Ola({x:0, y:0, z:0}, 50);
		scene.add(players[data.id].body);
		//blocks.push(players[data.id].body);

		console.log("Added player", data.id)
	}
})

socket.on('removePlayer', function (id) {
	console.log("Removed player", id)
	scene.remove(players[id].body);
	delete players[id];
})

socket.on('update', function (data) {
	for (let id in players) {
		if (players[id].pos && players[id].rot) {
			players[id].pos.set({x: data[id].pos.x, y: data[id].pos.y, z: data[id].pos.z});
			players[id].rot.set({x: data[id].rot.x, y: data[id].rot.y, z: data[id].rot.z});
		}
	}
})

function animate() {
	requestAnimationFrame( animate );

	// Get the frame's delta

	var time = performance.now();
	var delta = ( time - prevTime );
	delta /= 1000;

	// Player update
	player.select(true);
	player.mine();
	player.placeBlock();
	player.checkCollision(delta);
	player.update(delta);

	// Update server players

	for (let id in players) {
		if (players[id].body) {
			players[id].body.position.set(players[id].pos.x, players[id].pos.y, players[id].pos.z);
			players[id].body.rotation.set(players[id].rot.x, players[id].rot.y, players[id].rot.z);
		}
	}

	// Emit events to server

	socket.emit('packet', {
		pos: player.position,
		rot: player.controls.getObject().rotation.toVector3()
	});

	// Scene update

	light.update();
	sky.position.set(player.position.x, player.position.y, player.position.z);
	stats.update();

	// Update chunk if necessary
	var playerPos = player.position.clone().divideScalar(blockSize*blockSize)
	for (var i = 0; i < chunks.length; i++) {
		chunks[i].update(false, player);
	}

	prevTime = time;

	renderer.render( scene, camera );

	//console.log(Date.now()-timeCost)
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