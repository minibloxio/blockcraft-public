const {
    parentPort,
} = require('worker_threads')

const World = require('./modules/World.js');
    
function noise1(nx, ny) { return rng1.noise2D(nx, ny)/2 + 0.5; }
function noise2(nx, ny) { return rng2.noise2D(nx, ny)/2 + 0.5; }

// Setup world
const world = new World();

// Send a message to the main thread.
parentPort.on('message', (data) => {
    if (data.cmd == "setup") {
        world.init(data.blockOrder, data.itemOrder);
        console.log(world);
    } else if (data.cmd == "seed") {
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