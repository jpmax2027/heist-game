// Vaultbreak — the Meridian Bank floor plan.
// One job: describe the rooms, walls, doors, cover, loot spawns, guard
// patrols, cameras, the vault and the exit. Nothing here moves; the other
// modules read this map and animate it.

import { FLOOR } from './config.js';

// Every wall is an axis-aligned rectangle {x, y, w, h} in floor coordinates.
// Gaps between walls are the doors. The vent is a narrow corridor along the
// top edge that links the lobby to the vault room, bypassing the main hall.
export const WALLS = [
  // Outer shell (top edge leaves the vent corridor open inside it).
  { x: 0, y: FLOOR.y, w: 1280, h: 10 },
  { x: 0, y: FLOOR.y + FLOOR.h - 10, w: 1280, h: 10 },
  { x: 0, y: FLOOR.y, w: 10, h: FLOOR.h },
  { x: 1270, y: FLOOR.y, w: 10, h: FLOOR.h },
  // Lobby | hall divider, with a wide door in the middle. Starts below the
  // vent corridor so the vent passes over it.
  { x: 358, y: 138, w: 14, h: 126 },
  { x: 358, y: FLOOR.y + 330, w: 14, h: 316 },
  // Hall | vault divider, door near the bottom and a second door near top.
  { x: 858, y: 138, w: 14, h: 116 },
  { x: 858, y: FLOOR.y + 250, w: 14, h: 190 },
  { x: 858, y: FLOOR.y + 540, w: 14, h: 106 },
  // Vent corridor floor (the vent runs y 74..128, above the hall).
  // Gaps at x 280..340 (climb in from the lobby) and x 942..1010 (drop into
  // the vault room); sealed over the hall so it is a real alternate route.
  { x: 10, y: 128, w: 270, h: 10 },
  { x: 340, y: 128, w: 518, h: 10 },
  { x: 872, y: 128, w: 70, h: 10 },
  { x: 1010, y: 128, w: 260, h: 10 },
  // Teller counter row in the hall (cover you can crouch behind).
  { x: 430, y: 330, w: 340, h: 22 },
  // Vault-room partition, leaves a choke point at the vault door.
  { x: 1000, y: 300, w: 14, h: 180 },
  // Pillars in the hall.
  { x: 560, y: 480, w: 26, h: 26 },
  { x: 700, y: 180, w: 26, h: 26 },
];

// Cover objects block movement and line of sight, but are lower than walls.
export const COVER = [
  { x: 90, y: 250, w: 110, h: 46, kind: 'desk' },
  { x: 90, y: 470, w: 110, h: 46, kind: 'desk' },
  { x: 470, y: 150, w: 90, h: 40, kind: 'desk' },
  { x: 640, y: 540, w: 110, h: 44, kind: 'desk' },
  { x: 950, y: 180, w: 96, h: 42, kind: 'desk' },
  { x: 1080, y: 520, w: 100, h: 44, kind: 'desk' },
  { x: 300, y: 600, w: 34, h: 34, kind: 'plant' },
  { x: 820, y: 620, w: 34, h: 34, kind: 'plant' },
  { x: 1180, y: 120, w: 34, h: 34, kind: 'plant' },
];

// Loot: cash stacks, gold bars, jewel cases. `taken` flips at runtime.
export const LOOT_SPAWNS = [
  { id: 'cash-lobby', x: 150, y: 180, kind: 'cash', value: 400 },
  { id: 'cash-hall-1', x: 500, y: 300, kind: 'cash', value: 600 },
  { id: 'cash-hall-2', x: 760, y: 600, kind: 'cash', value: 600 },
  { id: 'gold-hall', x: 620, y: 180, kind: 'gold', value: 1500 },
  { id: 'jewel-vault', x: 1150, y: 220, kind: 'jewel', value: 2000 },
  { id: 'cash-vault', x: 1150, y: 480, kind: 'cash', value: 800 },
];

export const VAULT = {
  x: 1210, y: 330, w: 56, h: 120,
  crackSpot: { x: 1180, y: 390 },
  lootValue: 5000,
};

export const EXIT = { x: 24, y: 640, w: 90, h: 56, label: 'GETAWAY VAN' };

// Guard patrols: waypoint loops, one per guard.
export const GUARD_PATROLS = [
  {
    name: 'Rudi',
    waypoints: [
      { x: 120, y: 180 }, { x: 300, y: 180 }, { x: 300, y: 560 }, { x: 120, y: 560 },
    ],
    pauseSeconds: 1.6,
  },
  {
    name: 'Sari',
    waypoints: [
      { x: 460, y: 200 }, { x: 800, y: 200 }, { x: 800, y: 470 }, { x: 460, y: 470 },
    ],
    pauseSeconds: 1.2,
  },
  {
    name: 'Bowo',
    waypoints: [
      { x: 900, y: 520 }, { x: 1080, y: 520 }, { x: 1080, y: 200 }, { x: 900, y: 200 },
    ],
    pauseSeconds: 2.0,
  },
];

// CCTV cameras: fixed mount just below the vent floor, cone sweeps between two angles.
export const CAMERA_SPAWNS = [
  { id: 'cam-hall', x: 620, y: 150, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.45 },
  { id: 'cam-vault', x: 1060, y: 150, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.6 },
  { id: 'cam-lobby', x: 180, y: 150, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.4 },
];

export const PLAYER_SPAWN = { x: 70, y: 580 };

// Room labels painted on the floor, for readability at a glance.
export const ROOM_LABELS = [
  { x: 180, y: 110, text: 'LOBBY' },
  { x: 615, y: 110, text: 'MAIN HALL' },
  { x: 1065, y: 110, text: 'VAULT ROOM' },
  { x: 640, y: 78, text: 'VENT' },
];
