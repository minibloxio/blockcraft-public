
import * as THREE from 'three';
import Ola from "ola";
import { io } from "socket.io-client";

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000); // Camera
const scene = new THREE.Scene(); // Scene
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

let states = {
    "start": 0,
    "serverSelect": 1,
    "connecting": 2,
    "loading": 3,
    "loadingChunks": 4,
    "inGame": 5,
    "disconnecting": 6,
};

export function isState(check) { return g.state == states[check]; }

export { camera, scene, players, g, serverNames, serverList, connectionDelay };

