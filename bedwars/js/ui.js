'use strict';
// ===================== 音效（WebAudio 合成） =====================
const SFX = {
  ctx: null, vol: 0.5,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(f0, f1, dur, type, v) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), c.currentTime + dur);
    g.gain.setValueAtTime(v * this.vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  },
  noise(dur, v, lp) {
    const c = this.ctx; if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 2000;
    const g = c.createGain(); g.gain.value = v * this.vol;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  },
  play(name, v = 1) {
    if (!this.ctx || v <= 0) return;
    switch (name) {
      case 'hit': this.noise(0.08, 0.35 * v, 1500); this.tone(220, 120, 0.08, 'square', 0.08 * v); break;
      case 'hurt': this.tone(300, 150, 0.15, 'sawtooth', 0.2); break;
      case 'place': this.noise(0.05, 0.25 * v, 900); break;
      case 'break': this.noise(0.12, 0.35 * v, 1200); break;
      case 'pickup': this.tone(900, 1400, 0.06, 'triangle', 0.12); break;
      case 'buy': this.tone(700, 1100, 0.08, 'triangle', 0.2); setTimeout(() => this.tone(1100, 1500, 0.08, 'triangle', 0.2), 70); break;
      case 'boom': this.noise(0.6, 0.7 * v, 500); this.tone(120, 30, 0.5, 'sine', 0.5 * v); break;
      case 'fuse': this.noise(0.4, 0.15 * v, 4000); break;
      case 'throw': this.tone(500, 250, 0.12, 'sine', 0.15 * v); break;
      case 'pearl': this.tone(200, 900, 0.25, 'sine', 0.25 * v); break;
      case 'eat': this.noise(0.15, 0.25 * v, 700); break;
      case 'kill': this.tone(600, 900, 0.1, 'square', 0.15); setTimeout(() => this.tone(900, 1300, 0.12, 'square', 0.15), 90); break;
      case 'bed': this.tone(400, 200, 0.4, 'sawtooth', 0.2); break;
      case 'bedlost': this.tone(300, 80, 0.9, 'sawtooth', 0.35); break;
      case 'alarm': for (let i = 0; i < 3; i++) setTimeout(() => this.tone(880, 660, 0.2, 'square', 0.2), i * 250); break;
      case 'respawn': this.tone(500, 800, 0.2, 'triangle', 0.2); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, f, 0.3, 'triangle', 0.3), i * 150)); break;
      case 'lose': [400, 300, 200].forEach((f, i) => setTimeout(() => this.tone(f, f * 0.9, 0.4, 'sawtooth', 0.2), i * 220)); break;
    }
  },
};

