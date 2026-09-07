import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Shield, RefreshCw, Zap, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface EnigmaPlugboardConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'MEMORY_BLAST') => void;
  isSubmitting?: boolean;
}

interface PlugSocket {
  letter: string;
  targetLetter: string; // The correct paired letter
  color: string;
}

const REQUIRED_PAIRS: { [key: string]: string } = {
  'A': 'X',
  'X': 'A',
  'Q': 'M',
  'M': 'Q',
  'D': 'T',
  'T': 'D',
  'L': 'R',
  'R': 'L',
};

const SOCKET_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
  'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'
];

export const EnigmaPlugboardConsole: React.FC<EnigmaPlugboardConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [connections, setConnections] = useState<{ [letter: string]: string }>({});
  const [statusMessage, setStatusMessage] = useState(
    'ENIGMA PLUGBOARD: Connect 4 jumper wire pairs to achieve cryptographic hash resonance.'
  );
  const [isDecrypted, setIsDecrypted] = useState(false);

  const handleSocketClick = (letter: string) => {
    soundEngine.playClick();

    if (!selectedLetter) {
      // First socket of pair
      if (connections[letter]) {
        // Disconnect existing
        const paired = connections[letter];
        const next = { ...connections };
        delete next[letter];
        delete next[paired];
        setConnections(next);
        setStatusMessage(`Disconnected plug ${letter}<->${paired}.`);
        return;
      }
      setSelectedLetter(letter);
      soundEngine.playElectricZap();
      setStatusMessage(`Selected plug [${letter}]. Now select paired jumper socket.`);
    } else {
      if (selectedLetter === letter) {
        setSelectedLetter(null);
        return;
      }

      // Check if pairing is correct
      if (REQUIRED_PAIRS[selectedLetter] === letter) {
        soundEngine.playWireConnect();
        soundEngine.playSuccess();
        const next = { ...connections, [selectedLetter]: letter, [letter]: selectedLetter };
        setConnections(next);
        setSelectedLetter(null);
        setStatusMessage(`✓ Jumper ${selectedLetter}<->${letter} connected.`);

        // Count unique pairs (each pair has 2 keys in dict)
        if (Object.keys(next).length === 8) {
          soundEngine.playShield();
          soundEngine.playTerminalType();
          setIsDecrypted(true);
          setStatusMessage('⚡ ALL 4 ENIGMA JUMPERS CONNECTED! CRYPTOGRAPHIC HASH MATCH 100%!');
          setTimeout(() => {
            onSubmit('ENIGMA_MATRIX_SOLVED');
          }, 1500);
        }
      } else {
        soundEngine.playElectricZap();
        soundEngine.playError();
        setSelectedLetter(null);
        setStatusMessage(`🚨 HASH COLLISION: Incorrect plugboard jumper between ${selectedLetter} and ${letter}!`);
      }
    }
  };

  const solvedPairsCount = Object.keys(connections).length / 2;

  return (
    <div className="w-full bg-[#080814] border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl relative select-none font-mono overflow-hidden">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-indigo-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Key className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              ENIGMA HARDWARE PLUGBOARD (STECKERBRETT)
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ROTARY CIPHER
              </span>
            </h3>
            <p className="text-xs text-indigo-200/70">
              Connect 4 letter jumper pairs: A-X, Q-M, D-T, and L-R to align the cryptographic rotor reflector.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
          <Zap className={`w-4 h-4 ${isDecrypted ? 'text-indigo-400 animate-bounce' : 'text-gray-500'}`} />
          <span>PAIRS: {solvedPairsCount} / 4</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#121226] border border-indigo-500/30 rounded-2xl p-3 mb-5 flex items-center justify-between gap-4 text-xs relative z-10">
        <div className="flex items-center gap-2 text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="text-[11px] px-2.5 py-1 bg-black/40 border border-indigo-500/20 rounded-lg text-indigo-400 font-bold">
          INTEGRITY: {solvedPairsCount * 25}%
        </div>
      </div>

      {/* Plugboard Sockets Grid */}
      <div className="p-5 bg-[#0e0e1f] border-2 border-indigo-500/30 rounded-2xl mb-6 relative z-10">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
          {SOCKET_LETTERS.map((letter) => {
            const isSelected = selectedLetter === letter;
            const pairedWith = connections[letter];

            return (
              <button
                key={letter}
                onClick={() => handleSocketClick(letter)}
                className={`h-14 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center relative ${
                  pairedWith
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    : isSelected
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 animate-pulse'
                    : 'bg-black/60 border-white/10 text-gray-300 hover:border-indigo-400/60'
                }`}
              >
                <span className="text-base">{letter}</span>
                {pairedWith && (
                  <span className="text-[9px] text-indigo-300 font-bold">
                    ↔ {pairedWith}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clue Note & Active Jumpers */}
      <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>CRYPTOGRAPHER MEMO: Pair hints: [A ↔ X], [Q ↔ M], [D ↔ T], and [L ↔ R].</span>
        </div>
        <button
          onClick={() => {
            setConnections({});
            setSelectedLetter(null);
            setStatusMessage('Plugboard jumper connections reset.');
          }}
          className="text-[10px] px-2.5 py-1 bg-black/40 hover:bg-black/70 border border-indigo-500/30 rounded-lg text-gray-400 hover:text-white"
        >
          RESET JUMPERS
        </button>
      </div>
    </div>
  );
};
