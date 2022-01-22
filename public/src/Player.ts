import * as THREE from "three";
import * as $ from "jquery";

import { PointerLockControls } from "./input/PointerLock";
import { camera, isState, g, scene, players } from "./globals";
import textureManager from "./managers/TextureManager";
import world, { updateVoxelGeometry } from "./world/WorldManager";
import gameObj from "./Game";
import chunkManager from "./managers/ChunkManager";
import chat from "./managers/ChatManager";
import inventory from "./items/Inventory";
import masterRenderer from "./graphics/MasterRenderer";
import { random } from "./lib/helper";
import activeItemVoxels from "./graphics/ActiveItemVoxels";
import { keyPressedPlayer } from "./input/KeyboardInput";
import hud from "./gui/HUD";
import threeStats from "./stats/ThreeStats";
import Cookies from "js-cookie";
import { rotation } from "./input/PointerLock";
import PlayerManager from "./managers/PlayerManager";

declare var DEV_MODE: boolean;
declare global {
  interface Number {
    clamp: any;
  }
}
const game: any = gameObj;

const SWORDS = ["wood_sword", "stone_sword", "iron_sword", "gold_sword", "diamond_sword"];

const neighborOffsets = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      neighborOffsets.push([x, y, z]);
    }
  }
}

const miningDelay = {
  water: Infinity,
  leaves: 0.5,
  obsidian: 15,
};

const blockSize = 16;

class Player {
  // Meta
  name: any;
  operator: boolean;

  // 3d stuff
  controls = new PointerLockControls(camera);
  perspective = 0;
  cinematicMode = false;
  deltaFov = 0;

  // Sensitivity
  sens = 0.5;

