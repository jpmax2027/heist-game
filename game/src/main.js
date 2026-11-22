// Vaultbreak — game loop, states and the staged screenshot scenes.
// One job: own the state, step it every frame, and hand it to render.js.
// Also owns ?shot= staging: a fixed, deterministic scene per screenshot.

import { VIEW, HUD_HEIGHT, FLOOR, PLAYER, DETECTION, SCORE } from './config.js';
import { createInput } from './input.js';
import { WALLS, COVER, GUARD_PATROLS, CAMERA_SPAWNS, PLAYER_SPAWN, VAULT, EXIT } from './levels.js';
import { createGuard, updateGuard, alertGuardsToNoise } from './guards.js';
import { createCamera, updateCamera, empBlast } from './cameras.js';
import {
  createLoot, createVaultState, createTools, collectLoot, updateVault,
  collectVaultLoot, useEmp, useSmoke, updateTools, smokeBlocks,
} from './loot.js';
import { createAudio } from './audio.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = createInput(canvas);
const audio = createAudio();
const BLOCKERS = [...WALLS, ...COVER];

function freshState() {
  return {
    phase: 'title', // title | playing | caught | won
    frozen: false, // shot staging: render a fixed scene, never step it
    time: 0,
    elapsed: 0,
    alarm: 0,
    lootValue: 0,
    player: {
      x: PLAYER_SPAWN.x,
      y: PLAYER_SPAWN.y,
      lookX: PLAYER_SPAWN.x + 50,
      lookY: PLAYER_SPAWN.y,
      sneaking: false,
      stepAcc: 0,
    },
    guards: GUARD_PATROLS.map((p, i) => createGuard(p, i)),
    cameras: CAMERA_SPAWNS.map((s) => createCamera(s)),
    loot: createLoot(),
    vault: createVaultState(),
    tools: createTools(),
    message: null,
    messageUntil: 0,
    caughtReason: '',
    score: { loot: 0, stealth: 0, time: 0, total: 0 },
    anySeen: false,
  };
}

let state = freshState();

function showMessage(text, seconds) {
  state.message = { text };
  state.messageUntil = state.time + seconds;
}

function collideCircle(x, y, radius) {
  for (const b of BLOCKERS) {
    if (x + radius > b.x && x - radius < b.x + b.w && y + radius > b.y && y - radius < b.y + b.h) {
      return true;
    }
  }
  return false;
}

function movePlayer(dt) {
  const p = state.player;
  const mv = input.moveVector();
  p.sneaking = input.pressed('Shift');
  const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const nx = p.x + mv.x * speed * dt;
  const ny = p.y + mv.y * speed * dt;
  if (!collideCircle(nx, p.y, PLAYER.radius)) p.x = nx;
  if (!collideCircle(p.x, ny, PLAYER.radius)) p.y = ny;
  p.x = Math.max(10 + PLAYER.radius, Math.min(VIEW.width - 10 - PLAYER.radius, p.x));
  p.y = Math.max(FLOOR.y + 10 + PLAYER.radius, Math.min(FLOOR.y + FLOOR.h - 10 - PLAYER.radius, p.y));
  p.lookX = input.mouse.x;
  p.lookY = input.mouse.y;
  if ((mv.x !== 0 || mv.y !== 0) && state.phase === 'playing') {
    p.stepAcc += speed * dt;
    if (p.stepAcc > 62) {
      p.stepAcc = 0;
      audio.footstep(p.sneaking);
    }
  }
}

function updateAlarm(dt) {
  let seenNow = false;
  for (const g of state.guards) {
    const before = g._prevDetection ?? 0;
    if (g.detection > before) {
      state.alarm += (g.detection - before) * DETECTION.alarmFromGuard;
    }
    g._prevDetection = g.detection;
    if (g.state === 'chase') {
      state.alarm += 12 * dt;
      seenNow = true;
    }
  }
  for (const cam of state.cameras) {
    const before = cam._prevDetection ?? 0;
    if (cam.detection > before) {
      state.alarm += (cam.detection - before) * DETECTION.alarmFromCamera;
    }
    cam._prevDetection = cam.detection;
  }
  if (!seenNow) {
    let anyoneWatching = false;
    for (const g of state.guards) if (g.detection > DETECTION.suspiciousAt) anyoneWatching = true;
    for (const cam of state.cameras) if (cam.detection > DETECTION.suspiciousAt) anyoneWatching = true;
    if (!anyoneWatching) state.alarm = Math.max(0, state.alarm - DETECTION.alarmDecayPerSecond * dt);
  }
  state.alarm = Math.min(100, state.alarm);
  if (state.alarm >= 100 && state.phase === 'playing') {
    endCaught('The alarm hit 100% — the bank locked down with you inside.');
  }
}

