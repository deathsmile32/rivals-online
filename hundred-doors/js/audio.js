'use strict';
// ============ 合成音效（不需要音檔） ============
const Snd = (() => {
  let AC = null, master = null, NB = null, vol = 0.8;
  function init() {
    try {
      if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = vol; master.connect(AC.destination);
      NB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { AC = null; }
  }
  const ok = () => AC && AC.state !== 'closed';
  function setVol(v) { vol = v; if (master) master.gain.value = v; }
  function noise(dur, o = {}) {
    if (!ok()) return; const t = AC.currentTime + (o.at || 0);
    const s = AC.createBufferSource(); s.buffer = NB; s.loop = true;
    const f = AC.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur); f.Q.value = o.q || 1;
    const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v || 0.3, t + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(f0, f1, dur, o = {}) {
    if (!ok()) return; const t = AC.currentTime + (o.at || 0);
    const s = AC.createOscillator(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) s.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v || 0.2, t + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  const S = {
    step: (v = 0.06) => noise(0.09, { f: 380, v, a: 0.004 }),
    door: () => { tone(160, 90, 0.5, { type: 'sawtooth', v: 0.05 }); tone(220, 170, 0.4, { type: 'square', v: 0.02, at: 0.05 }); noise(0.18, { f: 300, v: 0.25, at: 0.35 }); },
    slam: () => { noise(0.35, { f: 240, v: 0.5 }); tone(70, 40, 0.3, { v: 0.3 }); },
    drawer: () => noise(0.25, { f: 900, f2: 400, v: 0.12, a: 0.02, type: 'bandpass', q: 2 }),
    closet: () => { noise(0.2, { f: 500, v: 0.15 }); tone(200, 140, 0.25, { type: 'sawtooth', v: 0.03 }); },
    coin: () => { tone(1320, 1320, 0.08, { type: 'square', v: 0.06 }); tone(1760, 1760, 0.15, { type: 'square', v: 0.06, at: 0.07 }); },
    key: () => { for (let i = 0; i < 4; i++) tone(2200 + i * 300, 2000, 0.06, { type: 'triangle', v: 0.06, at: i * 0.05 }); },
    unlock: () => { tone(800, 600, 0.05, { type: 'square', v: 0.08 }); noise(0.08, { f: 2000, v: 0.15, at: 0.08, type: 'highpass' }); },
    lever: () => { noise(0.3, { f: 600, v: 0.25 }); tone(110, 60, 0.4, { type: 'square', v: 0.08, at: 0.2 }); },
    pick: () => tone(660, 990, 0.12, { type: 'triangle', v: 0.1 }),
    deny: () => tone(180, 140, 0.18, { type: 'square', v: 0.07 }),
    click: () => tone(1200, 1200, 0.03, { type: 'square', v: 0.04 }),
    hurt: () => { noise(0.25, { f: 800, v: 0.35 }); tone(200, 80, 0.3, { type: 'sawtooth', v: 0.12 }); },
    death: () => { tone(300, 40, 1.5, { type: 'sawtooth', v: 0.2 }); noise(1.2, { f: 2000, f2: 100, v: 0.3 }); },
    sting: () => { for (const f of [233, 247, 311, 330]) tone(f, f * 0.98, 0.9, { type: 'sawtooth', v: 0.09 }); noise(0.6, { f: 3000, v: 0.3, type: 'highpass' }); },
    psst: () => noise(0.4, { f: 5000, v: 0.25, type: 'bandpass', q: 3, a: 0.05 }),
    flick: () => noise(0.06, { f: 4000, v: 0.08, type: 'highpass' }),
    halt: () => { tone(880, 880, 0.8, { v: 0.12 }); tone(1320, 1300, 0.8, { v: 0.06 }); },
    win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.5, { type: 'triangle', v: 0.12, at: i * 0.15 })); },
    vit: () => { tone(400, 1200, 0.3, { type: 'triangle', v: 0.1 }); },
  };
  // 持續音效：音量隨距離改變
  function loop(kind) {
    if (!ok()) return { vol() { }, stop() { } };
    const g = AC.createGain(); g.gain.value = 0; g.connect(master);
    const nodes = []; let iv = null;
    const nz = (f, type, q) => { const s = AC.createBufferSource(); s.buffer = NB; s.loop = true; const fl = AC.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = f; fl.Q.value = q || 1; s.connect(fl); fl.connect(g); s.start(); nodes.push(s); return fl; };
    const osc = (f, type, v) => { const o = AC.createOscillator(); o.type = type || 'sine'; o.frequency.value = f; const og = AC.createGain(); og.gain.value = v; o.connect(og); og.connect(g); o.start(); nodes.push(o); return o; };
    switch (kind) {
      case 'rush': nz(260); nz(120); osc(55, 'sawtooth', 0.25); break;
      case 'ambush': nz(900, 'bandpass', 2); osc(80, 'sawtooth', 0.3); osc(83, 'square', 0.15); break;
      case 'eyes': { const o = osc(70, 'sine', 0.7); osc(140, 'triangle', 0.1); const lfo = AC.createOscillator(); lfo.frequency.value = 3; const lg = AC.createGain(); lg.gain.value = 10; lfo.connect(lg); lg.connect(o.frequency); lfo.start(); nodes.push(lfo); break; }
      case 'seek': {
        osc(46, 'sawtooth', 0.15);
        let b = 0; iv = setInterval(() => { if (!ok()) return; const t = AC.currentTime; const o = AC.createOscillator(), og = AC.createGain(); o.type = 'square'; o.frequency.setValueAtTime(b % 4 === 3 ? 98 : 65, t); og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.2); b++; }, 220);
        break;
      }
      case 'figure': { osc(38, 'sawtooth', 0.35); nz(160); let b = 0; iv = setInterval(() => { if (!ok()) return; const t = AC.currentTime; const s = AC.createBufferSource(); s.buffer = NB; const f = AC.createBiquadFilter(); f.frequency.value = 180; const og = AC.createGain(); og.gain.setValueAtTime(1.2, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.25); s.connect(f); f.connect(og); og.connect(g); s.start(t, Math.random()); s.stop(t + 0.3); b++; }, 520); break; }
      case 'drone': osc(48, 'sine', 0.5); osc(72.5, 'sine', 0.2); nz(200); break;
      case 'halt': osc(440, 'sine', 0.2); osc(660, 'sine', 0.1); break;
    }
    return {
      vol(v) { g.gain.setTargetAtTime(Math.max(0, v), AC.currentTime, 0.08); },
      setIv(fn) { },
      stop() { try { g.gain.setTargetAtTime(0, AC.currentTime, 0.05); clearInterval(iv); setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { } }); g.disconnect(); }, 300); } catch (e) { } }
    };
  }
  return Object.assign({ init, loop, setVol }, S);
})();
