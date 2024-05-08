import {
  ChunkGenerator3Initializer,
  ColorArrayWithAlpha,
  createThreadedRingWorldWorker,
  DEFAULT_NOISE_PARAMS,
  Noise,
  NOISE_TYPES,
  remap,
} from "@hello-worlds/planets"
import { Color } from "three"

export type ThreadParams = {
  seaLevel: number
}

const heightGenerator: ChunkGenerator3Initializer<ThreadParams, number> = ({
  data: { seaLevel },
}) => {
  return (_) => {
    return seaLevel + 5
  }
}

const colorGenerator: ChunkGenerator3Initializer<
  ThreadParams,
  Color | ColorArrayWithAlpha
> = ({ data: {} }) => {
  const color = new Color()
  color.set(0xffffff * Math.random())
  return ({ height, worldPosition }) => {
    return color
  }
}

createThreadedRingWorldWorker<ThreadParams>({
  heightGenerator,
  // colorGenerator,
})
