'use strict';
// ===================== 程式產生的像素貼圖 =====================
const TILE = 16, ATLAS_N = 8;
const TILES = {};
const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = atlasCanvas.height = TILE * ATLAS_N;
const actx = atlasCanvas.getContext('2d');
let tileCount = 0;
const tileCanvases = {};

const clamp255 = v => Math.max(0, Math.min(255, Math.round(v)));
const mulC = (c, k) => [clamp255(c[0] * k), clamp255(c[1] * k), clamp255(c[2] * k)];
const mixC = (a, b, t) => [clamp255(a[0] + (b[0] - a[0]) * t), clamp255(a[1] + (b[1] - a[1]) * t), clamp255(a[2] + (b[2] - a[2]) * t)];

function addTile(name, fn) {
  const i = tileCount++;
  TILES[name] = i;
  const cv = document.createElement('canvas'); cv.width = cv.height = TILE;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(TILE, TILE);
  const rng = mulberry32(9000 + i * 131);
  const put = (x, y, c, a = 1) => {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    const o = (y * TILE + x) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = Math.round(a * 255);
  };
  fn(put, rng);
  ctx.putImageData(img, 0, 0);
  tileCanvases[name] = cv;
  actx.drawImage(cv, (i % ATLAS_N) * TILE, Math.floor(i / ATLAS_N) * TILE);
}
const each = fn => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) fn(x, y); };

