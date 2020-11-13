function addMesh(geometry, material) {
	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
}

function addPlayer(players, id) {
	let {blockSize} = world;

	let p = players[id];

	// Set position of entity
	p.pos = Ola({x:0, y:0, z:0});
	p.rot = Ola({x:0, y:0, z:0});
	p.dir = Ola({x:0, y:0, z:0});

	// Add head
	p.head = addMesh(new THREE.BoxGeometry(player.dim.headSize, player.dim.headSize, player.dim.headSize), head.material);
	p.head.position.set(0, blockSize*0.2, 0);

	p.neck = new THREE.Object3D();
	p.neck.add(p.head);

	// Add body
	p.body = addMesh(new THREE.BoxGeometry(player.dim.torso, player.dim.torsoHeight, player.dim.legSize), body.material);
	p.body.position.set(0, -blockSize*0.45, 0);

	// Add arms
	p.leftArm = addMesh(new THREE.BoxGeometry(player.dim.armSize, player.dim.armHeight, player.dim.armSize), arm.material)
	p.leftArm.position.set(-player.dim.armSize*3/2, -blockSize*0.45, 0);

	p.rightArm = addMesh(new THREE.BoxGeometry(player.dim.armSize, player.dim.armHeight, player.dim.armSize), arm.material)
	p.rightArm.position.set(0, -blockSize*0.3, 0);

	// Add hand

	let hand = p.toolbar[p.currSlot];
	if (p.hand && p.hand.mesh)
		p.rightArm.remove(p.hand.mesh);
	if (hand) {
		updateHand(hand, p);
	}

	// Shoulder joints
	p.rightShoulder = new THREE.Object3D();
	p.rightShoulder.position.set(player.dim.armSize*3/2, -blockSize*0.15, 0);
	p.rightShoulder.add(p.rightArm);

	// Add legs
	p.leftLeg = addMesh(new THREE.BoxGeometry(player.dim.legSize, player.dim.legHeight, player.dim.legSize), leg.material)
	p.leftLeg.position.set(-player.dim.legSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	p.rightLeg = addMesh(new THREE.BoxGeometry(player.dim.legSize, player.dim.legHeight, player.dim.legSize), leg.material)
	p.rightLeg.position.set(player.dim.armSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	// Add nametag
	var name_geometry = new THREE.TextGeometry( p.name, {
		font: minecraft_font,
		size: 3,
		height: 0.5
	});
	name_geometry.center();

	p.nameTag = new THREE.Mesh(name_geometry, new THREE.MeshBasicMaterial({color: 0xeeeeee}));
	p.nameTag.position.y += blockSize *3/4;

	// Create skeleton of head, body, arms, and legs
	p.skeleton = new THREE.Group();
	p.skeleton.add(p.body);
	p.skeleton.add(p.leftArm);

	p.skeleton.add(p.rightShoulder);
	p.skeleton.add(p.leftLeg);
	p.skeleton.add(p.rightLeg);

	p.skeleton.add(p.neck);
	p.skeleton.name = p.id;

	// Entity (combine skeleton and nametag)
	p.entity = new THREE.Group();
	p.entity.name = p.id;
	p.entity.add(p.skeleton);
	p.entity.add(p.nameTag);

	p.entity.type = "player";

	scene.add(p.entity);

	p.punchingT = 0;
}

function updatePlayers(serverPlayers) {
	let {blockSize} = world;

	for (let id in players) {
		let p = players[id];
		if (p.pos && p.rot && serverPlayers[id]) {
			// Set new player location
			p.pos.set({x: serverPlayers[id].pos.x, y: serverPlayers[id].pos.y, z: serverPlayers[id].pos.z});
			p.rot.set({x: serverPlayers[id].rot.x, y: serverPlayers[id].rot.y, z: serverPlayers[id].rot.z});
			p.dir.set({x: serverPlayers[id].dir.x, y: serverPlayers[id].dir.y, z: serverPlayers[id].dir.z});

			// Update player data
			p.hp = serverPlayers[id].hp;
			if (p.hp <= 0 && p.entity.visible) {
				p.entity.visible = false;
			} else if (p.hp > 0) {
				p.entity.visible = true;
			}

			// Transfer data
			let transferredValues = (({ ping, toolbar, walking, punching, blocking }) => ({ ping, toolbar, walking, punching, blocking }))(serverPlayers[id]);
			Object.assign(p, transferredValues)

			// Update player hand if necessary
			if (p.currSlot != serverPlayers[id].currSlot) {
				p.currSlot = serverPlayers[id].currSlot;

				let hand = p.toolbar[p.currSlot];

				if (p.hand && p.hand.mesh)
					p.rightArm.remove(p.hand.mesh);

				if (hand) {
					updateHand(hand, p);
				}
			}

			// Update player name if necessary (performance intensive)
			if (p.name != serverPlayers[id].name) {
				p.name = serverPlayers[id].name;

				p.entity.remove(p.nameTag)

				var name_geometry = new THREE.TextGeometry( p.name, {
					font: minecraft_font,
					size: 3,
					height: 0.5
				} );
				name_geometry.center();

				p.nameTag = new THREE.Mesh(name_geometry, new THREE.MeshBasicMaterial({color: 0xeeeeee}));
				p.nameTag.castShadow = true;
				p.nameTag.position.y += blockSize*3/4
				p.entity.add(p.nameTag);
			}
		}
	}
}

function updatePlayer(p) {
	let {blockSize} = world;

	p.entity.position.set(p.pos.x, p.pos.y, p.pos.z);
	p.skeleton.rotation.set(p.rot.x, p.rot.y, p.rot.z);
	p.neck.rotation.x = p.dir.y;

	// Walking animation
	if (p.walking) {
		if (p.leftArm.rotation.x < -Math.PI/3) {
			p.extendBody = false;
		} else if (p.leftArm.rotation.x > Math.PI/3) {
			p.extendBody = true;
		}
		
		if (p.extendBody) {
			rotateAboutPoint(p.rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), 0.1)
			rotateAboutPoint(p.leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), -0.1)

			rotateAboutPoint(p.rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), -0.1)
			rotateAboutPoint(p.leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), 0.1)
		} else {
			rotateAboutPoint(p.rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), -0.1)
			rotateAboutPoint(p.leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), 0.1)

			rotateAboutPoint(p.rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), 0.1)
			rotateAboutPoint(p.leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), -0.1)
		}
	} else {
		rotateAboutPoint(p.rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), Math.abs(p.rightArm.rotation.x)*Math.sign(-p.rightArm.rotation.x))
		rotateAboutPoint(p.leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), Math.abs(p.leftArm.rotation.x)*Math.sign(-p.leftArm.rotation.x))

		rotateAboutPoint(p.rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), Math.abs(p.rightLeg.rotation.x)*Math.sign(-p.rightLeg.rotation.x))
		rotateAboutPoint(p.leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), Math.abs(p.leftLeg.rotation.x)*Math.sign(-p.leftLeg.rotation.x))
	}

	if (p.hand) {
		let hand = p.toolbar[p.currSlot];
		let item_mesh = p.hand.mesh;
		if (hand) {
			if (p.blocking) {
				item_mesh.position.set(-4, -2, -3);
				item_mesh.rotation.set(0, -Math.PI/8, 0);
			} else if (hand.class == "item") {
				item_mesh.position.set(0, -4, -8);
				item_mesh.rotation.set(-Math.PI/2-Math.PI/6, Math.PI/2, 0);
			} else {
				item_mesh.position.set(-3, -player.dim.armHeight/2, -player.dim.armSize);
				item_mesh.rotation.set(0, Math.PI/4, 0);
			}
		}
	}
		
		
	// Punching animation
	if (p.punching) {
		p.punchingT += delta*5;

		if (p.punchingT > 1)
			p.punchingT = 0
	} else {
		if (p.punchingT < 1) {
			p.punchingT += delta*5;
		} else {
			p.punchingT = 1;
		}
	}

	p.nameTag.quaternion.copy(camera.getWorldQuaternion(new THREE.Quaternion()));
		
	p.rightShoulder.rotation.x = (-Math.cos(p.punchingT*Math.PI*2)+1)/2;
	p.rightShoulder.rotation.z = Math.sin(p.punchingT*Math.PI*2)/2;
}

