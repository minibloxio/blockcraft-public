import * as $ from "jquery";
import Cookies from "js-cookie";
import { bindKeys, keyMap, keyPressed } from "kontra";
import { giveCommandHint, nextCommand, prevCommand } from "../commands";
import { camera, g } from "../globals";
import hud from "../gui/HUD";
import { axesHelper } from "../index.js";
import inventory from "../items/Inventory";
import chat from "../managers/ChatManager.js";
import player from "../Player";
import threeStats from "../stats/ThreeStats";
import screenshotter from "../gui/Screenshot";

let doublePressDelay = 200;
let lastKeypressTime = 0;

export function keyPressedPlayer(key) {
  return keyPressed(key) && player.controls.enabled && !chat.showChatBar && g.initialized;
}

bindKeys(
  "f",
  () => {
    if (player.controls.enabled && !chat.showChatBar && player.mode != "survival") {
      chat.addChat({ text: "Double tap space in creative mode to fly", color: "cyan" });
    }
  },
  { preventDefault: false, handler: "keydown" }
);

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

// Toggle camera mode
let lastGamemode = undefined;
bindKeys("f1", () => {
  if (player.mode == "camera" && !player.toggleGUI) return;
  lastGamemode = !player.toggleGUI ? player.mode : player.mode != "camera" ? player.mode : lastGamemode;
  player.mode = !player.toggleGUI ? "camera" : lastGamemode;
  hud.showStats = player.toggleGUI && Cookies.get("showStats") == "true";
  threeStats.showStats = player.toggleGUI && (hud.showStats || game.debug == true);
  !player.toggleGUI ? $("#chat-input").attr("placeholder", "") : $("#chat-input").attr("placeholder", "> Press Enter to Chat");

  player.toggleGUI = !player.toggleGUI;
});

// Take a screenshot
bindKeys("f2", () => {
  screenshotter.takeScreenshot();
});

// Toggle stats list
bindKeys("f3", () => {
  hud.showStats = !hud.showStats;
  threeStats.showStats = hud.showStats;
  Cookies.set("showStats", hud.showStats ? "true" : "false", { expires: 365 });
});

// Toggle perspective
bindKeys("f5", () => {});

// Toggle debug mode
bindKeys("f7", () => {
  game.debug = !game.debug;
  threeStats.showStats = game.debug || hud.showStats;
  Cookies.set("debug", game.debug ? "true" : "false", { expires: 365 });
  updateDebug();
});

// Toggle cinematic mode
bindKeys("f8", (event) => {
  event.preventDefault();
  player.cinematicMode = !player.cinematicMode;
});

// Toggle fullscreen
bindKeys("f11", (event) => {
  event.preventDefault();
  if (!window.screenTop && !window.screenY) {
    // fullscreen -> window
    document.exitFullscreen();
  } else {
    // window -> fullscreen
    document.documentElement.requestFullscreen();
  }
});

function updateDebug() {
  for (let id in players) {
    let player = players[id];
    player.bbox.visible = game.debug;
  }

  for (let id in world.entities) {
    let entity = world.entities[id];
    entity.bbox.visible = game.debug;
  }

  axesHelper.visible = !!game.debug;

  for (let id in chunkManager.debugLines) {
    let line = chunkManager.debugLines[id];
    line.visible = game.debug;
  }
}
