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
  const groupRef = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(...initialPosition));
  const dir = useRef(new THREE.Vector3(...direction).normalize());
  const speed = 0.6; // Units per frame
  const lifetime = 2000; // ms
  
  // Replace state with ref for trail positions
  const trailPositionsRef = useRef<THREE.Vector3[]>([]);
  // Keep a minimal state just for triggering renders when needed
  const [trailUpdated, setTrailUpdated] = useState(0);
  // Add maximum trail length as a constant
  const MAX_TRAIL_LENGTH = 10;
  // Add a ref for the instanced mesh
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  // Add a temporary matrix for updating instance transforms
  const tempMatrix = useRef(new THREE.Matrix4());
  
  useEffect(() => {
    // Remove projectile after lifetime expires
    const timer = setTimeout(() => {
      onRemove(id);
    }, lifetime);
    
    return () => clearTimeout(timer);
  }, [id, onRemove]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update position along direction vector
    position.current.addScaledVector(dir.current, speed);
    
    // Update trail positions in the ref (not state)
    const newPositions = [...trailPositionsRef.current, position.current.clone()];
    if (newPositions.length > MAX_TRAIL_LENGTH) newPositions.shift();
    trailPositionsRef.current = newPositions;
    
    // Update instanced mesh positions and scales
    if (trailMeshRef.current) {
      trailPositionsRef.current.forEach((_, i) => {
        // Reset the matrix
        tempMatrix.current.identity();
        
        // Set position
        tempMatrix.current.setPosition(0, 0, -0.3 - (i * 0.1));
        
        // Set scale
        const scale = 0.5 - i * 0.04;
        tempMatrix.current.scale(new THREE.Vector3(scale, scale, scale));
        
        // Apply the matrix to this instance
        trailMeshRef.current.setMatrixAt(i, tempMatrix.current);
      });
      
      // Important! Flag the instanceMatrix as needing an update
      trailMeshRef.current.instanceMatrix.needsUpdate = true;
      
      // Update the count to match our current trail length
      trailMeshRef.current.count = trailPositionsRef.current.length;
    }
    
    // Occasionally update the state to trigger re-renders
    if (state.clock.elapsedTime % 0.1 < delta) {
      setTrailUpdated(prev => prev + 1);
    }
    
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
      
      {/* Trail effect - now using instancedMesh for better performance */}
      <instancedMesh 
        ref={trailMeshRef} 
        args={[null, null, MAX_TRAIL_LENGTH]} // args: [geometry, material, instanceCount]
      >
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial 
          color="orange" 
          opacity={0.7} 
          transparent={true} 
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
} 