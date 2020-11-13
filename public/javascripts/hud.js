var canvas = document.getElementById("canvas-hud");
var ctx = canvas.getContext("2d");

// Load static images
var full_heart = new Image()
full_heart.src = "./textures/hearts/full.png";
var half_heart = new Image()
half_heart.src = "./textures/hearts/half.png";
var empty_heart = new Image()
empty_heart.src = "./textures/hearts/empty.png";

var toolbar = new Image();
toolbar.src = "./textures/hotbar.png";
var toolbar_selector = new Image();
toolbar_selector.src = "./textures/hotbar-selector.png";

let blockTextures = [];

// Crosshair
var crosshairSize = 25
var crosshairWidth = 2

// Chat
let showChat = true
let showChatFlag = true;
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
let showInventory = false;
let blockWidth = 30;
let boxSize = 40;
let hotboxWidth = 60;

let selectedItem = undefined;
let inventory = [];
let craftingGrid = [undefined, undefined, undefined, undefined];
let craftingOutput = undefined;

// Player tab
let showPlayerTab = false;

function withinItemFrame(xPos, yPos) {
	return mouse.x > xPos && mouse.x < xPos + boxSize && mouse.y > yPos && mouse.y < yPos + boxSize;
}

function updateItem(block, i, type) {
	if (block == "creative") {
		if (type == "left") { // Left click item
			let entity = {}
			if (i < world.blockOrder.length) {
				entity.class = "block";
				entity.c = map[16] ? 64 : 1;
				entity.v = i+1;
			} else if (i < world.blockOrder.length+world.itemOrder.length) {
				entity.class = "item";
				entity.c = map[16] ? 64 : 1;
				entity.v = i-world.blockOrder.length+1;
			}
			if (selectedItem == undefined ) {
				// Pick up item
				selectedItem = JSON.parse(JSON.stringify(entity));
			} else if (selectedItem && selectedItem.c > 0) {
				// Switch or combine
				if (selectedItem.v == entity.v) {
					selectedItem.c += 1;
				} else {
					selectedItem = undefined;
				}
			}
		} else if (type == "right") { // Right click item
			if (selectedItem == undefined && block[i] && block[i].c > 0) {
				// Split item stack
				selectedItem = {
					v: block[i].v,
					c: Math.ceil(block[i].c/2),
					class: block[i].class
				};
				block[i].c -= Math.ceil(block[i].c/2);
			} else if (selectedItem && selectedItem.c > 0 && (!block[i] || block[i].c == 0)) {
				// Drop 1 item
				block[i] = {
					v: selectedItem.v, 
					c: 1,
					class: selectedItem.class
				};
				selectedItem.c -= 1;
			} else if (selectedItem && selectedItem.c > 0 && block[i] && block[i].c > 0) {
				// Switch or combine
				if (block[i].v == selectedItem.v) {
					block[i].c += 1;
					selectedItem.c -= 1;
				} else {
					let prevBlock = JSON.parse(JSON.stringify(block[i]));
					block[i] = JSON.parse(JSON.stringify(selectedItem));
					selectedItem = prevBlock;
				}
			}
		}
	} else {
		if (type == "left") { // Left click item
			if (selectedItem == undefined && block[i] && block[i].c > 0) {
				// Pick up item
				selectedItem = JSON.parse(JSON.stringify(block[i]));
				block[i] = undefined;
			} else if (selectedItem && selectedItem.c > 0 && (!block[i] || block[i].c == 0)) {
				// Drop item
				block[i] = JSON.parse(JSON.stringify(selectedItem));
				selectedItem = undefined;
			} else if (selectedItem && selectedItem.c > 0 && block[i] && block[i].c > 0 ) {
				// Switch or combine
				if (block[i].v == selectedItem.v) {
					block[i].c += selectedItem.c;
					selectedItem = undefined;
				} else {
					let prevBlock = JSON.parse(JSON.stringify(block[i]));
					block[i] = JSON.parse(JSON.stringify(selectedItem));
					selectedItem = prevBlock;
				}
			}
		} else if (type == "right") { // Right click item
			if (selectedItem == undefined && block[i] && block[i].c > 0) {
				// Split item stack
				selectedItem = {
					v: block[i].v,
					c: Math.ceil(block[i].c/2),
					class: block[i].class
				};
				block[i].c -= Math.ceil(block[i].c/2);
			} else if (selectedItem && selectedItem.c > 0 && (!block[i] || block[i].c == 0)) {
				// Drop 1 item
				block[i] = {
					v: selectedItem.v, 
					c: 1,
					class: selectedItem.class
				};
				selectedItem.c -= 1;
			} else if (selectedItem && selectedItem.c > 0 && block[i] && block[i].c > 0) {
				// Switch or combine
				if (block[i].v == selectedItem.v) {
					block[i].c += 1;
					selectedItem.c -= 1;
				} else {
					let prevBlock = JSON.parse(JSON.stringify(block[i]));
					block[i] = JSON.parse(JSON.stringify(selectedItem));
					selectedItem = prevBlock;
				}
			}
		} else if (type == "double") { // Double click item
			if (!block[i])
				return;

			// Collect same item type
			let total = block[i].c;
			for (let j = 0; j < block.length; j++) {
				if (block[j] && block[j].v == block[i].v && i != j) {
					total += block[j].c;
					block[j] = undefined;
				}
			}
			for (let j = 0; j < craftingGrid.length; j++) {
				if (craftingGrid[j] && craftingGrid[j].v == block[i].v && i != j) {
					total += craftingGrid[j].c;
					craftingGrid[j] = undefined;
				}
			}

			selectedItem = {
				v: block[i].v, 
				c: total,
				class: block[i].class
			}
			block[i] = undefined;
		}

		if (selectedItem && selectedItem.c == 0) {
			selectedItem = undefined;
		}
	}
}

