import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, ShieldCheck, AlertTriangle, Sparkles, CheckCircle2, RotateCw, HelpCircle, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface CircuitBreadboardConsoleProps {
  hasFuse: boolean;
  hasLogicIC: boolean;
  hasCapacitor: boolean;
  onNavigateToRoom?: (roomId: string) => void;
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'SHORT_CIRCUIT') => void;
  isSubmitting?: boolean;
}

interface ComponentSlot {
  id: string;
  name: string;
  type: 'FUSE' | 'LOGIC_IC' | 'CAPACITOR';
  description: string;
  expectedPartId: string;
  locationHint: string;
  targetRoomId: string;
  x: number; // Socket visual X (%)
  y: number; // Socket visual Y (%)
}

const SOCKETS: ComponentSlot[] = [
  {
    id: 'socket_fuse',
    name: 'MAIN 50A FUSE RAIL',
    type: 'FUSE',
    description: 'High-current ceramic fuse socket protecting the voltage regulator.',
    expectedPartId: 'part_fuse',
    locationHint: 'Sector-02 Maintenance Vent Grill (Behind Transformer)',
    targetRoomId: 'POWER_GRID',
    x: 20,
    y: 35,
  },
  {
    id: 'socket_ic',
    name: 'DUAL AND-GATE IC SOCKET (DIP-14)',
    type: 'LOGIC_IC',
    description: '14-pin logic chip socket for emergency interlock logic gating.',
    expectedPartId: 'part_ic',
    locationHint: 'Sector-04 Dev Workbench Chest (Microservice Hub)',
    targetRoomId: 'BACKEND_API',
    x: 50,
    y: 35,
  },
  {
    id: 'socket_cap',
    name: 'SMOOTHING CAPACITOR BUS (100µF)',
    type: 'CAPACITOR',
    description: 'Electrolytic capacitor socket to filter ripple harmonics.',
    expectedPartId: 'part_cap',
    locationHint: 'Sector-05 SOC Tool Locker (Firewall Perimeter)',
    targetRoomId: 'FIREWALL_PERIMETER',
    x: 80,
    y: 35,
  },
];

