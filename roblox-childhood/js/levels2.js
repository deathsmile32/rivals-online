// Levels 6–10: 謀殺之謎, 小鎮生活, 果實海賊, 門, 天災求生
'use strict';
(function () {
  const V = THREE.Vector3;

  // ======================= 6. 謀殺之謎 (Murder Mystery 2) =======================
  const NAMES = ['小明', '阿華', '小美', '阿傑', '小芳', '大雄', '阿凱', '小琪'];
  const SHIRTS = [0xff4b4b, 0x2fd06a, 0xff8ad8, 0x2f7de1, 0xffd23f, 0xff8a1a, 0x8a4fd9, 0x2fb3b3];
  G.LEVELS.push({
    name: '謀殺之謎', insp: 'Murder Mystery 2', obj: '你是警長！有一個人是殺手，觀察誰拿出刀子，然後射他。射錯人就失敗！',
    ctrl: 'WASD 移動・滑鼠 瞄準・左鍵 開槍（每發要等 1 秒）・空白鍵 跳',
    ctrlTouch: '左邊搖桿移動・右邊拖曳瞄準・按「開槍」射擊',
    build(L) {
      G.setSky({ color: 0x2a2238, fog: [30, 80], sun: 0.4, hemi: 0.9, hemiSky: 0xfff0dd });
      G.cam.mode = 'first';
      G.ground(60, '#6e4b33', '#634330');
      const wc = 0xd9c7a0;
      G.box(0, 0, -15, 38, 5, 1, wc); G.box(0, 0, 15, 38, 5, 1, wc); G.box(-19, 0, 0, 1, 5, 30, wc); G.box(19, 0, 0, 1, 5, 30, wc);
      // partial walls (rooms with wide doorways)
      G.box(-7, 0, -10, 1, 5, 9, wc); G.box(-7, 0, 10, 1, 5, 9, wc); G.box(7, 0, -10, 1, 5, 9, wc); G.box(7, 0, 10, 1, 5, 9, wc);
      G.box(-14, 0, 0, 9, 5, 1, wc); G.box(14, 0, 0, 9, 5, 1, wc);
      // furniture
      const F = [[0, 0, 4, 1, 2, 0x8b5a2b], [-13, -9, 4, 1, 1.6, 0x3b5bdb], [13, 9, 4, 1, 1.6, 0xd93636], [-13, 9, 1, 2.5, 4, 0x6b4426], [13, -9, 1, 2.5, 4, 0x6b4426], [-3, 8, 2, 0.9, 2, 0x8b5a2b], [3, -8, 2, 0.9, 2, 0x8b5a2b], [10, -4, 1.4, 1.4, 1.4, 0x2fd06a], [-10, 4, 1.4, 1.4, 1.4, 0x2fd06a]];
      for (const f of F) G.box(f[0], 0, f[1], f[2], f[3], f[4], f[5]);
      G.box(0, 4.6, 0, 3, 0.2, 3, 0xffffff, { emissive: 0xffeeaa, solid: false });
      L.light = new THREE.PointLight(0xffe2b0, 0.9, 40); L.light.position.set(0, 4, 0); G.world.add(L.light);
      L.spawn.set(0, 0, 12); L.spawnYaw = 0;
      L.w = { name: '警長左輪', rate: 1.0, dmg: 999, spread: 0, range: 120 };
      G.fps.makeGun(0x8a6d3b, 0.55);
      G.hud.cross(true);
      G.setButtons({ act: '開槍', e: null });
      L.reset = () => {
        (L.people || []).forEach(n => G.removeNPC(n));
        L.people = []; L.killed = 0; L.phase = 'calm'; L.hunt = G.rand(6, 9);
        const mi = G.randi(0, NAMES.length - 1);
        NAMES.forEach((nm, i) => {
          const n = G.makeNPC({ name: nm, shirt: SHIRTS[i], pants: 0x333333, skin: [0xffd23f, 0xf2c48d, 0xc68642, 0xffe0bd][i % 4], pos: L.randPt() });
          const knife = G.part(n.mesh.userData.P.aR, 0, -0.95, 0.18, 0.07, 0.55, 0.14, 0xe8e8e8); G.part(knife, 0, 0.6, 0, 1.4, 0.3, 1.2, 0x222222);
          knife.visible = false;
          n.data = { murderer: i === mi, knife, wp: L.randPt(), stuck: 0 };
          n.onDeath = () => {
            if (L.ended) return;
            if (n.data.murderer && n.data.byPlayer) { L.ended = true; G.after(0.6, () => G.complete('抓到殺手了！🕵️')); }
          };
          L.people.push(n);
        });
        L.murderer = L.people[mi]; L.ended = false;
        G.hud.prog('找出殺手！');
      };
      L.randPt = () => {
        for (let k = 0; k < 40; k++) {
          const p = new V(G.rand(-17, 17), 0, G.rand(-13, 13)); let ok = true;
          for (const c of G.cols) if (c.max.y > 0.1 && p.x > c.min.x - 1 && p.x < c.max.x + 1 && p.z > c.min.z - 1 && p.z < c.max.z + 1) { ok = false; break; }
          if (ok) return p;
        }
        return new V(0, 0, 8);
      };
    },
    start(L) { L.reset(); },
    update(dt, L) {
      G.fps.tick(dt, L.w);
      if (G.in.actP && !G.dying && L.fireCd <= 0) {
        L.fireCd = L.w.rate; G.sfx('shoot');
        if (L.gunModel) L.gunModel.position.z = -0.4;
        const r = G.camRay(120);
        G.tracer(G.camera.localToWorld(new V(0.32, -0.25, -1)), r.point, 0xffee88);
        if (r.npc && r.npc.alive) {
          if (r.npc.data.murderer) { r.npc.data.byPlayer = true; G.hitNPC(r.npc, 999); G.hud.hitmark(); }
          else { G.hitNPC(r.npc, 999); G.die(`${r.npc.name}是無辜的！你射錯人了`); }
        }
      }
      const M = L.murderer; if (!M || L.ended) return;
      const victims = L.people.filter(n => n.alive && !n.data.murderer);
      for (const n of L.people) {
        if (!n.alive || n === M) continue;
        const d = G.npcSeek(n, n.data.wp, 3.2, dt, { noJump: true });
        if (d < 1 || n.hitWall) { n.data.stuck += dt; if (d < 1 || n.data.stuck > 1) { n.data.wp = L.randPt(); n.data.stuck = 0; } }
      }
      // murderer brain
      L.hunt -= dt;
      const goPlayer = L.killed >= 3 || victims.length === 0;
      if (L.phase === 'calm') {
        const d = G.npcSeek(M, M.data.wp, 3.2, dt, { noJump: true });
        if (d < 1 || M.hitWall) M.data.wp = L.randPt();
        if (L.hunt <= 0) { L.phase = 'hunt'; L.target = goPlayer ? 'player' : G.pick(victims); }
      } else if (L.phase === 'hunt') {
        if (L.target !== 'player' && !L.target.alive) L.target = goPlayer ? 'player' : G.pick(victims);
        const tp = L.target === 'player' ? G.player.pos : L.target.pos;
        const d = G.npcSeek(M, tp, L.target === 'player' ? 6.3 : 5.2, dt);
        const show = d < 6;
        M.data.knife.visible = show; M.mesh.userData.armPose = show; if (show) M.mesh.userData.P.aR.rotation.x = -2.4;
        if (d < 1.4) {
          if (L.target === 'player') { if (!G.dying) G.die('你被殺手刺中了！'); }
          else {
            G.killNPC(L.target); L.killed++; G.sfx('alarm');
            G.hud.toast(`😱 ${L.target.name}被殺了！誰拿著刀？`, 2600);
            L.phase = 'after'; L.after = 1.4;
            G.hud.prog(`剩下 ${victims.length - 1} 個無辜的人`);
          }
        }
      } else if (L.phase === 'after') {
        L.after -= dt; G.syncNPC(M, dt, 0);
        if (L.after <= 0) {
          L.phase = 'calm'; L.hunt = G.rand(7, 10); M.data.knife.visible = false; M.mesh.userData.armPose = false; M.data.wp = L.randPt();
          if (L.killed >= 3) G.hud.toast('殺手要來找你了！快射他！', 2600);
        }
      }
    },
    respawn(L) { L.reset(); }
  });

  // ======================= 7. 小鎮生活 (Brookhaven) =======================
  G.LEVELS.push({
    name: '小鎮生活', insp: 'Brookhaven RP', obj: '去披薩店拿披薩，再送到 3 戶人家！可以按 E 上車開車。',
    ctrl: 'WASD 移動 / 開車・E 上車 下車・滑鼠 轉視角',
    build(L) {
      G.setSky({ color: 0x9ad7ff, fog: [80, 200] });
      G.ground(160, '#7cc46a', '#74b862');
      const road = 0x3c3f47;
      for (const x of [-30, 0, 30]) G.box(x, -0.98, 0, 8, 1, 150, road, { solid: false });
      for (const z of [-40, 0, 40]) G.box(0, -0.97, z, 150, 1, 8, road, { solid: false });
      for (let z = -70; z < 70; z += 6) for (const x of [-30, 0, 30]) G.box(x, 0.03, z, 0.3, 0.02, 2.5, 0xffffff, { solid: false });
      L.houses = [];
      const house = (x, z, col, roof, name, face) => {
        G.box(x, 0, z, 10, 5, 8, col);
        G.mesh('pyr', roof, x, 6.5, z, 11, 3, 9);
        const dz = face > 0 ? z + 4.05 : z - 4.05;
        G.box(x, 0, dz, 1.6, 2.8, 0.15, 0x6b4426, { solid: false });
        G.box(x - 3, 2.2, dz, 1.6, 1.4, 0.15, 0x9fe0ff, { solid: false }); G.box(x + 3, 2.2, dz, 1.6, 1.4, 0.15, 0x9fe0ff, { solid: false });
        const h = { door: new V(x, 0, dz + face * 1.8), name, done: false };
        L.houses.push(h); return h;
      };
      house(-45, -20, 0xffd23f, 0xb83a3a, '黃色房子', 1); house(-15, -20, 0xff8ad8, 0x5a3a8a, '粉紅房子', 1);
      house(15, -20, 0x9fe0a0, 0x3a6b3a, '綠色房子', 1); house(45, -20, 0xffffff, 0x2f4f8f, '白色房子', 1);
      house(-45, 20, 0x9fc9ff, 0x2f4f8f, '藍色房子', -1); house(15, 20, 0xffb366, 0x7a3a1a, '橘色房子', -1);
      house(45, 20, 0xd9b3ff, 0x6b2fb3, '紫色房子', -1); house(-45, 58, 0xe0e0e0, 0x555555, '灰色房子', -1);
      // pizza shop
      G.box(-15, 0, 22, 12, 6, 9, 0xd93636);
      G.box(-15, 6, 22, 12.4, 0.6, 9.4, 0xffffff);
      G.label('🍕 披薩店', { pos: new V(-15, 8, 22), scale: 2 });
      L.shop = new V(-15, 0, 15.5);
      G.box(-15, 0, 17.45, 2, 3, 0.15, 0xffd23f, { solid: false });
      // trees & lamp posts
      for (let i = 0; i < 30; i++) {
        const x = G.pick([-60, -52, 52, 60, -22, 22, 8, -8]) + G.rand(-2, 2), z = G.rand(-65, 65);
        if (Math.abs(z) % 40 < 6 || Math.abs(z - 40) < 6 || Math.abs(z + 40) < 6) continue;
        G.box(x, 0, z, 0.7, 2.6, 0.7, 0x7a4f2a); G.mesh('sph', 0x3f9e3f, x, 3.6, z, 3.2);
      }
      // townsfolk
      L.folk = [];
      for (let i = 0; i < 6; i++) {
        const n = G.makeNPC({ shirt: G.pick([0xff4b4b, 0x2fd06a, 0x2f7de1, 0xffd23f, 0xff8ad8]), skin: G.pick([0xffd23f, 0xf2c48d, 0xc68642]), pos: new V(G.pick([-34, -26, 26, 34, -4, 4]), 0, G.rand(-60, 60)), hair: 0x3b2a1a });
        n.data = { wp: new V(n.pos.x, 0, G.rand(-60, 60)) }; L.folk.push(n);
      }
      // car
      const car = new THREE.Group();
      G.part(car, 0, 0.75, 0, 2.2, 0.8, 4.2, 0x2f7de1); G.part(car, 0, 1.45, 0.3, 1.9, 0.7, 2.2, 0x9fe0ff);
      G.part(car, 0, 1.85, 0.3, 2.0, 0.1, 2.3, 0x2f7de1);
      for (const [x, z] of [[-1.1, 1.4], [1.1, 1.4], [-1.1, -1.4], [1.1, -1.4]]) G.part(car, x, 0.4, z, 0.4, 0.8, 0.8, 0x111111);
      G.part(car, -0.6, 0.85, -2.12, 0.5, 0.25, 0.05, 0xffffaa, { emissive: 0xffff88 }); G.part(car, 0.6, 0.85, -2.12, 0.5, 0.25, 0.05, 0xffffaa, { emissive: 0xffff88 });
      G.world.add(car);
      L.car = { mesh: car, pos: new V(4, 0, 30), vel: new V(), hw: 1.2, h: 1.6, onGround: false, head: 0, spd: 0, step: 0.4 };
      car.position.copy(L.car.pos);
      L.inCar = false;
      G.interact(() => L.car.pos, 3.5, () => L.inCar ? '下車' : '上車開車 🚗', () => L.toggleCar());
      L.toggleCar = () => {
        const p = G.player;
        if (!L.inCar) { L.inCar = true; p.custom = true; p.hidden = true; G.cam.dist = 11; G.cam.height = 2.5; G.sfx('pop'); }
        else {
          L.inCar = false; p.custom = false; p.hidden = false; G.cam.dist = 7; G.cam.height = 1.8; G.cam.target = null;
          const side = G.right(L.car.head); p.pos.copy(L.car.pos).addScaledVector(side, -2.6); p.vel.set(0, 0, 0);
        }
      };
      L.stage = 'pickup'; L.left = 3;
      // marker beam
      L.beam = G.mesh('cyl', 0xffd23f, 0, 25, 0, 1.2, 50, 1.2, { opacity: 0.35, emissive: 0xffd23f, noShadow: true }); L.beam.userData.noHit = true;
      L.arrow = G.mesh('cone', 0xffd23f, 0, 4, 0, 1.2, 1.6, 1.2, { emissive: 0xaa8800, noShadow: true }); L.arrow.rotation.x = Math.PI; L.arrow.userData.noHit = true;
      L.spawn.set(0, 0, 33); L.spawnYaw = 0;
      G.setButtons({ act: null, e: '上/下車' });
    },
    update(dt, L) {
      const p = G.player, c = L.car;
      for (const n of L.folk) { const d = G.npcSeek(n, n.data.wp, 3, dt); if (d < 1 || n.hitWall) n.data.wp = new V(n.pos.x, 0, G.rand(-60, 60)); }
      if (L.inCar) {
        const m = G.in.move;
        const max = 24;
        if (m.z > 0.1) c.spd = Math.min(max, c.spd + dt * 14 * m.z); else if (m.z < -0.1) c.spd = Math.max(-8, c.spd - dt * 22); else c.spd *= Math.pow(0.4, dt);
        c.head -= m.x * dt * 2.3 * G.clamp(c.spd / 10, -1, 1);
        const f = G.forward(c.head);
        c.vel.x = f.x * c.spd; c.vel.z = f.z * c.spd;
        G.moveEntity(c, dt);
        if (c.hitWall) c.spd *= -0.3;
        c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.head;
        p.pos.copy(c.pos); p.vel.set(0, 0, 0);
        G.cam.target = c.pos.clone().add(new V(0, 2.2, 0));
        if (Math.abs(c.spd) > 2 && Math.abs(m.x) < 0.1 && !G.in.lookingRecently) G.cam.yaw = G.angLerp(G.cam.yaw, c.head, Math.min(1, dt * 2.5));
        G.syncPlayerMesh(dt, 0);
      }
      // objective
      let tgt;
      if (L.stage === 'pickup') {
        tgt = L.shop;
        if (G.dist2(p.pos, L.shop) < 4.5) { L.stage = 'deliver'; L.targets = L.houses.slice().sort(() => Math.random() - 0.5).slice(0, 3); L.ti = 0; G.sfx('coin'); G.hud.toast('拿到 3 盒披薩！🍕 開始外送'); }
      } else {
        const h = L.targets[L.ti]; tgt = h.door;
        if (G.dist2(p.pos, h.door) < 4.5) {
          h.done = true; L.ti++; L.left--; G.sfx('coin'); G.burst(h.door.clone().setY(2), 0xffd23f, 16);
          G.label('謝謝！😋', { pos: h.door.clone().setY(4.5), scale: 1.2 });
          if (L.left <= 0) { G.complete('外送完成！🍕'); return; }
          G.hud.toast(`送達！還有 ${L.left} 盒`);
        }
      }
      if (tgt) {
        L.beam.position.set(tgt.x, 25, tgt.z); L.arrow.position.set(tgt.x, 4 + Math.sin(L.t * 3) * 0.4, tgt.z);
        const d = Math.round(G.dist2(p.pos, tgt));
        G.hud.prog(L.stage === 'pickup' ? `🍕 去披薩店拿披薩（${d} 公尺）` : `🏠 送到${L.targets[L.ti].name}（${d} 公尺）　剩 ${L.left} 盒`);
      }
    }
  });

  // ======================= 8. 果實海賊 (Blox Fruits) =======================
  G.LEVELS.push({
    name: '果實海賊', insp: 'Blox Fruits', obj: '吃下火焰果實獲得能力，打倒山賊，最後擊敗山賊頭目！（掉進海裡會沉下去！）',
    ctrl: 'WASD 移動・左鍵 攻擊（吃果實後發射火球）・Q 火焰爆發・E 互動・空白鍵 跳',
    ctrlTouch: '左邊搖桿移動・右邊拖曳轉視角・「攻擊」出拳/火球・「爆發」範圍火焰',
    build(L) {
      G.setSky({ color: 0x7fd0ff, fog: [80, 220] });
      const water = G.mesh('box', 0x1e7fd1, 0, -2.5, 0, 400, 1, 400, { opacity: 0.85, noShadow: true }); water.userData.noHit = true;
      G.box(0, -2, 0, 64, 2, 64, 0xf2dfa0);
      G.box(0, 0, -6, 40, 0.15, 36, 0x6cbf5a, { solid: false });
      for (let i = 0; i < 18; i++) {
        let x, z; do { x = G.rand(-29, 29); z = G.rand(-29, 29); } while (Math.hypot(x, z - 18) < 8);
        G.box(x, 0, z, 0.6, 4.2, 0.6, 0x9b6a3c);
        for (let k = 0; k < 4; k++) { const l = G.mesh('box', 0x2f9e4a, x + Math.cos(k * 1.57) * 1.2, 4.2, z + Math.sin(k * 1.57) * 1.2, 2.6, 0.2, 0.9); l.rotation.y = k * 1.57; }
      }
      for (const [x, z] of [[-10, -12], [10, -14], [-4, -20], [6, -24]]) { G.box(x, 0, z, 5, 3, 4, 0xb38a5a); G.box(x, 3, z, 5.6, 0.5, 4.6, 0x7a4f2a); }
      for (let i = 0; i < 6; i++) G.box(G.rand(-25, 25), 0, G.rand(-25, 5), G.rand(1, 2.4), G.rand(0.8, 2), G.rand(1, 2.4), 0x8a8f99);
      // fruit
      L.ped = new V(0, 0, 14);
      G.box(0, 0, 14, 1.6, 1.2, 1.6, 0xeeeeee);
      L.fruit = new THREE.Group();
      G.mesh('sph', 0xff5a1a, 0, 0, 0, 0.9, 1, 0.9, { parent: L.fruit, emissive: 0x661800 });
      for (let i = 0; i < 6; i++) { const s = G.part(L.fruit, Math.cos(i) * 0.38, Math.sin(i * 2) * 0.3, Math.sin(i) * 0.38, 0.18, 0.18, 0.18, 0xffd23f, { emissive: 0x664400 }); s.rotation.set(i, i, 0); }
      G.part(L.fruit, 0, 0.55, 0, 0.08, 0.3, 0.08, 0x2f9e4a);
      L.fruit.position.set(0, 1.9, 14); G.world.add(L.fruit);
      G.label('🔥 火焰果實', { pos: new V(0, 3.4, 14), scale: 1 });
      G.interact(new V(0, 0, 14), 2.6, '吃下火焰果實', () => {
        L.power = true; L.fruit.visible = false; G.sfx('win'); G.ring(G.player.pos.clone().setY(1), 0xff7a1a, 5);
        G.hud.big('獲得火焰能力！🔥', '#ff9a40', 1800);
        G.setButtons({ act: '火球', q: '爆發', e: 'E' });
        G.hud.toast(G.isTouch ? '「火球」發射火球，「爆發」範圍攻擊' : '左鍵發射火球、Q 火焰爆發', 3500);
      }, () => !L.power);
      L.spawn.set(0, 0, 20); L.spawnYaw = 0;
      G.player.maxHp = 120; G.player.faceCam = true;
      G.cam.shoulder = 0.9;
      G.hud.hp(true); G.hud.cross(true);
      G.setButtons({ act: '出拳', e: 'E', q: null });
      L.cd = 0; L.qcd = 0; L.power = false; L.killY = -1.6; L.fallMsg = '掉進海裡！能力者不會游泳…';
      L.bandits = [];
      const spots = [[-10, -8], [10, -9], [-6, -16], [7, -19], [0, -12]];
      spots.forEach(([x, z]) => {
        const n = G.makeNPC({ name: '山賊', shirt: 0x8b5a2b, pants: 0x3a2a1a, skin: 0xf2c48d, hp: 60, bar: true, pos: new V(x, 0, z), hat: 0xd93636, face: 'angry' });
        n.data = { cd: 0, home: new V(x, 0, z) };
        n.onDeath = () => { L.bandits = L.bandits.filter(b => b !== n); if (!L.bandits.length) L.spawnBoss(); else G.hud.prog(`山賊剩 ${L.bandits.length}`); };
        L.bandits.push(n);
      });
      G.hud.prog('先去吃果實！然後打倒 5 個山賊');
      L.spawnBoss = () => {
        G.hud.big('山賊頭目 出現了！', '#ff5a5a', 1800); G.sfx('alarm');
        const b = G.makeNPC({ name: '頭目 巨熊', shirt: 0x5a3a1a, pants: 0x2a1a0a, skin: 0xc68642, hp: 600, pos: new V(0, 0, -18), scale: 2, hat: 0x111111, face: 'angry' });
        b.data = { cd: 0, rock: 2 };
        b.onDeath = () => { G.hud.boss(null); G.after(0.8, () => G.complete('打倒頭目！🏴‍☠️')); };
        L.boss = b; G.hud.prog('擊敗山賊頭目！');
      };
    },
    update(dt, L) {
      const p = G.player;
      L.cd -= dt; L.qcd -= dt;
      const P = p.mesh.userData.P;
      if (G.in.actH && L.cd <= 0 && !G.dying) {
        if (L.power) {
          L.cd = 0.45; G.sfx('swing');
          const hand = p.pos.clone().add(new V(0, 1.6, 0)).addScaledVector(G.forward(G.cam.yaw), 0.8);
          const r = G.camRay(120);
          const dir = r.point.clone().sub(hand).normalize();
          G.shootProj({ pos: hand, vel: dir.multiplyScalar(34), color: 0xff6a1a, size: 0.7, dmg: 34, aoe: 2.2, fromPlayer: true, life: 2.5 });
          P.aR.rotation.x = -1.6; p.mesh.userData.armPose = true; L.armT = 0.2;
        } else {
          L.cd = 0.38; G.sfx('swing'); P.aR.rotation.x = -1.6; p.mesh.userData.armPose = true; L.armT = 0.2;
          for (const n of G.npcs) if (n.alive) {
            const to = n.pos.clone().sub(p.pos).setY(0); const d = to.length();
            if (d < 2.6 * n.mesh.scale.x && to.normalize().dot(G.forward(G.cam.yaw)) > 0.3) { G.hitNPC(n, 12); G.hud.hitmark(); }
          }
        }
      }
      if (L.armT > 0) { L.armT -= dt; if (L.armT <= 0) p.mesh.userData.armPose = false; }
      if (G.in.qP && L.power && L.qcd <= 0 && !G.dying) {
        L.qcd = 5; G.sfx('boom'); G.ring(p.pos.clone().setY(0.5), 0xff7a1a, 6, 0.5); G.burst(p.pos.clone().setY(1), 0xff7a1a, 24, 1.4);
        for (const n of G.npcs) if (n.alive && G.dist2(n.pos, p.pos) < 6 + n.hw) { G.hitNPC(n, 45); n.vel.y = 8; }
      }
      if (L.power) G.hud.extra(`<span class="pill">🔥 爆發 ${L.qcd > 0 ? Math.ceil(L.qcd) + 's' : '可以用'}</span>`);
      for (const n of L.bandits) {
        if (!n.alive) continue;
        n.data.cd -= dt;
        const d = G.dist2(n.pos, p.pos);
        if (d < 16 && !G.dying) {
          G.npcSeek(n, p.pos, 5.4, dt, { stop: 1.3 });
          if (d < 1.8 && n.data.cd <= 0) { n.data.cd = 1.1; G.damage(8); G.sfx('hit'); n.mesh.userData.P.aR.rotation.x = -1.5; }
        } else G.npcSeek(n, n.data.home, 3, dt, { stop: 0.5 });
      }
      const b = L.boss;
      if (b && b.alive) {
        G.hud.boss('山賊頭目 巨熊', b.hp / b.maxHp);
        b.data.cd -= dt; b.data.rock -= dt;
        const d = G.dist2(b.pos, p.pos);
        if (!G.dying) G.npcSeek(b, p.pos, 4.2, dt, { stop: 2.5 }); else G.syncNPC(b, dt, 0);
        if (d < 3.6 && b.data.cd <= 0 && !G.dying) {
          b.data.cd = 1.7; G.sfx('boom'); G.ring(b.pos.clone().setY(0.3), 0xffaa66, 4);
          G.damage(18); const kb = p.pos.clone().sub(b.pos).setY(0).normalize(); p.vel.x = kb.x * 16; p.vel.z = kb.z * 16; p.vel.y = 7;
        }
        if (d > 6 && b.data.rock <= 0 && !G.dying) {
          b.data.rock = 3.2;
          const from = b.pos.clone().add(new V(0, 4, 0)); const to = p.pos.clone().add(new V(0, 1, 0));
          const T = Math.max(0.6, from.distanceTo(to) / 22);
          const vel = to.clone().sub(from).divideScalar(T); vel.y += 0.5 * 14 * T;
          G.shootProj({ pos: from, vel, grav: 14, color: 0x7d7d7d, emissive: 0x222222, size: 1.1, dmg: 22, aoe: 2, life: 4, spin: true });
        }
      }
    },
    respawn(L) { if (L.boss && L.boss.alive) { L.boss.hp = Math.min(L.boss.maxHp, L.boss.hp + 120); L.boss.pos.set(0, 0, -18); } }
  });

  // ======================= 9. 門 (Doors) =======================
  G.LEVELS.push({
    name: '一百扇門', insp: 'DOORS', obj: '通過 10 個房間！燈開始閃就代表怪物要衝過來了，快躲進衣櫃！鎖住的門要在抽屜找鑰匙。',
    ctrl: 'WASD 移動・滑鼠 看・E 開抽屜 / 躲衣櫃 / 開門',
    build(L) {
      G.setSky({ color: 0x05060a, fog: [4, 34], fogColor: 0x05060a, sun: 0, hemi: 0.42, hemiSky: 0xffe0b0, hemiGround: 0x403020 });
      G.cam.mode = 'first';
      L.pl = new THREE.PointLight(0xffd9a0, 1.7, 24, 1.2); G.world.add(L.pl);
      const RL = 14, N = 10;
      L.rooms = [];
      G.box(0, -1, -N * RL / 2 + 2, 13, 1, N * RL + 8, 0x5a3b26);
      G.box(0, 0, 2.25, 13, 5, 0.5, 0x3a2d24);
      const lockRooms = [4, 7], rushRooms = [2, 5, 8];
      for (let i = 0; i < N; i++) {
        const z0 = -i * RL, z1 = z0 - RL, zc = (z0 + z1) / 2;
        const wcol = i % 2 ? 0x7a5e48 : 0x6e5440;
        G.box(-6.25, 0, zc, 0.5, 5, RL, wcol); G.box(6.25, 0, zc, 0.5, 5, RL, wcol);
        G.box(0, 5, zc, 13, 0.4, RL, 0x2a211b);
        G.box(-3.65, 0, z1, 4.7, 5, 0.5, wcol); G.box(3.65, 0, z1, 4.7, 5, 0.5, wcol); G.box(0, 3.4, z1, 2.6, 1.6, 0.5, wcol);
        const locked = lockRooms.includes(i);
        const door = G.box(0, 0, z1, 2.6, 3.4, 0.3, i === N - 1 ? 0x2fd06a : (locked ? 0x7a2020 : 0x6b4426));
        const num = String(i + 1).padStart(3, '0');
        G.label((locked ? '🔒 ' : '') + num, { pos: new V(0, 3.9, z1 + 0.4), scale: 0.8, color: '#ffd9a0' });
        const lamp = G.box(0, 4.7, zc, 1.5, 0.3, 1.5, 0xffeeaa, { emissive: 0xffd080, solid: false });
        const room = { i, z0, z1, door, locked, open: false, lamp, rush: rushRooms.includes(i), rushDone: false, key: false, closets: [] };
        // closets (both sides)
        for (const side of [-1, 1]) {
          const cz = zc + G.rand(-3, 3);
          const cl = G.box(side * 5.2, 0, cz, 1.3, 3.2, 1.8, 0x3b2a1a);
          G.box(side * 4.53, 0.2, cz, 0.05, 2.8, 0.05, 0x111111, { solid: false });
          const spot = new V(side * 5.2, 0, cz);
          const out = new V(side * 3.6, 0, cz);
          const c = { spot, out, side };
          room.closets.push(c);
          G.interact(out, 1.9, () => L.hidden === c ? '離開衣櫃' : '躲進衣櫃', () => L.hide(c), () => !L.hidden || L.hidden === c);
        }
        // dressers
        const dressers = [];
        for (let k = 0; k < 2; k++) {
          const dx = (k ? 1 : -1) * 4.9, dz = zc + (k ? -5.5 : 5.5) + G.rand(-0.3, 0.3);
          G.box(dx, 0, dz, 1.3, 1.2, 1.8, 0x5a3b26);
          const d = { pos: new V(dx * 0.75, 0, dz), searched: false };
          dressers.push(d);
          G.interact(d.pos, 1.9, '搜抽屜', () => {
            d.searched = true; G.sfx('click');
            if (d.hasKey) { L.keys++; G.sfx('coin'); G.hud.toast('找到鑰匙了！🔑'); d.hasKey = false; }
            else if (Math.random() < 0.3) G.hud.toast('只有一些金幣 🪙'); else G.hud.toast('什麼都沒有…');
          }, () => !d.searched);
        }
        if (locked) G.pick(dressers).hasKey = true;
        // a bit of decor
        G.box(G.rand(-2, 2), 0, zc + G.rand(-2, 2), 2, 0.9, 1.2, 0x6b4a33);
        G.interact(new V(0, 0, z1 + 1.2), 2.2, () => room.locked ? (L.keys ? '用鑰匙開門' : '門鎖住了…去抽屜找鑰匙') : '開門', () => {
          if (room.locked) { if (!L.keys) { G.hud.toast('門鎖住了！搜搜看這個房間的抽屜'); return; } L.keys--; room.locked = false; G.sfx('coin'); }
          L.openDoor(room);
        }, () => !room.open);
        L.rooms.push(room);
      }
      L.openDoor = (room) => {
        if (room.open) return;
        room.open = true; G.removeCol(room.door.userData.col); G.sfx('pop');
        let t = 0; const d = room.door;
        G.fxs.push({ mesh: new THREE.Object3D(), life: 0.6, upd: (dt) => { t += dt; d.position.x = -Math.min(1, t / 0.5) * 2.4; } });
      };
      L.hide = (c) => {
        const p = G.player;
        if (L.hidden === c) { L.hidden = null; p.frozen = false; p.pos.copy(c.out); G.cam.eye = 1.95; G.sfx('click'); return; }
        L.hidden = c; p.frozen = true; p.pos.copy(c.spot); p.pos.x -= c.side * 0.2; G.cam.yaw = c.side > 0 ? Math.PI / 2 : -Math.PI / 2; G.sfx('click');
      };
      L.keys = 0; L.hidden = null; L.room = 0; L.rush = null;
      L.rushMesh = new THREE.Group();
      G.mesh('sph', 0x111111, 0, 0, 0, 3.2, 3.2, 3.2, { parent: L.rushMesh, noShadow: true });
      G.part(L.rushMesh, -0.6, 0.4, 1.4, 0.5, 0.6, 0.3, 0xffffff, { emissive: 0xffffff, noShadow: true }); G.part(L.rushMesh, 0.6, 0.4, 1.4, 0.5, 0.6, 0.3, 0xffffff, { emissive: 0xffffff, noShadow: true });
      G.part(L.rushMesh, 0, -0.6, 1.45, 1.6, 0.4, 0.2, 0xffffff, { emissive: 0xffffff, noShadow: true });
      L.rushMesh.rotation.y = Math.PI; L.rushMesh.visible = false; L.rushMesh.traverse(o => o.userData.noHit = true);
      G.world.add(L.rushMesh);
      L.rushLight = new THREE.PointLight(0xff3030, 0, 12); L.rushMesh.add(L.rushLight);
      L.spawn.set(0, 0, -2); L.spawnYaw = 0; L.ckpt = new V(0, 0, -2);
      L.N = N; L.RL = RL;
      G.setButtons({ act: null, e: 'E' });
    },
    update(dt, L) {
      const p = G.player;
      L.pl.position.set(p.pos.x, 3.5, p.pos.z);
      const ri = G.clamp(Math.floor(-p.pos.z / L.RL), 0, L.N - 1);
      if (ri > L.room) { L.room = ri; L.ckpt = new V(0, 0, L.rooms[ri].z0 - 1.5); }
      const room = L.rooms[L.room];
      // doors auto open when near (unless locked)
      for (const r of L.rooms) if (!r.open && !r.locked && Math.abs(p.pos.z - r.z1) < 2.6 && Math.abs(p.pos.x) < 2) L.openDoor(r);
      // trigger rush
      if (room.rush && !room.rushDone && !L.rush && p.pos.z < room.z0 - 3) {
        L.rush = { st: 'warn', t: 0, room };
        G.hud.big('燈在閃…快躲進衣櫃！', '#ff6060', 2200); G.sfx('alarm');
      }
      if (L.rush) {
        const R = L.rush; R.t += dt;
        const flick = R.st === 'warn' ? (Math.random() < 0.5) : true;
        for (const r of L.rooms) r.lamp.material = flick ? G.mat(0x333333) : G.mat(0xffeeaa, { emissive: 0xffd080 });
        L.pl.intensity = R.st === 'warn' ? (Math.random() < 0.5 ? 0.3 : 1.7) : 0.4;
        if (R.st === 'warn' && R.t > 3.6) { R.st = 'go'; R.z = R.room.z0 + 30; L.rushMesh.visible = true; L.rushLight.intensity = 2; G.sfx('boom'); }
        if (R.st === 'go') {
          R.z -= dt * 42; L.rushMesh.position.set(0, 2.4, R.z); L.rushMesh.scale.setScalar(1 + Math.sin(L.t * 30) * 0.08);
          // rush opens every door it passes so it can fly through
          if (!L.hidden && !G.dying && Math.abs(p.pos.z - R.z) < 2.8) { G.die('被 Rush 撞到了！'); }
          if (R.z < R.room.z1 - 50) {
            R.room.rushDone = true; L.rush = null; L.rushMesh.visible = false; L.rushLight.intensity = 0; L.pl.intensity = 1.7;
            for (const r of L.rooms) r.lamp.material = G.mat(0xffeeaa, { emissive: 0xffd080 });
            G.hud.toast('安全了…可以出來了');
          }
        }
      }
      const last = L.rooms[L.N - 1];
      if (last.open && p.pos.z < last.z1 - 1.5) G.complete('逃出去了！🚪');
      G.hud.prog(`房間 ${String(L.room + 1).padStart(3, '0')} / 010　${L.keys ? '🔑×' + L.keys : ''}`);
    },
    respawn(L) {
      const p = G.player; p.pos.copy(L.ckpt); p.frozen = false; L.hidden = null;
      if (L.rush) { L.rush.room.rushDone = false; L.rush = null; L.rushMesh.visible = false; L.rushLight.intensity = 0; L.pl.intensity = 1.7; for (const r of L.rooms) r.lamp.material = G.mat(0xffeeaa, { emissive: 0xffd080 }); }
    }
  });

  // ======================= 10. 天災求生 (Natural Disaster Survival) =======================
  G.LEVELS.push({
    name: '天災求生', insp: 'Natural Disaster Survival', obj: '撐過 3 種天災：洪水、流星雨、龍捲風！',
    ctrl: 'WASD 移動・空白鍵 跳（在水裡可以一直按空白鍵往上游）',
    build(L) {
      G.setSky({ color: 0x9ad7ff, fog: [70, 180] });
      G.ground(76, '#8a8f99', '#7d828c');
      // stepped pyramid (high ground)
      const sz = [16, 12.5, 9, 6, 3.5];
      sz.forEach((s, i) => G.box(16, i * 1.6, -12, s, 1.6, s, [0xc9a66b, 0xb8945a, 0xa8844c, 0x977440, 0x866435][i]));
      G.label('爬上來！', { pos: new V(16, 10.5, -12), scale: 1 });
      // house
      G.box(-16, 0, 12, 10, 4, 8, 0xffffff); G.box(-16, 4, 12, 11, 0.5, 9, 0xd93636);
      G.box(-10, 0, 12, 1.6, 1.4, 1.6, 0x9b6a3c); G.box(-10, 1.4, 14, 1.6, 1.4, 1.6, 0x9b6a3c);
      // tower with stairs
      G.box(-18, 0, -18, 5, 9, 5, 0x5a6378);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 * 1.5; G.box(-18 + Math.cos(a) * 3.6, i * 0.55, -18 + Math.sin(a) * 3.6, 2, 0.5, 2, 0x8a93a8); }
      G.box(-18, 9, -18, 6, 0.4, 6, 0xffd23f);
      for (let i = 0; i < 10; i++) G.box(G.rand(-30, 30), 0, G.rand(-30, 30), 2, 2, 2, 0x9b6a3c);
      for (let i = 0; i < 10; i++) { const x = G.rand(-32, 32), z = G.rand(-32, 32); G.box(x, 0, z, 0.6, 3, 0.6, 0x7a4f2a); G.mesh('sph', 0x3f9e3f, x, 3.8, z, 2.6); }
      L.water = G.mesh('box', 0x2f7de1, 0, -2, 0, 76, 1, 76, { opacity: 0.55, noShadow: true }); L.water.userData.noHit = true; L.water.visible = false;
      L.tornado = new THREE.Group();
      for (let i = 0; i < 7; i++) { const c = G.mesh('cyl', 0x9aa0aa, 0, i * 2.2 + 1, 0, 1.2 + i * 1.1, 2.2, 1.2 + i * 1.1, { opacity: 0.45, parent: L.tornado, noShadow: true }); c.userData.noHit = true; }
      L.tornado.visible = false; G.world.add(L.tornado);
      L.seq = [{ id: 'flood', name: '🌊 洪水', dur: 22 }, { id: 'meteor', name: '☄️ 流星雨', dur: 18 }, { id: 'tornado', name: '🌪 龍捲風', dur: 18 }];
      L.idx = 0; L.st = 'wait'; L.t2 = 0; L.warns = [];
      L.spawn.set(0, 0, 20); L.spawnYaw = 0;
      G.hud.hp(true);
      L.killMsg = '被壓扁了';
    },
    start(L) { L.announce(); },
    update(dt, L) {
      const p = G.player, D = L.seq[L.idx];
      L.t2 += dt;
      if (L.st === 'wait') {
        G.hud.prog(`下一個災難：${D.name}　${Math.ceil(4 - L.t2)}`);
        if (L.t2 > 4) { L.st = 'go'; L.t2 = 0; L.begin(D); }
        return;
      }
      G.hud.prog(`${D.name}　撐住！還剩 ${Math.max(0, Math.ceil(D.dur - L.t2))} 秒`);
      p.gScale = 1;
      if (D.id === 'flood') {
        const lvl = L.t2 < 15 ? -1 + L.t2 * 0.47 : L.t2 < 19 ? 6.05 : 6.05 - (L.t2 - 19) * 2.5;
        L.lvl = lvl; L.water.visible = true; L.water.position.y = lvl - 0.5;
        if (p.pos.y < lvl) {
          p.gScale = 0.25; if (G.in.keys.Space || G.in.jumpP) p.vel.y = Math.max(p.vel.y, 4.5);
          if (p.pos.y + 1.9 < lvl) { L.drown = (L.drown || 0) + dt; if (L.drown > 0.5) { G.damage(20 * dt * 2); } } else L.drown = 0;
        }
      }
      if (D.id === 'meteor') {
        L.mcd = (L.mcd || 0) - dt;
        if (L.mcd <= 0) {
          L.mcd = 0.32;
          const t = Math.random() < 0.4 ? p.pos.clone().add(new V(p.vel.x * 0.9, 0, p.vel.z * 0.9)) : p.pos.clone().add(new V(G.rand(-14, 14), 0, G.rand(-14, 14)));
          t.y = 0.05;
          const w = new THREE.Mesh(new THREE.CircleGeometry(2.5, 20), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.45 }));
          w.rotation.x = -Math.PI / 2; w.position.copy(t); w.userData.noHit = true; G.world.add(w);
          G.after(1.0, () => {
            G.world.remove(w); w.geometry.dispose(); w.material.dispose();
            const from = t.clone().add(new V(6, 34, 3));
            G.shootProj({ pos: from, vel: t.clone().sub(from).multiplyScalar(1 / 0.6), color: 0xff5a1a, size: 1.4, dmg: 35, aoe: 3, life: 1.2 });
          });
        }
      }
      if (D.id === 'tornado') {
        const T = L.tornado; T.visible = true;
        const to = p.pos.clone().sub(T.position).setY(0); const d = to.length();
        T.position.addScaledVector(to.normalize(), 4.6 * dt); T.position.x += Math.sin(L.t * 1.3) * dt * 3;
        T.rotation.y += dt * 6;
        if (d < 10 && !G.dying) {
          const pull = to.clone().normalize().multiplyScalar(-(10 - d) * 1.2);
          p.vel.x += pull.x * dt * 4; p.vel.z += pull.z * dt * 4;
          p.pos.addScaledVector(pull, dt * 0.6);
          if (d < 2.8) { p.vel.y = 14; G.damage(25 * dt * 2); }
        }
      }
      if (L.t2 > D.dur) {
        L.end(D);
        if (L.idx >= L.seq.length - 1) { G.complete('活下來了！🙌'); return; }
        L.idx++; L.st = 'wait'; L.t2 = 0; L.announce();
      }
    },
    respawn(L) { L.end(L.seq[L.idx]); L.st = 'wait'; L.t2 = 0; L.announce(); }
  });
  const lv10 = G.LEVELS[G.LEVELS.length - 1], b10 = lv10.build;
  lv10.build = function (L) {
    b10(L);
    L.announce = () => { G.hud.big('下一個：' + L.seq[L.idx].name, '#ffd23f', 1600); };
    L.begin = (D) => { G.sfx('alarm'); if (D.id === 'tornado') { L.tornado.position.set(G.rand(-25, 25), 0, -30); } G.hud.toast(D.id === 'flood' ? '爬到高處！在水裡按住空白鍵可以往上游' : D.id === 'meteor' ? '躲開地上的紅圈！' : '離龍捲風遠一點！'); };
    L.end = (D) => { L.water.visible = false; L.water.position.y = -2; L.tornado.visible = false; G.player.gScale = 1; L.drown = 0; };
  };
})();
