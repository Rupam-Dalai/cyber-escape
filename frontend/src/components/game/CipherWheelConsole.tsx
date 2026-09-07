import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, RotateCcw, CheckCircle2, AlertTriangle, KeyRound, Sparkles, Send, RefreshCw } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface CipherWheelConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'MEMORY_BLAST') => void;
  isSubmitting?: boolean;
}

const SYMBOLS = ['◈', '⬡', '★', '⯁', '▲', '●', '■', '⯃'];
const SYMBOL_NAMES = ['RHOMBUS', 'HEXAGON', 'STAR', 'DIAMOND', 'DELTA', 'ORB', 'CUBE', 'PRISM'];

// Outer ring is fixed in order 0..7: [◈, ⬡, ★, ⯁, ▲, ●, ■, ⯃]
// Clue rule: "Rotate inner wheel until ★ (STAR, idx 2) aligns with ⬡ (HEXAGON, idx 1)"
// Outer[1] (HEXAGON) is at angle -45° (1:30 o'clock)
// Inner[2] (STAR) is initially at angle 0° (3:00 o'clock)
// To align inner Star with outer Hexagon, inner wheel must rotate by -45° (counter-clockwise 1 step, or clockwise 7 steps):
// offset = (1 - 2 + 8) % 8 = 7
const TARGET_ROTATION_OFFSET = 7;

