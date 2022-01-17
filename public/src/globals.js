
import * as THREE from 'three';
import Ola from "ola";
import { io } from "socket.io-client";

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000); // Camera
const scene = new THREE.Scene(); // Scene
globalThis.scene = scene;
const serverNames = {
    "gold": "Gold Server (formerly North America East)",
    "coal": "Coal Server (formerly North America West)",
    "iron": "Iron Server (formerly Europe West)",
    "wood": "Wood Server (New map!)",
}
const serverList = Object.keys(serverNames).map((x) => `https://${x}.blockcraft.online`)
const connectionDelay = 2000;
let players = {};


// use an obj to hold global vars since imported vars are constants
let g = {}
g.loaded = 0;
g.servers = {};
g.currentServer = undefined;
g.socket = io({
    autoConnect: false,
    forceNew: true,
    reconnectionAttempts: 2,
});
g.initialized = false;
g.joined = false;
g.state = 0;
g.loadedAnimate = new Ola(0);
g.maxLoaded = 6;
g.disconnectedAnimate = new Ola(0);
g.maxDisconnected = 1;
g.maxChunks = 0; // Chunks need to be loaded before pointerlock can be enabled
g.cellIdToMesh = {};
g.elapse = 0;
g.delta = 0;
g.mouseLeft = false;
g.mouseRight = false;

globalThis.g = g;

let states = {
    "start": 0,
    "serverSelect": 1,
    "connecting": 2,
    "loading": 3,
    "loadingChunks": 4,
    "inGame": 5,
    "disconnecting": 6,
};

// Toolbar
export const toolbar = new Image();
toolbar.src = "./textures/hotbar.png";

export const toolbar_selector = new Image();
toolbar_selector.src = "./textures/hotbar-selector.png";

// Icons
export const icons = new Image()
icons.src = "./textures/gui/icons.png";

// console.log(`icons ${icons.}`)

export function isState(check) { return g.state == states[check]; }

export { camera, scene, players, g, serverNames, serverList, connectionDelay };
