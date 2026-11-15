'use strict';
// ===================== 商店與升級資料 =====================
const RES_NAME = { iron: '鐵', gold: '金', diamond: '鑽石', emerald: '綠寶石' };
const RES_CSS = { iron: '#e8e8e8', gold: '#ffd84a', diamond: '#5ff0ea', emerald: '#4dff7a' };
const TOOL_COST = [null, [10, 'iron'], [10, 'iron'], [3, 'gold'], [6, 'gold']];

const SHOP = [
  { cat: '方塊', items: [
    { key: 'wool', name: '羊毛 ×16', cost: [4, 'iron'], desc: '最便宜的搭橋方塊', icon: 'wool' },
    { key: 'plank', name: '木板 ×16', cost: [4, 'gold'], desc: '用斧頭比較好挖', icon: 'plank' },
    { key: 'endstone', name: '終界石 ×12', cost: [24, 'iron'], desc: '防床好選擇，火球炸不掉', icon: 'endstone' },
    { key: 'glass', name: '防爆玻璃 ×4', cost: [12, 'iron'], desc: '任何爆炸都炸不掉', icon: 'glass' },
    { key: 'obsidian', name: '黑曜石 ×4', cost: [4, 'emerald'], desc: '超硬，爆炸也炸不掉', icon: 'obsidian' },
  ] },
  { cat: '近戰', items: [
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
    { key: 'pick', name: '鎬子', desc: '挖終界石、黑曜石；死亡降一級', icon: 'pick' },
    { key: 'axe', name: '斧頭', desc: '挖木板；死亡降一級', icon: 'axe' },
    { key: 'shears', name: '剪刀', cost: [20, 'iron'], desc: '永久，挖羊毛快 4 倍', icon: 'shears' },
  ] },
  { cat: '遠程', items: [
    { key: 'rod', name: '魚竿', cost: [10, 'iron'], desc: '勾住敵人或 TNT，再按一次拉過來', icon: 'rod' },
    { key: 'bow', name: '弓', cost: [12, 'gold'], desc: '按住蓄力，放開射箭', icon: 'bow' },
    { key: 'arrow', name: '箭 ×8', cost: [2, 'gold'], desc: '弓要用的箭', icon: 'arrow' },
    { key: 'snowball', name: '雪球 ×4', cost: [6, 'iron'], desc: '沒傷害，但能把人打下橋', icon: 'snowball' },
    { key: 'fireball', name: '火球', cost: [40, 'iron'], desc: '會爆炸擊退，炸掉羊毛', icon: 'fireball' },
  ] },
  { cat: '道具', items: [
    { key: 'tnt', name: 'TNT', cost: [4, 'gold'], desc: '放置 3 秒後爆炸', icon: 'tnt' },
    { key: 'pearl', name: '終界珍珠', cost: [4, 'emerald'], desc: '丟出去瞬間傳送', icon: 'pearl' },
    { key: 'egg', name: '搭橋蛋', cost: [1, 'emerald'], desc: '飛過的地方自動鋪羊毛', icon: 'egg' },
    { key: 'platform', name: '救援平台', cost: [1, 'emerald'], desc: '掉下去時用，腳下出現彈跳平台', icon: 'platform' },
    { key: 'gapple', name: '金蘋果', cost: [3, 'gold'], desc: '立即回血＋吸收護盾', icon: 'gapple' },
  ] },
  { cat: '藥水', items: [
    { key: 'pot_speed', name: '速度藥水', cost: [1, 'emerald'], desc: '45 秒跑更快', icon: 'pot_speed' },
    { key: 'pot_jump', name: '跳躍藥水', cost: [1, 'emerald'], desc: '45 秒跳更高、摔落傷害降低', icon: 'pot_jump' },
    { key: 'pot_invis', name: '隱身藥水', cost: [2, 'emerald'], desc: '30 秒隱形（名字也看不到）', icon: 'pot_invis' },
  ] },
];
const SHOP_GIVE = { wool: 16, plank: 16, endstone: 12, glass: 4, obsidian: 4, kbstick: 1, rod: 1, bow: 1, arrow: 8, snowball: 4, fireball: 1, tnt: 1, pearl: 1, egg: 1, platform: 1, gapple: 1, pot_speed: 1, pot_jump: 1, pot_invis: 1 };
const SHOP_ONCE = ['kbstick', 'rod', 'bow'];
const POTION = { pot_speed: ['speed', 45, '速度'], pot_jump: ['jump', 45, '跳躍'], pot_invis: ['invis', 30, '隱身'] };
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
const PROJ = {
  fireball: { spd: 18, grav: 0, life: 6 }, pearl: { spd: 24, grav: 22, life: 6 }, egg: { spd: 20, grav: 4, life: 1.7 },
  snowball: { spd: 24, grav: 14, life: 4 }, arrow: { spd: 30, grav: 16, life: 6 }, bobber: { spd: 20, grav: 18, life: 14 },
};

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

function soloRoster(name) {
  const r = [];
  for (let t = 0; t < 4; t++) {
    if (t === 0) { r.push({ id: 'me', team: 0, kind: 'human', name }); r.push({ team: 0, kind: 'bot', role: 'defend' }); }
    else { r.push({ team: t, kind: 'bot', role: 'attack' }); r.push({ team: t, kind: 'bot', role: 'defend' }); }
  }
  const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
  let ni = 0;
  r.forEach((e, i) => { if (e.kind === 'bot') e.name = names[ni++]; e.variant = i * 3 + 1; });
  return r;
}

