import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, KeyRound, Lock, Unlock, ShieldAlert, CheckCircle2, AlertTriangle, Terminal, Sparkles } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface DatabaseVaultConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'LASER_TRAP') => void;
  isSubmitting?: boolean;
}

export const DatabaseVaultConsole: React.FC<DatabaseVaultConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [isQueryExecuted, setIsQueryExecuted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Execute the Root SQL Query to decrypt the door passcode, then transmit the code on the keypad.');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  const handleExecuteQuery = () => {
    soundEngine.playTerminalType();
    soundEngine.playSuccess();
    setIsQueryExecuted(true);
    setStatusMessage('✓ SQL Query executed successfully. Passcode discovered: VAULT-9082-ROOT');
  };

  const handleKeypadPress = (val: string) => {
    soundEngine.playTerminalType();
    if (val === 'CLEAR') {
      setKeypadInput('');
      return;
    }
    if (val === 'BACK') {
      setKeypadInput((prev) => prev.slice(0, -1));
      return;
    }
    if (keypadInput.length < 18) {
      setKeypadInput((prev) => prev + val);
    }
  };

  const handleQuickPaste = () => {
    soundEngine.playClick();
    setKeypadInput('VAULT-9082-ROOT');
  };

  const handleTriggerExploitHazard = () => {
    soundEngine.playElectricZap();
    soundEngine.playShortCircuitExplosion();
    setStatusMessage('🚨 SECURITY ALERT: Unauthorized SQL Injection trap detected! Laser turrets engaged!');
    setTimeout(() => {
      onTriggerHazard('LASER_TRAP');
    }, 500);
  };

  const handleSubmitKeypad = () => {
    soundEngine.playClick();
    const clean = keypadInput.trim().toUpperCase().replace(/ /g, '');

    if (clean.includes("OR1=1") || clean.includes("DROP") || clean.includes("INJECTION")) {
      handleTriggerExploitHazard();
      return;
    }

    const noDash = clean.replace(/-/g, '');
    const isRootMatch =
      clean === 'VAULT-9082-ROOT' ||
      clean === 'VAULT-9082-R00T' ||
      clean === 'VAULT-9O82-ROOT' ||
      clean === 'VAULT-9O82-R00T' ||
      noDash === 'VAULT9082ROOT' ||
      noDash === 'VAULT9082R00T' ||
      noDash === 'VAULT9O82ROOT' ||
      noDash === 'VAULT9O82R00T' ||
      clean === '9082' ||
      clean === '9082-ROOT' ||
      clean === '9082-R00T' ||
      clean === 'ROOT' ||
      clean === 'R00T';

    if (isRootMatch) {
      soundEngine.playSuccess();
      soundEngine.playUnlockDoor();
      setIsUnlocked(true);
      setStatusMessage('✓ DATABASE VAULT UNLOCKED! ROOT SECURITY CERTIFICATE EXTRACTED!');
      setTimeout(() => {
        onSubmit('VAULT-9082-ROOT');
      }, 1200);
    } else {
      soundEngine.playError();
      setStatusMessage('⚠️ Invalid vault door passcode. Run the SQL query to inspect the decrypted record!');
    }
  };

  return (
    <div className="w-full bg-[#080b12] border-2 border-purple-500/40 rounded-3xl p-6 shadow-2xl relative select-none overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f708_1px,transparent_1px),linear-gradient(to_bottom,#a855f708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-purple-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
              DATABASE SECURITY VAULT & CIPHER LOCK
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SECTOR-04 ROOT
              </span>
            </h3>
            <p className="text-xs text-purple-200/70 font-mono">
              Execute root credentials query to extract door passcode and obtain the Root Certificate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-mono text-purple-300">
          {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
          <span>VAULT: {isUnlocked ? 'UNLOCKED' : 'SEALED'}</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#140e24] border border-purple-500/30 rounded-2xl p-3 mb-6 flex items-center justify-between gap-4 font-mono text-xs relative z-10">
        <div className="flex items-center gap-2 text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="bg-black/50 px-3 py-1 rounded-lg border border-purple-500/40 text-purple-400 font-bold">
          SECURITY: ROOT ENCRYPTED
        </div>
      </div>

      {/* Main Grid: SQL Query Engine on Left, Vault Keypad on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Left Column: SQL Terminal & Table Schema */}
        <div className="space-y-4">
          <div className="bg-[#0b0716] border border-purple-500/30 rounded-2xl p-4 font-mono">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-500/20 text-[10px] text-gray-400 uppercase font-bold">
              <span className="flex items-center gap-1.5 text-purple-300">
                <Terminal className="w-3.5 h-3.5" /> ROOT SQL QUERY CONSOLE
              </span>
              <span>SCHEMA: security_vault</span>
            </div>

            <pre className="text-xs text-cyan-300 bg-black/60 p-3 rounded-xl border border-white/5 overflow-x-auto leading-relaxed">
{`SELECT vault_door_pass, root_cert 
FROM security_vault 
WHERE clearance_level = 'ROOT' 
  AND is_active = 1;`}
            </pre>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleExecuteQuery}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Database className="w-3.5 h-3.5" /> RUN ROOT QUERY
              </button>
            </div>
          </div>

          {/* Query Result Panel */}
          {isQueryExecuted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 font-mono text-xs space-y-2"
            >
              <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center justify-between">
                <span>QUERY OUTPUT [1 ROW RETURNED]</span>
                <span className="text-emerald-300">SUCCESS 200</span>
              </div>
              <div className="bg-black/60 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-400">VAULT_DOOR_PASS:</div>
                  <div className="text-sm font-black text-amber-300 tracking-wider">VAULT-9082-ROOT</div>
                </div>
                <button
                  onClick={handleQuickPaste}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold"
                >
                  INSERT CODE
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-black/40 border border-dashed border-purple-500/30 rounded-2xl p-4 text-center text-xs font-mono text-gray-500">
              Run the SQL query above to decrypt and inspect the vault door access records.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTriggerExploitHazard}
              className="w-full py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 font-mono text-[10px] flex items-center justify-center gap-1 transition-all"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>TEST SQL INJECTION: "' OR 1=1 --" (⚠️ HAZARD TRAP)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Vault Keypad */}
        <div className="bg-[#0c0817] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-gray-400 uppercase font-bold">
              VAULT KEYPAD ENTRY
            </label>
            <span className="text-[10px] font-mono text-purple-300">
              {keypadInput.length} / 18 CHARS
            </span>
          </div>

          {/* Keypad Display */}
          <div className="bg-black/80 border-2 border-purple-500/50 rounded-2xl p-3.5 text-center shadow-inner">
            <input
              type="text"
              value={keypadInput}
              onChange={(e) => setKeypadInput(e.target.value.toUpperCase())}
              placeholder="ENTER PASSCODE..."
              className="w-full bg-transparent text-center text-lg font-mono font-black text-amber-400 tracking-widest outline-none uppercase placeholder-gray-600"
            />
          </div>

          {/* Number & Symbol Pad */}
          <div className="grid grid-cols-4 gap-2">
            {[
              '1', '2', '3', '0',
              '4', '5', '6', '-',
              '7', '8', '9', 'BACK',
              'V', 'A', 'U', 'L',
              'T', 'R', 'O', 'CLEAR',
            ].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all active:scale-95 ${
                  key === 'CLEAR'
                    ? 'bg-rose-950/50 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                    : key === 'BACK'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                    : key === 'O' || key === '0'
                    ? 'bg-[#1b1338] hover:bg-[#281d52] border-purple-500/50 text-cyan-200 shadow-sm'
                    : 'bg-[#150f29] hover:bg-[#20183d] border-white/10 text-white hover:border-purple-500/40'
                }`}
              >
                {key === 'BACK' ? '⌫' : key}
              </button>
            ))}
          </div>

          {/* Unlock Button */}
          <button
            onClick={handleSubmitKeypad}
            disabled={isSubmitting || isUnlocked}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            {isUnlocked ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>ROOT CERTIFICATE EXTRACTED</span>
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5" />
                <span>TRANSMIT VAULT PASSCODE</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-purple-200/60">
        <span>Vault Clearance: Root Administrator</span>
        <span className="text-rose-400 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Unauthorized SQL injection triggers perimeter defense lasers!
        </span>
      </div>

    </div>
  );
};
