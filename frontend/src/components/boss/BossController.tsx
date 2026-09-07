import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { MASTER_BOSS_AVATAR } from '../map/mapAssets';

interface BossControllerProps {
  currentHp: number;
  maxHp: number;
  isRageMode: boolean;
  isAttacking: boolean;
  isHit: boolean;
  attackName?: string;
}

export const BossController: React.FC<BossControllerProps> = ({
  currentHp,
  maxHp,
  isRageMode,
  isAttacking,
  isHit,
  attackName,
}) => {
  const hpPercent = Math.max(0, (currentHp / maxHp) * 100);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 select-none">
      
      {/* Floating Magic / Cyber Corruption Aura Particles */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          className={`w-64 h-64 rounded-full blur-3xl ${
            isRageMode ? 'bg-rose-600/40 animate-pulse' : 'bg-purple-600/30'
          }`}
          animate={{ scale: isRageMode ? [1, 1.2, 1] : [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Boss Sprite Box */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={
          isAttacking
            ? { x: [-30, 0], scale: [1, 1.3, 1], rotate: [0, -10, 0] }
            : isHit
            ? { x: [0, 15, -15, 10, 0], opacity: [1, 0.4, 1] }
            : { y: ['0px', '-18px', '0px'] }
        }
        transition={{
          duration: isAttacking ? 0.4 : isHit ? 0.3 : 3,
          repeat: isAttacking || isHit ? 1 : Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Boss Image Avatar Frame */}
        <div
          className={`w-40 h-40 sm:w-48 sm:h-48 rounded-3xl border-4 p-2 flex flex-col items-center justify-center shadow-2xl relative transition-all overflow-hidden ${
            isRageMode
              ? 'bg-gradient-to-b from-rose-950 via-red-900 to-black border-rose-500 shadow-[0_0_70px_rgba(225,29,72,0.9)]'
              : 'bg-gradient-to-b from-purple-950 via-indigo-950 to-black border-purple-500 shadow-[0_0_60px_rgba(168,85,247,0.7)]'
          }`}
        >
          <img
            src={MASTER_BOSS_AVATAR}
            alt="NuLL Master Boss"
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_#f43f5e]"
          />

          {/* Rage Mode Badge */}
          {isRageMode && (
            <div className="absolute bottom-2 bg-rose-600 text-white font-mono font-black text-[10px] px-3 py-0.5 rounded-full border border-white uppercase tracking-widest shadow-lg animate-bounce flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              OVERDRIVE RAGE MODE
            </div>
          )}
        </div>

        {/* Boss Attack Banner overlay */}
        {isAttacking && attackName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-mono font-black text-xs px-4 py-1.5 rounded-xl border border-white shadow-2xl whitespace-nowrap z-30"
          >
            🔥 NuLL CASTS: {attackName}!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
);
