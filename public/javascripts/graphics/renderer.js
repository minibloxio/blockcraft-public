import * as THREE from "three";
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { camera, scene } from '../globals';
import stats from "../stats/stats"

let renderer;
let composer;
// Initalize the renderer
export function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Add statistics
  document.body.appendChild(stats.dom);

  // Add shader passes
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  document.body.appendChild(renderer.domElement);

  // Add a color shader
  let colorPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      color: { value: new THREE.Color(0x2e41f4) },
    },
    vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
            }
          `,
    fragmentShader: `
            uniform vec3 color;
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
              vec4 previousPassColor = texture2D(tDiffuse, vUv);
              gl_FragColor = vec4(
                  previousPassColor.rgb * color,
                  previousPassColor.a);
            }
          `,
  });
  colorPass.renderToScreen = true;
  colorPass.enabled = false;
  composer.addPass(colorPass);
}

export { renderer, composer }
