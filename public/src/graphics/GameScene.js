import { scene, camera } from "../globals"

class GameRenderer {
  init() {
    // TODO not have these in globals
    this.camera = camera
    this.scene = scene
  }
}

const gameRenderer = new GameRenderer();
export default gameRenderer;
