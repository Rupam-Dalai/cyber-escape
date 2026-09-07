import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, Sparkles, AlertCircle, CheckCircle2, Shield, Lock, ShieldCheck, Zap } from 'lucide-react';
import { GameHUD } from '../components/common/GameHUD';
import { CyberVaultWorld } from '../components/world/CyberVaultWorld';
import { GameProgressState, INITIAL_PROGRESS, ALL_BOSS_TASK_IDS } from '../components/world/RoomRenderer';
import { BossArena } from '../components/boss/BossArena';
import { HazardDeathModal } from '../components/game/HazardDeathModal';
import { CountdownPenalty } from '../components/game/CountdownPenalty';
import { PausePage } from './PausePage';
import { Team, Quest, FragmentItem, AnswerResult } from '../types';
import { fetchCurrentQuest, submitAnswer, useHint, fetchCollectedFragments, fetchCurrentTeam, fetchEventConfig, respawnPlayer } from '../services/api';
import { wsClient } from '../services/websocket';
import { soundEngine } from '../services/audio';
import { TaskStateManager } from '../services/taskStateManager';

interface QuestPageProps {
  team: Team;
  onUpdateTeam: (team: Team) => void;
  onOpenLeaderboard: () => void;
  onLogout?: () => void;
  onMoveToLobby?: () => void;
}

