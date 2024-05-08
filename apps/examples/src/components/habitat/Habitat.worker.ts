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
import { biomeColorSplineMap, BIOMES } from "./Habitat.biomes"

export type ThreadParams = {
  seed: string
}

const heightGenerator: ChunkGenerator3Initializer<ThreadParams, number> = ({
  data: { seed },
}) => {
  const warp = new Noise({
    ...DEFAULT_NOISE_PARAMS,
    octaves: 2,
    seed,
    height: 1000,
    scale: 3000,
    noiseType: NOISE_TYPES.BILLOWING,
  })

  const mountains = new Noise({
    ...DEFAULT_NOISE_PARAMS,
    seed,
    height: 1500,
    scale: 3000,
  })

  return ({ input }) => {
    const w = warp.get(input.x, input.y, input.z)
    const m = mountains.get(input.x + w, input.y + w, input.z + w)
    return m
  }
}

const colorGenerator: ChunkGenerator3Initializer<
  ThreadParams,
  Color | ColorArrayWithAlpha
> = ({ data: {} }) => {
  const scaleMax = 1_500
  const biome = BIOMES.SIM_CITY
  // const color = new Color()
  const colorSpline =
    biomeColorSplineMap[biome] || biomeColorSplineMap[BIOMES.SIM_CITY]
  const oceanSpline = biomeColorSplineMap[BIOMES.OCEAN]
  const terrainNoiseFudgeHeight = 200
  const colorNoise = new Noise({
    seed: "blah",
    noiseType: NOISE_TYPES.RIGID,
    height: terrainNoiseFudgeHeight,
    scale: 1000,
  })
  const color = new Color()
  color.set(0xffffff * Math.random())
  return ({ height, worldPosition }) => {
    // return color
    if (height < 50) {
      return oceanSpline.get(remap(height, -50, 0, 1, 0))
    }
    // we dont want to fudge the color altitude for the ocean, so let's make sure we're a safe distance away
    if (height > terrainNoiseFudgeHeight) {
      height = height + colorNoise.getFromVector(worldPosition)
    }
    const remappedHeight = remap(height, 0, scaleMax, 0, 1)
    return colorSpline.get(remappedHeight)
    // return color.set(0xffffff * Math.random())
  }
}

createThreadedRingWorldWorker<ThreadParams>({
  heightGenerator,
  colorGenerator,
})
