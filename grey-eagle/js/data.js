// 灰鷹軍團 — 遊戲資料：稀有度、我方角色、敵方兵種、國家（碉堡造型）、40 個關卡。
// 所有國家與陣營名稱都是虛構的。
'use strict';
window.GE = window.GE || {};
(function (G) {

  // ---------------- 稀有度 ----------------
  G.RAR = {
    basic:  { name: '基本',     col: '#c9ced6', lvCost: 120 },
    ex:     { name: 'EX',       col: '#5fd17a', lvCost: 150 },
    rare:   { name: '稀有',     col: '#4aa3ff', lvCost: 200 },
    super:  { name: '激稀有',   col: '#b26bff', lvCost: 300 },
    uber:   { name: '超激稀有', col: '#ffc83d', lvCost: 400 },
    legend: { name: '傳說稀有', col: '#ff6ad5', lvCost: 600 },
  };
  G.RAR_ORDER = ['basic', 'ex', 'rare', 'super', 'uber', 'legend'];

  // 錢包（後勤）等級：上限、每秒收入、升級花費
  G.WALLET = {
    max:  [1000, 1600, 2200, 2800, 3400, 4000, 4800, 6000],
    rate: [25, 32, 40, 48, 56, 64, 74, 90],
    cost: [80, 160, 240, 320, 400, 480, 560],
  };

  // ---------------- 我方角色 ----------------
  // 欄位：cost 花費、cd 再出擊秒數、hp、atk、rng 射程、spd 移動速度、atkT 攻擊間隔、kb 被擊退次數
  // type：inf 步兵 / armor 裝甲 / air 空中；area 範圍攻擊；bonus 對某屬性加倍
  const U = [];
  function unit(id, rar, names, o) { U.push(Object.assign({ id, rar, names, kb: 3, type: 'inf' }, o)); }

  // ⚪ 基本（推關卡解鎖：unlock = 需要通過的關卡數）
  unit('recruit', 'basic', ['新兵', '老兵'], { unlock: 0, cost: 50, cd: 2.5, hp: 150, atk: 12, rng: 45, spd: 45, atkT: 1.0,
    look: { k: 'inf', gear: 'rifle' }, desc: '便宜又出得快，用人數撐住前線。' });
  unit('shield', 'basic', ['盾牌兵', '鋼盾隊'], { unlock: 1, cost: 100, cd: 4, hp: 600, atk: 4, rng: 40, spd: 32, atkT: 2.0,
    look: { k: 'inf', gear: 'shield' }, desc: '血量很高的擋線專家，幫後排爭取時間。' });
  unit('rifleman', 'basic', ['步槍兵', '神射手'], { unlock: 2, cost: 150, cd: 4, hp: 200, atk: 35, rng: 180, spd: 38, atkT: 1.5,
    look: { k: 'inf', gear: 'longrifle' }, desc: '中距離射擊，躲在盾牌兵後面最安全。' });
  unit('bike', 'basic', ['摩托傳令兵', '偵察騎兵'], { unlock: 3, cost: 120, cd: 3, hp: 160, atk: 28, rng: 50, spd: 130, atkT: 0.8, kb: 2,
    look: { k: 'bike' }, desc: '速度超快，最先衝到前線騷擾敵人。' });
  unit('mg', 'basic', ['機槍組', '重機槍陣地'], { unlock: 4, cost: 240, cd: 6, hp: 260, atk: 8, rng: 150, spd: 28, atkT: 0.4, area: true,
    look: { k: 'inf', gear: 'mg' }, desc: '範圍掃射，專門對付一大群步兵。' });
  unit('bazooka', 'basic', ['火箭筒兵', '反坦克小隊'], { unlock: 6, cost: 300, cd: 8, hp: 280, atk: 100, rng: 190, spd: 32, atkT: 3.0,
    bonus: { armor: 3 }, look: { k: 'inf', gear: 'bazooka' }, desc: '對裝甲單位造成 3 倍傷害。' });
  unit('mortar', 'basic', ['迫擊砲組', '砲兵連'], { unlock: 8, cost: 420, cd: 12, hp: 240, atk: 80, rng: 350, spd: 24, atkT: 3.5, area: true,
    look: { k: 'inf', gear: 'mortar' }, desc: '從很遠的地方往前線轟炸，範圍攻擊。' });
  unit('ltank', 'basic', ['輕型坦克', '中型坦克'], { unlock: 11, cost: 650, cd: 15, hp: 1800, atk: 70, rng: 170, spd: 34, atkT: 2.2, area: true, kb: 4, type: 'armor',
    look: { k: 'tank', v: 'light' }, desc: '又硬又能打的裝甲主力。' });
  unit('transport', 'basic', ['運輸機', '空降師'], { unlock: 15, cost: 900, cd: 30, special: 'drop', hp: 1, atk: 0, rng: 0, spd: 0, atkT: 1,
    look: { k: 'plane', v: 'transport' }, desc: '飛到前線上空，一次空降 4 名傘兵。' });

  // 🟢 EX（達成條件取得）
  unit('cook', 'ex', ['炊事兵', '主廚'], { exNeed: 5, exText: '通過第 5 關', cost: 200, cd: 10, hp: 400, atk: 10, rng: 45, spd: 30, atkT: 1.5,
    heal: true, look: { k: 'inf', gear: 'ladle', hat: 'chef' }, desc: '每 4 秒用熱湯幫附近友軍補血。' });
  unit('dog', 'ex', ['軍犬', '獵犬隊長'], { exNeed: 8, exText: '通過第 8 關', cost: 90, cd: 2.5, hp: 110, atk: 22, rng: 30, spd: 170, atkT: 0.6, kb: 2,
    look: { k: 'dog' }, desc: '全遊戲最快的偷襲兵。' });
  unit('pigeon', 'ex', ['信鴿兵', '信鴿中隊'], { exNeed: 10, exText: '通過第 10 關', cost: 75, cd: 3, hp: 70, atk: 14, rng: 40, spd: 150, atkT: 0.7, kb: 1, type: 'air',
    look: { k: 'pigeon' }, desc: '又便宜又快的空中單位。' });
  unit('band', 'ex', ['軍樂隊', '皇家樂團'], { exNeed: 17, exText: '通過小國篇（第 17 關）', cost: 250, cd: 12, hp: 350, atk: 6, rng: 45, spd: 35, atkT: 1.5,
    aura: 'speed', look: { k: 'inf', gear: 'trumpet' }, desc: '吹號讓附近友軍移動速度 +30%。' });
  unit('reporter', 'ex', ['戰地記者', '王牌攝影師'], { exNeed: 24, exText: '通過遠方參戰國篇（第 24 關）', cost: 280, cd: 10, hp: 300, atk: 15, rng: 200, spd: 35, atkT: 4, area: true,
    freeze: 1.2, look: { k: 'inf', gear: 'camera', hat: 'cap' }, desc: '相機閃光讓範圍內敵人暫停 1.2 秒。' });

  // 🔵 稀有
  unit('flame', 'rare', ['噴火兵', '烈焰突擊兵'], { cost: 450, cd: 10, hp: 500, atk: 22, rng: 90, spd: 30, atkT: 0.45, area: true,
    bonus: { inf: 1.5 }, look: { k: 'inf', gear: 'flame' }, desc: '短距離火焰範圍攻擊，對步兵 1.5 倍。' });
  unit('skier', 'rare', ['雪地滑雪兵', '雪原遊騎兵'], { cost: 250, cd: 5, hp: 320, atk: 45, rng: 55, spd: 115, atkT: 0.9,
    snowPro: true, look: { k: 'inf', gear: 'ski', hat: 'hood' }, desc: '下雪的關卡反而更快。' });
  unit('frog', 'rare', ['蛙人', '深海蛙人'], { cost: 320, cd: 8, hp: 300, atk: 110, rng: 50, spd: 70, atkT: 1.5, kb: 2,
    stealthOnce: true, look: { k: 'inf', gear: 'frog' }, desc: '隱身接近，第一次出手前敵人看不到它。' });
  unit('aa', 'rare', ['防空砲組', '防空要塞'], { cost: 380, cd: 10, hp: 400, atk: 30, rng: 240, spd: 26, atkT: 0.6, area: true,
    bonus: { air: 3 }, look: { k: 'aa' }, desc: '對空中單位造成 3 倍傷害。' });
  unit('engineer', 'rare', ['工兵', '工兵連'], { cost: 220, cd: 6, hp: 380, atk: 12, rng: 60, spd: 32, atkT: 1.4, area: true,
    slow: 3, look: { k: 'inf', gear: 'wire' }, desc: '鐵絲網讓敵人緩速 3 秒。' });
  unit('smg', 'rare', ['衝鋒槍兵', '突擊隊員'], { cost: 210, cd: 4, hp: 300, atk: 13, rng: 100, spd: 42, atkT: 0.28,
    look: { k: 'inf', gear: 'smg' }, desc: '超高攻速，近距離火力很猛。' });

  // 🟣 激稀有
  unit('heavy', 'super', ['重型坦克', '虎牙重戰車'], { cost: 1500, cd: 30, hp: 7000, atk: 220, rng: 210, spd: 22, atkT: 3, area: true, type: 'armor',
    nokb: true, look: { k: 'tank', v: 'heavy' }, desc: '超高血量，不會被擊退。' });
  unit('ace', 'super', ['王牌狙擊手', '鷹眼'], { cost: 900, cd: 20, hp: 350, atk: 420, rng: 560, spd: 26, atkT: 4, kb: 2,
    look: { k: 'inf', gear: 'sniper', hat: 'cap' }, desc: '全遊戲最遠的單體射程之一。' });
  unit('spg', 'super', ['自走砲', '巨砲自走車'], { cost: 1200, cd: 25, hp: 1800, atk: 260, rng: 460, spd: 20, atkT: 5, area: true, type: 'armor',
    look: { k: 'tank', v: 'spg' }, desc: '遠程大範圍爆炸。' });
  unit('paras', 'super', ['傘兵突擊隊', '夜鷹傘兵'], { cost: 800, cd: 18, hp: 1000, atk: 70, rng: 75, spd: 55, atkT: 1.2, area: true,
    special: 'front', look: { k: 'squad' }, desc: '出場直接空降到戰場中段。' });
  unit('train', 'super', ['裝甲列車', '鋼鐵巨龍號'], { cost: 2000, cd: 35, hp: 5500, atk: 130, rng: 260, spd: 45, atkT: 1.5, area: true, type: 'armor',
    nokb: true, nonstop: true, look: { k: 'train' }, desc: '只會一路往前開，邊走邊開火。' });

  // 🟡 超激稀有
  unit('thor', 'uber', ['「雷神」超重戰車', '雷神・天罰型'], { cost: 3000, cd: 60, hp: 16000, atk: 600, rng: 290, spd: 16, atkT: 4, area: true, type: 'armor',
    nokb: true, freeze: 1.5, look: { k: 'tank', v: 'thor' }, desc: '主砲一發震暈範圍內所有敵人 1.5 秒。' });
  unit('ghost', 'uber', ['幽靈王牌飛行員', '幽靈・極光'], { cost: 1800, cd: 35, hp: 2600, atk: 160, rng: 130, spd: 105, atkT: 1.0, area: true, kb: 4, type: 'air',
    look: { k: 'plane', v: 'ghost' }, desc: '在空中來回俯衝，對地對空都能打。' });
  unit('general', 'uber', ['鋼鐵將軍', '鋼鐵元帥'], { cost: 2200, cd: 45, hp: 5500, atk: 200, rng: 110, spd: 30, atkT: 1.5, kb: 4,
    aura: 'atk', look: { k: 'inf', gear: 'saber', hat: 'officer', big: 1.35 }, desc: '在場時全軍攻擊力 +50%。' });
  unit('hunter', 'uber', ['無聲獵人', '無聲死神'], { cost: 2400, cd: 45, hp: 1300, atk: 750, rng: 620, spd: 25, atkT: 3, kb: 2,
    stealth: true, look: { k: 'inf', gear: 'sniper', hat: 'ghillie' }, desc: '隱形狙擊手，只有範圍攻擊打得到它。' });
  unit('battleship', 'uber', ['陸地戰艦', '陸地戰艦・不沉號'], { cost: 4200, cd: 80, hp: 22000, atk: 380, rng: 420, spd: 12, atkT: 2.5, area: true, type: 'armor',
    nokb: true, look: { k: 'landship' }, desc: '會移動的要塞，艦砲對整條線開火。' });

  // 🌈 傳說稀有
  unit('ark', 'legend', ['「末日方舟」空中要塞', '末日方舟・終焉型'], { cost: 4500, cd: 120, special: 'ark', hp: 1, atk: 350, rng: 0, spd: 0, atkT: 1,
    look: { k: 'plane', v: 'ark' }, desc: '飛過整個戰場一路地毯式轟炸，敵人無法攻擊它。' });
  unit('undying', 'legend', ['不死軍團長', '不死軍團長・永恆'], { cost: 3200, cd: 70, hp: 9000, atk: 320, rng: 130, spd: 28, atkT: 1.6, area: true, kb: 4,
    aura: 'revive', look: { k: 'inf', gear: 'flag', hat: 'officer', big: 1.5 }, desc: '附近友軍陣亡時有 50% 機率原地復活一次。' });
  unit('clock', 'legend', ['時鐘工程師', '時鐘工程師・零點'], { cost: 3500, cd: 90, special: 'rewind', hp: 2200, atk: 120, rng: 160, spd: 30, atkT: 1.2, area: true,
    look: { k: 'inf', gear: 'wrench', hat: 'goggles', big: 1.25 }, desc: '出場時讓全場敵人倒退回後方並暫停 1.5 秒。' });
  unit('colossus', 'legend', ['「巨像」移動堡壘', '巨像・終焉型'], { cost: 5500, cd: 120, hp: 60000, atk: 260, shots: 3, rng: 300, spd: 10, atkT: 2, area: true, type: 'armor',
    nokb: true, look: { k: 'colossus' }, desc: '血量是一般坦克的十倍，三座砲塔各自開火。' });
  unit('marshal', 'legend', ['影之元帥', '影之元帥・黑夜'], { cost: 4000, cd: 100, special: 'marshal', hp: 4500, atk: 240, rng: 150, spd: 32, atkT: 1.4, kb: 3,
    look: { k: 'inf', gear: 'baton', hat: 'officer', cape: true, big: 1.4 }, desc: '出場後 20 秒內全軍冷卻減半、收入 1.5 倍。' });
  unit('sub', 'legend', ['雷霆潛艦', '雷霆潛艦・深淵'], { cost: 3800, cd: 90, special: 'sub', hp: 6000, atk: 1600, rng: 60, spd: 50, atkT: 3, kb: 1, type: 'armor',
    baseOnly: true, nokb: true, look: { k: 'sub' }, desc: '潛行到敵方碉堡前才浮出水面，專門攻城。' });

  // 運輸機空降的傘兵（不在名冊裡）
  G.PARA = { id: 'para', rar: 'basic', names: ['傘兵', '傘兵'], hp: 180, atk: 25, rng: 50, spd: 50, atkT: 1, kb: 2, type: 'inf',
    look: { k: 'inf', gear: 'smg', hat: 'para' } };

  G.UNITS = U;
  G.UNIT = {}; for (const u of U) G.UNIT[u.id] = u;

  // ---------------- 敵方兵種 ----------------
  const E = {};
  function en(id, name, o) { E[id] = Object.assign({ id, name, kb: 3, type: 'inf' }, o); }
  en('conscript', '民兵', { hp: 90, atk: 8, rng: 40, spd: 35, atkT: 1, reward: 15, look: { k: 'inf', gear: 'rifle' } });
  en('rifleman', '步槍兵', { hp: 160, atk: 18, rng: 150, spd: 30, atkT: 1.6, reward: 30, look: { k: 'inf', gear: 'longrifle' } });
  en('mger', '機槍手', { hp: 220, atk: 6, rng: 140, spd: 25, atkT: 0.4, area: true, reward: 50, look: { k: 'inf', gear: 'mg' } });
  en('shieldman', '碉堡兵', { hp: 700, atk: 10, rng: 40, spd: 20, atkT: 2, reward: 60, look: { k: 'inf', gear: 'shield' } });
  en('cyclist', '腳踏車兵', { hp: 110, atk: 12, rng: 40, spd: 90, atkT: 0.9, kb: 2, reward: 25, look: { k: 'bicycle' } });
  en('cav', '騎兵', { hp: 300, atk: 35, rng: 50, spd: 110, atkT: 1.2, reward: 60, look: { k: 'horse' } });
  en('skier', '滑雪兵', { hp: 200, atk: 25, rng: 50, spd: 100, atkT: 1, reward: 40, look: { k: 'inf', gear: 'ski', hat: 'hood' } });
  en('guerrilla', '游擊隊', { hp: 250, atk: 45, rng: 60, spd: 60, atkT: 1.2, stealthOnce: true, reward: 50, look: { k: 'inf', gear: 'smg', hat: 'beret' } });
  en('mountaineer', '山地兵', { hp: 450, atk: 30, rng: 50, spd: 30, atkT: 1.3, reward: 50, look: { k: 'inf', gear: 'rifle', pack: true } });
  en('warcry', '戰吼步兵', { hp: 350, atk: 34, rng: 50, spd: 45, atkT: 1.1, reward: 50, look: { k: 'inf', gear: 'rifle' } });
  en('landing', '登陸兵', { hp: 400, atk: 25, rng: 60, spd: 40, atkT: 1.2, reward: 45, look: { k: 'inf', gear: 'rifle' } });
  en('jungle', '叢林蛇兵', { hp: 600, atk: 35, rng: 60, spd: 40, atkT: 1.2, reward: 60, look: { k: 'inf', gear: 'smg' } });
  en('horde', '人海步兵', { hp: 140, atk: 12, rng: 45, spd: 45, atkT: 1, reward: 10, look: { k: 'inf', gear: 'rifle' } });
  en('para', '空降兵', { hp: 350, atk: 30, rng: 50, spd: 40, atkT: 1, reward: 60, spawnMid: true, look: { k: 'inf', gear: 'smg', hat: 'para' } });
  en('sniper', '狙擊手', { hp: 250, atk: 150, rng: 500, spd: 20, atkT: 4, kb: 2, reward: 150, look: { k: 'inf', gear: 'sniper' } });
  en('lighttank', '輕型坦克', { hp: 1400, atk: 50, rng: 160, spd: 30, atkT: 2.2, area: true, type: 'armor', reward: 150, look: { k: 'tank', v: 'light' } });
  en('armoredcar', '裝甲車', { hp: 900, atk: 30, rng: 120, spd: 70, atkT: 0.8, type: 'armor', reward: 100, look: { k: 'car' } });
  en('tank', '中型坦克', { hp: 3000, atk: 110, rng: 190, spd: 25, atkT: 2.5, area: true, type: 'armor', reward: 250, look: { k: 'tank', v: 'med' } });
  en('heavytank', '重型坦克', { hp: 7000, atk: 220, rng: 210, spd: 18, atkT: 3, area: true, type: 'armor', kb: 2, reward: 400, look: { k: 'tank', v: 'heavy' } });
  en('artillery', '野戰砲', { hp: 600, atk: 120, rng: 380, spd: 15, atkT: 5, area: true, reward: 200, look: { k: 'gun' } });
  en('rocket', '火箭砲車', { hp: 900, atk: 90, rng: 380, spd: 20, atkT: 4, area: true, type: 'armor', reward: 250, look: { k: 'rocket' } });
  en('fighter', '戰鬥機', { hp: 500, atk: 40, rng: 100, spd: 90, atkT: 1, type: 'air', reward: 120, look: { k: 'plane', v: 'fighter' } });
  en('bomber', '轟炸機', { hp: 1500, atk: 200, rng: 60, spd: 40, atkT: 3, area: true, type: 'air', reward: 300, look: { k: 'plane', v: 'bomber' } });

  // 魔王（數值不吃關卡倍率，只吃章節倍率）
  const B = { boss: true, kb: 3 };
  en('b_guard', '皇家衛隊長', Object.assign({}, B, { hp: 1500, atk: 40, rng: 60, spd: 25, atkT: 1.4, reward: 300, look: { k: 'inf', gear: 'saber', hat: 'bearskin', big: 1.8 } }));
  en('b_windmill', '風車巨砲', Object.assign({}, B, { hp: 2500, atk: 50, rng: 200, spd: 14, atkT: 3, area: true, kb: 2, reward: 400, look: { k: 'gun', big: 1.8, mill: true } }));
  en('b_fort', '鐵壁要塞', Object.assign({}, B, { hp: 6000, atk: 30, rng: 50, spd: 10, atkT: 2, kb: 2, reward: 500, look: { k: 'inf', gear: 'shield', big: 2.2 } }));
  en('b_battery', '海岸砲台', Object.assign({}, B, { hp: 5000, atk: 80, rng: 300, spd: 10, atkT: 4, area: true, kb: 2, reward: 600, look: { k: 'gun', big: 2.1 } }));
  en('b_mech', '兵工廠機甲', Object.assign({}, B, { hp: 6000, atk: 120, rng: 200, spd: 18, atkT: 2.5, area: true, type: 'armor', kb: 2, reward: 700, look: { k: 'tank', v: 'med', big: 1.6 } }));
  en('b_stone', '石盾將軍', Object.assign({}, B, { hp: 9000, atk: 100, rng: 70, spd: 15, atkT: 2, area: true, reward: 800, look: { k: 'inf', gear: 'shield', hat: 'crest', big: 2.2 } }));
  en('b_guerrilla', '森林游擊隊長', Object.assign({}, B, { hp: 7000, atk: 250, rng: 70, spd: 30, atkT: 2, stealthOnce: true, reward: 900, look: { k: 'inf', gear: 'smg', hat: 'beret', big: 2 } }));
  en('b_wing', '白翼騎兵團', Object.assign({}, B, { hp: 11000, atk: 180, rng: 70, spd: 70, atkT: 1.6, area: true, reward: 1000, look: { k: 'horse', big: 1.7, wings: true } }));
  en('b_outback', '荒野突擊隊', Object.assign({}, B, { hp: 13000, atk: 120, rng: 150, spd: 50, atkT: 1, type: 'armor', reward: 1100, look: { k: 'car', big: 1.8 } }));
  en('b_eagle', '鷹之飛行中隊', Object.assign({}, B, { hp: 12000, atk: 160, rng: 120, spd: 60, atkT: 1.4, area: true, type: 'air', reward: 1200, look: { k: 'plane', v: 'fighter', big: 2.2 } }));
  en('b_snake', '叢林之蛇', Object.assign({}, B, { hp: 20000, atk: 220, rng: 90, spd: 25, atkT: 1.8, area: true, reward: 1300, look: { k: 'inf', gear: 'smg', big: 2.2 } }));
  en('b_line', '巨型要塞防線', Object.assign({}, B, { hp: 40000, atk: 300, rng: 320, spd: 6, atkT: 3.5, area: true, type: 'armor', nokb: true, reward: 2000, look: { k: 'gun', big: 2.7 } }));
  en('b_desert', '沙漠之王', Object.assign({}, B, { hp: 45000, atk: 350, rng: 230, spd: 18, atkT: 2.6, area: true, type: 'armor', kb: 2, reward: 2000, look: { k: 'tank', v: 'heavy', big: 1.7 } }));
  en('b_lionship', '獅心戰艦', Object.assign({}, B, { hp: 70000, atk: 380, rng: 450, spd: 8, atkT: 3, area: true, type: 'armor', nokb: true, reward: 2500, look: { k: 'landship' } }));
  en('b_fortress', '空中要塞', Object.assign({}, B, { hp: 80000, atk: 450, rng: 140, spd: 20, atkT: 3, area: true, type: 'air', kb: 2, reward: 3000, look: { k: 'plane', v: 'bomber', big: 2.6 } }));
  en('b_bear', '鋼鐵巨熊', Object.assign({}, B, { hp: 120000, atk: 550, rng: 260, spd: 12, atkT: 3, area: true, type: 'armor', nokb: true, reward: 4000, look: { k: 'tank', v: 'bear', big: 2 } }));
  en('b_winter', '冬將軍', Object.assign({}, B, { hp: 150000, atk: 380, rng: 320, spd: 10, atkT: 2.5, area: true, nokb: true, freezeAll: 12, reward: 5000, look: { k: 'inf', gear: 'saber', hat: 'winter', big: 3 } }));
  G.ENEMY = E;

  // ---------------- 國家（全部虛構） ----------------
  // uni 軍服色、helm 帽型、flag 旗幟、base 碉堡造型、baseCol 碉堡主色、gun 碉堡砲台
  G.NATIONS = {
    lux: { name: '銀塔大公國', proto: '盧森堡', uni: '#5d7fa8', helm: 'kepi', flag: { bands: ['#c9d3df', '#7aa5d6'], em: 'tower', emc: '#fff' }, base: 'tower', baseCol: '#b9c2cf' },
    den: { name: '白帆王國', proto: '丹麥', uni: '#8b7d5a', helm: 'cap', flag: { bands: ['#f2f2f2'], em: 'sail', emc: '#c8323a' }, base: 'lighthouse', baseCol: '#f0ece0' },
    nl:  { name: '鬱金香共和國', proto: '荷蘭', uni: '#5f6b4c', helm: 'm1', flag: { bands: ['#f08a24', '#ffffff', '#2e5aa8'], vert: true, em: 'tulip', emc: '#d8344a' }, base: 'windmill', baseCol: '#c47a4a' },
    be:  { name: '鐵盾王國', proto: '比利時', uni: '#6b6a4e', helm: 'adrian', flag: { bands: ['#e8c547', '#7d8590'], em: 'shield', emc: '#2c4f8a' }, base: 'fort', baseCol: '#9a9a90' },
    no:  { name: '峽灣王國', proto: '挪威', uni: '#4f5b45', helm: 'hood', flag: { bands: ['#2c4f8a'], em: 'wave', emc: '#fff' }, base: 'battery', baseCol: '#7d8590',
      gun: { atk: 60, rng: 380, t: 7 } },
    cz:  { name: '雙峰聯邦', proto: '捷克斯洛伐克', uni: '#6b6b47', helm: 'cap', flag: { bands: ['#ffffff', '#2b56a3'], em: 'peaks', emc: '#c8323a' }, base: 'factory', baseCol: '#8c6b5a' },
    gr:  { name: '橄欖城邦', proto: '希臘', uni: '#7a7550', helm: 'adrian', flag: { bands: ['#4a90d9', '#ffffff', '#4a90d9'], em: 'olive', emc: '#3d7a3a' }, base: 'temple', baseCol: '#ece4d2' },
    yu:  { name: '山鷹聯邦', proto: '南斯拉夫', uni: '#5c5a3c', helm: 'cap', flag: { bands: ['#1f3c88', '#ffffff', '#b8322f'], em: 'peak', emc: '#333' }, base: 'logfort', baseCol: '#7a5a3a' },
    pl:  { name: '白鷹王國', proto: '波蘭', uni: '#6a6b46', helm: 'square', flag: { bands: ['#ffffff', '#c23b3b'], em: 'wing', emc: '#e8e8e8' }, base: 'manor', baseCol: '#e8dcc0' },
    nz:  { name: '銀蕨群島', proto: '紐西蘭', uni: '#857552', helm: 'lemon', flag: { bands: ['#1a1a1a'], em: 'fern', emc: '#d8dde4' }, base: 'palisade', baseCol: '#8a6a44' },
    sa:  { name: '金角聯邦', proto: '南非', uni: '#a08b5b', helm: 'pith', flag: { bands: ['#2f7a3a', '#e8b830'], em: 'horn', emc: '#fff' }, base: 'stonefort', baseCol: '#b59a72' },
    au:  { name: '袋鼠大陸', proto: '澳洲', uni: '#9a8456', helm: 'slouch', flag: { bands: ['#1d3a7a'], em: 'stars', emc: '#fff' }, base: 'station', baseCol: '#a8aeb4' },
    ca:  { name: '楓葉自治領', proto: '加拿大', uni: '#7a6f48', helm: 'brodie', flag: { bands: ['#ffffff', '#c0392b', '#ffffff'], vert: true, em: 'leaf', emc: '#c0392b' }, base: 'timber', baseCol: '#8a5a34' },
    in:  { name: '孔雀邦', proto: '印度', uni: '#a38c5c', helm: 'brodie', flag: { bands: ['#2a8a7a', '#f2c14e'], em: 'feather', emc: '#1f5fa8' }, base: 'hillfort', baseCol: '#c99a64' },
    mx:  { name: '仙人掌共和國', proto: '墨西哥', uni: '#6f7a55', helm: 'kepi', flag: { bands: ['#2f8f4e', '#ffffff', '#c0392b'], vert: true, em: 'cactus', emc: '#2f8f4e' }, base: 'adobe', baseCol: '#d6a873' },
    br:  { name: '翠綠合眾國', proto: '巴西', uni: '#5f7a4a', helm: 'm1', flag: { bands: ['#2d9b4f'], em: 'snake', emc: '#f2d22e' }, base: 'jungle', baseCol: '#5d7a3a' },
    fr:  { name: '藍玫共和國', proto: '法國', uni: '#6a8fd0', helm: 'adrian', flag: { bands: ['#2c4f9e', '#ffffff', '#d8455a'], vert: true, em: 'rose', emc: '#d8455a' }, base: 'line', baseCol: '#8f949a',
      gun: { atk: 150, rng: 420, t: 6 } },
    uk:  { name: '獅冠王國', proto: '英國', uni: '#8a7a50', helm: 'brodie', flag: { bands: ['#203f80', '#c8102e', '#203f80'], em: 'crown', emc: '#ffd34a' }, base: 'castle', baseCol: '#9c9488',
      gun: { atk: 200, rng: 420, t: 6 } },
    us:  { name: '星條聯邦', proto: '美國', uni: '#6b6b3f', helm: 'm1', flag: { bands: ['#b22234', '#ffffff', '#b22234', '#ffffff', '#b22234'], em: 'bigstar', emc: '#1f3a7a' }, base: 'steel', baseCol: '#7a8088',
      gun: { atk: 260, rng: 430, t: 5.5 } },
    su:  { name: '紅星聯盟', proto: '蘇聯', uni: '#7b7a52', helm: 'ushanka', flag: { bands: ['#c0211f'], em: 'star', emc: '#ffd34a' }, base: 'kremlin', baseCol: '#a8322c',
      gun: { atk: 320, rng: 450, t: 5 } },
  };

  // ---------------- 40 關 ----------------
  // [國家, 關名, 場地長度, 地形, 天氣, 出兵表[[兵種, 首次出現秒, 間隔秒]], 魔王, 第二魔王]
  const S = [
    ['lux', '銀塔小鎮', 1400, 'town', '', [['conscript', 3, 7]]],
    ['den', '白帆港口', 1500, 'harbor', '', [['conscript', 2, 6], ['cyclist', 15, 12]]],
    ['den', '王宮廣場', 1600, 'harbor', '', [['conscript', 2, 5], ['cyclist', 10, 10], ['rifleman', 25, 18]], 'b_guard'],
    ['nl', '運河小徑', 1600, 'canal', 'flood', [['conscript', 2, 5], ['rifleman', 12, 14]]],
    ['nl', '風車平原', 1700, 'canal', 'flood', [['conscript', 2, 5], ['rifleman', 10, 12], ['mger', 30, 25]], 'b_windmill'],
    ['be', '邊境碉堡', 1700, 'fortland', '', [['conscript', 2, 5], ['shieldman', 8, 16], ['rifleman', 20, 14]]],
    ['be', '鐵壁要塞', 1800, 'fortland', '', [['shieldman', 4, 12], ['conscript', 2, 4], ['mger', 20, 20]], 'b_fort'],
    ['no', '雪峰峽灣', 1800, 'fjord', 'snow', [['skier', 3, 8], ['conscript', 2, 5], ['rifleman', 15, 14]]],
    ['no', '海岸砲台', 1900, 'fjord', 'snow', [['skier', 3, 7], ['rifleman', 8, 12], ['shieldman', 20, 18]], 'b_battery'],
    ['cz', '雙峰隘口', 1900, 'industry', '', [['conscript', 2, 4], ['lighttank', 25, 30], ['rifleman', 10, 12]]],
    ['cz', '兵工廠', 2000, 'industry', '', [['conscript', 2, 4], ['lighttank', 15, 22], ['mger', 10, 18]], 'b_mech'],
    ['gr', '橄欖山丘', 2000, 'olive', '', [['mountaineer', 4, 9], ['rifleman', 8, 12], ['conscript', 2, 5]]],
    ['gr', '古城遺跡', 2100, 'olive', '', [['mountaineer', 3, 8], ['mger', 10, 16], ['shieldman', 15, 15]], 'b_stone'],
    ['yu', '迷霧森林', 2100, 'forest', 'fog', [['guerrilla', 6, 10], ['conscript', 2, 4], ['rifleman', 12, 12]]],
    ['yu', '深谷伏擊', 2200, 'forest', 'fog', [['guerrilla', 4, 8], ['mountaineer', 8, 10], ['mger', 15, 16]], 'b_guerrilla'],
    ['pl', '金色麥田', 2200, 'wheat', '', [['cav', 8, 10], ['conscript', 2, 4], ['rifleman', 10, 11]]],
    ['pl', '白鷹大平原', 2300, 'wheat', '', [['cav', 5, 8], ['lighttank', 20, 22], ['rifleman', 8, 10]], 'b_wing'],
    ['nz', '銀蕨丘陵', 2300, 'hills', '', [['warcry', 3, 7], ['rifleman', 8, 10], ['mger', 15, 15]]],
    ['sa', '黃金草原', 2300, 'savanna', '', [['armoredcar', 8, 14], ['conscript', 2, 4], ['lighttank', 20, 20]]],
    ['au', '紅土荒野', 2400, 'outback', '', [['armoredcar', 5, 12], ['warcry', 3, 7], ['mger', 12, 15]], 'b_outback'],
    ['ca', '楓林海灘', 2400, 'maple', '', [['landing', 2, 4], ['rifleman', 6, 9], ['tank', 30, 30]]],
    ['in', '雲霧山脈', 2400, 'mountain', 'fog', [['mountaineer', 2, 6], ['artillery', 20, 25], ['rifleman', 8, 10]]],
    ['mx', '仙人掌高原', 2500, 'plateau', '', [['fighter', 10, 14], ['conscript', 2, 4], ['rifleman', 8, 10]], 'b_eagle'],
    ['br', '翡翠叢林', 2500, 'jungle', '', [['jungle', 3, 7], ['fighter', 15, 18], ['artillery', 25, 25]], 'b_snake'],
    ['fr', '薰衣草鄉村', 2600, 'lavender', '', [['conscript', 2, 4], ['rifleman', 5, 8], ['tank', 20, 25]]],
    ['fr', '陰影森林', 2600, 'forest', 'fog', [['mger', 4, 10], ['tank', 12, 20], ['guerrilla', 6, 10]]],
    ['fr', '藍色防線', 2700, 'lavender', '', [['shieldman', 3, 8], ['artillery', 12, 20], ['tank', 20, 22], ['rifleman', 5, 8]]],
    ['fr', '玫瑰之都', 2700, 'city', '', [['rifleman', 3, 6], ['tank', 10, 18], ['artillery', 15, 20], ['heavytank', 60, 60]], 'b_line'],
    ['uk', '沙海綠洲', 2700, 'desert', '', [['armoredcar', 3, 9], ['tank', 12, 18], ['rifleman', 4, 8]]],
    ['uk', '沙漠之王', 2800, 'desert', '', [['tank', 6, 14], ['fighter', 12, 16], ['armoredcar', 4, 9]], 'b_desert'],
    ['uk', '白崖海峽', 2800, 'cliffs', '', [['fighter', 4, 10], ['bomber', 30, 30], ['rifleman', 3, 7]]],
    ['uk', '霧都城堡', 2900, 'city', 'fog', [['sniper', 8, 18], ['tank', 8, 15], ['fighter', 10, 14], ['rifleman', 2, 6]], 'b_lionship'],
    ['us', '金沙海灘', 2900, 'beach', '', [['landing', 2, 3], ['mger', 5, 10], ['tank', 15, 18]]],
    ['us', '鋼鐵城市', 3000, 'city', '', [['para', 8, 10], ['tank', 8, 14], ['sniper', 15, 20], ['rifleman', 2, 6]]],
    ['us', '工業心臟', 3000, 'industry', '', [['tank', 5, 12], ['bomber', 20, 25], ['fighter', 8, 12], ['mger', 3, 8]]],
    ['us', '自由之塔', 3100, 'city', '', [['heavytank', 20, 30], ['bomber', 15, 22], ['para', 6, 9], ['fighter', 5, 10]], 'b_fortress'],
    ['su', '無盡雪原', 3100, 'snowfield', 'snow', [['horde', 1, 2.5], ['tank', 15, 18], ['sniper', 20, 22]]],
    ['su', '鋼鐵洪流', 3200, 'steppe', '', [['tank', 3, 8], ['heavytank', 15, 20], ['horde', 2, 4]]],
    ['su', '廢墟之城', 3200, 'ruins', '', [['sniper', 5, 12], ['horde', 1, 3], ['rocket', 15, 20], ['heavytank', 25, 28]]],
    ['su', '紅色首都', 3300, 'capital', 'snow', [['horde', 1, 2.5], ['heavytank', 10, 18], ['rocket', 12, 18], ['fighter', 8, 12]], 'b_bear', 'b_winter'],
  ];
  G.STAGES = S.map((s, i) => ({
    i, nation: s[0], name: s[1], len: s[2], terrain: s[3], weather: s[4], pool: s[5], boss: s[6] || null, boss2: s[7] || null,
    mag: 1 + i * 0.05,
    baseHp: Math.round(1200 * Math.pow(1.13, i) / 100) * 100,
    xp: 300 + 150 * i,
    medals: s[6] ? 150 : 60,
  }));
  G.STAGE_GROUPS = [
    { name: '第一階段：小國', from: 0, to: 16 },
    { name: '第二階段：遠方的參戰國', from: 17, to: 23 },
    { name: '第三階段：四大強國', from: 24, to: 39 },
  ];
  G.CHAPTERS = [
    { name: '第一章', mult: 1 },
    { name: '第二章', mult: 1.8 },
    { name: '第三章', mult: 3 },
  ];

  G.WEATHER_TEXT = { flood: '🌊 淹水：我方移動變慢', snow: '❄️ 下雪：我方移動變慢（滑雪兵加速）', fog: '🌫️ 濃霧：看不清遠方的敵人' };

  // ---------------- 扭蛋 ----------------
  G.GACHA = {
    normal: { name: '常駐扭蛋', rates: [['rare', 70], ['super', 25], ['uber', 5]] },
    legend: { name: '傳說祭', rates: [['rare', 69.7], ['super', 25], ['uber', 5], ['legend', 0.3]] },
    cost1: 150, cost10: 1500,
  };
})(window.GE);
