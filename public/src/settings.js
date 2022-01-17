import keyconfig from "../json/keymap.json";
import player from "./Player";
import { getCookie, setCookie, deleteCookie } from "./resources/cookie";
import game from "./Game";
import world from "./managers/WorldManager";
import chunkManager from "./managers/ChunkManager";
import workerManager from "./managers/WorkerManager";

import stage from "./Stage";

import hud from "./gui/HUDClass";

import { camera, players } from "./globals";

import { updateGUISize } from "./lib/helper";

import { axesHelper } from "./app";

let keymap = keyconfig.keymap;
let keyorder = keyconfig.keyorder;

// Add keys
let savedKeymap = JSON.stringify(keymap);
let savedKeyorder = JSON.stringify(keyorder);

const cookieExpiryTime = 365; // 1 year

export function addKeyboardControls() {
    $("#keyboard-settings").empty();

    keymap = JSON.parse(savedKeymap);

    // Adjust to cookies
    let adjust = [];
    for (let i = 0; i < keyorder.length; i++) {
        let key = keyorder[i];
        let cookie = getCookie(keymap[key][0]);
        if (cookie) {
            cookie = cookie.split(",");

            delete keymap[key];

            adjust.push(cookie);

            keyorder[i] = cookie[0]
        }
    }

    for (let cookie of adjust) {
        keymap[cookie[0]] = [cookie[1], cookie[2]]
    }

    // Add the key binds
    for (let key of keyorder) {
        let keyHTML = $('<div class="key"><span>' + keymap[key][0] + '</span><input class="change-key" placeholder="' + keymap[key][1] + '" data-keycode="' + key + '" readonly></div>')
        $("#keyboard-settings").append(keyHTML)
        keymap[key][2] = keymap[key][2] != undefined ? keymap[key][2] : true; // Enable
        keymap[key][3] = keyHTML[0]
        keymap[key][3].children[1].savedKey = key;
    }

    $("#keyboard-settings").append('<div id="reset-keyboard">Reset to Default</div>')

    $(".change-key").on('keydown', function (e) {
        if (e.keyCode == 32 || e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 18)
            e.preventDefault();
    })

    $(".change-key").on('keyup', function (e) {
        let old_key = e.target.getAttribute("data-keycode");
        e.target.style.color = "white";
        let action = e.key;
        if (e.key == " ")
            action = "SPACE"

        if (e.keyCode == old_key) {
            keymap[old_key][2] = true;
            e.target.value = action.toUpperCase();
            return;
        }

        if (action == "Escape") {
            e.target.value = "NONE";
            keymap[old_key][2] = false;
            //console.log("Escape")

            setCookie(keymap[old_key][0], [old_key, keymap[old_key][0], keymap[old_key][1]], cookieExpiryTime)
        } else if (keymap[e.keyCode] && keymap[old_key][2]) {
            e.target.value = action.toUpperCase();
            e.target.savedKey = e.keyCode;
            e.target.style.color = "red";
            //console.log("Error")
        } else {
            keymap[old_key][2] = true;
            e.target.setAttribute("data-keycode", e.keyCode);
            Object.defineProperty(keymap, e.keyCode,
                Object.getOwnPropertyDescriptor(keymap, old_key));
            delete keymap[old_key];
            e.target.value = action.toUpperCase();
            e.target.savedKey = e.keyCode;
            //console.log("Replace")

            for (let i = 0; i < keyorder.length; i++) {
                if (keyorder[i] == old_key)
                    keyorder[i] = e.keyCode
            }

            setCookie(keymap[e.keyCode][0], [e.keyCode, keymap[e.keyCode][0], action.toUpperCase()], cookieExpiryTime)
        }

        // Check if key has been cleared up
        for (let key in keymap) {
            let currKey = key;
            let shownKey = keymap[key][3].children[1].savedKey;
            if (shownKey && currKey != shownKey && keymap[shownKey]) {

                if (keymap[shownKey][3].children[1].style.color == "red" || keymap[shownKey][3].children[1].value == "NONE") {

                    let copy = Object.getOwnPropertyDescriptor(keymap, shownKey);
                    Object.defineProperty(keymap, shownKey,
                        Object.getOwnPropertyDescriptor(keymap, currKey));
                    Object.defineProperty(keymap, currKey,
                        copy);
                    keymap[currKey][3].children[1].style.color = "white";
                    keymap[shownKey][3].children[1].style.color = "white";

                    keymap[currKey][3].children[1].savedKey = currKey;
                    keymap[shownKey][3].children[1].savedKey = shownKey;

                    keymap[currKey][3].children[1].setAttribute("data-keycode", currKey);
                    keymap[shownKey][3].children[1].setAttribute("data-keycode", shownKey);

                    setCookie(keymap[currKey][0], [currKey, keymap[currKey][0], keymap[shownKey][1]], cookieExpiryTime)
                    setCookie(keymap[shownKey][0], [shownKey, keymap[shownKey][0], keymap[currKey][1]], cookieExpiryTime)
                }
            }
        }
    })

    $(".change-key").on('blur', function (e) {
        if (e.target.value) {
            e.target.placeholder = e.target.value;
            e.target.value = "";
        }
    })

    $("#reset-keyboard").click(function () {
        for (let key of keyorder) {
            deleteCookie(keymap[key][0])
        }

        keyorder = JSON.parse(savedKeyorder)

        addKeyboardControls();
    })
}

