var dir = new THREE.Vector3();
var frustum = new THREE.Frustum();
var chunks = [];

noise.seed(Math.random());

class Chunk {
	constructor (x, z) {
		this.size = 8;
		this.height = 8;
		this.world = new THREE.Vector3(x, 0, z);
		this.matrix = []
		for (var x = 0; x < this.size; x++) {
			this.matrix.push([])
			
			for (var z = 0; z < this.size; z++) {
				this.matrix[x].push([])
				for (var y = 0; y < this.height; y++) {
					this.matrix[x][z].push([])
				}
			}
			
		}
		/*var previousHeight;
		for (var x = 0; x < this.size; x++) {
			for (var z = 0; z < this.size; z++) {
				if (previousHeight) {
					var done = false;
					while (!done) {
						var randomHeight = Math.floor(Math.random() * (this.height-5))+1;
						if (Math.abs(randomHeight - previousHeight) <= 1) {
							done = true;
							this.matrix[x][z].height = randomHeight;
							previousHeight = this.matrix[x][z].height;

						}
					}
				} else {
					this.matrix[x][z].height = Math.floor(Math.random() * (this.height-5))+1;
					previousHeight = this.matrix[x][z].height;
				}
			}
		}
		
		// Terrain generation
		for(var i=this.world.x*blockSize;i<this.size+this.world.x*blockSize;i++) {
			for(var j=this.world.z*blockSize;j<this.size+this.world.z*blockSize;j++) {
				var ex = 0.5;
				let height = Math.floor((((noise.simplex2(i/100,j/100)+(noise.simplex2((i+200)/50,j/50)*Math.pow(ex,1))+(noise.simplex2((i+400)/25,j/25)*Math.pow(ex,2))+
				(noise.simplex2((i+600)/12.5,j/12.5)*Math.pow(ex,3))+
				+
				(noise.simplex2((i+800)/6.25,j/6.25)*Math.pow(ex,4))                                 
				)/2)+1)*this.height/2);
				this.matrix[i-this.world.x*blockSize][j-this.world.z*blockSize].height = height;

				console.log(height)
			}
		}*/

		this.tick = Date.now();

		this.bedrockFloor;
		this.grassTerrain;
		this.dirtTerrain;
		this.stoneTerrain;
	}

