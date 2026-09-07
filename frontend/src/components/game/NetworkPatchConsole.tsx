import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, CheckCircle2, AlertTriangle, HelpCircle, Sparkles, RefreshCw } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface NetworkPatchConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'DATA_SURGE') => void;
  isSubmitting?: boolean;
}

interface SymbolPort {
  id: string;
  symbol: string;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  correctTerminal: number; // 1-indexed (1 to 4)
}

const SYMBOL_PORTS: SymbolPort[] = [
  { id: 'port_delta', symbol: '▲', name: 'DELTA', color: 'bg-cyan-500/20', borderColor: 'border-cyan-400', textColor: 'text-cyan-300', correctTerminal: 1 },
  { id: 'port_cube', symbol: '■', name: 'CUBE', color: 'bg-purple-500/20', borderColor: 'border-purple-400', textColor: 'text-purple-300', correctTerminal: 2 },
  { id: 'port_diamond', symbol: '◆', name: 'DIAMOND', color: 'bg-emerald-500/20', borderColor: 'border-emerald-400', textColor: 'text-emerald-300', correctTerminal: 3 },
  { id: 'port_orb', symbol: '●', name: 'ORB', color: 'bg-amber-500/20', borderColor: 'border-amber-400', textColor: 'text-amber-300', correctTerminal: 4 },
];

const TERMINALS = [
  { id: 1, label: 'TERMINAL #1', socketCode: 'TRM-01' },
  { id: 2, label: 'TERMINAL #2', socketCode: 'TRM-02' },
  { id: 3, label: 'TERMINAL #3', socketCode: 'TRM-03' },
  { id: 4, label: 'TERMINAL #4', socketCode: 'TRM-04' },
];

const DEDUCTION_CLUES = [
  'RULE 1: Diamond [◆] routes directly to Terminal #3.',
  'RULE 2: Cube [■] connects to an even-numbered Terminal.',
  'RULE 3: Delta [▲] connects to a lower Terminal number than Orb [●].',
  'RULE 4: Orb [●] is NEVER adjacent (immediately next) to Delta [▲].',
];

