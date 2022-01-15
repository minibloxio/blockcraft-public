
import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000); // Camera
const scene = new THREE.Scene(); // Scene


// use an obj to hold global vars since imported vars are constants
let g = {}
g.loaded = 0;

let initialized = false;
let joined = false;

let players = {};

export { camera, scene, initialized, joined, players, g };