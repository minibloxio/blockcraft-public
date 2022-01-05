const {
    parentPort,
} = require('worker_threads')

const World = require('./modules/World.js');
const WorldGeneration = require('./modules/WorldGeneration.js');
let generator = new WorldGeneration();
    
function noise1(nx, ny) { return rng1.noise2D(nx, ny)/2 + 0.5; }
function noise2(nx, ny) { return rng2.noise2D(nx, ny)/2 + 0.5; }

// Setup world
const world = new World();

// Send a message to the main thread.
parentPort.on('message', (data) => {
    if (data.cmd == "setup") {
        world.init({
            blockOrder: data.blockOrder, 
            itemOrder: data.itemOrder
        });
    } else if (data.cmd == "seed") {
        generator.updateSeed(data.seed);
    } else if (data.cmd == "generateChunks") {
        const { socketId, chunkData } = data;

        let chunks = [];

        for (let data of chunkData) {
            let id = data.id;
            let chunk = data.chunk;
            chunks.push(chunk);
            world.cells[id] = data.cell;
            world.cellDeltas[id] = data.cellDelta;
            generator.generateCell(chunk.x, chunk.y, chunk.z, world, data.cellExists);
        }
        
        parentPort.postMessage({socketId, chunks});
    }
});