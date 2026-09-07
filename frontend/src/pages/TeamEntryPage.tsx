import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, ArrowLeft, Shield, LogIn, UserPlus, Hash, User } from 'lucide-react';
import { registerOrLoginTeam, loginTeamByRegisterCode } from '../services/api';
import { Team } from '../types';
import { soundEngine } from '../services/audio';

interface TeamEntryPageProps {
  onTeamRegistered: (team: Team) => void;
  onBack: () => void;
}

export const TeamEntryPage: React.FC<TeamEntryPageProps> = ({ onTeamRegistered, onBack }) => {
  const [entryMode, setEntryMode] = useState<'login' | 'register'>('login');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = teamCode.trim().toUpperCase();
    const cleanName = teamName.trim();

    if (entryMode === 'login' && !cleanCode) return;
    if (entryMode === 'register' && (!cleanName || !cleanCode)) return;

    soundEngine.playClick();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let team: Team;
      if (entryMode === 'login') {
        team = await loginTeamByRegisterCode(cleanCode);
      } else {
        team = await registerOrLoginTeam(cleanName, cleanCode);
      }

      setIsVerifying(true);
      soundEngine.playSuccess();

      setTimeout(() => {
        onTeamRegistered(team);
      }, 1400);
    } catch (err: any) {
      soundEngine.playError();
      setErrorMsg(err.message || 'Authentication failed. Check your Register Number.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#04060c] select-none">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-[#060914] to-[#020306] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-cyan-300 hover:text-white bg-[#0c1220] px-4 py-2 rounded-xl border border-cyan-500/30 transition-all shadow-md z-20"
      >
        <ArrowLeft className="w-4 h-4" /> MAIN TERMINAL
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0f1d]/90 border-2 border-cyan-500/40 rounded-3xl p-7 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center relative z-10"
      >
        {isVerifying ? (
          <div className="py-8 space-y-4 font-mono">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce shadow-[0_0_25px_#10b981]">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-emerald-400 tracking-wider">OPERATIVE CREDENTIALS ACCEPTED</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Clearance granted.<br />Infiltrating Cyber Vault chambers...
            </p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Shield className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-wide mb-1">
              OPERATIVE AUTHENTICATION
            </h2>
            <p className="text-xs text-gray-400 mb-5 font-mono">
              Escape the Cyber Vault • Dept of BSc CS with Cyber Security
            </p>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#060912] rounded-xl border border-white/10 mb-5 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEntryMode('login');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  entryMode === 'login'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>OPERATIVE LOGIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEntryMode('register');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  entryMode === 'register'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>NEW REGISTER</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left font-mono">
              {entryMode === 'register' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-cyan-300 uppercase mb-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>OPERATIVE / TEAM NAME</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Cyber Squad Alpha"
                    required={entryMode === 'register'}
                    className="w-full bg-[#050810] border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center justify-between text-xs text-cyan-300 uppercase mb-1.5 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>REGISTER NO. (VARCHAR)</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-normal lowercase tracking-normal">
                    alphanumeric
                  </span>
                </label>
                <input
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 22BCS101 / REG19909 / CYBER-01"
                  required
                  className="w-full bg-[#050810] border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-amber-400 uppercase tracking-wider outline-none transition-colors font-bold font-mono placeholder:text-gray-600"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  {entryMode === 'login'
                    ? 'Enter your assigned Register Number (letters, digits, dashes).'
                    : 'Supports alphanumeric varchar (e.g. 21BCS045, REG-101).'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-5 py-4 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {isLoading ? (
                  <span>AUTHENTICATING PROTOCOL...</span>
                ) : (
                  <>
                    <span>{entryMode === 'login' ? 'LOGIN & ENTER VAULT' : 'REGISTER & ENTER VAULT'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>

    </div>
  );
};
