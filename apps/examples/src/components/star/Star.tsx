import { SUN_RADIUS, remap } from "@hello-worlds/planets"
import { useThree } from "@react-three/fiber"
import * as React from "react"
import { DirectionalLight, MathUtils, Mesh, PerspectiveCamera, PointLight } from "three"
import { Fog } from "../../effects/fog/Fog"
import { EffectComposer } from "@react-three/postprocessing"
import { useEffect } from "react"

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

  return (
    <mesh ref={ref} position={position}>
      <pointLight
        color={emissive}
        intensity={lightIntensity}
        decay={1.2}
        castShadow
        name={`${name}-light`}
      />
      {/* <EffectComposer>
        {light && <Fog camera={camera} directionalLight={light} /> }
      </EffectComposer> */}
      <sphereGeometry args={[radius, 32, 16]}></sphereGeometry>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={40.0}
      />
    </mesh>
  )
})