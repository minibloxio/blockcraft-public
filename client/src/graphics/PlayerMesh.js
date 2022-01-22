import * as THREE from "three";
import skinManager from "../managers/SkinManager";
import game from "../Game";

class PlayerMesh {
  static initPlayerMesh(p) {
    PlayerMesh.addPlayerMesh(p);
    PlayerMesh.addSkeleton(p);
    PlayerMesh.setPlayerArmor(p);
  }

  static addMesh(geometry, material) {
    let mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  static clearPlayerArmor(p) {
    for (let type in p.armorMesh) {
      p.armorMesh[type].visible = false;
    }
  }

  static updateArmor(p, p_) {
    let needsUpdate = false;

    for (let type in p_.armor) {
      if (p.armor[type] !== p_.armor[type]) {
        p.armor[type] = p_.armor[type];
        needsUpdate = true;
      }
    }

    if (needsUpdate) PlayerMesh.setPlayerArmor(p);
  }

  static setPlayerArmor(p) {
    PlayerMesh.clearPlayerArmor(p);

    let helmetType = skinManager.armorOrder[p.armor.helmet];
    let chestplateType = skinManager.armorOrder[p.armor.chestplate];
    let leggingsType = skinManager.armorOrder[p.armor.leggings];
    let bootsType = skinManager.armorOrder[p.armor.boots];

    if (helmetType) {
      p.armorMesh.helmet.visible = true;
      p.armorMesh.helmet.material = skinManager.getArmor(helmetType).head;
    }

    if (chestplateType) {
      p.armorMesh.chestplate.visible = true;
      p.armorMesh.chestplate.material = skinManager.getArmor(chestplateType).body;
      p.armorMesh.leftArm.visible = true;
      p.armorMesh.rightArm.visible = true;
      p.armorMesh.leftArm.material = skinManager.getArmor(chestplateType).armPlates;
      p.armorMesh.rightArm.material = skinManager.getArmor(chestplateType).armPlates;
    }

    if (leggingsType) {
      p.armorMesh.leggingsTop.visible = true;
      p.armorMesh.leggingsTop.material = skinManager.getArmor(leggingsType).leggingsTop;
      p.armorMesh.leftLeggings.visible = true;
      p.armorMesh.rightLeggings.visible = true;
      p.armorMesh.leftLeggings.material = skinManager.getArmor(leggingsType).leggings;
      p.armorMesh.rightLeggings.material = skinManager.getArmor(leggingsType).leggings;
    }

    if (bootsType) {
      p.armorMesh.leftBoots.visible = true;
      p.armorMesh.leftBoots.material = skinManager.getArmor(bootsType).boots;
      p.armorMesh.rightBoots.visible = true;
      p.armorMesh.rightBoots.material = skinManager.getArmor(bootsType).boots;
    }
  }

  static addHead(p) {
    let { blockSize } = world;

    let playerMat = skinManager.getSkin(p.skin || "steve");
    let helmetMat = skinManager.getArmor("diamond").head;

    let dim = player.dim;

    p.mesh.head = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(dim.headSize, dim.headSize, dim.headSize), playerMat.head);
    p.armorMesh.helmet = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(dim.headSize + 1, dim.headSize + 1, dim.headSize + 1), helmetMat);

    p.head = new THREE.Group();
    p.head.add(p.mesh.head, p.armorMesh.helmet);
    p.head.position.set(0, blockSize * 0.25, 0);

    p.headPivot = new THREE.Group();
    p.headPivot.add(p.head);

    p.neck = new THREE.Object3D();
    p.neck.add(p.headPivot);

