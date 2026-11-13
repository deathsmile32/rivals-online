'use strict';
// ===================== 角色常數 =====================
const PW = 0.3, PH = 1.8, EYE = 1.62, EPS = 1e-4;
const SWORD_DMG = [1, 4, 5, 6, 7];
const SWORD_NAME = ['拳頭', '木劍', '石劍', '鐵劍', '鑽石劍'];
const ARMOR_RED = [0, 0.2, 0.36, 0.5, 0.64];
const ARMOR_NAME = ['無', '皮革', '鎖鏈', '鐵', '鑽石'];
const ARMOR_COLOR = [0, null, 0x8a8a96, 0xdcdcdc, 0x4ad8d0];
const PICK_NAME = ['', '木鎬', '鐵鎬', '金鎬', '鑽石鎬'];
const AXE_NAME = ['', '木斧', '石斧', '鐵斧', '鑽石斧'];

const ITEMS = {
  sword: { name: '劍', stack: 1, tool: true },
  pick: { name: '鎬', stack: 1, tool: true },
  axe: { name: '斧', stack: 1, tool: true },
  shears: { name: '剪刀', stack: 1, tool: true },
  wool: { name: '羊毛', block: true, stack: 64 },
  plank: { name: '木板', block: true, stack: 64, blockId: B.PLANK },
  endstone: { name: '終界石', block: true, stack: 64, blockId: B.ENDSTONE },
  obsidian: { name: '黑曜石', block: true, stack: 64, blockId: B.OBSIDIAN },
  glass: { name: '防爆玻璃', block: true, stack: 64, blockId: B.GLASS },
  kbstick: { name: '擊退棒', stack: 1 },
  rod: { name: '魚竿', stack: 1 },
  bow: { name: '弓', stack: 1 },
  arrow: { name: '箭', stack: 64 },
  snowball: { name: '雪球', stack: 16 },
  fireball: { name: '火球', stack: 64 },
  tnt: { name: 'TNT', stack: 64 },
  pearl: { name: '終界珍珠', stack: 16 },
  gapple: { name: '金蘋果', stack: 64 },
  egg: { name: '搭橋蛋', stack: 16 },
  platform: { name: '救援平台', stack: 16 },
  pot_speed: { name: '速度藥水', stack: 8 },
  pot_jump: { name: '跳躍藥水', stack: 8 },
  pot_invis: { name: '隱身藥水', stack: 8 },
};
const BLOCK_ITEMS = ['wool', 'plank', 'endstone', 'glass', 'obsidian'];
const KEEP_ITEMS = ['sword', 'pick', 'axe', 'shears'];

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
    this.sword = 1; this.armor = 1; this.pick = 0; this.axe = 0; this.shears = false;
    this.hotbar = new Array(9).fill(null); this.sel = 0;
    this.fallStart = null; this.slowT = 0; this.regenT = 0;
    this.fx = { speed: 0, jump: 0, invis: 0 };
    this.stats = { kills: 0, finals: 0, beds: 0, deaths: 0 };
    this.swingT = 0; this.walkPhase = 0; this.bowT = 0;
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
    if (first) { this.armor = 1; this.pick = 0; this.axe = 0; this.shears = false; }
    else { if (this.pick > 1) this.pick--; if (this.axe > 1) this.axe--; }
    this.hotbar = new Array(9).fill(null);
    this.hotbar[0] = { id: 'sword', count: 1 };
    if (this.pick) this.giveTool('pick');
    if (this.axe) this.giveTool('axe');
    if (this.shears) this.giveTool('shears');
    this.sel = 0;
    this.fx = { speed: 0, jump: 0, invis: 0 };
  }
  giveTool(id) {
    if (this.hotbar.some(s => s && s.id === id)) return;
    const i = this.hotbar.indexOf(null);
    if (i >= 0) this.hotbar[i] = { id, count: 1 };
  }
  count(id) { let n = 0; for (const s of this.hotbar) if (s && s.id === id) n += s.count; return n; }
  blockCount() { let n = 0; for (const id of BLOCK_ITEMS) n += this.count(id); return n; }
  canAdd(id, n) {
    let room = 0; const max = ITEMS[id].stack;
    for (const s of this.hotbar) { if (!s) room += max; else if (s.id === id) room += max - s.count; }
    return room >= n;
  }
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
    // 優先扣手上那格
    const h = this.hotbar[this.sel];
    if (h && h.id === id) { const a = Math.min(n, h.count); h.count -= a; n -= a; if (!h.count) this.hotbar[this.sel] = null; }
    for (let i = 8; i >= 0 && n > 0; i--) {
      const s = this.hotbar[i];
      if (s && s.id === id) { const a = Math.min(n, s.count); s.count -= a; n -= a; if (!s.count) this.hotbar[i] = null; }
    }
  }
  held() { return this.heldOverride || this.hotbar[this.sel]; }
  blockItemFor(preferSel) {
    const h = this.held();
    if (preferSel && h && ITEMS[h.id].block) return h.id;
    for (const id of ['wool', 'plank', 'endstone', 'glass', 'obsidian']) if (this.count(id)) return id;
    return null;
  }
  blockIdOf(itemId) { return itemId === 'wool' ? B.WOOL + this.team.id : ITEMS[itemId].blockId; }
  damage() {
    const h = this.held();
    let d = SWORD_DMG[0];
    if (h && h.id === 'sword') d = SWORD_DMG[this.sword];
    else if (h && h.id === 'axe') d = 2 + this.axe * 0.75;
    if (this.team.up.sharp && h && (h.id === 'sword' || h.id === 'axe')) d += 1.25;
    return d;
  }
  reduction() { return 1 - (1 - ARMOR_RED[this.armor]) * (1 - this.team.up.prot * 0.08); }
  heldKey() {
    const h = this.held();
    if (!h) return 'none';
    if (h.id === 'sword') return 'sword' + this.sword;
    if (h.id === 'pick') return 'pick' + this.pick;
    if (h.id === 'axe') return 'axe' + this.axe;
    if (h.id === 'bow') return 'bow' + (this.bowT > 0.25 ? 1 : 0);
    if (h.id === 'wool') return 'wool' + this.team.id;
    return h.id;
  }
}

