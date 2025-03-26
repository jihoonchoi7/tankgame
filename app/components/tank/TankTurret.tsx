"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface TankTurretProps {
  muzzleFlash?: boolean;
  cannonRecoil?: number;
  machineGunActive?: boolean;
  isFiring?: boolean;
}

const TankTurret = forwardRef<THREE.Group, TankTurretProps>(function TankTurret(
  { muzzleFlash = false, cannonRecoil = 0, machineGunActive = false, isFiring = false },
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  const tracersRef = useRef<THREE.InstancedMesh>(null);
  const MAX_TRACERS = 20;
  const tracerMatrices = useRef<THREE.Matrix4[]>([]);

  // Add refs for geometry and material to prevent recreation
  const tracerGeometryRef = useRef<THREE.CylinderGeometry | null>(null);
  const tracerMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Initialize tracer matrices, geometry, and material
  useEffect(() => {
    tracerMatrices.current = Array(MAX_TRACERS).fill(0).map(() => new THREE.Matrix4());
    
    // Create geometry and material once
    tracerGeometryRef.current = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
    tracerMaterialRef.current = new THREE.MeshBasicMaterial({
      color: "#ffff00",
      transparent: true,
      opacity: 0.8
    });

    // Cleanup function
    return () => {
      // Clear the matrices array
      tracerMatrices.current.forEach(matrix => {
        matrix.set(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0);
      });
      tracerMatrices.current = [];

      // Dispose geometry and material
      tracerGeometryRef.current?.dispose();
      tracerMaterialRef.current?.dispose();
      
      // Dispose the instancedMesh
      if (tracersRef.current) {
        tracersRef.current.dispose();
        tracersRef.current = null;
      }
    };
  }, []);

  // Expose the group ref to the parent component
  useImperativeHandle(ref, () => groupRef.current!);

  // Update tracer animations
  useFrame((state, delta) => {
    if (tracersRef.current && isFiring && machineGunActive) {
      // Update each tracer
      tracerMatrices.current.forEach((matrix, i) => {
        const position = new THREE.Vector3(
          0,
          0,
          (i / MAX_TRACERS) * 2 * delta * 60
        );
        const scale = new THREE.Vector3(0.02, 0.02, 0.15);
        const rotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, 0, Math.random() * Math.PI * 2)
        );

        matrix.compose(position, rotation, scale);
        tracersRef.current?.setMatrixAt(i, matrix);
      });
      
      tracersRef.current.instanceMatrix.needsUpdate = true;
    }
  });

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
      <group position={[0.6, 0.3, 0.5]} rotation={[0, 0, 0]}>
        {/* Machine gun mount base - connects to turret */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.6} />
        </mesh>

        {/* Machine gun pivot joint */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.8} />
        </mesh>

        {/* Machine gun assembly */}
        <group position={[0, 0.1, 0]} rotation={[0, 0, 0]}>
          {/* Machine gun base housing */}
          <mesh position={[0, 0, 0.15]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 0.15, 0.3]} />
            <meshStandardMaterial color="#444444" roughness={0.6} metalness={0.8} />
          </mesh>
          
          {/* Machine gun cooling jacket */}
          <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.9} />
          </mesh>

          {/* Machine gun barrel */}
          <mesh position={[0, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
            <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.9} />
          </mesh>

          {/* Machine gun muzzle */}
          <mesh position={[0, 0, 1.7]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.03, 0.1, 8]} />
            <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.9} />
          </mesh>

          {/* Machine gun effects */}
          {machineGunActive && isFiring && (
            <>
              {/* Muzzle flash */}
              <group position={[0, 0, 1.75]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.03, 0.06, 0.15, 8]} />
                  <meshBasicMaterial color="#ffff80" transparent opacity={0.9} />
                </mesh>
                
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.08, 0.04, 0.25, 8]} />
                  <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
                </mesh>

                <pointLight
                  position={[0, 0, 0.1]}
                  distance={2}
                  intensity={2}
                  color="#ffff00"
                />
              </group>

              {/* Tracer effect */}
              {tracerGeometryRef.current && tracerMaterialRef.current && (
                <instancedMesh 
                  ref={tracersRef} 
                  args={[tracerGeometryRef.current, tracerMaterialRef.current, MAX_TRACERS]}
                />
              )}
            </>
          )}
        </group>
      </group>
      
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