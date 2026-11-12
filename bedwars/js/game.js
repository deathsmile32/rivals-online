'use strict';
// ===================== 商店與升級資料 =====================
const RES_NAME = { iron: '鐵', gold: '金', diamond: '鑽石', emerald: '綠寶石' };
const RES_CSS = { iron: '#e8e8e8', gold: '#ffd84a', diamond: '#5ff0ea', emerald: '#4dff7a' };
const TOOL_COST = [null, [10, 'iron'], [10, 'iron'], [3, 'gold'], [6, 'gold']]; // 升到該等級的價格

const SHOP = [
  { cat: '方塊', items: [
    { key: 'wool', name: '羊毛 ×16', cost: [4, 'iron'], desc: '最便宜的搭橋方塊', icon: 'wool' },
    { key: 'plank', name: '木板 ×16', cost: [4, 'gold'], desc: '用斧頭比較好挖', icon: 'plank' },
    { key: 'endstone', name: '終界石 ×12', cost: [24, 'iron'], desc: '防床好選擇，火球炸不掉', icon: 'endstone' },
    { key: 'obsidian', name: '黑曜石 ×4', cost: [4, 'emerald'], desc: '超硬，爆炸也炸不掉', icon: 'obsidian' },
  ] },
  { cat: '武器', items: [
    { key: 'sword2', name: '石劍', cost: [10, 'iron'], desc: '傷害 5', icon: 'sword', tier: 2 },
    { key: 'sword3', name: '鐵劍', cost: [7, 'gold'], desc: '傷害 6', icon: 'sword', tier: 3 },
    { key: 'sword4', name: '鑽石劍', cost: [4, 'emerald'], desc: '傷害 7', icon: 'sword', tier: 4 },
    { key: 'kbstick', name: '擊退棒', cost: [5, 'gold'], desc: '把敵人打飛到虛空', icon: 'kbstick' },
  ] },
  { cat: '護甲', items: [
    { key: 'armor2', name: '鎖鏈護甲', cost: [24, 'iron'], desc: '永久，減傷 36%', icon: 'armor', tier: 2 },
    { key: 'armor3', name: '鐵護甲', cost: [12, 'gold'], desc: '永久，減傷 50%', icon: 'armor', tier: 3 },
    { key: 'armor4', name: '鑽石護甲', cost: [6, 'emerald'], desc: '永久，減傷 64%', icon: 'armor', tier: 4 },
  ] },
  { cat: '工具', items: [
    { key: 'pick', name: '鎬子（升級）', desc: '挖終界石、黑曜石；死亡會降一級', icon: 'pick' },
    { key: 'axe', name: '斧頭（升級）', desc: '挖木板；死亡會降一級', icon: 'axe' },
  ] },
  { cat: '道具', items: [
    { key: 'gapple', name: '金蘋果', cost: [3, 'gold'], desc: '立即回血＋吸收護盾', icon: 'gapple' },
    { key: 'fireball', name: '火球', cost: [40, 'iron'], desc: '右鍵發射，會爆炸擊退', icon: 'fireball' },
    { key: 'tnt', name: 'TNT', cost: [4, 'gold'], desc: '放置 3 秒後爆炸', icon: 'tnt' },
    { key: 'pearl', name: '終界珍珠', cost: [4, 'emerald'], desc: '丟出去瞬間傳送', icon: 'pearl' },
    { key: 'egg', name: '搭橋蛋', cost: [1, 'emerald'], desc: '飛過的地方自動鋪羊毛', icon: 'egg' },
  ] },
];
const UPGRADES = [
  { key: 'sharp', name: '鋒利劍', max: 1, costs: [4], desc: '全隊的劍傷害 +1.25' },
  { key: 'prot', name: '強化護甲', max: 4, costs: [2, 4, 8, 16], desc: '全隊每級減傷 8%' },
  { key: 'forge', name: '熔爐升級', max: 3, costs: [2, 4, 6], desc: '基地資源產速 +50%/+100%，第 3 級產綠寶石' },
  { key: 'heal', name: '治療池', max: 1, costs: [1], desc: '在基地附近會持續回血' },
  { key: 'trap', name: '入侵陷阱', max: 1, costs: [1], desc: '敵人進入基地時緩速並警告（一次性）' },
];
const EVENTS = [
  { t: 360, name: '鑽石 II', fn: g => g.setGenTier('diamond', 2) },
  { t: 720, name: '綠寶石 II', fn: g => g.setGenTier('emerald', 2) },
  { t: 1080, name: '鑽石 III', fn: g => g.setGenTier('diamond', 3) },
  { t: 1440, name: '綠寶石 III', fn: g => g.setGenTier('emerald', 3) },
  { t: 1500, name: '床自毀', fn: g => g.destroyAllBeds() },
  { t: 2100, name: '遊戲結束', fn: g => g.timeUp() },
];
const GEN_INTERVAL = { diamond: [30, 30, 22, 15], emerald: [65, 65, 50, 35] };
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

