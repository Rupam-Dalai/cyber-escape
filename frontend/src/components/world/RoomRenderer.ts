// 2.5D Cyber Vault World & Room Definitions
// Department of BSc CS with Cyber Security

export interface WorldObject {
  id: string;
  name: string;
  type: 
    | 'NETWORK_CONSOLE'
    | 'SERVER_ASSEMBLY'
    | 'POWER_PANEL'
    | 'WIRE_SPLICING'
    | 'CIRCUIT_BREADBOARD'
    | 'DB_TERMINAL'
    | 'API_WORKSTATION'
    | 'CODE_DEBUGGER'
    | 'FIREWALL_CONSOLE'
    | 'PACKET_SORTER'
    | 'CRYPTO_SAFE'
    | 'ENIGMA_PLUGBOARD'
    | 'FORENSICS_BOARD'
    | 'PCAP_RECONSTRUCT'
    | 'SCAVENGER_PICKUP'
    | 'VENT_FUSE'
    | 'NOTE_CLUE'
    | 'CRATE'
    | 'TERMINAL'
    | 'LASER_GRID'
    | 'GENERATOR'
    | 'SERVER_RACK'
    | 'BREAKER_BOX'
    | 'API_CONSOLE'
    | 'DB_KEYPAD';
  x: number; // Center X in room coordinates (0 to 800)
  y: number; // Center Y in room coordinates (0 to 600)
  width: number;
  height: number;
  icon: string;
  color: string;
  description: string;
  isUnlocked?: boolean;
  requiredItem?: string;
  clueText?: string;
  itemType?: string;
  scavengerItemId?: string;
  scavengerItemName?: string;
}

export interface Doorway {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetRoomId: string;
  spawnX: number;
  spawnY: number;
  isLocked: boolean;
  lockReason?: string;
  unlockCondition?: (state: GameProgressState) => boolean;
}

export interface ChamberZone {
  name: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor?: string;
}

export interface RoomDefinition {
  id: string;
  name: string;
  sectorCode: string;
  themeColor: string;
  accentColor: string;
  bgColor: string;
  ambientSound?: string;
  description: string;
  chambers?: ChamberZone[];
  objects: WorldObject[];
  doors: Doorway[];
  walls: { x: number; y: number; width: number; height: number }[];
}

export interface GameProgressState {
  // Key Sector Badges (7 Key Items)
  hasFirewallPatch: boolean;       // Sector 1 (Network) -> 🛡️ Firewall Patch
  hasPowerSurgeCell: boolean;      // Sector 2 (Power) -> 🔋 Power Surge Cell
  hasAccessCredentials: boolean;   // Sector 3 (Database) -> 📜 Access Credentials
  hasCleanApiCall: boolean;        // Sector 4 (Backend API) -> ⚙️ Clean API Call
  hasFirewallRules: boolean;       // Sector 5 (Firewall ACL) -> 🧱 Firewall Rule Set
  hasCipherKey: boolean;           // Sector 6 (Crypto) -> 🔑 Cipher Key
  hasForensicMap: boolean;         // Sector 7 (Forensics) -> 🗺️ Forensic Trace Map

  // Multi-Room Scavenger Hardware Components
  hasSpareFuse: boolean;           // Sector 2 Vent -> 🔩 50A Fuse (for Sector 2 Circuit)
  hasLogicIC: boolean;             // Sector 4 Workbench -> 📟 74LS08 Logic IC (for Sector 2 Circuit)
  hasCapacitor: boolean;           // Sector 5 SOC Locker -> ⚡ 100uF Capacitor (for Sector 2 Circuit)
  hasRam: boolean;                 // Sector 3 Cold Storage -> 💾 ECC DDR5 RAM (for Sector 1 Server)
  hasSfp: boolean;                 // Central Hub Crate -> 📡 SFP+ Transceiver (for Sector 1 Server)
  hasNvme: boolean;                // Sector 7 Evidence -> 💽 NVMe SSD Blade (for Sector 1 Server)
  hasJumpers: boolean;             // Sector 1 Toolbox -> 🔌 Copper Jumpers (for Sector 6 Plugboard)
  hasTokenCert: boolean;           // Sector 6 Safe -> 📄 Clean Token Cert (for Sector 4 Debugger)

  apiFixed: boolean;               // Unlocks Database Vault
  collectedItems: string[];
  completedTaskIds: string[];      // IDs of objects/subtasks completed
  isBossDefeated?: boolean;        // Whether Boss NuLL was defeated
}