// --- 方塊 ---
addTile('grass_top', (put, r) => each((x, y) => {
  let c = mulC([96, 162, 54], 0.82 + r() * 0.3);
  if (r() < 0.12) c = [74, 128, 40];
  if (r() < 0.05) c = [124, 190, 72];
  put(x, y, c);
}));
function dirtPx(put, r, x, y) {
  let c = mulC([134, 96, 67], 0.8 + r() * 0.32);
  const q = r();
  if (q < 0.1) c = [96, 68, 46]; else if (q < 0.15) c = [162, 122, 88];
  put(x, y, c);
}
addTile('grass_side', (put, r) => {
  const edge = [];
  for (let x = 0; x < TILE; x++) edge.push(2 + Math.floor(r() * 3));
  each((x, y) => {
    if (y < edge[x]) put(x, y, mulC([96, 162, 54], 0.8 + r() * 0.3));
    else if (y === edge[x] && r() < 0.5) put(x, y, [74, 128, 40]);
    else dirtPx(put, r, x, y);
  });
});
addTile('dirt', (put, r) => each((x, y) => dirtPx(put, r, x, y)));
addTile('stone', (put, r) => {
  const blot = [];
  for (let i = 0; i < 7; i++) blot.push([r() * 16, r() * 16, 1 + r() * 1.8]);
  each((x, y) => {
    let c = mulC([128, 128, 128], 0.86 + r() * 0.22);
    for (const [bx, by, br] of blot) if (Math.hypot(x - bx, (y - by) * 1.6) < br) c = mulC([104, 104, 104], 0.9 + r() * 0.15);
    put(x, y, c);
  });
});
addTile('smooth', (put, r) => each((x, y) => {
  let c = mulC([170, 170, 170], 0.95 + r() * 0.07);
  if (x === 0 || y === 0) c = [196, 196, 196];
  if (x === 15 || y === 15) c = [128, 128, 128];
  put(x, y, c);
}));
addTile('brick', (put, r) => each((x, y) => {
  const row = Math.floor(y / 4);
  const off = row % 2 ? 4 : 0;
  const mortar = y % 4 === 3 || (x + off) % 8 === 7;
  if (mortar) put(x, y, mulC([176, 168, 158], 0.9 + r() * 0.15));
  else {
    let c = mulC([152, 74, 58], 0.82 + r() * 0.26);
    if ((x + off) % 8 === 0 || y % 4 === 0) c = mulC(c, 1.12);
    put(x, y, c);
  }
}));
addTile('plank', (put, r) => {
  const tone = [0.95 + r() * 0.1, 0.92 + r() * 0.1, 0.97 + r() * 0.1, 0.9 + r() * 0.1];
  each((x, y) => {
    const row = Math.floor(y / 4);
    let c = mulC([186, 142, 86], tone[row] * (0.94 + r() * 0.08));
    if (y % 4 === 3) c = [116, 84, 48];
    else if (r() < 0.08) c = mulC(c, 0.82);
    const seam = row % 2 ? 11 : 4;
    if (x === seam && y % 4 !== 3) c = [128, 94, 54];
    put(x, y, c);
  });
});
addTile('endstone', (put, r) => each((x, y) => {
  let c = mulC([224, 224, 166], 0.9 + r() * 0.14);
  if (r() < 0.14) c = [196, 194, 136];
  if (r() < 0.04) c = [168, 166, 112];
  put(x, y, c);
}));
addTile('obsidian', (put, r) => each((x, y) => {
  let c = mulC([28, 18, 44], 0.7 + r() * 0.7);
  if (r() < 0.07) c = [84, 54, 128];
  if (r() < 0.03) c = [120, 90, 170];
  put(x, y, c);
}));
function metalTile(base, gem) {
  return (put, r) => each((x, y) => {
    let c = mulC(base, 0.95 + r() * 0.06);
    if (x === 0 || y === 0) c = mulC(base, 1.18);
    if (x === 15 || y === 15) c = mulC(base, 0.7);
    if ((x === 1 || x === 14) && y > 0 && y < 15 || (y === 1 || y === 14) && x > 0 && x < 15) c = mulC(base, 0.86);
    if (gem && x > 2 && x < 13 && y > 2 && y < 13 && ((x + y) % 5 === 0 || (x - y + 20) % 5 === 0)) c = mulC(base, 1.22);
    put(x, y, c);
  });
}
addTile('iron_block', metalTile([220, 220, 220], false));
addTile('gold_block', metalTile([246, 208, 60], false));
addTile('diamond_block', metalTile([96, 222, 214], true));
addTile('emerald_block', metalTile([62, 206, 110], true));
addTile('wool', (put, r) => each((x, y) => {
  let v = 228 * (0.9 + r() * 0.1);
  if ((x + y * 2) % 4 === 0) v *= 0.9;
  if ((x * 3 + y) % 7 === 0) v *= 1.04;
  put(x, y, [clamp255(v), clamp255(v), clamp255(v)]);
}));
addTile('clay', (put, r) => each((x, y) => {
  const v = 214 * (0.94 + r() * 0.08);
  put(x, y, [clamp255(v), clamp255(v), clamp255(v)]);
}));
addTile('glass', (put, r) => each((x, y) => {
  const border = x === 0 || y === 0 || x === 15 || y === 15;
  if (border) put(x, y, [232, 248, 255], 0.95);
  else if ((x - y === 3 || x - y === 4 || x - y === -6) && x > 2 && x < 13) put(x, y, [255, 255, 255], 0.7);
  else put(x, y, [190, 228, 248], 0.16);
}));
addTile('slime', (put, r) => each((x, y) => {
  const inner = x > 3 && x < 12 && y > 3 && y < 12;
  const ring = (x === 3 || x === 12) && y >= 3 && y <= 12 || (y === 3 || y === 12) && x >= 3 && x <= 12;
  if (ring) put(x, y, [70, 150, 56], 0.95);
  else if (inner) put(x, y, mulC([128, 210, 100], 0.9 + r() * 0.1), 0.9);
  else put(x, y, mulC([120, 210, 96], 0.95 + r() * 0.08), 0.72);
}));
addTile('tnt_side', (put, r) => {
  const T = ['XXX.X..X.XXX', '.X..XX.X..X.', '.X..X.XX..X.', '.X..X..X..X.'];
  each((x, y) => {
    let c = mulC([206, 48, 40], 0.88 + r() * 0.14);
    if (x % 4 === 3) c = mulC(c, 0.82);
    if (y >= 5 && y <= 10) {
      c = [236, 232, 224];
      const ty = y - 6, tx = x - 2;
      if (ty >= 0 && ty < 4 && tx >= 0 && tx < 12 && T[ty][tx] === 'X') c = [30, 30, 30];
    }
    put(x, y, c);
  });
});
addTile('tnt_top', (put, r) => each((x, y) => {
  let c = mulC([206, 48, 40], 0.88 + r() * 0.14);
  const d = Math.hypot(x - 7.5, y - 7.5);
  if (d < 3.2) c = [228, 224, 214];
  if (d < 1.2) c = [60, 60, 60];
  put(x, y, c);
}));

