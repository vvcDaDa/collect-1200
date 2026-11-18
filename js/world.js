(function () {
  'use strict';

  const { CONFIG, graphics, roundRectPath } = window.Collect1200;

  class WorldMap {
    constructor() {
      this.width = CONFIG.WORLD.WIDTH;
      this.height = CONFIG.WORLD.HEIGHT;
      this.padding = CONFIG.WORLD.PADDING;

      this.fountain = { x: 1800, y: 1350, r: 48 };
      this.koiPond = { x: 510, y: 1680, rx: 190, ry: 112 };

      this.hRoads = [
        { y: 660, h: 120 },
        { y: 1280, h: 140 },
        { y: 1920, h: 120 }
      ];
      this.vRoads = [
        { x: 920, w: 120 },
        { x: 1730, w: 140 },
        { x: 2560, w: 120 }
      ];

      // 14 High-Detail 2.5D Buildings across 4 Urban Districts
      this.buildings = [
        // === Northwest: 城中村烟火夜市 ===
        {
          id: 'porkrice', kind: 'food', hasSteam: true,
          x: 220, y: 180, w: 300, h: 185,
          wallTop: '#FFFBEB', wallBot: '#FDE68A',
          roofTop: '#F97316', roofColor: '#EA580C', awningAlt: '#FFF7ED',
          neonColor: '#FACC15', badgeChar: '卤',
          title: '隆江猪脚饭总店'
        },
        {
          id: 'bbq', kind: 'food', hasSteam: true,
          x: 1150, y: 180, w: 310, h: 185,
          wallTop: '#FEF2F2', wallBot: '#FECACA',
          roofTop: '#DC2626', roofColor: '#B91C1C', awningAlt: '#FEF3C7',
          neonColor: '#FB923C', badgeChar: '烤',
          title: '老铁炭火烧烤城'
        },
        {
          id: 'shaxian', kind: 'food', hasSteam: true,
          x: 230, y: 860, w: 290, h: 185,
          wallTop: '#ECFDF5', wallBot: '#A7F3D0',
          roofTop: '#14B8A6', roofColor: '#0D9488', awningAlt: '#F0FDFA',
          neonColor: '#5EEAD4', badgeChar: '鲜',
          title: '沙县大酒店'
        },
        {
          id: 'recycle', kind: 'recycle',
          x: 1155, y: 860, w: 305, h: 185,
          wallTop: '#FEFCE8', wallBot: '#FEF08A',
          roofTop: '#10B981', roofColor: '#059669', awningAlt: '#ECFDF5',
          neonColor: '#34D399', badgeChar: '收',
          title: '老王废品回收站'
        },

        // === Northeast: 赛博商业步行街 ===
        {
          id: 'police', kind: 'police', isPolice: true,
          x: 2020, y: 180, w: 310, h: 175,
          wallTop: '#EFF6FF', wallBot: '#BFDBFE',
          roofTop: '#2563EB', roofColor: '#1D4ED8', awningAlt: '#EFF6FF',
          neonColor: '#38BDF8', badgeChar: '警',
          title: '96110 反诈警务总站'
        },
        {
          id: 'milktea', kind: 'tea',
          x: 2820, y: 180, w: 305, h: 185,
          wallTop: '#FFF1F2', wallBot: '#FECDD3',
          roofTop: '#FB7185', roofColor: '#E11D48', awningAlt: '#FFFFFF',
          neonColor: '#FDA4AF', badgeChar: '茶',
          title: '蜜雪柠檬茶旗舰店'
        },
        {
          id: 'netcafe', kind: 'cyber',
          x: 2020, y: 860, w: 300, h: 185,
          wallTop: '#FAF5FF', wallBot: '#E9D5FF',
          roofTop: '#9333EA', roofColor: '#7E22CE', awningAlt: '#F3E8FF',
          neonColor: '#E879F9', badgeChar: '网',
          title: '群友开黑电竞馆'
        },
        {
          id: 'arcade', kind: 'cyber',
          x: 2820, y: 860, w: 310, h: 185,
          wallTop: '#FDF4FF', wallBot: '#F5D0FE',
          roofTop: '#EC4899', roofColor: '#DB2777', awningAlt: '#FCE7F3',
          neonColor: '#67E8F9', badgeChar: '玩',
          title: '星际潮玩电玩城'
        },

        // === Southwest: 滨湖生态社区 ===
        {
          id: 'parcel', kind: 'parcel',
          x: 1160, y: 1535, w: 300, h: 185,
          wallTop: '#FFFBEB', wallBot: '#FDE68A',
          roofTop: '#0284C7', roofColor: '#0369A1', awningAlt: '#E0F2FE',
          neonColor: '#38BDF8', badgeChar: '递',
          title: '顺丰菜鸟同城驿站'
        },
        {
          id: 'apt_west', kind: 'apt',
          x: 220, y: 2140, w: 310, h: 190,
          wallTop: '#F0FDF4', wallBot: '#BBF7D0',
          roofTop: '#059669', roofColor: '#047857', awningAlt: '#ECFDF5',
          neonColor: '#6EE7B7', badgeChar: '居',
          title: '阳光水岸花园'
        },
        {
          id: 'apt_east', kind: 'apt',
          x: 1150, y: 2140, w: 310, h: 190,
          wallTop: '#F5F3FF', wallBot: '#DDD6FE',
          roofTop: '#6366F1', roofColor: '#4F46E5', awningAlt: '#EEF2FF',
          neonColor: '#A5B4FC', badgeChar: '宅',
          title: '幸福花园小区'
        },

        // === Southeast: 高新科技园 CBD ===
        {
          id: 'convenience', kind: 'tea',
          x: 2020, y: 1535, w: 285, h: 185,
          wallTop: '#ECFEFF', wallBot: '#CFFAFE',
          roofTop: '#10B981', roofColor: '#0284C7', awningAlt: '#FFFFFF',
          neonColor: '#34D399', badgeChar: '便',
          title: '24H 闪送便利店'
        },
        {
          id: 'techtower', kind: 'glass',
          x: 2800, y: 1515, w: 340, h: 205,
          wallTop: '#E0F2FE', wallBot: '#BAE6FD',
          roofTop: '#0284C7', roofColor: '#1E3A8A', awningAlt: '#EFF6FF',
          neonColor: '#38BDF8', badgeChar: '科',
          title: '福报科技研发大厦'
        },
        {
          id: 'bank', kind: 'glass',
          x: 2020, y: 2140, w: 325, h: 195,
          wallTop: '#FEFCE8', wallBot: '#FDE68A',
          roofTop: '#D97706', roofColor: '#92400E', awningAlt: '#FFFBEB',
          neonColor: '#FACC15', badgeChar: '银',
          title: '反诈安全银行大厦'
        }
      ];

      // Pickup Restaurants & Stations across all 4 Districts
      this.pickupSpots = [
        { x: 370, y: 410, name: '隆江猪脚饭窗口', food: '至尊猪脚饭', district: '夜市' },
        { x: 1305, y: 410, name: '老铁烧烤出餐台', food: '炭烤羊肉串套餐', district: '夜市' },
        { x: 375, y: 1090, name: '沙县大酒店窗口', food: '柳叶蒸饺扁食', district: '夜市' },
        { x: 2970, y: 410, name: '蜜雪旗舰店吧台', food: '冰鲜柠檬水×6', district: '商圈' },
        { x: 1310, y: 1765, name: '同城驿站闪送台', food: '加急同城文件箱', district: '社区' },
        { x: 2160, y: 1765, name: '24H便利店咖啡吧', food: '冰美式续命套餐', district: 'CBD' }
      ];

      // Customer Dropoff Destinations across all 4 Districts
      this.dropoffSpots = [
        { x: 2170, y: 1090, name: '开黑电竞馆前台' },
        { x: 2975, y: 1090, name: '星际电玩城门口' },
        { x: 2175, y: 400, name: '96110警务总站值班室' },
        { x: 375, y: 2380, name: '阳光水岸花园丰巢柜' },
        { x: 1305, y: 2380, name: '幸福花园南门岗亭' },
        { x: 2970, y: 1770, name: '福报科技大厦一楼大堂' },
        { x: 2180, y: 2380, name: '反诈银行VIP接待处' },
        { x: 1305, y: 1090, name: '废品回收站老王值班室' }
      ];

      this.trees = [];
      this.props = [];
      this.populateScenery();

      // Ambient drifting leaves
      this.leaves = [];
      for (let i = 0; i < 55; i++) {
        this.leaves.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: 15 + Math.random() * 20,
          vy: 9 + Math.random() * 14,
          phase: Math.random() * Math.PI * 2,
          color: i % 3 === 0 ? '#F472B6' : i % 2 === 0 ? '#FACC15' : '#4ADE80'
        });
      }
    }

    populateScenery() {
      // Boulevard Streetlamps & Trees along major avenues
      const lampXs = [320, 740, 1140, 1560, 2040, 2420, 2780, 3260];
      for (const lx of lampXs) {
        this.props.push({ x: lx, y: 635, type: 'lamp' });
        this.props.push({ x: lx, y: 1255, type: 'lamp' });
        this.props.push({ x: lx, y: 1895, type: 'lamp' });
      }

      // Plaza ring lamps
      this.props.push(
        { x: 1620, y: 1185, type: 'lamp' },
        { x: 1980, y: 1185, type: 'lamp' },
        { x: 1620, y: 1515, type: 'lamp' },
        { x: 1980, y: 1515, type: 'lamp' }
      );

      // Night-Market BBQ Outdoor Patio Umbrella Tables!
      this.props.push(
        { x: 1540, y: 260, type: 'bbq_table' },
        { x: 1540, y: 340, type: 'bbq_table' },
        { x: 1630, y: 300, type: 'bbq_table' },
        { x: 610, y: 260, type: 'bbq_table' },
        { x: 610, y: 340, type: 'bbq_table' }
      );

      // Cyber Street Vending Machines & Scooters
      this.props.push(
        { x: 2365, y: 980, type: 'vending', color: '#9333EA' },
        { x: 2775, y: 980, type: 'vending', color: '#EC4899' },
        { x: 2340, y: 1660, type: 'vending', color: '#0284C7' },
        { x: 555, y: 980, type: 'vending', color: '#059669' },

        { x: 250, y: 390, type: 'scooter_parked', color: '#FACC15' },
        { x: 290, y: 390, type: 'scooter_parked', color: '#38BDF8' },
        { x: 2850, y: 390, type: 'scooter_parked', color: '#FB7185' },
        { x: 2890, y: 390, type: 'scooter_parked', color: '#FACC15' },
        { x: 2050, y: 1070, type: 'scooter_parked', color: '#38BDF8' },
        { x: 2090, y: 1070, type: 'scooter_parked', color: '#34D399' },
        { x: 2840, y: 1745, type: 'scooter_parked', color: '#38BDF8' },
        { x: 2885, y: 1745, type: 'scooter_parked', color: '#FACC15' }
      );

      // Recycling Bins & Park Benches around Koi Pond
      this.props.push(
        { x: 1490, y: 1020, type: 'bins' },
        { x: 560, y: 2310, type: 'bins' },
        { x: 1490, y: 2310, type: 'bins' },
        { x: 510, y: 1525, type: 'bench' },
        { x: 510, y: 1835, type: 'bench' },
        { x: 765, y: 1680, type: 'bench' },
        // CBD Helipad Plaza Landmark
        { x: 2980, y: 2260, type: 'helipad' }
      );

      // Manhole covers on roads
      this.props.push(
        { x: 980, y: 500, type: 'manhole' },
        { x: 1800, y: 720, type: 'manhole' },
        { x: 2620, y: 1350, type: 'manhole' },
        { x: 980, y: 1980, type: 'manhole' },
        { x: 1800, y: 2220, type: 'manhole' },
        { x: 2620, y: 1980, type: 'manhole' }
      );

      // Lush Sidewalk & Park Trees
      const treeCoords = [
        [140, 220], [820, 220], [1630, 220], [2460, 220], [3320, 220],
        [140, 1140], [820, 1140], [1630, 1140], [2460, 1140], [3320, 1140],
        [240, 1520], [780, 1520], [240, 1840], [780, 1840],
        [1560, 1620], [2460, 1620], [3320, 1620],
        [140, 2450], [820, 2450], [1580, 2450], [2460, 2450], [2760, 2150], [3220, 2150], [2760, 2420], [3220, 2420]
      ];
      for (const [tx, ty] of treeCoords) {
        this.trees.push({ x: tx, y: ty });
      }
    }

    isPointInsideBuilding(x, y, margin = 26) {
      if (
        x < this.padding + margin ||
        x > this.width - this.padding - margin ||
        y < this.padding + margin ||
        y > this.height - this.padding - margin
      ) {
        return true;
      }

      // Central fountain check
      const fdx = x - this.fountain.x;
      const fdy = y - this.fountain.y;
      if (fdx * fdx + fdy * fdy < (this.fountain.r + margin) * (this.fountain.r + margin)) {
        return true;
      }

      // Koi pond ellipse check
      const pdx = (x - this.koiPond.x) / (this.koiPond.rx + margin);
      const pdy = (y - this.koiPond.y) / (this.koiPond.ry + margin);
      if (pdx * pdx + pdy * pdy < 1.0) {
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

    getRandomWalkablePoint(margin = 42, avoidX = null, avoidY = null, minDist = 0, maxDist = Infinity, refX = 1800, refY = 1350) {
      for (let i = 0; i < 110; i++) {
        let x, y;
        if (maxDist < Infinity) {
          const a = Math.random() * Math.PI * 2;
          const r = minDist + Math.random() * Math.max(80, maxDist - minDist);
          x = refX + Math.cos(a) * r;
          y = refY + Math.sin(a) * r;
        } else {
          x = this.padding + margin + Math.random() * (this.width - (this.padding + margin) * 2);
          y = this.padding + margin + Math.random() * (this.height - (this.padding + margin) * 2);
        }

        if (this.isPointInsideBuilding(x, y, margin)) continue;
        if (avoidX !== null && avoidY !== null && minDist > 0) {
          const dx = x - avoidX;
          const dy = y - avoidY;
          if (dx * dx + dy * dy < minDist * minDist) continue;
        }
        return { x, y };
      }
      return { x: 1800, y: 1465 };
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

      // Central fountain circle pushout
      const fdx = entity.x - this.fountain.x;
      const fdy = entity.y - this.fountain.y;
      const fDist = Math.hypot(fdx, fdy);
      const minFDist = this.fountain.r + r;
      if (fDist < minFDist && fDist > 0.001) {
        entity.x = this.fountain.x + (fdx / fDist) * minFDist;
        entity.y = this.fountain.y + (fdy / fDist) * minFDist;
      }

      // Koi Pond smooth elliptical pushout
      const erx = this.koiPond.rx + r + 8;
      const ery = this.koiPond.ry + r + 8;
      const kdx = entity.x - this.koiPond.x;
      const kdy = entity.y - this.koiPond.y;
      const normDist = Math.hypot(kdx / erx, kdy / ery);
      if (normDist < 1.0 && normDist > 0.001) {
        entity.x = this.koiPond.x + (kdx / normDist);
        entity.y = this.koiPond.y + (kdy / normDist);
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
            const bottomPen = Math.abs(entity.y - b.y - b.h);
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
      // 1. Outer Dark Frame (culled to camera viewport)
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(cam.x - 20, cam.y - 20, cam.w + 40, cam.h + 40);

      // 2. Render 4 Distinct District Ground Pavements!
      const midX = 1800;
      const midY = 1350;

      // NW: Night Market Terracotta
      if (cam.x < midX && cam.y < midY) {
        ctx.fillStyle = graphics.getPattern(ctx, 'nightmarket');
        ctx.fillRect(this.padding, this.padding, midX - this.padding, midY - this.padding);
      }
      // NE: Cyber Commercial Street
      if (cam.x + cam.w > midX && cam.y < midY) {
        ctx.fillStyle = graphics.getPattern(ctx, 'cyber');
        ctx.fillRect(midX, this.padding, this.width - this.padding - midX, midY - this.padding);
      }
      // SW: Garden Community Brick + Park Lawn
      if (cam.x < midX && cam.y + cam.h > midY) {
        ctx.fillStyle = graphics.getPattern(ctx, 'sidewalk');
        ctx.fillRect(this.padding, midY, midX - this.padding, this.height - this.padding - midY);

        // Lush Lakeside Park Lawn around Koi Pond
        ctx.fillStyle = '#14532D';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 4;
        roundRectPath(ctx, 130, 1475, 740, 410, 22);
        ctx.fill();
        ctx.stroke();
      }
      // SE: Tech Park CBD Polished Marble
      if (cam.x + cam.w > midX && cam.y + cam.h > midY) {
        ctx.fillStyle = graphics.getPattern(ctx, 'cbd');
        ctx.fillRect(midX, midY, this.width - this.padding - midX, this.height - this.padding - midY);
      }

      // 3. Asphalt Boulevards & Granite Curbs
      ctx.fillStyle = '#94A3B8';
      for (const r of this.hRoads) {
        if (r.y + r.h < cam.y - 10 || r.y > cam.y + cam.h + 10) continue;
        ctx.fillRect(this.padding, r.y - 6, this.width - this.padding * 2, r.h + 12);
      }
      for (const r of this.vRoads) {
        if (r.x + r.w < cam.x - 10 || r.x > cam.x + cam.w + 10) continue;
        ctx.fillRect(r.x - 6, this.padding, r.w + 12, this.height - this.padding * 2);
      }

      ctx.fillStyle = graphics.getPattern(ctx, 'asphalt');
      for (const r of this.hRoads) {
        if (r.y + r.h < cam.y - 10 || r.y > cam.y + cam.h + 10) continue;
        ctx.fillRect(this.padding, r.y, this.width - this.padding * 2, r.h);
      }
      for (const r of this.vRoads) {
        if (r.x + r.w < cam.x - 10 || r.x > cam.x + cam.w + 10) continue;
        ctx.fillRect(r.x, this.padding, r.w, this.height - this.padding * 2);
      }

      // Double Yellow Road Center Lines
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([26, 18]);
      ctx.beginPath();
      for (const r of this.hRoads) {
        if (r.y + r.h < cam.y - 10 || r.y > cam.y + cam.h + 10) continue;
        const cy = r.y + r.h / 2;
        ctx.moveTo(this.padding + 20, cy - 3);
        ctx.lineTo(this.width - this.padding - 20, cy - 3);
        ctx.moveTo(this.padding + 20, cy + 3);
        ctx.lineTo(this.width - this.padding - 20, cy + 3);
      }
      for (const r of this.vRoads) {
        if (r.x + r.w < cam.x - 10 || r.x > cam.x + cam.w + 10) continue;
        const cx = r.x + r.w / 2;
        ctx.moveTo(cx - 3, this.padding + 20);
        ctx.lineTo(cx - 3, this.height - this.padding - 20);
        ctx.moveTo(cx + 3, this.padding + 20);
        ctx.lineTo(cx + 3, this.height - this.padding - 20);
      }
      ctx.stroke();
      ctx.restore();

      // Zebra Crosswalks at Major Intersections
      ctx.fillStyle = 'rgba(248, 250, 252, 0.65)';
      const drawZebra = (cx, cy, vertical) => {
        if (cx < cam.x - 80 || cx > cam.x + cam.w + 80 || cy < cam.y - 80 || cy > cam.y + cam.h + 80) return;
        for (let i = -2; i <= 2; i++) {
          if (vertical) ctx.fillRect(cx + i * 22 - 7, cy - 26, 14, 52);
          else ctx.fillRect(cx - 26, cy + i * 22 - 7, 52, 14);
        }
      };
      for (const hr of this.hRoads) {
        for (const vr of this.vRoads) {
          const ix = vr.x + vr.w / 2;
          const iy = hr.y + hr.h / 2;
          if (Math.hypot(ix - this.fountain.x, iy - this.fountain.y) < 120) continue;
          drawZebra(ix - 95, iy, false);
          drawZebra(ix + 95, iy, false);
          drawZebra(ix, iy - 95, true);
          drawZebra(ix, iy + 95, true);
        }
      }
      // Crosswalks around Central Fountain Plaza
      drawZebra(1800, 1110, true);
      drawZebra(1800, 1590, true);
      drawZebra(1560, 1350, false);
      drawZebra(2040, 1350, false);

      // 4. Manholes & Helipad Ground Markings
      for (const prop of this.props) {
        if (prop.type !== 'manhole' && prop.type !== 'helipad') continue;
        if (prop.x < cam.x - 90 || prop.x > cam.x + cam.w + 90 || prop.y < cam.y - 90 || prop.y > cam.y + cam.h + 90) continue;
        graphics.drawStreetProp(ctx, prop, time);
      }

      // 5. Central Fountain Plaza & Southwest Koi Pond
      if (
        this.fountain.x > cam.x - 230 && this.fountain.x < cam.x + cam.w + 230 &&
        this.fountain.y > cam.y - 230 && this.fountain.y < cam.y + cam.h + 230
      ) {
        graphics.drawFountainPlaza(ctx, this.fountain.x, this.fountain.y, time);
      }

      if (
        this.koiPond.x > cam.x - 260 && this.koiPond.x < cam.x + cam.w + 260 &&
        this.koiPond.y > cam.y - 180 && this.koiPond.y < cam.y + cam.h + 180
      ) {
        graphics.drawKoiPond(ctx, this.koiPond, time);
      }

      // 6. City Perimeter Caution Border
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.strokeRect(
        this.padding,
        this.padding,
        this.width - this.padding * 2,
        this.height - this.padding * 2
      );
      ctx.restore();

      // 7. Street Props (Lamps, BBQ Tables, Scooters, Vending, Bins, Benches)
      for (const prop of this.props) {
        if (prop.type === 'manhole' || prop.type === 'helipad') continue;
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

      // 8. Trees
      for (const t of this.trees) {
        if (t.x < cam.x - 60 || t.x > cam.x + cam.w + 60 || t.y < cam.y - 60 || t.y > cam.y + cam.h + 60) {
          continue;
        }
        ctx.drawImage(graphics.treeCache, t.x - 48, t.y - 50);
      }

      // 9. Pre-Baked 2.5D Buildings + Live Rooftop Animations
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

        // Spinning AC fan
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

        // Steam wisps
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

        // Police beacon
        if (b.isPolice) {
          const isRed = Math.floor(time * 4) % 2 === 0;
          const beaconX = isRed ? b.x + 54 : b.x + b.w - 54;
          const beaconY = b.y + 18;
          const bGlow = ctx.createRadialGradient(beaconX, beaconY, 2, beaconX, beaconY, 36);
          bGlow.addColorStop(0, isRed ? 'rgba(239,68,68,0.65)' : 'rgba(59,130,246,0.65)');
          bGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bGlow;
          ctx.beginPath();
          ctx.arc(beaconX, beaconY, 36, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 10. Drifting Leaves
      for (const lf of this.leaves) {
        const lx = (lf.x + time * lf.vx) % this.width;
        const ly = (lf.y + time * lf.vy + Math.sin(time * 2 + lf.phase) * 12) % this.height;
        if (lx < cam.x || lx > cam.x + cam.w || ly < cam.y || ly > cam.y + cam.h) continue;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(time * 2.5 + lf.phase);
        ctx.fillStyle = lf.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  window.Collect1200.WorldMap = WorldMap;
})();
