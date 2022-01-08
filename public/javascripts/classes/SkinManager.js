class SkinManager {
    constructor() {
        // Skin Loader
        this.loader = new THREE.TextureLoader();
        this.loader.setPath("textures/entity/");

        this.skins = {};
        this.currentSkin = null;

        this.loadSkin('steve');
        this.loadSkin('alex');
    }

    getSkin(name) {
        return this.skins[name];
    }

    loadSkin(name) {
        this.skins[name] = {};

        let self = this;
        this.loader.load(name + '.png', (texture) => {
            self.skins[name].atlas = texture.image;

            this.loadHead(name);
            this.loadBody(name);
            this.loadArm(name);
            this.loadLeg(name);
            this.loadArmC(name);
        });
    }

    createMat(name, x, y, w, h, rotate) {
        let atlas = this.skins[name].atlas;

        let canvas = document.createElement("canvas");
        let ctx_ = canvas.getContext("2d");
        ctx_.imageSmoothingEnabled = false;
        if (rotate) {
            canvas.width = h;
            canvas.height = w;
            ctx_.translate(4, 4);
            ctx_.rotate(-90 * Math.PI / 180);
            ctx_.translate(0, -4);
            ctx_.drawImage(atlas, x, y, canvas.height, canvas.width, 0, 0, canvas.height, canvas.width);
        } else {
            canvas.width = w || 8;
            canvas.height = h || 8;
            ctx_.drawImage(atlas, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        }

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide })
    }

    loadHead(name) {
        this.skins[name].head = [];
        this.skins[name].head.push(
            this.createMat(name, 0, 8, 8, 8), // Right
            this.createMat(name, 16, 8, 8, 8), // Left
            this.createMat(name, 8, 0, 8, 8), // Top
            this.createMat(name, 16, 0, 8, 8), // Bottom
            this.createMat(name, 24, 8, 8, 8), // Back
            this.createMat(name, 8, 8, 8, 8), // Front
        )
    }

    loadBody(name) {
        let x = 16;
        let y = 16;
        this.skins[name].body = [];
        this.skins[name].body.push(
            this.createMat(name, x, y + 4, 4, 12), // Right
            this.createMat(name, x + 12, y + 4, 4, 12), // Left
            this.createMat(name, x + 4, y, 8, 4), // Top
            this.createMat(name, x + 12, y, 8, 4), // Bottom
            this.createMat(name, x + 16, y + 4, 8, 12), // Back
            this.createMat(name, x + 4, y + 4, 8, 12), // Front
        )
    }

    loadArm(name) {
        let x = 40;
        let y = 16;
        this.skins[name].arm = [];
        if (name == 'alex') { // Skinny arms
            this.skins[name].arm.push(
                this.createMat(name, x, y + 4, 4, 12), // Right
                this.createMat(name, x + 7, y + 4, 4, 12), // Left
                this.createMat(name, x + 4, y, 3, 4), // Top
                this.createMat(name, x + 7, y, 3, 4), // Bottom
                this.createMat(name, x + 10, y + 4, 3, 12), // Back
                this.createMat(name, x + 4, y + 4, 3, 12), // Front
            )
        } else {
            this.skins[name].arm.push(
                this.createMat(name, x, y + 4, 4, 12), // Right
                this.createMat(name, x + 8, y + 4, 4, 12), // Left
                this.createMat(name, x + 4, y, 4, 4), // Top
                this.createMat(name, x + 8, y, 4, 4), // Bottom
                this.createMat(name, x + 12, y + 4, 4, 12), // Back
                this.createMat(name, x + 4, y + 4, 4, 12), // Front
            )
        }
    }

    loadArmC(name) {
        let x = 40;
        let y = 16;
        this.skins[name].armC = [];
        this.skins[name].armC.push(
            this.createMat(name, x, y + 4, 4, 12, true), // Right
            this.createMat(name, x + 4, y, 4, 4), // Top
            this.createMat(name, x + 4, y, 4, 4), // Top
            this.createMat(name, x + 4, y + 4, 4, 12), // Front
            this.createMat(name, x + 4, y, 4, 4), // Top
            this.createMat(name, x + 4, y, 4, 4), // Top
        )
    }

    loadLeg(name) {
        let x = 0;
        let y = 16;
        this.skins[name].leg = [];
        this.skins[name].leg.push(
            this.createMat(name, x, y + 4, 4, 12), // Right
            this.createMat(name, x + 8, y + 4, 4, 12), // Left
            this.createMat(name, x + 4, y, 4, 4), // Top
            this.createMat(name, x + 8, y, 4, 4), // Bottom
            this.createMat(name, x + 12, y + 4, 4, 12), // Back
            this.createMat(name, x + 4, y + 4, 4, 12), // Front
        )
    }

}