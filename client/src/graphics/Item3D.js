const faces = [
  // TODO: REALLY FIND A PLACE TO STORE THIS
  {
    // left
    dir: [-1, 0, 0],
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  {
    // right
    dir: [1, 0, 0],
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  {
    // bottom
    dir: [0, -1, 0],
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  {
    // top
    dir: [0, 1, 0],
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  {
    // back
    dir: [0, 0, -1],
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
  {
    // front
    dir: [0, 0, 1],
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
];

class Item3D {
  static addFaceData(positions, dir, corners, normals, uvs, uvRow, indices, x, y, z, uvVoxel, pixelSize) {
    const { tileSize, tileTextureHeight, tileTextureWidth } = world;

    const ndx = positions.length / 3;
    for (const { pos, uv } of corners) {
      // Get position of the pixel
      let xPos = pos[0] + x;
      let yPos = pos[1] + y;
      let zPos = pos[2] + z;

      positions.push(xPos * pixelSize, yPos * pixelSize, zPos * pixelSize);
      normals.push(...dir);

      let uvX = y + uv[0] + uvVoxel * tileSize;
      let uvY = z - uv[1] + uvRow * tileSize + 1;

      uvs.push(uvX / tileTextureWidth, 1 - uvY / tileTextureHeight);
    }
    indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
  }

  static getNeighborPixel(x, y) {
    let pixels = textureManager.materialPixels;
    let index = (x + y * world.tileTextureWidth) * 4;
    let pixel = pixels[index + 3];
    return pixel;
  }

  static getMesh(entity, pixelSize, mesh, uvRow = 0) {
    let data = {
      positions: [],
      normals: [],
      indices: [],
      uvs: [],
    };

    const itemSize = 16;
    let material = textureManager.materialItem; // TODO: set this once

    let uvVoxel = entity.v - 1;

    // Update the UV data of each face
    for (let y = 0; y < itemSize; ++y) {
      for (let z = 0; z < itemSize; ++z) {
        for (const { dir, corners } of faces) {
          let oy = y + uvVoxel * itemSize;
          let oz = z + uvRow * itemSize;

          let pixel = Item3D.getNeighborPixel(oy, oz);
          if (pixel > 0) {
            Item3D.addFaceData(data.positions, dir, corners, data.normals, data.uvs, uvRow, data.indices, 0, y, z, uvVoxel, pixelSize);
          }
        }
      }
    }

    // Convert to ArrayBuffers
    let positionBuffer = new Float32Array(new ArrayBuffer(data.positions.length * 4));
    let normalBuffer = new Float32Array(new ArrayBuffer(data.normals.length * 4));
    let uvBuffer = new Float32Array(new ArrayBuffer(data.uvs.length * 4));
    let indexBuffer = new Uint16Array(new ArrayBuffer(data.indices.length * 2));
    positionBuffer.set(data.positions);
    normalBuffer.set(data.normals);
    uvBuffer.set(data.uvs);
    indexBuffer.set(data.indices);

    // Set attributes
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positionBuffer, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normalBuffer, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvBuffer, 2));
    geometry.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

    // Set attributes
    if (mesh) {
      mesh.geometry.setAttribute("position", new THREE.BufferAttribute(positionBuffer, 3));
      mesh.geometry.setAttribute("normal", new THREE.BufferAttribute(normalBuffer, 3));
      mesh.geometry.setAttribute("uv", new THREE.BufferAttribute(uvBuffer, 2));
      mesh.geometry.setIndex(new THREE.BufferAttribute(indexBuffer, 1));
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.attributes.normal.needsUpdate = true;
      mesh.geometry.attributes.uv.needsUpdate = true;
      mesh.geometry.index.needsUpdate = true;

      mesh.material = material;
    } else {
      return new THREE.Mesh(geometry, material);
    }
  }
}

export default Item3D;
