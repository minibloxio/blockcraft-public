var canvas = document.getElementById("canvas-hud");
var ctx = canvas.getContext("2d");

// Load static images
var full_heart = new Image()
full_heart.src = "./textures/hearts/full.png";
var half_heart = new Image()
half_heart.src = "./textures/hearts/half.png";
var empty_heart = new Image()
empty_heart.src = "./textures/hearts/empty.png";

// Crosshair
var crosshairSize = 25
var crosshairWidth = 2

// Chat
let showChat = true
let showChatBar = false;
let hideChatId = undefined;
let chatMsg = "";
let chat = [
	{
		text: "Welcome to BlockCraft! This game is still a work in progress, but feel free to play around!",
		t: Date.now()
	}
];

// Health
let heartSize = 40;
let heartT = 0;
let heartUp = false;

// Inventory

function resize() {
	canvas.width = $("html").innerWidth();
	canvas.height = $("html").innerHeight();
}
resize();

function updateHUD() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Draw crosshair
	ctx.fillRect(canvas.width/2-crosshairWidth/2, canvas.height/2-crosshairSize/2, crosshairWidth, crosshairSize)
	ctx.fillRect(canvas.width/2-crosshairSize/2, canvas.height/2-crosshairWidth/2, crosshairSize, crosshairWidth)

	// Display player health
	displayPlayerHealth();
	displayChat();
}

// Stats
var showStats = true;
function displayStats() {
	
}

function addChat(options) {
	if (!options)
		return;

	chat.unshift(
		{
			text: options.text,
			color: options.color,
			name: options.name,
			t: Date.now() // timestamp
		}
	)
	hideChatTimer(options.timer || 5000);
	if (chat.length > 10) {
		chat.pop();
	}
}

function hideChatTimer(time) {
	clearTimeout(hideChatId)
	hideChatId = setTimeout(function () {
		if (!showChatBar)
			showChat = false;
	}, time)
}
hideChatTimer(5000);

function displayChat() {
	let msgHeight = 35;
	let fontSize = msgHeight - 10;
	let yOffset = 100;

	ctx.font = fontSize+"px Minecraft-Regular";
	var lines = [];
	for (let i = 0; i < chat.length; i++) {
		let msg = chat[i];
		if (showChat || Date.now()-msg.t < 5000) {
			let text = msg.text;
			if (msg.name)
				text = "<"+msg.name+"> "+text;
			text = text.substr(0, 100);
			let newLines = getLines(ctx, text, 600, msg.color || "white").reverse();
			lines = lines.concat(newLines);
		}
	}

	// Draw chat background
	ctx.save();
	drawRectangle(0, canvas.height-yOffset-lines.length*msgHeight, 600, lines.length*msgHeight, "black", {alpha: 0.3});
	ctx.clip();

	for (let i = 0; i < lines.length; i++) {
		drawText(lines[i].text, 10, canvas.height-yOffset-10-i*msgHeight, fontSize+"px Minecraft-Regular", lines[i].color, "start", "alphabetic");
	}

	ctx.restore();
}

function getLines(ctx, text, maxWidth, color) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push({
            	text:currentLine,
            	color: color
            });
            currentLine = word;
        }
    }
    lines.push({
    	text:currentLine,
    	color: color
    });
    return lines;
}

function displayPlayerHealth() {
	if (player.hp > 0) {
		for (let i = 0; i < 10; i++) {
			let yOffset = 10;
			if (heartT == i && heartUp) {
				yOffset += 5;
			}

			// Draw hearts based on player hp
			if (player.hp - i >= 1) {
				ctx.drawImage(full_heart, canvas.width/2-heartSize*5+i*heartSize, canvas.height-heartSize-yOffset, heartSize, heartSize)
			} else if (player.hp - i > 0) {
				ctx.drawImage(half_heart, canvas.width/2-heartSize*5+i*heartSize, canvas.height-heartSize-yOffset, heartSize, heartSize)
				isHalf = false;
			} else {
				ctx.drawImage(empty_heart, canvas.width/2-heartSize*5+i*heartSize, canvas.height-heartSize-yOffset, heartSize, heartSize)
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
	} else {
		drawRectangle(0, 0, canvas.width, canvas.height, "red", {alpha: 0.5});

		drawText("You Died!", canvas.width/2, canvas.height/3, "100px Minecraft-Regular", "white", "center", "middle")
		drawText("Press R to respawn.", canvas.width/2, canvas.height*2/3, "50px Minecraft-Regular", "white", "center", "middle")
	}
}

setInterval(function () {
	updateHUD();
}, 50);

window.onresize = function(event) {
    resize();
    updateHUD();
};