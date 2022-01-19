import * as THREE from "three";
import { camera } from "./ActiveItemScene";
import textureManager from "../managers/TextureManager";
import skinManager from "../managers/SkinManager";
import player from "../Player";
import world from "../managers/WorldManager";
import { AnimationLerp, Keyframe } from "../lib/AnimationLerp";

const pixelSize = (1 / 16) * 2;
const itemSize = 16;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const ZERO_VEC = new THREE.Vector3();
const ZERO_ROT = new THREE.Quaternion();
canvas.width = itemSize;
canvas.height = itemSize;

// ITEM
// ###############################
const itemOffsetPos = new THREE.Vector3(1.885, -0.493, -3.0);
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

class ActiveItemVoxels {
  root = new THREE.Group();
  itemPixels = new Array<THREE.Mesh>(256);
  itemPixelsGroup = new THREE.Group();
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
    this.blockGroup.position.copy(blockOffsetPos);
    this.blockGroup.quaternion.copy(blockOffsetRot);
    this.blockGroup.scale.set(0.35, 0.35, 0.35);
    this.root.add(this.blockGroup);

    // init item
    this.itemPixelsGroup.position.copy(itemOffsetPos);
    this.itemPixelsGroup.quaternion.copy(itemOffsetRot);
    const mat = new THREE.MeshBasicMaterial();
    const geo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);

    for (let z = 0; z < 16; z++) {
      for (let y = 0; y < 16; y++) {
        const pixel = new THREE.Mesh(geo, mat);
        pixel.receiveShadow = true;
        pixel.position.z = z * pixelSize;
        pixel.position.y = y * pixelSize;
        this.itemPixelsGroup.add(pixel);
        this.itemPixels[z * 16 + y] = pixel;
      }
    }
    this.root.add(this.itemPixelsGroup);
  }

  updateBlockGraphics(item: any) {
    if (item.v == this.currentBlock) return;
    this.currentBlock = item.v;

    let uvVoxel = item.v - 1;
    let item_geometry = new THREE.BufferGeometry();
    const { positions, normals, uvs, indices } = world.generateGeometryDataForItem(uvVoxel);
    const positionNumComponents = 3;
    item_geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents)
    );
    const normalNumComponents = 3;
    item_geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    const uvNumComponents = 2;
    item_geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
    item_geometry.setIndex(indices);
    item_geometry.computeBoundingSphere();

    this.blockGroup.remove(this.block);
    this.block = new THREE.Mesh(item_geometry, textureManager.materialTransparent);
    this.blockGroup.add(this.block);
  }

  updateItemGraphics(item: any) {
    if (item.v == this.currentItem && player.bowCharge == this.bowCharge) return;
    this.currentItem = item.v;
    this.bowCharge = player.bowCharge;

    let atlas = textureManager.getTextureAtlas(item.class);
    ctx.clearRect(0, 0, itemSize, itemSize);
    ctx.drawImage(
      atlas,
      (item.v - 1) * itemSize,
      (player.bowCharge ? player.bowCharge : 0) * itemSize,
      itemSize,
      itemSize,
      0,
      0,
      itemSize,
      itemSize
    );

    const pixels = canvas.getContext("2d").getImageData(0, 0, 16, 16).data;
    for (var i = 0, n = pixels.length; i < n; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      this.itemPixels[i / 4].material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(`rgb(${r}, ${g}, ${b})`),
      });
      this.itemPixels[i / 4].visible = a !== 0;
    }
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
    let curItem = player.getCurrItem();

    if (curItem) {
      if (curItem.class == "block") {
        this.updateBlockGraphics(curItem);
        this.blockGroup.visible = true;
      } else if (curItem.class == "item") {
        this.updateItemGraphics(curItem);
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
      if (!curItem) {
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
export default armItem;
