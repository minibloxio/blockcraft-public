function addMesh(geometry, material) {
	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
}

function addPlayer(players, id) {
	let p = players[id];

	// Set position of entity
	p.pos = Ola({x:0, y:0, z:0}, 50);
	p.rot = Ola({x:0, y:0, z:0}, 50);
	p.dir = Ola({x:0, y:0, z:0}, 50);

	// Add head
	p.head = addMesh(new THREE.BoxGeometry(playerDim.headSize, playerDim.headSize, playerDim.headSize), head.material);
	p.head.position.set(0, blockSize*0.2, 0);

	p.neck = new THREE.Object3D();
	p.neck.add(p.head);

	// Add body
	p.body = addMesh(new THREE.BoxGeometry(playerDim.torso, playerDim.torsoHeight, playerDim.legSize), body.material);
	p.body.position.set(0, -blockSize*0.45, 0);

	// Add arms
	p.leftArm = addMesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), arm.material)
	p.leftArm.position.set(-playerDim.armSize*3/2, -blockSize*0.45, 0);

	p.rightArm = addMesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), arm.material)
	p.rightArm.position.set(0, -blockSize*0.3, 0);

	// Shoulder joints
	p.rightShoulder = new THREE.Object3D();
	p.rightShoulder.position.set(playerDim.armSize*3/2, -blockSize*0.15, 0);
	p.rightShoulder.add(p.rightArm);

	// Add legs
	p.leftLeg = addMesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), leg.material)
	p.leftLeg.position.set(-playerDim.legSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	p.rightLeg = addMesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), leg.material)
	p.rightLeg.position.set(playerDim.armSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	// Add nametag
	var name_geometry = new THREE.TextGeometry( p.name, {
		font: minecraft_font,
		size: 3,
		height: 0.5
	} );
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

	// Entity (combine skeleton and nametag)
	p.entity = new THREE.Group();
	p.entity.name = p.id;
	p.entity.add(p.skeleton);
	p.entity.add(p.nameTag);

	scene.add(p.entity);

	p.punchingT = 0;

	console.log("Added player", id)
}

function updatePlayer(p) {
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

	// Punching animation
	if (p.punching) {
		p.punchingT += 0.4;

		if (p.punchingT > 2*Math.PI)
			p.punchingT = 0
	} else {
		if (p.punchingT < 2*Math.PI) {
			p.punchingT += 0.4;
		} else {
			p.punchingT = 2*Math.PI;
		}
	}

	p.nameTag.quaternion.copy(camera.getWorldQuaternion());
		
	p.rightShoulder.rotation.x = (-Math.cos(p.punchingT)+1)/2;
	p.rightShoulder.rotation.z = Math.sin(p.punchingT)/2;
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