import * as THREE from 'three';
import textureManager from '../managers/TextureManager';
import player from '../Player';
import { camera } from './ActiveItemScene';

const TO_RAD = Math.PI / 180;
const pixelSize = 1 / 16 * 2;
const itemSize = 16;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = itemSize;
canvas.height = itemSize;

// tool start pos
const posStart = new THREE.Vector3(1.5, -0.5, -3);
const rotStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(60 * TO_RAD, 0, 0))

// tool end pos
const posEnd = new THREE.Vector3(0.7, -2, -4.5);
const rotEnd = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.41, 0.24, 0.24))

// tool block pos
const posBlock = new THREE.Vector3(-0.20, -2.2, -2.36)
const rotBlock = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.49, 1.53, -0.54))

class ActiveItemVoxels {

    constructor() {
        this.pixels = new Array(256);
        this.currentItem = undefined;
        this.root = new THREE.Group()
        // const axesHelper = new THREE.AxesHelper(5);
        // this.root.add(axesHelper);
        this.root.position.copy(posStart)
        this.root.quaternion.copy(rotStart)

        camera.add(this.root)
        const mat = new THREE.MeshBasicMaterial()
        const geo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);

        for (let z = 0; z < 16; z++) {
            for (let y = 0; y < 16; y++) {
                const pixel = new THREE.Mesh(geo, mat);
                pixel.receiveShadow = true
                pixel.position.z = z * pixelSize;
                pixel.position.y = y * pixelSize;
                this.root.add(pixel)
                this.pixels[z * 16 + y] = pixel
            }
        }
    }

    updateItem() {
        let item = player.getCurrItem();
        if (!item || item.class != "item" || item.c <= 0) {
            this.root.visible = false
            return;
        }

        if (item == this.currentItem) return


        this.root.visible = true
        this.currentItem = item

        let atlas = textureManager.getTextureAtlas(item.class);
        ctx.clearRect(0, 0, itemSize, itemSize);
        ctx.drawImage(atlas, (item.v - 1) * itemSize, (player.bowCharge ? player.bowCharge : 0) * itemSize, itemSize, itemSize, 0, 0, itemSize, itemSize);


        const pixels = canvas.getContext("2d").getImageData(0, 0, 16, 16).data;
        for (var i = 0, n = pixels.length; i < n; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            this.pixels[i / 4].material = new THREE.MeshLambertMaterial({ color: new THREE.Color(`rgb(${r}, ${g}, ${b})`) })
            this.pixels[i / 4].visible = a !== 0;
        }
    }

    update() {
        // Move hand
        const timeSincePunch = Date.now() - player.punching;
        const punchLerp = timeSincePunch / 130;

        if (player.blocking) {
            this.root.position.copy(posBlock)
            this.root.quaternion.copy(rotBlock)
        } else if (punchLerp < 1) { // Forward animatipon
            this.root.position.lerpVectors(posStart, posEnd, punchLerp);
            this.root.quaternion.slerpQuaternions(rotStart, rotEnd, punchLerp)
        } else if (punchLerp < 2) { // Reverse animation
            this.root.position.lerpVectors(posEnd, posStart, punchLerp - 1);
            this.root.quaternion.slerpQuaternions(rotEnd, rotStart, punchLerp - 1)
        } else {
            this.root.position.copy(posStart)
            this.root.quaternion.copy(rotStart)
        }
    }
}

const armItem = new ActiveItemVoxels();
export default armItem;
