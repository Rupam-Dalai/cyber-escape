import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Send, Repeat } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface ApiEndpointConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'MEMORY_BLAST') => void;
  isSubmitting?: boolean;
}

interface RingSymbol {
  id: string;
  symbol: string;
  name: string;
  pos: number; // 0 to 5 (clockwise)
  color: string;
}

const RING_SYMBOLS: RingSymbol[] = [
  { id: 'HEX', symbol: '⬡', name: 'HEXAGON', pos: 0, color: 'text-cyan-300' },
  { id: 'DLT', symbol: '▲', name: 'DELTA', pos: 1, color: 'text-rose-300' },
  { id: 'DIA', symbol: '◆', name: 'DIAMOND', pos: 2, color: 'text-emerald-300' },
  { id: 'CIR', symbol: '●', name: 'CIRCLE', pos: 3, color: 'text-amber-300' },
  { id: 'SQR', symbol: '■', name: 'SQUARE', pos: 4, color: 'text-purple-300' },
  { id: 'STR', symbol: '★', name: 'STAR', pos: 5, color: 'text-blue-300' },
];

interface HandshakeToken {
  id: string;
  label: string;
  inputSymbolId: string;
  isInverted: boolean; // if inverted, step counter-clockwise
  stepOffset: number; // 2 steps
  expectedOutputId: string;
}

// Target pairs deduced by the rules:
// Token 1: HEX (pos 0) + Normal (clockwise 2) => pos 2: DIA (Diamond)
// Token 2: DLT (pos 1) + Inverted (counter-clockwise 2) => pos 5: STR (Star)
// Token 3: SQR (pos 4) + Normal (clockwise 2) => pos 0: HEX (Hexagon)
const HANDSHAKE_TOKENS: HandshakeToken[] = [
  { id: 'hs_1', label: 'HANDSHAKE ALPHA', inputSymbolId: 'HEX', isInverted: false, stepOffset: 2, expectedOutputId: 'DIA' },
  { id: 'hs_2', label: 'HANDSHAKE BETA (⚡ INVERTED)', inputSymbolId: 'DLT', isInverted: true, stepOffset: 2, expectedOutputId: 'STR' },
  { id: 'hs_3', label: 'HANDSHAKE GAMMA', inputSymbolId: 'SQR', isInverted: false, stepOffset: 2, expectedOutputId: 'HEX' },
];

