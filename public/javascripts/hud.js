// Initiate canvas
let canvas = document.getElementById("canvas-hud");
let ctx = canvas.getContext("2d");

let hud = {
	showStats: true,
	updateInterval: 50,
	hudTime: Date.now(),
}

// Crosshair
let crosshairSize = 25
let crosshairWidth = 2

// Chat
let showChat = true
let showChatFlag = true;
let showChatBar = false;
let hideChatId = undefined;
let chatMsg = "";
let hintText = "";
let maxChatWidth = 600;
let maxChatHeight = Math.min(600, innerHeight - 100);

// Init chat
let chat = [];
let chatTimer;

// Health
let heartSize = 40;
let heartT = 0;
let heartUp = false;

// Inventory
let inventory = new Inventory();

// Player tab
let showPlayerTab = false;

// Crosshair
function displayCrosshair() {
	if (!initialized || player.mode == "camera") return;

	// Draw crosshair
	ctx.fillRect(canvas.width/2-crosshairWidth/2, canvas.height/2-crosshairSize/2, crosshairWidth, crosshairSize)
	ctx.fillRect(canvas.width/2-crosshairSize/2, canvas.height/2-crosshairWidth/2, crosshairSize, crosshairWidth)
}

// Stats
function displayStats() {
	if (hud.showStats) {
		for (let i = 0; i < statistics.length; i++) {
			let stat = statistics[i];
			stat.display(i);
		}
		
		//stats.showPanel(0);
	} else {
		//stats.showPanel();
	}
}

// Add chat message
function addChat(options) {
	if (!options)
		return;

	let timer = Math.max(1000, options.timer || 5000);
	chat.unshift(
		{
			text: options.text,
			color: options.color,
			name: options.name,
			t: Date.now(), // timestamp
			discard: options.discard,
			timer: timer,
		}
	)
	chatTimer = options.timer ? options.timer : undefined;
	if (chatTimer) hideChatTimer(timer);
	if (chat.length > 100) {
		chat.pop();
	}
}