let atlasTex = null;
function getAtlasTexture() {
  if (!atlasTex) {
    atlasTex = new THREE.CanvasTexture(atlasCanvas);
    atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.NearestFilter;
    atlasTex.generateMipmaps = false;
  }
  return atlasTex;
}
function tileTexture(name) {
  const t = new THREE.CanvasTexture(tileCanvases[name]);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

// ===================== 物品像素圖 =====================
const TIER_COL = {
  wood: [[176, 132, 76], [124, 90, 48]], stone: [[150, 150, 150], [104, 104, 104]], iron: [[232, 232, 232], [168, 168, 168]],
  gold: [[252, 222, 80], [206, 160, 30]], diamond: [[110, 240, 230], [40, 168, 160]],
};
const SWORD_MAT = [null, 'wood', 'stone', 'iron', 'diamond'];
const PICK_MAT = [null, 'wood', 'iron', 'gold', 'diamond'];
const AXE_MAT = [null, 'wood', 'stone', 'iron', 'diamond'];
const STICK = [[150, 108, 60], [96, 66, 34]];
const artCache = {};

function makeArt(key, draw) {
  if (artCache[key]) return artCache[key];
  const px = new Array(256).fill(null);
  const P = {
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < 16 && y < 16) px[y * 16 + x] = c; },
    line(x0, y0, x1, y1, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) P.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
    },
    disc(cx, cy, r, fn) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - cx, y - cy); if (d <= r) P.set(x, y, fn(x, y, d)); } },
    get: (x, y) => (x >= 0 && y >= 0 && x < 16 && y < 16 ? px[y * 16 + x] : null),
  };
  draw(P);
  // 加黑色外框
  const out = px.slice();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (px[y * 16 + x]) continue;
    if (P.get(x - 1, y) || P.get(x + 1, y) || P.get(x, y - 1) || P.get(x, y + 1)) out[y * 16 + x] = [30, 22, 18];
  }
  return (artCache[key] = out);
}
function stickLine(P, x0, y0, x1, y1) { P.line(x0, y0, x1, y1, STICK[0]); P.line(x0 + 1, y0, x1 + 1, y1, STICK[1]); }

