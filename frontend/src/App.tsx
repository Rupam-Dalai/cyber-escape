import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { TeamEntryPage } from './pages/TeamEntryPage';
import { LobbyPage } from './pages/LobbyPage';
import { QuestPage } from './pages/QuestPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Team } from './types';
import { fetchCurrentTeam, getSessionCode, clearSessionCode, fetchEventConfig } from './services/api';
import { wsClient } from './services/websocket';

type AppView = 'landing' | 'entry' | 'lobby' | 'quest' | 'leaderboard' | 'admin';

function isMissionControlUrl(): boolean {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/missioncontrol' || path === '/admin' || hash === '#missioncontrol';
}

function isLeaderboardUrl(): boolean {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/leaderboard' || hash === '#leaderboard';
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() =>
    isMissionControlUrl() ? 'admin' : isLeaderboardUrl() ? 'leaderboard' : 'landing'
  );
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.history.pushState({}, '', '/missioncontrol');
    } else if (view === 'leaderboard') {
      window.history.pushState({}, '', '/leaderboard');
    } else if (window.location.pathname.toLowerCase() === '/missioncontrol' || window.location.pathname.toLowerCase() === '/leaderboard') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleLogout = () => {
    clearSessionCode();
    try {
      localStorage.removeItem('cyber_vault_completed_tasks');
    } catch {}
    setActiveTeam(null);
    navigateTo('landing');
  };

  // Sync URL state on view change or browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      if (isMissionControlUrl()) {
        setCurrentView('admin');
      } else if (isLeaderboardUrl()) {
        setCurrentView('leaderboard');
      } else {
        setCurrentView(activeTeam ? 'quest' : 'landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, activeTeam]);

  // Real-time synchronization of event status (Lobby hold / start)
  useEffect(() => {
    wsClient.connect();
    const unsubscribe = wsClient.subscribe((msg: any) => {
      if (msg.type === 'EVENT_STATUS_CHANGE') {
        if (msg.event_status === 'WAITING' && activeTeam) {
          navigateTo('lobby');
        } else if (msg.event_status === 'ACTIVE' && currentView === 'lobby') {
          navigateTo('quest');
        }
      }
    });
    return () => unsubscribe();
  }, [activeTeam, currentView]);

  // Auto resume team session or route on page reload
  useEffect(() => {
    try {
      localStorage.removeItem('cyber_vault_completed_tasks');
    } catch {}

    const checkSession = async () => {
      if (isMissionControlUrl()) {
        setCurrentView('admin');
        window.history.replaceState({}, '', '/missioncontrol');
        setIsLoading(false);
        return;
      }

      if (isLeaderboardUrl()) {
        setCurrentView('leaderboard');
        window.history.replaceState({}, '', '/leaderboard');
        const code = getSessionCode();
        if (code) {
          try {
            const team = await fetchCurrentTeam();
            setActiveTeam(team);
          } catch {}
        }
        setIsLoading(false);
        return;
      }

      const code = getSessionCode();
      if (code) {
        try {
          const team = await fetchCurrentTeam();
          setActiveTeam(team);
          const conf = await fetchEventConfig();
          if (conf && (conf.event_status === 'ACTIVE' || conf.event_status === 'PAUSED')) {
            setCurrentView('quest');
          } else {
            setCurrentView('lobby');
          }
        } catch (e) {
          clearSessionCode();
          setActiveTeam(null);
          setCurrentView('landing');
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#04060c] flex items-center justify-center font-mono text-cyan-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-bold tracking-wider">LOADING ESCAPE THE CYBER VAULT...</div>
        </div>
      </div>
    );
  }

  switch (currentView) {
    case 'landing':
      return (
        <LandingPage
          activeTeam={activeTeam}
          onEnterHunt={async () => {
            if (activeTeam) {
              try {
                const conf = await fetchEventConfig();
                if (conf && (conf.event_status === 'ACTIVE' || conf.event_status === 'PAUSED')) {
                  navigateTo('quest');
                } else {
                  navigateTo('lobby');
                }
              } catch {
                navigateTo('lobby');
              }
            } else {
              navigateTo('entry');
            }
          }}
          onOpenAdmin={() => navigateTo('admin')}
          onOpenLeaderboard={() => navigateTo('leaderboard')}
          onLogoutTeam={handleLogout}
        />
      );

    case 'entry':
      return (
        <TeamEntryPage
          onTeamRegistered={(team) => {
            setActiveTeam(team);
            navigateTo('lobby');
          }}
          onBack={() => navigateTo('landing')}
        />
      );

    case 'lobby':
      if (!activeTeam) {
        navigateTo('entry');
        return null;
      }
      return (
        <LobbyPage
          team={activeTeam}
          onStartQuest={() => navigateTo('quest')}
          onLogout={handleLogout}
        />
      );

    case 'quest':
      if (!activeTeam) {
        navigateTo('entry');
        return null;
      }
      return (
        <QuestPage
          key={activeTeam.id}
          team={activeTeam}
          onUpdateTeam={(team) => setActiveTeam(team)}
          onOpenLeaderboard={() => navigateTo('leaderboard')}
          onLogout={handleLogout}
          onMoveToLobby={() => navigateTo('lobby')}
        />
      );

    case 'leaderboard':
      return <LeaderboardPage onBack={() => navigateTo(activeTeam ? 'quest' : 'landing')} />;

    case 'admin':
      return <AdminDashboardPage onBack={() => navigateTo(activeTeam ? 'quest' : 'landing')} />;

    default:
      return null;
  }
};

export default App;
