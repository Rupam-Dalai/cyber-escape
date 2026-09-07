import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Footprints, Shield, ShieldCheck, Zap, Sparkles, MapPin, Hand, Key, AlertTriangle, X, Radio, Activity, Cpu, CheckCircle2 } from 'lucide-react';
import { ROOMS, RoomDefinition, WorldObject, Doorway, GameProgressState, ALL_BOSS_TASK_IDS } from './RoomRenderer';
import { PlayerController } from './PlayerController';
import { ObjectInspectorModal } from './ObjectInspectorModal';
import { VirtualJoystick } from './VirtualJoystick';
import { soundEngine } from '../../services/audio';

export const OBJECT_SUBTLE_HINTS: Record<string, string> = {
  // Sector 1: Network Infrastructure
  network_patch_console: 'hint: use deduction grid rules to assign unique abstract symbols ▲/●/◆/■ to Ports 1-4.',
  network_blade_server: 'hint: ensure ECC RAM, SFP+ module, and storage blade are seated in slot order.',
  network_technician_toolbox: 'hint: technician storage containing precision copper wiring jumpers.',
  network_manual_note: 'hint: inspect symbol deduction logic memo for elimination clues.',

  // Sector 2: Power Grid
  power_wire_splicing_box: 'hint: route continuous non-crossing paths between matching colored endpoints on the 5x5 grid.',
  power_pcb_breadboard: 'hint: insert fuse, logic gate IC, and filter capacitor to complete circuit.',
  power_vent_fuse_drop: 'hint: emergency high-voltage ceramic fuse lodged behind ventilation louvers.',
  power_safety_bulletin: 'hint: review non-crossing conduit flow guidelines avoiding damaged capacitors.',

  // Sector 3: Database Vault
  db_terminal_query: 'hint: crack the 4-rune master sequence by evaluating exact and misplaced symbol peg ratings.',
  db_keypad_vault: 'hint: execute Root SQL query to reveal decrypted vault passcode (VAULT-9082-ROOT), then enter on keypad.',
  db_cold_storage_monolith: 'hint: cryo-bay storing high-speed ECC server memory modules.',
  db_admin_note: 'hint: master rune code deduction logs and default root override memo.',

  // Sector 4: Backend API
  api_workstation_dispatch: 'hint: pair input tokens with perimeter ring glyphs using clockwise and counter-clockwise offsets.',
  api_debugger_console: 'hint: audit billing calculation arithmetic and change addition (+) to subtraction (-) to deduct request charges.',
  api_hardware_workbench: 'hint: component tray holds standard 74LS08 quad AND logic gate ICs.',
  api_swagger_note: 'hint: review rotational rule sheet for clockwise and counter-clockwise token pairings.',

  // Sector 5: Firewall SOC
  soc_packet_sorter: 'hint: inspect incoming network packet headers and route malicious botnet/exploit traffic to quarantine while permitting internal traffic.',
  soc_firewall_console: 'hint: arrange 5 spectral filter cards into top-down priority according to the filter directive memo.',
  soc_hardware_locker: 'hint: network maintenance locker containing 100µF electrolytic capacitors.',
  soc_threat_bulletin: 'hint: review filter priority directive for relative card ordering.',

  // Sector 6: Cryptography Vault
  crypto_wheel_terminal: 'hint: rotate the inner symbol disc until the anchor star glyph aligns directly under the hexagon.',
  crypto_enigma_plugboard: 'hint: connect matching jumper pairs to align with hash matrix.',
  crypto_torn_note: 'hint: anchor glyph alignment memo details inner and outer ring offsets.',
  crypto_physical_safe: 'hint: heavy safe holding API token certificates.',

  // Sector 7: Forensics Lab
  forensics_timeline_workstation: 'hint: inspect sequence harmony and flag the 3 corrupted entries violating shape, vector, or parity.',
  forensics_pcap_reconstruct: 'hint: order TCP handshake, TLS negotiation, and data exfiltration flow.',
  forensics_corkboard_photo: 'hint: review sequence harmony directive for alternating shape and parity rules.',
  forensics_evidence_locker: 'hint: digital evidence storage containing NVMe PCIE storage blades.',

  // Central Hub
  hub_main_terminal: 'hint: facility status console showing active grid telemetry and containment seals.',
  hub_supply_crate: 'hint: operative chest containing SFP+ optical transceiver modules.',
};

