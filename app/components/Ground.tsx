"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Ground() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial 
        color="#3a7e4c" 
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
} 