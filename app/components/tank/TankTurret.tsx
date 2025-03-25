"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface TankTurretProps {
  muzzleFlash?: boolean;
  cannonRecoil?: number;
}

const TankTurret = forwardRef<THREE.Group, TankTurretProps>(function TankTurret(
  { muzzleFlash = false, cannonRecoil = 0 },
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Expose the group ref to the parent component
  useImperativeHandle(ref, () => groupRef.current!);
  
  return (
    <group ref={groupRef} position={[0, 0.9, 0]}>
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
      
      {/* Main cannon - with recoil animation */}
      <group position={[0, 0.25, 0]} rotation={[0, 0, 0]}>
        {/* Cannon barrel - apply recoil to barrel's position directly */}
        <mesh 
          position={[0, 0, 1.8 + cannonRecoil]} 
          rotation={[Math.PI / 2, 0, 0]} 
          castShadow 
          receiveShadow
        >
          <cylinderGeometry args={[0.2, 0.2, 3, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.9} />
        </mesh>
        
        {/* Barrel base/attachment - apply recoil to base position too */}
        <mesh 
          position={[0, 0, 0.4 + cannonRecoil]} 
          rotation={[Math.PI / 2, 0, 0]} 
          castShadow 
          receiveShadow
        >
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
      
      {/* Muzzle flash effect - only visible when shooting */}
      {muzzleFlash && (
        <>
          {/* Inner bright flash */}
          <mesh position={[0, 0.25, 3.5 + cannonRecoil]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.35, 0.3, 16]} />
            <meshBasicMaterial color="#ffff80" transparent opacity={0.9} />
          </mesh>
          
          {/* Outer flash glow */}
          <mesh position={[0, 0.25, 3.6 + cannonRecoil]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.2, 0.5, 16]} />
            <meshBasicMaterial color="#ff8c00" transparent opacity={0.6} />
          </mesh>
          
          {/* Point light for illumination */}
          <pointLight
            position={[0, 0.25, 3.6 + cannonRecoil]}
            distance={5}
            intensity={5}
            color="#ffcc00"
          />
        </>
      )}
      
      {/* Permanent red light around barrel end - for laser visual effect */}
      <pointLight position={[0, 0.25, 3.3 + cannonRecoil]} intensity={0.5} distance={2} color="red" />
    </group>
  );
});

TankTurret.displayName = "TankTurret";

export default TankTurret; 