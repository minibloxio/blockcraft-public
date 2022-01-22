import { scene } from "../globals";
import game from "../Game";
import sun from "./Sun";
import { mapRange } from "../lib/helper";

class Lighting {
  constructor() {
    // Add hemisphere
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    this.hemi.position.set(0, 5000, 0);
    scene.add(this.hemi);

    // Add sun directional light
    this.dir = new THREE.DirectionalLight("orange", 1);
    scene.add(this.dir);
    this.dir.target = player.controls.getObject();
    this.dir.castShadow = false; //SHADOW
    this.dir.enableShadow = false;

    // Add shadow
    var d = 1000;
    this.dir.shadow.mapSize.width = 1024 * 4;
    this.dir.shadow.mapSize.height = 1024 * 4;
    this.dir.shadow.camera.left = -d;
    this.dir.shadow.camera.right = d;
    this.dir.shadow.camera.top = d;
    this.dir.shadow.camera.bottom = -d;
    this.dir.updateMatrix();
    this.dir.updateMatrixWorld();

    this.dir.shadow.camera.far = 1000000;
    this.dir.shadow.camera.near = 0;
    this.dir.shadow.bias = -0.0001;

    // Add moon directional light
    this.dirM = new THREE.DirectionalLight("white", 0.5);
    scene.add(this.dirM);
  }

  update() {
    // Update hemisphere light based on sun height
    let intensity = sun.offset.y / sun.sunDist / 2 + 0.5;
    this.dir.intensity = intensity;
    this.dirM.intensity = 0.5 - intensity / 2;

    let clampedIntensity = mapRange(intensity, 0, 1, 0.3, 0.7);
    this.hemi.intensity = clampedIntensity;
  }
}

const lighting = new Lighting();
export default lighting;
