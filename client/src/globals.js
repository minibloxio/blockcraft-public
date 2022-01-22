import * as THREE from "three";
import Ola from "ola";
import { io } from "socket.io-client";

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000); // Camera
globalThis.camera = camera;
const scene = new THREE.Scene(); // Scene
globalThis.scene = scene;
const connectionDelay = 2000;
export const sessionServerEndpoint = "https://session.blockcraft.online/servers/list";

let players = {};
globalThis.players = players;

globalThis.THREE = THREE;

// use an obj to hold global vars since imported vars are constants
let g = {};
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
g.maxChunks = 0; // Chunks that need to be loaded before pointerlock can be enabled
g.cellIdToMesh = {};
g.elapse = 0;
g.delta = 0;
g.mouseLeft = false;
g.mouseRight = false;
g.commandIndex = -1;
g.enableZoom = false;
g.zoomLevel = 3;
g.refreshRate = -1;

globalThis.g = g;

let states = {
  start: 0,
  serverSelect: 1,
  connecting: 2,
  loading: 3,
  loadingChunks: 4,
  inGame: 5,
  disconnecting: 6,
};

// compute refresh rate after things have loaded
setTimeout(() => {
  const raf = requestAnimationFrame;
  new Promise((r) => raf((t1) => raf((t2) => r(1000 / (t2 - t1))))).then((fps) => {
    g.refreshRate = fps;
  });
}, 3000);

// Toolbar
export const toolbar = new Image();
toolbar.src = "./textures/hotbar.png";

export const toolbar_selector = new Image();
toolbar_selector.src = "./textures/hotbar-selector.png";

// Icons
export const icons = new Image();
icons.src = "./textures/gui/icons.png";

export function isState(check) {
  return g.state == states[check];
}

globalThis.g = g;

export { camera, scene, players, g, connectionDelay };
