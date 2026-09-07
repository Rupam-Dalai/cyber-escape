import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, AlertTriangle, Sparkles, Send, RefreshCw, Eye } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface ForensicTimelineConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard?: (type: 'GENERIC') => void;
  isSubmitting?: boolean;
}

interface TraceRecord {
  id: string;
  seqNumber: string;
  shape: '▲' | '■' | '●';
  direction: '➔' | '⬅';
  nodeCount: number; // 2, 3, 4, 6
  isCorrupted: boolean;
  corruptionReason: string;
}

// 8 sequence entries:
// Valid pattern:
// 1. Odd indices (#01, #03, #05, #07) must have shape ▲ (DELTA); Even (#02, #04, #06, #08) must have ■ (CUBE).
// 2. Direction must point ➔ RIGHT.
// 3. Node count must be EVEN (2, 4, 6).
// Corrupted entries: #03 (Shape is ●), #05 (Direction is ⬅), #07 (Node count is 3 ODD).
const TRACE_ENTRIES: TraceRecord[] = [
  { id: 'rec_01', seqNumber: '#01', shape: '▲', direction: '➔', nodeCount: 4, isCorrupted: false, corruptionReason: 'Authentic: Delta on odd index, points Right, 4 nodes (even).' },
  { id: 'rec_02', seqNumber: '#02', shape: '■', direction: '➔', nodeCount: 2, isCorrupted: false, corruptionReason: 'Authentic: Cube on even index, points Right, 2 nodes (even).' },
  { id: 'rec_03', seqNumber: '#03', shape: '●', direction: '➔', nodeCount: 4, isCorrupted: true, corruptionReason: 'CORRUPTED: Shape is ● (Orb), but odd indices require ▲ (Delta).' },
  { id: 'rec_04', seqNumber: '#04', shape: '■', direction: '➔', nodeCount: 6, isCorrupted: false, corruptionReason: 'Authentic: Cube on even index, points Right, 6 nodes (even).' },
  { id: 'rec_05', seqNumber: '#05', shape: '▲', direction: '⬅', nodeCount: 2, isCorrupted: true, corruptionReason: 'CORRUPTED: Pulse vector points ⬅ (Left) instead of ➔ (Right).' },
  { id: 'rec_06', seqNumber: '#06', shape: '■', direction: '➔', nodeCount: 4, isCorrupted: false, corruptionReason: 'Authentic: Cube on even index, points Right, 4 nodes (even).' },
  { id: 'rec_07', seqNumber: '#07', shape: '▲', direction: '➔', nodeCount: 3, isCorrupted: true, corruptionReason: 'CORRUPTED: Node count is 3 (Odd) instead of required Even count.' },
  { id: 'rec_08', seqNumber: '#08', shape: '■', direction: '➔', nodeCount: 4, isCorrupted: false, corruptionReason: 'Authentic: Cube on even index, points Right, 4 nodes (even).' },
];

