import * as THREE from 'three';

const pixelSize = 1 / 16 * 2;

class ArmItem {

    constructor() {
        this.root = new THREE.Group()
        this.pixels = new Array(256);
        const axesHelper = new THREE.AxesHelper(5);
        this.root.add(axesHelper);
        const mat = new THREE.MeshLambertMaterial({ color: 0x696969 })
        const geo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);

        for (let z = 0; z < 16; z++) {
            for (let y = 0; y < 16; y++) {
                const pixel = new THREE.Mesh(geo, mat);
                pixel.position.z = z * pixelSize;
                pixel.position.y = y * pixelSize;
                this.root.add(pixel)
                this.pixels[z * 16 + y] = pixel
            }
        }
    }

    updateItem(canvas) {
        const pixels = canvas.getContext("2d").getImageData(0, 0, 16, 16).data;
        for (var i = 0, n = pixels.length; i < n; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            this.pixels[i / 4].material = new THREE.MeshLambertMaterial({ color: new THREE.Color(`rgb(${r}, ${g}, ${b})`) })
            this.pixels[i / 4].visible = a != 0;
        }
    }
}

const armItem = new ArmItem();
export default armItem;
