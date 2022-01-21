import changelog from "../../json/changelog.json";
import game from "../Game";
import inventory from "../items/Inventory";
import hud from "../gui/HUD";
import player from "../Player";
import { players, g } from "../globals";
import { drawRectangle, drawText } from "../lib/helper";
import { c, checkCommand } from "../commands";

let canvas = document.getElementById("canvas-hud");
let ctx = canvas.getContext("2d");

class ChatManager {
  constructor() {
    // Chat
    this.showChat = true;
    this.showChatFlag = true;
    this._showChatBar = false;
    this.hideChatId = undefined;
    this.hintText = "";

    // Chat GUI
    this.maxChatWidth = 800;
    this.maxChatHeight = Math.min(600, innerHeight - 100);
    this.msgHeight = 25;
    this.msgOffset = 5;
    this.fontSize = this.msgHeight - this.msgOffset;

    // Init chat
    this.chat = [];
    this.chatTimer = undefined;
  }

  set showChatBar(x) {
    this._showChatBar = x;
    if (x) {
      $("#chat-input").focus();
      $("#chat-input").css({ "background-color": "rgba(0, 0, 0, 0.4)" });
      this.showChat = true;
      this.hintText = "";
    } else {
      $("#chat-input").blur();
      $("#chat-input").css({ "background-color": "rgba(0, 0, 0, 0)" });
      c.commandIndex = -1;
    }
    this.chatChanged();
  }

  get showChatBar() {
    return this._showChatBar;
  }

  // Update GUI size
  resize() {
    let size = game.guiSize;
    this.yOffset = 20 + inventory.selectorWidth + 2 * hud.iconSize;
    if (size == 1) {
      this.maxChatWidth = 500;
      this.maxChatHeight = Math.min(canvas.height - this.yOffset - 100, innerHeight - 100);
      this.msgHeight = 20;
    } else if (size == 2) {
      this.maxChatWidth = 500;
      this.maxChatHeight = Math.min(canvas.height - this.yOffset - 100, innerHeight - 100);
      this.msgHeight = 25;
    } else if (size == 3) {
      this.maxChatWidth = 600;
      this.maxChatHeight = Math.min(canvas.height - this.yOffset - 100, innerHeight - 100);
      this.msgHeight = 30;
    }
    this.fontSize = this.msgHeight - this.msgOffset;
    $("#chat-input").css("font-size", this.fontSize + "px");
    $("#chat-input").css("height", this.msgHeight + "px");
  }

  // Add chat message
  addChat(options) {
    if (!options) return;

    let timer = Math.max(1000, options.timer || 5000);
    this.chat.unshift({
      text: options.text,
      color: options.color,
      name: options.name,
      t: Date.now(), // timestamp
      discard: options.discard,
      timer: timer,
      id: options.id,
    });
    this.chatTimer = options.timer ? options.timer : timer;
    if (this.chatTimer) this.hideChatTimer(timer);
    if (this.chat.length > 100) {
      this.chat.pop();
    }
  }

  // Initialize chat
  initChat() {
    this.chat.length = 0;
    this.chatTimer = undefined;

    // WELCOME MESSAGE
    this.addChat({
      text: "------------------",
      color: "aqua",
      timer: 15000,
    });
    this.addChat({
      text: "Welcome to BlockCraft! This game is still a work in progress, but feel free to play around!",
      color: "yellow",
      timer: 15000,
    });
    this.addChat({
      text: "Type /tutorial for more information on how to play or /help for a list of commands.",
      timer: 15000,
    });
    this.addChat({
      text: "------------------",
      color: "aqua",
      timer: 15000,
    });

    // LATEST UPDATES
    let change = changelog[0];

    let date = change.date;
    let version = change.version;
    let changes = change.changes.split("| ");

    $("#changelog").append($("<br>"));

    this.addChat({
      text: "Latest updates v" + version + " | " + date + ":",
      color: "yellow",
      timer: 15000,
    });

    for (let comment of changes) {
      this.addChat({
        text: " - " + comment,
        color: "white",
        timer: 15000,
      });
    }

    this.addChat({
      text: "------------------",
      color: "aqua",
      timer: 15000,
    });
  }

