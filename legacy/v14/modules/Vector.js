module.exports = class Vector {
	constructor(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}	
	getMag() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}
	setMag(magnitude) {
		var direction = this.getDir();
		this.x = Math.cos(direction) * magnitude;
		this.y = Math.sin(direction) * magnitude;
	}
	getDir() {
	  return Math.atan2(this.y, this.x);
	}
	add(a, b) {
		if (b) {
	    return new Vector(a.x + b.x, a.y + b.y);
	  } else {
	    this.x = this.x + a.x;
		this.y = this.y + a.y
	  }
	}
	sub(a, b) {
	  if (b) {
	    return new Vector(a.x - b.x, a.y - b.y);
	  } else {
	    this.x = this.x - a.x;
		 this.y = this.y - a.y
	  }
	}
	mult(scalar) {
		this.x = this.x * scalar;
		this.y = this.y * scalar;
	}
	div(scalar) {
		this.x = this.x / scalar;
		this.y = this.y / scalar;
	}
	getDot(b) {
		return this.x * b.x + this.y * b.y;
	}
	dist(a, b) {
	  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
	}
	normalize() {
		if (this.getMag() != 0) {
			this.div(this.getMag());
		}
	}
	limit(max) {
		if (this.getMag() > max) {
			this.normalize();
			this.mult(max);
		}
	}
	static rotate(vector, ang) // Vector to rotate by an angle in radians
	{
	    var cos = Math.cos(ang);
	    var sin = Math.sin(ang);
	    return new Vector(Math.round(10000*(vector.x * cos - vector.y * sin))/10000, Math.round(10000*(vector.x * sin + vector.y * cos))/10000);
	}
	copy() {
		return new Vector(this.x, this.y);
	}
}