'use strict';
// ===================== 綿花戰爭：槍械 =====================
// kind: hit = 子彈（瞬間命中）, rocket = 火箭, grenade = 榴彈, flame = 火焰
const GUNS = {
  pistol: { name: '手槍', dmg: 3, rate: 0.32, mag: 12, reload: 1.2, spread: 0.018, range: 45, kind: 'hit', snd: 'gun' },
  revolver: { name: '左輪', dmg: 6.5, rate: 0.6, mag: 6, reload: 2.0, spread: 0.012, range: 50, kind: 'hit', snd: 'gun2', cost: [10, 'iron'] },
  rifle: { name: '突擊步槍', dmg: 2.4, rate: 0.1, mag: 30, reload: 2.0, spread: 0.035, range: 55, kind: 'hit', auto: true, snd: 'gun', cost: [55, 'iron'] },
  sniper: { name: '狙擊槍', dmg: 15, rate: 1.4, mag: 5, reload: 2.6, spread: 0.12, aimSpread: 0.0, range: 120, kind: 'hit', zoom: 22, snd: 'sniper', cost: [115, 'iron'] },
  rpg: { name: '火箭筒', dmg: 0, rate: 1.0, mag: 1, reload: 3.0, spread: 0.01, kind: 'rocket', snd: 'rocket', cost: [120, 'iron'] },
  glauncher: { name: '榴彈發射器', dmg: 0, rate: 0.6, mag: 6, reload: 3.2, spread: 0.02, kind: 'grenade', snd: 'rocket', cost: [50, 'gold'] },
  flamer: { name: '火焰噴射器', dmg: 0.9, rate: 0.1, mag: 60, reload: 3.0, spread: 0.12, range: 6.5, kind: 'flame', auto: true, snd: 'flame', cost: [55, 'gold'] },
};
const GUN_IDS = Object.keys(GUNS);
for (const id of GUN_IDS) ITEMS[id] = { name: GUNS[id].name, stack: 1, tool: true, gun: true };
// 爆炸參數：[可炸掉的方塊硬度, 最大傷害, 擊退力道]
const BLAST = { fireball: [1, 4, 15], tnt: [2, 8, 18], rpg: [2, 9, 17], grenade: [1, 6, 13] };
PROJ.rocket = { spd: 34, grav: 0, life: 4 };
PROJ.grenade = { spd: 21, grav: 20, life: 2.2 };

const GUN_SHOP = { cat: '槍械', items: [
  { key: 'revolver', name: '左輪', cost: [10, 'iron'], desc: '傷害 6.5，6 發，打得準', icon: 'revolver' },
  { key: 'rifle', name: '突擊步槍', cost: [55, 'iron'], desc: '按住連發，30 發', icon: 'rifle' },
  { key: 'sniper', name: '狙擊槍', cost: [115, 'iron'], desc: '右鍵開鏡，一槍 15 傷害，爆頭更痛', icon: 'sniper' },
  { key: 'rpg', name: '火箭筒', cost: [120, 'iron'], desc: '火箭會爆炸，炸掉羊毛和終界石', icon: 'rpg' },
  { key: 'glauncher', name: '榴彈發射器', cost: [50, 'gold'], desc: '拋物線榴彈，6 發', icon: 'glauncher' },
  { key: 'flamer', name: '火焰噴射器', cost: [55, 'gold'], desc: '近距離燒人，還會燒掉羊毛和木板', icon: 'flamer' },
] };

