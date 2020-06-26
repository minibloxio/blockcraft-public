
var loader  = new THREE.TextureLoader();
	loader.setPath("textures/");

class Texture {
	constructor(texture, material, options) {
		if (!options) {
			options = {}
		}
		if (material) {
			this.texture = texture;
			this.material = material;
			this.mat = material;
		} else {
			this.texture = texture;
			this.loaded = this.texture.map((url) => {
		      	return loader.load(url);
		    })
			if (options.type === "basic") {
				this.material = this.loaded.map((texture) => {
			      return new THREE.MeshBasicMaterial({map: texture})
			    })[0];
			} else {
				this.material = this.loaded.map((texture) => {
						let tex = texture;
				     	return new THREE.MeshStandardMaterial({map: tex})
				    })[0];
			}
				
			this.material.side = THREE.FrontSide;
			this.material.metalness = options.metalness || 0;
			this.material.roughness = 0.5
			this.material.transparent = false;
		}
	}
}

class Block {
	constructor(block, x, y, z) {
		this.texture = block.material;
		this.geometry = blockGeometry;
		this.block = new THREE.Mesh(this.geometry, this.texture);
		this.block.position.set(x, y, z);
		this.position = this.block.position.set(x, y, z);
		this.block.castShadow = true;
		this.block.receiveShadow = true;

		return this.block;
	}
}

// Font texture
var fontLoader = new THREE.FontLoader();
let minecraft_font = undefined;

fontLoader.load( './textures/font/Minecraft_Regular.json', function ( font ) {
	minecraft_font = font;
	
} );

// Block textures
var stone = new Texture(['stone.png'])
var bedrock = new Texture(['bedrock.png'])
var dirt = new Texture(['dirt.png'])
var sun = new Texture(['sun.png'], false, {
	metalness: 0,
	type: "basic"
})

var grass_side = new Texture(['grass-side.png'])
var grass_top = new Texture(['grass-top.png'])


var grass_materials = [
    grass_side.material,
    grass_side.material,
    grass_top.material,
   	dirt.material,
    grass_side.material,
    grass_side.material
];

var grass = new Texture("grass", grass_materials );

// Player Textures

// Head
var head_front = new Texture(['./skin/head/front.png']);
var head_top = new Texture(['./skin/head/top.png']);
var head_right = new Texture(['./skin/head/right.png']);
var head_left = new Texture(['./skin/head/left.png']);
var head_back = new Texture(['./skin/head/back.png']);
var head_bottom = new Texture(['./skin/head/bottom.png']);
var head_materials = [
    head_right.material,
    head_left.material,
    head_top.material,
    head_bottom.material,
    head_back.material,
    head_front.material
];

var head = new Texture("head", head_materials );

// Body
var body_front = new Texture(['./skin/body/front.png']);
var body_back = new Texture(['./skin/body/back.png']);
var body_top = new Texture(['./skin/body/top.png']);
var body_bottom = new Texture(['./skin/body/bottom.png']);
var body_right = new Texture(['./skin/body/right.png']);
var body_left = new Texture(['./skin/body/left.png']);

var body_materials = [
    body_right.material,
    body_left.material,
    body_top.material,
    body_bottom.material,
    body_back.material,
    body_front.material
];

var body = new Texture("body", body_materials );

// Arm
var arm_front = new Texture(['./skin/arm/front.png']);
var arm_back = new Texture(['./skin/arm/back.png']);
var arm_top = new Texture(['./skin/arm/top.png']);
var arm_bottom = new Texture(['./skin/arm/bottom.png']);
var arm_right = new Texture(['./skin/arm/right.png']);
var arm_left = new Texture(['./skin/arm/left.png']);
var arm_right_side = new Texture(['./skin/arm/rightSide.png']);

var arm_materials = [
    arm_right.material,
    arm_left.material,
    arm_top.material,
    arm_bottom.material,
    arm_back.material,
    arm_front.material
];

var arm = new Texture("arm", arm_materials );

// Side arm (for client player)
var armC_materials = [
    arm_right_side.material,
    arm_left.material,
    arm_top.material,
    arm_front.material,
    arm_back.material,
    arm_front.material
];
var armC = new Texture("armC", armC_materials );

// Leg
var leg_front = new Texture(['./skin/leg/front.png']);
var leg_back = new Texture(['./skin/leg/back.png']);
var leg_top = new Texture(['./skin/leg/top.png']);
var leg_bottom = new Texture(['./skin/leg/bottom.png']);
var leg_right = new Texture(['./skin/leg/right.png']);
var leg_left = new Texture(['./skin/leg/left.png']);

var leg_materials = [
    leg_right.material,
    leg_left.material,
    leg_top.material,
    leg_bottom.material,
    leg_back.material,
    leg_front.material
];

var leg = new Texture("leg", leg_materials );

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

// Sky material
var skyMaterial = new THREE.MeshFaceMaterial(skyMaterials);