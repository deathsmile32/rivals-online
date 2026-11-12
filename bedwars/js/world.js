'use strict';
// ===================== 世界常數 =====================
const WX = 128, WY = 64, WZ = 128, CS = 16;
const NCX = WX / CS, NCY = WY / CS, NCZ = WZ / CS;
const FLOOR = 29;          // 島嶼地面方塊的 y
const GROUND = 30;         // 站在地面上時腳的高度
const BUILD_LIMIT = 52;    // 最高建築高度
const VOID_Y = 4;          // 掉到這以下就死亡
const CX = 64, CZ = 64;    // 地圖中心

const TEAM_DEFS = [
  { name: '紅隊', short: '紅', color: 0xd83c3c, css: '#ff5555', wool: 0xc83232, dir: [0, 1] },
  { name: '藍隊', short: '藍', color: 0x3c64d8, css: '#5f8bff', wool: 0x3050c8, dir: [0, -1] },
  { name: '綠隊', short: '綠', color: 0x48b83c, css: '#55ff55', wool: 0x48a838, dir: [1, 0] },
  { name: '黃隊', short: '黃', color: 0xe8cc32, css: '#ffff55', wool: 0xe0c830, dir: [-1, 0] },
];

// ===================== 方塊定義 =====================
const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, BRICK: 4, PLANK: 5, ENDSTONE: 6, OBSIDIAN: 7,
  IRONB: 8, GOLDB: 9, DIAMB: 10, EMERB: 11, WOOL: 12 /*12-15*/, CLAY: 16 /*16-19*/, BED: 20 /*20-23*/,
  SMOOTH: 24,
};
const BINFO = [];
function defBlock(id, o) {
  BINFO[id] = Object.assign({ solid: true, color: 0xffffff, side: null, bottom: null, hard: -1, tool: null, blast: 99, h: 1, name: '', bed: -1 }, o);
}
defBlock(B.AIR, { solid: false });
defBlock(B.GRASS, { color: 0x62b23f, side: 0x86603c, bottom: 0x7a5636 });
defBlock(B.DIRT, { color: 0x7a5636 });
defBlock(B.STONE, { color: 0x8c8c8c });
defBlock(B.SMOOTH, { color: 0xa5a5a5 });
defBlock(B.BRICK, { color: 0x9c5f50 });
defBlock(B.PLANK, { color: 0xb88c54, hard: 2.4, tool: 'axe', blast: 1, name: '木板' });
defBlock(B.ENDSTONE, { color: 0xe6e4a8, hard: 4.5, tool: 'pick', blast: 2, name: '終界石' });
defBlock(B.OBSIDIAN, { color: 0x2c1f42, hard: 40, tool: 'pick', blast: 9, name: '黑曜石' });
defBlock(B.IRONB, { color: 0xdcdcdc });
defBlock(B.GOLDB, { color: 0xf4d23c });
defBlock(B.DIAMB, { color: 0x62ece2 });
defBlock(B.EMERB, { color: 0x3adc72 });
for (let t = 0; t < 4; t++) {
  defBlock(B.WOOL + t, { color: TEAM_DEFS[t].wool, hard: 0.4, tool: null, blast: 1, name: '羊毛' });
  const c = new THREE.Color(TEAM_DEFS[t].wool).multiplyScalar(0.75);
  defBlock(B.CLAY + t, { color: c.getHex() });
  defBlock(B.BED + t, { color: TEAM_DEFS[t].color, h: 0.5625, hard: 0.5, bed: t, name: '床' });
}
const TOOL_MULT = [1, 2, 4, 6, 8];

