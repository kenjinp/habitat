import React from "react"
import { BrowserRouter } from "react-router-dom"

import { Leva } from "leva"
import { Footer } from "./components/footer/Footer"
import Home from "./pages/home/Home"

interface IRoute {
  name: string
  path: string
  component: React.ComponentType
}

const routes: IRoute[] = [
  {
    name: "Home",
    path: "/",
    component: Home,
  },
]

const hidden = false
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Leva hidden={hidden} />
      <h1>Hello World</h1>
      <Footer />
    </BrowserRouter>
  )
}

export default App
