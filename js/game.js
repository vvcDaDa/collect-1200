(function () {
  'use strict';

  const { CONFIG, audio, graphics, WorldMap, Entities, UIManager } = window.Collect1200;
  const {
    Player,
    Collectible,
    BaitTrap,
    PartTimeZone,
    Scammer,
    ScamBoss
  } = Entities;

  class Game {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.world = new WorldMap();
      this.ui = new UIManager();

      // 'menu' | 'playing' | 'paused' | 'upgrading' | 'twist' | 'celebrating' | 'gameover'
      this.state = 'menu';
      this.selectedMode = CONFIG.MODES.story;

      // Viewport & Camera
      this.dpr = 1;
      this.screenW = window.innerWidth;
      this.screenH = window.innerHeight;
      this.zoom = 1;
      this.viewW = this.screenW;
      this.viewH = this.screenH;
      this.cam = { x: 1160, y: 990, w: 1280, h: 720 };
      this.shakeTime = 0;
      this.shakeMag = 0;

      // PC Mouse & Keyboard Input
      this.keys = new Set();
      this.isTouchMode = false;
      this.hasMouse = false;
      this.mouseScreen = { x: this.screenW / 2, y: this.screenH / 2 };
      this.mouseWorld = { x: 1800, y: 1350 };

      // Touch Joystick
      this.joyActive = false;
      this.joyPointerId = null;
      this.joyOrigin = { x: 0, y: 0 };
      this.joyVec = { x: 0, y: 0 };

      // Run & Campaign State
      this.time = 0;
      this.elapsed = 0;
      this.stage = 1; // Story: 1 (¥1200) -> 2 (¥12000)
      this.money = 0;
      this.targetMoney = CONFIG.STAGE1_TARGET;

      this.player = null;
      this.collectibles = [];
      this.traps = [];
      this.partTimeZones = [];
      this.scammers = [];
      this.projectiles = [];
      this.boss = null;
      this.bossesDefeated = 0;

      // Progression trackers
      this.claimedMilestones = new Set();
      this.spawnedBossKeys = new Set();
      this.nearWinNotified = false;

      // Endless Mode dynamic trackers
      this.endlessUpgradeStep = 0;
      this.endlessNextUpgradeAt = 320;
      this.endlessBossWave = 0;
      this.endlessPrevBossAt = 0;
      this.endlessNextBossAt = 950;

      // Delivery & Event Timers
      this.activePickup = null;
      this.deliveryRespawnTimer = 0.8;
      this.scammerSpawnTimer = 2.0;
      this.partTimeTimer = 2.5;
      this.redPacketTimer = 16.0;
      this.trapTimer = 8.0;
      this.empSpawnTimer = 3.5;
      this.celebrateTimer = 0;
      this.bottleCombo = 0;
      this.bottleComboTimer = 0;

      // Visual FX
      this.floatingTexts = [];
      this.shockwaves = [];
      this.grabWaves = [];
      this.particles = [];
      this.lightningBolts = [];

      this.stats = this.createFreshStats();

      this.handleResize();
      this.bindEvents();

      this.lastFrameTs = performance.now();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    createFreshStats() {
      return {
        recycleEarned: 0,
        gigEarned: 0,
        redPacketEarned: 0,
        bountyEarned: 0,
        reportedCount: 0,
        scammedCount: 0
      };
    }

    getValueScale() {
      if (this.selectedMode.id === 'story') {
        return this.stage === 1 ? 1.0 : CONFIG.STORY_CONFIG.stage2Multiplier;
      }
      // Endless smooth scaling
      return 1.0 + this.bossesDefeated * 0.55 + Math.floor(this.money / 4000) * 0.35;
    }

    getEnemySpeedMult() {
      let m = this.selectedMode.scamSpeedMult;
      if (this.selectedMode.id === 'story' && this.stage === 2) {
        m *= 1.14;
      } else if (this.selectedMode.id === 'endless') {
        m *= Math.min(1.65, 1 + this.bossesDefeated * 0.06);
      }
      return m;
    }

    setState(newState) {
      this.state = newState;
      const useCustomCursor = newState === 'playing' && !this.isTouchMode;
      this.canvas.classList.toggle('playing-cursor', useCustomCursor);
    }

    handleResize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.screenW = window.innerWidth;
      this.screenH = window.innerHeight;
      this.canvas.width = Math.floor(this.screenW * this.dpr);
      this.canvas.height = Math.floor(this.screenH * this.dpr);

      this.zoom = this.screenW < 640 ? 0.75 : this.screenW < 960 ? 0.88 : 1.0;
      this.viewW = this.screenW / this.zoom;
      this.viewH = this.screenH / this.zoom;
      this.cam.w = this.viewW;
      this.cam.h = this.viewH;
    }

    enableTouchMode() {
      if (!this.isTouchMode) {
        this.isTouchMode = true;
        document.body.classList.add('is-touch-device');
        this.canvas.classList.remove('playing-cursor');
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.handleResize());
      window.addEventListener('touchstart', () => this.enableTouchMode(), { passive: true, once: true });

      window.addEventListener('mousemove', (e) => {
        if (this.isTouchMode) return;
        this.hasMouse = true;
        this.mouseScreen.x = e.clientX;
        this.mouseScreen.y = e.clientY;
        if (this.state === 'playing') {
          this.canvas.classList.add('playing-cursor');
        }
      });

      this.canvas.addEventListener('mousedown', (e) => {
        if (this.state !== 'playing' || this.isTouchMode) return;
        audio.init();
        this.mouseScreen.x = e.clientX;
        this.mouseScreen.y = e.clientY;
        this.syncMouseWorld();
        if (e.button === 0) {
          this.triggerGrabSkill();
        } else if (e.button === 2) {
          this.triggerReportSkill();
        }
      });

      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // Mode selection cards
      document.querySelectorAll('.mode-card').forEach((card) => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.mode-card').forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          const modeKey = card.getAttribute('data-mode');
          this.selectedMode = CONFIG.MODES[modeKey] || CONFIG.MODES.story;
          audio.init();
          audio.pickupCoin(1);
        });
      });

      document.getElementById('btn-start').addEventListener('click', () => {
        audio.init();
        this.startNewRun();
      });

      const toggleMuteHandler = () => {
        audio.toggleMute();
        this.ui.syncMuteButtons();
      };
      document.getElementById('btn-mute').addEventListener('click', toggleMuteHandler);
      document.getElementById('btn-start-mute').addEventListener('click', toggleMuteHandler);

      document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-resume').addEventListener('click', () => this.togglePause(false));
      document.getElementById('btn-restart-pause').addEventListener('click', () => {
        this.ui.pauseModal.classList.add('hidden');
        this.startNewRun();
      });
      document.getElementById('btn-home-pause').addEventListener('click', () => {
        this.ui.pauseModal.classList.add('hidden');
        this.returnToHome();
      });

      document.getElementById('btn-retry').addEventListener('click', () => {
        this.ui.resultModal.classList.add('hidden');
        this.startNewRun();
      });
      document.getElementById('btn-back-home').addEventListener('click', () => {
        this.ui.resultModal.classList.add('hidden');
        this.returnToHome();
      });

      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) {
          if (this.state === 'playing' || this.state === 'paused') e.preventDefault();
        }

        if (e.code === 'Enter' && this.state === 'menu') {
          audio.init();
          this.startNewRun();
          return;
        }

        if (e.code === 'KeyR' && (this.state === 'paused' || this.state === 'gameover')) {
          this.ui.pauseModal.classList.add('hidden');
          this.ui.resultModal.classList.add('hidden');
          this.startNewRun();
          return;
        }

        if (e.code === 'KeyM') {
          toggleMuteHandler();
          return;
        }

        if (e.code === 'Tab') {
          if (this.state === 'playing') {
            this.ui.toggleMinimapSize();
          }
          return;
        }

        if (e.code === 'Escape' || e.code === 'KeyP') {
          if (this.state === 'playing' || this.state === 'paused') {
            this.togglePause();
          }
          return;
        }

        this.keys.add(e.code);

        if (this.state === 'playing' && this.player) {
          if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            this.triggerDash();
          } else if (e.code === 'KeyQ') {
            this.triggerGrabSkill();
          } else if (e.code === 'KeyE' || e.code === 'KeyJ') {
            this.triggerReportSkill();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
      });

      window.addEventListener('blur', () => {
        this.keys.clear();
        this.resetJoystick();
        if (this.state === 'playing') {
          this.togglePause(true);
        }
      });

      // Touch Joystick
      const joyZone = document.getElementById('joystick-zone');
      const joyBase = document.getElementById('joystick-base');
      const joyKnob = document.getElementById('joystick-knob');
      const maxJoyDist = 38;

      const updateKnob = (clientX, clientY) => {
        const dx = clientX - this.joyOrigin.x;
        const dy = clientY - this.joyOrigin.y;
        const dist = Math.hypot(dx, dy);
        const clamped = Math.min(dist, maxJoyDist);
        const angle = Math.atan2(dy, dx);
        const kx = Math.cos(angle) * clamped;
        const ky = Math.sin(angle) * clamped;
        joyKnob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;

        if (dist > 6) {
          this.joyVec.x = kx / maxJoyDist;
          this.joyVec.y = ky / maxJoyDist;
        } else {
          this.joyVec.x = 0;
          this.joyVec.y = 0;
        }
      };

      this.resetJoystick = () => {
        this.joyActive = false;
        this.joyPointerId = null;
        this.joyVec.x = 0;
        this.joyVec.y = 0;
        if (joyKnob) joyKnob.style.transform = 'translate(0px, 0px)';
      };

      joyZone.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.enableTouchMode();
        joyZone.setPointerCapture(e.pointerId);
        this.joyActive = true;
        this.joyPointerId = e.pointerId;
        const rect = joyBase.getBoundingClientRect();
        this.joyOrigin.x = rect.left + rect.width / 2;
        this.joyOrigin.y = rect.top + rect.height / 2;
        updateKnob(e.clientX, e.clientY);
      });

      joyZone.addEventListener('pointermove', (e) => {
        if (!this.joyActive || e.pointerId !== this.joyPointerId) return;
        updateKnob(e.clientX, e.clientY);
      });

      joyZone.addEventListener('pointerup', (e) => {
        if (e.pointerId === this.joyPointerId) this.resetJoystick();
      });
      joyZone.addEventListener('pointercancel', (e) => {
        if (e.pointerId === this.joyPointerId) this.resetJoystick();
      });

      // Hotbar buttons
      document.getElementById('btn-dash').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state === 'playing') this.triggerDash();
      });
      document.getElementById('btn-grab').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state === 'playing') this.triggerGrabSkill();
      });
      document.getElementById('btn-skill').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state === 'playing') this.triggerReportSkill();
      });
    }

    syncMouseWorld() {
      this.mouseWorld.x = this.cam.x + this.mouseScreen.x / this.zoom;
      this.mouseWorld.y = this.cam.y + this.mouseScreen.y / this.zoom;
      if (this.player) {
        if (this.hasMouse && !this.isTouchMode) {
          this.player.aimAngle = Math.atan2(
            this.mouseWorld.y - this.player.y,
            this.mouseWorld.x - this.player.x
          );
        } else {
          this.player.aimAngle = Math.atan2(this.player.facingY, this.player.facingX);
        }
      }
    }

    returnToHome() {
      audio.stopBgm();
      this.setState('menu');
      this.ui.showGameHUD(false);
      this.ui.refreshBestRecord();
      this.ui.startScreen.classList.remove('hidden');
    }

    togglePause(forcePause = null) {
      if (this.state !== 'playing' && this.state !== 'paused') return;
      const shouldPause = forcePause !== null ? forcePause : this.state === 'playing';
      if (shouldPause) {
        this.setState('paused');
        this.keys.clear();
        this.resetJoystick();
        this.ui.pauseModal.classList.remove('hidden');
      } else {
        this.setState('playing');
        this.ui.pauseModal.classList.add('hidden');
        this.lastFrameTs = performance.now();
      }
    }

    startNewRun() {
      this.ui.startScreen.classList.add('hidden');
      this.ui.twistModal.classList.add('hidden');
      this.ui.upgradeModal.classList.add('hidden');
      this.ui.pauseModal.classList.add('hidden');
      this.ui.resultModal.classList.add('hidden');
      this.ui.clearChatFeed();
      this.ui.showGameHUD(true);

      this.elapsed = 0;
      this.stage = 1;
      this.money = 0;
      this.targetMoney = CONFIG.STAGE1_TARGET;
      this.stats = this.createFreshStats();

      this.claimedMilestones.clear();
      this.spawnedBossKeys.clear();
      this.boss = null;
      this.bossesDefeated = 0;
      this.nearWinNotified = false;

      // Endless progression init
      this.endlessUpgradeStep = 0;
      this.endlessNextUpgradeAt = 320;
      this.endlessBossWave = 0;
      this.endlessPrevBossAt = 0;
      this.endlessNextBossAt = 950;

      this.ui.configureStageMarkers(this.selectedMode.id, 1);

      // Spawn Freddy on Central Fountain Plaza South Walk
      this.player = new Player(1800, 1465, this.selectedMode);
      this.collectibles = [];
      this.traps = [];
      this.partTimeZones = [];
      this.scammers = [];
      this.projectiles = [];
      this.floatingTexts = [];
      this.shockwaves = [];
      this.grabWaves = [];
      this.particles = [];
      this.lightningBolts = [];

      this.activePickup = null;
      this.deliveryRespawnTimer = 0.5;
      this.scammerSpawnTimer = 2.2;
      this.partTimeTimer = 1.5;
      this.redPacketTimer = 16.0;
      this.trapTimer = 8.0;
      this.empSpawnTimer = 3.2;
      this.bottleCombo = 0;
      this.bottleComboTimer = 0;

      for (let i = 0; i < 50; i++) {
        this.spawnStreetCollectible(i < 16);
      }
      this.spawnDeliveryOrder();

      this.updateCamera(1.0);
      this.syncMouseWorld();

      this.setState('playing');
      this.lastFrameTs = performance.now();
      audio.startBgm(false);

      if (this.selectedMode.id === 'endless') {
        this.ui.pushChat('startEndless', true);
        this.addFloatingText(this.player.x, this.player.y - 48, '♾️ 无尽模式：挑战最高存款！', '#FDE047', 17);
      } else {
        this.ui.pushChat('startStage1', true);
        this.addFloatingText(this.player.x, this.player.y - 48, '第一阶段：凑齐被骗的 ¥1,200！', '#FDE047', 17);
      }
    }

    triggerStage1Twist() {
      this.setState('twist');
      this.keys.clear();
      this.resetJoystick();
      audio.setBossBgm(false);
      audio.scamHit();
      this.ui.flashScreen('rgba(244, 63, 94, 0.5)');

      // Clear Stage 1 boss/minions cleanly
      this.boss = null;
      this.scammers = [];
      this.projectiles = [];
      this.traps = [];

      this.ui.showTwistModal(() => {
        // Transition to Stage 2: Target ¥12,000!
        this.stage = 2;
        this.money = 0;
        this.targetMoney = CONFIG.STAGE2_TARGET;
        this.claimedMilestones.clear();
        this.spawnedBossKeys.clear();
        this.nearWinNotified = false;

        // Awakening buff for Freddy!
        this.player.maxHp += 1;
        this.player.hp = this.player.maxHp;
        this.player.delivery = null;
        this.activePickup = null;

        this.ui.configureStageMarkers('story', 2);

        // Refresh collectibles with Stage 2 higher-tier city values
        this.collectibles = [];
        for (let i = 0; i < 54; i++) {
          this.spawnStreetCollectible(i < 18);
        }
        this.spawnDeliveryOrder();

        audio.upgradePick();
        audio.startBgm(false);
        this.ui.pushChat('startStage2', true);
        this.addFloatingText(
          this.player.x,
          this.player.y - 52,
          '🔥 彻底醒悟！第二阶段：赚回 ¥12,000！',
          '#FDE047',
          19
        );

        this.setState('playing');
        this.lastFrameTs = performance.now();
      });
    }

    getMoveInput() {
      let ix = this.joyVec.x;
      let iy = this.joyVec.y;

      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;

      const len = Math.hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
      return { x: ix, y: iy };
    }

    triggerDash() {
      if (!this.player) return;
      const move = this.getMoveInput();
      const aimDx = this.hasMouse && !this.isTouchMode ? Math.cos(this.player.aimAngle) : null;
      const aimDy = this.hasMouse && !this.isTouchMode ? Math.sin(this.player.aimAngle) : null;
      if (this.player.tryDash(move.x, move.y, aimDx, aimDy)) {
        audio.dash();
        this.spawnBurst(this.player.x, this.player.y, '#38BDF8', 10);
      }
    }

    triggerGrabSkill() {
      if (!this.player || !this.player.tryGrab()) return;
      this.syncMouseWorld();

      const px = this.player.x;
      const py = this.player.y;
      const ang = this.player.aimAngle;
      const range = this.player.grabRange;
      const coneHalf = 0.65;

      audio.dash();
      this.grabWaves.push({
        x: px,
        y: py,
        angle: ang,
        range,
        coneHalf,
        life: 0.26,
        maxLife: 0.26
      });

      // 1. Yank collectibles in cone
      let grabbedCount = 0;
      for (const item of this.collectibles) {
        const dx = item.x - px;
        const dy = item.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + item.radius) {
          const itemAng = Math.atan2(dy, dx);
          let diff = Math.abs(itemAng - ang);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff <= coneHalf || dist < 70) {
            item.forceYanked = true;
            item.pickupDelay = 0;
            grabbedCount++;
            this.spawnBurst(item.x, item.y, '#FACC15', 4);
          }
        }
      }

      // 2. Shatter enemy projectiles in cone
      let shattered = 0;
      for (const proj of this.projectiles) {
        const dx = proj.x - px;
        const dy = proj.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist <= range * 0.85) {
          const pAng = Math.atan2(dy, dx);
          let diff = Math.abs(pAng - ang);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff <= coneHalf) {
            proj.dead = true;
            shattered++;
            this.spawnBurst(proj.x, proj.y, '#38BDF8', 6);
          }
        }
      }

      // 3. Optional stun / holo-clone pop if upgraded
      for (const s of this.scammers) {
        const dx = s.x - px;
        const dy = s.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist <= range * 0.75) {
          const sAng = Math.atan2(dy, dx);
          let diff = Math.abs(sAng - ang);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff <= coneHalf) {
            if (s.isHoloClone) {
              s.dead = true;
              this.spawnBurst(s.x, s.y, '#67E8F9', 8);
            } else if (this.player.grabStuns) {
              s.stunTime = 1.6;
            }
          }
        }
      }

      // 4. Boost part-time circle speed
      for (const zone of this.partTimeZones) {
        if (Math.hypot(zone.x - px, zone.y - py) <= zone.radius + 14) {
          zone.progress += 0.52;
          this.addFloatingText(px, py - 38, '⚡ 兼职手速爆发！', '#34D399', 14);
        }
      }

      if (grabbedCount > 0) {
        audio.pickupCoin(grabbedCount);
        this.addFloatingText(px, py - 34, `🧲 吸取 x${grabbedCount}!`, '#FDE047', 14);
      } else if (shattered > 0) {
        this.addFloatingText(px, py - 34, `🤚 拍碎弹幕 x${shattered}!`, '#7DD3FC', 14);
      }
    }

    triggerReportSkill() {
      if (!this.player || !this.player.trySkill()) return;

      audio.skillReport();
      const px = this.player.x;
      const py = this.player.y;
      const rad = this.player.skillRadius;
      const scale = this.getValueScale();

      this.shockwaves.push({
        x: px,
        y: py,
        r: 20,
        maxR: rad,
        color: '#38BDF8',
        life: 0.38,
        maxLife: 0.38
      });
      this.addFloatingText(px, py - 44, '📢 96110 一键举报脉冲！', '#7DD3FC', 16);

      for (const proj of this.projectiles) {
        if (Math.hypot(proj.x - px, proj.y - py) <= rad + proj.radius) {
          proj.dead = true;
          this.spawnBurst(proj.x, proj.y, '#E879F9', 4);
        }
      }

      let hitSomething = false;
      for (const trap of this.traps) {
        if (Math.hypot(trap.x - px, trap.y - py) <= rad + trap.radius * 0.6) {
          trap.dead = true;
          hitSomething = true;
          const purifyReward = Math.round((this.player.eagleEye ? 28 : 12) * scale);
          this.gainMoney(purifyReward, 'bounty', trap.x, trap.y, `净化骗局 +¥${purifyReward}`);
          this.spawnBurst(trap.x, trap.y, '#34D399', 10);
        }
      }

      let banished = 0;
      for (const s of this.scammers) {
        if (Math.hypot(s.x - px, s.y - py) <= rad + s.radius) {
          s.dead = true;
          banished++;
          hitSomething = true;
          this.stats.reportedCount++;
          const bounty = Math.round(this.player.reportBounty * scale);
          this.gainMoney(bounty, 'bounty', s.x, s.y, `举报封号 +¥${bounty}!`);
          this.spawnBurst(s.x, s.y, '#38BDF8', 14);
        }
      }

      if (this.boss && !this.boss.dead) {
        const distBoss = Math.hypot(this.boss.x - px, this.boss.y - py);
        if (distBoss <= rad + this.boss.radius) {
          const dmg = this.player.upgrades.has('megaphone') ? 140 : 90;
          this.boss.takeDamage(dmg);
          this.boss.stunTime = 0.85;
          hitSomething = true;
          this.stats.reportedCount++;
          const hitBounty = Math.round(22 * scale);
          this.gainMoney(hitBounty, 'bounty', this.boss.x, this.boss.y - 20, `举报重创 +¥${hitBounty}!`);
          this.spawnBurst(this.boss.x, this.boss.y, '#FACC15', 18);
          if (this.boss.dead) {
            this.handleBossDefeated();
          }
        }
      }

      if (banished > 0 || hitSomething) {
        this.addShake(0.16, 5);
        this.ui.pushChat('reportHit');
      }
    }

    gainMoney(baseAmount, sourceCategory, x, y, customLabel = null) {
      if (this.state !== 'playing') return;

      let mult = 1.0;
      if (sourceCategory === 'recycle' || sourceCategory === 'gig' || sourceCategory === 'redpacket') {
        mult = this.player.incomeMult;
      }
      const finalAmt = Math.max(1, Math.round(baseAmount * mult));
      this.money += finalAmt;

      if (sourceCategory === 'recycle') this.stats.recycleEarned += finalAmt;
      else if (sourceCategory === 'gig') this.stats.gigEarned += finalAmt;
      else if (sourceCategory === 'redpacket') this.stats.redPacketEarned += finalAmt;
      else this.stats.bountyEarned += finalAmt;

      const text = customLabel || `+¥${finalAmt}`;
      const color = finalAmt >= 80 ? '#FDE047' : '#4ADE80';
      this.addFloatingText(x, y - 16, text, color, finalAmt >= 80 ? 17 : 14);

      if (
        this.selectedMode.id === 'story' &&
        this.stage === 2 &&
        !this.nearWinNotified &&
        this.money >= 11000 &&
        this.money < CONFIG.STAGE2_TARGET
      ) {
        this.nearWinNotified = true;
        this.ui.pushChat('nearWin', true);
      }

      this.checkProgression();
    }

    checkProgression() {
      if (this.state !== 'playing') return;

      if (this.selectedMode.id === 'story') {
        if (this.stage === 1) {
          // Stage 1 Twist at ¥1,200!
          if (this.money >= CONFIG.STAGE1_TARGET) {
            this.triggerStage1Twist();
            return;
          }
          // Stage 1 Boss at ¥880 (Jack the Mentor)
          if (this.money >= CONFIG.STORY_CONFIG.stage1BossMoney && !this.spawnedBossKeys.has('s1_jack')) {
            this.spawnedBossKeys.add('s1_jack');
            this.spawnBoss('jack', 1.0, 1.0);
          }
          // Stage 1 Upgrade Milestones
          for (const m of CONFIG.STORY_CONFIG.stage1Milestones) {
            if (this.money >= m && !this.claimedMilestones.has(m)) {
              this.claimedMilestones.add(m);
              this.openUpgradeSelection(m);
              return;
            }
          }
        } else {
          // Stage 2 Final Victory at ¥12,000!
          if (this.money >= CONFIG.STAGE2_TARGET) {
            this.triggerVictorySequence();
            return;
          }
          // Stage 2 Bosses: Phantom (2800), Freezer404 (6200), Overlord Wang (9600)
          for (const bCfg of CONFIG.STORY_CONFIG.stage2Bosses) {
            const key = `s2_${bCfg.bossId}`;
            if (this.money >= bCfg.money && !this.spawnedBossKeys.has(key) && (!this.boss || this.boss.dead)) {
              this.spawnedBossKeys.add(key);
              this.spawnBoss(bCfg.bossId, 1.0, 1.0);
              break;
            }
          }
          // Stage 2 Upgrade Milestones
          for (const m of CONFIG.STORY_CONFIG.stage2Milestones) {
            if (this.money >= m && !this.claimedMilestones.has(m)) {
              this.claimedMilestones.add(m);
              this.openUpgradeSelection(m);
              return;
            }
          }
        }
      } else {
        // ENDLESS MODE PROGRESSION
        if ((!this.boss || this.boss.dead) && this.money >= this.endlessNextBossAt) {
          const bossOrder = ['jack', 'phantom', 'freezer404', 'wang'];
          const bossId = bossOrder[this.endlessBossWave % bossOrder.length];
          const cycle = Math.floor(this.endlessBossWave / bossOrder.length);
          const hpMult = 1.0 + cycle * 0.65 + this.endlessBossWave * 0.12;
          const rewardMult = 1.0 + this.endlessBossWave * 0.45;

          this.endlessPrevBossAt = this.endlessNextBossAt;
          this.endlessBossWave++;
          this.endlessNextBossAt += 1400 + this.endlessBossWave * 750;

          this.spawnBoss(bossId, hpMult, rewardMult);
        }

        if (this.money >= this.endlessNextUpgradeAt) {
          const triggerAt = this.endlessNextUpgradeAt;
          this.endlessUpgradeStep++;
          this.endlessNextUpgradeAt += 550 + this.endlessUpgradeStep * 450;
          this.openUpgradeSelection(triggerAt);
        }
      }
    }

    openUpgradeSelection(milestoneVal) {
      this.setState('upgrading');
      this.keys.clear();
      this.resetJoystick();
      audio.upgradePick();
      this.ui.flashScreen('rgba(250, 204, 21, 0.22)');

      const unowned = CONFIG.UPGRADES.filter((u) => !this.player.upgrades.has(u.id));
      let choices = [];

      if (unowned.length >= 3) {
        const pool = [...unowned];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        choices = pool.slice(0, 3);
      } else {
        choices = [...unowned];
        while (choices.length < 3) {
          choices.push({
            id: 'mastery_boost',
            icon: '⭐',
            title: `全能打工进修 Lv.${this.player.masteryLevel + 1}`,
            sender: '全群金牌投资团',
            desc: '所有正经搞钱收入再 +25%、移动速度 +6%，并立即恢复 1 颗心态 ❤️！'
          });
        }
      }

      this.ui.showUpgradeModal(milestoneVal, choices, (picked) => {
        this.player.applyUpgrade(picked.id);
        audio.upgradePick();
        this.addFloatingText(
          this.player.x,
          this.player.y - 48,
          `${picked.icon} 装备：${picked.title}！`,
          '#FDE047',
          17
        );
        this.setState('playing');
        this.lastFrameTs = performance.now();
        this.checkProgression();
      });
    }

    spawnBoss(bossId, hpMult = 1.0, rewardMult = 1.0) {
      const pt = this.world.getRandomWalkablePoint(
        80,
        this.player.x,
        this.player.y,
        340,
        560,
        this.player.x,
        this.player.y
      );
      this.boss = new ScamBoss(pt.x, pt.y, bossId, {
        hpMult,
        speedMult: this.getEnemySpeedMult(),
        rewardMult
      });

      audio.bossWarning();
      audio.setBossBgm(true);
      this.addShake(0.45, 9);
      this.ui.flashScreen('rgba(244, 63, 94, 0.34)');
      this.ui.pushChat('bossSpawn', true);

      const empVal = Math.round(45 * this.getValueScale() * this.player.empBonusMult);
      const empPt = this.world.getRandomWalkablePoint(
        55,
        this.player.x,
        this.player.y,
        160,
        360,
        this.player.x,
        this.player.y
      );
      this.collectibles.push(new Collectible(empPt.x, empPt.y, 'emp_pack', empVal, { life: 20 }));
    }

    handleBossDefeated() {
      if (!this.boss) return;
      const bx = this.boss.x;
      const by = this.boss.y;
      const totalDrop = this.boss.dropTotal;
      this.bossesDefeated++;

      audio.deliveryDone();
      audio.setBossBgm(false);
      this.addShake(0.5, 12);
      this.spawnBurst(bx, by, '#FACC15', 42);
      this.ui.pushChat('bossDefeated', true);
      this.addFloatingText(bx, by - 36, `💥 击溃【${this.boss.name}】！追缴赃款！`, '#FDE047', 20);

      // Instant 40% direct recovery + 6 juicy cash bundles on ground for remaining 60%
      const directAmt = Math.round(totalDrop * 0.4);
      const eachBag = Math.max(15, Math.round((totalDrop * 0.6) / 6));
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        this.collectibles.push(new Collectible(bx, by, 'bounty_cash', eachBag, {
          vx: Math.cos(angle) * 250,
          vy: Math.sin(angle) * 250,
          life: 24
        }));
      }
      this.gainMoney(directAmt, 'bounty', bx, by, `追缴本金 +¥${directAmt}!`);
    }

    triggerVictorySequence() {
      this.setState('celebrating');
      this.celebrateTimer = 1.6;
      this.keys.clear();
      this.resetJoystick();
      audio.stopBgm();
      audio.winFanfare();
      this.ui.flashScreen('rgba(74, 222, 128, 0.38)');
      this.ui.pushChat('win', true);

      if (this.boss && !this.boss.dead) {
        this.lightningBolts.push({
          x1: this.boss.x,
          y1: this.boss.y - 440,
          x2: this.boss.x,
          y2: this.boss.y,
          life: 0.65
        });
        this.spawnBurst(this.boss.x, this.boss.y, '#FACC15', 40);
        this.boss.dead = true;
        this.bossesDefeated++;
      }
      for (const s of this.scammers) {
        this.spawnBurst(s.x, s.y, '#38BDF8', 10);
      }
      this.scammers = [];
      this.projectiles = [];
      this.traps = [];

      this.addFloatingText(
        this.player.x,
        this.player.y - 54,
        '🎉 赚回 ¥12,000！FriedRich 完美涅槃！',
        '#FDE047',
        21
      );
    }

    handlePlayerScammed(reason, applySlow = false, isBait = false) {
      if (this.state !== 'playing' || this.player.invulnTime > 0) return;

      this.player.noScamTimer = 0;
      this.bottleCombo = 0;

      if (this.player.hasShield) {
        this.player.hasShield = false;
        this.player.shieldCooldown = 0;
        this.player.invulnTime = 1.0;
        audio.shieldBlock();
        this.shockwaves.push({
          x: this.player.x,
          y: this.player.y,
          r: 16,
          maxR: 130,
          color: '#38BDF8',
          life: 0.28,
          maxLife: 0.28
        });
        this.addFloatingText(this.player.x, this.player.y - 38, '🛡️ 反诈护盾成功拦截！', '#38BDF8', 16);
        this.ui.pushChat('shieldBlock');
        return;
      }

      this.player.hp = Math.max(0, this.player.hp - 1);
      this.player.invulnTime = CONFIG.PLAYER_BASE.invulnDuration;
      this.player.setMood('hurt', 1.2);
      if (applySlow) {
        this.player.slowTime = 1.8;
      }

      this.stats.scammedCount++;
      audio.scamHit();
      this.addShake(0.28, 9);
      this.ui.flashScreen('rgba(239, 68, 68, 0.42)');

      const scale = this.getValueScale();
      const maxLoss = Math.round(28 * scale * this.selectedMode.scamLossMult);
      const actualLoss = Math.min(this.money, maxLoss);
      this.money -= actualLoss;

      if (actualLoss >= 9) {
        const dropEach = Math.max(3, Math.floor((actualLoss * 0.85) / 3));
        for (let i = 0; i < 3; i++) {
          const ang = Math.random() * Math.PI * 2;
          this.collectibles.push(new Collectible(this.player.x, this.player.y, 'dropped_cash', dropEach, {
            vx: Math.cos(ang) * 270,
            vy: Math.sin(ang) * 270,
            life: 7.5,
            pickupDelay: 0.42
          }));
        }
      }

      const lossMsg = actualLoss > 0 ? `😱 ${reason} -¥${actualLoss}!` : `😱 ${reason} 心态-1!`;
      this.addFloatingText(this.player.x, this.player.y - 36, lossMsg, '#FB7185', 16);
      this.ui.pushChat(isBait ? 'baited' : 'scammed');

      if (this.player.hp <= 0) {
        this.setState('gameover');
        this.keys.clear();
        this.resetJoystick();
        audio.stopBgm();
        audio.loseSad();
        setTimeout(() => {
          this.ui.showResultModal({
            won: false,
            modeId: this.selectedMode.id,
            stage: this.stage,
            money: this.money,
            elapsed: this.elapsed,
            stats: this.stats,
            bossesDefeated: this.bossesDefeated
          });
        }, 550);
      }
    }

    spawnStreetCollectible(nearPlayer = false) {
      let pt;
      if (nearPlayer && this.player) {
        pt = this.world.getRandomWalkablePoint(42, this.player.x, this.player.y, 160, 950, this.player.x, this.player.y);
      } else {
        pt = this.world.getRandomWalkablePoint(42);
      }

      const roll = Math.random() * 100;
      let type = 'bottle';
      if (roll > 94) type = 'maotai_bottle';
      else if (roll > 80) type = 'cash_small';
      else if (roll > 56) type = 'cardboard';
      else if (roll > 32) type = 'can';

      this.collectibles.push(new Collectible(pt.x, pt.y, type, null, { valueScale: this.getValueScale() }));
    }

    spawnDeliveryOrder() {
      const spot = this.world.pickupSpots[Math.floor(Math.random() * this.world.pickupSpots.length)];
      this.activePickup = {
        x: spot.x,
        y: spot.y,
        radius: 42,
        spot
      };
    }

    acceptDeliveryOrder() {
      if (!this.activePickup) return;
      const pickup = this.activePickup;
      this.activePickup = null;

      const candidates = this.world.dropoffSpots.filter(
        (d) => Math.hypot(d.x - pickup.x, d.y - pickup.y) > 750
      );
      const drop = candidates[Math.floor(Math.random() * candidates.length)] || this.world.dropoffSpots[0];
      const dist = Math.hypot(drop.x - pickup.x, drop.y - pickup.y);
      const scale = this.getValueScale();
      const baseReward = Math.round((34 + dist * 0.012) * scale * this.player.deliveryRewardMult);
      const maxTimer = 24.0 + this.player.deliveryBonusTime;

      this.player.delivery = {
        food: pickup.spot.food,
        dropoffName: drop.name,
        x: drop.x,
        y: drop.y,
        radius: 48,
        timer: maxTimer,
        maxTimer,
        baseReward
      };

      audio.deliveryPick();
      this.addFloatingText(this.player.x, this.player.y - 42, `🍱 已取餐：送往${drop.name}!`, '#FDE047', 15);
      this.ui.pushChat('deliveryPick');
    }

    triggerRedPacketRain() {
      this.ui.pushChat('redPacketRain', true);
      this.addFloatingText(this.player.x, this.player.y - 54, '🧧 群友红包雨来袭！小心紫皮假包！', '#FBBF24', 17);

      const scale = this.getValueScale();
      for (let i = 0; i < 6; i++) {
        const pt = this.world.getRandomWalkablePoint(45, null, null, 120, 420, this.player.x, this.player.y);
        this.collectibles.push(new Collectible(pt.x, pt.y, 'red_packet', null, { life: 16, valueScale: scale }));
      }

      for (let i = 0; i < 2; i++) {
        const pt = this.world.getRandomWalkablePoint(45, this.player.x, this.player.y, 150, 360, this.player.x, this.player.y);
        this.traps.push(new BaitTrap(pt.x, pt.y, 'fake_packet'));
      }
    }

    spawnScammerWave() {
      const maxScammers = this.boss && !this.boss.dead
        ? 4
        : this.stage === 2 || this.selectedMode.id === 'endless'
          ? 7
          : this.money < 400
            ? 4
            : 6;

      if (this.scammers.length >= maxScammers) return;

      const pt = this.world.getRandomWalkablePoint(
        50,
        this.player.x,
        this.player.y,
        360,
        780,
        this.player.x,
        this.player.y
      );
      let type = 'spammer';
      const r = Math.random();
      if ((this.stage === 2 || this.money >= 500) && r < 0.34) {
        type = 'freezer';
      } else if ((this.stage === 2 || this.money >= 220) && r < 0.68) {
        type = 'mentor';
      }

      this.scammers.push(new Scammer(pt.x, pt.y, type, this.getEnemySpeedMult()));
    }

    addShake(duration, magnitude) {
      this.shakeTime = Math.max(this.shakeTime, duration);
      this.shakeMag = Math.max(this.shakeMag, magnitude);
    }

    addFloatingText(x, y, text, color = '#FFFFFF', size = 14) {
      this.floatingTexts.push({
        x,
        y,
        text,
        color,
        size,
        life: 1.05,
        maxLife: 1.05
      });
    }

    spawnBurst(x, y, color, count = 10) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 195;
        this.particles.push({
          x,
          y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: 2.5 + Math.random() * 3.5,
          color,
          life: 0.35 + Math.random() * 0.3,
          maxLife: 0.65
        });
      }
    }

    updateCamera(lerpFactor) {
      if (!this.player) return;
      let lookAheadX = 0;
      let lookAheadY = 0;
      if (this.hasMouse && !this.isTouchMode) {
        lookAheadX = ((this.mouseScreen.x / this.screenW) - 0.5) * 95;
        lookAheadY = ((this.mouseScreen.y / this.screenH) - 0.5) * 75;
      }

      const targetX = this.player.x + lookAheadX - this.viewW / 2;
      const targetY = this.player.y + lookAheadY - this.viewH / 2;

      const maxCamX = Math.max(0, this.world.width - this.viewW);
      const maxCamY = Math.max(0, this.world.height - this.viewH);

      const clampedX = Math.max(0, Math.min(maxCamX, targetX));
      const clampedY = Math.max(0, Math.min(maxCamY, targetY));

      this.cam.x += (clampedX - this.cam.x) * lerpFactor;
      this.cam.y += (clampedY - this.cam.y) * lerpFactor;
    }

    update(dt) {
      this.time += dt;

      // Scenic city camera glide on Start Screen
      if (this.state === 'menu') {
        const cx = 1800 + Math.cos(this.time * 0.16) * 520 - this.viewW / 2;
        const cy = 1350 + Math.sin(this.time * 0.13) * 360 - this.viewH / 2;
        this.cam.x = Math.max(0, Math.min(Math.max(0, this.world.width - this.viewW), cx));
        this.cam.y = Math.max(0, Math.min(Math.max(0, this.world.height - this.viewH), cy));
        return;
      }

      if (this.shakeTime > 0) {
        this.shakeTime = Math.max(0, this.shakeTime - dt);
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y -= 36 * dt;
        ft.life -= dt;
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.life -= dt;
        const p = 1 - sw.life / sw.maxLife;
        sw.r = 20 + (sw.maxR - 20) * p;
        if (sw.life <= 0) this.shockwaves.splice(i, 1);
      }

      for (let i = this.grabWaves.length - 1; i >= 0; i--) {
        this.grabWaves[i].life -= dt;
        if (this.grabWaves[i].life <= 0) this.grabWaves.splice(i, 1);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.92;
        pt.vy *= 0.92;
        pt.life -= dt;
        if (pt.life <= 0) this.particles.splice(i, 1);
      }

      for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
        this.lightningBolts[i].life -= dt;
        if (this.lightningBolts[i].life <= 0) this.lightningBolts.splice(i, 1);
      }

      if (this.state === 'celebrating') {
        this.celebrateTimer -= dt;
        if (Math.random() < 0.38 && this.player) {
          const colors = ['#FACC15', '#4ADE80', '#38BDF8', '#FB7185'];
          this.spawnBurst(
            this.player.x + (Math.random() - 0.5) * 280,
            this.player.y + (Math.random() - 0.5) * 190,
            colors[Math.floor(Math.random() * colors.length)],
            14
          );
        }
        this.refreshHUDState();
        if (this.celebrateTimer <= 0) {
          this.setState('gameover');
          this.ui.showResultModal({
            won: true,
            modeId: this.selectedMode.id,
            stage: this.stage,
            money: this.money,
            elapsed: this.elapsed,
            stats: this.stats,
            bossesDefeated: this.bossesDefeated
          });
        }
        return;
      }

      if (this.state !== 'playing') return;

      this.elapsed += dt;
      if (this.bottleComboTimer > 0) {
        this.bottleComboTimer -= dt;
        if (this.bottleComboTimer <= 0) this.bottleCombo = 0;
      }

      // 1. Player & Camera
      const move = this.getMoveInput();
      const playerEvent = this.player.update(dt, move.x, move.y, this.world);
      if (playerEvent === 'delivery_expired') {
        this.addFloatingText(this.player.x, this.player.y - 38, '⏰ 外卖超时取消…已刷新新单！', '#FCA5A5', 14);
        this.deliveryRespawnTimer = 1.5;
      } else if (playerEvent === 'rich_aura_tick') {
        const tip = Math.round(16 * this.getValueScale());
        this.gainMoney(tip, 'redpacket', this.player.x, this.player.y - 26, `✨清醒津贴 +¥${tip}!`);
      }

      this.updateCamera(Math.min(1, dt * 8.5));
      this.syncMouseWorld();

      // 2. Express Delivery System
      if (!this.player.delivery) {
        if (!this.activePickup) {
          this.deliveryRespawnTimer -= dt;
          if (this.deliveryRespawnTimer <= 0) {
            this.spawnDeliveryOrder();
          }
        } else {
          const d = Math.hypot(this.player.x - this.activePickup.x, this.player.y - this.activePickup.y);
          if (d < this.player.radius + this.activePickup.radius) {
            this.acceptDeliveryOrder();
          }
        }
      } else {
        const del = this.player.delivery;
        const d = Math.hypot(this.player.x - del.x, this.player.y - del.y);
        if (d < this.player.radius + del.radius) {
          const speedTip = Math.round((del.timer / del.maxTimer) * (16 * this.getValueScale()) * this.player.deliveryTipMult);
          const total = del.baseReward + speedTip;
          this.player.delivery = null;
          this.deliveryRespawnTimer = 2.4;
          audio.deliveryDone();
          this.spawnBurst(del.x, del.y, '#4ADE80', 22);
          this.ui.pushChat('deliveryDone');
          this.gainMoney(total, 'gig', del.x, del.y, `🍱 外卖送达 +¥${Math.round(total * this.player.incomeMult)}!`);
        }
      }

      // 3. Street Collectibles across 4 Districts
      const permanentCount = this.collectibles.filter((c) => c.life === null).length;
      if (permanentCount < 50) {
        this.spawnStreetCollectible(Math.random() < 0.55);
      }

      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const item = this.collectibles[i];
        const picked = item.update(dt, this.player, this.world);
        if (picked) {
          this.bottleCombo++;
          this.bottleComboTimer = 3.4;

          if (item.type === 'emp_pack') {
            audio.skillReport();
            this.spawnBurst(item.x, item.y, '#06B6D4', 22);
            if (this.boss && !this.boss.dead) {
              this.lightningBolts.push({
                x1: this.player.x,
                y1: this.player.y,
                x2: this.boss.x,
                y2: this.boss.y,
                life: 0.44
              });
              const empDmg = Math.round(165 * this.player.empBonusMult);
              this.boss.takeDamage(empDmg);
              this.boss.stunTime = 0.8;
              this.addShake(0.26, 8);
              this.gainMoney(item.value, 'bounty', this.boss.x, this.boss.y, `⚡96110电击 +¥${item.value}!`);
              if (this.boss && this.boss.dead) {
                this.handleBossDefeated();
              }
            } else {
              this.gainMoney(item.value, 'bounty', item.x, item.y);
            }
          } else if (item.type === 'red_packet') {
            audio.pickupRedPacket();
            this.spawnBurst(item.x, item.y, '#FACC15', 12);
            this.gainMoney(item.value, 'redpacket', item.x, item.y, `🧧 群红包 +¥${Math.round(item.value * this.player.incomeMult)}!`);
          } else if (item.type === 'dropped_cash') {
            audio.pickupCoin(2);
            this.money += item.value;
            this.addFloatingText(item.x, item.y - 12, `抢回现金 +¥${item.value}`, '#FDE047', 14);
            this.checkProgression();
          } else if (item.type === 'bounty_cash') {
            audio.pickupRedPacket();
            this.gainMoney(item.value, 'bounty', item.x, item.y);
          } else {
            audio.pickupCoin(this.bottleCombo);
            this.spawnBurst(item.x, item.y, item.color, 6);
            if (this.bottleCombo === 8) {
              this.ui.pushChat('bottleStreak');
            }
            this.gainMoney(item.value, 'recycle', item.x, item.y);
          }
        }
        if (item.dead) {
          this.collectibles.splice(i, 1);
        }
      }

      // 4. Part-Time Work Zones
      this.partTimeTimer -= dt;
      if (this.partTimeTimer <= 0 && this.partTimeZones.length < 3) {
        this.partTimeTimer = 13.0;
        const pt = this.world.getRandomWalkablePoint(80, this.player.x, this.player.y, 220, 950, this.player.x, this.player.y);
        const jobs = this.stage === 2
          ? ['CBD高薪外包驻场', '商圈新品试饮促销', '反诈宣传专员日结']
          : ['摇柠檬水日结', '发反诈传单兼职', '夜市端盘子现结'];
        const title = jobs[Math.floor(Math.random() * jobs.length)];
        const reward = Math.round(42 * this.getValueScale());
        this.partTimeZones.push(new PartTimeZone(pt.x, pt.y, title, reward));
      }

      for (let i = this.partTimeZones.length - 1; i >= 0; i--) {
        const zone = this.partTimeZones[i];
        const done = zone.update(dt, this.player);
        if (done) {
          audio.deliveryDone();
          this.spawnBurst(zone.x, zone.y, '#34D399', 18);
          this.ui.pushChat('parttimeDone');
          this.gainMoney(zone.reward, 'gig', zone.x, zone.y, `💼 兼职完工 +¥${Math.round(zone.reward * this.player.incomeMult)}!`);
        }
        if (zone.dead) {
          this.partTimeZones.splice(i, 1);
        }
      }

      // 5. Red Packet Rain
      this.redPacketTimer -= dt;
      if (this.redPacketTimer <= 0) {
        this.redPacketTimer = 26.0;
        this.triggerRedPacketRain();
      }

      // 6. Traps & Boss EMP Packs
      this.trapTimer -= dt;
      if (this.trapTimer <= 0 && this.traps.length < 6) {
        this.trapTimer = 8.2 / this.selectedMode.spawnRateMult;
        const pt = this.world.getRandomWalkablePoint(52, this.player.x, this.player.y, 170, 460, this.player.x, this.player.y);
        const kind = Math.random() < 0.55 ? 'phishing_zone' : 'fake_packet';
        this.traps.push(new BaitTrap(pt.x, pt.y, kind));
      }

      if (this.boss && !this.boss.dead) {
        this.empSpawnTimer -= dt;
        const existingEmp = this.collectibles.some((c) => c.type === 'emp_pack');
        if (this.empSpawnTimer <= 0 && !existingEmp) {
          this.empSpawnTimer = 6.2;
          const empVal = Math.round(45 * this.getValueScale() * this.player.empBonusMult);
          const pt = this.world.getRandomWalkablePoint(55, this.player.x, this.player.y, 160, 420, this.player.x, this.player.y);
          this.collectibles.push(new Collectible(pt.x, pt.y, 'emp_pack', empVal, { life: 18 }));
          this.addFloatingText(pt.x, pt.y - 26, '⚡ 96110反诈电磁炮空投！', '#38BDF8', 14);
        }
      }

      for (let i = this.traps.length - 1; i >= 0; i--) {
        const trap = this.traps[i];
        const triggered = trap.update(dt, this.player);
        if (triggered) {
          const isIce = trap.kind === 'freeze_grid';
          this.handlePlayerScammed(
            trap.kind === 'fake_packet' ? '误抢垫付假红包' : isIce ? '踩中高压冻结电网' : '误扫钓鱼二维码',
            isIce,
            true
          );
        }
        if (trap.dead) this.traps.splice(i, 1);
      }

      // 7. Scammers, Boss & Projectiles
      this.scammerSpawnTimer -= dt;
      if (this.scammerSpawnTimer <= 0) {
        this.scammerSpawnTimer = 3.5 / this.selectedMode.spawnRateMult;
        this.spawnScammerWave();
      }

      for (let i = this.scammers.length - 1; i >= 0; i--) {
        const s = this.scammers[i];
        const touched = s.update(dt, this.player, this.world, this.projectiles);
        if (touched) {
          this.handlePlayerScammed(`轻信${s.name}`, false, false);
        }
        if (s.dead) this.scammers.splice(i, 1);
      }

      if (this.boss && !this.boss.dead) {
        const bossHit = this.boss.update(
          dt,
          this.player,
          this.world,
          this.projectiles,
          this.traps,
          this.collectibles,
          this.scammers
        );
        if (bossHit) {
          this.handlePlayerScammed(`遭${this.boss.name}重创`, false, false);
        }
      }

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i];
        const hit = proj.update(dt, this.player, this.world);
        if (hit) {
          this.handlePlayerScammed(`被“${proj.text}”话术击中`, proj.slow, false);
        }
        if (proj.dead) this.projectiles.splice(i, 1);
      }

      // 8. Refresh HUD & City Radar
      this.refreshHUDState();

      this.ui.renderMinimap(
        this.world,
        {
          player: this.player,
          cam: this.cam,
          collectibles: this.collectibles,
          partTimeZones: this.partTimeZones,
          activePickup: this.activePickup,
          scammers: this.scammers,
          boss: this.boss
        },
        this.time
      );
    }

    refreshHUDState() {
      this.ui.updateHUD({
        player: this.player,
        money: this.money,
        targetMoney: this.targetMoney,
        modeId: this.selectedMode.id,
        stage: this.stage,
        elapsed: this.elapsed,
        activePickup: this.activePickup,
        boss: this.boss,
        combo: this.bottleCombo,
        bossesDefeated: this.bossesDefeated,
        endlessPrevBossAt: this.endlessPrevBossAt,
        endlessNextBossAt: this.endlessNextBossAt
      });
    }

    renderDeliveryWaypoints(ctx) {
      if (this.activePickup && !this.player.delivery) {
        const p = this.activePickup;
        const pulse = Math.sin(this.time * 6) * 4;
        ctx.save();
        const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.radius + 8);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.35)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0.05)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x - 12, p.y - 8, 24, 20);
        ctx.strokeRect(p.x - 12, p.y - 8, 24, 20);

        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#FEF08A';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        const txt = `取餐：${p.spot.food}`;
        ctx.strokeText(txt, p.x, p.y - p.radius - 10);
        ctx.fillText(txt, p.x, p.y - p.radius - 10);
        ctx.restore();
      }

      if (this.player && this.player.delivery) {
        const d = this.player.delivery;
        const pulse = Math.sin(this.time * 7) * 5;
        ctx.save();
        const grad = ctx.createRadialGradient(d.x, d.y, 6, d.x, d.y, d.radius + 8);
        grad.addColorStop(0, 'rgba(34, 197, 94, 0.38)');
        grad.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22C55E';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 4, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#86EFAC';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        const txt = `送达：${d.dropoffName} (+¥${d.baseReward}+小费)`;
        ctx.strokeText(txt, d.x, d.y - d.radius - 10);
        ctx.fillText(txt, d.x, d.y - d.radius - 10);
        ctx.restore();
      }
    }

    renderCompassIndicators(ctx) {
      if (!this.player) return;

      const drawIndicator = (tx, ty, color, label) => {
        const dx = tx - this.player.x;
        const dy = ty - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) return;

        const ang = Math.atan2(dy, dx);
        const orbitR = 58;
        const ix = this.player.x + Math.cos(ang) * orbitR;
        const iy = this.player.y + Math.sin(ang) * orbitR;

        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(ang);
        ctx.fillStyle = color;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-7, -7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.font = 'bold 10.5px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.textAlign = 'center';
        ctx.strokeText(label, ix, iy - 10);
        ctx.fillText(label, ix, iy - 10);
        ctx.restore();
      };

      if (this.player.delivery) {
        drawIndicator(this.player.delivery.x, this.player.delivery.y, '#4ADE80', '送达');
      } else if (this.activePickup) {
        drawIndicator(this.activePickup.x, this.activePickup.y, '#FACC15', '取餐');
      }

      const emp = this.collectibles.find((c) => c.type === 'emp_pack');
      if (emp) {
        drawIndicator(emp.x, emp.y, '#38BDF8', '⚡反诈炮');
      } else if (this.partTimeZones.length > 0) {
        drawIndicator(this.partTimeZones[0].x, this.partTimeZones[0].y, '#34D399', '兼职');
      }

      if (this.boss && !this.boss.dead) {
        drawIndicator(this.boss.x, this.boss.y, '#FB7185', '头目');
      }
    }

    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.scale(this.dpr * this.zoom, this.dpr * this.zoom);

      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeTime > 0) {
        shakeX = (Math.random() - 0.5) * this.shakeMag * 2;
        shakeY = (Math.random() - 0.5) * this.shakeMag * 2;
      }

      ctx.translate(-this.cam.x + shakeX, -this.cam.y + shakeY);

      // 1. 4-District Metropolis Map
      this.world.render(ctx, this.cam, this.time);

      if (this.player && this.state !== 'menu') {
        for (const z of this.partTimeZones) z.render(ctx, this.time);
        for (const t of this.traps) t.render(ctx, this.time, this.player.eagleEye);
        this.renderDeliveryWaypoints(ctx);

        for (const c of this.collectibles) {
          if (
            c.x < this.cam.x - 40 || c.x > this.cam.x + this.cam.w + 40 ||
            c.y < this.cam.y - 40 || c.y > this.cam.y + this.cam.h + 40
          ) {
            continue;
          }
          c.render(ctx, this.time);
        }

        for (const gw of this.grabWaves) {
          const p = 1 - gw.life / gw.maxLife;
          ctx.save();
          ctx.globalAlpha = 1 - p;
          ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(gw.x, gw.y);
          ctx.arc(gw.x, gw.y, gw.range * (0.35 + p * 0.65), gw.angle - gw.coneHalf, gw.angle + gw.coneHalf);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        for (const sw of this.shockwaves) {
          const alpha = sw.life / sw.maxLife;
          ctx.save();
          ctx.strokeStyle = sw.color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = sw.color;
          ctx.globalAlpha = alpha * 0.14;
          ctx.fill();
          ctx.restore();
        }

        for (const s of this.scammers) s.render(ctx, this.time);
        if (this.boss && !this.boss.dead) this.boss.render(ctx, this.time);
        for (const proj of this.projectiles) proj.render(ctx);

        const isRichLook =
          (this.selectedMode.id === 'story' && this.stage === 2 && this.money >= 9000) ||
          (this.selectedMode.id === 'endless' && this.money >= 6000);
        this.player.render(ctx, this.time, isRichLook);
        this.renderCompassIndicators(ctx);

        for (const lb of this.lightningBolts) {
          ctx.save();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(lb.x1, lb.y1);
          const midX = (lb.x1 + lb.x2) / 2 + (Math.random() - 0.5) * 35;
          const midY = (lb.y1 + lb.y2) / 2 + (Math.random() - 0.5) * 35;
          ctx.lineTo(midX, midY);
          ctx.lineTo(lb.x2, lb.y2);
          ctx.stroke();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }

        for (const pt of this.particles) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        for (const ft of this.floatingTexts) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
          ctx.font = `900 ${ft.size}px "Microsoft YaHei", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 3.5;
          ctx.strokeText(ft.text, ft.x, ft.y);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }

        if (this.state === 'playing' && this.hasMouse && !this.isTouchMode) {
          graphics.drawCrosshair(
            ctx,
            this.mouseWorld.x,
            this.mouseWorld.y,
            this.time,
            this.player.grabCd <= 0
          );
        }
      }

      ctx.restore();
    }

    loop(ts) {
      const rawDt = (ts - this.lastFrameTs) / 1000;
      this.lastFrameTs = ts;
      const dt = Math.min(0.05, Math.max(0, rawDt));

      this.update(dt);
      this.render();

      requestAnimationFrame((nextTs) => this.loop(nextTs));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.Collect1200.game = new Game();
  });
})();
