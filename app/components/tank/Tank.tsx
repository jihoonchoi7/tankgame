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
  // Terrain-related props
  getTerrainHeight?: (x: number, z: number) => number;
  getTerrainNormal?: (x: number, z: number) => THREE.Vector3;
  onMove?: (x: number, y: number, z: number) => void;
  onRotationChange?: (rotation: number) => void;
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
  onMove = () => {},
  onRotationChange = () => {},
}: TankProps) {
  const tankRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);
  const positionRef = useRef(new THREE.Vector3(position[0], 0.5, position[2]));
  const rotationRef = useRef(new THREE.Euler(0, 0, 0));
  const shootTimeRef = useRef(0);
  
  // Previous values for smoothing
  const prevNormalRef = useRef(new THREE.Vector3(0, 1, 0));
  const prevHeightRef = useRef(0);
  const stabilityCounterRef = useRef(0);
  const [recoveryMode, setRecoveryMode] = useState(false);
  
  // Constants with tweaked values
  const MOVE_SPEED = 0.1;
  const ROTATION_SPEED = 0.02;
  const SHOOT_COOLDOWN = 500; // ms
  const MAX_SLOPE_DOT = 0.4; // Lower value = can climb steeper slopes
  const SAMPLE_DISTANCE = 1.2; // Reduced from 1.5 for more precise readings
  const ROTATION_SMOOTHING = 0.04; // Reduced for more gradual changes
  const HEIGHT_SMOOTHING = 0.03; // Very gradual height changes
  const STABILITY_THRESHOLD = 30; // Frames before exiting recovery mode
  
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [cannonRecoil, setCannonRecoil] = useState(0);
  const lastShootTime = useRef(0);
  const canShoot = useRef(true);
  
  // Initialize tank at the correct terrain height
  useEffect(() => {
    if (tankRef.current) {
      const initialHeight = getTerrainHeight(position[0], position[2]);
      positionRef.current.set(position[0], initialHeight + 0.25, position[2]);
      prevHeightRef.current = initialHeight + 0.25;
      tankRef.current.position.copy(positionRef.current);
    }
  }, []);
  
  useFrame((state, delta) => {
    if (!tankRef.current) return;
    
    // Adjust delta to prevent extreme values during frame drops
    const clampedDelta = Math.min(delta, 0.1);
    
    // Calculate new position based on controls
    const newPos = positionRef.current.clone();
    
    // Make speed frame-rate independent
    const frameAdjustedMoveSpeed = MOVE_SPEED * clampedDelta * 60;
    const frameAdjustedRotSpeed = ROTATION_SPEED * clampedDelta * 60;
    
    // Movement direction based on tank rotation
    if (moveForward) {
      newPos.x += Math.sin(rotationRef.current.y) * frameAdjustedMoveSpeed;
      newPos.z += Math.cos(rotationRef.current.y) * frameAdjustedMoveSpeed;
    }
    if (moveBackward) {
      newPos.x -= Math.sin(rotationRef.current.y) * frameAdjustedMoveSpeed;
      newPos.z -= Math.cos(rotationRef.current.y) * frameAdjustedMoveSpeed;
    }
    
    // Tank strafing - Fixed to match A = left, D = right from camera perspective
    if (moveLeft) {
      newPos.x += Math.cos(rotationRef.current.y) * frameAdjustedMoveSpeed;
      newPos.z -= Math.sin(rotationRef.current.y) * frameAdjustedMoveSpeed;
    }
    if (moveRight) {
      newPos.x -= Math.cos(rotationRef.current.y) * frameAdjustedMoveSpeed;
      newPos.z += Math.sin(rotationRef.current.y) * frameAdjustedMoveSpeed;
    }
    
    // Calculate terrain heights at multiple points around the tank for better sampling
    const centerHeight = getTerrainHeight(newPos.x, newPos.z);
    
    // Sample heights in forward, backward, left, right and diagonals for better coverage
    const forwardVec = new THREE.Vector3(Math.sin(rotationRef.current.y), 0, Math.cos(rotationRef.current.y));
    const rightVec = new THREE.Vector3(Math.cos(rotationRef.current.y), 0, -Math.sin(rotationRef.current.y));
    
    const frontHeight = getTerrainHeight(
      newPos.x + forwardVec.x * SAMPLE_DISTANCE,
      newPos.z + forwardVec.z * SAMPLE_DISTANCE
    );
    
    const backHeight = getTerrainHeight(
      newPos.x - forwardVec.x * SAMPLE_DISTANCE,
      newPos.z - forwardVec.z * SAMPLE_DISTANCE
    );
    
    const leftHeight = getTerrainHeight(
      newPos.x - rightVec.x * SAMPLE_DISTANCE,
      newPos.z - rightVec.z * SAMPLE_DISTANCE
    );
    
    const rightHeight = getTerrainHeight(
      newPos.x + rightVec.x * SAMPLE_DISTANCE,
      newPos.z + rightVec.z * SAMPLE_DISTANCE
    );
    
    // Use the highest point to ensure no part of the tank sinks into terrain
    const highestPoint = Math.max(centerHeight, frontHeight, backHeight, leftHeight, rightHeight);
    
    // Smoothly interpolate to the new height with a very gradual rate
    const targetHeight = highestPoint + 0.25; // Offset for treads
    
    // Apply significant damping to height changes
    let heightLerpFactor = HEIGHT_SMOOTHING * clampedDelta * 60;
    heightLerpFactor = Math.min(heightLerpFactor, 0.05); // Cap even with high delta
    
    // Even more gradual during recovery mode
    if (recoveryMode) {
      heightLerpFactor *= 0.5;
    }
    
    // Calculate new height with damping
    newPos.y = THREE.MathUtils.lerp(positionRef.current.y, targetHeight, heightLerpFactor);
    
    // Detect sudden large changes in height and smooth them further
    const heightDelta = Math.abs(newPos.y - prevHeightRef.current);
    if (heightDelta > 0.5 && !recoveryMode) {
      // If sudden jump detected, use even smaller step
      newPos.y = THREE.MathUtils.lerp(prevHeightRef.current, newPos.y, 0.1);
      setRecoveryMode(true);
      stabilityCounterRef.current = 0;
    }
    
    prevHeightRef.current = newPos.y;
    
    // Update position
    positionRef.current.copy(newPos);
    
    // Tank rotation with frame-rate independence
    if (rotateLeft) {
      rotationRef.current.y += frameAdjustedRotSpeed;
    }
    if (rotateRight) {
      rotationRef.current.y -= frameAdjustedRotSpeed;
    }
    
    // Notify parent component about rotation changes
    onRotationChange(rotationRef.current.y);
    
    // Apply position and basic rotation
    tankRef.current.position.copy(positionRef.current);
    
    // Sample terrain normals at multiple points around the tank
    const normalCenter = getTerrainNormal(newPos.x, newPos.z);
    const normalFront = getTerrainNormal(
      newPos.x + forwardVec.x * SAMPLE_DISTANCE,
      newPos.z + forwardVec.z * SAMPLE_DISTANCE
    );
    const normalBack = getTerrainNormal(
      newPos.x - forwardVec.x * SAMPLE_DISTANCE,
      newPos.z - forwardVec.z * SAMPLE_DISTANCE
    );
    const normalLeft = getTerrainNormal(
      newPos.x - rightVec.x * SAMPLE_DISTANCE,
      newPos.z - rightVec.z * SAMPLE_DISTANCE
    );
    const normalRight = getTerrainNormal(
      newPos.x + rightVec.x * SAMPLE_DISTANCE,
      newPos.z + rightVec.z * SAMPLE_DISTANCE
    );
    
    // Check all normals for validity and replace invalid ones with default
    const defaultNormal = new THREE.Vector3(0, 1, 0);
    
    const validateNormal = (normal: THREE.Vector3) => {
      if (isNaN(normal.x) || isNaN(normal.y) || isNaN(normal.z) || 
          normal.lengthSq() < 0.1) {
        return defaultNormal.clone();
      }
      return normal;
    };
    
    const validCenter = validateNormal(normalCenter);
    const validFront = validateNormal(normalFront);
    const validBack = validateNormal(normalBack);
    const validLeft = validateNormal(normalLeft);
    const validRight = validateNormal(normalRight);
    
    // Enhanced weighted average with additional sample points
    const blendedNormal = new THREE.Vector3()
      .addScaledVector(validCenter, 0.6)
      .addScaledVector(validFront, 0.1)
      .addScaledVector(validBack, 0.1)
      .addScaledVector(validLeft, 0.1)
      .addScaledVector(validRight, 0.1);
    
    // Temporal smoothing with previous normal to reduce jitter
    blendedNormal.lerp(prevNormalRef.current, 0.7).normalize();
    prevNormalRef.current.copy(blendedNormal);
    
    // Verify it's a valid normal after blending
    if (blendedNormal.y < 0.1) {
      blendedNormal.set(0, 1, 0); // Safety fallback
    }
    
    // Only align if normal is valid and slope isn't too steep
    if (blendedNormal.y > MAX_SLOPE_DOT) {
      // Create rotation to align tank up direction with terrain normal
      const alignQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), // Up vector
        blendedNormal // Blended terrain normal
      );
      
      // Combine alignments: First align to terrain, then apply direction rotation
      const tankYQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, rotationRef.current.y, 0)
      );
      
      // Fixed quaternion multiplication order
      const finalRotation = new THREE.Quaternion().multiplyQuaternions(tankYQuat, alignQuat);
      
      // Very gradual rotation with frame-rate independence
      let slerpFactor = ROTATION_SMOOTHING * clampedDelta * 60;
      slerpFactor = Math.min(slerpFactor, 0.08); // Cap even with high delta
      
      // Even slower rotation during recovery mode
      if (recoveryMode) {
        slerpFactor *= 0.3;
      }
      
      tankRef.current.quaternion.slerp(finalRotation, slerpFactor);
      tankRef.current.updateMatrix();
      
      // In stable conditions, increment our stability counter
      stabilityCounterRef.current++;
      if (stabilityCounterRef.current > STABILITY_THRESHOLD && recoveryMode) {
        setRecoveryMode(false);
      }
    } else {
      // On steep slopes, keep Y rotation but don't align to terrain
      const tankYQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, rotationRef.current.y, 0)
      );
      tankRef.current.quaternion.slerp(tankYQuat, 0.05);
      stabilityCounterRef.current = 0;
    }
    
    // Call onMove callback with the new position for camera following
    onMove(positionRef.current.x, positionRef.current.y, positionRef.current.z);
    
    // Handle shooting
    if (shoot && canShoot.current) {
      if (state.clock.getElapsedTime() * 1000 - lastShootTime.current > SHOOT_COOLDOWN) {
        lastShootTime.current = state.clock.getElapsedTime() * 1000;
        canShoot.current = false;
        
        // Get the current position and direction from the turret
        if (turretRef.current) {
          const turretWorldPos = new THREE.Vector3();
          const barrelTip = new THREE.Vector3(0, 0.25, 3.3); // Position of barrel tip
          
          // Convert barrel tip to world coordinates
          barrelTip.applyMatrix4(turretRef.current.matrixWorld);
          
          // Get turret direction (forward vector)
          const turretDirection = new THREE.Vector3(0, 0, 1);
          turretDirection.applyQuaternion(turretRef.current.quaternion);
          turretDirection.applyQuaternion(tankRef.current.quaternion);
          turretDirection.normalize();
          
          // Set the projectile position to be at the end of the barrel
          const projectilePosition: [number, number, number] = [
            barrelTip.x,
            barrelTip.y,
            barrelTip.z
          ];
          
          // Get the direction as a normalized vector
          const direction = turretDirection;
          
          // Show muzzle flash
          setMuzzleFlash(true);
          
          // Set cannon recoil
          setCannonRecoil(-0.3); // Negative value moves the cannon backward
          
          // Reset muzzle flash after a short delay
          setTimeout(() => {
            setMuzzleFlash(false);
          }, 100);
          
          // Reset cannon position after recoil
          setTimeout(() => {
            setCannonRecoil(0);
          }, 300);
          
          // Allow shooting again after cooldown
          setTimeout(() => {
            canShoot.current = true;
          }, SHOOT_COOLDOWN);
          
          console.log("Turret Direction:", turretDirection.x, turretDirection.y, turretDirection.z);
          
          onShoot(projectilePosition, [direction.x, direction.y, direction.z]);
        }
      }
    }
  });
  
  return (
    <group 
      ref={tankRef} 
      position={[position[0], 0, position[2]]} // Initial position will be set in useEffect
      castShadow 
      receiveShadow
    >
      <TankBody />
      <TankTurret ref={turretRef} muzzleFlash={muzzleFlash} cannonRecoil={cannonRecoil} />
    </group>
  );
} 