interface CyberVaultWorldProps {
  currentRoomId: string;
  onRoomChange: (roomId: string) => void;
  progressState: GameProgressState;
  onSolveChallenge: (val: string, secondaryVal?: string, objectId?: string) => Promise<void> | void;
  onPickupFuse: () => void;
  onPickupScavengerItem?: (itemId: string) => void;
  onTriggerHazard: (type: 'SHORT_CIRCUIT' | 'DATA_SURGE' | 'MEMORY_BLAST' | 'LASER_TRAP' | 'GENERIC') => void;
  onEnterBossArena: () => void;
  isSubmitting?: boolean;
}

export const CyberVaultWorld: React.FC<CyberVaultWorldProps> = ({
  currentRoomId,
  onRoomChange,
  progressState,
  onSolveChallenge,
  onPickupFuse,
  onPickupScavengerItem,
  onTriggerHazard,
  onEnterBossArena,
  isSubmitting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<PlayerController>(new PlayerController());
  const [activeInspectorObject, setActiveInspectorObject] = useState<WorldObject | null>(null);
  const [nearbyObject, setNearbyObject] = useState<WorldObject | null>(null);
  const [nearbyDoor, setNearbyDoor] = useState<Doorway | null>(null);
  const [doorMessage, setDoorMessage] = useState<string | null>(null);
  const [securedNotice, setSecuredNotice] = useState<string | null>(null);

  const room = ROOMS[currentRoomId] || ROOMS.CENTRAL_HUB;

  // Initialize Player Controls
  useEffect(() => {
    const controller = controllerRef.current;
    controller.attachListeners();
    return () => controller.detachListeners();
  }, []);

  const handleDoorTraverse = (door: Doorway) => {
    if (door.isLocked) {
      if (door.unlockCondition && door.unlockCondition(progressState)) {
        soundEngine.playSuccess();
        onEnterBossArena();
      } else {
        soundEngine.playError();
        let reason = door.lockReason;
        if (door.id === 'door_to_boss') {
          const completedCount = ALL_BOSS_TASK_IDS.filter((id) =>
            progressState.completedTaskIds?.includes(id)
          ).length;
          reason = `🔒 CENTRAL AIRLOCK SEALED: Complete all 14 sector tasks to breach Boss NuLL Chamber (${completedCount}/14 Completed)`;
        }
        setDoorMessage(reason || 'DOORWAY SEALED: Prerequisite tasks incomplete.');
        setTimeout(() => setDoorMessage(null), 3500);
      }
      return;
    }

    soundEngine.playClick();
    controllerRef.current.resetPosition(door.spawnX, door.spawnY);
    onRoomChange(door.targetRoomId);
  };

  // Keyboard shortcut [E] / [Space] to interact, [X] / [Escape] to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      // If task overlay is active: [X] or [Escape] closes it
      if (activeInspectorObject) {
        if (e.key === 'Escape' || ((e.key === 'x' || e.key === 'X' || e.code === 'KeyX') && !isInputFocused)) {
          e.preventDefault();
          soundEngine.playClick();
          setActiveInspectorObject(null);
        }
        return;
      }

      // Exploring state: [E], [Space], or [Enter] interacts with nearby object or door
      const isInteractKey =
        e.key.toLowerCase() === 'e' ||
        e.code === 'KeyE' ||
        e.key === ' ' ||
        e.code === 'Space' ||
        e.key === 'Enter' ||
        e.code === 'Enter';

      if (isInteractKey) {
        if (isInputFocused) return;

        const controller = controllerRef.current;
        const currentRoom = ROOMS[currentRoomId] || ROOMS.CENTRAL_HUB;

        // Proximity check: use existing nearbyObject state or synchronous edge-distance check
        const currentNearby = nearbyObject || controller.getClosestInteractiveObject(currentRoom.objects, 85);
        if (currentNearby) {
          e.preventDefault();

          // REPLAY LOCK: If task is already completed, do NOT re-enter minigame!
          if (progressState.completedTaskIds?.includes(currentNearby.id)) {
            soundEngine.playSuccess();
            setSecuredNotice(`✓ ${currentNearby.name} — ALREADY SECURED`);
            setTimeout(() => setSecuredNotice(null), 2500);
            return;
          }

          soundEngine.playClick();
          setActiveInspectorObject(currentNearby);
          return;
        }

        // Door proximity check: use existing nearbyDoor or test doors
        const currentDoor = nearbyDoor;
        if (currentDoor) {
          e.preventDefault();
          handleDoorTraverse(currentDoor);
          return;
        }

        for (const door of currentRoom.doors) {
          const dist = Math.hypot(
            controller.state.x - (door.x + door.width / 2),
            controller.state.y - (door.y + door.height / 2)
          );
          if (dist < 95) {
            e.preventDefault();
            handleDoorTraverse(door);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRoomId, activeInspectorObject, nearbyObject, nearbyDoor, progressState]);


  // Canvas Click-to-Move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeInspectorObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    const targetX = (e.clientX - rect.left) * scaleX;
    const targetY = (e.clientY - rect.top) * scaleY;

    // Check if clicked directly on a door
    const clickedDoor = room.doors.find((door) => {
      return (
        targetX >= door.x - 12 &&
        targetX <= door.x + door.width + 12 &&
        targetY >= door.y - 12 &&
        targetY <= door.y + door.height + 12
      );
    });

    if (clickedDoor) {
      soundEngine.playClick();
      controllerRef.current.setClickTarget(clickedDoor.x + clickedDoor.width / 2, clickedDoor.y + clickedDoor.height / 2);
      const player = controllerRef.current.state;
      const dist = Math.hypot(player.x - (clickedDoor.x + clickedDoor.width / 2), player.y - (clickedDoor.y + clickedDoor.height / 2));
      if (dist < 90) {
        handleDoorTraverse(clickedDoor);
      }
      return;
    }

    // Check if clicked directly on an object
    const clickedObj = room.objects.find((obj) => {
      const dist = Math.hypot(obj.x - targetX, obj.y - targetY);
      return dist < Math.max(obj.width, obj.height) * 0.75;
    });

    if (clickedObj) {
      soundEngine.playClick();
      controllerRef.current.setClickTarget(clickedObj.x, clickedObj.y);
      const player = controllerRef.current.state;
      const distToPlayer = Math.hypot(player.x - clickedObj.x, player.y - clickedObj.y);
      if (distToPlayer < 95) {
        // REPLAY LOCK: If task is already completed, do NOT re-enter minigame!
        if (progressState.completedTaskIds?.includes(clickedObj.id)) {
          soundEngine.playSuccess();
          setSecuredNotice(`✓ ${clickedObj.name} — ALREADY SECURED`);
          setTimeout(() => setSecuredNotice(null), 2500);
          return;
        }

        setActiveInspectorObject(clickedObj);
      }
      return;
    }

    controllerRef.current.setClickTarget(targetX, targetY);
  };

  // Main 2.5D High-Fidelity Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let tick = 0;

    const render = (time: number) => {
      const now = time || performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const deltaScale = dt * 60; // Fixed timestep scaling

      tick++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const controller = controllerRef.current;
      const isLaserBlocked = !progressState.apiFixed;

      // Update Player Physics
      if (!activeInspectorObject) {
        controller.update(room, isLaserBlocked, deltaScale);
      }

      const player = controller.state;

      // Detect Proximity to Objects & Doors
      const closestObj = controller.getClosestInteractiveObject(room.objects, 85);
      setNearbyObject(closestObj);

      let closestDoor: Doorway | null = null;
      for (const door of room.doors) {
        const dist = Math.hypot(player.x - (door.x + door.width / 2), player.y - (door.y + door.height / 2));
        if (dist < 90) {
          closestDoor = door;
          const isDoorUnlocked = !door.isLocked || Boolean(door.unlockCondition && door.unlockCondition(progressState));
          if (dist < 34 && isDoorUnlocked) {
            handleDoorTraverse(door);
            break;
          }
        }
      }
      setNearbyDoor(closestDoor);

      // ----------------------------------------------------
      // HIGH-DPI CANVAS SCALING (1600x1200 Buffer -> 800x600 Coords)
      // ----------------------------------------------------
      ctx.save();
      ctx.scale(2, 2);

      // ----------------------------------------------------
      // 1. CLEAR & GROUNDED REALISTIC METALLIC PBR FLOOR TILES
      // ----------------------------------------------------
      ctx.fillStyle = room.bgColor;
      ctx.fillRect(0, 0, 800, 600);

      // Sub-Chamber Floor Zones & Tint Plating
      if (room.chambers) {
        for (const ch of room.chambers) {
          const chColor = ch.accentColor || room.themeColor;

          // Chamber Floor Base
          ctx.fillStyle = `${chColor}09`;
          ctx.fillRect(ch.x, ch.y, ch.width, ch.height);

          // Chamber Border Frame
          ctx.strokeStyle = `${chColor}28`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(ch.x, ch.y, ch.width, ch.height);

          // Architectural Chamber Title Plaque
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = `${chColor}88`;
          ctx.textAlign = 'left';
          ctx.fillText(`[${ch.code}] ${ch.name.toUpperCase()}`, ch.x + 10, ch.y + 16);
        }
      }

      // Brushed Steel Floor Panel Grid
      const tileSize = 40;
      for (let x = 40; x < 800 - 40; x += tileSize) {
        for (let y = 40; y < 600 - 40; y += tileSize) {
          ctx.fillStyle = '#080d19';
          ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

          // Subtle raised panel beveling
          ctx.strokeStyle = `${room.themeColor}10`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

          // Corner rivet details
          ctx.fillStyle = `${room.themeColor}20`;
          ctx.fillRect(x + 3, y + 3, 2, 2);
          ctx.fillRect(x + tileSize - 5, y + 3, 2, 2);
          ctx.fillRect(x + 3, y + tileSize - 5, 2, 2);
          ctx.fillRect(x + tileSize - 5, y + tileSize - 5, 2, 2);
        }
      }

      // Industrial Cable Runs Snaking Across Floor
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(40, 295);
      ctx.lineTo(760, 295);
      ctx.stroke();

      ctx.strokeStyle = `${room.themeColor}44`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(400, 40);
      ctx.lineTo(400, 560);
      ctx.moveTo(40, 295);
      ctx.lineTo(760, 295);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floor Intake Ventilation Grills
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(360, 280, 80, 30);
      ctx.strokeStyle = `${room.themeColor}33`;
      ctx.lineWidth = 1;
      ctx.strokeRect(360, 280, 80, 30);
      for (let vx = 368; vx < 435; vx += 8) {
        ctx.fillStyle = '#040711';
        ctx.fillRect(vx, 284, 4, 22);
      }

      // ----------------------------------------------------
      // 2. REINFORCED SECURITY WALLS & CONDUIT TRUNKS
      // ----------------------------------------------------
      if (room.walls) {
        for (const wall of room.walls) {
          // Wall Body 3D Extrusion Gradient
          const wallGrad = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.width, wall.y + wall.height);
          wallGrad.addColorStop(0, '#131b2e');
          wallGrad.addColorStop(0.5, '#0b1120');
          wallGrad.addColorStop(1, '#050811');

          ctx.fillStyle = wallGrad;
          ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

          // Wall Trim Stroke
          ctx.strokeStyle = `${room.themeColor}55`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

          // Illuminated Neon Conduit Strip
          ctx.fillStyle = `${room.themeColor}99`;
          if (wall.width > wall.height) {
            ctx.fillRect(wall.x + 4, wall.y + wall.height / 2 - 1, wall.width - 8, 2);
          } else {
            ctx.fillRect(wall.x + wall.width / 2 - 1, wall.y + 4, 2, wall.height - 8);
          }
        }
      }

      // Hazard Warning Stripes along Perimeters
      ctx.fillStyle = '#f59e0b18';
      for (let sx = 40; sx < 800 - 40; sx += 32) {
        ctx.beginPath();
        ctx.moveTo(sx, 36);
        ctx.lineTo(sx + 16, 36);
        ctx.lineTo(sx + 6, 40);
        ctx.lineTo(sx - 10, 40);
        ctx.fill();
      }

      // ----------------------------------------------------
      // 3. PHYSICAL 2.5D BLAST DOORS WITH LIGHT-SWEEP ANIMATION
      // ----------------------------------------------------
      for (const door of room.doors) {
        const isDoorNear = nearbyDoor?.id === door.id;
        const isUnlocked = !door.isLocked || Boolean(door.unlockCondition && door.unlockCondition(progressState));
        const isBossDoor = door.id === 'door_to_boss';

        // Doorway Floor Runway Illumination
        ctx.fillStyle = isUnlocked
          ? isBossDoor ? 'rgba(6, 182, 212, 0.35)' : 'rgba(16, 185, 129, 0.22)'
          : 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(door.x - 4, door.y - 4, door.width + 8, door.height + 8);

        // Door Heavy Steel Frame
        ctx.fillStyle = isUnlocked ? (isBossDoor ? '#081827' : '#072418') : '#2d0c15';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Sliding Reinforced Steel Slabs with Light-Sweep Animation
        const sweepGlow = Math.sin(tick * 0.08) * 0.5 + 0.5;
        const slabGrad = ctx.createLinearGradient(door.x, door.y, door.x + door.width, door.y + door.height);
        slabGrad.addColorStop(0, '#1e293b');
        slabGrad.addColorStop(
          0.5,
          isUnlocked
            ? isBossDoor
              ? `rgba(6, 182, 212, ${0.3 + sweepGlow * 0.3})`
              : `rgba(16, 185, 129, ${0.15 + sweepGlow * 0.2})`
            : `rgba(239, 68, 68, ${0.15 + sweepGlow * 0.2})`
        );
        slabGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = slabGrad;
        if (door.width > door.height) {
          ctx.fillRect(door.x + 2, door.y + 2, (door.width - 4) / 2, door.height - 4);
          ctx.fillRect(door.x + door.width / 2, door.y + 2, (door.width - 4) / 2, door.height - 4);
        } else {
          ctx.fillRect(door.x + 2, door.y + 2, door.width - 4, (door.height - 4) / 2);
          ctx.fillRect(door.x + 2, door.y + door.height / 2, door.width - 4, (door.height - 4) / 2);
        }

        // Door Outline Neon Border
        ctx.strokeStyle = isUnlocked ? (isBossDoor ? '#38bdf8' : '#10b981') : '#ef4444';
        ctx.lineWidth = isDoorNear ? 3.5 : (isBossDoor && isUnlocked ? 2.5 : 2);
        ctx.strokeRect(door.x, door.y, door.width, door.height);

        // Doorway Status Indicator & Label
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = isUnlocked ? (isBossDoor ? (progressState.isBossDefeated ? '#6ee7b7' : '#7dd3fc') : '#6ee7b7') : '#f87171';
        ctx.textAlign = 'center';
        const displayLabel = isBossDoor
          ? isUnlocked
            ? progressState.isBossDefeated
              ? '👑 NuLL CHAMBER: SECURED'
              : '👑 NuLL AIRLOCK: UNSEALED'
            : door.label
          : door.label;
        ctx.fillText(displayLabel, door.x + door.width / 2, door.y + door.height / 2 + 3);

        // Holographic Lock/Unlock Badge above door
        if (!isUnlocked) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(door.x + door.width / 2 - 36, door.y - 13, 72, 12, 3);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('🔒 SEALED GATE', door.x + door.width / 2, door.y - 4);
        } else if (isBossDoor) {
          ctx.fillStyle = progressState.isBossDefeated ? '#10b981' : '#06b6d4';
          ctx.beginPath();
          ctx.roundRect(door.x + door.width / 2 - 48, door.y - 15, 96, 14, 4);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'black 8px monospace';
          ctx.fillText(
            progressState.isBossDefeated ? '👑 SECURED CORE [E]' : '👑 BREACH AIRLOCK [E]',
            door.x + door.width / 2,
            door.y - 5
          );
        } else if (isDoorNear) {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(door.x + door.width / 2 - 32, door.y - 14, 64, 13, 3);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'black 7.5px monospace';
          ctx.fillText('⚡ TRAVERSE [E]', door.x + door.width / 2, door.y - 5);
        }
      }

      // ----------------------------------------------------
      // 4. HIGH-TECH 2.5D INTERACTIVE PROPS & TERMINALS
      // ----------------------------------------------------
      for (const obj of room.objects) {
        const isNear = nearbyObject?.id === obj.id;
        const isObjCompleted = Boolean(progressState.completedTaskIds?.includes(obj.id));

        ctx.save();
        ctx.translate(obj.x, obj.y);

        // Volumetric Warm/Amber Radial Ground Spotlight
        const poolRadius = Math.max(obj.width, obj.height) * 1.1;
        const lightPool = ctx.createRadialGradient(0, 0, 4, 0, 0, poolRadius);
        lightPool.addColorStop(
          0,
          isObjCompleted
            ? 'rgba(16, 185, 129, 0.35)'
            : isNear
            ? 'rgba(245, 158, 11, 0.45)'
            : `${obj.color}25`
        );
        lightPool.addColorStop(
          0.7,
          isObjCompleted
            ? 'rgba(16, 185, 129, 0.08)'
            : isNear
            ? 'rgba(245, 158, 11, 0.12)'
            : `${obj.color}08`
        );
        lightPool.addColorStop(1, 'transparent');
        ctx.fillStyle = lightPool;
        ctx.beginPath();
        ctx.arc(0, 0, poolRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ambient Occlusion Cast Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, obj.height / 2 + 5, obj.width / 2 + 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heavy Terminal / Pedestal Base Mount
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = isNear ? '#f59e0b' : '#1e293b';
        ctx.lineWidth = isNear ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(-obj.width / 2 - 5, -obj.height / 2 - 5, obj.width + 10, obj.height + 10, 10);
        ctx.fill();
        ctx.stroke();

        // 2.5D Physical Prop Housing Body
        const gradient = ctx.createLinearGradient(0, -obj.height / 2, 0, obj.height / 2);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(0.5, '#0f172a');
        gradient.addColorStop(1, '#070b14');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = isObjCompleted ? '#10b981' : isNear ? '#f59e0b' : obj.color;
        ctx.lineWidth = isNear ? 3 : isObjCompleted ? 2 : 1.5;

        ctx.beginPath();
        ctx.roundRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height, 8);
        ctx.fill();
        ctx.stroke();

        // Server Rack & Console Front-Panel Details
        if (obj.type === 'SERVER_RACK' || obj.type === 'NETWORK_CONSOLE' || obj.type === 'SERVER_ASSEMBLY') {
          for (let row = 0; row < 4; row++) {
            const ledY = -obj.height / 2 + 10 + row * 11;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-obj.width / 2 + 6, ledY, obj.width - 12, 7);

            // Blinking green/amber status LEDs
            const isBlink = Math.sin(tick * 0.12 + row) > 0;
            ctx.fillStyle = isBlink ? '#10b981' : '#06b6d4';
            ctx.fillRect(-obj.width / 2 + 10, ledY + 1.5, 4, 4);
            ctx.fillRect(-obj.width / 2 + 18, ledY + 1.5, 4, 4);
          }
        }

        // Object Hero Icon
        ctx.font = `${Math.min(24, obj.width / 2.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.icon, 0, -2);

        // Object Label
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = isObjCompleted ? '#34d399' : isNear ? '#fbbf24' : '#94a3b8';
        ctx.fillText(obj.name.split(' ')[0], 0, obj.height / 2 + 14);

        // Completed Green Checkmark Badge above object
        if (isObjCompleted && !isNear) {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(-22, -obj.height / 2 - 14, 44, 12, 4);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 7.5px monospace';
          ctx.fillText('✓ DONE', 0, -obj.height / 2 - 6);
        }

        // Warm/Amber Practical Proximity Badge: "[E] INSPECT"
        if (isNear) {
          ctx.fillStyle = isObjCompleted ? '#10b981' : '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(-48, -obj.height / 2 - 26, 96, 18, 5);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'black 9px monospace';
          ctx.fillText(isObjCompleted ? '[E] COMPLETED' : '[E] INSPECT', 0, -obj.height / 2 - 14);
        }

        ctx.restore();
      }

      // ----------------------------------------------------
      // 5. DRAW UNIT-7 REALISTIC AUGMENTED TECHNICIAN
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(player.x, player.y);

      // Character Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 18, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bobbing Animation on Movement
      const bobY = player.isMoving ? Math.sin(player.animFrame * 2) * 2.5 : 0;
      const legOffset = player.isMoving ? Math.sin(player.animFrame * 2) * 4 : 0;

      // Realistic Tactical Boots & Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8 + legOffset, 8 + bobY, 6, 12);
      ctx.fillRect(2 - legOffset, 8 + bobY, 6, 12);

      // Tactical Utility Jumpsuit Torso (Reinforced Kevlar Plates)
      const suitGrad = ctx.createLinearGradient(0, -18, 0, 8);
      suitGrad.addColorStop(0, '#1e293b');
      suitGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = suitGrad;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-11, -16 + bobY, 22, 26, 5);
      ctx.fill();
      ctx.stroke();

      // Chest Harness Straps
      ctx.strokeStyle = '#f59e0b88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-9, -14 + bobY);
      ctx.lineTo(9, 6 + bobY);
      ctx.moveTo(9, -14 + bobY);
      ctx.lineTo(-9, 6 + bobY);
      ctx.stroke();

      // Heavy Augmented Helmet
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-10, -32 + bobY, 20, 18, 6);
      ctx.fill();
      ctx.stroke();

      // Glowing Cyan Visor with Ambient Pulse
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (player.facing === 'left') {
        ctx.roundRect(-9, -26 + bobY, 8, 6, 2);
      } else if (player.facing === 'right') {
        ctx.roundRect(1, -26 + bobY, 8, 6, 2);
      } else if (player.facing === 'up') {
        ctx.roundRect(-6, -28 + bobY, 12, 4, 2);
      } else {
        ctx.roundRect(-7, -26 + bobY, 14, 6, 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Antenna beacon
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, -37 + bobY, 2, 6);

      ctx.restore();

      // ----------------------------------------------------
      // 6. ATMOSPHERIC VIGNETTE PASS
      // ----------------------------------------------------
      const vignette = ctx.createRadialGradient(400, 300, 200, 400, 300, 460);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(3, 7, 18, 0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 800, 600);

      ctx.restore(); // Restore High-DPI Scale

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [room, activeInspectorObject, progressState, nearbyObject, nearbyDoor]);

  const activeHint = nearbyObject ? OBJECT_SUBTLE_HINTS[nearbyObject.id] : null;

  const all14TasksCompleted = ALL_BOSS_TASK_IDS.every((taskId) =>
    progressState.completedTaskIds?.includes(taskId)
  );
  const isBossDefeated = Boolean(progressState.isBossDefeated);
  const isBossSealBroken = all14TasksCompleted && !isBossDefeated;

  return (
    <div className="w-full flex flex-col items-center select-none font-mono">
      {/* Boss Airlock Seal Shattered Notification Banner (Only after all 14 tasks completed) */}
      {isBossSealBroken && (
        <div className="w-full bg-gradient-to-r from-cyan-950/90 via-purple-950/90 to-rose-950/90 border-2 border-cyan-400 p-3.5 rounded-2xl mb-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-pulse">
          <div className="flex items-center gap-3 text-cyan-300 font-mono text-xs sm:text-sm">
            <span className="text-2xl animate-bounce">👑</span>
            <div>
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-2">
                ALL 14 SECTOR TASKS COMPLETED!
                <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px]">
                  AIRLOCK UNSEALED
                </span>
              </span>
              <p className="text-[11px] text-cyan-200/90">
                The Central Hub containment seal is shattered. All 14 sector tasks are secured. Approach the Central Boss Airlock or breach immediately below!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playSuccess();
              onEnterBossArena();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs font-mono shadow-[0_0_20px_rgba(225,29,72,0.6)] transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <span>⚔️ BREACH NuLL AIRLOCK</span>
          </button>
        </div>
      )}

      {/* Boss Neutralized Status Banner (When returning to vault after boss defeat) */}
      {isBossDefeated && (
        <div className="w-full bg-gradient-to-r from-emerald-950/90 via-[#06201b]/90 to-teal-950/90 border-2 border-emerald-400/70 p-3.5 rounded-2xl mb-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <div className="flex items-center gap-3 text-emerald-300 font-mono text-xs sm:text-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-2">
                ROGUE AI NuLL TITAN NEUTRALIZED
                <span className="text-emerald-400 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px]">
                  SECURED
                </span>
              </span>
              <p className="text-[11px] text-emerald-200/90">
                The Cyber Vault core is safe. You may freely revisit the neutralized boss chamber or explore facility sectors.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onEnterBossArena();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs font-mono shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <span>👑 VIEW BOSS CHAMBER</span>
          </button>
        </div>
      )}

      {/* Already Secured Floating Notification */}
      {securedNotice && (
        <div className="w-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 px-5 py-2.5 mb-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] font-mono text-xs font-black flex items-center justify-center gap-2.5 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{securedNotice}</span>
        </div>
      )}

      {/* Room Header Banner */}
      <div className="w-full bg-[#080d19] border-2 border-cyan-500/40 rounded-2xl px-5 py-3 mb-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-black text-sm tracking-wider">
            {room.sectorCode}
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              {room.name}
            </h2>
            <p className="text-xs text-gray-400">
              {room.description}
            </p>
          </div>
        </div>

        {/* Quick Controls Reminder */}
        <div className="hidden md:flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/60 px-3.5 py-1.5 rounded-xl border border-cyan-500/30">
          <Footprints className="w-4 h-4" />
          <span>[WASD / CLICK TO WALK] • [E TO INTERACT]</span>
        </div>
      </div>

      {/* Main 2-Column Layout: Expanded Canvas Viewport + Fixed 230px Right Rail */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-start justify-center">
        {/* Expanded 2.5D Room Canvas */}
        <div className="flex-1 w-full relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] bg-[#040711]">
          <canvas
            ref={canvasRef}
            width={1600}
            height={1200}
            onClick={handleCanvasClick}
            className="w-full h-auto aspect-[4/3] block cursor-crosshair"
          />

          {/* Floating Proximity Prompt Bar with Subtle Hint */}
          {nearbyObject && !activeInspectorObject && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-400 text-black px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center gap-0.5 shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-300 animate-pulse pointer-events-auto cursor-pointer max-w-xl text-center"
              onClick={() => setActiveInspectorObject(nearbyObject)}
            >
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4 text-black" />
                <span>PRESS [E] OR CLICK TO INSPECT {nearbyObject.name.toUpperCase()}</span>
              </div>
              {activeHint && (
                <span className="text-[11px] font-semibold text-amber-950/90 italic">
                  — {activeHint}
                </span>
              )}
            </div>
          )}

          {/* Door Lock Notice */}
          {doorMessage && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-rose-950/95 border-2 border-rose-500 text-rose-200 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xl animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>{doorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Rail: Permanent Minimap & Subsystems Panel (~230px) */}
        <aside className="w-full lg:w-[230px] flex flex-col gap-3 shrink-0 font-mono">
          {/* Facility Sectors Minimap Rail */}
          <div className="bg-[#080d1a] border-2 border-cyan-500/40 rounded-2xl p-3.5 shadow-xl">
            <div className="text-[11px] text-cyan-400 font-bold uppercase mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> FACILITY SECTORS</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">RADAR</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[8.5px] text-center font-bold">
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'NETWORK_INFRASTRUCTURE' ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>NET</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'POWER_GRID' ? 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>PWR</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'DATABASE_VAULT' ? 'bg-purple-500 text-black shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>DB</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'BACKEND_API' ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>API</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'CENTRAL_HUB' ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,1)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>HUB</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'FIREWALL_PERIMETER' ? 'bg-red-500 text-black shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>FW</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'CRYPTO_VAULT' ? 'bg-indigo-500 text-black shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>CRYPT</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'BOSS_CHAMBER' ? 'bg-rose-600 text-white shadow-[0_0_8px_rgba(225,29,72,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>BOSS</div>
              <div className={`rounded p-1.5 border transition-all ${currentRoomId === 'FORENSICS_LAB' ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(20,184,166,0.8)]' : 'bg-[#101726] border-white/10 text-gray-400'}`}>FOR</div>
            </div>
          </div>

          {/* Current Sector Telemetry Card */}
          <div className="bg-[#080d1a] border-2 border-cyan-500/30 rounded-2xl p-3.5 shadow-xl space-y-2.5">
            <div className="text-[11px] text-gray-300 font-bold uppercase flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> SECTOR TELEMETRY</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Sub-chambers in room */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-cyan-400/80 font-bold uppercase">Active Chambers:</div>
              {room.chambers?.map((ch) => (
                <div key={ch.code} className="text-[9.5px] bg-[#0d1527] px-2 py-1 rounded border border-white/5 text-gray-300 flex items-center justify-between">
                  <span className="truncate max-w-[140px]">{ch.name}</span>
                  <span className="text-[8px] text-cyan-400 font-bold">{ch.code}</span>
                </div>
              ))}
            </div>

            {/* Subsystem status */}
            <div className="space-y-1">
              <div className="text-[10px] text-cyan-400/80 font-bold uppercase">Subsystem Tasks:</div>
              {room.objects.map((obj) => {
                const isDone = progressState.completedTaskIds?.includes(obj.id);
                return (
                  <div key={obj.id} className="text-[9.5px] bg-[#0d1527] px-2 py-1 rounded border border-white/5 text-gray-300 flex items-center justify-between">
                    <span className="truncate max-w-[130px]">{obj.name.split(' ')[0]}</span>
                    <span className={`text-[8px] font-bold px-1 rounded ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {isDone ? 'DONE' : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Controls Card */}
          <div className="bg-[#080d1a] border-2 border-cyan-500/20 rounded-2xl p-3 shadow-xl text-[10px] text-gray-400 space-y-1.5">
            <div className="text-[10px] text-cyan-300 font-bold uppercase mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> OPERATIVE CONTROLS
            </div>
            <div className="flex justify-between"><span>MOVE:</span><span className="text-white font-bold">[WASD / ARROWS]</span></div>
            <div className="flex justify-between"><span>INTERACT:</span><span className="text-amber-400 font-bold">[E / CLICK]</span></div>
            <div className="flex justify-between"><span>CLOSE OVERLAY:</span><span className="text-rose-400 font-bold">[X / ESC]</span></div>
          </div>
        </aside>
      </div>

      {/* Mobile Virtual Joystick */}
      <VirtualJoystick
        canInteract={!!nearbyObject}
        onInteract={() => {
          if (nearbyObject) {
            soundEngine.playClick();
            setActiveInspectorObject(nearbyObject);
          }
        }}
        onDirectionInput={(dir) => {
          const controller = controllerRef.current;
          if (dir === 'stop') {
            controller.resetPosition(controller.state.x, controller.state.y);
          } else if (dir === 'up') {
            controller.setClickTarget(controller.state.x, controller.state.y - 80);
          } else if (dir === 'down') {
            controller.setClickTarget(controller.state.x, controller.state.y + 80);
          } else if (dir === 'left') {
            controller.setClickTarget(controller.state.x - 80, controller.state.y);
          } else if (dir === 'right') {
            controller.setClickTarget(controller.state.x + 80, controller.state.y);
          }
        }}
      />

      {/* Interactive Object Modal */}
      <ObjectInspectorModal
        object={activeInspectorObject}
        progressState={progressState}
        onPickupScavengerItem={(itemId) => {
          if (onPickupScavengerItem) onPickupScavengerItem(itemId);
          if (itemId === 'fuse') onPickupFuse();
        }}
        onClose={() => setActiveInspectorObject(null)}
        onSubmitAnswer={(val, sec, objId) => onSolveChallenge(val, sec, objId || activeInspectorObject?.id)}
        onTriggerHazard={onTriggerHazard}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