export const NetworkPatchConsole: React.FC<NetworkPatchConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  // connections: map of portId -> terminalId (1-4)
  const [connections, setConnections] = useState<{ [portId: string]: number }>({});
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [mismatches, setMismatches] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Select a Symbol Port on the left, then connect it to its deduced Terminal on the right.'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showMatrixHelper, setShowMatrixHelper] = useState<boolean>(false);
  const [gridNotes, setGridNotes] = useState<{ [key: string]: 'yes' | 'no' | 'none' }>({});

  const toggleGridNote = (portId: string, terminalId: number) => {
    const key = `${portId}_${terminalId}`;
    const cur = gridNotes[key] || 'none';
    const next = cur === 'none' ? 'yes' : cur === 'yes' ? 'no' : 'none';
    setGridNotes((prev) => ({ ...prev, [key]: next }));
  };

  const handlePortClick = (portId: string) => {
    if (connections[portId] !== undefined) return;
    soundEngine.playClick();
    setSelectedPortId(portId);
    const p = SYMBOL_PORTS.find((sp) => sp.id === portId);
    setStatusMessage(`Selected Port ${p?.symbol} (${p?.name}). Select target Terminal socket.`);
  };

  const handleTerminalClick = (terminalId: number) => {
    if (!selectedPortId) {
      soundEngine.playClick();
      setStatusMessage('⚠️ Select a Symbol Port on the left first!');
      return;
    }

    // Check if terminal is already occupied
    const occupiedBy = Object.entries(connections).find(([_, tId]) => tId === terminalId);
    if (occupiedBy) {
      soundEngine.playClick();
      setStatusMessage(`⚠️ Terminal #${terminalId} is already connected! Select another.`);
      return;
    }

    const port = SYMBOL_PORTS.find((sp) => sp.id === selectedPortId);
    if (!port) return;

    if (port.correctTerminal === terminalId) {
      soundEngine.playWireConnect();
      soundEngine.playSuccess();
      const updated = { ...connections, [selectedPortId]: terminalId };
      setConnections(updated);
      setSelectedPortId(null);
      setStatusMessage(`✓ Port ${port.symbol} (${port.name}) patched correctly to Terminal #${terminalId}.`);

      if (Object.keys(updated).length === SYMBOL_PORTS.length) {
        soundEngine.playSuccess();
        soundEngine.playShield();
        setIsCompleted(true);
        setStatusMessage('✓ DEDUCTION COMPLETE: ALL SYMBOL PORTS ROUTED! FIREWALL PATCH SECURED!');
        setTimeout(() => {
          onSubmit('FIREWALL_PATCH_ACTIVE');
        }, 1200);
      }
    } else {
      soundEngine.playElectricZap();
      const newMismatches = mismatches + 1;
      setMismatches(newMismatches);
      setStatusMessage(`🚨 Invalid logical routing for ${port.symbol}! Violates deduction rules. (Fault ${newMismatches}/3)`);

      if (newMismatches >= 3) {
        soundEngine.playShortCircuitExplosion();
        setStatusMessage('🚨 OPTICAL SURGE: Switchboard overloaded from mismatched routing!');
        setConnections({});
        setSelectedPortId(null);
        setMismatches(0);
        setTimeout(() => {
          onTriggerHazard('DATA_SURGE');
        }, 500);
      }
    }
  };

  const handleReset = () => {
    soundEngine.playClick();
    setConnections({});
    setSelectedPortId(null);
    setMismatches(0);
    setStatusMessage('Cabling array reset. Re-verify the deduction rules and reconnect.');
  };

  return (
    <div className="bg-[#080d1a] border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-6 text-white font-mono space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Network className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wider text-cyan-300">
              OPTICAL DEDUCTION PATCH PANEL
            </h3>
            <span className="text-[11px] text-gray-400">
              Sector 1 • Pure Elimination Grid Puzzle • Zero Technical Syntax Required
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMatrixHelper((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showMatrixHelper ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-[#101726] border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showMatrixHelper ? 'HIDE GRID' : 'SCRATCHPAD GRID'}</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-[#101726] hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Deduction Clues Card */}
      <div className="bg-[#050b14] border border-cyan-500/30 rounded-2xl p-3.5 space-y-1.5 shadow-inner">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>FACILITY DEDUCTION SPECIFICATIONS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {DEDUCTION_CLUES.map((clue, idx) => (
            <div key={idx} className="bg-[#0b1220] border border-cyan-500/10 rounded-lg p-2 text-cyan-100/90 flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
              <span className="leading-snug">{clue.replace(/^RULE \d: /, '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Interactive Deduction Matrix Scratchpad */}
      <AnimatePresence>
        {showMatrixHelper && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#070e1d] border border-cyan-500/30 rounded-2xl p-3 text-xs space-y-2"
          >
            <div className="text-[10px] text-cyan-300 font-bold uppercase">
              SCRATCHPAD ELIMINATION MATRIX (Click cell to toggle: — / ✓ / ✗)
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
              <div className="font-bold text-gray-400 text-[11px] py-1">PORT</div>
              {TERMINALS.map((t) => (
                <div key={t.id} className="font-bold text-cyan-300 text-[11px] py-1">
                  #{t.id}
                </div>
              ))}
              {SYMBOL_PORTS.map((p) => (
                <React.Fragment key={p.id}>
                  <div className={`font-bold flex items-center justify-center gap-1 py-1 rounded bg-[#0e172a] ${p.textColor}`}>
                    <span>{p.symbol}</span>
                    <span className="text-[9px]">{p.name}</span>
                  </div>
                  {TERMINALS.map((t) => {
                    const mark = gridNotes[`${p.id}_${t.id}`] || 'none';
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleGridNote(p.id, t.id)}
                        className={`py-1 rounded border font-black transition-all ${
                          mark === 'yes'
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                            : mark === 'no'
                            ? 'bg-red-500/30 border-red-400 text-red-300'
                            : 'bg-[#0d1629] border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {mark === 'yes' ? '✓' : mark === 'no' ? '✗' : '—'}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Cabling Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Source Symbol Ports */}
        <div className="space-y-3">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>INPUT SYMBOL PORTS</span>
            <span className="text-[10px] text-cyan-400">SELECT SOURCE</span>
          </div>

          <div className="space-y-2.5">
            {SYMBOL_PORTS.map((p) => {
              const isConnected = connections[p.id] !== undefined;
              const isSelected = selectedPortId === p.id;
              const connectedTerminalId = connections[p.id];

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isConnected || isCompleted}
                  onClick={() => handlePortClick(p.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    isConnected
                      ? 'bg-emerald-950/40 border-emerald-500/50 opacity-90 cursor-default'
                      : isSelected
                      ? `${p.color} ${p.borderColor} shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.02]`
                      : 'bg-[#0a101f] border-white/10 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl font-black border ${p.borderColor} ${p.color} ${p.textColor}`}>
                      {p.symbol}
                    </span>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>{p.name} PORT</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {isConnected ? `Routed to Terminal #${connectedTerminalId}` : 'Awaiting connection'}
                      </span>
                    </div>
                  </div>

                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="text-xs text-cyan-400 font-bold px-2 py-1 bg-cyan-500/10 rounded-lg">
                      {isSelected ? 'ACTIVE' : 'READY'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Destination Terminals */}
        <div className="space-y-3">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>OUTPUT TERMINALS</span>
            <span className="text-[10px] text-cyan-400">SELECT TARGET</span>
          </div>

          <div className="space-y-2.5">
            {TERMINALS.map((t) => {
              const connectedPortId = Object.keys(connections).find((k) => connections[k] === t.id);
              const connectedPort = SYMBOL_PORTS.find((sp) => sp.id === connectedPortId);
              const isOccupied = !!connectedPort;

              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={isOccupied || isCompleted}
                  onClick={() => handleTerminalClick(t.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    isOccupied
                      ? 'bg-emerald-950/40 border-emerald-500/50 opacity-90 cursor-default'
                      : 'bg-[#0a101f] border-white/10 hover:border-cyan-400 hover:bg-cyan-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-sm font-bold">
                      #{t.id}
                    </span>
                    <div>
                      <div className="text-sm font-black text-white">{t.label}</div>
                      <span className="text-[10px] text-cyan-400/70">{t.socketCode}</span>
                    </div>
                  </div>

                  {connectedPort ? (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-black border ${connectedPort.borderColor} ${connectedPort.color} ${connectedPort.textColor}`}>
                        {connectedPort.symbol} {connectedPort.name}
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-bold px-2 py-1 bg-white/5 rounded-lg">
                      OPEN SOCKET
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Status Feedback Banner */}
      <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
        isCompleted
          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
          : mismatches > 0
          ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
          : 'bg-[#060a14] border-cyan-500/20 text-cyan-200'
      }`}>
        <div className="flex items-center gap-2.5">
          {mismatches > 0 && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{statusMessage}</span>
        </div>

        {mismatches > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-amber-400 shrink-0">
            <span>FAULTS:</span>
            <span className="font-bold">{mismatches} / 3</span>
          </div>
        )}
      </div>
    </div>
  );
};
