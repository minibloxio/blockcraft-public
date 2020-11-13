let world, cells;

self.addEventListener('message', e => {
  if (e.data.cellSize) {
    world = e.data;
  } else {
    cells = e.data;

    let result = [];

    for (let cell of cells) {
       let [cellX, cellY, cellZ, cellId] = cell;
       let geometryData = generateGeometryDataForCell(cellX, cellY, cellZ, world);

       result.push([geometryData, cellX, cellY, cellZ, cellId])
    }

    self.postMessage(result);
  }
});

let faces = [
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

function euclideanModulo(a,b){return(a%b+b)%b}

function computeVoxelOffset(x, y, z) {
    const {cellSize, cellSliceSize} = world;
    const voxelX = euclideanModulo(x, cellSize) | 0;
    const voxelY = euclideanModulo(y, cellSize) | 0;
    const voxelZ = euclideanModulo(z, cellSize) | 0;
    return voxelY * cellSliceSize +
           voxelZ * cellSize +
           voxelX;
}

function computeCellId(x, y, z) {
	const {cellSize} = world;
	const cellX = Math.floor(x / cellSize);
	const cellY = Math.floor(y / cellSize);
	const cellZ = Math.floor(z / cellSize);
	return `${cellX},${cellY},${cellZ}`;
	}

function getCellForVoxel(x, y, z) {
    return world.cells[computeCellId(x, y, z)];
}

function getVoxel(x, y, z) {
	const cell = getCellForVoxel(x, y, z);
	if (!cell) {
	  return -1;
	}
	const voxelOffset = computeVoxelOffset(x, y, z);
	return cell[voxelOffset];
}

function addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel) {
    const {cellSize, tileSize, tileTextureWidth, tileTextureHeight, blockSize} = world;

    const ndx = positions.length / 3;
    for (const {pos, uv} of corners) {
      let xPos = (pos[0] + x);
      let yPos = (pos[1] + y);
      let zPos = (pos[2] + z);

      positions.push(xPos*blockSize, yPos*blockSize, zPos*blockSize);
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

function generateGeometryDataForCell(cellX, cellY, cellZ, world) {

    const {cellSize, tileSize, tileTextureWidth, tileTextureHeight} = world;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const startX = cellX * cellSize;
    const startY = cellY * cellSize;
    const startZ = cellZ * cellSize;

    for (let y = 0; y < cellSize; ++y) {
      const voxelY = startY + y;
      for (let z = 0; z < cellSize; ++z) {
        const voxelZ = startZ + z;
        for (let x = 0; x < cellSize; ++x) {
          const voxelX = startX + x;
          const voxel = getVoxel(voxelX, voxelY, voxelZ);

          if (voxel <= 0)
            continue;

          // voxel 0 is sky (empty) so for UVs we start at 0
          const uvVoxel = voxel - 1;
          // There is a voxel here but do we need faces for it?
          if (voxel != 1 && voxel != world.blockId["ice"] && voxel != world.blockId["glass"]) {
            for (const {dir, corners, uvRow} of faces) {

              const neighbor = getVoxel(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (neighbor <= 1 || neighbor == 255 || ((neighbor == world.blockId["ice"] || neighbor == world.blockId["glass"]) && voxel != neighbor)) {
                // this voxel has no neighbor in this direction so we need a face.
                addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel)
              }

            }
          }

          if (voxel == 1 || voxel == world.blockId["ice"] || voxel == world.blockId["glass"]) { // Water
            for (const {dir, corners, uvRow} of faces) {

              const neighbor = getVoxel(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (neighbor == 0) {
                // this voxel has no neighbor in this direction so we need a face.
                addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel)
              }
            }
              
          }
        }
      }
    }

    return {
      positions,
      normals,
      uvs,
      indices,
    };
}