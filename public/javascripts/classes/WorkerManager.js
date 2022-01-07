class WorkerManager {
    constructor() {
        this.rle;
        this.voxels = [];
        this.voxelIndex = 0;

        this.initWorkers();
    }

    updateRLEWorker(data) {
        this.rle.postMessage(data);
    }

    updateVoxelWorkers(cells) {
        this.voxels[this.voxelIndex].postMessage(cells)
        this.voxelIndex = (this.voxelIndex + 1) % this.voxels.length;
    }

    updateVoxelData(data) {
        for (let worker of this.voxels) {
            worker.postMessage(data);
        }
    }

    // Initialize web workers
    initWorkers() {
        this.rle = new Worker('javascripts/workers/rle-worker.js'); // Run length encoding worker

        this.rle.addEventListener('message', async(e) => {
            await chunkManager.processChunks(e.data, "rle");
        })

        // Voxel geometry workers
        for (let i = 0; i < game.numOfVoxelWorkers; i++) {
            this.voxels.push(new Worker('javascripts/workers/voxel-worker.js'));
            this.voxels[i].addEventListener('message', async(e) => {
                await chunkManager.processChunks(e.data, "voxel");
            })
            this.voxels[i].postMessage({
                type: 'updateTransparency',
                transparentLeaves: game.transparentLeaves,
            });
        }
    }
}