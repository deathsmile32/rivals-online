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
    max:  [600, 1000, 1500, 2100, 2800, 3600, 4600, 6000],
    rate: [14, 19, 25, 32, 40, 48, 58, 70],
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
  unit('mortar', 'basic', ['迫擊砲組', '砲兵連'], { unlock: 9, cost: 420, cd: 12, hp: 240, atk: 80, rng: 350, spd: 24, atkT: 3.5, area: true,
    look: { k: 'inf', gear: 'mortar' }, desc: '從很遠的地方往前線轟炸，範圍攻擊。' });
  unit('ltank', 'basic', ['輕型坦克', '中型坦克'], { unlock: 12, cost: 650, cd: 15, hp: 1800, atk: 70, rng: 170, spd: 34, atkT: 2.2, area: true, kb: 4, type: 'armor',
    look: { k: 'tank', v: 'light' }, desc: '又硬又能打的裝甲主力。' });
  unit('transport', 'basic', ['運輸機', '空降師'], { unlock: 18, cost: 900, cd: 30, special: 'drop', hp: 1, atk: 0, rng: 0, spd: 0, atkT: 1,
    look: { k: 'plane', v: 'transport' }, desc: '飛到前線上空，一次空降 4 名傘兵。' });
  unit('grenadier', 'basic', ['擲彈兵', '精銳擲彈兵'], { unlock: 14, cost: 260, cd: 7, hp: 260, atk: 45, rng: 130, spd: 34, atkT: 2.2, area: true,
    look: { k: 'inf', gear: 'grenade', lob: true }, desc: '丟手榴彈，炸傷一整群敵人。' });
  unit('halftrack', 'basic', ['半履帶車', '裝甲運兵車'], { unlock: 26, cost: 500, cd: 12, hp: 1400, atk: 18, rng: 140, spd: 60, atkT: 0.5, type: 'armor',
    look: { k: 'halftrack' }, desc: '速度快的半履帶裝甲車，車上機槍不停掃射。' });

  // 🟢 EX（達成條件取得）
  unit('cook', 'ex', ['炊事兵', '主廚'], { exNeed: 5, exText: '通過第 5 關', cost: 200, cd: 10, hp: 400, atk: 10, rng: 45, spd: 30, atkT: 1.5,
    heal: true, look: { k: 'inf', gear: 'ladle', hat: 'chef' }, desc: '每 4 秒用熱湯幫附近友軍補血。' });
  unit('dog', 'ex', ['軍犬', '獵犬隊長'], { exNeed: 9, exText: '通過第 9 關', cost: 90, cd: 2.5, hp: 110, atk: 22, rng: 30, spd: 170, atkT: 0.6, kb: 2,
    look: { k: 'dog' }, desc: '全遊戲最快的偷襲兵。' });
  unit('pigeon', 'ex', ['信鴿兵', '信鴿中隊'], { exNeed: 11, exText: '通過第 11 關', cost: 75, cd: 3, hp: 70, atk: 14, rng: 40, spd: 150, atkT: 0.7, kb: 1, type: 'air',
    look: { k: 'pigeon' }, desc: '又便宜又快的空中單位。' });
  unit('band', 'ex', ['軍樂隊', '皇家樂團'], { exNeed: 19, exText: '通過小國篇（第 19 關）', cost: 250, cd: 12, hp: 350, atk: 6, rng: 45, spd: 35, atkT: 1.5,
    aura: 'speed', look: { k: 'inf', gear: 'trumpet' }, desc: '吹號讓附近友軍移動速度 +30%。' });
  unit('reporter', 'ex', ['戰地記者', '王牌攝影師'], { exNeed: 32, exText: '通過遠方參戰國篇（第 32 關）', cost: 280, cd: 10, hp: 300, atk: 15, rng: 200, spd: 35, atkT: 4, area: true,
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
  unit('medic', 'rare', ['醫護兵', '戰地醫官'], { cost: 300, cd: 12, hp: 450, atk: 8, rng: 45, spd: 32, atkT: 1.5,
    heal: 0.12, look: { k: 'inf', gear: 'medkit', hat: 'medic' }, desc: '每 4 秒治療附近友軍，比炊事兵補得更多。' });
  unit('cavalry', 'rare', ['騎兵', '驃騎兵'], { cost: 280, cd: 6, hp: 420, atk: 60, rng: 55, spd: 120, atkT: 1.0,
    look: { k: 'horse' }, desc: '衝鋒速度極快，又有不錯的血量。' });
  unit('atgun', 'rare', ['反坦克砲', '重型反坦克砲'], { cost: 420, cd: 12, hp: 380, atk: 160, rng: 300, spd: 18, atkT: 3.2,
    bonus: { armor: 3 }, look: { k: 'gun', at: true }, desc: '長射程反坦克砲，對裝甲 3 倍傷害。' });
  unit('pillbox', 'rare', ['機槍碉堡', '鋼筋碉堡'], { cost: 600, cd: 25, hp: 4500, atk: 10, rng: 170, spd: 7, atkT: 0.35, area: true, type: 'armor',
    nokb: true, look: { k: 'pillbox' }, desc: '慢慢往前推的水泥碉堡，又硬又能掃射。' });

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
  unit('rockettruck', 'super', ['火箭砲車', '風暴火箭陣'], { cost: 1400, cd: 28, hp: 1500, atk: 120, shots: 3, rng: 420, spd: 22, atkT: 4.5, area: true, type: 'armor',
    look: { k: 'rocket' }, desc: '一次齊射三發火箭，遠距離範圍轟炸。' });
  unit('stug', 'super', ['突擊砲', '重型突擊砲'], { cost: 1300, cd: 25, hp: 4200, atk: 320, rng: 240, spd: 26, atkT: 2.8, type: 'armor',
    bonus: { armor: 2.5 }, look: { k: 'tank', v: 'stug' }, desc: '沒有砲塔的低矮戰車，專門獵殺坦克。' });
  unit('flametank', 'super', ['火焰坦克', '煉獄戰車'], { cost: 1600, cd: 30, hp: 5000, atk: 60, rng: 110, spd: 28, atkT: 0.5, area: true, type: 'armor',
    bonus: { inf: 2 }, look: { k: 'tank', v: 'flame', flame: true }, desc: '噴出火焰燒光前面的步兵，對步兵 2 倍。' });

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
  unit('dive', 'uber', ['俯衝轟炸機', '鋼鷹俯衝隊'], { cost: 2000, cd: 40, hp: 2200, atk: 450, rng: 90, spd: 110, atkT: 2.5, area: true, kb: 3, type: 'air',
    look: { k: 'plane', v: 'dive', bomb: true }, desc: '從空中俯衝投彈，炸出大範圍爆炸。' });

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

  // ---------------- 國家（敵方用真實國名；我方灰鷹軍團是虛構的） ----------------
  // uni 軍服色、helm 帽型、flag 國旗（簡化畫法）、em 載具圓標顏色、band 臂章顏色、base 碉堡造型、baseCol 碉堡主色、gun 碉堡砲台
  G.NATIONS = {
    lux: { name: '盧森堡', uni: '#5d7fa8', helm: 'kepi', em: '#e8e8e8', band: '#7aa5d6', flag: { t: 'bands', c: ['#ed2939', '#ffffff', '#00a1de'] }, base: 'tower', baseCol: '#b9c2cf' },
    den: { name: '丹麥', uni: '#8b7d5a', helm: 'cap', em: '#c8102e', band: '#c8102e', flag: { t: 'nordic', bg: '#c8102e', cross: '#ffffff' }, base: 'lighthouse', baseCol: '#f0ece0' },
    alb: { name: '阿爾巴尼亞', uni: '#6b6a4a', helm: 'kepi', em: '#e41e20', band: '#e41e20', flag: { t: 'bands', c: ['#e41e20'], em: 'eagle2', emc: '#111' }, base: 'bastion', baseCol: '#a89a84' },
    nl:  { name: '荷蘭', uni: '#5f6b4c', helm: 'm1', em: '#f08a24', band: '#f08a24', flag: { t: 'bands', c: ['#ae1c28', '#ffffff', '#21468b'] }, base: 'windmill', baseCol: '#c47a4a' },
    be:  { name: '比利時', uni: '#6b6a4e', helm: 'adrian', em: '#fdda24', band: '#fdda24', flag: { t: 'bands', c: ['#2d2926', '#fdda24', '#ef3340'], vert: true }, base: 'fort', baseCol: '#9a9a90' },
    lib: { name: '賴比瑞亞', uni: '#5a6a4a', helm: 'cap', em: '#bf0a30', band: '#002868', flag: { t: 'lib' }, base: 'colonial', baseCol: '#f2ede2' },
    no:  { name: '挪威', uni: '#4f5b45', helm: 'hood', em: '#ba0c2f', band: '#ba0c2f', flag: { t: 'nordic', bg: '#ba0c2f', cross: '#ffffff', inner: '#00205b' }, base: 'battery', baseCol: '#7d8590',
      gun: { atk: 60, rng: 380, t: 7 } },
    cz:  { name: '捷克斯洛伐克', uni: '#6b6b47', helm: 'cap', em: '#11457e', band: '#d7141a', flag: { t: 'cz' }, base: 'factory', baseCol: '#8c6b5a' },
    gr:  { name: '希臘', uni: '#7a7550', helm: 'adrian', em: '#0d5eaf', band: '#0d5eaf', flag: { t: 'gr' }, base: 'temple', baseCol: '#ece4d2' },
    yu:  { name: '南斯拉夫', uni: '#5c5a3c', helm: 'cap', em: '#c6363c', band: '#0c4076', flag: { t: 'bands', c: ['#0c4076', '#ffffff', '#c6363c'] }, base: 'logfort', baseCol: '#7a5a3a' },
    pl:  { name: '波蘭', uni: '#6a6b46', helm: 'square', em: '#dc143c', band: '#dc143c', flag: { t: 'bands', c: ['#ffffff', '#dc143c'] }, base: 'manor', baseCol: '#e8dcc0' },
    nz:  { name: '紐西蘭', uni: '#857552', helm: 'lemon', em: '#c8102e', band: '#012169', flag: { t: 'ensign', bg: '#012169', stars: 'nz' }, base: 'palisade', baseCol: '#8a6a44' },
    sa:  { name: '南非', uni: '#a08b5b', helm: 'pith', em: '#e07020', band: '#e07020', flag: { t: 'bands', c: ['#e07020', '#ffffff', '#00247d'] }, base: 'stonefort', baseCol: '#b59a72' },
    eth: { name: '衣索比亞', uni: '#8a7a52', helm: 'pith', em: '#078930', band: '#fcdd09', flag: { t: 'bands', c: ['#078930', '#fcdd09', '#da121a'] }, base: 'obelisk', baseCol: '#9a8a74' },
    cub: { name: '古巴', uni: '#8a8456', helm: 'cap', em: '#cf142b', band: '#002a8f', flag: { t: 'cuba' }, base: 'colonialfort', baseCol: '#e6c88a' },
    au:  { name: '澳洲', uni: '#9a8456', helm: 'slouch', em: '#c8102e', band: '#012169', flag: { t: 'ensign', bg: '#012169', stars: 'au' }, base: 'station', baseCol: '#a8aeb4' },
    ca:  { name: '加拿大', uni: '#7a6f48', helm: 'brodie', em: '#d52b1e', band: '#d52b1e', flag: { t: 'ensign', bg: '#c8102e', stars: 'ca' }, base: 'timber', baseCol: '#8a5a34' },
    in:  { name: '印度', uni: '#a38c5c', helm: 'brodie', em: '#ff9933', band: '#ff9933', flag: { t: 'ensign', bg: '#c8102e', stars: 'in' }, base: 'hillfort', baseCol: '#c99a64' },
    ir:  { name: '伊朗', uni: '#7a7452', helm: 'adrian', em: '#239f40', band: '#239f40', flag: { t: 'bands', c: ['#239f40', '#ffffff', '#da0000'], em: 'sun', emc: '#e0a020' }, base: 'persian', baseCol: '#d8c8a8' },
    eg:  { name: '埃及', uni: '#a08c5c', helm: 'fez', em: '#007a3d', band: '#007a3d', flag: { t: 'crescent', bg: '#007a3d', stars: 3 }, base: 'pyramid', baseCol: '#e0c48c' },
    tr:  { name: '土耳其', uni: '#6e6a48', helm: 'adrian', em: '#e30a17', band: '#e30a17', flag: { t: 'crescent', bg: '#e30a17', stars: 1 }, base: 'ottoman', baseCol: '#c8bca4' },
    mx:  { name: '墨西哥', uni: '#6f7a55', helm: 'kepi', em: '#006847', band: '#006847', flag: { t: 'bands', c: ['#006847', '#ffffff', '#ce1126'], vert: true, em: 'eagleSmall', emc: '#8a5a2a' }, base: 'adobe', baseCol: '#d6a873' },
    pe:  { name: '秘魯', uni: '#7a7a52', helm: 'kepi', em: '#d91023', band: '#d91023', flag: { t: 'bands', c: ['#d91023', '#ffffff', '#d91023'], vert: true }, base: 'inca', baseCol: '#a89880' },
    br:  { name: '巴西', uni: '#5f7a4a', helm: 'm1', em: '#009c3b', band: '#ffdf00', flag: { t: 'br' }, base: 'jungle', baseCol: '#5d7a3a' },
    fr:  { name: '法國', uni: '#6a8fd0', helm: 'adrian', em: '#0055a4', band: '#0055a4', flag: { t: 'bands', c: ['#0055a4', '#ffffff', '#ef4135'], vert: true }, base: 'line', baseCol: '#8f949a',
      gun: { atk: 150, rng: 420, t: 6 } },
    uk:  { name: '英國', uni: '#8a7a50', helm: 'brodie', em: '#c8102e', band: '#012169', flag: { t: 'uk' }, base: 'castle', baseCol: '#9c9488',
      gun: { atk: 200, rng: 420, t: 6 } },
    us:  { name: '美國', uni: '#6b6b3f', helm: 'm1', em: '#ffffff', band: '#3c3b6e', flag: { t: 'us' }, base: 'steel', baseCol: '#7a8088',
      gun: { atk: 260, rng: 430, t: 5.5 } },
    su:  { name: '蘇聯', uni: '#7b7a52', helm: 'ushanka', em: '#cc0000', band: '#cc0000', flag: { t: 'bands', c: ['#cc0000'], em: 'starCorner', emc: '#ffd700' }, base: 'kremlin', baseCol: '#a8322c',
      gun: { atk: 320, rng: 450, t: 5 } },
  };

  // ---------------- 48 關 ----------------
  // [國家, 關名, 場地長度, 地形, 天氣, 出兵表[[兵種, 首次出現秒, 間隔秒]], 魔王, 第二魔王]
  const S = [
    ['lux', '邊境小鎮', 1400, 'town', '', [['conscript', 3, 7]]],
    ['den', '海港小鎮', 1500, 'harbor', '', [['conscript', 2, 6], ['cyclist', 15, 12]]],
    ['den', '王宮廣場', 1600, 'harbor', '', [['conscript', 2, 5], ['cyclist', 10, 10], ['rifleman', 25, 18]], 'b_guard'],
    ['alb', '山城要塞', 1600, 'hills', '', [['conscript', 2, 5], ['mountaineer', 12, 14]]],
    ['nl', '運河小徑', 1600, 'canal', 'flood', [['conscript', 2, 5], ['rifleman', 12, 14]]],
    ['nl', '風車平原', 1700, 'canal', 'flood', [['conscript', 2, 5], ['rifleman', 10, 12], ['mger', 30, 25]], 'b_windmill'],
    ['be', '邊境碉堡', 1700, 'fortland', '', [['conscript', 2, 5], ['shieldman', 8, 16], ['rifleman', 20, 14]]],
    ['be', '要塞防線', 1800, 'fortland', '', [['shieldman', 4, 12], ['conscript', 2, 4], ['mger', 20, 20]], 'b_fort'],
    ['lib', '橡膠園', 1800, 'jungle', '', [['conscript', 2, 4], ['rifleman', 10, 12], ['guerrilla', 15, 16]]],
    ['no', '雪峰峽灣', 1800, 'fjord', 'snow', [['skier', 3, 8], ['conscript', 2, 5], ['rifleman', 15, 14]]],
    ['no', '海岸砲台', 1900, 'fjord', 'snow', [['skier', 3, 7], ['rifleman', 8, 12], ['shieldman', 20, 18]], 'b_battery'],
    ['cz', '山區隘口', 1900, 'industry', '', [['conscript', 2, 4], ['lighttank', 25, 30], ['rifleman', 10, 12]]],
    ['cz', '兵工廠', 2000, 'industry', '', [['conscript', 2, 4], ['lighttank', 15, 22], ['mger', 10, 18]], 'b_mech'],
    ['gr', '橄欖山丘', 2000, 'olive', '', [['mountaineer', 4, 9], ['rifleman', 8, 12], ['conscript', 2, 5]]],
    ['gr', '古城遺跡', 2100, 'olive', '', [['mountaineer', 3, 8], ['mger', 10, 16], ['shieldman', 15, 15]], 'b_stone'],
    ['yu', '迷霧森林', 2100, 'forest', 'fog', [['guerrilla', 6, 10], ['conscript', 2, 4], ['rifleman', 12, 12]]],
    ['yu', '深谷伏擊', 2200, 'forest', 'fog', [['guerrilla', 4, 8], ['mountaineer', 8, 10], ['mger', 15, 16]], 'b_guerrilla'],
    ['pl', '金色麥田', 2200, 'wheat', '', [['cav', 8, 10], ['conscript', 2, 4], ['rifleman', 10, 11]]],
    ['pl', '大平原', 2300, 'wheat', '', [['cav', 5, 8], ['lighttank', 20, 22], ['rifleman', 8, 10]], 'b_wing'],
    ['nz', '蕨葉丘陵', 2300, 'hills', '', [['warcry', 3, 7], ['rifleman', 8, 10], ['mger', 15, 15]]],
    ['sa', '黃金草原', 2300, 'savanna', '', [['armoredcar', 8, 14], ['conscript', 2, 4], ['lighttank', 20, 20]]],
    ['eth', '高原山道', 2300, 'highland', '', [['mountaineer', 2, 6], ['cav', 8, 10], ['rifleman', 6, 9]]],
    ['cub', '甘蔗田', 2400, 'tropic', '', [['landing', 2, 4], ['rifleman', 6, 9], ['armoredcar', 12, 16]]],
    ['au', '紅土荒野', 2400, 'outback', '', [['armoredcar', 5, 12], ['warcry', 3, 7], ['mger', 12, 15]], 'b_outback'],
    ['ca', '楓林海灘', 2400, 'maple', '', [['landing', 2, 4], ['rifleman', 6, 9], ['tank', 30, 30]]],
    ['in', '雲霧山脈', 2400, 'mountain', 'fog', [['mountaineer', 2, 6], ['artillery', 20, 25], ['rifleman', 8, 10]]],
    ['ir', '沙漠古道', 2500, 'persia', '', [['cav', 4, 9], ['armoredcar', 8, 12], ['artillery', 20, 25]]],
    ['eg', '金字塔沙漠', 2500, 'desert', '', [['armoredcar', 3, 9], ['tank', 15, 20], ['rifleman', 4, 8]]],
    ['tr', '海峽要塞', 2500, 'cliffs', '', [['mountaineer', 2, 6], ['artillery', 15, 20], ['mger', 5, 10]]],
    ['mx', '仙人掌高原', 2500, 'plateau', '', [['fighter', 10, 14], ['conscript', 2, 4], ['rifleman', 8, 10]], 'b_eagle'],
    ['pe', '安地斯山', 2600, 'mountain', '', [['mountaineer', 2, 5], ['fighter', 10, 14], ['artillery', 18, 22]]],
    ['br', '翡翠叢林', 2600, 'jungle', '', [['jungle', 3, 7], ['fighter', 15, 18], ['artillery', 25, 25]], 'b_snake'],
    ['fr', '薰衣草鄉村', 2600, 'lavender', '', [['conscript', 2, 4], ['rifleman', 5, 8], ['tank', 20, 25]]],
    ['fr', '陰影森林', 2600, 'forest', 'fog', [['mger', 4, 10], ['tank', 12, 20], ['guerrilla', 6, 10]]],
    ['fr', '藍色防線', 2700, 'lavender', '', [['shieldman', 3, 8], ['artillery', 12, 20], ['tank', 20, 22], ['rifleman', 5, 8]]],
    ['fr', '花都巷戰', 2700, 'city', '', [['rifleman', 3, 6], ['tank', 10, 18], ['artillery', 15, 20], ['heavytank', 60, 60]], 'b_line'],
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
  // 難度沿用原本 40 關調好的曲線，平均攤到 48 關上
  const LAST = S.length - 1;
  G.STAGES = S.map((s, i) => {
    const d = i * 39 / LAST;
    return {
      i, nation: s[0], name: s[1], len: s[2], terrain: s[3], weather: s[4], pool: s[5], boss: s[6] || null, boss2: s[7] || null,
      mag: 1 + d * 0.05,
      baseHp: Math.round(1200 * Math.pow(1.13, d) / 100) * 100,
      xp: Math.round((300 + 150 * d) / 10) * 10,
      medals: s[6] ? 150 : 60,
    };
  });
  G.STAGE_COUNT = S.length;
  G.STAGE_GROUPS = [
    { name: '第一階段：小國', from: 0, to: 18 },
    { name: '第二階段：遠方的參戰國', from: 19, to: 31 },
    { name: '第三階段：四大強國', from: 32, to: 47 },
  ];
  G.CHAPTERS = [
    { name: '第一章', mult: 1 },
    { name: '第二章', mult: 1.8 },
    { name: '第三章', mult: 3 },
  ];

  // ---------------- 碉堡研究（用軍功升級） ----------------
  G.RESEARCH = [
    { key: 'baseLv',    name: '🏰 碉堡耐久',   max: 20, base: 400, txt: lv => `碉堡體力 ${(4000 + 1500 * lv).toLocaleString()}` },
    { key: 'cannonLv',  name: '💥 要塞砲威力', max: 20, base: 400, txt: lv => `基礎傷害 ${120 + 60 * lv}` },
    { key: 'cRangeLv',  name: '🎯 要塞砲射程', max: 20, base: 300, txt: lv => `射程 ${650 + 40 * lv}` },
    { key: 'cChargeLv', name: '⚡ 要塞砲充能', max: 20, base: 350, txt: lv => `充能 ${(26 - 0.7 * lv).toFixed(1)} 秒` },
    { key: 'workLv',    name: '💼 工作效率',   max: 20, base: 300, txt: lv => `賺錢速度 +${lv * 5}%` },
    { key: 'walletLv',  name: '💰 軍費上限',   max: 20, base: 300, txt: lv => `軍費上限 +${lv * 4}%` },
    { key: 'startLv',   name: '🪙 開場軍費',   max: 10, base: 500, txt: lv => `開場就有 ${lv * 40} 軍費` },
  ];
  G.resCost = (r, lv) => r.base * (lv + 1);

  G.WEATHER_TEXT = { flood: '🌊 淹水：我方移動變慢', snow: '❄️ 下雪：我方移動變慢（滑雪兵加速）', fog: '🌫️ 濃霧：看不清遠方的敵人' };

  // ---------------- 扭蛋 ----------------
  G.GACHA = {
    normal: { name: '常駐扭蛋', rates: [['rare', 70], ['super', 25], ['uber', 5]] },
    legend: { name: '傳說祭', rates: [['rare', 69.7], ['super', 25], ['uber', 5], ['legend', 0.3]] },
    cost1: 150, cost10: 1500,
  };
})(window.GE);