function selectInventory(type) {
	let width = 480;
	let height = 600;
	for (let i = 0; i < 36; i++) {
		let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+(i%9)*hotboxWidth*8/9.1;
		let yPos = canvas.height/2+height/2-boxSize;

		if (i > 8) {
			yPos = canvas.height/2+height/2-boxSize*5.5+hotboxWidth*Math.floor((i-9)/9);
		}

		if (withinItemFrame(xPos, yPos))
			updateItem(inventory, i, type);
	}

	if (player.mode == "survival") {
		for (let j = 0; j < 2; j++) {
			for (let i = 0; i < 2; i++) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1+hotboxWidth*2;
				let yPos = canvas.height/2+height/2-boxSize*10-1*hotboxWidth+(j)*hotboxWidth;

				if (withinItemFrame(xPos, yPos))
					updateItem(craftingGrid, i+j*2, type);
			}
		}

		let block = craftingOutput;
		let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+hotboxWidth*5;
		let yPos = canvas.height/2+height/2-boxSize*10-hotboxWidth*0.5;

		if (withinItemFrame(xPos, yPos)) {
			if (selectedItem == undefined && block && block.c > 0) {
				selectedItem = JSON.parse(JSON.stringify(block));
				craftingOutput = undefined;
				updateCraftingOutput(true);
			} else if (selectedItem && selectedItem.c > 0 && block && block.c > 0) {
				// Switch or combine
				if (block.v == selectedItem.v) {
					selectedItem.c += block.c;
					updateCraftingOutput(true);
				}
			}
		}

		updateCraftingOutput();
	} else if (player.mode == "creative") {
		// Add background boxes
		for (let j = 0; j < 4; j++) {
			for (let i = 0; i < 9; i++) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1;
				let yPos = canvas.height/2-boxSize-(j)*hotboxWidth;

				if (withinItemFrame(xPos, yPos)) {
					updateItem("creative", i+(3-j)*9, type);
				}
			}
		}
	}
}

function updateCraftingOutput(remove) {
	let grid = [undefined, undefined, undefined, undefined];
	for (let i = 0; i < craftingGrid.length; i++) {
		if (craftingGrid[i])
			grid[i] = craftingGrid[i].v;
	}

	craftingOutput = undefined;
	for (let r of recipes) {
		if (r.check(grid)) {
			if (remove) {
				for (let i = 0; i < craftingGrid.length; i++) {
					if (craftingGrid[i] && craftingGrid[i].v == r.grid[i]) {
						craftingGrid[i].c -= 1;
						if (craftingGrid[i].c == 0)
							craftingGrid[i] = undefined
					}
				}
			} else {
				craftingOutput = JSON.parse(JSON.stringify(r.output));
			}
			return;
		}
	}
}

