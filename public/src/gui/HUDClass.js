import game from '../Game';
import inventory from '../items/Inventory';
import world from '../managers/WorldManager';
import player from '../Player';
import { colorPass } from "../graphics/renderer";

import { g, icons, players } from '../globals';
import { drawRectangle, drawText, round } from '../lib/helper';

// Initiate canvas
let canvas = document.getElementById("canvas-hud");
let ctx = canvas.getContext("2d");

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

class HUD {
    constructor() {
        this.heartT = 0;
        this.heartUp = false;
        this.heartS = 0;
        this.heartShake = new Array(10).fill(0);

        this.showStats = true;
        this.updateInterval = 0;
        this.hudTime = Date.now();

        this.showPlayerTab = false;

        this.crosshairSize = 25;
        this.crosshairWidth = 2;
    }

    resize() {
        let size = game.guiSize;
        if (size == 1) {

        } else if (size == 2) {

        } else if (size == 3) {

        }
        this.iconSize = Math.floor(inventory.selectorWidth * 4 / 12);
        this.yOffset = inventory.selectorWidth + this.iconSize * 1.5;
    }

    // Display player health
    displayHealth() {
        if (!g.initialized) return;

        if (player && player.hp <= 0) { // Player is dead
            drawRectangle(0, 0, canvas.width, canvas.height, "red", { alpha: 0.5 });

            drawText("You Died!", canvas.width / 2, canvas.height / 3, "100px Minecraft-Regular", "white", "center", "middle")
            drawText("Press R to respawn.", canvas.width / 2, canvas.height * 2 / 3, "50px Minecraft-Regular", "white", "center", "middle")
        }

        // Draw player health
        for (let i = 0; i < 10; i++) {
            let yOffset = this.yOffset;

            if (player.hp <= 4) { // Shake health bar
                if (game.tick.value - this.heartS > 1) {
                    this.heartS = game.tick.value;
                    this.heartShake = [];
                    for (let i = 0; i < 10; i++) {
                        this.heartShake.push(Math.random() * 5);
                    }
                }

                yOffset += this.heartShake[i];
            }

            if (this.heartT >= i && this.heartT < i + 1 && this.heartUp) {
                yOffset += 5;
            }

            let xPos = canvas.width / 2 - inventory.hotboxWidth * 4 + i * this.iconSize;
            let yPos = canvas.height - yOffset;
            this.drawHearts(xPos, yPos, player, i);
        }

        // Update heart jump animation
        if (this.heartUp) {
            this.heartT += delta * 20;
            if (this.heartT > 9) {
                this.heartT = 0;
                this.heartUp = false;
            }
        }

    }

