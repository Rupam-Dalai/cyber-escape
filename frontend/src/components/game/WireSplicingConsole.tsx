import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Activity } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface WireSplicingConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'SHORT_CIRCUIT') => void;
  isSubmitting?: boolean;
}

type WireColor = 'RED' | 'AMBER' | 'CYAN' | 'PURPLE';

interface NodePair {
  color: WireColor;
  label: string;
  start: [number, number]; // [row, col]
  end: [number, number];
  hexColor: string;
  glowColor: string;
  bgTailwind: string;
  borderTailwind: string;
  textTailwind: string;
}

const NODE_PAIRS: Record<WireColor, NodePair> = {
  RED: {
    color: 'RED',
    label: 'BUS-A (RED)',
    start: [0, 0],
    end: [3, 2],
    hexColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    bgTailwind: 'bg-red-500',
    borderTailwind: 'border-red-400',
    textTailwind: 'text-red-400',
  },
  AMBER: {
    color: 'AMBER',
    label: 'BUS-B (AMBER)',
    start: [0, 3],
    end: [4, 0],
    hexColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    bgTailwind: 'bg-amber-500',
    borderTailwind: 'border-amber-400',
    textTailwind: 'text-amber-400',
  },
  CYAN: {
    color: 'CYAN',
    label: 'BUS-C (CYAN)',
    start: [0, 4],
    end: [4, 4],
    hexColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.8)',
    bgTailwind: 'bg-cyan-500',
    borderTailwind: 'border-cyan-400',
    textTailwind: 'text-cyan-400',
  },
  PURPLE: {
    color: 'PURPLE',
    label: 'BUS-D (PURPLE)',
    start: [1, 0],
    end: [3, 1],
    hexColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    bgTailwind: 'bg-purple-500',
    borderTailwind: 'border-purple-400',
    textTailwind: 'text-purple-400',
  },
};

const OBSTACLES: [number, number][] = [[2, 1]]; // Damaged Capacitor Block

const GRID_SIZE = 5;

