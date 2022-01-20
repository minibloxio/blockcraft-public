import Cookies from "js-cookie";

class Game {
    constructor() {
        this.packetDelay = 16;
        this.lastPacket = Date.now();
        this.numOfVoxelWorkers = 2;
        this.guiSize = 1;
        this.tick = 0;
        this.lastUpdate = Date.now();
        this.updates = [];
        this.fpsList = [];
        this.memIncrease = [];
        this.memDecrease = [];
        this.depthWrite = false;
        this.invertMouse = false;

        this.initCookies();
    }

    initCookies() {
        this.token = Cookies.get("token") || "";
        this.fov = Cookies.get("fov") || 75;
        this.debug = Cookies.get("debug") || false;
        this.transparentLeaves = Cookies.get("transparentLeaves");
    }

    update() {

    }

    startMemoryMonitor() {
        if (!performance.memory) return;
        this.prevTotalMem = performance.memory.totalJSHeapSize;
        this.prevUsedMem = performance.memory.usedJSHeapSize;
    }

    endMemoryMonitor() {
        if (!performance.memory) return;
        let currTotalMem = performance.memory.totalJSHeapSize;
        let currUsedMem = performance.memory.usedJSHeapSize;
        if (this.prevTotalMem < currTotalMem) {
            this.memIncrease.push(currTotalMem - this.prevTotalMem);
            if (this.memIncrease.length > 50) this.memIncrease.shift();
        }
        if (this.prevUsedMem > currUsedMem) {
            let decrease = this.prevUsedMem - currUsedMem;
            if (Number.isInteger(decrease)) this.memDecrease.push(decrease);
            if (this.memDecrease.length > 1) this.memDecrease.shift();
        }
    }
}
const game = new Game();
globalThis.game = game;
export default game;