// ---------- 槍的像素圖（槍口朝右） ----------
const GC = { metal: [70, 74, 82], dark: [40, 42, 48], light: [130, 136, 146], wood: [130, 86, 46], woodD: [92, 60, 32], olive: [92, 110, 56], oliveD: [64, 78, 38], red: [190, 46, 40], orange: [255, 150, 40], brass: [210, 170, 70] };
function gunArt(id) {
  return makeArt('gun_' + id, P => {
    const R = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P.set(x, y, c); };
    switch (id) {
      case 'pistol':
        R(3, 5, 12, 7, GC.metal); R(3, 5, 12, 5, GC.light); R(12, 6, 13, 6, GC.dark);
        R(4, 8, 6, 12, GC.dark); R(5, 8, 6, 13, GC.dark); R(7, 8, 8, 9, GC.dark); P.set(8, 10, GC.dark);
        break;
      case 'revolver':
        R(8, 5, 14, 6, GC.light); R(8, 6, 14, 6, GC.metal); P.set(14, 4, GC.dark);
        R(5, 4, 8, 8, GC.metal); R(6, 5, 7, 7, GC.dark); R(5, 4, 8, 4, GC.light);
        R(3, 8, 5, 12, GC.wood); R(2, 10, 4, 13, GC.wood); R(3, 12, 4, 13, GC.woodD); R(6, 9, 7, 10, GC.dark);
        break;
      case 'rifle':
        R(0, 7, 3, 10, GC.dark); R(0, 7, 3, 7, GC.metal);
        R(3, 6, 12, 8, GC.metal); R(3, 6, 12, 6, GC.light);
        R(12, 7, 15, 7, GC.dark); P.set(15, 6, GC.dark);
        R(7, 9, 9, 13, GC.dark); R(8, 13, 9, 14, GC.dark);
        R(4, 9, 5, 11, GC.dark); R(6, 4, 9, 5, GC.dark); P.set(11, 5, GC.dark);
        break;
      case 'sniper':
        R(0, 7, 4, 10, GC.wood); R(0, 9, 2, 10, GC.woodD);
        R(4, 7, 10, 8, GC.oliveD); R(10, 7, 15, 7, GC.dark);
        R(4, 3, 10, 5, GC.dark); P.set(10, 4, [120, 200, 255]); P.set(4, 4, [80, 140, 200]); R(6, 6, 7, 6, GC.dark);
        R(6, 9, 7, 11, GC.dark);
        break;
      case 'rpg':
        R(0, 7, 11, 9, GC.olive); R(0, 7, 11, 7, [120, 140, 76]); R(0, 6, 1, 10, GC.oliveD);
        R(11, 6, 13, 10, GC.oliveD); R(13, 5, 14, 11, GC.oliveD); P.set(15, 8, GC.dark); R(14, 7, 15, 9, GC.dark);
        R(4, 10, 5, 13, GC.dark); R(8, 10, 9, 12, GC.dark); R(5, 4, 7, 6, GC.dark);
        break;
      case 'glauncher':
        R(1, 8, 4, 11, GC.wood); R(4, 5, 9, 11, GC.metal); R(5, 6, 8, 10, GC.dark); P.set(6, 8, GC.light); P.set(7, 6, GC.light);
        R(9, 6, 15, 9, GC.dark); R(9, 6, 15, 6, GC.metal); R(6, 11, 7, 13, GC.dark);
        break;
      case 'flamer':
        R(2, 7, 6, 12, GC.red); R(2, 7, 6, 7, [230, 80, 70]); R(3, 6, 5, 6, GC.dark);
        R(6, 7, 13, 8, GC.metal); R(6, 7, 13, 7, GC.light); R(13, 6, 14, 9, GC.dark);
        P.set(15, 7, GC.orange); P.set(15, 8, [255, 220, 80]); R(8, 9, 9, 12, GC.dark);
        break;
    }
  });
}
const _baseItemArt = itemArt;
itemArt = function (id, tier, extra) { return GUNS[id] ? gunArt(id) : _baseItemArt(id, tier, extra); };

