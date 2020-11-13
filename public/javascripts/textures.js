
let loader  = new THREE.TextureLoader();
	loader.setPath("textures/");

class Texture {
	constructor(textureUrl, material) {
		if (material) {
			this.material = material;
			this.mat = material;
		} else {
			this.texture = loader.load(textureUrl);
      this.texture.magFilter = THREE.NearestFilter;
      this.texture.minFilter = THREE.NearestFilter;
			this.material = new THREE.MeshLambertMaterial({
        map: this.texture, 
        side: THREE.DoubleSide,
        shadowSide: THREE.DoubleSide,
        alphaTest: 0.1,
        transparent: true
      })
				
			this.material.side = THREE.FrontSide;
			this.material.metalness = 0;
			this.material.roughness = 0.5;
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
});

// Block breaking progress
let mining_progress = [
  new Texture('./progress/0.png'),
  new Texture('./progress/1.png'),
  new Texture('./progress/2.png'),
  new Texture('./progress/3.png'),
  new Texture('./progress/4.png'),
  new Texture('./progress/5.png'),
  new Texture('./progress/6.png'),
  new Texture('./progress/7.png'),
  new Texture('./progress/8.png'),
  new Texture('./progress/9.png'),
  new Texture('./progress/10.png'),
];

function loadTextures(data) {
  loadBlockImages(data.blocks, data.blockOrder)
  loadItemImages(data.items, data.itemOrder);
}

// Texture Merger

let material;
let blockFaces = {};
let texture_atlas = undefined;

let blocks = {
  "water": "water_clear",
  "grass": ["grass_side", "dirt", "grass_top"],
  "snowy_grass": ["grass_side_snowed", "dirt", "snow"],
  "wood": ["log_oak", "log_oak_top", "log_oak_top"],
  "leaves": "leaves_oak",
  "crafting_table": ["crafting_table_front", "planks_oak", "crafting_table_top"],
  "planks": "planks_oak",
  "sandstone": ["sandstone_normal", "sandstone_bottom", "sandstone_top"],
}

function loadBlockImages(block_names, block_order) {
  loader.setPath("textures/blocks/");
  let loading_index = 0;
  for (let name of block_names) {
    blockFaces[name.slice(0, -4)] = loader.load(name, function () {
      loading_index += 1;
      
      if (loading_index == block_names.length) {
        loaded += 1;
        mergeBlockTextures(block_order);
      }
    })
  }
}

function mergeBlockTextures(order) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 64;

  drawImageNet(ctx, order, blocks);

  canvas = makeCanvasPowerOfTwo(canvas);

  let texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  ctx.drawImage(texture.image, 500, 500)

  material = new THREE.MeshPhongMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true
  });

  texture_atlas = texture.image;

  console.log("Done stitching textures")
  loaded += 1;
}

function drawImageNet(ctx, order, entities) {
  let index = 0;
  for (let entity of order) {
    let b = entities[entity];
    if (b instanceof Array) {
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(blockFaces[b[i]].image, index*16, i*16)
      }
    } else if (b) {
      ctx.drawImage(blockFaces[b].image, index*16, 0)
      ctx.drawImage(blockFaces[b].image, index*16, 16)
      ctx.drawImage(blockFaces[b].image, index*16, 32)
    } else {
      ctx.drawImage(blockFaces[entity].image, index*16, 0)
      ctx.drawImage(blockFaces[entity].image, index*16, 16)
      ctx.drawImage(blockFaces[entity].image, index*16, 32)
    }
    index++;
  }
}

let items = {
  "bow": ["bow_standby", "bow_pulling_0", "bow_pulling_1", "bow_pulling_2"]
}
let itemFaces = {};
let item_atlas = undefined;

function loadItemImages(item_names, item_order) {
  loader.setPath("textures/items/");
  var loading_index = 0;
  for (let name of item_names) {
    itemFaces[name.slice(0, -4)] = loader.load(name, function () {
      loading_index += 1;
      if (loading_index == item_names.length) {
        loaded += 1;
        mergeItemTextures(item_order);
      }
    })
  }
}
  
function mergeItemTextures(order) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;

  let index = 0;
  for (let item of order) {
    let b = items[item];
    if (b instanceof Array) {
      for (let i = 0; i < b.length; i++) {
        ctx.drawImage(itemFaces[b[i]].image, index*16, i*16)
      }
    } else {
      ctx.drawImage(itemFaces[item].image, index*16, 0)
    }
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

  loaded += 1;
  console.log("Done stitching item textures")
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

// Player Textures
loader.setPath("textures/");

// Head

let head_front = new Texture('./skin/head/front.png');
let head_top = new Texture('./skin/head/top.png');
let head_right = new Texture('./skin/head/right.png');
let head_left = new Texture('./skin/head/left.png');
let head_back = new Texture('./skin/head/back.png');
let head_bottom = new Texture('./skin/head/bottom.png');
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
let body_front = new Texture('./skin/body/front.png');
let body_back = new Texture('./skin/body/back.png');
let body_top = new Texture('./skin/body/top.png');
let body_bottom = new Texture('./skin/body/bottom.png');
let body_right = new Texture('./skin/body/right.png');
let body_left = new Texture('./skin/body/left.png');

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
let arm_front = new Texture('./skin/arm/front.png');
let arm_back = new Texture('./skin/arm/back.png');
let arm_top = new Texture('./skin/arm/top.png');
let arm_bottom = new Texture('./skin/arm/bottom.png');
let arm_right = new Texture('./skin/arm/right.png');
let arm_left = new Texture('./skin/arm/left.png');
let arm_right_side = new Texture('./skin/arm/rightSide.png');

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
let arm_frontC = new Texture('./skin/arm/front.png');
let arm_backC = new Texture('./skin/arm/back.png');
let arm_topC = new Texture('./skin/arm/top.png');
let arm_leftC = new Texture('./skin/arm/left.png');
let arm_right_sideC = new Texture('./skin/arm/rightSide.png');

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
let leg_front = new Texture('./skin/leg/front.png');
let leg_back = new Texture('./skin/leg/back.png');
let leg_top = new Texture('./skin/leg/top.png');
let leg_bottom = new Texture('./skin/leg/bottom.png');
let leg_right = new Texture('./skin/leg/right.png');
let leg_left = new Texture('./skin/leg/left.png');

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

