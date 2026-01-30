/**
 * Data-Oriented Entity System using TypedArrays for 7000+ entities
 * This avoids object churn and garbage collection pressure
 */

export interface EntitySystemConfig {
  maxEntities: number;
  worldBounds: { width: number; height: number };
}

export class EntitySystem {
  // Contiguous buffers for performance
  public positions: Float32Array; // [x, y, z, x, y, z, ...]
  public velocities: Float32Array; // [vx, vy, vz, vx, vy, vz, ...]
  public rotations: Float32Array; // [rx, ry, rz, rx, ry, rz, ...]
  public colors: Float32Array; // [r, g, b, r, g, b, ...]
  public sizes: Float32Array; // [size, size, ...]
  
  private maxEntities: number;
  private worldBounds: { width: number; height: number };
  
  constructor(config: EntitySystemConfig) {
    this.maxEntities = config.maxEntities;
    this.worldBounds = config.worldBounds;
    
    // Allocate contiguous memory
    this.positions = new Float32Array(this.maxEntities * 3);
    this.velocities = new Float32Array(this.maxEntities * 3);
    this.rotations = new Float32Array(this.maxEntities * 3);
    this.colors = new Float32Array(this.maxEntities * 3);
    this.sizes = new Float32Array(this.maxEntities);
    
    this.initialize();
  }
  
  private initialize(): void {
    const { width, height } = this.worldBounds;
    
    for (let i = 0; i < this.maxEntities; i++) {
      const idx3 = i * 3;
      
      // Random position within bounds
      this.positions[idx3] = (Math.random() - 0.5) * width;
      this.positions[idx3 + 1] = (Math.random() - 0.5) * height;
      this.positions[idx3 + 2] = (Math.random() - 0.5) * 20;
      
      // Random velocity
      this.velocities[idx3] = (Math.random() - 0.5) * 2;
      this.velocities[idx3 + 1] = (Math.random() - 0.5) * 2;
      this.velocities[idx3 + 2] = (Math.random() - 0.5) * 0.5;
      
      // Random rotation
      this.rotations[idx3] = Math.random() * Math.PI * 2;
      this.rotations[idx3 + 1] = Math.random() * Math.PI * 2;
      this.rotations[idx3 + 2] = Math.random() * Math.PI * 2;
      
      // Random color (HSL to RGB for variety)
      const hue = Math.random();
      const rgb = this.hslToRgb(hue, 0.7, 0.6);
      this.colors[idx3] = rgb[0];
      this.colors[idx3 + 1] = rgb[1];
      this.colors[idx3 + 2] = rgb[2];
      
      // Random size
      this.sizes[i] = 0.3 + Math.random() * 0.7;
    }
  }
  
  /**
   * HSL to RGB conversion for color variety
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [r, g, b];
  }
  
  /**
   * Get serializable data for physics worker
   */
  public getPhysicsData(): {
    positions: Float32Array;
    velocities: Float32Array;
    sizes: Float32Array;
  } {
    return {
      positions: this.positions,
      velocities: this.velocities,
      sizes: this.sizes,
    };
  }
  
  /**
   * Update entity data from physics worker
   */
  public updateFromPhysics(positions: Float32Array, rotations: Float32Array): void {
    this.positions.set(positions);
    this.rotations.set(rotations);
  }
  
  /**
   * Get entity count
   */
  public getEntityCount(): number {
    return this.maxEntities;
  }
}
