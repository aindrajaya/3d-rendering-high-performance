/**
 * High-performance instanced mesh renderer using R3F
 * Renders 7000+ entities with a single draw call
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EntitySystem } from '@/lib/EntitySystem';

interface InstancedEntitiesProps {
  entitySystem: EntitySystem;
  isMobile?: boolean;
}

export function InstancedEntities({ entitySystem, isMobile = false }: InstancedEntitiesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorArray = useRef<Float32Array | null>(null);
  
  const entityCount = entitySystem.getEntityCount();
  
  // Create geometry and material once
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  
  const material = useMemo(() => {
    // Use simpler material for mobile to prevent context loss
    if (isMobile) {
      return new THREE.MeshStandardMaterial({
        roughness: 0.7,
        metalness: 0.3,
      });
    }
    
    return new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.5,
    });
  }, [isMobile]);
  
  // Initialize instance matrices and colors
  useEffect(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    const tempScale = new THREE.Vector3();
    
    // Pre-allocate color array
    colorArray.current = new Float32Array(entityCount * 3);
    
    for (let i = 0; i < entityCount; i++) {
      const idx3 = i * 3;
      
      // Set initial transform
      const x = entitySystem.positions[idx3];
      const y = entitySystem.positions[idx3 + 1];
      const z = entitySystem.positions[idx3 + 2];
      const size = entitySystem.sizes[i];
      
      tempScale.set(size, size, size);
      tempMatrix.makeTranslation(x, y, z);
      tempMatrix.scale(tempScale);
      mesh.setMatrixAt(i, tempMatrix);
      
      // Set color
      const r = entitySystem.colors[idx3];
      const g = entitySystem.colors[idx3 + 1];
      const b = entitySystem.colors[idx3 + 2];
      
      tempColor.setRGB(r, g, b);
      mesh.setColorAt(i, tempColor);
      
      colorArray.current[idx3] = r;
      colorArray.current[idx3 + 1] = g;
      colorArray.current[idx3 + 2] = b;
    }
    
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [entitySystem, entityCount]);
  
  // Sync loop: Update instances from physics state
  useFrame(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const tempMatrix = new THREE.Matrix4();
    const tempRotation = new THREE.Euler();
    const tempPosition = new THREE.Vector3();
    const tempScale = new THREE.Vector3();
    
    // Direct read from TypedArray - authoritative source of truth
    for (let i = 0; i < entityCount; i++) {
      const idx3 = i * 3;
      
      // Position from physics
      tempPosition.set(
        entitySystem.positions[idx3],
        entitySystem.positions[idx3 + 1],
        entitySystem.positions[idx3 + 2]
      );
      
      // Rotation from physics
      tempRotation.set(
        entitySystem.rotations[idx3],
        entitySystem.rotations[idx3 + 1],
        entitySystem.rotations[idx3 + 2]
      );
      
      // Scale from entity size
      const size = entitySystem.sizes[i];
      tempScale.set(size, size, size);
      
      // Compose matrix
      tempMatrix.compose(tempPosition, new THREE.Quaternion().setFromEuler(tempRotation), tempScale);
      mesh.setMatrixAt(i, tempMatrix);
    }
    
    // Mark for GPU update
    mesh.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, entityCount]}
      frustumCulled={false}
    >
      {/* Geometry and material are passed via args */}
    </instancedMesh>
  );
}