  // Hide chat after timer
  hideChatTimer(time) {
    clearTimeout(this.hideChatId);
    let self = this;
    this.hideChatId = setTimeout(() => {
      self.chatTimer = 0;
      if (!self.showChatBar) {
        self.showChat = false;

        for (let i = self.chat.length - 1; i >= 0; i--) {
          if (self.chat[i].discard) {
            self.chat.splice(i, 1);
          }
        }
      }
    }, time);
  }

  // Display chat
  displayChat() {
    if (player.mode == "camera") return;

    let currHeight = 0;

    ctx.font = this.fontSize + "px Minecraft-Regular";
    let lines = [];
    for (let i = 0; i < this.chat.length; i++) {
      let msg = this.chat[i];
      let isOperator = (players[msg.id] && players[msg.id].operator) || (msg.id == g.socket.id && player.operator);

      let elaspedTime = Date.now() - msg.t;
      if (this.showChatBar || elaspedTime < msg.timer) {
        let opacity = 1; // Fade out
        if (elaspedTime > msg.timer - 300) {
          opacity = 1 - (elaspedTime - (msg.timer - 300)) / 300;
        }
        opacity = this.showChatBar ? 1 : opacity;

        let text = "";
        if (isOperator && msg.name) {
          text += "<" + msg.name + " [admin]> ";
        } else if (msg.name) {
          text += "<" + msg.name + "> ";
        }

        text += msg.text;
        text = text.substring(0, 1000);
        let newLines = this.getLines(ctx, text, this.maxChatWidth - 20, msg.color || "white", opacity).reverse();
        lines = lines.concat(newLines);
        currHeight += this.msgHeight * newLines.length;
        if (currHeight > this.maxChatHeight) break;
      }
    }

    // Draw chat background
    ctx.save();
    drawRectangle(
      0,
      canvas.height - this.yOffset - lines.length * this.msgHeight,
      this.maxChatWidth,
      lines.length * this.msgHeight,
      "black",
      { alpha: 0.4 }
    );
    ctx.clip();

    // Draw chat messages
    for (let i = 0; i < lines.length; i++) {
      drawText(
        lines[i].text,
        10,
        canvas.height - this.yOffset - this.msgOffset - i * this.msgHeight,
        this.fontSize + "px Minecraft-Regular",
        lines[i].color,
        "start",
        "alphabetic",
        lines[i].opacity,
        true,
        parseInt(game.guiSize) * 1.3
      );
    }
    ctx.restore();

    // Draw command hint
    if (this.hintText && this.showChatBar) {
      let hintColor = "grey";
      let text = this.hintText;
      while (text[0] == "?") {
        // Remove question marks the beginning
        text = text.slice(1);
        hintColor = "red";
      }

      let command = $("#chat-input").val(); //.removeExtraSpaces();
      let commandWidth = ctx.measureText(command).width;
      let hintWidth = ctx.measureText(text).width;
      let width = Math.max(commandWidth, hintWidth);

      drawRectangle(5, canvas.height - this.fontSize - 20 - 5 - this.msgHeight + 10, width + 10, this.msgHeight, "black", { alpha: 0.7 });
      drawText(text, 10, canvas.height - this.fontSize - 20, this.fontSize + "px Minecraft-Regular", hintColor, "start", "alphabetic");
      drawText(command, 10, canvas.height - this.fontSize - 20, this.fontSize + "px Minecraft-Regular", "white", "start", "alphabetic");
    }
  }

  // Get lines of text
  getLines(ctx, text, maxWidth, color, opacity) {
    let words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      let word = words[i];
      let width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push({
          text: currentLine,
          color: color,
          opacity: opacity,
        });
        currentLine = word;
      }
    }
    lines.push({
      text: currentLine,
      color: color,
      opacity: opacity,
    });
    return lines;
  }

  chatChanged() {
    let msg = $("#chat-input").val();
    if (!this.showChatBar && msg) {
      if (msg[0] != "/") {
        // Send message to everyone
        g.socket.emit("message", $("#chat-input").val());
        $("#chat-input").val("");
      } else {
        // Check minecraft command
        if (c.prevCommands[0] != $("#chat-input").val()) {
          c.prevCommands.unshift($("#chat-input").val());
        }
        $("#chat-input").val("");
        msg = msg.slice(1).removeExtraSpaces().split(" "); // Remove slash and split by spaces
        checkCommand(msg);
      }
      c.commandIndex = -1;
    }
  }
}

const chatManager = new ChatManager();
globalThis.chat = chatManager;
export default chatManager;
