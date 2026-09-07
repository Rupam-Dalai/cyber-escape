import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Trophy, Clock, Award, Sparkles } from 'lucide-react';
import { Team, FragmentItem } from '../../types';
import { FragmentCollection } from './FragmentCollection';
import { soundEngine } from '../../services/audio';

interface VictoryScreenProps {
  team: Team;
  fragments: FragmentItem[];
  onViewLeaderboard: () => void;
  onProceedToExtraction?: () => void;
  onClose?: () => void;
  physicalClue?: string;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  team,
  fragments,
  onViewLeaderboard,
  onProceedToExtraction,
  onClose,
  physicalClue,
}) => {
  useEffect(() => {
    soundEngine.playSuccess();
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#F59E0B', '#06B6D4', '#10B981'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F59E0B', '#06B6D4', '#10B981'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalSeconds = Math.floor((team.completed_at || Date.now() / 1000) - team.started_at);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-8 bg-gradient-to-b from-[#17130A] via-hunt-surface to-[#0D0B07] border border-amber-500/40 rounded-3xl text-center shadow-2xl shadow-amber-950/50 relative overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Icon & Header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-amber-300 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/40"
      >
        <Trophy className="w-12 h-12 text-black" />
      </motion.div>

      <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-emerald-400 to-amber-200 tracking-wider mb-2">
        CYBER VAULT ESCAPED
      </h1>
      <p className="text-lg font-bold text-emerald-300 font-sans tracking-wide mb-6">
        ROGUE AI NuLL PURGED • MISSION ACCOMPLISHED
      </p>

      {/* Quote */}
      <blockquote className="italic text-hunt-textMuted font-sans text-sm max-w-lg mx-auto mb-8 border-y border-white/10 py-3">
        "THE BEST PROGRAMMERS DON'T JUST READ CODE. THEY FOLLOW WHERE IT LEADS."
      </blockquote>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-hunt-elevated/60 border border-white/10 rounded-2xl">
          <span className="text-xs text-hunt-textMuted block mb-1">EXPEDITION TEAM</span>
          <span className="text-lg font-mono font-bold text-amber-400">{team.name}</span>
        </div>

        <div className="p-4 bg-hunt-elevated/60 border border-white/10 rounded-2xl">
          <span className="text-xs text-hunt-textMuted block mb-1">COMPLETION TIME</span>
          <span className="text-lg font-mono font-bold text-white flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-cyan-400" /> {formattedTime}
          </span>
        </div>

        <div className="p-4 bg-hunt-elevated/60 border border-amber-500/30 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-xs text-hunt-textMuted block mb-1">FINAL SCORE</span>
          <span className="text-2xl font-mono font-extrabold text-amber-400">{team.score}</span>
        </div>
      </div>

      {/* Discovered Fragments */}
      <div className="mb-8">
        <FragmentCollection fragments={fragments} />
      </div>

      {/* Optional Physical Clue Banner */}
      {physicalClue && (
        <div className="mb-8 p-5 bg-gradient-to-r from-cyan-950/60 to-hunt-surface border border-cyan-500/40 rounded-2xl text-left">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
            <Sparkles className="w-4 h-4" /> PHYSICAL TREASURE CLUE UNLOCKED:
          </div>
          <p className="text-sm font-mono text-cyan-200">{physicalClue}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {onProceedToExtraction ? (
          <button
            onClick={onProceedToExtraction}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 font-mono font-black text-black text-base rounded-2xl shadow-xl shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>⚡ PROCEED TO EXTRACTION HELICOPTER</span>
          </button>
        ) : null}

        <button
          onClick={onViewLeaderboard}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-mono font-bold text-black text-base rounded-2xl shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-5 h-5" /> VIEW LIVE LEADERBOARD
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-4 bg-[#0a0f1d] hover:bg-[#131b2e] border border-white/20 font-mono font-bold text-gray-300 hover:text-white text-base rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>✕ CLOSE SUMMARY</span>
          </button>
        )}
      </div>

    </div>
  );
};
