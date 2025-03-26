"use client";

import { useState, useEffect } from "react";

export const useControls = () => {
  const [keys, setKeys] = useState({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    rotateLeft: false,
    rotateRight: false,
    shoot: false,
    weaponType: 'main' as 'main' | 'machineGun'
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case "w":
        setKeys((keys) => ({ ...keys, moveForward: true }));
        break;
      case "s":
        setKeys((keys) => ({ ...keys, moveBackward: true }));
        break;
      case "a":
        setKeys((keys) => ({ ...keys, moveLeft: true }));
        break;
      case "d":
        setKeys((keys) => ({ ...keys, moveRight: true }));
        break;
      case "q":
        setKeys((keys) => ({ ...keys, rotateLeft: true }));
        break;
      case "e":
        setKeys((keys) => ({ ...keys, rotateRight: true }));
        break;
      case " ": // Space key
        setKeys((keys) => ({ ...keys, shoot: true }));
        break;
      case "f": // Weapon switch key
        setKeys((keys) => ({ 
          ...keys, 
          weaponType: keys.weaponType === 'main' ? 'machineGun' : 'main' 
        }));
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case "w":
        setKeys((keys) => ({ ...keys, moveForward: false }));
        break;
      case "s":
        setKeys((keys) => ({ ...keys, moveBackward: false }));
        break;
      case "a":
        setKeys((keys) => ({ ...keys, moveLeft: false }));
        break;
      case "d":
        setKeys((keys) => ({ ...keys, moveRight: false }));
        break;
      case "q":
        setKeys((keys) => ({ ...keys, rotateLeft: false }));
        break;
      case "e":
        setKeys((keys) => ({ ...keys, rotateRight: false }));
        break;
      case " ": // Space key
        setKeys((keys) => ({ ...keys, shoot: false }));
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return {
    moveForward: keys.moveForward,
    moveBackward: keys.moveBackward,
    moveLeft: keys.moveLeft,
    moveRight: keys.moveRight,
    rotateLeft: keys.rotateLeft,
    rotateRight: keys.rotateRight,
    shoot: keys.shoot,
    weaponType: keys.weaponType
  };
}; 