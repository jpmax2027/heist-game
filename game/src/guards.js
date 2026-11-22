// Vaultbreak — guards: patrol, vision cones, suspicion and chase.
// One job: everything a patrolling guard does, including whether it can
// actually see the thief (cone angle, range and line of sight).

import { DETECTION, GUARD } from './config.js';

// --- geometry helpers (shared with cameras.js through main.js) ---

export function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when segment p1->p2 crosses rectangle r.
export function segmentHitsRect(p1, p2, r) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let tMin = 0;
  let tMax = 1;
  // Slab test on x then y.
  const axes = [
    [p1.x, dx, r.x, r.x + r.w],
    [p1.y, dy, r.y, r.y + r.h],
  ];
  for (const [p, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function hasLineOfSight(from, to, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(from, to, b)) return false;
  }
  return true;
}

// Is the target inside the watcher's cone and visible?
export function canSee(watcher, target, range, halfAngle, blockers) {
  const dx = target.x - watcher.x;
  const dy = target.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 12) return true; // right on top of the watcher: seen
  const facing = watcher.facing ?? 0;
  const toTarget = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toTarget, facing)) > halfAngle) return false;
  return hasLineOfSight(watcher, target, blockers);
}

// --- guard entity ---

export function createGuard(patrol, index) {
  const start = patrol.waypoints[0];
  return {
    name: patrol.name,
    x: start.x,
    y: start.y,
    facing: 0,
    waypointIndex: 1,
    pauseLeft: 0,
    waypoints: patrol.waypoints,
    pauseSeconds: patrol.pauseSeconds,
    detection: 0, // 0..100, per guard
    state: 'patrol', // patrol | suspicious | chase | investigate
    investigateTarget: null,
    speed: GUARD.patrolSpeed,
    index,
  };
}

function moveToward(g, target, speed, dt, blockers) {
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = g.x + (dx / dist) * step;
  const ny = g.y + (dy / dist) * step;
  if (!collides(nx, g.y, blockers)) g.x = nx;
  if (!collides(g.x, ny, blockers)) g.y = ny;
  g.facing = Math.atan2(dy, dx);
  return dist <= step + 1;
}

function collides(x, y, blockers) {
  const r = GUARD.radius;
  for (const b of blockers) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}

export function updateGuard(g, dt, player, blockers, events, isBlocked) {
  let seen = canSee(g, player, DETECTION.guardRange, DETECTION.coneHalfAngle, blockers);
  if (seen && isBlocked && isBlocked(g, player)) seen = false;

  if (seen) {
    const rate = player.sneaking ? DETECTION.risePerSecond * 0.55 : DETECTION.risePerSecond;
    g.detection = Math.min(100, g.detection + rate * dt);
  } else {
    g.detection = Math.max(0, g.detection - DETECTION.fallPerSecond * dt);
  }

  if (g.detection >= DETECTION.chaseAt) g.state = 'chase';
  else if (g.detection >= DETECTION.suspiciousAt) g.state = 'suspicious';
  else if (g.state !== 'investigate') g.state = 'patrol';

  if (g.state === 'chase') {
    moveToward(g, player, GUARD.chaseSpeed, dt, blockers);
    if (Math.hypot(player.x - g.x, player.y - g.y) < GUARD.catchDistance) {
      events.caught(`Tertangkap ${g.name}!`);
    }
  } else if (g.state === 'investigate' && g.investigateTarget) {
    const arrived = moveToward(g, g.investigateTarget, GUARD.investigateSpeed, dt, blockers);
    if (arrived) {
      g.investigateTarget = null;
      g.state = 'patrol';
      g.pauseLeft = 1.5;
    }
  } else if (g.state === 'suspicious') {
    // Freeze and stare at the last seen spot: the fair warning before a chase.
    g.facing = angleTo(g, player);
  } else {
    // Patrol: walk the waypoint loop, pausing at each stop to look around.
    if (g.pauseLeft > 0) {
      g.pauseLeft -= dt;
      g.facing += dt * 0.6; // slow look-around while paused
    } else {
      const target = g.waypoints[g.waypointIndex];
      const arrived = moveToward(g, target, GUARD.patrolSpeed, dt, blockers);
      if (arrived) {
        g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
        g.pauseLeft = g.pauseSeconds;
      }
    }
  }

  return { seen, detection: g.detection };
}

// A noise (vault cracking, dropped loot) pulls the nearest calm guard over.
export function alertGuardsToNoise(guards, x, y, radius) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < radius && d < bestDist && g.state === 'patrol') {
      best = g;
      bestDist = d;
    }
  }
  if (best) {
    best.state = 'investigate';
    best.investigateTarget = { x, y };
    best.detection = Math.max(best.detection, DETECTION.suspiciousAt);
  }
}
