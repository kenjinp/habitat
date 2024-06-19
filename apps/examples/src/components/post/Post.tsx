import { useThree } from "@react-three/fiber"
import { EffectComposer, Noise } from "@react-three/postprocessing"
import CylinderAtmospherePass from "../../effects/cylinder-atmosphere-pass/CylinderAtmospherePass"

export const Post: React.FC<React.PropsWithChildren> = ({ children }) => {
  const gl = useThree(state => state.gl)
  // workaround for https://github.com/pmndrs/drei/issues/803
  gl.autoClear = true
  const useEffectComposer = true

  return useEffectComposer ? (
    <>
      <EffectComposer>
        <CylinderAtmospherePass />
        <Noise opacity={0.1} />
        {/* <Depth /> */}
      </EffectComposer>
      {children}
    </>
  ) : null
}
