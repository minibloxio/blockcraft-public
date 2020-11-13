
var SimplexNoise = require('simplex-noise'),
    rng1 = new SimplexNoise(Math.random),
    rng2 = new SimplexNoise(Math.random)

function noise1(nx, ny) { return rng1.noise2D(nx, ny)/2 + 0.5; }
function noise2(nx, ny) { return rng2.noise2D(nx, ny)/2 + 0.5; }

function RLEdecode(array) {
  var newArray=[],isRip,isRun,ripCount,runCount;
  for (var i = 0; i < array.length; i++) {
    isRip=array[i]<0;
    isRun=array[i]>0;
    if(isRip){
      ripCount=Math.abs(array[i]);
      i+=1;

      newArray=newArray.concat(array.slice(i,i+ripCount));
      i+=ripCount-1;
    }
    if(isRun){
      runCount=array[i];
      i+=1;
      for (var j = 0; j < runCount; j++) {
        newArray.push(array[i])
      };
      
    }
    
  };
  return newArray;}

function RLEencode(array) {
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

module.exports = class World {
  constructor(options) {
  	// World seed
  	this.seed = Math.random();
    rng1 = new SimplexNoise(this.seed);
    rng2 = new SimplexNoise(this.seed+0.2 > 1 ? this.seed - 0.8 : this.seed+0.2);

    this.tick = 0;

    this.waterLevel = 40;
    this.mountainLevel = 80;

    // Cell management
  	this.blockSize = 16;
    this.cellSize = options.cellSize;
    this.buildHeight = options.buildHeight;
    this.tileSize = options.tileSize;
    this.tileTextureWidth = options.tileTextureWidth;
    this.tileTextureHeight = options.tileTextureHeight;
    const {cellSize} = this;
    this.cellSliceSize = cellSize * cellSize;
    this.cells = {};
    this.cellDeltas = {};


    // Entities
    this.entities = {};

    // Block ids

    this.blockOrder = options.blockOrder;
    this.blockId = {};

    for (let i = 0; i < this.blockOrder.length; i++) {
      this.blockId[this.blockOrder[i]] = i+1;
    }

    this.itemOrder = options.itemOrder;
    this.itemId = {};

    for (let i = 0; i < this.itemOrder.length; i++) {
      this.itemId[this.itemOrder[i]] = i+1;
    }
  }
  loadSaveFile(data) {
    this.seed = data.seed;
    rng1 = new SimplexNoise(this.seed);
    rng2 = new SimplexNoise(this.seed+0.2 > 1 ? this.seed - 0.8 : this.seed+0.2);

    this.tick = data.tick;

    this.cells = {};
    for (let cellId in data.deltas) {
      this.cellDeltas[cellId] = RLEdecode(data.deltas[cellId])
    }
  }
  saveToFile(fs, io, filepath) {
    let deltas = {}
      for (let cellId in this.cellDeltas) {
        deltas[cellId] = RLEencode(this.cellDeltas[cellId])
      }

      let saveObject = {
        seed: this.seed,
        tick: this.tick,
        deltas: deltas
      }
      let t = Date.now();
      console.log("Saving world at", new Date(), "\nSeed:", this.seed)

      let data = JSON.stringify(saveObject);

      fs.writeFile(filepath, data,function (err) {
          if (err) throw err;  
          let txt = "Server successfully saved in " + (Date.now()-t) + " ms";
          console.log(txt)
          io.emit('messageAll', {
            text: txt,
            color: "purple",
            discard: true
          })
      });
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
    const {cellSize} = this;

    const cellId = this.computeCellId(x, y, z);
    let cell = this.cells[cellId];
    let cellDelta = this.cellDeltas[cellId];

    if (!cell) {
      cell = new Uint8Array(cellSize * cellSize * cellSize);
      this.cells[cellId] = cell;
    }

    if (!cellDelta) {
      this.cellDeltas[cellId] = new Uint8Array(cellSize * cellSize * cellSize);
    }
    return cell;
  }
  getCellForVoxel(x, y, z, cellDelta) {
  	if (cellDelta)
    	return this.cellDeltas[this.computeCellId(x, y, z)];
    else
    	return this.cells[this.computeCellId(x, y, z)];
  }
  setVoxel(x, y, z, v, changeDelta, addCell = true) {
    let cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      if (!addCell) {
        return;
      }
      cell = this.addCellForVoxel(x, y, z);
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    cell[voxelOffset] = v;

    if (changeDelta) {
    	let cellDelta = this.getCellForVoxel(x, y, z, true);
    	cellDelta[voxelOffset] = v+1;
    }
  }
  getVoxel(x, y, z, cellDelta) {
  	const cell = this.getCellForVoxel(x, y, z, cellDelta);
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
  getColumnInfo(xPos, zPos) {
    let size = 256
    let exponent = 3;

    var nx = xPos/size - 0.5, ny = zPos/size - 0.5;
    var e = (1.00 * noise1( 1 * nx,  1 * ny)
           + 0.50 * noise1( 2 * nx,  2 * ny)
           + 0.25 * noise1( 4 * nx,  4 * ny)
           + 0.13 * noise1( 8 * nx,  8 * ny)
           + 0.06 * noise1(16 * nx, 16 * ny)
           + 0.03 * noise1(32 * nx, 32 * ny));
    e /= (1.00+0.50+0.25+0.13+0.06+0.03);
    e = Math.pow(e, exponent);
    var m = (1.00 * noise2( 1 * nx,  1 * ny)
           + 0.75 * noise2( 2 * nx,  2 * ny)
           + 0.33 * noise2( 4 * nx,  4 * ny)
           + 0.33 * noise2( 8 * nx,  8 * ny)
           + 0.33 * noise2(16 * nx, 16 * ny)
           + 0.50 * noise2(32 * nx, 32 * ny));
    m /= (1.00+0.75+0.33+0.33+0.33+0.50);
    
    return [e, m, this.biome(e, m)];
  }
  biome(e, m) {      
    if (e < 0.1) return "OCEAN";
    if (e < 0.12) return "BEACH";
    
    if (e > 0.6) {
      if (m < 0.4) return "SCORCHED";
      if (m < 0.6) return "BARE";
      if (m < 0.8) return "TUNDRA";
      return "SNOW";
    }

    if (e > 0.4) {
      if (m < 0.33) return "TEMPERATE_DESERT";
      if (m < 0.66) return "SHRUBLAND";
      return "TAIGA";
    }

    if (e > 0.3) {
      if (m < 0.16) return "TEMPERATE_DESERT";
      if (m < 0.50) return "GRASSLAND";
      if (m < 0.83) return "TEMPERATE_DECIDUOUS_FOREST";
      return "TEMPERATE_RAIN_FOREST";
    }

    if (m < 0.16) return "SUBTROPICAL_DESERT";
    if (m < 0.33) return "GRASSLAND";
    if (m < 0.66) return "TROPICAL_SEASONAL_FOREST";
    return "TROPICAL_RAIN_FOREST";
  }
  generateCell(cellX, cellY, cellZ) {
  	let cell = this.cells[`${cellX},${cellY},${cellZ}`];
  	let cellExists = false;
  	if (cell)
  		cellExists = true;

    let caveSparsity = 0.02;
    let coalSparsity = 0.2;
    let ironSparsity = 0.2;
    let goldSparsity = 0.15;
    let diamondSparsity = 0.2;

    const {cellSize} = this;

    for (let z = 0; z < cellSize; ++z) {
      for (let x = 0; x < cellSize; ++x) {
        // Get cell offset
        let xPos = x + cellX * cellSize;
        let zPos = z + cellZ * cellSize;

        let height, moisture, biome;
        [height, moisture, biome] = this.getColumnInfo(xPos, zPos);
        let heightNoise = 128;
        height = Math.floor(height*heightNoise)+30
        let waterLevel = Math.floor(0.1*heightNoise)+30
        
        for (let y = 0; y < cellSize; ++y) {
          let yPos = y + cellY * cellSize;

          if (this.getVoxel(xPos, yPos, zPos) > 0) // Block already exists here
            continue;

          let blockId = 0;

          // Waterlands
          if (biome == "OCEAN" && yPos <= waterLevel) {
            if (yPos >= height)
              blockId = "water";
            else if (yPos > height-3 && moisture < 0.33)
              blockId = "sand"
             else if (yPos > height-3 && moisture < 0.4)
              blockId = "clay"
            else if (yPos > height-3)
              blockId = "gravel"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "BEACH" && yPos <= height) {
            if (yPos > height-1)
              blockId = "sand";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          // Mountains
          if (biome == "SCORCHED" && yPos <= height) {
            if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "BARE" && yPos <= height) {
            if (yPos >= height)
              blockId = "dirt";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "TUNDRA" && yPos <= height) {
            if (yPos >= height)
              blockId = "snowy_grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "SNOW" && yPos <= height) {
            if (yPos > height-1)
              blockId = "snow";
            else if (yPos > height-2)
              blockId = "snowy_grass"
            else if (yPos > height-4)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          // Highlands
          if (biome == "TEMPERATE_DESERT" && yPos <= height) {
            if (yPos >= height)
              blockId = "sand";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "SHRUBLAND" && yPos <= height) {
            if (yPos >= height)
              blockId = "grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "TAIGA" && yPos <= height) {
            if (yPos >= height)
              blockId = "snowy_grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          // Midlands
          if (biome == "GRASSLAND" && yPos <= height) {
            if (yPos >= height)
              blockId = "grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "TEMPERATE_DECIDUOUS_FOREST" && yPos <= height) {
            if (yPos >= height)
              blockId = "grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "TEMPERATE_RAIN_FOREST" && yPos <= height) {
            if (yPos >= height)
              blockId = "grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          // Lowlands

          if (biome == "SUBTROPICAL_DESERT" && yPos <= height) {
            if (yPos >= height)
              blockId = "sand";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "TROPICAL_SEASONAL_FOREST" && yPos <= height) {
            if (yPos >= height)
              blockId = "grass";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          if (biome == "TROPICAL_RAIN_FOREST" && yPos <= height) {
            if (yPos == height)
              blockId = "cobblestone";
            else if (yPos > height-3)
              blockId = "dirt"
            else if (yPos > 0)
              blockId = "stone"
          }

          const coal = rng1.noise3D(xPos*coalSparsity, yPos*coalSparsity, zPos*coalSparsity);
          const iron = rng1.noise3D(xPos*ironSparsity, yPos*ironSparsity, zPos*ironSparsity);
          const gold = rng1.noise3D(xPos*goldSparsity, yPos*goldSparsity, zPos*goldSparsity);
          const diamond = rng1.noise3D(xPos*diamondSparsity, yPos*diamondSparsity, zPos*diamondSparsity);

          if (yPos <= height-3 && yPos > 0) {
            blockId = "stone";
            // Ore generation

            blockId = (coal > 0.6 && yPos > 24) ? "coal_ore" : blockId
            blockId = (iron > 0.7 && yPos > 18) ? "iron_ore" : blockId
            blockId = (gold > 0.9 && yPos < 18) ? "gold_ore" : blockId
            blockId = (diamond > 0.9 && yPos < 12) ? "diamond_ore" : blockId
          }

          /*// Get cell offset for y
          

          const cave = (rng1.noise3D(xPos*0.05, yPos*caveSparsity, zPos*0.05)+1)/2;

          const coal = rng1.noise3D(xPos*coalSparsity, yPos*coalSparsity, zPos*coalSparsity);
          const iron = rng1.noise3D(xPos*ironSparsity, yPos*ironSparsity, zPos*ironSparsity);
          const gold = rng1.noise3D(xPos*goldSparsity, yPos*goldSparsity, zPos*goldSparsity);
          const diamond = rng1.noise3D(xPos*diamondSparsity, yPos*diamondSparsity, zPos*diamondSparsity);
         
          // Terrain generation
          let blockId = 0;
          if (yPos > height && yPos <= this.waterLevel)
              blockId = "water";

          if (cave > 0.1) {
            if (yPos == height && yPos > this.waterLevel+1) {
              blockId = "grass";
            } else if (yPos == height && yPos <= this.waterLevel-2) {
              blockId = "gravel";
            } else if (yPos == height && yPos <= this.waterLevel+1) {
              blockId = "sand";
            } else if (yPos < height && yPos > height-3) {
              blockId = "dirt";
            } else if (yPos <= height-3 && yPos > 0) {
              blockId = "stone";
              // Ore generation

              blockId = (coal > 0.6 && yPos > 24) ? "coal_ore" : blockId
              blockId = (iron > 0.7 && yPos > 18) ? "iron_ore" : blockId
              blockId = (gold > 0.9 && yPos < 18) ? "gold_ore" : blockId
              blockId = (diamond > 0.9 && yPos < 12) ? "diamond_ore" : blockId
            }

            if (yPos >= height-2 && yPos <= height && yPos >= this.mountainLevel+15 && moisture > 0.5) {
              blockId = "snow";
            } else if (yPos >= height && yPos <= height && yPos >= this.mountainLevel+10 && moisture > 0.5) {
              blockId = "snow";
            } else if (yPos >= height-2 && yPos <= height && yPos >= this.mountainLevel && moisture > 0.6) {
              blockId = "snowy_grass";
            } else if (yPos >= height-2 && yPos <= height && yPos >= this.mountainLevel && moisture > 0.4) {
              blockId = "dirt";
            } else if (yPos >= height-2 && yPos <= height && yPos >= this.mountainLevel) {
              blockId = "stone";
            }
          }*/

          if (yPos == 0) {
            blockId = "bedrock"; // Force bedrock layer
          }

          blockId = this.blockId[blockId];

          this.setVoxel(xPos, yPos, zPos, blockId);
        }
      }
    }

    if (!cellExists) {
    	 // Add fauna
	    for (let z = -3; z < cellSize+3; ++z) {
	    	for (let x = -3; x < cellSize+3; ++x) {
	    		// Get cell offset
	        let xPos = x + cellX * cellSize;
	        let zPos = z + cellZ * cellSize;
	        let height, moisture, biome;
          [height, moisture, biome] = this.getColumnInfo(xPos, zPos);
          let heightNoise = 128;
          height = Math.floor(height*heightNoise)+30
          let waterLevel = Math.floor(0.1*heightNoise)+30

          // Add fauna
          let tree = rng1.noise3D(xPos/30, height, zPos/30)*rng1.noise2D(xPos, zPos) > moisture && height > waterLevel && height < this.mountainLevel;

          let ungrowable = ["OCEAN", "BEACH", "SCORCHED", "BARE", "SNOW"]
          if (ungrowable.indexOf(biome) > -1) tree = false;

	        if ((rng1.noise3D(xPos*0.05, height*caveSparsity, zPos*0.05)+1)/2 <= 0.1)
	        	continue;

					// Add trees?
					if (tree) {
						for (let y = 1; y < 6; y++) {
							this.setVoxel(xPos, height+y, zPos, this.blockId["wood"]);
						}

						for (let y = 3; y <= 6; y++) {
							if (y == 3 || y == 4) {
								for (let x = -2; x <= 2; x++) {
									for (let z = -2; z <= 2; z++) {
										if (!(x == 0 && z == 0))
											this.setVoxel(xPos+x, height+y, zPos+z, this.blockId["leaves"]);
									}
								}
							} else if (y == 5) {
								for (let x = -1; x <= 1; x++) {
									for (let z = -1; z <= 1; z++) {
										if (!(x == 0 && z == 0))
											this.setVoxel(xPos+x, height+y, zPos+z, this.blockId["leaves"]);
									}
								}
							} else {
								for (let x = -1; x <= 1; x++) {
									this.setVoxel(xPos+x, height+y, zPos, this.blockId["leaves"]);
								}
								for (let z = -1; z <= 1; z++) {
									this.setVoxel(xPos, height+y, zPos+z, this.blockId["leaves"]);
								}
							}
						}
					}
	    	}
	    }
    }

    // Adjust to cell deltas
    for (let z = 0; z < cellSize; ++z) {
      for (let x = 0; x < cellSize; ++x) {
    		for (let y = 0; y < cellSize; ++y) {
    			// Get cell offset
	        let xPos = x + cellX * cellSize;
	        let yPos = y + cellY * cellSize;
	        let zPos = z + cellZ * cellSize;

	        let v = this.getVoxel(xPos, yPos, zPos, true)-1;

	        if (v >= 0) {
	        	this.setVoxel(xPos, yPos, zPos, v);
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

  update(dt, players, newEntities, io) {
  	const {blockSize} =  this;
  	// Update entities
  	for (let entity_id in this.entities) {
  		let entity = this.entities[entity_id];
  		if (entity.type == "item" || entity.type == "arrow") {
  			// Delete entity if too long
  			if (Date.now()-entity.t > 60000) {
  				// Remove the item from world
					newEntities.push({
						type: "remove_item",
						id: entity.id,
						v: entity.v,
            class: entity.class,
					})
					delete this.entities[entity_id];
  			}

        // Entity gravity
  			var x = Math.floor(entity.pos.x/blockSize);
				var y = Math.floor((entity.pos.y-4)/blockSize);
				var dy = Math.floor((entity.pos.y-6)/blockSize);
				var z = Math.floor(entity.pos.z/blockSize);

				entity.acc = {x: 0, y: -9.81*blockSize, z: 0};

				// Gravitate towards players
				for (let id in players) {
					let p = players[id];

					if (p.pickupDelay < Date.now()) { // Pick up item
						let dir = {x: (p.pos.x-entity.pos.x), y: (p.pos.y-blockSize-(entity.pos.y)), z: (p.pos.z-entity.pos.z)}
						let dist = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2) + Math.pow(dir.z, 2))

            // Add to player if within a block distance
						if (dist < blockSize*1.5) {
              if (entity.v == this.itemId["arrow"] && entity.class == "item" && entity.lethal && !entity.onObject && !players[id].blocking) { // Arrow hit

                players[id].hp -= entity.force;
                if (players[entity.playerId])
                  players[id].dmgType = players[entity.playerId].name;
                entity.force *= 300
                entity.dir = entity.vel;
                io.to(`${id}`).emit('knockback', entity)
                io.emit('punch', id);

                // Remove the item from world
                newEntities.push({
                  type: "remove_item",
                  id: entity.id,
                  v: entity.v,
                  class: entity.class
                })
                delete this.entities[entity_id];
              } else {
                // Add item to player's inventory if item already exists in inventory
                let added = false;
                for (let t of p.toolbar) {
                  if (!t)
                    continue;
                  if (t.v == entity.v && t.class == entity.class) {
                    t.c += 1;
                    added = true;
                  }
                }

                // Add item if item does not exist in inventory
                if (!added) {
                  let filled = false;
                  for (let i = 0; i < p.toolbar.length; i++) {
                    if (!p.toolbar[i] || p.toolbar[i].c == 0) {
                      p.toolbar[i] = {
                        v: entity.v,
                        c: 1,
                        class: entity.class
                      }
                      filled = true;
                      break;
                    }
                  }

                  if (!filled) {
                    p.toolbar.push({
                      v: entity.v,
                      c: 1,
                      class: entity.class
                    })
                  }
                }

                // Remove the item from world
                newEntities.push({
                  type: "remove_item",
                  id: entity.id,
                  v: entity.v,
                  class: entity.class
                })
                delete this.entities[entity_id];
              }
						}

						if (dist < blockSize*2 && (entity.v != this.itemId["arrow"] || entity.onObject)) { // Pull when 2 blocks away
							let distSquared = dist * dist / (blockSize*blockSize);

							entity.acc.x = dir.x * 2 * blockSize;
							entity.acc.y = dir.y * 2 * blockSize;
							entity.acc.z = dir.z * 2 * blockSize;
						}
					}
				}

        if (this.getVoxel(x, dy, z) > 0) {
          entity.acc = {x: 0, y: 0, z: 0}
          entity.vel = {x: 0, y: 0, z: 0}
        }
        if (this.getVoxel(x, y, z) > 0) {
          entity.acc = {x: 0, y: 9.81*blockSize, z: 0}
          entity.vel = {x: 0, y: 0, z: 0}
          entity.onObject = true;
        }

				// Update velocity and acceleration
  			entity.vel.x += entity.acc.x*dt;
  			entity.vel.y += entity.acc.y*dt;
  			entity.vel.z += entity.acc.z*dt;

  			entity.pos.x += entity.vel.x*dt;
  			entity.pos.y += entity.vel.y*dt;
  			entity.pos.z += entity.vel.z*dt;
  		}
  	}
  }
}