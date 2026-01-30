/**
 * Main Simulation Dashboard - Client Component
 * Uses dynamic import to prevent SSR issues with Three.js
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Scene3D } from './Scene3D';
import { EntitySystem } from '@/lib/EntitySystem';
import { usePhysicsWorker } from '@/lib/usePhysicsWorker';

interface SimulationDashboardProps {
  entityCount?: number;
  worldBounds?: { width: number; height: number };
}

export function SimulationDashboard({
  entityCount = 7000,
  worldBounds = { width: 100, height: 60 },
}: SimulationDashboardProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [currentEntityCount, setCurrentEntityCount] = useState(entityCount);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Create entity system
  const entitySystem = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    return new EntitySystem({
      maxEntities: currentEntityCount,
      worldBounds,
    });
  }, [currentEntityCount, worldBounds]);
  
  // Initialize physics worker
  usePhysicsWorker(entitySystem);
  
  // Mark as ready after mount
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  const handleEntityCountChange = (count: number) => {
    setCurrentEntityCount(count);
  };
  
  if (!isReady || !entitySystem) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          <div className="animate-pulse mb-4 text-xl">Initializing simulation...</div>
          <div className="text-sm text-zinc-400">Loading {currentEntityCount.toLocaleString()} entities</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-screen bg-zinc-900">
      {/* 3D Scene */}
      <Scene3D entitySystem={entitySystem} showStats={showStats} isMobile={isMobile} />
      
      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white min-w-[280px]">
        <h2 className="text-lg font-bold mb-3 text-zinc-100">Simulation Controls</h2>
        
        {/* Entity Count Display */}
        <div className="mb-4 p-3 bg-zinc-800/50 rounded">
          <div className="text-sm text-zinc-400 mb-1">Active Entities</div>
          <div className="text-2xl font-mono font-bold text-green-400">
            {currentEntityCount.toLocaleString()}
          </div>
        </div>
        
        {/* Preset Controls */}
        <div className="space-y-2 mb-4">
          <div className="text-sm text-zinc-400 mb-2">Entity Presets:</div>
          {[1000, 3000, 5000, 7000, 10000].map((count) => (
            <button
              key={count}
              onClick={() => handleEntityCountChange(count)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentEntityCount === count
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
              }`}
            >
              {count.toLocaleString()} entities
            </button>
          ))}
        </div>
        
        {/* Toggle Stats */}
        <div className="pt-3 border-t border-zinc-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-zinc-300">Show Performance Stats</span>
          </label>
        </div>
        
        {/* Device Info */}
        <div className="mt-4 pt-3 border-t border-zinc-700 text-xs text-zinc-500">
          <div>Device: {isMobile ? 'Mobile/Touch' : 'Desktop'}</div>
          <div>Physics: Web Worker (Off-thread)</div>
          <div>Rendering: InstancedMesh (1 draw call)</div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
        <h3 className="text-sm font-bold mb-2 text-zinc-100">Controls</h3>
        <div className="text-xs text-zinc-400 space-y-1">
          {isMobile ? (
            <>
              <div>• One finger: Rotate</div>
              <div>• Two fingers: Zoom/Pan</div>
              <div>• Pinch: Zoom</div>
            </>
          ) : (
            <>
              <div>• Left click + drag: Rotate</div>
              <div>• Right click + drag: Pan</div>
              <div>• Scroll: Zoom</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