function itemArt(id, tier, extra) {
  switch (id) {
    case 'sword': {
      const m = TIER_COL[SWORD_MAT[tier] || 'wood'];
      return makeArt('sword' + tier, P => {
        P.line(5, 10, 14, 1, m[0]); P.line(6, 10, 14, 2, m[1]); P.line(5, 9, 13, 1, mixC(m[0], [255, 255, 255], 0.35));
        P.line(2, 9, 6, 13, [80, 54, 30]); P.line(3, 9, 6, 12, [110, 76, 40]);
        P.line(1, 14, 4, 11, STICK[0]); P.set(1, 15, [70, 50, 30]); P.set(0, 15, [70, 50, 30]);
      });
    }
    case 'pick': {
      const m = TIER_COL[PICK_MAT[tier] || 'wood'];
      return makeArt('pick' + tier, P => {
        stickLine(P, 2, 14, 11, 5);
        P.line(5, 2, 9, 2, m[0]); P.line(9, 2, 13, 6, m[0]); P.line(13, 6, 13, 10, m[0]);
        P.line(6, 3, 9, 3, m[1]); P.line(10, 4, 12, 6, m[1]); P.line(12, 7, 12, 9, m[1]);
        P.set(4, 3, m[1]); P.set(12, 11, m[1]);
      });
    }
    case 'axe': {
      const m = TIER_COL[AXE_MAT[tier] || 'wood'];
      return makeArt('axe' + tier, P => {
        stickLine(P, 2, 14, 11, 5);
        for (let y = 1; y <= 7; y++) for (let x = 8; x <= 13; x++) {
          if ((x === 8 && (y === 1 || y === 7)) || (x - 8) + (7 - y) > 10) continue;
          if (x + y < 11 && !(x === 8 && y > 1)) continue;
          P.set(x, y, x <= 9 ? m[0] : m[1]);
        }
        P.line(8, 2, 8, 6, mixC(m[0], [255, 255, 255], 0.4));
      });
    }
    case 'shears': return makeArt('shears', P => {
      P.line(4, 11, 12, 3, [210, 210, 210]); P.line(5, 11, 12, 4, [150, 150, 150]);
      P.line(4, 4, 12, 12, [190, 190, 190]); P.line(4, 5, 11, 12, [130, 130, 130]);
      P.disc(3, 12, 2, () => [190, 50, 40]); P.disc(3, 3.5, 1.6, () => [190, 50, 40]);
    });
    case 'kbstick': return makeArt('kbstick', P => {
      stickLine(P, 2, 14, 13, 3);
      P.set(13, 2, [255, 230, 120]); P.set(7, 8, [255, 230, 120]); P.set(10, 4, [255, 240, 160]);
    });
    case 'rod': return makeArt('rod', P => {
      stickLine(P, 1, 15, 12, 2);
      P.set(13, 1, [90, 90, 90]);
      for (let y = 3; y <= 12; y += 1) if (y % 2) P.set(14, y, [220, 220, 220]);
      P.set(14, 13, [180, 180, 180]); P.set(13, 14, [180, 180, 180]); P.set(12, 13, [180, 180, 180]);
    });
    case 'bow': return makeArt('bow' + (extra || 0), P => {
      for (let a = 0; a <= 20; a++) {
        const t = Math.PI * (1.0 + 0.5 * a / 20);
        P.set(13 + Math.cos(t) * 11, 13 + Math.sin(t) * 11, STICK[0]);
        P.set(13 + Math.cos(t) * 10, 13 + Math.sin(t) * 10, STICK[1]);
      }
      const pull = extra ? 2 : 0;
      P.line(2, 13 - pull, 13 - pull, 2, [230, 230, 230]);
      if (extra) { P.line(5, 9, 11, 3, [170, 130, 80]); P.set(12, 2, [200, 200, 200]); }
    });
    case 'arrow': return makeArt('arrow', P => {
      P.line(3, 12, 12, 3, [150, 112, 66]);
      P.set(13, 2, [200, 200, 200]); P.set(12, 2, [170, 170, 170]); P.set(13, 3, [170, 170, 170]); P.set(14, 1, [220, 220, 220]);
      P.set(2, 13, [240, 240, 240]); P.set(1, 13, [240, 240, 240]); P.set(2, 14, [240, 240, 240]); P.set(3, 14, [210, 210, 210]); P.set(1, 12, [210, 210, 210]);
    });
    case 'snowball': return makeArt('snowball', P => P.disc(7.5, 7.5, 5.2, (x, y, d) => mulC([240, 248, 255], 1 - d * 0.03 - (x + y > 17 ? 0.12 : 0))));
    case 'fireball': return makeArt('fireball', P => P.disc(7.5, 7.5, 5.5, (x, y, d) => d < 2 ? [255, 240, 140] : d < 3.8 ? [255, 160, 40] : [200, 60, 20]));
    case 'pearl': return makeArt('pearl', P => P.disc(7.5, 7.5, 5, (x, y, d) => d < 1.8 ? [120, 220, 200] : (x + y < 13 ? [40, 140, 120] : [16, 80, 72])));
    case 'egg': return makeArt('egg', P => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const d = Math.hypot((x - 7.5) / 4.6, (y - 8.5) / (y < 8.5 ? 6 : 5));
        if (d <= 1) P.set(x, y, (x * 7 + y * 3) % 11 === 0 ? [190, 160, 120] : mulC([244, 232, 206], 1 - (x > 9 ? 0.1 : 0)));
      }
    });
    case 'gapple': return makeArt('gapple', P => {
      P.disc(7.5, 9, 5.2, (x, y, d) => (x < 6 && y < 9 ? [255, 246, 160] : d > 4.2 ? [210, 160, 30] : [250, 210, 60]));
      P.line(8, 2, 8, 4, [100, 70, 40]); P.set(9, 2, [70, 160, 50]); P.set(10, 2, [70, 160, 50]); P.set(10, 3, [50, 130, 40]);
    });
    case 'tnt': return null;
    case 'iron': return makeArt('ironingot', P => { for (let y = 5; y < 11; y++) for (let x = 2 + (y - 5) % 2; x < 14 - (y - 5) % 2; x++) P.set(x, y, y < 7 ? [250, 250, 250] : y > 9 ? [150, 150, 150] : [214, 214, 214]); });
    case 'platform': return makeArt('platform', P => {
      for (let y = 4; y < 13; y++) for (let x = 2; x < 14; x++) P.set(x, y, (x === 2 || x === 13 || y === 4 || y === 12) ? [70, 150, 56] : [128, 214, 100]);
      P.line(4, 6, 6, 6, [200, 255, 180]);
    });
    case 'pot_speed': case 'pot_jump': case 'pot_invis': {
      const liquid = { pot_speed: [110, 200, 255], pot_jump: [120, 240, 110], pot_invis: [180, 180, 210] }[id];
      return makeArt(id, P => {
        P.line(6, 1, 9, 1, [140, 100, 60]);
        P.line(6, 2, 9, 2, [210, 230, 240]); P.line(6, 3, 9, 3, [210, 230, 240]);
        P.disc(7.5, 9.5, 5, (x, y, d) => (d > 4.2 ? [210, 230, 240] : y < 7 ? [230, 240, 250] : mulC(liquid, x < 6 ? 1.15 : 0.95)));
        P.set(5, 8, [255, 255, 255]); P.set(5, 9, [255, 255, 255]);
      });
    }
    case 'armor': {
      const col = [null, [160, 100, 60], [140, 140, 150], [225, 225, 225], [90, 230, 222]][tier || 1];
      return makeArt('armor' + tier, P => {
        for (let y = 2; y < 15; y++) for (let x = 2; x < 14; x++) {
          if (y < 5 && x > 4 && x < 11) continue;
          if (y >= 5 && (x < 4 || x > 11)) continue;
          P.set(x, y, mulC(col, x < 8 ? 1.08 : 0.9));
        }
      });
    }
  }
  return null;
}

