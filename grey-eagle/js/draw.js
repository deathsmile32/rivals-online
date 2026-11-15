// 灰鷹軍團 — 繪圖：Q 版士兵、載具、各國碉堡、背景、特效。全部用 canvas 畫，不用圖檔。
// 所有角色先畫成「面向右邊」，需要面向左時整個翻轉。
'use strict';
(function (G) {
  const D = G.D = {};
  const PI = Math.PI;

  // 我方（灰鷹軍團）配色
  D.PLAYER = { uni: '#7a828c', helm: 'stahl', helmCol: '#5f666f', veh: '#737b84', em: '#e8e8e8' };

  // ---------- 小工具 ----------
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function fillRR(c, x, y, w, h, r, col) { c.fillStyle = col; rr(c, x, y, w, h, r); c.fill(); }
  function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  function ell(c, x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, PI * 2); c.fill(); }
  function poly(c, pts, col) { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
  function line(c, x1, y1, x2, y2, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
  }
  D.shade = shade; D.rr = rr;
  function star(c, x, y, r, col, n) {
    n = n || 5; c.fillStyle = col; c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -PI / 2 + i * PI / n, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    c.closePath(); c.fill();
  }
  D.star = star;
  // 偽隨機（同一個種子畫出一樣的背景）
  function srand(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  // 灰鷹徽章（簡單的抽象鳥形）
  function eagle(c, x, y, r, col, bg) {
    if (bg) circ(c, x, y, r, bg);
    c.fillStyle = col; c.beginPath();
    c.moveTo(x - r * 0.85, y - r * 0.15); c.quadraticCurveTo(x - r * 0.4, y - r * 0.05, x, y + r * 0.35);
    c.quadraticCurveTo(x + r * 0.4, y - r * 0.05, x + r * 0.85, y - r * 0.15);
    c.quadraticCurveTo(x + r * 0.45, y + r * 0.35, x, y + r * 0.7); c.quadraticCurveTo(x - r * 0.45, y + r * 0.35, x - r * 0.85, y - r * 0.15);
    c.fill();
    circ(c, x, y - r * 0.25, r * 0.22, col);
  }
  D.eagle = eagle;

  // ---------- 旗幟 ----------
  D.flag = function (c, nat, x, y, w, h, wave) {
    wave = wave || 0;
    c.save();
    if (wave) { c.translate(x, y); c.transform(1, Math.sin(wave) * 0.05, 0, 1, 0, 0); c.translate(-x, -y); }
    if (!nat) { // 灰鷹軍團旗
      fillRR(c, x, y, w, h, 1, '#5b6152');
      c.fillStyle = '#8a917d'; c.fillRect(x, y + h * 0.42, w, h * 0.16);
      eagle(c, x + w / 2, y + h / 2, h * 0.36, '#e8e8e8', '#3f4438');
      c.restore(); return;
    }
    flagBody(c, nat.flag, x, y, w, h);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.8; c.strokeRect(x, y, w, h);
    c.restore();
  };
  function bands(c, cols, vert, x, y, w, h) {
    const n = cols.length;
    for (let i = 0; i < n; i++) { c.fillStyle = cols[i]; if (vert) c.fillRect(x + w * i / n, y, w / n + 0.5, h); else c.fillRect(x, y + h * i / n, w, h / n + 0.5); }
  }
  function unionJack(c, x, y, w, h) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = '#012169'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = h * 0.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
    c.strokeStyle = '#c8102e'; c.lineWidth = h * 0.07; c.stroke();
    c.fillStyle = '#fff'; c.fillRect(x + w * 0.4, y, w * 0.2, h); c.fillRect(x, y + h * 0.35, w, h * 0.3);
    c.fillStyle = '#c8102e'; c.fillRect(x + w * 0.45, y, w * 0.1, h); c.fillRect(x, y + h * 0.4, w, h * 0.2);
    c.restore();
  }
  function crescent(c, x, y, r, col, bg) { circ(c, x, y, r, col); circ(c, x + r * 0.3, y, r * 0.8, bg); }
  function flagBody(c, f, x, y, w, h) {
    switch (f.t) {
      case 'nordic':
        c.fillStyle = f.bg; c.fillRect(x, y, w, h);
        c.fillStyle = f.cross; c.fillRect(x + w * 0.3, y, w * 0.16, h); c.fillRect(x, y + h * 0.4, w, h * 0.2);
        if (f.inner) { c.fillStyle = f.inner; c.fillRect(x + w * 0.335, y, w * 0.09, h); c.fillRect(x, y + h * 0.45, w, h * 0.1); }
        break;
      case 'ensign':
        c.fillStyle = f.bg; c.fillRect(x, y, w, h); unionJack(c, x, y, w / 2, h / 2);
        if (f.stars === 'nz') for (const [sx, sy] of [[0.75, 0.25], [0.68, 0.55], [0.84, 0.48], [0.76, 0.8]]) { star(c, x + w * sx, y + h * sy, h * 0.09, '#fff'); star(c, x + w * sx, y + h * sy, h * 0.055, '#c8102e'); }
        else if (f.stars === 'au') { star(c, x + w * 0.25, y + h * 0.75, h * 0.14, '#fff', 7); for (const [sx, sy] of [[0.75, 0.2], [0.62, 0.48], [0.87, 0.42], [0.75, 0.82]]) star(c, x + w * sx, y + h * sy, h * 0.07, '#fff', 7); }
        else if (f.stars === 'ca') { fillRR(c, x + w * 0.66, y + h * 0.3, w * 0.18, h * 0.4, 2, '#f2e6c8'); D.emblem(c, 'leaf', x + w * 0.75, y + h * 0.5, h * 0.14, '#c8102e'); }
        else if (f.stars === 'in') { circ(c, x + w * 0.75, y + h * 0.5, h * 0.2, '#f2f2f2'); star(c, x + w * 0.75, y + h * 0.5, h * 0.13, '#1f3f8a'); }
        break;
      case 'uk': unionJack(c, x, y, w, h); break;
      case 'us':
        for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#fff' : '#b22234'; c.fillRect(x, y + h * i / 7, w, h / 7 + 0.5); }
        c.fillStyle = '#3c3b6e'; c.fillRect(x, y, w * 0.42, h * 4 / 7);
        for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) circ(c, x + w * (0.05 + k * 0.105), y + h * (0.1 + r * 0.17), h * 0.03, '#fff');
        break;
      case 'lib':
        for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#fff' : '#bf0a30'; c.fillRect(x, y + h * i / 7, w, h / 7 + 0.5); }
        c.fillStyle = '#002868'; c.fillRect(x, y, w * 0.35, h * 4 / 7); star(c, x + w * 0.175, y + h * 2 / 7, h * 0.16, '#fff');
        break;
      case 'gr':
        for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#fff' : '#0d5eaf'; c.fillRect(x, y + h * i / 9, w, h / 9 + 0.5); }
        c.fillStyle = '#0d5eaf'; c.fillRect(x, y, w * 0.37, h * 5 / 9);
        c.fillStyle = '#fff'; c.fillRect(x + w * 0.15, y, w * 0.07, h * 5 / 9); c.fillRect(x, y + h * 2 / 9, w * 0.37, h / 9);
        break;
      case 'cz':
        bands(c, ['#ffffff', '#d7141a'], false, x, y, w, h);
        poly(c, [x, y, x + w * 0.5, y + h / 2, x, y + h], '#11457e'); break;
      case 'cuba':
        for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#fff' : '#002a8f'; c.fillRect(x, y + h * i / 5, w, h / 5 + 0.5); }
        poly(c, [x, y, x + w * 0.43, y + h / 2, x, y + h], '#cf142b'); star(c, x + w * 0.14, y + h / 2, h * 0.17, '#fff'); break;
      case 'br':
        c.fillStyle = '#009c3b'; c.fillRect(x, y, w, h);
        poly(c, [x + w * 0.08, y + h / 2, x + w / 2, y + h * 0.1, x + w * 0.92, y + h / 2, x + w / 2, y + h * 0.9], '#ffdf00');
        circ(c, x + w / 2, y + h / 2, h * 0.24, '#002776'); break;
      case 'crescent':
        c.fillStyle = f.bg; c.fillRect(x, y, w, h);
        if (f.stars === 1) { crescent(c, x + w * 0.4, y + h / 2, h * 0.25, '#fff', f.bg); star(c, x + w * 0.58, y + h / 2, h * 0.1, '#fff'); }
        else { crescent(c, x + w * 0.45, y + h / 2, h * 0.28, '#fff', f.bg); for (const dy of [-0.18, 0, 0.18]) star(c, x + w * 0.62, y + h * (0.5 + dy), h * 0.07, '#fff'); }
        break;
      default:
        bands(c, f.c, f.vert, x, y, w, h);
        if (f.em) D.emblem(c, f.em, f.em === 'starCorner' ? x + w * 0.18 : x + w / 2, f.em === 'starCorner' ? y + h * 0.28 : y + h / 2, h * 0.34, f.emc);
    }
  }
  D.emblem = function (c, em, x, y, r, col) {
    c.fillStyle = col; c.strokeStyle = col;
    switch (em) {
      case 'tower': c.fillRect(x - r * 0.35, y - r * 0.5, r * 0.7, r * 1.3); poly(c, [x - r * 0.5, y - r * 0.5, x, y - r * 1.1, x + r * 0.5, y - r * 0.5], col); break;
      case 'sail': poly(c, [x - r * 0.1, y - r, x - r * 0.1, y + r * 0.5, x + r * 0.8, y + r * 0.5], col); c.fillRect(x - r * 0.8, y + r * 0.6, r * 1.6, r * 0.25); break;
      case 'tulip': c.fillRect(x - r * 0.07, y, r * 0.14, r); ell(c, x, y - r * 0.15, r * 0.5, r * 0.6, col); break;
      case 'shield': c.beginPath(); c.moveTo(x - r * 0.7, y - r * 0.8); c.lineTo(x + r * 0.7, y - r * 0.8); c.lineTo(x + r * 0.7, y); c.quadraticCurveTo(x, y + r, x, y + r); c.quadraticCurveTo(x - r * 0.7, y + r * 0.4, x - r * 0.7, y); c.fill(); break;
      case 'wave': c.lineWidth = r * 0.25; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x - r, y + k * r * 0.5); c.quadraticCurveTo(x - r * 0.5, y + k * r * 0.5 - r * 0.35, x, y + k * r * 0.5); c.quadraticCurveTo(x + r * 0.5, y + k * r * 0.5 + r * 0.35, x + r, y + k * r * 0.5); c.stroke(); } break;
      case 'peaks': poly(c, [x - r, y + r * 0.6, x - r * 0.4, y - r * 0.6, x, y + r * 0.1, x + r * 0.4, y - r * 0.8, x + r, y + r * 0.6], col); break;
      case 'peak': poly(c, [x - r, y + r * 0.6, x, y - r * 0.8, x + r, y + r * 0.6], col); break;
      case 'olive': c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y + r * 0.2, r * 0.8, PI * 1.1, PI * 1.9); c.stroke(); for (let k = 0; k < 5; k++) { const a = PI * (1.15 + k * 0.17); ell(c, x + Math.cos(a) * r * 0.8, y + r * 0.2 + Math.sin(a) * r * 0.8, r * 0.18, r * 0.09, col, a); } break;
      case 'wing': c.beginPath(); c.moveTo(x - r * 0.9, y + r * 0.4); c.quadraticCurveTo(x - r * 0.2, y - r * 1.2, x + r * 0.9, y - r * 0.6); c.quadraticCurveTo(x + r * 0.2, y - r * 0.1, x + r * 0.6, y + r * 0.1); c.quadraticCurveTo(x, y + r * 0.1, x - r * 0.9, y + r * 0.4); c.fill(); break;
      case 'fern': c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(x, y + r); c.quadraticCurveTo(x + r * 0.3, y, x, y - r); c.stroke(); for (let k = 0; k < 6; k++) { const yy = y + r * 0.8 - k * r * 0.3, w2 = r * (0.7 - k * 0.1); ell(c, x - w2 / 2, yy, w2 / 2, r * 0.07, col, -0.3); ell(c, x + w2 / 2, yy, w2 / 2, r * 0.07, col, 0.3); } break;
      case 'horn': c.lineWidth = r * 0.25; c.beginPath(); c.arc(x + r * 0.3, y + r * 0.3, r * 0.8, PI, PI * 1.6); c.stroke(); break;
      case 'stars': for (const [dx, dy, s] of [[0, -0.6, 0.35], [-0.6, 0, 0.3], [0.6, 0.1, 0.3], [0, 0.6, 0.35], [0.25, 0.05, 0.18]]) star(c, x + dx * r, y + dy * r, s * r, col); break;
      case 'leaf': poly(c, [x, y - r, x + r * 0.3, y - r * 0.4, x + r * 0.9, y - r * 0.6, x + r * 0.6, y, x + r * 0.9, y + r * 0.3, x + r * 0.1, y + r * 0.3, x + r * 0.08, y + r, x - r * 0.08, y + r, x - r * 0.1, y + r * 0.3, x - r * 0.9, y + r * 0.3, x - r * 0.6, y, x - r * 0.9, y - r * 0.6, x - r * 0.3, y - r * 0.4], col); break;
      case 'feather': ell(c, x, y - r * 0.2, r * 0.45, r * 0.8, col); circ(c, x, y - r * 0.35, r * 0.25, '#2fb39a'); circ(c, x, y - r * 0.35, r * 0.12, '#1a2a55'); break;
      case 'cactus': c.fillRect(x - r * 0.15, y - r, r * 0.3, r * 1.8); c.fillRect(x - r * 0.6, y - r * 0.3, r * 0.45, r * 0.2); c.fillRect(x - r * 0.6, y - r * 0.7, r * 0.18, r * 0.5); c.fillRect(x + r * 0.15, y - r * 0.1, r * 0.45, r * 0.2); c.fillRect(x + r * 0.42, y - r * 0.5, r * 0.18, r * 0.5); break;
      case 'snake': c.lineWidth = r * 0.22; c.beginPath(); c.moveTo(x - r * 0.8, y + r * 0.5); c.bezierCurveTo(x - r * 0.2, y - r * 0.4, x + r * 0.2, y + r * 0.8, x + r * 0.7, y - r * 0.3); c.stroke(); circ(c, x + r * 0.75, y - r * 0.35, r * 0.2, col); break;
      case 'rose': for (let k = 0; k < 5; k++) { const a = k * PI * 2 / 5; circ(c, x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.4, col); } circ(c, x, y, r * 0.3, shade(col, -0.3)); break;
      case 'crown': poly(c, [x - r * 0.8, y + r * 0.5, x - r * 0.8, y - r * 0.4, x - r * 0.4, y, x, y - r * 0.7, x + r * 0.4, y, x + r * 0.8, y - r * 0.4, x + r * 0.8, y + r * 0.5], col); break;
      case 'bigstar': circ(c, x, y, r * 0.95, col); star(c, x, y, r * 0.75, '#fff'); break;
      case 'star': star(c, x, y, r * 0.9, col); break;
      case 'starCorner': star(c, x, y, r * 0.45, col); line(c, x - r * 0.35, y + r * 0.9, x + r * 0.2, y + r * 0.35, r * 0.13, col); c.lineWidth = r * 0.12; c.beginPath(); c.arc(x - r * 0.05, y + r * 0.55, r * 0.38, -0.3, 2.4); c.stroke(); break;
      case 'eagle2': c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r * 0.9); c.lineTo(x - r * 0.2, y - r * 0.5); c.lineTo(x - r, y - r * 0.7); c.lineTo(x - r * 0.6, y + r * 0.1); c.lineTo(x - r * 0.25, y + r * 0.2); c.lineTo(x, y + r); c.lineTo(x + r * 0.25, y + r * 0.2); c.lineTo(x + r * 0.6, y + r * 0.1); c.lineTo(x + r, y - r * 0.7); c.lineTo(x + r * 0.2, y - r * 0.5); c.closePath(); c.fill(); break;
      case 'eagleSmall': ell(c, x, y, r * 0.55, r * 0.4, col); circ(c, x + r * 0.35, y - r * 0.35, r * 0.18, col); line(c, x - r * 0.5, y + r * 0.45, x + r * 0.5, y + r * 0.45, r * 0.12, '#2a7a3a'); break;
      case 'sun': circ(c, x, y, r * 0.42, col); for (let k = 0; k < 8; k++) { const a = k * PI / 4; line(c, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, r * 0.1, col); } break;
    }
  };

  // ---------- 帽子 / 頭盔 ----------
  function helmet(c, style, col, o) {
    const hy = -33;
    switch (style) {
      case 'stahl':
        c.fillStyle = col; c.beginPath();
        c.moveTo(-11, hy + 4); c.lineTo(-10, hy - 1); c.arc(0, hy - 1, 10, PI, PI * 1.92); c.lineTo(10, hy + 1);
        c.lineTo(7, hy + 1); c.lineTo(-6, hy + 1); c.lineTo(-8, hy + 5); c.closePath(); c.fill();
        c.fillStyle = shade(col, 0.15); c.beginPath(); c.arc(-1, hy - 3, 7, PI * 1.15, PI * 1.6); c.lineTo(-1, hy - 3); c.fill();
        break;
      case 'brodie': ell(c, 0, hy - 4, 13, 2.6, shade(col, -0.1)); c.fillStyle = col; c.beginPath(); c.arc(0, hy - 4, 7.5, PI, 0); c.fill(); break;
      case 'adrian':
        c.fillStyle = col; c.beginPath(); c.arc(0, hy - 2, 9, PI, 0); c.fill();
        fillRR(c, -5, hy - 13, 10, 3, 1.5, shade(col, -0.15));
        ell(c, 0, hy - 1.5, 12, 2, shade(col, -0.1)); break;
      case 'm1': case 'para':
        c.fillStyle = col; c.beginPath(); c.arc(0, hy - 1, style === 'para' ? 9.5 : 10.5, PI * 0.97, PI * 2.03); c.fill();
        if (style === 'm1') ell(c, 0, hy + 0.5, 11.5, 1.6, shade(col, -0.15));
        line(c, 6, hy, 4, hy + 8, 1, '#3a3a2a'); break;
      case 'kepi':
        c.fillStyle = col; c.beginPath(); c.moveTo(-8, hy - 3); c.lineTo(-6, hy - 15); c.lineTo(7, hy - 13); c.lineTo(8, hy - 3); c.fill();
        ell(c, 0.5, hy - 14, 6.5, 2, shade(col, 0.2)); poly(c, [5, hy - 4, 14, hy - 2, 8, hy - 1], '#222');
        c.fillStyle = '#d8b84a'; c.fillRect(-7.5, hy - 6, 15.5, 1.5); break;
      case 'cap': case 'officer':
        ell(c, 0, hy - 9, 11, 4, col); c.fillStyle = shade(col, -0.25); c.fillRect(-8, hy - 8, 16, 4);
        poly(c, [4, hy - 4, 14, hy - 2, 6, hy - 1.5], '#222');
        if (style === 'officer') { c.fillStyle = '#d8b84a'; c.fillRect(-8, hy - 6, 16, 1.4); circ(c, 0, hy - 9, 2, '#d8b84a'); }
        break;
      case 'ushanka':
        fillRR(c, -11, hy - 14, 22, 11, 5, '#8a6a4a'); fillRR(c, -11, hy - 6, 6, 11, 3, '#7a5a3a');
        fillRR(c, -9, hy - 10, 18, 4, 2, '#9c7c58'); star(c, 3, hy - 10, 2.4, '#d8312a'); break;
      case 'hood': c.fillStyle = '#eef2f4'; c.beginPath(); c.arc(0, hy, 11.5, PI * 0.65, PI * 2.35); c.fill(); ell(c, 3, hy + 1, 7, 7.5, o.skin); break;
      case 'square':
        fillRR(c, -8, hy - 7, 16, 4, 1, shade(col, -0.2)); poly(c, [-9, hy - 7, -4, hy - 15, 9, hy - 14, 9, hy - 7], col);
        poly(c, [5, hy - 4, 13, hy - 2, 6, hy - 2], '#222'); break;
      case 'lemon': ell(c, 0, hy - 4, 13, 2.4, '#b59a62'); poly(c, [-7, hy - 4, 0, hy - 19, 7, hy - 4], '#c2a76c'); c.fillStyle = '#a33'; c.fillRect(-6, hy - 6, 12, 2); break;
      case 'slouch': ell(c, 0, hy - 4, 13, 2.4, '#a08655'); c.fillStyle = '#b39765'; c.beginPath(); c.arc(0, hy - 4, 7.5, PI, 0); c.fill(); poly(c, [-13, hy - 4, -9, hy - 15, -6, hy - 5], '#a08655'); break;
      case 'pith': ell(c, 0, hy - 3, 12, 2.6, '#d8c89c'); c.fillStyle = '#e6d8b0'; c.beginPath(); c.ellipse(0, hy - 4, 9, 10, 0, PI, 0); c.fill(); break;
      case 'beret': ell(c, -2, hy - 8, 10, 4.5, '#3d4a2c', -0.2); circ(c, -4, hy - 12, 1.3, '#3d4a2c'); break;
      case 'chef': fillRR(c, -7, hy - 22, 14, 14, 3, '#fff'); circ(c, -5, hy - 21, 5, '#fff'); circ(c, 5, hy - 21, 5, '#fff'); circ(c, 0, hy - 24, 5, '#fff'); c.fillStyle = '#ddd'; c.fillRect(-7, hy - 10, 14, 3); break;
      case 'ghillie':
        for (let i = 0; i < 9; i++) { const a = PI + i * PI / 8; circ(c, Math.cos(a) * 10, hy + Math.sin(a) * 10, 4.5, i % 2 ? '#4f6b2f' : '#6b8a3a'); }
        break;
      case 'goggles':
        fillRR(c, -9, hy - 12, 18, 8, 4, '#6b4a2a'); circ(c, -1, hy - 7, 3.2, '#9fd8ff'); circ(c, 6, hy - 7, 3.2, '#9fd8ff');
        c.strokeStyle = '#c9a65a'; c.lineWidth = 1.2; c.beginPath(); c.arc(-1, hy - 7, 3.2, 0, PI * 2); c.arc(6, hy - 7, 3.2, 0, PI * 2); c.stroke(); break;
      case 'bearskin': fillRR(c, -9, hy - 26, 18, 24, 8, '#151515'); c.fillStyle = '#c8323a'; c.fillRect(-9, hy - 6, 18, 2); break;
      case 'crest':
        c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, hy - 1, 10, PI, 0); c.fill();
        c.fillStyle = '#b8322f'; c.beginPath(); c.moveTo(-10, hy - 9); c.quadraticCurveTo(0, hy - 24, 10, hy - 9); c.lineTo(6, hy - 9); c.quadraticCurveTo(0, hy - 16, -6, hy - 9); c.fill(); break;
      case 'winter':
        fillRR(c, -13, hy - 17, 26, 13, 6, '#f4f8fb'); fillRR(c, -13, hy - 7, 7, 13, 3, '#e4edf3'); star(c, 3, hy - 11, 3, '#d8312a');
        // 白鬍子
        c.fillStyle = '#f4f8fb'; c.beginPath(); c.moveTo(-3, hy + 3); c.quadraticCurveTo(4, hy + 18, 11, hy + 3); c.fill(); break;
      case 'mask': fillRR(c, 0, hy - 5, 10, 8, 3, '#2a3a44'); fillRR(c, 2, hy - 4, 7, 6, 2, '#8fd0f0'); ell(c, 0, hy - 2, 10.5, 10, 'rgba(30,40,50,.0)'); c.fillStyle = '#20272c'; c.beginPath(); c.arc(0, hy, 10, PI * 1.05, PI * 1.95); c.fill(); break;
      case 'fez': poly(c, [-7, hy - 5, -5.5, hy - 17, 5.5, hy - 17, 7, hy - 5], '#b8222a'); ell(c, 0, hy - 17, 5.5, 1.6, '#9a1a22'); line(c, 0, hy - 17, -5, hy - 9, 1, '#222'); break;
      case 'medic':
        c.fillStyle = col; c.beginPath(); c.arc(0, hy - 1, 10, PI * 0.97, PI * 2.03); c.fill();
        circ(c, 1, hy - 6, 4, '#f4f4f4'); c.fillStyle = '#2f9a4a'; c.fillRect(-0.4, hy - 9, 2.8, 6); c.fillRect(-2, hy - 7.4, 6, 2.8); break;
      default: break;
    }
  }

  // ---------- 步兵 ----------
  function soldier(c, o) {
    const ph = o.phase || 0, sw = Math.sin(ph) * 3.2, an = o.anim || 0;
    const uni = o.uni, dk = shade(uni, -0.3);
    const gear = o.gear;
    const crouch = gear === 'mg' || gear === 'mortar';
    if (o.cape) { c.fillStyle = '#2a1f3a'; c.beginPath(); c.moveTo(-6, -24); c.quadraticCurveTo(-16, -10, -14 - sw, 0); c.lineTo(2, -2); c.lineTo(4, -24); c.fill(); }
    // 背包 / 裝備
    if (o.pack || gear === 'wire') fillRR(c, -13, -24, 7, 12, 2, gear === 'wire' ? '#6b5a3a' : '#6b6045');
    if (gear === 'wire') { c.strokeStyle = '#999'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-10, -18, 4 + i, 0, PI * 2); c.stroke(); } }
    if (gear === 'flame') { fillRR(c, -14, -27, 5, 15, 2, '#5d5d50'); fillRR(c, -10, -26, 5, 14, 2, '#6b6b5c'); }
    if (gear === 'ladle') { circ(c, -11, -18, 6, '#888'); fillRR(c, -17, -21, 12, 3, 1, '#666'); }
    const OL = 'rgba(20,18,12,.45)';
    // 腿（褲子、綁腿、靴子）
    if (gear === 'frog') { ell(c, -3 + sw, -1, 6, 2, '#222'); ell(c, 4 - sw, -1, 6, 2, '#222'); }
    const ly = crouch ? -7 : -10;
    const frog = gear === 'frog', body = frog ? '#2a3238' : uni;
    for (const [lx, side] of [[-5 + sw, -1], [1 - sw, 1]]) {
      fillRR(c, lx, ly, 4.5, -ly, 1.5, side < 0 ? shade(dk, -0.12) : dk);
      if (!frog && !crouch) { c.fillStyle = shade(uni, -0.1); c.fillRect(lx + 0.3, -6, 3.9, 3.4); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(lx + 0.3, -4.8, 3.9, 0.6); }
      fillRR(c, lx - 1, -2.6, 6, 3, 1, '#2a2520'); c.fillStyle = '#4a4036'; c.fillRect(lx - 1, -0.6, 6, 0.8);
    }
    if (gear === 'ski') { line(c, -14, 0.5, 18, 0.5, 1.6, '#8a5a2a'); line(c, 18, 0.5, 21, -2, 1.6, '#8a5a2a'); }
    // 後面那隻手臂
    const by = crouch ? -21 : -24;
    fillRR(c, -7, by + 2, 4, 10, 2, shade(body, -0.22));
    // 身體（上衣、領子、口袋、皮帶、彈藥袋、背帶）
    fillRR(c, -7.5, by, 15, 15, 5, body);
    c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(-7.5, by + 4); c.lineTo(-2, by + 4); c.lineTo(-2.5, by + 15); c.lineTo(-7.5, by + 15); c.fill();
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(2, by + 1.5, 4, 9);
    if (!frog) {
      poly(c, [-4.5, by + 0.5, 0, by + 3.5, 4.5, by + 0.5], shade(uni, -0.25));
      c.fillStyle = shade(uni, -0.2); c.fillRect(-5.5, by + 4, 3.6, 3); c.fillRect(2.3, by + 4, 3.6, 3);
      c.fillStyle = '#c9b06a'; for (const yy of [by + 4.5, by + 7.5]) c.fillRect(-0.5, yy, 1.2, 1.2);
      line(c, -6, by + 1, 5, by + 10, 1, 'rgba(40,32,20,.55)');
    }
    c.fillStyle = frog ? '#1a1f22' : '#3d3222'; c.fillRect(-7.5, by + 10, 15, 2.4);
    if (!frog) { c.fillStyle = '#b8a060'; c.fillRect(-1, by + 10.2, 2.4, 2); c.fillStyle = '#4e4430'; c.fillRect(-6.8, by + 9.4, 3.2, 3.6); c.fillRect(3.8, by + 9.4, 3.2, 3.6); }
    c.strokeStyle = OL; c.lineWidth = 0.8; rr(c, -7.5, by, 15, 15, 5); c.stroke();
    if (o.band && !frog) { c.fillStyle = o.band; c.fillRect(-7.5, by + 3, 3.4, 4.5); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-7.5, by + 3, 3.4, 1); }
    if (o.big && o.big > 1.2 && !frog) { c.fillStyle = '#d8b84a'; c.fillRect(4, by + 3, 3, 2); c.fillRect(4, by + 6, 3, 2); }
    // 頭（耳朵、眉毛、鼻子、嘴巴、頭盔陰影、帽帶）
    const hy = crouch ? -30 : -33;
    c.save(); if (crouch) c.translate(0, 3);
    circ(c, -6.5, -32, 2.2, shade(o.skin, -0.12));
    circ(c, 0, -33, 9.5, o.skin);
    c.fillStyle = 'rgba(120,70,40,.12)'; c.beginPath(); c.arc(0, -33, 9.5, PI * 0.55, PI * 1.25); c.lineTo(0, -33); c.fill();
    c.strokeStyle = OL; c.lineWidth = 0.8; c.beginPath(); c.arc(0, -33, 9.5, 0, PI * 2); c.stroke();
    ell(c, 4.6, -33.4, 1.25, 1.55, '#1e1a16'); circ(c, 4.9, -33.9, 0.45, '#fff');
    line(c, 2.6, o.angry ? -37.6 : -36.6, 6.4, o.angry ? -36.2 : -36.8, 1.1, '#3a2a1a');
    line(c, 8.2, -32.5, 9.3, -30.6, 1, shade(o.skin, -0.25));
    line(c, 4.2, -28.4, 6.8, o.angry ? -28.8 : -28.2, 0.9, '#7a3a2a');
    circ(c, 6, -30, 1.5, 'rgba(255,120,120,.3)');
    if (!['hood', 'chef', 'ghillie', 'winter', 'mask', 'beret', 'fez', 'goggles', 'bearskin'].includes(o.hat || o.helm)) {
      c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, -36.5, 9.6, 2.6, 0, 0, PI); c.fill();
    }
    helmet(c, o.hat || o.helm, o.helmCol, o);
    c.restore();
    // 武器（手的位置）
    const hx = 6, hyy = by + 7;
    const hand = (x, y) => { line(c, 0.5, by + 3.5, x, y, 4, shade(body, -0.06)); line(c, x - 1.2, y - 0.6, x - 0.1, y - 0.1, 3.2, shade(body, -0.3)); circ(c, x, y, 2.4, o.skin); };
    const rec = an > 0 ? -2 * an / 0.3 : 0;
    c.save(); c.translate(rec, 0);
    switch (gear) {
      case 'rifle': line(c, -4, hyy + 1, 19, hyy - 2, 2.4, '#6b4423'); line(c, 10, hyy - 1, 22, hyy - 2.5, 1.4, '#222'); line(c, 4, hyy - 1.6, 4, hyy - 3.4, 1, '#333'); c.strokeStyle = '#4a3a22'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, hyy + 1.6); c.quadraticCurveTo(6, hyy + 5, 15, hyy - 1); c.stroke(); hand(hx, hyy); break;
      case 'longrifle': line(c, -5, hyy + 1, 20, hyy - 2, 2.4, '#6b4423'); line(c, 10, hyy - 1, 27, hyy - 3, 1.4, '#222'); line(c, 4, hyy - 1.6, 4, hyy - 3.4, 1, '#333'); line(c, 25, hyy - 2.8, 30, hyy - 3.5, 0.8, '#bbb'); hand(hx, hyy); break;
      case 'sniper': line(c, -5, hyy + 1, 20, hyy - 2, 2.4, '#4a3420'); line(c, 10, hyy - 1, 32, hyy - 3.5, 1.4, '#222'); fillRR(c, 4, hyy - 5.5, 10, 2.6, 1.2, '#111'); hand(hx, hyy); break;
      case 'smg': fillRR(c, 0, hyy - 3, 14, 4.5, 1, '#2a2a2a'); c.fillStyle = '#2a2a2a'; c.fillRect(6, hyy + 1, 2.5, 6); line(c, 13, hyy - 1, 19, hyy - 1, 1.4, '#111'); hand(hx, hyy); break;
      case 'mg':
        line(c, 14, -10, 10, 0, 1.4, '#333'); line(c, 14, -10, 19, 0, 1.4, '#333');
        fillRR(c, 3, -14, 18, 5, 1.5, '#2a2a2a'); line(c, 20, -12, 31, -12, 2, '#111'); fillRR(c, 6, -9.5, 6, 5, 1, '#4b4a32');
        hand(4, -12); break;
      case 'bazooka': fillRR(c, -14, by - 1, 34, 6, 3, '#4f5a3a'); fillRR(c, 17, by - 2, 4, 8, 1, '#3a3a2a'); hand(4, hyy);
        if (an > 0.15) ell(c, -18, by + 2, 6, 3.5, 'rgba(255,200,120,.8)'); break;
      case 'shield': fillRR(c, 7, -40, 9, 38, 2, '#7d8288'); fillRR(c, 8.5, -38, 6, 34, 1.5, '#959ba2'); c.fillStyle = '#222'; c.fillRect(10, -30, 4, 2.5); circ(c, 11.5, -20, 1, '#555'); circ(c, 11.5, -10, 1, '#555'); break;
      case 'flame': line(c, -8, by + 4, 6, hyy, 1.6, '#333'); fillRR(c, 2, hyy - 2.5, 16, 4.5, 1.5, '#3a3a32'); circ(c, 19, hyy - 0.5, 1.8, an > 0 ? '#ffb020' : '#555'); hand(hx, hyy); break;
      case 'mortar': fillRR(c, 8, -3, 12, 3, 1, '#333'); line(c, 13, -2, 20, -22, 4, '#3d4436'); hand(6, -12); break;
      case 'ladle': line(c, hx, hyy, 18, hyy - 12, 1.8, '#999'); ell(c, 19, hyy - 13, 3.5, 2.2, '#aaa'); hand(hx, hyy); break;
      case 'trumpet': line(c, 6, -30, 16, -30, 2, '#d8b84a'); c.fillStyle = '#e8c85a'; c.beginPath(); c.moveTo(15, -30); c.lineTo(22, -35); c.lineTo(22, -25); c.fill(); hand(8, -28);
        if (an > 0 || (o.t * 2 % 1) < 0.3) { c.fillStyle = '#fff'; c.font = 'bold 8px sans-serif'; c.fillText('♪', 22, -38 - (o.t * 10 % 6)); } break;
      case 'camera': fillRR(c, 6, -38, 10, 8, 1.5, '#222'); circ(c, 15, -34, 2.5, '#9fd8ff'); circ(c, 11, -41, 2.2, an > 0.1 ? '#fff' : '#ddd'); hand(6, -30); break;
      case 'wire': line(c, hx, hyy, 16, hyy - 5, 1.8, '#555'); line(c, 16, hyy - 5, 19, hyy - 2, 1.6, '#c33'); hand(hx, hyy); break;
      case 'frog': line(c, hx, hyy, 15, hyy - 3, 1.6, '#ccc'); circ(c, hx, hyy, 2.4, '#2a3238'); break;
      case 'saber': { const up = an > 0 ? 0.6 : -0.5; c.save(); c.translate(hx, hyy); c.rotate(up - 1.2); line(c, 0, 0, 0, -20, 1.8, '#dde3ea'); line(c, -3, 0, 3, 0, 2, '#d8b84a'); c.restore(); hand(hx, hyy); break; }
      case 'flag': line(c, hx, hyy + 6, hx + 2, -60, 1.6, '#6b4423'); D.flag(c, null, hx + 2, -60, 22, 14, o.t * 4); hand(hx, hyy); break;
      case 'wrench': c.save(); c.translate(hx, hyy); c.rotate(an > 0 ? 0.4 : -0.6); line(c, 0, 0, 14, -10, 2.6, '#9aa'); circ(c, 15, -11, 3.6, '#9aa'); circ(c, 16, -12, 1.6, '#333'); c.restore(); hand(hx, hyy);
        c.strokeStyle = '#c9a65a'; c.lineWidth = 1.5; c.beginPath(); c.arc(-10, -40, 5, o.t, o.t + PI * 1.7); c.stroke(); break;
      case 'baton': line(c, hx, hyy, 15, hyy - 8, 2.4, '#2a1f3a'); circ(c, 15, hyy - 8, 1.6, '#d8b84a'); hand(hx, hyy); break;
      case 'grenade': {
        const up = an > 0 ? 1 : 0;
        if (up) { hand(hx - 9, by - 9); fillRR(c, hx - 11, by - 14, 4, 6, 1.5, '#3d4a2c'); }
        else { hand(hx, hyy); fillRR(c, hx - 1, hyy - 6, 3.5, 5, 1.2, '#3d4a2c'); line(c, hx + 0.7, hyy - 6, hx + 0.7, hyy - 10, 1.2, '#6b4423'); }
        fillRR(c, -6, by + 9.2, 3, 4.5, 1, '#3d4a2c'); fillRR(c, 3.5, by + 9.2, 3, 4.5, 1, '#3d4a2c');
        break;
      }
      case 'medkit': hand(hx, hyy); fillRR(c, hx - 1, hyy - 1, 9, 7, 1.5, '#f2f2ec'); c.fillStyle = '#2f9a4a'; c.fillRect(hx + 2.4, hyy, 2.2, 5); c.fillRect(hx + 1, hyy + 1.4, 5, 2.2);
        fillRR(c, -14, by + 1, 6, 9, 2, '#e8e4d8'); break;
      default: hand(hx, hyy);
    }
    c.restore();
    if (o.winter) { for (let i = 0; i < 6; i++) { const a = o.t * 1.5 + i; circ(c, Math.cos(a) * 18, -25 + Math.sin(a * 1.3) * 18, 1.6, 'rgba(220,240,255,.8)'); } }
  }

  // ---------- 載具 ----------
  function tracks(c, L, h, ph, col) {
    fillRR(c, -L / 2, -h, L, h, h / 2, '#2c2c28');
    const n = Math.max(3, Math.round(L / 13));
    for (let i = 0; i < n; i++) { const x = -L / 2 + h / 2 + i * (L - h) / (n - 1); circ(c, x, -h / 2, h * 0.36, '#4a4a44'); circ(c, x, -h / 2, h * 0.28, '#5e5e56'); circ(c, x, -h / 2, h * 0.1, '#2a2a26'); }
    // 驅動輪齒、泥土
    c.save(); c.translate(L / 2 - h / 2, -h / 2); c.rotate(ph * 2); for (let k = 0; k < 8; k++) { c.rotate(PI / 4); c.fillStyle = '#3a3a34'; c.fillRect(h * 0.3, -1, h * 0.16, 2); } c.restore();
    c.fillStyle = 'rgba(110,85,55,.45)'; c.fillRect(-L / 2 + 2, -h * 0.35, L - 4, h * 0.3);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
    for (let x = -L / 2 + ((ph * 6) % 5); x < L / 2; x += 5) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x, -h + 1.6); c.stroke(); }
  }
  function tank(c, o) {
    const v = o.v, col = o.col, ph = o.phase || 0, an = o.anim || 0;
    const S = { light: [50, 11, 14, 24, 10, 22], med: [62, 13, 16, 28, 13, 30], heavy: [78, 15, 19, 34, 15, 38], spg: [66, 13, 15, 0, 0, 44], thor: [112, 20, 26, 50, 22, 62], bear: [100, 18, 24, 46, 20, 52], stug: [64, 13, 14, 0, 0, 34], flame: [64, 13, 16, 28, 13, 16] }[v];
    const [L, th, hh, tw, tth, gl] = S;
    const rec = an > 0 ? -3 * an / 0.3 : 0;
    tracks(c, L, th, ph, col);
    // 車身
    poly(c, [-L / 2 + 2, -th, -L / 2 + 6, -th - hh, L / 2 - 10, -th - hh, L / 2 + 1, -th - 3], col);
    c.fillStyle = shade(col, -0.18); c.fillRect(-L / 2 + 4, -th - 3, L - 6, 3);
    // 擋泥板、鉚釘、備用履帶、工具
    fillRR(c, -L / 2 + 1, -th - 1.5, L - 1, 2.2, 1, shade(col, -0.3));
    c.fillStyle = shade(col, 0.18); c.fillRect(-L / 2 + 7, -th - hh, L - 18, 2);
    for (let x = -L / 2 + 8; x < L / 2 - 12; x += 7) circ(c, x, -th - hh + 4, 0.8, shade(col, -0.35));
    for (let k = 0; k < 3; k++) fillRR(c, -L / 2 + 6 + k * 5, -th - hh * 0.55, 4, 4, 0.6, '#3a3a34');
    line(c, L / 4, -th - 6, L / 4 + 10, -th - 6, 1.2, '#6b4a2a');
    // 排氣管冒煙
    circ(c, -L / 2 - 2 - ((ph * 3) % 6), -th - hh * 0.6 - ((ph * 3) % 6), 3 + ((ph * 3) % 6) * 0.5, 'rgba(90,90,90,.25)');
    if (v === 'stug') {
      poly(c, [-L / 2 + 6, -th - hh, -L / 2 + 10, -th - hh - 12, 10, -th - hh - 12, 22, -th - hh], shade(col, 0.06));
      c.save(); c.translate(18 + rec, -th - hh - 6); fillRR(c, 0, -2.6, gl, 5.2, 2, shade(col, -0.3)); fillRR(c, gl - 5, -3.6, 7, 7.2, 1.5, shade(col, -0.4)); c.restore();
      fillRR(c, -6, -th - hh - 15, 9, 4, 1.5, shade(col, -0.2));
      if (o.player) eagle(c, -L / 4, -th - hh / 2, hh * 0.32, '#e8e8e8', '#3f4438');
      if (an > 0.12) muzzle(c, 18 + gl + 2, -th - hh - 6, 9);
      return;
    }
    if (v === 'spg') {
      poly(c, [-L / 2 + 6, -th - hh, -L / 2 + 8, -th - hh - 14, 6, -th - hh - 14, 12, -th - hh], shade(col, 0.08));
      c.save(); c.translate(6 + rec, -th - hh - 9); c.rotate(-0.22); fillRR(c, 0, -2.5, gl, 5, 2, shade(col, -0.3)); fillRR(c, gl - 4, -3.5, 6, 7, 1.5, shade(col, -0.4)); c.restore();
      circ(c, -10, -th - hh - 15, 5, '#f2c9a0'); c.save(); c.translate(-10, -th - hh - 15 + 33); c.scale(0.55, 0.55); c.translate(0, -27); helmet(c, o.helm || 'stahl', o.helmCol || col, o); c.restore();
    } else {
      const ty = -th - hh;
      const turretX = v === 'thor' ? -6 : -4;
      // 砲管
      c.save(); c.translate(turretX + tw / 2 - 2 + rec, ty - tth / 2);
      fillRR(c, 0, -2.6, gl, 5.2, 2, shade(col, -0.3)); fillRR(c, gl - 5, -3.6, 7, 7.2, 1.5, shade(col, -0.4));
      if (v === 'thor') { fillRR(c, 0, -10, gl * 0.9, 5, 2, shade(col, -0.3)); }
      c.restore();
      fillRR(c, turretX - tw / 2, ty - tth, tw, tth + 2, tth * 0.45, shade(col, 0.07));
      if (v === 'bear') { circ(c, turretX - tw / 2 + 6, ty - tth, 6, shade(col, 0.07)); circ(c, turretX + tw / 2 - 8, ty - tth, 6, shade(col, 0.07)); circ(c, turretX - tw / 2 + 6, ty - tth, 3, '#e8a0a0'); circ(c, turretX + tw / 2 - 8, ty - tth, 3, '#e8a0a0'); circ(c, turretX + tw / 2 - 2, ty - tth * 0.55, 2.2, '#111'); }
      fillRR(c, turretX - 5, ty - tth - 3, 10, 4, 2, shade(col, -0.2));
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(turretX - tw / 2 + 3, ty - tth + 1, tw - 6, 2);
      line(c, turretX - tw / 2 + 3, ty - tth, turretX - tw / 2 - 2, ty - tth - 16, 0.8, '#333');
      if (v === 'flame') { fillRR(c, -L / 2 + 2, -th - hh - 9, 14, 9, 3, '#5a5a4a'); circ(c, turretX + tw / 2 + gl + 1, ty - tth / 2, 2.4, an > 0 ? '#ffb020' : '#444'); }
      // 標誌
      if (o.em) { if (o.player) eagle(c, -L / 4 + 2, -th - hh / 2, hh * 0.32, '#e8e8e8', '#3f4438'); else circ(c, -L / 4 + 2, -th - hh / 2, hh * 0.3, o.em); }
      if (v === 'thor') { c.fillStyle = '#ffd34a'; c.beginPath(); c.moveTo(turretX, ty - tth + 4); c.lineTo(turretX - 5, ty - 4); c.lineTo(turretX, ty - 6); c.lineTo(turretX - 3, ty + 1); c.lineTo(turretX + 5, ty - 8); c.lineTo(turretX, ty - 7); c.fill(); }
    }
    if (an > 0.12) {
      if (v === 'spg') muzzle(c, 6 + gl * 0.97, -th - hh - 9 - gl * 0.22, 9);
      else { const tx0 = (v === 'thor' ? -6 : -4) + tw / 2 - 2 + gl + 2; muzzle(c, tx0, -th - hh - tth / 2, v === 'thor' ? 14 : 8); if (v === 'thor') muzzle(c, tx0 - gl * 0.1, -th - hh - tth / 2 - 7.5, 10); }
    }
  }
  function muzzle(c, x, y, r) {
    c.fillStyle = 'rgba(255,220,120,.95)'; c.beginPath(); c.moveTo(x, y - r * 0.5); c.lineTo(x + r * 1.6, y); c.lineTo(x, y + r * 0.5); c.fill();
    circ(c, x + 2, y, r * 0.5, 'rgba(255,255,220,.9)');
  }
  function plane(c, o) {
    const v = o.v, col = o.col, t = o.t || 0;
    const W = { fighter: 44, bomber: 74, transport: 82, ghost: 50, ark: 210, dive: 54 }[v];
    const H = W * 0.22;
    // 機身
    ell(c, 0, 0, W / 2, H / 2, col);
    poly(c, [-W / 2 + 2, -1, -W / 2 - 4, -H * 1.3, -W / 2 + W * 0.18, -H * 0.3], shade(col, -0.1));
    ell(c, -W / 2 + 4, 1, W * 0.12, H * 0.18, shade(col, -0.15));
    // 機翼
    ell(c, W * 0.02, H * 0.15, W * 0.24, H * 0.2, shade(col, -0.2));
    // 駕駛艙
    ell(c, W * 0.2, -H * 0.35, W * 0.11, H * 0.32, 'rgba(160,215,255,.9)');
    if (v === 'bomber' || v === 'transport' || v === 'ark') {
      const n = v === 'ark' ? 4 : 2;
      for (let i = 0; i < n; i++) { const ex = -W * 0.1 + i * W * 0.14; ell(c, ex, H * 0.32, W * 0.06, H * 0.2, shade(col, -0.3)); ell(c, ex + W * 0.06, H * 0.32, 1.5, H * 0.45 * Math.abs(Math.sin(t * 40 + i)), 'rgba(200,200,200,.7)'); }
      for (let i = 0; i < (v === 'ark' ? 8 : 3); i++) circ(c, -W * 0.25 + i * W * 0.08, -H * 0.05, H * 0.1, 'rgba(160,215,255,.7)');
    }
    if (v === 'dive') {
      c.strokeStyle = shade(col, -0.25); c.lineWidth = 3; c.beginPath(); c.moveTo(-W * 0.2, H * 0.1); c.lineTo(0, H * 0.45); c.lineTo(W * 0.22, H * 0.1); c.stroke();
      for (const gx of [W * 0.12, W * 0.24]) { line(c, gx, H * 0.3, gx + 1, H * 1.1, 1.6, '#333'); ell(c, gx + 1, H * 1.15, 3.2, 2.2, shade(col, -0.2)); }
      fillRR(c, -6, H * 0.4, 12, 3.5, 1.7, '#333');
      ell(c, W * 0.18, -H * 0.42, W * 0.16, H * 0.3, 'rgba(160,215,255,.9)');
    }
    // 螺旋槳
    ell(c, W / 2 + 1, 0, 2, H * 0.75 * Math.abs(Math.sin(t * 45)), 'rgba(220,220,220,.8)');
    circ(c, W / 2, 0, H * 0.16, '#333');
    if (o.player) eagle(c, -W * 0.18, 0, H * 0.35, '#e8e8e8', '#3f4438');
    else if (o.em) circ(c, -W * 0.18, 0, H * 0.3, o.em);
    if (v === 'ghost') { c.strokeStyle = 'rgba(160,230,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-W / 2 - 4, 0); c.lineTo(-W / 2 - 22 - Math.sin(t * 9) * 4, 0); c.stroke(); }
    if (v === 'ark') {
      const cols = ['#ff5a5a', '#ffb13d', '#ffe14d', '#5fd17a', '#4aa3ff', '#b26bff'];
      for (let i = 0; i < 6; i++) { c.fillStyle = cols[i]; c.fillRect(-W * 0.38 + i * 4, H * 0.42, W * 0.6, 1.4); }
    }
    if (o.anim > 0.1 && v !== 'transport') { muzzle(c, W / 2 + 2, H * 0.2, 5); }
  }
  function horse(c, o) {
    const ph = o.phase || 0, sw = Math.sin(ph * 1.4) * 5;
    const hc = o.wings ? '#f4f4f4' : '#7a4f2a';
    for (const [x, s] of [[-12, 1], [-7, -1], [9, 1], [14, -1]]) line(c, x, -12, x + sw * s * 0.6, 0, 3, shade(hc, -0.2));
    ell(c, 1, -17, 16, 7.5, hc);
    poly(c, [12, -20, 20, -34, 26, -31, 18, -16], hc); ell(c, 24, -31, 5, 3.4, hc);
    poly(c, [-15, -19, -24, -10 + sw * 0.3, -20, -20], shade(hc, -0.3));
    if (o.wings) { c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.moveTo(-10, -30); c.quadraticCurveTo(-30, -60 - sw, -2, -48); c.quadraticCurveTo(-6, -40, 0, -30); c.fill(); }
    c.save(); c.translate(0, -16); soldier(c, Object.assign({}, o, { gear: 'saber', phase: 0 })); c.restore();
  }
  function bike(c, o, motor) {
    const ph = o.phase || 0;
    const wheel = (x) => { c.strokeStyle = '#222'; c.lineWidth = 2.4; c.beginPath(); c.arc(x, -7, 7, 0, PI * 2); c.stroke(); line(c, x, -7, x + Math.cos(ph * 3) * 6, -7 + Math.sin(ph * 3) * 6, 0.8, '#666'); };
    wheel(-12); wheel(14);
    if (motor) { fillRR(c, -10, -18, 22, 8, 3, o.col); fillRR(c, -14, -16, 9, 6, 2, shade(o.col, -0.2)); line(c, 10, -18, 14, -7, 2, '#333'); line(c, 9, -20, 15, -24, 2, '#333'); }
    else { line(c, -12, -7, 0, -16, 1.6, '#555'); line(c, 0, -16, 14, -7, 1.6, '#555'); line(c, 0, -16, 10, -18, 1.6, '#555'); line(c, 10, -18, 14, -7, 1.6, '#555'); }
    c.save(); c.translate(-1, -11); soldier(c, Object.assign({}, o, { gear: motor ? 'smg' : 'rifle', phase: 0 })); c.restore();
  }
  function car(c, o) {
    const ph = o.phase || 0;
    for (const x of [-16, 16]) { circ(c, x, -7, 7, '#222'); circ(c, x, -7, 3, '#666'); line(c, x, -7, x + Math.cos(ph * 2) * 5, -7 + Math.sin(ph * 2) * 5, 1, '#888'); }
    poly(c, [-25, -8, -24, -22, -8, -28, 18, -28, 27, -16, 27, -8], o.col);
    fillRR(c, -8, -36, 16, 9, 4, shade(o.col, 0.08)); fillRR(c, 6, -34, 16, 3.5, 1.5, shade(o.col, -0.3));
    c.fillStyle = '#222'; c.fillRect(12, -24, 8, 2.5);
    if (o.em) circ(c, -12, -18, 3.5, o.em);
    if (o.anim > 0.12) muzzle(c, 22, -32.5, 5);
  }
  function gun(c, o) {
    const an = o.anim || 0, rec = an > 0 ? -3 * an / 0.3 : 0, col = o.col;
    if (o.mill) {
      fillRR(c, -12, -70, 24, 52, 4, '#c47a4a'); poly(c, [-14, -70, 0, -84, 14, -70], '#7a4a2a');
      c.save(); c.translate(0, -66); c.rotate(o.t * 1.5);
      for (let i = 0; i < 4; i++) { c.rotate(PI / 2); fillRR(c, -2, -38, 9, 34, 1, 'rgba(240,230,210,.95)'); line(c, 0, 0, 0, -38, 2, '#5a3a20'); }
      c.restore(); circ(c, 0, -66, 3, '#333');
    }
    circ(c, -6, -9, 9, '#3a3328'); circ(c, -6, -9, 3, '#777');
    line(c, -6, -9, -26, 0, 3, shade(col, -0.25));
    c.save(); c.translate(-2 + rec, -16); c.rotate(-0.25); fillRR(c, -8, -3.5, 40, 7, 3, shade(col, -0.2)); fillRR(c, 28, -4.5, 6, 9, 2, shade(col, -0.35)); c.restore();
    poly(c, [2, -6, 4, -28, 10, -26, 9, -6], col);
    if (an > 0.12) muzzle(c, 32, -25, 9);
    c.save(); c.translate(-20, 0); soldier(c, Object.assign({}, o, { gear: 'none', phase: 0 })); c.restore();
  }
  function rocket(c, o) {
    const col = o.col;
    for (const x of [-18, 2, 18]) { circ(c, x, -7, 7, '#222'); circ(c, x, -7, 2.5, '#666'); }
    fillRR(c, -26, -18, 54, 10, 2, shade(col, -0.15));
    fillRR(c, 14, -32, 14, 15, 3, col); fillRR(c, 20, -30, 6, 6, 1, 'rgba(160,215,255,.8)');
    c.save(); c.translate(-20, -20); c.rotate(-0.45);
    for (let i = 0; i < 4; i++) { fillRR(c, 0, -i * 4, 32, 3, 1, '#555'); if (!o.anim || i > 1) { fillRR(c, 18, -i * 4 - 1.4, 12, 2.6, 1.2, '#7a7a6a'); poly(c, [30, -i * 4 - 1.3, 34, -i * 4 + 0, 30, -i * 4 + 1.3], '#c33'); } }
    c.restore();
  }
  function aa(c, o) {
    const an = o.anim || 0;
    fillRR(c, -14, -8, 28, 8, 2, '#4a4a3a'); circ(c, -10, -2, 4, '#222'); circ(c, 10, -2, 4, '#222');
    fillRR(c, -6, -18, 14, 11, 3, D.PLAYER.veh);
    c.save(); c.translate(2, -15); c.rotate(-0.7);
    fillRR(c, 0, -5, 30, 3, 1, '#222'); fillRR(c, 0, 1, 30, 3, 1, '#222'); if (an > 0.1) { muzzle(c, 30, -3.5, 4); muzzle(c, 30, 2.5, 4); }
    c.restore();
    c.save(); c.translate(-18, 0); soldier(c, Object.assign({}, o, { gear: 'none', phase: 0 })); c.restore();
  }
  function train(c, o) {
    const ph = o.phase || 0, col = o.col, an = o.anim || 0;
    line(c, -70, 0.5, 70, 0.5, 2, '#5a4a3a');
    for (let x = -66; x <= 66; x += 12) fillRR(c, x - 3, -1, 6, 3, 1, '#6b5536');
    for (const x of [-52, -38, -20, 20, 38, 52]) { circ(c, x, -6, 6, '#2a2a2a'); line(c, x, -6, x + Math.cos(ph * 2) * 5, -6 + Math.sin(ph * 2) * 5, 1, '#777'); }
    fillRR(c, -62, -34, 124, 26, 4, col);
    c.fillStyle = shade(col, -0.2); for (let x = -58; x < 58; x += 14) c.fillRect(x, -30, 9, 3);
    poly(c, [58, -34, 72, -20, 72, -8, 58, -8], shade(col, -0.15));
    for (const tx of [-34, 22]) { fillRR(c, tx - 10, -46, 20, 13, 5, shade(col, 0.08)); fillRR(c, tx + 6, -42, 22, 4.5, 2, shade(col, -0.3)); if (an > 0.12) muzzle(c, tx + 28, -40, 7); }
    eagle(c, -8, -21, 7, '#e8e8e8', '#3f4438');
    fillRR(c, -4, -54, 8, 10, 2, '#333'); circ(c, 0, -60 - (o.t * 20 % 8), 4, 'rgba(200,200,200,.5)');
  }
  function landship(c, o) {
    const ph = o.phase || 0, col = o.col, an = o.anim || 0;
    tracks(c, 170, 18, ph, col);
    poly(c, [-86, -18, -80, -60, 70, -60, 98, -40, 86, -18], col);
    c.fillStyle = shade(col, -0.2); c.fillRect(-80, -30, 160, 4);
    for (let x = -70; x < 70; x += 16) circ(c, x, -24, 2.2, 'rgba(255,240,180,.8)');
    fillRR(c, -30, -92, 34, 34, 4, shade(col, 0.05)); fillRR(c, -24, -104, 10, 14, 2, '#444'); circ(c, -19, -112 - (o.t * 16 % 10), 5, 'rgba(180,180,180,.45)');
    for (const [tx, ty] of [[-60, -60], [28, -60], [-12, -92]]) {
      fillRR(c, tx - 12, ty - 12, 24, 13, 6, shade(col, 0.1)); fillRR(c, tx + 8, ty - 8, 34, 5, 2, shade(col, -0.3));
      if (an > 0.12) muzzle(c, tx + 42, ty - 5.5, 9);
    }
    if (o.player) eagle(c, 50, -42, 9, '#e8e8e8', '#3f4438'); else if (o.em) circ(c, 50, -42, 8, o.em);
    line(c, 8, -92, 8, -124, 1.5, '#333');
    if (o.player) D.flag(c, null, 8, -124, 22, 14, o.t * 3); else if (o.nat) D.flag(c, o.nat, 8, -124, 22, 14, o.t * 3);
  }
  function colossus(c, o) {
    const ph = o.phase || 0, col = o.col, an = o.anim || 0;
    tracks(c, 100, 22, ph, col); c.save(); c.translate(-90, 0); tracks(c, 70, 22, ph, col); c.restore();
    poly(c, [-130, -22, -124, -80, 40, -80, 56, -22], col);
    fillRR(c, -110, -130, 130, 52, 6, shade(col, 0.06)); fillRR(c, -80, -170, 70, 42, 6, shade(col, 0.12));
    for (const [tx, ty] of [[30, -60], [20, -110], [-10, -150]]) {
      fillRR(c, tx - 16, ty - 13, 32, 16, 7, shade(col, 0.15)); fillRR(c, tx + 12, ty - 9, 44, 7, 3, shade(col, -0.3));
      if (an > 0.1) muzzle(c, tx + 56, ty - 5.5, 11);
    }
    for (let x = -100; x < 10; x += 18) circ(c, x, -100, 3, 'rgba(255,240,180,.8)');
    eagle(c, -55, -50, 16, '#e8e8e8', '#3f4438');
    line(c, -45, -170, -45, -210, 2, '#333'); D.flag(c, null, -45, -210, 32, 20, o.t * 3);
  }
  function sub(c, o) {
    const col = o.col, t = o.t || 0;
    if (o.submerged) {
      line(c, 8, -2, 8, -26, 2.2, '#333'); fillRR(c, 6, -28, 9, 4, 1.5, '#333');
      c.fillStyle = 'rgba(110,80,50,.7)'; for (let i = 0; i < 5; i++) { ell(c, -i * 9 + Math.sin(t * 8 + i) * 2, -1, 5, 2.4, 'rgba(110,80,50,.55)'); }
      return;
    }
    ell(c, 0, -6, 62, 16, col); c.fillStyle = '#6b5a40'; c.fillRect(-70, -4, 140, 12);
    fillRR(c, -10, -36, 28, 22, 5, shade(col, 0.08)); line(c, 6, -36, 6, -50, 2, '#333');
    fillRR(c, 26, -20, 30, 5, 2, shade(col, -0.3));
    eagle(c, -30, -10, 7, '#e8e8e8', '#3f4438');
    if (o.anim > 0.1) muzzle(c, 56, -17.5, 9);
  }
  function pigeon(c, o) {
    const t = o.t || 0, fl = Math.sin(t * 18) * 0.8;
    ell(c, 0, 0, 11, 7, '#9aa3ad'); circ(c, 9, -5, 5.5, '#8a939d'); circ(c, 11, -6, 1.3, '#222');
    poly(c, [14, -5, 19, -3.5, 14, -3], '#e8a33a');
    c.save(); c.translate(-2, -3); c.rotate(fl); ell(c, -4, -6, 10, 4, '#b8c0c8'); c.restore();
    poly(c, [-10, -1, -18, -4, -17, 3], '#8a939d');
    fillRR(c, -3, 4, 7, 4, 1.5, '#c9a65a');
    c.fillStyle = D.PLAYER.helmCol; c.beginPath(); c.arc(9, -8, 5, PI, 0); c.fill();
  }
  function dog(c, o) {
    const ph = o.phase || 0, sw = Math.sin(ph * 1.5) * 4;
    for (const [x, s] of [[-9, 1], [-5, -1], [7, 1], [10, -1]]) line(c, x, -8, x + sw * s * 0.5, 0, 2.6, '#6b4a2a');
    ell(c, 0, -11, 13, 6, '#8a5f35'); circ(c, 13, -17, 6.5, '#8a5f35'); ell(c, 18, -15, 4, 3, '#a87a4a'); circ(c, 21, -16, 1.4, '#222'); circ(c, 14, -19, 1.2, '#222');
    poly(c, [9, -22, 11, -28, 14, -22], '#6b4a2a'); line(c, -12, -12, -18, -18 + sw * 0.4, 2.4, '#8a5f35');
    fillRR(c, -6, -16, 10, 5, 1.5, '#5b6152'); c.fillStyle = '#c33'; c.fillRect(8, -13, 6, 1.6);
  }

  function pillbox(c, o) {
    const an = o.anim || 0, col = '#8d8f86';
    ell(c, 0, -1, 30, 4, 'rgba(90,80,60,.6)');
    c.fillStyle = col; c.beginPath(); c.moveTo(-28, 0); c.quadraticCurveTo(-26, -34, 0, -36); c.quadraticCurveTo(26, -34, 28, 0); c.fill();
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.moveTo(-28, 0); c.quadraticCurveTo(-26, -34, 0, -36); c.lineTo(0, 0); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.8; for (const y of [-10, -20, -28]) { c.beginPath(); c.moveTo(-26, y); c.lineTo(26, y); c.stroke(); }
    fillRR(c, 6, -22, 18, 5, 2, '#1e1e1a'); fillRR(c, 18, -21, 14, 3, 1, '#2a2a2a');
    if (an > 0.1) muzzle(c, 32, -19.5, 6);
    for (let k = 0; k < 6; k++) fillRR(c, -30 + k * 10, -7, 10, 7, 3, k % 2 ? '#a89a72' : '#9a8c66');
    eagle(c, -10, -22, 5, '#e8e8e8', '#3f4438');
  }
  function halftrack(c, o) {
    const ph = o.phase || 0, col = o.col, an = o.anim || 0;
    c.save(); c.translate(-10, 0); tracks(c, 36, 10, ph, col); c.restore();
    circ(c, 20, -7, 7, '#222'); circ(c, 20, -7, 3, '#666'); line(c, 20, -7, 20 + Math.cos(ph * 2) * 5, -7 + Math.sin(ph * 2) * 5, 1, '#888');
    poly(c, [-30, -10, -29, -26, 12, -26, 16, -18, 30, -16, 30, -10], col);
    c.fillStyle = shade(col, -0.2); c.fillRect(14, -16, 16, 2); for (let k = 0; k < 4; k++) c.fillRect(17 + k * 3, -14, 1.5, 4);
    fillRR(c, 4, -30, 10, 5, 1, 'rgba(160,215,255,.8)');
    for (const dx of [-22, -12]) { circ(c, dx, -30, 4.2, '#f2c9a0'); c.fillStyle = o.helmCol || '#5f666f'; c.beginPath(); c.arc(dx, -32, 5, PI, 0); c.fill(); }
    line(c, -4, -27, -4, -36, 1.6, '#333'); fillRR(c, -6, -38, 18, 3.4, 1, '#2a2a2a');
    if (an > 0.1) muzzle(c, 13, -36.5, 5);
    if (o.player) eagle(c, -14, -18, 5, '#e8e8e8', '#3f4438'); else if (o.em) circ(c, -14, -18, 4, o.em);
  }

  // ---------- 單位（總入口） ----------
  // def.look 決定畫法；side 0 = 我方（灰色、面向左），1 = 敵方（國家配色、面向右）
  D.drawLook = function (c, look, side, nat, o) {
    const P = D.PLAYER;
    const uni = side ? nat.uni : P.uni;
    const veh = side ? shade(nat.uni, -0.05) : P.veh;
    const em = side ? nat.em : P.em;
    const base = {
      uni, helm: side ? nat.helm : P.helm, helmCol: side ? shade(nat.uni, -0.12) : P.helmCol, skin: '#f2c9a0',
      gear: look.gear, hat: look.hat, pack: look.pack, cape: look.cape, big: look.big, winter: look.hat === 'winter',
      phase: o.phase, anim: o.anim, t: o.t, col: veh, em, player: !side, band: side ? nat.band : null, nat, angry: !!side, v: look.v, mill: look.mill, wings: look.wings, submerged: o.submerged,
    };
    switch (look.k) {
      case 'inf': soldier(c, base); break;
      case 'squad':
        for (const dx of [-14, 0, 14]) { c.save(); c.translate(dx, dx === 0 ? 2 : 0); soldier(c, Object.assign({}, base, { gear: 'smg', hat: 'para', phase: base.phase + dx })); c.restore(); }
        break;
      case 'tank': tank(c, Object.assign(base, { col: look.v === 'thor' ? '#4d5560' : look.v === 'bear' ? '#9a2a24' : veh })); break;
      case 'plane': plane(c, Object.assign(base, { col: look.v === 'ghost' ? '#c8d8e8' : look.v === 'ark' ? '#3d4250' : side ? shade(nat.uni, 0.15) : '#7c8474' })); break;
      case 'horse': horse(c, base); break;
      case 'bike': bike(c, base, true); break;
      case 'bicycle': bike(c, base, false); break;
      case 'car': car(c, base); break;
      case 'gun': gun(c, base); break;
      case 'rocket': rocket(c, base); break;
      case 'aa': aa(c, base); break;
      case 'train': train(c, base); break;
      case 'landship': landship(c, Object.assign(base, { col: side ? shade(nat.uni, -0.1) : '#5f665a' })); break;
      case 'colossus': colossus(c, Object.assign(base, { col: '#5a6152' })); break;
      case 'sub': sub(c, Object.assign(base, { col: '#4d5560' })); break;
      case 'pigeon': pigeon(c, base); break;
      case 'pillbox': pillbox(c, base); break;
      case 'halftrack': halftrack(c, base); break;
      case 'dog': dog(c, base); break;
    }
  };

  D.unit = function (c, u, nat, t) {
    const look = u.def.look, big = look.big || 1;
    const fadeA = u.dead ? Math.max(0, 1 - u.fade / 1.2) : 1;
    if (fadeA <= 0) return;
    const y = -u.alt - (u.drop || 0) + (u.def.type === 'air' ? Math.sin(t * 3 + u.n) * 3 : 0);
    c.save();
    c.globalAlpha = fadeA * ((u.def.stealth || (u.def.stealthOnce && !u.revealed)) ? 0.45 : 1);
    // 影子
    if (!u.submerged) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(u.x, 1, 14 * big * (u.def.type === 'armor' ? 2.2 : 1), 3.5, 0, 0, PI * 2); c.fill(); }
    c.translate(u.x, y);
    if (u.dead) c.rotate(-u.dir * Math.min(1.2, u.fade * 2));
    if (u.drop > 0) { // 降落傘
      c.fillStyle = '#e8e4d8'; c.beginPath(); c.arc(0, -64 * big, 22 * big, PI, 0); c.fill();
      c.strokeStyle = '#999'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-22 * big, -64 * big); c.lineTo(-4, -26); c.moveTo(22 * big, -64 * big); c.lineTo(4, -26); c.stroke();
    }
    c.scale(u.dir * big, big);
    if (u.freeze > 0 && !u.dead) c.filter = 'saturate(0.2) brightness(1.3)';
    D.drawLook(c, look, u.side, nat, { phase: u.walk, anim: u.anim, t, submerged: u.submerged });
    c.filter = 'none';
    c.restore();
    if (u.freeze > 0 && !u.dead) { c.fillStyle = 'rgba(170,220,255,.35)'; rr(c, u.x - 16 * big, y - 48 * big, 32 * big, 50 * big, 6); c.fill(); }
    if (u.slow > 0 && !u.dead) { c.fillStyle = '#9ff'; c.font = 'bold 10px sans-serif'; c.fillText('🐌', u.x - 6, y - 50 * big); }
    if (u.def.boss && !u.dead) {
      const w = 60, f = Math.max(0, u.hp / u.max);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(u.x - w / 2, y - 75 * big - 12, w, 6);
      c.fillStyle = '#ff4d4d'; c.fillRect(u.x - w / 2 + 1, y - 75 * big - 11, (w - 2) * f, 4);
    }
  };

  // 角色頭像（名冊、出擊按鈕用）
  const iconCache = {};
  D.icon = function (def, w, h, form) {
    const key = def.id + w + 'x' + h + (form || 0);
    if (iconCache[key]) return iconCache[key];
    const cv = document.createElement('canvas');
    const dpr = 2; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const look = def.look, k = look.k;
    const sizes = { pillbox: 70, halftrack: 70, inf: 52, squad: 60, tank: def.look.v === 'thor' ? 140 : 90, plane: def.look.v === 'ark' ? 220 : 90, horse: 60, bike: 50, bicycle: 50, car: 60, gun: 70, rocket: 66, aa: 60, train: 150, landship: 200, colossus: 240, sub: 140, pigeon: 44, dog: 50 };
    const hgt = { pillbox: 40, halftrack: 42, inf: 50, squad: 50, tank: 46, plane: 30, horse: 70, bike: 50, bicycle: 50, car: 40, gun: 40, rocket: 40, aa: 40, train: 60, landship: 130, colossus: 220, sub: 55, pigeon: 25, dog: 30 };
    const big = look.big || 1;
    const sx = w / (sizes[k] * (k === 'inf' ? big : 1)), sy = h / (hgt[k] * (k === 'inf' ? big : 1) + 6);
    const s = Math.min(sx, sy) * 0.95;
    c.translate(w / 2 + (k === 'colossus' ? 30 * s : 0), k === 'plane' || k === 'pigeon' ? h / 2 : h - 3);
    c.scale(-s * (k === 'inf' ? big : 1), s * (k === 'inf' ? big : 1));
    if (form) c.filter = 'saturate(1.2) contrast(1.08)';
    D.drawLook(c, look, 0, null, { phase: 0, anim: 0, t: 0.3 });
    iconCache[key] = cv;
    return cv;
  };
  D.enemyIcon = function (def, nat, w, h) {
    const cv = document.createElement('canvas'); const dpr = 2; cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const k = def.look.k;
    const s = Math.min(w / ({ tank: 90, plane: 90, landship: 200, horse: 60, car: 60, gun: 70, rocket: 66 }[k] || 50), h / ({ landship: 130, plane: 30 }[k] || 54)) * 0.9;
    c.translate(w / 2, k === 'plane' ? h / 2 : h - 3); c.scale(s, s);
    D.drawLook(c, Object.assign({}, def.look, { big: 1 }), 1, nat, { phase: 0, anim: 0, t: 0.3 });
    return cv;
  };

  // ---------- 碉堡（每個國家不一樣） ----------
  D.base = function (c, style, x, col, frac, t, nat, hit) {
    c.save(); c.translate(x, 0);
    if (hit > 0) c.translate((Math.random() - 0.5) * 4, 0);
    const dk = shade(col, -0.25), lt = shade(col, 0.2);
    const win = (wx, wy, ww, wh) => fillRR(c, wx, wy, ww, wh, 1.5, 'rgba(30,30,40,.75)');
    const flagAt = (fx, fy, s) => { line(c, fx, fy, fx, fy - 34 * s, 2, '#444'); D.flag(c, nat, fx, fy - 34 * s, 30 * s, 19 * s, t * 3); };
    switch (style) {
      case 'player':
        fillRR(c, -58, -96, 116, 96, 8, '#7d8273'); fillRR(c, -64, -14, 128, 14, 3, '#5b6152');
        fillRR(c, -40, -150, 80, 60, 6, '#8a8f80'); poly(c, [-48, -150, 0, -176, 48, -150], '#5b6152');
        for (let i = -3; i <= 3; i++) fillRR(c, i * 15 - 5, -104, 10, 10, 1, '#6b705f');
        win(-45, -70, 22, 8); win(23, -70, 22, 8); fillRR(c, -14, -44, 28, 44, 4, '#3f4438');
        eagle(c, 0, -124, 18, '#e8e8e8', '#3f4438');
        line(c, 32, -150, 32, -200, 2.4, '#444'); D.flag(c, null, 32, -200, 36, 22, t * 3);
        fillRR(c, -66, -84, 26, 8, 3, '#4a4f42'); fillRR(c, -88, -82, 24, 4, 2, '#333');
        break;
      case 'tower':
        fillRR(c, -26, -150, 52, 150, 4, col); for (let y = -140; y < -10; y += 26) win(-8, y, 16, 12);
        for (let i = -2; i <= 2; i++) fillRR(c, i * 11 - 4, -162, 8, 14, 1, lt); poly(c, [-30, -162, 0, -200, 30, -162], '#6a7fa0');
        fillRR(c, -50, -50, 26, 50, 3, dk); fillRR(c, 24, -50, 26, 50, 3, dk); flagAt(0, -200, 1); break;
      case 'lighthouse':
        poly(c, [-24, 0, -15, -150, 15, -150, 24, 0], col); for (let y = -130; y < 0; y += 40) { c.fillStyle = '#c8323a'; c.fillRect(-22 + (y + 130) * 0.04, y, 44 - (y + 130) * 0.08, 14); }
        fillRR(c, -20, -172, 40, 24, 4, '#333'); circ(c, 0, -160, 9, `rgba(255,240,150,${0.6 + Math.sin(t * 3) * 0.3})`); poly(c, [-22, -172, 0, -192, 22, -172], '#c8323a');
        fillRR(c, -60, -36, 40, 36, 3, '#e0d8c4'); poly(c, [-64, -36, -40, -56, -16, -36], '#8a4a3a'); flagAt(40, -40, 1); break;
      case 'windmill':
        fillRR(c, -50, -50, 100, 50, 3, '#a8604a'); poly(c, [-30, -50, -20, -140, 20, -140, 30, -50], col); poly(c, [-24, -140, 0, -165, 24, -140], '#5a3a2a');
        c.save(); c.translate(0, -130); c.rotate(t * 0.8); for (let i = 0; i < 4; i++) { c.rotate(PI / 2); fillRR(c, -3, -80, 13, 72, 1, 'rgba(250,240,220,.95)'); line(c, 0, 0, 0, -80, 3, '#5a3a20'); } c.restore();
        circ(c, 0, -130, 5, '#333'); win(-8, -100, 16, 20); flagAt(36, -50, 1); break;
      case 'fort':
        poly(c, [-70, 0, -60, -70, 60, -70, 70, 0], col); for (let i = -3; i <= 3; i++) fillRR(c, i * 18 - 6, -82, 12, 14, 1, dk);
        fillRR(c, -30, -120, 60, 52, 4, lt); fillRR(c, -10, -128, 60, 10, 3, dk); fillRR(c, 40, -126, 30, 5, 2, '#333');
        win(-55, -40, 30, 7); win(25, -40, 30, 7); flagAt(-20, -120, 1); break;
      case 'battery':
        poly(c, [-80, 0, -60, -60, -20, -90, 40, -84, 70, -40, 80, 0], '#6b7076'); poly(c, [-20, -90, 0, -120, 30, -84], '#f4f6f8');
        fillRR(c, -30, -110, 50, 24, 10, col); c.save(); c.translate(10, -100); c.rotate(-0.15); fillRR(c, 0, -4, 70, 8, 3, '#333'); c.restore();
        flagAt(-50, -60, 1); break;
      case 'factory':
        fillRR(c, -70, -80, 140, 80, 3, col); for (let i = 0; i < 4; i++) poly(c, [-70 + i * 35, -80, -70 + i * 35, -100, -35 + i * 35, -80], dk);
        for (const cx of [-40, 20]) { fillRR(c, cx, -150, 16, 70, 2, '#5a4a40'); circ(c, cx + 8, -160 - (t * 20 % 20), 8, 'rgba(120,120,120,.5)'); }
        for (let i = 0; i < 4; i++) win(-60 + i * 32, -60, 20, 14); fillRR(c, -14, -36, 28, 36, 2, '#3a2a20'); flagAt(56, -80, 1); break;
      case 'temple':
        fillRR(c, -72, -14, 144, 14, 1, dk); fillRR(c, -66, -24, 132, 10, 1, col);
        for (let i = 0; i < 6; i++) { fillRR(c, -60 + i * 24, -110, 12, 86, 2, col); c.fillStyle = dk; c.fillRect(-58 + i * 24, -105, 2, 76); }
        fillRR(c, -70, -120, 140, 12, 1, col); poly(c, [-74, -120, 0, -152, 74, -120], lt); flagAt(0, -152, 1); break;
      case 'logfort':
        for (let i = 0; i < 9; i++) { fillRR(c, -72 + i * 16, -100 + (i % 2) * 6, 14, 100, 6, i % 2 ? col : shade(col, 0.1)); poly(c, [-72 + i * 16, -100 + (i % 2) * 6, -65 + i * 16, -112 + (i % 2) * 6, -58 + i * 16, -100 + (i % 2) * 6], dk); }
        fillRR(c, -26, -150, 52, 40, 3, shade(col, 0.15)); poly(c, [-32, -150, 0, -170, 32, -150], dk); win(-14, -140, 28, 8); flagAt(30, -150, 1); break;
      case 'manor':
        fillRR(c, -76, -90, 152, 90, 3, col); poly(c, [-82, -90, 0, -130, 82, -90], '#8a3a32');
        for (let i = 0; i < 5; i++) win(-66 + i * 28, -76, 16, 22); for (let i = 0; i < 5; i++) win(-66 + i * 28, -42, 16, 22);
        fillRR(c, -14, -40, 28, 40, 10, '#4a3a2a'); circ(c, 0, -106, 9, '#f2f2f2'); flagAt(0, -130, 1); break;
      case 'palisade':
        for (let i = 0; i < 10; i++) { fillRR(c, -75 + i * 15, -90, 12, 90, 2, i % 2 ? col : shade(col, 0.1)); poly(c, [-75 + i * 15, -90, -69 + i * 15, -104, -63 + i * 15, -90], dk); }
        fillRR(c, -30, -150, 60, 56, 3, shade(col, 0.2)); poly(c, [-40, -150, 0, -182, 40, -150], '#5a3a20');
        c.strokeStyle = '#d8dde4'; c.lineWidth = 3; c.beginPath(); c.arc(0, -122, 12, 0.3, PI * 1.9); c.stroke(); flagAt(36, -150, 1); break;
      case 'stonefort':
        fillRR(c, -72, -96, 144, 96, 2, col); for (let y = -90; y < 0; y += 12) for (let x = -72 + (y % 24 ? 0 : 10); x < 72; x += 20) { c.strokeStyle = dk; c.lineWidth = 1; c.strokeRect(x, y, 20, 12); }
        for (let i = -3; i <= 3; i++) fillRR(c, i * 20 - 7, -108, 14, 14, 1, col); fillRR(c, -14, -44, 28, 44, 12, '#3a2a20'); flagAt(0, -108, 1.1); break;
      case 'station':
        fillRR(c, -70, -70, 140, 70, 2, col); c.strokeStyle = dk; c.lineWidth = 1; for (let x = -70; x < 70; x += 6) { c.beginPath(); c.moveTo(x, -70); c.lineTo(x, 0); c.stroke(); }
        poly(c, [-80, -70, -60, -100, 60, -100, 80, -70], '#b85a3a'); fillRR(c, 40, -150, 6, 80, 1, '#666');
        c.save(); c.translate(43, -150); c.rotate(t * 2); for (let i = 0; i < 8; i++) { c.rotate(PI / 4); fillRR(c, 0, -1.5, 18, 3, 1, '#ddd'); } c.restore(); win(-50, -50, 24, 16); win(-10, -50, 24, 16); flagAt(-40, -100, 1); break;
      case 'timber':
        for (let i = 0; i < 6; i++) fillRR(c, -70, -16 - i * 16, 140, 15, 7, i % 2 ? col : shade(col, 0.12));
        poly(c, [-80, -96, 0, -140, 80, -96], '#3d5a3a'); win(-50, -66, 22, 18); win(28, -66, 22, 18); fillRR(c, -12, -42, 24, 42, 2, '#3a2a1a');
        D.emblem(c, 'leaf', 0, -112, 12, '#c0392b'); flagAt(60, -96, 1); break;
      case 'hillfort':
        poly(c, [-90, 0, -60, -40, 60, -40, 90, 0], '#8a7a5a');
        fillRR(c, -60, -110, 120, 72, 2, col); for (let i = -3; i <= 3; i++) poly(c, [i * 17 - 7, -110, i * 17, -122, i * 17 + 7, -110], col);
        circ(c, -40, -120, 12, lt); circ(c, 40, -120, 12, lt); fillRR(c, -14, -80, 28, 40, 14, '#3a2a20'); flagAt(0, -122, 1); break;
      case 'adobe':
        fillRR(c, -72, -78, 144, 78, 6, col); fillRR(c, -40, -120, 80, 44, 6, lt);
        for (let i = 0; i < 7; i++) circ(c, -60 + i * 20, -80, 3, '#7a5a3a'); win(-56, -50, 18, 20); win(38, -50, 18, 20); fillRR(c, -14, -44, 28, 44, 14, '#5a3a20');
        D.emblem(c, 'cactus', 0, -100, 12, '#2f8f4e'); flagAt(30, -120, 1); break;
      case 'jungle':
        for (let i = 0; i < 3; i++) fillRR(c, -60 + i * 50, -60, 8, 60, 2, '#6b4a2a');
        fillRR(c, -70, -76, 140, 20, 3, '#7a5a3a'); poly(c, [-84, -76, 0, -120, 84, -76], col);
        for (let i = 0; i < 6; i++) ell(c, -60 + i * 24, -86 - (i % 2) * 8, 18, 6, shade(col, 0.15), -0.3 + i * 0.1);
        fillRR(c, -50, -30, 100, 30, 3, '#8a6a4a'); win(-30, -24, 60, 8); flagAt(50, -100, 1); break;
      case 'line':
        poly(c, [-86, 0, -76, -54, 76, -54, 86, 0], col); fillRR(c, -86, -10, 172, 10, 1, dk);
        for (const tx of [-36, 30]) { c.fillStyle = lt; c.beginPath(); c.arc(tx, -54, 22, PI, 0); c.fill(); c.save(); c.translate(tx + 12, -62); c.rotate(-0.08); fillRR(c, 0, -3, 46, 6, 2, '#333'); c.restore(); }
        win(-60, -36, 36, 7); win(20, -36, 36, 7); fillRR(c, -5, -120, 10, 66, 1, '#555'); flagAt(0, -120, 1); break;
      case 'castle':
        fillRR(c, -70, -100, 140, 100, 2, col);
        for (let i = -3; i <= 3; i++) fillRR(c, i * 20 - 7, -112, 14, 14, 1, col);
        for (const tx of [-70, 50]) { fillRR(c, tx, -150, 22, 150, 2, lt); for (let k = 0; k < 2; k++) fillRR(c, tx + k * 12, -160, 9, 12, 1, lt); }
        fillRR(c, -18, -56, 36, 56, 18, '#3a2a20'); win(-50, -84, 12, 18); win(38, -84, 12, 18); D.emblem(c, 'crown', 0, -84, 12, '#ffd34a');
        flagAt(-59, -160, 1); ell(c, 50, -230 + Math.sin(t) * 5, 18, 10, '#c8ccd0'); line(c, 50, -220, 60, -160, 0.8, '#666'); break;
      case 'steel':
        fillRR(c, -74, -84, 148, 84, 3, col); for (let x = -70; x < 74; x += 16) { c.fillStyle = dk; c.fillRect(x, -84, 2, 84); }
        fillRR(c, -40, -150, 80, 70, 3, lt); for (let i = 0; i < 3; i++) win(-30 + i * 22, -136, 14, 40);
        D.emblem(c, 'bigstar', -50, -50, 14, '#1f3a7a'); D.emblem(c, 'bigstar', 50, -50, 14, '#1f3a7a');
        fillRR(c, -14, -44, 28, 44, 2, '#333'); c.save(); c.translate(30, -160); c.rotate(-0.1); fillRR(c, 0, -4, 50, 8, 3, '#333'); c.restore(); fillRR(c, 10, -168, 30, 18, 6, dk); flagAt(-30, -150, 1); break;
      case 'kremlin':
        fillRR(c, -80, -70, 160, 70, 2, col); for (let i = -4; i <= 4; i++) poly(c, [i * 18 - 7, -70, i * 18 - 7, -82, i * 18, -78, i * 18 + 7, -82, i * 18 + 7, -70], col);
        fillRR(c, -20, -190, 40, 124, 2, shade(col, 0.08)); poly(c, [-24, -190, 0, -236, 24, -190], '#2f5a3a'); star(c, 0, -246, 12, '#ff3a2a'); star(c, 0, -246, 7, '#ffd34a');
        for (const dx of [-56, 56]) { fillRR(c, dx - 14, -130, 28, 62, 2, lt); c.fillStyle = '#d8b84a'; c.beginPath(); c.moveTo(dx - 16, -130); c.quadraticCurveTo(dx - 20, -160, dx, -172); c.quadraticCurveTo(dx + 20, -160, dx + 16, -130); c.fill(); }
        win(-8, -170, 16, 24); circ(c, 0, -120, 12, '#f2f2f2'); line(c, 0, -120, 0, -128, 1.5, '#222'); line(c, 0, -120, 6 * Math.cos(t), -120 + 6 * Math.sin(t), 1.5, '#222');
        fillRR(c, -16, -50, 32, 50, 16, '#3a1a1a'); break;
      case 'bastion':
        poly(c, [-90, 0, -70, -40, 70, -40, 90, 0], '#8a7a5a');
        fillRR(c, -60, -110, 120, 72, 2, col); for (let i = -3; i <= 3; i++) fillRR(c, i * 17 - 6, -120, 12, 12, 1, col);
        fillRR(c, -78, -140, 34, 102, 14, lt); for (let i = 0; i < 3; i++) fillRR(c, -76 + i * 11, -150, 8, 12, 1, lt);
        for (const yy of [-120, -95, -70]) win(-64, yy, 4, 12); win(-20, -90, 4, 14); win(18, -90, 4, 14);
        fillRR(c, -14, -78, 28, 40, 14, '#3a2a20'); flagAt(30, -120, 1); break;
      case 'colonial':
        fillRR(c, -70, -100, 140, 100, 2, col); poly(c, [-80, -100, 0, -136, 80, -100], '#3d6a4a');
        fillRR(c, -74, -60, 148, 6, 1, lt); for (let i = 0; i < 6; i++) fillRR(c, -66 + i * 26, -54, 6, 54, 2, '#fff');
        for (let i = 0; i < 4; i++) win(-56 + i * 32, -90, 16, 22); fillRR(c, -12, -44, 24, 44, 2, '#5a3a20');
        for (let k = 0; k < 7; k++) fillRR(c, -70 + k * 20, -12, 20, 12, 5, k % 2 ? '#a89a72' : '#9a8c66'); flagAt(56, -136, 1); break;
      case 'obelisk':
        poly(c, [-50, 0, -42, -190, -30, -204, -18, -190, -10, 0], '#8a7a64'); for (let y = -170; y < -10; y += 26) win(-36, y, 12, 9);
        circ(c, -30, -200, 6, '#9a8a74');
        fillRR(c, 0, -60, 80, 60, 30, col); poly(c, [-6, -56, 40, -110, 86, -56], '#a8884a');
        fillRR(c, 28, -36, 24, 36, 12, '#3a2a20'); flagAt(70, -100, 1); break;
      case 'colonialfort':
        poly(c, [-84, 0, -76, -80, 76, -80, 84, 0], col); fillRR(c, -86, -10, 172, 10, 1, dk);
        for (let i = -4; i <= 4; i++) fillRR(c, i * 17 - 6, -90, 12, 12, 1, col);
        for (const dx of [-74, 62]) { fillRR(c, dx, -120, 14, 34, 4, lt); c.fillStyle = '#c86a3a'; c.beginPath(); c.arc(dx + 7, -120, 8, PI, 0); c.fill(); win(dx + 4, -110, 6, 8); }
        fillRR(c, -16, -56, 32, 56, 16, '#4a3020'); flagAt(0, -90, 1); break;
      case 'persian':
        fillRR(c, -80, -110, 160, 110, 2, col); fillRR(c, -40, -150, 80, 50, 2, lt);
        c.fillStyle = '#2a6aa8'; c.beginPath(); c.moveTo(-28, 0); c.lineTo(-28, -90); c.quadraticCurveTo(0, -130, 28, -90); c.lineTo(28, 0); c.fill();
        c.fillStyle = '#3a2a20'; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-18, -70); c.quadraticCurveTo(0, -98, 18, -70); c.lineTo(18, 0); c.fill();
        c.fillStyle = '#4a9ad0'; c.beginPath(); c.arc(0, -150, 26, PI, 0); c.fill(); circ(c, 0, -178, 3, '#d8b84a');
        for (const dx of [-62, 46]) { win(dx, -90, 14, 20); win(dx, -50, 14, 20); } flagAt(60, -110, 1); break;
      case 'pyramid':
        poly(c, [-110, 0, 0, -170, 110, 0], col); c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(0, -170); c.lineTo(110, 0); c.lineTo(0, 0); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; for (let y = -150; y < 0; y += 16) { const w2 = (170 + y) / 170 * 110; c.beginPath(); c.moveTo(-w2, y); c.lineTo(w2, y); c.stroke(); }
        fillRR(c, -50, -44, 100, 44, 8, '#8f949a'); fillRR(c, -38, -30, 76, 7, 2, '#1e1e1a'); c.save(); c.translate(20, -26); fillRR(c, 0, -3, 46, 6, 2, '#333'); c.restore();
        flagAt(-60, -44, 1); break;
      case 'ottoman':
        fillRR(c, -70, -96, 140, 96, 2, col); for (let i = -3; i <= 3; i++) fillRR(c, i * 20 - 7, -108, 14, 14, 1, col);
        for (const dx of [-84, 56]) { fillRR(c, dx, -150, 30, 150, 3, lt); poly(c, [dx - 4, -150, dx + 15, -190, dx + 34, -150], '#7a5a3a'); win(dx + 10, -130, 10, 16); win(dx + 10, -90, 10, 16); }
        c.fillStyle = '#3a2a20'; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-18, -44); c.quadraticCurveTo(0, -64, 18, -44); c.lineTo(18, 0); c.fill();
        flagAt(0, -108, 1); break;
      case 'inca':
        for (let k = 0; k < 4; k++) { const w2 = 90 - k * 16, y0 = -k * 34; poly(c, [-w2, y0, -w2 + 6, y0 - 34, w2 - 6, y0 - 34, w2, y0], k % 2 ? col : lt);
          c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let x = -w2 + 14; x < w2 - 8; x += 18) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x + 3, y0 - 34); c.stroke(); } }
        poly(c, [-14, 0, -10, -46, 10, -46, 14, 0], '#3a2a20'); poly(c, [-10, -102, -7, -126, 7, -126, 10, -102], '#2a2016');
        flagAt(40, -136, 1); break;
    }
    // 損壞效果
    if (frac < 0.6) for (let i = 0; i < (frac < 0.3 ? 3 : 1); i++) { const sx = -30 + i * 30, sy = -60 - ((t * 20 + i * 13) % 40); circ(c, sx, sy, 10 + ((t * 20 + i * 13) % 40) * 0.4, `rgba(60,60,60,${0.5 - ((t * 20 + i * 13) % 40) / 90})`); }
    if (frac < 0.3) { circ(c, -20, -50, 6 + Math.sin(t * 12) * 2, 'rgba(255,140,40,.8)'); circ(c, 25, -30, 5 + Math.cos(t * 10) * 2, 'rgba(255,170,50,.8)'); }
    c.restore();
  };

  // ---------- 背景 ----------
  const TER = {
    town:      { sky: ['#8ec5ff', '#dceeff'], far: 'hills', farCol: '#8fb0a0', mid: 'houses', midCol: '#c9b49a', g: ['#7fae5a', '#6a9648'] },
    harbor:    { sky: ['#9ccfff', '#e6f3ff'], far: 'sea', farCol: '#5a92c8', mid: 'boats', midCol: '#f0ece0', g: ['#b8a888', '#a0917a'] },
    canal:     { sky: ['#a8d4ff', '#eef6ff'], far: 'flat', farCol: '#8fb88a', mid: 'windmills', midCol: '#c47a4a', g: ['#7ab060', '#5f9a4c'], water: true },
    fortland:  { sky: ['#9ab8d8', '#dfe8f0'], far: 'hills', farCol: '#8a9a88', mid: 'bunkers', midCol: '#9a9a90', g: ['#7a9a5a', '#688848'] },
    fjord:     { sky: ['#a0c4e8', '#f0f6fb'], far: 'mountains', farCol: '#7d8fa8', snowcap: true, mid: 'pines', midCol: '#3d5a4a', g: ['#e8eef3', '#d4dde4'] },
    industry:  { sky: ['#a8b0b8', '#dcdcd4'], far: 'mountains', farCol: '#8a9098', mid: 'factories', midCol: '#8c6b5a', g: ['#8a8a6a', '#76765a'] },
    olive:     { sky: ['#7ec0ff', '#e8f6ff'], far: 'hills', farCol: '#c8b88a', mid: 'olives', midCol: '#6a8a4a', g: ['#d2bc88', '#bfa874'] },
    forest:    { sky: ['#8aa8a0', '#c8d8d0'], far: 'mountains', farCol: '#5a7a6a', mid: 'trees', midCol: '#3a6a3a', g: ['#5a7a3a', '#4a682e'] },
    wheat:     { sky: ['#8ec5ff', '#fff4d8'], far: 'flat', farCol: '#c8b060', mid: 'wheat', midCol: '#e0c060', g: ['#c8a848', '#b39538'] },
    hills:     { sky: ['#8ec5ff', '#e2f2ff'], far: 'hills', farCol: '#5f9a5a', mid: 'ferns', midCol: '#3a6a3a', g: ['#6aa24a', '#58903c'] },
    savanna:   { sky: ['#ffd08a', '#fff0d0'], far: 'flat', farCol: '#c8a868', mid: 'acacia', midCol: '#5a6a2a', g: ['#d0b060', '#bc9c4c'] },
    outback:   { sky: ['#ffb070', '#ffe4c0'], far: 'mesa', farCol: '#b8583a', mid: 'rocks', midCol: '#a04a2a', g: ['#c8683a', '#b0582e'] },
    maple:     { sky: ['#9cc8f0', '#eef6fb'], far: 'sea', farCol: '#4a7aa8', mid: 'maples', midCol: '#c8442a', g: ['#d8c49a', '#c4ae84'] },
    mountain:  { sky: ['#b0c8e0', '#eef2f6'], far: 'mountains', farCol: '#8a94a8', snowcap: true, mid: 'rocks', midCol: '#8a7a6a', g: ['#8a9a6a', '#788858'] },
    plateau:   { sky: ['#6ab0ff', '#f0f8ff'], far: 'mesa', farCol: '#c89a6a', mid: 'cacti', midCol: '#4a8a4a', g: ['#d8b07a', '#c49c66'] },
    jungle:    { sky: ['#8ab89a', '#d8ecd8'], far: 'hills', farCol: '#3a7a4a', mid: 'palms', midCol: '#2a6a3a', g: ['#4a7a2a', '#3c6a22'] },
    lavender:  { sky: ['#a8c8f8', '#f6eefc'], far: 'hills', farCol: '#a0b08a', mid: 'lavender', midCol: '#9a7ac8', g: ['#8aa860', '#78964e'] },
    city:      { sky: ['#a8b4c4', '#e4e8ee'], far: 'skyline', farCol: '#8a94a4', mid: 'houses', midCol: '#a8a098', g: ['#8a8a84', '#7a7a74'] },
    desert:    { sky: ['#ffd890', '#fff6e0'], far: 'dunes', farCol: '#e0b878', mid: 'palms', midCol: '#4a7a3a', g: ['#e8c88a', '#d8b676'] },
    cliffs:    { sky: ['#9cc4ec', '#eef4fa'], far: 'sea', farCol: '#4a7ab0', mid: 'whitecliff', midCol: '#f2f2ea', g: ['#7aa860', '#68964e'] },
    beach:     { sky: ['#8ac8ff', '#eaf6ff'], far: 'sea', farCol: '#3a8ac8', mid: 'hedgehogs', midCol: '#555', g: ['#ead8a8', '#dcc896'] },
    snowfield: { sky: ['#b8c8d8', '#eef2f6'], far: 'flat', farCol: '#d8e0e8', mid: 'birches', midCol: '#e8e8e8', g: ['#f2f5f8', '#e2e8ee'] },
    steppe:    { sky: ['#b8c0b0', '#e8e8d8'], far: 'flat', farCol: '#a8a878', mid: 'grass', midCol: '#8a8a5a', g: ['#9a9a64', '#888852'] },
    ruins:     { sky: ['#8a8a8a', '#c8c4bc'], far: 'skyline', farCol: '#6a6a6a', mid: 'ruins', midCol: '#7a7068', g: ['#7a746a', '#6a645a'] },
    highland:  { sky: ['#8ec5ff', '#e6f2ff'], far: 'mountains', farCol: '#8a8a6a', mid: 'acacia', midCol: '#4a6a2a', g: ['#9aa060', '#888e50'] },
    tropic:    { sky: ['#7ec8ff', '#eaf8ff'], far: 'sea', farCol: '#2aa0c8', mid: 'palms', midCol: '#3a8a3a', g: ['#c8b878', '#b4a464'] },
    persia:    { sky: ['#ffd8a0', '#fff4e0'], far: 'mesa', farCol: '#c8a070', mid: 'ruins', midCol: '#c8a878', g: ['#d8bc88', '#c8aa74'] },
    capital:   { sky: ['#9aa8b8', '#e0e6ec'], far: 'domes', farCol: '#8a98a8', mid: 'birches', midCol: '#e8e8e8', g: ['#eef2f6', '#dde4ea'] },
  };
  D.TER = TER;

  function farLayer(c, ter, x0, x1, gy, seed) {
    const r = srand(seed), col = ter.farCol;
    c.fillStyle = col;
    switch (ter.far) {
      case 'hills': c.beginPath(); c.moveTo(x0, gy); for (let x = x0; x <= x1 + 40; x += 40) c.lineTo(x, gy - 40 - Math.sin(x * 0.006 + seed) * 25 - Math.sin(x * 0.017) * 10); c.lineTo(x1 + 40, gy); c.fill(); break;
      case 'mountains': {
        let x = x0 - 100; while (x < x1 + 100) { const w = 140 + r() * 160, h = 90 + r() * 110; poly(c, [x, gy, x + w / 2, gy - h, x + w, gy], col);
          if (ter.snowcap) poly(c, [x + w / 2 - w * 0.13, gy - h * 0.74, x + w / 2, gy - h, x + w / 2 + w * 0.13, gy - h * 0.74], '#f4f8fb'); x += w * 0.6; }
        break; }
      case 'mesa': { let x = x0 - 100; while (x < x1 + 100) { const w = 120 + r() * 160, h = 50 + r() * 60; poly(c, [x, gy, x + 20, gy - h, x + w - 20, gy - h, x + w, gy], col); x += w + r() * 80; } break; }
      case 'dunes': c.beginPath(); c.moveTo(x0, gy); for (let x = x0; x <= x1 + 30; x += 30) c.lineTo(x, gy - 25 - Math.sin(x * 0.01 + seed) * 18); c.lineTo(x1 + 30, gy); c.fill(); break;
      case 'sea': c.fillStyle = col; c.fillRect(x0, gy - 30, x1 - x0, 30); c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = x0; x < x1; x += 50) c.fillRect(x + (seed * 7 % 30), gy - 20 + (x % 3) * 5, 18, 1.5); break;
      case 'flat': c.fillRect(x0, gy - 12, x1 - x0, 12); break;
      case 'skyline': { let x = x0 - 50; while (x < x1 + 50) { const w = 30 + r() * 40, h = 40 + r() * 90; c.fillStyle = col; c.fillRect(x, gy - h, w, h); c.fillStyle = 'rgba(255,240,200,.25)'; for (let yy = gy - h + 8; yy < gy - 8; yy += 12) for (let xx = x + 5; xx < x + w - 6; xx += 10) if (r() > 0.4) c.fillRect(xx, yy, 4, 5); x += w + 4; } break; }
      case 'domes': { let x = x0 - 50; while (x < x1 + 50) { const w = 40 + r() * 40, h = 40 + r() * 70; c.fillStyle = col; c.fillRect(x, gy - h, w, h); c.beginPath(); c.moveTo(x + w * 0.2, gy - h); c.quadraticCurveTo(x + w * 0.1, gy - h - 30, x + w / 2, gy - h - 42); c.quadraticCurveTo(x + w * 0.9, gy - h - 30, x + w * 0.8, gy - h); c.fill(); x += w + 10 + r() * 30; } break; }
    }
  }
  function midProp(c, kind, x, gy, s, col, r, t) {
    switch (kind) {
      case 'houses': { const w = 34 * s, h = 30 * s; fillRR(c, x, gy - h, w, h, 1, col); poly(c, [x - 3, gy - h, x + w / 2, gy - h - 18 * s, x + w + 3, gy - h], '#9a4a3a'); fillRR(c, x + w * 0.35, gy - h * 0.6, w * 0.3, h * 0.35, 1, 'rgba(40,40,50,.55)'); break; }
      case 'boats': { poly(c, [x, gy - 8, x + 40 * s, gy - 8, x + 34 * s, gy, x + 6 * s, gy], '#6a4a3a'); line(c, x + 20 * s, gy - 8, x + 20 * s, gy - 46 * s, 1.5, '#444'); poly(c, [x + 21 * s, gy - 44 * s, x + 21 * s, gy - 12, x + 40 * s, gy - 12], col); break; }
      case 'windmills': { fillRR(c, x - 6 * s, gy - 46 * s, 12 * s, 46 * s, 2, col); c.save(); c.translate(x, gy - 44 * s); c.rotate(t * 0.6 + x); for (let i = 0; i < 4; i++) { c.rotate(PI / 2); fillRR(c, -2, -26 * s, 5 * s, 24 * s, 1, 'rgba(250,240,220,.85)'); } c.restore(); break; }
      case 'bunkers': { c.fillStyle = col; c.beginPath(); c.arc(x, gy, 18 * s, PI, 0); c.fill(); c.fillStyle = '#333'; c.fillRect(x - 8 * s, gy - 10 * s, 16 * s, 3 * s); break; }
      case 'pines': case 'trees': {
        if (kind === 'pines') { for (let k = 0; k < 3; k++) poly(c, [x - (16 - k * 4) * s, gy - k * 14 * s - 6, x, gy - (k * 14 + 26) * s - 6, x + (16 - k * 4) * s, gy - k * 14 * s - 6], col); c.fillStyle = '#5a3a2a'; c.fillRect(x - 2, gy - 6, 4, 6); }
        else { c.fillStyle = '#5a3a2a'; c.fillRect(x - 3, gy - 22 * s, 6, 22 * s); circ(c, x, gy - 34 * s, 18 * s, col); circ(c, x - 10 * s, gy - 26 * s, 12 * s, shade(col, 0.1)); circ(c, x + 10 * s, gy - 28 * s, 12 * s, shade(col, -0.1)); }
        break; }
      case 'factories': { fillRR(c, x, gy - 30 * s, 50 * s, 30 * s, 1, col); fillRR(c, x + 34 * s, gy - 60 * s, 8 * s, 30 * s, 1, shade(col, -0.2)); circ(c, x + 38 * s, gy - 66 * s - (t * 10 % 10), 6 * s, 'rgba(120,120,120,.4)'); break; }
      case 'olives': { c.fillStyle = '#6b5a40'; c.fillRect(x - 2, gy - 16 * s, 4, 16 * s); ell(c, x, gy - 24 * s, 18 * s, 11 * s, col); ell(c, x + 6, gy - 28 * s, 10 * s, 7 * s, shade(col, 0.15)); break; }
      case 'wheat': { for (let k = 0; k < 6; k++) { line(c, x + k * 4, gy, x + k * 4 + 2, gy - 18 * s, 1, shade(col, -0.2)); ell(c, x + k * 4 + 2, gy - 20 * s, 2, 5, col); } break; }
      case 'ferns': { for (let k = -2; k <= 2; k++) { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + k * 8 * s, gy - 20 * s, x + k * 16 * s, gy - 18 * s); c.stroke(); } break; }
      case 'acacia': { line(c, x, gy, x + 4, gy - 30 * s, 3, '#5a3a2a'); ell(c, x + 4, gy - 34 * s, 30 * s, 7 * s, col); break; }
      case 'rocks': { ell(c, x, gy - 6 * s, 18 * s, 10 * s, col); ell(c, x + 12 * s, gy - 4 * s, 10 * s, 6 * s, shade(col, 0.15)); break; }
      case 'maples': { c.fillStyle = '#5a3a2a'; c.fillRect(x - 3, gy - 22 * s, 6, 22 * s); circ(c, x, gy - 34 * s, 17 * s, col); circ(c, x + 9 * s, gy - 27 * s, 11 * s, '#e0782a'); circ(c, x - 9 * s, gy - 28 * s, 11 * s, '#b8322a'); break; }
      case 'cacti': { c.fillStyle = col; fillRR(c, x - 4 * s, gy - 34 * s, 8 * s, 34 * s, 4 * s, col); fillRR(c, x - 14 * s, gy - 24 * s, 6 * s, 14 * s, 3 * s, col); fillRR(c, x - 14 * s, gy - 14 * s, 12 * s, 5 * s, 2, col); fillRR(c, x + 8 * s, gy - 28 * s, 6 * s, 12 * s, 3 * s, col); fillRR(c, x + 2 * s, gy - 18 * s, 12 * s, 5 * s, 2, col); break; }
      case 'palms': { c.strokeStyle = '#7a5a3a'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + 6 * s, gy - 24 * s, x + 2 * s, gy - 44 * s); c.stroke(); for (let k = 0; k < 5; k++) { const a = -PI + k * PI / 4; ell(c, x + 2 * s + Math.cos(a) * 12 * s, gy - 44 * s + Math.sin(a) * 4 * s + 4, 14 * s, 3.5 * s, col, a * 0.5); } break; }
      case 'lavender': { for (let k = 0; k < 5; k++) ell(c, x + k * 7 * s, gy - 4 * s, 4 * s, 7 * s, k % 2 ? col : shade(col, 0.15)); break; }
      case 'whitecliff': { poly(c, [x, gy, x + 10 * s, gy - 40 * s, x + 60 * s, gy - 44 * s, x + 70 * s, gy], col); c.fillStyle = '#6a9a50'; c.fillRect(x + 10 * s, gy - 46 * s, 50 * s, 4 * s); break; }
      case 'hedgehogs': { line(c, x - 10 * s, gy, x + 10 * s, gy - 18 * s, 2.4, col); line(c, x + 10 * s, gy, x - 10 * s, gy - 18 * s, 2.4, col); line(c, x, gy, x, gy - 20 * s, 2.4, col); break; }
      case 'birches': { c.fillStyle = '#f0f0ea'; c.fillRect(x - 2.5, gy - 44 * s, 5, 44 * s); c.fillStyle = '#333'; for (let k = 0; k < 4; k++) c.fillRect(x - 2.5, gy - (8 + k * 10) * s, 3, 1.5); circ(c, x, gy - 48 * s, 12 * s, 'rgba(240,244,248,.95)'); break; }
      case 'grass': { for (let k = 0; k < 5; k++) line(c, x + k * 3, gy, x + k * 3 + (k - 2) * 2, gy - 10 * s, 1.2, col); break; }
      case 'ruins': { fillRR(c, x, gy - 40 * s * (0.5 + r()), 30 * s, 60 * s, 1, col); poly(c, [x + 30 * s, gy, x + 30 * s, gy - 30 * s, x + 46 * s, gy - 16 * s, x + 50 * s, gy], shade(col, -0.15)); break; }
    }
  }

  D.background = function (c, stage, camX, viewW, viewH, t, L) {
    const ter = TER[stage.terrain] || TER.town;
    const top = -viewH - 10;
    const g = c.createLinearGradient(0, top, 0, 0);
    g.addColorStop(0, ter.sky[0]); g.addColorStop(1, ter.sky[1]);
    c.fillStyle = g; c.fillRect(camX - 10, top - 10, viewW + 20, -top + 20);
    // 太陽 / 雲
    circ(c, camX + viewW * 0.8, top + 50, 22, 'rgba(255,250,220,.7)');
    for (let i = 0; i < 5; i++) { const cx = ((i * 380 + t * 6) % (L + 400)) - 200, cy = top + 30 + (i % 3) * 30; ell(c, cx, cy, 40, 10, 'rgba(255,255,255,.6)'); ell(c, cx + 18, cy - 6, 22, 9, 'rgba(255,255,255,.6)'); }
    // 遠景（視差）
    c.save(); c.translate(camX * 0.6, 0);
    farLayer(c, ter, camX * 0.4 - 100, camX * 0.4 + viewW + 100, -48, stage.i + 3);
    c.restore();
    c.save(); c.translate(camX * 0.3, 0);
    const r = srand(stage.i * 13 + 7);
    const px0 = camX * 0.7 - 120, px1 = camX * 0.7 + viewW + 120;
    for (let x = -200; x < L + 200; x += 70 + r() * 60) { if (x > px0 && x < px1) midProp(c, ter.mid, x, -40, 0.7 + r() * 0.4, ter.midCol, r, t); else r(); }
    c.restore();
    // 遠方戰火的黑煙
    const r2 = srand(stage.i * 7 + 3);
    for (let k = 0; k < 4; k++) {
      const sx = camX * 0.55 + (r2() * 1.3 - 0.15) * viewW, base = -44;
      for (let j = 0; j < 7; j++) {
        const q = ((t * 0.08 + j / 7 + k * 0.3) % 1);
        circ(c, sx + q * 40 + Math.sin(q * 6 + k) * 6, base - q * 150, 8 + q * 26, `rgba(70,66,62,${0.32 * (1 - q)})`);
      }
    }
    // 地平線的戰場煙塵
    const hz = c.createLinearGradient(0, -80, 0, -30);
    hz.addColorStop(0, 'rgba(150,140,120,0)'); hz.addColorStop(1, 'rgba(150,140,120,.35)');
    c.fillStyle = hz; c.fillRect(camX - 10, -80, viewW + 20, 50);
    // 地面
    c.fillStyle = ter.g[1]; c.fillRect(camX - 10, -42, viewW + 20, 60);
    c.fillStyle = ter.g[0]; c.fillRect(camX - 10, -8, viewW + 20, 200);
    if (ter.water) { c.fillStyle = 'rgba(80,140,220,.55)'; c.fillRect(camX - 10, -40, viewW + 20, 10); }
    c.fillStyle = shade(ter.g[0], -0.08);
    for (let x = Math.floor((camX - 10) / 30) * 30; x < camX + viewW + 10; x += 30) c.fillRect(x + ((x * 7) % 13), 6 + ((x * 3) % 20), 8, 2);
    // 戰場上原本就有的東西：舊彈坑、沙包、鐵絲網、燒焦的樹樁、坦克殘骸
    const r3 = srand(stage.i * 31 + 11), dark = shade(ter.g[1], -0.3);
    for (let x = 240; x < L - 240; x += 90 + r3() * 140) {
      const kind = r3(), sc = 0.7 + r3() * 0.6;
      if (x < camX - 80 || x > camX + viewW + 80) continue;
      if (kind < 0.3) { ell(c, x, -36, 26 * sc, 4.5 * sc, dark); ell(c, x, -37.5, 20 * sc, 2.6 * sc, shade(dark, -0.25)); }
      else if (kind < 0.5) { for (let k = 0; k < 4; k++) fillRR(c, x + k * 11 * sc, -41 - (k % 2) * 0, 12 * sc, 6 * sc, 3, k % 2 ? '#a89a72' : '#988a64'); for (let k = 0; k < 3; k++) fillRR(c, x + 5 * sc + k * 11 * sc, -46.5 * sc / sc, 12 * sc, 6 * sc, 3, '#a09268'); }
      else if (kind < 0.68) { for (let k = 0; k < 4; k++) line(c, x + k * 16, -36, x + k * 16, -50, 1.4, '#5a4a3a'); c.strokeStyle = 'rgba(60,60,60,.8)'; c.lineWidth = 0.8; c.beginPath(); for (let k = 0; k <= 12; k++) c.lineTo(x + k * 4, -44 + (k % 2 ? -4 : 3)); c.stroke(); }
      else if (kind < 0.84) { poly(c, [x - 4, -36, x - 3, -58 * sc, x + 1, -62 * sc, x + 4, -36], '#2e2620'); line(c, x, -52 * sc, x + 10, -60 * sc, 1.6, '#2e2620'); }
      else { fillRR(c, x - 24 * sc, -48 * sc, 48 * sc, 12 * sc, 4, '#3a3a34'); fillRR(c, x - 10 * sc, -58 * sc, 20 * sc, 10 * sc, 4, '#34342e'); line(c, x + 8 * sc, -54 * sc, x + 30 * sc, -64 * sc, 3 * sc, '#2e2e28');
        for (let j = 0; j < 4; j++) { const q = ((t * 0.25 + j / 4 + x) % 1); circ(c, x + q * 8, -60 * sc - q * 60, 4 + q * 12, `rgba(60,58,54,${0.4 * (1 - q)})`); } }
    }
  };

  // ---------- 地上的痕跡（戰鬥中產生的） ----------
  D.decals = function (c, B) {
    for (const d of B.decals) {
      const age = B.t - d.t0;
      switch (d.k) {
        case 'blood': {
          const a = d.life ? Math.min(1, (d.life - age) / 8) : 1;
          c.globalAlpha = Math.max(0, a) * 0.85;
          ell(c, d.x, 1, d.r, d.r * 0.28, '#6a0d0d'); ell(c, d.x + d.r * 0.5 * (d.seed - 0.5), 1.5, d.r * 0.55, d.r * 0.16, '#8a1414');
          circ(c, d.x + d.r * 0.9, 2, 1.3, '#6a0d0d'); circ(c, d.x - d.r * 0.8, 1, 1, '#6a0d0d');
          c.globalAlpha = 1; break;
        }
        case 'crater': ell(c, d.x, 2, d.r, d.r * 0.22, 'rgba(40,30,20,.55)'); ell(c, d.x, 0, d.r * 0.7, d.r * 0.12, 'rgba(20,15,10,.6)'); ell(c, d.x - d.r * 0.9, 0, d.r * 0.25, d.r * 0.1, 'rgba(110,90,60,.6)'); ell(c, d.x + d.r * 0.9, 0, d.r * 0.25, d.r * 0.1, 'rgba(110,90,60,.6)'); break;
        case 'scorch': { const g = c.createRadialGradient(d.x, 1, 1, d.x, 1, d.r); g.addColorStop(0, 'rgba(20,16,12,.55)'); g.addColorStop(1, 'rgba(20,16,12,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(d.x, 1, d.r, d.r * 0.25, 0, 0, PI * 2); c.fill(); break; }
        case 'wreck': {
          const a = Math.max(0, Math.min(1, (d.life - age) / 3));
          circ(c, d.x, -4, 3 + Math.sin(age * 20) * 1.2, `rgba(255,150,40,${0.8 * a})`);
          for (let j = 0; j < 6; j++) { const q = ((age * 0.45 + j / 6) % 1); circ(c, d.x + q * 18 + Math.sin(q * 5 + d.seed * 9) * 5, -6 - q * 90, (5 + q * 18) * (d.r / 10), `rgba(50,48,45,${0.5 * (1 - q) * a})`); }
          break;
        }
      }
    }
  };

  // 天氣（畫在世界座標上方）
  D.weather = function (c, stage, camX, viewW, viewH, t, EB, L) {
    if (stage.weather === 'snow') {
      c.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 90; i++) {
        const x = camX + ((i * 97 + t * (20 + i % 7 * 6)) % (viewW + 40)) - 20;
        const y = -viewH + 40 + ((i * 53 + t * (40 + i % 5 * 10)) % (viewH + 20));
        c.fillRect(x, y, 2.2, 2.2);
      }
    } else if (stage.weather === 'fog') {
      const g = c.createLinearGradient(EB, 0, EB + L * 0.55, 0);
      g.addColorStop(0, 'rgba(225,230,235,.75)'); g.addColorStop(0.75, 'rgba(225,230,235,.45)'); g.addColorStop(1, 'rgba(225,230,235,0)');
      c.fillStyle = g; c.fillRect(EB - 200, -viewH, L * 0.55 + 200, viewH + 60);
    } else if (stage.weather === 'flood') {
      c.fillStyle = 'rgba(70,130,210,.28)'; c.fillRect(camX - 10, -6, viewW + 20, 8);
      c.fillStyle = 'rgba(255,255,255,.4)'; for (let x = Math.floor(camX / 40) * 40; x < camX + viewW; x += 40) c.fillRect(x + Math.sin(t * 2 + x) * 6, -4, 10, 1.4);
    }
  };

  // ---------- 特效 ----------
  D.fx = function (c, f, B) {
    const p = Math.max(0, f.t / f.life);
    if (f.t < 0) return;
    switch (f.k) {
      case 'tracer': c.globalAlpha = 1 - p; line(c, f.x1, f.y1, f.x1 + (f.x2 - f.x1) * Math.min(1, p * 2 + 0.3), f.y1 + (f.y2 - f.y1) * Math.min(1, p * 2 + 0.3), f.heavy ? 2.4 : 1.4, '#ffe08a'); c.globalAlpha = 1; break;
      case 'boom': {
        const r = f.r * (0.4 + p * 0.8);
        circ(c, f.x, f.y, r, `rgba(255,${160 - p * 120 | 0},40,${0.9 - p * 0.9})`);
        circ(c, f.x, f.y, r * 0.55, `rgba(255,240,180,${0.9 - p})`);
        circ(c, f.x - r * 0.3, f.y - r * 0.6 - p * 20, r * 0.6, `rgba(80,80,80,${0.5 - p * 0.5})`); break;
      }
      case 'shell': {
        if (p < 0.75) {
          const q = p / 0.75, x = f.x1 + (f.x2 - f.x1) * q, y = f.y1 + (f.y2 - f.y1) * q - Math.sin(q * PI) * 120;
          circ(c, x, y, 3.5, '#333'); circ(c, x, y, 1.6, '#ffcc66');
        } else {
          const q = (p - 0.75) / 0.25, r = f.r * (0.4 + q * 0.7);
          circ(c, f.x2, f.y2 + 8, r, `rgba(255,${150 - q * 100 | 0},40,${0.95 - q * 0.8})`); circ(c, f.x2, f.y2 + 8, r * 0.5, `rgba(255,240,180,${1 - q})`);
        }
        break;
      }
      case 'spark': for (let i = 0; i < 5; i++) { const a = i * 1.26 + f.x; line(c, f.x, f.y, f.x + Math.cos(a) * 10 * p + 2, f.y + Math.sin(a) * 10 * p, 1.4, `rgba(255,240,150,${1 - p})`); } break;
      case 'flame': {
        const len = f.len * (0.5 + p);
        const g = c.createLinearGradient(f.x, 0, f.x + f.dir * len, 0); g.addColorStop(0, 'rgba(255,240,150,.95)'); g.addColorStop(0.5, 'rgba(255,140,30,.8)'); g.addColorStop(1, 'rgba(200,40,20,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(f.x + f.dir * 18, f.y + 4); c.lineTo(f.x + f.dir * len, f.y - 14); c.lineTo(f.x + f.dir * len, f.y + 18); c.fill(); break;
      }
      case 'flash': circ(c, f.x, f.y - 14, 40 * (1 - p) + 10, `rgba(255,255,255,${0.9 - p})`); break;
      case 'heal': c.fillStyle = `rgba(90,230,110,${1 - p})`; c.font = 'bold 14px sans-serif'; c.fillText('+', f.x - 4, f.y - p * 20); break;
      case 'dust': ell(c, f.x, -2, 18 * (0.5 + p), 5, `rgba(160,140,110,${0.6 - p * 0.6})`); break;
      case 'blood': { const tt = f.t, x = f.x + f.vx * tt, y = Math.min(0, f.y + f.vy * tt + 300 * tt * tt); circ(c, x, y, f.r * (1 - p * 0.3), `rgba(150,10,14,${0.95 - p * 0.4})`); break; }
      case 'debris': { const tt = f.t, x = f.x + f.vx * tt, y = Math.min(0, f.y + f.vy * tt + 380 * tt * tt); c.save(); c.translate(x, y); c.rotate(tt * 12 + f.vx); c.fillStyle = `rgba(40,38,34,${1 - p})`; c.fillRect(-f.r, -f.r * 0.6, f.r * 2, f.r * 1.2); c.restore(); break; }
      case 'smoke': circ(c, f.x + (f.vx || 0) * f.t, f.y - p * 26, f.r * (0.6 + p * 1.4), `rgba(180,175,165,${0.55 * (1 - p)})`); break;
      case 'splash': for (let i = 0; i < 8; i++) circ(c, f.x + (i - 4) * 8, -p * 40 * Math.sin(i), 4, `rgba(110,80,50,${1 - p})`); break;
      case 'bomb': { const y = f.y + (0 - f.y) * p; fillRR(c, f.x - 2.5, y - 7, 5, 12, 2.5, '#333'); break; }
      case 'beam': {
        const w = f.w || 820;
        const g = c.createLinearGradient(f.x, 0, f.x - w, 0);
        g.addColorStop(0, `rgba(255,255,220,${1 - p})`); g.addColorStop(1, `rgba(255,200,80,${0.5 - p * 0.5})`);
        c.fillStyle = g; c.fillRect(f.x - w * Math.min(1, p * 3), -110, w * Math.min(1, p * 3), 26 * (1 - p) + 4);
        for (let i = 0; i < 10; i++) circ(c, f.x - i * 80 - p * 40, -10, 20 * (1 - p), `rgba(255,170,60,${0.6 - p * 0.6})`);
        break;
      }
      case 'text':
        if (!f.big) { c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillStyle = f.col || '#fff'; c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeText(f.txt, f.x, f.y - p * 20); c.fillText(f.txt, f.x, f.y - p * 20); c.textAlign = 'left'; }
        break;
    }
  };
  // 全螢幕特效（畫在畫面座標）
  D.screenFx = function (c, f, W, H) {
    const p = Math.max(0, f.t / f.life);
    if (f.k === 'snowflash') { c.fillStyle = `rgba(210,235,255,${0.55 * (1 - p)})`; c.fillRect(0, 0, W, H); }
    else if (f.k === 'clock') {
      c.fillStyle = `rgba(120,200,255,${0.35 * (1 - p)})`; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H * 0.4); c.globalAlpha = 1 - p;
      c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 60, 0, PI * 2); c.stroke();
      line(c, 0, 0, Math.cos(-p * 12) * 45, Math.sin(-p * 12) * 45, 4, '#fff'); line(c, 0, 0, Math.cos(-p * 2) * 30, Math.sin(-p * 2) * 30, 5, '#fff');
      c.restore();
    } else if (f.k === 'text' && f.big) {
      const a = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
      c.save(); c.globalAlpha = a; c.textAlign = 'center';
      const fs = Math.min(34, W / 16);
      c.font = `900 ${fs}px "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
      c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(f.txt, W / 2, H * 0.3);
      c.fillStyle = f.col || '#ff6060'; c.fillText(f.txt, W / 2, H * 0.3);
      c.restore();
    }
  };
})(window.GE);