// ===================== 物理 =====================
function boxHits(world, px, py, pz, h, hw) {
  hw = hw || PW;
  const x0 = Math.floor(px - hw + EPS), x1 = Math.floor(px + hw - EPS);
  const y0 = Math.floor(py + EPS), y1 = Math.floor(py + h - EPS);
  const z0 = Math.floor(pz - hw + EPS), z1 = Math.floor(pz + hw - EPS);
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
function sweepAxis(world, e, axis, d, hw, h) {
  if (d === 0) return false;
  hw = hw || PW; h = h || PH;
  const p = e.pos;
  p[axis] += d;
  const x0 = Math.floor(p.x - hw + EPS), x1 = Math.floor(p.x + hw - EPS);
  const y0 = Math.floor(p.y + EPS), y1 = Math.floor(p.y + h - EPS);
  const z0 = Math.floor(p.z - hw + EPS), z1 = Math.floor(p.z + hw - EPS);
  let hit = false, lim = d > 0 ? Infinity : -Infinity;
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const b = world.get(x, y, z);
    if (!b || !BINFO[b].solid) continue;
    const top = y + BINFO[b].h;
    if (p.y + EPS >= top) continue;
    hit = true;
    if (axis === 'x') lim = d > 0 ? Math.min(lim, x - hw) : Math.max(lim, x + 1 + hw);
    else if (axis === 'z') lim = d > 0 ? Math.min(lim, z - hw) : Math.max(lim, z + 1 + hw);
    else lim = d > 0 ? Math.min(lim, y - h) : Math.max(lim, top);
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
  e.landVy = 0;
  for (let s = 0; s < n; s++) {
    const vyBefore = e.vel.y;
    if (sweepAxis(world, e, 'y', dy)) {
      if (dy < 0) { ground = true; e.landVy = vyBefore; }
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
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
}
function skinBox(w, h, d, tex, pivotTop, faceTex, topTex) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (pivotTop) g.translate(0, -h / 2, 0);
  // BoxGeometry 面順序：+x, -x, +y, -y, +z, -z（-z 是正面）
  const mk = t => new THREE.MeshLambertMaterial({ map: t });
  const base = mk(tex);
  const mats = [base, base, topTex ? mk(topTex) : base, base, base, faceTex ? mk(faceTex) : base];
  return new THREE.Mesh(g, mats);
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

function makeHumanoid(teamColor, name, css, variant) {
  variant = variant || 0;
  const g = new THREE.Group();
  const leg = skinCanvas('leg', teamColor, variant), shirt = skinCanvas('shirt', teamColor, variant), arm = skinCanvas('arm', teamColor, variant);
  const legL = skinBox(0.25, 0.75, 0.25, leg, true); legL.position.set(-0.125, 0.75, 0);
  const legR = skinBox(0.25, 0.75, 0.25, leg, true); legR.position.set(0.125, 0.75, 0);
  const body = skinBox(0.5, 0.75, 0.26, shirt); body.position.set(0, 1.125, 0);
  const armL = skinBox(0.24, 0.75, 0.24, arm, true); armL.position.set(-0.37, 1.5, 0);
  const armR = skinBox(0.24, 0.75, 0.24, arm, true); armR.position.set(0.37, 1.5, 0);
  const head = new THREE.Group(); head.position.set(0, 1.5, 0);
  const headM = skinBox(0.48, 0.48, 0.48, skinCanvas('head', teamColor, variant), false, skinCanvas('face', teamColor, variant), skinCanvas('top', teamColor, variant));
  headM.position.y = 0.24; head.add(headM);
  // 護甲（頭盔和胸甲）
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.2, 0.54), new THREE.MeshLambertMaterial({ color: teamColor }));
  helmet.position.y = 0.42; head.add(helmet);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.5, 0.3), new THREE.MeshLambertMaterial({ color: teamColor }));
  chest.position.set(0, 1.24, 0);
  const held = new THREE.Group(); held.position.set(0, -0.66, -0.06); armR.add(held);
  g.add(legL, legR, body, chest, armL, armR, head);
  const tag = makeNameTag(name, css); tag.position.y = 2.25; g.add(tag);
  const mats = [];
  g.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.push(m)); });
  return { group: g, legL, legR, body, armL, armR, head, held, tag, mats, heldKey: '', helmet, chest };
}

