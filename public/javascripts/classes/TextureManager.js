// Texture class
class Texture {
	constructor(loader, textureUrl, material) {
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
			this.material.transparent = true;
		}
	}
}

class TextureManager {
    constructor() {
        // Texture Loader
        this.loader = new THREE.TextureLoader();
        this.loader.setPath("textures/");

        // Font Loader
        this.fontLoader = new THREE.FontLoader();
        this.minecraft_font = undefined;

        // Mining progress
        this.mining_progress = [];
        for (let i = 0; i < 11; i++) {
            this.mining_progress.push(new Texture(this.loader, './progress/' + i + '.png'));
        }

        // Texture atlas
        this.texture_atlas = undefined;
        this.item_atlas = undefined;

        // Materials (used for rendering)
        this.material = undefined;
        this.materialTransparent = undefined;
        
        // Setup configuration
        this.config();
    }

    // Configure the texture manager
    config() {
        this.blocks = {
            "water": "water_clear",
            "grass": ["grass_side", "dirt", "grass_top"],
            "snowy_grass": ["grass_side_snowed", "dirt", "snow"],
            "wood": ["log_oak", "log_oak_top", "log_oak_top"],
            "leaves": "leaves_oak",
            "crafting_table": ["crafting_table_front", "planks_oak", "crafting_table_top"],
            "planks": "planks_oak",
            "sandstone": ["sandstone_normal", "sandstone_bottom", "sandstone_top"],
            "bookshelf": ["bookshelf", "planks_oak", "planks_oak"],
            "furnace": ["furnace_front_off", "furnace_side", "furnace_top"],
            "hay_block": ["hay_block_side", "hay_block_top", "hay_block_top"],
            "cake": ["cake_side", "cake_bottom", "cake_top"],
            "tnt": ["tnt_side", "tnt_bottom", "tnt_top"],
            "mycelium": ["mycelium_side", "dirt", "mycelium_top"],
            "brown_mushroom_block": "mushroom_block_skin_brown",
            "red_mushroom_block": "mushroom_block_skin_red",
            "mushroom_stem": ["mushroom_block_skin_stem", "mushroom_block_inside", "mushroom_block_inside"],
        }

        this.blockFaces = {};
        this.blockOrder = undefined;

        this.items = {
            "bow": ["bow_standby", "bow_pulling_0", "bow_pulling_1", "bow_pulling_2"]
        }
        this.itemFaces = {};
    }

    // Get the texture atlas
    getTextureAtlas(type) {
        return type == "item" ? textureManager.item_atlas : textureManager.texture_atlas;
    }

    // Load textures
    loadTextures(data) {
        let self = this;
        let t = Date.now();
        console.log("Loading textures...");
        
        this.loadBlockImages(data.blocks, data.blockOrder)
        this.loadItemImages(data.items, data.itemOrder);

        this.fontLoader.load( './textures/font/Minecraft_Regular.json', function ( font ) {
            self.minecraft_font = font;
            loaded += 1;
            console.log("Done loading font in " + (Date.now() - t) + "ms");
        });
    }

    // Load block images
    loadBlockImages(block_names, block_order) {
        let self = this;
        this.loader.setPath("textures/blocks/");
        let loading_index = 0;

        for (let name of block_names) {
            this.blockFaces[name.slice(0, -4)] = this.loader.load(name, function () {
                loading_index += 1;
                
                if (loading_index == block_names.length) {
                    loaded += 1;
                    self.setTexture(block_order); // Merge block textures
                }
            })
        }
    }

    // Load item images
    loadItemImages(item_names, item_order) {
        let self = this;
        this.loader.setPath("textures/items/");
        let loading_index = 0;

        for (let name of item_names) {
            this.itemFaces[name.slice(0, -4)] = this.loader.load(name, function () {
                loading_index += 1;
                
                if (loading_index == item_names.length) {
                    self.setTexture(item_order);
                }
            })
        }
    }
    
