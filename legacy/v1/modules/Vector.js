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
	static add(a, b) {
		return new Vector(a.x + b.x, a.y + b.y);
	}
	sub(a, b) {
	  if (b) {
	    return new Vector(a.x - b.x, a.y - b.y);
	  } else {
	    this.x = this.x - a.x;
		 this.y = this.y - a.y
	  }
	}
	static sub(a, b) {
		return new Vector(a.x - b.x, a.y - b.y);
	}
	mult(scalar) {
		this.x = this.x * scalar;
		this.y = this.y * scalar;
	}
	static mult(vector, scalar) {
		return new Vector(vector.x * scalar, vector.y * scalar);
	}
	div(scalar) {
		this.x = this.x / scalar;
		this.y = this.y / scalar;
	}
	static div(vector, scalar) {
		return new Vector(vector.x / scalar, vector.y / scalar);
	}
	getDot(b) {
		return this.x * b.x + this.y * b.y;
	}
	static dot(a, b) {
		return a.x * b.x + a.y * b.y;
	}
	static cross(a, b) {
		return a.x * b.y - a.y * b.x;
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
	copy() {
		return new Vector(this.x, this.y);
	}
	rotate(ang)
	{
	    ang = ang * (Math.PI/180);
	    var cos = Math.cos(ang);
	    var sin = Math.sin(ang);
	    this.x = Math.round(10000*(this.x * cos - this.y * sin))/10000;
	    this.y = Math.round(10000*(this.x * sin + this.y * cos))/10000;
	}
	static rotate(vector, ang) // Vector to rotate by an angle in radians
	{
	    var cos = Math.cos(ang);
	    var sin = Math.sin(ang);
	    return new Vector(Math.round(10000*(vector.x * cos - vector.y * sin))/10000, Math.round(10000*(vector.x * sin + vector.y * cos))/10000);
	}
	print() {
		console.log("X: " + this.x + " Y: " + this.y);
	}
}