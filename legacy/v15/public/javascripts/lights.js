
class Light {
	constructor() {
		// Add light
	
		this.hemi = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
	    this.hemi.position.set( 0, 5000, 0 );
	    scene.add( this.hemi );

	    this.dir = new THREE.DirectionalLight( "orange", 1 ); // Change this color to the day's color
	    this.dir.position.set( -1, 0.75, 1 );
	    this.dir.position.multiplyScalar( 1000);
	    scene.add( this.dir );

	    this.dir.target = player.controls.getObject();

	    this.dir.castShadow = false; //SHADOW
	    this.dir.shadow.mapSize.width = this.dir.shadow.mapSize.height = 1024*2;

		var d = 1000;
		
	    this.dir.shadow.camera.left = -d;
	    this.dir.shadow.camera.right = d;
	    this.dir.shadow.camera.top = d;
	    this.dir.shadow.camera.bottom = -d;
	    this.dir.updateMatrix();
	    this.dir.updateMatrixWorld();

	    this.dir.shadow.camera.far = 10000;
	    this.dir.shadow.camera.near = 0;
	    this.dir.shadow.bias = -0.0001;

	    // Fog
	    scene.fog = new THREE.Fog("lightblue", 0, blockSize*cellSize*5)
	    scene.background = new THREE.Color("lightblue")

	    // Sun
		this.sun = new THREE.Mesh(
			new THREE.SphereBufferGeometry( 20, 16, 8 ),
			new THREE.MeshBasicMaterial( { color: "yellow" } )
		);
		this.sun.castShadow = false;
		this.t = 5;
		this.dayNightCycle = false;
	    this.offset = new THREE.Vector3(5000, 5000, 0);
	    this.morning = true;
	    this.day = true;
		scene.add(this.sun);

		// Clouds
		this.clouds = [];
		//this.generateClouds("add")
	}

	generateClouds(type) {
		for (let cloud of this.clouds) {
			scene.remove(cloud);
		}

		this.clouds = [];

		if (type == "add") {
			this.clouds = [];

			for (let i = 0; i < 100; i++) {
				let cloud = new THREE.Mesh(
						new THREE.BoxGeometry( Math.random()*200+100, 16, Math.random()*200+100 ),
						new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 0.4, transparent: true } )
					);
				cloud.position.set(Math.random()*3000-1500, Math.random()*200 + 400, Math.random()*3000-1500)
				scene.add(cloud);

				this.clouds.push(cloud);
			}
		}
	}

	update() {
		// Update sun position
		if (this.dayNightCycle) {
			if (this.day) {
				this.offset.x -= this.t;
			} else {
				this.offset.x += this.t;
			}

			if (this.offset.x < -5000) {
				this.day = false;
			} else if (this.offset.y > 5000) {
				this.day = true;
			}
			
			if (this.morning) {
				this.offset.y += this.t;
			} else {
				this.offset.y -= this.t;
			}

			if (this.offset.y > 5000) {
				this.morning = false;
			} else if (this.offset.y < -5000) {
				this.morning = true;
			}
		}

		var sun = player.position.clone().add(this.offset.clone());
		this.dir.position.set(sun.x, sun.y, sun.z); // Update directional light
		this.sun.position.set(sun.x, sun.y, sun.z);

		// Update hemisphere light based on sun height
		this.hemi.intensity = (this.offset.y+5000) / 30000 + 0.2;

		for (let cloud of this.clouds) {
			cloud.position.add(new THREE.Vector3(0.3, 0, 0))
			if (cloud.position.x > 1500)
				cloud.position.x = -1500;
		}


		// Update fog based on render distance
		scene.fog.near = (player.renderDistance-3)*blockSize*cellSize;
		scene.fog.far = player.renderDistance*blockSize*cellSize;
	}
}