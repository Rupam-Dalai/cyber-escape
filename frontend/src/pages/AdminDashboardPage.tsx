import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Pause, Radio, ArrowLeft, RefreshCw, LogOut, RotateCcw, AlertTriangle, Trash2, Download, Users } from 'lucide-react';
import { adminLogin, fetchAdminTeams, updateAdminEventStatus, overrideTeamAdmin, fetchEventConfig, resetAdminEvent, getAdminToken } from '../services/api';
import { EventConfig } from '../types';
import { soundEngine } from '../services/audio';
import { wsClient } from '../services/websocket';

interface AdminDashboardPageProps {
  onBack: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAdminToken()));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [overrideAction, setOverrideAction] = useState('add_points');
  const [overrideValue, setOverrideValue] = useState('100');
  const [targetQuestIndex, setTargetQuestIndex] = useState<number>(0);

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetEvent = async () => {
    try {
      setIsResetting(true);
      soundEngine.playClick();
      await resetAdminEvent();
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('cyber_vault_') || key.startsWith('code_hunt_team_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
      setShowResetModal(false);
      soundEngine.playSuccess();
      loadAdminData();
    } catch (err: any) {
      soundEngine.playError();
      alert(err.message || 'Failed to reset event');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setAuthError('');
    try {
      await adminLogin(username, password);
      setIsAuthenticated(true);
      loadAdminData();
    } catch (err: any) {
      soundEngine.playError();
      setAuthError(err.message || 'Invalid admin credentials');
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const conf = await fetchEventConfig();
      setEventConfig(conf);
      const teamList = await fetchAdminTeams();
      setTeams(teamList);
    } catch (err: any) {
      console.warn('Admin authentication required or session invalid:', err.message);
      if (err.message?.includes('401') || err.message?.includes('authenticated') || err.message?.includes('Unauthorized')) {
        localStorage.removeItem('code_hunt_admin_token');
        setIsAuthenticated(false);
        setAuthError('Session expired or unauthorized. Please login with admin credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
      wsClient.connect();
      const unsubscribe = wsClient.subscribe((msg: any) => {
        if (
          msg.type === 'EVENT_STATUS_CHANGE' ||
          msg.type === 'TEAM_UPDATE' ||
          msg.type === 'LEADERBOARD_UPDATE' ||
          msg.type === 'EVENT_RESET'
        ) {
          loadAdminData();
        }
      });
      const timer = setInterval(loadAdminData, 4000);
      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      soundEngine.playClick();
      await updateAdminEventStatus(newStatus);
      await loadAdminData();
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('authenticated')) {
        localStorage.removeItem('code_hunt_admin_token');
        setIsAuthenticated(false);
        setAuthError('Admin session expired. Please re-enter credentials.');
      } else {
        alert(err.message || 'Failed to update event status');
      }
    }
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      soundEngine.playClick();
      await overrideTeamAdmin(
        selectedTeam.id,
        overrideAction,
        parseInt(overrideValue, 10) || 0,
        targetQuestIndex
      );
      soundEngine.playSuccess();
      setSelectedTeam(null);
      await loadAdminData();
    } catch (err: any) {
      soundEngine.playError();
      alert(err.message || 'Override failed');
    }
  };

  const handleExportCSV = () => {
    soundEngine.playClick();
    if (!teams || teams.length === 0) {
      alert('No participant team data available to export.');
      return;
    }

    const headers = ['Student Name', 'Register Number / Passcode', 'Current Location', 'Score', 'Lives', 'Status'];
    const csvRows = [headers.join(',')];

    teams.forEach((t) => {
      const name = `"${(t.name || '').replace(/"/g, '""')}"`;
      const regCode = `"${(t.registration_code || '').replace(/"/g, '""')}"`;
      const location = `"${(t.current_location || '').replace(/"/g, '""')}"`;
      const score = t.score ?? 0;
      const lives = t.lives ?? 0;
      const status = `"${(t.status || '').replace(/"/g, '""')}"`;

      csvRows.push([name, regCode, location, score, lives, status].join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `code_hunt_participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    soundEngine.playSuccess();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#080B10]">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-hunt-textMuted hover:text-white bg-hunt-surface px-4 py-2 rounded-xl border border-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> MAIN MENU
        </button>

        <div className="w-full max-w-md bg-hunt-surface border border-cyan-500/30 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
          </div>

          <h2 className="text-2xl font-bold font-mono text-white tracking-wide mb-1">
            MISSION CONTROL LOGIN
          </h2>
          <p className="text-xs text-hunt-textMuted mb-6 font-sans">
            Organizer & Game Master Access Portal
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left font-mono text-sm">
            <div>
              <label className="block text-xs text-hunt-textMuted uppercase mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#070A10] border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-hunt-textMuted uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070A10] border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-mono font-bold text-base rounded-xl shadow-lg shadow-cyan-500/25 transition-all mt-4"
            >
              LOGIN TO MISSION CONTROL
            </button>
          </form>
        </div>
      </div>
    );
  }

  const registeredCount = teams.length;
  const activeCount = teams.filter((t) => t.status === 'ACTIVE').length;
  const completedCount = teams.filter((t) => t.status === 'COMPLETED').length;
  const stuckCount = teams.filter((t) => t.is_stuck).length;

  return (
    <div className="min-h-screen bg-[#080B10] p-4 sm:p-8">

      {/* Top Admin Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono font-bold bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> ORGANIZER MISSION CONTROL
            </span>
            <span className="text-xs font-mono text-hunt-textMuted">LAN Wi-Fi Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wider">
            ESCAPE THE CYBER VAULT CONTROL CENTER
          </h1>
          <p className="text-xs font-mono text-cyan-300">
            Department of BSc CS with Cyber Security
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              localStorage.removeItem('code_hunt_admin_token');
              setIsAuthenticated(false);
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 px-4 py-2 rounded-xl border border-rose-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" /> LOGOUT ADMIN
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-mono text-hunt-textMuted hover:text-white bg-hunt-surface px-4 py-2 rounded-xl border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> LEAVE ADMIN
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Event Status Controls & LAN Info Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Event Status Card */}
          <div className="lg:col-span-2 bg-hunt-surface border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-mono font-bold text-white">EVENT STATUS CONTROLS</h3>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${eventConfig?.event_status === 'ACTIVE'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : eventConfig?.event_status === 'WAITING'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                  : eventConfig?.event_status === 'PAUSED'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-gray-500/10 border-gray-500/40 text-gray-400'
                }`}>
                CURRENT STATUS: {eventConfig?.event_status || 'WAITING'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" /> START / RESUME EVENT
              </button>

              <button
                onClick={() => handleStatusChange('WAITING')}
                className="flex-1 py-3 px-4 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95"
                title="Hold all teams in the Operative Staging Bay lobby until started"
              >
                <Users className="w-4 h-4 text-cyan-400" /> HOLD IN LOBBY (WAITING)
              </button>

              <button
                onClick={() => handleStatusChange('PAUSED')}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4 fill-black" /> PAUSE HUNT
              </button>

              <button
                onClick={() => handleStatusChange('ENDED')}
                className="py-3 px-4 bg-rose-700 hover:bg-rose-600 text-white font-mono font-bold text-sm rounded-xl transition-all"
              >
                END EVENT
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowResetModal(true);
                }}
                className="py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-red-400/30 shadow-lg shadow-red-950/50"
              >
                <RotateCcw className="w-4 h-4" /> RESET EVENT
              </button>
            </div>
          </div>

          {/* LAN Participant URL Info */}
          <div className="bg-hunt-surface border border-cyan-500/30 rounded-3xl p-6 font-mono">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">LAN PARTICIPANT CONNECT URL</h3>
            <p className="text-xs text-hunt-textMuted mb-3">
              Have teams connect their mobile/laptop browsers to:
            </p>
            <div className="p-3 bg-[#070A10] border border-cyan-500/40 rounded-xl text-xs font-bold text-white text-center select-all">
              http://192.168.x.x:5173
            </div>
          </div>

        </div>

        {/* Quick Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-hunt-surface border border-white/10 rounded-2xl">
            <span className="text-xs text-hunt-textMuted font-mono block mb-1">REGISTERED TEAMS</span>
            <span className="text-2xl font-mono font-bold text-white">{registeredCount}</span>
          </div>

          <div className="p-5 bg-hunt-surface border border-emerald-500/30 rounded-2xl">
            <span className="text-xs text-hunt-textMuted font-mono block mb-1">ACTIVE IN HUNT</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{activeCount}</span>
          </div>

          <div className="p-5 bg-hunt-surface border border-amber-500/30 rounded-2xl">
            <span className="text-xs text-hunt-textMuted font-mono block mb-1">COMPLETED HUSTLE</span>
            <span className="text-2xl font-mono font-bold text-amber-400">{completedCount}</span>
          </div>

          <div className="p-5 bg-hunt-surface border border-rose-500/30 rounded-2xl">
            <span className="text-xs text-hunt-textMuted font-mono block mb-1">POSSIBLY STUCK (&gt;5m)</span>
            <span className="text-2xl font-mono font-bold text-rose-400">{stuckCount}</span>
          </div>
        </div>

        {/* Teams Table */}
        <div className="bg-hunt-surface border border-white/10 rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-mono font-bold text-white">LIVE TEAM EXPEDITION MONITOR</h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                {registeredCount} Registered
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95"
                title="Export student names and register numbers to CSV"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>EXPORT CSV</span>
              </button>

              <button
                onClick={loadAdminData}
                className="p-2 rounded-xl bg-hunt-elevated text-gray-300 hover:text-white border border-white/10 transition-all"
                title="Refresh Table Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-white/10 text-xs font-mono text-hunt-textMuted uppercase">
                  <th className="py-3 px-3">STUDENT NAME</th>
                  <th className="py-3 px-3">REGISTER NO.</th>
                  <th className="py-3 px-3">LOCATION</th>
                  <th className="py-3 px-3">SCORE</th>
                  <th className="py-3 px-3">LIVES</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {teams.map((t) => (
                  <tr key={t.id} className={t.is_stuck ? 'bg-rose-950/20' : 'hover:bg-white/5'}>
                    <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-2">
                      {t.name}
                      {t.is_stuck && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                          STUCK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-amber-400">{t.registration_code}</td>
                    <td className="py-3 px-3 font-mono text-xs text-cyan-300">{t.current_location}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{t.score}</td>
                    <td className="py-3 px-3 font-mono text-rose-400">{t.lives} ❤️</td>
                    <td className="py-3 px-3 font-mono text-xs">{t.status}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTeam(t);
                          setTargetQuestIndex(t.current_quest_index ?? 0);
                        }}
                        className="px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono rounded-lg transition-all"
                      >
                        OVERRIDE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Override Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hunt-surface border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl font-mono">
            <h3 className="text-base font-bold text-cyan-400 mb-2">ADMIN OVERRIDE: {selectedTeam.name}</h3>
            <form onSubmit={handleApplyOverride} className="space-y-4 text-xs">
              <div>
                <label className="block text-hunt-textMuted mb-1">Action</label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value)}
                  className="w-full bg-[#070A10] border border-white/10 rounded-xl p-3 text-white outline-none"
                >
                  <option value="set_quest">Set Stage / Sector (Jump to Sector 1-7 / Boss NuLL)</option>
                  <option value="add_points">Add Points (+Value)</option>
                  <option value="subtract_points">Subtract Points (-Value)</option>
                  <option value="restore_lives">Restore 3 Lives & Reset Recovery</option>
                  <option value="pause_team">Pause Team (Freeze Access)</option>
                  <option value="resume_team">Resume Team (Set Active)</option>
                  <option value="disqualify">Disqualify Team</option>
                </select>
              </div>

              {overrideAction === 'set_quest' && (
                <div>
                  <label className="block text-cyan-400 font-bold mb-1">OVERRIDE TARGET LEVEL (SECTOR 1-7 / BOSS NuLL)</label>
                  <select
                    value={targetQuestIndex}
                    onChange={(e) => setTargetQuestIndex(parseInt(e.target.value, 10))}
                    className="w-full bg-[#070A10] border border-cyan-500/50 focus:border-cyan-400 rounded-xl p-3 text-white outline-none font-mono text-xs"
                  >
                    <option value={0}>[LEVEL 1] Sector 1: Network Infrastructure Hub (Rewire the Rack)</option>
                    <option value={1}>[LEVEL 2] Sector 2: Industrial Power Substation (Broken PCB Circuit)</option>
                    <option value={2}>[LEVEL 3] Sector 3: Database Security Vault (Crack Credential Vault)</option>
                    <option value={3}>[LEVEL 4] Sector 4: Backend & Microservice Hub (Patch Endpoints)</option>
                    <option value={4}>[LEVEL 5] Sector 5: Firewall & SOC Perimeter (Seal the Perimeter)</option>
                    <option value={5}>[LEVEL 6] Sector 6: Cryptography Sanctuary (Break the Cipher)</option>
                    <option value={6}>[LEVEL 7] Sector 7: Digital Forensics Incident Lab (Trace the Intrusion)</option>
                    <option value={7}>[BOSS ARENA] Central Vault Core: Boss NuLL Chamber (Broforce Combat)</option>
                    <option value={8}>[COMPLETED] Entire Cyber Vault Cleared (Event Finished)</option>
                  </select>
                </div>
              )}

              {(overrideAction === 'add_points' || overrideAction === 'subtract_points') && (
                <div>
                  <label className="block text-hunt-textMuted mb-1">Points Value</label>
                  <input
                    type="number"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full bg-[#070A10] border border-white/10 rounded-xl p-3 text-white outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="flex-1 py-3 bg-hunt-elevated text-gray-300 font-bold rounded-xl"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-500 text-black font-bold rounded-xl"
                >
                  APPLY OVERRIDE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET EVENT CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0B0F19] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-rose-950/60 font-mono text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-wide mb-2">
              CONFIRM FULL EVENT RESET?
            </h3>
            
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 mb-6 text-xs text-rose-200/90 text-left space-y-2">
              <p className="font-bold text-rose-400">⚠️ WARNING: THIS CANNOT BE UNDONE!</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-300">
                <li>Permanently deletes all registered team accounts</li>
                <li>Clears all stage attempts & leaderboard scores</li>
                <li>Resets physical treasure token claims</li>
                <li>Restores event state to fresh start</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowResetModal(false);
                }}
                disabled={isResetting}
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl border border-white/10 transition-all text-xs"
              >
                CANCEL
              </button>
              
              <button
                type="button"
                onClick={handleResetEvent}
                disabled={isResetting}
                className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl border border-rose-400/40 transition-all text-xs shadow-lg shadow-rose-950/80 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> RESETTING...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> CONFIRM RESET
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