export const CipherWheelConsole: React.FC<CipherWheelConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  // Rotation offset: 0 to 7
  const [wheelOffset, setWheelOffset] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Rotate the inner symbol wheel to align the anchor glyphs according to the alignment specification.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const isAlignedCorrectly = wheelOffset === TARGET_ROTATION_OFFSET;

  const handleRotate = (delta: number) => {
    if (isCompleted) return;
    soundEngine.playCipherClick();
    const nextOffset = (wheelOffset + delta + 8) % 8;
    setWheelOffset(nextOffset);
    if (nextOffset === TARGET_ROTATION_OFFSET) {
      soundEngine.playSuccess();
      setStatusMessage('✓ ANCHOR GLYPHS ALIGNED: ★ (STAR) DIRECTLY UNDER ⬡ (HEXAGON)! Ready to engage lock.');
    } else {
      setStatusMessage('Rotate the inner symbol wheel to align inner ★ (STAR) directly under outer ⬡ (HEXAGON).');
    }
  };

  const handleCommitAlignment = () => {
    soundEngine.playClick();

    if (isAlignedCorrectly) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ SYMBOL SUBSTITUTION ALIGNED! VAULT CYLINDERS ENGAGED! CIPHER KEY FORGED!');
      setTimeout(() => {
        onSubmit('CIPHER_KEY_ACTIVE');
      }, 1200);
    } else {
      soundEngine.playElectricZap();
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      setStatusMessage(`🚨 Misaligned dial sequence! Check the anchor glyph requirement. (Fault ${nextFails}/3)`);

      if (nextFails >= 3) {
        soundEngine.playShortCircuitExplosion();
        setStatusMessage('🚨 MEMORY BLAST: Cryptographic cylinder backfire from mismatched dial alignment!');
        setWheelOffset(0);
        setFailedAttempts(0);
        setTimeout(() => {
          onTriggerHazard('MEMORY_BLAST');
        }, 500);
      }
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    setWheelOffset(0);
    setFailedAttempts(0);
    setStatusMessage('Wheel reset to 0° datum index. Rotate to match the anchor glyphs.');
  };

  return (
    <div className="bg-[#080a14] border-2 border-indigo-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <KeyRound className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-indigo-300">
              ROTARY SYMBOL SUBSTITUTION WHEEL
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 6 • Concentric Alignment Puzzle • Zero Technical Cryptography Jargon
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-[#12162a] hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET WHEEL</span>
        </button>
      </div>

      {/* Alignment Specification Clue Card */}
      <div className="bg-[#0d1022] border border-indigo-500/30 rounded-2xl p-3.5 space-y-1.5 text-xs text-indigo-200">
        <div className="text-[10px] text-indigo-400 font-bold uppercase flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>ANCHOR ALIGNMENT SPECIFICATION</span>
          </span>
          <span className={`text-[10px] font-bold ${isAlignedCorrectly ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isAlignedCorrectly ? '✓ ALIGNMENT LOCKED' : 'ALIGNMENT PENDING'}
          </span>
        </div>
        <p className="leading-relaxed text-[11px] bg-[#151934] p-2.5 rounded-xl border border-indigo-500/15">
          Rotate the inner rotating wheel until the inner <strong>★ (STAR)</strong> aligns directly under the outer <strong>⬡ (HEXAGON)</strong>. Once locked in position, the mechanical substitution locks will engage.
        </p>
      </div>

      {/* Concentric Wheels Visual Display */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-72 h-72 rounded-full border-4 border-indigo-500/30 bg-[#05060d] flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
          {/* Outer Ring: Fixed Target Glyphs */}
          {SYMBOLS.map((sym, idx) => {
            const angle = (idx * (360 / 8) - 90) * (Math.PI / 180);
            const radius = 115;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const isHex = idx === 1;

            return (
              <div
                key={`outer_${idx}`}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                className={`absolute w-9 h-9 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                  isHex
                    ? isAlignedCorrectly
                      ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.9)] scale-125 ring-2 ring-emerald-400 animate-pulse z-10'
                      : 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-110'
                    : 'bg-[#0f1429] border-indigo-500/30 text-indigo-300'
                }`}
                title={`Outer: ${SYMBOL_NAMES[idx]}`}
              >
                {sym}
              </div>
            );
          })}

          {/* Inner Rotatable Wheel */}
          <motion.div
            animate={{ rotate: wheelOffset * 45 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className={`relative w-44 h-44 rounded-full border-4 ${
              isAlignedCorrectly ? 'border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'border-indigo-400/60'
            } bg-[#0b0f20] flex items-center justify-center shadow-inner cursor-pointer`}
          >
            {SYMBOLS.map((sym, idx) => {
              const angle = (idx * (360 / 8) - 90) * (Math.PI / 180);
              const radius = 60;
              const x = radius * Math.cos(angle);
              const y = radius * Math.sin(angle);
              const isStar = idx === 2;

              return (
                <div
                  key={`inner_${idx}`}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  className={`absolute w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-black transition-all ${
                    isStar
                      ? isAlignedCorrectly
                        ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.9)] scale-125 ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)] scale-110'
                      : 'bg-[#18203c] border-indigo-400/40 text-indigo-200'
                  }`}
                >
                  {sym}
                </div>
              );
            })}

            <div className="text-center pointer-events-none">
              <span className="text-[9px] font-black text-indigo-400 block tracking-widest">INNER</span>
              <span className="text-[8px] text-gray-400 font-mono">{(wheelOffset * 45)}°</span>
            </div>
          </motion.div>
        </div>

        {/* Wheel Rotation Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            disabled={isCompleted}
            onClick={() => handleRotate(-1)}
            className="px-5 py-3 rounded-2xl bg-[#12162a] hover:bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <RotateCcw className="w-4 h-4 text-indigo-300" />
            <span>ROTATE ↶ (-45°)</span>
          </button>

          <button
            type="button"
            disabled={isCompleted}
            onClick={() => handleRotate(1)}
            className="px-5 py-3 rounded-2xl bg-[#12162a] hover:bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <span>ROTATE ↷ (+45°)</span>
            <RotateCw className="w-4 h-4 text-indigo-300" />
          </button>
        </div>
      </div>

      {/* Alignment Status & Commit Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 flex-1 ${
          isCompleted
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : failedAttempts > 0
            ? 'bg-red-950/80 border-red-500 text-red-200'
            : 'bg-[#0f1326] border-indigo-500/20 text-indigo-200'
        }`}>
          {failedAttempts > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>

        <button
          type="button"
          disabled={isCompleted || isSubmitting}
          onClick={handleCommitAlignment}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 text-white font-black text-xs tracking-wider shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>ENGAGE SUBSTITUTION LOCK</span>
        </button>
      </div>
    </div>
  );
};
