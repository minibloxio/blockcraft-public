import * as THREE from "three";

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000);
export const scene = new THREE.Scene();

class ActiveItemScene {
  init() {
    scene.add(camera);
    // var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    // var cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // cube.position.z = -4;
    // camera.add(cube)
  }
}

const armItemRenderer = new ActiveItemScene();
export default armItemRenderer;
