import { FlyControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as React from "react"
import { MathUtils, Vector3 } from "three"
import { FlyControls as FPC } from "three-stdlib"

const up = new Vector3()
const camPos = new Vector3()

const calculateDistanceToCylinderWall = (pos: Vector3) => {
  const distance = Math.sqrt(pos.x ** 2 + pos.z ** 2)
  return distance
}

export const GodCamera: React.FC = () => {
  const camera = useThree(state => state.camera)
  const controlsRef = React.useRef<FPC>(null)

  useFrame(() => {
    // // make sure that the up direction is pointing towards the center of the cylinder
    // camPos.copy(camera.position)
    // camPos.y = 0
    // // camPos.z = 0
    // const up = camPos.sub(camera.position).normalize()
    // camera.up.copy(up)
    if (!controlsRef.current) return
    let distance = calculateDistanceToCylinderWall(camera.position)
    const seaLevel = 50
    const speed = MathUtils.clamp(2500 - distance - seaLevel, 5, 1000)
    controlsRef.current.movementSpeed = speed
  })
  return <FlyControls ref={controlsRef} lookSpeed={0.8} />
}

export default GodCamera
