const {
    parentPort,
} = require('worker_threads')

const World = require('./modules/World.js');
var SimplexNoise = require('simplex-noise'),
    rng1 = new SimplexNoise(Math.random),
    rng2 = new SimplexNoise(Math.random)
    
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
    const { cmd, socketId, chunk, id, cell, cellDelta } = data;

    world.cells[id] = cell;
    world.cellDeltas[id] = cellDelta;
    let newCells = world.generateCell(chunk.x, chunk.y, chunk.z, cell, cellDelta);
    //console.log(newCells);
    
    parentPort.postMessage({socketId, id, chunk});
})