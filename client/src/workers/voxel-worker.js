let world, cells;
let result = [];

let colors = [
  "black",
  "blue",
  "brown",
  "cyan",
  "gray",
  "green",
  "blue",
  "light_blue",
  "lime",
  "magenta",
  "orange",
  "pink",
  "purple",
  "red",
  "silver",
  "white",
  "yellow",
];
let woodTypes = ["spruce", "birch", "jungle", "acacia", "big_oak"];
let transparentBlocks = [];

function updateTransparentBlocks(includeLeaves) {
  transparentBlocks = ["water", "glass", "ice", "cake", "mob_spawner", "slime"];
  for (let color of colors) {
    transparentBlocks.push("glass_" + color);
  }
  if (includeLeaves) {
    transparentBlocks.push("leaves_oak");
    for (let woodType of woodTypes) {
      transparentBlocks.push("leaves_" + woodType);
    }
  }
}

self.addEventListener("message", (e) => {
  if (e.data.type == "updateTransparency") {
    updateTransparentBlocks(e.data.transparentLeaves);
    return;
  }

  if (e.data.type == "reset") {
    result = [];
    cells.length = 0;
    world.cells.length = 0;
    return;
  }

  if (e.data.cellSize) {
    world = e.data;
  } else if (!e.data.cellSize && e.data.cells) {
    for (let cellId in e.data.cells) {
      world.cells[cellId] = e.data.cells[cellId];
    }
  } else {
    cells = e.data;

    result.length = 0;

    for (let cell of cells) {
      let [cellX, cellY, cellZ, forceUpdate] = cell;
      let geometryData = generateGeometryDataForCell(cellX, cellY, cellZ, world);
      let geometryDataT = generateGeometryDataForCell(cellX, cellY, cellZ, world, true);

      result.push([geometryData, cellX, cellY, cellZ, geometryDataT, forceUpdate]);
    }

    self.postMessage(result);
  }
});

const faces = [
  {
    // left
    uvRow: 0,
    dir: [-1, 0, 0],
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
    index: 0,
  },
  {
    // right
    uvRow: 0,
    dir: [1, 0, 0],
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
    index: 1,
  },
  {
    // bottom
    uvRow: 1,
    dir: [0, -1, 0],
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
    index: 2,
  },
  {
    // top
    uvRow: 2,
    dir: [0, 1, 0],
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
    index: 3,
  },
  {
    // back
    uvRow: 0,
    dir: [0, 0, -1],
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
    index: 4,
  },
  {
    // front
    uvRow: 0,
    dir: [0, 0, 1],
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
    index: 5,
  },
];

function euclideanModulo(a, b) {
  return ((a % b) + b) % b;
}

function computeVoxelOffset(x, y, z) {
  const { cellSize, cellSliceSize } = world;
  const voxelX = euclideanModulo(x, cellSize) | 0;
  const voxelY = euclideanModulo(y, cellSize) | 0;
  const voxelZ = euclideanModulo(z, cellSize) | 0;
  return voxelY * cellSliceSize + voxelZ * cellSize + voxelX;
}

function computeCellId(x, y, z) {
  const { cellSize } = world;
  const cellX = Math.floor(x / cellSize);
  const cellY = Math.floor(y / cellSize);
  const cellZ = Math.floor(z / cellSize);
  return cellX + "," + cellY + "," + cellZ;
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

// left, right, bottom, top, back, front
const customFaceBlocks = {
  furnace: [0, 1, 2, 2, 1, 1],
};

function addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel, index) {
  const { tileSize, tileTextureWidth, tileTextureHeight, blockSize } = world;

  let customFace = customFaceBlocks[world.blockOrder[uvVoxel]];
  if (customFace) uvRow = customFace[index];

  const ndx = positions.length / 3;
  for (const { pos, uv } of corners) {
    // Get position relative to the cell
    let xPos = pos[0] + x;
    let yPos = pos[1] + y;
    let zPos = pos[2] + z;

    positions.push(xPos * blockSize, yPos * blockSize, zPos * blockSize);
    normals.push(...dir);
    uvs.push(((uvVoxel + uv[0]) * tileSize) / tileTextureWidth, 1 - ((uvRow + 1 - uv[1]) * tileSize) / tileTextureHeight);
  }
  indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
}

// Check if is transparent
function isTransparent(voxel) {
  return transparentBlocks.includes(world.blockOrder[voxel - 1]);
}

function generateGeometryDataForCell(cellX, cellY, cellZ, world, transparent) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const { cellSize } = world;
  const startX = cellX * cellSize;
  const startY = cellY * cellSize;
  const startZ = cellZ * cellSize;

  for (let y = 0; y < cellSize; ++y) {
    const voxelY = startY + y;
    for (let z = 0; z < cellSize; ++z) {
      const voxelZ = startZ + z;
      for (let x = 0; x < cellSize; ++x) {
        const voxelX = startX + x;
        const voxel = getVoxel(voxelX, voxelY, voxelZ); // Get voxel value at current position
        if (voxel <= 0) continue; // Skip empty voxels
        const uvVoxel = voxel - 1;
        let transparentTexture = isTransparent(voxel);

        // OPAQUE TEXTURES
        if (!transparent && !transparentTexture) {
          for (const { dir, corners, uvRow, index } of faces) {
            const neighbor = getVoxel(voxelX + dir[0], voxelY + dir[1], voxelZ + dir[2]);
            if (neighbor <= 0 || neighbor == 255 || (isTransparent(neighbor) && voxel != neighbor)) {
              // this voxel has no neighbor in this direction so we need a face.
              addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel, index);
            }
          }
        }

        // TRANSPARENT TEXTURES
        if (transparent && transparentTexture) {
          // Water
          for (const { dir, corners, uvRow } of faces) {
            const neighbor = getVoxel(voxelX + dir[0], voxelY + dir[1], voxelZ + dir[2]);
            if (neighbor == 0 || neighbor == 255 || (isTransparent(neighbor) && voxel != neighbor)) {
              // this voxel has no neighbor in this direction so we need a face.
              addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel);
            }
          }
        }
      }
    }
  }

  let positionBuffer = new Float32Array(new ArrayBuffer(positions.length * 4));
  let normalBuffer = new Float32Array(new ArrayBuffer(normals.length * 4));
  let uvBuffer = new Float32Array(new ArrayBuffer(uvs.length * 4));
  let indexBuffer = new Uint16Array(new ArrayBuffer(indices.length * 2));

  positionBuffer.set(positions);
  normalBuffer.set(normals);
  uvBuffer.set(uvs);
  indexBuffer.set(indices);

  return {
    positions: positionBuffer,
    normals: normalBuffer,
    uvs: uvBuffer,
    indices: indexBuffer,
  };
}
