import * as THREE from "three";

class ArmItemRenderer {
  init() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000);
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // document.body.appendChild(this.renderer.domElement);
    var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    var cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.z = -4;
    // this.camera.add(cube)
  }
}

const armItemRenderer = new ArmItemRenderer();
export default armItemRenderer;
