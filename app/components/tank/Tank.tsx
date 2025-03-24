"use client";

import { useRef, useEffect } from "react";
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
  onShoot
}: TankProps) {
  const tankRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);
  const positionRef = useRef(new THREE.Vector3(...position));
  const rotationRef = useRef(new THREE.Euler(0, 0, 0));
  const shootTimeRef = useRef(0);
  
  const MOVE_SPEED = 0.1;
  const ROTATION_SPEED = 0.02;
  const SHOOT_COOLDOWN = 400; // ms
  
  useFrame((state, delta) => {
    if (!tankRef.current) return;
    
    // Tank movement
    if (moveForward) {
      positionRef.current.x += Math.sin(rotationRef.current.y) * MOVE_SPEED;
      positionRef.current.z += Math.cos(rotationRef.current.y) * MOVE_SPEED;
    }
    if (moveBackward) {
      positionRef.current.x -= Math.sin(rotationRef.current.y) * MOVE_SPEED;
      positionRef.current.z -= Math.cos(rotationRef.current.y) * MOVE_SPEED;
    }
    
    // Tank strafing
    if (moveLeft) {
      positionRef.current.x -= Math.cos(rotationRef.current.y) * MOVE_SPEED;
      positionRef.current.z += Math.sin(rotationRef.current.y) * MOVE_SPEED;
    }
    if (moveRight) {
      positionRef.current.x += Math.cos(rotationRef.current.y) * MOVE_SPEED;
      positionRef.current.z -= Math.sin(rotationRef.current.y) * MOVE_SPEED;
    }
    
    // Tank rotation
    if (rotateLeft) {
      rotationRef.current.y += ROTATION_SPEED;
    }
    if (rotateRight) {
      rotationRef.current.y -= ROTATION_SPEED;
    }
    
    // Apply movement
    tankRef.current.position.copy(positionRef.current);
    tankRef.current.rotation.copy(rotationRef.current);
    
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
    <group ref={tankRef} position={position} castShadow receiveShadow>
      <TankBody />
      <TankTurret ref={turretRef} />
    </group>
  );
} 