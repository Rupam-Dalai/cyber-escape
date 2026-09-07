import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Radio, Sparkles, Volume2, ArrowRight, Shield, Award, Compass, Lock, Zap } from 'lucide-react';
import { Team, EventConfig } from '../types';
import { PixelAvatar } from '../components/common/PixelAvatar';
import { soundEngine } from '../services/audio';
import { fetchEventConfig } from '../services/api';
import { wsClient } from '../services/websocket';
import { PausePage } from './PausePage';

interface LobbyPageProps {
  team: Team;
  onStartQuest: () => void;
  onLogout: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ team, onStartQuest, onLogout }) => {
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Poll and listen via WebSocket to detect when Game Master starts the event
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const conf = await fetchEventConfig();
        setEventConfig(conf);
        if (conf && conf.event_status === 'ACTIVE') {
          soundEngine.playSuccess();
          onStartQuest();
        }
      } catch (err) {
        console.error('Error fetching event status in lobby:', err);
      }
    };

    checkConfig();

    wsClient.connect();
    const unsubscribe = wsClient.subscribe((msg: any) => {
      if (msg.type === 'EVENT_STATUS_CHANGE') {
        if (msg.event_status === 'ACTIVE') {
          soundEngine.playSuccess();
          onStartQuest();
        } else if (msg.event_status) {
          setEventConfig((prev) => prev ? { ...prev, event_status: msg.event_status } : null);
        }
      }
    });

    const interval = setInterval(checkConfig, 2500);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [onStartQuest]);

  const toggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsAudioMuted(muted);
  };

  if (eventConfig?.event_status === 'PAUSED') {
    return <PausePage onResume={onStartQuest} />;
  }

  return (
    <div className="min-h-screen bg-[#04060c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background Animated Cyber Grid & Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#060810] to-[#020306] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40d_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40d_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider uppercase">
            OPERATIVE STAGING BAY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2.5 bg-[#0e1628] hover:bg-[#152038] border border-cyan-500/30 rounded-xl text-cyan-400 transition-all flex items-center gap-2 text-xs font-mono"
          >
            <Volume2 className="w-4 h-4" />
            {isAudioMuted ? 'UNMUTE AUDIO' : 'AUDIO ON'}
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono transition-all"
          >
            DISCONNECT
          </button>
        </div>
      </div>

      {/* MAIN LOBBY CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-[#0a0f1d]/90 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] backdrop-blur-xl relative z-10 text-center my-12"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider mb-6 shadow-md">
          <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          DEPARTMENT OF BSc CS WITH CYBER SECURITY
        </div>

        {/* TEAM DOSSIER */}
        <div className="bg-[#050812] border border-cyan-500/30 rounded-2xl p-6 mb-6 relative overflow-hidden flex flex-col items-center">
          
          <div className="relative mb-3">
            <PixelAvatar avatarId={team.name} size={64} className="border-2 border-cyan-400 shadow-[0_0_20px_#22d3ee]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
            {team.name}
          </h2>
          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full mt-2">
            REGISTRATION: {team.registration_code}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full mt-5 pt-4 border-t border-white/10 text-center font-mono">
            <div>
              <div className="text-[10px] text-gray-400 font-bold">LIVES</div>
              <div className="text-sm font-black text-rose-400">❤️❤️❤️ (3)</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold">START SCORE</div>
              <div className="text-sm font-black text-cyan-300">{team.score} PTS</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold">STATUS</div>
              <div className="text-sm font-black text-emerald-400">AUTHORIZED</div>
            </div>
          </div>
        </div>

        {/* WAITING BROADCAST STATUS */}
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-bold animate-pulse">
            <Lock className="w-4 h-4" />
            <span>WAITING FOR GAME MASTER TO COMMENCE INFILTRATION...</span>
          </div>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            The event will launch automatically once Game Master activates the Cyber Vault mainframe.
          </p>
        </div>

      </motion.div>

    </div>
  );
};
