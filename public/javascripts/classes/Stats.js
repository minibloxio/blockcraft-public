class Stat {
	constructor(name, value, key, round, func) {
		this.name = name;
		this.value = value;

		this.key = key;
		this.round = round;

		this.func = func;
	}

	display(index) {
		let text = this.name + ": ";

		let val = this.value;
		if (this.func && this.key) {
			val = this.func(this.value[this.key]);
		} else if (this.func) {
			val = this.func(this.value)
		}

		if (this.key) {
			let type = typeof(val[this.key])
			val = val[this.key];
			if (type == "boolean")
				text += val
			else if (type == "string")
				text += val
			else
				text += round(val, this.round);


		} else if (val instanceof Object) {
			text += "x: " + round(val.x, this.round) + " y: " + round(val.y, this.round) + " z: " + round(val.z, this.round);
		} else if (val instanceof Array) {
			text += round(this.value.reduce((a, b) => a + b, 0)/this.value.length, this.round);
		}

		drawText(text, 10, index*20+55, "20px Minecraft-Regular", "white", "left", "top");
	}
}