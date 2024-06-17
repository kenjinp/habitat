import { TextureEffect } from "postprocessing"
import { Ref, forwardRef, useMemo } from "react"

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc?: string
}

export const Texture = forwardRef<TextureEffect, TextureProps>(function Texture(
  { texture, ...props }: TextureProps,
  ref: Ref<TextureEffect>,
) {
  const effect = useMemo(
    () => new TextureEffect({ ...props, texture }),
    [props, texture],
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})
