import { Html, ScreenSpace } from "@react-three/drei"
import { ForwardRefComponent } from "@react-three/drei/helpers/ts-utils"
import {
  EventManager,
  Object3DNode,
  useFrame,
  useThree,
} from "@react-three/fiber"
import * as React from "react"
import { ArrowHelper, AxesHelper, Vector3 } from "three"
import { FlyCamera as FirstPersonControlImpl } from "./FlyCamera"

export type FirstPersonControlsProps = Object3DNode<
  FirstPersonControlImpl,
  typeof FirstPersonControlImpl
> & {
  domElement?: HTMLElement
  makeDefault?: boolean
}
let original = null

export const FirstPersonControls: ForwardRefComponent<
  FirstPersonControlsProps,
  FirstPersonControlImpl
> = /* @__PURE__ */ React.forwardRef<
  FirstPersonControlImpl,
  FirstPersonControlsProps
>(({ domElement, makeDefault, ...props }, ref) => {
  const axesRef = React.useRef<AxesHelper>()
  const arrowRef = React.useRef<ArrowHelper>()
  const directionAlongGroundRef = React.useRef<ArrowHelper>()
  const camera = useThree(state => state.camera)
  const scene = useThree(state => state.scene)

  const gl = useThree(state => state.gl)
  const events = useThree(state => state.events) as EventManager<HTMLElement>
  const get = useThree(state => state.get)
  const set = useThree(state => state.set)
  const explDomElement = (domElement ||
    events.connected ||
    gl.domElement) as HTMLElement
  const controls = React.useMemo(() => {
    console.log("hello new guy")
    return new FirstPersonControlImpl(camera, scene, explDomElement)
  }, [])

  React.useEffect(() => {
    return () => {
      console.log("DESTROY")
      controls.dispose()
    }
  }, [controls])

  React.useEffect(() => {
    if (makeDefault) {
      const old = get().controls
      set({ controls })
      return () => {
        set({ controls: old })
      }
    }
  }, [makeDefault, controls])

  useFrame((_, delta) => {
    controls.update(delta)
    axesRef.current!.up.copy(controls.up)
    axesRef.current?.rotation.copy(controls.object.rotation)
    arrowRef.current!.setDirection(controls.up)
    directionAlongGroundRef.current!.setDirection(controls.directionAlongGround)
    directionAlongGroundRef.current!.setColor("green")
    document.getElementById("stats")!.innerHTML = `
      ${controls.lat}
      ${controls.lon}
    `
  }, -1)

  return controls ? (
    <>
      <ScreenSpace depth={10}>
        <Html position={new Vector3(10, 0, 0)}>
          <p>Orientation</p>

          <p id="stats"></p>
        </Html>
        <axesHelper ref={axesRef} position={new Vector3(10, 0, 0)} />
        <arrowHelper
          ref={directionAlongGroundRef}
          args={[new Vector3(0, 0, 1), new Vector3(10, 0, 0), 5]}
        />
        <arrowHelper
          ref={arrowRef}
          args={[new Vector3(0, 0, 1), new Vector3(10, 0, 0), 5]}
        />
      </ScreenSpace>
      <mesh
        position={controls.container.position}
        rotation={controls.container.rotation}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <primitive
        key="controls"
        ref={ref}
        object={controls}
        {...props}
      ></primitive>
    </>
  ) : null
})
