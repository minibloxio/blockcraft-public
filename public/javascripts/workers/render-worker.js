let world, cellPos, renderDistance, currChunks;

self.addEventListener('message', e => {

	if (e.data.cellSize) {
        world = e.data;
        console.log(world);
    } else if (!e.data.cellSize && e.data.cells) {
        for (let cellId in e.data.cells) {
            world.cells[cellId] = e.data.cells[cellId];
        }
    } else {
        cellPos = e.data.cellPos;
        renderDistance = e.data.renderDistance;
        currChunks = e.data.currChunks;
        
        if (!world) return;
        self.postMessage(requestChunks());
    }
    
});

function requestChunks() {
    // Chunks to request
    let chunksToRequest = [];
    let chunksToVisible = [];

    let {cellSize} = world;
    let step = 1;
    let x = 0;
    let z = 0;
    let distance = 0;
    let range = 1;
    let direction = 'up';

    let maxChunkRequests = 1;
    let requests = 0;
    for ( let i = 0; i < renderDistance*renderDistance; i++ ) {
        // Add chunks to request
        for (let y = 0; y < (world.buildHeight+1)/cellSize; y++) {
            let cellX = cellPos.x + x;
            let cellY = y;
            let cellZ = cellPos.z + z;
            let cellId = cellX + "," + cellY + "," + cellZ;

            if (!world.cells[cellId]) { // Check if chunk already exists
                chunksToRequest.push({
                    x: cellX,
                    y: cellY,
                    z: cellZ
                })
                requests++;
            } else {
                chunksToVisible.push(cellId);
            }
        }

        if (requests > maxChunkRequests)
            break;
        
        distance++;
        switch ( direction ) {
            case 'up':
                z += step;
                if ( distance >= range ) {
                    direction = 'right';
                    distance = 0;
                }
                break;
            case 'right':
                x += step;
                if ( distance >= range ) {
                    direction = 'bottom';
                    distance = 0;
                    range += 1;
                }
                break;
            case 'bottom':
                z -= step;
                if ( distance >= range ) {
                    direction = 'left';
                    distance = 0;
                }
                break;
            case 'left':
                x -= step;
                if ( distance >= range ) {
                    direction = 'up';
                    distance = 0;
                    range += 1;
                }
                break;
            default:
                break;
        }
    }

    return {
        chunksToRequest,
        chunksToVisible
    };
}