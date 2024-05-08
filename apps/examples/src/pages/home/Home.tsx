import { OrbitControls } from "@react-three/drei"
import Habitat from "../../components/habitat/Habitat"
import { Scene } from "../../components/scene/Scene"

export default function Home() {
  return (
    <Scene>
      <Habitat />
      <OrbitControls />
      {/* <FlyControls movementSpeed={10_000} rollSpeed={2} /> */}
    </Scene>
  )
}
