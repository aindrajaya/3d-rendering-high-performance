/**
 * React hook to manage Physics Web Worker lifecycle
 */

import { useEffect, useRef, useCallback } from 'react';
import type { EntitySystem } from './EntitySystem';

interface PhysicsWorkerMessage {
  type: 'ready' | 'update';
  positions?: Float32Array;
  rotations?: Float32Array;
}

export function usePhysicsWorker(entitySystem: EntitySystem | null) {
  const workerRef = useRef<Worker | null>(null);
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!entitySystem) return;
    
    // Create worker
    const worker = new Worker(
      new URL('../workers/physics.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current = worker;
    
    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<PhysicsWorkerMessage>) => {
      const { type, positions, rotations } = event.data;
      
      if (type === 'ready' && !isInitializedRef.current) {
        // Initialize physics simulation
        const physicsData = entitySystem.getPhysicsData();
        
        // Don't use transferables - copy data instead to avoid buffer detachment
        worker.postMessage({
          type: 'init',
          entityCount: entitySystem.getEntityCount(),
          positions: new Float32Array(physicsData.positions),
          velocities: new Float32Array(physicsData.velocities),
          sizes: new Float32Array(physicsData.sizes),
          worldBounds: { width: 100, height: 60 },
        });
        
        isInitializedRef.current = true;
      } else if (type === 'update' && positions && rotations) {
        // Update entity system with physics results
        entitySystem.updateFromPhysics(positions, rotations);
      }
    };
    
    worker.onerror = (error) => {
      console.error('Physics worker error:', error);
    };
    
    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
      isInitializedRef.current = false;
    };
  }, [entitySystem]);
  
  const requestUpdate = useCallback(() => {
    if (workerRef.current && isInitializedRef.current) {
      workerRef.current.postMessage({ type: 'update' });
    }
  }, []);
  
  return { requestUpdate };
}
