import {
  ChunkGenerator3Initializer,
  ColorArrayWithAlpha,
  createThreadedRingWorldWorker,
  Noise,
  NOISE_TYPES,
  remap,
} from "@hello-worlds/planets"
import { Color } from "three"
import { interpolateColor } from "../../hooks/use-image/image"
import { biomeColorSplineMap, BIOMES } from "./Habitat.biomes"
import { length, radius } from "./Habitat.dimensions"

import FastNoiseLite from "fastnoise-lite"

let noise = new FastNoiseLite()
noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2)
noise.SetFractalType(FastNoiseLite.FractalType.FBM)
noise.SetFractalOctaves(4)
noise.SetSeed(12345)
noise.SetFrequency(0.08)

export type ThreadParams = {
  seed: string
  heightmap: Uint8Array
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

const heightGenerator: ChunkGenerator3Initializer<ThreadParams, number> = ({
  data: { seed, heightmap },
}) => {
  const imageWidth = 1024
  const maxHeight = 1500
  const minHeight = -5

  return ({ input }) => {
    if (!heightmap) {
      return -10
    }

    // Calculate the angle theta around the Y-axis
    const theta = Math.atan2(input.x, input.z)

    // Convert theta to the U coordinate (normalized to [0, 1])
    let u = (theta / (2 * Math.PI) + 0.5) * (2 * Math.PI * radius)
    u = u / (2 * Math.PI * radius)

    let imageX = remap(u, 0, 1, 0, imageWidth)
    let imageY = remap(input.y, -length / 2, length / 2, 0, imageWidth)

    let h = interpolateColor(imageX, imageY, imageWidth, heightmap, true)

    h = remap(h, 0, 255, 0, 1)
    h = remap(h, 0, 1, minHeight, maxHeight)
    return h
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
    noiseType: NOISE_TYPES.BILLOWING,
    height: terrainNoiseFudgeHeight,
    scale: 500,
  })
  const color = new Color()
  color.set(0xffffff * Math.random())
  return ({ height, worldPosition }) => {
    var h = height
    // return color
    if (height < 50) {
      return oceanSpline.get(remap(height, -50, 0, 1, 0))
    }
    // we dont want to fudge the color altitude for the ocean, so let's make sure we're a safe distance away
    if (height > terrainNoiseFudgeHeight) {
      h = height + colorNoise.getFromVector(worldPosition)
    }
    const remappedHeight = remap(h, 32, scaleMax, 0, 1)
    return colorSpline.get(remappedHeight)
    // return color.set(0xffffff * Math.random())
  }
}

createThreadedRingWorldWorker<ThreadParams>({
  heightGenerator,
  colorGenerator,
})
