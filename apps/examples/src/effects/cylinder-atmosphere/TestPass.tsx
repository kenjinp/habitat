import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { Pass, ShaderPass } from "postprocessing"
import React, { useMemo } from "react"
import {
  Camera,
  Matrix4,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three"

export interface FogEffectProps {
  camera: Camera
}

// tempValues
const _cameraDirection = new Vector3()
const _position = new Vector3()
const _matrixWorld = new Matrix4()
const _projectionMatrixInverse = new Matrix4()

class TestPassImpl extends Pass {
  private downsampleRenderTarget: WebGLRenderTarget
  constructor(
    scene,
    camera,
    downsample = 2,
    width = window.innerWidth,
    height = window.innerHeight,
  ) {
    super()
    this.camera = camera
    this.scene = scene
    const downsampleWidth = width / downsample
    const downsampleHeight = height / downsample
    this.downsampleRenderTarget = new WebGLRenderTarget(
      downsampleWidth,
      downsampleHeight,
    )
    const upsampleShader = {
      uniforms: {
        tDiffuse: { value: this.downsampleRenderTarget.texture },
        uUpscaling: { value: true },
        downsampleResolution: {
          value: new Vector2(downsampleWidth, downsampleHeight),
        },
      },
      vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = position.xy * 0.5 + 0.5;
            gl_Position = vec4(position.xy, 1.0, 1.0);
          }
      `,
      fragmentShader: `
          #include <common>
          #include <dithering_pars_fragment>

          // Based on https://www.shadertoy.com/view/ltKBDd by battlebottle

          uniform sampler2D tDiffuse;
          uniform bool uUpscaling;

          varying vec2 vUv;

          float w0(float a)
          {
              return (1.0/6.0)*(a*(a*(-a + 3.0) - 3.0) + 1.0);
          }

          float w1(float a)
          {
              return (1.0/6.0)*(a*a*(3.0*a - 6.0) + 4.0);
          }

          float w2(float a)
          {
              return (1.0/6.0)*(a*(a*(-3.0*a + 3.0) + 3.0) + 1.0);
          }

          float w3(float a)
          {
              return (1.0/6.0)*(a*a*a);
          }

          // g0 and g1 are the two amplitude functions
          float g0(float a)
          {
              return w0(a) + w1(a);
          }

          float g1(float a)
          {
              return w2(a) + w3(a);
          }

          // h0 and h1 are the two offset functions
          float h0(float a)
          {
              return -1.0 + w1(a) / (w0(a) + w1(a));
          }

          float h1(float a)
          {
              return 1.0 + w3(a) / (w2(a) + w3(a));
          }

          vec4 texture_bicubic(sampler2D tex, vec2 uv, vec4 texelSize, vec2 fullSize, float lod)
          {
            uv = uv*texelSize.zw + 0.5;
            vec2 iuv = floor( uv );
            vec2 fuv = fract( uv );

              float g0x = g0(fuv.x);
              float g1x = g1(fuv.x);
              float h0x = h0(fuv.x);
              float h1x = h1(fuv.x);
              float h0y = h0(fuv.y);
              float h1y = h1(fuv.y);

            vec2 p0 = (vec2(iuv.x + h0x, iuv.y + h0y) - 0.5) * texelSize.xy;
            vec2 p1 = (vec2(iuv.x + h1x, iuv.y + h0y) - 0.5) * texelSize.xy;
            vec2 p2 = (vec2(iuv.x + h0x, iuv.y + h1y) - 0.5) * texelSize.xy;
            vec2 p3 = (vec2(iuv.x + h1x, iuv.y + h1y) - 0.5) * texelSize.xy;
            
              vec2 lodFudge = pow(1.95, lod) / fullSize;
              return g0(fuv.y) * (g0x * 
                  textureLod(tex, p0, lod)  +
                                  
                  g1x * textureLod(tex, p1, lod)
                              ) +
                    g1(fuv.y) * (
                      g0x * textureLod(tex, p2, lod)  +
                                  g1x * textureLod(tex, p3, lod));
          }


          vec4 textureBicubic(sampler2D s, vec2 uv, float lod) {
            vec2 lodSizeFloor = vec2(textureSize(s, int(lod)));
            vec2 lodSizeCeil = vec2(textureSize(s, int(lod + 1.0)));
            vec2 fullSize = vec2(textureSize(s, 0));
            vec4 floorSample = texture_bicubic( s, uv, vec4(1.0 / lodSizeFloor.x, 1.0 / lodSizeFloor.y, lodSizeFloor.x, lodSizeFloor.y), fullSize, floor(lod));
            vec4 ceilSample = texture_bicubic( s, uv, vec4(1.0 / lodSizeCeil.x, 1.0 / lodSizeCeil.y, lodSizeCeil.x, lodSizeCeil.y), fullSize, ceil(lod));
            return mix(floorSample, ceilSample, fract(lod));
          }

          void main() {
              vec2 uv = vUv;
              vec4 res = uUpscaling ? textureBicubic(tDiffuse, uv, 0.5) : texture2D(tDiffuse, uv);

              vec4 color = res;
              gl_FragColor = color;

              #include <colorspace_fragment>
              #include <dithering_fragment>
          }

          
      `,
    }
    this.shader = new ShaderMaterial({
      uniforms: upsampleShader.uniforms,
      vertexShader: upsampleShader.vertexShader,
      fragmentShader: upsampleShader.fragmentShader,
    })
  }
  render(renderer) {
    renderer.setRenderTarget(this.downsampleRenderTarget)
    renderer.render(this.scene, this.camera)
  }

  get outputTarget() {
    return this.downsampleRenderTarget
  }

  get fullscreenShader() {
    return this.shader
  }
}

export const TestPass: React.FC = _ => {
  const { camera, scene } = useThree()

  const { downsample } = useControls({
    downsample: {
      value: 10,
      min: 1,
      max: 10,
      step: 1,
    },
  })
  const effect = useMemo(
    () => new TestPassImpl(scene, camera, downsample),
    [downsample],
  )
  const shaderEffect = useMemo(() => {
    const pass = new ShaderPass(effect.fullscreenShader, "tDiffuse")
    pass.input = effect.outputTarget.texture
    return pass
  }, [effect])

  return (
    <>
      <primitive object={effect} />
      <primitive object={shaderEffect} />
    </>
  )
}