// ===================== 介面 =====================
const $ = id => document.getElementById(id);
const UI = {
  game: null, shopKind: null, shopTab: 0, lastHot: '', lastSb: '', toastT: 0, titleT: 0, hudT: 0,
  bind(g) { this.game = g; this.lastHot = ''; this.lastSb = ''; $('feed').innerHTML = ''; this.title('', ''); },
  toast(html) { const t = $('toast'); t.innerHTML = html; t.style.opacity = 1; this.toastT = 2.2; },
  feed(html) {
    const f = $('feed');
    const d = document.createElement('div'); d.className = 'fl'; d.innerHTML = html;
    f.appendChild(d);
    while (f.children.length > 6) f.removeChild(f.firstChild);
    setTimeout(() => { d.style.opacity = 0; setTimeout(() => d.remove(), 600); }, 7000);
  },
  title(t, sub, color) {
    $('bigTitle').textContent = t || ''; $('bigTitle').style.color = color || '#fff';
    $('subTitle').textContent = sub || '';
    this.titleT = 3.5;
  },
  hurt() { const h = $('hurt'); h.style.opacity = 0.55; setTimeout(() => h.style.opacity = 0, 150); },
  icon(id, f, tier) {
    const it = ITEMS[id];
    let bg = '#666', txt = '', col = '#fff';
    if (id === 'sword') { bg = '#3a3a3a'; txt = '劍'; col = '#' + (SWORD_COLOR[tier || f.sword] || 0x9a7040).toString(16).padStart(6, '0'); }
    else if (id === 'pick' || id === 'axe') { bg = '#3a3a3a'; txt = id === 'pick' ? '鎬' : '斧'; col = '#' + (TOOL_COLOR[Math.max(1, tier || (id === 'pick' ? f.pick : f.axe))]).toString(16).padStart(6, '0'); }
    else if (id === 'armor') { bg = '#3a3a3a'; txt = '甲'; col = '#' + (ARMOR_COLOR[tier] || 0xaaaaaa).toString(16).padStart(6, '0'); }
    else if (it && it.block) { bg = '#' + (id === 'wool' ? TEAM_DEFS[f.team.id].wool : it.color).toString(16).padStart(6, '0'); txt = ''; }
    else if (it) { bg = '#2a2a2a'; col = '#' + it.color.toString(16).padStart(6, '0'); txt = { kbstick: '棒', fireball: '火', tnt: 'T', pearl: '珠', gapple: '蘋', egg: '蛋' }[id]; }
    return `<div class="ic${it && it.block ? ' blk' : ''}" style="background:${bg};color:${col}">${txt}</div>`;
  },
  // ---------- HUD ----------
  update(dt) {
    const g = this.game; if (!g) return;
    const p = g.player;
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) $('toast').style.opacity = 0; }
    if (this.titleT > 0) { this.titleT -= dt; if (this.titleT <= 0) { $('bigTitle').textContent = ''; $('subTitle').textContent = ''; } }
    // 血量
    const hp = Math.max(0, p.hp);
    let hh = '';
    for (let i = 0; i < 10; i++) { const v = hp - i * 2; hh += `<span class="ht ${v >= 2 ? 'f' : v >= 1 ? 'h' : 'e'}">♥</span>`; }
    if (p.absorb > 0) for (let i = 0; i < Math.ceil(p.absorb / 2); i++) hh += '<span class="ht ab">♥</span>';
    if ($('hearts').innerHTML !== hh) $('hearts').innerHTML = hh;
    // 挖掘進度
    const bs = g.breakState;
    $('breakbar').style.display = bs ? 'block' : 'none';
    if (bs) $('breakfill').style.width = Math.min(100, bs.t / bs.need * 100) + '%';
    // 重生倒數
    $('respawn').textContent = !p.alive && !p.eliminated ? `你死了！${Math.ceil(p.respawnT)} 秒後重生` : '';
    this.hudT -= dt;
    if (this.hudT > 0) return;
    this.hudT = 0.1;
    // 資源
    $('res').innerHTML = ['iron', 'gold', 'diamond', 'emerald'].map(r => `<div><span class="dot" style="background:${RES_CSS[r]}"></span>${RES_NAME[r]} <b>${p.res[r]}</b></div>`).join('') +
      `<div class="arm">護甲：${ARMOR_NAME[p.armor]}${p.team.up.prot ? ' +' + p.team.up.prot : ''}</div>`;
    // 快捷欄
    const hk = p.sel + '|' + p.sword + p.pick + p.axe + '|' + p.hotbar.map(s => s ? s.id + s.count : '-').join(',');
    if (hk !== this.lastHot) {
      this.lastHot = hk;
      $('hotbar').innerHTML = p.hotbar.map((s, i) => `<div class="slot${i === p.sel ? ' sel' : ''}">${s ? this.icon(s.id, p) + (s.count > 1 ? `<span class="cnt">${s.count}</span>` : '') : ''}<span class="key">${i + 1}</span></div>`).join('');
      const h = p.held();
      let nm = '';
      if (h) nm = h.id === 'sword' ? SWORD_NAME[p.sword] : h.id === 'pick' ? PICK_NAME[p.pick] : h.id === 'axe' ? AXE_NAME[p.axe] : ITEMS[h.id].name;
      $('itemName').textContent = nm;
    }
    // 計分板
    const mm = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const ev = EVENTS[g.eventIdx];
    let sb = `<div class="sbt">床戰 BED WARS</div><div class="sbs">${DIFF[g.difficulty].label}模式　${mm(g.time)}</div>`;
    if (ev) sb += `<div class="sbs">${ev.name}：${mm(Math.max(0, ev.t - g.time))}</div>`;
    sb += '<div class="sbl"></div>';
    for (const t of g.teams) {
      const alive = t.members.filter(m => !m.eliminated).length;
      const st = t.eliminated ? '<span style="color:#f55">✗</span>' : t.bedAlive ? '<span style="color:#5f5">✔</span>' : `<span style="color:#fd5">${alive}</span>`;
      sb += `<div class="sbr"><span style="color:${t.def.css}">■ ${t.name}</span> ${st}${t === p.team ? ' <span class="you">你</span>' : ''}</div>`;
    }
    sb += '<div class="sbl"></div>';
    sb += `<div class="sbs">擊殺：${p.stats.kills}　最終擊殺：${p.stats.finals}</div><div class="sbs">拆床：${p.stats.beds}</div>`;
    const mate = p.team.members.find(m => m !== p);
    if (mate) sb += `<div class="sbs">隊友 ${mate.name}：${mate.eliminated ? '已淘汰' : !mate.alive ? '重生中' : { defend: '防守', follow: '跟隨', attack: '進攻' }[mate.cmd]}　(G 切換)</div>`;
    if (sb !== this.lastSb) { this.lastSb = sb; $('scoreboard').innerHTML = sb; }
    // 商店開著時更新
    if (this.shopKind) this.renderShop();
  },
  // ---------- 商店 ----------
  openShop(kind) {
    this.shopKind = kind;
    $('shop').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    this.renderShop();
  },
  closeShop() {
    if (!this.shopKind) return;
    this.shopKind = null;
    $('shop').classList.add('hidden');
    requestLock();
  },
  renderShop() {
    const g = this.game, p = g.player;
    const resLine = ['iron', 'gold', 'diamond', 'emerald'].map(r => `<span style="color:${RES_CSS[r]}">${RES_NAME[r]} ${p.res[r]}</span>`).join('　');
    let html = '';
    if (this.shopKind === 'shop') {
      html += `<div class="shead"><b>道具商店</b><span>${resLine}</span><button class="x" onclick="UI.closeShop()">✕</button></div>`;
      html += '<div class="tabs">' + SHOP.map((c, i) => `<button class="${i === this.shopTab ? 'on' : ''}" onclick="UI.shopTab=${i};UI.renderShop()">${c.cat}</button>`).join('') + '</div>';
      html += '<div class="grid">';
      for (const it of SHOP[this.shopTab].items) {
        const st = g.shopState(p, it.key);
        const cost = g.shopCost(p, it.key);
        let name = it.name, tier = it.tier;
        if (it.key === 'pick') { name = p.pick < 4 ? `${PICK_NAME[p.pick + 1]}` : PICK_NAME[4]; tier = Math.min(4, p.pick + 1); }
        if (it.key === 'axe') { name = p.axe < 4 ? `${AXE_NAME[p.axe + 1]}` : AXE_NAME[4]; tier = Math.min(4, p.axe + 1); }
        const costTxt = st === 'owned' ? '已擁有' : `<span style="color:${RES_CSS[cost[1]]}">${cost[0]} ${RES_NAME[cost[1]]}</span>`;
        html += `<div class="card ${st}" onclick="UI.buy('${it.key}')">${this.icon(it.icon, p, tier)}<div class="cn">${name}</div><div class="cc">${costTxt}</div><div class="cd">${it.desc}</div></div>`;
      }
      html += '</div>';
    } else {
      html += `<div class="shead"><b>團隊升級</b><span>${resLine}</span><button class="x" onclick="UI.closeShop()">✕</button></div>`;
      html += '<div class="grid">';
      for (const u of UPGRADES) {
        const lv = p.team.up[u.key];
        const st = g.upgradeState(p, u.key);
        const costTxt = st === 'owned' ? (u.max > 1 ? '已滿級' : '已擁有') : `<span style="color:${RES_CSS.diamond}">${u.costs[lv]} 鑽石</span>`;
        html += `<div class="card ${st}" onclick="UI.upgrade('${u.key}')"><div class="ic" style="background:#2a2a40;color:#d79bff">${u.name[0]}</div><div class="cn">${u.name}${u.max > 1 ? ` <small>(${lv}/${u.max})</small>` : ''}</div><div class="cc">${costTxt}</div><div class="cd">${u.desc}</div></div>`;
      }
      html += '</div><div class="hint">鑽石在地圖四角的鑽石島收集</div>';
    }
    html += '<div class="hint">按 E 或 Esc 關閉</div>';
    const box = $('shopBox');
    if (box.dataset.h !== html) { box.innerHTML = html; box.dataset.h = html; }
  },
  buy(key) {
    const g = this.game;
    const st = g.shopState(g.player, key);
    if (st === 'poor') { this.toast('資源不足！'); SFX.play('hurt'); }
    else if (st === 'ok') g.buy(g.player, key);
    this.renderShop();
  },
  upgrade(key) {
    const g = this.game;
    const st = g.upgradeState(g.player, key);
    if (st === 'poor') { this.toast('鑽石不足！'); SFX.play('hurt'); }
    else if (st === 'ok') g.buyUpgrade(g.player, key);
    this.renderShop();
  },
  showEnd(win, text, g) {
    if (document.pointerLockElement) document.exitPointerLock();
    $('shop').classList.add('hidden'); this.shopKind = null;
    $('end').classList.remove('hidden');
    $('bigTitle').textContent = ''; $('subTitle').textContent = ''; $('respawn').textContent = '';
    $('endTitle').textContent = text || (win ? '勝利！' : '失敗…');
    $('endTitle').style.color = win ? '#ffd84a' : '#ff5555';
    const rows = g.fighters.slice().sort((a, b) => (b.stats.finals * 2 + b.stats.kills + b.stats.beds * 2) - (a.stats.finals * 2 + a.stats.kills + a.stats.beds * 2))
      .map(f => `<tr${f === g.player ? ' class="me"' : ''}><td style="color:${f.team.def.css}">${f.name}</td><td>${f.stats.kills}</td><td>${f.stats.finals}</td><td>${f.stats.beds}</td><td>${f.stats.deaths}</td></tr>`).join('');
    $('endStats').innerHTML = `<div class="sbs">遊戲時間 ${Math.floor(g.time / 60)} 分 ${Math.floor(g.time % 60)} 秒</div><table><tr><th>玩家</th><th>擊殺</th><th>最終擊殺</th><th>拆床</th><th>死亡</th></tr>${rows}</table>`;
  },
};

