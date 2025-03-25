"use client";

import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CameraControllerProps {
  tankPosition: THREE.Vector3;
  tankRotation?: number; // Add tankRotation prop
  getTerrainHeight?: (x: number, z: number) => number;
}

export default function CameraController({ 
  tankPosition, 
  tankRotation = 0, // Default to 0 if not provided
  getTerrainHeight = () => 0 
}: CameraControllerProps) {
  const { camera, gl } = useThree();
  const cameraPositionRef = useRef(new THREE.Vector3(0, 15, -15));
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  
  // Toggle between camera modes
  const [cameraMode, setCameraMode] = useState<'orbit' | 'follow'>('orbit');
  
  // Camera settings for both modes
  const ORBIT_HEIGHT = 35;        // Height above tank in orbit mode
  const ORBIT_DISTANCE = 30;      // Distance from tank in orbit mode
  
  // Follow camera settings - adjusted for wider view
  const FOLLOW_HEIGHT = 25;       // Increased height for better terrain overview
  const FOLLOW_DISTANCE = 35;     // Increased distance from tank for wider view
  const FOLLOW_OFFSET_Y = 5;      // Increased upward offset for better terrain visibility
  
  const CAMERA_SMOOTHING = 0.1;   // Lower = smoother camera movement
  
  // Add new state for orbital controls
  const orbitRef = useRef({
    radius: ORBIT_DISTANCE,
    theta: 0, // Horizontal angle
    phi: Math.PI / 4, // Vertical angle (start at 45 degrees)
    isDragging: false,
    lastX: 0,
    lastY: 0
  });

  // Mouse control setup
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleMouseDown = (e: MouseEvent) => {
      // Right mouse button for camera rotation (only in orbit mode)
      if (e.button === 2 && cameraMode === 'orbit') {
        orbitRef.current.isDragging = true;
        orbitRef.current.lastX = e.clientX;
        orbitRef.current.lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      if (orbitRef.current.isDragging) {
        orbitRef.current.isDragging = false;
        canvas.style.cursor = 'auto';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!orbitRef.current.isDragging) return;

      const deltaX = e.clientX - orbitRef.current.lastX;
      const deltaY = e.clientY - orbitRef.current.lastY;

      // Update angles (adjust sensitivity as needed)
      orbitRef.current.theta -= deltaX * 0.01;
      orbitRef.current.phi = Math.max(
        0.1, // Minimum angle (prevents going under terrain)
        Math.min(
          Math.PI / 2 - 0.1, // Maximum angle (prevents going too high)
          orbitRef.current.phi + deltaY * 0.01
        )
      );

      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
    };

    // Add wheel handler for zoom (only in orbit mode)
    const handleWheel = (e: WheelEvent) => {
      if (cameraMode === 'orbit') {
        e.preventDefault();
        
        orbitRef.current.radius = Math.max(
          10, // Minimum zoom
          Math.min(
            50, // Maximum zoom
            orbitRef.current.radius + e.deltaY * 0.05
          )
        );
      }
    };
    
    // Toggle camera mode with 'C' key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c') {
        setCameraMode(prev => prev === 'orbit' ? 'follow' : 'orbit');
      }
    };
    
    // Add touch support for mobile devices (only in orbit mode)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && cameraMode === 'orbit') {
        orbitRef.current.isDragging = true;
        orbitRef.current.lastX = e.touches[0].clientX;
        orbitRef.current.lastY = e.touches[0].clientY;
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!orbitRef.current.isDragging || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - orbitRef.current.lastX;
      const deltaY = e.touches[0].clientY - orbitRef.current.lastY;

      orbitRef.current.theta -= deltaX * 0.01;
      orbitRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.1, orbitRef.current.phi + deltaY * 0.01)
      );

      orbitRef.current.lastX = e.touches[0].clientX;
      orbitRef.current.lastY = e.touches[0].clientY;
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      orbitRef.current.isDragging = false;
    };

    // Prevent context menu on right-click
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Add visual indicator for camera controls
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.6); color:white; 
                  padding:8px; border-radius:4px; font-size:12px; pointer-events:none; text-align:right;">
        <div>Press 'C' to toggle camera mode (${cameraMode})</div>
        <div>Right-click + drag: Rotate camera</div>
        <div>Mouse wheel: Zoom in/out</div>
        <div>Touch and drag: Rotate camera (mobile)</div>
      </div>
    `;
    document.body.appendChild(instructions);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      document.body.removeChild(instructions);
    };
  }, [gl, cameraMode]);

  useFrame(() => {
    if (!tankPosition) return;
    
    // Calculate terrain height at camera and tank positions
    const terrainHeight = getTerrainHeight(tankPosition.x, tankPosition.z);
    
    // Set target to look at (slightly above tank)
    targetRef.current.set(
      tankPosition.x,
      tankPosition.y + 2, // Look slightly above the tank
      tankPosition.z
    );
    
    let idealCameraPos: THREE.Vector3;
    
    if (cameraMode === 'orbit') {
      // ORBIT MODE: Calculate camera position using spherical coordinates
      const x = tankPosition.x + orbitRef.current.radius * 
                Math.sin(orbitRef.current.phi) * 
                Math.cos(orbitRef.current.theta);
      const z = tankPosition.z + orbitRef.current.radius * 
                Math.sin(orbitRef.current.phi) * 
                Math.sin(orbitRef.current.theta);
      const y = tankPosition.y + orbitRef.current.radius * 
                Math.cos(orbitRef.current.phi);
      
      // Ensure camera doesn't go below terrain
      const cameraPosTerrainHeight = getTerrainHeight(x, z);
      const minHeight = cameraPosTerrainHeight + 5; // Keep camera 5 units above terrain
      
      const finalY = Math.max(y, minHeight);
      
      idealCameraPos = new THREE.Vector3(x, finalY, z);
    } else {
      // FOLLOW MODE: Position camera BEHIND the tank (not in front)
      // Calculate tank's forward direction
      const forwardX = Math.sin(tankRotation);
      const forwardZ = Math.cos(tankRotation);
      
      // Position camera BEHIND the tank (negative of forward direction)
      const cameraX = tankPosition.x - (forwardX * FOLLOW_DISTANCE);
      const cameraZ = tankPosition.z - (forwardZ * FOLLOW_DISTANCE);
      
      // Get terrain height at camera position
      const cameraPosTerrainHeight = getTerrainHeight(cameraX, cameraZ);
      
      // Position camera above terrain with minimum height
      const cameraY = Math.max(
        tankPosition.y + FOLLOW_HEIGHT,
        cameraPosTerrainHeight + FOLLOW_OFFSET_Y
      );
      
      idealCameraPos = new THREE.Vector3(cameraX, cameraY, cameraZ);
    }
    
    // Smoothly interpolate camera position
    cameraPositionRef.current.lerp(idealCameraPos, CAMERA_SMOOTHING);
    camera.position.copy(cameraPositionRef.current);
    
    // Update camera orientation to look at target
    camera.lookAt(targetRef.current);
  });

  return null;
} 