function addSliderControl(name, id, defaultValue, object, key, callback) {

    // Sensitivity
    if (getCookie(name)) {
        object[key] = parseFloat(getCookie(name));
    } else {
        object[key] = defaultValue;
    }
    $("#" + id + "Value").text(name + ": " + object[key]);
    $("#" + id + "Slider")[0].value = object[key]
    $("#" + id + "Slider").off();
    $("#" + id + "Slider").on("change mousemove", function (e) {
        object[key] = $("#" + id + "Slider")[0].value;
        $("#" + id + "Value").text(name + ": " + object[key]);
        setCookie(name, object[key], cookieExpiryTime);
        if (callback) {
            callback();
        }
    })
}

export function addVideoControls() {
    $("#switch-container").empty();
    //addSliderControl("FPS", "fps", 60, game, "fps")
    addSliderControl("Sensitivity", "sensitivity", 50, player, "sens")
    addSliderControl("FOV", "fov", 75, game, "fov");
    addSliderControl("Render Distance", "renderDistance", 8, chunkManager, "renderDistance")
    addSliderControl("Chunk Loading Rate", "chunkLoadingRate", 1, chunkManager, "chunkLoadingRate");
    //addSliderControl("Web Workers", "workers", 2, game, "numOfVoxelWorkers");

    addSwitchControl("Statistics", "stats", false, hud, "showStats");
    addSwitchControl("Invert Mouse", "invertMouse", false, game, "invertMouse");
    addSwitchControl("Shadow Effect", "shadow", false, stage.dir, "enableShadow", "castShadow");
    addSwitchControl("Clouds", "cloud", false, stage, "showClouds", "generate");
    addSwitchControl("Stars", "stars", true, stage.stars, "visible");
    addSwitchControl("Dynamic FOV", "dynFov", true, camera, "dynFov");
    addSwitchControl("Transparent Leaves", "transparentLeaves", false, game, "transparentLeaves", false, updateTransparency);
    addSwitchControl("Depth Write", "depthWrite", false, game, "depthWrite", false, chunkManager.updateTexture);
    addSwitchControl("Debug", "debug", false, game, "debug", false, updateDebug);

    addSelectControl("GUI Size", "guiSize", 2, game, "guiSize", updateGUISize);
    addSelectControl("Material Texture", "texture", "lambert", chunkManager, "texture", chunkManager.updateTexture);
}

function addSwitchControl(name, id, defaultValue, object, key, key2, callback) {
    if (getCookie(name)) {
        object[key] = getCookie(name) == "true" ? true : false;
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
        if (key2)
            object[key2] = object[key];
        $("#" + id + "Value").text(name + ": " + (object[key] ? "ON" : "OFF"));

        setCookie(name, object[key], cookieExpiryTime);
        if (callback) callback();
    })
}

function addSelectControl(name, id, defaultValue, object, key, callback) {
    if (getCookie(name)) {
        object[key] = getCookie(name);
    } else {
        object[key] = defaultValue;
    }
    $("#" + id + "Select")[0].value = object[key];
    $(document).on('change', "#" + id + "Select", function () {
        object[key] = $("#" + id + "Select")[0].value;
        setCookie(name, object[key], cookieExpiryTime);
        if (callback) callback();
    });
}

$(document).ready(function () {

    $("#reset-video").click(function () {
        let videoCookies = ["Sensitivity", "Render Distance", "Chunk Loading Rate", "FOV", "Statistics", "Shadow Effect", "Clouds", "Stars", "Material Texture"];
        for (let cookie of videoCookies) {
            deleteCookie(cookie)
        }

        addVideoControls();
    })
})

function updateTransparency() {
    for (let worker of workerManager.voxels) {
        worker.postMessage({
            type: "updateTransparency",
            transparentLeaves: game.transparentLeaves
        });
    }
    chunkManager.reload();
}

function updateDebug() {
    for (let id in players) {
        let player = players[id];
        player.bbox.visible = game.debug;
    }

    for (let id in world.entities) {
        let entity = world.entities[id];
        entity.bbox.visible = game.debug;
    }

    axesHelper.visible = game.debug;

    for (let id in chunkManager.debugLines) {
        let line = chunkManager.debugLines[id];
        line.visible = game.debug;
    }
}
