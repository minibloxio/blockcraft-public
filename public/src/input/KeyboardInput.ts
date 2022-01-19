import { bindKeys, keyPressed } from "kontra";
import player from "../Player.js";
import chat from "../managers/ChatManager.js";
import hud from "../gui/HUD";
import { camera, g } from "../globals";

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
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  (e) => {
    player.currentSlot = parseInt(e.key);
  },
  { preventDefault: false }
);

// zoom
bindKeys(
  "x",
  () => {
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

export function update() {
  hud.showPlayerTab = keyPressedPlayer("tab");
}
