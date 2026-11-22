// Vaultbreak — keyboard and mouse state.
// One job: turn DOM events into a plain, pollable input snapshot.

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  function keyOf(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener('keydown', (event) => {
    const k = keyOf(event);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) keys.add(k);
  });
  window.addEventListener('keyup', (event) => keys.delete(keyOf(event)));
  window.addEventListener('blur', () => keys.clear());

  function updateMouse(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  }
  canvas.addEventListener('mousemove', updateMouse);
  canvas.addEventListener('mousedown', (event) => {
    updateMouse(event);
    mouse.down = true;
    mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });

  return {
    keys,
    mouse,
    // Movement vector from WASD or arrow keys, normalised.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    pressed(code) {
      return keys.has(code);
    },
    // One-shot helpers: consume a key or click so a single press fires once.
    consumeKey(code) {
      if (keys.has(code)) {
        keys.delete(code);
        return true;
      }
      return false;
    },
    consumeClick() {
      if (mouse.clicked) {
        mouse.clicked = false;
        return true;
      }
      return false;
    },
    endFrame() {
      mouse.clicked = false;
    },
  };
}
