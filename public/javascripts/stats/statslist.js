import * as THREE from "three";
import Stat from "./StatsClass.js";
import game from '../classes/Game';
import player from '../classes/Player';
import world from "../classes/World.js";
import { g, camera } from '../globals';
import { renderer } from '../graphics/renderer';


let statistics = [];

// Initialize statistics
export function initStatistics() {
    statistics.push([
        new Stat("FPS", game, "fps", 0),
        new Stat("UPS", game, "ups", 1),
        new Stat("TPS", game, "tps", 1),
        new Stat("Ping", function (key) {
            return player[key] ? player[key].average() : 0;
        }, "ms", 1, "ping"),
    ]);
    statistics.push([
        new Stat("LT", function () {
            return game.logicTime;
        }, "ms", 2),
        new Stat("RT", function () {
            return game.renderTime;
        }, "ms", 2),
        new Stat("CT", function () {
            return game.canvasTime;
        }, "ms", 2),
        new Stat("Total", function () {
            return game.logicTime + game.canvasTime + game.renderTime;
        }, "ms", 2),
    ]);
    statistics.push([
        new Stat("RC", function () {
            return renderer.info.render.calls;
        }),
        new Stat("Tri", function () {
            return renderer.info.render.triangles / 1000;
        }, "k", 2),
        new Stat("F", function () {
            return renderer.info.render.frame;
        }),
    ]);
    statistics.push([
        new Stat("LIM", function () {
            if (!performance.memory) return 0;
            return performance.memory.jsHeapSizeLimit / 1048576;
        }, "mb", 0),
        new Stat("TOT", function () {
            if (!performance.memory) return 0;
            return performance.memory.totalJSHeapSize / 1048576;
        }, "mb", 0),
        new Stat("USED", function () {
            if (!performance.memory) return 0;
            return performance.memory.usedJSHeapSize / 1048576;
        }, "mb", 0),
        new Stat("INC", function () {
            if (!performance.memory) return 0;
            return game.memIncrease.average() / 1024;
        }, "kb", 0),
        new Stat("DEC", function () {
            if (!performance.memory) return 0;
            return game.memDecrease.average() / 1048576;
        }, "mb", 1),
    ]);
    statistics.push([
        new Stat("Geo", function () {
            return renderer.info.memory.geometries;
        }),
        new Stat("Tex", function () {
            return renderer.info.memory.textures;
        }),
    ]);
    statistics.push(new Stat("Server", game, "region"));
    statistics.push(new Stat("Socket ID", g.socket, "id"));
    statistics.push(new Stat("Token", game, "token"));
    statistics.push(new Stat("Gamemode", player, "mode"));
    statistics.push(new Stat("Pos", player.position, false, 1, function (pos) {
        return pos.clone().divideScalar(world.blockSize);
    }));
    statistics.push(new Stat("Chunk Pos", player.position, false, 0, function (pos) {
        return world.computeCellFromPlayer(pos.x, pos.y, pos.z);
    }));
    statistics.push(new Stat("Biome", player, "biome"));
    statistics.push(new Stat("Local Dir", player.direction, false, 1));
    statistics.push(new Stat("Local Vel", player.velocity, false, 1));
    statistics.push(new Stat("Speed", player, "speed", 2));
    statistics.push(new Stat("Fly", player, "fly"));
    statistics.push([
        new Stat("FOV", camera, "fov"),
        new Stat("Base", game, "fov"),
        new Stat("Delta", player, "deltaFov", 2)
    ]);
    statistics.push(new Stat("Facing", function () {
        let compass = new THREE.Vector3(0, 0, 0);
        camera.getWorldDirection(compass);
        if (Math.abs(compass.x) > Math.abs(compass.z)) {
            return compass.x > 0 ? "East  (→)" : "West  (←)";
        } else {
            return compass.z > 0 ? "South (↓)" : "North (↑)";
        }
    }));
}

export default statistics;