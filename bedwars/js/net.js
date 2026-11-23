'use strict';
// ===================== 線上連線（房主＝伺服器，其他人連到房主） =====================
const NET_PREFIX = 'bedwarsweb-';
const QP = Object.fromEntries(new URLSearchParams(location.search));
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'turn:global.relay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:global.relay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
];
function rid(n) { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function loadPeer() {
  return new Promise((res, rej) => {
    if (window.Peer) return res();
    const srcs = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
    let i = 0;
    const next = () => {
      if (i >= srcs.length) return rej(new Error('lib'));
      const s = document.createElement('script'); s.src = srcs[i++];
      s.onload = () => (window.Peer ? res() : next()); s.onerror = next;
      document.head.appendChild(s);
    };
    next();
  });
}
const peerOpts = () => ({ debug: 0, config: { iceServers: ICE_SERVERS } });

// 傳輸層：h = { open(), msg(cid, m), leave(cid), err(type) }
function trPeerHost(code, h) {
  const peer = new Peer(NET_PREFIX + code, peerOpts()), cs = {};
  peer.on('open', () => h.open());
  peer.on('error', e => h.err(e && e.type || 'error'));
  peer.on('disconnected', () => { try { peer.reconnect(); } catch (_) { } });
  peer.on('connection', c => {
    c.on('data', d => { cs[c.peer] = c; h.msg(c.peer, d); });
    c.on('open', () => { cs[c.peer] = c; });
    c.on('close', () => { if (cs[c.peer]) { delete cs[c.peer]; h.leave(c.peer); } });
    c.on('error', () => { });
  });
  return {
    to(cid, m) { try { cs[cid] && cs[cid].send(m); } catch (_) { } },
    all(m) { for (const k in cs) try { cs[k].send(m); } catch (_) { } },
    drop(cid) { try { cs[cid] && cs[cid].close(); } catch (_) { } delete cs[cid]; },
    close() { try { peer.destroy(); } catch (_) { } },
  };
}
function trPeerJoin(code, h) {
  const peer = new Peer(peerOpts());
  let c = null, ok = false;
  peer.on('open', () => {
    c = peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' });
    c.on('open', () => { ok = true; h.open(); });
    c.on('data', d => h.msg('host', d));
    c.on('close', () => h.leave('host'));
    c.on('error', () => { });
  });
  peer.on('error', e => h.err(e && e.type || 'error'));
  setTimeout(() => { if (!ok) h.err('timeout'); }, 12000);
  return { send(m) { try { c && c.open && c.send(m); } catch (_) { } }, close() { try { peer.destroy(); } catch (_) { } } };
}
// 測試用（同一個瀏覽器的兩個分頁）：網址加 ?net=bc
function trBcHost(code, h) {
  const ch = new BroadcastChannel('bw' + code), cs = new Set();
  ch.onmessage = ev => {
    const { f, to, m } = ev.data || {};
    if (to !== 'H') return;
    if (m === '_hi') { cs.add(f); ch.postMessage({ f: 'H', to: f, m: '_ok' }); return; }
    if (m === '_bye') { if (cs.delete(f)) h.leave(f); return; }
    if (cs.has(f)) h.msg(f, m);
  };
  setTimeout(() => h.open(), 50);
  return {
    to(cid, m) { ch.postMessage({ f: 'H', to: cid, m }); },
    all(m) { for (const c of cs) ch.postMessage({ f: 'H', to: c, m }); },
    drop(cid) { cs.delete(cid); ch.postMessage({ f: 'H', to: cid, m: '_kick' }); },
    close() { for (const c of cs) ch.postMessage({ f: 'H', to: c, m: '_kick' }); ch.close(); },
  };
}
function trBcJoin(code, h) {
  const ch = new BroadcastChannel('bw' + code), me = rid(8);
  let ok = false;
  ch.onmessage = ev => {
    const { to, m } = ev.data || {};
    if (to !== me) return;
    if (m === '_ok') { ok = true; h.open(); return; }
    if (m === '_kick') { h.leave('host'); return; }
    h.msg('host', m);
  };
  ch.postMessage({ f: me, to: 'H', m: '_hi' });
  setTimeout(() => { if (!ok) h.err('peer-unavailable'); }, 2500);
  return { send(m) { ch.postMessage({ f: me, to: 'H', m }); }, close() { ch.postMessage({ f: me, to: 'H', m: '_bye' }); ch.close(); } };
}

// ===================== 房間與大廳 =====================
const Net = {
  role: null,       // 'host' | 'client'
  code: '', me: '', name: '', tr: null,
  lobby: null,      // { players: [{id,name,team}], diff }
  seen: {}, lastHost: 0,
  errText(e) {
    return { 'peer-unavailable': '找不到這個房間，請確認房號', 'unavailable-id': '房號被使用中，請再試一次', timeout: '連線逾時，請再試一次', network: '網路連線有問題', lib: '無法載入連線元件（需要網路）', 'browser-incompatible': '這個瀏覽器不支援連線' }[e] || ('連線錯誤：' + e);
  },
  async host(name) {
    this.leave();
    this.role = 'host'; this.name = name; this.code = QP.code || rid(5); this.me = 'H';
    this.lobby = { players: [{ id: 'H', name, team: 0 }], diff: 'normal', size: curSize, variant: curVariant };
    const h = {
      open: () => { LobbyUI.show(); this.sync(); },
      msg: (cid, m) => this.hostMsg(cid, m),
      leave: cid => this.hostLeave(cid),
      err: e => { LobbyUI.error(this.errText(e)); this.leave(); },
    };
    try {
      if (QP.net === 'bc') this.tr = trBcHost(this.code, h);
      else { await loadPeer(); this.tr = trPeerHost(this.code, h); }
    } catch (e) { h.err('lib'); }
    this.hb = setInterval(() => this.heartbeat(), 2000);
  },
  async join(name, code) {
    this.leave();
    this.role = 'client'; this.name = name; this.code = code.toUpperCase().trim(); this.me = '';
    const h = {
      open: () => { this.tr.send({ t: 'hello', name }); this.lastHost = performance.now(); },
      msg: (_, m) => this.clientMsg(m),
      leave: () => this.hostGone(),
      err: e => { LobbyUI.error(this.errText(e)); this.leave(); },
    };
    LobbyUI.connecting(this.code);
    try {
      if (QP.net === 'bc') this.tr = trBcJoin(this.code, h);
      else { await loadPeer(); this.tr = trPeerJoin(this.code, h); }
    } catch (e) { h.err('lib'); }
    this.hb = setInterval(() => this.heartbeat(), 2000);
  },
  leave() {
    if (this.tr) { try { if (this.role === 'client') this.tr.send({ t: 'bye' }); } catch (_) { } try { this.tr.close(); } catch (_) { } }
    clearInterval(this.hb);
    this.tr = null; this.role = null; this.lobby = null; this.seen = {};
  },
  // 給遊戲用的介面
  gameIface() {
    const self = this;
    return {
      send(m) { self.tr && self.tr.send(m); },
      to(cid, m) { self.tr && self.tr.to(cid, m); },
      all(m) { self.tr && self.tr.all(m); },
    };
  },
  heartbeat() {
    const now = performance.now();
    if (this.role === 'host') {
      this.tr && this.tr.all({ t: 'hb' });
      for (const cid in this.seen) if (now - this.seen[cid] > 10000) { this.tr.drop(cid); this.hostLeave(cid); }
    } else if (this.role === 'client') {
      this.tr && this.tr.send({ t: 'hb' });
      if (this.lastHost && now - this.lastHost > 10000) this.hostGone();
    }
  },
  // ---- 房主 ----
  sync() { if (this.role === 'host') { this.tr && this.tr.all({ t: 'lobby', lobby: this.lobby, code: this.code }); LobbyUI.render(); } },
  teamCount(t) { return this.lobby.players.filter(p => p.team === t).length; },
  hostMsg(cid, m) {
    this.seen[cid] = performance.now();
    if (m.t === 'hb') return;
    if (m.t === 'hello') {
      if (!this.lobby) return;
      if (window.game && game.mode === 'host' && !game.over) { this.tr.to(cid, { t: 'full', why: '遊戲已經開始了，請等下一場' }); return; }
      if (this.lobby.players.length >= 4 * (this.lobby.size || 2)) { this.tr.to(cid, { t: 'full', why: '房間已滿（最多 8 人）' }); return; }
      if (!this.lobby.players.find(p => p.id === cid)) {
        let team = 0, best = 9;
        if (this.lobby.players.length >= 4 * this.lobby.size) { this.tr.to(cid, { t: 'full', why: '房間已滿' }); return; }
        for (let t = 0; t < 4; t++) { const c = this.teamCount(t); if (c < this.lobby.size && c < best) { best = c; team = t; } }
        this.lobby.players.push({ id: cid, name: String(m.name || '玩家').slice(0, 10), team });
      }
      this.tr.to(cid, { t: 'welcome', id: cid });
      this.sync();
      UI.toast(`${m.name} 加入了房間`);
      return;
    }
    if (m.t === 'team') {
      const p = this.lobby && this.lobby.players.find(x => x.id === cid);
      if (p && m.team >= 0 && m.team < 4 && this.teamCount(m.team) < this.lobby.size) { p.team = m.team; this.sync(); }
      return;
    }
    if (m.t === 'bye') { this.hostLeave(cid); return; }
    if (window.game && game.mode === 'host') game.onNet(cid, m);
  },
  hostLeave(cid) {
    delete this.seen[cid];
    if (!this.lobby) return;
    const p = this.lobby.players.find(x => x.id === cid);
    if (p) { this.lobby.players = this.lobby.players.filter(x => x.id !== cid); UI.toast(`${p.name} 離開了房間`); }
    if (window.game && game.mode === 'host') game.playerLeft(cid);
    this.sync();
  },
  setTeam(team) {
    if (this.role === 'host') {
      const p = this.lobby.players.find(x => x.id === 'H');
      if (this.teamCount(team) < this.lobby.size) { p.team = team; this.sync(); }
    } else if (this.tr) this.tr.send({ t: 'team', team });
  },
  setDiff(d) { if (this.role === 'host') { this.lobby.diff = d; this.sync(); } },
  setVariant(v) { if (this.role === 'host') { this.lobby.variant = v; this.sync(); } },
  setSize(n) {
    if (this.role !== 'host' || this.lobby.size === n) return;
    if (n === 1) {
      if (this.lobby.players.length > 4) { UI.toast('超過 4 人，不能切換成 1v1v1v1'); return; }
      // 每隊只留一人，多出來的人移到空的隊伍
      for (const p of this.lobby.players) {
        if (this.lobby.players.filter(q => q.team === p.team && q !== p && this.lobby.players.indexOf(q) < this.lobby.players.indexOf(p)).length) {
          for (let t = 0; t < 4; t++) if (!this.lobby.players.some(q => q.team === t)) { p.team = t; break; }
        }
      }
    }
    this.lobby.size = n; this.sync();
  },
  start() {
    if (this.role !== 'host') return;
    const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
    let ni = 0;
    const roster = [];
    for (let t = 0; t < 4; t++) {
      const humans = this.lobby.players.filter(p => p.team === t);
      for (const h of humans) roster.push({ id: h.id, team: t, kind: 'human', name: h.name });
      const size = this.lobby.size || 2;
      while (roster.filter(r => r.team === t).length < size) {
        const cnt = roster.filter(r => r.team === t).length;
        roster.push({ team: t, kind: 'bot', name: names[ni++], role: size === 1 ? 'solo' : humans.length ? 'defend' : (cnt === 0 ? 'attack' : 'defend') });
      }
    }
    roster.forEach((r, i) => r.variant = i * 3 + 1);
    const msg = { t: 'start', roster, diff: this.lobby.diff, variant: this.lobby.variant || 'classic' };
    this.tr.all(msg);
    LobbyUI.hide();
    startGame({ mode: 'host', roster, diff: this.lobby.diff, variant: msg.variant, localId: 'H' });
  },
  // ---- 客戶端 ----
  clientMsg(m) {
    this.lastHost = performance.now();
    switch (m.t) {
      case 'hb': return;
      case 'welcome': this.me = m.id; return;
      case 'lobby': this.lobby = m.lobby; this.code = m.code; if (!window.game || game.over) { LobbyUI.show(); LobbyUI.render(); } return;
      case 'full': LobbyUI.error(m.why); this.leave(); return;
      case 'start': {
        LobbyUI.hide();
        startGame({ mode: 'client', roster: m.roster, diff: m.diff, variant: m.variant || 'classic', localId: this.me });
        return;
      }
    }
    if (window.game && game.mode === 'client') game.onHostMsg(m);
  },
  hostGone() {
    if (!this.role) return;
    this.leave();
    UI.toast('房主離開了，連線中斷');
    setTimeout(() => toMenu(), 1500);
  },
};

// ===================== 大廳介面 =====================
const LobbyUI = {
  show() { ['menu', 'online', 'end'].forEach(id => $(id).classList.add('hidden')); $('lobby').classList.remove('hidden'); this.render(); },
  hide() { $('lobby').classList.add('hidden'); },
  connecting(code) { this.show(); $('lobbyBody').innerHTML = `<div class="sub">正在連線到房間 <b>${code}</b>…</div>`; },
  error(text) {
    $('lobby').classList.add('hidden');
    $('online').classList.remove('hidden');
    $('onlineErr').textContent = text;
  },
  render() {
    const L = Net.lobby;
    if (!L) return;
    const host = Net.role === 'host';
    let h = `<div class="code">房號 <b>${Net.code}</b><button class="copy" onclick="LobbyUI.copy()">複製邀請連結</button></div>`;
    h += '<div class="teams">';
    for (let t = 0; t < 4; t++) {
      const ps = L.players.filter(p => p.team === t);
      const D = TEAM_DEFS[t];
      h += `<div class="tbox" style="border-color:${D.css}" onclick="Net.setTeam(${t})"><div class="tname" style="color:${D.css}">${D.name}</div>`;
      for (let i = 0; i < (L.size || 2); i++) {
        const p = ps[i];
        h += `<div class="slotp">${p ? (p.id === 'H' ? '👑 ' : '') + escapeHtml(p.name) + (p.id === (Net.role === 'host' ? 'H' : Net.me) ? '（你）' : '') : '<span class="botslot">電腦</span>'}</div>`;
      }
      h += '</div>';
    }
    h += `</div><div class="hint2">點一下隊伍可以換隊（每隊最多 ${L.size || 2} 人，空位由電腦補上）</div>`;
    h += '<div class="row">';
    for (const [n, label] of [[2, '4 隊 × 2 人'], [1, '1v1v1v1']]) h += `<button class="${(L.size || 2) === n ? 'on' : ''}" ${host ? `onclick="Net.setSize(${n})"` : 'disabled'}>${label}</button>`;
    h += '</div><div class="row">';
    for (const [v, label] of [['classic', '經典床戰'], ['cotton', '綿花戰爭（有槍）']]) h += `<button class="${(L.variant || 'classic') === v ? 'on' : ''}" ${host ? `onclick="Net.setVariant('${v}')"` : 'disabled'}>${label}</button>`;
    h += '</div><div class="row">';
    for (const d of ['easy', 'normal', 'hard']) h += `<button class="${L.diff === d ? 'on' : ''}" ${host ? `onclick="Net.setDiff('${d}')"` : 'disabled'}>電腦${DIFF[d].label}</button>`;
    h += '</div>';
    h += host ? `<button class="big" onclick="Net.start()">開始遊戲（${L.players.length} 人）</button>` : '<div class="sub">等待房主開始遊戲…</div>';
    h += '<button onclick="Net.leave();toMenu()">離開房間</button>';
    $('lobbyBody').innerHTML = h;
  },
  copy() {
    const url = location.origin + location.pathname + '?join=' + Net.code + (QP.net ? '&net=' + QP.net : '');
    try { navigator.clipboard.writeText(url); UI.toast('已複製邀請連結！傳給朋友就能加入'); } catch (e) { UI.toast(url); }
  },
};
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
