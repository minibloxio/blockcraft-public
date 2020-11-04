function drawCircle(x, y, r, c, options) {
	if (!options)
		options = {};

	ctx.save();
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = c || 'red';
    ctx.globalAlpha = options.alpha || 1;
    if (options.glow)
    	ctx.shadowBlur = 100;
    if (options.glowColor)
		ctx.shadowColor = options.glowColor || 'aqua';
	if (options.fill || options.fill == undefined)
    	ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = options.outlineWidth || 1;
    ctx.strokeStyle = options.outlineColor || 'black';
    if (options.outline)
    	ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

function drawRectangle(x, y, w, h, c, options) {
	if (!options)
		options = {};

	ctx.save();
	ctx.translate(x, y);
	ctx.beginPath();
	ctx.rect(0, 0, w, h);
	ctx.fillStyle = c || 'grey';
	ctx.globalAlpha = options.alpha || 1;
	if (options.fill == undefined || options.fill)
		ctx.fill();
	ctx.strokeStyle = options.outlineColor || "black";
	ctx.lineWidth = options.outlineWidth || 1;
	if (options.outline)
		ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

// Draw rectangle but centered
function drawRect(x, y, w, h, d, c, options) {
	if (!options)
		options = {};

	ctx.translate(x, y)
	ctx.rotate(d);
	ctx.beginPath();

	ctx.rect(-w/2, -h/2, w, h);
	ctx.fillStyle = c || 'grey';
	ctx.globalAlpha = options.alpha || 1;
		ctx.fill();
	ctx.globalAlpha = 1;

	ctx.closePath();
	ctx.resetTransform();
}

function drawRoundedRect(x, y, w, h, r, c, options) {
	// Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.fillStyle = c || 'grey';
	ctx.globalAlpha = options.alpha || 1;
		ctx.fill();
	ctx.globalAlpha = 1;
}

function drawRotatedRoundedRect(x, y, w, h, r, c, d, options) {
	if (!options)
		options = {};

	ctx.translate(x, y);
	ctx.rotate(d);
	
	ctx.moveTo(-w/2+r, -h/2);
    ctx.lineTo(-w/2+w-r, -h/2);
    ctx.quadraticCurveTo(-w/2+w, -h/2+0, -w/2+w, -h/2+0+r);
   	ctx.lineTo(-w/2+w, -h/2+h-r);
    ctx.quadraticCurveTo(-w/2+w, -h/2+h, -w/2+w-r, -h/2+h);
    ctx.lineTo(-w/2+r, -h/2+h);
    ctx.quadraticCurveTo(-w/2, -h/2+h, -w/2, -h/2+h-r);
    ctx.lineTo(-w/2, -h/2+r);
    ctx.quadraticCurveTo(-w/2, -h/2, -w/2+r, -h/2);

    ctx.fillStyle = c || 'grey';
	ctx.globalAlpha = options.alpha || 1;
	ctx.lineWidth = 3*display.zoom;
		ctx.fill();
	ctx.globalAlpha = 1;

	ctx.closePath();
	ctx.resetTransform();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    var rot = Math.PI / 2 * 3;
    var x = cx;
    var y = cy;
    var step = Math.PI / spikes;

    ctx.strokeSyle = "#000";
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath();
    ctx.fillStyle='white';
    ctx.fill();

}

function drawCheckmark(x, y, size, width) {
	ctx.beginPath();
	ctx.moveTo(x-size, y);
	ctx.lineTo(x,y+size);
	ctx.lineTo(x+size*2,y-size);
	ctx.lineWidth = width;
	ctx.strokeStyle = '#fff';
	ctx.stroke();
	ctx.closePath(); 
}

function drawImage(img, x, y, w, h, angle) {
	ctx.beginPath();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.drawImage(img, -w, -h, w*2, h*2);
	ctx.resetTransform();
	ctx.closePath();
}

function drawImageTopLeft(img, x, y, w, h) {
	ctx.beginPath();
	ctx.translate(x, y);
	ctx.drawImage(img, 0, 0, w, h);
	ctx.resetTransform();
	ctx.closePath();
}

function drawCircleImage(img, x, y, r, angle) {
	ctx.translate(x, y)
	ctx.rotate(angle);
	ctx.drawImage(img, -r, -r, r*2, r*2);
	ctx.resetTransform();
}

function drawLine(x1, y1, x2, y2, color, thickness, cap, alpha) {
	ctx.beginPath();
	ctx.lineWidth = thickness;
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.globalAlpha = alpha || 1;
	ctx.strokeStyle = color || "black";
	ctx.lineCap = cap || "default";
	ctx.stroke();
	ctx.globalAlpha = 1;
	ctx.closePath();
}

function drawText(text, x, y, font, color, align, baseline, alpha) {
	let options = {};
	if (font instanceof Object) {
		options = font;
	}
	ctx.beginPath();
	ctx.font = options.font || font || "20px Arial";
	ctx.fillStyle = options.color || color || "red";
	ctx.textAlign = options.align || align || "default";
	ctx.globalAlpha = alpha || 1;
	ctx.textBaseline = options.baseline || baseline || "default";
	ctx.fillText(text, x, y);
	ctx.globalAlpha = 1;
	ctx.closePath();
}

function drawArrow(x1, y1, x2, y2, thickness, color, alpha, cap){
	ctx.beginPath();
	ctx.lineWidth = thickness || 2;
	ctx.strokeStyle = color || "black";
	ctx.globalAlpha = alpha || 1;
	ctx.lineCap = cap || "butt";
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(y2-y1,x2-x1);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));
    ctx.stroke();
    ctx.closePath();
    ctx.globalAlpha = 1;
}

 function drawTriangle(x, y, base, height, angle, color) {
 	ctx.translate(x, y)
	ctx.rotate(angle);
	ctx.beginPath();

    var path =new Path2D();
    path.moveTo(-base/2,height/2);
    path.lineTo(0,-height/2);
    path.lineTo(base/2,height/2);
    ctx.fillStyle = color || "black";
    ctx.fill(path);

   	ctx.closePath();
	ctx.resetTransform();
}

