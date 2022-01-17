import hud from "./HUDClass.js";
import inventory from "../items/Inventory.js";
import chat from "../classes/ChatManager.js";

// Variables
import { g } from '../globals';
import statistics from "../stats/statslist";

// Functions
import { drawText } from '../helper';

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
