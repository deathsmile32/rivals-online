// Levels 11–15: 釣魚大師, 穿搭比賽, 刀刃球, 最強戰場, 兵工廠
'use strict';
(function () {
  const V = THREE.Vector3;

  // ======================= 11. 釣魚大師 (Fish It) =======================
  const FISH = [
    { name: '小鯽魚', rar: '普通', col: '#cfd6e0', w: 45, sp: 0.3, zone: 0.34, icon: '🐟' },
    { name: '條紋鱸魚', rar: '少見', col: '#5bff7a', w: 27, sp: 0.4, zone: 0.32, icon: '🐠' },
    { name: '金鱗魚', rar: '稀有', col: '#4fb3ff', w: 20, sp: 0.45, zone: 0.32, icon: '🐡', rare: true },
    { name: '彩虹鯨', rar: '傳說', col: '#ffd23f', w: 8, sp: 0.55, zone: 0.3, icon: '🐋', rare: true },
  ];
  G.LEVELS.push({
    name: '釣魚大師', insp: 'Fish It!', obj: '走到碼頭上按「拋竿」釣魚，魚上鉤（！）時再按一次，然後按住讓綠色框框住魚。釣到 5 條魚，而且至少 1 條稀有以上！',
    ctrl: 'WASD 移動・左鍵 拋竿／收線（釣魚時按住左鍵或空白鍵讓綠框往上）',
    ctrlTouch: '左邊搖桿移動・按「拋竿」釣魚・釣魚時按住「拉」讓綠框往上',
    build(L) {
      G.setSky({ color: 0x8fd3ff, fog: [80, 220] });
      const water = G.mesh('box', 0x1f8fd6, 0, -1.6, -30, 300, 1, 300, { opacity: 0.85, noShadow: true }); water.userData.noHit = true; L.waterMesh = water;
      G.box(0, -3, 22, 50, 3, 30, 0xf2dfa0);
      G.box(0, 0, 9, 5, 0.3, 4, 0x9b6a3c);
      G.box(0, -0.3, -6, 4, 0.5, 26, 0x9b6a3c);
      for (let z = 6; z >= -18; z -= 4) { G.box(-2.1, -3, z, 0.4, 3.2, 0.4, 0x6b4426); G.box(2.1, -3, z, 0.4, 3.2, 0.4, 0x6b4426); }
      G.box(0, -0.3, -20, 12, 0.5, 4, 0x9b6a3c);
      for (let i = 0; i < 8; i++) { const x = G.rand(-22, 22), z = G.rand(15, 34); G.box(x, 0, z, 0.6, 4, 0.6, 0x9b6a3c); G.mesh('sph', 0x2f9e4a, x, 4.4, z, 3); }
      G.box(-8, 0, 16, 5, 3, 4, 0x2f7de1); G.box(-8, 3, 16, 5.6, 0.4, 4.6, 0xffffff);
      const fisher = G.makeNPC({ name: '老漁夫', shirt: 0xffd23f, pants: 0x2b3a55, pos: new V(-3.5, 0, 9), hat: 0xc98a4b }); fisher.yaw = Math.PI / 2; G.syncNPC(fisher);
      G.interact(new V(-3.5, 0, 9), 2.6, '和老漁夫說話', () => G.hud.toast('「稀有的魚游得很快，綠框要穩住啊！」', 3000));
      L.caught = []; L.state = 'idle'; L.killY = -2.2; L.fallMsg = '掉進水裡了！';
      L.spawn.set(0, 0.3, 9.5); L.spawnYaw = 0;
      // rod
      const rod = new THREE.Group(); G.part(rod, 0, 0, 0, 0.06, 0.06, 2.4, 0x6b4426); rod.position.set(0, -0.9, 0.9); rod.rotation.x = 0.6;
      G.player.mesh.userData.P.aR.add(rod); rod.visible = false; L.rod = rod;
      L.bob = G.mesh('sph', 0xff3b3b, 0, 0, 0, 0.35); L.bob.visible = false; L.bob.userData.noHit = true;
      L.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V(), new V()]), new THREE.LineBasicMaterial({ color: 0xffffff })); L.line.userData.noHit = true; G.world.add(L.line); L.line.visible = false;
      L.excl = G.label('！', { color: '#ff3b3b', scale: 2.2, bg: null }); L.excl.visible = false;
      G.setButtons({ act: '拋竿', e: 'E' });
      L.updHud = () => {
        G.hud.prog(`🎣 ${L.caught.length} / 5 條　${L.caught.some(f => f.rare) ? '✅ 已有稀有魚' : '還需要 1 條稀有以上'}`);
        G.hud.extra(L.caught.map(f => `<span class="pill" style="color:${f.col}">${f.icon} ${f.rar} ${f.name}</span>`).join('<br>'));
      };
      L.updHud();
    },
    cleanup(L) { if (L.rod) G.player.mesh.userData.P.aR.remove(L.rod); },
    update(dt, L) {
      const p = G.player;
      const onDock = p.pos.z < -1 && p.pos.y > -0.5;
      const pressed = G.in.actP;
      if (L.state === 'idle') {
        if (pressed && !G.dying) {
          if (!onDock) { G.hud.toast('走到碼頭上才能釣魚！'); return; }
          L.state = 'cast'; L.t3 = 0; p.frozen = true; L.rod.visible = true; p.mesh.userData.armPose = true; p.mesh.userData.P.aR.rotation.x = -1.2;
          p.yaw = G.cam.yaw;
          const f = G.forward(p.yaw); L.bobTarget = p.pos.clone().addScaledVector(f, 9); L.bobTarget.y = -1.1;
          L.bobFrom = p.pos.clone().add(new V(0, 2.5, 0));
          L.bob.visible = true; L.line.visible = true; G.sfx('swing');
          L.wait = G.rand(1.6, 3.6);
          G.setButtons({ act: '收線', e: 'E' });
        }
      } else if (L.state === 'cast') {
        L.t3 += dt; const k = Math.min(1, L.t3 / 0.6);
        L.bob.position.lerpVectors(L.bobFrom, L.bobTarget, k); L.bob.position.y += Math.sin(k * Math.PI) * 3;
        if (k >= 1) { L.state = 'wait'; L.t3 = 0; }
      } else if (L.state === 'wait') {
        L.t3 += dt; L.bob.position.y = -1.1 + Math.sin(L.t * 3) * 0.05;
        if (pressed) { L.reset('太早收線了…'); return; }
        if (L.t3 > L.wait) { L.state = 'bite'; L.t3 = 0; L.excl.visible = true; L.excl.position.copy(L.bob.position).add(new V(0, 1.6, 0)); G.sfx('alarm'); }
      } else if (L.state === 'bite') {
        L.t3 += dt; L.bob.position.y = -1.4 + Math.sin(L.t * 25) * 0.15;
        if (pressed) { L.excl.visible = false; L.startReel(); }
        else if (L.t3 > 1.3) { L.excl.visible = false; L.reset('魚跑掉了！要快一點按'); }
      } else if (L.state === 'reel') {
        const R = L.reel;
        const hold = G.in.actH || G.in.keys.Space;
        R.v += (hold ? 2.6 : -2.2) * dt; R.v = G.clamp(R.v, -1.2, 1.2);
        R.z += R.v * dt; if (R.z < 0) { R.z = 0; R.v = 0; } if (R.z > 1 - R.zone) { R.z = 1 - R.zone; R.v = 0; }
        R.ft -= dt; if (R.ft <= 0) { R.ft = G.rand(0.35, 1.1); R.ftgt = Math.random(); }
        R.f += G.clamp(R.ftgt - R.f, -R.fish.sp * dt, R.fish.sp * dt); R.f = G.clamp(R.f, 0.03, 0.97);
        const inZone = R.f >= R.z && R.f <= R.z + R.zone;
        R.prog += (inZone ? 0.36 : -0.16) * dt;
        L.drawReel();
        L.bob.position.y = -1.4 + Math.sin(L.t * 18) * 0.1;
        if (R.prog >= 1) {
          const f = R.fish; L.caught.push(f); G.sfx('win');
          G.hud.big(`${f.icon} ${f.rar}：${f.name}！`, f.col, 1800);
          G.burst(p.pos.clone().add(new V(0, 3, 0)), parseInt(f.col.slice(1), 16), 18);
          L.reset(null); L.updHud();
          if (L.caught.length >= 5 && L.caught.some(x => x.rare)) G.after(1.2, () => G.complete('釣魚大師！🎣'));
          else if (L.caught.length >= 5) G.hud.toast('還差一條稀有以上的魚！');
        } else if (R.prog <= 0) { L.reset('魚逃走了…'); }
      }
      if (L.state !== 'idle' && L.state !== 'reel') {
        const tip = p.pos.clone().add(new V(0, 2.6, 0)).addScaledVector(G.forward(p.yaw), 1.6);
        L.line.geometry.setFromPoints([tip, L.bob.position.clone()]);
      }
    },
    respawn(L) { L.reset(null); }
  });
  const lv11 = G.LEVELS[G.LEVELS.length - 1], b11 = lv11.build;
  lv11.build = function (L) {
    b11(L);
    L.reset = (msg) => {
      L.state = 'idle'; G.player.frozen = false; L.rod.visible = false; L.bob.visible = false; L.line.visible = false; L.excl.visible = false;
      G.player.mesh.userData.armPose = false;
      if (G.panelOpen) G.closePanel(false);
      if (msg) G.hud.toast(msg);
      G.setButtons({ act: '拋竿', e: 'E' });
    };
    L.startReel = () => {
      let tot = 0; for (const f of FISH) tot += f.w;
      let r = Math.random() * tot, fish = FISH[0];
      for (const f of FISH) { if (r < f.w) { fish = f; break; } r -= f.w; }
      if (L.caught.length >= 2 && !L.caught.some(f => f.rare) && !fish.rare) fish = FISH[2];
      L.reel = { fish, z: 0.2, v: 0, f: 0.5, ftgt: 0.5, ft: 0, prog: 0.3, zone: fish.zone };
      L.state = 'reel';
      G.setButtons({ act: '拉！', e: null });
      const p = G.openPanel(`<div style="text-align:center;font-weight:900;margin-bottom:8px;color:${fish.col}">有東西上鉤了！</div>
        <div class="fishWrap"><div class="fishBar" id="fBar"><div class="fishZone" id="fZone"></div><div class="fishIcon" id="fIcon">🐟</div></div>
        <div class="fishProg"><div id="fProg"></div></div></div>
        <div style="text-align:center;margin-top:8px;font-size:13px">${G.isTouch ? '按住「拉！」' : '按住左鍵 / 空白鍵'} 讓綠框往上</div>`, { keepLock: true, side: true });
      p.style.pointerEvents = 'none'; p.style.width = 'auto';
      L.drawReel();
    };
    L.drawReel = () => {
      const R = L.reel, H = G.$('fBar').clientHeight;
      G.$('fZone').style.bottom = (R.z * H) + 'px'; G.$('fZone').style.height = (R.zone * H) + 'px';
      G.$('fIcon').style.bottom = (R.f * H - 13) + 'px';
      G.$('fProg').style.height = (G.clamp(R.prog, 0, 1) * 100) + '%';
    };
  };

  // ======================= 13. 刀刃球 (Blade Ball) =======================
  G.LEVELS.push({
    name: '刀刃球', insp: 'Blade Ball', obj: '球變紅色飛向你時，在它靠近的瞬間按「格擋」把它打回去！讓其他 3 個人都被球打中就贏了。',
    ctrl: 'WASD 移動・左鍵 或 F 格擋（不要亂按，有冷卻）・空白鍵 跳',
    ctrlTouch: '左邊搖桿移動・球靠近時按「格擋」',
    build(L) {
      G.setSky({ color: 0x1a1030, fog: [50, 120], hemi: 0.85, hemiSky: 0xd0c0ff });
      G.ground(60, '#2a2440', '#3a3258');
      const disc = G.mesh('cyl', 0x4a3f7a, 0, 0.02, 0, 40, 0.04, 40, { noShadow: true }); disc.userData.noHit = true;
      const disc2 = G.mesh('cyl', 0x5d4f9a, 0, 0.04, 0, 30, 0.04, 30, { noShadow: true }); disc2.userData.noHit = true;
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; G.box(Math.cos(a) * 21, 0, Math.sin(a) * 21, 3, 1.5, 3, i % 2 ? 0xff3b6b : 0x3b9bff); }
      L.ball = G.mesh('sph', 0xffffff, 0, 3, 0, 0.9, undefined, undefined, { emissive: 0x444444 }); L.ball.userData.noHit = true;
      L.ballLight = new THREE.PointLight(0xff3030, 0, 10); L.ball.add(L.ballLight);
      const sw = new THREE.Group(); G.part(sw, 0, 0, 0, 0.1, 0.1, 1.6, 0x9ff3ff, { emissive: 0x2a6a77 }); G.part(sw, 0, 0, -0.75, 0.3, 0.1, 0.1, 0x333333);
      sw.position.set(0, -0.85, 0.6); G.player.mesh.userData.P.aR.add(sw); L.sword = sw;
      L.spawn.set(0, 0, 10); L.spawnYaw = 0;
      G.setButtons({ act: '格擋', e: null });
      L.reset = () => {
        (L.bots || []).forEach(b => G.removeNPC(b));
        L.bots = [];
        const cols = [0xff4b4b, 0x2fd06a, 0xffd23f];
        ['小刀', '阿劍', '球王'].forEach((nm, i) => {
          const a = i / 3 * Math.PI * 2 + 0.5;
          const b = G.makeNPC({ name: nm, shirt: cols[i], pos: new V(Math.cos(a) * 10, 0, Math.sin(a) * 10) });
          const s2 = new THREE.Group(); G.part(s2, 0, 0, 0, 0.1, 0.1, 1.6, 0xffb0b0, { emissive: 0x552222 }); s2.position.set(0, -0.85, 0.6); b.mesh.userData.P.aR.add(s2);
          b.data = { wp: new V(G.rand(-14, 14), 0, G.rand(-14, 14)), parry: 0, rolled: false, ok: false };
          L.bots.push(b);
        });
        L.parry = 0; L.pcd = 0; L.speed = 14; L.target = null; L.wait = 2;
        L.ball.position.set(0, 3, 0); L.vel = new V();
      };
      L.reset();
    },
    cleanup(L) { if (L.sword) G.player.mesh.userData.P.aR.remove(L.sword); },
    update(dt, L) {
      const p = G.player;
      const alive = L.bots.filter(b => b.alive);
      L.pcd -= dt; L.parry -= dt;
      if ((G.in.actP || G.in.fP) && L.pcd <= 0 && !G.dying) {
        L.parry = 0.4; L.pcd = 0.65; G.sfx('swing');
        // instant deflect if the ball is already close enough when you swing
        if (L.target === 'player' && L.wait <= 0 && L.ball.position.distanceTo(p.pos.clone().add(new V(0, 1.3, 0))) < 3.2 + L.speed * 0.07) { L.deflect(); L.pcd = 0.25; }
        p.mesh.userData.armPose = true; p.mesh.userData.P.aR.rotation.x = -2.2; L.armT = 0.25;
        G.ring(p.pos.clone().setY(1.2), 0x9ff3ff, 2.4, 0.25);
      }
      if (L.armT > 0) { L.armT -= dt; if (L.armT <= 0) p.mesh.userData.armPose = false; }
      for (const b of alive) {
        const d = G.npcSeek(b, b.data.wp, 5, dt);
        if (d < 1 || b.hitWall) b.data.wp = new V(G.rand(-15, 15), 0, G.rand(-15, 15));
        b.data.parry -= dt;
      }
      // ball
      const B = L.ball;
      if (L.wait > 0) {
        L.wait -= dt; B.position.y = 3 + Math.sin(L.t * 4) * 0.3;
        if (L.wait <= 0) L.pickTarget(G.pick(['player', ...alive]));
      } else if (L.target && !G.dying) {
        const tp = L.target === 'player' ? p.pos : L.target.pos;
        const aim = tp.clone().add(new V(0, 1.3, 0));
        const to = aim.clone().sub(B.position); const d = to.length();
        const turn = 2.2 + L.speed * 0.06;
        L.vel.lerp(to.normalize().multiplyScalar(L.speed), Math.min(1, dt * turn));
        B.position.addScaledVector(L.vel, dt);
        if (B.position.y < 0.6) B.position.y = 0.6;
        // bots decide once per approach
        if (L.target !== 'player') {
          const b = L.target;
          if (!b.data.rolled && d < 2.2 + L.speed * 0.06) {
            b.data.rolled = true; b.data.ok = Math.random() < G.clamp(1.04 - L.speed * 0.012, 0.3, 0.97);
            if (b.data.ok) { b.data.parry = 0.3; b.mesh.userData.armPose = true; b.mesh.userData.P.aR.rotation.x = -2.2; G.after(0.25, () => b.mesh.userData.armPose = false); }
          }
        }
        if (d < 1.25) {
          const parried = L.target === 'player' ? L.parry > 0 : L.target.data.parry > 0;
          if (parried) L.deflect();
          else if (L.target === 'player') { G.die('被球打中了！'); }
          else {
            G.killNPC(L.target); G.hud.toast(`${L.target.name} 出局！`);
            const left = L.bots.filter(b => b.alive).length;
            if (!left) { G.after(0.8, () => G.complete('最後的倖存者！⚔️')); L.target = null; }
            else { L.target = null; L.wait = 1.5; L.speed = Math.max(14, L.speed * 0.6); B.position.set(0, 3, 0); L.vel.set(0, 0, 0); }
          }
        }
      }
      const mine = L.target === 'player';
      B.material = mine ? G.mat(0xff2020, { emissive: 0xaa0000 }) : G.mat(0xffffff, { emissive: 0x444444 });
      L.ballLight.intensity = mine ? 2 : 0;
      G.hud.prog(`剩下對手 ${alive.length}　球速 ${Math.round(L.speed)}`);
      G.hud.extra(`<span class="pill">${L.pcd > 0 ? '格擋冷卻中…' : '⚔️ 可以格擋'}</span>`);
    },
    respawn(L) { L.reset(); }
  });
  const lv13 = G.LEVELS[G.LEVELS.length - 1], b13 = lv13.build;
  lv13.build = function (L) {
    b13(L);
    L.deflect = () => {
      const B = L.ball;
      G.sfx('parry'); G.ring(B.position.clone(), 0xffffff, 3, 0.3);
      L.speed = Math.min(70, L.speed + 3);
      const alive = L.bots.filter(b => b.alive);
      const others = ['player', ...alive].filter(x => x !== L.target);
      L.pickTarget(G.pick(others));
      L.vel.multiplyScalar(-0.2).add(new V(0, 6, 0));
    };
    L.pickTarget = (t) => {
      L.target = t;
      if (t === 'player') { G.sfx('alarm'); }
      else t.data.rolled = false;
    };
  };

  // ======================= 14. 最強戰場 (The Strongest Battlegrounds) =======================
  G.LEVELS.push({
    name: '最強戰場', insp: 'The Strongest Battlegrounds', obj: '用拳頭連擊和技能，打倒 2 個對手！按住防禦可以減少傷害。',
    ctrl: '左鍵 連擊・Q 衝刺拳・E 升龍拳・按住 F 或右鍵 防禦・空白鍵 跳',
    ctrlTouch: '「攻擊」連擊・「衝刺」衝刺拳・「升龍」升龍拳・按住「防禦」',
    build(L) {
      G.setSky({ color: 0xffc58a, fog: [60, 150], hemiSky: 0xfff0d0 });
      G.ground(80, '#8f8a7a', '#827d6e');
      G.box(0, -0.98, 0, 40, 1, 40, 0x6a8f5a, { solid: false });
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; G.box(Math.cos(a) * 26, 0, Math.sin(a) * 26, G.rand(3, 6), G.rand(3, 9), G.rand(3, 6), 0x7d7666); }
      for (let i = 0; i < 6; i++) G.box(G.rand(-18, 18), 0, G.rand(-18, 18), G.rand(1.5, 3), G.rand(1, 2), G.rand(1.5, 3), 0x9a9384);
      L.spawn.set(0, 0, 10); L.spawnYaw = 0;
      G.player.maxHp = 150; G.player.faceCam = true;
      G.hud.hp(true);
      G.setButtons({ act: '攻擊', q: '衝刺', e: '升龍', f: '防禦' });
      L.foes = [
        { name: '拳擊手 阿強', hp: 220, dmg: 7, sp: 6.2, shirt: 0xd93636, sword: false, block: 0.3, dash: [4, 7], atk: 0.42 },
        { name: '劍士 小風', hp: 170, dmg: 5.5, sp: 5.6, shirt: 0x2fb3b3, sword: true, block: 0.15, dash: [7, 11], atk: 0.6 },
      ];
      L.fi = 0; L.combo = 0; L.cd = 0; L.qcd = 0; L.ecd = 0; L.comboT = 0;
      L.spawnFoe = () => {
        const f = L.foes[L.fi];
        const n = G.makeNPC({ shirt: f.shirt, pants: 0x222222, skin: 0xf2c48d, hp: f.hp, pos: new V(0, 0, -8), face: 'angry', hair: 0x111111 });
        if (f.sword) G.part(n.mesh.userData.P.aR, 0, -0.95, 0.5, 0.1, 0.1, 1.4, 0xcfe8ff);
        n.data = { cd: 1, stun: 0, block: 0, dash: 3, combo: 0, f };
        n.onHit = (dmg) => { if (n.data.block > 0) { G.floatText(n.pos.clone().add(new V(0, 2.8, 0)), '格擋', '#9fd0ff'); n.hp -= dmg * 0.2; if (n.hp <= 0) G.killNPC(n); return false; } n.data.stun = 0.3; };
        n.onDeath = () => {
          G.hud.boss(null);
          L.fi++;
          if (L.fi >= L.foes.length) G.after(0.8, () => G.complete('最強的人就是你！👊'));
          else { G.hud.big('下一個對手！', '#ffd23f', 1500); G.after(1.8, () => { G.removeNPC(n); L.spawnFoe(); }); }
        };
        L.foe = n;
        G.hud.toast(`${f.name} 上場了！`);
      };
    },
    start(L) { L.spawnFoe(); },
    update(dt, L) {
      const p = G.player, P = p.mesh.userData.P;
      L.cd -= dt; L.qcd -= dt; L.ecd -= dt; L.comboT -= dt;
      if (L.comboT <= 0) L.combo = 0;
      p.blocking = G.in.fH && !G.dying;
      p.slow = p.blocking ? 0.4 : 1;
      if (L.armT > 0) { L.armT -= dt; if (L.armT <= 0) p.mesh.userData.armPose = false; }
      if (p.blocking) { p.mesh.userData.armPose = true; P.aL.rotation.x = -1.5; P.aR.rotation.x = -1.5; L.armT = 0.05; }
      const n = L.foe;
      const front = (range, dot = 0.25) => {
        if (!n || !n.alive) return false;
        const to = n.pos.clone().sub(p.pos).setY(0); const d = to.length();
        return d < range && to.normalize().dot(G.forward(G.cam.yaw)) > dot;
      };
      if (!p.blocking && !G.dying) {
        if (G.in.actH && L.cd <= 0) {
          L.combo = L.combo % 4 + 1; L.comboT = 1; L.cd = L.combo === 4 ? 0.55 : 0.3; G.sfx('swing');
          p.mesh.userData.armPose = true; (L.combo % 2 ? P.aR : P.aL).rotation.x = -1.7; L.armT = 0.18;
          if (front(2.8)) {
            G.hitNPC(n, L.combo === 4 ? 16 : 8); G.sfx('hit');
            if (L.combo === 4 && n.data.block <= 0) { const kb = G.forward(G.cam.yaw); n.vel.set(kb.x * 18, 7, kb.z * 18); n.data.stun = 0.9; G.ring(n.pos.clone().setY(1), 0xffffff, 3); }
          }
        }
        if (G.in.qP && L.qcd <= 0) {
          L.qcd = 4; G.sfx('boom'); const f = G.forward(G.cam.yaw);
          p.vel.x = f.x * 30; p.vel.z = f.z * 30; p.invuln = 0.3;
          G.burst(p.pos.clone().setY(1), 0xffd23f, 10);
          G.after(0.18, () => { if (front(3.6, 0)) { G.hitNPC(n, 24); const kb = G.forward(G.cam.yaw); n.vel.set(kb.x * 14, 6, kb.z * 14); n.data.stun = 0.7; } });
          p.mesh.userData.armPose = true; P.aR.rotation.x = -1.6; L.armT = 0.35;
        }
        if (G.in.eP && L.ecd <= 0) {
          L.ecd = 6; G.sfx('boom'); p.vel.y = 12; G.ring(p.pos.clone().setY(0.3), 0xffa040, 4);
          if (n && n.alive && G.dist2(n.pos, p.pos) < 3.5) { G.hitNPC(n, 22); n.vel.y = 15; n.data.stun = 1.1; }
          p.mesh.userData.armPose = true; P.aR.rotation.x = -3; L.armT = 0.4;
        }
      }
      // foe AI
      if (n && n.alive) {
        const f = n.data.f, D = n.data;
        D.cd -= dt; D.stun -= dt; D.block -= dt; D.dash -= dt;
        G.hud.boss(f.name, n.hp / n.maxHp);
        const d = G.dist2(n.pos, p.pos);
        if (D.stun > 0) { G.moveEntity(n, dt); n.vel.x *= 0.9; n.vel.z *= 0.9; G.syncNPC(n, dt, 0); }
        else if (G.dying) { G.npcSeek(n, n.pos, 0, dt); }
        else {
          if (G.in.actP && d < 3 && Math.random() < f.block) D.block = 0.6;
          if (D.block > 0) { n.mesh.userData.armPose = true; n.mesh.userData.P.aL.rotation.x = -1.5; n.mesh.userData.P.aR.rotation.x = -1.5; G.npcSeek(n, p.pos, 1.5, dt, { stop: 2 }); }
          else {
            n.mesh.userData.armPose = false;
            if (d > 6 && d < 13 && D.dash <= 0) {
              D.dash = G.rand(f.dash[0], f.dash[1]); const to = p.pos.clone().sub(n.pos).setY(0).normalize();
              n.vel.set(to.x * 26, 2, to.z * 26); D.stun = 0.25; G.sfx('swing');
              G.after(0.2, () => { if (n.alive && G.dist2(n.pos, p.pos) < 3) { G.damage(f.dmg * 2); const kb = p.pos.clone().sub(n.pos).setY(0).normalize(); p.vel.set(kb.x * 12, 5, kb.z * 12); } });
            } else G.npcSeek(n, p.pos, f.sp, dt, { stop: 1.8 });
            if (d < 2.6 && D.cd <= 0) {
              D.combo = D.combo % 4 + 1; D.cd = D.combo === 4 ? 1.3 : f.atk;
              n.mesh.userData.armPose = true; (D.combo % 2 ? n.mesh.userData.P.aR : n.mesh.userData.P.aL).rotation.x = -1.7;
              G.after(0.15, () => { if (n.mesh) n.mesh.userData.armPose = false; });
              G.damage(D.combo === 4 ? f.dmg * 1.8 : f.dmg); G.sfx('hit');
              if (D.combo === 4 && !p.blocking) { const kb = p.pos.clone().sub(n.pos).setY(0).normalize(); p.vel.set(kb.x * 16, 6, kb.z * 16); }
            }
          }
          n.yaw = Math.atan2(p.pos.x - n.pos.x, p.pos.z - n.pos.z); G.syncNPC(n);
        }
      }
      G.hud.extra(`<span class="pill">Q 衝刺 ${L.qcd > 0 ? Math.ceil(L.qcd) + 's' : '✔'}</span><br><span class="pill">E 升龍 ${L.ecd > 0 ? Math.ceil(L.ecd) + 's' : '✔'}</span>`);
      G.hud.prog(`對手 ${Math.min(L.fi + 1, 2)} / 2　連擊 ${L.combo}`);
    },
    respawn(L) { if (L.foe && L.foe.alive) { L.foe.hp = L.foe.maxHp; L.foe.pos.set(0, 0, -8); } }
  });

  // ======================= 15. 兵工廠 (Arsenal) =======================
  const LADDER = [
    { name: '手槍', kind: 'pistol', rate: 0.25, dmg: 30, spread: 0.01, adsSpread: 0.002, mag: 12, reloadT: 1.1, auto: false, kick: 0.06, recoil: 0.012 },
    { name: '衝鋒槍', kind: 'smg', rate: 0.075, dmg: 15, spread: 0.03, adsSpread: 0.012, mag: 35, reloadT: 1.4, auto: true, kick: 0.035, recoil: 0.005 },
    { name: '霰彈槍', kind: 'shotgun', rate: 0.75, dmg: 16, pellets: 8, spread: 0.06, adsSpread: 0.035, mag: 6, reloadT: 1.8, auto: false, range: 40, kick: 0.14, recoil: 0.03 },
    { name: '狙擊槍', kind: 'sniper', rate: 1.1, dmg: 130, spread: 0.07, adsSpread: 0, scope: true, mag: 5, reloadT: 2, auto: false, range: 250, kick: 0.16, recoil: 0.035 },
    { name: '火箭筒', kind: 'rocket', rate: 1.2, proj: true, dmg: 150, aoe: 4, speed: 42, mag: 1, reloadT: 1.3, auto: false, kick: 0.15, recoil: 0.03, adsFov: 60 },
    { name: '金色小刀', kind: 'knife', melee: true, rate: 0.45, dmg: 100, range: 3.2 },
  ];
  G.LEVELS.push({
    name: '兵工廠', insp: 'Arsenal', obj: '每擊殺一次就換下一把武器：手槍→衝鋒槍→霰彈槍→狙擊槍→火箭筒→小刀。用金色小刀擊殺就贏了！',
    ctrl: 'WASD 移動・滑鼠 瞄準・左鍵 射擊・按住右鍵 瞄準（狙擊槍會開鏡）・R 換彈・空白鍵 跳',
    ctrlTouch: '左邊搖桿移動・右邊拖曳瞄準・按住「射擊」・按「瞄準」開鏡',
    build(L) {
      G.setSky({ color: 0xa0b8c8, fog: [50, 130], hemiSky: 0xe8f0ff });
      G.cam.mode = 'first';
      G.ground(80, '#5a5f6a', '#666b77');
      const wc = 0x3f4450;
      G.box(0, 0, -30, 62, 8, 2, wc); G.box(0, 0, 30, 62, 8, 2, wc); G.box(-30, 0, 0, 2, 8, 62, wc); G.box(30, 0, 0, 2, 8, 62, wc);
      const cont = [0xd93636, 0x2f7de1, 0x2fae5a, 0xff8a1a, 0x8a4fd9];
      const C = [[-18, -18, 1], [18, 18, 1], [-18, 14, 0], [18, -14, 0], [0, -20, 0], [0, 20, 0], [-8, 0, 1], [8, 0, 1], [-22, 0, 0], [22, 0, 0]];
      C.forEach(([x, z, r], i) => { r ? G.box(x, 0, z, 3, 3, 8, cont[i % 5]) : G.box(x, 0, z, 8, 3, 3, cont[i % 5]); });
      G.box(-18, 3, -18, 3, 3, 8, 0x8a93a8); G.box(18, 3, 18, 3, 3, 8, 0x8a93a8);
      for (let i = 0; i < 10; i++) G.box(G.rand(-25, 25), 0, G.rand(-25, 25), 1.4, 1.4, 1.4, 0x9b6a3c);
      G.box(-18, 0, -12.5, 3, 1.5, 3, 0x9b6a3c); G.box(18, 0, 12.5, 3, 1.5, 3, 0x9b6a3c);
      L.spawn.set(0, 0, 25); L.spawnYaw = 0;
      L.spots = [new V(-25, 0, -25), new V(25, 0, -25), new V(-25, 0, 25), new V(25, 0, 25), new V(0, 0, -26), new V(-26, 0, 0), new V(26, 0, 0)];
      L.wi = 0; L.mag = LADDER[0].mag; L.reload = 0;
      G.hud.cross(true); G.hud.hp(true);
      G.setButtons({ act: '射擊', e: null });
      L.bots = [];
      L.equip = () => { const w = LADDER[L.wi]; G.fps.makeGun(w.kind, 0xffd23f); G.setButtons({ act: '射擊', e: null, f: w.melee ? null : (w.scope ? '開鏡' : '瞄準') }); L.mag = w.mag || 0; L.reload = 0; G.hud.prog(`武器 ${L.wi + 1} / 6：${w.name}`); };
      L.spawnBot = (i) => {
        const free = L.spots.filter(sp => !L.bots.some(b => b && b.alive && G.dist2(b.pos, sp) < 6)).sort((a, b) => G.dist2(b, G.player.pos) - G.dist2(a, G.player.pos));
        const far = (free[G.randi(0, Math.min(2, free.length - 1))] || G.pick(L.spots)).clone().add(new V(G.rand(-1.5, 1.5), 0, G.rand(-1.5, 1.5)));
        const n = G.makeNPC({ name: ['紅狼', '藍鷹', '綠蛇', '黃虎'][i], shirt: [0xd93636, 0x2f7de1, 0x2fae5a, 0xffd23f][i], pants: 0x222222, skin: 0xf2c48d, hp: 100, bar: true, pos: far.clone() });
        G.fps.botGun(n, G.pick(['ar', 'smg', 'shotgun', 'pistol']), [0xd93636, 0x2f7de1, 0x2fae5a, 0xffd23f][i]);
        n.data.seed = Math.random() * 10;
        n.onDeath = () => {
          if (L.wi >= LADDER.length - 1) { G.after(0.6, () => G.complete('金刀擊殺！遊戲勝利！🔪')); L.wi = 99; return; }
          L.wi++; G.hud.big('升級：' + LADDER[L.wi].name, '#ffd23f', 1200); L.equip();
          G.after(2, () => { G.removeNPC(n); L.bots[i] = null; if (G.levelIdx >= 0 && L.wi < 99) L.spawnBot(i); });
        };
        L.bots[i] = n;
      };
      L.equip();
    },
    start(L) { for (let i = 0; i < 4; i++) L.spawnBot(i); },
    update(dt, L) {
      if (L.wi > 5) return;
      const w = LADDER[L.wi];
      G.fps.tick(dt, w);
      if (!G.dying && (w.auto ? G.in.actH : G.in.actP)) G.fps.fire(w);
      for (const b of L.bots) if (b && b.alive) G.fps.bot(b, dt, { speed: 5.6, rate: 0.6, acc: 0.25, dmg: 7, keep: 13 });
    },
    respawn(L) {
      L.mag = LADDER[Math.min(L.wi, 5)].mag || 0; L.reload = 0;
      for (const b of L.bots) if (b && b.alive && G.dist2(b.pos, G.player.pos) < 14) { b.pos.copy(G.pick(L.spots)); }
    }
  });
})();
