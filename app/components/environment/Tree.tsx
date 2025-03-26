"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

export default function Tree({ position, scale = 1 }: TreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create shared materials using useMemo to avoid recreating them on each render
  const materials = useMemo(() => {
    return {
      trunk: new THREE.MeshStandardMaterial({ color: "#4a3728", roughness: 0.8 }),
      foliage: new THREE.MeshStandardMaterial({ color: "#2d5a27", roughness: 0.7 })
    };
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <primitive object={materials.trunk} />
      </mesh>
      
      {/* Tree foliage - multiple layers for fuller look */}
      <group position={[0, 1.5, 0]}>
        {/* Using shared foliage material for both cones */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <coneGeometry args={[1, 2, 8]} />
          <primitive object={materials.foliage} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
          <coneGeometry args={[0.8, 1.5, 8]} />
          <primitive object={materials.foliage} />
        </mesh>
      </group>
    </group>
  );
} 