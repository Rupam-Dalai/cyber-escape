import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Skull, Sparkles } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface NetherPortalTransitionProps {
  onComplete: () => void;
}

export const NetherPortalTransition: React.FC<NetherPortalTransitionProps> = ({ onComplete }) => {
  useEffect(() => {
    soundEngine.playEmpBurst();
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black font-mono select-none"
    >
      {/* Outer Obsidian Frame (Minecraft Nether Portal Border) */}
      <div className="absolute inset-0 border-[28px] sm:border-[44px] border-[#0F081D] shadow-[inset_0_0_80px_rgba(147,51,234,0.7)] pointer-events-none z-20">
        <div className="w-full h-full border-4 border-[#2D124D]/60 flex flex-col justify-between p-2">
          <div className="flex justify-between text-[10px] text-purple-400/50">
            <span>OBSIDIAN_BLOCK_01</span>
            <span>NETHER_PORTAL_ACTIVE</span>
            <span>OBSIDIAN_BLOCK_04</span>
          </div>
          <div className="flex justify-between text-[10px] text-purple-400/50">
            <span>COORDINATES: X:666 Y:31 Z:108</span>
            <span>DIMENSION: THE NETHER</span>
          </div>
        </div>
      </div>

      {/* Swirling Nether Portal Purple Vortex Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#120024] via-[#2A054D] to-[#0A0014] overflow-hidden flex items-center justify-center">
        
        {/* Spiral Vortex Rings */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 0.9, 1.1, 1] }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
          className="w-[120vw] h-[120vw] rounded-full bg-gradient-to-tr from-purple-900/60 via-fuchsia-600/40 to-indigo-900/80 blur-3xl opacity-80"
        />

        <motion.div
          animate={{ rotate: -360, scale: [1.1, 0.85, 1.3, 1] }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
          className="w-[90vw] h-[90vw] rounded-full bg-gradient-to-bl from-fuchsia-500/50 via-purple-800/60 to-pink-600/40 blur-2xl opacity-90"
        />

        {/* Floating Nether Portal Particles (Minecraft Pixel Blocks / Sparks) */}
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: (Math.random() - 0.5) * window.innerWidth,
              y: (Math.random() - 0.5) * window.innerHeight,
              opacity: 0,
              scale: Math.random() * 1.5 + 0.5,
            }}
            animate={{
              x: (Math.random() - 0.5) * window.innerWidth * 0.3,
              y: [0, (Math.random() - 1) * 300],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2 + Math.random() * 0.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute w-3 h-3 bg-fuchsia-400 border border-purple-200 shadow-[0_0_10px_#d946ef]"
          />
        ))}

        {/* Center Warp Ripples */}
        <motion.div
          animate={{
            scale: [0.2, 3.5],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="w-64 h-64 rounded-full border-4 border-fuchsia-400/60 shadow-[0_0_50px_#e879f9]"
        />

      </div>

      {/* Center Nether Portal Title & Announcement */}
      <motion.div
        animate={{
          scale: [0.95, 1.05, 0.98, 1],
          y: [-5, 5, -3, 0],
        }}
        transition={{ duration: 2.8, ease: 'easeInOut' }}
        className="relative z-30 text-center px-6 py-8 bg-black/70 border-2 border-fuchsia-500/80 rounded-3xl backdrop-blur-xl shadow-[0_0_60px_rgba(217,70,239,0.5)] max-w-lg mx-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 border-2 border-fuchsia-400 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-[0_0_20px_#d946ef]">
          <Skull className="w-10 h-10 text-fuchsia-300" />
        </div>

        <div className="flex items-center justify-center gap-2 text-fuchsia-400 text-xs font-bold tracking-widest uppercase mb-2">
          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>NETHER PORTAL ACTIVATED</span>
          <Sparkles className="w-4 h-4 text-fuchsia-400 animate-spin" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-200 to-pink-400 tracking-widest mb-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          ENTERING THE NETHER
        </h1>

        <p className="text-sm text-purple-200/90 font-mono tracking-wide mb-4">
          Prepare for the Final Showdown...
        </p>

        <div className="inline-block px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-400 text-xs font-bold animate-pulse">
          ⚠️ BOSS LEVEL: NULL KING ARENA
        </div>
      </motion.div>
    </motion.div>
  );
};
