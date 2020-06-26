
var SimplexNoise = require('simplex-noise'),
    simplex = new SimplexNoise(Math.random)
   
module.exports = class Chunk {
	constructor() {
		this.size= 16;
		this.height = 16;
		this.blockSize = 16;
		this.world = {x: 0, y: 0, z: 0}
		this.map = [];
		this.matrix = [];

		this.seed = Math.random();

		// Create map
		for (var x = 0; x < this.size; x++) {
			this.map.push([])
			for (var z = 0; z < this.size; z++) {
				this.map[x].push([])
			}
		}

		// Create matrix
		for (var x = 0; x < this.size; x++) {
			this.matrix.push([])
			
			for (var z = 0; z < this.size; z++) {
				this.matrix[x].push([])
				for (var y = 0; y < this.height; y++) {
					this.matrix[x][z].push([])
				}
			}
			
		}
		
		// Terrain generation
		for(var i=0;i<this.size;i++) {
			for(var j=0;j<this.size;j++) {
				let height = this.height-5;//Math.floor(((simplex.noise2D(i/100, j/100)+1)/2)*this.height);
				this.map[i][j] = height;
			}
		}

		// Generate map
		for (var x = 0; x < this.matrix.length; x++) {
			for (var z = 0; z < this.matrix[x].length; z++) {
				for (var y = 0; y < this.height; y++) {
					if (y == 0) {
						this.matrix[x][z][y] = "bedrock";
					} else if (y == this.map[x][z]) {
						this.matrix[x][z][y] = "grass";	
					} else if (y < this.map[x][z] && y > this.map[x][z]-2) {
						this.matrix[x][z][y] = "dirt";
					} else if (y <= this.map[x][z]-2) {
						this.matrix[x][z][y] = "stone";
					} else {
						this.matrix[x][z][y] = "air";
					}
				}
			}
		}
	}

	isValid(pos) {
		if (this.matrix[pos.x] && this.matrix[pos.x][pos.z] && this.matrix[pos.x][pos.z][pos.y])
			return true;
	}
}