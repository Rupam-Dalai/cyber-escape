import React, { useState, useEffect } from 'react';
import { Heart, Lightbulb, Trophy, Volume2, VolumeX, LogOut, Shield, ShieldCheck, Zap, Package, Box } from 'lucide-react';
import { Team, FragmentItem } from '../../types';
import { GameProgressState } from '../world/RoomRenderer';
import { soundEngine } from '../../services/audio';
import { PixelAvatar } from './PixelAvatar';

interface GameHUDProps {
  team: Team;
  currentLocationName: string;
  fragments?: FragmentItem[];
  progressState?: GameProgressState;
  playerHealth?: number;
  onOpenLeaderboard?: () => void;
  onLogout?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  team,
  currentLocationName,
  fragments = [],
  progressState,
  playerHealth = 100,
  onOpenLeaderboard,
  onLogout,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.floor(Date.now() / 1000 - team.started_at);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      setElapsedTime(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [team.started_at]);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const scavengerList = [
    { name: '50A Ceramic Fuse', icon: '🔩', owned: !!progressState?.hasSpareFuse },
    { name: '74LS08 Logic IC', icon: '📟', owned: !!progressState?.hasLogicIC },
    { name: '100µF Capacitor', icon: '⚡', owned: !!progressState?.hasCapacitor },
    { name: 'ECC DDR5 RAM', icon: '💾', owned: !!progressState?.hasRam },
    { name: 'SFP+ Transceiver', icon: '📡', owned: !!progressState?.hasSfp },
    { name: 'NVMe SSD Blade', icon: '💽', owned: !!progressState?.hasNvme },
    { name: 'Copper Jumpers', icon: '🔌', owned: !!progressState?.hasJumpers },
    { name: 'Clean Token Cert', icon: '📄', owned: !!progressState?.hasTokenCert },
  ];

  const totalHardwareCount = scavengerList.filter((i) => i.owned).length;

  return (
    <header className="sticky top-0 z-40 bg-[#060810]/95 backdrop-blur-md border-b border-cyan-500/20 px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Operative Info */}
        <div className="flex items-center gap-3">
          <PixelAvatar avatarId={team.name} size={36} className="border-cyan-400/60 shadow-cyan-500/20" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300 tracking-wider text-xs sm:text-sm font-mono">
                ESCAPE THE CYBER VAULT
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                OPERATIVE: {team.name}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{currentLocationName}</span>
            </p>
          </div>
        </div>

        {/* Escape Room Key Items & Hardware Backpack Dock */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Key Sector Badges */}
          <div className="flex items-center gap-1.5 bg-[#0c1220] border border-white/10 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mr-1">
              KEY ITEMS:
            </span>
            {[
              { id: 0, icon: '🛡️', name: 'Firewall Patch (R1)', owned: !!progressState?.hasFirewallPatch },
              { id: 1, icon: '🔋', name: 'Power Surge Cell (R2)', owned: !!progressState?.hasPowerSurgeCell },
              { id: 2, icon: '📜', name: 'Access Credentials (R3)', owned: !!progressState?.hasAccessCredentials },
              { id: 3, icon: '⚙️', name: 'Clean API Call (R4)', owned: !!progressState?.hasCleanApiCall },
              { id: 4, icon: '🧱', name: 'Firewall Rule Set (R5)', owned: !!progressState?.hasFirewallRules },
              { id: 5, icon: '🔑', name: 'Cipher Key (R6)', owned: !!progressState?.hasCipherKey },
              { id: 6, icon: '🗺️', name: 'Forensic Trace Map (R7)', owned: !!progressState?.hasForensicMap },
            ].map((slot) => {
              const hasItem = slot.owned || fragments.some((f) => f.order === slot.id) || team.current_quest_index > slot.id;
              return (
                <div
                  key={slot.id}
                  title={hasItem ? `Unlocked: ${slot.name}` : `Locked in Sector ${slot.id + 1}`}
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    hasItem
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse'
                      : 'bg-black/40 border-white/5 opacity-30 grayscale'
                  }`}
                >
                  <span>{slot.icon}</span>
                </div>
              );
            })}
          </div>

          {/* Hardware Backpack */}
          <div className="flex items-center gap-1.5 bg-[#120d18] border border-amber-500/20 px-3 py-1.5 rounded-2xl" title={`Operative Hardware Backpack (${totalHardwareCount} Parts)`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase mr-1 flex items-center gap-1">
              <Box className="w-3 h-3" /> PARTS:
            </span>
            {scavengerList.map((item, idx) => (
              <div
                key={idx}
                title={item.owned ? `In Backpack: ${item.name}` : `Missing: ${item.name}`}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] transition-all ${
                  item.owned
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-black/40 border-white/5 opacity-25 grayscale'
                }`}
              >
                <span>{item.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats (Shield/HP, Lives, Hints, Trophies/Score, Timer, Controls) */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono">
          
          {/* Operative Chassis Health / Shield Bar */}
          <div className="flex items-center gap-1.5 bg-[#091522] px-2.5 py-1 rounded-xl border border-cyan-500/40 shadow-inner" title={`Chassis Health: ${playerHealth}%`}>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <div className="w-14 sm:w-18 h-2 bg-black/90 rounded-full border border-cyan-500/30 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, playerHealth))}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-cyan-300">{playerHealth}%</span>
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1 bg-hunt-surface px-2 py-1 rounded-xl border border-white/10" title="Operative Lives">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${
                  idx < team.lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                    : 'text-gray-700 opacity-40'
                }`}
              />
            ))}
          </div>

          {/* Hints Remaining */}
          <div className="flex items-center gap-1 bg-hunt-surface px-2.5 py-1 rounded-xl border border-white/10" title="Security Hints">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="text-xs font-bold text-amber-300">{team.hints_remaining}</span>
          </div>

          {/* Trophies / Score */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#1c1205] to-[#0d1624] px-3 py-1 rounded-xl border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]" title="Expedition Trophies / Total Score">
            <Trophy className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            <span className="text-xs font-black text-amber-300 tracking-wide">{team.score} 🏆</span>
          </div>

          {/* Timer */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-hunt-surface px-2.5 py-1 rounded-xl border border-white/5">
            <span>⏱️</span>
            <span>{elapsedTime}</span>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-xl bg-hunt-surface hover:bg-hunt-elevated border border-white/10 text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={() => {
                soundEngine.playClick();
                if (window.confirm(`Log out team "${team.name}" session?`)) {
                  onLogout();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs transition-all"
              title="Log Out Operative Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
