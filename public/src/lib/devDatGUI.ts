import { Object3D } from "three";
import * as dat from "dat.gui";

export function addDatControls(obj: Object3D, range: number = 3) {
  const gui = new dat.GUI({ width: 300, autoPlace: false });
  var GUIContainer = document.getElementById("gui");
  GUIContainer.appendChild(gui.domElement);
  let rotRange = Math.PI * 2;
  gui.add(obj.position, "x", -range, range).name("px");
  gui.add(obj.position, "y", -range, range).name("py");
  gui.add(obj.position, "z", -range, range).name("pz");
  gui.add(obj.rotation, "x", -rotRange, rotRange).name("rx");
  gui.add(obj.rotation, "y", -rotRange, rotRange).name("ry");
  gui.add(obj.rotation, "z", -rotRange, rotRange).name("rz");
  globalThis.data = () => {
    console.log(
      `const pos = new THREE.Vector3(${obj.position.x.toFixed(3)}, ${obj.position.y.toFixed(3)}, ${obj.position.z.toFixed(
        3
      )});\nconst rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(${obj.rotation.x.toFixed(3)}, ${obj.rotation.y.toFixed(
        3
      )}, ${obj.rotation.z.toFixed(3)}));`
    );
  };
}
