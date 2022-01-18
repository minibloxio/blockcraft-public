import { Object3D } from "three";
import * as dat from "dat.gui";

export function addDatControls(obj: Object3D) {
  const gui = new dat.GUI({ width: 700 });
  gui.add(obj.position, "x", -3, 3).name("px");
  gui.add(obj.position, "y", -3, 3).name("py");
  gui.add(obj.position, "z", -3, 3).name("pz");
  gui.add(obj.rotation, "x", -Math.PI, Math.PI).name("rx");
  gui.add(obj.rotation, "y", -Math.PI, Math.PI).name("ry");
  gui.add(obj.rotation, "z", -Math.PI, Math.PI).name("rz");
  globalThis.data = () => {
    console.log(
      `const pos = new THREE.Vector3(${obj.position.x.toFixed(3)}, ${obj.position.y.toFixed( 3)}, ${obj.position.z.toFixed( 3)});\nconst rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(${obj.rotation.x.toFixed( 3)}, ${obj.rotation.y.toFixed(3)}, ${obj.rotation.z.toFixed(3)}));`
    );
  };
}
