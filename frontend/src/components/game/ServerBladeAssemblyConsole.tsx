import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, HardDrive, Cpu, Radio, CheckCircle2, AlertTriangle, Sparkles, Zap, Shield } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface ServerBladeAssemblyConsoleProps {
  hasRam: boolean;
  hasSfp: boolean;
  hasNvme: boolean;
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'DATA_SURGE') => void;
  isSubmitting?: boolean;
}

interface ServerBay {
  id: string;
  name: string;
  type: 'RAM' | 'SFP' | 'NVME';
  description: string;
  expectedPartId: string;
  locationHint: string;
}

const SERVER_BAYS: ServerBay[] = [
  {
    id: 'bay_ram',
    name: 'DIMM CHANNEL A1 (ECC DDR5)',
    type: 'RAM',
    description: 'High-speed 64GB ECC Server RAM slot for memory caching tables.',
    expectedPartId: 'part_ram',
    locationHint: 'Sector-03 Cold Storage Monolith (Database Vault)',
  },
  {
    id: 'bay_sfp',
    name: 'SFP+ 10G OPTICAL TRANSCEIVER PORT',
    type: 'SFP',
    description: '10-Gigabit optical transceiver module bay for fiber trunk.',
    expectedPartId: 'part_sfp',
    locationHint: 'Sector-00 Supply Crate (Central Hub)',
  },
  {
    id: 'bay_nvme',
    name: 'M.2 NVMe PCIE SSD STORAGE BLADE',
    type: 'NVME',
    description: 'Solid-state storage blade containing kernel boot filesystem.',
    expectedPartId: 'part_nvme',
    locationHint: 'Sector-07 Evidence Locker (Forensics Lab)',
  },
];

