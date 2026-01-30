/**
 * Main page - Server Component
 * Imports client component wrapper for Three.js
 */

import { DashboardLoader } from '@/components/DashboardLoader';

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <DashboardLoader entityCount={7000} worldBounds={{ width: 100, height: 60 }} />
    </main>
  );
}

