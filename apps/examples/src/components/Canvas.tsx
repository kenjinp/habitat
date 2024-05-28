import { Canvas as R3fCanvas, useThree } from "@react-three/fiber"
import React, { Suspense, useEffect } from "react"
import { Color } from "three"
import { Post } from "./post/Post"

const Background: React.FC = () => {
  useThree(state => {
    // state.scene.background = new Color("#3D4058")
    state.scene.background = new Color("black")
  })
  return null
}

const CameraDebug: React.FC = () => {
  const camera = useThree(state => state.camera)
  useEffect(() => {
    // when we press c, log the camera position
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "c") {
        console.log(camera.position)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  })
  return null
}

export const Canvas: React.FC<
  React.PropsWithChildren<{ style?: React.CSSProperties }>
> = ({ children, style }) => {
  return (
    <R3fCanvas
      gl={{
        logarithmicDepthBuffer: true,
        antialias: true,
        stencil: true,
        depth: true,
        alpha: true,
      }}
      camera={{
        near: 0.01,
        far: Number.MAX_SAFE_INTEGER,
        position: [971.6727012195914, -3427.8869171614824, -1710.466415466463],
      }}
      shadows="soft"
      shadow-camera-far={1000000}
      shadow-camera-left={-20000}
      shadow-camera-right={20000}
      shadow-camera-top={20000}
      shadow-camera-bottom={-20000}
      style={
        style || {
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          background: "black",
        }
      }
    >
      <Suspense fallback={null}>
        <Post>{children}</Post>
        <CameraDebug />
      </Suspense>
    </R3fCanvas>
  )
}
