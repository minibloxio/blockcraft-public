
import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000); // Camera
const scene = new THREE.Scene(); // Scene

const initialized = 0;

export { camera, scene };
