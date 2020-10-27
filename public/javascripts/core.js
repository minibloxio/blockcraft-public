// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

// Three.js
var scene, renderer, light, sky, stats, composer, colorShader;
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
}

function animate() {
	requestAnimationFrame( animate );

	// Get the frame's delta
	var time = performance.now();
	var delta = ( time - prevTime );
	delta /= 1000;

	delta = Math.min(delta, 20)

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