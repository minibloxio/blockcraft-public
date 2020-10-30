// Classes

class Player {
	constructor(camera, blockSize) {
		// 3d stuff
		this.controls = new THREE.PointerLockControls( camera );;
		this.controls.getObject().position.y += blockSize*75;
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

		this.knockbackVelocity = new THREE.Vector3();

		this.speed = 2;
		this.walkSpeed = 2;
		this.maxWalkSpeed = 2;
		this.sprintSpeed = 3.5;
		this.maxSprintSpeed = 3.5;
		this.distanceMoved = 0;

		this.fly = false;
		this.flyingEnabled = false; // Flying is not smooth
		this.clip = true;
		
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

		// World interaction
		this.click = false;
		this.prevSelect = undefined;

		this.place = false;
		this.placeType = 2; // Type of block being placed

		this.punching = false;
		this.drop = false; // Drop item

		this.lastRaycast = Date.now();

		// Player appearance

		this.halfWidth = blockSize * 0.3;
		this.halfDepth = blockSize * 0.3;
		this.halfHeight = blockSize * 0.8;

		this.dim = {
			torso: 0.5*blockSize,
			torsoHeight: 0.75*blockSize,
			armSize: 0.25*blockSize,
			armHeight: 0.75*blockSize,
			legSize: 0.25*blockSize,
			legHeight: 0.75*blockSize,
			headSize: 0.55*blockSize,
			height: 1.8*blockSize
		}

		this.miningDelay = [
			Infinity,
			1,
			1,
			1,
			1,
			1,
			0.5,
			1,
			1,
			1,
			1,
			1,
			Infinity
		];
		this.miningDelayConstant = 0;
		this.placingDelay = 200;

		// Player info
		this.hp = 10;

		// Chunk loading
		this.chunksToRequest = [];
		this.chunksToLoad = [];
		this.chunksToUnload = [];

		this.renderDistance = 8;
		this.chunkLoadingRate = 1;
		this.chunkTick = Date.now();
		this.chunkDelay = 100;

		// Hand
		this.addBody();
		
		// Select box wireframe
		var select_box = new THREE.BoxGeometry(blockSize+0.1, blockSize+0.1, blockSize+0.1);
		this.mine_box = new THREE.Mesh(select_box, mining_progress[0].material)
		this.mine_box.name = "wireframe";
		scene.add(this.mine_box)

		var geometry = new THREE.EdgesGeometry(select_box);
		var material = new THREE.LineBasicMaterial({color: "black", linewidth: 2})
		this.select_wireframe = new THREE.LineSegments(geometry, material);
		this.select_wireframe.name = "wireframe";
		scene.add(this.select_wireframe)

		// Inventory
		this.currentSlot = 0;
		this.toolbar = [];
	}