function breakTime(type, f) {
  const info = BINFO[type];
  let t = info.hard;
  if (t < 0) return Infinity;
  if (info.tool === 'pick') t /= TOOL_MULT[f.pick];
  else if (info.tool === 'axe') t /= TOOL_MULT[f.axe];
  if (f.miner) t *= 0.8;
  return t;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ===================== 世界資料 =====================
class World {
  constructor() {
    this.data = new Uint8Array(WX * WY * WZ);
    this.placed = new Uint8Array(WX * WY * WZ);
    this.onChange = null;
  }
  idx(x, y, z) { return (y * WZ + z) * WX + x; }
  inB(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < WX && y < WY && z < WZ; }
  get(x, y, z) { return this.inB(x, y, z) ? this.data[this.idx(x, y, z)] : 0; }
  isPlaced(x, y, z) { return this.inB(x, y, z) ? this.placed[this.idx(x, y, z)] > 0 : false; }
  placedBy(x, y, z) { return this.inB(x, y, z) ? this.placed[this.idx(x, y, z)] - 1 : -1; }
  // placedBy: 放置者隊伍 id + 1（0 代表地圖原本的方塊）
  set(x, y, z, v, placedBy) {
    if (!this.inB(x, y, z)) return;
    const i = this.idx(x, y, z);
    this.data[i] = v; this.placed[i] = placedBy || 0;
    if (this.onChange) this.onChange(x, y, z);
  }
  solid(x, y, z) { return BINFO[this.get(x, y, z)].solid; }
  hasNeighbor(x, y, z) {
    return this.solid(x + 1, y, z) || this.solid(x - 1, y, z) || this.solid(x, y + 1, z) ||
      this.solid(x, y - 1, z) || this.solid(x, y, z + 1) || this.solid(x, y, z - 1);
  }
  // DDA 射線
  raycast(o, d, maxD) {
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = d.x > 0 ? 1 : -1, sy = d.y > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1;
    const tdx = d.x !== 0 ? Math.abs(1 / d.x) : Infinity;
    const tdy = d.y !== 0 ? Math.abs(1 / d.y) : Infinity;
    const tdz = d.z !== 0 ? Math.abs(1 / d.z) : Infinity;
    let tmx = d.x !== 0 ? (d.x > 0 ? (x + 1 - o.x) : (o.x - x)) * tdx : Infinity;
    let tmy = d.y !== 0 ? (d.y > 0 ? (y + 1 - o.y) : (o.y - y)) * tdy : Infinity;
    let tmz = d.z !== 0 ? (d.z > 0 ? (z + 1 - o.z) : (o.z - z)) * tdz : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    for (let i = 0; i < 200 && t <= maxD; i++) {
      const b = this.get(x, y, z);
      if (b && BINFO[b].solid) {
        const h = BINFO[b].h;
        if (h >= 1 || (o.y + d.y * t) - y <= h + 0.02 || ny === -1) {
          return { x, y, z, nx, ny, nz, dist: t, type: b };
        }
        // 床是半格高：看射線離開這格前是否有進入下半部
        const tExit = Math.min(tmx, tmy, tmz);
        if (d.y < 0 && (o.y + d.y * tExit) - y <= h) {
          return { x, y, z, nx: 0, ny: 1, nz: 0, dist: t, type: b };
        }
      }
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
  // 兩點之間有沒有方塊擋住
  lineClear(a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    if (len < 0.01) return true;
    d.divideScalar(len);
    const hit = this.raycast(a, d, len);
    return !hit;
  }
}

// ===================== 地圖生成 =====================
function buildIsland(w, cx, cz, hx, hz, top, rng, depth, topFn) {
  for (let dx = -hx; dx <= hx; dx++) for (let dz = -hz; dz <= hz; dz++) {
    if (Math.abs(dx) === hx && Math.abs(dz) === hz) continue; // 圓角
    const t = topFn ? topFn(dx, dz) : top;
    w.set(cx + dx, FLOOR, cz + dz, t);
    const edge = Math.max(Math.abs(dx) / (hx + 0.5), Math.abs(dz) / (hz + 0.5));
    const d = Math.floor((1 - edge * edge) * depth + rng() * 1.6);
    for (let k = 1; k <= d; k++) w.set(cx + dx, FLOOR - k, cz + dz, k <= 2 ? B.DIRT : B.STONE);
  }
}

function buildMap(w) {
  const rng = mulberry32(20261112);
  const layout = { teams: [], diamonds: [], emeralds: [] };
  for (let t = 0; t < 4; t++) {
    const [dx, dz] = TEAM_DEFS[t].dir;
    const px = -dz, pz = dx; // 垂直方向
    const cx = CX + dx * 44, cz = CZ + dz * 44;
    buildIsland(w, cx, cz, 7, 7, B.GRASS, rng, 7);
    // 重生點的隊伍色地板
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) w.set(cx + a, FLOOR, cz + b, B.CLAY + t);
    // 資源生成器
    const gx = cx + dx * 5, gz = cz + dz * 5;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) w.set(gx + a, FLOOR, gz + b, B.BRICK);
    w.set(gx, FLOOR, gz, B.IRONB);
    // 床
    const foot = [cx - dx * 3, GROUND, cz - dz * 3];
    const head = [cx - dx * 4, GROUND, cz - dz * 4];
    w.set(foot[0], foot[1], foot[2], B.BED + t);
    w.set(head[0], head[1], head[2], B.BED + t);
    layout.teams.push({
      id: t, dir: [dx, dz], perp: [px, pz],
      spawn: { x: cx + 0.5, y: GROUND, z: cz + 0.5 },
      gen: { x: gx + 0.5, y: GROUND, z: gz + 0.5 },
      bedFoot: foot, bedHead: head,
      shop: { x: cx + px * 4 + dx * 3 + 0.5, y: GROUND, z: cz + pz * 4 + dz * 3 + 0.5 },
      upg: { x: cx - px * 4 + dx * 3 + 0.5, y: GROUND, z: cz - pz * 4 + dz * 3 + 0.5 },
    });
  }
  // 鑽石島
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cx = CX + sx * 30, cz = CZ + sz * 30;
    buildIsland(w, cx, cz, 4, 4, B.GRASS, rng, 5);
    w.set(cx, FLOOR, cz, B.DIAMB);
    layout.diamonds.push({ x: cx + 0.5, y: GROUND, z: cz + 0.5 });
  }
  // 中島
  buildIsland(w, CX, CZ, 9, 9, B.STONE, rng, 9, (dx, dz) => ((Math.abs(dx) + Math.abs(dz)) % 4 === 0 ? B.SMOOTH : B.STONE));
  for (const [ox, oz] of [[-3, -3], [3, 3]]) {
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) w.set(CX + ox + a, FLOOR, CZ + oz + b, B.BRICK);
    w.set(CX + ox, FLOOR, CZ + oz, B.EMERB);
    layout.emeralds.push({ x: CX + ox + 0.5, y: GROUND, z: CZ + oz + 0.5 });
  }
  // 中島四角的裝飾柱（不擋路線）
  for (const [ox, oz] of [[-7, 7], [7, -7]]) {
    for (let y = GROUND; y < GROUND + 3; y++) w.set(CX + ox, y, CZ + oz, B.BRICK);
  }
  return layout;
}

