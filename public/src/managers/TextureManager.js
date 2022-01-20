import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import world from './WorldManager';
import game from '../Game';
import Cookies from "js-cookie";

import { g } from "../globals"



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

export class TextureManager {
    constructor() {
        // Texture Loader
        this.loader = new THREE.TextureLoader();
        this.loader.setPath("textures/");

        // Font Loader
        this.fontLoader = new FontLoader();
        this.minecraft_font = undefined;

        // Mining progress
        this.mining_progress = [];
        for (let i = 0; i < 11; i++) {
            this.mining_progress.push(new Texture(this.loader, './progress/' + i + '.png'));
        }

        // Texture atlas
        this.texture_atlas = undefined;
        this.item_atlas = undefined;
        this.entity_atlas = undefined;

        // Materials (used for rendering)
        this.material = undefined;
        this.materialTransparent = undefined;

        // Setup configuration
        this.config();
    }

    // Configure the texture manager
    config() {
        // BLOCK TEXTURES
        this.blocks = {
            "water": "water_clear",
            "grass": ["grass_side", "dirt", "grass_top", "grass_side_overlay"],
            "snowy_grass": ["grass_side_snowed", "dirt", "snow"],
            "crafting_table": ["crafting_table_front", "planks_oak", "crafting_table_top"],
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
            "jukebox": ["jukebox_side", "jukebox_side", "jukebox_top"],
            "log_oak": ["log_oak", "log_oak_top", "log_oak_top"],
            "log_acacia": ["log_acacia", "log_acacia_top", "log_acacia_top"],
            "log_big_oak": ["log_big_oak", "log_big_oak_top", "log_big_oak_top"],
            "log_birch": ["log_birch", "log_birch_top", "log_birch_top"],
            "log_jungle": ["log_jungle", "log_jungle_top", "log_jungle_top"],
            "log_spruce": ["log_spruce", "log_spruce_top", "log_spruce_top"],
            "melon": ["melon_side", "melon_top", "melon_top"],
            "red_sandstone": ["red_sandstone_normal", "red_sandstone_bottom", "red_sandstone_top"],
            "red_sandstone_smooth": ["red_sandstone_smooth", "red_sandstone_bottom", "red_sandstone_top"],
        }

        this.colormap = {
            "leaves_oak": [30, 200, 0],
            "leaves_spruce": [97, 165, 124],
            "leaves_birch": [51, 160, 26],
            "leaves_jungle": [30, 240, 0],
            "leaves_acacia": [76, 168, 32],
            "leaves_big_oak": [71, 160, 29],
            "grass_top": [134, 200, 95],
            "leather_helmet": [89, 56, 36],
            "leather_chestplate": [89, 56, 36],
            "leather_leggings": [89, 56, 36],
            "leather_boots": [89, 56, 36],
        }

        this.blockFaces = {};
        this.blockOrder = undefined;

        // ITEM TEXTURES
        this.items = {
            "bow": ["bow_standby", "bow_pulling_0", "bow_pulling_1", "bow_pulling_2"],
            "leather_helmet": ["leather_helmet", "leather_helmet_overlay"],
            "leather_chestplate": ["leather_chestplate", "leather_chestplate_overlay"],
            "leather_leggings": ["leather_leggings", "leather_leggings_overlay"],
            "leather_boots": ["leather_boots", "leather_boots_overlay"],
        }
        this.itemFaces = {};

        // ENTITY TEXTURES
        this.entityFaces = {};
        this.entities = {};
    }

    // Get the texture atlas
    getTextureAtlas(type) {
        if (type == "item") {
            return this.item_atlas;
        } else if (type == "entity") {
            return this.entity_atlas;
        } else {
            return this.texture_atlas;
        }
    }

    // Load textures
    loadTextures(data) {
        let self = this;
        let t = Date.now();

        this.loadBlockImages(data.blocks, data.blockOrder)
        this.loadItemImages(data.items, data.itemOrder);
        this.loadEntityImages(data.entity, data.entityOrder);

        this.fontLoader.load('./textures/font/Minecraft_Regular.json', function (font) {
            self.minecraft_font = font;
            g.loaded += 1;
            console.log("Done loading font in " + (Date.now() - t) + "ms");
        });
    }

    // Load entity images
    loadEntityImages(entity_names, entity_order) {
        let self = this;
        this.loader.setPath("textures/entity/");
        let loading_index = 0;

        for (let name of entity_names) {
            this.entityFaces[name.slice(0, -4)] = this.loader.load(name, function () {
                loading_index += 1;

                if (loading_index == entity_names.length) {
                    g.loaded += 1;
                    self.mergeEntityTextures(entity_order); // Merge block textures
                }
            })
        }
    }

