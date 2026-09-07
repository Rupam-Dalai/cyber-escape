import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, ShieldCheck, RefreshCw, Skull } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface HazardDeathModalProps {
  isOpen: boolean;
  hazardType: 'SHORT_CIRCUIT' | 'DATA_SURGE' | 'MEMORY_BLAST' | 'LASER_TRAP' | 'GENERIC';
  checkpointName: string;
  onRespawnComplete: () => void;
}

const HAZARD_DETAILS = {
  SHORT_CIRCUIT: {
    title: '⚡ SHORT CIRCUIT ELECTRICAL BLAST!',
    subtitle: 'Cross-polarity conduit overload triggered a high-voltage explosive discharge.',
    color: 'from-amber-600 to-rose-600',
    borderColor: 'border-rose-500',
    iconColor: 'text-amber-400',
  },
  DATA_SURGE: {
    title: '💥 OPTICAL FREQUENCY DATA SURGE!',
    subtitle: 'Overclocked fiber-optic switchboard released an unshielded laser shockwave.',
    color: 'from-cyan-600 to-blue-700',
    borderColor: 'border-cyan-500',
    iconColor: 'text-cyan-400',
  },
  MEMORY_BLAST: {
    title: '☣️ MEMORY LEAK RADIATION EXHAUST!',
    subtitle: 'Corrupted payload overflow ruptured the microservice containment pipe.',
    color: 'from-emerald-600 to-lime-700',
    borderColor: 'border-emerald-500',
    iconColor: 'text-lime-400',
  },
  LASER_TRAP: {
    title: '🚨 SECURITY PERIMETER LASER LOCKDOWN!',
    subtitle: 'Unauthorized SQL intrusion trap activated high-energy defense turrets.',
    color: 'from-rose-600 to-red-800',
    borderColor: 'border-red-500',
    iconColor: 'text-rose-400',
  },
  GENERIC: {
    title: '⚠️ LETHAL HAZARD TRIGGERED!',
    subtitle: 'Critical infrastructure failure resulted in catastrophic operative damage.',
    color: 'from-rose-600 to-amber-600',
    borderColor: 'border-rose-500',
    iconColor: 'text-rose-400',
  },
};

export const HazardDeathModal: React.FC<HazardDeathModalProps> = ({
  isOpen,
  hazardType,
  checkpointName,
  onRespawnComplete,
}) => {
  const [countdown, setCountdown] = useState(3);
  const info = HAZARD_DETAILS[hazardType] || HAZARD_DETAILS.GENERIC;

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }

    soundEngine.playShortCircuitExplosion();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playShield();
          onRespawnComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onRespawnComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none overflow-hidden">
        
        {/* Fullscreen Flash & Shockwave Overlay */}
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: [0.9, 0.4, 0.85] }}
          transition={{ duration: 0.4, repeat: 3 }}
          className="absolute inset-0 bg-red-950/80 backdrop-blur-md"
        />

        {/* Electrical Shock Static Noise */}
        <div className="absolute inset-0 bg-[radial-gradient(#ef444433_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Center Respawn Card */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`relative z-10 w-full max-w-lg bg-[#0c0d14] border-2 ${info.borderColor} rounded-3xl p-8 shadow-[0_0_60px_rgba(239,68,68,0.5)] text-center overflow-hidden`}
        >
          {/* Top Warning Glow Header */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-red-500/50 flex items-center justify-center shadow-lg relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Skull className="w-10 h-10 text-rose-500" />
            </motion.div>
            <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-500 text-black">
              <Zap className="w-4 h-4" />
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-rose-400 mb-2">
            {info.title}
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 font-mono mb-6 leading-relaxed">
            {info.subtitle}
          </p>

          {/* Hazard Trophy Deduction Callout */}
          <div className="mb-4 bg-red-950/70 border border-red-500/50 rounded-xl px-4 py-2 text-center text-xs font-mono font-bold text-amber-300 flex flex-wrap items-center justify-center gap-2">
            <span>⚠️ HAZARD PENALTY:</span>
            <span className="text-red-400 font-black">-25 TROPHIES 🏆</span>
            <span className="text-[10px] text-gray-400">(Task State Remains: In Progress)</span>
          </div>

          {/* Checkpoint Banner */}
          <div className="bg-[#141824] border border-cyan-500/30 rounded-2xl p-4 mb-6 text-left flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                ACTIVE SECTOR CHECKPOINT
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {checkpointName}
              </div>
            </div>
          </div>

          {/* Respawn Countdown */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-amber-300 tracking-wider flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>RESTORING OPERATIVE SHIELD & RESPAWNING IN...</span>
            </div>
            <div className="text-4xl font-black font-mono text-rose-500 tracking-widest animate-pulse">
              0{countdown} SEC
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
