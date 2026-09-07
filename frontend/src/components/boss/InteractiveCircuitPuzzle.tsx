import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Sparkles, RefreshCw } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface InteractiveCircuitPuzzleProps {
  onSolve: (isCorrect: boolean) => void;
  onCancel?: () => void;
}

interface TileOption {
  id: string;
  name: string;
  icon: string;
  isConductor: boolean;
  type: 'conductor' | 'insulator';
}

const CIRCUIT_TILES: TileOption[] = [
  { id: 'copper_wire', name: 'Copper Wire', icon: '🔌', isConductor: true, type: 'conductor' },
  { id: 'metal_key', name: 'Metal Key', icon: '🗝️', isConductor: true, type: 'conductor' },
  { id: 'paperclip', name: 'Iron Paperclip', icon: '🖇️', isConductor: true, type: 'conductor' },
  { id: 'ruler', name: 'Plastic Ruler', icon: '📏', isConductor: false, type: 'insulator' },
  { id: 'pencil', name: 'Wooden Pencil', icon: '✏️', isConductor: false, type: 'insulator' },
  { id: 'eraser', name: 'Rubber Eraser', icon: '🧱', isConductor: false, type: 'insulator' },
];

export const InteractiveCircuitPuzzle: React.FC<InteractiveCircuitPuzzleProps> = ({ onSolve, onCancel }) => {
  const [selectedTile, setSelectedTile] = useState<TileOption | null>(null);
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const isCircuitComplete = Boolean(selectedTile?.isConductor && isSwitchClosed);

  const handleTileSelect = (tile: TileOption) => {
    soundEngine.playClick();
    setSelectedTile(tile);
    setFeedbackMsg(null);
  };

  const handleToggleSwitch = () => {
    soundEngine.playClick();
    setIsSwitchClosed((prev) => !prev);
  };

  const handleSubmit = () => {
    if (!selectedTile) {
      setFeedbackMsg('⚠️ Select a component tile to bridge the terminal gap!');
      soundEngine.playError();
      return;
    }

    if (!isSwitchClosed) {
      setFeedbackMsg('⚠️ The main knife switch is OPEN! Close the switch to complete the circuit.');
      soundEngine.playError();
      return;
    }

    if (isCircuitComplete) {
      soundEngine.playSuccess();
      setIsSubmitted(true);
      setFeedbackMsg('⚡ CIRCUIT COMPLETE! Electric current is flowing and the light bulb is fully powered!');
      setTimeout(() => {
        onSolve(true);
      }, 1400);
    } else {
      soundEngine.playError();
      setFeedbackMsg(`❌ ${selectedTile.name} is an INSULATOR! Electric current cannot flow across non-metallic insulators.`);
      setTimeout(() => {
        onSolve(false);
      }, 1600);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#070A12] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] font-mono text-white space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-cyan-300">INTERACTIVE CIRCUIT PUZZLE SOLVER</h3>
            <p className="text-xs text-hunt-textMuted font-sans">Bridge the gap with a conductor and close the switch to power the bulb!</p>
          </div>
        </div>
      </div>

      {/* Visual Circuit Schematic Canvas */}
      <div className="relative w-full h-64 bg-gradient-to-b from-[#0B1220] to-[#060A10] border-2 border-cyan-500/30 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
        
        {/* Ambient Current Glow */}
        {isCircuitComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-yellow-500/10 rounded-2xl pointer-events-none"
          />
        )}

        {/* Top Wire Segment & Light Bulb */}
        <div className="flex items-center justify-between px-8 relative">
          
          {/* Wire Top Left */}
          <div className="h-2 flex-1 bg-cyan-900 border-t border-b border-cyan-400 relative overflow-hidden">
            {isCircuitComplete && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300 to-transparent w-1/2 h-full"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>

          {/* Light Bulb Assembly */}
          <div className="relative mx-4 flex flex-col items-center">
            <motion.div
              animate={isCircuitComplete ? { scale: [1, 1.1, 1], filter: 'drop-shadow(0 0 25px rgba(250,204,21,1))' } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl transition-all duration-300 ${
                isCircuitComplete
                  ? 'bg-yellow-400 border-yellow-200 text-yellow-950 shadow-[0_0_40px_rgba(250,204,21,0.9)]'
                  : 'bg-gray-900/90 border-gray-700 text-gray-600'
              }`}
            >
              💡
            </motion.div>
            <span className={`text-[10px] font-bold mt-1 uppercase ${isCircuitComplete ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`}>
              {isCircuitComplete ? 'POWERED ON' : 'OFF'}
            </span>
          </div>

          {/* Wire Top Right */}
          <div className="h-2 flex-1 bg-cyan-900 border-t border-b border-cyan-400 relative overflow-hidden">
            {isCircuitComplete && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300 to-transparent w-1/2 h-full"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>

        </div>

        {/* Middle Level: Switch Node & Battery Cell */}
        <div className="flex items-center justify-between px-6 py-2">
          
          {/* Battery Cell (+ / -) */}
          <div className="bg-[#111A29] border border-cyan-500/40 rounded-xl p-3 flex flex-col items-center gap-1 shadow-md">
            <span className="text-[10px] font-bold text-cyan-400">9V BATTERY</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">(+)</span>
              <div className="w-8 h-10 bg-gradient-to-b from-cyan-600 to-cyan-900 border border-cyan-400 rounded-md flex items-center justify-center font-bold text-xs">
                🔋
              </div>
              <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40">(-)</span>
            </div>
          </div>

          {/* Interactive Gap & Active Component Slot */}
          <div className="flex-1 mx-4 flex flex-col items-center">
            <span className="text-[10px] text-cyan-400 uppercase font-bold mb-1">TERMINAL GAP</span>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`w-44 h-14 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedTile
                  ? selectedTile.isConductor
                    ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'border-rose-400 bg-rose-950/40 text-rose-300'
                  : 'border-cyan-500/40 bg-cyan-950/20 text-gray-400'
              }`}
            >
              {selectedTile ? (
                <>
                  <span className="text-2xl">{selectedTile.icon}</span>
                  <span className="text-xs font-bold font-mono">{selectedTile.name}</span>
                </>
              ) : (
                <span className="text-xs text-gray-500">PLACE TILE HERE</span>
              )}
            </motion.div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleSwitch}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              isSwitchClosed
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-md'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase">KNIFE SWITCH</span>
            {isSwitchClosed ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-amber-400" />}
            <span className="text-[9px] font-mono font-bold">{isSwitchClosed ? 'CLOSED (ON)' : 'OPEN (OFF)'}</span>
          </button>

        </div>

        {/* Bottom Connecting Wires */}
        <div className="h-2 w-full bg-cyan-900 border-t border-b border-cyan-400 relative overflow-hidden">
          {isCircuitComplete && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300 to-transparent w-1/3 h-full"
              animate={{ x: ['200%', '-100%'] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

      </div>

      {/* Component Tile Selector Options */}
      <div>
        <label className="block text-xs font-mono text-cyan-400 uppercase font-bold mb-2">
          SELECT COMPONENT TILE TO BRIDGE TERMINAL GAP:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CIRCUIT_TILES.map((tile) => {
            const isSelected = selectedTile?.id === tile.id;
            return (
              <motion.button
                key={tile.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleTileSelect(tile)}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all font-mono text-xs ${
                  isSelected
                    ? tile.isConductor
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'bg-rose-950/80 border-rose-400 text-rose-300'
                    : 'bg-[#0E1522] border-white/10 hover:border-cyan-500/40 text-gray-300'
                }`}
              >
                <span className="text-xl">{tile.icon}</span>
                <div className="text-left">
                  <div className="font-bold">{tile.name}</div>
                  <div className="text-[9px] text-hunt-textMuted uppercase">{tile.type}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Feedback Alert Box */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl text-xs font-mono border flex items-center gap-3 ${
              isCircuitComplete
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {isCircuitComplete ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{feedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="py-3 px-5 bg-hunt-surface hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs font-bold rounded-xl"
          >
            CANCEL
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-mono font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
        >
          {isSubmitted ? 'TESTING CIRCUIT CURRENT...' : 'CONNECT CIRCUIT & TEST POWER'}
        </button>
      </div>

    </div>
  );
};
