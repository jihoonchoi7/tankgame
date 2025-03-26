"use client";

import { useRef } from 'react';
import * as THREE from 'three';

interface RockProps {
  position: [number, number, number];
  scale?: number;
}

export default function Rock({ position, scale = 1 }: RockProps) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.5]} />
        <meshStandardMaterial 
          color="#666666" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
} 