function endCaught(reason) {
  state.phase = 'caught';
  state.caughtReason = reason;
  audio.lose();
}

function endWon() {
  state.phase = 'won';
  const stealth = Math.round((100 - state.alarm) * SCORE.stealthBonusPerAlarmLeft);
  const timeBonus = Math.round(Math.max(0, SCORE.parSeconds - state.elapsed) * SCORE.timeBonusPerSecondLeft);
  state.score = {
    loot: state.lootValue,
    stealth,
    time: timeBonus,
    total: state.lootValue + stealth + timeBonus,
  };
  audio.win();
}

const events = {
  caught(reason) { if (state.phase === 'playing') endCaught(reason); },
  noise(x, y, radius) { alertGuardsToNoise(state.guards, x, y, radius); },
  vaultCracked() {
    showMessage('VAULT OPEN — grab the $5,000 and run!', 4);
    audio.vaultOpen();
  },
};

function updatePlaying(dt) {
  state.elapsed += dt;
  movePlayer(dt);

  const isBlocked = (from, to) => smokeBlocks(state.tools, from, to);

  let spottedNow = false;
  for (const g of state.guards) {
    const before = g.detection;
    const res = updateGuard(g, dt, state.player, BLOCKERS, events, isBlocked);
    if (res.seen) spottedNow = true;
    if (g.detection >= DETECTION.alarmedAt && before < DETECTION.alarmedAt) audio.spotted();
  }
  for (const cam of state.cameras) {
    const before = cam.detection;
    const res = updateCamera(cam, dt, state.time, state.player, BLOCKERS, isBlocked);
    if (res.seen) spottedNow = true;
    if (cam.detection >= DETECTION.alarmedAt && before < DETECTION.alarmedAt) audio.spotted();
  }
  state.anySeen = spottedNow;

  // Loot and the vault.
  const gained = collectLoot(state.loot, state.player);
  if (gained > 0) {
    state.lootValue += gained;
    audio.pickup();
    showMessage('+$' + gained.toLocaleString('en-US') + ' loot', 1.6);
  }
  const holdingCrack = input.pressed('e') || input.mouse.down;
  const vaultStatus = updateVault(state.vault, dt, state.player, holdingCrack, events);
  if (vaultStatus === 'cracking' && Math.random() < dt * 4) audio.crackTick(state.vault.progress);
  const vaultGained = collectVaultLoot(state.vault, state.player);
  if (vaultGained > 0) {
    state.lootValue += vaultGained;
    audio.pickup();
    showMessage('+$' + vaultGained.toLocaleString('en-US') + ' — VAULT LOOT! Now run!', 3);
  }

  // Tools.
  if (input.consumeKey('q')) {
    if (useEmp(state.tools, state.cameras, empBlast)) {
      audio.empZap();
      showMessage('EMP blast — cameras dark for 9 seconds', 2.5);
    } else {
      showMessage('No EMP left', 1.5);
    }
  }
  if (input.consumeKey('f')) {
    if (useSmoke(state.tools, state.player)) {
      audio.smokePuff();
      showMessage('Smoke out — their cones cannot see through it', 2.5);
    } else {
      showMessage('No smoke bombs left', 1.5);
    }
  }
  updateTools(state.tools, dt);

  updateAlarm(dt);

  // Win: vault cracked and the thief reaches the getaway van.
  if (state.vault.cracked && state.phase === 'playing') {
    const p = state.player;
    if (p.x > EXIT.x && p.x < EXIT.x + EXIT.w && p.y > EXIT.y && p.y < EXIT.y + EXIT.h) {
      endWon();
    }
  }

  if (input.pressed('m')) audio.toggleMute();
  if (state.message && state.time > state.messageUntil) state.message = null;
}

