import textureManager from "../managers/TextureManager";
import { scene } from "../globals";
import game from "../Game";
import player from "../Player";
import lighting from "./Lighting";

class Sun {
  constructor() {
    // Sun
    this.sun = textureManager.loadSprite("./sun.png", 16 * 16 * 16);
    this.moon = textureManager.loadSprite("./moon.png", 16 * 16 * 16);
    this.daySpeed = 1 / (12000 / Math.PI); // Default: 0.001

    this.sunDist = 50000; // Default: 50000
    this.offset = new THREE.Vector3(this.sunDist, 0, 0);
    scene.add(this.sun);
    scene.add(this.moon);
  }

  update() {
    let tick = game.tick.value || 1000;
    // Update sun position
    this.offset.x = Math.cos(tick * this.daySpeed) * this.sunDist;
    this.offset.y = Math.sin(tick * this.daySpeed) * this.sunDist;

    var sun = player.pos.clone();
    sun.y = 0;
    sun.add(this.offset.clone());
    lighting.dir.position.set(sun.x, sun.y, sun.z); // Update directional light
    this.sun.position.set(sun.x, sun.y, sun.z);
    this.sun.lookAt(this.sun.position);

    if (lighting.dir.enableShadow) {
      if (this.offset.y < 0) {
        lighting.dir.castShadow = false;
      } else {
        lighting.dir.castShadow = true;
      }
    }

    var moon = player.pos.clone();
    moon.y = 0;
    moon.add(this.offset.clone().multiplyScalar(-1));
    lighting.dirM.position.set(moon.x, moon.y, moon.z);
    this.moon.position.set(moon.x, moon.y, moon.z);
    this.moon.lookAt(this.moon.position);
  }
}

const sun = new Sun();
export default sun;
