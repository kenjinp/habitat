import * as THREE from "three"

export const getFullscreenTriangle = () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-1, -1, 3, -1, -1, 3], 2),
  )
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2),
  )

  return geometry
}
