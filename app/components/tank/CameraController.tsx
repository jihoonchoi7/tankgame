"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CameraControllerProps {
  tankPosition: THREE.Vector3;
  getTerrainHeight?: (x: number, z: number) => number;
}

export default function CameraController({ 
  tankPosition, 
  getTerrainHeight = () => 0 
}: CameraControllerProps) {
  const { camera } = useThree();
  const cameraPositionRef = useRef(new THREE.Vector3(0, 15, -15));
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  
  // Camera settings
  const CAMERA_HEIGHT = 25;       // Height above tank
  const CAMERA_DISTANCE = 25;     // Distance behind tank
  const CAMERA_SMOOTHING = 0.1;   // Lower = smoother camera movement

  useFrame(() => {
    if (!tankPosition) return;
    
    // Calculate target camera position
    const terrainHeight = getTerrainHeight(tankPosition.x, tankPosition.z);
    
    // Target position is the tank's position
    targetRef.current.set(
      tankPosition.x,
      tankPosition.y + 2, // Look slightly above the tank
      tankPosition.z
    );
    
    // Position camera above and behind the tank
    const idealCameraPos = new THREE.Vector3(
      tankPosition.x,
      Math.max(tankPosition.y + CAMERA_HEIGHT, terrainHeight + 10),
      tankPosition.z - CAMERA_DISTANCE
    );
    
    // Smoothly interpolate current camera position toward ideal position
    cameraPositionRef.current.lerp(idealCameraPos, CAMERA_SMOOTHING);
    
    // Update actual camera position and look at target
    camera.position.copy(cameraPositionRef.current);
    camera.lookAt(targetRef.current);
  });
  
  return null;
} 