// ===================== 啟動與輸入 =====================
let renderer = null, game = null, lastT = 0, sens = 0.0022, curDiff = 'normal';
const canvas = $('c');

function initRenderer() {
  THREE.ColorManagement.enabled = false;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    if (game) { game.camera.aspect = innerWidth / innerHeight; game.camera.updateProjectionMatrix(); }
  });
}
function requestLock() { if (game && !game.over && !UI.shopKind) { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } }

function startGame(diff, testMode) {
  curDiff = diff || curDiff;
  SFX.init();
  const name = ($('pname').value || '玩家').slice(0, 10);
  try { localStorage.setItem('bw_name', name); } catch (e) { }
  if (game) game.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  game = new Game(renderer, { difficulty: curDiff, playerName: name, testMode });
  game.camera.aspect = innerWidth / innerHeight; game.camera.updateProjectionMatrix();
  UI.bind(game);
  window.__game = game;
  ['menu', 'end', 'pause', 'shop'].forEach(id => $(id).classList.add('hidden'));
  $('hud').classList.remove('hidden');
  UI.title('床戰開始！', '保護你的床，拆掉敵人的床！', '#ffd84a');
  UI.feed('提示：去基地後方的生成器收集鐵和金，到 <b style="color:#ffd84a">道具商店</b> 買羊毛和裝備');
  if (!testMode) requestLock();
}

