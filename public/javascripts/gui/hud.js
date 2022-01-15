import hud from "../classes/HUD.js";
import inventory from "../classes/items/Inventory.js";
import chat from "../classes/ChatManager.js";

import { g } from '../globals';

// Initiate canvas
let canvas = document.getElementById("canvas-hud");
let ctx = canvas.getContext("2d");

// Stats
function displayStats() {
    if (hud.showStats) {
        let index = 0;
        drawText(
            "",
            10, 55,
            "20px Minecraft-Regular", "white", "left", "top"
        );
        for (let i = 0; i < statistics.length; i++) {
            let stat = statistics[i];
            if (stat instanceof Array) {
                let offset = 0;
                for (let j = 0; j < stat.length; j++) {
                    offset += stat[j].display(index, offset);
                }
            } else {
                stat.display(index);
            }
            index += 1;
        }
    }
}

// Get player color
function getPlayerColor(player) {
    let mode = player.mode;
    if (mode == "creative") {
        return "aqua";
    } else if (mode == "survival") {
        return "white";
    } else if (mode == "spectator") {
        return "grey";
    } else if (mode == "camera") {
        return "grey";
    }
}

export function updateHUD() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!g.initialized) return;
    ctx.imageSmoothingEnabled = false;
    hud.display();
    inventory.displayToolbar();
    chat.displayChat();
    displayStats();
    inventory.displayInventory();
}