export const QuestPage: React.FC<QuestPageProps> = ({ team, onUpdateTeam, onOpenLeaderboard, onLogout, onMoveToLobby }) => {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [fragments, setFragments] = useState<FragmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>('CENTRAL_HUB');
  const [isBossMode, setIsBossMode] = useState<boolean>(false);
  const isBossModeRef = useRef(isBossMode);
  isBossModeRef.current = isBossMode;
  const [hintText, setHintText] = useState<string | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [unlockedStep, setUnlockedStep] = useState(false);
  const [bossDoorUnlockedNotice, setBossDoorUnlockedNotice] = useState(false);
  const [collectedItemPopup, setCollectedItemPopup] = useState<string>('ESCAPE KEY ITEM');

  // Dynamic 7-Room Progress State
  const [progressState, setProgressState] = useState<GameProgressState>(INITIAL_PROGRESS);

  // Hazard State
  const [hazardState, setHazardState] = useState<{
    isOpen: boolean;
    type: 'SHORT_CIRCUIT' | 'DATA_SURGE' | 'MEMORY_BLAST' | 'LASER_TRAP' | 'GENERIC';
    checkpoint: string;
  }>({
    isOpen: false,
    type: 'SHORT_CIRCUIT',
    checkpoint: 'Central Nexus Checkpoint',
  });

  const [isPaused, setIsPaused] = useState(false);
  const initialLoadedRef = useRef(false);

  const loadData = async () => {
    try {
      if (!initialLoadedRef.current) {
        setIsLoading(true);
      }
      const conf = await fetchEventConfig();
      if (conf && conf.event_status === 'WAITING') {
        if (onMoveToLobby) onMoveToLobby();
        return;
      }
      if (conf && conf.event_status === 'PAUSED') {
        setIsPaused(true);
        return;
      } else {
        setIsPaused(false);
      }

      const updatedTeam = await fetchCurrentTeam();
      onUpdateTeam(updatedTeam);

      const isTeamAllDone = updatedTeam.current_quest_index >= 7 || updatedTeam.status === 'COMPLETED';

      if (updatedTeam.status !== 'COMPLETED' && updatedTeam.current_quest_index < 7) {
        try {
          const q = await fetchCurrentQuest();
          setQuest(q);
          setHintText(q.hint_text || '');
        } catch {}
      }
      // Boss arena entry is strictly manual via the Central Hub airlock door

      const frags = await fetchCollectedFragments();
      setFragments(frags);

      // Synchronize all 7 room physical inventory flags
      const fragOrders = frags.map((f) => f.order);
      const fragNames = frags.map((f) => f.item_name || '');
      const fragChars = frags.map((f) => f.char || '');



      // Check boss defeated status from localStorage or team status
      const bossStateKey = `cyber_vault_boss_state_${updatedTeam.id || 'default'}`;
      const isBossDefeated = (() => {
        try {
          return localStorage.getItem(bossStateKey) === 'defeated' || updatedTeam.status === 'COMPLETED';
        } catch {
          return updatedTeam.status === 'COMPLETED';
        }
      })();

      // Merge persisted tasks from localStorage & TaskStateManager without pruning
      let savedScavenger: any = {};
      let savedCompletedTasks: string[] = [];
      try {
        const raw = localStorage.getItem(`cyber_vault_scavenger_${updatedTeam.id}`);
        if (raw) savedScavenger = JSON.parse(raw);
        const rawTasks = localStorage.getItem(`cyber_vault_completed_tasks_${updatedTeam.id}`);
        if (rawTasks) savedCompletedTasks = JSON.parse(rawTasks);
      } catch {}

      const stateManagerTasks = TaskStateManager.getCompletedTaskIds(updatedTeam.id);
      const mergedTaskSet = new Set<string>([...savedCompletedTasks, ...stateManagerTasks]);
      const validCompletedTasks = Array.from(mergedTaskSet);

      try {
        localStorage.setItem(`cyber_vault_completed_tasks_${updatedTeam.id}`, JSON.stringify(validCompletedTasks));
      } catch {}

      const hasR1 =
        validCompletedTasks.includes('network_patch_console') ||
        validCompletedTasks.includes('network_blade_server') ||
        fragOrders.includes(0) ||
        fragNames.includes('Firewall Patch') ||
        fragChars.some((c) => c.includes('🛡')) ||
        Boolean(savedScavenger.hasFirewallPatch);

      const hasR2 =
        validCompletedTasks.includes('power_wire_splicing_box') ||
        validCompletedTasks.includes('power_pcb_breadboard') ||
        fragOrders.includes(1) ||
        fragNames.includes('Power Surge Cell') ||
        fragChars.some((c) => c.includes('🔋')) ||
        Boolean(savedScavenger.hasPowerSurgeCell);

      const hasR3 =
        validCompletedTasks.includes('db_terminal_query') ||
        validCompletedTasks.includes('db_keypad_vault') ||
        fragOrders.includes(2) ||
        fragNames.includes('Access Credentials') ||
        fragChars.some((c) => c.includes('📜')) ||
        Boolean(savedScavenger.hasAccessCredentials);

      const hasR4 =
        validCompletedTasks.includes('api_workstation_dispatch') ||
        validCompletedTasks.includes('api_debugger_console') ||
        fragOrders.includes(3) ||
        fragNames.includes('Clean API Call') ||
        fragChars.some((c) => c.includes('⚙')) ||
        Boolean(savedScavenger.hasCleanApiCall);

      const hasR5 =
        validCompletedTasks.includes('soc_packet_sorter') ||
        validCompletedTasks.includes('soc_firewall_console') ||
        fragOrders.includes(4) ||
        fragNames.includes('Firewall Rule Set') ||
        fragChars.some((c) => c.includes('🧱')) ||
        Boolean(savedScavenger.hasFirewallRules);

      const hasR6 =
        validCompletedTasks.includes('crypto_wheel_terminal') ||
        validCompletedTasks.includes('crypto_enigma_plugboard') ||
        fragOrders.includes(5) ||
        fragNames.includes('Cipher Key') ||
        fragChars.some((c) => c.includes('🔑')) ||
        Boolean(savedScavenger.hasCipherKey);

      const hasR7 =
        validCompletedTasks.includes('forensics_timeline_workstation') ||
        validCompletedTasks.includes('forensics_pcap_reconstruct') ||
        fragOrders.includes(6) ||
        fragNames.includes('Forensic Trace Map') ||
        fragChars.some((c) => c.includes('🗺')) ||
        Boolean(savedScavenger.hasForensicMap);

      const next: GameProgressState = {
        ...INITIAL_PROGRESS,
        ...savedScavenger,
        hasFirewallPatch: hasR1,
        hasPowerSurgeCell: hasR2,
        hasAccessCredentials: hasR3,
        hasCleanApiCall: hasR4,
        hasFirewallRules: hasR5,
        hasCipherKey: hasR6,
        hasForensicMap: hasR7,
        apiFixed: hasR4 || Boolean(savedScavenger.hasCleanApiCall),
        completedTaskIds: validCompletedTasks,
        isBossDefeated,
      };

      try {
        localStorage.setItem(`cyber_vault_completed_tasks_${updatedTeam.id}`, JSON.stringify(next.completedTaskIds));
        localStorage.setItem(`cyber_vault_scavenger_${updatedTeam.id}`, JSON.stringify(next));
      } catch {}

      setProgressState(next);
    } catch (err: any) {
      if (err.message && err.message.includes('PAUSED')) {
        setIsPaused(true);
      }
      console.error('Error loading cyber vault state:', err);
    } finally {
      initialLoadedRef.current = true;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // WebSocket subscription for real-time team override updates
    wsClient.connect();
    const unsubscribe = wsClient.subscribe((msg: any) => {
      if (msg.type === 'EVENT_STATUS_CHANGE') {
        if (msg.event_status === 'WAITING') {
          if (onMoveToLobby) onMoveToLobby();
        } else if (msg.event_status === 'PAUSED') {
          setIsPaused(true);
        } else if (msg.event_status === 'ACTIVE') {
          setIsPaused(false);
          loadData();
        }
      } else if (msg.type === 'EVENT_RESET') {
        window.location.reload();
      } else if ((msg.type === 'TEAM_UPDATE' && msg.team_id === team.id) || msg.type === 'EVENT_CONFIG_UPDATE') {
        if (isBossModeRef.current) return;
        loadData();
      }
    });

    const interval = setInterval(async () => {
      try {
        const conf = await fetchEventConfig();
        if (conf && conf.event_status === 'WAITING') {
          if (onMoveToLobby) onMoveToLobby();
          return;
        } else if (conf && conf.event_status === 'PAUSED') {
          setIsPaused(true);
        } else if (conf && conf.event_status === 'ACTIVE' && isPaused) {
          setIsPaused(false);
          loadData();
        }

        // In boss mode, do NOT poll or interrupt the real-time combat engine
        if (isBossModeRef.current) {
          return;
        }

        // Poll team updates so admin overrides reflect in real-time
        const freshTeam = await fetchCurrentTeam();
        if (
          freshTeam.current_quest_index !== team.current_quest_index ||
          freshTeam.lives !== team.lives ||
          freshTeam.status !== team.status
        ) {
          onUpdateTeam(freshTeam);
          loadData();
        }
      } catch {}
    }, 2500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [team.id, isPaused, isBossMode]);

  const handlePickupFuse = () => {
    handlePickupScavengerItem('fuse');
  };

  const handlePickupScavengerItem = (itemId: string) => {
    soundEngine.playItemPickup();
    setProgressState((prev) => {
      const next = { ...prev };
      if (itemId === 'fuse') next.hasSpareFuse = true;
      if (itemId === 'logic_ic') next.hasLogicIC = true;
      if (itemId === 'capacitor') next.hasCapacitor = true;
      if (itemId === 'ram') next.hasRam = true;
      if (itemId === 'sfp') next.hasSfp = true;
      if (itemId === 'nvme') next.hasNvme = true;
      if (itemId === 'jumpers') next.hasJumpers = true;
      if (itemId === 'token_cert') next.hasTokenCert = true;

      try {
        localStorage.setItem(`cyber_vault_scavenger_${team.id}`, JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  const handleSolveChallenge = async (val: string, secondaryVal?: string, objectId?: string) => {
    setIsSubmitting(true);

    // Optimistic / Immediate Completion Recording for this specific object
    setProgressState((prev) => {
      const next = { ...prev };
      const upper = val.toUpperCase();
      const taskKeys = new Set(prev.completedTaskIds || []);

      if (objectId) {
        taskKeys.add(objectId);
      }

      if (objectId === 'network_patch_console' || objectId === 'network_blade_server' || upper.includes('FIREWALL_PATCH') || upper.includes('SERVER')) {
        next.hasFirewallPatch = true;
      }
      if (objectId === 'power_wire_splicing_box' || objectId === 'power_pcb_breadboard' || upper.includes('POWER') || upper.includes('CIRCUIT') || upper.includes('WIRE')) {
        next.hasPowerSurgeCell = true;
      }
      if (objectId === 'db_terminal_query' || objectId === 'db_keypad_vault' || upper.includes('CREDENTIALS') || upper.includes('ACCESS') || upper.includes('SQL') || upper.includes('VAULT') || upper.includes('9082')) {
        next.hasAccessCredentials = true;
      }
      if (objectId === 'api_workstation_dispatch' || objectId === 'api_debugger_console' || upper.includes('API') || upper.includes('200') || upper.includes('AUTH')) {
        next.hasCleanApiCall = true;
        next.apiFixed = true;
      }
      if (objectId === 'soc_packet_sorter' || objectId === 'soc_firewall_console' || upper.includes('PERIMETER') || upper.includes('PACKET') || upper.includes('FIREWALL')) {
        next.hasFirewallRules = true;
      }
      if (objectId === 'crypto_wheel_terminal' || objectId === 'crypto_enigma_plugboard' || upper.includes('CIPHER') || upper.includes('ENIGMA') || upper.includes('VERIFY')) {
        next.hasCipherKey = true;
      }
      if (objectId === 'forensics_timeline_workstation' || objectId === 'forensics_pcap_reconstruct' || upper.includes('FORENSIC') || upper.includes('PCAP') || upper.includes('TIMELINE')) {
        next.hasForensicMap = true;
      }

      next.completedTaskIds = Array.from(taskKeys);

      try {
        localStorage.setItem(`cyber_vault_completed_tasks_${team.id}`, JSON.stringify(next.completedTaskIds));
        localStorage.setItem(`cyber_vault_scavenger_${team.id}`, JSON.stringify(next));
      } catch {}

      return next;
    });

    try {
      const targetQuestId = quest ? String(quest.id) : '';
      const res: AnswerResult = await submitAnswer(targetQuestId, val, secondaryVal, objectId);

      if (res.is_correct) {
        soundEngine.playSuccess();
        soundEngine.playItemPickup();
        setCollectedItemPopup(val.replace(/_/g, ' '));
        setUnlockedStep(true);

        // PART 2: Task State Machine & Trophy Economy (+250 Trophies awarded on First Completion)
        const taskId = objectId || currentRoomId;
        TaskStateManager.recordCompletion(team.id, taskId, 250);

        const refreshedTeam = await fetchCurrentTeam();
        if (refreshedTeam) {
          if (res.new_score !== undefined) {
            refreshedTeam.score = res.new_score;
          }
          onUpdateTeam(refreshedTeam);
        }
        const frags = await fetchCollectedFragments();
        setFragments(frags);

        if (refreshedTeam.current_quest_index < 7) {
          try {
            const nextQ = await fetchCurrentQuest();
            setQuest(nextQ);
          } catch {}
        }

        // Check if all 14 available sector tasks are completed to unlock Central Boss Airlock
        const updatedCompleted = TaskStateManager.getCompletedTaskIds(team.id);
        const allDone = ALL_BOSS_TASK_IDS.every((id) => updatedCompleted.includes(id));
        if (allDone) {
          soundEngine.playSuccess();
          setBossDoorUnlockedNotice(true);
        }
      } else {
        soundEngine.playError();
      }
    } catch (err: any) {
      soundEngine.playError();
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerHazard = (type: 'SHORT_CIRCUIT' | 'DATA_SURGE' | 'MEMORY_BLAST' | 'LASER_TRAP' | 'GENERIC') => {
    // PART 2: Task State Machine & Trophy Economy (-25 Trophies per Hazard Trigger)
    TaskStateManager.recordFailure(team.id, `${currentRoomId}_hazard`, 25);
    onUpdateTeam({
      ...team,
      score: Math.max(0, (team.score || 0) - 25),
    });

    setHazardState({
      isOpen: true,
      type,
      checkpoint: `${currentRoomId.replace('_', ' ')} Checkpoint`,
    });
  };

  const handleRespawnComplete = async () => {
    setHazardState((prev) => ({ ...prev, isOpen: false }));
    try {
      await respawnPlayer();
      const refreshedTeam = await fetchCurrentTeam();
      onUpdateTeam(refreshedTeam);
    } catch (e) {
      console.error('Error during hazard respawn:', e);
    }
    loadData();
  };

  if (isPaused) {
    return <PausePage onResume={() => { setIsPaused(false); loadData(); }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04060c]">
        <div className="text-center font-mono text-cyan-400">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto mb-4" />
          <span>INITIALIZING 2.5D CYBER VAULT ENVIRONMENT...</span>
        </div>
      </div>
    );
  }

  // Final Boss Arena Stage (PART 3: Only rendered when explicitly in boss mode)
  if (isBossMode) {
    return (
      <div className="min-h-screen bg-[#050811] text-white">
        <GameHUD
          team={team}
          currentLocationName="CENTRAL AIRLOCK: BOSS NuLL"
          fragments={fragments}
          onOpenLeaderboard={onOpenLeaderboard}
          onLogout={onLogout}
        />
        <main className="py-6 px-4">
          <BossArena
            team={team}
            fragments={fragments}
            onViewLeaderboard={onOpenLeaderboard}
            onReturnToHub={() => {
              setIsBossMode(false);
              loadData();
            }}
            onUpdateTeam={onUpdateTeam}
          />
        </main>
      </div>
    );
  }

  if (team.status === 'RECOVERY') {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col">
        <GameHUD
          team={team}
          currentLocationName={quest?.location_name || 'RECOVERY BAY'}
          fragments={fragments}
          playerHealth={100}
          onOpenLeaderboard={onOpenLeaderboard}
          onLogout={onLogout}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <CountdownPenalty lockoutUntil={team.lockout_until} onLockoutEnd={loadData} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060c] text-white flex flex-col select-none font-mono">
      {/* Top HUD with 7-Item Inventory & Health */}
      <GameHUD
        team={team}
        currentLocationName={currentRoomId.replace('_', ' ')}
        fragments={fragments}
        progressState={progressState}
        playerHealth={100}
        onOpenLeaderboard={onOpenLeaderboard}
        onLogout={onLogout}
      />

      {/* Main Walkable 2.5D World Arena */}
      <main className="flex-1 max-w-[1550px] w-full mx-auto p-2 sm:p-4 flex flex-col items-center justify-center">
        <CyberVaultWorld
          currentRoomId={currentRoomId}
          onRoomChange={(newRoomId) => {
            setCurrentRoomId(newRoomId);
          }}
          progressState={progressState}
          onSolveChallenge={handleSolveChallenge}
          onPickupFuse={handlePickupFuse}
          onPickupScavengerItem={handlePickupScavengerItem}
          onTriggerHazard={handleTriggerHazard}
          onEnterBossArena={() => setIsBossMode(true)}
          isSubmitting={isSubmitting}
        />
      </main>

      {/* Level Milestone Notification */}
      <AnimatePresence>
        {unlockedStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-b from-[#0a1f18] to-[#05110d] border-4 border-emerald-500 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-[0_0_80px_rgba(16,185,129,0.4)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-lg animate-bounce">
                🔑
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                  OBJECTIVE SECURED
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  ESCAPE ITEM COLLECTED!
                </h2>
                <p className="text-xs text-emerald-200/80 mt-2 leading-relaxed">
                  Checkpoint saved! {collectedItemPopup} added to your operative combat inventory.
                </p>
              </div>

              <button
                onClick={() => setUnlockedStep(false)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>CONTINUE EXPLORATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* All Tasks Completed - Central Boss Airlock Unlocked Notice */}
      <AnimatePresence>
        {bossDoorUnlockedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-b from-[#150a24] to-[#0a0512] border-4 border-amber-500 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-[0_0_80px_rgba(245,158,11,0.4)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg animate-bounce">
                👑
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  FACILITY RESTORATION COMPLETE
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  CENTRAL BOSS AIRLOCK UNLOCKED!
                </h2>
                <p className="text-xs text-amber-200/90 mt-2 leading-relaxed font-mono">
                  All 14 sector tasks across the facility have been successfully cleared! The central airlock to NuLL Chamber in Sector-00 is now unsealed.
                  Return to the Central Hub and manually breach the airlock door when you are ready to engage the rogue AI!
                </p>
              </div>

              <button
                onClick={() => setBossDoorUnlockedNotice(false)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>RETURN TO NEXUS HUB (MANUAL BREACH)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hazard Death & Checkpoint Respawn Modal */}
      <HazardDeathModal
        isOpen={hazardState.isOpen}
        hazardType={hazardState.type}
        checkpointName={hazardState.checkpoint}
        onRespawnComplete={handleRespawnComplete}
      />

      {/* Hint Modal */}
      <AnimatePresence>
        {showHintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e1628] border-2 border-amber-500/50 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-400 border-b border-amber-500/20 pb-3">
                <Lightbulb className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">FACILITY SECURITY HINT</h3>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed bg-black/50 p-4 rounded-2xl border border-white/5">
                {hintText}
              </p>
              <button
                onClick={() => setShowHintModal(false)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                ACKNOWLEDGE HINT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
