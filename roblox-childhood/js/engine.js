// Roblox Childhood — shared engine: renderer, blocky world helpers, physics, player, camera,
// input (keyboard/mouse + touch), HUD, NPC/projectile/fx helpers, sound.
'use strict';
const G = window.G = {};
const V3 = THREE.Vector3;
G.LEVELS = [];

// ---------------- storage ----------------
G.store = {
  get(k, d) { try { const v = localStorage.getItem('rc2_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rc2_' + k, JSON.stringify(v)); } catch (e) {} }
};
G.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
G.quality = G.store.get('quality', G.isTouch ? 'low' : 'high');
G.gravity = 30;
G.rand = (a, b) => a + Math.random() * (b - a);
G.randi = (a, b) => Math.floor(G.rand(a, b + 1));
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
G.lerp = (a, b, t) => a + (b - a) * t;
G.dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
G.$ = id => document.getElementById(id);

// ---------------- renderer ----------------
G.init = function () {
  const canvas = G.$('c');
  G.renderer = new THREE.WebGLRenderer({ canvas, antialias: G.quality === 'high' && !G.isTouch, powerPreference: 'high-performance' });
  G.renderer.shadowMap.type = THREE.PCFShadowMap;
  G.scene = new THREE.Scene();
  G.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);
  G.camera.rotation.order = 'YXZ';
  G.scene.add(G.camera);
  G.hemi = new THREE.HemisphereLight(0xffffff, 0x58614f, 0.75);
  G.sun = new THREE.DirectionalLight(0xffffff, 0.8);
  G.sun.position.set(30, 60, 20);
  const sc = G.sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 200;
  G.sun.shadow.mapSize.set(1024, 1024);
  G.sun.shadow.bias = -0.0008;
  G.scene.add(G.hemi, G.sun, G.sun.target);
  G.geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sph: new THREE.SphereGeometry(0.5, 14, 10),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
    cone: new THREE.ConeGeometry(0.5, 1, 12),
    pyr: new THREE.ConeGeometry(0.7072, 1, 4).rotateY(Math.PI / 4),
  };
  for (const k in G.geo) G.geo[k].userData.shared = true;
  G.raycaster = new THREE.Raycaster();
  G.raycaster.camera = G.camera;
  window.addEventListener('resize', G.resize);
  G.applyQuality();
  G.makePlayer();
  G.input.init();
  G.clock = new THREE.Clock();
  G.clearWorld();
  requestAnimationFrame(G.loop);
};
G.resize = function () {
  const w = window.innerWidth, h = window.innerHeight;
  G.renderer.setSize(w, h, false);
  G.camera.aspect = w / h; G.camera.updateProjectionMatrix();
};
G.applyQuality = function () {
  const hi = G.quality === 'high';
  G.renderer.setPixelRatio(hi ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, 1) * 0.7);
  G.renderer.shadowMap.enabled = hi;
  G.sun.castShadow = hi;
  G.scene.traverse(o => {
    if (o.isMesh) { o.castShadow = hi && !o.userData.noShadow; o.receiveShadow = hi; if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }
  });
  G.resize();
};
G.setQuality = function (q) { G.quality = q; G.store.set('quality', q); G.applyQuality(); };