// Initialize chat
function initChat() {
	chat.length = 0;
	chatTimer = undefined;
	

	// WELCOME MESSAGE
	addChat({
		text: "------------------",
		color: "aqua",
		timer: 15000
	})
	addChat({
		text: "Welcome to BlockCraft! This game is still a work in progress, but feel free to play around!",
		color: "yellow",
		timer: 15000
	})
	addChat({
		text: "Type /tutorial for more information on how to play or /help for a list of commands.",
		timer: 15000
	})
	addChat({
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

	addChat({
		text: "Latest updates v" + version + " | " + date + ":",
		color: "yellow",
		timer: 15000
	})

	for (let comment of changes) {

		addChat({
			text: " - " + comment,
			color: "white",
			timer: 15000
		})
	}

	addChat({
		text: "------------------",
		color: "aqua",
		timer: 15000
	})

}

// Hide chat after timer
function hideChatTimer(time) {
	clearTimeout(hideChatId)
	hideChatId = setTimeout(function () {
		chatTimer = 0;
		if (!showChatBar) {
			showChat = false;

			for (let i = chat.length-1; i>=0; i--) {
				if (chat[i].discard) {
					chat.splice(i, 1);
				}
			}
		}
	}, time)
}

// Display chat
function displayChat() {
	if (player.mode == "camera") return;

	let msgHeight = 30;
	let fontSize = msgHeight - 10;
	let yOffset = 100;
	let currHeight = 0;

	ctx.font = fontSize+"px Minecraft-Regular";
	let lines = [];
	for (let i = 0; i < chat.length; i++) {
		let msg = chat[i];
		let elaspedTime = Date.now() - msg.t;
		if (showChatBar || elaspedTime < msg.timer) {
			let text = msg.text;
			let opacity = 1; // Fade out
			if (elaspedTime > msg.timer - 300) {
				opacity = 1 - (elaspedTime - (msg.timer - 300))/300;
			}
			opacity = showChatBar ? 1 : opacity;

			if (msg.name)
				text = "<"+msg.name+"> "+text;
			text = text.substr(0, 1000);
			let newLines = getLines(ctx, text, 580, msg.color || "white", opacity).reverse();
			lines = lines.concat(newLines);
			currHeight += msgHeight*newLines.length;
			if (currHeight > maxChatHeight) break;
		}
	}

	// Draw chat background
	ctx.save();
	drawRectangle(0, canvas.height-yOffset-lines.length*msgHeight, maxChatWidth, lines.length*msgHeight, "black", {alpha: 0.3});
	ctx.clip();

	// Draw chat messages
	for (let i = 0; i < lines.length; i++) {
		drawText(lines[i].text, 10, canvas.height-yOffset-10-i*msgHeight, fontSize+"px Minecraft-Regular", lines[i].color, "start", "alphabetic", lines[i].opacity, 1, true);
	}
	ctx.restore();

	// Draw command hint
	if (hintText && showChatBar) {
		let hintColor = "grey";
		let text = hintText;
		if (hintText[0] == "?") {
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
function getLines(ctx, text, maxWidth, color, opacity) {
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

// Display player health
function displayPlayerHealth() {
	if (!initialized) return;

	if (player && player.hp <= 0) { // Player is dead
		drawRectangle(0, 0, canvas.width, canvas.height, "red", {alpha: 0.5});

		drawText("You Died!", canvas.width/2, canvas.height/3, "100px Minecraft-Regular", "white", "center", "middle")
		drawText("Press R to respawn.", canvas.width/2, canvas.height*2/3, "50px Minecraft-Regular", "white", "center", "middle")
	}

	if (player.mode != "survival") return;

	if (player && player.hp > 0) {
		for (let i = 0; i < 10; i++) {
			let yOffset = 80;
			if (heartT == i && heartUp) {
				yOffset += 5;
			}

			let xPos = canvas.width/2-heartSize*5+i*heartSize;
			let yPos = canvas.height-heartSize-yOffset;

			// Draw hearts based on player hp
			if (player.hp - i >= 1) {
				ctx.drawImage(full_heart, xPos, yPos, heartSize, heartSize)
			} else if (player.hp - i > 0) {
				ctx.drawImage(half_heart, xPos, yPos, heartSize, heartSize)
				isHalf = false;
			} else {
				ctx.drawImage(empty_heart, xPos, yPos, heartSize, heartSize)
			}
		}

		// Update heart jump animation
		if (heartUp) {
			heartT += 1
			if (heartT > 9) {
				heartT = 0;
				heartUp = false;
			}
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

// Display player tab list
function displayPlayerTab() {
	if (!showPlayerTab)
		return;

	let pad = 20;
	let top = 50;
	let heartSize = 20;
	let width = 550;
	let height = (Object.keys(players).length+1)*30+2*pad+20;

	let leftX = canvas.width/2-width/2+pad;
	let rightX = canvas.width/2+heartSize*11;
	let topY = top+pad;

	// Draw background
	drawRectangle(canvas.width/2-width/2, top, width, height, "black", {alpha: 0.5});

	// Draw title
	drawText("Username", leftX, topY, "20px Minecraft-Regular", "yellow", "left", "top")
	drawText("Health", canvas.width/2, topY, "20px Minecraft-Regular", "yellow", "left", "top")
	drawText("Ping", rightX, topY, "20px Minecraft-Regular", "yellow", "left", "top")

	let index = 0;
	for (let id in players) {
		let p = players[id];
		let yPos = topY+30*(index+1);

		// Draw player ping
		let ping = round(p.ping.reduce((a, b) => a + b, 0)/p.ping.length, 0) || "disc";
		drawText(ping, rightX, yPos, "20px Minecraft-Regular", "white", "left", "top")

		// Draw name
		let color = getPlayerColor(p);
		drawText(p.name, leftX, yPos, "20px Minecraft-Regular", color, "left", "top")
		let nameWidth = ctx.measureText(p.name).width;
		if (p.operator) drawText(" [admin]", leftX + nameWidth, yPos, "20px Minecraft-Regular", "red", "left", "top")

		// Draw player health
		for (let i = 0; i < 10; i++) {
			let xPos = canvas.width/2+i*heartSize;

			// Draw hearts based on player hp
			if (p.hp - i >= 1) {
				ctx.drawImage(full_heart, xPos, yPos, heartSize, heartSize)
			} else if (p.hp - i > 0) {
				ctx.drawImage(half_heart, xPos, yPos, heartSize, heartSize)
				isHalf = false;
			} else {
				ctx.drawImage(empty_heart, xPos, yPos, heartSize, heartSize)
			}
		}

		index++;
	}

	let p = player;
	if (!p.ping) return;

	// Draw client name
	let xPos = canvas.width/2-width/2+pad;
	let yPos = topY+30*(index+1);
	drawText(p.name, xPos, yPos, "20px Minecraft-Regular", getPlayerColor(player), "left", "top")
	let nameWidth = ctx.measureText(p.name).width;
	if (p.operator) drawText(" [admin]", xPos + nameWidth, yPos, "20px Minecraft-Regular", "red", "left", "top")

	// Draw player ping
	let ping = round(p.ping.reduce((a, b) => a + b, 0)/p.ping.length, 0) || "disc";
	drawText(ping, rightX, yPos, "20px Minecraft-Regular", "white", "left", "top")

	// Draw player health
	for (let i = 0; i < 10; i++) {
		let xPos = canvas.width/2+i*heartSize;

		// Draw hearts based on player hp
		if (p.hp - i >= 1) {
			ctx.drawImage(full_heart, xPos, yPos, heartSize, heartSize)
		} else if (p.hp - i > 0) {
			ctx.drawImage(half_heart, xPos, yPos, heartSize, heartSize)
			isHalf = false;
		} else {
			ctx.drawImage(empty_heart, xPos, yPos, heartSize, heartSize)
		}
	}
}

function updateHUD() {
	// if (Date.now()-hud.time < hud.updateInterval) return;
	// hud.time = Date.now();

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!initialized) return;
	
	displayCrosshair();
	displayPlayerHealth();
	inventory.displayToolbar();
	displayChat();
	displayStats();
	inventory.displayInventory();
	displayPlayerTab();
}

window.onresize = function(event) {
    inventory.resize();
};
inventory.resize();