// Key event handling

$('html').mousedown(function(event) {
	if (!player.controls.enabled || showInventory)
		return;
    switch (event.which) {
        case 1:
            player.punch();
            break;
        case 2:
            
            break;
        case 3:
            player.place = true;
            player.key.rightClick = Date.now();
            if (!player.key.lastRightClick)
            	player.key.lastRightClick = Date.now();
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})
$('html').mouseup(function(event) {
	if (!initialized)
		return;
    switch (event.which) {
        case 1:
            player.click = false;
            player.key.leftClick = false;
            break;
        case 2:

            break;
        case 3:
            player.place = false;
            player.key.rightClick = false;
            player.key.lastRightClick = false;
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})

$(window).keydown(function(event) {
	if (!player.controls.enabled)
		return;
	if(event.keyCode == 18) { 
		event.preventDefault(); 
	}
	if (event.altKey && event.keyCode == 68) {
		event.preventDefault();
	}
	if (event.altKey && event.keyCode == 32) {
		event.preventDefault();
	}
});

$("body").mousemove(function (e) {
	mouse.x = e.offsetX;
	mouse.y = e.offsetY;
})

let mouseLeft, mouseRight = false;
$("body").mousedown(function (e) {
	if (!showInventory)
		return;
	switch (event.which) {
        case 1:
		    selectInventory("left");
		    mouseLeft = true;
            break;
        case 2:
            
            break;
        case 3:
            selectInventory("right");
            mouseRight = true;
            break;
        default:
            //alert('You have a strange Mouse!');
    }
}).mouseup(function (e) {
	if (!showInventory)
		return;
	switch (event.which) {
        case 1:
        	mouseLeft = false
            break;
        case 2:
            
            break;
        case 3:
            mouseRight = false;
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})

$("body").dblclick(function () {
	selectInventory("double")
})

document.addEventListener('contextmenu', event => event.preventDefault());

var map = {};
onkeydown = onkeyup = function(e){
    e = e || event; 
    map[e.keyCode] = e.type == 'keydown';
}

var onKeyDown = function ( event ) {
	if (player.controls.enabled && ([13].indexOf(event.keyCode) > -1) && showChatFlag) {
		showChatFlag = false;
    	showChatBar = !showChatBar;
    	if (showChatBar) {
    		$("#chat-input").focus();
    		$("#chat-input").css({"background-color": "rgba(0, 0, 0, 0.3)"});
    		showChat = true;
    	} else {
    		$("#chat-input").blur();
    		$("#chat-input").css({"background-color": "rgba(0, 0, 0, 0)"});
    		hideChatTimer(5000);
    	}

    	let msg = $("#chat-input").val()
    	if (!showChatBar && msg) {
    		if (msg[0] != "/") { // Send message to everyone
    			socket.emit("message", $("#chat-input").val());
	    		$("#chat-input").val("")
    		} else { // Do minecraft command
	    		$("#chat-input").val("")
    			/*
					MINECRAFT COMMANDS	
    			*/

    			msg = msg.slice(1).split(" ");

    			if (msg[0] == "gamemode") {
    				if (["survival", "s"].indexOf(msg[1]) > -1) {
    					addChat({
							text: "Gamemode changed to survival"
						});
						player.mode = "survival";
    				} else if (["creative", "c"].indexOf(msg[1]) > -1) {
    					addChat({
							text: "Gamemode changed to creative"
						});
						player.mode = "creative";
    				} else {
    					addChat({
							text: "Error: Unrecognized gamemode",
							color: "red"
						});
    				}
    			} else if (msg[0] == "tp") {
    				let exists = false;
    				for (let id in players) {
    					let p = players[id];
    					if (p.name = msg[1]) {
    						exists = true; 
    						addChat({
								text: "Teleported " + player.name + " to " + p.name
							});
							player.position.copy(p.pos)

    						break;
    					}
    				}
    				if (!exists) {
    					addChat({
							text: 'Error: No player found with name "' + msg[1] + '" to teleport to',
							color: "red"
						});
    				} else {

    				}
	    				
    			} else if (msg[0] == "time") {
    				if (typeof(parseInt(msg[1])) == "number")
    					socket.emit('settime', parseInt(msg[1]))
	    				
    			} else {
    				addChat({
						text: 'Error: Unable to recognize command "' + msg[0] + '"',
						color: "red"
					});
    			}


    		}
    	}
	}

	if (!initialized || !player.controls.enabled || showChatBar)
		return;

	if (keymap[event.keyCode] && keymap[event.keyCode][2]) {
		switch ( keymap[event.keyCode][0] ) {
			case "Attack":
			player.punch();
			break;
			case "Place Block":
			player.place = true;
			player.key.rightClick = Date.now();
			break;
			case "Move Forward":
			player.key.forward = 1;
			break;
			case "Move Left":
			player.key.left = 1; 
			break;
			case "Move Backward":
			player.key.backward = -1;
			break;
			case "Move Right":
			player.key.right = -1;
			break;
			case "Jump":
			player.key.up = -1;
			break;
			case "Sprint":
			player.key.sprint = true;
			break;
			case "Sneak":
			player.key.sneak = true;
			player.key.down = 1;
			break;
			case "Fly":
			if (player.controls.enabled && player.allowFly) {
				player.fly = !player.fly;
				player.allowFly = false;
			}
			break;
			case "Clip":
			if (player.controls.enabled && player.allowClip) {
				player.clip = !player.clip;
				player.allowClip = false;
			}
			break;
			case "Drop Item":
			player.dropItem();
			break;
			case "Respawn":
			if (player.controls.enabled && player.allowRespawn) {
				player.respawn(world.blockSize);
				socket.emit('respawn');
				player.allowRespawn = false;
			}
			break;
			case "Zoom":
			camera.zoom = zoomLevel;
			camera.enableZoom = true;
			break;
			case "Player Tab":
			showPlayerTab = true;
			break;
			case "Slot 1":
			player.currentSlot = 0;
			break;
			case "Slot 2":
			player.currentSlot = 1;
			break;
			case "Slot 3":
			player.currentSlot = 2;
			break;
			case "Slot 4":
			player.currentSlot = 3;
			break;
			case "Slot 5":
			player.currentSlot = 4;
			break;
			case "Slot 6":
			player.currentSlot = 5;
			break;
			case "Slot 7":
			player.currentSlot = 6;
			break;
			case "Slot 8":
			player.currentSlot = 7;
			break;
			case "Slot 9":
			player.currentSlot = 8;
			break;
		}
	}
};

var onKeyUp = function ( event ) {
	let {blockSize} = world;

	if ([13].indexOf(event.keyCode) > -1) {

		showChatFlag = true;
		return;
	}

	if (!initialized || !player.controls.enabled || showChatBar)
		return;

	if (keymap[event.keyCode] && keymap[event.keyCode][2]) {
		switch ( keymap[event.keyCode][0] ) {
			case "Attack":
			player.click = false;
            player.key.leftClick = false;
			break;
			case "Place Block":
			player.place = false;
			player.key.rightClick = false;
			break;
			case "Move Forward":
			player.key.forward = 0;
			break;
			case "Move Left":
			player.key.left = 0;
			break;
			case "Move Backward":
			player.key.backward = 0;
			break;
			case "Move Right":
			player.key.right = 0;
			break;
			case "Jump":
			player.key.up = 0;
			break;
			case "Sprint":
			player.key.sprint = false;
			break;
			case "Sneak":
			player.key.sneak = false;
			player.key.down = 0;
			break;
			case "Fly":
			player.allowFly = true;
			break;
			case "Clip":
			player.allowClip = true;
			break;
			case "Drop Item":
			player.allowDrop = true;
			break;
			case "Respawn":
			player.allowRespawn = true;
			break;
			case "Zoom":
			zoomLevel = 3;
			camera.enableZoom = false;
			camera.zoom = 1;
			break;
			case "Player Tab":
			showPlayerTab = false;
			break;
		}
	}
};

document.addEventListener( 'keydown', onKeyDown, false );
document.addEventListener( 'keyup', onKeyUp, false );


// Scrolling
var lastScrollTop = 0, delta = 5;
let zoomLevel = 3
$(document).bind('mousewheel', function(e) {
	if (!player.controls.enabled)
		return;

	if (camera.enableZoom) {
		if(e.originalEvent.wheelDelta / 120 > 0) {
			zoomLevel = clamp(zoomLevel+0.2, -10, 10);
	    } else {
	        zoomLevel = clamp(zoomLevel-0.2, -10, 10);
	    }
	    camera.zoom = zoomLevel;
	} else {
		if(e.originalEvent.wheelDelta / 120 > 0) {
	        player.currentSlot -= 1;
	        if (player.currentSlot < 0)
	        	player.currentSlot = 8;
	    } else {
	        player.currentSlot += 1;
	        if (player.currentSlot > 8)
	        	player.currentSlot = 0;
	    }
	} 
});

// Blur & Focus

$(window).blur(function () {
	inScreen = false;
})

$(window).focus(function () {
	inScreen = true;
})