export const WireSplicingConsole: React.FC<WireSplicingConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  // Paths for each color: array of [r, c] points
  const [paths, setPaths] = useState<Record<WireColor, [number, number][]>>({
    RED: [[0, 0]],
    AMBER: [[0, 3]],
    CYAN: [[0, 4]],
    PURPLE: [[1, 0]],
  });

  const [activeColor, setActiveColor] = useState<WireColor | null>(null);
  const [shortCircuits, setShortCircuits] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Select a terminal, then draw a non-crossing PCB trace to its matching terminal.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Helper to test if a cell is an endpoint of a given color
  const isEndpoint = (r: number, c: number, color: WireColor): boolean => {
    const pair = NODE_PAIRS[color];
    return (
      (pair.start[0] === r && pair.start[1] === c) ||
      (pair.end[0] === r && pair.end[1] === c)
    );
  };

  // Check if a cell is any endpoint
  const getEndpointColor = (r: number, c: number): WireColor | null => {
    for (const key of Object.keys(NODE_PAIRS) as WireColor[]) {
      if (isEndpoint(r, c, key)) return key;
    }
    return null;
  };

  // Check which path occupies a cell
  const getCellOccupant = (r: number, c: number): { color: WireColor; index: number } | null => {
    for (const color of Object.keys(paths) as WireColor[]) {
      const p = paths[color];
      const idx = p.findIndex(([pr, pc]) => pr === r && pc === c);
      if (idx !== -1) {
        return { color, index: idx };
      }
    }
    return null;
  };

  // Is an individual color's circuit complete?
  const isCircuitComplete = (color: WireColor): boolean => {
    const p = paths[color];
    if (p.length < 2) return false;
    const first = p[0];
    const last = p[p.length - 1];
    const pair = NODE_PAIRS[color];
    return (
      (first[0] === pair.start[0] && first[1] === pair.start[1] && last[0] === pair.end[0] && last[1] === pair.end[1]) ||
      (first[0] === pair.end[0] && first[1] === pair.end[1] && last[0] === pair.start[0] && last[1] === pair.start[1])
    );
  };

  // Check if all 4 circuits are complete
  const checkVictory = (currentPaths: Record<WireColor, [number, number][]>) => {
    const allDone = (Object.keys(NODE_PAIRS) as WireColor[]).every((color) => {
      const p = currentPaths[color];
      if (p.length < 2) return false;
      const first = p[0];
      const last = p[p.length - 1];
      const pair = NODE_PAIRS[color];
      return (
        (first[0] === pair.start[0] && first[1] === pair.start[1] && last[0] === pair.end[0] && last[1] === pair.end[1]) ||
        (first[0] === pair.end[0] && first[1] === pair.end[1] && last[0] === pair.start[0] && last[1] === pair.start[1])
      );
    });

    if (allDone) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ ALL 4 CIRCUIT BUSES SYNCHRONIZED WITHOUT CROSSING! POWER SURGE CELL CHARGED!');
      setTimeout(() => {
        onSubmit('POWER_SURGE_CHARGED');
      }, 1200);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (isCompleted) return;

    // 1. Is it an obstacle?
    if (OBSTACLES.some(([or, oc]) => or === r && oc === c)) {
      soundEngine.playElectricZap();
      triggerShortCircuit('Short circuit! Cannot route through blown capacitor block.');
      return;
    }

    const endpointColor = getEndpointColor(r, c);

    // 2. If clicking on an endpoint
    if (endpointColor) {
      soundEngine.playClick();
      // If we don't have an active color or clicked another endpoint, switch to this color
      if (activeColor !== endpointColor) {
        setActiveColor(endpointColor);
        // Start new path from this endpoint
        const updated = { ...paths, [endpointColor]: [[r, c]] };
        setPaths(updated);
        setStatusMessage(`Active trace: ${NODE_PAIRS[endpointColor].label}. Click adjacent cells to route.`);
        return;
      }
    }

    // 3. If we have an active color selected, try extending path to (r, c)
    if (activeColor) {
      const currentPath = paths[activeColor];
      const lastCell = currentPath[currentPath.length - 1];

      // Check adjacency (up, down, left, right)
      const dist = Math.abs(lastCell[0] - r) + Math.abs(lastCell[1] - c);
      if (dist !== 1) {
        soundEngine.playClick();
        setStatusMessage('⚠️ Traces must route to strictly adjacent cells (up/down/left/right).');
        return;
      }

      // If stepping back onto previous cell in same path, backtrack
      if (currentPath.length > 1) {
        const prevCell = currentPath[currentPath.length - 2];
        if (prevCell[0] === r && prevCell[1] === c) {
          soundEngine.playWireConnect();
          const backtracked = currentPath.slice(0, -1);
          const updated = { ...paths, [activeColor]: backtracked };
          setPaths(updated);
          return;
        }
      }

      // Check if target is an endpoint of a DIFFERENT color
      if (endpointColor && endpointColor !== activeColor) {
        soundEngine.playElectricZap();
        triggerShortCircuit(`Short circuit! Cannot cross into ${NODE_PAIRS[endpointColor].label} terminal.`);
        return;
      }

      // Check if target is already occupied by another path
      const occupant = getCellOccupant(r, c);
      if (occupant && occupant.color !== activeColor) {
        soundEngine.playElectricZap();
        triggerShortCircuit(`Phase short! Traces cannot cross or overlap with ${NODE_PAIRS[occupant.color].label}.`);
        return;
      }

      // Valid extension
      soundEngine.playWireConnect();
      const extended = [...currentPath, [r, c] as [number, number]];
      const updatedPaths = { ...paths, [activeColor]: extended };
      setPaths(updatedPaths);

      // Check if reached target endpoint
      const pair = NODE_PAIRS[activeColor];
      const reachedEnd =
        (extended[0][0] === pair.start[0] && extended[0][1] === pair.start[1] && r === pair.end[0] && c === pair.end[1]) ||
        (extended[0][0] === pair.end[0] && extended[0][1] === pair.end[1] && r === pair.start[0] && c === pair.start[1]);

      if (reachedEnd) {
        soundEngine.playSuccess();
        setStatusMessage(`✓ ${NODE_PAIRS[activeColor].label} connected successfully!`);
        setActiveColor(null);
        checkVictory(updatedPaths);
      }
    }
  };

  const triggerShortCircuit = (msg: string) => {
    const nextFaults = shortCircuits + 1;
    setShortCircuits(nextFaults);
    setStatusMessage(`🚨 ${msg} (Short Circuit Fault ${nextFaults}/3)`);

    if (nextFaults >= 3) {
      soundEngine.playShortCircuitExplosion();
      setStatusMessage('🚨 CRITICAL BREAKER ARC: Transformer shorted from repeated line crossing!');
      setPaths({
        RED: [[0, 0]],
        AMBER: [[0, 3]],
        CYAN: [[0, 4]],
        PURPLE: [[1, 0]],
      });
      setActiveColor(null);
      setShortCircuits(0);
      setTimeout(() => {
        onTriggerHazard('SHORT_CIRCUIT');
      }, 500);
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    setPaths({
      RED: [[0, 0]],
      AMBER: [[0, 3]],
      CYAN: [[0, 4]],
      PURPLE: [[1, 0]],
    });
    setActiveColor(null);
    setShortCircuits(0);
    setStatusMessage('PCB traces cleared. Click any colored terminal to start routing.');
  };

  return (
    <div className="bg-[#0c0904] border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-amber-300">
              NON-CROSSING CIRCUIT ROUTER
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 2 • Flow & Connection Puzzle • Connect Matching Pairs Without Crossing
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-[#17120a] hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET TRACES</span>
        </button>
      </div>

      {/* Instructions & Circuit Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(NODE_PAIRS) as WireColor[]).map((col) => {
          const pair = NODE_PAIRS[col];
          const isDone = isCircuitComplete(col);
          const isActive = activeColor === col;

          return (
            <button
              key={col}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveColor(col);
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : isActive
                  ? `${pair.bgTailwind}/30 ${pair.borderTailwind} shadow-lg scale-102`
                  : 'bg-[#151006] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${pair.bgTailwind}`} />
                <span className={`text-[11px] font-bold ${pair.textTailwind}`}>{col}</span>
              </div>
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[9px] text-gray-400">{isActive ? 'ROUTING' : 'READY'}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5x5 Circuit Routing Grid Canvas/Grid */}
      <div className="max-w-[420px] mx-auto p-4 bg-[#080602] border-2 border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-2">
        <div className="grid grid-cols-5 gap-2 select-none">
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const occupant = getCellOccupant(r, c);
              const isObs = OBSTACLES.some(([or, oc]) => or === r && oc === c);
              const epColor = getEndpointColor(r, c);

              let cellBg = 'bg-[#141008] border-amber-500/20';
              let cellContent: React.ReactNode = null;

              if (isObs) {
                cellBg = 'bg-red-950/60 border-red-500/50 text-red-400';
                cellContent = <span className="text-xs font-black">⚡ BLOWN</span>;
              } else if (epColor) {
                const p = NODE_PAIRS[epColor];
                cellBg = `${p.bgTailwind}/30 ${p.borderTailwind} shadow-[0_0_12px_${p.glowColor}]`;
                cellContent = (
                  <div className="flex flex-col items-center justify-center">
                    <span className={`w-4 h-4 rounded-full ${p.bgTailwind} shadow-inner animate-pulse`} />
                    <span className="text-[9px] font-black text-white mt-0.5">{epColor[0]}</span>
                  </div>
                );
              } else if (occupant) {
                const p = NODE_PAIRS[occupant.color];
                cellBg = `${p.bgTailwind}/25 border-${occupant.color.toLowerCase()}-400 shadow-[0_0_8px_${p.glowColor}]`;
                cellContent = <span className={`w-3 h-3 rounded-full ${p.bgTailwind}`} />;
              }

              return (
                <button
                  key={`${r}_${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 ${cellBg} ${
                    !isObs ? 'hover:scale-105 hover:border-amber-400/80 cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  {cellContent}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Dynamic Status Feedback Banner */}
      <div
        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          isCompleted
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : shortCircuits > 0
            ? 'bg-red-950/60 border-red-500/50 text-red-200'
            : 'bg-[#120d04] border-amber-500/20 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {shortCircuits > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>

        {shortCircuits > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-red-400 shrink-0">
            <span>FAULTS:</span>
            <span className="font-bold">{shortCircuits} / 3</span>
          </div>
        )}
      </div>
    </div>
  );
};
