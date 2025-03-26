"use client";

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CloudProps {
  position: [number, number, number];
  speed?: number;
}

export default function Cloud({ position, speed = 0.1 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = position[0];
  const opacityRef = useRef(0.8);
  const isFadingRef = useRef(false);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Move cloud horizontally
      groupRef.current.position.x += speed * delta;
      
      // Handle fading and position reset
      if (groupRef.current.position.x > initialX + 100) {
        if (!isFadingRef.current) {
          isFadingRef.current = true;
        }
        
        // Fade out
        if (opacityRef.current > 0) {
          opacityRef.current = Math.max(0, opacityRef.current - delta * 2);
          groupRef.current.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              (child.material as THREE.MeshStandardMaterial).opacity = opacityRef.current;
            }
          });
        } else {
          // Reset position when fully transparent
          groupRef.current.position.x = initialX - 100;
          isFadingRef.current = false;
        }
      } else if (isFadingRef.current === false && opacityRef.current < 0.8) {
        // Fade in after reset
        opacityRef.current = Math.min(0.8, opacityRef.current + delta * 2);
        groupRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).opacity = opacityRef.current;
          }
        });
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