	addBody() {
		let {blockSize} = world;
		// Add client arm
		this.arm = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3), armC.material);
		this.arm.castShadow = true;
		this.arm.receiveShadow = true;
		this.arm.position.set(2, -2, -2.5);
		this.arm.rotation.set(Math.PI, Math.PI, 0);
		camera.add(this.arm);

		/*// Add head
		this.head = addMesh(new THREE.BoxGeometry(this.dim.headSize, this.dim.headSize, this.dim.headSize), head.material);
		this.head.position.set(0, blockSize*0.2, 0);

		this.neck = new THREE.Object3D();
		this.neck.add(this.head);

		// Add body
		this.body = addMesh(new THREE.BoxGeometry(this.dim.torso, this.dim.torsoHeight, this.dim.legSize), body.material);
		this.body.position.set(0, -blockSize*0.45, 0);

		// Add arms
		this.leftArm = addMesh(new THREE.BoxGeometry(this.dim.armSize, this.dim.armHeight, this.dim.armSize), arm.material)
		this.leftArm.position.set(-this.dim.armSize*3/2, -blockSize*0.45, 0);

		this.rightArm = addMesh(new THREE.BoxGeometry(this.dim.armSize, this.dim.armHeight, this.dim.armSize), arm.material)
		this.rightArm.position.set(0, -blockSize*0.3, 0);

		// Shoulder joints
		this.rightShoulder = new THREE.Object3D();
		this.rightShoulder.position.set(this.dim.armSize*3/2, -blockSize*0.15, 0);
		this.rightShoulder.add(this.rightArm);

		// Add legs
		this.leftLeg = addMesh(new THREE.BoxGeometry(this.dim.legSize, this.dim.legHeight, this.dim.legSize), leg.material)
		this.leftLeg.position.set(-this.dim.legSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

		this.rightLeg = addMesh(new THREE.BoxGeometry(this.dim.legSize, this.dim.legHeight, this.dim.legSize), leg.material)
		this.rightLeg.position.set(this.dim.armSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

		// Create skeleton of head, body, arms, and legs
		this.skeleton = new THREE.Group();
		this.skeleton.add(this.body);
		this.skeleton.add(this.leftArm);

		this.skeleton.add(this.rightShoulder);
		this.skeleton.add(this.leftLeg);
		this.skeleton.add(this.rightLeg);

		this.skeleton.add(this.neck);

		// Entity (combine skeleton and nametag)
		this.entity = new THREE.Group();
		this.entity.castShadow = true;
		this.entity.name = this.id;
		this.entity.add(this.skeleton);

		scene.add(this.entity);*/
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
		let {blockSize} = world;
    	// Crosshair selection for blocks

		var intersects;

		// update the picking ray with the camera and mouse position
		this.selectcaster.setFromCamera( mouse, camera );
		this.selectcaster.far = blockSize * 5;

		// calculate blocks intersecting the picking ray
		intersects = this.selectcaster.intersectObjects( scene.children );

		var picked = []
		for (var i = 0; i < intersects.length; i++) {
			let object = intersects[i].object;
			let voxel = world.getVoxel(object.position.x/blockSize, object.position.y/blockSize, object.position.z/blockSize) ;
			if (!(object.name == "wireframe" || object.name == "item") && voxel != 14) {
				picked.push(intersects[i])
			}
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

		if (closest.point && closest.face && update) {
			let x = Math.floor((closest.point.x-closest.face.normal.x)/blockSize)*blockSize+blockSize*0.5;
			let y = Math.floor((closest.point.y-closest.face.normal.y)/blockSize)*blockSize+blockSize*0.5;
			let z = Math.floor((closest.point.z-closest.face.normal.z)/blockSize)*blockSize+blockSize*0.5;
			
			this.mine_box.position.set(x, y, z);
			this.select_wireframe.position.set(x, y, z);
			this.select_wireframe.visible = true;
		} else {
			this.select_wireframe.visible = false;
		}

		this.closest = closest;
    }

    punch() {
    	// Punch players

		let {blockSize} = world;
    	this.selectcaster.far = blockSize * 4;

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

			playerId = playerId.name;

			if (!players[playerId].invulnerable) {
				players[playerId].invulnerable = true;

				// Calculate the knockback force
				let crit = false;
				if (this.velocity.y < 0) {
					crit = true;
				}

				socket.emit("punchPlayer", { // Send to server (IBRAHIM I'M LOOKING AT YOU)
					id: playerId,
					dir: camera.getWorldDirection(),
					force: crit ? 400 : 200,
					crit: crit
				});
				setTimeout(function () {
					if (players[playerId])
						players[playerId].invulnerable = false;
				}, 400)
			}
		}
    }

	mine() {
		let {blockSize} = world;

		// Check if block is mined
		if (this.closest.point && this.closest.face) {
			let x = Math.floor((this.closest.point.x-this.closest.face.normal.x)/blockSize);
			let y = Math.floor((this.closest.point.y-this.closest.face.normal.y)/blockSize);
			let z = Math.floor((this.closest.point.z-this.closest.face.normal.z)/blockSize);

			let miningDelta = (Date.now() - this.key.leftClick) // How much time passed while mining

			let voxel = world.getVoxel(x, y, z);
			let minable = voxel != 1 && voxel != 14;

			if (!minable)
				return;

			let miningDelay = (this.onObject ? this.miningDelay[voxel-1] : this.miningDelay[voxel-1] * 3) * this.miningDelayConstant;

			// Continous mining of blocks by holding right click
			if (this.key.leftClick && miningDelta > miningDelay) { // Break block
				this.key.leftClick = Date.now();
				this.mine_box.visible = false;
				this.prevSelect = undefined;

				this.closest = {
					distance: Infinity
				}
				this.click = false;

				// Remove blocks
				world.setVoxel(x, y, z, 0);
			    updateVoxelGeometry(x, y, z);

				// Send data to server
				socket.emit('setBlock', {
					x: x,
					y: y,
					z: z,
					t: 0,
					v: voxel
				})
			} else if (this.key.leftClick && this.stoppedPunching) { // Continue punching animation
				this.punching = true;
				this.stoppedPunching = false;
			} else if (this.key.leftClick && miningDelta < miningDelay) { 
				// Check if player is mining the same block
				if (this.prevSelect == undefined) {
					this.prevSelect = new THREE.Vector3(x, y, z);
				} else if (!this.prevSelect.equals(new THREE.Vector3(x, y, z))) {
					this.key.leftClick = Date.now();
					this.prevSelect = new THREE.Vector3(x, y, z);
					this.mine_box.material = mining_progress[0].material
				} else {
					this.prevSelect = new THREE.Vector3(x, y, z);
				}

				
			} else { // Stopped mining
				this.mine_box.material = mining_progress[0].material
			}
			if (this.key.leftClick) {
				// Update mining progress indicator

				let index = Math.floor(miningDelta/miningDelay*mining_progress.length).clamp(0, mining_progress.length-1);

				if (mining_progress[index]) {
					this.mine_box.material = mining_progress[index].material
					this.mine_box.visible = true;
				}
					
			}
		
		} else {
			this.mine_box.material = mining_progress[0].material
			this.mine_box.visible = false;
		}
	}

	placeBlock() {
		let {blockSize} = world;
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

			let item = this.toolbar[this.currentSlot]
			if (item && item.v > 0 && item.c > 0) { // Place a block, not air
				world.setVoxel(x, y, z, item.v);

			    if (this.collides()) {
			    	world.setVoxel(x, y, z, 0);
			    	updateVoxelGeometry(x, y, z);
			    } else {

			    	updateVoxelGeometry(x, y, z);
			    	// Send data to server
					socket.emit('setBlock', {
						x: x,
						y: y,
						z: z,
						t: item.v
					})
					this.punching = true;
			    }

			    this.place = false;
			}
		}
	}

	dropItem() {
		if (!map[81]) {
			this.allowDrop = true;
		}
		if (map[81] && this.allowDrop) {
			this.allowDrop = false;
			let item = this.toolbar[this.currentSlot]
			if (item && item.c > 0) {
				let dropDir = this.camera.getWorldDirection();
				dropDir = new Vector(dropDir.x, dropDir.z);
				dropDir.normalize();

				socket.emit('dropItem', {
					v: item.v,
					x: player.position.x,
					y: player.position.y-8,
					z: player.position.z,
					dir: {x: dropDir.x, z: dropDir.y}
				});

				this.drop = false;
			}
		}
	}

	move(delta) {
		this.updateVelocities(delta);
		this.updateMoveAxis(delta);
		this.applyKnockback(delta);
		this.checkCollision(delta);
	}

	updateVelocities(delta) {
		let {blockSize} = world;

		this.newMove = new THREE.Vector3();

		// Reduce velocity (friction)
		var previousVelocity = this.velocity.clone();
		this.velocity.x -= previousVelocity.x * 10.0 * delta;
		this.velocity.z -= previousVelocity.z * 10.0 * delta;
		// Determine direction vector
		this.direction.x = this.key.left + this.key.right;
		this.direction.y = this.key.up + this.key.down;
		this.direction.z = this.key.forward + this.key.backward;
		
		this.direction.normalize(); // this ensures consistent movements in all directions

		if (this.onObject && !this.fly) this.velocity.y = Math.max( 0, this.velocity.y );

		if (this.fly) {
			this.velocity.y -= previousVelocity.y * 10.0 * delta;
		} else if (this.inWater && this.direction.z > 0 && this.key.sprint) {

			let dir = this.camera.getWorldDirection();
			dir.z = dir.z;
			dir.multiplyScalar(50*delta*this.speed)

			this.previousPosition = this.position.clone();
			var currentPosition = this.position.clone();
			
			currentPosition.add(dir);
			var move = currentPosition.sub(this.previousPosition)
			this.newMove.add(move);

			this.velocity.multiplyScalar(0)
			this.halfHeight = blockSize * 0.4;

		} else {
			if (this.key.up && this.inWater) {
				this.velocity.y = 50;
			} else if(colorPass.enabled) {
				this.velocity.y = -20;
			} else {
				this.velocity.y -= 9.81 * 50.0 * delta; // Falling in air
			}

			// Jump
			if (this.key.up && !showChatBar) {
				if (this.onObject) {
					this.velocity.y += 150;
				} else {
					this.key.up = -1;
				}
			}

			// Reset shift position

			if (!this.fly) {
				this.position.y = this.savedPosition['y'];
				this.halfHeight = blockSize * 0.8;
			}
		}

		if ( this.key.forward || this.key.backward ) this.velocity.z -= this.direction.z * 400.0 * delta;
		if ( this.key.left || this.key.right ) this.velocity.x -= this.direction.x * 400.0 * delta;
		if ( (this.key.down || this.key.up) && this.fly) this.velocity.y -= this.direction.y * 400.0 * delta;

		
	}

	updateMoveAxis(delta) {
		// Get movement preview by adding up all the movement from object space
		this.onObject = false;

		var axes = ['y', 'x', 'z']
		
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
			
			this.previousPosition = this.position.clone();
			var currentPosition = this.controls.getObject().clone();
			currentPosition.translateOnAxis(axesVec, currentVel[i]);
			var move = currentPosition.position.sub(this.previousPosition)
			this.newMove.add(move);
		}
	}

	applyKnockback(delta) {
		// Player knockback
		let knockback = new THREE.Vector3(this.knockbackVelocity.x, this.knockbackVelocity.y, this.knockbackVelocity.z);
		knockback.multiplyScalar(delta);
		this.newMove.add(knockback);
		this.knockbackVelocity.divideScalar(1.1);

		// Player camera fall knockback
		if (Math.abs(camera.rotation.z) > 0.1) {
			camera.rotation.z -= Math.sign(camera.rotation.z)*delta*3; // Rate at which camera rotation returns to normal
		} else {
			camera.rotation.z = 0;
		}
	}

	checkCollision(delta) {
		let {blockSize} = world;
		var test_axes = ['y', 'x', 'z', 'xz']

		// Check for collision
		if (this.clip) {
			var savedMove = this.newMove.clone();

			// Test each axis in collsion
			var previousPosition = this.position.clone();

			for (let axes of test_axes) {

				if (axes === 'y' && !this.fly) {
					// Test for y
					this.position.y += this.newMove['y'];
					let collision = this.collides();
					if (!collision)
						continue;

					if (!this.inWater && this.velocity.y <= 0 || this.position.y <= blockSize) {
						let jumpDiff = Math.floor((this.prevHeight - this.position.y)/blockSize)-3;

						if (jumpDiff > 0 && jumpDiff < 500) { // Fall damage
							socket.emit('takeDamage', jumpDiff)
							camera.rotation.order = "YXZ"
							camera.rotation.z = Math.PI/16 + Math.PI/64 * Math.min(20, jumpDiff); // Yoink the camera
							this.fallCooldown = Date.now();
							this.prevHeight = this.position.y;
						}

						this.onObject = true;
						this.newMove['y'] = 0;

					} else if (this.inWater || this.onObject) {
						this.newMove['y'] = 0;
					} else {
						this.velocity.y = 0;
						this.newMove['y'] = 0;
					}
					// Put back before testing y
					this.position.y = previousPosition['y'];
				}


				let separate_axes = axes.split('');

				for (let axis of separate_axes) {
					this.controls.getObject().position[axis] += this.newMove[axis];
				}

				if (this.collides()) {
					for (let axis of separate_axes) {
						this.newMove[axis] = 0;

						if (axis === 'y' && this.fly && this.velocity.y < 0) {
							this.fly = false;
						}
					}
				}

				for (let axis of separate_axes) {

					// Test for y during shift mode
					this.position.y += savedMove['y'];
					if (!this.collides() && this.onObject && this.key.sneak) {
						this.velocity[axis] = 0;
						this.newMove[axis] = 0;
					}
					// Put back before testing y
					this.position.y = previousPosition['y']

					this.position[axis] = previousPosition[axis];
				}
			}
		}

		// Update player position
		this.position.x += this.newMove['x'];
		if (!(!this.onObject && this.newMove['y'] === 0) && !this.fly) {
			this.position.y += this.newMove['y'];
		} else {
			this.position.y += this.newMove['y'];
		}
		this.position.z += this.newMove['z'];

		// Stop sprinting if you hit a block
		this.distanceMoved += this.previousPosition.sub(this.position).length();
		if (this.distanceMoved < 1.5 && this.onObject === false && !this.fly) {
			this.speed = 2;
		}

		// Record last height on ground
		if (this.onObject || this.fly || this.inWater) {
			this.prevHeight = this.position.y;
		}

		// Check if stuck

		if (this.collides() && this.clip) {
			this.position.y += blockSize*delta*30; // Move up at a rate of 10 blocks per second
		}

		// Save position

		this.savedPosition = this.position.clone();

		// Update movement

		this.sprintSpeed = this.inWater ? this.maxWalkSpeed*1.5 : this.maxSprintSpeed;
		if (this.fly) this.sprintSpeed = this.maxSprintSpeed * 2;
		if (this.key.backward) this.sprintSpeed = this.maxWalkSpeed;
		this.walkSpeed = this.inWater ? this.maxWalkSpeed/2 : this.maxWalkSpeed;
		if (this.key.sprint) {
			if (this.speed < this.sprintSpeed) {
				this.speed += delta * 10;
			} else {
				this.speed = this.sprintSpeed;
			}
		} else {
			if (this.speed > this.walkSpeed) {
				this.speed -= delta * 10;
			} else {
				this.speed = this.walkSpeed;
			}
		}
		this.positionYOffset = 0;
		if (this.key.sneak && !this.fly && this.onObject) {
			
			this.speed = 0.5;

			this.position.y += -this.walkSpeed;
			this.halfHeight = blockSize * 0.6;
		}

		// Update player arm
		let dt = delta*1000/16;
		if (this.punching) {
			if (this.arm.position.z > -4.5) {
				this.arm.position.z -= 0.5*dt;
				this.arm.rotation.y -= 0.1*dt;
				this.arm.rotation.z += 0.1*dt;
			} else {
				this.punching = false;
			}

		} else if (this.arm.position.z < -2.5) {
			this.arm.position.z += 0.5*dt;
			this.arm.rotation.y += 0.1*dt;
			this.arm.rotation.z -= 0.1*dt;
		} else {
			this.stoppedPunching = true;
		}

		// Change camera fov when sprinting
		if (this.speed <= 2 || this.distanceMoved < 1.5) {
			if (camera.fov > 75) {
				camera.fov -= 0.3;
			}
		} else if (this.distanceMoved > 1.5) {
			if (camera.fov < 80) {
				camera.fov += 0.3;
			}
		}
		camera.updateProjectionMatrix();
	}

	updateClient(data) {
		if (data.hp > this.hp) {
			heartUp = true;
		}
		this.hp = data.hp;
		if (this.hp <= 0) { // Add client death message

		}

		this.toolbar = data.toolbar;
	}

	updateChunks() {
		let {blockSize, cellSize} = world;
		let t = Date.now();
		// Update chunks

		let cellPos = world.computeCellFromPlayer(this.position.x, this.position.y, this.position.z);

		// Chunks to unload
		for (let id in world.cells) {
			let cell = id.split(",");
			let dist = Math.sqrt(Math.pow(cellPos.x - parseInt(cell[0]), 2) + Math.pow(cellPos.z - parseInt(cell[2]), 2))


			if (dist > this.renderDistance * 0.75) {
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
	    	for (let y = 0; y < (world.buildHeight+1)/cellSize; y++) {
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
		if (Date.now()-this.chunkTick > this.chunkDelay) {
			this.chunkTick = Date.now();
			// Request chunks based on loading rate
			if (this.chunksToLoad.length < 10) {
				this.chunkDelay = 0
				let requestedChunks = [];
				for (var i = 0; i < this.chunkLoadingRate; i++) {
					let chunk = this.chunksToRequest[i];
					if (chunk) {
						world.generateCell(chunk.x, chunk.y, chunk.z)
						requestedChunks.push(chunk);
					}
				}
				if (requestedChunks.length > 0) {
					socket.emit('requestChunk', requestedChunks) // Call server to load this chunk
				}
			} else {
				this.chunkDelay = 100;
			}
				
			// Load chunks based on loading rate
			for (var i = 0; i < this.chunkLoadingRate; i++) {
				let chunk = this.chunksToLoad[i];
				if (chunk) {
					updateVoxelGeometry(chunk.x*cellSize, chunk.y*cellSize, chunk.z*cellSize)
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

	update(delta, world) {
		if (Date.now() - this.lastRaycast > 100) {
			player.select(true);
			this.lastRaycast = Date.now();
		}

		player.mine();
		player.placeBlock();
		player.dropItem();
		player.move(delta);
		player.updateChunks();
	}

	collideVoxel(x, y, z) {
		var voxel = world.getVoxel(x, y, z)
		if (voxel > 0 && voxel != 14)
			return voxel;
	}

	collides() {
		let {blockSize} = world;

		// Under water
		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y-blockSize*1.62)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		var voxel1 = world.getVoxel(x, y, z)

		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y+blockSize*0.2)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		var voxel2 = world.getVoxel(x, y, z)

		this.inWater = voxel1 == 14 || voxel2 == 14;

		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		var voxel = world.getVoxel(x, y, z)
		colorPass.enabled = voxel == 14;
		

		// Head and feet

		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y-this.halfHeight*2)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		if (this.collideVoxel(x, y, z)) return true;

		var x = Math.floor(player.position.x/blockSize);
		var y = Math.floor((player.position.y+blockSize*0.2)/blockSize);
		var z = Math.floor(player.position.z/blockSize);

		if (this.collideVoxel(x, y, z)) return true;

		// Top

		for (let i = -1; i < 2; i+=2) {
			for (let j = -1; j < 2; j+=2) {
				var x = Math.floor((player.position.x+i*blockSize*0.25)/blockSize);
				var y = Math.floor((player.position.y)/blockSize);
				var z = Math.floor((player.position.z+i*blockSize*0.25)/blockSize);

				if (this.collideVoxel(x, y, z)) return true;
			}
		}

		// Middle

		for (let i = -1; i < 2; i+=2) {
			for (let j = -1; j < 2; j+=2) {
				var x = Math.floor((player.position.x+i*blockSize*0.25)/blockSize);
				var y = Math.floor((player.position.y-blockSize*0.8)/blockSize);
				var z = Math.floor((player.position.z+j*blockSize*0.25)/blockSize);

				if (this.collideVoxel(x, y, z)) return true;
			}
		}
		

		// Bottom

		for (let i = -1; i < 2; i+=2) {
			for (let j = -1; j < 2; j+=2) {
				var x = Math.floor((player.position.x+i*blockSize*0.25)/blockSize);
				var y = Math.floor((player.position.y-this.halfHeight*2)/blockSize);
				var z = Math.floor((player.position.z+j*blockSize*0.25)/blockSize);

				if (this.collideVoxel(x, y, z)) return true;
			}
		}

		
	}
}