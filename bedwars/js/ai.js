'use strict';
// ===================== 電腦難度 =====================
const DIFF = {
  easy: { label: '簡單', react: 0.55, aimErr: 0.35, cps: 4, hit: 0.5, speed: 0.85, sneakSpeed: 1.6, bridge: 0.42, turn: 6, attackDelay: 80, strafe: 0.25, gapple: false, fireball: false, place: 0.55, diamonds: false, dmgMul: 0.85 },
  normal: { label: '普通', react: 0.32, aimErr: 0.18, cps: 6, hit: 0.7, speed: 0.95, sneakSpeed: 2.1, bridge: 0.27, turn: 10, attackDelay: 45, strafe: 0.6, gapple: true, fireball: false, place: 0.35, diamonds: true, dmgMul: 1 },
  hard: { label: '困難', react: 0.16, aimErr: 0.07, cps: 8.5, hit: 0.86, speed: 1.0, sneakSpeed: 2.7, bridge: 0.17, turn: 16, attackDelay: 22, strafe: 1, gapple: true, fireball: true, place: 0.2, diamonds: true, dmgMul: 1 },
};
const BOT_NAMES = ['阿土伯', '小胖', '快手阿凱', '床殺手', '方塊王', '阿明', '夜貓子', '搭橋大師', '鐵劍哥', '小黃', '老K', '虛空行者', '羊毛控', '拆床仔', '阿鬼', '小飛俠'];

function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