    // Set the texture atlas
    setTexture(order) {
        let canvas = document.createElement("canvas");
        let ctx_ = canvas.getContext("2d");
        canvas.width = world.tileTextureWidth;
        canvas.height = world.tileTextureHeight;

        this.drawImageNet(ctx_, order, this.blocks);

        canvas = TextureManager.makeCanvasPowerOfTwo(canvas);

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        ctx_.drawImage(texture.image, 500, 500)

        let settings = {
            map: texture,
            side: THREE.FrontSide, // Default: FrontSide
            transparent: false,
            depthWrite: true
        }

        let textureType = getCookie("Material Texture") || "lambert";

        switch (textureType) {
            case "basic":
            this.material = new THREE.MeshBasicMaterial(settings);
            this.materialTransparent = new THREE.MeshBasicMaterial(settings);
            break;
            case "lambert":
            this.material = new THREE.MeshLambertMaterial(settings);
            this.materialTransparent = new THREE.MeshLambertMaterial(settings);
            break;
            case "phong":
            this.material = new THREE.MeshPhongMaterial(settings);
            this.materialTransparent = new THREE.MeshPhongMaterial(settings);
            break;
            case "standard":
            this.material = new THREE.MeshStandardMaterial(settings);
            this.materialTransparent = new THREE.MeshStandardMaterial(settings);
            break;
            case "toon":
            this.material = new THREE.MeshToonMaterial(settings);
            this.materialTransparent = new THREE.MeshToonMaterial(settings);
            break;
        }
        
        this.materialTransparent.side = THREE.DoubleSide;
        this.materialTransparent.transparent = true;
        //this.materialTransparent.depthWrite = false;

        //this.materialTransparent.dithering = true;
        // this.materialTransparent.polygonOffset = true;
        // this.materialTransparent.polygonOffsetFactor = -4;
        //this.materialTransparent.alphaTest = 0.3;
        //this.materialTransparent.clipIntersection = true;

        this.texture_atlas = texture.image;
    }

    // Draw the image net
    drawImageNet(ctx_, order, entities) {
        let index = 0;
        for (let entity of order) {
            let b = entities[entity];
            if (b instanceof Array) {
                for (let i = 0; i < 3; i++) {
                    ctx_.drawImage(this.blockFaces[b[i]].image, index*16, i*16)
                }
            } else if (b) {
                ctx_.drawImage(this.blockFaces[b].image, index*16, 0)
                ctx_.drawImage(this.blockFaces[b].image, index*16, 16)
                ctx_.drawImage(this.blockFaces[b].image, index*16, 32)
            } else {
                ctx_.drawImage(this.blockFaces[entity].image, index*16, 0)
                ctx_.drawImage(this.blockFaces[entity].image, index*16, 16)
                ctx_.drawImage(this.blockFaces[entity].image, index*16, 32)
            }
            index++;
        }
    }

    // Load item images
    loadItemImages(item_names, item_order) {
        let self = this;
        loader.setPath("textures/items/");
        let loading_index = 0;
        this.t = Date.now();

        for (let name of item_names) {
            this.itemFaces[name.slice(0, -4)] = loader.load(name, function () {
                loading_index += 1;
                
                if (loading_index == item_names.length) {
                    loaded += 1;
                    self.mergeItemTextures(item_order);
                }
            })
        }
    }

    // Merge item textures
    mergeItemTextures(order) {
        let canvas = document.createElement("canvas");
        let ctx_ = canvas.getContext("2d");
        canvas.width = world.tileTextureWidth;
        canvas.height = world.tileTextureHeight;
      
        let index = 0;
        for (let item of order) {
            let b = this.items[item];
            if (b instanceof Array) {
                for (let i = 0; i < b.length; i++) {
                ctx_.drawImage(this.itemFaces[b[i]].image, index*16, i*16)
                }
            } else {
                ctx_.drawImage(this.itemFaces[item].image, index*16, 0)
            }
            index++;
        }
      
        canvas = TextureManager.makeCanvasPowerOfTwo(canvas);
      
        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = undefined;
        texture.wrapT = undefined;
        texture.needsUpdate = true;
      
        this.item_atlas = texture.image;
      
        loaded += 1;
        console.log("Done stitching item textures in " + (Date.now() - this.t) + "ms");
    }
    
    // Make canvas power of two
    static makeCanvasPowerOfTwo(canvas) {
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

    // Load sprite
    static loadSprite(path) {
        let map = loader.load( path );
        let material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: false } );
        let sprite = new THREE.Sprite( material );
        sprite.scale.set(4000, 4000);
        return sprite;
    }
}