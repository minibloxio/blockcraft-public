import * as THREE from "three";

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000000);
export const scene = new THREE.Scene();

class ActiveItemScene {
  init() {
    scene.add(camera);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.75);
    hemi.position.set(0, 5000, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight("white", 0.4);
    dir.position.set(0, 4000, 0);
    scene.add(dir);
  }
}

const activeItemScene = new ActiveItemScene();
export default activeItemScene;
