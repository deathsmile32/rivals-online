// Roblox Childhood — game flow: title, level intro, main loop, pause, end screen.
'use strict';
(function () {
  const $ = G.$;
  G.state = 'title';
  G.time = 0; G.deaths = 0;

  G.loop = function () {
    requestAnimationFrame(G.loop);
    const dt = Math.min(G.clock.getDelta(), 0.05);
    G.input.poll();
    if (G.state === 'play') {
      G.time += dt; G.L.t += dt;
      for (const c of G.cols) if (c.moving) c.delta.set(0, 0, 0);
      for (const t of G.timers) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; t.fn(); } }
      G.timers = G.timers.filter(t => !t.done);
      if (G.def.update && !G.completing) G.def.update(dt, G.L);
      const p = G.player;
      if (!G.dying && !p.custom && !p.frozen) G.updatePlayer(dt);
      else if (!p.custom) { p.vel.set(0, 0, 0); G.syncPlayerMesh(dt, 0); if (G.dying) p.mesh.visible = false; }
      if (p.invuln > 0) p.invuln -= dt;
      G.separateNPCs();
      G.updateProjs(dt);
      if (!G.panelOpen) G.updateInteract();
    }
    G.updateFx(dt);
    if (G.state !== 'title' && G.state !== 'end') G.updateCamera(dt);
    else G.titleCam(dt);
    if (G.state === 'play') G.hud.tick();
    G.renderer.render(G.scene, G.camera);
    G.input.clearEdges();
  };

  // slow orbit for the title screen backdrop
  G.titleCam = function (dt) {
    G._tc = (G._tc || 0) + dt * 0.12;
    G.camera.position.set(Math.sin(G._tc) * 30, 16, Math.cos(G._tc) * 30);
    G.camera.lookAt(0, 4, 0);
  };
  G.buildTitleScene = function () {
    G.clearWorld();
    G.setSky({ color: 0x6fb7ff, fog: [60, 140] });
    G.ground(120, '#8a8f99', '#7b808a');
    const cols = [0xff4b4b, 0xffd23f, 0x2fd06a, 0x2f7de1, 0xa45cff, 0xff8a1a];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2, r = 14 + (i % 3) * 5;
      G.box(Math.cos(a) * r, 0, Math.sin(a) * r, 3, 2 + (i % 5) * 1.6, 3, cols[i % cols.length]);
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const n = G.makeNPC({ shirt: cols[i % 6], pos: new THREE.Vector3(Math.cos(a) * 6, 0, Math.sin(a) * 6) });
      n.yaw = a + Math.PI / 2;
      G.syncNPC(n);
      n.mesh.userData.P.aR.rotation.x = -2.6;
    }
    G.player.mesh.visible = false;
  };

  G.showScreen = function (id) {
    for (const s of ['title', 'intro', 'pause', 'end', 'loading']) $(s).classList.toggle('hidden', s !== id);
    $('hud').classList.toggle('hidden', id === 'title' || id === 'end' || id === 'loading');
    $('touch').classList.toggle('hidden', !G.isTouch || id !== null || !!G.noTouch);
  };

  G.showTitle = function () {
    G.state = 'title'; G.unlock(); G.closePanel(false);
    if (G.L && G.def && G.def.cleanup) G.def.cleanup(G.L);
    G.fps.removeGun();
    G.buildTitleScene();
    G.showScreen('title');
    const prog = Math.min(G.store.get('progress', 0), G.LEVELS.length);
    const saved = G.store.get('level', 0);
    const cont = $('btnCont');
    if (saved > 0 && saved < G.LEVELS.length) { cont.classList.remove('hidden'); cont.textContent = `⏩ 繼續（第 ${saved + 1} 關）`; }
    else cont.classList.add('hidden');
    $('btnQual').textContent = '畫質：' + (G.quality === 'high' ? '高' : '低');
    const list = $('levelList'); list.innerHTML = '';
    G.LEVELS.forEach((lv, i) => {
      const b = document.createElement('button');
      const done = i < prog, unlocked = i <= prog;
      b.className = 'lv' + (done ? ' done' : '') + (i === prog ? ' cur' : '') + (!unlocked ? ' lock' : '');
      b.innerHTML = `<span class="n">${i + 1}.</span>${done ? '✅ ' : unlocked ? '' : '🔒 '}${lv.name}`;
      b.onclick = () => { if (!unlocked) { b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 200); return; } G.sfx('click'); G.runMode = 'single'; G.time = 0; G.deaths = 0; G.startLevel(i); };
      list.appendChild(b);
    });
  };

  G.startLevel = function (i) {
    if (G.L && G.def && G.def.cleanup) G.def.cleanup(G.L);
    G.fps.removeGun();
    G.closePanel(false);
    G.levelIdx = i; G.def = G.LEVELS[i];
    if (G.runMode !== 'single') G.store.set('level', i);
    G.clearWorld();
    G.hud.reset();
    G.dying = false; G.completing = false; G.noTouch = false;
    const p = G.player;
    Object.assign(p, { maxHp: 100, hp: 100, speed: 8, jump: 11, frozen: false, custom: false, hidden: false, slow: 1, noJump: false, blocking: false, invuln: 0, faceCam: false, noInteract: false, hw: 0.45, h: 2.3 });
    p.mesh.visible = true; p.mesh.scale.setScalar(1);
    Object.assign(G.cam, { mode: 'third', dist: 7, height: 1.8, shoulder: 0, target: null, eye: 1.95 });
    G.setSky({});
    G.setButtons({});
    const L = G.L = { t: 0, spawn: new THREE.Vector3(0, 0, 0), spawnYaw: 0, killY: -25 };
    G.def.build(L);
    G.respawnPlayer();
    G.syncPlayerMesh(0, 0);
    G.hud.level(`第 ${i + 1} 關 / ${G.LEVELS.length}　${G.def.name}`);
    G.hud.obj(G.def.obj);
    $('iNum').textContent = `第 ${i + 1} 關 / ${G.LEVELS.length}`;
    $('iName').textContent = G.def.name;
    $('iInsp').textContent = '靈感來自：' + G.def.insp;
    $('iObj').innerHTML = '🎯 ' + G.def.obj;
    $('iCtrl').innerHTML = (G.isTouch ? (G.def.ctrlTouch || '左邊拖曳移動・右邊拖曳轉視角') : (G.def.ctrl || 'WASD 移動・空白鍵 跳・滑鼠 轉視角・E 互動'));
    G.state = 'intro';
    G.showScreen('intro');
    G.updateCamera(0);
  };

  G.beginPlay = function () {
    G.sfx('click');
    G.state = 'play';
    G.showScreen(null);
    if (G.def.start) G.def.start(G.L);
    if (!G.panelOpen) G.lock();
  };
  G.pause = function () {
    if (G.state !== 'play') return;
    G.state = 'pause'; G.unlock();
    $('pQual').textContent = '畫質：' + (G.quality === 'high' ? '高' : '低');
    G.showScreen('pause');
    $('panel').classList.add('hidden');
  };
  G.resume = function () {
    G.state = 'play'; G.showScreen(null);
    if (G.panelOpen) $('panel').classList.remove('hidden'); else G.lock();
    G.clock.getDelta();
  };
  G.finishGame = function () {
    G.state = 'end'; G.unlock();
    G.store.set('level', 0);
    const t = Math.floor(G.time);
    $('eStats').innerHTML = `你玩完了全部 ${G.LEVELS.length} 個遊戲！<br>⏱ 總時間：${Math.floor(t / 60)} 分 ${t % 60} 秒<br>💀 死亡次數：${G.deaths}`;
    G.buildTitleScene();
    G.showScreen('end');
  };

  // ---------- buttons ----------
  $('btnNew').onclick = () => { G.sfx('click'); G.runMode = 'run'; G.time = 0; G.deaths = 0; G.startLevel(0); };
  $('btnCont').onclick = () => { G.sfx('click'); G.runMode = 'run'; G.time = G.store.get('time', 0); G.deaths = G.store.get('deaths', 0); G.startLevel(G.store.get('level', 0)); };
  $('btnQual').onclick = () => { G.setQuality(G.quality === 'high' ? 'low' : 'high'); $('btnQual').textContent = '畫質：' + (G.quality === 'high' ? '高' : '低'); };
  $('iGo').onclick = G.beginPlay;
  $('pResume').onclick = G.resume;
  $('pRestart').onclick = () => G.startLevel(G.levelIdx);
  $('pQual').onclick = () => { G.setQuality(G.quality === 'high' ? 'low' : 'high'); $('pQual').textContent = '畫質：' + (G.quality === 'high' ? '高' : '低'); };
  $('pSkip').onclick = () => {
    if (G.levelIdx + 1 < G.LEVELS.length && G.runMode !== 'single') G.startLevel(G.levelIdx + 1);
    else if (G.runMode !== 'single') G.finishGame(); else G.showTitle();
  };
  $('pMenu').onclick = () => G.showTitle();
  $('pauseBtn').onclick = () => G.pause();
  $('eAgain').onclick = () => { G.runMode = 'run'; G.time = 0; G.deaths = 0; G.startLevel(0); };
  $('eMenu').onclick = () => G.showTitle();
  // remember run time / deaths so "continue" keeps the totals
  setInterval(() => { if (G.state === 'play' && G.runMode === 'run') { G.store.set('time', Math.floor(G.time)); G.store.set('deaths', G.deaths); } }, 3000);

  G.init();
  G.showTitle();
  // debug hook for automated testing: ?level=N&auto=1
  const qs = new URLSearchParams(location.search);
  if (qs.has('level')) { G.runMode = 'single'; G.startLevel(parseInt(qs.get('level'), 10) - 1); if (qs.has('auto')) G.beginPlay(); }
})();