// ===================== 遊戲主體 =====================
class Game {
  constructor(renderer, opts) {
    this.renderer = renderer;
    this.difficulty = opts.difficulty || 'normal';
    this.testMode = !!opts.testMode;
    this.mode = opts.mode || 'solo';        // 'solo' | 'host' | 'client'
    this.net = opts.net || null;
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
    this.buildSky();

    this.world = new World();
    this.layout = buildMap(this.world);
    this.mesher = new WorldMesher(this.world, this.scene);
    this.blkOut = []; this.fxOut = [];
    this.world.onChange = (x, y, z, v, pb) => {
      this.mesher.mark(x, y, z);
      if (this.mode === 'host' && !this.applyingNet) this.blkOut.push([x, y, z, v, pb]);
    };
    this.nextId = 1;
    this.projectiles = []; this.tnts = []; this.particles = []; this.effects = []; this.platforms = [];
    this.buildTeams();
    this.buildGens();
    this.buildNPCs();
    this.buildFighters(opts.roster || soloRoster(opts.playerName || '玩家'), opts.localId || 'me');
    this.buildViewmodel();
    this.buildHighlight();
    this.mesher.update();
    this.input = { keys: {}, mouseL: false, mouseR: false };
    this.breakState = null; this.placeRepeat = 0; this.useCd = 0;
    this.eventIdx = 0;
    this.spectator = false;
    this.spec = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 };
    this.netT = 0; this.meT = 0; this.inT = 0; this.tpSeq = 0;
  }
  get authority() { return this.mode !== 'client'; }

  // ---------- 建立 ----------
  buildSky() {
    // 雲
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
    const rng = mulberry32(55);
    for (let i = 0; i < 26; i++) {
      const g = new THREE.Group();
      const n = 2 + Math.floor(rng() * 4);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(6 + rng() * 10, 1.5, 5 + rng() * 8), cloudMat);
        m.position.set(k * 5 + rng() * 3, 0, rng() * 6);
        g.add(m);
      }
      g.position.set(-80 + rng() * 290, 58 + rng() * 6, -80 + rng() * 290);
      this.scene.add(g);
    }
  }
  buildTeams() {
    this.teams = this.layout.teams.map((L, i) => {
      const t = Object.assign({}, L);
      t.def = TEAM_DEFS[i]; t.name = TEAM_DEFS[i].name;
      t.bedAlive = true; t.eliminated = false; t.defenseDone = false;
      t.up = { sharp: 0, prot: 0, forge: 0, heal: 0, trap: 0 };
      t.members = [];
      t.bedCenter = new THREE.Vector3((L.bedFoot[0] + L.bedHead[0]) / 2 + 0.5, GROUND + 0.3, (L.bedFoot[2] + L.bedHead[2]) / 2 + 0.5);
      t.defense = this.computeDefense(t);
      const sx = Math.abs(L.bedHead[0] - L.bedFoot[0]) + 1, sz = Math.abs(L.bedHead[2] - L.bedFoot[2]) + 1;
      const grp = new THREE.Group();
      const plank = new THREE.MeshLambertMaterial({ map: tileTexture('plank') });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.3, sz), plank); frame.position.y = 0.15;
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), plank);
        leg.position.set(lx * (sx / 2 - 0.09), 0.05, lz * (sz / 2 - 0.09)); grp.add(leg);
      }
      const wool = new THREE.MeshLambertMaterial({ map: tileTexture('wool'), color: t.def.color });
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.98, 0.26, sz * 0.98), wool); blanket.position.y = 0.42;
      const pil = new THREE.Mesh(new THREE.BoxGeometry(sx === 1 ? 0.8 : 0.6, 0.14, sz === 1 ? 0.8 : 0.6), new THREE.MeshLambertMaterial({ map: tileTexture('wool') }));
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
      for (const y of [30, 31, 32]) {
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
      const art = { iron: [230, 230, 230], gold: [250, 210, 60], diamond: [96, 236, 226], emerald: [62, 220, 110] }[type];
      const col = new THREE.Color(art[0] / 255, art[1] / 255, art[2] / 255);
      g.item = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 }));
      g.item.position.set(p.x + (type === 'gold' ? 0.3 : type === 'iron' ? -0.3 : 0), p.y + 0.5, p.z);
      g.item.visible = false;
      this.scene.add(g.item);
      if (!team) {
        const big = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ map: tileTexture(type === 'diamond' ? 'diamond_block' : 'emerald_block'), emissive: col, emissiveIntensity: 0.15 }));
        big.position.set(p.x, p.y + 2.6, p.z); this.scene.add(big); g.big = big;
        g.label = makeTextSprite([{ t: '' }]); g.label.position.set(p.x, p.y + 3.9, p.z); this.scene.add(g.label);
      }
      this.gens.push(g);
      return g;
    };
    for (const t of this.teams) {
      t.genIron = mk('iron', t.gen, t, 1.1, 48);
      t.genGold = mk('gold', t.gen, t, 5.5, 12);
      t.genEmer = mk('emerald', t.gen, t, Infinity, 2);
      t.genEmer.timer = Infinity;
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
        const head = skinBox(0.5, 0.55, 0.5, skinCanvas('head', robe, 9), false, skinCanvas('face', robe, 9), skinCanvas('top', robe, 9)); head.position.y = 1.58;
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
  buildFighters(roster, localId) {
    this.fighters = [];
    roster.forEach((r, i) => {
      const t = this.teams[r.team];
      let f;
      const isLocal = r.kind === 'human' && r.id === localId;
      if (isLocal) { f = new Fighter(this, t, r.name, false); this.player = f; }
      else if (this.mode === 'client') { f = new Fighter(this, t, r.name, false); f.puppet = true; }
      else if (r.kind === 'human') { f = new Fighter(this, t, r.name, false); f.remote = true; f.cid = r.id; }
      else { f = new Bot(this, t, r.name, r.role || 'defend'); }
      f.id = i; f.rid = r.id || null; f.human = r.kind === 'human';
      t.members.push(f); this.fighters.push(f);
      const idx = t.members.length - 1;
      f.pos.set(t.spawn.x + (idx ? 1 : -1) * 0.8, GROUND, t.spawn.z);
      f.yaw = Math.atan2(-(CX - t.spawn.x), -(CZ - t.spawn.z));
      if (!isLocal) {
        f.model = makeHumanoid(t.def.color, f.name, t.def.css, r.variant || i);
        setModelArmor(f.model, f);
        this.scene.add(f.model.group);
      }
      if (f.isBot) f.progPos.copy(f.pos);
      f.netPos = f.pos.clone(); f.netYaw = f.yaw;
    });
    // 有真人的隊伍：電腦隊友聽真人指揮
    for (const t of this.teams) {
      const humans = t.members.filter(m => m.human);
      for (const m of t.members) if (m.isBot && humans.length) { m.cmd = 'defend'; m.leader = humans[0]; m.role = 'defend'; }
    }
    if (!this.player) this.player = this.fighters[0];
  }
  buildViewmodel() {
    this.vm = new THREE.Group();
    this.camera.add(this.vm);
    this.vmKey = '';
    const armTex = skinCanvas('arm', this.player.team.def.color, 1);
    this.vmArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.45), new THREE.MeshBasicMaterial({ map: armTex }));
    this.vmArm.position.set(0.06, -0.1, 0.06); this.vmArm.rotation.set(0.15, -0.25, 0);
    this.vm.add(this.vmArm);
    this.vmItem = new THREE.Group(); this.vm.add(this.vmItem);
  }
  buildHighlight() {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.hl = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }));
    this.hl.visible = false;
    this.scene.add(this.hl);
    // 挖方塊裂痕
    this.crack = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
    this.crack.visible = false; this.scene.add(this.crack);
  }

  // ---------- 通知路由（單機／房主／客戶端共用） ----------
  tell(f, k, ...a) {
    if (!f) return;
    if (f === this.player) { if (k === 'snd') this.sfx.play(a[0]); else this.ui[k](...a); }
    else if (f.remote && this.net) this.net.to(f.cid, { t: 'ui', k, a });
  }
  tellTeam(t, k, ...a) { for (const m of t.members) this.tell(m, k, ...a); }
  feedAll(html) { this.ui.feed(html); if (this.mode === 'host' && this.net) this.net.all({ t: 'ui', k: 'feed', a: [html] }); }
  pushed(f) { // 房主改了遠端玩家的速度 → 傳過去
    if (f.remote && this.net) this.net.to(f.cid, { t: 'kb', v: [+f.vel.x.toFixed(2), +f.vel.y.toFixed(2), +f.vel.z.toFixed(2)] });
  }
  teleport(f) {
    if (f.remote && this.net) { f.tpSeq = (f.tpSeq || 0) + 1; this.net.to(f.cid, { t: 'tp', p: [f.pos.x, f.pos.y, f.pos.z], yw: f.yaw, s: f.tpSeq }); }
  }

  // ---------- 動作（本機玩家 → 單機直接做，客戶端送給房主） ----------
  act(m) {
    if (this.mode === 'client') { this.net.send({ t: 'act', ...m }); this.predict(m); return; }
    this.perform(this.player, m);
  }
  predict(m) {
    const p = this.player;
    if (m.a === 'plc') { this.applyingNet = true; this.world.set(m.x, m.y, m.z, p.blockIdOf(m.it), p.team.id + 1); this.applyingNet = false; p.remove(m.it, 1); this.sfxAt('place', m.x, m.y, m.z); }
    if (m.a === 'brk') { const b = this.world.get(m.x, m.y, m.z); if (b && BINFO[b].bed < 0) { this.world.set(m.x, m.y, m.z, B.AIR, 0); this.burst(m.x + 0.5, m.y + 0.5, m.z + 0.5, BINFO[b].color, 8); } this.sfxAt('break', m.x, m.y, m.z); }
  }
  perform(f, m) {
    if (!f || this.over) return;
    if (!f.alive && m.a !== 'buy' && m.a !== 'upg' && m.a !== 'mate') return;
    const near = (x, y, z, r) => f.eye().distanceTo(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5)) <= r;
    if (m.yw != null) { f.yaw = m.yw; f.pitch = m.pt; }
    switch (m.a) {
      case 'atk': { const t = this.fighters[m.id]; if (t && t.alive && t.pos.distanceTo(f.pos) < (f.remote ? 5.5 : 4.5)) this.attack(f, t); break; }
      case 'brk': {
        const b = this.world.get(m.x, m.y, m.z);
        const ok = b && near(m.x, m.y, m.z, f.remote ? 7 : 5.5) && (this.world.isPlaced(m.x, m.y, m.z) || (BINFO[b].bed >= 0 && BINFO[b].bed !== f.team.id));
        if (ok) this.breakBlock(f, m.x, m.y, m.z); else this.correct(f, m.x, m.y, m.z);
        break;
      }
      case 'plc': {
        const ok = f.count(m.it) && near(m.x, m.y, m.z, f.remote ? 7 : 5.5) && this.world.hasNeighbor(m.x, m.y, m.z) && this.placeBlock(f, m.x, m.y, m.z, m.it);
        if (!ok) this.correct(f, m.x, m.y, m.z);
        break;
      }
      case 'buy': this.buy(f, m.k); break;
      case 'upg': this.buyUpgrade(f, m.k); break;
      case 'throw': if (['fireball', 'pearl', 'egg', 'snowball'].includes(m.k)) this.throwProjectile(f, m.k); break;
      case 'tnt': if (near(m.x, m.y, m.z, 7)) this.placeTNT(f, m.x, m.y, m.z); break;
      case 'gap': this.useGapple(f); break;
      case 'rod': this.useRod(f); break;
      case 'bow': this.shootArrow(f, Math.max(0, Math.min(1, +m.c || 0))); break;
      case 'pot': this.drink(f, m.k); break;
      case 'plat': this.rescuePlatform(f); break;
      case 'mate': this.cycleMateCmd(f); break;
    }
  }
  correct(f, x, y, z) {
    if (f.remote && this.net) this.net.to(f.cid, { t: 'ev', b: [[x, y, z, this.world.get(x, y, z), this.world.placedBy(x, y, z) + 1]], fx: [] });
  }

  // ---------- 商店 ----------
  shopCost(f, key) {
    if (key === 'pick') return f.pick < 4 ? TOOL_COST[f.pick + 1] : null;
    if (key === 'axe') return f.axe < 4 ? TOOL_COST[f.axe + 1] : null;
    for (const c of SHOP) for (const it of c.items) if (it.key === key) return it.cost;
    return null;
  }
  shopState(f, key) {
    const cost = this.shopCost(f, key);
    if (!cost) return 'owned';
    if (key.startsWith('sword') && f.sword >= +key[5]) return 'owned';
    if (key.startsWith('armor') && f.armor >= +key[5]) return 'owned';
    if (key === 'shears' && f.shears) return 'owned';
    if (SHOP_ONCE.includes(key) && f.count(key)) return 'owned';
    if (f.res[cost[1]] < cost[0]) return 'poor';
    return 'ok';
  }
  buy(f, key) {
    if (this.shopState(f, key) !== 'ok') return false;
    const cost = this.shopCost(f, key);
    const pay = () => { f.res[cost[1]] -= cost[0]; };
    const n = SHOP_GIVE[key];
    if (n) {
      if (!f.canAdd(key, n)) { this.tell(f, 'toast', '快捷欄滿了！'); return false; }
      pay(); f.add(key, n);
    } else if (key.startsWith('sword')) { pay(); f.sword = +key[5]; }
    else if (key.startsWith('armor')) { pay(); f.armor = +key[5]; if (f.model) setModelArmor(f.model, f); }
    else if (key === 'pick') { pay(); f.pick++; f.giveTool('pick'); }
    else if (key === 'axe') { pay(); f.axe++; f.giveTool('axe'); }
    else if (key === 'shears') { pay(); f.shears = true; f.giveTool('shears'); }
    this.tell(f, 'snd', 'buy');
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
    const msg = `<span style="color:${f.team.def.css}">${f.name}</span> 購買了 <b>${u.name}${u.max > 1 ? ' ' + ROMAN[f.team.up[key]] : ''}</b>`;
    this.tellTeam(f.team, 'feed', msg);
    this.tellTeam(f.team, 'snd', 'buy');
    return true;
  }
  applyForge(t) {
    const mul = [1, 1.5, 2, 2][t.up.forge];
    t.genIron.interval = 1.1 / mul; t.genGold.interval = 5.5 / mul;
    if (t.up.forge >= 3 && t.genEmer.interval === Infinity) { t.genEmer.interval = 60; t.genEmer.timer = 60; }
  }
  setGenTier(type, tier) {
    for (const g of this.gens) if (g.type === type && !g.team) { g.tier = tier; g.interval = GEN_INTERVAL[type][tier]; g.timer = Math.min(g.timer, g.interval); }
    this.feedAll(`<b style="color:${RES_CSS[type]}">${RES_NAME[type]}生成器</b> 升級到 ${ROMAN[tier]} 級！`);
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
    for (const t of this.tnts) if (Math.floor(t.pos.x) === x && Math.floor(t.pos.y + 0.5) === y && Math.floor(t.pos.z) === z) return true;
    return false;
  }
  canPlaceAt(x, y, z) {
    if (!this.world.inB(x, y, z) || y >= BUILD_LIMIT) return false;
    if (this.world.get(x, y, z)) return false;
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
      this.feedAll(`<b>床被破壞！</b> <span style="color:${t.def.css}">${t.name}的床</span> 被 <span style="color:${by.team.def.css}">${by.name}</span> 拆掉了！`);
    }
    for (const f of this.fighters) {
      if (f.team === t) { this.tell(f, 'title', '床被破壞了！', '你將無法再重生', '#ff5555'); this.tell(f, 'snd', 'bedlost'); }
      else this.tell(f, 'snd', 'bed');
    }
    this.checkTeamElim(t);
  }
  destroyAllBeds() {
    for (const f of this.fighters) this.tell(f, 'title', '床自毀！', '所有床都被破壞了，現在是最終決戰', '#ff5555');
    for (const t of this.teams) if (t.bedAlive) this.destroyBed(t, null);
  }
  timeUp() { if (!this.over) this.endGame(null, '時間到！平手'); }
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
    this.pushed(t);
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
    if (f === this.player || f.remote) { this.tell(f, 'hurt'); this.tell(f, 'snd', 'hurt'); }
    this.sfxAt('hit', f.pos.x, f.pos.y, f.pos.z, f);
    if (f.hp <= 0) {
      const killer = src && src !== f ? src : (f.lastAttacker && this.time - f.lastAttackerT < 10 ? f.lastAttacker : null);
      this.kill(f, killer, cause);
    }
  }
  kill(f, killer, cause) {
    if (!f.alive) return;
    f.alive = false; f.hp = 0; f.stats.deaths++;
    if (f.bobber) this.removeProj(f.bobber);
    const final = !f.team.bedAlive;
    if (killer && killer.team !== f.team) {
      for (const r in f.res) killer.res[r] += f.res[r];
      if (final) killer.stats.finals++; else killer.stats.kills++;
      const got = Object.entries(f.res).filter(([, v]) => v > 0).map(([r, v]) => `<span style="color:${RES_CSS[r]}">+${v} ${RES_NAME[r]}</span>`).join(' ');
      if (got) this.tell(killer, 'toast', got);
      this.tell(killer, 'snd', 'kill');
    }
    for (const r in f.res) f.res[r] = 0;
    const N = x => `<span style="color:${x.team.def.css}">${x.name}</span>`;
    let msg;
    if (cause === 'void') msg = killer ? `${N(f)} 被 ${N(killer)} 打入虛空` : `${N(f)} 掉入了虛空`;
    else if (cause === 'explode') msg = killer ? `${N(f)} 被 ${N(killer)} 炸飛了` : `${N(f)} 被炸飛了`;
    else if (cause === 'fall') msg = killer ? `${N(f)} 被 ${N(killer)} 打下去摔死了` : `${N(f)} 摔死了`;
    else if (cause === 'arrow') msg = `${N(f)} 被 ${killer ? N(killer) : '?'} 射死了`;
    else if (cause === 'left') msg = `${N(f)} 離開了遊戲`;
    else msg = killer ? `${N(f)} 被 ${N(killer)} 擊殺` : `${N(f)} 死了`;
    if (final && cause !== 'left') msg += ' <b style="color:#5ff">最終擊殺！</b>';
    this.feedAll(msg);
    this.burst(f.pos.x, f.pos.y + 1, f.pos.z, f.team.def.color, 14);
    if (f.model) f.model.group.visible = false;
    if (final || cause === 'left') { f.eliminated = true; f.hotbar = new Array(9).fill(null); }
    else f.respawnT = 5;
    if (f === this.player) this.onLocalDeath(final);
    else if (f.remote && final) this.tell(f, 'title', '你被淘汰了！', '觀戰中…（WASD 移動、空白/Shift 上下）', '#ff5555');
    this.checkTeamElim(f.team);
  }
  onLocalDeath(final) {
    this.breakState = null;
    const f = this.player;
    if (final) {
      this.ui.title('你被淘汰了！', '觀戰中…（WASD 移動、空白/Shift 上下）', '#ff5555');
      this.spectator = true;
      this.spec.pos.set(f.pos.x, Math.max(f.pos.y, GROUND) + 8, f.pos.z); this.spec.yaw = f.yaw; this.spec.pitch = -0.4;
    }
  }
  respawn(f) {
    const t = f.team;
    f.alive = true; f.hp = f.maxHp; f.absorb = 0; f.hurtT = 0;
    f.pos.set(t.spawn.x + (Math.random() - 0.5), GROUND + 0.01, t.spawn.z + (Math.random() - 0.5));
    f.vel.set(0, 0, 0); f.fallStart = null; f.slowT = 0;
    f.yaw = Math.atan2(-(CX - t.spawn.x), -(CZ - t.spawn.z)); f.pitch = 0;
    f.resetLoadout(false);
    f.lastAttacker = null;
    if (f.isBot) { f.resetBrain(); f.progPos.copy(f.pos); }
    if (f.model) { f.model.group.visible = true; f.model.heldKey = ''; setModelArmor(f.model, f); }
    this.teleport(f);
    this.tell(f, 'title', '', '');
    this.tell(f, 'snd', 'respawn');
  }
  checkTeamElim(t) {
    if (!t.eliminated && !t.bedAlive && t.members.every(m => m.eliminated)) {
      t.eliminated = true;
      this.feedAll(`<b style="color:${t.def.css}">${t.name}</b> 已被淘汰！`);
    }
    if (this.over) return;
    const left = this.teams.filter(x => !x.eliminated);
    if (left.length <= 1) { this.endGame(left[0] || null); return; }
    // 單機：自己的隊伍被淘汰就直接結束
    if (this.mode === 'solo' && this.player.team.eliminated) this.endGame(null);
  }
  endGame(winTeam, text) {
    if (this.over) return;
    this.over = true;
    if (this.mode === 'host' && this.net) {
      this.net.all({ t: 'end', w: winTeam ? winTeam.id : -1, text: text || '', st: this.fighters.map(f => [f.stats.kills, f.stats.finals, f.stats.beds, f.stats.deaths]) });
    }
    this.showEnd(winTeam ? winTeam.id : -1, text);
  }
  showEnd(w, text) {
    const win = w === this.player.team.id;
    this.sfx.play(win ? 'win' : 'lose');
    const winner = w >= 0 ? this.teams[w] : null;
    const t = text || (win ? '勝利！' : winner ? `${winner.name}獲勝` : '遊戲結束');
    setTimeout(() => this.ui.showEnd(win, t, this), this.testMode ? 0 : 1500);
  }

  // ---------- 道具 ----------
  useGapple(f) {
    if (!f.count('gapple')) return false;
    f.remove('gapple', 1);
    f.hp = Math.min(f.maxHp, f.hp + 6); f.absorb = 4;
    this.sfxAt('eat', f.pos.x, f.pos.y, f.pos.z);
    return true;
  }
  drink(f, k) {
    if (!POTION[k] || !f.count(k)) return false;
    f.remove(k, 1);
    const [fx, dur, name] = POTION[k];
    f.fx[fx] = dur;
    this.tell(f, 'toast', `你喝了<b>${name}藥水</b>（${dur} 秒）`);
    this.sfxAt('eat', f.pos.x, f.pos.y, f.pos.z);
    return true;
  }
  rescuePlatform(f) {
    if (!f.count('platform')) return false;
    f.remove('platform', 1);
    const cx = Math.floor(f.pos.x), cz = Math.floor(f.pos.z);
    const y = Math.max(6, Math.floor(f.pos.y) - (f.onGround ? 1 : 2));
    const cells = [];
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      if (Math.abs(a) === 2 && Math.abs(b) === 2) continue;
      if (!this.world.get(cx + a, y, cz + b)) { this.world.set(cx + a, y, cz + b, B.SLIME, f.team.id + 1); cells.push([cx + a, y, cz + b]); }
    }
    this.platforms.push({ cells, t: 12 });
    this.tell(f, 'toast', '救援平台！12 秒後消失');
    this.sfxAt('pearl', f.pos.x, f.pos.y, f.pos.z);
    return true;
  }
  makeProjMesh(kind) {
    let m;
    if (kind === 'fireball') m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    else if (kind === 'arrow') {
      m = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.7), new THREE.MeshBasicMaterial({ color: 0x9a7040 }));
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.12), new THREE.MeshBasicMaterial({ color: 0xcccccc })); tip.position.z = -0.38;
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.14), new THREE.MeshBasicMaterial({ color: 0xffffff })); fl.position.z = 0.3;
      m.add(shaft, tip, fl);
    } else if (kind === 'bobber') {
      m = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), new THREE.MeshBasicMaterial({ color: 0xd83030 }));
      const bot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0xffffff })); bot.position.y = -0.09;
      m.add(top, bot);
    } else {
      const art = itemArt(kind);
      m = art ? new THREE.Mesh(extrudedGeometry(art, kind), new THREE.MeshBasicMaterial({ vertexColors: true })) : new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      if (art) m.scale.setScalar(0.35);
    }
    this.scene.add(m);
    return m;
  }
  spawnProj(f, kind, speedMul) {
    const dir = f.lookDir();
    const P = PROJ[kind];
    const pos = f.eye().addScaledVector(dir, 0.6);
    const pr = { id: this.nextId++, kind, owner: f, pos, vel: dir.multiplyScalar(P.spd * (speedMul || 1)), life: P.life, mesh: this.makeProjMesh(kind) };
    pr.mesh.position.copy(pos);
    this.projectiles.push(pr);
    f.swingT = 0.25;
    return pr;
  }
  removeProj(pr) {
    const i = this.projectiles.indexOf(pr);
    if (i >= 0) this.projectiles.splice(i, 1);
    this.scene.remove(pr.mesh);
    if (pr.line) this.scene.remove(pr.line);
    if (pr.kind === 'bobber' && pr.owner.bobber === pr) pr.owner.bobber = null;
  }
  throwProjectile(f, kind) {
    if (!f.count(kind)) return false;
    f.remove(kind, 1);
    const pr = this.spawnProj(f, kind);
    this.sfxAt('throw', pr.pos.x, pr.pos.y, pr.pos.z);
    return true;
  }
  shootArrow(f, charge) {
    if (!f.count('bow') || !f.count('arrow') || charge < 0.1) return false;
    f.remove('arrow', 1);
    const pr = this.spawnProj(f, 'arrow', 0.35 + 0.65 * charge);
    pr.charge = charge;
    this.sfxAt('throw', pr.pos.x, pr.pos.y, pr.pos.z);
    return true;
  }
  useRod(f) {
    if (!f.count('rod')) return false;
    const pr = f.bobber;
    if (!pr) { f.bobber = this.spawnProj(f, 'bobber'); this.sfxAt('throw', f.pos.x, f.pos.y, f.pos.z); return true; }
    // 收線
    const owner = f;
    const pullTo = (obj, target, max, up) => {
      const d = new THREE.Vector3(target.x - obj.pos.x, 0, target.z - obj.pos.z);
      const dist = d.length(); d.normalize();
      const s = Math.min(dist * 0.85 + 2, max);
      obj.vel.x = d.x * s; obj.vel.z = d.z * s; obj.vel.y = up + Math.max(0, target.y - obj.pos.y) * 0.8;
    };
    if (pr.hookF && pr.hookF.alive) {
      const t = pr.hookF;
      pullTo(t, owner.pos, 13, 5.5); t.onGround = false;
      t.lastAttacker = owner; t.lastAttackerT = this.time;
      this.pushed(t);
      this.tell(t, 'toast', `你被 ${owner.name} 的魚竿拉走了！`);
    } else if (pr.hookT) {
      pullTo(pr.hookT, owner.pos, 15, 7);
      pr.hookT.owner = owner;
      this.tell(owner, 'toast', '把 TNT 拉過來了！');
    } else if (pr.stuck) {
      pullTo(owner, pr.pos, 13, 6.5); owner.onGround = false;
      this.pushed(owner);
    }
    this.sfxAt('throw', f.pos.x, f.pos.y, f.pos.z);
    this.removeProj(pr);
    return true;
  }
  placeTNT(f, x, y, z) {
    if (!f.count('tnt') || !this.canPlaceAt(x, y, z)) return false;
    f.remove('tnt', 1);
    this.spawnTNT(x + 0.5, y, z + 0.5, 3, f, this.nextId++);
    this.sfxAt('fuse', x, y, z);
    return true;
  }
  spawnTNT(x, y, z, fuse, owner, id) {
    const mesh = texturedCube('tnt_top', 'tnt_side', null);
    mesh.scale.setScalar(0.98);
    mesh.material.forEach(m => { m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 0; });
    mesh.position.set(x, y + 0.49, z);
    this.scene.add(mesh);
    const t = { id, pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(), fuse, owner, mesh };
    this.tnts.push(t);
    return t;
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
      // 被防爆玻璃擋住的方塊不會被炸
      const dir = new THREE.Vector3(bx + 0.5 - c.x, by + 0.5 - c.y, bz + 0.5 - c.z);
      const len = dir.length();
      if (len > 0.8) {
        const hit = w.raycast(c, dir.divideScalar(len), len - 0.6);
        if (hit && BINFO[hit.type].blast > maxBlast) continue;
      }
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
      this.pushed(f);
      if (owner && f.team === owner.team && f !== owner) continue;
      let dmg = (kind === 'fireball' ? 4 : 8) * s * (1 - f.reduction() * 0.5);
      if (f === owner) dmg *= 0.25;
      if (dmg > 0.3) { f.hurtT = 0; this.damage(f, dmg, f === owner ? null : owner, 'explode'); }
    }
    this.explosionFx(c.x, c.y, c.z, radius);
  }
  explosionFx(x, y, z, radius) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.8 }));
    m.position.set(x, y, z); this.scene.add(m);
    this.effects.push({ mesh: m, t: 0, life: 0.4, grow: radius * 1.3 });
    this.burst(x, y, z, 0x555555, 14, true);
    this.sfxAt('boom', x, y, z, null, true);
    if (this.mode === 'host') this.fxOut.push(['e', +x.toFixed(2), +y.toFixed(2), +z.toFixed(2), radius]);
  }

  // ---------- 粒子與音效 ----------
  burst(x, y, z, color, n, noNet) {
    if (this.mode === 'host' && !noNet) this.fxOut.push(['b', +x.toFixed(2), +y.toFixed(2), +z.toFixed(2), color, n]);
    for (let i = 0; i < n; i++) {
      if (this.particles.length > 180) break;
      const m = new THREE.Mesh(this.pGeo || (this.pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12)), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5);
      this.scene.add(m);
      this.particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 5, (Math.random() - 0.5) * 5), life: 0.5 + Math.random() * 0.4 });
    }
  }
  sfxAt(name, x, y, z, skip, noNet) {
    if (this.mode === 'host' && !noNet) this.fxOut.push(['s', name, +x.toFixed(1), +y.toFixed(1), +z.toFixed(1)]);
    if (skip && skip === this.player) return;
    const p = this.player.alive ? this.player.pos : this.camera.position;
    const d = Math.hypot(x - p.x, y - p.y, z - p.z);
    if (d < 28) this.sfx.play(name, 1 - d / 28);
  }

  // ---------- 本機玩家操作 ----------
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
      if (tg.ent && tg.ent.team !== p.team) { this.act({ a: 'atk', id: tg.ent.id }); this.breakState = null; }
    } else if (btn === 2) {
      this.input.mouseR = true;
      const h = p.held();
      if (h && h.id === 'bow' && p.count('arrow')) { p.bowT = 0.001; return; }
      this.useItem(true);
      this.placeRepeat = 0.25;
    }
  }
  onMouseUp(btn) {
    const p = this.player;
    if (btn === 0) { this.input.mouseL = false; this.breakState = null; }
    if (btn === 2) {
      this.input.mouseR = false;
      if (p.bowT > 0) {
        const c = Math.min(1, p.bowT / 1.0);
        if (p.alive && c > 0.1) this.act({ a: 'bow', c: +c.toFixed(2), yw: p.yaw, pt: p.pitch });
        p.bowT = 0;
      }
    }
  }
  useItem(fresh) {
    const p = this.player;
    const tg = this.playerTarget();
    if (fresh && tg.npc && tg.npc.team === p.team) { this.ui.openShop(tg.npc.kind); return; }
    const h = p.held();
    if (!h) return;
    if (ITEMS[h.id].block) {
      const b = tg.block;
      const tryPlace = (x, y, z) => {
        if (!p.count(h.id) || !this.canPlaceAt(x, y, z) || !this.world.hasNeighbor(x, y, z)) return false;
        this.act({ a: 'plc', x, y, z, it: h.id });
        p.swingT = 0.2;
        return true;
      };
      const moving = Math.hypot(p.vel.x, p.vel.z) > 1.5;
      const floorTop = b && b.ny === 1 && b.y === Math.floor((p.onGround ? p.pos.y : (p.lastGroundY || p.pos.y)) - 0.01);
      if (moving && floorTop) { const c = this.assistCell(p); if (c) tryPlace(c.x, c.y, c.z); return; }
      let placed = false;
      if (b) placed = tryPlace(b.x + b.nx, b.y + b.ny, b.z + b.nz);
      if (!placed && (!b || p.pitch > -1.2)) { const c = this.assistCell(p); if (c) tryPlace(c.x, c.y, c.z); }
      return;
    }
    if (!fresh || this.useCd > 0) return;
    const look = { yw: p.yaw, pt: p.pitch };
    if (['fireball', 'pearl', 'egg', 'snowball'].includes(h.id)) { this.act({ a: 'throw', k: h.id, ...look }); this.useCd = 0.3; p.swingT = 0.25; }
    else if (h.id === 'tnt' && tg.block) { const b = tg.block; this.act({ a: 'tnt', x: b.x + b.nx, y: b.y + b.ny, z: b.z + b.nz }); this.useCd = 0.3; }
    else if (h.id === 'gapple') { this.act({ a: 'gap' }); this.useCd = 0.8; }
    else if (h.id === 'rod') { this.act({ a: 'rod', ...look }); this.useCd = 0.25; p.swingT = 0.25; }
    else if (POTION[h.id]) { this.act({ a: 'pot', k: h.id }); this.useCd = 0.8; }
    else if (h.id === 'platform') { this.act({ a: 'plat' }); this.useCd = 1; }
  }
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
  cycleMateCmd(f) {
    f = f || this.player;
    const mate = f.team.members.find(m => m !== f && m.isBot);
    if (!mate || mate.eliminated) { this.tell(f, 'toast', '你的隊友不是電腦，不能下指令'); return; }
    const order = ['defend', 'follow', 'attack'];
    mate.cmd = order[(order.indexOf(mate.cmd) + 1) % 3];
    mate.leader = f;
    if (mate.cmd === 'attack') mate.attackAt = 0;
    mate.aggro = null; mate.breaking = null;
    mate.decide();
    const label = { defend: '防守基地', follow: '跟隨你', attack: '進攻敵床' }[mate.cmd];
    this.tell(f, 'toast', `隊友 ${mate.name}：<b>${label}</b>`);
  }
  mateCmd() { const m = this.player.team.members.find(x => x !== this.player); return m ? (m.isBot ? m.cmd : 'human') : null; }

  updatePlayer(dt) {
    const p = this.player, k = this.input.keys;
    if (!p.alive) return;
    let fw = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), st = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    const tm = this.touchMove;
    if (tm && (tm.x || tm.y)) { fw = -tm.y; st = tm.x; }
    const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    const fx = -sy * fw + cy * st, fz = -cy * fw - sy * st;
    p.sneak = !!(k.ShiftLeft || k.ShiftRight || this.touchSneak);
    p.sprint = fw > 0.7 && !p.sneak && p.hp > 3 && p.bowT <= 0;
    this.applyControl(p, fx, fz, !!(k.Space || this.touchJump), dt);
    this.useCd -= dt;
    if (p.bowT > 0) p.bowT += dt;
    const tg = this.playerTarget();
    this.curTarget = tg;
    // 挖方塊
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
          if (this.breakState.t >= this.breakState.need) { this.act({ a: 'brk', x: b.x, y: b.y, z: b.z }); this.breakState = null; }
        }
      } else this.breakState = null;
    }
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
    if (f.fx.speed > 0) speed *= 1.35;
    if (f.bowT > 0) speed *= 0.45;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
    const acc = f.onGround ? 12 : 2.2;
    const k = Math.min(1, acc * dt);
    if (f.onGround || l > 0.01) {
      f.vel.x += (wx * speed - f.vel.x) * k;
      f.vel.z += (wz * speed - f.vel.z) * k;
    }
    if (jump && f.onGround) { f.vel.y = f.fx.jump > 0 ? 11.5 : 9; f.onGround = false; }
    f.vel.y = Math.max(-55, f.vel.y - 32 * dt);
  }

  // ---------- 主更新 ----------
  update(dt) {
    if (this.over && !this.testMode) { this.updateEffects(dt); if (this.mode === 'host') this.netFlush(dt, true); return; }
    if (this.mode === 'client') { this.updateClient(dt); return; }
    this.time += dt;
    while (this.eventIdx < EVENTS.length && this.time >= EVENTS[this.eventIdx].t) EVENTS[this.eventIdx++].fn(this);
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
      if (f.remote) this.remoteTick(f, dt);
      else this.physics(f, dt);
    }
    this.updateGens(dt);
    this.updateProjectiles(dt);
    this.updateTNT(dt);
    this.updateBases(dt);
    this.updatePlatforms(dt);
    this.updateEffects(dt);
    if (this.mode === 'host') this.netFlush(dt);
  }
  tickTimers(f, dt) {
    if (f.hurtT > 0) f.hurtT -= dt;
    if (f.slowT > 0) f.slowT -= dt;
    if (f.swingT > 0) f.swingT -= dt;
    for (const k in f.fx) if (f.fx[k] > 0) f.fx[k] -= dt;
  }
  physics(f, dt) {
    const wasGround = f.onGround;
    moveEntity(this.world, f, dt);
    if (f.onGround) f.lastGroundY = f.pos.y;
    // 救援平台彈跳
    let bounced = false;
    if (f.onGround && !wasGround && f.landVy < -6 && this.world.get(Math.floor(f.pos.x), Math.floor(f.pos.y - 0.05), Math.floor(f.pos.z)) === B.SLIME) {
      f.vel.y = Math.min(14, -f.landVy * 0.7); f.onGround = false; bounced = true; f.fallStart = null;
    }
    f.bounced = bounced || (f.bounced && !f.onGround);
    this.tickTimers(f, dt);
    if (!this.authority) return;
    this.fallCheck(f, wasGround, bounced);
    if (f.pos.y < VOID_Y && f.alive) {
      const killer = f.lastAttacker && this.time - f.lastAttackerT < 10 ? f.lastAttacker : null;
      this.kill(f, killer, 'void');
      return;
    }
    this.regen(f, dt);
  }
  fallCheck(f, wasGround, bounced) {
    if (!f.onGround) {
      if (f.fallStart == null || f.pos.y > f.fallStart) f.fallStart = f.pos.y;
    } else {
      if (!wasGround && f.fallStart != null && !bounced) {
        const d = f.fallStart - f.pos.y - (f.fx.jump > 0 ? 3 : 0);
        const onSlime = this.world.get(Math.floor(f.pos.x), Math.floor(f.pos.y - 0.05), Math.floor(f.pos.z)) === B.SLIME;
        if (d > 3.5 && !onSlime) this.damage(f, Math.floor(d - 3), null, 'fall');
      }
      f.fallStart = null;
    }
    if (f.vel.y > 0) f.fallStart = null;
  }
  regen(f, dt) {
    if (this.time - f.lastDmgT > 3 && f.hp < f.maxHp) {
      f.regenT += dt;
      if (f.regenT > 1.3) { f.regenT = 0; f.hp = Math.min(f.maxHp, f.hp + 1); }
    }
  }
  // 房主端：遠端玩家（位置由對方回報）
  remoteTick(f, dt) {
    this.tickTimers(f, dt);
    if (f.pos.y < VOID_Y && f.alive) {
      const killer = f.lastAttacker && this.time - f.lastAttackerT < 10 ? f.lastAttacker : null;
      this.kill(f, killer, 'void');
      return;
    }
    this.regen(f, dt);
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
            this.tell(f, 'snd', 'pickup');
            g.count = 0; break;
          }
        }
      }
    }
    this.genVisuals(dt);
  }
  genVisuals(dt) {
    for (const g of this.gens) {
      g.item.visible = g.count > 0;
      g.item.rotation.y += dt * 2;
      g.item.position.y = g.y + 0.5 + Math.sin(this.time * 3) * 0.08 + (g.type === 'emerald' && g.team ? 0.4 : 0);
      if (g.big) {
        g.big.rotation.y += dt * 1.5;
        g.label.userData.set([{ t: `${RES_NAME[g.type]} ${ROMAN[g.tier]}`, c: RES_CSS[g.type] }, { t: `${Math.max(0, Math.ceil(g.timer))} 秒  (${g.count})` }]);
      }
    }
  }
  updateProjectiles(dt) {
    const w = this.world;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      const P = PROJ[pr.kind];
      // 魚竿浮標：勾住後跟著目標
      if (pr.kind === 'bobber') {
        const o = pr.owner;
        const far = pr.pos.distanceTo(o.pos) > 32;
        const h = o.held();
        if (!o.alive || far || pr.life <= 0 || !h || h.id !== 'rod') { this.removeProj(pr); continue; }
        if (pr.hookF) { if (!pr.hookF.alive) pr.hookF = null; else { pr.pos.set(pr.hookF.pos.x, pr.hookF.pos.y + 1.2, pr.hookF.pos.z); this.syncProjMesh(pr); continue; } }
        if (pr.hookT) { if (!this.tnts.includes(pr.hookT)) pr.hookT = null; else { pr.pos.set(pr.hookT.pos.x, pr.hookT.pos.y + 1, pr.hookT.pos.z); this.syncProjMesh(pr); continue; } }
        if (pr.stuck) { this.syncProjMesh(pr); continue; }
      }
      pr.vel.y -= P.grav * dt;
      const step = pr.vel.clone().multiplyScalar(dt);
      const len = step.length();
      const dir = step.clone().divideScalar(len || 1);
      const hit = w.raycast(pr.pos, dir, len);
      let hitEnt = null, entT = Infinity;
      for (const f of this.fighters) {
        if (!f.alive || f === pr.owner || f.team === pr.owner.team) continue;
        const t = rayAABB(pr.pos, dir, { x: f.pos.x - 0.45, y: f.pos.y, z: f.pos.z - 0.45 }, { x: f.pos.x + 0.45, y: f.pos.y + PH, z: f.pos.z + 0.45 });
        if (t != null && t <= len && (!hit || t < hit.dist) && t < entT) { hitEnt = f; entT = t; }
      }
      // 浮標碰到 TNT
      if (pr.kind === 'bobber' && !hitEnt) {
        for (const t of this.tnts) {
          if (t.pos.distanceTo(new THREE.Vector3(pr.pos.x, pr.pos.y - 0.5, pr.pos.z)) < 1.0) { pr.hookT = t; break; }
        }
        if (pr.hookT) { pr.vel.set(0, 0, 0); this.syncProjMesh(pr); this.tell(pr.owner, 'toast', '勾到 TNT 了！再按一次把它拉過來'); continue; }
      }
      let done = pr.life <= 0 || pr.pos.y < 0;
      if (hit || hitEnt) {
        const at = hitEnt ? pr.pos.clone().addScaledVector(dir, entT) : pr.pos.clone().addScaledVector(dir, Math.max(0, hit.dist - 0.05));
        done = this.projHit(pr, at, hit, hitEnt, dir);
      } else pr.pos.add(step);
      if (pr.kind === 'egg' && !done) {
        const bx = Math.floor(pr.pos.x), by = Math.floor(pr.pos.y) - 2, bz = Math.floor(pr.pos.z);
        if (pr.owner.eye().distanceTo(pr.pos) > 2 && this.canPlaceAt(bx, by, bz)) {
          this.world.set(bx, by, bz, B.WOOL + pr.owner.team.id, pr.owner.team.id + 1);
          this.sfxAt('place', bx, by, bz);
        }
      }
      this.syncProjMesh(pr);
      if (pr.kind === 'fireball' && Math.random() < 0.5) this.burst(pr.pos.x, pr.pos.y, pr.pos.z, 0xff9a30, 1, true);
      if (done) this.removeProj(pr);
    }
  }
  syncProjMesh(pr) {
    pr.mesh.position.copy(pr.pos);
    if (pr.kind === 'arrow' && pr.vel.lengthSq() > 0.01) pr.mesh.lookAt(pr.pos.x - pr.vel.x, pr.pos.y - pr.vel.y, pr.pos.z - pr.vel.z);
  }
  projHit(pr, at, hit, f, dir) {
    const o = pr.owner;
    switch (pr.kind) {
      case 'fireball': this.explode(at, 2.6, o, 'fireball'); return true;
      case 'pearl':
        if (!o.alive) return true;
        o.pos.set(at.x, hit && hit.ny === 1 ? hit.y + 1 : Math.floor(at.y), at.z);
        for (let k = 0; k < 4 && boxHits(this.world, o.pos.x, o.pos.y, o.pos.z, PH); k++) o.pos.y += 1;
        o.vel.set(0, 0, 0); o.fallStart = null;
        this.teleport(o);
        this.damage(o, 2, null, 'fall');
        this.sfxAt('pearl', o.pos.x, o.pos.y, o.pos.z);
        return true;
      case 'snowball':
        if (f) {
          f.vel.x = dir.x * 5; f.vel.z = dir.z * 5; f.vel.y = Math.max(f.vel.y, 3.5); f.onGround = false;
          f.lastAttacker = o; f.lastAttackerT = this.time; f.hurtT = 0.2;
          this.pushed(f);
          this.sfxAt('hit', f.pos.x, f.pos.y, f.pos.z);
        }
        this.burst(at.x, at.y, at.z, 0xffffff, 5);
        return true;
      case 'arrow':
        if (f) {
          const c = pr.charge || 0.5;
          f.vel.x = dir.x * (2 + 3 * c); f.vel.z = dir.z * (2 + 3 * c); f.vel.y = Math.max(f.vel.y, 2.5);
          this.pushed(f);
          f.hurtT = 0;
          this.damage(f, (1.5 + 6 * c) * (1 - f.reduction()), o, 'arrow');
          this.tell(o, 'snd', 'kill');
        }
        return true;
      case 'bobber':
        if (f) {
          pr.hookF = f;
          f.vel.x = dir.x * 2.5; f.vel.z = dir.z * 2.5; f.vel.y = Math.max(f.vel.y, 3); f.onGround = false;
          f.lastAttacker = o; f.lastAttackerT = this.time;
          this.pushed(f);
          this.tell(o, 'toast', `勾到 ${f.name}！再按一次把他拉過來`);
        } else { pr.stuck = true; pr.pos.copy(at); }
        pr.vel.set(0, 0, 0);
        return false;
      case 'egg': return true;
    }
    return true;
  }
  updateTNT(dt) {
    for (let i = this.tnts.length - 1; i >= 0; i--) {
      const t = this.tnts[i];
      t.fuse -= dt;
      // TNT 物理：會被魚竿拉動、會掉落
      if (t.vel.lengthSq() > 0.0001 || !boxHits(this.world, t.pos.x, t.pos.y - 0.05, t.pos.z, 0.1, 0.49)) {
        t.vel.y = Math.max(-40, t.vel.y - 25 * dt);
        const e = { pos: t.pos, vel: t.vel };
        const steps = Math.max(1, Math.ceil(t.vel.length() * dt / 0.3));
        let ground = false;
        for (let s = 0; s < steps; s++) {
          if (sweepAxis(this.world, e, 'y', t.vel.y * dt / steps, 0.49, 0.98)) { if (t.vel.y < 0) ground = true; t.vel.y = 0; }
          if (sweepAxis(this.world, e, 'x', t.vel.x * dt / steps, 0.49, 0.98)) t.vel.x *= -0.3;
          if (sweepAxis(this.world, e, 'z', t.vel.z * dt / steps, 0.49, 0.98)) t.vel.z *= -0.3;
        }
        if (ground) { t.vel.x *= Math.pow(0.02, dt); t.vel.z *= Math.pow(0.02, dt); if (Math.hypot(t.vel.x, t.vel.z) < 0.1) t.vel.set(0, 0, 0); }
      }
      t.mesh.position.set(t.pos.x, t.pos.y + 0.49, t.pos.z);
      const flash = Math.sin(this.time * 18) > 0 ? 0.6 : 0;
      t.mesh.material.forEach(m => m.emissiveIntensity = flash);
      if (t.fuse <= 0 || t.pos.y < 0) {
        this.scene.remove(t.mesh); this.tnts.splice(i, 1);
        if (t.pos.y >= 0) this.explode(new THREE.Vector3(t.pos.x, t.pos.y + 0.49, t.pos.z), 3.6, t.owner, 'tnt');
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
            t.up.trap = 0; f.slowT = 8; f.fx.invis = 0;
            this.tellTeam(t, 'title', '', '⚠ 陷阱觸發！有敵人入侵基地！', '#ff5555');
            this.tellTeam(t, 'snd', 'alarm');
            this.tell(f, 'toast', '你觸發了敵人的陷阱！被緩速了');
            for (const m of t.members) if (m.isBot && m.alive) m.aggro = f;
            break;
          }
        }
      }
    }
  }
  updatePlatforms(dt) {
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.t -= dt;
      if (p.t <= 0) {
        for (const [x, y, z] of p.cells) if (this.world.get(x, y, z) === B.SLIME) this.world.set(x, y, z, B.AIR, 0);
        this.platforms.splice(i, 1);
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
      e.mesh.scale.setScalar(0.3 + e.grow * (e.t / e.life));
      e.mesh.material.opacity = 0.8 * (1 - e.t / e.life);
      if (e.t >= e.life) { this.scene.remove(e.mesh); this.effects.splice(i, 1); }
    }
  }

  // ===================== 連線同步 =====================
  // ---- 房主 ----
  netFlush(dt, onlyEvents) {
    if (!this.net) return;
    if (this.blkOut.length || this.fxOut.length) {
      this.net.all({ t: 'ev', b: this.blkOut, fx: this.fxOut });
      this.blkOut = []; this.fxOut = [];
    }
    if (onlyEvents) return;
    this.netT -= dt; this.meT -= dt;
    if (this.netT <= 0) { this.netT = 1 / 15; this.net.all(this.snapshot()); }
    if (this.meT <= 0) {
      this.meT = 0.1;
      for (const f of this.fighters) if (f.remote && !f.left) this.net.to(f.cid, this.meState(f));
    }
  }
  snapshot() {
    const r2 = v => Math.round(v * 100) / 100;
    return {
      t: 'snap', tm: r2(this.time), ev: this.eventIdx,
      f: this.fighters.map(f => {
        const h = f.held();
        const flags = (f.alive ? 1 : 0) | (f.sneak ? 2 : 0) | (f.fx.invis > 0 ? 4 : 0) | (f.eliminated ? 8 : 0) | (f.hurtT > 0.25 ? 16 : 0) | (f.swingT > 0 ? 32 : 0) | (f.bowT > 0.25 ? 64 : 0);
        const tier = h ? (h.id === 'sword' ? f.sword : h.id === 'pick' ? f.pick : h.id === 'axe' ? f.axe : 0) : 0;
        return [r2(f.pos.x), r2(f.pos.y), r2(f.pos.z), r2(f.yaw), r2(f.pitch), flags, Math.ceil(f.hp), h ? h.id : '', tier, f.armor, r2(f.vel.x), r2(f.vel.z)];
      }),
      tm2: this.teams.map(t => [t.bedAlive ? 1 : 0, t.eliminated ? 1 : 0, t.up.sharp, t.up.prot, t.up.forge, t.up.heal, t.up.trap]),
      g: this.gens.map(g => [g.count, r2(g.timer === Infinity ? -1 : g.timer), g.tier]),
      pr: this.projectiles.map(p => [p.id, p.kind, r2(p.pos.x), r2(p.pos.y), r2(p.pos.z), p.owner.id, r2(p.vel.x), r2(p.vel.y), r2(p.vel.z)]),
      tn: this.tnts.map(t => [t.id, r2(t.pos.x), r2(t.pos.y), r2(t.pos.z), r2(t.fuse)]),
    };
  }
  meState(f) {
    return {
      t: 'me', res: f.res, hb: f.hotbar.map(s => s ? [s.id, s.count] : 0), sw: f.sword, ar: f.armor, pk: f.pick, ax: f.axe, sh: f.shears ? 1 : 0,
      hp: Math.round(f.hp * 10) / 10, ab: Math.round(f.absorb * 10) / 10, al: f.alive ? 1 : 0, el: f.eliminated ? 1 : 0, rt: Math.round(f.respawnT * 10) / 10,
      st: f.stats, fx: f.fx, sl: f.slowT, mc: (f.team.members.find(m => m !== f) || {}).cmd || null,
    };
  }
  onNet(cid, m) { // 房主收到客戶端訊息
    const f = this.fighters.find(x => x.remote && x.cid === cid);
    if (!f || f.left) return;
    if (m.t === 'in') {
      if ((m.s || 0) < (f.tpSeq || 0) || !f.alive) return;
      const wasGround = f.onGround;
      f.pos.set(m.p[0], m.p[1], m.p[2]); f.vel.set(m.v[0], m.v[1], m.v[2]);
      f.yaw = m.yw; f.pitch = m.pt; f.sneak = !!m.sn; f.sprint = !!m.sp; f.onGround = !!m.og;
      if (m.sel >= 0 && m.sel < 9) f.sel = m.sel;
      if (m.sw) f.swingT = 0.25;
      f.bowT = m.bw || 0;
      this.fallCheck(f, wasGround, !!m.bo);
    } else if (m.t === 'act') this.perform(f, m);
  }
  playerLeft(cid) {
    const f = this.fighters.find(x => x.remote && x.cid === cid);
    if (!f || f.left) return;
    f.left = true;
    if (f.alive) this.kill(f, null, 'left');
    else { f.eliminated = true; this.feedAll(`<span style="color:${f.team.def.css}">${f.name}</span> 離開了遊戲`); this.checkTeamElim(f.team); }
  }

  // ---- 客戶端 ----
  updateClient(dt) {
    this.time += dt;
    const p = this.player;
    if (p.alive) {
      this.updatePlayer(dt);
      this.physics(p, dt);
    } else this.tickTimers(p, dt);
    // 其他人：平滑移動到最新位置
    const k = Math.min(1, dt * 12);
    for (const f of this.fighters) {
      if (f === p) continue;
      f.pos.lerp(f.netPos, k);
      f.yaw += angDiff(f.netYaw, f.yaw) * k;
      if (f.swingT > 0) f.swingT -= dt;
    }
    for (const pr of this.projectiles) { pr.pos.addScaledVector(pr.vel, dt); pr.vel.y -= (PROJ[pr.kind] ? PROJ[pr.kind].grav : 0) * dt * (pr.stuck ? 0 : 1); this.syncProjMesh(pr); }
    for (const t of this.tnts) {
      t.mesh.position.set(t.pos.x, t.pos.y + 0.49, t.pos.z);
      const flash = Math.sin(this.time * 18) > 0 ? 0.6 : 0;
      t.mesh.material.forEach(m => m.emissiveIntensity = flash);
    }
    this.genVisuals(dt);
    this.updateEffects(dt);
    // 回報自己的狀態
    this.inT -= dt;
    if (this.inT <= 0 && p.alive) {
      this.inT = 0.05;
      const r2 = v => Math.round(v * 100) / 100;
      this.net.send({ t: 'in', p: [r2(p.pos.x), r2(p.pos.y), r2(p.pos.z)], v: [r2(p.vel.x), r2(p.vel.y), r2(p.vel.z)], yw: r2(p.yaw), pt: r2(p.pitch), sn: p.sneak ? 1 : 0, sp: p.sprint ? 1 : 0, og: p.onGround ? 1 : 0, sel: p.sel, sw: p.swingT > 0.15 ? 1 : 0, bw: r2(p.bowT), s: this.tpSeq, bo: p.bounced ? 1 : 0 });
    }
  }
  onHostMsg(m) { // 客戶端收到房主訊息
    const p = this.player;
    switch (m.t) {
      case 'snap': {
        this.time = m.tm; this.eventIdx = m.ev;
        m.f.forEach((s, i) => {
          const f = this.fighters[i];
          if (!f) return;
          const alive = !!(s[5] & 1);
          if (f !== p) {
            if (alive && !f.alive) f.pos.set(s[0], s[1], s[2]);
            f.netPos.set(s[0], s[1], s[2]); f.netYaw = s[3]; f.pitch = s[4];
            f.alive = alive; f.sneak = !!(s[5] & 2); f.eliminated = !!(s[5] & 8);
            f.fx.invis = s[5] & 4 ? 1 : 0; f.hurtT = s[5] & 16 ? 0.5 : 0;
            if (s[5] & 32) f.swingT = 0.25;
            f.bowT = s[5] & 64 ? 1 : 0;
            f.hp = s[6];
            f.heldOverride = s[7] ? { id: s[7], count: 1 } : null;
            if (s[7] === 'sword') f.sword = s[8]; else if (s[7] === 'pick') f.pick = s[8]; else if (s[7] === 'axe') f.axe = s[8];
            if (f.armor !== s[9]) { f.armor = s[9]; if (f.model) setModelArmor(f.model, f); }
            f.vel.set(s[10], 0, s[11]);
            if (f.model) f.model.group.visible = alive;
          }
        });
        m.tm2.forEach((s, i) => {
          const t = this.teams[i];
          if (t.bedAlive && !s[0]) { t.bedAlive = false; this.scene.remove(t.bedMesh); }
          t.eliminated = !!s[1];
          [t.up.sharp, t.up.prot, t.up.forge, t.up.heal, t.up.trap] = s.slice(2);
        });
        m.g.forEach((s, i) => { const g = this.gens[i]; if (g) { g.count = s[0]; g.timer = s[1] < 0 ? Infinity : s[1]; g.tier = s[2]; } });
        // 投射物
        const seen = new Set();
        for (const s of m.pr) {
          seen.add(s[0]);
          let pr = this.projectiles.find(x => x.id === s[0]);
          if (!pr) { pr = { id: s[0], kind: s[1], pos: new THREE.Vector3(), vel: new THREE.Vector3(), mesh: this.makeProjMesh(s[1]) }; this.projectiles.push(pr); }
          pr.pos.set(s[2], s[3], s[4]); pr.owner = this.fighters[s[5]]; pr.vel.set(s[6], s[7], s[8]);
          if (pr.kind === 'bobber' && pr.owner) pr.owner.bobber = pr;
        }
        for (const pr of this.projectiles.slice()) if (!seen.has(pr.id)) this.removeProj(pr);
        const seenT = new Set();
        for (const s of m.tn) {
          seenT.add(s[0]);
          let t = this.tnts.find(x => x.id === s[0]);
          if (!t) t = this.spawnTNT(s[1], s[2], s[3], s[4], null, s[0]);
          t.pos.set(s[1], s[2], s[3]); t.fuse = s[4];
        }
        for (const t of this.tnts.slice()) if (!seenT.has(t.id)) { this.scene.remove(t.mesh); this.tnts.splice(this.tnts.indexOf(t), 1); }
        this.lastSnap = performance.now();
        break;
      }
      case 'me': {
        p.res = m.res;
        p.hotbar = m.hb.map(s => s ? { id: s[0], count: s[1] } : null);
        p.sword = m.sw; p.armor = m.ar; p.pick = m.pk; p.axe = m.ax; p.shears = !!m.sh;
        p.hp = m.hp; p.absorb = m.ab; p.respawnT = m.rt; p.stats = m.st; p.fx = m.fx; p.slowT = m.sl;
        this.mateCmdNet = m.mc;
        if (p.alive && !m.al) { p.alive = false; this.onLocalDeath(!!m.el); }
        p.eliminated = !!m.el;
        if (p.eliminated && !this.spectator) this.onLocalDeath(true);
        break;
      }
      case 'ev': {
        this.applyingNet = true;
        for (const [x, y, z, v, pb] of m.b) {
          const old = this.world.get(x, y, z);
          if (old === v) continue;
          this.world.set(x, y, z, v, pb);
          if (!v && old && BINFO[old].bed < 0 && Math.random() < 0.5) this.burst(x + 0.5, y + 0.5, z + 0.5, BINFO[old].color, 4);
        }
        this.applyingNet = false;
        for (const e of m.fx) {
          if (e[0] === 'b') this.burst(e[1], e[2], e[3], e[4], e[5]);
          else if (e[0] === 's') this.sfxAt(e[1], e[2], e[3], e[4]);
          else if (e[0] === 'e') this.explosionFx(e[1], e[2], e[3], e[4]);
        }
        break;
      }
      case 'ui': if (m.k === 'snd') this.sfx.play(m.a[0]); else if (this.ui[m.k]) this.ui[m.k](...m.a); break;
      case 'kb': p.vel.set(m.v[0], m.v[1], m.v[2]); p.onGround = false; break;
      case 'tp':
        p.pos.set(m.p[0], m.p[1], m.p[2]); p.vel.set(0, 0, 0); p.yaw = m.yw; p.fallStart = null;
        this.tpSeq = m.s;
        if (!p.alive && !p.eliminated) { p.alive = true; p.hp = 20; }
        break;
      case 'end':
        this.over = true;
        m.st.forEach((s, i) => { const f = this.fighters[i]; if (f) f.stats = { kills: s[0], finals: s[1], beds: s[2], deaths: s[3] }; });
        this.showEnd(m.w, m.text);
        break;
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
      let tf = p.sprint ? 82 : 75;
      if (p.fx.speed > 0) tf += 6;
      if (p.bowT > 0) tf -= Math.min(1, p.bowT) * 12;
      cam.fov += (tf - cam.fov) * Math.min(1, dt * 8); cam.updateProjectionMatrix();
    } else {
      const t = p.team.spawn;
      cam.position.set(t.x, GROUND + 12, t.z + 0.01);
      cam.lookAt(t.x, GROUND, t.z);
      this.vm.visible = false;
    }
    // 手持物品（立體像素）
    const key = p.heldKey();
    if (key !== this.vmKey) {
      this.vmKey = key;
      while (this.vmItem.children.length) this.vmItem.remove(this.vmItem.children[0]);
      const h = p.held();
      if (h) {
        const m = makeItemMesh(h.id, p, true);
        if (ITEMS[h.id].block || h.id === 'tnt') { m.scale.setScalar(0.5); m.position.set(0.06, -0.03, -0.05); m.rotation.set(0.1, 0.75, 0); }
        else { m.scale.setScalar(0.32); m.rotation.set(0, -1.2, 0.35); m.position.set(0.02, -0.05, 0); }
        this.vmItem.add(m);
      }
      this.vmArm.visible = !h;
    }
    const sw = p.swingT > 0 ? Math.sin((p.swingT / 0.25) * Math.PI) : 0;
    const bob = p.onGround ? Math.sin(this.time * (p.sprint ? 13 : 9)) * Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 5) : 0;
    const draw = p.bowT > 0 ? Math.min(1, p.bowT) : 0;
    this.vm.position.set(0.42 - sw * 0.15 - draw * 0.18, -0.4 + bob * 0.02 + sw * 0.05 + draw * 0.08, -0.62 - sw * 0.1 + draw * 0.08);
    this.vm.rotation.set(-sw * 0.9, sw * 0.3 + draw * 0.3, 0);
    // 方塊選取框與裂痕
    const tg = this.curTarget;
    if (p.alive && tg && tg.block && !tg.ent) {
      this.hl.visible = true;
      const b = tg.block;
      const hh = BINFO[b.type].h;
      this.hl.scale.set(1, hh, 1);
      this.hl.position.set(b.x + 0.5, b.y + hh / 2, b.z + 0.5);
    } else this.hl.visible = false;
    const bs = this.breakState;
    if (bs) {
      this.crack.visible = true;
      this.crack.position.set(bs.x + 0.5, bs.y + 0.5, bs.z + 0.5);
      this.crack.material.opacity = Math.min(0.55, bs.t / bs.need * 0.6);
    } else this.crack.visible = false;
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
    // 魚竿釣線
    for (const pr of this.projectiles) {
      if (pr.kind !== 'bobber' || !pr.owner) continue;
      const o = pr.owner;
      let from;
      if (o === p && !this.spectator) from = p.eye().add(p.lookDir().multiplyScalar(0.8)).add(new THREE.Vector3(Math.cos(p.yaw) * 0.35, -0.15, -Math.sin(p.yaw) * 0.35));
      else from = new THREE.Vector3(o.pos.x + Math.cos(o.yaw) * 0.4, o.pos.y + 1.6, o.pos.z - Math.sin(o.yaw) * 0.4).add(o.lookDir().multiplyScalar(0.8));
      if (!pr.line) {
        pr.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, pr.pos]), new THREE.LineBasicMaterial({ color: 0x222222 }));
        this.scene.add(pr.line);
      } else pr.line.geometry.setFromPoints([from, pr.pos.clone()]);
    }
    // 角色模型
    for (const f of this.fighters) {
      if (!f.model) continue;
      const m = f.model;
      m.group.visible = f.alive && !(f.fx.invis > 0);
      if (!m.group.visible) continue;
      m.group.position.copy(f.pos);
      m.group.rotation.y = f.yaw;
      const spd = Math.hypot(f.vel.x, f.vel.z);
      f.walkPhase += spd * dt * 2.2;
      const sw2 = Math.sin(f.walkPhase) * Math.min(1, spd / 4) * 0.8;
      m.legL.rotation.x = sw2; m.legR.rotation.x = -sw2;
      m.armL.rotation.x = -sw2 * 0.8;
      const swing = f.swingT > 0 ? Math.sin((f.swingT / 0.25) * Math.PI) * 1.4 : 0;
      m.armR.rotation.x = f.bowT > 0.2 ? -1.5 : sw2 * 0.8 - swing - 0.25;
      if (f.bowT > 0.2) m.armL.rotation.x = -1.5;
      m.head.rotation.x = f.pitch;
      m.body.rotation.x = f.sneak ? 0.35 : 0;
      m.group.position.y = f.pos.y - (f.sneak ? 0.12 : 0);
      const hurt = f.hurtT > 0.25;
      for (const mat of m.mats) { if (mat.emissive) { mat.emissive.setHex(hurt ? 0xff0000 : 0x000000); mat.emissiveIntensity = hurt ? 0.6 : 0; } }
      updateModelHeld(m, f);
      const hpR = Math.ceil(f.hp);
      if (m.lastHp !== hpR) { m.lastHp = hpR; m.tag.userData.draw(hpR); }
    }
    this.mesher.update();
    this.renderer.render(this.scene, cam);
  }

  simulate(sec) {
    const n = Math.round(sec * 30);
    for (let i = 0; i < n; i++) { this.update(1 / 30); if (i % 30 === 0) this.mesher.update(); }
    this.mesher.update();
  }
}