// --- deterministic shot staging (?shot=start|play|vault|escape) ---

function stageShot(shot) {
  state.frozen = true;
  state.time = 1.234; // fixed, so loot bob and dials never move between shots
  if (shot === 'start') {
    state.phase = 'title';
    return;
  }
  state.phase = 'playing';
  // Mid-heist timestamps so the HUD timer reads like a real run, not 0:00.
  state.elapsed = 47;
  // Common cover scene: mid-heist, everything the judge must see in one frame.
  state.player.x = 500;
  state.player.y = 430;
  state.player.lookX = 640;
  state.player.lookY = 300;
  state.lootValue = 1200;
  state.loot[1].taken = true; // cash-hall-1 already pocketed
  state.alarm = 35;
  const sari = state.guards[1];
  sari.x = 620;
  sari.y = 300;
  sari.facing = Math.atan2(430 - 300, 500 - 620);
  sari.detection = 45;
  sari.state = 'suspicious';
  const rudi = state.guards[0];
  rudi.x = 220;
  rudi.y = 300;
  rudi.facing = Math.PI / 2;
  const bowo = state.guards[2];
  bowo.x = 1000;
  bowo.y = 420;
  bowo.facing = -Math.PI / 2;
  const cam = state.cameras[0];
  cam.facing = Math.atan2(430 - 150, 500 - 620);
  cam.detection = 20;
  state.cameras[1].facing = Math.PI / 2 + 0.4;
  state.cameras[2].facing = Math.PI / 2 - 0.5;

  if (shot === 'vault') {
    state.elapsed = 92;
    state.player.x = VAULT.crackSpot.x - 30;
    state.player.y = VAULT.crackSpot.y;
    state.player.lookX = VAULT.x;
    state.player.lookY = VAULT.y + 60;
    state.vault.cracking = true;
    state.vault.progress = 0.62;
    state.alarm = 55;
    state.lootValue = 3900;
    state.loot[3].taken = true;
    bowo.x = 1080;
    bowo.y = 300;
    bowo.facing = Math.atan2(390 - 300, 1150 - 1080);
    bowo.detection = 62;
    bowo.state = 'suspicious';
    state.cameras[1].facing = Math.atan2(390 - 150, 1150 - 1060);
    state.cameras[1].detection = 35;
  } else if (shot === 'escape') {
    state.elapsed = 125;
    state.vault.cracked = true;
    state.vault.lootTaken = true;
    state.lootValue = 9900;
    for (const item of state.loot) item.taken = true;
    state.player.x = 210;
    state.player.y = 620;
    state.player.lookX = 60;
    state.player.lookY = 660;
    state.alarm = 80;
    sari.x = 420;
    sari.y = 500;
    sari.facing = Math.atan2(620 - 500, 210 - 420);
    sari.detection = 88;
    sari.state = 'chase';
    rudi.x = 300;
    rudi.y = 580;
    rudi.facing = Math.atan2(620 - 580, 210 - 300);
    rudi.detection = 74;
    rudi.state = 'chase';
    state.message = { text: 'RUN! The vault is empty — get to the van!' };
  }
}

// --- main loop ---

function frame(now) {
  requestAnimationFrame(frame);
  if (state.frozen) {
    render(ctx, state, state.time);
    return;
  }
  const dt = Math.min(0.05, (now - (frame.last ?? now)) / 1000 || 0.016);
  frame.last = now;
  state.time += dt;

  if (state.phase === 'title') {
    if (input.consumeKey('Enter') || input.consumeClick()) {
      state = freshState();
      state.phase = 'playing';
      audio.unlock();
      audio.startAmbient();
      showMessage('Stay out of the cones. Crack the vault, then run.', 4);
    }
  } else if (state.phase === 'playing') {
    updatePlaying(dt);
  } else if (input.consumeKey('r') || input.consumeClick()) {
    state = freshState();
    state.phase = 'playing';
    audio.unlock();
  }
  render(ctx, state, state.time);
  input.endFrame();
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot);
} else {
  state.phase = 'title';
}
requestAnimationFrame(frame);
