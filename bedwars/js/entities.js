'use strict';
// ===================== 角色常數 =====================
const PW = 0.3, PH = 1.8, EYE = 1.62, EPS = 1e-4;
const SWORD_DMG = [1, 4, 5, 6, 7];
const SWORD_NAME = ['拳頭', '木劍', '石劍', '鐵劍', '鑽石劍'];
const SWORD_COLOR = [0, 0x9a7040, 0x8a8a8a, 0xe0e0e0, 0x5ee8e0];
const ARMOR_RED = [0, 0.2, 0.36, 0.5, 0.64];
const ARMOR_NAME = ['無', '皮革', '鎖鏈', '鐵', '鑽石'];
const ARMOR_COLOR = [0, null, 0x7a7a7a, 0xd0d0d0, 0x4ad8d0];
const PICK_NAME = ['', '木鎬', '鐵鎬', '金鎬', '鑽石鎬'];
const AXE_NAME = ['', '木斧', '石斧', '鐵斧', '鑽石斧'];
const TOOL_COLOR = [0, 0x9a7040, 0xd0d0d0, 0xf4d23c, 0x5ee8e0];

const ITEMS = {
  sword: { name: '劍', stack: 1 },
  pick: { name: '鎬', stack: 1 },
  axe: { name: '斧', stack: 1 },
  wool: { name: '羊毛', block: true, stack: 64 },
  plank: { name: '木板', block: true, stack: 64, blockId: B.PLANK, color: 0xb88c54 },
  endstone: { name: '終界石', block: true, stack: 64, blockId: B.ENDSTONE, color: 0xe6e4a8 },
  obsidian: { name: '黑曜石', block: true, stack: 64, blockId: B.OBSIDIAN, color: 0x2c1f42 },
  kbstick: { name: '擊退棒', stack: 1, color: 0xc8a040 },
  fireball: { name: '火球', stack: 64, color: 0xff7a1a },
  tnt: { name: 'TNT', stack: 64, color: 0xd83030 },
  pearl: { name: '終界珍珠', stack: 16, color: 0x1e6a5a },
  gapple: { name: '金蘋果', stack: 64, color: 0xf4d23c },
  egg: { name: '搭橋蛋', stack: 16, color: 0xf0ecd8 },
};

// ===================== 戰鬥角色（玩家與電腦共用） =====================
class Fighter {
  constructor(game, team, name, isBot) {
    this.game = game; this.team = team; this.name = name; this.isBot = isBot;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.onGround = false; this.sneak = false; this.sprint = false;
    this.maxHp = 20; this.hp = 20; this.absorb = 0;
    this.alive = true; this.eliminated = false; this.respawnT = 0;
    this.hurtT = 0; this.lastDmgT = 0; this.attackCd = 0;
    this.lastAttacker = null; this.lastAttackerT = -99;
    this.res = { iron: 0, gold: 0, diamond: 0, emerald: 0 };
    this.sword = 1; this.armor = 1; this.pick = 0; this.axe = 0;
    this.hotbar = new Array(9).fill(null); this.sel = 0;
    this.fallStart = null; this.slowT = 0; this.regenT = 0;
    this.stats = { kills: 0, finals: 0, beds: 0, deaths: 0 };
    this.swingT = 0; this.walkPhase = 0;
    this.resetLoadout(true);
  }
  get eyeH() { return this.sneak ? 1.5 : EYE; }
  eye(out) { return (out || new THREE.Vector3()).set(this.pos.x, this.pos.y + this.eyeH, this.pos.z); }
  lookDir(out) {
    const cp = Math.cos(this.pitch);
    return (out || new THREE.Vector3()).set(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }
  resetLoadout(first) {
    this.sword = 1;
    if (first) { this.armor = 1; this.pick = 0; this.axe = 0; }
    else { if (this.pick > 1) this.pick--; if (this.axe > 1) this.axe--; }
    this.hotbar = new Array(9).fill(null);
    this.hotbar[0] = { id: 'sword', count: 1 };
    if (this.pick) this.giveTool('pick');
    if (this.axe) this.giveTool('axe');
    this.sel = 0;
  }
  giveTool(id) {
    if (this.hotbar.some(s => s && s.id === id)) return;
    const i = this.hotbar.indexOf(null);
    if (i >= 0) this.hotbar[i] = { id, count: 1 };
  }
  count(id) { let n = 0; for (const s of this.hotbar) if (s && s.id === id) n += s.count; return n; }
  blockCount() { return this.count('wool') + this.count('plank') + this.count('endstone') + this.count('obsidian'); }
  add(id, n) {
    const max = ITEMS[id].stack;
    for (const s of this.hotbar) if (s && s.id === id && s.count < max) { const a = Math.min(n, max - s.count); s.count += a; n -= a; if (!n) return true; }
    while (n > 0) {
      const i = this.hotbar.indexOf(null);
      if (i < 0) return false;
      const a = Math.min(n, max); this.hotbar[i] = { id, count: a }; n -= a;
    }
    return true;
  }
  remove(id, n) {
    for (let i = 8; i >= 0 && n > 0; i--) {
      const s = this.hotbar[i];
      if (s && s.id === id) { const a = Math.min(n, s.count); s.count -= a; n -= a; if (!s.count) this.hotbar[i] = null; }
    }
  }
  held() { return this.hotbar[this.sel]; }
  // 取得可放的方塊（優先目前手上的）
  blockItemFor(preferSel) {
    const h = this.held();
    if (preferSel && h && ITEMS[h.id].block) return h.id;
    for (const id of ['wool', 'plank', 'endstone', 'obsidian']) if (this.count(id)) return id;
    return null;
  }
  blockIdOf(itemId) { return itemId === 'wool' ? B.WOOL + this.team.id : ITEMS[itemId].blockId; }
  damage() {
    const h = this.held();
    let d = SWORD_DMG[0];
    if (!h || h.id === 'sword') d = SWORD_DMG[this.sword];
    else if (h.id === 'kbstick') d = 1;
    else if (h.id === 'axe') d = 2 + this.axe * 0.5;
    if (this.team.up.sharp && (!h || h.id === 'sword')) d += 1.25;
    return d;
  }
  reduction() {
    return 1 - (1 - ARMOR_RED[this.armor]) * (1 - this.team.up.prot * 0.08);
  }
}

// ===================== 物理 =====================
function boxHits(world, px, py, pz, h) {
  const x0 = Math.floor(px - PW + EPS), x1 = Math.floor(px + PW - EPS);
  const y0 = Math.floor(py + EPS), y1 = Math.floor(py + h - EPS);
  const z0 = Math.floor(pz - PW + EPS), z1 = Math.floor(pz + PW - EPS);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const b = world.get(x, y, z);
    if (b && BINFO[b].solid && py + EPS < y + BINFO[b].h) return true;
  }
  return false;
}

