'use strict';
// ============ 百門飯店：主程式 ============
(() => {
  const $ = id => document.getElementById(id);
  const QP = Object.fromEntries(new URLSearchParams(location.search));
  const TOUCH = QP.touch === '1' || (QP.touch !== '0' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0));
  const store = { get(k, d) { try { const v = localStorage.getItem('hd_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('hd_' + k, JSON.stringify(v)); } catch (e) { } } };
  const CFG = Object.assign({ sens: 1, gfx: TOUCH ? 'low' : 'high', vol: 0.8 }, store.get('cfg', {}));
  let GOLD = store.get('gold', 60);
  const LOAD = Object.assign({ lighter: 0, flash: 0, vit: 0 }, store.get('load', {}));
  const COLORS = ['#e8433a', '#3a8de8', '#3ac85a', '#e8c23a'];
  const pad = World.pad, WT = World.WT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------- 渲染 ----------
  const cv = $('cv');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: CFG.gfx === 'high', powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030203);
  scene.fog = new THREE.Fog(0x030203, 10, 40);
  const cam = new THREE.PerspectiveCamera(72, 1, 0.05, 140); cam.rotation.order = 'YXZ'; scene.add(cam);
  const hemi = new THREE.HemisphereLight(0x9098b0, 0x2a1a10, 0.5); scene.add(hemi);
  const POOL = []; for (let i = 0; i < (CFG.gfx === 'high' ? 8 : 5); i++) { const l = new THREE.PointLight(0xffffff, 0, 16, 1.4); scene.add(l); POOL.push(l); }
  const myLight = new THREE.PointLight(0xffa850, 0, 10, 1.3); myLight.position.set(0.25, -0.2, -0.3); cam.add(myLight);
  const spot = new THREE.SpotLight(0xfff2d8, 0, 26, 0.48, 0.45, 1.1); spot.position.set(0.15, -0.15, 0); cam.add(spot); spot.target.position.set(0, -0.2, -5); cam.add(spot.target);
  function resize() {
    const pr = CFG.gfx === 'high' ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, 1.5) * 0.6;
    renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- 狀態 ----------
  const S = {
    st: 'menu', net: null, myId: 'me', world: null, latest: 0, obj: {}, players: {}, built: new Map(), sim: null,
    me: null, inv: null, flick: {}, chase: false, t: 0, hints: [], ents: new Map(), roster: [], over: false, earned: 0,
    spec: null, dupeUsed: {}, scr: null, scT: 10, halt: null, eyesLoop: null, drone: null, lastOpenReq: 0, lastDeny: 0, kpObj: null, kp: ''
  };
  window.HD = { S, World };

  // ---------- 輸入 ----------
  const keys = {}; const look = { dx: 0, dy: 0 }; const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
  let locked = false;
  function lockPtr() { try { const r = cv.requestPointerLock && cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } }
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    keys[e.code] = true;
    if (S.st !== 'play') return;
    if (e.code === 'KeyE') act('e'); if (e.code === 'KeyC' || e.code === 'ControlLeft') act('c'); if (e.code === 'KeyF') act('f'); if (e.code === 'KeyV') act('v');
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  cv.addEventListener('mousedown', () => {
    Snd.init();
    if (S.st !== 'play' || TOUCH) return;
    if (!locked) { lockPtr(); return; }
    act('e');
  });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === cv;
    if (!locked && S.st === 'play' && !TOUCH && $('keypad').classList.contains('hide') && $('dead').classList.contains('hide') && $('end').classList.contains('hide')) showPause(true);
  });
  addEventListener('mousemove', e => { if (locked) { look.dx += e.movementX; look.dy += e.movementY; } });
  // 手機
  if (TOUCH) {
    const jb = $('joy'), kn = $('knob'); let lookId = null, lx = 0, ly = 0;
    jb.addEventListener('touchstart', e => { const t = e.changedTouches[0]; joy.id = t.identifier; const r = jb.getBoundingClientRect(); joy.ox = r.left + r.width / 2; joy.oy = r.top + r.height / 2; e.preventDefault(); Snd.init(); }, { passive: false });
    addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joy.id) { let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy; const d = Math.hypot(dx, dy), m = 55; if (d > m) { dx *= m / d; dy *= m / d; } joy.x = dx / m; joy.y = dy / m; kn.style.transform = `translate(${dx}px,${dy}px)`; }
        else if (t.identifier === lookId) { look.dx += (t.clientX - lx) * 2.2; look.dy += (t.clientY - ly) * 2.2; lx = t.clientX; ly = t.clientY; }
      }
    }, { passive: false });
    const end = e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; kn.style.transform = ''; } if (t.identifier === lookId) lookId = null; } };
    addEventListener('touchend', end); addEventListener('touchcancel', end);
    cv.addEventListener('touchstart', e => { for (const t of e.changedTouches) if (lookId === null && t.clientX > innerWidth * 0.35) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; } e.preventDefault(); }, { passive: false });
    document.querySelectorAll('#tbtns button').forEach(b => b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Snd.init(); if (S.st === 'play') act(b.dataset.k); }, { passive: false }));
    $('tPause').addEventListener('touchstart', e => { e.preventDefault(); showPause(true); }, { passive: false });
  }

  // ---------- UI 小工具 ----------
  const screens = ['menu', 'lobby', 'shop', 'help', 'settings', 'keypad', 'dead', 'end', 'pause', 'loading'];
  let backTo = 'menu';
  function show(id) { screens.forEach(s => $(s).classList.toggle('hide', s !== id)); }
  function hideAll() { screens.forEach(s => $(s).classList.add('hide')); }
  let msgT = 0, bigT = 0;
  function msg(t, d = 2.6) { $('msg').textContent = t; msgT = d; }
  function big(t, d = 1.6) { $('big').textContent = t; bigT = d; }
  function updGold() { document.querySelectorAll('.goldTxt').forEach(e => e.textContent = GOLD); $('goldH').textContent = '金幣 ' + GOLD; store.set('gold', GOLD); }
  function flash(col, a = 0.8) { const f = $('flash'); f.style.transition = 'none'; f.style.background = col; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = 'opacity .6s'; f.style.opacity = 0; }); }
  let shake = 0;

  $('name').value = store.get('name', '月狼' + Math.floor(Math.random() * 90 + 10));
  const myName = () => { const n = ($('name').value || '玩家').trim().slice(0, 12) || '玩家'; store.set('name', n); return n; };
  document.querySelectorAll('.back').forEach(b => b.onclick = () => { if (backTo === 'pause') { show('pause'); } else show(backTo); });
  $('bHelp').onclick = () => { backTo = 'menu'; show('help'); };
  $('bSet').onclick = () => { backTo = 'menu'; openSettings(); };
  $('bSet2').onclick = () => { backTo = 'pause'; openSettings(); };
  $('bShop').onclick = () => { backTo = 'menu'; openShop(); };
  $('bShop2').onclick = () => { backTo = 'lobby'; openShop(); };
  function openSettings() {
    $('sSens').value = CFG.sens; $('sVol').value = CFG.vol; $('sGfx').value = CFG.gfx; show('settings');
  }
  $('sSens').oninput = e => { CFG.sens = +e.target.value; store.set('cfg', CFG); };
  $('sVol').oninput = e => { CFG.vol = +e.target.value; Snd.setVol(CFG.vol); store.set('cfg', CFG); };
  $('sGfx').onchange = e => { CFG.gfx = e.target.value; store.set('cfg', CFG); resize(); };
  Snd.setVol(CFG.vol);
  const SHOP = [
    { k: 'lighter', n: '打火機', d: '小範圍照明，黑暗房間必備', p: 25, max: 1 },
    { k: 'flash', n: '手電筒', d: '很亮、照得很遠', p: 60, max: 1 },
    { k: 'vit', n: '維他命', d: '12 秒內跑得更快', p: 20, max: 3 },
  ];
  function openShop() {
    const L = $('shopList'); L.innerHTML = '';
    for (const it of SHOP) {
      const d = document.createElement('div'); d.className = 'shopItem';
      d.innerHTML = `<div><b>${it.n}</b>（已帶 ${LOAD[it.k]}/${it.max}）<br><span class="note">${it.d}</span></div>`;
      const b = document.createElement('button'); b.textContent = it.p + ' 金幣'; b.disabled = GOLD < it.p || LOAD[it.k] >= it.max;
      b.onclick = () => { if (GOLD >= it.p && LOAD[it.k] < it.max) { GOLD -= it.p; LOAD[it.k]++; store.set('load', LOAD); updGold(); Snd.init(); Snd.coin(); openShop(); } };
      d.appendChild(b); L.appendChild(d);
    }
    updGold(); show('shop');
  }
  function loadTxt() { const a = []; if (LOAD.lighter) a.push('打火機'); if (LOAD.flash) a.push('手電筒'); if (LOAD.vit) a.push('維他命×' + LOAD.vit); return a.length ? '你帶的道具：' + a.join('、') : '你沒有帶道具（可以去商店買）'; }
  updGold();

  // ---------- 選單 / 大廳 ----------
  $('bSolo').onclick = () => { Snd.init(); S.net = 'solo'; S.myId = 'me'; S.roster = [{ id: 'me', name: myName(), color: COLORS[0] }]; beginGame(Math.floor(Math.random() * 1e9)); };
  $('bHost').onclick = async () => {
    Snd.init(); S.net = 'host'; S.myId = 'host'; S.roster = [{ id: 'host', name: myName(), color: COLORS[0] }];
    $('loadTxt').textContent = '建立房間中…'; show('loading');
    try {
      await Net.host({
        open: code => { $('lCode').textContent = code; showLobby(); },
        join: id => { },
        msg: (from, m) => hostMsg(from, m),
        leave: id => hostLeave(id),
        err: t => { if (S.st === 'menu' || S.st === 'lobby') { $('menuMsg').textContent = '建立房間失敗（' + t + '），請再試一次。'; quit(); } }
      });
    } catch (e) { $('menuMsg').textContent = '連線元件載入失敗，請確認網路。'; quit(); }
  };
  $('bJoin').onclick = async () => {
    const code = $('code').value.trim().toUpperCase(); if (code.length < 5) { $('menuMsg').textContent = '請輸入 5 位房間代碼'; return; }
    Snd.init(); S.net = 'client'; $('loadTxt').textContent = '連線到 ' + code + '…'; show('loading');
    try {
      await Net.join(code, {
        open: id => { S.myId = id; Net.send('host', { t: 'hello', name: myName() }); },
        msg: (_, m) => clientMsg(m),
        leave: () => { if (S.net === 'client') { quit(); $('menuMsg').textContent = '主機已離線。'; } },
        err: t => { if (S.st !== 'play') { quit(); $('menuMsg').textContent = t === 'peer-unavailable' ? '找不到這個房間，代碼對嗎？' : '連線失敗（' + t + '）'; } }
      });
    } catch (e) { quit(); $('menuMsg').textContent = '連線元件載入失敗，請確認網路。'; }
  };
  function showLobby() {
    S.st = 'lobby'; backTo = 'lobby'; show('lobby');
    const L = $('lList'); L.innerHTML = '';
    S.roster.forEach(p => { const li = document.createElement('li'); li.style.borderColor = p.color; li.textContent = p.name + (p.id === 'host' ? '（主機）' : '') + (p.id === S.myId ? '（你）' : ''); L.appendChild(li); });
    $('bStart').classList.toggle('hide', S.net !== 'host');
    $('lMsg').textContent = S.net === 'host' ? '人到齊就按「開始遊戲」' : '等待主機開始…';
    $('lLoad').textContent = loadTxt();
  }
  $('bStart').onclick = () => { if (S.net !== 'host') return; const seed = Math.floor(Math.random() * 1e9); Net.bcast({ t: 'start', seed, roster: S.roster }); beginGame(seed); };
  $('bLeave').onclick = () => quit();
  [$('bQuit'), $('bQuit2'), $('bQuit3'), $('bEnd')].forEach(b => b.onclick = () => quit());
  $('bResume').onclick = () => { showPause(false); };
  function showPause(on) {
    if (on) { $('pInfo').textContent = S.net === 'solo' ? '單人模式' : '連線中，遊戲不會停止'; show('pause'); if (locked) document.exitPointerLock(); }
    else { hideAll(); if (!TOUCH) lockPtr(); }
  }

  // ---------- 主機訊息 ----------
  function hostMsg(from, m) {
    switch (m.t) {
      case 'hello': {
        if (S.st !== 'lobby' || S.roster.length >= 4) { Net.send(from, { t: 'full' }); return; }
        if (!S.roster.find(p => p.id === from)) S.roster.push({ id: from, name: String(m.name || '玩家').slice(0, 12), color: COLORS[S.roster.length % 4] });
        Net.bcast({ t: 'lobby', roster: S.roster }); showLobby(); break;
      }
      case 'pose': { const p = S.players[from]; if (p) setPose(p, m.p); break; }
      case 'open': hostOpen(m.n); break;
      case 'act': hostAct(from, m.id); break;
      case 'code': hostCode(from, m.id, m.code); break;
      case 'dead': { const p = S.players[from]; if (p && p.alive) { p.alive = false; Net.bcast({ t: 'dead', id: from, cause: m.cause }); onDeadNote(from, m.cause); } break; }
      case 'esc': hostEsc(from); break;
    }
  }
  function hostLeave(id) {
    const i = S.roster.findIndex(p => p.id === id); if (i >= 0) S.roster.splice(i, 1);
    if (S.st === 'lobby') { Net.bcast({ t: 'lobby', roster: S.roster }); showLobby(); }
    const p = S.players[id]; if (p) { removeAvatar(p); delete S.players[id]; Net.bcast({ t: 'left', id }); msg(p.name + ' 離開了遊戲'); }
  }
  // ---------- 用戶端訊息 ----------
  function clientMsg(m) {
    switch (m.t) {
      case 'full': quit(); $('menuMsg').textContent = '房間已滿或已經開始了。'; break;
      case 'lobby': S.roster = m.roster; showLobby(); break;
      case 'start': S.roster = m.roster; beginGame(m.seed); break;
      case 'tick': if (S.st !== 'play') return; for (const id in m.p) if (id !== S.myId && S.players[id]) setPose(S.players[id], m.p[id]); applyEnts(m.e); break;
      case 'door': if (S.st === 'play') onDoor(m.n); break;
      case 'obj': if (S.st === 'play') applyObj(m); break;
      case 'fx': if (S.st === 'play') applyFx(m); break;
      case 'kill': if (S.st === 'play') die(m.cause, true); break;
      case 'dead': if (S.st === 'play') { const p = S.players[m.id]; if (p) p.alive = false; onDeadNote(m.id, m.cause); } break;
      case 'esc': if (S.st === 'play') { const p = S.players[m.id]; if (p) p.esc = true; msg((p ? p.name : '') + ' 逃出去了！'); } break;
      case 'left': { const p = S.players[m.id]; if (p) { removeAvatar(p); delete S.players[m.id]; msg(p.name + ' 離開了遊戲'); } break; }
      case 'codebad': $('kpMsg').textContent = '密碼錯誤'; Snd.deny(); break;
      case 'over': endGame(m.win); break;
    }
  }
  function setPose(p, a) { p.tx = a[0]; p.tz = a[1]; p.yaw = a[2]; p.pitch = a[3]; p.flags = a[4]; p.hp = a[5]; p.room = a[6]; if (p.x === undefined) { p.x = a[0]; p.z = a[1]; } }
  function onDeadNote(id, cause) { const p = S.players[id]; if (!p || id === S.myId) return; msg(p.name + ' 被' + (Ents.NAMES[cause] || '怪物') + '殺死了…', 3.5); }

  // ---------- 開始遊戲 ----------
  function beginGame(seed) {
    cleanupWorld();
    S.world = World.generate(seed); S.latest = 0; S.obj = {}; S.flick = {}; S.chase = false; S.hints = []; S.over = false; S.earned = 0; S.spec = null; S.dupeUsed = {}; S.scT = 10; S.halt = null; S.scr = null;
    for (const R of S.world.rooms) if (R.lockId) S.obj[R.lockId] = 1;
    const R0 = S.world.rooms[0];
    S.players = {};
    S.roster.forEach((r, i) => {
      const sp = R0.spawn[i % 4];
      const p = { id: r.id, name: r.name, color: r.color, x: sp[0], z: sp[1], tx: sp[0], tz: sp[1], yaw: 0, pitch: 0, flags: 0, hp: 100, room: 0, alive: true, esc: false };
      S.players[r.id] = p;
      if (r.id !== S.myId) makeAvatar(p);
    });
    const mp = S.players[S.myId];
    S.me = { x: mp.x, z: mp.z, yaw: 0, pitch: 0, hp: 100, alive: true, esc: false, hidden: null, crouch: false, boost: 0, room: 0, bob: 0, stepT: 0, moving: false, light: false };
    S.inv = { lighter: LOAD.lighter > 0, flash: LOAD.flash > 0, vit: LOAD.vit };
    LOAD.lighter = LOAD.flash = LOAD.vit = 0; store.set('load', LOAD);
    if (S.net !== 'client') S.sim = new Ents.HostSim({
      world: S.world, latest: () => S.latest,
      players: () => Object.values(S.players).map(p => p.id === S.myId ? { id: p.id, x: S.me.x, z: S.me.z, room: S.me.room, hidden: !!S.me.hidden, crouch: S.me.crouch, moving: S.me.moving, alive: S.me.alive, esc: S.me.esc } : { id: p.id, x: p.x, z: p.z, room: p.room, hidden: !!(p.flags & 1), crouch: !!(p.flags & 2), moving: !!(p.flags & 4), alive: p.alive, esc: p.esc }),
      kill: (id, c) => hostKill(id, c), fx: m => { applyFx(m); Net.bcast(Object.assign({ t: 'fx' }, m)); }
    }); else S.sim = null;
    S.st = 'play'; hideAll(); $('hud').classList.remove('hide'); $('touch').classList.toggle('hide', !TOUCH); $('specBar').classList.add('hide');
    $('cross').classList.toggle('hide', TOUCH);
    S.drone = Snd.loop('drone'); S.drone.vol(0.25);
    ensureBuilt(); updInv(); updGold(); updHints();
    msg(S.net === 'solo' ? '找到下一扇門。小心燈光閃爍…' : '和隊友一起往前走，找到下一扇門。', 4);
    if (!TOUCH) lockPtr();
  }
  function cleanupWorld() {
    for (const [i, B] of S.built) unbuild(i);
    S.built.clear();
    for (const [, v] of S.ents) { cam.remove(v.m); scene.remove(v.m); v.loop && v.loop.stop(); }
    S.ents.clear();
    for (const id in S.players) removeAvatar(S.players[id]);
    if (S.eyesLoop) { S.eyesLoop.stop(); S.eyesLoop = null; }
    if (S.drone) { S.drone.stop(); S.drone = null; }
    if (S.scr) { scene.remove(S.scr.m); S.scr = null; }
    if (S.halt && S.halt.m) scene.remove(S.halt.m); S.halt = null;
    if (S.chaseLoop) { S.chaseLoop.stop(); S.chaseLoop = null; }
  }
  function quit() {
    Net.close(); cleanupWorld(); S.st = 'menu'; S.net = null; S.sim = null;
    $('hud').classList.add('hide'); $('touch').classList.add('hide'); $('specBar').classList.add('hide'); $('hideOv').classList.remove('on'); $('tint').style.background = '';
    if (locked) document.exitPointerLock();
    backTo = 'menu'; show('menu'); updGold();
  }

  // ---------- 房間建置 ----------
  function focusRoom() { if (S.me.alive && !S.me.esc) return S.me.room; const p = S.players[S.spec]; return p ? p.room : S.me.room; }
  function ensureBuilt() {
    const f = focusRoom(), top = Math.min(100, S.latest), lo = Math.max(0, f - 2), hi = Math.min(top, f + 2);
    for (let i = lo; i <= hi; i++) if (!S.built.has(i)) {
      const R = S.world.rooms[i], B = World.build(R);
      scene.add(B.g); S.built.set(i, B);
      R.exits.forEach((e, k) => { const D = B.doors[k]; if (D && e.real && e.num <= S.latest) { D.open = D.target = 1; poseDoor(D); } });
      for (const o of R.objs) if (S.obj[o.id]) objVisual(R, o, B, true);
      if (R.lockId && !S.obj[R.lockId]) lockVisual(R, B);
      if (R.eyesPos) { const m = Ents.model('eyes'); m.position.set(R.eyesPos.x, R.eyesPos.y, R.eyesPos.z); B.g.add(m); B.eyes = m; }
    }
    for (const i of [...S.built.keys()]) if (i < lo - 1 || i > hi + 1) unbuild(i);
  }
  function unbuild(i) {
    const B = S.built.get(i); if (!B) return;
    scene.remove(B.g);
    B.g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    B.lampMat.dispose(); S.built.delete(i);
  }
  function poseDoor(D) {
    if (D.gate) { D.gate.position.y = D.open * (D.h - 0.2); return; }
    D.pivot.rotation.y = D.open * 1.55;
  }
  function onDoor(n) {
    if (n <= S.latest) return;
    S.latest = n;
    ensureBuilt();
    const R = S.world.rooms[n - 1]; const B = S.built.get(n - 1);
    if (R && B) { const k = R.exits.findIndex(e => e.real); if (B.doors[k]) B.doors[k].target = 1; }
    if (R) { const d = Math.hypot(S.me.x - R.exit.x, S.me.z - R.z1); if (d < 14) Snd.door(); }
    if (n === 50) msg('第 50 門：圖書館。保持安靜…', 4);
    if (n === 100) msg('第 100 門。拉下 3 個拉桿，打開出口！', 5);
    if (n === 101) msg('大門打開了！快跑出去！', 4);
  }

  // ---------- 主機邏輯 ----------
  function findObj(id) { const ri = parseInt(id, 10); const R = S.world.rooms[ri]; if (!R) return null; return { R, o: R.objs.find(o => o.id === id) }; }
  function hostOpen(n) {
    if (n !== S.latest + 1 || n > 101) return;
    const R = S.world.rooms[n - 1]; if (R.lockId && S.obj[R.lockId]) return;
    Net.bcast({ t: 'door', n }); onDoor(n); if (S.sim) S.sim.onDoor(n);
  }
  function hostSet(m) { applyObj(m); Net.bcast(Object.assign({ t: 'obj' }, m)); }
  function hostUnlock(R) { if (R.lockId && S.obj[R.lockId]) hostSet({ id: R.lockId, s: 0 }); }
  function hostAct(pid, id) {
    const f = findObj(id); if (!f || !f.o || S.obj[id]) return; const { R, o } = f;
    const p = S.players[pid]; if (!p || !p.alive) return;
    switch (o.kind) {
      case 'drawer': hostSet({ id, s: 1, by: pid, loot: o.loot }); if (o.loot && o.loot.key) hostUnlock(R); break;
      case 'key': hostSet({ id, s: 1, by: pid }); hostUnlock(R); break;
      case 'book': hostSet({ id, s: 1, by: pid }); break;
      case 'lever': hostSet({ id, s: 1, by: pid }); if (R.objs.filter(q => q.kind === 'lever').every(q => S.obj[q.id])) hostUnlock(R); break;
    }
  }
  function hostCode(pid, id, code) {
    const f = findObj(id); if (!f) return;
    if (String(code) === f.R.code) { hostSet({ id, s: 1, by: pid }); hostUnlock(f.R); }
    else if (pid === S.myId) { $('kpMsg').textContent = '密碼錯誤'; Snd.deny(); } else Net.send(pid, { t: 'codebad' });
  }
  function hostKill(id, cause) {
    const p = S.players[id]; if (!p || !p.alive) return;
    p.alive = false;
    if (id === S.myId) die(cause, true); else { Net.send(id, { t: 'kill', cause }); onDeadNote(id, cause); }
    Net.bcast({ t: 'dead', id, cause });
  }
  function hostEsc(id) { const p = S.players[id]; if (!p || p.esc || !p.alive) return; p.esc = true; Net.bcast({ t: 'esc', id }); msg(p.name + ' 逃出去了！'); }
  function hostCheckOver() {
    if (S.over) return; const ps = Object.values(S.players); if (!ps.length) return;
    if (ps.every(p => !p.alive || p.esc)) { const win = ps.some(p => p.esc); Net.bcast({ t: 'over', win }); endGame(win); }
  }

  // ---------- 請求 ----------
  function requestOpen(n) { if (S.t - S.lastOpenReq < 0.5) return; S.lastOpenReq = S.t; if (S.net === 'client') Net.send('host', { t: 'open', n }); else hostOpen(n); }
  function requestAct(id) { if (S.net === 'client') Net.send('host', { t: 'act', id }); else hostAct(S.myId, id); }

  // ---------- 物件狀態 ----------
  function applyObj(m) {
    const prev = S.obj[m.id]; S.obj[m.id] = m.s;
    const ri = parseInt(m.id, 10), R = S.world.rooms[ri], B = S.built.get(ri);
    if (m.id.endsWith(':lock')) {
      if (!m.s) { if (B) lockVisual(R, B); if (Math.abs(S.me.room - ri) <= 1) { Snd.unlock(); msg(R.type === 'final' ? '出口大門解鎖了！' : '門解鎖了！'); } }
      return;
    }
    const o = R && R.objs.find(q => q.id === m.id); if (!o) return;
    if (B) objVisual(R, o, B, false);
    const mine = m.by === S.myId, near = Math.abs(S.me.room - ri) <= 1;
    if (o.kind === 'drawer') {
      if (near) Snd.drawer();
      if (mine) {
        const L = m.loot;
        if (L && L.g) { GOLD += L.g; S.earned += L.g; updGold(); Snd.coin(); msg('+' + L.g + ' 金幣'); }
        if (L && L.v) { S.inv.vit++; updInv(); Snd.pick(); msg('找到維他命！'); }
        if (L && L.key) { Snd.key(); msg('找到鑰匙！'); }
        if (!L && Math.random() < 0.07) { setTimeout(() => { jumpscare('spider'); hurt(6, 'spider'); }, 120); }
      }
    }
    if (o.kind === 'key' && near) { Snd.key(); if (mine) msg('拿到鑰匙！'); }
    if (o.kind === 'book') { S.hints.push(o); updHints(); if (near) Snd.pick(); if (mine) msg('書上寫著：密碼第 ' + (o.pos + 1) + ' 位是 ' + o.digit); else msg('隊友找到一本書'); }
    if (o.kind === 'lever') { if (near) Snd.lever(); const n = R.objs.filter(q => q.kind === 'lever' && S.obj[q.id]).length; msg('拉桿 ' + n + ' / 3'); }
    if (o.kind === 'padlock') { $('kpMsg').textContent = ''; if (S.kpObj && S.kpObj.id === o.id) closeKeypad(); msg('密碼正確！'); }
  }
  function objVisual(R, o, B, inst) {
    const m = B.objs[o.id]; if (!m) return;
    if (o.kind === 'drawer') { m.userData.open = 1; if (inst) m.position.x = m.userData.bx + o.n * 0.36; if (m.userData.loot) m.userData.loot.visible = false; }
    if (o.kind === 'key' || o.kind === 'book') m.visible = false;
    if (o.kind === 'lever') { m.userData.arm.rotation.x = 0.7; m.userData.bulb.material = World.initMats().green; }
    if (o.kind === 'padlock') m.userData.screen.material = new THREE.MeshBasicMaterial({ map: World.textTex('OPEN', '#031', '#5f8', 256, 96, 'bold 60px monospace') });
  }
  function lockVisual(R, B) { if (B.lock) B.lock.visible = false; }
  function updHints() {
    const h = $('hints');
    if (!S.hints.length) { h.innerHTML = ''; return; }
    const d = ['_', '_', '_', '_', '_']; S.hints.forEach(o => d[o.pos] = o.digit);
    h.innerHTML = '密碼線索：<b style="font-family:monospace;font-size:18px;letter-spacing:4px">' + d.join('') + '</b>';
  }

  // ---------- 效果 ----------
  function applyFx(m) {
    if (m.k === 'flicker') {
      for (let i = m.a; i <= m.b; i++) S.flick[i] = { until: S.t + m.dur, col: m.col, v: 1, nx: 0 };
      if (Math.abs(S.me.room - m.b) <= 5 && S.me.alive) { Snd.flick(); shake = Math.max(shake, 0.15); }
    }
    if (m.k === 'chase') {
      S.chase = !!m.on;
      if (m.on) { big('快跑！', 2.2); if (!S.chaseLoop) { S.chaseLoop = Snd.loop('seek'); S.chaseLoop.vol(0.35); } }
      else { if (S.chaseLoop) { S.chaseLoop.stop(); S.chaseLoop = null; } Snd.slam(); msg('你們逃過了追獵者…'); }
    }
    if (m.k === 'figure' && m.on) msg('有東西在附近… 蹲下慢慢走（C / 蹲）', 4);
  }

  // ---------- 怪物顯示 ----------
  function applyEnts(list) {
    const seen = new Set();
    for (const a of list) {
      const [id, kind, x, y, z, ry] = a; seen.add(id);
      let v = S.ents.get(id);
      if (!v) {
        v = { m: Ents.model(kind), kind, x, z, tx: x, tz: z, ry, y, loop: Snd.loop(kind === 'ambush' ? 'ambush' : kind === 'rush' ? 'rush' : kind === 'figure' ? 'figure' : kind === 'seek' ? 'rush' : 'drone') };
        v.m.position.set(x, kind === 'rush' || kind === 'ambush' ? 1.7 : 0, z); scene.add(v.m); S.ents.set(id, v);
        if (kind === 'seek') { big('快跑！', 2); }
      }
      v.tx = x; v.tz = z; v.ry = ry; v.y = y;
    }
    for (const [id, v] of S.ents) if (!seen.has(id)) { scene.remove(v.m); v.loop.stop(); S.ents.delete(id); }
  }
  function updEnts(dt) {
    for (const [, v] of S.ents) {
      const fast = v.kind === 'rush' || v.kind === 'ambush';
      if (Math.hypot(v.tx - v.x, v.tz - v.z) > (fast ? 18 : 6)) { v.x = v.tx; v.z = v.tz; }
      const k = Math.min(1, dt * (fast ? 14 : 10)); v.x += (v.tx - v.x) * k; v.z += (v.tz - v.z) * k;
      v.m.position.x = v.x; v.m.position.z = v.z;
      if (fast) v.m.position.y = 1.7 + Math.sin(S.t * 30) * 0.05;
      v.m.rotation.y = v.ry; Ents.animate(v.m, S.t);
      const d = Math.hypot(cam.position.x - v.x, cam.position.z - v.z);
      if (fast) { v.loop.vol(Math.pow(clamp(1 - d / 55, 0, 1), 2) * 1.4); if (d < 16) shake = Math.max(shake, (1 - d / 16) * 0.5); }
      else if (v.kind === 'seek') v.loop.vol(clamp(1 - d / 30, 0, 1) * 0.6);
      else if (v.kind === 'figure') v.loop.vol(clamp(1 - d / 28, 0, 1) * (v.y ? 1.2 : 0.7));
    }
  }

  // ---------- 隊友模型 ----------
  function makeAvatar(p) {
    const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: c });
    const b = (w, h, d, m, x, y, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, y, z); g.add(q); return q; };
    const skin = L(0xf2c94c), shirt = L(new THREE.Color(p.color)), pants = L(0x24345e);
    b(0.8, 0.8, 0.42, shirt, 0, 1.2, 0); b(0.48, 0.48, 0.48, skin, 0, 1.86, 0);
    b(0.08, 0.08, 0.02, L(0x111111), -0.1, 1.9, -0.25); b(0.08, 0.08, 0.02, L(0x111111), 0.1, 1.9, -0.25); b(0.2, 0.04, 0.02, L(0x111111), 0, 1.76, -0.25);
    p.arms = [b(0.36, 0.8, 0.36, skin, -0.6, 1.2, 0), b(0.36, 0.8, 0.36, skin, 0.6, 1.2, 0)];
    p.legs = [b(0.38, 0.8, 0.38, pants, -0.2, 0.4, 0), b(0.38, 0.8, 0.38, pants, 0.2, 0.4, 0)];
    p.arms.concat(p.legs).forEach(q => { q.geometry.translate(0, -0.35, 0); q.position.y += 0.35; });
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
    x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(0, 8, 256, 48); x.fillStyle = p.color; x.fillText(p.name, 128, 44);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.scale.set(1.4, 0.35, 1); sp.position.y = 2.45; g.add(sp);
    g.scale.setScalar(0.85); scene.add(g); p.model = g; p.walk = 0;
  }
  function removeAvatar(p) { if (p.model) { scene.remove(p.model); p.model = null; } }
  function updAvatars(dt) {
    for (const id in S.players) {
      const p = S.players[id]; if (id === S.myId || !p.model) continue;
      const ox = p.x, oz = p.z; const k = Math.min(1, dt * 10);
      p.x += (p.tx - p.x) * k; p.z += (p.tz - p.z) * k;
      const sp = Math.hypot(p.x - ox, p.z - oz) / Math.max(dt, 1e-3);
      p.walk += sp * dt * 2.2; const sw = Math.sin(p.walk) * Math.min(1, sp / 3) * 0.7;
      p.arms[0].rotation.x = sw; p.arms[1].rotation.x = -sw; p.legs[0].rotation.x = -sw; p.legs[1].rotation.x = sw;
      p.model.position.set(p.x, (p.flags & 2) ? -0.35 : 0, p.z); p.model.rotation.y = p.yaw || 0;
      p.model.visible = !(p.flags & 1) && p.alive !== false && !(p.flags & 8) && !p.esc && !(p.flags & 16);
    }
  }

  // ---------- 玩家 ----------
  const tmpV = new THREE.Vector3();
  function colsNear(room) {
    const out = [], W = S.world;
    for (let i = Math.max(0, room - 1); i <= Math.min(100, room + 1); i++) {
      const R = W.rooms[i]; for (const c of R.cols) out.push(c);
      R.exits.forEach((e, k) => {
        const open = e.real && e.num <= S.latest;
        if (!open) { const w = e.wide ? 3.4 : World.DW; out.push([e.x - w / 2, e.x + w / 2, R.z1, R.z1 + WT]); }
      });
    }
    return out;
  }
  function collide(x, z, r, cols) {
    for (let it = 0; it < 3; it++) {
      for (const c of cols) {
        const cx = clamp(x, c[0], c[1]), cz = clamp(z, c[2], c[3]); let dx = x - cx, dz = z - cz; const d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (d2 > 1e-9) { const d = Math.sqrt(d2); x += dx / d * (r - d); z += dz / d * (r - d); }
          else { const pl = x - c[0], pr = c[1] - x, pb = z - c[2], pf = c[3] - z, mn = Math.min(pl, pr, pb, pf); if (mn === pl) x = c[0] - r; else if (mn === pr) x = c[1] + r; else if (mn === pb) z = c[2] - r; else z = c[3] + r; }
        }
      }
    }
    return [x, z];
  }
  function updMe(dt) {
    const M = S.me, W = S.world;
    const sens = 0.0022 * CFG.sens;
    if (!M.hidden) { M.yaw -= look.dx * sens; M.pitch = clamp(M.pitch - look.dy * sens, -1.45, 1.45); }
    else { M.hyaw = clamp((M.hyaw || 0) - look.dx * sens, -0.7, 0.7); M.pitch = clamp(M.pitch - look.dy * sens, -0.5, 0.5); }
    look.dx = look.dy = 0;
    if (!M.alive || M.esc) return;
    M.boost = Math.max(0, M.boost - dt);
    let f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyD || keys.ArrowRight) s += 1; if (keys.KeyA || keys.ArrowLeft) s -= 1;
    f -= joy.y; s += joy.x;
    const il = Math.hypot(f, s); if (il > 1) { f /= il; s /= il; }
    M.moving = false;
    if (M.hidden) return;
    const R = W.rooms[M.room];
    let sp = M.crouch ? 2.3 : 4.6;
    if (S.chase && R.type === 'chase') sp = M.crouch ? 3 : 6.6;
    if (M.boost > 0) sp *= 1.45;
    const fx = -Math.sin(M.yaw), fz = -Math.cos(M.yaw), rx = Math.cos(M.yaw), rz = -Math.sin(M.yaw);
    let nx = M.x + (fx * f + rx * s) * sp * dt, nz = M.z + (fz * f + rz * s) * sp * dt;
    [nx, nz] = collide(nx, nz, 0.3, colsNear(M.room));
    const moved = Math.hypot(nx - M.x, nz - M.z) / dt;
    M.x = nx; M.z = nz; M.moving = moved > 1.5 && Math.hypot(f, s) > 0.2;
    M.room = World.roomAt(W.rooms, M.z);
    if (M.moving) { M.bob += dt * sp * 2.1; M.stepT -= dt * sp; if (M.stepT <= 0) { M.stepT = 2.6; Snd.step(M.crouch ? 0.015 : 0.05); } }
    // 自動開門
    const LR = W.rooms[Math.min(100, S.latest)];
    if (S.latest <= 100 && M.room === S.latest && LR.type !== 'dupe') {
      const e = LR.exit, d = Math.hypot(M.x - e.x, M.z - (LR.z1 + WT));
      if (d < (e.wide ? 3.2 : 2.5)) {
        if (LR.lockId && S.obj[LR.lockId]) {
          setPrompt(LR.type === 'library' ? '門鎖住了：用出口旁的密碼鎖' : LR.type === 'final' ? '大門鎖住了：先拉下 3 個拉桿' : '門鎖住了：找到鑰匙');
          if (S.t - S.lastDeny > 2) { S.lastDeny = S.t; Snd.deny(); }
        } else requestOpen(S.latest + 1);
      }
    }
    // 逃脫
    if (M.room === 100 && M.z < W.rooms[100].z1 - 3) escape();
  }
  function escape() {
    const M = S.me; if (M.esc) return; M.esc = true; Snd.win(); big('逃出去了！', 3);
    GOLD += 100; S.earned += 100; updGold();
    if (S.net === 'client') Net.send('host', { t: 'esc' }); else hostEsc(S.myId);
    if (S.players[S.myId]) S.players[S.myId].esc = true;
    setTimeout(() => { if (S.st === 'play' && !S.over) startSpectate(); }, 2500);
  }
  let promptTxt = '';
  function setPrompt(t) { promptTxt = t; }

  // ---------- 互動 ----------
  function candidates() {
    const out = [], W = S.world, M = S.me;
    for (let i = Math.max(0, M.room - 1); i <= Math.min(100, M.room + 1); i++) {
      const R = W.rooms[i];
      for (const o of R.objs) {
        if (o.kind === 'closet' || ((o.kind === 'drawer' || o.kind === 'key' || o.kind === 'book' || o.kind === 'lever') && !S.obj[o.id]) || (o.kind === 'padlock' && S.obj[R.lockId])) out.push({ R, o });
      }
      if (R.type === 'dupe' && i <= S.latest) R.exits.forEach((e, k) => { if (!(e.real && e.num <= S.latest) && !S.dupeUsed[i + ':' + k]) out.push({ R, o: { kind: 'dupedoor', id: i + ':' + k, x: e.x, y: 1.3, z: R.z1 + WT + 0.1, e } }); });
    }
    return out;
  }
  const LABEL = { closet: '躲進衣櫃', drawer: '打開抽屜', key: '拿鑰匙', book: '拿起書', lever: '拉下拉桿', padlock: '輸入密碼', dupedoor: '開門' };
  function findTarget() {
    if (S.me.hidden) return null;
    const dir = cam.getWorldDirection(tmpV); let best = null, bs = -1e9;
    for (const c of candidates()) {
      const o = c.o, dx = o.x - cam.position.x, dy = o.y - cam.position.y, dz = o.z - cam.position.z, d = Math.hypot(dx, dy, dz);
      if (d > 2.5) continue;
      const dot = (dx * dir.x + dy * dir.y + dz * dir.z) / d; if (dot < 0.55) continue;
      const sc = dot * 2 - d * 0.3; if (sc > bs) { bs = sc; best = c; }
    }
    return best;
  }
  let target = null;
  function act(k) {
    const M = S.me;
    if (!M || !M.alive || M.esc) return;
    if (k === 'c') { M.crouch = !M.crouch; updInv(); return; }
    if (k === 'f') { if (S.inv.flash || S.inv.lighter) { M.light = !M.light; Snd.click(); updInv(); } else msg('你沒有光源（可在商店買打火機或手電筒）'); return; }
    if (k === 'v') { if (S.inv.vit > 0) { S.inv.vit--; M.boost = 12; Snd.vit(); msg('吃了維他命，速度提升！'); updInv(); } else msg('沒有維他命'); return; }
    if (k !== 'e') return;
    if (M.hidden) { const o = M.hidden; M.hidden = null; M.x = o.x + o.n * 0.55; M.z = o.z; M.yaw = o.n > 0 ? -Math.PI / 2 : Math.PI / 2; Snd.closet(); $('hideOv').classList.remove('on'); return; }
    const t = target; if (!t) return;
    const o = t.o;
    if (o.kind === 'closet') { M.hidden = o; M.hyaw = 0; M.pitch = 0; Snd.closet(); $('hideOv').classList.add('on'); return; }
    if (o.kind === 'padlock') { openKeypad(o); return; }
    if (o.kind === 'dupedoor') {
      if (o.e.real) { requestOpen(o.e.num); return; }
      S.dupeUsed[o.id] = 1; Snd.door(); setTimeout(() => { jumpscare('dupe'); hurt(30, 'dupe'); setTimeout(() => Snd.slam(), 400); }, 150); return;
    }
    requestAct(o.id);
  }
  // 密碼鎖
  function openKeypad(o) {
    S.kpObj = o; S.kp = ''; $('kpShow').textContent = '_____'; $('kpMsg').textContent = ''; show('keypad'); if (locked) document.exitPointerLock();
  }
  function closeKeypad() { S.kpObj = null; hideAll(); if (!TOUCH && S.st === 'play') lockPtr(); }
  (() => {
    const K = $('kpKeys');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'C'].forEach(c => {
      const b = document.createElement('button'); b.textContent = c;
      b.onclick = () => { Snd.click(); if (c === '←') S.kp = S.kp.slice(0, -1); else if (c === 'C') S.kp = ''; else if (S.kp.length < 5) S.kp += c; $('kpShow').textContent = (S.kp + '_____').slice(0, 5); };
      K.appendChild(b);
    });
    $('kpOk').onclick = () => { if (!S.kpObj || S.kp.length < 5) return; if (S.net === 'client') Net.send('host', { t: 'code', id: S.kpObj.id, code: S.kp }); else hostCode(S.myId, S.kpObj.id, S.kp); };
    $('kpX').onclick = () => closeKeypad();
  })();

  // ---------- 受傷 / 死亡 ----------
  function hurt(n, cause) {
    const M = S.me; if (!M.alive || M.esc) return;
    M.hp -= n; flash('#a00', 0.5); shake = Math.max(shake, 0.3); Snd.hurt();
    if (M.hp <= 0) die(cause, false);
    updHp();
  }
  const HINT = {
    rush: '燈光閃爍、聽到轟隆聲時，代表狂嘯要來了。馬上躲進衣櫃！',
    ambush: '燈光變綠代表回馬槍。它會來回衝好幾次，躲好，等聲音完全消失再出來。',
    screech: '在黑暗房間聽到「噓」的聲音，就轉頭找到它、看著它。帶打火機或手電筒會更安全。',
    eyes: '千眼出現時不要看它！低頭或背對它走過去。',
    halt: '看到「轉身！」就往回走，等逆行者消失再往前。',
    seek: '追獵者出現就一直往前跑，從障礙物的缺口鑽過去，不要停。',
    figure: '盲魔看不見，但聽得到腳步聲。蹲下慢慢走，或躲進衣櫃。',
    dupe: '門牌號碼要看清楚，只有「下一個號碼」才是真的門。',
    spider: '抽屜蛛只是愛嚇人，運氣不好而已。',
  };
  function die(cause, fromHost) {
    const M = S.me; if (!M.alive) return;
    M.alive = false; M.hp = 0; M.hidden = null; $('hideOv').classList.remove('on'); updHp();
    if (S.players[S.myId]) S.players[S.myId].alive = false;
    Snd.death(); flash('#000', 1); jumpscare(cause === 'figure' || cause === 'seek' || cause === 'rush' || cause === 'ambush' ? cause : null);
    if (!fromHost) { if (S.net === 'client') Net.send('host', { t: 'dead', cause }); else { Net.bcast({ t: 'dead', id: S.myId, cause }); } }
    $('dCause').textContent = '你被「' + (Ents.NAMES[cause] || '怪物') + '」殺死了。走到第 ' + pad(M.room) + ' 門。';
    $('dHint').textContent = HINT[cause] || '';
    const alive = Object.values(S.players).some(p => p.id !== S.myId && p.alive && !p.esc);
    $('bSpec').classList.toggle('hide', !alive);
    setTimeout(() => { if (S.st === 'play' && !S.over) { show('dead'); if (locked) document.exitPointerLock(); } }, 900);
  }
  $('bSpec').onclick = () => { hideAll(); startSpectate(); };
  function startSpectate() {
    const alive = Object.values(S.players).filter(p => p.id !== S.myId && p.alive && !p.esc);
    if (!alive.length) { $('specBar').classList.add('hide'); return; }
    if (!alive.find(p => p.id === S.spec)) S.spec = alive[0].id;
    $('specBar').classList.remove('hide'); $('specName').textContent = '觀戰：' + S.players[S.spec].name; $('touch').classList.add('hide');
  }
  $('bNext').onclick = () => { const alive = Object.values(S.players).filter(p => p.id !== S.myId && p.alive && !p.esc); if (!alive.length) return; const i = alive.findIndex(p => p.id === S.spec); S.spec = alive[(i + 1) % alive.length].id; startSpectate(); };
  function endGame(win) {
    if (S.over) return; S.over = true;
    const M = S.me;
    $('eTitle').textContent = M.esc ? '你逃出了百門飯店！' : win ? '隊友逃出去了！' : '全員陣亡…';
    $('eTitle').classList.toggle('red', !win);
    $('eInfo').innerHTML = '最遠到達：第 ' + pad(Math.min(100, S.latest)) + ' 門<br>這局獲得金幣：' + S.earned + '<br>（金幣可以在商店買道具）';
    setTimeout(() => { show('end'); $('specBar').classList.add('hide'); if (locked) document.exitPointerLock(); }, 1200);
  }

  // ---------- 嚇人畫面 ----------
  const JS = {};
  function jumpscare(kind) {
    if (!kind) return;
    const m = JS[kind] || (JS[kind] = Ents.model(kind)); m.position.set(0, kind === 'figure' || kind === 'seek' ? -2.6 : -0.05, kind === 'spider' ? -0.55 : -1.1);
    m.rotation.set(0, 0, 0); m.scale.setScalar(kind === 'spider' ? 1.2 : 1); cam.add(m); Snd.sting(); shake = 0.6;
    setTimeout(() => cam.remove(m), 650);
  }

  // ---------- 本地怪物：千眼 / 暗嘶 / 逆行者 ----------
  function updLocalMonsters(dt) {
    const M = S.me, W = S.world, R = W.rooms[M.room];
    const alive = M.alive && !M.esc;
    const dir = cam.getWorldDirection(tmpV);
    // 千眼
    let ed = 1e9;
    for (const [i, B] of S.built) {
      if (!B.eyes) continue; const E = W.rooms[i].eyesPos;
      const dx = E.x - cam.position.x, dy = E.y - cam.position.y, dz = E.z - cam.position.z, d = Math.hypot(dx, dy, dz); ed = Math.min(ed, d);
      B.eyes.rotation.y += dt * 0.6; Ents.animate(B.eyes, S.t);
      if (!alive || M.hidden || d > 22 || Math.abs(M.room - i) > 1 || (M.room < i && S.latest < i)) continue;
      const dot = (dx * dir.x + dy * dir.y + dz * dir.z) / d;
      if (dot > 0.86) { M.eyesDmg = (M.eyesDmg || 0) + dt * 26; $('tint').style.background = 'rgba(120,0,200,.25)'; if (M.eyesDmg >= 5) { hurt(Math.floor(M.eyesDmg), 'eyes'); M.eyesDmg = 0; } }
    }
    if (ed < 30) { if (!S.eyesLoop) S.eyesLoop = Snd.loop('eyes'); S.eyesLoop.vol(clamp(1 - ed / 25, 0, 1) * 0.5); }
    else if (S.eyesLoop) { S.eyesLoop.stop(); S.eyesLoop = null; }
    // 暗嘶
    if (S.scr) {
      const s = S.scr; s.t -= dt;
      const p = s.m.position; p.set(M.x + Math.sin(s.a) * 2.2, 1.9 + Math.sin(S.t * 3) * 0.1, M.z + Math.cos(s.a) * 2.2); s.m.lookAt(cam.position.x, cam.position.y, cam.position.z); s.m.rotateY(Math.PI);
      Ents.animate(s.m, S.t);
      const dx = p.x - cam.position.x, dy = p.y - cam.position.y, dz = p.z - cam.position.z, d = Math.hypot(dx, dy, dz);
      if (!alive || M.hidden || !R.dark) { scene.remove(s.m); S.scr = null; }
      else if ((dx * dir.x + dy * dir.y + dz * dir.z) / d > 0.8) { scene.remove(s.m); S.scr = null; Snd.psst(); msg('暗嘶跑掉了'); }
      else if (s.t <= 0) { scene.remove(s.m); S.scr = null; jumpscare('screech'); hurt(40, 'screech'); }
    } else if (alive && !M.hidden && R.dark) {
      S.scT -= dt * (M.light ? 0.35 : 1);
      if (S.scT <= 0) { S.scT = 9 + Math.random() * 14; const m = Ents.model('screech'); scene.add(m); S.scr = { m, t: 2.8, a: M.yaw + (Math.random() - 0.5) * 2.2 }; Snd.psst(); }
    }
    // 逆行者
    if (alive && R.type === 'halt') {
      $('tint').style.background = 'rgba(0,120,255,.16)';
      const H = S.halt || (S.halt = { phase: 'wait', t: 2.5, m: null });
      if (H.phase === 'wait') { H.t -= dt; if (H.t <= 0 && M.z > R.z1 + 12) { H.phase = 'come'; H.t = 2.4; H.m = Ents.model('halt'); H.x = R.cx; H.z = M.z - 9; scene.add(H.m); big('轉身！', 1.8); Snd.halt(); } }
      else {
        H.t -= dt; H.z += 4.2 * dt; H.m.position.set(H.x, 0, H.z); H.m.rotation.y = 0; H.m.visible = Math.random() > 0.08;
        if (!M.hidden && Math.hypot(M.x - H.x, M.z - H.z) < 1.1) { hurt(35, 'halt'); scene.remove(H.m); H.phase = 'wait'; H.t = 3; }
        else if (H.t <= 0) { scene.remove(H.m); H.phase = 'wait'; H.t = 2.5 + Math.random() * 3; }
      }
    } else { if (S.halt) { if (S.halt.m) scene.remove(S.halt.m); S.halt = null; } }
    if (!(alive && R.type === 'halt')) { if (M.eyesDmg === undefined || M.eyesDmg === 0 || ed > 22) $('tint').style.background = S.chase && R.type === 'chase' ? 'rgba(160,0,0,.12)' : ''; }
  }

  // ---------- 燈光 ----------
  const _lamps = [];
  const GREEN = new THREE.Color(0x60ff70), TMP = new THREE.Color();
  function flickVal(i) {
    const f = S.flick[i]; if (!f) return 1;
    if (S.t > f.until) { delete S.flick[i]; return 1; }
    if (S.t > f.nx) { f.v = Math.random() < 0.4 ? 0.05 : 0.6 + Math.random() * 0.6; f.nx = S.t + 0.04 + Math.random() * 0.12; }
    return f.v;
  }
  function updLights() {
    _lamps.length = 0;
    const cx = cam.position.x, cz = cam.position.z;
    for (const [i, B] of S.built) {
      const R = S.world.rooms[i], fv = flickVal(i), fl = S.flick[i];
      const base = R.type === 'halt' ? 0x7fd4ff : R.type === 'chase' && S.chase ? 0xff6a50 : 0xffe2a8;
      TMP.setHex(base); if (fl && fl.col) TMP.lerp(GREEN, 0.7); TMP.multiplyScalar(fv); B.lampMat.color.copy(TMP);
      for (const L of R.lamps) { const d = Math.hypot(L.x - cx, L.z - cz); if (d < 34) _lamps.push({ L, d, fv: L.eyes ? 1 : fv, g: fl && fl.col && !L.eyes, chase: R.type === 'chase' && S.chase && !L.eyes }); }
    }
    _lamps.sort((a, b) => a.d - b.d);
    for (let k = 0; k < POOL.length; k++) {
      const P = POOL[k], c = _lamps[k];
      if (!c) { P.intensity = 0; continue; }
      P.position.set(c.L.x, c.L.y - 0.3, c.L.z); P.color.setHex(c.chase ? 0xff5a40 : c.L.c); if (c.g) P.color.lerp(GREEN, 0.7);
      P.intensity = c.L.I * c.fv; P.distance = c.L.out ? 30 : c.L.eyes ? 9 : c.L.I < 6 ? 6 : 15;
    }
    const M = S.me, on = M.light && M.alive && !M.esc && !M.hidden;
    spot.intensity = on && S.inv.flash ? 40 : 0; myLight.intensity = on && !S.inv.flash && S.inv.lighter ? 10 + Math.sin(S.t * 20) * 1.2 : 0;
    const R = S.world.rooms[focusRoom()];
    hemi.intensity = R.dark ? 0.05 : R.type === 'final' ? 0.35 : 0.42;
  }

  // ---------- HUD ----------
  function updHp() { $('hp').style.width = Math.max(0, S.me.hp) + '%'; }
  function updInv() {
    const I = S.inv, M = S.me, a = [];
    if (I.flash) a.push(`<div class="${M.light ? 'on' : ''}">手電筒 [F]</div>`); else if (I.lighter) a.push(`<div class="${M.light ? 'on' : ''}">打火機 [F]</div>`);
    a.push(`<div>維他命 ×${I.vit} [V]</div>`); if (M.crouch) a.push('<div class="on">蹲下中 [C]</div>'); if (M.boost > 0) a.push('<div class="on">加速中</div>');
    $('inv').innerHTML = a.join('');
    document.querySelectorAll('#tbtns button').forEach(b => { b.classList.toggle('on', (b.dataset.k === 'c' && M.crouch) || (b.dataset.k === 'f' && M.light)); });
  }
  function updTeam() {
    if (S.net === 'solo') { $('team').innerHTML = ''; return; }
    $('team').innerHTML = Object.values(S.players).map(p => {
      const me = p.id === S.myId, alive = me ? S.me.alive : p.alive, esc = me ? S.me.esc : p.esc;
      const st = esc ? '已逃出' : !alive ? '死亡' : '門 ' + pad(me ? S.me.room : (p.room || 0));
      return `<span style="color:${p.color}">${p.name}${me ? '（你）' : ''}</span> · ${st}`;
    }).join('<br>');
  }

  // ---------- 主迴圈 ----------
  let last = performance.now(), netT = 0, hudT = 0, wasBoost = false;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    if (S.st !== 'play') { S.t += dt; renderer.render(scene, cam); return; }
    tick(dt);
    renderer.render(scene, cam);
  }
  // 分頁在背景時（rAF 停止）主機仍持續運算，避免隊友卡住
  setInterval(() => { if (document.hidden && S.st === 'play' && S.net !== 'solo') { last = performance.now(); tick(0.1); } }, 100);
  function tick(dt) {
    S.t += dt;
    const M = S.me, W = S.world;
    setPrompt('');
    updMe(dt);
    // 相機
    if (M.alive && !M.esc) {
      if (M.hidden) { const o = M.hidden; cam.position.set(o.hx + o.n * 0.15, 1.5, o.hz); cam.rotation.set(M.pitch, (o.n > 0 ? -Math.PI / 2 : Math.PI / 2) + (M.hyaw || 0), 0); }
      else { cam.position.set(M.x, (M.crouch ? 1.0 : 1.6) + Math.sin(M.bob) * 0.04, M.z); cam.rotation.set(M.pitch, M.yaw, 0); }
    } else {
      const p = S.players[S.spec];
      if (p && p.alive && !p.esc) { const y = p.yaw || 0; tmpV.set(p.x + Math.sin(y) * 3, 2.6, p.z + Math.cos(y) * 3); cam.position.lerp(tmpV, Math.min(1, dt * 6)); cam.lookAt(p.x, 1.4, p.z); }
      else if (S.spec || (M.esc && Object.values(S.players).some(q => q.id !== S.myId && q.alive && !q.esc))) startSpectate();
      if (M.esc && !p) { cam.position.set(W.rooms[100].cx, 2, W.rooms[100].z1 - 12); cam.rotation.set(0.1, 0, 0); }
    }
    if (shake > 0) { cam.position.x += (Math.random() - .5) * shake * 0.15; cam.position.y += (Math.random() - .5) * shake * 0.15; shake = Math.max(0, shake - dt * 1.5); }
    cam.updateMatrixWorld();
    ensureBuilt();
    // 門動畫
    for (const [, B] of S.built) for (const D of B.doors) if (D && D.open !== D.target) { D.open = Math.min(D.target, D.open + dt * 2.6); poseDoor(D); }
    for (const [i, B] of S.built) for (const o of S.world.rooms[i].objs) { if (o.kind === 'drawer') { const m = B.objs[o.id]; if (m && m.userData.open && m.position.x !== m.userData.bx + o.n * 0.36) { const tx = m.userData.bx + o.n * 0.36; m.position.x += (tx - m.position.x) * Math.min(1, dt * 10); } } }
    // 互動提示
    target = findTarget();
    if (M.hidden) setPrompt((TOUCH ? '按「互動」' : '[E] ') + '離開衣櫃');
    else if (target && !promptTxt) { const o = target.o; setPrompt((TOUCH ? '' : '[E] ') + LABEL[o.kind] + (o.kind === 'dupedoor' ? ' ' + pad(o.e.num) : '')); }
    // 主機模擬
    if (S.sim) { S.sim.update(dt); applyEnts(S.sim.snapshot()); hostCheckOver(); }
    updEnts(dt); updAvatars(dt); updLocalMonsters(dt); updLights();
    // 網路
    netT -= dt;
    if (netT <= 0 && S.net !== 'solo') {
      netT = 1 / 12;
      const flags = (M.hidden ? 1 : 0) | (M.crouch ? 2 : 0) | (M.moving ? 4 : 0) | (!M.alive ? 8 : 0) | (M.esc ? 16 : 0);
      const px = M.hidden ? M.hidden.hx : M.x, pz = M.hidden ? M.hidden.hz : M.z;
      const pose = [+px.toFixed(2), +pz.toFixed(2), +M.yaw.toFixed(2), +M.pitch.toFixed(2), flags, Math.max(0, M.hp | 0), M.room];
      if (S.net === 'client') Net.send('host', { t: 'pose', p: pose });
      else {
        const P = {}; P[S.myId] = pose; for (const id in S.players) if (id !== S.myId) { const p = S.players[id]; P[id] = [p.tx, p.tz, p.yaw, p.pitch, p.flags, p.hp, p.room]; }
        Net.bcast({ t: 'tick', p: P, e: S.sim.snapshot() });
      }
    }
    // HUD
    msgT -= dt; if (msgT <= 0) $('msg').textContent = ''; bigT -= dt; if (bigT <= 0) $('big').textContent = '';
    $('prompt').textContent = M.alive && !M.esc ? promptTxt : '';
    hudT -= dt; if (hudT <= 0) { hudT = 0.25; $('doorN').textContent = '門 ' + pad(focusRoom()); updTeam(); if ((M.boost > 0) !== wasBoost) { wasBoost = M.boost > 0; updInv(); } }
  }
  requestAnimationFrame(frame);

  // 測試用
  Object.assign(window.HD, {
    act, hostOpen, requestAct, applyFx, hurt, die,
    openTo(n) { for (let k = S.latest + 1; k <= n; k++) { const R = S.world.rooms[k - 1]; if (R.lockId) S.obj[R.lockId] = 0; hostOpen(k); } },
    tp(i, dz = 2) { const R = S.world.rooms[i]; S.me.x = R.entryX; S.me.z = R.z0 - WT - dz; S.me.room = i; S.me.yaw = 0; },
    target: () => target, cam,
  });
})();
