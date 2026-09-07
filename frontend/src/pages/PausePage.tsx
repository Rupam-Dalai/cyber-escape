import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pause, ShieldAlert, Radio, Compass, Volume2 } from 'lucide-react';
import { soundEngine } from '../services/audio';
import { fetchEventConfig } from '../services/api';

interface PausePageProps {
  onResume: () => void;
}

export const PausePage: React.FC<PausePageProps> = ({ onResume }) => {
  // Poll event config to detect when Game Master resumes the hunt
  useEffect(() => {
    soundEngine.playError();

    const checkStatus = async () => {
      try {
        const config = await fetchEventConfig();
        if (config && config.event_status === 'ACTIVE') {
          soundEngine.playSuccess();
          onResume();
        }
      } catch (e) {
        console.error('Error polling pause status:', e);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [onResume]);

  return (
    <div className="fixed inset-0 z-50 bg-[#080B10]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white select-none">
      
      {/* Background Amber Pulse Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/40 via-[#080B10] to-[#04060A] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b12_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b12_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-hunt-surface/90 border-2 border-amber-500/50 rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-center relative z-10"
      >
        {/* Blinking Pause Icon */}
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse">
          <Pause className="w-10 h-10 text-amber-400 fill-amber-400" />
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold tracking-wider mb-4 shadow-md">
          <Radio className="w-4 h-4 animate-ping text-amber-400" />
          SYSTEM BROADCAST: PAUSED
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wider uppercase mb-3">
          CYBER VAULT PAUSED BY GAME MASTER
        </h2>

        <p className="text-sm font-mono text-amber-200/80 mb-8 leading-relaxed">
          The Game Master has temporarily frozen facility timers and chamber protocols.<br />
          Stand by — gameplay will automatically resume as soon as the signal is unpaused.
        </p>

        {/* Live Radar Spinner */}
        <div className="p-4 rounded-2xl bg-[#060911] border border-amber-500/30 flex items-center justify-center gap-3 text-xs font-mono text-amber-400">
          <Compass className="w-5 h-5 animate-spin text-amber-400" />
          <span className="font-bold tracking-widest animate-pulse">WAITING FOR RESUME SIGNAL...</span>
        </div>

      </motion.div>

      {/* Footer Vibe Tag */}
      <div className="absolute bottom-6 font-mono text-xs text-hunt-textMuted flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400" />
        <span>EXPEDITION PROTOCOL • TIMERS & SUBMISSIONS FROZEN</span>
      </div>

    </div>
  );
};
