// Levels 1–5: 競技對決, 地獄之塔, 偷怪物大作戰, 種菜花園, 森林 99 夜
'use strict';
(function () {
  const V = THREE.Vector3;

  // ======================= 1. 競技對決 (RIVALS) =======================
  G.LEVELS.push({
    name: '競技對決', insp: 'RIVALS', obj: '1v1 射擊對決：擊敗對手 3 次！',
    ctrl: 'WASD 移動・滑鼠 瞄準・左鍵 射擊・按住右鍵 瞄準鏡・R 換彈・空白鍵 跳・P 暫停',
    ctrlTouch: '左邊搖桿移動・右邊拖曳瞄準・按住「射擊」開火・按「瞄準」切換瞄準',
    build(L) {
      G.setSky({ color: 0x9fd8ff, fog: [70, 160] });
      G.cam.mode = 'first';
      G.ground(80, '#3d4250', '#4d5466');
      const wc = 0x2b2f3a;
      G.box(0, 0, -21, 44, 6, 2, wc); G.box(0, 0, 21, 44, 6, 2, wc);
      G.box(-21, 0, 0, 2, 6, 44, wc); G.box(21, 0, 0, 2, 6, 44, wc);
      G.box(0, 6, -21, 44, 0.4, 2.2, 0xff3b6b, { solid: false }); G.box(0, 6, 21, 44, 0.4, 2.2, 0x3b9bff, { solid: false });
      const covers = [[0, 0, 7, 3, 1.4, 0xffd23f], [-10, -6, 2, 3, 6, 0x3b9bff], [10, 6, 2, 3, 6, 0xff3b6b], [10, -6, 2, 3, 6, 0x3b9bff], [-10, 6, 2, 3, 6, 0xff3b6b],
        [-5, -12, 4, 1.8, 1.2, 0x7d8597], [5, 12, 4, 1.8, 1.2, 0x7d8597], [5, -12, 4, 1.8, 1.2, 0x7d8597], [-5, 12, 4, 1.8, 1.2, 0x7d8597],
        [-16, 0, 3, 4, 3, 0x5a6378], [16, 0, 3, 4, 3, 0x5a6378], [0, -6, 1.4, 2.4, 1.4, 0x2fd06a], [0, 6, 1.4, 2.4, 1.4, 0x2fd06a]];
      for (const c of covers) G.box(c[0], 0, c[1], c[2], c[3], c[4], c[5]);
      G.box(-16, 4, 0, 3, 0.4, 3, 0xffffff); G.box(16, 4, 0, 3, 0.4, 3, 0xffffff);
      L.spawn.set(0, 0, 17); L.spawnYaw = 0;
      L.w = { name: '突擊步槍', rate: 0.11, dmg: 21, spread: 0.014, adsSpread: 0.003, mag: 30, reloadT: 1.5, range: 150, kick: 0.05, recoil: 0.006 };
      L.mag = 30; L.reload = 0; L.kills = 0;
      G.fps.makeGun('ar', 0xff3b6b);
      G.hud.cross(true); G.hud.hp(true);
      G.setButtons({ act: '射擊', e: null, f: '瞄準' });
      G.hud.prog('擊殺 0 / 3');
      L.spawnBot = () => {
        const n = G.makeNPC({ name: '對手', shirt: 0xd93636, pants: 0x222222, skin: 0xf2c48d, hp: 100, bar: true, pos: new V(G.rand(-8, 8), 0, -17) });
        G.fps.botGun(n, 'ar', 0x3b9bff);
        n.data.seed = Math.random() * 10; n.yaw = 0;
        n.onDeath = () => {
          L.kills++; G.hud.prog(`擊殺 ${L.kills} / 3`);
          if (L.kills >= 3) { G.after(0.6, () => G.complete('勝利！🏆')); return; }
          G.hud.toast(`擊殺！還差 ${3 - L.kills} 次`);
          G.after(1.8, () => { G.removeNPC(n); L.spawnBot(); });
        };
        L.bot = n;
      };
    },
    start(L) { L.spawnBot(); },
    update(dt, L) {
      G.fps.tick(dt, L.w);
      if (G.in.actH && !G.dying) G.fps.fire(L.w);
      if (L.bot && L.bot.alive) G.fps.bot(L.bot, dt, { speed: 6, rate: 0.36, acc: 0.36, dmg: 8, keep: 14 });
    },
    respawn(L) {
      L.mag = L.w.mag; L.reload = 0;
      if (L.bot && L.bot.alive) { L.bot.pos.set(G.rand(-8, 8), 0, -17); L.bot.hp = L.bot.maxHp; G.syncNPC(L.bot); }
    }
  });

  // ======================= 2. 地獄之塔 (Tower of Hell) =======================
  G.LEVELS.push({
    name: '地獄之塔', insp: 'Tower of Hell', obj: '一路跳到塔頂！碰到紅色方塊會回到起點。',
    build(L) {
      G.setSky({ color: 0xbfe6ff, fog: [60, 170] });
      G.ground(70, '#5cbf5f', '#51ac55');
      const bands = [0x6b6f80, 0x7d8597, 0x6b6f80, 0x8a6fb0, 0x6b6f80, 0x5f8fb0, 0x6b6f80];
      for (let i = 0; i < 7; i++) G.box(0, i * 8, 0, 7, 8, 7, bands[i]);
      const rainbow = [0xff4b4b, 0xff8a1a, 0xffd23f, 0x2fd06a, 0x2fb3e1, 0x2f7de1, 0xa45cff, 0xff5fb6];
      L.movers = []; L.spinners = [];
      const R = 9.2, step = 0.42, rise = 1.15;
      const N = 42;
      for (let i = 0; i < N; i++) {
        const a = i * step, x = Math.cos(a) * R, z = Math.sin(a) * R, top = 0.8 + i * rise;
        const col = rainbow[i % rainbow.length];
        if (i >= 8 && i < 14) G.box(x, top - 0.5, z, 1.3, 0.5, 1.3, col);
        else if (i >= 14 && i < 20) {
          const m = G.box(x, top - 0.5, z, 2.4, 0.5, 2.4, 0xffffff, { moving: true });
          L.movers.push({ c: m.userData.col, a, top, ph: i * 1.3 });
        } else if (i >= 20 && i < 26) {
          G.box(x, top - 0.45, z, 3.0, 0.45, 3.0, 0xff1f1f, { kill: true, emissive: 0x880000 });
          G.box(x, top, z, 1.3, 0.3, 1.3, 0x2fd06a);
        } else {
          const s = i < 8 ? 2.6 : G.lerp(2.4, 1.4, (i - 32) / 10);
          G.box(x, top - 0.5, z, s, 0.5, s, col);
        }
      }
      const fa = N * step, fx = Math.cos(fa) * R, fz = Math.sin(fa) * R, ftop = 0.8 + N * rise;
      G.box(fx, ftop - 0.6, fz, 5, 0.6, 5, 0xffd23f, { emissive: 0x554400 });
      G.box(fx, ftop, fz + 1.8, 0.2, 3.5, 0.2, 0xffffff);
      G.box(fx + 0.6, ftop + 2.6, fz + 1.8, 1.2, 0.8, 0.1, 0x2fd06a, { solid: false });
      G.label('終點 🏁', { pos: new V(fx, ftop + 4.5, fz), scale: 1.4 });
      G.label('地獄之塔', { pos: new V(0, 58, 0), scale: 3 });
      L.finish = new V(fx, ftop, fz); L.top = ftop;
      L.spawn.set(14, 0, -1); L.spawnYaw = Math.PI / 2;
      L.killMsg = '碰到紅磚！回到起點';
      G.hud.prog('高度 0 / ' + Math.round(ftop));
    },
    update(dt, L) {
      const t = L.t, p = G.player.pos;
      for (const m of L.movers) {
        const r = 9.2 + Math.sin(t * 1.6 + m.ph) * 1.8;
        G.moveCol(m.c, Math.cos(m.a) * r, m.top - 0.25, Math.sin(m.a) * r);
      }
      for (const s of L.spinners) {
        s.ang += s.sp * dt; s.bar.rotation.y = s.ang;
        const dx = p.x - s.x, dz = p.z - s.z;
        if (Math.hypot(dx, dz) < 1.9 && p.y < s.top + 0.8 && p.y + 2 > s.top + 0.5) {
          const ux = Math.cos(s.ang), uz = -Math.sin(s.ang);
          const along = dx * ux + dz * uz, perp = Math.abs(-dx * uz + dz * ux);
          if (Math.abs(along) < 1.75 && perp < 0.55) G.die('被旋轉紅棒打到！回到起點');
        }
      }
      G.hud.prog('高度 ' + Math.max(0, Math.floor(p.y)) + ' / ' + Math.round(L.top));
      if (Math.hypot(p.x - L.finish.x, p.z - L.finish.z) < 2.6 && p.y >= L.top - 0.3) G.complete('登頂成功！🏔');
    }
  });

  // ======================= 3. 偷怪物大作戰 (Steal a Brainrot) =======================
  function creature(kind) {
    const g = new THREE.Group();
    const eyes = (y, z, s = 1) => { G.part(g, -0.18 * s, y, z, 0.14 * s, 0.14 * s, 0.05, 0x111111); G.part(g, 0.18 * s, y, z, 0.14 * s, 0.14 * s, 0.05, 0x111111); };
    const legs = (c, y = 0.35) => { G.part(g, -0.25, y, 0, 0.18, 0.7, 0.18, c); G.part(g, 0.25, y, 0, 0.18, 0.7, 0.18, c); };
    switch (kind) {
      case 0: // shark in sneakers
        G.part(g, 0, 1.0, 0, 0.7, 0.7, 1.6, 0x4a90d9); G.part(g, 0, 1.55, 0, 0.12, 0.5, 0.5, 0x4a90d9); G.part(g, 0, 1.0, -0.95, 0.1, 0.6, 0.4, 0x4a90d9);
        legs(0x4a90d9); G.part(g, -0.25, 0.08, 0.1, 0.3, 0.16, 0.5, 0xffffff); G.part(g, 0.25, 0.08, 0.1, 0.3, 0.16, 0.5, 0xffffff);
        G.part(g, 0, 0.8, 0.8, 0.5, 0.1, 0.05, 0xffffff); eyes(1.15, 0.81); break;
      case 1: // ninja coffee cup
        G.part(g, 0, 1.0, 0, 0.9, 1.1, 0.9, 0x8b5a2b); G.part(g, 0, 1.58, 0, 0.8, 0.08, 0.8, 0x3b2010); G.part(g, 0, 1.3, 0, 0.95, 0.16, 0.95, 0x111111);
        G.part(g, 0.6, 1.0, 0, 0.2, 0.5, 0.15, 0x8b5a2b); legs(0x8b5a2b, 0.25); eyes(1.3, 0.48); break;
      case 2: { // banana soldier
        const b = G.part(g, 0, 1.1, 0, 0.5, 1.6, 0.5, 0xffe14d); b.rotation.z = 0.25;
        G.part(g, -0.2, 1.95, 0, 0.6, 0.25, 0.6, 0x4b6b2f); legs(0x6b4a2b, 0.25); eyes(1.4, 0.26, 0.8); break; }
      case 3: // crocodile bomber
        G.part(g, 0, 1.2, 0, 0.6, 0.5, 1.8, 0x3a9b45); G.part(g, 0, 1.25, 0, 2.6, 0.08, 0.6, 0x9aa3b5);
        G.part(g, 0, 1.15, 1.1, 0.5, 0.3, 0.5, 0x3a9b45); legs(0x3a9b45); eyes(1.38, 1.36); break;
      case 4: // watermelon knight
        G.mesh('sph', 0x2f9e4a, 0, 1.15, 0, 1.2, 1.2, 1.2, { parent: g }); G.part(g, 0, 1.15, 0, 1.22, 0.1, 1.22, 0x1d6b30);
        G.part(g, 0.7, 1.1, 0.2, 0.1, 1.1, 0.12, 0xdddddd); legs(0xcc3344, 0.3); eyes(1.3, 0.6); break;
      default: // singing cactus
        G.part(g, 0, 1.1, 0, 0.6, 1.6, 0.6, 0x4caf50); G.part(g, -0.55, 1.3, 0, 0.5, 0.25, 0.3, 0x4caf50); G.part(g, -0.7, 1.6, 0, 0.25, 0.6, 0.3, 0x4caf50);
        G.part(g, 0.45, 1.2, 0.3, 0.12, 0.4, 0.12, 0x222222); G.mesh('sph', 0x888888, 0.45, 1.5, 0.3, 0.25, undefined, undefined, { parent: g });
        legs(0xffb84d, 0.25); eyes(1.55, 0.31); break;
    }
    G.world.add(g);
    return g;
  }
  const CREATURES = [['鯊魚球鞋', '$120/秒'], ['咖啡杯忍者', '$90/秒'], ['香蕉士兵', '$60/秒'], ['鱷魚轟炸機', '$250/秒'], ['西瓜騎士', '$150/秒'], ['仙人掌歌手', '$75/秒']];

  G.LEVELS.push({
    name: '偷怪物大作戰', insp: 'Steal a Brainrot', obj: '溜進別人的基地偷怪物，搬回你的藍色基地！偷到 3 隻就過關。小心守衛！',
    build(L) {
      G.setSky({ color: 0x9ad7ff, fog: [70, 160] });
      G.ground(100, '#7cc46a', '#70b55f');
      G.box(0, -0.02, 0, 6, 0.04, 90, 0x555a66, { solid: false });
      G.box(0, -0.02, -18, 70, 0.04, 6, 0x555a66, { solid: false });
      // own base
      L.home = new V(0, 0, 32);
      G.box(0, 0, 32, 14, 0.3, 12, 0x2f7de1);
      G.box(-7, 0.3, 32, 0.5, 1.2, 12, 0x1d5bb0); G.box(7, 0.3, 32, 0.5, 1.2, 12, 0x1d5bb0); G.box(0, 0.3, 38, 14, 1.2, 0.5, 0x1d5bb0);
      G.label('你的基地', { pos: new V(0, 4, 32), scale: 1.5, color: '#9fd0ff' });
      L.homeSlots = [new V(-4, 0.3, 35), new V(0, 0.3, 35), new V(4, 0.3, 35)];
      for (const s of L.homeSlots) G.box(s.x, 0.3, s.z, 1.6, 0.4, 1.6, 0xffffff);
      // enemy bases
      const bases = [{ c: new V(-26, 0, -26), col: 0xd93636, name: '紅隊' }, { c: new V(0, 0, -34), col: 0x8a4fd9, name: '紫隊' }, { c: new V(26, 0, -26), col: 0x2fae5a, name: '綠隊' }];
      L.items = []; L.guards = [];
      let k = 0;
      bases.forEach((b, bi) => {
        G.box(b.c.x, 0, b.c.z, 14, 0.3, 12, b.col);
        G.box(b.c.x - 7, 0.3, b.c.z, 0.5, 1.2, 12, 0x333333); G.box(b.c.x + 7, 0.3, b.c.z, 0.5, 1.2, 12, 0x333333); G.box(b.c.x, 0.3, b.c.z - 6, 14, 1.2, 0.5, 0x333333);
        G.label(b.name + '的基地', { pos: new V(b.c.x, 4.5, b.c.z), scale: 1.3 });
        for (let j = 0; j < 2; j++) {
          const ped = new V(b.c.x + (j ? 3 : -3), 0.3, b.c.z - 2.5);
          G.box(ped.x, 0.3, ped.z, 1.8, 0.5, 1.8, 0xeeeeee);
          const kind = k++ % 6;
          const m = creature(kind); const home = ped.clone().setY(0.8); m.position.copy(home);
          const lab = G.label(CREATURES[kind][0] + ' ' + CREATURES[kind][1], { scale: 0.7, color: '#ffd23f' }); lab.position.copy(home).add(new V(0, 2.6, 0));
          const it = { m, home, lab, base: bi, kind, state: 'home' };
          L.items.push(it);
          G.interact(() => it.m.position, 2.4, `偷走 ${CREATURES[kind][0]}`, () => {
            if (L.carry) return;
            it.state = 'carried'; L.carry = it; lab.visible = false; G.player.slow = 0.85; G.sfx('pop');
            G.hud.toast('快跑回你的基地！');
          }, () => it.state === 'home' && !L.carry);
        }
        const gd = G.makeNPC({ name: '守衛', shirt: b.col, pants: 0x111111, skin: 0xf2c48d, pos: b.c.clone().add(new V(0, 0.3, 3)), hat: 0x111111 });
        gd.data = { base: b.c, ang: bi * 2 };
        L.guards.push(gd);
      });
      L.stolen = 0; L.carry = null;
      L.spawn.set(0, 0.3, 30); L.spawnYaw = 0;
      G.hud.prog('偷到 0 / 3');
      G.setButtons({ act: null, e: '偷' });
    },
    update(dt, L) {
      const p = G.player;
      if (L.carry) {
        L.carry.m.position.set(p.pos.x, p.pos.y + 2.6, p.pos.z); L.carry.m.rotation.y = p.yaw;
        if (G.dist2(p.pos, L.home) < 6.5 && Math.abs(p.pos.z - L.home.z) < 6) {
          const it = L.carry; const slot = L.homeSlots[L.stolen];
          it.state = 'stolen'; it.m.position.copy(slot).add(new V(0, 0.4, 0)); it.m.rotation.y = Math.PI;
          L.carry = null; L.stolen++; p.slow = 1; G.sfx('coin');
          G.burst(it.m.position.clone().add(new V(0, 1, 0)), 0xffd23f, 16);
          G.hud.prog(`偷到 ${L.stolen} / 3`);
          if (L.stolen >= 3) G.complete('全部偷到了！💰'); else G.hud.toast(`成功！還要 ${3 - L.stolen} 隻`);
        }
      }
      for (const gd of L.guards) {
        const b = gd.data.base;
        const pd = G.dist2(gd.pos, p.pos);
        const inBase = Math.abs(p.pos.x - b.x) < 7.5 && Math.abs(p.pos.z - b.z) < 6.5;
        const angry = !G.dying && ((L.carry && L.carry.base === L.guards.indexOf(gd) && G.dist2(p.pos, b) < 24) || (inBase && pd < 12));
        if (angry) {
          G.npcSeek(gd, p.pos, 6.6, dt);
          if (pd < 1.3) G.die('被守衛抓到了！');
          gd.label.material.color.setHex(0xff6060);
        } else {
          gd.data.ang += dt * 0.6;
          const tgt = new V(b.x + Math.cos(gd.data.ang) * 5, 0, b.z + Math.sin(gd.data.ang) * 3.5);
          G.npcSeek(gd, tgt, 4, dt, { stop: 0.3 });
          gd.label.material.color.setHex(0xffffff);
        }
      }
      for (const it of L.items) if (it.state === 'home') { it.m.rotation.y += dt * 0.8; }
    },
    respawn(L) {
      if (L.carry) { const it = L.carry; it.state = 'home'; it.m.position.copy(it.home); it.lab.visible = true; L.carry = null; }
      G.player.slow = 1;
      for (const gd of L.guards) { gd.pos.copy(gd.data.base).add(new V(0, 0.3, 3)); gd.vel.set(0, 0, 0); }
    }
  });

  // ======================= 4. 種菜花園 (Grow a Garden) =======================
  const SEEDS = [
    { id: 'carrot', name: '胡蘿蔔', icon: '🥕', cost: 5, time: 5, sell: 14 },
    { id: 'berry', name: '草莓', icon: '🍓', cost: 15, time: 8, sell: 38 },
    { id: 'pump', name: '南瓜', icon: '🎃', cost: 40, time: 11, sell: 100 },
  ];
  function plantMesh(seed) {
    const g = new THREE.Group();
    G.part(g, 0, 0.35, 0, 0.12, 0.7, 0.12, 0x3a9b45);
    G.part(g, 0.2, 0.6, 0, 0.35, 0.08, 0.2, 0x4caf50); G.part(g, -0.2, 0.5, 0, 0.35, 0.08, 0.2, 0x4caf50);
    let fruit;
    if (seed.id === 'carrot') { fruit = G.mesh('cone', 0xff8a1a, 0, 0.35, 0, 0.5, 0.9, 0.5, { parent: g }); fruit.rotation.x = Math.PI; fruit.position.y = 0.2; }
    else if (seed.id === 'berry') { fruit = G.mesh('sph', 0xe8233d, 0, 0.9, 0, 0.6, 0.7, 0.6, { parent: g }); }
    else { fruit = G.mesh('sph', 0xff8a1a, 0, 0.6, 0, 1.4, 1.0, 1.4, { parent: g }); }
    g.userData.fruit = fruit;
    G.world.add(g); return g;
  }
  G.LEVELS.push({
    name: '種菜花園', insp: 'Grow a Garden', obj: '買種子 → 種下 → 收成 → 賣掉！賺到 $250 就過關。',
    build(L) {
      G.setSky({ color: 0xa8e0ff, fog: [70, 160] });
      G.ground(90, '#86cf6a', '#7bc15f');
      L.coins = 20; L.seeds = { carrot: 0, berry: 0, pump: 0 }; L.bag = []; L.goal = 250;
      L.plots = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const pos = new V((c - 1) * 4.2, 0, 4 + r * 4.2);
        G.box(pos.x, 0, pos.z, 3.4, 0.3, 3.4, 0x6b4426);
        const plot = { pos, state: 'empty', seed: null, t: 0, mesh: null, gold: false };
        L.plots.push(plot);
        G.interact(pos.clone().setY(0.3), 2.2, () => {
          if (plot.state === 'empty') { const s = SEEDS.slice().reverse().find(s => L.seeds[s.id] > 0); return s ? `種下 ${s.icon}${s.name}` : '沒種子，去左邊商店買'; }
          if (plot.state === 'grow') return `${plot.seed.icon} 成長中 ${Math.floor(plot.t / plot.seed.time * 100)}%`;
          return `收成 ${plot.seed.icon}${plot.gold ? '（金色變異！）' : ''}`;
        }, () => {
          if (plot.state === 'empty') {
            const s = SEEDS.slice().reverse().find(s => L.seeds[s.id] > 0);
            if (!s) { G.hud.toast('你沒有種子！去左邊的種子商店買'); return; }
            L.seeds[s.id]--; plot.seed = s; plot.state = 'grow'; plot.t = 0; plot.gold = Math.random() < 0.12;
            plot.mesh = plantMesh(s); plot.mesh.position.copy(pos).setY(0.3); plot.mesh.scale.setScalar(0.15); G.sfx('pop');
          } else if (plot.state === 'ripe') {
            L.bag.push({ seed: plot.seed, gold: plot.gold }); G.sfx('coin');
            G.burst(pos.clone().setY(1), plot.gold ? 0xffd23f : 0x5bff7a, 10);
            G.world.remove(plot.mesh); plot.mesh = null; plot.state = 'empty';
          }
        });
      }
      // seed shop
      G.box(-12, 0, 8, 5, 0.3, 3, 0x9b6a3c); G.box(-12, 0.3, 8, 5, 1.1, 1, 0xc98a4b);
      G.box(-14.3, 0, 8, 0.3, 4, 0.3, 0x6b4426); G.box(-9.7, 0, 8, 0.3, 4, 0.3, 0x6b4426);
      G.box(-12, 4, 8, 5.6, 0.3, 3.2, 0x2fd06a, { solid: false }); G.box(-12, 4.3, 8, 5.6, 0.3, 3.2, 0xffffff, { solid: false });
      const shopNpc = G.makeNPC({ name: '種子商人', shirt: 0x2fd06a, pos: new V(-12, 0, 6.5), hat: 0xc98a4b }); shopNpc.yaw = Math.PI;
      G.label('🌱 種子商店', { pos: new V(-12, 5.6, 8), scale: 1.2 });
      G.interact(new V(-12, 0, 10), 3.2, '打開種子商店', () => L.openShop());
      // sell stand
      G.box(12, 0, 8, 5, 0.3, 3, 0x9b6a3c); G.box(12, 0.3, 8, 5, 1.1, 1, 0xc98a4b);
      G.box(9.7, 0, 8, 0.3, 4, 0.3, 0x6b4426); G.box(14.3, 0, 8, 0.3, 4, 0.3, 0x6b4426);
      G.box(12, 4, 8, 5.6, 0.3, 3.2, 0xffd23f, { solid: false }); G.box(12, 4.3, 8, 5.6, 0.3, 3.2, 0xffffff, { solid: false });
      const sellNpc = G.makeNPC({ name: '收購商', shirt: 0xffd23f, pos: new V(12, 0, 6.5), hat: 0x333333 }); sellNpc.yaw = Math.PI;
      G.label('💰 收購站', { pos: new V(12, 5.6, 8), scale: 1.2 });
      G.interact(new V(12, 0, 10), 3.2, () => L.bag.length ? `賣掉 ${L.bag.length} 個作物` : '背包是空的', () => {
        if (!L.bag.length) { G.hud.toast('先去收成作物再來賣！'); return; }
        let sum = 0; for (const b of L.bag) sum += b.seed.sell * (b.gold ? 3 : 1);
        L.coins += sum; L.bag = []; G.sfx('coin'); G.floatText(G.player.pos.clone().add(new V(0, 3, 0)), '+$' + sum, '#ffd23f');
        G.hud.toast(`賣了 $${sum}！`);
        if (L.coins >= L.goal) G.complete('農場大亨！🌽');
      });
      // decor
      for (let i = 0; i < 14; i++) { const x = G.rand(-40, 40), z = G.rand(-40, -14); G.box(x, 0, z, 0.8, 2.5, 0.8, 0x7a4f2a); G.box(x, 2.5, z, 3, 2.6, 3, 0x3f9e3f); }
      for (let i = -20; i <= 20; i += 2) { G.box(i, 0, 20, 0.3, 1.2, 0.3, 0xffffff, { solid: false }); }
      G.box(0, 0.9, 20, 40, 0.15, 0.15, 0xffffff, { solid: false });
      L.spawn.set(0, 0, -3); L.spawnYaw = Math.PI;
      G.setButtons({ act: null, e: '互動' });
      L.openShop = () => {
        const draw = () => {
          const rows = SEEDS.map(s => `<button class="opt" data-s="${s.id}" ${L.coins < s.cost ? 'disabled' : ''}>${s.icon} ${s.name}　$${s.cost}<br><small>${s.time} 秒長大・賣 $${s.sell}・有 ${L.seeds[s.id]} 包</small></button>`).join('');
          const p = G.openPanel(`<h2>🌱 種子商店</h2><div>💰 你有 $${L.coins}</div><div class="row">${rows}</div><button class="btn gray" id="shopClose">關閉</button>`);
          p.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
            const s = SEEDS.find(x => x.id === b.dataset.s);
            if (L.coins >= s.cost) { L.coins -= s.cost; L.seeds[s.id]++; G.sfx('coin'); draw(); }
          });
          G.$('shopClose').onclick = () => G.closePanel();
        };
        draw();
      };
    },
    update(dt, L) {
      for (const p of L.plots) {
        if (p.state === 'grow') {
          p.t += dt; const k = Math.min(1, p.t / p.seed.time);
          p.mesh.scale.setScalar(0.15 + 0.85 * k);
          if (k >= 1) { p.state = 'ripe'; if (p.gold) p.mesh.userData.fruit.material = G.mat(0xffd23f, { emissive: 0x665500 }); G.burst(p.pos.clone().setY(1), 0x5bff7a, 6); }
        } else if (p.state === 'ripe') { p.mesh.rotation.y += dt * 1.5; p.mesh.position.y = 0.3 + Math.abs(Math.sin(L.t * 3)) * 0.15; }
      }
      const bagTxt = SEEDS.map(s => { const n = L.bag.filter(b => b.seed === s).length; return n ? s.icon + '×' + n : ''; }).join(' ');
      const seedTxt = SEEDS.map(s => L.seeds[s.id] ? s.icon + '種子×' + L.seeds[s.id] : '').join(' ');
      G.hud.prog(`💰 $${L.coins} / $${L.goal}`);
      G.hud.extra(`<span class="pill">種子：${seedTxt || '無'}</span><br><span class="pill">背包：${bagTxt || '空'}</span>`);
    }
  });

  // ======================= 5. 森林 99 夜 (99 Nights in the Forest) =======================
  G.LEVELS.push({
    name: '森林求生夜', insp: '99 Nights in the Forest', obj: '撐過 3 個晚上！撿木頭顧好營火，晚上待在火光裡，鹿頭怪怕火。',
    build(L) {
      G.setSky({ color: 0x8fc9ff, fog: [40, 110] });
      G.ground(130, '#3f7a3a', '#3a7035');
      L.fire = new V(0, 0, 0);
      // campfire
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; G.box(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3, 0.6, 0.4, 0.6, 0x777777); }
      const l1 = G.mesh('box', 0x6b4426, 0, 0.2, 0, 2, 0.3, 0.3); l1.rotation.y = 0.6;
      const l2 = G.mesh('box', 0x6b4426, 0, 0.25, 0, 2, 0.3, 0.3); l2.rotation.y = -0.6;
      L.flames = [G.mesh('cone', 0xff7a1a, 0, 0.9, 0, 1.1, 1.4, 1.1, { emissive: 0xff5500, noShadow: true }), G.mesh('cone', 0xffd23f, 0, 0.8, 0, 0.6, 1.0, 0.6, { emissive: 0xffaa00, noShadow: true })];
      L.flames.forEach(f => f.userData.noHit = true);
      L.fireLight = new THREE.PointLight(0xff9a40, 1.5, 26, 1.6); L.fireLight.position.set(0, 2, 0); G.world.add(L.fireLight);
      L.pLight = new THREE.PointLight(0xbfd8ff, 0, 14, 1.5); G.world.add(L.pLight);
      L.ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      L.ring.rotation.x = -Math.PI / 2; L.ring.position.y = 0.05; L.ring.userData.noHit = true; G.world.add(L.ring);
      G.interact(new V(0, 0, 0), 3.4, () => L.logs ? `把 ${L.logs} 根木頭丟進營火` : `營火燃料 ${Math.round(L.fuel)}%`, () => {
        if (!L.logs) { G.hud.toast('去森林撿木頭（棕色木頭堆）'); return; }
        L.fuel = Math.min(100, L.fuel + L.logs * 18); L.logs = 0; G.sfx('pop'); G.burst(new V(0, 1.5, 0), 0xff9a40, 14);
      });
      // trees
      for (let i = 0; i < 75; i++) {
        let x, z; do { x = G.rand(-60, 60); z = G.rand(-60, 60); } while (Math.hypot(x, z) < 9);
        const h = G.rand(3, 5);
        G.box(x, 0, z, 0.9, h, 0.9, 0x5a3b22);
        G.box(x, h, z, 3.2, 2.4, 3.2, i % 3 ? 0x2d6a2e : 0x24582a, { solid: false });
        G.box(x, h + 2.4, z, 2, 1.4, 2, 0x2f7a33, { solid: false });
      }
      // log piles
      L.piles = [];
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2 + G.rand(-0.2, 0.2), r = G.rand(12, 36);
        const pos = new V(Math.cos(a) * r, 0, Math.sin(a) * r);
        const g = new THREE.Group(); G.part(g, 0, 0.2, 0, 1.6, 0.35, 0.35, 0x8b5a2b); G.part(g, 0, 0.55, 0, 1.6, 0.35, 0.35, 0x7a4f2a); G.part(g, 0, 0.2, 0.4, 1.6, 0.35, 0.35, 0x8b5a2b);
        g.position.copy(pos); G.world.add(g);
        const pile = { pos, g, cd: 0 };
        L.piles.push(pile);
        G.interact(pos, 2.4, '撿木頭', () => {
          if (L.logs >= 3) { G.hud.toast('最多拿 3 根，先拿回營火'); return; }
          L.logs++; pile.cd = 12; g.visible = false; G.sfx('pop');
        }, () => pile.cd <= 0);
      }
      L.fuel = 75; L.logs = 0; L.night = 1; L.phase = 'day'; L.ph = 0; L.dayLen = 16; L.nightLen = 28;
      L.mons = [];
      L.spawn.set(0, 0, 4); L.spawnYaw = 0;
      G.hud.hp(true);
      G.setButtons({ act: null, e: '撿/放' });
    },
    update(dt, L) {
      const p = G.player;
      L.ph += dt;
      const night = L.phase === 'night';
      if (!night && L.ph > L.dayLen) { L.phase = 'night'; L.ph = 0; G.hud.big(`第 ${L.night} 夜 🌙`, '#9fb8ff', 1600); G.sfx('alarm'); L.spawnMons(); }
      else if (night && L.ph > L.nightLen) {
        L.mons.forEach(m => { G.burst(m.pos.clone().add(new V(0, 1.5, 0)), 0x333333, 10); G.removeNPC(m); }); L.mons = [];
        if (L.night >= 3) { G.complete('撐過 3 個晚上！☀️'); return; }
        L.night++; L.phase = 'day'; L.ph = 0; G.hud.big('天亮了 ☀️', '#ffd23f', 1400);
      }
      // sky blend
      const k = night ? Math.min(1, L.ph / 3) : Math.max(0, 1 - L.ph / 3) * (L.night > 1 ? 1 : 0);
      const day = new THREE.Color(0x8fc9ff), dark = new THREE.Color(0x070b18);
      const sky = day.clone().lerp(dark, k);
      G.scene.background = sky; G.scene.fog.color.copy(sky); G.scene.fog.near = G.lerp(40, 6, k); G.scene.fog.far = G.lerp(110, 38, k);
      G.sun.intensity = G.lerp(0.8, 0.02, k); G.hemi.intensity = G.lerp(0.75, 0.12, k);
      L.pLight.intensity = k * 0.9; L.pLight.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z);
      // fire
      L.fuel -= dt * (night ? 2.0 : 1.0);
      if (L.fuel <= 0) { L.fuel = 0; G.die('營火熄滅了…'); }
      const fr = 4 + L.fuel * 0.065; L.fireR = fr;
      const fl = 0.35 + L.fuel / 100;
      L.flames[0].scale.set(1.1 * fl, 1.4 * fl * (1 + Math.sin(L.t * 17) * 0.08), 1.1 * fl); L.flames[0].position.y = 0.7 * fl + 0.2;
      L.flames[1].scale.set(0.6 * fl, 1.0 * fl * (1 + Math.sin(L.t * 23) * 0.1), 0.6 * fl); L.flames[1].position.y = 0.5 * fl + 0.2;
      L.fireLight.intensity = (0.6 + L.fuel / 60) * (1 + Math.sin(L.t * 13) * 0.06); L.fireLight.distance = fr * 2.6;
      L.ring.scale.setScalar(fr); L.ring.visible = night;
      for (const pile of L.piles) if (pile.cd > 0) { pile.cd -= dt; if (pile.cd <= 0) pile.g.visible = true; }
      // monsters
      const safe = G.dist2(p.pos, L.fire) < fr;
      for (const m of L.mons) {
        m.data.cd = Math.max(0, m.data.cd - dt);
        const md = G.dist2(m.pos, L.fire);
        let tgt;
        if (m.data.cd > 0 || safe) {
          const a = Math.atan2(m.pos.z, m.pos.x) + dt * 0.4;
          tgt = new V(Math.cos(a) * (fr + 3.5), 0, Math.sin(a) * (fr + 3.5));
          if (m.data.cd > 0) tgt = m.pos.clone().sub(p.pos).setY(0).normalize().multiplyScalar(6).add(m.pos);
        } else tgt = p.pos;
        G.npcSeek(m, tgt, m.data.sp, dt);
        if (md < fr) { const out = m.pos.clone().setY(0).normalize(); m.pos.x = out.x * fr; m.pos.z = out.z * fr; }
        if (!safe && m.data.cd <= 0 && G.dist2(m.pos, p.pos) < 1.5 && !G.dying) {
          G.damage(30); m.data.cd = 2.5;
          const kb = p.pos.clone().sub(m.pos).setY(0).normalize(); p.vel.x = kb.x * 14; p.vel.z = kb.z * 14; p.vel.y = 6;
        }
        m.data.eyes.forEach(e => e.visible = true);
      }
      const tl = Math.ceil((night ? L.nightLen : L.dayLen) - L.ph);
      G.hud.prog(`${night ? '🌙 第 ' + L.night + ' 夜' : '☀️ 第 ' + L.night + ' 天'}　還剩 ${tl} 秒`);
      G.hud.extra(`<span class="pill">🔥 營火 ${Math.round(L.fuel)}%</span><br><span class="pill">🪵 木頭 ${L.logs} / 3</span>`);
    },
    respawn(L) {
      L.fuel = Math.max(L.fuel, 60); L.phase = 'night'; L.ph = 0;
      L.mons.forEach(m => G.removeNPC(m)); L.mons = []; L.spawnMons();
    },
  });
  // helper attached after push so it can reference L
  const lv5 = G.LEVELS[G.LEVELS.length - 1];
  const b5 = lv5.build;
  lv5.build = function (L) {
    b5(L);
    L.spawnMons = () => {
      const n = 1 + L.night;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const m = G.makeNPC({ shirt: 0x1a1a1a, pants: 0x111111, skin: 0x3a2a1f, face: 'scary', pos: new V(Math.cos(a) * 42, 0, Math.sin(a) * 42), scale: 1.25 });
        const P = m.mesh.userData.P;
        G.part(m.mesh, -0.35, 2.55, 0, 0.1, 0.6, 0.1, 0xd9c7a0); G.part(m.mesh, 0.35, 2.55, 0, 0.1, 0.6, 0.1, 0xd9c7a0);
        G.part(m.mesh, -0.55, 2.8, 0, 0.5, 0.1, 0.1, 0xd9c7a0); G.part(m.mesh, 0.55, 2.8, 0, 0.5, 0.1, 0.1, 0xd9c7a0);
        const e1 = G.part(m.mesh, -0.14, 2.05, 0.32, 0.1, 0.08, 0.02, 0xff2020, { emissive: 0xff0000, noShadow: true });
        const e2 = G.part(m.mesh, 0.14, 2.05, 0.32, 0.1, 0.08, 0.02, 0xff2020, { emissive: 0xff0000, noShadow: true });
        m.data = { cd: 0, sp: 4.6 + L.night * 0.6, eyes: [e1, e2] };
        P.head.scale.y = 0.75;
        L.mons.push(m);
      }
    };
  };
})();
