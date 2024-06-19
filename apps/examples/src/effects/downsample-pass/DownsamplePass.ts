import { Pass } from "postprocessing"
import {
  Camera,
  Clock,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three"

export interface DownsampleShaderMaterial extends ShaderMaterial {
  update(deltaTime: number): void
}

export class DownsamplePass extends Pass {
  name: string = "DownsamplePass"
  private downsampleRenderTarget: WebGLRenderTarget
  private clock = new Clock(true)
  constructor(
    public scene: Scene,
    public camera: Camera,
    private downsample = 2,
    public shader: DownsampleShaderMaterial,
    width = window.innerWidth,
    height = window.innerHeight,
  ) {
    super()
    const downsampleWidth = width / this.downsample
    const downsampleHeight = height / this.downsample
    this.downsampleRenderTarget = new WebGLRenderTarget(
      downsampleWidth,
      downsampleHeight,
    )
    this.fullscreenMaterial = shader
  }
  render(
    renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    _outputTarget: WebGLRenderTarget,
  ) {
    this.shader.update(this.clock.getDelta())
    renderer.setRenderTarget(this.downsampleRenderTarget)
    renderer.render(this.scene, this.camera)
    renderer.setRenderTarget(null)
  }

  get outputTarget() {
    return this.downsampleRenderTarget
  }
}
