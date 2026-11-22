// Vaultbreak — CCTV cameras: sweeping cones and camera detection.
// One job: each camera's sweep, its EMP-disabled timer, and whether its
// cone currently sees the thief.

import { DETECTION } from './config.js';
import { canSee } from './guards.js';

export function createCamera(spawn) {
  return {
    id: spawn.id,
    x: spawn.x,
    y: spawn.y,
    baseAngle: spawn.baseAngle,
    sweep: spawn.sweep,
    speed: spawn.speed,
    phase: Math.random() * Math.PI * 2,
    facing: spawn.baseAngle,
    disabledLeft: 0, // seconds of EMP shutdown remaining
    detection: 0, // 0..100, per camera
    hot: false,
  };
}

export function updateCamera(cam, dt, time, player, blockers, isBlocked) {
  if (cam.disabledLeft > 0) {
    cam.disabledLeft = Math.max(0, cam.disabledLeft - dt);
    cam.detection = Math.max(0, cam.detection - DETECTION.fallPerSecond * dt);
    cam.hot = false;
    return { seen: false, detection: cam.detection };
  }
  cam.facing = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
  let seen = canSee(cam, player, DETECTION.cameraRange, DETECTION.coneHalfAngle, blockers);
  if (seen && isBlocked && isBlocked(cam, player)) seen = false;
  if (seen) {
    cam.detection = Math.min(100, cam.detection + DETECTION.cameraRisePerSecond * dt);
  } else {
    cam.detection = Math.max(0, cam.detection - DETECTION.fallPerSecond * dt);
  }
  cam.hot = cam.detection >= DETECTION.alarmedAt;
  return { seen, detection: cam.detection };
}

// EMP blast: shut every camera down for the tool's duration.
export function empBlast(cameras, durationSeconds) {
  for (const cam of cameras) {
    cam.disabledLeft = durationSeconds;
    cam.detection = 0;
    cam.hot = false;
  }
}
