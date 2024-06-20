import { useTexture } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { EffectComposerContext } from "@react-three/postprocessing"
import { useControls } from "leva"
import { DepthCopyPass, ShaderPass } from "postprocessing"
import * as React from "react"
import { PointLight, Scene, Vector3 } from "three"
import { length, radius } from "../../components/habitat/Habitat.dimensions"
import BicubicUpscaleMaterial from "../../materials/bicubic-upscale-material/BicubicUpscaleMaterial"
import RaymarchedCylinderAtmosphere from "../../materials/raymarched-atmosphere/RaymarchedCylinderAtmosphere"
import { DownsamplePass } from "../downsample-pass/DownsamplePass"

export default function CylinderAtmospherePass() {
  const { pointLight } = useThree()
  return pointLight ? (
    <CylinderAtmospherePassInner pointLight={pointLight} />
  ) : null
}

export const CylinderAtmospherePassInner: React.FC<{
  pointLight: PointLight
}> = ({ pointLight }) => {
  const { camera } = useThree()
  const { downsample, maxSteps, useJitter } = useControls({
    downsample: {
      value: 2,
      min: 1,
      max: 20,
      step: 1,
    },
    maxSteps: {
      value: 8,
      min: 1,
      max: 32,
      step: 1,
    },
    useJitter: false,
  })
  const blueNoiseTexture = useTexture("/blue-noise.png")
  const noiseTexture = useTexture("/noise.png")
  const pp = React.useContext(EffectComposerContext)
  const composer = pp.composer

  const copyDepthPass = React.useMemo(() => {
    const pass = new DepthCopyPass()
    return pass
  }, [])

  const rayMarchPass = React.useMemo(() => {
    console.log({ blueNoiseTexture })
    const emptyScene = new Scene()
    const shader = new RaymarchedCylinderAtmosphere(
      camera,
      pointLight as PointLight,
      blueNoiseTexture,
      noiseTexture,
      copyDepthPass.texture,
      {
        radius: radius,
        height: length,
        position: new Vector3(),
      },
      maxSteps,
      useJitter,
    )

    return new DownsamplePass(emptyScene, camera, downsample, shader)
  }, [
    useJitter,
    downsample,
    maxSteps,
    blueNoiseTexture,
    copyDepthPass,
    pointLight,
  ])

  const upsampleAndMergePass = React.useMemo(() => {
    const mat = new BicubicUpscaleMaterial()
    mat.setTexture(rayMarchPass.outputTarget.texture)
    const pass = new ShaderPass(mat, "tDiffuse")
    mat.uniforms.inputBufferB = { value: composer.inputBuffer.texture }
    pass.renderToScreen = false
    return pass
  }, [rayMarchPass])

  React.useEffect(() => {
    composer.addPass(copyDepthPass)
    composer.addPass(rayMarchPass)
    composer.addPass(upsampleAndMergePass)
    return () => {
      composer.removePass(copyDepthPass)
      composer.removePass(rayMarchPass)
      composer.removePass(upsampleAndMergePass)
    }
  }, [copyDepthPass, rayMarchPass, composer, upsampleAndMergePass])

  return null
}
