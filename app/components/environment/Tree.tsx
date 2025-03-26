"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

export default function Tree({ position, scale = 1 }: TreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create materials with useMemo to avoid recreations on re-renders
  const materials = useMemo(() => {
    return {
      trunk: new THREE.MeshStandardMaterial({ color: "#4a3728", roughness: 0.8 }),
      foliage: new THREE.MeshStandardMaterial({ color: "#2d5a27", roughness: 0.7 })
    };
  }, []);
  
  // Clean up materials when component unmounts
  useEffect(() => {
    return () => {
      // Dispose materials on cleanup
      materials.trunk.dispose();
      materials.foliage.dispose();
    };
  }, [materials]);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <primitive object={materials.trunk} attach="material" />
      </mesh>
      
      {/* Tree foliage - multiple layers for fuller look */}
      <group position={[0, 1.5, 0]}>
        {/* First cone */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <coneGeometry args={[1, 2, 8]} />
          <primitive object={materials.foliage} attach="material" />
        </mesh>
        {/* Second cone */}
        <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
          <coneGeometry args={[0.8, 1.5, 8]} />
          <primitive object={materials.foliage} attach="material" />
        </mesh>
      </group>
    </group>
  );
} 