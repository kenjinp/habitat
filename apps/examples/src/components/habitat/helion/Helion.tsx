import { remap } from "@hello-worlds/planets"
import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import * as React from "react"
import { MathUtils, Vector3 } from "three"
import { Star } from "../../star/Star"
import { length } from "../Habitat.dimensions"
import { colorSpline } from "./Helion.spline"
import {
  getMinMaxElevation,
  solarNoon,
  sunElevation,
  sunriseSunsetTimes,
} from "./Sun.math"

export const Helion: React.FC = () => {
  const meshRef = React.useRef()
  const [_, setTime] = React.useState(0)
  const [position] = React.useState(new Vector3(0, 0, 0))
  const { dayFraction, dayOfYear, latitude, longitude } = useControls({
    dayFraction: {
      value: 80,
      min: 0,
      max: 100,
      step: 1,
    },
    dayOfYear: {
      value: 172,
      min: 0,
      max: 365,
      step: 1,
    },
    latitude: {
      value: 40.7128,
      min: -90,
      max: 90,
      step: 0.01,
    },
    longitude: {
      value: -74.006,
      min: -180,
      max: 180,
      step: 0.01,
    },
  })
  const time = dayFraction

  const maxIntensity = 50_000
  const minIntensity = 1_000

  function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2
  }

  // const positionY = remap(easeInOutSine(remap(sunAngle, -6)),0, 1, -length / 2, length / 2)
  const sunAngle = sunElevation(time / 100, dayOfYear, latitude, longitude)
  const lightColor = colorSpline.get(sunAngle)
  const lightIntensity = MathUtils.clamp(
    remap(remap(sunAngle, -20, 12, 0, 1), 0, 1, 0, maxIntensity),
    minIntensity,
    maxIntensity,
  )
  const [min, max] = getMinMaxElevation(dayOfYear, latitude, longitude)
  const dayFractionToHour = (time / 100) * 24
  const { sunrise, sunset } = sunriseSunsetTimes(dayOfYear, latitude, longitude)
  const noon = solarNoon(dayOfYear, longitude)
  const solarMidnight = solarNoon(dayOfYear, longitude + 180)

  // make the light travel up the y axis of the habitat when sunAngle is -6 to the center when sunAngle is at max,
  // then to the opposite end when sunAngle is -6 again
  // so the light will start at the 'eastern' end of the habitat and travel to the 'western' end over the entire lifecycle of the sun
  function getPositionY(time: number): number {
    const epsilon = 0.0001
    const half = length / 2
    // if (time < sunrise - epsilon || time > sunset + epsilon) {
    //   return -half
    // }
    return MathUtils.clamp(
      remap(time / 100, sunrise, sunset, -half, half),
      -half,
      half,
    )
  }

  // TODO: fix bug and remove this
  React.useEffect(() => {
    // set interval to rerender in 100 ms
    const interval = setInterval(() => {
      setTime(time + 1)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // const intervalInSeconds = 60
    // const t = clock.getElapsedTime() % intervalInSeconds
    // const time = t / intervalInSeconds * 100
    // setTime(time)
    const y = getPositionY(time)
    position.setY(y)
    meshRef.current.position.copy(position)
  })

  return (
    <>
      <mesh ref={meshRef}>
        <Star
          position={[0, 0, 0]}
          radius={4}
          color={lightColor}
          emissive={lightColor}
          lightIntensity={lightIntensity}
          name="Helion"
        />
        {/* <Html>
      <div style={{ position: 'absolute', top: 0, left: 0, padding: 10, width: 300 }}>
        <h4>Helion (Sun simulacra)</h4>
        <p>Hour: {dayFractionToHour.toFixed(2)}</p>
        <p>Sun Angle: {sunAngle.toFixed(2)}</p>
        <p>Light Intensity: {lightIntensity}</p>
      </div>
    </Html> */}
      </mesh>
    </>
  )
}