export const ForensicTimelineConsole: React.FC<ForensicTimelineConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [faultCount, setFaultCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Inspect the 8 trace records. Flag the 3 corrupted entries that violate established sequence rules.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleToggleEntry = (id: string) => {
    if (isCompleted) return;
    soundEngine.playTimelineFlag();
    setFlaggedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleVerifyTraces = () => {
    soundEngine.playClick();
    const correctIds = TRACE_ENTRIES.filter((r) => r.isCorrupted).map((r) => r.id);

    const hasAllCorrupted = correctIds.every((id) => flaggedIds.includes(id));
    const noFalsePositives = flaggedIds.length === correctIds.length;

    if (hasAllCorrupted && noFalsePositives) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ ALL 3 CORRUPTED ENTRIES ISOLATED! TRACE MAP SECURED! FORENSIC TRACE MAP FORGED!');
      setTimeout(() => {
        onSubmit('FORENSIC_MAP_ACTIVE');
      }, 1200);
    } else {
      soundEngine.playElectricZap();
      const nextFaults = faultCount + 1;
      setFaultCount(nextFaults);
      setStatusMessage(
        `🚨 Incorrect corruption trace! Expected exactly 3 pattern-breaking entries. (Fault ${nextFaults}/3)`
      );

      if (nextFaults >= 3) {
        soundEngine.playShortCircuitExplosion();
        setStatusMessage('🚨 SYSTEM OVERLOAD: Data corruption purge triggered diagnostic alarm!');
        setFlaggedIds([]);
        setFaultCount(0);
        if (onTriggerHazard) {
          setTimeout(() => {
            onTriggerHazard('GENERIC');
          }, 500);
        }
      }
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    setFlaggedIds([]);
    setFaultCount(0);
    setStatusMessage('Flagged records reset. Re-verify the 3 sequence harmony rules.');
  };

  return (
    <div className="bg-[#051010] border-2 border-teal-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(20,184,166,0.4)]">
            <Search className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-teal-300">
              TRACE CORRUPTED ENTRIES (PATTERN-BREAK)
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 7 • Visual Odd-One-Out Deduction • Identify 3 Records That Break Established Harmony
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-[#091f1f] hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET FLAGS</span>
        </button>
      </div>

      {/* Pattern Harmony Rules Specification Banner */}
      <div className="bg-[#071a1a] border border-teal-500/30 rounded-2xl p-3.5 space-y-2 text-xs text-teal-200">
        <div className="text-[10px] text-teal-400 font-bold uppercase flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>AUTHENTIC RECORD HARMONY RULES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="bg-[#0d2a2a] p-2 rounded-lg border border-teal-500/10">
            • <strong>Shape Alternation:</strong> Odd records (#01, #03, #05, #07) must be <strong>▲ (DELTA)</strong>. Even records (#02, #04, #06, #08) must be <strong>■ (CUBE)</strong>.
          </div>
          <div className="bg-[#0d2a2a] p-2 rounded-lg border border-teal-500/10">
            • <strong>Pulse Vector:</strong> The flow direction arrow must strictly point <strong>➔ (RIGHT)</strong>.
          </div>
          <div className="bg-[#0d2a2a] p-2 rounded-lg border border-teal-500/10">
            • <strong>Node Parity:</strong> Every valid entry contains an <strong>EVEN NUMBER</strong> of circuit dots (2, 4, or 6).
          </div>
        </div>
      </div>

      {/* 8 Trace Entries Display */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>DIAGNOSTIC TRACE LEDGER (CLICK TO FLAG CORRUPTION)</span>
          <span className="text-teal-400 text-[10px] font-bold">
            FLAGGED: {flaggedIds.length} / 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRACE_ENTRIES.map((rec) => {
            const isFlagged = flaggedIds.includes(rec.id);

            return (
              <button
                key={rec.id}
                type="button"
                disabled={isCompleted}
                onClick={() => handleToggleEntry(rec.id)}
                className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between gap-3 transition-all active:scale-95 ${
                  isFlagged
                    ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-102'
                    : 'bg-[#091f1f] border-teal-500/20 hover:border-teal-400/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400">{rec.seqNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isFlagged ? 'bg-red-500/20 border-red-400 text-red-300' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    {isFlagged ? 'FLAGGED CORRUPT' : 'INSPECT'}
                  </span>
                </div>

                <div className="flex items-center justify-around py-2 bg-black/40 rounded-xl border border-white/5">
                  {/* Shape */}
                  <div className="text-center">
                    <span className="text-2xl font-black text-teal-300">{rec.shape}</span>
                    <span className="text-[8px] text-gray-400 block uppercase">SHAPE</span>
                  </div>

                  {/* Direction */}
                  <div className="text-center">
                    <span className="text-xl font-bold text-amber-300">{rec.direction}</span>
                    <span className="text-[8px] text-gray-400 block uppercase">VECTOR</span>
                  </div>

                  {/* Circuit Nodes */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center h-7">
                      {Array.from({ length: rec.nodeCount }).map((_, ni) => (
                        <span key={ni} className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      ))}
                    </div>
                    <span className="text-[8px] text-gray-400 block uppercase">{rec.nodeCount} NODES</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 text-center">
                  {isFlagged ? (
                    <span className="text-red-400 font-bold">⚠️ Flagged as Anomaly</span>
                  ) : (
                    <span>Click to flag anomaly</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 flex-1 ${
          isCompleted
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : faultCount > 0
            ? 'bg-red-950/80 border-red-500 text-red-200'
            : 'bg-[#091c1c] border-teal-500/20 text-teal-200'
        }`}>
          {faultCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Eye className="w-4 h-4 text-teal-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>

        <button
          type="button"
          disabled={flaggedIds.length !== 3 || isCompleted || isSubmitting}
          onClick={handleVerifyTraces}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-black font-black text-xs tracking-wider shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>PURGE CORRUPTED TRACES (3/3)</span>
        </button>
      </div>
    </div>
  );
};