class Bot extends Fighter {
  constructor(game, team, name, role) {
    super(game, team, name, true);
    this.P = DIFF[game.difficulty];
    this.role = role;          // 'attack' | 'defend'
    this.cmd = null;           // 玩家隊友指令：'defend' | 'follow' | 'attack'
    this.wish = { x: 0, z: 0 }; this.wantJump = false; this.wantSneak = false; this.wantSprint = true;
    this.resetBrain();
    this.attackAt = game.time + this.P.attackDelay * (0.7 + Math.random() * 0.6);
    this.nextDiamondT = 70 + Math.random() * 60;
  }
  resetBrain() {
    this.state = 'gather'; this.stateT = 0; this.gatherFor = 6 + Math.random() * 6;
    this.aggro = null; this.scanT = 0; this.placeCd = 0; this.breaking = null;
    this.sideT = 0; this.sideSign = 1; this.stuckT = 0; this.progPos = this.pos.clone();
    this.targetTeam = null; this.huntTarget = null; this.guardPt = null; this.guardT = 0;
    this.aimOff = 0; this.eatCd = 0; this.fireCd = 0; this.repairT = 0;
    this.trail = []; this.noBlockT = 0;
  }
  // 記錄走過的路（回家時沿原路走回去）
  recordTrail() {
    if (!this.onGround) return;
    const t = this.team.spawn;
    if (Math.hypot(this.pos.x - t.x, this.pos.z - t.z) < 9) { this.trail.length = 0; return; }
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last.x - this.pos.x, last.z - this.pos.z) > 1.4) {
      this.trail.push({ x: this.pos.x, y: this.pos.y, z: this.pos.z });
      if (this.trail.length > 250) this.trail.shift();
    }
  }
  setState(s) { this.state = s; this.stateT = 0; this.breaking = null; }

  // ---------- 每幀思考 ----------
  think(dt) {
    const g = this.game, P = this.P;
    this.wish.x = 0; this.wish.z = 0; this.wantJump = false; this.wantSneak = false; this.wantSprint = true;
    this.placeCd -= dt; this.scanT -= dt; this.stateT += dt; this.sideT -= dt; this.eatCd -= dt; this.fireCd -= dt;
    if (P.gapple && this.hp < 8 && this.eatCd <= 0 && this.count('gapple')) { g.useGapple(this); this.eatCd = 6; }
    if (this.scanT <= 0) {
      this.scanT = P.react * (0.7 + Math.random() * 0.6);
      this.aimOff = (Math.random() - 0.5) * 2 * P.aimErr;
      const e = this.pickEnemy();
      if (e !== this.aggro) { this.aggro = e; this.breaking = null; }
    }
    if (this.aggro && (!this.aggro.alive || this.aggro.pos.y < VOID_Y + 4)) this.aggro = null;
    if (this.breaking) { this.doBreaking(dt); }
    else if (this.aggro) this.fight(dt);
    else this.runState(dt);
    if (this.state !== 'return' && this.state !== 'voidjump') this.recordTrail();
    this.checkStuck(dt);
  }

  homeBed() { return this.team.bedCenter; }

  pickEnemy() {
    const g = this.game;
    let best = null, bestD = Infinity;
    const mode = this.cmd || this.role;
    const bed = this.homeBed();
    for (const e of g.fighters) {
      if (e.team === this.team || !e.alive || e.spectator) continue;
      if (e.pos.y < VOID_Y + 6) continue;
      const d = e.pos.distanceTo(this.pos);
      if (Math.abs(e.pos.y - this.pos.y) > 6) continue;
      let range = mode === 'defend' ? 9 : mode === 'follow' ? 11 : 10;
      if (mode === 'defend' && Math.hypot(e.pos.x - bed.x, e.pos.z - bed.z) < 16) range = 22;
      if (this.state === 'hunt') range = 16;
      if (e === this.lastAttacker && g.time - this.lastAttackerT < 3) range = Math.max(range, 14);
      // 拆床中：除非敵人貼身，否則專心拆床
      if (this.state === 'attack' && this.targetTeam && this.hp > 7 && d > 2.2 &&
        Math.hypot(this.pos.x - this.targetTeam.bedCenter.x, this.pos.z - this.targetTeam.bedCenter.z) < 7) continue;
      if (d < range && d < bestD) { best = e; bestD = d; }
    }
    return best;
  }

  // ---------- 視角 ----------
  turnTo(yaw, pitch, dt) {
    const r = this.P.turn * dt;
    const dy = angDiff(yaw, this.yaw);
    this.yaw += Math.max(-r, Math.min(r, dy));
    const dp = pitch - this.pitch;
    this.pitch += Math.max(-r, Math.min(r, dp));
  }
  aimAt(p, dt) {
    const e = this.eye();
    const dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z;
    const yaw = Math.atan2(-dx, -dz) + this.aimOff;
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    this.turnTo(yaw, pitch, dt);
    return Math.abs(angDiff(yaw - this.aimOff, this.yaw));
  }

  // ---------- 戰鬥 ----------
  fight(dt) {
    const g = this.game, P = this.P, t = this.aggro;
    const mode = this.cmd || this.role;
    const bed = this.homeBed();
    if (mode === 'defend' && Math.hypot(this.pos.x - bed.x, this.pos.z - bed.z) > 26) { this.aggro = null; return; }
    const tp = new THREE.Vector3(t.pos.x, t.pos.y + 1.2, t.pos.z);
    const d = Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z);
    const err = this.aimAt(tp, dt);
    const close = 2.3;
    if (d > close) {
      const r = this.navigate(t.pos, dt, { stop: close, face: false });
      if (r === 'noBlocks') { this.aggro = null; return; }
    } else {
      // 左右走位（確認腳下有地面）
      if (Math.random() < dt * 0.7) this.sideSign *= -1;
      const fx = Math.cos(this.yaw) * this.sideSign, fz = -Math.sin(this.yaw) * this.sideSign;
      const fy = Math.floor(this.pos.y - 0.05);
      if (g.world.solid(Math.floor(this.pos.x + fx * 0.9), fy, Math.floor(this.pos.z + fz * 0.9))) {
        this.wish.x = fx * P.strafe; this.wish.z = fz * P.strafe;
      }
    }
    if (this.onGround && d < 4 && Math.random() < dt * 1.2 * P.strafe) this.wantJump = true;
    // 攻擊
    this.attackCd -= dt;
    const d3 = this.eye().distanceTo(tp);
    if (this.attackCd <= 0 && d3 <= 3.3) {
      this.attackCd = (1 / P.cps) * (0.75 + Math.random() * 0.5);
      this.swingT = 0.25;
      if (err < 0.6 && Math.random() < P.hit && g.world.lineClear(this.eye(), tp)) g.attack(this, t);
    }
    // 火球：對方在虛空上方或搭橋時
    if (P.fireball && this.fireCd <= 0 && d > 7 && d < 24 && this.count('fireball')) {
      const under = g.world.solid(Math.floor(t.pos.x), Math.floor(t.pos.y - 0.05), Math.floor(t.pos.z)) ||
        g.world.solid(Math.floor(t.pos.x), Math.floor(t.pos.y - 1.05), Math.floor(t.pos.z)) ||
        g.world.solid(Math.floor(t.pos.x), Math.floor(t.pos.y - 2.05), Math.floor(t.pos.z));
      const islandBelow = (() => { for (let k = 1; k < 8; k++) if (g.world.solid(Math.floor(t.pos.x), Math.floor(t.pos.y) - k - 1, Math.floor(t.pos.z))) return k > 3; return false; })();
      if (!islandBelow && err < 0.15 && g.world.lineClear(this.eye(), tp)) {
        g.throwProjectile(this, 'fireball'); this.fireCd = 6 + Math.random() * 4;
      }
    }
  }

  // ---------- 導航（含自動搭橋） ----------
  navigate(goal, dt, o = {}) {
    const g = this.game, w = g.world, P = this.P;
    const stop = o.stop != null ? o.stop : 0.6;
    let dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < stop) return 'arrived';
    dx /= dist; dz /= dist;
    if (this.sideT > 0) {
      const sx = -dz * this.sideSign, sz = dx * this.sideSign;
      dx = sx * 0.85 + dx * 0.15; dz = sz * 0.85 + dz * 0.15;
      const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    }
    if (o.face !== false) this.turnTo(Math.atan2(-dx, -dz), 0, dt);
    this.wish.x = dx; this.wish.z = dz;
    const fy = Math.floor(this.pos.y - 0.05);
    // 前方是否懸空
    if (this.onGround) {
      const ax = this.pos.x + dx * 0.75, az = this.pos.z + dz * 0.75;
      const cx = Math.floor(ax), cz = Math.floor(az);
      if (!w.solid(cx, fy, cz) && !w.solid(cx, fy + 1, cz)) {
        let drop = false;
        for (let k = 1; k <= 2; k++) if (w.solid(cx, fy - k, cz)) { drop = true; break; }
        if (!drop) {
          const item = this.blockItemFor(false);
          if (!item) { this.wish.x = 0; this.wish.z = 0; this.wantSneak = true; return 'noBlocks'; }
          this.wantSneak = true; this.wantSprint = false;
          if (this.placeCd <= 0) {
            let tx = cx, tz = cz;
            const bx = Math.floor(this.pos.x), bz = Math.floor(this.pos.z);
            if (!w.hasNeighbor(tx, fy, tz)) {
              if (!w.solid(tx, fy, bz) && w.hasNeighbor(tx, fy, bz)) tz = bz;
              else if (!w.solid(bx, fy, tz) && w.hasNeighbor(bx, fy, tz)) tx = bx;
            }
            if (!w.solid(tx, fy, tz) && w.hasNeighbor(tx, fy, tz)) {
              g.placeBlock(this, tx, fy, tz, item);
              this.swingT = 0.2;
              this.placeCd = P.bridge * (0.8 + Math.random() * 0.4);
            }
          }
          return 'bridging';
        }
      }
    }
    // 前方障礙
    const fx = Math.floor(this.pos.x + dx * 0.75), fz = Math.floor(this.pos.z + dz * 0.75);
    const feet = Math.floor(this.pos.y + 0.05);
    if (fx !== Math.floor(this.pos.x) || fz !== Math.floor(this.pos.z)) {
      const fb = w.get(fx, feet, fz), hb = w.get(fx, feet + 1, fz);
      const footSolid = fb && BINFO[fb].solid && BINFO[fb].h >= 1;
      const headSolid = hb && BINFO[hb].solid;
      if (footSolid || headSolid) {
        const above2 = w.solid(fx, feet + 2, fz) || w.solid(Math.floor(this.pos.x), feet + 2, Math.floor(this.pos.z));
        if (footSolid && !headSolid && !above2) {
          if (this.onGround) this.wantJump = true;
        } else if (o.canBreak !== false) {
          const cy = headSolid ? feet + 1 : feet;
          if (this.canBreak(fx, cy, fz)) { this.startBreak(fx, cy, fz); return 'breaking'; }
          if (footSolid && this.canBreak(fx, feet, fz)) { this.startBreak(fx, feet, fz); return 'breaking'; }
          if (this.sideT <= 0) { this.sideT = 1.0 + Math.random(); this.sideSign = Math.random() < 0.5 ? 1 : -1; }
        }
      }
    }
    return 'moving';
  }

  canBreak(x, y, z) {
    const w = this.game.world, b = w.get(x, y, z);
    if (!b) return false;
    if (BINFO[b].bed >= 0) return BINFO[b].bed !== this.team.id;
    if (!w.isPlaced(x, y, z)) return false;
    if (w.placedBy(x, y, z) === this.team.id && this.state !== 'attack') return false;
    return BINFO[b].hard >= 0 && BINFO[b].hard < 30;
  }
  startBreak(x, y, z) {
    const b = this.game.world.get(x, y, z);
    this.breaking = { x, y, z, t: 0, need: breakTime(b, this) * (1.1 + Math.random() * 0.3), type: b };
  }
  doBreaking(dt) {
    const g = this.game, br = this.breaking;
    const b = g.world.get(br.x, br.y, br.z);
    if (b !== br.type) { this.breaking = null; return; }
    const c = new THREE.Vector3(br.x + 0.5, br.y + 0.4, br.z + 0.5);
    if (this.eye().distanceTo(c) > 5.2) { this.breaking = null; return; }
    // 被攻擊就先反擊
    const rushing = this.state === 'attack' && this.hp > 7;
    if (!rushing && this.lastAttacker && g.time - this.lastAttackerT < 0.3 && this.lastAttacker.alive) { this.breaking = null; this.aggro = this.lastAttacker; return; }
    this.aimAt(c, dt);
    this.wantSneak = true;
    br.t += dt;
    if (Math.random() < dt * 4) this.swingT = 0.25;
    if (br.t >= br.need) { g.breakBlock(this, br.x, br.y, br.z); this.breaking = null; }
  }

  checkStuck(dt) {
    this.stuckT += dt;
    if (this.stuckT < 2.5) return;
    this.stuckT = 0;
    const moved = Math.hypot(this.pos.x - this.progPos.x, this.pos.z - this.progPos.z);
    this.progPos.copy(this.pos);
    const wants = Math.hypot(this.wish.x, this.wish.z) > 0.1;
    if (wants && moved < 0.5 && !this.breaking) {
      this.sideT = 0.9 + Math.random(); this.sideSign = Math.random() < 0.5 ? 1 : -1;
      this.wantJump = true;
    }
  }

  // ---------- 狀態機 ----------
  decide() {
    const g = this.game, P = this.P;
    let mode = this.cmd || this.role;
    if (!this.team.bedAlive && mode === 'defend') mode = this.cmd ? 'follow' : 'attack';
    if (mode === 'follow' && (!g.player.alive && g.player.eliminated)) mode = 'attack';
    if (mode === 'follow') return this.setState('follow');
    if (mode === 'defend') {
      if (!this.team.defenseDone && this.team.bedAlive) {
        if (this.blockCount() >= 12) return this.setState('defense');
        return this.setState('gather');
      }
      if (P.diamonds && !this.cmd && g.time > this.nextDiamondT && this.blockCount() >= 24) {
        this.nextDiamondT = g.time + 100 + Math.random() * 60;
        return this.setState('diamond');
      }
      return this.setState('guard');
    }
    // 進攻
    if (g.time < this.attackAt && !this.cmd && this.team.bedAlive) return this.setState('gather');
    if (this.blockCount() < 40) return this.setState('gather');
    this.targetTeam = this.chooseTarget();
    if (this.targetTeam) return this.setState('attack');
    if (this.blockCount() < 24 && this.team.bedAlive) return this.setState('gather');
    return this.setState('hunt');
  }

  chooseTarget() {
    const g = this.game;
    const cands = g.teams.filter(t => t !== this.team && t.bedAlive && !t.eliminated);
    if (!cands.length) return null;
    let tot = 0;
    const ws = cands.map(t => {
      const d = Math.hypot(t.spawn.x - this.pos.x, t.spawn.z - this.pos.z);
      let wgt = 60 / (d + 20);
      if (t === g.player.team) wgt *= 1.5;
      tot += wgt; return wgt;
    });
    let r = Math.random() * tot;
    for (let i = 0; i < cands.length; i++) { r -= ws[i]; if (r <= 0) return cands[i]; }
    return cands[0];
  }

  runState(dt) {
    const g = this.game, t = this.team;
    switch (this.state) {
      case 'gather': {
        const r = this.navigate(t.gen, dt, { stop: 0.5 });
        if (r === 'noBlocks') { this.setState('return'); break; }
        if (r === 'arrived') {
          this.lookAround(dt);
          const need = (this.cmd || this.role) === 'attack' ? 36 : 24;
          if ((this.stateT > this.gatherFor && this.res.iron >= 8) || this.res.iron >= need || this.res.gold >= 7 || this.stateT > 30) { this.setState('shop'); }
        }
        break;
      }
      case 'shop': {
        const r = this.navigate(t.shop, dt, { stop: 1.8 });
        if (r === 'noBlocks') { this.setState('return'); break; }
        if (r === 'arrived' || this.stateT > 20) {
          this.doShopping();
          this.gatherFor = 12 + Math.random() * 8;
          this.decide();
        }
        break;
      }
      case 'defense': {
        if (!t.bedAlive) { t.defenseDone = true; this.decide(); break; }
        const r = this.navigate(t.spawn, dt, { stop: 0.6 });
        if (r === 'arrived' || this.stateT > 10) {
          this.aimAt(this.homeBed(), dt);
          if (this.placeCd <= 0) {
            const cell = g.nextDefenseCell(t, this);
            if (!cell) { t.defenseDone = true; this.decide(); break; }
            let item = cell.layer === 2 && this.count('endstone') ? 'endstone' : this.blockItemFor(false);
            if (cell.layer === 1 && this.count('wool')) item = 'wool';
            if (!item) { this.setState('gather'); break; }
            g.placeBlock(this, cell.x, cell.y, cell.z, item);
            this.swingT = 0.2;
            this.placeCd = this.P.place * (0.7 + Math.random() * 0.6);
          }
        }
        break;
      }
      case 'guard': {
        if (!t.bedAlive && this.stateT > 3) { this.decide(); if (this.state !== 'guard') break; }
        if (!this.guardPt || this.guardT <= 0) {
          const bc = this.homeBed();
          const sp = t.spawn;
          this.guardPt = { x: (bc.x + sp.x) / 2 + (Math.random() - 0.5) * 6, z: (bc.z + sp.z) / 2 + (Math.random() - 0.5) * 6 };
          this.guardT = 3 + Math.random() * 4;
        }
        this.guardT -= dt;
        const r = this.navigate(this.guardPt, dt, { stop: 0.8, canBreak: false });
        if (r === 'arrived') this.lookAround(dt);
        this.repairT -= dt;
        if (this.repairT <= 0) {
          this.repairT = 8;
          if (t.bedAlive && g.missingDefense(t) >= 2 && this.blockCount() >= 4) { this.setState('defense'); break; }
        }
        if (this.stateT > 28 + Math.random() * 10) this.setState('gather');
        break;
      }
      case 'attack': {
        const tt = this.targetTeam;
        if (!tt || !tt.bedAlive) { this.decide(); break; }
        const bc = tt.bedCenter;
        const eye = this.eye();
        const d = eye.distanceTo(bc);
        if (d <= 4.0) {
          this.aimAt(bc, dt);
          const dir = new THREE.Vector3().subVectors(bc, eye).normalize();
          const hit = g.world.raycast(eye, dir, d + 1);
          if (hit) {
            if (this.canBreak(hit.x, hit.y, hit.z)) this.startBreak(hit.x, hit.y, hit.z);
            else { this.sideT = 1.2; this.sideSign = Math.random() < 0.5 ? 1 : -1; this.navigate(bc, dt, { stop: 0.5 }); }
          } else this.navigate(bc, dt, { stop: 0.5 });
        } else {
          const r = this.navigate(bc, dt, { stop: 0.8 });
          if (r === 'noBlocks') this.setState('return');
        }
        if (this.stateT > 120) this.setState('return');
        break;
      }
      case 'hunt': {
        if (!this.huntTarget || !this.huntTarget.alive || this.stateT > 40) {
          let best = null, bd = Infinity;
          for (const e of g.fighters) if (e.team !== this.team && e.alive && !e.spectator && e.pos.y > VOID_Y + 6) {
            const d = e.pos.distanceTo(this.pos); if (d < bd) { bd = d; best = e; }
          }
          this.huntTarget = best; this.stateT = 0;
          if (!best) { this.setState('guard'); break; }
        }
        const r = this.navigate(this.huntTarget.pos, dt, { stop: 2 });
        if (r === 'noBlocks') this.setState('return');
        break;
      }
      case 'return': {
        const home = Math.hypot(this.pos.x - t.spawn.x, this.pos.z - t.spawn.z) < 9;
        if (home) this.trail.length = 0;
        const goal = this.trail.length ? this.trail[this.trail.length - 1] : t.spawn;
        const r = this.navigate(goal, dt, { stop: this.trail.length ? 0.7 : 1.2 });
        if (r === 'arrived') {
          if (this.trail.length) { this.trail.pop(); this.noBlockT = 0; }
          else { this.setState(this.res.iron >= 8 || this.res.diamond ? 'shop' : 'gather'); break; }
        }
        if (r === 'noBlocks') {
          this.noBlockT += dt;
          if (this.noBlockT > 3 && this.trail.length) { this.trail.pop(); this.noBlockT = 0; }
        }
        // 真的回不去：床還在就跳虛空回家
        if (this.stateT > 30 && !home) {
          if (t.bedAlive) this.setState('voidjump'); else this.setState('hunt');
        }
        break;
      }
      case 'voidjump': {
        let dx = t.spawn.x - this.pos.x, dz = t.spawn.z - this.pos.z;
        const l = Math.hypot(dx, dz) || 1;
        this.wish.x = dx / l; this.wish.z = dz / l; this.wantSneak = false;
        this.turnTo(Math.atan2(-dx, -dz), 0, dt);
        if (this.blockedH && this.onGround) this.wantJump = true;
        if (this.stateT > 15) this.setState('return');
        break;
      }
      case 'diamond': {
        const dg = g.nearestGen('diamond', this.pos);
        const r = this.navigate(dg, dt, { stop: 0.5 });
        if (r === 'noBlocks') { this.setState('return'); break; }
        if (r === 'arrived') this.lookAround(dt);
        if (this.res.diamond >= 4 || this.stateT > 45) this.setState('return');
        break;
      }
      case 'follow': {
        const pl = g.player;
        if (!pl.alive || pl.spectator) { this.setState('guard'); break; }
        const r = this.navigate(pl.pos, dt, { stop: 2.5 });
        if (r === 'arrived') this.turnTo(pl.yaw, 0, dt);
        if (r === 'noBlocks') this.setState('return');
        if (this.stateT > 30 && this.blockCount() < 8) this.setState('gather');
        break;
      }
      default: this.decide();
    }
  }

  lookAround(dt) {
    if (Math.random() < dt * 0.5) this.lookYaw = this.yaw + (Math.random() - 0.5) * 2;
    if (this.lookYaw != null) this.turnTo(this.lookYaw, 0, dt);
  }

  doShopping() {
    const g = this.game, P = this.P;
    const mode = this.cmd || this.role;
    const rules = mode === 'defend' ? [
      () => this.blockCount() < 32 && g.buy(this, 'wool'),
      () => !this.team.defenseDone && this.count('endstone') < 12 && this.res.iron >= 28 && g.buy(this, 'endstone'),
      () => this.sword < 2 && g.buy(this, 'sword2'),
      () => this.armor < 2 && g.buy(this, 'armor2'),
      () => this.sword < 3 && g.buy(this, 'sword3'),
      () => this.armor < 3 && g.buy(this, 'armor3'),
      () => P.gapple && this.count('gapple') < 2 && g.buy(this, 'gapple'),
      () => !this.team.up.sharp && g.buyUpgrade(this, 'sharp'),
      () => this.team.up.prot < 2 && g.buyUpgrade(this, 'prot'),
      () => this.team.up.forge < 2 && g.buyUpgrade(this, 'forge'),
      () => !this.team.up.heal && g.buyUpgrade(this, 'heal'),
      () => this.blockCount() < 64 && this.res.iron >= 12 && g.buy(this, 'wool'),
    ] : [
      () => this.blockCount() < 16 && g.buy(this, 'wool'),
      () => this.sword < 2 && g.buy(this, 'sword2'),
      () => this.pick < 1 && g.buy(this, 'pick'),
      () => this.blockCount() < 48 && g.buy(this, 'wool'),
      () => this.armor < 2 && g.buy(this, 'armor2'),
      () => this.sword < 3 && g.buy(this, 'sword3'),
      () => this.armor < 3 && g.buy(this, 'armor3'),
      () => this.axe < 1 && g.buy(this, 'axe'),
      () => P.gapple && this.count('gapple') < 1 && g.buy(this, 'gapple'),
      () => P.fireball && this.count('fireball') < 1 && this.res.iron >= 48 && g.buy(this, 'fireball'),
      () => this.pick < 2 && this.res.iron >= 18 && g.buy(this, 'pick'),
      () => this.blockCount() < 64 && g.buy(this, 'wool'),
      () => !this.team.up.sharp && g.buyUpgrade(this, 'sharp'),
      () => this.team.up.prot < 1 && g.buyUpgrade(this, 'prot'),
    ];
    for (let guard = 0; guard < 30; guard++) {
      let bought = false;
      for (const r of rules) if (r()) { bought = true; break; }
      if (!bought) break;
    }
    // 把劍放回手上
    this.sel = 0;
  }
}
