import * as THREE from 'three'

/** Square-base pyramid centered at origin, base edge `base`, height `height`. */
export function createSquarePyramidGeometry(base: number, height: number): THREE.BufferGeometry {
  const h2 = base / 2
  const apex = [0, height / 2, 0]
  const base00 = [-h2, -height / 2, -h2]
  const base10 = [h2, -height / 2, -h2]
  const base11 = [h2, -height / 2, h2]
  const base01 = [-h2, -height / 2, h2]

  const positions: number[] = []
  const pushTri = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c)

  // base (2 triangles), wound downward-facing
  pushTri(base00, base11, base10)
  pushTri(base00, base01, base11)
  // 4 side faces
  pushTri(base00, base10, apex)
  pushTri(base10, base11, apex)
  pushTri(base11, base01, apex)
  pushTri(base01, base00, apex)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  // One group per face (base + each of the 4 triangular sides) so each can get its own material.
  geometry.addGroup(0, 6, 0)
  geometry.addGroup(6, 3, 1)
  geometry.addGroup(9, 3, 2)
  geometry.addGroup(12, 3, 3)
  geometry.addGroup(15, 3, 4)
  return geometry
}

/** Triangular prism: equilateral-triangle cross-section (side `a`), extruded length `length`. */
export function createTriangularPrismGeometry(a: number, length: number): THREE.BufferGeometry {
  const r = a / Math.sqrt(3)
  const triShape = new THREE.Shape()
  const pts = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((ang) => [
    r * Math.cos(ang + Math.PI / 2),
    r * Math.sin(ang + Math.PI / 2),
  ])
  triShape.moveTo(pts[0][0], pts[0][1])
  triShape.lineTo(pts[1][0], pts[1][1])
  triShape.lineTo(pts[2][0], pts[2][1])
  triShape.closePath()

  const geometry = new THREE.ExtrudeGeometry(triShape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 1,
  })
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, -length / 2, 0)
  geometry.computeVertexNormals()
  // ExtrudeGeometry groups both triangular caps together and all 3 side walls together;
  // split them so the 2 caps and 3 rectangular sides can each get their own material.
  geometry.clearGroups()
  geometry.addGroup(0, 3, 0)
  geometry.addGroup(3, 3, 1)
  geometry.addGroup(6, 6, 2)
  geometry.addGroup(12, 6, 3)
  geometry.addGroup(18, 6, 4)
  return geometry
}
