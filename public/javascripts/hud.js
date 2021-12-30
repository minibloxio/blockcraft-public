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

// Init chat
let chat = [];
let chatTimer;

// Health
let heartSize = 40;
let heartT = 0;
let heartUp = false;

// Inventory
let showInventory = false;
let blockWidth = 30;
let boxSize = 40;
let hotboxWidth = 60;
let selectorWidth = 65;

let selectedItem = undefined;
let inventory = [];
let craftingGrid = [undefined, undefined, undefined, undefined];
let craftingOutput = undefined;

// Player tab
let showPlayerTab = false;

// Crosshair
function displayCrosshair() {
	if (!initialized || player.mode == "camera") return;

	// Draw crosshair
	ctx.fillRect(canvas.width/2-crosshairWidth/2, canvas.height/2-crosshairSize/2, crosshairWidth, crosshairSize)
	ctx.fillRect(canvas.width/2-crosshairSize/2, canvas.height/2-crosshairWidth/2, crosshairSize, crosshairWidth)
}

// Check if mouse is within item frame
function withinItemFrame(xPos, yPos) {
	return mouse.x > xPos && mouse.x < xPos + boxSize && mouse.y > yPos && mouse.y < yPos + boxSize;
}

// Update item in inventory
function updateItem(block, i, type) {
	if (block == "creative") {
		if (type == "left") { // Left click item
			let entity = {}
			if (i < searchBlocks.length) {
				entity.class = "block";
				entity.c = map[16] ? 64 : 1;

				let block = world.blockId[searchBlocks[i]]; // Get block id
				entity.v = block;
			} else if (i < searchBlocks.length+searchItems.length) {
				entity.class = "item";
				entity.c = map[16] ? 64 : 1;

				let item = world.itemId[searchItems[i-searchBlocks.length]]; // Get item id
				entity.v = item;
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

// Select inventory item
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

// Update item search
let searchBlocks, searchItems;
function updateItemSearch(search) {
	if (!search || search == "") {
		searchBlocks = world.blockOrder;
		searchItems = world.itemOrder;
	} else {
		searchBlocks = [];
		searchItems = [];
		for (let block of world.blockOrder) {
			if (block.search(search) > -1) {
				searchBlocks.push(block);
			}
		}
		for (let item of world.itemOrder) {
			if (item.search(search) > -1) {
				searchItems.push(item);
			}
		}
	}
}

// Display inventory background
function displayInventoryBackground() {
	let width = 480;
	let height = 600;
	let padding = 10;

	$("#search-input").hide();

	drawRectangle(0, 0, canvas.width, canvas.height, "rgba(0, 0, 0, 0.5)")
	drawRect(canvas.width/2, canvas.height/2, width, height, 0, "lightgrey")
	let title = player.mode == "survival" ? "Crafting" : player.mode == "creative" ? "" : "Adventure Mode"
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
		$("#search-input").show();
		$("#search-input").css("top", canvas.height/2-height/2+padding);
		$("#search-input").css("left", canvas.width/2-hotboxWidth*4+padding);
		$("#search-input").css("width", width-2.5*padding);
		
		// Add background boxes
		for (let j = 0; j < 4; j++) {
			for (let i = 0; i < 9; i++) {
				let xPos = canvas.width/2-hotboxWidth*4+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1;
				let yPos = canvas.height/2-boxSize-(j)*hotboxWidth;

				drawRectangle(xPos-5,yPos-5,boxSize,boxSize,"grey")

				// Draw items in inventory
				let index = 0;
				for (let block of searchBlocks || world.blockOrder) {
					if (index >= 36)
						break;

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

				for (let item of searchItems || world.itemOrder) {
					if (index >= 36) break;

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

// Display inventory
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
		
	} else {
		$("#search-input").hide();
	}
}

// Draw item in inventory
function drawItem(xPos, yPos, entity) {
	if (!entity)
		return;
	let index = entity.v-1;
	let atlas = textureManager.getTextureAtlas(entity.class);
	
	ctx.imageSmoothingEnabled = false;
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



// Toolbar
let toolbarX = canvas.width/2-hotboxWidth*4;
let toolbarSelectorX = canvas.width/2-hotboxWidth*3.5-2.5;

// Display toolbar
function displayToolbar() {
	if (!initialized || !player.toolbar) return;
	if (player.mode == "spectator" || player.mode == "camera") return;

	drawImageTopLeft(
		toolbar, 
		toolbarX, 
		canvas.height-hotboxWidth-10, 
		hotboxWidth*8, 
		hotboxWidth
	);
	drawImage(
		toolbar_selector, 
		toolbarSelectorX+(player.currentSlot*hotboxWidth)*(8/9), 
		canvas.height-hotboxWidth/2-10, 
		selectorWidth/2, 
		selectorWidth/2
	);

	for (let i = 0; i < 9; i++) {
		let entity = player.toolbar[i];
		if (showInventory)
			entity = inventory[i];
		if (entity && entity.c > 0) {
			let index = entity.v-1;
			let atlas = textureManager.getTextureAtlas(entity.class);
			ctx.drawImage(atlas, 
				index*16, 0, 16, 16, 
				toolbarX+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1, 
				canvas.height-hotboxWidth+(hotboxWidth-blockWidth)/8, 
				blockWidth, blockWidth
			);
			drawText(entity.c, 
				toolbarX+blockWidth+(hotboxWidth-blockWidth)/2+i*hotboxWidth*8/9.1,
				canvas.height-hotboxWidth+blockWidth+(hotboxWidth-blockWidth)/8, 
				"15px Minecraft-Regular", "white", "right", "bottom"
			);
		}
	}
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

	let msgHeight = 35;
	let fontSize = msgHeight - 10;
	let yOffset = 100;

	let maxHeight = Math.min(500, innerHeight - 100);
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
			currHeight += msgHeight;
			if (currHeight > maxHeight) break;
		}
	}

	// Draw chat background
	ctx.save();
	drawRectangle(0, canvas.height-yOffset-lines.length*msgHeight, 600, lines.length*msgHeight, "black", {alpha: 0.3});
	ctx.clip();

	// Draw chat messages
	for (let i = 0; i < lines.length; i++) {
		drawText(lines[i].text, 10, canvas.height-yOffset-10-i*msgHeight, fontSize+"px Minecraft-Regular", lines[i].color, "start", "alphabetic", lines[i].opacity);
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
	} else {
		drawRectangle(0, 0, canvas.width, canvas.height, "red", {alpha: 0.5});

		drawText("You Died!", canvas.width/2, canvas.height/3, "100px Minecraft-Regular", "white", "center", "middle")
		drawText("Press R to respawn.", canvas.width/2, canvas.height*2/3, "50px Minecraft-Regular", "white", "center", "middle")
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
	if (Date.now()-hud.time < hud.updateInterval) return;
	hud.time = Date.now();

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!initialized) return;
	
	displayCrosshair();
	displayPlayerHealth();
	displayToolbar();
	displayChat();
	displayStats();
	displayInventory();
	displayPlayerTab();
}

window.onresize = function(event) {
    resize();
};

function resize() {
	canvas.width = $("html").innerWidth();
	canvas.height = $("html").innerHeight();

	toolbarX = canvas.width/2-hotboxWidth*4;
	toolbarSelectorX = canvas.width/2-hotboxWidth*3.5-2.5;
}
resize();