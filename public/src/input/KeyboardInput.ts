import * as $ from "jquery";
import { bindKeys, keyPressed, keyMap } from "kontra";
import player from "../Player";
import chat from "../managers/ChatManager.js";
import hud from "../gui/HUD";
import { camera, g } from "../globals";
import { giveCommandHint, nextCommand, prevCommand } from "../commands";
import inventory from "../items/Inventory";
import threeStats from "../stats/ThreeStats";

var doublePressDelay = 200;
var lastKeypressTime = 0;

export function keyPressedPlayer(key) {
  return keyPressed(key) && player.controls.enabled && !chat.showChatBar && g.initialized;
}

bindKeys("f", () => {
  chat.addChat({ text: "Double tap space in creative mode to fly", color: "cyan" });
});

bindKeys(
  "space",
  (event) => {
    if (event.repeat) return;

    let pressTime = new Date().getTime();
    if (pressTime - lastKeypressTime <= doublePressDelay) {
      pressTime = 0;
      player.toggleFly();
    }
    lastKeypressTime = pressTime;
  },
  { preventDefault: false, handler: "keydown" }
);

// number keys for hotbar
bindKeys(
  ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  (e) => {
    if (!player.controls.enabled || chat.showChatBar) return;
    player.currentSlot = parseInt(keyMap[e.code]) - 1;
  },
  { preventDefault: false }
);

// zoom
bindKeys(
  "x",
  () => {
    if (!player.controls.enabled || chat.showChatBar) return;
    camera.zoom = g.zoomLevel;
    g.enableZoom = true;
  },
  { preventDefault: false, handler: "keydown" }
);
bindKeys(
  "x",
  () => {
    g.zoomLevel = 3;
    g.enableZoom = false;
    camera.zoom = 1;
  },
  { preventDefault: false, handler: "keyup" }
);

// respawn
bindKeys(
  "r",
  (event) => {
    if (!player.controls.enabled || chat.showChatBar || event.repeat) return;
    player.respawn(world.blockSize);
    g.socket.emit("respawn");
  },
  { preventDefault: false, handler: "keydown" }
);

// drop
bindKeys(
  "q",
  (event) => {
    if (!player.controls.enabled || chat.showChatBar || event.repeat) return;
    player.dropItem();
  },
  { preventDefault: false, handler: "keydown" }
);

export function update() {
  hud.showPlayerTab = keyPressedPlayer("tab");
}

// open chat
bindKeys(
  ["enter", "slash"],
  (e) => {
    if (!player.controls.enabled) return;
    const slashOpen = e.code === "Slash" && !chat.showChatBar; // slash key to toggle chat when it isn't already open
    if (e.code == "Enter" || slashOpen) chat.showChatBar = !chat.showChatBar;
  },
  { preventDefault: false, handler: "keydown" }
);

bindKeys(
  "up",
  () => {
    if (!g.initialized) return;
    if (chat.showChatBar) {
      prevCommand();
    } else {
      inventory.scroll(1);
    }
  },
  { preventDefault: false }
);

bindKeys(
  "down",
  () => {
    if (!g.initialized) return;
    if (chat.showChatBar) {
      nextCommand();
    } else {
      inventory.scroll(-1);
    }
  },
  { preventDefault: false }
);

$(window).on("keyup", function (event) {
  if (chat.showChatBar) {
    chat.hintText = "";
    let msg = $("#chat-input").val();
    if (player && player.controls.enabled && msg && msg[0] == "/") {
      chat.hintText = "";
      msg = msg.slice(1).removeExtraSpaces().split(" "); // Remove slash and split by spaces
      giveCommandHint(msg, [9].indexOf(event.keyCode) > -1);
    }
  }
});

// function keys
// ###########################################
bindKeys("f3", () => {
  hud.showStats = !hud.showStats;
  threeStats.showStats = hud.showStats;
});
