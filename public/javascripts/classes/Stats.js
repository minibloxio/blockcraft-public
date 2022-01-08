class Stat {
    constructor(name, value, key, round, func) {
        this.name = name;
        this.value = value;

        this.key = key;
        this.round = round;

        this.func = func;
        this.array = [];
    }

    getText() {
        let text = this.name + ": ";
        let val = this.value;
        let dp = this.round || 0; // Decimal place

        if (typeof val === 'function') {
            this.array.push(val(this.func))
            if (this.array.length > 100) this.array.shift();
            text += round(this.array.average(), dp).toFixed(dp) + this.key;
        } else {
            if (typeof this.func === 'function' && this.key) {
                val = this.func(this.value[this.key]);
            } else if (typeof this.func === 'function') {
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
                    text += round(val, dp).toFixed(dp);

            } else if (val instanceof Object) {
                text += "x: " + round(val.x, dp).toFixed(dp) + " y: " + round(val.y, dp).toFixed(dp) + " z: " + round(val.z, dp).toFixed(dp);
            } else if (val instanceof Array) {

                text += round(this.value.reduce((a, b) => a + b, 0) / this.value.length, dp).toFixed(dp);
                console.log(text)
            }
        }

        return text;
    }

    display(index, offset = 0) {

        let text = this.getText();

        let fontSize = 20;
        let margin = 5;
        let width = ctx.measureText(text).width + margin * 2;
        drawRectangle(
            10 - margin + offset, index * fontSize + 55,
            width, fontSize,
            "black", { alpha: 0.2 }
        );
        drawText(
            text,
            10 + offset, index * fontSize + 55,
            fontSize + "px Minecraft-Regular", "white", "left", "top"
        );

        return width;
    }
}