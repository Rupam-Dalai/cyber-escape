import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  RefreshCw,
  ArrowLeft,
  Crown,
  Medal,
  Users,
  Timer,
  Sparkles,
  MapPin,
  Flame,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../services/api';
import { PixelAvatar } from '../components/common/PixelAvatar';
import { soundEngine } from '../services/audio';

interface LeaderboardPageProps {
  onBack?: () => void;
}

const STAGES = [
  { id: 0, label: 'SECTOR-01', name: 'Power Substation', icon: '⚡' },
  { id: 1, label: 'SECTOR-02', name: 'Server Rack Array', icon: '🖥️' },
  { id: 2, label: 'SECTOR-03', name: 'Backend Store & API', icon: '⚙️' },
  { id: 3, label: 'SECTOR-04', name: 'Database Vault', icon: '🗄️' },
  { id: 4, label: 'SECTOR-05', name: 'Boss NuLL Airlock', icon: '💀' },
];

export const formatCompletionTime = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || seconds < 0) return '00m 00s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
};

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [activeModalStage, setActiveModalStage] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchLeaderboard();
      setEntries(data || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to update leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Sort teams: Highest Trophies (Score) first, ties broken by Lower Completion Time (Elapsed Seconds)
  const sortedEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        const scoreA = Number(a.score) || 0;
        const scoreB = Number(b.score) || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        const timeA = Number(a.time_elapsed_seconds) || 0;
        const timeB = Number(b.time_elapsed_seconds) || 0;
        return timeA - timeB;
      })
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  }, [entries]);

  const top2Entries = sortedEntries.slice(0, 2);
  const rank1 = top2Entries[0];
  const rank2 = top2Entries[1];

  const getNodePos = (index: number) => {
    const total = STAGES.length;
    const x = 12 + (index / (total - 1)) * 76;
    const y = 48 + (index % 2 === 0 ? -12 : 12);
    return { x, y };
  };

  const modalStageInfo = activeModalStage !== null ? STAGES.find((s) => s.id === activeModalStage) : null;
  const modalTeams =
    activeModalStage !== null
      ? sortedEntries.filter((t) => (t.current_quest_index || 0) === activeModalStage)
      : [];

  return (
    <div className="min-h-screen w-screen bg-[#04060c] relative select-none font-mono text-white flex flex-col overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-[#060914] to-[#020306] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-40 px-4 sm:px-8 py-3 bg-[#080d1a]/95 backdrop-blur-md border-b-2 border-cyan-500/40 flex items-center justify-between shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onBack();
              }}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl text-cyan-300 font-bold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">RETURN TO VAULT</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
            <div>
              <h1 className="text-sm sm:text-lg font-black tracking-wider text-white">
                ESCAPE THE CYBER VAULT LEADERBOARD
              </h1>
              <p className="text-[10px] text-cyan-300">
                Department of BSc CS with Cyber Security • Real-Time Standings
              </p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/50 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-cyan-300 shadow-xl">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{entries.length} OPERATIVE TEAMS</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-amber-300 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>CALCULATION: TROPHIES + FASTER TIME</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center bg-black/80 border border-white/20 rounded-2xl p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              🗺️ 2.5D VAULT MAP
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 RANK TABLE
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-cyan-300">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative w-full h-full overflow-y-auto p-4 sm:p-6 z-10 flex flex-col justify-between">
        {viewMode === 'map' ? (
          /* 2.5D Vault Facility Map & Top 2 Podium View */
          <div className="w-full h-full flex flex-col justify-between max-w-6xl mx-auto space-y-4">
            
            {/* Top Section: Laser Connected Sector Nodes */}
            <div className="relative w-full h-48 sm:h-56 flex items-center justify-around">
              {/* Connecting Laser Beams */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {STAGES.map((_, idx) => {
                  if (idx === STAGES.length - 1) return null;
                  const p1 = getNodePos(idx);
                  const p2 = getNodePos(idx + 1);

                  return (
                    <line
                      key={idx}
                      x1={`${p1.x}%`}
                      y1={`${p1.y}%`}
                      x2={`${p2.x}%`}
                      y2={`${p2.y}%`}
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeOpacity="0.5"
                      strokeDasharray="6 6"
                    />
                  );
                })}
              </svg>

              {/* Chamber Nodes */}
              <div className="relative z-10 w-full flex items-center justify-around">
                {STAGES.map((stage) => {
                  const teamsInSector = sortedEntries.filter(
                    (t) => (t.current_quest_index || 0) === stage.id && t.status !== 'COMPLETED'
                  );
                  const teamsCompleted = stage.id === 4 ? sortedEntries.filter((t) => t.status === 'COMPLETED') : [];

                  return (
                    <motion.div
                      key={stage.id}
                      whileHover={{ scale: 1.06 }}
                      onClick={() => setActiveModalStage(stage.id)}
                      className="flex flex-col items-center cursor-pointer relative"
                    >
                      {/* Glowing Platform Card */}
                      <div className="w-36 sm:w-44 bg-[#0a1020]/90 border-2 border-cyan-500/50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-md relative overflow-hidden">
                        <div className="text-[9px] sm:text-[10px] text-cyan-400 font-bold uppercase mb-0.5">
                          {stage.label}
                        </div>
                        <div className="text-2xl sm:text-3xl my-1.5">{stage.icon}</div>
                        <div className="text-[11px] sm:text-xs font-black text-white truncate">
                          {stage.name}
                        </div>

                        {/* Team Occupancy Badge */}
                        <div className="mt-2 sm:mt-3 bg-black/60 border border-white/10 rounded-xl p-1 text-[9px] sm:text-[10px] text-gray-300">
                          {stage.id === 4 && teamsCompleted.length > 0 ? (
                            <span className="text-emerald-400 font-bold">
                              🏆 {teamsCompleted.length} ESCAPED!
                            </span>
                          ) : (
                            <span>{teamsInSector.length} Operatives</span>
                          )}
                        </div>
                      </div>

                      {/* Floating Avatar Badges */}
                      {teamsInSector.length > 0 && (
                        <div className="flex -space-x-1.5 mt-1.5">
                          {teamsInSector.slice(0, 3).map((t, idx) => (
                            <div
                              key={idx}
                              title={t.team_name}
                              className="w-5 h-5 rounded-full border border-cyan-400 bg-cyan-950 flex items-center justify-center text-[9px]"
                            >
                              🤖
                            </div>
                          ))}
                          {teamsInSector.length > 3 && (
                            <div className="w-5 h-5 rounded-full border border-cyan-400 bg-cyan-900 text-white text-[8px] flex items-center justify-center font-bold">
                              +{teamsInSector.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Section: Top 2 Champions Podium & Calculation Showcase */}
            <div className="w-full bg-[#070d1a]/95 border-2 border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.2)] backdrop-blur-md space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
                    <Crown className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>TOP 2 VAULT CHAMPIONS</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                        CURRENT LEADERS
                      </span>
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      Calculated by <strong className="text-amber-300">Highest Trophies</strong> and <strong className="text-cyan-300">Lower Completion Time</strong> (tiebreaker).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-xl">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>RANK 1 & RANK 2 SPEEDRUN STANDINGS</span>
                </div>
              </div>

              {/* Top 2 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 🥇 RANK 1 CHAMPION CARD */}
                {rank1 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-b from-amber-950/30 via-[#0d1527] to-[#080d1a] border-2 border-amber-400/80 rounded-2xl p-4 shadow-[0_0_35px_rgba(245,158,11,0.25)] space-y-3 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs shadow-md flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" />
                          <span>1ST PLACE • CHAMPION</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                        GOLD TIER
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="ring-2 ring-amber-400 rounded-xl p-1 bg-black/50">
                        <PixelAvatar avatarId={rank1.team_name} size={42} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-black text-white truncate">
                          {rank1.team_name}
                        </h3>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{rank1.current_location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-black/50 border border-amber-400/40 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>TROPHIES EARNED:</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-amber-300">
                          {rank1.score} <span className="text-[10px] font-normal text-amber-400">PTS</span>
                        </div>
                      </div>

                      <div className="bg-black/50 border border-cyan-400/40 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Timer className="w-3 h-3 text-cyan-400" />
                          <span>COMPLETION TIME:</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-cyan-300">
                          {formatCompletionTime(rank1.time_elapsed_seconds)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-white/5 pt-2">
                      <span>FRAGMENTS: {'🔑'.repeat(Math.min(4, rank1.fragments_count || 0))}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${rank1.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {rank1.status === 'COMPLETED' ? '✓ ESCAPED' : 'IN PROGRESS'}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 border border-white/10 rounded-2xl text-center text-gray-500 text-xs">
                    No Champion Registered Yet
                  </div>
                )}

                {/* 🥈 RANK 2 RUNNER-UP CARD */}
                {rank2 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative bg-gradient-to-b from-cyan-950/30 via-[#0d1527] to-[#080d1a] border-2 border-cyan-400/80 rounded-2xl p-4 shadow-[0_0_35px_rgba(6,182,212,0.25)] space-y-3 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-slate-300 to-cyan-400 text-black font-black text-xs shadow-md flex items-center gap-1.5">
                          <Medal className="w-3.5 h-3.5" />
                          <span>2ND PLACE • RUNNER-UP</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
                        SILVER TIER
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="ring-2 ring-cyan-400 rounded-xl p-1 bg-black/50">
                        <PixelAvatar avatarId={rank2.team_name} size={42} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-black text-white truncate">
                          {rank2.team_name}
                        </h3>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{rank2.current_location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-black/50 border border-amber-400/40 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>TROPHIES EARNED:</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-amber-300">
                          {rank2.score} <span className="text-[10px] font-normal text-amber-400">PTS</span>
                        </div>
                      </div>

                      <div className="bg-black/50 border border-cyan-400/40 rounded-xl p-2.5">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Timer className="w-3 h-3 text-cyan-400" />
                          <span>COMPLETION TIME:</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-cyan-300">
                          {formatCompletionTime(rank2.time_elapsed_seconds)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-white/5 pt-2">
                      <span>FRAGMENTS: {'🔑'.repeat(Math.min(4, rank2.fragments_count || 0))}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${rank2.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {rank2.status === 'COMPLETED' ? '✓ ESCAPED' : 'IN PROGRESS'}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 border border-white/10 rounded-2xl text-center text-gray-500 text-xs">
                    No Runner-Up Registered Yet
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Rank Table View */
          <div className="max-w-5xl w-full mx-auto space-y-4">
            {/* Top 2 Mini-Banner above table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rank1 && (
                <div className="bg-gradient-to-r from-amber-950/40 to-black/60 border border-amber-500/50 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥇</span>
                    <div>
                      <div className="text-xs font-black text-white">{rank1.team_name}</div>
                      <div className="text-[10px] text-amber-400">1st Place Champion</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-300">{rank1.score} PTS</div>
                    <div className="text-[10px] text-cyan-300">{formatCompletionTime(rank1.time_elapsed_seconds)}</div>
                  </div>
                </div>
              )}

              {rank2 && (
                <div className="bg-gradient-to-r from-cyan-950/40 to-black/60 border border-cyan-500/50 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥈</span>
                    <div>
                      <div className="text-xs font-black text-white">{rank2.team_name}</div>
                      <div className="text-[10px] text-cyan-400">2nd Place Runner-Up</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-300">{rank2.score} PTS</div>
                    <div className="text-[10px] text-cyan-300">{formatCompletionTime(rank2.time_elapsed_seconds)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#080d1a]/90 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">OPERATIVE STANDINGS TABLE</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  Ranked by Trophies (Desc) & Lower Completion Time (Asc)
                </span>
              </div>

              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-cyan-500/30 text-cyan-400 uppercase font-bold text-[10px]">
                    <th className="py-3 px-3">RANK</th>
                    <th className="py-3 px-3">OPERATIVE TEAM</th>
                    <th className="py-3 px-3">ACTIVE SECTOR</th>
                    <th className="py-3 px-3">⏱️ COMPLETION TIME</th>
                    <th className="py-3 px-3">🏆 TROPHIES</th>
                    <th className="py-3 px-3">ITEMS</th>
                    <th className="py-3 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry) => {
                    const isRank1 = entry.rank === 1;
                    const isRank2 = entry.rank === 2;
                    const isRank3 = entry.rank === 3;

                    return (
                      <tr
                        key={entry.team_name}
                        className={`border-b border-white/5 hover:bg-[#101b30] transition-colors ${
                          isRank1
                            ? 'bg-amber-500/10 font-bold border-l-2 border-l-amber-400'
                            : isRank2
                            ? 'bg-cyan-500/10 font-bold border-l-2 border-l-cyan-400'
                            : isRank3
                            ? 'bg-slate-500/10'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          {isRank1 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black text-[11px] shadow">
                              🥇 #1
                            </span>
                          ) : isRank2 ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-400 text-black font-black text-[11px] shadow">
                              🥈 #2
                            </span>
                          ) : isRank3 ? (
                            <span className="px-2 py-0.5 rounded bg-slate-400 text-black font-black text-[11px]">
                              🥉 #3
                            </span>
                          ) : (
                            <span className="text-gray-400">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <PixelAvatar avatarId={entry.team_name} size={24} />
                          <span className={isRank1 ? 'text-amber-300 font-black' : isRank2 ? 'text-cyan-300 font-bold' : ''}>
                            {entry.team_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-300">{entry.current_location}</td>
                        <td className="py-3 px-3 text-cyan-300 font-bold">
                          {formatCompletionTime(entry.time_elapsed_seconds)}
                        </td>
                        <td className="py-3 px-3 text-amber-300 font-black">
                          {entry.score} PTS
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          {'🔑'.repeat(Math.min(4, entry.fragments_count || 0))}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              entry.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sector Teams Modal */}
      <AnimatePresence>
        {activeModalStage !== null && modalStageInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b101f] border-2 border-cyan-500/50 rounded-3xl p-6 max-w-md w-full font-mono space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-cyan-300">
                  <span className="text-xl">{modalStageInfo.icon}</span>
                  <h3 className="text-base font-bold text-white">{modalStageInfo.name}</h3>
                </div>
                <button
                  onClick={() => setActiveModalStage(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {modalTeams.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No operative teams currently in this chamber.
                  </p>
                ) : (
                  modalTeams.map((t) => (
                    <div
                      key={t.team_name}
                      className="bg-[#121b30] p-2.5 rounded-xl flex items-center justify-between border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <PixelAvatar avatarId={t.team_name} size={24} />
                        <span className="text-xs font-bold text-white">{t.team_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-300">{t.score} PTS</div>
                        <div className="text-[10px] text-cyan-300">{formatCompletionTime(t.time_elapsed_seconds)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
