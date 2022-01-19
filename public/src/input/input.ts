import * as $ from "jquery";
import { initKeys, keyMap } from "kontra";
import keyconfig from "../../json/keyconfig.json";
import { c, giveCommandHint, nextCommand, prevCommand } from "../commands";
import inventory from "../items/Inventory";
import chat from "../managers/ChatManager";
import player from "../Player";

import "./KeyboardInput";
import "./MouseInput";

initKeys();

var map = {};
let keymap = keyconfig.keymap;

$(window).on("keydown", function (event) {
  if (!g.initialized) return;
  if (!player.controls.enabled) return;
  if (event.keyCode == 18) {
    // alt
    event.preventDefault();
  }
  if (event.altKey && event.keyCode == 68) {
    // alt + d
    event.preventDefault();
  }
  if (event.altKey && event.keyCode == 32) {
    // alt + space
    event.preventDefault();
  }
});

var onKeyDown = function (event) {
  if (!g.initialized) return;

  if (!player.controls.enabled || chat.showChatBar) return;

  // GAME CONTROLS
  if (keymap[event.keyCode]) {
    switch (keymap[event.keyCode][0]) {
      case "Attack":
        player.punch();
        break;
      case "Place Block":
        player.place = true;
        player.key.rightClick = Date.now();
        break;
      case "Clip":
        if (player.controls.enabled && player.allowClip) {
          player.clip = !player.clip;
          player.allowClip = false;
        }
        break;
    }
  }
};

var onKeyUp = function (event) {
  if (!g.initialized) return;

  // CREATIVE MENU CONTROLS
  if (event.keyCode == 38) {
    inventory.scroll(1);
    c.canChangeCommand = true;
  } else if (event.keyCode == 40) {
    inventory.scroll(-1);
    c.canChangeCommand = true;
  }

  if (chat.showChatBar) {
    // ARROW KEY CONTROLS
    if (event.keyCode == 38) {
      prevCommand();
    } else if (event.keyCode == 40) {
      nextCommand();
    }

    // Give command hint
    chat.hintText = "";
    let msg = $("#chat-input").val();

    if (player && player.controls.enabled && msg && msg[0] == "/") {
      chat.hintText = "";
      msg = msg.slice(1).removeExtraSpaces().split(" "); // Remove slash and split by spaces
      giveCommandHint(msg, [9].indexOf(event.keyCode) > -1);
    }
  }

  // GAME CONTROLS
  if (keymap[event.keyCode]) {
    switch (keymap[event.keyCode][0]) {
      case "Attack":
        player.click = false;
        player.key.leftClick = 0;
        break;
      case "Place Block":
        player.place = false;
        player.key.rightClick = 0;
        break;
      case "Clip":
        player.allowClip = true;
        break;
    }
  }
};

document.addEventListener("keydown", onKeyDown, false);
document.addEventListener("keyup", onKeyUp, false);

// Inventory search
$(document).on("ready", function () {
  $("#search-input").on("input", function () {
    let search = $(this).val();
    inventory.updateItemSearch(search);
  });
});

keyMap["ShiftLeft"] = "shift";
keyMap["ShiftRight"] = "shift";
keyMap["CtrlLeft"] = "ctrl";
keyMap["CtrlRight"] = "ctrl";
keyMap["AltLeft"] = "alt";
keyMap["AltRight"] = "alt";
keyMap["Tab"] = "tab";
keyMap["Slash"] = "slash";
