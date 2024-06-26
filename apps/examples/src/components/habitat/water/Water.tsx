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
        // minCellSize={64}
        // minCellResolution={8}
        minCellSize={32}
        minCellResolution={32}
        lodOrigin={camera.position}
        worker={worker}
        data={data}
        inverted
        skirtDepth={0.000000000000001}
      >
        <meshStandardMaterial color={new Color(0x017b92)} side={BackSide} />
      </RingWorld>
    </group>
  )
}
