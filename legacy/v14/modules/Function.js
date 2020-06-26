var Vector = require('./Vector.js')

module.exports = class Function {

	static random(max, min) {
		if (max != undefined)
			return Math.random() * (max - min) + min;
		else
			return Math.random();
	}

	static randInt(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}

	static randCircle(radius) { // return a random vector that is uniformly distributed within a circle given a radius
		var r = radius * Math.sqrt(Math.random());
		var theta = Math.random() * 2 * Math.PI;

		return new Vector(r * Math.cos(theta), r * Math.sin(theta));
	}

	static clamp(num, min, max) {
	  return num <= min ? min : num >= max ? max : num;
	}

	static getRandomColor() {
	  	var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
		    color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	static dist(a, b) {
		return Math.sqrt(Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2));
	}

	static randomG(v){ 
	    var r = 0;
	    for(var i = v; i > 0; i --){
	        r += Math.random();
	    }
    	return r / v;
    }

	static randomString(length) {
	    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz'.split('');

	    if (! length) {
	        length = Math.floor(Math.random() * chars.length);
	    }

	    var str = '';
	    for (var i = 0; i < length; i++) {
	        str += chars[Math.floor(Math.random() * chars.length)];
	    }
	    return str;
	}

	static getDistance( fromX, fromY, toX, toY ) {
		var dX = Math.abs( fromX - toX );
		var dY = Math.abs( fromY - toY );

		return Math.sqrt( ( dX * dX ) + ( dY * dY ) );
	}


	static circleCollidesRect ( circle, rect ) {
	
		var rectCenterX = rect.pos.x;
		var rectCenterY = rect.pos.y;

		var rectX = rectCenterX - rect.width / 2;
		var rectY = rectCenterY - rect.height / 2;

		var rectReferenceX = rectX;
		var rectReferenceY = rectY;
		
		// Rotate circle's center point back
		var unrotatedCircleX = Math.cos( rect.angle ) * ( circle.pos.x - rectCenterX ) - Math.sin( rect.angle ) * ( circle.pos.y - rectCenterY ) + rectCenterX;
		var unrotatedCircleY = Math.sin( rect.angle ) * ( circle.pos.x - rectCenterX ) + Math.cos( rect.angle ) * ( circle.pos.y - rectCenterY ) + rectCenterY;

		// Closest point in the rectangle to the center of circle rotated backwards(unrotated)
		var closestX, closestY;

		// Find the unrotated closest x point from center of unrotated circle
		if ( unrotatedCircleX < rectReferenceX ) {
			closestX = rectReferenceX;
		} else if ( unrotatedCircleX > rectReferenceX + rect.width ) {
			closestX = rectReferenceX + rect.width;
		} else {
			closestX = unrotatedCircleX;
		}
	 
		// Find the unrotated closest y point from center of unrotated circle
		if ( unrotatedCircleY < rectReferenceY ) {
			closestY = rectReferenceY;
		} else if ( unrotatedCircleY > rectReferenceY + rect.height ) {
			closestY = rectReferenceY + rect.height;
		} else {
			closestY = unrotatedCircleY;
		}
	 
		// Determine collision
		var collision = false;
		var distance = Function.getDistance( unrotatedCircleX, unrotatedCircleY, closestX, closestY );
		
		if ( distance < circle.radius ) {
			collision = true;
		}
		else {
			collision = false;
		}

		return collision;
	}
}