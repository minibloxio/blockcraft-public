
class Stage {
	constructor() {

	    let {blockSize, cellSize} = world;

		// Add hemisphere
		this.hemi = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
	    this.hemi.position.set( 0, 5000, 0 );
	    scene.add( this.hemi );

	    // Add sun directional light
	    this.dir = new THREE.DirectionalLight( "orange", 1 );
	    scene.add( this.dir );
	    this.dir.target = player.controls.getObject();
	    this.dir.castShadow = false; //SHADOW
	    this.dir.enableShadow = false;
	    
	    // Add shadow
		var d = 1000;
	    this.dir.shadow.mapSize.width = this.dir.shadow.mapSize.height = 1024*2;
	    this.dir.shadow.camera.left = -d;
	    this.dir.shadow.camera.right = d;
	    this.dir.shadow.camera.top = d;
	    this.dir.shadow.camera.bottom = -d;
	    this.dir.updateMatrix();
	    this.dir.updateMatrixWorld();

	    this.dir.shadow.camera.far = 10000;
	    this.dir.shadow.camera.near = 0;
	    this.dir.shadow.bias = -0.001;

	    // Add moon directional light
	    this.dirM = new THREE.DirectionalLight( "white", 0.5 );
	    scene.add( this.dirM );

	    // Torches
	    this.torches = [];

	    // Fog
	    scene.fog = new THREE.Fog("lightblue", 0, blockSize*cellSize*5)

	    // Sun
	    this.sun = loadSprite('./sun.png', 1000);
	    this.moon = loadSprite('./moon.png', 1000);
		this.dayNightCycle = true;
		this.daySpeed = 0.001;

		this.sunDist = 5000;
	    this.offset = new THREE.Vector3(this.sunDist, 0, 0);
		scene.add(this.sun);
		scene.add(this.moon);

		// Clouds
		this.clouds = [];

		// Add stars
		var vertices = [];

		for ( var i = 0; i < 500; i ++ ) {

			let radius = 16 * 16 * 16 * 16;
			var u = Math.random();
			var v = Math.random();
			var theta = 2 * Math.PI * u;
			var phi = Math.acos(2 * v - 1);
			var x = (radius * Math.sin(phi) * Math.cos(theta));
			var y = (radius * Math.sin(phi) * Math.sin(theta));
			var z = (radius * Math.cos(phi));

			vertices.push( x, y, z );

		}

		var geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

		var starMaterial = new THREE.PointsMaterial( { transparent: true, color: 0xFFFFFF, size: random(16*8, 32*16)} );

		this.stars = new THREE.Points( geometry, starMaterial );
		scene.add(this.stars);
	}

