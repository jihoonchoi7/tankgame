"use client";

import { useMemo } from 'react';
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
    
    // Track all placed positions for minimum distance checks
    const placedPositions: [number, number, number][] = [];
    
    // Helper function to check if a position is too close to existing elements
    const isTooClose = (pos: [number, number, number], minDistance: number): boolean => {
      return placedPositions.some(existingPos => {
        const dx = pos[0] - existingPos[0];
        const dz = pos[2] - existingPos[2];
        // Use distance squared for performance (avoid square root)
        const distanceSquared = dx * dx + dz * dz;
        return distanceSquared < minDistance * minDistance;
      });
    };
    
    // Helper function to get random position with minimum distance check
    const getRandomPosition = (minDistance = 5): [number, number, number] => {
      let attempts = 0;
      const maxAttempts = 30; // Limit attempts to prevent infinite loops
      
      // Track the best candidate position (furthest from existing elements)
      let bestPosition: [number, number, number] | null = null;
      let bestDistanceSquared = 0;
      
      while (attempts < maxAttempts) {
        const x = Math.random() * terrainSize - halfSize;
        const z = Math.random() * terrainSize - halfSize;
        const y = getTerrainHeight(x, z);
        const position: [number, number, number] = [x, y, z];
        
        if (!isTooClose(position, minDistance)) {
          placedPositions.push(position);
          return position;
        }
        
        // If this position doesn't meet the criteria, check if it's better than our current best
        let minDistanceSquared = Infinity;
        for (const existingPos of placedPositions) {
          const dx = position[0] - existingPos[0];
          const dz = position[2] - existingPos[2];
          const distanceSquared = dx * dx + dz * dz;
          minDistanceSquared = Math.min(minDistanceSquared, distanceSquared);
        }
        
        // If this is the furthest position from any existing element, make it our new best
        if (minDistanceSquared > bestDistanceSquared) {
          bestDistanceSquared = minDistanceSquared;
          bestPosition = position;
        }
        
        attempts++;
      }
      
      // If we exceeded max attempts, use the best position we found
      // or fall back to a random position if no best was found (empty terrain)
      if (bestPosition) {
        placedPositions.push(bestPosition);
        return bestPosition;
      } else {
        const x = Math.random() * terrainSize - halfSize;
        const z = Math.random() * terrainSize - halfSize;
        const y = getTerrainHeight(x, z);
        const position: [number, number, number] = [x, y, z];
        placedPositions.push(position);
        return position;
      }
    };

    // Generate trees (with larger minimum distance)
    const trees = Array.from({ length: 400 }, () => ({
      position: getRandomPosition(8),
      scale: 0.5 + Math.random() * 1.5
    }));

    // Generate rocks (with smaller minimum distance)
    const rocks = Array.from({ length: 100 }, () => ({
      position: getRandomPosition(6),
      scale: 0.5 + Math.random() * 2
    }));

    // Generate clouds
    const clouds = Array.from({ length: 40 }, () => {
      // Use getRandomPosition but with a smaller minimum distance for clouds
      const position = getRandomPosition(10);
      // Override the y-coordinate for cloud height
      position[1] = 30 + Math.random() * 20;
      
      return {
        position,
        speed: 0.5 + Math.random() * 2
      };
    });

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