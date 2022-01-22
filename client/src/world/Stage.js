import fog from "./Fog";
import sun from "./Sun";
import stars from "./Stars";
import sky from "./Sky";
import lighting from "./Lighting";
import clouds from "./Clouds";

class Stage {
  update() {
    stars.update();
    sun.update();
    lighting.update();
    clouds.update();
    sky.update();
    fog.update();
  }
}

const stage = new Stage();
globalThis.stage = stage;
export default stage;
