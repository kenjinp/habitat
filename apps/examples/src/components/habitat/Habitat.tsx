import { RingWorld as HelloRingWorld } from "@hello-worlds/planets"
import { RingWorld } from "@hello-worlds/react"
import { useFrame, useThree } from "@react-three/fiber"
import { BackSide, Group, MathUtils, Mesh, Vector3 } from "three"

import { OrbitControls } from "@react-three/drei"
import { useControls } from "leva"
import { useMemo, useRef, useState } from "react"
import { useImageData } from "../../hooks/use-image/use-image"
import { length, radius } from "./Habitat.dimensions"
import Worker from "./Habitat.worker?worker"
import { Helion } from "./helion/Helion"
import Hull from "./hull/Hull"
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

const SupportStructure: React.FC = () => {
  const r = 2
  const length = radius
  const offsetSideA = new Vector3(0, length / 2, 0)
  const offsetSideB = new Vector3(0, -length / 2, 0)
  return (
    <group
      // rotate around x axis 90 degrees to align with the x-z plane
      rotation={[Math.PI / 2, 0, 0]}
    >
      <mesh position={offsetSideA} castShadow receiveShadow>
        <cylinderGeometry args={[r * 10, r, length, 64]} />
        <meshStandardMaterial color="grey" />
      </mesh>
      <mesh position={offsetSideB} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 10, length, 64]} />
        <meshStandardMaterial color="grey" />
      </mesh>
    </group>
  )
}

const RandomSupportStructures: React.FC = () => {
  const numberStructures = 8
  return (
    <group>
      {Array.from({ length: numberStructures }).map((_, i) => {
        const offsetSteps = length / numberStructures
        const offset = i * offsetSteps

        const position = new Vector3(
          0,
          MathUtils.randFloat(offset, offset + offsetSteps) - length / 2,
          0,
        )
        return (
          <group
            position={position}
            //rotate randomly around the global y-axis
            rotation={[0, MathUtils.randFloat(0, Math.PI * 2), 0]}
          >
            <SupportStructure key={i} />
          </group>
        )
      })}
    </group>
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
  const heightmap = useImageData("large-terrain.png")
  const { minHeight, maxHeight } = useControls({
    minHeight: { value: -5, min: -100, max: 10 },
    maxHeight: { value: 1_500, min: 100, max: 5_000 },
  })

  const data = useMemo(() => {
    return {
      seed: "hello-tube",
      heightmap: heightmap.result,
      minHeight,
      maxHeight,
    }
  }, [heightmap.result, minHeight, maxHeight])

  // useFrame(({ clock }) => {
  //   function rotationsPerSecond(radius: number, targetGravity: number): number {
  //     const g = 9.81 // Earth gravity in m/s²
  //     const angularVelocity = Math.sqrt((targetGravity * g) / radius)
  //     const rotationsPerSecond = angularVelocity / (2 * Math.PI)
  //     return rotationsPerSecond
  //   }
  //   const delta = clock.getDelta()

  //   const targetGravity = 0.8

  //   // rotate the ringWorld
  //   // habitatGroup.current!.rotation.y +=
  //   //   rotationsPerSecond(radius, targetGravity) * (delta * 100)
  // })

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
        minCellSize={32}
        minCellResolution={128}
        lodOrigin={camera.position}
        worker={worker}
        data={data}
        inverted
        skirtDepth={10}
      >
        <Helion />
        {/* <RandomCubesInsideCylinder numCubes={100} size={500} />
        <RandomCubesInsideCylinder numCubes={500} size={100} /> */}
        <meshStandardMaterial vertexColors side={BackSide} />
        {/* <GodCamera /> */}
        <OrbitControls />
      </RingWorld>
      <RandomSupportStructures />
      <Hull />
      <Water />
    </group>
  )
}
