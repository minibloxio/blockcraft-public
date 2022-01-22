import * as THREE from "three";
import { statsManager, Stat } from "./StatsManager.js";
import game from "../Game";
import player from "../Player";
import world from "../world/WorldManager.js";
import { g, camera } from "../globals";
import masterRenderer from "../graphics/MasterRenderer";

globalThis.masterRenderer = masterRenderer;

// Initialize statistics
export function initStatistics() {
  statsManager.addStat([
    new Stat("FPS", game, "fps", 0),
    new Stat("UPS", game, "ups", 1),
    new Stat("TPS", game, "tps", 1),
    new Stat(
      "Ping",
      function (key) {
        return player[key] ? player[key].average() : 0;
      },
      "ms",
      1,
      "ping"
    ),
  ]);
  statsManager.addStat([
    new Stat(
      "LT",
      function () {
        return game.logicTime;
      },
      "ms",
      2
    ),
    new Stat(
      "RT",
      function () {
        return game.renderTime;
      },
      "ms",
      2
    ),
    new Stat(
      "CT",
      function () {
        return game.canvasTime;
      },
      "ms",
      2
    ),
    new Stat(
      "Total",
      function () {
        return game.logicTime + game.canvasTime + game.renderTime;
      },
      "ms",
      2
    ),
  ]);
  statsManager.addStat([
    new Stat("RC", function () {
      return masterRenderer.renderer.info.render.calls;
    }),
    new Stat(
      "Tri",
      function () {
        return masterRenderer.renderer.info.render.triangles / 1000;
      },
      "k",
      2
    ),
    new Stat("F", function () {
      return masterRenderer.renderer.info.render.frame;
    }),
  ]);
  statsManager.addStat([
    new Stat(
      "LIM",
      function () {
        if (!performance.memory) return 0;
        return performance.memory.jsHeapSizeLimit / 1048576;
      },
      "mb",
      0
    ),
    new Stat(
      "TOT",
      function () {
        if (!performance.memory) return 0;
        return performance.memory.totalJSHeapSize / 1048576;
      },
      "mb",
      0
    ),
    new Stat(
      "USED",
      function () {
        if (!performance.memory) return 0;
        return performance.memory.usedJSHeapSize / 1048576;
      },
      "mb",
      0
    ),
    new Stat(
      "INC",
      function () {
        if (!performance.memory) return 0;
        return game.memIncrease.average() / 1024;
      },
      "kb",
      0
    ),
    new Stat(
      "DEC",
      function () {
        if (!performance.memory) return 0;
        return game.memDecrease.average() / 1048576;
      },
      "mb",
      1
    ),
  ]);
  statsManager.addStat([
    new Stat("Geo", function () {
      return masterRenderer.renderer.info.memory.geometries;
    }),
    new Stat("Tex", function () {
      return masterRenderer.renderer.info.memory.textures;
    }),
  ]);
  statsManager.addStat(new Stat("Server", game, "region"));
  statsManager.addStat(new Stat("Socket ID", g.socket, "id"));
  statsManager.addStat(new Stat("Token", game, "token"));
  statsManager.addStat(new Stat("Gamemode", player, "mode"));
  statsManager.addStat(
    new Stat("Pos", player.pos, false, 1, function (pos) {
      return pos.clone().divideScalar(world.blockSize);
    })
  );
  statsManager.addStat(
    new Stat("Chunk Pos", player.pos, false, 0, function (pos) {
      return world.computeCellFromPlayer(pos.x, pos.y, pos.z);
    })
  );
  statsManager.addStat(new Stat("Biome", player, "biome"));
  statsManager.addStat(new Stat("Local Dir", player.direction, false, 1));
  statsManager.addStat(new Stat("Local Vel", player.velocity, false, 1));
  statsManager.addStat(
    new Stat("World Vel", false, false, 2, function () {
      return player.newMove;
    })
  );
  statsManager.addStat(new Stat("Speed", player, "speed", 2));
  statsManager.addStat(new Stat("Fly", player, "fly"));
  statsManager.addStat([new Stat("FOV", camera, "fov"), new Stat("Base", game, "fov"), new Stat("Delta", player, "deltaFov", 2)]);
  statsManager.addStat(
    new Stat("Facing", function () {
      let compass = new THREE.Vector3(0, 0, 0);
      camera.getWorldDirection(compass);
      if (Math.abs(compass.x) > Math.abs(compass.z)) {
        return compass.x > 0 ? "East  (→)" : "West  (←)";
      } else {
        return compass.z > 0 ? "South (↓)" : "North (↑)";
      }
    })
  );
}
