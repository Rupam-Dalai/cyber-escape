import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Wifi, Radio, Server, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Activity } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface ServerPatchConsoleProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'DATA_SURGE') => void;
  isSubmitting?: boolean;
}

export const ServerPatchConsole: React.FC<ServerPatchConsoleProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [selectedGateway, setSelectedGateway] = useState<string>('10.0.0.1');
  const [selectedPort, setSelectedPort] = useState<string>('22');
  const [selectedSubnet, setSelectedSubnet] = useState<string>('255.0.0.0');
  const [frequencyGbps, setFrequencyGbps] = useState<number>(10);
  const [isPatchApplied, setIsPatchApplied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Align Gateway to 192.168.1.1, Port 8080, Subnet 255.255.255.0, and Optical Frequency to 100 Gbps.');

  const isCorrectConfig =
    selectedGateway === '192.168.1.1' &&
    selectedPort === '8080' &&
    selectedSubnet === '255.255.255.0' &&
    frequencyGbps === 100;

  const handleApplyPatch = () => {
    soundEngine.playClick();

    // Check if frequency is overclocked to dangerous level
    if (frequencyGbps > 100) {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage(`🚨 CRITICAL OPTICAL SURGE: Frequency ${frequencyGbps} Gbps overloaded the laser diodes!`);
      setTimeout(() => {
        onTriggerHazard('DATA_SURGE');
      }, 500);
      return;
    }

    if (isCorrectConfig) {
      soundEngine.playSuccess();
      soundEngine.playTerminalType();
      setIsPatchApplied(true);
      setStatusMessage('✓ SERVER RACK ARRAY SYNCHRONIZED! OPTICAL MATRIX TOKEN UNLOCKED!');
      setTimeout(() => {
        onSubmit('SERVER_ARRAY_RESTORED');
      }, 1200);
    } else {
      soundEngine.playError();
      setStatusMessage('⚠️ Gateway routing misaligned. Check protocol parameters in case notes!');
    }
  };

  return (
    <div className="w-full bg-[#080b12] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative select-none overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-cyan-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
              SERVER RACK OPTICAL PATCHBOARD
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AMONG-US COMM PANEL
              </span>
            </h3>
            <p className="text-xs text-cyan-200/70 font-mono">
              Calibrate laser diodes & packet routes without triggering an optical surge shockwave.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>FIBER-01: READY</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#0f1828] border border-cyan-500/30 rounded-2xl p-3 mb-6 flex items-center justify-between gap-4 font-mono text-xs relative z-10">
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="bg-black/50 px-3 py-1 rounded-lg border border-cyan-500/40 text-cyan-400 font-bold">
          FREQUENCY: {frequencyGbps} GBPS
        </div>
      </div>

      {/* Interactive Switchboard Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#050912] border border-white/10 rounded-2xl p-6 relative z-10">
        
        {/* Left Column: Router Gateway & Port Selector */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase font-bold mb-2">
              1. TARGET GATEWAY IP
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['10.0.0.1', '172.16.0.4', '192.168.1.1'].map((ip) => (
                <button
                  key={ip}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedGateway(ip);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    selectedGateway === ip
                      ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-[#101726] border-white/10 text-gray-400 hover:border-cyan-500/30'
                  }`}
                >
                  {ip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase font-bold mb-2">
              2. SERVER NETWORK PORT
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['22 (SSH)', '8080 (HTTP)', '443 (TLS)'].map((portStr) => {
                const portVal = portStr.split(' ')[0];
                return (
                  <button
                    key={portStr}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPort(portVal);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                      selectedPort === portVal
                        ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-[#101726] border-white/10 text-gray-400 hover:border-cyan-500/30'
                    }`}
                  >
                    {portStr}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase font-bold mb-2">
              3. SUBNET MASK
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['255.0.0.0', '255.255.255.0'].map((mask) => (
                <button
                  key={mask}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedSubnet(mask);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    selectedSubnet === mask
                      ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-[#101726] border-white/10 text-gray-400 hover:border-cyan-500/30'
                  }`}
                >
                  {mask}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Laser Frequency Dial & Apply Button */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-gray-400 uppercase font-bold">
                4. OPTICAL FREQUENCY CALIBRATION
              </label>
              <span className={`text-xs font-mono font-bold ${frequencyGbps > 100 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                {frequencyGbps} Gbps {frequencyGbps > 100 && '⚠️ OVERCLOCK HAZARD'}
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={frequencyGbps}
              onChange={(e) => {
                soundEngine.playTerminalType();
                setFrequencyGbps(Number(e.target.value));
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
              <span>10 Gbps (Underpowered)</span>
              <span className="text-cyan-400 font-bold">100 Gbps (Optimal)</span>
              <span className="text-rose-500 font-bold">200 Gbps (Surge Blast!)</span>
            </div>
          </div>

          {/* Live Router LED Rack Preview */}
          <div className="bg-[#0b101c] border border-cyan-500/20 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-mono text-cyan-300 uppercase font-bold flex items-center justify-between">
              <span>ROUTER STATUS MATRIX</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 rounded-md border flex items-center justify-center text-[8px] font-mono ${
                    isCorrectConfig
                      ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200 animate-pulse'
                      : i % 2 === 0
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  P{i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyPatch}
            disabled={isSubmitting || isPatchApplied}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            {isPatchApplied ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>SERVER ARRAY PATCHED</span>
              </>
            ) : (
              <>
                <Cpu className="w-5 h-5" />
                <span>TRANSMIT NETWORK PATCH</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-cyan-200/60">
        <span>Fiber Optic Bus: Channel 01 Active</span>
        <span className="text-rose-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Frequencies above 100 Gbps cause catastrophic optical surge shockwaves!
        </span>
      </div>

    </div>
  );
};