// Color

function getRandomRgb() {
  var num = Math.round(0xffffff * Math.random());
  var r = num >> 16;
  var g = num >> 8 & 255;
  var b = num & 255;
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function getRandomHEX() {
	var randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
	return randomColor;
}
// Create an RGB value from a hex value
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Create an hex value from a RGB value
function rgbToHex(rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};

// Random ID

function randomString(length) {
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

// Map number from one range to another

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

// Math functions

function constrain(value, a, b) {
	if (value < a) {
		return a;
	} else if (value > b) {
		return b;
	} else {
		return value;
	}
}

function random(max, min) {
	return Math.random() * (max - min) + min;
}

function randInt(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// Return a random vector that is uniformly distributed within a circle given a radius
function randCircle(radius) { 
	var r = radius * Math.sqrt(Math.random());
	var theta = Math.random() * 2 * Math.PI;

	return new Vector(r * Math.cos(theta), r * Math.sin(theta));
}

function randomProperty(obj) {
    var keys = Object.keys(obj)
    return obj[keys[ keys.length * Math.random() << 0]];
}

function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
    return num;
}

function randomG(v){ 
    var r = 0;
    for(var i = v; i > 0; i --){
        r += Math.random();
    }
    return r / v;
}

function interpolate(a, b, frac) // points A and B, frac between 0 and 1
{
    var nx = a.x+(b.x-a.x)*frac;
    var ny = a.y+(b.y-a.y)*frac;
    return new Vector(nx, ny);
}

function dist(a, b) {
	return Math.sqrt(Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2));
}

function planetDist(rocket, planet) {
	return dist(rocket.pos, planet.pos) - rocket.height/2 - planet.radius;
}

function round(value, decimalPlace) {
	var decimalPlace = (decimalPlace === undefined) ? 0 : decimalPlace;
	return Math.round( value * (10 ** decimalPlace)) / (10 ** decimalPlace)
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Color editor
const pSBC=(p,c0,c1,l)=>{
    let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
    if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
    if(!this.pSBCr)this.pSBCr=(d)=>{
        let n=d.length,x={};
        if(n>9){
            [r,g,b,a]=d=d.split(","),n=d.length;
            if(n<3||n>4)return null;
            x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
        }else{
            if(n==8||n==6||n<4)return null;
            if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
            d=i(d.slice(1),16);
            if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
            else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
        }return x};
    h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
    if(!f||!t)return null;
    if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
    else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
    a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
    if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
    else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

// Collision detection helper
function circleCollidesRect ( circle, rect ) {
	
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
	var distance = getDistance( unrotatedCircleX, unrotatedCircleY, closestX, closestY );
	
	if ( distance < circle.radius ) {
		collision = true;
	}
	else {
		collision = false;
	}

	return collision;
}

function getDistance( fromX, fromY, toX, toY ) {
	var dX = Math.abs( fromX - toX );
	var dY = Math.abs( fromY - toY );

	return Math.sqrt( ( dX * dX ) + ( dY * dY ) );
}

function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

const mapRange = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;