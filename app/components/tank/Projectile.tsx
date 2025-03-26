"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ProjectileProps {
  id: number;
  initialPosition: [number, number, number];
  direction: [number, number, number];
  onRemove: (id: number) => void;
  getTerrainHeight?: (x: number, z: number) => number;
  type?: 'main' | 'machineGun';
}

export default function Projectile({ 
  id, 
  initialPosition, 
  direction, 
  onRemove,
  getTerrainHeight = () => 0,
  type = 'main'
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
  const MAX_TRAIL_LENGTH = type === 'machineGun' ? 10 : 20;
  const TRAIL_SCALE = type === 'machineGun' ? 0.05 : 0.1;
  // Add circular buffer tracking variables
  const bufferIndexRef = useRef(0);
  const bufferSizeRef = useRef(0);
  // Add a ref for the instanced mesh
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  // Add a temporary matrix for updating instance transforms
  const tempMatrix = useRef(new THREE.Matrix4());
  // Add a vector pool for reusing Vector3 objects
  const vectorPoolRef = useRef<THREE.Vector3[]>(
    Array(MAX_TRAIL_LENGTH).fill(0).map(() => new THREE.Vector3())
  );
  const poolIndexRef = useRef(0);
  const [isExploding, setIsExploding] = useState(false);
  const explosionRef = useRef<THREE.Group>(null);
  const explosionParticles = useRef<Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
  }>>([]);
  
  useEffect(() => {
    // Initialize the trail positions array with empty vectors
    trailPositionsRef.current = Array(MAX_TRAIL_LENGTH).fill(0).map(() => new THREE.Vector3());
    
    // Initialize the trail mesh if needed
    if (trailMeshRef.current) {
      trailMeshRef.current.count = 0; // Start with no instances
      trailMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    
    // Remove projectile after lifetime expires
    const timer = setTimeout(() => {
      onRemove(id);
    }, lifetime);
    
    return () => clearTimeout(timer);
  }, [id, onRemove]);
  
  const createExplosion = () => {
    setIsExploding(true);
    
    // Store the final impact position
    const impactPosition = position.current.clone();
    
    // Create explosion particles starting from the impact position
    explosionParticles.current = new Array(20).fill(null).map(() => ({
      position: new THREE.Vector3(0, 0, 0), // Start at local origin
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      )
    }));

    // Set the group position immediately
    if (groupRef.current) {
      groupRef.current.position.copy(impactPosition);
    }
    
    // Remove projectile after explosion animation
    setTimeout(() => {
      onRemove(id);
    }, 1000);
  };
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (isExploding) {
      // Animate explosion particles
      if (explosionParticles.current && explosionRef.current) {
        explosionParticles.current.forEach((particle, i) => {
          particle.position.add(particle.velocity);
          particle.velocity.y -= 0.01; // Add gravity effect
          
          // Update instanced mesh
          if (explosionRef.current) {
            tempMatrix.current.makeTranslation(
              particle.position.x,
              particle.position.y,
              particle.position.z
            );
            (explosionRef.current.children[0] as THREE.InstancedMesh).setMatrixAt(i, tempMatrix.current);
            (explosionRef.current.children[0] as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
          }
        });
      }
    } else {
      // Update position along direction vector
      position.current.addScaledVector(dir.current, speed);
      
      // Check for terrain collision
      const terrainHeight = getTerrainHeight(position.current.x, position.current.z);
      if (position.current.y <= terrainHeight) {
        // Set the Y position exactly at terrain height before explosion
        position.current.y = terrainHeight;
        createExplosion();
        return;
      }
      
      // Get a vector from the pool and set its value
      // Limit the poolIndex to prevent potential overflow after long runtime
      const poolIndex = poolIndexRef.current % vectorPoolRef.current.length;
      const trailPosition = vectorPoolRef.current[poolIndex];
      trailPosition.copy(position.current);
      // Reset the counter to prevent overflow
      poolIndexRef.current = (poolIndexRef.current + 1) % MAX_TRAIL_LENGTH;
      
      // Implement circular buffer pattern for trail positions
      bufferIndexRef.current = (bufferIndexRef.current + 1) % MAX_TRAIL_LENGTH;
      trailPositionsRef.current[bufferIndexRef.current].copy(position.current);
      bufferSizeRef.current = Math.min(bufferSizeRef.current + 1, MAX_TRAIL_LENGTH);
      
      // Update instanced mesh positions and scales
      if (trailMeshRef.current) {
        for (let i = 0; i < bufferSizeRef.current; i++) {
          // Calculate the actual index in the circular buffer
          const actualIndex = (bufferIndexRef.current - i + MAX_TRAIL_LENGTH) % MAX_TRAIL_LENGTH;
          
          // Reset the matrix
          tempMatrix.current.identity();
          
          // Set position
          tempMatrix.current.setPosition(0, 0, -0.3 - (i * 0.1));
          
          // Set scale
          const scale = 0.5 - i * 0.04;
          tempMatrix.current.scale(new THREE.Vector3(scale, scale, scale));
          
          // Apply the matrix to this instance
          trailMeshRef.current?.setMatrixAt(i, tempMatrix.current);
        }
        
        // Important! Flag the instanceMatrix as needing an update
        trailMeshRef.current.instanceMatrix.needsUpdate = true;
        
        // Update the count to match our current trail length
        trailMeshRef.current.count = bufferSizeRef.current;
      }
      
      // Occasionally update the state to trigger re-renders
      if (state.clock.elapsedTime % 0.1 < delta) {
        setTrailUpdated(prev => prev + 1);
      }
      
      // Update group position
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
    }
  });
  
  return (
    <group ref={groupRef} position={initialPosition}>
      {!isExploding && (
        <>
          {type === 'main' ? (
            // Main cannon projectile
            <>
              {/* Main shell body */}
              <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
                <meshStandardMaterial color="#b8860b" roughness={0.3} metalness={0.8} />
              </mesh>
              
              {/* Bullet tip */}
              <mesh position={[0, 0, 0.25]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <coneGeometry args={[0.1, 0.2, 12]} />
                <meshStandardMaterial color="#b8860b" roughness={0.3} metalness={0.8} />
              </mesh>
            </>
          ) : (
            // Machine gun projectile
            <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
              <meshStandardMaterial color="#ffff00" roughness={0.3} metalness={0.8} emissive="#ffff00" emissiveIntensity={0.5} />
            </mesh>
          )}
          
          {/* Tracer effect */}
          <pointLight 
            position={[0, 0, -0.35]} 
            intensity={type === 'machineGun' ? 2 : 2} 
            distance={type === 'machineGun' ? 2 : 3} 
            color={type === 'machineGun' ? "#ffff00" : "orange"} 
          />
          
          {/* Trail effect - now using instancedMesh for better performance */}
          <instancedMesh 
            ref={trailMeshRef} 
            args={[undefined, undefined, MAX_TRAIL_LENGTH]}
          >
            <sphereGeometry args={[TRAIL_SCALE, 8, 8]} />
            <meshBasicMaterial 
              color={type === 'machineGun' ? "#ffff00" : "orange"} 
              opacity={0.7} 
              transparent={true} 
              toneMapped={false}
            />
          </instancedMesh>
        </>
      )}
      
      {isExploding && (
        <group ref={explosionRef} position={[0, 0, 0]}>  {/* Position at local origin since parent group is at impact point */}
          <instancedMesh args={[undefined, undefined, 20]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial 
              color="orange" 
              emissive="yellow" 
              emissiveIntensity={2}
              toneMapped={false}
            />
          </instancedMesh>
          <pointLight intensity={4} distance={5} color="orange" decay={2} />
        </group>
      )}
    </group>
  );
} 