// ===================== 區塊網格 =====================
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: 0.8 },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: 0.8 },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1.0 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.55 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.68 },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.68 },
];
const UVS = [[0, 0], [1, 0], [1, 1], [0, 1]];

function makeNoiseTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const ctx = cv.getContext('2d');
  const rng = mulberry32(7);
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
    let v = 205 + Math.floor(rng() * 50);
    if (x === 0 || y === 0) v -= 18;
    ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  return tex;
}

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

class WorldMesher {
  constructor(world, scene) {
    this.world = world; this.scene = scene;
    this.mat = new THREE.MeshBasicMaterial({ vertexColors: true, map: makeNoiseTexture() });
    this.meshes = new Map();
    this.dirty = new Set();
    for (let k = 0; k < NCX * NCY * NCZ; k++) this.dirty.add(k);
    this.tmpColor = new THREE.Color();
  }
  mark(x, y, z) {
    const add = (cx, cy, cz) => {
      if (cx < 0 || cy < 0 || cz < 0 || cx >= NCX || cy >= NCY || cz >= NCZ) return;
      this.dirty.add((cy * NCZ + cz) * NCX + cx);
    };
    const cx = x >> 4, cy = y >> 4, cz = z >> 4;
    add(cx, cy, cz);
    if ((x & 15) === 0) add(cx - 1, cy, cz); if ((x & 15) === 15) add(cx + 1, cy, cz);
    if ((y & 15) === 0) add(cx, cy - 1, cz); if ((y & 15) === 15) add(cx, cy + 1, cz);
    if ((z & 15) === 0) add(cx, cy, cz - 1); if ((z & 15) === 15) add(cx, cy, cz + 1);
  }
  update() {
    if (!this.dirty.size) return;
    for (const k of this.dirty) this.rebuild(k);
    this.dirty.clear();
  }
  rebuild(k) {
    const cx = k % NCX, cz = Math.floor(k / NCX) % NCZ, cy = Math.floor(k / (NCX * NCZ));
    const w = this.world;
    const pos = [], col = [], uv = [], idx = [];
    const c = this.tmpColor;
    for (let y = cy * CS; y < cy * CS + CS; y++) for (let z = cz * CS; z < cz * CS + CS; z++) for (let x = cx * CS; x < cx * CS + CS; x++) {
      const b = w.data[w.idx(x, y, z)];
      if (!b) continue;
      const info = BINFO[b];
      if (info.bed >= 0) continue; // 床用獨立模型
      const vary = 0.94 + hash3(x, y, z) * 0.1;
      for (let f = 0; f < 6; f++) {
        const F = FACES[f];
        const nb = w.get(x + F.n[0], y + F.n[1], z + F.n[2]);
        if (nb && BINFO[nb].solid && BINFO[nb].h >= 1) continue;
        let hex = info.color;
        if (f === 3 && info.bottom != null) hex = info.bottom;
        else if (f !== 2 && f !== 3 && info.side != null) hex = info.side;
        c.setHex(hex).multiplyScalar(F.s * vary);
        const base = pos.length / 3;
        for (let v = 0; v < 4; v++) {
          pos.push(x + F.c[v][0], y + F.c[v][1], z + F.c[v][2]);
          // 草方塊側面頂端留一點綠色
          if (info.side != null && f !== 2 && f !== 3 && F.c[v][1] === 1) {
            const g = new THREE.Color(info.color).multiplyScalar(F.s * vary);
            col.push(g.r, g.g, g.b);
          } else col.push(c.r, c.g, c.b);
          uv.push(UVS[v][0], UVS[v][1]);
        }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    const old = this.meshes.get(k);
    if (old) { this.scene.remove(old); old.geometry.dispose(); this.meshes.delete(k); }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, this.mat);
    m.matrixAutoUpdate = false;
    this.scene.add(m);
    this.meshes.set(k, m);
  }
}
