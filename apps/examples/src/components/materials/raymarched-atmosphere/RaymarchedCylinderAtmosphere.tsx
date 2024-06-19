import {
  Camera,
  NoBlending,
  PointLight,
  ShaderMaterial,
  Texture,
  Uniform,
  Vector2,
  Vector3,
} from "three"
import frag from "./RaymarchedCylinderAtmosphere.frag.glsl"
import vert from "./RaymarchedCylinderAtmosphere.vert.glsl"

export interface Cylinder {
  radius: number
  height: number
  position: Vector3
}

class RaymarchedCylinderAtmosphere extends ShaderMaterial {
  cameraDirection = new Vector3()
  camera: Camera
  constructor(
    camera: Camera,
    pointLight: PointLight,
    blueNoiseTexture: Texture,
    depthTexture: Texture,
    public cylinder: Cylinder,
    public maxSteps: number = 8,
    public useJitter: boolean,
  ) {
    const _cameraDirection = new Vector3()
    super({
      uniforms: {
        depthBuffer: {
          value: depthTexture,
        },
        uCylinder: {
          value: cylinder,
        },
        uCameraPosition: {
          value: camera.position,
        },
        uCameraWorldDirection: {
          value: camera.getWorldDirection(_cameraDirection),
        },
        uViewMatrixInverse: {
          value: camera.matrixWorld,
        },
        uProjectionMatrixInverse: {
          value: camera.projectionMatrixInverse,
        },
        uPointLightShadow: {
          value: {
            shadowBias: pointLight.shadow.bias,
            shadowNormalBias: pointLight.shadow.normalBias,
            shadowRadius: pointLight.shadow.radius,
            shadowMapSize: pointLight.shadow.mapSize,
            shadowCameraNear: pointLight.shadow.camera.near,
            shadowCameraFar: pointLight.shadow.camera.far,
          },
        },
        uPointShadowMap: {
          value: pointLight.shadow.map?.texture,
        },
        uPointLightShadowMatrix: {
          value: pointLight.shadow.matrix,
        },
        uPointLight: {
          value: pointLight,
        },
        uBlueNoise: {
          value: blueNoiseTexture,
        },
        uMaxSteps: { value: maxSteps },
        uUseJitter: new Uniform(useJitter),
        uFrame: { value: 0 },
        uTime: { value: 0 },
        resolution: new Uniform(new Vector2()),
        texelSize: new Uniform(new Vector2()),
        cameraNear: new Uniform(0.3),
        cameraFar: new Uniform(1000.0),
      },
      vertexShader: vert,
      fragmentShader: frag,
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
    })
    this.cameraDirection = _cameraDirection
    this.camera = camera
    this.uniforms.cameraFar.value = this.camera.far
    this.uniforms.cameraNear.value = this.camera.near
  }

  update(deltaTime: number) {
    this.camera.getWorldDirection(this.cameraDirection)
    this.uniforms.uCameraWorldDirection.value = this.cameraDirection
    this.uniforms.uCameraPosition.value = this.camera.position
    this.uniforms.uCameraWorldDirection.value = this.cameraDirection
    this.uniforms.uTime.value += deltaTime
    this.uniforms.uFrame.value += 1
  }
}

export default RaymarchedCylinderAtmosphere
