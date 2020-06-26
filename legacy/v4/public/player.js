// Classes

class Player {
	constructor(camera, blocks) {
		// 3d stuff
		this.controls = new THREE.PointerLockControls( camera );;
		this.controls.getObject().position.y += blockSize*15;
		this.camera = camera;
		this.cameraHeight = blockSize * 1.75;

		// Ray casting

		this.raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ));;
		this.selectcaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ));;
		this.placecaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ));;

		// Collision helper

		this.collisionHelper = new CollisionHelper(this, blocks);
		this.closest = {
			distance: Infinity
		};

		// Movement

		this.position = this.controls.getObject().position;
		this.savedPosition = this.position.clone();
		this.velocity = new THREE.Vector3();
		this.direction = new THREE.Vector3();
		this.speed = 2;
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

		// Player appearance

		this.halfWidth = blockSize * 0.3;
		this.halfDepth = blockSize * 0.3;
		this.halfHeight = blockSize * 0.8;

		this.miningDelay = 200;
		this.placingDelay = 200;

		// Chunk loading

		this.chunkTick = Date.now();

		/*// Add head
		this.head = new THREE.Mesh(new THREE.BoxGeometry(playerDim.headSize, playerDim.headSize, playerDim.headSize), head.material);
		this.head.castShadow = true;
		this.head.position.set(0, blockSize*0.2, 0);

		// Add body
		this.body = new THREE.Mesh(new THREE.BoxGeometry(playerDim.torso, playerDim.torsoHeight, playerDim.legSize), body.material);
		this.body.castShadow = true;
		this.body.position.set(0, -blockSize*0.45, 0);

		// Add arms
		this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), arm.material)
		this.leftArm.castShadow = true;
		this.leftArm.position.set(-playerDim.armSize*3/2, -blockSize*0.45, 0);

		this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), arm.material)
		this.rightArm.castShadow = true;
		this.rightArm.position.set(playerDim.armSize*3/2, -blockSize*0.45, 0);

		// Add legs
		this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), leg.material)
		this.leftLeg.castShadow = true;
		this.leftLeg.position.set(-playerDim.legSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

		this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), leg.material)
		this.rightLeg.castShadow = true;
		this.rightLeg.position.set(playerDim.armSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

		// Entity (combine body and arm)
		this.entity = new THREE.Group();
		this.entity.add(this.body);
		this.entity.add(this.leftArm);
		this.entity.add(this.rightArm);
		this.entity.add(this.leftLeg);
		this.entity.add(this.rightLeg);
		this.entity.add(this.head);

		camera.add(this.entity)*/

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
		//console.log(blocks)
		offscene.updateMatrixWorld(true);
		intersects = this.selectcaster.intersectObjects( offscene.children );

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
			var geometry = new THREE.EdgesGeometry(closest.object.geometry);
			var material = new THREE.LineBasicMaterial({ color:0x000000, linewidth: 2})
			var wireframe = new THREE.LineSegments( geometry, material);
			
			if (previousBlock.object && closest.object.uuid != previousBlock.object.uuid) {
				closest.object.add(wireframe)
				previousBlock.object.children = [];
			} else {
				closest.object.add(wireframe)
			}
			previousBlock = closest;
		} else {
			if (previousBlock.object) {
				previousBlock.object.children = [];
			}
		}

		this.closest = closest;
    }

	mine() {
		// Continous mining of blocks by holding right click
		if (this.key.leftClick && Date.now() - this.key.leftClick > 0) {
			this.key.leftClick = Date.now() + this.miningDelay;
			this.click = true;

		}

		// Check if block is mined
		if (this.closest.object && this.click && this.closest.object.position.y != 0) {
			for (var i = 0; i < blocks.length; i++) { // INEFFICIENT
				if (blocks[i].uuid === this.closest.object.uuid) { // no mining bedrock
					// Remove the block from the chunk
					var x = blocks[i].position.x/blockSize
					var y = blocks[i].position.y/blockSize
					var z = blocks[i].position.z/blockSize
					if (chunks[0].matrix[x] && chunks[0].matrix[x][z] && chunks[0].matrix[x][z][y])
						chunks[0].matrix[x][z][y] = "air";

					socket.emit('mineBlock', {
						id: socket.id,
						x: x,
						y: y,
						z: z
					})

					blocks.splice(i, 1);

					this.punching = true;
				}
			}
			offscene.remove(this.closest.object)
			scene.remove(this.closest.object)
			this.closest = {
				distance: Infinity
			}
			this.updateBlock = true;
			this.click = false;
		}
	}

	placeBlock() {
		// Continous placing of blocks by holding right click
		if (this.key.rightClick && Date.now() - this.key.rightClick > this.placingDelay) {
			this.key.rightClick = Date.now();
			this.place = true;
		}

		// Place a block
		if (this.closest.object && this.place) {
			var normal = this.closest.face.normal.clone();
			var p = this.closest.object.position.clone().add(normal.multiplyScalar(blockSize));

			var box = new Block(stone, p.x, p.y, p.z) // Choose which type of block to place

			// Let the server add the block
			//scene.add( box );
			blocks.push(box);

			this.punching = true;

			if (this.collisionHelper.collides()) {
				for (var i = 0; i < blocks.length; i++) {
					if (blocks[i].uuid === box.uuid) {
						blocks.splice(i, 1);
						this.punching = false;
					}
				}
			}
			this.place = false;

			if (this.punching) {
				blocks.pop();
				socket.emit('placeBlock', {
					id: socket.id,
					x: p.x/blockSize,
					y: p.y/blockSize,
					z: p.z/blockSize
				})
			}
				
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
				if (this.collisionHelper.collides() && this.velocity.y < 0 || this.position.y <= blockSize) {
					this.onObject = true;
					newMove['y'] = 0;
				} else if (this.collisionHelper.collides()) {
					this.velocity.y = 0;
					newMove['y'] = 0;
				}
				// Put back before testing y
				this.controls.getObject().position['y'] = previousPosition['y'];
			} else {
				// Try testing x and z and y if flying
				this.controls.getObject().position[axis] += newMove[axis];
				if (this.collisionHelper.collides()) {
					newMove[axis] = 0;

					if (axis === 'y' && this.fly && this.velocity.y < 0) {
						this.fly = false;
					}
				}

				var onBlock = false;

				// Test for y during shift mode
				this.controls.getObject().position['y'] += savedMove['y'];
				if (!(this.collisionHelper.collides() && this.velocity.y < 0) && this.onObject && this.key.sneak) {
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
		if (map[32]) {
			if (!player.fly && player.onObject) {
				player.velocity.y += 150;
			} else {
				player.key.up = -1;
			}
		}

		// Stuck in block
		if (this.onObject && this.collisionHelper.collides()) {
			this.controls.getObject().position['y'] += 5;
		}

		// Save position

		this.savedPosition = this.controls.getObject().position.clone();
	}

	update(delta) {
		// Update movement
		if (this.key.sprint) {
			if (this.speed < 3) {
				this.speed += delta * 10;
			} else {
				this.speed = 3;
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
				//this.arm.rotation.x -= 0.1;
				this.arm.rotation.y -= 0.1;
				this.arm.rotation.z += 0.1;
			} else {
				this.punching = false;
			}

		} else if (this.arm.position.z < -2.5) {
			this.arm.position.z += 0.5;
			//this.arm.rotation.x += 0.1;
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
}

class CollisionHelper {
	constructor(_player, _blocks) {
		this.player = _player;
		this.blocks = _blocks;
	}

	collides() {
		var playerBox = this.player.boundingBox();
		for (var i = 0; i < this.blocks.length; i++) {
			var block = this.blocks[i];
			if (this.collideWithCube(playerBox, block)) {
				return true;
			}
		}
		return false;
	}

	collideWithCube(playerBox, block) {
		var box, vmax, vmin;
		vmin = this.addPosition(block.position.add(new THREE.Vector3(0*blockSize*blockSize, 0, 0*blockSize*blockSize)), -blockSize/2)
		vmax = this.addPosition(block.position, blockSize/2)
		box = {
			vmin: vmin,
			vmax: vmax
		}
		return this.cubeCollision(playerBox, box);
	}

	addPosition(position, value) {
		var pos;
		pos = position.clone();
		pos.x += value;
		pos.y += value;
		pos.z += value;
		return pos;
	}

	intervalCollision(s1, f1, s2, f2) {
		if (s1 === s2) {
			return true;
		}
		if (s1 < s2) {
			return f1 >= s2;
		}
		return f2 >= s1;
	}

	cubeCollision(cube1, cube2) {
		var axes = ['x', 'y', 'z'];
		var collides, fcol;
		fcol = this.intervalCollision;
		for (var i = 0; i < axes.length; i++) {
			var axis = axes[i];
			collides = fcol(cube1.vmin[axis], cube1.vmax[axis], cube2.vmin[axis], cube2.vmax[axis])
			if (!collides) {
				return false;
			}
		}
		return true;
	}

	// Add a possibleCubes function to test only cubes in a certain range
}