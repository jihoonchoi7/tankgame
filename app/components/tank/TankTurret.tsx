"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface TankTurretProps {
  // Optional props could be added here
}

const TankTurret = forwardRef<THREE.Group, TankTurretProps>(function TankTurret(props, ref) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Expose the group ref to the parent component
  useImperativeHandle(ref, () => groupRef.current!);
  
  return (
    <group ref={groupRef} position={[0, 1.0, 0]}>
      {/* Turret base - rotating part */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.5, 16]} />
        <meshStandardMaterial color="#4a5c6b" roughness={0.6} metalness={0.7} />
      </mesh>
      
      {/* Turret dome */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a5c6b" roughness={0.6} metalness={0.7} />
      </mesh>
      
      {/* Main cannon */}
      <group position={[0, 0.25, 0]}>
        {/* Cannon barrel */}
        <mesh position={[0, 0, 1.8]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 3, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.9} />
        </mesh>
        
        {/* Barrel base/attachment */}
        <mesh position={[0, 0, 0.4]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.9} />
        </mesh>
      </group>
      
      {/* Commander hatch */}
      <mesh position={[0, 0.5, -0.3]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.6} />
      </mesh>
      
      {/* Machine gun mount */}
      <mesh position={[0, 0.5, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.15, 0.35]} />
        <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.6} />
      </mesh>
      
      {/* Gun barrel muzzle with laser effect */}
      <mesh position={[0, 0.25, 3.3]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.15, 0.2, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.9} />
      </mesh>
      
      {/* Red light around barrel end - for laser visual effect */}
      <pointLight position={[0, 0.25, 3.3]} intensity={0.5} distance={2} color="red" />
    </group>
  );
});

TankTurret.displayName = "TankTurret";

export default TankTurret; 