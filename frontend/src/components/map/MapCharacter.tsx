import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Footprints, Award, Shield } from 'lucide-react';
import { PixelAvatar } from '../common/PixelAvatar';

interface MapCharacterProps {
  xPercent: number; // Position percentage (0% to 100%)
  isMoving: boolean;
  isCelebrating: boolean;
  teamName: string;
  avatarId?: string;
}

export const MapCharacter: React.FC<MapCharacterProps> = ({
  xPercent,
  isMoving,
  isCelebrating,
  teamName,
  avatarId,
}) => {
  return (
    <motion.div
      className="absolute bottom-[48px] z-30 pointer-events-none transition-all duration-700 ease-out"
      style={{ left: `${xPercent}%` }}
      animate={{
        y: isMoving
          ? [0, -6, 1, -5, 0]
          : isCelebrating
            ? [0, -18, 0, -18, 0]
            : [0, -2, 0],
        rotate: isMoving ? [-3, 3, -3] : isCelebrating ? [0, 10, -10, 0] : 0,
        scale: isCelebrating ? [1, 1.15, 1] : 1,
      }}
      transition={{
        duration: isMoving ? 0.35 : isCelebrating ? 0.55 : 2.2,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      <div className="relative flex flex-col items-center -translate-x-1/2 select-none">
        
        {/* Footstep Particles when walking on floor */}
        {isMoving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: [0, 6] }}
            transition={{ duration: 0.25, repeat: Infinity }}
            className="absolute -bottom-4 flex items-center gap-2 text-amber-400"
          >
            <Footprints className="w-4 h-4 animate-ping text-amber-400" />
          </motion.div>
        )}

        {/* Celebration sparkles */}
        {isCelebrating && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1.3 }}
            className="absolute -top-10 text-amber-300 flex gap-2 z-40"
          >
            <Sparkles className="w-5 h-5 animate-spin text-amber-300" />
            <Award className="w-5 h-5 animate-bounce text-emerald-400" />
          </motion.div>
        )}

        {/* OVERHEAD STUDENT NAME BADGE */}
        <div className="mb-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-mono font-extrabold text-[11px] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.9)] whitespace-nowrap border border-white flex items-center gap-1 z-40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse" />
          <span className="tracking-wide uppercase">{teamName || 'STUDENT HERO'}</span>
        </div>

        {/* FULL BODY 2D PIXEL AVATAR CHARACTER */}
        <div className="relative flex flex-col items-center">
          {/* Glowing Hero Aura */}
          <div className="absolute -inset-2 bg-gradient-to-b from-amber-400/30 via-cyan-400/20 to-amber-600/30 rounded-2xl blur-sm opacity-80 animate-pulse" />

          {/* FULL BODY CHARACTER CONTAINER */}
          <div className="relative z-10 flex flex-col items-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]">
            
            {/* 1. HEAD (8-Bit Headshot Avatar) */}
            <div className="relative mb-[-4px] z-20">
              <PixelAvatar avatarId={avatarId || teamName} size={36} className="border-2 border-white rounded-xl shadow-lg" />
            </div>

            {/* 2. BODY / TORSO & CHESTPLATE ARMOR */}
            <div className="w-7 h-7 bg-gradient-to-b from-amber-500 via-amber-700 to-slate-800 rounded-md border-2 border-amber-300 flex flex-col items-center justify-between p-0.5 relative z-10 shadow-md">
              {/* Chestplate Emblem */}
              <Shield className="w-3 h-3 text-amber-200 fill-amber-400/40 stroke-[2.5]" />
              
              {/* Belt */}
              <div className="w-full h-1 bg-amber-950 border-y border-amber-400/80 rounded-xs flex items-center justify-center">
                <div className="w-1 h-1 bg-yellow-300 rounded-xs" />
              </div>
            </div>

            {/* 3. LEGS & BOOTS ON GROUND */}
            <div className="flex justify-between w-5 h-4 mt-[-2px] relative z-0">
              {/* Left Leg & Boot */}
              <div className="w-2 h-full bg-slate-800 border-x border-b border-amber-400/60 rounded-b-sm flex flex-col justify-end">
                <div className="w-full h-1.5 bg-amber-900 rounded-b-sm border-t border-amber-500" />
              </div>
              {/* Right Leg & Boot */}
              <div className="w-2 h-full bg-slate-800 border-x border-b border-amber-400/60 rounded-b-sm flex flex-col justify-end">
                <div className="w-full h-1.5 bg-amber-900 rounded-b-sm border-t border-amber-500" />
              </div>
            </div>

          </div>

          {/* Surface Ground Contact Shadow directly under feet */}
          <div className="w-9 h-1.5 bg-black/80 rounded-full blur-xs mx-auto mt-0.5" />
        </div>
      </div>
    </motion.div>
  );
};
