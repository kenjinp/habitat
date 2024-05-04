import { RingWorld as HelloRingWorld } from "@hello-worlds/planets"
import { RingWorld } from "@hello-worlds/react"
import { useThree } from "@react-three/fiber"
import { DoubleSide, Vector3 } from "three"

import { useMemo, useRef } from "react"
import { length, radius } from "./Habitat.dimensions"
import Worker from "./Habitat.worker?worker"

const worker = () => new Worker()

export interface HabitatData {
  seed: string
}

export default function Habitat() {
  const camera = useThree(state => state.camera)
  const planet = useRef<HelloRingWorld<HabitatData>>(null)

  const data = useMemo(() => {
    return {
      seed: "this is a random seed",
    }
  }, [])

  return (
    <group>
      <RingWorld
        position={new Vector3()}
        length={length}
        ref={planet}
        radius={radius}
        minCellSize={64}
        minCellResolution={64}
        lodOrigin={camera.position}
        worker={worker}
        data={data}
        inverted
      >
        <meshStandardMaterial vertexColors side={DoubleSide} />
        <directionalLight position={new Vector3()} intensity={2} />
        <axesHelper args={[20_000]} />
      </RingWorld>
    </group>
  )
}
