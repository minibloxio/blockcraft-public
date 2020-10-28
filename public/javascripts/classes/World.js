function noise1(nx, ny) { return rng1.noise2D(nx, ny)/2 + 0.5; }
function noise2(nx, ny) { return rng2.noise2D(nx, ny)/2 + 0.5; }

class World {
  computeVoxelOffset(x, y, z) {
    const {cellSize, cellSliceSize} = this;
    const voxelX = THREE.MathUtils.euclideanModulo(x, cellSize) | 0;
    const voxelY = THREE.MathUtils.euclideanModulo(y, cellSize) | 0;
    const voxelZ = THREE.MathUtils.euclideanModulo(z, cellSize) | 0;
    return voxelY * cellSliceSize +
           voxelZ * cellSize +
           voxelX;
  }
  computeCellId(x, y, z) {
    const {cellSize} = this;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    const cellZ = Math.floor(z / cellSize);
    return `${cellX},${cellY},${cellZ}`;
  }
  computeCellFromPlayer(x, y, z) {
    const {cellSize} = this;
    const cellX = Math.floor(x / cellSize / this.blockSize);
    const cellY = Math.floor(y / cellSize / this.blockSize);
    const cellZ = Math.floor(z / cellSize / this.blockSize);
    return {
      x: cellX,
      y: cellY,
      z: cellZ,
      id: `${cellX},${cellY},${cellZ}`
    }
  }
  addCellForVoxel(x, y, z) {
    const cellId = this.computeCellId(x, y, z);
    let cell = this.cells[cellId];
    if (!cell) {
      const {cellSize} = this;
      cell = new Uint8Array(cellSize * cellSize * cellSize);
      this.cells[cellId] = cell;
    }
    return cell;
  }
  getCellForVoxel(x, y, z) {
    return this.cells[this.computeCellId(x, y, z)];
  }
  getCellPosFromId(id) {
    let pos = id.split(",")
    return {
      x: parseInt(pos[0]),
      y: parseInt(pos[1]),
      z: parseInt(pos[2])
    }
  }
  setVoxel(x, y, z, v, addCell = true) {
    let cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      if (!addCell) {
        return;
      }
      cell = this.addCellForVoxel(x, y, z);
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    cell[voxelOffset] = v;
  }
  getVoxel(x, y, z) {
    const cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      return 0;
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    return cell[voxelOffset];
  }

  blockToID(blockName) {
    return this.blockId[blockName]
  }

  generateCell(cellX, cellY, cellZ) {
    if (!this.cells[`${cellX},${cellY},${cellZ}`]) { // Check if chunk already exists
      const {cellSize} = this;
      this.cells[`${cellX},${cellY},${cellZ}`] = new Uint8Array(Math.pow(cellSize, 3))
    }
  }

  deleteCell(chunk, permanently) {
    delete this.cells[chunk.id];
    let object = scene.getObjectByName(chunk.id);
    if (object) {
      object.visible = false;
      if (permanently) {
        object.geometry.dispose();
        object.material.dispose();
        scene.remove(object);
      }
    }
  }

  generateGeometryDataForItem(uvVoxel) {
    const {cellSize, tileSize, tileTextureWidth, tileTextureHeight} = this;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // There is a voxel here but do we need faces for it?
    for (const {dir, corners, uvRow} of World.faces) {
      // this voxel has no neighbor in this direction so we need a face.
      const ndx = positions.length / 3;
      for (const {pos, uv} of corners) {
        positions.push((pos[0]*this.blockSize/4), (pos[1]*this.blockSize/4), (pos[2]*this.blockSize/4));
        normals.push(...dir);
        uvs.push(
              (uvVoxel +   uv[0]) * tileSize / tileTextureWidth,
          1 - (uvRow + 1 - uv[1]) * tileSize / tileTextureHeight);
      }
      indices.push(
        ndx, ndx + 1, ndx + 2,
        ndx + 2, ndx + 1, ndx + 3,
      );
    }

    return {
      positions,
      normals,
      uvs,
      indices,
    };
  }
}

