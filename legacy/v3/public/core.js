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

var players = {};

// Initialize server
let initialized = false;
socket.on('init', function (data) {
	// Check if already initialized
	if (initialized)
		location.reload(true);

	let serverPlayers = data.serverPlayers;
	let map = data.serverMap;
	let matrix = data.serverMatrix;

	// Receive current server players
	for (let id in serverPlayers) {
		if (id != socket.id) {
			players[id] = serverPlayers[id];
			if (players[id]) {
				addPlayer(players, id);
			}
		}
	}

	// Add chunks / terrain generation

	chunks.push(new Chunk());

	for (var i = 0; i < chunks.length; i++) {
		chunks[i].generate(map, matrix);
		chunks[i].update(true);
	}

	initialized = true;
})

// Add newcoming players
socket.on('addPlayer', function (data) {
	// Add to players
	if (data.id != socket.id) { // Check if not own player
		players[data.id] = data;

		addPlayer(players, data.id);
	}
})

socket.on('removePlayer', function (id) {
	console.log("Removed player", id)
	scene.remove(players[id].entity);
	delete players[id];
})

socket.on('update', function (data) {
	// Update player
	var serverPlayers = data.serverPlayers
	for (let id in players) {
		if (players[id].pos && players[id].rot) {
			// Set new player location
			players[id].pos.set({x: serverPlayers[id].pos.x, y: serverPlayers[id].pos.y, z: serverPlayers[id].pos.z});
			players[id].rot.set({x: serverPlayers[id].rot.x, y: serverPlayers[id].rot.y, z: serverPlayers[id].rot.z});
			players[id].dir.set({x: serverPlayers[id].dir.x, y: serverPlayers[id].dir.y, z: serverPlayers[id].dir.z});

			// Rotate arm????
			if (players[id].rightArm.rotation.x > Math.PI/2) {
				players[id].extendArm = false;
			} else if (players[id].rightArm.rotation.x < 0) {
				players[id].extendArm = true;
			}
			
			if (players[id].extendArm) {
				rotateAboutPoint(players[id].rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), 0.3)
				rotateAboutPoint(players[id].leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), 0.3)

				rotateAboutPoint(players[id].rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), -0.3)
				rotateAboutPoint(players[id].leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), 0.3)
			} else {
				rotateAboutPoint(players[id].rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), -0.3)
				rotateAboutPoint(players[id].leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), -0.3)

				rotateAboutPoint(players[id].rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), 0.3)
				rotateAboutPoint(players[id].leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), -0.3)
			}
		}
	}

	// Remove mined blocks
	var minedBlocks = data.mined;
	for (let pos of minedBlocks) {
		if (chunks[0].matrix[pos.x] && chunks[0].matrix[pos.x][pos.z] && chunks[0].matrix[pos.x][pos.z][pos.y]) {
			let block = chunks[0].matrix[pos.x][pos.z][pos.y];
			scene.remove(block);
			offscene.remove(block);
			chunks[0].matrix[pos.x][pos.z][pos.y] = "air";
		}	
	}

	// Add placed blocks
	var placedBlocks = data.placed;
	for (let pos of placedBlocks) {
		let block = new Block(stone, pos.x*blockSize, pos.y*blockSize, pos.z*blockSize);
		scene.add(block);
		blocks.push(block);
	}
})

socket.on('refresh', function () {
	location.reload(true);
})


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

function addPlayer(players, id) {
	// Add body
	players[id].body = new THREE.Mesh(new THREE.BoxGeometry(playerDim.torso, playerDim.torsoHeight, playerDim.legSize), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}));
	players[id].body.castShadow = true;
	players[id].body.receiveShadow = true;
	players[id].body.position.set(0, -blockSize*0.45, 0);

	// Add arms
	players[id].leftArm = new THREE.Mesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}))
	players[id].leftArm.castShadow = true;
	players[id].leftArm.receiveShadow = true;
	players[id].leftArm.position.set(-playerDim.armSize*3/2, -blockSize*0.45, 0);

	players[id].rightArm = new THREE.Mesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}))
	players[id].rightArm.castShadow = true;
	players[id].rightArm.receiveShadow = true;
	players[id].rightArm.position.set(playerDim.armSize*3/2, -blockSize*0.45, 0);

	// Add legs
	players[id].leftLeg = new THREE.Mesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}))
	players[id].leftLeg.castShadow = true;
	players[id].leftLeg.receiveShadow = true;
	players[id].leftLeg.position.set(-playerDim.legSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	players[id].rightLeg = new THREE.Mesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}))
	players[id].rightLeg.castShadow = true;
	players[id].rightLeg.receiveShadow = true;
	players[id].rightLeg.position.set(playerDim.armSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	// Add head
	players[id].head = new THREE.Mesh(new THREE.BoxGeometry(playerDim.headSize, playerDim.headSize, playerDim.headSize), new THREE.MeshStandardMaterial({
				  color: 0xf1c27d
				}));
	players[id].head.castShadow = true;
	players[id].head.receiveShadow = true;
	players[id].head.position.set(0, blockSize*0.2, 0);

	// Entity (combine body and arm)
	players[id].entity = new THREE.Group();
	players[id].entity.add(players[id].body);
	players[id].entity.add(players[id].leftArm);
	players[id].entity.add(players[id].rightArm);
	players[id].entity.add(players[id].leftLeg);
	players[id].entity.add(players[id].rightLeg);
	players[id].entity.add(players[id].head);

	players[id].extendArm = true;

	// Set position of entity
	players[id].pos = Ola({x:0, y:0, z:0}, 50);
	players[id].rot = Ola({x:0, y:0, z:0}, 50);
	players[id].dir = Ola({x:0, y:0, z:0}, 50);

	scene.add(players[id].entity);
	//blocks.push(players[id].entity);

	console.log("Added player", id)
}

// Rotate object around a 3D point
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

    if(pointIsWorld){
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if(pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }

    obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

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
		if (players[id].entity) {
			players[id].entity.position.set(players[id].pos.x, players[id].pos.y, players[id].pos.z);
			players[id].entity.rotation.set(players[id].rot.x, players[id].rot.y, players[id].rot.z);
			players[id].head.rotation.x = players[id].dir.y;
		}
	}

	// Emit events to server

	socket.emit('packet', {
		pos: player.position,
		rot: player.controls.getObject().rotation.toVector3(), // Rotation of body
		dir: camera.getWorldDirection() // Rotation of head
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