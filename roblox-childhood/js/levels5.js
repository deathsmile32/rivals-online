// New levels: 偷蛋大作戰 (Steal an Egg), +1 速度鍵盤 (+1 Speed Keyboard Escape), 被遺棄 (Forsaken)
'use strict';
(function () {
  const V = THREE.Vector3;

  // ======================= 偷蛋大作戰 (Steal An Egg) =======================
  const BIOMES = [
    { id: 'grass', name: '草原巢', guard: '大母雞', pos: new V(-26, 0, -6), ground: 0x6cbf5a, egg: 0xfff3d6, spot: 0x9bd16a, pet: '小雞', income: 3, sp: 5.6, wake: 1.3, give: 20 },
    { id: 'desert', name: '沙漠巢', guard: '沙漠蜥蜴', pos: new V(26, 0, -14), ground: 0xe8c97a, egg: 0xf2c48d, spot: 0xc98a4b, pet: '小蜥蜴', income: 7, sp: 7, wake: 1.0, give: 22 },
    { id: 'volcano', name: '火山巢', guard: '火山龍', pos: new V(0, 0, -46), ground: 0x4a2a24, egg: 0xff5a1a, spot: 0xffd23f, pet: '小火龍', income: 15, sp: 8.3, wake: 0.8, give: 24 },
  ];
  function guardMesh(id) {
    const g = new THREE.Group();
    if (id === 'grass') {
      G.part(g, 0, 1.6, 0, 1.6, 1.4, 2, 0xffffff); G.part(g, 0, 2.7, 0.8, 0.9, 0.9, 0.9, 0xffffff);
      G.part(g, 0, 3.3, 0.8, 0.2, 0.4, 0.6, 0xe82a2a); G.part(g, 0, 2.6, 1.35, 0.35, 0.2, 0.4, 0xffb020);
      G.part(g, -0.25, 2.85, 1.26, 0.12, 0.12, 0.02, 0x111111); G.part(g, 0.25, 2.85, 1.26, 0.12, 0.12, 0.02, 0x111111);
      G.part(g, -0.9, 1.7, 0, 0.2, 0.9, 1.4, 0xf0f0f0); G.part(g, 0.9, 1.7, 0, 0.2, 0.9, 1.4, 0xf0f0f0);
      G.part(g, -0.4, 0.45, 0, 0.15, 0.9, 0.15, 0xffb020); G.part(g, 0.4, 0.45, 0, 0.15, 0.9, 0.15, 0xffb020);
    } else if (id === 'desert') {
      G.part(g, 0, 0.9, 0, 1.2, 0.8, 2.6, 0x7fae3a); G.part(g, 0, 1.0, 1.7, 0.9, 0.6, 1, 0x7fae3a);
      G.part(g, 0, 0.75, -2.1, 0.5, 0.4, 1.6, 0x6f9e2a); G.part(g, 0, 0.6, -3.1, 0.3, 0.25, 1, 0x6f9e2a);
      G.part(g, -0.3, 1.25, 2.2, 0.15, 0.15, 0.02, 0xffd23f, { emissive: 0x554400 }); G.part(g, 0.3, 1.25, 2.2, 0.15, 0.15, 0.02, 0xffd23f, { emissive: 0x554400 });
      for (const [x, z] of [[-0.7, 0.8], [0.7, 0.8], [-0.7, -0.8], [0.7, -0.8]]) G.part(g, x, 0.3, z, 0.3, 0.6, 0.3, 0x5f8e2a);
      for (let i = 0; i < 5; i++) G.part(g, 0, 1.4, 1 - i * 0.5, 0.1, 0.3, 0.2, 0xc98a4b);
    } else {
      G.part(g, 0, 2, 0, 2, 1.8, 3.2, 0xb8261c); G.part(g, 0, 3.4, 2, 1.4, 1.2, 1.6, 0xb8261c); G.part(g, 0, 3.0, 2.9, 1, 0.6, 0.6, 0xa01e16);
      G.part(g, -0.4, 3.7, 2.82, 0.2, 0.2, 0.02, 0xffd23f, { emissive: 0xaa7700 }); G.part(g, 0.4, 3.7, 2.82, 0.2, 0.2, 0.02, 0xffd23f, { emissive: 0xaa7700 });
      G.part(g, -0.5, 4.2, 1.7, 0.2, 0.7, 0.2, 0x333333); G.part(g, 0.5, 4.2, 1.7, 0.2, 0.7, 0.2, 0x333333);
      const w1 = G.part(g, -2, 3, 0, 2.6, 0.1, 1.8, 0x7a1a12); w1.rotation.z = 0.35; const w2 = G.part(g, 2, 3, 0, 2.6, 0.1, 1.8, 0x7a1a12); w2.rotation.z = -0.35;
      G.part(g, 0, 1.6, -2.4, 0.8, 0.7, 2, 0xb8261c); G.part(g, 0, 1.4, -3.6, 0.4, 0.4, 1.2, 0xa01e16);
      for (const [x, z] of [[-0.8, 1], [0.8, 1], [-0.8, -1], [0.8, -1]]) G.part(g, x, 0.55, z, 0.5, 1.1, 0.5, 0x8a1a12);
      for (let i = 0; i < 4; i++) G.part(g, 0, 3.0, 1 - i * 0.6, 0.15, 0.4, 0.3, 0xffd23f);
    }
    return g;
  }
  function eggMesh(b) {
    const g = new THREE.Group();
    G.mesh('sph', b.egg, 0, 0.55, 0, 0.8, 1.05, 0.8, { parent: g, emissive: b.id === 'volcano' ? 0x551100 : 0 });
    for (let i = 0; i < 5; i++) G.mesh('sph', b.spot, Math.cos(i * 1.3) * 0.36, 0.4 + (i % 3) * 0.2, Math.sin(i * 1.3) * 0.36, 0.16, undefined, undefined, { parent: g });
    G.world.add(g); return g;
  }
  function petMesh(b) {
    const g = new THREE.Group();
    const c = b.id === 'grass' ? 0xffe14d : b.id === 'desert' ? 0x8fcf4a : 0xff5a3a;
    G.part(g, 0, 0.5, 0, 0.7, 0.6, 0.8, c); G.part(g, 0, 1.0, 0.25, 0.55, 0.5, 0.5, c);
    G.part(g, -0.12, 1.08, 0.51, 0.08, 0.08, 0.02, 0x111111); G.part(g, 0.12, 1.08, 0.51, 0.08, 0.08, 0.02, 0x111111);
    if (b.id === 'grass') G.part(g, 0, 0.98, 0.56, 0.18, 0.08, 0.14, 0xff8a1a);
    if (b.id === 'volcano') { G.part(g, -0.45, 0.8, 0, 0.4, 0.06, 0.4, 0xa01e16); G.part(g, 0.45, 0.8, 0, 0.4, 0.06, 0.4, 0xa01e16); }
    G.part(g, -0.2, 0.15, 0, 0.15, 0.3, 0.15, c); G.part(g, 0.2, 0.15, 0, 0.15, 0.3, 0.15, c);
    G.world.add(g); return g;
  }
  G.LEVELS.push({
    name: '偷蛋大作戰', insp: 'Steal An Egg', obj: '從守衛的巢偷蛋搬回基地孵成寵物，寵物會幫你賺錢，用錢升級速度！孵出 5 隻寵物、其中 1 隻是火山龍蛋就過關。',
    build(L) {
      G.setSky({ color: 0x9fd8ff, fog: [80, 200] });
      G.ground(130, '#7cc46a', '#73b862');
      // base
      L.home = new V(0, 0, 40);
      G.box(0, 0, 40, 18, 0.3, 14, 0x2f7de1);
      G.box(-9, 0.3, 40, 0.5, 1.2, 14, 0x1d5bb0); G.box(9, 0.3, 40, 0.5, 1.2, 14, 0x1d5bb0); G.box(0, 0.3, 47, 18, 1.2, 0.5, 0x1d5bb0);
      G.label('你的基地', { pos: new V(0, 4.5, 40), scale: 1.5, color: '#9fd0ff' });
      L.slots = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const p = new V(-6 + c * 4, 0.3, 41 + r * 3.6); G.box(p.x, 0.3, p.z, 1.8, 0.35, 1.8, 0xffffff); L.slots.push({ pos: p.clone().setY(0.65), pet: null }); }
      // speed upgrade pad
      L.lvl = 0; L.money = 10;
      G.box(-12.5, 0, 34, 3, 0.4, 3, 0xffd23f, { emissive: 0x554400 });
      L.upLabel = G.label('⚡ 升級速度', { pos: new V(-12.5, 3, 34), scale: 1 });
      G.interact(new V(-12.5, 0, 34), 2.6, () => L.lvl >= 5 ? '速度已經滿級' : `速度 +1（$${L.cost()}）`, () => {
        if (L.lvl >= 5) return;
        if (L.money < L.cost()) { G.hud.toast(`錢不夠！需要 $${L.cost()}`); return; }
        L.money -= L.cost(); L.lvl++; G.sfx('win'); G.ring(G.player.pos.clone().setY(0.4), 0xffd23f, 3);
        G.hud.toast(`速度升到 Lv.${L.lvl}！`);
      });
      L.cost = () => 15 * Math.pow(2, L.lvl);
      // biomes
      L.eggs = []; L.guards = [];
      BIOMES.forEach((b, bi) => {
        G.box(b.pos.x, -0.98, b.pos.z, 26, 1, 22, b.ground, { solid: false });
        if (b.id === 'volcano') {
          for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; G.box(b.pos.x + Math.cos(a) * 12, 0, b.pos.z + Math.sin(a) * 9, 3, G.rand(2, 5), 3, 0x3a1e1a); }
          for (let i = 0; i < 6; i++) G.box(b.pos.x + G.rand(-10, 10), 0.02, b.pos.z + G.rand(-8, 8), G.rand(1, 3), 0.05, G.rand(1, 3), 0xff5a1a, { emissive: 0xaa2200, solid: false });
        } else if (b.id === 'desert') {
          for (let i = 0; i < 6; i++) { const x = b.pos.x + G.rand(-11, 11), z = b.pos.z + G.rand(-9, 9); G.box(x, 0, z, 0.7, 2.6, 0.7, 0x4caf50); G.box(x - 0.6, 1.2, z, 0.5, 0.3, 0.4, 0x4caf50); }
        } else {
          for (let i = 0; i < 8; i++) { const x = b.pos.x + G.rand(-12, 12), z = b.pos.z + G.rand(-10, 10); G.mesh('sph', 0xff8ad8, x, 0.3, z, 0.5); }
        }
        // nest
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const s = G.mesh('box', 0xc9a066, b.pos.x + Math.cos(a) * 2.6, 0.25, b.pos.z + Math.sin(a) * 2.6, 1.4, 0.5, 0.5); s.rotation.y = -a; }
        G.label(b.name, { pos: b.pos.clone().add(new V(0, 6, 0)), scale: 1.4 });
        for (let k = 0; k < 3; k++) {
          const a = k / 3 * Math.PI * 2;
          const home = b.pos.clone().add(new V(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2));
          const m = eggMesh(b); m.position.copy(home);
          const egg = { b, bi, m, home, state: 'nest', cd: 0 };
          L.eggs.push(egg);
          G.interact(() => egg.m.position, 2.2, `偷走 ${b.name.replace('巢', '')}蛋`, () => {
            if (L.carry) return;
            egg.state = 'carried'; L.carry = egg; G.sfx('pop'); G.hud.toast('快跑回基地！');
          }, () => egg.state === 'nest' && !L.carry);
        }
        const gm = guardMesh(b.id);
        const gd = G.makeNPC({ mesh: gm, pos: b.pos.clone().add(new V(0, 0, -5)) });
        gd.hw = b.id === 'volcano' ? 1.3 : 0.9; gd.h = b.id === 'volcano' ? 4 : 3;
        gd.data = { b, state: 'sleep', t: 0 };
        gd.zz = G.label('💤', { parent: gm, scale: 1.2, bg: null }); gd.zz.position.set(0, b.id === 'volcano' ? 5.5 : 4, 0);
        gd.alert = G.label('❗', { parent: gm, scale: 1.4, bg: null }); gd.alert.position.copy(gd.zz.position); gd.alert.visible = false;
        G.label(b.guard, { parent: gm, scale: 0.8 }).position.set(0, b.id === 'volcano' ? 6.6 : 5, 0);
        L.guards.push(gd);
      });
      L.carry = null; L.pets = 0; L.dragons = 0;
      L.spawn.set(0, 0.3, 38); L.spawnYaw = 0;
      G.setButtons({ act: null, e: '偷/放' });
    },
    update(dt, L) {
      const p = G.player;
      p.speed = 7 + L.lvl * 1.2; p.slow = L.carry ? 0.85 : 1;
      // income
      for (const s of L.slots) if (s.pet && s.pet.ready) { L.money += s.pet.b.income * dt; s.pet.m.rotation.y += dt; }
      // carry & deposit
      if (L.carry) {
        L.carry.m.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z);
        if (Math.abs(p.pos.x - L.home.x) < 9 && Math.abs(p.pos.z - L.home.z) < 7) {
          const egg = L.carry;
          let slot = L.slots.find(s => !s.pet);
          if (!slot) { slot = L.slots.filter(s => s.pet.ready).sort((a, b) => a.pet.b.income - b.pet.b.income)[0]; if (slot) { G.world.remove(slot.pet.m); slot.pet = null; } }
          L.carry = null;
          if (slot) {
            const pet = { b: egg.b, egg: eggMesh(egg.b), t: 0, ready: false };
            pet.egg.position.copy(slot.pos); slot.pet = pet; G.sfx('coin');
            G.hud.toast(`${egg.b.name.replace('巢', '')}蛋放好了，孵化中…`);
          }
          egg.state = 'gone'; egg.cd = 8; egg.m.visible = false;
        }
      }
      for (const s of L.slots) {
        const pet = s.pet; if (!pet || pet.ready) continue;
        pet.t += dt; pet.egg.rotation.z = Math.sin(pet.t * 18) * 0.15;
        if (pet.t > 2) {
          G.world.remove(pet.egg); pet.m = petMesh(pet.b); pet.m.position.copy(s.pos); pet.ready = true;
          G.burst(s.pos.clone().setY(1), pet.b.egg, 16); G.sfx('win');
          G.label(`${pet.b.pet} +$${pet.b.income}/秒`, { pos: s.pos.clone().add(new V(0, 2, 0)), scale: 0.6, color: '#ffd23f' });
          L.pets++; if (pet.b.id === 'volcano') L.dragons++;
          G.hud.big(`孵出 ${pet.b.pet}！`, '#ffd23f', 1400);
          if (L.pets >= 5 && L.dragons >= 1) G.after(1.2, () => G.complete('寵物大亨！🥚'));
          else if (L.pets >= 5) G.hud.toast('還要孵出 1 隻火山龍！去最北邊的火山巢');
        }
      }
      for (const e of L.eggs) if (e.state === 'gone') { e.cd -= dt; if (e.cd <= 0) { e.state = 'nest'; e.m.visible = true; e.m.position.copy(e.home); } }
      // guards
      for (const gd of L.guards) {
        const b = gd.data.b, D = gd.data;
        const near = G.dist2(p.pos, b.pos) < 9;
        const stole = L.carry && L.carry.b === b;
        if (D.state === 'sleep') {
          gd.zz.visible = true; gd.alert.visible = false; G.syncNPC(gd, dt, 0);
          if ((near || stole) && !G.dying) { D.state = 'wake'; D.t = b.wake; G.sfx('alarm'); G.hud.toast(`${b.guard} 醒來了！`); }
        } else if (D.state === 'wake') {
          gd.zz.visible = false; gd.alert.visible = true; D.t -= dt; gd.mesh.position.y = gd.pos.y + Math.abs(Math.sin(L.t * 20)) * 0.3;
          if (D.t <= 0) D.state = 'chase';
        } else if (D.state === 'chase') {
          gd.alert.visible = true;
          G.npcSeek(gd, p.pos, b.sp, dt);
          if (G.dist2(gd.pos, p.pos) < gd.hw + 0.8 && !G.dying) G.die(`被${b.guard}抓到了！`);
          if (G.dist2(gd.pos, b.pos) > b.give || G.dying || (!stole && !near && G.dist2(p.pos, b.pos) > 14)) D.state = 'home';
        } else {
          gd.alert.visible = false;
          const d = G.npcSeek(gd, b.pos.clone().add(new V(0, 0, -5)), b.sp * 0.6, dt);
          if (d < 1) D.state = 'sleep';
          if ((stole || near) && G.dist2(gd.pos, b.pos) < b.give - 4 && !G.dying) D.state = 'chase';
        }
      }
      G.hud.prog(`🐣 寵物 ${L.pets} / 5　🐉 火山龍 ${L.dragons ? '✔' : '✗'}`);
      G.hud.extra(`<span class="pill">💰 $${Math.floor(L.money)}</span><br><span class="pill">⚡ 速度 Lv.${L.lvl}</span>`);
    },
    respawn(L) {
      if (L.carry) { const e = L.carry; e.state = 'nest'; e.m.position.copy(e.home); L.carry = null; }
      for (const gd of L.guards) { gd.pos.copy(gd.data.b.pos).add(new V(0, 0, -5)); gd.data.state = 'sleep'; gd.vel.set(0, 0, 0); }
    }
  });

  // ======================= +1 速度鍵盤 (+1 Speed Keyboard Escape) =======================
  const keyMats = {};
  function keyMat(ch, col) {
    const k = ch + col;
    if (!keyMats[k]) {
      const css = '#' + col.toString(16).padStart(6, '0');
      const t = G.canvasTex(128, 128, (g) => {
        g.fillStyle = css; g.fillRect(0, 0, 128, 128);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(10, 10, 108, 108);
        g.fillStyle = css; g.fillRect(16, 16, 96, 96);
        g.fillStyle = '#222'; g.font = '900 ' + (ch.length > 2 ? 30 : 64) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(ch, 64, 68);
      });
      const side = G.mat(new THREE.Color(col).multiplyScalar(0.7).getHex());
      const top = new THREE.MeshLambertMaterial({ map: t }); top.userData.shared = true;
      keyMats[k] = [side, side, top, side, side, side];
    }
    return keyMats[k];
  }
  const LETTERS = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
  const KCOL = [0xfff3e0, 0xffd6e8, 0xd6f0ff, 0xe0ffd6, 0xfff0b0, 0xe8d6ff];
  G.LEVELS.push({
    name: '+1 速度鍵盤', insp: '+1 Speed Keyboard Escape', obj: '每走一步速度 +1！在跑步機上累積速度，打開需要速度的大門，跳過鍵盤逃出去！最後小心鍵盤怪追你！',
    ctrl: 'WASD 移動（越跑越快）・空白鍵 跳・跑步機上速度加倍・開聲音可以聽到鍵盤 ASMR 🎧',
    build(L) {
      G.setSky({ color: 0xffd6f0, fog: [70, 200], hemiSky: 0xfff0ff });
      const key = (x, y, z, w, d, o = {}) => {
        const ch = o.ch || LETTERS[G.randi(0, LETTERS.length - 1)];
        const m = G.box(x, y, z, w, o.h || 0.8, d, 0xffffff, Object.assign({ mat: keyMat(ch, o.col || G.pick(KCOL)) }, o));
        return m;
      };
      L.key = key;
      // start keyboard
      G.box(0, -2, -6, 26, 2, 22, 0x333a48);
      let n = 0;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) key(-9.5 + c * 3.8 + (r % 2) * 0.8, 0, 2 - r * 3.6, 3.3, 3.2, { ch: LETTERS[n++ % 26], h: 0.5 });
      // treadmills (spacebars)
      L.belts = [];
      const belt = (x, z, len) => {
        G.box(x, -2, z, 5, 2, len + 2, 0x222831);
        const m = key(x, 0, z, 4, len, { ch: 'SPACE', col: 0xffffff, h: 0.5 });
        m.userData.col.tag = 'belt';
        for (let i = 0; i < len / 2; i++) G.box(x, 0.5, z - len / 2 + 1 + i * 2, 3.6, 0.03, 0.15, 0xff8ad8, { solid: false });
        G.label('跑步機 ×2 速度 🏃', { pos: new V(x, 2.8, z), scale: 0.9 });
        L.belts.push(m);
      };
      belt(-16, -6, 18);
      // gate helper
      L.gates = [];
      const gate = (z, need) => {
        const m = G.box(0, 0, z, 26, 9, 3, 0x8a4fd9, { opacity: 0.85 });
        const lab = G.label(`🔒 需要 ${need} 速度`, { pos: new V(0, 6, z + 1.8), scale: 1.4 });
        L.gates.push({ m, lab, need, z, open: false });
      };
      gate(-18.5, 120);
      // stage 1: hopping keys
      L.sinkers = [];
      let z = -24, y = 0, x = 0;
      for (let i = 0; i < 12; i++) {
        x = Math.sin(i * 1.3) * 5; y = Math.sin(i * 0.7) * 1.5;
        if (i % 4 === 3) {
          const m = key(x, y, z, 3.4, 3.4, { moving: true, col: 0xff8ad8 });
          L.sinkers.push({ c: m.userData.col, y: y + 0.4, x, z, ph: i });
        } else key(x, y, z, 3.4, 3.4);
        z -= 4.6;
      }
      // checkpoint 2 + second treadmill + gate 2
      G.box(0, -2, z - 4, 20, 2, 12, 0x333a48);
      for (let c = 0; c < 4; c++) key(-6 + c * 4, 0, z - 4, 3.6, 10, { ch: 'ENTER', col: 0x9fffb0, h: 0.5 });
      L.ck2 = new V(0, 0.5, z - 2);
      L.ckZ = z;
      belt(14, z - 4, 12);
      G.box(14 - 2.5 - 2, -0.5, z - 4, 5, 1, 4, 0x333a48); key(10.5, 0, z - 4, 3, 3);
      gate(z - 11.5, 400);
      // stage 2: long jumps + sliding keys
      L.sliders = [];
      z -= 18;
      for (let i = 0; i < 10; i++) {
        const gap = 6.5 + i * 0.35;
        if (i % 3 === 1) { const m = key(0, 0.5 + i * 0.3, z, 3.6, 3.6, { moving: true, col: 0x9fd0ff }); L.sliders.push({ c: m.userData.col, y: 0.5 + i * 0.3 + 0.4, z, ph: i }); }
        else key(Math.sin(i) * 3, 0.5 + i * 0.3, z, 3.8, 3.8);
        z -= gap;
      }
      // finish: giant ESC key
      L.finishZ = z;
      G.box(0, -2, z - 3, 16, 2, 10, 0x333a48);
      key(0, 0.5 + 10 * 0.3 - 1, z - 3, 12, 8, { ch: 'ESC', col: 0xff5a5a, h: 0.8 });
      L.finishY = 0.5 + 10 * 0.3 - 1 + 0.8;
      G.label('ESCAPE! 🏁', { pos: new V(0, L.finishY + 5, z - 3), scale: 2 });
      // keyboard monster
      const mon = new THREE.Group();
      G.part(mon, 0, 0, 0, 5, 5, 5, 0x222222); G.part(mon, 0, 2.6, 0, 4.4, 0.3, 4.4, 0x333333);
      G.part(mon, -1, 0.8, 2.52, 0.9, 0.6, 0.05, 0xff2020, { emissive: 0xff0000 }); G.part(mon, 1, 0.8, 2.52, 0.9, 0.6, 0.05, 0xff2020, { emissive: 0xff0000 });
      G.part(mon, 0, -0.9, 2.52, 3, 0.6, 0.05, 0xffffff); for (let i = -1; i <= 1; i++) G.part(mon, i * 0.9, -0.6, 2.55, 0.3, 0.3, 0.05, 0x222222);
      mon.visible = false; mon.traverse(o => o.userData.noHit = true); G.world.add(mon); L.mon = mon;
      G.label('鍵盤怪', { parent: mon, scale: 1.2 }).position.set(0, 3.6, 0);
      L.spd = 0; L.ck = new V(0, 0.5, 0); L.stage = 0;
      L.spawn.set(0, 0.5, 0); L.spawnYaw = 0; L.killY = -12;
      L.fallMsg = '掉下去了！回到檢查點（速度保留）';
    },
    update(dt, L) {
      const p = G.player;
      const ms = 7 + Math.min(17, Math.sqrt(L.spd) * 0.6);
      p.speed = ms; p.jump = 11 + Math.min(3.5, L.spd / 200);
      const onBelt = p.onGround && p.ground && p.ground.tag === 'belt';
      if (onBelt) p.pos.z += ms * 0.85 * dt;
      const mv = Math.hypot(G.in.move.x, G.in.move.z);
      // ASMR key clicks while walking on the keyboard
      if (p.onGround && !L.wasGround && !G.dying) G.sfx('keyLand');
      L.wasGround = p.onGround;
      if (p.onGround && mv > 0.1 && !G.dying) {
        L.stepD = (L.stepD || 0) + mv * ms * dt;
        const stride = 1.1 + ms * 0.04;
        if (L.stepD > stride) { L.stepD = 0; G.sfx('key'); }
      }
      if (p.onGround && mv > 0.1 && !G.dying) {
        L.acc = (L.acc || 0) + mv * ms * dt / 0.9 * (onBelt ? 2 : 1);
        while (L.acc >= 1) { L.acc -= 1; L.spd++; if (L.spd % 50 === 0) G.floatText(p.pos.clone().add(new V(0, 3, 0)), '+50 ⚡', '#ffd23f'); }
      }
      for (const s of L.sinkers) { const k = Math.sin(L.t * 1.8 + s.ph); G.moveCol(s.c, s.x, s.y - (k > 0.3 ? (k - 0.3) * 3 : 0), s.z); }
      for (const s of L.sliders) G.moveCol(s.c, Math.sin(L.t * 1.2 + s.ph) * 6, s.y, s.z);
      for (const g of L.gates) {
        if (!g.open && L.spd >= g.need) { g.open = true; G.removeCol(g.m.userData.col); g.m.visible = false; g.lab.visible = false; G.sfx('win'); G.hud.big(`大門打開了！`, '#5bff7a', 1300); }
        if (!g.open) g.lab.material.opacity = 0.8 + Math.sin(L.t * 4) * 0.2;
      }
      // checkpoints
      if (p.onGround && p.pos.z < L.ckZ - 0.5 && L.stage < 1) { L.stage = 1; L.ck = L.ck2.clone(); G.hud.toast('到達檢查點！'); }
      if (L.gates[1].open && p.pos.z < L.gates[1].z - 2 && L.stage < 2) {
        L.stage = 2; L.mon.visible = true; L.mon.position.set(0, 3, L.gates[1].z + 24); L.monWait = 1.2; G.sfx('alarm'); G.hud.big('鍵盤怪來了！快跑！', '#ff5a5a', 1600);
      }
      if (L.monWait > 0) L.monWait -= dt;
      else if (L.stage === 2 && L.mon.visible && !G.dying) {
        const m = L.mon.position;
        const to = p.pos.clone().add(new V(0, 2.5, 0)).sub(m); const d = to.length();
        m.addScaledVector(to.normalize(), Math.min(d, 10.5 * dt));
        L.mon.rotation.x += dt * 3;
        if (d < 3.2) G.die('被鍵盤怪抓到了！');
      }
      if (p.pos.z < L.finishZ + 2 && p.pos.y > L.finishY - 1.5 && p.onGround) G.complete('逃出鍵盤了！⌨️');
      const next = L.gates.find(g => !g.open);
      G.hud.prog(`⚡ 速度 ${L.spd}${next ? `　下一道門：${next.need}` : ''}`);
      G.hud.extra(`<span class="pill">🏃 移動 ${ms.toFixed(1)}</span>${onBelt ? '<br><span class="pill">跑步機 ×2！</span>' : ''}`);
    },
    respawn(L) {
      G.player.pos.copy(L.ck);
      // monster goes away; it comes back from far behind once you pass the second gate again
      if (L.stage === 2) { L.stage = 1; L.mon.visible = false; L.mon.position.set(0, -50, 0); }
    }
  });

  // ======================= 被遺棄 (Forsaken) =======================
  G.LEVELS.push({
    name: '被遺棄', insp: 'Forsaken', obj: '你是倖存者！修好發電機讓時間變少，撐到倒數結束就贏了。被殺手追的時候用衝刺跑、用 Q 推開他！',
    ctrl: 'WASD 移動・按住 Shift 衝刺（會耗體力）・E 修發電機（綠色時再按 E）・Q 推開殺手',
    ctrlTouch: '左邊搖桿移動・按住「衝刺」・E 修發電機（綠色時再按）・「推開」',
    build(L) {
      G.setSky({ color: 0x3a1a2a, fog: [18, 75], fogColor: 0x2a1220, sun: 0.35, hemi: 0.55, hemiSky: 0xffb0b0, hemiGround: 0x302028 });
      G.ground(100, '#4a5a44', '#44523f');
      G.box(0, 0, -46, 94, 6, 2, 0x2a2a30); G.box(0, 0, 46, 94, 6, 2, 0x2a2a30); G.box(-46, 0, 0, 2, 6, 94, 0x2a2a30); G.box(46, 0, 0, 2, 6, 94, 0x2a2a30);
      const bld = [[-24, -24, 12, 10], [22, -26, 10, 12], [-26, 22, 12, 10], [24, 22, 12, 12], [0, 0, 8, 8], [-8, -32, 6, 6], [10, 32, 7, 6], [-34, 0, 6, 10], [34, -2, 6, 10]];
      bld.forEach(([x, z, w, d], i) => { G.box(x, 0, z, w, 6, d, [0x5a4a44, 0x4a4a5a, 0x5a5044, 0x444a52][i % 4]); G.box(x, 6, z, w + 0.6, 0.4, d + 0.6, 0x2a2224); });
      for (let i = 0; i < 16; i++) { const x = G.rand(-40, 40), z = G.rand(-40, 40); if (Math.abs(x) < 6 && Math.abs(z) < 6) continue; G.box(x, 0, z, G.rand(2, 5), 1.4, 0.4, 0x6b4426); }
      for (let i = 0; i < 14; i++) { const x = G.rand(-42, 42), z = G.rand(-42, 42); G.box(x, 0, z, 0.6, 3.5, 0.6, 0x3a2a1a); G.mesh('sph', 0x2a3a24, x, 4.4, z, 3); }
      // generators
      L.gens = [new V(-12, 0, -12), new V(14, 0, -10), new V(-14, 0, 12), new V(13, 0, 14), new V(0, 0, -38), new V(-38, 0, 30)].slice(0, 5).map((pos, i) => {
        G.box(pos.x, 0, pos.z, 2.2, 1.6, 1.4, 0x5a6378);
        G.box(pos.x - 0.6, 1.6, pos.z, 0.3, 0.8, 0.3, 0x3a3f4a); G.box(pos.x + 0.5, 1.6, pos.z, 0.5, 0.4, 0.5, 0x3a3f4a);
        const lamp = G.box(pos.x, 1.6, pos.z + 0.5, 0.4, 0.4, 0.4, 0xff2020, { emissive: 0xaa0000, solid: false });
        const g = { pos, lamp, prog: 0, done: false, i };
        G.interact(pos, 2.8, () => `修理發電機（${g.prog} / 3）`, () => L.startFix(g), () => !g.done && !L.fix);
        return g;
      });
      // survivors
      const names = ['新手阿明', '訪客小芸', '建築師阿哲'];
      L.mates = names.map((nm, i) => {
        const n = G.makeNPC({ name: nm, shirt: [0xffd23f, 0x2fae5a, 0xff8a1a][i], pants: 0x2b3a55, hp: 100, pos: new V(-4 + i * 4, 0, 34) });
        n.data = { wp: null, flee: 0, fixT: 0 }; return n;
      });
      // killer
      const k = G.makeNPC({ name: '黑影屠夫', skin: 0x1a1a1a, shirt: 0x2a0a0a, pants: 0x111111, face: 'scary', pos: new V(0, 0, -30), scale: 1.25 });
      const P = k.mesh.userData.P;
      G.part(k.mesh, -0.14, 2.05, 0.32, 0.12, 0.08, 0.02, 0xff2020, { emissive: 0xff0000, noShadow: true }); G.part(k.mesh, 0.14, 2.05, 0.32, 0.12, 0.08, 0.02, 0xff2020, { emissive: 0xff0000, noShadow: true });
      const cl = new THREE.Group(); G.part(cl, 0, 0, 0, 0.12, 0.6, 0.12, 0x3a2a1a); G.part(cl, 0, -0.55, 0.25, 0.06, 0.6, 0.6, 0x9aa0aa); cl.position.set(0, -0.8, 0.1); P.aR.add(cl);
      k.data = { state: 'patrol', wp: null, cd: 0, wind: 0, stun: 0, lunge: 6, slowT: 0, side: 0, sideT: 0, last: null, lost: 0 };
      k.noPush = true;
      L.killer = k;
      L.timer = 150; L.stam = 100; L.qcd = 0; L.fix = null;
      L.spawn.set(0, 0, 36); L.spawnYaw = 0;
      G.player.hw = 0.45;
      G.hud.hp(true);
      G.setButtons({ act: null, e: '修理', q: '推開', f: '衝刺' });
    },
    update(dt, L) {
      const p = G.player, k = L.killer, K = k.data;
      L.timer -= dt; L.qcd -= dt;
      if (L.timer <= 0) { G.complete('你活下來了！🌅'); return; }
      // sprint & stamina
      const sprint = (G.in.keys.ShiftLeft || G.in.keys.ShiftRight || G.in.fH) && Math.hypot(G.in.move.x, G.in.move.z) > 0.1 && L.stam > 0 && !L.fix;
      if (sprint) { L.stam -= 24 * dt; L.regen = 1; } else { L.regen = (L.regen || 0) - dt; if (L.regen <= 0) L.stam = Math.min(100, L.stam + 16 * dt); }
      if (L.stam < 0) L.stam = 0;
      p.speed = sprint ? 11 : 7;
      // generator fixing
      if (L.fix) {
        const F = L.fix;
        if (Math.hypot(G.in.move.x, G.in.move.z) > 0.3) { L.endFix(); }
        else {
          F.x += F.dir * F.sp * dt; if (F.x > 1) { F.x = 1; F.dir = -1; } if (F.x < 0) { F.x = 0; F.dir = 1; }
          const el = G.$('fxN'); if (el) el.style.left = (F.x * 100) + '%';
          if (G.in.eP || G.in.actP) {
            G.in.eP = false;
            if (F.x >= F.z0 && F.x <= F.z0 + F.w) {
              F.g.prog++; G.sfx('coin');
              if (F.g.prog >= 3) {
                F.g.done = true; F.g.lamp.material = G.mat(0x2fd06a, { emissive: 0x1a882a }); L.timer = Math.max(5, L.timer - 22);
                G.sfx('win'); G.hud.big('發電機修好了！時間 -22 秒', '#5bff7a', 1500); L.endFix();
              } else { L.endFix(); L.startFix(F.g); }
            } else {
              G.sfx('alarm'); G.burst(F.g.pos.clone().setY(1.8), 0xffd23f, 10); G.hud.toast('失敗！殺手聽到聲音了'); K.state = 'chase'; K.last = p.pos.clone(); K.lost = 0;
              L.endFix(); L.startFix(F.g);
            }
          }
        }
      }
      // push ability
      if (G.in.qP && !G.dying) {
        if (L.qcd > 0) G.hud.toast(`推開冷卻中 ${Math.ceil(L.qcd)} 秒`, 800);
        else {
          L.qcd = 18; G.sfx('swing'); p.mesh.userData.armPose = true; p.mesh.userData.P.aL.rotation.x = -1.6; p.mesh.userData.P.aR.rotation.x = -1.6; G.after(0.3, () => p.mesh.userData.armPose = false);
          if (G.dist2(k.pos, p.pos) < 3.6) { K.stun = 2.6; K.wind = 0; G.ring(k.pos.clone().setY(2.5), 0xffd23f, 2, 0.5); G.hud.big('推開了！快跑！', '#ffd23f', 1000); const kb = k.pos.clone().sub(p.pos).setY(0).normalize(); k.vel.set(kb.x * 12, 4, kb.z * 12); }
        }
      }
      // survivors AI
      for (const n of L.mates) {
        if (!n.alive) continue;
        const D = n.data, kd = G.dist2(n.pos, k.pos);
        if (kd < 12 && K.stun <= 0) { D.flee = 2; }
        if (D.flee > 0) { D.flee -= dt; const away = n.pos.clone().sub(k.pos).setY(0).normalize().multiplyScalar(8).add(n.pos); G.npcSeek(n, away, 7.4, dt); D.wp = null; continue; }
        if (!D.wp) { const g = G.pick(L.gens.filter(g => !g.done)) || G.pick(L.gens); D.wp = g.pos.clone().add(new V(G.rand(-2, 2), 0, 2.2)); D.gen = g; D.fixT = 0; }
        const d = G.npcSeek(n, D.wp, 5, dt);
        if (d < 1) { D.fixT += dt; if (D.fixT > 9 && D.gen && !D.gen.done) { D.gen.prog++; D.fixT = 0; if (D.gen.prog >= 3) { D.gen.done = true; D.gen.lamp.material = G.mat(0x2fd06a, { emissive: 0x1a882a }); L.timer = Math.max(5, L.timer - 22); G.hud.toast(`${n.name} 修好了一台發電機！`); } } if (D.gen && D.gen.done) D.wp = null; }
        if (n.hitWall && d > 1) D.wp = null;
      }
      // killer AI
      K.cd -= dt; K.lunge -= dt; K.slowT -= dt;
      if (K.stun > 0) { K.stun -= dt; G.moveEntity(k, dt); k.vel.x *= 0.9; k.vel.z *= 0.9; G.syncNPC(k, dt, 0); }
      else if (!G.dying) {
        const targets = [{ t: 'p', pos: p.pos }].concat(L.mates.filter(m => m.alive).map(m => ({ t: m, pos: m.pos })));
        const eye = k.pos.clone().add(new V(0, 2.4, 0));
        let best = null, bd = 1e9;
        for (const t of targets) { const d = G.dist2(t.pos, k.pos) * (t.t === 'p' ? 0.8 : 1); if (d < 26 && d < bd && G.los(eye, t.pos.clone().add(new V(0, 1.5, 0)))) { bd = d; best = t; } }
        if (best) { K.state = 'chase'; K.tgt = best; K.last = best.pos.clone(); K.lost = 0; }
        let goal;
        if (K.state === 'chase') {
          if (!best) { K.lost += dt; if (K.lost > 4) { K.state = 'patrol'; K.wp = null; } }
          goal = best ? best.pos : K.last;
        } else {
          if (!K.wp || G.dist2(K.wp, k.pos) < 2) K.wp = (G.pick(L.gens).pos.clone()).add(new V(G.rand(-4, 4), 0, G.rand(-4, 4)));
          goal = K.wp;
        }
        let sp = K.state === 'chase' ? 8 : 5.5;
        if (K.slowT > 0) sp = 3;
        if (K.lungeT > 0) { K.lungeT -= dt; sp = 15; }
        else if (best && bd > 5 && bd < 10 && K.lunge <= 0) { K.lunge = 7; K.lungeT = 0.4; G.sfx('alarm'); }
        // simple obstacle sidestep
        if (K.sideT > 0) { K.sideT -= dt; const to = goal.clone().sub(k.pos).setY(0).normalize(); goal = k.pos.clone().add(new V(-to.z * K.side, 0, to.x * K.side).multiplyScalar(4)).add(to); }
        G.npcSeek(k, goal, sp, dt, { noJump: true });
        if (k.hitWall && K.sideT <= 0) { K.side = Math.random() < 0.5 ? 1 : -1; K.sideT = 0.7; }
        // attack
        if (best && K.cd <= 0 && bd < 2.8 && K.wind <= 0) { K.wind = 0.35; k.mesh.userData.armPose = true; P_(k).aR.rotation.x = -2.8; }
        if (K.wind > 0) {
          K.wind -= dt;
          if (K.wind <= 0) {
            K.cd = 1.2; K.slowT = 0.7; P_(k).aR.rotation.x = -0.6; G.after(0.25, () => k.mesh.userData.armPose = false); G.sfx('swing');
            for (const t of targets) if (G.dist2(t.pos, k.pos) < 3.2) {
              if (t.t === 'p') G.damage(35);
              else { t.t.hp -= 40; G.burst(t.t.pos.clone().setY(1.2), 0xff3030, 8); if (t.t.hp <= 0) { G.killNPC(t.t); G.hud.toast(`${t.t.name} 被殺了…`); } else t.t.data.flee = 3; }
            }
          }
        }
      } else G.syncNPC(k, dt, 0);
      const tt = Math.ceil(L.timer);
      G.hud.prog(`⏳ ${Math.floor(tt / 60)}:${String(tt % 60).padStart(2, '0')}　⚡ 發電機 ${L.gens.filter(g => g.done).length} / ${L.gens.length}　👥 ${L.mates.filter(m => m.alive).length + 1} 人存活`);
      G.hud.extra(`<span class="pill">🏃 體力 ${Math.round(L.stam)}</span><br><span class="pill">✋ 推開 ${L.qcd > 0 ? Math.ceil(L.qcd) + 's' : '✔'}</span>${K.state === 'chase' && K.tgt && K.tgt.t === 'p' ? '<br><span class="pill" style="color:#ff6060">🔪 殺手在追你！</span>' : ''}`);
    },
    respawn(L) {
      if (L.fix) L.endFix();
      L.timer = Math.max(L.timer, 70); L.stam = 100;
      const k = L.killer; k.pos.set(0, 0, -34); k.data.state = 'patrol'; k.data.wp = null; k.data.stun = 0; k.data.wind = 0;
      G.hud.toast('重新來過！計時恢復到至少 70 秒');
    },
    cleanup() { G.closePanel(false); }
  });
  const P_ = (n) => n.mesh.userData.P;
  const lvF = G.LEVELS[G.LEVELS.length - 1], bF = lvF.build;
  lvF.build = function (L) {
    bF(L);
    L.startFix = (g) => {
      const w = 0.2;
      L.fix = { g, x: 0, dir: 1, sp: 0.9 + g.prog * 0.25, z0: G.rand(0.35, 0.8 - w), w };
      G.player.frozen = true;
      const p = G.openPanel(`<div style="text-align:center;font-weight:900">⚡ 接上電線（${g.prog} / 3）</div>
        <div style="position:relative;height:28px;background:#222;border:3px solid #fff;border-radius:8px;margin:10px 0;overflow:hidden">
          <div style="position:absolute;top:0;bottom:0;left:${L.fix.z0 * 100}%;width:${w * 100}%;background:#2fd06a"></div>
          <div id="fxN" style="position:absolute;top:-2px;bottom:-2px;width:5px;margin-left:-2px;background:#ffd23f;left:0"></div></div>
        <div style="text-align:center;font-size:13px">黃線到綠色時按 ${G.isTouch ? '「修理」' : 'E'}・移動就會中斷</div>`, { keepLock: true, side: true });
      p.style.pointerEvents = 'none';
    };
    L.endFix = () => { L.fix = null; G.player.frozen = false; G.closePanel(false); };
  };

  // keep 領養寵物 as the final level
  const ai = G.LEVELS.findIndex(l => l.name === '領養寵物');
  if (ai >= 0) G.LEVELS.push(G.LEVELS.splice(ai, 1)[0]);
})();
