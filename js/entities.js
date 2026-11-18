(function () {
  'use strict';

  const { CONFIG, graphics, roundRectPath } = window.Collect1200;

  class Player {
    constructor(x, y, modeCfg) {
      const base = CONFIG.PLAYER_BASE;
      this.x = x;
      this.y = y;
      this.radius = base.radius;
      this.hp = modeCfg.maxHp;
      this.maxHp = modeCfg.maxHp;

      this.facingX = 0;
      this.facingY = 1;
      this.aimAngle = Math.PI / 2;
      this.isMoving = false;
      this.walkPhase = 0;

      this.baseSpeed = base.speed;
      this.basePickupRadius = base.pickupRadius;
      this.dashSpeed = base.dashSpeed;
      this.dashDuration = base.dashDuration;
      this.dashTime = 0;
      this.dashCd = 0;
      this.dashMaxCd = base.dashCooldown;
      this.dashDirX = 0;
      this.dashDirY = 1;

      this.grabCd = 0;
      this.grabMaxCd = 2.9;
      this.grabRange = 280;

      this.skillRadius = base.skillRadius;
      this.skillCd = 0;
      this.skillMaxCd = base.skillCooldown;
      this.reportBounty = base.reportBounty;

      this.invulnTime = 0;
      this.slowTime = 0;

      // Upgrades & Mastery
      this.upgrades = new Set();
      this.masteryLevel = 0;
      this.speedMult = 1.0;
      this.pickupMult = 1.0;
      this.incomeMult = 1.0;
      this.deliveryTipMult = 1.0;
      this.deliveryBonusTime = 0;
      this.deliveryRewardMult = 1.0;
      this.eagleEye = false;
      this.dashMagnet = false;
      this.empBonusMult = 1.0;
      this.grabStuns = false;

      this.shieldUnlocked = false;
      this.hasShield = false;
      this.shieldCooldown = 0;
      this.shieldMaxCooldown = 15;

      this.richAura = false;
      this.noScamTimer = 0;

      this.delivery = null;

      this.afterimages = [];
      this.afterimageTick = 0;
      this.mood = 'normal';
      this.moodTimer = 0;
    }

    getSpeed() {
      let spd = this.baseSpeed * this.speedMult;
      if (this.slowTime > 0) spd *= 0.65;
      if (this.delivery) {
        spd *= this.upgrades.has('vip_box') ? 1.21 : 1.06;
      }
      return spd;
    }

    getPickupRadius() {
      let r = this.basePickupRadius * this.pickupMult;
      if (this.dashTime > 0 && this.dashMagnet) {
        r *= 1.75;
      }
      return r;
    }

    setMood(mood, duration = 1.0) {
      this.mood = mood;
      this.moodTimer = duration;
    }

    applyUpgrade(id) {
      if (id === 'mastery_boost') {
        this.masteryLevel++;
        this.incomeMult += 0.25;
        this.speedMult += 0.06;
        this.hp = Math.min(this.maxHp, this.hp + 1);
        return;
      }

      this.upgrades.add(id);
      switch (id) {
        case 'scooter':
          this.speedMult += 0.25;
          this.deliveryTipMult += 0.35;
          break;
        case 'magnet':
          this.pickupMult += 0.85;
          this.grabRange += 85;
          this.grabMaxCd *= 0.75;
          break;
        case 'app96110':
          this.hp = Math.min(this.maxHp, this.hp + 1);
          this.shieldUnlocked = true;
          this.hasShield = true;
          this.shieldCooldown = 0;
          break;
        case 'megaphone':
          this.skillRadius = Math.round(this.skillRadius * 1.45);
          this.skillMaxCd *= 0.72;
          this.skillCd = 0;
          this.reportBounty = Math.round(this.reportBounty * 2);
          break;
        case 'milktea':
          if (this.hp >= this.maxHp) {
            this.maxHp += 1;
            this.hp = this.maxHp;
          } else {
            this.hp = Math.min(this.maxHp, this.hp + 2);
          }
          this.dashMaxCd *= 0.72;
          this.dashMagnet = true;
          break;
        case 'hustle':
          this.incomeMult += 0.32;
          break;
        case 'eagle_eye':
          this.eagleEye = true;
          break;
        case 'rich_aura':
          this.richAura = true;
          this.speedMult += 0.1;
          this.noScamTimer = 0;
          break;
        case 'vip_box':
          this.deliveryBonusTime += 6;
          this.deliveryRewardMult += 0.25;
          break;
        case 'emp_overload':
          this.grabStuns = true;
          this.empBonusMult += 0.4;
          break;
      }
    }

    tryDash(moveX, moveY, aimDirX = null, aimDirY = null) {
      if (this.dashCd > 0 || this.dashTime > 0) return false;
      let dx = moveX;
      let dy = moveY;
      const len = Math.hypot(dx, dy);
      if (len > 0.01) {
        dx /= len;
        dy /= len;
      } else if (aimDirX !== null && aimDirY !== null) {
        dx = aimDirX;
        dy = aimDirY;
      } else {
        dx = this.facingX;
        dy = this.facingY;
      }
      this.dashDirX = dx;
      this.dashDirY = dy;
      this.dashTime = this.dashDuration;
      this.dashCd = this.dashMaxCd;
      this.invulnTime = Math.max(this.invulnTime, this.dashDuration + 0.09);
      this.setMood('cool', 0.65);
      return true;
    }

    tryGrab() {
      if (this.grabCd > 0) return false;
      this.grabCd = this.grabMaxCd;
      this.setMood('cool', 0.45);
      return true;
    }

    trySkill() {
      if (this.skillCd > 0) return false;
      this.skillCd = this.skillMaxCd;
      this.setMood('cool', 0.85);
      return true;
    }

    update(dt, inputX, inputY, world) {
      if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
      if (this.grabCd > 0) this.grabCd = Math.max(0, this.grabCd - dt);
      if (this.skillCd > 0) this.skillCd = Math.max(0, this.skillCd - dt);
      if (this.invulnTime > 0) this.invulnTime = Math.max(0, this.invulnTime - dt);
      if (this.slowTime > 0) this.slowTime = Math.max(0, this.slowTime - dt);
      if (this.moodTimer > 0) {
        this.moodTimer -= dt;
        if (this.moodTimer <= 0) this.mood = 'normal';
      }

      if (this.shieldUnlocked && !this.hasShield) {
        this.shieldCooldown += dt;
        if (this.shieldCooldown >= this.shieldMaxCooldown) {
          this.hasShield = true;
          this.shieldCooldown = 0;
        }
      }

      if (this.dashTime > 0) {
        this.dashTime -= dt;
        this.x += this.dashDirX * this.dashSpeed * dt;
        this.y += this.dashDirY * this.dashSpeed * dt;
        this.afterimageTick -= dt;
        if (this.afterimageTick <= 0) {
          this.afterimages.push({ x: this.x, y: this.y, life: 0.22, maxLife: 0.22 });
          this.afterimageTick = 0.032;
        }
      } else {
        const len = Math.hypot(inputX, inputY);
        if (len > 0.01) {
          const nx = inputX / len;
          const ny = inputY / len;
          this.facingX = nx;
          this.facingY = ny;
          this.isMoving = true;
          this.walkPhase += dt * 14;
          const spd = this.getSpeed();
          this.x += nx * spd * dt;
          this.y += ny * spd * dt;
        } else {
          this.isMoving = false;
        }
      }

      world.resolveCircleCollision(this);

      for (let i = this.afterimages.length - 1; i >= 0; i--) {
        this.afterimages[i].life -= dt;
        if (this.afterimages[i].life <= 0) {
          this.afterimages.splice(i, 1);
        }
      }

      if (this.delivery) {
        this.delivery.timer -= dt;
        if (this.delivery.timer <= 0) {
          this.delivery = null;
          return 'delivery_expired';
        }
      }

      if (this.richAura) {
        this.noScamTimer += dt;
        if (this.noScamTimer >= 10) {
          this.noScamTimer -= 10;
          return 'rich_aura_tick';
        }
      }

      return null;
    }

    render(ctx, time, isRichLook) {
      graphics.drawFreddy(ctx, this, time, isRichLook, this.aimAngle);
    }
  }

  class Collectible {
    constructor(x, y, type, customValue = null, opts = {}) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.vx = opts.vx || 0;
      this.vy = opts.vy || 0;
      this.life = opts.life || null;
      this.maxLife = this.life;
      this.pickupDelay = opts.pickupDelay || 0;
      this.bobOffset = Math.random() * Math.PI * 2;
      this.forceYanked = false;
      this.dead = false;

      const scale = opts.valueScale || 1.0;

      if (type === 'bottle') {
        this.value = customValue || Math.max(2, Math.round(CONFIG.ITEMS.bottle.value * scale));
        this.radius = 13;
        this.color = '#38BDF8';
      } else if (type === 'can') {
        this.value = customValue || Math.max(4, Math.round(CONFIG.ITEMS.can.value * scale));
        this.radius = 13;
        this.color = '#EF4444';
      } else if (type === 'cardboard') {
        this.value = customValue || Math.max(6, Math.round(CONFIG.ITEMS.cardboard.value * scale));
        this.radius = 15;
        this.color = '#F59E0B';
      } else if (type === 'cash_small') {
        this.value = customValue || Math.max(10, Math.round(CONFIG.ITEMS.cash_small.value * scale));
        this.radius = 15;
        this.color = '#10B981';
      } else if (type === 'maotai_bottle') {
        this.value = customValue || Math.max(24, Math.round(CONFIG.ITEMS.maotai_bottle.value * scale));
        this.radius = 16;
        this.color = '#FBBF24';
      } else if (type === 'red_packet') {
        const base = 14 + Math.floor(Math.random() * 19);
        this.value = customValue || Math.round(base * scale);
        this.radius = 17;
        this.color = '#EF4444';
      } else if (type === 'dropped_cash') {
        this.value = customValue || 15;
        this.radius = 14;
        this.color = '#FDE047';
      } else if (type === 'bounty_cash') {
        this.value = customValue || Math.round(35 * scale);
        this.radius = 16;
        this.color = '#22C55E';
      } else if (type === 'emp_pack') {
        this.value = customValue || Math.round(45 * scale);
        this.radius = 20;
        this.color = '#06B6D4';
      }
    }

    update(dt, player, world) {
      if (this.pickupDelay > 0) this.pickupDelay -= dt;

      if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= Math.pow(0.06, dt);
        this.vy *= Math.pow(0.06, dt);
        world.resolveCircleCollision(this);
      }

      if (this.life !== null) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return false;
        }
      }

      if (this.pickupDelay <= 0) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const magnetR = player.getPickupRadius() + this.radius;

        if ((this.forceYanked || dist < magnetR) && dist > 0.01) {
          const pull = this.forceYanked ? 960 : 460 + (1 - dist / magnetR) * 340;
          this.x += (dx / dist) * pull * dt;
          this.y += (dy / dist) * pull * dt;
        }

        if (dist < player.radius + this.radius + 5) {
          this.dead = true;
          return true;
        }
      }
      return false;
    }

    render(ctx, time) {
      graphics.drawCollectibleSprite(ctx, this, time);
    }
  }

  class BaitTrap {
    constructor(x, y, kind = 'fake_packet') {
      this.x = x;
      this.y = y;
      this.kind = kind; // 'fake_packet' | 'phishing_zone' | 'freeze_grid'
      this.radius = kind === 'fake_packet' ? 18 : kind === 'freeze_grid' ? 62 : 48;
      this.armTime = kind === 'fake_packet' ? 0.45 : 1.25;
      this.life = kind === 'fake_packet' ? 14.0 : 7.5;
      this.dead = false;
      this.slogan = kind === 'fake_packet'
        ? '垫100返200'
        : kind === 'freeze_grid'
          ? '高压冻结电网'
          : '扫码领补贴';
    }

    update(dt, player) {
      if (this.armTime > 0) this.armTime -= dt;
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return false;
      }

      if (this.armTime <= 0) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const hitR = this.kind === 'fake_packet'
          ? player.radius + this.radius - 4
          : this.radius - 4;
        if (dist < hitR) {
          this.dead = true;
          return true;
        }
      }
      return false;
    }

    render(ctx, time, eagleEye) {
      graphics.drawTrapSprite(ctx, this, time, eagleEye);
    }
  }

  class PartTimeZone {
    constructor(x, y, title, reward = 42) {
      this.x = x;
      this.y = y;
      this.radius = 62;
      this.title = title;
      this.reward = reward;
      this.progress = 0;
      this.requiredTime = 2.5;
      this.life = 28;
      this.dead = false;
    }

    update(dt, player) {
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return false;
      }
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist <= this.radius + player.radius * 0.5) {
        this.progress += dt;
        if (this.progress >= this.requiredTime) {
          this.dead = true;
          return true;
        }
      } else {
        this.progress = Math.max(0, this.progress - dt * 0.28);
      }
      return false;
    }

    render(ctx, time) {
      const pct = Math.min(1, this.progress / this.requiredTime);
      ctx.save();

      const grad = ctx.createRadialGradient(this.x, this.y, 8, this.x, this.y, this.radius);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.08)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.8;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, time * 0.9, time * 0.9 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (pct > 0) {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
      }

      ctx.fillStyle = '#065F46';
      ctx.strokeStyle = '#6EE7B7';
      ctx.lineWidth = 1.8;
      roundRectPath(ctx, this.x - 48, this.y - 22, 96, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ECFDF5';
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.title, this.x, this.y - 8);

      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      const statusTxt = pct > 0
        ? `打工中 ${Math.round(pct * 100)}% (+¥${this.reward})`
        : `站圈内日结 +¥${this.reward}`;
      ctx.strokeText(statusTxt, this.x, this.y + 16);
      ctx.fillText(statusTxt, this.x, this.y + 16);

      ctx.restore();
    }
  }

  class Projectile {
    constructor(x, y, vx, vy, opts = {}) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = opts.radius || 10;
      this.life = opts.life || 3.8;
      this.slow = opts.slow || false;
      this.homing = opts.homing || false;
      this.goldCard = opts.goldCard || false;
      this.text = opts.text || '刷单';
      this.dead = false;
    }

    update(dt, player, world) {
      if (this.homing) {
        const curSpd = Math.hypot(this.vx, this.vy) || 180;
        const curAng = Math.atan2(this.vy, this.vx);
        const targetAng = Math.atan2(player.y - this.y, player.x - this.x);
        let diff = targetAng - curAng;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const nextAng = curAng + Math.max(-1.4 * dt, Math.min(1.4 * dt, diff));
        this.vx = Math.cos(nextAng) * curSpd;
        this.vy = Math.sin(nextAng) * curSpd;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0 || world.isPointInsideBuilding(this.x, this.y, 2)) {
        this.dead = true;
        return false;
      }

      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist < player.radius + this.radius - 2) {
        this.dead = true;
        return true;
      }
      return false;
    }

    render(ctx) {
      const ang = Math.atan2(this.vy, this.vx);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(ang);

      if (this.goldCard) {
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        ctx.fillRect(-10, -7, 20, 14);
        ctx.strokeRect(-10, -7, 20, 14);
      } else if (this.homing) {
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const tailGrad = ctx.createLinearGradient(-22, 0, 6, 0);
        tailGrad.addColorStop(0, 'rgba(236, 72, 153, 0)');
        tailGrad.addColorStop(1, this.slow ? 'rgba(168, 85, 247, 0.7)' : 'rgba(236, 72, 153, 0.7)');
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.moveTo(-24, -4);
        ctx.lineTo(4, -7);
        ctx.lineTo(4, 7);
        ctx.lineTo(-24, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this.slow ? '#9333EA' : '#EC4899';
        ctx.strokeStyle = '#FDF2F8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-7, -8);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      ctx.save();
      ctx.fillStyle = this.goldCard ? '#FEF08A' : '#FCE7F3';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(this.text, this.x, this.y - this.radius - 5);
      ctx.fillText(this.text, this.x, this.y - this.radius - 5);
      ctx.restore();
    }
  }

  class Scammer {
    constructor(x, y, type, speedMult = 1.0, opts = {}) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.isHoloClone = opts.isHoloClone || false;
      this.radius = type === 'mentor' ? 20 : 18;
      this.speedMult = speedMult;
      this.dead = false;
      this.stunTime = 0;

      if (this.isHoloClone) {
        this.name = '魅影全息分身';
        this.slogan = '冲业绩返双倍~';
        this.speed = 135 * speedMult;
        this.shootCd = 1.1;
      } else if (type === 'spammer') {
        this.name = '刷单客服';
        this.slogan = '亲,垫付立返!';
        this.speed = 108 * speedMult;
        this.shootCd = 1.4 + Math.random() * 1.2;
      } else if (type === 'mentor') {
        this.name = '金牌派单导师';
        this.slogan = '做完联单就提现!';
        this.speed = 140 * speedMult;
        this.state = 'chase';
        this.stateTimer = 2.1;
        this.lungeDx = 0;
        this.lungeDy = 0;
      } else {
        this.name = '解冻金专员';
        this.slogan = '卡号填错需解冻!';
        this.speed = 115 * speedMult;
        this.shootCd = 2.4 + Math.random();
      }
    }

    update(dt, player, world, projectiles) {
      if (this.stunTime > 0) {
        this.stunTime -= dt;
        return false;
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      if (this.type === 'spammer' || this.isHoloClone) {
        if (dist > 220) {
          this.x += nx * this.speed * dt;
          this.y += ny * this.speed * dt;
        } else if (dist < 140) {
          this.x -= nx * this.speed * 0.6 * dt;
          this.y -= ny * this.speed * 0.6 * dt;
        }
        this.shootCd -= dt;
        if (this.shootCd <= 0 && dist < 560) {
          this.shootCd = (this.isHoloClone ? 2.0 : 2.5) / this.speedMult;
          const spd = 240 * this.speedMult;
          const slogans = this.isHoloClone ? ['甜蜜派单', '哥哥帮冲单'] : ['日赚800', '垫付立返', '高佣刷单'];
          projectiles.push(new Projectile(this.x, this.y, nx * spd, ny * spd, {
            text: slogans[Math.floor(Math.random() * slogans.length)]
          }));
        }
      } else if (this.type === 'mentor') {
        if (this.state === 'chase') {
          this.x += nx * this.speed * dt;
          this.y += ny * this.speed * dt;
          this.stateTimer -= dt;
          if (this.stateTimer <= 0 && dist < 360) {
            this.state = 'windup';
            this.stateTimer = 0.65;
            this.lungeDx = nx;
            this.lungeDy = ny;
          }
        } else if (this.state === 'windup') {
          this.stateTimer -= dt;
          if (this.stateTimer <= 0) {
            this.state = 'lunge';
            this.stateTimer = 0.42;
          }
        } else if (this.state === 'lunge') {
          this.x += this.lungeDx * 455 * this.speedMult * dt;
          this.y += this.lungeDy * 455 * this.speedMult * dt;
          this.stateTimer -= dt;
          if (this.stateTimer <= 0) {
            this.state = 'chase';
            this.stateTimer = 2.2;
          }
        }
      } else if (this.type === 'freezer') {
        if (dist > 265) {
          this.x += nx * this.speed * dt;
          this.y += ny * this.speed * dt;
        }
        this.shootCd -= dt;
        if (this.shootCd <= 0 && dist < 560) {
          this.shootCd = 3.2 / this.speedMult;
          const baseAngle = Math.atan2(ny, nx);
          for (const offset of [-0.28, 0, 0.28]) {
            const a = baseAngle + offset;
            projectiles.push(new Projectile(
              this.x,
              this.y,
              Math.cos(a) * 210 * this.speedMult,
              Math.sin(a) * 210 * this.speedMult,
              { slow: true, text: '解冻费', radius: 9 }
            ));
          }
        }
      }

      world.resolveCircleCollision(this);

      if (Math.hypot(player.x - this.x, player.y - this.y) < player.radius + this.radius - 3) {
        return true;
      }
      return false;
    }

    render(ctx, time) {
      graphics.drawScammerSprite(ctx, this, time);
    }
  }

  class ScamBoss {
    constructor(x, y, bossId = 'jack', opts = {}) {
      const prof = CONFIG.BOSS_PROFILES[bossId] || CONFIG.BOSS_PROFILES.jack;
      this.x = x;
      this.y = y;
      this.bossId = prof.id;
      this.name = prof.name;
      this.title = prof.title;
      this.radius = prof.radius;

      const hpMult = opts.hpMult || 1.0;
      this.maxHp = Math.round(prof.maxHp * hpMult);
      this.hp = this.maxHp;

      this.speedMult = opts.speedMult || 1.0;
      this.speed = prof.speed * this.speedMult;
      this.dropTotal = Math.round(prof.dropTotal * (opts.rewardMult || 1.0));

      this.state = 'pursue';
      this.timer = 2.0;
      this.patternIndex = 0;
      this.chainCharges = 0;
      this.chargeDx = 0;
      this.chargeDy = 0;
      this.stunTime = 0;
      this.hitFlash = 0;
      this.dead = false;
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.hitFlash = 0.18;
      if (this.hp <= 0) {
        this.dead = true;
      }
    }

    update(dt, player, world, projectiles, traps, collectibles, scammers) {
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.stunTime > 0) {
        this.stunTime -= dt;
        return false;
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      if (this.state === 'pursue') {
        this.x += nx * this.speed * dt;
        this.y += ny * this.speed * dt;
        this.timer -= dt;
        if (this.timer <= 0) {
          this.executeBossPattern(nx, ny, player, world, projectiles, traps, collectibles, scammers);
        }
      } else if (this.state === 'windup') {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'charge';
          this.timer = this.bossId === 'jack' ? 0.36 : 0.54;
        }
      } else if (this.state === 'charge') {
        const chargeSpd = (this.bossId === 'jack' ? 520 : 480) * this.speedMult;
        this.x += this.chargeDx * chargeSpd * dt;
        this.y += this.chargeDy * chargeSpd * dt;
        this.timer -= dt;
        if (this.timer <= 0) {
          if (this.chainCharges > 0) {
            this.chainCharges--;
            this.state = 'windup';
            this.timer = 0.45;
            const nd = Math.hypot(player.x - this.x, player.y - this.y) || 1;
            this.chargeDx = (player.x - this.x) / nd;
            this.chargeDy = (player.y - this.y) / nd;
          } else {
            this.state = 'pursue';
            this.timer = 2.1;
          }
        }
      }

      world.resolveCircleCollision(this);

      if (Math.hypot(player.x - this.x, player.y - this.y) < player.radius + this.radius - 4) {
        return true;
      }
      return false;
    }

    executeBossPattern(nx, ny, player, world, projectiles, traps, collectibles, scammers) {
      const pat = this.patternIndex % 2;
      this.patternIndex++;
      const baseA = Math.atan2(ny, nx);

      if (this.bossId === 'jack') {
        if (pat === 0) {
          // 5 Golden Fake VIP Contracts Fan
          for (let i = -2; i <= 2; i++) {
            const a = baseA + i * 0.23;
            projectiles.push(new Projectile(
              this.x,
              this.y,
              Math.cos(a) * 265 * this.speedMult,
              Math.sin(a) * 265 * this.speedMult,
              { text: '联单合同!', goldCard: true, radius: 11 }
            ));
          }
          this.timer = 2.2;
        } else {
          // Triple Chain Lunge!
          this.chainCharges = 2;
          this.state = 'windup';
          this.timer = 0.65;
          this.chargeDx = nx;
          this.chargeDy = ny;
        }
      } else if (this.bossId === 'phantom') {
        if (pat === 0) {
          // 10-way Voice Spiral Barrage
          for (let i = 0; i < 10; i++) {
            const a = baseA + (Math.PI * 2 * i) / 10;
            projectiles.push(new Projectile(
              this.x,
              this.y,
              Math.cos(a) * 215 * this.speedMult,
              Math.sin(a) * 215 * this.speedMult,
              { text: '冲业绩嘛~', radius: 10 }
            ));
          }
          this.timer = 2.4;
        } else {
          // Blink Teleport + Summon 2 Hologram Clones!
          const blinkPt = world.getRandomWalkablePoint(55, player.x, player.y, 200, 340, player.x, player.y);
          this.x = blinkPt.x;
          this.y = blinkPt.y;
          if (scammers.length < 8) {
            for (let c = 0; c < 2; c++) {
              const cp = world.getRandomWalkablePoint(45, player.x, player.y, 170, 300, player.x, player.y);
              scammers.push(new Scammer(cp.x, cp.y, 'spammer', this.speedMult, { isHoloClone: true }));
            }
          }
          this.timer = 2.6;
        }
      } else if (this.bossId === 'freezer404') {
        if (pat === 0) {
          // Deploy 3 Electric Freeze Grids + Homing Cryo Missiles
          for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = 110 + Math.random() * 190;
            const tx = player.x + Math.cos(a) * d;
            const ty = player.y + Math.sin(a) * d;
            if (!world.isPointInsideBuilding(tx, ty, 45)) {
              traps.push(new BaitTrap(tx, ty, 'freeze_grid'));
            }
          }
          this.timer = 2.6;
        } else {
          // Twin Homing Account-Freeze Orbs!
          for (const side of [-0.45, 0.45]) {
            const a = baseA + side;
            projectiles.push(new Projectile(
              this.x,
              this.y,
              Math.cos(a) * 185 * this.speedMult,
              Math.sin(a) * 185 * this.speedMult,
              { homing: true, slow: true, text: '冻结令404', radius: 13, life: 4.2 }
            ));
          }
          this.timer = 2.5;
        }
      } else {
        // Overlord Wang: Casino Storm + Throne Charge + Fake Packet Toss
        if (pat === 0) {
          for (let i = -3; i <= 3; i++) {
            const a = baseA + i * 0.21;
            projectiles.push(new Projectile(
              this.x,
              this.y,
              Math.cos(a) * 255 * this.speedMult,
              Math.sin(a) * 255 * this.speedMult,
              { text: '庄家通吃!', goldCard: i % 2 === 0, radius: 11 }
            ));
          }
          for (let t = 0; t < 2; t++) {
            const ang = Math.random() * Math.PI * 2;
            const tx = player.x + Math.cos(ang) * 180;
            const ty = player.y + Math.sin(ang) * 180;
            if (!world.isPointInsideBuilding(tx, ty, 34)) {
              traps.push(new BaitTrap(tx, ty, 'fake_packet'));
            }
          }
          this.timer = 2.4;
        } else {
          this.chainCharges = 1;
          this.state = 'windup';
          this.timer = 0.78;
          this.chargeDx = nx;
          this.chargeDy = ny;
        }
      }
    }

    render(ctx, time) {
      graphics.drawBossSprite(ctx, this, time);
    }
  }

  window.Collect1200.Entities = {
    Player,
    Collectible,
    BaitTrap,
    PartTimeZone,
    Projectile,
    Scammer,
    ScamBoss
  };
})();
