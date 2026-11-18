(function () {
  'use strict';

  window.Collect1200 = window.Collect1200 || {};

  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('freddy1200_muted') === '1';
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.bossMode = false;
      this.isPlayingBgm = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('freddy1200_muted', this.muted ? '1' : '0');
      if (this.muted) {
        this.stopBgm();
      } else {
        this.init();
        if (this.shouldPlayBgm) {
          this.startBgm(this.bossMode);
        }
      }
      return this.muted;
    }

    tone(freq, duration, type = 'sine', vol = 0.12, delay = 0, slideTo = null) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    qqNotify() {
      // Playful "di-di-di" chat chirp
      this.tone(980, 0.055, 'triangle', 0.09, 0);
      this.tone(1180, 0.055, 'triangle', 0.09, 0.065);
      this.tone(1480, 0.08, 'triangle', 0.10, 0.13);
    }

    pickupCoin(combo = 0) {
      const mult = Math.min(1.45, 1 + combo * 0.04);
      this.tone(660 * mult, 0.07, 'sine', 0.11, 0);
      this.tone(990 * mult, 0.11, 'triangle', 0.11, 0.045);
    }

    pickupRedPacket() {
      this.tone(587.33, 0.08, 'triangle', 0.13, 0);
      this.tone(783.99, 0.08, 'triangle', 0.13, 0.06);
      this.tone(1174.66, 0.16, 'sine', 0.15, 0.12);
    }

    deliveryPick() {
      this.tone(440, 0.08, 'square', 0.07, 0);
      this.tone(659.25, 0.12, 'square', 0.08, 0.07);
    }

    deliveryDone() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        this.tone(n, 0.14, 'triangle', 0.13, idx * 0.055);
      });
    }

    dash() {
      this.tone(360, 0.14, 'sine', 0.09, 0, 140);
    }

    skillReport() {
      this.tone(520, 0.14, 'sawtooth', 0.08, 0, 1120);
      this.tone(880, 0.22, 'triangle', 0.12, 0.07, 440);
    }

    scamHit() {
      this.tone(240, 0.16, 'sawtooth', 0.13, 0, 110);
      this.tone(175, 0.24, 'square', 0.11, 0.1, 78);
    }

    shieldBlock() {
      this.tone(740, 0.09, 'triangle', 0.12, 0, 1280);
      this.tone(1120, 0.16, 'sine', 0.12, 0.06);
    }

    deny() {
      this.tone(220, 0.07, 'square', 0.07, 0);
      this.tone(175, 0.09, 'square', 0.07, 0.075);
    }

    healSuccess() {
      this.tone(523.25, 0.1, 'sine', 0.13, 0);
      this.tone(659.25, 0.1, 'sine', 0.13, 0.07);
      this.tone(783.99, 0.12, 'triangle', 0.14, 0.14);
      this.tone(1046.5, 0.22, 'triangle', 0.15, 0.21);
    }

    upgradePick() {
      const notes = [523.25, 659.25, 783.99, 987.77, 1318.5];
      notes.forEach((n, i) => this.tone(n, 0.13, 'triangle', 0.11, i * 0.045));
    }

    bossWarning() {
      for (let i = 0; i < 3; i++) {
        this.tone(620, 0.16, 'sawtooth', 0.09, i * 0.28, 420);
      }
    }

    winFanfare() {
      const seq = [
        [523.25, 0, 0.13],
        [659.25, 0.11, 0.13],
        [783.99, 0.22, 0.13],
        [1046.5, 0.34, 0.32],
        [783.99, 0.52, 0.13],
        [1046.5, 0.65, 0.45]
      ];
      seq.forEach(([f, d, len]) => this.tone(f, len, 'triangle', 0.15, d));
    }

    loseSad() {
      const seq = [392, 370, 349.23, 293.66];
      seq.forEach((f, i) => this.tone(f, i === 3 ? 0.42 : 0.2, 'sawtooth', 0.08, i * 0.2, f * 0.94));
    }

    startBgm(bossMode = false) {
      this.shouldPlayBgm = true;
      this.bossMode = bossMode;
      if (this.muted) return;
      this.init();
      if (this.bgmTimer) clearInterval(this.bgmTimer);

      this.isPlayingBgm = true;
      const normalScale = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 349.23];
      const bossScale = [220.00, 261.63, 329.63, 311.13, 293.66, 261.63, 246.94, 329.63];
      const intervalMs = bossMode ? 175 : 220;

      this.bgmTimer = setInterval(() => {
        if (this.muted || !this.isPlayingBgm) return;
        const notes = this.bossMode ? bossScale : normalScale;
        const freq = notes[this.bgmStep % notes.length];
        const accent = (this.bgmStep % 4 === 0) ? 0.036 : 0.022;
        this.tone(freq, 0.13, this.bossMode ? 'square' : 'triangle', accent, 0);
        if (this.bgmStep % 8 === 0) {
          this.tone(freq * 0.5, 0.18, 'sine', 0.035, 0);
        }
        this.bgmStep++;
      }, intervalMs);
    }

    setBossBgm(isBoss) {
      if (this.bossMode === isBoss) return;
      this.bossMode = isBoss;
      if (this.shouldPlayBgm && !this.muted) {
        this.startBgm(isBoss);
      }
    }

    stopBgm() {
      this.isPlayingBgm = false;
      this.shouldPlayBgm = false;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  window.Collect1200.audio = new SoundManager();
})();
