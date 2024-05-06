import { OrbitControls } from "@react-three/drei"
import Habitat from "../../components/habitat/Habitat"
import { Scene } from "../../components/scene/Scene"

export default function Home() {
  return (
    <Scene>
      <Habitat />
      <OrbitControls />
    </Scene>
  )
}
