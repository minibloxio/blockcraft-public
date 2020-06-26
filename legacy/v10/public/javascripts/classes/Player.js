// Classes

class Player {
	constructor(camera, blocks) {
		// 3d stuff
		this.controls = new THREE.PointerLockControls( camera );;
		this.controls.getObject().position.y += blockSize*100;
		this.controls.getObject().position.x = randInt(0, blockSize*blockSize);
		this.controls.getObject().position.z = randInt(0, blockSize*blockSize);
		this.camera = camera;
		this.cameraHeight = blockSize * 1.75;

		// Ray casting

		this.raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, blockSize*1.62);; // collision detection
		this.selectcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ));; // block selecting / breaking / placing

		// Collision helper

		this.closest = {
			distance: Infinity
		};

		// Movement

		this.position = this.controls.getObject().position;
		this.savedPosition = this.position.clone();
		this.velocity = new THREE.Vector3();
		this.direction = new THREE.Vector3();
		this.speed = 2;
		this.maxSpeed = 4;
		this.distanceMoved = 0;

		this.fly = false;
		this.flyingEnabled = false; // Flying is not smooth
		
		this.onObject = false; // Sees if player is on object

		// Events

		this.key = {
			forward: false,
			backward: false,
			left: false,
			right: false,
			up: false,
			down: false,
			jump: false,
			sprint: false,
			shift: false,
			leftClick: false,
			rightClick: false
		}

		this.click = false;
		this.place = false;
		this.placeType = 2; // Type of block being placed

		// Player appearance

		this.halfWidth = blockSize * 0.3;
		this.halfDepth = blockSize * 0.3;
		this.halfHeight = blockSize * 0.8;

		this.miningDelay = 10;
		this.placingDelay = 10;

		// Player info
		this.hp = 10;

		// Chunk loading
		this.chunksToRequest = [];
		this.chunksToLoad = [];
		this.chunksToUnload = [];

		this.renderDistance = 10;
		this.chunkLoadingRate = 1;
		this.chunkTick = Date.now();

		// Hand
		this.punching = false;
		this.arm = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3), armC.material);
		this.arm.castShadow = true;
		this.arm.receiveShadow = true;
		this.arm.position.set(2, -2, -2.5);
		this.arm.rotation.set(Math.PI, Math.PI, 0);
		camera.add(this.arm);
	}

	vertex(vertexX, vertexY, vertexZ) {
      var vertex;
      vertex = this.position.clone();
      vertex.y -= this.cameraHeight - blockSize;
      vertex.x += vertexX * this.halfWidth;
      vertex.y += vertexY * this.halfHeight;
      vertex.z += vertexZ * this.halfDepth;
      return vertex;
    };

    boundingBox() {
      var vmax, vmin;
      vmin = this.vertex(-1, -1, -1);
      vmax = this.vertex(1, 1, 1);
      return {
        vmin: vmin,
        vmax: vmax
      };
    };

    select(update) {
    	// Crosshair selection for blocks

		var intersects;

		// update the picking ray with the camera and mouse position
		this.selectcaster.setFromCamera( mouse, camera );
		this.selectcaster.far = blockSize * 5;

		// calculate blocks intersecting the picking ray
		intersects = this.selectcaster.intersectObjects( scene.children );

		var picked = []
		for (var i = 0; i < intersects.length; i++) {
			picked.push(intersects[i])
		}

		// Get the closest block
		var closest = {
			distance: Infinity
		};
		for (var i = 0; i < picked.length; i++) {
			if (closest.distance > picked[i].distance) {
				closest = picked[i]
			}
		}

		if (closest.object && update) {
			/*var geometry = new THREE.EdgesGeometry(closest.object.geometry);
			var material = new THREE.LineBasicMaterial({ color:0x000000, linewidth: 10})
			var wireframe = new THREE.LineSegments( geometry, material);
			
			if (previousBlock.object && closest.object.uuid != previousBlock.object.uuid) {
				closest.object.add(wireframe)
				previousBlock.object.children = [];
			} else {
				closest.object.add(wireframe)
			}
			previousBlock = closest;*/
		} else {
			if (previousBlock.object) {
				previousBlock.object.children = [];
			}
		}

		this.closest = closest;
    }

    punch() {
    	this.selectcaster.far = blockSize * 3;

    	let playerBoxes = [];
    	for (let id in players) {
    		playerBoxes.push(players[id].skeleton);
    	}
		var intersects = this.selectcaster.intersectObjects(playerBoxes, true);

		var picked = []
		for (var i = 0; i < intersects.length; i++) {
			picked.push(intersects[i])
		}

		// Get the closest intersection
		var closest = {
			distance: Infinity
		};
		for (var i = 0; i < picked.length; i++) {
			if (closest.distance > picked[i].distance) {
				closest = picked[i]
			}
		}

		if (closest.object) {
			// Get id of player
			let playerId = closest.object.parent;
			while (!playerId.name)
				playerId = playerId.parent;

			socket.emit("punchPlayer", playerId.name); // Send to server (IBRAHIM I'M LOOKING AT YOU)
		}
    }

	mine() {
		// Continous mining of blocks by holding right click
		if (this.key.leftClick && Date.now() - this.key.leftClick > 0) {
			this.key.leftClick = Date.now() + this.miningDelay;
			this.click = true;
		}

		// Check if block is mined
		if (this.closest.point && this.click) {
			let x = Math.floor((this.closest.point.x-this.closest.face.normal.x)/blockSize);
			let y = Math.floor((this.closest.point.y-this.closest.face.normal.y)/blockSize);
			let z = Math.floor((this.closest.point.z-this.closest.face.normal.z)/blockSize);

			if (world.getVoxel(x, y, z) > 1) {
				world.setVoxel(x, y, z, 0);
			    updateVoxelGeometry(x, y, z);
				
				// Remove blocks

				this.closest = {
					distance: Infinity
				}
				this.click = false;

				// Send data to server
				socket.emit('setBlock', {
					x: x,
					y: y,
					z: z,
					t: 0
				})
			}
		}
	}

	placeBlock() {
		// Continous placing of blocks by holding right click
		if (this.key.rightClick && Date.now() - this.key.rightClick > this.placingDelay) {
			this.key.rightClick = Date.now();
			this.place = true;
		}

		// Place a block
		if (this.closest.point && this.place) {
			let x = Math.floor((this.closest.point.x+this.closest.face.normal.x)/blockSize);
			let y = Math.floor((this.closest.point.y+this.closest.face.normal.y)/blockSize);
			let z = Math.floor((this.closest.point.z+this.closest.face.normal.z)/blockSize);

			if (y > world.buildHeight) // Exceeds build limit
				return;

			world.setVoxel(x, y, z, this.placeType);
		    updateVoxelGeometry(x, y, z);

		    if (this.collides()) {
		    	world.setVoxel(x, y, z, 0);
		    	updateVoxelGeometry(x, y, z);
		    } else {
		    	// Send data to server
				socket.emit('setBlock', {
					x: x,
					y: y,
					z: z,
					t: this.placeType
				})
		    }

		    this.place = false;
		}
	}

	checkCollision(delta) {
		// Change velocity

		var previousVelocity = this.velocity.clone();

		this.velocity.x -= previousVelocity.x * 10.0 * delta;
		this.velocity.z -= previousVelocity.z * 10.0 * delta;

		if (this.fly) {
			this.velocity.y -= previousVelocity.y * 10.0 * delta;
		}

		if (!this.fly) {
			this.velocity.y -= 9.8 * 50.0 * delta; // 100.0 = mass
		}
		this.direction.x = this.key.left + this.key.right;
		this.direction.y = this.key.up + this.key.down;
		this.direction.z = this.key.forward + this.key.backward;
		
		this.direction.normalize(); // this ensures consistent movements in all directins
		//this.velocity.x = 0;
		//this.velocity.z = 0;

		if ( this.key.forward || this.key.backward ) this.velocity.z -= this.direction.z * 400.0 * delta;
		if ( this.key.left || this.key.right ) this.velocity.x -= this.direction.x * 400.0 * delta;
		if ( (this.key.down || this.key.up) && this.fly ) this.velocity.y -= this.direction.y * 400.0 * delta;

		// Reset shift position

		if (!this.fly) {
			this.controls.getObject().position['y'] = this.savedPosition['y'];
			this.halfHeight = blockSize * 0.8;
		}

		// Get movement preview by adding up all the movement from object space

		this.onObject = false;

		var axes = ['y', 'x', 'z']
		var newMove = new THREE.Vector3();
		
		for (var i = 0; i < axes.length; i++) {
			var axis = axes[i];
			var axesVec = new THREE.Vector3();
			axesVec[axis] = 1;

			var original = this.velocity[axis] * delta * this.speed;
			var originalY = this.velocity[axis] * delta;
			var currentVel;
			if (!this.fly) {
				currentVel = [originalY, original, original];
			} else {
				currentVel = [original, original, original];
			}
			
			var previousPosition = this.position.clone();
			var currentPosition = this.controls.getObject().clone();
			currentPosition.translateOnAxis(axesVec, currentVel[i]);
			var move = currentPosition.position.sub(previousPosition)
			newMove.add(move);
		}

		var savedMove = newMove.clone();

		// Test each axis in collsion
		var previousPosition = this.position.clone();

		for (var i = 0; i < axes.length; i++) {
			var axis = axes[i];

			if (axis === 'y' && !this.fly) {
				// Test for y
				this.controls.getObject().position['y'] += newMove['y'];
				if (this.collides() && this.velocity.y < 0 || this.position.y <= blockSize) {
					this.onObject = true;
					newMove['y'] = 0;
				} else if (this.collides()) {
					this.velocity.y = 0;
					newMove['y'] = 0;
				}
				// Put back before testing y
				this.controls.getObject().position['y'] = previousPosition['y'];
			} else {
				// Try testing x and z and y if flying
				this.controls.getObject().position[axis] += newMove[axis];
				if (this.collides()) {
					newMove[axis] = 0;

					if (axis === 'y' && this.fly && this.velocity.y < 0) {
						this.fly = false;
					}
				}

				var onBlock = false;

				// Test for y during shift mode
				this.controls.getObject().position['y'] += savedMove['y'];
				if (!(this.collides() && this.velocity.y < 0) && this.onObject && this.key.sneak) {
					newMove[axis] = 0;
				}
				// Put back before testing y
				this.controls.getObject().position['y'] = previousPosition['y']

				this.controls.getObject().position[axis] = previousPosition[axis];
			}
		}

		this.controls.getObject().position['x'] += newMove['x'];
		if (!(!this.onObject && this.key.sneak && newMove['y'] === 0) && !this.fly) {
			this.controls.getObject().position['y'] += newMove['y'];
		} else {
			this.controls.getObject().position['y'] += newMove['y'];
		}
		this.controls.getObject().position['z'] += newMove['z'];

		// Stop sprinting if you hit a block
		this.distanceMoved += previousPosition.sub(this.controls.getObject().position).length();
		if (this.distanceMoved < 1.5 && this.onObject === false && !this.fly) {
			this.speed = 2;
		}

		if ( this.onObject === true ) {
			this.velocity.y = Math.max( 0, this.velocity.y );
		}

		// Jump
		if (map[32] && !showChatBar) {
			if (!player.fly && player.onObject) {
				player.velocity.y += 150;
			} else {
				player.key.up = -1;
			}
		}

		// Stuck in block
		if (this.onObject && this.collides()) {
			this.controls.getObject().position['y'] += 5;
		}

		// Save position

		this.savedPosition = this.controls.getObject().position.clone();
	}

	update(delta) {
		// Update movement
		if (this.key.sprint) {
			if (this.speed < this.maxSpeed) {
				this.speed += delta * 10;
			} else {
				this.speed = this.maxSpeed;
			}
		} else {
			if (this.speed > 2) {
				this.speed -= delta * 10;
			} else {
				this.speed = 2;
			}
		}
		this.positionYOffset = 0;
		if (this.key.sneak && !this.fly) {
			this.speed = 0.5;
			if (!this.fly) {
				this.controls.getObject().position['y'] += -2;
				this.halfHeight = blockSize * 0.6
			}
		}

		// Update player arm
		if (this.punching) {
			if (this.arm.position.z > -4.5) {
				this.arm.position.z -= 0.5;
				this.arm.rotation.y -= 0.1;
				this.arm.rotation.z += 0.1;
			} else {
				this.punching = false;
			}

		} else if (this.arm.position.z < -2.5) {
			this.arm.position.z += 0.5;
			this.arm.rotation.y += 0.1;
			this.arm.rotation.z -= 0.1;
		}

		// Change camera fov when sprinting
		/*if (this.speed <= 2 || this.distanceMoved < 1.5) {
			if (camera.fov > 75) {
				camera.fov -= 0.3;
			}
		} else if (this.distanceMoved > 1.5) {
			if (camera.fov < 80) {
				camera.fov += 0.3;
			}
		}
		camera.updateProjectionMatrix();*/
	}

	updateChunks() {
		let t = Date.now();
		// Update chunks

		let cellPos = world.computeCellFromPlayer(this.position.x, this.position.y, this.position.z);

		// Chunks to unload
		for (let id in world.cells) {
			let cell = id.split(",");
			let dist = Math.sqrt(Math.pow(cellPos.x - parseInt(cell[0]), 2) + Math.pow(cellPos.z - parseInt(cell[2]), 2))


			if (dist > this.renderDistance*1.5) {
				this.chunksToUnload.push({
					x: parseInt(cell[0]),
					y: parseInt(cell[1]),
					z: parseInt(cell[2]),
					id: id
				})
			}
		}

		// Chunks to load
		let step = 1;
		let x = 0;
		let z = 0;
		let distance = 0;
	    let range = 1;
	    let direction = 'up';

	    for ( let i = 0; i < this.renderDistance*this.renderDistance; i++ ) {
	    	for (let y = 0; y < 10; y++) {
	    		let cellX = cellPos.x + x;
				let cellY = y;
				let cellZ = cellPos.z + z;
				let cellId = `${cellX},${cellY},${cellZ}`
				if (!world.cells[cellId]) { // Check if chunk already exists
					this.chunksToRequest.push({
						x: cellX,
						y: cellY,
						z: cellZ
					})
				} else {
					if (cellIdToMesh[cellId])
						cellIdToMesh[cellId].visible = true;
				}
	    	}
	       
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

	    // Request, load, and unload
		if (Date.now()-this.chunkTick > 0) {
			this.chunkTick = Date.now();
			// Request chunks based on loading rate
			if (this.chunksToLoad.length < 10) {
				let requestedChunks = [];
				for (var i = 0; i < this.chunkLoadingRate; i++) {
					let chunk = this.chunksToRequest[i];
					if (chunk) {
						world.generateCell(chunk.x, chunk.y, chunk.z)
						requestedChunks.push(chunk);
					}
				}
				socket.emit('loadChunk', requestedChunks)
			}
				
			// Load chunks based on loading rate
			for (var i = 0; i < this.chunkLoadingRate; i++) {
				let chunk = this.chunksToLoad[i];
				if (chunk) {
					//world.generateCell(chunk.x, chunk.y, chunk.z);
					updateVoxelGeometry(chunk.x*cellSize, chunk.y*cellSize, chunk.z*cellSize)
					// Call server to load this chunk
					this.chunksToLoad.splice(i, 1);
				}
			}

			/*if (Date.now()-t > 4) {
				console.log(Date.now()-t);
			}*/
			// Unload chunks based on loading rate
			for (var i = 0; i < this.chunkLoadingRate*2; i++) {
				let chunk = this.chunksToUnload[i];
				if (chunk) {
					world.deleteCell(chunk, false);
				}
			}

			this.chunksToRequest = [];
			this.chunksToUnload = [];
		}

		
	}

	collides() {
		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y-blockSize*1.62)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y+blockSize*0.2)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		// Top
		var x = Math.floor((player.position.x-blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y)/blockSize);
		var z = Math.floor((player.position.z-blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor((player.position.x-blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y)/blockSize);
		var z = Math.floor((player.position.z+blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor((player.position.x+blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y)/blockSize);
		var z = Math.floor((player.position.z-blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor((player.position.x+blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y)/blockSize);
		var z = Math.floor((player.position.z+blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		// Bottom
		var x = Math.floor((player.position.x-blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y-blockSize*1.62)/blockSize);
		var z = Math.floor((player.position.z-blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor((player.position.x-blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y-blockSize*1.62)/blockSize);
		var z = Math.floor((player.position.z+blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor((player.position.x+blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y-blockSize*1.62)/blockSize);
		var z = Math.floor((player.position.z-blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;

		var x = Math.floor((player.position.x+blockSize*0.25)/blockSize);
		var y = Math.floor((player.position.y-blockSize*1.62)/blockSize);
		var z = Math.floor((player.position.z+blockSize*0.25)/blockSize);

		if (world.getVoxel(x, y, z) > 0)
			return true;
	}
}