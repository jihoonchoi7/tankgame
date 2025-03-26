"use client";

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TerrainFunctions } from '../TerrainGround';
import Tree from './Tree';
import Rock from './Rock';
import Cloud from './Cloud';

interface EnvironmentElementsProps {
  terrainFunctions: TerrainFunctions;
}

export default function EnvironmentElements({ terrainFunctions }: EnvironmentElementsProps) {
  // Generate random positions for environmental elements
  const elements = useMemo(() => {
    const { getTerrainHeight, getTerrainSize } = terrainFunctions;
    const terrainSize = getTerrainSize();
    const halfSize = terrainSize / 2;
    
    // Helper function to get random position
    const getRandomPosition = (minDist: number = 10): [number, number, number] => {
      const x = Math.random() * terrainSize - halfSize;
      const z = Math.random() * terrainSize - halfSize;
      const y = getTerrainHeight(x, z);
      return [x, y, z];
    };

    // Generate trees
    const trees = Array.from({ length: 400 }, () => ({
      position: getRandomPosition(),
      scale: 0.5 + Math.random() * 1.5
    }));

    // Generate rocks
    const rocks = Array.from({ length: 100 }, () => ({
      position: getRandomPosition(),
      scale: 0.5 + Math.random() * 2
    }));

    // Generate clouds
    const clouds = Array.from({ length: 40 }, () => ({
      position: [
        Math.random() * terrainSize - halfSize,
        30 + Math.random() * 20,
        Math.random() * terrainSize - halfSize
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 2
    }));

    return { trees, rocks, clouds };
  }, [terrainFunctions]);

  return (
    <group>
      {/* Trees */}
      <group>
        {elements.trees.map((tree, index) => (
          <Tree key={`tree-${index}`} {...tree} />
        ))}
      </group>

      {/* Rocks */}
      <group>
        {elements.rocks.map((rock, index) => (
          <Rock key={`rock-${index}`} {...rock} />
        ))}
      </group>

      {/* Clouds */}
      <group>
        {elements.clouds.map((cloud, index) => (
          <Cloud key={`cloud-${index}`} {...cloud} />
        ))}
      </group>
    </group>
  );
} 