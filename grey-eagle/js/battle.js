// 灰鷹軍團 — 戰鬥邏輯（不碰畫面，只管數值和位置，畫面在 draw.js）。
// 座標：x 從左（敵方碉堡）到右（我方碉堡），y = 0 是地面，往上是負的。
'use strict';
(function (G) {
  const lvMult = lv => 1 + 0.2 * (lv - 1);
  G.lvMult = lvMult;
  const rnd = (a, b) => a + Math.random() * (b - a);

  class Battle {
    constructor(stage, ch, team, res) {
      this.st = stage; this.ch = ch; this.cm = G.CHAPTERS[ch].mult;
      this.nat = G.NATIONS[stage.nation];
      this.L = stage.len; this.EB = 90; this.PB = this.L - 90;
      this.t = 0; this.money = 0; this.wl = 0;
      this.cannon = 0; this.cannonT = 22; this.cannonLv = res.cannonLv || 0;
      const pMax = 4000 + 1500 * (res.baseLv || 0);
      const eMax = Math.round(stage.baseHp * this.cm);
      this.base = [{ hp: pMax, max: pMax, hit: 0 }, { hp: eMax, max: eMax, hit: 0 }];
      this.units = []; this.fx = []; this.ev = []; this.flyers = [];
      this.slots = team.map(t => ({ def: t.def, lv: t.lv, cd: 0 }));
      this.spawns = stage.pool.map(p => ({ e: p[0], next: p[1], every: p[2] }));
      this.bossOut = false; this.boss2T = -1;
      this.buffT = 0; this.result = null; this.endT = 0;
      this.gunT = this.nat.gun ? this.nat.gun.t : 0;
      this.kills = 0;
      this.uid = 0;
    }

    // ---------- 單位 ----------
    make(def, side, hpM, atkM, x) {
      const u = {
        n: this.uid++, def, side, dir: side ? 1 : -1, x,
        alt: def.type === 'air' ? 70 + rnd(-8, 8) : 0,
        hp: def.hp * hpM, max: def.hp * hpM, atk: def.atk * atkM, atkM,
        at: 0, wasAtk: false, kbDone: 0, kbT: 0, vx: 0,
        anim: 0, walk: Math.random() * 10, freeze: 0, slow: 0,
        dead: false, fade: 0, revived: false, healT: 4,
        revealed: false, submerged: def.special === 'sub', drop: 0,
        faT: def.freezeAll || 0,
      };
      this.units.push(u);
      return u;
    }
    spawnEnemy(id) {
      const def = G.ENEMY[id];
      const m = def.boss ? this.cm : this.st.mag * this.cm;
      let x = this.EB + 25 + rnd(0, 15);
      const u = this.make(def, 1, m, m, x);
      if (def.spawnMid) { u.x = this.frontX(1); u.drop = 180; }
      if (def.boss) { this.ev.push('boss'); this.fx.push({ k: 'text', txt: '⚠ ' + def.name + ' 出現了！', t: 0, life: 2.5, big: true }); }
      return u;
    }
    alive(side) { return this.units.filter(u => !u.dead && u.side === side); }

    // 前線位置：我方最前面的單位附近，但不會跑到敵人後面
    frontX(side) {
      const mine = this.alive(side).filter(u => !u.drop);
      const foes = this.alive(1 - side);
      if (side === 0) {
        let fx = mine.length ? Math.min(...mine.map(u => u.x)) - 30 : this.PB - 120;
        if (foes.length) fx = Math.max(fx, Math.max(...foes.map(u => u.x)) + 50);
        return Math.max(this.EB + 150, Math.min(this.PB - 80, fx));
      } else {
        let fx = mine.length ? Math.max(...mine.map(u => u.x)) + 30 : this.L * 0.4;
        if (foes.length) fx = Math.min(fx, Math.min(...foes.map(u => u.x)) - 50);
        return Math.max(this.EB + 80, Math.min(this.PB - 200, fx));
      }
    }

    // ---------- 出擊 ----------
    canDeploy(i) {
      const s = this.slots[i];
      return s && !this.result && s.cd <= 0 && this.money >= s.def.cost && this.alive(0).length < 50;
    }
    deploy(i) {
      if (!this.canDeploy(i)) return false;
      const s = this.slots[i], def = s.def, m = lvMult(s.lv);
      this.money -= def.cost; s.cd = def.cd;
      this.ev.push('deploy');
      const sx = this.PB - 55 + rnd(-6, 6);
      switch (def.special) {
        case 'drop':
          this.flyers.push({ k: 'transport', x: this.PB, y: -190, tx: this.frontX(0), m, done: false });
          break;
        case 'ark':
          this.flyers.push({ k: 'ark', x: this.PB + 80, y: -200, bombT: 0, dmg: def.atk * m });
          this.fx.push({ k: 'text', txt: '🌈 末日方舟 起飛！', t: 0, life: 2.5, big: true, col: '#ff8be0' });
          this.ev.push('legend');
          break;
        case 'front': {
          const u = this.make(def, 0, m, m, this.frontX(0)); u.drop = 220;
          break;
        }
        case 'rewind': {
          this.make(def, 0, m, m, sx);
          for (const e of this.alive(1)) { e.x = Math.max(this.EB + 20, e.x - 260); e.freeze = Math.max(e.freeze, e.def.boss ? 0.8 : 1.5); }
          this.fx.push({ k: 'clock', t: 0, life: 1.4 });
          this.fx.push({ k: 'text', txt: '⏱ 時間倒轉！', t: 0, life: 2, big: true, col: '#9fe0ff' });
          this.ev.push('legend');
          break;
        }
        case 'marshal':
          this.make(def, 0, m, m, sx);
          this.buffT = 20;
          this.fx.push({ k: 'text', txt: '🌑 影之元帥：全軍冷卻減半！', t: 0, life: 2.5, big: true, col: '#c9a6ff' });
          this.ev.push('legend');
          break;
        default:
          this.make(def, 0, m, m, sx);
      }
      if (def.rar === 'legend' && def.special !== 'ark' && def.special !== 'rewind' && def.special !== 'marshal') this.ev.push('legend');
      return true;
    }
    upgradeWallet() {
      if (this.result || this.wl >= G.WALLET.cost.length) return false;
      const c = G.WALLET.cost[this.wl];
      if (this.money < c) return false;
      this.money -= c; this.wl++;
      this.ev.push('wallet');
      return true;
    }
    fireCannon() {
      if (this.result || this.cannon < 1) return false;
      this.cannon = 0;
      const dmg = (120 + 60 * this.cannonLv) * this.st.mag * this.cm;
      for (const e of this.alive(1)) {
        if (e.x > this.PB - 800 && !e.drop) { this.hit(null, e, dmg, true); if (!e.dead && !e.def.nokb) this.knock(e); }
      }
      this.fx.push({ k: 'beam', x: this.PB - 40, t: 0, life: 0.9 });
      this.ev.push('cannon');
      return true;
    }

    // ---------- 每一幀 ----------
    update(dt) {
      this.updateFx(dt);
      if (this.result) { this.endT += dt; this.updateUnits(dt * 0.3); return; }
      this.t += dt;
      const buff = this.buffT > 0;
      if (buff) this.buffT -= dt;
      this.money = Math.min(G.WALLET.max[this.wl], this.money + G.WALLET.rate[this.wl] * dt * (buff ? 1.5 : 1));
      for (const s of this.slots) s.cd = Math.max(0, s.cd - dt * (buff ? 2 : 1));
      this.cannon = Math.min(1, this.cannon + dt / this.cannonT);
      this.base[0].hit = Math.max(0, this.base[0].hit - dt);
      this.base[1].hit = Math.max(0, this.base[1].hit - dt);

      // 敵方出兵
      if (this.alive(1).length < 60) {
        const rush = this.bossOut ? 0.85 : 1;
        for (const s of this.spawns) {
          if (this.t >= s.next) { this.spawnEnemy(s.e); s.next += s.every * rush * rnd(0.85, 1.15); }
        }
      }
      if (this.boss2T > 0) { this.boss2T -= dt; if (this.boss2T <= 0) this.spawnEnemy(this.st.boss2); }

      // 碉堡砲台
      if (this.nat.gun) {
        this.gunT -= dt;
        if (this.gunT <= 0) {
          const g = this.nat.gun;
          const tgt = this.alive(0).filter(u => !u.drop && !u.submerged && u.x - this.EB < g.rng).sort((a, b) => a.x - b.x)[0];
          if (tgt) {
            const dmg = g.atk * this.cm * (1 + this.st.i * 0.03);
            this.fx.push({ k: 'shell', x1: this.EB + 10, y1: -150, x2: tgt.x, y2: -tgt.alt, t: 0, life: 0.6, r: 55, enemy: true });
            for (const u of this.alive(0)) if (!u.submerged && !u.drop && Math.abs(u.x - tgt.x) < 55) this.hit(null, u, dmg);
            this.ev.push('boom');
            this.gunT = g.t;
          } else this.gunT = 0.5;
        }
      }

      this.updateFlyers(dt);
      this.updateUnits(dt);

      if (this.base[1].hp <= 0) this.finish('win');
      else if (this.base[0].hp <= 0) this.finish('lose');
    }

    finish(r) {
      this.result = r;
      this.ev.push(r);
      const side = r === 'win' ? 1 : 0;
      const bx = side ? this.EB : this.PB;
      for (let i = 0; i < 8; i++) this.fx.push({ k: 'boom', x: bx + rnd(-50, 50), y: rnd(-150, -10), r: rnd(30, 60), t: -i * 0.15, life: 0.7 });
      for (const u of this.alive(side)) { u.hp = 0; this.die(u, true); }
    }

    updateFlyers(dt) {
      for (const f of this.flyers) {
        if (f.k === 'transport') {
          f.x -= 280 * dt;
          if (!f.done && f.x <= f.tx) {
            f.done = true;
            for (let i = 0; i < 4; i++) { const u = this.make(G.PARA, 0, f.m, f.m, f.tx - 25 + i * 18); u.drop = 190 + i * 15; }
          }
        } else if (f.k === 'ark') {
          f.x -= 150 * dt;
          f.bombT -= dt;
          if (f.bombT <= 0 && f.x > this.EB - 40) {
            f.bombT = 0.3;
            const bx = f.x;
            this.fx.push({ k: 'bomb', x: bx, y: f.y + 30, t: 0, life: 0.45 });
            this.fx.push({ k: 'boom', x: bx, y: -10, r: 60, t: -0.45, life: 0.6 });
            for (const e of this.alive(1)) if (!e.drop && Math.abs(e.x - bx) < 70) this.hit(null, e, f.dmg);
            if (Math.abs(bx - this.EB) < 70) this.hitBase(1, f.dmg);
            this.ev.push('boom');
          }
        }
      }
      this.flyers = this.flyers.filter(f => f.x > -200);
    }

    updateUnits(dt) {
      const pl = this.alive(0);
      const atkAura = pl.some(u => u.def.aura === 'atk') ? 1.5 : 1;
      const bands = pl.filter(u => u.def.aura === 'speed');
      const undying = pl.filter(u => u.def.aura === 'revive');
      this._undying = undying;
      const weather = this.st.weather;

      for (const u of this.units) {
        if (u.dead) { u.fade += dt; u.x += u.vx * dt; u.vx *= 0.94; continue; }
        u.anim = Math.max(0, u.anim - dt);
        u.at = Math.max(0, u.at - dt);
        if (u.drop > 0) { u.drop = Math.max(0, u.drop - 240 * dt); if (u.drop === 0) this.fx.push({ k: 'dust', x: u.x, t: 0, life: 0.4 }); continue; }
        if (u.kbT > 0) { u.kbT -= dt; u.x += u.vx * dt; u.vx *= 0.9; u.x = Math.max(this.EB - 20, Math.min(this.PB + 20, u.x)); continue; }
        if (u.freeze > 0) { u.freeze -= dt; continue; }
        if (u.slow > 0) u.slow -= dt;
        if (this.result) continue;

        const def = u.def;
        // 冬將軍：週期性冰凍全場
        if (def.freezeAll) {
          u.faT -= dt;
          if (u.faT <= 0) {
            u.faT = def.freezeAll;
            for (const p of this.alive(0)) if (!p.def.boss) p.freeze = Math.max(p.freeze, 2);
            this.fx.push({ k: 'snowflash', t: 0, life: 1.2 });
            this.fx.push({ k: 'text', txt: '❄ 冬將軍：全場冰凍！', t: 0, life: 2, big: true, col: '#bfe8ff' });
            this.ev.push('freeze');
          }
        }
        // 炊事兵補血
        if (def.heal) {
          u.healT -= dt;
          if (u.healT <= 0) {
            u.healT = 4;
            for (const a of pl) if (Math.abs(a.x - u.x) < 160 && a.hp < a.max) {
              a.hp = Math.min(a.max, a.hp + a.max * 0.08 + 30 * u.atkM);
              this.fx.push({ k: 'heal', x: a.x, y: -a.alt - 40, t: 0, life: 0.8 });
            }
          }
        }

        // 找目標
        const foes = this.targets(u, false);
        const baseX = u.side === 0 ? this.EB : this.PB;
        const baseIn = (baseX - u.x) * u.dir - 35 <= def.rng;
        const hasT = def.baseOnly ? baseIn : (foes.length > 0 || baseIn);

        let moving = def.nonstop ? !baseIn : !hasT;
        if (moving) {
          let sp = def.spd;
          if (u.side === 0) {
            if (weather === 'snow') sp *= def.snowPro ? 1.3 : 0.7;
            else if (weather === 'flood') sp *= 0.8;
            if (bands.length && bands.some(b => Math.abs(b.x - u.x) < 250)) sp *= 1.3;
          }
          if (u.slow > 0) sp *= 0.5;
          u.x += u.dir * sp * dt;
          u.walk += dt * (3 + sp / 25);
          u.wasAtk = false;
        }
        if (hasT && !this.result) {
          if (!u.wasAtk && !def.nonstop) { u.wasAtk = true; if (u.at < 0.25) u.at = 0.25; }
          if (u.at <= 0) {
            u.at = def.atkT;
            if (def.baseOnly && u.submerged) { u.submerged = false; this.fx.push({ k: 'splash', x: u.x, t: 0, life: 0.8 }); }
            this.attack(u, foes, baseIn, u.side === 0 ? atkAura : 1);
          }
        }
      }
      this.units = this.units.filter(u => !(u.dead && u.fade > 1.2));
    }

    // 可以打到的目標（依距離排序）
    targets(u, forArea) {
      if (u.def.baseOnly) return [];
      const out = [];
      for (const f of this.units) {
        if (f.dead || f.side === u.side || f.drop > 0 || f.submerged) continue;
        if (!forArea && !u.def.area && (f.def.stealth || (f.def.stealthOnce && !f.revealed))) continue;
        if (u.def.area && f.def.stealthOnce && !f.revealed) continue;
        const d = (f.x - u.x) * u.dir;
        if (d >= -12 && d <= u.def.rng) out.push(f);
      }
      out.sort((a, b) => (a.x - u.x) * u.dir - (b.x - u.x) * u.dir);
      return out;
    }

    attack(u, foes, baseIn, mult) {
      const def = u.def;
      const dmg = u.atk * mult;
      u.anim = 0.3;
      if (def.stealthOnce) u.revealed = true;
      const tgts = def.area ? foes : foes.slice(0, 1);
      for (const f of tgts) this.hit(u, f, dmg);
      if (baseIn && (def.area || !tgts.length)) this.hitBase(1 - u.side, dmg * (def.shots || 1));
      if (def.shots) for (const f of tgts) for (let k = 1; k < def.shots; k++) this.hit(u, f, dmg);

      // 視覺效果
      const sy = -u.alt - 22 * (def.look.big || 1);
      const tx = tgts.length ? tgts[0].x : (u.side === 0 ? this.EB + 30 : this.PB - 30);
      const ty = tgts.length ? -tgts[0].alt - 18 : -60;
      const g = def.look.gear, k = def.look.k;
      if (g === 'flame') this.fx.push({ k: 'flame', x: u.x, y: sy, dir: u.dir, len: def.rng, t: 0, life: 0.35 });
      else if (g === 'camera') this.fx.push({ k: 'flash', x: u.x, y: sy, t: 0, life: 0.3 });
      else if (def.rng >= 280 && def.area) {
        this.fx.push({ k: 'shell', x1: u.x, y1: sy, x2: tx, y2: ty, t: 0, life: 0.55, r: def.shots ? 70 : 50 });
        this.ev.push('boom');
      } else if (def.rng >= 90 || k === 'plane' || k === 'aa') {
        const n = def.shots || 1;
        for (let i = 0; i < n; i++) this.fx.push({ k: 'tracer', x1: u.x + u.dir * (12 + i * 14), y1: sy - i * 6, x2: tx + rnd(-6, 6), y2: ty + rnd(-6, 6), t: -i * 0.08, life: 0.14, heavy: def.atk > 150 });
        if (def.area && def.rng >= 150) this.fx.push({ k: 'boom', x: tx, y: ty, r: 26, t: 0.05, life: 0.4 });
        this.ev.push(def.atk >= 150 ? 'big' : 'shot');
      } else {
        this.fx.push({ k: 'spark', x: tx, y: ty, t: 0, life: 0.2 });
        this.ev.push('hit');
      }
    }

    hit(a, f, dmg, fromCannon) {
      if (f.dead) return;
      let m = 1;
      if (a && a.def.bonus && a.def.bonus[f.def.type]) m = a.def.bonus[f.def.type];
      f.hp -= dmg * m;
      if (a && a.def.freeze) f.freeze = Math.max(f.freeze, f.def.boss ? a.def.freeze * 0.5 : a.def.freeze);
      if (a && a.def.slow) f.slow = Math.max(f.slow, a.def.slow);
      if (f.def.stealth && a && a.def.area) f.revealed = true;
      if (f.hp <= 0) { this.die(f); return; }
      if (!f.def.nokb && !fromCannon) {
        const kb = f.def.kb;
        const thr = f.max * (1 - (f.kbDone + 1) / kb);
        if (kb > 1 && f.hp <= thr) { f.kbDone++; this.knock(f); }
      }
    }
    knock(f) { f.kbT = 0.45; f.vx = -f.dir * 230; f.wasAtk = false; f.freeze = 0; }

    die(f, silent) {
      if (!silent && f.side === 0 && !f.revived && this._undying && this._undying.some(c => c !== f && Math.abs(c.x - f.x) < 350) && Math.random() < 0.5) {
        f.revived = true; f.hp = f.max * 0.5; this.knock(f);
        this.fx.push({ k: 'text', txt: '✝ 復活！', x: f.x, y: -f.alt - 60, t: 0, life: 1.2, col: '#ffe680' });
        return;
      }
      f.dead = true; f.hp = 0; f.vx = -f.dir * 140; f.fade = 0;
      if (f.def.type === 'armor' || f.def.type === 'air' || f.def.look.k === 'gun') this.fx.push({ k: 'boom', x: f.x, y: -f.alt - 15, r: 34 * (f.def.look.big || 1), t: 0, life: 0.6 });
      if (silent) return;
      if (f.side === 1) {
        this.kills++;
        const r = Math.round(f.def.reward * (1 + this.wl * 0.1));
        this.money = Math.min(G.WALLET.max[this.wl], this.money + r);
        if (f.def.boss) {
          this.ev.push('bossdown');
          this.fx.push({ k: 'text', txt: '★ 擊敗 ' + f.def.name + '！', t: 0, life: 2.2, big: true, col: '#ffd34a' });
          if (this.st.boss2 && f.def.id === this.st.boss) {
            this.boss2T = 2.5;
            this.fx.push({ k: 'snowflash', t: 0, life: 2 });
          }
        }
      }
    }

    hitBase(side, dmg) {
      const b = this.base[side];
      if (b.hp <= 0) return;
      b.hp = Math.max(0, b.hp - dmg); b.hit = 0.15;
      if (side === 1 && !this.bossOut && this.st.boss) { this.bossOut = true; this.spawnEnemy(this.st.boss); }
    }

    updateFx(dt) {
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter(f => f.t < f.life);
    }
  }
  G.Battle = Battle;
})(window.GE);
