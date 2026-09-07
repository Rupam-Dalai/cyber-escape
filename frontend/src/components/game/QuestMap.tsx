import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, MapPin, Compass } from 'lucide-react';

interface QuestMapProps {
  currentQuestIndex: number;
  onSelectQuest?: (index: number) => void;
}

const MAP_LOCATIONS = [
  { index: 0, title: 'The Ancient Gate', slug: 'ancient-gate', icon: '🚪' },
  { index: 1, title: 'Logic Forest', slug: 'logic-forest', icon: '🌲' },
  { index: 2, title: 'Loop Chamber', slug: 'loop-chamber', icon: '🌀' },
  { index: 3, title: 'Pictograph Sanctuary', slug: 'pictogram-sanctuary', icon: '🖼️' },
  { index: 4, title: 'Cyber Crime Scene', slug: 'insider-threat', icon: '🔍' },
  { index: 5, title: 'Prism Core', slug: 'prism-core', icon: '💎' },
  { index: 6, title: 'Broken Lab', slug: 'broken-lab', icon: '🔬' },
  { index: 7, title: 'Shadow Alley', slug: 'caesar-note', icon: '🕵️' },
  { index: 8, title: 'Grid Sanctuary', slug: 'grid-sanctuary', icon: '⚡' },
  { index: 9, title: 'Cipher Vault', slug: 'cipher-vault', icon: '🔐' },
  { index: 10, title: 'Hieroglyph Chamber', slug: 'hieroglyph-chamber', icon: '🗿' },
  { index: 11, title: 'Archive Vault', slug: 'steganography-vault', icon: '📁' },
  { index: 12, title: 'Quantum Core', slug: 'quantum-core', icon: '⚛️' },
  { index: 13, title: 'Labyrinth Gate', slug: 'labyrinth-gate', icon: '🧩' },
  { index: 14, title: 'Final Temple', slug: 'final-temple', icon: '🏛️' },
  { index: 15, title: 'Treasure Vault', slug: 'treasure', icon: '🏆' },
];

export const QuestMap: React.FC<QuestMapProps> = ({ currentQuestIndex }) => {
  return (
    <div className="w-full bg-hunt-surface/90 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">EXPEDITION MAP</h2>
        </div>
        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
          STAGE {Math.min(currentQuestIndex + 1, 15)} / 15
        </span>
      </div>

      {/* Map Progression Pathway (Scrollable) */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
        <div className="flex items-center gap-3 min-w-max px-1">
          
          {MAP_LOCATIONS.map((loc) => {
            const isCompleted = loc.index < currentQuestIndex;
            const isCurrent = loc.index === currentQuestIndex;
            const isLocked = loc.index > currentQuestIndex;

            return (
              <React.Fragment key={loc.index}>
                {/* Location Node */}
                <motion.div
                  whileHover={!isLocked ? { scale: 1.05 } : {}}
                  className={`relative flex flex-col items-center p-2.5 rounded-xl border transition-all w-28 sm:w-32 text-center ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/50'
                      : isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-hunt-elevated/40 border-white/5 text-gray-600 opacity-60'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute -top-2.5 bg-hunt-bg border border-white/10 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-semibold flex items-center gap-1">
                    {isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> CLEARED</span>
                    ) : isCurrent ? (
                      <span className="text-amber-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 animate-bounce" /> CURRENT</span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> LOCKED</span>
                    )}
                  </div>

                  <div className="text-xl mt-1.5 mb-1">{loc.icon}</div>
                  <div className="text-[11px] font-bold leading-tight line-clamp-1">{loc.title}</div>
                  <div className="text-[9px] font-mono text-hunt-textMuted mt-0.5">
                    {loc.index === 15 ? 'FINAL VAULT' : `QUEST ${String(loc.index + 1).padStart(2, '0')}`}
                  </div>
                </motion.div>

                {/* Connecting Line */}
                {loc.index < MAP_LOCATIONS.length - 1 && (
                  <div className="w-6 h-0.5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 relative">
                    {isCompleted && <div className="absolute inset-0 bg-emerald-500/50"></div>}
                  </div>
                )}
              </React.Fragment>
            );
          })}

        </div>
      </div>
    </div>
  );
};
