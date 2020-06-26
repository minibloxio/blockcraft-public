//var loader = new THREE.SVGLoader();
/*
loader.load('./textures/rainbow.svg', function (data) {

  // Group we'll use for all SVG paths
  const svgGroup = new THREE.Group();
  // When importing SVGs paths are inverted on Y axis
  // it happens in the process of mapping from 2d to 3d coordinate system
  let scale = 0.1
  svgGroup.scale.x *= scale;
  svgGroup.scale.y *= -scale;

  // Loop through all of the parsed paths
  data.paths.forEach((path, i) => {
    const shapes = path.toShapes(true);

    // Each path has array of shapes
    shapes.forEach((shape, j) => {
      // Finally we can take each shape and extrude it
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 2,
        bevelEnabled: false
      });

      const material = new THREE.MeshBasicMaterial({
        color: path.color,
        side: THREE.DoubleSide
      });

      // Create a mesh and add it to the group
      const mesh = new THREE.Mesh(geometry, material);
      mesh.fog = false;

      svgGroup.add(mesh);
    });
  });

  // Get group's size
  const box = new THREE.Box3().setFromObject(svgGroup);
  const size = new THREE.Vector3();
  box.getSize(size);

  const yOffset = size.y / -2;
  const xOffset = size.x / -2;

  // Offset all of group's elements, to center them
  svgGroup.children.forEach(item => {
    item.position.x = xOffset;
    item.position.y = yOffset;
  });

  svgGroup.position.set(0, blockSize*75, 0);

  // Finally we add svg group to the scene
  scene.add(svgGroup);
})*/