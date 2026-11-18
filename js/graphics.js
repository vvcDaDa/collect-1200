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
      this.buildingCache = new Map();
      this.treeCache = null;
      this.initPatterns();
      this.initTreeSprite();
    }

    initPatterns() {
      // 1. Sidewalk Herringbone / Brick Paver Pattern
      const sw = createOffscreen(64, 64);
      const sctx = sw.getContext('2d');
      sctx.fillStyle = '#3B495E';
      sctx.fillRect(0, 0, 64, 64);

      const brickW = 32;
      const brickH = 16;
      const tones = ['#42526B', '#3E4E66', '#465772', '#3A4960'];
      for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 3; col++) {
          const bx = col * brickW + offset;
          const by = row * brickH;
          sctx.fillStyle = tones[(row * 3 + col + 4) % tones.length];
          sctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
          sctx.fillStyle = 'rgba(255,255,255,0.045)';
          sctx.fillRect(bx + 1, by + 1, brickW - 2, 2);
          sctx.fillStyle = 'rgba(15,23,42,0.22)';
          sctx.fillRect(bx + 1, by + brickH - 2, brickW - 2, 1.5);
        }
      }
      this.sidewalkCanvas = sw;

      // 2. Asphalt Grain Pattern
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
      this.asphaltCanvas = asp;
    }

    getPattern(ctx, key) {
      if (!this.patterns[key]) {
        const src = key === 'sidewalk' ? this.sidewalkCanvas : this.asphaltCanvas;
        this.patterns[key] = ctx.createPattern(src, 'repeat');
      }
      return this.patterns[key];
    }

    initTreeSprite() {
      const c = createOffscreen(96, 96);
      const ctx = c.getContext('2d');
      const cx = 48;
      const cy = 50;

      // Stone tree planter ring on sidewalk
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, cx - 22, cy + 8, 44, 24, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3F2E21';
      roundRectPath(ctx, cx - 17, cy + 12, 34, 16, 4);
      ctx.fill();

      // Drop shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.beginPath();
      ctx.ellipse(cx + 6, cy + 16, 28, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 6, cy - 2, 12, 22);
      ctx.strokeRect(cx - 6, cy - 2, 12, 22);

      // Multi-layered lush foliage clusters
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

      // Crisp cartoon outline around canopy silhouette
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 13, 28, Math.PI * 0.85, Math.PI * 2.15);
      ctx.stroke();

      // Tiny warm osmanthus blossoms
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
      const roofH = Math.round(h * 0.58);
      const wallY = oy + roofH;
      const wallH = h - roofH;

      // 1. Ambient Ground Shadow (2.5D depth)
      ctx.fillStyle = 'rgba(9, 14, 26, 0.58)';
      roundRectPath(ctx, ox + 10, oy + 14, w + 4, h + 4, 14);
      ctx.fill();

      // 2. Storefront Lower Facade Wall
      const wallGrad = ctx.createLinearGradient(0, wallY, 0, oy + h);
      wallGrad.addColorStop(0, b.wallTop || '#E2E8F0');
      wallGrad.addColorStop(1, b.wallBot || '#CBD5E1');
      ctx.fillStyle = wallGrad;
      roundRectPath(ctx, ox, wallY - 8, w, wallH + 8, 10);
      ctx.fill();

      // Subtle brick courses on facade
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = 1;
      for (let by = wallY + 8; by < oy + h - 10; by += 10) {
        ctx.beginPath();
        ctx.moveTo(ox + 4, by);
        ctx.lineTo(ox + w - 4, by);
        ctx.stroke();
      }

      // Stone foundation wainscoting at bottom
      ctx.fillStyle = '#475569';
      roundRectPath(ctx, ox, oy + h - 14, w, 14, 6);
      ctx.fill();

      // 3. Shop Interior Windows & Service Counter (Theme-Specific Rich Detail!)
      this.drawShopFacadeDetails(ctx, b, ox, wallY, w, wallH);

      // 4. Scalloped 3D Striped Awning overhanging storefront
      const awnY = wallY - 4;
      const awnH = 20;
      // Awning shadow on wall
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

      // 5. 2.5D Sloped / Parapet Roof Deck
      const roofGrad = ctx.createLinearGradient(0, oy, 0, oy + roofH);
      roofGrad.addColorStop(0, b.roofTop || b.roofColor);
      roofGrad.addColorStop(1, b.roofColor);
      ctx.fillStyle = roofGrad;
      roundRectPath(ctx, ox - 2, oy, w + 4, roofH, 12);
      ctx.fill();

      // Parapet inner recessed roof deck
      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      roundRectPath(ctx, ox + 10, oy + 10, w - 20, roofH - 22, 8);
      ctx.fill();

      // Roof tile / seam lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      for (let rx = ox + 26; rx < ox + w - 20; rx += 26) {
        ctx.beginPath();
        ctx.moveTo(rx, oy + 12);
        ctx.lineTo(rx, oy + roofH - 14);
        ctx.stroke();
      }

      // Rooftop Props: Skylight + HVAC Duct + AC Outdoor Unit base
      ctx.fillStyle = '#94A3B8';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      // HVAC unit box (left roof)
      roundRectPath(ctx, ox + 20, oy + 16, 42, 28, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(ox + 35, oy + 30, 9, 0, Math.PI * 2);
      ctx.fill();
      // Vents on right side of AC
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      for (let vy = oy + 21; vy <= oy + 38; vy += 4) {
        ctx.beginPath();
        ctx.moveTo(ox + 48, vy);
        ctx.lineTo(ox + 57, vy);
        ctx.stroke();
      }

      // Rooftop skylight / solar panel on right roof
      const skyGrad = ctx.createLinearGradient(ox + w - 76, oy + 16, ox + w - 22, oy + 44);
      skyGrad.addColorStop(0, '#38BDF8');
      skyGrad.addColorStop(1, '#1D4ED8');
      ctx.fillStyle = skyGrad;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      roundRectPath(ctx, ox + w - 76, oy + 16, 54, 26, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.moveTo(ox + w - 68, oy + 20);
      ctx.lineTo(ox + w - 54, oy + 38);
      ctx.stroke();

      // 6. Glowing Neon / Framed Billboard Sign mounted at Roof Front Edge
      const signW = Math.min(w - 28, 226);
      const signH = 38;
      const signX = ox + (w - signW) / 2;
      const signY = oy + roofH - signH - 8;

      // Sign outer glow
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

      // Custom Vector Sign Badge + Crisp Typography
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
      ctx.font = '900 17px "Microsoft YaHei", system-ui, sans-serif';
      ctx.fillText(b.title, signX + signW / 2 + 10, signY + signH / 2 + 1);
      ctx.textBaseline = 'alphabetic';

      // Crisp outer building outline
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      roundRectPath(ctx, ox, oy, w, h, 12);
      ctx.stroke();

      const entry = { canvas, pad, acFanX: ox + 35, acFanY: oy + 30 };
      this.buildingCache.set(b.id, entry);
      return entry;
    }

    drawShopFacadeDetails(ctx, b, ox, wallY, w, wallH) {
      const winY = wallY + 18;
      const winH = wallH - 34;

      // Warm interior glow window
      const glowGrad = ctx.createLinearGradient(0, winY, 0, winY + winH);
      glowGrad.addColorStop(0, '#FEF3C7');
      glowGrad.addColorStop(1, '#F59E0B');
      ctx.fillStyle = b.id === 'netcafe' ? '#311042' : b.id === 'police' ? '#DBEAFE' : glowGrad;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, ox + 22, winY, w - 44, winH, 6);
      ctx.fill();
      ctx.stroke();

      if (b.id === 'porkrice' || b.id === 'shaxian') {
        // Hanging roast meat / bamboo steamers & stainless service counter
        ctx.fillStyle = '#9A3412';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(ox + 52 + i * 28, winY + 14, 7, 11, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Counter shelf
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(ox + 24, winY + winH - 12, w - 48, 10);
      } else if (b.id === 'milktea') {
        // Colorful menu board & shaker cups
        ctx.fillStyle = '#FB7185';
        ctx.fillRect(ox + 34, winY + 6, 54, 16);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(ox + 96, winY + 6, 54, 16);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#FDE047' : '#F43F5E';
          ctx.fillRect(ox + 165 + i * 16, winY + winH - 22, 10, 14);
        }
      } else if (b.id === 'police') {
        // 96110 Police emblem & red-blue beacon strip
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(ox + 26, winY + 4, (w - 52) / 2, 6);
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(ox + 26 + (w - 52) / 2, winY + 4, (w - 52) / 2, 6);
        ctx.fillStyle = '#1E3A8A';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('全国反诈专线 96110 · 守护钱袋子', ox + w / 2, winY + winH - 8);
      } else if (b.id === 'recycle') {
        // Stacked cardboard bales & blue plastic drums
        ctx.fillStyle = '#D97706';
        ctx.fillRect(ox + 34, winY + winH - 28, 42, 24);
        ctx.strokeRect(ox + 34, winY + winH - 28, 42, 24);
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(ox + w - 82, winY + winH - 26, 20, 22);
        ctx.fillRect(ox + w - 58, winY + winH - 26, 20, 22);
      } else if (b.id === 'apt') {
        // Yellow Hive Parcel Lockers (丰巢外卖柜) & lobby gate!
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(ox + 32, winY + 6, 92, winH - 10);
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1;
        for (let gx = ox + 50; gx < ox + 120; gx += 18) {
          ctx.beginPath();
          ctx.moveTo(gx, winY + 6);
          ctx.lineTo(gx, winY + winH - 4);
          ctx.stroke();
        }
      } else if (b.id === 'netcafe') {
        // Glowing RGB Gaming Monitors inside cyber cafe!
        const rgb = ['#EC4899', '#06B6D4', '#A855F7', '#22C55E'];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = rgb[i];
          ctx.fillRect(ox + 36 + i * 36, winY + 12, 26, 16);
        }
      }

      // Doorway welcome mat at center bottom
      ctx.fillStyle = b.roofColor;
      roundRectPath(ctx, ox + w / 2 - 24, wallY + wallH - 12, 48, 10, 3);
      ctx.fill();
    }

    drawFountainPlaza(ctx, px, py, time) {
      ctx.save();

      // Outer decorative octagonal/circular stone ring
      const outerGrad = ctx.createRadialGradient(px, py, 30, px, py, 175);
      outerGrad.addColorStop(0, '#475569');
      outerGrad.addColorStop(0.75, '#334155');
      outerGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(px, py, 172, 0, Math.PI * 2);
      ctx.fill();

      // Decorative compass mosaic spokes
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.28)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(a) * 52, py + Math.sin(a) * 52);
        ctx.lineTo(px + Math.cos(a) * 166, py + Math.sin(a) * 166);
        ctx.stroke();
      }

      // Concentric gold/stone rings
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(px, py, 170, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 122, 0, Math.PI * 2);
      ctx.stroke();

      // Central Ornamental Water Fountain Basin (walkable border around it)
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Animated turquoise fountain water
      const waterGrad = ctx.createRadialGradient(px - 6, py - 6, 4, px, py, 37);
      waterGrad.addColorStop(0, '#67E8F9');
      waterGrad.addColorStop(0.65, '#06B6D4');
      waterGrad.addColorStop(1, '#0369A1');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.arc(px, py, 36, 0, Math.PI * 2);
      ctx.fill();

      // Expanding water ripples
      for (let i = 0; i < 2; i++) {
        const p = ((time * 0.8 + i * 0.5) % 1);
        ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - p) * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 8 + p * 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Central golden anti-scam shield statue pedestal
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Water spray droplets
      ctx.fillStyle = '#E0F2FE';
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 * i) / 6 + time * 1.4;
        const r = 14 + Math.sin(time * 6 + i) * 7;
        ctx.beginPath();
        ctx.arc(px + Math.cos(ang) * r, py + Math.sin(ang) * r, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inscribed plaza motto along south & north arc
      ctx.fillStyle = 'rgba(248, 250, 252, 0.55)';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ 反诈中心广场 · 帮 FriedRich 凑齐 ¥1200 ★', px, py + 76);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.fillText('左键/Q 抓钩吸金  ·  右键/E 96110举报  ·  Space 滑铲闪避', px, py + 96);

      ctx.restore();
    }

    drawStreetProp(ctx, prop, time) {
      ctx.save();
      const { x, y, type } = prop;

      if (type === 'lamp') {
        // Warm radial light pool on pavement
        const glow = ctx.createRadialGradient(x, y + 6, 4, x, y + 6, 86);
        glow.addColorStop(0, 'rgba(253, 224, 71, 0.22)');
        glow.addColorStop(0.55, 'rgba(251, 191, 36, 0.08)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y + 6, 86, 0, Math.PI * 2);
        ctx.fill();

        // Cast iron lamp base & post
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 2.5, y - 22, 5, 34);

        // Glowing lantern globe
        ctx.fillStyle = '#FEF08A';
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 10 + Math.sin(time * 4 + x) * 2;
        ctx.beginPath();
        ctx.arc(x, y - 24, 6.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'vending') {
        // Glowing street beverage vending machine
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x - 14, y - 16, 32, 38);
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 16, y - 20, 32, 38, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(x - 12, y - 15, 17, 20);
        // Tiny colorful drink cans inside
        const cols = ['#EF4444', '#22C55E', '#F59E0B'];
        for (let r = 0; r < 3; r++) {
          ctx.fillStyle = cols[r];
          ctx.fillRect(x - 10, y - 13 + r * 6, 13, 4);
        }
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x - 11, y + 8, 16, 6);
      } else if (type === 'scooter_parked') {
        // Parked shared electric moped
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 7, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x - 13, y + 1, 7, 5);
        ctx.fillRect(x + 6, y + 1, 7, 5);

        ctx.fillStyle = prop.color || '#38BDF8';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, x - 11, y - 6, 22, 10, 4);
        ctx.fill();
        ctx.stroke();

        // Seat & handlebar
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 7, y - 9, 10, 4);
        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(x + 7, y - 5);
        ctx.lineTo(x + 9, y - 13);
        ctx.stroke();
      } else if (type === 'bins') {
        // Twin sorted recycling & trash bins
        const binColors = ['#0284C7', '#16A34A'];
        binColors.forEach((col, i) => {
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
    drawFreddy(ctx, player, time, currentMoney, aimAngle) {
      ctx.save();

      // Subtle magnetic pickup field ring
      const pr = player.getPickupRadius();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, pr, time * 0.4, time * 0.4 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dash motion afterimages
      for (const img of player.afterimages) {
        const a = (img.life / img.maxLife) * 0.36;
        ctx.fillStyle = `rgba(56, 189, 248, ${a})`;
        ctx.beginPath();
        ctx.arc(img.x, img.y, 17, 0, Math.PI * 2);
        ctx.fill();
      }

      // Invulnerability blink
      if (player.invulnTime > 0 && player.dashTime <= 0 && Math.floor(time * 20) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      const x = player.x;
      const y = player.y;
      const stride = player.isMoving ? Math.sin(player.walkPhase) : 0;
      const bob = player.isMoving ? Math.abs(Math.cos(player.walkPhase)) * -3.2 : Math.sin(time * 3.2) * 1.2;
      const hasScooter = player.upgrades.has('scooter');
      const isRichLook = currentMoney >= 900;

      // Ground shadow
      ctx.fillStyle = 'rgba(9, 14, 26, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x, y + 18, hasScooter ? 22 : 16, hasScooter ? 9 : 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Optional Scooter Headlight Cone & Detailed Scooter Body
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

        // Scooter chassis & wheels
        const flip = player.facingX < -0.1 ? -1 : 1;
        ctx.save();
        ctx.translate(x, y + 11);
        ctx.scale(flip, 1);
        // Wheels
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(-14, 5, 6, 0, Math.PI * 2);
        ctx.arc(14, 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.arc(-14, 5, 2.5, 0, Math.PI * 2);
        ctx.arc(14, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mint-Gold Scooter body
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, -17, -4, 30, 10, 5);
        ctx.fill();
        ctx.stroke();
        // Front stem & headlight
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
        // Articulated Sneakers (Walking Animation!)
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

      // Backpack / Insulated Delivery Box behind torso
      if (player.delivery) {
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 15, y - 14 + bob, 30, 20, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#334155';
        roundRectPath(ctx, x - 12, y - 9 + bob, 24, 16, 4);
        ctx.fill();
      }

      // Hoodie Torso (Blue worker hoodie -> Golden Rich jacket above ¥900!)
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

      // White hoodie drawstrings
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + bob);
      ctx.lineTo(x - 3, y + 6 + bob);
      ctx.moveTo(x + 3, y + bob);
      ctx.lineTo(x + 3, y + 6 + bob);
      ctx.stroke();

      // Swinging Arms / Megaphone at hip
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

      if (player.upgrades.has('megaphone')) {
        // 96110 Red-White Megaphone held in right hand
        ctx.save();
        ctx.translate(x + 15, y + 2 + bob);
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(9, -5);
        ctx.lineTo(9, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Articulated Head & Expressive Face looking toward aim/movement
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

      // Rosy cheeks
      ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
      ctx.beginPath();
      ctx.arc(x - 7 + lookX * 0.6, headY + 3 + lookY * 0.5, 2.4, 0, Math.PI * 2);
      ctx.arc(x + 7 + lookX * 0.6, headY + 3 + lookY * 0.5, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Eyes / Expressions
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
        // Sleek pixel/deal-with-it shades with white shine
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x - 9 + lookX * 0.7, headY - 3 + lookY * 0.5, 8, 5);
        ctx.fillRect(x + 1 + lookX * 0.7, headY - 3 + lookY * 0.5, 8, 5);
        ctx.fillRect(x - 1 + lookX * 0.7, headY - 2 + lookY * 0.5, 2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 8 + lookX * 0.7, headY - 2 + lookY * 0.5, 2.5, 1.5);
        ctx.fillRect(x + 2 + lookX * 0.7, headY - 2 + lookY * 0.5, 2.5, 1.5);
      } else {
        // Crisp expressive eyes with white catchlights
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

      // Spiky Hair + Bouncing Ahoge (呆毛)!
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

      // Ahoge bounce
      const ahogeSway = Math.sin(time * 7) * 3;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, headY - 14);
      ctx.quadraticCurveTo(x + 5, headY - 22, x + 8 + ahogeSway, headY - 19);
      ctx.stroke();

      // Golden Crown when Rich / Victory!
      if (currentMoney >= 1200) {
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#854D0E';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x - 9, headY - 13);
        ctx.lineTo(x - 10, headY - 23);
        ctx.lineTo(x - 4, headY - 18);
        ctx.lineTo(x, headY - 25);
        ctx.lineTo(x + 4, headY - 18);
        ctx.lineTo(x + 10, headY - 23);
        ctx.lineTo(x + 9, headY - 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;

      // Rotating Hexagonal Holographic 96110 Shield
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

      // Floating Takeout Flag when carrying order
      let tagY = y - 34;
      if (player.delivery) {
        ctx.fillStyle = '#FEF08A';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 34, y - 48 + bob, 68, 17, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 10.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`配送:${player.delivery.timer.toFixed(0)}s`, x, y - 36 + bob);
        tagY = y - 55;
      }

      // Hero Nameplate
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

    // ==================== CUSTOM HAND-DRAWN COLLECTIBLES ====================
    drawCollectibleSprite(ctx, item, time) {
      ctx.save();
      if (item.life !== null && item.life < 2.2 && Math.floor(time * 12) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      const bob = Math.sin(time * 4.2 + item.bobOffset) * 3.2;
      const x = item.x;
      const y = item.y + bob;

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x, item.y + 13, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft positive halo
      const haloGrad = ctx.createRadialGradient(x, y, 2, x, y, item.radius + 10);
      haloGrad.addColorStop(0, item.type === 'emp_pack' ? 'rgba(56,189,248,0.45)' : 'rgba(74,222,128,0.32)');
      haloGrad.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(x, y, item.radius + 10, 0, Math.PI * 2);
      ctx.fill();

      if (item.type === 'bottle') {
        // Tilted translucent PET water bottle
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#7DD3FC';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, -6, -9, 12, 20, 4);
        ctx.fill();
        ctx.stroke();
        // Label band
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(-6, -2, 12, 6);
        // Bottle neck & cap
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3.5, -14, 7, 4);
        ctx.strokeRect(-3.5, -14, 7, 4);
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillRect(-3.5, -7, 2, 14);
        ctx.restore();
      } else if (item.type === 'cardboard') {
        // 2.5D Isometric Kraft Cardboard Box with packing tape
        ctx.fillStyle = '#D97706';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, x - 13, y - 10, 26, 20, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(x - 12, y - 9, 24, 8);
        // Packing tape strip
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(x - 3, y - 10, 6, 20);
      } else if (item.type === 'cash_small' || item.type === 'dropped_cash' || item.type === 'bounty_cash') {
        // Stacked Banknotes with paper band!
        const isRed100 = item.value >= 30 || item.type === 'bounty_cash';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.18);
        ctx.fillStyle = isRed100 ? '#EF4444' : '#10B981';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        roundRectPath(ctx, -14, -8, 28, 16, 3);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = isRed100 ? '#FCA5A5' : '#A7F3D0';
        ctx.lineWidth = 1;
        ctx.strokeRect(-11, -5, 22, 10);
        // White currency strap
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(-3, -8, 6, 16);
        ctx.restore();
      } else if (item.type === 'maotai_bottle') {
        // Iconic White Porcelain Maotai Bottle with red cap & ribbon!
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0.2);
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, -7, -9, 14, 21, 4);
        ctx.fill();
        ctx.stroke();
        // Diagonal red label
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(-7, -3);
        ctx.lineTo(7, 2);
        ctx.lineTo(7, 7);
        ctx.lineTo(-7, 2);
        ctx.closePath();
        ctx.fill();
        // Red cap
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-4, -15, 8, 6);
        ctx.strokeRect(-4, -15, 8, 6);
        ctx.restore();
      } else if (item.type === 'red_packet') {
        // Ornate Festive Red Packet with Gold '開' Seal
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 11, y - 14, 22, 28, 4);
        ctx.fill();
        ctx.stroke();
        // Envelope flap arc
        ctx.beginPath();
        ctx.arc(x, y - 6, 10, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        // Gold seal coin
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(x, y + 1, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 8px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('開', x, y + 4);
      } else if (item.type === 'emp_pack') {
        // Crackling 96110 Anti-Scam EMP Core
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(x, y, 20, time * 3, time * 3 + Math.PI * 1.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 20, -time * 3, -time * 3 + Math.PI * 1.2);
        ctx.stroke();

        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 11, y - 11, 22, 22, 6);
        ctx.fill();
        ctx.stroke();

        // Lightning bolt vector
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

      // Value tag on valuable items
      if (item.value >= 20 || item.type === 'emp_pack') {
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        ctx.fillStyle = item.type === 'emp_pack' ? '#7DD3FC' : '#FEF08A';
        const txt = item.type === 'emp_pack' ? '⚡电击庄家+¥60' : `+¥${item.value}`;
        ctx.strokeText(txt, x, y - item.radius - 7);
        ctx.fillText(txt, x, y - item.radius - 7);
      }

      ctx.restore();
    }

    // ==================== CUSTOM TRAPS & SCAMMER SPRITES ====================
    drawTrapSprite(ctx, trap, time, eagleEye) {
      ctx.save();
      const { x, y, radius, kind } = trap;

      if (kind === 'phishing_zone') {
        const armed = trap.armTime <= 0;
        ctx.fillStyle = armed ? 'rgba(192, 38, 211, 0.20)' : 'rgba(244, 63, 94, 0.12)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = armed ? '#E879F9' : '#FDA4AF';
        ctx.lineWidth = armed ? 2.8 : 2;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(x, y, radius, -time * 1.2, -time * 1.2 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Stylized holographic QR matrix in center
        ctx.fillStyle = 'rgba(232, 121, 249, 0.65)';
        ctx.strokeStyle = '#F0ABFC';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 14, y - 18, 10, 10);
        ctx.strokeRect(x + 4, y - 18, 10, 10);
        ctx.strokeRect(x - 14, y, 10, 10);
        ctx.fillRect(x + 4, y, 5, 5);
        ctx.fillRect(x + 9, y + 5, 5, 5);

        ctx.fillStyle = '#FAE8FF';
        ctx.font = 'bold 11.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️钓鱼码:${trap.slogan}`, x, y + 25);
      } else {
        // Horned Purple Scam Bait Envelope
        const jx = Math.sin(time * 32) * 1.5;
        ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
        ctx.beginPath();
        ctx.arc(x + jx, y, radius + 7, 0, Math.PI * 2);
        ctx.fill();

        // Little devil horns
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
        const lbl = eagleEye ? '🚫假红包[右键/E净化+¥45]' : `"${trap.slogan}"`;
        ctx.strokeText(lbl, x, y - 24);
        ctx.fillText(lbl, x, y - 24);
      }

      ctx.restore();
    }

    drawScammerSprite(ctx, s, time) {
      ctx.save();
      const { x, y, radius, type } = s;
      const hover = Math.sin(time * 6 + x * 0.1) * 2.5;

      // Mentor lunge telegraph laser line
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

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(x, y + 17, 16, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'spammer') {
        // Rogue Smartphone Monster with antenna & evil screen grin!
        ctx.fillStyle = '#3B0764';
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 2.2;
        roundRectPath(ctx, x - 13, y - 17 + hover, 26, 34, 6);
        ctx.fill();
        ctx.stroke();

        // Glowing magenta screen
        ctx.fillStyle = '#DB2777';
        roundRectPath(ctx, x - 10, y - 12 + hover, 20, 22, 3);
        ctx.fill();

        // Sinister pixel eyes
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 6 + hover);
        ctx.lineTo(x - 2, y - 3 + hover);
        ctx.lineTo(x - 7, y - 2 + hover);
        ctx.moveTo(x + 7, y - 6 + hover);
        ctx.lineTo(x + 2, y - 3 + hover);
        ctx.lineTo(x + 7, y - 2 + hover);
        ctx.fill();

        // Antenna
        ctx.strokeStyle = '#E879F9';
        ctx.beginPath();
        ctx.moveTo(x, y - 17 + hover);
        ctx.lineTo(x, y - 25 + hover);
        ctx.stroke();
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(x, y - 26 + hover, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'mentor') {
        // Slick Pinstripe-Suit Scammer Mentor with Gold Chain & Triangle Shades
        ctx.fillStyle = '#7F1D1D';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.2;
        roundRectPath(ctx, x - 13, y - 4, 26, 20, 7);
        ctx.fill();
        ctx.stroke();

        // Gold chain V-neck
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 2);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x + 6, y - 2);
        ctx.stroke();

        // Head & slick purple hair
        ctx.fillStyle = '#FDE68A';
        ctx.strokeStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(x, y - 10, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#581C87';
        ctx.beginPath();
        ctx.arc(x, y - 13, 11, Math.PI, Math.PI * 2);
        ctx.fill();

        // Sharp villain shades
        ctx.fillStyle = s.state === 'windup' ? '#EF4444' : '#0F172A';
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 12);
        ctx.lineTo(x - 1, y - 9);
        ctx.lineTo(x - 8, y - 7);
        ctx.moveTo(x + 10, y - 12);
        ctx.lineTo(x + 1, y - 9);
        ctx.lineTo(x + 8, y - 7);
        ctx.fill();
      } else {
        // Twin-Rotor Armored Padlock Drone ('freezer')
        const spin = Math.sin(time * 28) * 10;
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 20 - spin * 0.3, y - 14 + hover);
        ctx.lineTo(x - 8 + spin * 0.3, y - 14 + hover);
        ctx.moveTo(x + 8 - spin * 0.3, y - 14 + hover);
        ctx.lineTo(x + 20 + spin * 0.3, y - 14 + hover);
        ctx.stroke();

        // Padlock shackle
        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y - 7 + hover, 9, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Armored lock body
        ctx.fillStyle = '#4C1D95';
        ctx.strokeStyle = '#E9D5FF';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x - 14, y - 7 + hover, 28, 22, 5);
        ctx.fill();
        ctx.stroke();

        // Glowing cyclops keyhole eye
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(x, y + 3 + hover, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Speech tag
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(s.slogan).width + 10;
      ctx.fillStyle = 'rgba(59, 7, 100, 0.88)';
      roundRectPath(ctx, x - tw / 2, y - radius - 26, tw, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#F5D0FE';
      ctx.fillText(s.slogan, x, y - radius - 14);

      ctx.restore();
    }

    drawBossSprite(ctx, boss, time) {
      ctx.save();
      const { x, y, radius } = boss;

      if (boss.state === 'windup') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 14;
        ctx.setLineDash([16, 10]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + boss.chargeDx * 310, y + boss.chargeDy * 310);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Boss heavy shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y + 38, 44, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotating neon-gold danger sigil beneath Boss
      ctx.save();
      ctx.translate(x, y + 10);
      ctx.scale(1, 0.55);
      ctx.rotate(time * 1.1);
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-48, -48, 96, 96);
      ctx.restore();

      const hover = Math.sin(time * 4) * 3;
      const bodyY = y + hover;

      // Floating holographic scam monitors on left & right shoulders
      [-52, 52].forEach((dx, idx) => {
        const sy = bodyY - 8 + Math.sin(time * 5 + idx * 2) * 4;
        ctx.fillStyle = 'rgba(88, 28, 135, 0.9)';
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x + dx - 14, sy - 12, 28, 22, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 9px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(idx === 0 ? '卡单!' : '补款!', x + dx, sy + 2);
      });

      // Mech Armored Casino Chassis
      const bodyGrad = ctx.createLinearGradient(x, bodyY - 38, x, bodyY + 36);
      bodyGrad.addColorStop(0, boss.hitFlash > 0 ? '#FFFFFF' : '#7E22CE');
      bodyGrad.addColorStop(1, boss.hitFlash > 0 ? '#FDE047' : '#3B0764');
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 4;
      roundRectPath(ctx, x - 36, bodyY - 34, 72, 68, 16);
      ctx.fill();
      ctx.stroke();

      // Triple Slot Machine Reels on Chest: [诈 | 骗 | 局]
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

      // Menacing red visor eyes
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(x - 22, bodyY - 22);
      ctx.lineTo(x - 4, bodyY - 16);
      ctx.lineTo(x - 20, bodyY - 14);
      ctx.moveTo(x + 22, bodyY - 22);
      ctx.lineTo(x + 4, bodyY - 16);
      ctx.lineTo(x + 20, bodyY - 14);
      ctx.fill();

      // Giant Golden Crown on top
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 22, bodyY - 34);
      ctx.lineTo(x - 26, bodyY - 52);
      ctx.lineTo(x - 11, bodyY - 42);
      ctx.lineTo(x, bodyY - 56);
      ctx.lineTo(x + 11, bodyY - 42);
      ctx.lineTo(x + 26, bodyY - 52);
      ctx.lineTo(x + 22, bodyY - 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Overhead Boss HP Bar
      const barW = 136;
      const barH = 11;
      const bx = x - barW / 2;
      const by = bodyY - 72;
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
      ctx.strokeText('👑 境外刷单总庄家 · 王总', x, by - 7);
      ctx.fillText('👑 境外刷单总庄家 · 王总', x, by - 7);

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
