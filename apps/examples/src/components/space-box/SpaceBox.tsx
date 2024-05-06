import { useThree } from "@react-three/fiber"
import * as React from "react"
import { Color, CubeTextureLoader } from "three"

export const SpaceBox: React.FC<
  React.PropsWithChildren<{ hideBackground?: boolean }>
> = ({ hideBackground, children }) => {
  const { scene } = useThree()
  React.useEffect(() => {
    const back = `/skybox/back.png`
    const bottom = `/skybox/bottom.png`
    const front = `/skybox/front.png`
    const left = `/skybox/left.png`
    const right = `/skybox/right.png`
    const top = `/skybox/top.png`

    const urls = [right, left, top, bottom, front, back]

    const cube = new CubeTextureLoader().load(urls)
    if (hideBackground) {
      scene.background = new Color(0x000000)
      return
    }
    scene.castShadow = true
    scene.background = cube
  }, [hideBackground])

  return <>{children}</>
}
