let colorShader = {
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
};

// Toolbar
let toolbar = new Image();
toolbar.src = "./textures/hotbar.png";
let toolbar_selector = new Image();
toolbar_selector.src = "./textures/hotbar-selector.png";

// Icons
let icons = new Image()
icons.src = "./textures/gui/icons.png";