    // Draw hunger bar
    displayHunger() {
        for (let i = 0; i < 10; i++) {
            let xPos = canvas.width / 2 + inventory.hotboxWidth * 4 + (i - 10) * this.iconSize;
            let yPos = canvas.height - this.yOffset;
            // Floor xPos and yPos
            xPos = Math.floor(xPos);
            yPos = Math.floor(yPos);

            ctx.drawImage(icons, 16, 27, 9, 9, xPos, yPos, this.iconSize, this.iconSize);

            if ((player.hunger) / 10 > i) {
                ctx.drawImage(icons, 52, 27, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            }
        }
    }

    // Display armor
    displayArmor() {
        if (!player.inventory) return;

        // Calculate armor level
        let defensePoints = 0;
        let armorSlots = player.inventory.slice(inventory.limit);
        let points = {
            "leather": [1, 3, 2, 1],
            "gold": [2, 5, 3, 1],
            "chainmail": [2, 5, 4, 1],
            "iron": [2, 6, 5, 2],
            "diamond": [3, 8, 6, 3],
        }
        for (let i = 0; i < armorSlots.length; i++) {
            let item = armorSlots[i];
            if (item && item.v) {
                let name = world.itemOrder[item.v - 1];
                name = name.substring(0, name.indexOf("_"))
                defensePoints += points[name][i];
            }
        }

        if (defensePoints == 0) return;

        // Draw player armor
        for (let i = 0; i < 10; i++) {

            let xPos = canvas.width / 2 - inventory.hotboxWidth * 4 + i * this.iconSize;
            let yPos = canvas.height - this.yOffset - this.iconSize * 1.3;
            // Floor xPos and yPos
            xPos = Math.floor(xPos);
            yPos = Math.floor(yPos);
            // Draw armor background
            ctx.drawImage(icons, 16, 9, 9, 9, xPos, yPos, this.iconSize, this.iconSize);

            let offset = (defensePoints / 2 - i);
            if (offset >= 1) {
                ctx.drawImage(icons, 34, 9, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            } else if (offset > 0) {
                ctx.drawImage(icons, 25, 9, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            }
        }
    }

    // Display oxygen bar
    displayOxygen() {
        if (!colorPass.enabled) return;

        // Draw air bubbles
        for (let i = 0; i < 10; i++) {
            let xPos = canvas.width / 2 + inventory.hotboxWidth * 4 + (-1 - i) * this.iconSize;
            let yPos = canvas.height - this.yOffset - this.iconSize * 1.3;
            // Floor xPos and yPos
            xPos = Math.floor(xPos);
            yPos = Math.floor(yPos);

            if ((player.oxygen - 2) / 30 > i) {
                ctx.drawImage(icons, 16, 18, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            } else if ((player.oxygen) / 30 > i) {
                ctx.drawImage(icons, 24, 18, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            }
        }
    }

    // Display player tab list
    displayPlayerTab() {
        if (!this.showPlayerTab)
            return;

        let pad = 20;
        let top = 50;
        let width = 300 + this.iconSize * 11;
        let height = (Object.keys(players).length + 1) * 30 + 2 * pad + 20;

        let leftX = canvas.width / 2 - width / 2 + pad;
        let rightX = canvas.width / 2 + width / 2 - pad;
        let topY = top + pad;
        let healthOffset = canvas.width / 2 - this.iconSize * 2;

        // Draw background
        drawRectangle(canvas.width / 2 - width / 2, top, width, height, "black", { alpha: 0.5 });

        // Draw title
        drawText("Username", leftX, topY, "20px Minecraft-Regular", "yellow", "left", "top")
        drawText("Health", healthOffset, topY, "20px Minecraft-Regular", "yellow", "left", "top")
        drawText("Ping", rightX, topY, "20px Minecraft-Regular", "yellow", "right", "top")

        let index = 0;
        for (let id in players) {
            let p = players[id];
            let yPos = topY + 30 * (index + 1);

            // Draw player ping
            let ping = round(p.ping.reduce((a, b) => a + b, 0) / p.ping.length, 0) || "disc";
            drawText(ping, rightX, yPos, "20px Minecraft-Regular", "white", "right", "top")

            // Draw name
            let color = getPlayerColor(p);
            drawText(p.name, leftX, yPos, "20px Minecraft-Regular", color, "left", "top")
            let nameWidth = ctx.measureText(p.name).width;
            if (p.operator) drawText(" [admin]", leftX + nameWidth, yPos, "20px Minecraft-Regular", "red", "left", "top")

            // Draw player health
            for (let i = 0; i < 10; i++) {
                let xPos = healthOffset + (i) * this.iconSize;

                // Draw hearts based on player hp
                this.drawHearts(xPos, yPos, p, i);
            }

            index++;
        }

        let p = player;

        if (!p.ping) return;

        // Draw client name
        let xPos = canvas.width / 2 - width / 2 + pad;
        let yPos = topY + 30 * (index + 1);
        drawText(p.name, xPos, yPos, "20px Minecraft-Regular", getPlayerColor(player), "left", "top")
        let nameWidth = ctx.measureText(p.name).width;
        if (p.operator) drawText(" [admin]", xPos + nameWidth, yPos, "20px Minecraft-Regular", "red", "left", "top")

        // Draw player ping
        let ping = round(p.ping.reduce((a, b) => a + b, 0) / p.ping.length, 0) || "disc";
        drawText(ping, rightX, yPos, "20px Minecraft-Regular", "white", "right", "top")

        // Draw player health
        for (let i = 0; i < 10; i++) {
            let xPos = healthOffset + (i) * this.iconSize;

            // Draw hearts based on player hp
            this.drawHearts(xPos, yPos, p, i);
        }
    }

    drawHearts(xPos, yPos, p, i) {
        // Floor xPos and yPos
        xPos = Math.floor(xPos);
        yPos = Math.floor(yPos);

        // Draw player heart background
        let isLit = game.tick.value % 6 < 3;
        if (isLit && game.tick.value - p.heartBlink < 12) {
            ctx.drawImage(icons, 25, 0, 9, 9, xPos, yPos, this.iconSize, this.iconSize); // Lit background

            // Draw temporary hearts
            if (p.lastHp - i >= 2) {
                ctx.drawImage(icons, 70, 0, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            } else if (p.lastHp - i > 0) {
                ctx.drawImage(icons, 79, 0, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
            }
        } else {
            ctx.drawImage(icons, 16, 0, 9, 9, xPos, yPos, this.iconSize, this.iconSize); // Unlit background
        }

        let offset = (p.hp / 2 - i);
        if (offset >= 1) { // Full heart
            ctx.drawImage(icons, 52, 0, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
        } else if (offset > 0) { // Half heart
            ctx.drawImage(icons, 61, 0, 9, 9, xPos, yPos, this.iconSize, this.iconSize);
        }
    }

    // Display crosshair
    displayCrosshair() {
        if (!g.initialized || player.mode == "camera") return;
        let { crosshairSize, crosshairWidth } = this;

        // Draw crosshair
        ctx.fillRect(canvas.width / 2 - crosshairWidth / 2, canvas.height / 2 - crosshairSize / 2, crosshairWidth, crosshairSize)
        ctx.fillRect(canvas.width / 2 - crosshairSize / 2, canvas.height / 2 - crosshairWidth / 2, crosshairSize, crosshairWidth)
    }

    // Display all
    display() {
        this.displayCrosshair();
        this.displayPlayerTab();

        if (player.mode != "survival") return;
        this.displayHealth(); // TODO: Display death screen in creative mode
        this.displayHunger();
        this.displayArmor();
        this.displayOxygen();
    }
}
const hud = new HUD();
export default hud;
