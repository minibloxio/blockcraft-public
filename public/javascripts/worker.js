

self.addEventListener('message', e => {
	let cellX = e.data[0];
	let cellY = e.data[1];
	let cellZ = e.data[2];

	generateGeometryDataForCell(cellX, cellY, cellZ);
});

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

function getVoxel(x, y, z) {
    const cell = this.getCellForVoxel(x, y, z);
    if (!cell) {
      return 0;
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z);
    return cell[voxelOffset];
}

function addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel) {

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

function generateGeometryDataForCell(cellX, cellY, cellZ) {
	console.log(world);
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
          if (voxel) {
            // voxel 0 is sky (empty) so for UVs we start at 0
            const uvVoxel = voxel - 1;
            // There is a voxel here but do we need faces for it?
            if (voxel != 14) {
              for (const {dir, corners, uvRow} of World.faces) {

                const neighbor = getVoxel(
                    voxelX + dir[0],
                    voxelY + dir[1],
                    voxelZ + dir[2]);
                if ((!neighbor || (neighbor == 14))) {
                  // this voxel has no neighbor in this direction so we need a face.
                  addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel)
                }

              }
            }

            if (voxel == 14) { // Water
              for (const {dir, corners, uvRow} of World.faces) {

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
    }

    return {
      positions,
      normals,
      uvs,
      indices,
    };
}