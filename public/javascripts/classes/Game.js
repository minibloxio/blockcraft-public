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
        this.depthWrite = false;

        this.initCookies();
    }

    initCookies() {
        this.token = getCookie("token") || "";
        this.fov = getCookie("fov") || 75;
        this.debug = getCookie("debug") || false;
        this.transparentLeaves = getCookie("transparentLeaves");
    }
}