"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ProjectileProps {
  id: number;
  initialPosition: [number, number, number];
  direction: [number, number, number];
  onRemove: (id: number) => void;
}

export default function Projectile({ 
  id, 
  initialPosition, 
  direction, 
  onRemove 
}: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useRef(new THREE.Vector3(...initialPosition));
  const dir = useRef(new THREE.Vector3(...direction).normalize());
  const speed = 0.6; // Units per frame
  const lifetime = 2000; // ms
  
  useEffect(() => {
    // Remove projectile after lifetime expires
    const timer = setTimeout(() => {
      onRemove(id);
    }, lifetime);
    
    return () => clearTimeout(timer);
  }, [id, onRemove]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update position along direction vector
    position.current.addScaledVector(dir.current, speed);
    
    // Apply to mesh
    meshRef.current.position.copy(position.current);
  });
  
  return (
    <mesh ref={meshRef} position={initialPosition}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial emissive="red" emissiveIntensity={2} />
      <pointLight intensity={5} distance={3} color="red" />
    </mesh>
  );
} 