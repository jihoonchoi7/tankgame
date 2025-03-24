"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import TankBody from "./TankBody";
import TankTurret from "./TankTurret";

interface TankProps {
  position: [number, number, number];
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  shoot: boolean;
  onShoot: (position: [number, number, number], direction: [number, number, number]) => void;
  // New terrain-related props
  getTerrainHeight?: (x: number, z: number) => number;
  getTerrainNormal?: (x: number, z: number) => THREE.Vector3;
  isInWater?: (x: number, z: number) => boolean;
  onMove?: (x: number, y: number, z: number) => void;
}

export default function Tank({ 
  position,
  moveForward,
  moveBackward,
  moveLeft,
  moveRight,
  rotateLeft,
  rotateRight,
  shoot,
  onShoot,
  getTerrainHeight = () => 0,
  getTerrainNormal = () => new THREE.Vector3(0, 1, 0),
  isInWater = () => false,
  onMove = () => {},
}: TankProps) {
  const tankRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);
  const positionRef = useRef(new THREE.Vector3(position[0], 0.5, position[2]));
  const rotationRef = useRef(new THREE.Euler(0, 0, 0));
  const shootTimeRef = useRef(0);
  
  // State to track if tank is in water
  const [inWater, setInWater] = useState(false);
  const waterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waterWarningRef = useRef(false);
  
  const MOVE_SPEED = 0.1;
  const ROTATION_SPEED = 0.02;
  const SHOOT_COOLDOWN = 400; // ms
  const MAX_WATER_TIME = 5000; // ms - time before water damage
  const WATER_WARNING_TIME = 3000; // ms - time when warning starts
  
  // Water warning effect
  useEffect(() => {
    // Cleanup function to clear any timers
    return () => {
      if (waterTimerRef.current) {
        clearTimeout(waterTimerRef.current);
      }
    };
  }, []);
  
  // Add a UI element for water warning that gets displayed when appropriate
  useEffect(() => {
    // Create or update water warning element
    const warningId = 'water-warning';
    let warningElement = document.getElementById(warningId);
    
    if (!warningElement) {
      warningElement = document.createElement('div');
      warningElement.id = warningId;
      warningElement.style.position = 'absolute';
      warningElement.style.top = '20%';
      warningElement.style.left = '50%';
      warningElement.style.transform = 'translate(-50%, -50%)';
      warningElement.style.color = 'red';
      warningElement.style.fontWeight = 'bold';
      warningElement.style.fontSize = '24px';
      warningElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
      warningElement.style.display = 'none';
      warningElement.style.zIndex = '1000';
      warningElement.style.fontFamily = 'Arial, sans-serif';
      warningElement.style.padding = '10px';
      warningElement.style.borderRadius = '5px';
      warningElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      warningElement.innerText = 'WARNING: Tank in water! Exit immediately!';
      document.body.appendChild(warningElement);
    }
    
    // Clean up element on component unmount
    return () => {
      if (warningElement && warningElement.parentNode) {
        warningElement.parentNode.removeChild(warningElement);
      }
    };
  }, []);
  
  // Update water warning visibility
  useEffect(() => {
    const warningElement = document.getElementById('water-warning');
    if (warningElement) {
      warningElement.style.display = waterWarningRef.current ? 'block' : 'none';
      
      // Add flashing effect when warning is active
      if (waterWarningRef.current) {
        let visible = true;
        const flashInterval = setInterval(() => {
          visible = !visible;
          warningElement.style.visibility = visible ? 'visible' : 'hidden';
        }, 500);
        
        return () => clearInterval(flashInterval);
      }
    }
  }, [waterWarningRef.current]);
  
  useFrame((state, delta) => {
    if (!tankRef.current) return;
    
    // Get current position for terrain sampling
    const currentX = positionRef.current.x;
    const currentZ = positionRef.current.z;
    
    // Check if tank is in water
    const inWaterNow = isInWater(currentX, currentZ);
    
    // Handle water warning and timer
    if (inWaterNow !== inWater) {
      setInWater(inWaterNow);
      
      if (inWaterNow) {
        // Start water timer if entering water
        waterTimerRef.current = setTimeout(() => {
          // Reset tank position if in water too long
          positionRef.current.set(0, 0.5, 0);
          rotationRef.current.set(0, 0, 0);
          
          // Reset water warnings
          waterWarningRef.current = false;
          const warningElement = document.getElementById('water-warning');
          if (warningElement) {
            warningElement.style.display = 'none';
          }
        }, MAX_WATER_TIME);
        
        // Set a timer for showing warning
        setTimeout(() => {
          if (inWater) {
            waterWarningRef.current = true;
          }
        }, WATER_WARNING_TIME);
      } else if (waterTimerRef.current) {
        // Clear water timer if exiting water
        clearTimeout(waterTimerRef.current);
        waterTimerRef.current = null;
        waterWarningRef.current = false;
      }
    }
    
    // Calculate new position based on controls
    const newPos = positionRef.current.clone();
    
    // Movement direction based on tank rotation
    if (moveForward) {
      newPos.x += Math.sin(rotationRef.current.y) * MOVE_SPEED;
      newPos.z += Math.cos(rotationRef.current.y) * MOVE_SPEED;
    }
    if (moveBackward) {
      newPos.x -= Math.sin(rotationRef.current.y) * MOVE_SPEED;
      newPos.z -= Math.cos(rotationRef.current.y) * MOVE_SPEED;
    }
    
    // Tank strafing - Fixed to match A = left, D = right from camera perspective
    if (moveLeft) {
      newPos.x += Math.cos(rotationRef.current.y) * MOVE_SPEED;
      newPos.z -= Math.sin(rotationRef.current.y) * MOVE_SPEED;
    }
    if (moveRight) {
      newPos.x -= Math.cos(rotationRef.current.y) * MOVE_SPEED;
      newPos.z += Math.sin(rotationRef.current.y) * MOVE_SPEED;
    }
    
    // Get terrain height at new position
    const terrainHeight = getTerrainHeight(newPos.x, newPos.z);
    
    // Ensure the tank is properly positioned above terrain with a fixed offset
    newPos.y = terrainHeight + 1.0; // Increased to 1.0 to prevent sinking
    
    // Update position
    positionRef.current.copy(newPos);
    
    // Tank rotation
    if (rotateLeft) {
      rotationRef.current.y += ROTATION_SPEED;
    }
    if (rotateRight) {
      rotationRef.current.y -= ROTATION_SPEED;
    }
    
    // Apply position and basic rotation
    tankRef.current.position.copy(positionRef.current);
    tankRef.current.rotation.y = rotationRef.current.y;
    
    // Adjust tank orientation to match terrain slope
    if (tankRef.current) {
      // Get terrain normal at current position for slope alignment
      const normal = getTerrainNormal(positionRef.current.x, positionRef.current.z);
      
      // Create a rotation to align the tank with the terrain normal
      if (normal && normal.y > 0.5) { // Only align if normal is valid and not too steep
        // Create rotation to align tank with terrain slope
        const alignQuat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), // Up vector
          normal // Terrain normal
        );
        
        // Combine the Y-rotation (tank direction) with the terrain alignment
        const yRotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, rotationRef.current.y, 0)
        );
        
        // Apply combined rotation: first align to terrain, then apply Y rotation
        const finalRotation = new THREE.Quaternion()
          .multiplyQuaternions(yRotation, alignQuat);
        
        // Apply the rotation
        tankRef.current.quaternion.copy(finalRotation);
      }
    }
    
    // Call onMove callback with the new position for camera following
    onMove(positionRef.current.x, positionRef.current.y, positionRef.current.z);
    
    // Handle shooting
    if (shoot && Date.now() - shootTimeRef.current > SHOOT_COOLDOWN) {
      shootTimeRef.current = Date.now();
      
      if (turretRef.current) {
        const turretWorldPosition = new THREE.Vector3();
        turretRef.current.getWorldPosition(turretWorldPosition);
        
        // Get turret direction (forward vector)
        const direction = new THREE.Vector3(0, 0, 1)
          .applyEuler(rotationRef.current)
          .normalize();
        
        // Start projectile a bit in front of the turret barrel
        const projectilePosition: [number, number, number] = [
          turretWorldPosition.x + direction.x * 3.3,  // Adjusted to match barrel end
          turretWorldPosition.y + 0.25,               // Match barrel height
          turretWorldPosition.z + direction.z * 3.3   // Adjusted to match barrel end
        ];
        
        onShoot(projectilePosition, [direction.x, direction.y, direction.z]);
      }
    }
  });
  
  return (
    <group 
      ref={tankRef} 
      position={[position[0], 0.5, position[2]]} 
      castShadow 
      receiveShadow
    >
      <TankBody />
      <TankTurret ref={turretRef} />
    </group>
  );
} 