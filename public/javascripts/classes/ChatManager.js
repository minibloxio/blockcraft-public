class ChatManager {
    constructor() {
        // Chat
        this.showChat = true
        this.showChatFlag = true;
        this.showChatBar = false;
        this.hideChatId = undefined;
        this.hintText = "";
        this.maxChatWidth = 800;
        this.maxChatHeight = Math.min(600, innerHeight - 100);

        // Init chat
        this.chat = [];
        this.chatTimer = undefined;
    }

    // Add chat message
    addChat(options) {
        if (!options)
            return;

        let timer = Math.max(1000, options.timer || 5000);
        this.chat.unshift(
            {
                text: options.text,
                color: options.color,
                name: options.name,
                t: Date.now(), // timestamp
                discard: options.discard,
                timer: timer,
            }
        )
        this.chatTimer = options.timer ? options.timer : undefined;
        if (this.chatTimer) this.hideChatTimer(timer);
        if (chat.length > 100) {
            chat.pop();
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
            timer: 15000
        })
        this.addChat({
            text: "Welcome to BlockCraft! This game is still a work in progress, but feel free to play around!",
            color: "yellow",
            timer: 15000
        })
        this.addChat({
            text: "Type /tutorial for more information on how to play or /help for a list of commands.",
            timer: 15000
        })
        this.addChat({
            text: "------------------",
            color: "aqua",
            timer: 15000
        })
        
        // LATEST UPDATES
        let change = changelog[0];

        let date = change.date;
        let version = change.version;
        let changes = change.changes.split("|");

        $("#changelog").append($("<br>"));

        this.addChat({
            text: "Latest updates v" + version + " | " + date + ":",
            color: "yellow",
            timer: 15000
        })

        for (let comment of changes) {
            this.addChat({
                text: " - " + comment,
                color: "white",
                timer: 15000
            })
        }

        this.addChat({
            text: "------------------",
            color: "aqua",
            timer: 15000
        })
    }

    // Hide chat after timer
    hideChatTimer(time) {
        clearTimeout(this.hideChatId)
        let self = this;
        this.hideChatId = setTimeout(function () {
            self.chatTimer = 0;
            if (!self.showChatBar) {
                self.showChat = false;

                for (let i = self.chat.length-1; i>=0; i--) {
                    if (self.chat[i].discard) {
                        self.chat.splice(i, 1);
                    }
                }
            }
        }, time)
    }

    // Display chat
    displayChat() {
        if (player.mode == "camera") return;

        let msgHeight = 30;
        let fontSize = msgHeight - 10;
        let yOffset = 100;
        let currHeight = 0;

        ctx.font = fontSize+"px Minecraft-Regular";
        let lines = [];
        for (let i = 0; i < this.chat.length; i++) {
            let msg = this.chat[i];
            let elaspedTime = Date.now() - msg.t;
            if (this.showChatBar || elaspedTime < msg.timer) {
                let text = msg.text;
                let opacity = 1; // Fade out
                if (elaspedTime > msg.timer - 300) {
                    opacity = 1 - (elaspedTime - (msg.timer - 300))/300;
                }
                opacity = this.showChatBar ? 1 : opacity;

                if (msg.name)
                    text = "<"+msg.name+"> "+text;
                text = text.substr(0, 1000);
                let newLines = this.getLines(ctx, text, this.maxChatWidth-20, msg.color || "white", opacity).reverse();
                lines = lines.concat(newLines);
                currHeight += msgHeight*newLines.length;
                if (currHeight > this.maxChatHeight) break;
            }
        }

        // Draw chat background
        ctx.save();
        drawRectangle(0, canvas.height-yOffset-lines.length*msgHeight, this.maxChatWidth, lines.length*msgHeight, "black", {alpha: 0.3});
        ctx.clip();

        // Draw chat messages
        for (let i = 0; i < lines.length; i++) {
            drawText(lines[i].text, 10, canvas.height-yOffset-10-i*msgHeight, fontSize+"px Minecraft-Regular", lines[i].color, "start", "alphabetic", lines[i].opacity, 1, true);
        }
        ctx.restore();

        // Draw command hint
        if (this.hintText && this.showChatBar) {
            let hintColor = "grey";
            let text = this.hintText;
            if (this.hintText[0] == "?") {
                text = text.slice(1);
                hintColor = "red";
            }

            let command = $("#chat-input").val().removeExtraSpaces();
            let commandWidth = ctx.measureText(command).width;
            let hintWidth = ctx.measureText(text).width;
            let width = Math.max(commandWidth, hintWidth);
            
            drawRectangle(5, canvas.height-50-msgHeight+10-5, width + 10, msgHeight, "black", {alpha: 0.7});
            drawText(text, 10, canvas.height-50-5, fontSize+"px Minecraft-Regular", hintColor, "start", "alphabetic");
            drawText(command, 10, canvas.height-50-5, fontSize+"px Minecraft-Regular", "white", "start", "alphabetic");
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
                    text:currentLine,
                    color: color,
                    opacity: opacity
                });
                currentLine = word;
            }
        }
        lines.push({
            text: currentLine,
            color: color,
            opacity: opacity
        });
        return lines;
    }

}