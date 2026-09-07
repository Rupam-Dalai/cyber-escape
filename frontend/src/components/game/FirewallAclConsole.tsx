import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle, ArrowUp, ArrowDown, Sparkles, Send, RefreshCw } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface FirewallAclConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'LASER_TRAP') => void;
  isSubmitting?: boolean;
}

interface FilterCard {
  id: string;
  name: string;
  symbol: string;
  colorName: string;
  bgTailwind: string;
  borderTailwind: string;
  textTailwind: string;
  badgeTailwind: string;
  desc: string;
}

const INITIAL_CARDS: FilterCard[] = [
  {
    id: 'cobalt_blue',
    name: 'Cobalt Wave',
    symbol: '●',
    colorName: 'BLUE',
    bgTailwind: 'bg-blue-950/40',
    borderTailwind: 'border-blue-400',
    textTailwind: 'text-blue-300',
    badgeTailwind: 'bg-blue-500/20 text-blue-300 border-blue-400',
    desc: 'Deep frequency resonance wave filter.',
  },
  {
    id: 'violet_void',
    name: 'Violet Void',
    symbol: '■',
    colorName: 'PURPLE',
    bgTailwind: 'bg-purple-950/40',
    borderTailwind: 'border-purple-400',
    textTailwind: 'text-purple-300',
    badgeTailwind: 'bg-purple-500/20 text-purple-300 border-purple-400',
    desc: 'High-density null energy containment sink.',
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    symbol: '◆',
    colorName: 'GREEN',
    bgTailwind: 'bg-emerald-950/40',
    borderTailwind: 'border-emerald-400',
    textTailwind: 'text-emerald-300',
    badgeTailwind: 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
    desc: 'Primary core synchronization grid.',
  },
  {
    id: 'amber_flare',
    name: 'Amber Flare',
    symbol: '★',
    colorName: 'AMBER',
    bgTailwind: 'bg-amber-950/40',
    borderTailwind: 'border-amber-400',
    textTailwind: 'text-amber-300',
    badgeTailwind: 'bg-amber-500/20 text-amber-300 border-amber-400',
    desc: 'Thermal energy dispersion barrier.',
  },
  {
    id: 'crimson_prism',
    name: 'Crimson Prism',
    symbol: '▲',
    colorName: 'RED',
    bgTailwind: 'bg-red-950/40',
    borderTailwind: 'border-red-400',
    textTailwind: 'text-red-300',
    badgeTailwind: 'bg-red-500/20 text-red-300 border-red-400',
    desc: 'High-velocity perimeter refraction shield.',
  },
];

