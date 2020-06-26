// Key event handling

$('html').mousedown(function(event) {
	if (!player.controls.enabled)
		return;
    switch (event.which) {
        case 1:
            player.click = true;
            player.key.leftClick = Date.now();
            break;
        case 2:
            
            break;
        case 3:
            player.place = true;
            player.key.rightClick = Date.now();
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})
$('html').mouseup(function(event) {
	if (!player.controls.enabled)
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
});

var map = {};
onkeydown = onkeyup = function(e){
    e = e || event; 
    map[e.keyCode] = e.type == 'keydown';
}

var onKeyDown = function ( event ) {
	if (!player.controls.enabled)
		return;
	switch ( event.keyCode ) {

		case 38: // up
		case 87: // w
			player.key.forward = 1;
			break;
		case 37: // left
		case 65: // a
			player.key.left = 1; 
			break;
		case 40: // down
		case 83: // s
			player.key.backward = -1;
			break;
		case 39: // right
		case 68: // d
			player.key.right = -1;
			break;

		case 32: // space
			if (player.velocity.y > 0 && player.flyingEnabled) {
				player.fly = true;
			}
			break;

		case 16:
			player.key.sprint = true;
			break;

		case 18:
			player.key.sneak = true;
			player.key.down = 1;
			break;

		case 191:
			player.place = true;
			break;
	}
};

var onKeyUp = function ( event ) {
	if (!player.controls.enabled)
		return;
	switch( event.keyCode ) {

		case 38: // up
		case 87: // w
			player.key.forward = 0;
			break;

		case 37: // left
		case 65: // a
			player.key.left = 0;
			break;

		case 40: // down
		case 83: // s
			player.key.backward = 0;
			break;

		case 39: // right
		case 68: // d
			player.key.right = 0;
			break;

		case 32:
			player.key.up = 0;
			break;
		case 16:
			player.key.sprint = false;
			break;

		case 18:
			player.key.sneak = false;
			player.key.down = 0;
			break;

		case 82:
			let resetHeight = 200;
			player.position.set(0, resetHeight, 0);
			player.controls.getObject().position['y'] = resetHeight;
			player.savedPosition['y'] = resetHeight;
			player.velocity.y = 0
			break;
	}
};

document.addEventListener( 'keydown', onKeyDown, false );
document.addEventListener( 'keyup', onKeyUp, false );