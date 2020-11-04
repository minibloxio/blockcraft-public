/**
 * @author mrdoob / http://mrdoob.com/
 */

 var sens = 0.5;

 function initPointerLock() {
 	var blocker = document.getElementById('blocker');

	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
	if ( havePointerLock ) {
		var element = document.body;

		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				player.controls.enabled = true;
				blocker.style.display = 'none';

				if (showInventory) {
					showInventory = false;
				} else {
					let name = $("#name-input").val();
					socket.emit('playerInfo', {
						name: name
					})
				}
			} else { // Exit pointer lock

				if (!showInventory) {
					blocker.style.display = 'block';

					element.requestPointerLock();
				}
				player.controls.enabled = false;
				//$("#chat-input").hide();
    			$("#chat-input").blur();
    			$("#chat-input").css({"background-color": "rgba(0, 0, 0, 0)"});
    			$("#chat-input").val('');
    			showChatBar = false;
    			
			}
		};

		var pointerlockerror = function ( event ) {
		};

		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		$("#start-button").click(function (event) {

			if (loaded >= 3) {
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();

				if (loaded == 3) {
					socket.emit('join')
					loaded += 1;
				}
				
			}
			
		})

		$("body").keydown(function (event) {
			if (event.keyCode == 27)
				document.exitPointerLock();

			if (event.keyCode == 69 && !showChatBar && loaded >= 4) {
				if (player.controls.enabled) {
					showInventory = true;
					inventory = JSON.parse(JSON.stringify(player.toolbar));

					document.exitPointerLock();
				} else {
					showInventory = false;
					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
					element.requestPointerLock();

					socket.emit('updateInventory', inventory);
				}
			}

			if (event.keyCode == 9)
				event.preventDefault();
			
		}).keyup(function (event) {
			if (event.keyCode == 27 && showInventory) {
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();
				socket.emit('updateInventory', inventory);
			}
		})

		// Enter username input
		$("#name-input").keyup(function (event) {
			if (event.keyCode == 13 && loaded >= 3) {

				if (loaded == 3) {
					socket.emit('join')
					loaded += 1;
				}

				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();
			}
		})
	} else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
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

		yawObject.rotation.y -= movementX * 0.004 * sens;
		pitchObject.rotation.x -= movementY * 0.004 * sens;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

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
