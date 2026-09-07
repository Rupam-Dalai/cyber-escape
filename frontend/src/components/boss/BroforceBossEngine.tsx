import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Shield, Zap, Skull, Heart, AlertTriangle, ArrowRight, ArrowLeft, RotateCcw, FastForward } from 'lucide-react';
import { soundEngine } from '../../services/audio';
import { respawnPlayer } from '../../services/api';

import { FragmentItem } from '../../types';

export interface BroforceBossEngineProps {
  teamName: string;
  initialScore?: number;
  fragments?: FragmentItem[];
  onBossDefeated: () => void;
  onViewLeaderboard: () => void;
  onReturnToHub?: () => void;
  startExtraction?: boolean;
  onReplaySummoning?: () => void;
  onUpdateTeamScore?: (newScore: number) => void;
}

interface BroHero {
  id: string;
  name: string;
  title: string;
  color: string;
  bulletColor: string;
  fireRate: number; // ms between shots
  damage: number;
  bulletSpeed: number;
  bulletSpread: number;
  specialName: string;
  specialDesc: string;
  icon: string;
}

const BRO_ROSTER: BroHero[] = [
  {
    id: 'rambro',
    name: 'CYBER-RAMBRO',
    title: 'THE CYBER GUERRILLA',
    color: '#ef4444',
    bulletColor: '#fbbf24',
    fireRate: 80,
    damage: 42,
    bulletSpeed: 16,
    bulletSpread: 0.08,
    specialName: 'FIREWALL HEX SHIELD',
    specialDesc: 'Deploys 360-degree invulnerability matrix shield.',
    icon: '🎖️',
  },
  {
    id: 'bromando',
    name: 'BROMANDO',
    title: 'HEAVY ARTILLERY COMMODORE',
    color: '#3b82f6',
    bulletColor: '#60a5fa',
    fireRate: 170,
    damage: 110,
    bulletSpeed: 14,
    bulletSpread: 0.03,
    specialName: 'BREACH SHOCKWAVE CLUSTER',
    specialDesc: 'Fires cluster missiles that crack boss shields.',
    icon: '🚀',
  },
  {
    id: 'brominator',
    name: 'THE BRO-MINATOR',
    title: 'CYBORG CYBER-TANK',
    color: '#64748b',
    bulletColor: '#06b6d4',
    fireRate: 50,
    damage: 32,
    bulletSpeed: 18,
    bulletSpread: 0.16,
    specialName: 'LOGIC BOMB OVERDRIVE',
    specialDesc: 'High-speed chain gun with piercing matrix rounds.',
    icon: '🤖',
  },
  {
    id: 'neobro',
    name: 'NEO-BRO',
    title: 'THE CIPHER CHOSEN ONE',
    color: '#10b981',
    bulletColor: '#34d399',
    fireRate: 110,
    damage: 75,
    bulletSpeed: 15,
    bulletSpread: 0.05,
    specialName: 'MATRIX TARGETING RETICLE',
    specialDesc: 'Stops time briefly and highlights authentic NuLL core.',
    icon: '🕶️',
  },
];

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isHero: boolean;
  glyph?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text?: string;
}

interface DroneEnemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  active: boolean;
}

interface LightningStrike {
  x: number;
  warningTimer: number;
  struck: boolean;
  strikeTimer: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'firewall' | 'glitch' | 'server' | 'cipher' | 'cracked';
  collapsed?: boolean;
  collapseTimer?: number;
}

interface Shockwave {
  x: number;
  y: number;
  vx: number;
  radius: number;
  maxDist: number;
  traversed: number;
}

interface CorruptionOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  active: boolean;
  life: number;
}

interface SlashWave {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  life: number;
  maxLife: number;
  damage: number;
  facingRight: boolean;
  trailPoints: { x: number; y: number }[];
}

interface TrappedDataShard {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isRescued: boolean;
  hp: number;
}

interface LogicBombCache {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isExploded: boolean;
  hp: number;
}

const ESCAPE_ITEMS = [
  { id: 0, name: 'Firewall Patch', icon: '🛡️', phase: 2, desc: 'Reflective Hex Mirror' },
  { id: 1, name: 'Power Surge Cell', icon: '🔋', phase: 5, desc: 'Catastrophic Reboot EMP' },
  { id: 2, name: 'Access Credentials', icon: '📜', phase: 1, desc: 'Breach Armor Piercer' },
  { id: 3, name: 'Clean API Call', icon: '⚙️', phase: 3, desc: 'Phantom Clone Purge' },
  { id: 4, name: 'Firewall Rule Set', icon: '🧱', phase: 1, desc: 'Breach Armor Piercer' },
  { id: 5, name: 'Cipher Key', icon: '🔑', phase: 4, desc: 'Cipher Lock Shatter' },
  { id: 6, name: 'Forensic Trace Map', icon: '🗺️', phase: 5, desc: 'Catastrophic Reboot EMP' },
];

