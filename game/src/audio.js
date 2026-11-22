// Vaultbreak — all sound, synthesised with WebAudio. No audio files.
// One job: footsteps, pickups, the vault crack, the alarm and the ambient
// hum, each built from oscillators and noise buffers in code.

export function createAudio() {
  let ctx = null;
  let master = null;
  let ambientNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (!ensure() || muted) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch {
      // Audio is decoration; never break the game over it.
    }
  }

  function noiseBurst(duration, volume, filterFreq) {
    if (!ensure() || muted) return;
    try {
      const len = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
    } catch {
      // See above.
    }
  }

  return {
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    footstep(sneaking) {
      noiseBurst(0.07, sneaking ? 0.05 : 0.11, sneaking ? 400 : 900);
    },
    pickup() {
      tone(660, 0.09, 'sine', 0.16);
      setTimeout(() => tone(990, 0.12, 'sine', 0.16), 70);
    },
    crackTick(progress) {
      tone(300 + progress * 500, 0.05, 'square', 0.07);
    },
    vaultOpen() {
      tone(180, 0.5, 'sawtooth', 0.12, 90);
      noiseBurst(0.4, 0.2, 1200);
      setTimeout(() => tone(523, 0.2, 'sine', 0.18), 120);
      setTimeout(() => tone(784, 0.3, 'sine', 0.18), 260);
    },
    alarmBeep() {
      tone(880, 0.14, 'square', 0.1, 660);
    },
    spotted() {
      tone(220, 0.25, 'sawtooth', 0.16, 440);
    },
    empZap() {
      tone(1200, 0.35, 'sawtooth', 0.14, 120);
      noiseBurst(0.25, 0.16, 3000);
    },
    smokePuff() {
      noiseBurst(0.5, 0.2, 600);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.2), i * 140));
    },
    lose() {
      [392, 311, 233, 175].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sawtooth', 0.12), i * 160));
    },
    startAmbient() {
      if (!ensure() || ambientNodes) return;
      try {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 55;
        const gain = ctx.createGain();
        gain.gain.value = 0.035;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.11;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.015;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(gain);
        gain.connect(master);
        osc.start();
        lfo.start();
        ambientNodes = { osc, lfo };
      } catch {
        // See above.
      }
    },
  };
}
