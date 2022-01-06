class EntityManager {
    constructor () {

    }

    getCanvas(type, width = 16, height = 16) {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let atlas = textureManager.getTextureAtlas(type);
        canvas.width = width;
        canvas.height = height;
        return {canvas, ctx, atlas};
    }

    textureToMat(canvas, options = {}) {
        let texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.MeshLambertMaterial({
            map: texture, 
            transparent: true, 
            depthWrite: options.depthWrite || false, 
            side: THREE.DoubleSide});
    }

    getMat(width, height, offX = 0, offY = 0) {
        let {canvas, ctx, atlas} = this.getCanvas("entity", width, height);
        ctx.drawImage(atlas, offX, offY, width, height, 0, 0, width, height);
        return this.textureToMat(canvas);
    }

    addToScene(entity, mesh) {
        mesh.name = "item";
        mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);

        world.entities[entity.id] = entity;
        world.entities[entity.id].mesh = mesh;

        scene.add(world.entities[entity.id].mesh)
    }

    addEntity(entity) {
        let {blockSize} = world;

        if (entity.vel) entity.vel = new Ola({x: entity.vel.x, y: entity.vel.y, z: entity.vel.z});

        if (entity.type == "item") {
            if (!entity || !entity.pos) return;
            if (entity.name == "arrow") {
                
                let vel = new THREE.Vector3(entity.vel.x, entity.vel.y, entity.vel.z);
                vel.normalize();
                let dir = new THREE.Vector3(vel.x, vel.y, vel.z);
                var mx = new THREE.Matrix4().lookAt(dir,new THREE.Vector3(0,0,0),new THREE.Vector3(0,1,0));
                var qt = new THREE.Quaternion().setFromRotationMatrix(mx);

                let mat = this.getMat(16, 5, 0, 0); // Arrow side
                let mat2 = this.getMat(5, 5, 0, 5); // Arrow back
                mat.depthWrite = true;
                mat2.depthWrite = true;
                
                let arrow = new THREE.Group();
                let arrow1 = new THREE.Mesh(new THREE.PlaneBufferGeometry(16, 5), mat);
                let arrow2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(16, 5), mat);
                let arrow3 = new THREE.Mesh(new THREE.PlaneBufferGeometry(5, 5), mat2);
                arrow1.rotation.y = -Math.PI/2;

                arrow2.rotation.x = -Math.PI/2;
                arrow2.rotation.z = -Math.PI/2;
                arrow3.position.z = -7;

                arrow.add(arrow1, arrow2, arrow3);
                arrow.setRotationFromQuaternion(qt);

                this.addToScene(entity, arrow);
            } else if (entity.class == "item") { // Add item
                let {canvas, ctx, atlas} = this.getCanvas("item");
                ctx.drawImage(atlas, (entity.v-1)*16, 0, 16, 16, 0, 0, 16, 16);
                let mat = this.textureToMat(canvas);
    
                let itemSize = blockSize/4;
                if (throwables.includes(entity.name)) itemSize = blockSize/2;
                let item_mesh = new THREE.Mesh(new THREE.PlaneGeometry(itemSize, itemSize), mat);
                item_mesh.renderOrder = 1;
                this.addToScene(entity, item_mesh);
            } else {  // Add block
                let uvVoxel = entity.v-1;
                let block_geometry = new THREE.BufferGeometry();
                const {positions, normals, uvs, indices} = world.generateGeometryDataForItem(uvVoxel);
                block_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
                block_geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
                block_geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
                block_geometry.setIndex(indices);
                block_geometry.computeBoundingSphere();
    
                let block_mesh = new THREE.Mesh(block_geometry, textureManager.materialTransparent);
                block_mesh.castShadow = true;
                block_mesh.receiveShadow = true;
                this.addToScene(entity, block_mesh);
            }
        } else if (entity.type == "remove_item" && world.entities[entity.id] && world.entities[entity.id].mesh) {
            let mesh = world.entities[entity.id].mesh;
            if (mesh.type == "Group") {
                for (let i = 0; i < mesh.children.length; i++) {
                    let child = mesh.children[i];
                    child.geometry.dispose();
                    child.material.dispose();
                }
                scene.remove(mesh);
            } else {
                mesh.geometry.dispose();
                mesh.material.dispose();
                scene.remove(mesh);
            }
            
            delete world.entities[entity.id];
        }
    }
}