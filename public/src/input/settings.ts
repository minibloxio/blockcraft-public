import * as $ from "jquery";
import Cookies from "js-cookie";
import { keyMap } from "kontra";
import game from "../Game";
import { camera } from "../globals";
import { updateGUISize } from "../lib/helper";
import chunkManager from "../managers/ChunkManager";
import workerManager from "../managers/WorkerManager";
import player from "../Player";
import stage from "../Stage";

const cookieName = "keymappings";
const LONG_TIME = { expires: 100000 };

// mapping of name to internally hard coded key which represents the action
const keyMapping: [string, string][] = [
  ["HEADER", "Movement"],
  ["Jump", "space"],
  ["Sneak", "alt"],
  ["Sprint", "shift"],
  ["Strafe Left", "a"],
  ["Strafe Right", "d"],
  ["Walk Backwards", "s"],
  ["Walk Forwards", "w"],
  // ["HEADER", "Gameplay"],
  // ["Attack/Destroy", ""],
  // ["Pick Bock", ""],
  // ["Use Item/Place Block", ""],
  ["HEADER", "Multiplayer"],
  ["List Players", "tab"],
  ["Open Chat", "enter"],
  ["Open Command", "slash"],
  ["HEADER", "Miscellaneous"],
  ["Take Screenshot", "f2"],
  // ["Toggle Perspective", "WIP"],
  ["Zoom", "x"],
  ["Respawn", "r"],
  ["Debug Info", "f3"],
  ["HEADER", "Inventory"],
  ["Drop Selected Item", "q"],
  ["Open/Close Inventory", "e"],
  ["Hotbar Slot 1", "1"],
  ["Hotbar Slot 2", "2"],
  ["Hotbar Slot 3", "3"],
  ["Hotbar Slot 4", "4"],
  ["Hotbar Slot 5", "5"],
  ["Hotbar Slot 6", "6"],
  ["Hotbar Slot 7", "7"],
  ["Hotbar Slot 8", "8"],
  ["Hotbar Slot 9", "9"],
];

function loadSavedKeymappings() {
  let loadedKeyMap;
  try {
    loadedKeyMap = JSON.parse(Cookies.get(cookieName));
  } catch (e) {
    loadedKeyMap = genDefaultKeyMap();
  }

  // reassign properties since whole object can't be assigned
  for (var x in keyMap) delete keyMap[x];
  Object.assign(keyMap, loadedKeyMap);
}

function saveKeymappings() {
  Cookies.set(cookieName, JSON.stringify(keyMap), LONG_TIME);
}

function keyMapReverseLookup(name: string): string {
  if (!name) return "NONE";
  for (const key in keyMap) {
    if (keyMap[key] === name) return key;
  }
  return "NONE";
}

export function addKeyboardControls() {
  loadSavedKeymappings();
  $("#keyboard-settings").empty();
  $("#keyboard-settings").append('<div id="reset-keyboard">Reset to Default</div>');

  // Add the key binds
  for (const [name, key] of keyMapping) {
    if (name === "HEADER") {
      $("#keyboard-settings").append(`<div id="keyboard-settings-divider">${key}</div>`);
    } else {
      const current = keyMapReverseLookup(key);
      $("#keyboard-settings").append(
        `<div class="key">
          <span>${name}</span>
          <input
            class="change-key ${current === "NONE" ? "keyboard-none" : ""}"
            placeholder="${current}"
            data-keycode="${key}" readonly>
          </div>`
      );
    }
  }

  $(".change-key").on("keydown", function (e) {
    e.preventDefault();
    let internal_key = e.target.getAttribute("data-keycode");
    let key_input = e.code;

    // clear other binds
    for (const key in keyMap) {
      if (keyMap[key] === internal_key) {
        keyMap[key] = null;
      }
    }

    keyMap[key_input] = internal_key;
    saveKeymappings();
    addKeyboardControls();
  });

  $("#reset-keyboard").click(function () {
    Cookies.remove(cookieName);
    addKeyboardControls();
  });
}

function addSliderControl(name, id, defaultValue, object, key, callback?) {
  const val = Cookies.get(name);
  // Sensitivity
  if (val) {
    object[key] = parseFloat(val);
  } else {
    object[key] = defaultValue;
  }
  $("#" + id + "Value").text(name + ": " + object[key]);
  $("#" + id + "Slider")[0].value = object[key];
  $("#" + id + "Slider").off();
  $("#" + id + "Slider").on("change mousemove", function (e) {
    object[key] = $("#" + id + "Slider")[0].value;
    $("#" + id + "Value").text(name + ": " + object[key]);
    Cookies.set(name, object[key], LONG_TIME);
    if (callback) {
      callback();
    }
  });
}

