"use client";

import { useRef, useMemo, useImperativeHandle, forwardRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Define our own SimplexNoise implementation since the import path has an issue
class SimplexNoise {
  constructor() {}
  
  // Simple noise implementation for our terrain
  noise(x: number, z: number): number {
    // Using classic Perlin noise-like implementation
    const X = Math.floor(x) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    z -= Math.floor(z);
    
    const u = this.fade(x);
    const w = this.fade(z);
    
    // Simple hash function for our demo
    const A = (X + Z) % 255;
    const B = (X + Z + 1) % 255;
    
    // Get gradient values
    const g1 = this.grad(A, x, z);
    const g2 = this.grad(B, x - 1, z);
    const g3 = this.grad(A + 1, x, z - 1);
    const g4 = this.grad(B + 1, x - 1, z - 1);
    
    // Blend noise values together
    return this.lerp(
      this.lerp(g1, g2, u),
      this.lerp(g3, g4, u),
      w
    ) * 2;
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  private grad(hash: number, x: number, z: number): number {
    // Use hash to determine gradient direction
    const h = hash & 7;
    const u = h < 4 ? x : z;
    const v = h < 4 ? z : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

// Define the interface for terrain data
export interface TerrainFunctions {
  getTerrainHeight: (x: number, z: number) => number;
  getTerrainNormal: (x: number, z: number) => THREE.Vector3;
  isInWater: (x: number, z: number) => boolean;
}

interface TerrainGroundProps {
  onHeightUpdate?: (terrainFunctions: TerrainFunctions) => void;
}

const TerrainGround = forwardRef(({ onHeightUpdate }: TerrainGroundProps, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Terrain generation parameters
  const size = 1000;
  const resolution = 128; // Reduced for more low-poly look
  const maxHeight = 5;
  
  // Create terrain geometry
  const { positions, normals, indices, uvs, heightData } = useMemo(() => {
    // Initialize geometry data
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const heightData: number[][] = Array(resolution).fill(0).map(() => Array(resolution).fill(0));
    
    // Create simplex noise generator
    const simplex = new SimplexNoise();
    
    // Generate vertices
    const segmentSize = size / (resolution - 1);
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        // Calculate world positions
        const worldX = x * segmentSize - size / 2;
        const worldZ = z * segmentSize - size / 2;
        
        // Calculate height using multiple octaves of noise for more natural terrain
        let height = 0;
        
        // Large features - smoother hills and valleys
        height += simplex.noise(worldX * 0.003, worldZ * 0.003) * maxHeight * 0.7;
        
        // Medium features - very minimal
        height += simplex.noise(worldX * 0.01, worldZ * 0.01) * maxHeight * 0.1;
        
        // Flatten terrain slightly to create more plateaus (like in the reference image)
        height = Math.round(height * 2) / 2;
        
        // Ensure height is never negative (below ground)
        height = Math.max(height, 0);
        
        // Store height data for later use
        heightData[z][x] = height;
        
        // Add vertex
        positions.push(worldX, height, worldZ);
        
        // Add UV coordinates (0 to 1 across the terrain)
        uvs.push(x / (resolution - 1), z / (resolution - 1));
        
        // We'll calculate normals after creating faces
        normals.push(0, 1, 0);
      }
    }
    
    // Create faces (two triangles per grid cell)
    for (let z = 0; z < resolution - 1; z++) {
      for (let x = 0; x < resolution - 1; x++) {
        const a = x + z * resolution;
        const b = (x + 1) + z * resolution;
        const c = x + (z + 1) * resolution;
        const d = (x + 1) + (z + 1) * resolution;
        
        // First triangle
        indices.push(a, c, b);
        
        // Second triangle
        indices.push(b, c, d);
      }
    }
    
    // Compute normals flat-shaded for low-poly look
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];
      
      // Get positions of each vertex in the face
      const vA = new THREE.Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
      const vB = new THREE.Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
      const vC = new THREE.Vector3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);
      
      // Calculate face normal
      const cb = new THREE.Vector3().subVectors(vC, vB);
      const ab = new THREE.Vector3().subVectors(vA, vB);
      const normal = new THREE.Vector3().crossVectors(cb, ab).normalize();
      
      // For flat shading, set the same normal for all vertices of this face
      normals[a * 3] = normal.x;
      normals[a * 3 + 1] = normal.y;
      normals[a * 3 + 2] = normal.z;
      
      normals[b * 3] = normal.x;
      normals[b * 3 + 1] = normal.y;
      normals[b * 3 + 2] = normal.z;
      
      normals[c * 3] = normal.x;
      normals[c * 3 + 1] = normal.y;
      normals[c * 3 + 2] = normal.z;
    }
    
    return { positions, normals, indices, uvs, heightData };
  }, [size, resolution, maxHeight]);
  
  // Helper function to get height at a specific world position
  const getTerrainHeight = (x: number, z: number) => {
    // Convert world coordinates to terrain grid coordinates
    const gridX = Math.floor((x + size / 2) / size * (resolution - 1));
    const gridZ = Math.floor((z + size / 2) / size * (resolution - 1));
    
    // Check if within bounds
    if (gridX < 0 || gridX >= resolution - 1 || gridZ < 0 || gridZ >= resolution - 1) {
      return 0; // Default height outside terrain
    }
    
    // Get grid cell coordinates
    const x1 = Math.floor(gridX);
    const x2 = Math.ceil(gridX);
    const z1 = Math.floor(gridZ);
    const z2 = Math.ceil(gridZ);
    
    // Get normalized position within grid cell (0 to 1)
    const xFrac = gridX - x1;
    const zFrac = gridZ - z1;
    
    // Get heights at cell corners
    const h1 = heightData[z1]?.[x1] ?? 0;
    const h2 = heightData[z1]?.[x2] ?? 0;
    const h3 = heightData[z2]?.[x1] ?? 0;
    const h4 = heightData[z2]?.[x2] ?? 0;
    
    // Bilinear interpolation for smooth height
    const height = 
      h1 * (1 - xFrac) * (1 - zFrac) +
      h2 * xFrac * (1 - zFrac) +
      h3 * (1 - xFrac) * zFrac +
      h4 * xFrac * zFrac;
    
    return height;
  };
  
  // Helper function to get normal at a specific world position
  const getTerrainNormal = (x: number, z: number) => {
    // Sample heights at nearby points to calculate normal
    const dx = 1.0;
    const dz = 1.0;
    
    const h1 = getTerrainHeight(x - dx, z);
    const h2 = getTerrainHeight(x + dx, z);
    const h3 = getTerrainHeight(x, z - dz);
    const h4 = getTerrainHeight(x, z + dz);
    
    // Calculate normal using cross product
    const normal = new THREE.Vector3(h1 - h2, 2 * dx, h3 - h4).normalize();
    
    return normal;
  };
  
  // For compatibility, but no water now
  const isInWater = () => false;

  // Expose terrain functions to parent components
  useImperativeHandle(ref, () => ({
    getTerrainHeight,
    getTerrainNormal,
    isInWater
  }));
  
  // Call onHeightUpdate with terrain functions when component mounts
  useEffect(() => {
    if (onHeightUpdate) {
      onHeightUpdate({
        getTerrainHeight,
        getTerrainNormal,
        isInWater
      });
    }
  }, []);
  
  return (
    <group>
      {/* Terrain mesh */}
      <mesh 
        ref={meshRef} 
        receiveShadow
        castShadow
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(positions)}
            count={positions.length / 3}
            itemSize={3}
            args={[new Float32Array(positions), 3]}
          />
          <bufferAttribute
            attach="attributes-normal"
            array={new Float32Array(normals)}
            count={normals.length / 3}
            itemSize={3}
            args={[new Float32Array(normals), 3]}
          />
          <bufferAttribute
            attach="attributes-uv"
            array={new Float32Array(uvs)}
            count={uvs.length / 2}
            itemSize={2}
            args={[new Float32Array(uvs), 2]}
          />
          <bufferAttribute
            attach="index"
            array={new Uint16Array(indices)}
            count={indices.length}
            args={[new Uint16Array(indices), 1]}
          />
        </bufferGeometry>
        <meshStandardMaterial 
          vertexColors={false}
          roughness={0.8}
          metalness={0.1}
          side={THREE.DoubleSide}
          flatShading={true}
        >
          <primitive 
            attach="onBeforeCompile" 
            object={(shader: any) => {
              // Add custom varying and modify vertex shader to pass the height
              shader.vertexShader = shader.vertexShader
                .replace(
                  'varying vec3 vViewPosition;',
                  'varying vec3 vViewPosition;\nvarying float vHeight;'
                )
                .replace(
                  'void main() {',
                  'void main() {\n  vHeight = position.y;'
                );
              
              // Modify fragment shader to use the height for coloring
              shader.fragmentShader = shader.fragmentShader
                .replace(
                  'uniform float opacity;',
                  'uniform float opacity;\nvarying float vHeight;'
                )
                .replace(
                  'vec4 diffuseColor = vec4( diffuse, opacity );',
                  `// Low-poly stylized coloring based on height
                  vec3 terrainColor;
                  
                  // Base green color
                  terrainColor = vec3(0.192, 0.48, 0.082);
                  
                  // Lighter green for higher elevations
                  terrainColor = mix(
                    terrainColor,
                    vec3(0.247, 0.573, 0.129),
                    smoothstep(1.0, 3.0, vHeight)
                  );
                  
                  // Mountain/hill color for highest areas
                  terrainColor = mix(
                    terrainColor,
                    vec3(0.5, 0.5, 0.4),
                    smoothstep(3.5, 4.5, vHeight)
                  );
                  
                  vec4 diffuseColor = vec4(terrainColor, opacity);`
                );
            }}
          />
        </meshStandardMaterial>
      </mesh>
    </group>
  );
});

TerrainGround.displayName = "TerrainGround";

export default TerrainGround; 