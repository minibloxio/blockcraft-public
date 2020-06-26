
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
			this.loaded = 
				this.texture.map((url) => {
			      return loader.load(url);
			    })
			if (options.type === "basic") {
				this.material = this.loaded.map((texture) => {
			      return new THREE.MeshBasicMaterial({map: texture})
			    })[0];
			} else {
				this.material = this.loaded.map((texture) => {
				      return new THREE.MeshStandardMaterial({map: texture})
				    })[0];
			}
				
			this.material.side = THREE.FrontSide;
			this.material.metalness = options.metalness || 0;
			this.material.roughness = 0.5
			this.material.transparent = false;
		}
	}
}

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

var blockSize = 16;
var blocks = [];

var blockGeometry = new THREE.BoxGeometry( blockSize, blockSize, blockSize );

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