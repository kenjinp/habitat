import { useEffect, useState } from "react"
import { processImageData } from "./image"

export function useImageModel() {
  const [state, setState] = useState("loading")
  const [result, setImageData] = useState<{
    terrainData: Uint8Array
    oceanData: Uint8Array
  } | null>(null)

  const loadImage = async () => {
    try {
      const response = await fetch("/terrain/elevation.png")
      const blob = await response.blob()
      const img = await createImageBitmap(blob)
      // get ImageData form ImageBitmap
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)

      const terrainData = new Uint8Array(imageData.data)
      const oceanData = new Uint8Array(processImageData(imageData).data)

      console.log(imageData)

      console.log(img)
      setImageData({
        terrainData,
        oceanData,
      })
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