function toMenu() {
  if (document.pointerLockElement) document.exitPointerLock();
  game = null; UI.game = null;
  ['end', 'pause', 'shop', 'hud'].forEach(id => $(id).classList.add('hidden'));
  $('menu').classList.remove('hidden');
}

document.addEventListener('pointerlockchange', () => {
  if (!game) return;
  if (document.pointerLockElement === canvas) { game.paused = false; $('pause').classList.add('hidden'); }
  else if (!UI.shopKind && !game.over && !game.testMode) { game.paused = true; $('pause').classList.remove('hidden'); game.input.keys = {}; game.input.mouseL = game.input.mouseR = false; }
});
canvas.addEventListener('mousedown', e => {
  if (!game) return;
  if (document.pointerLockElement !== canvas) { requestLock(); return; }
  game.onMouseDown(e.button);
});
addEventListener('mouseup', e => { if (game) game.onMouseUp(e.button); });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => {
  if (!game || document.pointerLockElement !== canvas) return;
  const t = game.spectator ? game.spec : game.player;
  t.yaw -= e.movementX * sens;
  t.pitch = Math.max(-1.55, Math.min(1.55, t.pitch - e.movementY * sens));
});
addEventListener('wheel', e => {
  if (!game || document.pointerLockElement !== canvas) return;
  const p = game.player;
  p.sel = (p.sel + (e.deltaY > 0 ? 1 : 8)) % 9;
}, { passive: true });
addEventListener('keydown', e => {
  if (!game) { if (e.code === 'Enter' && !$('menu').classList.contains('hidden')) startGame(); return; }
  if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
  if (e.code === 'KeyE') { if (UI.shopKind) UI.closeShop(); else if (game.player.alive) game.interact(); return; }
  if (e.code === 'Escape' && UI.shopKind) { UI.closeShop(); return; }
  if (UI.shopKind) return;
  game.input.keys[e.code] = true;
  if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 9) game.player.sel = n - 1; }
  if (e.code === 'KeyG') game.cycleMateCmd();
  if (e.code === 'KeyF') { const p = game.player; const h = p.held(); if (h && h.id === 'gapple') game.useGapple(p); }
});
addEventListener('keyup', e => { if (game) game.input.keys[e.code] = false; });
addEventListener('blur', () => { if (game) { game.input.keys = {}; game.input.mouseL = game.input.mouseR = false; } });

