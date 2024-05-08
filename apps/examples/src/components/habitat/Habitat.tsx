import { RingWorld as HelloRingWorld } from "@hello-worlds/planets"
import { RingWorld } from "@hello-worlds/react"
import { useThree } from "@react-three/fiber"
import { BackSide, Vector3 } from "three"

import { useMemo, useRef } from "react"
import { Star } from "../star/Star"
import { length, radius } from "./Habitat.dimensions"
import Worker from "./Habitat.worker?worker"
import Water from "./water/Water"

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
    <group
    // rotate 90 degrees to align with the x-z plane
    // rotation={[Math.PI / 2, 0, 0]}
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
        <Star
          position={new Vector3(0, 0, 0)}
          radius={4}
          color="white"
          emissive="white"
          lightIntensity={100_000}
          name="sun"
        />
        <meshStandardMaterial vertexColors side={BackSide} />
      </RingWorld>
      <Water />
    </group>
  )
}
