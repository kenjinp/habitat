import { Backdrop, useFBO, useTexture } from "@react-three/drei"
import { createPortal, extend, useFrame, useThree } from "@react-three/fiber"
import { EffectComposer, Noise, Pixelation } from "@react-three/postprocessing"
import { useControls } from "leva"
import { BlendFunction } from "postprocessing"
import * as React from "react"
import {
  Matrix4,
  Mesh,
  NearestFilter,
  NearestMipmapLinearFilter,
  OrthographicCamera,
  PointLight,
  RepeatWrapping,
  Scene,
  Uniform,
  Vector2,
  Vector3,
} from "three"
import BicubicUpscaleMaterial from "../../components/materials/bicubic-upscale-material/BicubicUpscaleMaterial"
import { Texture } from "./Texture"

// Blue noise texture
const BLUE_NOISE_TEXTURE_URL = "blue-noise.png"
// Noise texture
const NOISE_TEXTURE_URL = "noise.png"

extend({ BicubicUpscaleMaterial })

const CylinderAtmosphere: React.FC = () => {
  const [_cameraDirection] = React.useState(() => new Vector3())
  const [_position] = React.useState(() => new Vector3())
  const [_matrixWorld] = React.useState(() => new Matrix4())
  const [_projectionMatrixInverse] = React.useState(() => new Matrix4())

  const [pointLight, setPointLight] = React.useState<PointLight>(
    () => new PointLight(),
  )

  // pointLight
  const pointLightShadow = {
    shadowBias: pointLight.shadow.bias,
    shadowNormalBias: pointLight.shadow.normalBias,
    shadowRadius: pointLight.shadow.radius,
    shadowMapSize: pointLight.shadow.mapSize,
    shadowCameraNear: pointLight.shadow.camera.near,
    shadowCameraFar: pointLight.shadow.camera.far,
  }

  const mesh = React.useRef<Mesh>()
  const upscalerMaterialRef = React.useRef()
  const { viewport, camera, gl, scene } = useThree()

  console.log({ gl })

  const magicScene = new Scene()

  const { resolution } = useControls({
    resolution: {
      value: 2,
      options: {
        "1x": 1,
        "0.5x": 2,
        "0.25x": 4,
        "0.125x": 8,
      },
    },
  })

  const renderTargetA = useFBO(
    window.innerWidth / resolution,
    window.innerHeight / resolution,
  )

  const renderTargetB = useFBO(
    window.innerWidth / resolution,
    window.innerHeight / resolution,
  )

  const blueNoiseTexture = useTexture(BLUE_NOISE_TEXTURE_URL)
  blueNoiseTexture.wrapS = RepeatWrapping
  blueNoiseTexture.wrapT = RepeatWrapping

  blueNoiseTexture.minFilter = NearestMipmapLinearFilter
  blueNoiseTexture.magFilter = NearestFilter

  const noisetexture = useTexture(NOISE_TEXTURE_URL)
  noisetexture.wrapS = RepeatWrapping
  noisetexture.wrapT = RepeatWrapping

  noisetexture.minFilter = NearestMipmapLinearFilter
  noisetexture.magFilter = NearestFilter

  camera.getWorldPosition(_position)
  camera.getWorldDirection(_cameraDirection)

  const uniforms = {
    uTime: new Uniform(0.0),
    uResolution: new Uniform(new Vector2()),
    uNoise: new Uniform(null),
    uBlueNoise: new Uniform(null),
    uFrame: new Uniform(0),
    uCameraPosition: new Uniform(_position),
    uCameraWorldDirection: new Uniform(_cameraDirection),
    uViewMatrixInverse: new Uniform(_matrixWorld),
    uProjectionMatrixInverse: new Uniform(_projectionMatrixInverse),
    uPointLightShadow: new Uniform(pointLightShadow),
    uPointLight: new Uniform(pointLight),
    uPointShadowMap: new Uniform(pointLight.shadow.map?.texture),
    uPointLightShadowMatrix: new Uniform(pointLight.shadow.matrix),
  }

  const [fakeCamera] = React.useState(() => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    camera.position.z = 1
    return camera
  })
  useFrame(state => {
    const { gl, clock } = state
    // mesh.current.material.uniforms.uTime.value = clock.getElapsedTime()
    // mesh.current.material.uniforms.uResolution.value = new Vector2(
    //   renderTargetA.width,
    //   renderTargetA.height,
    // )

    // mesh.current.material.uniforms.uBlueNoise.value = blueNoiseTexture
    // mesh.current.material.uniforms.uNoise.value = noisetexture

    // mesh.current.material.uniforms.uFrame.value += 1
    gl.setRenderTarget(renderTargetB)
    gl.render(scene, camera)

    gl.setRenderTarget(renderTargetA)
    gl.render(magicScene, fakeCamera)

    // todo, maybe make upscaler effect that uses the same shaders
    // instead of having these two steps
    // upscalerMaterialRef.current.uniforms.uTexture.value = renderTargetA.texture
    // screenMesh.current.material = upscalerMaterialRef.current

    gl.setRenderTarget(null)
  }, 1)

  return (
    <>
      {createPortal(
        <>
          {/* <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              key={MathUtils.generateUUID()}
              fragmentShader={fragmentShader}
              vertexShader={vertexShader}
              uniforms={uniforms}
              wireframe={false}
            />
            <mesh position={[5, 0, -5]}>
              <sphereGeometry args={[1, 32, 16]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </mesh> */}
          {/* <directionalLight
            position={[0, 100, 0]}
            intensity={2}
            color="white"
          /> */}
          <Backdrop receiveShadow={true}>
            <mesh position={[5, 0, -5]}>
              <sphereGeometry args={[1, 32, 16]} />
              <meshStandardMaterial color="purple" />
            </mesh>
          </Backdrop>
          <EffectComposer>
            <Texture texture={renderTargetB.texture} />
            {/* <TestEffect /> */}
            <Noise opacity={1} />
            <Pixelation granularity={10} />
          </EffectComposer>
        </>,
        magicScene,
      )}
      <EffectComposer>
        {blueNoiseTexture && (
          <Texture
            texture={renderTargetA.texture}
            blendFunction={BlendFunction.OVERLAY}
          />
        )}
      </EffectComposer>
    </>
  )
}

export default CylinderAtmosphere
