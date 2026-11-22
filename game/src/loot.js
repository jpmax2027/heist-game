// Vaultbreak — loot, the vault crack and the thief's tools.
// One job: what can be picked up, how the vault opens, and what the EMP
// and smoke bomb do. No rendering here; render.js draws the state.

import { VAULT, TOOLS } from './config.js';
import { LOOT_SPAWNS, VAULT as VAULT_DEF } from './levels.js';

export function createLoot() {
  return LOOT_SPAWNS.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    kind: s.kind,
    value: s.value,
    taken: false,
    bobPhase: Math.random() * Math.PI * 2,
  }));
}

export function createVaultState() {
  return {
    cracked: false,
    cracking: false,
    progress: 0, // 0..1 while the thief holds the crack
    lootTaken: false,
    noiseCooldown: 0,
  };
}

export function createTools() {
  return {
    emp: 1,
    smoke: 1,
    empActiveLeft: 0,
    smokeActiveLeft: 0,
    smokeX: 0,
    smokeY: 0,
  };
}

// Pick up loot the thief walks over. Returns the value collected this tick.
export function collectLoot(loot, player) {
  let gained = 0;
  for (const item of loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - player.x, item.y - player.y) < 30) {
      item.taken = true;
      gained += item.value;
    }
  }
  return gained;
}

// Hold-to-crack: the thief must stand at the crack spot and hold E (or the
// mouse button). Returns 'cracking' | 'cracked' | 'idle'.
export function updateVault(vault, dt, player, holding, events) {
  const spot = VAULT_DEF.crackSpot;
  const near = Math.hypot(spot.x - player.x, spot.y - player.y) < 64;
  if (vault.cracked) return 'cracked';
  if (near && holding) {
    vault.cracking = true;
    vault.progress += dt / VAULT.crackSeconds;
    vault.noiseCooldown -= dt;
    if (vault.noiseCooldown <= 0) {
      vault.noiseCooldown = 1.1;
      events.noise(VAULT_DEF.crackSpot.x, VAULT_DEF.crackSpot.y, VAULT.crackNoiseRadius);
    }
    if (vault.progress >= 1) {
      vault.cracked = true;
      vault.cracking = false;
      events.vaultCracked();
      return 'cracked';
    }
    return 'cracking';
  }
  vault.cracking = false;
  vault.progress = Math.max(0, vault.progress - dt * 0.25);
  return 'idle';
}

// Take the vault's big loot once it is cracked.
export function collectVaultLoot(vault, player) {
  if (!vault.cracked || vault.lootTaken) return 0;
  const spot = VAULT_DEF.crackSpot;
  if (Math.hypot(spot.x - player.x, spot.y - player.y) < 70) {
    vault.lootTaken = true;
    return VAULT_DEF.lootValue;
  }
  return 0;
}

// Fire the EMP: one use, cameras go dark for the tool's duration.
export function useEmp(tools, cameras, empBlast) {
  if (tools.emp <= 0) return false;
  tools.emp -= 1;
  tools.empActiveLeft = TOOLS.empDurationSeconds;
  empBlast(cameras, TOOLS.empDurationSeconds);
  return true;
}

// Drop a smoke bomb at the thief's feet: vision cannot cross the cloud.
export function useSmoke(tools, player) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.smokeActiveLeft = TOOLS.smokeDurationSeconds;
  tools.smokeX = player.x;
  tools.smokeY = player.y;
  return true;
}

export function updateTools(tools, dt) {
  tools.empActiveLeft = Math.max(0, tools.empActiveLeft - dt);
  tools.smokeActiveLeft = Math.max(0, tools.smokeActiveLeft - dt);
}

// Smoke blocks sight when the sight line passes through the cloud.
export function smokeBlocks(tools, from, to) {
  if (tools.smokeActiveLeft <= 0) return false;
  const cx = tools.smokeX;
  const cy = tools.smokeY;
  const r = TOOLS.smokeRadius;
  // Segment-to-point distance test against the cloud's centre.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - from.x) * dx + (cy - from.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = from.x + dx * t;
  const py = from.y + dy * t;
  return Math.hypot(cx - px, cy - py) < r;
}
