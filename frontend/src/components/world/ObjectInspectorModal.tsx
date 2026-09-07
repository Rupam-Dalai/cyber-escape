import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Sparkles, CheckCircle2, Shield, Info, Lock, Zap, Box } from 'lucide-react';
import { WorldObject, GameProgressState } from './RoomRenderer';
import { NetworkPatchConsole } from '../game/NetworkPatchConsole';
import { CircuitStabilizeConsole } from '../game/CircuitStabilizeConsole';
import { CircuitBreadboardConsole } from '../game/CircuitBreadboardConsole';
import { ServerBladeAssemblyConsole } from '../game/ServerBladeAssemblyConsole';
import { PacketSnifferSorter } from '../game/PacketSnifferSorter';
import { EnigmaPlugboardConsole } from '../game/EnigmaPlugboardConsole';
import { PcapTimelineReconstruct } from '../game/PcapTimelineReconstruct';
import { InteractiveDebugScreen } from '../game/InteractiveDebugScreen';
import { WireSplicingConsole } from '../game/WireSplicingConsole';
import { LogicGridDbConsole } from '../game/LogicGridDbConsole';
import { DatabaseVaultConsole } from '../game/DatabaseVaultConsole';
import { ApiEndpointConsole } from '../game/ApiEndpointConsole';
import { FirewallAclConsole } from '../game/FirewallAclConsole';
import { CipherWheelConsole } from '../game/CipherWheelConsole';
import { ForensicTimelineConsole } from '../game/ForensicTimelineConsole';
import { soundEngine } from '../../services/audio';

interface ObjectInspectorModalProps {
  object: WorldObject | null;
  progressState: GameProgressState;
  onPickupScavengerItem: (itemId: string) => void;
  onClose: () => void;
  onSubmitAnswer: (val: string, secondaryVal?: string, objectId?: string) => Promise<void> | void;
  onTriggerHazard: (type: 'SHORT_CIRCUIT' | 'DATA_SURGE' | 'MEMORY_BLAST' | 'LASER_TRAP' | 'GENERIC') => void;
  isSubmitting?: boolean;
}