    p.neck.position.set(0, -blockSize * 0.075, 0);
  }

  static addTorso(p) {
    let { blockSize } = world;

    let playerMat = skinManager.getSkin(p.skin || "steve");
    let chestplateMat = skinManager.getArmor("diamond").body;
    let leggingsMath = skinManager.getArmor("diamond").leggingsTop;

    let dim = player.dim;

    p.mesh.torso = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(dim.torso, dim.torsoHeight, dim.legSize), playerMat.body);
    p.armorMesh.chestplate = PlayerMesh.addMesh(
      new THREE.BoxBufferGeometry(dim.torso + 1, dim.torsoHeight + 1, dim.legSize + 1),
      chestplateMat
    );
    p.armorMesh.leggingsTop = PlayerMesh.addMesh(
      new THREE.BoxBufferGeometry(dim.torso + 0.5, (dim.torsoHeight * 5) / 12, dim.legSize + 0.5),
      leggingsMath
    );
    p.armorMesh.leggingsTop.position.y -= (dim.torsoHeight * (1 - 5 / 12)) / 2 + 1;

    // Add body
    p.torso = new THREE.Group();
    p.torso.add(p.mesh.torso, p.armorMesh.chestplate, p.armorMesh.leggingsTop);

    p.torso.position.set(0, -blockSize * 0.45, 0);
  }

  static addArms(p) {
    let { blockSize } = world;

    let playerMat = skinManager.getSkin(p.skin || "steve");
    let armMat = skinManager.getArmor("diamond").armPlates;

    let dim = player.dim;

    const armSize = p.skin == "alex" ? dim.armSizeSlim : dim.armSize;
    const leftShoulderOffset = p.skin == "alex" ? -5.45 : dim.armSize * -1.5;
    const rightShoulderOffset = p.skin == "alex" ? -0.55 : dim.armSize * 1.5;

    // Default skins
    p.mesh.arm = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(armSize, dim.armHeight, dim.armSize), playerMat.arm);
    let armPlatesMesh = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(armSize + 1, (dim.armHeight * 5) / 12, armSize + 1), armMat);
    armPlatesMesh.position.add(new THREE.Vector3().random().multiplyScalar(0.01));
    armPlatesMesh.position.y += (dim.armHeight * (1 - 5 / 12)) / 2 + 1;

    p.armorMesh.leftArm = armPlatesMesh.clone();
    p.armorMesh.leftArm.rotation.y += Math.PI;
    p.leftArm = new THREE.Group();
    p.leftArm.add(p.mesh.arm, p.armorMesh.leftArm);

    p.armorMesh.rightArm = armPlatesMesh.clone();
    p.rightArm = new THREE.Group();
    p.rightArm.add(p.mesh.arm.clone(), p.armorMesh.rightArm);

    // Shoulder joints
    p.leftShoulderJoint = new THREE.Object3D();
    p.leftShoulderJoint.add(p.leftArm);
    p.leftShoulderJoint.position.set(0, -blockSize * 0.3, 0);

    p.leftShoulder = new THREE.Object3D();
    p.leftShoulder.position.set(leftShoulderOffset, -blockSize * 0.15, 0);
    p.leftShoulder.add(p.leftShoulderJoint);

    p.rightShoulderJoint = new THREE.Object3D();
    p.rightShoulderJoint.add(p.rightArm);
    p.rightShoulderJoint.position.set(0, -blockSize * 0.3, 0);

    p.rightShoulder = new THREE.Object3D();
    p.rightShoulder.position.set(rightShoulderOffset, -blockSize * 0.15, 0);
    p.rightShoulder.add(p.rightShoulderJoint);
  }

  static addLegs(p) {
    let { blockSize } = world;

    let playerMat = skinManager.getSkin(p.skin || "steve");
    let leggingsMat = skinManager.getArmor("diamond").leggings;
    let bootsMat = skinManager.getArmor("diamond").boots;

    let dim = player.dim;

    p.mesh.leg = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(dim.legSize, dim.legHeight, dim.legSize), playerMat.leg);
    let leggingsMesh = PlayerMesh.addMesh(
      new THREE.BoxBufferGeometry(dim.legSize + 0.5, dim.legHeight * 0.75, dim.legSize + 0.5),
      leggingsMat
    );
    let bootsMesh = PlayerMesh.addMesh(new THREE.BoxBufferGeometry(dim.legSize + 1, dim.legHeight * 0.5, dim.legSize + 1), bootsMat);
    leggingsMesh.position.add(new THREE.Vector3().random().multiplyScalar(0.01));
    bootsMesh.position.add(new THREE.Vector3().random().multiplyScalar(0.01));
    leggingsMesh.position.y += dim.legHeight * 0.125;
    bootsMesh.position.y -= dim.legHeight * 0.3;

    p.armorMesh.leftLeggings = leggingsMesh.clone();
    p.armorMesh.leftBoots = bootsMesh.clone();
    p.leftLeg = new THREE.Group();
    p.leftLeg.add(p.mesh.leg, p.armorMesh.leftLeggings, p.armorMesh.leftBoots);

    p.armorMesh.rightLeggings = leggingsMesh.clone();
    p.armorMesh.rightBoots = bootsMesh.clone();
    p.rightLeg = new THREE.Group();
    p.rightLeg.add(p.mesh.leg.clone(), p.armorMesh.rightLeggings, p.armorMesh.rightBoots);

    p.leftHip = new THREE.Object3D();
    p.leftHip.add(p.leftLeg);
    p.rightHip = new THREE.Object3D();
    p.rightHip.add(p.rightLeg);

    p.leftHip.position.set(-dim.legSize * 0.5, -blockSize * 0.45 - blockSize * 0.75, 0);
    p.rightHip.position.set(dim.legSize * 0.5, -blockSize * 0.45 - blockSize * 0.75, 0);
  }

  static addSkeleton(p) {
    // Create skeleton of head, body, arms, and legs
    p.skeleton = new THREE.Group();
    p.body = new THREE.Group(); // TODO: rename

    p.body.add(p.torso);

    p.body.add(p.leftShoulder);
    p.body.add(p.rightShoulder);
    p.body.add(p.leftHip);
    p.body.add(p.rightHip);

    p.skeleton.add(p.body);

    p.skeleton.add(p.neck);
    p.skeleton.name = p.id;

    p.bbox = new THREE.Group();
    let bbox = new THREE.BoxHelper(p.skeleton, 0xffff00);
    if (p.skin == "alex") bbox.position.x = 1.4;
    bbox.matrixAutoUpdate = true;
    bbox.visible = game.debug || false;
    bbox.name = "bbox";
    p.bbox.add(bbox);

    p.skeleton.add(p.bbox);
  }

  static addPlayerMesh(p) {
    p.mesh = {};
    p.armorMesh = {};

    PlayerMesh.addHead(p); // Add head
    PlayerMesh.addTorso(p); // Add torso
    PlayerMesh.addArms(p); // Add arms
    PlayerMesh.addLegs(p); // Add legs
  }
}

export default PlayerMesh;
