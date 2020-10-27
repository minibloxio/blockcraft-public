
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
	    scene.background = new THREE.Color("rgba(255, 0, 0, 0)")

	    // Sun
	    this.sun = loadSprite('./sun.png', 1000);
		this.sun.castShadow = false;
		this.t = 0;
		this.dayNightCycle = true;
		this.daySpeed = 0.001;

		this.sunDist = 5000;
	    this.offset = new THREE.Vector3(this.sunDist, 0, 0);
		scene.add(this.sun);

		// Clouds
		this.clouds = [];
		this.generateClouds("add")
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
				cloud.position.set(Math.random()*3000-1500 + player.position.x, Math.random()*200 + blockSize*80, Math.random()*3000-1500 + player.position.z)
				scene.add(cloud);

				this.clouds.push(cloud);
			}
		}
	}

	update() {
		// Update sun position
		if (this.dayNightCycle) {
			this.offset.x = Math.cos(this.t)*this.sunDist;
			this.offset.y = Math.sin(this.t)*this.sunDist;
		}

		var sun = player.position.clone().add(this.offset.clone());
		this.dir.position.set(sun.x, sun.y, sun.z); // Update directional light
		this.sun.position.set(sun.x, sun.y, sun.z);

		this.sun.lookAt(this.sun.position)

		// Update hemisphere light based on sun height
		this.hemi.intensity = (this.offset.y+this.sunDist) / 30000 + 0.2;

		for (let cloud of this.clouds) {
			cloud.position.add(new THREE.Vector3(0.3, 0, 0))
			if (cloud.position.x > 1500)
				cloud.position.x = -1500;
		}

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
		scene.fog.near = (player.renderDistance-3)*blockSize*cellSize;
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