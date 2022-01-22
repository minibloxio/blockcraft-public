import world from "../world/WorldManager";
import player from "../Player";
import chunkManager from "../managers/ChunkManager";

class Clouds {
  constructor() {
    this.clouds = [];
  }

  generateClouds(type) {
    let { blockSize, cellSize } = world;

    for (let cloud of this.clouds) {
      scene.remove(cloud);
    }

    this.clouds = [];

    if (type == "add") {
      this.clouds = [];

      for (let i = 0; i < 100; i++) {
        let cloud = new THREE.Mesh(
          new THREE.BoxGeometry(Math.random() * 200 + 100, 16, Math.random() * 200 + 100),
          new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true })
        );
        cloud.name = "cloud";
        let renderDistance = blockSize * cellSize * chunkManager.renderDistance;
        cloud.position.set(
          Math.random() * 3000 - renderDistance + player.pos.x,
          Math.random() * 200 + blockSize * 100,
          Math.random() * 3000 - renderDistance + player.pos.z
        );
        scene.add(cloud);

        this.clouds.push(cloud);
      }
    }
  }

  update() {
    const { blockSize } = world;
    // Check for cloud generation
    if (this.generate == this.showClouds) {
      this.generate = !this.generate;
      if (this.showClouds) this.generateClouds("add");
      else this.generateClouds("remove");
    }

    // Move clouds
    let renderDistance = blockSize * world.cellSize * chunkManager.renderDistance;
    for (let cloud of this.clouds) {
      cloud.position.add(new THREE.Vector3(0.3, 0, 0));
      if (cloud.position.x > renderDistance + player.pos.x) cloud.position.x = -renderDistance + player.pos.x;
      else if (cloud.position.x < -renderDistance + player.pos.x) cloud.position.x = renderDistance + player.pos.x;

      if (cloud.position.z > renderDistance + player.pos.z) cloud.position.z = -renderDistance + player.pos.z;
      else if (cloud.position.z < -renderDistance + player.pos.z) cloud.position.z = renderDistance + player.pos.z;
    }
  }
}

const clouds = new Clouds();
export default clouds;