function displayInventoryBackground() {
	let width = 480;
	let height = 600;
	let padding = 10;

	drawRectangle(0, 0, canvas.width, canvas.height, "rgba(0, 0, 0, 0.5)")
	drawRect(canvas.width/2, canvas.height/2, width, height, 0, "lightgrey")
	let title = player.mode == "survival" ? "Crafting" : player.mode == "creative" ? "Block selection" : "Adventure Mode"
	drawText(title, canvas.width/2, canvas.height/2-height/2+padding, "25px Minecraft-Regular", "grey", "center", "top")

	// Add background boxes
	for (let j = 0; j < 4; j++) {
		for (let i = 0; i < 9; i++) {
			let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1;
			let yPos = canvas.height/2+height/2-boxSize-(j)*hotboxWidth;

			drawRectangle(xPos-5,yPos-5,boxSize,boxSize,"grey")
		}
	}
	
	if (player.mode == "survival") { // SURVIVAL MODE
		// Add background boxes
		for (let j = 0; j < 4; j++) {
			for (let i = 0; i < 9; i++) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1;
				let yPos = canvas.height/2+height/2-boxSize-(j)*hotboxWidth;

				drawRectangle(xPos-5,yPos-5,boxSize,boxSize,"grey")
			}
		}
		for (let j = 0; j < 2; j++) {
			for (let i = 0; i < 2; i++) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1+hotboxWidth*2;
				let yPos = canvas.height/2+height/2-boxSize*10-(j)*hotboxWidth;

				drawRectangle(xPos-5,yPos-5,boxSize,boxSize,"grey")
			}
		}

		let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+hotboxWidth*5;
		let yPos = canvas.height/2+height/2-boxSize*10-hotboxWidth*0.5;

		drawRectangle(
			xPos-5,
			yPos-5,
			boxSize,
			boxSize,
			"grey"
		)
		drawItem(xPos, yPos, craftingOutput);
	} else if (player.mode == "creative") { // CREATIVE MODE
		// Add background boxes
		for (let j = 0; j < 4; j++) {
			for (let i = 0; i < 9; i++) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1;
				let yPos = canvas.height/2-boxSize-(j)*hotboxWidth;

				drawRectangle(xPos-5,yPos-5,boxSize,boxSize,"grey")

				// Draw items in inventory
				let index = 0;
				for (let block of world.blockOrder) {
					let voxel = world.blockId[block];
					if (voxel) {
						let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+(index%9)*hotboxWidth*8/9.1;
						let yPos = canvas.height/2-boxSize*4+hotboxWidth*Math.floor((index-9)/9);

						drawItem(xPos, yPos, {
							v: voxel,
							c: "∞",
							class: "block"
						});
					}
					index++;
				}

				for (let item of world.itemOrder) {
					let voxel = world.itemId[item];
					if (voxel) {
						let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+(index%9)*hotboxWidth*8/9.1;
						let yPos = canvas.height/2-boxSize*4+hotboxWidth*Math.floor((index-9)/9);

						drawItem(xPos, yPos, {
							v: voxel,
							c: "∞",
							class: "item"
						});
					}
					index++;
				}
			}
		}
	}
}

function displayInventory() {
	if (showInventory) {
		displayInventoryBackground();
		let width = 480;
		let height = 600;
		let padding = 10;

		// Draw items in crafting grid
		for (let j = 0; j < 2; j++) {
			for (let i = 0; i < 2; i++) {
				let block = craftingGrid[i+j*2];

				if (!block || block.c == 0)
					continue;

				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1+hotboxWidth*2;
				let yPos = canvas.height/2+height/2-boxSize*10-1*hotboxWidth+(j)*hotboxWidth;

				drawItem(xPos, yPos, block);
			}
		}

		// Draw items in inventory
		for (let i = 0; i < inventory.length; i++) {
			let block = inventory[i];
			if (block && block.c > 0) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+(i%9)*hotboxWidth*8/9.1;
				let yPos = canvas.height/2+height/2-boxSize;
				if (i > 8) {
					yPos = canvas.height/2+height/2-boxSize*5.5+hotboxWidth*Math.floor((i-9)/9);
				}

				drawItem(xPos, yPos, block);
			}
		}

		// Draw selected item
		if (selectedItem && selectedItem.c > 0) {
			drawItem(mouse.x, mouse.y, selectedItem)
		}
		
	}
}

