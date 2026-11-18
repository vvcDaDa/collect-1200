(function () {
  'use strict';

  const { CONFIG, graphics, roundRectPath } = window.Collect1200;

  class WorldMap {
    constructor() {
      this.width = CONFIG.WORLD.WIDTH;
      this.height = CONFIG.WORLD.HEIGHT;
      this.padding = CONFIG.WORLD.PADDING;
      this.fountain = { x: 960, y: 720, r: 44 };

      // 7 Richly themed 2.5D Buildings
      this.buildings = [
        {
          id: 'porkrice',
          x: 155, y: 125, w: 300, h: 185,
          wallTop: '#FFFBEB', wallBot: '#FDE68A',
          roofTop: '#F97316', roofColor: '#EA580C', awningAlt: '#FFF7ED',
          neonColor: '#FACC15', badgeChar: '卤',
          title: '隆江猪脚饭', sub: '外卖取餐热门商户',
          hasSteam: true
        },
        {
          id: 'milktea',
          x: 1465, y: 125, w: 300, h: 185,
          wallTop: '#FFF1F2', wallBot: '#FECDD3',
          roofTop: '#FB7185', roofColor: '#E11D48', awningAlt: '#FFFFFF',
          neonColor: '#FDA4AF', badgeChar: '茶',
          title: '蜜雪柠檬茶', sub: '正经日结摇奶茶'
        },
        {
          id: 'police',
          x: 810, y: 105, w: 300, h: 150,
          wallTop: '#EFF6FF', wallBot: '#BFDBFE',
          roofTop: '#2563EB', roofColor: '#1D4ED8', awningAlt: '#EFF6FF',
          neonColor: '#38BDF8', badgeChar: '警',
          title: '96110 反诈警务站', sub: '未知链接不点击',
          isPolice: true
        },
        {
          id: 'recycle',
          x: 155, y: 1085, w: 300, h: 190,
          wallTop: '#FEFCE8', wallBot: '#FEF08A',
          roofTop: '#10B981', roofColor: '#059669', awningAlt: '#ECFDF5',
          neonColor: '#34D399', badgeChar: '收',
          title: '老王废品回收站', sub: '塑料瓶纸箱高价收'
        },
        {
          id: 'apt',
          x: 1455, y: 1085, w: 310, h: 190,
          wallTop: '#F5F3FF', wallBot: '#DDD6FE',
          roofTop: '#6366F1', roofColor: '#4F46E5', awningAlt: '#EEF2FF',
          neonColor: '#A5B4FC', badgeChar: '宅',
          title: '幸福花园小区', sub: '外卖常客送达点'
        },
        {
          id: 'shaxian',
          x: 175, y: 605, w: 230, h: 195,
          wallTop: '#ECFDF5', wallBot: '#A7F3D0',
          roofTop: '#14B8A6', roofColor: '#0D9488', awningAlt: '#F0FDFA',
          neonColor: '#5EEAD4', badgeChar: '鲜',
          title: '沙县大酒店', sub: '打工人的加油站',
          hasSteam: true
        },
        {
          id: 'netcafe',
          x: 1515, y: 605, w: 230, h: 195,
          wallTop: '#FAF5FF', wallBot: '#E9D5FF',
          roofTop: '#9333EA', roofColor: '#7E22CE', awningAlt: '#F3E8FF',
          neonColor: '#E879F9', badgeChar: '网',
          title: '群友开黑网咖', sub: 'Freddy 戒网防诈处'
        }
      ];

      // Green lawn courtyards
      this.lawns = [
        { x: 105, y: 95, w: 400, h: 250 },
        { x: 1415, y: 95, w: 400, h: 250 },
        { x: 105, y: 1055, w: 400, h: 255 },
        { x: 1405, y: 1055, w: 410, h: 255 }
      ];

      // Curated pickup & dropoff waypoints right in front of storefronts
      this.pickupSpots = [
        { x: 305, y: 358, name: '隆江猪脚饭窗口', food: '至尊猪脚饭' },
        { x: 1615, y: 358, name: '蜜雪柠檬茶吧台', food: '冰鲜柠檬水×4' },
        { x: 290, y: 848, name: '沙县大酒店出餐口', food: '柳叶蒸饺套餐' }
      ];

      this.dropoffSpots = [
        { x: 1610, y: 1040, name: '幸福花园北门丰巢柜' },
        { x: 1630, y: 848, name: '开黑网咖门口取餐架' },
        { x: 960, y: 305, name: '96110警务站值班室' },
        { x: 305, y: 1040, name: '回收站老王值班亭' },
        { x: 960, y: 1185, name: '南街天桥夜市广场' }
      ];

      // Lush Sidewalk Trees
      this.trees = [
        { x: 485, y: 185 }, { x: 745, y: 185 }, { x: 1175, y: 185 }, { x: 1425, y: 185 },
        { x: 485, y: 1220 }, { x: 745, y: 1220 }, { x: 1175, y: 1220 }, { x: 1415, y: 1220 },
        { x: 115, y: 390 }, { x: 115, y: 1020 }, { x: 1805, y: 390 }, { x: 1805, y: 1020 },
        { x: 735, y: 635 }, { x: 1185, y: 635 }, { x: 735, y: 805 }, { x: 1185, y: 805 }
      ];

      // Rich Urban Street Props
      this.props = [
        // Warm streetlamps along boulevards & plaza
        { x: 495, y: 408, type: 'lamp' }, { x: 675, y: 408, type: 'lamp' },
        { x: 1245, y: 408, type: 'lamp' }, { x: 1425, y: 408, type: 'lamp' },
        { x: 495, y: 858, type: 'lamp' }, { x: 675, y: 858, type: 'lamp' },
        { x: 1245, y: 858, type: 'lamp' }, { x: 1425, y: 858, type: 'lamp' },
        { x: 815, y: 585, type: 'lamp' }, { x: 1105, y: 585, type: 'lamp' },
        { x: 815, y: 855, type: 'lamp' }, { x: 1105, y: 855, type: 'lamp' },

        // Beverage vending machines
        { x: 472, y: 295, type: 'vending' },
        { x: 1492, y: 785, type: 'vending' },
        { x: 790, y: 235, type: 'vending' },

        // Parked shared electric scooters
        { x: 195, y: 332, type: 'scooter_parked', color: '#38BDF8' },
        { x: 230, y: 332, type: 'scooter_parked', color: '#FACC15' },
        { x: 1715, y: 332, type: 'scooter_parked', color: '#FB7185' },
        { x: 1730, y: 822, type: 'scooter_parked', color: '#34D399' },
        { x: 1695, y: 822, type: 'scooter_parked', color: '#38BDF8' },

        // Sorted recycling bins
        { x: 472, y: 1245, type: 'bins' },
        { x: 1435, y: 1245, type: 'bins' },
        { x: 422, y: 780, type: 'bins' },

        // Road manhole covers
        { x: 585, y: 340, type: 'manhole' },
        { x: 1335, y: 660, type: 'manhole' },
        { x: 960, y: 495, type: 'manhole' },
        { x: 860, y: 945, type: 'manhole' }
      ];

      // Ambient drifting leaves
      this.leaves = [];
      for (let i = 0; i < 28; i++) {
        this.leaves.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: 14 + Math.random() * 18,
          vy: 8 + Math.random() * 14,
          phase: Math.random() * Math.PI * 2,
          color: i % 2 === 0 ? '#FACC15' : '#4ADE80'
        });
      }
    }

    isPointInsideBuilding(x, y, margin = 24) {
      if (
        x < this.padding + margin ||
        x > this.width - this.padding - margin ||
        y < this.padding + margin ||
        y > this.height - this.padding - margin
      ) {
        return true;
      }
      // Central fountain basin check
      const fdx = x - this.fountain.x;
      const fdy = y - this.fountain.y;
      if (fdx * fdx + fdy * fdy < (this.fountain.r + margin) * (this.fountain.r + margin)) {
        return true;
      }

      for (const b of this.buildings) {
        if (
          x > b.x - margin &&
          x < b.x + b.w + margin &&
          y > b.y - margin &&
          y < b.y + b.h + margin
        ) {
          return true;
        }
      }
      return false;
    }

    getRandomWalkablePoint(margin = 38, avoidX = null, avoidY = null, minDist = 0) {
      for (let i = 0; i < 90; i++) {
        const x = this.padding + margin + Math.random() * (this.width - (this.padding + margin) * 2);
        const y = this.padding + margin + Math.random() * (this.height - (this.padding + margin) * 2);
        if (this.isPointInsideBuilding(x, y, margin)) continue;
        if (avoidX !== null && avoidY !== null && minDist > 0) {
          const dx = x - avoidX;
          const dy = y - avoidY;
          if (dx * dx + dy * dy < minDist * minDist) continue;
        }
        return { x, y };
      }
      return { x: 960, y: 830 };
    }

    resolveCircleCollision(entity) {
      const r = entity.radius || 18;
      const minX = this.padding + r;
      const maxX = this.width - this.padding - r;
      const minY = this.padding + r;
      const maxY = this.height - this.padding - r;

      if (entity.x < minX) entity.x = minX;
      if (entity.x > maxX) entity.x = maxX;
      if (entity.y < minY) entity.y = minY;
      if (entity.y > maxY) entity.y = maxY;

      // Central fountain smooth circle pushout
      const fdx = entity.x - this.fountain.x;
      const fdy = entity.y - this.fountain.y;
      const fDist = Math.hypot(fdx, fdy);
      const minFDist = this.fountain.r + r;
      if (fDist < minFDist && fDist > 0.001) {
        entity.x = this.fountain.x + (fdx / fDist) * minFDist;
        entity.y = this.fountain.y + (fdy / fDist) * minFDist;
      }

      // Building AABBs
      for (const b of this.buildings) {
        const closestX = Math.max(b.x, Math.min(entity.x, b.x + b.w));
        const closestY = Math.max(b.y, Math.min(entity.y, b.y + b.h));
        const dx = entity.x - closestX;
        const dy = entity.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < r * r) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const overlap = r - dist;
            entity.x += (dx / dist) * overlap;
            entity.y += (dy / dist) * overlap;
          } else {
            const leftPen = Math.abs(entity.x - b.x);
            const rightPen = Math.abs(b.x + b.w - entity.x);
            const topPen = Math.abs(entity.y - b.y);
            const bottomPen = Math.abs(b.y + b.h - entity.y);
            const m = Math.min(leftPen, rightPen, topPen, bottomPen);
            if (m === leftPen) entity.x = b.x - r;
            else if (m === rightPen) entity.x = b.x + b.w + r;
            else if (m === topPen) entity.y = b.y - r;
            else entity.y = b.y + b.h + r;
          }
        }
      }
    }

    render(ctx, cam, time) {
      // 1. Outer Dark Border
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, this.width, this.height);

      // 2. Textured Herringbone Sidewalk Ground
      ctx.fillStyle = graphics.getPattern(ctx, 'sidewalk');
      ctx.fillRect(
        this.padding,
        this.padding,
        this.width - this.padding * 2,
        this.height - this.padding * 2
      );

      // 3. Courtyard Green Lawns with Stone Borders
      for (const l of this.lawns) {
        ctx.fillStyle = '#14532D';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 4;
        roundRectPath(ctx, l.x, l.y, l.w, l.h, 16);
        ctx.fill();
        ctx.stroke();

        // Subtle inner grass tufts
        ctx.fillStyle = '#166534';
        roundRectPath(ctx, l.x + 10, l.y + 10, l.w - 20, l.h - 20, 12);
        ctx.fill();
      }

      // 4. Asphalt Boulevards with 3D Granite Curbs!
      const hRoads = [430, 880];
      const vRoads = [520, 1270];
      const roadW = 130;

      // Curb stone outer bevels
      ctx.fillStyle = '#94A3B8';
      for (const ry of hRoads) {
        ctx.fillRect(this.padding, ry - 6, this.width - this.padding * 2, roadW + 12);
      }
      for (const rx of vRoads) {
        ctx.fillRect(rx - 6, this.padding, roadW + 12, this.height - this.padding * 2);
      }

      // Textured Asphalt Fill
      ctx.fillStyle = graphics.getPattern(ctx, 'asphalt');
      for (const ry of hRoads) {
        ctx.fillRect(this.padding, ry, this.width - this.padding * 2, roadW);
      }
      for (const rx of vRoads) {
        ctx.fillRect(rx, this.padding, roadW, this.height - this.padding * 2);
      }

      // White road shoulder lines
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.28)';
      ctx.lineWidth = 2;
      for (const ry of hRoads) {
        ctx.beginPath();
        ctx.moveTo(this.padding, ry + 8);
        ctx.lineTo(this.width - this.padding, ry + 8);
        ctx.moveTo(this.padding, ry + roadW - 8);
        ctx.lineTo(this.width - this.padding, ry + roadW - 8);
        ctx.stroke();
      }
      for (const rx of vRoads) {
        ctx.beginPath();
        ctx.moveTo(rx + 8, this.padding);
        ctx.lineTo(rx + 8, this.height - this.padding);
        ctx.moveTo(rx + roadW - 8, this.padding);
        ctx.lineTo(rx + roadW - 8, this.height - this.padding);
        ctx.stroke();
      }

      // Double Yellow Center Divider Lines
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([24, 18]);
      ctx.beginPath();
      for (const ry of hRoads) {
        ctx.moveTo(this.padding + 20, ry + roadW / 2 - 3);
        ctx.lineTo(this.width - this.padding - 20, ry + roadW / 2 - 3);
        ctx.moveTo(this.padding + 20, ry + roadW / 2 + 3);
        ctx.lineTo(this.width - this.padding - 20, ry + roadW / 2 + 3);
      }
      for (const rx of vRoads) {
        ctx.moveTo(rx + roadW / 2 - 3, this.padding + 20);
        ctx.lineTo(rx + roadW / 2 - 3, this.height - this.padding - 20);
        ctx.moveTo(rx + roadW / 2 + 3, this.padding + 20);
        ctx.lineTo(rx + roadW / 2 + 3, this.height - this.padding - 20);
      }
      ctx.stroke();
      ctx.restore();

      // Crisp Zebra Crosswalks around intersections & central plaza
      const drawZebra = (cx, cy, vertical) => {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.68)';
        for (let i = -2; i <= 2; i++) {
          if (vertical) {
            ctx.fillRect(cx + i * 22 - 7, cy - 28, 14, 56);
          } else {
            ctx.fillRect(cx - 28, cy + i * 22 - 7, 56, 14);
          }
        }
      };
      drawZebra(960, 495, true);
      drawZebra(960, 945, true);
      drawZebra(585, 720, false);
      drawZebra(1335, 720, false);
      drawZebra(490, 495, false);
      drawZebra(1430, 495, false);
      drawZebra(490, 945, false);
      drawZebra(1430, 945, false);

      // 5. Ground Props (Manholes first so cars/feet walk cleanly over them)
      for (const prop of this.props) {
        if (prop.type === 'manhole') {
          graphics.drawStreetProp(ctx, prop, time);
        }
      }

      // 6. Central Fountain Plaza
      graphics.drawFountainPlaza(ctx, this.fountain.x, this.fountain.y, time);

      // 7. World Perimeter Safety Fence
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.strokeRect(
        this.padding,
        this.padding,
        this.width - this.padding * 2,
        this.height - this.padding * 2
      );
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 6;
      ctx.setLineDash([18, 18]);
      ctx.strokeRect(
        this.padding,
        this.padding,
        this.width - this.padding * 2,
        this.height - this.padding * 2
      );
      ctx.restore();

      // 8. Street Props (Scooters, Bins, Vending Machines, Lamps)
      for (const prop of this.props) {
        if (prop.type === 'manhole') continue;
        if (
          prop.x < cam.x - 100 ||
          prop.x > cam.x + cam.w + 100 ||
          prop.y < cam.y - 100 ||
          prop.y > cam.y + cam.h + 100
        ) {
          continue;
        }
        graphics.drawStreetProp(ctx, prop, time);
      }

      // 9. Multi-Layered Sidewalk Trees
      for (const t of this.trees) {
        if (t.x < cam.x - 60 || t.x > cam.x + cam.w + 60 || t.y < cam.y - 60 || t.y > cam.y + cam.h + 60) {
          continue;
        }
        ctx.drawImage(graphics.treeCache, t.x - 48, t.y - 50);
      }

      // 10. Pre-Baked 2.5D Buildings + Dynamic Animated Rooftop/Steam Overlays!
      for (const b of this.buildings) {
        if (
          b.x + b.w < cam.x - 50 ||
          b.x > cam.x + cam.w + 50 ||
          b.y + b.h < cam.y - 50 ||
          b.y > cam.y + cam.h + 50
        ) {
          continue;
        }

        const entry = graphics.getBuildingSprite(b);
        ctx.drawImage(entry.canvas, b.x - entry.pad, b.y - entry.pad);

        // Animated spinning AC fan on roof!
        const fanX = b.x - entry.pad + entry.acFanX;
        const fanY = b.y - entry.pad + entry.acFanY;
        ctx.save();
        ctx.translate(fanX, fanY);
        ctx.rotate(time * 9);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.moveTo(0, -7);
        ctx.lineTo(0, 7);
        ctx.stroke();
        ctx.restore();

        // Rising kitchen steam puffs on food shops!
        if (b.hasSteam) {
          for (let s = 0; s < 3; s++) {
            const prog = ((time * 0.65 + s * 0.33) % 1);
            const sx = b.x + b.w - 46 + Math.sin(time * 3 + s) * 5;
            const sy = b.y + 18 - prog * 28;
            ctx.fillStyle = `rgba(248, 250, 252, ${(1 - prog) * 0.42})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 5 + prog * 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Red-blue patrol beacon flash on 96110 Police Station!
        if (b.isPolice) {
          const isRed = Math.floor(time * 4) % 2 === 0;
          const beaconX = isRed ? b.x + 54 : b.x + b.w - 54;
          const beaconY = b.y + 18;
          const bGlow = ctx.createRadialGradient(beaconX, beaconY, 2, beaconX, beaconY, 34);
          bGlow.addColorStop(0, isRed ? 'rgba(239,68,68,0.65)' : 'rgba(59,130,246,0.65)');
          bGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bGlow;
          ctx.beginPath();
          ctx.arc(beaconX, beaconY, 34, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 11. Drifting Autumn/Street Leaves across the neighborhood
      for (const lf of this.leaves) {
        const lx = (lf.x + time * lf.vx) % this.width;
        const ly = (lf.y + time * lf.vy + Math.sin(time * 2 + lf.phase) * 12) % this.height;
        if (lx < cam.x || lx > cam.x + cam.w || ly < cam.y || ly > cam.y + cam.h) continue;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(time * 2.5 + lf.phase);
        ctx.fillStyle = lf.color;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  window.Collect1200.WorldMap = WorldMap;
})();
