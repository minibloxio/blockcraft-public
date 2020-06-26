class Stat {
	constructor(name, value, key, round) {
		this.name = name;
		this.value = value;

		this.key = key;
		this.round = round;
	}

	display(index) {
		let text = this.name + ": ";

		if (this.key) {
			text += round(this.value[this.key], this.round);
		} else if (this.value instanceof Object) {
			text += "x: " + round(this.value.x/16, this.round) + " y: " + round(this.value.y/16, this.round) + " z: " + round(this.value.z/16, this.round);
		} else if (this.value instanceof Array) {
			text += round(this.value.reduce((a, b) => a + b, 0)/this.value.length, this.round);
		}

		drawText(text, 10, index*20+55, "20px Minecraft-Regular", "white", "left", "top");
	}
}