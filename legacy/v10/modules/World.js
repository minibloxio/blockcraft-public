
var SimplexNoise = require('simplex-noise'),
    noise = new SimplexNoise(Math.random)

let blockId = {
  "bedrock": 1,
  "stone": 2,
  "dirt": 3,
  "cobblestone": 4,
  "grass": 5
}

function blockToID(blockName) {
  return blockId[blockName]
}
   
module.exports = class World {
  constructor(options) {
  	this.blockSize = 16;
    this.cellSize = options.cellSize;
    this.tileSize = options.tileSize;
    this.tileTextureWidth = options.tileTextureWidth;
    this.tileTextureHeight = options.tileTextureHeight;
    const {cellSize} = this;
    this.cellSliceSize = cellSize * cellSize;
    this.cells = {};

    this.seed = Math.random();
    noise = new SimplexNoise(this.seed);
  }
  static euclideanModulo(a,b){return(a%b+b)%b}
  computeVoxelOffset(x, y, z) {
    const {cellSize, cellSliceSize} = this;
    const voxelX = World.euclideanModulo(x, cellSize) | 0;
    const voxelY = World.euclideanModulo(y, cellSize) | 0;
    const voxelZ = World.euclideanModulo(z, cellSize) | 0;
    return voxelY * cellSliceSize +
           voxelZ * cellSize +
           voxelX;
  }
  computeCellId(x, y, z) {
    const {cellSize} = this;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    const cellZ = Math.floor(z / cellSize);
    return `${cellX},${cellY},${cellZ}`;
  }
  computeCellFromPlayer(x, y, z) {
    const {cellSize} = this;
    const cellX = Math.floor(x / cellSize / blockSize);
    const cellY = Math.floor(y / cellSize / blockSize);
    const cellZ = Math.floor(z / cellSize / blockSize);
    return {
      x: cellX,
      y: cellY,
      z: cellZ,
      id: `${cellX},${cellY},${cellZ}`
    }
  }
  addCellForVoxel(x, y, z) {
    const cellId = this.computeCellId(x, y, z);
    let cell = this.cells[cellId];
    if (!cell) {
      const {cellSize} = this;
      cell = new Uint8Array(cellSize * cellSize * cellSize);
      this.cells[cellId] = cell;
    }
    return cell;
  }
  getCellForVoxel(x, y, z) {
    return this.cells[this.computeCellId(x, y, z)];
  }
  setVoxel(x, y, z, v, addCell = true) {
    let cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      if (!addCell) {
        return;
      }
      cell = this.addCellForVoxel(x, y, z);
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    cell[voxelOffset] = v;
  }
  getVoxel(x, y, z) {
    const cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      return 0;
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    return cell[voxelOffset];
  }
  encodeCell(cellX, cellY, cellZ) {
  	let array = this.getCellForVoxel(cellX, cellY, cellZ)
  	// output an array of values
	// consisting of alternating "rips" and "runs"
	// a rip begins with a negative count followed by a 
	// cooresponding number of non-repeating values
	// 
	// a run begins with a positive count, followed by 
	// the value to be repeated by the count.

	var newArray=[];
	var rip=[];
	var lastValue=undefined;
	var runCount=0;

	for (var i = 1,lastValue=array[0]; i <= array.length; i++) {
		if(array[i]!==lastValue){
			if(runCount!==0){
				newArray.push(runCount+1,lastValue);
			} else {
				rip.push(lastValue);
			}
			runCount=0;
		}

		if(array[i]===lastValue || i===array.length){
			if(rip.length !== 0){
				if(rip.length){
					newArray.push(-rip.length);
					newArray=newArray.concat(rip);
				}
				rip=[];
			}
			runCount++;
		}
		lastValue=array[i];
	};
	return newArray;
  }
  generateCell(cellX, cellY, cellZ) {
    if (!this.cells[`${cellX},${cellY},${cellZ}`]) { // Check if chunk already exists
      const {cellSize} = this;

      let isEmpty = true;

      for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
          // Get cell offset
          let xPos = x + cellX * cellSize;
          let zPos = z + cellZ * cellSize;
          
          const height = Math.floor((noise.noise2D(xPos/30, zPos/30)+1)*5)+30;
          for (let y = 0; y < cellSize; ++y) {
            // Get cell offset for y
            let yPos = y + cellY * cellSize;
            let caveSparsity = 0.02;

            const cave = (noise.noise3D(xPos*0.05, yPos*caveSparsity, zPos*0.05)+1)/2;

           
            // Terrain generation
            let blockID = 0;
            if (cave > 0.1) {
              if (yPos == height) {
                blockID = blockToID("grass");
              } else if (yPos < height && yPos > height-3) {
                blockID = blockToID("dirt");
              } else if (yPos <= height-3 && yPos > 0) {
                blockID = blockToID("stone");
              }
            }

            if (yPos == 0) {
              blockID = blockToID("bedrock"); // Force bedrock layer
            }

            if (blockID > 0)
              isEmpty = false;

            this.setVoxel(xPos, yPos, zPos, blockID);
          }
        }
      }
    }
  }
  deleteCell(chunk) {
    delete this.cells[chunk.id];
    let object = scene.getObjectByName(chunk.id);
    if (object) {
      object.geometry.dispose();
      object.material.dispose();
      scene.remove(object);
      delete cellIdToMesh[chunk.id];
    }
  }
  generateGeometryDataForCell(cellX, cellY, cellZ) {
    const {cellSize, tileSize, tileTextureWidth, tileTextureHeight} = this;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const startX = cellX * cellSize;
    const startY = cellY * cellSize;
    const startZ = cellZ * cellSize;

    for (let y = 0; y < cellSize; ++y) {
      const voxelY = startY + y;
      for (let z = 0; z < cellSize; ++z) {
        const voxelZ = startZ + z;
        for (let x = 0; x < cellSize; ++x) {
          const voxelX = startX + x;
          const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
          if (voxel) {
            // voxel 0 is sky (empty) so for UVs we start at 0
            const uvVoxel = voxel - 1;
            // There is a voxel here but do we need faces for it?
            for (const {dir, corners, uvRow} of World.faces) {
              const neighbor = this.getVoxel(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (!neighbor) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const {pos, uv} of corners) {
                  positions.push((pos[0] + x)*this.blockSize, (pos[1] + y)*this.blockSize, (pos[2] + z)*this.blockSize);
                  normals.push(...dir);
                  uvs.push(
                        (uvVoxel +   uv[0]) * tileSize / tileTextureWidth,
                    1 - (uvRow + 1 - uv[1]) * tileSize / tileTextureHeight);
                }
                indices.push(
                  ndx, ndx + 1, ndx + 2,
                  ndx + 2, ndx + 1, ndx + 3,
                );
              }
            }
          }
        }
      }
    }

    return {
      positions,
      normals,
      uvs,
      indices,
    };
  }
}