import { SUN_RADIUS } from "@hello-worlds/planets"
import { useThree } from "@react-three/fiber"
import { EffectComposer } from "@react-three/postprocessing"
import * as React from "react"
import { Mesh, PointLight } from "three"
import { CylinderFog } from "../../effects/cylinder-fog/CylinderFog"

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
  const [light, setLight] = React.useState<PointLight | null>(null)

  React.useEffect(() => {
    if (light) {
      console.log("lighttttt", light)
      light.shadow.mapSize.width = 4096 // default
      light.shadow.mapSize.height = 4096 // default
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
      <EffectComposer>
        {light && <CylinderFog camera={camera} pointLight={light} />}
      </EffectComposer>
      <sphereGeometry args={[radius, 32, 16]}></sphereGeometry>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={40.0}
      />
    </mesh>
  )
})
