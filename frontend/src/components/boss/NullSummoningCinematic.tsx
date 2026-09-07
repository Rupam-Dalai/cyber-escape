import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Zap, AlertTriangle, Play, FastForward, Sparkles, Flame } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface NullSummoningCinematicProps {
  onComplete: () => void;
}

export const NullSummoningCinematic: React.FC<NullSummoningCinematicProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [glitchText, setGlitchText] = useState('SYSTEM WARNING: UNAUTHORIZED ENTITY DETECTED');
  const [hpCounter, setHpCounter] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sound and sequence triggers
  useEffect(() => {
    soundEngine.playAlarm();

    const t1 = setTimeout(() => {
      setStep(2); // Vortex opening
      soundEngine.playElectricZap();
    }, 1000);

    const t2 = setTimeout(() => {
      setStep(3); // NuLL Emerging
      soundEngine.playBossRoar();
      soundEngine.playBossAttack();
    }, 2200);

    let hpInterval: any = null;
    const t3 = setTimeout(() => {
      setStep(4); // Boss Card & HP charge
      soundEngine.playEmpBurst();

      // Animate HP Bar charging to 7500
      let cur = 0;
      hpInterval = setInterval(() => {
        cur += 375;
        if (cur >= 7500) {
          cur = 7500;
          clearInterval(hpInterval);
        }
        setHpCounter(cur);
      }, 35);
    }, 3200);

    const t4 = setTimeout(() => {
      onComplete();
    }, 7500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (hpInterval) clearInterval(hpInterval);
    };
  }, []);

  // Keyboard shortcut to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  // Canvas particle vortex loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;
    const particles: { x: number; y: number; angle: number; dist: number; speed: number; size: number; color: string }[] = [];

    // Initialize swirling singularity particles
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        angle: Math.random() * Math.PI * 2,
        dist: 50 + Math.random() * 320,
        speed: 0.04 + Math.random() * 0.06,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ef4444' : '#06b6d4',
      });
    }

    const render = () => {
      tick++;
      ctx.fillStyle = 'rgba(4, 6, 14, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Swirling Vortex
      for (const p of particles) {
        p.angle += p.speed;
        p.dist -= 1.2;
        if (p.dist < 10) {
          p.dist = 280 + Math.random() * 60;
        }

        const px = cx + Math.cos(p.angle) * p.dist;
        const py = cy + Math.sin(p.angle) * p.dist * 0.7;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Singularity Core Glow
      ctx.fillStyle = step >= 3 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, 70 + Math.sin(tick * 0.1) * 15, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 bg-[#04060c] flex flex-col items-center justify-center font-mono select-none overflow-hidden">
      {/* Background Particle Vortex Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={750}
        className="absolute inset-0 w-full h-full object-cover opacity-85"
      />

      {/* Red Alert Strobes & Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(239,68,68,0.15)_100%)] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      {/* Header Warning Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-6 left-6 right-6 flex items-center justify-between bg-red-950/70 border border-red-500/50 backdrop-blur-md px-6 py-3 rounded-2xl z-20"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
          <span className="text-xs sm:text-sm font-black text-red-400 tracking-widest uppercase">
            [CRITICAL LEVEL 8 EVENT: AIRLOCK ANOMALY DETECTED]
          </span>
        </div>
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/90 border border-white/20 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all"
        >
          <FastForward className="w-4 h-4 text-amber-400" />
          <span>SKIP [SPACE]</span>
        </button>
      </motion.div>

      {/* Main Summoning Animation Core */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-2xl w-full">
        {/* Step 1: Warning Grid */}
        {step === 1 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="space-y-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-4xl shadow-[0_0_60px_rgba(239,68,68,0.5)] animate-pulse">
              ⚠️
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-wider">
              QUANTUM LOCK BREACHED
            </h2>
            <p className="text-xs text-red-400 tracking-widest font-mono">
              CORRUPTED AI CORE MANIFESTING IN CENTRAL CHAMBER...
            </p>
          </motion.div>
        )}

        {/* Step 2 & 3: NuLL Materialization Vortex */}
        {(step === 2 || step === 3) && (
          <motion.div
            initial={{ scale: 0.2, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            {/* Pulsing Energy Ring */}
            <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-red-600 to-cyan-500 blur-3xl opacity-60 animate-spin" />

            {/* Character Sketch of NuLL */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="relative w-56 h-56 sm:w-72 sm:h-72 drop-shadow-[0_0_80px_rgba(239,68,68,0.9)]"
            >
              <img
                src="/assets/null_king_boss.png"
                alt="NuLL AI Summoned"
                className="w-full h-full object-contain filter contrast-125 brightness-110"
              />

              {/* Scanning Red Laser Sweep */}
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_20px_#ef4444]"
              />
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-2xl font-black text-red-500 tracking-widest mt-4 animate-pulse"
            >
              ⚡ MATERIALIZING OVERLORD ENTITY... ⚡
            </motion.h3>
          </motion.div>
        )}

        {/* Step 4: Boss Title Splash Card & HP Charge */}
        {step === 4 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4 w-full"
          >
            {/* NuLL Image with Crimson Berserk Aura */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto drop-shadow-[0_0_90px_rgba(239,68,68,1)]">
              <img
                src="/assets/null_king_boss.png"
                alt="NuLL Boss"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-red-950/80 px-3 py-1 rounded-lg border border-red-500/40">
                FINAL BOSS ARENA
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wider mt-2">
                ROGUE AI NuLL // THE OVERLORD TITAN
              </h1>
              <p className="text-xs text-gray-300 max-w-md mx-auto mt-1">
                Primary Core Online • Orbital Death Lasers Active • Defense Shields Armed
              </p>
            </div>

            {/* Charging HP Bar */}
            <div className="max-w-md mx-auto space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-red-400">
                <span>INITIALIZING TITAN INTEGRITY</span>
                <span className="text-white font-mono">{hpCounter} / 7500 HP</span>
              </div>
              <div className="w-full h-5 bg-black/80 rounded-full border border-red-500/50 p-0.5 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full"
                  style={{ width: `${(hpCounter / 7500) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={onComplete}
              className="mt-4 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black font-black text-sm tracking-wider shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all active:scale-95"
            >
              ⚔️ ENGAGE NuLL TITAN NOW
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
