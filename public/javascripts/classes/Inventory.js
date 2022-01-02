class Inventory {
    constructor() {
        // Inventory
        this.showInventory = false;
        this.canShowInventory = true;
        this.blockWidth = 39;
        this.boxSize = 48;
        this.hotboxWidth = 60;
        this.selectorWidth = 65;
        this.boxRatio = 8/9.1;
        this.margin = 5;

        this.width = 480;
        this.height = 600;

        this.selectedItem = undefined;
        this.searchBlocks = undefined;
        this.searchItems = undefined;
        this.currentRow = 0;
        this.inventory = [];
        this.craftingGrid = [];
        this.craftingTableGrid = [];
        this.craftingOutput = undefined;

        // Toolbar
        this.toolbarX = this.halfW-this.hotboxWidth*4;
        this.toolbarSelectorX = this.halfW-this.hotboxWidth*3.5-2.5;
    }

    // Resize inventory
    resize() {
        let {hotboxWidth} = this;

        canvas.width = $("html").innerWidth();
        canvas.height = $("html").innerHeight();

        this.halfW = canvas.width/2;
        this.halfH = canvas.height/2;

        this.toolbarX = this.halfW-hotboxWidth*4;
        this.toolbarSelectorX = this.halfW-hotboxWidth*3.5-2.5;
    }

    // Update crafting output
    updateCraftingOutput(remove) {
        let {craftingGrid, craftingTableGrid, showCraftingTable} = this;
        
        let grid = [undefined, undefined, undefined, undefined];

        if (showCraftingTable) {
            for (let i = 0; i < craftingTableGrid.length; i++) {
                if (craftingTableGrid[i])
                    grid[i] = craftingTableGrid[i].v;
            }
        } else {
            for (let i = 0; i < craftingGrid.length; i++) {
                if (craftingGrid[i])
                    grid[i] = craftingGrid[i].v;
            }
        }

        this.craftingOutput = undefined;
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
                    this.craftingOutput = JSON.parse(JSON.stringify(r.output));
                }
                return;
            }
        }
    }

    // Check if mouse is within inventory
    withinInventory() {
        let {width, height, halfW, halfH} = this;

        return mouse.x > halfW - width/2 && mouse.x < halfW + width/2 && mouse.y > halfH - height/2 && mouse.y < halfH + height/2;
    }

    // Check if mouse is within item frame
    withinItemFrame(xPos, yPos, inInventory) {
        let {boxSize} = this;

        xPos -= this.margin;
        yPos -= this.margin;
        return mouse.x > xPos && mouse.x < xPos + boxSize && mouse.y > yPos && mouse.y < yPos + boxSize;
    }

    // Update item in inventory
    updateItem(block, i, type) {
        let {searchBlocks, searchItems, craftingGrid, currentRow} = this;

        if (block == "creative") { // CREATIVE MODE
            i = i + currentRow*9;
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
                if (this.selectedItem == undefined ) {
                    // Pick up item
                    this.selectedItem = JSON.parse(JSON.stringify(entity));
                } else if (this.selectedItem && this.selectedItem.c > 0) {
                    // Switch or combine
                    if (this.selectedItem.v == entity.v) {
                        this.selectedItem.c += 1;
                    } else {
                        this.selectedItem = undefined;
                    }
                }
            } else if (type == "right") { // Right click item
                if (this.selectedItem == undefined && block[i] && block[i].c > 0) {
                    // Split item stack
                    this.selectedItem = {
                        v: block[i].v,
                        c: Math.ceil(block[i].c/2),
                        class: block[i].class
                    };
                    block[i].c -= Math.ceil(block[i].c/2);
                } else if (this.selectedItem && this.selectedItem.c > 0 && (!block[i] || block[i].c == 0)) {
                    // Drop 1 item
                    block[i] = {
                        v: this.selectedItem.v, 
                        c: 1,
                        class: this.selectedItem.class
                    };
                    this.selectedItem.c -= 1;
                } else if (this.selectedItem && this.selectedItem.c > 0 && block[i] && block[i].c > 0) {
                    // Switch or combine
                    if (block[i].v == this.selectedItem.v) {
                        block[i].c += 1;
                        this.selectedItem.c -= 1;
                    } else {
                        let prevBlock = JSON.parse(JSON.stringify(block[i]));
                        block[i] = JSON.parse(JSON.stringify(this.selectedItem));
                        this.selectedItem = prevBlock;
                    }
                }
            } else if (type == "hover") {
                let name = "";
                let entity = {};
                if (i < searchBlocks.length) {
                    name = searchBlocks[i];
                    entity.v = world.blockId[name];
                    entity.class = "block";
                } else if (i < searchBlocks.length+searchItems.length) {
                    name = searchItems[i-searchBlocks.length]; 
                    entity.v = world.itemId[name];
                    entity.class = "item";
                }
                
                this.drawHoverBox(name, entity);
            }
        } else {
            if (type == "left") { // Left click item
                if (this.selectedItem == undefined && block[i] && block[i].c > 0) {
                    // Pick up item
                    this.selectedItem = JSON.parse(JSON.stringify(block[i]));
                    block[i] = undefined;
                } else if (this.selectedItem && this.selectedItem.c > 0 && (!block[i] || block[i].c == 0)) {
                    // Drop item
                    block[i] = JSON.parse(JSON.stringify(this.selectedItem));
                    this.selectedItem = undefined;
                } else if (this.selectedItem && this.selectedItem.c > 0 && block[i] && block[i].c > 0 ) {
                    // Switch or combine
                    if (block[i].v == this.selectedItem.v) {
                        block[i].c += this.selectedItem.c;
                        this.selectedItem = undefined;
                    } else {
                        let prevBlock = JSON.parse(JSON.stringify(block[i]));
                        block[i] = JSON.parse(JSON.stringify(this.selectedItem));
                        this.selectedItem = prevBlock;
                    }
                }
            } else if (type == "right") { // Right click item
                if (this.selectedItem == undefined && block[i] && block[i].c > 0) {
                    // Split item stack
                    this.selectedItem = {
                        v: block[i].v,
                        c: Math.ceil(block[i].c/2),
                        class: block[i].class
                    };
                    block[i].c -= Math.ceil(block[i].c/2);
                } else if (this.selectedItem && this.selectedItem.c > 0 && (!block[i] || block[i].c == 0)) {
                    // Drop 1 item
                    block[i] = {
                        v: this.selectedItem.v, 
                        c: 1,
                        class: this.selectedItem.class
                    };
                    this.selectedItem.c -= 1;
                } else if (this.selectedItem && this.selectedItem.c > 0 && block[i] && block[i].c > 0) {
                    // Switch or combine
                    if (block[i].v == this.selectedItem.v) {
                        block[i].c += 1;
                        this.selectedItem.c -= 1;
                    } else {
                        let prevBlock = JSON.parse(JSON.stringify(block[i]));
                        block[i] = JSON.parse(JSON.stringify(this.selectedItem));
                        this.selectedItem = prevBlock;
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

                this.selectedItem = {
                    v: block[i].v, 
                    c: total,
                    class: block[i].class
                }
                block[i] = undefined;
            } else if (type == "hover") {
                let name = "";
                let entity = block[i];
                if (entity) {
                    if (entity.class == "block") {
                        name = world.blockOrder[entity.v-1];
                    } else if (entity.class == "item") {
                        name = world.itemOrder[entity.v-1];
                    }
                    
                    this.drawHoverBox(name, entity);
                }
            }

            if (this.selectedItem && this.selectedItem.c == 0) {
                this.selectedItem = undefined;
            }
        }
    }

    // Select inventory item
    selectInventory(type) {
        let {craftingGrid, craftingTableGrid, showCraftingTable, craftingOutput} = this;

        // Check if click is within inventory
        if (type != "hover" && !this.withinInventory()) {
            if (type == "left") { // Drop all items from hand
                this.selectedItem = undefined;
            } else if (type == "right") { // Drop one item from hand
                this.selectedItem = undefined;
            }
        }

        // Select from inventory
        for (let i = 0; i < 36; i++) {
            let {xPos, yPos} = this.getPos("inventory", i);

            if (this.withinItemFrame(xPos, yPos))
                this.updateItem(this.inventory, i, type);
        }

        if (player.mode == "survival" || showCraftingTable) {
            // Select from survival crafting grid
            if (showCraftingTable) {
                // Add crafting table items
                let gridSize = 3;
                for (let j = 0; j < gridSize; j++) {
                    for (let i = 0; i < gridSize; i++) {
                        let {xPos, yPos} = this.getPos("craftingTable", i, j, true);

                        if (this.withinItemFrame(xPos, yPos))
                            this.updateItem(craftingTableGrid, i+j*gridSize, type);
                    }
                }
            } else {
                // Add crafting grid items
                let gridSize = 2;
                for (let j = 0; j < gridSize; j++) {
                    for (let i = 0; i < gridSize; i++) {
                        let {xPos, yPos} = this.getPos("crafting", i, j);

                        if (this.withinItemFrame(xPos, yPos))
                            this.updateItem(craftingGrid, i+j*gridSize, type);
                    }
                }
            }

            // Select from survival crafting output
            if (type == "left") {
                let block = craftingOutput;
                let {xPos, yPos} = showCraftingTable ? this.getPos("craftingTableOutput") : this.getPos("craftingOutput");

                if (this.withinItemFrame(xPos, yPos)) {
                    if (this.selectedItem == undefined && block && block.c > 0) {
                        this.selectedItem = JSON.parse(JSON.stringify(block));
                        this.craftingOutput = undefined;
                        this.updateCraftingOutput(true);
                    } else if (this.selectedItem && this.selectedItem.c > 0 && block && block.c > 0) {
                        // Switch or combine
                        if (block.v == this.selectedItem.v) {
                            this.selectedItem.c += block.c;
                            this.updateCraftingOutput(true);
                        }
                    }
                }
            }

            if (type != "hover") this.updateCraftingOutput();
        } else if (player.mode == "creative") {
            // Add background boxes
            for (let j = 0; j < 4; j++) {
                for (let i = 0; i < 9; i++) {
                    let {xPos, yPos} = this.getPos("creative", i, j);

                    if (this.withinItemFrame(xPos, yPos)) {
                        this.updateItem("creative", i+(3-j)*9, type);
                    }
                }
            }
        }
    }

    // Update item search
    updateItemSearch(search) {
        this.currentRow = 0;
        if (!search || search == '') {
            this.searchBlocks = world.blockOrder;
            this.searchItems = world.itemOrder;
        } else {
            this.searchBlocks = [];
            this.searchItems = [];
            for (let block of world.blockOrder) {
                if (block.search(search) > -1) {
                    this.searchBlocks.push(block);
                }
            }
            for (let item of world.itemOrder) {
                if (item.search(search) > -1) {
                    this.searchItems.push(item);
                }
            }
        }
    }

    // Scroll through inventory
    scroll(dir) {
        let numOfItems = this.searchBlocks.length + this.searchItems.length;
        let maxScroll = Math.floor(numOfItems/9)-3;

        if(dir > 0) {
			this.currentRow = Math.max(this.currentRow - 1, 0);
		} else {
			this.currentRow = Math.min(this.currentRow + 1, maxScroll);
		}
    }

    // Get position in inventory menu
    getPos(type, i, j, addMargin) {
        let {hotboxWidth, blockWidth, boxSize, height, margin} = this;

        let xPos, yPos;
        let startX = this.halfW-hotboxWidth*4+(hotboxWidth-blockWidth)/2;
        let startY = this.halfH+height/2;

        if (type == "inventory") {
            xPos = startX+(i%9)*hotboxWidth*this.boxRatio;
            yPos = startY-boxSize;
            if (i > 8) yPos = startY-boxSize-hotboxWidth*3*this.boxRatio+hotboxWidth*Math.floor((i-9)/9)*this.boxRatio-8;
        } else if (type == "crafting") {
            xPos = startX+i*hotboxWidth*this.boxRatio+hotboxWidth*2;
            yPos = startY-boxSize*10-hotboxWidth*this.boxRatio+j*hotboxWidth*this.boxRatio;
        } else if (type == "craftingOutput") {
            xPos = startX+hotboxWidth*5;
            yPos = startY-boxSize*10-hotboxWidth*0.5;
        } else if (type == "craftingTable") {
            xPos = startX+i*hotboxWidth*this.boxRatio+hotboxWidth;
            yPos = startY-boxSize*10-hotboxWidth*this.boxRatio+j*hotboxWidth*this.boxRatio;
        } else if (type == "craftingTableOutput") {
            xPos = startX+hotboxWidth*5;
            yPos = startY-boxSize*10;
        } else if (type == "creative") {
            xPos = startX+i*hotboxWidth*this.boxRatio;
            yPos = this.halfH-boxSize-j*hotboxWidth*this.boxRatio;
        } else if (type == "item") {
            xPos = startX+(i%9)*hotboxWidth*this.boxRatio;
            yPos = this.halfH-boxSize-hotboxWidth*2*this.boxRatio+Math.floor((i-9)/9)*hotboxWidth*this.boxRatio;
        } else if (type == "background") {
            xPos = startX+i*hotboxWidth*this.boxRatio;
            yPos = startY-boxSize-j*hotboxWidth*this.boxRatio;
            if (j!=0) yPos -= 8;
        }

        if (addMargin) {
            xPos -= margin;
            yPos -= margin;
        }

        // Floor xPos and yPos
        xPos = Math.floor(xPos);
        yPos = Math.floor(yPos);

        return {xPos, yPos};
    }

    // Display inventory background
    displayInventoryBackground() {
        let {searchBlocks, searchItems, craftingOutput, hotboxWidth, boxSize, currentRow, margin, showCraftingTable} = this;
        
        $("#search-input").hide();

        let width = 480;
        let height = 600;
        let padding = 10;
        let outline = 1;

        let backgroundBoxColor = "#ADADAD";

        // Draw background
        drawRectangle(0, 0, canvas.width, canvas.height, "rgba(0, 0, 0, 0.5)")
        drawRect(this.halfW, this.halfH, width, height, 0, "lightgrey")
        let title = (player.mode == "survival" || showCraftingTable) ? "Crafting" : player.mode == "creative" ? "" : "Adventure Mode"
        drawText(title, this.halfW, this.halfH-height/2+padding, "25px Minecraft-Regular", "grey", "center", "top")

        // Add background boxes
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 9; i++) {
                let {xPos, yPos} = this.getPos("background", i, j, true);

                drawRectangle(xPos-outline,yPos-outline,boxSize+outline*2,boxSize+outline*2,"grey")
                drawRectangle(xPos,yPos,boxSize,boxSize,backgroundBoxColor)
            }
        }

        if (showCraftingTable) {
            // Add crafting grid background boxes
            for (let j = 0; j < 3; j++) {
                for (let i = 0; i < 3; i++) {
                    let {xPos, yPos} = this.getPos("craftingTable", i, j, true);

                    drawRectangle(xPos-outline,yPos-outline,boxSize+outline*2,boxSize+outline*2,"grey")
                    drawRectangle(xPos,yPos,boxSize,boxSize,backgroundBoxColor)
                }
            }

            // Add crafting output background box
            let {xPos, yPos} = this.getPos("craftingTableOutput", 0, 0, true);

            drawRectangle(xPos-outline,yPos-outline,boxSize+outline*2,boxSize+outline*2,"grey")
            drawRectangle(xPos,yPos,boxSize,boxSize,backgroundBoxColor)
            this.drawItem(xPos+this.margin, yPos+this.margin, craftingOutput);

            return;
        }
        
        if (player.mode == "survival") { // SURVIVAL MODE
            // Add crafting grid background boxes
            for (let j = 0; j < 2; j++) {
                for (let i = 0; i < 2; i++) {
                    let {xPos, yPos} = this.getPos("crafting", i, j, true);

                    drawRectangle(xPos-outline,yPos-outline,boxSize+outline*2,boxSize+outline*2,"grey")
                    drawRectangle(xPos,yPos,boxSize,boxSize,backgroundBoxColor)
                }
            }

            // Add crafting output background box
            let {xPos, yPos} = this.getPos("craftingOutput", 0, 0, true);

            drawRectangle(xPos-outline,yPos-outline,boxSize+outline*2,boxSize+outline*2,"grey")
            drawRectangle(xPos,yPos,boxSize,boxSize,backgroundBoxColor)
            this.drawItem(xPos+this.margin, yPos+this.margin, craftingOutput);
        } else if (player.mode == "creative") { // CREATIVE MODE
            // SCROLLBAR
            let scrollMargin = 2;
            let scrollHeight = boxSize+3*hotboxWidth*this.boxRatio-scrollMargin*2;
            let maxScroll = Math.floor((searchBlocks.length+searchItems.length)/9)-2;
            maxScroll = Math.max(maxScroll, 1);

            // Draw scroll bar area
            drawRectangle(this.halfW+width/2, this.halfH-height/2, 40, height, "lightgrey")
            // Draw scroll bar background
            drawRectangle(this.halfW+width/2+5, this.halfH-scrollHeight-scrollMargin*2-margin, 30, scrollHeight+scrollMargin*2, "grey")
            // Draw scroll bar thumb
            drawRectangle(this.halfW+width/2+7, this.halfH-scrollHeight-margin-scrollMargin+currentRow*scrollHeight/maxScroll, 26, scrollHeight/maxScroll, "lightgrey")

            // Move scroll bar
            if (mouse.x > this.halfW+width/2 && mouse.x < this.halfW+width/2+40 && mouse.y > this.halfH-height/2 && mouse.y < this.halfH-height/2+height) {
                if (mouseLeft) {
                    this.scrolling = true;
                    let scrollBarY = clamp(mouse.y-(this.halfH-scrollHeight-scrollMargin*2), 0, scrollHeight+scrollMargin*2);
                    this.currentRow = Math.min(maxScroll-1, Math.round(scrollBarY/(scrollHeight)*(maxScroll)));
                }
            } else if (mouseLeft && this.scrolling) {
                let scrollBarY = clamp(mouse.y-(this.halfH-scrollHeight-scrollMargin*2), 0, scrollHeight+scrollMargin*2);
                this.currentRow = Math.min(maxScroll-1, Math.round(scrollBarY/(scrollHeight)*(maxScroll)));
            } else {
                this.scrolling = false;
            }

            $("#search-input").show();
            $("#search-input").css("top", this.halfH-height/2+padding*2);
            $("#search-input").css("left", this.halfW-hotboxWidth*4+padding);
            $("#search-input").css("width", width-2.5*padding);
            
            // Add background boxes
            for (let j = 0; j < 4; j++) {
                for (let i = 0; i < 9; i++) {
                    let {xPos, yPos} = this.getPos("creative", i, j, true);

                    drawRectangle(xPos-outline,yPos-outline,boxSize+outline*2,boxSize+outline*2,"grey")
                    drawRectangle(xPos,yPos,boxSize,boxSize,backgroundBoxColor)
                }
            }

            // Draw items in inventory
            let index = 0;
            let blocks = searchBlocks || world.blockOrder;
            index = this.drawItems(blocks, currentRow*9, "block", index);
            
            let offset = Math.max(0, currentRow*9-blocks.length);
            let items = searchItems || world.itemOrder;
            index = this.drawItems(items, offset, "item", index);
        }
    }

    // Display inventory
    displayInventory() {
        let {showInventory, showCraftingTable, inventory, craftingGrid, craftingTableGrid, selectedItem} = this;

        if (showInventory) {
            this.displayInventoryBackground();

            // Draw items in inventory
            for (let i = 0; i < inventory.length; i++) {
                let block = inventory[i];
                if (!block || block.c == 0) continue;
                let {xPos, yPos} = this.getPos("inventory", i);
                this.drawItem(xPos, yPos, block);
            }

            // Draw crafting table items
            if (showCraftingTable) {
                for (let j = 0; j < 3; j++) {
                    for (let i = 0; i < 3; i++) {
                        let block = craftingTableGrid[i+j*3];

                        if (!block || block.c == 0) continue;

                        let {xPos, yPos} = this.getPos("craftingTable", i, j);
                        this.drawItem(xPos, yPos, block);
                    }
                }
            }
            
            // Draw items in crafting grid
            if (player.mode == "survival" && !showCraftingTable) {
                for (let j = 0; j < 2; j++) {
                    for (let i = 0; i < 2; i++) {
                        let block = craftingGrid[i+j*2];

                        if (!block || block.c == 0) continue;

                        let {xPos, yPos} = this.getPos("crafting", i, j);
                        this.drawItem(xPos, yPos, block);
                    }
                }
            }
            
            // Draw selected item
            if (selectedItem && selectedItem.c > 0) {
                this.drawItem(mouse.x, mouse.y, selectedItem)
            }

        } else {
            $("#search-input").hide();
        }

        this.selectInventory("hover");
    }

    // Draw item in inventory
    drawItem(xPos, yPos, entity) {
        if (!entity) return;

        let {blockWidth} = this;

        // Floor xPos and yPos
        xPos = Math.floor(xPos);
        yPos = Math.floor(yPos);

        let index = entity.v-1;
        let atlas = textureManager.getTextureAtlas(entity.class);
        
        ctx.drawImage(atlas, 
            index*16, 0, 
            16, 16, 
            xPos, 
            yPos, 
            blockWidth, blockWidth
        );
        if (entity.c) {
            drawText(entity.c, 
                xPos+blockWidth+2,
                yPos+blockWidth+5, 
                "20px Minecraft-Regular", "white", "right", "bottom", 1, true
            );
        }
    }

    // Draw items in creative mode
    drawItems(entity, offset, type, index) {
        for (let k = offset; k < entity.length; k++) {
            if (index >= 36) break;

            let name = entity[k];
            let voxel;
            if (type == "item") voxel = world.itemId[name];
            else voxel = world.blockId[name];

            if (!voxel) continue;

            let {xPos, yPos} = this.getPos("item", index);

            this.drawItem(xPos, yPos, {
                v: voxel,
                c: "∞",
                class: type
            });

            index++;
        }
        return index;
    }

    // Display toolbar
    displayToolbar() {
        if (!initialized || !player.toolbar) return;
        if (player.mode == "spectator" || player.mode == "camera") return;

        let {toolbarX, toolbarSelectorX, hotboxWidth, selectorWidth, showInventory} = this;
        ctx.imageSmoothingEnabled = false;

        let blockWidth = 32;

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
                entity = this.inventory[i];
            if (entity && entity.c > 0) {
                let index = entity.v-1;
                let atlas = textureManager.getTextureAtlas(entity.class);

                let xPos = toolbarX+(hotboxWidth-blockWidth)/2+i*hotboxWidth*this.boxRatio;
                let yPos = canvas.height-hotboxWidth+(hotboxWidth-blockWidth)/8;

                ctx.drawImage(atlas, 
                    index*16, 0, 16, 16, 
                    xPos, 
                    yPos, 
                    blockWidth, blockWidth
                );
                drawText(entity.c, 
                    xPos+blockWidth+2,
                    yPos+blockWidth+5, 
                    "20px Minecraft-Regular", "white", "right", "bottom", 1, true
                );
            }
        }
    }

    // Draw hover box
    drawHoverBox(name, entity) {
        if (this.selectedItem || !name || !map[16] || !this.showInventory) return;

        let hoverBoxPadding = 10;
        let hoverBoxWidth = Math.max(ctx.measureText(name).width + hoverBoxPadding*2, 60);
        let hoverBoxHeight = 90;
        let direction = mouse.y>this.halfH ? 1 : 0;
        drawRectangle(mouse.x-hoverBoxWidth, mouse.y-hoverBoxHeight*direction, hoverBoxWidth, hoverBoxHeight, "rgba(0, 0, 0, 0.5");

        drawText(name, mouse.x-hoverBoxWidth/2, mouse.y-hoverBoxHeight*direction+hoverBoxPadding, "white", "25px Minecraft-Regular", "center", "top");
        this.drawItem(mouse.x-hoverBoxWidth/2-this.blockWidth/2, mouse.y-hoverBoxHeight*direction+hoverBoxPadding+30, entity)
    }

}