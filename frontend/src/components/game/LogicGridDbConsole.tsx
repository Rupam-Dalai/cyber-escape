import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, KeyRound, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Send, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface LogicGridDbConsoleProps {
  isApiFixed?: boolean;
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'LASER_TRAP') => void;
  isSubmitting?: boolean;
}

interface SymbolRune {
  id: string;
  symbol: string;
  name: string;
  color: string;
  border: string;
  text: string;
}

const RUNES: SymbolRune[] = [
  { id: 'RHO', symbol: '◈', name: 'RHOMBUS', color: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-300' },
  { id: 'STR', symbol: '★', name: 'STAR', color: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-300' },
  { id: 'HEX', symbol: '⬡', name: 'HEXAGON', color: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-300' },
  { id: 'DIA', symbol: '⯁', name: 'DIAMOND', color: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-300' },
  { id: 'DLT', symbol: '▲', name: 'DELTA', color: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-300' },
  { id: 'CUB', symbol: '⯀', name: 'CUBE', color: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-300' },
];

// Target code: [◈, ★, ⬡, ⯁] (Rhombus, Star, Hexagon, Diamond)
const SECRET_CODE = ['RHO', 'STR', 'HEX', 'DIA'];
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 7;

interface GuessAttempt {
  guess: string[];
  exact: number; // Correct symbol and position
  misplaced: number; // Correct symbol, wrong position
}

export const LogicGridDbConsole: React.FC<LogicGridDbConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [history, setHistory] = useState<GuessAttempt[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Select 4 runes to assemble a decryption guess. Feedback will show exact & misplaced matches.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleSelectRune = (runeId: string) => {
    if (isCompleted || currentGuess.length >= CODE_LENGTH) return;
    soundEngine.playTerminalType();
    setCurrentGuess((prev) => [...prev, runeId]);
  };

  const handleRemoveSlot = (index: number) => {
    if (isCompleted) return;
    soundEngine.playClick();
    setCurrentGuess((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearGuess = () => {
    soundEngine.playClick();
    setCurrentGuess([]);
  };

  const handleSubmitGuess = () => {
    if (currentGuess.length !== CODE_LENGTH || isCompleted) return;

    soundEngine.playClick();

    // Calculate Mastermind feedback
    let exact = 0;
    let misplaced = 0;

    const secretRemaining: (string | null)[] = [...SECRET_CODE];
    const guessRemaining: (string | null)[] = [...currentGuess];

    // First pass: exact matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessRemaining[i] === secretRemaining[i]) {
        exact++;
        secretRemaining[i] = null;
        guessRemaining[i] = null;
      }
    }

    // Second pass: misplaced matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessRemaining[i] !== null) {
        const foundIdx = secretRemaining.findIndex((r) => r === guessRemaining[i]);
        if (foundIdx !== -1) {
          misplaced++;
          secretRemaining[foundIdx] = null;
        }
      }
    }

    const newAttempt: GuessAttempt = {
      guess: currentGuess,
      exact,
      misplaced,
    };

    const nextHistory = [newAttempt, ...history];
    setHistory(nextHistory);
    setCurrentGuess([]);

    // Check Victory
    if (exact === CODE_LENGTH) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ CREDENTIALS DECRYPTED! ROOT ACCESS GRANTED! ACCESS CREDENTIALS FORGED!');
      setTimeout(() => {
        onSubmit('ACCESS_CREDENTIALS_ACTIVE');
      }, 1200);
      return;
    }

    // Check Failure threshold
    if (nextHistory.length >= MAX_ATTEMPTS) {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage('🚨 LOCKOUT EXCEEDED: Laser defense countermeasures engaged!');
      setHistory([]);
      setTimeout(() => {
        onTriggerHazard('LASER_TRAP');
      }, 500);
      return;
    }

    soundEngine.playTerminalType();
    setStatusMessage(
      `Feedback: ${exact} Exact (Position & Rune), ${misplaced} Misplaced (Wrong Position). ${MAX_ATTEMPTS - nextHistory.length} attempts remaining.`
    );
  };

  const getRune = (id: string) => RUNES.find((r) => r.id === id);

  return (
    <div className="bg-[#0c0614] border-2 border-purple-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <KeyRound className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-purple-300">
              CREDENTIAL DECRYPTION (CODE-BREAKER)
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 3 • Mastermind Deduction Logic • Iteratively Decrypt the 4-Rune Passcode
            </span>
          </div>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#180d28] border border-purple-500/30 text-purple-300 flex items-center gap-2">
          <span>ATTEMPTS LEFT:</span>
          <span className="text-white font-black">{MAX_ATTEMPTS - history.length} / {MAX_ATTEMPTS}</span>
        </div>
      </div>

      {/* Room Clue Constraints Banner */}
      <div className="bg-[#120820] border border-purple-500/30 rounded-2xl p-3 text-xs space-y-1 text-purple-200">
        <div className="text-[10px] text-purple-400 font-bold uppercase flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>SECURITY VAULT DEDUCTION CLUES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#1b0d30] p-2 rounded-lg border border-purple-500/10">
            • Passcode contains <strong>4 unique runes</strong> (no duplicate symbols).
          </div>
          <div className="bg-[#1b0d30] p-2 rounded-lg border border-purple-500/10">
            • First rune is <strong>◈ (RHOMBUS)</strong> or <strong>▲ (DELTA)</strong>.
          </div>
          <div className="bg-[#1b0d30] p-2 rounded-lg border border-purple-500/10">
            • <strong>★ (STAR)</strong> is immediately followed by a 6-sided rune <strong>⬡ (HEXAGON)</strong>.
          </div>
          <div className="bg-[#1b0d30] p-2 rounded-lg border border-purple-500/10">
            • <strong>⯀ (CUBE)</strong> is NOT part of the root authorization sequence.
          </div>
        </div>
      </div>

      {/* Current Guess Assembly Bar */}
      <div className="p-4 bg-[#140a24] border-2 border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">ACTIVE CIPHER:</span>
          <div className="flex items-center gap-2">
            {Array.from({ length: CODE_LENGTH }).map((_, idx) => {
              const runeId = currentGuess[idx];
              const r = runeId ? getRune(runeId) : null;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => r && handleRemoveSlot(idx)}
                  className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    r
                      ? `${r.color} ${r.border} ${r.text} shadow-lg scale-105 cursor-pointer hover:border-rose-400`
                      : 'bg-[#0a0512] border-dashed border-purple-500/30 text-gray-600'
                  }`}
                  title={r ? 'Click to remove rune' : 'Empty slot'}
                >
                  {r ? (
                    <>
                      <span className="text-xl font-black">{r.symbol}</span>
                      <span className="text-[8px] font-bold">{r.name.slice(0, 3)}</span>
                    </>
                  ) : (
                    <span className="text-xs font-mono">{idx + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleClearGuess}
            disabled={currentGuess.length === 0 || isCompleted}
            className="px-3 py-2.5 rounded-xl bg-[#1d1033] hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-all disabled:opacity-40"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={handleSubmitGuess}
            disabled={currentGuess.length !== CODE_LENGTH || isCompleted || isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-black text-xs tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SUBMIT CIPHER GUESS</span>
          </button>
        </div>
      </div>

      {/* Rune Selection Buttons */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
          AVAILABLE CIPHER RUNES (Click to append)
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {RUNES.map((r) => {
            const alreadyInGuess = currentGuess.includes(r.id);

            return (
              <button
                key={r.id}
                type="button"
                disabled={isCompleted || currentGuess.length >= CODE_LENGTH}
                onClick={() => handleSelectRune(r.id)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  alreadyInGuess
                    ? 'opacity-50 border-white/10 bg-[#0d0718]'
                    : 'bg-[#140a24] border-purple-500/20 hover:border-purple-400 hover:bg-purple-950/30 cursor-pointer shadow-md'
                }`}
              >
                <span className={`text-2xl font-black ${r.text}`}>{r.symbol}</span>
                <span className="text-[10px] font-bold text-gray-300">{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guess History Ledger with Peg Feedback */}
      <div className="bg-[#09040e] border border-purple-500/20 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
          <span>DECRYPTION LEDGER ({history.length} GUESSES LOGGED)</span>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Exact (Right Rune + Pos)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Misplaced (Right Rune, Wrong Pos)</span>
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 italic">
            No guesses submitted yet. Formulate a 4-rune sequence and submit above.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.map((att, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#120820] border border-purple-500/15 rounded-xl flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-bold w-6">#{history.length - idx}</span>
                  <div className="flex items-center gap-1.5">
                    {att.guess.map((rid, ri) => {
                      const r = getRune(rid);
                      return (
                        <span
                          key={ri}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border ${r?.border} ${r?.color} ${r?.text}`}
                        >
                          {r?.symbol}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback Pegs */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: att.exact }).map((_, ei) => (
                      <span
                        key={`exact_${ei}`}
                        className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        title="Exact match"
                      />
                    ))}
                    {Array.from({ length: att.misplaced }).map((_, mi) => (
                      <span
                        key={`misp_${mi}`}
                        className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                        title="Misplaced match"
                      />
                    ))}
                    {Array.from({ length: CODE_LENGTH - att.exact - att.misplaced }).map((_, fi) => (
                      <span
                        key={`fade_${fi}`}
                        className="w-3.5 h-3.5 rounded-full bg-gray-800 border border-white/10"
                        title="No match"
                      />
                    ))}
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 w-20 text-right">
                    {att.exact}G • {att.misplaced}Y
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Status Feedback Banner */}
      <div
        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          isCompleted
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : 'bg-[#10071c] border-purple-500/20 text-purple-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
};
