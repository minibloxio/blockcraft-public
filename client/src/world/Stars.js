import { scene } from "../globals";
import sun from "./Sun";
import { random, mapRange } from "../lib/helper";

class Stars {
  constructor() {
    // Add stars
    var vertices = [];

    for (var i = 0; i < 1000; i++) {
      let minRadius = sun.sunDist + 1;
      let radius = random(minRadius, minRadius * 2);
      var u = Math.random();
      var v = Math.random();
      var theta = 2 * Math.PI * u;
      var phi = Math.acos(2 * v - 1);
      var x = radius * Math.sin(phi) * Math.cos(theta);
      var y = radius * Math.sin(phi) * Math.sin(theta);
      var z = radius * Math.cos(phi);

      vertices.push(x, y, z);
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    var starMaterial = new THREE.PointsMaterial({ transparent: true, color: 0xffffff, size: 300 });

    this.stars = new THREE.Points(geometry, starMaterial);
    scene.add(this.stars);
  }

  update() {
    if (this.stars.visible) {
      let tick = game.tick.value || 1000;
      // Update stars transparency
      let opacityOffset = 0.1;
      let opacity = opacityOffset - Math.pow(Math.sin(tick * sun.daySpeed) / 2 + 0.5, 5);
      let clampedOpacity = mapRange(opacity > 0 ? opacity : 0, 0, opacityOffset, 0, 1);
      this.stars.material.opacity = clampedOpacity;

      // Update star rotation
      let starRotationSpeed = 0.001; // Default: 0.001
      let rotationAxis = new THREE.Vector3(1, 1, 1);
      rotationAxis.normalize();
      this.stars.setRotationFromAxisAngle(rotationAxis, tick * starRotationSpeed);
      this.stars.position.set(player.pos.x, player.pos.y, player.pos.z);
    }
  }
}

const stars = new Stars();
globalThis.stars = stars;
export default stars;
