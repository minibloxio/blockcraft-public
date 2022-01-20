import * as THREE from "three";
import { camera } from "./ActiveItemScene";
import textureManager from "../managers/TextureManager";
import skinManager from "../managers/SkinManager";
import player from "../Player";
import world from "../managers/WorldManager";
import { AnimationLerp, Keyframe } from "../lib/AnimationLerp";
import { addDatControls } from "../lib/devDatGUI";

const pixelSize = (1 / 16) * 2;
const itemSize = 16;
const tileSize = 16;
const tileTextureWidth = 4096;
const tileTextureHeight = 64;
const canvas = document.createElement("canvas");
const ZERO_VEC = new THREE.Vector3();
const ZERO_ROT = new THREE.Quaternion();
canvas.width = itemSize;
canvas.height = itemSize;

// ITEM
// ###############################
//const itemOffsetPos = new THREE.Vector3(1.885, -0.493, -3.0);
const itemOffsetPos = new THREE.Vector3(1, -0.493, -3.0);
const itemOffsetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.075, 0.037, -0.102));
const swordBlockPos = new THREE.Vector3(0.696, 0.894, -0.405);
const swordBlockRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.67, 0.36, 1.467));

// BLOCK
// ###############################
const blockOffsetPos = new THREE.Vector3(1.114, -2.674, -2.409);
const blockOffsetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.055, 0.775, 0.037));
const block1 = new Keyframe(ZERO_VEC, ZERO_ROT, 1);
const block2 = new Keyframe(new THREE.Vector3(-1.595, 1.555, -1.925), new THREE.Euler(-0.77, -0.079, 0.267), 2);
const block3 = new Keyframe(new THREE.Vector3(-1.639, 0.806, -2.453), new THREE.Euler(-0.955, 0.0, 0.406), 3);

// ARM
// ###############################
const armOffsetPos = new THREE.Vector3(1.907, -1.969, -2.343);
const armOffsetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.544, -0.494, 2.666));
const arm1 = new Keyframe(ZERO_VEC, ZERO_ROT, 1);
const arm2 = new Keyframe(new THREE.Vector3(1.246, -0.317, 0.498), new THREE.Euler(0.244, 0.636, 0.152), 2);
const arm3 = new Keyframe(new THREE.Vector3(3.0, -0.295, -0.361), new THREE.Euler(0.29, 1.467, 0.014), 3);
const arm4 = new Keyframe(new THREE.Vector3(2.348, -1.264, -0.361), new THREE.Euler(0.083, 1.167, 0.083), 4);