export const ObjectInspectorModal: React.FC<ObjectInspectorModalProps> = ({
  object,
  progressState,
  onPickupScavengerItem,
  onClose,
  onSubmitAnswer,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  if (!object) return null;

  const isScavengerCollected = (itemId?: string) => {
    if (!itemId) return false;
    switch (itemId) {
      case 'fuse': return progressState.hasSpareFuse;
      case 'logic_ic': return progressState.hasLogicIC;
      case 'capacitor': return progressState.hasCapacitor;
      case 'ram': return progressState.hasRam;
      case 'sfp': return progressState.hasSfp;
      case 'nvme': return progressState.hasNvme;
      case 'jumpers': return progressState.hasJumpers;
      case 'token_cert': return progressState.hasTokenCert;
      default: return false;
    }
  };

  const isAlreadyOwned = isScavengerCollected(object.scavengerItemId);

  const isTaskCompleted = React.useMemo(() => {
    if (!object) return false;
    return Boolean(progressState.completedTaskIds?.includes(object.id));
  }, [object, progressState]);

  const handleWrappedSubmit = async (val: string, secondaryVal?: string) => {
    await onSubmitAnswer(val, secondaryVal, object.id);
    // Auto-close modal after successful completion
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const isMinigameType = [
    'NETWORK_CONSOLE', 'SERVER_ASSEMBLY', 'WIRE_SPLICING', 'CIRCUIT_BREADBOARD', 'POWER_PANEL',
    'DB_TERMINAL', 'DB_KEYPAD', 'API_WORKSTATION', 'CODE_DEBUGGER', 'API_CONSOLE',
    'PACKET_SORTER', 'FIREWALL_CONSOLE', 'CRYPTO_SAFE', 'ENIGMA_PLUGBOARD',
    'FORENSICS_BOARD', 'PCAP_RECONSTRUCT'
  ].includes(object.type);

  const handleCollectScavengerItem = React.useCallback(() => {
    if (!object || isAlreadyOwned) return;
    soundEngine.playSuccess();
    soundEngine.playItemPickup();
    if (object.scavengerItemId) {
      onPickupScavengerItem(object.scavengerItemId);
    }
  }, [object, isAlreadyOwned, onPickupScavengerItem]);

  // Keyboard shortcut [E] / [Enter] to collect item, [X] or [Escape] to close overlay
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Escape' || ((e.key === 'x' || e.key === 'X' || e.code === 'KeyX') && !isInputFocused)) {
        e.preventDefault();
        e.stopPropagation();
        soundEngine.playClick();
        onClose();
        return;
      }

      // Press [E] or [Enter] to collect scavenger item when inspecting container
      if (
        (e.key.toLowerCase() === 'e' || e.code === 'KeyE' || e.key === 'Enter' || e.code === 'Enter') &&
        !isInputFocused &&
        object &&
        (object.type === 'SCAVENGER_PICKUP' || object.type === 'VENT_FUSE')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (!isAlreadyOwned) {
          handleCollectScavengerItem();
        } else {
          soundEngine.playClick();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose, object, isAlreadyOwned, handleCollectScavengerItem]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="w-full max-w-4xl bg-[#080c16] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_90px_rgba(6,182,212,0.25)] relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl shadow-inner">
              {object.icon}
            </span>
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span>INSPECTING FACILITY OBJECT</span>
                {isTaskCompleted && (
                  <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px] font-black">
                    ✓ COMPLETED & SECURED
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {object.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-3 py-2 rounded-xl bg-[#121929] hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/50 text-gray-400 hover:text-rose-300 flex items-center gap-1.5 transition-all text-xs font-bold"
            title="Close Overlay [X / ESC]"
          >
            <span className="text-[10px] text-gray-400">[X]</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body Based on Object Type */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Display Verified Completed State if task is already solved (STRICT REPLAY LOCK) */}
          {isTaskCompleted && isMinigameType ? (
            <div className="p-8 bg-[#05110d] border-2 border-emerald-500/50 rounded-3xl text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-4xl shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-black">
                  SYSTEM OPERATIONAL & PERMANENTLY SECURED
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  TASK PROTOCOL COMPLETED
                </h3>
                <p className="text-xs text-gray-300 mt-2 max-w-lg mx-auto leading-relaxed">
                  This subsystem console has already been successfully solved, verified, and locked.
                  The security key item is permanently active in your operative combat loadout.
                </p>
              </div>

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs tracking-wider shadow-lg transition-all active:scale-95"
                >
                  DISMISS CONSOLE
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Network Infrastructure Consoles (Sector 1) */}
              {object.type === 'NETWORK_CONSOLE' && (
                <NetworkPatchConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'SERVER_ASSEMBLY' && (
                <ServerBladeAssemblyConsole
                  hasRam={progressState.hasRam}
                  hasSfp={progressState.hasSfp}
                  hasNvme={progressState.hasNvme}
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 2. Power Grid Consoles (Sector 2) */}
              {object.type === 'WIRE_SPLICING' && (
                <WireSplicingConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'CIRCUIT_BREADBOARD' && (
                <CircuitBreadboardConsole
                  hasFuse={progressState.hasSpareFuse}
                  hasLogicIC={progressState.hasLogicIC}
                  hasCapacitor={progressState.hasCapacitor}
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'POWER_PANEL' && (
                <CircuitStabilizeConsole
                  hasSpareFuse={progressState.hasSpareFuse}
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 3. Database Vault Consoles (Sector 3) */}
              {object.type === 'DB_TERMINAL' && (
                <LogicGridDbConsole
                  isApiFixed={progressState.apiFixed}
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'DB_KEYPAD' && (
                <DatabaseVaultConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 4. Backend / API Consoles (Sector 4) */}
              {(object.type === 'API_WORKSTATION' || object.type === 'API_CONSOLE') && (
                <ApiEndpointConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'CODE_DEBUGGER' && (
                <InteractiveDebugScreen
                  onSubmit={handleWrappedSubmit}
                  isLoading={isSubmitting}
                />
              )}

              {/* 5. Firewall / SOC Consoles (Sector 5) */}
              {object.type === 'PACKET_SORTER' && (
                <PacketSnifferSorter
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'FIREWALL_CONSOLE' && (
                <FirewallAclConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 6. Cryptography Vault Consoles (Sector 6) */}
              {object.type === 'CRYPTO_SAFE' && (
                <CipherWheelConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'ENIGMA_PLUGBOARD' && (
                <EnigmaPlugboardConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 7. Forensics Lab Consoles (Sector 7) */}
              {object.type === 'FORENSICS_BOARD' && (
                <ForensicTimelineConsole
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {object.type === 'PCAP_RECONSTRUCT' && (
                <PcapTimelineReconstruct
                  onSubmit={handleWrappedSubmit}
                  onTriggerHazard={onTriggerHazard}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* Scavenger Component Pickups (Crates, Vents, Lockers, Monoliths, Safes) */}
              {(object.type === 'SCAVENGER_PICKUP' || object.type === 'VENT_FUSE') && (
                <div className="p-6 bg-[#100c06] border-2 border-amber-500/40 rounded-3xl space-y-5 shadow-inner">
                  <div className="flex items-center gap-3 text-amber-400 text-sm font-bold border-b border-amber-500/20 pb-3">
                    <Box className="w-5 h-5" />
                    <span>FACILITY HARDWARE CONTAINER</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-sm leading-relaxed whitespace-pre-line font-bold">
                    {object.clueText || object.description}
                  </div>

                  {!isAlreadyOwned ? (
                    <button
                      onClick={handleCollectScavengerItem}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-black/30 text-amber-300 text-xs font-black tracking-wider">
                        [E]
                      </span>
                      <Sparkles className="w-4 h-4" />
                      <span>COLLECT {object.scavengerItemName || 'HARDWARE COMPONENT'} INTO BACKPACK</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{object.scavengerItemName || 'COMPONENT'} SECURED IN OPERATIVE BACKPACK</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-normal">PRESS [E / ESC] TO DISMISS</span>
                    </div>
                  )}
                </div>
              )}

              {/* Handwritten Note / Blueprint / Clue */}
              {object.type === 'NOTE_CLUE' && (
                <div className="p-6 bg-[#060a14] border-2 border-cyan-500/40 rounded-3xl space-y-4 shadow-inner">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold border-b border-cyan-500/20 pb-3">
                    <FileText className="w-5 h-5" />
                    <span>INSPECTED DOCUMENT / BLUEPRINT</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-sm font-mono leading-relaxed whitespace-pre-line font-bold">
                    {object.clueText || object.description}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    💡 Operative Tip: Apply this clue in the room's main terminal or keep it for the final Boss Encounter!
                  </div>
                </div>
              )}

              {/* Standard Diagnostic Terminal, Supply Crate, Server Rack, Generator */}
              {(object.type === 'TERMINAL' || object.type === 'CRATE' || object.type === 'GENERATOR' || object.type === 'SERVER_RACK') && (
                <div className="p-6 bg-[#070c18] border border-cyan-500/30 rounded-3xl space-y-4">
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {object.description}
                  </p>
                  {object.clueText && (
                    <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs text-cyan-300">
                      {object.clueText}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Simplified Footer with [E] hint for Scavenger Pickups */}
        <div className="pt-3 mt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2 shrink-0">
          {(object.type === 'SCAVENGER_PICKUP' || object.type === 'VENT_FUSE') && !isAlreadyOwned ? (
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">[E]</span>
              <span>PRESS [E] OR CLICK BUTTON TO COLLECT ITEM</span>
            </span>
          ) : (
            <span>STATUS: INSPECTION MODE</span>
          )}
          <span>PRESS [ESC] OR CLICK (X) TO DISMISS CONSOLE</span>
        </div>
      </motion.div>
    </div>
  );
};
