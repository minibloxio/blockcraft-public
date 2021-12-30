// Load static images
let full_heart = new Image()
full_heart.src = "./textures/hearts/full.png";
let half_heart = new Image()
half_heart.src = "./textures/hearts/half.png";
let empty_heart = new Image()
empty_heart.src = "./textures/hearts/empty.png";

let toolbar = new Image();
toolbar.src = "./textures/hotbar.png";
let toolbar_selector = new Image();
toolbar_selector.src = "./textures/hotbar-selector.png";

// Texture Loader
let loader  = new THREE.TextureLoader();
	loader.setPath("textures/");

// Head

let head_front = new Texture(loader, './skin/head/front.png');
let head_top = new Texture(loader, './skin/head/top.png');
let head_right = new Texture(loader, './skin/head/right.png');
let head_left = new Texture(loader, './skin/head/left.png');
let head_back = new Texture(loader, './skin/head/back.png');
let head_bottom = new Texture(loader, './skin/head/bottom.png');
let head_materials = [
    head_right.material,
    head_left.material,
    head_top.material,
    head_bottom.material,
    head_back.material,
    head_front.material
];

let head = new Texture(loader, "head", head_materials );

// Body
let body_front = new Texture(loader, './skin/body/front.png');
let body_back = new Texture(loader, './skin/body/back.png');
let body_top = new Texture(loader, './skin/body/top.png');
let body_bottom = new Texture(loader, './skin/body/bottom.png');
let body_right = new Texture(loader, './skin/body/right.png');
let body_left = new Texture(loader, './skin/body/left.png');

let body_materials = [
    body_right.material,
    body_left.material,
    body_top.material,
    body_bottom.material,
    body_back.material,
    body_front.material
];

let body = new Texture(loader, "body", body_materials );

// Arm
let arm_front = new Texture(loader, './skin/arm/front.png');
let arm_back = new Texture(loader, './skin/arm/back.png');
let arm_top = new Texture(loader, './skin/arm/top.png');
let arm_bottom = new Texture(loader, './skin/arm/bottom.png');
let arm_right = new Texture(loader, './skin/arm/right.png');
let arm_left = new Texture(loader, './skin/arm/left.png');
let arm_right_side = new Texture(loader, './skin/arm/rightSide.png');

let arm_materials = [
    arm_right.material,
    arm_left.material,
    arm_top.material,
    arm_bottom.material,
    arm_back.material,
    arm_front.material
];

let arm = new Texture(loader, "arm", arm_materials );



// Side arm (for client player)
let arm_frontC = new Texture(loader, './skin/arm/front.png');
let arm_backC = new Texture(loader, './skin/arm/back.png');
let arm_topC = new Texture(loader, './skin/arm/top.png');
let arm_leftC = new Texture(loader, './skin/arm/left.png');
let arm_right_sideC = new Texture(loader, './skin/arm/rightSide.png');

let armC_materials = [
    arm_right_sideC.material,
    arm_leftC.material,
    arm_topC.material,
    arm_frontC.material,
    arm_backC.material,
    arm_frontC.material
];
let armC = new Texture(loader, "armC", armC_materials );

// Leg
let leg_front = new Texture(loader, './skin/leg/front.png');
let leg_back = new Texture(loader, './skin/leg/back.png');
let leg_top = new Texture(loader, './skin/leg/top.png');
let leg_bottom = new Texture(loader, './skin/leg/bottom.png');
let leg_right = new Texture(loader, './skin/leg/right.png');
let leg_left = new Texture(loader, './skin/leg/left.png');

let leg_materials = [
    leg_right.material,
    leg_left.material,
    leg_top.material,
    leg_bottom.material,
    leg_back.material,
    leg_front.material
];

let leg = new Texture(loader, "leg", leg_materials );

function getPlayerTextures() {
    let headMat = [];
    head.material.forEach(function (mat) {
        headMat.push(mat.clone());
    })

    let bodyMat = [];
    body.material.forEach(function (mat) {
        bodyMat.push(mat.clone());
    })

    let armMat = [];
    arm.material.forEach(function (mat) {
        armMat.push(mat.clone());
    })
    
    let armCMat = [];
    armC.material.forEach(function (mat) {
        armCMat.push(mat.clone());
    })

    let legMat = [];
    leg.material.forEach(function (mat) {
        legMat.push(mat.clone());
    })

    return {
        head: headMat,
        body: bodyMat,
        arm: armMat,
        armC: armCMat,
        leg: legMat
    }
}