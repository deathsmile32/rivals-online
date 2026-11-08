// 灰鷹軍團 — 畫面流程：標題、世界地圖、部隊、扭蛋、戰鬥、存檔、音效。
'use strict';
(function (G) {
  const $ = id => document.getElementById(id);
  const D = G.D;
  const fmt = n => Math.round(n).toLocaleString('en-US');

  // ================= 存檔 =================
  const KEY = 'greyEagle.v1';
  const defSave = () => ({ cleared: [0, 0, 0], xp: 0, medals: 1500, units: { recruit: { lv: 1, plus: 0 } }, team: ['recruit'], baseLv: 0, cannonLv: 0, sound: true, draws: 0, gift: false });
  let S;
  function load() {
    try { S = Object.assign(defSave(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = defSave(); }
    S.team = S.team.filter(id => G.UNIT[id]);
    syncUnlocks();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 無痕模式存不了也沒關係 */ } }
  const owned = id => !!S.units[id];
  const effLv = id => S.units[id] ? S.units[id].lv + S.units[id].plus : 1;
  const formOf = id => (S.units[id] && S.units[id].lv >= 10) ? 1 : 0;
  const nameOf = id => G.UNIT[id].names[formOf(id)];
  // 推關卡解鎖基本角色、達成條件取得 EX 角色
  function syncUnlocks() {
    const got = [];
    for (const u of G.UNITS) {
      if (owned(u.id)) continue;
      const ok = (u.rar === 'basic' && S.cleared[0] >= u.unlock) || (u.rar === 'ex' && S.cleared[0] >= u.exNeed);
      if (ok) { S.units[u.id] = { lv: 1, plus: 0 }; got.push(u); if (S.team.length < 10) S.team.push(u.id); }
    }
    return got;
  }

  // ================= 音效（WebAudio 合成，不用音檔） =================
  const AU = { ctx: null, last: {}, noise: null };
  function ac() {
    if (!AU.ctx) {
      try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      const len = AU.ctx.sampleRate * 1.5, buf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      AU.noise = buf;
    }
    if (AU.ctx.state === 'suspended') AU.ctx.resume();
    return AU.ctx;
  }
  function noise(a, t, dur, f, gain, type) {
    const s = a.createBufferSource(); s.buffer = AU.noise;
    const fl = a.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = f;
    const g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t); s.stop(t + dur);
  }
  function tone(a, t, f1, f2, dur, gain, wave) {
    const o = a.createOscillator(); o.type = wave || 'square';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    const g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur);
  }
  const GAP = { shot: 0.06, hit: 0.07, boom: 0.09, big: 0.1, deploy: 0.05 };
  function sfx(n) {
    if (!S || !S.sound) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime;
    if (GAP[n] && AU.last[n] && t - AU.last[n] < GAP[n]) return;
    AU.last[n] = t;
    switch (n) {
      case 'shot': noise(a, t, 0.07, 2600, 0.12, 'highpass'); break;
      case 'hit': noise(a, t, 0.05, 1500, 0.08); break;
      case 'big': noise(a, t, 0.25, 900, 0.25); tone(a, t, 160, 50, 0.2, 0.12, 'triangle'); break;
      case 'boom': noise(a, t, 0.45, 500, 0.3); tone(a, t, 90, 30, 0.35, 0.18, 'sine'); break;
      case 'deploy': tone(a, t, 520, 780, 0.08, 0.08); break;
      case 'wallet': tone(a, t, 880, 880, 0.08, 0.08); tone(a, t + 0.08, 1320, 1320, 0.12, 0.08); break;
      case 'cannon': noise(a, t, 1.0, 700, 0.45); tone(a, t, 300, 40, 0.9, 0.2, 'sawtooth'); break;
      case 'boss': for (let i = 0; i < 3; i++) tone(a, t + i * 0.32, 440, 330, 0.28, 0.12, 'sawtooth'); break;
      case 'bossdown': [523, 659, 784].forEach((f, i) => tone(a, t + i * 0.1, f, f, 0.15, 0.1)); break;
      case 'freeze': tone(a, t, 1800, 400, 0.6, 0.08, 'sine'); noise(a, t, 0.6, 4000, 0.08, 'highpass'); break;
      case 'legend': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, t + i * 0.08, f, f, 0.25, 0.09, 'triangle')); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(a, t + i * 0.14, f, f, i === 3 ? 0.6 : 0.16, 0.12)); break;
      case 'lose': [392, 330, 262].forEach((f, i) => tone(a, t + i * 0.25, f, f * 0.97, 0.3, 0.12, 'triangle')); break;
      case 'click': tone(a, t, 700, 700, 0.04, 0.05); break;
      case 'cap': tone(a, t, 300, 900, 0.18, 0.08, 'triangle'); break;
      case 'capGold': [784, 988, 1175, 1568].forEach((f, i) => tone(a, t + i * 0.07, f, f, 0.2, 0.09, 'triangle')); break;
    }
  }

  function toast(msg) {
    const d = document.createElement('div'); d.textContent = msg; $('toast').appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }

  // ================= 畫面切換 =================
  const SCREENS = ['title', 'map', 'army', 'gacha', 'help'];
  let cur = 'title', backTo = 'title', mapCh = 0;
  function show(id, opt) {
    cur = id;
    for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
    $('battle').classList.toggle('hidden', id !== 'battle');
    $('topbar').classList.toggle('hidden', id === 'title' || id === 'battle');
    const titles = { map: '🗺️ 世界篇', army: '🪖 部隊', gacha: '🎰 扭蛋', help: '📖 說明' };
    $('tbTitle').textContent = titles[id] || '';
    backTo = (opt && opt.back) || 'title';
    refreshRes();
    if (id === 'title') { renderTitle(); startTitleAnim(); }
    if (id === 'map') renderMap();
    if (id === 'army') renderArmy();
    if (id === 'gacha') renderGacha();
  }
  function refreshRes() {
    $('resMedal').textContent = fmt(S.medals); $('resXp').textContent = fmt(S.xp);
    $('tMedal').textContent = fmt(S.medals); $('tXp').textContent = fmt(S.xp);
  }
  $('tbBack').onclick = () => { sfx('click'); show(backTo === cur ? 'title' : backTo); };

  // ================= 標題 =================
  function renderTitle() {
    const c = S.cleared;
    $('tProg').textContent = c[2] ? `第三章 ${c[2]}/40` : c[1] ? `第二章 ${c[1]}/40` : `第一章 ${c[0]}/40`;
  }
  let titleRaf = 0;
  const titleUnits = [];
  function startTitleAnim() {
    cancelAnimationFrame(titleRaf);
    const cv = $('titleCv'), c = cv.getContext('2d');
    const fake = { i: 3, terrain: 'wheat', weather: '' };
    const L = 1400;
    titleUnits.length = 0;
    const pool = ['recruit', 'rifleman', 'shield', 'ltank', 'bike', 'mg'];
    for (let i = 0; i < 9; i++) {
      const def = G.UNIT[pool[i % pool.length]];
      titleUnits.push({ n: i, def, side: 0, dir: -1, x: 500 + i * 110, alt: 0, walk: i, anim: 0, freeze: 0, slow: 0, dead: false, drop: 0 });
    }
    let t0 = 0;
    const loop = ts => {
      if (cur !== 'title') return;
      titleRaf = requestAnimationFrame(loop);
      const t = ts / 1000, dt = Math.min(0.05, t - (t0 || t)); t0 = t;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const s = Math.max(0.7, H / 380), viewW = W / s, gy = H * 0.86;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#c8a848'; c.fillRect(0, 0, W, H);
      const cam = Math.max(0, (L - viewW) / 2);
      c.setTransform(dpr * s, 0, 0, dpr * s, -cam * dpr * s, gy * dpr);
      D.background(c, fake, cam, viewW, gy / s, t, L);
      D.base(c, 'player', L - 70, '#7d8273', 1, t, null, 0);
      for (const u of titleUnits) {
        u.x -= u.def.spd * 0.6 * dt; u.walk += dt * 5;
        if (u.x < cam - 80) u.x = L - 90;
        D.unit(c, u, null, t);
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = 'rgba(20,24,16,.35)'; c.fillRect(0, 0, W, H);
    };
    titleRaf = requestAnimationFrame(loop);
  }
  $('btnPlay').onclick = () => { sfx('click'); show('map'); };
  $('btnArmy').onclick = () => { sfx('click'); show('army'); };
  $('btnGacha').onclick = () => { sfx('click'); show('gacha'); };
  $('btnHelp').onclick = () => { sfx('click'); show('help'); };

  // ================= 世界地圖 =================
  function flagCanvas(nat, w, h) {
    const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const c = cv.getContext('2d'); c.scale(2, 2); D.flag(c, nat, 0, 0, w, h); return cv;
  }
  const chUnlocked = ch => ch === 0 || S.cleared[ch - 1] >= 40;
  function renderMap() {
    const tabs = $('chapTabs'); tabs.innerHTML = '';
    G.CHAPTERS.forEach((chp, k) => {
      const b = document.createElement('button');
      const ok = chUnlocked(k);
      b.textContent = (ok ? '' : '🔒 ') + chp.name + (ok ? ` (${S.cleared[k]}/40)` : '');
      b.disabled = !ok; if (k === mapCh) b.classList.add('on');
      b.onclick = () => { sfx('click'); mapCh = k; renderMap(); };
      tabs.appendChild(b);
    });
    const list = $('stageList'); list.innerHTML = '';
    const done = S.cleared[mapCh];
    for (const grp of G.STAGE_GROUPS) {
      const gd = document.createElement('div'); gd.className = 'group';
      gd.innerHTML = `<div class="groupTitle">${grp.name}</div>`;
      let natBox = null, lastNat = null, stBox = null;
      for (let i = grp.from; i <= grp.to; i++) {
        const st = G.STAGES[i];
        if (st.nation !== lastNat) {
          lastNat = st.nation; const nat = G.NATIONS[st.nation];
          natBox = document.createElement('div'); natBox.className = 'nation';
          const head = document.createElement('div'); head.className = 'natHead';
          head.appendChild(flagCanvas(nat, 30, 19));
          const sp = document.createElement('span'); sp.innerHTML = nat.name + (nat.gun ? ' <small>（碉堡會開砲）</small>' : '');
          head.appendChild(sp); natBox.appendChild(head);
          stBox = document.createElement('div'); stBox.className = 'stages'; natBox.appendChild(stBox);
          gd.appendChild(natBox);
        }
        const b = document.createElement('button');
        b.className = 'stage' + (i < done ? ' cleared' : '') + (i === done ? ' next' : '') + (st.boss ? ' boss' : '');
        const locked = i > done;
        b.disabled = locked;
        const w = st.weather ? { snow: '❄️', fog: '🌫️', flood: '🌊' }[st.weather] : '';
        const boss = st.boss ? G.ENEMY[st.boss].name + (st.boss2 ? '＋' + G.ENEMY[st.boss2].name : '') : '碉堡 ' + fmt(st.baseHp * G.CHAPTERS[mapCh].mult);
        b.innerHTML = `<div class="num">${locked ? '🔒' : i + 1}</div><div><div class="nm">${st.name} ${w}</div><div class="sub">${boss}</div></div>`;
        b.onclick = () => { sfx('click'); startBattle(mapCh, i); };
        stBox.appendChild(b);
      }
      list.appendChild(gd);
    }
    // 自動捲到下一關
    const nx = list.querySelector('.stage.next');
    if (nx) setTimeout(() => nx.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  }

  // ================= 部隊 =================
  let rarFilter = 'all', selUnit = null;
  function unitStats(id) {
    const d = G.UNIT[id], m = G.lvMult(effLv(id));
    return { hp: d.hp * m, atk: d.atk * m * (d.shots || 1) };
  }
  function howToGet(d) {
    if (d.rar === 'basic') return `通過第 ${d.unlock} 關解鎖`;
    if (d.rar === 'ex') return d.exText + '取得';
    if (d.rar === 'legend') return '傳說祭扭蛋';
    return '扭蛋取得';
  }
  function renderArmy() {
    // 編隊
    const ts = $('teamSlots'); ts.innerHTML = '';
    for (let k = 0; k < 10; k++) {
      const id = S.team[k];
      const b = document.createElement('button'); b.className = 'slot' + (id ? ' filled r-' + G.UNIT[id].rar : '');
      if (id) {
        const d = G.UNIT[id];
        b.appendChild(D.icon(d, 60, 42, formOf(id)));
        const c = document.createElement('div'); c.className = 'c'; c.textContent = '¥' + d.cost; b.appendChild(c);
        b.title = nameOf(id) + '（點一下移出編隊）';
        b.onclick = () => { sfx('click'); S.team.splice(k, 1); save(); renderArmy(); };
      }
      ts.appendChild(b);
    }
    // 稀有度篩選
    const rf = $('rarFilter'); rf.innerHTML = '';
    for (const r of ['all'].concat(G.RAR_ORDER)) {
      const b = document.createElement('button'); b.textContent = r === 'all' ? '全部' : G.RAR[r].name;
      if (r === rarFilter) b.classList.add('on');
      b.onclick = () => { rarFilter = r; renderArmy(); };
      rf.appendChild(b);
    }
    // 名冊
    const ro = $('roster'); ro.innerHTML = '';
    for (const d of G.UNITS) {
      if (rarFilter !== 'all' && d.rar !== rarFilter) continue;
      const own = owned(d.id);
      const card = document.createElement('button');
      card.className = 'ucard r-' + d.rar + (own ? '' : ' locked') + (S.team.includes(d.id) ? ' inTeam' : '') + (selUnit === d.id ? ' sel' : '');
      card.appendChild(D.icon(d, 80, 54, own ? formOf(d.id) : 0));
      const n = document.createElement('div'); n.className = 'n'; n.textContent = own ? nameOf(d.id) : '？？？'; card.appendChild(n);
      const l = document.createElement('div'); l.className = 'l';
      l.textContent = own ? `Lv${S.units[d.id].lv}${S.units[d.id].plus ? '+' + S.units[d.id].plus : ''}` : howToGet(d);
      card.appendChild(l);
      card.onclick = () => { sfx('click'); selUnit = d.id; renderArmy(); };
      ro.appendChild(card);
    }
    renderResearch();
    renderDetail();
  }
  function renderDetail() {
    const el = $('detail');
    if (!selUnit) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const d = G.UNIT[selUnit], own = owned(selUnit), R = G.RAR[d.rar];
    const u = S.units[selUnit];
    const st = own ? unitStats(selUnit) : { hp: d.hp, atk: d.atk * (d.shots || 1) };
    const typeName = { inf: '步兵', armor: '裝甲', air: '空中' }[d.type];
    const traits = [];
    if (d.area) traits.push('範圍攻擊');
    if (d.nokb) traits.push('不會被擊退');
    if (d.bonus) for (const k in d.bonus) traits.push(`對${{ inf: '步兵', armor: '裝甲', air: '空中' }[k]} ${d.bonus[k]} 倍`);
    el.innerHTML = '';
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '✕'; close.onclick = () => { selUnit = null; renderArmy(); };
    el.appendChild(close);
    const ic = D.icon(d, 160, 100, own ? formOf(selUnit) : 0); ic.style.width = '160px'; ic.style.height = '100px'; if (!own) ic.style.filter = 'brightness(0) opacity(.5)';
    el.appendChild(ic);
    const info = document.createElement('div');
    const special = d.special === 'drop' ? '空降 4 名傘兵' : d.special === 'ark' ? `每顆炸彈 ${fmt(d.atk * G.lvMult(own ? effLv(selUnit) : 1))}` : null;
    info.innerHTML = `<span class="rb ${d.rar}">${R.name}</span>
      <h3>${own ? nameOf(selUnit) : d.names[0]}</h3>
      ${own ? `<div>Lv <b>${u.lv}</b>${u.plus ? ' <b style="color:var(--accent)">+' + u.plus + '</b>' : ''} ${u.lv < 10 ? '<small style="color:var(--dim)">（Lv10 進化成「' + d.names[1] + '」）</small>' : ''}</div>` : `<div style="color:var(--dim)">${howToGet(d)}</div>`}
      <div class="desc">${d.desc}</div>
      <table>
        ${special ? `<tr><td>效果</td><td>${special}</td></tr>` : `
        <tr><td>體力</td><td>${fmt(st.hp)}</td></tr>
        <tr><td>攻擊力</td><td>${fmt(st.atk)}${d.shots ? '（3 砲塔）' : ''}</td></tr>
        <tr><td>射程</td><td>${d.rng}</td></tr>
        <tr><td>移動速度</td><td>${d.spd}</td></tr>
        <tr><td>攻擊間隔</td><td>${d.atkT} 秒</td></tr>`}
        <tr><td>花費</td><td>¥${d.cost}</td></tr>
        <tr><td>再出擊</td><td>${d.cd} 秒</td></tr>
        <tr><td>屬性</td><td>${typeName}${traits.length ? '・' + traits.join('・') : ''}</td></tr>
      </table>`;
    el.appendChild(info);
    if (!own) return;
    const btns = document.createElement('div'); btns.className = 'btns';
    const cost = R.lvCost * u.lv;
    const up = document.createElement('button');
    if (u.lv >= 20) { up.textContent = '等級已滿（抽到重複可以 +1）'; up.disabled = true; }
    else { up.innerHTML = `⬆ 升級 <small>⭐${fmt(cost)}</small>`; up.disabled = S.xp < cost; }
    up.onclick = () => {
      if (S.xp < cost || u.lv >= 20) return;
      S.xp -= cost; u.lv++; save(); sfx('wallet');
      if (u.lv === 10) { toast(`✨ 進化！${d.names[0]} → ${d.names[1]}`); sfx('legend'); }
      refreshRes(); renderArmy();
    };
    const inTeam = S.team.includes(selUnit);
    const tb = document.createElement('button');
    tb.textContent = inTeam ? '移出編隊' : '加入編隊';
    tb.disabled = !inTeam && S.team.length >= 10;
    if (tb.disabled) tb.textContent = '編隊已滿（10 隻）';
    tb.onclick = () => {
      if (inTeam) S.team = S.team.filter(x => x !== selUnit); else if (S.team.length < 10) S.team.push(selUnit);
      save(); sfx('click'); renderArmy();
    };
    btns.appendChild(up); btns.appendChild(tb);
    el.appendChild(btns);
  }
  function renderResearch() {
    const el = $('research'); el.innerHTML = '';
    const items = [
      { key: 'baseLv', name: '🏰 碉堡耐久', val: lv => `體力 ${fmt(4000 + 1500 * lv)}` },
      { key: 'cannonLv', name: '💥 要塞砲威力', val: lv => `基礎傷害 ${fmt(120 + 60 * lv)}` },
    ];
    for (const it of items) {
      const lv = S[it.key], cost = 500 * (lv + 1);
      const d = document.createElement('div'); d.className = 'rcard';
      d.innerHTML = `<div class="t"><b>${it.name}</b> Lv${lv}<br><small>${it.val(lv)}</small></div>`;
      const b = document.createElement('button');
      if (lv >= 20) { b.textContent = 'MAX'; b.disabled = true; }
      else { b.innerHTML = `⬆ ⭐${fmt(cost)}`; b.disabled = S.xp < cost; }
      b.onclick = () => { if (S.xp < cost || lv >= 20) return; S.xp -= cost; S[it.key]++; save(); sfx('wallet'); refreshRes(); renderArmy(); };
      d.appendChild(b); el.appendChild(d);
    }
  }

  // ================= 扭蛋 =================
  function renderGacha() {
    const el = $('banners'); el.innerHTML = '';
    for (const key of ['normal', 'legend']) {
      const g = G.GACHA[key];
      const b = document.createElement('div'); b.className = 'banner' + (key === 'legend' ? ' legend' : '');
      const rates = g.rates.map(([r, p]) => `<span class="rb ${r}">${G.RAR[r].name}</span> ${p}%`).join('　');
      b.innerHTML = `<h2>${key === 'legend' ? '🌈 ' : '🎰 '}${g.name}</h2>
        <div class="rates">${rates}<br>十連抽保證至少一隻<b>激稀有以上</b>。抽到重複角色會變成 +1 等級。</div>`;
      const pick = document.createElement('div'); pick.className = 'pick';
      for (const d of G.UNITS.filter(u => u.rar === (key === 'legend' ? 'legend' : 'uber'))) {
        const ic = D.icon(d, 56, 40); ic.style.width = '56px'; ic.style.height = '40px'; ic.title = d.names[0]; pick.appendChild(ic);
      }
      b.appendChild(pick);
      const btns = document.createElement('div'); btns.className = 'btns';
      for (const n of [1, 10]) {
        const c = n === 1 ? G.GACHA.cost1 : G.GACHA.cost10;
        const bt = document.createElement('button'); if (n === 10) bt.className = 'big';
        bt.innerHTML = `${n === 1 ? '單抽' : '十連抽'}<br><small>🎖️ ${fmt(c)}</small>`;
        bt.disabled = S.medals < c;
        bt.onclick = () => draw(key, n);
        btns.appendChild(bt);
      }
      b.appendChild(btns);
      el.appendChild(b);
    }
    const cnt = r => G.UNITS.filter(u => u.rar === r && owned(u.id)).length + '/' + G.UNITS.filter(u => u.rar === r).length;
    $('gachaOwned').innerHTML = `收集進度：${['rare', 'super', 'uber', 'legend'].map(r => `<span class="rb ${r}">${G.RAR[r].name}</span> ${cnt(r)}`).join('　')}　｜　累計抽了 ${S.draws} 次<br>🎖️ 勳章：每關第一次通關可以拿到（魔王關更多）。`;
  }
  function rollRar(rates) {
    let x = Math.random() * 100;
    for (const [r, p] of rates) { if (x < p) return r; x -= p; }
    return rates[0][0];
  }
  function draw(key, n) {
    const g = G.GACHA[key], cost = n === 1 ? G.GACHA.cost1 : G.GACHA.cost10;
    if (S.medals < cost) return;
    S.medals -= cost; S.draws += n;
    const rs = [];
    for (let i = 0; i < n; i++) rs.push(rollRar(g.rates));
    if (n === 10 && !rs.some(r => r !== 'rare')) rs[9] = 'super';
    const res = rs.map(r => {
      const pool = G.UNITS.filter(u => u.rar === r);
      const d = pool[Math.floor(Math.random() * pool.length)];
      let tag;
      if (!owned(d.id)) { S.units[d.id] = { lv: 1, plus: 0 }; tag = 'new'; if (S.team.length < 10) S.team.push(d.id); }
      else if (S.units[d.id].plus < 10) { S.units[d.id].plus++; tag = 'plus'; }
      else { S.xp += 1000; tag = 'xp'; }
      return { d, tag };
    });
    save(); refreshRes();
    showDraw(res);
  }
  function showDraw(res) {
    const ov = $('gachaShow'), st = $('gachaStage'); st.innerHTML = ''; ov.classList.remove('hidden'); $('gachaOk').classList.add('hidden');
    const caps = res.map(({ d }, i) => {
      const c = document.createElement('div'); c.className = 'cap'; c.style.animationDelay = (i * 0.06) + 's';
      c.innerHTML = `<div class="ball ${d.rar}"></div>`;
      st.appendChild(c); return c;
    });
    let k = 0;
    const open = () => {
      if (k >= res.length) { $('gachaOk').classList.remove('hidden'); renderGacha(); return; }
      const { d, tag } = res[k], c = caps[k];
      c.classList.add('open', 'c-' + d.rar); c.classList.add('r-' + d.rar);
      c.innerHTML = '';
      const ic = D.icon(d, 90, 62); ic.style.width = '90px'; ic.style.height = '62px'; c.appendChild(ic);
      c.insertAdjacentHTML('beforeend', `<div class="nm">${d.names[0]}</div><div class="tag"><span class="rb ${d.rar}">${G.RAR[d.rar].name}</span></div>
        <div class="new">${tag === 'new' ? 'NEW!' : tag === 'plus' ? '重複 → +1' : '⭐ +1000'}</div>`);
      if (d.rar === 'legend') { const f = document.createElement('div'); f.className = 'legendFlash'; document.body.appendChild(f); setTimeout(() => f.remove(), 1700); sfx('legend'); }
      else if (d.rar === 'uber') sfx('capGold'); else sfx('cap');
      k++;
      setTimeout(open, d.rar === 'legend' ? 1600 : d.rar === 'uber' ? 700 : 260);
    };
    setTimeout(open, 600);
  }
  $('gachaOk').onclick = () => { $('gachaShow').classList.add('hidden'); renderGacha(); };

  // ================= 戰鬥 =================
  const cv = $('cv'), ctx = cv.getContext('2d');
  let B = null, curCh = 0, curSt = 0, raf = 0, last = 0, speed = 1, paused = false, resultShown = false;
  let cam = 0, scale = 1, viewW = 800, groundY = 300, dpr = 1, dragging = null;
  const slotEls = [];

  function startBattle(ch, i) {
    curCh = ch; curSt = i;
    const st = G.STAGES[i];
    const team = S.team.filter(owned).map(id => ({ def: G.UNIT[id], lv: effLv(id) }));
    B = new G.Battle(st, ch, team, { baseLv: S.baseLv, cannonLv: S.cannonLv });
    B.nat = G.NATIONS[st.nation];
    show('battle');
    $('bStage').textContent = `${G.CHAPTERS[ch].name}・第 ${i + 1} 關　${st.name}（${B.nat.name}）`;
    $('bWeather').textContent = st.weather ? G.WEATHER_TEXT[st.weather] : '';
    // 出擊按鈕
    const box = $('bSlots'); box.innerHTML = ''; slotEls.length = 0;
    for (let k = 0; k < 10; k++) {
      const s = B.slots[k];
      const b = document.createElement('button'); b.className = 'us' + (s ? '' : ' empty');
      if (s) {
        b.appendChild(D.icon(s.def, 64, 38, formOf(s.def.id)));
        b.insertAdjacentHTML('beforeend', `<div class="cdv"></div><div class="cost">¥${s.def.cost}</div><div class="key">${(k + 1) % 10}</div>`);
        b.addEventListener('pointerdown', e => { e.preventDefault(); tryDeploy(k); });
      }
      box.appendChild(b); slotEls.push(b);
    }
    speed = 1; $('bSpeed').textContent = '▶ 1x';
    paused = false; resultShown = false;
    $('pause').classList.add('hidden'); $('result').classList.add('hidden');
    layout();
    cam = B.L + 60 - viewW;
    cancelAnimationFrame(raf); last = 0;
    raf = requestAnimationFrame(frame);
    sfx('click');
  }
  function tryDeploy(k) { if (B && !paused && B.deploy(k)) { /* sfx 由事件處理 */ } }

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const barH = $('bBar').offsetHeight || 130;
    groundY = H - barH - 10;
    scale = Math.max(0.42, Math.min(1.15, (groundY - 30) / 340));
    viewW = W / scale;
    $('rotateTip').classList.toggle('hidden', !(H > W && W < 700));
  }
  window.addEventListener('resize', () => { if (B) layout(); });

  function clampCam() {
    if (!B) return;
    const minC = -60, maxC = B.L + 60 - viewW;
    cam = maxC < minC ? (B.L - viewW) / 2 : Math.max(minC, Math.min(maxC, cam));
  }

  function frame(ts) {
    if (!B) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    if (!paused) for (let k = 0; k < speed; k++) B.update(dt);
    keyScroll(dt);
    for (const e of B.ev) {
      if (e === 'deploy' || e === 'wallet' || e === 'cannon' || e === 'boss' || e === 'bossdown' || e === 'freeze' || e === 'legend' || e === 'win' || e === 'lose' || e === 'shot' || e === 'hit' || e === 'big' || e === 'boom') sfx(e);
    }
    B.ev.length = 0;
    render(ts / 1000);
    hud();
    if (B.result && B.endT > 2.0 && !resultShown) { resultShown = true; showResult(); }
  }

  function render(t) {
    const W = cv.clientWidth, H = cv.clientHeight;
    clampCam();
    const st = B.st, nat = B.nat, ter = D.TER[st.terrain] || D.TER.town;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = ter.g[0]; ctx.fillRect(0, 0, W, H);
    const viewH = groundY / scale;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -cam * dpr * scale, groundY * dpr);
    D.background(ctx, st, cam, viewW, viewH, t, B.L);
    // 碉堡
    D.base(ctx, nat.base, B.EB, nat.baseCol, B.base[1].hp / B.base[1].max, t, nat, B.base[1].hit);
    D.base(ctx, 'player', B.PB, '#7d8273', B.base[0].hp / B.base[0].max, t, null, B.base[0].hit);
    baseHp(B.EB, B.base[1]); baseHp(B.PB, B.base[0]);
    // 單位：地面先畫，空中後畫
    const us = B.units.slice().sort((a, b) => (a.alt - b.alt) || (a.side - b.side) || (a.n - b.n));
    for (const u of us) D.unit(ctx, u, nat, t);
    // 飛越的飛機
    for (const f of B.flyers) {
      ctx.save(); ctx.translate(f.x, f.y + Math.sin(t * 2) * 4); ctx.scale(-1, 1);
      D.drawLook(ctx, { k: 'plane', v: f.k === 'ark' ? 'ark' : 'transport' }, 0, null, { t, anim: 0 });
      ctx.restore();
    }
    for (const f of B.fx) D.fx(ctx, f, B);
    D.weather(ctx, st, cam, viewW, viewH, t, B.EB, B.L);
    // 全螢幕特效
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const f of B.fx) D.screenFx(ctx, f, W, H);
    if (B.buffT > 0) { ctx.fillStyle = `rgba(80,40,120,${0.12 + Math.sin(t * 4) * 0.04})`; ctx.fillRect(0, 0, W, H); }
  }
  function baseHp(x, b) {
    ctx.save(); ctx.font = 'bold 15px "Noto Sans TC", sans-serif'; ctx.textAlign = 'center';
    const txt = fmt(Math.ceil(b.hp)) + ' / ' + fmt(b.max);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(txt, x, -262);
    ctx.fillStyle = b.hp / b.max < 0.3 ? '#ff8a7a' : '#fff'; ctx.fillText(txt, x, -262);
    ctx.restore();
  }

  function hud() {
    $('moneyNow').textContent = fmt(Math.floor(B.money));
    $('moneyMax').textContent = fmt(G.WALLET.max[B.wl]);
    $('wlLv').textContent = 'Lv' + (B.wl + 1);
    const wb = $('bWallet');
    if (B.wl >= G.WALLET.cost.length) { $('wlCost').textContent = 'MAX'; wb.classList.add('max'); }
    else { $('wlCost').textContent = '¥' + G.WALLET.cost[B.wl]; wb.classList.toggle('max', B.money < G.WALLET.cost[B.wl]); }
    B.slots.forEach((s, k) => {
      const el = slotEls[k]; if (!el) return;
      el.classList.toggle('poor', B.money < s.def.cost);
      el.classList.toggle('ready', s.cd <= 0 && B.money >= s.def.cost);
      el.querySelector('.cdv').style.height = (s.cd > 0 ? (s.cd / s.def.cd) * 100 : 0) + '%';
    });
    $('cannonFill').style.height = (B.cannon * 100) + '%';
    $('bCannon').classList.toggle('ready', B.cannon >= 1);
  }

  function showResult() {
    const card = $('resultCard'), st = B.st, cm = G.CHAPTERS[curCh].mult;
    const ov = $('result'); ov.classList.remove('hidden');
    if (B.result === 'win') {
      const first = curSt === S.cleared[curCh];
      const xp = Math.round(st.xp * cm * (first ? 1.5 : 1));
      const medals = first ? st.medals * (curCh + 1) : 10;
      S.xp += xp; S.medals += medals;
      if (first) S.cleared[curCh] = curSt + 1;
      const got = syncUnlocks();
      save(); refreshRes();
      card.className = 'card win';
      let html = `<h2>勝利！</h2><div>${st.name}（${B.nat.name}）${first ? '　<b style="color:var(--accent)">首次通關！</b>' : ''}</div>
        <div class="rw"><span>⭐ +${fmt(xp)}</span><span>🎖️ +${fmt(medals)}</span></div><div style="color:var(--dim);font-size:13px">擊倒 ${B.kills} 個敵人・用時 ${Math.floor(B.t / 60)}:${String(Math.floor(B.t % 60)).padStart(2, '0')}</div>`;
      for (const u of got) html += `<div class="unl">🎉 新角色加入：<span class="rb ${u.rar}">${G.RAR[u.rar].name}</span> ${u.names[0]}</div>`;
      if (first && curSt === 39) html += `<div class="unl">🏆 ${G.CHAPTERS[curCh].name}全部通關！${curCh < 2 ? G.CHAPTERS[curCh + 1].name + '開放了！' : '你是真正的灰鷹元帥！'}</div>`;
      card.innerHTML = html;
      if (curSt < 39) addBtn(card, '▶ 下一關', () => startBattle(curCh, curSt + 1), true);
      else if (curCh < 2) addBtn(card, `▶ 前往${G.CHAPTERS[curCh + 1].name}`, () => { mapCh = curCh + 1; endBattle('map'); }, true);
    } else {
      const xp = Math.round(st.xp * cm * 0.1);
      S.xp += xp; save(); refreshRes();
      card.className = 'card lose';
      card.innerHTML = `<h2>敗北…</h2><div>碉堡被攻破了。</div><div class="rw"><span>⭐ +${fmt(xp)}</span></div>
        <div style="color:var(--dim);font-size:14px">小提示：去「部隊」用軍功升級角色、研究碉堡，或是去扭蛋抽新角色。</div>`;
      addBtn(card, '↻ 再試一次', () => startBattle(curCh, curSt), true);
    }
    addBtn(card, '🪖 部隊', () => endBattle('army'));
    addBtn(card, '🗺️ 回地圖', () => endBattle('map'));
  }
  function addBtn(parent, txt, fn, big) {
    const b = document.createElement('button'); b.textContent = txt; if (big) b.className = 'big';
    b.onclick = () => { sfx('click'); fn(); }; parent.appendChild(b);
  }
  function endBattle(to) {
    cancelAnimationFrame(raf); B = null;
    $('result').classList.add('hidden'); $('pause').classList.add('hidden');
    show(to, { back: to === 'army' ? 'map' : 'title' });
  }

  // 控制
  $('bWallet').addEventListener('pointerdown', e => { e.preventDefault(); if (B && !paused) B.upgradeWallet(); });
  $('bCannon').addEventListener('pointerdown', e => { e.preventDefault(); if (B && !paused) B.fireCannon(); });
  $('bSpeed').onclick = () => { speed = speed === 1 ? 2 : 1; $('bSpeed').textContent = '▶ ' + speed + 'x'; };
  function setPause(p) {
    if (!B || B.result) return;
    paused = p; $('pause').classList.toggle('hidden', !p);
    $('pSound').textContent = '🔊 音效：' + (S.sound ? '開' : '關');
  }
  $('bPause').onclick = () => setPause(true);
  $('pResume').onclick = () => setPause(false);
  $('pSound').onclick = () => { S.sound = !S.sound; save(); $('pSound').textContent = '🔊 音效：' + (S.sound ? '開' : '關'); };
  $('pRetry').onclick = () => { $('pause').classList.add('hidden'); startBattle(curCh, curSt); };
  $('pQuit').onclick = () => endBattle('map');

  cv.addEventListener('pointerdown', e => { dragging = { x: e.clientX, cam }; cv.setPointerCapture(e.pointerId); ac(); });
  cv.addEventListener('pointermove', e => { if (dragging) cam = dragging.cam - (e.clientX - dragging.x) / scale; });
  cv.addEventListener('pointerup', () => { dragging = null; });
  cv.addEventListener('pointercancel', () => { dragging = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); cam += (e.deltaX || e.deltaY) / scale; }, { passive: false });
  const keys = {};
  function keyScroll(dt) { if (keys.ArrowLeft || keys.a) cam -= 700 * dt; if (keys.ArrowRight || keys.d) cam += 700 * dt; }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (cur !== 'battle' || !B) return;
    if (e.key === 'Escape' || e.key === 'p') { setPause(!paused); return; }
    if (paused) return;
    if (/^[0-9]$/.test(e.key)) tryDeploy((+e.key + 9) % 10);
    else if (e.key === 'q' || e.key === 'Q') B.upgradeWallet();
    else if (e.key === ' ' || e.key === 'w' || e.key === 'W') { e.preventDefault(); B.fireCannon(); }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  document.addEventListener('pointerdown', () => ac(), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && B && !B.result) setPause(true); });

  // ================= 開始 =================
  load();
  show('title');
  if (!S.gift) {
    S.gift = true; save();
    setTimeout(() => toast('🎁 新兵禮包：1,500 勳章！可以先去扭蛋來一次十連抽'), 600);
  }
  // 方便除錯：在網址加 #debug 會給很多資源
  if (location.hash === '#debug') { S.xp += 1e6; S.medals += 1e5; save(); refreshRes(); }
  G.save = () => S;
  G.debug = { battle: () => B, setCam: x => { cam = x; } };
})(window.GE);
