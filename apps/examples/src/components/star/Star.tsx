import { SUN_RADIUS } from "@hello-worlds/planets"
import { useThree } from "@react-three/fiber"
import * as React from "react"
import { DirectionalLight, Mesh, PerspectiveCamera } from "three"

export interface StarProps {
  position: [number, number, number]
  radius?: number
  color: string
  emissive: string
  lightIntensity: number
  name: string
}

export const Star = React.forwardRef<Mesh, StarProps>((props, ref) => {
  const {
    position,
    radius = SUN_RADIUS,
    color,
    emissive,
    lightIntensity,
    name,
  } = props
  const lightRef = React.useRef<DirectionalLight>(null)
  const camera = useThree(s => s.camera) as PerspectiveCamera

  React.useEffect(() => {
    const light = lightRef.current as DirectionalLight
    if (!light) {
      return
    }
    light.target = camera
    // light.shadow.camera.up.set(0, 0, 1)
    // light.shadow.camera.near = camera.near
    // light.shadow.camera.far = camera.far
    // light.shadow.camera.right = 100
    // light.shadow.camera.left = -100
    // light.shadow.camera.top = 100
    // light.shadow.camera.bottom = -100
    // light.shadow.mapSize.width = 1024
    // light.shadow.mapSize.height = 1024
  }, [lightRef])

  return (
    <mesh ref={ref} position={position}>
      <pointLight
        ref={lightRef}
        color={emissive}
        intensity={lightIntensity}
        decay={1.2}
        castShadow
        name={`${name}-light`}
      />
      <sphereGeometry args={[radius, 32, 16]}></sphereGeometry>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={40.0}
      />
    </mesh>
  )
})