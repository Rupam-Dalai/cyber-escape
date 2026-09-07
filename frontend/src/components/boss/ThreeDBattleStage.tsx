import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ShieldAlert, Skull, CheckCircle2, Lock, Flame } from 'lucide-react';
import { PixelAvatar } from '../common/PixelAvatar';
import { MASTER_BOSS_AVATAR } from '../map/mapAssets';
import { Team } from '../../types';

interface FloatingDamage {
  id: number;
  text: string;
  isCrit: boolean;
  isPlayerHit: boolean;
}

interface ThreeDBattleStageProps {
  team: Team;
  currentPhase?: 1 | 2 | 3 | 4 | 5;
  bossHp: number;
  maxBossHp: number;
  playerHp: number;
  maxPlayerHp: number;
  isBossAttacking: boolean;
  isHeroAttacking?: boolean;
  isUltimateAttacking?: boolean;
  isBossHit: boolean;
  isBossDefeated: boolean;
  isHeroDefeated?: boolean;
  bossAttackName?: string;
  floatingDamages: FloatingDamage[];
  isCloneRevealed?: boolean;
  realCloneIndex?: number;
}

export const ThreeDBattleStage: React.FC<ThreeDBattleStageProps> = ({
  team,
  currentPhase = 1,
  bossHp,
  maxBossHp,
  playerHp,
  maxPlayerHp,
  isBossAttacking,
  isHeroAttacking,
  isUltimateAttacking,
  isBossHit,
  isBossDefeated,
  isHeroDefeated,
  bossAttackName,
  floatingDamages,
  isCloneRevealed = false,
  realCloneIndex = 1,
}) => {
  return (
    <div className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-[#060912] via-[#0d1222] to-[#04060c] rounded-3xl border-2 border-cyan-500/40 overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col justify-between select-none">
      {/* Anime Speed Lines Overlay for Attack Phases */}
      <AnimatePresence>
        {(isHeroAttacking || isBossAttacking || isUltimateAttacking) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-25 pointer-events-none overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 90%), repeating-conic-gradient(from 0deg, rgba(255,255,255,0.15) 0deg 2deg, transparent 2deg 15deg)`,
              backgroundPosition: 'center center',
            }}
          />
        )}
      </AnimatePresence>

      {/* Dynamic 3D Camera Focus for Ultimate Attack */}
      <AnimatePresence>
        {isUltimateAttacking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Floating Damage Numbers overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden font-mono">
        <AnimatePresence>
          {floatingDamages.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: d.isPlayerHit ? 180 : 80, scale: 0.5 }}
              animate={{ opacity: 1, y: d.isPlayerHit ? 120 : 30, scale: d.isCrit ? 1.6 : 1.2 }}
              exit={{ opacity: 0, y: d.isPlayerHit ? 80 : 0 }}
              transition={{ duration: 0.8 }}
              className={`absolute font-black text-xl sm:text-2xl drop-shadow-[0_0_10px_rgba(0,0,0,1)] ${
                d.isPlayerHit ? 'left-1/4 text-rose-400' : 'right-1/4 text-yellow-300'
              }`}
            >
              {d.text} {d.isCrit ? '💥 CRITICAL!' : ''}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ambient Plasma Energy Sparks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
            style={{
              left: `${(i * 7.5) % 100}%`,
              top: `${(i * 12) % 100}%`,
            }}
            animate={{
              y: [0, -140],
              opacity: [0, 0.9, 0],
              scale: [0.6, 1.6, 0.4],
            }}
            transition={{
              duration: 2.5 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* 3D Tilted Floor Arena Plane */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="w-[140%] h-[120%] bg-[#080e1c] border-2 border-cyan-500/40 shadow-[0_0_90px_rgba(6,182,212,0.3)] relative overflow-hidden"
          style={{
            transform: 'rotateX(55deg) translateY(40px)',
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.25), transparent 70%),
              linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        >
          <div className="absolute inset-0 m-auto w-80 h-80 rounded-full border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(34,211,238,0.5)] animate-pulse" />
        </div>
      </div>

      {/* Character Models Layer */}
      <div className="relative z-30 w-full h-full flex items-center justify-between px-8 sm:px-16 pt-6">
        {/* Left Side: UNIT-7 Operative */}
        <div className="flex flex-col items-center relative -mt-10 sm:-mt-16">
          <motion.div
            animate={{
              x: isHeroAttacking ? [0, 120, 0] : isUltimateAttacking ? [0, 180, 0] : 0,
              y: isHeroAttacking ? [0, -20, 0] : 0,
            }}
            transition={{ duration: 0.6 }}
            className="relative flex flex-col items-center"
          >
            {/* Realistic UNIT-7 Hero Avatar Frame */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#0e172a] border-2 border-cyan-400 p-2 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)]">
              <PixelAvatar avatarId={team.name} size={70} className="border-cyan-400 shadow-lg" />
            </div>

            {/* Tactical Designation */}
            <div className="mt-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-[10px] font-black text-cyan-300 shadow-md">
              UNIT-7 OPERATIVE
            </div>
          </motion.div>
        </div>

        {/* Right Side: Rogue AI NULL / Clone Swarm */}
        <div className="flex flex-col items-center relative -mt-10 sm:-mt-16">
          <motion.div
            animate={{
              x: isBossAttacking ? [0, -120, 0] : 0,
              scale: isBossHit ? [1, 0.9, 1.1, 1] : 1,
              filter: isBossHit ? 'brightness(2) contrast(1.5)' : 'none',
            }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col items-center"
          >
            {/* Phase 1 Outer Firewall Shield Visual */}
            {currentPhase === 1 && (
              <div className="absolute -inset-6 rounded-full border-4 border-red-500/80 bg-red-950/30 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.7)] pointer-events-none flex items-center justify-center">
                <span className="text-[9px] font-black text-red-300 bg-black/80 px-2 py-0.5 rounded-full border border-red-500">
                  FIREWALL SHIELD ACTIVE
                </span>
              </div>
            )}

            {/* Phase 2 Corruption Pulse Aura */}
            {currentPhase === 2 && (
              <div className="absolute -inset-8 rounded-full border-2 border-rose-500/50 animate-ping pointer-events-none" />
            )}

            {/* Phase 4 Encrypted Core Lock Ring */}
            {currentPhase === 4 && (
              <div className="absolute -inset-4 rounded-3xl border-2 border-indigo-400/80 bg-indigo-950/30 animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />
            )}

            {/* Main NULL Avatar / Decoy Render */}
            <div className="flex items-center gap-3">
              {/* If Phase 3 Clone Swarm, show 3 copies */}
              {currentPhase === 3 ? (
                [0, 1, 2].map((idx) => {
                  const isReal = idx === realCloneIndex;
                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/80 border-2 p-1.5 flex items-center justify-center transition-all ${
                        isCloneRevealed && isReal
                          ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.9)] scale-110'
                          : 'border-rose-500/50 opacity-80'
                      }`}>
                        <img
                          src={MASTER_BOSS_AVATAR}
                          alt="NuLL Clone"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {isCloneRevealed && isReal && (
                        <span className="text-[8px] font-black text-emerald-300 bg-emerald-950 border border-emerald-400 px-1.5 py-0.5 rounded mt-1">
                          200 OK (AUTHENTIC)
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-black/90 border-2 border-rose-500 p-2 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.6)]">
                  <img
                    src={MASTER_BOSS_AVATAR}
                    alt="NuLL Overlord"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                  />
                </div>
              )}
            </div>

            {/* NuLL Designation */}
            <div className="mt-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-[10px] font-black text-rose-300 shadow-md">
              {isBossDefeated ? 'NuLL PURGED' : 'ROGUE AI NuLL (v9.9.0)'}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
