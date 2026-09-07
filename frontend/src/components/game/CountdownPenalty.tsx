import React, { useState, useEffect } from 'react';
import { ShieldAlert, Timer } from 'lucide-react';

interface CountdownPenaltyProps {
  lockoutUntil: number;
  onLockoutEnd: () => void;
}

export const CountdownPenalty: React.FC<CountdownPenaltyProps> = ({ lockoutUntil, onLockoutEnd }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.max(0, Math.ceil(lockoutUntil - Date.now() / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const rem = Math.max(0, Math.ceil(lockoutUntil - Date.now() / 1000));
      setSecondsRemaining(rem);
      if (rem <= 0) {
        clearInterval(timer);
        onLockoutEnd();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutUntil, onLockoutEnd]);

  const formattedMins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const formattedSecs = String(secondsRemaining % 60).padStart(2, '0');

  return (
    <div className="w-full max-w-lg mx-auto my-8 p-8 bg-gradient-to-b from-rose-950/40 to-hunt-surface border border-rose-500/40 rounded-3xl text-center shadow-2xl shadow-rose-950/30">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
        <ShieldAlert className="w-8 h-8 text-rose-500" />
      </div>

      <h2 className="text-2xl font-bold font-mono text-white tracking-wide mb-2">RECOVERY MODE</h2>
      <p className="text-sm text-rose-300/80 mb-6 font-sans">
        Your expedition has depleted all lives. The system needs time to recalibrate safety protocols.
      </p>

      {/* Lockout Clock */}
      <div className="inline-flex items-center gap-3 bg-[#080B10] border border-rose-500/50 px-8 py-4 rounded-2xl shadow-inner mb-6">
        <Timer className="w-6 h-6 text-rose-400 animate-spin-slow" />
        <span className="text-4xl font-mono font-bold text-rose-400 tracking-widest">
          {formattedMins}:{formattedSecs}
        </span>
      </div>

      <p className="text-xs text-hunt-textMuted font-mono">
        Expedition will automatically resume when countdown finishes.
      </p>
    </div>
  );
};
