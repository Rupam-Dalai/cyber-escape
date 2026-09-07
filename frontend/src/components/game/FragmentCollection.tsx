import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { FragmentItem } from '../../types';

interface FragmentCollectionProps {
  fragments: FragmentItem[];
}

export const FragmentCollection: React.FC<FragmentCollectionProps> = ({ fragments }) => {
  return (
    <div className="w-full bg-hunt-surface/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <KeyRound className="w-4 h-4 text-amber-400" />
        <div className="flex-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wider">DISCOVERED CLUE FRAGMENTS</h3>
          <span className="text-[10px] font-mono text-amber-400/90 font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
            SECRET PASSPHRASE: CYBERDETECTIVE
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {Array.from({ length: 14 }).map((_, idx) => {
          const frag = fragments.find((f) => f.order === idx);
          return (
            <motion.div
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              className={`w-9 h-11 sm:w-11 sm:h-13 rounded-lg border flex flex-col items-center justify-center transition-all ${
                frag
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-950/40 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-hunt-elevated/40 border-white/5 text-gray-700 opacity-40'
              }`}
            >
              <span className="text-base sm:text-lg font-mono font-bold">
                {frag ? frag.char : '?'}
              </span>
              <span className="text-[8px] font-mono text-hunt-textMuted uppercase mt-0.5">
                #{String(idx + 1).padStart(2, '0')}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
