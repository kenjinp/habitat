import { Lerp, LinearSpline } from "@hello-worlds/planets"
import { Color } from "three"

export interface HelionSpline {
  progress: number,
  color: number,
  position: number,
  luminance: number,
}

const twilights = {
  noon: { min: 6, max: 90, color: 0xffffff },
  goldenHour: { min: 0, max: 6, color: 0xE28D5C },
  civilTwilight: { min: -6, max: 0, color: 0x4D3B51 },
  nauticalTwilight: { min: -12, max: -6, color: 0x1C204B },
  astronomicalTwilight: { min: -18, max: -12, color: 0x110F21 },
  night: { min: -90, max: -18, color: 0x000000 },
}

const colorLerp: Lerp<THREE.Color> = (
  t: number,
  p0: THREE.Color,
  p1: THREE.Color,
) => {
  const c = p0.clone()
  return c.lerp(p1, t)
}

export const colorSpline = new LinearSpline<Color>(colorLerp)
Object.values(twilights).reverse().forEach(({ max, color }) => {
  colorSpline.addPoint(max, new Color(color))
})
