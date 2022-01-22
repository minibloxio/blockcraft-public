import * as THREE from "three";
import chunkManager from "../managers/ChunkManager";
import { scene } from "../globals";

class Fog {
  constructor() {
    // Fog
    //scene.fog = new THREE.Fog(0xffffff, 0, chunkManager.renderDistance * 256);
  }

  update() {
    // Update fog based on render distance
    // scene.fog.near = (chunkManager.renderDistance - 5) * 256;
    // scene.fog.far = (chunkManager.renderDistance - 4) * 256;
  }
}

const fog = new Fog();
globalThis.fog = fog;
export default fog;
