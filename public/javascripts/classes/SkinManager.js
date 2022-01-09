class SkinManager {
    constructor() {
        // Skin Loader
        this.loader = new THREE.TextureLoader();

        this.skins = {};
        this.armor = {};
        this.currentSkin = null;

        this.loadSkin('steve');
        this.loadSkin('alex');

        this.loadArmor('leather'); // 1
        this.loadArmor('gold'); // 2
        this.loadArmor('chainmail'); // 3
        this.loadArmor('iron'); // 4
        this.loadArmor('diamond'); // 5

        this.armorOrder = [null, 'leather', 'gold', 'chainmail', 'iron', 'diamond'];
    }

    getSkin(name) {
        return this.skins[name];
    }

    getArmor(name) {
        return this.armor[name];
    }

    // Load skin textures
    loadSkin(name) {
        this.loader.setPath("textures/entity/");
        this.skins[name] = {};

        let skin = this.skins[name];
        this.loader.load(name + '.png', (texture) => {
            skin.atlas = texture.image;
            skin.name = name;

            SkinManager.loadHead(skin);
            SkinManager.loadBody(skin);
            SkinManager.loadArm(skin);
            SkinManager.loadLeg(skin);
            SkinManager.loadArmClient(skin);
        });
    }

    // Load armor textures
    loadArmor(name) {
        this.loader.setPath("textures/models/armor/");
        this.armor[name] = {};

        let armor = this.armor[name];
        armor.name = name;
        armor.isArmor = true;

        this.loader.load(name + '_layer_1.png', (texture) => {
            armor.atlas = texture.image;
            SkinManager.loadHead(armor);
            SkinManager.loadBody(armor);
            SkinManager.loadArmPlates(armor);
            SkinManager.loadBoots(armor);
        });

        this.loader.load(name + '_layer_2.png', (texture) => {
            armor.atlas2 = texture.image;
            SkinManager.loadLeggings(armor);
            SkinManager.loadLeggingsTop(armor);
        });
    }

    // Create material from canvas texture
    static createMat(skin, x, y, w, h, options = {}, type = {}) {
        let atlas = type.leggings ? skin.atlas2 : skin.atlas;

        let canvas = document.createElement("canvas");
        let ctx_ = canvas.getContext("2d");
        ctx_.imageSmoothingEnabled = false;
        if (options.rotate) {
            canvas.width = h;
            canvas.height = w;
            ctx_.translate(4, 4);
            ctx_.rotate(-90 * Math.PI / 180);
            ctx_.translate(0, -4);
            ctx_.drawImage(atlas, x, y, canvas.height, canvas.width, 0, 0, canvas.height, canvas.width);
        } else if (skin.name == 'leather') {
            canvas.width = w || 8;
            canvas.height = h || 8;

            ctx_.drawImage(atlas, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
            let imageData = ctx_.getImageData(0, 0, canvas.width, canvas.height);

            textureManager.tintImageData(imageData.data, [89, 56, 36]);
            ctx_.putImageData(imageData, 0, 0);
        } else {
            canvas.width = w || 8;
            canvas.height = h || 8;
            ctx_.drawImage(atlas, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        }

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        let notTransparent = (type.leggings || type.boots) && skin.name != 'chainmail';
        return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide, transparent: (skin.isArmor && !notTransparent) ? true : false });
    }

    // HEAD
    static loadHead(skin) {
        skin.head = [];
        skin.head.push(
            SkinManager.createMat(skin, 0, 8, 8, 8), // Right
            SkinManager.createMat(skin, 16, 8, 8, 8), // Left
            SkinManager.createMat(skin, 8, 0, 8, 8), // Top
            SkinManager.createMat(skin, 16, 0, 8, 8), // Bottom
            SkinManager.createMat(skin, 24, 8, 8, 8), // Back
            SkinManager.createMat(skin, 8, 8, 8, 8), // Front
        )
    }

    // BODY
    static loadBody(skin) {
        let x = 16;
        let y = 16;
        skin.body = [];
        skin.body.push(
            SkinManager.createMat(skin, x, y + 4, 4, 12), // Right
            SkinManager.createMat(skin, x + 12, y + 4, 4, 12), // Left
            SkinManager.createMat(skin, x + 4, y, 8, 4), // Top
            SkinManager.createMat(skin, x + 12, y, 8, 4), // Bottom
            SkinManager.createMat(skin, x + 16, y + 4, 8, 12), // Back
            SkinManager.createMat(skin, x + 4, y + 4, 8, 12), // Front
        )
    }

    // ARM
    static loadArm(skin) {
        let x = 40;
        let y = 16;
        skin.arm = [];
        if (skin.name == 'alex') { // Skinny arms
            skin.arm.push(
                SkinManager.createMat(skin, x, y + 4, 4, 12), // Right
                SkinManager.createMat(skin, x + 7, y + 4, 4, 12), // Left
                SkinManager.createMat(skin, x + 4, y, 3, 4), // Top
                SkinManager.createMat(skin, x + 7, y, 3, 4), // Bottom
                SkinManager.createMat(skin, x + 10, y + 4, 3, 12), // Back
                SkinManager.createMat(skin, x + 4, y + 4, 3, 12), // Front
            )
        } else {
            skin.arm.push(
                SkinManager.createMat(skin, x, y + 4, 4, 12), // Right
                SkinManager.createMat(skin, x + 8, y + 4, 4, 12), // Left
                SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
                SkinManager.createMat(skin, x + 8, y, 4, 4), // Bottom
                SkinManager.createMat(skin, x + 12, y + 4, 4, 12), // Back
                SkinManager.createMat(skin, x + 4, y + 4, 4, 12), // Front
            )
        }
    }

    // CLIENT ARM
    static loadArmClient(skin) {
        let x = 40;
        let y = 16;
        skin.armC = [];
        skin.armC.push(
            SkinManager.createMat(skin, x, y + 4, 4, 12, { rotate: true }), // Right
            SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
            SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
            SkinManager.createMat(skin, x + 4, y + 4, 4, 12), // Front
            SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
            SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
        )
    }

    // ARM PLATES
    static loadArmPlates(skin) {
        let x = 40;
        let y = 16;
        skin.armPlates = [];
        if (skin.name == 'alex') { // Skinny arms
            skin.armPlates.push(
                SkinManager.createMat(skin, x, y + 4, 4, 5), // Right
                SkinManager.createMat(skin, x + 7, y + 4, 4, 5), // Left
                SkinManager.createMat(skin, x + 4, y, 3, 4), // Top
                SkinManager.createMat(skin, x + 7, y, 3, 4), // Bottom
                SkinManager.createMat(skin, x + 10, y + 4, 3, 5), // Back
                SkinManager.createMat(skin, x + 4, y + 4, 3, 5), // Front
            )
        } else {
            skin.armPlates.push(
                SkinManager.createMat(skin, x, y + 4, 4, 5), // Right
                SkinManager.createMat(skin, x + 8, y + 4, 4, 5), // Left
                SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
                SkinManager.createMat(skin, x + 8, y, 4, 4), // Bottom
                SkinManager.createMat(skin, x + 12, y + 4, 4, 5), // Back
                SkinManager.createMat(skin, x + 4, y + 4, 4, 5), // Front
            )
        }
    }

    // LEGS
    static loadLeg(skin, isBoots) {
        let x = 0;
        let y = 16;
        skin.leg = [];
        skin.leg.push(
            SkinManager.createMat(skin, x, y + 4, 4, 12), // Right
            SkinManager.createMat(skin, x + 8, y + 4, 4, 12), // Left
            SkinManager.createMat(skin, x + 4, y, 4, 4), // Top
            SkinManager.createMat(skin, x + 8, y, 4, 4), // Bottom
            SkinManager.createMat(skin, x + 12, y + 4, 4, 12), // Back
            SkinManager.createMat(skin, x + 4, y + 4, 4, 12), // Front
        )
    }

    // LEGGINGS TOP
    static loadLeggingsTop(skin) {
        let x = 16;
        let y = 27;

        let type = {
            leggings: true,
        }

        skin.leggingsTop = [];
        skin.leggingsTop.push(
            SkinManager.createMat(skin, x, y, 4, 5, false, type), // Right
            SkinManager.createMat(skin, x + 12, y, 4, 5, false, type), // Left
            { side: THREE.FrontSide }, // Top
            { side: THREE.FrontSide }, // Bottom
            SkinManager.createMat(skin, x + 16, y, 8, 5, false, type), // Back
            SkinManager.createMat(skin, x + 4, y, 8, 5, false, type), // Front
        )
    }

    // LEGGINGS BOTTOM
    static loadLeggings(skin) {
        let x = 0;
        let y = 16;

        let type = {
            leggings: true
        }

        skin.leggings = [];
        skin.leggings.push(
            SkinManager.createMat(skin, x, y + 4, 4, 9, false, type), // Right
            SkinManager.createMat(skin, x + 8, y + 4, 4, 9, false, type), // Left
            SkinManager.createMat(skin, x + 4, y, 4, 4, false, type), // Top
            SkinManager.createMat(skin, x + 8, y, 4, 4, false, type), // Bottom
            SkinManager.createMat(skin, x + 12, y + 4, 4, 9, false, type), // Back
            SkinManager.createMat(skin, x + 4, y + 4, 4, 9, false, type), // Front
        )
    }

    // BOOTS
    static loadBoots(skin) {
        let x = 0;
        let y = 16;

        let type = {
            boots: true
        }

        skin.boots = [];
        skin.boots.push(
            SkinManager.createMat(skin, x, y + 10, 4, 6, false, type), // Right
            SkinManager.createMat(skin, x + 8, y + 10, 4, 6, false, type), // Left
            { side: THREE.FrontSide }, // Top
            SkinManager.createMat(skin, x + 8, y, 4, 4, false, type), // Bottom
            SkinManager.createMat(skin, x + 12, y + 10, 4, 6, false, type), // Back
            SkinManager.createMat(skin, x + 4, y + 10, 4, 6, false, type), // Front
        )
    }

}