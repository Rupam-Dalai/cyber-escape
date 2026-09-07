import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Sparkles, Terminal, Skull, CheckCircle2, ShieldAlert, Heart, Cpu, Lock, Flame, Layers, KeyRound, Search, Send, Trophy, ArrowRight } from 'lucide-react';
import { ThreeDBattleStage } from './ThreeDBattleStage';
import { PixelAvatar } from '../common/PixelAvatar';
import { Team, FragmentItem } from '../../types';
import { soundEngine } from '../../services/audio';

interface FloatingDamage {
  id: number;
  text: string;
  isCrit: boolean;
  isPlayerHit: boolean;
}

interface BattleUIProps {
  team: Team;
  currentPhase: 1 | 2 | 3 | 4 | 5;
  bossHp: number;
  maxBossHp: number;
  playerLives: number;
  maxPlayerLives: number;
  isBossAttacking: boolean;
  isHeroAttacking?: boolean;
  isUltimateAttacking?: boolean;
  isBossHit: boolean;
  isBossDefeated?: boolean;
  bossAttackName?: string;
  floatingDamages: FloatingDamage[];
  battleLog: string[];
  selectedItemIds: string[];
  onToggleItemSelection: (itemId: string) => void;
  onDeployItems: () => void;
  isCloneRevealed?: boolean;
  realCloneIndex?: number;
  isTimingWindowActive?: boolean;
  timingPointer?: number;
  onViewLeaderboard: () => void;
}

const ALL_SEVEN_ITEMS = [
  {
    id: 'firewall_rules',
    name: 'Firewall Rule Set',
    icon: '🧱',
    room: 'Room 5: SOC Firewall',
    phaseDesc: 'Phase 1: Combine with Access Credentials to breach outer firewall.',
    color: 'border-red-500 bg-red-950/40 text-red-300 hover:border-red-400',
    phaseUse: [1],
  },
  {
    id: 'access_credentials',
    name: 'Access Credentials',
    icon: '📜',
    room: 'Room 3: Database Vault',
    phaseDesc: 'Phase 1: Combine with Firewall Rule Set to breach outer firewall.',
    color: 'border-purple-500 bg-purple-950/40 text-purple-300 hover:border-purple-400',
    phaseUse: [1],
  },
  {
    id: 'firewall_patch',
    name: 'Firewall Patch',
    icon: '🛡️',
    room: 'Room 1: Network Infra',
    phaseDesc: 'Phase 2: Blocks and reflects NULL Corruption Pulse.',
    color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300 hover:border-cyan-400',
    phaseUse: [2],
  },
  {
    id: 'clean_api',
    name: 'Clean API Call',
    icon: '⚙️',
    room: 'Room 4: Backend API',
    phaseDesc: 'Phase 3: Filters decoy streams and tags the authentic NULL core.',
    color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400',
    phaseUse: [3],
  },
  {
    id: 'cipher_key',
    name: 'Cipher Key',
    icon: '🔑',
    room: 'Room 6: Crypto Vault',
    phaseDesc: 'Phase 4: Decodes & shatters NULL encrypted core lock, staggering it.',
    color: 'border-indigo-500 bg-indigo-950/40 text-indigo-300 hover:border-indigo-400',
    phaseUse: [4],
  },
  {
    id: 'forensic_map',
    name: 'Forensic Trace Map',
    icon: '🗺️',
    room: 'Room 7: Forensics Lab',
    phaseDesc: 'Phase 5: Reveals NULL exact reboot timing window.',
    color: 'border-teal-500 bg-teal-950/40 text-teal-300 hover:border-teal-400',
    phaseUse: [5],
  },
  {
    id: 'power_surge',
    name: 'Power Surge Cell',
    icon: '🔋',
    room: 'Room 2: Power Grid',
    phaseDesc: 'Phase 5: Combined with Forensic Trace Map to deliver fatal overload in timing window.',
    color: 'border-amber-500 bg-amber-950/40 text-amber-300 hover:border-amber-400',
    phaseUse: [5],
  },
];

