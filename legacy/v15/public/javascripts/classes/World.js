class World {
  constructor(options) {
    this.seed = undefined;

  	this.blockSize = 16;
    this.cellSize = options.cellSize;
    this.tileSize = options.tileSize;
    this.tileTextureWidth = options.tileTextureWidth;
    this.tileTextureHeight = options.tileTextureHeight;
    const {cellSize} = this;
    this.cellSliceSize = cellSize * cellSize;
    this.cells = {};

    this.buildHeight = cellSize * 9;

    this.entities = {};
  }
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
    const cellX = Math.floor(x / cellSize / blockSize);
    const cellY = Math.floor(y / cellSize / blockSize);
    const cellZ = Math.floor(z / cellSize / blockSize);
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
  setCell(data) {

  }
  generateCell(cellX, cellY, cellZ) {
    if (!this.cells[`${cellX},${cellY},${cellZ}`]) { // Check if chunk already exists
      const {cellSize} = this;

      let isEmpty = true;

      for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
          // Get cell offset
          let xPos = x + cellX * cellSize;
          let zPos = z + cellZ * cellSize;
          
          const height = Math.floor((noise.noise2D(xPos/30, zPos/30)+1)*5)+30;
          for (let y = 0; y < cellSize; ++y) {
            // Get cell offset for y
            let yPos = y + cellY * cellSize;
            let caveSparsity = 0.02;

            const cave = (noise.noise3D(xPos*0.05, yPos*caveSparsity, zPos*0.05)+1)/2;

            let blockID = 0;
           
            // Terrain generation
            if (cave > 0.1) {
              if (yPos == height) {
                blockID = blockToID("grass");

              } else if (yPos < height && yPos > height-3) {
                blockID = blockToID("dirt");
              } else if (yPos <= height-3 && yPos > 0) {
                blockID = blockToID("stone");
              }
            }

            if (yPos == 0) {
              blockID = blockToID("bedrock"); // Force bedrock layer
            }

            if (blockID > 0)
              isEmpty = false;

            this.setVoxel(xPos, yPos, zPos, blockID);
          }
        }
      }

      if (!isEmpty)
        updateCellGeometry(cellX * cellSize, cellY * cellSize, cellZ * cellSize);
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
  generateGeometryDataForCell(cellX, cellY, cellZ) {
    const {cellSize, tileSize, tileTextureWidth, tileTextureHeight} = this;
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
          const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
          if (voxel) {
            // voxel 0 is sky (empty) so for UVs we start at 0
            const uvVoxel = voxel - 1;
            // There is a voxel here but do we need faces for it?
            for (const {dir, corners, uvRow} of World.faces) {
              const neighbor = this.getVoxel(
                  voxelX + dir[0],
                  voxelY + dir[1],
                  voxelZ + dir[2]);
              if (!neighbor) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const {pos, uv} of corners) {
                  positions.push((pos[0] + x)*this.blockSize, (pos[1] + y)*this.blockSize, (pos[2] + z)*this.blockSize);
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
        positions.push((pos[0]*blockSize/4), (pos[1]*blockSize/4), (pos[2]*blockSize/4));
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
function updateCellGeometry(x, y, z) {

	const cellX = Math.floor(x / cellSize);
	const cellY = Math.floor(y / cellSize);
	const cellZ = Math.floor(z / cellSize);
	const cellId = world.computeCellId(x, y, z);
	let mesh = cellIdToMesh[cellId];
	const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();

	const {positions, normals, uvs, indices} = world.generateGeometryDataForCell(cellX, cellY, cellZ);
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

const neighborOffsets = [
	[ 0,  0,  0], // self
	[-1,  0,  0], // left
	[ 1,  0,  0], // right
	[ 0, -1,  0], // down
	[ 0,  1,  0], // up
	[ 0,  0, -1], // back
	[ 0,  0,  1], // front
];

function updateVoxelGeometry(x, y, z) {
	const updatedCellIds = {};
	for (const offset of neighborOffsets) {
		const ox = (x + offset[0]);
		const oy = (y + offset[1]);
		const oz = (z + offset[2]);
		const cellId = world.computeCellId(ox, oy, oz);
		if (!updatedCellIds[cellId]) { // Don't reupdate the cell once updated
			updatedCellIds[cellId] = true;
			updateCellGeometry(ox, oy, oz);
		}
	}
}

function randInt(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

let blockId = {
  "bedrock": 1,
  "stone": 2,
  "dirt": 3,
  "cobblestone": 4,
  "grass": 5,
  "wood": 6,
  "leaves": 7,
  "coal_ore": 8,
  "diamond_ore": 9,
  "iron_ore": 10,
  "gold_ore": 11,
  "crafting_table": 12,
  "planks": 13
}

var block = [];

function blockToID(blockName) {
  return blockId[blockName]
}

// Add the world

const texture_loader = new THREE.TextureLoader();
const texture = texture_loader.load('./textures/blocks/texture-atlas.png');
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;

const cellSize = 8;
const tileSize = 16;
const tileTextureWidth = 256;
const tileTextureHeight = 64;
const world = new World({
	cellSize,
	tileSize,
	tileTextureWidth,
	tileTextureHeight,
});

const {positions, normals, uvs, indices} = world.generateGeometryDataForCell(0, 0, 0);
const geometry = new THREE.BufferGeometry();
var material = new THREE.MeshLambertMaterial({
	map: texture,
	side: THREE.FrontSide,
	alphaTest: 0.1,
	transparent: true,
});

const positionNumComponents = 3;
const normalNumComponents = 3;
const uvNumComponents = 2;
geometry.setAttribute(
	'position',
	new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents)
);
geometry.setAttribute(
	'normal',
	new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
);
geometry.setAttribute(
	'uv',
	new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
);
geometry.setIndex(indices);
const mesh = new THREE.Mesh(geometry, material);
mesh.castShadow = true;
mesh.receiveShadow = true;

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