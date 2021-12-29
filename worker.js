const {
    parentPort,
} = require('worker_threads')

const World = require('./modules/World.js');
    
function noise1(nx, ny) { return rng1.noise2D(nx, ny)/2 + 0.5; }
function noise2(nx, ny) { return rng2.noise2D(nx, ny)/2 + 0.5; }

// Setup information

let blockOrder = ["water", "bedrock", "stone", "cobblestone", "dirt", "cobblestone", "grass", "wood", "leaves", "coal_ore", "diamond_ore", "iron_ore", "gold_ore", "crafting_table", "planks", "snow", "snowy_grass", "ice", "ice_packed", "sand", "sandstone", "clay", "gravel", "obsidian", "glowstone", "glass"];
let blockIds = {};
for (let i = 0; i < blockOrder.length; i++) {
    blockIds[blockOrder[i]] = i+1;
}

// Get textures
let itemOrder = ["stick", "wood_sword", "wood_pickaxe", "wood_axe", "wood_shovel", "bow", "arrow", "diamond"];

// Setup world
const cellSize = 16;
const tileSize = 16;
const buildHeight = 128;
const world = new World({
	cellSize,
	tileSize,
	buildHeight,
	blockOrder,
	itemOrder,
});


// Send a message to the main thread.
parentPort.on('message', (data) => {
    if (data.cmd == "seed") {
        world.updateSeed(data.seed);
    } else if (data.cmd == "generateChunks") {
        const { socketId, chunkData } = data;

        let chunks = [];

        for (let data of chunkData) {
            let id = data.id;
            let chunk = data.chunk;
            chunks.push(chunk);

            world.cells[id] = data.cell;
            world.cellDeltas[id] = data.cellDelta;
            world.generateCell(chunk.x, chunk.y, chunk.z, data.cell, data.cellDelta);
        }
        
        parentPort.postMessage({socketId, chunks});
    }
});