function hasGroundUnder(world, px, py, pz) {
  const x0 = Math.floor(px - PW + EPS), x1 = Math.floor(px + PW - EPS);
  const z0 = Math.floor(pz - PW + EPS), z1 = Math.floor(pz + PW - EPS);
  const y0 = Math.floor(py - 0.6), y1 = Math.floor(py - EPS);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const b = world.get(x, y, z);
    if (b && BINFO[b].solid && y + BINFO[b].h > py - 0.6) return true;
  }
  return false;
}

function sweepAxis(world, e, axis, d) {
  if (d === 0) return false;
  const p = e.pos;
  p[axis] += d;
  const x0 = Math.floor(p.x - PW + EPS), x1 = Math.floor(p.x + PW - EPS);
  const y0 = Math.floor(p.y + EPS), y1 = Math.floor(p.y + PH - EPS);
  const z0 = Math.floor(p.z - PW + EPS), z1 = Math.floor(p.z + PW - EPS);
  let hit = false, lim = d > 0 ? Infinity : -Infinity;
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const b = world.get(x, y, z);
    if (!b || !BINFO[b].solid) continue;
    const top = y + BINFO[b].h;
    if (p.y + EPS >= top) continue;
    hit = true;
    if (axis === 'x') lim = d > 0 ? Math.min(lim, x - PW) : Math.max(lim, x + 1 + PW);
    else if (axis === 'z') lim = d > 0 ? Math.min(lim, z - PW) : Math.max(lim, z + 1 + PW);
    else lim = d > 0 ? Math.min(lim, y - PH) : Math.max(lim, top);
  }
  if (hit) p[axis] = lim;
  return hit;
}

function moveEntity(world, e, dt) {
  let dx = e.vel.x * dt, dy = e.vel.y * dt, dz = e.vel.z * dt;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) / 0.3));
  dx /= n; dy /= n; dz /= n;
  e.blockedH = false;
  let ground = false;
  for (let s = 0; s < n; s++) {
    if (sweepAxis(world, e, 'y', dy)) {
      if (dy < 0) ground = true;
      e.vel.y = 0; dy = 0;
    }
    for (const ax of ['x', 'z']) {
      const d = ax === 'x' ? dx : dz;
      if (!d) continue;
      if (e.sneak && e.onGround) {
        const nx = ax === 'x' ? e.pos.x + d : e.pos.x, nz = ax === 'z' ? e.pos.z + d : e.pos.z;
        if (!hasGroundUnder(world, nx, e.pos.y, nz)) { e.vel[ax] = 0; if (ax === 'x') dx = 0; else dz = 0; continue; }
      }
      const oldA = e.pos[ax], oldY = e.pos.y;
      if (sweepAxis(world, e, ax, d)) {
        // 嘗試走上半格（床）
        if (e.onGround || ground) {
          const resolved = e.pos[ax];
          e.pos[ax] = oldA + d; e.pos.y = oldY + 0.6;
          if (!boxHits(world, e.pos.x, e.pos.y, e.pos.z, PH)) continue;
          e.pos[ax] = resolved; e.pos.y = oldY;
        }
        e.blockedH = true;
        e.vel[ax] = 0; if (ax === 'x') dx = 0; else dz = 0;
      }
    }
  }
  e.onGround = ground;
}

// ===================== 人物模型 =====================
function boxMesh(w, h, d, color, pivotTop) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (pivotTop) g.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
  return m;
}

