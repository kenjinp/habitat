import { useThree } from "@react-three/fiber"
import { EffectComposer, Noise } from "@react-three/postprocessing"

export const Post: React.FC<React.PropsWithChildren> = ({ children }) => {
  const gl = useThree(state => state.gl)
  // workaround for https://github.com/pmndrs/drei/issues/803
  gl.autoClear = true
  const useEffectComposer = true

  return useEffectComposer ? (
    <>
      {/* <CylinderAtmosphere /> */}
      <EffectComposer>
        {/* <TestPass /> */}
        {/* <Depth /> */}
        {/* <Bloom /> */}
        <Noise opacity={0.5} />
      </EffectComposer>
      {children}
    </>
  ) : null
}