const BOSS_ANCHORS = [
  { x: 1120, y: 190 }, // Right Sector
  { x: 880, y: 200 },  // Mid-Right Sector
  { x: 520, y: 200 },  // Mid-Left Sector
  { x: 260, y: 190 },  // Left Sector
];

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export const BroforceBossEngine: React.FC<BroforceBossEngineProps> = ({
  teamName,
  initialScore = 0,
  fragments = [],
  onBossDefeated,
  onViewLeaderboard,
  onReturnToHub,
  startExtraction = false,
  onReplaySummoning,
  onUpdateTeamScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Asset images for Warrior and NuLL
  const warriorImgRef = useRef<HTMLImageElement | null>(null);
  const nullBossImgRef = useRef<HTMLImageElement | null>(null);

  // Gameplay State
  const [currentBroIdx, setCurrentBroIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const maxPlayerHp = 100;
  const [teamScore, setTeamScore] = useState(initialScore);

  // Authoritative single-use special ability persisted in sessionStorage
  const specialKey = `cyber_vault_special_used_${teamName || 'default'}`;
  const isSpecialAlreadyUsed = (() => {
    try {
      return sessionStorage.getItem(specialKey) === 'true';
    } catch {
      return false;
    }
  })();
  const [specialsRemaining, setSpecialsRemaining] = useState(isSpecialAlreadyUsed ? 0 : 1);
  const specialUsedRef = useRef(isSpecialAlreadyUsed);

  const [bossHp, setBossHp] = useState(7500);
  const maxBossHp = 7500;
  const [bossPhase, setBossPhase] = useState(1);
  const [bossDamageState, setBossDamageState] = useState<'intact' | 'cracked' | 'critical'>('intact');
  
  const [isVictory, setIsVictory] = useState(false);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isRespawning, setIsRespawning] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('MISSION: ANNIHILATE ROGUE AI NuLL TITAN!');
  const [screenShake, setScreenShake] = useState(0);

  // Stable refs for gameLoop to avoid cancelling/re-starting animation loop on state changes
  const isDeadRef = useRef(isDead);
  isDeadRef.current = isDead;
  const isVictoryRef = useRef(isVictory);
  isVictoryRef.current = isVictory;
  const onBossDefeatedRef = useRef(onBossDefeated);
  onBossDefeatedRef.current = onBossDefeated;

  // Trigger extraction helicopter only when startExtraction prop becomes true (after victory screen)
  useEffect(() => {
    if (startExtraction && gameStateRef.current) {
      gameStateRef.current.helicopter.active = true;
      gameStateRef.current.drones = [];
      gameStateRef.current.lightningStrikes = [];
      gameStateRef.current.corruptionOrbs = [];
      gameStateRef.current.slashWaves = [];
      gameStateRef.current.player.invulnerableTimer = 999999;
      setAnnouncement('🚁 EXTRACTION HELICOPTER INCOMING! ASCEND TO SAFETY!');
    }
  }, [startExtraction]);

  // Active Bro definition
  const currentBro = BRO_ROSTER[currentBroIdx];

  // Preload Character Sketches (Warrior and NuLL)
  useEffect(() => {
    const wImg = new Image();
    wImg.src = '/assets/hero_avatar.png';
    wImg.onload = () => { warriorImgRef.current = wImg; };

    const nImg = new Image();
    nImg.src = '/assets/null_king_boss.png';
    nImg.onload = () => { nullBossImgRef.current = nImg; };
  }, []);

  // Ref states for 60 FPS physics loop
  const gameStateRef = useRef({
    player: {
      x: 100,
      y: 420,
      vx: 0,
      vy: 0,
      width: 36,
      height: 52,
      isGrounded: false,
      jumpsLeft: 2, // Double Jump
      facingRight: true,
      lastShotTime: 0,
      invulnerableTimer: 0,
      specialVfxTimer: 0,
      specialVfxType: 'shield',
    },
    boss: {
      x: 1080,
      y: 190,
      baseY: 190,
      targetX: 1080,
      targetY: 190,
      repositionTimer: 480, // ~8s to first reposition
      vx: 0,
      vy: 0,
      width: 170,
      height: 210,
      hp: 7500,
      phase: 1, // 1 to 5
      damageState: 'intact' as 'intact' | 'cracked' | 'critical',
      stateTimer: 0,
      isLowerLaserActive: false,
      laserWarningTimer: 0,
      laserSweepTimer: 0,
      laserTargetX: 0,
      laserTargetY: 495,
      hoverOffset: 0,
      clones: [] as { x: number; y: number; isReal: boolean }[],

      // Ground Slam attack
      slamState: 'idle' as 'idle' | 'windup' | 'slamming' | 'recovery',
      slamTimer: 0,

      // Corruption Orb attack
      orbWindupTimer: 0,

      // Hit feedback
      hitFlashTimer: 0,
      recoilX: 0,

      // Cyber Sword Strike state machine
      swordState: 'idle' as ('idle' | 'windup' | 'lunge' | 'swing' | 'recovery'),
      swordTimer: 0,
      swordTargetX: 0,
      swordTargetY: 0,
      swordFacingRight: true,
      swordLungeStartX: 0,

      // Canonical animation state (drives all rendering)
      animState: 'idle' as ('idle' | 'slam-windup' | 'slam-slamming' | 'slam-recovery' |
                            'orb-windup' | 'laser-warning' | 'laser-active' |
                            'sword-windup' | 'sword-lunge' | 'sword-swing' | 'sword-recovery' |
                            'hit-react' | 'phase-transition' | 'death'),
      phaseTransitionTimer: 0,
      prevPhase: 1,
      deathTimer: -1, // -1 = not dying; 0-120 = death sequence
    },
    platforms: [
      { x: 0, y: 500, width: 1400, height: 100, type: 'firewall' }, // Full 1400px Bedrock Ground Floor
      { x: 100, y: 400, width: 160, height: 16, type: 'firewall' }, // Lower Left
      { x: 180, y: 240, width: 150, height: 16, type: 'firewall' }, // High Left
      { x: 380, y: 330, width: 160, height: 16, type: 'firewall' }, // Mid-Left Concourse
      { x: 620, y: 210, width: 160, height: 16, type: 'firewall' }, // High-Center Overpass
      { x: 620, y: 390, width: 160, height: 16, type: 'firewall' }, // Mid-Center Hub
      { x: 860, y: 330, width: 160, height: 16, type: 'firewall' }, // Mid-Right Concourse
      { x: 1070, y: 240, width: 150, height: 16, type: 'firewall' }, // High Right
      { x: 1140, y: 400, width: 160, height: 16, type: 'firewall' }, // Lower Right (Degrades at HP <= 5000)
      { x: 1240, y: 270, width: 130, height: 16, type: 'firewall' }, // Far Right Perch
    ] as Platform[],
    dataShards: [
      { id: 1, x: 250, y: 195, width: 35, height: 40, isRescued: false, hp: 40 },
      { id: 2, x: 460, y: 285, width: 35, height: 40, isRescued: false, hp: 40 },
      { id: 3, x: 940, y: 285, width: 35, height: 40, isRescued: false, hp: 40 },
      { id: 4, x: 1145, y: 195, width: 35, height: 40, isRescued: false, hp: 40 },
    ] as TrappedDataShard[],
    logicBombs: [
      { id: 1, x: 260, y: 465, width: 28, height: 35, isExploded: false, hp: 25 },
      { id: 2, x: 620, y: 355, width: 28, height: 35, isExploded: false, hp: 25 },
      { id: 3, x: 860, y: 465, width: 28, height: 35, isExploded: false, hp: 25 },
      { id: 4, x: 1220, y: 465, width: 28, height: 35, isExploded: false, hp: 25 },
    ] as LogicBombCache[],
    drones: [] as DroneEnemy[],
    lightningStrikes: [] as LightningStrike[],
    shockwaves: [] as Shockwave[],
    corruptionOrbs: [] as CorruptionOrb[],
    slashWaves: [] as SlashWave[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    bgGlyphs: [] as { x: number; y: number; char: string; speed: number; opacity: number }[],
    helicopter: {
      active: false,
      x: -120,
      y: 90,
      ropeLength: 220,
      escaped: false,
    },
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
      special: false,
    },
  });

  // Populate drifting background glyphs across 1400px width
  useEffect(() => {
    const glyphs = ['0', '1', '0x', 'FF', 'NULL', 'EOF', 'SYS', '>>', '&&', '||', 'ACK', 'SYN'];
    const arr = [];
    for (let i = 0; i < 70; i++) {
      arr.push({
        x: Math.random() * 1400,
        y: Math.random() * 600,
        char: glyphs[Math.floor(Math.random() * glyphs.length)],
        speed: 0.3 + Math.random() * 0.8,
        opacity: 0.15 + Math.random() * 0.25,
      });
    }
    gameStateRef.current.bgGlyphs = arr;
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDead) return;
      const state = gameStateRef.current;
      const k = state.keys;
      const p = state.player;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.code === 'KeyA') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.code === 'KeyD') k.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'KeyW' || e.key === ' ' || e.code === 'Space') {
        if (!k.up) {
          // Jump or Double Jump
          if (p.isGrounded) {
            p.vy = -12;
            p.isGrounded = false;
            p.jumpsLeft = 1;
            soundEngine.playClick();
          } else if (p.jumpsLeft > 0) {
            p.vy = -10.5;
            p.jumpsLeft--;
            soundEngine.playElectricZap();

            // Double jump smoke puff
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: p.x,
                y: p.y + 20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2,
                life: 0,
                maxLife: 15,
                color: '#38bdf8',
                size: 4,
              });
            }
          }
        }
        k.up = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.code === 'KeyS') k.down = true;
      if (
        e.key === 'j' || e.key === 'J' || e.code === 'KeyJ' ||
        e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ' ||
        e.key === 'k' || e.key === 'K' || e.code === 'KeyK' ||
        e.key === 'f' || e.key === 'F' || e.code === 'KeyF' ||
        e.key === 'Enter' || e.code === 'Enter'
      ) {
        k.shoot = true;
      }
      if (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ' || e.key === 'x' || e.key === 'X' || e.code === 'KeyX') {
        triggerSpecialAbility();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = gameStateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.code === 'KeyA') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.code === 'KeyD') k.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'KeyW' || e.key === ' ' || e.code === 'Space') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.code === 'KeyS') k.down = false;
      if (
        e.key === 'j' || e.key === 'J' ||
        e.key === 'z' || e.key === 'Z' ||
        e.key === 'k' || e.key === 'K' ||
        e.key === 'f' || e.key === 'F' ||
        e.key === 'Enter'
      ) {
        k.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDead]);

  // Handle Player Taking Damage
  const handlePlayerTakeDamage = useCallback((damage: number) => {
    const state = gameStateRef.current;
    if (state.player.invulnerableTimer > 0 || isVictoryRef.current || isDeadRef.current) return;

    soundEngine.playError();
    setScreenShake(Math.min(18, 4 + damage * 0.2));
    state.player.invulnerableTimer = 45; // temporary shield effect

    setPlayerHp((prevHp) => {
      const newHp = Math.max(0, prevHp - damage);
      if (newHp === 0 && !isDeadRef.current) {
        setIsDead(true);
        isDeadRef.current = true;
        soundEngine.playExplosion();
        setAnnouncement('💀 HERO DOWN! PRESS REBOOT TO RESPAWN (-50 TROPHIES)');
      }
      return newHp;
    });
  }, []);

  // Handle Emergency Respawn with -50 Trophies Deduction
  const handleRespawn = async () => {
    setIsRespawning(true);
    try {
      const res = await respawnPlayer();
      setTeamScore(res.new_score);
      if (onUpdateTeamScore) onUpdateTeamScore(res.new_score);
      setPlayerHp(100);
      setIsDead(false);
      isDeadRef.current = false;

      const state = gameStateRef.current;
      state.player.x = 100;
      state.player.y = 420;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.invulnerableTimer = 180; // 3 seconds combat shield

      soundEngine.playSuccess();
      soundEngine.playVictoryFanfare();
      setAnnouncement(`⚡ REBOOT COMPLETE (-50 TROPHIES). COMBAT SHIELD ONLINE!`);
    } catch (err) {
      console.error('Respawn error:', err);
      // Fallback local respawn
      setPlayerHp(100);
      setIsDead(false);
      isDeadRef.current = false;
      setTeamScore((s) => Math.max(0, s - 50));
      gameStateRef.current.player.invulnerableTimer = 180;
    } finally {
      setIsRespawning(false);
    }
  };

  // Special Ability Trigger (Single Use Only - 1x per fight & Phase-Relevant Escape Item Synergy)
  const triggerSpecialAbility = () => {
    // Use the ref — never a stale closure — so this guard is always current
    if (specialUsedRef.current || isDeadRef.current || isVictoryRef.current) return;

    specialUsedRef.current = true; // Permanently consumed — ref update is instant, no stale closure
    try {
      sessionStorage.setItem(specialKey, 'true');
    } catch {}
    setSpecialsRemaining(0);       // Update HUD state
    soundEngine.playEmpBurst();
    setScreenShake(28);

    const state = gameStateRef.current;
    const p = state.player;
    const b = state.boss;

    p.specialVfxTimer = 45;
    p.specialVfxType = currentBro.id;

    if (b.phase === 1) {
      // Phase 1: Access Credentials & Firewall Rule Set Synergy -> Breach Piercer
      b.hp = Math.max(0, b.hp - 700);
      setBossHp(b.hp);
      setAnnouncement('📜 ACCESS CREDENTIALS & 🧱 FIREWALL RULES: BREACH PIERCER DEALT 700 MASSIVE DAMAGE!');
    } else if (b.phase === 2) {
      // Phase 2: Firewall Patch Synergy -> Hex Mirror Shield
      p.invulnerableTimer = 300; // 5 seconds reflective shield
      state.drones = []; // Purge all active drones
      b.hp = Math.max(0, b.hp - 500);
      setBossHp(b.hp);
      setAnnouncement('🛡️ FIREWALL PATCH ACTIVATED: 5s REFLECTIVE SHIELD ONLINE & DRONES WIPED!');
    } else if (b.phase === 3) {
      // Phase 3: Clean API Call Synergy -> Phantom Clone Purge
      b.clones = []; // Evaporate all decoys instantly
      b.hp = Math.max(0, b.hp - 650);
      setBossHp(b.hp);
      setAnnouncement('⚙️ CLEAN API CALL DISPATCHED: PHANTOM CLONES PURGED & NuLL STUNNED FOR 650 DMG!');
    } else if (b.phase === 4) {
      // Phase 4: Cipher Key Synergy -> Cipher Lock Shatter
      b.hp = Math.max(0, b.hp - 800);
      setBossHp(b.hp);
      setAnnouncement('🔑 CIPHER KEY ENGAGED: NuLL DEFENSIVE ENCRYPTION SHATTERED FOR 800 DAMAGE!');
    } else {
      // Phase 5: Power Surge Cell & Forensic Trace Map Synergy -> Catastrophic EMP Overload
      b.hp = Math.max(0, b.hp - 950);
      setBossHp(b.hp);
      setAnnouncement('🔋 POWER SURGE & 🗺️ FORENSIC MAP: CATASTROPHIC REBOOT EMP DEALT 950 CRITICAL DAMAGE!');
    }

    if (b.hp <= 0 && b.deathTimer < 0 && !isVictoryRef.current) {
      b.deathTimer = 0;
      b.animState = 'death';
      soundEngine.playExplosion();
      setScreenShake(40);
      setAnnouncement('💀 NuLL CORE BREACHED — CRITICAL MELTDOWN SEQUENCE INITIATED...');
      b.isLowerLaserActive = false;
      b.slamState = 'idle';
      b.swordState = 'idle';
      b.orbWindupTimer = 0;
      b.clones = [];
      state.drones = [];
      state.corruptionOrbs = [];
      state.slashWaves = [];
      state.lightningStrikes = [];
      state.projectiles = state.projectiles.filter((proj) => proj.isHero);
    }

    // Special Blast Particles
    for (let i = 0; i < 45; i++) {
      const angle = (Math.PI * 2 * i) / 45;
      state.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * (8 + Math.random() * 8),
        vy: Math.sin(angle) * (8 + Math.random() * 8),
        life: 0,
        maxLife: 35,
        color: currentBro.bulletColor,
        size: 5,
      });
    }
  };

  // 60 FPS Fixed-Timestep Accumulator Game Engine Loop (Frame-Rate Independent Physics)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_TIME_STEP = 1 / 60; // 0.0166667s (exact 60Hz deterministic physics step)
    const MAX_ACCUMULATOR = 0.1;   // 100ms cap to avoid lag runaway on tab unfocus

    const updateSimulation = () => {
      tick++;
      const state = gameStateRef.current;
      const p = state.player;
      const b = state.boss;

      // ----------------------------------------------------
      // 1. UPDATE PLAYER PHYSICS
      // ----------------------------------------------------
      if (!isDead) {
        if (p.invulnerableTimer > 0) p.invulnerableTimer--;
        if (p.specialVfxTimer > 0) p.specialVfxTimer--;

        // Horizontal input & acceleration
        if (state.keys.left) {
          p.vx = -4.8;
          p.facingRight = false;
        } else if (state.keys.right) {
          p.vx = 4.8;
          p.facingRight = true;
        } else {
          p.vx *= 0.75; // Friction
        }

        // Gravity
        p.vy += 0.58;
        if (p.vy > 14) p.vy = 14;

        p.x += p.vx;
        p.y += p.vy;

        // Arena boundary collision
        if (p.x < 30) p.x = 30;
        if (p.x > canvas.width - 30) p.x = canvas.width - 30;

        // Platform collision
        p.isGrounded = false;
        for (const plat of state.platforms) {
          // If platform has collapsed due to arena degradation, skip collision
          if (plat.collapsed) continue;

          const platLeft = plat.x;
          const platRight = plat.x + plat.width;
          const platTop = plat.y;

          // For floating platforms (y < 500)
          if (plat.y < 500) {
            if (
              p.x + p.width / 3 > platLeft &&
              p.x - p.width / 3 < platRight &&
              p.y + p.height / 2 >= platTop &&
              p.y + p.height / 2 - Math.max(p.vy, 1) <= platTop + 16 &&
              p.vy >= 0
            ) {
              p.y = platTop - p.height / 2;
              p.vy = 0;
              p.isGrounded = true;
              p.jumpsLeft = 2; // Restore double jumps
            }
          }
        }

        // Solid Arena Bedrock Ground Floor (y = 500) - NEVER allow falling below floor
        const groundFloorY = 500 - p.height / 2; // 474px
        if (p.y >= groundFloorY) {
          p.y = groundFloorY;
          p.vy = 0;
          p.isGrounded = true;
          p.jumpsLeft = 2; // Restore double jumps
        }
        if (p.y > groundFloorY) {
          p.y = groundFloorY;
          p.vy = 0;
          p.isGrounded = true;
        }

        // Ceiling Clamp
        if (p.y < 26) {
          p.y = 26;
          p.vy = Math.max(0, p.vy);
        }

        // Player shooting
        const now = Date.now();
        if (state.keys.shoot && now - p.lastShotTime > currentBro.fireRate) {
          p.lastShotTime = now;
          soundEngine.playTerminalType();

          const spreadAngle = (Math.random() - 0.5) * currentBro.bulletSpread;
          const speed = currentBro.bulletSpeed;
          const dir = p.facingRight ? 1 : -1;

          state.projectiles.push({
            x: p.x + (p.facingRight ? 24 : -24),
            y: p.y - 4,
            vx: dir * speed * Math.cos(spreadAngle),
            vy: speed * Math.sin(spreadAngle),
            radius: 3.5,
            color: currentBro.bulletColor,
            damage: currentBro.damage,
            isHero: true,
          });

          // Muzzle flash particle
          state.particles.push({
            x: p.x + (p.facingRight ? 28 : -28),
            y: p.y - 4,
            vx: dir * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 0,
            maxLife: 6,
            color: '#fbbf24',
            size: 6,
          });
        }
      }

      // ----------------------------------------------------
      // 2. BOSS NuLL 5-PHASE AI, DAMAGE STATES & ATTACK ROTATIONS
      // ----------------------------------------------------
      b.stateTimer++;
      b.hoverOffset = Math.sin(tick * 0.06) * 18;

      // Decay hit feedback recoil and flash
      if (b.hitFlashTimer > 0) b.hitFlashTimer--;
      b.recoilX *= 0.8;

      if (!isVictory && !isDead) {
        // Universal Boss 0 HP Check -> Trigger Meltdown and Cancel Attacks Immediately
        if (b.hp <= 0) {
          b.hp = 0;
          if (b.deathTimer < 0 && !isVictoryRef.current) {
            b.deathTimer = 0;
            b.animState = 'death';
            soundEngine.playExplosion();
            setScreenShake(40);
            setAnnouncement('💀 NuLL CORE BREACHED — CRITICAL MELTDOWN SEQUENCE INITIATED...');
            b.isLowerLaserActive = false;
            b.slamState = 'idle';
            b.swordState = 'idle';
            b.orbWindupTimer = 0;
            b.clones = [];
            state.drones = [];
            state.corruptionOrbs = [];
            state.slashWaves = [];
            state.lightningStrikes = [];
            state.projectiles = state.projectiles.filter((p) => p.isHero);
          }
        }

        // 5-Phase & 3 Visual Damage States (Intact 100-66%, Cracked 65-33%, Critical 32-0%)
        let newPhase = 1;
        let newDmg: 'intact' | 'cracked' | 'critical' = 'intact';

        if (b.hp <= 1500) {
          newPhase = 5;
          newDmg = 'critical';
        } else if (b.hp <= 2500) {
          newPhase = 4;
          newDmg = 'critical';
        } else if (b.hp <= 4000) {
          newPhase = 3;
          newDmg = 'cracked';
        } else if (b.hp <= 5000) {
          newPhase = 2;
          newDmg = 'cracked';
        } else {
          newPhase = 1;
          newDmg = 'intact';
        }

        b.phase = newPhase;
        b.damageState = newDmg;
        setBossPhase(newPhase);
        setBossDamageState(newDmg);

        // Phase transition detection (drives animation beat)
        if (newPhase !== b.prevPhase && b.prevPhase > 0 && b.prevPhase < newPhase) {
          b.phaseTransitionTimer = 40;
          soundEngine.playExplosion();
          setScreenShake(28);
          setAnnouncement(`🔴 PHASE ${newPhase} ENGAGED — NuLL ESCALATING THREAT LEVEL!`);
        }
        b.prevPhase = newPhase;
        if (b.phaseTransitionTimer > 0) b.phaseTransitionTimer--;

        // ENHANCEMENT 3: Arena Degradation at HP <= 5000 (Lower Right Platform Collapses)
        const lrPlat = state.platforms[8]; // Lower Right platform (x=1140, y=400)
        if (b.hp <= 5000 && lrPlat && !lrPlat.collapsed) {
          lrPlat.collapsed = true;
          soundEngine.playShortCircuitExplosion();
          setScreenShake(20);
          setAnnouncement('🚨 STRUCTURAL COLLAPSE: LOWER RIGHT PLATFORM DETACHED!');
          for (let pIdx = 0; pIdx < 30; pIdx++) {
            state.particles.push({
              x: lrPlat.x + Math.random() * lrPlat.width,
              y: lrPlat.y,
              vx: (Math.random() - 0.5) * 6,
              vy: Math.random() * 8 + 2,
              life: 0,
              maxLife: 40,
              color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
              size: 5,
            });
          }
        }

        // Update platform themes per phase
        for (const plat of state.platforms) {
          if (b.phase === 1) plat.type = 'firewall';
          else if (b.phase === 2) plat.type = 'glitch';
          else if (b.phase === 3) plat.type = 'server';
          else if (b.phase === 4) plat.type = 'cipher';
          else plat.type = 'cracked';
        }

        // Active Boss Attack Routines (Only execute if boss is alive and not dying)
        if (b.deathTimer < 0 && b.hp > 0) {
          // Boss Dynamic Lateral Repositioning across 1400px width
          if (b.slamState === 'idle' && b.swordState === 'idle') {
          b.repositionTimer--;
          if (b.repositionTimer <= 0) {
            // Pick a candidate anchor on a different lateral sector
            const candidateAnchors = BOSS_ANCHORS.filter(
              (a) => Math.abs(a.x - b.targetX) > 200
            );
            const nextAnchor =
              candidateAnchors[Math.floor(Math.random() * candidateAnchors.length)] ||
              BOSS_ANCHORS[0];
            b.targetX = nextAnchor.x;
            b.targetY = nextAnchor.y;
            b.repositionTimer = (b.phase >= 4 ? 380 : 500) + Math.floor(Math.random() * 120);
            soundEngine.playEmpBurst();
            setAnnouncement('⚡ NuLL TELEPORT-WARPING ACROSS SECTOR GRID!');

            // Warp particle aura
            for (let wp = 0; wp < 22; wp++) {
              state.particles.push({
                x: b.x + (Math.random() - 0.5) * 60,
                y: b.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 0,
                maxLife: 22,
                color: '#06b6d4',
                size: 4,
              });
            }
          }

          // Smooth repositioning glide with dynamic hover wave
          b.x += (b.targetX - b.x) * 0.045;
          b.y += (b.targetY + Math.cos(tick * 0.05) * 30 - b.y) * 0.045;
        }

        // Phase 3 Clone Swarm Generation across wide arena
        if (b.phase === 3) {
          b.clones = [
            { x: (b.x < 700 ? 980 : 380) + Math.sin(tick * 0.03) * 40, y: 190 + Math.cos(tick * 0.04) * 20, isReal: false },
            { x: 700 + Math.cos(tick * 0.03) * 40, y: 160 + Math.sin(tick * 0.04) * 20, isReal: false },
          ];
        } else {
          b.clones = [];
        }

        // ----------------------------------------------------
        // ATTACK ROTATION (Deterministic 20.0s = 1200 ticks Cycle)
        // ----------------------------------------------------
        const cycle = b.stateTimer % 1200;

        // ATTACK 1: Sweeping Ground Data Stream Laser (Cycle tick 120 = 2.0s)
        // Tighter reaction window: Phase 1-2 = 45 frames (0.75s), Phase 3-4 = 34 frames (0.57s), Phase 5 = 25 frames (0.42s)
        if (cycle === 120) {
          b.laserWarningTimer = b.phase >= 5 ? 25 : b.phase >= 3 ? 34 : 45;
          b.laserTargetX = b.x < 700 ? 1370 : 30; // Starts from opposite side of arena
          b.laserTargetY = 495;
          soundEngine.playClick();
          setAnnouncement('⚠️ WARNING: NuLL CORE OVERCHARGING! SWEEPING LASER INCOMING!');
        }

        // ATTACK 2: Ground-Slam Seismic Shockwave (Cycle tick 480 = 8.0s)
        // Tighter windup: Phase 4-5 = 34 frames (0.57s) vs 48 frames (0.8s) in Phase 1-3
        if (cycle === 480 && b.slamState === 'idle') {
          b.slamState = 'windup';
          b.slamTimer = b.phase >= 4 ? 34 : 48;
          soundEngine.playBossAttack();
          setAnnouncement('⚠️ WARNING: NuLL ASCENDING! GROUND-SLAM SHOCKWAVE INCOMING - JUMP TO EVADE!');
        }

        // ATTACK 3: Homing Corruption Vortex Orb (Cycle tick 840 = 14.0s)
        if (cycle === 840 && b.orbWindupTimer <= 0) {
          b.orbWindupTimer = b.phase >= 4 ? 42 : 60;
          soundEngine.playAlarm();
          setAnnouncement('⚠️ WARNING: NuLL CONJURING HOMING CORRUPTION ORB! SHOOT TO DESTROY OR EVADE!');
        }

        // CYBER SWORD STRIKE (Cycle tick 660 = 11.0s, all phases)
        if (cycle === 660 && b.swordState === 'idle') {
          b.swordState = 'windup';
          b.swordTimer = b.phase >= 4 ? 28 : 40;
          b.swordTargetX = p.x; // Lock target at windup-start — non-homing
          b.swordTargetY = p.y;
          b.swordFacingRight = b.x < p.x;
          soundEngine.playAlarm();
          setAnnouncement('⚠️ DANGER: NuLL CYBER BLADE CHARGING — MOVE OUT OF MELEE RANGE!');
        }

        // CYBER SWORD STRIKE fast repeat (Cycle tick 960, Phase 4-5 only)
        if (b.phase >= 4 && cycle === 960 && b.swordState === 'idle') {
          b.swordState = 'windup';
          b.swordTimer = 24;
          b.swordTargetX = p.x;
          b.swordTargetY = p.y;
          b.swordFacingRight = b.x < p.x;
          soundEngine.playAlarm();
          setAnnouncement('⚠️ RAPID CYBER BLADE — SECOND STRIKE INCOMING!');
        }

        // OVERLAPPING ATTACK 1 (Phase 3-5): NuLL launches a corruption orb right before ground slam!
        if (b.phase >= 3 && cycle === 440 && b.orbWindupTimer <= 0) {
          b.orbWindupTimer = 35;
          soundEngine.playAlarm();
          setAnnouncement('⚠️ MULTI-ATTACK: CORRUPTION ORB SUMMONED DURING SEISMIC CHARGE!');
        }

        // OVERLAPPING ATTACK 2 (Phase 4-5): Sweeping laser overlaps with Hunter Drones or Spiral Plasma
        if (b.phase >= 4 && cycle === 150) {
          soundEngine.playBossAttack();
          const count = 10;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + tick * 0.15;
            state.projectiles.push({
              x: b.x,
              y: b.y + b.hoverOffset,
              vx: Math.cos(angle) * 6,
              vy: Math.sin(angle) * 6,
              radius: 6.5,
              color: '#fb7185',
              damage: 15,
              isHero: false,
            });
          }
        }

        // Environmental Pressure: Corrupted Core Meltdown Radiation Pulse in Phase 5 (HP <= 1500)
        if (b.phase === 5 && b.stateTimer % 270 === 0 && !isVictory && !isDead && b.deathTimer < 0) {
          soundEngine.playElectricZap();
          setScreenShake(8);
          if (p.invulnerableTimer <= 0) {
            handlePlayerTakeDamage(20);
            setAnnouncement('⚠️ CRITICAL CORE MELTDOWN: RADIATION PULSE HIT (-20 HP)!');
            for (let cp = 0; cp < 8; cp++) {
              state.particles.push({
                x: p.x + (Math.random() - 0.5) * 20,
                y: p.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3,
                life: 0,
                maxLife: 12,
                color: '#ef4444',
                size: 3,
              });
            }
          }
        }

        // PROXIMITY TRIGGER: Cyber Sword Strike when player walks into melee range (within 180px)
        if (b.swordState === 'idle' && b.slamState === 'idle' && b.stateTimer % 60 === 0) {
          const meleeProximity = Math.hypot(p.x - b.x, p.y - (b.y + b.hoverOffset));
          if (meleeProximity < 180 && Math.random() < 0.5) {
            b.swordState = 'windup';
            b.swordTimer = b.phase >= 4 ? 28 : 40;
            b.swordTargetX = p.x;
            b.swordTargetY = p.y;
            b.swordFacingRight = b.x < p.x;
            soundEngine.playAlarm();
            setAnnouncement('⚠️ PROXIMITY ALERT: NuLL CYBER BLADE — BACK AWAY!');
          }
        }

        // Regular Attack: Tracking Plasma Matrix Bullets
        const plasmaInterval = b.phase === 5 ? 40 : b.phase >= 3 ? 65 : 90;
        if (b.stateTimer % plasmaInterval === 0 && b.slamState === 'idle') {
          soundEngine.playElectricZap();
          const angleToPlayer = Math.atan2(p.y - b.y, p.x - b.x);
          state.projectiles.push({
            x: b.x - 40,
            y: b.y + b.hoverOffset,
            vx: Math.cos(angleToPlayer) * (b.phase === 5 ? 8.5 : 6.5),
            vy: Math.sin(angleToPlayer) * (b.phase === 5 ? 8.5 : 6.5),
            radius: 8,
            color: b.phase >= 4 ? '#ef4444' : '#06b6d4',
            damage: 15,
            isHero: false,
            glyph: Math.random() > 0.5 ? '01' : '0x',
          });
        }

        // Regular Attack: Bullet-Hell Radial Matrix Spiral Wave
        if (b.phase >= 2 && b.stateTimer % 180 === 0 && b.slamState === 'idle') {
          soundEngine.playBossAttack();
          setScreenShake(8);
          const count = b.phase === 5 ? 14 : b.phase >= 3 ? 10 : 8;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + tick * 0.12;
            state.projectiles.push({
              x: b.x,
              y: b.y + b.hoverOffset,
              vx: Math.cos(angle) * 5.5,
              vy: Math.sin(angle) * 5.5,
              radius: 6.5,
              color: '#fb7185',
              damage: 15,
              isHero: false,
            });
          }
        }

        // Regular Attack: Kamikaze Drones
        if (b.phase >= 2 && b.stateTimer % 320 === 0 && state.drones.length < 3) {
          soundEngine.playAlarm();
          setAnnouncement('⚠️ WARNING: NuLL DEPLOYED CORRUPTED HUNTER DRONES!');
          state.drones.push({
            x: b.x - 50,
            y: b.y - 40,
            vx: -3.2,
            vy: 0,
            hp: 80,
            active: true,
          });
        }

        // Regular Attack: Orbital EMP Lightning Hazard
        if (b.phase >= 2 && b.stateTimer % 240 === 60) {
          state.lightningStrikes.push({
            x: p.x,
            warningTimer: 45,
            struck: false,
            strikeTimer: 15,
          });
        }

        // ----------------------------------------------------
        // EXECUTE GROUND-SLAM SEISMIC SHOCKWAVE ATTACK
        // ----------------------------------------------------
        if (b.slamState === 'windup') {
          b.slamTimer--;
          b.y = b.baseY - 45; // Ascend during windup
          if (tick % 3 === 0) {
            state.particles.push({
              x: b.x + (Math.random() - 0.5) * 60,
              y: b.y + (Math.random() - 0.5) * 60,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 0,
              maxLife: 15,
              color: '#fbbf24',
              size: 4,
            });
          }
          if (b.slamTimer <= 0) {
            b.slamState = 'slamming';
            b.y = 390; // Slam down toward floor!
            soundEngine.playExplosion();
            setScreenShake(26);
            setAnnouncement('💥 NuLL GROUND SLAMMED! SEISMIC SHOCKWAVE EXPANDING ACROSS FLOOR!');

            // Spawn dual expanding ground shockwaves across 1400px width
            state.shockwaves.push({
              x: b.x,
              y: 490,
              vx: -8.5,
              radius: 28,
              maxDist: 1400,
              traversed: 0,
            });
            state.shockwaves.push({
              x: b.x,
              y: 490,
              vx: 8.5,
              radius: 28,
              maxDist: 1400,
              traversed: 0,
            });

            // Ground impact rubble particles
            for (let sp = 0; sp < 25; sp++) {
              state.particles.push({
                x: b.x + (Math.random() - 0.5) * 40,
                y: 495,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 8 - 2,
                life: 0,
                maxLife: 25,
                color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
                size: 4.5,
              });
            }

            b.slamState = 'recovery';
            b.slamTimer = 40;
          }
        } else if (b.slamState === 'recovery') {
          b.slamTimer--;
          b.y += (b.baseY - b.y) * 0.08;
          if (b.slamTimer <= 0) {
            b.slamState = 'idle';
          }
        }

        // ----------------------------------------------------
        // EXECUTE CYBER SWORD STRIKE ATTACK
        // ----------------------------------------------------
        if (b.swordState === 'windup') {
          b.swordTimer--;
          b.animState = 'sword-windup';
          // Red charge particles building on blade tip
          if (tick % 2 === 0) {
            const armX = b.x + (b.swordFacingRight ? 70 : -70);
            state.particles.push({
              x: armX + (Math.random() - 0.5) * 28,
              y: b.y + b.hoverOffset - 40 + (Math.random() - 0.5) * 28,
              vx: (b.swordFacingRight ? 1 : -1) * (1 + Math.random() * 2),
              vy: -Math.random() * 2 - 0.5,
              life: 0,
              maxLife: 14,
              color: Math.random() > 0.5 ? '#ef4444' : '#ff6b6b',
              size: 3 + Math.random() * 2,
            });
          }
          if (b.swordTimer <= 0) {
            b.swordLungeStartX = b.x; // Capture current boss X at lunge start
            b.swordState = 'lunge';
            b.swordTimer = 12;
            soundEngine.playShortCircuitExplosion();
            setAnnouncement('⚡ NuLL LUNGING — CYBER BLADE STRIKE INCOMING!');
          }
        } else if (b.swordState === 'lunge') {
          b.swordTimer--;
          b.animState = 'sword-lunge';
          // Fast lunge toward locked (non-homing) target position, 70% of the way
          const lungeProgress = 1 - b.swordTimer / 12;
          b.x = b.swordLungeStartX + (b.swordTargetX - b.swordLungeStartX) * lungeProgress * 0.72;
          if (b.swordTimer <= 0) {
            b.swordState = 'swing';
            b.swordTimer = 14;
          }
        } else if (b.swordState === 'swing') {
          b.swordTimer--;
          b.animState = 'sword-swing';
          // Melee hitbox: check player within arc range
          const meleeRange = 135;
          const distToPlayer = Math.hypot(p.x - b.x, p.y - (b.y + b.hoverOffset));
          if (distToPlayer < meleeRange && !isDead) {
            handlePlayerTakeDamage(45);
            setScreenShake(24);
            setAnnouncement('💀 DIRECT CYBER BLADE HIT! [-45 HP]');
          }
          // Blade arc particle trail
          if (tick % 2 === 0) {
            const swingAngle = (b.swordFacingRight ? 0 : Math.PI) + (Math.random() - 0.5) * 1.4;
            state.particles.push({
              x: b.x + Math.cos(swingAngle) * (70 + Math.random() * 50),
              y: b.y + b.hoverOffset + Math.sin(swingAngle) * 40,
              vx: Math.cos(swingAngle) * 7,
              vy: Math.sin(swingAngle) * 7 - 2,
              life: 0,
              maxLife: 11,
              color: Math.random() > 0.45 ? '#ef4444' : '#06b6d4',
              size: 5.5,
            });
          }
          // FRAME-ACCURATE: On last swing frame → spawn slash wave + enter recovery simultaneously
          if (b.swordTimer <= 0) {
            const phaseSpeedMul = b.phase >= 5 ? 1.22 : 1.0;
            const waveVx = (b.swordFacingRight ? 14 : -14) * phaseSpeedMul;
            state.slashWaves.push({
              x: b.x + (b.swordFacingRight ? 90 : -90),
              y: b.y + b.hoverOffset - 10,
              vx: waveVx,
              vy: -1.2,
              width: 56,
              height: 28,
              life: 0,
              maxLife: 90,
              damage: 35,
              facingRight: b.swordFacingRight,
              trailPoints: [],
            });
            soundEngine.playEmpBurst();
            setAnnouncement('⚡ SLASH WAVE RELEASED — DODGE THE CRESCENT OR TAKE 35 DMG!');
            // Recovery window starts now (same frame as wave launch — no delay)
            b.swordState = 'recovery';
            b.swordTimer = b.phase >= 4 ? 38 : 55;
          }
        } else if (b.swordState === 'recovery') {
          b.swordTimer--;
          b.animState = 'sword-recovery';
          if (b.swordTimer <= 0) {
            b.swordState = 'idle';
          }
        }
      }

        // Boss Death Sequence (120-frame countdown before victory trigger)
        if (b.deathTimer >= 0) {
          b.animState = 'death';
          b.deathTimer++;
          if (b.deathTimer % 4 === 0) {
            for (let di = 0; di < 6; di++) {
              state.particles.push({
                x: b.x + (Math.random() - 0.5) * 200,
                y: b.y + b.hoverOffset + (Math.random() - 0.5) * 200,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14 - 3,
                life: 0,
                maxLife: 38,
                color: Math.random() > 0.5 ? '#ef4444' : '#06b6d4',
                size: 7 + Math.random() * 7,
              });
            }
          }
          if (b.deathTimer >= 120 && !isVictoryRef.current) {
            isVictoryRef.current = true;
            setIsVictory(true);
            soundEngine.playVictoryFanfare();
            // Extraction helicopter will be dispatched after player acknowledges victory screen
            setAnnouncement('🏆 VICTORY: ROGUE AI NuLL TITAN ANNIHILATED!');
            if (onBossDefeatedRef.current) onBossDefeatedRef.current();
          }
        }

        // Derive canonical animState (priority: death > phase-transition > hit-react > sword > slam > orb > laser > idle)
        if (b.deathTimer >= 0) {
          b.animState = 'death';
        } else if (b.phaseTransitionTimer > 0) {
          b.animState = 'phase-transition';
        } else if (b.hitFlashTimer > 0) {
          b.animState = 'hit-react';
        } else if (b.swordState !== 'idle') {
          // animState already set by sword machine above
        } else if (b.slamState === 'windup') {
          b.animState = 'slam-windup';
        } else if (b.slamState === 'slamming') {
          b.animState = 'slam-slamming';
        } else if (b.slamState === 'recovery') {
          b.animState = 'slam-recovery';
        } else if (b.orbWindupTimer > 0) {
          b.animState = 'orb-windup';
        } else if (b.laserWarningTimer > 0) {
          b.animState = 'laser-warning';
        } else if (b.isLowerLaserActive) {
          b.animState = 'laser-active';
        } else {
          b.animState = 'idle';
        }

        // ----------------------------------------------------
        // EXECUTE HOMING CORRUPTION ORB ATTACK
        // ----------------------------------------------------
        if (b.orbWindupTimer > 0) {
          b.orbWindupTimer--;
          // Suction particles
          const orbSpawnX = b.x - 45;
          const orbSpawnY = b.y + 10;
          state.particles.push({
            x: orbSpawnX + (Math.random() - 0.5) * 50,
            y: orbSpawnY + (Math.random() - 0.5) * 50,
            vx: (orbSpawnX - (orbSpawnX + (Math.random() - 0.5) * 50)) * 0.1,
            vy: (orbSpawnY - (orbSpawnY + (Math.random() - 0.5) * 50)) * 0.1,
            life: 0,
            maxLife: 10,
            color: '#a855f7',
            size: 3.5,
          });

          if (b.orbWindupTimer === 0) {
            soundEngine.playBossAttack();
            state.corruptionOrbs.push({
              x: orbSpawnX,
              y: orbSpawnY,
              vx: -3.0,
              vy: 0,
              radius: 18,
              hp: 35,
              maxHp: 35,
              active: true,
              life: 0,
            });
            setAnnouncement('🔮 CORRUPTION ORB LAUNCHED! INTERCEPT IT WITH BULLETS!');
          }
        }

        // ----------------------------------------------------
        // EXECUTE SWEEPING LASER BEAM ACROSS 1400PX
        // ----------------------------------------------------
        if (b.laserWarningTimer > 0) {
          b.laserWarningTimer--;
          if (b.laserWarningTimer === 0) {
            b.isLowerLaserActive = true;
            b.laserSweepTimer = b.phase >= 4 ? 80 : 100;
            b.laserTargetX = b.x < 700 ? 1370 : 30;
            b.laserTargetY = 495;
            soundEngine.playBossAttack();
            setScreenShake(15);
            setAnnouncement('⚡ DANGER: SWEEPING CORRUPTION BEAM! JUMP OVER TO EVADE!');
          }
        }

        if (b.isLowerLaserActive) {
          b.laserSweepTimer--;
          const sweepDuration = b.phase >= 4 ? 80 : 100;
          const sweepProgress = 1 - b.laserSweepTimer / sweepDuration;
          const startX = b.x < 700 ? 1370 : 30;
          const endX = b.x < 700 ? 30 : 1370;
          b.laserTargetX = startX + (endX - startX) * sweepProgress;
          b.laserTargetY = 495;

          const laserOriginX = b.x + (b.laserTargetX > b.x ? 35 : -35);
          const laserOriginY = b.y + b.hoverOffset + 20;

          if (tick % 2 === 0) {
            state.particles.push({
              x: b.laserTargetX + (Math.random() - 0.5) * 16,
              y: b.laserTargetY - Math.random() * 8,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 7 - 2,
              life: 0,
              maxLife: 14,
              color: Math.random() > 0.5 ? '#ef4444' : '#fbbf24',
              size: 3.5,
            });
          }

          // Sweeping Laser Collision:
          // The hazard is the sweeping ground beam (y: 450-500)
          // Operatives can jump over the beam (p.y < 445) or stand on elevated platforms to dodge!
          const isJumpingOver = p.y < 445;
          const isAtGroundImpact = p.y >= 445 && Math.abs(p.x - b.laserTargetX) < 45;
          const distToBeamRay = distToSegment(
            p.x,
            p.y,
            laserOriginX,
            laserOriginY,
            b.laserTargetX,
            b.laserTargetY
          );

          if (!isJumpingOver && (isAtGroundImpact || distToBeamRay < 16)) {
            handlePlayerTakeDamage(25);
            for (let k = 0; k < 3; k++) {
              state.particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0,
                maxLife: 10,
                color: '#ef4444',
                size: 3,
              });
            }
          }

          if (b.laserSweepTimer <= 0) {
            b.isLowerLaserActive = false;
          }
        }
      }

      // ----------------------------------------------------
      // 3. UPDATE SHOCKWAVES & CORRUPTION ORBS
      // ----------------------------------------------------
      for (let i = state.shockwaves.length - 1; i >= 0; i--) {
        const sw = state.shockwaves[i];
        sw.x += sw.vx;
        sw.traversed += Math.abs(sw.vx);

        if (sw.traversed >= sw.maxDist || sw.x < -40 || sw.x > canvas.width + 40) {
          state.shockwaves.splice(i, 1);
          continue;
        }

        // Damage player if player is on or near the ground floor
        if (p.y > 440 && Math.abs(p.x - sw.x) < sw.radius && !isDead) {
          handlePlayerTakeDamage(30);
          soundEngine.playExplosion();
          setScreenShake(15);
        }
      }

      for (let i = state.corruptionOrbs.length - 1; i >= 0; i--) {
        const orb = state.corruptionOrbs[i];
        orb.life++;

        // Homing track toward player
        const angle = Math.atan2(p.y - orb.y, p.x - orb.x);
        orb.vx += Math.cos(angle) * 0.12;
        orb.vy += Math.sin(angle) * 0.12;
        const currentSpeed = Math.hypot(orb.vx, orb.vy);
        if (currentSpeed > 3.4) {
          orb.vx = (orb.vx / currentSpeed) * 3.4;
          orb.vy = (orb.vy / currentSpeed) * 3.4;
        }
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Player collision
        if (Math.hypot(p.x - orb.x, p.y - orb.y) < orb.radius + 18 && !isDead) {
          handlePlayerTakeDamage(35);
          soundEngine.playExplosion();
          setScreenShake(18);
          state.corruptionOrbs.splice(i, 1);
          continue;
        }

        // Timeout explosion
        if (orb.life > 360) {
          state.corruptionOrbs.splice(i, 1);
          continue;
        }
      }

      // ----------------------------------------------------
      // UPDATE SLASH WAVES (Cyber Sword Strike follow-up crescent projectile)
      // ----------------------------------------------------
      for (let i = state.slashWaves.length - 1; i >= 0; i--) {
        const sw = state.slashWaves[i];
        // Record trail before moving
        sw.trailPoints.unshift({ x: sw.x, y: sw.y });
        if (sw.trailPoints.length > 9) sw.trailPoints.pop();
        sw.x += sw.vx;
        sw.y += sw.vy;
        sw.vy += 0.05; // gentle arc gravity
        sw.life++;

        // AABB player collision (passes through platforms)
        if (
          !isDead &&
          p.x + p.width / 2 > sw.x - sw.width / 2 &&
          p.x - p.width / 2 < sw.x + sw.width / 2 &&
          p.y + p.height / 2 > sw.y - sw.height / 2 &&
          p.y - p.height / 2 < sw.y + sw.height / 2
        ) {
          handlePlayerTakeDamage(sw.damage);
          setScreenShake(16);
          setAnnouncement('💀 SLASH WAVE IMPACT! Dodge BOTH layers — melee AND the crescent!');
          // Slash impact sparks
          for (let sk = 0; sk < 12; sk++) {
            const a = (Math.PI * 2 * sk) / 12;
            state.particles.push({
              x: sw.x, y: sw.y,
              vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 - 2,
              life: 0, maxLife: 12,
              color: Math.random() > 0.5 ? '#ef4444' : '#06b6d4',
              size: 4,
            });
          }
          state.slashWaves.splice(i, 1);
          continue;
        }

        if (sw.life >= sw.maxLife || sw.x < -100 || sw.x > canvas.width + 100) {
          state.slashWaves.splice(i, 1);
          continue;
        }
      }

      // ----------------------------------------------------
      // 4. UPDATE LIGHTNING HAZARDS & DRONES
      // ----------------------------------------------------
      for (let i = state.lightningStrikes.length - 1; i >= 0; i--) {
        const ls = state.lightningStrikes[i];
        if (!ls.struck) {
          ls.warningTimer--;
          if (ls.warningTimer <= 0) {
            ls.struck = true;
            soundEngine.playShortCircuitExplosion();
            setScreenShake(20);
            if (Math.abs(p.x - ls.x) < 28) {
              handlePlayerTakeDamage(45);
            }
          }
        } else {
          ls.strikeTimer--;
          if (ls.strikeTimer <= 0) {
            state.lightningStrikes.splice(i, 1);
          }
        }
      }

      for (let i = state.drones.length - 1; i >= 0; i--) {
        const d = state.drones[i];
        const angle = Math.atan2(p.y - d.y, p.x - d.x);
        d.vx = Math.cos(angle) * 3.5;
        d.vy = Math.sin(angle) * 3.5;
        d.x += d.vx;
        d.y += d.vy;

        const distToPlayer = Math.hypot(p.x - d.x, p.y - d.y);
        if (distToPlayer < 24) {
          handlePlayerTakeDamage(35);
          soundEngine.playExplosion();
          d.active = false;
          state.drones.splice(i, 1);
        }
      }

      // ----------------------------------------------------
      // 5. UPDATE PROJECTILES & BULLET COLLISIONS
      // ----------------------------------------------------
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const proj = state.projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;

        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
          state.projectiles.splice(i, 1);
          continue;
        }

        if (proj.isHero) {
          // Check bullet hits Corruption Orbs
          let orbHit = false;
          for (let oi = state.corruptionOrbs.length - 1; oi >= 0; oi--) {
            const orb = state.corruptionOrbs[oi];
            if (Math.hypot(proj.x - orb.x, proj.y - orb.y) < orb.radius + proj.radius) {
              orb.hp -= proj.damage;
              orbHit = true;
              state.projectiles.splice(i, 1);

              if (orb.hp <= 0) {
                soundEngine.playExplosion();
                setAnnouncement('🎯 CORRUPTION ORB INTERCEPTED & DESTROYED!');
                for (let op = 0; op < 20; op++) {
                  const angle = (Math.PI * 2 * op) / 20;
                  state.particles.push({
                    x: orb.x,
                    y: orb.y,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    life: 0,
                    maxLife: 20,
                    color: '#c084fc',
                    size: 4,
                  });
                }
                state.corruptionOrbs.splice(oi, 1);
              }
              break;
            }
          }
          if (orbHit) continue;

          // Hero Bullet hits NuLL Boss
          const bossCenterY = b.y + b.hoverOffset;
          const distToBoss = Math.hypot(b.x - proj.x, bossCenterY - proj.y);

          if (distToBoss < b.width / 2 && !isVictory) {
            b.hp = Math.max(0, b.hp - proj.damage);
            setBossHp(b.hp);

            // ENHANCEMENT 6: White hit-flash & Recoil
            b.hitFlashTimer = 4;
            b.recoilX = 6;
            state.projectiles.splice(i, 1);

            // Hit spark particles
            for (let s = 0; s < 4; s++) {
              state.particles.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0,
                maxLife: 10,
                color: '#ef4444',
                size: 3.5,
              });
            }

            // Boss Defeat Victory Sequence
            if (b.hp <= 0 && !isVictory && b.deathTimer < 0) {
              b.deathTimer = 0; // Begin 120-frame death sequence
              b.animState = 'death';
              soundEngine.playExplosion();
              setScreenShake(40);
              setAnnouncement('💀 NuLL CORE BREACHED — CRITICAL MELTDOWN SEQUENCE INITIATED...');
            }
            continue;
          }

          // Hero Bullet hits Trapped Data Shard
          for (const shard of state.dataShards) {
            if (!shard.isRescued && Math.hypot(shard.x - proj.x, shard.y - proj.y) < 22) {
              shard.hp -= proj.damage;
              state.projectiles.splice(i, 1);

              if (shard.hp <= 0) {
                shard.isRescued = true;
                soundEngine.playSuccess();
                soundEngine.playItemPickup();
                const healAmount = b.phase >= 3 ? 35 : 50;
                setPlayerHp((hp) => Math.min(100, hp + healAmount));
                setCurrentBroIdx((idx) => (idx + 1) % BRO_ROSTER.length);
                setAnnouncement(`💎 TRAPPED DATA SHARD FREED! +${healAmount} HP RECOVERED!`);
              }
              break;
            }
          }

          // Hero Bullet hits Logic Bomb Cache
          for (const bomb of state.logicBombs) {
            if (!bomb.isExploded && Math.hypot(bomb.x - proj.x, bomb.y - proj.y) < 20) {
              bomb.hp -= proj.damage;
              state.projectiles.splice(i, 1);

              if (bomb.hp <= 0) {
                bomb.isExploded = true;
                soundEngine.playExplosion();
                setScreenShake(25);

                b.hp = Math.max(0, b.hp - 750);
                setBossHp(b.hp);
                setAnnouncement('💥 LOGIC BOMB DETONATED! 750 CRITICAL DAMAGE DEALT!');

                if (b.hp <= 0 && b.deathTimer < 0 && !isVictoryRef.current) {
                  b.deathTimer = 0;
                  b.animState = 'death';
                  soundEngine.playExplosion();
                  setScreenShake(40);
                  setAnnouncement('💀 NuLL CORE BREACHED — CRITICAL MELTDOWN SEQUENCE INITIATED...');
                  b.isLowerLaserActive = false;
                  b.slamState = 'idle';
                  b.swordState = 'idle';
                  b.orbWindupTimer = 0;
                  b.clones = [];
                  state.drones = [];
                  state.corruptionOrbs = [];
                  state.slashWaves = [];
                  state.lightningStrikes = [];
                  state.projectiles = state.projectiles.filter((p) => p.isHero);
                }

                for (let exp = 0; exp < 40; exp++) {
                  const angle = (Math.PI * 2 * exp) / 40;
                  state.particles.push({
                    x: bomb.x,
                    y: bomb.y,
                    vx: Math.cos(angle) * (6 + Math.random() * 8),
                    vy: Math.sin(angle) * (6 + Math.random() * 8),
                    life: 0,
                    maxLife: 30,
                    color: '#ef4444',
                    size: 6,
                  });
                }
              }
              break;
            }
          }
        } else {
          // Boss Bullet hits Player
          const distToPlayer = Math.hypot(p.x - proj.x, p.y - proj.y);
          if (distToPlayer < p.width / 2 && !isDead) {
            handlePlayerTakeDamage(proj.damage);
            state.projectiles.splice(i, 1);
          }
        }
      }

      // ----------------------------------------------------
      // 6. UPDATE HELICOPTER & PARTICLES
      // ----------------------------------------------------
      if (state.helicopter.active) {
        const heli = state.helicopter;
        if (heli.x < 700) {
          heli.x += 4.5;
        } else {
          p.x = heli.x;
          p.y = heli.y + heli.ropeLength;
          heli.y -= 1.8;

          if (heli.y < -50 && !heli.escaped) {
            heli.escaped = true;
            setIsExtractionComplete(true);
            confetti({ particleCount: 220, spread: 110 });
          }
        }
      }
    };

    const renderScene = () => {
      const state = gameStateRef.current;
      const p = state.player;
      const b = state.boss;

      ctx.save();

      // Screen shake
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        setScreenShake((s) => Math.max(0, s - 1));
      }

      // ENHANCEMENT 3: Arena Degradation Palette (Intact: Navy/Cyan, Cracked: Amber Caution, Critical: Crimson Meltdown)
      const bgColor = b.damageState === 'critical' ? '#140306' : b.damageState === 'cracked' ? '#0f0a04' : '#040711';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Server Towers
      for (let tx = 20; tx < canvas.width; tx += 90) {
        ctx.fillStyle = b.damageState === 'critical' ? '#18040a' : b.damageState === 'cracked' ? '#140d06' : '#080d1a';
        ctx.fillRect(tx, 40, 60, canvas.height - 40);
        ctx.strokeStyle = b.damageState === 'critical' ? '#ef444433' : b.damageState === 'cracked' ? '#f59e0b33' : '#0f172a';
        ctx.strokeRect(tx, 40, 60, canvas.height - 40);

        // Blinking tower LEDs
        for (let row = 0; row < 10; row++) {
          const isL = Math.sin(tick * 0.08 + row + tx) > 0;
          let ledColor = '#1e293b';
          if (isL) {
            ledColor = b.damageState === 'critical' ? '#ef4444' : b.damageState === 'cracked' ? '#f59e0b' : '#06b6d4';
          }
          ctx.fillStyle = ledColor;
          ctx.fillRect(tx + 8, 60 + row * 45, 4, 4);
          ctx.fillRect(tx + 18, 60 + row * 45, 4, 4);
        }
      }

      // Scanline Glitch Grid if Cracked or Critical
      if (b.damageState !== 'intact') {
        ctx.strokeStyle = b.damageState === 'critical' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.06)';
        ctx.lineWidth = 1;
        for (let gy = 0; gy < canvas.height; gy += 6) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(canvas.width, gy);
          ctx.stroke();
        }
      }

      // Drifting Background Data Glyphs
      ctx.font = '10px monospace';
      for (const g of state.bgGlyphs) {
        g.y += g.speed;
        if (g.y > canvas.height) g.y = 0;
        const glyphColor = b.damageState === 'critical' ? `rgba(239, 68, 68, ${g.opacity})` : b.damageState === 'cracked' ? `rgba(245, 158, 11, ${g.opacity})` : `rgba(6, 182, 212, ${g.opacity})`;
        ctx.fillStyle = glyphColor;
        ctx.fillText(g.char, g.x, g.y);
      }

      // Hanging Cable Conduits across 1400px width
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.bezierCurveTo(350, 100, 1050, 100, 1400, 30);
      ctx.stroke();

      // Sweeping Laser Aim Telegraph Decal
      if (b.laserWarningTimer > 0) {
        const laserOriginX = b.x + (b.laserTargetX > b.x ? 35 : -35);
        const laserOriginY = b.y + b.hoverOffset + 20;
        const blinkAlpha = (Math.sin(tick * 0.4) * 0.5 + 0.5) * 0.4 + 0.2;

        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${blinkAlpha + 0.3})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(laserOriginX, laserOriginY);
        ctx.lineTo(b.laserTargetX, 495);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.fillStyle = `rgba(239, 68, 68, ${blinkAlpha})`;
        ctx.fillRect(0, 480, canvas.width, 24);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 480, canvas.width, 24);

        ctx.font = 'black 10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ WARNING: SWEEPING LASER CHARGING • JUMP OVER BEAM TO DODGE! ⚠️', canvas.width / 2, 496);
      }

      // Cyber Sword Strike Telegraph — Red danger semicircle at boss melee range
      if (b.swordState === 'windup') {
        const windupTotal = b.phase >= 4 ? 28 : 40;
        const chargeRatio = 1 - b.swordTimer / windupTotal;
        const blinkAlpha = (Math.sin(tick * 0.55) * 0.5 + 0.5) * 0.45 + 0.25;
        ctx.save();
        // Filled danger zone semi-arc
        ctx.fillStyle = `rgba(239, 68, 68, ${blinkAlpha * 0.35 + chargeRatio * 0.2})`;
        ctx.strokeStyle = `rgba(239, 68, 68, ${blinkAlpha + 0.2})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        const bossDrawX = b.x + b.recoilX;
        const bossDrawY = b.y + b.hoverOffset;
        const startAng = b.swordFacingRight ? -Math.PI * 0.5 : Math.PI * 0.5;
        const endAng = b.swordFacingRight ? Math.PI * 0.5 : Math.PI * 1.5;
        ctx.moveTo(bossDrawX, bossDrawY);
        ctx.arc(bossDrawX, bossDrawY, 135, startAng, endAng);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        // Warning label
        const lblX = bossDrawX + (b.swordFacingRight ? 80 : -80);
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ BLADE RANGE', lblX, bossDrawY + 20);
        ctx.restore();
      }

      // Lightning Warning Columns
      for (const ls of state.lightningStrikes) {
        if (!ls.struck) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(ls.x - 16, 0, 32, canvas.height);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(ls.x - 16, 0, 32, canvas.height);

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('▼ ORBITAL HAZARD ▼', ls.x, 30);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 35;
          ctx.fillRect(ls.x - 12, 0, 24, canvas.height);
          ctx.shadowBlur = 0;
        }
      }

      // Platforms (with Collapsed Platform debris handling)
      for (const plat of state.platforms) {
        if (plat.collapsed) {
          // Draw fallen wreckage on floor
          ctx.fillStyle = '#1e1b18';
          ctx.fillRect(plat.x, 488, plat.width, 10);
          ctx.strokeStyle = '#ef444466';
          ctx.strokeRect(plat.x, 488, plat.width, 10);
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('⚠️ COLLAPSED SECTOR DEBRIS', plat.x + 10, 496);
          continue;
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.strokeStyle = b.phase >= 4 ? '#ef444488' : '#06b6d466';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

        if (plat.type === 'firewall') {
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(plat.x, plat.y, plat.width, 3);
          ctx.strokeStyle = '#06b6d433';
          for (let hx = plat.x; hx < plat.x + plat.width; hx += 16) {
            ctx.strokeRect(hx, plat.y + 3, 14, plat.height - 6);
          }
        } else if (plat.type === 'glitch') {
          ctx.fillStyle = tick % 8 < 4 ? '#f43f5e' : '#38bdf8';
          ctx.fillRect(plat.x, plat.y, plat.width, 3);
        } else if (plat.type === 'server') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(plat.x, plat.y, plat.width, 3);
        } else if (plat.type === 'cipher') {
          ctx.fillStyle = '#818cf8';
          ctx.fillRect(plat.x, plat.y, plat.width, 3);
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(plat.x, plat.y, plat.width, 3);
        }
      }

      // Draw Ground Shockwaves (Expanding Plasma Arcs)
      for (const sw of state.shockwaves) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, Math.PI, 0); // Arc along ground
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ SHOCKWAVE ⚡', sw.x, sw.y - sw.radius - 4);
        ctx.restore();
      }

      // Draw Homing Corruption Orbs
      for (const orb of state.corruptionOrbs) {
        ctx.save();
        ctx.translate(orb.x, orb.y);

        // Pulsing dark purple halo
        const pulseR = orb.radius + Math.sin(tick * 0.3) * 3;
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, pulseR);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#c084fc');
        grad.addColorStop(0.8, '#581c87');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.fill();

        // Orb Mini HP Bar
        ctx.fillStyle = '#000000';
        ctx.fillRect(-16, -orb.radius - 12, 32, 5);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(-15, -orb.radius - 11, (30 * orb.hp) / orb.maxHp, 3);

        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`ORB [${orb.hp}HP]`, 0, -orb.radius - 15);
        ctx.restore();
      }

      // Draw Trapped Data Shards
      for (const shard of state.dataShards) {
        if (!shard.isRescued) {
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(shard.x, shard.y - shard.height / 2);
          ctx.lineTo(shard.x + shard.width / 2, shard.y);
          ctx.lineTo(shard.x, shard.y + shard.height / 2);
          ctx.lineTo(shard.x - shard.width / 2, shard.y);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(shard.x - shard.width / 2 - 2, shard.y - shard.height / 2 - 2, shard.width + 4, shard.height + 4);

          ctx.fillStyle = '#000000';
          ctx.fillRect(shard.x - 20, shard.y - shard.height / 2 - 14, 40, 6);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(shard.x - 19, shard.y - shard.height / 2 - 13, (38 * shard.hp) / 40, 4);

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText('FREE SHARD (+HP HEAL)', shard.x, shard.y - shard.height / 2 - 17);
        }
      }

      // Draw Logic Bomb Caches
      for (const bomb of state.logicBombs) {
        if (!bomb.isExploded) {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(bomb.x - bomb.width / 2, bomb.y - bomb.height / 2, bomb.width, bomb.height);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(bomb.x - bomb.width / 2, bomb.y - bomb.height / 2, bomb.width, bomb.height);

          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💣', bomb.x, bomb.y + 4);

          ctx.fillStyle = '#000000';
          ctx.fillRect(bomb.x - 16, bomb.y - bomb.height / 2 - 10, 32, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bomb.x - 15, bomb.y - bomb.height / 2 - 9, (30 * bomb.hp) / 25, 3);
        }
      }

      // Draw Kamikaze Drones
      for (const d of state.drones) {
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Phantom Clone Swarms (Phase 3)
      for (const clone of b.clones) {
        ctx.save();
        ctx.translate(clone.x, clone.y);
        ctx.globalAlpha = 0.45;

        if (nullBossImgRef.current && nullBossImgRef.current.complete) {
          ctx.drawImage(nullBossImgRef.current, -b.width * 0.35, -b.height * 0.35, b.width * 0.7, b.height * 0.7);
        }
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#f43f5e';
        ctx.textAlign = 'center';
        ctx.fillText('[DECOY PHANTOM]', 0, -b.height * 0.35 - 5);
        ctx.restore();
      }

      // ENHANCEMENT 1 & 6: Draw NuLL AI Boss Titan with 3 Visual Damage States & Hit Flash/Recoil
      if (!isVictory) {
        const bossY = b.y + b.hoverOffset;
        ctx.save();
        ctx.translate(b.x + b.recoilX, bossY);

        // Wind-up Tell 1: Ground-Slam Warning Rings
        if (b.slamState === 'windup') {
          const ringR = 40 + (48 - b.slamTimer) * 1.8;
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Wind-up Tell 2: Corruption Orb Vortex Suction
        if (b.orbWindupTimer > 0) {
          ctx.save();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(-45, 10, b.orbWindupTimer * 0.6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Idle breathing pulse (subtle scale only when truly idle)
        if (b.animState === 'idle') {
          const breathScale = 1 + Math.sin(tick * 0.07) * 0.022;
          ctx.scale(breathScale, breathScale);
        }

        // Sword Windup Tell: raised glowing blade arm + charge orb at tip
        if (b.swordState === 'windup') {
          ctx.save();
          const windupTotal = b.phase >= 4 ? 28 : 40;
          const chargeRatio = 1 - b.swordTimer / windupTotal;
          const armDir = b.swordFacingRight ? 1 : -1;
          const tipX = armDir * 65;
          const tipY = -55 - chargeRatio * 28;
          // Blade arm line
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.55 + chargeRatio * 0.45})`;
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 14 + chargeRatio * 22;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(armDir * 35, tipY + 18);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
          // Charge glow at blade tip
          const glowR = 8 + chargeRatio * 16;
          const cGrad = ctx.createRadialGradient(tipX, tipY, 2, tipX, tipY, glowR);
          cGrad.addColorStop(0, '#ffffff');
          cGrad.addColorStop(0.4, '#ef4444');
          cGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = cGrad;
          ctx.beginPath();
          ctx.arc(tipX, tipY, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Sword Swing Tell: glowing arc flash across the strike direction
        if (b.swordState === 'swing' || b.swordState === 'lunge') {
          ctx.save();
          const swingDir = b.swordFacingRight ? 1 : -1;
          const swingAlpha = b.swordState === 'swing' ? 0.95 : 0.5;
          ctx.strokeStyle = `rgba(239, 68, 68, ${swingAlpha})`;
          ctx.lineWidth = 7;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 28;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, 95, swingDir * Math.PI * 0.85, swingDir * -0.05, !b.swordFacingRight);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255, 255, 255, 0.55)`;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, 88, swingDir * Math.PI * 0.75, swingDir * -0.1, !b.swordFacingRight);
          ctx.stroke();
          ctx.restore();
        }

        // Aura based on 3 damage states
        ctx.fillStyle = b.damageState === 'critical' ? 'rgba(239, 68, 68, 0.65)' : b.damageState === 'cracked' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.width * 0.7, b.height * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // White Hit-Flash Feedback
        if (b.hitFlashTimer > 0) {
          ctx.filter = 'brightness(350%) drop-shadow(0 0 25px #ffffff)';
        } else if (b.damageState === 'critical') {
          // Near-death glitch flicker
          const glitchJitter = tick % 4 < 2 ? 'hue-rotate(340deg) contrast(170%) brightness(1.3)' : 'contrast(190%) drop-shadow(0 0 35px #ef4444)';
          ctx.filter = glitchJitter;
        } else if (b.damageState === 'cracked') {
          ctx.filter = 'contrast(135%) brightness(1.1) hue-rotate(-15deg)';
        }

        if (nullBossImgRef.current && nullBossImgRef.current.complete) {
          ctx.drawImage(
            nullBossImgRef.current,
            -b.width / 2,
            -b.height / 2,
            b.width,
            b.height
          );
        }
        ctx.filter = 'none';

        // ENHANCEMENT 1: Visual Damage Overlays
        if (b.damageState === 'cracked') {
          // Visible fissure crack lines
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-25, -35);
          ctx.lineTo(8, -5);
          ctx.lineTo(-12, 35);
          ctx.moveTo(15, -20);
          ctx.lineTo(35, 10);
          ctx.stroke();

          // Leaking glitch particles
          if (tick % 6 === 0) {
            state.particles.push({
              x: b.x + (Math.random() - 0.5) * 40,
              y: bossY + (Math.random() - 0.5) * 40,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 3 - 1,
              life: 0,
              maxLife: 20,
              color: '#f59e0b',
              size: 3,
            });
          }
        } else if (b.damageState === 'critical') {
          // Critical Core Exposed Glowing Ring
          ctx.save();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(0, 10, 22 + Math.sin(tick * 0.2) * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fill();

          // Heavy fissure cracks
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-40, -45);
          ctx.lineTo(0, 10);
          ctx.lineTo(-20, 55);
          ctx.moveTo(35, -40);
          ctx.lineTo(0, 10);
          ctx.lineTo(40, 45);
          ctx.stroke();
          ctx.restore();

          // Critical fire/sparks leakage
          if (tick % 3 === 0) {
            state.particles.push({
              x: b.x + (Math.random() - 0.5) * 50,
              y: bossY + (Math.random() - 0.5) * 50,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 5 - 2,
              life: 0,
              maxLife: 22,
              color: '#ef4444',
              size: 4,
            });
          }
        }

        // Vulnerable Window indicator (sword OR slam recovery)
        if (b.swordState === 'recovery' || b.slamState === 'recovery') {
          ctx.save();
          const vulnAlpha = Math.sin(tick * 0.28) * 0.38 + 0.62;
          ctx.strokeStyle = `rgba(34, 197, 94, ${vulnAlpha})`;
          ctx.fillStyle = `rgba(34, 197, 94, ${vulnAlpha * 0.22})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.ellipse(0, 0, b.width * 0.56, b.height * 0.52, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#22c55e';
          ctx.textAlign = 'center';
          ctx.fillText('▼ VULNERABLE ▼', 0, -b.height / 2 - 38);
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        // Phase Transition flash beat
        if (b.phaseTransitionTimer > 0) {
          ctx.save();
          const flashAlpha = b.phaseTransitionTimer / 40;
          ctx.fillStyle = `rgba(255, 110, 20, ${flashAlpha * 0.55})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, b.width * 0.8, b.height * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          const fSize = 13 + (1 - flashAlpha) * 8;
          ctx.font = `bold ${fSize}px monospace`;
          ctx.fillStyle = `rgba(255, 220, 50, ${flashAlpha})`;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 18;
          ctx.fillText(`PHASE ${b.phase} ENGAGED`, 0, -b.height / 2 - 44);
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        // Death sequence: scale-explode + fade
        if (b.deathTimer >= 0) {
          ctx.save();
          const deathRatio = Math.min(1, b.deathTimer / 120);
          ctx.globalAlpha = Math.max(0, 1 - deathRatio * 1.4);
          ctx.scale(1 + deathRatio * 2.2, 1 + deathRatio * 2.2);
          const dGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 130);
          dGrad.addColorStop(0, `rgba(255,255,255,${1 - deathRatio})`);
          dGrad.addColorStop(0.4, `rgba(239,68,68,${0.85 - deathRatio * 0.85})`);
          dGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = dGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 130, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Boss Head Health Bar
        ctx.fillStyle = '#000000';
        ctx.fillRect(-70, -b.height / 2 - 25, 140, 11);
        ctx.fillStyle = b.damageState === 'critical' ? '#ef4444' : b.damageState === 'cracked' ? '#f97316' : '#06b6d4';
        ctx.fillRect(-68, -b.height / 2 - 23, (136 * b.hp) / maxBossHp, 7);

        ctx.restore();
      }

      // Draw Sweeping Data Stream Laser Beam
      if (b.isLowerLaserActive && !isVictory && b.deathTimer < 0) {
        const laserOriginX = b.x - 40;
        const laserOriginY = b.y + b.hoverOffset + 20;
        const targetX = b.laserTargetX || 25;
        const targetY = b.laserTargetY || 495;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 22;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.moveTo(laserOriginX, laserOriginY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(laserOriginX, laserOriginY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const impactGlow = ctx.createRadialGradient(targetX, targetY, 2, targetX, targetY, 30);
        impactGlow.addColorStop(0, '#ffffff');
        impactGlow.addColorStop(0.4, '#ef4444');
        impactGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = impactGlow;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Slash Waves (crescent energy projectiles from Cyber Sword Strike)
      if (!isVictory && b.deathTimer < 0) {
        for (const sw of state.slashWaves) {
        ctx.save();
        const lifeRatio = sw.life / sw.maxLife;
        const alpha = Math.max(0, 1 - lifeRatio * 1.15);
        const dir = sw.facingRight ? 1 : -1;

        // Blade trail (fade from newest to oldest)
        for (let ti = 0; ti < sw.trailPoints.length; ti++) {
          const tp = sw.trailPoints[ti];
          const trailA = ((sw.trailPoints.length - ti) / sw.trailPoints.length) * alpha * 0.55;
          ctx.strokeStyle = `rgba(239, 68, 68, ${trailA})`;
          ctx.lineWidth = Math.max(1, 4.5 - ti * 0.45);
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, 20 - ti * 1.2, dir * Math.PI * 0.28, dir * Math.PI * 1.72, !sw.facingRight);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Main crescent — outer red
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, 26, dir * Math.PI * 0.22, dir * Math.PI * 1.78, !sw.facingRight);
        ctx.stroke();

        // Inner crescent — cyan core
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.85})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, 17, dir * Math.PI * 0.32, dir * Math.PI * 1.68, !sw.facingRight);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

      // Draw Warrior Hero Avatar
      if (!state.helicopter.escaped && !isDead && (p.invulnerableTimer % 6 < 3)) {
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.invulnerableTimer > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, p.height / 2 + 2, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!p.facingRight) ctx.scale(-1, 1);

        if (warriorImgRef.current && warriorImgRef.current.complete && warriorImgRef.current.naturalWidth > 0) {
          ctx.drawImage(
            warriorImgRef.current,
            -p.width / 2,
            -p.height / 2,
            p.width,
            p.height
          );
        } else {
          ctx.fillStyle = currentBro.color;
          ctx.fillRect(-12, -18, 24, 28);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-10, -14, 20, 18);
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(-9, -32, 18, 14);
          ctx.fillStyle = currentBro.bulletColor;
          ctx.fillRect(-10, -34, 20, 5);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(p.facingRight ? 1 : -7, -26, 6, 3);
          ctx.fillStyle = '#020617';
          ctx.fillRect(-10, 10, 8, 14);
          ctx.fillRect(2, 10, 8, 14);
        }

        ctx.restore();
      }

      // Draw Projectiles
      for (const proj of state.projectiles) {
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        if (pt.life >= pt.maxLife) {
          state.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1 - pt.life / pt.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Extraction Helicopter
      if (state.helicopter.active) {
        const heli = state.helicopter;
        ctx.save();
        ctx.translate(heli.x, heli.y);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(Math.sin(tick * 0.8) * 50 - 50, -25, 100, 4);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-45, -20, 90, 40, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(10, -14, 25, 20);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, heli.ropeLength);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    const gameLoop = (time: number) => {
      const now = time || performance.now();
      let frameTime = (now - lastTime) / 1000;
      lastTime = now;
      if (frameTime > MAX_ACCUMULATOR) frameTime = MAX_ACCUMULATOR;
      accumulator += frameTime;

      while (accumulator >= FIXED_TIME_STEP) {
        updateSimulation();
        accumulator -= FIXED_TIME_STEP;
      }

      renderScene();
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [currentBro]);

  return (
    <div className="flex flex-col items-center select-none font-mono">
      {/* Top HUD Stats Panel */}
      <div className="w-full max-w-4xl bg-[#080d1a] border-2 border-red-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_0_60px_rgba(239,68,68,0.25)] mb-3">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3 mb-3">
          {/* Active Cyber Warrior Badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-2xl shadow-inner relative overflow-hidden">
              <img
                src="/assets/hero_avatar.png"
                alt="Warrior"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <span>WARRIOR:</span>
                <span className="text-white bg-cyan-600/40 px-2 py-0.5 rounded">{currentBro.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* Continuous Player HP Bar */}
                <div className="w-32 sm:w-44 h-3 bg-black/80 rounded-full border border-red-500/40 overflow-hidden p-0.5 flex items-center">
                  <motion.div
                    className={`h-full rounded-full transition-all duration-200 ${
                      playerHp > 50
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                        : playerHp > 25
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                    }`}
                    style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  {playerHp} / 100 HP
                </span>
              </div>
            </div>
          </div>

          {/* Trophies / Score & Special Ammo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 bg-[#140d05] px-3 py-1.5 rounded-xl border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span className="text-xs font-black text-amber-300">{teamScore} 🏆</span>
            </div>

            {/* Single-Use Special Ability (1x Only) */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              specialsRemaining > 0
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-black/60 border-gray-700 text-gray-500 opacity-60'
            }`}>
              <Zap className={`w-4 h-4 ${specialsRemaining > 0 ? 'text-amber-400 animate-pulse' : 'text-gray-500'}`} />
              <span className="text-xs font-black">
                {specialsRemaining > 0 ? 'SPECIAL (1x ONLY): 1/1 READY [Q/X]' : 'SPECIAL: EXHAUSTED (0/1)'}
              </span>
            </div>

            {onReplaySummoning && (
              <button
                onClick={onReplaySummoning}
                title="Replay NuLL Awakening Cinematic"
                className="flex items-center gap-1 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
              >
                <span>🎬 REPLAY</span>
              </button>
            )}
          </div>
        </div>

        {/* NuLL AI Overlord Boss HP Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-black">
            <span className="text-red-400 flex items-center gap-1.5">
              <img
                src="/assets/null_king_boss.png"
                alt="NuLL"
                className="w-5 h-5 object-contain inline-block rounded"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <Skull className="w-4 h-4 text-red-500 animate-pulse" />
              ROGUE AI NuLL TITAN OVERLORD
            </span>
            <span className="text-white font-mono">{bossHp} / {maxBossHp} HP</span>
          </div>
          <div className="w-full h-4 bg-black/80 rounded-full border border-red-500/40 overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full"
              style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* ENHANCEMENT 5: 7 Escape Room Items Synergy & Phase Indicator */}
        <div className="mt-3 bg-[#040814] border border-cyan-500/30 rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
              VAULT ITEM SYNERGY:
            </span>
            <div className="flex items-center gap-1.5">
              {ESCAPE_ITEMS.map((item) => {
                const isPhaseActive = item.phase === bossPhase;
                return (
                  <div
                    key={item.id}
                    title={`${item.name} (${item.desc}) - Empowers Special in Phase ${item.phase}`}
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs transition-all ${
                      isPhaseActive
                        ? 'bg-gradient-to-br from-amber-500/30 to-cyan-500/30 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-110 animate-pulse'
                        : 'bg-black/50 border-white/10 opacity-35 grayscale'
                    }`}
                  >
                    <span>{item.icon}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
            <span>PHASE {bossPhase} ACTIVE:</span>
            <span className="text-cyan-300 underline font-mono">
              {bossPhase === 1 && '📜 Access Credentials & 🧱 Firewall Rules'}
              {bossPhase === 2 && '🛡️ Firewall Patch (Laser Hex Mirror)'}
              {bossPhase === 3 && '⚙️ Clean API Call (Decoy Purge)'}
              {bossPhase === 4 && '🔑 Cipher Key (Core Shatter)'}
              {bossPhase === 5 && '🔋 Power Surge & 🗺️ Forensic Trace Map (EMP Overload)'}
            </span>
          </div>
        </div>

        {/* Dynamic Action Announcement Banner */}
        <div className="mt-2.5 bg-[#13070b] border border-red-500/30 rounded-xl px-4 py-2 text-center text-xs font-black text-amber-300 tracking-wider">
          {announcement}
        </div>
      </div>

      {/* Main 60 FPS Broforce Canvas Viewport */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-red-500/40 shadow-[0_0_80px_rgba(239,68,68,0.3)] bg-black w-full max-w-[1600px] aspect-[7/3]">
        <canvas
          ref={canvasRef}
          width={1400}
          height={600}
          className="w-full h-full block object-contain cursor-crosshair"
          onMouseDown={() => {
            gameStateRef.current.keys.shoot = true;
          }}
          onMouseUp={() => {
            gameStateRef.current.keys.shoot = false;
          }}
        />

        {/* Casualty / Death Screen Modal with -50 Trophies Respawn Penalty */}
        <AnimatePresence>
          {isDead && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 space-y-5"
            >
              <div className="w-20 h-20 rounded-3xl bg-red-950/80 border-2 border-red-500 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.7)] animate-pulse">
                <Skull className="w-10 h-10 text-red-500" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-red-500 font-black">
                  [TACTICAL COMBAT CASUALTY]
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  OPERATIVE NEUTRALIZED
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mt-2 leading-relaxed">
                  NuLL's corruption defenses destroyed your chassis. You can reboot the cyber operative into the fight immediately, but doing so incurs an emergency respawn penalty:
                </p>
                <div className="inline-block mt-3 bg-red-950/70 border border-red-500/50 px-4 py-1.5 rounded-xl text-amber-400 font-black text-sm">
                  ⚠️ PENALTY: -50 TROPHIES 🏆
                </div>
              </div>

              <button
                onClick={handleRespawn}
                disabled={isRespawning}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black font-black text-sm tracking-wider shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isRespawning ? '⚡ REBOOTING OPERATIVE...' : '⚡ RESPAWN WARRIOR (-50 TROPHIES)'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extraction Victory Overlay (Appears ONLY after helicopter cutscene escapes) */}
        <AnimatePresence>
          {isVictory && startExtraction && isExtractionComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.7)] animate-bounce">
                <Trophy className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 tracking-wider">
                MISSION ACCOMPLISHED!
              </h2>
              <p className="text-xs sm:text-sm text-gray-200 max-w-md">
                ROGUE AI NuLL TITAN WAS TOTALLY ANNIHILATED! All sector keys secured, operative extracted safely, and the Cyber Vault is liberated!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {onReturnToHub && (
                  <button
                    onClick={onReturnToHub}
                    className="px-6 py-3.5 rounded-2xl bg-[#0e172a] hover:bg-[#1e293b] border-2 border-cyan-400 text-cyan-300 font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>RETURN TO CENTRAL HUB</span>
                  </button>
                )}
                <button
                  onClick={onViewLeaderboard}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs sm:text-sm shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>VIEW FINAL HALL OF FAME LEADERBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Cheatsheet Bar */}
      <div className="w-full max-w-4xl mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400 bg-[#080d1a] border border-cyan-500/20 px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-4">
          <span>🎮 MOVE: <strong className="text-white">A / D / ARROWS</strong></span>
          <span>⬆️ JUMP / DOUBLE JUMP: <strong className="text-white">W / SPACE</strong></span>
          <span>🔫 SHOOT: <strong className="text-white">J / Z / F / CLICK</strong></span>
          <span>💣 SPECIAL (1x ONLY): <strong className="text-amber-300">Q / X</strong></span>
        </div>
        <div className="text-cyan-400 font-bold">
          ⚡ TIP: USE YOUR 1x SPECIAL TACTICALLY IN NuLL'S TOUGHEST PHASE!
        </div>
      </div>
    </div>
  );
};
