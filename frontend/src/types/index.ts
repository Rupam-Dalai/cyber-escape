export interface Team {
  id: string;
  name: string;
  registration_code: string;
  avatar_id?: string;
  score: number;
  lives: number;
  hints_remaining: number;
  current_quest_index: number;
  status: 'ACTIVE' | 'RECOVERY' | 'COMPLETED' | 'PAUSED' | 'DISQUALIFIED';
  lockout_until: number;
  started_at: number;
  completed_at?: number;
}

export type ChallengeType = 
  | 'NETWORK_PATCH'
  | 'CIRCUIT_STABILIZE'
  | 'CIRCUIT_BREADBOARD'
  | 'SERVER_ASSEMBLY'
  | 'LOGIC_GRID'
  | 'API_ENDPOINT'
  | 'FIREWALL_ACL'
  | 'PACKET_SORTER'
  | 'CIPHER_WHEEL'
  | 'ENIGMA_PLUGBOARD'
  | 'FORENSIC_TIMELINE'
  | 'PCAP_RECONSTRUCT'
  | 'WIRE_SPLICING'
  | 'SERVER_PATCH'
  | 'API_ROUTING'
  | 'DB_CREDENTIALS'
  | 'BOSS_BATTLE'
  | 'OUTPUT'
  | 'PATH_SELECTION'
  | 'NUMBER_KEYPAD'
  | 'DEBUG_FIX'
  | 'PASSWORD'
  | 'MULTI_KEY'
  | 'PICTOGRAM'
  | 'DETECTIVE_CASE'
  | 'GRAPHICAL_QUEST';

export interface Quest {
  id: string;
  order_index: number;
  slug: string;
  title: string;
  location_name: string;
  description?: string;
  narrative?: string;
  challenge_type: ChallengeType;
  code_language: string;
  code_content?: string;
  image_url?: string;
  hint_available: boolean;
  hint_text?: string;
  fragment_char?: string;
}

export interface ScavengerItem {
  id: string;
  name: string;
  icon: string;
  location: string;
  description: string;
  collected: boolean;
}

export interface FragmentItem {
  order: number;
  char: string;
  location: string;
  item_name?: string;
  icon?: string;
  item_type?: 'energy' | 'network' | 'api' | 'root' | 'vault' | 'quest';
  description?: string;
}

export interface AnswerResult {
  is_correct: boolean;
  message: string;
  score_change: number;
  new_score: number;
  lives_remaining: number;
  lockout_until: number;
  fragment_unlocked?: string;
  quest_completed: boolean;
  all_quests_completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  team_name: string;
  register_number?: string;
  avatar_id?: string;
  current_location: string;
  current_quest_index?: number;
  score: number;
  lives?: number;
  time_elapsed_seconds: number;
  status: string;
  fragments_count: number;
}

export interface EventConfig {
  id: number;
  event_name: string;
  club_name: string;
  event_date: string;
  starting_score: number;
  starting_lives: number;
  hints_per_team: number;
  hint_cost: number;
  wrong_penalty: number;
  completion_points: number;
  final_bonus: number;
  lockout_seconds: number;
  leaderboard_enabled: boolean;
  physical_treasure_mode: boolean;
  final_physical_clue: string;
  event_status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'ENDED';
}
