import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Compass, GitCommit, CheckCircle } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface PathSelectorProps {
  onSelectPath: (path: string) => void;
  isLoading?: boolean;
  mode?: 'binary' | 'directional' | 'path_a_b';
}

export const PathSelector: React.FC<PathSelectorProps> = ({ onSelectPath, isLoading, mode = 'binary' }) => {
  const handleChoice = (path: string) => {
    soundEngine.playClick();
    onSelectPath(path);
  };

  if (mode === 'path_a_b') {
    return (
      <div className="w-full max-w-2xl mx-auto my-6 p-6 bg-hunt-surface/90 border border-cyan-500/30 rounded-2xl shadow-2xl text-center font-mono">
        <div className="flex items-center justify-center gap-2 mb-6">
          <GitCommit className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-lg font-bold text-white tracking-wide">SELECT EVENT LOOP EXECUTION FLOW</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Path A */}
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleChoice('PATH A')}
            disabled={isLoading}
            className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#131E2E] to-[#0A111C] border-2 border-cyan-500/50 hover:border-cyan-400 rounded-2xl transition-all shadow-xl hover:shadow-cyan-500/20"
          >
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-3 group-hover:bg-cyan-500/30 transition-all">
              <CheckCircle className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="text-xl font-bold font-mono text-cyan-300 tracking-wider mb-1">PATH A</span>
            <span className="text-xs text-white font-mono bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full font-bold">
              OUTPUT: 1 3 2
            </span>
          </motion.button>

          {/* Path B */}
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleChoice('PATH B')}
            disabled={isLoading}
            className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1E1B13] to-[#120F0A] border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl transition-all shadow-xl hover:shadow-amber-500/20"
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 group-hover:bg-amber-500/30 transition-all">
              <CheckCircle className="w-7 h-7 text-amber-400" />
            </div>
            <span className="text-xl font-bold font-mono text-amber-300 tracking-wider mb-1">PATH B</span>
            <span className="text-xs text-white font-mono bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
              OUTPUT: 1 2 3
            </span>
          </motion.button>

        </div>
      </div>
    );
  }

  if (mode === 'directional') {
    return (
      <div className="w-full max-w-2xl mx-auto my-6 p-6 bg-hunt-surface/90 border border-cyan-500/30 rounded-2xl shadow-2xl text-center font-mono">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <h3 className="text-lg font-bold text-white tracking-wide">SELECT POWER CONDUIT DIRECTION</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* North */}
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleChoice('NORTH')}
            disabled={isLoading}
            className="p-5 bg-gradient-to-b from-[#131E2E] to-[#0A111C] border border-cyan-500/30 hover:border-cyan-400 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-xl"
          >
            <ArrowUp className="w-6 h-6 text-cyan-400" />
            <span className="font-mono font-bold text-white text-sm">NORTH</span>
          </motion.button>

          {/* East */}
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleChoice('EAST')}
            disabled={isLoading}
            className="p-5 bg-gradient-to-b from-[#131E2E] to-[#0A111C] border border-cyan-500/30 hover:border-cyan-400 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-xl"
          >
            <ArrowRight className="w-6 h-6 text-cyan-400" />
            <span className="font-mono font-bold text-white text-sm">EAST</span>
          </motion.button>

          {/* South */}
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleChoice('SOUTH')}
            disabled={isLoading}
            className="p-5 bg-gradient-to-b from-[#131E2E] to-[#0A111C] border border-emerald-500/40 hover:border-emerald-400 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-xl"
          >
            <ArrowDown className="w-6 h-6 text-emerald-400" />
            <span className="font-mono font-bold text-white text-sm">SOUTH</span>
          </motion.button>

          {/* West */}
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleChoice('WEST')}
            disabled={isLoading}
            className="p-5 bg-gradient-to-b from-[#131E2E] to-[#0A111C] border border-cyan-500/30 hover:border-cyan-400 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-xl"
          >
            <ArrowLeft className="w-6 h-6 text-cyan-400" />
            <span className="font-mono font-bold text-white text-sm">WEST</span>
          </motion.button>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 bg-hunt-surface/90 border border-cyan-500/30 rounded-2xl shadow-2xl text-center font-mono">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
        <h3 className="text-lg font-bold text-white tracking-wide">CHOOSE YOUR EXPEDITION PATH</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Path */}
        <motion.button
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleChoice('LEFT')}
          disabled={isLoading}
          className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#131E2E] to-[#0A111C] border border-cyan-500/30 hover:border-cyan-400 rounded-2xl transition-all shadow-xl hover:shadow-cyan-500/20"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-all">
            <ArrowLeft className="w-8 h-8 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-xl font-bold font-mono text-white tracking-widest mb-1">LEFT PATH</span>
          <span className="text-xs text-hunt-textMuted font-sans">Follow condition if false</span>
        </motion.button>

        {/* Right Path */}
        <motion.button
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleChoice('RIGHT')}
          disabled={isLoading}
          className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#1E1B13] to-[#120F0A] border border-amber-500/30 hover:border-amber-400 rounded-2xl transition-all shadow-xl hover:shadow-amber-500/20"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-all">
            <ArrowRight className="w-8 h-8 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-xl font-bold font-mono text-white tracking-widest mb-1">RIGHT PATH</span>
          <span className="text-xs text-hunt-textMuted font-sans">Follow condition if true</span>
        </motion.button>

      </div>
    </div>
  );
};
