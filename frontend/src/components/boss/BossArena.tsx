import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ShieldCheck, Trophy, ArrowRight, ArrowLeft, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { BroforceBossEngine } from './BroforceBossEngine';
import { NullSummoningCinematic } from './NullSummoningCinematic';
import { VictoryScreen } from '../game/VictoryScreen';
import { soundEngine } from '../../services/audio';
import { defeatBoss } from '../../services/api';
import { Team, FragmentItem } from '../../types';

interface BossArenaProps {
  team: Team;
  fragments: FragmentItem[];
  onViewLeaderboard: () => void;
  onReturnToHub?: () => void;
  onUpdateTeam?: (team: Team) => void;
}

export const BossArena: React.FC<BossArenaProps> = ({
  team,
  fragments,
  onViewLeaderboard,
  onReturnToHub,
  onUpdateTeam,
}) => {
  const bossStateKey = `cyber_vault_boss_state_${team.id || 'default'}`;
  const isAlreadyDefeated = (() => {
    try {
      return localStorage.getItem(bossStateKey) === 'defeated' || team.status === 'COMPLETED';
    } catch {
      return team.status === 'COMPLETED';
    }
  })();

  // Lock defeated state on mount so live fight & extraction are never interrupted mid-cutscene
  const isAlreadyDefeatedOnMountRef = React.useRef(isAlreadyDefeated);

  const bossIntroKey = `cyber_vault_boss_intro_${team.id || 'default'}`;
  const hasSeenIntroInSession = (() => {
    try {
      return sessionStorage.getItem(bossIntroKey) === 'true';
    } catch {
      return false;
    }
  })();

  const [inIntro, setInIntro] = useState(!isAlreadyDefeated && !hasSeenIntroInSession);
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  const [startExtraction, setStartExtraction] = useState(false);
  const [isSubmittingVictory, setIsSubmittingVictory] = useState(false);

  const handleFinishSummoning = () => {
    setInIntro(false);
    try {
      sessionStorage.setItem(bossIntroKey, 'true');
    } catch {}
  };

  // Called immediately when NuLL is destroyed at end of death animation
  const handleBossDefeated = async () => {
    // 1. Immediately record boss defeat state
    try {
      localStorage.setItem(bossStateKey, 'defeated');
    } catch {}

    soundEngine.playVictoryFanfare();
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
    });

    // 2. PART 4: Show Victory Screen FIRST
    setShowVictoryScreen(true);
    setStartExtraction(false);

    // 3. Record backend victory
    try {
      setIsSubmittingVictory(true);
      const res = await defeatBoss();
      const updatedTeam = {
        ...team,
        status: 'COMPLETED' as const,
        score: res && typeof res.score === 'number' ? res.score : team.score + 1000,
      };
      if (onUpdateTeam) onUpdateTeam(updatedTeam);
    } catch (e) {
      console.error('Error recording boss victory:', e);
    } finally {
      setIsSubmittingVictory(false);
    }
  };

  // Stable callback ref to prevent BroforceBossEngine from re-mounting
  const onBossDefeatedRef = React.useRef(handleBossDefeated);
  onBossDefeatedRef.current = handleBossDefeated;
  const stableOnBossDefeated = React.useCallback(() => {
    onBossDefeatedRef.current();
  }, []);

  // Player acknowledges victory screen -> triggers extraction helicopter cutscene
  const handleProceedToExtraction = () => {
    soundEngine.playClick();
    setShowVictoryScreen(false);
    setStartExtraction(true);
  };

  // If entering arena after NULL was ALREADY defeated previously -> show peaceful post-victory chamber
  if (isAlreadyDefeatedOnMountRef.current) {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 p-8 bg-[#070b14] border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.2)] text-center font-mono space-y-6 relative">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mx-auto text-4xl shadow-lg">
          <ShieldCheck className="w-12 h-12 text-cyan-400" />
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-black flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FACILITY CONTAINMENT STATUS: SECURED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            NULL — NEUTRALIZED
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto mt-2 leading-relaxed">
            The Rogue AI NuLL Titan has been purged from the facility mainframe. The central airlock is safe, all 7 sectors are secured, and the Cyber Vault is liberated.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {onReturnToHub && (
            <button
              onClick={onReturnToHub}
              className="px-6 py-3.5 rounded-2xl bg-[#0e172a] hover:bg-[#1e293b] border-2 border-cyan-400 text-cyan-300 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO CENTRAL HUB</span>
            </button>
          )}

          <button
            onClick={() => setShowVictoryScreen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>VIEW VICTORY SUMMARY & TROPHIES</span>
          </button>

          <button
            onClick={onViewLeaderboard}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 active:scale-95"
          >
            <Award className="w-4 h-4" />
            <span>VIEW LEADERBOARD</span>
          </button>
        </div>

        {/* Modal Victory Screen over Neutralized Room */}
        <AnimatePresence>
          {showVictoryScreen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex items-center justify-center">
              <VictoryScreen
                team={team}
                fragments={fragments}
                onViewLeaderboard={onViewLeaderboard}
                onClose={() => setShowVictoryScreen(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-4 font-mono select-none px-2 sm:px-4">
      {/* Epic Cinematic NuLL Summoning Animation */}
      <AnimatePresence>
        {inIntro && (
          <NullSummoningCinematic onComplete={handleFinishSummoning} />
        )}
      </AnimatePresence>

      {/* PART 4: Victory Screen appears FIRST upon boss defeat */}
      <AnimatePresence>
        {showVictoryScreen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex items-center justify-center">
            <VictoryScreen
              team={team}
              fragments={fragments}
              onViewLeaderboard={onViewLeaderboard}
              onProceedToExtraction={handleProceedToExtraction}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Pure Intense Broforce Run-and-Gun Platformer Boss Arena */}
      {!inIntro && (
        <BroforceBossEngine
          teamName={team.name}
          initialScore={team.score}
          fragments={fragments}
          onBossDefeated={stableOnBossDefeated}
          onViewLeaderboard={onViewLeaderboard}
          onReturnToHub={onReturnToHub}
          startExtraction={startExtraction}
          onReplaySummoning={() => setInIntro(true)}
          onUpdateTeamScore={(newScore) => {
            if (onUpdateTeam) onUpdateTeam({ ...team, score: newScore });
          }}
        />
      )}
    </div>
  );
};