function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (!game) { renderMenuBg(dt); return; }
  if (!game.paused) game.update(dt);
  game.render(dt);
  UI.update(dt);
}

// 主選單背景：緩慢環繞地圖
let menuScene = null;
function renderMenuBg(dt) {
  if (!menuScene) menuScene = new Game(renderer, { difficulty: 'easy', testMode: true, menu: true });
  menuScene.update(dt);
  const a = performance.now() / 20000;
  menuScene.camera.position.set(CX + Math.cos(a) * 70, GROUND + 28, CZ + Math.sin(a) * 70);
  menuScene.camera.lookAt(CX, GROUND, CZ);
  menuScene.vm.visible = false;
  menuScene.mesher.update();
  for (const f of menuScene.fighters) if (f.model) {
    f.model.group.visible = f.alive;
    f.model.group.position.copy(f.pos); f.model.group.rotation.y = f.yaw;
  }
  renderer.render(menuScene.scene, menuScene.camera);
}

// 選單按鈕
document.querySelectorAll('.diff').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.diff').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); curDiff = b.dataset.d;
}));
$('startBtn').onclick = () => startGame();
$('resumeBtn').onclick = () => requestLock();
$('quitBtn').onclick = toMenu;
$('againBtn').onclick = () => startGame();
$('menuBtn').onclick = toMenu;
$('sens').oninput = e => { sens = 0.0006 + e.target.value * 0.00006; try { localStorage.setItem('bw_sens', e.target.value); } catch (er) { } };
$('vol').oninput = e => { SFX.vol = e.target.value / 100; };
try {
  const n = localStorage.getItem('bw_name'); if (n) $('pname').value = n;
  const s = localStorage.getItem('bw_sens'); if (s) { $('sens').value = s; sens = 0.0006 + s * 0.00006; }
} catch (e) { }

initRenderer();
requestAnimationFrame(loop);
