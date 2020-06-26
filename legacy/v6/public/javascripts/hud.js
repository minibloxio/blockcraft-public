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

// Health
let heartSize = 40;
var heartT = 0;
var heartUp = false;

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
	if (player.hp > 0) {
		for (let i = 0; i < 10; i++) {
			let yOffset = 10;
			if (heartT == i && heartUp) {
				yOffset += 5;
			}
			if (player.hp - i >= 1) {
				ctx.drawImage(full_heart, canvas.width/2-heartSize*5+i*heartSize, canvas.height-heartSize-yOffset, heartSize, heartSize)
			} else if (player.hp - i > 0) {
				ctx.drawImage(half_heart, canvas.width/2-heartSize*5+i*heartSize, canvas.height-heartSize-yOffset, heartSize, heartSize)
				isHalf = false;
			} else {
				ctx.drawImage(empty_heart, canvas.width/2-heartSize*5+i*heartSize, canvas.height-heartSize-yOffset, heartSize, heartSize)
			}

			
		}
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