	generateClouds(type) {
		let {blockSize, cellSize} = world;
		for (let cloud of this.clouds) {
			scene.remove(cloud);
		}

		this.clouds = [];

		if (type == "add") {
			this.clouds = [];

			for (let i = 0; i < 100; i++) {
				let cloud = new THREE.Mesh(
						new THREE.BoxGeometry( Math.random()*200+100, 16, Math.random()*200+100 ),
						new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 0.4, transparent: true} )
					);
				cloud.name = "cloud";
				let renderDistance = blockSize*cellSize*chunkManager.renderDistance;
				cloud.position.set(Math.random()*3000-renderDistance + player.position.x, Math.random()*200 + blockSize*100, Math.random()*3000-renderDistance + player.position.z)
				scene.add(cloud);

				this.clouds.push(cloud);
			}
		}
	}

	update() {
		let {blockSize, cellSize} = world;
		let t = tick.value || 1000;

		// Update stars transparency
		let opacityOffset = 0.5;
		let opacity = opacityOffset-Math.pow(Math.sin(t*this.daySpeed)/2+0.5, 5);
		let clampedOpacity = mapRange(opacity > 0 ? opacity : 0, 0, opacityOffset, 0, 1)
		this.stars.material.opacity = clampedOpacity;

		// Update sun position
		if (this.dayNightCycle) {
			this.offset.x = Math.cos(t*this.daySpeed)*this.sunDist;
			this.offset.y = Math.sin(t*this.daySpeed)*this.sunDist;
		}

		var sun = player.position.clone()
		sun.y = 0;
		sun.add(this.offset.clone());
		this.dir.position.set(sun.x, sun.y, sun.z); // Update directional light
		this.sun.position.set(sun.x, sun.y, sun.z);
		this.sun.lookAt(this.sun.position)

		if (this.dir.enableShadow) {
			if (this.offset.y < 0) {
				this.dir.castShadow = false;
			} else {
				this.dir.castShadow = true;
			}
		}

		var moon = player.position.clone()
		moon.y = 0;
		moon.add(this.offset.clone().multiplyScalar(-1));
		this.dirM.position.set(moon.x, moon.y, moon.z);
		this.moon.position.set(moon.x, moon.y, moon.z);
		this.moon.lookAt(this.moon.position)

		// Update hemisphere light based on sun height
		let intensity = ((this.offset.y/this.sunDist/2)+0.5);
		this.dir.intensity = intensity;
		this.dirM.intensity = 0.5-intensity/2;

		let clampedIntensity = mapRange(intensity, 0, 1, 0.3, 0.7)
		this.hemi.intensity = clampedIntensity;

		// Check for cloud generation
		if (this.generate == this.showClouds) {
			this.generate = !this.generate;
			if (this.showClouds)
				this.generateClouds("add")
			else
				this.generateClouds("remove")
		}

		// Update clouds
		let renderDistance = blockSize*world.cellSize*chunkManager.renderDistance;
		for (let cloud of this.clouds) {
			cloud.position.add(new THREE.Vector3(0.3, 0, 0))
			if (cloud.position.x > renderDistance + player.position.x)
				cloud.position.x = -renderDistance + player.position.x;
			else if (cloud.position.x < -renderDistance + player.position.x)
				cloud.position.x = renderDistance + player.position.x;

			if (cloud.position.z > renderDistance + player.position.z)
				cloud.position.z = -renderDistance + player.position.z;
			else if (cloud.position.z < -renderDistance + player.position.z)
				cloud.position.z = renderDistance + player.position.z;
		}

		// Update sky lighting
		var midnight = new Color("#151B54");
		var sunrise = new Color("#fd5e53");
		var noon = new Color("#ADD8E6");
		var perc = Math.pow(Math.abs(this.offset.y), 0.3) / Math.pow(this.sunDist, 0.3) * 100;
		let color;

		if (this.offset.y > 0) {
			color = new THREE.Color(LinearColorInterpolator.findColorBetween(sunrise, noon, perc).asRgbCss());
		} else {
			color = new THREE.Color(LinearColorInterpolator.findColorBetween(sunrise, midnight, perc).asRgbCss());
		}
		
		scene.background = color;
		scene.fog.color = color;

		// Update fog based on render distance
		scene.fog.near = (chunkManager.renderDistance-3)*blockSize*cellSize;
		scene.fog.far = Infinity;
	}
}

Color = function(hexOrObject) {
    var obj;
    if (hexOrObject instanceof Object) {
        obj = hexOrObject;
    } else {
        obj = LinearColorInterpolator.convertHexToRgb(hexOrObject);
    }
    this.r = obj.r;
    this.g = obj.g;
    this.b = obj.b;
}
Color.prototype.asRgbCss = function() {
    return "rgb("+this.r+", "+this.g+", "+this.b+")";
}

var LinearColorInterpolator = {
    // convert 6-digit hex to rgb components;
    // accepts with or without hash ("335577" or "#335577")
    convertHexToRgb: function(hex) {
        match = hex.replace(/#/,'').match(/.{1,2}/g);
        return new Color({
            r: parseInt(match[0], 16),
            g: parseInt(match[1], 16),
            b: parseInt(match[2], 16)
        });
    },
    // left and right are colors that you're aiming to find
    // a color between. Percentage (0-100) indicates the ratio
    // of right to left. Higher percentage means more right,
    // lower means more left.
    findColorBetween: function(left, right, percentage) {
        newColor = {};
        components = ["r", "g", "b"];
        for (var i = 0; i < components.length; i++) {
            c = components[i];
            newColor[c] = Math.round(left[c] + (right[c] - left[c]) * percentage / 100);
        }
        return new Color(newColor);
    }
}