// ---------------- materials / meshes ----------------
G._mats = {};
G.mat = function (color, o = {}) {
  const key = color + '|' + (o.emissive || 0) + '|' + (o.opacity || 1) + '|' + (o.basic ? 1 : 0);
  if (!G._mats[key]) {
    const p = { color };
    if (o.opacity !== undefined && o.opacity < 1) { p.transparent = true; p.opacity = o.opacity; p.depthWrite = false; }
    if (o.basic) G._mats[key] = new THREE.MeshBasicMaterial(p);
    else { if (o.emissive) p.emissive = new THREE.Color(o.emissive); G._mats[key] = new THREE.MeshLambertMaterial(p); }
    G._mats[key].userData.shared = true;
  }
  return G._mats[key];
};
G._shadowify = function (m, o) { if (G.quality === 'high' && !(o && o.noShadow)) { m.castShadow = true; m.receiveShadow = true; } if (o && o.noShadow) m.userData.noShadow = true; };
// y is the BOTTOM of the box
G.box = function (x, y, z, w, h, d, color, o = {}) {
  const m = new THREE.Mesh(G.geo.box, o.mat || G.mat(color, o));
  m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
  G._shadowify(m, o);
  (o.parent || G.world).add(m);
  if (o.solid !== false && !o.parent) G.addCol(m, o);
  return m;
};
G.mesh = function (geo, color, x, y, z, sx, sy, sz, o = {}) {
  const m = new THREE.Mesh(G.geo[geo] || geo, o.mat || G.mat(color, o));
  m.position.set(x, y, z); m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
  G._shadowify(m, o);
  (o.parent || G.world).add(m);
  return m;
};
// part on a group (centered coordinates)
G.part = function (parent, x, y, z, w, h, d, color, o = {}) {
  const m = new THREE.Mesh(G.geo.box, o.mat || G.mat(color, o));
  m.scale.set(w, h, d); m.position.set(x, y, z);
  G._shadowify(m, o); parent.add(m); return m;
};
G.canvasTex = function (w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
};
G.gridTex = function (a, b, n = 8) {
  const t = G.canvasTex(64, 64, (g) => { g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.strokeStyle = b; g.lineWidth = 3; g.strokeRect(1, 1, 62, 62); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(n, n); return t;
};
G.ground = function (size, color, line, y = 0, o = {}) {
  const geo = new THREE.BoxGeometry(size, 2, size);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: G.gridTex(color, line || color, size / 4) });
  const m = new THREE.Mesh(geo, mat); m.position.set(o.x || 0, y - 1, o.z || 0);
  m.receiveShadow = G.quality === 'high'; G.world.add(m);
  m.scale.set(1, 1, 1);
  const c = { mesh: m, min: new V3(), max: new V3(), solid: true, size: new V3(size, 2, size) };
  G.cols.push(c); G.refreshCol(c); G.solids.push(m);
  return m;
};
G.label = function (text, o = {}) {
  const fs = o.size || 40;
  const cv = document.createElement('canvas'); const g = cv.getContext('2d');
  g.font = `900 ${fs}px "Noto Sans TC","Microsoft JhengHei",sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + 24, h = fs + 20;
  cv.width = w; cv.height = h;
  g.font = `900 ${fs}px "Noto Sans TC","Microsoft JhengHei",sans-serif`;
  if (o.bg !== null) { g.fillStyle = o.bg || 'rgba(0,0,0,0.55)'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, w, h, 12); else g.rect(0, 0, w, h); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(text, w / 2, h / 2 + 2);
  g.fillStyle = o.color || '#fff'; g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: o.depthTest !== undefined ? o.depthTest : true, transparent: true }));
  const sc = (o.scale || 1) * 0.012;
  sp.scale.set(w * sc, h * sc, 1);
  sp.userData.noHit = true;
  sp.renderOrder = 5;
  if (o.parent) o.parent.add(sp); else G.world.add(sp);
  if (o.pos) sp.position.copy(o.pos);
  return sp;
};

// ---------------- colliders ----------------
G.addCol = function (mesh, o = {}) {
  const c = { mesh, min: new V3(), max: new V3(), solid: o.solid !== false, kill: !!o.kill, tag: o.tag, size: mesh.scale.clone(), delta: new V3(), moving: !!o.moving };
  G.refreshCol(c); G.cols.push(c); if (c.solid) G.solids.push(mesh); mesh.userData.col = c;
  return c;
};
G.refreshCol = function (c) {
  const p = c.mesh.position, s = c.size;
  c.min.set(p.x - s.x / 2, p.y - s.y / 2, p.z - s.z / 2);
  c.max.set(p.x + s.x / 2, p.y + s.y / 2, p.z + s.z / 2);
};
G.moveCol = function (c, x, y, z) {
  c.delta.set(x - c.mesh.position.x, y - c.mesh.position.y, z - c.mesh.position.z);
  c.mesh.position.set(x, y, z); G.refreshCol(c);
};
G.removeCol = function (c) {
  const i = G.cols.indexOf(c); if (i >= 0) G.cols.splice(i, 1);
  const j = G.solids.indexOf(c.mesh); if (j >= 0) G.solids.splice(j, 1);
};

// ---------------- physics ----------------
G.moveEntity = function (e, dt) {
  if (e.ground && e.ground.delta && e.ground.moving) e.pos.add(e.ground.delta);
  if (!e.noGrav) { e.vel.y -= G.gravity * dt * (e.gScale || 1); if (e.vel.y < -55) e.vel.y = -55; }
  const was = e.onGround;
  e.onGround = false; e.hitKill = null; e.hitWall = false;
  e.pos.x += e.vel.x * dt; G._resolve(e, 'x', was);
  e.pos.z += e.vel.z * dt; G._resolve(e, 'z', was);
  e.pos.y += e.vel.y * dt; G._resolve(e, 'y', was);
  if (!e.onGround) e.ground = null;
};
G._resolve = function (e, ax, was) {
  const eps = 0.001, hw = e.hw, p = e.pos;
  for (let i = 0; i < G.cols.length; i++) {
    const c = G.cols[i];
    if (!c.solid || c.off) continue;
    if (p.x + hw <= c.min.x || p.x - hw >= c.max.x || p.z + hw <= c.min.z || p.z - hw >= c.max.z || p.y + e.h <= c.min.y || p.y >= c.max.y) continue;
    if (c.kill) e.hitKill = c;
    if (ax === 'y') {
      if (e.vel.y <= 0 && p.y > c.max.y - 0.9) { p.y = c.max.y; e.vel.y = 0; e.onGround = true; e.ground = c; }
      else if (e.vel.y > 0) { p.y = c.min.y - e.h - eps; e.vel.y = 0; }
      else { p.y = c.max.y; e.vel.y = 0; e.onGround = true; e.ground = c; }
    } else {
      const up = c.max.y - p.y;
      if (was && up > 0 && up <= (e.step === undefined ? 0.6 : e.step)) { p.y = c.max.y + eps; continue; }
      const mid = (c.min[ax] + c.max[ax]) / 2;
      if (p[ax] < mid) p[ax] = c.min[ax] - hw - eps; else p[ax] = c.max[ax] + hw + eps;
      e.vel[ax] = 0; e.hitWall = true;
    }
  }
};

// ---------------- avatars ----------------
G._faceMats = {};
G.faceMat = function (skin, style) {
  const key = skin + '|' + (style || 0);
  if (!G._faceMats[key]) {
    const t = G.canvasTex(64, 64, (g) => {
      g.fillStyle = '#' + new THREE.Color(skin).getHexString(); g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#111';
      if (style === 'angry') {
        g.fillRect(16, 22, 9, 9); g.fillRect(39, 22, 9, 9);
        g.fillRect(13, 16, 14, 4); g.fillRect(37, 16, 14, 4);
        g.fillRect(22, 44, 20, 4);
      } else if (style === 'scary') {
        g.fillStyle = '#fff'; g.fillRect(14, 20, 12, 12); g.fillRect(38, 20, 12, 12);
        g.fillStyle = '#000'; g.fillRect(14, 42, 36, 10);
        g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) g.fillRect(15 + i * 6, 42, 3, 5);
      } else {
        g.fillRect(19, 22, 7, 10); g.fillRect(38, 22, 7, 10);
        g.lineWidth = 4; g.strokeStyle = '#111'; g.beginPath(); g.arc(32, 36, 12, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
      }
    });
    t.magFilter = THREE.NearestFilter;
    const sm = G.mat(skin);
    G._faceMats[key] = [sm, sm, sm, sm, new THREE.MeshLambertMaterial({ map: t }), sm];
  }
  return G._faceMats[key];
};
G.avatar = function (o = {}) {
  const g = new THREE.Group();
  const skin = o.skin !== undefined ? o.skin : 0xffd23f, shirt = o.shirt !== undefined ? o.shirt : 0x2f7de1, pants = o.pants !== undefined ? o.pants : 0x2b3a55;
  const P = {};
  P.lL = new THREE.Group(); P.lL.position.set(-0.24, 0.85, 0); g.add(P.lL);
  P.lR = new THREE.Group(); P.lR.position.set(0.24, 0.85, 0); g.add(P.lR);
  G.part(P.lL, 0, -0.42, 0, 0.46, 0.85, 0.46, pants);
  G.part(P.lR, 0, -0.42, 0, 0.46, 0.85, 0.46, pants);
  P.torso = G.part(g, 0, 1.27, 0, 0.98, 0.85, 0.5, shirt);
  P.aL = new THREE.Group(); P.aL.position.set(-0.72, 1.62, 0); g.add(P.aL);
  P.aR = new THREE.Group(); P.aR.position.set(0.72, 1.62, 0); g.add(P.aR);
  P.armL = G.part(P.aL, 0, -0.37, 0, 0.44, 0.85, 0.44, o.sleeve !== undefined ? o.sleeve : skin);
  P.armR = G.part(P.aR, 0, -0.37, 0, 0.44, 0.85, 0.44, o.sleeve !== undefined ? o.sleeve : skin);
  const head = new THREE.Mesh(G.geo.box, G.faceMat(skin, o.face));
  head.scale.set(0.62, 0.6, 0.62); head.position.set(0, 2.0, 0); G._shadowify(head); g.add(head);
  head.userData.part = 'head'; P.head = head;
  if (o.hat) { const h = G.part(g, 0, 2.38, 0, 0.7, 0.2, 0.7, o.hat); h.userData.part = 'head'; P.hat = h; }
  if (o.hair) { G.part(g, 0, 2.33, -0.04, 0.68, 0.16, 0.7, o.hair); G.part(g, 0, 2.08, -0.3, 0.68, 0.4, 0.1, o.hair); }
  g.userData.P = P;
  g.userData.walk = 0;
  return g;
};
G.animAvatar = function (g, dt, speed) {
  const P = g.userData.P; if (!P) return;
  if (speed > 0.3) g.userData.walk += dt * (4 + speed * 0.9); else g.userData.walk *= 0.8;
  const s = Math.sin(g.userData.walk) * Math.min(1, speed / 6) * 0.9;
  P.lL.rotation.x = s; P.lR.rotation.x = -s;
  if (!g.userData.armPose) { P.aL.rotation.x = -s; P.aR.rotation.x = s; }
};

// ---------------- player ----------------
G.makePlayer = function () {
  const shirt = G.store.get('shirt', 0x2f7de1);
  G.player = { pos: new V3(), vel: new V3(), hw: 0.45, h: 2.3, onGround: false, speed: 8, jump: 11, hp: 100, maxHp: 100, frozen: false, custom: false, yaw: 0, hidden: false };
  G.player.mesh = G.avatar({ shirt, pants: 0x2b3a55, skin: 0xffd23f });
  G.scene.add(G.player.mesh);
};
G.respawnPlayer = function () {
  const p = G.player, L = G.L;
  p.pos.copy(L.spawn); G.snapToGround(p.pos); p.vel.set(0, 0, 0); p.hp = p.maxHp; p.onGround = false; p.ground = null;
  G.cam.yaw = L.spawnYaw || 0; p.yaw = G.cam.yaw; G.cam.pitch = G.cam.mode === 'first' ? 0 : -0.25;
  G.hud.hpUpdate();
};
// lift a point onto the top of whatever solid it is standing inside (avoids spawning inside boxes)
G.snapToGround = function (pos) {
  let top = null;
  for (const c of G.cols) {
    if (!c.solid || c.off) continue;
    if (pos.x > c.min.x && pos.x < c.max.x && pos.z > c.min.z && pos.z < c.max.z && c.max.y > pos.y - 0.01 && c.max.y < pos.y + 1.2) top = Math.max(top === null ? -1e9 : top, c.max.y);
  }
  if (top !== null) pos.y = top + 0.001;
  return pos;
};
G.forward = (yaw) => new V3(-Math.sin(yaw), 0, -Math.cos(yaw));
G.right = (yaw) => new V3(Math.cos(yaw), 0, -Math.sin(yaw));
G.wishDir = function () {
  const m = G.in.move, yaw = G.cam.yaw;
  const f = G.forward(yaw), r = G.right(yaw);
  const w = new V3(f.x * m.z + r.x * m.x, 0, f.z * m.z + r.z * m.x);
  if (w.lengthSq() > 1) w.normalize();
  return w;
};
G.updatePlayer = function (dt) {
  const p = G.player;
  const w = G.wishDir();
  const sp = p.speed * (p.slow || 1);
  const k = p.onGround ? Math.min(1, dt * 14) : Math.min(1, dt * 5);
  p.vel.x += (w.x * sp - p.vel.x) * k;
  p.vel.z += (w.z * sp - p.vel.z) * k;
  if (G.in.jumpP && !p.noJump && (p.onGround || p.infJump)) {
    if (!p.onGround) G.ring(p.pos.clone().add(new V3(0, 0.1, 0)), 0xffffff, 1.6, 0.25);
    p.vel.y = p.jump; p.onGround = false; G.sfx('jump');
  }
  G.moveEntity(p, dt);
  if (p.hitKill) G.die(G.L.killMsg || '碰到危險方塊了！');
  if (p.pos.y < G.L.killY) G.die(G.L.fallMsg || '掉下去了！');
  const hs = Math.hypot(p.vel.x, p.vel.z);
  if (G.cam.mode === 'first' || p.faceCam) p.yaw = G.cam.yaw;
  else if (hs > 0.5) { const ty = Math.atan2(p.vel.x, p.vel.z) + Math.PI; p.yaw = G.angLerp(p.yaw, ty, Math.min(1, dt * 12)); }
  G.syncPlayerMesh(dt, hs);
};
G.syncPlayerMesh = function (dt, hs) {
  const p = G.player, m = p.mesh;
  m.position.copy(p.pos);
  m.rotation.y = p.yaw + Math.PI;
  m.visible = !p.hidden && G.cam.mode !== 'first';
  G.animAvatar(m, dt, hs || 0);
};
G.angLerp = function (a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

// ---------------- camera ----------------
G.cam = { mode: 'third', yaw: 0, pitch: -0.25, dist: 7, height: 1.8, sens: 0.0024 };
G.camDir = function () { const c = G.cam; return new V3(-Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), -Math.cos(c.yaw) * Math.cos(c.pitch)); };
G.updateCamera = function (dt) {
  const c = G.cam, p = G.player, cam = G.camera;
  if (c.mode === 'custom') return;
  if (c.mode === 'first') {
    c.pitch = G.clamp(c.pitch, -1.45, 1.45);
    cam.position.set(p.pos.x, p.pos.y + (c.eye || 1.95), p.pos.z);
    cam.rotation.set(c.pitch, c.yaw, 0);
  } else {
    c.pitch = G.clamp(c.pitch, -1.25, 0.5);
    const tgt = c.target ? c.target.clone() : new V3(p.pos.x, p.pos.y + c.height, p.pos.z);
    const dir = G.camDir();
    let d = c.dist;
    if (G.solids.length) {
      G.raycaster.set(tgt, dir.clone().negate()); G.raycaster.far = d;
      const hit = G.raycaster.intersectObjects(G.solids, false)[0];
      if (hit) d = Math.max(1.2, hit.distance - 0.3);
    }
    cam.position.copy(tgt).addScaledVector(dir, -d);
    if (c.shoulder) cam.position.addScaledVector(G.right(c.yaw), c.shoulder);
    cam.rotation.set(c.pitch, c.yaw, 0);
  }
  if (G.quality === 'high') { G.sun.position.set(p.pos.x + 30, p.pos.y + 60, p.pos.z + 20); G.sun.target.position.set(p.pos.x, p.pos.y, p.pos.z); }
};
G.setSky = function (o = {}) {
  const col = o.color !== undefined ? o.color : 0x8fd3ff;
  G.scene.background = new THREE.Color(col);
  G.scene.fog = o.fog ? new THREE.Fog(o.fogColor !== undefined ? o.fogColor : col, o.fog[0], o.fog[1]) : null;
  G.sun.intensity = o.sun !== undefined ? o.sun : 0.8;
  G.hemi.intensity = o.hemi !== undefined ? o.hemi : 0.75;
  G.hemi.color.set(o.hemiSky !== undefined ? o.hemiSky : 0xffffff);
  G.hemi.groundColor.set(o.hemiGround !== undefined ? o.hemiGround : 0x58614f);
};

// ---------------- world lifecycle ----------------
G.clearWorld = function () {
  if (G.world) {
    G.scene.remove(G.world);
    G.world.traverse(o => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(m => { if (!m.userData.shared) { if (m.map) m.map.dispose(); m.dispose(); } });
    });
  }
  G.world = new THREE.Group(); G.scene.add(G.world);
  G.cols = []; G.solids = []; G.npcs = []; G.interacts = []; G.projs = []; G.timers = [];
  for (const f of (G.fxs || [])) G.scene.remove(f.mesh);
  G.fxs = [];
};
G.after = function (sec, fn) { G.timers.push({ t: sec, fn }); };

// ---------------- input ----------------
G.in = { move: { x: 0, z: 0 }, keys: {}, jumpP: false, actP: false, actH: false, eP: false, qP: false, fP: false, fH: false, rP: false, look: { x: 0, y: 0 } };
G.input = {
  init() {
    const I = G.in;
    window.addEventListener('keydown', e => {
      if (e.repeat) { I.keys[e.code] = true; return; }
      I.keys[e.code] = true;
      if (e.code === 'Space') { I.jumpP = true; e.preventDefault(); }
      if (e.code === 'KeyE') I.eP = true;
      if (e.code === 'KeyQ') I.qP = true;
      if (e.code === 'KeyF') { I.fP = true; I.fH = true; }
      if (e.code === 'KeyR') I.rP = true;
      if (e.code === 'KeyX') I.xP = true;
      if (e.code === 'KeyC') I.cP = true;
      if (e.code === 'KeyV') I.vP = true;
      if (e.code === 'Escape' && G.state === 'play' && G.isTouch) G.pause();
      if (e.code === 'KeyP' && G.state === 'play') G.pause();
    });
    window.addEventListener('keyup', e => { I.keys[e.code] = false; if (e.code === 'KeyF') I.fH = false; });
    window.addEventListener('blur', () => { I.keys = {}; I.actH = false; I.fH = false; });
    const cv = G.$('c');
    cv.addEventListener('mousedown', e => {
      if (G.isTouch) return;
      if (G.state === 'play' && !document.pointerLockElement && !G.panelOpen) { G.lock(); return; }
      if (e.button === 0) { I.actP = true; I.actH = true; }
      if (e.button === 2) { I.fP = true; I.fH = true; }
    });
    window.addEventListener('mouseup', e => { if (e.button === 0) I.actH = false; if (e.button === 2) I.fH = false; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement === cv && G.state === 'play') {
        const k = G.cam.sens * (G.camera.fov / 70); G.cam.yaw -= e.movementX * k; G.cam.pitch -= e.movementY * k;
      }
    });
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && G.state === 'play' && !G.panelOpen && !G.isTouch && !G.completing) G.pause();
    });
    if (G.isTouch) G.input.initTouch();
  },
  initTouch() {
    document.body.classList.add('touch');
    const I = G.in, joy = G.$('joy'), knob = G.$('joyKnob');
    let joyId = null, jx = 0, jy = 0, lookId = null, lx = 0, ly = 0;
    const W = () => window.innerWidth;
    document.querySelectorAll('.tb').forEach(b => {
      const k = b.dataset.k;
      b.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation(); b.classList.add('on');
        if (k === 'act') { I.actP = true; I.actH = true; }
        if (k === 'jump') I.jumpP = true;
        if (k === 'e') I.eP = true;
        if (k === 'q') I.qP = true;
        if (k === 'f') { I.fP = true; I.fH = true; }
        if (k === 'x') I.xP = true;
        if (k === 'c') I.cP = true;
        if (k === 'v') I.vP = true;
        // allow looking while holding the fire button: track this finger as look too
        if (k === 'act' && lookId === null) { const t = e.changedTouches[0]; lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }, { passive: false });
      const up = e => {
        e.preventDefault(); b.classList.remove('on');
        if (k === 'act') { I.actH = false; for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; }
        if (k === 'f') I.fH = false;
      };
      b.addEventListener('touchend', up, { passive: false });
      b.addEventListener('touchcancel', up, { passive: false });
      b.addEventListener('touchmove', e => {
        e.preventDefault();
        for (const t of e.changedTouches) if (t.identifier === lookId && G.state === 'play') {
          const k = 0.0065 * (G.camera.fov / 70); G.cam.yaw -= (t.clientX - lx) * k; G.cam.pitch -= (t.clientY - ly) * k; lx = t.clientX; ly = t.clientY;
        }
      }, { passive: false });
    });
    const cv = G.$('c');
    cv.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.clientX < W() * 0.42 && joyId === null) {
          joyId = t.identifier; jx = t.clientX; jy = t.clientY;
          joy.style.left = (jx - 60) + 'px'; joy.style.top = (jy - 60) + 'px'; joy.style.bottom = 'auto';
        } else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
    }, { passive: false });
    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          let dx = t.clientX - jx, dy = t.clientY - jy; const l = Math.hypot(dx, dy), mx = 50;
          if (l > mx) { dx *= mx / l; dy *= mx / l; }
          knob.style.left = (33 + dx) + 'px'; knob.style.top = (33 + dy) + 'px';
          G.in.tjoy = { x: dx / mx, z: -dy / mx };
        } else if (t.identifier === lookId && G.state === 'play') {
          const k = 0.0065 * (G.camera.fov / 70); G.cam.yaw -= (t.clientX - lx) * k; G.cam.pitch -= (t.clientY - ly) * k; lx = t.clientX; ly = t.clientY;
        }
      }
    }, { passive: false });
    const end = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) { joyId = null; G.in.tjoy = null; knob.style.left = '33px'; knob.style.top = '33px'; joy.style.left = '30px'; joy.style.top = 'auto'; joy.style.bottom = '30px'; }
        if (t.identifier === lookId) lookId = null;
      }
    };
    cv.addEventListener('touchend', end); cv.addEventListener('touchcancel', end);
  },
  poll() {
    const I = G.in, k = I.keys;
    let x = 0, z = 0;
    if (k.KeyW || k.ArrowUp) z += 1; if (k.KeyS || k.ArrowDown) z -= 1;
    if (k.KeyD || k.ArrowRight) x += 1; if (k.KeyA || k.ArrowLeft) x -= 1;
    if (I.tjoy) { x = I.tjoy.x; z = I.tjoy.z; }
    I.move.x = x; I.move.z = z;
    I.sprint = !!k.ShiftLeft;
  },
  clearEdges() { const I = G.in; I.jumpP = I.actP = I.eP = I.qP = I.fP = I.rP = I.xP = I.cP = I.vP = false; }
};
G.lock = function () { if (!G.isTouch) { const cv = G.$('c'); try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} } };
G.unlock = function () { if (document.pointerLockElement) document.exitPointerLock(); };
G.setButtons = function (o) {
  const def = { act: '動作', jump: '跳', e: 'E', q: null, f: null, x: null, c: null, v: null };
  const b = Object.assign(def, o || {});
  for (const k of ['act', 'jump', 'e', 'q', 'f', 'x', 'c', 'v']) {
    const el = G.$('tb_' + k);
    if (b[k] === null) el.classList.add('hidden'); else { el.classList.remove('hidden'); el.textContent = b[k]; }
  }
  G.btnLabels = b;
};

// ---------------- HUD ----------------
G.hud = {
  set(id, html) { const el = G.$(id); if (el._h !== html) { el.innerHTML = html; el._h = html; } },
  level(t) { this.set('hLevel', t); },
  obj(t) { this.set('hObj', t); },
  prog(t) { this.set('hProg', t || ''); },
  extra(t) { this.set('hExtra', t || ''); },
  toast(t, ms = 2200) {
    const d = document.createElement('div'); d.className = 't'; d.textContent = t;
    const box = G.$('hToast'); box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => d.remove(), ms);
  },
  prompt(t) { const el = G.$('hPrompt'); if (!t) el.classList.add('hidden'); else { el.classList.remove('hidden'); this.set('hPrompt', t); } },
  big(t, color, ms = 1500) {
    const el = G.$('hBig'); el.classList.remove('hidden'); el.textContent = t; el.style.color = color || '#fff';
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(this._bt); if (ms > 0) this._bt = setTimeout(() => el.classList.add('hidden'), ms);
  },
  hideBig() { G.$('hBig').classList.add('hidden'); },
  cross(on) { G.$('cross').classList.toggle('on', !!on); },
  hitmark() { const c = G.$('cross'); c.classList.add('hit'); clearTimeout(this._hm); this._hm = setTimeout(() => c.classList.remove('hit'), 120); },
  hp(on) { G.$('hHp').classList.toggle('hidden', !on); this.hpUpdate(); },
  hpUpdate() { const p = G.player; if (!p) return; const f = G.clamp(p.hp / p.maxHp, 0, 1); G.$('hHpFill').style.width = (f * 100) + '%'; G.$('hHpTxt').textContent = Math.ceil(Math.max(0, p.hp)); },
  ammo(t) { const el = G.$('hAmmo'); if (!t) el.classList.add('hidden'); else { el.classList.remove('hidden'); this.set('hAmmo', t); } },
  boss(name, frac) {
    const el = G.$('hBoss');
    if (name === null) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden'); this.set('hBossName', name); G.$('hBossFill').style.width = (G.clamp(frac, 0, 1) * 100) + '%';
  },
  flash() { const f = G.$('dmgFlash'); f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = 'opacity .5s'; f.style.opacity = 0; },
  reset() {
    this.prog(''); this.extra(''); this.prompt(null); this.cross(false); this.hp(false); this.ammo(null); this.boss(null); this.hideBig();
    G.$('hToast').innerHTML = '';
  },
  tick() {
    const t = Math.floor(G.time || 0);
    this.set('hTime', '⏱ ' + Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'));
    this.set('hDeaths', '💀 ' + (G.deaths || 0));
  }
};

// ---------------- damage / death ----------------
G.damage = function (n, src) {
  const p = G.player;
  if (G.dying || G.state !== 'play' || p.invuln > 0) return;
  if (p.blocking) n *= 0.2;
  p.hp -= n; G.hud.flash(); G.hud.hpUpdate(); G.sfx('hurt');
  if (p.hp <= 0) G.die(G.L.hpMsg || '你被打倒了！');
};
G.die = function (msg) {
  if (G.dying || G.completing || G.state !== 'play') return;
  G.dying = true; G.deaths = (G.deaths || 0) + 1;
  G.sfx('die');
  G.burst(G.player.pos.clone().add(new V3(0, 1.2, 0)), 0xffd23f, 18);
  G.player.mesh.visible = false;
  G.hud.big(msg || '你死了！', '#ff5a5a', 1300);
  G.after(1.3, () => {
    G.dying = false; G.player.hidden = false;
    G.respawnPlayer();
    if (G.def.respawn) G.def.respawn(G.L);
  });
};
G.complete = function (msg) {
  if (G.completing || G.dying) return;
  G.completing = true;
  G.sfx('win');
  G.hud.big(msg || '過關！🎉', '#5bff7a', 0);
  G.burst(G.player.pos.clone().add(new V3(0, 2, 0)), 0x5bff7a, 30);
  const idx = G.levelIdx;
  const prog = G.store.get('progress', 0);
  if (idx + 1 > prog) G.store.set('progress', idx + 1);
  setTimeout(() => {
    G.completing = false; G.hud.hideBig();
    if (G.runMode !== 'single' && idx + 1 < G.LEVELS.length) G.startLevel(idx + 1);
    else if (G.runMode !== 'single') G.finishGame();
    else G.showTitle();
  }, 2400);
};

// ---------------- interactables ----------------
G.interact = function (pos, radius, label, onUse, enabled) {
  const it = { pos, radius, label, onUse, enabled, dead: false };
  it.remove = () => { it.dead = true; };
  G.interacts.push(it); return it;
};
G.updateInteract = function () {
  const p = G.player.pos;
  let best = null, bd = 1e9;
  G.interacts = G.interacts.filter(i => !i.dead);
  if (!G.dying && !G.player.noInteract) for (const it of G.interacts) {
    if (it.enabled && !it.enabled()) continue;
    const pos = typeof it.pos === 'function' ? it.pos() : it.pos;
    const d = Math.hypot(pos.x - p.x, pos.z - p.z) + Math.max(0, Math.abs(pos.y - p.y) - 2.5);
    if (d < it.radius && d < bd) { bd = d; best = it; }
  }
  if (best) {
    const lab = typeof best.label === 'function' ? best.label() : best.label;
    G.hud.prompt((G.isTouch ? '按 E：' : '[E] ') + lab);
    if (G.in.eP) { G.in.eP = false; best.onUse(); }
  } else if (!G.L.keepPrompt) G.hud.prompt(null);
};

// ---------------- NPCs ----------------
G.makeNPC = function (o = {}) {
  const mesh = o.mesh || G.avatar(o);
  if (o.scale) mesh.scale.setScalar(o.scale);
  G.world.add(mesh);
  const s = o.scale || 1;
  const n = { mesh, pos: (o.pos || new V3()).clone(), vel: new V3(), hw: 0.45 * s, h: 2.3 * s, hp: o.hp || 100, maxHp: o.hp || 100, alive: true, onGround: false, yaw: o.yaw || 0, name: o.name, t: Math.random() * 10, data: {} };
  mesh.traverse(c => { c.userData.npc = n; });
  if (o.name) { n.label = G.label(o.name, { scale: 0.75, parent: mesh }); n.label.position.set(0, 2.9, 0); n.label.scale.multiplyScalar(1 / s); }
  if (o.bar) G.npcBar(n);
  G.npcs.push(n);
  G.syncNPC(n, 0, 0);
  return n;
};
G.npcBar = function (n) {
  const s = n.mesh.scale.x;
  const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x111111 }));
  const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3bff5a }));
  bg.scale.set(1.4 / s, 0.16 / s, 1); fg.scale.set(1.3 / s, 0.1 / s, 1);
  bg.position.set(0, 2.6, 0); fg.position.set(-0.65 / s, 2.6, 0); fg.center.set(0, 0.5);
  bg.userData.noHit = fg.userData.noHit = true;
  n.mesh.add(bg); n.mesh.add(fg); n.barFg = fg; n.barW = 1.3 / s;
};
G.syncNPC = function (n, dt, speed) {
  n.mesh.position.copy(n.pos); n.mesh.rotation.y = n.yaw;
  if (speed !== undefined) G.animAvatar(n.mesh, dt, speed);
  if (n.barFg) { const f = G.clamp(n.hp / n.maxHp, 0, 1); n.barFg.scale.x = Math.max(0.001, n.barW * f); n.barFg.material.color.setHex(f > 0.5 ? 0x3bff5a : f > 0.25 ? 0xffc83b : 0xff3b3b); }
};
// walk toward a point; returns distance
G.npcSeek = function (n, target, speed, dt, o = {}) {
  const dx = target.x - n.pos.x, dz = target.z - n.pos.z, d = Math.hypot(dx, dz);
  if (d > (o.stop || 0.1)) { n.vel.x = dx / d * speed; n.vel.z = dz / d * speed; n.yaw = Math.atan2(dx, dz); }
  else { n.vel.x *= 0.5; n.vel.z *= 0.5; }
  G.moveEntity(n, dt);
  if (n.hitWall && n.onGround && !o.noJump) n.vel.y = 10;
  G.syncNPC(n, dt, Math.hypot(n.vel.x, n.vel.z));
  return d;
};
G.hitNPC = function (n, dmg, o = {}) {
  if (!n.alive) return;
  if (n.onHit) { if (n.onHit(dmg, o) === false) return; }
  n.hp -= dmg;
  G.floatText(n.pos.clone().add(new V3(G.rand(-0.4, 0.4), 2.6 * n.mesh.scale.y, 0)), '-' + Math.round(dmg), o.head ? '#ffd23f' : '#ff6060');
  G.burst(n.pos.clone().add(new V3(0, 1.3 * n.mesh.scale.y, 0)), 0xff4040, 5);
  if (n.hp <= 0) G.killNPC(n);
  G.syncNPC(n);
};
G.killNPC = function (n) {
  if (!n.alive) return;
  n.alive = false; n.hp = 0; G.sfx('kill');
  G.burst(n.pos.clone().add(new V3(0, 1.2, 0)), 0xffffff, 14);
  const m = n.mesh; let t = 0;
  G.fxs.push({ mesh: new THREE.Object3D(), life: 1.2, upd: (dt) => { t += dt; m.rotation.x = Math.min(Math.PI / 2, t * 5) * -1; m.position.y = n.pos.y + 0.3; if (t > 1.1) { m.visible = false; } } });
  if (n.onDeath) n.onDeath();
};
G.separateNPCs = function () {
  const a = G.npcs;
  for (let i = 0; i < a.length; i++) {
    const n = a[i]; if (!n.alive || n.noPush) continue;
    for (let j = i + 1; j < a.length; j++) {
      const m = a[j]; if (!m.alive || m.noPush) continue;
      const dx = m.pos.x - n.pos.x, dz = m.pos.z - n.pos.z, d = Math.hypot(dx, dz), min = n.hw + m.hw;
      if (d < min && Math.abs(m.pos.y - n.pos.y) < 2) {
        const k = (min - d) / 2 / (d || 1), ux = d ? dx : Math.random() - 0.5, uz = d ? dz : Math.random() - 0.5;
        n.pos.x -= ux * k; n.pos.z -= uz * k; m.pos.x += ux * k; m.pos.z += uz * k;
      }
    }
  }
};
G.removeNPC = function (n) { n.alive = false; n.mesh.visible = false; G.world.remove(n.mesh); const i = G.npcs.indexOf(n); if (i >= 0) G.npcs.splice(i, 1); };

// line of sight between two points against solid world geometry
G.los = function (a, b) {
  const dir = b.clone().sub(a); const d = dir.length(); if (d < 0.01) return true;
  G.raycaster.set(a, dir.normalize()); G.raycaster.far = d;
  return G.raycaster.intersectObjects(G.solids, false).length === 0;
};
// raycast from camera center; returns first hit (world or npc)
G.camRay = function (range, spread = 0) {
  const dir = new V3(0, 0, -1).applyQuaternion(G.camera.quaternion);
  if (spread) { dir.x += G.rand(-spread, spread); dir.y += G.rand(-spread, spread); dir.z += G.rand(-spread, spread); dir.normalize(); }
  const origin = G.camera.position.clone();
  if (G.cam.mode !== 'first') {
    // start the ray at the player's depth so things behind the player are ignored
    const along = G.player.pos.clone().add(new V3(0, 1.6, 0)).sub(origin).dot(dir);
    if (along > 0) origin.addScaledVector(dir, along);
  }
  G.raycaster.set(origin, dir); G.raycaster.far = range;
  const hits = G.raycaster.intersectObjects(G.world.children, true);
  for (const h of hits) {
    if (h.object.userData.noHit || h.object.isSprite || h.object.isLine) continue;
    let o = h.object, npc = null;
    while (o) { if (o.userData.npc) { npc = o.userData.npc; break; } o = o.parent; }
    if (npc && !npc.alive) continue;
    if (h.object.material && h.object.material.transparent && h.object.material.opacity < 0.5) continue;
    return { point: h.point, npc, head: h.object.userData.part === 'head', dist: h.distance, dir, object: h.object };
  }
  return { point: origin.clone().addScaledVector(dir, range), npc: null, dist: range, dir };
};

// ---------------- projectiles ----------------
G.shootProj = function (o) {
  const m = G.mesh('sph', o.color || 0xff7a1a, o.pos.x, o.pos.y, o.pos.z, o.size || 0.4, undefined, undefined, { emissive: o.emissive !== undefined ? o.emissive : (o.color || 0xff7a1a), noShadow: true });
  m.userData.noHit = true;
  const p = Object.assign({ mesh: m, life: 4, grav: 0, dmg: 10, radius: 0.3, aoe: 0 }, o);
  p.pos = o.pos.clone(); p.vel = o.vel.clone();
  G.projs.push(p); return p;
};
G.updateProjs = function (dt) {
  for (const p of G.projs) {
    if (p.dead) continue;
    p.vel.y -= p.grav * dt; p.pos.addScaledVector(p.vel, dt); p.life -= dt;
    p.mesh.position.copy(p.pos);
    if (p.spin) p.mesh.rotation.x += dt * 8;
    let hit = p.life <= 0;
    if (!hit) for (const c of G.cols) {
      if (!c.solid) continue;
      if (p.pos.x > c.min.x && p.pos.x < c.max.x && p.pos.y > c.min.y && p.pos.y < c.max.y && p.pos.z > c.min.z && p.pos.z < c.max.z) { hit = true; break; }
    }
    let direct = null;
    if (!hit) {
      if (p.fromPlayer) {
        for (const n of G.npcs) if (n.alive && !n.untargetable) {
          const s = n.mesh.scale.y;
          if (Math.hypot(p.pos.x - n.pos.x, p.pos.z - n.pos.z) < p.radius + n.hw + 0.2 && p.pos.y > n.pos.y - 0.2 && p.pos.y < n.pos.y + 2.4 * s) { hit = true; direct = n; break; }
        }
      } else {
        const pl = G.player.pos;
        if (!G.player.hidden && Math.hypot(p.pos.x - pl.x, p.pos.z - pl.z) < p.radius + 0.5 && p.pos.y > pl.y - 0.2 && p.pos.y < pl.y + 2.4) { hit = true; direct = 'player'; }
      }
    }
    if (hit) {
      p.dead = true; G.world.remove(p.mesh);
      if (p.aoe > 0) {
        G.burst(p.pos, p.color || 0xff7a1a, 16, 1.6);
        G.sfx('boom');
        if (p.fromPlayer) { for (const n of G.npcs) if (n.alive && n.pos.distanceTo(p.pos) < p.aoe + 1) G.hitNPC(n, p.dmg); }
        else if (G.player.pos.clone().add(new V3(0, 1, 0)).distanceTo(p.pos) < p.aoe + 0.8) G.damage(p.dmg);
      } else if (direct === 'player') G.damage(p.dmg);
      else if (direct) { G.hitNPC(direct, p.dmg); G.hud.hitmark(); }
      else G.burst(p.pos, p.color || 0xffffff, 5, 0.6);
      if (p.onHit) p.onHit(p.pos, direct);
    }
  }
  G.projs = G.projs.filter(p => !p.dead);
};

// ---------------- effects ----------------
G.burst = function (pos, color, n = 10, spd = 1) {
  if (!G.world) return;
  if (G.quality !== 'high') n = Math.ceil(n / 2);
  const mat = G.mat(color, { emissive: color });
  for (let i = 0; i < n; i++) {
    if (G.fxs.length > 220) break;
    const m = new THREE.Mesh(G.geo.box, mat); m.scale.setScalar(G.rand(0.12, 0.28));
    m.position.copy(pos); m.userData.noHit = true; G.scene.add(m);
    const v = new V3(G.rand(-1, 1), G.rand(0.2, 1.4), G.rand(-1, 1)).multiplyScalar(6 * spd);
    G.fxs.push({ mesh: m, life: G.rand(0.4, 0.8), vel: v, grav: 14, shrink: true, scene: true });
  }
};
G.tracer = function (a, b, color = 0xffee88) {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
  line.userData.noHit = true; G.scene.add(line);
  G.fxs.push({ mesh: line, life: 0.07, scene: true, disposeGeo: true });
};
G.floatText = function (pos, text, color) {
  const sp = G.label(text, { color, bg: null, scale: 0.9, depthTest: false });
  G.world.remove(sp); G.scene.add(sp); sp.position.copy(pos);
  G.fxs.push({ mesh: sp, life: 0.8, vel: new V3(0, 2.2, 0), grav: 0, scene: true, disposeMat: true });
};
G.ring = function (pos, color, r = 3, life = 0.35) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 28), new THREE.MeshBasicMaterial({ color, transparent: true }));
  m.rotation.x = Math.PI / 2; m.position.copy(pos); m.userData.noHit = true; G.scene.add(m);
  let t = 0;
  G.fxs.push({ mesh: m, life, scene: true, disposeGeo: true, disposeMat: true, upd: (dt) => { t += dt; const k = t / life; m.scale.setScalar(0.3 + k * r); m.material.opacity = 1 - k; } });
};
G.updateFx = function (dt) {
  for (const f of G.fxs) {
    f.life -= dt;
    if (f.vel) { f.vel.y -= (f.grav || 0) * dt; f.mesh.position.addScaledVector(f.vel, dt); }
    if (f.shrink) f.mesh.scale.multiplyScalar(0.94);
    if (f.upd) f.upd(dt);
    if (f.life <= 0) {
      if (f.scene) G.scene.remove(f.mesh);
      if (f.disposeGeo) f.mesh.geometry.dispose();
      if (f.disposeMat) { if (f.mesh.material.map) f.mesh.material.map.dispose(); f.mesh.material.dispose(); }
    }
  }
  G.fxs = G.fxs.filter(f => f.life > 0);
};

// ---------------- grid mazes ----------------
G.maze = function (rows, cs, o = {}) {
  const H = rows.length, W = rows[0].length;
  const ox = -W * cs / 2 + cs / 2, oz = -H * cs / 2 + cs / 2;
  const M = { rows: rows.map(r => r.split('')), cs, W, H, block: {} };
  M.toWorld = (c, r) => new V3(ox + c * cs, 0, oz + r * cs);
  M.toCell = (p) => [Math.round((p.x - ox) / cs), Math.round((p.z - oz) / cs)];
  M.at = (c, r) => (r < 0 || r >= H || c < 0 || c >= W) ? '#' : M.rows[r][c];
  M.pass = (c, r) => { const ch = M.at(c, r); return ch !== '#' && !M.block[c + ',' + r]; };
  M.find = (ch) => { const out = []; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (M.rows[r][c] === ch) out.push([c, r]); return out; };
  M.walls = [];
  const wh = o.wallH || 4;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (M.rows[r][c] !== '#') continue;
    // merge horizontal runs for fewer meshes
    let e = c; while (e + 1 < W && M.rows[r][e + 1] === '#' && !(o.noMerge)) e++;
    const p0 = M.toWorld(c, r), p1 = M.toWorld(e, r);
    const col = typeof o.wallColor === 'function' ? o.wallColor(c, r) : (o.wallColor || 0x8a8f9c);
    M.walls.push(G.box((p0.x + p1.x) / 2, 0, p0.z, (e - c + 1) * cs, wh, cs, col));
    c = e;
  }
  if (o.floor !== false) {
    const fl = G.box(0, -1, 0, W * cs, 1, H * cs, o.floorColor || 0x6b5a48);
    fl.userData.floor = true;
  }
  // BFS: next cell to step to from a toward b
  M.path = (a, b) => {
    const key = (c, r) => c + ',' + r;
    if (a[0] === b[0] && a[1] === b[1]) return b;
    const prev = {}; const q = [a]; prev[key(a[0], a[1])] = null;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      const [c, r] = q.shift();
      if (c === b[0] && r === b[1]) break;
      for (const [dc, dr] of dirs) {
        const nc = c + dc, nr = r + dr, k = key(nc, nr);
        if (k in prev || !M.pass(nc, nr)) continue;
        prev[k] = [c, r]; q.push([nc, nr]);
      }
    }
    let cur = b; if (!(key(b[0], b[1]) in prev)) return null;
    while (prev[key(cur[0], cur[1])] && !(prev[key(cur[0], cur[1])][0] === a[0] && prev[key(cur[0], cur[1])][1] === a[1])) cur = prev[key(cur[0], cur[1])];
    return cur;
  };
  return M;
};
// move an NPC along the maze toward a world target using BFS
G.mazeChase = function (M, n, target, speed, dt) {
  const a = M.toCell(n.pos), b = M.toCell(target);
  let next = (a[0] === b[0] && a[1] === b[1]) ? null : M.path(a, b);
  let goal;
  if (!next) goal = target; else {
    goal = M.toWorld(next[0], next[1]);
    // if we're not near center of our cell and the next cell is diagonal-ish, recentre first
    const here = M.toWorld(a[0], a[1]);
    const off = next[0] !== a[0] ? Math.abs(n.pos.z - here.z) : Math.abs(n.pos.x - here.x);
    if (off > 0.35) goal = new V3(next[0] !== a[0] ? here.x + (goal.x - here.x) * 0.2 : here.x, 0, next[1] !== a[1] ? here.z + (goal.z - here.z) * 0.2 : here.z);
  }
  return G.npcSeek(n, goal, speed, dt, { noJump: true, stop: 0.05 });
};

// ---------------- sound ----------------
G.sfx = function (name) {
  if (G.muted) return;
  try {
    if (!G.ac) G.ac = new (window.AudioContext || window.webkitAudioContext)();
    const ac = G.ac; if (ac.state === 'suspended') ac.resume();
    const P = {
      shoot: ['square', 300, 90, 0.07, 0.06], jump: ['sine', 380, 640, 0.12, 0.07], hurt: ['sawtooth', 200, 80, 0.18, 0.09],
      die: ['sawtooth', 400, 60, 0.6, 0.12], win: ['triangle', 520, 1040, 0.5, 0.12], coin: ['square', 900, 1400, 0.1, 0.05],
      kill: ['triangle', 700, 300, 0.2, 0.08], boom: ['sawtooth', 120, 30, 0.5, 0.15], click: ['sine', 600, 600, 0.05, 0.05],
      hit: ['square', 160, 120, 0.06, 0.06], parry: ['triangle', 1200, 1800, 0.12, 0.09], alarm: ['square', 880, 440, 0.4, 0.07],
      swing: ['sine', 300, 120, 0.1, 0.05], pop: ['sine', 500, 1200, 0.08, 0.06]
    };
    const s = P[name]; if (!s) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = s[0]; o.frequency.setValueAtTime(s[1], ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, s[2]), ac.currentTime + s[3]);
    g.gain.setValueAtTime(s[4], ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + s[3]);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + s[3] + 0.02);
  } catch (e) {}
};

// ---------------- panel (DOM menus) ----------------
G.openPanel = function (html, o = {}) {
  const p = G.$('panel'); p.innerHTML = html; p.classList.remove('hidden'); p.classList.toggle('side', !!o.side);
  G.panelOpen = true; if (!o.keepLock) G.unlock();
  return p;
};
G.closePanel = function (relock = true) {
  G.$('panel').classList.add('hidden'); G.panelOpen = false;
  if (relock && G.state === 'play') G.lock();
};

// ---------------- shared FPS kit (used by several levels) ----------------
// Detailed first-person weapon models. Every model points down -Z; userData.muzzle = local muzzle point.
G.gunModel = function (kind, accent = 0xff3b6b) {
  const g = new THREE.Group();
  const P = (x, y, z, w, h, d, c, o) => G.part(g, x, y, z, w, h, d, c, Object.assign({ noShadow: true }, o || {}));
  const C = (x, y, z, r, len, c, axis = 'z', seg) => { const m = G.mesh('cyl', c, x, y, z, r * 2, len, r * 2, { parent: g, noShadow: true }); if (axis === 'z') m.rotation.x = Math.PI / 2; return m; };
  const dark = 0x23252b, mid = 0x3a3d45, metal = 0x6b7080, wood = 0x7a4a26, skin = 0xffd23f;
  let muzzle = new V3(0, 0, -0.8);
  switch (kind) {
    case 'ar':
      P(0, 0, 0, 0.1, 0.14, 0.44, mid); P(0, 0.085, -0.02, 0.06, 0.03, 0.4, dark);
      for (let i = 0; i < 7; i++) P(0, 0.104, -0.18 + i * 0.05, 0.065, 0.012, 0.025, metal);
      P(0, 0.135, 0.04, 0.05, 0.05, 0.1, dark); P(0, 0.135, -0.012, 0.04, 0.04, 0.01, 0xff2020, { emissive: 0xff0000 });
      P(0, -0.005, -0.37, 0.09, 0.11, 0.3, dark); for (let i = 0; i < 4; i++) P(0.047, -0.005, -0.27 - i * 0.06, 0.005, 0.06, 0.03, mid);
      C(0, 0.01, -0.62, 0.018, 0.22, metal); P(0, 0.01, -0.74, 0.042, 0.042, 0.07, dark);
      { const m = P(0, -0.15, -0.09, 0.055, 0.2, 0.1, accent); m.rotation.x = 0.28; const m2 = P(0, -0.27, -0.13, 0.05, 0.08, 0.09, accent); m2.rotation.x = 0.45; }
      { const gp = P(0, -0.14, 0.13, 0.06, 0.17, 0.08, dark); gp.rotation.x = -0.35; }
      P(0, -0.075, 0.06, 0.012, 0.05, 0.1, dark);
      P(0, 0.0, 0.31, 0.07, 0.11, 0.22, mid); P(0, -0.03, 0.43, 0.075, 0.16, 0.04, dark); P(0.052, 0.02, 0.02, 0.01, 0.03, 0.06, metal);
      P(0.051, 0, -0.1, 0.004, 0.035, 0.18, accent);
      muzzle = new V3(0, 0.01, -0.79); break;
    case 'pistol':
      P(0, 0.035, -0.04, 0.06, 0.07, 0.27, 0x8a8f9c); for (let i = 0; i < 5; i++) P(0, 0.035, 0.05 + i * 0.012, 0.062, 0.06, 0.004, dark);
      P(0, -0.015, -0.04, 0.055, 0.045, 0.24, dark); P(0, 0.075, -0.16, 0.012, 0.015, 0.012, dark); P(0, 0.075, 0.08, 0.03, 0.015, 0.012, dark);
      { const gp = P(0, -0.11, 0.06, 0.055, 0.17, 0.08, 0x2a2a2a); gp.rotation.x = -0.3; }
      P(0, -0.05, -0.05, 0.012, 0.04, 0.07, dark); C(0, 0.035, -0.185, 0.012, 0.02, 0x111111);
      P(0.03, -0.11, 0.06, 0.004, 0.12, 0.05, accent);
      muzzle = new V3(0, 0.035, -0.19); break;
    case 'revolver':
      C(0, 0.03, -0.2, 0.017, 0.26, 0x9aa0aa); P(0, 0.055, -0.2, 0.015, 0.02, 0.26, 0x8a8f9c);
      { const cy = G.mesh('cyl', 0x7a7f8a, 0, 0.02, -0.02, 0.1, 0.09, 0.1, { parent: g, noShadow: true }); cy.rotation.x = Math.PI / 2; g.userData.drum = cy; }
      P(0, 0.03, 0.06, 0.05, 0.07, 0.08, 0x6b7080); { const gp = P(0, -0.08, 0.1, 0.05, 0.16, 0.08, wood); gp.rotation.x = -0.4; }
      P(0, -0.035, 0.01, 0.01, 0.04, 0.06, 0x333333); P(0, 0.07, -0.32, 0.01, 0.02, 0.01, 0x333333);
      muzzle = new V3(0, 0.03, -0.34); break;
    case 'smg':
      P(0, 0, 0, 0.08, 0.12, 0.32, 0x2f3a2f); P(0, 0.075, -0.02, 0.05, 0.025, 0.28, dark);
      P(0, 0.11, 0.02, 0.04, 0.04, 0.08, dark); P(0, 0.11, -0.022, 0.03, 0.03, 0.005, 0x30ff60, { emissive: 0x20ff40 });
      C(0, 0.005, -0.3, 0.032, 0.24, 0x1a1a1a); for (let i = 0; i < 3; i++) C(0, 0.005, -0.22 - i * 0.07, 0.034, 0.01, metal);
      P(0, -0.17, -0.06, 0.045, 0.26, 0.06, accent); { const gp = P(0, -0.12, 0.09, 0.05, 0.14, 0.07, dark); gp.rotation.x = -0.3; }
      P(0, -0.12, -0.17, 0.04, 0.12, 0.05, dark);
      P(0.03, 0.02, 0.27, 0.01, 0.01, 0.22, metal); P(-0.03, 0.02, 0.27, 0.01, 0.01, 0.22, metal); P(0, -0.02, 0.38, 0.07, 0.09, 0.015, metal);
      muzzle = new V3(0, 0.005, -0.43); break;
    case 'shotgun':
      C(0, 0.03, -0.38, 0.026, 0.7, 0x2a2a2a); C(0, -0.03, -0.33, 0.022, 0.55, 0x3a3a3a);
      P(0, 0.0, 0.02, 0.08, 0.13, 0.26, mid); P(0, 0.07, -0.72, 0.012, 0.02, 0.012, 0xffd23f);
      { const pump = P(0, -0.03, -0.32, 0.07, 0.07, 0.2, wood); for (let i = 0; i < 5; i++) P(0, -0.03, -0.4 + i * 0.04, 0.074, 0.074, 0.01, 0x5a3418); g.userData.pump = pump; }
      { const gp = P(0, -0.11, 0.17, 0.06, 0.15, 0.08, wood); gp.rotation.x = -0.4; }
      { const st = P(0, -0.05, 0.36, 0.07, 0.12, 0.3, wood); st.rotation.x = -0.12; } P(0, -0.07, 0.52, 0.075, 0.15, 0.03, 0x111111);
      P(0.042, 0.0, 0.04, 0.005, 0.05, 0.12, accent);
      muzzle = new V3(0, 0.03, -0.74); break;
    case 'sniper':
      P(0, 0, 0, 0.08, 0.11, 0.42, 0x2a3a4a); C(0, 0.01, -0.55, 0.02, 0.7, 0x1a1a1a); P(0, 0.01, -0.92, 0.045, 0.045, 0.1, dark);
      for (let i = 0; i < 3; i++) P(0, 0.01, -0.86 + i * 0.03, 0.05, 0.012, 0.012, metal);
      C(0, 0.115, -0.02, 0.036, 0.36, 0x111111); C(0, 0.115, -0.21, 0.048, 0.06, 0x111111); C(0, 0.115, 0.17, 0.044, 0.06, 0x111111);
      { const l = G.mesh('cyl', 0x4fd6e0, 0, 0.115, -0.243, 0.08, 0.004, 0.08, { parent: g, emissive: 0x1a5a77, noShadow: true }); l.rotation.x = Math.PI / 2; }
      P(0, 0.075, -0.06, 0.02, 0.04, 0.03, dark); P(0, 0.075, 0.06, 0.02, 0.04, 0.03, dark);
      P(0.05, 0.03, 0.08, 0.06, 0.012, 0.012, metal); G.mesh('sph', metal, 0.085, 0.03, 0.08, 0.035, undefined, undefined, { parent: g, noShadow: true });
      P(0, -0.04, -0.3, 0.075, 0.08, 0.32, 0x3f5a3a); { const st = P(0, -0.04, 0.33, 0.07, 0.14, 0.32, 0x3f5a3a); st.rotation.x = -0.08; } P(0, 0.02, 0.32, 0.05, 0.03, 0.14, 0x3f5a3a);
      P(0, -0.12, -0.02, 0.05, 0.08, 0.05, dark); { const gp = P(0, -0.13, 0.11, 0.055, 0.14, 0.07, 0x3f5a3a); gp.rotation.x = -0.35; }
      { const b1 = P(-0.03, -0.1, -0.52, 0.012, 0.16, 0.012, metal); b1.rotation.z = 0.25; const b2 = P(0.03, -0.1, -0.52, 0.012, 0.16, 0.012, metal); b2.rotation.z = -0.25; }
      P(0.041, 0, -0.32, 0.004, 0.03, 0.2, accent);
      muzzle = new V3(0, 0.01, -0.97); break;
    case 'rocket':
      C(0, 0.04, -0.15, 0.085, 1.1, 0x3a5a2a); C(0, 0.04, -0.69, 0.095, 0.06, 0x2a3a1a); C(0, 0.04, 0.39, 0.095, 0.05, 0x2a3a1a);
      { const w = G.mesh('cone', 0x8a8f9c, 0, 0.04, -0.82, 0.13, 0.22, 0.13, { parent: g, noShadow: true }); w.rotation.x = -Math.PI / 2; g.userData.warhead = w; }
      P(0, 0.15, -0.15, 0.03, 0.08, 0.06, dark); P(0.06, 0.15, -0.12, 0.08, 0.08, 0.02, dark); P(0.1, 0.15, -0.12, 0.02, 0.05, 0.004, 0x4fd6e0, { emissive: 0x1a5a77 });
      { const gp = P(0, -0.08, 0.02, 0.05, 0.14, 0.07, dark); gp.rotation.x = -0.3; } P(0, -0.07, -0.28, 0.05, 0.12, 0.06, dark);
      P(0, 0.04, -0.4, 0.172, 0.03, 0.03, 0xffd23f); P(0, 0.04, 0.2, 0.172, 0.03, 0.03, 0xffd23f);
      muzzle = new V3(0, 0.04, -0.9); break;
    case 'knife':
      P(0, 0, 0.06, 0.04, 0.05, 0.16, 0x2a1a0a); for (let i = 0; i < 4; i++) P(0, 0, 0.0 + i * 0.04, 0.045, 0.055, 0.01, 0xffd23f);
      P(0, 0, -0.03, 0.14, 0.025, 0.025, 0xffd23f, { emissive: 0x554400 });
      P(0, 0.01, -0.17, 0.012, 0.06, 0.24, 0xffe680, { emissive: 0x665500 }); { const tip = P(0, 0.0, -0.3, 0.011, 0.045, 0.06, 0xffe680, { emissive: 0x665500 }); tip.rotation.x = 0.6; }
      P(0, -0.025, -0.16, 0.006, 0.01, 0.22, 0xffffff, { emissive: 0x888888 });
      muzzle = new V3(0, 0, -0.33); break;
  }
  // hands
  if (kind !== 'knife') { P(0.0, -0.13, 0.12, 0.09, 0.09, 0.1, skin); }
  else P(0, 0, 0.06, 0.09, 0.09, 0.11, skin);
  if (kind === 'ar' || kind === 'smg' || kind === 'shotgun' || kind === 'sniper') P(0, -0.07, -0.33, 0.1, 0.08, 0.1, skin);
  // muzzle flash
  const fl = G.mesh('sph', 0xffd060, muzzle.x, muzzle.y, muzzle.z - 0.05, 0.16, 0.16, 0.3, { parent: g, emissive: 0xffaa00, noShadow: true, basic: true });
  fl.visible = false; g.userData.flash = fl;
  g.userData.muzzle = muzzle; g.userData.kind = kind;
  g.traverse(o => { o.userData.noHit = true; o.castShadow = false; });
  return g;
};
G.fps = {
  makeGun(kind = 'ar', accent) {
    if (typeof kind !== 'string') kind = 'ar';
    G.fps.removeGun();
    const g = G.gunModel(kind, accent);
    const base = kind === 'knife' ? new V3(0.28, -0.26, -0.45) : kind === 'rocket' ? new V3(0.26, -0.24, -0.5) : new V3(0.24, -0.22, -0.48);
    const ads = kind === 'rocket' ? new V3(0.12, -0.2, -0.45) : kind === 'sniper' ? new V3(0, -0.13, -0.3) : new V3(0, -0.12 - (g.userData.muzzle.y), -0.4);
    g.userData.base = base; g.userData.ads = ads;
    g.position.copy(base); g.scale.setScalar(1.15);
    G.camera.add(g); G.L.gunModel = g; G.L.aiming = false; G.L.aimT = false;
    return g;
  },
  removeGun() {
    if (G.L && G.L.gunModel) { G.camera.remove(G.L.gunModel); G.L.gunModel = null; }
    G.camera.fov = 70; G.camera.updateProjectionMatrix();
    const sc = document.getElementById('scope'); if (sc) sc.classList.add('hidden');
  },
  // bot gun in the avatar's right hand
  botGun(n, kind, accent) {
    const g = G.gunModel(kind, accent); g.userData.flash.visible = false;
    g.rotation.x = -Math.PI / 2; g.position.set(0, -0.8, 0.05); g.scale.setScalar(1.25);
    g.traverse(o => o.userData.noHit = false);
    n.mesh.userData.P.aR.add(g);
    g.traverse(c => { c.userData.npc = n; });
    n.gun = g; return g;
  },
  // returns true if fired
  fire(w, onKill) {
    const L = G.L;
    if (L.fireCd > 0 || L.reload > 0) return false;
    const gm = L.gunModel;
    if (w.melee) {
      L.fireCd = w.rate; G.sfx('swing');
      if (gm) { gm.rotation.x = -0.9; gm.rotation.y = 0.5; }
      for (const n of G.npcs) {
        if (!n.alive) continue;
        const d = G.dist2(n.pos, G.player.pos);
        if (d < (w.range || 2.8)) {
          const to = n.pos.clone().sub(G.player.pos).setY(0).normalize();
          if (to.dot(G.forward(G.cam.yaw)) > 0.4) { G.hitNPC(n, w.dmg); G.hud.hitmark(); if (!n.alive && onKill) onKill(n); return true; }
        }
      }
      return true;
    }
    L.fireCd = w.rate; L.mag--; G.sfx(w.proj ? 'boom' : 'shoot');
    const scoped = L.aiming && w.scope;
    if (gm) {
      gm.position.z += w.kick || 0.08; gm.rotation.x += (w.kick || 0.08) * 1.5;
      gm.userData.flash.visible = !scoped; gm.userData.flash.rotation.z = Math.random() * 3; L.flashT = 0.05;
      if (gm.userData.drum) gm.userData.drum.rotation.y += Math.PI / 3;
      if (gm.userData.pump) L.pumpT = 0.35;
    }
    G.cam.pitch += (w.recoil || 0.01) * (L.aiming ? 0.5 : 1);
    const muzzle = gm && !scoped ? gm.localToWorld(gm.userData.muzzle.clone()) : G.camera.localToWorld(new V3(0.2, -0.2, -0.6));
    const spread = L.aiming ? (w.adsSpread !== undefined ? w.adsSpread : w.spread * 0.35) : (w.hipSpread !== undefined ? w.hipSpread : w.spread);
    if (w.proj) {
      const r = G.camRay(200);
      const dir = r.point.clone().sub(muzzle).normalize();
      if (gm && gm.userData.warhead) { gm.userData.warhead.visible = false; }
      G.shootProj({ pos: muzzle, vel: dir.multiplyScalar(w.speed || 40), color: 0xff8a1a, size: 0.35, dmg: w.dmg, aoe: w.aoe || 0, fromPlayer: true, life: 4 });
    } else {
      for (let i = 0; i < (w.pellets || 1); i++) {
        const r = G.camRay(w.range || 120, spread);
        G.tracer(muzzle, r.point, w.tracer || 0xffee88);
        if (r.npc) {
          G.hud.hitmark(); G.sfx('hit');
          const was = r.npc.alive; G.hitNPC(r.npc, w.dmg * (r.head ? 1.6 : 1), { head: r.head });
          if (was && !r.npc.alive) { r.npc._counted = true; if (onKill) onKill(r.npc); }
        } else G.burst(r.point, 0xcccccc, 2, 0.3);
      }
    }
    if (L.mag <= 0 && w.mag) { L.reload = w.reloadT || 1.4; G.hud.toast('換彈中…', 900); L.aiming = false; L.aimT = false; }
    return true;
  },
  tick(dt, w) {
    const L = G.L;
    L.fireCd = Math.max(0, (L.fireCd || 0) - dt);
    const gm = L.gunModel;
    if (L.reload > 0) { L.reload -= dt; if (L.reload <= 0) { L.mag = w.mag; if (gm && gm.userData.warhead) gm.userData.warhead.visible = true; } }
    if (G.in.rP && w.mag && L.mag < w.mag && !(L.reload > 0)) { L.reload = w.reloadT || 1.4; G.hud.toast('換彈中…', 900); }
    // aim: hold right mouse on PC, tap the aim button to toggle on touch
    if (!w.melee) {
      if (G.isTouch) { if (G.in.fP) L.aimT = !L.aimT; L.aiming = L.aimT; }
      else L.aiming = G.in.fH;
      if (L.reload > 0) L.aiming = false;
    } else L.aiming = false;
    const scoped = L.aiming && w.scope;
    const fovT = L.aiming ? (w.scope ? 16 : (w.adsFov || 52)) : 70;
    G.camera.fov = G.lerp(G.camera.fov, fovT, Math.min(1, dt * 14)); G.camera.updateProjectionMatrix();
    const sc = document.getElementById('scope'); if (sc) sc.classList.toggle('hidden', !(scoped && G.camera.fov < 30));
    G.hud.cross(!(scoped && G.camera.fov < 30) && !(L.aiming && !w.scope && w.ads !== false && G.camera.fov < 58 && false));
    if (gm) {
      const tgt = L.aiming ? gm.userData.ads : gm.userData.base;
      const bob = L.aiming ? 0 : Math.sin(G.time * 9) * Math.min(1, Math.hypot(G.player.vel.x, G.player.vel.z) / 8) * 0.012;
      gm.position.x = G.lerp(gm.position.x, tgt.x, Math.min(1, dt * 14));
      gm.position.y = G.lerp(gm.position.y, tgt.y + bob, Math.min(1, dt * 14));
      gm.position.z = G.lerp(gm.position.z, tgt.z, Math.min(1, dt * 12));
      gm.rotation.x = G.lerp(gm.rotation.x, L.reload > 0 ? -0.6 : 0, Math.min(1, dt * 10));
      gm.rotation.y = G.lerp(gm.rotation.y, 0, Math.min(1, dt * 10));
      gm.visible = !(scoped && G.camera.fov < 30);
      if (L.flashT > 0) { L.flashT -= dt; if (L.flashT <= 0) gm.userData.flash.visible = false; }
      if (gm.userData.pump) { if (L.pumpT > 0) { L.pumpT -= dt; gm.userData.pump.position.z = -0.32 + Math.sin((1 - L.pumpT / 0.35) * Math.PI) * 0.1; } }
    }
    G.hud.ammo(w.melee ? '🔪 ' + w.name : `${w.name}　${L.reload > 0 ? '換彈…' : (w.mag ? L.mag + ' / ' + w.mag : '∞')}`);
  },
  // simple shooter bot brain
  bot(n, dt, o) {
    const p = G.player;
    n.t += dt;
    const eye = n.pos.clone().add(new V3(0, 1.9, 0)), pe = p.pos.clone().add(new V3(0, 1.5, 0));
    const see = !G.dying && G.los(eye, pe);
    const d = G.dist2(n.pos, p.pos);
    if (n.gun && n.gun.userData.flash.visible) { n.data.fl = (n.data.fl || 0) - dt; if (n.data.fl <= 0) n.gun.userData.flash.visible = false; }
    if (see && d < (o.range || 40)) {
      const side = Math.sin(n.t * 1.3 + n.data.seed) > 0 ? 1 : -1;
      const to = p.pos.clone().sub(n.pos).setY(0).normalize();
      const perp = new V3(-to.z, 0, to.x).multiplyScalar(side);
      const want = d > (o.keep || 12) ? to : d < 6 ? to.clone().negate() : new V3();
      const target = n.pos.clone().add(perp.multiplyScalar(3)).add(want.multiplyScalar(3));
      n.data.cd = (n.data.cd || 0) - dt;
      if (n.data.cd <= 0) {
        n.data.cd = o.rate * G.rand(0.8, 1.3);
        const muzzle = n.gun ? n.gun.localToWorld(n.gun.userData.muzzle.clone()) : n.pos.clone().add(new V3(0, 1.6, 0));
        const acc = o.acc * G.clamp(1.2 - d / 50, 0.35, 1) * (Math.hypot(p.vel.x, p.vel.z) > 3 ? 0.75 : 1);
        const hit = Math.random() < acc;
        const aim = pe.clone().add(hit ? new V3() : new V3(G.rand(-1.5, 1.5), G.rand(-0.5, 1.2), G.rand(-1.5, 1.5)));
        G.tracer(muzzle, aim, 0xff7070); G.sfx('shoot');
        if (n.gun) { n.gun.userData.flash.visible = true; n.data.fl = 0.05; }
        if (hit) G.damage(o.dmg);
      }
      G.moveEntity(n, dt);
      const dir = target.clone().sub(n.pos); dir.y = 0; const l = dir.length();
      if (l > 0.3) { dir.multiplyScalar(o.speed / l); n.vel.x = dir.x; n.vel.z = dir.z; }
      if (n.hitWall && n.onGround) n.vel.y = 9;
      n.yaw = Math.atan2(p.pos.x - n.pos.x, p.pos.z - n.pos.z);
      n.mesh.userData.armPose = true; n.mesh.userData.P.aR.rotation.x = -Math.PI / 2; n.mesh.userData.P.aL.rotation.x = -Math.PI / 2.4;
      G.syncNPC(n, dt, Math.hypot(n.vel.x, n.vel.z));
    } else {
      n.mesh.userData.armPose = false;
      if (!n.data.wp || n.pos.distanceTo(n.data.wp) < 2 || n.t > (n.data.wpT || 0)) { n.data.wp = p.pos.clone(); n.data.wpT = n.t + 3; }
      G.npcSeek(n, n.data.wp, o.speed, dt);
    }
  }
};
