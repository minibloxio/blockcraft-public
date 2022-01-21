/*

Provides pointer lock functionality and the ability to connect to the game server

*/

import * as THREE from "three";
import Cookies from "js-cookie";
import inventory from "../items/Inventory";
import player from "../Player";
import chat from "../managers/ChatManager";
import masterRenderer from "../graphics/MasterRenderer";
import { g } from "../globals";
import { updateGUISize } from "../lib/helper";
import { keyMap } from "kontra";
import { clamp } from "../lib/helper";
import Ola from "ola";

export default class PointerLock {
  // Init pointer lock
  static initPointerLock() {
    let havePointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;
    if (havePointerLock) {
      let element = document.body;
      let escapePress = false;

      function enabled() {
        return (
          document.pointerLockElement === element ||
          document.mozPointerLockElement === element ||
          document.webkitPointerLockElement === element
        );
      }

      let pointerlockchange = function (event) {
        if (enabled()) {
          PointerLock.onEnter();
        } else if (!escapePress) {
          // Exit pointer lock
          PointerLock.onExit();
        }
      };

      let pointerlockerror = function (event) {
        event.preventDefault();
        return;
      };

      // Hook pointer lock change events
      document.addEventListener("pointerlockchange", pointerlockchange, false);
      document.addEventListener("mozpointerlockchange", pointerlockchange, false);
      document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

      document.addEventListener("pointerlockerror", pointerlockerror, false);
      document.addEventListener("mozpointerlockerror", pointerlockerror, false);
      document.addEventListener("webkitpointerlockerror", pointerlockerror, false);

      $("body")
        .keydown(function (event) {
          if (event.code == "Escape" && !chat.showChatBar) {
            if (player.controls.enabled) {
              document.exitPointerLock();
            }
          }

          if (
            keyMap[event.code] == "e" &&
            !chat.showChatBar &&
            g.loaded >= g.maxLoaded + 1 &&
            (player.controls.enabled || inventory.showInventory)
          ) {
            if (player.controls.enabled && inventory.canShowInventory) {
              inventory.showInventory = true;
              inventory.canShowInventory = false;
              inventory.showCraftingTable = false;
              inventory.inventory = JSON.parse(JSON.stringify(player.toolbar));

              document.exitPointerLock();
            } else if (document.activeElement.id != "search-input" && inventory.canShowInventory) {
              inventory.canShowInventory = false;

              // Ask the browser to lock the pointer
              PointerLock.requestPointerLock();
              g.socket.emit("updateInventory", inventory.inventory);
            }
          }

          if (event.code == "Tab") event.preventDefault();
        })
        .keyup(function (event) {
          if (event.code == "Escape" && inventory.showInventory) {
            // Ask the browser to lock the pointer
            PointerLock.requestPointerLock();
            g.socket.emit("updateInventory", inventory.inventory);
          }

          inventory.canShowInventory = true;
        });
    } else {
      console.error("PointerLock is not supported on this browser");
    }
  }

  // Request pointer lock
  static requestPointerLock() {
    if (g.loaded >= g.maxLoaded) {
      // Ask the browser to lock the pointer
      let element = document.body;
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
      element.requestPointerLock();
    }
  }

  // Enter pointer lock
  static onEnter() {
    player.controls.enabled = true;
    blocker.style.display = "none";
    $("#background-image").hide();
    onWindowResize();

    if (inventory.showInventory) {
      // Return to game from inventory
      inventory.showInventory = false;

      let droppedItems = [];
      if (inventory.showCraftingTable) {
        // Drop items in crafting table grid
        droppedItems = PointerLock.getDroppedItems(inventory.craftingTableGrid);
        inventory.craftingTableGrid.length = 0;
      } else {
        // Drop items in crafting grid
        droppedItems = PointerLock.getDroppedItems(inventory.craftingGrid);
        inventory.craftingGrid.length = 0;
      }
      droppedItems = droppedItems.concat(PointerLock.getDroppedItems([inventory.selectedItem])); // Drop items in hand
      inventory.selectedItem = null;
      droppedItems.force = true;

      g.socket.emit("dropItems", droppedItems);

      inventory.craftingOutput = undefined;
      inventory.showCraftingTable = false;
    } else {
      // Return to game from chat
      let name = $("#name-input").val().trim().removeExtraSpaces();
      if (!name) $("#name-input").val("");

      // Update cookie
      if (name && Cookies.get("Name") != name) Cookies.set("Name", name, { expires: 10000 });

      g.socket.emit("updateUsername", {
        name: name,
      });
    }
  }

  // Exit pointer lock
  static onExit() {
    if (!inventory.showInventory) {
      blocker.style.display = "block";
    }
    player.controls.enabled = false;
    $("#chat-input").blur();
    $("#chat-input").css({ "background-color": "rgba(0, 0, 0, 0)" });
    $("#chat-input").val("");
    chat.showChatBar = false;
  }

  // Get item entity TODO: Move to items
  static getItemEntity(player, item, dropDir) {
    let pos = {
      x: player.position.x,
      y: player.position.y - 8,
      z: player.position.z,
    };

    let entity = {
      force: true,
      v: item.v,
      c: 1,
      pos: pos,
      class: item.class,
      dir: dropDir,
    };
    return entity;
  }

  // Get dropped items
  static getDroppedItems(items, count) {
    if (!items) return [];

    let droppedItems = [];
    let dropDir = player.getDropDir();
    for (let item of items) {
      if (!item) continue;
      for (let i = 0; i < (count || item.c); i++) {
        droppedItems.push(PointerLock.getItemEntity(player, item, dropDir));
      }
    }

    return droppedItems;
  }
}

let rotation = Ola(
  {
    x: 0,
    y: 0,
  },
  800 // Interpolation time
);

export { rotation };

export function PointerLockControls(camera) {
  let self = this;

  camera.rotation.set(0, 0, 0);

  // Add pitch
  let pitchObject = new THREE.Object3D();
  pitchObject.add(camera);

  // Add yaw
  let yawObject = new THREE.Object3D();
  yawObject.position.y = 10;
  yawObject.add(pitchObject);

  let PI_2 = Math.PI / 2;

  let rotationX = 0;
  let rotationY = 0;

  let onMouseMove = function (event) {
    if (self.enabled === false) return;

    let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // TODO: Could be causing problems in some browsers
    if (Math.abs(movementX) > 300) return;
    if (Math.abs(movementY) > 300) return;

    // Update rotation
    rotationY -= movementX * 0.00004 * player.sens;
    rotationX -= movementY * 0.00004 * player.sens;
    rotationX = clamp(rotationX, -PI_2, PI_2);

    rotation.y = rotationY;
    rotation.x = rotationX;

    // Type of camera mode
    if (!player.cinematicMode) {
      // Normal mode
      yawObject.rotation.y = rotationY;
      pitchObject.rotation.x = clamp(rotationX, -PI_2, PI_2);
    }
  };

  this.dispose = function () {
    document.removeEventListener("mousemove", onMouseMove, false);
  };

  document.addEventListener("mousemove", onMouseMove, false);

  this.enabled = false;

  this.getObject = function () {
    return yawObject;
  };
}

// Window resize
export function onWindowResize() {
  if (!g.initialized) return;

  masterRenderer.resize();

  let crosshairSize = 50;

  let width = $("html").innerWidth();
  $("#crosshair").css("left", width / 2 - crosshairSize / 2);
  let height = $("html").innerHeight();
  $("#crosshair").css("top", height / 2 - crosshairSize / 2);

  updateGUISize();
}
