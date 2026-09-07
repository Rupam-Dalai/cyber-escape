import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass, Shield, Zap, Server, Layers, Database, Skull, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface WorldMapProps {
  currentQuestIndex: number;
  teamName: string;
  onSelectCheckpoint?: (index: number) => void;
  isLevelJustCompleted?: boolean;
}

export interface CyberSectorData {
  index: number;
  title: string;
  subtitle: string;
  iconName: string;
  itemChar: string;
  itemName: string;
  themeColor: string;
  accentBorder: string;
  glowColor: string;
}

const CYBER_SECTORS: CyberSectorData[] = [
  {
    index: 0,
    title: 'POWER SUBSTATION',
    subtitle: 'Sector-01: High-Voltage Grid',
    iconName: '⚡',
    itemChar: '🔋',
    itemName: 'Power Override Core',
    themeColor: 'from-amber-600/30 to-amber-950/80',
    accentBorder: 'border-amber-500',
    glowColor: 'rgba(245,158,11,0.5)',
  },
  {
    index: 1,
    title: 'SERVER RACK ARRAY',
    subtitle: 'Sector-02: Comm Fiber Array',
    iconName: '🖥️',
    itemChar: '🎴',
    itemName: 'Server Optical Matrix',
    themeColor: 'from-cyan-600/30 to-cyan-950/80',
    accentBorder: 'border-cyan-500',
    glowColor: 'rgba(6,182,212,0.5)',
  },
  {
    index: 2,
    title: 'BACKEND STORE & API',
    subtitle: 'Sector-03: Microservice Hub',
    iconName: '⚙️',
    itemChar: '🛡️',
    itemName: 'API Gateway Master Token',
    themeColor: 'from-emerald-600/30 to-emerald-950/80',
    accentBorder: 'border-emerald-500',
    glowColor: 'rgba(16,185,129,0.5)',
  },
  {
    index: 3,
    title: 'DATABASE VAULT',
    subtitle: 'Sector-04: Credential Security',
    iconName: '🗄️',
    itemChar: '📜',
    itemName: 'Root Database Certificate',
    themeColor: 'from-purple-600/30 to-purple-950/80',
    accentBorder: 'border-purple-500',
    glowColor: 'rgba(168,85,247,0.5)',
  },
  {
    index: 4,
    title: 'CENTRAL AIRLOCK: BOSS NuLL',
    subtitle: 'Sector-05: AI Overlord Core',
    iconName: '💀',
    itemChar: '★',
    itemName: 'Master Vault Escape Key',
    themeColor: 'from-rose-600/40 to-black',
    accentBorder: 'border-rose-500',
    glowColor: 'rgba(239,68,68,0.7)',
  },
];

export const WorldMap: React.FC<WorldMapProps> = ({
  currentQuestIndex,
  teamName,
  onSelectCheckpoint,
  isLevelJustCompleted = false,
}) => {
  const [characterIndex, setCharacterIndex] = useState(currentQuestIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLevelJustCompleted) {
      soundEngine.playSuccess();
    }
    setCharacterIndex(currentQuestIndex);
  }, [currentQuestIndex, isLevelJustCompleted]);

  useEffect(() => {
    if (containerRef.current) {
      const stepWidth = 220;
      const scrollPos = Math.max(0, characterIndex * stepWidth - containerRef.current.clientWidth / 2 + stepWidth / 2);
      containerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [characterIndex]);

  return (
    <div className="w-full bg-[#070a12] border-2 border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden select-none">
      
      {/* 2.5D Grid Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-[#070a12] to-[#030508] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header Info Banner */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/20 relative z-20 bg-[#0d1424]/80 px-5 py-3 rounded-2xl backdrop-blur-md border border-cyan-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl text-black shadow-md">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black font-mono text-white tracking-wider flex items-center gap-2">
              2.5D CYBER VAULT FACILITY
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-[10px] font-mono text-cyan-200/70">
              Escape Room Containment Navigation • Dept of BSc CS with Cyber Security
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 px-3.5 py-1.5 rounded-xl font-bold shadow-md flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            CHAMBER {Math.min(currentQuestIndex + 1, 5)} / 5
          </span>
        </div>
      </div>

      {/* 2.5D Isometric Track Container */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent rounded-2xl border border-white/10 shadow-2xl bg-[#04060c] p-6"
      >
        <div className="flex items-center gap-6 min-w-[1100px] justify-between relative py-6">
          
          {/* Animated Connecting Cyber Conduits Layer */}
          <div className="absolute top-1/2 left-10 right-10 h-2 -translate-y-1/2 bg-gray-900 border-y border-white/10 z-0">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-purple-500 transition-all duration-700 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
              style={{ width: `${Math.min(100, (currentQuestIndex / 4) * 100)}%` }}
            />
          </div>

          {/* Sector Room Nodes */}
          {CYBER_SECTORS.map((sector) => {
            const isCompleted = sector.index < currentQuestIndex;
            const isCurrent = sector.index === currentQuestIndex;
            const isLocked = sector.index > currentQuestIndex;

            return (
              <motion.div
                key={sector.index}
                whileHover={!isLocked ? { scale: 1.05, y: -4 } : {}}
                onClick={() => !isLocked && onSelectCheckpoint && onSelectCheckpoint(sector.index)}
                className={`relative z-10 flex flex-col items-center cursor-pointer transition-all ${
                  isLocked ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                {/* Active Chamber Halo Pulse */}
                {isCurrent && (
                  <div className="absolute -inset-4 bg-cyan-400/20 rounded-3xl blur-xl animate-pulse" />
                )}

                {/* 2.5D Isometric Room Chamber Card */}
                <div
                  style={{ boxShadow: isCurrent ? `0 0 30px ${sector.glowColor}` : undefined }}
                  className={`w-48 bg-gradient-to-b ${sector.themeColor} border-2 ${
                    isCurrent
                      ? `${sector.accentBorder} scale-105`
                      : isCompleted
                      ? 'border-emerald-500/80 shadow-emerald-950/40'
                      : 'border-white/10'
                  } rounded-3xl p-4 text-center transition-all backdrop-blur-md relative overflow-hidden`}
                >
                  {/* Top Status Tag */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-[9px] font-mono uppercase font-bold text-gray-300">
                      SECTOR 0{sector.index + 1}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : isCurrent
                          ? 'bg-amber-400 text-black animate-pulse font-bold'
                          : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" /> CLEARED
                        </>
                      ) : isCurrent ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5" /> ACTIVE
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </>
                      )}
                    </span>
                  </div>

                  {/* Room Icon & Avatar Position */}
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shadow-inner mb-2 relative">
                    <span>{sector.iconName}</span>

                    {/* 2.5D Animated Cyborg Character on Active Node */}
                    {isCurrent && (
                      <motion.div
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_15px_#22d3ee] flex items-center justify-center text-xs"
                      >
                        🤖
                      </motion.div>
                    )}
                  </div>

                  <h3 className="text-xs font-black font-mono text-white tracking-wider mb-0.5">
                    {sector.title}
                  </h3>
                  <p className="text-[9px] font-mono text-gray-400 mb-2">
                    {sector.subtitle}
                  </p>

                  {/* Item Reward Tag */}
                  <div className="bg-black/60 border border-white/10 rounded-xl p-1.5 flex items-center justify-center gap-1.5 text-[10px] font-mono">
                    <span>{sector.itemChar}</span>
                    <span className="text-gray-300 truncate max-w-[110px] font-bold">
                      {sector.itemName}
                    </span>
                  </div>

                </div>

              </motion.div>
            );
          })}

        </div>
      </div>

    </div>
  );
};
