// Levels 16–19: 小豬快逃, 木頭人遊戲, 逃離設施, 領養寵物
'use strict';
(function () {
  const V = THREE.Vector3;
  const darkSky = () => G.setSky({ color: 0x07080d, fog: [5, 38], fogColor: 0x07080d, sun: 0.05, hemi: 0.5, hemiSky: 0xd0d8ff, hemiGround: 0x303030 });

  // ======================= 16. 小豬快逃 (Piggy) =======================
  const PIGGY_MAP = [
    '###############',
    '#S....#.......#',
    '#.###.#.#####.#',
    '#.#H..#.#...#.#',
    '#.#####.#.#.#.#',
    '#.......#.#...#',
    '###.#####.###.#',
    '#...#P....#...#',
    '#.###.###.#.###',
    '#.#...#K#.#...#',
    '#.#.###B#.###.#',
    '#...#.........D',
    '###############',
  ];
  G.LEVELS.push({
    name: '小豬快逃', insp: 'Piggy', obj: '找到槌子打破木板，拿到鑰匙，打開紅色大門逃出去！別被小豬抓到。',
    ctrl: 'WASD 移動・滑鼠 看・E 撿東西 / 使用',
    build(L) {
      darkSky(); G.cam.mode = 'first';
      const M = L.M = G.maze(PIGGY_MAP, 4, { wallH: 4.5, wallColor: (c, r) => (c + r) % 3 ? 0xc9b18f : 0xb89f7d, floorColor: 0x7a5a3a });
      L.pl = new THREE.PointLight(0xffe6c0, 1.6, 22, 1.2); G.world.add(L.pl);
      const at = ch => { const [c, r] = M.find(ch)[0]; return { c, r, p: M.toWorld(c, r) }; };
      const S = at('S'), H = at('H'), K = at('K'), B = at('B'), D = at('D'), P = at('P');
      L.spawn.copy(S.p); L.spawnYaw = Math.PI / 2 * -1;
      L.pSpawn = P.p.clone();
      // hammer
      L.hammer = new THREE.Group(); G.part(L.hammer, 0, 0.5, 0, 0.12, 1, 0.12, 0x8b5a2b); G.part(L.hammer, 0, 1.05, 0, 0.5, 0.25, 0.25, 0x777777);
      L.hammer.position.copy(H.p); G.world.add(L.hammer);
      G.label('🔨', { pos: H.p.clone().setY(2), scale: 0.8, bg: null });
      G.interact(H.p, 2.2, '撿起槌子', () => { L.hasHammer = true; L.hammer.visible = false; G.sfx('coin'); G.hud.toast('拿到槌子！去打破木板'); }, () => !L.hasHammer);
      // key
      L.key = new THREE.Group(); G.part(L.key, 0, 0.8, 0, 0.5, 0.15, 0.1, 0xd93636, { emissive: 0x550000 }); G.part(L.key, -0.35, 0.8, 0, 0.3, 0.4, 0.1, 0xd93636, { emissive: 0x550000 });
      L.key.position.copy(K.p); G.world.add(L.key);
      G.interact(K.p, 2.2, '撿起紅色鑰匙', () => { L.hasKey = true; L.key.visible = false; G.sfx('coin'); G.hud.toast('拿到鑰匙！去打開紅色大門'); }, () => !L.hasKey);
      // boards
      M.block[B.c + ',' + B.r] = true;
      L.boards = [];
      for (let i = 0; i < 3; i++) L.boards.push(G.box(B.p.x, 0.6 + i * 1.2, B.p.z, 4, 0.4, 0.3, 0x9b6a3c));
      L.boardCol = G.box(B.p.x, 0, B.p.z, 4, 4.5, 0.6, 0x000000, { opacity: 0.01 });
      G.interact(B.p.clone().add(new V(0, 0, 2)), 2.6, () => L.hasHammer ? '用槌子打破木板' : '木板擋住了，需要槌子', () => {
        if (!L.hasHammer) { G.hud.toast('要先找到槌子 🔨'); return; }
        L.broken = true; L.boards.forEach(b => { G.world.remove(b); G.removeCol(b.userData.col); }); G.removeCol(L.boardCol.userData.col); G.world.remove(L.boardCol);
        delete M.block[B.c + ',' + B.r]; G.sfx('boom'); G.burst(B.p.clone().setY(2), 0x9b6a3c, 16);
      }, () => !L.broken);
      // door
      M.block[D.c + ',' + D.r] = true;
      L.door = G.box(D.p.x, 0, D.p.z, 0.6, 4.5, 4, 0xb81d1d);
      G.label('出口', { pos: D.p.clone().setY(5), scale: 1, color: '#ff8080' });
      G.interact(D.p.clone().add(new V(-2, 0, 0)), 2.6, () => L.hasKey ? '用鑰匙開門' : '鎖住了，需要紅色鑰匙', () => {
        if (!L.hasKey) { G.hud.toast('要先找到紅色鑰匙 🔑'); return; }
        L.open = true; G.removeCol(L.door.userData.col); L.door.visible = false; G.sfx('win'); delete M.block[D.c + ',' + D.r];
      }, () => !L.open);
      L.exit = D.p;
      // piggy
      const pg = G.makeNPC({ skin: 0xffa6c9, shirt: 0x7a2a4a, pants: 0x3a1a2a, pos: L.pSpawn, face: 'scary' });
      const h = pg.mesh.userData.P.head;
      G.part(pg.mesh, 0, 1.92, 0.36, 0.3, 0.2, 0.12, 0xff7fae); G.part(pg.mesh, -0.22, 2.36, 0, 0.16, 0.2, 0.08, 0xffa6c9); G.part(pg.mesh, 0.22, 2.36, 0, 0.16, 0.2, 0.08, 0xffa6c9);
      G.part(pg.mesh.userData.P.aR, 0, -1.0, 0.3, 0.16, 1.2, 0.16, 0x8b5a2b);
      h.scale.set(0.7, 0.62, 0.66);
      L.piggy = pg; L.grace = 8;
      G.player.speed = 7;
      G.setButtons({ act: null, e: 'E' });
      G.hud.prog('🔨 槌子 ✗　🔑 鑰匙 ✗');
    },
    start(L) { G.hud.toast('小豬 8 秒後開始追你！', 3000); },
    update(dt, L) {
      const p = G.player, pg = L.piggy;
      L.pl.position.set(p.pos.x, 3.2, p.pos.z);
      L.grace -= dt;
      if (L.grace <= 0 && !G.dying) {
        G.mazeChase(L.M, pg, p.pos, 6.2, dt);
        if (G.dist2(pg.pos, p.pos) < 1.25) G.die('被小豬抓到了！🐷');
        if (L.grace > -0.1) G.sfx('alarm');
      } else G.syncNPC(pg, dt, 0);
      if (L.open && p.pos.x > L.exit.x - 0.5) G.complete('逃出去了！🏃');
      G.hud.prog(`🔨 槌子 ${L.hasHammer ? '✔' : '✗'}　🔑 鑰匙 ${L.hasKey ? '✔' : '✗'}${L.grace > 0 ? '　⏳ ' + Math.ceil(L.grace) : ''}`);
    },
    respawn(L) { L.piggy.pos.copy(L.pSpawn); L.piggy.vel.set(0, 0, 0); L.grace = 5; }
  });

  // ======================= 17. 木頭人遊戲 (Ink Game / Red Light Green Light) =======================
  G.LEVELS.push({
    name: '木頭人遊戲', insp: 'Ink Game', obj: '綠燈時跑，紅燈時一定要停住不動！在時間內跑到終點線。',
    ctrl: 'WASD 移動・紅燈時放開所有按鍵（也不能跳）',
    ctrlTouch: '左邊搖桿移動・紅燈時放開搖桿',
    build(L) {
      G.setSky({ color: 0x8fd3ff, fog: [80, 200] });
      G.ground(140, '#d9c38f', '#cdb682');
      G.box(-16, 0, 0, 1, 6, 120, 0xf2e2c4); G.box(16, 0, 0, 1, 6, 120, 0xf2e2c4);
      G.box(0, 0, 56, 32, 6, 1, 0xf2e2c4);
      G.box(0, -0.98, 46, 30, 1, 0.4, 0xffffff, { solid: false });
      G.box(0, -0.97, -46, 30, 1, 0.6, 0xd93636, { solid: false });
      G.box(0, 0, -64, 34, 10, 1, 0xf2e2c4);
      G.box(-5, 0, -60, 2.5, 9, 2.5, 0x6b4426); G.mesh('sph', 0x2f9e4a, -5, 11, -60, 8);
      // doll
      const d = new THREE.Group();
      G.part(d, 0, 2.5, 0, 3.2, 5, 2.4, 0xff8a1a); G.part(d, -1, 0, 0, 1, 2.2, 1, 0xffd23f); G.part(d, 1, 0, 0, 1, 2.2, 1, 0xffd23f);
      G.part(d, 0, 1, 0, 3.6, 1.5, 2.6, 0xffd23f);
      const head = new THREE.Group(); head.position.set(0, 6.3, 0); d.add(head);
      G.part(head, 0, 0, 0, 2.6, 2.6, 2.6, 0xffe0bd);
      G.part(head, 0, 0.4, -0.2, 2.8, 2.4, 2.6, 0x111111);
      G.part(head, -0.55, 0.15, 1.31, 0.4, 0.4, 0.05, 0x111111); G.part(head, 0.55, 0.15, 1.31, 0.4, 0.4, 0.05, 0x111111);
      G.part(head, 0, -0.6, 1.31, 0.6, 0.15, 0.05, 0xd93636);
      G.part(head, -1.45, 1.0, 0, 0.6, 0.6, 0.6, 0x111111); G.part(head, 1.45, 1.0, 0, 0.6, 0.6, 0.6, 0x111111);
      d.position.set(0, 0, -56); d.scale.setScalar(1.6); G.world.add(d);
      L.head = head; L.doll = d;
      L.spawn.set(0, 0, 50); L.spawnYaw = 0;
      G.player.speed = 7;
      G.player.mesh.userData.P.torso.material = G.mat(0x2fae8a);
      L.bots = [];
      L.reset = () => {
        L.bots.forEach(b => G.removeNPC(b)); L.bots = [];
        for (let i = 0; i < 14; i++) {
          const num = String(G.randi(1, 456)).padStart(3, '0');
          const b = G.makeNPC({ name: num, shirt: 0x2fae8a, pants: 0x2fae8a, skin: G.pick([0xffd23f, 0xf2c48d, 0xc68642, 0xffe0bd]), pos: new V(G.rand(-13, 13), 0, G.rand(48, 53)) });
          b.data = { sp: G.rand(3, 6.5), bad: Math.random() < 0.16, react: G.rand(0.05, 0.25) };
          L.bots.push(b);
        }
        L.light = 'green'; L.lt = 0; L.dur = G.rand(2.5, 4.5); L.timeLeft = 75; L.head.rotation.y = Math.PI;
      };
      L.reset();
      G.setButtons({ act: null, e: null });
    },
    cleanup() { G.player.mesh.userData.P.torso.material = G.mat(G.store.get('shirt', 0x2f7de1)); },
    update(dt, L) {
      const p = G.player;
      L.lt += dt; L.timeLeft -= dt;
      if (L.light === 'green' && L.lt > L.dur) { L.light = 'turn'; L.lt = 0; }
      else if (L.light === 'turn') { L.head.rotation.y = G.lerp(Math.PI, 0, Math.min(1, L.lt / 0.35)); if (L.lt > 0.35) { L.light = 'red'; L.lt = 0; L.dur = G.rand(2, 3.6); G.sfx('alarm'); } }
      else if (L.light === 'red' && L.lt > L.dur) { L.light = 'green'; L.lt = 0; L.dur = G.rand(2.2, 4.8); L.head.rotation.y = Math.PI; G.sfx('pop'); L.bots.forEach(b => b.data.bad = Math.random() < 0.14); }
      const red = L.light === 'red';
      for (const b of L.bots) {
        if (!b.alive) continue;
        if (b.pos.z < -46) { G.syncNPC(b, dt, 0); continue; }
        const go = L.light === 'green' || (L.light === 'turn' && L.lt < b.data.react) || (red && b.data.bad && L.lt > 0.5);
        if (go) G.npcSeek(b, new V(b.pos.x, 0, -50), b.data.sp, dt); else { b.vel.x = 0; b.vel.z = 0; G.moveEntity(b, dt); G.syncNPC(b, dt, 0); }
        if (red && L.lt > 0.5 && Math.hypot(b.vel.x, b.vel.z) > 0.5) { G.tracer(L.doll.position.clone().add(new V(0, 10, 0)), b.pos.clone().add(new V(0, 1.5, 0)), 0xff3030); G.sfx('shoot'); G.killNPC(b); }
      }
      if (red && L.lt > 0.4 && !G.dying && (Math.hypot(p.vel.x, p.vel.z) > 0.6 || Math.abs(p.vel.y) > 1.5)) {
        G.tracer(L.doll.position.clone().add(new V(0, 10, 0)), p.pos.clone().add(new V(0, 1.5, 0)), 0xff3030); G.sfx('shoot');
        G.die('你動了！淘汰 ❌');
      }
      if (L.timeLeft <= 0 && !G.dying) G.die('時間到！');
      if (p.pos.z < -46 && !G.dying) G.complete('過關！你活下來了 🟢');
      const lamp = L.light === 'green' ? '🟢 綠燈 — 快跑！' : L.light === 'turn' ? '🟡 …' : '🔴 紅燈 — 不准動！';
      G.hud.prog(`${lamp}　⏱ ${Math.max(0, Math.ceil(L.timeLeft))}`);
    },
    respawn(L) { L.reset(); }
  });

  // ======================= 18. 逃離設施 (Flee the Facility) =======================
  const FAC_MAP = [
    '#################',
    '#S......#.......#',
    '#.#####.#.#####.#',
    '#.#C..#...#..C#.#',
    '#.#...#####...#.#',
    '#.....#.M.#.....X',
    '###.#.#...#.#.###',
    '#...#.......#...#',
    '#.#####.#.#####.#',
    '#...C#..#..#....#',
    '#.##.#.###.#.##.#',
    'X....#.........##',
    '#################',
  ];
  G.LEVELS.push({
    name: '逃離設施', insp: 'Flee the Facility', obj: '駭進 3 台電腦（站在旁邊按住「駭入」），出現警告時快按 E！然後從打開的出口逃走。被野獸看到要快跑！',
    ctrl: 'WASD 移動・在電腦旁按住左鍵 駭入・跳出警告時按 E',
    ctrlTouch: '左邊搖桿移動・按住「駭入」・警告時按 E',
    build(L) {
      darkSky(); G.cam.mode = 'first';
      const M = L.M = G.maze(FAC_MAP, 4, { wallH: 4.5, wallColor: (c, r) => (c * 7 + r) % 4 ? 0x5a6378 : 0x4a5266, floorColor: 0x3a3f4a });
      L.pl = new THREE.PointLight(0xc8dcff, 1.6, 22, 1.2); G.world.add(L.pl);
      const S = M.find('S')[0]; L.spawn.copy(M.toWorld(S[0], S[1])); L.spawnYaw = -Math.PI / 2;
      const Bc = M.find('M')[0]; L.bSpawn = M.toWorld(Bc[0], Bc[1]);
      L.pcs = M.find('C').map(([c, r]) => {
        const pos = M.toWorld(c, r);
        G.box(pos.x, 0, pos.z, 1.6, 1, 1, 0x2a2f3a);
        const scr = G.box(pos.x, 1, pos.z, 1.4, 1, 0.15, 0x2f7de1, { emissive: 0x1a3a88, solid: false });
        return { pos, scr, prog: 0, done: false };
      });
      L.exits = M.find('X').map(([c, r]) => { M.block[c + ',' + r] = true; const pos = M.toWorld(c, r); const d = G.box(pos.x, 0, pos.z, 4, 4.5, 4, 0x8a1d1d); return { c, r, pos, d }; });
      const bt = G.makeNPC({ skin: 0x6a6a6a, shirt: 0x1a1a1a, pants: 0x111111, face: 'scary', pos: L.bSpawn, scale: 1.1 });
      G.part(bt.mesh.userData.P.aR, 0, -1.0, 0.3, 0.2, 1.1, 0.2, 0x555555); G.part(bt.mesh.userData.P.aR, 0, -1.55, 0.3, 0.6, 0.3, 0.35, 0x777777);
      bt.data = { wp: null, alert: 0, last: null };
      L.beast = bt;
      L.check = null; L.ct = G.rand(2.5, 4);
      G.player.speed = 7;
      G.setButtons({ act: '駭入', e: 'E' });
    },
    update(dt, L) {
      const p = G.player, M = L.M, bt = L.beast;
      L.pl.position.set(p.pos.x, 3.2, p.pos.z);
      const done = L.pcs.filter(c => c.done).length;
      // hacking
      let near = null;
      for (const c of L.pcs) if (!c.done && G.dist2(p.pos, c.pos) < 2.8) near = c;
      if (near && G.in.actH && !G.dying) {
        near.prog += dt * 0.1;
        L.ct -= dt;
        if (L.ct <= 0 && !L.check) { L.check = { t: 0.9 }; G.sfx('pop'); G.hud.big('⚠️ 快按 E！', '#ffd23f', 900); }
        if (near.prog >= 1) {
          near.done = true; near.scr.material = G.mat(0x2fd06a, { emissive: 0x1a882a }); G.sfx('win');
          G.hud.toast(`電腦駭入完成！（${done + 1} / 3）`);
          if (done + 1 >= 3) {
            for (const e of L.exits) { G.removeCol(e.d.userData.col); e.d.visible = false; delete M.block[e.c + ',' + e.r]; }
            G.hud.big('出口打開了！快逃！', '#5bff7a', 1800); G.sfx('alarm');
          }
        }
      }
      if (L.check) {
        L.check.t -= dt;
        if (G.in.eP) { G.in.eP = false; L.check = null; L.ct = G.rand(2.5, 4); G.sfx('coin'); G.hud.hideBig(); }
        else if (L.check.t <= 0) {
          L.check = null; L.ct = G.rand(2.5, 4); G.sfx('alarm'); G.hud.big('❌ 失誤！野獸聽到了', '#ff5a5a', 1200);
          if (near) near.prog = Math.max(0, near.prog - 0.15);
          bt.data.alert = 6; bt.data.last = p.pos.clone();
        }
      }
      // beast
      const eye = bt.pos.clone().add(new V(0, 2.2, 0)), pe = p.pos.clone().add(new V(0, 1.6, 0));
      const dd = G.dist2(bt.pos, p.pos);
      if (!G.dying && dd < 16 && G.los(eye, pe)) { if (bt.data.alert <= 0) G.sfx('alarm'); bt.data.alert = 4; bt.data.last = p.pos.clone(); }
      bt.data.alert -= dt;
      if (G.dying) G.syncNPC(bt, dt, 0);
      else if (bt.data.alert > 0 && bt.data.last) {
        const dist = G.mazeChase(M, bt, bt.data.alert > 3.5 ? p.pos : bt.data.last, 6.6, dt);
        if (dd < 1.3) G.die('被野獸抓到了！');
        if (dist < 0.6 && bt.data.alert < 3.5) bt.data.alert = 0;
      } else {
        if (!bt.data.wp || G.dist2(bt.pos, bt.data.wp) < 0.6) {
          let c, r; do { c = G.randi(1, M.W - 2); r = G.randi(1, M.H - 2); } while (!M.pass(c, r));
          bt.data.wp = M.toWorld(c, r);
        }
        G.mazeChase(M, bt, bt.data.wp, 4, dt);
      }
      // escape
      if (done >= 3) for (const e of L.exits) if (G.dist2(p.pos, e.pos) < 1.8) G.complete('成功逃離設施！🏃‍♂️');
      G.hud.prog(`💻 ${done} / 3${near ? `　駭入中 ${Math.floor(near.prog * 100)}%` : ''}${bt.data.alert > 0 ? '　👹 野獸在追你！' : ''}`);
    },
    respawn(L) { L.beast.pos.copy(L.bSpawn); L.beast.data.alert = 0; L.beast.data.wp = null; L.check = null; }
  });

  // ======================= 19. 領養寵物 (Adopt Me!) =======================
  const NEEDS = [
    { id: 'food', name: '肚子餓了', icon: '🍖', act: '餵食物' },
    { id: 'water', name: '口渴了', icon: '💧', act: '給水喝' },
    { id: 'bed', name: '想睡覺', icon: '💤', act: '帶去睡覺' },
    { id: 'tub', name: '髒髒的', icon: '🛁', act: '洗澡' },
    { id: 'ball', name: '想玩球', icon: '🎾', act: '一起玩球' },
    { id: 'park', name: '想散步', icon: '🌳', act: '在公園散步' },
  ];
  const STAGES = ['新生寶寶', '小小狗', '少年狗', '成年狗'];
  G.LEVELS.push({
    name: '領養寵物', insp: 'Adopt Me!', obj: '孵化寵物蛋，照顧牠的 6 個需求（看牠頭上的泡泡），把牠養到長大！',
    build(L) {
      G.setSky({ color: 0xa8e0ff, fog: [70, 170] });
      G.ground(100, '#8fd17a', '#84c46f');
      // house
      G.box(0, 0, 0, 24, 0.3, 18, 0xe8d3b0);
      const wc = 0xfff3e0;
      G.box(0, 0.3, -9, 24, 3.5, 0.4, wc); G.box(-12, 0.3, 0, 0.4, 3.5, 18, wc); G.box(12, 0.3, 0, 0.4, 3.5, 18, wc);
      G.box(-7.5, 0.3, 9, 9, 3.5, 0.4, wc); G.box(7.5, 0.3, 9, 9, 3.5, 0.4, wc);
      G.box(0, 0.3, -1, 0.4, 3.5, 6, wc);
      G.box(-10, 0.3, 0, 4, 3.5, 0.4, 0xffe0c0); G.box(-2, 0.3, 0, 4, 3.5, 0.4, 0xffe0c0);
      // stations
      const S = {};
      S.food = new V(8, 0.3, -6); G.box(8, 0.3, -6, 1, 0.3, 1, 0xd93636); G.mesh('sph', 0x8b5a2b, 8, 0.7, -6, 0.6, 0.3, 0.6);
      S.water = new V(10, 0.3, -6); G.box(10, 0.3, -6, 1, 0.3, 1, 0x2f7de1); G.box(10, 0.55, -6, 0.8, 0.08, 0.8, 0x7fd0ff, { solid: false });
      G.box(8, 0.3, -8.2, 6, 1.6, 1.2, 0xffffff); G.label('🍳 廚房', { pos: new V(9, 3.4, -6), scale: 0.9 });
      S.bed = new V(-9, 0.3, -5); G.box(-9, 0.3, -5, 3, 0.5, 2.2, 0x8a4fd9); G.box(-9, 0.8, -5.9, 3, 0.6, 0.4, 0xb38aff);
      G.label('🛏 臥室', { pos: new V(-9, 3.4, -5), scale: 0.9 });
      S.tub = new V(-9, 0.3, 5); G.box(-9, 0.3, 5, 3, 0.9, 1.8, 0xffffff); G.box(-9, 1.15, 5, 2.6, 0.08, 1.4, 0x7fd0ff, { solid: false });
      G.label('🛁 浴室', { pos: new V(-9, 3.4, 5), scale: 0.9 });
      S.ball = new V(6, 0, 16); G.mesh('sph', 0xd8f04a, 6, 0.4, 16, 0.7);
      S.park = new V(-8, 0, 26);
      G.box(-8, 0, 26, 3, 0.6, 1, 0x9b6a3c); G.box(-8, 0.6, 26.4, 3, 0.8, 0.2, 0x9b6a3c);
      for (let i = 0; i < 6; i++) { const x = -14 + i * 2.5, z = 30 + (i % 2) * 2; G.box(x, 0, z, 0.6, 2.4, 0.6, 0x7a4f2a); G.mesh('sph', 0x3f9e3f, x, 3.2, z, 2.6); }
      G.label('🌳 公園', { pos: new V(-8, 3, 26), scale: 1 });
      for (let x = -20; x <= 20; x += 2) if (Math.abs(x) > 3) G.box(x, 0, 21, 0.25, 1.1, 0.25, 0xffffff, { solid: false });
      L.S = S;
      // egg
      L.egg = G.mesh('sph', 0xfff0c8, 0, 1.0, 4, 1.2, 1.5, 1.2);
      for (let i = 0; i < 4; i++) G.part(L.egg, 0, -0.2 + i * 0.15, 0, 1.02, 0.05, 1.02, 0x7fd0ff);
      G.label('🥚 寵物蛋', { pos: new V(0, 2.6, 4), scale: 0.9 }).name = 'eggLabel';
      G.interact(new V(0, 0.3, 4), 2.5, '孵化寵物蛋', () => L.hatch(), () => !L.pet && !L.hatching);
      for (const n of NEEDS) {
        G.interact(S[n.id], 2.6, () => L.need && L.need.id === n.id ? `${n.icon} ${n.act}` : `${n.icon} ${n.act}（現在不需要）`, () => L.useStation(n), () => !!L.pet && !L.busy);
      }
      L.spawn.set(0, 0.3, 7); L.spawnYaw = 0;
      L.done = 0; L.order = NEEDS.slice().sort(() => Math.random() - 0.5);
      G.setButtons({ act: null, e: '照顧' });
      G.hud.prog('先去孵化寵物蛋 🥚');
    },
    update(dt, L) {
      const p = G.player;
      if (L.hatching) {
        L.ht += dt; L.egg.rotation.z = Math.sin(L.ht * 20) * 0.2 * Math.min(1, L.ht);
        if (L.ht > 2) {
          L.hatching = false; G.world.remove(L.egg); G.world.children.filter(c => c.name === 'eggLabel').forEach(c => G.world.remove(c));
          G.burst(new V(0, 1, 4), 0xfff0c8, 24); G.sfx('win');
          L.makePet(); G.hud.big('是一隻小狗！🐶', '#ffd23f', 1800); L.nextNeed();
        }
      }
      const pet = L.pet;
      if (pet) {
        let tgt;
        if (L.busy) tgt = L.busy.pos;
        else { const back = G.forward(p.yaw).multiplyScalar(-2.2); tgt = p.pos.clone().add(back).add(G.right(p.yaw).multiplyScalar(1)); }
        const d = Math.hypot(tgt.x - pet.pos.x, tgt.z - pet.pos.z);
        const sp = d > 8 ? 10 : d > 1 ? 7 : 0;
        if (sp) { pet.vel.x = (tgt.x - pet.pos.x) / d * sp; pet.vel.z = (tgt.z - pet.pos.z) / d * sp; pet.yaw = Math.atan2(tgt.x - pet.pos.x, tgt.z - pet.pos.z); }
        else { pet.vel.x *= 0.5; pet.vel.z *= 0.5; }
        G.moveEntity(pet, dt);
        if (pet.hitWall && pet.onGround) pet.vel.y = 9;
        if (d > 25) pet.pos.copy(p.pos).add(new V(1, 0.5, 1));
        pet.mesh.position.copy(pet.pos); pet.mesh.rotation.y = pet.yaw;
        const legs = pet.mesh.userData.legs, w = Math.sin(L.t * 14) * (sp ? 0.6 : 0);
        legs.forEach((l, i) => l.rotation.x = i % 2 ? w : -w);
        pet.mesh.userData.tail.rotation.z = Math.sin(L.t * 12) * 0.6;
        if (L.busy) {
          L.busy.t -= dt;
          if (L.busy.id === 'bed') pet.mesh.rotation.z = Math.PI / 2 * 0.9;
          else if (L.busy.id === 'ball') { pet.vel.y = pet.onGround ? 6 : pet.vel.y; }
          else pet.mesh.position.y = pet.pos.y + Math.abs(Math.sin(L.t * 10)) * 0.2;
          if (L.busy.t <= 0) {
            pet.mesh.rotation.z = 0; L.busy = null; L.done++; G.sfx('coin'); G.burst(pet.pos.clone().add(new V(0, 1.5, 0)), 0xffd23f, 12);
            const stage = L.done >= 6 ? 3 : L.done >= 4 ? 2 : L.done >= 2 ? 1 : 0;
            if (stage !== L.stage) { L.stage = stage; pet.mesh.scale.setScalar(0.8 + stage * 0.35); G.hud.big(`長大了！${STAGES[stage]} ⬆️`, '#5bff7a', 1600); G.sfx('win'); }
            if (L.done >= 6) { L.bubble.visible = false; G.after(1.6, () => G.complete('寵物完全長大了！🐕')); }
            else L.nextNeed();
          }
        }
        L.bubble.position.copy(pet.pos).add(new V(0, 1.6 + L.stage * 0.5, 0));
        G.hud.prog(`🐶 小汪（${STAGES[L.stage]}）　${L.done} / 6${L.need && !L.busy ? `　牠${L.need.name} ${L.need.icon}` : ''}`);
      }
    }
  });
  const lv19 = G.LEVELS[G.LEVELS.length - 1], b19 = lv19.build;
  lv19.build = function (L) {
    b19(L);
    L.stage = 0;
    L.hatch = () => { L.hatching = true; L.ht = 0; G.sfx('pop'); G.hud.toast('蛋在搖晃…'); };
    L.makePet = () => {
      const g = new THREE.Group();
      G.part(g, 0, 0.75, 0, 0.7, 0.6, 1.1, 0xd9a066); G.part(g, 0, 1.2, 0.6, 0.65, 0.6, 0.6, 0xd9a066);
      G.part(g, 0, 1.05, 0.95, 0.35, 0.25, 0.2, 0xf2d0a0); G.part(g, 0, 1.15, 1.06, 0.12, 0.1, 0.05, 0x111111);
      G.part(g, -0.16, 1.32, 0.91, 0.1, 0.12, 0.02, 0x111111); G.part(g, 0.16, 1.32, 0.91, 0.1, 0.12, 0.02, 0x111111);
      G.part(g, -0.35, 1.4, 0.55, 0.15, 0.35, 0.3, 0x8b5a2b); G.part(g, 0.35, 1.4, 0.55, 0.15, 0.35, 0.3, 0x8b5a2b);
      const legs = [];
      for (const [x, z] of [[-0.22, 0.38], [0.22, 0.38], [-0.22, -0.38], [0.22, -0.38]]) { const lg = new THREE.Group(); lg.position.set(x, 0.5, z); G.part(lg, 0, -0.25, 0, 0.2, 0.5, 0.2, 0xc98a4b); g.add(lg); legs.push(lg); }
      const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.55); G.part(tail, 0, 0.2, -0.1, 0.12, 0.45, 0.12, 0xd9a066); g.add(tail);
      g.userData.legs = legs; g.userData.tail = tail;
      g.scale.setScalar(0.8); G.world.add(g);
      L.pet = { mesh: g, pos: new V(0, 0.3, 4), vel: new V(), hw: 0.35, h: 1.2, yaw: 0, onGround: false };
      L.bubble = G.label('…', { scale: 1 });
    };
    L.nextNeed = () => {
      L.need = L.order[L.done];
      G.world.remove(L.bubble);
      L.bubble = G.label(`${L.need.icon} ${L.need.name}`, { scale: 0.9, bg: 'rgba(255,255,255,0.85)', color: '#333' });
      G.sfx('pop');
    };
    L.useStation = (n) => {
      if (!L.need || L.need.id !== n.id) { G.hud.toast(`小汪現在${L.need ? L.need.name + '，要' + L.need.act : '很開心'}`); return; }
      L.busy = { id: n.id, pos: L.S[n.id].clone(), t: 2.6 };
      G.hud.toast(`${n.icon} ${n.act}…`);
    };
  };
})();