// 物品像素圖 → 圖片（快捷欄、商店用）
const iconCache = {};
function artToCanvas(art, scale) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 16 * scale;
  const ctx = cv.getContext('2d');
  art.forEach((c, i) => { if (c) { ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect((i % 16) * scale, Math.floor(i / 16) * scale, scale, scale); } });
  return cv;
}
// 方塊的立體小圖
function blockIconCanvas(texTop, texSide, tint) {
  const S = 32, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const tinted = name => {
    const src = tileCanvases[name];
    if (tint == null) return src;
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#' + tint.toString(16).padStart(6, '0'); x.fillRect(0, 0, 16, 16);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    return c;
  };
  ctx.imageSmoothingEnabled = false;
  const faces = [[texTop, [1, 0.5, -1, 0.5, 16, 0], 0], [texSide, [1, 0.5, 0, 1, 0, 8], 0.25], [texSide, [1, -0.5, 0, 1, 16, 16], 0.4]];
  for (const [n, m, dark] of faces) {
    ctx.setTransform(...m);
    ctx.drawImage(tinted(n), 0, 0, 16, 16);
    if (dark) { ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, 16, 16); }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return cv;
}
function iconURL(key, build) {
  if (!iconCache[key]) { const cv = build(); iconCache[key] = cv ? cv.toDataURL() : ''; }
  return iconCache[key];
}