function updatePlayerColor(id, color) {
	for (let a of players[id].skeleton.children) {
		if (a.type == "Mesh") {
			for (let material of a.material) {
				material.color = color;
			}
		} else {
			for (let material of a.children[0].material) {
				material.color = color;
			}
		}
	}
}

// Add entity

function addEntity(entity) {
	if (entity.type == "item") {
		let {blockSize} = world;

		if (entity.class == "item") {

			let canvas = document.createElement("canvas");
			canvas.width = 16;
			canvas.height = 16;
			let ctx = canvas.getContext("2d");
			ctx.drawImage(item_atlas, (entity.v-1)*16, 0, 16, 16, 0, 0, 16, 16);
			let texture = new THREE.CanvasTexture(canvas);
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;
			let mat = new THREE.MeshLambertMaterial({map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide})

			let item_mesh = new THREE.Mesh(new THREE.PlaneGeometry(blockSize/4, blockSize/4), mat);
			item_mesh.renderOrder = 1;
			item_mesh.name = "item";
			item_mesh.position.set(entity.pos.x, entity.pos.y+blockSize/8, entity.pos.z);

			world.entities[entity.id] = entity;
			world.entities[entity.id].mesh = item_mesh;

			scene.add(world.entities[entity.id].mesh)
		} else {
			let uvVoxel = entity.v-1;
			let block_geometry = new THREE.BufferGeometry();
			const {positions, normals, uvs, indices} = world.generateGeometryDataForItem(uvVoxel);
			const positionNumComponents = 3;
			block_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
			const normalNumComponents = 3;
			block_geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
			const uvNumComponents = 2;
			block_geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
			block_geometry.setIndex(indices);
			block_geometry.computeBoundingSphere();

			let block_mesh = new THREE.Mesh(block_geometry, material);
			block_mesh.name = "item";
			block_mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
			block_mesh.castShadow = true;
			block_mesh.receiveShadow = true;

			world.entities[entity.id] = entity;
			world.entities[entity.id].mesh = block_mesh;

			scene.add(world.entities[entity.id].mesh);
		}
	} else if (entity.type == "remove_item" && world.entities[entity.id]) {

		world.entities[entity.id].mesh.geometry.dispose();
		world.entities[entity.id].mesh.material.dispose();
		scene.remove(world.entities[entity.id].mesh);
		delete world.entities[entity.id];
	}
}

