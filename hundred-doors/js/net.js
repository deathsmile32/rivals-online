'use strict';
// ============ 連線（PeerJS 點對點，主機制） ============
const Net = (() => {
  const QP = Object.fromEntries(new URLSearchParams(location.search));
  const PFX = 'hdoors100-';
  const ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'turn:global.relay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:global.relay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }];
  const opts = () => { const o = { debug: 0 }; if (QP.turn !== '0') o.config = { iceServers: ICE }; return o; };
  const useBC = QP.net === 'bc'; // 本機測試用（同一瀏覽器開兩個分頁）

  function loadPeer() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const srcs = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
      let i = 0; const nx = () => { if (i >= srcs.length) return rej(new Error('lib')); const s = document.createElement('script'); s.src = srcs[i++]; s.onload = () => window.Peer ? res() : nx(); s.onerror = nx; document.head.appendChild(s); }; nx();
    });
  }
  const genCode = () => { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += A[Math.floor(Math.random() * A.length)]; return s; };

  let st = null; // {role, send(to,m), bcast(m), close()}
  // h: {open(), msg(from,m), leave(id), err(type), join(id)}
  async function host(h) {
    const code = genCode();
    if (useBC) {
      const ch = new BroadcastChannel('hd-' + code), cs = new Set();
      ch.onmessage = ev => { const d = ev.data; if (d.to !== 'host') return; if (d.bye) { cs.delete(d.from); h.leave(d.from); return; } if (!cs.has(d.from)) { cs.add(d.from); h.join(d.from); } h.msg(d.from, d.m); };
      st = { role: 'host', send: (to, m) => ch.postMessage({ to, from: 'host', m }), bcast: m => cs.forEach(c => ch.postMessage({ to: c, from: 'host', m })), close: () => { cs.forEach(c => ch.postMessage({ to: c, from: 'host', bye: 1 })); ch.close(); } };
      setTimeout(() => h.open(code), 50); return code;
    }
    await loadPeer();
    const peer = new Peer(PFX + code, opts()), cs = {};
    peer.on('open', () => h.open(code));
    peer.on('error', e => h.err(e && e.type || 'error'));
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (_) { } });
    peer.on('connection', c => {
      c.on('open', () => { cs[c.peer] = c; h.join(c.peer); });
      c.on('data', d => { if (!cs[c.peer]) { cs[c.peer] = c; h.join(c.peer); } h.msg(c.peer, d); });
      c.on('close', () => { if (cs[c.peer]) { delete cs[c.peer]; h.leave(c.peer); } });
      c.on('error', () => { });
    });
    st = {
      role: 'host',
      send: (to, m) => { const c = cs[to]; if (c && c.open) try { c.send(m); } catch (_) { } },
      bcast: m => { for (const k in cs) { const c = cs[k]; if (c.open) try { c.send(m); } catch (_) { } } },
      close: () => { try { peer.destroy(); } catch (_) { } }
    };
    return code;
  }
  async function join(code, h) {
    code = code.trim().toUpperCase();
    if (useBC) {
      const ch = new BroadcastChannel('hd-' + code), me = 'c' + Math.random().toString(36).slice(2, 8);
      ch.onmessage = ev => { const d = ev.data; if (d.to !== me) return; if (d.bye) { h.leave('host'); return; } h.msg('host', d.m); };
      st = { role: 'client', me, send: (_, m) => ch.postMessage({ to: 'host', from: me, m }), bcast: m => ch.postMessage({ to: 'host', from: me, m }), close: () => { ch.postMessage({ to: 'host', from: me, bye: 1 }); ch.close(); } };
      setTimeout(() => h.open(me), 50); return;
    }
    await loadPeer();
    const peer = new Peer(opts()); let c = null, op = false;
    peer.on('open', id => {
      c = peer.connect(PFX + code, { reliable: true, serialization: 'json' });
      c.on('open', () => { op = true; h.open(id); });
      c.on('data', d => h.msg('host', d));
      c.on('close', () => h.leave('host'));
      c.on('error', () => { });
    });
    peer.on('error', e => h.err(e && e.type || 'error'));
    setTimeout(() => { if (!op) h.err('timeout'); }, 14000);
    st = { role: 'client', send: (_, m) => { if (c && c.open) try { c.send(m); } catch (_) { } }, bcast: m => { if (c && c.open) try { c.send(m); } catch (_) { } }, close: () => { try { peer.destroy(); } catch (_) { } } };
  }
  return {
    host, join,
    send: (to, m) => st && st.send(to, m),
    bcast: m => st && st.bcast(m),
    close: () => { if (st) st.close(); st = null; },
    get active() { return !!st; }
  };
})();
