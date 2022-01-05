let fs = require('fs');
const public_path = __dirname + '/../public/';

module.exports = class World {
    constructor(options) {

        this.startTime = Date.now();

        this.textures = {};
        this.blockOrder = [];
        this.itemOrder = [];

        this.initTextures();
    }

    initTextures() {
        // Get textures
        let colors = ["black", "blue", "brown", "cyan", "gray", "green", "light_blue", "lime", "magenta", "orange", "pink", "purple", "red", "silver", "white", "yellow"];
        let stoneTypes = ["granite", "andesite", "diorite"];
        this.blockOrder = ["water", "bedrock", "stone", "dirt", "cobblestone", "grass", "log_oak", "leaves_oak", "coal_ore", "diamond_ore", "iron_ore", "gold_ore", "crafting_table", "planks", "snow", "snowy_grass", "ice", "ice_packed", "sand", "sandstone", "clay", "gravel", "obsidian", "glowstone", "coal_block", "iron_block", "gold_block", "diamond_block", "brick", "bookshelf", "cobblestone_mossy", "glass", "wool_colored_white", "stonebrick", "stonebrick_carved", "stonebrick_cracked", "stonebrick_mossy", "furnace", "hay_block", "tnt", "cake", "hardened_clay", "coarse_dirt", "brown_mushroom_block", "red_mushroom_block", "mushroom_stem", "mycelium", "emerald_ore", "emerald_block", "end_stone", "jukebox", "melon", "mob_spawner", "prismarine_bricks", "red_sand", "red_sandstone", "red_sandstone_smooth", "redstone_block", "slime", "soul_sand", "sponge", "sponge_wet"];

        let woodTypes = ["spruce", "birch", "jungle", "acacia", "big_oak"];
        for (let type of woodTypes) {
            this.blockOrder.push("log_"+type);
            this.blockOrder.push("log_"+type+"_top");
            this.blockOrder.push("planks_"+type);
            this.blockOrder.push("leaves_"+type);
        }


        for (let color of colors) {
            this.blockOrder.push("wool_colored_" + color);
            this.blockOrder.push("glass_" + color);
            this.blockOrder.push("hardened_clay_stained_" + color);
        }

        for (let stoneType of stoneTypes) {
            this.blockOrder.push("stone_" + stoneType);
            this.blockOrder.push("stone_" + stoneType+ "_smooth");
        }

        let tools = ["pickaxe", "axe", "shovel", "sword"];
        let toolMat = ["wood", "stone", "iron", "gold", "diamond"];
        let foods = ["beef", "chicken", "porkchop", "mutton", "rabbit"];
        this.itemOrder = ["bucket_empty", "stick", "string", "bow", "arrow", "coal", "iron_ingot", "gold_ingot", "diamond", "emerald", "apple", "apple_golden", "bread", "carrot", "cookie", "egg", "potato", "potato_baked", "wheat", "clay_ball",  "flint", "flint_and_steel", "brick", "glowstone_dust", "snowball", "ender_pearl", "fireball", "sign"];
        for (let mat of toolMat) {
            for (let tool of tools) {
                this.itemOrder.push(mat + "_" + tool);
            }
        }
        for (let food of foods) {
            this.itemOrder.push(food+"_raw");
            this.itemOrder.push(food+"_cooked");
        }

        this.blockId = {};
        for (let i = 0; i < this.blockOrder.length; i++) this.blockId[this.blockOrder[i]] = i+1;

        this.itemId = {};
        for (let i = 0; i < this.itemOrder.length; i++) this.itemId[this.itemOrder[i]] = i+1;

        this.textures = {};
        let self = this;
        fs.readdir(public_path + '/textures/blocks', function (err, data) {
            if (err) console.log(err);
            self.textures.blocks = data;
        })
        fs.readdir(public_path + '/textures/items', function (err, data) {
            if (err) console.log(err);
            self.textures.items = data;
        })
        this.textures.blockOrder = this.blockOrder;
        this.textures.itemOrder = this.itemOrder;
        this.textures.tileSize = 16;
        this.textures.tileTextureWidth = 4096;
        this.textures.tileTextureHeight = 64;
    }

    // Get entity by name
    getEntity(name, count) {
        if (this.blockId[name]) {
            return {
                v: this.blockId[name],
                c: count || 1,
                class: "block"
            }
        } else if (this.itemId[name]) {
            return {
                v: this.itemId[name],
                c: count || 1,
                class: "item"
            }
        }
    }

    // Add player
    addPlayer(id, data) {
        if (!data) data = {};

        return {
			id: id,
			name: data.name || ("Player"+Math.floor(Math.random()*9999)),
			pos: {x: 0,y: 0,z: 0},
			vel: {x: 0,y: 0,z: 0},
			rot: {x: 0,y: 0,z: 0},
			dir: {x: 0,y: 0,z: 0},
			hp: 10,
			dead: false,
			toolbar: [
				this.getEntity("wood_sword"), 
				this.getEntity("wood_pickaxe"), 
				this.getEntity("wood_axe"), 
				this.getEntity("bow"), 
				this.getEntity("arrow", 64),
				this.getEntity("log_oak", 64),
                this.getEntity("ender_pearl", 64),
			],
			walking: false,
			sneaking: false,
			punching: false,
			currSlot: 0,
			pickupDelay: Date.now(),
			ping: [],
			connected: true,
			mode: "survival",
			fps: 0,
            showInventory: false,
            token: data.token || "",
		}
    }

    // Add entity
    addEntity(id, data) {
        let entity = {
            pos: data.pos,
            vel: data.vel,
            acc: {x: 0, y: 0, z: 0},
            force: data.force,
            lethal: data.lethal,
            type: "item",
            v: data.v,
            class: data.class || "block",
            id: id,
            playerId: data.playerId,
            name: data.name,
            t: Date.now(),
            onObject: false,
        }

        return entity;
    }
}