// Update player hand
function updateHand(entity, p) {
	if (!item_atlas)
		return;

	let {blockSize} = world;

	if (entity.class == "item") {
		let canvas = document.createElement("canvas");
		canvas.width = 16;
		canvas.height = 16;
		let ctx = canvas.getContext("2d");
		ctx.drawImage(item_atlas, (entity.v-1)*16, 0, 16, 16, 0, 0, 16, 16);
		let texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.repeat.x = -1;
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		let mat = new THREE.MeshLambertMaterial({map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide})

		let item_mesh = new THREE.Mesh(new THREE.PlaneGeometry(blockSize, blockSize), mat);
		item_mesh.renderOrder = 1;
		item_mesh.name = "item";
		item_mesh.castShadow = true;
		item_mesh.receiveShadow = true;

		item_mesh.position.set(0, -4, -8);
		item_mesh.rotation.set(-Math.PI/2-Math.PI/6, Math.PI/2, 0);

		p.hand = entity;
		p.hand.mesh = item_mesh;

		p.rightArm.add(p.hand.mesh)
	} else {
		let uvVoxel = entity.v-1;
		let block_geometry = new THREE.BufferGeometry();
		const {positions, normals, uvs, indices} = world.generateGeometryDataForItem(uvVoxel);
		const positionNumComponents = 3;
		block_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
		const normalNumComponents = 3;
		block_geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
		const uvNumComponents = 2;
		block_geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
		block_geometry.setIndex(indices);
		block_geometry.computeBoundingSphere();

		let block_mesh = new THREE.Mesh(block_geometry, material);
		block_mesh.name = "item";
		block_mesh.castShadow = true;
		block_mesh.receiveShadow = true;

		block_mesh.position.set(-3, -player.dim.armHeight/2, -player.dim.armSize);
		block_mesh.rotation.set(0, Math.PI/4, 0);

		p.hand = entity;
		p.hand.mesh = block_mesh;

		p.rightArm.add(p.hand.mesh);
	}
}

// Rotate object around a 3D point
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

    if(pointIsWorld){
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if(pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }

    obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}