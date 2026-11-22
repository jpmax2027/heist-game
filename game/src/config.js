// Vaultbreak — tuning constants, colours and balance numbers.
// One job: every magic number the rest of the game shares lives here.
export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 64;
export const FLOOR = { x: 0, y: HUD_HEIGHT, w: 1280, h: 720 - HUD_HEIGHT };

// Player
export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 105,
  lootCarryMax: 99999,
};

// Detection and alarm
export const DETECTION = {
  coneHalfAngle: 0.62, // radians, about 35 degrees each side
  guardRange: 210,
  cameraRange: 230,
  risePerSecond: 55, // while fully seen by a guard
  cameraRisePerSecond: 70,
  fallPerSecond: 26,
  suspiciousAt: 30,
  alarmedAt: 70,
  chaseAt: 62,
  alarmFromGuard: 0.55, // alarm points gained per detection point
  alarmFromCamera: 0.75,
  alarmDecayPerSecond: 2.5,
};

// Guards
export const GUARD = {
  radius: 13,
  patrolSpeed: 62,
  chaseSpeed: 132,
  investigateSpeed: 95,
  catchDistance: 26,
};

// Vault and loot
export const VAULT = {
  crackSeconds: 3.2,
  crackNoiseRadius: 260,
  bigLootValue: 5000,
};
export const TOOLS = {
  empDurationSeconds: 9,
  smokeDurationSeconds: 7,
  smokeRadius: 110,
};

// Colours — midnight bank: deep blue floor, brass gold loot, danger in amber/red.
export const COLORS = {
  floorLobby: '#1d2733',
  floorHall: '#232c3d',
  floorVault: '#2a2438',
  floorVent: '#141c26',
  wall: '#4a5870',
  wallEdge: '#7d8fb0',
  carpet: '#3a2f4d',
  desk: '#33544a',
  plant: '#2c4a34',
  player: '#ffd166',
  playerRing: '#fff3c4',
  guard: '#e4572e',
  guardCalm: '#f0a35e',
  camera: '#9fb4d8',
  lootCash: '#7ee787',
  lootGold: '#ffd700',
  lootJewel: '#7dd3fc',
  vaultDoor: '#b8c4d8',
  vaultGlow: '#ffe08a',
  exit: '#4ade80',
  coneCalm: 'rgba(255, 209, 102, 0.20)',
  coneSuspicious: 'rgba(255, 140, 66, 0.28)',
  coneAlarmed: 'rgba(239, 68, 68, 0.34)',
  cameraCone: 'rgba(125, 211, 252, 0.20)',
  cameraConeHot: 'rgba(239, 68, 68, 0.30)',
  smoke: 'rgba(203, 213, 225, 0.55)',
  hudBg: '#0d1420',
  hudText: '#e8eef7',
  hudDim: '#8b9bb4',
  alarmLow: '#4ade80',
  alarmMid: '#f59e0b',
  alarmHigh: '#ef4444',
};

// Scoring
export const SCORE = {
  stealthBonusPerAlarmLeft: 12,
  timeBonusPerSecondLeft: 5,
  parSeconds: 240,
};
