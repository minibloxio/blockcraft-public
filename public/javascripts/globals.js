
import * as THREE from 'three';
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

let joined = false;

let players = {};

let state = 0; // State of where the player is in the authentication process (0: Start Menu, 1: Server Select, 2: Connecting to Server, 3: Loading Game, 4: Loading Chunks, 5: In Game, 6: Disconnecting)
let states = {
    "start": 0,
    "serverSelect": 1,
    "connecting": 2,
    "loading": 3,
    "loadingChunks": 4,
    "inGame": 5,
    "disconnecting": 6,
};

export function isState(check) { return state == states[check]; }

export { camera, scene, joined, players, g, serverNames, serverList, connectionDelay };

