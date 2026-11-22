// Vaultbreak — every pixel the game draws.
// One job: turn the game state into the canvas. No game logic lives here;
// main.js owns the state, this file only paints it.

import { COLORS, DETECTION, FLOOR, HUD_HEIGHT, VIEW } from './config.js';
import { WALLS, COVER, VAULT, EXIT, ROOM_LABELS } from './levels.js';

function conePath(ctx, x, y, facing, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill) {
  conePath(ctx, x, y, facing, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, time) {
  // Three rooms, three floor tints, so the layout reads at a glance.
  ctx.fillStyle = COLORS.floorLobby;
  ctx.fillRect(0, FLOOR.y, 372, FLOOR.h);
  ctx.fillStyle = COLORS.floorHall;
  ctx.fillRect(372, FLOOR.y, 500, FLOOR.h);
  ctx.fillStyle = COLORS.floorVault;
  ctx.fillRect(872, FLOOR.y, 408, FLOOR.h);
  // Vent corridor: darker strip along the top.
  ctx.fillStyle = COLORS.floorVent;
  ctx.fillRect(0, FLOOR.y + 10, 1280, 54);
  // Carpet runners in the hall.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(430, 400, 380, 90);
  ctx.fillRect(940, 400, 260, 90);
  void time;
}

// Room labels, painted after the walls so no wall line strikes through them.
function drawRoomLabels(ctx) {
  ctx.fillStyle = 'rgba(232, 238, 247, 0.20)';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const label of ROOM_LABELS) {
    ctx.fillText(label.text, label.x, label.y + 30);
  }
}

function drawWallsAndCover(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
  for (const c of COVER) {
    ctx.fillStyle = c.kind === 'plant' ? COLORS.plant : COLORS.desk;
    roundRect(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 238, 247, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (c.kind === 'plant') {
      ctx.fillStyle = '#4a7a58';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.bobPhase) * 3;
    const y = item.y + bob;
    // Glow so loot is obvious at a glance.
    ctx.beginPath();
    ctx.arc(item.x, y, 20 + Math.sin(time * 3 + item.bobPhase) * 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
    ctx.fill();
    if (item.kind === 'cash') {
      ctx.fillStyle = COLORS.lootCash;
      ctx.fillRect(item.x - 11, y - 7, 22, 14);
      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', item.x, y + 4);
    } else if (item.kind === 'gold') {
      ctx.fillStyle = COLORS.lootGold;
      ctx.beginPath();
      ctx.moveTo(item.x - 11, y + 7);
      ctx.lineTo(item.x - 7, y - 7);
      ctx.lineTo(item.x + 7, y - 7);
      ctx.lineTo(item.x + 11, y + 7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.lootJewel;
      ctx.save();
      ctx.translate(item.x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(232, 238, 247, 0.85)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$' + item.value, item.x, y + 26);
  }
}

function drawVault(ctx, vault, time) {
  const v = VAULT;
  ctx.fillStyle = '#3d4a63';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.fillStyle = vault.cracked ? COLORS.vaultGlow : COLORS.vaultDoor;
  roundRect(ctx, v.x + 6, v.y + 6, v.w - 12, v.h - 12, 8);
  ctx.fill();
  // Vault dial.
  ctx.fillStyle = '#1d2733';
  ctx.beginPath();
  ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.vaultGlow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(v.x + v.w / 2, v.y + v.h / 2);
  const dialAngle = vault.cracked ? 2.2 : time * 0.8;
  ctx.lineTo(
    v.x + v.w / 2 + Math.cos(dialAngle) * 16,
    v.y + v.h / 2 + Math.sin(dialAngle) * 16,
  );
  ctx.stroke();
  ctx.fillStyle = '#0d1420';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', v.x + v.w / 2, v.y - 10);
  if (vault.cracked && !vault.lootTaken) {
    ctx.fillStyle = COLORS.lootGold;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('★ $5,000 inside — grab it!', VIEW.width - 12, v.y + v.h + 22);
    ctx.textAlign = 'center';
  }
  // Crack progress ring at the crack spot.
  if (vault.cracking) {
    const s = VAULT.crackSpot;
    ctx.strokeStyle = 'rgba(255, 224, 138, 0.9)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 30, -Math.PI / 2, -Math.PI / 2 + vault.progress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.vaultGlow;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('CRACKING… ' + Math.round(vault.progress * 100) + '%', VIEW.width - 12, s.y - 40);
    ctx.textAlign = 'center';
  } else if (!vault.cracked) {
    const s = VAULT.crackSpot;
    ctx.fillStyle = 'rgba(232, 238, 247, 0.75)';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Hold E here to crack the vault', VIEW.width - 12, s.y - 40);
    ctx.textAlign = 'center';
  }
}

function drawExit(ctx, vaultCracked) {
  ctx.fillStyle = vaultCracked ? COLORS.exit : '#2c4a34';
  roundRect(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 8);
  ctx.fill();
  ctx.strokeStyle = vaultCracked ? '#bbf7d0' : 'rgba(232, 238, 247, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = vaultCracked ? '#052e16' : 'rgba(232, 238, 247, 0.6)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + 24);
  ctx.fillText('VAN', EXIT.x + EXIT.w / 2, EXIT.y + 40);
}

function guardConeColor(detection) {
  if (detection >= DETECTION.alarmedAt) return COLORS.coneAlarmed;
  if (detection >= DETECTION.suspiciousAt) return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    drawCone(ctx, g.x, g.y, g.facing, DETECTION.coneHalfAngle, DETECTION.guardRange, guardConeColor(g.detection));
    // Body: uniformed guard with a cap brim pointing where he looks.
    ctx.fillStyle = g.state === 'chase' ? '#ef4444' : COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d2733';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * 7, g.y + Math.sin(g.facing) * 7, 5, 0, Math.PI * 2);
    ctx.fill();
    // Detection ring over the guard's head.
    if (g.detection > 1) {
      ctx.strokeStyle = g.detection >= DETECTION.alarmedAt ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + (g.detection / 100) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(232, 238, 247, 0.9)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - 24);
    if (g.state === 'chase') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('!', g.x, g.y - 36);
    }
  }
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const disabled = cam.disabledLeft > 0;
    if (!disabled) {
      drawCone(
        ctx, cam.x, cam.y, cam.facing, DETECTION.coneHalfAngle, DETECTION.cameraRange,
        cam.hot ? COLORS.cameraConeHot : COLORS.cameraCone,
      );
    }
    ctx.fillStyle = disabled ? '#475569' : COLORS.camera;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = disabled ? '#94a3b8' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.facing) * 10, cam.y + Math.sin(cam.facing) * 10, 3, 0, Math.PI * 2);
    ctx.fill();
    if (disabled) {
      ctx.fillStyle = '#e8eef7';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP ' + Math.ceil(cam.disabledLeft) + 's', cam.x, cam.y - 14);
    }
  }
}

