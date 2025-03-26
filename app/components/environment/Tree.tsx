"use client";

import { useRef } from "react";
import * as THREE from "three";

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

export default function Tree({ position, scale = 1 }: TreeProps) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      
      {/* Tree foliage - multiple layers for fuller look */}
      <group position={[0, 1.5, 0]}>
        <mesh castShadow position={[0, 0, 0]}>
          <coneGeometry args={[1, 2, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, -0.5, 0]}>
          <coneGeometry args={[0.8, 1.5, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
} 