
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
            let tex = texture;
              tex.magFilter = THREE.NearestFilter;
              tex.minFilter = THREE.NearestFilter;
			      return new THREE.MeshBasicMaterial({map: tex, side: THREE.FrontSide,
                shadowSide: THREE.FrontSide,
                alphaTest: 0.1,
                transparent: true
              })
			    })[0];
			} else {
				this.material = this.loaded.map((texture) => {
						  let tex = texture;
              tex.magFilter = THREE.NearestFilter;
              tex.minFilter = THREE.NearestFilter;
				     	return new THREE.MeshLambertMaterial({map: tex, side: THREE.FrontSide,
                shadowSide: THREE.FrontSide,
                alphaTest: 0.1,
                transparent: true
              })
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
	constructor(block) {
		this.block = new THREE.Mesh(blockGeometry, block.material);
		/*this.block.position.set(x, y, z);
		this.position = this.block.position.set(x, y, z);*/
		/*this.block.castShadow = true;
		this.block.receiveShadow = true;*/

		return this.block;
	}
}

// Font texture
var fontLoader = new THREE.FontLoader();
let minecraft_font = undefined;

var loaded = 0;

fontLoader.load( './textures/font/Minecraft_Regular.json', function ( font ) {
	minecraft_font = font;
  loaded += 1;
} );

// Block textures
var stone = new Texture(['./blocks/stone.png'])
var bedrock = new Texture(['./blocks/bedrock.png'])
var dirt = new Texture(['./blocks/dirt.png'])
var sun = new Texture(['./blocks/sun.png'], false, {
	metalness: 0,
	type: "basic"
})

var grass_side = new Texture(['./blocks/grass-side.png'])
var grass_top = new Texture(['./blocks/grass-top.png'])

var grass_materials = [
    grass_side.material,
    grass_side.material,
    grass_top.material,
   	dirt.material,
    grass_side.material,
    grass_side.material
];

var grass = new Texture("grass", grass_materials );

// Block breaking progress
var mining_progress = [
  new Texture(['./progress/0.png']),
  new Texture(['./progress/1.png']),
  new Texture(['./progress/2.png']),
  new Texture(['./progress/3.png']),
  new Texture(['./progress/4.png']),
  new Texture(['./progress/5.png']),
  new Texture(['./progress/6.png']),
  new Texture(['./progress/7.png']),
  new Texture(['./progress/8.png']),
  new Texture(['./progress/9.png']),
  new Texture(['./progress/10.png']),
];

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

function loadSprite(path) {
  // Item sprites
  var map = loader.load( path );
  var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: false } );
  var sprite = new THREE.Sprite( material );
  sprite.scale.set(400, 400);
  return sprite;

}

