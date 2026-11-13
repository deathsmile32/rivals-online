'use strict';
// ============ 怪物：模型 + 主機端 AI ============
const Ents = (() => {
  const B = (p, w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); p.add(m); return m; };
  const bas = c => new THREE.MeshBasicMaterial({ color: c });
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const NAMES = { rush: '狂嘯', ambush: '回馬槍', screech: '暗嘶', eyes: '千眼', halt: '逆行者', seek: '追獵者', figure: '盲魔', dupe: '假門', spider: '抽屜蛛' };

  function model(kind) {
    const g = new THREE.Group(); g.userData.kind = kind; g.userData.parts = [];
    const jit = m => { g.userData.parts.push(m); return m; };
    switch (kind) {
      case 'rush': case 'ambush': {
        const core = kind === 'rush' ? 0x0a0a0a : 0x0b2410, eye = kind === 'rush' ? 0xffffff : 0x8dff6a, mouth = kind === 'rush' ? 0xc01818 : 0x2bd14a;
        const cm = bas(core);
        for (let k = 0; k < 14; k++) jit(B(g, 0.5 + Math.random() * 0.7, 0.5 + Math.random() * 0.7, 0.5 + Math.random() * 0.7, cm, (Math.random() - .5) * 1.6, (Math.random() - .5) * 1.6, (Math.random() - .5) * 1.2 + 0.3));
        B(g, 1.7, 1.7, 0.4, cm, 0, 0, -0.2);
        B(g, 0.4, 0.22, 0.05, bas(eye), -0.38, 0.3, -0.42); B(g, 0.4, 0.22, 0.05, bas(eye), 0.38, 0.3, -0.42);
        B(g, 0.12, 0.12, 0.06, bas(0), -0.38, 0.3, -0.44); B(g, 0.12, 0.12, 0.06, bas(0), 0.38, 0.3, -0.44);
        B(g, 1.0, 0.5, 0.05, bas(mouth), 0, -0.35, -0.42);
        for (let k = 0; k < 6; k++) B(g, 0.1, 0.16, 0.06, bas(0xeeeeee), -0.4 + k * 0.16, -0.17, -0.45);
        break;
      }
      case 'screech': {
        const cm = bas(0x050505);
        B(g, 0.7, 0.7, 0.7, cm, 0, 0, 0); for (let k = 0; k < 6; k++) jit(B(g, 0.3, 0.3, 0.3, cm, (Math.random() - .5) * .8, (Math.random() - .5) * .8, (Math.random() - .5) * .5));
        B(g, 0.3, 0.3, 0.05, bas(0xffffff), 0, 0.12, -0.36); B(g, 0.1, 0.1, 0.06, bas(0), 0, 0.12, -0.38);
        B(g, 0.44, 0.14, 0.05, bas(0xd01010), 0, -0.16, -0.36);
        break;
      }
      case 'eyes': {
        B(g, 0.6, 0.6, 0.6, bas(0x1a0628), 0, 0, 0);
        for (let k = 0; k < 18; k++) {
          const a = Math.random() * Math.PI * 2, b = (Math.random() - .5) * Math.PI, r = 0.45 + Math.random() * 0.35;
          const e = jit(B(g, 0.2, 0.13, 0.05, bas(0xe6c8ff), Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r));
          e.lookAt(0, 0, 0); e.rotateY(Math.PI); B(e, 0.07, 0.07, 0.02, bas(0x6a00c8), 0, 0, 0.03);
        }
        break;
      }
      case 'halt': {
        const m = new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.55, depthWrite: false });
        B(g, 0.7, 1.0, 0.35, m, 0, 1.25, 0); B(g, 0.5, 0.5, 0.5, m, 0, 2.05, 0); B(g, 0.25, 0.9, 0.25, m, -0.5, 1.15, 0); B(g, 0.25, 0.9, 0.25, m, 0.5, 1.15, 0);
        B(g, 0.28, 0.8, 0.28, m, -0.17, 0.4, 0); B(g, 0.28, 0.8, 0.28, m, 0.17, 0.4, 0);
        B(g, 0.12, 0.08, 0.05, bas(0xffffff), -0.11, 2.1, -0.26); B(g, 0.12, 0.08, 0.05, bas(0xffffff), 0.11, 2.1, -0.26);
        break;
      }
      case 'seek': {
        const k = lam(0x0b0b0b), goo = bas(0x111111);
        B(g, 0.8, 1.3, 0.45, k, 0, 1.5, 0); B(g, 0.7, 0.7, 0.6, k, 0, 2.5, 0);
        B(g, 0.25, 1.3, 0.25, k, -0.55, 1.45, 0); B(g, 0.25, 1.3, 0.25, k, 0.55, 1.45, 0);
        jit(B(g, 0.3, 0.9, 0.3, k, -0.2, 0.45, 0)); jit(B(g, 0.3, 0.9, 0.3, k, 0.2, 0.45, 0));
        B(g, 0.46, 0.46, 0.05, bas(0xffffff), 0, 2.55, -0.31); B(g, 0.2, 0.2, 0.06, bas(0), 0, 2.55, -0.33);
        for (let i = 0; i < 6; i++) jit(B(g, 0.1, 0.3 + Math.random() * .4, 0.1, goo, (Math.random() - .5) * .7, 1.0 + Math.random() * 1.2, -0.24));
        break;
      }
      case 'figure': {
        const f = lam(0x5a2014), d = lam(0x3a120a), t = bas(0xf0e8d0);
        B(g, 1.0, 1.4, 0.6, f, 0, 1.75, 0); B(g, 1.1, 0.9, 0.9, f, 0, 2.95, 0);
        B(g, 0.9, 0.5, 0.05, bas(0x200000), 0, 2.8, -0.46);
        for (let i = 0; i < 7; i++) { B(g, 0.09, 0.14, 0.04, t, -0.36 + i * 0.12, 3.0, -0.48); B(g, 0.09, 0.14, 0.04, t, -0.36 + i * 0.12, 2.6, -0.48); }
        jit(B(g, 0.3, 1.8, 0.3, d, -0.7, 1.6, 0)); jit(B(g, 0.3, 1.8, 0.3, d, 0.7, 1.6, 0));
        jit(B(g, 0.38, 1.1, 0.38, d, -0.25, 0.55, 0)); jit(B(g, 0.38, 1.1, 0.38, d, 0.25, 0.55, 0));
        for (let i = 0; i < 5; i++) B(g, 0.08, 0.08, 0.5, lam(0x8a3a24), -0.4 + i * 0.2, 2.2, 0.1);
        break;
      }
      case 'dupe': {
        B(g, 1.2, 1.4, 0.3, bas(0x060606), 0, 0, 0);
        B(g, 0.9, 0.55, 0.05, bas(0x8a0000), 0, -0.2, -0.16);
        for (let i = 0; i < 8; i++) { B(g, 0.08, 0.16, 0.04, bas(0xffffff), -0.38 + i * 0.11, 0.0, -0.19); B(g, 0.08, 0.16, 0.04, bas(0xffffff), -0.38 + i * 0.11, -0.4, -0.19); }
        B(g, 0.22, 0.12, 0.05, bas(0xffff80), -0.3, 0.4, -0.17); B(g, 0.22, 0.12, 0.05, bas(0xffff80), 0.3, 0.4, -0.17);
        break;
      }
      case 'spider': {
        const k = bas(0x1a1a1a);
        B(g, 0.35, 0.25, 0.45, k, 0, 0, 0); B(g, 0.25, 0.2, 0.25, k, 0, 0.05, -0.3);
        for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 4; i++) { const l = B(g, 0.5, 0.05, 0.05, k, s * 0.35, 0.05, -0.15 + i * 0.12); l.rotation.z = s * 0.5; }
        B(g, 0.06, 0.06, 0.03, bas(0xff2020), -0.07, 0.1, -0.43); B(g, 0.06, 0.06, 0.03, bas(0xff2020), 0.07, 0.1, -0.43);
        break;
      }
    }
    return g;
  }
  function animate(m, t) {
    const p = m.userData.parts, k = m.userData.kind;
    if (k === 'rush' || k === 'ambush' || k === 'screech' || k === 'eyes') for (let i = 0; i < p.length; i++) { const q = p[i]; q.rotation.x = Math.sin(t * 13 + i) * 0.4; q.rotation.y = Math.cos(t * 11 + i * 2) * 0.4; }
    if (k === 'rush' || k === 'ambush') m.children.forEach((c, i) => { if (i < 14) c.position.x += Math.sin(t * 40 + i) * 0.01; });
    if (k === 'seek' || k === 'figure') { const s = Math.sin(t * 9) * 0.5; if (p[0]) p[0].rotation.x = s; if (p[1]) p[1].rotation.x = -s; if (p[2]) p[2].rotation.x = -s * .6; if (p[3]) p[3].rotation.x = s * .6; }
  }

  // ================= 主機端 AI =================
  class HostSim {
    constructor(ctx) { this.c = ctx; this.ents = []; this.nid = 1; this.cool = 3; this.timers = []; }
    get W() { return this.c.world; }
    later(t, fn) { this.timers.push({ t, fn }); }
    pathRooms(a, b) {
      const pts = []; for (let i = a; i <= b; i++) for (const w of this.W.rooms[i].wps) pts.push({ x: w.x, z: w.z, door: w.door, room: i });
      return pts;
    }
    onDoor(n) {
      const W = this.W, R = W.rooms[n];
      if (!R) return;
      if (R.type === 'chase' && n === W.chaseStart) { this.c.fx({ k: 'chase', on: 1 }); this.later(2.2, () => this.spawnSeek()); }
      if (R.type === 'library' || R.type === 'final') this.later(2.5, () => this.spawnFigure(n));
      this.cool--;
      if (n < 6 || this.cool > 0) return;
      let a = n;
      while (a > Math.max(0, n - 4) && ['normal', 'hall', 'dupe', 'start'].includes(W.rooms[a - 1].type)) a--;
      if (!['normal', 'hall', 'dupe'].includes(R.type) || n - a < 2) return;
      if (this.ents.some(e => e.kind === 'rush' || e.kind === 'ambush' || e.kind === 'seek')) return;
      const q = Math.random();
      if (n >= 30 && q < 0.07) this.spawnRush('ambush', a, n);
      else if (q < 0.07 + 0.13) this.spawnRush('rush', a, n);
    }
    spawnRush(kind, a, b) {
      this.cool = 4;
      const warn = kind === 'rush' ? 3.5 + Math.random() * 2 : 3 + Math.random() * 1.5;
      this.c.fx({ k: 'flicker', a, b, dur: warn + 1.5, col: kind === 'ambush' ? 1 : 0 });
      const path = this.pathRooms(a, b);
      path.pop(); // 停在最新那扇（關著的）門前
      const last = this.W.rooms[b].exit; path.push({ x: last.x, z: this.W.rooms[b].z1 + 1, room: b });
      const e = { id: this.nid++, kind, path, seg: 0, dir: 1, x: path[0].x, y: 1.6, z: path[0].z, ry: 0, wait: warn, speed: kind === 'rush' ? 26 : 34, passes: kind === 'ambush' ? 2 + Math.floor(Math.random() * 4) : 1 };
      this.ents.push(e);
    }
    spawnSeek() {
      const W = this.W, s = W.chaseStart;
      const path = this.pathRooms(s, s + 5);
      const nx = W.rooms[s + 6]; path.push({ x: nx.entryX, z: nx.z0 - 1.5, room: s + 6, end: true });
      const p0 = path[0];
      this.ents.push({ id: this.nid++, kind: 'seek', path, seg: 0, dir: 1, x: p0.x, y: 0, z: p0.z + 0.3, ry: 0, wait: 0, speed: 4.2, t: 0 });
    }
    spawnFigure(n) {
      if (this.ents.some(e => e.kind === 'figure' && e.room === n)) return;
      const R = this.W.rooms[n];
      const e = { id: this.nid++, kind: 'figure', room: n, x: R.figSpawn.x, y: 0, z: R.figSpawn.z, ry: 0, path: [], repath: 0, target: null, mode: 'walk', grid: this.grid(R) };
      this.ents.push(e);
      this.c.fx({ k: 'figure', on: 1, room: n });
    }
    grid(R) {
      const x0 = R.x0, z1 = R.z1 + 0.3, nx = Math.ceil(R.W), nz = Math.ceil(R.L - 0.6), blk = new Uint8Array(nx * nz);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const x = x0 + i + 0.5, z = z1 + j + 0.5;
        if (x < R.x0 + 0.5 || x > R.x1 - 0.5) { blk[i + j * nx] = 1; continue; }
        for (const c of R.cols) if (x > c[0] - 0.45 && x < c[1] + 0.45 && z > c[2] - 0.45 && z < c[3] + 0.45) { blk[i + j * nx] = 1; break; }
      }
      return { x0, z1, nx, nz, blk };
    }
    cell(G, x, z) { return [Math.max(0, Math.min(G.nx - 1, Math.floor(x - G.x0))), Math.max(0, Math.min(G.nz - 1, Math.floor(z - G.z1)))]; }
    bfs(G, from, to) {
      const [sx, sz] = this.cell(G, from.x, from.z); let [tx, tz] = this.cell(G, to.x, to.z);
      const N = G.nx * G.nz, prev = new Int32Array(N).fill(-1), q = new Int32Array(N); let h = 0, t = 0;
      const s = sx + sz * G.nx, goal = tx + tz * G.nx; prev[s] = s; q[t++] = s; let best = s, bd = 1e9;
      while (h < t) {
        const c = q[h++], cx = c % G.nx, cz = (c / G.nx) | 0;
        const d = Math.abs(cx - tx) + Math.abs(cz - tz); if (d < bd) { bd = d; best = c; } if (c === goal) break;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = cx + dx, az = cz + dz; if (ax < 0 || az < 0 || ax >= G.nx || az >= G.nz) continue;
          const n = ax + az * G.nx; if (prev[n] !== -1 || (G.blk[n] && n !== goal)) continue; prev[n] = c; q[t++] = n;
        }
      }
      const out = []; let c = best; let guard = 0;
      while (c !== s && guard++ < N) { out.push({ x: G.x0 + (c % G.nx) + 0.5, z: G.z1 + ((c / G.nx) | 0) + 0.5 }); c = prev[c]; }
      return out.reverse();
    }
    randFree(G) { for (let k = 0; k < 50; k++) { const i = Math.floor(Math.random() * G.nx), j = Math.floor(Math.random() * G.nz); if (!G.blk[i + j * G.nx]) return { x: G.x0 + i + 0.5, z: G.z1 + j + 0.5 }; } return null; }

    moveAlong(e, dt) {
      let left = e.speed * dt;
      while (left > 0) {
        const nxt = e.path[e.seg + e.dir];
        if (!nxt) return true;
        if (e.kind === 'seek' && e.path[e.seg].door && e.path[e.seg].door > this.c.latest()) return false;
        const dx = nxt.x - e.x, dz = nxt.z - e.z, d = Math.hypot(dx, dz);
        if (d < 1e-4) { e.seg += e.dir; continue; }
        e.ry = Math.atan2(-dx, -dz);
        if (d <= left) { e.x = nxt.x; e.z = nxt.z; e.seg += e.dir; left -= d; }
        else { e.x += dx / d * left; e.z += dz / d * left; left = 0; }
      }
      return false;
    }
    update(dt) {
      for (let i = this.timers.length - 1; i >= 0; i--) { const t = this.timers[i]; t.t -= dt; if (t.t <= 0) { this.timers.splice(i, 1); t.fn(); } }
      const P = this.c.players(), W = this.W;
      for (let i = this.ents.length - 1; i >= 0; i--) {
        const e = this.ents[i];
        if (e.wait > 0) { e.wait -= dt; continue; }
        if (e.kind === 'rush' || e.kind === 'ambush') {
          let done = false; const steps = Math.max(1, Math.ceil(e.speed * dt / 1.5));
          for (let st = 0; st < steps && !done; st++) {
            done = this.moveAlong(e, dt / steps);
            const er = World.roomAt(W.rooms, e.z);
            for (const p of P) if (p.alive && !p.hidden && !p.esc && p.room === er && Math.abs(p.z - e.z) < 9) this.c.kill(p.id, e.kind);
          }
          if (done) {
            e.passes--;
            if (e.passes <= 0) { this.ents.splice(i, 1); continue; }
            e.dir = -e.dir; e.wait = 1.2 + Math.random() * 1.6;
          }
        } else if (e.kind === 'seek') {
          e.t += dt; e.speed = Math.min(5.5, 4.2 + e.t * 0.12);
          // 附近有玩家就直接撲過去
          let prey = null, pd = 6;
          for (const p of P) { if (!p.alive || p.hidden || p.esc) continue; const d = Math.hypot(p.x - e.x, p.z - e.z); if (d < pd && Math.abs(p.room - World.roomAt(W.rooms, e.z)) <= 1) { pd = d; prey = p; } }
          if (prey) {
            const dx = prey.x - e.x, dz = prey.z - e.z, d = Math.hypot(dx, dz), s = Math.min(d, e.speed * dt);
            e.x += dx / d * s; e.z += dz / d * s; e.ry = Math.atan2(-dx, -dz);
            let bi = e.seg, bd = 1e9; for (let k = Math.max(0, e.seg - 2); k < Math.min(e.path.length, e.seg + 6); k++) { const q = e.path[k], dd = Math.hypot(q.x - e.x, q.z - e.z) + (k < e.seg ? 5 : 0); if (dd < bd) { bd = dd; bi = k; } }
            e.seg = Math.max(e.seg, bi - 1);
          }
          const done = prey ? false : this.moveAlong(e, dt);
          for (const p of P) if (p.alive && !p.hidden && !p.esc && Math.hypot(p.x - e.x, p.z - e.z) < 1.4) this.c.kill(p.id, 'seek');
          if (done) { this.ents.splice(i, 1); this.c.fx({ k: 'chase', on: 0 }); }
        } else if (e.kind === 'figure') {
          const R = W.rooms[e.room], G = e.grid;
          const inRoom = P.filter(p => p.alive && !p.esc && p.room === e.room);
          const ahead = P.filter(p => p.alive && !p.esc && p.room <= e.room);
          if (!ahead.length) { e.gone = (e.gone || 0) + dt; if (e.gone > 4) { this.ents.splice(i, 1); this.c.fx({ k: 'figure', on: 0 }); continue; } } else e.gone = 0;
          let heard = null, hd = 1e9;
          for (const p of inRoom) {
            if (p.hidden) continue;
            const d = Math.hypot(p.x - e.x, p.z - e.z);
            const loud = p.moving && !p.crouch ? 14 : p.moving ? 3.2 : 2.2;
            if (d < loud && d < hd) { hd = d; heard = p; }
          }
          if (heard) { e.target = { x: heard.x, z: heard.z }; e.mode = 'hunt'; e.lost = 0; }
          else if (e.mode === 'hunt') { e.lost = (e.lost || 0) + dt; if (e.lost > 4) e.mode = 'walk'; }
          e.repath -= dt;
          if (e.repath <= 0 || !e.path.length) {
            e.repath = e.mode === 'hunt' ? 0.4 : 3;
            if (e.mode !== 'hunt' && (!e.target || Math.hypot(e.target.x - e.x, e.target.z - e.z) < 1.2)) e.target = this.randFree(G);
            if (e.target) e.path = this.bfs(G, e, e.target);
          }
          const sp = e.mode === 'hunt' ? 4.5 : 2.0;
          let left = sp * dt;
          while (left > 0 && e.path.length) {
            const n = e.path[0], dx = n.x - e.x, dz = n.z - e.z, d = Math.hypot(dx, dz);
            if (d > 0.01) e.ry = Math.atan2(-dx, -dz);
            if (d <= left) { e.x = n.x; e.z = n.z; e.path.shift(); left -= d; } else { e.x += dx / d * left; e.z += dz / d * left; left = 0; }
          }
          if (!e.path.length && e.mode === 'hunt' && e.target) { const dx = e.target.x - e.x, dz = e.target.z - e.z, d = Math.hypot(dx, dz); if (d > 0.05) { const s = Math.min(d, sp * dt); e.x += dx / d * s; e.z += dz / d * s; e.ry = Math.atan2(-dx, -dz); } }
          for (const p of inRoom) if (!p.hidden && Math.hypot(p.x - e.x, p.z - e.z) < 1.3) this.c.kill(p.id, 'figure');
          e.y = e.mode === 'hunt' ? 1 : 0;
        }
      }
    }
    snapshot() { return this.ents.filter(e => !(e.wait > 0 && e.kind !== 'figure' && e.seg === 0)).map(e => [e.id, e.kind, +e.x.toFixed(2), e.y | 0, +e.z.toFixed(2), +e.ry.toFixed(2)]); }
  }
  return { model, animate, HostSim, NAMES };
})();
