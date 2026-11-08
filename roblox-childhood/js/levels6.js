// New levels: 死亡鐵軌 (Dead Rails), 後室 (The Backrooms)
'use strict';
(function () {
  const V = THREE.Vector3;

  // ======================= 死亡鐵軌 (Dead Rails) =======================
  const END = 1200;
  G.LEVELS.push({
    name: '死亡鐵軌', insp: 'Dead Rails', obj: `開火車穿過殭屍荒野，抵達 ${END} 公尺外的終點站！撿煤炭和木頭丟進鍋爐當燃料，用槍保護自己。`,
    ctrl: 'WASD 移動・滑鼠 瞄準・左鍵 開槍・右鍵 瞄準・R 換彈・E 撿東西 / 丟進鍋爐 / 拉操縱桿',
    ctrlTouch: '左邊搖桿移動・右邊拖曳瞄準・「射擊」・「瞄準」・E 撿東西 / 鍋爐 / 操縱桿',
    build(L) {
      G.setSky({ color: 0x1a1a33, fog: [25, 130], fogColor: 0x1a1a33, sun: 0.25, hemi: 0.55, hemiSky: 0x8a9acc, hemiGround: 0x4a3a2a });
      G.cam.mode = 'first';
      G.sun.color.setHex(0xaab8ff);
      // ground, rails, sleepers
      G.box(0, -1, -END / 2, 240, 1, END + 140, 0xc9a66b);
      const tex = G.canvasTex(64, 64, (g) => { g.fillStyle = '#9a8a70'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#5a3b22'; g.fillRect(0, 20, 64, 24); });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, (END + 100) / 2);
      const sl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, END + 100), new THREE.MeshLambertMaterial({ map: tex }));
      sl.position.set(0, 0.05, -END / 2 + 20); sl.userData.noHit = true; G.world.add(sl);
      G.box(-0.8, 0.1, -END / 2 + 20, 0.12, 0.15, END + 100, 0x8a8f99, { solid: false }); G.box(0.8, 0.1, -END / 2 + 20, 0.12, 0.15, END + 100, 0x8a8f99, { solid: false });
      const moon = G.mesh('sph', 0xfff6d0, 60, 70, -200, 14, undefined, undefined, { basic: true, noShadow: true }); moon.userData.noHit = true;
      // scenery
      for (let i = 0; i < 140; i++) {
        const side = Math.random() < 0.5 ? -1 : 1, x = side * G.rand(14, 90), z = G.rand(-END - 40, 30);
        const t = Math.random();
        if (t < 0.4) { G.box(x, 0, z, 0.7, 3, 0.7, 0x3f7a3a, { solid: false }); G.box(x - 0.6, 1.2, z, 0.5, 0.3, 0.4, 0x3f7a3a, { solid: false }); G.box(x - 0.8, 1.2, z, 0.3, 1, 0.3, 0x3f7a3a, { solid: false }); }
        else if (t < 0.7) G.box(x, 0, z, G.rand(1, 4), G.rand(0.6, 2.5), G.rand(1, 4), 0x8a7a6a, { solid: false });
        else { G.box(x, 0, z, 0.4, 3.5, 0.4, 0x4a3a2a, { solid: false }); const b = G.mesh('box', 0x4a3a2a, x + 0.6, 2.6, z, 1.6, 0.2, 0.2); b.rotation.z = 0.6; }
      }
      // towns
      L.towns = [-300, -650, -1000];
      L.towns.forEach((tz, ti) => {
        for (let k = 0; k < 4; k++) for (const side of [-1, 1]) {
          const x = side * G.rand(9, 14), z = tz + k * 12 - 18;
          G.box(x, 0, z, 6, 4.5, 8, [0x8b5a2b, 0x9b6a3c, 0x7a4f2a][k % 3]); G.box(x, 4.5, z, 6.8, 0.5, 8.8, 0x4a3a2a);
          G.box(x - side * 3.05, 0, z, 0.2, 2.6, 1.6, 0x3a2a1a, { solid: false });
        }
        G.label(['🏚 塵土鎮', '🏚 枯骨鎮', '🏚 最後小鎮'][ti], { pos: new V(0, 7, tz - 25), scale: 1.6 });
      });
      // finish station
      G.box(-7, 0, -END - 6, 8, 1, 30, 0x8a8f99); G.box(-7, 5, -END - 6, 9, 0.4, 30, 0xb83a3a, { solid: false });
      for (let i = 0; i < 4; i++) G.box(-10, 1, -END + 6 - i * 8, 0.4, 4, 0.4, 0x5a3b22, { solid: false });
      G.label('🏁 終點站・墨西哥', { pos: new V(0, 9, -END - 6), scale: 2.4 });
      // ---------- train ----------
      L.tz = 0; L.tv = 0; L.go = false; L.fuel = 60;
      L.cars = [];
      const car = (offZ, color, kind) => {
        const g = new THREE.Group(); G.world.add(g);
        const c = { off: offZ, g, cols: [] };
        const col = (x, y, z, w, h, d, clr) => { const m = G.box(x, y, offZ + z, w, h, d, clr, { moving: true }); c.cols.push({ c: m.userData.col, x, y: y + h / 2, z }); return m; };
        col(0, 1.0, 0, 4, 0.4, 11, color);
        col(-2.1, 1.4, 0, 0.2, 1.0, 9.6, 0x3a2a1a); col(2.1, 1.4, 0, 0.2, 1.0, 9.6, 0x3a2a1a);
        for (const z of [-3.5, 3.5]) for (const x of [-1.3, 1.3]) { const w = G.mesh('cyl', 0x222222, x, 0.55, z, 1.1, 0.3, 1.1, { parent: g }); w.rotation.z = Math.PI / 2; }
        G.part(g, 0, 0.75, 0, 3, 0.3, 9, 0x2a2a2a);
        if (kind === 'engine') {
          const boiler = G.mesh('cyl', 0x2a2a2a, 0, 2.6, -1.5, 2.6, 5, 2.6, { parent: g }); boiler.rotation.x = Math.PI / 2;
          G.mesh('cyl', 0x1a1a1a, 0, 4.4, -3.2, 0.8, 1.6, 0.8, { parent: g }); G.part(g, 0, 2.6, 2.5, 3.8, 2.6, 0.2, 0x5a1a1a);
          G.part(g, 0, 4.0, 3.2, 4.2, 0.2, 2.4, 0x3a1a1a);
          const lamp = G.part(g, 0, 2.6, -4.2, 0.8, 0.8, 0.2, 0xfff6a0, { emissive: 0xffee88 });
          L.furnace = G.part(g, 0, 1.9, 1.8, 1.2, 1, 0.6, 0x3a3a3a); L.fire = G.part(g, 0, 1.9, 1.48, 0.8, 0.5, 0.05, 0xff6a1a, { emissive: 0xff4400 });
          L.lever = G.part(g, 1.4, 2.0, 3.0, 0.1, 0.9, 0.1, 0xd93636); L.lever.rotation.x = 0.5;
          L.headlight = new THREE.PointLight(0xfff0c0, 1.6, 40); L.headlight.position.set(0, 2.6, -6); g.add(L.headlight);
          G.part(g, 0, 0.9, -5.3, 3.2, 0.8, 1.2, 0x5a5a5a);
          c.label = G.label('🚂 火車頭', { parent: g, scale: 0.8 }); c.label.position.set(0, 5.5, 0);
        } else if (kind === 'coal') {
          G.part(g, 0, 1.6, 0, 3.6, 0.6, 8, 0x111111);
        } else {
          G.part(g, 0, 3.6, 0, 4.2, 0.2, 9.8, 0x6b2a1a); for (const z of [-4.6, 4.6]) for (const x of [-1.9, 1.9]) G.part(g, x, 2.4, z, 0.2, 2.2, 0.2, 0x3a2a1a);
        }
        L.cars.push(c); return c;
      };
      car(-11, 0x5a1a1a, 'engine'); car(0, 0x6b4426, 'coal'); car(11, 0x7a4f2a, 'caboose');
      L.engine = L.cars[0];
      L.trainPt = (dz, y = 1.4) => new V(0, y, L.tz + dz);
      G.interact(() => L.trainPt(-11 + 3.0), 2.4, () => !L.go ? (L.fuel > 0 ? '拉操縱桿：開車 🚂' : '沒有燃料了！') : '拉操縱桿：停車 🛑', () => {
        if (!L.go && L.fuel <= 0) { G.hud.toast('鍋爐沒燃料了！去撿煤炭或木頭'); return; }
        L.go = !L.go; G.sfx('click'); L.lever.rotation.x = L.go ? -0.5 : 0.5; G.hud.toast(L.go ? '火車出發！' : '火車停下來了');
      });
      G.interact(() => L.trainPt(-11 + 1.8), 2.2, () => L.carry ? `把${L.carry.name}丟進鍋爐` : `鍋爐（燃料 ${Math.round(L.fuel)}%）`, () => {
        if (!L.carry) { G.hud.toast('先去撿煤炭或木頭來燒'); return; }
        L.fuel = Math.min(100, L.fuel + L.carry.fuel); G.sfx('pop'); G.burst(L.trainPt(-11 + 1.5, 2), 0xff8a1a, 12);
        G.camera.remove(L.carry.held); L.carry = null;
      });
      // fuel items along the track
      L.items = [];
      const item = (x, z, type) => {
        const g = new THREE.Group(); const coal = type === 'coal';
        if (coal) { G.part(g, 0, 0.35, 0, 0.9, 0.7, 0.6, 0x5a4a3a); G.part(g, 0, 0.75, 0, 0.7, 0.2, 0.5, 0x111111); }
        else { G.part(g, 0, 0.4, 0, 1, 0.8, 1, 0x9b6a3c); G.part(g, 0, 0.4, 0, 1.02, 0.12, 1.02, 0x6b4426); G.part(g, 0, 0.4, 0, 0.12, 0.82, 1.02, 0x6b4426); }
        g.position.set(x, 0, z); G.world.add(g);
        const it = { g, name: coal ? '煤炭' : '木箱', fuel: coal ? 30 : 18, taken: false, coal };
        L.items.push(it);
        G.interact(g.position, 2.2, `撿起${it.name}`, () => {
          if (L.carry) { G.hud.toast('手上已經有東西了'); return; }
          it.taken = true; g.visible = false; L.carry = it; G.sfx('pop');
          const held = new THREE.Group(); G.part(held, 0, 0, 0, 0.5, 0.4, 0.4, coal ? 0x111111 : 0x9b6a3c, { noShadow: true });
          held.position.set(-0.35, -0.35, -0.8); held.traverse(o => o.userData.noHit = true); G.camera.add(held); it.held = held;
          G.hud.toast('拿回火車頭的鍋爐！');
        }, () => !it.taken);
      };
      for (let z = -20; z > -END + 20; z -= G.rand(18, 30)) item((Math.random() < 0.5 ? -1 : 1) * G.rand(4, 9), z, Math.random() < 0.45 ? 'coal' : 'crate');
      for (const tz of L.towns) for (let k = 0; k < 4; k++) item(G.rand(-6, 6), tz + G.rand(-20, 20), 'coal');
      // shotgun pickup in the first town
      L.sg = new THREE.Group(); const sgm = G.gunModel('shotgun'); sgm.rotation.y = Math.PI / 2; L.sg.add(sgm); L.sg.position.set(5, 1, L.towns[0]); G.world.add(L.sg);
      G.label('霰彈槍', { pos: new V(5, 2.2, L.towns[0]), scale: 0.8 });
      G.interact(L.sg.position, 2.4, '撿起霰彈槍', () => {
        L.sg.visible = false; L.w = L.guns.shotgun; G.fps.makeGun('shotgun', 0xd9a066); L.mag = L.w.mag; G.sfx('coin'); G.hud.toast('拿到霰彈槍！');
      }, () => L.sg.visible);
      L.guns = {
        revolver: { name: '左輪手槍', kind: 'revolver', rate: 0.45, dmg: 45, spread: 0.012, adsSpread: 0.002, mag: 6, reloadT: 1.6, auto: false, kick: 0.09, recoil: 0.02 },
        shotgun: { name: '霰彈槍', kind: 'shotgun', rate: 0.8, dmg: 18, pellets: 8, spread: 0.06, adsSpread: 0.035, mag: 5, reloadT: 1.8, auto: false, range: 40, kick: 0.14, recoil: 0.03 },
      };
      L.w = L.guns.revolver; L.mag = 6; L.reload = 0;
      G.fps.makeGun('revolver', 0xd9a066);
      L.zombies = []; L.nextSpawn = -50;
      L.pl = new THREE.PointLight(0xffe6c0, 0.7, 14); G.world.add(L.pl);
      G.hud.cross(true); G.hud.hp(true);
      G.setButtons({ act: '射擊', e: 'E', f: '瞄準' });
      L.spawn.set(0, 1.45, 11); L.spawnYaw = 0;
      L.killY = -10;
    },
    update(dt, L) {
      const p = G.player;
      // train motion
      const target = L.go && L.fuel > 0 ? 12 : 0;
      L.tv = G.lerp(L.tv, target, Math.min(1, dt * (target > L.tv ? 0.5 : 1.2)));
      if (L.tv < 0.05 && target === 0) L.tv = 0;
      if (L.tz <= -END + 10) { L.tz = -END + 10; L.tv = 0; L.go = false; }
      L.tz -= L.tv * dt;
      if (L.tv > 0.1) L.fuel = Math.max(0, L.fuel - dt * 1.4 * (L.tv / 12));
      if (L.fuel <= 0 && L.go) { L.go = false; L.lever.rotation.x = 0.5; G.hud.toast('燃料用完了！火車慢慢停下來…'); }
      for (const c of L.cars) { c.g.position.z = L.tz + c.off; for (const k of c.cols) G.moveCol(k.c, k.x, k.y, L.tz + c.off + k.z); }
      L.fire.scale.setScalar(0.2 + L.fuel / 100); L.fire.position.z = 1.48;
      L.pl.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z);
      // gun
      G.fps.tick(dt, L.w);
      if (G.in.actP && !G.dying) G.fps.fire(L.w);
      // zombies
      while (L.tz - 60 < L.nextSpawn && L.nextSpawn > -END + 40) {
        const inTown = L.towns.some(t => Math.abs(t - L.nextSpawn) < 30);
        const n = inTown ? 5 : G.randi(2, 3);
        for (let i = 0; i < n && L.zombies.filter(z => z.alive).length < 12; i++) {
          const z = G.makeNPC({ skin: 0x7fae6a, shirt: G.pick([0x5a4a3a, 0x3a4a5a, 0x6a3a3a]), pants: 0x2a2a2a, face: 'scary', hp: 70, bar: true, pos: new V((Math.random() < 0.5 ? -1 : 1) * G.rand(8, 20), 0, L.nextSpawn + G.rand(-10, 10)) });
          z.mesh.userData.armPose = true; z.mesh.userData.P.aL.rotation.x = -1.5; z.mesh.userData.P.aR.rotation.x = -1.5;
          z.data = { cd: 0, sp: G.rand(4.6, 6) };
          L.zombies.push(z);
        }
        L.nextSpawn -= G.rand(55, 75);
      }
      for (const z of L.zombies) {
        if (!z.alive) continue;
        z.data.cd -= dt;
        const d = G.dist2(z.pos, p.pos);
        if (d > 90 && z.pos.z > p.pos.z + 40) { G.removeNPC(z); continue; }
        G.npcSeek(z, p.pos, z.data.sp, dt, { stop: 1.1, noJump: true });
        if (z.hitWall && z.onGround) z.vel.y = 12.5;
        if (d < 1.7 && Math.abs(z.pos.y - p.pos.y) < 1.6 && z.data.cd <= 0 && !G.dying) { z.data.cd = 1; G.damage(10); G.sfx('hit'); }
      }
      L.zombies = L.zombies.filter(z => z.alive || z.mesh.visible);
      // left behind?
      if (G.dist2(p.pos, L.trainPt(0)) > 70 && !G.dying) G.die('被火車丟下了…');
      const dist = Math.min(END, Math.floor(-L.tz));
      if (dist >= END - 12 && G.dist2(p.pos, L.trainPt(0)) < 20) G.complete('抵達終點站！🚂🏁');
      G.hud.prog(`🚂 ${dist} / ${END} 公尺　${L.go ? '行駛中' : '停車中'}`);
      G.hud.extra(`<span class="pill">🔥 燃料 ${Math.round(L.fuel)}%</span><br><span class="pill">🖐 ${L.carry ? L.carry.name : '空手'}</span>`);
    },
    respawn(L) {
      G.player.pos.copy(L.trainPt(11, 1.45));
      L.mag = L.w.mag; L.reload = 0;
      for (const z of L.zombies) if (z.alive && G.dist2(z.pos, G.player.pos) < 10) z.pos.x += z.pos.x < 0 ? -10 : 10;
      if (L.carry) { G.camera.remove(L.carry.held); L.carry.taken = false; L.carry.g.visible = true; L.carry = null; }
    },
    cleanup(L) { if (L.carry && L.carry.held) G.camera.remove(L.carry.held); G.sun.color.setHex(0xffffff); }
  });

  // ======================= 後室 (The Backrooms) =======================
  function genBackrooms(N) {
    const g = []; for (let r = 0; r < N; r++) g.push(Array(N).fill('#'));
    const st = [[1, 1]]; g[1][1] = '.';
    while (st.length) {
      const [c, r] = st[st.length - 1];
      const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dc, dr]) => [c + dc, r + dr, c + dc / 2, r + dr / 2]).filter(([nc, nr]) => nc > 0 && nr > 0 && nc < N - 1 && nr < N - 1 && g[nr][nc] === '#');
      if (!nb.length) { st.pop(); continue; }
      const [nc, nr, wc, wr] = nb[Math.floor(Math.random() * nb.length)];
      g[wr][wc] = '.'; g[nr][nc] = '.'; st.push([nc, nr]);
    }
    // open it up: knock out many inner walls so it feels like endless rooms
    for (let r = 1; r < N - 1; r++) for (let c = 1; c < N - 1; c++) if (g[r][c] === '#' && ((r % 2) !== (c % 2)) && Math.random() < 0.38) g[r][c] = '.';
    // a few big open halls
    for (let k = 0; k < 4; k++) { const c0 = G.randi(2, N - 6), r0 = G.randi(2, N - 6); for (let r = r0; r < r0 + 3; r++) for (let c = c0; c < c0 + 3; c++) g[r][c] = '.'; }
    // pillars
    for (let r = 2; r < N - 1; r += 2) for (let c = 2; c < N - 1; c += 2) if (g[r][c] === '.' && Math.random() < 0.15) g[r][c] = '#';
    g[1][1] = 'S'; g[1][2] = '.'; g[2][1] = '.';
    g[N - 2][N - 1] = 'X'; g[N - 2][N - 2] = '.'; g[N - 3][N - 2] = '.'; g[N - 2][N - 3] = '.';
    return g.map(r => r.join(''));
  }
  G.LEVELS.push({
    name: '後室', insp: 'The Backrooms', obj: '你掉進了黃色的無盡房間…找到 3 瓶杏仁水，出口才會打開！小心在黑暗中微笑的東西。',
    ctrl: 'WASD 移動・按住 Shift 跑步・滑鼠 看・E 撿杏仁水',
    ctrlTouch: '左邊搖桿移動・按住「跑」・E 撿杏仁水',
    build(L) {
      G.setSky({ color: 0x2a2614, fog: [6, 46], fogColor: 0x3a3418, sun: 0.0, hemi: 0.95, hemiSky: 0xfff2b0, hemiGround: 0x6a5a2a });
      G.cam.mode = 'first';
      const N = 23, cs = 4;
      let rows, M;
      // make sure the exit and bottles are reachable
      for (let tries = 0; tries < 20; tries++) {
        rows = genBackrooms(N);
        const test = { rows: rows.map(r => r.split('')) };
        const ok = (() => { const seen = {}, q = [[1, 1]]; seen['1,1'] = 1; while (q.length) { const [c, r] = q.shift(); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= N || nr >= N || seen[nc + ',' + nr] || test.rows[nr][nc] === '#') continue; seen[nc + ',' + nr] = 1; q.push([nc, nr]); } } return seen[(N - 2) + ',' + (N - 2)]; })();
        if (ok) break;
      }
      const wall = G.canvasTex(128, 128, (g) => {
        g.fillStyle = '#d9c46a'; g.fillRect(0, 0, 128, 128);
        for (let x = 0; x < 128; x += 16) { g.fillStyle = 'rgba(160,140,60,0.35)'; g.fillRect(x, 0, 3, 128); }
        for (let y = 8; y < 128; y += 32) for (let x = 8; x < 128; x += 32) { g.fillStyle = 'rgba(150,130,50,0.3)'; g.fillRect(x, y, 6, 10); }
        g.fillStyle = 'rgba(90,80,30,0.5)'; g.fillRect(0, 118, 128, 10);
      });
      const carpet = G.canvasTex(64, 64, (g) => { g.fillStyle = '#9a8a4a'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 300; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(80,70,30,0.25)' : 'rgba(200,180,100,0.2)'; g.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); } });
      carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(N * 2, N * 2);
      const wm = new THREE.MeshLambertMaterial({ map: wall }); wm.userData.shared = false;
      const fm = new THREE.MeshLambertMaterial({ map: carpet });
      M = L.M = G.maze(rows, cs, { wallH: 4, wallMat: wm, floorMat: fm, noMerge: true });
      G.box(0, 4, 0, N * cs, 0.3, N * cs, 0xe8e0c0, { solid: false });
      // ceiling lights (some broken)
      L.lights = [];
      for (let r = 1; r < N - 1; r += 2) for (let c = 1; c < N - 1; c += 2) {
        if (!M.pass(c, r) && M.at(c, r) !== 'S') continue;
        const p = M.toWorld(c, r); const broken = Math.random() < 0.18;
        const m = G.box(p.x, 3.9, p.z, 1.6, 0.08, 0.7, broken ? 0x555544 : 0xffffff, { emissive: broken ? 0 : 0xfff6d0, solid: false, noShadow: true });
        L.lights.push({ m, broken, flick: Math.random() < 0.15 });
      }
      L.pl = new THREE.PointLight(0xfff2c0, 1.1, 16, 1.4); G.world.add(L.pl);
      const S = M.find('S')[0]; L.spawn.copy(M.toWorld(S[0], S[1])); L.spawnYaw = -Math.PI / 2;
      const X = M.find('X')[0]; M.block[X[0] + ',' + X[1]] = true; L.exitCell = X; L.exitPos = M.toWorld(X[0], X[1]);
      L.exitDoor = G.box(L.exitPos.x, 0, L.exitPos.z, 0.6, 3.2, 4, 0x6b4426);
      L.exitSign = G.label('EXIT 🔒', { pos: L.exitPos.clone().add(new V(-1, 3.4, 0)), scale: 0.9, color: '#5bff7a' });
      // almond water bottles far from start
      const cells = []; for (let r = 1; r < N - 1; r++) for (let c = 1; c < N - 1; c++) if (M.pass(c, r) && Math.hypot(c - 1, r - 1) > 8) cells.push([c, r]);
      L.bottles = [];
      for (let i = 0; i < 3; i++) {
        const [c, r] = cells.splice(Math.floor(Math.random() * cells.length), 1)[0];
        const p = M.toWorld(c, r);
        const g = new THREE.Group(); G.mesh('cyl', 0xe8f4ff, 0, 0.45, 0, 0.32, 0.8, 0.32, { parent: g, opacity: 0.8 }); G.part(g, 0, 0.9, 0, 0.14, 0.12, 0.14, 0x2f7de1); G.part(g, 0, 0.45, 0.17, 0.2, 0.25, 0.01, 0xfff3d6);
        g.position.copy(p); G.world.add(g);
        const lt = new THREE.PointLight(0x9fd0ff, 0.6, 6); lt.position.set(p.x, 1.2, p.z); G.world.add(lt);
        const b = { g, lt, got: false };
        L.bottles.push(b);
        G.interact(p, 2.2, '撿起杏仁水 💧', () => { b.got = true; g.visible = false; lt.intensity = 0; G.sfx('coin'); L.got++; G.hud.toast(`杏仁水 ${L.got} / 3`); if (L.got >= 3) L.openExit(); }, () => !b.got);
      }
      // the smiler
      const sm = new THREE.Group();
      G.mesh('sph', 0x050505, 0, 1.8, 0, 1.4, 2.2, 1.0, { parent: sm, noShadow: true });
      G.part(sm, -0.25, 2.3, 0.48, 0.16, 0.1, 0.05, 0xffffff, { emissive: 0xffffff, noShadow: true }); G.part(sm, 0.25, 2.3, 0.48, 0.16, 0.1, 0.05, 0xffffff, { emissive: 0xffffff, noShadow: true });
      for (let i = -3; i <= 3; i++) { const t = G.part(sm, i * 0.1, 1.85 - (3 - Math.abs(i)) * 0.03, 0.5, 0.07, 0.12, 0.04, 0xffffff, { emissive: 0xffffff, noShadow: true }); }
      const far = cells.filter(([c, r]) => Math.hypot(c - 1, r - 1) > 12);
      const [ec, er] = G.pick(far.length ? far : cells);
      const ent = G.makeNPC({ mesh: sm, pos: M.toWorld(ec, er) });
      ent.untargetable = true; ent.noPush = true;
      ent.data = { home: M.toWorld(ec, er), wp: null, alert: 0, last: null };
      L.ent = ent;
      L.got = 0; L.stam = 100;
      G.setButtons({ act: null, e: 'E', f: '跑' });
      G.hud.prog('💧 杏仁水 0 / 3');
    },
    start(L) { L.hum = G.drone(118, 0.012); G.hud.toast('嗡嗡嗡……日光燈的聲音一直響著', 3000); },
    cleanup(L) { if (L.hum) L.hum.stop(); },
    update(dt, L) {
      const p = G.player, M = L.M, e = L.ent;
      const run = (G.in.keys.ShiftLeft || G.in.keys.ShiftRight || G.in.fH) && L.stam > 0 && Math.hypot(G.in.move.x, G.in.move.z) > 0.1;
      if (run) L.stam -= 22 * dt; else L.stam = Math.min(100, L.stam + 14 * dt);
      p.speed = run ? 10.5 : 7;
      L.pl.position.set(p.pos.x, 3.2, p.pos.z);
      for (const l of L.lights) if (l.flick) l.m.visible = Math.random() > 0.08;
      // entity
      const eye = e.pos.clone().add(new V(0, 2, 0)), pe = p.pos.clone().add(new V(0, 1.6, 0));
      const d = G.dist2(e.pos, p.pos);
      if (!G.dying && d < 20 && G.los(eye, pe)) { if (e.data.alert <= 0) { G.sfx('alarm'); G.hud.big('它看到你了！快跑！', '#ff5a5a', 1200); } e.data.alert = 4; e.data.last = p.pos.clone(); }
      e.data.alert -= dt;
      if (G.dying) G.syncNPC(e, dt, 0);
      else if (e.data.alert > 0) {
        G.mazeChase(M, e, e.data.alert > 3.3 ? p.pos : e.data.last, 6.6, dt);
        if (d < 1.4) G.die('被微笑怪抓到了…');
      } else {
        if (!e.data.wp || G.dist2(e.pos, e.data.wp) < 0.7) { let c, r; do { c = G.randi(1, M.W - 2); r = G.randi(1, M.H - 2); } while (!M.pass(c, r)); e.data.wp = M.toWorld(c, r); }
        G.mazeChase(M, e, e.data.wp, 3.6, dt);
      }
      if (L.open && G.dist2(p.pos, L.exitPos) < 1.8) G.complete('逃出後室了！🚪');
      // proximity dread
      if (G.L.hum && G.L.hum.gain) G.L.hum.gain.gain.value = 0.012 + Math.max(0, (14 - d) / 14) * 0.03;
      G.hud.prog(`💧 杏仁水 ${L.got} / 3${L.open ? '　🟢 出口打開了！' : ''}`);
      G.hud.extra(`<span class="pill">🏃 體力 ${Math.round(L.stam)}</span>${d < 12 ? '<br><span class="pill" style="color:#ff6060">😃 附近有東西…</span>' : ''}`);
    },
    respawn(L) {
      const e = L.ent; e.pos.copy(e.data.home); e.data.alert = 0; e.data.wp = null; L.stam = 100;
    }
  });
  const lvB = G.LEVELS[G.LEVELS.length - 1], bB = lvB.build;
  lvB.build = function (L) {
    bB(L);
    L.openExit = () => {
      L.open = true; G.removeCol(L.exitDoor.userData.col); L.exitDoor.visible = false; delete L.M.block[L.exitCell[0] + ',' + L.exitCell[1]];
      G.world.remove(L.exitSign); G.label('EXIT 🟢', { pos: L.exitPos.clone().add(new V(-1, 3.4, 0)), scale: 0.9, color: '#5bff7a' });
      const gl = new THREE.PointLight(0x5bff7a, 1.5, 12); gl.position.copy(L.exitPos).setY(2); G.world.add(gl);
      G.sfx('win'); G.hud.big('出口打開了！在最遠的角落！', '#5bff7a', 2000);
    };
  };

  // keep 領養寵物 as the final level
  const ai = G.LEVELS.findIndex(l => l.name === '領養寵物');
  if (ai >= 0) G.LEVELS.push(G.LEVELS.splice(ai, 1)[0]);
})();
