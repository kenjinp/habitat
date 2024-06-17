import { useEffect, useState } from "react"

export function useImageData(imageSrc: string) {
  const [state, setState] = useState("loading")
  const [result, setImageData] = useState<Uint8Array | null>(null)

  const loadImage = async () => {
    try {
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const img = await createImageBitmap(blob)
      // get ImageData form ImageBitmap
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = img.width
      canvas.height = img.height

      console.log({ img })
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const imageDataBuffer = new Uint8Array(imageData.data)

      setImageData(imageDataBuffer)
      setState("idle")
    } catch (error) {
      console.error(error)
      setState("error")
    }
  }

  useEffect(() => {
    loadImage()
  }, [])

  return {
    state,
    result,
  }
}