function drawPlayer(ctx, player, time) {
  // Soft shadow and the thief in a dark hood with a gold outline.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Eyes look toward the mouse.
  const look = Math.atan2(player.lookY - player.y, player.lookX - player.x);
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(look) * 5, player.y + Math.sin(look) * 5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Sneak indicator.
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(232, 238, 247, 0.85)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', player.x, player.y - 22);
  }
}

function drawSmoke(ctx, tools) {
  if (tools.smokeActiveLeft <= 0) return;
  const alpha = Math.min(1, tools.smokeActiveLeft / 2);
  ctx.fillStyle = `rgba(203, 213, 225, ${0.5 * alpha})`;
  ctx.beginPath();
  ctx.arc(tools.smokeX, tools.smokeY, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(148, 163, 184, ${0.5 * alpha})`;
  ctx.beginPath();
  ctx.arc(tools.smokeX - 40, tools.smokeY + 25, 60, 0, Math.PI * 2);
  ctx.arc(tools.smokeX + 45, tools.smokeY - 20, 55, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = 'rgba(232, 238, 247, 0.15)';
  ctx.fillRect(0, HUD_HEIGHT - 2, VIEW.width, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('VAULTBREAK', 16, 28);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('The Meridian Job', 16, 48);

  // Loot.
  ctx.fillStyle = COLORS.lootGold;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('LOOT $' + state.lootValue.toLocaleString('en-US'), 250, 30);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(state.vault.cracked ? 'Vault cracked — get to the van!' : 'Crack the vault, then escape', 250, 50);

  // Alarm meter, centre-top and impossible to miss.
  const ax = 560;
  const ay = 16;
  const aw = 300;
  const ah = 22;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', ax, ay - 4 + 12);
  ctx.fillStyle = '#1d2733';
  roundRect(ctx, ax + 70, ay, aw, ah, 6);
  ctx.fill();
  const alarmColor = state.alarm >= 75 ? COLORS.alarmHigh : state.alarm >= 40 ? COLORS.alarmMid : COLORS.alarmLow;
  ctx.fillStyle = alarmColor;
  if (state.alarm > 0.5) {
    roundRect(ctx, ax + 70, ay, Math.max(8, (aw * state.alarm) / 100), ah, 6);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(Math.round(state.alarm) + '%', ax + 70 + aw + 10, ay + 17);
  if (state.alarm >= 75) {
    ctx.fillStyle = COLORS.alarmHigh;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('!! ALARM RISING — BREAK LINE OF SIGHT !!', ax + 70, ay + ah + 16);
  }

  // Timer and tools, right side.
  const mm = Math.floor(state.elapsed / 60);
  const ss = String(Math.floor(state.elapsed % 60)).padStart(2, '0');
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(mm + ':' + ss, VIEW.width - 16, 28);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(
    `EMP ×${state.tools.emp}  (Q)    SMOKE ×${state.tools.smoke}  (F)`,
    VIEW.width - 16,
    50,
  );
  ctx.textAlign = 'left';
}

function drawMinimap(ctx, state) {
  const mw = 190;
  const mh = 96;
  const mx = VIEW.width - mw - 14;
  const my = VIEW.height - mh - 14;
  const sx = mw / 1280;
  const sy = mh / 656;
  ctx.fillStyle = 'rgba(13, 20, 32, 0.85)';
  roundRect(ctx, mx, my, mw, mh, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232, 238, 247, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(232, 238, 247, 0.5)';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP', mx + 8, my + 13);
  for (const w of WALLS) {
    ctx.fillStyle = '#7d8fb0';
    ctx.fillRect(mx + w.x * sx, my + (w.y - FLOOR.y) * sy, Math.max(1, w.w * sx), Math.max(1, w.h * sy));
  }
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(mx + EXIT.x * sx, my + (EXIT.y - FLOOR.y) * sy, 10, 6);
  ctx.fillStyle = COLORS.vaultGlow;
  ctx.fillRect(mx + VAULT.x * sx, my + (VAULT.y - FLOOR.y) * sy, 8, 8);
  for (const g of state.guards) {
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.arc(mx + g.x * sx, my + (g.y - FLOOR.y) * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(mx + state.player.x * sx, my + (state.player.y - FLOOR.y) * sy, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawMessage(ctx, message) {
  if (!message || !message.text) return;
  ctx.fillStyle = 'rgba(13, 20, 32, 0.9)';
  const w = ctx.measureText(message.text).width + 36;
  roundRect(ctx, (VIEW.width - w) / 2, FLOOR.y + 14, w, 34, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message.text, VIEW.width / 2, FLOOR.y + 36);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, state) {
  ctx.fillStyle = '#0d1420';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Decorative vault door behind the title, kept clear of the subtitle:
  // outer ring, inner dial and spokes so it reads as a vault, not a ring.
  ctx.fillStyle = '#1d2733';
  ctx.beginPath();
  ctx.arc(VIEW.width / 2, 340, 115, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.vaultGlow;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 224, 138, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(VIEW.width / 2, 340, 62, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    ctx.beginPath();
    ctx.moveTo(VIEW.width / 2 + Math.cos(a) * 62, 340 + Math.sin(a) * 62);
    ctx.lineTo(VIEW.width / 2 + Math.cos(a) * 112, 340 + Math.sin(a) * 112);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.vaultGlow;
  ctx.beginPath();
  ctx.arc(VIEW.width / 2, 340, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.vaultGlow;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULTBREAK', VIEW.width / 2, 150);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('The Meridian Job — a one-night bank heist', VIEW.width / 2, 195);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px system-ui, sans-serif';
  const lines = [
    'Cross the bank unseen. Guards patrol with vision cones — yellow is calm,',
    'orange is suspicious, red means run. Cameras sweep the halls.',
    'Grab the loot, hold E at the vault to crack it, then escape to the van.',
    '',
    'Move: WASD / arrows    Sneak (slower, harder to spot): hold SHIFT',
    'Crack vault: hold E    EMP (kills cameras): Q    Smoke bomb: F    Mute: M',
    'A vent runs along the top of the bank — a second route past the hall.',
    '',
    'Click or press ENTER to start the heist',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 480 + i * 28));
  ctx.fillStyle = COLORS.lootGold;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Best loot wins. Never get seen.', VIEW.width / 2, 480 + lines.length * 28 + 8);
  ctx.textAlign = 'left';
  void state;
}

function drawCaught(ctx, state) {
  ctx.fillStyle = 'rgba(127, 29, 29, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUGHT!', VIEW.width / 2, 300);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(state.caughtReason || 'The guards got you.', VIEW.width / 2, 350);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Loot grabbed: $' + state.lootValue.toLocaleString('en-US'), VIEW.width / 2, 410);
  ctx.fillText('Press R or click to try the job again', VIEW.width / 2, 470);
  ctx.textAlign = 'left';
}

function drawWon(ctx, state) {
  ctx.fillStyle = 'rgba(6, 78, 59, 0.88)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fef9c3';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', VIEW.width / 2, 280);
  ctx.fillStyle = '#fff';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('The Meridian vault is empty and you are gone.', VIEW.width / 2, 330);
  const s = state.score;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Loot: $${s.loot.toLocaleString('en-US')}  +  Stealth bonus: $${s.stealth}  +  Time bonus: $${s.time}`, VIEW.width / 2, 390);
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('FINAL SCORE: $' + s.total.toLocaleString('en-US'), VIEW.width / 2, 450);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Press R or click to run it back', VIEW.width / 2, 510);
  ctx.textAlign = 'left';
}

export function render(ctx, state, time) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }
  drawFloor(ctx, time);
  drawWallsAndCover(ctx);
  drawRoomLabels(ctx);
  drawLoot(ctx, state.loot, time);
  drawVault(ctx, state.vault, time);
  drawExit(ctx, state.vault.cracked);
  drawGuards(ctx, state.guards);
  drawCameras(ctx, state.cameras);
  drawSmoke(ctx, state.tools);
  drawPlayer(ctx, state.player, time);
  drawHud(ctx, state);
  drawMinimap(ctx, state);
  drawMessage(ctx, state.message);
  if (state.phase === 'caught') drawCaught(ctx, state);
  if (state.phase === 'won') drawWon(ctx, state);
}
