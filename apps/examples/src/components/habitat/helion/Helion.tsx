import { Html } from '@react-three/drei'
import { useControls } from 'leva'
import * as React from 'react'
import { sunElevation } from './Sun.math'
import { Star } from '../../star/Star'
import { MathUtils, Vector3 } from 'three'
import { remap } from '@hello-worlds/planets'
import { length } from '../Habitat.dimensions'
import { colorSpline } from './Helion.spline'
import { useFrame } from '@react-three/fiber'

export const Helion: React.FC = () => {
  const [time, setTime] = React.useState(0)
  const { dayFraction, dayOfYear, latitude, longitude } = useControls({
    dayFraction: {
      value: 50,
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
      value: -74.0060,
      min: -180,
      max: 180,
      step: 0.01,
    },
  })


  function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  useFrame(({ clock }) => {
    const intervalInSeconds = 10
    const t = clock.getElapsedTime() % intervalInSeconds
    setTime(t * 10)
  })


  // const positionY = remap(easeInOutSine(remap(sunAngle, -6)),0, 1, -length / 2, length / 2)
  const sunAngle = sunElevation(time / 100, dayOfYear, latitude, longitude)
  const lightColor = colorSpline.get(sunAngle)
  const lightIntensity = MathUtils.clamp(remap(remap(sunAngle, -20, 12, 0, 1), 0, 1, 0, 100_000), 1000, 100_000)

  const dayFractionToHour = (time / 100) * 24

  return (<>
    <Html>
      <div style={{ position: 'absolute', top: 0, left: 0, padding: 10, width: 300 }}>
        <h4>Helion (Sun simulacra)</h4>
        <p>Hour: {dayFractionToHour.toFixed(2)}</p>
        <p>Sun Angle: {sunAngle.toFixed(2)}</p>
        <p>Light Intensity: {lightIntensity}</p>
      </div>
    </Html>
    <Star
          position={new Vector3()}
          radius={4}
          color={lightColor}
          emissive={lightColor}
          lightIntensity={lightIntensity}
          name="Helion"
        />
  </>)
}