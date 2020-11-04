
let loader  = new THREE.TextureLoader();
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
				     	return new THREE.MeshLambertMaterial({map: tex, side: THREE.DoubleSide,
                shadowSide: THREE.DoubleSide,
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

// Font texture
let fontLoader = new THREE.FontLoader();
let minecraft_font = undefined;

fontLoader.load( './textures/font/Minecraft_Regular.json', function ( font ) {
	minecraft_font = font;
  loaded += 1;
} );

// Block breaking progress
let mining_progress = [
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

// Texture Merger

let material;
loader.setPath("textures/blocks/");
let block_names = ['water_clear', 'bedrock', 'stone', 'dirt', 'cobblestone', 'grass_side', 'grass_top', 'log_oak', 'log_oak_top', 'leaves_oak', 'coal_ore', 'diamond_ore', 'iron_ore', 'gold_ore', 'crafting_table_front', 'crafting_table_top', 'planks_oak']
let blockFaces = {}
let texture_atlas = undefined;

function loadBlockImages() {
  let loading_index = 0;
  for (let block of block_names) {
    let name = block + '.png'
    blockFaces[block] = loader.load(name, function () {
      loading_index += 1;
      if (loading_index == block_names.length) {
        mergeTextures();
      }
    })
  }
}
loadBlockImages();  

let blocks = {
  "water": "water_clear",
  "bedrock": "bedrock",
  "stone": "stone",
  "dirt": "dirt",
  "cobblestone": "cobblestone",
  "grass": ["grass_side", "dirt", "grass_top"],
  "wood": ["log_oak", "log_oak_top", "log_oak_top"],
  "leaves": "leaves_oak",
  "coal_ore": "coal_ore",
  "diamond_ore": "diamond_ore",
  "iron_ore": "iron_ore",
  "gold_ore": "gold_ore",
  "crafting_table": ["crafting_table_front", "planks_oak", "crafting_table_top"],
  "planks": "planks_oak"
}

function drawImageNet(ctx, entities) {
  let index = 0;
  for (let entity in entities) {
    let b = entities[entity];
    if (b instanceof Array) {
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(blockFaces[b[i]].image, index*16, i*16)
      }
    } else {
      ctx.drawImage(blockFaces[b].image, index*16, 0)
      ctx.drawImage(blockFaces[b].image, index*16, 16)
      ctx.drawImage(blockFaces[b].image, index*16, 32)
    }
    index++;
  }
}

function makeCanvasPowerOfTwo(canvas) {
  let oldWidth = canvas.width;
  let oldHeight = canvas.height;
  let newWidth = Math.pow(2, Math.round(Math.log(oldWidth) / Math.log(2)));
  let newHeight = Math.pow(2, Math.round(Math.log(oldHeight) / Math.log(2)));
  let newCanvas = document.createElement("canvas");
  newCanvas.width = newWidth;
  newCanvas.height = newHeight;
  newCanvas.getContext("2d").drawImage(canvas, 0, 0, newWidth, newHeight);
  return newCanvas;
}

function mergeTextures() {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;

  drawImageNet(ctx, blocks);

  canvas = makeCanvasPowerOfTwo(canvas);

  let texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  ctx.drawImage(texture.image, 500, 500)

  material = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: true
  });

  texture_atlas = texture.image;

  console.log("Done stitching textures")
  loaded += 1;
}

loader.setPath("textures/items/");

let item_names = ['stick', 'wood_sword', 'wood_pickaxe', 'wood_axe']
let items = {};
let item_atlas = undefined;

function loadItemImages() {
  var loading_index = 0;
  for (let item of item_names) {
    let name = item + '.png'
    items[item] = loader.load(name, function () {
      loading_index += 1;
      if (loading_index == item_names.length) {
        mergeItemTextures();
      }
    })
  }
}

loadItemImages();
  
function mergeItemTextures() {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;

  let index = 0;
  for (let item in items) {
    let b = items[item];
    ctx.drawImage(b.image, index*16, 0)
    index++;
  }

  canvas = makeCanvasPowerOfTwo(canvas);

  let texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = undefined;
  texture.wrapT = undefined;
  texture.needsUpdate = true;

  item_atlas = texture.image;

  console.log("Done stitching item textures")
}

loader.setPath("textures/");

// Player Textures

// Head
let head_front = new Texture(['./skin/head/front.png']);
let head_top = new Texture(['./skin/head/top.png']);
let head_right = new Texture(['./skin/head/right.png']);
let head_left = new Texture(['./skin/head/left.png']);
let head_back = new Texture(['./skin/head/back.png']);
let head_bottom = new Texture(['./skin/head/bottom.png']);
let head_materials = [
    head_right.material,
    head_left.material,
    head_top.material,
    head_bottom.material,
    head_back.material,
    head_front.material
];

let head = new Texture("head", head_materials );

// Body
let body_front = new Texture(['./skin/body/front.png']);
let body_back = new Texture(['./skin/body/back.png']);
let body_top = new Texture(['./skin/body/top.png']);
let body_bottom = new Texture(['./skin/body/bottom.png']);
let body_right = new Texture(['./skin/body/right.png']);
let body_left = new Texture(['./skin/body/left.png']);

let body_materials = [
    body_right.material,
    body_left.material,
    body_top.material,
    body_bottom.material,
    body_back.material,
    body_front.material
];

let body = new Texture("body", body_materials );

// Arm
let arm_front = new Texture(['./skin/arm/front.png']);
let arm_back = new Texture(['./skin/arm/back.png']);
let arm_top = new Texture(['./skin/arm/top.png']);
let arm_bottom = new Texture(['./skin/arm/bottom.png']);
let arm_right = new Texture(['./skin/arm/right.png']);
let arm_left = new Texture(['./skin/arm/left.png']);
let arm_right_side = new Texture(['./skin/arm/rightSide.png']);

let arm_materials = [
    arm_right.material,
    arm_left.material,
    arm_top.material,
    arm_bottom.material,
    arm_back.material,
    arm_front.material
];

let arm = new Texture("arm", arm_materials );



// Side arm (for client player)
let arm_frontC = new Texture(['./skin/arm/front.png']);
let arm_backC = new Texture(['./skin/arm/back.png']);
let arm_topC = new Texture(['./skin/arm/top.png']);
let arm_leftC = new Texture(['./skin/arm/left.png']);
let arm_right_sideC = new Texture(['./skin/arm/rightSide.png']);

let armC_materials = [
    arm_right_sideC.material,
    arm_leftC.material,
    arm_topC.material,
    arm_frontC.material,
    arm_backC.material,
    arm_frontC.material
];
let armC = new Texture("armC", armC_materials );

// Leg
let leg_front = new Texture(['./skin/leg/front.png']);
let leg_back = new Texture(['./skin/leg/back.png']);
let leg_top = new Texture(['./skin/leg/top.png']);
let leg_bottom = new Texture(['./skin/leg/bottom.png']);
let leg_right = new Texture(['./skin/leg/right.png']);
let leg_left = new Texture(['./skin/leg/left.png']);

let leg_materials = [
    leg_right.material,
    leg_left.material,
    leg_top.material,
    leg_bottom.material,
    leg_back.material,
    leg_front.material
];

let leg = new Texture("leg", leg_materials );

function loadSprite(path) {
  // Item sprites
  let map = loader.load( path );
  let material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: false } );
  let sprite = new THREE.Sprite( material );
  sprite.scale.set(400, 400);
  return sprite;

}

