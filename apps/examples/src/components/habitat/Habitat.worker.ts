import {
  ChunkGenerator3Initializer,
  ColorArrayWithAlpha,
  createThreadedRingWorldWorker,
  DEFAULT_NOISE_PARAMS,
  Noise,
  NOISE_TYPES,
  remap,
} from "@hello-worlds/planets"
import { Color, Vector3 } from "three"
import { interpolateColor } from "../../hooks/use-image/image"
import { biomeColorSplineMap, BIOMES } from "./Habitat.biomes"
import { length, radius } from "./Habitat.dimensions"

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

  const readFromImageData = (
    x: number,
    y: number,
    imageWidth: number,
    input: Vector3,
  ) => {
    // if (y < 0 || y > imageWidth) {
    //   throw new Error(
    //     `Range error y: ${y} imageWidth: ${imageWidth} inputy: ${input.y}`,
    //   )
    // }
    // if (x < 0 || x > imageWidth) {
    //   throw new Error(
    //     `Range error x: ${x} imageWidth: ${imageWidth} inputx: ${input.x}`,
    //   )
    // }
    const index = Math.ceil((x + y * imageWidth) * 4)
    const r = heightmap[index]
    if (r === undefined) {
      console.warn(`Range error: ${index} ${x} ${y} ${imageWidth}`)
      return 0
      // throw new Error(`Range error: ${index} ${x} ${y} ${imageWidth}`)
    }
    return r
  }

  const imageWidth = 1024

  return ({ input, offset, xy, width, resolution }) => {
    if (!heightmap) {
      return -10
    }
    const effectiveResolution = resolution
    // xy.add(offsetVec2.set(offset.x, offset.y))
    // const w = warp.get(input.x, input.y, input.z)
    // const m = mountains.get(input.x + w, input.y + w, input.z + w)

    // return m

    // Calculate the angle theta around the Y-axis
    const theta = Math.atan2(input.x, input.z)

    // Convert theta to the U coordinate (normalized to [0, 1])
    let u = (theta / (2 * Math.PI) + 0.5) * (2 * Math.PI * radius)
    u = u / (2 * Math.PI * radius)

    let imageX = Math.floor(remap(u, 0, 1, 0, imageWidth))
    let imageY = Math.floor(
      remap(input.y, -length / 2, length / 2, 0, imageWidth),
    )

    let h = interpolateColor(imageX, imageY, imageWidth, heightmap, true)
    h = remap(h, 0, 255, 0, 1)
    h = remap(h, 0, 1, -5, 1000)
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
