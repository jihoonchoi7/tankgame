"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Sky, Environment, Cloud as DreiCloud, useGLTF } from "@react-three/drei";
import Tank from "./Tank";
import TerrainGround, { TerrainFunctions } from "../TerrainGround";
import { useControls } from "../../utils/useControls";
import * as THREE from "three";
import { Suspense } from "react";
import { Vector3 } from "three";

// Custom Cloud component with correct types
function CustomCloud({ position, args, speed, opacity }: { 
  position: [number, number, number]; 
  args: [number, number]; 
  speed: number; 
  opacity: number;
}) {
  return (
    <DreiCloud 
      position={position} 
      args={args as any}
      speed={speed as any} 
      opacity={opacity as any} 
    />
  );
}

// NEW: Camera controller component that handles following the tank
function CameraController({ tankPosition }: { tankPosition: Vector3 }) {
  const controlsRef = useRef<any>(null);
  
  // This useFrame is now safely inside a component rendered within the Canvas
  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    // Update orbit controls target to follow tank
    const controls = controlsRef.current;
    
    // Smoothly interpolate the camera target position
    controls.target.lerp(tankPosition, 0.05);
    controls.update();
  });
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 20, -20]} />
      <OrbitControls 
        ref={controlsRef}
        maxPolarAngle={Math.PI / 2} 
        minDistance={10} 
        maxDistance={50}
        enableDamping={true}
        dampingFactor={0.1}
      />
    </>
  );
}

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

// Replace the Birds component with this simpler version
function Birds() {
  const birdsRef = useRef<THREE.Group>(null);
  const birdPositions = useRef<Array<{
    position: THREE.Vector3;
    rotation: number;
    speed: number;
    wingFlap: number;
    flapDirection: number;
  }>>([]);
  
  // Initialize bird positions
  useEffect(() => {
    for (let i = 0; i < 15; i++) {
      birdPositions.current.push({
        position: new THREE.Vector3(
          Math.random() * 100 - 50,
          Math.random() * 15 + 20,
          Math.random() * 100 - 50
        ),
        rotation: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.05,
        wingFlap: 0,
        flapDirection: 1
      });
    }
  }, []);
  
  useFrame((state, delta) => {
    // Animate birds
    if (!birdsRef.current) return;
    
    birdPositions.current.forEach((bird, index) => {
      const birdMesh = birdsRef.current?.children[index];
      if (!birdMesh) return;
      
      // Update position
      bird.position.x += Math.sin(bird.rotation) * bird.speed;
      bird.position.z += Math.cos(bird.rotation) * bird.speed;
      
      // Wing flapping animation
      bird.wingFlap += 0.1 * bird.flapDirection;
      if (bird.wingFlap > 0.5 || bird.wingFlap < -0.1) {
        bird.flapDirection *= -1;
      }
      
      // Apply transformations to the bird mesh
      birdMesh.position.copy(bird.position);
      birdMesh.rotation.y = bird.rotation;
      
      // Update wing rotations if the bird has wing children
      if (birdMesh.children.length >= 2) {
        // Left wing
        birdMesh.children[0].rotation.z = bird.wingFlap;
        // Right wing
        birdMesh.children[1].rotation.z = -bird.wingFlap;
      }
      
      // Keep birds in bounds
      if (Math.abs(bird.position.x) > 50 || Math.abs(bird.position.z) > 50) {
        bird.rotation = Math.random() * Math.PI * 2;
      }
    });
  });
  
  return (
    <group ref={birdsRef}>
      {Array.from({ length: 15 }).map((_, index) => (
        <group key={index} scale={[0.3, 0.3, 0.3]}>
          {/* Bird body */}
          <mesh>
            <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
            <meshStandardMaterial color={index % 3 === 0 ? "#888888" : index % 3 === 1 ? "#555555" : "#333333"} />
          </mesh>
          
          {/* Left wing */}
          <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.3]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          
          {/* Right wing */}
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.3]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function TankGame() {
  const [projectiles, setProjectiles] = useState<Array<{ id: number; position: [number, number, number]; direction: [number, number, number] }>>([]);
  const projectileIdRef = useRef(0);
  const [terrainFunctions, setTerrainFunctions] = useState<TerrainFunctions>({
    getTerrainHeight: () => 0,
    getTerrainNormal: () => new THREE.Vector3(0, 1, 0),
    isInWater: () => false
  });
  
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
  
  const handleTerrainUpdate = (functions: TerrainFunctions) => {
    setTerrainFunctions(functions);
  };

  // Tank position tracking
  const tankPositionRef = useRef(new Vector3(0, 0, 0));
  
  // Update the tank's position when it moves
  const updateTankPosition = (x: number, y: number, z: number) => {
    tankPositionRef.current.set(x, y, z);
  };
  
  return (
    <div className="w-full h-full">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-white bg-black">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Loading Game...</h2>
            <p>Please wait while we load the game assets.</p>
            <p>If the game doesn't load, try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      }>
        <Canvas shadows>
          {/* Camera controller is now inside the Canvas */}
          <CameraController tankPosition={tankPositionRef.current} />
          
          <ambientLight intensity={0.5} />
          <directionalLight
            castShadow
            position={[10, 15, 10]}
            intensity={1.5}
            shadow-mapSize-width={1024 as any}
            shadow-mapSize-height={1024 as any}
            shadow-camera-far={50 as any}
            shadow-camera-left={-20 as any}
            shadow-camera-right={20 as any}
            shadow-camera-top={20 as any}
            shadow-camera-bottom={-20 as any}
          />
          
          {/* Enhanced Sky with Clouds */}
          <Sky 
            distance={450000} 
            sunPosition={[100, 20, 100]} 
            inclination={0.6} 
            azimuth={0.25} 
            rayleigh={0.5}
          />
          <CustomCloud position={[-10, 25, -10]} args={[3, 2]} speed={0.2} opacity={0.7} />
          <CustomCloud position={[10, 30, 10]} args={[4, 2]} speed={0.1} opacity={0.8} />
          <CustomCloud position={[-20, 28, 10]} args={[3.5, 2]} speed={0.15} opacity={0.75} />
          <CustomCloud position={[20, 26, -15]} args={[5, 2.5]} speed={0.12} opacity={0.7} />
          <Birds />
          <Environment preset="sunset" />
          
          {/* Main Game Elements with Terrain */}
          <TerrainGround onHeightUpdate={handleTerrainUpdate} />
          <Tank 
            position={[0, 0, 0]}
            moveForward={moveForward}
            moveBackward={moveBackward}
            moveLeft={moveLeft}
            moveRight={moveRight}
            rotateLeft={rotateLeft}
            rotateRight={rotateRight}
            shoot={shoot}
            onShoot={handleShoot}
            getTerrainHeight={terrainFunctions.getTerrainHeight}
            getTerrainNormal={terrainFunctions.getTerrainNormal}
            isInWater={terrainFunctions.isInWater}
            onMove={updateTankPosition}
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
        </Canvas>
      </Suspense>
    </div>
  );
} 