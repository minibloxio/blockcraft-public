/*

Manages the players in the game.
Adds/removes player meshes to the scene.

*/

import Ola from "ola";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import game from "../Game";
import { scene } from "../globals";
import player from "../Player";
import skinManager from "./SkinManager";
import textureManager from "./TextureManager";
import world from "../world/WorldManager";
import Item3D from "../graphics/Item3D";
import { clamp, round, euclideanModulo } from "../lib/helper";

const intrpDelay = 100;

// Rotate object around a 3D point
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld) {
  pointIsWorld = pointIsWorld === undefined ? false : pointIsWorld;

  if (pointIsWorld) {
    obj.parent.localToWorld(obj.position); // compensate for world coordinate
  }

  obj.position.sub(point); // remove the offset
  obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
  obj.position.add(point); // re-add the offset

  if (pointIsWorld) {
    obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
  }

  obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

class PlayerManager {
  // Update the player's visuals
  static updatePlayer(p) {
    let { blockSize } = world;

    let dim = player.dim;
    let { skin, leftArm, rightArm, leftLeg, rightLeg, leftHip, rightHip, headPivot, entity, pos, rot, dir } = p;

    entity.position.set(pos.x, pos.y, pos.z); // Set player position

    p.neck.rotation.set(rot.x, rot.y, rot.z); // Set sideways head rotation

    // Get angles of the neck and body
    const PI = Math.PI;
    let angle1 = euclideanModulo(p.neck.rotation.y + PI, PI * 2);
    let angle2 = new THREE.Quaternion();
    p.body.getWorldQuaternion(angle2);
    angle2 = new THREE.Euler().setFromQuaternion(angle2, "YXZ").y + PI;

    // Get the delta between the two angles
    let angleTo = p.neck.quaternion.angleTo(p.body.quaternion);
    let diff = angle1 - angle2;
    let yawDiff = round(((diff + PI) % (PI * 2)) - PI, 2);
    let yawMod = euclideanModulo(yawDiff, PI * 2);
    let sign = yawMod > 0 && yawMod < PI ? -0.6 : 0.6;
    yawDiff = angleTo * sign;

    // Rotate body towards the head when turning around
    let angleDiff = p.neck.quaternion.angleTo(p.body.quaternion);
    let maxAngleDiff = Math.PI / 4;
    if (angleDiff > maxAngleDiff) {
      let diff = angleDiff * 2 + maxAngleDiff;
      p.body.quaternion.slerp(p.neck.quaternion, g.delta * diff);
    }

    p.bbox.rotation.setFromQuaternion(p.body.quaternion);

    // Rotate body towards the head when walking
    if (p.walking) {
      let target = new THREE.Vector3(-p.vel.x, 0, -p.vel.z); // Target direction
      target.normalize();

      let bodyDir = new THREE.Vector3();
      p.body.getWorldDirection(bodyDir);

      bodyDir.normalize();
      let quaternion = new THREE.Quaternion().setFromUnitVectors(bodyDir, target); // Get rotation quaternion from current and target direction

      let targetQuaternion = p.body.clone(false); // TODO: OPTIMIZE
      targetQuaternion.applyQuaternion(quaternion); // Apply rotation quaternion to body

      let diff = Math.abs(maxAngleDiff - angleDiff) + 0.2;
      if (p.localVel.z < 0 && Math.abs(p.localVel.z) > Math.abs(p.localVel.x)) {
        diff = 1;
      }
      // Lerp body towards target quaternion
      if (p.neck.quaternion.angleTo(p.body.quaternion) < maxAngleDiff) {
        p.body.quaternion.slerp(targetQuaternion.quaternion, diff * g.delta * 3);
      }
      p.prevDiff = diff;
    }

    headPivot.rotation.x = (dir.y * Math.PI) / 2; // Set up/down head rotation

    // Offsets
    let shift = 2; // blockSize / 8;
    let armOffsetY = 4; // blockSize * 0.25;
    let legOffsetY = 8; // blockSize * 0.5;
    let rightShoulderOffset = skin == "steve" ? (dim.armSize * 3) / 2 : (dim.armSize * 3) / 2 - 0.6;
    let leftShoulderOffset = skin == "steve" ? -6 : -5.45;

    // Sneaking animation
    let sneakable = !(p.mode == "spectator" || p.mode == "camera");
    if (p.sneaking && sneakable) {
      p.torso.rotation.x = -Math.PI / 8;

      p.neck.position.set(0, -blockSize * 0.25, 0);
      p.torso.position.set(0, -blockSize * 0.55, shift);

      leftHip.position.set(-dim.legSize / 2, -blockSize * 0.45 - blockSize * 0.9 + shift, shift * 2);
      rightHip.position.set(dim.legSize / 2, -blockSize * 0.45 - blockSize * 0.9 + shift, shift * 2);

      p.leftShoulder.position.set(leftShoulderOffset, -blockSize * 0.12 - shift, blockSize * 0.05);
      p.rightShoulder.position.set(rightShoulderOffset, -blockSize * 0.12 - shift, 0);
    } else {
      p.torso.rotation.x = 0;

      p.neck.position.set(0, -blockSize * 0.075, 0);
      p.torso.position.set(0, -blockSize * 0.45, 0);

      leftHip.position.set(-dim.legSize * 0.5, -blockSize * 0.45 - blockSize * 0.75, 0);
      rightHip.position.set(dim.armSize * 0.5, -blockSize * 0.45 - blockSize * 0.75, 0);

      p.leftShoulder.position.set(leftShoulderOffset, -blockSize * 0.15, 0);
      p.rightShoulder.position.set(rightShoulderOffset, -blockSize * 0.15, 0);
    }

    // Get magnitude of velocity
    let v = Math.sqrt(p.vel.x * p.vel.x + p.vel.z * p.vel.z);
    v = clamp(v, 0, 1);

    let isSlow = p.sneaking || p.bowCharge > 0;
    if (isSlow) v *= 2;

    // Set speed of animation based on velocity
    let axis = new THREE.Vector3(1, 0, 0);
    let speed = isSlow ? g.delta * 3 : g.delta * 10;
    let maxRotation = isSlow ? Math.PI / 6 : Math.PI / 3;
    speed *= v;
    maxRotation *= v;

    if (p.walking) {
      // Walking animation
      if (leftArm.rotation.x < -maxRotation) {
        p.extendArms = false;
      } else if (leftArm.rotation.x > maxRotation) {
        p.extendArms = true;
      }

      if (leftLeg.rotation.x > maxRotation) {
        p.extendLegs = false;
      } else if (leftLeg.rotation.x < -maxRotation) {
        p.extendLegs = true;
      }

      if (p.extendArms && p.bowCharge == 0) {
        if (!p.blocking && !p.punching) {
          rotateAboutPoint(rightArm, new THREE.Vector3(0, armOffsetY, 0), axis, speed);
        }

        rotateAboutPoint(leftArm, new THREE.Vector3(0, armOffsetY, 0), axis, -speed);
      } else if (p.bowCharge == 0) {
        if (!p.blocking && !p.punching) {
          rotateAboutPoint(rightArm, new THREE.Vector3(0, armOffsetY, 0), axis, -speed);
        } else {
          rightArm.position.set(0, 0, 0);
          rightArm.rotation.set(0, 0, 0);
        }

        rotateAboutPoint(leftArm, new THREE.Vector3(0, armOffsetY, 0), axis, speed);
      } else {
        rightArm.position.set(0, 0, 0);
        rightArm.rotation.set(0, 0, 0);

        leftArm.position.set(0, 0, 0);
        leftArm.rotation.set(0, 0, 0);
      }

      if (p.extendLegs) {
        rotateAboutPoint(rightLeg, new THREE.Vector3(0, legOffsetY, 0), axis, -speed);
        rotateAboutPoint(leftLeg, new THREE.Vector3(0, legOffsetY, 0), axis, speed);
      } else {
        rotateAboutPoint(rightLeg, new THREE.Vector3(0, legOffsetY, 0), axis, speed);
        rotateAboutPoint(leftLeg, new THREE.Vector3(0, legOffsetY, 0), axis, -speed);
      }
    } else {
      rotateAboutPoint(
        rightArm,
        new THREE.Vector3(0, armOffsetY, 0),
        axis,
        Math.abs(rightArm.rotation.x) * Math.sign(-rightArm.rotation.x)
      );
      rotateAboutPoint(leftArm, new THREE.Vector3(0, armOffsetY, 0), axis, Math.abs(leftArm.rotation.x) * Math.sign(-leftArm.rotation.x));

      rotateAboutPoint(
        rightLeg,
        new THREE.Vector3(0, legOffsetY, 0),
        axis,
        Math.abs(rightLeg.rotation.x) * Math.sign(-rightLeg.rotation.x)
      );
      rotateAboutPoint(leftLeg, new THREE.Vector3(0, legOffsetY, 0), axis, Math.abs(leftLeg.rotation.x) * Math.sign(-leftLeg.rotation.x));
    }

    // Active hand item
    let hand = p.toolbar[p.currSlot];
    if (p.handMesh && hand) {
      if (p.blocking) {
        p.handMesh.position.set(-13.4, -6.4, 2);
        p.handMesh.rotation.set(0.09, Math.PI / 2, -0.9);
      } else if (hand.class == "item") {
        if (hand.v == world.itemId["bow"]) {
          p.handMesh.position.set(-2.5, -16.9, -0.071);
          p.handMesh.rotation.set(-0.8, 0.198, 0.088);
        } else {
          p.handMesh.position.set(-0.5, -13, -10.2);
          p.handMesh.rotation.set(-0.57, 0, 0);
        }
      } else {
        p.handMesh.position.set(-3, -dim.armHeight / 2, -dim.armSize);
        p.handMesh.rotation.set(0, Math.PI / 4, 0);
      }
    }

    // Punching animation
    if (p.punching) {
      p.punchingT += g.delta * 5;

      if (p.punchingT > 1) p.punchingT = 0;
    } else {
      if (p.punchingT < 1) {
        p.punchingT += g.delta * 5;
      } else {
        p.punchingT = 1;
      }
    }

    // Update nametag rotation
    p.nameTag.quaternion.copy(camera.getWorldQuaternion(new THREE.Quaternion()));

    // Update player arm animation
    if (p.blocking) {
      p.rightShoulder.rotation.set(PI / 4, 0, 0);
    } else if (p.bowCharge > 0) {
      let pitchDiff = (dir.y * PI) / 2;
      p.leftShoulder.rotation.set(PI / 2 + pitchDiff, -0.022, 0.74 + yawDiff);
      p.rightShoulder.rotation.set(PI / 2 + pitchDiff, 0, yawDiff);
    } else if (p.sneaking) {
      p.leftShoulder.rotation.set(-PI / 16, 0, 0);
      p.rightShoulder.rotation.set(-PI / 16, 0, 0);
    } else {
      p.leftShoulder.rotation.set(0, 0, 0);
      p.rightShoulder.rotation.set(0, 0, 0);
    }

    p.rightShoulder.rotation.x += (-Math.cos(p.punchingT * Math.PI * 2) + 1) / 2;
    p.rightShoulder.rotation.z += Math.sin(p.punchingT * Math.PI * 2) / 2;
  }

  static addPlayer(players, id, data) {
    players[id] = data;
    let p = players[id];

    // Set position, rotation and direction
    p.pos = Ola(p.pos);
    p.rot = Ola(p.rot, intrpDelay);
    p.dir = Ola(p.dir, intrpDelay);
    p.vel = Ola(p.vel, intrpDelay);

    // Add player body
    PlayerManager.addPlayerMesh(p);

    // Add player skeleton
    PlayerManager.addSkeleton(p);

    // Update player armor
    PlayerManager.setPlayerArmor(p);

    // Add hand
    let hand = p.toolbar[p.currSlot];
    if (hand) PlayerManager.updatePlayerHand(hand, p);

    // Entity (combine skeleton and nametag)
    p.entity = new THREE.Group();
    p.entity.add(p.skeleton);
    p.entity.type = "player";

    scene.add(p.entity);

    p.punchingT = 0;

    // Add nametag
    PlayerManager.updateNameTag(p);

    // Set gamemode
    PlayerManager.setPlayerGamemode(p, p.mode);
  }

  static clearPlayerArmor(p) {
    for (let type in p.armorMesh) {
      p.armorMesh[type].visible = false;
    }
  }

  static updatePlayerArmor(p, p_) {
    let needsUpdate = false;

    for (let type in p_.armor) {
      if (p.armor[type] !== p_.armor[type]) {
        p.armor[type] = p_.armor[type];
        needsUpdate = true;
      }
    }

    if (needsUpdate) PlayerManager.setPlayerArmor(p);
  }

  static addMesh(geometry, material) {
    let mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  static setPlayerArmor(p) {
    PlayerManager.clearPlayerArmor(p);

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

    p.mesh.head = PlayerManager.addMesh(new THREE.BoxBufferGeometry(dim.headSize, dim.headSize, dim.headSize), playerMat.head);
    p.armorMesh.helmet = PlayerManager.addMesh(
      new THREE.BoxBufferGeometry(dim.headSize + 1, dim.headSize + 1, dim.headSize + 1),
      helmetMat
    );

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

    p.mesh.torso = PlayerManager.addMesh(new THREE.BoxBufferGeometry(dim.torso, dim.torsoHeight, dim.legSize), playerMat.body);
    p.armorMesh.chestplate = PlayerManager.addMesh(
      new THREE.BoxBufferGeometry(dim.torso + 1, dim.torsoHeight + 1, dim.legSize + 1),
      chestplateMat
    );
    p.armorMesh.leggingsTop = PlayerManager.addMesh(
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
    p.mesh.arm = PlayerManager.addMesh(new THREE.BoxBufferGeometry(armSize, dim.armHeight, dim.armSize), playerMat.arm);
    let armPlatesMesh = PlayerManager.addMesh(new THREE.BoxBufferGeometry(armSize + 1, (dim.armHeight * 5) / 12, armSize + 1), armMat);
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

    p.mesh.leg = PlayerManager.addMesh(new THREE.BoxBufferGeometry(dim.legSize, dim.legHeight, dim.legSize), playerMat.leg);
    let leggingsMesh = PlayerManager.addMesh(
      new THREE.BoxBufferGeometry(dim.legSize + 0.5, dim.legHeight * 0.75, dim.legSize + 0.5),
      leggingsMat
    );
    let bootsMesh = PlayerManager.addMesh(new THREE.BoxBufferGeometry(dim.legSize + 1, dim.legHeight * 0.5, dim.legSize + 1), bootsMat);
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

    PlayerManager.addHead(p); // Add head
    PlayerManager.addTorso(p); // Add torso
    PlayerManager.addArms(p); // Add arms
    PlayerManager.addLegs(p); // Add legs
  }

  static updateBlockMesh(entity) {
    let uvVoxel = entity.v - 1;
    let block_geometry = new THREE.BufferGeometry();
    const { positions, normals, uvs, indices } = world.generateGeometryBlockEntity(uvVoxel);
    block_geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    block_geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    block_geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    block_geometry.setIndex(indices);
    block_geometry.computeBoundingSphere();

    return new THREE.Mesh(block_geometry, textureManager.materialTransparent);
  }

  static updatePlayerHand(entity, p) {
    if (p.handMesh && p.handMesh.parent) p.handMesh.parent.remove(p.handMesh);

    if (!entity || entity.c == 0) return;

    if (entity.class == "item") {
      let uvRow = p.bowCharge;
      let mesh = Item3D.getMesh(entity, 1, p.handMesh, uvRow);
      if (mesh) {
        p.handMesh = mesh;
      }
    } else {
      p.handMesh = PlayerManager.updateBlockMesh(entity);
    }

    p.handMesh.name = "item";
    p.handMesh.castShadow = true;
    p.handMesh.receiveShadow = true;
    p.rightArm.add(p.handMesh);
  }

  static updateNameTag(p, options) {
    if (!options) options = {};
    let { blockSize } = world;

    if (p.nameTag) p.entity.remove(p.nameTag);

    if (options.color) {
      p.nameTag.material.color.set(options.color);
    } else {
      var name_geometry = new TextGeometry(p.name, {
        font: textureManager.minecraft_font,
        size: 3,
        height: 0.5,
      });
      name_geometry.center();

      p.nameTag = new THREE.Mesh(name_geometry, new THREE.MeshBasicMaterial({ color: options.color || "white" }));
      p.nameTag.material.transparent = true;
      p.nameTag.material.depthTest = false;
      p.nameTag.material.dithering = true;
      p.nameTag.position.y += (blockSize * 3) / 4;
    }

    if (options.hidden) {
      p.nameTag.visible = false;
    }

    p.entity.add(p.nameTag);
  }

  static setPlayerGamemode(p, mode) {
    p.mode = mode;
    let color = "white";

    if (p.mode == "spectator" || p.mode == "camera") {
      PlayerManager.updateBodyVisibility(p, false);
      PlayerManager.updatePlayerColor(p.id, false, 0.5);

      p.nameTag.material.opacity = 0.5;
      color = "grey";
    } else {
      PlayerManager.updateBodyVisibility(p, true);
      PlayerManager.updatePlayerColor(p.id, false, 1);

      p.nameTag.material.opacity = 1;
      if (p.mode == "creative") {
        color = "aqua";
      } else if (p.mode == "survival") {
        color = "white";
      }
    }

    if (p.operator) color = "red";

    PlayerManager.updateNameTag(p, {
      color: color,
    });
  }

  static updateBodyVisibility(p, visible) {
    p.torso.visible = visible;
    p.leftArm.visible = visible;
    p.rightArm.visible = visible;
    p.leftLeg.visible = visible;
    p.rightLeg.visible = visible;
  }

  static updateMaterialColor(materials, color, opacity) {
    for (let material of materials) {
      if (color) material.color = color;
      if (opacity) material.opacity = opacity;
    }
  }

  static updatePlayerColor(p, color, opacity) {
    if (!p || !p.skeleton) return;

    for (let id in p.mesh) {
      let mesh = p.mesh[id];
      PlayerManager.updateMaterialColor(mesh.material, color, opacity);
    }
  }
}

export default PlayerManager;