	generate(map, matrix) {
		for (var x = 0; x < this.matrix.length; x++) {
			for (var z = 0; z < this.matrix[x].length; z++) {
				this.matrix[x][z].height = this.height; // CHUNK LOADER REQUIRES HEIGHT???
				for (var y = 0; y < this.height; y++) {
					var isAir = false;
					if (matrix[x][z][y] == "bedrock") {
						this.matrix[x][z][y] = new Block(bedrock, x, y, z)
					} else if (matrix[x][z][y] == "grass") {
						this.matrix[x][z][y] = new Block(grass, x, y, z)
					} else if (matrix[x][z][y] == "dirt") {
						this.matrix[x][z][y] = new Block(dirt, x, y, z)
					} else if (matrix[x][z][y] == "stone") {
						this.matrix[x][z][y] = new Block(stone, x, y, z)
					} else {
						this.matrix[x][z][y] = "air"
						isAir = true;
					}
						

					if (!isAir) {
						this.matrix[x][z][y].position.set( x*blockSize, y*blockSize, z*blockSize)
						this.matrix[x][z][y].world = this.world;
					}
				}
			}
		}
	}
	update(initiate, player) {
		if ((Date.now()-this.tick > 100 && player && (player.distanceMoved > 4 || player.updateBlock)) || (initiate)) {
			if (player) {

				var playerPos = player.position.clone().divideScalar(blockSize*blockSize)
				if (playerPos.x > this.world.x && playerPos.x < this.world.x+1 && playerPos.z > this.world.z && playerPos.z < this.world.z+1) {
					player.distanceMoved = 0;
					player.updateBlock = false;
				}
			}
			
			this.tick = Date.now();
			//blocks = []

			var combinedBedrock = new THREE.Geometry();
			var combinedGrass = new THREE.Geometry();
			var combinedDirt = new THREE.Geometry();
			var combinedStone = new THREE.Geometry();
			for (var x = 0; x < this.matrix.length; x++) {
				for (var z = 0; z < this.matrix[x].length; z++) {
					for (var y = 0; y < this.matrix[x][z].length; y++) {
						if (this.matrix[x][z][y] != "air") {
							var culling = true;
							if ((!this.matrix[x+1] && this.matrix[x+1] instanceof THREE.Mesh) || checkArray(this.matrix, x, z, y, -1, 0, 0) === "air") {
								culling = false;
							}
							if ((!this.matrix[x-1] && this.matrix[x-1] instanceof THREE.Mesh || checkArray(this.matrix, x, z, y, 1, 0, 0) === "air")) {
								culling = false;
							}
							if ((!this.matrix[x][z+1] && this.matrix[x][z+1] instanceof THREE.Mesh) || checkArray(this.matrix, x, z, y, 0, 1, 0) === "air") {
								culling = false;
							}
							if ((!this.matrix[x][z-1] && this.matrix[x][z-1] instanceof THREE.Mesh) || checkArray(this.matrix, x, z, y, 0, -1, 0) === "air") {
								culling = false;
							}
							if (!(this.matrix[x][z][y+1] instanceof THREE.Mesh)) {
								culling = false;
							}
							if ((!this.matrix[x][z][y-1] && this.matrix[x][z][y-1] instanceof THREE.Mesh) || checkArray(this.matrix, x, z, y, 0, 0, -1) === "air") {
								culling = false;
							}

							var blockDistance = undefined
							var block = this.matrix[x][z][y];

							var allow = true;
							/*if (block && block.position && player) {
								blockDistance = player.position.distanceTo(block.position.add(new THREE.Vector3(this.world.x*blockSize*blockSize, 0, this.world.z*blockSize*blockSize)))
								if (blocks.length < 50 && blockDistance < blockSize*7) {
									allow = true;
								} else if (blocks.length < 75 && blockDistance < blockSize*6) {
									allow = true;
								} else if (blocks.length < 100 && blockDistance < blockSize*5) {
									allow = true;
								} else if (blocks.length < 200 && blockDistance < blockSize*3) {
									allow = true;
								}
							}
*/
							if (allow) {
								culling = true;
								var exists = false;
								if (y == 0) {
									exists = true;
								} else if (this.matrix[x][z].height === y) {
									exists = true;
								} else if (y < this.matrix[x][z].height && y >= this.matrix[x][z].height-3) {
									exists = true;
								} else if (y < this.matrix[x][z].height-3) {
									exists = true;
								}
								if (exists) {
									var flag = false;
									for (var i = 0; i < blocks.length; i++) {
										if (blocks[i].uuid === this.matrix[x][z][y].uuid) {
											blocks[i] = this.matrix[x][z][y]
											scene.remove(this.matrix[x][z][y])
											flag = true;
										}
									}
									if (!flag) {
										blocks.push(this.matrix[x][z][y])
									}
									scene.add(this.matrix[x][z][y])
								}
							} else {
								scene.remove(this.matrix[x][z][y])
								for (var i = 0; i < blocks.length; i++) {
									if (blocks[i].uuid === this.matrix[x][z][y].uuid) {
										blocks.splice(i, 1)
									}
								}
							}
							
							/*if (!culling && this.matrix[x][z][y].position && player && player.position.distanceTo(this.matrix[x][z][y].position) < blockSize*10) {
								if (y == 0) {
									// bedrock
									this.matrix[x][z][y].updateMatrix();
									combinedBedrock.merge(this.matrix[x][z][y].geometry, this.matrix[x][z][y].matrix);
									this.matrix[x][z][y].position.set( x*blockSize + this.world.x*this.size*blockSize, y*blockSize, z*blockSize + this.world.z*this.size*blockSize)
								} else if (this.matrix[x][z].height === y) {
									// grass

									this.matrix[x][z][y].updateMatrix();
									combinedGrass.merge(this.matrix[x][z][y].geometry, this.matrix[x][z][y].matrix);
									this.matrix[x][z][y].position.set( x*blockSize + this.world.x*this.size*blockSize, y*blockSize, z*blockSize + this.world.z*this.size*blockSize)
								} else if (y < this.matrix[x][z].height && y >= this.matrix[x][z].height-3) {
									// dirt
									this.matrix[x][z][y].updateMatrix();
									combinedDirt.merge(this.matrix[x][z][y].geometry, this.matrix[x][z][y].matrix);
									this.matrix[x][z][y].position.set( x*blockSize + this.world.x*this.size*blockSize, y*blockSize, z*blockSize + this.world.z*this.size*blockSize)
								} else if (y < this.matrix[x][z].height-3) {
									// stone
									this.matrix[x][z][y].updateMatrix();
									combinedStone.merge(this.matrix[x][z][y].geometry, this.matrix[x][z][y].matrix);
									this.matrix[x][z][y].position.set( x*blockSize + this.world.x*this.size*blockSize, y*blockSize, z*blockSize + this.world.z*this.size*blockSize)
								}
							}*/
						}
					}
				}
			}
			
			//

			scene.remove(this.bedrockFloor);
			combinedBedrock.sortFacesByMaterialIndex();
			combinedBedrock = new THREE.BufferGeometry().fromGeometry(combinedBedrock)
			this.bedrockFloor = new THREE.Mesh(combinedBedrock, stone.material);
			scene.add(this.bedrockFloor)	

			scene.remove(this.stoneTerrain);
			combinedStone.sortFacesByMaterialIndex();
			combinedStone = new THREE.BufferGeometry().fromGeometry(combinedStone)
			this.stoneTerrain = new THREE.Mesh(combinedStone, stone.material);
			scene.add(this.stoneTerrain)

			scene.remove(this.dirtTerrain);
			combinedDirt.sortFacesByMaterialIndex();
			combinedDirt = new THREE.BufferGeometry().fromGeometry(combinedDirt)
			this.dirtTerrain = new THREE.Mesh(combinedDirt, dirt.material);
			scene.add(this.dirtTerrain)

			scene.remove(this.grassTerrain);
			combinedGrass.sortFacesByMaterialIndex();
			combinedGrass = new THREE.BufferGeometry().fromGeometry(combinedGrass)
			this.grassTerrain = new THREE.Mesh(combinedGrass, grass.material);
			scene.add(this.grassTerrain)

			offscene.children = blocks;
			
		}
	}
}

function checkArray(array, x, z, y, x1, z1, y1) {
	if (array[x+x1] && array[x+x1][z+z1] && array[x+x1][z+z1][y+y1]) {
		return array[x+x1][z+z1][y+y1]
	} else {
		return undefined;
	}
}