export const INITIAL_PROGRESS: GameProgressState = {
  hasFirewallPatch: false,
  hasPowerSurgeCell: false,
  hasAccessCredentials: false,
  hasCleanApiCall: false,
  hasFirewallRules: false,
  hasCipherKey: false,
  hasForensicMap: false,
  hasSpareFuse: false,
  hasLogicIC: false,
  hasCapacitor: false,
  hasRam: false,
  hasSfp: false,
  hasNvme: false,
  hasJumpers: false,
  hasTokenCert: false,
  apiFixed: false,
  collectedItems: [],
  completedTaskIds: [],
  isBossDefeated: false,
};

export const ALL_BOSS_TASK_IDS = [
  'network_patch_console',
  'network_blade_server',
  'power_wire_splicing_box',
  'power_pcb_breadboard',
  'db_terminal_query',
  'db_keypad_vault',
  'api_workstation_dispatch',
  'api_debugger_console',
  'soc_packet_sorter',
  'soc_firewall_console',
  'crypto_wheel_terminal',
  'crypto_enigma_plugboard',
  'forensics_timeline_workstation',
  'forensics_pcap_reconstruct',
];

export const ROOMS: Record<string, RoomDefinition> = {
  // CENTRAL HUB: Connects to all 7 cybersecurity rooms + Central Boss Airlock
  CENTRAL_HUB: {
    id: 'CENTRAL_HUB',
    name: 'Central Nexus Hub & Security Airlock',
    sectorCode: 'SECTOR-00',
    themeColor: '#06b6d4',
    accentColor: '#38bdf8',
    bgColor: '#060913',
    description: 'The central crossroads of the Cyber Vault. 7 pressurized corridors branch into facility sectors, and the massive Titanium Boss Airlock stands in the center.',
    chambers: [
      { name: 'North Sector Concourse', code: 'CH-01', x: 40, y: 40, width: 720, height: 160 },
      { name: 'Central Airlock Bastion', code: 'CH-02', x: 260, y: 220, width: 280, height: 160 },
      { name: 'South Sector Concourse', code: 'CH-03', x: 40, y: 400, width: 720, height: 160 },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Central Bastion Guard Rails with wide walking clearance
      { x: 250, y: 240, width: 10, height: 120 },
      { x: 540, y: 240, width: 10, height: 120 },
    ],
    doors: [
      {
        id: 'door_to_network',
        label: '🖥️ NW: NETWORK INFRA',
        x: 100,
        y: 10,
        width: 140,
        height: 35,
        targetRoomId: 'NETWORK_INFRASTRUCTURE',
        spawnX: 400,
        spawnY: 460,
        isLocked: false,
      },
      {
        id: 'door_to_power',
        label: '⚡ N: POWER GRID',
        x: 330,
        y: 10,
        width: 140,
        height: 35,
        targetRoomId: 'POWER_GRID',
        spawnX: 400,
        spawnY: 460,
        isLocked: false,
      },
      {
        id: 'door_to_database',
        label: '🗄️ NE: DATABASE VAULT',
        x: 560,
        y: 10,
        width: 140,
        height: 35,
        targetRoomId: 'DATABASE_VAULT',
        spawnX: 400,
        spawnY: 460,
        isLocked: false,
      },
      {
        id: 'door_to_backend',
        label: '⚙️ W: BACKEND API',
        x: 10,
        y: 250,
        width: 35,
        height: 100,
        targetRoomId: 'BACKEND_API',
        spawnX: 620,
        spawnY: 300,
        isLocked: false,
      },
      {
        id: 'door_to_firewall',
        label: '🧱 E: FIREWALL SOC',
        x: 755,
        y: 250,
        width: 35,
        height: 100,
        targetRoomId: 'FIREWALL_PERIMETER',
        spawnX: 180,
        spawnY: 300,
        isLocked: false,
      },
      {
        id: 'door_to_crypto',
        label: '🔑 SW: CRYPTOGRAPHY',
        x: 150,
        y: 555,
        width: 150,
        height: 35,
        targetRoomId: 'CRYPTO_VAULT',
        spawnX: 400,
        spawnY: 140,
        isLocked: false,
      },
      {
        id: 'door_to_forensics',
        label: '🗺️ SE: FORENSICS LAB',
        x: 500,
        y: 555,
        width: 150,
        height: 35,
        targetRoomId: 'FORENSICS_LAB',
        spawnX: 400,
        spawnY: 140,
        isLocked: false,
      },
      {
        id: 'door_to_boss',
        label: '👑 CENTRAL AIRLOCK: BOSS NuLL CHAMBER',
        x: 350,
        y: 240,
        width: 100,
        height: 80,
        targetRoomId: 'BOSS_CHAMBER',
        spawnX: 400,
        spawnY: 500,
        isLocked: true,
        lockReason: '🔒 CENTRAL AIRLOCK SEALED: Complete all 14 sector tasks to breach NuLL Chamber.',
        unlockCondition: (state) => {
          if (state.isBossDefeated) return true;
          if (!state.completedTaskIds) return false;
          return ALL_BOSS_TASK_IDS.every((taskId) => state.completedTaskIds.includes(taskId));
        },
      },
    ],
    objects: [
      {
        id: 'hub_main_terminal',
        name: 'Facility Mainframe SOC Diagnostic Console',
        type: 'TERMINAL',
        x: 200,
        y: 150,
        width: 65,
        height: 50,
        icon: '🖥️',
        color: '#06b6d4',
        description: 'Facility status diagnostic console. Displays grid power, packet telemetry, active firewalls, and containment status.',
      },
      {
        id: 'hub_supply_crate',
        name: 'Tactical Operative Supply Chest (SFP+ Module)',
        type: 'SCAVENGER_PICKUP',
        x: 600,
        y: 150,
        width: 50,
        height: 45,
        icon: '📦',
        color: '#f59e0b',
        description: 'Standard operative field chest containing hardware modules and tactical notes.',
        scavengerItemId: 'sfp',
        scavengerItemName: 'SFP+ 10G Optical Transceiver',
        clueText: 'You opened the tactical chest and retrieved the SFP+ 10G OPTICAL TRANSCEIVER MODULE! Needed to repair Blade Server Rack Alpha in Sector-01.',
      },
    ],
  },

  // ROOM 1: Network Infrastructure (Sector-01)
  NETWORK_INFRASTRUCTURE: {
    id: 'NETWORK_INFRASTRUCTURE',
    name: 'Sector 1: Network Infrastructure Hub',
    sectorCode: 'SECTOR-01',
    themeColor: '#06b6d4',
    accentColor: '#38bdf8',
    bgColor: '#040d16',
    description: 'Divided optical network facility with core fiber switchboards, high-density server rack bays, and maintenance workshop.',
    chambers: [
      { name: 'Core Optical Switchboard Bay', code: 'CH-01', x: 40, y: 40, width: 340, height: 160, accentColor: '#06b6d4' },
      { name: 'Blade Server Chassis Array', code: 'CH-02', x: 420, y: 40, width: 340, height: 160, accentColor: '#0284c7' },
      { name: 'Technician Hardware Workshop', code: 'CH-03', x: 40, y: 260, width: 720, height: 300, accentColor: '#38bdf8' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Sub-chamber partition walls moved up away from middle & bottom corridors
      { x: 395, y: 40, width: 10, height: 140 },
      { x: 40, y: 200, width: 220, height: 10 },
      { x: 540, y: 200, width: 220, height: 10 },
    ],
    doors: [
      {
        id: 'network_to_hub',
        label: '⬇️ RETURN TO CENTRAL HUB',
        x: 340,
        y: 555,
        width: 120,
        height: 35,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 170,
        spawnY: 100,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'network_patch_console',
        name: '[TASK 1: EASY] Optical Deduction Patch Panel',
        type: 'NETWORK_CONSOLE',
        x: 200,
        y: 120,
        width: 90,
        height: 60,
        icon: '🖥️',
        color: '#06b6d4',
        description: 'Optical switchboard pedestal. Route abstract symbol ports (Delta, Cube, Diamond, Orb) to numbered terminals by logical deduction.',
      },
      {
        id: 'network_blade_server',
        name: '[TASK 2: MEDIUM] Blade Server Hardware Chassis',
        type: 'SERVER_ASSEMBLY',
        x: 580,
        y: 120,
        width: 90,
        height: 65,
        icon: '🎛️',
        color: '#0284c7',
        description: 'Blade Server Rack Alpha chassis. Drag and slot in ECC DDR5 RAM (Sector 3), SFP+ Transceiver (Hub), and NVMe SSD (Sector 7).',
      },
      {
        id: 'network_technician_toolbox',
        name: 'Technician Toolbox (Copper Jumpers)',
        type: 'SCAVENGER_PICKUP',
        x: 600,
        y: 380,
        width: 50,
        height: 45,
        icon: '🧰',
        color: '#38bdf8',
        description: 'Heavy duty maintenance toolbox with precision wiring equipment.',
        scavengerItemId: 'jumpers',
        scavengerItemName: 'Copper Jumper Wire Set',
        clueText: 'You opened the technician toolbox and collected the COPPER JUMPER WIRE SET! Needed for Enigma plugboard wiring in Sector-06.',
      },
      {
        id: 'network_manual_note',
        name: 'Deduction Grid Clue Sheet',
        type: 'NOTE_CLUE',
        x: 200,
        y: 380,
        width: 45,
        height: 40,
        icon: '📜',
        color: '#38bdf8',
        description: 'A laminated fiber patch deduction schematic.',
        clueText: 'PATCH DEDUCTION SHEET: Diamond [◆] routes to Terminal #3. Cube [■] connects to an even-numbered terminal. Delta [▲] connects to a lower number than Orb [●]. Orb [●] is never adjacent to Delta [▲].',
      },
    ],
  },

  // ROOM 2: Power Grid (Sector-02)
  POWER_GRID: {
    id: 'POWER_GRID',
    name: 'Sector 2: Industrial Power Substation',
    sectorCode: 'SECTOR-02',
    themeColor: '#f59e0b',
    accentColor: '#fbbf24',
    bgColor: '#100c06',
    description: 'High-voltage transformer substation with wire splicing bays, PCB breadboard testbenches, and overhead cooling vents.',
    chambers: [
      { name: 'High-Voltage Transformer Cell', code: 'CH-01', x: 40, y: 40, width: 340, height: 160, accentColor: '#f59e0b' },
      { name: 'PCB Breadboard Assembly Lab', code: 'CH-02', x: 420, y: 40, width: 340, height: 160, accentColor: '#fbbf24' },
      { name: 'HVAC Ventilation & Maintenance Hall', code: 'CH-03', x: 40, y: 260, width: 720, height: 300, accentColor: '#ea580c' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Sub-chamber partition walls moved up away from corridors
      { x: 395, y: 40, width: 10, height: 140 },
      { x: 40, y: 200, width: 220, height: 10 },
      { x: 540, y: 200, width: 220, height: 10 },
    ],
    doors: [
      {
        id: 'power_to_hub',
        label: '⬇️ RETURN TO CENTRAL HUB',
        x: 340,
        y: 555,
        width: 120,
        height: 35,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 400,
        spawnY: 100,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'power_wire_splicing_box',
        name: '[TASK 1: EASY] Non-Crossing Circuit Flow Console',
        type: 'WIRE_SPLICING',
        x: 200,
        y: 120,
        width: 85,
        height: 60,
        icon: '⚡',
        color: '#f59e0b',
        description: 'Circuit trace distribution board. Route 4 colored power buses (Red, Amber, Cyan, Purple) between matching terminals without crossing traces.',
      },
      {
        id: 'power_pcb_breadboard',
        name: '[TASK 2: MEDIUM] Broken PCB Circuit Breadboard',
        type: 'CIRCUIT_BREADBOARD',
        x: 580,
        y: 120,
        width: 90,
        height: 65,
        icon: '📟',
        color: '#fbbf24',
        description: 'Physical PCB circuit board. Drag and slot in 50A Fuse (Vent), 74LS08 IC (Sector 4), and 100uF Capacitor (Sector 5).',
      },
      {
        id: 'power_vent_fuse_drop',
        name: 'Cooling Duct Vent Grill (50A Ceramic Fuse)',
        type: 'SCAVENGER_PICKUP',
        x: 180,
        y: 380,
        width: 50,
        height: 45,
        icon: '🔩',
        color: '#fbbf24',
        description: 'A loose ventilation intake grill with an emergency electronic component inside.',
        scavengerItemId: 'fuse',
        scavengerItemName: '50A Ceramic Power Fuse',
        clueText: 'You unscrewed the ventilation grill and found the 50A CERAMIC POWER FUSE! Needed for the PCB Circuit Breadboard in this room.',
      },
      {
        id: 'power_safety_bulletin',
        name: 'Circuit Flow Schematic Bulletin',
        type: 'NOTE_CLUE',
        x: 600,
        y: 380,
        width: 45,
        height: 40,
        icon: '📜',
        color: '#f59e0b',
        description: 'Laminated substation wiring schematics on clipboard.',
        clueText: 'CIRCUIT FLOW SPECIFICATION: Connect matching terminals (Red, Amber, Cyan, Purple) on the 5x5 grid without crossing traces or passing through the blown capacitor block.',
      },
    ],
  },

  // ROOM 3: Database Vault (Sector-03)
  DATABASE_VAULT: {
    id: 'DATABASE_VAULT',
    name: 'Sector 3: Database Security Vault',
    sectorCode: 'SECTOR-03',
    themeColor: '#a855f7',
    accentColor: '#c084fc',
    bgColor: '#0d0614',
    description: 'Cryogenic cold storage database facility with SQL query workstations and high-density archive banks.',
    chambers: [
      { name: 'SQL Query & Security Bay', code: 'CH-01', x: 40, y: 40, width: 340, height: 160, accentColor: '#a855f7' },
      { name: 'Root Server Monolith Bank', code: 'CH-02', x: 420, y: 40, width: 340, height: 160, accentColor: '#c084fc' },
      { name: 'Cold Storage Archive Concourse', code: 'CH-03', x: 40, y: 260, width: 720, height: 300, accentColor: '#7e22ce' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      { x: 395, y: 40, width: 10, height: 140 },
      { x: 40, y: 200, width: 220, height: 10 },
      { x: 540, y: 200, width: 220, height: 10 },
    ],
    doors: [
      {
        id: 'database_to_hub',
        label: '⬇️ RETURN TO CENTRAL HUB',
        x: 340,
        y: 555,
        width: 120,
        height: 35,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 630,
        spawnY: 100,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'db_terminal_query',
        name: '[TASK 1: EASY] Credential Decryption Code-Breaker Console',
        type: 'DB_TERMINAL',
        x: 200,
        y: 120,
        width: 90,
        height: 65,
        icon: '🗄️',
        color: '#a855f7',
        description: 'Interactive Mastermind decryption terminal. Formulate 4-rune sequences and analyze exact & misplaced key ratings to extract admin credentials.',
      },
      {
        id: 'db_keypad_vault',
        name: '[TASK 2: MEDIUM] Root SQL Query & Keypad Vault',
        type: 'DB_KEYPAD',
        x: 200,
        y: 380,
        width: 90,
        height: 65,
        icon: '🔢',
        color: '#c084fc',
        description: 'Interactive Root SQL query terminal and encrypted cipher keypad. Execute the Root SQL query to uncover the decrypted passcode, then input it into the numeric keypad to extract Root Credentials.',
      },
      {
        id: 'db_cold_storage_monolith',
        name: 'Cold Storage Server Monolith (ECC RAM)',
        type: 'SCAVENGER_PICKUP',
        x: 580,
        y: 120,
        width: 65,
        height: 65,
        icon: '💾',
        color: '#c084fc',
        description: 'Cryogenically cooled server storage cabinet holding high-performance hardware memory.',
        scavengerItemId: 'ram',
        scavengerItemName: 'ECC DDR5 Server RAM Module',
        clueText: 'You opened the cryogenic cold storage bay and retrieved the ECC DDR5 SERVER RAM! Needed to repair Blade Server Rack Alpha in Sector-01.',
      },
      {
        id: 'db_admin_note',
        name: 'Decryption Constraint Memo',
        type: 'NOTE_CLUE',
        x: 600,
        y: 380,
        width: 45,
        height: 40,
        icon: '📜',
        color: '#a855f7',
        description: 'A confidential memo regarding credential decryption constraints.',
        clueText: 'SECURITY VAULT MEMO: The 4-rune access code has no duplicates. The first symbol is either ◈ (Rhombus) or ▲ (Delta). The ★ (Star) rune is immediately followed by a 6-sided ⬡ (Hexagon). Cube is excluded.\n\nDEFAULT ROOT OVERRIDE PASSCODE: VAULT-9082-ROOT.',
      },
    ],
  },

  // ROOM 4: Backend API (Sector-04)
  // Door is on RIGHT -> Right half is 100% OPEN
  BACKEND_API: {
    id: 'BACKEND_API',
    name: 'Sector 4: Backend API & Microservice Hub',
    sectorCode: 'SECTOR-04',
    themeColor: '#10b981',
    accentColor: '#34d399',
    bgColor: '#05120c',
    description: 'Software development center with REST API testbenches, live code debuggers, and hardware developer workbench.',
    chambers: [
      { name: 'REST API Dispatch Terminal', code: 'CH-01', x: 40, y: 40, width: 340, height: 160, accentColor: '#10b981' },
      { name: 'Interactive Code Debugger Lab', code: 'CH-02', x: 420, y: 40, width: 340, height: 160, accentColor: '#34d399' },
      { name: 'Hardware Dev Testbench & Runway', code: 'CH-03', x: 40, y: 240, width: 720, height: 320, accentColor: '#059669' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Top divider wall and left alcove only (Right side is 100% wide open to the door!)
      { x: 395, y: 40, width: 10, height: 140 },
      { x: 40, y: 190, width: 220, height: 10 },
    ],
    doors: [
      {
        id: 'backend_to_hub',
        label: '➡️ RETURN TO CENTRAL HUB',
        x: 750,
        y: 250,
        width: 35,
        height: 100,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 100,
        spawnY: 300,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'api_workstation_dispatch',
        name: '[TASK 1: EASY] Handshake Sequencer Console',
        type: 'API_WORKSTATION',
        x: 200,
        y: 120,
        width: 85,
        height: 60,
        icon: '⚙️',
        color: '#10b981',
        description: 'Handshake pattern-pairing console. Apply cyclical ring rotation rules to match input tokens to partner glyphs.',
      },
      {
        id: 'api_debugger_console',
        name: '[TASK 2: MEDIUM] Arithmetic Code Debugger Terminal',
        type: 'CODE_DEBUGGER',
        x: 580,
        y: 120,
        width: 90,
        height: 65,
        icon: '🔢',
        color: '#34d399',
        description: 'Interactive arithmetic code debugger. Audit billing calculation arithmetic, locate the mathematical operator flaw, and apply the arithmetic patch.',
      },
      {
        id: 'api_hardware_workbench',
        name: 'Developer Workbench (74LS08 Logic IC)',
        type: 'SCAVENGER_PICKUP',
        x: 200,
        y: 380,
        width: 55,
        height: 50,
        icon: '📟',
        color: '#34d399',
        description: 'Electronics developer workbench with anti-static mat and IC component trays.',
        scavengerItemId: 'logic_ic',
        scavengerItemName: '74LS08 Quad AND Logic Gate IC',
        clueText: 'You searched the hardware component tray and collected the 74LS08 QUAD AND LOGIC GATE IC! Needed for the PCB Circuit Breadboard in Sector-02.',
      },
      {
        id: 'api_swagger_note',
        name: 'Handshake Rotational Rule Sheet',
        type: 'NOTE_CLUE',
        x: 600,
        y: 380,
        width: 45,
        height: 40,
        icon: '📜',
        color: '#10b981',
        description: 'Printed handshake rotation documentation sheet.',
        clueText: 'HANDSHAKE PROTOCOL: Standard tokens pair with the glyph exactly 2 steps CLOCKWISE (↷) along the perimeter ring. Inverted tokens (⚡) step 2 steps COUNTER-CLOCKWISE (↶).',
      },
    ],
  },

  // ROOM 5: Firewall Perimeter (Sector-05)
  // Door is on LEFT -> Left half is 100% OPEN
  FIREWALL_PERIMETER: {
    id: 'FIREWALL_PERIMETER',
    name: 'Sector 5: Firewall & SOC Perimeter',
    sectorCode: 'SECTOR-05',
    themeColor: '#ef4444',
    accentColor: '#f87171',
    bgColor: '#140608',
    description: 'Security Operations Center with real-time packet sniffers, rule editors, and secured hardware lockers.',
    chambers: [
      { name: 'SOC Live Packet Sniffer Station', code: 'CH-01', x: 40, y: 40, width: 340, height: 160, accentColor: '#ef4444' },
      { name: 'Perimeter Firewall ACL Station', code: 'CH-02', x: 420, y: 40, width: 340, height: 160, accentColor: '#f87171' },
      { name: 'Hardware Security Storage Bay & Runway', code: 'CH-03', x: 40, y: 240, width: 720, height: 320, accentColor: '#b91c1c' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Top divider wall and right alcove only (Left side is 100% wide open to the door!)
      { x: 395, y: 40, width: 10, height: 140 },
      { x: 540, y: 190, width: 220, height: 10 },
    ],
    doors: [
      {
        id: 'firewall_to_hub',
        label: '⬅️ RETURN TO CENTRAL HUB',
        x: 15,
        y: 250,
        width: 35,
        height: 100,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 700,
        spawnY: 300,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'soc_packet_sorter',
        name: '[TASK 1: EASY] Live Packet Sniffer & Threat Sorter',
        type: 'PACKET_SORTER',
        x: 200,
        y: 120,
        width: 90,
        height: 60,
        icon: '📡',
        color: '#ef4444',
        description: 'SOC live network traffic monitor. Inspect incoming packet headers and route malicious botnet/exploit payloads to QUARANTINE or legitimate traffic to PERMIT.',
      },
      {
        id: 'soc_firewall_console',
        name: '[TASK 2: MEDIUM] Spectral Filter Priority ACL Console',
        type: 'FIREWALL_CONSOLE',
        x: 580,
        y: 120,
        width: 90,
        height: 60,
        icon: '🛡️',
        color: '#f87171',
        description: 'Main perimeter firewall ruleset console. Order 5 spectral filter cards into top-down priority according to the filter directive memo.',
      },
      {
        id: 'soc_hardware_locker',
        name: 'SOC Tool Locker (100µF Capacitor)',
        type: 'SCAVENGER_PICKUP',
        x: 600,
        y: 380,
        width: 50,
        height: 55,
        icon: '🗄️',
        color: '#f87171',
        description: 'Reinforced metal locker storing network technician repair parts.',
        scavengerItemId: 'capacitor',
        scavengerItemName: '100µF 50V Electrolytic Capacitor',
        clueText: 'You unlocked the SOC maintenance locker and collected the 100µF 50V CAPACITOR! Needed for the PCB Circuit Breadboard in Sector-02.',
      },
      {
        id: 'soc_threat_bulletin',
        name: 'Filter Priority Directive Bulletin',
        type: 'NOTE_CLUE',
        x: 280,
        y: 380,
        width: 45,
        height: 40,
        icon: '📌',
        color: '#f87171',
        description: 'A priority directive pinned to the SOC notice board.',
        clueText: 'PERIMETER FILTER DIRECTIVE: 1. Emerald Matrix (◆ GREEN) takes Position 1. 2. Amber Flare (★ AMBER) must resolve immediately before Violet Void (■ PURPLE). 3. Crimson Prism (▲ RED) before Cobalt Wave (● BLUE). 4. Cobalt Wave cannot be in Position 5.',
      },
    ],
  },

  // ROOM 6: Cryptography Vault (Sector-06)
  // Door is on TOP -> Top is 100% OPEN
  CRYPTO_VAULT: {
    id: 'CRYPTO_VAULT',
    name: 'Sector 6: Cryptography Vault & Cipher Sanctuary',
    sectorCode: 'SECTOR-06',
    themeColor: '#6366f1',
    accentColor: '#818cf8',
    bgColor: '#080a14',
    description: 'Divided cryptographic sanctum featuring the Cipher Wheel Alcove, Enigma Plugboard Study, Records Closet, and Secured Safe Chamber.',
    chambers: [
      { name: 'Cipher Concourse & Entrance', code: 'CH-01', x: 40, y: 40, width: 720, height: 260, accentColor: '#6366f1' },
      { name: 'Cryptographic Records Closet', code: 'CH-02', x: 40, y: 340, width: 340, height: 220, accentColor: '#4f46e5' },
      { name: 'Reinforced Vault Safe Chamber', code: 'CH-03', x: 420, y: 340, width: 340, height: 220, accentColor: '#a5b4fc' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Bottom partition walls only (Top entrance is 100% wide open!)
      { x: 40, y: 320, width: 220, height: 10 },
      { x: 540, y: 320, width: 220, height: 10 },
      { x: 395, y: 340, width: 10, height: 220 },
    ],
    doors: [
      {
        id: 'crypto_to_hub',
        label: '⬆️ RETURN TO CENTRAL HUB',
        x: 340,
        y: 15,
        width: 120,
        height: 35,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 220,
        spawnY: 480,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'crypto_wheel_terminal',
        name: '[TASK 1: EASY] Rotary Symbol Substitution Wheel Console',
        type: 'CRYPTO_SAFE',
        x: 200,
        y: 160,
        width: 85,
        height: 60,
        icon: '🔑',
        color: '#6366f1',
        description: 'Concentric symbol substitution pedestal. Rotate inner wheel to align anchor glyphs (Star under Hexagon) to unlock the mechanism.',
      },
      {
        id: 'crypto_enigma_plugboard',
        name: '[TASK 2: MEDIUM] Enigma Hardware Plugboard Console',
        type: 'ENIGMA_PLUGBOARD',
        x: 580,
        y: 160,
        width: 90,
        height: 60,
        icon: '🎛️',
        color: '#818cf8',
        description: 'Rotary Enigma plugboard unit. Connect jumper pairs (A-X, Q-M, D-T, L-R) to match hash matrix.',
      },
      {
        id: 'crypto_torn_note',
        name: 'Anchor Glyph Alignment Memo',
        type: 'NOTE_CLUE',
        x: 200,
        y: 430,
        width: 45,
        height: 40,
        icon: '📜',
        color: '#818cf8',
        description: 'A parchment memo tucked under the heavy filing shelf.',
        clueText: 'ALIGNMENT SPECIFICATION: Rotate the inner symbol disc until the inner ★ (STAR) aligns directly under the outer ⬡ (HEXAGON). Mechanical locks will engage.',
      },
      {
        id: 'crypto_physical_safe',
        name: 'Titanium Cryptographic Safe (Token Certificate)',
        type: 'SCAVENGER_PICKUP',
        x: 580,
        y: 430,
        width: 65,
        height: 70,
        icon: '🗝️',
        color: '#4f46e5',
        description: 'Reinforced cryptographic safe holding authorization token certificates.',
        scavengerItemId: 'token_cert',
        scavengerItemName: 'Clean API Token Certificate',
        clueText: 'You cracked the mechanical safe and retrieved the CLEAN API TOKEN CERTIFICATE! Needed to authorize the microservice gateway in Sector-04.',
      },
    ],
  },

  // ROOM 7: Forensics Lab (Sector-07)
  // Door is on TOP -> Top is 100% OPEN
  FORENSICS_LAB: {
    id: 'FORENSICS_LAB',
    name: 'Sector 7: Digital Forensics Incident Lab',
    sectorCode: 'SECTOR-07',
    themeColor: '#14b8a6',
    accentColor: '#2dd4bf',
    bgColor: '#051010',
    description: 'Evidence examination lab with incident timeline scrubbers, PCAP stream reconstructor bay, and secure evidence lockers.',
    chambers: [
      { name: 'Forensic Concourse & Entrance', code: 'CH-01', x: 40, y: 40, width: 720, height: 260, accentColor: '#14b8a6' },
      { name: 'PCAP Packet Reconstructor Bay', code: 'CH-02', x: 40, y: 340, width: 340, height: 220, accentColor: '#2dd4bf' },
      { name: 'Secured Evidence & Archive Locker', code: 'CH-03', x: 420, y: 340, width: 340, height: 220, accentColor: '#0d9488' },
    ],
    walls: [
      { x: 0, y: 0, width: 800, height: 40 },
      { x: 0, y: 560, width: 800, height: 40 },
      { x: 0, y: 0, width: 40, height: 600 },
      { x: 760, y: 0, width: 40, height: 600 },
      // Bottom partition walls only (Top entrance is 100% wide open!)
      { x: 40, y: 320, width: 220, height: 10 },
      { x: 540, y: 320, width: 220, height: 10 },
      { x: 395, y: 340, width: 10, height: 220 },
    ],
    doors: [
      {
        id: 'forensics_to_hub',
        label: '⬆️ RETURN TO CENTRAL HUB',
        x: 340,
        y: 15,
        width: 120,
        height: 35,
        targetRoomId: 'CENTRAL_HUB',
        spawnX: 580,
        spawnY: 480,
        isLocked: false,
      },
    ],
    objects: [
      {
        id: 'forensics_timeline_workstation',
        name: '[TASK 1: EASY] Trace Corrupted Entries Workstation',
        type: 'FORENSICS_BOARD',
        x: 200,
        y: 160,
        width: 85,
        height: 60,
        icon: '🗺️',
        color: '#14b8a6',
        description: 'Visual trace pattern analyzer. Inspect the 8 diagnostic records and isolate the 3 corrupted entries that violate sequence harmony.',
      },
      {
        id: 'forensics_pcap_reconstruct',
        name: '[TASK 2: MEDIUM] PCAP Packet Stream Flow Reconstructor',
        type: 'PCAP_RECONSTRUCT',
        x: 580,
        y: 160,
        width: 90,
        height: 60,
        icon: '📊',
        color: '#2dd4bf',
        description: 'PCAP packet timeline reconstructor. Reorder Handshake, TLS Negotiation, and Data Exfiltration into sequence.',
      },
      {
        id: 'forensics_corkboard_photo',
        name: 'Sequence Harmony Rule Memo',
        type: 'NOTE_CLUE',
        x: 200,
        y: 430,
        width: 50,
        height: 45,
        icon: '📌',
        color: '#2dd4bf',
        description: 'Evidence board pinned with diagnostic rules and photos.',
        clueText: 'TRACE HARMONY DIRECTIVE: 1. Shape alternates: ▲ (Delta) on odd indices, ■ (Cube) on even indices. 2. Vector strictly points ➔ (Right). 3. Node count must be EVEN (2, 4, 6). Flag the 3 entries that violate this.',
      },
      {
        id: 'forensics_evidence_locker',
        name: 'Secured Evidence Locker (NVMe Storage Blade)',
        type: 'SCAVENGER_PICKUP',
        x: 600,
        y: 430,
        width: 55,
        height: 55,
        icon: '🗄️',
        color: '#0d9488',
        description: 'Locker storing digital forensics disk images and hardware storage blades.',
        scavengerItemId: 'nvme',
        scavengerItemName: 'M.2 NVMe PCIE Storage Blade',
        clueText: 'You opened the forensics evidence locker and collected the M.2 NVMe PCIE STORAGE BLADE! Needed to repair Blade Server Rack Alpha in Sector-01.',
      },
    ],
  },
};
