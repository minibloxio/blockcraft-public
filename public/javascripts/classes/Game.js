class Game {
    constructor() {
        this.token = getCookie("token") || "";
        this.packetDelay = 16;
        this.lastPacket = Date.now();
        this.numOfVoxelWorkers = 2;
        this.guiSize = 1;
        this.transparentLeaves = getCookie("transparentLeaves");
        this.tick = 0;
        this.lastUpdate = Date.now();
        this.updates = [];
        this.fpsList = [];
        this.depthWrite = false;
        this.fov = getCookie("fov") || 75;
        this.debug = getCookie("debug") || false;
    }
}