"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function TankBody() {
  const meshRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 0.8, 3]} />
        <meshStandardMaterial color="#566d7c" roughness={0.5} metalness={0.7} />
      </mesh>
      
      {/* Tank treads left */}
      <mesh position={[-1.1, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.5, 3.6]} />
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Tank treads right */}
      <mesh position={[1.1, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.5, 3.6]} />
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Front armor plate */}
      <mesh position={[0, 0.1, 1.5]} rotation={[Math.PI * 0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.6, 0.2]} />
        <meshStandardMaterial color="#3a4a55" roughness={0.6} metalness={0.8} />
      </mesh>
      
      {/* Rear armor plate */}
      <mesh position={[0, 0.1, -1.5]} rotation={[-Math.PI * 0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.6, 0.2]} />
        <meshStandardMaterial color="#3a4a55" roughness={0.6} metalness={0.8} />
      </mesh>
      
      {/* Small wheels between tracks (decorative) */}
      {[-1.2, -0.7, 0, 0.7, 1.2].map((z, i) => (
        <group key={i} position={[0, -0.4, z]}>
          <mesh position={[-1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
            <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
            <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
} 