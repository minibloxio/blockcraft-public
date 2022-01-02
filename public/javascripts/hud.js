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
let chat = new ChatManager();

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
	}
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
	chat.displayChat();
	displayStats();
	inventory.displayInventory();
	displayPlayerTab();
}

window.onresize = function(event) {
    inventory.resize();
};
inventory.resize();