// 手上拿的物品模型（握把在原點，刀尖朝 +X +Y）
function makeItemMesh(id, f, basic) {
  const g = new THREE.Group();
  if (ITEMS[id] && ITEMS[id].block) {
    const bid = f.blockIdOf(id), info = BINFO[bid];
    const cube = texturedCube(info.tex.top, info.tex.side, info.tint);
    cube.scale.setScalar(0.3);
    g.add(cube);
    return g;
  }
  if (id === 'tnt') {
    const cube = texturedCube('tnt_top', 'tnt_side', null); cube.scale.setScalar(0.3); g.add(cube); return g;
  }
  const tier = id === 'sword' ? f.sword : id === 'pick' ? f.pick : id === 'axe' ? f.axe : id === 'bow' ? (f.bowT > 0.25 ? 1 : 0) : 0;
  const art = itemArt(id, tier, id === 'bow' ? tier : 0);
  if (!art) return g;
  const geo = extrudedGeometry(art, id + tier);
  const mat = basic ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(0.4, 0.38, 0);
  m.scale.setScalar(0.85);
  g.add(m);
  return g;
}

function updateModelHeld(model, f) {
  const key = f.heldKey();
  if (model.heldKey === key) return;
  model.heldKey = key;
  while (model.held.children.length) model.held.remove(model.held.children[0]);
  const h = f.held();
  if (h) {
    const m = makeItemMesh(h.id, f);
    m.scale.setScalar(0.7);
    if (ITEMS[h.id].block || h.id === 'tnt') m.position.set(0, -0.05, -0.12);
    else m.rotation.set(-Math.PI / 2, 0, -Math.PI / 4 * 3);
    model.held.add(m);
  }
}

function setModelArmor(model, f) {
  const c = ARMOR_COLOR[f.armor];
  const leather = new THREE.Color(f.team.def.color).multiplyScalar(0.75).getHex();
  model.helmet.material.color.setHex(c == null ? leather : c);
  model.chest.material.color.setHex(c == null ? leather : c);
  model.helmet.visible = model.chest.visible = f.armor >= 1;
  const legC = c == null ? 0xffffff : c;
  for (const leg of [model.legL, model.legR]) (Array.isArray(leg.material) ? leg.material : [leg.material]).forEach(m => m.color.setHex(legC));
}
