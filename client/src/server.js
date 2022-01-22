import * as THREE from "three";
import game from "./Game";
import world from "./world/WorldManager";
import player from "./entity/player/Player";
import { players } from "./globals";
import PlayerManager from "./managers/PlayerManager";
import PlayerMesh from "./graphics/PlayerMesh";

// Update server players
export function updatePlayers(serverPlayers) {
  for (let id in players) {
    let p = players[id];
    let p_ = serverPlayers[id];
    if (p.pos && p.rot && p_) {
      // Set new player location
      p.pos.set({ x: p_.pos.x, y: p_.pos.y, z: p_.pos.z });
      p.rot.set({ x: p_.rot.x, y: p_.rot.y, z: p_.rot.z });
      p.dir.set({ x: p_.dir.x, y: p_.dir.y, z: p_.dir.z });

      p.vel.set({ x: p_.vel.x, y: p_.vel.y, z: p_.vel.z });

      // Update player data
      if (p_.hp != p.hp) {
        p.heartBlink = game.tick.value;
        if (!p.lastHp || p_.hp > p.lastHp) {
          p.lastHp = p.hp;
        }
      }
      p.hp = p_.hp;
      if (p.hp <= 0 && p.entity.visible) {
        p.entity.visible = false;
      } else if (p.hp > 0) {
        p.entity.visible = true;
      }

      // Update armor
      PlayerMesh.updateArmor(p, p_);

      // Update gamemode / operator
      if (p.mode != p_.mode || p.operator != p_.operator) {
        p.operator = p_.operator;
        PlayerManager.updateNameTag(p);
        PlayerManager.setPlayerGamemode(p, p_.mode);
      }

      // Update player hand if necessary
      let same =
        p.toolbar[p_.currSlot] &&
        p_.toolbar[p_.currSlot] &&
        p.toolbar[p_.currSlot].v == p_.toolbar[p_.currSlot].v &&
        p.toolbar[p_.currSlot].class == p_.toolbar[p_.currSlot].class &&
        p.toolbar[p_.currSlot].c == p_.toolbar[p_.currSlot].c;
      let bothExists = p.toolbar[p_.currSlot] == null && p_.toolbar[p_.currSlot] == null;
      if (p.currSlot != p_.currSlot || (!same && !bothExists) || p.bowCharge != p_.bowCharge) {
        p.currSlot = p_.currSlot;
        p.bowCharge = p_.bowCharge;

        let hand = p_.toolbar[p.currSlot];
        PlayerManager.updatePlayerHand(hand, p);
      }

      // Transfer data
      let transferredValues = (({ ping, toolbar, walking, sneaking, punching, blocking, fps }) => ({
        ping,
        toolbar,
        walking,
        sneaking,
        punching,
        blocking,
        fps,
      }))(p_);
      Object.assign(p, transferredValues);

      // Update player name if necessary (performance intensive)
      if (p.name != p_.name) {
        p.name = p_.name;

        PlayerManager.updateNameTag(p); // Update name tag
        PlayerManager.setPlayerGamemode(p, p.mode); // Set gamemode
      }
    }
  }
}

// Animate server players
export function animateServerPlayers() {
  for (let id in players) {
    let p = players[id];
    if (!p.entity) continue;
    PlayerManager.updatePlayer(p);
  }
}

// Animate server entities
let throwables = ["ender_pearl", "fireball", "snowball", "egg"];

export function animateServerEntities(delta) {
  for (let id in world.entities) {
    let entity = world.entities[id];
    if (!entity.mesh) continue;

    if (throwables.includes(entity.name)) {
      entity.mesh.lookAt(player.pos);
    } else if (entity.name != "arrow") {
      entity.mesh.rotation.y += delta; // Rotate entity around y axis

      let mesh = entity.mesh.children;

      if (entity.onObject) {
        // Animate server entities on the ground
        let offset = Math.sin(((Date.now() - entity.t + 500) / 1000) * Math.PI) * 2 - 2;
        if (entity.class == "item") {
          let target = new THREE.Vector3(0, offset, -4);
          mesh[1].position.lerp(target, delta * 10);
          mesh[0].position.set(0, mesh[1].position.y, 0);
        } else if ((entity.class = "block")) {
          let target = new THREE.Vector3(-2, 2 + offset, -2);
          mesh[1].position.lerp(target, delta * 10);
          mesh[0].position.set(0, mesh[1].position.y, 0);
        }
      } else {
        mesh[1].position.y = 0;
      }
    } else if (entity.name == "arrow") {
      let dir = new THREE.Vector3(entity.vel.x, entity.vel.y, entity.vel.z).normalize();
      let mx = new THREE.Matrix4().lookAt(dir, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
      let qt = new THREE.Quaternion().setFromRotationMatrix(mx);
      entity.qt.slerp(qt, delta);
      entity.mesh.setRotationFromQuaternion(qt);
    }

    entity.mesh.position.lerp(entity.pos, delta * 10);
  }
}
