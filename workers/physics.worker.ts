/**
 * Physics Web Worker - Offloads Matter.js simulation from main thread
 * This prevents blocking the UI and resolves high initial load times
 */

import Matter from 'matter-js';

interface InitMessage {
  type: 'init';
  entityCount: number;
  positions: Float32Array;
  velocities: Float32Array;
  sizes: Float32Array;
  worldBounds: { width: number; height: number };
}

interface UpdateMessage {
  type: 'update';
}

interface StopMessage {
  type: 'stop';
}

type WorkerMessage = InitMessage | UpdateMessage | StopMessage;

let engine: Matter.Engine | null = null;
let bodies: Matter.Body[] = [];
let isRunning = false;
let animationFrameId: number | null = null;

/**
 * Initialize Matter.js engine with entity data
 */
function initPhysics(data: InitMessage): void {
  // Create Matter.js engine with optimized settings
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 0, scale: 0 }, // Zero gravity for 3D space simulation
    constraintIterations: 2,
    positionIterations: 4,
    velocityIterations: 4,
  });
  
  const { entityCount, positions, velocities, sizes, worldBounds } = data;
  
  // Create physics bodies from entity data
  bodies = [];
  for (let i = 0; i < entityCount; i++) {
    const idx3 = i * 3;
    const x = positions[idx3];
    const y = positions[idx3 + 1];
    const vx = velocities[idx3];
    const vy = velocities[idx3 + 1];
    const radius = sizes[i] * 0.5;
    
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.9,
      friction: 0.001,
      frictionAir: 0.01,
      density: 0.001,
    });
    
    // Set initial velocity
    Matter.Body.setVelocity(body, { x: vx, y: vy });
    
    bodies.push(body);
  }
  
  // Add all bodies to world
  Matter.Composite.add(engine.world, bodies);
  
  // Create boundary walls
  const wallThickness = 10;
  const { width, height } = worldBounds;
  
  const walls = [
    // Top
    Matter.Bodies.rectangle(0, -height / 2 - wallThickness / 2, width, wallThickness, { isStatic: true }),
    // Bottom
    Matter.Bodies.rectangle(0, height / 2 + wallThickness / 2, width, wallThickness, { isStatic: true }),
    // Left
    Matter.Bodies.rectangle(-width / 2 - wallThickness / 2, 0, wallThickness, height, { isStatic: true }),
    // Right
    Matter.Bodies.rectangle(width / 2 + wallThickness / 2, 0, wallThickness, height, { isStatic: true }),
  ];
  
  Matter.Composite.add(engine.world, walls);
  
  isRunning = true;
  runSimulation();
  
  // Send initial sync
  syncPhysicsState();
}

/**
 * Main simulation loop running in worker
 */
function runSimulation(): void {
  if (!isRunning || !engine) return;
  
  // Fixed timestep for deterministic physics
  const delta = 1000 / 60; // 60 FPS
  Matter.Engine.update(engine, delta);
  
  // Sync state back to main thread at regular intervals
  syncPhysicsState();
  
  // Continue loop
  setTimeout(() => runSimulation(), delta);
}

/**
 * Send physics state back to main thread
 */
function syncPhysicsState(): void {
  if (!bodies.length) return;
  
  const positions = new Float32Array(bodies.length * 3);
  const rotations = new Float32Array(bodies.length * 3);
  
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const idx3 = i * 3;
    
    positions[idx3] = body.position.x;
    positions[idx3 + 1] = body.position.y;
    positions[idx3 + 2] = 0; // 2D physics, Z remains 0
    
    rotations[idx3] = 0;
    rotations[idx3 + 1] = 0;
    rotations[idx3 + 2] = body.angle;
  }
  
  // Post message back to main thread (no transferables to avoid detachment)
  self.postMessage({
    type: 'update',
    positions,
    rotations,
  });
}

/**
 * Stop simulation
 */
function stopPhysics(): void {
  isRunning = false;
  if (animationFrameId !== null) {
    clearTimeout(animationFrameId);
  }
  if (engine) {
    Matter.Engine.clear(engine);
    engine = null;
  }
  bodies = [];
}

/**
 * Message handler
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;
  
  switch (type) {
    case 'init':
      initPhysics(event.data);
      break;
    case 'update':
      // Manual update trigger if needed
      if (engine) {
        Matter.Engine.update(engine, 1000 / 60);
        syncPhysicsState();
      }
      break;
    case 'stop':
      stopPhysics();
      break;
  }
};

// Signal worker is ready
self.postMessage({ type: 'ready' });
