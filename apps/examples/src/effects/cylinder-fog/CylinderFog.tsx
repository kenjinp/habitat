import { wrapEffect } from "@react-three/postprocessing"
import { Effect, EffectAttribute, WebGLExtension } from "postprocessing"
import React, { useEffect } from "react"
import {
  Camera,
  MathUtils,
  Matrix4,
  PointLight,
  Texture,
  Uniform,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three"
import fragment from "./Fog.glsl"

export interface FogEffectProps {
  camera: Camera
  pointLight: PointLight
}

// tempValues
const _cameraDirection = new Vector3()
const _position = new Vector3()
const _matrixWorld = new Matrix4()
const _projectionMatrixInverse = new Matrix4()

class CylinderFogEffect extends Effect {
  camera: Camera
  pointLight: PointLight
  id: string
  constructor({ camera, pointLight }: FogEffectProps) {
    // camera gets added after construction in effect-composer
    if (camera) {
      camera.getWorldPosition(_position)
      camera.getWorldDirection(_cameraDirection)
    }

    if (!pointLight.shadow.map?.texture) {
      throw new Error("Shadow map not found")
    }

    const pointLightShadow = {
      shadowBias: pointLight.shadow.bias,
      shadowNormalBias: pointLight.shadow.normalBias,
      shadowRadius: pointLight.shadow.radius,
      shadowMapSize: pointLight.shadow.mapSize,
      shadowCameraNear: pointLight.shadow.camera.near,
      shadowCameraFar: pointLight.shadow.camera.far,
    }

    super("FogEffect", fragment, {
      uniforms: new Map<string, Uniform>([
        ["uCameraPosition", new Uniform(_position)],
        ["uCameraWorldDirection", new Uniform(_cameraDirection)],
        ["uViewMatrixInverse", new Uniform(_matrixWorld)],
        ["uProjectionMatrixInverse", new Uniform(_projectionMatrixInverse)],
        ["uPointLightShadow", new Uniform(pointLightShadow)],
        ["uPointShadowMap", new Uniform(pointLight.shadow.map?.texture)],
        ["uPointLightShadowMatrix", new Uniform(pointLight.shadow.matrix)],
        ["uSunPosition", new Uniform(pointLight.position)],
        ["uTime", new Uniform(0)],
      ]),
      attributes: EffectAttribute.DEPTH,
      extensions: new Set([WebGLExtension.DERIVATIVES]),
    })

    this.camera = camera
    this.pointLight = pointLight
    this.id = MathUtils.generateUUID()
  }

  update(
    _renderer: WebGLRenderer,
    _renderTarget: WebGLRenderTarget,
    deltaTime: number,
  ) {
    if (!this.pointLight.shadow.map?.texture) {
      throw new Error("Shadow map not found")
    }

    this.camera.getWorldPosition(_position)
    this.camera.getWorldDirection(_cameraDirection)
    this.uniforms.get("uCameraWorldDirection")!.value = _cameraDirection
    this.uniforms.get("uCameraPosition")!.value = _position
    this.uniforms.get("uTime")!.value += deltaTime
    this.uniforms.get("uViewMatrixInverse")!.value = this.camera?.matrixWorld
    this.uniforms.get("uSunPosition")!.value = this.pointLight.position
    this.uniforms.get("uProjectionMatrixInverse")!.value =
      this.camera?.projectionMatrixInverse
    // this.uniforms.get("uPointLightShadow")!.value =
    //   this.pointLight.shadow.map?.texture
  }
}

const usePollForShadowMap = (pointLight: PointLight) => {
  const [shadowMap, setShadowMap] = React.useState<Texture | null>(null)
  useEffect(() => {
    const interval = setInterval(() => {
      if (pointLight?.shadow?.map?.texture) {
        setShadowMap(pointLight.shadow.map?.texture)
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [pointLight?.shadow?.map?.texture])
  return shadowMap
}

export const CylinderFog_ = wrapEffect(CylinderFogEffect)

export const CylinderFog: React.FC<FogEffectProps> = props => {
  const shadowMap = usePollForShadowMap(props.pointLight)

  if (!props.camera || !props.pointLight || !shadowMap) {
    return null
  }
  console.log("shadowMap", shadowMap)
  return <CylinderFog_ {...props} />
}
