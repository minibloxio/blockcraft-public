// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

// Three.js
let scene, renderer, world, light, sky, stats, composer, colorShader, inScreen;
let loaded = 0;
let tick = new Ola(0)

let sprite = undefined;

// Stats
var prevTime = performance.now();
var statistics = [];

// Camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000);
var player;

// Mouse
var mouse = new THREE.Vector2();

var players = {};

var rleWorker = new Worker('javascripts/workers/rle-worker.js');

let voxelWorkers = [];
for (let i = 0; i < 8; i++) {
	voxelWorkers.push(new Worker('javascripts/workers/voxel-worker.js'));
	voxelWorkers[i].addEventListener('message', e => {
	  updateVoxelMesh(e);
	})
}

function init() {
	console.log('Initalizing BlockCraft...')
	console.log('Socket ID:', socket.id)
	// Initialize pointer lock
	initPointerLock();

	// Add scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	// Add world
	world = new World();

	// Add player
	player = new Player(camera, 16);
	scene.add( player.controls.getObject() );

	// Add light
	light = new Light();

    // Add statistics to record
    statistics.push(new Stat("Pos", player.position, false, 2, function (pos) {
    	return pos.clone().divideScalar(16);
    }))
    statistics.push(new Stat("Chunk Pos", player.position, false, 2, function (pos) {
    	return world.computeCellFromPlayer(pos.x, pos.y, pos.z);
    }))
    statistics.push(new Stat("Vel", player.velocity, false, 2))
    statistics.push(new Stat("Dir", player.direction, false, 2))
    statistics.push(new Stat("Speed", player, "speed", 2))
    statistics.push(new Stat("Fly", player, "fly", 2))

    // Finalize by adding the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	
	// Add statistics
	stats = new Stats();
	document.body.appendChild( stats.dom );

	composer = new THREE.EffectComposer(renderer);
	composer.addPass(new THREE.RenderPass(scene, camera));

	document.body.appendChild( renderer.domElement );

	colorShader = {
		uniforms: {
		  tDiffuse: { value: null },
		  color:    { value: new THREE.Color(0x2e41f4) },
		},
		vertexShader: `
		  varying vec2 vUv;
		  void main() {
		    vUv = uv;
		    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
		  }
		`,
		fragmentShader: `
		  uniform vec3 color;
		  uniform sampler2D tDiffuse;
		  varying vec2 vUv;
		  void main() {
		    vec4 previousPassColor = texture2D(tDiffuse, vUv);
		    gl_FragColor = vec4(
		        previousPassColor.rgb * color,
		        previousPassColor.a);
		  }
		`,
	};

	colorPass = new THREE.ShaderPass(colorShader);
	colorPass.renderToScreen = true;
	colorPass.enabled = false;
	composer.addPass(colorPass);

	var bloomParams = {
		exposure: 0.5,
		bloomStrength: 0.1,
		bloomThreshold: 5,
		bloomRadius: 100,
		scene: "Scene with Glow"
	};

	bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	bloomPass.renderToScreen = true;
	bloomPass.threshold = bloomParams.bloomThreshold;
	bloomPass.strength = bloomParams.bloomStrength;
	bloomPass.radius = bloomParams.bloomRadius;
	//composer.addPass(bloomPass);

	var finalPass = new THREE.ShaderPass(
		new THREE.ShaderMaterial( {
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: composer.renderTarget2.texture }
			},
			vertexShader: document.getElementById( 'vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
			defines: {}
		} ), "baseTexture"
	);
	finalPass.needsSwap = true;
	finalPass.renderToScreen = true;
	//composer.addPass(finalPass);

	window.addEventListener( 'resize', onWindowResize, false );

	loaded += 1; // Increase loading stage


	// instantiate a loader
	const loader = new THREE.SVGLoader();

	/*loader.load('./textures/tiger.svg', function (data) {
		addExtrudedSVG(data, 120, './textures/tiger.svg');
	})

	loader.load('./textures/rainbow.svg', function (data) {
		addExtrudedSVG(data, 100, './textures/rainbow.svg');
	})
			

	loader.load('./textures/test.svg', function (data) {
		addExtrudedSVG(data, 140, './textures/test.svg');
	})
*/


}

function addExtrudedSVG(data, height, name) {
	console.log(name, data.paths)

	// Group we'll use for all SVG paths
	const group = new THREE.Group();
	group.scale.y *= -1;


	// Loop through all of the parsed paths
	data.paths.forEach((path, i) => {

		var color = path.userData.style.fill;

		if (color && color != 'none') {

			var material = new THREE.MeshBasicMaterial( {
				color: new THREE.Color().setStyle( color ),
				opacity: path.userData.style.fillOpacity,
				transparent: path.userData.style.fillOpacity < 1,
				side: THREE.DoubleSide
			} );


			const shapes = path.toShapes(true);

			// Each path has array of shapes
			shapes.forEach((shape, j) => {
				// Finally we can take each shape and extrude it
				//var geometry = new THREE.ShapeBufferGeometry( shape );
				const geometry = new THREE.ExtrudeGeometry(shape, {
					steps: 2,
		        depth: 20,
		        bevelEnabled: true
		      });

				// Create a mesh and add it to the group
				const mesh = new THREE.Mesh(geometry, material);

				group.add(mesh);
			});

		}


		/*var stroke = path.userData.style.stroke
		 {
			var material = new THREE.MeshBasicMaterial( {
				color: new THREE.Color().setStyle(stroke ),
				opacity: path.userData.style.strokeOpacity,
				transparent: path.userData.style.strokeOpacity < 1,
				side: THREE.DoubleSide
			} );

			for ( var j = 0, j = path.subPaths.length; j < j; j ++ ) {

				var subPath = path.subPaths[ j ];

				var geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

				if ( geometry ) {

					var mesh = new THREE.Mesh( geometry, material );

					group.add( mesh );

				}

			}
		}*/

	});

	/*// Get group's size
	const box = new THREE.Box3().setFromObject(group);
	const size = new THREE.Vector3();
	box.getSize(size);

	const yOffset = size.y / -2;
	const xOffset = size.x / -2;

	// Offset all of group's elements, to center them
	group.children.forEach(item => {
		item.position.x = xOffset;
		item.position.y = yOffset;
	});*/

	group.position.set(0, 16*height, 0);

	// Finally we add svg group to the scene
	scene.add(group);
}

function animate() {
	requestAnimationFrame( animate );

	// Get the frame's delta
	var time = performance.now();
	delta = ( time - prevTime );
	delta /= 1000;

	delta = Math.min(delta, 0.1)

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

	// Update server entities

	for (let id in world.entities) {
		let e = world.entities[id]
		e.mesh.position.lerp(e.pos, delta*10)
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

	composer.render( scene, camera );
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