    // Merge entity textures
    mergeEntityTextures(order) {
        let canvas = document.createElement("canvas");
        let ctx_ = canvas.getContext("2d");
        canvas.width = world.tileTextureWidth;
        canvas.height = world.tileTextureHeight;

        let index = 0;
        for (let entity of order) {
            let b = this.entities[entity];
            if (b instanceof Array) {
                for (let i = 0; i < b.length; i++) {
                    ctx_.drawImage(this.entityFaces[b[i]].image, index * 16, i * 16)
                }
            } else {
                ctx_.drawImage(this.entityFaces[entity].image, index * 16, 0)
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

        this.entity_atlas = texture.image;

        g.loaded += 1;
        console.log("Done stitching entity textures in " + (Date.now() - this.t) + "ms");
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
                    g.loaded += 1;
                    self.setTexture(block_order); // Merge block textures
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

        let textureType = Cookies.get("Material Texture") || "lambert";

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
        this.materialTransparent.depthWrite = game.depthWrite;

        //this.materialTransparent.dithering = true;
        // this.materialTransparent.polygonOffset = true;
        // this.materialTransparent.polygonOffsetFactor = -4;
        //this.materialTransparent.alphaTest = 0.3;
        //this.materialTransparent.clipIntersection = true;

        this.texture_atlas = texture.image;

        console.log("Done stitching block textures in " + (Date.now() - this.t) + "ms");
    }

    // Draw the image net
    drawImageNet(ctx_, order, entities) {
        let index = 0;
        for (let entity of order) {
            let b = entities[entity];
            //console.log(entity);

            if (b instanceof Array) { // Unique block faces
                for (let i = 0; i < 3; i++) {
                    if (b[i] != "grass_side") {
                        ctx_.drawImage(this.blockFaces[b[i]].image, index * 16, i * 16)

                        if (Object.keys(this.colormap).includes(b[i])) {

                            let imageData = ctx_.getImageData(index * 16, i * 16, 16, 16);

                            this.tintImageData(imageData.data, this.colormap["grass_top"]);
                            ctx_.drawImage(this.blockFaces[b[i]].image, index * 16, i * 16)
                            ctx_.putImageData(imageData, index * 16, i * 16);
                        }
                    } else {
                        ctx_.drawImage(this.blockFaces[b[i]].image, index * 16, i * 16);
                        ctx_.drawImage(this.blockFaces[b[3]].image, index * 16, i * 16)
                        let imageData = ctx_.getImageData(index * 16, i * 16, 16, 16);
                        this.tintImageData(imageData.data, this.colormap["grass_top"], true);
                        ctx_.putImageData(imageData, index * 16, i * 16);
                    }

                }

            } else if (b) { // Single block face with custom name
                this.drawImage(ctx_, this.blockFaces[b].image, index);
            } else if (Object.keys(this.colormap).includes(entity)) { // Custom color
                let color = this.colormap[entity];

                ctx_.drawImage(this.blockFaces[entity].image, index * 16, 0);
                let imageData = ctx_.getImageData(index * 16, 0, 16, 16);

                this.tintImageData(imageData.data, color);
                this.drawImage(ctx_, imageData, index, true);
            } else { // Default block face
                this.drawImage(ctx_, this.blockFaces[entity].image, index);
            }

            index++;
        }
    }

    tintImageData(data, color, firstFourRows, force) {
        for (var i = 0; i < data.length; i += 4) {
            if (i > 256 && firstFourRows) return;
            let sameColor = data[i] == data[i + 1] && data[i + 1] == data[i + 2];
            if (data[i + 3] != 0 && sameColor || (force)) {
                data[i] = data[i] / 255 * color[0];
                data[i + 1] = data[i + 1] / 255 * color[1];
                data[i + 2] = data[i + 2] / 255 * color[2];
            }
        }
    }

    static tintImageData(data, color, firstFourRows, force) {
        for (var i = 0; i < data.length; i += 4) {
            if (i > 256 && firstFourRows) return;
            let sameColor = data[i] == data[i + 1] && data[i + 1] == data[i + 2];
            if (data[i + 3] != 0 && sameColor || (force)) {
                data[i] = data[i] / 255 * color[0];
                data[i + 1] = data[i + 1] / 255 * color[1];
                data[i + 2] = data[i + 2] / 255 * color[2];
            }
        }
        return data;
    }

    drawImage(ctx_, image, index, put) {
        if (put) {
            ctx_.putImageData(image, index * 16, 0);
            ctx_.putImageData(image, index * 16, 16);
            ctx_.putImageData(image, index * 16, 32);
        } else {
            ctx_.drawImage(image, index * 16, 0);
            ctx_.drawImage(image, index * 16, 16);
            ctx_.drawImage(image, index * 16, 32);
        }
    }

    // Load item images
    loadItemImages(item_names, item_order) {
        let self = this;
        this.loader.setPath("textures/items/");
        let loading_index = 0;
        this.t = Date.now();

        for (let name of item_names) {
            this.itemFaces[name.slice(0, -4)] = this.loader.load(name, function () {
                loading_index += 1;

                if (loading_index == item_names.length) {
                    g.loaded += 1;
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
                if (item.includes("leather")) {
                    let color = this.colormap[item];

                    ctx_.drawImage(this.itemFaces[b[0]].image, index * 16, 0);
                    let imageData = ctx_.getImageData(index * 16, 0, 16, 16);

                    this.tintImageData(imageData.data, color);
                    ctx_.putImageData(imageData, index * 16, 0);

                    ctx_.drawImage(this.itemFaces[b[1]].image, index * 16, 0);
                } else {
                    for (let i = 0; i < b.length; i++) {
                        ctx_.drawImage(this.itemFaces[b[i]].image, index * 16, i * 16)
                    }
                }
            } else {
                ctx_.drawImage(this.itemFaces[item].image, index * 16, 0)
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

        g.loaded += 1;
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
    loadSprite(path) {
        let map = this.loader.load(path);
        let material = new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: false });
        let sprite = new THREE.Sprite(material);
        sprite.scale.set(4000, 4000);
        return sprite;
    }
}
const textureManager = new TextureManager();
export default textureManager;