  // Ray casting
  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0)); // block selecting / breaking / placing

  // Collision helper
  closest: any = {
    distance: Infinity,
  };

  // Mode
  mode = "survival";
  god = false;

  // Position, velocity, and direction
  pos = this.controls.getObject().position;
  previousPosition = this.pos.clone();
  savedPosition = this.pos.clone();
  velocity = new THREE.Vector3();
  direction = new THREE.Vector3();
  knockbackVelocity = new THREE.Vector3();
  newMove = new THREE.Vector3();
  fallCooldown = 0;

  // Mesh velocity, rotation, and direction
  vel = new THREE.Vector3();
  rot = new THREE.Vector3();
  dir = new THREE.Vector3();
  localVel = new THREE.Vector3();

  // Player animation variables
  punching = false;
  blocking = false;
  walking = false;
  sneaking = false;

  // Player external hand

  // Movement constants
  speed = 2;
  walkSpeed = 2;
  maxWalkSpeed = 2;
  defaultMaxSprintSpeed = 2.9;
  sprintSpeed = this.defaultMaxSprintSpeed;
  maxSprintSpeed = this.defaultMaxSprintSpeed;
  distanceMoved = 0;
  initialJumpVelocity = 150;

  // Bhop constants
  bhopTimeLimit = 0.05; // 50ms to jump before the sprint boost is reset
  bhopMaxSpeed = this.defaultMaxSprintSpeed + 0.2; // Maximum speed that can be reached through bhopping
  bhopRate = 0.05; // How much the speed ramps up after each successful bhop

  // Movement types
  fly = false;
  noClip = true;

  prevHeight: number;
  onObject = false; // Sees if player is on object
  onObjectTime = 0;

  spawnpoint: any;

  // Events
  key = {
    leftClick: 0,
    rightClick: 0,
    lastRightClick: 0,
  };

  // World interaction
  miningDelayConstant = 750;
  placingDelay = 200;
  respawnDelay = 1000;

  click = false;
  prevBlock = undefined;

  place = false;
  placing: number;
  placeType = 2; // Type of block being placed

  blockT = 0;
  lastPunch = Date.now();

  lastRaycast = Date.now();
  nearbyMeshes = [];
  playerBoxes = [];
  picked = [];

  // Wireframes
  select_wireframe: THREE.LineSegments;
  mine_box: THREE.Mesh;

  // Water
  headInWater: boolean;
  inWater: boolean;

  // Player dimensions
  dim = {
    torso: 0.5 * blockSize,
    torsoHeight: 0.75 * blockSize,
    armSize: 0.25 * blockSize,
    armSizeSlim: 0.18 * blockSize,
    armHeight: 0.75 * blockSize,
    legSize: 0.25 * blockSize,
    legHeight: 0.75 * blockSize,
    headSize: 0.5 * blockSize,
    height: 1.8 * blockSize,
  };

  halfWidth: number;
  halfDepth: number;
  halfHeight: number;

  // Respawn
  respawnTimer = Date.now();
  allowRespawn = true;

  // Player vitals
  hp = 20;
  lastHp = this.hp;
  oxygen = 300;
  lastOxygenTick: number;
  hunger = 100;

  // Player appearance
  skin = undefined;
  armor = {
    helmet: 0,
    chestplate: 0,
    leggings: 0,
    boots: 0,
  };
  entity = new THREE.Group();
  skeleton = new THREE.Group();

  // Player inventory
  toolbar: any;
  inventory: any;
  currSlot: number;

  // Player arm animation
  bowCharge: number;
  drawingBow: boolean;
  punchT: number;
  stoppedPunching: boolean;
  isBlocking: any;
  prevItem: string;
  prevState: any;

  // Player GUI
  heartBlink: any;
  toggleGUI: boolean;

  // Stats
  ping: number;
  biome: any;

  constructor() {
    // Player appearance
    this.halfWidth = blockSize * 0.3;
    this.halfDepth = blockSize * 0.3;
    this.halfHeight = blockSize * 0.8;
    // Select box wireframe
    this.addSelectBox();

    // Add to scene
    scene.add(this.controls.getObject());
  }

  addSelectBox() {
    if (this.select_wireframe) return;

    const { blockSize } = world;
    let select_box = new THREE.BoxGeometry(blockSize + 0.1, blockSize + 0.1, blockSize + 0.1);
    let { mining_progress } = textureManager;
    this.mine_box = new THREE.Mesh(select_box, mining_progress[0].material);
    this.mine_box.name = "wireframe";
    scene.add(this.mine_box);

    let geometry = new THREE.EdgesGeometry(select_box);
    let material = new THREE.LineBasicMaterial({ color: "black", linewidth: 2 });
    this.select_wireframe = new THREE.LineSegments(geometry, material);
    this.select_wireframe.name = "wireframe";
    scene.add(this.select_wireframe);
  }

  // Add player mesh
  initPlayerMesh() {
    PlayerManager.addPlayerMesh(this);
    PlayerManager.addSkeleton(this);
    PlayerManager.setPlayerArmor(this);
    let hand = this.toolbar[this.currSlot];
    if (hand) PlayerManager.updatePlayerHand(hand, this);
    this.entity = new THREE.Group();
    this.entity.add(this.skeleton);

    PlayerManager.updateNameTag(this, { hidden: true });
    PlayerManager.setPlayerGamemode(this, this.mode);

    // Add to scene
    scene.add(this.entity);

    this.toggleCameraPerspective();
  }

  join(data) {
    // Username
    this.name = data.name;

    // Inventory
    this.currSlot = 0;
    this.toolbar = [];

    // Spawn
    if (DEV_MODE) {
      this.respawn(world.blockSize, new THREE.Vector3(0, 16 * 16 * 8, 0));
    } else {
      this.respawn(world.blockSize, data.startPos);
    }

    // Check if operator
    if (data.operator) {
      this.operator = true;
      this.mode = "creative";
    }

    // Player mesh
    this.initPlayerMesh();
  }

  respawn(blockSize, pos?) {
    // Check if respawn is possible
    if (!pos && Date.now() - this.respawnTimer < this.respawnDelay) return;

    // Check if spawnpoint is set
    if (this.spawnpoint && !pos) pos = this.spawnpoint;

    // Respawn at given location
    if (pos) {
      // Set player position
      this.pos.set(pos.x, pos.y, pos.z);
      this.controls.getObject().position.y = pos.y;
      this.savedPosition.y = pos.y;
    } else {
      // Respawn in new location
      let maxSpawnDistance = 32; // Maximum distance from spawn
      let randomX = random(-maxSpawnDistance, maxSpawnDistance);
      let randomZ = random(-maxSpawnDistance, maxSpawnDistance);

      let resetHeight = world.buildHeight * blockSize;
      // Determine ground level
      if (world.buildHeight) {
        for (let i = world.buildHeight; i > 0; i--) {
          if (world.getVoxel(randomX, i, randomZ) > 0) {
            // Non-air block, can spawn here
            resetHeight = i * blockSize + this.dim.height; // Account for player height
            break;
          }
        }
      }
      // Set player position
      this.pos.set(randomX * blockSize, resetHeight, randomZ * blockSize);
      this.controls.getObject().position.y = resetHeight;
      this.savedPosition.y = resetHeight;
    }

    // Reset player properties
    this.prevHeight = undefined;
    this.velocity.y = 0;
    this.maxSprintSpeed = this.defaultMaxSprintSpeed;

    // Reset respawn timer
    this.respawnTimer = Date.now();
  }

  setCoords(coord) {
    this.pos.copy(coord);
    this.previousPosition = this.pos.clone();
    this.savedPosition = this.pos.clone();
    this.prevHeight = this.pos.y;
  }

  updateGamemode(god) {
    if (god) {
      if (this.god) {
        this.defaultMaxSprintSpeed = 10;
        this.bhopMaxSpeed = 10;
        this.initialJumpVelocity = 500;
      } else {
        this.defaultMaxSprintSpeed = 2.9;
        this.bhopMaxSpeed = 2.9;
        this.initialJumpVelocity = 150;
      }
    } else {
      console.log("Updated gamemode to " + this.mode);
      if (this.mode == "camera") {
        $("#chat-input").attr("placeholder", "");
        hud.showStats = false;
        threeStats.showStats = false;
      } else {
        $("#chat-input").attr("placeholder", "> Press Enter to Chat");
        hud.showStats = Cookies.get("showStats") == "true";
        threeStats.showStats = hud.showStats;
        this.toggleGUI = false;
      }

      PlayerManager.setPlayerGamemode(this, this.mode);
    }
  }

  getCurrItem() {
    let item = this.toolbar[this.currSlot];
    if (item && item.c > 0) return item;
  }

  getItemVel() {
    let force = 400000;
    let vel = new THREE.Vector3();
    let mag = this.velocity.distanceTo(vel);
    camera.getWorldDirection(vel);
    if (this.perspective == 2) {
      vel.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      vel.y *= -1;
    }
    let playerVel = this.velocity.clone();
    let playerVelY = playerVel.y;
    playerVel.normalize();
    playerVel.y = playerVelY;
    playerVel.multiplyScalar(mag / force); // Default
    vel.add(playerVel);
    return vel;
  }

  updateHand() {
    // OPTIMIZE
    const item = this.getCurrItem();

    this.moveHand();

    let s = JSON.stringify(item);
    if (s == this.prevItem && this.bowCharge == this.prevState) {
      return;
    } else if (this.bowCharge == this.prevState) {
      this.bowCharge = 0;
    }

    this.prevItem = s;
    this.prevState = this.bowCharge;
  }

  drawBow() {
    let hand = this.getCurrItem();
    let isBow = hand.v == world.itemId["bow"];
    this.drawingBow = false;
    if (!isBow) return;

    if (this.key.lastRightClick) {
      this.bowCharge = this.bowCharge || 0;
      let diff = Date.now() - this.key.lastRightClick;

      // Check if arrow exists
      let exists = false;
      for (let t of this.toolbar) {
        if (t && t.v == world.itemId["arrow"] && t.c > 0) {
          exists = true;
          break;
        }
      }
      if (!exists) return;

      this.drawingBow = true;

      // Set bow charge
      if (diff > 300) {
        this.bowCharge = Math.min(Math.floor((diff - 300) / 300), 2) + 1;
      }

      // Update fov
      game.fov = parseInt(game.fov as string);
      if (camera.fov > parseInt(game.fov as any) - 10) {
        this.deltaFov -= g.delta * 10;
      }
    } else {
      if (this.bowCharge > 0) {
        // Release bow
        g.socket.emit("fireArrow", {
          pos: this.pos.clone(),
          dir: this.getItemVel(),
          force: this.bowCharge,
        });
      }
      this.bowCharge = 0;

      if (camera.fov < (game.fov as number) - 1) {
        this.deltaFov += (g.delta as any) * 50;
      }
    }
  }

  throw() {
    let item = this.getCurrItem();
    if (!item || !this.key.rightClick) return;

    let throwables = ["ender_pearl", "fireball", "snowball", "egg"];

    for (let throwable of throwables) {
      if (item.v != world.itemId[throwable]) continue;
      g.socket.emit("throwItem", {
        id: g.socket.id,
        name: throwable,
        pos: this.pos.clone(),
        dir: this.getItemVel(),
      });
    }
  }

  moveHand() {
    if (this.mode == "spectator" || this.mode == "camera") return;

    this.punchT = (Date.now() - this.lastPunch) / 120; // Punching

    let hand = this.getCurrItem();
    let blockingSpeed = 10;
    if (hand && hand.class == "item" && hand.c > 0) {
      // Throwing items
      this.throw();

      // Blocking
      const isSword = SWORDS.map((x) => world.itemId[x]).includes(hand.v);

      if (isSword) {
        this.isBlocking = this.key.rightClick;
      } else {
        this.key.rightClick = 0;
        this.isBlocking =
          this.key.rightClick && this.punchT > 1
            ? (this.blockT = Math.min(this.blockT + blockingSpeed * g.delta, 1))
            : (this.blockT = Math.max(0, this.blockT - blockingSpeed * g.delta));
      }

      // Drawing a bow
      this.drawBow();
    } else {
      this.key.rightClick = 0;
      this.isBlocking =
        this.key.rightClick && this.punchT > 1
          ? (this.blockT = Math.min(this.blockT + blockingSpeed * g.delta, 1))
          : (this.blockT = Math.max(0, this.blockT - blockingSpeed * g.delta));
    }

    // legacy code that works
    if (this.blockT > 0 && this.punchT > 1) {
    } else {
      if (this.punchT < 1) {
      } else if (this.punchT >= 1 && this.punchT < 2) {
        this.punchT -= 1;
      } else {
        this.stoppedPunching = true;
      }
    }
  }

  select(update) {
    if (this.mode == "spectator" || this.mode == "camera") return;
    let { blockSize } = world;
    // Crosshair selection for blocks
    let intersects;

    // Update the picking ray with the camera and mouse position
    let dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    if (this.perspective == 2) dir.negate();
    this.raycaster.set(player.pos, dir);
    this.raycaster.far = blockSize * 5;

    // Calculate blocks intersecting the picking ray
    this.nearbyMeshes.length = 0;
    let cellPos = chunkManager.cellPos;
    if (!cellPos) return;

    for (let offset of neighborOffsets) {
      let id = cellPos.x + offset[0] + "," + (cellPos.y + offset[1]) + "," + (cellPos.z + offset[2]);
      if (g.cellIdToMesh[id]) {
        if (g.cellIdToMesh[id][0]) this.nearbyMeshes.push(g.cellIdToMesh[id][0]);
        if (g.cellIdToMesh[id][1]) this.nearbyMeshes.push(g.cellIdToMesh[id][1]);
      }
    }
    intersects = this.raycaster.intersectObjects(this.nearbyMeshes);

    // Eliminate wireframes, items, and clouds from being selected
    this.picked.length = 0;
    for (let i = 0; i < intersects.length; i++) {
      let object = intersects[i].object;
      if (!(object.name == "wireframe" || object.name == "item" || object.name == "cloud")) {
        this.picked.push(intersects[i]);
      }
    }

    // Get the closest block
    let closest: any = { distance: Infinity };
    for (let i = 0; i < this.picked.length; i++) {
      let block = this.picked[i];
      let x = Math.floor((block.point.x - block.face.normal.x) / blockSize);
      let y = Math.floor((block.point.y - block.face.normal.y) / blockSize);
      let z = Math.floor((block.point.z - block.face.normal.z) / blockSize);
      let voxel = world.getVoxel(x, y, z);
      if (closest.distance > this.picked[i].distance && voxel != world.blockId["water"]) {
        closest = this.picked[i];
      }
    }

    // Update wireframe
    if (closest.point && closest.face && update) {
      let x = Math.floor((closest.point.x - closest.face.normal.x) / blockSize) * blockSize + blockSize * 0.5;
      let y = Math.floor((closest.point.y - closest.face.normal.y) / blockSize) * blockSize + blockSize * 0.5;
      let z = Math.floor((closest.point.z - closest.face.normal.z) / blockSize) * blockSize + blockSize * 0.5;

      this.mine_box.position.set(x, y, z);
      this.select_wireframe.position.set(x, y, z);
      this.select_wireframe.visible = true;

      if (this.prevBlock && !this.prevBlock.equals(new THREE.Vector3(x, y, z)) && this.key.leftClick) {
        this.key.leftClick = Date.now();
        this.prevBlock = new THREE.Vector3(x, y, z);
        let { mining_progress } = textureManager;
        this.mine_box.material = mining_progress[0].material;
      }
    } else if (this.select_wireframe) {
      this.select_wireframe.visible = false;
    }

    this.closest = closest;
  }

  punch() {
    if (this.mode == "spectator" || this.mode == "camera") return;
    if (this.isBlocking || !this.raycaster || this.click) return;
    // Punch players
    let { blockSize } = world;
    this.raycaster.far = blockSize * 4;
    this.key.leftClick = Date.now();
    this.lastPunch = Date.now();

    let dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    if (this.perspective == 2) dir.negate();
    this.raycaster.set(player.pos, dir);

    this.playerBoxes.length = 0;
    for (let id in players) this.playerBoxes.push(players[id].skeleton);
    let intersects = this.raycaster.intersectObjects(this.playerBoxes, true);

    this.picked.length = 0;
    for (let i = 0; i < intersects.length; i++) {
      let object = intersects[i].object;
      if (!(object.name == "wireframe" || object.name == "item" || object.name == "cloud")) {
        this.picked.push(intersects[i]);
      }
    }

    // Get the closest intersection
    let closest: any = {
      distance: Infinity,
      object: {},
    };
    for (let i = 0; i < this.picked.length; i++) {
      // Get id of player
      let playerId = this.picked[i].object.parent;
      if (!playerId) continue;
      while (playerId.name == "") {
        playerId = playerId.parent;
        if (playerId == null) break;
      }
      playerId = playerId.name;

      if (closest.distance > this.picked[i].distance && players[playerId].hp > 0) {
        closest = this.picked[i];
        closest.id = playerId;
      }
    }
    if (closest.id) {
      let playerId = closest.id;

      // Calculate the knockback force
      let crit = false;
      if (this.velocity.y < 0) crit = true;

      g.socket.emit("punchPlayer", {
        // Send to server (IBRAHIM I'M LOOKING AT YOU)
        id: playerId,
        dir: camera.getWorldDirection(new THREE.Vector3()),
        force: crit ? 800 : 400,
        crit: crit,
        curr: this.getCurrItem(),
      });
    }
  }

  getBlock() {
    if (this.mode != "creative") return;

    if (this.closest.point && this.closest.face) {
      let { blockSize } = world;

      let x = Math.floor((this.closest.point.x - this.closest.face.normal.x) / blockSize);
      let y = Math.floor((this.closest.point.y - this.closest.face.normal.y) / blockSize);
      let z = Math.floor((this.closest.point.z - this.closest.face.normal.z) / blockSize);

      let voxel = world.getVoxel(x, y, z);
      if (voxel <= 0) return;

      let exists = false;
      let total = 0;
      for (let i = 0; i < this.toolbar.length; i++) {
        let t = this.toolbar[i];
        if (t && t.v == voxel && t.c > 0 && t.class == "block") {
          if (i >= 9) {
            // Move to toolbar
            let item = JSON.parse(JSON.stringify(this.toolbar[i]));
            this.toolbar[i] = undefined;

            // Find space in toolbar
            let foundSpace = false;
            for (let j = 0; j < 9; j++) {
              if (!this.toolbar[j] || this.toolbar[j].c == 0) {
                this.toolbar[j] = item;
                this.currSlot = j;
                foundSpace = true;
                break;
              }
            }
            if (!foundSpace) {
              this.toolbar[this.currSlot] = item;
            }
            g.socket.emit("updateInventory", this.toolbar);
          } else {
            this.currSlot = i;
          }

          exists = true;
          break;
        } else if (t && t.c > 0) {
          total++;
        }
      }
      if (!exists && total < 9) {
        // Add the block to the toolbar
        for (let i = 0; i < 9; i++) {
          let t = this.toolbar[i];
          if ((t && t.c == 0) || !t) {
            this.currSlot = i;
            this.toolbar[i] = { v: voxel, c: 1, class: "block" };
            g.socket.emit("updateInventory", this.toolbar);
            break;
          }
        }
      } else if (!exists && total == 9) {
        // Replace current slot with selected block
        this.toolbar[this.currSlot] = { v: voxel, c: 1, class: "block" };
        g.socket.emit("updateInventory", this.toolbar);
      }
    }
  }

  mine() {
    if (this.isBlocking || this.mode == "spectator" || this.mode == "camera") return;

    this.miningDelayConstant = this.mode == "survival" ? 750 : 200;

    let { blockSize } = world;
    let { mining_progress } = textureManager;

    // Check if block is mined
    if (this.closest.point && this.closest.face) {
      let x = Math.floor((this.closest.point.x - this.closest.face.normal.x) / blockSize);
      let y = Math.floor((this.closest.point.y - this.closest.face.normal.y) / blockSize);
      let z = Math.floor((this.closest.point.z - this.closest.face.normal.z) / blockSize);

      if (y == 0) return;

      let miningDelta = Date.now() - this.key.leftClick; // How much time passed while mining

      let voxel = world.getVoxel(x, y, z);
      if (voxel <= 0) return;

      let unbreakable = voxel == world.blockId["water"];
      if (unbreakable) return;

      let item = this.getCurrItem();

      let constant =
        item && item.v == world.itemId["wood_pickaxe"] && item.class == "item" ? this.miningDelayConstant / 3 : this.miningDelayConstant;
      let blockDelay = miningDelay[world.blockOrder[voxel - 1]] || 1;
      let computedMiningDelay = constant == 0 ? 0 : (this.onObject ? blockDelay : blockDelay * 3) * constant;

      // Continous mining of blocks by holding right click
      if (this.key.leftClick && miningDelta > computedMiningDelay) {
        // Break block
        this.mine_box.visible = false;
        this.select_wireframe.visible = false;

        this.closest = {
          distance: Infinity,
        };
        this.click = false;

        // Remove blocks
        world.setVoxel(x, y, z, 0);
        updateVoxelGeometry(x, y, z, true, true);

        // Send data to server
        g.socket.emit("setBlock", {
          x: x,
          y: y,
          z: z,
          t: 0,
          v: voxel,
        });
      } else if (this.key.leftClick && this.stoppedPunching) {
        // Continue punching animation
        this.lastPunch = Date.now();
        this.stoppedPunching = false;
      } else {
        // Stopped mining
        this.mine_box.material = mining_progress[0].material;
      }

      if (this.key.leftClick) {
        // Check if player is mining the same block
        if (this.prevBlock == undefined) {
          this.prevBlock = new THREE.Vector3(x, y, z);
          this.key.leftClick = Date.now();
        }

        // Update mining progress indicator

        let index = Math.floor((miningDelta / computedMiningDelay) * mining_progress.length).clamp(0, mining_progress.length - 1);

        if (mining_progress[index]) {
          this.mine_box.material = mining_progress[index].material;
          this.mine_box.visible = true;
        }
      }
    } else if (this.mine_box) {
      this.mine_box.material = mining_progress[0].material;
      this.mine_box.visible = false;
    }
  }

  placeBlock() {
    let { blockSize } = world;
    // Continous placing of blocks by holding right click
    this.placingDelay = this.mode == "survival" ? 200 : 200;
    if (this.key.rightClick && Date.now() - this.key.rightClick > this.placingDelay) {
      this.key.rightClick = Date.now();
      this.place = true;
    }

    // Adding armor to armor slots
    let item = this.getCurrItem();
    let index = inventory.isArmor(item);
    if (this.place && typeof index == "number") {
      let armor = JSON.stringify(item);
      if (this.toolbar[inventory.limit + index]) {
        this.toolbar[this.currSlot] = JSON.parse(JSON.stringify(this.toolbar[inventory.limit + index]));
      } else {
        this.toolbar[this.currSlot] = undefined;
      }
      this.toolbar[inventory.limit + index] = JSON.parse(armor);
      g.socket.emit("updateInventory", this.toolbar);

      this.place = false;
      return;
    }

    // Place a block
    if (this.closest.point && this.place) {
      let innerPos = this.closest.point.clone();
      innerPos.sub(this.closest.face.normal);
      innerPos.divideScalar(blockSize);

      let voxel = world.getVoxel(innerPos.x, innerPos.y, innerPos.z);

      if (world.blockOrder[voxel - 1] == "crafting_table") {
        inventory.showCraftingTable = true;
        inventory.showInventory = true;
        inventory.inventory = JSON.parse(JSON.stringify(this.toolbar));
        document.exitPointerLock();
        this.place = false;
        this.placing = Date.now();
        this.key.rightClick = 0;
        return;
      }

      let outerPos = this.closest.point.clone();
      outerPos.add(this.closest.face.normal);
      outerPos.divideScalar(blockSize);

      if (outerPos.y > world.buildHeight)
        // Exceeds build limit
        return;

      voxel = world.getVoxel(outerPos.x, outerPos.y, outerPos.z);
      if (item && item.v > 0 && item.c > 0 && item.class == "block" && voxel <= 1) {
        // Place a block, not air or water
        world.setVoxel(outerPos.x, outerPos.y, outerPos.z, item.v);

        if (this.collides()) {
          world.setVoxel(outerPos.x, outerPos.y, outerPos.z, 0);
          updateVoxelGeometry(outerPos.x, outerPos.y, outerPos.z, true);
        } else {
          updateVoxelGeometry(outerPos.x, outerPos.y, outerPos.z, true);
          // Send data to server
          g.socket.emit("setBlock", {
            x: outerPos.x,
            y: outerPos.y,
            z: outerPos.z,
            t: item.v,
            class: item.class,
          });
          this.lastPunch = Date.now();
        }

        this.place = false;
        this.placing = Date.now();
      }
    }
  }

  getDropDir() {
    let dropDir = camera.getWorldDirection(new THREE.Vector3());
    dropDir.normalize();
    return dropDir;
  }

  dropItem() {
    let item = this.getCurrItem();
    if (!item || item.c <= 0) return;

    let position = this.pos.clone();
    position.y -= 8;

    let droppedItem = {
      type: item.type,
      v: item.v,
      c: 1,
      pos: position,
      class: item.class,
      dir: this.getDropDir(),
    };

    g.socket.emit("dropItems", [droppedItem]);
  }

  updateVelocities(delta) {
    let { blockSize } = world;

    this.newMove = new THREE.Vector3();

    // Reset fly if in survival mode
    this.fly = this.mode == "survival" ? false : this.fly;
    if (this.mode == "spectator") {
      this.fly = true;
      this.noClip = true;
    } else {
      this.noClip = false;
    }

    // Reduce velocity (friction)
    let previousVelocity = this.velocity.clone();
    this.velocity.x -= previousVelocity.x * 10.0 * delta;
    this.velocity.z -= previousVelocity.z * 10.0 * delta;
    // Determine direction vector
    this.direction.x = (keyPressedPlayer("a") ? 1 : 0) + (keyPressedPlayer("d") ? -1 : 0);
    this.direction.z = (keyPressedPlayer("w") ? 1 : 0) + (keyPressedPlayer("s") ? -1 : 0);

    // Normalize direction vector
    let mag = Math.sqrt(Math.abs(this.direction.x) + Math.abs(this.direction.z));
    if (mag > 0) {
      this.direction.x = this.direction.x / mag;
      this.direction.z = this.direction.z / mag;
    }

    if (this.onObject && !this.fly) this.velocity.y = Math.max(0, this.velocity.y);

    if (this.fly) {
      this.velocity.y -= previousVelocity.y * 10.0 * delta;
    } else if (this.inWater && this.direction.z > 0 && keyPressedPlayer("shift")) {
      let dir = camera.getWorldDirection(new THREE.Vector3());
      dir.z = dir.z;
      dir.multiplyScalar(Math.min(50 * delta * this.speed, 50 * delta * this.velocity.distanceTo(new THREE.Vector3(0, 0, 0))));
      this.velocity.divideScalar(Math.max(1 + delta * 50, 1.01));

      this.previousPosition = this.pos.clone();
      let currentPosition = this.pos.clone();

      currentPosition.add(dir);
      let move = currentPosition.sub(this.previousPosition);
      this.newMove.add(move);
      this.halfHeight = blockSize * 0.4;
    } else {
      if (keyPressedPlayer("space") && this.inWater) {
        this.velocity.y = 50;
      } else if (this.headInWater) {
        this.velocity.y = Math.min(-20, this.velocity.y * delta * 50);
      } else {
        this.velocity.y -= 9.81 * 50.0 * delta; // Falling in air
      }

      // Jump
      if (keyPressedPlayer("space") && !chat.showChatBar) {
        if (this.onObject) {
          this.velocity.y += this.initialJumpVelocity;
          if (this.onObjectTime < this.bhopTimeLimit) {
            this.maxSprintSpeed = Math.min(this.bhopMaxSpeed, this.maxSprintSpeed + this.bhopRate);
          } else {
            this.maxSprintSpeed = this.defaultMaxSprintSpeed;
          }
        }
      } else if (this.onObjectTime > this.bhopTimeLimit) {
        this.maxSprintSpeed = this.defaultMaxSprintSpeed;
      }

      // Reset shift position

      if (!this.fly) {
        this.pos.y = this.savedPosition.y;
        this.halfHeight = blockSize * 0.8;
      }
    }

    if (keyPressedPlayer("w") || keyPressedPlayer("s")) this.velocity.z -= this.direction.z * 400.0 * delta;
    if (keyPressedPlayer("a") || keyPressedPlayer("d")) this.velocity.x -= this.direction.x * 400.0 * delta;

    if (this.fly) {
      if (keyPressedPlayer("space")) this.velocity.y += 400.0 * delta;
      if (keyPressedPlayer("alt")) this.velocity.y -= 400.0 * delta;
    }
  }

  updateMoveAxis(delta) {
    // Get movement preview by adding up all the movement from object space
    this.onObject = false;

    let axes = ["y", "x", "z"];

    for (let i = 0; i < axes.length; i++) {
      let axis = axes[i];
      let axesVec = new THREE.Vector3();
      axesVec[axis] = 1;

      let original = this.velocity[axis] * delta * this.speed;
      let originalY = this.velocity[axis] * delta;
      let currentVel;
      if (!this.fly) {
        currentVel = [originalY, original / 2, original];
      } else {
        currentVel = [original * 1.3, original, original * 1.3];
      }

      this.previousPosition = this.pos.clone();
      let currentPosition = this.controls.getObject().clone(false);
      currentPosition.translateOnAxis(axesVec, currentVel[i]);
      let move = currentPosition.position.sub(this.previousPosition);
      this.newMove.add(move);
    }
  }

  applyKnockback(delta) {
    // Player knockback
    let knockback = new THREE.Vector3(this.knockbackVelocity.x, this.knockbackVelocity.y, this.knockbackVelocity.z);
    knockback.multiplyScalar(delta);
    this.newMove.add(knockback);
    let frictionCoef = Math.max(1.05, (1.1 * delta) / 0.007);
    this.knockbackVelocity.divideScalar(frictionCoef);

    // Player camera fall knockback
    if (Math.abs(camera.rotation.z) > 0.1) {
      camera.rotation.z -= Math.sign(camera.rotation.z) * delta * 1.5; // Rate at which camera rotation returns to normal
    } else {
      camera.rotation.z = 0;
    }
  }

  checkCollision(delta) {
    let { blockSize } = world;
    let test_axes = ["y", "x", "z", "xz"];

    // Check for collision
    if (!this.noClip) {
      let savedMove = this.newMove.clone();

      // Test each axis in collsion
      let previousPosition = this.pos.clone();

      for (let axes of test_axes) {
        if (axes === "y" && !this.fly) {
          // Test for y
          this.pos.y += this.newMove.y;
          let collision = this.collides();
          if (!collision) continue;

          if ((!this.inWater && this.velocity.y <= 0) || this.pos.y <= blockSize) {
            let jumpDiff = Math.floor((this.prevHeight - this.pos.y) / blockSize) - 3;

            if (jumpDiff > 0 && jumpDiff < 500 && this.mode == "survival" && !this.god) {
              // Fall damage
              g.socket.emit("takeDamage", {
                dmg: jumpDiff,
                type: "fall",
              });
              camera.rotation.order = "YXZ";
              camera.rotation.z = Math.PI / 12; // Yoink the camera
              this.fallCooldown = Date.now();
              this.prevHeight = this.pos.y;
            }

            this.velocity.y = 0;
            this.onObject = true;
            this.newMove.y = 0;
          } else if (this.inWater || this.onObject) {
            this.newMove.y = 0;
          } else {
            // Head hit
            this.velocity.y = 0;
            this.newMove.y = 0;
            this.maxSprintSpeed = Math.min(this.bhopMaxSpeed, this.maxSprintSpeed + this.bhopRate * 10);
          }
          // Put back before testing y
          this.pos.y = previousPosition.y;
        }

        let separate_axes = axes.split("");

        for (let axis of separate_axes) {
          this.controls.getObject().position[axis] += this.newMove[axis];
        }

        if (this.collides()) {
          for (let axis of separate_axes) {
            this.newMove[axis] = 0;

            if (axis === "y" && this.velocity.y < 0 && this.fly) {
              this.fly = false;
            }
          }
        }

        for (let axis of separate_axes) {
          // Test for y during shift mode
          this.pos.y += savedMove.y;
          if (!this.collides() && this.onObject && keyPressedPlayer("alt")) {
            this.velocity[axis] = 0;
            this.newMove[axis] = 0;
          }
          // Put back before testing y
          this.pos.y = previousPosition.y;

          this.pos[axis] = previousPosition[axis];
        }
      }
    }

    // Update player position
    this.pos.x += this.newMove.x;
    if (!(!this.onObject && this.newMove.y === 0) && !this.fly) {
      this.pos.y += this.newMove.y;
    } else {
      this.pos.y += this.newMove.y;
    }
    this.pos.z += this.newMove.z;

    // Stop sprinting if you hit a block
    this.distanceMoved = this.previousPosition.sub(this.pos).length() / delta / blockSize;
    if (this.distanceMoved < 1.5 && this.onObject === false && !this.fly) {
      this.speed = 2;
      this.maxSprintSpeed = this.defaultMaxSprintSpeed;
    }

    // Record last height on ground
    if (this.onObject || this.fly || this.inWater) {
      this.prevHeight = this.pos.y;
    }

    // Check if stuck
    if (this.collides() && !this.noClip) {
      this.pos.y += blockSize * delta * 30; // Move up at a rate of 10 blocks per second
    }

    // Save position
    this.savedPosition = this.pos.clone();

    // BHOP
    if (this.onObject) {
      this.onObjectTime += delta;
    } else {
      this.onObjectTime = 0;
    }

    // Update movement

    this.sprintSpeed = this.inWater ? this.maxWalkSpeed * 1.5 : this.maxSprintSpeed;
    if (this.fly) this.sprintSpeed = this.maxSprintSpeed * 2;
    if (keyPressedPlayer("s") && !this.fly) this.sprintSpeed = this.maxWalkSpeed;
    this.walkSpeed = this.inWater ? this.maxWalkSpeed / 2 : this.maxWalkSpeed;
    let acc = this.inWater ? 1 : 10;
    if (keyPressedPlayer("shift")) {
      if (this.speed < this.sprintSpeed) {
        this.speed += delta * acc;
      } else {
        this.speed = this.sprintSpeed;
      }
    } else {
      if (this.speed > this.walkSpeed) {
        this.speed -= delta * acc;
      } else {
        this.speed = this.walkSpeed;
      }
      this.maxSprintSpeed = this.defaultMaxSprintSpeed;
    }
    if (keyPressedPlayer("alt") && !this.fly && this.onObject && this.mode != "spectator") {
      this.speed = 0.75;

      this.pos.y += -this.walkSpeed * 1.5;
      this.halfHeight = blockSize * 0.6;
    }
    if (this.drawingBow || (this.isBlocking && this.mode == "survival")) this.speed = 0.75;
    if ((this.drawingBow || this.isBlocking) && keyPressedPlayer("alt") && this.mode == "survival") this.speed = 0.5;

    // Change camera fov when sprinting

    if (!this.drawingBow) {
      game.fov = parseInt(game.fov as any);
      if (this.speed <= 2 || this.distanceMoved < 1.5) {
        if (camera.fov > game.fov) {
          this.deltaFov -= delta * 100;
        }
      } else if (this.distanceMoved > 7) {
        if (camera.fov < game.fov + 10) {
          this.deltaFov += delta * 100;
        }
      }
    }

    camera.fov = (game.fov as number) + this.deltaFov;
    camera.updateProjectionMatrix();
  }

  // Update player movement
  move(delta) {
    this.updateVelocities(delta);
    this.updateMoveAxis(delta);
    this.applyKnockback(delta);
    this.checkCollision(delta);
  }

  updateVitals() {
    if (this.mode != "survival") return;

    // Update oxygen bar
    if (this.headInWater) {
      this.oxygen += this.lastOxygenTick - game.tick.value;
      this.lastOxygenTick = game.tick.value;
    } else {
      this.oxygen = 300;
      this.lastOxygenTick = game.tick.value;
    }

    if (this.oxygen < -20) {
      g.socket.emit("takeDamage", {
        dmg: 1,
        type: "drowning",
      });
      this.oxygen = 0;
      this.lastOxygenTick = game.tick.value;

      camera.rotation.z = Math.PI / 12;
    }
  }

  updateCamera() {
    if (this.perspective > 0) {
      let sign = this.perspective == 1 ? 1 : -1;
      camera.position.set(0, 0, 100 * sign);

      let target = new THREE.Vector3();
      camera.getWorldPosition(target);

      let dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.negate();

      let pos = player.pos.clone();

      this.raycaster.set(pos, dir);
      this.raycaster.far = 100;

      let intersects = this.raycaster.intersectObjects(this.nearbyMeshes);

      let closest;
      let closestDist = Infinity;
      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < closestDist) {
          closest = intersects[i];
          closestDist = intersects[i].distance;
        }
      }

      if (closest) {
        camera.position.z = (closest.distance - blockSize) * sign;
        camera.position.y = 0;
      }
    }

    if (!this.cinematicMode) return;
    let yawObject = this.controls.getObject();
    let pitchObject = yawObject.children[0];

    yawObject.rotation.y = rotation.y;
    pitchObject.rotation.x = rotation.x;
  }

  toggleCameraPerspective() {
    // Reset to default camera
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    this.entity.visible = false;

    if (this.perspective == 0) {
      chat.addChat({ text: "Camera Perspective: First Person", discard: true });
    } else if (this.perspective == 1) {
      camera.position.z = 100;
      camera.position.y = 3;

      chat.addChat({ text: "Camera Perspective: Third Person (back)", discard: true });
      this.entity.visible = true;
    } else if (this.perspective == 2) {
      camera.rotation.y = Math.PI;
      camera.position.z = -100;
      camera.position.y = 3;

      chat.addChat({ text: "Camera Perspective: Third Person (front)", discard: true });
      this.entity.visible = true;
    }

    activeItemVoxels.currentItem = null;
    activeItemVoxels.currentBlock = null;
  }

  updatePlayerMesh() {
    this.punching = player.punchT < 2;
    this.blocking = player.isBlocking > 0;
    this.walking = new THREE.Vector3(player.velocity.x, 0, player.velocity.z).length() > 2;
    this.sneaking = keyPressedPlayer("alt");
    this.rot = this.controls.getObject().rotation.toVector3();
    camera.getWorldDirection(this.dir);
    if (this.perspective == 2) this.dir.y *= -1;
    this.vel = this.newMove;
    this.localVel = this.velocity;

    if (this.perspective == 0) return;
    PlayerManager.updatePlayer(this);
  }

  update(delta) {
    if (this.hp <= 0 || !g.initialized || !g.joined || !isState("inGame")) return;

    this.select(true);

    this.mine();
    this.placeBlock();
    this.updateHand();
    activeItemVoxels.update();

    this.move(delta);

    this.updateVitals();
    this.updateCamera();
    this.updatePlayerMesh();
  }

  updateClient(data) {
    // Update health
    if (data && data.hp != this.hp) {
      this.heartBlink = game.tick.value;
      if (!this.lastHp || data.hp > this.lastHp) {
        this.lastHp = this.hp;
      }
    }

    // Update server-side data
    this.hp = data.hp;
    this.name = data.name;
    this.ping = data.ping;
    this.toolbar = data.toolbar;
    this.inventory = data.toolbar;
    this.operator = data.operator;
    this.biome = data.biome;
  }

  collideVoxel(x, y, z) {
    let voxel = world.getVoxel(x, y, z);
    if (voxel > 1 && voxel != 255) return voxel;
  }

  collides() {
    let { blockSize } = world;

    let posX = Math.floor(this.pos.x / blockSize);
    let posZ = Math.floor(this.pos.z / blockSize);

    // Check  if under water
    let x = posX;
    let y = Math.floor((this.pos.y - blockSize * 1.62) / blockSize);
    let z = posZ;

    let voxel1 = world.getVoxel(x, y, z);

    x = posX;
    y = Math.floor((this.pos.y + blockSize * 0.2) / blockSize);
    z = posZ;

    let voxel2 = world.getVoxel(x, y, z);

    if (!world.blockId) return;

    // Body in water
    this.inWater = voxel1 == world.blockId["water"] || voxel2 == world.blockId["water"];

    x = posX;
    y = Math.floor(this.pos.y / blockSize);
    z = posZ;

    let voxel = world.getVoxel(x, y, z);

    // Head in water
    this.headInWater = voxel == world.blockId["water"];
    masterRenderer.renderUnderWater = this.headInWater;

    // Head and feet

    x = posX;
    y = Math.floor((this.pos.y - this.halfHeight * 2) / blockSize);
    z = posZ;

    if (this.collideVoxel(x, y, z)) return true;

    x = posX;
    y = Math.floor((this.pos.y + blockSize * 0.2) / blockSize);
    z = posZ;

    if (this.collideVoxel(x, y, z)) return true;

    // Top

    for (let i = -1; i < 2; i += 2) {
      for (let j = -1; j < 2; j += 2) {
        x = Math.floor((this.pos.x + i * blockSize * 0.25) / blockSize);
        y = Math.floor(this.pos.y / blockSize);
        z = Math.floor((this.pos.z + i * blockSize * 0.25) / blockSize);

        if (this.collideVoxel(x, y, z)) return true;
      }
    }

    // Middle

    for (let i = -1; i < 2; i += 2) {
      for (let j = -1; j < 2; j += 2) {
        x = Math.floor((this.pos.x + i * blockSize * 0.25) / blockSize);
        y = Math.floor((this.pos.y - blockSize * 0.8) / blockSize);
        z = Math.floor((this.pos.z + j * blockSize * 0.25) / blockSize);

        if (this.collideVoxel(x, y, z)) return true;
      }
    }

    // Bottom

    for (let i = -1; i < 2; i += 2) {
      for (let j = -1; j < 2; j += 2) {
        x = Math.floor((this.pos.x + i * blockSize * 0.25) / blockSize);
        y = Math.floor((this.pos.y - this.halfHeight * 2) / blockSize);
        z = Math.floor((this.pos.z + j * blockSize * 0.25) / blockSize);

        if (this.collideVoxel(x, y, z)) return true;
      }
    }
  }

  toggleFly() {
    if (player.controls.enabled) {
      player.fly = !player.fly;
    }
  }
}
const player = new Player();
globalThis.player = player;
export default player;
