import * as React from 'react'
import { SpaceBox } from '../space-box/SpaceBox'
import { Vector3 } from 'three'
import { Stars } from '@react-three/drei'
import { Star } from '../star/Star'
import { AU } from '@hello-worlds/planets'

export const Scene: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <directionalLight color="white" position={[0, 1000, 0]} intensity={2} />
      <SpaceBox />
      <group
        scale={new Vector3(1, 1, 1).multiplyScalar(AU).multiplyScalar(10)}
      >
        <Stars saturation={1} count={10_000} />
        <Star
          position={new Vector3(-AU, 0, -AU)}
          color="white"
          emissive="white"
          lightIntensity={2}
          name="sun"
        />
      </group>
      {children}
    </>
  )
}