// ---------- 遊戲邏輯（加在 Game 上） ----------
Object.assign(Game.prototype, {
  ammoOf(f, id) {
    f.ammo = f.ammo || {};
    if (!f.ammo[id]) f.ammo[id] = { m: GUNS[id].mag, r: 0 };
    return f.ammo[id];
  },
  gunReload(f, id) {
    const G = GUNS[id]; if (!G) return;
    const a = this.ammoOf(f, id);
    if (a.r > 0 || a.m >= G.mag) return;
    a.r = G.reload;
    this.tell(f, 'snd', 'reload');
  },
  tickGuns(f, dt) {
    if (f.gunCd > 0) f.gunCd -= dt;
    if (f.burnT > 0) {
      f.burnT -= dt; f.burnTick = (f.burnTick || 0) + dt;
      if (f.burnTick >= 1) {
        f.burnTick = 0;
        if (this.authority && f.alive) { f.hurtT = 0; this.damage(f, 1, f.burner || null, 'fire'); }
      }
      if (Math.random() < dt * 8) this.burst(f.pos.x, f.pos.y + 1, f.pos.z, 0xff8a20, 1, true);
    }
    if (!f.ammo) return;
    for (const id in f.ammo) {
      const a = f.ammo[id];
      if (a.r > 0) { a.r -= dt; if (a.r <= 0) { a.r = 0; a.m = GUNS[id].mag; } }
    }
  },
  muzzle(f) {
    const dir = f.lookDir();
    return f.eye().addScaledVector(dir, 0.55).add(new THREE.Vector3(Math.cos(f.yaw) * 0.22, -0.14, -Math.sin(f.yaw) * 0.22));
  },
  // 開槍（房主／單機執行）
  fireGun(f, aiming) {
    const h = f.held();
    if (!h || !GUNS[h.id] || !f.alive) return false;
    const G = GUNS[h.id], a = this.ammoOf(f, h.id);
    if (a.r > 0 || f.gunCd > 0.04) return false;
    if (a.m <= 0) { this.gunReload(f, h.id); return false; }
    a.m--; f.gunCd = G.rate; f.swingT = 0.12;
    if (a.m <= 0) this.gunReload(f, h.id);
    const spread = aiming && G.aimSpread != null ? G.aimSpread : G.spread * (aiming ? 0.45 : 1) * (f.onGround ? 1 : 1.6);
    const yaw = f.yaw + (Math.random() - 0.5) * 2 * spread, pitch = f.pitch + (Math.random() - 0.5) * 2 * spread;
    const cp = Math.cos(pitch);
    const dir = new THREE.Vector3(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
    const eye = f.eye(), mz = this.muzzle(f);
    this.sfxAt(G.snd, mz.x, mz.y, mz.z);
    if (G.kind === 'rocket' || G.kind === 'grenade') {
      const kind = G.kind;
      const pr = { id: this.nextId++, kind, owner: f, pos: mz.clone(), vel: dir.clone().multiplyScalar(PROJ[kind].spd), life: PROJ[kind].life, mesh: this.makeProjMesh(kind) };
      pr.mesh.position.copy(pr.pos);
      this.projectiles.push(pr);
      return true;
    }
    if (G.kind === 'flame') { this.flame(f, eye, dir, G); return true; }
    // 子彈：瞬間命中
    const bh = this.world.raycast(eye, dir, G.range);
    let best = null, bt = bh ? bh.dist : G.range;
    for (const t of this.fighters) {
      if (t === f || !t.alive || t.team === f.team) continue;
      const d = rayAABB(eye, dir, { x: t.pos.x - 0.35, y: t.pos.y, z: t.pos.z - 0.35 }, { x: t.pos.x + 0.35, y: t.pos.y + PH, z: t.pos.z + 0.35 });
      if (d != null && d < bt) { bt = d; best = t; }
    }
    const end = eye.clone().addScaledVector(dir, bt);
    this.tracer(mz, end, f, G.kind === 'hit' && h.id === 'sniper' ? 0xffffaa : 0xfff0a0);
    if (best) {
      const head = end.y > best.pos.y + 1.42;
      let dmg = G.dmg * (head ? 1.5 : 1) * (1 - best.reduction());
      if (f.isBot) dmg *= f.P.dmgMul;
      best.hurtT = 0;
      best.vel.x += dir.x * 1.6; best.vel.z += dir.z * 1.6;
      this.pushed(best);
      this.damage(best, dmg, f, head ? 'headshot' : 'shot');
      this.burst(end.x, end.y, end.z, 0xaa0000, 4);
      if (head) this.tell(f, 'toast', '<b style="color:#ff5">爆頭！</b>');
      this.tell(f, 'snd', 'hitmark');
    } else if (bh) this.burst(end.x, end.y, end.z, BINFO[bh.type].color, 3);
    return true;
  },
  flame(f, eye, dir, G) {
    // 火焰粒子
    for (let i = 0; i < 3; i++) {
      const d = dir.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25)).normalize();
      this.flameFx(this.muzzle(f), d);
    }
    for (const t of this.fighters) {
      if (t === f || !t.alive || t.team === f.team) continue;
      const tc = new THREE.Vector3(t.pos.x, t.pos.y + 1, t.pos.z);
      const to = tc.clone().sub(eye);
      const dist = to.length();
      if (dist > G.range || to.normalize().dot(dir) < 0.93) continue;
      if (!this.world.lineClear(eye, tc)) continue;
      t.hurtT = 0;
      t.burnT = 3; t.burner = f;
      this.damage(t, G.dmg * (1 - t.reduction() * 0.6), f, 'fire');
    }
    // 燒掉羊毛和木板
    if (Math.random() < 0.3) {
      const bh = this.world.raycast(eye, dir, G.range);
      if (bh && this.world.isPlaced(bh.x, bh.y, bh.z) && BINFO[bh.type].blast <= 1 && bh.type !== B.SLIME) this.breakBlock(f, bh.x, bh.y, bh.z);
    }
  },
  flameFx(from, d) {
    if (this.particles.length > 220) return;
    const m = new THREE.Mesh(this.fGeo || (this.fGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18)), new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xff7a1a : 0xffd040, transparent: true, opacity: 0.9 }));
    m.position.copy(from);
    this.scene.add(m);
    this.particles.push({ m, v: d.multiplyScalar(13 + Math.random() * 4).add(new THREE.Vector3(0, 1.5, 0)), life: 0.4, flame: true });
    if (this.mode === 'host') this.fxOut.push(['f', +from.x.toFixed(2), +from.y.toFixed(2), +from.z.toFixed(2), +d.x.toFixed(2), +d.y.toFixed(2), +d.z.toFixed(2)]);
  },
  tracer(a, b, owner, color) {
    if (!(this.mode === 'client' && owner === this.player && this.localTracer)) {
      const g = new THREE.BufferGeometry().setFromPoints([a, b]);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      this.scene.add(line);
      this.effects.push({ mesh: line, t: 0, life: 0.07, line: true });
      // 槍口火光
      const fl = new THREE.Mesh(this.mGeo || (this.mGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14)), new THREE.MeshBasicMaterial({ color: 0xffe080, transparent: true }));
      fl.position.copy(a); this.scene.add(fl);
      this.effects.push({ mesh: fl, t: 0, life: 0.05, line: true });
    }
    if (this.mode === 'host') this.fxOut.push(['t', +a.x.toFixed(2), +a.y.toFixed(2), +a.z.toFixed(2), +b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2), owner ? owner.id : -1, color]);
  },
  // 本機玩家扣扳機（單機直接開槍，客戶端送給房主）
  localFire() {
    const p = this.player, h = p.held();
    if (!h || !GUNS[h.id] || !p.alive) return;
    const a = this.ammoOf(p, h.id);
    if (a.r > 0 || p.gunCd > 0) return;
    if (a.m <= 0) { this.act({ a: 'reload' }); if (this.mode === 'client') this.gunReload(p, h.id); return; }
    this.gunKick = 1;
    if (this.mode === 'client') {
      // 先在自己畫面做出開槍效果
      a.m--; p.gunCd = GUNS[h.id].rate;
      if (a.m <= 0) a.r = GUNS[h.id].reload;
      const G = GUNS[h.id];
      this.sfx.play(G.snd);
      if (G.kind === 'flame') { const d = p.lookDir(); for (let i = 0; i < 3; i++) this.flameFx(this.muzzle(p), d.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25)).normalize()); }
      else if (G.kind === 'hit') {
        const bh = this.world.raycast(p.eye(), p.lookDir(), G.range);
        const end = p.eye().addScaledVector(p.lookDir(), bh ? bh.dist : G.range);
        this.localTracer = false; this.tracer(this.muzzle(p), end, p, 0xfff0a0); this.localTracer = true;
      }
      this.net.send({ t: 'act', a: 'fire', yw: p.yaw, pt: p.pitch, ad: this.aiming ? 1 : 0 });
    } else this.fireGun(p, this.aiming);
  },
  heldGun(f) { const h = f.held(); return h && GUNS[h.id] ? GUNS[h.id] : null; },
});
