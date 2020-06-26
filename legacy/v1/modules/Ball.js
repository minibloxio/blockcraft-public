var Vector = require('./Vector.js');
var Function = require('./Function.js');

module.exports = class Ball {
	constructor(x, y, number, color, ballRadius) {
		this.number = number;
		this.color = color;

		let margin = 10;
		this.pos = new Vector(x, y);
		this.vel = new Vector();

		this.angle = Math.PI/2;
		this.angularVel = 0;

		this.hitVector = new Vector();

		this.radius = ballRadius;
		this.mass = 1;

		this.collided = false;

		this.frictionCoefficient = 0.992;
		this.hitCoefficient = 0.1;
		this.spinConstant = 0.001

		this.id = Function.randomString(5);
		this.potted = false;
	}

	update() {
		this.pos.x += this.vel.x/2;
		this.pos.y += this.vel.y/2;

		this.vel.setMag(this.vel.getMag()*this.frictionCoefficient)

		this.angularVel *= this.frictionCoefficient;
		this.angle += this.angularVel;
	}
}