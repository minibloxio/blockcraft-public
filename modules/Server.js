let fs = require('fs');
const THREE = require('three');
const public_path = __dirname + '/../public/';

module.exports = class World {
    constructor(options) {

        this.startTime = Date.now();

        this.textures = {};
        this.blockOrder = [];
        this.itemOrder = [];

        this.operators = [];
        this.blacklist = [];

        this.initTextures();
    }

    initTextures() {
        // BLOCK SPRITES
        let colors = ["black", "blue", "brown", "cyan", "gray", "green", "light_blue", "lime", "magenta", "orange", "pink", "purple", "red", "silver", "white", "yellow"];
        let stoneTypes = ["granite", "andesite", "diorite"];
        this.blockOrder = ["water", "bedrock", "stone", "dirt", "cobblestone", "grass", "log_oak", "leaves_oak", "coal_ore", "diamond_ore", "iron_ore", "gold_ore", "crafting_table", "planks_oak", "snow", "snowy_grass", "ice", "ice_packed", "sand", "sandstone", "clay", "gravel", "obsidian", "glowstone", "coal_block", "iron_block", "gold_block", "diamond_block", "brick", "bookshelf", "cobblestone_mossy", "glass", "wool_colored_white", "stonebrick", "stonebrick_carved", "stonebrick_cracked", "stonebrick_mossy", "furnace", "hay_block", "tnt", "cake", "hardened_clay", "coarse_dirt", "brown_mushroom_block", "red_mushroom_block", "mushroom_stem", "mycelium", "emerald_ore", "emerald_block", "end_stone", "jukebox", "melon", "mob_spawner", "prismarine_bricks", "red_sand", "red_sandstone", "red_sandstone_smooth", "redstone_block", "slime", "soul_sand", "sponge", "sponge_wet"];

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

        // ITEM SPRITES
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

        // ENTITY SPRITES
        this.entityOrder = ["arrow"];

        this.blockId = {};
        for (let i = 0; i < this.blockOrder.length; i++) this.blockId[this.blockOrder[i]] = i+1;

        this.itemId = {};
        for (let i = 0; i < this.itemOrder.length; i++) this.itemId[this.itemOrder[i]] = i+1;

        this.textures = {};
        let self = this;
        // Get block file names
        fs.readdir(public_path + '/textures/blocks', function (err, data) {
            if (err) console.log(err);
            self.textures.blocks = data;
        })
        // Get item file names
        fs.readdir(public_path + '/textures/items', function (err, data) {
            if (err) console.log(err);
            self.textures.items = data;
        })
        // Get entity file names
        fs.readdir(public_path + '/textures/entity', function (err, data) {
            if (err) console.log(err);
            self.textures.entity = data;
        })
        this.textures.blockOrder = this.blockOrder;
        this.textures.itemOrder = this.itemOrder;
        this.textures.entityOrder = this.entityOrder;
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

        let player = {
			id: id,
			name: data.name || ("Player"+Math.floor(Math.random()*9999)),
			pos: {x: 0,y: 0,z: 0},
			vel: {x: 0,y: 0,z: 0},
			rot: {x: 0,y: 0,z: 0},
			dir: {x: 0,y: 0,z: 0},
			hp: 20,
			dead: false,
			toolbar: [
				this.getEntity("wood_sword"), 
				this.getEntity("wood_pickaxe"), 
				this.getEntity("wood_axe"), 
				this.getEntity("bow"), 
				this.getEntity("arrow", 64),
				this.getEntity("fireball", 16),
                this.getEntity("ender_pearl", 16),
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
            biome: "",
            operator: this.operators.includes(data.token),
		}

        return player;
    }

    // Add entity
    addEntity(id, data) {
        let entity = {
            id: id,
            pos: new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z),
            vel: new THREE.Vector3(data.vel.x, data.vel.y, data.vel.z),
            acc: new THREE.Vector3(),
            force: data.force,
            type: "item",
            v: data.v,
            class: data.class || "block",
            playerId: data.playerId,
            name: data.name,
            t: Date.now(),
            onObject: false,
        }

        return entity;
    }

    // Add server operator
    setOperator(fs, isOp, player) {
        if (!player) return;

        if (isOp && !this.operators.includes(player.token)) {
            this.operators.push(player.token);
            fs.writeFile(__dirname + '/../operators.json', JSON.stringify(this.operators), function (err) {
                if (err) console.log(err);
            });
        } else if (!isOp) {
            for (let i = 0; i < this.operators.length; i++) {
                if (this.operators[i] == player.token) {
                    this.operators.splice(i, 1);
                    break;
                }
            }
            fs.writeFile(__dirname + '/../operators.json', JSON.stringify(this.operators), function (err) {
                if (err) console.log(err);
            });
        }
    }

    // Set blacklist
    setBlacklist(fs, ban, player) {
        if (!player) return;
        
        let isBanned = false;
        for (let i = 0; i < this.blacklist.length; i++) {
            if (this.blacklist[i].token == player.token || this.blacklist[i].ip == player.ip) {
                isBanned = true;
                break;
            }
        }

        if (ban && !isBanned) {
            this.blacklist.push({
                name: player.name,
                token: player.token,
                ip: player.ip,
            });
            fs.writeFile(__dirname + '/../blacklist.json', JSON.stringify(this.blacklist), function (err) {
                if (err) console.log(err);
            });
            return true;
        } else if (!ban) {
            let success = false;
            for (let i = 0; i < this.blacklist.length; i++) {
                if (this.blacklist[i].name == player.name) {
                    this.blacklist.splice(i, 1);
                    success = true;
                    break;
                }
            }
            fs.writeFile(__dirname + '/../blacklist.json', JSON.stringify(this.blacklist), function (err) {
                if (err) console.log(err);
            });
            return success;
        }
        return false; // Already banned
    }

    // Check blacklist
    checkBlacklist(io, socket, check) {
        let blacklisted = false;
        for (let player of this.blacklist) {
            if (player.ip == check || player.token == check) {
                blacklisted = true;
                break;
            }
        }

        if (blacklisted) {
            socket.emit('joinResponse', {
                blacklisted: true,
            });
            io.to(`${socket.id}`).disconnectSockets();
            return;
        }
    }

    // Update players
    updatePlayers(players, world, logger, io, addLog) {
        let regenTick = world.tick % 50 == 0;
        let voidTick = (world.tick+5) % 10 == 0;

        for (let id in players) {
            let player = players[id];
            
            // Check if the player is dead
            if (player.hp <= 0 && !player.dead) {
                player.dead = true;
                let txt = player.name;
                
                if (player.dmgType.includes("arrow")) {
                    let name = player.dmgType.replace('arrow','');
                    txt += " was sniped by " + name;
                } else if (player.dmgType == "drowning") {
                    txt += " has drowned";
                } else if (player.dmgType == "fall") {
                    txt += " fell off a cliff";
                } else if (player.dmgType == "void") {
                    txt += " fell out of the world";
                } else if (player.dmgType == "command") {
                    txt += " was killed by a command";
                } else if (player.dmgType) {
                    txt += " was slain by " + player.dmgType
                } else {
                    txt += " has died";
                }
    
                logger.info(txt);
    
                io.emit('messageAll', {
                    text: txt
                })
    
                addLog(id, "d"); // Deaths
            } else if (!player.dead && player.hp > 0) {
                // Update player position in biome
                player.biome = world.generator.getColumnInfo(player.pos.x/world.blockSize, player.pos.z/world.blockSize)[2];
                
                // Regenerate health
                if (regenTick) players[id].hp = Math.min(players[id].hp + 1, 20);

                // Check if the player is in the void
                if (voidTick && player.pos.y < -world.blockSize*64) {
                    player.hp -= 2;
                    player.dmgType = "void";
                    io.to(`${player.id}`).emit('damage');
                }
            }
        }
    }
}