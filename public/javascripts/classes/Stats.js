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

		let fontSize = 20;
		let margin = 5;
		drawRectangle(10-margin, index*fontSize+55, ctx.measureText(text).width+margin*2, fontSize, "black", {alpha: 0.2});
		drawText(text, 10, index*fontSize+55, fontSize+"px Minecraft-Regular", "white", "left", "top");
	}
}