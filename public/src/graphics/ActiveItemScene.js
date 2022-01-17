import * as THREE from "three";

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000);
export const scene = new THREE.Scene();

class ActiveItemScene {
  init() {
    scene.add(camera);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.75);
    hemi.position.set(0, 5000, 0);
    scene.add(hemi);

    scene.add(new THREE.DirectionalLight("white", 1));
  }
}

const armItemRenderer = new ActiveItemScene();
export default armItemRenderer;