const PHASE_TITLES = {
  1: 'PHASE 1: PERIMETER BREACH (FIREWALL MATRIX)',
  2: 'PHASE 2: CORRUPTION PULSE CHARGE',
  3: 'PHASE 3: CLONE SWARM DECOY MATRIX',
  4: 'PHASE 4: ENCRYPTED CORE LOCK',
  5: 'PHASE 5: FINAL OVERLOAD PURGE',
};

export const BattleUI: React.FC<BattleUIProps> = ({
  team,
  currentPhase,
  bossHp,
  maxBossHp,
  playerLives,
  maxPlayerLives,
  isBossAttacking,
  isHeroAttacking,
  isUltimateAttacking,
  isBossHit,
  isBossDefeated = false,
  bossAttackName,
  floatingDamages,
  battleLog,
  selectedItemIds,
  onToggleItemSelection,
  onDeployItems,
  isCloneRevealed = false,
  realCloneIndex = 1,
  isTimingWindowActive = false,
  timingPointer = 0,
  onViewLeaderboard,
}) => {
  const bossHpPercent = Math.max(0, (bossHp / maxBossHp) * 100);
  const latestLog = battleLog[battleLog.length - 1] || `Rogue AI NuLL is preparing its next attack vector...`;

  return (
    <div className="w-full bg-[#050811] border-4 border-cyan-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(6,182,212,0.25)] space-y-4 relative overflow-hidden font-mono select-none">
      {/* 3D Battle Arena Stage */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/30">
        {/* Top-Right: Boss NuLL Health Card */}
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0e1424]/90 border-2 border-rose-500/70 rounded-2xl p-3 text-white shadow-2xl backdrop-blur-md w-60 sm:w-72"
          >
            <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-wider">
              <span className="flex items-center gap-1.5 text-rose-400 uppercase">
                <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
                ROGUE AI NuLL
              </span>
              <span className="text-[10px] font-black text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full">
                {PHASE_TITLES[currentPhase].split(':')[0]}
              </span>
            </div>

            {/* Boss HP Bar */}
            <div className="mt-2 bg-black/60 rounded-full p-1 border border-white/10 flex items-center gap-2">
              <span className="text-[9px] font-black text-white bg-rose-600 px-1.5 rounded-full">HP</span>
              <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full transition-all duration-500 ${
                    bossHpPercent > 40 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-rose-600 animate-pulse'
                  }`}
                  animate={{ width: `${bossHpPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mt-1">
              <span>{PHASE_TITLES[currentPhase]}</span>
              <span className="text-rose-400 font-mono">{bossHp} / {maxBossHp} HP</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom-Left: Operative Health & Lives Card */}
        <div className="absolute bottom-3 left-3 z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0e1424]/90 border-2 border-cyan-500/70 rounded-2xl p-3 text-white shadow-2xl backdrop-blur-md w-56 sm:w-64"
          >
            <div className="flex items-center gap-2">
              <PixelAvatar avatarId={team.name} size={30} className="border-cyan-400" />
              <div>
                <div className="text-xs font-black text-white">UNIT-7 OPERATIVE</div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: maxPlayerLives }).map((_, idx) => (
                    <Heart
                      key={idx}
                      className={`w-4 h-4 transition-all ${
                        idx < playerLives ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-emerald-400 font-bold ml-1">(100% HEALTH)</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 3D Battle Stage Canvas / Animated Arena */}
        <ThreeDBattleStage
          team={team}
          currentPhase={currentPhase}
          bossHp={bossHp}
          maxBossHp={maxBossHp}
          playerHp={100}
          maxPlayerHp={100}
          isBossAttacking={isBossAttacking}
          isHeroAttacking={isHeroAttacking}
          isUltimateAttacking={isUltimateAttacking}
          isBossHit={isBossHit}
          isBossDefeated={isBossDefeated}
          bossAttackName={bossAttackName}
          floatingDamages={floatingDamages}
          isCloneRevealed={isCloneRevealed}
          realCloneIndex={realCloneIndex}
        />
      </div>

      {/* Phase 5 Timing Target Window (When in Phase 5) */}
      {currentPhase === 5 && !isBossDefeated && (
        <div className="bg-[#100816] border-2 border-amber-500/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-400">⚡ FORENSIC TRACE MAP TIMING WINDOW:</span>
            <span className="text-emerald-400">STRIKE WHEN NEEDLE IS IN GREEN REBOOT ZONE (35%–65%)</span>
          </div>
          <div className="relative h-8 w-full bg-black/60 rounded-xl border border-white/10 overflow-hidden flex items-center">
            {/* Green target zone */}
            <div className="absolute left-[35%] top-0 bottom-0 w-[30%] bg-emerald-500/40 border-x-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center text-[10px] font-black text-emerald-200">
              REBOOT EXPLOIT WINDOW
            </div>
            {/* Moving pointer */}
            <motion.div
              animate={{ left: `${timingPointer}%` }}
              transition={{ type: 'linear', duration: 0.05 }}
              className="absolute top-0 bottom-0 w-3 bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,1)] rounded-full -ml-1.5 z-20"
            />
          </div>
        </div>
      )}

      {/* Terminal Battle Telemetry Feed */}
      <div className="bg-[#090d18] border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300">
          <Terminal className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          <span className="line-clamp-1">{latestLog}</span>
        </div>
        <div className="bg-black/50 px-3 py-1 rounded-lg border border-cyan-500/40 text-cyan-400 font-bold shrink-0">
          STAGE {currentPhase}/5
        </div>
      </div>

      {/* Victory Banner (If Boss Defeated) */}
      {isBossDefeated ? (
        <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            🎉 CYBER VAULT LIBERATED! MISSION COMPLETE!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 max-w-lg mx-auto">
            You have successfully cleared all 7 facility sectors, gathered all master items, and purged rogue super-intelligence NuLL!
          </p>
          <button
            onClick={onViewLeaderboard}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-sm shadow-xl flex items-center gap-2 mx-auto"
          >
            <span>VIEW EVENT LEADERBOARD & CERTIFICATE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Tactical 7-Item Deployment Dock */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
            <span className="text-cyan-400 uppercase">
              SELECT KEY ITEM(S) TO DEPLOY ({selectedItemIds.length}/2 SLOTS):
            </span>
            <span className="text-[11px] text-gray-400">
              {currentPhase === 1 || currentPhase === 5 ? 'Combine 2 required items' : 'Select 1 required item'}
            </span>
          </div>

          {/* 7 Item Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_SEVEN_ITEMS.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isRecommendedForPhase = item.phaseUse.includes(currentPhase);
              return (
                <button
                  key={item.id}
                  onClick={() => onToggleItemSelection(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-[1.02]'
                      : isRecommendedForPhase
                      ? `${item.color} shadow-md`
                      : 'bg-[#0a0f1d] border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{item.icon}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white line-clamp-1">{item.name}</div>
                    <div className="text-[9px] text-gray-400 line-clamp-1">{item.room.split(':')[1]}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Deploy Bar */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span className="text-cyan-300 font-bold">Selected:</span>
              {selectedItemIds.length === 0 ? (
                <span className="italic text-gray-500">None</span>
              ) : (
                selectedItemIds.map((id) => (
                  <span key={id} className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                    {ALL_SEVEN_ITEMS.find((i) => i.id === id)?.name}
                  </span>
                ))
              )}
            </div>

            <button
              disabled={selectedItemIds.length === 0}
              onClick={onDeployItems}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 hover:from-rose-400 hover:to-amber-400 text-black font-black text-xs shadow-[0_0_30px_rgba(244,63,94,0.5)] transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>DEPLOY COMBAT PROTOCOL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
