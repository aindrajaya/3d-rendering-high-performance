/**
 * Main 3D Scene with camera controls and lighting
 */

'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei';
import { InstancedEntities } from './InstancedEntities';
import type { EntitySystem } from '@/lib/EntitySystem';
import { Suspense } from 'react';

interface Scene3DProps {
  entitySystem: EntitySystem;
  showStats?: boolean;
  isMobile?: boolean;
}

function SceneContent({ entitySystem, isMobile }: { entitySystem: EntitySystem; isMobile?: boolean }) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 80]} fov={60} />
      
      {/* Controls with touch support */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={200}
        enablePan={true}
        touches={{
          ONE: 2, // TOUCH.ROTATE
          TWO: 0, // TOUCH.DOLLY_PAN
        }}
      />
      
      {/* Lighting optimized for performance */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} castShadow={false} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Instanced entities */}
      <InstancedEntities entitySystem={entitySystem} isMobile={isMobile} />
      
      {/* Grid helper for spatial reference */}
      <gridHelper args={[100, 20, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} />
    </>
  );
}

export function Scene3D({ entitySystem, showStats = true, isMobile = false }: Scene3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        gl={{
          antialias: !isMobile, // Disable antialiasing on mobile for performance
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower pixel ratio on mobile
        performance={{
          min: 0.5,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent entitySystem={entitySystem} isMobile={isMobile} />
        </Suspense>
        
        {/* Performance stats */}
        {showStats && <Stats />}
      </Canvas>
    </div>
  );
}
