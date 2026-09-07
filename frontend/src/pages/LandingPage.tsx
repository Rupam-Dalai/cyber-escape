import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, HelpCircle, ArrowRight, LogOut, Zap, Server, Layers, Database, Skull } from 'lucide-react';
import { soundEngine } from '../services/audio';
import { Team } from '../types';

interface LandingPageProps {
  onEnterHunt: () => void;
  onOpenAdmin: () => void;
  onOpenLeaderboard: () => void;
  activeTeam?: Team | null;
  onLogoutTeam?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterHunt,
  onOpenAdmin,
  onOpenLeaderboard,
  activeTeam,
  onLogoutTeam,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleStart = () => {
    soundEngine.playClick();
    onEnterHunt();
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-between p-6 overflow-hidden select-none bg-[#04060c]">
      
      {/* Cyberpunk Grid Background & Neon Ambient Pulses */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-[#060914] to-[#020306] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Nav */}
      <nav className="w-full max-w-6xl flex items-center justify-between z-10 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-black text-base shadow-lg shadow-cyan-500/30">
            ⚡
          </div>
          <div>
            <span className="font-black text-white tracking-wider text-sm sm:text-base font-mono block">
              ESCAPE THE CYBER VAULT
            </span>
            <span className="text-[10px] text-cyan-300 font-mono block">
              Dept of BSc CS with Cyber Security
            </span>
          </div>
          {activeTeam && (
            <span className="hidden sm:inline-block text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full ml-2">
              OPERATIVE: {activeTeam.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {activeTeam && onLogoutTeam && (
            <button
              onClick={() => {
                soundEngine.playClick();
                if (window.confirm(`Log out operative team "${activeTeam.name}" session?`)) {
                  onLogoutTeam();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-mono text-rose-300 transition-all flex items-center gap-1"
              title="Log Out Team Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          )}

          <button
            onClick={onOpenLeaderboard}
            className="px-3.5 py-1.5 rounded-lg bg-[#0c1322] hover:bg-[#142038] border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:text-white transition-all shadow-sm"
          >
            LEADERBOARD
          </button>

          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all"
          >
            MISSION CONTROL
          </button>
        </div>
      </nav>

      {/* Main Hero Content */}
      <main className="z-10 text-center max-w-3xl my-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> DEPARTMENT OF BSc CS WITH CYBER SECURITY
          </div>

          <h1 className="text-4xl sm:text-7xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 mb-6 drop-shadow-2xl">
            ESCAPE THE CYBER VAULT
          </h1>

          <p className="text-base sm:text-lg text-gray-300 font-mono max-w-xl mx-auto leading-relaxed mb-8">
            The facility is locked down by Rogue AI <strong className="text-rose-400">NuLL</strong>.
            Navigate 4 cybernetic chambers, fix live infrastructure tasks, collect the 4 master security artifacts, and breach the final airlock!
          </p>

          {/* 4 Chamber Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto mb-10 text-xs font-mono">
            <div className="bg-[#0b101c] border border-amber-500/40 p-2.5 rounded-xl text-amber-300 flex items-center justify-center gap-1.5">
              <span>⚡</span>
              <span>Power Core</span>
            </div>
            <div className="bg-[#0b101c] border border-cyan-500/40 p-2.5 rounded-xl text-cyan-300 flex items-center justify-center gap-1.5">
              <span>🖥️</span>
              <span>Server Array</span>
            </div>
            <div className="bg-[#0b101c] border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 flex items-center justify-center gap-1.5">
              <span>⚙️</span>
              <span>Backend API</span>
            </div>
            <div className="bg-[#0b101c] border border-purple-500/40 p-2.5 rounded-xl text-purple-300 flex items-center justify-center gap-1.5">
              <span>🗄️</span>
              <span>Database Vault</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-lg rounded-2xl shadow-2xl shadow-cyan-500/35 transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              <span>INFILTRATE THE VAULT</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setShowHowToPlay(true)}
              className="w-full sm:w-auto px-8 py-5 bg-[#0e1628] hover:bg-[#152038] border border-white/10 text-white font-mono font-semibold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <span>FACILITY PROTOCOL</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="z-10 text-xs text-gray-400 font-mono py-4 text-center">
        ORGANIZED BY DEPARTMENT OF BSc CS WITH CYBER SECURITY • 2.5D ESCAPE ROOM ENGINE
      </footer>

      {/* HOW TO PLAY PROTOCOL MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101c] border-2 border-cyan-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl font-mono text-left space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-2">
              <h3 className="text-base font-black text-cyan-400 flex items-center gap-2">
                <Shield className="w-5 h-5" /> ESCAPE PROTOCOL BRIEFING
              </h3>
              <button onClick={() => setShowHowToPlay(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>
                <strong className="text-amber-400">1. Room 1 (Electricity Substation):</strong> Reconnect 4 severed high-voltage conduits. Warning: Cross-polarity causes an explosive short circuit blast and respawn!
              </p>
              <p>
                <strong className="text-cyan-400">2. Room 2 (Server Room):</strong> Patch fiber-optic lines and calibrate optical frequency to 100 Gbps to obtain the Server Optical Matrix.
              </p>
              <p>
                <strong className="text-emerald-400">3. Room 3 (Backend Store & API):</strong> Repair broken microservice REST endpoints (200 OK) to unlock the downstream Database Vault.
              </p>
              <p>
                <strong className="text-purple-400">4. Room 4 (Database Vault):</strong> Run root SQL queries to decrypt the vault door passcode and retrieve the Root Certificate.
              </p>
              <p>
                <strong className="text-rose-400">5. Chamber 5 (Final Boss NuLL):</strong> Deploy the 4 collected room items to break NuLL's Hyper-Shield, blind its lasers, block its malware, and purge its kernel!
              </p>
            </div>

            <div className="pt-3 text-right">
              <button
                onClick={() => setShowHowToPlay(false)}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black rounded-xl text-xs"
              >
                ACKNOWLEDGE PROTOCOL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