World.faces = [
  { // left
    uvRow: 0,
    dir: [ -1,  0,  0, ],
    corners: [
      { pos: [ 0, 1, 0 ], uv: [ 0, 1 ], },
      { pos: [ 0, 0, 0 ], uv: [ 0, 0 ], },
      { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
      { pos: [ 0, 0, 1 ], uv: [ 1, 0 ], },
    ],
  },
  { // right
    uvRow: 0,
    dir: [  1,  0,  0, ],
    corners: [
      { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 1, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 1, 1 ], },
      { pos: [ 1, 0, 0 ], uv: [ 1, 0 ], },
    ],
  },
  { // bottom
    uvRow: 1,
    dir: [  0, -1,  0, ],
    corners: [
      { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
      { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 0, 0 ], uv: [ 1, 1 ], },
      { pos: [ 0, 0, 0 ], uv: [ 0, 1 ], },
    ],
  },
  { // top
    uvRow: 2,
    dir: [  0,  1,  0, ],
    corners: [
      { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
      { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 0, 1, 0 ], uv: [ 1, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 0, 0 ], },
    ],
  },
  { // back
    uvRow: 0,
    dir: [  0,  0, -1, ],
    corners: [
      { pos: [ 1, 0, 0 ], uv: [ 0, 0 ], },
      { pos: [ 0, 0, 0 ], uv: [ 1, 0 ], },
      { pos: [ 1, 1, 0 ], uv: [ 0, 1 ], },
      { pos: [ 0, 1, 0 ], uv: [ 1, 1 ], },
    ],
  },
  { // front
    uvRow: 0,
    dir: [  0,  0,  1, ],
    corners: [
      { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
      { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
      { pos: [ 0, 1, 1 ], uv: [ 0, 1 ], },
      { pos: [ 1, 1, 1 ], uv: [ 1, 1 ], },
    ],
  },
];

const neighborOffsets = [
  [ 0,  0,  0], // self
  [-1,  0,  0], // left
  [ 1,  0,  0], // right
  [ 0, -1,  0], // down
  [ 0,  1,  0], // up
  [ 0,  0, -1], // back
  [ 0,  0,  1], // front
];

let workerIndex = 0;
const cellIdToMesh = {};

function updateVoxelGeometry(x, y, z) {
  let {blockSize, cellSize} = world;

  let worldData = {
    cellSize: world.cellSize,
    cellSliceSize: world.cellSliceSize,
    tileSize: world.tileSize,
    tileTextureWidth: world.tileTextureWidth,
    tileTextureHeight: world.tileTextureHeight,
    blockSize: world.blockSize
  } 
  const updatedCellIds = {};

  let cells = [];

  let cellData = {};

  for (const offset of neighborOffsets) {
    const ox = (x + offset[0]);
    const oy = (y + offset[1]);
    const oz = (z + offset[2]);
    const cellId = world.computeCellId(ox, oy, oz);
    if (!updatedCellIds[cellId]) { // Don't reupdate the cell once updated
      updatedCellIds[cellId] = true;

      const cellX = Math.floor(ox / cellSize);
      const cellY = Math.floor(oy / cellSize);
      const cellZ = Math.floor(oz / cellSize);

      cellData[cellId] = world.cells[cellId];

      cells.push([cellX, cellY, cellZ, cellId]);
    }
  }

  voxelWorkers[workerIndex].postMessage([worldData, cellData, cells])
  workerIndex += 1;
  if (workerIndex == voxelWorkers.length) {
    workerIndex = 0;
  }
}

async function updateVoxelMesh(e) {
  let cells = e.data;

  for (let cell of cells) {
    await updateCellMesh({data: cell})
  }

}

function updateCellMesh(e) {
  let {blockSize, cellSize} = world;
  var [{positions, normals, uvs, indices}, cellX, cellY, cellZ, cellId] = e.data;

  let mesh = cellIdToMesh[cellId];
  const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();

  const positionNumComponents = 3;
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
  const normalNumComponents = 3;
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
  const uvNumComponents = 2;
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  if (!mesh) {
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = cellId;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cellIdToMesh[cellId] = mesh;
    scene.add(mesh);
    mesh.position.set(cellX * cellSize * blockSize, cellY * cellSize * blockSize, cellZ * cellSize * blockSize);
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Add entity

function addEntity(entity) {
  
  if (entity.type == "item") {
    /*// Item sprites
    var map = loader.load( "./diamond-sword.png" );
    var material = new THREE.SpriteMaterial( { map: map} );
    world.entities[entity.id] = entity;
    world.entities[entity.id].mesh = new THREE.Sprite( material );
    world.entities[entity.id].mesh.name = "item"
    world.entities[entity.id].mesh.position.set(0, blockSize*75, 0);
    world.entities[entity.id].mesh.scale.set(blockSize, blockSize, 1);
    scene.add( world.entities[entity.id].mesh );*/
    let uvVoxel = entity.v-1;
    var item_geometry = new THREE.BufferGeometry();
      const {positions, normals, uvs, indices} = world.generateGeometryDataForItem(uvVoxel);
      const positionNumComponents = 3;
    item_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    const normalNumComponents = 3;
    item_geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    const uvNumComponents = 2;
    item_geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
    item_geometry.setIndex(indices);
    item_geometry.computeBoundingSphere();
    var item_mesh = new THREE.Mesh(item_geometry, material);
    item_mesh.name = "item"
    item_mesh.position.set(entity.pos.x, entity.pos.y, entity.pos.z);

    world.entities[entity.id] = entity;
    world.entities[entity.id].mesh = item_mesh;
    world.entities[entity.id].mesh.castShadow = true;
    world.entities[entity.id].mesh.receiveShadow = true;

    scene.add(world.entities[entity.id].mesh);
  } else if (entity.type == "remove_item") {
    world.entities[entity.id].mesh.geometry.dispose();
    world.entities[entity.id].mesh.material.dispose();
    scene.remove(world.entities[entity.id].mesh);
    delete world.entities[entity.id];
  }
}