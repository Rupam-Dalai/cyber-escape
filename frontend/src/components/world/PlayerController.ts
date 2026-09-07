// Player Movement & Interactive Controller with Delta-Time Fixed Timestep
import { RoomDefinition, WorldObject } from './RoomRenderer';
import { soundEngine } from '../../services/audio';

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  speed: number;
  facing: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  animFrame: number;
  targetX: number | null;
  targetY: number | null;
}

export class PlayerController {
  public state: PlayerState;
  private keys: { [key: string]: boolean } = {};
  private stepSoundCooldown: number = 0;
  private handleKeyDownBound = (e: KeyboardEvent) => this.handleKeyDown(e.key, e.code);
  private handleKeyUpBound = (e: KeyboardEvent) => this.handleKeyUp(e.key, e.code);

  constructor(startX: number = 400, startY: number = 300) {
    this.state = {
      x: startX,
      y: startY,
      radius: 18,
      speed: 3.8, // Calibrated standard walking velocity at 60Hz
      facing: 'down',
      isMoving: false,
      animFrame: 0,
      targetX: null,
      targetY: null,
    };
  }

  public attachListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDownBound);
      window.addEventListener('keyup', this.handleKeyUpBound);
    }
  }

  public detachListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDownBound);
      window.removeEventListener('keyup', this.handleKeyUpBound);
    }
  }

  public getState(): PlayerState {
    return this.state;
  }

  public setPosition(x: number, y: number): void {
    this.state.x = x;
    this.state.y = y;
    this.state.targetX = null;
    this.state.targetY = null;
  }

  public resetPosition(x: number, y: number): void {
    this.state.x = x;
    this.state.y = y;
    this.state.targetX = null;
    this.state.targetY = null;
    this.state.isMoving = false;
  }

  public setClickTarget(x: number, y: number): void {
    this.state.targetX = x;
    this.state.targetY = y;
  }

  public handleKeyDown(key: string, code?: string): void {
    const isInputFocused =
      typeof document !== 'undefined' &&
      (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA');
    if (isInputFocused) return;

    const lowerKey = key.toLowerCase();
    this.keys[lowerKey] = true;
    this.keys[key] = true;
    if (code) {
      this.keys[code.toLowerCase()] = true;
      this.keys[code] = true;
    }
    this.state.targetX = null;
    this.state.targetY = null;
  }

  public handleKeyUp(key: string, code?: string): void {
    const lowerKey = key.toLowerCase();
    this.keys[lowerKey] = false;
    this.keys[key] = false;
    if (code) {
      this.keys[code.toLowerCase()] = false;
      this.keys[code] = false;
    }
  }

  public clearKeys(): void {
    this.keys = {};
    this.state.targetX = null;
    this.state.targetY = null;
    this.state.isMoving = false;
  }

  // Delta-Time Normalized Update Loop (Fixed speed across 60Hz, 120Hz, 144Hz, 240Hz)
  public update(room: RoomDefinition, isLaserBlocked: boolean, deltaScale: number = 1.0): void {
    // Clamp deltaScale to prevent teleporting on tab switch or lag spikes
    const ds = Math.min(Math.max(deltaScale, 0.1), 3.0);

    let dx = 0;
    let dy = 0;

    const isSprint = this.keys['Shift'] || this.keys['shift'];
    const currentSpeed = (isSprint ? this.state.speed * 1.35 : this.state.speed) * ds;

    // Keyboard Input: full WASD and Arrow Keys support
    if (this.keys['w'] || this.keys['keyw'] || this.keys['arrowup']) dy -= currentSpeed;
    if (this.keys['s'] || this.keys['keys'] || this.keys['arrowdown']) dy += currentSpeed;
    if (this.keys['a'] || this.keys['keya'] || this.keys['arrowleft']) dx -= currentSpeed;
    if (this.keys['d'] || this.keys['keyd'] || this.keys['arrowright']) dx += currentSpeed;

    // Mouse / Tap Target Input
    const tx = this.state.targetX;
    const ty = this.state.targetY;
    if (typeof tx === 'number' && typeof ty === 'number') {
      const diffX = tx - this.state.x;
      const diffY = ty - this.state.y;
      const dist = Math.hypot(diffX, diffY);

      if (dist > 5) {
        dx = (diffX / dist) * currentSpeed;
        dy = (diffY / dist) * currentSpeed;
      } else {
        this.state.targetX = null;
        this.state.targetY = null;
      }
    }

    // Diagonal Speed Normalization
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    // Determine Facing Direction
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0.1) this.state.facing = 'right';
      else if (dx < -0.1) this.state.facing = 'left';
    } else {
      if (dy > 0.1) this.state.facing = 'down';
      else if (dy < -0.1) this.state.facing = 'up';
    }

    const isMoving = dx !== 0 || dy !== 0;
    this.state.isMoving = isMoving;

    if (isMoving) {
      this.state.animFrame += 0.2 * ds;
      this.stepSoundCooldown += 1 * ds;
      if (this.stepSoundCooldown > 22) {
        this.stepSoundCooldown = 0;
      }

      // Separate Axis Collision & Sliding Physics
      const colRadius = 10; // Tight collision radius for smooth sliding

      // 1. Test X Movement
      let testX = this.state.x + dx;
      testX = Math.max(45, Math.min(755, testX));
      let collidedX = false;

      // Check X with Partition Walls
      if (room.walls) {
        for (const wall of room.walls) {
          // Skip outer perimeter walls (handled by clamp)
          if (wall.width >= 780 || wall.height >= 580) continue;

          const wLeft = wall.x - colRadius;
          const wRight = wall.x + wall.width + colRadius;
          const wTop = wall.y - colRadius;
          const wBottom = wall.y + wall.height + colRadius;

          if (testX > wLeft && testX < wRight && this.state.y > wTop && this.state.y < wBottom) {
            collidedX = true;
            break;
          }
        }
      }

      // Check X with World Objects
      if (!collidedX) {
        for (const obj of room.objects) {
          if (obj.type === 'LASER_GRID' && !isLaserBlocked) continue;
          const oLeft = obj.x - obj.width / 2 - colRadius;
          const oRight = obj.x + obj.width / 2 + colRadius;
          const oTop = obj.y - obj.height / 2 - colRadius;
          const oBottom = obj.y + obj.height / 2 + colRadius;

          if (testX > oLeft && testX < oRight && this.state.y > oTop && this.state.y < oBottom) {
            collidedX = true;
            break;
          }
        }
      }

      if (!collidedX) {
        this.state.x = testX;
      }

      // 2. Test Y Movement
      let testY = this.state.y + dy;
      testY = Math.max(45, Math.min(555, testY));
      let collidedY = false;

      // Check Y with Partition Walls
      if (room.walls) {
        for (const wall of room.walls) {
          if (wall.width >= 780 || wall.height >= 580) continue;

          const wLeft = wall.x - colRadius;
          const wRight = wall.x + wall.width + colRadius;
          const wTop = wall.y - colRadius;
          const wBottom = wall.y + wall.height + colRadius;

          if (this.state.x > wLeft && this.state.x < wRight && testY > wTop && testY < wBottom) {
            collidedY = true;
            break;
          }
        }
      }

      // Check Y with World Objects
      if (!collidedY) {
        for (const obj of room.objects) {
          if (obj.type === 'LASER_GRID' && !isLaserBlocked) continue;
          const oLeft = obj.x - obj.width / 2 - colRadius;
          const oRight = obj.x + obj.width / 2 + colRadius;
          const oTop = obj.y - obj.height / 2 - colRadius;
          const oBottom = obj.y + obj.height / 2 + colRadius;

          if (this.state.x > oLeft && this.state.x < oRight && testY > oTop && testY < oBottom) {
            collidedY = true;
            break;
          }
        }
      }

      if (!collidedY) {
        this.state.y = testY;
      }
    }
  }

  // Calculate distance from player position to the closest edge of an object's bounding box
  public getDistanceToObject(obj: WorldObject): number {
    const halfW = (obj.width || 40) / 2;
    const halfH = (obj.height || 40) / 2;
    const clampedX = Math.max(obj.x - halfW, Math.min(this.state.x, obj.x + halfW));
    const clampedY = Math.max(obj.y - halfH, Math.min(this.state.y, obj.y + halfH));
    return Math.hypot(this.state.x - clampedX, this.state.y - clampedY);
  }

  // Get Nearest Object Within Interaction Distance
  public getNearbyObject(objects: WorldObject[], reachDistance: number = 75): WorldObject | null {
    let nearest: WorldObject | null = null;
    let minDistance = reachDistance;

    for (const obj of objects) {
      // Distance to perimeter edge
      const edgeDist = this.getDistanceToObject(obj);
      // Distance to object center
      const centerDist = Math.hypot(this.state.x - obj.x, this.state.y - obj.y);

      // Trigger if within reachDistance of the edge OR within 110px of the center
      if (edgeDist < minDistance || centerDist < 110) {
        if (edgeDist < minDistance) {
          minDistance = edgeDist;
          nearest = obj;
        } else if (!nearest) {
          nearest = obj;
        }
      }
    }

    return nearest;
  }

  public getClosestInteractiveObject(objects: WorldObject[], reachDistance: number = 85): WorldObject | null {
    return this.getNearbyObject(objects, reachDistance);
  }
}
