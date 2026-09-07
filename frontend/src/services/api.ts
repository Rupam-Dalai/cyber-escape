import { Team, Quest, AnswerResult, LeaderboardEntry, EventConfig, FragmentItem } from '../types';

const envApiUrl = (((import.meta as any).env?.VITE_API_BASE_URL as string) || '').trim();
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';

export function getSessionCode(): string | null {
  return localStorage.getItem('code_hunt_team_code');
}

export function setSessionCode(code: string) {
  localStorage.setItem('code_hunt_team_code', code);
}

export function clearSessionCode() {
  localStorage.removeItem('code_hunt_team_code');
}

export function getAdminToken(): string | null {
  return localStorage.getItem('code_hunt_admin_token');
}

export function setAdminToken(token: string) {
  localStorage.setItem('code_hunt_admin_token', token);
}

export async function registerOrLoginTeam(name: string, registration_code: string): Promise<Team> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), registration_code: registration_code.trim().toUpperCase() }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to register/login team');
  }
  const team: Team = await res.json();
  try {
    localStorage.removeItem('cyber_vault_completed_tasks');
  } catch {}
  setSessionCode(team.registration_code);
  return team;
}

export async function loginTeamByRegisterCode(registration_code: string): Promise<Team> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_code: registration_code.trim().toUpperCase() }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed. Check your Register Number.');
  }
  const team: Team = await res.json();
  try {
    localStorage.removeItem('cyber_vault_completed_tasks');
  } catch {}
  setSessionCode(team.registration_code);
  return team;
}

export async function fetchCurrentTeam(): Promise<Team> {
  const code = getSessionCode();
  if (!code) throw new Error('No active team session');

  const res = await fetch(`${API_BASE}/player/me`, {
    headers: { 'X-Team-Code': code },
  });
  if (!res.ok) {
    clearSessionCode();
    throw new Error('Session expired or invalid');
  }
  return res.json();
}

export async function fetchCurrentQuest(): Promise<Quest> {
  const code = getSessionCode();
  if (!code) throw new Error('No active team session');

  const res = await fetch(`${API_BASE}/player/quest/current`, {
    headers: { 'X-Team-Code': code },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch current quest');
  }
  return res.json();
}

export async function fetchCollectedFragments(): Promise<FragmentItem[]> {
  const code = getSessionCode();
  if (!code) return [];

  const res = await fetch(`${API_BASE}/player/fragments`, {
    headers: { 'X-Team-Code': code },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.fragments || [];
}

export async function submitAnswer(
  quest_id: string,
  submitted_value: string,
  secondary_value?: string,
  task_id?: string
): Promise<AnswerResult> {
  const code = getSessionCode();
  if (!code) throw new Error('No active team session');

  const res = await fetch(`${API_BASE}/player/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Team-Code': code,
    },
    body: JSON.stringify({ quest_id, submitted_value, secondary_value, task_id }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Answer submission failed');
  }
  return data;
}

export async function useHint(): Promise<{ hint_text: string; hints_remaining?: number; new_score?: number }> {
  const code = getSessionCode();
  if (!code) throw new Error('No active team session');

  const res = await fetch(`${API_BASE}/player/use-hint`, {
    method: 'POST',
    headers: { 'X-Team-Code': code },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to unlock hint');
  }
  return res.json();
}

export async function defeatBoss(): Promise<{ status: string; message: string; score?: number }> {
  const code = getSessionCode();
  if (!code) throw new Error('No active team session');

  const res = await fetch(`${API_BASE}/player/defeat-boss`, {
    method: 'POST',
    headers: { 'X-Team-Code': code },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to record boss victory');
  }
  return res.json();
}

export async function respawnPlayer(): Promise<{ status: string; message: string; new_score: number; lives: number }> {
  const code = getSessionCode();
  if (!code) throw new Error('No active team session');

  const res = await fetch(`${API_BASE}/player/respawn`, {
    method: 'POST',
    headers: { 'X-Team-Code': code },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to respawn operative');
  }
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/leaderboard`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEventConfig(): Promise<EventConfig> {
  const res = await fetch(`${API_BASE}/admin/config`);
  if (!res.ok) throw new Error('Failed to fetch event configuration');
  return res.json();
}

// ADMIN API SERVICES
export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Admin login failed');
  }
  const data = await res.json();
  setAdminToken(data.access_token);
  return data.access_token;
}

export async function fetchAdminTeams(): Promise<any[]> {
  const token = getAdminToken();
  if (!token) throw new Error('401 Not authenticated as admin');

  const res = await fetch(`${API_BASE}/admin/teams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    localStorage.removeItem('code_hunt_admin_token');
    throw new Error('401 Unauthorized admin session');
  }
  if (!res.ok) throw new Error('Failed to fetch admin teams');
  return res.json();
}

export async function updateAdminEventStatus(status: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('401 Not authenticated as admin');

  const res = await fetch(`${API_BASE}/admin/event/status?status_val=${status}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    localStorage.removeItem('code_hunt_admin_token');
    throw new Error('401 Unauthorized admin session');
  }
  if (!res.ok) throw new Error('Failed to update event status');
}

export async function overrideTeamAdmin(teamId: string, action: string, value?: number, questIndex?: number): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('401 Not authenticated as admin');

  const res = await fetch(`${API_BASE}/admin/team/${teamId}/override`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, value, quest_index: questIndex }),
  });
  if (res.status === 401) {
    localStorage.removeItem('code_hunt_admin_token');
    throw new Error('401 Unauthorized admin session');
  }
  if (!res.ok) {
    let errMsg = 'Team override failed';
    try {
      const err = await res.json();
      errMsg = err.detail || errMsg;
    } catch {
      errMsg = (await res.text()) || errMsg;
    }
    throw new Error(errMsg);
  }
}

export async function resetAdminEvent(): Promise<{ status: string; message: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('401 Not authenticated as admin');

  const res = await fetch(`${API_BASE}/admin/reset-event`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    localStorage.removeItem('code_hunt_admin_token');
    throw new Error('401 Unauthorized admin session');
  }
  if (!res.ok) {
    let errMsg = 'Reset event failed';
    try {
      const err = await res.json();
      errMsg = err.detail || errMsg;
    } catch {
      errMsg = await res.text() || errMsg;
    }
    throw new Error(errMsg);
  }
  return res.json();
}
