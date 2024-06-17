import { RingWorld } from "@hello-worlds/react"
import { useThree } from "@react-three/fiber"
import { BackSide, Color, Vector3 } from "three"

import { useMemo } from "react"
import { length, radius } from "../Habitat.dimensions"
import Worker from "./Water.worker?worker"

const worker = () => new Worker()

export interface HabitatData {
  seed: string
}

export default function Water() {
  const camera = useThree(state => state.camera)

  const data = useMemo(() => {
    return {
      seaLevel: 50,
    }
  }, [])

  return (
    <group>
      <RingWorld
        position={new Vector3()}
        length={length}
        radius={radius}
        minCellSize={64}
        minCellResolution={8}
        lodOrigin={camera.position}
        worker={worker}
        data={data}
        inverted
        skirtDepth={0.000000000000001}
      >
        {/* <MeshReflectorMaterial
          mirror={1}
          side={DoubleSide}
          resolution={1024 * 4}
          mixBlur={0.5}
          mixStrength={15}
          depthScale={0.1}
          minDepthThreshold={1000}
          color="red"
          metalness={0.6}
          roughness={1}
        /> */}
        <meshStandardMaterial
          transparent
          opacity={0.9}
          color={new Color(0x017b92)}
          side={BackSide}
        />
      </RingWorld>
    </group>
  )
}
