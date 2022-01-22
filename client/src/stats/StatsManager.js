import { drawRectangle, drawText, round } from "../lib/helper";
import hud from "../gui/HUD";
import game from "../Game";

let canvas = document.getElementById("canvas-hud");
let ctx = canvas.getContext("2d");

const marginTop = 105;

export class Stat {
  constructor(name, value, key, round, func) {
    this.name = name;
    this.value = value;

    this.key = key;
    this.round = round;

    this.func = func;
    this.array = [];
  }

  getText() {
    let text = this.name + ": ";
    let val = this.value;
    let dp = this.round || 0; // Decimal place

    if (typeof val === "function") {
      let a = val(this.func);
      if (typeof a == "number") {
        this.array.push(a);
        if (this.array.length > 50) this.array.shift();
        text += round(this.array.average(), dp).toFixed(dp) + (this.key || "");
      } else {
        text += a;
      }
    } else {
      if (typeof this.func === "function" && this.key) {
        val = this.func(this.value[this.key]);
      } else if (typeof this.func === "function") {
        val = this.func(this.value);
      }

      if (this.key) {
        let type = typeof val[this.key];
        val = val[this.key];
        if (type == "boolean") text += val;
        else if (type == "string") text += val;
        else text += round(val, dp).toFixed(dp);
      } else if (val instanceof Object) {
        text += "x: " + round(val.x, dp).toFixed(dp) + " y: " + round(val.y, dp).toFixed(dp) + " z: " + round(val.z, dp).toFixed(dp);
      } else if (val instanceof Array) {
        text += round(this.value.reduce((a, b) => a + b, 0) / this.value.length, dp).toFixed(dp);
      }
    }

    return text;
  }

  display(index, offset = 0) {
    let text = this.getText();

    let fontSize = 20;
    switch (game.guiSize) {
      case "1":
        fontSize = 15;
        break;
      case "2":
        fontSize = 20;
        break;
      case "3":
        fontSize = 25;
        break;
    }
    let margin = 5;
    let width = ctx.measureText(text).width + margin * 2;
    drawRectangle(10 - margin + offset, index * fontSize + marginTop, width, fontSize, "black", { alpha: 0.2 });
    drawText(text, 10 + offset, index * fontSize + marginTop, fontSize + "px Minecraft-Regular", "white", "left", "top");

    return width;
  }
}

class StatsManager {
  constructor() {
    this.stats = [];
  }

  addStat(stat) {
    this.stats.push(stat);
  }

  displayStats() {
    if (!hud.showStats) return;

    let index = 0;
    for (let i = 0; i < this.stats.length; i++) {
      let stat = this.stats[i];
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

const statsManager = new StatsManager();
export { statsManager };
