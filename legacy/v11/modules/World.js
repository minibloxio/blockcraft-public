
var SimplexNoise = require('simplex-noise'),
    noise = new SimplexNoise(Math.random)

let blockId = {
  "bedrock": 1,
  "stone": 2,
  "dirt": 3,
  "cobblestone": 4,
  "grass": 5,
  "wood": 6,
  "leaves": 7,
  "coal_ore": 8,
  "diamond_ore": 9,
  "iron_ore": 10,
  "gold_ore": 11,
  "crafting_table": 12,
  "planks": 13
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
  getCellPosFromId(id) {
    let pos = id.split(",")
    return {
      x: parseInt(pos[0]),
      y: parseInt(pos[1]),
      z: parseInt(pos[2])
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
  	let cell = this.cells[`${cellX},${cellY},${cellZ}`];

    let caveSparsity = 0.02;

    const {cellSize} = this;

    for (let z = 0; z < cellSize; ++z) {
      for (let x = 0; x < cellSize; ++x) {
        // Get cell offset
        let xPos = x + cellX * cellSize;
        let zPos = z + cellZ * cellSize;
        
        const height = Math.floor((noise.noise2D(xPos/30, zPos/30)+1)*5)+30;
        for (let y = 0; y < cellSize; ++y) {
          // Get cell offset for y
          let yPos = y + cellY * cellSize;

          if (this.getVoxel(xPos, yPos, zPos) > 0)
          	continue;

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

          this.setVoxel(xPos, yPos, zPos, blockID);
        }
      }
    }

    // Add fauna
    for (let z = -3; z < cellSize+3; ++z) {
    	for (let x = -3; x < cellSize+3; ++x) {
    		// Get cell offset
        let xPos = x + cellX * cellSize;
        let zPos = z + cellZ * cellSize;
        const height = Math.floor((noise.noise2D(xPos/30, zPos/30)+1)*5)+30;
    		// Add fauna
        let tree = noise.noise3D(xPos/30, height, zPos/30)*noise.noise2D(xPos, zPos) > 0.5;

        if ((noise.noise3D(xPos*0.05, height*caveSparsity, zPos*0.05)+1)/2 <= 0.1)
        	continue;

				// Add trees?
				if (tree) {
					for (let y = 1; y < 5; y++) {
						this.setVoxel(xPos, height+y, zPos, 6, true);
					}

					for (let y = 3; y <= 6; y++) {
						if (y == 3 || y == 4) {
							for (let x = -2; x <= 2; x++) {
								for (let z = -2; z <= 2; z++) {
									if (!(x == 0 && z == 0))
										this.setVoxel(xPos+x, height+y, zPos+z, 7, true);
								}
							}
						} else if (y == 5) {
							for (let x = -1; x <= 1; x++) {
								for (let z = -1; z <= 1; z++) {
									if (!(x == 0 && z == 0))
										this.setVoxel(xPos+x, height+y, zPos+z, 7, true);
								}
							}
						} else {
							for (let x = -1; x <= 1; x++) {
								this.setVoxel(xPos+x, height+y, zPos, 7, true);
							}
							for (let z = -1; z <= 1; z++) {
								this.setVoxel(xPos, height+y, zPos+z, 7, true);
							}
						}
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
}