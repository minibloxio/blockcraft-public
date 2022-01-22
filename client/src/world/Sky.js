import { scene } from "../globals";
import sun from "./Sun";

class Sky {
  update() {
    // Update sky lighting
    var perc = (Math.pow(Math.abs(sun.offset.y), 0.3) / Math.pow(sun.sunDist, 0.3)) * 100;
    let color;

    if (sun.offset.y > 0) {
      color = new THREE.Color(LinearColorInterpolator.findColorBetween(sunrise, noon, perc).asRgbCss());
    } else {
      color = new THREE.Color(LinearColorInterpolator.findColorBetween(sunrise, midnight, perc).asRgbCss());
    }

    scene.background = color;
  }
}

const sky = new Sky();
export default sky;

var LinearColorInterpolator = {
  // convert 6-digit hex to rgb components;
  // accepts with or without hash ("335577" or "#335577")
  convertHexToRgb: function (hex) {
    let match = hex.replace(/#/, "").match(/.{1,2}/g);
    return new Color({
      r: parseInt(match[0], 16),
      g: parseInt(match[1], 16),
      b: parseInt(match[2], 16),
    });
  },
  // left and right are colors that you're aiming to find
  // a color between. Percentage (0-100) indicates the ratio
  // of right to left. Higher percentage means more right,
  // lower means more left.
  findColorBetween: function (left, right, percentage) {
    let newColor = {};
    let components = ["r", "g", "b"];
    for (var i = 0; i < components.length; i++) {
      let c = components[i];
      newColor[c] = Math.round(left[c] + ((right[c] - left[c]) * percentage) / 100);
    }
    return new Color(newColor);
  },
};
var Color = function (hexOrObject) {
  var obj;
  if (hexOrObject instanceof Object) {
    obj = hexOrObject;
  } else {
    obj = LinearColorInterpolator.convertHexToRgb(hexOrObject);
  }
  this.r = obj.r;
  this.g = obj.g;
  this.b = obj.b;
};
Color.prototype.asRgbCss = function () {
  return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
};
var midnight = new Color("#151B54");
var sunrise = new Color("#fd5e53");
var noon = new Color("#ADD8E6");
