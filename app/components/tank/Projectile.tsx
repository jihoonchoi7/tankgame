"use client";

import { useRef, useEffect, useState } from "react";
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
  const groupRef = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(...initialPosition));
  const dir = useRef(new THREE.Vector3(...direction).normalize());
  const speed = 0.6; // Units per frame
  const lifetime = 2000; // ms
  const [trailPositions, setTrailPositions] = useState<THREE.Vector3[]>([]);
  
  useEffect(() => {
    // Remove projectile after lifetime expires
    const timer = setTimeout(() => {
      onRemove(id);
    }, lifetime);
    
    // Add this in useEffect
    console.log("Projectile Direction:", dir.current.x, dir.current.y, dir.current.z);
    
    return () => clearTimeout(timer);
  }, [id, onRemove]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update position along direction vector
    position.current.addScaledVector(dir.current, speed);
    
    // Add position to trail (keeping only recent positions)
    setTrailPositions(prev => {
      const newPositions = [...prev, position.current.clone()];
      if (newPositions.length > 10) newPositions.shift();
      return newPositions;
    });
    
    // Apply to group
    groupRef.current.position.copy(position.current);
    
    // IMPORTANT: Correctly orient the projectile in the direction of travel
    // Create a quaternion that rotates from the Z-axis (model forward) to the direction vector
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.current);
    groupRef.current.quaternion.copy(quaternion);
    
    // Add slight rotation effect for realism (spin around the direction of travel)
    const spinAxis = dir.current.clone();
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(spinAxis, delta * 2);
    groupRef.current.quaternion.premultiply(spinQuat);
  });
  
  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Main shell body - adjusted to point along Z axis instead of X */}
      <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
        <meshStandardMaterial color="#b8860b" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Bullet tip - adjusted position for Z-forward orientation */}
      <mesh position={[0, 0, 0.25]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <coneGeometry args={[0.1, 0.2, 12]} />
        <meshStandardMaterial color="#b8860b" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Casing base - adjusted position for Z-forward orientation */}
      <mesh position={[0, 0, -0.25]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.05, 12]} />
        <meshStandardMaterial color="#cd7f32" roughness={0.2} metalness={0.9} />
      </mesh>
      
      {/* Enhanced tracer effect - adjusted position */}
      <pointLight position={[0, 0, -0.35]} intensity={2} distance={3} color="orange" />
      
      {/* Trail effect - adjusted for Z-forward orientation */}
      {trailPositions.map((pos, i) => (
        <mesh 
          key={i} 
          position={[
            0, 
            0, 
            -0.3 - (i * 0.1)
          ]} 
          scale={[0.5 - i * 0.04, 0.5 - i * 0.04, 0.5 - i * 0.04]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial 
            color="orange" 
            opacity={0.7 - (i * 0.06)} 
            transparent={true} 
          />
        </mesh>
      ))}
    </group>
  );
} 