export function addVideoControls() {
  $("#switch-container").empty();
  //addSliderControl("FPS", "fps", 60, game, "fps")
  addSliderControl("Sensitivity", "sensitivity", 50, player, "sens");
  addSliderControl("FOV", "fov", 75, game, "fov");
  addSliderControl("Render Distance", "renderDistance", 8, chunkManager, "renderDistance");
  addSliderControl("Chunk Loading Rate", "chunkLoadingRate", 1, chunkManager, "chunkLoadingRate");
  //addSliderControl("Web Workers", "workers", 2, game, "numOfVoxelWorkers");

  addSwitchControl("Invert Mouse", "invertMouse", false, game, "invertMouse");
  addSwitchControl("Shadow Effect", "shadow", false, stage.dir, "enableShadow", "castShadow");
  addSwitchControl("Clouds", "cloud", false, stage, "showClouds", "generate");
  addSwitchControl("Stars", "stars", true, stage.stars, "visible");
  addSwitchControl("Dynamic FOV", "dynFov", true, camera, "dynFov");
  addSwitchControl("Transparent Leaves", "transparentLeaves", false, game, "transparentLeaves", false, updateTransparency);
  addSwitchControl("Transparent Inventory", "transparentInventory", false, game, "transparentInventory");
  addSwitchControl("Depth Write", "depthWrite", false, game, "depthWrite", false, chunkManager.updateTexture);

  addSelectControl("GUI Size", "guiSize", 2, game, "guiSize", updateGUISize);
  addSelectControl("Material Texture", "texture", "lambert", chunkManager, "texture", chunkManager.updateTexture);
}

function addSwitchControl(name, id, defaultValue, object, key, key2?, callback?) {
  const val = Cookies.get(name);
  if (val) {
    object[key] = val == "true" ? true : false;
    if (key2) object[key2] = object[key];
  } else {
    object[key] = defaultValue;
    if (key2) object[key2] = object[key];
  }

  let switchContainer = $(`
        <div class="control-container switch">
            <span id="${id}Value" class="slider-text">${name}: ON</span>
            <label class="switch-label">
                <input id="${id}Switch" type="checkbox">
                <span class="slider-span"></span>
            </label>
        </div>`);
  $("#switch-container").append(switchContainer);

  $("#" + id + "Value").text(name + ": " + (object[key] ? "ON" : "OFF"));
  $("#" + id + "Switch")[0].checked = object[key] ? true : false;
  $("#" + id + "Switch").off();
  $("#" + id + "Switch").on("change", function () {
    object[key] = $("#" + id + "Switch")[0].checked == "1" ? true : false;
    if (key2) object[key2] = object[key];
    $("#" + id + "Value").text(name + ": " + (object[key] ? "ON" : "OFF"));

    Cookies.set(name, object[key], LONG_TIME);
    if (callback) callback();
  });
}

function addSelectControl(name, id, defaultValue, object, key, callback) {
  const val = Cookies.get(name);
  if (val) {
    object[key] = val;
  } else {
    object[key] = defaultValue;
  }
  $("#" + id + "Select")[0].value = object[key];
  $(document).on("change", "#" + id + "Select", function () {
    object[key] = $("#" + id + "Select")[0].value;
    Cookies.set(name, object[key], LONG_TIME);
    if (callback) callback();
  });
}

$(document).ready(function () {
  $("#reset-video").click(function () {
    let videoCookies = [
      "Sensitivity",
      "Render Distance",
      "Chunk Loading Rate",
      "FOV",
      "Statistics",
      "Shadow Effect",
      "Clouds",
      "Stars",
      "Material Texture",
    ];
    for (let cookie of videoCookies) {
      Cookies.remove(cookie);
    }

    addVideoControls();
  });
});

function updateTransparency() {
  for (let worker of workerManager.voxels) {
    worker.postMessage({
      type: "updateTransparency",
      transparentLeaves: game.transparentLeaves,
    });
  }
  chunkManager.reload();
}

function genDefaultKeyMap() {
  let keyMap = {
    Enter: "enter",
    Escape: "esc",
    Space: "space",
    ArrowLeft: "left",
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ShiftLeft: "shift",
    CtrlLeft: "ctrl",
    AltLeft: "alt",
    Tab: "tab",
    Slash: "slash",
  };
  let i;

  // letters
  for (i = 0; i < 26; i++) {
    keyMap["Key" + String.fromCharCode(i + 65)] = String.fromCharCode(i + 97);
  }

  // numbers
  for (i = 0; i < 10; i++) {
    keyMap["Digit" + i] = "" + i;
  }

  // function keys
  for (i = 1; i <= 12; i++) {
    keyMap["F" + i] = "f" + i;
  }

  return keyMap;
}

globalThis.keyMap = keyMap;
