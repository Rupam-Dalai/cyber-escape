import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, ArrowDown, CheckCircle2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { soundEngine } from '../../services/audio';

interface PcapTimelineReconstructProps {
  onSubmit: (answer: string) => void;
  onTriggerHazard: (type: 'MEMORY_BLAST') => void;
  isSubmitting?: boolean;
}

interface PcapBlock {
  id: string;
  order: number;
  title: string;
  protocol: string;
  description: string;
  bytes: string;
}

const PCAP_BLOCKS: PcapBlock[] = [
  {
    id: 'blk_3',
    order: 3,
    title: 'ENCRYPTED DATA EXFILTRATION CHUNK',
    protocol: 'HTTPS POST',
    description: '45.2 MB encrypted payload pushed to remote rogue C2 IP 198.51.100.23.',
    bytes: '45,210,944 BYTES',
  },
  {
    id: 'blk_1',
    order: 1,
    title: 'TCP 3-WAY HANDSHAKE (SYN / SYN-ACK / ACK)',
    protocol: 'TCP SYN',
    description: 'Initial raw socket connection established between operative workstation and core vault.',
    bytes: '128 BYTES',
  },
  {
    id: 'blk_4',
    order: 4,
    title: 'TCP CONNECTION TEARDOWN & LOG PURGE',
    protocol: 'TCP FIN/RST',
    description: 'Graceful TCP termination followed by bash history timestamp wipe.',
    bytes: '64 BYTES',
  },
  {
    id: 'blk_2',
    order: 2,
    title: 'TLS 1.3 NEGOTIATION & KEY EXCHANGE',
    protocol: 'TLS 1.3',
    description: 'Diffie-Hellman ephemeral key exchange and cipher suite negotiation.',
    bytes: '1,420 BYTES',
  },
];

export const PcapTimelineReconstruct: React.FC<PcapTimelineReconstructProps> = ({
  onSubmit,
  onTriggerHazard,
  isSubmitting = false,
}) => {
  const [items, setItems] = useState<PcapBlock[]>(PCAP_BLOCKS);
  const [statusMessage, setStatusMessage] = useState(
    'PCAP TIMELINE RECONSTRUCTOR: Drag or reorder captured network flow blocks into sequential chronological order.'
  );
  const [isCompleted, setIsCompleted] = useState(false);

  const moveItem = (fromIdx: number, toIdx: number) => {
    soundEngine.playClick();
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setItems(updated);
  };

  const handleVerify = () => {
    soundEngine.playClick();
    const isOrdered = items.every((item, idx) => item.order === idx + 1);

    if (isOrdered) {
      soundEngine.playSuccess();
      soundEngine.playShield();
      setIsCompleted(true);
      setStatusMessage('✓ PCAP PACKET STREAM RECONSTRUCTED! EXFILTRATION VECTOR ISOLATED!');
      setTimeout(() => {
        onSubmit('PCAP_STREAM_RECONSTRUCTED');
      }, 1500);
    } else {
      soundEngine.playError();
      setStatusMessage('⚠️ Incorrect sequence! TCP Handshake must precede TLS Negotiation and Data Exfiltration.');
    }
  };

  return (
    <div className="w-full bg-[#040e0e] border-2 border-teal-500/40 rounded-3xl p-6 shadow-2xl relative select-none font-mono overflow-hidden">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a608_1px,transparent_1px),linear-gradient(to_bottom,#14b8a608_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-teal-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              PCAP NETWORK STREAM RECONSTRUCTION
              <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                FORENSIC PCAP
              </span>
            </h3>
            <p className="text-xs text-teal-200/70">
              Reorder captured packet flow fragments from initial TCP Handshake to final session termination.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-300">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>FRAMES: 4 CHUNKS</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#0b1f1f] border border-teal-500/30 rounded-2xl p-3 mb-5 flex items-center justify-between gap-4 text-xs relative z-10">
        <div className="flex items-center gap-2 text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
      </div>

      {/* Reorderable PCAP Flow Blocks */}
      <div className="space-y-3 mb-6 relative z-10">
        {items.map((block, idx) => {
          return (
            <motion.div
              key={block.id}
              layout
              className="p-4 rounded-xl bg-[#091818] border border-teal-500/40 flex items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-teal-300 text-xs">
                  #{idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{block.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      {block.protocol}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{block.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-teal-400/80 font-bold hidden sm:inline">
                  {block.bytes}
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    className="p-1 rounded bg-black/40 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    className="p-1 rounded bg-black/40 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={isCompleted || isSubmitting}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2 relative z-10 disabled:opacity-50"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span>VERIFY CHRONOLOGICAL PACKET TIMELINE</span>
      </button>
    </div>
  );
};
