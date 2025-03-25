"use client";

import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Stars } from "@react-three/drei";
import { useControls } from "../../utils/useControls";
import TerrainGround, { TerrainFunctions } from "../TerrainGround";
import Tank from "./Tank";
import Projectile from "./Projectile";
import CameraController from "./CameraController";

export default function TankGame() {
  const [projectiles, setProjectiles] = useState<Array<{ id: number; position: [number, number, number]; direction: [number, number, number] }>>([]);
  const projectileIdRef = useRef(0);
  const [terrainFunctions, setTerrainFunctions] = useState<TerrainFunctions>({
    getTerrainHeight: () => 0,
    getTerrainNormal: () => new THREE.Vector3(0, 1, 0),
    isInWater: () => false,
    getTerrainSize: () => 1000
  });
  
  // For camera tracking
  const tankPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  
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
  
  const updateTankPosition = (x: number, y: number, z: number) => {
    tankPositionRef.current.set(x, y, z);
  };
  
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 60 }}>
        {/* Sky and environment */}
        <Sky sunPosition={[100, 10, 100]} />
        <Stars radius={300} depth={50} count={1000} factor={4} />
        
        {/* Scene with terrain and tank */}
        <scene>
          {/* Terrain */}
          <TerrainGround onHeightUpdate={handleTerrainUpdate} />
          
          {/* Tank */}
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
            onMove={updateTankPosition}
          />
          
          {/* Projectiles */}
          {projectiles.map((projectile) => (
            <Projectile
              key={projectile.id}
              id={projectile.id}
              initialPosition={projectile.position}
              direction={projectile.direction}
              onRemove={removeProjectile}
            />
          ))}
        </scene>
        
        {/* Camera controller follows the tank */}
        <CameraController 
          tankPosition={tankPositionRef.current} 
          getTerrainHeight={terrainFunctions.getTerrainHeight}
        />
        
        {/* Lights and sky */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[50, 50, -50]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
      </Canvas>
    </div>
  );
} 