// TODO: Organize this
const faces = [
  {
    // left
    dir: [-1, 0, 0],
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  {
    // top
    dir: [0, 1, 0],
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  {
    // front
    dir: [0, 0, 1],
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
];

class ActiveItemVoxels {
  root = new THREE.Group();
  itemPixelsGroup = new THREE.Group();
  itemMesh = new THREE.Mesh();
  block = new THREE.Mesh(new THREE.BufferGeometry(), textureManager.materialTransparent);
  blockGroup = new THREE.Group();
  arm: THREE.Mesh;
  armPunch: AnimationLerp;
  blockPunch: AnimationLerp;

  currentItem = -1;
  currentBlock = -1;
  bowCharge = 0;

  constructor() {
    this.armPunch = new AnimationLerp([arm1, arm2, arm3, arm4], this.root);
    this.blockPunch = new AnimationLerp([block1, block2, block3], this.root);

    // init root
    camera.add(this.root);

    // init block
    this.initBlockMesh();

    // init item
    this.initItemMesh();
  }

  addFaceData(positions, dir, corners, normals, indices, x, y, z) {
    const ndx = positions.length / 3;
    for (const { pos } of corners) {
      // Get position of the pixel
      let xPos = pos[0] + x;
      let yPos = pos[1] + y;
      let zPos = pos[2] + z;

      positions.push(xPos * pixelSize, yPos * pixelSize, zPos * pixelSize);
      normals.push(...dir);
    }
    indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
  }

  initItemMesh() {
    let data = {
      positions: [],
      normals: [],
      indices: [],
    };

    // Add face data
    for (let y = 0; y < itemSize; ++y) {
      for (let z = 0; z < itemSize; ++z) {
        for (const { dir, corners } of faces) {
          this.addFaceData(data.positions, dir, corners, data.normals, data.indices, 0, y, z);
        }
      }
    }

    // Convert to ArrayBuffers
    let positionBuffer = new Float32Array(new ArrayBuffer(data.positions.length * 4));
    let normalBuffer = new Float32Array(new ArrayBuffer(data.normals.length * 4));
    let indexBuffer = new Uint16Array(new ArrayBuffer(data.indices.length * 2));
    positionBuffer.set(data.positions);
    normalBuffer.set(data.normals);
    indexBuffer.set(data.indices);

    // Set attributes
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positionBuffer, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normalBuffer, 3));
    geometry.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

    const material = new THREE.MeshBasicMaterial();

    // Add item mesh
    this.itemMesh = new THREE.Mesh(geometry, material);
    this.itemPixelsGroup.position.copy(itemOffsetPos);
    this.itemPixelsGroup.quaternion.copy(itemOffsetRot);
    this.itemPixelsGroup.add(this.itemMesh);
    this.root.add(this.itemPixelsGroup);
  }

  initBlockMesh() {
    this.blockGroup.position.copy(blockOffsetPos);
    this.blockGroup.quaternion.copy(blockOffsetRot);
    this.blockGroup.scale.set(0.35, 0.35, 0.35);
    this.root.add(this.blockGroup);
  }

  updateItemGraphics(item: any) {
    if (item.v == this.currentItem && player.bowCharge == this.bowCharge) return;

    this.itemMesh.material = textureManager.materialItem; // TODO: set this once

    this.currentItem = item.v;
    this.bowCharge = player.bowCharge;

    let uvVoxel = item.v - 1;
    let uvRow = player.bowCharge ? player.bowCharge : 0;

    let uvBuffer = new Float32Array(new ArrayBuffer(itemSize * itemSize * faces.length * 4 * 4 * 2)); // TODO: set this in the constructor (to reduce memory consumption)

    // Update the UV data of each face
    let index = 0;
    for (let y = 0; y < itemSize; ++y) {
      for (let z = 0; z < itemSize; ++z) {
        for (let i = 0; i < faces.length; i++) {
          let face = faces[i];
          for (let { uv } of face.corners) {
            let uvX = y + uv[0] + uvVoxel * tileSize;
            let uvY = z - uv[1] + uvRow * tileSize + 1;

            uvBuffer[index] = uvX / tileTextureWidth;
            uvBuffer[index + 1] = 1 - uvY / tileTextureHeight;
            index += 2;
          }
        }
      }
    }

    // Update the uv data of the item mesh
    armItem.itemMesh.geometry.setAttribute("uv", new THREE.BufferAttribute(uvBuffer, 2));
    armItem.itemMesh.geometry.attributes.uv.needsUpdate = true;
  }

  updateBlockGraphics(item: any) {
    if (item.v == this.currentBlock) return;
    this.currentBlock = item.v;

    let uvVoxel = item.v - 1;
    let item_geometry = new THREE.BufferGeometry();
    const { positions, normals, uvs, indices } = world.generateGeometryBlockEntity(uvVoxel);
    item_geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    item_geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    item_geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    item_geometry.setIndex(indices);
    item_geometry.computeBoundingSphere();

    this.blockGroup.remove(this.block);
    this.block = new THREE.Mesh(item_geometry, textureManager.materialTransparent);
    this.blockGroup.add(this.block);
  }

  update() {
    // init arm
    if (!this.arm) {
      this.arm = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3), skinManager.getSkin(player.skin).armC);
      this.arm.scale.set(0.8, 0.8, 0.8);
      this.arm.position.copy(armOffsetPos);
      this.arm.quaternion.copy(armOffsetRot);
      this.root.add(this.arm);
    }

    this.itemPixelsGroup.visible = false;
    this.blockGroup.visible = false;
    this.arm.visible = false;

    if (player.mode == "spectator" || player.mode == "camera") return;
    let currItem = player.getCurrItem();

    // Update arm based on current item in hand
    if (currItem) {
      if (currItem.class == "block") {
        this.updateBlockGraphics(currItem);
        this.blockGroup.visible = true;
      } else if (currItem.class == "item") {
        this.updateItemGraphics(currItem);
        this.itemPixelsGroup.visible = true;
      } else {
        throw "invalid item class";
      }
    } else {
      this.arm.visible = true;
    }

    // Move hand
    const timeSincePunch = Date.now() - player.punching;
    const punchLerp = timeSincePunch / 250;

    if (player.blocking) {
      this.root.position.copy(swordBlockPos);
      this.root.quaternion.copy(swordBlockRot);
    } else if (punchLerp <= 1) {
      if (!currItem) {
        this.armPunch.update(punchLerp);
      } else {
        this.blockPunch.update(punchLerp);
      }
    } else {
      this.root.position.copy(ZERO_VEC);
      this.root.quaternion.copy(ZERO_ROT);
    }
  }
}

const armItem = new ActiveItemVoxels();
globalThis.armItem = armItem;
export default armItem;