export const ApiEndpointConsole: React.FC<ApiEndpointConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [selectedPairs, setSelectedPairs] = useState<{ [tokenIndex: string]: string }>({});
  const [activeTokenId, setActiveTokenId] = useState<string>('hs_1');
  const [faultCount, setFaultCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Apply the ring rotation rules to match each handshake input token to its corresponding partner glyph.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleSelectPartner = (symbolId: string) => {
    if (isCompleted) return;
    soundEngine.playClick();
    setSelectedPairs((prev) => ({ ...prev, [activeTokenId]: symbolId }));

    // Auto-advance to next unfilled token
    const nextUnfilled = HANDSHAKE_TOKENS.find((t) => t.id !== activeTokenId && !selectedPairs[t.id]);
    if (nextUnfilled) {
      setActiveTokenId(nextUnfilled.id);
    }
  };

  const handleVerifyAll = () => {
    soundEngine.playClick();

    const isAllValid = HANDSHAKE_TOKENS.every(
      (t) => selectedPairs[t.id] === t.expectedOutputId
    );

    if (isAllValid) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ HANDSHAKE SEQUENCING SYNCHRONIZED! PROTOCOL DISPATCH VERIFIED! CLEAN API CALL SECURED!');
      setTimeout(() => {
        onSubmit('CLEAN_API_CALL_ACTIVE');
      }, 1200);
    } else {
      soundEngine.playElectricZap();
      const nextFaults = faultCount + 1;
      setFaultCount(nextFaults);
      setStatusMessage(`🚨 Handshake pair mismatch! Check rotational rules. (Fault ${nextFaults}/3)`);

      if (nextFaults >= 3) {
        soundEngine.playShortCircuitExplosion();
        setStatusMessage('🚨 MEMORY BLAST: Synchronizer buffer crashed from corrupt handshake sequencing!');
        setSelectedPairs({});
        setFaultCount(0);
        setTimeout(() => {
          onTriggerHazard('MEMORY_BLAST');
        }, 500);
      }
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    setSelectedPairs({});
    setActiveTokenId('hs_1');
    setFaultCount(0);
    setStatusMessage('Handshake slots reset. Re-verify the clockwise/counter-clockwise offsets.');
  };

  return (
    <div className="bg-[#05120c] border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Cpu className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-emerald-300">
              HANDSHAKE PATTERN-PAIRING SEQUENCER
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 4 • Cyclical Offset Logic • Deduce Pairing from Perimeter Ring Rules
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-[#0c1f17] hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Logical Rule Spec Banner */}
      <div className="bg-[#081b12] border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 text-xs text-emerald-200">
        <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>HANDSHAKE ROTATIONAL RULES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#0d261b] p-2 rounded-lg border border-emerald-500/10">
            • <strong>Standard Tokens:</strong> Pair with the symbol <strong>2 steps CLOCKWISE (↷)</strong> along the perimeter ring.
          </div>
          <div className="bg-[#0d261b] p-2 rounded-lg border border-emerald-500/10">
            • <strong>Inverted Tokens (⚡):</strong> Reverse direction to <strong>2 steps COUNTER-CLOCKWISE (↶)</strong>.
          </div>
        </div>
      </div>

      {/* Perimeter Ring Visual Layout */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
        {/* Ring Display */}
        <div className="relative w-56 h-56 rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)]">
          <div className="absolute text-center">
            <span className="text-[10px] text-emerald-400 font-bold block">PERIMETER</span>
            <span className="text-[9px] text-gray-400">CYCLICAL RING</span>
          </div>

          {/* 6 Circularly Positioned Symbols */}
          {RING_SYMBOLS.map((s) => {
            const angle = (s.pos * 60 - 90) * (Math.PI / 180);
            const radius = 88;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <div
                key={s.id}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                className="absolute w-10 h-10 rounded-xl bg-[#091e15] border-2 border-emerald-400/50 flex flex-col items-center justify-center shadow-lg"
              >
                <span className={`text-lg font-black ${s.color}`}>{s.symbol}</span>
                <span className="text-[7px] text-gray-400">{s.pos}</span>
              </div>
            );
          })}
        </div>

        {/* Handshake Slot Pair Selectors */}
        <div className="w-full md:w-80 space-y-2.5">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            HANDSHAKE TOKENS TO PAIR
          </div>

          {HANDSHAKE_TOKENS.map((t) => {
            const inputSym = RING_SYMBOLS.find((s) => s.id === t.inputSymbolId);
            const selectedOutput = RING_SYMBOLS.find((s) => s.id === selectedPairs[t.id]);
            const isActive = activeTokenId === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTokenId(t.id);
                }}
                className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]'
                    : 'bg-[#0a1b13] border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#040e09] border border-emerald-400/40 flex items-center justify-center text-lg font-black text-emerald-300">
                    {inputSym?.symbol}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{t.label}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80">
                      {t.isInverted ? '2 steps ↶ counter-clockwise' : '2 steps ↷ clockwise'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">➔</span>
                  <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-lg font-black ${
                    selectedOutput
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'border-dashed border-gray-600 text-gray-500'
                  }`}>
                    {selectedOutput ? selectedOutput.symbol : '?'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Partner Glyph Selection Palette */}
      <div className="space-y-2 pt-1 border-t border-emerald-500/20">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>SELECT PARTNER GLYPH FOR ACTIVE TOKEN</span>
          <span className="text-emerald-400 text-[10px]">
            ACTIVE: {HANDSHAKE_TOKENS.find((t) => t.id === activeTokenId)?.label}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {RING_SYMBOLS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectPartner(s.id)}
              className="p-3 rounded-2xl bg-[#091f16] border-2 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/40 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md"
            >
              <span className={`text-2xl font-black ${s.color}`}>{s.symbol}</span>
              <span className="text-[9px] font-bold text-gray-300">{s.name.slice(0, 4)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 flex-1 ${
          faultCount > 0 ? 'bg-red-950/60 border-red-500/50 text-red-200' : 'bg-[#091a12] border-emerald-500/20 text-emerald-200'
        }`}>
          {faultCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Repeat className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>

        <button
          type="button"
          disabled={Object.keys(selectedPairs).length !== HANDSHAKE_TOKENS.length || isCompleted || isSubmitting}
          onClick={handleVerifyAll}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>VERIFY HANDSHAKE SEQUENCING</span>
        </button>
      </div>
    </div>
  );
};
