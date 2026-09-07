import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, ShieldCheck, Activity, Gauge, CheckCircle2, RefreshCw } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface CircuitStabilizeConsoleProps {
  hasSpareFuse: boolean;
  onFindFusePrompt?: () => void;
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'SHORT_CIRCUIT') => void;
  isSubmitting?: boolean;
}

interface RelayBus {
  id: string;
  label: string;
  voltage: string;
  color: string;
  targetId: string;
}

const RELAYS: RelayBus[] = [
  { id: 'relay_phase1', label: 'PHASE 1 BUS', voltage: '240V AC', color: 'bg-rose-500', targetId: 'term_p1' },
  { id: 'relay_neutral', label: 'NEUTRAL RETURN', voltage: '0V GND', color: 'bg-amber-400', targetId: 'term_n0' },
  { id: 'relay_aux', label: 'AUX LOGIC BUS', voltage: '12V DC', color: 'bg-cyan-400', targetId: 'term_a12' },
  { id: 'relay_flux', label: 'FLUX COIL BUS', voltage: '48V HF', color: 'bg-purple-500', targetId: 'term_f48' },
];

const TERMINALS = [
  { id: 'term_n0', label: 'TERMINAL N0 (0V)', matchId: 'relay_neutral' },
  { id: 'term_p1', label: 'TERMINAL P1 (240V)', matchId: 'relay_phase1' },
  { id: 'term_f48', label: 'TERMINAL F48 (48V)', matchId: 'relay_flux' },
  { id: 'term_a12', label: 'TERMINAL A12 (12V)', matchId: 'relay_aux' },
];

