/**
 * Client wrapper for dynamic dashboard loading
 */

'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for Three.js compatibility
const SimulationDashboard = dynamic(
  () => import('./SimulationDashboard').then((mod) => ({ default: mod.SimulationDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          <div className="animate-pulse mb-4 text-xl">Loading 3D Engine...</div>
          <div className="text-sm text-zinc-400">Preparing high-performance simulation</div>
        </div>
      </div>
    ),
  }
);

interface DashboardLoaderProps {
  entityCount?: number;
  worldBounds?: { width: number; height: number };
}

export function DashboardLoader({ 
  entityCount = 7000, 
  worldBounds = { width: 100, height: 60 } 
}: DashboardLoaderProps) {
  return <SimulationDashboard entityCount={entityCount} worldBounds={worldBounds} />;
}
