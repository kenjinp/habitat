import {
  ChunkGenerator3Initializer,
  ColorArrayWithAlpha,
  createThreadedRingWorldWorker,
} from "@hello-worlds/planets"
import { Color } from "three"

export type ThreadParams = {}

const heightGenerator: ChunkGenerator3Initializer<ThreadParams, number> = ({
  data: {},
}) => {
  return ({ input }) => {
    let h = 100
    return h
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