export const CircuitBreadboardConsole: React.FC<CircuitBreadboardConsoleProps> = ({
  hasFuse,
  hasLogicIC,
  hasCapacitor,
  onNavigateToRoom,
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [seatedComponents, setSeatedComponents] = useState<{ [slotId: string]: string }>({});
  const [selectedInventoryPart, setSelectedInventoryPart] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'BROKEN CIRCUIT DIAGNOSTIC: 3 critical components are missing from the Stage 2 Stabilizer PCB.'
  );
  const [isEnergized, setIsEnergized] = useState(false);

  // Determine available inventory parts
  const inventoryParts = [
    {
      id: 'part_fuse',
      name: '50A Ceramic Fuse',
      icon: '🔩',
      type: 'FUSE',
      owned: hasFuse,
      hint: 'Found in Sector 02 Vent',
      color: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'part_ic',
      name: '74LS08 Logic IC',
      icon: '📟',
      type: 'LOGIC_IC',
      owned: hasLogicIC,
      hint: 'Found in Sector 04 Workbench',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'part_cap',
      name: '100µF Capacitor',
      icon: '⚡',
      type: 'CAPACITOR',
      owned: hasCapacitor,
      hint: 'Found in Sector 05 SOC Locker',
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  const handleSelectInventoryPart = (partId: string) => {
    soundEngine.playClick();
    setSelectedInventoryPart(partId);
    const p = inventoryParts.find((item) => item.id === partId);
    setStatusMessage(`Selected ${p?.name}. Drag or click on its matching PCB socket on the breadboard.`);
  };

  const handleSeatInSocket = (slotId: string) => {
    if (!selectedInventoryPart) {
      soundEngine.playClick();
      setStatusMessage('⚠️ Select a component from your inventory dock below first!');
      return;
    }

    const slot = SOCKETS.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.expectedPartId === selectedInventoryPart) {
      soundEngine.playFuseInsert();
      soundEngine.playSuccess();
      const updated = { ...seatedComponents, [slotId]: selectedInventoryPart };
      setSeatedComponents(updated);
      setSelectedInventoryPart(null);
      setStatusMessage(`✓ ${slot.name} seated and locked securely into PCB.`);

      // Check if all 3 parts are seated
      if (Object.keys(updated).length === 3) {
        soundEngine.playElectricZap();
        soundEngine.playShield();
        setIsEnergized(true);
        setStatusMessage('⚡ ALL COMPONENTS INSTALLED! CIRCUIT CONTINUITY RESTORED! POWER FLOW ONLINE!');
        setTimeout(() => {
          onSubmit('CIRCUIT_REPAIRED');
        }, 1500);
      }
    } else {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage(`🚨 COMPONENT MISMATCH: Incorrect component seated in ${slot.name}!`);
      setTimeout(() => {
        onTriggerHazard('SHORT_CIRCUIT');
      }, 500);
    }
  };

  const handleDirectDrop = (slotId: string, partId: string) => {
    setSelectedInventoryPart(partId);
    const slot = SOCKETS.find((s) => s.id === slotId);
    if (slot && slot.expectedPartId === partId) {
      soundEngine.playFuseInsert();
      soundEngine.playSuccess();
      const updated = { ...seatedComponents, [slotId]: partId };
      setSeatedComponents(updated);
      setSelectedInventoryPart(null);
      setStatusMessage(`✓ ${slot.name} snapped securely into PCB.`);

      if (Object.keys(updated).length === 3) {
        soundEngine.playElectricZap();
        soundEngine.playShield();
        setIsEnergized(true);
        setStatusMessage('⚡ ALL COMPONENTS INSTALLED! CIRCUIT CONTINUITY RESTORED! POWER FLOW ONLINE!');
        setTimeout(() => {
          onSubmit('CIRCUIT_REPAIRED');
        }, 1500);
      }
    } else {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage(`🚨 COMPONENT MISMATCH: Incorrect socket placement!`);
      setTimeout(() => {
        onTriggerHazard('SHORT_CIRCUIT');
      }, 500);
    }
  };

  const allPartsGathered = hasFuse && hasLogicIC && hasCapacitor;

  return (
    <div className="w-full bg-[#080d16] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl relative select-none font-mono overflow-hidden">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b08_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b08_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-amber-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              PCB BREADBOARD CIRCUIT RESTORATION
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STAGE-02 HARDWARE FIX
              </span>
            </h3>
            <p className="text-xs text-amber-200/70">
              Gather missing electronic parts from facility rooms and seat them in matching PCB sockets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300">
          <Zap className={`w-4 h-4 ${isEnergized ? 'text-amber-400 animate-bounce' : 'text-gray-500'}`} />
          <span>{isEnergized ? 'CIRCUIT ENERGIZED (100%)' : 'STATUS: BROKEN (0%)'}</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#121927] border border-amber-500/30 rounded-2xl p-3 mb-5 flex items-center justify-between gap-4 text-xs relative z-10">
        <div className="flex items-center gap-2 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="text-[11px] px-2.5 py-1 bg-black/40 border border-amber-500/20 rounded-lg text-amber-400 font-bold">
          SEATED: {Object.keys(seatedComponents).length} / 3
        </div>
      </div>

      {/* Interactive PCB Breadboard Surface */}
      <div className="relative w-full h-64 bg-[#0a1813] border-2 border-emerald-500/40 rounded-2xl p-4 mb-6 shadow-inner overflow-hidden flex flex-col justify-between">
        
        {/* PCB Copper Traces Glow */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          {/* Trace lines between sockets */}
          <path
            d="M 60 120 L 160 120 L 160 80 L 320 80 L 320 120 L 480 120 L 480 80 L 640 80 L 640 120"
            stroke={isEnergized ? '#fbbf24' : '#059669'}
            strokeWidth={isEnergized ? 4 : 2}
            fill="none"
            strokeDasharray={isEnergized ? '6,3' : 'none'}
            className={isEnergized ? 'animate-pulse' : ''}
          />
          <path
            d="M 160 160 L 320 160 L 320 200 L 480 200 L 480 160 L 640 160"
            stroke={isEnergized ? '#fbbf24' : '#059669'}
            strokeWidth={isEnergized ? 3 : 1.5}
            fill="none"
          />
        </svg>

        {/* PCB Watermark / Model Stamp */}
        <div className="text-[10px] text-emerald-400/40 font-bold flex justify-between z-10">
          <span>CYBER-VAULT INDUSTRIAL POWER STABILIZER PCB REV 4.2</span>
          <span>DANGER: HIGH VOLTAGE 240V</span>
        </div>

        {/* 3 Component Sockets on PCB */}
        <div className="grid grid-cols-3 gap-4 z-10 my-auto">
          {SOCKETS.map((socket) => {
            const isSeated = !!seatedComponents[socket.id];
            const isExpectedPartHeld = selectedInventoryPart === socket.expectedPartId;

            return (
              <div
                key={socket.id}
                onClick={() => handleSeatInSocket(socket.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedPartId = e.dataTransfer.getData('text/plain');
                  if (droppedPartId) handleDirectDrop(socket.id, droppedPartId);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center relative ${
                  isSeated
                    ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : isExpectedPartHeld
                    ? 'bg-amber-500/20 border-amber-400 border-dashed animate-pulse'
                    : 'bg-black/60 border-emerald-500/30 hover:border-amber-400/60'
                }`}
              >
                <div className="text-[10px] font-bold text-amber-300 uppercase mb-1">
                  {socket.name}
                </div>

                {isSeated ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 text-emerald-400 font-bold text-xs py-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>COMPONENT SEATED ✓</span>
                  </motion.div>
                ) : (
                  <div className="py-2 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-lg border border-dashed border-gray-500 flex items-center justify-center text-gray-500 text-lg mb-1">
                      ?
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {isExpectedPartHeld ? 'CLICK TO SEAT PART' : 'EMPTY SOCKET'}
                    </span>
                  </div>
                )}

                <div className="text-[9px] text-gray-400/80 mt-1 line-clamp-1">
                  {socket.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* PCB Footing Status */}
        <div className="flex items-center justify-between text-[10px] text-emerald-400/60 z-10">
          <span>GROUND PLANE: VERIFIED</span>
          <span>STAGE-2 CAPACITANCE: {isEnergized ? '48.2 µF (NOMINAL)' : '0.0 µF (OPEN CIRCUIT)'}</span>
        </div>
      </div>

      {/* Operative Backpack / Component Dock */}
      <div className="bg-[#0b101c] border border-amber-500/30 rounded-2xl p-4 relative z-10">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>OPERATIVE INVENTORY: CIRCUIT COMPONENTS</span>
          </div>
          <span className="text-[11px] text-gray-400">
            {allPartsGathered ? 'ALL 3 PARTS IN BACKPACK' : 'GATHER MISSING PARTS FROM FACILITY ROOMS'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {inventoryParts.map((part) => {
            const isSelected = selectedInventoryPart === part.id;
            const isAlreadySeated = Object.values(seatedComponents).includes(part.id);

            return (
              <div
                key={part.id}
                draggable={part.owned && !isAlreadySeated}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', part.id);
                  setSelectedInventoryPart(part.id);
                }}
                onClick={() => {
                  if (part.owned && !isAlreadySeated) {
                    handleSelectInventoryPart(part.id);
                  }
                }}
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 relative ${
                  isAlreadySeated
                    ? 'bg-black/30 border-white/5 opacity-40 cursor-default'
                    : part.owned
                    ? isSelected
                      ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-grab'
                      : 'bg-[#141d30] border-amber-500/40 hover:border-amber-400 cursor-grab'
                    : 'bg-black/50 border-rose-500/30 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-xl shrink-0">
                  {part.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{part.name}</span>
                    {part.owned ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        IN BACKPACK
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        MISSING
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {part.owned ? (isAlreadySeated ? 'Installed in PCB' : 'Ready to seat') : part.hint}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