export const FirewallAclConsole: React.FC<FirewallAclConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [cards, setCards] = useState<FilterCard[]>(INITIAL_CARDS);
  const [mismatches, setMismatches] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Arrange the 5 spectral filter cards from 1 (Highest) to 5 (Lowest) according to the deduction rules.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Compute positions of each card
  const posOf = (color: string) => cards.findIndex((c) => c.colorName === color);

  // Live rule checks (0-indexed)
  const rule1Passed = posOf('GREEN') === 0; // Emerald Matrix at Position 1
  const rule2Passed = posOf('AMBER') !== -1 && posOf('PURPLE') === posOf('AMBER') + 1; // Amber immediately before Purple
  const rule3Passed = posOf('RED') !== -1 && posOf('BLUE') !== -1 && posOf('RED') < posOf('BLUE'); // Red resolves before Blue
  const rule4Passed = posOf('BLUE') !== 4; // Blue cannot be in Position 5

  const allRulesSatisfied = rule1Passed && rule2Passed && rule3Passed && rule4Passed;

  const handleMoveUp = (index: number) => {
    if (index === 0 || isCompleted) return;
    soundEngine.playClick();
    const updated = [...cards];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setCards(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === cards.length - 1 || isCompleted) return;
    soundEngine.playClick();
    const updated = [...cards];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setCards(updated);
  };

  const handleVerify = () => {
    soundEngine.playClick();

    if (allRulesSatisfied) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ ALL 4 PRIORITY CONSTRAINTS SATISFIED! PERIMETER FIREWALL SEALED! FIREWALL RULE SET FORGED!');
      setTimeout(() => {
        onSubmit('FIREWALL_RULES_ACTIVE');
      }, 1200);
    } else {
      soundEngine.playElectricZap();
      const nextMismatches = mismatches + 1;
      setMismatches(nextMismatches);
      setStatusMessage(`🚨 Invalid priority sequence! Unmet rules detected. (Fault ${nextMismatches}/3)`);

      if (nextMismatches >= 3) {
        soundEngine.playShortCircuitExplosion();
        setStatusMessage('🚨 LASER TRAP: Perimeter intrusion detected from repeated invalid filter ordering!');
        setMismatches(0);
        setTimeout(() => {
          onTriggerHazard('LASER_TRAP');
        }, 500);
      }
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    setCards(INITIAL_CARDS);
    setMismatches(0);
    setStatusMessage('Filter card sequence reset. Re-read the deduction rules.');
  };

  return (
    <div className="bg-[#140608] border-2 border-red-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <Shield className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-red-300">
              SPECTRAL FILTER PRIORITY SORTING
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 5 • Priority-Sorting Deduction • Order Cards to Satisfy All Constraints
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-[#220a0d] hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET CARDS</span>
        </button>
      </div>

      {/* Logical Constraint Rules Live Checklist */}
      <div className="bg-[#1c080b] border border-red-500/30 rounded-2xl p-3.5 space-y-2 text-xs">
        <div className="text-[10px] text-red-400 font-bold uppercase flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>PERIMETER ORDERING CONSTRAINTS</span>
          </span>
          <span className="text-[10px] text-amber-300 font-bold">
            {allRulesSatisfied ? '✓ ALL 4 RULES SATISFIED' : 'ADJUST CARD POSITIONS'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
            rule1Passed ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-[#290d11] border-white/5 text-gray-300'
          }`}>
            <span>1. <strong>Emerald Matrix (◆ GREEN)</strong> must be in <strong>Position 1</strong>.</span>
            {rule1Passed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
          </div>

          <div className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
            rule2Passed ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-[#290d11] border-white/5 text-gray-300'
          }`}>
            <span>2. <strong>Amber Flare (★ AMBER)</strong> must resolve immediately before <strong>Violet Void (■ PURPLE)</strong>.</span>
            {rule2Passed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
          </div>

          <div className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
            rule3Passed ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-[#290d11] border-white/5 text-gray-300'
          }`}>
            <span>3. <strong>Crimson Prism (▲ RED)</strong> must resolve before <strong>Cobalt Wave (● BLUE)</strong>.</span>
            {rule3Passed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
          </div>

          <div className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
            rule4Passed ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-[#290d11] border-white/5 text-gray-300'
          }`}>
            <span>4. <strong>Cobalt Wave (● BLUE)</strong> cannot be in the lowest position (<strong>Position 5</strong>).</span>
            {rule4Passed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
          </div>
        </div>
      </div>

      {/* Priority Card Ordering List */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>PRIORITY ORDER (TOP = HIGHEST PRIORITY)</span>
          <span className="text-[10px] text-red-400">USE [▲ UP] / [▼ DOWN] TO ARRANGE</span>
        </div>

        <div className="space-y-2">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${card.bgTailwind} ${card.borderTailwind} shadow-lg`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center font-black text-sm text-gray-300">
                  #{idx + 1}
                </span>

                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl font-black border ${card.badgeTailwind}`}>
                  {card.symbol}
                </span>

                <div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span>{card.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${card.badgeTailwind}`}>
                      {card.colorName}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{card.desc}</span>
                </div>
              </div>

              {/* Up / Down Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0 || isCompleted}
                  onClick={() => handleMoveUp(idx)}
                  className="w-8 h-8 rounded-lg bg-[#280d12] hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all disabled:opacity-25 active:scale-95"
                  title="Move Higher in Priority"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={idx === cards.length - 1 || isCompleted}
                  onClick={() => handleMoveDown(idx)}
                  className="w-8 h-8 rounded-lg bg-[#280d12] hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all disabled:opacity-25 active:scale-95"
                  title="Move Lower in Priority"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 flex-1 ${
          mismatches > 0 ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-[#1b080b] border-red-500/20 text-red-200'
        }`}>
          {mismatches > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Shield className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>

        <button
          type="button"
          disabled={isCompleted || isSubmitting}
          onClick={handleVerify}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black font-black text-xs tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>ENGAGE PERIMETER FILTER</span>
        </button>
      </div>
    </div>
  );
};
