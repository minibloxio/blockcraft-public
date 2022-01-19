import { bindKeys } from "kontra";
import player from "../Player.js";
import chat from "../managers/ChatManager.js";

var doublePressDelay = 200;
var lastKeypressTime = 0;

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
      fly();
    }
    lastKeypressTime = pressTime;
  },
  { preventDefault: false, handler: "keydown" }
);

function fly() {
  if (player.controls.enabled) {
    player.fly = !player.fly;
  }
}
