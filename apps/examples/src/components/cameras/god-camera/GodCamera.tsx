import { remap } from "@hello-worlds/planets"
import { useFrame, useThree } from "@react-three/fiber"
import * as React from "react"
import { MathUtils, Vector3 } from "three"
import { FirstPersonControls } from "../fly-camera/FlyCamera.component"
import { FlyCamera as FPC } from "../fly-camera/FlyCamera.old"

const calculateDistanceToCylinderWall = (pos: Vector3) => {
  const distance = Math.sqrt(pos.x ** 2 + pos.z ** 2)
  return distance
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

export const GodCamera: React.FC = () => {
  const camera = useThree(state => state.camera)
  const controlsRef = React.useRef<FPC>(null)

  useFrame(() => {
    if (!controlsRef.current) return

    let distanceFromCenter = calculateDistanceToCylinderWall(camera.position)
    let distanceFromWall = remap(distanceFromCenter, 0, 2500, 2500, 0)
    const seaLevel = 50
    let normalizedDistance = remap(distanceFromWall, seaLevel, 2500, 0, 1)
    normalizedDistance = MathUtils.clamp(normalizedDistance, 0, 1)

    const maxSpeed = 1000 // meters per second, I think
    const speed = easeOutCubic(normalizedDistance) * maxSpeed
    controlsRef.current.movementSpeed = speed
  }, -1)
  return (
    <FirstPersonControls
      key={"god-camera"}
      makeDefault={true}
      constrainVertical
      ref={controlsRef}
      lookSpeed={0.8}
    />
  )
}

export default GodCamera