export const ServerBladeAssemblyConsole: React.FC<ServerBladeAssemblyConsoleProps> = ({
  hasRam,
  hasSfp,
  hasNvme,
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [slottedParts, setSlottedParts] = useState<{ [bayId: string]: string }>({});
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isPoweringUp, setIsPoweringUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    'SERVER CHASSIS OFFLINE: 3 hardware modules must be installed into Blade Server Rack Alpha.'
  );

  const inventoryParts = [
    {
      id: 'part_ram',
      name: 'ECC DDR5 Server RAM',
      icon: '💾',
      type: 'RAM',
      owned: hasRam,
      hint: 'Found in Sector 03 Cold Storage',
    },
    {
      id: 'part_sfp',
      name: 'SFP+ Optical Transceiver',
      icon: '📡',
      type: 'SFP',
      owned: hasSfp,
      hint: 'Found in Central Hub Supply Crate',
    },
    {
      id: 'part_nvme',
      name: 'NVMe SSD Storage Blade',
      icon: '💽',
      type: 'NVME',
      owned: hasNvme,
      hint: 'Found in Sector 07 Evidence Safe',
    },
  ];

  const handleSelectPart = (partId: string) => {
    soundEngine.playClick();
    setSelectedPartId(partId);
    const p = inventoryParts.find((item) => item.id === partId);
    setStatusMessage(`Selected ${p?.name}. Click on its matching server slot on the motherboard.`);
  };

  const handleSlotInBay = (bayId: string) => {
    if (!selectedPartId) {
      soundEngine.playClick();
      setStatusMessage('⚠️ Select a hardware part from the inventory dock below first!');
      return;
    }

    const bay = SERVER_BAYS.find((b) => b.id === bayId);
    if (!bay) return;

    if (bay.expectedPartId === selectedPartId) {
      soundEngine.playWireConnect();
      soundEngine.playSuccess();
      const updated = { ...slottedParts, [bayId]: selectedPartId };
      setSlottedParts(updated);
      setSelectedPartId(null);
      setStatusMessage(`✓ ${bay.name} slotted and locked into chassis!`);

      if (Object.keys(updated).length === 3) {
        soundEngine.playTerminalType();
        soundEngine.playShield();
        setIsPoweringUp(true);
        setStatusMessage('⚡ ALL 3 HARDWARE MODULES INSTALLED! BLADE SERVER BOOTING TO 100% ONLINE!');
        setTimeout(() => {
          onSubmit('SERVER_HARDWARE_REPAIRED');
        }, 1500);
      }
    } else {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage(`🚨 HARDWARE FAULT: Incompatible module inserted into ${bay.name}!`);
      setTimeout(() => {
        onTriggerHazard('DATA_SURGE');
      }, 500);
    }
  };

  const handleDirectDrop = (bayId: string, partId: string) => {
    setSelectedPartId(partId);
    const bay = SERVER_BAYS.find((b) => b.id === bayId);
    if (bay && bay.expectedPartId === partId) {
      soundEngine.playWireConnect();
      soundEngine.playSuccess();
      const updated = { ...slottedParts, [bayId]: partId };
      setSlottedParts(updated);
      setSelectedPartId(null);
      setStatusMessage(`✓ ${bay.name} slotted into chassis!`);

      if (Object.keys(updated).length === 3) {
        soundEngine.playTerminalType();
        soundEngine.playShield();
        setIsPoweringUp(true);
        setStatusMessage('⚡ ALL 3 HARDWARE MODULES INSTALLED! BLADE SERVER BOOTING TO 100% ONLINE!');
        setTimeout(() => {
          onSubmit('SERVER_HARDWARE_REPAIRED');
        }, 1500);
      }
    } else {
      soundEngine.playElectricZap();
      soundEngine.playShortCircuitExplosion();
      setStatusMessage(`🚨 HARDWARE FAULT: Incompatible module placement!`);
      setTimeout(() => {
        onTriggerHazard('DATA_SURGE');
      }, 500);
    }
  };

  const allPartsOwned = hasRam && hasSfp && hasNvme;

  return (
    <div className="w-full bg-[#050b14] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative select-none font-mono overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-cyan-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              BLADE SERVER HARDWARE ASSEMBLY & REPAIR
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SECTOR-01 REPAIR
              </span>
            </h3>
            <p className="text-xs text-cyan-200/70">
              Gather server components from facility rooms and slot them into Blade Server Rack Alpha.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
          <Zap className={`w-4 h-4 ${isPoweringUp ? 'text-cyan-400 animate-bounce' : 'text-gray-500'}`} />
          <span>{isPoweringUp ? 'RACK ALPHA: SYNCHRONIZED' : 'RACK ALPHA: DEGRADED'}</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-3 mb-5 flex items-center justify-between gap-4 text-xs relative z-10">
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="text-[11px] px-2.5 py-1 bg-black/40 border border-cyan-500/20 rounded-lg text-cyan-400 font-bold">
          SLOTTED: {Object.keys(slottedParts).length} / 3
        </div>
      </div>

      {/* Server Motherboard Chassis Visual */}
      <div className="relative w-full h-64 bg-[#0a1220] border-2 border-cyan-500/30 rounded-2xl p-4 mb-6 shadow-inner overflow-hidden flex flex-col justify-between">
        
        {/* Motherboard circuit lines */}
        <div className="text-[10px] text-cyan-400/40 font-bold flex justify-between z-10">
          <span>SERVER BLADE MOTHERBOARD ALPHA — DUAL XEON ARCHITECTURE</span>
          <span>FAN SPEED: {isPoweringUp ? '12,500 RPM' : '0 RPM'}</span>
        </div>

        {/* 3 Component Slots on Server Tray */}
        <div className="grid grid-cols-3 gap-4 z-10 my-auto">
          {SERVER_BAYS.map((bay) => {
            const isSlotted = !!slottedParts[bay.id];
            const isExpectedHeld = selectedPartId === bay.expectedPartId;

            return (
              <div
                key={bay.id}
                onClick={() => handleSlotInBay(bay.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedId = e.dataTransfer.getData('text/plain');
                  if (droppedId) handleDirectDrop(bay.id, droppedId);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center relative ${
                  isSlotted
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : isExpectedHeld
                    ? 'bg-cyan-500/20 border-cyan-400 border-dashed animate-pulse'
                    : 'bg-black/60 border-cyan-500/20 hover:border-cyan-400/60'
                }`}
              >
                <div className="text-[10px] font-bold text-cyan-300 uppercase mb-1">
                  {bay.name}
                </div>

                {isSlotted ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 text-cyan-300 font-bold text-xs py-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <span>LOCKED IN BAY ✓</span>
                  </motion.div>
                ) : (
                  <div className="py-2 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-lg mb-1">
                      ?
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {isExpectedHeld ? 'CLICK TO INSERT MODULE' : 'EMPTY BAY'}
                    </span>
                  </div>
                )}

                <div className="text-[9px] text-gray-400 mt-1 line-clamp-1">
                  {bay.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chassis Info */}
        <div className="flex items-center justify-between text-[10px] text-cyan-400/60 z-10">
          <span>PCIE GEN5 X16 BUS: {isPoweringUp ? 'ACTIVE (64 GT/s)' : 'STANDBY'}</span>
          <span>POWER SUPPLY: 1200W REDUNDANT</span>
        </div>
      </div>

      {/* Operative Backpack / Module Dock */}
      <div className="bg-[#0c1424] border border-cyan-500/30 rounded-2xl p-4 relative z-10">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <div className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>OPERATIVE INVENTORY: SERVER COMPONENTS</span>
          </div>
          <span className="text-[11px] text-gray-400">
            {allPartsOwned ? 'ALL 3 MODULES READY' : 'LOCATE MISSING MODULES ACROSS FACILITY'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {inventoryParts.map((part) => {
            const isSelected = selectedPartId === part.id;
            const isAlreadySlotted = Object.values(slottedParts).includes(part.id);

            return (
              <div
                key={part.id}
                draggable={part.owned && !isAlreadySlotted}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', part.id);
                  setSelectedPartId(part.id);
                }}
                onClick={() => {
                  if (part.owned && !isAlreadySlotted) {
                    handleSelectPart(part.id);
                  }
                }}
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 relative ${
                  isAlreadySlotted
                    ? 'bg-black/30 border-white/5 opacity-40 cursor-default'
                    : part.owned
                    ? isSelected
                      ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-grab'
                      : 'bg-[#121d33] border-cyan-500/40 hover:border-cyan-400 cursor-grab'
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
                    {part.owned ? (isAlreadySlotted ? 'Installed in Blade' : 'Ready to slot') : part.hint}
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
