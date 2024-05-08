import { useThree } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import { Fog } from "../../effects/fog/Fog"
import { useSun } from "../../hooks/use-sun"

export const Post: React.FC<React.PropsWithChildren> = ({ children }) => {
  const gl = useThree(state => state.gl)
  const camera = useThree(state => state.camera)
  const light = useThree(state => state.scene.children.find(child => child.name === "sun") as THREE.DirectionalLight)
  // workaround for https://github.com/pmndrs/drei/issues/803
  gl.autoClear = true
  const useEffectComposer = true

  console.log(light)
  return useEffectComposer ? (
    <>
      <EffectComposer>
      {light?.shadow?.map?.texture && (
          <Fog camera={camera} directionalLight={light} />
        )}
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.8} height={512} />
        <Noise opacity={0.016} />
        {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}
        {children}
      </EffectComposer>
    </>
  ) : null
}