export const CircuitStabilizeConsole: React.FC<CircuitStabilizeConsoleProps> = ({
  hasSpareFuse,
  onFindFusePrompt,
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [stage, setStage] = useState<'WIRING' | 'STABILIZE'>('WIRING');
  const [selectedRelay, setSelectedRelay] = useState<string | null>(null);
  const [connections, setConnections] = useState<{ [relayId: string]: string }>({});
  
  // Stabilizer Meter State (Target: hold in green zone 40%-60% for 3 seconds)
  const [meterValue, setMeterValue] = useState<number>(20);
  const [isHoldingStabilizer, setIsHoldingStabilizer] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
  const [statusMessage, setStatusMessage] = useState<string>('Connect all 4 electrical relay lines to matching terminals.');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const meterIntervalRef = useRef<any>(null);

  const handleRelayClick = (id: string) => {
    soundEngine.playClick();
    soundEngine.playElectricZap();
    setSelectedRelay(id);
    const r = RELAYS.find((item) => item.id === id);
    setStatusMessage(`Selected ${r?.label} (${r?.voltage}). Connect to safe terminal.`);
  };

  const handleTerminalClick = (termId: string) => {
    if (!selectedRelay) {
      soundEngine.playClick();
      setStatusMessage('⚠️ Select a relay bus on the left first!');
      return;
    }

    const relay = RELAYS.find((r) => r.id === selectedRelay);
    if (!relay) return;

    if (relay.targetId === termId) {
      soundEngine.playWireConnect();
      soundEngine.playSuccess();
      const updated = { ...connections, [selectedRelay]: termId };
      setConnections(updated);
      setSelectedRelay(null);
      setStatusMessage(`✓ ${relay.label} safely linked.`);

      if (Object.keys(updated).length === RELAYS.length) {
        soundEngine.playTerminalType();
        if (!hasSpareFuse) {
          setStatusMessage('⚠️ RELAYS CONNECTED, BUT STAGE 2 IS OFFLINE: 50A Spare Fuse missing! Search the maintenance vent in this chamber.');
        } else {
          soundEngine.playFuseInsert();
          setStatusMessage('✓ 50A FUSE INSTALLED! PROCEEDING TO GRID FREQUENCY STABILIZATION...');
          setTimeout(() => {
            setStage('STABILIZE');
            setStatusMessage('Press and HOLD the Stabilizer Button to maintain needle inside the green zone for 3 seconds.');
          }, 1200);
        }
      }
    } else {
      // DANGER: Short Circuit Blast
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage(`🚨 CRITICAL SHORT CIRCUIT: Cross-voltage arc blast on ${relay.voltage}!`);
      setConnections({});
      setSelectedRelay(null);
      setTimeout(() => {
        onTriggerHazard('SHORT_CIRCUIT');
      }, 500);
    }
  };

  // Oscillating meter physics loop in Stabilize stage
  useEffect(() => {
    if (stage !== 'STABILIZE' || isCompleted) return;

    meterIntervalRef.current = setInterval(() => {
      setMeterValue((prev) => {
        let delta = (Math.random() - 0.5) * 8;
        if (isHoldingStabilizer) {
          delta += 4.2; // Pressure push up
        } else {
          delta -= 3.8; // Gravity drop down
        }
        const nextVal = Math.min(100, Math.max(0, prev + delta));

        // Check if in Red Danger Zone (>90)
        if (nextVal >= 92) {
          soundEngine.playShortCircuitExplosion();
          setStatusMessage('🚨 VOLTAGE CRITICAL OVERCHARGE: Grid exploded from redline surge!');
          clearInterval(meterIntervalRef.current);
          setTimeout(() => {
            onTriggerHazard('SHORT_CIRCUIT');
          }, 400);
          return 50;
        }

        // Green Zone is 40 to 65
        const isInGreenZone = nextVal >= 40 && nextVal <= 65;
        if (isInGreenZone) {
          setHoldProgress((p) => {
            const nextP = p + 4;
            if (nextP >= 100) {
              clearInterval(meterIntervalRef.current);
              setIsCompleted(true);
              soundEngine.playSuccess();
              soundEngine.playEmpBurst();
              setStatusMessage('⚡ POWER GRID STABILIZED! POWER SURGE CELL CHARGED & READY FOR BOSS COMBAT!');
              setTimeout(() => {
                onSubmit('POWER_SURGE_CHARGED');
              }, 1200);
              return 100;
            }
            return nextP;
          });
        } else {
          setHoldProgress((p) => Math.max(0, p - 3));
        }

        return nextVal;
      });
    }, 100);

    return () => clearInterval(meterIntervalRef.current);
  }, [stage, isHoldingStabilizer, isCompleted]);

  return (
    <div className="w-full bg-[#0d0905] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl relative select-none font-mono overflow-hidden">
      {/* Background Warning Stripe pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b08_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-amber-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              SECTOR 2: HIGH-VOLTAGE POWER SUBSTATION
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stage === 'WIRING' ? 'STAGE 1: RELAY BUSBARS' : 'STAGE 2: GRID STABILIZER'}
              </span>
            </h3>
            <p className="text-xs text-amber-200/70">
              Restore relay connections, seat the spare fuse, and hold voltage frequency in the green zone.
            </p>
          </div>
        </div>

        {/* Fuse Socket Status Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${
          hasSpareFuse
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            : 'bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse'
        }`}>
          <span>50A FUSE: {hasSpareFuse ? '✓ SEATED' : '❌ MISSING (VENT)'}</span>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-[#181108] border border-amber-500/30 rounded-2xl p-3 mb-6 flex items-center justify-between gap-4 text-xs relative z-10">
        <div className="flex items-center gap-2 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        {stage === 'STABILIZE' && (
          <div className="bg-black/50 px-3 py-1 rounded-lg border border-amber-500/40 text-amber-400 font-bold">
            LOCK: {Math.round(holdProgress)}%
          </div>
        )}
      </div>

      {/* Stage 1: Relay Wiring */}
      {stage === 'WIRING' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Relays */}
            <div className="space-y-3 bg-[#120d07] p-4 rounded-2xl border border-amber-500/20">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                High-Voltage Relay Busbars
              </div>
              {RELAYS.map((relay) => {
                const isConnected = !!connections[relay.id];
                const isSelected = selectedRelay === relay.id;
                return (
                  <button
                    key={relay.id}
                    disabled={isConnected}
                    onClick={() => handleRelayClick(relay.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isConnected
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 opacity-60'
                        : isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white'
                        : 'bg-[#1e150b] border-white/10 hover:border-amber-500/50 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${relay.color}`} />
                      <span className="text-xs font-bold">{relay.label}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-amber-400">
                      {isConnected ? '✓ LOCKED' : relay.voltage}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Terminals */}
            <div className="space-y-3 bg-[#120d07] p-4 rounded-2xl border border-amber-500/20">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                Load Receiving Terminals
              </div>
              {TERMINALS.map((term) => {
                const isConnected = Object.values(connections).includes(term.id);
                return (
                  <button
                    key={term.id}
                    disabled={isConnected}
                    onClick={() => handleTerminalClick(term.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isConnected
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 opacity-60'
                        : 'bg-[#1e150b] border-white/10 hover:border-amber-400 text-gray-300 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold">{term.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-amber-400">
                      {isConnected ? 'ENERGIZED' : 'OPEN'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fuse Warning / Transition Prompt */}
          {Object.keys(connections).length === RELAYS.length && !hasSpareFuse && (
            <div className="p-4 bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-rose-300 text-xs">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
                <span>
                  <strong>MISSING SPARE FUSE:</strong> Stage 2 stabilizer is deadlocked without a 50A spare fuse. Inspect the maintenance vent in this room to retrieve the fuse!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 2: Stabilize Meter */}
      {stage === 'STABILIZE' && (
        <div className="space-y-6 relative z-10 py-2">
          {/* Visual Gauge Bar */}
          <div className="bg-[#140e08] p-6 rounded-3xl border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span className="text-blue-400">LOW DAMPENING (0V)</span>
              <span className="text-emerald-400">OPTIMAL STABILITY ZONE (40–65V)</span>
              <span className="text-rose-400">DANGER OVERHEAT (90V+)</span>
            </div>

            {/* Gauge Track */}
            <div className="relative h-10 w-full bg-black/60 rounded-2xl border-2 border-white/10 overflow-hidden flex items-center">
              {/* Blue underzone */}
              <div className="absolute left-0 top-0 bottom-0 w-[40%] bg-blue-950/40 border-r border-white/10" />
              {/* Green sweet spot */}
              <div className="absolute left-[40%] top-0 bottom-0 w-[25%] bg-emerald-500/30 border-x-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
              {/* Red danger zone */}
              <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-rose-500/40 border-l-2 border-rose-500" />

              {/* Moving Pointer Needle */}
              <motion.div
                animate={{ left: `${meterValue}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute top-0 bottom-0 w-3 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] rounded-full -ml-1.5 z-20"
              />
            </div>

            {/* Progress lock meter */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Stabilization Calibration Lock</span>
                <span className="text-amber-300 font-bold">{Math.round(holdProgress)}%</span>
              </div>
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-100"
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Hold Button Control */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              onMouseDown={() => {
                soundEngine.playClick();
                setIsHoldingStabilizer(true);
              }}
              onMouseUp={() => setIsHoldingStabilizer(false)}
              onTouchStart={() => {
                soundEngine.playClick();
                setIsHoldingStabilizer(true);
              }}
              onTouchEnd={() => setIsHoldingStabilizer(false)}
              disabled={isCompleted || isSubmitting}
              className={`w-full max-w-md py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${
                isHoldingStabilizer
                  ? 'bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-95'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              }`}
            >
              <Zap className="w-5 h-5 animate-pulse" />
              <span>{isHoldingStabilizer ? '⚡ HOLDING VOLTAGE PRESSURE...' : 'PRESS & HOLD STABILIZER BUTTON'}</span>
            </button>
            <span className="text-[11px] text-gray-400">
              Keep needle within the green zone until calibration reaches 100%. Don't let it hit the red danger zone!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
