import * as THREE from "three";
import Ola from "ola";
import game from "../Game";
import world from "./WorldManager";
import textureManager from "./TextureManager";
import { scene } from "../globals";

class EntityManager {
  constructor() {}

  // Get the canvas for the entity
  getCanvas(type, width = 16, height = 16) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let atlas = textureManager.getTextureAtlas(type);
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx, atlas };
  }

  // Convert the canvas texture to a material
  textureToMat(canvas, options = {}) {
    let texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      depthWrite: options.depthWrite || false,
      side: THREE.DoubleSide,
    });
  }

  // Get the material
  getMat(width, height, offX = 0, offY = 0) {
    let { canvas, ctx, atlas } = this.getCanvas("entity", width, height);
    ctx.drawImage(atlas, offX, offY, width, height, 0, 0, width, height);
    return this.textureToMat(canvas);
  }

  // Add item mesh to the scene
  addToScene(entity, mesh, type) {
    let entities = world.entities;
    let id = entity.id;

    entities[id] = entity;
    if (type == "arrow") {
      entities[id].mesh = mesh;
      mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
    } else {
      entities[id].mesh = new THREE.Group();
      if (type == "block") mesh.position.set(-2, 0, -2);
      if (type == "item") mesh.position.set(0, 0, 0);

      entities[id].bbox = new THREE.BoxHelper(mesh, 0xffff00);
      entities[id].bbox.matrixAutoUpdate = true;
      entities[id].bbox.visible = false;
      entities[id].bbox.visible = game.debug || false;
      entities[id].mesh.add(entities[id].bbox);
      entities[id].mesh.add(mesh);
    }
    mesh.name = "item";

    scene.add(entities[id].mesh);
  }

  // Add entity to the world
  addEntity(entity) {
    let { blockSize } = world;
    if (entity.type == "item") {
      if (!entity.pos) return;

      if (entity.vel) entity.vel = new Ola({ x: entity.vel.x, y: entity.vel.y, z: entity.vel.z });

      if (entity.name == "arrow") {
        let dir = new THREE.Vector3(entity.vel.x, entity.vel.y, entity.vel.z).normalize();
        let mx = new THREE.Matrix4().lookAt(dir, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
        entity.qt = new THREE.Quaternion().setFromRotationMatrix(mx);

        let mat = this.getMat(16, 5, 0, 0); // Arrow side
        let mat2 = this.getMat(5, 5, 0, 5); // Arrow back
        mat.depthWrite = true;
        mat2.depthWrite = true;

        let arrow = new THREE.Group();
        let arrow1 = new THREE.Mesh(new THREE.PlaneBufferGeometry(16, 5), mat);
        let arrow2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(16, 5), mat);
        let arrow3 = new THREE.Mesh(new THREE.PlaneBufferGeometry(5, 5), mat2);

        arrow1.rotation.y = -Math.PI / 2;
        arrow2.rotation.x = -Math.PI / 2;
        arrow2.rotation.z = -Math.PI / 2;
        arrow3.position.z = -7;

        arrow.add(arrow1, arrow2, arrow3);
        entity.bbox = new THREE.BoxHelper(arrow, 0xffff00);
        entity.bbox.visible = game.debug || false;
        arrow.add(entity.bbox);

        arrow.setRotationFromQuaternion(entity.qt);

        this.addToScene(entity, arrow, "arrow");
      } else if (entity.class == "item") {
        // Add item
        let { canvas, ctx, atlas } = this.getCanvas("item");
        ctx.drawImage(atlas, (entity.v - 1) * 16, 0, 16, 16, 0, 0, 16, 16);
        let mat = this.textureToMat(canvas);

        let itemSize = blockSize / 4;
        let throwables = ["ender_pearl", "fireball", "snowball", "egg"]; // TODO: Turn this into a singleton
        if (throwables.includes(entity.name)) itemSize = blockSize / 2;
        let item_mesh = new THREE.Mesh(new THREE.PlaneGeometry(itemSize, itemSize), mat);
        item_mesh.renderOrder = 1;
        this.addToScene(entity, item_mesh, "item");
      } else {
        // Add block
        let uvVoxel = entity.v - 1;
        let block_geometry = new THREE.BufferGeometry();
        const { positions, normals, uvs, indices } = world.generateGeometryDataForItem(uvVoxel);
        block_geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
        block_geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
        block_geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
        block_geometry.setIndex(indices);
        block_geometry.computeBoundingSphere();

        let block_mesh = new THREE.Mesh(block_geometry, textureManager.materialTransparent);
        block_mesh.castShadow = true;
        block_mesh.receiveShadow = true;
        this.addToScene(entity, block_mesh, "block");
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

  // Add new entities to the world
  addEntities(entities) {
    for (let entity of entities) {
      this.addEntity(entity);
    }
  }

  // Update the entities based on the server's state
  updateEntities(entities) {
    for (let id in entities) {
      let entity = entities[id];
      if (entity.type == "item" && world.entities[id]) {
        world.entities[id].onObject = entity.onGround;

        if (entity.name == "arrow" && !entity.onObject) {
          world.entities[id].pos = entity.pos;
          world.entities[id].vel.set(entity.vel);
        } else {
          world.entities[id].pos = entity.pos;
        }

        if (world.entities[id].mesh && world.entities[id].mesh.position.length() == 0) {
          world.entities[id].mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
        }
      }
    }
  }
}
const entityManager = new EntityManager();
export default entityManager;
