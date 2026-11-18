(function () {
  'use strict';

  window.Collect1200 = window.Collect1200 || {};

  function createOffscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w);
    c.height = Math.ceil(h);
    return c;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  class GraphicsEngine {
    constructor() {
      this.patterns = {};
      this.patternCanvases = {};
      this.buildingCache = new Map();
      this.treeCache = null;
      this.initPatterns();
      this.initTreeSprite();
    }

    initPatterns() {
      // 1. Standard Sidewalk Brick Paver
      const sw = createOffscreen(64, 64);
      const sctx = sw.getContext('2d');
      sctx.fillStyle = '#3B495E';
      sctx.fillRect(0, 0, 64, 64);
      const tones = ['#42526B', '#3E4E66', '#465772', '#3A4960'];
      for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 3; col++) {
          const bx = col * 32 + offset;
          const by = row * 16;
          sctx.fillStyle = tones[(row * 3 + col + 4) % tones.length];
          sctx.fillRect(bx + 1, by + 1, 30, 14);
          sctx.fillStyle = 'rgba(255,255,255,0.045)';
          sctx.fillRect(bx + 1, by + 1, 30, 2);
        }
      }
      this.patternCanvases.sidewalk = sw;

      // 2. Northwest Night-Market Warm Terracotta Tiles
      const nm = createOffscreen(64, 64);
      const nctx = nm.getContext('2d');
      nctx.fillStyle = '#43302B';
      nctx.fillRect(0, 0, 64, 64);
      const nmTones = ['#523A34', '#4A342E', '#593F38', '#46312C'];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          nctx.fillStyle = nmTones[(r * 2 + c) % 4];
          nctx.fillRect(c * 32 + 1, r * 32 + 1, 30, 30);
          nctx.strokeStyle = 'rgba(251, 191, 36, 0.06)';
          nctx.strokeRect(c * 32 + 3, r * 32 + 3, 26, 26);
        }
      }
      this.patternCanvases.nightmarket = nm;

      // 3. Northeast Cyber Commercial Neon Grid
      const cb = createOffscreen(64, 64);
      const cctx = cb.getContext('2d');
      cctx.fillStyle = '#1E1B4B';
      cctx.fillRect(0, 0, 64, 64);
      cctx.fillStyle = '#27245E';
      cctx.fillRect(2, 2, 28, 28);
      cctx.fillRect(34, 2, 28, 28);
      cctx.fillRect(2, 34, 28, 28);
      cctx.fillRect(34, 34, 28, 28);
      cctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      cctx.fillRect(0, 31, 64, 2);
      cctx.fillRect(31, 0, 2, 64);
      this.patternCanvases.cyber = cb;

      // 4. Southeast CBD Polished Marble Blocks
      const cbd = createOffscreen(80, 80);
      const bctx = cbd.getContext('2d');
      bctx.fillStyle = '#334155';
      bctx.fillRect(0, 0, 80, 80);
      bctx.fillStyle = '#475569';
      bctx.fillRect(2, 2, 76, 76);
      bctx.strokeStyle = 'rgba(226, 232, 240, 0.08)';
      bctx.lineWidth = 1.5;
      bctx.beginPath();
      bctx.moveTo(8, 72);
      bctx.lineTo(38, 42);
      bctx.lineTo(70, 52);
      bctx.stroke();
      this.patternCanvases.cbd = cbd;

      // 5. Asphalt Grain Pattern
      const asp = createOffscreen(96, 96);
      const actx = asp.getContext('2d');
      actx.fillStyle = '#1E2532';
      actx.fillRect(0, 0, 96, 96);
      for (let i = 0; i < 140; i++) {
        const gx = (i * 37) % 96;
        const gy = (i * 61) % 96;
        actx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
        actx.fillRect(gx, gy, 2, 2);
      }
      this.patternCanvases.asphalt = asp;
    }

    getPattern(ctx, key) {
      if (!this.patterns[key]) {
        const src = this.patternCanvases[key] || this.patternCanvases.sidewalk;
        this.patterns[key] = ctx.createPattern(src, 'repeat');
      }
      return this.patterns[key];
    }

    initTreeSprite() {
      const c = createOffscreen(96, 96);
      const ctx = c.getContext('2d');
      const cx = 48;
      const cy = 50;

      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, cx - 22, cy + 8, 44, 24, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3F2E21';
      roundRectPath(ctx, cx - 17, cy + 12, 34, 16, 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.beginPath();
      ctx.ellipse(cx + 6, cy + 16, 28, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 6, cy - 2, 12, 22);
      ctx.strokeRect(cx - 6, cy - 2, 12, 22);

      const clusters = [
        { dx: -15, dy: -6, r: 19, col: '#14532D' },
        { dx: 16, dy: -5, r: 18, col: '#14532D' },
        { dx: 0, dy: -16, r: 22, col: '#15803D' },
        { dx: -11, dy: -12, r: 17, col: '#16A34A' },
        { dx: 12, dy: -11, r: 16, col: '#16A34A' },
        { dx: -3, dy: -19, r: 16, col: '#22C55E' },
        { dx: 5, dy: -22, r: 10, col: '#4ADE80' }
      ];
      for (const cl of clusters) {
        ctx.fillStyle = cl.col;
        ctx.beginPath();
        ctx.arc(cx + cl.dx, cy + cl.dy, cl.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 13, 28, Math.PI * 0.85, Math.PI * 2.15);
      ctx.stroke();

      const dots = [[-12, -16], [8, -20], [14, -8], [-6, -6], [2, -12]];
      ctx.fillStyle = '#FDE047';
      for (const [dx, dy] of dots) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      this.treeCache = c;
    }

    getBuildingSprite(b) {
      if (this.buildingCache.has(b.id)) {
        return this.buildingCache.get(b.id);
      }
      const pad = 28;
      const canvas = createOffscreen(b.w + pad * 2, b.h + pad * 2);
      const ctx = canvas.getContext('2d');
      const ox = pad;
      const oy = pad;
      const w = b.w;
      const h = b.h;
      const roofH = Math.round(h * 0.56);
      const wallY = oy + roofH;
      const wallH = h - roofH;

      // 1. 2.5D Shadow
      ctx.fillStyle = 'rgba(9, 14, 26, 0.58)';
      roundRectPath(ctx, ox + 10, oy + 14, w + 4, h + 4, 14);
      ctx.fill();

      // 2. Storefront Lower Wall
      const wallGrad = ctx.createLinearGradient(0, wallY, 0, oy + h);
      wallGrad.addColorStop(0, b.wallTop || '#E2E8F0');
      wallGrad.addColorStop(1, b.wallBot || '#CBD5E1');
      ctx.fillStyle = wallGrad;
      roundRectPath(ctx, ox, wallY - 8, w, wallH + 8, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.09)';
      ctx.lineWidth = 1;
      for (let by = wallY + 8; by < oy + h - 10; by += 10) {
        ctx.beginPath();
        ctx.moveTo(ox + 4, by);
        ctx.lineTo(ox + w - 4, by);
        ctx.stroke();
      }

      ctx.fillStyle = '#475569';
      roundRectPath(ctx, ox, oy + h - 14, w, 14, 6);
      ctx.fill();

      // 3. Custom Interior Windows & Architectural Details
      this.drawShopFacadeDetails(ctx, b, ox, wallY, w, wallH);

      // 4. Scalloped 3D Striped Awning
      const awnY = wallY - 4;
      const awnH = 20;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(ox + 8, awnY + awnH - 2, w - 16, 8);

      const stripeW = 20;
      const count = Math.floor((w - 16) / stripeW);
      const startX = ox + (w - count * stripeW) / 2;
      for (let i = 0; i < count; i++) {
        const sx = startX + i * stripeW;
        ctx.fillStyle = i % 2 === 0 ? b.roofColor : b.awningAlt || '#FFFBEB';
        ctx.beginPath();
        ctx.rect(sx, awnY, stripeW, awnH - 5);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + stripeW / 2, awnY + awnH - 5, stripeW / 2, 0, Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, awnY, count * stripeW, awnH - 5);

      // 5. 2.5D Roof Deck
      const roofGrad = ctx.createLinearGradient(0, oy, 0, oy + roofH);
      roofGrad.addColorStop(0, b.roofTop || b.roofColor);
      roofGrad.addColorStop(1, b.roofColor);
      ctx.fillStyle = roofGrad;
      roundRectPath(ctx, ox - 2, oy, w + 4, roofH, 12);
      ctx.fill();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      roundRectPath(ctx, ox + 10, oy + 10, w - 20, roofH - 22, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      for (let rx = ox + 26; rx < ox + w - 20; rx += 26) {
        ctx.beginPath();
        ctx.moveTo(rx, oy + 12);
        ctx.lineTo(rx, oy + roofH - 14);
        ctx.stroke();
      }

      // Rooftop HVAC & Solar Skylight
      ctx.fillStyle = '#94A3B8';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      roundRectPath(ctx, ox + 20, oy + 15, 42, 26, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(ox + 35, oy + 28, 8.5, 0, Math.PI * 2);
      ctx.fill();

      const skyGrad = ctx.createLinearGradient(ox + w - 76, oy + 15, ox + w - 22, oy + 41);
      skyGrad.addColorStop(0, '#38BDF8');
      skyGrad.addColorStop(1, '#1D4ED8');
      ctx.fillStyle = skyGrad;
      roundRectPath(ctx, ox + w - 76, oy + 15, 54, 25, 4);
      ctx.fill();
      ctx.stroke();

      // 6. Glowing Neon Billboard Sign
      const signW = Math.min(w - 24, 240);
      const signH = 38;
      const signX = ox + (w - signW) / 2;
      const signY = oy + roofH - signH - 8;

      ctx.save();
      ctx.shadowColor = b.neonColor || '#FACC15';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#0F172A';
      roundRectPath(ctx, signX, signY, signW, signH, 9);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = b.neonColor || '#FACC15';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, signX, signY, signW, signH, 9);
      ctx.stroke();

      ctx.fillStyle = b.neonColor || '#FDE047';
      ctx.beginPath();
      ctx.arc(signX + 22, signY + signH / 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.badgeChar || '店', signX + 22, signY + signH / 2 + 0.5);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '900 16.5px "Microsoft YaHei", system-ui, sans-serif';
      ctx.fillText(b.title, signX + signW / 2 + 10, signY + signH / 2 + 1);
      ctx.textBaseline = 'alphabetic';

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      roundRectPath(ctx, ox, oy, w, h, 12);
      ctx.stroke();

      const entry = { canvas, pad, acFanX: ox + 35, acFanY: oy + 28 };
      this.buildingCache.set(b.id, entry);
      return entry;
    }

    drawShopFacadeDetails(ctx, b, ox, wallY, w, wallH) {
      const winY = wallY + 18;
      const winH = Math.max(24, wallH - 34);

      const glowGrad = ctx.createLinearGradient(0, winY, 0, winY + winH);
      glowGrad.addColorStop(0, '#FEF3C7');
      glowGrad.addColorStop(1, '#F59E0B');

      const isCyber = b.kind === 'cyber';
      const isGlass = b.kind === 'glass';
      ctx.fillStyle = isCyber ? '#2E1065' : isGlass ? '#0EA5E9' : glowGrad;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, ox + 22, winY, w - 44, winH, 6);
      ctx.fill();
      ctx.stroke();

      if (b.kind === 'food') {
        ctx.fillStyle = '#9A3412';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(ox + 52 + i * 32, winY + 13, 7, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(ox + 24, winY + winH - 11, w - 48, 9);
      } else if (b.kind === 'tea') {
        ctx.fillStyle = '#FB7185';
        ctx.fillRect(ox + 34, winY + 6, 56, 15);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(ox + 98, winY + 6, 56, 15);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#FDE047' : '#F43F5E';
          ctx.fillRect(ox + 168 + i * 16, winY + winH - 20, 10, 14);
        }
      } else if (b.kind === 'police') {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(ox + 26, winY + 4, (w - 52) / 2, 6);
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(ox + 26 + (w - 52) / 2, winY + 4, (w - 52) / 2, 6);
        ctx.fillStyle = '#1E3A8A';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('全国反诈预警专线 96110', ox + w / 2, winY + winH - 8);
      } else if (b.kind === 'recycle') {
        ctx.fillStyle = '#D97706';
        ctx.fillRect(ox + 34, winY + winH - 26, 44, 22);
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(ox + w - 82, winY + winH - 24, 20, 20);
        ctx.fillRect(ox + w - 58, winY + winH - 24, 20, 20);
      } else if (b.kind === 'apt' || b.kind === 'parcel') {
        // Hive parcel lockers
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(ox + 32, winY + 5, w - 96, winH - 9);
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1;
        for (let gx = ox + 52; gx < ox + w - 68; gx += 20) {
          ctx.beginPath();
          ctx.moveTo(gx, winY + 5);
          ctx.lineTo(gx, winY + winH - 4);
          ctx.stroke();
        }
      } else if (isCyber) {
        // RGB Monitors / Claw Machines
        const rgb = ['#EC4899', '#06B6D4', '#A855F7', '#22C55E', '#FACC15'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = rgb[i];
          ctx.fillRect(ox + 34 + i * 42, winY + 10, 30, winH - 18);
        }
      } else if (isGlass) {
        // CBD Glass Curtain Wall mullions & golden lobby columns
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        for (let gx = ox + 46; gx < ox + w - 30; gx += 32) {
          ctx.beginPath();
          ctx.moveTo(gx, winY + 2);
          ctx.lineTo(gx, winY + winH - 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = b.roofColor;
      roundRectPath(ctx, ox + w / 2 - 24, wallY + wallH - 12, 48, 10, 3);
      ctx.fill();
    }

    drawFountainPlaza(ctx, px, py, time) {
      ctx.save();

      const outerGrad = ctx.createRadialGradient(px, py, 30, px, py, 205);
      outerGrad.addColorStop(0, '#475569');
      outerGrad.addColorStop(0.75, '#334155');
      outerGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(px, py, 200, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.28)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(a) * 58, py + Math.sin(a) * 58);
        ctx.lineTo(px + Math.cos(a) * 194, py + Math.sin(a) * 194);
        ctx.stroke();
      }

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, 198, 0, Math.PI * 2);
      ctx.stroke();

      // Fountain stone basin
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const waterGrad = ctx.createRadialGradient(px - 6, py - 6, 4, px, py, 40);
      waterGrad.addColorStop(0, '#67E8F9');
      waterGrad.addColorStop(0.65, '#06B6D4');
      waterGrad.addColorStop(1, '#0369A1');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.arc(px, py, 40, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 2; i++) {
        const p = ((time * 0.8 + i * 0.5) % 1);
        ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - p) * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 10 + p * 28, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(248, 250, 252, 0.58)';
      ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ 城市中心反诈广场 ★', px, py + 86);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.fillText('西北:烟火夜市  ·  东北:赛博商圈  ·  西南:滨湖社区  ·  东南:科技园CBD', px, py + 108);

      ctx.restore();
    }

    drawKoiPond(ctx, pond, time) {
      const { x, y, rx, ry } = pond;
      ctx.save();

      // Stone embankment border
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 12, ry + 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Deep emerald-teal pond water
      const wGrad = ctx.createRadialGradient(x - 30, y - 20, 15, x, y, rx);
      wGrad.addColorStop(0, '#14B8A6');
      wGrad.addColorStop(0.65, '#0F766E');
      wGrad.addColorStop(1, '#115E59');
      ctx.fillStyle = wGrad;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animated swimming Koi Fish (锦鲤)!
      for (let i = 0; i < 5; i++) {
        const a = time * (0.45 + i * 0.08) + i * 1.3;
        const kx = x + Math.cos(a) * (rx * 0.55) * Math.cos(i + time * 0.15);
        const ky = y + Math.sin(a * 1.2) * (ry * 0.55);
        const dir = Math.atan2(
          Math.cos(a * 1.2) * 1.2 * (ry * 0.55),
          -Math.sin(a) * (rx * 0.55)
        );
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(dir);
        ctx.fillStyle = i % 2 === 0 ? '#F97316' : '#FDE047';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail swish
        const swish = Math.sin(time * 10 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-14, -4 + swish);
        ctx.lineTo(-14, 4 + swish);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Floating Lily Pads & Pink Lotus Blossoms
      const pads = [
        [-95, -45, 16], [-65, -25, 12], [85, 42, 17], [110, 18, 13], [-30, 58, 15]
      ];
      for (const [dx, dy, pr] of pads) {
        ctx.fillStyle = '#22C55E';
        ctx.strokeStyle = '#14532D';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, pr, 0.25, Math.PI * 1.9);
        ctx.lineTo(x + dx, y + dy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (pr >= 15) {
          ctx.fillStyle = '#F472B6';
          ctx.beginPath();
          ctx.arc(x + dx + 2, y + dy - 2, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Wooden Viewing Deck on East Shore
      ctx.fillStyle = '#92400E';
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, x + rx - 22, y - 34, 48, 68, 5);
      ctx.fill();
      ctx.stroke();
      for (let py = y - 26; py < y + 30; py += 10) {
        ctx.beginPath();
        ctx.moveTo(x + rx - 20, py);
        ctx.lineTo(x + rx + 24, py);
        ctx.stroke();
      }

      ctx.restore();
    }

    drawStreetProp(ctx, prop, time) {
      ctx.save();
      const { x, y, type } = prop;

      if (type === 'lamp') {
        const glow = ctx.createRadialGradient(x, y + 6, 4, x, y + 6, 88);
        glow.addColorStop(0, 'rgba(253, 224, 71, 0.22)');
        glow.addColorStop(0.55, 'rgba(251, 191, 36, 0.08)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y + 6, 88, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(x, y + 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 2.5, y - 22, 5, 34);

        ctx.fillStyle = '#FEF08A';
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y - 24, 6.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'vending') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x - 14, y - 16, 32, 38);
        ctx.fillStyle = prop.color || '#0284C7';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 16, y - 20, 32, 38, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(x - 12, y - 15, 17, 20);
        const cols = ['#EF4444', '#22C55E', '#F59E0B'];
        for (let r = 0; r < 3; r++) {
          ctx.fillStyle = cols[r];
          ctx.fillRect(x - 10, y - 13 + r * 6, 13, 4);
        }
      } else if (type === 'scooter_parked') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 7, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = prop.color || '#38BDF8';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, x - 11, y - 6, 22, 10, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 7, y - 9, 10, 4);
      } else if (type === 'bins') {
        ['#0284C7', '#16A34A'].forEach((col, i) => {
          const bx = x - 13 + i * 15;
          ctx.fillStyle = col;
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.8;
          roundRectPath(ctx, bx, y - 10, 13, 20, 3);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(bx + 3, y - 3, 7, 6);
        });
      } else if (type === 'bbq_table') {
        // Night-Market Umbrella Dining Table & Stools
        const cols = ['#EF4444', '#FACC15', '#EF4444', '#FACC15', '#EF4444', '#FACC15'];
        // Stools
        ctx.fillStyle = '#38BDF8';
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * i) / 4 + 0.78;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * 24, y + Math.sin(a) * 24, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Umbrella canopy
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI * 2 * i) / 6;
          const a2 = (Math.PI * 2 * (i + 1)) / 6;
          ctx.fillStyle = cols[i];
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.arc(x, y, 22, a1, a2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'bench') {
        ctx.fillStyle = '#92400E';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, x - 22, y - 7, 44, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 18, y - 7, 4, 14);
        ctx.fillRect(x + 14, y - 7, 4, 14);
      } else if (type === 'helipad') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.font = '900 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', x, y + 2);
        ctx.textBaseline = 'alphabetic';
      } else if (type === 'manhole') {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.moveTo(x - 9, y);
        ctx.lineTo(x + 9, y);
        ctx.moveTo(x, y - 9);
        ctx.lineTo(x, y + 9);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ==================== HERO: FRIEDRICH (FREDDY) ====================
    drawFreddy(ctx, player, time, isRichLook, aimAngle) {
      ctx.save();

      const pr = player.getPickupRadius();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, pr, time * 0.4, time * 0.4 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const img of player.afterimages) {
        const a = (img.life / img.maxLife) * 0.36;
        ctx.fillStyle = `rgba(56, 189, 248, ${a})`;
        ctx.beginPath();
        ctx.arc(img.x, img.y, 17, 0, Math.PI * 2);
        ctx.fill();
      }

      if (player.invulnTime > 0 && player.dashTime <= 0 && Math.floor(time * 20) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      const x = player.x;
      const y = player.y;
      const stride = player.isMoving ? Math.sin(player.walkPhase) : 0;
      const bob = player.isMoving ? Math.abs(Math.cos(player.walkPhase)) * -3.2 : Math.sin(time * 3.2) * 1.2;
      const hasScooter = player.upgrades.has('scooter');

      ctx.fillStyle = 'rgba(9, 14, 26, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x, y + 18, hasScooter ? 22 : 16, hasScooter ? 9 : 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hasScooter) {
        const moveAng = Math.atan2(player.facingY, player.facingX);
        ctx.save();
        ctx.translate(x, y + 8);
        ctx.rotate(moveAng);
        const beam = ctx.createRadialGradient(12, 0, 2, 46, 0, 68);
        beam.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
        beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(10, -6);
        ctx.lineTo(86, -28);
        ctx.lineTo(86, 28);
        ctx.lineTo(10, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const flip = player.facingX < -0.1 ? -1 : 1;
        ctx.save();
        ctx.translate(x, y + 11);
        ctx.scale(flip, 1);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(-14, 5, 6, 0, Math.PI * 2);
        ctx.arc(14, 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, -17, -4, 30, 10, 5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(14, -14);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#FEF9C3';
        ctx.beginPath();
        ctx.arc(16, -12, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const leftFootY = y + 13 + stride * 4;
        const rightFootY = y + 13 - stride * 4;
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, x - 10, leftFootY, 8, 6, 3);
        ctx.fill();
        ctx.stroke();
        roundRectPath(ctx, x + 2, rightFootY, 8, 6, 3);
        ctx.fill();
        ctx.stroke();
      }

      if (player.delivery) {
        ctx.fillStyle = player.upgrades.has('vip_box') ? '#1E293B' : '#F59E0B';
        ctx.strokeStyle = player.upgrades.has('vip_box') ? '#FACC15' : '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 15, y - 14 + bob, 30, 20, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#334155';
        roundRectPath(ctx, x - 12, y - 9 + bob, 24, 16, 4);
        ctx.fill();
      }

      const hoodieGrad = ctx.createLinearGradient(x, y - 10 + bob, x, y + 12 + bob);
      if (isRichLook) {
        hoodieGrad.addColorStop(0, '#FBBF24');
        hoodieGrad.addColorStop(1, '#D97706');
      } else {
        hoodieGrad.addColorStop(0, '#3B82F6');
        hoodieGrad.addColorStop(1, '#1D4ED8');
      }
      ctx.fillStyle = hoodieGrad;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      roundRectPath(ctx, x - 12, y - 6 + bob, 24, 19, 8);
      ctx.fill();
      ctx.stroke();

      const armSwing = stride * 3.5;
      ctx.fillStyle = isRichLook ? '#F59E0B' : '#2563EB';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x - 13, y + 3 + bob - armSwing, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 13, y + 3 + bob + armSwing, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const lookX = Math.cos(aimAngle) * 3.2;
      const lookY = Math.sin(aimAngle) * 2.2;
      const headY = y - 10 + bob;

      ctx.fillStyle = '#FDE68A';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(x, headY, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (player.mood === 'hurt') {
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, headY - 2);
        ctx.lineTo(x - 2, headY + 2);
        ctx.moveTo(x - 2, headY - 2);
        ctx.lineTo(x - 6, headY + 2);
        ctx.moveTo(x + 2, headY - 2);
        ctx.lineTo(x + 6, headY + 2);
        ctx.moveTo(x + 6, headY - 2);
        ctx.lineTo(x + 2, headY + 2);
        ctx.stroke();
      } else if (player.mood === 'cool' || isRichLook) {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x - 9 + lookX * 0.7, headY - 3 + lookY * 0.5, 8, 5);
        ctx.fillRect(x + 1 + lookX * 0.7, headY - 3 + lookY * 0.5, 8, 5);
        ctx.fillRect(x - 1 + lookX * 0.7, headY - 2 + lookY * 0.5, 2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 8 + lookX * 0.7, headY - 2 + lookY * 0.5, 2.5, 1.5);
        ctx.fillRect(x + 2 + lookX * 0.7, headY - 2 + lookY * 0.5, 2.5, 1.5);
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(x - 4.2 + lookX, headY + lookY, 2.4, 0, Math.PI * 2);
        ctx.arc(x + 4.2 + lookX, headY + lookY, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - 4.8 + lookX, headY - 0.8 + lookY, 0.9, 0, Math.PI * 2);
        ctx.arc(x + 3.6 + lookX, headY - 0.8 + lookY, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hair + Ahoge
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, headY - 2, 12.8, Math.PI * 0.95, Math.PI * 2.05);
      ctx.lineTo(x + 9, headY - 5);
      ctx.lineTo(x + 4, headY - 8);
      ctx.lineTo(x, headY - 4);
      ctx.lineTo(x - 5, headY - 8);
      ctx.lineTo(x - 10, headY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const ahogeSway = Math.sin(time * 7) * 3;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, headY - 14);
      ctx.quadraticCurveTo(x + 5, headY - 22, x + 8 + ahogeSway, headY - 19);
      ctx.stroke();

      ctx.globalAlpha = 1.0;

      if (player.hasShield) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 1.6);
        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i) / 6;
          const rx = Math.cos(a) * 28;
          const ry = Math.sin(a) * 28;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      let tagY = y - 34;
      if (player.delivery) {
        ctx.fillStyle = '#FEF08A';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 36, y - 48 + bob, 72, 17, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 10.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`配送:${player.delivery.timer.toFixed(0)}s`, x, y - 36 + bob);
        tagY = y - 55;
      }

      ctx.font = 'bold 11.5px "Microsoft YaHei", system-ui, sans-serif';
      const nameStr = 'FriedRich (Freddy)';
      const nw = ctx.measureText(nameStr).width + 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      roundRectPath(ctx, x - nw / 2, tagY - 13, nw, 17, 5);
      ctx.fill();
      ctx.fillStyle = isRichLook ? '#FDE047' : '#93C5FD';
      ctx.textAlign = 'center';
      ctx.fillText(nameStr, x, tagY - 1);

      ctx.restore();
    }

    // ==================== COLLECTIBLES ====================
    drawCollectibleSprite(ctx, item, time) {
      ctx.save();
      if (item.life !== null && item.life < 2.2 && Math.floor(time * 12) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      const bob = Math.sin(time * 4.2 + item.bobOffset) * 3.2;
      const x = item.x;
      const y = item.y + bob;

      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x, item.y + 13, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const haloGrad = ctx.createRadialGradient(x, y, 2, x, y, item.radius + 10);
      haloGrad.addColorStop(0, item.type === 'emp_pack' ? 'rgba(56,189,248,0.45)' : 'rgba(74,222,128,0.32)');
      haloGrad.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(x, y, item.radius + 10, 0, Math.PI * 2);
      ctx.fill();

      if (item.type === 'bottle') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#7DD3FC';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, -6, -9, 12, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(-6, -2, 12, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3.5, -14, 7, 4);
        ctx.strokeRect(-3.5, -14, 7, 4);
        ctx.restore();
      } else if (item.type === 'can') {
        // Red-and-silver aluminum soda can
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0.28);
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, -7, -9, 14, 18, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(-6, -9, 12, 3);
        ctx.fillRect(-6, 6, 12, 3);
        ctx.restore();
      } else if (item.type === 'cardboard') {
        ctx.fillStyle = '#D97706';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, x - 13, y - 10, 26, 20, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(x - 12, y - 9, 24, 8);
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(x - 3, y - 10, 6, 20);
      } else if (item.type === 'cash_small' || item.type === 'dropped_cash' || item.type === 'bounty_cash') {
        const isBig = item.value >= 40 || item.type === 'bounty_cash';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.18);
        ctx.fillStyle = isBig ? '#EF4444' : '#10B981';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, -14, -8, 28, 16, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(-3, -8, 6, 16);
        ctx.restore();
      } else if (item.type === 'maotai_bottle') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0.2);
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, -7, -9, 14, 21, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(-7, -3);
        ctx.lineTo(7, 2);
        ctx.lineTo(7, 7);
        ctx.lineTo(-7, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-4, -15, 8, 6);
        ctx.restore();
      } else if (item.type === 'red_packet') {
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 11, y - 14, 22, 28, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(x, y + 1, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'emp_pack') {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(x, y, 20, time * 3, time * 3 + Math.PI * 1.4);
        ctx.stroke();
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 11, y - 11, 22, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 8);
        ctx.lineTo(x - 5, y + 1);
        ctx.lineTo(x, y + 1);
        ctx.lineTo(x - 2, y + 8);
        ctx.lineTo(x + 5, y - 1);
        ctx.lineTo(x, y - 1);
        ctx.closePath();
        ctx.fill();
      }

      if (item.value >= 12 || item.type === 'emp_pack') {
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        ctx.fillStyle = item.type === 'emp_pack' ? '#7DD3FC' : '#FEF08A';
        const txt = item.type === 'emp_pack' ? `⚡电击重创+¥${item.value}` : `+¥${item.value}`;
        ctx.strokeText(txt, x, y - item.radius - 7);
        ctx.fillText(txt, x, y - item.radius - 7);
      }

      ctx.restore();
    }

    // ==================== TRAPS & SCAMMERS ====================
    drawTrapSprite(ctx, trap, time, eagleEye) {
      ctx.save();
      const { x, y, radius, kind } = trap;

      if (kind === 'phishing_zone' || kind === 'freeze_grid') {
        const armed = trap.armTime <= 0;
        const isIce = kind === 'freeze_grid';
        ctx.fillStyle = armed
          ? (isIce ? 'rgba(56, 189, 248, 0.24)' : 'rgba(192, 38, 211, 0.20)')
          : 'rgba(244, 63, 94, 0.12)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = armed ? (isIce ? '#38BDF8' : '#E879F9') : '#FDA4AF';
        ctx.lineWidth = armed ? 3 : 2;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(x, y, radius, -time * 1.2, -time * 1.2 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isIce) {
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
          ctx.beginPath();
          ctx.moveTo(x - radius * 0.7, y);
          ctx.lineTo(x + radius * 0.7, y);
          ctx.moveTo(x, y - radius * 0.7);
          ctx.lineTo(x, y + radius * 0.7);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#F0ABFC';
          ctx.strokeRect(x - 14, y - 16, 10, 10);
          ctx.strokeRect(x + 4, y - 16, 10, 10);
          ctx.strokeRect(x - 14, y + 2, 10, 10);
        }

        ctx.fillStyle = '#FAE8FF';
        ctx.font = 'bold 11.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️${trap.slogan}`, x, y + 26);
      } else {
        const jx = Math.sin(time * 32) * 1.5;
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.moveTo(x - 10 + jx, y - 11);
        ctx.lineTo(x - 15 + jx, y - 20);
        ctx.lineTo(x - 4 + jx, y - 13);
        ctx.moveTo(x + 10 + jx, y - 11);
        ctx.lineTo(x + 15 + jx, y - 20);
        ctx.lineTo(x + 4 + jx, y - 13);
        ctx.fill();

        ctx.fillStyle = '#6B21A8';
        ctx.strokeStyle = '#FB7185';
        ctx.lineWidth = 2.2;
        roundRectPath(ctx, x - 12 + jx, y - 14, 24, 28, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('诈', x + jx, y + 4);

        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = eagleEye ? '#FCA5A5' : '#F0ABFC';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        const lbl = eagleEye ? '🚫假红包[右键/E净化]' : `"${trap.slogan}"`;
        ctx.strokeText(lbl, x, y - 24);
        ctx.fillText(lbl, x, y - 24);
      }

      ctx.restore();
    }

    drawScammerSprite(ctx, s, time) {
      ctx.save();
      const { x, y, radius, type } = s;
      const hover = Math.sin(time * 6 + x * 0.1) * 2.5;

      if (s.isHoloClone) {
        ctx.globalAlpha = 0.72 + Math.sin(time * 20) * 0.15;
      }

      if (type === 'mentor' && s.state === 'windup') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + s.lungeDx * 220, y + s.lungeDy * 220);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(x, y + 17, 16, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'spammer' || s.isHoloClone) {
        ctx.fillStyle = s.isHoloClone ? '#0E7490' : '#3B0764';
        ctx.strokeStyle = s.isHoloClone ? '#67E8F9' : '#F472B6';
        ctx.lineWidth = 2.2;
        roundRectPath(ctx, x - 13, y - 17 + hover, 26, 34, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = s.isHoloClone ? '#EC4899' : '#DB2777';
        roundRectPath(ctx, x - 10, y - 12 + hover, 20, 22, 3);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 6 + hover);
        ctx.lineTo(x - 2, y - 3 + hover);
        ctx.lineTo(x - 7, y - 2 + hover);
        ctx.moveTo(x + 7, y - 6 + hover);
        ctx.lineTo(x + 2, y - 3 + hover);
        ctx.lineTo(x + 7, y - 2 + hover);
        ctx.fill();
      } else if (type === 'mentor') {
        ctx.fillStyle = '#7F1D1D';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.2;
        roundRectPath(ctx, x - 13, y - 4, 26, 20, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.arc(x, y - 10, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#581C87';
        ctx.beginPath();
        ctx.arc(x, y - 13, 11, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = s.state === 'windup' ? '#EF4444' : '#0F172A';
        ctx.fillRect(x - 9, y - 12, 18, 4.5);
      } else {
        const spin = Math.sin(time * 28) * 10;
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 20 - spin * 0.3, y - 14 + hover);
        ctx.lineTo(x - 8 + spin * 0.3, y - 14 + hover);
        ctx.moveTo(x + 8 - spin * 0.3, y - 14 + hover);
        ctx.lineTo(x + 20 + spin * 0.3, y - 14 + hover);
        ctx.stroke();

        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y - 7 + hover, 9, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4C1D95';
        ctx.strokeStyle = '#E9D5FF';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 14, y - 7 + hover, 28, 22, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(x, y + 3 + hover, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (s.stunTime > 0) {
        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💫眩晕', x, y - radius - 26);
      } else {
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(s.slogan).width + 10;
        ctx.fillStyle = 'rgba(59, 7, 100, 0.88)';
        roundRectPath(ctx, x - tw / 2, y - radius - 25, tw, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#F5D0FE';
        ctx.fillText(s.slogan, x, y - radius - 13);
      }

      ctx.restore();
    }

    // ==================== 4 UNIQUE MULTI-PART BOSS SPRITES ====================
    drawBossSprite(ctx, boss, time) {
      ctx.save();
      const { x, y, bossId } = boss;
      const hover = Math.sin(time * 4.2) * 3.5;
      const bodyY = y + hover;

      if (boss.state === 'windup') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 12;
        ctx.setLineDash([16, 10]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + boss.chargeDx * 320, y + boss.chargeDy * 320);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y + 38, boss.radius + 4, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      if (bossId === 'jack') {
        // BOSS 1: 金牌派单总监·杰克导师 (Hoverboard + Pinstripe Suit + Fanned Golden Contracts)
        // Neon hoverboard
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        roundRectPath(ctx, x - 34, bodyY + 18, 68, 14, 7);
        ctx.fill();
        ctx.stroke();

        // Suit torso
        ctx.fillStyle = boss.hitFlash > 0 ? '#FFFFFF' : '#581C87';
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3;
        roundRectPath(ctx, x - 24, bodyY - 14, 48, 36, 10);
        ctx.fill();
        ctx.stroke();

        // Golden tie
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.moveTo(x, bodyY - 12);
        ctx.lineTo(x - 5, bodyY + 8);
        ctx.lineTo(x, bodyY + 15);
        ctx.lineTo(x + 5, bodyY + 8);
        ctx.closePath();
        ctx.fill();

        // Fanned golden VIP contracts in left hand
        for (let i = -1; i <= 1; i++) {
          ctx.save();
          ctx.translate(x + 28, bodyY);
          ctx.rotate(i * 0.28 + Math.sin(time * 5) * 0.1);
          ctx.fillStyle = '#FEF08A';
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-6, -14, 12, 18);
          ctx.strokeRect(-6, -14, 12, 18);
          ctx.restore();
        }

        // Head, pompadour hair & glowing red shades
        ctx.fillStyle = '#FDE68A';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, bodyY - 26, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1E1B4B';
        ctx.beginPath();
        ctx.arc(x - 2, bodyY - 32, 17, Math.PI * 0.9, Math.PI * 2.15);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.fillRect(x - 14, bodyY - 29, 28, 6);
      } else if (bossId === 'phantom') {
        // BOSS 2: AI 拟声千面客服·魅影姬 (Cyber-Idol Core + 4 Orbiting Neon Ring Lights + Soundwaves)
        // Expanding soundwave base rings
        const waveR = 30 + ((time * 40) % 32);
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y + 10, waveR, 0, Math.PI * 2);
        ctx.stroke();

        // 4 Orbiting Streamer Ring Lights
        for (let i = 0; i < 4; i++) {
          const a = time * 2.2 + (Math.PI * 2 * i) / 4;
          const rx = x + Math.cos(a) * 48;
          const ry = bodyY + Math.sin(a) * 28;
          ctx.strokeStyle = i % 2 === 0 ? '#67E8F9' : '#F472B6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(rx, ry, 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Cyber dress & holographic screen core
        ctx.fillStyle = boss.hitFlash > 0 ? '#FFFFFF' : '#831843';
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, bodyY - 34);
        ctx.lineTo(x + 30, bodyY + 26);
        ctx.lineTo(x - 30, bodyY + 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Head + Cyber Cat-Ear Headset
        ctx.fillStyle = '#FCE7F3';
        ctx.beginPath();
        ctx.arc(x, bodyY - 22, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.moveTo(x - 15, bodyY - 30);
        ctx.lineTo(x - 20, bodyY - 46);
        ctx.lineTo(x - 5, bodyY - 36);
        ctx.moveTo(x + 15, bodyY - 30);
        ctx.lineTo(x + 20, bodyY - 46);
        ctx.lineTo(x + 5, bodyY - 36);
        ctx.fill();

        // winking cyber eyes
        ctx.fillStyle = '#06B6D4';
        ctx.beginPath();
        ctx.arc(x - 6, bodyY - 21, 3, 0, Math.PI * 2);
        ctx.arc(x + 6, bodyY - 21, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (bossId === 'freezer404') {
        // BOSS 3: 黑客洗钱巨兽·冻结者404 (4-Legged Spider-Mech + Cryo Tanks + Matrix Server Rack)
        // 4 Articulated Mechanical Spider Legs!
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 6;
        const legAngles = [-2.4, -0.7, 0.7, 2.4];
        legAngles.forEach((la, idx) => {
          const step = Math.sin(time * 8 + idx * Math.PI * 0.5) * 7;
          const kx = x + Math.cos(la) * 34;
          const ky = y + Math.sin(la) * 24 - 10;
          const fx = x + Math.cos(la) * 54;
          const fy = y + Math.sin(la) * 40 + step;
          ctx.beginPath();
          ctx.moveTo(x, bodyY);
          ctx.lineTo(kx, ky);
          ctx.lineTo(fx, fy);
          ctx.stroke();
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(fx, fy, 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Twin Liquid-Nitrogen Cryo Tanks on back
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 34, bodyY - 36, 18, 30, 6);
        ctx.fill();
        ctx.stroke();
        roundRectPath(ctx, x + 16, bodyY - 36, 18, 30, 6);
        ctx.fill();
        ctx.stroke();

        // Heavy Armored Server Chassis
        ctx.fillStyle = boss.hitFlash > 0 ? '#FFFFFF' : '#1E293B';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3.5;
        roundRectPath(ctx, x - 32, bodyY - 24, 64, 52, 12);
        ctx.fill();
        ctx.stroke();

        // Blinking green hacker server LEDs & '404' screen
        ctx.fillStyle = '#020617';
        roundRectPath(ctx, x - 24, bodyY - 14, 48, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#4ADE80';
        ctx.font = '900 14px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ERR:404', x, bodyY + 3);
      } else {
        // BOSS 4: 境外刷单总庄家·王总 (Golden Casino Slot-Throne Mech)
        [-54, 54].forEach((dx, idx) => {
          const sy = bodyY - 8 + Math.sin(time * 5 + idx * 2) * 4;
          ctx.fillStyle = 'rgba(88, 28, 135, 0.92)';
          ctx.strokeStyle = '#F472B6';
          ctx.lineWidth = 2;
          roundRectPath(ctx, x + dx - 15, sy - 12, 30, 22, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FDE047';
          ctx.font = 'bold 9px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(idx === 0 ? '卡单!' : '通吃!', x + dx, sy + 2);
        });

        const bodyGrad = ctx.createLinearGradient(x, bodyY - 38, x, bodyY + 36);
        bodyGrad.addColorStop(0, boss.hitFlash > 0 ? '#FFFFFF' : '#7E22CE');
        bodyGrad.addColorStop(1, boss.hitFlash > 0 ? '#FDE047' : '#3B0764');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 4;
        roundRectPath(ctx, x - 38, bodyY - 36, 76, 72, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        roundRectPath(ctx, x - 28, bodyY - 8, 56, 26, 5);
        ctx.fill();
        const chars = ['诈', '骗', '局'];
        for (let i = 0; i < 3; i++) {
          const rx = x - 24 + i * 17;
          ctx.fillStyle = '#FEF3C7';
          ctx.fillRect(rx, bodyY - 4, 14, 18);
          ctx.fillStyle = '#DC2626';
          ctx.font = '900 12px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(chars[i], rx + 7, bodyY + 9);
        }

        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 22, bodyY - 36);
        ctx.lineTo(x - 26, bodyY - 54);
        ctx.lineTo(x - 11, bodyY - 44);
        ctx.lineTo(x, bodyY - 58);
        ctx.lineTo(x + 11, bodyY - 44);
        ctx.lineTo(x + 26, bodyY - 54);
        ctx.lineTo(x + 22, bodyY - 36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Overhead Boss HP Bar & Nameplate
      const barW = 148;
      const barH = 11;
      const bx = x - barW / 2;
      const by = bodyY - 74;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      roundRectPath(ctx, bx - 2, by - 2, barW + 4, barH + 4, 5);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      roundRectPath(ctx, bx, by, Math.max(4, barW * (boss.hp / boss.maxHp)), barH, 4);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.strokeText(`👑 ${boss.name}`, x, by - 7);
      ctx.fillText(`👑 ${boss.name}`, x, by - 7);

      ctx.restore();
    }

    drawCrosshair(ctx, wx, wy, time, grabReady) {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.strokeStyle = grabReady ? '#38BDF8' : 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 2;

      const r = 12 + Math.sin(time * 5) * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-r - 5, 0);
      ctx.lineTo(-r + 3, 0);
      ctx.moveTo(r - 3, 0);
      ctx.lineTo(r + 5, 0);
      ctx.moveTo(0, -r - 5);
      ctx.lineTo(0, -r + 3);
      ctx.moveTo(0, r - 3);
      ctx.lineTo(0, r + 5);
      ctx.stroke();

      ctx.fillStyle = grabReady ? '#FDE047' : '#94A3B8';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  window.Collect1200.graphics = new GraphicsEngine();
  window.Collect1200.roundRectPath = roundRectPath;
})();
