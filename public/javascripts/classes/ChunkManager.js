class ChunkManager {
	constructor () {
		// Chunk loading
		this.currCells = {};

		this.chunksToRequest = [];
		this.chunksToLoad = [];
		this.chunksToRender = [];
		this.chunksToUnload = [];

		this.renderDistance = 8; // RENDER DIST
		this.chunkLoadingRate = 1;
		this.chunkTick = Date.now();
		this.chunkDelay = 0;
	}

	unloadChunks() { // OPTIMIZE
		for (let id in this.currCells) {
			let cell = id.split(",");
			let cx = parseInt(cell[0]);
			let cz = parseInt(cell[1]);

			let xDist = this.cellPos.x - cx;
			let zDist = this.cellPos.z - cz;

			let distSquared = xDist * xDist + zDist * zDist

			let renderDist = this.renderDistance * 0.75;

			if (distSquared > renderDist * renderDist) {
				this.chunksToUnload.push({
					x: cx,
					z: cz,
				})

				delete this.currCells[id];
			}
		}
	}

	requestChunks() { // OPTIMIZE
		// Chunks to request
		let {blockSize, cellSize} = world;
		let step = 1;
		let x = 0;
		let z = 0;
		let distance = 0;
	    let range = 1;
	    let direction = 'up';

	    let maxChunkRequests = 5;
	    let requests = 0;
	    for ( let i = 0; i < this.renderDistance*this.renderDistance; i++ ) {
	    	// Add chunks to request
	    	for (let y = 0; y < (world.buildHeight+1)/cellSize; y++) {
	    		let cellX = this.cellPos.x + x;
				let cellY = y;
				let cellZ = this.cellPos.z + z;
				let cellId = `${cellX},${cellY},${cellZ}`
				if (!world.cells[cellId]) { // Check if chunk already exists
					this.chunksToRequest.push({
						x: cellX,
						y: cellY,
						z: cellZ
					})
					requests++;
				} else {
					if (cellIdToMesh[cellId])
						cellIdToMesh[cellId].visible = true;
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
	}

	update(player) {
		if (Date.now()-this.chunkTick < this.chunkDelay)
			return;

		let {blockSize, cellSize} = world;

		// Update chunks
		this.cellPos = world.computeCellFromPlayer(player.position.x, player.position.y, player.position.z);
		this.chunkTick = Date.now();

		// Find chunks to request
		this.requestChunks();

		// Request chunks based on loading rate
		let requestedChunks = [];
		for (let chunk of this.chunksToRequest) {
			if (chunk) {
				world.generateCell(chunk.x, chunk.y, chunk.z)
				requestedChunks.push(chunk);
			}
		}

		if (requestedChunks.length > 0) {
			socket.emit('requestChunk', requestedChunks) // Call server to load this chunk
		}
			
		// Load chunks based on loading rate
		for (var i = 0; i < this.chunkLoadingRate; i++) {
			let chunk = this.chunksToLoad[i];
			if (chunk) {
				this.currCells[`${chunk.x},${chunk.z}`] = 1;
				updateVoxelGeometry(chunk.x*cellSize, chunk.y*cellSize, chunk.z*cellSize);
				this.chunksToLoad.splice(i, 1);
			}
		}

		// Render chunks based on render rate
		for (var i = 0; i < this.chunkLoadingRate; i++) {
			let chunk = this.chunksToRender[i];
			if (chunk) {
				updateCellMesh(chunk)
				this.chunksToRender.splice(i, 1);
			}	
		}

		// Chunks to unload
		this.unloadChunks();

		// Unload chunks based on loading rate
		for (var i = 0; i < this.chunkLoadingRate; i++) {
			let chunk = this.chunksToUnload[i];
			if (chunk) {
				world.deleteCell(chunk, false);
				this.chunksToUnload.splice(i, 1);
			}
		}

		this.chunksToRequest = [];
	}
}