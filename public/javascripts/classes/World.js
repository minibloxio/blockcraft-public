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
      cell = new Uint8Array(new SharedArrayBuffer(cellSize * cellSize * cellSize));
      this.cells[cellId] = cell;
    }
    return cell;
  }
  getCellForVoxel(x, y, z) {
    if (!this.cells) return;
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

  generateCell(cellX, cellY, cellZ) {
    if (!this.cells[`${cellX},${cellY},${cellZ}`]) { // Check if chunk already exists
      const {cellSize} = this;
      this.cells[`${cellX},${cellY},${cellZ}`] = new Uint8Array(Math.pow(cellSize, 3)).fill(255)
    }
  }

  deleteChunk(chunk, permanently) {
    for (let i = 0; i < world.buildHeight/this.cellSize+1; i++) {
      let id = `${chunk.x},${i},${chunk.z}`

      this.deleteCell(id, permanently);
    }
  }

  deleteCell(id, permanently) {
    if (cellIdToMesh[id]) {
      cellIdToMesh[id][0].visible = false;
      cellIdToMesh[id][1].visible = false;

      // Delete cell permanently
      if (permanently) {
        cellIdToMesh[id][0].geometry.dispose();
        cellIdToMesh[id][0].material.dispose();
        scene.remove(cellIdToMesh[id][0]);

        cellIdToMesh[id][1].geometry.dispose();
        cellIdToMesh[id][1].material.dispose();
        scene.remove(cellIdToMesh[id][1]);

        delete cellIdToMesh[id];
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

const cellIdToMesh = {};

const neighborOffsets = [
  [ 0,  0,  0], // self
  [-1,  0,  0], // left
  [ 1,  0,  0], // right
  [ 0, -1,  0], // down
  [ 0,  1,  0], // up
  [ 0,  0, -1], // back
  [ 0,  0,  1], // front
];

function updateVoxelGeometry(x, y, z, neighbor) {
  let {cellSize} = world;

  let cells = [];
  const updatedCellIds = {};

  for (let offset of neighborOffsets) {
    const ox = (x + offset[0]);
    const oy = (y + offset[1]);
    const oz = (z + offset[2]);
    const cellId = world.computeCellId(ox, oy, oz);

    if (!updatedCellIds[cellId]) { // Don't reupdate the cell once updated
      updatedCellIds[cellId] = true;

      const cellX = Math.floor(ox / cellSize);
      const cellY = Math.floor(oy / cellSize);
      const cellZ = Math.floor(oz / cellSize);

      cells.push([cellX, cellY, cellZ, cellId]);
    }

    if (!neighbor)
      break;
  }

  voxelWorkers[voxelWorkerIndex].postMessage(cells)
  voxelWorkerIndex += 1;
  if (voxelWorkerIndex == voxelWorkers.length) {
    voxelWorkerIndex = 0;
  }
}

function updateCellMesh(data) {
  let {blockSize, cellSize} = world;
  var [opaqueGeometry, cellX, cellY, cellZ, cellId, transparentGeometry] = data;
  let mesh, meshT;

  if (cellIdToMesh[cellId]) {
    mesh = cellIdToMesh[cellId][0];
    meshT = cellIdToMesh[cellId][1];
  } else {
    cellIdToMesh[cellId] = [];
  }

  // OPAQUE TEXTURES
  if (data) {
    const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();

    const positionNumComponents = 3;
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(opaqueGeometry.positions), positionNumComponents));
    const normalNumComponents = 3;
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(opaqueGeometry.normals), normalNumComponents));
    const uvNumComponents = 2;
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(opaqueGeometry.uvs), uvNumComponents));
    geometry.setIndex(opaqueGeometry.indices);
    geometry.computeBoundingSphere();

    if (!mesh) {
      mesh = new THREE.Mesh(geometry, material);
      mesh.name = cellId;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      cellIdToMesh[cellId][0] = mesh;
      mesh.position.set(cellX * cellSize * blockSize, cellY * cellSize * blockSize, cellZ * cellSize * blockSize);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      scene.add(mesh);

      if (opaqueGeometry.positions.length > 0) {
      }
    }
  }

  // TRANSPARENT TEXTURES
  if (data) {
    const geometry = meshT ? meshT.geometry : new THREE.BufferGeometry();

    const positionNumComponents = 3;
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(transparentGeometry.positions), positionNumComponents));
    const normalNumComponents = 3;
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(transparentGeometry.normals), normalNumComponents));
    const uvNumComponents = 2;
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(transparentGeometry.uvs), uvNumComponents));
    geometry.setIndex(transparentGeometry.indices);
    geometry.computeBoundingSphere();

    if (!meshT) {
      meshT = new THREE.Mesh(geometry, materialTransparent);
      meshT.name = cellId;
      meshT.castShadow = true;
      meshT.receiveShadow = true;
      cellIdToMesh[cellId][1] = meshT;
      meshT.position.set(cellX * cellSize * blockSize, cellY * cellSize * blockSize, cellZ * cellSize * blockSize);
      meshT.matrixAutoUpdate = false;
      meshT.updateMatrix();
      scene.add(meshT);

      if (transparentGeometry.positions.length > 0) {
      }
    }
  }
}