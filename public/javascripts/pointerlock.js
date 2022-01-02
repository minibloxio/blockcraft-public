/*

Provides pointer lock functionality and the ability to connect to the game server

*/

// Request pointer lock
function requestPointerLock() {
	if (loaded >= maxLoaded) {
		// Ask the browser to lock the pointer
		var element = document.body;
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();
	}
}

// Get item entity
function getItemEntity(player, item, dropDir) {
	return {
		force: true,
		v: item.v,
		c: 1,
		x: player.position.x,
		y: player.position.y-8,
		z: player.position.z,
		class: item.class,
		dir: {x: dropDir.x, z: dropDir.y}
	}
}

// Get dropped items
function getDroppedItems(items, count) {
	if (!items) return [];

	let droppedItems = [];
	let dropDir = player.getDropDir();
	for (let item of items) {
		if (!item) continue;
		for (let i = 0; i < (count || item.c); i++) {
			droppedItems.push(getItemEntity(player, item, dropDir));
		}
	}

	return droppedItems;
}

// Enter pointer lock
function enterPointerLock () {
	player.controls.enabled = true;
	blocker.style.display = 'none';
	$("#background-image").hide();
	onWindowResize();

	if (inventory.showInventory) { // Return to game from inventory
		
		let droppedItems = [];
		if (inventory.showCraftingTable) { // Drop items in crafting table grid
			droppedItems = getDroppedItems(inventory.craftingTableGrid);
			inventory.craftingTableGrid.length = 0;
		} else { // Drop items in crafting grid
			droppedItems = getDroppedItems(inventory.craftingGrid);
			inventory.craftingGrid.length = 0;
		}
		droppedItems = droppedItems.concat(getDroppedItems([inventory.selectedItem])); // Drop items in hand
		inventory.selectedItem = null;
		droppedItems.force = true;

		socket.emit('dropItems', droppedItems);
		
		inventory.craftingOutput = undefined;
		inventory.showInventory = false;
		inventory.showCraftingTable = false;
	} else { // Return to game from chat
		let name = $("#name-input").val();

		if (name && getCookie("Name") != name)
			setCookie("Name", name, 7);

		socket.emit('playerInfo', {
			name: name
		})
	}
}

function exitPointerLock() {
	if (!inventory.showInventory) {
		blocker.style.display = 'block';
		//element.requestPointerLock();
	}
	player.controls.enabled = false;
	//$("#chat-input").hide();
	$("#chat-input").blur();
	$("#chat-input").css({"background-color": "rgba(0, 0, 0, 0)"});
	$("#chat-input").val('');
	chat.showChatBar = false;
}

function initPointerLock() {

	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
	if ( havePointerLock ) {
		var element = document.body;

		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				enterPointerLock();
			} else { // Exit pointer lock
				exitPointerLock();
			}
		};

		var pointerlockerror = function ( event ) {
		};

		// Hook pointer lock change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		$("body").keydown(function (event) {
			if (event.keyCode == 27 && player.controls.enabled)
				document.exitPointerLock();

			if (keymap[event.keyCode] && keymap[event.keyCode][0] == "Open Inventory" && !chat.showChatBar && loaded >= maxLoaded+1 && (player.controls.enabled || inventory.showInventory)) {

				if (player.controls.enabled && inventory.canShowInventory) {
					inventory.showInventory = true;
					inventory.canShowInventory = false;
					inventory.showCraftingTable = false;
					inventory.inventory = JSON.parse(JSON.stringify(player.toolbar));

					document.exitPointerLock();
				} else if (document.activeElement.id != "search-input") {
					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
					element.requestPointerLock();

					socket.emit('updateInventory', inventory.inventory);
				}

			}

			if (event.keyCode == 9)
				event.preventDefault();
			
		}).keyup(function (event) {
			if (event.keyCode == 27 && inventory.showInventory) { // Escape key
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();
				socket.emit('updateInventory', inventory.inventory);
			}
			
			inventory.canShowInventory = true;
		})
	} else {
		console.error("PointerLock is not supported on this browser")
	}
 }

THREE.PointerLockControls = function ( camera ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		if (Math.abs(movementX) > 300) return;
		if (Math.abs(movementY) > 300) return;
		
		yawObject.rotation.y -= movementX * 0.00004 * player.sens;
		pitchObject.rotation.x -= movementY * 0.00004 * player.sens;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	// setInterval(function () {
	// 	yawObject.rotation.y -= 0.005;
	// }, 16);

	this.dispose = function () {

		document.removeEventListener( 'mousemove', onMouseMove, false );

	};

	document.addEventListener( 'mousemove', onMouseMove, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function () {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, 'YXZ' );

		return function ( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		};

	}();

};
