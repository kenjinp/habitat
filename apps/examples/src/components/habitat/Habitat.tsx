import { RingWorld as HelloRingWorld } from "@hello-worlds/planets"
import { RingWorld } from "@hello-worlds/react"
import { useFrame, useThree } from "@react-three/fiber"
import { BackSide, Group, MathUtils, Mesh, Vector3 } from "three"

import { useMemo, useRef, useState } from "react"
import { length, radius } from "./Habitat.dimensions"
import Worker from "./Habitat.worker?worker"
import { Helion } from "./helion/Helion"
import Water from "./water/Water"

const worker = () => new Worker()

export interface HabitatData {
  seed: string
}

const SingleRandomCube: React.FC<{ size: number; position: Vector3 }> = ({
  size,
  position,
}) => {
  const [randomSpeed] = useState(MathUtils.randFloat(0.001, 0.006))
  const scale = MathUtils.randFloatSpread(size)
  const meshRef = useRef<Mesh>(null)
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += randomSpeed
      meshRef.current.rotation.y += randomSpeed
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, scale]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  )
}

const RandomCubesInsideCylinder: React.FC<{
  numCubes: number
  size: number
}> = ({ numCubes, size }) => {
  return (
    <group>
      {Array.from({ length: numCubes }).map((_, i) => {
        const position = new Vector3(
          MathUtils.randFloatSpread(radius),
          MathUtils.randFloatSpread(length),
          MathUtils.randFloatSpread(radius),
        )
        return <SingleRandomCube key={i} size={size} position={position} />
      })}
    </group>
  )
}

export default function Habitat() {
  const habitatGroup = useRef<Group>(null)
  const camera = useThree(state => state.camera)
  const planet = useRef<HelloRingWorld<HabitatData>>(null)

  const data = useMemo(() => {
    return {
      seed: "this is a random seed",
    }
  }, [])

  useFrame(({ clock }) => {
    function rotationsPerSecond(radius: number, targetGravity: number): number {
      const g = 9.81 // Earth gravity in m/s²
      const angularVelocity = Math.sqrt((targetGravity * g) / radius)
      const rotationsPerSecond = angularVelocity / (2 * Math.PI)
      return rotationsPerSecond
    }
    const delta = clock.getDelta()

    const targetGravity = 0.8

    // rotate the ringWorld
    // habitatGroup.current!.rotation.y +=
    //   rotationsPerSecond(radius, targetGravity) * (delta * 100)
  })

  return (
    <group
      ref={habitatGroup}
      // rotate 90 degrees to align with the x-z plane
      // rotation={[Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <RingWorld
        position={new Vector3()}
        length={length}
        ref={planet}
        radius={radius}
        minCellSize={64}
        minCellResolution={128}
        lodOrigin={camera.position}
        worker={worker}
        data={data}
        inverted
        skirtDepth={10}
      >
        <Helion />
        <RandomCubesInsideCylinder numCubes={100} size={500} />
        <RandomCubesInsideCylinder numCubes={500} size={100} />
        <meshStandardMaterial vertexColors side={BackSide} />
      </RingWorld>
      <Water />
    </group>
  )
}
