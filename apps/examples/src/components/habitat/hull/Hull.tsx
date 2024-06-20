import { RingWorld } from "@hello-worlds/react"
import { useThree } from "@react-three/fiber"
import { FrontSide, Vector3 } from "three"

import { useMemo } from "react"
import { length, radius } from "../Habitat.dimensions"
import Worker from "./Hull.worker?worker"

const worker = () => new Worker()

export interface HabitatData {
  seed: string
}

export default function Hull() {
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
        length={length + 200}
        radius={radius + 100}
        minCellSize={32}
        minCellResolution={8}
        lodOrigin={camera.position}
        worker={worker}
        data={data}
        skirtDepth={100}
      >
        <meshStandardMaterial side={FrontSide} color={"grey"} />
      </RingWorld>
    </group>
  )
}