function makeNameTag(text, css) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const tex = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(1.6, 0.4, 1);
  sp.renderOrder = 10;
  sp.userData.draw = (hp) => {
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 26px "Microsoft JhengHei", "PingFang TC", sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = css;
    ctx.fillText(text, 128, 28);
    if (hp != null) {
      ctx.fillStyle = '#400'; ctx.fillRect(28, 40, 200, 12);
      ctx.fillStyle = hp > 10 ? '#3c3' : hp > 5 ? '#cc3' : '#d33';
      ctx.fillRect(28, 40, 200 * Math.max(0, hp) / 20, 12);
    }
    tex.needsUpdate = true;
  };
  sp.userData.draw(20);
  return sp;
}

function makeHumanoid(teamColor, name, css) {
  const g = new THREE.Group();
  const skin = 0xe0b48c;
  const pants = new THREE.Color(teamColor).multiplyScalar(0.55).getHex();
  const legL = boxMesh(0.25, 0.75, 0.25, pants, true); legL.position.set(-0.125, 0.75, 0);
  const legR = boxMesh(0.25, 0.75, 0.25, pants, true); legR.position.set(0.125, 0.75, 0);
  const body = boxMesh(0.5, 0.75, 0.28, teamColor); body.position.set(0, 1.125, 0);
  const armL = boxMesh(0.24, 0.75, 0.24, teamColor, true); armL.position.set(-0.37, 1.5, 0);
  const armR = boxMesh(0.24, 0.75, 0.24, teamColor, true); armR.position.set(0.37, 1.5, 0);
  const head = new THREE.Group(); head.position.set(0, 1.5, 0);
  const headM = boxMesh(0.48, 0.48, 0.48, skin); headM.position.y = 0.24; head.add(headM);
  const hair = boxMesh(0.5, 0.14, 0.5, 0x4a3020); hair.position.y = 0.43; head.add(hair);
  const eyeL = boxMesh(0.08, 0.06, 0.02, 0x222244); eyeL.position.set(-0.1, 0.27, -0.245); head.add(eyeL);
  const eyeR = boxMesh(0.08, 0.06, 0.02, 0x222244); eyeR.position.set(0.1, 0.27, -0.245); head.add(eyeR);
  const held = new THREE.Group(); held.position.set(0, -0.68, -0.1); armR.add(held);
  g.add(legL, legR, body, armL, armR, head);
  const tag = makeNameTag(name, css); tag.position.y = 2.25; g.add(tag);
  const mats = [legL, legR, body, armL, armR, headM].map(m => m.material);
  return { group: g, legL, legR, body, armL, armR, head, held, tag, mats, heldKey: '' };
}

function makeItemMesh(id, f) {
  const g = new THREE.Group();
  if (id === 'sword') {
    const blade = boxMesh(0.08, 0.7, 0.04, SWORD_COLOR[f.sword] || 0x9a7040); blade.position.y = 0.45;
    const guard = boxMesh(0.24, 0.05, 0.06, 0x553311); guard.position.y = 0.1;
    const grip = boxMesh(0.05, 0.18, 0.05, 0x553311);
    g.add(blade, guard, grip);
  } else if (id === 'pick' || id === 'axe') {
    const handle = boxMesh(0.05, 0.7, 0.05, 0x7a5530); handle.position.y = 0.3;
    const tc = TOOL_COLOR[id === 'pick' ? f.pick : f.axe] || 0x999999;
    const headM = id === 'pick' ? boxMesh(0.5, 0.08, 0.08, tc) : boxMesh(0.22, 0.22, 0.06, tc);
    headM.position.set(id === 'axe' ? 0.1 : 0, 0.62, 0);
    g.add(handle, headM);
  } else if (id === 'kbstick') {
    const s = boxMesh(0.06, 0.75, 0.06, 0xc8a040); s.position.y = 0.3; g.add(s);
  } else if (ITEMS[id] && ITEMS[id].block) {
    const c = id === 'wool' ? TEAM_DEFS[f.team.id].wool : ITEMS[id].color;
    g.add(boxMesh(0.3, 0.3, 0.3, c));
  } else if (ITEMS[id]) {
    g.add(boxMesh(0.2, 0.2, 0.2, ITEMS[id].color));
  }
  return g;
}

function updateModelHeld(model, f) {
  const h = f.held();
  const key = h ? h.id + (h.id === 'sword' ? f.sword : h.id === 'pick' ? f.pick : h.id === 'axe' ? f.axe : '') : 'none';
  if (model.heldKey === key) return;
  model.heldKey = key;
  while (model.held.children.length) model.held.remove(model.held.children[0]);
  if (h) {
    const m = makeItemMesh(h.id, f);
    m.rotation.x = -Math.PI / 2;
    model.held.add(m);
  }
}

function setModelArmor(model, f) {
  const c = ARMOR_COLOR[f.armor];
  const legC = c == null ? new THREE.Color(f.team.def.color).multiplyScalar(0.55).getHex() : c;
  model.legL.material.color.setHex(legC);
  model.legR.material.color.setHex(legC);
}
