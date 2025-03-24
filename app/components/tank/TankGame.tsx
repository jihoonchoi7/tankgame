"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Sky, Environment } from "@react-three/drei";
import Tank from "./Tank";
import Ground from "../Ground";
import { useControls } from "../../utils/useControls";
import * as THREE from "three";

// Component to handle projectile movement
function Projectile({ id, initialPosition, direction, onRemove }: { 
  id: number; 
  initialPosition: [number, number, number]; 
  direction: [number, number, number];
  onRemove: (id: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(...initialPosition));
  const dir = useRef(new THREE.Vector3(...direction).normalize());
  const speed = 0.5; // Units per frame
  const lifetime = 2000; // ms
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, lifetime);
    
    return () => clearTimeout(timer);
  }, [id, onRemove]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update position along direction vector
    position.current.addScaledVector(dir.current, speed);
    
    // Apply to mesh
    groupRef.current.position.copy(position.current);
    
    // Orient the shell in the direction of travel
    if (dir.current) {
      // Create a rotation that orients the shell along its trajectory
      const shellDirection = new THREE.Vector3(0, 0, 1);
      groupRef.current.quaternion.setFromUnitVectors(shellDirection, dir.current);
    }
  });
  
  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Shell body - main cylindrical part */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
        <meshStandardMaterial color="#b8860b" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Shell tip - conical part */}
      <mesh castShadow receiveShadow position={[0, 0, 0.25]}>
        <coneGeometry args={[0.1, 0.3, 12]} />
        <meshStandardMaterial color="#cd7f32" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Shell base - slight protrusion */}
      <mesh castShadow receiveShadow position={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.11, 0.11, 0.05, 12]} />
        <meshStandardMaterial color="#8b4513" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Tracer effect */}
      <pointLight intensity={2} distance={5} color="orange" />
      <mesh position={[0, 0, -0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial emissive="orange" emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export default function TankGame() {
  const [projectiles, setProjectiles] = useState<Array<{ id: number; position: [number, number, number]; direction: [number, number, number] }>>([]);
  const projectileIdRef = useRef(0);
  
  const { moveForward, moveBackward, moveLeft, moveRight, rotateLeft, rotateRight, shoot } = useControls();
  
  const handleShoot = (position: [number, number, number], direction: [number, number, number]) => {
    const newProjectile = {
      id: projectileIdRef.current++,
      position,
      direction,
    };
    setProjectiles((prev) => [...prev, newProjectile]);
  };
  
  const removeProjectile = (id: number) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 20, -20]} />
        <OrbitControls maxPolarAngle={Math.PI / 2} minDistance={10} maxDistance={50} />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 15, 10]}
          intensity={1.5}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <Sky sunPosition={[100, 20, 100]} />
        <Environment preset="sunset" />
        
        {/* Main Game Elements */}
        <Tank 
          position={[0, 1, 0]} 
          moveForward={moveForward}
          moveBackward={moveBackward}
          moveLeft={moveLeft}
          moveRight={moveRight}
          rotateLeft={rotateLeft}
          rotateRight={rotateRight}
          shoot={shoot}
          onShoot={handleShoot}
        />
        
        {/* Render projectiles */}
        {projectiles.map((projectile) => (
          <Projectile
            key={projectile.id}
            id={projectile.id}
            initialPosition={projectile.position}
            direction={projectile.direction}
            onRemove={removeProjectile}
          />
        ))}
        
        <Ground />
      </Canvas>
    </div>
  );
} 