// 像素圖 → 立體模型（像 Minecraft 手上的物品）
const extrudeCache = {};
function extrudedGeometry(art, key) {
  if (extrudeCache[key]) return extrudeCache[key];
  const pos = [], col = [], idx = [];
  const s = 1 / 16, t = s * 0.9;
  const at = (x, y) => (x >= 0 && y >= 0 && x < 16 && y < 16 ? art[y * 16 + x] : null);
  const quad = (a, b, c2, d, color, shade) => {
    const base = pos.length / 3;
    pos.push(...a, ...b, ...c2, ...d);
    for (let i = 0; i < 4; i++) col.push(color[0] / 255 * shade, color[1] / 255 * shade, color[2] / 255 * shade);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = at(x, y); if (!c) continue;
    const x0 = (x - 8) * s, x1 = x0 + s, y1 = (8 - y) * s, y0 = y1 - s, z0 = -t / 2, z1 = t / 2;
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, 1);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], c, 0.8);
    if (!at(x, y - 1)) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], c, 0.95);
    if (!at(x, y + 1)) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, 0.6);
    if (!at(x - 1, y)) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c, 0.75);
    if (!at(x + 1, y)) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], c, 0.75);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return (extrudeCache[key] = g);
}

// 帶貼圖的小方塊（手上拿方塊時）
function texturedCube(top, side, tint) {
  const mats = [side, side, top, top, side, side].map(n => new THREE.MeshLambertMaterial({ map: tileTexture(n), color: tint != null ? tint : 0xffffff, transparent: n === 'glass' || n === 'slime' }));
  return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats);
}

// ===================== 角色外觀 =====================
const skinCache = {};
function skinCanvas(kind, teamColor, variant) {
  const key = kind + teamColor + '_' + variant;
  if (skinCache[key]) return skinCache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 8;
  const ctx = cv.getContext('2d');
  const tc = new THREE.Color(teamColor);
  const T = [tc.r * 255, tc.g * 255, tc.b * 255];
  const rng = mulberry32(variant * 31 + kind.length * 7 + 3);
  const skin = [[224, 180, 140], [196, 146, 106], [150, 104, 72], [236, 196, 160]][variant % 4];
  const hair = [[74, 48, 32], [30, 24, 22], [180, 130, 60], [110, 60, 30]][(variant >> 2) % 4];
  const p = (x, y, c) => { ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(x, y, 1, 1); };
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    let c;
    if (kind === 'face') {
      c = mulC(skin, 0.95 + rng() * 0.08);
      if (y < 2 || (y === 2 && (x === 0 || x === 7))) c = mulC(hair, 0.9 + rng() * 0.2);
      if (y === 4 && (x === 1 || x === 5)) c = [255, 255, 255];
      if (y === 4 && (x === 2 || x === 6)) c = [40, 60, 140];
      if (y === 6 && x >= 3 && x <= 4) c = mulC(skin, 0.7);
    } else if (kind === 'head') {
      c = y < 3 ? mulC(hair, 0.9 + rng() * 0.2) : mulC(skin, 0.95 + rng() * 0.08);
    } else if (kind === 'top') {
      c = mulC(hair, 0.9 + rng() * 0.2);
    } else if (kind === 'shirt') {
      c = mulC(T, 0.88 + rng() * 0.16);
      if (y === 0 && x > 1 && x < 6) c = mulC(T, 0.6);
      if (y === 6) c = [60, 44, 30];
      if (y === 6 && (x === 3 || x === 4)) c = [210, 190, 90];
    } else if (kind === 'arm') {
      c = y < 5 ? mulC(T, 0.88 + rng() * 0.16) : mulC(skin, 0.95 + rng() * 0.08);
    } else if (kind === 'leg') {
      c = y < 6 ? mulC([70, 70, 90], 0.85 + rng() * 0.2) : [60, 52, 48];
    }
    p(x, y, c);
  }
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return (skinCache[key] = t);
}
