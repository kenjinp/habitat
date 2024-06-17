import { SUN_RADIUS } from "@hello-worlds/planets"
import { useTexture } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import * as React from "react"
import {
  Mesh,
  NearestFilter,
  NearestMipmapLinearFilter,
  PointLight,
  RepeatWrapping,
} from "three"

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
  const camera = useThree(state => state.camera)

  const blueNoiseTexture = useTexture("blue-noise.png")
  blueNoiseTexture.wrapS = RepeatWrapping
  blueNoiseTexture.wrapT = RepeatWrapping

  blueNoiseTexture.minFilter = NearestMipmapLinearFilter
  blueNoiseTexture.magFilter = NearestFilter

  const [light, setLight] = React.useState<PointLight | null>(null)

  React.useEffect(() => {
    if (light) {
      console.log("lighttttt", light)
      light.shadow.mapSize.width = 512 * 8 // default
      light.shadow.mapSize.height = 512 * 8 // default
      light.shadow.camera.near = 0.0001 // default
      light.shadow.camera.far = 15_000 // default
    }
  }, [light])

  return (
    <mesh ref={ref} position={position}>
      <pointLight
        ref={light => {
          setLight(light)
        }}
        color={emissive}
        intensity={lightIntensity}
        decay={1}
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
