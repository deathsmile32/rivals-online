'use strict';
// ============ 百門飯店：世界生成（房間資料 + 3D 模型） ============
const World = (() => {
  const DW = 1.7, DH = 2.7, WT = 0.3;

  function RNG(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rs(seed, i, salt) { return RNG((Math.imul(seed >>> 0, 2654435761) ^ Math.imul(i + 1, 40503) ^ Math.imul(salt, 2246822519)) >>> 0); }
  const pad = n => String(n).padStart(4, '0');

  // ---------- 規劃每一間房的種類 ----------
  function plan(seed) {
    const r = rs(seed, 999, 1);
    const chaseStart = 30 + Math.floor(r() * 9); // 30~38，追逐 6 間
    const P = [];
    for (let i = 0; i <= 100; i++) {
      let type = 'normal';
      if (i === 0) type = 'start'; else if (i === 50) type = 'library'; else if (i === 100) type = 'final';
      else if (i >= chaseStart && i < chaseStart + 6) type = 'chase';
      P.push({ i, type, dark: false, eyes: false, locked: false });
    }
    const isN = i => P[i] && P[i].type === 'normal';
    const quiet = i => i !== chaseStart - 1 && i !== chaseStart + 6 && i !== 49 && i !== 99 && i !== 51;
    for (let i = 3; i < 100; i++) {
      if (!isN(i)) continue;
      const q = rs(seed, i, 2);
      const prevSp = !['normal', 'hall', 'start'].includes(P[i - 1].type);
      const a = q(), b = q(), c = q();
      if (i >= 20 && quiet(i) && !prevSp && a < 0.045) P[i].type = 'halt';
      else if (i >= 12 && quiet(i) && !prevSp && b < 0.08) P[i].type = 'dupe';
      else if (c < 0.22) P[i].type = 'hall';
    }
    for (let i = 1; i < 100; i++) {
      const p = P[i], q = rs(seed, i, 3);
      const ok = p.type === 'normal' || p.type === 'hall';
      const a = q(), b = q(), c = q();
      if (ok && i >= 8 && a < 0.05 + 0.22 * (i / 100)) p.dark = true;
      if (ok && !p.dark && i >= 8 && b < 0.09) p.eyes = true;
      if (ok && i >= 3 && c < 0.16) p.locked = true;
    }
    return { chaseStart, P };
  }

  const SPEC = {
    closet: { w: 1.3, d: 0.8, h: 2.5 }, dresser: { w: 1.4, d: 0.6, h: 1.0 }, bed: { w: 1.7, d: 2.2, h: 0.7 },
    table: { w: 1.0, d: 0.8, h: 0.8 }, plant: { w: 0.7, d: 0.7, h: 1.3 }, gap: { w: 1.1 }
  };

  function generate(seed) {
    const { chaseStart, P } = plan(seed);
    const rooms = []; let entryX = 0, z0 = 0;
    for (const p of P) {
      const r = rs(seed, p.i, 4);
      let W, L, H = 3.8;
      switch (p.type) {
        case 'start': W = 12; L = 14; H = 4.2; break;
        case 'hall': W = 4.4 + r() * 1.2; L = 14 + r() * 8; break;
        case 'chase': W = 6; L = 26 + r() * 6; H = 4; break;
        case 'halt': W = 4.2; L = 64; H = 3.6; break;
        case 'dupe': W = 13; L = 10; break;
        case 'library': W = 26; L = 30; H = 6.5; break;
        case 'final': W = 26; L = 34; H = 7; break;
        default: W = 8 + r() * 6; L = 9 + r() * 8;
      }
      const m = 1.7;
      let x0 = entryX - (m + r() * (W - 2 * m));
      if (p.i === 0 || ['halt', 'chase', 'library', 'final'].includes(p.type)) x0 = entryX - W / 2;
      const x1 = x0 + W, z1 = z0 - L;
      const R = Object.assign({}, p, {
        W, L, H, x0, x1, z0, z1, entryX, cx: (x0 + x1) / 2, mz: (z0 + z1) / 2,
        exits: [], furn: [], objs: [], lamps: [], fix: [], cols: [], walls: [], wps: [], pal: Math.floor(r() * 4)
      });
      // 出口
      if (p.type === 'dupe') {
        const real = Math.floor(r() * 3);
        const fakes = [p.i + 2, p.i, p.i + 3, p.i + 11].sort(() => r() - 0.5);
        for (let k = 0; k < 3; k++) R.exits.push({ x: x0 + W * (0.2 + 0.3 * k), num: k === real ? p.i + 1 : fakes.pop(), real: k === real });
      } else if (p.type === 'final') R.exits.push({ x: R.cx, num: 101, real: true, wide: true });
      else if (['halt', 'chase', 'library'].includes(p.type)) R.exits.push({ x: R.cx + (r() - 0.5) * 1.2, num: p.i + 1, real: true });
      else R.exits.push({ x: x0 + m + r() * (W - 2 * m), num: p.i + 1, real: true });
      R.exit = R.exits.find(e => e.real);
      furnish(R, r);
      walls(R);
      rooms.push(R);
      entryX = R.exit.x; z0 = z1;
    }
    return { seed, rooms, chaseStart };
  }

  function walls(R) {
    const seg = (x0, x1, z0, z1, y0, y1) => { R.walls.push([x0, x1, z0, z1, y0, y1]); if (y0 === 0) R.cols.push([x0, x1, z0, z1]); };
    const wallX = (za, zb, holes, h) => {
      holes = holes.slice().sort((a, b) => a.x - b.x);
      let cur = R.x0 - WT; const end = R.x1 + WT;
      for (const ho of holes) {
        const a = ho.x - ho.w / 2, b = ho.x + ho.w / 2;
        if (a > cur + 0.01) seg(cur, a, za, zb, 0, h);
        if (h > ho.h) seg(a, b, za, zb, ho.h, h);
        cur = b;
      }
      if (end > cur + 0.01) seg(cur, end, za, zb, 0, h);
    };
    wallX(R.z0 - WT, R.z0, R.i > 0 ? [{ x: R.entryX, w: DW, h: DH }] : [], R.H);
    wallX(R.z1, R.z1 + WT, R.exits.map(e => ({ x: e.x, w: e.wide ? 3.4 : DW, h: e.wide ? 4 : DH })), R.H);
    seg(R.x0 - WT, R.x0, R.z1, R.z0, 0, R.H);
    seg(R.x1, R.x1 + WT, R.z1, R.z0, 0, R.H);
    if (R.out) {
      const o = R.out;
      seg(o.x0 - 0.3, o.x0, o.z1, o.z0, 0, 1.4); seg(o.x1, o.x1 + 0.3, o.z1, o.z0, 0, 1.4); seg(o.x0, o.x1, o.z1 - 0.3, o.z1, 0, 1.4);
    }
  }

  function furnish(R, r) {
    const iz0 = R.z0 - WT, iz1 = R.z1 + WT, cx = R.cx, mz = R.mz;
    let oid = 0; const nid = () => R.i + ':' + (oid++);
    const furn = (k, ax0, ax1, az0, az1, h, extra, noCol) => {
      const f = Object.assign({ k, a: [ax0, ax1, az0, az1], h }, extra || {}); R.furn.push(f);
      if (!noCol) R.cols.push([ax0, ax1, az0, az1]); return f;
    };
    const loot = () => { const q = r(); return q < 0.45 ? { g: 5 + Math.floor(r() * 12) } : q < 0.52 ? { v: 1 } : null; };
    const addSide = (k, side, zc) => {
      const s = SPEC[k], x = (side < 0 ? R.x0 : R.x1) - side * s.d / 2, n = -side, fx = x + n * s.d / 2;
      const f = furn(k, x - s.d / 2, x + s.d / 2, zc - s.w / 2, zc + s.w / 2, s.h, { side, x, z: zc, w: s.w, d: s.d });
      if (k === 'closet') R.objs.push({ id: nid(), kind: 'closet', x: fx + n * 0.05, y: 1.3, z: zc, side, n, hx: x, hz: zc });
      if (k === 'dresser') for (let j = 0; j < 2; j++) R.objs.push({ id: nid(), kind: 'drawer', x: fx, y: 0.28 + j * 0.42, z: zc, side, n, j, f, loot: loot() });
      if (k === 'table' && !R.dark && r() < 0.6) { f.lamp = true; R.lamps.push({ x, y: 1.25, z: zc, c: 0xffb060, I: 4 }); }
      return f;
    };
    const placeSides = (opts, zA, zB) => {
      for (const side of [-1, 1]) {
        let z = zA;
        for (let guard = 0; guard < 40; guard++) {
          const k = opts[Math.floor(r() * opts.length)], s = SPEC[k];
          if (z - s.w < zB) break;
          if (k !== 'gap') addSide(k, side, z - s.w / 2);
          z -= s.w + 0.2 + r() * 0.9;
        }
      }
    };
    const lampLine = (c, I, every) => {
      const n = Math.max(1, Math.round(R.L / every));
      for (let k = 0; k < n; k++) {
        const L = { x: cx, y: R.H - 0.45, z: R.z0 - R.L * (k + 0.5) / n, c, I };
        R.fix.push(L); if (!R.dark) R.lamps.push(L);
      }
    };
    const genWps = () => { R.wps = [{ x: R.entryX, z: R.z0 - 0.6 }, { x: cx, z: mz }, { x: R.exit.x, z: R.z1 + 0.6, door: R.exit.num }]; };

    switch (R.type) {
      case 'start': {
        furn('desk', cx - 2.2, cx + 2.2, mz + 0.6, mz + 1.6, 1.1);
        furn('sofa', R.x0 + 0.1, R.x0 + 1.1, mz - 3.5, mz - 1.0, 0.8, { side: -1 });
        placeSides(['plant', 'closet', 'dresser', 'gap'], mz - 4.2, iz1 + 1.4);
        furn('rug', cx - 3, cx + 3, mz - 3, mz + 4, 0.02, null, true);
        lampLine(0xffd9a0, 30, 6);
        R.spawn = [[cx - 1.5, iz0 - 1.8], [cx + 1.5, iz0 - 1.8], [cx - 1.5, iz0 - 3.4], [cx + 1.5, iz0 - 3.4]];
        genWps(); break;
      }
      case 'normal': case 'hall': case 'dupe': {
        const opts = R.type === 'hall' ? ['closet', 'dresser', 'plant', 'gap', 'gap', 'closet']
          : R.type === 'dupe' ? ['closet', 'dresser', 'gap']
            : (R.W >= 10 ? ['closet', 'closet', 'dresser', 'dresser', 'bed', 'table', 'plant', 'gap'] : ['closet', 'closet', 'dresser', 'dresser', 'table', 'plant', 'gap']);
        placeSides(opts, iz0 - 1.4, iz1 + 1.4);
        if (R.type === 'normal' && R.W > 9 && r() < 0.5) furn('rug', cx - 2, cx + 2, mz - 2.5, mz + 2.5, 0.02, null, true);
        lampLine(R.type === 'dupe' ? 0xffc890 : 0xffd9a0, 24, 7);
        if (R.locked) {
          const drawers = R.objs.filter(o => o.kind === 'drawer');
          if (drawers.length && r() < 0.6) drawers[Math.floor(r() * drawers.length)].loot = { key: 1 };
          else {
            const side = r() < 0.5 ? -1 : 1;
            R.objs.push({ id: nid(), kind: 'key', x: side < 0 ? R.x0 + 0.12 : R.x1 - 0.12, y: 1.45, z: iz1 + 1.2 + r() * Math.max(0.5, R.L - 3.4), side, n: -side });
          }
        }
        if (R.eyes) { R.eyesPos = { x: cx, y: 2.1, z: mz }; R.lamps.push({ x: cx, y: 2.1, z: mz, c: 0xa040ff, I: 10, eyes: true }); }
        genWps(); break;
      }
      case 'halt': {
        const n = 8;
        for (let k = 0; k < n; k++) { const L = { x: cx, y: R.H - 0.4, z: R.z0 - R.L * (k + 0.5) / n, c: 0x7fd4ff, I: 18 }; R.fix.push(L); R.lamps.push(L); }
        genWps(); break;
      }
      case 'chase': {
        R.wps = [{ x: R.entryX, z: R.z0 - 0.6 }];
        let side = r() < 0.5 ? -1 : 1;
        for (let z = iz0 - 5; z > iz1 + 4; z -= 4.2 + r() * 0.8) {
          const cover = R.W * 0.55;
          const ax0 = side < 0 ? R.x0 : R.x1 - cover, ax1 = side < 0 ? R.x0 + cover : R.x1;
          furn(r() < 0.5 ? 'crates' : 'fallen', ax0, ax1, z - 0.45, z + 0.45, 1.3, { side });
          const gx = side < 0 ? (ax1 + R.x1) / 2 : (R.x0 + ax0) / 2;
          R.wps.push({ x: gx, z: z + 1.2 }, { x: gx, z: z - 1.2 });
          side = -side;
        }
        R.wps.push({ x: R.exit.x, z: R.z1 + 0.6, door: R.exit.num });
        lampLine(0xffb08a, 22, 6);
        break;
      }
      case 'library': {
        const code = []; for (let k = 0; k < 5; k++) code.push(Math.floor(r() * 10));
        R.code = code.join('');
        const shelves = [];
        for (let zi = 0; zi < 5; zi++) {
          const z = R.z0 - 6.5 - zi * 4.4;
          shelves.push(furn('shelf', R.x0 + 2.5, R.x0 + 10, z - 0.45, z + 0.45, 3.2));
          shelves.push(furn('shelf', R.x1 - 10, R.x1 - 2.5, z - 0.45, z + 0.45, 3.2));
        }
        furn('table2', cx - 1.1, cx + 1.1, R.z0 - 11.6, R.z0 - 10.2, 0.85);
        furn('table2', cx - 1.1, cx + 1.1, R.z0 - 20.4, R.z0 - 19, 0.85);
        addSide('closet', -1, R.z0 - 3.2); addSide('closet', 1, R.z0 - 3.2);
        addSide('closet', -1, R.z1 + 3.5); addSide('closet', 1, R.z1 + 3.5);
        const pick = shelves.slice().sort(() => r() - 0.5).slice(0, 5);
        pick.forEach((s, k) => {
          const face = r() < 0.5 ? 1 : -1;
          R.objs.push({ id: nid(), kind: 'book', x: s.a[0] + 0.8 + r() * (s.a[1] - s.a[0] - 1.6), y: 0.7 + Math.floor(r() * 4) * 0.62, z: (face > 0 ? s.a[3] : s.a[2]) + face * 0.06, face, pos: k, digit: code[k] });
        });
        R.objs.push({ id: nid(), kind: 'padlock', x: R.exit.x + 1.35, y: 1.35, z: R.z1 + WT + 0.1 });
        for (let a = 0; a < 2; a++) for (let b = 0; b < 3; b++) { const L = { x: R.x0 + R.W * (0.28 + a * 0.44), y: R.H - 0.6, z: R.z0 - R.L * (b + 0.5) / 3, c: 0xffc070, I: 30 }; R.fix.push(L); R.lamps.push(L); }
        R.figSpawn = { x: cx, z: R.z1 + 4 };
        genWps(); break;
      }
      case 'final': {
        for (const dx of [-7, 7]) for (const dz of [8, 17, 26]) furn('pillar', cx + dx - 0.6, cx + dx + 0.6, R.z0 - dz - 0.6, R.z0 - dz + 0.6, R.H);
        let tries = 0, made = 0;
        while (made < 9 && tries++ < 80) {
          const x = R.x0 + 2 + r() * (R.W - 4), z = R.z0 - 4 - r() * (R.L - 8);
          if (Math.abs(x - cx) < 1.6) continue;
          if (R.cols.some(c => x + 1.4 > c[0] && x - 1.4 < c[1] && z + 1.4 > c[2] && z - 1.4 < c[3])) continue;
          furn('crate', x - 0.65, x + 0.65, z - 0.65, z + 0.65, 1.3); made++;
        }
        addSide('closet', -1, R.z0 - 4); addSide('closet', 1, R.z0 - 4); addSide('closet', -1, R.z0 - 20); addSide('closet', 1, R.z0 - 28);
        R.objs.push({ id: nid(), kind: 'lever', x: R.x0 + 0.15, y: 1.3, z: R.z0 - 13, n: 1, axis: 'x' });
        R.objs.push({ id: nid(), kind: 'lever', x: R.x1 - 0.15, y: 1.3, z: R.z0 - 23, n: -1, axis: 'x' });
        R.objs.push({ id: nid(), kind: 'lever', x: R.x0 + 4.5, y: 1.3, z: R.z1 + WT + 0.15, n: 1, axis: 'z' });
        for (let a = 0; a < 2; a++) for (let b = 0; b < 4; b++) { const L = { x: R.x0 + R.W * (0.25 + a * 0.5), y: R.H - 0.6, z: R.z0 - R.L * (b + 0.5) / 4, c: 0xff9a6a, I: 26 }; R.fix.push(L); R.lamps.push(L); }
        R.out = { x0: cx - 8, x1: cx + 8, z0: R.z1, z1: R.z1 - 14 };
        R.lamps.push({ x: cx, y: 5, z: R.z1 - 8, c: 0xbfd8ff, I: 60, out: true });
        R.figSpawn = { x: cx, z: R.z1 + 6 };
        genWps(); break;
      }
    }
    if (R.locked || R.type === 'library' || R.type === 'final') R.lockId = R.i + ':lock';
  }

  function roomAt(rooms, z) {
    let lo = 0, hi = rooms.length - 1;
    if (z > rooms[0].z0) return 0;
    if (z <= rooms[hi].z1) return hi;
    while (lo < hi) { const m = (lo + hi) >> 1; if (z > rooms[m].z1) hi = m; else lo = m + 1; }
    return lo;
  }

  // ================= 3D 建模 =================
  let MAT = null, PLATES = {};
  function ctex(sz, draw, w) {
    const c = document.createElement('canvas'); c.width = w || sz; c.height = sz; const g = c.getContext('2d'); draw(g, w || sz, sz);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const noiseFill = (g, w, h, base, amt) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 6; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${Math.random() * amt})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } };
  const lam = o => new THREE.MeshLambertMaterial(o);
  function initMats() {
    if (MAT) return MAT;
    const pals = [['#5c1e1e', '#6e2828', '#c9a24a'], ['#2f3e26', '#3b4d30', '#b8a35a'], ['#1f2a42', '#2a3754', '#a8a8c8'], ['#4b3525', '#5b4232', '#c8a070']];
    const wallT = p => ctex(128, (g, w, h) => {
      g.fillStyle = p[0]; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) { g.fillStyle = p[1]; g.fillRect(x + 4, 0, 16, h); }
      g.fillStyle = p[2]; for (let x = 0; x < w; x += 32) for (let y = 8; y < h; y += 32) { g.beginPath(); g.moveTo(x + 12, y); g.lineTo(x + 18, y + 7); g.lineTo(x + 12, y + 14); g.lineTo(x + 6, y + 7); g.fill(); }
    });
    const woodT = (a, b) => ctex(128, (g, w, h) => {
      noiseFill(g, w, h, a, 0.08);
      for (let y = 0; y < h; y += 16) { g.fillStyle = b; g.fillRect(0, y, w, 2); const o = (y * 7) % 64; g.fillRect(o, y, 2, 16); g.fillRect(o + 64, y, 2, 16); }
    });
    const carpetT = ctex(64, (g, w, h) => { noiseFill(g, w, h, '#6a1616', 0.12); g.fillStyle = '#9a7a30'; g.fillRect(0, 0, w, 3); g.fillRect(0, 32, w, 3); });
    const doorT = ctex(128, (g, w, h) => {
      noiseFill(g, w, h, '#4a2c18', 0.1); g.strokeStyle = '#2e1a0c'; g.lineWidth = 6;
      g.strokeRect(16, 12, w - 32, h * 0.38); g.strokeRect(16, h * 0.55, w - 32, h * 0.38);
    });
    const shelfT = ctex(128, (g, w, h) => {
      g.fillStyle = '#2d1b0f'; g.fillRect(0, 0, w, h);
      const cols = ['#7a1f1f', '#1f4a7a', '#2f6a2a', '#7a6a1f', '#4a1f6a', '#6a3a1f', '#888'];
      for (let row = 0; row < 4; row++) { let x = 2; while (x < w - 4) { const bw = 4 + Math.random() * 6; g.fillStyle = cols[Math.floor(Math.random() * cols.length)]; const bh = 22 + Math.random() * 6; g.fillRect(x, row * 32 + 30 - bh, bw, bh); x += bw + 1; } g.fillStyle = '#4a2e1a'; g.fillRect(0, row * 32 + 29, w, 3); }
    });
    MAT = {
      walls: pals.map(p => lam({ map: wallT(p) })),
      wains: lam({ map: woodT('#3a2416', '#26170c') }),
      floor: lam({ map: woodT('#6b4a2e', '#4a311d') }),
      carpet: lam({ map: carpetT }),
      ceil: lam({ color: 0xcfc6b4 }),
      door: lam({ map: doorT }), frame: lam({ color: 0x2a1a10 }),
      wood: lam({ map: woodT('#6b4428', '#4a2e18') }), dark: lam({ map: woodT('#3d2616', '#28170c') }),
      gold: lam({ color: 0xd4a531, emissive: 0x2a1a00 }), metal: lam({ color: 0x7c7c84 }), metalD: lam({ color: 0x3a3a40 }),
      sheet: lam({ color: 0xe8e2d6 }), blanket: [lam({ color: 0x7a2a2a }), lam({ color: 0x2a4a7a }), lam({ color: 0x3a6a3a })],
      leaf: lam({ color: 0x2f6b2a }), pot: lam({ color: 0x8a4b2a }), sofa: lam({ color: 0x5a1a2a }), rug: lam({ color: 0x6a2020 }),
      shelf: lam({ map: shelfT }), crate: lam({ map: woodT('#8a6a3a', '#5a4020') }), concrete: lam({ color: 0x5a5856 }),
      grass: lam({ color: 0x1e3a1e }), paper: lam({ color: 0xf2ecd8, emissive: 0x222018 }),
      lampOff: lam({ color: 0x444444 }), lampOn: new THREE.MeshBasicMaterial({ color: 0xffe2a8 }),
      book: lam({ color: 0x3060c0, emissive: 0x0a1a40 }), red: lam({ color: 0xaa2222 }), green: lam({ color: 0x22aa44 }),
    };
    return MAT;
  }
  function plateTex(txt, col) {
    const k = txt + (col || ''); if (PLATES[k]) return PLATES[k];
    const t = ctex(64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8c868'); gr.addColorStop(1, '#a8862e');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a4210'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = col || '#1a1006'; g.font = 'bold 40px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2);
    }, 176);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; PLATES[k] = t; return t;
  }
  function textTex(txt, bg, fg, w, h, font) {
    return ctex(h || 64, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = font || 'bold 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 2); }, w || 256);
  }

  function geoBox(w, h, d, tile) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (tile) {
      const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
    }
    return g;
  }
  function box(p, w, h, d, mat, x, y, z, tile) { const m = new THREE.Mesh(geoBox(w, h, d, tile), mat); m.position.set(x, y, z); p.add(m); return m; }
  function boxAB(p, x0, x1, y0, y1, z0, z1, mat, tile) { return box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tile); }

  function build(R) {
    const M = initMats();
    const g = new THREE.Group(); g.name = 'room' + R.i;
    const B = { g, doors: [], objs: {}, lampMat: M.lampOn.clone(), fixMeshes: [] };
    const wm = R.type === 'final' ? M.concrete : R.type === 'chase' ? M.walls[0] : M.walls[R.pal];
    for (const s of R.walls) {
      if (R.out && s[2] <= R.out.z0 && s[3] <= R.out.z0 + 0.01 && s[5] <= 1.5) { boxAB(g, s[0], s[1], s[4], s[5], s[2], s[3], M.metalD); continue; }
      boxAB(g, s[0], s[1], s[4], s[5], s[2], s[3], wm, 2.5);
    }
    const flm = (R.type === 'hall' || R.type === 'halt') ? M.carpet : R.type === 'final' ? M.concrete : M.floor;
    boxAB(g, R.x0 - WT, R.x1 + WT, -0.2, 0, R.z1, R.z0, flm, 2);
    boxAB(g, R.x0 - WT, R.x1 + WT, R.H, R.H + 0.2, R.z1, R.z0, M.ceil, 3);
    if (R.type !== 'final') {
      boxAB(g, R.x0, R.x0 + 0.06, 0, 1.0, R.z1 + WT, R.z0 - WT, M.wains, 1.5);
      boxAB(g, R.x1 - 0.06, R.x1, 0, 1.0, R.z1 + WT, R.z0 - WT, M.wains, 1.5);
    }
    // 吊燈
    for (const L of R.fix) {
      const lit = !R.dark;
      box(g, 0.05, R.H - L.y - 0.2, 0.05, M.metalD, L.x, (R.H + L.y + 0.2) / 2, L.z);
      const m = box(g, 0.55, 0.22, 0.55, lit ? B.lampMat : M.lampOff, L.x, L.y + 0.1, L.z);
      box(g, 0.8, 0.06, 0.8, M.gold, L.x, L.y + 0.24, L.z);
      if (lit) B.fixMeshes.push(m);
    }
    for (const f of R.furn) buildFurn(g, f, R, M, B);
    // 門
    R.exits.forEach((e, k) => {
      const w = e.wide ? 3.4 : DW, h = e.wide ? 4 : DH, zf = R.z1 + WT;
      boxAB(g, e.x - w / 2 - 0.12, e.x - w / 2, 0, h + 0.12, zf, zf + 0.06, M.frame);
      boxAB(g, e.x + w / 2, e.x + w / 2 + 0.12, 0, h + 0.12, zf, zf + 0.06, M.frame);
      boxAB(g, e.x - w / 2 - 0.12, e.x + w / 2 + 0.12, h, h + 0.12, zf, zf + 0.06, M.frame);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.24), new THREE.MeshLambertMaterial({ map: plateTex(pad(e.num)), emissive: 0x332200, emissiveMap: plateTex(pad(e.num)) }));
      pl.position.set(e.x, h + 0.36, zf + 0.07); g.add(pl);
      if (e.wide) {
        const gate = new THREE.Group(); gate.position.set(e.x, 0, R.z1 + WT / 2);
        for (let b = -7; b <= 7; b++) box(gate, 0.1, h, 0.1, M.metal, b * 0.23, h / 2, 0);
        box(gate, w, 0.15, 0.14, M.metal, 0, 0.5, 0); box(gate, w, 0.15, 0.14, M.metal, 0, h - 0.3, 0);
        g.add(gate); B.doors[k] = { gate, open: 0, target: 0, e, h };
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: textTex('出口 EXIT', '#0a3a12', '#7cff9a') }));
        sign.position.set(e.x, h + 0.9, zf + 0.07); g.add(sign);
        return;
      }
      const pivot = new THREE.Group(); pivot.position.set(e.x - w / 2, 0, R.z1 + WT / 2);
      const leaf = box(pivot, w - 0.04, h - 0.02, 0.08, M.door, w / 2, h / 2, 0);
      box(pivot, 0.08, 0.08, 0.26, M.gold, w - 0.22, 1.1, 0);
      g.add(pivot);
      B.doors[k] = { pivot, leaf, open: 0, target: 0, e };
      if (e.real && R.lockId && R.type !== 'final') {
        const lk = new THREE.Group(); lk.position.set(e.x + w / 2 - 0.25, 1.1, zf + 0.12);
        box(lk, 0.22, 0.2, 0.08, M.gold, 0, 0, 0); const sh = box(lk, 0.16, 0.14, 0.04, M.metal, 0, 0.15, 0); sh.scale.set(1, 1, 1);
        g.add(lk); B.lock = lk;
      }
    });
    // 互動物件
    for (const o of R.objs) buildObj(g, o, R, M, B);
    if (R.out) {
      const o = R.out;
      boxAB(g, o.x0, o.x1, -0.2, 0, o.z1, o.z0, M.grass, 2);
      for (let k = 0; k < 6; k++) { const tx = o.x0 + 1 + (k % 3) * 7, tz = o.z1 + 2 + Math.floor(k / 3) * 3; box(g, 0.4, 3, 0.4, M.dark, tx, 1.5, tz); box(g, 2, 2, 2, M.leaf, tx, 3.6, tz); }
    }
    if (R.type === 'start') {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8), new THREE.MeshBasicMaterial({ map: textTex('百門飯店  HOTEL', '#1a0e06', '#e8c868', 512, 96, 'bold 52px serif') }));
      s.position.set(R.cx, 3.2, R.z0 - WT - 0.02); s.rotation.y = Math.PI; g.add(s);
    }
    return B;
  }

  function buildFurn(g, f, R, M, B) {
    const [ax0, ax1, az0, az1] = f.a, cx = (ax0 + ax1) / 2, cz = (az0 + az1) / 2, sx = ax1 - ax0, sz = az1 - az0;
    switch (f.k) {
      case 'closet': {
        box(g, sx, f.h, sz, M.dark, cx, f.h / 2, cz);
        const fx = f.x - f.side * f.d / 2 - f.side * 0.01;
        box(g, 0.03, f.h - 0.2, sz * 0.46, M.wood, fx - f.side * 0.01, f.h / 2, cz - sz * 0.245);
        box(g, 0.03, f.h - 0.2, sz * 0.46, M.wood, fx - f.side * 0.01, f.h / 2, cz + sz * 0.245);
        for (let k = 0; k < 4; k++) box(g, 0.035, 0.04, sz * 0.38, M.dark, fx - f.side * 0.02, 1.6 + k * 0.12, cz - sz * 0.245);
        box(g, 0.06, 0.18, 0.05, M.gold, fx - f.side * 0.04, 1.2, cz - 0.08); box(g, 0.06, 0.18, 0.05, M.gold, fx - f.side * 0.04, 1.2, cz + 0.08);
        break;
      }
      case 'dresser': box(g, sx, f.h, sz, M.wood, cx, f.h / 2, cz); box(g, sx + 0.06, 0.05, sz + 0.06, M.dark, cx, f.h + 0.02, cz); break;
      case 'bed': {
        box(g, sx, 0.4, sz, M.dark, cx, 0.2, cz); box(g, sx - 0.1, 0.22, sz - 0.1, M.sheet, cx, 0.5, cz);
        const hx = f.side < 0 ? ax0 + 0.1 : ax1 - 0.1; box(g, 0.15, 1.1, sz, M.dark, hx, 0.55, cz);
        box(g, 0.45, 0.14, sz * 0.7, M.sheet, hx - f.side * 0.4, 0.68, cz);
        box(g, sx * 0.6, 0.06, sz, M.blanket[(R.i + Math.round(cz)) % 3 >>> 0 % 3] || M.blanket[0], cx - f.side * sx * 0.2, 0.63, cz);
        break;
      }
      case 'table': {
        box(g, sx, 0.06, sz, M.wood, cx, f.h, cz);
        for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(g, 0.07, f.h, 0.07, M.dark, cx + dx * (sx / 2 - 0.08), f.h / 2, cz + dz * (sz / 2 - 0.08));
        if (f.lamp) { box(g, 0.08, 0.35, 0.08, M.gold, cx, f.h + 0.2, cz); B.fixMeshes.push(box(g, 0.32, 0.22, 0.32, B.lampMat, cx, f.h + 0.45, cz)); }
        break;
      }
      case 'plant': box(g, 0.45, 0.45, 0.45, M.pot, cx, 0.22, cz); box(g, 0.55, 0.7, 0.55, M.leaf, cx, 0.8, cz); box(g, 0.3, 0.3, 0.3, M.leaf, cx + 0.1, 1.25, cz - 0.05); break;
      case 'desk': box(g, sx, f.h, sz, M.dark, cx, f.h / 2, cz); box(g, sx + 0.1, 0.08, sz + 0.1, M.wood, cx, f.h, cz); box(g, 0.3, 0.12, 0.2, M.gold, cx + 1.2, f.h + 0.1, cz); break;
      case 'sofa': box(g, sx, 0.45, sz, M.sofa, cx, 0.22, cz); box(g, 0.25, 0.9, sz, M.sofa, ax0 + 0.12, 0.45, cz); break;
      case 'rug': box(g, sx, 0.02, sz, M.rug, cx, 0.01, cz); break;
      case 'shelf': box(g, sx, f.h, sz, M.shelf, cx, f.h / 2, cz, 3.2); break;
      case 'table2': box(g, sx, 0.08, sz, M.wood, cx, f.h, cz); box(g, sx - 0.3, f.h, sz - 0.3, M.dark, cx, f.h / 2, cz); box(g, 0.3, 0.05, 0.4, M.paper, cx - 0.4, f.h + 0.06, cz); break;
      case 'pillar': box(g, sx, f.h, sz, M.concrete, cx, f.h / 2, cz, 2); break;
      case 'crate': box(g, sx, f.h, sz, M.crate, cx, f.h / 2, cz, 1.3); break;
      case 'crates': { const n = Math.max(1, Math.round(sx / 1.1)); for (let k = 0; k < n; k++) box(g, sx / n - 0.05, 0.9 + (k % 2) * 0.4, sz, M.crate, ax0 + (k + 0.5) * sx / n, (0.9 + (k % 2) * 0.4) / 2, cz, 1); break; }
      case 'fallen': { const m = box(g, sx, 0.8, sz, M.dark, cx, 0.4, cz); m.rotation.z = (f.side || 1) * 0.08; box(g, sx * 0.9, 0.05, sz * 0.4, M.wood, cx, 0.82, cz); break; }
    }
  }

  function buildObj(g, o, R, M, B) {
    let m = null;
    switch (o.kind) {
      case 'drawer': {
        m = new THREE.Group();
        const f = o.f, w = f.w - 0.12;
        box(m, 0.5, 0.36, w, M.wood, 0, 0, 0); box(m, 0.03, 0.36, w + 0.02, M.dark, o.n * 0.25, 0, 0);
        box(m, 0.05, 0.05, 0.3, M.gold, o.n * 0.28, 0, 0);
        m.userData.bx = o.x - o.n * 0.24; m.position.set(m.userData.bx, o.y, o.z); g.add(m);
        if (o.loot && o.loot.g) { const c = box(m, 0.12, 0.04, 0.12, M.gold, 0, 0.2, 0.1); m.userData.loot = c; }
        if (o.loot && o.loot.key) { const c = keyMesh(M); c.position.set(0, 0.2, 0); c.scale.setScalar(0.7); m.add(c); m.userData.loot = c; }
        if (o.loot && o.loot.v) { const c = box(m, 0.1, 0.18, 0.1, M.green, 0, 0.25, -0.15); m.userData.loot = c; }
        break;
      }
      case 'key': m = keyMesh(M); m.position.set(o.x, o.y, o.z); m.rotation.y = o.side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(m); box(g, 0.1, 0.06, 0.1, M.metalD, o.x - o.n * 0.02, o.y + 0.16, o.z); break;
      case 'book': m = box(g, 0.32, 0.42, 0.12, M.book, o.x, o.y, o.z); break;
      case 'padlock': {
        m = new THREE.Group(); m.position.set(o.x, o.y, o.z);
        box(m, 0.5, 0.6, 0.06, M.metalD, 0, 0, 0); box(m, 0.36, 0.2, 0.04, M.green, 0, 0.12, 0.03);
        const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ map: textTex('?????', '#031', '#5f8', 256, 96, 'bold 60px monospace') }));
        sc.position.set(0, 0.12, 0.06); m.add(sc); m.userData.screen = sc;
        for (let k = 0; k < 9; k++) box(m, 0.07, 0.05, 0.03, M.metal, -0.1 + (k % 3) * 0.1, -0.08 - Math.floor(k / 3) * 0.07, 0.04);
        g.add(m); break;
      }
      case 'lever': {
        m = new THREE.Group(); m.position.set(o.x, o.y, o.z);
        if (o.axis === 'z') m.rotation.y = 0; else m.rotation.y = o.n > 0 ? Math.PI / 2 : -Math.PI / 2;
        box(m, 0.4, 0.6, 0.1, M.metalD, 0, 0, 0);
        const arm = new THREE.Group(); arm.position.set(0, 0, 0.08); m.add(arm);
        box(arm, 0.06, 0.4, 0.06, M.metal, 0, 0.2, 0); box(arm, 0.12, 0.12, 0.12, M.red, 0, 0.42, 0);
        arm.rotation.x = -0.6; m.userData.arm = arm;
        const bulb = box(m, 0.12, 0.12, 0.05, M.red, 0, -0.38, 0.03); m.userData.bulb = bulb;
        g.add(m); break;
      }
    }
    if (m) B.objs[o.id] = m;
  }
  function keyMesh(M) {
    const k = new THREE.Group();
    box(k, 0.04, 0.16, 0.16, M.gold, 0, 0.12, 0); box(k, 0.04, 0.26, 0.05, M.gold, 0, -0.08, 0); box(k, 0.04, 0.05, 0.08, M.gold, 0, -0.17, 0.05);
    return k;
  }

  return { generate, build, roomAt, initMats, pad, DW, DH, WT, RNG, textTex, box };
})();
