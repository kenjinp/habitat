import FastNoiseLite from "fastnoise-lite"
import { MathUtils } from "three"

let noise = new FastNoiseLite()
noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2)
noise.SetFractalType(FastNoiseLite.FractalType.FBM)
noise.SetFractalOctaves(4)
noise.SetSeed(12345)
noise.SetFrequency(0.03)

export function interpolateColor(
  x_: number,
  y_: number,
  width: number,
  pixelData: Uint8Array,
  // noise: Noise,
  useNoise = true,
) {
  let x = x_
  let y = y_
  // lets push the noise from the origin, which might otherwise produce artifacts
  // Noise calls are very slow, how to speed them up?
  // if (useNoise) {
  //   let e = noise.GetNoise(x, y) * 12
  //   let f = noise.GetNoise(x, y)
  //   x = x + e
  //   y = y + f
  // }

  // Get the integer and fractional parts of the coordinates
  const x0 = MathUtils.clamp(Math.floor(x), 0, width - 1)
  const y0 = MathUtils.clamp(Math.floor(y), 0, width - 1)
  const x1 = MathUtils.clamp(x0 + 1, 0, width - 1)
  const y1 = MathUtils.clamp(y0 + 1, 0, width - 1)

  // Ensure the coordinates are within the image bounds
  if (x0 < 0 || x1 >= width || y0 < 0 || y1 >= width) {
    throw new Error("Interpolation coordinates are outside the image bounds")
  }

  // Get the colors of the four surrounding pixels
  const topLeft = getPixelColor(x0, y0, width, pixelData)
  const topRight = getPixelColor(x1, y0, width, pixelData)
  const bottomLeft = getPixelColor(x0, y1, width, pixelData)
  const bottomRight = getPixelColor(x1, y1, width, pixelData)

  // Calculate the weights based on the fractional parts
  let weightX = x - x0
  let weightY = y - y0

  // add midpoint displacement to reduce banding
  // const n = noise.GetNoise(weightX, weightY)

  const interpolated = interpolateChannel(
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    weightX,
    weightY,
  )
  return interpolated
}

function interpolateChannel(
  c00: number,
  c01: number,
  c10: number,
  c11: number,
  weightX: number,
  weightY: number,
) {
  // Bilinear interpolation formula
  return (
    c00 * (1 - weightX) * (1 - weightY) +
    c01 * weightX * (1 - weightY) +
    c10 * (1 - weightX) * weightY +
    c11 * weightX * weightY
  )
}

export function getPixelColor(
  x: number,
  y: number,
  width: number,
  pixelData: Uint8Array,
) {
  x = MathUtils.clamp(Math.floor(x), 0, width - 1)
  y = MathUtils.clamp(Math.floor(y), 0, width - 1)
  const index = (Math.floor(x * width) + Math.floor(y)) * 4

  if (!Number.isFinite(pixelData[index])) {
    throw new Error("Pixel index does not exist")
  }

  return pixelData[index]
}
