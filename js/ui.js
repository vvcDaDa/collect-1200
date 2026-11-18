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
      this.moneyCurrent = document.getElementById('money-current');
      this.moneyBarFill = document.getElementById('money-bar-fill');
      this.hudTimer = document.getElementById('hud-timer');
      this.comboBadge = document.getElementById('combo-badge');
      this.questBanner = document.getElementById('quest-banner');

      this.dashCdOverlay = document.getElementById('dash-cd-overlay');
      this.dashCdText = document.getElementById('dash-cd-text');
      this.grabCdOverlay = document.getElementById('grab-cd-overlay');
      this.grabCdText = document.getElementById('grab-cd-text');
      this.skillCdOverlay = document.getElementById('skill-cd-overlay');
      this.skillCdText = document.getElementById('skill-cd-text');

      this.minimapPanel = document.getElementById('minimap-panel');
      this.minimapCanvas = document.getElementById('minimap-canvas');
      this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

      this.startScreen = document.getElementById('start-screen');
      this.upgradeModal = document.getElementById('upgrade-modal');
      this.upgradeModalTitle = document.getElementById('upgrade-modal-title');
      this.upgradeCards = document.getElementById('upgrade-cards');
      this.pauseModal = document.getElementById('pause-modal');
      this.resultModal = document.getElementById('result-modal');
      this.toast = document.getElementById('toast');

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

      this.renderIntroChat();
      this.syncMuteButtons();
      this.refreshBestRecord();
      this.bindCopyButton();

      if (this.minimapPanel) {
        this.minimapPanel.addEventListener('click', () => this.toggleMinimapSize());
      }
    }

    toggleMinimapSize() {
      if (!this.minimapPanel) return;
      this.minimapPanel.classList.toggle('expanded');
    }

    renderIntroChat() {
      const box = document.getElementById('intro-chat-box');
      if (!box) return;
      box.innerHTML = '';
      CONFIG.INTRO_MESSAGES.forEach((m) => {
        const item = document.createElement('div');
        item.className = 'qq-msg' + (m.self ? ' is-freddy' : '');
        item.innerHTML = `
          <div class="qq-msg-meta">
            <span class="qq-role-tag">${m.role}</span>
            <span>${m.sender}</span>
          </div>
          <div class="qq-bubble">${m.text}</div>
        `;
        box.appendChild(item);
      });
    }

    syncMuteButtons() {
      const muted = audio.muted;
      if (this.btnMute) this.btnMute.textContent = muted ? '🔇' : '🔊';
      if (this.btnStartMute) this.btnStartMute.textContent = muted ? '🔇 已静音' : '🔊 音效开启';
    }

    formatTime(seconds) {
      const s = Math.max(0, Math.floor(seconds));
      const m = Math.floor(s / 60);
      const rem = s % 60;
      return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }

    getBestRecord() {
      try {
        const raw = localStorage.getItem('freddy1200_best');
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }

    saveBestRecord(timeSec, difficultyId, zeroScam) {
      const prev = this.getBestRecord() || { wins: 0, bestTime: null, zeroScam: false };
      prev.wins = (prev.wins || 0) + 1;
      if (prev.bestTime === null || timeSec < prev.bestTime) {
        prev.bestTime = timeSec;
        prev.bestDiff = difficultyId;
      }
      if (zeroScam) prev.zeroScam = true;
      try {
        localStorage.setItem('freddy1200_best', JSON.stringify(prev));
      } catch (_) {}
      this.refreshBestRecord();
    }

    refreshBestRecord() {
      const rec = this.getBestRecord();
      if (!rec || rec.bestTime === null) {
        this.bestRecordText.textContent = '🏆 本机最佳纪录：暂无通关记录，快来帮 FriedRich 首通回本！';
      } else {
        const diffLabel = rec.bestDiff === 'hard' ? '地狱速通' : '互助模式';
        const badge = rec.zeroScam ? ' · 🏅【0被骗金身】' : '';
        this.bestRecordText.textContent = `🏆 最快纪录：${this.formatTime(rec.bestTime)} (${diffLabel}) · 累计拯救 Freddy ${rec.wins} 次${badge}`;
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
      const now = performance.now();
      if (!force && now - this.lastChatTime < 2200) return;

      let entry = null;
      if (typeof category === 'string') {
        const pool = CONFIG.CHAT_LINES[category];
        if (!pool || pool.length === 0) return;
        entry = pool[Math.floor(Math.random() * pool.length)];
      } else {
        entry = category;
      }

      this.lastChatTime = now;
      if (force || Math.random() < 0.7) {
        audio.qqNotify();
      }

      while (this.chatFeed.children.length >= 3) {
        this.chatFeed.removeChild(this.chatFeed.firstChild);
      }

      const toast = document.createElement('div');
      toast.className = 'chat-toast';
      toast.innerHTML = `
        <div class="chat-user">💬 ${entry.user}</div>
        <div class="chat-msg">${entry.msg}</div>
      `;
      this.chatFeed.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 320);
      }, 4800);
    }

    flashScreen(color = 'rgba(239, 68, 68, 0.36)') {
      this.screenFlash.style.background = color;
      this.screenFlash.style.opacity = '1';
      setTimeout(() => {
        this.screenFlash.style.opacity = '0';
      }, 180);
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
      const { player, money, elapsed, activePickup, boss, combo } = state;

      // Money & progress bar
      const roundedMoney = Math.floor(money);
      if (roundedMoney !== this.lastMoneyVal) {
        this.lastMoneyVal = roundedMoney;
        this.moneyCurrent.textContent = `¥${roundedMoney}`;
        const pct = Math.min(100, (roundedMoney / CONFIG.TARGET_MONEY) * 100);
        this.moneyBarFill.style.width = `${pct.toFixed(1)}%`;

        if (roundedMoney < 250) {
          this.heroRankTag.textContent = 'Fried状态·痛失1200';
        } else if (roundedMoney < 600) {
          this.heroRankTag.textContent = '努力搬砖·回血中';
        } else if (roundedMoney < 1000) {
          this.heroRankTag.textContent = '渐入佳境·准Rich';
        } else {
          this.heroRankTag.textContent = '冲刺1200·决战庄家!';
        }
      }

      // Combo badge
      if (combo >= 2) {
        this.comboBadge.classList.remove('hidden');
        this.comboBadge.textContent = `搞钱连击 x${combo}`;
      } else {
        this.comboBadge.classList.add('hidden');
      }

      // Avatar expression
      let avatar = '😅';
      if (player.mood === 'hurt') avatar = '😱';
      else if (roundedMoney >= 1200) avatar = '👑';
      else if (player.mood === 'cool' || roundedMoney >= 850) avatar = '😎';
      else if (roundedMoney >= 400) avatar = '😤';
      if (this.hudAvatarFace && this.hudAvatarFace.textContent !== avatar) {
        this.hudAvatarFace.textContent = avatar;
      }

      // Hearts + Shield
      let heartsStr = '';
      for (let i = 0; i < player.maxHp; i++) {
        heartsStr += i < player.hp ? '❤️' : '🖤';
      }
      if (player.hasShield) heartsStr += ' 🛡️';
      if (heartsStr !== this.lastHeartsStr) {
        this.lastHeartsStr = heartsStr;
        this.hudHearts.textContent = heartsStr;
      }

      // Upgrade icons
      let buffsStr = '';
      CONFIG.UPGRADES.forEach((u) => {
        if (player.upgrades.has(u.id)) buffsStr += u.icon + ' ';
      });
      if (buffsStr !== this.lastBuffsStr) {
        this.lastBuffsStr = buffsStr;
        this.hudBuffs.textContent = buffsStr;
      }

      // Timer
      const tStr = this.formatTime(elapsed);
      if (tStr !== this.lastTimeStr) {
        this.lastTimeStr = tStr;
        this.hudTimer.textContent = tStr;
      }

      // 3-Slot Hotbar Cooldowns
      this.updateSlotCd(this.dashCdOverlay, this.dashCdText, player.dashCd, player.dashMaxCd);
      this.updateSlotCd(this.grabCdOverlay, this.grabCdText, player.grabCd, player.grabMaxCd);
      this.updateSlotCd(this.skillCdOverlay, this.skillCdText, player.skillCd, player.skillMaxCd);

      // Quest / Boss Banner
      let questText = '';
      let questClass = 'quest-banner';
      if (boss && !boss.dead) {
        questClass = 'quest-banner boss';
        questText = `⚠️ 【境外刷单总庄家】阻击中 (HP ${Math.ceil(boss.hp)}/${boss.maxHp})！捡 ⚡96110电磁炮、按右键/E举报，或直接凑满 ¥1200 制裁他！`;
      } else if (player.delivery) {
        questClass = 'quest-banner urgent';
        questText = `🍱 配送中：【${player.delivery.food}】→ 沿绿箭头送往【${player.delivery.dropoffName}】(${player.delivery.timer.toFixed(1)}s) 预计 +¥${player.delivery.baseReward}+小费`;
      } else if (activePickup) {
        questText = `📍 待接跑腿单：跟随黄箭头或看右下雷达前往【${activePickup.spot.name}】取餐，单笔可赚 ¥90~¥135！`;
      } else {
        questText = `💡 左键/Q 朝准星抓钩吸金 · 右键/E 96110举报骗子领赏 · 踩绿色兼职圈日结回血！`;
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

      // Base map background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, mw, mh);

      ctx.fillStyle = '#1E293B';
      ctx.fillRect(
        world.padding * sx,
        world.padding * sy,
        (world.width - world.padding * 2) * sx,
        (world.height - world.padding * 2) * sy
      );

      // Roads on minimap
      ctx.fillStyle = '#334155';
      ctx.fillRect(world.padding * sx, 430 * sy, (world.width - world.padding * 2) * sx, 130 * sy);
      ctx.fillRect(world.padding * sx, 880 * sy, (world.width - world.padding * 2) * sx, 130 * sy);
      ctx.fillRect(520 * sx, world.padding * sy, 130 * sx, (world.height - world.padding * 2) * sy);
      ctx.fillRect(1270 * sx, world.padding * sy, 130 * sx, (world.height - world.padding * 2) * sy);

      // Central fountain
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(world.fountain.x * sx, world.fountain.y * sy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Buildings
      for (const b of world.buildings) {
        ctx.fillStyle = b.roofColor;
        ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      }

      // Collectibles (subtle green/gold dots; highlight red packets & EMP)
      for (const c of state.collectibles) {
        if (c.type === 'emp_pack') {
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(c.x * sx - 2.5, c.y * sy - 2.5, 5, 5);
        } else if (c.type === 'red_packet') {
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(c.x * sx - 2, c.y * sy - 2, 4, 4);
        }
      }

      // Part-time zones
      for (const z of state.partTimeZones) {
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(z.x * sx, z.y * sy, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Active Delivery Pickup or Dropoff pulse
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

      // Scammers
      ctx.fillStyle = '#E879F9';
      for (const s of state.scammers) {
        ctx.fillRect(s.x * sx - 1.5, s.y * sy - 1.5, 3, 3);
      }

      // Boss
      if (state.boss && !state.boss.dead) {
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(state.boss.x * sx, state.boss.y * sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Camera viewport box
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        state.cam.x * sx,
        state.cam.y * sy,
        state.cam.w * sx,
        state.cam.h * sy
      );

      // Player (Freddy) bright beacon
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.player.x * sx, state.player.y * sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    showUpgradeModal(milestoneVal, choices, onPick) {
      this.upgradeModalTitle.textContent = `已攒够 ¥${milestoneVal}！群友发来强力支援（三选一）`;
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
      const { won, money, elapsed, difficulty, stats } = data;

      const badge = document.getElementById('result-badge');
      const title = document.getElementById('result-title');
      const sub = document.getElementById('result-subtitle');
      const honorEl = document.getElementById('result-honor');

      let honor = '';
      if (won) {
        badge.className = 'result-badge';
        badge.textContent = '🎉 回血大成功 · 彻底上岸';
        title.textContent = `恭喜 FriedRich 凑齐 ¥${Math.floor(money)}！`;
        sub.textContent = `告别 Fried（被炸糊），Freddy 靠双手和群友支援重夺 Rich 之名！`;

        if (stats.scammedCount === 0) {
          honor = '🏆【一毛不拔·人间清醒反诈神】';
        } else if (elapsed <= 150 && stats.scammedCount <= 1) {
          honor = '⚡【闪电骑手·城中村打工皇帝】';
        } else if (stats.reportedCount >= 6) {
          honor = '🚓【96110编外荣誉反诈先锋】';
        } else {
          honor = '💪【痛改前非·满血复活大冤种】';
        }

        this.saveBestRecord(elapsed, difficulty.id, stats.scammedCount === 0);
      } else {
        badge.className = 'result-badge lose';
        badge.textContent = '💸 心态崩盘 · 饮恨退群';
        const diffShort = Math.max(0, CONFIG.TARGET_MONEY - Math.floor(money));
        title.textContent = `呜呜！Freddy 心态归零自闭了…`;
        sub.textContent = `本局攒到 ¥${Math.floor(money)}，距离回本 ¥1,200 只差 ¥${diffShort}！`;

        if (money >= 900) {
          honor = '😭【功败垂成·差一点就变回Rich】';
        } else if (stats.scammedCount >= 5) {
          honor = '🤡【行走的韭菜·全熟FriedRich】';
        } else {
          honor = '🧹【天桥底下资深瓶盖收藏家】';
        }
      }

      honorEl.textContent = honor;
      document.getElementById('stat-money').textContent = `¥${Math.floor(money)}`;
      document.getElementById('stat-time').textContent = this.formatTime(elapsed);
      document.getElementById('stat-recycle').textContent = `¥${Math.floor(stats.recycleEarned)}`;
      document.getElementById('stat-gig').textContent = `¥${Math.floor(stats.gigEarned)}`;
      document.getElementById('stat-redpacket').textContent = `¥${Math.floor(stats.redPacketEarned)}`;
      document.getElementById('stat-scam-ratio').textContent = `${stats.reportedCount}次 / ${stats.scammedCount}次`;

      const tip = CONFIG.ANTI_SCAM_TIPS[Math.floor(Math.random() * CONFIG.ANTI_SCAM_TIPS.length)];
      document.getElementById('result-tip').textContent = tip;

      const urlStr = window.location.href.split('#')[0];
      if (won) {
        this.currentReportText =
          `【拯救FriedRich战报】我用时 ${this.formatTime(elapsed)} 成功帮群友 FriedRich (Freddy) 凑齐了被刷单骗走的 ¥1200（实收 ¥${Math.floor(money)}）！\n` +
          `📊 举报骗子 ${stats.reportedCount} 次 | 不慎被骗 ${stats.scammedCount} 次 | 获封称号 ${honor}\n` +
          `🛡️ 谨记：先垫付做任务的100%是诈骗！快来帮 Freddy 回血 👉 ${urlStr}`;
      } else {
        this.currentReportText =
          `【拯救FriedRich战报】惨！我带 FriedRich (Freddy) 打工攒到了 ¥${Math.floor(money)}，还差 ¥${Math.max(0, 1200 - Math.floor(money))} 回本时被电诈分子骗崩心态了 😭\n` +
          `📊 获封称号 ${honor} | 群友们快来搭把手帮他凑齐 1200 👉 ${urlStr}`;
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