function rayAABB(o, d, min, max) {
  let tmin = 0, tmax = Infinity;
  for (const a of ['x', 'y', 'z']) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < min[a] || o[a] > max[a]) return null; continue; }
    let t1 = (min[a] - o[a]) / d[a], t2 = (max[a] - o[a]) / d[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

function makeTextSprite(lines, scale) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const tex = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  sp.scale.set(2.4 * (scale || 1), 1.2 * (scale || 1), 1);
  sp.userData.set = (ls) => {
    const key = JSON.stringify(ls);
    if (sp.userData.key === key) return;
    sp.userData.key = key;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 256, 128);
    ctx.textAlign = 'center';
    ls.forEach((l, i) => {
      ctx.font = `bold ${i === 0 ? 34 : 28}px "Microsoft JhengHei","PingFang TC",sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(l.t, 128, 40 + i * 40);
      ctx.fillStyle = l.c || '#fff'; ctx.fillText(l.t, 128, 40 + i * 40);
    });
    tex.needsUpdate = true;
  };
  sp.userData.set(lines);
  return sp;
}

// ===================== 遊戲主體 =====================
class Game {
  constructor(renderer, opts) {
    this.renderer = renderer;
    this.difficulty = opts.difficulty || 'normal';
    this.testMode = !!opts.testMode;
    this.ui = opts.menu ? new Proxy({}, { get: () => () => { } }) : UI;
    this.sfx = opts.menu ? { play() { } } : SFX;
    this.time = 0; this.over = false; this.paused = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ec8ff);
    this.scene.fog = new THREE.Fog(0x8ec8ff, 45, 150);
    this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 400);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 1.15)); this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55); sun.position.set(40, 80, 20); this.scene.add(sun);

    this.world = new World();
    this.layout = buildMap(this.world);
    this.mesher = new WorldMesher(this.world, this.scene);
    this.world.onChange = (x, y, z) => this.mesher.mark(x, y, z);

    this.projectiles = []; this.tnts = []; this.particles = []; this.effects = [];
    this.buildTeams();
    this.buildGens();
    this.buildNPCs();
    this.buildFighters(opts.playerName || '玩家');
    this.buildViewmodel();
    this.buildHighlight();
    this.mesher.update();
    this.input = { keys: {}, mouseL: false, mouseR: false };
    this.breakState = null; this.placeRepeat = 0; this.useCd = 0;
    this.eventIdx = 0;
    this.spectator = false;
    this.spec = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 };
  }

  // ---------- 建立 ----------
  buildTeams() {
    this.teams = this.layout.teams.map((L, i) => {
      const t = Object.assign({}, L);
      t.def = TEAM_DEFS[i]; t.name = TEAM_DEFS[i].name;
      t.bedAlive = true; t.eliminated = false; t.defenseDone = false;
      t.up = { sharp: 0, prot: 0, forge: 0, heal: 0, trap: 0 };
      t.members = [];
      t.bedCenter = new THREE.Vector3((L.bedFoot[0] + L.bedHead[0]) / 2 + 0.5, GROUND + 0.3, (L.bedFoot[2] + L.bedHead[2]) / 2 + 0.5);
      t.defense = this.computeDefense(t);
      // 床模型
      const sx = Math.abs(L.bedHead[0] - L.bedFoot[0]) + 1, sz = Math.abs(L.bedHead[2] - L.bedFoot[2]) + 1;
      const grp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.3, sz), new THREE.MeshLambertMaterial({ color: 0x8a6038 }));
      frame.position.y = 0.15;
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.98, 0.26, sz * 0.98), new THREE.MeshLambertMaterial({ color: t.def.color }));
      blanket.position.y = 0.42;
      const pil = new THREE.Mesh(new THREE.BoxGeometry(sx === 1 ? 0.8 : 0.6, 0.14, sz === 1 ? 0.8 : 0.6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      pil.position.set((L.bedHead[0] - L.bedFoot[0]) * 0.5, 0.58, (L.bedHead[2] - L.bedFoot[2]) * 0.5);
      grp.add(frame, blanket, pil);
      grp.position.set(t.bedCenter.x, GROUND, t.bedCenter.z);
      this.scene.add(grp);
      t.bedMesh = grp;
      return t;
    });
  }
  computeDefense(t) {
    const beds = [t.bedFoot, t.bedHead];
    const cells = [];
    const m = (x, z) => Math.min(...beds.map(b => Math.abs(b[0] - x) + Math.abs(b[2] - z)));
    for (let x = t.bedHead[0] - 3; x <= t.bedHead[0] + 3; x++) for (let z = t.bedHead[2] - 3; z <= t.bedHead[2] + 3; z++) {
      for (const [y, d] of [[30, 0], [31, 1], [32, 2]]) {
        const mm = m(x, z);
        let layer = 0;
        if (y === 30) layer = mm === 1 ? 1 : mm === 2 ? 2 : 0;
        if (y === 31) layer = mm === 0 ? 1 : mm === 1 ? 2 : 0;
        if (y === 32) layer = mm === 0 ? 2 : 0;
        if (layer) cells.push({ x, y, z, layer });
      }
    }
    cells.sort((a, b) => a.layer - b.layer || a.y - b.y);
    return cells;
  }
  buildGens() {
    this.gens = [];
    const mk = (type, p, team, interval, cap) => {
      const g = { type, x: p.x, y: p.y, z: p.z, team, interval, timer: interval, count: 0, cap, tier: 1 };
      const col = { iron: 0xeeeeee, gold: 0xffd84a, diamond: 0x5ff0ea, emerald: 0x4dff7a }[type];
      g.item = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.25 }));
      g.item.position.set(p.x + (type === 'gold' ? 0.3 : type === 'iron' ? -0.3 : 0), p.y + 0.5, p.z);
      g.item.visible = false;
      this.scene.add(g.item);
      if (type === 'diamond' || type === 'emerald') {
        const big = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 }));
        big.position.set(p.x, p.y + 2.6, p.z); this.scene.add(big); g.big = big;
        g.label = makeTextSprite([{ t: '' }]); g.label.position.set(p.x, p.y + 3.9, p.z); this.scene.add(g.label);
      }
      this.gens.push(g);
      return g;
    };
    for (const t of this.teams) {
      t.genIron = mk('iron', t.gen, t, 1.1, 48);
      t.genGold = mk('gold', t.gen, t, 5.5, 12);
    }
    for (const p of this.layout.diamonds) mk('diamond', p, null, 30, 4);
    for (const p of this.layout.emeralds) mk('emerald', p, null, 65, 2);
  }
  buildNPCs() {
    this.npcs = [];
    for (const t of this.teams) {
      for (const [kind, p] of [['shop', t.shop], ['upg', t.upg]]) {
        const g = new THREE.Group();
        const robe = kind === 'shop' ? 0x7a5230 : 0x6a3a8a;
        const body = boxMesh(0.6, 1.3, 0.4, robe); body.position.y = 0.65;
        const head = boxMesh(0.5, 0.55, 0.5, 0xc89a78); head.position.y = 1.58;
        const nose = boxMesh(0.12, 0.22, 0.12, 0xb0866a); nose.position.set(0, 1.5, -0.3);
        const arms = boxMesh(0.7, 0.22, 0.3, new THREE.Color(robe).multiplyScalar(0.8).getHex()); arms.position.set(0, 1.0, -0.2);
        g.add(body, head, nose, arms);
        const lbl = makeTextSprite(kind === 'shop' ? [{ t: '道具商店', c: '#ffd84a' }, { t: '右鍵 / E' }] : [{ t: '團隊升級', c: '#d79bff' }, { t: '右鍵 / E' }], 0.9);
        lbl.position.y = 2.6; g.add(lbl);
        g.position.set(p.x, p.y, p.z);
        g.rotation.y = Math.atan2(t.spawn.x - p.x, t.spawn.z - p.z) + Math.PI;
        this.scene.add(g);
        this.npcs.push({ kind, team: t, pos: new THREE.Vector3(p.x, p.y, p.z), cell: [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)] });
      }
    }
  }
  buildFighters(playerName) {
    this.fighters = [];
    const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
    let ni = 0;
    for (const t of this.teams) {
      const pair = [];
      if (t.id === 0) {
        const p = new Fighter(this, t, playerName, false);
        this.player = p; pair.push(p);
        const mate = new Bot(this, t, names[ni++], 'defend'); mate.cmd = 'defend'; pair.push(mate);
      } else {
        pair.push(new Bot(this, t, names[ni++], 'attack'));
        pair.push(new Bot(this, t, names[ni++], 'defend'));
      }
      pair.forEach((f, i) => {
        t.members.push(f); this.fighters.push(f);
        f.pos.set(t.spawn.x + (i ? 1 : -1) * 0.8, GROUND, t.spawn.z);
        f.yaw = Math.atan2(-(CX - t.spawn.x), -(CZ - t.spawn.z));
        if (f.isBot) {
          f.model = makeHumanoid(t.def.color, f.name, t.def.css);
          setModelArmor(f.model, f);
          this.scene.add(f.model.group);
          f.progPos.copy(f.pos);
        }
      });
    }
  }
  buildViewmodel() {
    this.vm = new THREE.Group();
    this.vm.position.set(0.42, -0.4, -0.62);
    this.camera.add(this.vm);
    this.vmKey = '';
    // 第一人稱手臂
    this.vmArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.42), new THREE.MeshBasicMaterial({ color: 0xd8aa82 }));
    this.vmArm.position.set(0.06, -0.1, 0.02); this.vmArm.rotation.set(0.15, -0.25, 0);
    this.vm.add(this.vmArm);
    this.vmItem = new THREE.Group(); this.vm.add(this.vmItem);
  }
  buildHighlight() {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.hl = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }));
    this.hl.visible = false;
    this.scene.add(this.hl);
  }

  // ---------- 商店 ----------
  pay(f, cost) {
    const [n, r] = cost;
    if (f.res[r] < n) return false;
    f.res[r] -= n; return true;
  }
  shopCost(f, key) {
    if (key === 'pick') return f.pick < 4 ? TOOL_COST[f.pick + 1] : null;
    if (key === 'axe') return f.axe < 4 ? TOOL_COST[f.axe + 1] : null;
    for (const c of SHOP) for (const it of c.items) if (it.key === key) return it.cost;
    return null;
  }
  shopState(f, key) { // 'ok' | 'owned' | 'poor' | 'full'
    const cost = this.shopCost(f, key);
    if (!cost) return 'owned';
    if (key.startsWith('sword') && f.sword >= +key[5]) return 'owned';
    if (key.startsWith('armor') && f.armor >= +key[5]) return 'owned';
    if (key === 'kbstick' && f.count('kbstick')) return 'owned';
    if (f.res[cost[1]] < cost[0]) return 'poor';
    return 'ok';
  }
  buy(f, key) {
    if (this.shopState(f, key) !== 'ok') return false;
    const cost = this.shopCost(f, key);
    const give = { wool: ['wool', 16], plank: ['plank', 16], endstone: ['endstone', 12], obsidian: ['obsidian', 4], kbstick: ['kbstick', 1], gapple: ['gapple', 1], fireball: ['fireball', 1], tnt: ['tnt', 1], pearl: ['pearl', 1], egg: ['egg', 1] }[key];
    if (give) {
      const free = f.hotbar.some(s => !s || (s.id === give[0] && s.count + give[1] <= ITEMS[give[0]].stack));
      if (!free) { if (f === this.player) this.ui.toast('快捷欄滿了！'); return false; }
      this.pay(f, cost); f.add(give[0], give[1]);
    } else if (key.startsWith('sword')) { this.pay(f, cost); f.sword = +key[5]; }
    else if (key.startsWith('armor')) { this.pay(f, cost); f.armor = +key[5]; if (f.model) setModelArmor(f.model, f); }
    else if (key === 'pick') { this.pay(f, cost); f.pick++; f.giveTool('pick'); }
    else if (key === 'axe') { this.pay(f, cost); f.axe++; f.giveTool('axe'); }
    if (f === this.player) this.sfx.play('buy');
    return true;
  }
  upgradeState(f, key) {
    const u = UPGRADES.find(u => u.key === key);
    const lv = f.team.up[key];
    if (lv >= u.max) return 'owned';
    if (f.res.diamond < u.costs[lv]) return 'poor';
    return 'ok';
  }
  buyUpgrade(f, key) {
    if (this.upgradeState(f, key) !== 'ok') return false;
    const u = UPGRADES.find(u => u.key === key);
    f.res.diamond -= u.costs[f.team.up[key]];
    f.team.up[key]++;
    if (key === 'forge') this.applyForge(f.team);
    if (f.team === this.player.team) {
      this.ui.feed(`<span style="color:${f.team.def.css}">${f.name}</span> 購買了 <b>${u.name}${u.max > 1 ? ' ' + ROMAN[f.team.up[key]] : ''}</b>`);
      this.sfx.play('buy');
    }
    return true;
  }
  applyForge(t) {
    const mul = [1, 1.5, 2, 2][t.up.forge];
    t.genIron.interval = 1.1 / mul; t.genGold.interval = 5.5 / mul;
    if (t.up.forge >= 3 && !t.genEmer) {
      const g = { type: 'emerald', x: t.gen.x, y: t.gen.y, z: t.gen.z, team: t, interval: 60, timer: 60, count: 0, cap: 2, tier: 1 };
      g.item = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: 0x4dff7a, emissive: 0x4dff7a, emissiveIntensity: 0.3 }));
      g.item.position.set(t.gen.x, t.gen.y + 0.9, t.gen.z); g.item.visible = false; this.scene.add(g.item);
      this.gens.push(g); t.genEmer = g;
    }
  }
  setGenTier(type, tier) {
    for (const g of this.gens) if (g.type === type && !g.team) { g.tier = tier; g.interval = GEN_INTERVAL[type][tier]; g.timer = Math.min(g.timer, g.interval); }
    this.ui.feed(`<b style="color:${RES_CSS[type]}">${RES_NAME[type]}生成器</b> 升級到 ${ROMAN[tier]} 級！`);
  }
  nearestGen(type, p) {
    let best = null, bd = Infinity;
    for (const g of this.gens) if (g.type === type && !g.team) { const d = Math.hypot(g.x - p.x, g.z - p.z); if (d < bd) { bd = d; best = g; } }
    return best;
  }

  // ---------- 方塊 ----------
  cellOccupied(x, y, z) {
    for (const f of this.fighters) {
      if (!f.alive) continue;
      if (f.pos.x - PW < x + 1 && f.pos.x + PW > x && f.pos.y < y + 1 && f.pos.y + PH > y && f.pos.z - PW < z + 1 && f.pos.z + PW > z) return true;
    }
    for (const n of this.npcs) if (n.cell[0] === x && n.cell[2] === z && (y === n.cell[1] || y === n.cell[1] + 1)) return true;
    for (const t of this.tnts) if (Math.floor(t.pos.x) === x && Math.floor(t.pos.y) === y && Math.floor(t.pos.z) === z) return true;
    return false;
  }
  canPlaceAt(x, y, z) {
    if (!this.world.inB(x, y, z) || y >= BUILD_LIMIT) return false;
    if (this.world.get(x, y, z)) return false;
    // 不能蓋在生成器正上方 / 重生點
    for (const g of this.gens) if (Math.floor(g.x) === x && Math.floor(g.z) === z && y <= GROUND + 1 && y >= GROUND) return false;
    return !this.cellOccupied(x, y, z);
  }
  placeBlock(f, x, y, z, item) {
    if (!f.count(item) || !this.canPlaceAt(x, y, z)) return false;
    this.world.set(x, y, z, f.blockIdOf(item), f.team.id + 1);
    f.remove(item, 1);
    this.sfxAt('place', x, y, z);
    return true;
  }
  breakBlock(f, x, y, z) {
    const b = this.world.get(x, y, z);
    if (!b) return;
    const info = BINFO[b];
    if (info.bed >= 0) { this.destroyBed(this.teams[info.bed], f); return; }
    this.world.set(x, y, z, B.AIR, 0);
    this.burst(x + 0.5, y + 0.5, z + 0.5, info.color, 8);
    this.sfxAt('break', x, y, z);
  }
  destroyBed(t, by) {
    if (!t.bedAlive) return;
    t.bedAlive = false;
    for (const c of [t.bedFoot, t.bedHead]) this.world.set(c[0], c[1], c[2], B.AIR, 0);
    this.scene.remove(t.bedMesh);
    this.burst(t.bedCenter.x, t.bedCenter.y, t.bedCenter.z, t.def.color, 24);
    if (by) {
      by.stats.beds++;
      this.ui.feed(`<b>床被破壞！</b> <span style="color:${t.def.css}">${t.name}的床</span> 被 <span style="color:${by.team.def.css}">${by.name}</span> 拆掉了！`);
    }
    if (t === this.player.team) { this.ui.title('床被破壞了！', '你將無法再重生', '#ff5555'); this.sfx.play('bedlost'); }
    else this.sfx.play('bed');
    this.checkTeamElim(t);
  }
  destroyAllBeds() {
    this.ui.title('床自毀！', '所有床都被破壞了，現在是最終決戰', '#ff5555');
    for (const t of this.teams) if (t.bedAlive) this.destroyBed(t, null);
  }
  timeUp() {
    if (this.over) return;
    this.endGame(false, '時間到！平手');
  }
  nextDefenseCell(t) {
    for (const c of t.defense) {
      if (this.world.get(c.x, c.y, c.z)) continue;
      if (!this.world.hasNeighbor(c.x, c.y, c.z)) continue;
      if (this.cellOccupied(c.x, c.y, c.z)) continue;
      return c;
    }
    return null;
  }
  missingDefense(t) {
    let n = 0;
    for (const c of t.defense) if (c.layer === 1 && !this.world.get(c.x, c.y, c.z)) n++;
    return n;
  }

  // ---------- 戰鬥 ----------
  attack(a, t) {
    if (!t.alive || t.team === a.team || t.hurtT > 0) return false;
    let dmg = a.damage();
    if (a.isBot) dmg *= a.P.dmgMul;
    const crit = !a.onGround && a.vel.y < 0;
    if (crit) dmg *= 1.5;
    dmg *= 1 - t.reduction();
    const h = a.held();
    let kb = 5.2;
    if (a.sprint) kb += 2.6;
    if (h && h.id === 'kbstick') kb += 8;
    let dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z;
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    t.vel.x = dx * kb; t.vel.z = dz * kb;
    t.vel.y = t.onGround ? 6.2 : Math.max(t.vel.y, 3.5);
    t.onGround = false;
    a.vel.x *= 0.6; a.vel.z *= 0.6; a.sprint = false;
    if (crit) this.burst(t.pos.x, t.pos.y + 1.2, t.pos.z, 0xffffff, 6);
    this.damage(t, dmg, a, 'melee');
    return true;
  }
  damage(f, amount, src, cause) {
    if (!f.alive || this.over) return;
    if (f.absorb > 0) { const a = Math.min(f.absorb, amount); f.absorb -= a; amount -= a; }
    f.hp -= amount;
    f.hurtT = 0.5; f.lastDmgT = this.time;
    if (src && src !== f) { f.lastAttacker = src; f.lastAttackerT = this.time; }
    if (f === this.player) { this.ui.hurt(); this.sfx.play('hurt'); }
    else this.sfxAt('hit', f.pos.x, f.pos.y, f.pos.z);
    if (f.hp <= 0) {
      const killer = src && src !== f ? src : (f.lastAttacker && this.time - f.lastAttackerT < 10 ? f.lastAttacker : null);
      this.kill(f, killer, cause);
    }
  }
  kill(f, killer, cause) {
    if (!f.alive) return;
    f.alive = false; f.hp = 0; f.stats.deaths++;
    const final = !f.team.bedAlive;
    if (killer && killer.alive !== undefined && killer.team !== f.team) {
      for (const r in f.res) killer.res[r] += f.res[r];
      if (final) killer.stats.finals++; else killer.stats.kills++;
      if (killer === this.player) {
        const got = Object.entries(f.res).filter(([, v]) => v > 0).map(([r, v]) => `<span style="color:${RES_CSS[r]}">+${v} ${RES_NAME[r]}</span>`).join(' ');
        if (got) this.ui.toast(got);
        this.sfx.play('kill');
      }
    }
    for (const r in f.res) f.res[r] = 0;
    const N = x => `<span style="color:${x.team.def.css}">${x.name}</span>`;
    let msg;
    if (cause === 'void') msg = killer ? `${N(f)} 被 ${N(killer)} 打入虛空` : `${N(f)} 掉入了虛空`;
    else if (cause === 'explode') msg = killer ? `${N(f)} 被 ${N(killer)} 炸飛了` : `${N(f)} 被炸飛了`;
    else if (cause === 'fall') msg = killer ? `${N(f)} 被 ${N(killer)} 打下去摔死了` : `${N(f)} 摔死了`;
    else msg = killer ? `${N(f)} 被 ${N(killer)} 擊殺` : `${N(f)} 死了`;
    if (final) msg += ' <b style="color:#5ff">最終擊殺！</b>';
    this.ui.feed(msg);
    this.burst(f.pos.x, f.pos.y + 1, f.pos.z, f.team.def.color, 14);
    if (f.model) f.model.group.visible = false;
    if (final) {
      f.eliminated = true;
      f.hotbar = new Array(9).fill(null);
    } else f.respawnT = 5;
    if (f === this.player) {
      this.breakState = null;
      if (final) { this.ui.title('你被淘汰了！', f.team.members.some(m => !m.eliminated) ? '觀戰中…（WASD 移動、空白/Shift 上下）' : '', '#ff5555'); this.spectator = true; this.spec.pos.set(f.pos.x, Math.max(f.pos.y, GROUND) + 8, f.pos.z); this.spec.yaw = f.yaw; this.spec.pitch = -0.4; }
    }
    this.checkTeamElim(f.team);
  }
  respawn(f) {
    const t = f.team;
    f.alive = true; f.hp = f.maxHp; f.absorb = 0; f.hurtT = 0;
    f.pos.set(t.spawn.x + (Math.random() - 0.5), GROUND + 0.01, t.spawn.z + (Math.random() - 0.5));
    f.vel.set(0, 0, 0); f.fallStart = null; f.slowT = 0;
    f.yaw = Math.atan2(-(CX - t.spawn.x), -(CZ - t.spawn.z)); f.pitch = 0;
    f.resetLoadout(false);
    f.lastAttacker = null;
    if (f.isBot) {
      f.resetBrain(); f.progPos.copy(f.pos);
      f.model.group.visible = true; f.model.heldKey = ''; setModelArmor(f.model, f);
    }
    if (f === this.player) { this.ui.title('', ''); this.sfx.play('respawn'); }
  }
  checkTeamElim(t) {
    if (!t.eliminated && !t.bedAlive && t.members.every(m => m.eliminated)) {
      t.eliminated = true;
      this.ui.feed(`<b style="color:${t.def.css}">${t.name}</b> 已被淘汰！`);
      if (t === this.player.team) { this.endGame(false); return; }
    }
    const left = this.teams.filter(x => !x.eliminated);
    if (left.length === 1 && !this.over) this.endGame(left[0] === this.player.team);
  }
  endGame(win, text) {
    if (this.over) return;
    this.over = true;
    this.sfx.play(win ? 'win' : 'lose');
    setTimeout(() => this.ui.showEnd(win, text, this), this.testMode ? 0 : 1500);
  }
  useGapple(f) {
    if (!f.count('gapple')) return false;
    f.remove('gapple', 1);
    f.hp = Math.min(f.maxHp, f.hp + 6); f.absorb = 4;
    this.sfxAt('eat', f.pos.x, f.pos.y, f.pos.z);
    return true;
  }
  throwProjectile(f, kind) {
    if (!f.count(kind)) return false;
    f.remove(kind, 1);
    const dir = f.lookDir();
    const spd = { fireball: 18, pearl: 24, egg: 20 }[kind];
    const col = ITEMS[kind].color;
    const mesh = new THREE.Mesh(kind === 'fireball' ? new THREE.SphereGeometry(0.3, 8, 6) : new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial({ color: col }));
    const pos = f.eye().addScaledVector(dir, 0.6);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.projectiles.push({ kind, owner: f, pos, vel: dir.multiplyScalar(spd), life: kind === 'egg' ? 1.7 : 6, mesh });
    f.swingT = 0.25;
    this.sfxAt('throw', pos.x, pos.y, pos.z);
    return true;
  }
  placeTNT(f, x, y, z) {
    if (!f.count('tnt') || !this.canPlaceAt(x, y, z)) return false;
    f.remove('tnt', 1);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.98), new THREE.MeshLambertMaterial({ color: 0xd83030, emissive: 0xffffff, emissiveIntensity: 0 }));
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.0), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    mesh.add(band);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.scene.add(mesh);
    this.tnts.push({ pos: mesh.position.clone(), fuse: 3, owner: f, mesh });
    this.sfxAt('fuse', x, y, z);
    return true;
  }
  explode(c, radius, owner, kind) {
    const w = this.world;
    const maxBlast = kind === 'fireball' ? 1 : 2;
    const r = Math.ceil(radius);
    for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) for (let z = -r; z <= r; z++) {
      if (x * x + y * y + z * z > radius * radius) continue;
      const bx = Math.floor(c.x) + x, by = Math.floor(c.y) + y, bz = Math.floor(c.z) + z;
      const b = w.get(bx, by, bz);
      if (!b || !w.isPlaced(bx, by, bz) || BINFO[b].blast > maxBlast) continue;
      w.set(bx, by, bz, B.AIR, 0);
      if (Math.random() < 0.3) this.burst(bx + 0.5, by + 0.5, bz + 0.5, BINFO[b].color, 2);
    }
    const reach = radius + 1.5;
    for (const f of this.fighters) {
      if (!f.alive) continue;
      const fc = new THREE.Vector3(f.pos.x, f.pos.y + 0.9, f.pos.z);
      const d = fc.distanceTo(c);
      if (d > reach) continue;
      const s = 1 - d / reach;
      const dir = fc.sub(c).normalize();
      const kbPow = kind === 'fireball' ? 15 : 18;
      f.vel.x += dir.x * kbPow * s; f.vel.z += dir.z * kbPow * s;
      f.vel.y = Math.max(f.vel.y, 4 + 9 * s); f.onGround = false;
      if (f.team === owner.team && f !== owner) continue;
      let dmg = (kind === 'fireball' ? 4 : 8) * s * (1 - f.reduction() * 0.5);
      if (f === owner) dmg *= 0.25;
      if (dmg > 0.3) {
        f.hurtT = 0;
        this.damage(f, dmg, f === owner ? null : owner, 'explode');
      }
    }
    // 爆炸特效
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.8 }));
    m.position.copy(c); this.scene.add(m);
    this.effects.push({ mesh: m, t: 0, life: 0.4, grow: radius * 1.3 });
    this.burst(c.x, c.y, c.z, 0x555555, 14);
    this.sfxAt('boom', c.x, c.y, c.z);
  }

  // ---------- 粒子與音效 ----------
  burst(x, y, z, color, n) {
    for (let i = 0; i < n; i++) {
      if (this.particles.length > 180) break;
      const m = new THREE.Mesh(this.pGeo || (this.pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12)), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5);
      this.scene.add(m);
      this.particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 5, (Math.random() - 0.5) * 5), life: 0.5 + Math.random() * 0.4 });
    }
  }
  sfxAt(name, x, y, z) {
    const p = this.player.alive ? this.player.pos : this.camera.position;
    const d = Math.hypot(x - p.x, y - p.y, z - p.z);
    if (d < 28) this.sfx.play(name, 1 - d / 28);
  }

  // ---------- 玩家操作 ----------
  playerTarget() {
    const p = this.player;
    const eye = p.eye(), dir = p.lookDir();
    const blockHit = this.world.raycast(eye, dir, 5);
    let ent = null, entD = 3.2;
    for (const f of this.fighters) {
      if (f === p || !f.alive) continue;
      const t = rayAABB(eye, dir, { x: f.pos.x - 0.4, y: f.pos.y, z: f.pos.z - 0.4 }, { x: f.pos.x + 0.4, y: f.pos.y + PH + 0.1, z: f.pos.z + 0.4 });
      if (t != null && t < entD && (!blockHit || t < blockHit.dist)) { ent = f; entD = t; }
    }
    let npc = null;
    for (const n of this.npcs) {
      const t = rayAABB(eye, dir, { x: n.pos.x - 0.45, y: n.pos.y, z: n.pos.z - 0.45 }, { x: n.pos.x + 0.45, y: n.pos.y + 2, z: n.pos.z + 0.45 });
      if (t != null && t < 4.5 && (!blockHit || t < blockHit.dist)) npc = n;
    }
    return { block: blockHit, ent, npc, eye, dir };
  }
  onMouseDown(btn) {
    const p = this.player;
    if (!p.alive || this.over) return;
    if (btn === 0) {
      this.input.mouseL = true;
      p.swingT = 0.25;
      const tg = this.playerTarget();
      if (tg.ent) { this.attack(p, tg.ent); this.breakState = null; }
    } else if (btn === 2) {
      this.input.mouseR = true;
      this.useItem(true);
      this.placeRepeat = 0.25;
    }
  }
  onMouseUp(btn) {
    if (btn === 0) { this.input.mouseL = false; this.breakState = null; }
    if (btn === 2) this.input.mouseR = false;
  }
  useItem(fresh) {
    const p = this.player;
    const tg = this.playerTarget();
    if (fresh && tg.npc && tg.npc.team === p.team) { this.ui.openShop(tg.npc.kind); return; }
    const h = p.held();
    if (!h) return;
    if (ITEMS[h.id].block) {
      const b = tg.block;
      let placed = false;
      // 邊跑邊往下看地板時，也優先往前搭橋（不會在自己面前蓋牆）
      const moving = Math.hypot(p.vel.x, p.vel.z) > 1.5;
      const floorTop = b && b.ny === 1 && b.y === Math.floor((p.onGround ? p.pos.y : (p.lastGroundY || p.pos.y)) - 0.01);
      if (moving && floorTop) { const c = this.assistCell(p); if (c && this.placeBlock(p, c.x, c.y, c.z, h.id)) p.swingT = 0.2; return; }
      if (b) placed = this.placeBlock(p, b.x + b.nx, b.y + b.ny, b.z + b.nz, h.id);
      // 基岩版放置：對著空中按，自動放到前方腳下
      if (!placed && (!b || p.pitch > -1.2)) {
        const c = this.assistCell(p);
        if (c) placed = this.placeBlock(p, c.x, c.y, c.z, h.id);
      }
      if (placed) p.swingT = 0.2;
      return;
    }
    if (!fresh || this.useCd > 0) return;
    if (h.id === 'fireball' || h.id === 'pearl' || h.id === 'egg') { this.throwProjectile(p, h.id); this.useCd = 0.5; }
    else if (h.id === 'tnt' && tg.block) { const b = tg.block; this.placeTNT(p, b.x + b.nx, b.y + b.ny, b.z + b.nz); this.useCd = 0.3; }
    else if (h.id === 'gapple') { this.useGapple(p); this.useCd = 0.8; }
  }
  // 基岩版搭橋輔助：找出前方腳下第一個可以放的空格
  assistCell(p) {
    const h = p.held();
    if (!p.alive || !h || !ITEMS[h.id].block) return null;
    const w = this.world;
    const baseY = p.onGround || p.lastGroundY == null ? p.pos.y : p.lastGroundY;
    if (p.pos.y < baseY - 1.3) return null;
    const fy = Math.floor(baseY - 0.01);
    const dx = -Math.sin(p.yaw), dz = -Math.cos(p.yaw);
    let px = Math.floor(p.pos.x), pz = Math.floor(p.pos.z);
    for (let s = 0; s <= 3.5; s += 0.2) {
      const cx = Math.floor(p.pos.x + dx * s), cz = Math.floor(p.pos.z + dz * s);
      if (cx === px && cz === pz && w.get(cx, fy, cz)) continue;
      if (w.get(cx, fy, cz)) { px = cx; pz = cz; continue; }
      if (w.hasNeighbor(cx, fy, cz) && this.canPlaceAt(cx, fy, cz)) return { x: cx, y: fy, z: cz };
      // 斜著走時先補中間那格
      for (const [ix, iz] of [[cx, pz], [px, cz]]) {
        if (!w.get(ix, fy, iz) && w.hasNeighbor(ix, fy, iz) && this.canPlaceAt(ix, fy, iz)) return { x: ix, y: fy, z: iz };
      }
      return null;
    }
    return null;
  }
  interact() {
    const p = this.player;
    for (const n of this.npcs) {
      if (n.team === p.team && Math.hypot(n.pos.x - p.pos.x, n.pos.z - p.pos.z) < 3.5) { this.ui.openShop(n.kind); return true; }
    }
    return false;
  }
  cycleMateCmd() {
    const mate = this.player.team.members.find(m => m !== this.player);
    if (!mate || mate.eliminated) return;
    const order = ['defend', 'follow', 'attack'];
    mate.cmd = order[(order.indexOf(mate.cmd) + 1) % 3];
    if (mate.cmd === 'attack') mate.attackAt = 0;
    mate.aggro = null; mate.breaking = null;
    mate.decide();
    const label = { defend: '防守基地', follow: '跟隨你', attack: '進攻敵床' }[mate.cmd];
    this.ui.toast(`隊友 ${mate.name}：<b>${label}</b>`);
  }

  updatePlayer(dt) {
    const p = this.player, k = this.input.keys;
    if (!p.alive) return;
    let fx = 0, fz = 0;
    let fw = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), st = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    const tm = this.touchMove;
    if (tm && (tm.x || tm.y)) { fw = -tm.y; st = tm.x; }
    const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    fx = -sy * fw + cy * st; fz = -cy * fw - sy * st;
    p.sneak = !!(k.ShiftLeft || k.ShiftRight || this.touchSneak);
    p.sprint = fw > 0.7 && !p.sneak && p.hp > 3;
    this.applyControl(p, fx, fz, !!(k.Space || this.touchJump), dt);
    // 挖方塊
    this.useCd -= dt;
    const tg = this.playerTarget();
    this.curTarget = tg;
    if (this.input.mouseL && !tg.ent) {
      const b = tg.block;
      if (b) {
        const bs = this.breakState;
        if (!bs || bs.x !== b.x || bs.y !== b.y || bs.z !== b.z) {
          const info = BINFO[b.type];
          let ok = this.world.isPlaced(b.x, b.y, b.z) || info.bed >= 0;
          if (info.bed === p.team.id) { ok = false; if (!this.ownBedWarn || this.time - this.ownBedWarn > 2) { this.ui.toast('你不能破壞自己的床！'); this.ownBedWarn = this.time; } }
          this.breakState = ok ? { x: b.x, y: b.y, z: b.z, t: 0, need: breakTime(b.type, p) } : null;
        }
        if (this.breakState) {
          this.breakState.t += dt;
          if (Math.random() < dt * 5) p.swingT = 0.25;
          if (this.breakState.t >= this.breakState.need) { this.breakBlock(p, b.x, b.y, b.z); this.breakState = null; }
        }
      } else this.breakState = null;
    }
    // 長按右鍵連續放方塊
    if (this.input.mouseR) {
      this.placeRepeat -= dt;
      const h = p.held();
      if (this.placeRepeat <= 0 && h && ITEMS[h.id].block) { this.useItem(false); this.placeRepeat = 0.12; }
    }
  }

  applyControl(f, wx, wz, jump, dt) {
    let speed = f.sneak ? (f.isBot ? f.P.sneakSpeed : 1.4) : (f.sprint ? 5.6 : 4.3);
    if (f.isBot) speed *= f.P.speed;
    if (f.slowT > 0) speed *= 0.55;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
    const acc = f.onGround ? 12 : 2.2;
    const k = Math.min(1, acc * dt);
    if (f.onGround || l > 0.01) {
      f.vel.x += (wx * speed - f.vel.x) * k;
      f.vel.z += (wz * speed - f.vel.z) * k;
    }
    if (jump && f.onGround) { f.vel.y = 9; f.onGround = false; }
    f.vel.y = Math.max(-55, f.vel.y - 32 * dt);
  }

  // ---------- 主更新 ----------
  update(dt) {
    if (this.over && !this.testMode) { this.updateEffects(dt); return; }
    this.time += dt;
    while (this.eventIdx < EVENTS.length && this.time >= EVENTS[this.eventIdx].t) {
      const ev = EVENTS[this.eventIdx++]; ev.fn(this);
    }
    this.updatePlayer(dt);
    for (const f of this.fighters) {
      if (!f.alive) {
        if (!f.eliminated) { f.respawnT -= dt; if (f.respawnT <= 0) this.respawn(f); }
        continue;
      }
      if (f.isBot) {
        f.think(dt);
        f.sneak = f.wantSneak; f.sprint = f.wantSprint && !f.wantSneak;
        this.applyControl(f, f.wish.x, f.wish.z, f.wantJump, dt);
      }
      this.physics(f, dt);
    }
    this.updateGens(dt);
    this.updateProjectiles(dt);
    this.updateTNT(dt);
    this.updateBases(dt);
    this.updateEffects(dt);
  }
  physics(f, dt) {
    const wasGround = f.onGround;
    moveEntity(this.world, f, dt);
    if (f.onGround) f.lastGroundY = f.pos.y;
    if (!f.onGround) {
      if (f.fallStart == null || f.pos.y > f.fallStart) f.fallStart = f.pos.y;
    } else {
      if (!wasGround && f.fallStart != null) {
        const d = f.fallStart - f.pos.y;
        if (d > 3.5) this.damage(f, Math.floor(d - 3), null, 'fall');
      }
      f.fallStart = null;
    }
    if (f.vel.y > 0) f.fallStart = null;
    if (f.pos.y < VOID_Y && f.alive) {
      const killer = f.lastAttacker && this.time - f.lastAttackerT < 10 ? f.lastAttacker : null;
      this.kill(f, killer, 'void');
      return;
    }
    if (f.hurtT > 0) f.hurtT -= dt;
    if (f.slowT > 0) f.slowT -= dt;
    if (f.swingT > 0) f.swingT -= dt;
    // 自然回血
    if (this.time - f.lastDmgT > 3 && f.hp < f.maxHp) {
      f.regenT += dt;
      if (f.regenT > 1.3) { f.regenT = 0; f.hp = Math.min(f.maxHp, f.hp + 1); }
    }
  }
  updateGens(dt) {
    for (const g of this.gens) {
      g.timer -= dt;
      if (g.timer <= 0) { g.timer += g.interval; if (g.count < g.cap) g.count++; }
      if (g.count > 0) {
        for (const f of this.fighters) {
          if (!f.alive) continue;
          if (Math.hypot(f.pos.x - g.x, f.pos.z - g.z) < 1.6 && Math.abs(f.pos.y - g.y) < 1.6) {
            f.res[g.type] += g.count;
            if (f === this.player) { this.sfx.play('pickup'); }
            g.count = 0; break;
          }
        }
      }
      g.item.visible = g.count > 0;
      g.item.rotation.y += dt * 2;
      g.item.position.y = g.y + 0.5 + Math.sin(this.time * 3) * 0.08 + (g.type === 'emerald' && g.team ? 0.4 : 0);
      if (g.big) {
        g.big.rotation.y += dt * 1.5;
        g.label.userData.set([{ t: `${RES_NAME[g.type]} ${ROMAN[g.tier]}`, c: RES_CSS[g.type] }, { t: `${Math.ceil(g.timer)} 秒  (${g.count})` }]);
      }
    }
  }
  updateProjectiles(dt) {
    const w = this.world;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      if (pr.kind === 'pearl') pr.vel.y -= 22 * dt;
      if (pr.kind === 'egg') pr.vel.y -= 4 * dt;
      const step = pr.vel.clone().multiplyScalar(dt);
      const len = step.length();
      const dir = step.clone().divideScalar(len || 1);
      const hit = w.raycast(pr.pos, dir, len);
      let hitEnt = null;
      for (const f of this.fighters) {
        if (!f.alive || f === pr.owner || f.team === pr.owner.team) continue;
        const t = rayAABB(pr.pos, dir, { x: f.pos.x - 0.45, y: f.pos.y, z: f.pos.z - 0.45 }, { x: f.pos.x + 0.45, y: f.pos.y + PH, z: f.pos.z + 0.45 });
        if (t != null && t <= len && (!hit || t < hit.dist)) hitEnt = f;
      }
      let done = pr.life <= 0 || pr.pos.y < 0;
      if (hit || hitEnt) {
        const at = hitEnt ? pr.pos.clone().addScaledVector(dir, Math.min(len, hitEnt.pos.distanceTo(pr.pos))) : pr.pos.clone().addScaledVector(dir, Math.max(0, hit.dist - 0.05));
        if (pr.kind === 'fireball') this.explode(at, 2.6, pr.owner, 'fireball');
        else if (pr.kind === 'pearl' && pr.owner.alive) {
          const o = pr.owner;
          let ty = hit && hit.ny === 1 ? hit.y + 1 : Math.floor(at.y);
          o.pos.set(at.x, ty, at.z);
          // 往外推出方塊
          for (let k = 0; k < 4 && boxHits(w, o.pos.x, o.pos.y, o.pos.z, PH); k++) o.pos.y += 1;
          o.vel.set(0, 0, 0); o.fallStart = null;
          this.damage(o, 2, null, 'fall');
          this.sfxAt('pearl', o.pos.x, o.pos.y, o.pos.z);
        }
        done = true;
      } else pr.pos.add(step);
      if (pr.kind === 'egg' && !done) {
        const bx = Math.floor(pr.pos.x), by = Math.floor(pr.pos.y) - 2, bz = Math.floor(pr.pos.z);
        if (pr.owner.eye().distanceTo(pr.pos) > 2 && this.canPlaceAt(bx, by, bz)) {
          this.world.set(bx, by, bz, B.WOOL + pr.owner.team.id, pr.owner.team.id + 1);
          this.sfxAt('place', bx, by, bz);
        }
      }
      pr.mesh.position.copy(pr.pos);
      if (pr.kind === 'fireball' && Math.random() < 0.5) this.burst(pr.pos.x, pr.pos.y, pr.pos.z, 0xff9a30, 1);
      if (done) { this.scene.remove(pr.mesh); this.projectiles.splice(i, 1); }
    }
  }
  updateTNT(dt) {
    for (let i = this.tnts.length - 1; i >= 0; i--) {
      const t = this.tnts[i];
      t.fuse -= dt;
      t.mesh.material.emissiveIntensity = Math.sin(this.time * 18) > 0 ? 0.6 : 0;
      if (t.fuse <= 0) {
        this.scene.remove(t.mesh); this.tnts.splice(i, 1);
        this.explode(t.pos, 3.6, t.owner, 'tnt');
      }
    }
  }
  updateBases(dt) {
    this.baseT = (this.baseT || 0) + dt;
    const tick = this.baseT > 1.5;
    if (tick) this.baseT = 0;
    for (const t of this.teams) {
      if (tick && t.up.heal) {
        for (const m of t.members) if (m.alive && m.hp < m.maxHp && Math.hypot(m.pos.x - t.spawn.x, m.pos.z - t.spawn.z) < 14) m.hp = Math.min(m.maxHp, m.hp + 1);
      }
      if (t.up.trap) {
        for (const f of this.fighters) {
          if (!f.alive || f.team === t) continue;
          if (Math.hypot(f.pos.x - t.bedCenter.x, f.pos.z - t.bedCenter.z) < 9 && Math.abs(f.pos.y - GROUND) < 6) {
            t.up.trap = 0; f.slowT = 8;
            if (t === this.player.team) { this.ui.title('', '⚠ 陷阱觸發！有敵人入侵基地！', '#ff5555'); this.sfx.play('alarm'); }
            if (f === this.player) this.ui.toast('你觸發了敵人的陷阱！被緩速了');
            for (const m of t.members) if (m.isBot && m.alive) m.aggro = f;
            break;
          }
        }
      }
    }
  }
  updateEffects(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt; p.v.y -= 18 * dt;
      p.m.position.addScaledVector(p.v, dt);
      if (p.life <= 0) { this.scene.remove(p.m); p.m.material.dispose(); this.particles.splice(i, 1); }
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.t += dt;
      const s = 0.3 + e.grow * (e.t / e.life);
      e.mesh.scale.setScalar(s);
      e.mesh.material.opacity = 0.8 * (1 - e.t / e.life);
      if (e.t >= e.life) { this.scene.remove(e.mesh); this.effects.splice(i, 1); }
    }
  }

  // ---------- 繪圖 ----------
  render(dt) {
    const p = this.player, cam = this.camera;
    if (this.spectator) {
      const k = this.input.keys, s = this.spec;
      let fw = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), st = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
      const tm = this.touchMove;
      if (tm && (tm.x || tm.y)) { fw = -tm.y; st = tm.x; }
      const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw), sp = 12 * dt;
      s.pos.x += (-sy * fw + cy * st) * sp; s.pos.z += (-cy * fw - sy * st) * sp;
      s.pos.y += ((k.Space || this.touchJump ? 1 : 0) - (k.ShiftLeft || this.touchSneak ? 1 : 0)) * sp;
      cam.position.copy(s.pos); cam.rotation.set(s.pitch, s.yaw, 0);
      this.vm.visible = false;
    } else if (p.alive) {
      cam.position.set(p.pos.x, p.pos.y + p.eyeH, p.pos.z);
      cam.rotation.set(p.pitch, p.yaw, p.hurtT > 0.3 ? (p.hurtT - 0.3) * 0.3 : 0);
      this.vm.visible = true;
      const tf = p.sprint ? 82 : 75;
      cam.fov += (tf - cam.fov) * Math.min(1, dt * 8); cam.updateProjectionMatrix();
    } else {
      const t = p.team.spawn;
      cam.position.set(t.x, GROUND + 12, t.z + 0.01);
      cam.lookAt(t.x, GROUND, t.z);
      this.vm.visible = false;
    }
    // 手持物品
    const h = p.held();
    const key = h ? h.id + (h.id === 'sword' ? p.sword : h.id === 'pick' ? p.pick : h.id === 'axe' ? p.axe : '') : 'none';
    if (key !== this.vmKey) {
      this.vmKey = key;
      while (this.vmItem.children.length) this.vmItem.remove(this.vmItem.children[0]);
      if (h) {
        const m = makeItemMesh(h.id, p);
        m.traverse(o => { if (o.material) o.material = new THREE.MeshBasicMaterial({ color: o.material.color.clone().multiplyScalar(0.95) }); });
        m.scale.setScalar(0.6);
        if (ITEMS[h.id].block) m.position.set(0, 0.05, -0.05);
        else { m.rotation.set(-0.4, 0.35, -0.2); m.position.set(0.02, -0.1, -0.05); }
        this.vmItem.add(m);
      }
      this.vmArm.visible = !h;
    }
    const sw = p.swingT > 0 ? Math.sin((p.swingT / 0.25) * Math.PI) : 0;
    const bob = p.onGround ? Math.sin(this.time * (p.sprint ? 13 : 9)) * Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 5) : 0;
    this.vm.position.set(0.42 - sw * 0.15, -0.4 + bob * 0.02 + sw * 0.05, -0.62 - sw * 0.1);
    this.vm.rotation.set(-sw * 0.9, sw * 0.3, 0);
    // 方塊選取框
    const tg = this.curTarget;
    if (p.alive && tg && tg.block && !tg.ent) {
      this.hl.visible = true;
      const b = tg.block;
      const hh = BINFO[b.type].h;
      this.hl.scale.set(1, hh, 1);
      this.hl.position.set(b.x + 0.5, b.y + hh / 2, b.z + 0.5);
    } else this.hl.visible = false;
    // 基岩版放置預覽
    const floorLook = tg && tg.block && tg.block.ny === 1 && Math.hypot(p.vel.x, p.vel.z) > 1.5;
    const ac = p.alive && tg && !tg.ent && (!tg.block || floorLook) ? this.assistCell(p) : null;
    if (ac) {
      if (!this.ghost) {
        this.ghost = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
        this.ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.ghost.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })));
        this.scene.add(this.ghost);
      }
      this.ghost.visible = true;
      this.ghost.position.set(ac.x + 0.5, ac.y + 0.5, ac.z + 0.5);
    } else if (this.ghost) this.ghost.visible = false;
    // 角色模型
    for (const f of this.fighters) {
      if (!f.model || !f.alive) continue;
      const m = f.model;
      m.group.position.copy(f.pos);
      m.group.rotation.y = f.yaw;
      const spd = Math.hypot(f.vel.x, f.vel.z);
      f.walkPhase += spd * dt * 2.2;
      const sw2 = Math.sin(f.walkPhase) * Math.min(1, spd / 4) * 0.8;
      m.legL.rotation.x = sw2; m.legR.rotation.x = -sw2;
      m.armL.rotation.x = -sw2 * 0.8;
      const swing = f.swingT > 0 ? Math.sin((f.swingT / 0.25) * Math.PI) * 1.4 : 0;
      m.armR.rotation.x = sw2 * 0.8 - swing - 0.25;
      m.head.rotation.x = f.pitch;
      m.body.rotation.x = f.sneak ? 0.35 : 0;
      m.group.position.y = f.pos.y - (f.sneak ? 0.12 : 0);
      const hurt = f.hurtT > 0.25;
      for (const mat of m.mats) { mat.emissive.setHex(hurt ? 0xff0000 : 0x000000); mat.emissiveIntensity = hurt ? 0.6 : 0; }
      updateModelHeld(m, f);
      const hpR = Math.ceil(f.hp);
      if (m.lastHp !== hpR) { m.lastHp = hpR; m.tag.userData.draw(hpR); }
    }
    this.mesher.update();
    this.renderer.render(this.scene, cam);
  }

  // 測試用：快轉模擬
  simulate(sec) {
    const n = Math.round(sec * 30);
    for (let i = 0; i < n; i++) { this.update(1 / 30); if (i % 30 === 0) this.mesher.update(); }
    this.mesher.update();
  }
}