function drawItem(xPos, yPos, entity) {
	if (!entity)
		return;
	let index = entity.v-1;
	let atlas = entity.class == "item" ? item_atlas : texture_atlas;
	ctx.drawImage(atlas, index*16, 0, 16, 16, 
		xPos, 
		yPos, 
		blockWidth, blockWidth
	);
	drawText(entity.c, 
		xPos+blockWidth,
		yPos+blockWidth, 
		"15px Minecraft-Regular", "white", "right", "bottom"
	);
}

// Crosshair
function displayCrosshair() {
	// Draw crosshair
	ctx.fillRect(canvas.width/2-crosshairWidth/2, canvas.height/2-crosshairSize/2, crosshairWidth, crosshairSize)
	ctx.fillRect(canvas.width/2-crosshairSize/2, canvas.height/2-crosshairWidth/2, crosshairSize, crosshairWidth)
}

// Toolbar
function displayToolbar() {
	if (!player.toolbar)
		return;
	let hotboxWidth = 60;
	let selectorWidth = 65;
	drawImageTopLeft(toolbar, canvas.width/2-hotboxWidth*4, canvas.height-hotboxWidth-10, hotboxWidth*8, hotboxWidth);
	drawImage(toolbar_selector, canvas.width/2-hotboxWidth*3.5-2.5+(player.currentSlot*hotboxWidth)*(8/9), canvas.height-hotboxWidth/2-10, selectorWidth/2, selectorWidth/2)

	let blockWidth = 30;
	for (let i = 0; i < 9; i++) {
		let entity = player.toolbar[i];
		if (showInventory)
			entity = inventory[i];
		if (entity && entity.c > 0) {
			let index = entity.v-1;
			let atlas = entity.class == "item" ? item_atlas : texture_atlas;
			ctx.drawImage(atlas, index*16, 0, 16, 16, 
				canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1, 
				canvas.height-hotboxWidth+(hotboxWidth-blockWidth)/8, 
				blockWidth, blockWidth
			);
			drawText(entity.c, 
				canvas.width/2-hotboxWidth*4+blockWidth+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1,
				canvas.height-hotboxWidth+blockWidth+(hotboxWidth-blockWidth)/8, 
				"15px Minecraft-Regular", "white", "right", "bottom"
			);
		}
	}
}

// Stats
let hud = {
	showStats: true
}
function displayStats() {
	if (hud.showStats) {
		for (var i = 0; i < statistics.length; i++) {
			let stat = statistics[i];
			stat.display(i);
		}
	}
}

function addChat(options) {
	if (!options)
		return;

	chat.unshift(
		{
			text: options.text,
			color: options.color,
			name: options.name,
			t: Date.now(), // timestamp
			discard: options.discard
		}
	)
	hideChatTimer(options.timer || 5000);
	if (chat.length > 100) {
		chat.pop();
	}
}

function hideChatTimer(time) {
	clearTimeout(hideChatId)
	hideChatId = setTimeout(function () {
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
    	text: currentLine,
    	color: color
    });
    return lines;
}

function displayPlayerHealth() {
	if (player.mode == "creative")
		return;

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
	} else {
		drawRectangle(0, 0, canvas.width, canvas.height, "red", {alpha: 0.5});

		drawText("You Died!", canvas.width/2, canvas.height/3, "100px Minecraft-Regular", "white", "center", "middle")
		drawText("Press R to respawn.", canvas.width/2, canvas.height*2/3, "50px Minecraft-Regular", "white", "center", "middle")
	}
}

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
		drawText(p.name, leftX, yPos, "20px Minecraft-Regular", "white", "left", "top")

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
	// Draw client name
	let xPos = canvas.width/2-width/2+pad;
	let yPos = topY+30*(index+1);
	drawText(p.name, xPos, yPos, "20px Minecraft-Regular", "white", "left", "top")

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

function drawPlayerTabHealth() {

}

function updateHUD() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	displayCrosshair();
	displayPlayerHealth();
	displayToolbar();
	displayChat();
	displayStats();
	displayInventory();
	displayPlayerTab();
}

setInterval(function () {
	if (initialized)
		updateHUD();
}, 40);

window.onresize = function(event) {
    resize();
    updateHUD();
};

function resize() {
	canvas.width = $("html").innerWidth();
	canvas.height = $("html").innerHeight();
}
resize();