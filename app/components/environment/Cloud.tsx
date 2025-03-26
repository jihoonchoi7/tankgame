"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CloudProps {
  position: [number, number, number];
  speed?: number;
}

export default function Cloud({ position, speed = 0.1 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = position[0];

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Move cloud horizontally
      groupRef.current.position.x += speed * delta;
      
      // Reset position when cloud moves too far
      if (groupRef.current.position.x > initialX + 100) {
        groupRef.current.position.x = initialX - 100;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Create cloud using multiple spheres */}
      <mesh castShadow>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial 
          color="white" 
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh castShadow position={[-1.5, -0.5, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial 
          color="white" 
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh castShadow position={[1.5, -0.5, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial 
          color="white" 
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
} 