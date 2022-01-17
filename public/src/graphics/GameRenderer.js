import * as THREE from "three";
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { camera, scene } from '../globals';

class GameRenderer {
  set renderUnderWater(x) {
    this.colorPass.enabled = x;
  }

  get renderUnderWater() {
    return this.colorPass.enabled;
  }

  init(canvas) {
    this._isUnderWater = false
    this.renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: false, canvas: canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // Add shader passes
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    document.body.appendChild(this.renderer.domElement);

    // Add a color shader
    this.colorPass = new ShaderPass({
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
    this.composer.addPass(this.colorPass);
    this.colorPass.renderToScreen = true;
    this.colorPass.enabled = false;
  }

  resize() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  render(scene, camera) {
    this.composer.render(scene, camera)
  }
}

const gameRenderer = new GameRenderer();
export default gameRenderer;
