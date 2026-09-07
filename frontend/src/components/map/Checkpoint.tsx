import React from 'react';
import { motion } from 'framer-motion';
import { Flag, Check, Lock, Skull, Sparkles } from 'lucide-react';

export interface CheckpointData {
  index: number;
  title: string;
  category: 'start' | 'forest' | 'river' | 'bridge' | 'cave' | 'laboratory' | 'temple' | 'boss';
  iconName: string;
  fragmentChar?: string;
}

interface CheckpointProps {
  data: CheckpointData;
  status: 'completed' | 'current' | 'locked';
  onClick?: () => void;
}

export const Checkpoint: React.FC<CheckpointProps> = ({ data, status, onClick }) => {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';
  const isBoss = data.category === 'boss';

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.15, y: -6 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={`relative flex flex-col items-center cursor-pointer select-none transition-all ${
        isLocked ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      {/* Active Flag Golden Aura Pulse */}
      {isCurrent && (
        <div className="absolute -inset-4 bg-amber-400/30 rounded-full blur-xl animate-pulse"></div>
      )}

      {/* Floating Status Tag above Flag */}
      <div
        className={`absolute -top-7 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border flex items-center gap-1 shadow-md backdrop-blur-md z-20 whitespace-nowrap ${
          isCompleted
            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
            : isCurrent
            ? 'bg-amber-400 border-white text-black animate-bounce shadow-[0_0_15px_rgba(245,158,11,0.9)]'
            : 'bg-gray-900/90 border-white/20 text-gray-400'
        }`}
      >
        {isCompleted ? (
          <>
            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
            <span>CLEARED</span>
          </>
        ) : isCurrent ? (
          <>
            <Sparkles className="w-3 h-3 text-black animate-spin" />
            <span>ACTIVE</span>
          </>
        ) : (
          <>
            <Lock className="w-3 h-3 text-gray-400" />
            <span>LOCKED</span>
          </>
        )}
      </div>

      {/* 2D ARCADE FLAG POST & CLOTH */}
      <div className="relative flex flex-col items-center">
        
        {/* Waving 2D Flag Cloth */}
        <motion.div
          animate={
            isCurrent
              ? { rotate: [-2, 4, -2], skewX: [-2, 2, -2] }
              : isCompleted
              ? { rotate: [-1, 2, -1] }
              : {}
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute left-3.5 top-1 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-r-xl rounded-bl-sm shadow-2xl border-y border-r transition-all ${
            isBoss
              ? 'bg-gradient-to-r from-purple-950 via-fuchsia-900 to-black border-fuchsia-400/80 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.6)]'
              : isCompleted
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 border-emerald-300/80 text-white shadow-emerald-900/50'
              : isCurrent
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-amber-200 text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.7)]'
              : 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600 text-gray-400'
          }`}
        >
          {/* Flag Icon */}
          {isBoss ? (
            <Skull className="w-4 h-4 text-fuchsia-300 animate-pulse" />
          ) : isCompleted ? (
            <Check className="w-4 h-4 text-white stroke-[3]" />
          ) : isCurrent ? (
            <Flag className="w-4 h-4 text-black fill-black" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          )}

          <span className="font-mono text-xs font-black tracking-wider whitespace-nowrap">
            {isBoss ? 'NETHER BOSS' : `ST-${String(data.index + 1).padStart(2, '0')}`}
          </span>
        </motion.div>

        {/* Flag Pole (Golden or Dark Metallic) */}
        <div
          className={`w-2 h-16 rounded-full border shadow-md relative ${
            isBoss
              ? 'bg-gradient-to-b from-fuchsia-400 via-purple-900 to-black border-fuchsia-500'
              : isCurrent
              ? 'bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 border-amber-300'
              : isCompleted
              ? 'bg-gradient-to-b from-emerald-300 via-emerald-600 to-emerald-900 border-emerald-400'
              : 'bg-gradient-to-b from-gray-500 via-gray-700 to-gray-900 border-gray-600'
          }`}
        >
          {/* Flag Finial (Ball on Top of Pole) */}
          <div
            className={`absolute -top-2 -left-1 w-4 h-4 rounded-full border shadow-lg ${
              isBoss
                ? 'bg-fuchsia-400 border-white animate-pulse shadow-[0_0_10px_#d946ef]'
                : isCurrent
                ? 'bg-amber-300 border-white shadow-[0_0_10px_#f59e0b]'
                : isCompleted
                ? 'bg-emerald-300 border-white'
                : 'bg-gray-600 border-gray-400'
            }`}
          />
        </div>

        {/* 2D Grass / Stone Pedestal Base */}
        <div
          className={`w-10 h-3.5 rounded-full border flex items-center justify-center -mt-1 shadow-xl ${
            isBoss
              ? 'bg-[#180B2B] border-fuchsia-500/80 shadow-fuchsia-900/60'
              : isCurrent
              ? 'bg-amber-950 border-amber-400 shadow-amber-900/60'
              : isCompleted
              ? 'bg-emerald-950 border-emerald-500 shadow-emerald-900/60'
              : 'bg-gray-950 border-gray-700'
          }`}
        >
          <div className="w-6 h-1 rounded-full bg-white/20" />
        </div>

        {/* Clue Fragment Character Badge */}
        {data.fragmentChar && (
          <span className="absolute -bottom-2 -right-2 bg-amber-400 text-black font-mono font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-black shadow-md z-30">
            {data.fragmentChar}
          </span>
        )}
      </div>

      {/* Checkpoint Title Label */}
      <div className="mt-3 text-center max-w-[100px]">
        <div
          className={`text-[11px] font-mono font-bold leading-tight ${
            isBoss
              ? 'text-fuchsia-300'
              : isCurrent
              ? 'text-amber-300'
              : isCompleted
              ? 'text-emerald-300'
              : 'text-gray-400'
          }`}
        >
          {data.title}
        </div>
        <div className="text-[9px] font-mono text-gray-400 mt-0.5">
          {isBoss ? 'FINAL BOSS' : `FLAG ${data.index + 1}`}
        </div>
      </div>
    </motion.div>
  );
};
