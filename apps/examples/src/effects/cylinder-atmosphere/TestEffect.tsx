import { useThree } from "@react-three/fiber"
import { wrapEffect } from "@react-three/postprocessing"
import { Effect, EffectAttribute, WebGLExtension } from "postprocessing"
import React from "react"
import {
  Camera,
  MathUtils,
  Matrix4,
  Uniform,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three"
import fragment from "./Test.frag.glsl"

export interface FogEffectProps {
  camera: Camera
}

// tempValues
const _cameraDirection = new Vector3()
const _position = new Vector3()
const _matrixWorld = new Matrix4()
const _projectionMatrixInverse = new Matrix4()

class TestEffectImpl extends Effect {
  camera: Camera
  id: string
  constructor({ camera }: FogEffectProps) {
    // camera gets added after construction in effect-composer
    if (camera) {
      camera.getWorldPosition(_position)
      camera.getWorldDirection(_cameraDirection)
    }

    super("TestEffect", fragment, {
      uniforms: new Map<string, Uniform>([
        ["uCameraPosition", new Uniform(_position)],
        ["uCameraWorldDirection", new Uniform(_cameraDirection)],
        ["uViewMatrixInverse", new Uniform(_matrixWorld)],
        ["uProjectionMatrixInverse", new Uniform(_projectionMatrixInverse)],
        ["uFrame", new Uniform(0)],
        ["uTime", new Uniform(0)],
      ]),
      attributes: EffectAttribute.DEPTH,
      extensions: new Set([WebGLExtension.DERIVATIVES]),
    })

    this.camera = camera
    this.id = MathUtils.generateUUID()
  }

  update(
    _renderer: WebGLRenderer,
    _renderTarget: WebGLRenderTarget,
    deltaTime: number,
  ) {
    this.camera.getWorldPosition(_position)
    this.camera.getWorldDirection(_cameraDirection)
    this.uniforms.get("uCameraWorldDirection")!.value = _cameraDirection
    this.uniforms.get("uCameraPosition")!.value = _position
    this.uniforms.get("uTime")!.value += deltaTime
    this.uniforms.get("uFrame")!.value += 1
    this.uniforms.get("uViewMatrixInverse")!.value = this.camera?.matrixWorld
    this.uniforms.get("uProjectionMatrixInverse")!.value =
      this.camera?.projectionMatrixInverse
  }
}

export const TestEffect_ = wrapEffect(TestEffectImpl)

export const TestEffect: React.FC = _ => {
  const { camera } = useThree()
  return <TestEffect_ camera={camera} />
}
