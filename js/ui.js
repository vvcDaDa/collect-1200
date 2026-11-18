(function () {
  'use strict';

  const { CONFIG, audio } = window.Collect1200;

  class UIManager {
    constructor() {
      this.hud = document.getElementById('hud');
      this.chatFeed = document.getElementById('chat-feed');
      this.controlsLayer = document.getElementById('controls-layer');
      this.screenFlash = document.getElementById('screen-flash');

      this.hudAvatarFace = document.getElementById('hud-avatar-face');
      this.heroRankTag = document.getElementById('hero-rank-tag');
      this.hudHearts = document.getElementById('hud-hearts');
      this.hudBuffs = document.getElementById('hud-buffs');

      this.stageLabel = document.getElementById('stage-label');
      this.moneyCurrent = document.getElementById('money-current');
      this.moneyTarget = document.getElementById('money-target');
      this.moneyBarFill = document.getElementById('money-bar-fill');
      this.milestoneMarkers = document.getElementById('milestone-markers');
      this.hudTimer = document.getElementById('hud-timer');
      this.comboBadge = document.getElementById('combo-badge');
      this.questBanner = document.getElementById('quest-banner');

      this.dashCdOverlay = document.getElementById('dash-cd-overlay');
      this.dashCdText = document.getElementById('dash-cd-text');
      this.grabCdOverlay = document.getElementById('grab-cd-overlay');
      this.grabCdText = document.getElementById('grab-cd-text');
      this.skillCdOverlay = document.getElementById('skill-cd-overlay');
      this.skillCdText = document.getElementById('skill-cd-text');
      this.btnHeal = document.getElementById('btn-heal');
      this.healPriceTag = document.getElementById('heal-price-tag');
      this.healSlotLabel = document.getElementById('heal-slot-label');

      this.minimapPanel = document.getElementById('minimap-panel');
      this.minimapCanvas = document.getElementById('minimap-canvas');
      this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

      this.startScreen = document.getElementById('start-screen');
      this.twistModal = document.getElementById('twist-modal');
      this.upgradeModal = document.getElementById('upgrade-modal');
      this.upgradeModalTitle = document.getElementById('upgrade-modal-title');
      this.upgradeCards = document.getElementById('upgrade-cards');
      this.pauseModal = document.getElementById('pause-modal');
      this.resultModal = document.getElementById('result-modal');
      this.toast = document.getElementById('toast');

      this.btnRadar = document.getElementById('btn-radar');
      this.btnMute = document.getElementById('btn-mute');
      this.btnStartMute = document.getElementById('btn-start-mute');
      this.bestRecordText = document.getElementById('best-record-text');

      this.lastHeartsStr = '';
      this.lastBuffsStr = '';
      this.lastMoneyVal = -1;
      this.lastTimeStr = '';
      this.lastQuestStr = '';
      this.lastChatTime = 0;
      this.currentReportText = '';
      this.upgradeKeyHandler = null;
      this.twistKeyHandler = null;

      this.syncMuteButtons();
      this.refreshBestRecord();
      this.bindCopyButton();

      if (this.minimapPanel) {
        this.minimapPanel.addEventListener('click', () => this.toggleMinimapSize());
      }
      if (this.btnRadar && this.minimapPanel) {
        this.btnRadar.addEventListener('click', () => {
          this.minimapPanel.classList.toggle('mobile-radar-open');
        });
      }
    }

    isCompactViewport() {
      return window.innerWidth <= 820 || Math.min(window.innerWidth, window.innerHeight) < 520;
    }

    toggleMinimapSize() {
      if (!this.minimapPanel) return;
      this.minimapPanel.classList.toggle('expanded');
    }

    syncMuteButtons() {
      const muted = audio.muted;
      if (this.btnMute) this.btnMute.textContent = muted ? '🔇' : '🔊';
      if (this.btnStartMute) this.btnStartMute.textContent = muted ? '🔇 静音' : '🔊 音效';
    }

    formatTime(seconds) {
      const s = Math.max(0, Math.floor(seconds));
      const m = Math.floor(s / 60);
      const rem = s % 60;
      return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }

    getRecords() {
      try {
        const raw = localStorage.getItem('freddy_records_v2');
        return raw ? JSON.parse(raw) : { storyBestTime: null, storyWins: 0, endlessBestMoney: 0 };
      } catch (_) {
        return { storyBestTime: null, storyWins: 0, endlessBestMoney: 0 };
      }
    }

    saveStoryWin(timeSec) {
      const rec = this.getRecords();
      rec.storyWins = (rec.storyWins || 0) + 1;
      if (rec.storyBestTime === null || timeSec < rec.storyBestTime) {
        rec.storyBestTime = timeSec;
      }
      try {
        localStorage.setItem('freddy_records_v2', JSON.stringify(rec));
      } catch (_) {}
      this.refreshBestRecord();
    }

    saveEndlessScore(moneyVal) {
      const rec = this.getRecords();
      const m = Math.floor(moneyVal);
      const isNewRecord = m > (rec.endlessBestMoney || 0);
      if (isNewRecord) {
        rec.endlessBestMoney = m;
        try {
          localStorage.setItem('freddy_records_v2', JSON.stringify(rec));
        } catch (_) {}
      }
      this.refreshBestRecord();
      return isNewRecord;
    }

    refreshBestRecord() {
      const rec = this.getRecords();
      const storyStr = rec.storyBestTime !== null
        ? `${this.formatTime(rec.storyBestTime)} (通关${rec.storyWins}次)`
        : '暂无通关';
      const endlessStr = `¥${(rec.endlessBestMoney || 0).toLocaleString()}`;
      this.bestRecordText.textContent = `🏆 剧情最快纪录：${storyStr}   |   ♾️ 无尽最高存款：${endlessStr}`;
    }

    configureStageMarkers(modeId, stage) {
      if (!this.milestoneMarkers) return;
      this.milestoneMarkers.innerHTML = '';

      if (modeId === 'endless') {
        this.stageLabel.textContent = '♾️ 无尽搞钱挑战';
        return;
      }

      if (stage === 1) {
        this.stageLabel.textContent = '🎯 第一阶段 · 攒回 1200';
        this.moneyTarget.textContent = '¥1,200';
        const pins = [
          { val: 280, text: '280', boss: false },
          { val: 650, text: '650', boss: false },
          { val: 880, text: 'BOSS', boss: true }
        ];
        pins.forEach((p) => {
          const dot = document.createElement('div');
          dot.className = 'milestone-dot' + (p.boss ? ' boss-dot' : '');
          dot.style.left = `${((p.val / CONFIG.STAGE1_TARGET) * 100).toFixed(1)}%`;
          dot.innerHTML = `<span>${p.text}</span>`;
          this.milestoneMarkers.appendChild(dot);
        });
      } else {
        this.stageLabel.textContent = '🔥 第二阶段 · 追回 12000';
        this.moneyTarget.textContent = '¥12,000';
        const pins = [
          { val: 1800, text: '1.8k', boss: false },
          { val: 2800, text: '魅影', boss: true },
          { val: 4500, text: '4.5k', boss: false },
          { val: 6200, text: '404', boss: true },
          { val: 7800, text: '7.8k', boss: false },
          { val: 9600, text: '总庄家', boss: true }
        ];
        pins.forEach((p) => {
          const dot = document.createElement('div');
          dot.className = 'milestone-dot' + (p.boss ? ' boss-dot' : '');
          dot.style.left = `${((p.val / CONFIG.STAGE2_TARGET) * 100).toFixed(1)}%`;
          dot.innerHTML = `<span>${p.text}</span>`;
          this.milestoneMarkers.appendChild(dot);
        });
      }
    }

    showGameHUD(visible) {
      this.hud.classList.toggle('hidden', !visible);
      this.chatFeed.classList.toggle('hidden', !visible);
      this.controlsLayer.classList.toggle('hidden', !visible);
    }

    clearChatFeed() {
      this.chatFeed.innerHTML = '';
    }

    pushChat(category, force = false) {
      const compact = this.isCompactViewport();
      const minGap = compact ? 4200 : 2300;
      const now = performance.now();
      if (!force && now - this.lastChatTime < minGap) return;

      let entry = null;
      if (typeof category === 'string') {
        const pool = CONFIG.CHAT_LINES[category];
        if (!pool || pool.length === 0) return;
        entry = pool[Math.floor(Math.random() * pool.length)];
      } else {
        entry = category;
      }

      this.lastChatTime = now;
      if (force || Math.random() < 0.65) {
        audio.qqNotify();
      }

      const maxVisible = compact ? 1 : 3;
      while (this.chatFeed.children.length >= maxVisible) {
        this.chatFeed.removeChild(this.chatFeed.firstChild);
      }

      const toast = document.createElement('div');
      toast.className = 'chat-toast';
      toast.innerHTML = `
        <div class="chat-user">💬 ${entry.user}</div>
        <div class="chat-msg">${entry.msg}</div>
      `;
      this.chatFeed.appendChild(toast);

      const durationMs = compact ? 2600 : 4800;
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 280);
      }, durationMs);
    }

    flashScreen(color = 'rgba(239, 68, 68, 0.36)') {
      this.screenFlash.style.background = color;
      this.screenFlash.style.opacity = '1';
      setTimeout(() => {
        this.screenFlash.style.opacity = '0';
      }, 200);
    }

    updateSlotCd(overlayEl, textEl, cd, maxCd) {
      if (cd > 0.04) {
        const pct = Math.min(100, (cd / maxCd) * 100);
        overlayEl.style.height = `${pct.toFixed(0)}%`;
        textEl.classList.remove('hidden');
        textEl.textContent = cd >= 1 ? `${cd.toFixed(1)}` : `.${Math.floor(cd * 10)}`;
      } else {
        overlayEl.style.height = '0%';
        textEl.classList.add('hidden');
      }
    }

    updateHUD(state) {
      const { player, money, targetMoney, modeId, stage, elapsed, activePickup, boss, combo, endlessNextBossAt, endlessPrevBossAt } = state;

      const roundedMoney = Math.floor(money);
      this.moneyCurrent.textContent = `¥${roundedMoney.toLocaleString()}`;

      if (modeId === 'endless') {
        this.moneyTarget.textContent = `Boss波 ¥${endlessNextBossAt.toLocaleString()}`;
        const span = Math.max(100, endlessNextBossAt - endlessPrevBossAt);
        const pct = Math.min(100, Math.max(0, ((roundedMoney - endlessPrevBossAt) / span) * 100));
        this.moneyBarFill.style.width = `${pct.toFixed(1)}%`;
        this.heroRankTag.textContent = `无尽生存 · 击败Boss ${state.bossesDefeated}`;
      } else {
        const pct = Math.min(100, (roundedMoney / targetMoney) * 100);
        this.moneyBarFill.style.width = `${pct.toFixed(1)}%`;
        this.heroRankTag.textContent = stage === 1 ? '第一幕 · 攒1200' : '第二幕 · 追回12000';
      }

      if (combo >= 2) {
        this.comboBadge.classList.remove('hidden');
        this.comboBadge.textContent = `连收 x${combo}`;
      } else {
        this.comboBadge.classList.add('hidden');
      }

      const isRich = (modeId === 'story' && stage === 2 && roundedMoney >= 8000) || (modeId === 'endless' && roundedMoney >= 5000);
      let avatar = '😅';
      if (player.mood === 'hurt') avatar = '😱';
      else if (modeId === 'story' && stage === 2 && roundedMoney >= 12000) avatar = '👑';
      else if (player.mood === 'cool' || isRich) avatar = '😎';
      else if (stage === 2 || roundedMoney >= 500) avatar = '😤';
      if (this.hudAvatarFace && this.hudAvatarFace.textContent !== avatar) {
        this.hudAvatarFace.textContent = avatar;
      }

      let heartsStr = '';
      for (let i = 0; i < player.maxHp; i++) {
        heartsStr += i < player.hp ? '❤️' : '🖤';
      }
      if (player.hasShield) heartsStr += ' 🛡️';
      if (heartsStr !== this.lastHeartsStr) {
        this.lastHeartsStr = heartsStr;
        this.hudHearts.textContent = heartsStr;
      }

      let buffsStr = '';
      CONFIG.UPGRADES.forEach((u) => {
        if (player.upgrades.has(u.id)) buffsStr += u.icon + ' ';
      });
      if (player.masteryLevel > 0) {
        buffsStr += `⭐+${player.masteryLevel}`;
      }
      if (buffsStr !== this.lastBuffsStr) {
        this.lastBuffsStr = buffsStr;
        this.hudBuffs.textContent = buffsStr;
      }

      const tStr = this.formatTime(elapsed);
      if (tStr !== this.lastTimeStr) {
        this.lastTimeStr = tStr;
        this.hudTimer.textContent = tStr;
      }

      this.updateSlotCd(this.dashCdOverlay, this.dashCdText, player.dashCd, player.dashMaxCd);
      this.updateSlotCd(this.grabCdOverlay, this.grabCdText, player.grabCd, player.grabMaxCd);
      this.updateSlotCd(this.skillCdOverlay, this.skillCdText, player.skillCd, player.skillMaxCd);

      if (this.btnHeal) {
        const isFullHp = player.hp >= player.maxHp;
        const canBuy = roundedMoney >= CONFIG.HEAL_COST && !isFullHp;
        this.btnHeal.classList.toggle('can-buy', canBuy);
        this.btnHeal.classList.toggle('cant-buy', !canBuy);
        if (this.healPriceTag) {
          this.healPriceTag.textContent = `¥${CONFIG.HEAL_COST}`;
        }
        if (this.healSlotLabel) {
          this.healSlotLabel.textContent = isFullHp ? '已满血' : canBuy ? '回血+1' : '买回血';
        }
      }

      const compact = this.isCompactViewport();
      let questText = '';
      let questClass = 'quest-banner';
      if (boss && !boss.dead) {
        questClass = 'quest-banner boss';
        questText = compact
          ? `🚨 ${boss.name} HP:${Math.ceil(boss.hp)} | 捡⚡炮或举报重创!`
          : `🚨 头目战【${boss.name}】(HP ${Math.ceil(boss.hp)}/${boss.maxHp})！拾取 ⚡96110电磁炮 或按右键/E制裁他，击败可追回 ¥${boss.dropTotal}！`;
      } else if (player.delivery) {
        questClass = 'quest-banner urgent';
        questText = compact
          ? `🍱 送往${player.delivery.dropoffName} (${player.delivery.timer.toFixed(0)}s) +¥${player.delivery.baseReward}`
          : `🍱 配送中：【${player.delivery.food}】→ 沿绿箭头送往【${player.delivery.dropoffName}】(${player.delivery.timer.toFixed(1)}s) 预计 +¥${player.delivery.baseReward}+小费`;
      } else if (activePickup) {
        questText = compact
          ? `📍 沿黄箭头去【${activePickup.spot.name}】接单跑腿`
          : `📍 待接订单：跟随黄箭头或看右下雷达前往【${activePickup.spot.name}】取餐，跨区送达收入丰厚！`;
      } else {
        questText = compact
          ? `💡 捡废品 · 蹲兼职圈 · 抢真红包 · 举报骗子回血`
          : `💡 左键/Q 抓钩吸金 · 右键/E 96110举报封号 · 按 Tab 放大雷达查看四大街区高薪兼职！`;
      }

      if (questText !== this.lastQuestStr) {
        this.lastQuestStr = questText;
        this.questBanner.className = questClass;
        this.questBanner.textContent = questText;
      }
    }

    renderMinimap(world, state, time) {
      const ctx = this.minimapCtx;
      if (!ctx || !state.player) return;

      const mw = this.minimapCanvas.width;
      const mh = this.minimapCanvas.height;
      const sx = mw / world.width;
      const sy = mh / world.height;

      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, 0, mw, mh);

      // 4 subtle district tints on radar
      ctx.fillStyle = '#291E1C';
      ctx.fillRect(0, 0, mw / 2, mh / 2);
      ctx.fillStyle = '#19173B';
      ctx.fillRect(mw / 2, 0, mw / 2, mh / 2);
      ctx.fillStyle = '#172922';
      ctx.fillRect(0, mh / 2, mw / 2, mh / 2);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(mw / 2, mh / 2, mw / 2, mh / 2);

      // Roads
      ctx.fillStyle = '#334155';
      for (const r of world.hRoads) {
        ctx.fillRect(world.padding * sx, r.y * sy, (world.width - world.padding * 2) * sx, r.h * sy);
      }
      for (const r of world.vRoads) {
        ctx.fillRect(r.x * sx, world.padding * sy, r.w * sx, (world.height - world.padding * 2) * sy);
      }

      // Fountain & Koi Pond
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(world.fountain.x * sx, world.fountain.y * sy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0D9488';
      ctx.beginPath();
      ctx.ellipse(
        world.koiPond.x * sx,
        world.koiPond.y * sy,
        world.koiPond.rx * sx,
        world.koiPond.ry * sy,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // 14 Buildings
      for (const b of world.buildings) {
        ctx.fillStyle = b.roofColor;
        ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      }

      // EMP & Red Packets
      for (const c of state.collectibles) {
        if (c.type === 'emp_pack') {
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(c.x * sx - 2.5, c.y * sy - 2.5, 5, 5);
        } else if (c.type === 'red_packet') {
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(c.x * sx - 1.5, c.y * sy - 1.5, 3.5, 3.5);
        }
      }

      // Part-time zones
      for (const z of state.partTimeZones) {
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(z.x * sx, z.y * sy, 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Active Delivery Pickup or Dropoff
      const pulse = 3.5 + Math.sin(time * 8) * 1.5;
      if (state.player.delivery) {
        ctx.fillStyle = '#4ADE80';
        ctx.beginPath();
        ctx.arc(state.player.delivery.x * sx, state.player.delivery.y * sy, pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.activePickup) {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(state.activePickup.x * sx, state.activePickup.y * sy, pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scammers & Boss
      ctx.fillStyle = '#E879F9';
      for (const s of state.scammers) {
        ctx.fillRect(s.x * sx - 1.2, s.y * sy - 1.2, 2.5, 2.5);
      }

      if (state.boss && !state.boss.dead) {
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(state.boss.x * sx, state.boss.y * sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Camera box
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(state.cam.x * sx, state.cam.y * sy, state.cam.w * sx, state.cam.h * sy);

      // Player dot
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.player.x * sx, state.player.y * sy, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    showTwistModal(onEnterStage2) {
      const tw = CONFIG.TWIST_STORY;
      document.getElementById('twist-badge').textContent = tw.badge;
      document.getElementById('twist-title').textContent = tw.title;
      const list = document.getElementById('twist-story-list');
      list.innerHTML = '';
      tw.lines.forEach((l) => {
        const div = document.createElement('div');
        div.className = `twist-line ${l.type}`;
        div.innerHTML = `<strong>${l.speaker}</strong>${l.text}`;
        list.appendChild(div);
      });
      document.getElementById('twist-awaken-box').textContent = tw.awakenText;

      const btn = document.getElementById('btn-enter-stage2');
      const proceed = () => {
        btn.onclick = null;
        if (this.twistKeyHandler) {
          window.removeEventListener('keydown', this.twistKeyHandler);
          this.twistKeyHandler = null;
        }
        this.twistModal.classList.add('hidden');
        onEnterStage2();
      };

      btn.onclick = proceed;
      this.twistKeyHandler = (e) => {
        if (e.code === 'Enter') {
          e.preventDefault();
          proceed();
        }
      };
      window.addEventListener('keydown', this.twistKeyHandler);
      this.twistModal.classList.remove('hidden');
    }

    showUpgradeModal(milestoneVal, choices, onPick) {
      this.upgradeModalTitle.textContent = `攒钱突破 ¥${milestoneVal.toLocaleString()}！群友送来支援（三选一）`;
      this.upgradeCards.innerHTML = '';

      const finishPick = (upg) => {
        if (this.upgradeKeyHandler) {
          window.removeEventListener('keydown', this.upgradeKeyHandler);
          this.upgradeKeyHandler = null;
        }
        this.upgradeModal.classList.add('hidden');
        onPick(upg);
      };

      choices.forEach((upg, idx) => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
          <div class="upgrade-icon">${upg.icon}</div>
          <div class="upgrade-sender">来自：${upg.sender}</div>
          <div class="upgrade-title">${upg.title}</div>
          <div class="upgrade-desc">${upg.desc}</div>
          <div class="upgrade-key-hint">点击或按数字键 [${idx + 1}]</div>
        `;
        card.addEventListener('click', () => finishPick(upg));
        this.upgradeCards.appendChild(card);
      });

      this.upgradeKeyHandler = (e) => {
        if ((e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') && choices[0]) finishPick(choices[0]);
        else if ((e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') && choices[1]) finishPick(choices[1]);
        else if ((e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') && choices[2]) finishPick(choices[2]);
      };
      window.addEventListener('keydown', this.upgradeKeyHandler);

      this.upgradeModal.classList.remove('hidden');
    }

    showResultModal(data) {
      const { won, modeId, stage, money, elapsed, stats, bossesDefeated } = data;

      const badge = document.getElementById('result-badge');
      const title = document.getElementById('result-title');
      const sub = document.getElementById('result-subtitle');
      const honorEl = document.getElementById('result-honor');
      const mFloor = Math.floor(money);

      let honor = '';
      if (modeId === 'endless') {
        const isNewRec = this.saveEndlessScore(mFloor);
        badge.className = 'result-badge';
        badge.textContent = isNewRec ? '🏆 无尽新纪录诞生！' : '♾️ 无尽模式结算';
        title.textContent = `无尽存款定格：¥${mFloor.toLocaleString()}`;
        sub.textContent = `Freddy 在四大街区坚持了 ${this.formatTime(elapsed)}，累计击溃 ${bossesDefeated} 位电诈大头目！`;

        if (mFloor >= 25000) honor = '👑【城市商业巨鳄·真Rich传说】';
        else if (mFloor >= 12000) honor = '⚡【反诈赏金猎人·万元户】';
        else if (mFloor >= 3000) honor = '🛵【四大街区跑腿单王】';
        else honor = '🧹【街头勤恳回血打工人】';
      } else if (won) {
        this.saveStoryWin(elapsed);
        badge.className = 'result-badge';
        badge.textContent = '🎉 两幕剧情完美通关';
        title.textContent = `成功赚回 ¥${mFloor.toLocaleString()}！彻底上岸！`;
        sub.textContent = `从痛失 1200 到再被骗 12000，Freddy 大彻大悟横扫四大电诈头目，重夺 Rich 之名！`;

        if (stats.scammedCount === 0) honor = '🏆【一毛不拔·人间清醒反诈神】';
        else if (bossesDefeated >= 4) honor = '🚓【连端四窝·96110荣誉先锋】';
        else honor = '💪【浴火重生·涅槃翻盘大冤种】';
      } else {
        badge.className = 'result-badge lose';
        badge.textContent = stage === 1 ? '💸 第一阶段崩盘' : '💸 第二阶段功亏一篑';
        const goal = stage === 1 ? CONFIG.STAGE1_TARGET : CONFIG.STAGE2_TARGET;
        const shortBy = Math.max(0, goal - mFloor);
        title.textContent = `Freddy 心态归零自闭了…`;
        sub.textContent = `倒在了第${stage === 1 ? '一' : '二'}阶段（当前 ¥${mFloor.toLocaleString()}，距目标还差 ¥${shortBy.toLocaleString()}）`;
        honor = stage === 2 ? '😭【身负12000巨债·全熟FriedRich】' : '🤡【轻信刷单·痛失1200大冤种】';
      }

      honorEl.textContent = honor;
      document.getElementById('stat-money').textContent = `¥${mFloor.toLocaleString()}`;
      document.getElementById('stat-time').textContent = this.formatTime(elapsed);
      document.getElementById('stat-recycle').textContent = `¥${Math.floor(stats.recycleEarned).toLocaleString()}`;
      document.getElementById('stat-gig').textContent = `¥${Math.floor(stats.gigEarned).toLocaleString()}`;
      document.getElementById('stat-bosses').textContent = `${bossesDefeated}位`;
      document.getElementById('stat-scam-ratio').textContent = `${stats.reportedCount}次 / ${stats.scammedCount}次`;

      const tip = CONFIG.ANTI_SCAM_TIPS[Math.floor(Math.random() * CONFIG.ANTI_SCAM_TIPS.length)];
      document.getElementById('result-tip').textContent = tip;

      const urlStr = window.location.href.split('#')[0];
      if (modeId === 'endless') {
        this.currentReportText =
          `【拯救FriedRich·无尽战报】我在无尽模式帮群友 FriedRich (Freddy) 狂赚 ¥${mFloor.toLocaleString()}！\n` +
          `⏱️ 存活 ${this.formatTime(elapsed)} | 击溃电诈Boss ${bossesDefeated} 位 | 称号 ${honor}\n` +
          `来挑战我的最高存款纪录 👉 ${urlStr}`;
      } else if (won) {
        this.currentReportText =
          `【拯救FriedRich·通关战报】历经从被骗 ¥1200 到连环套路被骗 ¥12000，我用时 ${this.formatTime(elapsed)} 帮 FriedRich (Freddy) 彻底赚回 ¥${mFloor.toLocaleString()} 完美上岸！\n` +
          `📊 击溃头目 ${bossesDefeated} 位 | 举报骗子 ${stats.reportedCount} 次 | 称号 ${honor}\n` +
          `快来体验两幕反诈大作战 👉 ${urlStr}`;
      } else {
        this.currentReportText =
          `【拯救FriedRich·战报】惨！我在剧情第${stage}阶段带 FriedRich (Freddy) 攒到了 ¥${mFloor.toLocaleString()}，不小心心态崩盘了 😭\n` +
          `群友们快来搭把手帮他回本 👉 ${urlStr}`;
      }

      this.resultModal.classList.remove('hidden');
    }

    bindCopyButton() {
      const btn = document.getElementById('btn-copy-report');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (!this.currentReportText) return;
        const showCopied = () => {
          this.toast.classList.remove('hidden');
          setTimeout(() => this.toast.classList.add('hidden'), 2400);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(this.currentReportText).then(showCopied).catch(() => {
            this.fallbackCopy(this.currentReportText);
            showCopied();
          });
        } else {
          this.fallbackCopy(this.currentReportText);
          showCopied();
        }
      });
    }

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch (_) {}
      document.body.removeChild(ta);
    }
  }

  window.Collect1200.UIManager = UIManager;
})();
