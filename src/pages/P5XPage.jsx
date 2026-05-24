import { useState, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// P5X STAT SYSTEM REFERENCE
// ═══════════════════════════════════════════════════════════════════════════════
//
// ── OFFENSIVE ──────────────────────────────────────────────────────────────────
// Crit Rate              — how often you hit a critical
// Crit Multiplier        — damage of a critical hit               (code: cdmg)
// Attack Multiplier      — overall attack boost                   (code: atk)
// Physical Multiplier    — extra damage on Physical attacks
// Gun Multiplier         — extra damage on Gun attacks
// Fire Multiplier        — extra damage on Fire attacks
// Ice Multiplier         — extra damage on Ice attacks
// Electric Multiplier    — extra damage on Electric attacks
// Wind Multiplier        — extra damage on Wind attacks
// Psy Multiplier         — extra damage on Psy attacks
// Nuclear Multiplier     — extra damage on Nuclear attacks
// Bless Multiplier       — extra damage on Bless attacks
// Curse Multiplier       — extra damage on Curse attacks
// Almighty Multiplier    — extra damage on Almighty attacks
//   → all element multipliers stored as generic (code: edm); per-element
//     handled at set-bonus level (Strife=Fire, Opulence=Ice, Courage=Physical…)
//
// ── UTILITY ────────────────────────────────────────────────────────────────────
// SP Recovery            — SP recovered per turn                  (code: spr) [TODO]
// Down Points            — how fast you knock down an enemy
// Ailment Accuracy       — chance to apply Status Ailment         (code: ailm) [TODO]
// Resistance Pierce Rate — chance to pierce enemy resistance      (code: pierce) [TODO]
// Damage Down            — bonus damage when enemy is downed
// Weakness Multiplier    — bonus damage vs element weakness
// Weak Attack Down       — damage vs weak enemy while downed
// Strong Attack Down     — damage vs resistant enemy while downed
//
// ── DEFENSIVE / SUPPORT ────────────────────────────────────────────────────────
// HP Recovery            — HP given to others (Healing Effect)    (code: heal)
// HP Recovery Taken      — HP received by self
// Shield                 — shield strength produced
// Shield Received        — shield strength received
//
// ── MELEE / RANGED BASE ────────────────────────────────────────────────────────
// Melee Attack           — Physical damage base (90% by default)
// Ranged Attack          — Gun damage; has own Damage Mult / Rounds / Accuracy / Crit Rate
//
// ── CARD SUB STAT POOLS ────────────────────────────────────────────────────────
// Space pool : CRIT Rate%, Crit Multi%, Pierce Rate%, Elem DMG%, ATK%,
//              HP%, HP, DEF%, Ailment Acc%, SP Recovery%, Speed
// Other pool : same but + ATK(flat), DEF(flat) — lower tier values than Space
//
// ── CARD UPGRADE SYSTEM ────────────────────────────────────────────────────────
// • Max upgrades per card : 5
// • Cards start with 3 or 4 sub stats
//   - 3 sub stats → 1st upgrade unlocks the 4th sub stat; remaining 4 upgrades
//                   randomly add tiers to one of the 4 existing sub stats
//   - 4 sub stats → all 5 upgrades randomly add tiers to existing sub stats
// • Each upgrade rolls 1 tier onto 1 random sub stat (tier 1 = best, tier 5 = worst)
// • Best case (4-stat card): 5 rolls all on your priority stat at tier 1
// • Worst case (3-stat card): 4 rolls spread across unwanted stats at tier 5
//
// ── TARGET CALIBRATION ─────────────────────────────────────────────────────────
// Targets represent TOTAL build bonus (set+weapon base + card mains + subs + hidden ability)
// Max achievable from cards alone (mains + realistic 2.5 rolls/card at tier 2):
//   ATK%  ~105 | CRIT Rate%  ~43 | CRIT DMG%  ~86 | Elem DMG%  ~58
//   HP%  ~138  | DEF%  ~202      | Speed  ~46
// Plus set bonuses and weapon bonuses (handled by computeStats automatically)
// ═══════════════════════════════════════════════════════════════════════════════

// Sun / Moon / Star / Sky sets (일월성진)
const CARD_SETS = [
  {name:'Prudence',       bonus2:'SPD -3, ATK +18%',                                     bonus4:'DMG Dealt +16%',
    stats2:{atk:18},        stats4:{}},
  {name:'Ruin',           bonus2:'ATK +12%',                                              bonus4:'ATK +25% for 3 turns; re-apply after Theurgy',
    stats2:{atk:12},        stats4:{atk:25}},
  {name:'Futility',       bonus2:'ATK +12%',                                              bonus4:'Ailment Accuracy +30% for 2 turns; reapply after Technical',
    stats2:{atk:12},        stats4:{}},
  {name:'Disappointment', bonus2:'ATK +12%',                                              bonus4:'DMG +25% if attribute differs from last-used skill',
    stats2:{atk:12},        stats4:{}},
  {name:'Triumph',        bonus2:'CRIT Rate +7.5%',                                       bonus4:'Resonance ATK DMG +40%',
    stats2:{crit:7.5},      stats4:{}},
  {name:'Defeat',         bonus2:'Ailment Accuracy +15%',                                 bonus4:'Fire DMG to enemies with ailments +20%',
    stats2:{},              stats4:{edm:20}},
  {name:'Worry',          bonus2:'SP Recovery +80%',                                      bonus4:'Enter battle with +25% Highlight charge',
    stats2:{},              stats4:{}},
  {name:'Reconciliation', bonus2:'SPD +6',                                                bonus4:'In combat: HP, ATK, DEF +15%',
    stats2:{spd:6},         stats4:{hp:15,atk:15,def:15}},
  {name:'Virtue',         bonus2:'Bless DMG +10%',                                        bonus4:'Bless CRIT Rate +12% when HP ≥ 50%',
    stats2:{edm:10},        stats4:{crit:12}},
  {name:'Oppression',     bonus2:'Physical DMG +10%',                                     bonus4:'Each skill hit: [Resentment] ATK +5% for 2 turns, up to 6 stacks',
    stats2:{edm:10},        stats4:{atk:30}},
  {name:'Pleasure',       bonus2:'Psy DMG +10%',                                          bonus4:'ATK +15% when dealing Psy DMG; +15% more with 3+ foes',
    stats2:{edm:10},        stats4:{atk:15}},
  {name:'Labor',          bonus2:'HP +12%',                                               bonus4:'[Navigator Thieves] All allies HP, ATK, DEF +8%',
    stats2:{hp:12},         stats4:{hp:8,atk:8,def:8}},
  {name:'Peace',          bonus2:'DEF +20%',                                              bonus4:'Shield effectiveness +18%',
    stats2:{def:20},        stats4:{}},
  {name:'Hindrance',      bonus2:'Curse DMG +10%',                                        bonus4:'Skill DMG to debuffed enemies +20%',
    stats2:{edm:10},        stats4:{}},
  {name:'Control',        bonus2:'HP +12%',                                               bonus4:'Skill attacks deal bonus 8% max-HP dmg to main target',
    stats2:{hp:12},         stats4:{}},
  {name:'Renewal',        bonus2:'Electric DMG +10%',                                     bonus4:'After ally uses Electric skill: Electric DMG +9%, up to 3 stacks',
    stats2:{edm:10},        stats4:{edm:27}},
  {name:'Courage',        bonus2:'Physical DMG +10%',                                     bonus4:'CRIT DMG +30% for 2 turns; re-apply on Crit',
    stats2:{edm:10},        stats4:{cdmg:30}},
  {name:'Strife',         bonus2:'Fire DMG +10%',                                         bonus4:'ATK +15%; +15% more if enemy weak to Fire',
    stats2:{edm:10},        stats4:{atk:15}},
  {name:'Love',           bonus2:'Healing Effect +9%',                                    bonus4:'Healing +23% when target HP ≤ 50%',
    stats2:{heal:9},        stats4:{heal:23}},
  {name:'Opulence',       bonus2:'Ice DMG +10%',                                          bonus4:'Resonance ATK DMG +40%',
    stats2:{edm:10},        stats4:{}},
  {name:'Power',          bonus2:'ATK +12%',                                              bonus4:'ATK +10% every 6 turns, up to 3 stacks',
    stats2:{atk:12},        stats4:{atk:30}},
  {name:'Victory',        bonus2:'Wind DMG +10%',                                         bonus4:'25% chance per hit to deal 20% ATK bonus damage',
    stats2:{edm:10},        stats4:{}},
  {name:'Truth',          bonus2:'Nuke DMG +10%',                                         bonus4:'Deal 30% ATK to main target when target has Elemental Ailment',
    stats2:{edm:10},        stats4:{}},
  {name:'Prosperity',     bonus2:'DMG Taken -8%',                                         bonus4:'Enter battle with +25% Highlight charge',
    stats2:{},              stats4:{}},
]

// ── REVELATION CARD SLOTS ──────────────────────────────────────────────────
// mainStats: { label, key (internal stat key or null), min (LV1), max (LV25) }
const CARD_SLOTS = [
  { id:'Space', mainStats:[
    {label:'ATK',            key:null,   min:54,   max:359,  unit:''},
    {label:'DEF',            key:null,   min:54,   max:359,  unit:''},
  ]},
  { id:'Sun', mainStats:[
    {label:'HP',             key:null,   min:162,  max:1080, unit:''},
  ]},
  { id:'Moon', mainStats:[
    {label:'ATK%',           key:'atk',  min:4.6,  max:31.4, unit:'%'},
    {label:'Elem DMG%',      key:'edm',  min:3.7,  max:25.1, unit:'%'},
    {label:'HP%',            key:'hp',   min:4.7,  max:31.5, unit:'%'},
    {label:'DEF%',           key:'def',  min:7.1,  max:47.1, unit:'%'},
    {label:'Healing Effect%',key:'heal', min:3.4,  max:22.6, unit:'%'},
  ]},
  { id:'Star', mainStats:[
    {label:'CRIT Rate%',     key:'crit', min:2.8,  max:18.8, unit:'%'},
    {label:'CRIT DMG%',      key:'cdmg', min:5.7,  max:37.6, unit:'%'},
    {label:'ATK%',           key:'atk',  min:4.6,  max:31.4, unit:'%'},
    {label:'HP%',            key:'hp',   min:4.7,  max:31.5, unit:'%'},
    {label:'DEF%',           key:'def',  min:7.1,  max:47.1, unit:'%'},
    {label:'Ailment Acc%',   key:null,   min:5.7,  max:37.6, unit:'%'},
  ]},
  { id:'Sky', mainStats:[
    {label:'ATK%',           key:'atk',  min:4.6,  max:31.4, unit:'%'},
    {label:'DEF%',           key:'def',  min:7.1,  max:47.1, unit:'%'},
    {label:'HP%',            key:'hp',   min:4.7,  max:31.5, unit:'%'},
    {label:'Speed',          key:'spd',  min:3.1,  max:20.3, unit:''},
    {label:'SP Recovery',    key:null,   min:13.6, max:90.4, unit:'%'},
  ]},
]

// Sub stats per slot — tiers [1st(best) … 5th(worst)] per upgrade roll
const CARD_SUB_STATS = {
  Space: {
    'CRIT Rate%':   [2.6, 2.3, 2.1, 1.8, 1.6],
    'CRIT DMG%':    [5.2, 4.7, 4.2, 3.6, 3.1],
    'Pierce Rate%': [2.7, 2.5, 2.2, 1.8, 1.6],
    'Elem DMG%':    [3.5, 3.1, 2.7, 2.5, 2.1],
    'ATK%':         [4.3, 3.9, 3.5, 3.1, 2.6],
    'HP%':          [4.4, 4.0, 3.5, 3.2, 2.7],
    'HP':           [175, 157, 140, 123, 105],
    'DEF%':         [6.4, 5.8, 5.2, 4.5, 3.8],
    'Ailment Acc%': [5.2, 4.7, 4.2, 3.6, 3.1],
    'SP Recovery%': [12.5, 11.2, 10.0, 8.7, 7.5],
    'Speed':        [2.8, 2.5, 2.2, 1.9, 1.6],
  },
  // Sun / Moon / Star / Sky share the same sub stat pool
  get Sun()  { return this._other },
  get Moon() { return this._other },
  get Star() { return this._other },
  get Sky()  { return this._other },
  _other: {
    'CRIT Rate%':   [2.0, 1.8, 1.7, 1.4, 1.3],
    'CRIT DMG%':    [4.1, 3.7, 3.4, 2.8, 2.5],
    'Pierce Rate%': [2.1, 1.9, 1.7, 1.4, 1.3],
    'Elem DMG%':    [2.8, 2.5, 2.1, 1.9, 1.7],
    'ATK%':         [3.5, 3.2, 2.8, 2.5, 2.0],
    'ATK':          [46,  41,  37,  32,  27],
    'HP%':          [3.6, 3.3, 2.9, 2.6, 2.1],
    'HP':           [140, 126, 112, 98,  84],
    'DEF%':         [5.2, 4.6, 4.1, 3.5, 3.0],
    'DEF':          [46,  41,  37,  32,  27],
    'Ailment Acc%': [4.1, 3.7, 3.4, 2.8, 2.5],
    'SP Recovery%': [10.0, 9.0, 7.9, 7.0, 5.9],
    'Speed':        [2.2, 2.0, 1.8, 1.5, 1.3],
  },
}

// ── REVELATION CARDS (individual cards per slot) ───────────────────────────
// Each card: { name, passives:[{name, desc}] }  — all Space cards have 주 quality
const REVELATION_CARDS = {
  Space: [
    {name:'Nativity',   passives:[
      {name:'Power',          desc:'When equipped by Justine & Caroline: Increase Desire Level by 5.0%.'},
    ]},
    {name:'Hope',       passives:[
      {name:'Labor',          desc:'When equipped by an Elucidator Phantom Thief: When granting buffs to allies with a skill, increase the main target\'s pierce rate by 5% for 1 turn.'},
      {name:'Ruin',           desc:'Each time damage is dealt with a skill, increase the user\'s Fire damage by 3%. This effect lasts 3 turns and stacks up to 8 times. When at 8 stacks, also increase user\'s critical rate by 6%.'},
      {name:'Transformation', desc:'Increase the DMG Dealt to enemies with Down status by 12%, doesn\'t stack.'},
    ]},
    {name:'Creation',   passives:[
      {name:'Reconciliation', desc:'At the start of battle, increases the DMG Dealt of the ally with the lowest SPD by 12%, doesn\'t stack.'},
      {name:'Worry',          desc:'Increases CRIT DMG by 15%/30%/45% when you have 100%/150%/200% SP Recovery.'},
      {name:'Tenacity',       desc:'When using Theurgy, ATK increases by 30% and DMG Dealt increases by 25%.'},
    ]},
    {name:'Integrity',  passives:[
      {name:'Labor',          desc:'When equipped by Navigator Thieves: Increase all allies\' HP, ATK and DEF by an additional 2% with each ally with the same element.'},
      {name:'Pleasure',       desc:'Increase DMG Bonus up to 30% based on 80% of your Healing Bonus.'},
      {name:'Ruin',           desc:'After using a Theurgy, increase party\'s damage by 10% for 3 turns.'},
    ]},
    {name:'Resolve',    passives:[
      {name:'Virtue',         desc:'Increase DMG Bonus by 10%/20%/30% when you reached 6000/9000/12000 HP.'},
      {name:'Labor',          desc:'When equipped by Navigator Thieves: Decrease the main target\'s DEF by 10% for 2 turns when inflicting debuffs.'},
      {name:'Prudence',       desc:'At the start of battle, if your SPD is at the 3rd/4th slot, then additionally increase own ATK by 24%/30%.'},
    ]},
    {name:'Awareness',  passives:[
      {name:'Control',        desc:'Increase all allies\' Fire DMG by 6% for 2 turns when you inflict Burn.'},
      {name:'Hindrance',      desc:'Increase ATK by 9% after every hit of damage to enemy with debuffs for 1 turn, up to 3 stacks.'},
      {name:'Truth',          desc:'Increase DMG Dealt by 12% when attacking enemies inflicted with Elemental Ailments, up to 2 stacks.'},
    ]},
    {name:'Departure',  passives:[
      {name:'Control',        desc:'Decrease main target\'s DEF by 23% for 2 turns after attacking them with a skill.'},
      {name:'Prosperity',     desc:'Increase all allies\' DMG Dealt by 8% for 1 turn when attacking enemies.'},
      {name:'Hindrance',      desc:'Increase ATK by 30% for 3 turns after defeating an enemy.'},
    ]},
    {name:'Growth',     passives:[
      {name:'Opulence',       desc:'Increase Ice DMG Bonus by 10% for 2 turns when triggering Follow Up, up to 3 stacks.'},
      {name:'Renewal',        desc:'Increase Follow Up CRIT DMG by 50%.'},
      {name:'Power',          desc:'Increase the cap of the ATK buff up to 5 stacks.'},
    ]},
    {name:'Wisdom',     passives:[
      {name:'Oppression',     desc:'Increase Physical DMG and Ailment Accuracy Rate by 20% when [Resentment] is not less than 5 stacks.'},
      {name:'Virtue',         desc:'When using HIGHLIGHT, increases ATK by 30% and DMG Dealt by 25%.'},
      {name:'Pleasure',       desc:'Increase DMG Bonus up to 30% based on 50% of your Ailment Accuracy Rate.'},
    ]},
    {name:'Meditation', passives:[
      {name:'Opulence',       desc:'Increase Follow Up CRIT DMG by 50%.'},
      {name:'Courage',        desc:'Increase Physical and Electric DMG by 12%. Increase the effect to 24% when there\'s only 1 enemy.'},
      {name:'Love',           desc:'Increase Healing Effect by 28% for 2 turns after landing a Crit.'},
    ]},
    {name:'Faith',      passives:[
      {name:'Love',           desc:'Increase Healing Effect by 1% for every 800 HP you have, up to 20%.'},
      {name:'Peace',          desc:'After granting Shield, increase the target\'s DEF by 7% for 2 turns up to 3 stacks.'},
      {name:'Futility',       desc:'Increase damage dealt by allies to foes inflicted with technical ailments by 10%. This effect won\'t activate if stacked.'},
    ]},
    {name:'Trust',      passives:[
      {name:'Prosperity',     desc:'When using skills on allies, the damage of all party members will be increased by 8% for 2 rounds.'},
      {name:'Power',          desc:'When the battle starts, increase the attack of other party members by 10% and cannot be triggered repeatedly.'},
      {name:'Renewal',        desc:'Increase all allies\' Electric DMG by 12% when the Electric DMG buff effect reached 3 stacks, can\'t be triggered again.'},
    ]},
    {name:'Harmony',    passives:[
      {name:'Truth',          desc:'Increase all allies\' Nuke DMG by 5% for 2 turns when inflicting Elemental Ailments, each stack is counted independently.'},
      {name:'Power',          desc:'Increase DMG Bonus by 10% for all allies with the same element, can\'t be triggered again.'},
      {name:'Victory',        desc:'Increase the target\'s DMG Taken by 12% for 2 turns when triggering the effect of the Revelation\'s buff.'},
    ]},
    {name:'Acceptance', passives:[
      {name:'Peace',          desc:'Increase DEF by 40% for 2 turns when attacked.'},
      {name:'Strife',         desc:'Each enemy on field increases your attack by 8%, up to 40%.'},
      {name:'Love',           desc:'Increase ATK by 25% when using Healing skills.'},
    ]},
    {name:'Freedom',    passives:[
      {name:'Defeat',         desc:'Increases all allies\' DMG Dealt to enemies with debuffs by 8%, doesn\'t stack.'},
      {name:'Triumph',        desc:'When using a Persona skill, gain 1 [Glory] stack. If the skill is Ice or Wind, gain 1 additional stack, up to 2 stacks. Glory: For 2 turns, increases Critical Effect by 10%. If the wearer is Ice or Wind, increases it by an additional 10%.'},
      {name:'Disappointment', desc:'When dealing Almighty damage, increase Attack by 35% and critical rate by 12%.'},
    ]},
  ],
  Sun:  [],
  Moon: [],
  Star: [],
  Sky:  [],
}

const CHARACTERS = [
  // ─── 5-Star ─────────────────────────────────────────────────────────────
  {name:'Ren Amamiya',        codename:'Joker',          role:'Sweeper',    element:'Curse',          rarity:5, cards:['Strife 4pc','Courage 2pc'],    weapon:'Best Curse ATK weapon (Exclusive recommended)', statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Curse DMG%'],   note:'Best Curse DPS — AoE specialist. Strife 4pc scales ATK with enemy count.',
    mechanics: "Will of Rebellion สะสมจากการโจมตีศัตรูที่ HP ต่ำกว่า 60% (สูงสุด 1 stack ต่อศัตรูต่อการต่อสู้) เมื่อครบ 3 stack จะเกิด Extra Action อัตโนมัติ — SP ลดลง 80% และหักใช้ 3 stack เมื่อสิ้นสุด รักษา SP ให้เกิน 60% เพื่อเปิด passive Meditate (+50% ATK ระหว่าง extra action) Merciless Pursuit สร้างดาเมจ execute บนศัตรูที่ HP ต่ำกว่า 25% หลัง extra action",
    rotation: [
      "เทิร์นปกติ → ใช้ Trickster's Plunder (AoE) โจมตีหลายเป้าเพื่อสะสม stack เร็วขึ้น",
      "ถ้าสู้บอสตัวเดียว → เปลี่ยนเป็น Phantom Omen แทน ได้ 2 stack ต่อครั้ง",
      "ครบ 3 stack → Extra Action เกิดอัตโนมัติ ใช้ Arsène's Chains (SP -80%, +25% กับศัตรูที่มี debuff)",
      "รักษา SP ให้เกิน 60% ตลอดเวลา เพื่อ Meditate passive (+50% ATK ระหว่าง extra action)",
      "ใช้ Highlight เมื่อพร้อม → ได้ 1–3 stack และ Curse AoE burst; เริ่มวงจรใหม่",
    ],
    realName:'Ren Amamiya', persona:'Arsène',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'res', Bless:'wk', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:"Trickster's Plunder", type:'Skill',   element:'Curse', sp:19,
        desc:"Deal Curse damage to all foes equal to 83.0%/91.5%/88.1%/96.6% of Attack. 20% chance to inflict Curse. Also gain 1 Will of Rebellion stack.",
        descTh:"สร้างความเสียหายธาตุ Curse ให้ศัตรูทุกตัว เท่ากับ 83.0%/91.5%/88.1%/96.6% ของ Attack โอกาส 20% ทำให้ติด Curse นอกจากนี้ รับ Will of Rebellion 1 stack"},
      {name:'Phantom Omen',        type:'Skill',   element:'Curse', sp:19,
        desc:"Deal Curse damage to 1 foe equal to 97.6%/107.6%/103.6%/113.6% of Attack. When only 1 foe is present, gain 2 Will of Rebellion stacks.",
        descTh:"สร้างความเสียหายธาตุ Curse ให้ศัตรู 1 ตัว เท่ากับ 97.6%/107.6%/103.6%/113.6% ของ Attack เมื่อมีศัตรูเพียง 1 ตัว รับ Will of Rebellion 2 stack"},
      {name:"Arsène's Chains",     type:'Skill',   element:'Curse', sp:22,
        desc:"Deal Curse damage to all foes equal to 74.2%/81.8%/78.7%/86.3% of Attack. When used on an extra action, increase damage by 25%. When attacking foes with debuffs, increase damage by 25% more.",
        descTh:"สร้างความเสียหายธาตุ Curse ให้ศัตรูทุกตัว เท่ากับ 74.2%/81.8%/78.7%/86.3% ของ Attack เมื่อใช้ในการกระทำพิเศษ เพิ่มความเสียหาย 25% เมื่อโจมตีศัตรูที่มี debuff เพิ่มความเสียหายอีก 25%"},
      {name:'Highlight',           type:'Skill',   element:'Curse', sp:0,
        desc:"Deal Curse damage to all foes equal to 205.0%/226.0%/217.6%/238.6% of Attack, and gain 1 Will of Rebellion stack.",
        descTh:"สร้างความเสียหายธาตุ Curse ให้ศัตรูทุกตัว เท่ากับ 205.0%/226.0%/217.6%/238.6% ของ Attack และรับ Will of Rebellion 1 stack"},
      {name:'Resistance',          type:'Passive', element:'-',     sp:0,
        desc:"Increase Attack by 18.0% for each Will of Rebellion stack.",
        descTh:"เพิ่ม Attack 18.0% ต่อ Will of Rebellion stack"},
      {name:'Adverse Resolve',     type:'Passive', element:'-',     sp:0,
        desc:"Increase damage on extra actions by 72.0%.",
        descTh:"เพิ่มความเสียหายในการกระทำพิเศษ 72.0%"},
    ],
    awareness:[
      {name:'Rebellion Resurgence',
        desc:"At the end of Ren's action, gain 1 Will of Rebellion stack for each foe with less than 60% HP (up to 5 stacks).\nWhen Will of Rebellion reaches 3 stacks, gain an extra action.\nAn additional extra action cannot be gained during the extra action. (Extra actions do not affect the duration of effects with turn limits).\nAt the end of an extra action, spend 3 Will of Rebellion stacks.\n*Can gain 1 Will of Rebellion stack per foe per battle.",
        descTh:"เมื่อสิ้นสุดเทิร์นของ Ren รับ Will of Rebellion 1 stack ต่อศัตรูที่มี HP ต่ำกว่า 60% (สูงสุด 5 stack)\nเมื่อ Will of Rebellion ถึง 3 stack รับการกระทำพิเศษ\nไม่สามารถรับการกระทำพิเศษเพิ่มระหว่างการกระทำพิเศษ (การกระทำพิเศษไม่ส่งผลต่อระยะเวลาของเอฟเฟกต์ที่มีกำหนดเทิร์น)\nเมื่อสิ้นสุดการกระทำพิเศษ ใช้ Will of Rebellion 3 stack\n*รับ Will of Rebellion ได้ 1 stack ต่อศัตรู 1 ตัวต่อการต่อสู้"},
      {name:'Calling Card',
        desc:"Increase skill damage to the main target by 30%, and increase skill damage to other targets by 10%.",
        descTh:"เพิ่มความเสียหายสกิลต่อเป้าหมายหลัก 30% และเพิ่มความเสียหายสกิลต่อเป้าหมายอื่น 10%"},
      {name:'Meditate',
        desc:"On an extra action, decrease SP cost of skills by 80%. When Ren's SP is above 60%, increase Attack by 50%.",
        descTh:"ในการกระทำพิเศษ ลดค่า SP ของสกิล 80% เมื่อ SP ของ Ren สูงกว่า 60% เพิ่ม Attack 50%"},
      {name:'Secret Maneuvers',
        desc:"Increase the skill levels of Arsène's Chains and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Arsène's Chains และ Thief Tactics ขึ้น 3"},
      {name:'Highway Robbery',
        desc:"Highlight Enhanced: Increase number of Will of Rebellion stacks gained to 3.",
        descTh:"Highlight Enhanced: เพิ่มจำนวน Will of Rebellion stack ที่ได้รับเป็น 3"},
      {name:'Moonlit Evening',
        desc:"Increase the skill levels of Trickster's Plunder and Phantom Omen by 3.",
        descTh:"เพิ่มระดับสกิล Trickster's Plunder และ Phantom Omen ขึ้น 3"},
      {name:'Merciless Pursuit',
        desc:"After taking an extra action, if there are foes with below 25% HP, deal damage to those foes equal to up to 250% of Ren's Attack (once per enemy per battle).\nAfter using a skill on an extra action, deal Curse damage equal to 50% of Attack to all foes.",
        descTh:"หลังจากกระทำพิเศษ หากมีศัตรูที่มี HP ต่ำกว่า 25% สร้างความเสียหายให้ศัตรูเหล่านั้นสูงสุด 250% ของ Attack ของ Ren (1 ครั้งต่อศัตรู 1 ตัวต่อการต่อสู้)\nหลังจากใช้สกิลในการกระทำพิเศษ สร้างความเสียหาย Curse เท่ากับ 50% ของ Attack ให้ศัตรูทุกตัว"},
    ],
    baseStats:     {hp:291, atk:105, def:49, spd:102},
    baseStatsLv80: [
      {hp:3270, atk:1180, def:560, spd:102},
      {hp:3329, atk:1202, def:570, spd:102},
      {hp:3388, atk:1222, def:580, spd:102},
      {hp:3447, atk:1244, def:590, spd:102},
      {hp:3505, atk:1265, def:600, spd:102},
      {hp:3564, atk:1286, def:610, spd:102},
      {hp:3623, atk:1307, def:621, spd:102},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {
        name: 'Phoenix Dagger', stars:5,
        hp: 2160, atk: 780, def: 370,
        bonusStats: {atk:30},
        abilityName: 'Phoenix Dagger',
        ability: [
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'After gaining Will of Rebellion, increase Ren\'s Curse damage by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% for 2 turns. Stacks up to 3 times.',
          'At 3 or more Will of Rebellion stacks, increase Ren\'s next damage by 23.0%/30.0%/30.0%/37.0%/37.0%/44.0%/44.0%.',],
        abilityTh: [
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'หลังจากได้รับ Will of Rebellion เพิ่มความเสียหาย Curse ของ Ren 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% เป็นเวลา 2 เทิร์น สะสมสูงสุด 3 ครั้ง',
          'เมื่อมี Will of Rebellion 3 stack ขึ้นไป เพิ่มความเสียหายครั้งถัดไปของ Ren 23.0%/30.0%/30.0%/37.0%/37.0%/44.0%/44.0%',
        ],
      },
      {
        name: 'Machete', stars:4,
        hp: 1729, atk: 623, def: 296,
        bonusStats: {atk:12},
        abilityName: 'Machete',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When attacking a foe with an ailment, increase Attack by 19.1%/24.8%/24.8%/30.5%/30.5%/36.2%/36.2%.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อโจมตีศัตรูที่มี ailment เพิ่ม Attack 19.1%/24.8%/24.8%/30.5%/30.5%/36.2%/36.2%',
        ],
      },
    ],
  },
  {name:'Ann Takamaki',       codename:'Panther',        role:'Sweeper',    element:'Fire',           rarity:5, cards:['Power 4pc','Courage 2pc'],      weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],     note:'Top Fire AoE DPS. Power 4pc boosts party ATK when stacked with Fire sub-DPS.',
    mechanics: "Passion stack สะสมทุกครั้งที่ Ann โจมตีด้วยธาตุ Fire — ทักษะ AoE ต่อหลายเป้าได้สูงสุด 4 stack ในการกระทำเดียว เมื่อเทิร์นของ Ann เองมี 4+ stack จะใช้ stack ทั้งหมดเพื่อเข้าสู่ La Vie en Rose 1 เทิร์น (ATK +30–50%) ช่วง La Vie en Rose คือหน้าต่างดาเมจสูงสุด เมื่อหมด passive Marriage of Flames จะยิง Fire follow-up 2 ครั้งอัตโนมัติ",
    rotation: [
      "เทิร์น 1 → Crimson Rose (AoE, ได้ Passion สูงสุด 4 stack จากหลายเป้า) → La Vie en Rose เทิร์นถัดไป",
      "ช่วง La Vie en Rose → Falling Sun (AoE, +30% skill DMG; มีโอกาส Burn)",
      "เมื่อ La Vie en Rose หมด → Marriage of Flames ยิง Fire follow-up 2 ครั้งอัตโนมัติ",
      "สู้บอสตัวเดียว หรือ HP < 50% → ใช้ Trifire แทน (+30% execute bonus damage)",
      "Highlight → ใช้ก่อนเทิร์น La Vie en Rose เพื่อ boost ทักษะ Fire เทิร์นถัดไป ~80%",
    ],
    realName:'Ann Takamaki', persona:'Carmen',
    weakRes:{ Fire:'res', Ice:'wk', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Crimson Rose',     type:'Skill',   element:'Fire', sp:20,
        desc:"Deal Fire damage to all foes equal to 94.8%/104.5%/100.6%/110.3% of Attack, and increase Ann's Attack by 20% for 2 turns.\nWhen Ann has La Vie en Rose, for 2 turns, decrease foes' Attack by 8% of Ann's Attack and increase her Attack by the same amount.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 94.8%/104.5%/100.6%/110.3% ของ Attack และเพิ่ม Attack ของ Ann 20% เป็นเวลา 2 เทิร์น\nเมื่อ Ann มี La Vie en Rose จะลด Attack ของศัตรู 8% ของ Attack ของ Ann และเพิ่ม Attack ของเธอในปริมาณเท่ากัน เป็นเวลา 2 เทิร์น"},
      {name:'Trifire',          type:'Skill',   element:'Fire', sp:20,
        desc:"Deal Fire damage to 1 foe equal to 134.2%/148.0%/142.5%/156.2% of Attack, with 75% chance to inflict Burn.\nWhen Ann has La Vie en Rose, and the foe's HP is below 50%, deal bonus damage equal to 30% of the damage dealt with this skill.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 134.2%/148.0%/142.5%/156.2% ของ Attack โอกาส 75% ทำให้ติด Burn\nเมื่อ Ann มี La Vie en Rose และ HP ของศัตรูต่ำกว่า 50% ให้สร้างความเสียหายเพิ่ม 30% ของความเสียหายจากสกิลนี้"},
      {name:'Falling Sun',      type:'Skill',   element:'Fire', sp:22,
        desc:"Deal Fire damage to all foes equal to 96.3%/106.2%/102.3%/112.1% of Attack, with 30% chance to inflict Burn.\nWhen Ann has La Vie en Rose, increase the damage dealt from skills by 30%.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 96.3%/106.2%/102.3%/112.1% ของ Attack โอกาส 30% ทำให้ติด Burn\nเมื่อ Ann มี La Vie en Rose เพิ่มความเสียหายจากสกิล 30%"},
      {name:'Highlight',        type:'Skill',   element:'Fire', sp:0,
        desc:"Deal Fire damage to all foes equal to 195.2%/215.2%/207.2%/227.2% of Attack. Increase damage of Ann's Fire skills by 78.1%/86.1%/82.9%/90.9% for 1 turn.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 195.2%/215.2%/207.2%/227.2% ของ Attack เพิ่มความเสียหายสกิลธาตุไฟของ Ann 78.1%/86.1%/82.9%/90.9% เป็นเวลา 1 เทิร์น"},
      {name:'Rising Tension',   type:'Passive', element:'-',    sp:0,
        desc:"Activate a Fire technical when using a skill or Highlight. When Fireburn activates, increase that skill or Highlight's damage by 30.0%.",
        descTh:"เปิดใช้ Fire technical เมื่อใช้สกิลหรือ Highlight เมื่อ Fireburn ทำงาน ให้เพิ่มความเสียหายของสกิลหรือ Highlight นั้น 30.0%"},
      {name:'Carrot and Stick', type:'Passive', element:'-',    sp:0,
        desc:"When La Vie en Rose ends, restore HP to the ally with the lowest remaining HP by 45.0% of Ann's Attack.",
        descTh:"เมื่อ La Vie en Rose สิ้นสุด ฟื้นฟู HP ให้พันธมิตรที่มี HP เหลือน้อยที่สุด 45.0% ของ Attack ของ Ann"},
    ],
    awareness:[
      {name:'Passion',
        desc:"When dealing Fire damage to a foe with a skill, gain 1 Passion. Gain up to 4 stacks of Passion with 1 skill.\nIf Passion is at 4 or more stacks on Ann's action, spend all Passion stacks to gain La Vie en Rose for 1 turn.\nLa Vie en Rose: Increase Ann's Attack by 30%/40%/50% (effect changes at level 1/50/70).\n*Cannot gain La Vie en Rose consecutively on Ann's next action.",
        descTh:"เมื่อสร้างความเสียหายธาตุไฟให้ศัตรูด้วยสกิล รับ 1 Passion สะสม Passion สูงสุด 4 stack จาก 1 สกิล\nหาก Passion อยู่ที่ 4 stack ขึ้นไปในเทิร์นของ Ann ใช้ Passion ทั้งหมดเพื่อรับ La Vie en Rose 1 เทิร์น\nLa Vie en Rose: เพิ่ม Attack ของ Ann 30%/40%/50% (เปลี่ยนที่ Lv. 1/50/70)\n*ไม่สามารถรับ La Vie en Rose ซ้ำในเทิร์นถัดไปของ Ann"},
      {name:'Seguidilla',
        desc:"When La Vie en Rose is active, increase the party's Attack by 25% for 1 turn.",
        descTh:"เมื่อ La Vie en Rose ทำงาน เพิ่ม Attack ของปาร์ตี้ 25% เป็นเวลา 1 เทิร์น"},
      {name:'Marriage of Flames',
        desc:"When La Vie en Rose ends, activate 2 follow-up attacks, dealing Fire damage equal to 66% of Ann's Attack to random foes.",
        descTh:"เมื่อ La Vie en Rose สิ้นสุด เปิดใช้การโจมตีตาม 2 ครั้ง สร้างความเสียหายธาตุไฟ เท่ากับ 66% ของ Attack ของ Ann ให้ศัตรูแบบสุ่ม"},
      {name:'Beautiful Sins',
        desc:"Increase the skill levels of Falling Sun and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Falling Sun และ Thief Tactics ขึ้น 3"},
      {name:'Hearts on Fire',
        desc:"Highlight Enhanced: When Ann uses a Highlight, increase her Attack by 100% for 1 turn.",
        descTh:"Highlight Enhanced: เมื่อ Ann ใช้ Highlight เพิ่ม Attack ของเธอ 100% เป็นเวลา 1 เทิร์น"},
      {name:'Makeup',
        desc:"Increase the skill levels of Crimson Rose and Trifire by 3.",
        descTh:"เพิ่มระดับสกิล Crimson Rose และ Trifire ขึ้น 3"},
      {name:'Time for Punishment',
        desc:"When attacking foes with Fire skills, 60% chance to gain 1 Passion stack.\nWhen La Vie en Rose is active, increase Fire damage by 11% per Passion stack spent (up to 110%).",
        descTh:"เมื่อโจมตีศัตรูด้วยสกิลธาตุไฟ โอกาส 60% รับ 1 Passion stack\nเมื่อ La Vie en Rose ทำงาน เพิ่มความเสียหายธาตุไฟ 11% ต่อ Passion stack ที่ใช้ (สูงสุด 110%)"},
    ],
    baseStats:     {hp:288, atk:107, def:55, spd:94},
    baseStatsLv80: [
      {hp:3240, atk:1210, def:620, spd:94},
      {hp:3298, atk:1232, def:631, spd:94},
      {hp:3357, atk:1253, def:642, spd:94},
      {hp:3415, atk:1276, def:654, spd:94},
      {hp:3474, atk:1297, def:665, spd:94},
      {hp:3532, atk:1319, def:676, spd:94},
      {hp:3590, atk:1340, def:687, spd:94},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {
        name: 'Rosethorn', stars:5,
        hp: 2141, atk: 799, def: 410,
        bonusStats: {edm:24},
        abilityName: 'Rosethorn',
        ability: [
          'Increase Fire damage by 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%.',
          'When La Vie En Rose is active, inflict Burn on 1 random foe.',
          'Increase Fire damage by 25.5%/33.5%/33.5%/41.5%/41.5%/49.5%/49.5% for each Burning foe. Maximum of 76%/100%/100%/124%/124%/148%/148%.',],
        abilityTh: [
          'เพิ่มความเสียหายธาตุไฟ 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%',
          'เมื่อ La Vie En Rose ทำงาน ทำให้ศัตรูแบบสุ่ม 1 ตัวติด Burn',
          'เพิ่มความเสียหายธาตุไฟ 25.5%/33.5%/33.5%/41.5%/41.5%/49.5%/49.5% ต่อศัตรูที่ติด Burn 1 ตัว สูงสุด 76%/100%/100%/124%/124%/148%/148%',
        ],
      },
      {
        name: 'Masquerade Ribbon', stars:4,
        hp: 1712, atk: 640, def: 328,
        bonusStats: {atk:12},
        abilityName: 'Masquerade Ribbon',
        ability:[
          "Increase Attack by 12.0%/16.0%/16.0%/20.0%/20.0%/24.0%/24.0%.",
          "When attacking a Burning foe, increase Attack by 23.7%/23.7%/30.8%/30.8%/37.9%/37.9%/45.0%.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/16.0%/16.0%/20.0%/20.0%/24.0%/24.0%',
          'เมื่อโจมตีศัตรูที่ติด Burn เพิ่ม Attack 23.7%/23.7%/30.8%/30.8%/37.9%/37.9%/45.0%',
        ],
      },
    ],
  },
  {name:'Ryuji Sakamoto', codename:'Skull', role:'Assassin', element:'Physical', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best Physical/CRIT weapon (Revenge Axe)',
    statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Physical DMG%'], note:'Physical Assassin. Low-HP berserker — ATK scales with missing HP, Rebound state enables CRIT-guaranteed burst. Uses HP as resource for skills.',
    mechanics: "HP ยิ่งต่ำ ATK ยิ่งสูง — ได้ ATK สูงสุด +40% (สูงสุดเมื่อ HP ≤20%) เมื่อ Ryuji เริ่มเทิร์นของตัวเองด้วย HP ต่ำกว่า 75% จะได้ Rebound: ทักษะถัดไปดาเมจ +30% และ CRIT Rate +30% God Hand Burst ภายใต้ Rebound = critical รับประกัน ทักษะบางอย่างหัก HP เพื่อปลดล็อกดาเมจโบนัส — Pirate Tactics หัก HP 20% ของ max HP",
    rotation: [
      "เทิร์น 1 → Pirate Tactics (หัก HP 20% max HP) → HP ลงต่ำกว่า 75% เปิด Rebound",
      "มี Rebound → God Hand Burst → เข้า Changing Gears (ยิงเทิร์นถัดไป)",
      "Changing Gears ยิง → God Hand Burst critical รับประกันภายใต้ Rebound",
      "ใช้ Highlight ก่อนเทิร์น Burst เพื่อ +58% next-skill damage bonus",
      "Thunderbolt สำหรับ AoE หรือติด Shock เมื่อ Rebound ยังไม่เปิด",
    ],
    realName:'Ryuji Sakamoto', persona:'Captain Kidd',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'res', Wind:'wk', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Pirate Tactics', type:'Skill', element:'Physical', sp:0,
        desc:"Deal Physical damage to 1 foe equal to 64.7%/71.3%/68.7%/75.3% of Attack (3 hits). When Ryuji doesn't have Rebound, spend 20% of max HP to increase damage by 30% and critical rate by 30%. [HP Cost: 8%]",
        descTh:"ดีลดาเมจกายภาพต่อศัตรู 1 ตัว 64.7%/71.3%/68.7%/75.3% ของ Attack (3 ครั้ง) เมื่อ Ryuji ไม่มี Rebound ใช้ HP 20% ของ HP สูงสุดเพื่อเพิ่มดาเมจ 30% และ CRIT Rate 30% [ค่าใช้จ่าย HP: 8%]"},
      {name:'Thunderbolt', type:'Skill', element:'Electric', sp:26,
        desc:"Deal Electric damage to all foes equal to 67.1%/74.0%/71.3%/78.2% of Attack, with a 29.3%/29.3%/31.1%/31.1% chance to inflict Shock. When Ryuji has Rebound, increase Shock chance by 58.6%/58.6%/62.2%/62.2%.",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรูทุกตัว 67.1%/74.0%/71.3%/78.2% ของ Attack โอกาส 29.3%/29.3%/31.1%/31.1% ทำให้ติด Shock เมื่อ Ryuji มี Rebound เพิ่มโอกาส Shock 58.6%/58.6%/62.2%/62.2%"},
      {name:'God Hand Burst', type:'Skill', element:'Physical', sp:0,
        desc:"Select 1 foe and enter Changing Gears state. On next action, deal Physical damage equal to 341.6%/376.6%/362.6%/397.6% of Attack. With Rebound: guaranteed critical hit. If main target is defeated during Changing Gears, randomly selects another foe. [HP Cost: 20%]",
        descTh:"เลือกศัตรู 1 ตัว และเข้าสู่สถานะ Changing Gears ในแอ็คชันถัดไป ดีลดาเมจกายภาพ 341.6%/376.6%/362.6%/397.6% ของ Attack เมื่อมี Rebound: CRIT แน่นอน หากเป้าหมายหลักถูกกำจัดระหว่าง Changing Gears จะสุ่มเลือกศัตรูอื่น [ค่าใช้จ่าย HP: 20%]"},
      {name:'HIGHLIGHT', type:'Skill', element:'Physical', sp:0,
        desc:"Deal Physical damage to 1 foe equal to 405.0%/446.5%/429.9%/471.4% of Attack, and increase damage of next skill by 58.6%/58.6%/62.2%/62.2%. [4-turn cooldown]",
        descTh:"ดีลดาเมจกายภาพต่อศัตรู 1 ตัว 405.0%/446.5%/429.9%/471.4% ของ Attack และเพิ่มดาเมจสกิลถัดไป 58.6%/58.6%/62.2%/62.2% [Cooldown: 4 เทิร์น]"},
      {name:'Adrenaline', type:'Passive', element:'-', sp:0,
        desc:"If the target's remaining HP is higher than Ryuji's, increase Attack by 45.0%.",
        descTh:"หาก HP ที่เหลือของเป้าหมายสูงกว่า Ryuji เพิ่ม Attack 45.0%"},
      {name:'Rebellious Spirit', type:'Passive', element:'-', sp:0,
        desc:"When Ryuji has Rebound and uses Pirate Tactics, Thunderbolt, or God Hand Burst, restore HP equal to 30.0% of his Attack.",
        descTh:"เมื่อ Ryuji มี Rebound และใช้ Pirate Tactics, Thunderbolt หรือ God Hand Burst ฟื้นฟู HP เท่ากับ 30.0% ของ Attack"},
    ],
    awareness:[
      {name:'Wounded Glory',
        desc:"Increase Attack based on missing HP (min +10%, max +40% when HP ≤20%). When Ryuji has less than 75% HP on his action, gain Rebound for 1 turn. Rebound: next skill damage +30%, critical rate +30%.",
        descTh:"เพิ่ม Attack ตาม HP ที่หาย (ต่ำสุด +10% สูงสุด +40% เมื่อ HP ≤20%) เมื่อ Ryuji มี HP ต่ำกว่า 75% ในแอ็คชันของตน รับ Rebound 1 เทิร์น Rebound: ดาเมจสกิลถัดไป +30% และ CRIT Rate +30%"},
      {name:'Under the Skull and Bones',
        desc:"Increase damage of God Hand Burst by 20%. When in the Changing Gears state, decrease damage taken by 20%.",
        descTh:"เพิ่มดาเมจ God Hand Burst 20% เมื่ออยู่ในสถานะ Changing Gears ลดดาเมจที่รับ 20%"},
      {name:'Fearless Charge',
        desc:"When dealing critical damage with a skill, ignore 35% of target's Defense.",
        descTh:"เมื่อดาเมจสกิล CRIT ไม่สนใจ DEF ของเป้าหมาย 35%"},
      {name:'Anchor Management',
        desc:"Increase the skill levels of God Hand Burst and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล God Hand Burst และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Riding the Storm',
        desc:"Highlight Enhanced: Increase the next skill's damage by 30%, and increase critical damage by 75%.",
        descTh:"Highlight เสริม: เพิ่มดาเมจสกิลถัดไป 30% และเพิ่ม CRIT DMG 75%"},
      {name:'Raise the Sails!',
        desc:"Increase the skill levels of Pirate Tactics and Thunderbolt by 3.",
        descTh:"เพิ่มระดับสกิล Pirate Tactics และ Thunderbolt ขึ้น 3 ระดับ"},
      {name:'Comeback Kid',
        desc:"Survive fatal damage 1 time during battle and recover 25% HP. After damaging a foe with God Hand Burst, inflict Cower on the target. Cower: increase Ryuji's next skill damage taken by 60%.",
        descTh:"รอดพ้นจากดาเมจสังหาร 1 ครั้งระหว่างการต่อสู้ และฟื้นฟู HP 25% หลังดาเมจด้วย God Hand Burst ทำให้เป้าหมายติด Cower Cower: เพิ่มดาเมจสกิลถัดไปของ Ryuji 60%"},
    ],
    baseStats: {hp:352, atk:97, def:47, spd:94},
    baseStatsLv80: [
      {hp:3960, atk:1100, def:533, spd:0},
      {hp:4031, atk:1120, def:543, spd:0},
      {hp:4102, atk:1140, def:553, spd:0},
      {hp:4174, atk:1159, def:562, spd:0},
      {hp:4245, atk:1179, def:572, spd:0},
      {hp:4317, atk:1199, def:581, spd:0},
      {hp:4388, atk:1219, def:591, spd:0},
    ],
    hiddenAbility: 'CRIT DMG +184.9%',
    weapons:[
      {name:'Revenge Axe', stars:5,
        hp:2616, atk:727, def:352,
        bonusStats:{},
        abilityName:'Revenge Axe',
        ability:[
          'Increase critical damage by 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%.',
          'After foes or allies act, gain 1 Fired Up stack (up to 10).',
          'When dealing damage, spend all Fired Up stacks to increase skill damage by 4.5%/5.8%/5.8%/7.2%/7.2%/8.6%/8.6% per stack.',],
        abilityTh:[
          'เพิ่ม CRIT DMG 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%',
          'หลังศัตรูหรือพันธมิตรใช้แอ็คชัน รับ Fired Up 1 stack (สูงสุด 10)',
          'เมื่อดีลดาเมจ ใช้ Fired Up stack ทั้งหมดเพื่อเพิ่มดาเมจสกิล 4.5%/5.8%/5.8%/7.2%/7.2%/8.6%/8.6% ต่อ stack',
        ]},
      {name:'Grand Presser', stars:4,
        hp:2093, atk:581, def:282,
        bonusStats:{},
        abilityName:'Grand Presser',
        ability:[
          "Increase critical rate by 7.3%/7.3%/9.5%/9.5%/11.7%/11.7%/13.9%.",
          "When Ryuji has Rebound and deals a critical hit with a skill, increase damage by 38.0%/49.5%/49.5%/61.0%/61.0%/72.5%/72.5%.",
        ],
        abilityTh:[
          'เพิ่ม CRIT Rate 7.3%/7.3%/9.5%/9.5%/11.7%/11.7%/13.9%',
          'เมื่อ Ryuji มี Rebound และ CRIT ด้วยสกิล เพิ่มดาเมจ 38.0%/49.5%/49.5%/61.0%/61.0%/72.5%/72.5%',
        ]},
    ],
  },
  {name:'Kasumi Yoshizawa', codename:'Violet', role:'Assassin', element:'Bless', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best CRIT Bless weapon (Royal Étoile)',
    statPrio:['ATK%','CRIT Rate%','CRIT DMG%'], note:'Bless Assassin. Masquerade mode unlocks Highlight usage and stacks Lead/Follow Step for massive CRIT DMG. Invitation grants Dance Partner to an ally whose skills trigger bonus Cinderella Glow hits.',
    mechanics: "Lead Step สะสมจากการโจมตีด้วย Cinderella Glow; Follow Step จากการใช้ Invitation เมื่อมี 2+ Steps ระหว่าง action ของฝ่ายพันธมิตร Kasumi สามารถเปิด Masquerade mode ผ่าน Spellbound Cinders (cooldown 3 เทิร์น) ใน Masquerade → Highlight ใช้ฟรี (ไม่เสีย gauge, CRIT ได้, +15% ต่อ Lead Step, +20% ต่อ Follow Step) Masquerade คงอยู่จนต้นเทิร์นที่ 2 ของ Kasumi ถัดไป",
    rotation: [
      "เทิร์น 1 → Invitation → มอบ Dance Partner ให้ DPS หลัก; Kasumi ได้ Follow Step + ATK buff ทั้งคู่",
      "Ally ที่มี Dance Partner ใช้ทักษะ → เปิด Cinderella Glow อัตโนมัติ (+1 Lead Step)",
      "เทิร์นของ Kasumi → Cinderella Glow → +1 Lead Step (ครบ 2 stack)",
      "ally action ถัดไปที่มี 2+ Steps → Spellbound Cinders → เข้า Masquerade",
      "Masquerade active → Highlight ฟรี (CRIT ได้, +15%/Lead Step) แล้ว Midnight Magic (+30% + CRIT DMG)",
      "ทำซ้ำทุก ~3 เทิร์น ตาม cooldown ของ Spellbound Cinders",
    ],
    realName:'Kasumi Yoshizawa', persona:'Cendrillon',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'wk', Bless:'res', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Cinderella Glow', type:'Skill', element:'Bless', sp:23,
        desc:"Deal Bless damage to 1 foe equal to 186.9%/206.1%/198.4%/217.5% of Attack, and gain 1 Lead Step (stacks up to 3). If this skill is activated by an ally with Dance Partner, deal Bless damage equal to 121.6%/134.1%/129.1%/141.5% of Attack, and gain 1 Lead Step.",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 186.9%/206.1%/198.4%/217.5% ของ Attack และรับ Lead Step 1 stack (สูงสุด 3) หากสกิลนี้เปิดใช้โดยพันธมิตรที่มี Dance Partner ดีลดาเมจแสง 121.6%/134.1%/129.1%/141.5% ของ Attack และรับ Lead Step 1 stack"},
      {name:'Invitation', type:'Skill', element:'-', sp:22, isBuff:true,
        desc:"Grant Dance Partner to 1 ally for 1 turn (only 1 ally may have Dance Partner at a time). Increase Attack of Kasumi and the selected ally by 32.4%/35.7%/34.4%/37.7% for 3 turns. Kasumi gains Follow Step (does not stack). When an ally with Dance Partner uses a skill, immediately activate Cinderella Glow on 1 random foe (or the target foe if the skill targets one).",
        descTh:"มอบ Dance Partner ให้พันธมิตร 1 คน 1 เทิร์น (พันธมิตรมี Dance Partner ได้ครั้งละ 1 คน) เพิ่ม Attack ของ Kasumi และเป้าหมาย 32.4%/35.7%/34.4%/37.7% 3 เทิร์น Kasumi รับ Follow Step (ไม่สะสม) เมื่อพันธมิตรที่มี Dance Partner ใช้สกิล เปิดใช้ Cinderella Glow ต่อศัตรูสุ่ม 1 ตัวทันที (หากสกิลโจมตีศัตรู ใช้ศัตรูนั้นแทน)"},
      {name:'Midnight Magic', type:'Skill', element:'Bless', sp:27,
        desc:"Deal Bless damage to 1 foe equal to 249.1%/274.6%/264.4%/289.9% of Attack. In Masquerade mode: increase skill damage by 30%, and CRIT DMG by 29.3%/29.3%/31.1%/31.1%.",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 249.1%/274.6%/264.4%/289.9% ของ Attack ในโหมด Masquerade: เพิ่มดาเมจสกิล 30% และ CRIT DMG 29.3%/29.3%/31.1%/31.1%"},
      {name:'HIGHLIGHT', type:'Skill', element:'Bless', sp:0,
        desc:"Can only be activated in Masquerade mode. Deal Bless damage to 1 foe equal to 273.1%/301.0%/289.8%/317.8% of Attack. Additional effects based on Step stacks: Lead Step: +15% Highlight damage per stack. Follow Step: CRIT Rate +10%, CRIT DMG +20%.",
        descTh:"เปิดใช้ได้เฉพาะในโหมด Masquerade ดีลดาเมจแสงต่อศัตรู 1 ตัว 273.1%/301.0%/289.8%/317.8% ของ Attack เอฟเฟกต์เพิ่มเติมตาม Step stack: Lead Step: เพิ่มดาเมจ Highlight 15% ต่อ stack Follow Step: CRIT Rate +10%, CRIT DMG +20%"},
      {name:'Rhythm Count', type:'Passive', element:'-', sp:0,
        desc:"For every Step stack, increase Bless damage by 15% (up to 45.0%).",
        descTh:"ต่อ Step stack เพิ่มดาเมจแสง 15% (สูงสุด 45.0%)"},
      {name:'Steps of Faith', type:'Passive', element:'-', sp:0,
        desc:"When an ally except Kasumi uses a Highlight or Theurgy, increase Kasumi's Attack by 45.0% for 2 turns. Stacks up to 2 times.",
        descTh:"เมื่อพันธมิตร (ยกเว้น Kasumi) ใช้ Highlight หรือ Theurgy เพิ่ม Attack ของ Kasumi 45.0% 2 เทิร์น สะสมสูงสุด 2 ครั้ง"},
    ],
    awareness:[
      {name:'Masked Ball',
        desc:"Kasumi's Highlight does not deplete the Highlight gauge and can activate critical hits. On an ally's action with 2+ Step stacks, Kasumi can use Spellbound Cinders (3-turn cooldown) to enter Masquerade mode and activate Highlight. Masquerade lasts until the start of Kasumi's 2nd turn (or end of following turn if triggered on her own turn). In Masquerade: per Step stack gained, ATK +10% and CRIT Rate +4%. When Masquerade ends: lose all Step stacks. If Highlight was unused, auto-activate on 1 random foe.",
        descTh:"Highlight ของ Kasumi ไม่ใช้ Highlight gauge และสามารถ CRIT ได้ ในแอ็คชันพันธมิตรเมื่อมี Step stack 2+, Kasumi สามารถใช้ Spellbound Cinders (Cooldown: 3 เทิร์น) เพื่อเข้าโหมด Masquerade และเปิดใช้ Highlight ได้ Masquerade คงจนต้นเทิร์นที่ 2 ของ Kasumi (หรือสิ้นสุดเทิร์นถัดไปหากเปิดในเทิร์นตัวเอง) ในโหมด Masquerade: ต่อ Step stack ที่ได้รับ ATK +10% และ CRIT Rate +4% เมื่อ Masquerade สิ้นสุด: Step stack ทั้งหมดหายไป หาก Highlight ยังไม่ได้ใช้ จะเปิดใช้อัตโนมัติต่อศัตรูสุ่ม 1 ตัว"},
      {name:'Charming Invite',
        desc:"Extend the duration of Dance Partner by 1 turn. When using Invitation, increase CRIT Rate of Kasumi and her Dance Partner by 15% for 3 turns.",
        descTh:"ขยายระยะเวลา Dance Partner 1 เทิร์น เมื่อใช้ Invitation เพิ่ม CRIT Rate ของ Kasumi และ Dance Partner 15% 3 เทิร์น"},
      {name:'Blossoming Dance Floor',
        desc:"With 2 Step stacks: permanently increase Attack by 33%. With 3 or more stacks: permanently increase CRIT DMG by 33%.",
        descTh:"ที่ Step stack 2: เพิ่ม Attack ถาวร 33% ที่ Step stack 3+: เพิ่ม CRIT DMG ถาวร 33%"},
      {name:'Glittering Night',
        desc:"Increase the skill levels of Cinderella Glow and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Cinderella Glow และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Toll the Hour',
        desc:"When activating a Highlight, gain 1 Stroke of Midnight stack. Spend 1 Stroke of Midnight to evade the next incoming damage (not activated by some skills). Also, with 4 Step stacks, increase Highlight damage by 50%.",
        descTh:"เมื่อเปิดใช้ Highlight รับ Stroke of Midnight 1 stack ใช้ 1 stack เพื่อหลบดาเมจที่รับถัดไป (ไม่เปิดใช้กับสกิลบางอย่าง) นอกจากนี้ ที่ Step stack 4 เพิ่มดาเมจ Highlight 50%"},
      {name:'Neverending Dream',
        desc:"Increase the skill levels of Invitation and Midnight Magic by 3.",
        descTh:"เพิ่มระดับสกิล Invitation และ Midnight Magic ขึ้น 3 ระดับ"},
      {name:'Unmasked Ball',
        desc:"After Kasumi activates her Highlight, she can activate her Highlight 1 more time while in Masquerade mode (80% of normal damage). Usable once per Masquerade. This additional Highlight will not activate automatically when Masquerade ends.",
        descTh:"หลัง Kasumi เปิดใช้ Highlight สามารถเปิดใช้ Highlight อีก 1 ครั้งในโหมด Masquerade (ดาเมจ 80%) ใช้ได้ครั้งละ 1 ครั้งต่อการเข้า Masquerade Highlight เพิ่มเติมนี้จะไม่เปิดใช้อัตโนมัติเมื่อ Masquerade สิ้นสุด"},
    ],
    baseStats: {hp:301, atk:103, def:49, spd:102},
    baseStatsLv80: [
      {hp:3390, atk:1160, def:560, spd:0},
      {hp:3451, atk:1181, def:570, spd:0},
      {hp:3512, atk:1202, def:580, spd:0},
      {hp:3573, atk:1222, def:590, spd:0},
      {hp:3634, atk:1243, def:600, spd:0},
      {hp:3695, atk:1265, def:610, spd:0},
      {hp:3756, atk:1286, def:621, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Royal Étoile', stars:5,
        hp:2240, atk:766, def:370,
        bonusStats:{},
        abilityName:'Sunrise',
        ability:[
          'Increase critical damage by 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%.',
          'When gaining a Step stack, increase Attack by 21.0%/27.0%/27.0%/33.0%/33.0%/39.0%/39.0% for 2 turns. This effect does not stack.',
          'When an ally activates a Highlight or Theurgy, gain 1 Glass Slipper stack, and increase Kasumi\'s damage by 8.4%/11.1%/11.1%/13.8%/13.8%/16.5%/16.5% for 3 turns (stacks up to 2). At 2 Glass Slipper stacks, increase Kasumi\'s Highlight damage by 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0% more.',],
        abilityTh:[
          'เพิ่ม CRIT DMG 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%',
          'เมื่อรับ Step stack เพิ่ม Attack 21.0%/27.0%/27.0%/33.0%/33.0%/39.0%/39.0% 2 เทิร์น เอฟเฟกต์นี้ไม่สะสม',
          'เมื่อพันธมิตรเปิดใช้ Highlight หรือ Theurgy รับ Glass Slipper 1 stack และเพิ่มดาเมจของ Kasumi 8.4%/11.1%/11.1%/13.8%/13.8%/16.5%/16.5% 3 เทิร์น (สะสมสูงสุด 2) ที่ Glass Slipper 2 stack เพิ่มดาเมจ Highlight ของ Kasumi อีก 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0%',
        ]},
      {name:'Divine Sword of Sinai', stars:4,
        hp:1792, atk:613, def:296,
        bonusStats:{atk:24},
        abilityName:'Blessing',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "With 2 or more Step stacks, increase damage by 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อมี Step stack 2 ขึ้นไป เพิ่มดาเมจ 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%',
        ]},
    ],
  },
  {name:'Futaba Sakura', codename:'Oracle', role:'Elucidator', element:'-', rarity:5,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:'Best ATK support weapon (Technomage Ultra FS)',
    statPrio:['ATK%','SPD','HP%'], note:'Elucidator. Stat Buff shares 20% of all stats with party. Virus changes foe affinities (Null→Resist, Resist→Normal, Normal→Weak) to create weakness targets. Data Storm buffs from Analysis Progress amplify weakness damage.',
    mechanics: "Analysis Progress สะสมเมื่อ ally ใช้ทักษะ (+5%) หรือโจมตีจุดอ่อน (+25%) Programming Pro awareness เริ่มทุกการต่อสู้ที่ 100% เมื่อครบ 100% และใช้ Pentest Complete! หรือ Vulnerability Found! จะเปิด Data Storm (ดาเมจปาร์ตี้ +10–20%) Data Link ต้องการ Data Storm active เพื่อบัฟ ATK ของ DPS ที่เลือก พร้อมติด Virus เพื่อเปลี่ยน affinity ของศัตรูหนึ่งระดับให้ใกล้จุดอ่อน",
    rotation: [
      "เทิร์น 1 → Pentest Complete! (DEF down ทุกศัตรู + เปิด Data Storm จาก 100% starting Progress)",
      "เทิร์น 2 → Data Link Established! (บัฟ ATK DPS หลัก + ติด Virus สร้างจุดอ่อนใหม่)",
      "เทิร์น 3 → Vulnerability Found! (DMG taken up บนเป้าหลัก + เติม Progress)",
      "Progress ครบ 100% อีกครั้ง → ทำซ้ำ Pentest หรือ Vulnerability เพื่อเปิด Data Storm ใหม่",
      "เป้าหมาย Data Link: DPS ที่มี ATK สูงสุดซึ่งใช้ประโยชน์จาก element weakness ที่เปลี่ยนได้ดีที่สุด",
    ],
    realName:'Futaba Sakura', persona:'Necronomicon',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Pentest Complete!', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"For 3 turns, decrease all foes' Defense by 6% (+0.53% per 100 ATK, up to 4600/5060/5980/6440 ATK). When foes with this debuff take weakness damage, multiply the effect by 2. If Analysis Progress is at 100%, also grant Data Storm to all allies for 2 turns.",
        descTh:"ลด DEF ศัตรูทุกตัว 6% (+0.53% ต่อ ATK 100, สูงสุด 4600/5060/5980/6440 ATK) 3 เทิร์น เมื่อศัตรูที่มีดีบัฟนี้รับ weakness damage ให้คูณเอฟเฟกต์ด้วย 2 หาก Analysis Progress อยู่ที่ 100% มอบ Data Storm ให้พันธมิตรทุกคน 2 เทิร์นด้วย"},
      {name:'Vulnerability Found!', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"For 3 turns, increase 1 foe's damage taken by 6% (+0.57% per 100 ATK, up to 4600/5060/5980/6440 ATK). When allies deal damage to foes with this effect, gain 20% Analysis Progress. If Analysis Progress is at 100%, also grant Data Storm to all allies for 2 turns.",
        descTh:"เพิ่มดาเมจที่รับของศัตรู 1 ตัว 6% (+0.57% ต่อ ATK 100, สูงสุด 4600/5060/5980/6440 ATK) 3 เทิร์น เมื่อพันธมิตรดีลดาเมจต่อศัตรูที่มีเอฟเฟกต์นี้ รับ Analysis Progress 20% หาก Analysis Progress 100% มอบ Data Storm ให้พันธมิตรทุกคน 2 เทิร์นด้วย"},
      {name:'Data Link Established!', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Requires Data Storm. For 2 turns, increase 1 ally's Attack by 270/297/302/329 (+21.7 per 100 ATK, up to 4600/5060/5980/6440 ATK). Inflict Virus on all foes for 1 turn based on the target ally's element. Virus: Changes foe's affinities — Null/Repel/Drain→Resist, Resist→Normal, Normal→Weak. Weak takes 25% more weakness damage.",
        descTh:"ต้องมี Data Storm เพิ่ม ATK ของพันธมิตร 1 คน 270/297/302/329 (+21.7 ต่อ ATK 100, สูงสุด 4600/5060/5980/6440 ATK) 2 เทิร์น ทำให้ศัตรูทุกตัวติด Virus 1 เทิร์น ตามธาตุของพันธมิตรที่เลือก Virus: เปลี่ยน affinity ของศัตรู — Null/Repel/Drain→Resist, Resist→Normal, Normal→Weak Weak รับ weakness damage เพิ่ม 25%"},
      {name:'Stat Buff', type:'Passive', element:'-', sp:0,
        desc:"Increase all allies' stats by 20% of Oracle's stats.",
        descTh:"เพิ่มสถิติของพันธมิตรทุกคน 20% ของสถิติของ Oracle"},
      {name:'Programming Pro', type:'Passive', element:'-', sp:0,
        desc:"At the start of battle, Futaba gains 100% Analysis Progress.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ Futaba ได้รับ Analysis Progress 100%"},
      {name:'Rootkit', type:'Passive', element:'-', sp:0,
        desc:"When Data Storm is active, grant all allies a shield equal to 30.0% of Futaba's Attack for 3 turns.",
        descTh:"เมื่อ Data Storm ใช้งานอยู่ มอบ shield ให้พันธมิตรทุกคน 30.0% ของ Attack Futaba 3 เทิร์น"},
    ],
    awareness:[
      {name:'Data Scan',
        desc:"After an ally uses a skill: +5% Analysis Progress. When an ally deals weakness damage with a skill/Resonance/Highlight/Theurgy: +20% more Analysis Progress. When Data Storm is active: party damage +10%/15%/20% (Lv.1/50/70); dealing weakness damage doubles this bonus.",
        descTh:"หลังพันธมิตรใช้สกิล: Analysis Progress +5% เมื่อพันธมิตรดีล weakness damage: Analysis Progress +20% เพิ่มเติม เมื่อ Data Storm ใช้งานอยู่: ดาเมจปาร์ตี้ +10%/15%/20% (Lv.1/50/70); การดีล weakness damage คูณโบนัสนี้ด้วย 2"},
      {name:'Payload Optimization',
        desc:"When Futaba's Analysis Progress reaches 100% or when Data Storm is active, increase allies' CRIT Rate by 12%.",
        descTh:"เมื่อ Analysis Progress ของ Futaba ถึง 100% หรือ Data Storm ใช้งานอยู่ เพิ่ม CRIT Rate ของพันธมิตร 12%"},
      {name:'Storage Redundancy',
        desc:"When an ally attacks a foe debuffed by Futaba, increase Attack by 25%. Once per battle: if any ally takes damage that would KO them, they survive with 1 HP and all allies receive a shield equal to 20% of Futaba's Attack for 3 turns.",
        descTh:"เมื่อพันธมิตรโจมตีศัตรูที่ Futaba ดีบัฟ เพิ่ม ATK 25% ครั้งเดียวต่อการต่อสู้: หากพันธมิตรใดรับดาเมจที่จะ KO รอดด้วย HP 1 และพันธมิตรทุกคนได้รับ shield 20% ของ Attack Futaba 3 เทิร์น"},
      {name:'Elegant Code',
        desc:"Increase the skill levels of Data Link Established! and Vulnerability Found! by 3.",
        descTh:"เพิ่มระดับสกิล Data Link Established! และ Vulnerability Found! ขึ้น 3 ระดับ"},
      {name:'Zero-Day Exploit',
        desc:"When an ally uses a Highlight or Theurgy, gain 1 Security Flaw stack (max 2). When using Pentest Complete! or Vulnerability Found!, spend all Security Flaw stacks to increase the effect by 8% per stack.",
        descTh:"เมื่อพันธมิตรใช้ Highlight หรือ Theurgy รับ Security Flaw 1 stack (สูงสุด 2) เมื่อใช้ Pentest Complete! หรือ Vulnerability Found! ใช้ Security Flaw stack ทั้งหมดเพื่อเพิ่มเอฟเฟกต์ 8% ต่อ stack"},
      {name:'Master Codebreaker',
        desc:"Increase the skill level of Pentest Complete! by 3.",
        descTh:"เพิ่มระดับสกิล Pentest Complete! ขึ้น 3 ระดับ"},
      {name:'Wizard-Level Hacker',
        desc:"When using Data Link Established!, target all allies and inflict Virus on all foes corresponding to each ally's element (same-element Viruses do not stack). Data Storm duration extended to 3 turns. Allies' weakness damage +10%, damage dealt +25%.",
        descTh:"เมื่อใช้ Data Link Established! กำหนดเป้าหมายเป็นพันธมิตรทุกคน และทำให้ศัตรูทุกตัวติด Virus ตามธาตุของพันธมิตรแต่ละคน (Virus ธาตุเดียวกันไม่สะสม) ระยะเวลา Data Storm ขยายเป็น 3 เทิร์น ดาเมจ weakness ของพันธมิตร +10% ดาเมจที่ดีล +25%"},
    ],
    baseStats: {hp:301, atk:101, def:53, spd:100},
    baseStatsLv80: [
      {hp:3390, atk:1140, def:600, spd:0},
      {hp:3451, atk:1161, def:611, spd:0},
      {hp:3512, atk:1181, def:622, spd:0},
      {hp:3573, atk:1202, def:633, spd:0},
      {hp:3634, atk:1222, def:643, spd:0},
      {hp:3695, atk:1242, def:654, spd:0},
      {hp:3756, atk:1263, def:665, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Technomage Ultra FS', stars:5,
        hp:2240, atk:753, def:396,
        bonusStats:{atk:30},
        abilityName:'Technomage Ultra FS',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When an ally deals weakness damage, increase the ally\'s Attack by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% for 2 turns.',
          'After Futaba inflicts a debuff with a skill, increase the foe\'s critical damage taken by 7.6%/9.9%/9.9%/12.2%/12.2%/14.5%/14.5% for 3 turns. Stacks up to 2 times.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อพันธมิตรดีล weakness damage เพิ่ม ATK ของพันธมิตรนั้น 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% 2 เทิร์น',
          'หลัง Futaba ทำให้ติดดีบัฟด้วยสกิล เพิ่ม CRIT DMG ที่รับของศัตรู 7.6%/9.9%/9.9%/12.2%/12.2%/14.5%/14.5% 3 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ]},
      {name:'Cyberdeck Pro', stars:4,
        hp:1792, atk:602, def:317,
        bonusStats:{atk:24},
        abilityName:'Cyberdeck Pro',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "After inflicting Virus on a foe, increase the target\'s damage taken by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังทำให้ศัตรูติด Virus เพิ่มดาเมจที่รับของเป้าหมาย 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% 2 เทิร์น',
        ]},
    ],
  },
  {name:'Ayaka Sakai', codename:'Chord', role:'Strategist', element:'Electric', rarity:5,
    cards:['Love 4pc','Opulence 2pc'], weapon:'Best ATK/Support weapon (Superstar)',
    statPrio:['ATK%','SPD','HP%'], note:'Top-tier Strategist. Catchy Hook instantly triggers ally Highlights — Costar mechanic amplifies the chosen DPS. ATK scales her own buff values.',
    mechanics: "วงจรหลัก: มอบ Costar ให้ DPS หลัก (Unison Notes, คงอยู่ 3 เทิร์น) จากนั้นใช้ Catchy Hook เพื่อยิง Highlight ของ ally นั้นทันที พร้อมบัฟดาเมจ +78–90% โดยไม่เสีย cooldown ของพวกเขา Hard Rock awareness มอบ Costar ให้ ally ที่มี ATK สูงสุดอัตโนมัติเมื่อเริ่มต้นการต่อสู้ ทุกครั้งที่ใช้ Catchy Hook จะเพิ่ม ATK ของ Ayaka เอง +20% ถาวร (cap 40%) Highlight ของ Ayaka ให้ปาร์ตี้ทั้งหมด +45% DMG เป็นเวลา 4 action",
    rotation: [
      "เริ่มต้นการต่อสู้ → Hard Rock มอบ Costar ให้ ally ATK สูงสุดอัตโนมัติ (โดยปกติคือ DPS หลัก)",
      "เทิร์น 1 → Catchy Hook → ยิง Highlight ของ ally นั้นทันที (+78–90% bonus; Ayaka ATK +20%)",
      "เทิร์น 2 → Unison Notes → ต่ออายุ Costar + ATK buff 3 เทิร์น",
      "เทิร์น 3 → Catchy Hook อีกครั้ง (cooldown 2 เทิร์น; Ayaka ATK +20% อีกครั้ง)",
      "ใช้ Highlight ของ Ayaka เองเมื่อ Catchy Hook อยู่ในช่วง cooldown → ปาร์ตี้ +45% DMG 4 action",
      "Distortion สำหรับดาเมจ Electric + ติด Shock เมื่อ Catchy Hook ยังไม่พร้อม",
    ],
    realName:'Ayaka Sakai', persona:'Calliope',
    weakRes:{ Fire:'normal', Ice:'wk', Electric:'res', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Distortion', type:'Skill', element:'Electric', sp:20,
        desc:"Deal Electric damage to all foes equal to 85.4%/94.2%/90.6%/99.4% of Attack. 80% chance to inflict Shock on main target for 2 turns. If an ally has Costar, deal bonus Electric damage to main target equal to 83.3%/91.8%/88.4%/96.9% of that ally's Attack (1 hit).",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรูทุกตัว 85.4%/94.2%/90.6%/99.4% ของ Attack โอกาส 80% ทำให้เป้าหมายหลักติด Shock 2 เทิร์น หากพันธมิตรมี Costar ดีลดาเมจไฟฟ้าโบนัสต่อเป้าหมายหลัก 83.3%/91.8%/88.4%/96.9% ของ Attack ของพันธมิตรนั้น (1 ครั้ง)"},
      {name:'Unison Notes', type:'Skill', element:'-', sp:20, isBuff:true,
        desc:"Grant Costar to 1 ally and increase their Attack by 24% of Ayaka's Attack (up to 1220/1345/1295/1420) for 3 turns. Only 1 ally can be Costar at a time.",
        descTh:"ให้ Costar แก่พันธมิตร 1 คน และเพิ่ม Attack ของพวกเขา 24% ของ Attack Ayaka (สูงสุด 1220/1345/1295/1420) เป็นเวลา 3 เทิร์น มีพันธมิตรเป็น Costar ได้เพียง 1 คนเท่านั้น"},
      {name:'Catchy Hook', type:'Skill', element:'-', sp:25, isBuff:true,
        desc:"Immediately activate the selected ally's Highlight and increase its damage by 78.1%/86.1%/82.9%/90.9%. Does not affect that Highlight's cooldown. If the selected character has a Theurgy, their next Theurgy gets +19.5%/19.5%/20.7%/20.7% final damage amplification. Cooldown: 1 turn (increases each use, up to 3 turns).",
        descTh:"เปิดใช้ Highlight ของพันธมิตรที่เลือกทันที และเพิ่มดาเมจ 78.1%/86.1%/82.9%/90.9% ไม่ส่งผลต่อ Cooldown ของ Highlight นั้น หากพันธมิตรที่เลือกมี Theurgy การเปิดใช้ Theurgy ครั้งถัดไปจะเพิ่ม final damage amplification 19.5%/19.5%/20.7%/20.7% Cooldown: 1 เทิร์น (เพิ่มทุกการใช้งาน สูงสุด 3 เทิร์น)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Electric', sp:0, isBuff:true,
        desc:"For 4 ally actions, increase party's damage by 45.5%/50.1%/48.3%/52.9%. While active, fill the Highlight gauge by 10% after each ally action (up to 40%). [4-turn cooldown]",
        descTh:"เป็นเวลา 4 แอ็คชันของพันธมิตร เพิ่มดาเมจของปาร์ตี้ 45.5%/50.1%/48.3%/52.9% ขณะทำงาน เติม Highlight gauge 10% หลังพันธมิตรใช้แอ็คชัน (สูงสุด 40%) [Cooldown: 4 เทิร์น]"},
      {name:'Backing Track', type:'Passive', element:'-', sp:0,
        desc:"When an ally uses a Highlight or Theurgy, increase that ally's Attack by 24.0% for 1 turn. If the ally has Costar, increase effect by 1.5×.",
        descTh:"เมื่อพันธมิตรใช้ Highlight หรือ Theurgy เพิ่ม Attack ของพวกเขา 24.0% เป็นเวลา 1 เทิร์น หากพวกเขามี Costar เพิ่มผล 1.5×"},
      {name:'Chorus Effect', type:'Passive', element:'-', sp:0,
        desc:"After an ally uses a Highlight or Theurgy, the ally with the lowest HP recovers HP equal to 15.0% of Ayaka's Attack + 1350.",
        descTh:"หลังพันธมิตรใช้ Highlight หรือ Theurgy พันธมิตรที่มี HP ต่ำสุดจะฟื้นฟู HP เท่ากับ 15.0% ของ Attack Ayaka + 1350"},
    ],
    awareness:[
      {name:'Opening Act',
        desc:"When using Catchy Hook, increase Ayaka's Attack by 20% for that battle (up to 40%). Catchy Hook has a 1-turn cooldown before it can be used, which increases each use (up to 3 turns).",
        descTh:"เมื่อใช้ Catchy Hook เพิ่ม Attack Ayaka 20% ตลอดการต่อสู้ (สูงสุด 40%) Catchy Hook มี Cooldown 1 เทิร์นก่อนใช้ได้ และเพิ่มขึ้นทุกการใช้งาน (สูงสุด 3 เทิร์น)"},
      {name:'Hard Rock',
        desc:"At the start of battle, grant Costar to the ally with the highest Attack for 3 turns (prioritizing Assassins and Sweepers). Increase that ally's critical rate by 15%.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ ให้ Costar แก่พันธมิตรที่มี Attack สูงสุด 3 เทิร์น (ให้ความสำคัญ Assassin และ Sweeper) เพิ่ม CRIT Rate ของพวกเขา 15%"},
      {name:'Crescendo Shout',
        desc:"When using Catchy Hook, increase the targeted ally's damage by 30% for 2 turns.",
        descTh:"เมื่อใช้ Catchy Hook เพิ่มดาเมจของพันธมิตรที่เลือก 30% เป็นเวลา 2 เทิร์น"},
      {name:'Amplifier',
        desc:"Increase the skill levels of Distortion and Catchy Hook by 3.",
        descTh:"เพิ่มระดับสกิล Distortion และ Catchy Hook ขึ้น 3 ระดับ"},
      {name:'Spotlight',
        desc:"Highlight Enhanced: Increase effect duration to 6 ally actions. Fill Highlight gauge to 60%, and decrease all other allies' Highlight activation cooldown by 1 turn.",
        descTh:"Highlight เสริม: เพิ่มระยะเวลาเป็น 6 แอ็คชันของพันธมิตร เติม Highlight gauge เป็น 60% และลด Cooldown Highlight ของพันธมิตรอื่นทุกคน 1 เทิร์น"},
      {name:'Shredding',
        desc:"Increase the skill levels of Unison Notes and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Unison Notes และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Spirit of Rock',
        desc:"At the start of battle, Catchy Hook can be used immediately. Its cooldown is permanently 1 turn (no longer increases). Each use of Catchy Hook increases party's damage by 20% (up to 2 stacks).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ สามารถใช้ Catchy Hook ได้ทันที Cooldown จะเป็น 1 เทิร์นถาวร (ไม่เพิ่มอีก) ทุกการใช้ Catchy Hook เพิ่มดาเมจของปาร์ตี้ 20% (สูงสุด 2 stack)"},
    ],
    baseStats: {hp:307, atk:96, def:52, spd:100},
    baseStatsLv80: [
      {hp:3450, atk:1080, def:587, spd:0},
      {hp:3512, atk:1099, def:597, spd:0},
      {hp:3574, atk:1119, def:607, spd:0},
      {hp:3636, atk:1138, def:619, spd:0},
      {hp:3699, atk:1158, def:629, spd:0},
      {hp:3760, atk:1178, def:639, spd:0},
      {hp:3823, atk:1197, def:650, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Superstar', stars:5,
        hp:2279, atk:714, def:388,
        bonusStats:{atk:30},
        abilityName:'Superstar',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'At start of battle, fill Highlight gauge by 40.0%/52.0%/52.0%/64.0%/64.0%/76.0%/76.0%.',
          "Increase Costar's Attack by 15.0%/19.5%/19.5%/24.0%/24.0%/28.5%/28.5%.",
          "Each time an ally uses a Highlight or Theurgy, increase Costar's Attack by 5.0%/6.5%/6.5%/8.0%/8.0%/9.5%/9.5% (up to 3 stacks).",],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อเริ่มต้นการต่อสู้ เติม Highlight gauge 40.0%/52.0%/52.0%/64.0%/64.0%/76.0%/76.0%',
          'เพิ่ม Attack ของ Costar 15.0%/19.5%/19.5%/24.0%/24.0%/28.5%/28.5%',
          'ทุกครั้งที่พันธมิตรใช้ Highlight หรือ Theurgy เพิ่ม Attack ของ Costar 5.0%/6.5%/6.5%/8.0%/8.0%/9.5%/9.5% (สูงสุด 3 stack)',
        ]},
      {name:"Rock 'n' Roller", stars:4,
        hp:1823, atk:571, def:310,
        bonusStats:{atk:24},
        abilityName:"Rock 'n' Roller",
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "After using Catchy Hook, increase Attack by 28.0%/36.0%/36.0%/44.0%/44.0%/52.0%/52.0% for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังใช้ Catchy Hook เพิ่ม Attack 28.0%/36.0%/36.0%/44.0%/44.0%/52.0%/52.0% เป็นเวลา 2 เทิร์น',
        ]},
    ],
  },
  {name:'Riko Tanemura', codename:'Wind', role:'Elucidator', element:'-', rarity:4,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:"Best SPD support weapon (Kunoichi: Sky's Edge)",
    statPrio:['SPD','ATK%','HP%'], note:"Elucidator. Speed-scaling DEF debuffer and damage amplifier via Insight/Intel system. Verngale Petals grants Fair Winds (party DMG buff). Stat Buff shares 15% of Revealed Phantom Thief's stats with party.",
    mechanics: "Insight ถูกติดบนศัตรูที่มี Down Point สูงสุดทุก 3 action ของ ally (หรือผ่าน awareness) เมื่อ Riko โจมตีศัตรูที่มี Insight จะใช้ stack ทั้งหมดเพื่อได้ Intel (2 stack ต่อการโจมตี, +1 ถ้าโจมตีจุดอ่อนหรือ neutral) เมื่อมี 5+ Intel สามารถใช้ Verngale Petals — ใช้ Intel ทั้งหมดเพื่อรับ Fair Winds (ดาเมจปาร์ตี้ขึ้นตาม SPD) และฮีลเป้าเดี่ยว DEF debuff บน Scattered Plum Blossoms และ Dreams in the Mist สเกลตาม SPD เกิน 100: ทุก 10 SPD เพิ่ม % DEF reduction passive Stat Buff แชร์ 15% ของ stat Riko ให้ปาร์ตี้",
    rotation: [
      "เทิร์น 1 → Scattered Plum Blossoms (AoE DEF down + ติด Insight บนเป้าหลัก; สเกลตาม SPD เกิน 100)",
      "เทิร์น 2 → Dreams in the Mist (DMG taken up ปาร์ตี้; CD ลดอัตโนมัติเมื่อ ally กด Down ศัตรู)",
      "โจมตีศัตรูที่มี Insight → ได้ Intel (5+ Intel → ใช้ Verngale Petals → Fair Winds + ฮีล)",
      "ต่ออายุ Scattered Plum Blossoms ทุก 2 เทิร์น เพื่อรักษา DEF down uptime บนทุกศัตรู",
      "Stat Buff passive → รักษา SPD ของ Riko ให้สูงสุด เพื่อแชร์ 15% ของ stat ให้ปาร์ตี้",
      "กับ Kunoichi weapon: ใช้ Insight 2 stack = Intel 2+ stack + ปาร์ตี้ DMG up 1 เทิร์น",
    ],
    realName:'Riko Tanemura', persona:'Chiyome',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Scattered Plum Blossoms', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Decrease all foes' Defense by 10.0%/10.0%/10.8%/10.8% for 2 turns. When Riko's Speed is at 100 or more, decrease Defense by 4.9% for every 10 points of Speed over 100, up to 29.4%/32.3%/31.8%/34.7%. Also inflict Insight on the main target.\nCooldown Time: 4 ally actions.",
        descTh:"ลด DEF ศัตรูทุกตัว 10.0%/10.0%/10.8%/10.8% 2 เทิร์น เมื่อ Speed ของ Riko อยู่ที่ 100 หรือมากกว่า ลด DEF เพิ่มอีก 4.9% ต่อ Speed ที่เกิน 100 ทุก 10 จุด (สูงสุด 29.4%/32.3%/31.8%/34.7%) นอกจากนี้ ทำให้เป้าหมายหลักติด Insight\nเวลาคูลดาวน์: 4 การกระทำของพันธมิตร"},
      {name:'Dreams in the Mist', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase all foes' damage taken by 10.5%/11.6%/11.3%/12.4% for 2 turns. When an ally lowers a foe's Down Points or knocks down a foe, decrease cooldown time by 1. When cooldown time reaches 0, activate this skill.\nCooldown Time: 8 ally actions.",
        descTh:"เพิ่มดาเมจที่ศัตรูทุกตัวรับ 10.5%/11.6%/11.3%/12.4% 2 เทิร์น เมื่อพันธมิตรลด Down Points หรือ Knock Down ศัตรู ลดเวลาคูลดาวน์ 1 เมื่อคูลดาวน์ถึง 0 จะเปิดใช้งานสกิลนี้โดยอัตโนมัติ\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร"},
      {name:'Verngale Petals', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Spend all Intel stacks to grant Fair Winds to party for 1 turn and restore targeted ally's HP by 12.7%/12.7%/13.7%/13.7%.\nFair Winds: Increase damage to foes by 12.6%/13.9%/13.6%/14.9%. If Riko's Speed is at 100 or more, increase damage by 1.05% for every 10 points of Speed over 100, up to 6.3%/6.9%/6.8%/7.4%.\nCooldown Time: 8 ally actions. (Cannot be used when Intel is less than 5.)",
        descTh:"ใช้ Intel ทั้งหมด มอบ Fair Winds ให้ปาร์ตี้ 1 เทิร์น และฟื้นฟู HP ของพันธมิตรเป้าหมาย 12.7%/12.7%/13.7%/13.7%\nFair Winds: เพิ่มดาเมจต่อศัตรู 12.6%/13.9%/13.6%/14.9% หาก Speed ของ Riko อยู่ที่ 100 หรือมากกว่า เพิ่มดาเมจ 1.05% ต่อ Speed ที่เกิน 100 ทุก 10 จุด (สูงสุด 6.3%/6.9%/6.8%/7.4%)\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร (ไม่สามารถใช้งานได้เมื่อ Intel น้อยกว่า 5)"},
      {name:'Stat Buff', type:'Passive', element:'-', sp:0,
        desc:"Increase all allies' corresponding attribute stats by 15% of the Revealed Phantom Thief's attributes.",
        descTh:"เพิ่มสถิติที่สอดคล้องของพันธมิตรทุกคน 15% ของสถิติของ Revealed Phantom Thief"},
      {name:'Springtime Tempest', type:'Passive', element:'-', sp:0,
        desc:"At the start of battle, if Riko's Speed is 100 or more, increase party's HP by 6, Attack by 2, and Defense by 2 for every 1 point of Speed above 100.\nIncrease HP up to 360, Attack up to 120, and Defense up to 120.",
        descTh:"ในช่วงเริ่มต้นการต่อสู้ หาก Speed ของ Riko อยู่ที่ 100 หรือมากกว่า เพิ่ม HP ปาร์ตี้ 6, Attack 2 และ Defense 2 ต่อ Speed ทุก 1 จุดที่เกิน 100\nเพิ่ม HP สูงสุด 360, Attack สูงสุด 120 และ Defense สูงสุด 120"},
      {name:'Plum Blossom Glory', type:'Passive', element:'-', sp:0,
        desc:"Increase 1 More and All-Out Attack damage by 60.0%.",
        descTh:"เพิ่มดาเมจ 1 More และ All-Out Attack 60.0%"},
    ],
    awareness:[
      {name:'Snowfall Fragrance',
        desc:"Every 3 ally actions, inflict Insight on the foe with the most Down Points. When attacking a foe with Insight, spend its Insight stacks to grant Riko Intel.\nInsight: Increase next damage taken by 6%. When attacking, Riko gains 2 Intel stacks. When dealing weakness or normal affinity damage, decrease Down Points by 1. When decreasing Down Points, gain 1 more Intel stack. Intel stacks up to 8 times.",
        descTh:"ทุก 3 การกระทำของพันธมิตร ทำให้ศัตรูที่มี Down Points มากที่สุดติด Insight เมื่อโจมตีศัตรูที่มี Insight ให้ใช้ Insight stacks ทั้งหมดเพื่อมอบ Intel ให้ Riko\nInsight: เพิ่มดาเมจที่รับครั้งต่อไป 6% เมื่อ Riko โจมตีจะได้รับ Intel 2 stack เมื่อดีล weakness หรือ normal affinity damage ให้ลด Down Points 1 เมื่อลด Down Points จะได้ Intel เพิ่ม 1 stack Intel สะสมได้สูงสุด 8 stack"},
      {name:'Spring Squall',
        desc:"At the start of battle, inflict Insight on the foe with the most Down Points.",
        descTh:"ในช่วงเริ่มต้นการต่อสู้ ทำให้ศัตรูที่มี Down Points มากที่สุดติด Insight"},
      {name:'Ethereal Scent',
        desc:"After using Verngale Petals, inflict Insight on the foe with the most Down Points.",
        descTh:"หลังใช้ Verngale Petals ทำให้ศัตรูที่มี Down Points มากที่สุดติด Insight"},
      {name:'Harmonious Fragrance',
        desc:"Increase the skill levels of Scattered Plum Blossoms and Dreams in the Mist by 2.",
        descTh:"เพิ่มระดับสกิลของ Scattered Plum Blossoms และ Dreams in the Mist 2 ระดับ"},
      {name:'One Thousand Blossoms',
        desc:"When an ally uses a Highlight, inflict Insight on the foe with the most Down Points.",
        descTh:"เมื่อพันธมิตรใช้ Highlight ทำให้ศัตรูที่มี Down Points มากที่สุดติด Insight"},
      {name:'Balance and Harmony',
        desc:"Increase the skill level of Verngale Petals by 2.",
        descTh:"เพิ่มระดับสกิลของ Verngale Petals 2 ระดับ"},
      {name:'Majesty',
        desc:"If Riko's Speed is 100 or more, when using Verngale Petals, decrease cooldown time for every 15 points of Speed over 100, up to 4 actions.",
        descTh:"หาก Speed ของ Riko อยู่ที่ 100 หรือมากกว่า เมื่อใช้ Verngale Petals ลดเวลาคูลดาวน์ต่อ Speed ทุก 15 จุดที่เกิน 100 (สูงสุด 4 การกระทำ)"},
    ],
    baseStats:{hp:232, atk:69, def:40, spd:105},
    baseStatsLv80:[
      {hp:2610, atk:780, def:455, spd:0},
      {hp:2640, atk:789, def:461, spd:0},
      {hp:2670, atk:798, def:466, spd:0},
      {hp:2700, atk:807, def:471, spd:0},
      {hp:2731, atk:816, def:476, spd:0},
      {hp:2760, atk:825, def:482, spd:0},
      {hp:2791, atk:834, def:487, spd:0},
    ],
    hiddenAbility:'SPD +119.1',
    weapons:[
      {name:"Kunoichi: Sky's Edge", stars:5, hp:2299, atk:687, def:401, bonusStats:{spd:15},
        abilityName:'Shadow Dance',
        ability:["Increase Speed by 15.0/15.0/20.0/20.0/25.0/25.0/30.0. For every 2 Insight stack spent, gain 2/3/3/4/4/5/5 Intel stacks. Also, increase party's damage by 6.0%/7.8%/7.8%/9.6%/9.6%/11.4%/11.4% for 1 turn. Increase max stacks of Intel to 11/12/12/13/13/14/14."],
        abilityTh:[
          'เพิ่ม Speed 15.0/15.0/20.0/20.0/25.0/25.0/30.0',
          'ต่อ Insight 2 stack ที่ใช้ รับ Intel 2/3/3/4/4/5/5 stack เพิ่มดาเมจของปาร์ตี้ 6.0%/7.8%/7.8%/9.6%/9.6%/11.4%/11.4% 1 เทิร์น เพิ่ม Intel stack สูงสุดเป็น 11/12/12/13/13/14/14',]},
      {name:'Moonlight Needle', stars:4, hp:1839, atk:550, def:320, bonusStats:{atk:24},
        abilityName:'Reflected Moon',
        ability:["Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. For each Insight stack spent, permanently increase party's Attack by 3.5%/4.6%/4.6%/5.7%/5.7%/6.8%/6.8%. Stacks up to 5 times."],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'ต่อ Insight 1 stack ที่ใช้ เพิ่ม Attack ของปาร์ตี้แบบถาวร 3.5%/4.6%/4.6%/5.7%/5.7%/6.8%/6.8% สะสมสูงสุด 5 ครั้ง',
        ]},
      {name:'Red Plum Blossom', stars:4, hp:1982, atk:550, def:285, bonusStats:{spd:9}, isEvent:true,
        abilityName:'In Bud',
        ability:["Increase Speed by 4.6/4.6/5.9/5.9/7.2/7.2/8.5. For each Insight stack spent, randomly grant 1 of the following effects to the party: Increase Attack by 7.0%/9.0%/9.0%/11.0%/11.0%/13.0%/13.0% (2 turns), Increase Defense by 11.0%/14.0%/14.0%/17.0%/17.0%/20.0%/20.0% (2 turns), Increase max HP by 7.0%/9.0%/9.0%/11.0%/11.0%/13.0%/13.0% (2 turns). Also, 5.0%/6.7%/6.7%/8.3%/8.3%/10.0%/10.0% chance to gain 1 Intel stack."],
        abilityTh:[
          'เพิ่ม Speed 4.6/4.6/5.9/5.9/7.2/7.2/8.5',
          'ต่อ Insight 1 stack ที่ใช้ สุ่มมอบ 1 ในเอฟเฟกต์ต่อไปนี้ให้ปาร์ตี้: เพิ่ม Attack 7.0%/9.0%/9.0%/11.0%/11.0%/13.0%/13.0% (2 เทิร์น), เพิ่ม Defense 11.0%/14.0%/14.0%/17.0%/17.0%/20.0%/20.0% (2 เทิร์น), เพิ่ม HP สูงสุด 7.0%/9.0%/9.0%/11.0%/11.0%/13.0%/13.0% (2 เทิร์น) โอกาส 5.0%/6.7%/6.7%/8.3%/8.3%/10.0%/10.0% ที่จะได้ Intel 1 stack',
        ]},
    ],
  },
  {name:'Yaoling Li',         codename:'Rin',            role:'Saboteur',   element:'Curse',          rarity:5, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Curse / SPD weapon',                       statPrio:['ATK%','SPD','DEF%'],                             note:'Best enemy debuffer — reduces enemy DEF. Hindrance 4pc amplifies debuffed targets.',
    mechanics: "ทุก 10 SPD ให้ Memory +1 ต่อเทิร์น (cap 18/เทิร์น ที่ 180+ SPD) เมื่อสะสม Memory 40 stack จะได้ Meng Po Soup 1 ใบ ใช้ทักษะขณะมี Soup active: โอกาส 50% ทำให้ศัตรู 1 ตัวติด Forget และเพิ่มผลทักษะนั้นสองเท่า DEF debuff บน Underworld Ferry และ Lion Dance สเกลโดยตรงกับ SPD — SPD สูงกว่า = debuff แรงกว่า เหมาะคู่กับ DPS ธาตุ Curse หรือ Physical ที่ได้ประโยชน์สูงสุดจากการลด DEF ศัตรู",
    rotation: [
      "เทิร์น 1 → Underworld Ferry (AoE DEF down ตาม SPD ต่อ 10 + Memory 4 stack ต่อศัตรูที่โดน)",
      "เทิร์น 2 → Flowers of Naihe พร้อม Meng Po Soup → ติด Forget + เพิ่ม DMG taken up สองเท่า",
      "เทิร์น 3 → Lion Dance of Oblivion พร้อม Soup → Red Spider Lily เพิ่มเป็นสองเท่า (DMG taken up มหาศาล)",
      "ต่ออายุ Underworld Ferry ทุก 2 เทิร์น เพื่อรักษา DEF debuff uptime",
      "ใช้ Highlight เมื่อพร้อม → DMG taken debuff มหาศาล + โอกาส 30% ติด Forget ทุกศัตรู",
      "ลำดับความสำคัญ: รักษา Red Spider Lily กับ DEF debuff ให้ทับซ้อนกันเพื่อช่วง debuff สูงสุด",
    ],
    realName:'Yaoling Li', persona:'Meng Po',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'wk', Wind:'normal', Nuclear:'normal', Curse:'res', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Underworld Ferry',        type:'Skill',   element:'Curse', sp:20,
        desc:"Deal Curse damage to all foes equal to 73.2%/80.7%/77.7%/85.2% of Attack. Decrease foes' Defense by 3% for every 10 points of Yaoling's Speed for 2 turns (up to 49.7%/54.8%/53.5%/58.6%). Also gain 4 Memory stacks for each foe attacked.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรูทุกตัว เท่ากับ 73.2%/80.7%/77.7%/85.2% ของ Attack ลด DEF ของศัตรู 3% ต่อ Speed ของ Yaoling 10 จุด เป็นเวลา 2 เทิร์น (สูงสุด 49.7%/54.8%/53.5%/58.6%) นอกจากนี้ รับ Memory 4 stack ต่อศัตรู 1 ตัวที่โจมตี"},
      {name:'Flowers of Naihe',        type:'Skill',   element:'Curse', sp:22,
        desc:"Deal Curse damage to 1 foe equal to 97.6%/107.6%/103.6%/113.6% of Attack. If foe has a debuff, increase damage by 20%. When spending Meng Po Soup, inflict Forget on the main target for 2 turns.\nIf foe is inflicted with Forget or another spiritual ailment, increase their damage taken by 2% for every 10 points of Yaoling's Speed (up to 32.3%/32.3%/34.3%/34.3%) for 1 turn.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรู 1 ตัว เท่ากับ 97.6%/107.6%/103.6%/113.6% ของ Attack หากศัตรูมี debuff เพิ่มความเสียหาย 20% เมื่อใช้ Meng Po Soup ทำให้เป้าหมายหลักติด Forget 2 เทิร์น\nหากศัตรูติด Forget หรือ spiritual ailment อื่น เพิ่มความเสียหายที่รับ 2% ต่อ Speed ของ Yaoling 10 จุด (สูงสุด 32.3%/32.3%/34.3%/34.3%) เป็นเวลา 1 เทิร์น"},
      {name:'Lion Dance of Oblivion',  type:'Skill',   element:'Curse', sp:24,
        desc:"Deal Curse damage to all foes equal to 78.1%/86.1%/82.9%/90.9% of Attack, and inflict Red Spider Lily for 2 turns. When spending Meng Po Soup, double Red Spider Lily's damage increase.\nRed Spider Lily: Increase foes' damage taken by 3% for every 10 points of Yaoling's Speed (up to 48.5%/53.5%/52.2%/57.2%). Lasts for 2 turns, or until damage is taken 2 times.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรูทุกตัว เท่ากับ 78.1%/86.1%/82.9%/90.9% ของ Attack และทำให้ติด Red Spider Lily 2 เทิร์น เมื่อใช้ Meng Po Soup เพิ่มเอฟเฟกต์เพิ่มความเสียหายของ Red Spider Lily เป็น 2 เท่า\nRed Spider Lily: เพิ่มความเสียหายที่ศัตรูรับ 3% ต่อ Speed ของ Yaoling 10 จุด (สูงสุด 48.5%/53.5%/52.2%/57.2%) คงอยู่ 2 เทิร์น หรือจนกว่าจะรับความเสียหาย 2 ครั้ง"},
      {name:'Highlight',               type:'Skill',   element:'Curse', sp:0,
        desc:"Deal Curse damage to all foes equal to 146.4%/161.4%/155.4%/170.4% of Attack, and increase target's damage taken by 48.8%/53.8%/51.8%/56.8%. 30% chance to inflict Forget on foes for 2 turns.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรูทุกตัว เท่ากับ 146.4%/161.4%/155.4%/170.4% ของ Attack และเพิ่มความเสียหายที่เป้าหมายรับ 48.8%/53.8%/51.8%/56.8% โอกาส 30% ทำให้ศัตรูติด Forget 2 เทิร์น"},
      {name:'Kung Fu Mastery',         type:'Passive', element:'-',     sp:0,
        desc:"Increase Attack by 1% for every 2 points of Yaoling's Speed (up to 90.0%).",
        descTh:"เพิ่ม Attack 1% ต่อ Speed ของ Yaoling 2 จุด (สูงสุด 90.0%)"},
      {name:'Up to Chance',            type:'Passive', element:'-',     sp:0,
        desc:"When attacking a foe with more than 50% HP, increase foe's Curse damage taken by 30.0%.",
        descTh:"เมื่อโจมตีศัตรูที่มี HP มากกว่า 50% เพิ่มความเสียหาย Curse ที่ศัตรูรับ 30.0%"},
    ],
    awareness:[
      {name:'Goddess of Oblivion',
        desc:"On Yaoling's action, gain 1 Memory stack for every 10 points of Speed (up to 18 stacks per turn). When Memory reaches 40 stacks, spend all stacks to gain 1 Meng Po Soup stack.\nWhen using a skill, spend 1 Meng Po Soup stack for a 50% chance to inflict Forget on 1 foe for 1 turn, and enhance effects of Flowers of Naihe and Lion Dance of Oblivion.",
        descTh:"ในเทิร์นของ Yaoling รับ Memory 1 stack ต่อ Speed 10 จุด (สูงสุด 18 stack ต่อเทิร์น) เมื่อ Memory ถึง 40 stack ใช้ stack ทั้งหมดเพื่อรับ Meng Po Soup 1 stack\nเมื่อใช้สกิล ใช้ Meng Po Soup 1 stack เพื่อโอกาส 50% ทำให้ศัตรู 1 ตัวติด Forget 1 เทิร์น และเพิ่มเอฟเฟกต์ของ Flowers of Naihe และ Lion Dance of Oblivion"},
      {name:'Road to Rebirth',
        desc:"At the start of battle, gain 1 Meng Po Soup stack.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Meng Po Soup 1 stack"},
      {name:'Soul Reaper',
        desc:"Increase Attack by 10% for each debuff inflicted on foes for 2 turns. Stacks up to 5 times.",
        descTh:"เพิ่ม Attack 10% ต่อ debuff ที่ทำให้ศัตรูติด เป็นเวลา 2 เทิร์น สะสมสูงสุด 5 ครั้ง"},
      {name:'Beyond the Bend',
        desc:"Increase the skill levels of Lion Dance of Oblivion and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Lion Dance of Oblivion และ Thief Tactics ขึ้น 3"},
      {name:'Training Results',
        desc:"Highlight Enhanced: Increase damage taken effect by 20%. Inflict Curse on all foes for 2 turns.",
        descTh:"Highlight Enhanced: เพิ่มเอฟเฟกต์ความเสียหายที่รับ 20% ทำให้ศัตรูทุกตัวติด Curse 2 เทิร์น"},
      {name:"Meng Po's Medicine",
        desc:"Increase the skill levels of Underworld Ferry and Flowers of Naihe by 3.",
        descTh:"เพิ่มระดับสกิล Underworld Ferry และ Flowers of Naihe ขึ้น 3"},
      {name:'Wisps of Crimson',
        desc:"When spending Meng Po Soup, increase party's Curse damage by 20% for 1 turn. Also, 60% chance to gain 1 Meng Po Soup stack. This effect won't activate again on the next turn.",
        descTh:"เมื่อใช้ Meng Po Soup เพิ่มความเสียหาย Curse ของปาร์ตี้ 20% เป็นเวลา 1 เทิร์น นอกจากนี้ โอกาส 60% รับ Meng Po Soup 1 stack เอฟเฟกต์นี้จะไม่ทำงานอีกในเทิร์นถัดไป"},
    ],
    baseStats:     {hp:283, atk:97, def:56, spd:106},
    baseStatsLv80: [
      {hp:3180, atk:1090, def:633, spd:106},
      {hp:3238, atk:1110, def:645, spd:106},
      {hp:3294, atk:1129, def:657, spd:106},
      {hp:3352, atk:1149, def:668, spd:106},
      {hp:3409, atk:1168, def:679, spd:106},
      {hp:3466, atk:1188, def:690, spd:106},
      {hp:3523, atk:1208, def:702, spd:106},
    ],
    hiddenAbility: 'SPD +124.8',
    weapons:[
      {
        name: 'Infinite Moment', stars:5,
        hp: 2101, atk: 720, def: 418,
        bonusStats: {spd:15},
        abilityName: 'Infinite Moment',
        ability: [
          'Increase Speed by 15.0/15.0/20.0/20.0/25.0/25.0/30.0.',
          'After attacking a foe with a skill, inflict Waters of Oblivion on the main target.\nWaters of Oblivion: Increase foe\'s damage taken by 1.2%/1.6%/1.6%/2.0%/2.0%/2.4%/2.4% for every 10 of Yaoling\'s Speed for 1 turn.',
          'Increase Yaoling\'s Speed by 15 for 2 turns.\nAfter spending Meng Po Soup to use a skill on a foe, inflict this effect on all foes.',],
        abilityTh: [
          'เพิ่ม Speed 15.0/15.0/20.0/20.0/25.0/25.0/30.0',
          'หลังจากโจมตีศัตรูด้วยสกิล ทำให้เป้าหมายหลักติด Waters of Oblivion\nWaters of Oblivion: เพิ่มความเสียหายที่ศัตรูรับ 1.2%/1.6%/1.6%/2.0%/2.0%/2.4%/2.4% ต่อ Speed ของ Yaoling 10 จุด เป็นเวลา 1 เทิร์น',
          'เพิ่ม Speed ของ Yaoling 15 เป็นเวลา 2 เทิร์น\nหลังจากใช้ Meng Po Soup ใช้สกิลต่อศัตรู เอฟเฟกต์นี้จะส่งผลต่อศัตรูทุกตัว',
        ],
      },
      {
        name: 'Sunstaff', stars:4,
        hp: 1680, atk: 576, def: 335,
        bonusStats: {atk:12},
        abilityName: 'Sunstaff',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "After inflicting a debuff, increase Speed by 8/11/11/14/14/17/17 for 2 turns. Stacks up to 2 times.",
          "Gain 2 stacks at the start of battle.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังจากทำให้ติด debuff เพิ่ม Speed 8/11/11/14/14/17/17 เป็นเวลา 2 เทิร์น สะสมสูงสุด 2 ครั้ง\nรับ 2 stack เมื่อเริ่มต้นการต่อสู้',
        ],
      },
    ],
  },
  {name:'Seiji Shiratori', codename:'Fleuret', role:'Assassin', element:'Wind', rarity:4,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best CRIT/Wind weapon (Venus Sunrise)',
    statPrio:['ATK%','CRIT Rate%','CRIT DMG%'], note:'4★ Wind Assassin. Right to Strike stack mechanic — AoE skills stack faster with more foes. At 3+ stacks, all skills gain bonus hits.',
    mechanics: "Right to Strike stack สะสมจาก Graceful Gale (AoE, โอกาส = จำนวนศัตรู × 48%), Coup Droit proc ท้ายเทิร์น (60%) และ awareness เมื่อมี 3+ stack → Saber Surge ได้ +1 hit และ CRIT Rate +20% — นี่คือช่วงดาเมจหลัก Blustering Épée ติด Windswept บนศัตรู; เมื่อ Windswept ถูก Saber Surge โจมตี โอกาส 100% เกิด extra hit เพิ่ม (ผ่าน Chivalrous Spirit) Mindscape 5 เพิ่ม stack สูงสุดเป็น 5 ให้ CRIT Rate +4% ต่อ stack และ extra hit บนทุกทักษะเมื่อเต็ม cap",
    rotation: [
      "เทิร์น 1 → Graceful Gale (AoE; ทุกศัตรูให้โอกาส ~50% ได้ Right to Strike 1 stack)",
      "เทิร์น 2 → Blustering Épée บนเป้าหลัก (ติด Windswept เพื่อ +1 hit โบนัสบน Saber Surge)",
      "ครบ 3+ stack → Saber Surge (3 hit + CRIT Rate +20%; +1 เพิ่มถ้าเป้ามี Windswept)",
      "ท้ายทุกเทิร์น: Coup Droit passive โอกาส 60% ได้ stack เพิ่ม",
      "Highlight ที่ 3+ stack เพื่อ extra hit; ถ้าต่ำกว่า 3 stack → hit น้อยกว่า ลำดับต่ำกว่า",
      "ถ้ามีหลายศัตรู → spam Graceful Gale เพื่อสะสม stack เร็ว (จำนวนศัตรูคูณโอกาส)",
    ],
    realName:'Seiji Shiratori', persona:'Leucothea',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'res', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'wk' },
    skills:[
      {name:'Blustering Épée', type:'Skill', element:'Wind', sp:16,
        desc:"Deal Wind damage to 1 foe equal to 42.9%/47.3%/44.7%/49.0% of Attack (4 hits). 19.2%/19.2%/20.0%/20.0% chance to inflict Windswept for 2 turns.",
        descTh:"ดีลดาเมจลมต่อศัตรู 1 ตัว 42.9%/47.3%/44.7%/49.0% ของ Attack (4 ครั้ง) โอกาส 19.2%/19.2%/20.0%/20.0% ทำให้ติด Windswept 2 เทิร์น"},
      {name:'Graceful Gale', type:'Skill', element:'Wind', sp:19,
        desc:"Deal Wind damage to all foes equal to 24.2%/26.6%/25.2%/27.6% of Attack (3 hits). Gain 1 Right to Strike stack with chance equal to (number of foes × 48.8%/48.8%/50.8%/50.8%).",
        descTh:"ดีลดาเมจลมต่อศัตรูทุกตัว 24.2%/26.6%/25.2%/27.6% ของ Attack (3 ครั้ง) รับ Right to Strike 1 stack ด้วยโอกาส (จำนวนศัตรู × 48.8%/48.8%/50.8%/50.8%)"},
      {name:'Saber Surge', type:'Skill', element:'Wind', sp:18,
        desc:"Deal Wind damage to 1 foe equal to 53.2%/58.6%/55.4%/60.8% of Attack (3 hits). When Right to Strike is at 3+ stacks, increase hits by 1 and increase critical rate by 20%.",
        descTh:"ดีลดาเมจลมต่อศัตรู 1 ตัว 53.2%/58.6%/55.4%/60.8% ของ Attack (3 ครั้ง) เมื่อ Right to Strike ≥ 3 stack เพิ่ม 1 ครั้งและเพิ่ม CRIT Rate 20%"},
      {name:'HIGHLIGHT', type:'Skill', element:'Wind', sp:0,
        desc:"Deal Wind damage to 1 foe equal to 58.6%/64.6%/61.0%/67.0% of Attack (4 hits). When Right to Strike is at 3+ stacks, increase hits by 1. [4-turn cooldown]",
        descTh:"ดีลดาเมจลมต่อศัตรู 1 ตัว 58.6%/64.6%/61.0%/67.0% ของ Attack (4 ครั้ง) เมื่อ Right to Strike ≥ 3 stack เพิ่ม 1 ครั้ง [Cooldown: 4 เทิร์น]"},
      {name:'Chivalrous Spirit', type:'Passive', element:'-', sp:0,
        desc:"When attacking a Windswept foe with Saber Surge, 100.0% chance to increase hits by 1.",
        descTh:"เมื่อโจมตีศัตรูที่ติด Windswept ด้วย Saber Surge มีโอกาส 100% ที่จะเพิ่ม 1 ครั้ง"},
      {name:'Coup Droit', type:'Passive', element:'-', sp:0,
        desc:"At the end of Seiji's action, 60.0% chance to gain 1 Right to Strike stack.",
        descTh:"ท้ายแอ็คชันของ Seiji มีโอกาส 60.0% รับ Right to Strike 1 stack"},
    ],
    awareness:[
      {name:'Attaque au Fer',
        desc:"Each time Seiji deals damage with a skill, 40% chance to gain 1 Right to Strike stack for 2 turns (up to 3). Gain ATK +7% and SPD +4 per stack for 2 turns. Each stack's duration is managed individually.",
        descTh:"ทุกครั้งที่ Seiji ดีลดาเมจด้วยสกิล โอกาส 40% รับ Right to Strike 1 stack 2 เทิร์น (สูงสุด 3) ต่อ stack: ATK +7% และ SPD +4 เป็นเวลา 2 เทิร์น ระยะเวลาแต่ละ stack นับแยกกัน"},
      {name:'Pression',
        desc:"Increase maximum Right to Strike stacks to 5. Increase critical rate by 4% per Right to Strike stack.",
        descTh:"เพิ่ม Right to Strike stack สูงสุดเป็น 5 เพิ่ม CRIT Rate 4% ต่อ Right to Strike stack"},
      {name:'Parade',
        desc:"When attacked, 12% chance to evade.",
        descTh:"เมื่อถูกโจมตี มีโอกาส 12% หลีกเลี่ยง"},
      {name:'Sword of Truthseeking',
        desc:"Increase the skill levels of Blustering Épée and Graceful Gale by 2.",
        descTh:"เพิ่มระดับสกิล Blustering Épée และ Graceful Gale ขึ้น 2 ระดับ"},
      {name:'En Garde',
        desc:"Highlight Enhanced: When Seiji has 3+ Right to Strike stacks, increase hits by 1 and inflict Windswept on the target.",
        descTh:"Highlight เสริม: เมื่อ Seiji มี Right to Strike 3+ stack เพิ่ม 1 ครั้งและทำให้เป้าหมายติด Windswept"},
      {name:'Favorite Pre-Match Book',
        desc:"Increase the skill levels of Saber Surge and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Saber Surge และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Clumsy Swordwielder',
        desc:"Increase chance to gain Right to Strike by 20%. When at 5 Right to Strike stacks, Blustering Épée, Graceful Gale, and Saber Surge deal 1 more hit.",
        descTh:"เพิ่มโอกาสรับ Right to Strike 20% เมื่อมี Right to Strike 5 stack สกิล Blustering Épée, Graceful Gale และ Saber Surge ดีลเพิ่ม 1 ครั้ง"},
    ],
    baseStats: {hp:220, atk:75, def:41, spd:100},
    baseStatsLv80: [
      {hp:2475, atk:848, def:465, spd:0},
      {hp:2504, atk:857, def:471, spd:0},
      {hp:2532, atk:867, def:476, spd:0},
      {hp:2561, atk:877, def:481, spd:0},
      {hp:2590, atk:887, def:487, spd:0},
      {hp:2618, atk:896, def:493, spd:0},
      {hp:2647, atk:906, def:497, spd:0},
    ],
    hiddenAbility: 'CRIT Rate +18%',
    weapons:[
      {name:'Venus Sunrise', stars:5,
        hp:2180, atk:747, def:410,
        bonusStats:{},
        abilityName:'Venus Sunrise',
        ability:[
          'Increase critical rate by 18.0%/18.0%/23.5%/23.5%/29.0%/29.0%/34.5%.',
          'At the start of battle, gain 1 Right to Strike stack and increase critical damage by 12%.',
          'For each Right to Strike stack, increase damage by (current stacks × 7.5%/9.8%/9.8%/12.1%/12.1%/14.4%/14.4%) for 1 turn.',],
        abilityTh:[
          'เพิ่ม CRIT Rate 18.0%/18.0%/23.5%/23.5%/29.0%/29.0%/34.5%',
          'เมื่อเริ่มต้นการต่อสู้ รับ Right to Strike 1 stack และเพิ่ม CRIT DMG 12%',
          'ต่อ Right to Strike stack เพิ่มดาเมจ (จำนวน stack × 7.5%/9.8%/9.8%/12.1%/12.1%/14.4%/14.4%) เป็นเวลา 1 เทิร์น',
        ]},
      {name:"Knight's Reward", stars:4,
        hp:1744, atk:597, def:328,
        bonusStats:{atk:24},
        abilityName:"Knight's Reward",
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When dealing damage to the same foe multiple times, each hit has a 30% chance to deal 3.8%/4.9%/4.9%/6.0%/6.0%/7.1%/7.1% more damage (up to 19.0%/24.5%/24.5%/30.0%/30.0%/35.5%/35.5%).",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อโจมตีศัตรูตัวเดิมหลายครั้ง ทุกครั้งมีโอกาส 30% เพิ่มดาเมจ 3.8%/4.9%/4.9%/6.0%/6.0%/7.1%/7.1% (สูงสุด 19.0%/24.5%/24.5%/30.0%/30.0%/35.5%/35.5%)',
        ]},
    ],
  },
  {name:'Manaka Nagao', codename:'Ange', role:'Elucidator', element:'-', rarity:5,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:'Best ATK support weapon (Angel\'s Hymn)',
    statPrio:['ATK%','SPD','HP%'], note:'Elucidator. Stat Buff passively shares 20% of all Manaka\'s stats with the party. Musical Notes fuel skill cooldown reduction and pierce/ATK scaling. Da Capo grants an ally a rewind extra action — resetting their HP/SP/buffs/cooldowns to before their last action.',
    mechanics: "Musical Notes (สูงสุด 12) สะสม 1 ต่อ action ของ ally; ครบ 12 stack → Prayer Refrain เปิดอัตโนมัติฟรี Winged Canon บัฟดาเมจปาร์ตี้และให้ 4 Notes; Melody of Steps ใช้ Notes ทั้งหมดเพื่อบัฟ ATK + pierce (สเกลตาม ATK × Notes ที่ใช้) Da Capo (1 ครั้ง/การต่อสู้, ฟื้นหลัง 7 non-extra actions) ย้อนเวลา action ของ ally ที่เลือก — รีเซ็ต HP, SP, buff และ cooldown ก่อน action นั้น Crescendo passive ให้ ally ที่ถือ Da Capo +37.5% ATK เป็น buff ถาวรก่อนใช้",
    rotation: [
      "เทิร์น 1 → Winged Canon (DMG up ปาร์ตี้ + 4 Notes; CD 4 ally actions)",
      "เทิร์น 2 → Melody of Steps (ใช้ Notes ทั้งหมด → บัฟ ATK + pierce ปาร์ตี้; CD 4 ally actions)",
      "Prayer Refrain ยิงอัตโนมัติทุก 12 Notes — ให้ความสำคัญการใช้เองเพื่อลด CD ทักษะ",
      "ก่อน Highlight ของ DPS → ใช้ Da Capo บน DPS เพื่อให้พวกเขาใช้ Highlight ได้สองครั้ง",
      "กับ M5: เริ่มต้นด้วย Notes เต็มและ CD ลด — เปิดด้วย Melody of Steps ทันที",
      "สลับ Winged Canon กับ Melody ทุก 4 actions เพื่อรักษาทั้ง DMG และ ATK/pierce buffs",
    ],
    realName:'Manaka Nagao', persona:'Euterpe',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Winged Canon', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's damage by 7.0%/7.7%/7.8%/8.5% for 2 turns (for every 164 ATK, +1% more, up to 28.0%/30.8%/31.4%/34.2%). Gain 4 Musical Note stacks. [Cooldown: 4 ally actions]",
        descTh:"เพิ่มดาเมจของปาร์ตี้ 7.0%/7.7%/7.8%/8.5% 2 เทิร์น (ต่อ ATK ทุก 164 +1% เพิ่มเติม สูงสุด 28.0%/30.8%/31.4%/34.2%) รับ Musical Note 4 stack [Cooldown: 4 ally actions]"},
      {name:'Prayer Refrain', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Restore party's HP by 10.0%/10.0%/11.2%/11.2% of ATK + 681/816/989/1124, and remove 1 debuff. If Manaka has Musical Note, spend 1 stack to reduce skill cooldown by 1 action (up to 4 actions). If manually selected, healing +50%. [Cooldown: 8 ally actions]\nAutomatic: Every 12 Musical Note stacks gained during battle, activate this healing once.",
        descTh:"ฟื้นฟู HP ของปาร์ตี้ 10.0%/10.0%/11.2%/11.2% ของ ATK + 681/816/989/1124 และลบดีบัฟ 1 ชนิด หาก Manaka มี Musical Note ใช้ 1 stack เพื่อลด cooldown สกิล 1 action (สูงสุด 4) หากเลือกใช้ด้วยตนเอง healing +50% [Cooldown: 8 ally actions]\nอัตโนมัติ: ทุก Musical Note 12 stack ที่ได้รับระหว่างต่อสู้ เปิดใช้การรักษาของสกิลนี้ 1 ครั้ง"},
      {name:'Melody of Steps', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's Attack by 11% of ATK + 128/140/143/156 for 2 turns. Spend all Musical Note stacks; per stack spent, increase party's pierce rate and Attack by 0.1% per 460 ATK for 2 turns. Applies up to 4600/5060/5980/6440 ATK. [Cooldown: 4 ally actions]",
        descTh:"เพิ่ม ATK ของปาร์ตี้ 11% ของ ATK + 128/140/143/156 2 เทิร์น ใช้ Musical Note stack ทั้งหมด ต่อ stack ที่ใช้ เพิ่ม pierce rate และ ATK ของปาร์ตี้ 0.1% ต่อ ATK ทุก 460 2 เทิร์น ใช้ได้สูงสุด 4600/5060/5980/6440 ATK [Cooldown: 4 ally actions]"},
      {name:'Stat Buff', type:'Passive', element:'-', sp:0,
        desc:"Increase party's stats by 20% of Manaka's stats.",
        descTh:"เพิ่มสถิติของปาร์ตี้ 20% ของสถิติของ Manaka"},
      {name:'Crescendo', type:'Passive', element:'-', sp:0,
        desc:"Increase Attack of allies with Da Capo by 37.5%.",
        descTh:"เพิ่ม ATK ของพันธมิตรที่มี Da Capo 37.5%"},
      {name:'Heavenly Voice', type:'Passive', element:'-', sp:0,
        desc:"Based on the total Musical Note stacks gained, increase party's pierce rate by 1.0% per stack (counts up to 12 stacks).",
        descTh:"ตามจำนวน Musical Note stack ที่ได้รับทั้งหมด เพิ่ม pierce rate ของปาร์ตี้ 1.0% ต่อ stack (นับสูงสุด 12 stack)"},
    ],
    awareness:[
      {name:'Andante',
        desc:"On each ally's action, gain 1 Musical Note (max 12). Before any ally's action, can activate Da Capo (1 use per battle; after spending, restored when Wonder takes 7 non-extra actions — once per battle). Da Capo: Remove 1 debuff from 1 ally. At end of that ally's next action, grant a special extra action — HP, SP, buffs/debuffs, and skill cooldowns reset to their state at the start of the previous action.",
        descTh:"ต่อแอ็คชันของพันธมิตร รับ Musical Note 1 stack (สูงสุด 12) ก่อนแอ็คชันของพันธมิตรใด สามารถเปิดใช้ Da Capo ได้ (1 ครั้งต่อการต่อสู้; หลังใช้ จะได้คืนเมื่อ Wonder ใช้ 7 แอ็คชันที่ไม่ใช่แอ็คชันพิเศษ — ครั้งเดียวต่อการต่อสู้) Da Capo: ลบดีบัฟ 1 จากพันธมิตร 1 คน เมื่อสิ้นสุดแอ็คชันถัดไปของพันธมิตรนั้น มอบแอ็คชันพิเศษ — HP, SP, buff/debuff และ cooldown สกิลรีเซ็ตเป็นสถานะต้นแอ็คชันก่อนหน้า"},
      {name:'Allegro',
        desc:"At the start of battle, gain the maximum number of Musical Note stacks and reduce the first cooldown by 4 actions. When using Melody of Steps, also increase party's CRIT Rate by 12% for 2 turns.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Musical Note stack สูงสุดและลด cooldown แรกสุด 4 actions เมื่อใช้ Melody of Steps เพิ่ม CRIT Rate ปาร์ตี้ 12% 2 เทิร์นด้วย"},
      {name:'Fortissimo',
        desc:"Increase final damage of allies with extra actions from Da Capo by 12%. When an ally is KO'd, restore their HP equal to 20% of Manaka's Attack + 2000. Activates once per battle.",
        descTh:"เพิ่ม final damage ของพันธมิตรที่มีแอ็คชันพิเศษจาก Da Capo 12% เมื่อพันธมิตรถูก KO ฟื้นฟู HP 20% ของ Attack Manaka + 2000 เปิดใช้ได้ครั้งเดียวต่อการต่อสู้"},
      {name:'Vibrato',
        desc:"Increase the skill levels of Prayer Refrain and Melody of Steps by 3.",
        descTh:"เพิ่มระดับสกิล Prayer Refrain และ Melody of Steps ขึ้น 3 ระดับ"},
      {name:'Symphonia',
        desc:"At the start of battle, or when an ally activates a Highlight or Theurgy, gain 2 Musical Note stacks. Stacks from this effect can exceed the maximum limit up to 2 times.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ หรือเมื่อพันธมิตรเปิดใช้ Highlight หรือ Theurgy รับ Musical Note 2 stack stack จากเอฟเฟกต์นี้สามารถเกิน max ได้สูงสุด 2 ครั้ง"},
      {name:'Molto Vivace',
        desc:"Increase the skill level of Winged Canon by 3.",
        descTh:"เพิ่มระดับสกิล Winged Canon ขึ้น 3 ระดับ"},
      {name:'Con Anima',
        desc:"Increase the initial use count of Da Capo by 1.",
        descTh:"เพิ่มจำนวนครั้งใช้เริ่มต้นของ Da Capo 1 ครั้ง"},
    ],
    baseStats: {hp:300, atk:102, def:53, spd:100},
    baseStatsLv80: [
      {hp:3360, atk:1150, def:600, spd:0},
      {hp:3421, atk:1171, def:611, spd:0},
      {hp:3481, atk:1192, def:622, spd:0},
      {hp:3542, atk:1212, def:633, spd:0},
      {hp:3602, atk:1233, def:643, spd:0},
      {hp:3662, atk:1253, def:654, spd:0},
      {hp:3723, atk:1274, def:665, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:"Angel's Hymn", stars:5,
        hp:2220, atk:760, def:396,
        bonusStats:{atk:30},
        abilityName:'Divine Radiance',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'For each Musical Note gained, grant 1 Angelic Chorus stack to all allies. Angelic Chorus: Permanently increase damage by 0.7%/0.9%/0.9%/1.1%/1.1%/1.3%/1.3% (stacks up to 12). At 12 stacks, increase critical damage by 15.3%/19.9%/19.9%/24.5%/24.5%/29.1%/29.1%.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'ต่อ Musical Note ที่ได้รับ มอบ Angelic Chorus 1 stack ให้พันธมิตรทุกคน Angelic Chorus: เพิ่มดาเมจถาวร 0.7%/0.9%/0.9%/1.1%/1.1%/1.3%/1.3% (สะสมสูงสุด 12) ที่ 12 stack เพิ่ม CRIT DMG 15.3%/19.9%/19.9%/24.5%/24.5%/29.1%/29.1%',
        ]},
      {name:'Divine Muse', stars:4,
        hp:1776, atk:608, def:317,
        bonusStats:{atk:24},
        abilityName:'Luminous Glaze',
        ability:[
          'Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.',
          "After using a skill, permanently increase Manaka's Attack by 11.0%/14.5%/14.5%/18.0%/18.0%/21.5%/21.5%. Stacks up to 2 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังใช้สกิล เพิ่ม Attack ของ Manaka ถาวร 11.0%/14.5%/14.5%/18.0%/18.0%/21.5%/21.5% สะสมสูงสุด 2 ครั้ง',
        ]},
    ],
  },
  {name:'Yusuke Kitagawa',    codename:'Fox',            role:'Sweeper',    element:'Ice',            rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best DEF/Ice weapon',                           statPrio:['DEF%','Ice DMG%','HP%'],                         note:'DEF-scaling Ice Sweeper. Damage scales off Defense — stack DEF% over ATK%.',
    mechanics: "ทักษะและ Highlight ทั้งหมดของ Yusuke สเกลตาม DEF ไม่ใช่ ATK — สะสม DEF% ในทุก card slot Inspiration passive โอกาส 65% โต้กลับ (Ice, 88% DEF) เมื่อถูกทักษะศัตรู Keen Eye พัฒนา Inspiration ถัดไปเป็น Imagination: proc 100%, AoE และสร้าง shield Shield เปิด Painter's Focus (+7.5% DMG ต่อ shield, สูงสุด 6 stack) และ Artist's Intuition (+20% pierce 1 เทิร์น)",
    rotation: [
      "สะสม DEF% ในทุก main stat slot — Frozen Presence, Bone-Chilling Cold และ Highlight ล้วนสเกลตาม DEF",
      "เทิร์น 1 → Keen Eye → พัฒนา Inspiration ถัดไปเป็น Imagination (AoE, proc 100%, ได้ shield)",
      "ปล่อยให้ศัตรูโจมตีเพื่อเปิด Inspiration/Imagination → โต้กลับ passive โดยไม่เสียเทิร์น",
      "Bone-Chilling Cold ขณะมี shield active → bonus damage +30% บนทุก 5 hit",
      "ใช้ Highlight เมื่อพร้อม → Inspiration proc rate +35% 3 เทิร์น; ดีที่สุดเมื่อศัตรูโจมตีบ่อย",
      "รักษา HP เกิน 70% เพื่อ Both Beauty and Vice awareness (+35% counterattack damage bonus)",
    ],
    realName:'Yusuke Kitagawa', persona:'Goemon',
    weakRes:{ Fire:'wk', Ice:'res', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Frozen Presence',   type:'Skill',   element:'Ice', sp:20,
        desc:"Deal Ice damage to all foes equal to 72.1%/79.5%/76.6%/84.0% of Yusuke's Defense. Inflict Freeze on main target for 2 turns.",
        descTh:"สร้างความเสียหายธาตุน้ำแข็งให้ศัตรูทุกตัว เท่ากับ 72.1%/79.5%/76.6%/84.0% ของ DEF ของ Yusuke ทำให้เป้าหมายหลักติด Freeze 2 เทิร์น"},
      {name:'Bone-Chilling Cold', type:'Skill',  element:'Ice', sp:20,
        desc:"Deal Ice damage to foes equal to 92.9%/102.4%/98.6%/108.1% of Yusuke's Defense (5 hits). When Yusuke has a shield, increase damage by 30%. From the second hit, prioritize new targets and decrease damage by 60% for each hit on the same target (max decrease to 20% of Defense).",
        descTh:"สร้างความเสียหายธาตุน้ำแข็งให้ศัตรู เท่ากับ 92.9%/102.4%/98.6%/108.1% ของ DEF ของ Yusuke (5 ครั้ง) เมื่อ Yusuke มี shield เพิ่มความเสียหาย 30% ตั้งแต่ครั้งที่ 2 เป็นต้นไป จะเน้นเป้าหมายใหม่ก่อน และลดความเสียหาย 60% สำหรับแต่ละครั้งที่โจมตีเป้าหมายเดิม (ลดสูงสุดถึง 20% ของ DEF)"},
      {name:'Keen Eye',           type:'Skill',  element:'-',   sp:24, isBuff:true,
        desc:"Evolve the next activated Inspiration to Imagination.\nImagination: Increase chance of counterattack to 100%, increase damage by 78.1%/86.1%/82.9%/90.9% of Defense, and change target to all foes. If not activated by Yusuke's next action, activate automatically.\nFor 2 turns, gain a shield equal to 19.5%/19.5%/20.7%/20.7% of Yusuke's Defense + 555/555/683/683, increase Fire resistance, and nullify spiritual ailments. Also inflict Taunt on all foes for 2 turns.\nCooldown: 1 turn.",
        descTh:"พัฒนา Inspiration ครั้งถัดไปเป็น Imagination\nImagination: เพิ่มโอกาส counterattack เป็น 100% เพิ่มความเสียหาย 78.1%/86.1%/82.9%/90.9% ของ DEF และเปลี่ยนเป้าหมายเป็นศัตรูทุกตัว หากไม่ถูกเปิดใช้ในเทิร์นถัดไปของ Yusuke จะเปิดใช้อัตโนมัติ\nรับ shield เท่ากับ 19.5%/19.5%/20.7%/20.7% ของ DEF + 555/555/683/683 เพิ่มการต้านธาตุไฟ และภูมิคุ้มกัน spiritual ailment เป็นเวลา 2 เทิร์น รวมถึงทำให้ศัตรูทุกตัวติด Taunt 2 เทิร์น\nCooldown: 1 เทิร์น"},
      {name:'HIGHLIGHT',          type:'Skill',  element:'Ice', sp:0,
        desc:"Deal Ice damage to all foes equal to 178.1%/196.4%/189.1%/207.3% of Yusuke's Defense. Increase chance of activating Inspiration counterattacks by 35% for 3 turns.",
        descTh:"สร้างความเสียหายธาตุน้ำแข็งให้ศัตรูทุกตัว เท่ากับ 178.1%/196.4%/189.1%/207.3% ของ DEF ของ Yusuke เพิ่มโอกาสเปิดใช้ Inspiration counterattack 35% เป็นเวลา 3 เทิร์น"},
      {name:"Painter's Focus",    type:'Passive', element:'-',  sp:0,
        desc:"Each time a shield is gained, increase damage dealt to foes by 7.5% for 2 turns. Stacks up to 6 times.",
        descTh:"ทุกครั้งที่ได้รับ shield เพิ่มความเสียหายต่อศัตรู 7.5% เป็นเวลา 2 เทิร์น สะสมสูงสุด 6 ครั้ง"},
      {name:"Artist's Intuition", type:'Passive', element:'-',  sp:0,
        desc:"Each time a shield is gained with Yusuke's skills, increase Yusuke's pierce rate by 20.0% for 1 turn.",
        descTh:"ทุกครั้งที่ได้รับ shield ด้วยสกิลของ Yusuke เพิ่ม pierce rate ของ Yusuke 20.0% เป็นเวลา 1 เทิร์น"},
    ],
    awareness:[
      {name:'Inspiration',
        desc:"When taking damage from a foe's skill, 65% chance to activate a Resonance and counterattack, dealing Ice damage equal to 88% of Yusuke's Defense.\nEvolve this effect to Imagination by using a skill.",
        descTh:"เมื่อรับความเสียหายจากสกิลของศัตรู โอกาส 65% เปิดใช้ Resonance และ counterattack สร้างความเสียหายธาตุน้ำแข็ง 88% ของ DEF ของ Yusuke\nพัฒนาเป็น Imagination ได้โดยการใช้สกิล"},
      {name:'Natural Talent',
        desc:"Every 2 times Keen Eye is used, activate Imagination 1 time as a follow-up. Counterattacks activated by this effect deal 70% of the original damage.",
        descTh:"ทุกๆ การใช้ Keen Eye 2 ครั้ง เปิดใช้ Imagination 1 ครั้งเป็นการโจมตีตาม Counterattack ที่เปิดใช้จากเอฟเฟกต์นี้สร้างความเสียหาย 70% ของต้นฉบับ"},
      {name:'Both Beauty and Vice',
        desc:"When Yusuke's HP is above 70%, increase counterattack damage dealt to foes by 35%.",
        descTh:"เมื่อ HP ของ Yusuke มากกว่า 70% เพิ่มความเสียหาย counterattack ต่อศัตรู 35%"},
      {name:'A Breathtaking Sight',
        desc:"Increase the skill levels of Keen Eye and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Keen Eye และ Thief Tactics ขึ้น 3"},
      {name:'Still Life',
        desc:"Highlight Enhanced: After using a Highlight, increase counterattack damage by 30% for 3 turns.",
        descTh:"Highlight Enhanced: หลังจากใช้ Highlight เพิ่มความเสียหาย counterattack 30% เป็นเวลา 3 เทิร์น"},
      {name:'With a Single Stroke',
        desc:"Increase the skill levels of Frozen Presence and Bone-Chilling Cold by 3.",
        descTh:"เพิ่มระดับสกิล Frozen Presence และ Bone-Chilling Cold ขึ้น 3"},
      {name:'Finishing Touches',
        desc:"Evolve the effects of Inspiration and Imagination to Vision & Emotion and Creation.\nEach counterattack becomes 2 consecutive attacks, each dealing 90% of the original attack's damage. Also increase counterattack pierce rate by 30%.",
        descTh:"พัฒนาเอฟเฟกต์ Inspiration และ Imagination เป็น Vision & Emotion และ Creation\nแต่ละ counterattack กลายเป็นการโจมตีต่อเนื่อง 2 ครั้ง โดยแต่ละครั้งสร้างความเสียหาย 90% ของต้นฉบับ นอกจากนี้เพิ่ม pierce rate ของ counterattack 30%"},
    ],
    baseStats:     {hp:331, atk:72, def:71, spd:102},
    baseStatsLv80: [
      {hp:3720, atk:820, def:800, spd:102},
      {hp:3787, atk:834, def:814, spd:102},
      {hp:3854, atk:850, def:829, spd:102},
      {hp:3921, atk:864, def:843, spd:102},
      {hp:3988, atk:879, def:858, spd:102},
      {hp:4055, atk:894, def:872, spd:102},
      {hp:4122, atk:909, def:886, spd:102},
    ],
    hiddenAbility: 'DEF% +43.6%',
    weapons:[
      {
        name: 'Shadowkiller', stars:5,
        hp: 2458, atk: 542, def: 529,
        bonusStats: {def:45},
        abilityName: 'Shadowkiller',
        ability: [
          'Increase Defense by 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%.',
          'At the start of battle, increase counterattack damage by 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0%.',
          'After gaining a shield, gain 1 Blade Spirit stack. Increase counterattack damage by 2% per stack. At 6 stacks, increase counterattack damage by 30.0%/40.0%/40.0%/50.0%/50.0%/60.0%/60.0%. This effect is permanent.',],
        abilityTh: [
          'เพิ่ม DEF 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%',
          'เมื่อเริ่มต้นการต่อสู้ เพิ่มความเสียหาย counterattack 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0%',
          'หลังจากได้รับ shield รับ Blade Spirit 1 stack เพิ่มความเสียหาย counterattack 2% ต่อ stack เมื่อครบ 6 stack เพิ่มความเสียหาย counterattack 30.0%/40.0%/40.0%/50.0%/50.0%/60.0%/60.0% ถาวร',
        ],
      },
      {
        name: 'Jagato', stars:4,
        hp: 1966, atk: 434, def: 423,
        bonusStats: {def:18},
        abilityName: 'Jagato',
        ability:[
          "Increase Defense by 18.0%/18.0%/23.5%/23.5%/29.0%/29.0%/34.5%.",
          "Each time a counterattack is activated, increase Ice damage by 7.4%/9.6%/9.6%/11.8%/11.8%/14.0%/14.0% for 2 turns. Stacks up to 2 times.",
        ],
        abilityTh: [
          'เพิ่ม DEF 18.0%/18.0%/23.5%/23.5%/29.0%/29.0%/34.5%',
          'ทุกครั้งที่เปิดใช้ counterattack เพิ่มความเสียหายธาตุน้ำแข็ง 7.4%/9.6%/9.6%/11.8%/11.8%/14.0%/14.0% เป็นเวลา 2 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ],
      },
    ],
  },
  {name:'Makoto Niijima', codename:'Queen', role:'Sweeper', element:'Nuclear', rarity:5,
    cards:['Truth 4pc','Courage 2pc'], weapon:'Best Nuclear ATK weapon',
    statPrio:['ATK%','Nuclear DMG%','CRIT Rate%'], note:'Nuclear Sweeper/Medic hybrid. Crash Out boosts ATK +40% and evolves Nuclear Fury → Thermonuclear Fury. Chief Strategist scales ATK with ailment variety. Tenacity stacks from ailments on foes.',
    mechanics: "Tenacity stack สะสมจากทักษะและ ailment บนศัตรู เมื่อครบ 5 stack → Crash Out เปิด (ATK +40%, DEF +20%, Nuclear Fury เปลี่ยนเป็น Thermonuclear Fury พร้อม multi-Technical hit ต่อ ailment) Chief Strategist ให้ ATK +15% ต่อ elemental ailment unique ที่มีบนศัตรู Execution of Justice awareness เริ่มทุกการต่อสู้ด้วย 5 stack — Crash Out เปิดทันทีในเทิร์น 1",
    rotation: [
      "เทิร์น 1 → Crash Out เปิดต้นเทิร์น (Execution of Justice ให้ 5 stack ตั้งแต่เริ่มต้น)",
      "Sanctioned Drift (AoE multi-hit, ติด ailment สุ่มต่อ hit, ได้ Tenacity ต่อ ailment type)",
      "Crash Out active → Nuclear Fury พัฒนาเป็น Thermonuclear Fury (Technical hit ต่อ ailment unique)",
      "President's Prowess → บัฟ ATK ตัวเอง + ฮีล HP ally 1 คน + ได้ Tenacity 3+ stack",
      "Highlight → ติด ailment สูงสุด 4 ชนิด, ได้ Frenzied Voltage stack (+20% ต่อ stack)",
      "Maximize ailment ประเภทต่างๆ บนศัตรูเพื่อ Chief Strategist ATK scaling (+15% ต่อชนิด)",
    ],
    realName:'Makoto Niijima', persona:'Johanna',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'res',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'wk' },
    skills:[
      {name:'Sanctioned Drift', type:'Skill', element:'Nuclear', sp:20,
        desc:"Deal Nuclear damage to foes equal to 83.0%/91.5%/88.1%/96.6% of Attack (5 hits). From 2nd hit, prioritize new targets and deal 20% damage for same-target hits. Inflict a random elemental ailment on each hit's target, prioritizing ailments they don't have. If the target has an elemental ailment, activate a Technical and deal bonus Nuclear damage equal to 29.3%/29.3%/31.1%/31.1% of Attack. Inflict Radiation on the main target for 2 turns.",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 83.0%/91.5%/88.1%/96.6% ของ Attack (5 ครั้ง) ตั้งแต่ครั้งที่ 2 ให้ความสำคัญกับเป้าหมายใหม่ ดาเมจ 20% สำหรับเป้าหมายเดิม ทำให้ศัตรูที่โดนโจมตีแต่ละครั้งติดสภาวะธาตุสุ่ม (ให้ความสำคัญกับสภาวะที่ยังไม่มี) หากเป้าหมายมีสภาวะธาตุ เปิดใช้ Technical และดีลดาเมจนิวเคลียร์โบนัส 29.3%/29.3%/31.1%/31.1% ของ Attack ทำให้เป้าหมายหลักติด Radiation 2 เทิร์น"},
      {name:"President's Prowess", type:'Skill', element:'-', sp:22, isBuff:true,
        desc:"Restore 1 ally's HP equal to 52.7%/52.7%/55.9%/55.9% of Makoto's Attack + 1500/1824/1844/2168. Increase Makoto's Attack by 48.8%/53.8%/51.8%/56.8% for 2 turns. Gain 3 Tenacity stacks, and gain more Tenacity stacks for each different elemental ailment on foes.",
        descTh:"ฟื้นฟู HP พันธมิตร 1 คน 52.7%/52.7%/55.9%/55.9% ของ Attack Makoto + 1500/1824/1844/2168 เพิ่ม Attack ของ Makoto 48.8%/53.8%/51.8%/56.8% 2 เทิร์น รับ Tenacity 3 stack และรับ Tenacity เพิ่มสำหรับแต่ละสภาวะธาตุต่างชนิดบนศัตรู"},
      {name:'Nuclear Fury', type:'Skill', element:'Nuclear', sp:21,
        desc:"Deal Nuclear damage to 1 foe equal to 210.6%/232.2%/223.6%/245.1% of Attack, and gain 2 Tenacity stacks. If the target has an elemental ailment, activate a Technical and deal bonus Nuclear damage equal to 39.0%/43.0%/41.4%/45.4% of Attack. When Crash Out is active, evolve to Thermonuclear Fury: Deal Nuclear damage equal to 243.6%/268.6%/258.6%/283.5% of Attack. For each different elemental ailment the target has, activate a Technical and deal bonus Nuclear damage equal to 34.2%/37.7%/36.3%/39.8% of Attack (up to 3 hits).",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 1 ตัว 210.6%/232.2%/223.6%/245.1% ของ Attack รับ Tenacity 2 stack หากเป้าหมายมีสภาวะธาตุ เปิดใช้ Technical และดีลดาเมจนิวเคลียร์โบนัส 39.0%/43.0%/41.4%/45.4% ของ Attack เมื่อ Crash Out ใช้งานอยู่ พัฒนาเป็น Thermonuclear Fury: ดีลดาเมจนิวเคลียร์ 243.6%/268.6%/258.6%/283.5% ของ Attack ต่อสภาวะธาตุต่างชนิดบนเป้าหมาย เปิดใช้ Technical และดีลดาเมจโบนัส 34.2%/37.7%/36.3%/39.8% ของ Attack (สูงสุด 3 ครั้ง)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Nuclear', sp:0,
        desc:"Deal Nuclear damage to 1 foe equal to 468.5%/516.5%/497.3%/545.3% of Attack, gain 2 Frenzied Voltage stacks, and activate the following: Spend 1 Frenzied Voltage stack to inflict 1 random elemental ailment on foes until foes have 2 elemental ailments. Spend all remaining Frenzied Voltage stacks to increase this skill's damage by 20% per stack. [4-turn cooldown]",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 1 ตัว 468.5%/516.5%/497.3%/545.3% ของ Attack รับ Frenzied Voltage 2 stack และเปิดใช้: ใช้ Frenzied Voltage 1 stack ทำให้ศัตรูติดสภาวะธาตุสุ่ม 1 จนกว่าศัตรูจะมี 2 สภาวะ ใช้ Frenzied Voltage ที่เหลือทั้งหมดเพิ่มดาเมจสกิลนี้ 20% ต่อ stack [Cooldown: 4 เทิร์น]"},
      {name:'Chief Strategist', type:'Passive', element:'-', sp:0,
        desc:"During battle, for each different type of elemental ailment on foes, increase Attack by 15.0%.",
        descTh:"ระหว่างการต่อสู้ ต่อสภาวะธาตุต่างชนิดบนศัตรู เพิ่ม Attack 15.0%"},
      {name:'Unshakable Will', type:'Passive', element:'-', sp:0,
        desc:"At the start of battle, increase damage reduction rate by 6.0%. Whenever Crash Out is active, increase damage reduction rate by 6.0% more (up to 18.0%).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ เพิ่มอัตราลดดาเมจ 6.0% เมื่อ Crash Out ใช้งานอยู่ เพิ่มอัตราลดดาเมจอีก 6.0% (สูงสุด 18.0%)"},
    ],
    awareness:[
      {name:'Enraged Usurper',
        desc:"When attacking a foe with a skill, gain 1 Tenacity stack. If Crash Out is not active, at end of action, gain more Tenacity stacks based on elemental ailments inflicted on foes that turn. If Makoto has 5 Tenacity stacks at the start of her turn, activate Crash Out: ATK +40%, DEF +20%, Nuclear Fury evolves to Thermonuclear Fury for 2 turns. When Crash Out ends, lose all Tenacity stacks.",
        descTh:"เมื่อโจมตีศัตรูด้วยสกิล รับ Tenacity 1 stack หาก Crash Out ไม่ใช้งาน เมื่อสิ้นสุดแอ็คชัน รับ Tenacity เพิ่มตามสภาวะธาตุที่ทำให้ติดในเทิร์นนั้น หาก Makoto มี Tenacity 5 stack ต้นเทิร์น เปิดใช้ Crash Out: ATK +40%, DEF +20%, Nuclear Fury พัฒนาเป็น Thermonuclear Fury 2 เทิร์น เมื่อ Crash Out สิ้นสุด Tenacity ทั้งหมดหายไป"},
      {name:'Execution of Justice',
        desc:"At the start of battle, gain 5 Tenacity stacks, allowing Makoto to activate Crash Out. When Crash Out is active, increase Attack by 50% more and damage by 35%.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Tenacity 5 stack ทำให้ Makoto เปิดใช้ Crash Out ได้ เมื่อ Crash Out ใช้งานอยู่ เพิ่ม Attack 50% และดาเมจ 35%"},
      {name:'Hot and Cold',
        desc:"When Crash Out is active, inflict random elemental ailments on foes, and for each different type of elemental ailment, increase Makoto's pierce rate by 6%.",
        descTh:"เมื่อ Crash Out ใช้งานอยู่ ทำให้ศัตรูติดสภาวะธาตุสุ่ม และต่อสภาวะธาตุต่างชนิดบนศัตรู เพิ่มอัตรา pierce ของ Makoto 6%"},
      {name:'Full Throttle',
        desc:"Increase the skill levels of Sanctioned Drift and Nuclear Fury by 3.",
        descTh:"เพิ่มระดับสกิล Sanctioned Drift และ Nuclear Fury ขึ้น 3 ระดับ"},
      {name:'Fist of the Phantom Star',
        desc:"Highlight Enhanced: Increase maximum Frenzied Voltage stacks to 4. Inflict up to 4 elemental ailments on foes, and increase skill damage up to 4 times.",
        descTh:"Highlight เสริม: เพิ่ม Frenzied Voltage สูงสุดเป็น 4 stack ทำให้ศัตรูติดสภาวะธาตุสูงสุด 4 และเพิ่มดาเมจสกิลสูงสุด 4 ครั้ง"},
      {name:'Feel My Wrath',
        desc:"Increase the skill levels of President's Prowess and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล President's Prowess และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Fist of Justice!',
        desc:"When Crash Out is active, Makoto can gain an extra action. (Extra actions do not affect the duration of effects with turn limits.) Also decrease the SP cost of Thermonuclear Fury by 33%.",
        descTh:"เมื่อ Crash Out ใช้งานอยู่ Makoto สามารถได้รับแอ็คชันพิเศษ (แอ็คชันพิเศษไม่ส่งผลต่อระยะเวลาของเอฟเฟกต์ที่จำกัดด้วยเทิร์น) นอกจากนี้ลดค่า SP ของ Thermonuclear Fury 33%"},
    ],
    baseStats: {hp:277, atk:103, def:60, spd:96},
    baseStatsLv80: [
      {hp:3120, atk:1160, def:680, spd:0},
      {hp:3176, atk:1181, def:692, spd:0},
      {hp:3232, atk:1202, def:705, spd:0},
      {hp:3289, atk:1222, def:717, spd:0},
      {hp:3345, atk:1243, def:729, spd:0},
      {hp:3401, atk:1265, def:742, spd:0},
      {hp:3457, atk:1286, def:754, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Nuclear Finisher', stars:5,
        hp:2061, atk:766, def:449,
        bonusStats:{edm:24},
        abilityName:'Will Extinction',
        ability:[
          'Increase Nuclear damage by 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%.',
          'When attacking a foe with an elemental ailment, increase Attack by 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0%.',
          'When an ally inflicts an elemental ailment, gain 1 Heat stack.',
          'When Crash Out is active, spend all Heat stacks to increase next Nuclear skill damage by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% per stack (up to 60.0%/78.0%/78.0%/96.0%/96.0%/114.0%/114.0%).',],
        abilityTh:[
          'เพิ่มดาเมจนิวเคลียร์ 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%',
          'เมื่อโจมตีศัตรูที่มีสภาวะธาตุ เพิ่ม Attack 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0%',
          'เมื่อพันธมิตรทำให้ศัตรูติดสภาวะธาตุ รับ Heat 1 stack',
          'เมื่อ Crash Out ใช้งานอยู่ ใช้ Heat stack ทั้งหมดเพื่อเพิ่มดาเมจสกิลนิวเคลียร์ถัดไป 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% ต่อ stack (สูงสุด 60.0%/78.0%/78.0%/96.0%/96.0%/114.0%/114.0%)',
        ]},
      {name:'Omega Knuckle', stars:4,
        hp:1649, atk:613, def:359,
        bonusStats:{atk:24},
        abilityName:'Unquenchable Flame',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When dealing Nuclear damage, increase damage by 4.4%/5.6%/5.6%/6.8%/6.8%/8.0%/8.0% for each Tenacity stack gained.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อดีลดาเมจนิวเคลียร์ เพิ่มดาเมจ 4.4%/5.6%/5.6%/6.8%/6.8%/8.0%/8.0% ต่อ Tenacity stack ที่ได้รับ',
        ]},
    ],
  },
  {name:'Goro Akechi', codename:'Crow', role:'Sweeper', element:'Almighty', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best ATK/CRIT Almighty weapon (Gordian Kopis)',
    statPrio:['ATK%','CRIT Rate%','CRIT DMG%'], note:'Almighty Sweeper. Alternating Bless/Curse skills maintain both Deduction (+party DMG) and Stratagem (DEF shred) simultaneously. Mastermind records ally damage into Arrow of Truth → Almighty burst via Rain of Justice.',
    mechanics: "สลับทักษะ Bless/Curse ทุกเทิร์น รักษาทั้ง Deduction (ดาเมจปาร์ตี้ขึ้น) และ Stratagem (DEF shred ศัตรู) พร้อมกัน Detective Advice ให้รางวัลการสลับ element ด้วย ATK +25% และ CRIT DMG +30% เป็นเวลา 1 เทิร์น Mastermind กำหนด DPS ally ที่ดาเมจ AoE จะถูกบันทึกเป็น Arrow of Truth stack Rain of Justice แปลง stack ทั้งหมดเป็น Almighty burst พร้อม Arrow of Perjury follow-up",
    rotation: [
      "เทิร์น 1 → Decisive Scheme (Curse) → ได้ Stratagem (DEF down 25%+) และ Suspicion",
      "เทิร์น 2 → Flash of Intuition (Bless) → ได้ Deduction (ดาเมจปาร์ตี้ขึ้น) + Detective Advice (+ATK/CRIT DMG)",
      "สลับ Curse/Bless ทุกเทิร์น → Detective Advice proc ทุกครั้งที่สลับ → ATK/CRIT DMG สูงสุด",
      "เมื่อมี Suspicion active และ Arrow of Truth stack สะสม → Rain of Justice (Almighty AoE + Arrow of Perjury)",
      "Highlight → โจมตีทั้ง Bless และ Curse, +2 Arrow of Perjury hit 4 เทิร์น; ใช้ก่อน Rain of Justice",
      "กำหนด Mastermind (High School Detective) ให้ DPS AoE ที่มี ATK สูงสุดเพื่อ Arrow scaling สูงสุด",
    ],
    realName:'Goro Akechi', persona:'Robin Hood',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'wk', Bless:'res', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Flash of Intuition', type:'Skill', element:'Bless', sp:20,
        desc:"Deal Bless damage to all foes equal to 93.2%/102.8%/98.9%/108.5% of Attack. Restore all allies' HP by 1561/1561/1657/1657. Grant 1 Blessing stack. Gain Suspicion and Deduction for 2 turns. Deduction: party damage +19.5%/21.5%/20.7%/22.7%.",
        descTh:"ดีลดาเมจแสงต่อศัตรูทุกตัว 93.2%/102.8%/98.9%/108.5% ของ Attack ฟื้นฟู HP พันธมิตรทุกคน 1561/1561/1657/1657 มอบ Blessing 1 stack รับ Suspicion และ Deduction 2 เทิร์น Deduction: ดาเมจปาร์ตี้ +19.5%/21.5%/20.7%/22.7%"},
      {name:'Decisive Scheme', type:'Skill', element:'Curse', sp:20,
        desc:"Deal Curse damage to all foes equal to 116.5%/128.5%/123.7%/135.6% of Attack. Gain Suspicion and Stratagem for 2 turns. Stratagem: decrease all foes' Defense by 25.4%/28.0%/26.9%/29.5%, increase Arrow of Perjury's hits by 1, and increase damage by 19.5%/21.5%/20.7%/22.7%.",
        descTh:"ดีลดาเมจคำสาปต่อศัตรูทุกตัว 116.5%/128.5%/123.7%/135.6% ของ Attack รับ Suspicion และ Stratagem 2 เทิร์น Stratagem: ลด DEF ศัตรูทุกตัว 25.4%/28.0%/26.9%/29.5% เพิ่มจำนวนการโจมตีของ Arrow of Perjury 1 ครั้ง และเพิ่มดาเมจ 19.5%/21.5%/20.7%/22.7%"},
      {name:'Rain of Justice', type:'Skill', element:'Almighty', sp:24,
        desc:"Requires Suspicion. Spend all Arrow of Truth stacks, deal Almighty damage to all foes equal to 19.5%/21.5%/20.7%/22.7% of each stack's recorded damage, and lose Suspicion. Then activate Arrow of Perjury on random foes (4 hits, Almighty, 77.4%/85.3%/82.2%/90.1% per hit; 2nd hit+ prioritizes new targets, 15% damage for same target). If Akechi has Mastermind, Arrow of Truth gains 240% of Arrow of Perjury's Almighty damage.",
        descTh:"ต้องมี Suspicion ใช้ Arrow of Truth stack ทั้งหมด ดีลดาเมจอัลไมตี้ต่อศัตรูทุกตัว 19.5%/21.5%/20.7%/22.7% ของดาเมจที่บันทึกแต่ละ stack และสูญเสีย Suspicion จากนั้นเปิดใช้ Arrow of Perjury ต่อศัตรูสุ่ม (4 ครั้ง อัลไมตี้ 77.4%/85.3%/82.2%/90.1% ต่อครั้ง ครั้งที่ 2+ ให้ความสำคัญกับเป้าหมายใหม่ ดาเมจ 15% สำหรับเป้าหมายเดิม) หาก Akechi มี Mastermind Arrow of Truth ได้รับดาเมจอัลไมตี้ 240% ของ Arrow of Perjury"},
      {name:'HIGHLIGHT', type:'Skill', element:'Almighty', sp:0,
        desc:"Deal Bless damage to all foes equal to 124.1%/136.9%/131.8%/144.5% of Attack and Curse damage equal to 124.1%/136.9%/131.8%/144.5% of Attack (1 hit each). For 4 turns, increase Arrow of Perjury's number of hits by 2. [4-turn cooldown]",
        descTh:"ดีลดาเมจแสงต่อศัตรูทุกตัว 124.1%/136.9%/131.8%/144.5% ของ Attack และดาเมจคำสาป 124.1%/136.9%/131.8%/144.5% ของ Attack (1 ครั้งต่อธาตุ) เพิ่มจำนวนการโจมตีของ Arrow of Perjury 2 ครั้ง 4 เทิร์น [Cooldown: 4 เทิร์น]"},
      {name:"Rival's Pride", type:'Passive', element:'-', sp:0,
        desc:"Can activate Flames of Desire effects with all allies in the party. At the start of battle, for each Flames of Desire effect activated, increase Akechi's damage by 15.0%.",
        descTh:"เปิดใช้เอฟเฟกต์ Flames of Desire กับพันธมิตรทุกคนได้ เมื่อเริ่มต้นการต่อสู้ ต่อเอฟเฟกต์ Flames of Desire ที่เปิดใช้ เพิ่มดาเมจของ Akechi 15.0%"},
      {name:'Rending Arrow', type:'Passive', element:'-', sp:0,
        desc:"When dealing Almighty damage, for every 1% of the target's decreased Defense, increase Akechi's damage by 0.5% (up to 120.0%).",
        descTh:"เมื่อดีลดาเมจอัลไมตี้ ต่อ DEF ที่ลดลง 1% ของเป้าหมาย เพิ่มดาเมจของ Akechi 0.5% (สูงสุด 120.0%)"},
    ],
    awareness:[
      {name:'High School Detective',
        desc:"Grant Mastermind to the ally with the highest Attack (priority: Sweeper/Assassin; Akechi if none). Can manually reselect each turn (1-turn cooldown). Akechi ATK +25% of Mastermind ally's ATK (up to 500/750/1000 at Lv.1/50/70). When a non-Akechi Mastermind ally deals AoE skill/Highlight/Theurgy/Resonance damage, record average damage dealt (40% if targeting 1 foe). At start of Akechi's turn: gain 1 Arrow of Truth stack (held 2 turns). When Akechi has Mastermind, Rain of Justice changes and Arrow of Truth deals Almighty damage based on Arrow of Perjury multiplier.",
        descTh:"มอบ Mastermind ให้พันธมิตรที่มี ATK สูงสุด (ให้ความสำคัญ Sweeper/Assassin; Akechi หากไม่พบ) สามารถเลือกใหม่ด้วยตนเองทุกเทิร์น (Cooldown: 1 เทิร์น) ATK ของ Akechi +25% ของ ATK พันธมิตร Mastermind (สูงสุด 500/750/1000 ที่ Lv.1/50/70) เมื่อพันธมิตร Mastermind (ไม่ใช่ Akechi) ดีลดาเมจ AoE ด้วยสกิล/Highlight/Theurgy/Resonance บันทึกดาเมจเฉลี่ย (40% หากโจมตีเป้าหมายเดียว) ต้นเทิร์น Akechi: รับ Arrow of Truth 1 stack (คงอยู่ 2 เทิร์น) เมื่อ Akechi มี Mastermind Rain of Justice เปลี่ยนรูปแบบ Arrow of Truth ดีลดาเมจอัลไมตี้ตามตัวคูณ Arrow of Perjury"},
      {name:'Detective Profile',
        desc:"At the start of battle, gain Deduction. Deduction and Stratagem durations extended to 4 turns. When both are active: Akechi CRIT Rate +16%, Akechi and Mastermind ally damage +25%.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Deduction ระยะเวลา Deduction และ Stratagem ขยายเป็น 4 เทิร์น เมื่อทั้งคู่ใช้งานอยู่: CRIT Rate ของ Akechi +16% ดาเมจของ Akechi และพันธมิตร Mastermind +25%"},
      {name:'Detective Advice',
        desc:"When dealing skill damage with a different element than the last skill used, increase Attack of Akechi and Mastermind ally by 25%, and their CRIT DMG by 30% for 1 turn.",
        descTh:"เมื่อดีลดาเมจสกิลด้วยธาตุต่างจากสกิลก่อนหน้า เพิ่ม ATK ของ Akechi และพันธมิตร Mastermind 25% และ CRIT DMG 30% 1 เทิร์น"},
      {name:'Detective Style',
        desc:"Increase the skill levels of Rain of Justice and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Rain of Justice และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Detective Trick',
        desc:"Highlight Enhanced: Increase the damage of Arrow of Perjury by 30% more for 4 turns.",
        descTh:"Highlight เสริม: เพิ่มดาเมจของ Arrow of Perjury อีก 30% เป็นเวลา 4 เทิร์น"},
      {name:'Detective Logic',
        desc:"Increase the skill levels of Flash of Intuition and Decisive Scheme by 3.",
        descTh:"เพิ่มระดับสกิล Flash of Intuition และ Decisive Scheme ขึ้น 3 ระดับ"},
      {name:'Masked Detective',
        desc:"When using Rain of Justice, increase Arrow of Truth effect by 50%. Akechi and all allies are considered to have Mastermind (ATK increase based on ally with highest ATK). During battle, Akechi gains additional CRIT Rate equal to 40% of the Mastermind ally's CRIT Rate (up to 20%), and additional CRIT DMG equal to 40% of the highest CRIT DMG above 100% (up to 40%).",
        descTh:"เมื่อใช้ Rain of Justice เพิ่มเอฟเฟกต์ Arrow of Truth 50% Akechi และพันธมิตรทุกคนถือว่ามี Mastermind (การเพิ่ม ATK อ้างอิงพันธมิตรที่มี ATK สูงสุด) ระหว่างการต่อสู้ Akechi รับ CRIT Rate เพิ่มเติม 40% ของ CRIT Rate พันธมิตร Mastermind ที่สูงสุด (สูงสุด 20%) และ CRIT DMG เพิ่มเติม 40% ของ CRIT DMG ที่เกิน 100% สูงสุด (สูงสุด 40%)"},
    ],
    baseStats: {hp:316, atk:99, def:55, spd:95},
    baseStatsLv80: [
      {hp:3540, atk:1120, def:620, spd:0},
      {hp:3604, atk:1140, def:631, spd:0},
      {hp:3667, atk:1160, def:642, spd:0},
      {hp:3731, atk:1181, def:654, spd:0},
      {hp:3795, atk:1201, def:665, spd:0},
      {hp:3858, atk:1221, def:676, spd:0},
      {hp:3922, atk:1241, def:687, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Gordian Kopis', stars:5,
        hp:2339, atk:740, def:410,
        bonusStats:{atk:30},
        abilityName:'Divine Blessing',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When Deduction or Stratagem are active, increase party\'s Attack by 21.0%/27.3%/27.3%/33.7%/33.7%/40.0%/40.0% for 2 turns.',
          'When an ally with Mastermind activates a skill, Highlight, Theurgy, or Resonance, increase Akechi\'s critical damage by 15.0%/19.5%/19.5%/24.0%/24.0%/28.5%/28.5% for 2 turns. Stacks up to 2 times.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อ Deduction หรือ Stratagem ใช้งานอยู่ เพิ่ม Attack ปาร์ตี้ 21.0%/27.3%/27.3%/33.7%/33.7%/40.0%/40.0% 2 เทิร์น',
          'เมื่อพันธมิตรที่มี Mastermind เปิดใช้สกิล Highlight Theurgy หรือ Resonance เพิ่ม CRIT DMG ของ Akechi 15.0%/19.5%/19.5%/24.0%/24.0%/28.5%/28.5% 2 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ]},
      {name:'Victory Beam', stars:4,
        hp:1871, atk:592, def:328,
        bonusStats:{edm:10},
        abilityName:'Planar Cohesion',
        ability:[
          "Increase Almighty damage by 9.6%/9.6%/12.8%/12.8%/16.0%/16.0%/19.2%.",
          "When gaining Suspicion, increase Attack by 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0%.",
        ],
        abilityTh:[
          'เพิ่มดาเมจอัลไมตี้ 9.6%/9.6%/12.8%/12.8%/16.0%/16.0%/19.2%',
          'เมื่อรับ Suspicion เพิ่ม Attack 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0%',
        ]},
    ],
  },
  {name:'Luce', codename:'Luce', role:'Strategist', element:'Bless', rarity:4,
    cards:['Love 4pc','Opulence 2pc'], weapon:'Best ATK/ailment accuracy support weapon (Ribalta)',
    statPrio:['Ailment Accuracy%','ATK%','SPD'], note:'Bless Strategist. 4 Improv states cycle elemental ailments and grant different per-ally buffs via Improvise. Blessing stacks boost party damage. Method Acting converts ailment accuracy into ATK.',
    mechanics: "Shoki หมุนเวียน 4 Improv states (Blazing Passion, Chilling Intensity, Electrifying Performance, Tempestuous Drama) สลับได้ต้นเทิร์น ทักษะแต่ละชนิดมีโอกาส 75% ติด elemental ailment บนศัตรูทุกตัว (Burn/Freeze/Shock/Windswept) Blessing stack จาก Followspot ให้ ally +5% DMG ต่อ stack (สูงสุด 25%) Improvise มอบโบนัสเฉพาะ state ให้ ally ที่เลือก: Blazing = DoT+ailment accuracy, Chilling = Technical Precision+ATK-on-Technical, Electrifying = CRIT DMG, Tempestuous = pierce Method Acting แปลง ailment accuracy เป็น ATK (+0.72% ต่อ 1% ailment accuracy, สูงสุด +72%)",
    rotation: [
      "เทิร์น 1 → Followspot (Bless DMG + Blessing 2 stack ทุก ally + ailment ตาม Improv state)",
      "เทิร์น 2 → Improvise (บัฟ ATK ปาร์ตี้ + โบนัสเฉพาะ state ให้ DPS หลัก)",
      "สลับ Improv state ตาม DPS: Electric → Chilling (Technical); Fire/Ice → Blazing; Psy/Nuclear → Electrifying; Wind → Tempestuous",
      "สะสม Blessing ถึง 5 stack เพื่อ +25% party DMG สูงสุดก่อนเทิร์น DPS",
      "Adlib ปกป้อง ally ที่เปราะบางจาก ailment + บัฟ DEF; CD แค่ 2 เทิร์น",
      "ใช้ Highlight เมื่อพร้อม → บัฟ ATK ปาร์ตี้ + ailment resistance; ใช้ก่อนช่วง burst",
    ],
    realName:'Shoki Ikenami', persona:'Ghino',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'wk',
      Curse:'normal', Bless:'res', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Followspot', type:'Skill', element:'Bless', sp:20,
        desc:"Deal Bless damage to 1 foe equal to 151.8%/167.3%/158.0%/173.5% of Attack. Grant 2 Blessing stacks to all allies. For 2 turns, increase damage by 0.8% for every 100 points of Shoki's Attack (up to 35.1%/38.7%/36.6%/40.2%).",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 151.8%/167.3%/158.0%/173.5% ของ Attack มอบ Blessing 2 stack ให้พันธมิตรทุกคน เพิ่มดาเมจ 0.8% ต่อ Attack ทุก 100 (สูงสุด 35.1%/38.7%/36.6%/40.2%) 2 เทิร์น"},
      {name:'Adlib', type:'Skill', element:'-', sp:24, isBuff:true,
        desc:"Increase Defense of 1 ally except Shoki by 0.83% for every 100 points of Shoki's Attack (up to 36.6%/40.4%/38.1%/41.8%), and nullify Dizzy, Sleep, Confuse, and Forget for 2 turns. [2-turn cooldown]",
        descTh:"เพิ่ม DEF ของพันธมิตร 1 คน (ยกเว้น Shoki) 0.83% ต่อ Attack ทุก 100 (สูงสุด 36.6%/40.4%/38.1%/41.8%) และป้องกัน Dizzy, Sleep, Confuse, Forget 2 เทิร์น [Cooldown: 2 เทิร์น]"},
      {name:'Improvise', type:'Skill', element:'-', sp:24, isBuff:true,
        desc:"Increase party's Attack by 15% of Shoki's Attack (up to 569/627/592/650) for 2 turns. Based on current Improv state, grant the main target an additional effect:\nBlazing Passion: continuous damage +14.0%/15.4%/14.5%/16.0%, ailment accuracy +30% for 2 turns.\nChilling Intensity: Technical Precision +655/723/682/749 for 2 turns; when activating a technical, ATK +20%.\nElectrifying Performance: CRIT DMG +24.4%/26.9%/25.4%/27.9% for 2 turns.\nTempestuous Drama: pierce rate +12.0%/13.2%/12.5%/13.7% for 2 turns.",
        descTh:"เพิ่ม Attack ปาร์ตี้ 15% ของ Attack Shoki (สูงสุด 569/627/592/650) 2 เทิร์น ตาม Improv state ปัจจุบัน มอบเอฟเฟกต์พิเศษแก่เป้าหมายหลัก:\nBlazing Passion: continuous damage +14.0%/15.4%/14.5%/16.0%, ailment accuracy +30% 2 เทิร์น\nChilling Intensity: Technical Precision +655/723/682/749 2 เทิร์น; เมื่อเปิดใช้ Technical ATK +20%\nElectrifying Performance: CRIT DMG +24.4%/26.9%/25.4%/27.9% 2 เทิร์น\nTempestuous Drama: pierce rate +12.0%/13.2%/12.5%/13.7% 2 เทิร์น"},
      {name:'HIGHLIGHT', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's Attack by 6.5% of Shoki's Attack (up to 284/314/296/325), and increase ailment resistance by 82.0%/90.4%/85.3%/93.7% for 2 turns. Also, grant 1 Blessing stack. [4-turn cooldown]",
        descTh:"เพิ่ม Attack ปาร์ตี้ 6.5% ของ Attack Shoki (สูงสุด 284/314/296/325) และเพิ่ม ailment resistance 82.0%/90.4%/85.3%/93.7% 2 เทิร์น นอกจากนี้มอบ Blessing 1 stack [Cooldown: 4 เทิร์น]"},
      {name:'Supporting Role', type:'Passive', element:'-', sp:0,
        desc:"When allies gain a Blessing, increase damage by 5% for each Blessing stack (up to 25.0%).",
        descTh:"เมื่อพันธมิตรได้รับ Blessing เพิ่มดาเมจ 5% ต่อ Blessing stack (สูงสุด 25.0%)"},
      {name:'Method Acting', type:'Passive', element:'-', sp:0,
        desc:"Increase Attack by 0.72% for every 1% of Shoki's ailment accuracy (up to 72.0%).",
        descTh:"เพิ่ม Attack 0.72% ต่อ ailment accuracy 1% ของ Shoki (สูงสุด 72.0%)"},
    ],
    awareness:[
      {name:'High School Heartthrob',
        desc:"Shoki has 4 Improv states: Blazing Passion, Chilling Intensity, Electrifying Performance, and Tempestuous Drama. He can switch states at the start of each turn. When dealing skill damage, 75% chance to inflict all foes with an elemental ailment based on current state (Burn, Freeze, Shock, or Windswept).",
        descTh:"Shoki มี Improv state 4 แบบ: Blazing Passion, Chilling Intensity, Electrifying Performance และ Tempestuous Drama สามารถสลับ state ต้นเทิร์น เมื่อดีลดาเมจด้วยสกิล มีโอกาส 75% ทำให้ศัตรูทุกตัวติดสภาวะธาตุตาม state ปัจจุบัน (Burn, Freeze, Shock หรือ Windswept)"},
      {name:'In the Limelight',
        desc:"When using a skill on an ally, for each Blessing stack on the target, increase the target's damage dealt by 3% (up to 15%) for 2 turns.",
        descTh:"เมื่อใช้สกิลต่อพันธมิตร ต่อ Blessing stack บนเป้าหมาย เพิ่มดาเมจของเป้าหมาย 3% (สูงสุด 15%) 2 เทิร์น"},
      {name:'Flawless Performance',
        desc:"When using Adlib, also grant: when the target next takes skill damage, decrease their final damage taken by 35% for 1 turn.",
        descTh:"เมื่อใช้ Adlib มอบเพิ่มเติม: เมื่อเป้าหมายรับดาเมจสกิลครั้งถัดไป ลดดาเมจสุทธิที่รับ 35% 1 เทิร์น"},
      {name:'Heroic Climax',
        desc:"Increase the skill levels of Followspot and Adlib by 2.",
        descTh:"เพิ่มระดับสกิล Followspot และ Adlib ขึ้น 2 ระดับ"},
      {name:'Standing Ovation',
        desc:"Highlight Enhanced: Increase the main target's Attack by 10% for 2 turns, and grant 2 more Blessing stacks to all allies.",
        descTh:"Highlight เสริม: เพิ่ม ATK เป้าหมายหลัก 10% 2 เทิร์น และมอบ Blessing 2 stack เพิ่มเติมให้พันธมิตรทุกคน"},
      {name:'Flowers on the Stage',
        desc:"Increase the skill levels of Improvise and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Improvise และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Bright Future',
        desc:"When the additional effects of Improvise are activated based on Improv state, extend the duration of the additional effects to 4 turns.",
        descTh:"เมื่อเอฟเฟกต์พิเศษของ Improvise เปิดใช้ตาม Improv state ขยายระยะเวลาเอฟเฟกต์พิเศษเป็น 4 เทิร์น"},
    ],
    baseStats: {hp:231, atk:68, def:44, spd:104},
    baseStatsLv80: [
      {hp:2588, atk:765, def:495, spd:0},
      {hp:2617, atk:774, def:501, spd:0},
      {hp:2648, atk:783, def:507, spd:0},
      {hp:2677, atk:792, def:512, spd:0},
      {hp:2707, atk:801, def:519, spd:0},
      {hp:2737, atk:809, def:524, spd:0},
      {hp:2767, atk:818, def:530, spd:0},
    ],
    hiddenAbility: 'Ailment Accuracy +26.1%',
    weapons:[
      {name:'Ribalta', stars:5,
        hp:2279, atk:674, def:436,
        bonusStats:{atk:30},
        abilityName:'Starstruck Throne',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When using a skill on an ally, if the target has Blessing stacks, increase damage by 11.0%/14.0%/14.0%/17.0%/17.0%/20.0%/20.0% for 2 turns.',
          'Each time Followspot or Improvise is activated with a different Improv state, permanently increase Shoki\'s Attack by 14.0%/18.0%/18.0%/22.0%/22.0%/26.0%/26.0% (stacks up to 3). Allies besides Shoki gain 50% of this effect.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อใช้สกิลต่อพันธมิตร หากเป้าหมายมี Blessing stack เพิ่มดาเมจ 11.0%/14.0%/14.0%/17.0%/17.0%/20.0%/20.0% 2 เทิร์น',
          'ทุกครั้งที่ใช้ Followspot หรือ Improvise ด้วย Improv state ต่างกัน เพิ่ม Attack ของ Shoki ถาวร 14.0%/18.0%/18.0%/22.0%/22.0%/26.0%/26.0% (สะสมสูงสุด 3 ครั้ง) พันธมิตรอื่นนอกจาก Shoki ได้รับ 50% ของเอฟเฟกต์นี้',
        ]},
      {name:'Mattatóre', stars:4,
        hp:1823, atk:539, def:349,
        bonusStats:{atk:24},
        abilityName:'Fated Enthroning',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When Shoki grants Blessing stacks, increase his Attack by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% and ailment accuracy by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% for 2 turns. Stacks up to 3 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อ Shoki มอบ Blessing stack เพิ่ม Attack 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% และ ailment accuracy 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% 2 เทิร์น สะสมสูงสุด 3 ครั้ง',
        ]},
      {name:'Sipario', stars:4,
        hp:2497, atk:595, def:449,
        bonusStats:{atk:24},
        abilityName:'Innumerable Stages',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When using a skill on an ally, increase Shoki\'s ailment accuracy by 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0% and grant 60% of this effect to all allies besides Shoki for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อใช้สกิลต่อพันธมิตร เพิ่ม ailment accuracy ของ Shoki 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0% และมอบ 60% ของเอฟเฟกต์นี้ให้พันธมิตรอื่นนอกจาก Shoki 2 เทิร์น',
        ]},
    ],
  },
  {name:'Turbo', codename:'Turbo', role:'Strategist', element:'Physical', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best SPD/Physical weapon (Nebula Pennant)',
    statPrio:['SPD','ATK%','HP%'], note:'Physical Strategist. SPD-scaling buffs — every 10 SPD over 100 increases buff potency. Velocity mechanic grants extra actions.',
    mechanics: "Velocity สะสมต่อเนื่อง: 4 stack ต่อ action ของ ally (+1 ต่อทุก 10 SPD เกิน 100, สูงสุด 6/action) เมื่อ Velocity >120 สามารถใช้ stack เพื่อเกิด extra action (CD 1 เทิร์น) Torque Boost เปิดที่จุด Velocity สะสม (100/220/350) → pierce ปาร์ตี้ +5%/10%/15% Extra action ได้โบนัสพิเศษเมื่อสลับทักษะ: Shockwave ได้ +50% CRIT DMG; Aero Setup เพิ่ม shield; Power Setup ให้ pierce บนเป้าหลัก ค่าบัฟทั้งหมด (ATK, DEF, pierce, DMG) สเกลตาม SPD เกิน 100 — รักษา SPD สูงสุดเพื่อประสิทธิภาพสูงสุด",
    rotation: [
      "เทิร์น 1 → Aero Setup (ATK + DEF up ปาร์ตี้ สเกลตาม SPD; บน extra action: เพิ่ม shield ปาร์ตี้)",
      "เทิร์น 2 → Power Setup (pierce + ATK up ปาร์ตี้ สเกลตาม SPD; pierce บนเป้าหลักเมื่อ extra action)",
      "เทิร์น 3 → Shockwave (AoE Physical DMG + DMG buff ปาร์ตี้; extra action: +50% CRIT DMG, crit รับประกันบนเป้าหลัก)",
      "Extra action ที่ Velocity >120: ใช้ทักษะที่ต่างจากเทิร์นก่อนเพื่อ Tire Change bonus",
      "ใช้ Highlight → บัฟ ATK+DMG ปาร์ตี้ และกำหนดเป้าหมายสำหรับลด Down Point เพิ่ม",
      "เป้าหมาย SPD: 170+ เพื่อ Torque Boost rate สูงสุดและค่าบัฟ SPD-scaling ทั้งหมด",
    ],
    realName:'Mayumi Hashimoto', persona:'Pitys',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'wk', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Shockwave', type:'Skill', element:'Physical', sp:0,
        desc:"Deal Physical damage to all foes equal to 134.2%/148.0%/142.5%/156.2% of Attack. Also, increase party's damage by 8.8%/9.7%/9.3%/10.2% for 2 turns (for every 10 SPD, increase by 2% more, up to 35.1%/38.7%/37.3%/40.9%). On extra action: +50% skill damage and guaranteed crit on main target. [HP Cost: 8%]",
        descTh:"ดีลดาเมจกายภาพต่อศัตรูทุกตัว เท่ากับ 134.2%/148.0%/142.5%/156.2% ของ Attack เพิ่มดาเมจของปาร์ตี้ 8.8%/9.7%/9.3%/10.2% เป็นเวลา 2 เทิร์น (ทุก SPD 10 หน่วย เพิ่มเพิ่มเติม 2% สูงสุด 35.1%/38.7%/37.3%/40.9%) บนแอ็คชันพิเศษ: เพิ่มดาเมจสกิล 50% และการโจมตีต่อเป้าหมายหลักเป็น CRIT แน่นอน [ค่าใช้จ่าย HP: 8%]"},
      {name:'Aero Setup', type:'Skill', element:'-', sp:22, isBuff:true,
        desc:"Increase party's Attack by 8.8%/9.7%/9.3%/10.2% for 2 turns (for every 10 SPD, increase by 2% more, up to 35.1%/38.7%/37.3%/40.9%). Also, increase party's Defense by 9.8%/10.8%/10.4%/11.4% for 2 turns (for every 10 SPD, increase by 2.22% more, up to 39.0%/43.0%/41.4%/45.4%). On extra action: grant shield to all allies equal to 2204/2354/2294/2444 for 2 turns.",
        descTh:"เพิ่ม Attack ของปาร์ตี้ 8.8%/9.7%/9.3%/10.2% เป็นเวลา 2 เทิร์น (ทุก SPD 10 หน่วย เพิ่มเพิ่มเติม 2% สูงสุด 35.1%/38.7%/37.3%/40.9%) เพิ่ม DEF ของปาร์ตี้ 9.8%/10.8%/10.4%/11.4% เป็นเวลา 2 เทิร์น (ทุก SPD 10 หน่วย เพิ่มเพิ่มเติม 2.22% สูงสุด 39.0%/43.0%/41.4%/45.4%) บนแอ็คชันพิเศษ: ให้ shield ทุกพันธมิตร 2204/2354/2294/2444 เป็นเวลา 2 เทิร์น"},
      {name:'Power Setup', type:'Skill', element:'-', sp:25, isBuff:true,
        desc:"Increase party's pierce rate by 1.0%/1.1%/1.0%/1.1% for 2 turns (for every 10 SPD, increase by 0.22% more, up to 3.9%/4.3%/4.1%/4.5%). Also, increase party's Attack by 12.7%/14.0%/13.5%/14.8% for 2 turns (for every 10 SPD, increase by 2.89% more, up to 50.8%/56.0%/53.9%/59.1%). On extra action: also increase main target's pierce rate by 2.0%/2.2%/2.1%/2.3% for 1 turn (for every 10 SPD, up to 7.8%/8.6%/8.3%/9.1%).",
        descTh:"เพิ่ม pierce rate ของปาร์ตี้ 1.0%/1.1%/1.0%/1.1% เป็นเวลา 2 เทิร์น (ทุก SPD 10 หน่วย เพิ่มเพิ่มเติม 0.22% สูงสุด 3.9%/4.3%/4.1%/4.5%) เพิ่ม Attack ของปาร์ตี้ 12.7%/14.0%/13.5%/14.8% เป็นเวลา 2 เทิร์น (ทุก SPD 10 หน่วย สูงสุด 50.8%/56.0%/53.9%/59.1%) บนแอ็คชันพิเศษ: เพิ่ม pierce rate เป้าหมายหลัก 2.0%/2.2%/2.1%/2.3% เป็นเวลา 1 เทิร์น (สูงสุด 7.8%/8.6%/8.3%/9.1%)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Physical', sp:0,
        desc:"Increase party's Attack by 5.9%/6.5%/6.2%/6.8% for 2 turns (for every 10 SPD, up to 23.4%/25.8%/24.9%/27.3%). Also, increase party's damage by 5.9%/6.5%/6.2%/6.8% for 2 turns (same SPD scaling). When the selected ally next deals direct damage, decrease the selected foe's Down Points by 1 more. [4-turn cooldown]",
        descTh:"เพิ่ม Attack ของปาร์ตี้ 5.9%/6.5%/6.2%/6.8% เป็นเวลา 2 เทิร์น (ทุก SPD 10 หน่วย สูงสุด 23.4%/25.8%/24.9%/27.3%) เพิ่มดาเมจของปาร์ตี้ 5.9%/6.5%/6.2%/6.8% เป็นเวลา 2 เทิร์น เมื่อพันธมิตรที่เลือกโจมตีตรงครั้งต่อไป ลด Down Points ของศัตรู 1 จุดเพิ่มเติม [Cooldown: 4 เทิร์น]"},
      {name:'Team Ambassador', type:'Passive', element:'-', sp:0,
        desc:"When Mayumi is present, increase party's damage during extra actions by 45.0%.",
        descTh:"เมื่อ Mayumi อยู่ในปาร์ตี้ เพิ่มดาเมจของปาร์ตี้ระหว่างแอ็คชันพิเศษ 45.0%"},
      {name:'Overtaking', type:'Passive', element:'-', sp:0,
        desc:"When Mayumi is present, increase party's damage dealt to downed foes by 30.0%. Also, when Mayumi knocks down a foe, deal bonus Physical damage equal to 60.0% of Attack.",
        descTh:"เมื่อ Mayumi อยู่ในปาร์ตี้ เพิ่มดาเมจของปาร์ตี้ต่อศัตรูที่ถูก Down 30.0% เมื่อ Mayumi ทำศัตรู Down จะดีลดาเมจกายภาพโบนัส 60.0% ของ Attack"},
    ],
    awareness:[
      {name:'Racing Game Lover',
        desc:"At the start of battle, gain 90 Velocity stacks. At the end of each ally action, gain 4 Velocity stacks (+1 per 10 SPD over 100, up to 6). At the start of Mayumi's turn, if Velocity > 120, can spend Velocity for an extra action (CD: 1 turn). When total Velocity reaches 100/220/350, activate Torque Boost Lv1/2/3. Torque Boost: increase party's pierce rate by 5%/10%/15%.",
        descTh:"เริ่มต้นด้วย Velocity 90 stack ท้ายแอ็คชันพันธมิตรทุกครั้ง รับ Velocity 4 stack (+1 ต่อ SPD 10 หน่วยเกิน 100 สูงสุด 6) ต้นเทิร์น Mayumi หาก Velocity > 120 ใช้ Velocity เพื่อได้แอ็คชันพิเศษ (CD: 1 เทิร์น) เมื่อ Velocity รวมถึง 100/220/350 เปิดใช้ Torque Boost Lv1/2/3: เพิ่ม pierce rate ปาร์ตี้ 5%/10%/15%"},
      {name:'Tire Change',
        desc:"At the end of each ally action, gain 10 more Velocity stacks. On an extra action using a different skill from the previous: Shockwave +50% CRIT DMG; Aero Setup +30% shield and +30% DEF; Power Setup +10% pierce rate for main target.",
        descTh:"ท้ายแอ็คชันพันธมิตรทุกครั้ง รับ Velocity เพิ่ม 10 stack บนแอ็คชันพิเศษ หากใช้สกิลต่างจากครั้งก่อน: Shockwave +50% CRIT DMG; Aero Setup เพิ่ม shield 30% และ DEF 30%; Power Setup เพิ่ม pierce rate เป้าหมายหลัก 10%"},
      {name:'High-Spec Engine',
        desc:"When activating Torque Boost: Lv1 → party CRIT DMG +20%; Lv2 → party damage +20%; Lv3 → party ATK +30%.",
        descTh:"เมื่อเปิดใช้ Torque Boost: Lv1 → CRIT DMG ปาร์ตี้ +20%; Lv2 → ดาเมจปาร์ตี้ +20%; Lv3 → ATK ปาร์ตี้ +30%"},
      {name:'Output Control',
        desc:"Increase the skill levels of Power Setup and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Power Setup และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Pole Position',
        desc:"Highlight Enhanced: Increase party's damage by 10% more. Also, extend the duration of the Highlight's buffs by 1 turn.",
        descTh:"Highlight เสริม: เพิ่มดาเมจปาร์ตี้ 10% เพิ่มเติม และขยายระยะเวลา buff ของ Highlight อีก 1 เทิร์น"},
      {name:'Aerodynamic Control',
        desc:"Increase the skill levels of Shockwave and Aero Setup by 3.",
        descTh:"เพิ่มระดับสกิล Shockwave และ Aero Setup ขึ้น 3 ระดับ"},
      {name:'Circuit Queen',
        desc:"Start battle with 120 Velocity. On extra action, spend 40 or 80 Velocity for bonus effects on the next skill: (40) Shockwave: +20% Mayumi CRIT Rate, if target downed party ATK +25% for 2 turns; Aero Setup: +20% shield, extend shield by 1 turn; Power Setup: change buff target from main target to all allies. (80) Shockwave: party damage to downed foes +15% for 1 turn; Aero Setup: party damage taken -20% for 1 turn; Power Setup: party damage +25% for 1 turn.",
        descTh:"เริ่มต้นด้วย Velocity 120 stack บนแอ็คชันพิเศษ ใช้ Velocity 40 หรือ 80 stack เพื่อผลโบนัสบนสกิลถัดไป: (40) Shockwave: CRIT Rate +20% หากเป้าหมาย Down ปาร์ตี้ ATK +25% 2 เทิร์น; Aero Setup: shield +20% ขยายระยะ 1 เทิร์น; Power Setup: เปลี่ยนเป้า buff จากเป้าหมายหลักเป็นทุกคน (80) Shockwave: ดาเมจต่อ Down +15% 1 เทิร์น; Aero Setup: ลดดาเมจที่รับ 20% 1 เทิร์น; Power Setup: ดาเมจปาร์ตี้ +25% 1 เทิร์น"},
    ],
    baseStats: {hp:302, atk:93, def:55, spd:107},
    baseStatsLv80: [
      {hp:3390, atk:1050, def:620, spd:107},
      {hp:3451, atk:1069, def:631, spd:107},
      {hp:3512, atk:1088, def:642, spd:107},
      {hp:3573, atk:1107, def:654, spd:107},
      {hp:3634, atk:1126, def:665, spd:107},
      {hp:3695, atk:1144, def:676, spd:107},
      {hp:3756, atk:1164, def:687, spd:107},
    ],
    hiddenAbility: 'SPD +125.8',
    weapons:[
      {name:'Nebula Pennant', stars:5,
        hp:2240, atk:694, def:410,
        bonusStats:{spd:15},
        abilityName:'Gravity Acceleration',
        ability:[
          'Increase Speed by 15/15/20/20/25/25/30.',
          'When Speed is over 100, for every 10 points above 100, increase Attack by 12.5%/16.2%/16.2%/20.0%/20.0%/23.8%/23.8% (max 100.0%/130.0%/130.0%/160.0%/160.0%/190.0%/190.0%).',
          'After activating a skill, for every 40 total Velocity stacks, increase party\'s damage by 3.4%/4.4%/4.4%/5.4%/5.4%/6.4%/6.4% for 2 turns (max 17.0%/22.0%/22.0%/27.0%/27.0%/32.0%/32.0%).',],
        abilityTh:[
          'เพิ่ม Speed 15/15/20/20/25/25/30',
          'เมื่อ Speed เกิน 100 ทุก 10 หน่วยเกิน 100 เพิ่ม Attack 12.5%/16.2%/16.2%/20.0%/20.0%/23.8%/23.8% (สูงสุด 100.0%/130.0%/130.0%/160.0%/160.0%/190.0%/190.0%)',
          'หลังใช้สกิล ทุก Velocity 40 stack เพิ่มดาเมจปาร์ตี้ 3.4%/4.4%/4.4%/5.4%/5.4%/6.4%/6.4% เป็นเวลา 2 เทิร์น (สูงสุด 17.0%/22.0%/22.0%/27.0%/27.0%/32.0%/32.0%)',
        ]},
      {name:'Formula Pennant', stars:4,
        hp:1792, atk:555, def:328,
        bonusStats:{atk:24},
        abilityName:'Wake Effect',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When activating Torque Boost, increase damage by 18.0%/23.4%/23.4%/28.8%/28.8%/34.2%/34.2%.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อเปิดใช้ Torque Boost เพิ่มดาเมจ 18.0%/23.4%/23.4%/28.8%/28.8%/34.2%/34.2%',
        ]},
    ],
  },
  {name:'Matoi',              codename:'Matoi',          role:'Saboteur',   element:'Ice',            rarity:5, cards:['Peace 4pc','Opulence 2pc'],     weapon:'Best Ice Saboteur weapon',                      statPrio:['HP%','DEF%','SPD'],                              note:'Ice Saboteur. Provides party-wide damage mitigation and debuffs.',
    mechanics: "Extinguish stack (สูงสุด 4) สะสมทุกเทิร์นของ Natsukawa + จาก Sub-Zero Torrent Extinguishing Guidance ใช้ 2 stack; Requiem Guidance ใช้ 4 stack — ทั้งคู่ติด Damnation บนศัตรูทุกตัว (DMG taken +6% ต่อ stack, สูงสุด 4; M5 เพิ่ม cap เป็น 6) Ice Technical จากทักษะเปิด Disaster Preparedness: shield ปาร์ตี้ทั้งหมดทุกครั้ง Ailment accuracy สเกลค่า DEF down ทั้งหมดโดยตรง Cold Flames (จาก Iceburn Technical) เพิ่ม DMG taken multiplier มหาศาลบน DEF down Biting Cold awareness เพิ่มดาเมจ +27% ต่อเป้าที่ Frozen/Icebound",
    rotation: [
      "เทิร์น 1 → Sub-Zero Torrent (AoE Ice + DEF down + โอกาส 50% Freeze; ได้ Extinguish)",
      "เทิร์น 2 → Freezing Prison (Ice single-target + Technical → shield ปาร์ตี้ผ่าน Disaster Preparedness)",
      "ครบ 2+ Extinguish → Extinguishing Guidance (AoE + Damnation stack + Cold Flames)",
      "ครบ 4 Extinguish → Requiem Guidance (DEF down แรงขึ้น + Damnation มากขึ้น)",
      "สะสม Damnation ถึง 4+ stack ก่อนเทิร์น DPS เพื่อ DMG taken up สูงสุด",
      "ใช้ Highlight เพื่อ AoE damage taken up (สเกลตาม ailment accuracy) + โอกาส Technical",
    ],
    realName:'Mio Natsukawa', persona:'Minthe',
    weakRes:{ Fire:'normal', Ice:'res', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'normal', Bless:'wk', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Sub-Zero Torrent',       type:'Skill',   element:'Ice', sp:22,
        desc:"Gain 1 Extinguish stack, and deal Ice damage to all foes equal to 97.6%/107.6%/103.6%/113.6% of Attack. 50% chance to inflict Freeze.\nAlso, decrease Defense by 7.8%/8.6%/8.3%/9.1% for 3 turns (for every 5.47% of Natsukawa's ailment accuracy, decrease Defense by 1% more, up to a maximum of 31.2%/34.4%/33.2%/36.4%). When an ally attacks a foe whose Defense has been decreased by this skill, increase Technical Precision by 195/195/207/207.\nIf at least 1 foe is inflicted with Burn, remove Burn and inflict Scald on all foes (cannot be inflicted if Scald is already active).\nScald: Counts as Burn. Lasts for 3 turns. When allies attack the affected foe, increase Technical Precision by 1186/1308/1259/1381.",
        descTh:"รับ Extinguish 1 stack และสร้างความเสียหายธาตุน้ำแข็งให้ศัตรูทุกตัว เท่ากับ 97.6%/107.6%/103.6%/113.6% ของ Attack โอกาส 50% ทำให้ติด Freeze\nลด DEF ของศัตรู 7.8%/8.6%/8.3%/9.1% เป็นเวลา 3 เทิร์น (ต่อ ailment accuracy ของ Natsukawa 5.47% ลด DEF เพิ่ม 1% สูงสุด 31.2%/34.4%/33.2%/36.4%) เมื่อพันธมิตรโจมตีศัตรูที่ถูกลด DEF ด้วยสกิลนี้ เพิ่ม Technical Precision 195/195/207/207\nหากศัตรูติด Burn อย่างน้อย 1 ตัว ให้ลบ Burn และทำให้ศัตรูทุกตัวติด Scald (ไม่สามารถใช้ได้หาก Scald ทำงานอยู่แล้ว)\nScald: นับเป็น Burn คงอยู่ 3 เทิร์น เมื่อพันธมิตรโจมตีศัตรูที่ติด Scald เพิ่ม Technical Precision 1186/1308/1259/1381"},
      {name:'Freezing Prison',        type:'Skill',   element:'Ice', sp:24,
        desc:"Deal Ice damage to 1 foe equal to 195.2%/215.2%/207.2%/227.2% of Attack, and can activate an Ice Technical. When Deepfreeze is activated, 48.0%/52.9%/51.0%/55.9% chance to inflict Icebound.",
        descTh:"สร้างความเสียหายธาตุน้ำแข็งให้ศัตรู 1 ตัว เท่ากับ 195.2%/215.2%/207.2%/227.2% ของ Attack และสามารถเปิดใช้ Ice Technical เมื่อ Deepfreeze ถูกเปิดใช้ มีโอกาส 48.0%/52.9%/51.0%/55.9% ทำให้ติด Icebound"},
      {name:'Extinguishing Guidance', type:'Skill',   element:'Ice', sp:25,
        desc:"Can be used at 2 or more Extinguish stacks. Spend 2 Extinguish stacks to deal Ice damage to all foes equal to 109.8%/121.0%/116.6%/127.8% of Attack. Also, decrease Defense by 7.3%/8.1%/7.8%/8.5% for 2 turns (for every 5.83% of Natsukawa's ailment accuracy, decrease Defense by 1% more, up to a maximum of 29.3%/32.3%/31.1%/34.1%).\nAlso, can activate Ice Technical. When Iceburn is activated, this effect is guaranteed to evolve to Cold Flames.\nCold Flames: Increase damage taken by 9.8%/10.8%/10.4%/11.4% (for every 4.38% of ailment accuracy, increase damage taken by 1% more, up to a maximum of 39.0%/43.0%/41.4%/45.4%).\nAt 4 or more Extinguish stacks, evolve to Requiem Guidance: Spend 4 stacks to deal Ice damage equal to 131.8%/145.3%/139.9%/153.4% of Attack. Decrease Defense by 8.8%/9.7%/9.3%/10.2% for 2 turns (up to 35.1%/38.7%/37.3%/40.9%). Cold Flames: Increase damage taken by 11.7%/12.9%/12.4%/13.6% (up to 46.8%/51.6%/49.7%/54.5%).",
        descTh:"ใช้ได้เมื่อมี Extinguish stack 2 ขึ้นไป ใช้ 2 stack สร้างความเสียหายธาตุน้ำแข็งให้ศัตรูทุกตัว เท่ากับ 109.8%/121.0%/116.6%/127.8% ของ Attack ลด DEF ศัตรู 7.3%/8.1%/7.8%/8.5% 2 เทิร์น (ต่อ ailment accuracy 5.83% ลด DEF เพิ่ม 1% สูงสุด 29.3%/32.3%/31.1%/34.1%)\nสามารถเปิดใช้ Ice Technical เมื่อ Iceburn ถูกเปิดใช้ เอฟเฟกต์จะพัฒนาเป็น Cold Flames เสมอ\nCold Flames: เพิ่มความเสียหายที่รับ 9.8%/10.8%/10.4%/11.4% (ต่อ ailment accuracy 4.38% เพิ่มเติม 1% สูงสุด 39.0%/43.0%/41.4%/45.4%)\nเมื่อมี Extinguish stack 4 ขึ้นไป พัฒนาเป็น Requiem Guidance: ใช้ 4 stack สร้างความเสียหาย 131.8%/145.3%/139.9%/153.4% ของ Attack ลด DEF 8.8%/9.7%/9.3%/10.2% (สูงสุด 35.1%/38.7%/37.3%/40.9%) Cold Flames เพิ่มความเสียหายที่รับ 11.7%/12.9%/12.4%/13.6% (สูงสุด 46.8%/51.6%/49.7%/54.5%)"},
      {name:'HIGHLIGHT',              type:'Skill',   element:'Ice', sp:0,
        desc:"Deal Ice damage to all foes equal to 39.0%/43.0%/41.4%/45.4% of Attack, and increase their damage taken for 2 turns (for every 5.83% of Natsukawa's ailment accuracy, increase damage taken by 1% more, up to a maximum of 29.3%/32.3%/31.1%/34.1%).\nAlso, can activate Ice Technical. When Deepfreeze is activated, 32% chance to inflict Icebound. Also, increase damage taken by enemies inflicted with Freeze (for every 17.5% of ailment accuracy, increase damage taken by 1%, up to a maximum of 9.8%/10.8%/10.4%/11.4%).\nThen, deal additional Ice damage to all foes equal to 117.1%/129.1%/124.3%/136.3% of Attack.",
        descTh:"สร้างความเสียหายธาตุน้ำแข็งให้ศัตรูทุกตัว เท่ากับ 39.0%/43.0%/41.4%/45.4% ของ Attack และเพิ่มความเสียหายที่รับ 2 เทิร์น (ต่อ ailment accuracy ของ Natsukawa 5.83% เพิ่มเติม 1% สูงสุด 29.3%/32.3%/31.1%/34.1%)\nสามารถเปิดใช้ Ice Technical เมื่อ Deepfreeze ถูกเปิดใช้ โอกาส 32% ทำให้ติด Icebound เพิ่มความเสียหายที่รับของศัตรูที่ติด Freeze (ต่อ ailment accuracy 17.5% เพิ่มเติม 1% สูงสุด 9.8%/10.8%/10.4%/11.4%)\nจากนั้นสร้างความเสียหายธาตุน้ำแข็งเพิ่มเติมให้ศัตรูทุกตัว เท่ากับ 117.1%/129.1%/124.3%/136.3% ของ Attack"},
      {name:'Disaster Preparedness', type:'Passive', element:'-',    sp:0,
        desc:"Each time Natsukawa activates a Technical, grant all allies a shield that protects against 1050 damage for 2 turns.",
        descTh:"ทุกครั้งที่ Natsukawa เปิดใช้ Technical ให้ shield แก่พันธมิตรทุกคน ป้องกันความเสียหาย 1050 เป็นเวลา 2 เทิร์น"},
      {name:'Biting Cold',           type:'Passive', element:'-',    sp:0,
        desc:"When Natsukawa is present, increase damage taken of foes inflicted with Freeze by 27.0%, and increase damage taken of foes inflicted with Icebound by 27.0%.",
        descTh:"เมื่อ Natsukawa อยู่ในทีม เพิ่มความเสียหายที่ศัตรูที่ติด Freeze รับ 27.0% และเพิ่มความเสียหายที่ศัตรูที่ติด Icebound รับ 27.0%"},
    ],
    awareness:[
      {name:'Smothering Agony',
        desc:"Some skills and Highlight can activate Ice Technicals. Also, when dealing Ice damage, ignore foes' Ice resistance.\nOn Natsukawa's action, gain 1 Extinguish stack. Stacks up to 4 times. When using Extinguishing Guidance, spend Extinguish stacks, and inflict 1 Damnation stack on all foes for each stack spent.\nDamnation: Increase damage taken by 6% for 2 turns. Stacks up to 4 times.",
        descTh:"สกิลบางส่วนและ Highlight สามารถเปิดใช้ Ice Technical ได้ นอกจากนี้ เมื่อสร้างความเสียหายธาตุน้ำแข็ง ให้ข้ามการต้านธาตุน้ำแข็งของศัตรู\nในเทิร์นของ Natsukawa รับ Extinguish 1 stack สะสมสูงสุด 4 ครั้ง เมื่อใช้ Extinguishing Guidance ใช้ Extinguish stack และทำให้ศัตรูทุกตัวติด Damnation 1 stack ต่อ stack ที่ใช้\nDamnation: เพิ่มความเสียหายที่รับ 6% เป็นเวลา 2 เทิร์น สะสมสูงสุด 4 ครั้ง"},
      {name:'Cooling Spray',
        desc:"When using Sub-Zero Torrent, gain 1 more Extinguish stack. When spending Extinguish stacks, increase all foes' critical damage taken by 30% for 2 turns.",
        descTh:"เมื่อใช้ Sub-Zero Torrent รับ Extinguish เพิ่ม 1 stack เมื่อใช้ Extinguish stack เพิ่ม CRIT DMG ที่ศัตรูทุกตัวรับ 30% เป็นเวลา 2 เทิร์น"},
      {name:'Frozen Gateway',
        desc:"When spending Extinguish stacks, increase party's Attack by 20%, Defense by 30%, and damage dealt by 15% for 2 turns.",
        descTh:"เมื่อใช้ Extinguish stack เพิ่ม Attack ของปาร์ตี้ 20%, DEF 30% และความเสียหายที่สร้าง 15% เป็นเวลา 2 เทิร์น"},
      {name:'Whirlpool Cannon',
        desc:"Increase the skill levels of Extinguishing Guidance and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Extinguishing Guidance และ Thief Tactics ขึ้น 3"},
      {name:'Terrifying Chill',
        desc:"Highlight Enhanced: Extend the duration of the damage taken increase effect by 1 turn. Also, when the Highlight activates Deepfreeze, the chance to inflict Icebound becomes 44%.",
        descTh:"Highlight Enhanced: ขยายระยะเวลาเอฟเฟกต์เพิ่มความเสียหายที่รับอีก 1 เทิร์น นอกจากนี้ เมื่อ Highlight เปิดใช้ Deepfreeze โอกาสทำให้ติด Icebound กลายเป็น 44%"},
      {name:'Wellspring of Grief',
        desc:"Increase the skill levels of Sub-Zero Torrent and Freezing Prison by 3.",
        descTh:"เพิ่มระดับสกิล Sub-Zero Torrent และ Freezing Prison ขึ้น 3"},
      {name:"Firefighter's Soul",
        desc:"If foes have Burn or Scald on Natsukawa's action, activate Sub-Zero Torrent on that foe 1 time.\nAlso, when the same foe is attacked repeatedly with Extinguishing Guidance or Requiem Guidance, increase the target's damage taken by 25% more for 1 turn.\nThe maximum number of Damnation stacks becomes 6.",
        descTh:"หากศัตรูมี Burn หรือ Scald ในเทิร์นของ Natsukawa จะเปิดใช้ Sub-Zero Torrent ต่อศัตรูนั้น 1 ครั้ง\nนอกจากนี้ เมื่อโจมตีศัตรูตัวเดิมซ้ำด้วย Extinguishing Guidance หรือ Requiem Guidance เพิ่มความเสียหายที่เป้าหมายรับ 25% เป็นเวลา 1 เทิร์น\nจำนวน stack สูงสุดของ Damnation กลายเป็น 6"},
    ],
    baseStats:     {hp:316, atk:90, def:55, spd:104},
    baseStatsLv80: [
      {hp:3540, atk:1020, def:627, spd:104},
      {hp:3604, atk:1038, def:638, spd:104},
      {hp:3667, atk:1057, def:649, spd:104},
      {hp:3731, atk:1075, def:660, spd:104},
      {hp:3795, atk:1094, def:671, spd:104},
      {hp:3858, atk:1112, def:683, spd:104},
      {hp:3922, atk:1130, def:695, spd:104},
    ],
    hiddenAbility: 'Ailment Accur. +34.9%',
    weapons:[
      {
        name: 'Entropy', stars:5,
        hp: 2339, atk: 674, def: 414,
        bonusStats: {},
        abilityName: 'Conflagrations, Dauntless',
        ability: [
          'Increase ailment accuracy by 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%.',
          'During battle, for every 66.0%/68.0%/68.0%/70.0%/70.0%/72.0%/72.0% of Natsukawa\'s ailment accuracy, increase Attack.',
          'Each time an Ice Technical is activated, decrease the target\'s Defense by 23.3%/30.3%/30.3%/37.3%/37.3%/44.3%/44.3% more for 2 turns.',],
        abilityTh: [
          'เพิ่ม ailment accuracy 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%',
          'ระหว่างการต่อสู้ ต่อ ailment accuracy ของ Natsukawa 66.0%/68.0%/68.0%/70.0%/70.0%/72.0%/72.0% เพิ่ม Attack',
          'ทุกครั้งที่เปิดใช้ Ice Technical ลด DEF ของเป้าหมายเพิ่มอีก 23.3%/30.3%/30.3%/37.3%/37.3%/44.3%/44.3% เป็นเวลา 2 เทิร์น',
        ],
      },
      {
        name: 'Abyssal Thorn', stars:4,
        hp: 1871, atk: 539, def: 331,
        bonusStats: {atk:12},
        abilityName: 'Waterflowing Afterglow',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "For each Extinguish stack, increase ailment accuracy by 6.0%/7.8%/7.8%/9.6%/9.6%/11.4%/11.4%.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'ต่อ Extinguish stack เพิ่ม ailment accuracy 6.0%/7.8%/7.8%/9.6%/9.6%/11.4%/11.4%',
        ],
      },
    ],
  },
  {name:'Howler',             codename:'Howler',         role:'Saboteur',   element:'Fire',           rarity:5, cards:['Power 4pc','Strife 2pc'],       weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],     note:'Fire Saboteur with strong AoE coverage. Power 4pc amplifies team damage.',
    mechanics: "Runa มี Stance buff 2 แบบ: Big Welcome (จาก Welcome Hug AoE) และ Furrocious Follow-Up (จาก Furrious Bark ST) การใช้ Woof Woof Blaze ใช้ Stance ที่ active — Big Welcome → AoE Resonance + elemental DMG taken up; Furrocious Follow-Up → ST Resonance + Resonance DMG taken up Highlight ติด Enthusiastic Fuse บนศัตรูทุกตัว (สูงสุด 4 stack ที่ M5) — ทุก Fire/Ice/Electric/Wind/Resonance hit ของ ally ใช้ 1 stack เพื่อเพิ่มดาเมจ Peppy Guard Dog แปลง ailment accuracy เป็น ATK (อัตราส่วน 60%) ค่า DEF down ทั้งหมดสเกลตาม ailment accuracy",
    rotation: [
      "เทิร์น 1 → Welcome Hug (AoE Fire + AoE DEF down + Stance Big Welcome; โอกาส 50% Burn)",
      "เทิร์น 2 → Woof Woof Blaze [Big Welcome] (AoE Resonance + elemental + Resonance DMG taken up)",
      "เทิร์น 3 → Furrious Bark (ST Fire + ST DEF down แรง + Stance Furrocious Follow-Up)",
      "เทิร์น 4 → Woof Woof Blaze [Furrocious Follow-Up] (ST Resonance + Resonance DMG taken up มหาศาล)",
      "ใช้ Highlight เมื่อพร้อม → Enthusiastic Fuse (4 stack) = เพิ่มดาเมจทุก Fire/Resonance hit ของ ally",
      "กับ M5: เริ่มต้นด้วยทั้ง Big Welcome + Furrocious Follow-Up → เปิดด้วย Woof Woof Blaze ได้ทั้งสอง combo",
    ],
    realName:'Runa Dogenzaka', persona:'Aura',
    weakRes:{ Fire:'res', Ice:'normal', Electric:'normal', Wind:'wk', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Welcome Hug',        type:'Skill',   element:'Fire', sp:22,
        desc:"Deal Fire damage to all foes equal to 73.2%/80.7%/77.7%/85.2% of Attack.\nDecrease target's Defense by 15.4% of Runa's ailment accuracy for 2 turns (up to 26.4%/29.1%/28.0%/30.7%). Also, when the target of this effect takes Fire, Ice, Electric, or Wind skill damage, decrease Defense by 26.4%/26.4%/28.0%/28.0% more. The Defense decrease effects from this skill and Furrious Bark do not stack.\nAlso, 50% chance to inflict Burn on the target, and gain Big Welcome for 2 turns.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 73.2%/80.7%/77.7%/85.2% ของ Attack\nลด DEF ของเป้าหมาย 15.4% ของ ailment accuracy ของ Runa เป็นเวลา 2 เทิร์น (สูงสุด 26.4%/29.1%/28.0%/30.7%) และเมื่อเป้าหมายได้รับความเสียหายสกิลธาตุไฟ น้ำแข็ง ไฟฟ้า หรือลม ลด DEF เพิ่มอีก 26.4%/26.4%/28.0%/28.0% เอฟเฟกต์ลด DEF จากสกิลนี้และ Furrious Bark ไม่สะสม\nนอกจากนี้ โอกาส 50% ทำให้เป้าหมายติด Burn และรับเอฟเฟกต์ Big Welcome เป็นเวลา 2 เทิร์น"},
      {name:'Furrious Bark',      type:'Skill',   element:'Fire', sp:22,
        desc:"Deal Fire damage to 1 foe equal to 170.8%/188.3%/181.3%/198.8% of Attack.\nDecrease target's Defense by 14.6%/14.6%/15.5%/15.5% + 31.4% of Runa's ailment accuracy (up to 53.7%/59.2%/57.0%/62.5%) for 2 turns. The Defense decrease effects from this skill and Welcome Hug do not stack.\nAlso, gain Furrocious Follow-Up for 2 turns.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 170.8%/188.3%/181.3%/198.8% ของ Attack\nลด DEF ของเป้าหมาย 14.6%/14.6%/15.5%/15.5% + 31.4% ของ ailment accuracy ของ Runa (สูงสุด 53.7%/59.2%/57.0%/62.5%) เป็นเวลา 2 เทิร์น เอฟเฟกต์ลด DEF จากสกิลนี้และ Welcome Hug ไม่สะสม\nนอกจากนี้ รับเอฟเฟกต์ Furrocious Follow-Up เป็นเวลา 2 เทิร์น"},
      {name:'Woof Woof Blaze',    type:'Skill',   element:'Fire', sp:26,
        desc:"Usable when Big Welcome or Furrocious Follow-Up are active, and activates various effects based on which is active. If both effects are active at the same time, prioritize Big Welcome.\nRemove Big Welcome and Furrocious Follow-Up after effect activates.\nBig Welcome: Deal Fire damage to all foes equal to 109.8%/109.8%/116.6%/116.6% of Attack. This skill's damage is counted as a Resonance. Increase target's damage taken by 24% of Runa's ailment accuracy (up to 41.0%/45.2%/43.5%/47.7%), and Fire, Ice, Electric and Wind damage taken by 20.5%/22.6%/21.8%/23.9% for 2 turns.\nFurrocious Follow-Up: Deal Fire damage to 1 foe equal to 219.6%/219.6%/233.1%/233.1% of Attack. This skill's damage is counted as a Resonance. Increase target's damage taken by 34.3% of Runa's ailment accuracy (up to 58.6%/64.6%/62.2%/68.2%), and Resonance damage taken by 39.0%/43.0%/41.4%/45.4% for 2 turns.",
        descTh:"ใช้ได้เมื่อ Big Welcome หรือ Furrocious Follow-Up ทำงาน และเปิดใช้เอฟเฟกต์ต่างๆ ตามที่ทำงานอยู่ ถ้าทั้งสองทำงานพร้อมกัน ให้ Big Welcome มีความสำคัญก่อน\nหลังจากเอฟเฟกต์ทำงาน ลบ Big Welcome และ Furrocious Follow-Up\nBig Welcome: สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 109.8%/109.8%/116.6%/116.6% ของ Attack (นับเป็น Resonance) เพิ่มความเสียหายที่เป้าหมายรับ 24% ของ ailment accuracy ของ Runa (สูงสุด 41.0%/45.2%/43.5%/47.7%) และความเสียหายธาตุไฟ น้ำแข็ง ไฟฟ้า ลมที่รับ 20.5%/22.6%/21.8%/23.9% เป็นเวลา 2 เทิร์น\nFurrocious Follow-Up: สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 219.6%/219.6%/233.1%/233.1% ของ Attack (นับเป็น Resonance) เพิ่มความเสียหายที่เป้าหมายรับ 34.3% ของ ailment accuracy ของ Runa (สูงสุด 58.6%/64.6%/62.2%/68.2%) และความเสียหาย Resonance ที่รับ 39.0%/43.0%/41.4%/45.4% เป็นเวลา 2 เทิร์น"},
      {name:'HIGHLIGHT',          type:'Skill',   element:'Fire', sp:0,
        desc:"Deal Fire damage to all foes equal to 214.7%/236.7%/227.9%/249.9% of Attack.\nPermanently inflict 2 Enthusiastic Fuse stacks on foes. Stacks up to 2 times (remove as wave progresses).\nEnthusiastic Fuse: When any foe takes Fire, Ice, Electric, or Wind skill damage or Resonance damage, spend 1 Enthusiastic Fuse stack, and increase the damage by 22.9% of Runa's ailment accuracy (up to 53.7%/59.2%/57.0%/62.5%). If Runa's skills and Resonance activate this effect, Enthusiastic Fuse will not be spent.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 214.7%/236.7%/227.9%/249.9% ของ Attack\nทำให้ศัตรูติด Enthusiastic Fuse 2 stack ถาวร สะสมสูงสุด 2 ครั้ง (ลบเมื่อ wave เปลี่ยน)\nEnthusiastic Fuse: เมื่อศัตรูใดรับความเสียหายสกิลธาตุไฟ น้ำแข็ง ไฟฟ้า ลม หรือ Resonance ใช้ Enthusiastic Fuse 1 stack และเพิ่มความเสียหายนั้น 22.9% ของ ailment accuracy ของ Runa (สูงสุด 53.7%/59.2%/57.0%/62.5%) หากสกิลหรือ Resonance ของ Runa เปิดใช้เอฟเฟกต์นี้ Enthusiastic Fuse จะไม่ถูกใช้"},
      {name:'Peppy Guard Dog',    type:'Passive', element:'-',    sp:0,
        desc:"During battle, increase Runa's Attack by 60.0% of her ailment accuracy.",
        descTh:"ระหว่างการต่อสู้ เพิ่ม Attack ของ Runa 60.0% ของ ailment accuracy ของเธอ"},
      {name:'Faithful Dog',       type:'Passive', element:'-',    sp:0,
        desc:"When Runa inflicts a debuff on a foe with a skill, increase her Attack by 33.0% for 1 turn. When an ally deals Fire, Ice, Electric or Wind damage or Resonance damage, grant them the same Attack increase effect.",
        descTh:"เมื่อ Runa ทำให้ศัตรูติด debuff ด้วยสกิล เพิ่ม Attack ของเธอ 33.0% เป็นเวลา 1 เทิร์น เมื่อพันธมิตรสร้างความเสียหายธาตุไฟ น้ำแข็ง ไฟฟ้า ลม หรือ Resonance ให้เอฟเฟกต์เพิ่ม Attack เดียวกันนั้นแก่พวกเขาด้วย"},
    ],
    awareness:[
      {name:'Station Square Mascot',
        desc:"When Big Welcome or Furrocious Follow-Up are active, Runa can use Woof Woof Blaze. When using Woof Woof Blaze, 60% chance to decrease target's healing received by 30%/40%/50%, and Defense by 6%/12%/18% (effect changes at Lv. 1/50/70, respectively) for 2 turns.",
        descTh:"เมื่อ Big Welcome หรือ Furrocious Follow-Up ทำงาน Runa สามารถใช้ Woof Woof Blaze ได้ เมื่อใช้ Woof Woof Blaze โอกาส 60% ลดการรับการฟื้นฟูของเป้าหมาย 30%/40%/50% และ DEF 6%/12%/18% (เปลี่ยนที่ Lv. 1/50/70) เป็นเวลา 2 เทิร์น"},
      {name:'Legendary Devotion',
        desc:"After using Woof Woof Blaze and activating the effects of Big Welcome, increase target's Fire, Ice, Electric and Wind damage taken by 36% for 2 turns. When activating the effects of Furrocious Follow-Up, increase target's Resonance damage taken by 50% for 2 turns.",
        descTh:"หลังจากใช้ Woof Woof Blaze และเปิดใช้เอฟเฟกต์ Big Welcome เพิ่มความเสียหายธาตุไฟ น้ำแข็ง ไฟฟ้า ลมที่เป้าหมายรับ 36% เป็นเวลา 2 เทิร์น เมื่อเปิดใช้เอฟเฟกต์ Furrocious Follow-Up เพิ่มความเสียหาย Resonance ที่เป้าหมายรับ 50% เป็นเวลา 2 เทิร์น"},
      {name:'Trapped in Shibuya',
        desc:"When a foe has a debuff inflicted by Runa, increase target's critical damage taken by 36%, and decrease healing received by 20%.",
        descTh:"เมื่อศัตรูมี debuff ที่ Runa ทำให้ติด เพิ่ม CRIT DMG ที่เป้าหมายรับ 36% และลดการรับการฟื้นฟู 20%"},
      {name:'I ♥ Shichi-kun!',
        desc:"Increase the skill levels of Woof Woof Blaze and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Woof Woof Blaze และ Thief Tactics ขึ้น 3"},
      {name:'Welcome to Shibuya!',
        desc:"Highlight Enhanced: Increase number of Enthusiastic Fuse stacks inflicted on foes to 4, and increase the maximum number of stacks to 4.",
        descTh:"Highlight Enhanced: เพิ่มจำนวน Enthusiastic Fuse stack ที่ทำให้ศัตรูติดเป็น 4 และเพิ่มจำนวน stack สูงสุดเป็น 4"},
      {name:'I ♥ Shibuya!',
        desc:"Increase the skill levels of Welcome Hug and Furrious Bark by 3.",
        descTh:"เพิ่มระดับสกิล Welcome Hug และ Furrious Bark ขึ้น 3"},
      {name:'Station Square Superstar',
        desc:"At the start of battle, gain Big Welcome and Furrocious Follow-Up for 2 turns.\nExtend the duration of debuffs from Welcome Hug, Furrious Bark, and Woof Woof Blaze by 1 turn.\nWhen Big Welcome and Furrocious Follow-Up are both active, increase Woof Woof Blaze's Fire, Ice, Electric, and Wind damage taken effect on all foes by 30%, increase the Resonance damage taken effect on the main target by 60%, and the effects granted by Big Welcome and Furrocious Follow-Up will both activate (the damage taken increase effects do not stack, and the greater effect is applied).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Big Welcome และ Furrocious Follow-Up เป็นเวลา 2 เทิร์น\nขยายระยะเวลาของ debuff จาก Welcome Hug, Furrious Bark และ Woof Woof Blaze อีก 1 เทิร์น\nเมื่อ Big Welcome และ Furrocious Follow-Up ทำงานพร้อมกัน เพิ่มเอฟเฟกต์ความเสียหายธาตุไฟ น้ำแข็ง ไฟฟ้า ลมของ Woof Woof Blaze ต่อศัตรูทั้งหมด 30% เพิ่มเอฟเฟกต์ความเสียหาย Resonance ต่อเป้าหมายหลัก 60% และเอฟเฟกต์ทั้งจาก Big Welcome และ Furrocious Follow-Up จะเปิดใช้พร้อมกัน (เอฟเฟกต์เพิ่มความเสียหายที่รับไม่สะสม ใช้เอฟเฟกต์ที่มากกว่า)"},
    ],
    baseStats:     {hp:288, atk:94, def:58, spd:105},
    baseStatsLv80: [
      {hp:3240, atk:1060, def:653, spd:105},
      {hp:3298, atk:1079, def:665, spd:105},
      {hp:3357, atk:1098, def:677, spd:105},
      {hp:3415, atk:1118, def:689, spd:105},
      {hp:3474, atk:1136, def:701, spd:105},
      {hp:3532, atk:1155, def:713, spd:105},
      {hp:3590, atk:1174, def:724, spd:105},
    ],
    hiddenAbility: 'Ailment Accur. +34.9%',
    weapons:[
      {
        name: 'Cerberus Claws', stars:5,
        hp: 2141, atk: 700, def: 432,
        bonusStats: {},
        abilityName: 'Cerberus Claws',
        ability: [
          'Increase ailment accuracy by 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%.',
          'When an ally uses a Fire, Ice, Electric or Wind skill or activates a Resonance, increase Runa\'s ailment accuracy by 23.0%/28.0%/28.0%/33.0%/33.0%/38.0%/38.0% for 2 turns. This effect does not stack.',
          'When using Woof Woof Blaze and activating the effect of Big Welcome, decrease the target\'s Defense by 16.6%/21.6%/21.6%/26.6%/26.6%/31.6%/31.6% more for 3 turns.',
          'When the effect of Furrocious Follow-Up is activated, decrease the target\'s Defense by 33.3%/43.3%/43.3%/53.3%/53.3%/63.3%/63.3% more for 3 turns. These 2 debuffs do not stack.',],
        abilityTh: [
          'เพิ่ม ailment accuracy 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%',
          'เมื่อพันธมิตรใช้สกิลธาตุไฟ น้ำแข็ง ไฟฟ้า หรือลม หรือเปิดใช้ Resonance เพิ่ม ailment accuracy ของ Runa 23.0%/28.0%/28.0%/33.0%/33.0%/38.0%/38.0% เป็นเวลา 2 เทิร์น เอฟเฟกต์นี้ไม่สะสม',
          'เมื่อใช้ Woof Woof Blaze และเปิดใช้เอฟเฟกต์ Big Welcome ลด DEF ของเป้าหมายเพิ่มอีก 16.6%/21.6%/21.6%/26.6%/26.6%/31.6%/31.6% เป็นเวลา 3 เทิร์น',
          'เมื่อเปิดใช้เอฟเฟกต์ Furrocious Follow-Up ลด DEF ของเป้าหมายเพิ่มอีก 33.3%/43.3%/43.3%/53.3%/53.3%/63.3%/63.3% เป็นเวลา 3 เทิร์น debuff ทั้ง 2 ไม่สะสม',
        ],
      },
      {
        name: 'Hunting Hound Claws', stars:4,
        hp: 1712, atk: 560, def: 346,
        bonusStats: {atk: 12},
        abilityName: 'Hunting Hound Claws',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When Big Welcome or Furrocious Follow-Up is active, increase Runa\'s ailment accuracy by 22.0%/28.5%/28.5%/35.0%/35.0%/41.5%/41.5%.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อ Big Welcome หรือ Furrocious Follow-Up ทำงาน เพิ่ม ailment accuracy ของ Runa 22.0%/28.5%/28.5%/35.0%/35.0%/41.5%/41.5%',
        ],
      },
    ],
  },
  {name:'J&C', codename:'J&C', role:'Virtuoso', element:'Almighty', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best ATK/CRIT weapon (Warden\'s Judgement)',
    statPrio:['ATK%','CRIT DMG%','CRIT Rate%'], note:'Dual-Persona Virtuoso. Select 2 of 4 Mask pairs before battle to define role and Facade combinations. Desire Level (scales with ATK/DMG Mult/CRIT DMG) amplifies all skill multipliers. Two Masks as One spends both Facades for powerful combo effects.',
    mechanics: "ก่อนต่อสู้ เลือก Mask pair 2 จาก 4 คู่ (Mischief & Innocence, Service & Admonition, Absurdity & Nonsense, Luck & Loss) เพื่อกำหนดบทบาทและ Facade type ของ J&C ทุกการใช้ทักษะให้ Facade type นั้น และการได้ Facade เปิดบัฟปาร์ตี้ เมื่อมี Facade 2 ประเภทต่างกัน Two Masks as One จะยิงอัตโนมัติ (ต้นเทิร์น) พร้อมผลรวมพิเศษของคู่นั้น Desire Level สเกลตัวคูณทักษะทั้งหมด (+1 DL ต่อ 100 ATK, +1 ต่อ 2% DMG Mult, +1 ต่อ 6% CRIT DMG ที่เกิน 100%) M5 ให้ True Desire — ใช้ต้นเทิร์นเพื่อยิง Facade combo ทั้ง 6 พร้อมกัน",
    rotation: [
      "ก่อนต่อสู้: เลือก 2 Masks ตามต้องการของปาร์ตี้ (M+A สำหรับ DPS support; S+A สำหรับ shield+DEF; A+L สำหรับ Sweeper)",
      "เทิร์น 1 → ทักษะ 1 (ได้ Facade 1 + บัฟปาร์ตี้ตาม Mask type)",
      "เทิร์น 2 → ทักษะ 2 (ได้ Facade 2; Two Masks as One ยิงอัตโนมัติ → combo effect)",
      "วงจรทำซ้ำทุก 2 เทิร์น; Highlight ชาร์จเร็ว — ยิงเพื่อ ATK+DMG+บัฟปาร์ตี้",
      "กับ M5: เมื่อ True Desire พร้อม ต้นเทิร์น → Facade combo ทั้ง 6 ยิงพร้อมกัน burst มหาศาล",
      "Maximize ATK, DMG Mult และ CRIT DMG เพื่อเพิ่ม Desire Level → สเกลตัวคูณทักษะทั้งหมด",
    ],
    realName:'Justine & Caroline', persona:'Multiple Personas',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Mask of Mischief & Innocence', type:'Skill', element:'Fire', sp:20,
        desc:"[Selectable as Skill 1 or 2] Deal Fire + Ice damage to 1 foe equal to 74.5%/82.1%/79.0%/86.7% of Attack each (+1% per Desire Level). Increase party's Attack by 39.0%/43.0%/41.4%/45.4% per 100 Desire Level for 3 turns. Gain Facade of Mischief & Innocence.",
        descTh:"[เลือกเป็นสกิล 1 หรือ 2 ได้] ดีลดาเมจไฟ + น้ำแข็งต่อศัตรู 1 ตัว 74.5%/82.1%/79.0%/86.7% ของ Attack ต่อธาตุ (+1% ต่อ Desire Level) เพิ่ม ATK ปาร์ตี้ 39.0%/43.0%/41.4%/45.4% ต่อ Desire Level 100 3 เทิร์น รับ Facade of Mischief & Innocence"},
      {name:'Mask of Service & Admonition', type:'Skill', element:'Electric', sp:20, isBuff:true,
        desc:"[Selectable as Skill 1 or 2] Deal Electric + Wind damage to 1 foe equal to 74.5%/82.1%/79.0%/86.7% of Attack each (+1% per Desire Level). Decrease party's damage taken by 9.8%/10.8%/10.4%/11.4% (+same per 100 Desire Level) for 3 turns. Restore party's HP by 34.7%/38.3%/36.9%/40.4% of Attack + 2225/2934/2735/3480. Gain Facade of Service & Admonition.",
        descTh:"[เลือกเป็นสกิล 1 หรือ 2 ได้] ดีลดาเมจไฟฟ้า + ลมต่อศัตรู 1 ตัว 74.5%/82.1%/79.0%/86.7% ของ Attack ต่อธาตุ (+1% ต่อ Desire Level) ลดดาเมจที่รับของปาร์ตี้ 9.8%/10.8%/10.4%/11.4% (+เท่ากันต่อ Desire Level 100) 3 เทิร์น ฟื้นฟู HP ปาร์ตี้ 34.7%/38.3%/36.9%/40.4% ของ Attack + 2225/2934/2735/3480 รับ Facade of Service & Admonition"},
      {name:'Mask of Absurdity & Nonsense', type:'Skill', element:'Psychokinesis', sp:20,
        desc:"[Selectable as Skill 1 or 2] Deal Psy + Nuclear damage to 1 foe equal to 74.5%/82.1%/79.0%/86.7% of Attack each (+1% per Desire Level). Increase pierce rate for J&C and highest-ATK Sweeper/Assassin by 4.9%/5.4%/5.2%/5.7% (+same per 100 Desire Level) for 3 turns. Gain Facade of Absurdity & Nonsense.",
        descTh:"[เลือกเป็นสกิล 1 หรือ 2 ได้] ดีลดาเมจพลังจิต + นิวเคลียร์ต่อศัตรู 1 ตัว 74.5%/82.1%/79.0%/86.7% ของ Attack ต่อธาตุ (+1% ต่อ Desire Level) เพิ่ม pierce rate ของ J&C และ Sweeper/Assassin ATK สูงสุด 4.9%/5.4%/5.2%/5.7% (+เท่ากันต่อ Desire Level 100) 3 เทิร์น รับ Facade of Absurdity & Nonsense"},
      {name:'Mask of Luck & Loss', type:'Skill', element:'Bless', sp:20,
        desc:"[Selectable as Skill 1 or 2] Deal Bless + Curse damage to 1 foe equal to 74.5%/82.1%/79.0%/86.7% of Attack each (+1% per Desire Level). Increase J&C's ATK by 14.6%/16.1%/15.5%/17.0% (+same per 100 DL), damage by 9.8%/10.8%/10.4%/11.4% (+same per 100 DL), CRIT Rate by 4.9%/5.4%/5.2%/5.7% (+same per 100 DL) for 3 turns. Gain Facade of Luck & Loss.",
        descTh:"[เลือกเป็นสกิล 1 หรือ 2 ได้] ดีลดาเมจแสง + คำสาปต่อศัตรู 1 ตัว 74.5%/82.1%/79.0%/86.7% ของ Attack ต่อธาตุ (+1% ต่อ Desire Level) เพิ่ม ATK J&C 14.6%/16.1%/15.5%/17.0% (+เท่ากันต่อ DL 100) ดาเมจ 9.8%/10.8%/10.4%/11.4% (+เท่ากัน) CRIT Rate 4.9%/5.4%/5.2%/5.7% (+เท่ากัน) 3 เทิร์น รับ Facade of Luck & Loss"},
      {name:'Two Masks as One', type:'Skill', element:'Almighty', sp:25,
        desc:"Requires 2 Facade types. Deal Almighty damage to 1 foe equal to 126.9%/139.9%/134.7%/147.7% of Attack (+1% per DL). Spend both Facades for combo effects:\nM+S: Party HP heal 52.2%/57.6%/55.4%/60.8% ATK + 3344/4409/4111/5230; party DMG +43.9%/48.4%/46.6%/51.1% per 100 DL for 2T.\nM+A: Allies Skill Amplification 14.6%/16.1%/15.5%/17.0% for 2T; party CRIT DMG +19.5%/21.5%/20.7%/22.7% per 100 DL.\nM+L: Target changes to all foes.\nS+A: Party shield 41.8%/46.1%/44.3%/48.6% ATK + 2675/3527/3289/4184 + 1 Down Point 2T; party DEF +48.8%/53.8%/51.8%/56.8% per 100 DL.\nS+L: Inflict Shock/Windswept/2 Curse on target, gain 2 Blessing (2T); all foes DEF -25.4%/28.0%/26.9%/29.5% (+same per 100 DL) 2T.\nA+L: +1 Almighty hit; gain Rebel Surveillance 2T (use skill: temporarily copy 4.9%/5.4%/5.2%/5.7% of highest-ATK Sweeper/Assassin's stats).",
        descTh:"ต้องมี Facade 2 ชนิด ดีลดาเมจอัลไมตี้ต่อศัตรู 1 ตัว 126.9%/139.9%/134.7%/147.7% ของ Attack (+1% ต่อ DL) ใช้ Facade ทั้งคู่เพื่อคอมโบ:\nM+S: ฮีล HP ปาร์ตี้ 52.2%/57.6% ATK + 3344/4409; ดาเมจปาร์ตี้ +43.9%/48.4% ต่อ DL 100 2T\nM+A: Skill Amplification 14.6%/16.1% 2T; CRIT DMG ปาร์ตี้ +19.5%/21.5% ต่อ DL 100\nM+L: เปลี่ยนเป้าหมายเป็นศัตรูทุกตัว\nS+A: Shield ปาร์ตี้ 41.8%/46.1% ATK + 2675/3527 + 1 Down Point 2T; DEF ปาร์ตี้ +48.8%/53.8% ต่อ DL 100\nS+L: ทำให้ติด Shock/Windswept/Curse 2 stack รับ Blessing 2; ศัตรู DEF -25.4% (+เท่ากัน ต่อ DL 100) 2T\nA+L: +1 hit; รับ Rebel Surveillance 2T (ใช้สกิล: copy stats Sweeper/Assassin ATK สูงสุด 4.9%/5.4%)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Almighty', sp:0,
        desc:"Choose 1 of the 2 selected Masks to activate its Highlight (each has independent 4-turn cooldown):\nMischief & Innocence: Party ATK +24.4%/26.9%/25.9%/28.4% and DMG +34.2%/37.7%/36.3%/39.8% for 2T.\nService & Admonition: Party HP heal 43.4%/47.9%/46.1%/50.6% ATK + 2782/3667/3419/4350; party max HP +9.8%/10.8%/10.4%/11.4% for 2T.\nAbsurdity & Nonsense: Psy + Nuclear damage to 1 foe 244.0%/269.0%/259.0%/284.0% ATK each (can CRIT); ATK +34.2%/37.7%/36.3%/39.8% for J&C and highest-ATK ally.\nLuck & Loss: Bless + Curse damage to all foes 122.0%/134.5%/129.5%/142.0% ATK each (can CRIT); J&C ATK +29.3%/32.3%/31.1%/34.1% and CRIT DMG +19.5%/21.5%/20.7%/22.7% for 2T.",
        descTh:"เลือก 1 ใน 2 Mask ที่เลือกไว้เพื่อเปิดใช้ Highlight (แต่ละอันมี Cooldown 4 เทิร์นอิสระ):\nMischief & Innocence: ATK ปาร์ตี้ +24.4%/26.9% และ DMG +34.2%/37.7% 2T\nService & Admonition: ฮีล HP ปาร์ตี้ 43.4%/47.9% ATK + 2782/3667; HP สูงสุดปาร์ตี้ +9.8%/10.8% 2T\nAbsurdity & Nonsense: ดาเมจพลังจิต + นิวเคลียร์ต่อศัตรู 1 ตัว 244.0%/269.0% ATK ต่อธาตุ (CRIT ได้); ATK +34.2%/37.7% ให้ J&C และพันธมิตร ATK สูงสุด\nLuck & Loss: ดาเมจแสง + คำสาปต่อศัตรูทุกตัว 122.0%/134.5% ATK ต่อธาตุ (CRIT ได้); ATK J&C +29.3%/32.3% และ CRIT DMG +19.5%/21.5% 2T"},
      {name:'Overseer of Rehabilitation', type:'Passive', element:'-', sp:0,
        desc:"At the start of battle, increase Desire Level based on J&C's base stats: +1 DL per 100 ATK (up to 45), +1 DL per 2% Damage Mult (up to 15), +1 DL per 6% CRIT DMG above 100% (up to 15).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ เพิ่ม Desire Level ตามสถิติของ J&C: +1 DL ต่อ ATK 100 (สูงสุด 45), +1 DL ต่อ Damage Mult 2% (สูงสุด 15), +1 DL ต่อ CRIT DMG ที่เกิน 100% ทุก 6% (สูงสุด 15)"},
      {name:'Oxymoron', type:'Passive', element:'-', sp:0,
        desc:"Stat bonuses by Persona pair: M+S: Healing +21%, party DMG +24% while on field. M+A: SPD +5, party ATK +30% while on field. M+L: CRIT Rate +15%. S+A: Shield +21%. S+L: SPD +5, all foes DMG taken +24% while on field. A+L: CRIT DMG +30%.",
        descTh:"โบนัสสถิติตามคู่ Persona: M+S: Healing +21%, ดาเมจปาร์ตี้ +24% ขณะอยู่ในสนาม M+A: SPD +5, ATK ปาร์ตี้ +30% ขณะอยู่ในสนาม M+L: CRIT Rate +15% S+A: Shield +21% S+L: SPD +5, ดาเมจที่รับของศัตรู +24% ขณะอยู่ในสนาม A+L: CRIT DMG +30%"},
    ],
    awareness:[
      {name:'Twin Wardens',
        desc:"Obtaining J&C increases Wonder's skill and Thief Tactics levels by 1 (even when not in battle). Before battle, select 2 of 4 Mask pairs; Skill 1 and Skill 2 change accordingly. Role effect by pair: M+S=Medic, M+A=Strategist, M+L=Sweeper, S+A=Guardian, S+L=Saboteur, A+L=Assassin. Skill effects scale with Desire Level. At battle start, Desire Level +25.",
        descTh:"การได้รับ J&C เพิ่มระดับสกิลและ Thief Tactics ของ Wonder 1 (แม้ไม่ได้อยู่ในทีม) ก่อนต่อสู้ เลือก Mask 2 ใน 4 คู่; สกิล 1 และ 2 เปลี่ยนตามนั้น บทบาทตามคู่: M+S=Medic, M+A=Strategist, M+L=Sweeper, S+A=Guardian, S+L=Saboteur, A+L=Assassin เอฟเฟกต์สกิลขึ้นกับ Desire Level เมื่อเริ่มต้นการต่อสู้ Desire Level +25"},
      {name:'Strict Tolerance',
        desc:"At battle start, gain 2 Facades based on selected Personas. At start of J&C's turn or end of their action, if they have 2 Facade types, automatically activate Two Masks as One on a random target (prioritizing the previous skill's target).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Facade 2 ชนิดตาม Persona ที่เลือก ต้นเทิร์น J&C หรือสิ้นสุดแอ็คชัน หากมี Facade 2 ชนิด เปิดใช้ Two Masks as One อัตโนมัติต่อเป้าหมายสุ่ม (ให้ความสำคัญกับเป้าหมายจากสกิลก่อนหน้า)"},
      {name:'Callous Kindness',
        desc:"When a Facade is gained, activate a buff based on type: Mischief & Innocence: party ATK +30% 2T. Service & Admonition: party DMG taken -20% 2T. Absurdity & Nonsense: highest-ATK Assassin/Sweeper CRIT DMG +20% 2T. Luck & Loss: J&C skill damage +10% 2T.",
        descTh:"เมื่อรับ Facade เปิดใช้ buff ตามชนิด: Mischief & Innocence: ATK ปาร์ตี้ +30% 2T Service & Admonition: ดาเมจที่รับปาร์ตี้ -20% 2T Absurdity & Nonsense: CRIT DMG Assassin/Sweeper ATK สูงสุด +20% 2T Luck & Loss: ดาเมจสกิล J&C +10% 2T"},
      {name:'Punitive Mercy',
        desc:"Increase the skill levels of Selected Skill 1 and Two Masks as One by 3.",
        descTh:"เพิ่มระดับสกิลที่เลือกเป็นสกิล 1 และ Two Masks as One ขึ้น 3 ระดับ"},
      {name:'Execution of Rebirth',
        desc:"When J&C activate their Highlight, increase their ATK by 40%, damage dealt by 20%, and grant 50% of these effects to other allies for 2 turns.",
        descTh:"เมื่อ J&C เปิดใช้ Highlight เพิ่ม ATK 40%, ดาเมจ 20% และมอบ 50% ของเอฟเฟกต์เหล่านี้ให้พันธมิตรอื่น 2 เทิร์น"},
      {name:'Humane Prison',
        desc:"Increase the skill levels of Selected Skill 2 and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิลที่เลือกเป็นสกิล 2 และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Power to Resist Ruin',
        desc:"Wonder's skill and Thief Tactics levels increase by 1 more. Desire Level +20%. At battle start, gain True Desire (regained every 8 actions after spending). At start of J&C's turn, spend 1 True Desire to enhance the next Two Masks as One: activate ALL 6 Facade combos simultaneously + deal 8 hits of bonus Almighty damage to main target (40% ATK each, 1 hit per element; +1% per DL).",
        descTh:"เพิ่มระดับสกิลและ Thief Tactics ของ Wonder อีก 1 Desire Level +20% เมื่อเริ่มต้นการต่อสู้ รับ True Desire (ได้รับคืนทุก 8 แอ็คชันหลังใช้) ต้นเทิร์น J&C ใช้ True Desire 1 stack เพื่อเพิ่มพลัง Two Masks as One ถัดไป: เปิดใช้คอมโบ Facade ทั้ง 6 แบบพร้อมกัน + ดีลดาเมจโบนัสอัลไมตี้ต่อเป้าหมายหลัก 8 ครั้ง (40% ATK ต่อครั้ง 1 ครั้งต่อธาตุ; +1% ต่อ DL)"},
    ],
    baseStats: {hp:417, atk:113, def:77, spd:104},
    baseStatsLv80: [
      {hp:3600, atk:1000, def:667, spd:0},
      {hp:3665, atk:1018, def:679, spd:0},
      {hp:3730, atk:1036, def:691, spd:0},
      {hp:3794, atk:1054, def:703, spd:0},
      {hp:3859, atk:1072, def:715, spd:0},
      {hp:3924, atk:1090, def:727, spd:0},
      {hp:3989, atk:1108, def:739, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:"Warden's Judgement", stars:5,
        hp:2378, atk:661, def:440,
        bonusStats:{atk:30},
        abilityName:"Warden's Judgement",
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When Two Masks as One is activated, increase Desire Level by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0%.',
          'When a Facade is gained, increase party\'s critical damage and damage dealt by 13.0%/17.0%/17.0%/21.0%/21.0%/25.0%/25.0% for 2 turns. Stacks up to 2 times.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อเปิดใช้ Two Masks as One เพิ่ม Desire Level 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0%',
          'เมื่อรับ Facade เพิ่ม CRIT DMG และดาเมจของปาร์ตี้ 13.0%/17.0%/17.0%/21.0%/21.0%/25.0%/25.0% 2 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ]},
      {name:'Deliverance of Strength', stars:4,
        hp:1903, atk:529, def:352,
        bonusStats:{atk:24},
        abilityName:'Deliverance of Strength',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When Two Masks as One is activated, increase Attack by 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0% for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อเปิดใช้ Two Masks as One เพิ่ม Attack 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0% 2 เทิร์น',
        ]},
    ],
  },
  {name:'Noir', codename:'Noir', role:'Sweeper', element:'Psychokinesis', rarity:5,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:'Best Ailment/Psy weapon (Last Quarter)',
    statPrio:['ATK%','CRIT DMG%','CRIT Rate%'], note:'Psychokinesis Sweeper. Thoughtful Round stack system — each skill grants a unique round type that powers up the next ranged attack. Ailment accuracy scales ATK and CRIT DMG.',
    mechanics: "ทุกทักษะมอบ Thoughtful Round ประเภทต่างกัน (Focused/Painpoint/Spillover/Overload) หลังใช้ทักษะ Haru ยิงโจมตีระยะไกลที่ใช้ Round ทั้งหมด — แต่ละ Round เพิ่มดาเมจ +20%/40%/50%, ATK +25% เมื่อมี 2+ Round; เมื่อมี 2+ Round กลายเป็น Resonating Shots (ยิง effect ทุก Round พร้อมกัน +70% extra) Target Audience เป็น debuff จาก Extrasensory Aim; เมื่อ Haru ถือมัน ทักษะได้ CRIT Rate หรือ pierce rate โบนัส Ailment accuracy แปลงเป็น ATK (+1% ต่อ 1.45%) และ CRIT DMG (+20% ต่อ 50% accuracy) ผ่าน Heiress's Leadership",
    rotation: [
      "เทิร์น 1 → Extrasensory Aim (AoE Psy + Target Audience ทุกศัตรู; ส่งถึง Haru + Focused Round)",
      "เทิร์น 2 → Mindful Release (AoE Psy + Spillover Round; กับ Target Audience: +CRIT Rate)",
      "เทิร์น 3 → Precise Volley (ST แรง + Painpoint Round; กับ Target Audience: +pierce rate)",
      "หลังใช้ Round ครบ 3 ประเภท → Resonating Shots ยิงทุก Round พร้อมกัน +70% bonus; burst มหาศาล",
      "ใช้ Highlight สำหรับ Overload Round (+CRIT Rate ระยะไกล); เมื่อครบ cap ข้าม Overload → +flat DMG แทน",
      "สะสม ailment accuracy เพื่อ dual scaling: แปลงเป็น ATK และ CRIT DMG ผ่าน passive",
    ],
    realName:'Haru Okumura', persona:'Milady',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'wk',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'res' },
    skills:[
      {name:'Extrasensory Aim', type:'Skill', element:'Psychokinesis', sp:26,
        desc:"Deal Psychokinesis damage to all foes equal to 75.8%/83.6%/80.5%/88.3% of Attack (2 hits). Inflict Target Audience on main target (97.6%/97.6%/103.6%/103.6% chance) and others (53.7%/53.7%/57.0%/57.0% chance). Transfer Target Audience from foes to Haru for 3 turns. Gain 1 Focused Round: ranged attacks with Target Audience deal +29.3%/32.3%/31.1%/34.1% damage; removes all Target Audience after.",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูทุกตัว 75.8%/83.6%/80.5%/88.3% ของ Attack (2 ครั้ง) ทำให้เป้าหมายหลักติด Target Audience (97.6%/97.6%/103.6%/103.6%) และศัตรูอื่น (53.7%/53.7%/57.0%/57.0%) โอนย้าย Target Audience จากศัตรูมายัง Haru 3 เทิร์น รับ Focused Round 1 stack: โจมตีระยะไกลเมื่อมี Target Audience +29.3%/32.3%/31.1%/34.1% หลังโจมตี ลบ Target Audience ทั้งหมด"},
      {name:'Precise Volley', type:'Skill', element:'Physical', sp:0,
        desc:"Deal Gun damage to 1 foe equal to 151.6%/167.1%/160.9%/176.4% of Attack. When Haru has Target Audience, pierce rate +19.5%/19.5%/20.7%/20.7% and gain 1 Painpoint Round. Painpoint Round: ranged attacks also deal Psy damage equal to 39.0%/43.0%/41.4%/45.4% of Attack. [HP Cost: 12%]",
        descTh:"ดีลดาเมจปืนต่อศัตรู 1 ตัว 151.6%/167.1%/160.9%/176.4% ของ Attack เมื่อ Haru มี Target Audience เพิ่ม pierce rate 19.5%/19.5%/20.7%/20.7% และรับ Painpoint Round 1 stack Painpoint Round: โจมตีระยะไกลยังดีลดาเมจพลังจิต 39.0%/43.0%/41.4%/45.4% ของ Attack [ค่าใช้จ่าย HP: 12%]"},
      {name:'Mindful Release', type:'Skill', element:'Psychokinesis', sp:26,
        desc:"Deal Psychokinesis damage to all foes equal to 142.1%/156.7%/150.8%/165.4% of Attack. When has Target Audience, CRIT Rate +19.5%/19.5%/20.7%/20.7% and gain 1 Spillover Round. Spillover Round: ranged attacks also deal Psy damage to all foes equal to 29.3%/32.3%/31.1%/34.1% of Attack.",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูทุกตัว 142.1%/156.7%/150.8%/165.4% ของ Attack เมื่อมี Target Audience CRIT Rate +19.5%/19.5%/20.7%/20.7% และรับ Spillover Round 1 stack Spillover Round: โจมตีระยะไกลยังดีลดาเมจพลังจิตต่อศัตรูทุกตัว 29.3%/32.3%/31.1%/34.1% ของ Attack"},
      {name:'HIGHLIGHT', type:'Skill', element:'Psychokinesis', sp:0,
        desc:"Deal Psychokinesis damage to all foes equal to 206.9%/228.1%/219.6%/240.8% of Attack. Gain 1 Overload Round if no current stacks and below max Thoughtful Round. Overload Round: ranged attack CRIT Rate +14.6%/14.6%/15.5%/15.5%. If no Overload Round gained, this skill's damage +14.6%/16.1%/15.5%/17.0%. [4-turn cooldown]",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูทุกตัว 206.9%/228.1%/219.6%/240.8% ของ Attack รับ Overload Round 1 stack หากไม่มี stack อยู่และ Thoughtful Round ยังไม่เต็ม Overload Round: CRIT Rate ของการโจมตีระยะไกล +14.6%/14.6%/15.5%/15.5% หากไม่ได้รับ Overload Round ดาเมจสกิลนี้ +14.6%/16.1%/15.5%/17.0% [Cooldown: 4 เทิร์น]"},
      {name:"Heiress's Leadership", type:'Passive', element:'-', sp:0,
        desc:"ATK +1% per 1.45% ailment accuracy (up to +165% ATK). CRIT DMG +20% per 50% ailment accuracy (up to 3 stacks).",
        descTh:"ATK +1% ต่อ ailment accuracy 1.45% (สูงสุด +165% ATK) CRIT DMG +20% ต่อ ailment accuracy 50% (สูงสุด 3 stack)"},
      {name:'Helping Others', type:'Passive', element:'-', sp:0,
        desc:"Permanently gain 1 Area to Improve stack per Thoughtful Round stack gained. Effects: 1 stack → ailment accuracy +18%, ailment resistance +18%; 2 stacks → ATK +18%, DEF +18%; 3 stacks → CRIT DMG +18%.",
        descTh:"รับ Area to Improve 1 stack ถาวรต่อ Thoughtful Round ที่ได้รับ ผล: 1 stack → ailment accuracy +18%, resistance +18%; 2 stack → ATK +18%, DEF +18%; 3 stack → CRIT DMG +18%"},
    ],
    awareness:[
      {name:'My Name Is Beauty Thief',
        desc:"Haru's ranged attacks deal Psy damage to all foes equal to 66% of Attack. Each skill grants 1 Thoughtful Round (up to 3 different types simultaneously). Skill damage increases at 1/2/3 stacks: +20%/40%/50%. At 2+ stacks: ATK +25%. After ranged attack: remove all Thoughtful Rounds.",
        descTh:"การโจมตีระยะไกลของ Haru ดีลดาเมจพลังจิตต่อศัตรูทุกตัว 66% ของ Attack แต่ละสกิลให้ Thoughtful Round 1 stack (สูงสุด 3 ประเภทต่างกัน) ดาเมจสกิลเพิ่มที่ 1/2/3 stack: +20%/40%/50% ที่ 2+ stack: ATK +25% หลังโจมตีระยะไกล: ลบ Thoughtful Round ทั้งหมด"},
      {name:'Expressing Emotions',
        desc:"After a new foe appears, activate Extrasensory Aim at start of Haru's next turn. Per Target Audience stack: ATK +8% (max 24%) and ranged attack CRIT Rate +6% (max 18%).",
        descTh:"หลังศัตรูใหม่ปรากฏ เปิดใช้ Extrasensory Aim ต้นเทิร์นถัดไปของ Haru ต่อ Target Audience stack: ATK +8% (สูงสุด 24%) และ CRIT Rate การโจมตีระยะไกล +6% (สูงสุด 18%)"},
      {name:'Unwavering Faith',
        desc:"With 1+ Target Audience stacks, decrease damage taken by 25%. With 3+ stacks, increase Psychokinesis damage by 60%.",
        descTh:"เมื่อมี Target Audience 1+ stack ลดดาเมจที่รับ 25% เมื่อมี 3+ stack เพิ่มดาเมจพลังจิต 60%"},
      {name:'Advancing Courage',
        desc:"Increase the skill levels of Mindful Release and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Mindful Release และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Straight to the Point',
        desc:"Overload Round Enhanced: When using a ranged attack, increase critical damage by 30%.",
        descTh:"Overload Round เสริม: เมื่อใช้การโจมตีระยะไกล เพิ่ม CRIT DMG 30%"},
      {name:'Giving It My Best Shot',
        desc:"Increase the skill levels of Extrasensory Aim and Precise Volley by 3.",
        descTh:"เพิ่มระดับสกิล Extrasensory Aim และ Precise Volley ขึ้น 3 ระดับ"},
      {name:'Heroine of Justice',
        desc:"At 2+ Thoughtful Rounds: evolve ranged attacks to Resonating Shots (also fires all Thoughtful Round effects once at 70% damage). At 2+ Thoughtful Rounds from skills: Focused Round gives target ailment resistance -27% for 2 turns; Painpoint Round gives +12% pierce rate; Spillover Round gives +20% CRIT Rate and +20% CRIT DMG.",
        descTh:"ที่ 2+ Thoughtful Round: โจมตีระยะไกลพัฒนาเป็น Resonating Shots (ยิง Thoughtful Round ทั้งหมด 1 ครั้งที่ 70%) ที่ 2+ Thoughtful Round จากสกิล: Focused Round → ailment resistance ศัตรู -27% 2 เทิร์น; Painpoint Round → pierce rate +12%; Spillover Round → CRIT Rate +20%, CRIT DMG +20%"},
    ],
    baseStats: {hp:288, atk:102, def:57, spd:97},
    baseStatsLv80: [
      {hp:3240, atk:1150, def:647, spd:0},
      {hp:3298, atk:1171, def:659, spd:0},
      {hp:3357, atk:1192, def:670, spd:0},
      {hp:3415, atk:1212, def:682, spd:0},
      {hp:3474, atk:1233, def:693, spd:0},
      {hp:3532, atk:1253, def:705, spd:0},
      {hp:3590, atk:1274, def:716, spd:0},
    ],
    hiddenAbility: 'Ailment Accuracy +34.9%',
    weapons:[
      {name:'Last Quarter', stars:5,
        hp:2141, atk:760, def:427,
        bonusStats:{},
        abilityName:'Last Quarter',
        ability:[
          'Increase ailment accuracy by 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%.',
          'When dealing Psy damage with Target Audience, increase Psy damage by 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%.',
          'For each Thoughtful Round gained, increase Attack by 34.0%/43.0%/43.0%/52.0%/52.0%/61.0%/61.0% for 1 turn.',],
        abilityTh:[
          'เพิ่ม ailment accuracy 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%',
          'เมื่อดีลดาเมจพลังจิตพร้อม Target Audience เพิ่มดาเมจพลังจิต 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%',
          'ต่อ Thoughtful Round ที่ได้รับ เพิ่ม Attack 34.0%/43.0%/43.0%/52.0%/52.0%/61.0%/61.0% เป็นเวลา 1 เทิร์น',
        ]},
      {name:'Gilgamesh Axe', stars:4,
        hp:1712, atk:608, def:341,
        bonusStats:{atk:24},
        abilityName:'Gilgamesh Axe',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "Increase Attack and ailment accuracy by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% for each foe with a debuff (up to 9.9%/12.9%/12.9%/15.9%/15.9%/18.9%/18.9%).",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'ต่อศัตรู 1 ตัวที่ถูก debuff เพิ่ม Attack และ ailment accuracy 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% (สูงสุด 9.9%/12.9%/12.9%/15.9%/15.9%/18.9%/18.9%)',
        ]},
    ],
  },
  {name:'Cherish',            codename:'Cherish',        role:'Guardian',   element:'Ice',            rarity:5, cards:['Peace 4pc','Virtue 2pc'],       weapon:'Best HP/Shield weapon',                         statPrio:['HP%','DEF%','Healing Bonus%'],                   note:'Ice Guardian specialising in shields and party protection.',
    mechanics: "Knight's Protection shield (single target) และ Knight's Resolve shield (AoE) ทั้งคู่สเกลตาม DEF ของ Ashiya เมื่อ ally ที่มี shield ถูกโจมตี Ashiya ได้ Heroism (สูงสุด 2/เทิร์น) เมื่อครบ 4 Heroism stack → Garden of Promises เปิด: shield ทุก ally ใหม่ + เสริม Frost Vines (เพิ่ม DMG taken debuff) และ Hoarfrost Vow (shield แรงขึ้น +25%) Flower Knight's Shield ให้ ally ที่มี shield +24% DEF และ ailment resistance +48% Flower Knight's Devotion ให้ DMG buff stack แก่ ally ที่ป้องกัน (สูงสุด 3 stack → +20% CRIT DMG เพิ่ม) ทุกครั้งที่ ailment resistance บล็อก ailment",
    rotation: [
      "เทิร์น 1 → Winter Fortress (AoE Knight's Resolve shield + Knight's Protection + party DMG buff 2T)",
      "เทิร์น 2 → Hoarfrost Vow บน ally ที่เสี่ยงสุด (double shield; HP >60%: เป้าหมายดึง aggro)",
      "เทิร์น 3 → Frost Vines (Ice DMG + Freeze + Heroism 2 stack; Garden of Promises: เพิ่ม DMG taken debuff)",
      "เมื่อ Heroism 4 → Garden of Promises เปิดต้นเทิร์น → shield ทุก ally ใหม่อัตโนมัติ",
      "ใช้ Highlight เมื่อพร้อม → Knight's Resolve shield ปาร์ตี้ทั้งหมด + DMG taken ลด 31%",
      "กับ Garden of Promises: Frost Vines กลายเป็น DEF-scaling damage amplifier คู่กับ Ice damage",
    ],
    realName:'Masaki Ashiya', persona:'Amalthea',
    weakRes:{ Fire:'normal', Ice:'res', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'normal', Bless:'wk', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Frost Vines',             type:'Skill',   element:'Ice', sp:24,
        desc:"Deal Ice damage to the main target equal to 149.2%/164.5%/158.4%/173.7% of Ashiya's Defense, and deal Ice damage to other foes equal to 44.8%/49.4%/47.6%/52.1% of Ashiya's Defense.\n97.6%/97.6%/103.6%/103.6% chance to inflict Freeze on the main target, and gain 2 Heroism stacks.\nIf Garden of Promises is active, increase the main target's damage taken by 2% for every 600 points of Ashiya's Defense (up to 19.5%/21.5%/20.7%/22.7%), but gain only 1 Heroism stack.",
        descTh:"สร้างความเสียหายธาตุน้ำแข็งให้เป้าหมายหลัก เท่ากับ 149.2%/164.5%/158.4%/173.7% ของ DEF ของ Ashiya และสร้างความเสียหายน้ำแข็งให้ศัตรูอื่น 44.8%/49.4%/47.6%/52.1% ของ DEF\nโอกาส 97.6%/97.6%/103.6%/103.6% ทำให้เป้าหมายหลักติด Freeze และรับ Heroism 2 stack\nหาก Garden of Promises ทำงาน เพิ่มความเสียหายที่เป้าหมายหลักรับ 2% ต่อ DEF ของ Ashiya 600 จุด (สูงสุด 19.5%/21.5%/20.7%/22.7%) แต่รับ Heroism เพียง 1 stack"},
      {name:'Hoarfrost Vow',           type:'Skill',   element:'-',   sp:26, isBuff:true,
        desc:"Grant 1 Knight's Protection shield equal to 22.8%/22.8%/24.2%/24.2% of Ashiya's Defense + 650/790/799/939 to 1 ally. Also increase the ally's Defense by 20% of Ashiya's Defense (up to 1220/1345/1295/1420) for 2 turns. If the target has more than 60% HP, increase rate to take attacks from foes by 50%.\nAt the start of Ashiya's next turn, grant 1 Knight's Protection again to the same target. If Garden of Promises is active, increase shield granted from Knight's Protection by 25% for 2 turns.",
        descTh:"ให้ Knight's Protection shield เท่ากับ 22.8%/22.8%/24.2%/24.2% ของ DEF ของ Ashiya + 650/790/799/939 แก่พันธมิตร 1 คน เพิ่ม DEF ของพันธมิตร 20% ของ DEF ของ Ashiya (สูงสุด 1220/1345/1295/1420) เป็นเวลา 2 เทิร์น หากเป้าหมายมี HP มากกว่า 60% เพิ่มอัตราการรับการโจมตีจากศัตรู 50%\nเมื่อเริ่มต้นเทิร์นถัดไปของ Ashiya ให้ Knight's Protection อีกครั้งแก่เป้าหมายเดิม หาก Garden of Promises ทำงาน เพิ่ม shield จาก Knight's Protection 25% เป็นเวลา 2 เทิร์น"},
      {name:'Winter Fortress',         type:'Skill',   element:'-',   sp:30, isBuff:true,
        desc:"Grant all allies 1 Knight's Protection shield equal to 12% of Ashiya's Defense + 120/240/360 (changes at Lv. 1/50/70) and Knight's Resolve shield equal to 49.2%/49.2%/52.2%/52.2% of Ashiya's Defense + 1400/1702/1721/2024.\nAlso increase all allies' Down Points by 1 and damage dealt by 2.9% for every 300 points of Ashiya's Defense (up to 56.6%/62.4%/60.1%/65.9%) for 2 turns.",
        descTh:"ให้ Knight's Protection shield เท่ากับ 12% ของ DEF ของ Ashiya + 120/240/360 (เปลี่ยนที่ Lv. 1/50/70) และ Knight's Resolve shield เท่ากับ 49.2%/49.2%/52.2%/52.2% ของ DEF + 1400/1702/1721/2024 แก่พันธมิตรทุกคน\nนอกจากนี้ เพิ่ม Down Points ของพันธมิตรทุกคน 1 และเพิ่มความเสียหายที่สร้าง 2.9% ต่อ DEF ของ Ashiya 300 จุด (สูงสุด 56.6%/62.4%/60.1%/65.9%) เป็นเวลา 2 เทิร์น"},
      {name:'HIGHLIGHT',               type:'Skill',   element:'-',   sp:0,  isBuff:true,
        desc:"Grant Knight's Resolve shield equal to 59.0%/59.0%/62.7%/62.7% of Ashiya's Defense + 1681/2044/2066/2429 to all allies and decrease damage taken by 31.9%/35.2%/33.9%/37.1% for 2 turns.",
        descTh:"ให้ Knight's Resolve shield เท่ากับ 59.0%/59.0%/62.7%/62.7% ของ DEF ของ Ashiya + 1681/2044/2066/2429 แก่พันธมิตรทุกคน และลดความเสียหายที่รับ 31.9%/35.2%/33.9%/37.1% เป็นเวลา 2 เทิร์น"},
      {name:"Flower Knight's Shield",  type:'Passive', element:'-',   sp:0,
        desc:"When allies have a shield granted by Ashiya, increase Defense by 24.0% and ailment resistance by 48.0%.",
        descTh:"เมื่อพันธมิตรมี shield ที่ Ashiya ให้ เพิ่ม DEF 24.0% และ ailment resistance 48.0%"},
      {name:"Flower Knight's Devotion",type:'Passive', element:'-',   sp:0,
        desc:"While Ashiya is in battle, when an ally uses their ailment resistance to avoid a Curse, elemental ailment, or spiritual ailment, grant 1, 2, or 3 buff stacks, respectively.\nFor each buff stack, increase the targeted ally's damage dealt by 10.0% for 2 turns. Stacks up to 3 times. At 3 buff stacks, also increase critical damage by 20.0% for 2 turns.",
        descTh:"ขณะ Ashiya อยู่ในการต่อสู้ เมื่อพันธมิตรใช้ ailment resistance หลีก Curse, elemental ailment หรือ spiritual ailment ให้ buff stack 1, 2 หรือ 3 stack ตามลำดับ\nต่อ buff stack เพิ่มความเสียหายที่พันธมิตรนั้นสร้าง 10.0% เป็นเวลา 2 เทิร์น สะสมสูงสุด 3 ครั้ง เมื่อครบ 3 stack เพิ่ม CRIT DMG 20.0% เป็นเวลา 2 เทิร์นด้วย"},
    ],
    awareness:[
      {name:'Noble Knight of Flowers',
        desc:"At the start of battle, grant all allies 1 Knight's Protection shield equal to 12% of Ashiya's Defense + 120/240/360 (changes at Lv. 1/50/70).\nWhen an ally with Knight's Protection takes an attack, grant Ashiya 1 Heroism stack (up to 2 per turn). Heroism stacks up to 4 times.\nAt the start of the turn, if Heroism is at 4 stacks, spend 4 Heroism stacks to gain Garden of Promises and grant Knight's Protection again to all allies.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ ให้ Knight's Protection shield เท่ากับ 12% ของ DEF ของ Ashiya + 120/240/360 (เปลี่ยนที่ Lv. 1/50/70) แก่พันธมิตรทุกคน\nเมื่อพันธมิตรที่มี Knight's Protection ถูกโจมตี ให้ Heroism แก่ Ashiya 1 stack (สูงสุด 2 ต่อเทิร์น) สะสมสูงสุด 4 ครั้ง\nเมื่อเริ่มต้นเทิร์น หาก Heroism อยู่ที่ 4 stack ใช้ 4 stack เพื่อรับ Garden of Promises และให้ Knight's Protection แก่พันธมิตรทุกคนอีกครั้ง"},
      {name:'Floriography: Freesia',
        desc:"At the start of battle, gain 3 Heroism stacks. Garden of Promises requires 3 Heroism stacks to activate.\nIncrease party's pierce rate by 20%.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Heroism 3 stack Garden of Promises ต้องใช้ Heroism 3 stack เพื่อเปิดใช้\nเพิ่ม pierce rate ของปาร์ตี้ 20%"},
      {name:'Floriography: Gerbera',
        desc:"Increase Defense by 15%, damage dealt by 15%, and critical damage by 10% for every Knight's Protection shield. This effect can stack up to 2 times.\nWhen the effect of Knight's Protection ends, restore the targeted ally's HP by 20% of remaining shield.",
        descTh:"เพิ่ม DEF 15%, ความเสียหายที่สร้าง 15% และ CRIT DMG 10% ต่อ Knight's Protection shield สะสมสูงสุด 2 ครั้ง\nเมื่อ Knight's Protection สิ้นสุด ฟื้นฟู HP ของพันธมิตรเป้าหมาย 20% ของ shield ที่เหลืออยู่"},
      {name:'Benevolent Iceheart Knight',
        desc:"Increase the skill levels of Frost Vines and Winter Fortress by 3.",
        descTh:"เพิ่มระดับสกิล Frost Vines และ Winter Fortress ขึ้น 3"},
      {name:'Floriography: Chamomile',
        desc:"Highlight Enhanced: Increase shield granted to party by 30% (lasts for 2 turns).",
        descTh:"Highlight Enhanced: เพิ่ม shield ที่ให้แก่ปาร์ตี้ 30% (คงอยู่ 2 เทิร์น)"},
      {name:'Floriography: Gentian',
        desc:"Increase the skill levels of Hoarfrost Vow and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Hoarfrost Vow และ Thief Tactics ขึ้น 3"},
      {name:'True-Hearted Friendship',
        desc:"When gaining Garden of Promises, gain Poise for 3 turns.\nPoise: Increase the party's critical rate by 15%.",
        descTh:"เมื่อได้รับ Garden of Promises รับ Poise 3 เทิร์น\nPoise: เพิ่ม CRIT Rate ของปาร์ตี้ 15%"},
    ],
    baseStats:     {hp:315, atk:74, def:72, spd:104},
    baseStatsLv80: [
      {hp:3540, atk:840, def:813, spd:104},
      {hp:3604, atk:855, def:828, spd:104},
      {hp:3667, atk:870, def:843, spd:104},
      {hp:3731, atk:886, def:857, spd:104},
      {hp:3795, atk:901, def:872, spd:104},
      {hp:3858, atk:916, def:887, spd:104},
      {hp:3922, atk:930, def:901, spd:104},
    ],
    hiddenAbility: 'DEF% +43.6%',
    weapons:[
      {
        name: 'Spina Sacramenti', stars:5,
        hp: 2339, atk: 555, def: 537,
        bonusStats: {def:45},
        abilityName: 'Spina Sacramenti',
        ability: [
          "Increase Defense by 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%.",
          "Increase Knight's Protection shield by 30.0%/40.0%/40.0%/50.0%/50.0%/60.0%/60.0%.",
          "Also increase the target's damage dealt by 8.0%/10.5%/10.5%/13.0%/13.0%/15.5%/15.5% for each Knight's Protection shield granted. This effect can stack up to 2 times.",],
        abilityTh: [
          'เพิ่ม DEF 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%',
          "เพิ่ม Knight's Protection shield 30.0%/40.0%/40.0%/50.0%/50.0%/60.0%/60.0%",
          "เพิ่มความเสียหายที่เป้าหมายสร้าง 8.0%/10.5%/10.5%/13.0%/13.0%/15.5%/15.5% ต่อ Knight's Protection shield ที่ให้ สะสมสูงสุด 2 ครั้ง",
        ],
      },
      {
        name: 'Spina Caritatis', stars:4,
        hp: 1871, atk: 444, def: 430,
        bonusStats: {},
        abilityName: 'Spina Caritatis',
        ability:[
          "Increase shield by 8.7%/8.7%/11.3%/11.3%/13.9%/13.9%/16.5%.",
          "Also increase shield granted by Ashiya to allies with less than 60% HP by 13.7%/17.8%/17.8%/21.9%/21.9%/26.0%/26.0%.",
        ],
        abilityTh: [
          'เพิ่ม shield 8.7%/8.7%/11.3%/11.3%/13.9%/13.9%/16.5%',
          "เพิ่ม shield ที่ Ashiya ให้แก่พันธมิตรที่มี HP ต่ำกว่า 60% 13.7%/17.8%/17.8%/21.9%/21.9%/26.0%/26.0%",
        ],
      },
    ],
  },
  {name:'Messa', codename:'Messa', role:'Assassin', element:'Physical', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best Physical/Bleed weapon (Bloodletter)',
    statPrio:['ATK%','Physical DMG%','CRIT Rate%'], note:'Physical Assassin. Dual-mode Bleed stacker — Doctor mode builds stacks, Ripper mode detonates with Rending damage.',
    mechanics: "Kitazato สลับระหว่าง Doctor mode (สะสม Bleed) และ Ripper mode (ระเบิด Rending) Doctor mode: Moonlit Scalpel สะสม Bleed (4 hit +1 stack), Crimson Operation รีเซ็ต duration Bleed และเปิด DoT เมื่อ Bleed รวมบนศัตรูใดเกิน 7 stack → Nightfall ปลดล็อก สลับ Ripper mode ทุก 3 Bleed = 1 Rending stack (DoT ทุกเทิร์น) Crimson/Pathology ใน Ripper ลบ Bleed ทั้งหมดเพื่อ +2% DMG ต่อ stack ขณะที่ Midnight Surgery ยิงโจมตีครั้งเดียวมหาศาล Highlight เชื่อม Doctor→5 Bleed→Ripper ในเทิร์นเดียว",
    rotation: [
      "Doctor mode: Moonlit Scalpel (4 hit + 1 Bleed) → Crimson Operation (เปิด DoT + รีเซ็ต timer) → ทำซ้ำ",
      "Bleed ≥7 stack บนเป้าใดก็ตาม → Nightfall (สลับ Ripper) → Crimson Operation/Pathology (ใช้ Bleed ทั้งหมด → scaled burst)",
      "ใน Ripper mode: Moonlit Scalpel/Midnight Surgery ยิงโจมตีครั้งเดียวขนาดใหญ่ต่อการใช้",
      "Highlight: สลับ Doctor→ติด Bleed 5→Ripper→hit ใหญ่ อัตโนมัติ (ใช้เมื่อ charge เต็ม)",
      "สะสม Bleed ถึง 7-9 ก่อน Ripper เพื่อ Rending stack สูงสุด (DMG สูงสุดจาก Pathology)",
      "กับบอสตัวเดียว: โฟกัส Moonlit Scalpel สะสม Bleed แล้ว Nightfall + Pathology เป็นเทิร์น burst",
    ],
    realName:'Kira Kitazato', persona:'Harpyia',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'wk', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Moonlit Scalpel / Midnight Surgery', type:'Skill', element:'Physical', sp:21,
        desc:"Doctor mode: Deal Physical damage to 1 foe equal to 47.3%/52.2%/50.2%/55.1% of Attack (4 hits) and inflict 1 Bleed stack.\nRipper mode: Deal Physical damage to 1 foe equal to 251.7%/277.5%/267.2%/292.9% of Attack, then remove 2 Bleed stacks from the target (can activate Rending effects).",
        descTh:"Doctor mode: ดีลดาเมจกายภาพต่อศัตรู 1 ตัว 47.3%/52.2%/50.2%/55.1% ของ Attack (4 ครั้ง) และทำให้ติด Bleed 1 stack\nRipper mode: ดีลดาเมจกายภาพต่อศัตรู 1 ตัว 251.7%/277.5%/267.2%/292.9% ของ Attack จากนั้นลบ Bleed 2 stack จากเป้าหมาย (สามารถเปิดใช้ Rending ได้)"},
      {name:'Crimson Operation / Pathology', type:'Skill', element:'Physical', sp:21,
        desc:"Doctor mode: Deal Physical damage to 1 foe equal to 84.2%/92.9%/89.4%/98.0% of Attack (2 hits). Activate Bleed damage and reset the turn duration of the target's Bleed stacks 1 time.\nRipper mode: Deal Physical damage to 1 foe equal to 251.7%/277.5%/267.2%/292.9% of Attack. For each Bleed stack, increase Rending and this skill's damage by 2%, then remove all Bleed stacks (can activate Rending effects).",
        descTh:"Doctor mode: ดีลดาเมจกายภาพต่อศัตรู 1 ตัว 84.2%/92.9%/89.4%/98.0% ของ Attack (2 ครั้ง) เปิดใช้ดาเมจ Bleed และ reset ระยะเวลา Bleed ของเป้าหมาย 1 ครั้ง\nRipper mode: ดีลดาเมจกายภาพต่อศัตรู 1 ตัว 251.7%/277.5%/267.2%/292.9% ของ Attack ต่อ Bleed stack เพิ่มดาเมจ Rending และสกิลนี้ 2% จากนั้นลบ Bleed ทั้งหมด (สามารถเปิดใช้ Rending ได้)"},
      {name:'Nightfall', type:'Skill', element:'Physical', sp:15,
        desc:"Switch to Ripper mode (requires 7+ Bleed stacks on any foe). In Ripper mode, for every 3 Bleed stacks on the target, inflict 1 Rending stack (Physical damage equal to 66.7%/73.5%/70.8%/77.6% of Attack). After using this skill, Kitazato can use other skills and switches back to Doctor mode at end of turn.",
        descTh:"สลับไป Ripper mode (ต้องมี Bleed 7+ stack บนศัตรูใดก็ได้) ใน Ripper mode ทุก Bleed 3 stack บนเป้าหมาย ทำให้ติด Rending 1 stack (ดาเมจกายภาพ 66.7%/73.5%/70.8%/77.6% ของ Attack) หลังใช้สกิลนี้ Kitazato สามารถใช้สกิลอื่นได้และสลับกลับ Doctor mode ท้ายเทิร์น"},
      {name:'HIGHLIGHT', type:'Skill', element:'Physical', sp:0,
        desc:"Switch to Doctor mode and inflict 5 Bleed stacks on 1 foe. Then switch to Ripper mode and deal Physical damage equal to 492.8%/543.3%/523.1%/573.6% of Attack (can activate Rending effects). [4-turn cooldown]",
        descTh:"สลับไป Doctor mode และทำให้ศัตรู 1 ตัวติด Bleed 5 stack จากนั้นสลับไป Ripper mode และดีลดาเมจกายภาพ 492.8%/543.3%/523.1%/573.6% ของ Attack (สามารถเปิดใช้ Rending ได้) [Cooldown: 4 เทิร์น]"},
      {name:'Hideous Mask', type:'Passive', element:'-', sp:0,
        desc:"For every 30% of Kitazato's ailment accuracy, increase Physical damage from Bleed by 4% of Attack (up to 90% ailment accuracy).",
        descTh:"ต่อ ailment accuracy ทุก 30% เพิ่มดาเมจกายภาพจาก Bleed 4% ของ Attack (สูงสุดที่ ailment accuracy 90%)"},
      {name:'Drawn Blade', type:'Passive', element:'-', sp:0,
        desc:"Doctor mode: increase ailment accuracy by 36%. Ripper mode: increase pierce rate by 21%.",
        descTh:"Doctor mode: เพิ่ม ailment accuracy 36% Ripper mode: เพิ่ม pierce rate 21%"},
    ],
    awareness:[
      {name:'Mortal Responsibility',
        desc:"Kitazato has 2 modes: Doctor and Ripper. Starts in Doctor mode.\nDoctor: 70% chance to inflict 1 Bleed per skill hit. Defeated foe's Bleed passes to highest HP foe.\nRipper: 1 Rending stack per 3 Bleed stacks when using a skill.\nBleed: Almighty 1% max HP + Physical 4% ATK per turn, lasts 4 turns, stacks up to 10.\nRending: Physical damage based on ATK and Nightfall's skill level (no crit or Down Point damage).",
        descTh:"Kitazato มี 2 mode: Doctor และ Ripper เริ่มใน Doctor mode\nDoctor: โอกาส 70% ทำให้ติด Bleed 1 stack ต่อการโจมตีด้วยสกิล ศัตรูที่ถูกกำจัดจะส่ง Bleed ต่อให้ศัตรูที่ HP สูงสุด\nRipper: ทุก Bleed 3 stack → Rending 1 stack เมื่อใช้สกิล\nBleed: ดาเมจ Almighty 1% HP สูงสุด + กายภาพ 4% ATK ต่อเทิร์น ติด 4 เทิร์น สะสมสูงสุด 10 stack\nRending: ดาเมจกายภาพตาม ATK และระดับสกิล Nightfall (ไม่ CRIT และไม่ลด Down Point)"},
      {name:'Abdominal Incisions',
        desc:"Doctor mode: first skill damage to each foe inflicts 5 more Bleed stacks. Ripper mode: skill damage scales with debuff count (max +80% at 10+ debuffs). Bleed's Almighty damage ×1.5.",
        descTh:"Doctor mode: การดาเมจสกิลครั้งแรกต่อศัตรูแต่ละตัว ทำให้ติด Bleed เพิ่ม 5 stack Ripper mode: ดาเมจสกิลเพิ่มตามจำนวน debuff (สูงสุด +80% ที่ 10+ debuff) ดาเมจ Almighty จาก Bleed ×1.5"},
      {name:'Forbidden Transfusion',
        desc:"Increase Rending's Attack multiplier by 35% of Kitazato's Attack. Restore HP by 2% of Rending damage dealt (up to Lv×15+300 per turn).",
        descTh:"เพิ่มตัวคูณ Attack ของ Rending ด้วย 35% ของ ATK Kitazato ฟื้นฟู HP 2% ของดาเมจ Rending ที่ดีล (สูงสุด Lv×15+300 ต่อเทิร์น)"},
      {name:'Master of the Scalpel',
        desc:"Increase the skill levels of Moonlit Scalpel/Midnight Surgery and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Moonlit Scalpel/Midnight Surgery และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Bloody Bacchanal',
        desc:"Highlight Enhanced: Increase Highlight damage by 8% for each Bleed stack inflicted on the target.",
        descTh:"Highlight เสริม: เพิ่มดาเมจ Highlight 8% ต่อ Bleed stack ที่ทำให้ศัตรูติด"},
      {name:'Razor-Sharp Focus',
        desc:"Increase the skill levels of Crimson Operation/Pathology and Nightfall by 3.",
        descTh:"เพิ่มระดับสกิล Crimson Operation/Pathology และ Nightfall ขึ้น 3 ระดับ"},
      {name:'Great Doctor',
        desc:"Increase max Bleed stacks to 13. Each foe always starts with 3 Bleed stacks. When using Midnight Surgery (Ripper mode), do not remove target's Bleed stacks. Rending evolves to Killing Frenzy: +100% damage, deals 50% damage to all other foes, and activates with all skills.",
        descTh:"เพิ่ม Bleed stack สูงสุดเป็น 13 ศัตรูทุกตัวเริ่มด้วย Bleed 3 stack เมื่อใช้ Midnight Surgery ใน Ripper mode ไม่ลบ Bleed ของเป้าหมาย Rending พัฒนาเป็น Killing Frenzy: +100% ดาเมจ ดีล 50% ต่อศัตรูอื่นทุกตัว และเปิดใช้ได้จากทุกสกิล"},
    ],
    baseStats: {hp:331, atk:100, def:48, spd:97},
    baseStatsLv80: [
      {hp:3720, atk:1130, def:547, spd:0},
      {hp:3787, atk:1150, def:556, spd:0},
      {hp:3854, atk:1171, def:567, spd:0},
      {hp:3921, atk:1191, def:576, spd:0},
      {hp:3988, atk:1212, def:586, spd:0},
      {hp:4055, atk:1232, def:596, spd:0},
      {hp:4122, atk:1252, def:606, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Bloodletter', stars:5,
        hp:2458, atk:747, def:361,
        bonusStats:{atk:30},
        abilityName:'Bloodletter',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'Increase ailment accuracy by 15%.',
          'Increase pierce rate of Rending damage by 25.0%/32.5%/32.5%/40.0%/40.0%/47.5%/47.5%.',
          'Increase damage dealt to foes inflicted with Bleed by 25.0%/32.5%/32.5%/40.0%/40.0%/47.5%/47.5%.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เพิ่ม ailment accuracy 15%',
          'เพิ่ม pierce rate ของดาเมจ Rending 25.0%/32.5%/32.5%/40.0%/40.0%/47.5%/47.5%',
          'เพิ่มดาเมจต่อศัตรูที่ติด Bleed 25.0%/32.5%/32.5%/40.0%/40.0%/47.5%/47.5%',
        ]},
      {name:'Undying Embers', stars:4,
        hp:1966, atk:597, def:289,
        bonusStats:{atk:24},
        abilityName:'Undying Embers',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "Whenever inflicting Bleed on foes, permanently increase Attack by 1.8%/2.4%/2.4%/3.0%/3.0%/3.6%/3.6%. Stacks up to 10 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'ทุกครั้งที่ทำให้ศัตรูติด Bleed เพิ่ม Attack ถาวร 1.8%/2.4%/2.4%/3.0%/3.0%/3.6%/3.6% สะสมสูงสุด 10 ครั้ง',
        ]},
    ],
  },
  {name:'Phoebe', codename:'Phoebe', role:'Elucidator', element:'-', rarity:5,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:'Best ATK support weapon',
    statPrio:['ATK%','SPD','HP%'], note:"Elucidator. Cocktail system: allies generate Mixers → Cocktails (Tailor-Made/Standard/Basic by attribute match). Cocktails amplify skill effects. Stat Buff shares 20% of Phantom Thief's stats. Invigorating Blend grants attribute DMG buff + CRIT DMG at 2+ Standard Cocktails.",
    mechanics: "Mixer (4 attribute ประเภท) สร้างขึ้นทุกครั้งที่ ally ใช้ทักษะ, Resonance, Highlight หรือ Theurgy โจมตี หลัง 3 Mixer จะเปลี่ยนเป็น Cocktail (สูงสุด 3): Tailor-Made ถ้า 3 attribute ตรงกัน, Standard ถ้า 2 ตรงกัน, Basic ถ้าต่างกันทั้งหมด เมื่อ Yumi ใช้ทักษะ Cocktail จะถูกใช้เพื่อเพิ่มผลทักษะ (Tailor-Made 120%, Standard 100%, Basic 50%) บวกคืน SP 8 ให้ทุก ally passive Stat Buff แชร์ 20% ของ stat Yumi ให้ทุก ally Tempting Build และ Invigorating Blend สเกลตาม ATK ของ Yumi (ถึง threshold 6440 ATK)",
    rotation: [
      "เทิร์น 1 → Tempting Build (บัฟ ATK ปาร์ตี้ + ใช้ Cocktail บนทักษะ DPS ถัดไป 120% amplification; CD 6 ally actions)",
      "เทิร์น 2 → Enchanting Stir บน DPS หลัก (DMG up + max HP up + HP regen เมื่อโจมตี; อัปเกรด Cocktail เป็น Tailor-Made)",
      "เทิร์น 3 → Invigorating Blend บน DPS หลัก (ใช้ Cocktail ทั้งหมด → attribute DMG + CRIT DMG เมื่อมี 2+ Standard)",
      "รักษา attribute ปาร์ตี้ให้ตรงกับ DPS เพื่อ Tailor-Made Cocktail (amplification 120%)",
      "กับ M5: Cocktail สูงสุด 4 และเริ่มด้วย Tailor-Made 1 → เปิดด้วย Invigorating Blend เทิร์น 1",
      "Stat Buff แชร์ 20% ของ ATK/HP/DEF/SPD ของ Yumi — รักษา stat ของ Yumi สูงสุดเพื่อ party-wide gains",
    ],
    realName:'Yumi Shiina', persona:'Urania',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Tempting Build', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's Attack by 8.7% of Yumi's Attack for 3 turns (up to 4600/5060/5980/6440 of Attack). When an ally uses a skill, spend 1 Cocktail to strengthen that skill's effects. Higher quality Cocktails will be used first. Tailor-Made, Standard, and Basic Cocktails will increase skill effects by 120%, 100%, and 50% respectively.\nCooldown Time: 6 ally actions.",
        descTh:"เพิ่ม Attack ของปาร์ตี้ 8.7% ของ Attack ของ Yumi 3 เทิร์น (สูงสุด 4600/5060/5980/6440 ATK)\nเมื่อพันธมิตรใช้สกิล ใช้ Cocktail 1 stack เพื่อเสริมพลังเอฟเฟกต์ของสกิลนั้น Cocktail คุณภาพสูงกว่าจะถูกใช้ก่อน Tailor-Made, Standard และ Basic Cocktail เพิ่มเอฟเฟกต์สกิล 120%, 100% และ 50% ตามลำดับ\nเวลาคูลดาวน์: 6 การกระทำของพันธมิตร"},
      {name:'Enchanting Stir', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase 1 ally's damage by 1% for every 230 of Yumi's Attack (up to 4600/5060/5980/6440 of Attack) and their max HP by 13.0%/13.0%/14.6%/14.6% for 2 turns. When the target deals damage to a foe, restore the target's HP by 2% of damage dealt for 1 turn.\nWhen activating a skill, spend 1 Basic or Standard Cocktail to gain 1 Tailor-Made Cocktail.\nCooldown Time: 4 ally actions.",
        descTh:"เพิ่มดาเมจของพันธมิตร 1 คน 1% ต่อ Attack ของ Yumi ทุก 230 (สูงสุด 4600/5060/5980/6440 ATK) และ HP สูงสุด 13.0%/13.0%/14.6%/14.6% 2 เทิร์น เมื่อเป้าหมายดีลดาเมจต่อศัตรู ฟื้นฟู HP ของเป้าหมาย 2% ของดาเมจที่ดีล 1 เทิร์น\nเมื่อใช้สกิล ใช้ Basic หรือ Standard Cocktail 1 stack เพื่อได้รับ Tailor-Made Cocktail 1 stack\nเวลาคูลดาวน์: 4 การกระทำของพันธมิตร"},
      {name:'Invigorating Blend', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Spend all Cocktails to increase the party's attribute damage based on the targeted ally's attribute for 2 turns. Attribute damage will increase by 1% for every 230 of Yumi's Attack (up to 4600/5060/5980/6440 of Attack). Each Tailor-Made, Standard, and Basic Cocktail spent will change this effect by 120%, 100%, and 50% respectively.\nIncrease these effects for the targeted ally by 1.2 times. If 2+ Standard or better Cocktails are spent, also increase the targeted ally's critical damage by 20.0%/22.0%/22.4%/24.4%.\nCooldown Time: 8 ally actions. (This skill requires Cocktails.)",
        descTh:"ใช้ Cocktail ทั้งหมด เพิ่มดาเมจ attribute ของปาร์ตี้ ตาม attribute ของพันธมิตรที่เลือก 2 เทิร์น ดาเมจ attribute เพิ่มขึ้น 1% ต่อ Attack ของ Yumi ทุก 230 (สูงสุด 4600/5060/5980/6440 ATK) Tailor-Made, Standard และ Basic Cocktail แต่ละ stack เปลี่ยนเอฟเฟกต์นี้ 120%, 100% และ 50% ตามลำดับ\nเพิ่มเอฟเฟกต์สำหรับพันธมิตรที่เลือก 1.2 เท่า หากใช้ Standard 2+ stack เพิ่ม CRIT DMG ของพันธมิตรที่เลือก 20.0%/22.0%/22.4%/24.4% ด้วย\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร (สกิลนี้ต้องใช้ Cocktail)"},
      {name:'Stat Buff', type:'Passive', element:'-', sp:0,
        desc:"Increases the corresponding attribute values of all deployed allies by 20% of the Phantom Thieves' respective attributes.",
        descTh:"เพิ่มค่าสถิติที่สอดคล้องของพันธมิตรที่ออกสนามทุกคน 20% ของสถิติของ Phantom Thieves"},
      {name:'Cocktail Party', type:'Passive', element:'-', sp:0,
        desc:"Increase party's attribute damage by 4% based on main attributes of party members.",
        descTh:"เพิ่มดาเมจ attribute ของปาร์ตี้ 4% ตาม attribute หลักของสมาชิกปาร์ตี้"},
      {name:'Taking Orders', type:'Passive', element:'-', sp:0,
        desc:"At the start of battle, gain 3 Mixers, based on the most common attribute among allies in the battle.",
        descTh:"ในช่วงเริ่มต้นการต่อสู้ รับ Mixer 3 stack ตาม attribute ที่พบมากที่สุดในหมู่พันธมิตรในการต่อสู้"},
    ],
    awareness:[
      {name:'Expert Bartender',
        desc:"When an ally deals damage with a skill, Resonance, Highlight, or Theurgy, Yumi gains 1 Mixer stack of the corresponding attribute. After gaining 3 Mixer stacks, change them to a Cocktail (max 3). If the 3 Mixers have the same attribute, create a Tailor-Made Cocktail. If 2 are the same, create a Standard Cocktail. If all 3 are different, create a Basic Cocktail.\nWhen Yumi uses a skill, spend Cocktail stacks to activate various effects for the party and restore all allies' SP by 8.",
        descTh:"เมื่อพันธมิตรดีลดาเมจด้วยสกิล, Resonance, Highlight หรือ Theurgy Yumi จะได้รับ Mixer 1 stack ของ attribute ที่สอดคล้อง หลังได้รับ Mixer 3 stack ให้เปลี่ยนเป็น Cocktail (สูงสุด 3) หาก Mixer 3 stack มี attribute เดียวกัน สร้าง Tailor-Made หาก 2 stack เหมือนกัน สร้าง Standard หากทั้ง 3 ต่างกัน สร้าง Basic Cocktail\nเมื่อ Yumi ใช้สกิล ใช้ Cocktail stacks เพื่อเปิดใช้งานเอฟเฟกต์ต่างๆ สำหรับปาร์ตี้ และฟื้นฟู SP ของพันธมิตรทุกคน 8"},
      {name:'Mojito',
        desc:"When gaining a Cocktail, randomly gain 1 Mixer stack of the attributes spent. When activating Tempting Build or Invigorating Blend, spend 1 Basic or Standard Cocktail to gain 1 Standard or Tailor-Made Cocktail.",
        descTh:"เมื่อได้รับ Cocktail สุ่มรับ Mixer 1 stack ของ attribute ที่ใช้ เมื่อใช้งาน Tempting Build หรือ Invigorating Blend ใช้ Basic หรือ Standard Cocktail 1 stack เพื่อได้รับ Standard หรือ Tailor-Made Cocktail"},
      {name:'Screwdriver',
        desc:"When gaining a Cocktail, increase the party's damage by 16% for 2 turns.",
        descTh:"เมื่อได้รับ Cocktail เพิ่มดาเมจของปาร์ตี้ 16% 2 เทิร์น"},
      {name:'Martini',
        desc:"Increase the skill levels of Enchanting Stir and Invigorating Blend by 3.",
        descTh:"เพิ่มระดับสกิลของ Enchanting Stir และ Invigorating Blend 3 ระดับ"},
      {name:'Bloody Mary',
        desc:"When an ally uses Highlight or Theurgy, increase their Attack by 10% for 1 turn. Also, gain 1 Tailor-Made Cocktail.",
        descTh:"เมื่อพันธมิตรใช้ Highlight หรือ Theurgy เพิ่ม Attack ของพันธมิตรนั้น 10% 1 เทิร์น นอกจากนี้ รับ Tailor-Made Cocktail 1 stack"},
      {name:'Old Fashioned',
        desc:"Increase the skill level of Tempting Build by 3.",
        descTh:"เพิ่มระดับสกิลของ Tempting Build 3 ระดับ"},
      {name:'XYZ',
        desc:"The maximum number of Cocktail stacks increases to 4. At the start of battle, gain 1 Tailor-Made Cocktail. After every 3 Cocktails gained, gain 1 more Tailor-Made Cocktail.\nWhen spending a Tailor-Made, Standard, or Basic Cocktail to activate a skill, increase the skill effect from 120%/100%/50% up to 135%/120%/75% (includes Tempting Build, Invigorating Blend, and Moonlit Banquet).",
        descTh:"จำนวน Cocktail stacks สูงสุดเพิ่มเป็น 4 ในช่วงเริ่มต้นการต่อสู้ รับ Tailor-Made Cocktail 1 stack หลังได้รับ Cocktail ทุก 3 stack รับ Tailor-Made Cocktail เพิ่มเติม 1 stack\nเมื่อใช้ Tailor-Made, Standard หรือ Basic Cocktail เพื่อใช้งานสกิล เพิ่มเอฟเฟกต์จาก 120%/100%/50% เป็น 135%/120%/75% (รวม Tempting Build, Invigorating Blend และ Moonlit Banquet)"},
    ],
    baseStats:{hp:307, atk:98, def:53, spd:100},
    baseStatsLv80:[
      {hp:3450, atk:1110, def:607, spd:0},
      {hp:3512, atk:1130, def:618, spd:0},
      {hp:3574, atk:1150, def:628, spd:0},
      {hp:3636, atk:1170, def:639, spd:0},
      {hp:3699, atk:1190, def:651, spd:0},
      {hp:3760, atk:1210, def:661, spd:0},
      {hp:3823, atk:1230, def:672, spd:0},
    ],
    hiddenAbility:'ATK% +29%',
    weapons:[
      {name:'Moonlit Feather', stars:5, hp:2279, atk:733, def:401, bonusStats:{atk:30},
        abilityName:'Wine & Revelry',
        ability:["Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%. For each Cocktail spent, randomly grant 1 of the following effects to the party: Increase Attack by 6.0%/7.8%/7.8%/9.6%/9.6%/11.4%/11.4% (2 turns), Increase damage by 5.0%/6.5%/6.5%/8.0%/8.0%/9.5%/9.5% (2 turns), Increase critical rate by 4.0%/5.2%/5.2%/6.4%/6.4%/7.6%/7.6% (2 turns). These effects do not stack. If Tailor-Made multiply effect by 120%; Standard by 100%; Basic by 50%. For every 2 Cocktails gained, reduce Yumi's cooldown time by 1 turn."],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'ต่อ Cocktail ที่ใช้ สุ่มมอบ 1 ในเอฟเฟกต์ต่อไปนี้ให้ปาร์ตี้: เพิ่ม Attack 6.0%/7.8%/7.8%/9.6%/9.6%/11.4%/11.4% (2 เทิร์น), เพิ่มดาเมจ 5.0%/6.5%/6.5%/8.0%/8.0%/9.5%/9.5% (2 เทิร์น), เพิ่ม CRIT Rate 4.0%/5.2%/5.2%/6.4%/6.4%/7.6%/7.6% (2 เทิร์น) เอฟเฟกต์เหล่านี้ไม่สะสม Tailor-Made ×120%, Standard ×100%, Basic ×50% ต่อ Cocktail ที่ได้รับทุก 2 stack ลดเวลาคูลดาวน์ของ Yumi 1 เทิร์น',]},
      {name:'Starrynight Soothsayer', stars:4, hp:1823, atk:587, def:320, bonusStats:{atk:24},
        abilityName:'Seductive Kiss',
        ability:["Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. After using a skill, increase main target's damage by 4.8%/6.0%/6.0%/7.2%/7.2%/8.4%/8.4% for 2 turns. If this skill spends Cocktails, increase damage by 3.6%/4.5%/4.5%/5.4%/5.4%/6.3%/6.3% more."],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังใช้สกิล เพิ่มดาเมจของเป้าหมายหลัก 4.8%/6.0%/6.0%/7.2%/7.2%/8.4%/8.4% 2 เทิร์น หากสกิลนี้ใช้ Cocktail เพิ่มดาเมจ 3.6%/4.5%/4.5%/5.4%/5.4%/6.3%/6.3% เพิ่มเติม',
        ]},
    ],
  },
  {name:'Marian', codename:'Marian', role:'Medic', element:'Bless', rarity:5,
    cards:['Love 4pc','Opulence 2pc'], weapon:'Best HP% Bless healing weapon (Angel Heart)',
    statPrio:['HP%','Healing Effect%','DEF%'], note:'Bless Medic. All skills scale with Minami\'s max HP. Diagnosis stacks (up to 2) amplify Compassionate Cure\'s healing targets and grant party max HP buffs. Guardian of Life revives 1 ally once per battle.',
    mechanics: "การฮีลทั้งหมดสเกลตาม max HP ของ Minami (ไม่ใช่ ATK) — สะสม HP% ในทุก slot Diagnosis stack (สูงสุด 2) สะสมตอนเริ่มต้นการต่อสู้และทุกครั้งที่ HP ของ ally ลดต่ำกว่า 70% Compassionate Cure ใช้ Diagnosis stack ทั้งหมดเพื่อฮีลหลายเป้าและให้ปาร์ตี้ max HP up (+7.5% max HP ของ Minami ต่อ stack) Guardian of Life (M5) ฟื้นคืน ally ที่ KO อัตโนมัติ 1 คน ที่ HP 40% ของ Minami + 1200 ได้ 1 ครั้ง/การต่อสู้ Health Comes First passive ให้ ally ที่ฮีล +15% (สูงสุด +30% กับ Blessing) DMG เป็นเวลา 1 เทิร์น",
    rotation: [
      "เทิร์น 1 → Healing Grace (ฮีล 2 ally, กำจัด 2 debuff, ให้ Blessing + Diagnosis; ดีที่สุดต้นเกมสำหรับ proactive healing)",
      "เทิร์น 2 → Nurse's Light (Bless DMG + Blessing stack ให้ปาร์ตี้ + 1 Diagnosis)",
      "ครบ 2 Diagnosis → Compassionate Cure (ฮีลหลายเป้า + max HP up ปาร์ตี้ 2T; ดีที่สุดก่อนช่วงโดนหนัก)",
      "ใช้ Highlight เมื่อพร้อม → ฮีลปาร์ตี้ + max HP buff + ฮีลต่อเนื่อง 1 เทิร์น",
      "ให้ความสำคัญ HP% ในทุก card slot — ค่าฮีลและ Guardian of Life revival ล้วนสเกลตาม max HP",
      "ใช้ Blessing บน DPS หลักก่อน Highlight เพื่อ +30% DMG bonus ผ่าน Health Comes First",
    ],
    realName:'Minami Miyashita', persona:'Thalia',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'wk',
      Curse:'normal', Bless:'res', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:"Nurse's Light", type:'Skill', element:'Bless', sp:20,
        desc:"Deal Bless damage to 1 foe equal to 56.9%/62.7%/60.4%/66.2% of Minami's max HP, and grant 1 Blessing stack to all allies. Grant Minami 1 Diagnosis stack.",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 56.9%/62.7%/60.4%/66.2% ของ HP สูงสุด Minami และมอบ Blessing 1 stack ให้พันธมิตรทุกคน มอบ Diagnosis 1 stack ให้ Minami"},
      {name:'Healing Grace', type:'Skill', element:'-', sp:25, isBuff:true,
        desc:"Restore HP equal to 17.4%/17.4%/18.5%/18.5% of Minami's max HP + 1488/1809/1829/2151 to the ally with the lowest HP and 1 selected ally, and cure 2 debuffs. Grant 1 Blessing stack to healed allies and grant Minami 1 Diagnosis. For 2 turns, restore HP of healed allies at start of each turn equal to 13.9%/13.9%/14.8%/14.8% of Minami's max HP + 1190/1447/1463/1720.",
        descTh:"ฟื้นฟู HP พันธมิตรที่มี HP ต่ำสุดและพันธมิตร 1 คนที่เลือก 17.4%/17.4%/18.5%/18.5% ของ HP สูงสุด Minami + 1488/1809/1829/2151 และรักษาดีบัฟ 2 ชนิด มอบ Blessing 1 stack ให้พันธมิตรที่รักษา และมอบ Diagnosis 1 stack ให้ Minami เป็นเวลา 2 เทิร์น ฟื้นฟู HP ของพันธมิตรที่รักษาต้นแต่ละเทิร์น 13.9%/13.9%/14.8%/14.8% ของ HP สูงสุด Minami + 1190/1447/1463/1720"},
      {name:'Compassionate Cure', type:'Skill', element:'-', sp:32, isBuff:true,
        desc:"Spend all Diagnosis stacks. Restore HP to 1 selected ally and the lowest HP ally (2 times) equal to 15.8%/15.8%/16.8%/16.8% of Minami's max HP + 1347/1638/1656/1947. For each Diagnosis stack spent, activate this healing 1 more time, and increase max HP of allies (other than Minami) by 7.5% of Minami's max HP for 2 turns (up to 1057/1057/1226/1226 per stack).",
        descTh:"ใช้ Diagnosis stack ทั้งหมด ฟื้นฟู HP พันธมิตร 1 คนที่เลือกและพันธมิตรที่มี HP ต่ำสุด (2 ครั้ง) 15.8%/15.8%/16.8%/16.8% ของ HP สูงสุด Minami + 1347/1638/1656/1947 ต่อ Diagnosis stack ที่ใช้ เปิดใช้การรักษานี้เพิ่ม 1 ครั้ง และเพิ่ม HP สูงสุดของพันธมิตร (ยกเว้น Minami) 7.5% ของ HP สูงสุด Minami 2 เทิร์น (สูงสุด 1057/1057/1226/1226 ต่อ stack)"},
      {name:'HIGHLIGHT', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Restore party's HP by 17.6%/17.6%/18.6%/18.6% of Minami's max HP + 1500/1824/1844/2168, and cure 1 debuff. Increase party's max HP by 16.5% of Minami's max HP (up to 2326/2326/2697/2697) for 2 turns. At end of each action, restore HP equal to 6.5%/6.5%/6.9%/6.9% of Minami's max HP + 556/676/683/803 for 1 turn. [4-turn cooldown]",
        descTh:"ฟื้นฟู HP ของปาร์ตี้ 17.6%/17.6%/18.6%/18.6% ของ HP สูงสุด Minami + 1500/1824/1844/2168 และรักษาดีบัฟ 1 ชนิด เพิ่ม HP สูงสุดของปาร์ตี้ 16.5% ของ HP สูงสุด Minami (สูงสุด 2326/2326/2697/2697) 2 เทิร์น เมื่อสิ้นสุดแต่ละแอ็คชัน ฟื้นฟู HP 6.5%/6.5%/6.9%/6.9% ของ HP สูงสุด Minami + 556/676/683/803 เป็นเวลา 1 เทิร์น [Cooldown: 4 เทิร์น]"},
      {name:'Health Comes First', type:'Passive', element:'-', sp:0,
        desc:"After Minami heals an ally, increase that ally's damage by 15.0% + (3.0% × target's Blessing stacks) for 1 turn (up to 30%).",
        descTh:"หลัง Minami รักษาพันธมิตร เพิ่มดาเมจของพันธมิตรนั้น 15.0% + (3.0% × Blessing stack ของเป้าหมาย) 1 เทิร์น (สูงสุด 30%)"},
      {name:'Peace of Mind', type:'Passive', element:'-', sp:0,
        desc:"At the start of battle, increase party's max HP by 10.0% of Minami's max HP (up to 1500).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ เพิ่ม HP สูงสุดของปาร์ตี้ 10.0% ของ HP สูงสุด Minami (สูงสุด 1500)"},
    ],
    awareness:[
      {name:"Nurse's Oath",
        desc:"At the start of battle, gain 1 Diagnosis stack. On Minami's action, if any ally's HP is below 70%, gain 1 Diagnosis stack (max 2 stacks).",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Diagnosis 1 stack ในแอ็คชันของ Minami หาก HP ของพันธมิตรใดต่ำกว่า 70% รับ Diagnosis 1 stack (สูงสุด 2 stack)"},
      {name:'Angel in White',
        desc:"When healing allies above max HP, increase the target's pierce rate by 20% for 2 turns.",
        descTh:"เมื่อรักษาพันธมิตรเกิน HP สูงสุด เพิ่ม pierce rate ของเป้าหมาย 20% 2 เทิร์น"},
      {name:'Clinical Care',
        desc:"When using Healing Grace, heal 1 more ally. If the target's HP is below 50%, increase healing effect by 20%.",
        descTh:"เมื่อใช้ Healing Grace รักษาพันธมิตรเพิ่มอีก 1 คน หาก HP เป้าหมายต่ำกว่า 50% เพิ่มผลการรักษา 20%"},
      {name:'Practical Care',
        desc:"Increase the skill levels of Healing Grace and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Healing Grace และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Nursing Practice',
        desc:"Highlight Enhanced: The duration of the max HP increase and healing effect at end of action are extended by 1 turn.",
        descTh:"Highlight เสริม: ขยายระยะเวลาการเพิ่ม HP สูงสุดและการรักษาเมื่อสิ้นสุดแอ็คชันออกไป 1 เทิร์น"},
      {name:'Undying Devotion',
        desc:"Increase the skill levels of Nurse's Light and Compassionate Cure by 3.",
        descTh:"เพิ่มระดับสกิล Nurse's Light และ Compassionate Cure ขึ้น 3 ระดับ"},
      {name:'Guardian of Life',
        desc:"Restore a KO'd ally's HP equal to 40% of Minami's max HP + 1200. This effect can be activated once per battle.",
        descTh:"ฟื้นฟู HP ของพันธมิตรที่ KO เท่ากับ 40% ของ HP สูงสุด Minami + 1200 เอฟเฟกต์นี้เปิดใช้ได้ครั้งเดียวต่อการต่อสู้"},
    ],
    baseStats: {hp:368, atk:80, def:59, spd:94},
    baseStatsLv80: [
      {hp:4140, atk:910, def:673, spd:0},
      {hp:4214, atk:926, def:685, spd:0},
      {hp:4289, atk:943, def:697, spd:0},
      {hp:4363, atk:959, def:709, spd:0},
      {hp:4438, atk:976, def:722, spd:0},
      {hp:4513, atk:992, def:734, spd:0},
      {hp:4587, atk:1008, def:746, spd:0},
    ],
    hiddenAbility: 'Healing Effect +20.9%',
    weapons:[
      {name:'Angel Heart', stars:5,
        hp:2735, atk:601, def:445,
        bonusStats:{hp:30},
        abilityName:'Angel Heart',
        ability:[
          'Increase max HP by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When Minami has Diagnosis, increase healing effect by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0%.',
          "When spending Diagnosis, increase party's damage by 25.0%/33.0%/33.0%/41.0%/41.0%/49.0%/49.0% for 1 turn.",],
        abilityTh:[
          'เพิ่ม HP สูงสุด 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อ Minami มี Diagnosis เพิ่มผลการรักษา 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0%',
          'เมื่อใช้ Diagnosis เพิ่มดาเมจของปาร์ตี้ 25.0%/33.0%/33.0%/41.0%/41.0%/49.0%/49.0% 1 เทิร์น',
        ]},
      {name:'Hymn of Life', stars:4,
        hp:2188, atk:481, def:356,
        bonusStats:{},
        abilityName:'Hymn of Life',
        ability:[
          "Increase healing effect by 8.7%/8.7%/11.3%/11.3%/13.9%/13.9%/16.5%.",
          "Increase continuous healing effect by 28.5%/37.0%/37.0%/45.5%/45.5%/54.0%/54.0%.",
          "After using a healing skill, 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0% chance to grant Blessing to the main target.",
        ],
        abilityTh:[
          'เพิ่มผลการรักษา 8.7%/8.7%/11.3%/11.3%/13.9%/13.9%/16.5%',
          'เพิ่มผลการรักษาต่อเนื่อง 28.5%/37.0%/37.0%/45.5%/45.5%/54.0%/54.0%',
          'หลังใช้สกิลรักษา มีโอกาส 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0% มอบ Blessing ให้เป้าหมายหลัก',
        ]},
    ],
  },
  {name:'Makoto',             codename:'makoto',         role:'Assassin',   element:'Fire',           rarity:5, cards:['Courage 4pc','Triumph 2pc'],    weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Fire DMG%'],     note:'Fire Assassin variant. Moon Phase stacks → Scarlet Hades burst. Dual Theurgy (Ardhanari + Cadenza). Strong with ally buff support.',
    mechanics: "Moon Phase stack (สูงสุด 4, คงอยู่ 2 เทิร์น) สะสมจาก Melody of Flames (2 stack/ครั้ง) และ Nocturne of Battle (2 stack/ครั้ง) Scarlet Hades ใช้ Moon Phase ทั้งหมดเพื่อ (stack) hits แล้วใช้ Full Moon stack ทั้งหมดเพื่อ hit เพิ่ม — ที่ 4 stack pierce rate และดาเมจเพิ่มสูงสุด Full Moon stack มาจาก Ardhanari (Fire Theurgy) Cadenza (Theurgy ที่สอง) บัฟ CRIT DMG ปาร์ตี้ + ATK ของ Makoto เอง วงจรที่ดีที่สุดใช้ Theurgy ทั้งสองเพื่อสะสม Moon Phase และ Full Moon ก่อนระเบิดด้วย Scarlet Hades",
    rotation: [
      "เทิร์น 1 → Melody of Flames (Fire DMG + Moon Phase 2 stack; บัฟตัวคูณ Scarlet Hades ถัดไปด้วย)",
      "เทิร์น 2 → Nocturne of Battle (CRIT DMG ปาร์ตี้ + ATK Makoto ขึ้น + Moon Phase 2 stack)",
      "ครบ 4 Moon Phase → Scarlet Hades (4 Fire hit จาก Moon Phase + Full Moon hit; +pierce +DMG เมื่อ stack เต็ม)",
      "ใช้ Ardhanari (Theurgy) ทุกครั้งที่ gauge เต็ม → Full Moon stack +1 สำหรับ hit โบนัสบน Hades ถัดไป",
      "ใช้ Cadenza (Theurgy) สำหรับบัฟ CRIT DMG ปาร์ตี้ก่อนระเบิด Scarlet Hades",
      "เมื่อมี ATK buff จาก ally → Scarlet Hades ของ Makoto คูณทวี; คู่กับ Strategist เพื่อ output สูงสุด",
    ],
    realName:'Makoto Yuki', affiliation:'S.E.E.S.', persona:'Orpheus',
    weakRes:{ Fire:'res', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'wk', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Melody of Flames',  type:'Skill',    element:'Fire', sp:20,
        desc:"Deal Fire damage to 1 foe equal to 59.8%/66.0%/63.5%/69.6% of Attack (3 hits). Also, gain 2 Moon Phase stacks. This effect lasts for 2 turns, and stacks up to 4 times.\nAlso, when spending Moon Phase to use Scarlet Hades, increase skill multiplier by 32.5%/35.8%/34.5%/37.8% for 2 turns.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 59.8%/66.0%/63.5%/69.6% ของ Attack (3 ครั้ง) และรับ Moon Phase 2 stack เอฟเฟกต์นี้คงอยู่ 2 เทิร์น สะสมสูงสุด 4 ครั้ง\nนอกจากนี้ เมื่อใช้ Moon Phase เพื่อเปิดใช้ Scarlet Hades ให้เพิ่มตัวคูณสกิล 32.5%/35.8%/34.5%/37.8% เป็นเวลา 2 เทิร์น"},
      {name:'Nocturne of Battle',type:'Skill',    element:'-',    sp:20, isBuff:true,
        desc:"Increase party's critical damage by 23.4%/25.8%/24.9%/27.3%, and increase Makoto's Attack by 19.5%/21.5%/20.7%/22.7% for 2 turns.\nAlso, gain 2 Moon Phase stacks. This effect lasts for 2 turns, and stacks up to 4 times.",
        descTh:"เพิ่ม CRIT DMG ของปาร์ตี้ 23.4%/25.8%/24.9%/27.3% และเพิ่ม Attack ของ Makoto 19.5%/21.5%/20.7%/22.7% เป็นเวลา 2 เทิร์น\nนอกจากนี้ รับ Moon Phase 2 stack เอฟเฟกต์นี้คงอยู่ 2 เทิร์น สะสมสูงสุด 4 ครั้ง"},
      {name:'Scarlet Hades',     type:'Skill',    element:'Fire', sp:24,
        desc:"Can be activated with 2 or more Moon Phase stacks. Spend all Moon Phase stacks, and deal Fire damage to 1 foe equal to 91.5%/100.8%/97.1%/106.5% of Makoto's Attack (1 hit per stack spent). Afterwards, spend all Full Moon stacks, and deal Fire damage to 1 foe equal to 150.7%/166.2%/160.0%/175.5% of Makoto's Attack (1 hit per stack spent).\nWhen this skill is activated with 4 Moon Phase stacks, increase Makoto's pierce rate by 11.7%/12.9%/12.4%/13.6%, and increase damage by 24.4%/26.9%/25.9%/28.4%.",
        descTh:"เปิดใช้ได้เมื่อมี Moon Phase stack 2 ขึ้นไป ใช้ Moon Phase stack ทั้งหมด และสร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 91.5%/100.8%/97.1%/106.5% ของ Attack ของ Makoto (1 ครั้งต่อ stack ที่ใช้) จากนั้นใช้ Full Moon stack ทั้งหมด และสร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 150.7%/166.2%/160.0%/175.5% ของ Attack ของ Makoto (1 ครั้งต่อ stack ที่ใช้)\nหากใช้สกิลนี้ด้วย Moon Phase stack 4 อัน เพิ่มอัตรา pierce ของ Makoto 11.7%/12.9%/12.4%/13.6% และเพิ่มความเสียหาย 24.4%/26.9%/25.9%/28.4%"},
      {name:'Ardhanari',         type:'Skill',    element:'Fire', sp:0,
        desc:"Can be activated when Theurgy Gauge is at 100. Deal Fire damage to 1 foe equal to 147.5%/162.6%/156.5%/171.6% of Makoto's Attack (4 hits).\nAlso, gain 1 Full Moon stack. This effect lasts 2 turns, and stacks up to 4 times.",
        descTh:"เปิดใช้ได้เมื่อ Theurgy Gauge อยู่ที่ 100 สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 147.5%/162.6%/156.5%/171.6% ของ Attack ของ Makoto (4 ครั้ง)\nนอกจากนี้ รับ Full Moon 1 stack เอฟเฟกต์นี้คงอยู่ 2 เทิร์น สะสมสูงสุด 4 ครั้ง"},
      {name:'Cadenza',           type:'Skill',    element:'-',    sp:0,  isBuff:true,
        desc:"Can be activated when Theurgy Gauge is at 100. Increase party's Attack by 24.4%/26.9%/25.9%/28.4%, and increase damage by 19.5%/21.5%/20.7%/22.7% for 2 turns. Also, gain 1 Full Moon stack. This effect lasts 2 turns, and stacks up to 4 times.",
        descTh:"เปิดใช้ได้เมื่อ Theurgy Gauge อยู่ที่ 100 เพิ่ม Attack ของปาร์ตี้ 24.4%/26.9%/25.9%/28.4% และเพิ่มความเสียหาย 19.5%/21.5%/20.7%/22.7% เป็นเวลา 2 เทิร์น นอกจากนี้ รับ Full Moon 1 stack เอฟเฟกต์นี้คงอยู่ 2 เทิร์น สะสมสูงสุด 4 ครั้ง"},
      {name:'Assist',            type:'Normal',   element:'-',    sp:0,  isBuff:true,
        desc:"Increase 1 ally's Attack by 20% for 1 turn.",
        descTh:"เพิ่ม Attack ของพันธมิตร 1 คน 20% เป็นเวลา 1 เทิร์น"},
      {name:'On-Site Leader',    type:'Passive',  element:'-',    sp:0,
        desc:"After activating a Theurgy, increase party's Attack by 40.0% for 2 turns. Increase Attack of SEES members by 30.0% more.",
        descTh:"หลังจากเปิดใช้ Theurgy เพิ่ม Attack ของปาร์ตี้ 40.0% เป็นเวลา 2 เทิร์น เพิ่ม Attack ของสมาชิก SEES อีก 30.0%"},
      {name:'Entrusted Hope',    type:'Passive',  element:'-',    sp:0,
        desc:"When receiving buff, healing, or shield skill effects from an ally (excluding effects that also target foes), increase critical damage by 7.2% for 2 turns. Stacks up to 3 times.",
        descTh:"เมื่อได้รับเอฟเฟกต์ buff, การฟื้นฟู หรือ shield จากพันธมิตร (ยกเว้นเอฟเฟกต์ที่มีผลต่อศัตรูด้วย) เพิ่ม CRIT DMG 7.2% เป็นเวลา 2 เทิร์น สะสมได้สูงสุด 3 ครั้ง"},
    ],
    awareness:[
      {name:'Pathfinder',
        desc:'Makoto has 2 Theurgy: Cadenza and Ardhanari. At the start of battle, if Makoto\'s Theurgy Gauge is below 35, fill up to 35.\nWhen receiving buff, healing, or shield skill effects from an ally (excluding effects that also target foes), gain 1 Moon Phase stack (up to 1 stack per turn). This effect lasts for 2 turns, and stacks up to 4 times.\nWith Moon Phase, increase pierce rate by 4%/8%/12% (effect changes at Lv. 1/50/70, respectively).',
        descTh:'Makoto มี Theurgy 2 แบบ: Cadenza และ Ardhanari เมื่อเริ่มต้นการต่อสู้ หาก Theurgy Gauge ของ Makoto ต่ำกว่า 35 ให้เติมจนถึง 35\nเมื่อได้รับเอฟเฟกต์ buff, การฟื้นฟู หรือ shield จากพันธมิตร (ยกเว้นเอฟเฟกต์ที่มีผลต่อศัตรูด้วย) รับ Moon Phase 1 stack (สูงสุด 1 stack ต่อเทิร์น) เอฟเฟกต์นี้คงอยู่ 2 เทิร์น สะสมสูงสุด 4 ครั้ง\nเมื่อมี Moon Phase เพิ่มอัตรา pierce 4%/8%/12% (เปลี่ยนที่ Lv. 1/50/70)'},
      {name:'Result of Coincidence',
        desc:'Additional effects are added to the following skills.\nMelody of Flames: This skill deals 1 more hit of Fire damage.\nNocturne of Battle: Increase party\'s pierce rate by 10% for 2 turns.\nScarlet Hades: When this skill is activated with 4 Moon Phase stacks, increase Makoto\'s critical rate by 16%.',
        descTh:'เพิ่มเอฟเฟกต์ให้กับสกิลต่อไปนี้\nMelody of Flames: สกิลนี้โจมตีธาตุไฟเพิ่มอีก 1 ครั้ง\nNocturne of Battle: เพิ่มอัตรา pierce ของปาร์ตี้ 10% เป็นเวลา 2 เทิร์น\nScarlet Hades: เมื่อใช้สกิลนี้ด้วย Moon Phase stack 4 อัน เพิ่ม CRIT Rate ของ Makoto 16%'},
      {name:'Immovable Soul',
        desc:'When Makoto has 4 Moon Phase stacks on his action, automatically activate Nocturne of Battle 1 time.\nCooldown time: 1 turn.',
        descTh:'เมื่อ Makoto มี Moon Phase stack 4 อันในเทิร์นของตน จะเปิดใช้ Nocturne of Battle อัตโนมัติ 1 ครั้ง\nCooldown: 1 เทิร์น'},
      {name:'Under the Full Moon',
        desc:'Increase the skill levels of Scarlet Hades and Combat Tactics by 3.',
        descTh:'เพิ่มระดับสกิล Scarlet Hades และ Combat Tactics ขึ้น 3'},
      {name:'Thorny Path',
        desc:'Additional effects are added to the following Theurgy.\nCadenza: Increase party\'s damage by 10% more for 2 turns.\nArdhanari: This skill deals 2 more hits of Fire damage.',
        descTh:'เพิ่มเอฟเฟกต์ให้กับ Theurgy ต่อไปนี้\nCadenza: เพิ่มความเสียหายของปาร์ตี้ 10% เพิ่มเติมเป็นเวลา 2 เทิร์น\nArdhanari: สกิลนี้โจมตีธาตุไฟเพิ่มอีก 2 ครั้ง'},
      {name:'Soul Flames',
        desc:'Increase the skill levels of Melody of Flames and Nocturne of Battle by 3.',
        descTh:'เพิ่มระดับสกิล Melody of Flames และ Nocturne of Battle ขึ้น 3'},
      {name:'Burn My Dread',
        desc:'When Makoto activates a Theurgy, the effects of the other Theurgy are activated at the same time.\nIncrease skill damage dealt by spending Full Moon stacks with Scarlet Hades by 35%.\nThe first time that Makoto takes fatal damage, he enters a special near-death state and survives with 1 HP, and will be KO\'d at the end of the turn. If Makoto\'s HP is restored above 25%, this state is removed.',
        descTh:'เมื่อ Makoto เปิดใช้ Theurgy เอฟเฟกต์ของ Theurgy อีกตัวจะถูกเปิดใช้พร้อมกัน\nเพิ่มความเสียหายจากการใช้ Full Moon stack ด้วย Scarlet Hades 35%\nครั้งแรกที่ Makoto โดนโจมตีถึงตาย จะเข้าสู่สภาวะใกล้ตายพิเศษและรอดด้วย HP 1 และจะถูก KO เมื่อสิ้นสุดเทิร์น หาก HP ของ Makoto ถูกฟื้นฟูเกิน 25% สภาวะนี้จะถูกยกเลิก'},
    ],
    baseStats:     {hp:292, atk:105, def:52, spd:98},
    baseStatsLv80: [
      {hp:3270, atk:1190, def:593, spd:98},
      {hp:3329, atk:1212, def:604, spd:98},
      {hp:3388, atk:1233, def:615, spd:98},
      {hp:3447, atk:1254, def:625, spd:98},
      {hp:3505, atk:1276, def:636, spd:98},
      {hp:3564, atk:1297, def:647, spd:98},
      {hp:3623, atk:1319, def:657, spd:98},
    ],
    hiddenAbility: 'ATK +29%',
    weapons:[
      {
        name: 'Deus Xiphos', stars:5,
        hp: 2160, atk: 786, def: 392,
        bonusStats: {atk:30},
        abilityName: 'Hour of Reversal',
        ability: [
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'For every 3 Moon Phase or Full Moon stacks gained, increase critical rate by 16.3%/21.2%/21.2%/26.1%/26.1%/31.0%/31.0% for 2 turns.',
          'When Makoto deals 4 or more hits of damage with 1 skill or Theurgy, increase that skill or Theurgy\'s damage by 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0%.',],
        abilityTh: [
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'ทุกๆ การสะสม Moon Phase หรือ Full Moon 3 stack เพิ่ม CRIT Rate 16.3%/21.2%/21.2%/26.1%/26.1%/31.0%/31.0% เป็นเวลา 2 เทิร์น',
          'เมื่อ Makoto สร้างความเสียหาย 4 ครั้งขึ้นไปด้วยสกิลหรือ Theurgy เดียว เพิ่มความเสียหายของสกิลหรือ Theurgy นั้น 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0%',
        ],
      },
      {
        name: 'Translucent Blade', stars:4,
        hp: 1729, atk: 629, def: 314,
        bonusStats: {atk:12},
        abilityName: 'Silent Resolve',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When Makoto grants a buff to an ally, increase party\'s damage by 8.8%/11.6%/11.6%/14.4%/14.4%/17.2%/17.2%, and also increase Makoto\'s damage by 8.8%/11.6%/11.6%/14.4%/14.4%/17.2%/17.2% more for 2 turns.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อ Makoto ให้ buff แก่พันธมิตร เพิ่มความเสียหายของปาร์ตี้ 8.8%/11.6%/11.6%/14.4%/14.4%/17.2%/17.2% และเพิ่มความเสียหายของ Makoto อีก 8.8%/11.6%/11.6%/14.4%/14.4%/17.2%/17.2% เป็นเวลา 2 เทิร์น',
        ],
      },
    ],
  },
  {name:'Closer (Tropical)', codename:'closer-tropical', role:'Sweeper', element:'Bless', rarity:5,
    cards:['Courage 4pc','Virtue 2pc'], weapon:'Best HP/Bless ATK weapon',
    statPrio:['HP%','ATK%','CRIT Rate%'], note:'Bless Sweeper. Surf \'n\' Shine enters Summer Hype and enables HP-spending bonus hits on all skills. Outshine the Sun! converts max HP into flat ATK. Tropical Heart (5 heals) resets Surf \'n\' Shine cooldown.',
    mechanics: "Surf 'n' Shine เข้าสู่ Summer Hype 3 เทิร์น — ใน Summer Hype ทักษะทุกอย่างสามารถหัก HP เพื่อ extra bonus hit (HP หักเมื่อโบนัสเปิดใช้งาน) Tropical Heart ติดตามการฮีลที่รับ: ครบ 5 ครั้ง → Surf 'n' Shine ฟื้นโดยไม่เสีย SP ป้องกัน KO จากการหัก HP ซ้ำ Outshine the Sun! แปลง max HP ส่วนเกินเป็น flat ATK ถาวร (จนถึง cap) — สะสมทั้ง HP% เพื่อ survive/scaling และ ATK% เพื่อ multiplier โดยตรง",
    rotation: [
      "เทิร์น 1 → Surf 'n' Shine (เข้า Summer Hype; ทุกทักษะได้ HP-spending bonus hit 3 เทิร์น)",
      "ใน Summer Hype: ใช้ Bless skill เพื่อ extra hit — ให้ความสำคัญทักษะ SP สูงสุดเพื่อ bonus hit มากสุด",
      "ติดตาม Tropical Heart (จำนวนฮีลที่รับ); ครบ 5 → Surf 'n' Shine ฟื้นฟรีไม่เสีย SP",
      "ใช้ Outshine the Sun! เพื่อแปลง max HP เป็น flat ATK ถาวร ทุกครั้งที่ใช้ได้",
      "ใช้ Highlight เมื่อพร้อม → Bless DMG ใหญ่ + บัฟ ATK ตัวเอง + DMG up ปาร์ตี้ใน Summer Hype",
      "คู่กับฮีลเลอร์เพื่อ reset Tropical Heart เร็วขึ้น — reset มากขึ้น = Summer Hype uptime นานขึ้น",
    ],
    realName:'Tropical Motoha', persona:'Awilda',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'wk',
      Curse:'normal', Bless:'res', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Blue Sunrise', type:'Skill', element:'Bless', sp:20,
        desc:"Deal Bless damage to all foes equal to 87.8%/96.8%/93.2%/102.2% of Attack. If Summer Hype is active, spend 10% of Tropical Motoha's max HP to deal bonus Bless damage to all foes equal to 29.3%/32.3%/31.1%/34.1% of Attack.",
        descTh:"ดีลดาเมจแสงต่อศัตรูทุกตัว 87.8%/96.8%/93.2%/102.2% ของ Attack หาก Summer Hype ใช้งานอยู่ ใช้ HP สูงสุด 10% ของ Tropical Motoha เพื่อดีลดาเมจแสงโบนัสต่อศัตรูทุกตัว 29.3%/32.3%/31.1%/34.1% ของ Attack"},
      {name:"Summer 'Splosion", type:'Skill', element:'Bless', sp:20,
        desc:"Deal Bless damage to 1 foe equal to 136.6%/150.6%/145.0%/159.0% of Attack, and restore 20% of Tropical Motoha's max HP. If Summer Hype is active, deal bonus Bless damage to 1 foe equal to 34.2%/37.7%/36.3%/39.8% of Attack.",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 136.6%/150.6%/145.0%/159.0% ของ Attack และฟื้นฟู HP สูงสุด 20% ของ Tropical Motoha หาก Summer Hype ใช้งานอยู่ ดีลดาเมจแสงโบนัสต่อศัตรู 1 ตัว 34.2%/37.7%/36.3%/39.8% ของ Attack"},
      {name:"Surf 'n' Shine", type:'Skill', element:'Bless', sp:24,
        desc:"Immediately enter Summer Hype (lasts until end of Tropical Motoha's next turn). Spend 15% of her max HP to deal Bless damage to all foes equal to 159.7%/176.0%/169.5%/185.8% of Attack. [1-turn cooldown]\nSummer Hype: CRIT Rate +9.8%/9.8%/10.4%/10.4% and damage +29.3%/29.3%/31.1%/31.1%.",
        descTh:"เข้าสู่ Summer Hype ทันที (คงจนสิ้นสุดเทิร์นถัดไปของ Tropical Motoha) ใช้ HP สูงสุด 15% ดีลดาเมจแสงต่อศัตรูทุกตัว 159.7%/176.0%/169.5%/185.8% ของ Attack [Cooldown: 1 เทิร์น]\nSummer Hype: CRIT Rate +9.8%/9.8%/10.4%/10.4% และดาเมจ +29.3%/29.3%/31.1%/31.1%"},
      {name:'HIGHLIGHT', type:'Skill', element:'Bless', sp:0,
        desc:"Deal Bless damage to all foes equal to 195.2%/215.2%/207.2%/227.2% of Attack, and restore 20% of Tropical Motoha's max HP. If her HP is above 50%, increase Highlight damage by 25%. [4-turn cooldown]",
        descTh:"ดีลดาเมจแสงต่อศัตรูทุกตัว 195.2%/215.2%/207.2%/227.2% ของ Attack และฟื้นฟู HP สูงสุด 20% ของ Tropical Motoha หาก HP เกิน 50% เพิ่มดาเมจ Highlight 25% [Cooldown: 4 เทิร์น]"},
      {name:'Energy Overload!', type:'Passive', element:'-', sp:0,
        desc:"When Tropical Motoha receives healing, increase damage by 30.0% for 2 turns.",
        descTh:"เมื่อ Tropical Motoha รับการรักษา เพิ่มดาเมจ 30.0% เป็นเวลา 2 เทิร์น"},
      {name:'Outshine the Sun!', type:'Passive', element:'-', sp:0,
        desc:"During battle, increase Tropical Motoha's Attack by 24 points for every 100 points of max HP above 8000 (up to 1920).",
        descTh:"ระหว่างการต่อสู้ เพิ่ม Attack ของ Tropical Motoha 24 จุดต่อ HP สูงสุด 100 จุดที่เกิน 8000 (สูงสุด 1920)"},
    ],
    awareness:[
      {name:'Summer Starts Here!',
        desc:"When receiving healing, gain +25% damage for 2 turns. After receiving healing 5 times total, gain Tropical Heart (Blessing healing counts once per turn). While Tropical Heart is active, Surf 'n' Shine can be used with no cooldown by spending Tropical Heart; afterwards there is a 1-turn lockout before Tropical Heart can be gained again. HP-spending skills will not KO Tropical Motoha.",
        descTh:"เมื่อรับการรักษา เพิ่มดาเมจ +25% 2 เทิร์น หลังรับการรักษารวม 5 ครั้ง รับ Tropical Heart (การรักษาจาก Blessing นับครั้งเดียวต่อเทิร์น) ขณะมี Tropical Heart สามารถใช้ Surf 'n' Shine โดยไม่มี cooldown โดยใช้ Tropical Heart หลังจากนั้นต้องรอ 1 เทิร์นก่อนรับ Tropical Heart ใหม่ สกิลที่ใช้ HP จะไม่ทำให้ Tropical Motoha ถูก KO"},
      {name:'Exciting Summer!',
        desc:"When Summer Hype is active, increase CRIT Rate by 10% and CRIT DMG by 25%. On Tropical Motoha's action, increase Tropical Heart's healing counter by 1 and gain 1 Blessing.",
        descTh:"เมื่อ Summer Hype ใช้งานอยู่ เพิ่ม CRIT Rate 10% และ CRIT DMG 25% ในแอ็คชันของ Tropical Motoha เพิ่ม healing counter ของ Tropical Heart 1 และรับ 1 Blessing"},
      {name:'Stay Cool!',
        desc:"When Tropical Motoha receives healing, increase CRIT DMG by 20% for 2 turns (stacks up to 2 times). During battle, increase her max HP by 1200.",
        descTh:"เมื่อ Tropical Motoha รับการรักษา เพิ่ม CRIT DMG 20% 2 เทิร์น (สะสมสูงสุด 2 ครั้ง) ระหว่างการต่อสู้ เพิ่ม HP สูงสุด 1200"},
      {name:"Catch the Wave!",
        desc:"Increase the skill levels of Summer 'Splosion and Surf 'n' Shine by 3.",
        descTh:"เพิ่มระดับสกิล Summer 'Splosion และ Surf 'n' Shine ขึ้น 3 ระดับ"},
      {name:'The Fun Never Ends!',
        desc:"Highlight Enhanced: After using a Highlight, increase the next Surf 'n' Shine's damage by 80%.",
        descTh:"Highlight เสริม: หลังใช้ Highlight เพิ่มดาเมจ Surf 'n' Shine ถัดไป 80%"},
      {name:'Another Perfect Day!',
        desc:"Increase the skill levels of Blue Sunrise and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Blue Sunrise และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Everlasting Summer!',
        desc:"Tropical Heart is not spent after using Surf 'n' Shine. Summer Hype enhances to Summer Blowout: Blue Sunrise bonus damage activates 3 times, Summer 'Splosion restores 20% more max HP, and Surf 'n' Shine damage multiplier +50%.",
        descTh:"Tropical Heart ไม่ถูกใช้หลังใช้ Surf 'n' Shine Summer Hype เพิ่มพลังเป็น Summer Blowout: ดาเมจโบนัสของ Blue Sunrise เปิดใช้ 3 ครั้ง Summer 'Splosion ฟื้นฟู HP สูงสุดเพิ่มอีก 20% และตัวคูณดาเมจของ Surf 'n' Shine +50%"},
    ],
    baseStats: {hp:352, atk:95, def:48, spd:96},
    baseStatsLv80: [
      {hp:3960, atk:1070, def:547, spd:0},
      {hp:4031, atk:1089, def:556, spd:0},
      {hp:4102, atk:1108, def:567, spd:0},
      {hp:4174, atk:1128, def:576, spd:0},
      {hp:4245, atk:1147, def:586, spd:0},
      {hp:4317, atk:1166, def:596, spd:0},
      {hp:4388, atk:1185, def:606, spd:0},
    ],
    hiddenAbility: 'HP% +29%',
    weapons:[
      {name:'Colorful Coast', stars:5,
        hp:2616, atk:707, def:361,
        bonusStats:{edm:24},
        abilityName:'Colorful Coast',
        ability:[
          'Increase Bless damage by 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%.',
          'When Summer Hype is active, increase critical damage by 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0%.',
          "When using Surf 'n' Shine while Summer Hype is active, increase that skill's damage by 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0% and gain 1 Sunlight stack.",
          'When using a skill or Highlight, spend 1 Sunlight stack to increase the skill\'s damage by the same amount. Damage increases from Summer Hype and Sunlight will not stack.',],
        abilityTh:[
          'เพิ่มดาเมจแสง 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%',
          'เมื่อ Summer Hype ใช้งานอยู่ เพิ่ม CRIT DMG 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0%',
          "เมื่อใช้ Surf 'n' Shine ขณะ Summer Hype ใช้งานอยู่ เพิ่มดาเมจสกิลนั้น 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0% และรับ Sunlight 1 stack",
          'เมื่อใช้สกิลหรือ Highlight ใช้ Sunlight 1 stack เพิ่มดาเมจสกิลนั้นในจำนวนเดียวกัน การเพิ่มดาเมจจาก Summer Hype และ Sunlight ไม่สะสมกัน',
        ]},
      {name:'Bubble Puff Star', stars:4,
        hp:2093, atk:566, def:289,
        bonusStats:{atk:24},
        abilityName:'Bubble Puff Star',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When receiving healing while Summer Hype is active, increase damage by 7.6%/9.9%/9.9%/12.2%/12.2%/14.5%/14.5% for 2 turns. Stacks up to 2 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อรับการรักษาขณะ Summer Hype ใช้งานอยู่ เพิ่มดาเมจ 7.6%/9.9%/9.9%/12.2%/12.2%/14.5%/14.5% 2 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ]},
    ],
  },
  {name:'Rin (Firecracker)',  codename:'rin-firecracker',role:'Sweeper',    element:'Fire',           rarity:5, cards:['Power 4pc','Courage 2pc'],      weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],     note:'Fire Sweeper variant. Festive alternate version of Rin.',
    mechanics: "Firecracker Yaoling สะสม Year-End Flames stack บนศัตรู (สูงสุด 4) ผ่านการโจมตีด้วย Fire — แต่ละ stack เพิ่ม DoT damage บนเป้านั้น Flaming Sword Dance เปิดใช้งานช่วงจำกัดเทิร์น เปลี่ยนการโจมตีระยะประชิดเป็น Yanhua Slash (Fire hit โบนัสที่เปิด Fire Technical) ATK เพิ่มขึ้นถาวรระหว่างการต่อสู้ และได้ ATK โบนัสขนาดใหญ่เมื่อเปิด Technical รุ่นนี้เน้น single-target Fire DPS พร้อม stack damage ที่เพิ่มขึ้นเรื่อยๆ ต่างจากบทบาท debuff ของ Rin",
    rotation: [
      "เทิร์น 1 → ใช้ Fire skill เพื่อเริ่มสะสม Year-End Flames stack บนเป้าหลัก",
      "เทิร์น 2 → Flaming Sword Dance (เปิดเพื่อ Yanhua Slash transformation; ช่วง Fire Technical เปิด)",
      "ขณะ Flaming Sword Dance active: ใช้ Fire skill เพื่อ proc Yanhua Slash Technical bonus hit",
      "สะสม Year-End Flames ถึง 4 บนบอสเพื่อ DoT สูงสุด; ต่ออายุ stack ก่อนหมด",
      "ใช้ Highlight เมื่อพร้อม → Fire burst ที่ชาร์จ stack engine และให้ ATK buff ตัวเอง",
      "คู่กับ Fire ally (Panther/Howler) เพื่อ Fire Resonance synergy และ DEF down ร่วมกัน",
    ],
    realName:'Firecracker Yaoling', persona:'Meng Po',
    weakRes:{ Fire:'res', Ice:'normal', Electric:'normal', Wind:'wk', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Scarlet Surprise',     type:'Skill',   element:'Fire', sp:20,
        desc:"Deal Fire damage to all foes equal to 120.4%/132.8%/127.8%/140.2% of Attack, and increase Firecracker Yaoling's critical rate by 10% for 2 turns.\nAlso, for 1 turn, Yanhua Slash deals more Fire damage equal to 72.8%/80.3%/77.3%/84.7% of Attack.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 120.4%/132.8%/127.8%/140.2% ของ Attack และเพิ่ม CRIT Rate ของ Firecracker Yaoling 10% เป็นเวลา 2 เทิร์น\nนอกจากนี้ เป็นเวลา 1 เทิร์น Yanhua Slash จะสร้างความเสียหายธาตุไฟเพิ่มเติม เท่ากับ 72.8%/80.3%/77.3%/84.7% ของ Attack"},
      {name:'Firework Finale',      type:'Skill',   element:'Fire', sp:20,
        desc:"Deal Fire damage to all foes equal to 73.8%/81.3%/78.3%/85.9% of Attack, with a 90% chance to inflict Burn, and a 90% chance to inflict 1 Year-End Flames stack for 2 turns.\nAlso, for 1 turn, Yanhua Slash has a 90% chance to inflict 1 Year-End Flames stack.\nYear-End Flames: Take Fire damage equal to 63.4%/69.9%/67.3%/73.8% of Firecracker Yaoling's Attack for 2 turns. Stacks up to 4 times.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 73.8%/81.3%/78.3%/85.9% ของ Attack โอกาส 90% ทำให้ติด Burn และโอกาส 90% สะสม Year-End Flames 1 stack เป็นเวลา 2 เทิร์น\nนอกจากนี้ เป็นเวลา 1 เทิร์น Yanhua Slash มีโอกาส 90% สะสม Year-End Flames 1 stack\nYear-End Flames: รับความเสียหายธาตุไฟ เท่ากับ 63.4%/69.9%/67.3%/73.8% ของ Attack ของ Firecracker Yaoling เป็นเวลา 2 เทิร์น สะสมสูงสุด 4 ครั้ง"},
      {name:'Orange Blossom Blade', type:'Skill',   element:'-',    sp:24, isBuff:true,
        desc:"Gain Flaming Sword Dance: Increase damage by 34.3%/37.8%/36.4%/39.9%, and melee attack evolves to Yanhua Slash. After activating Yanhua Slash, or at the end of the turn, remove this effect.\nThis skill has a cooldown time of 1 turn, and after using it, other skills can be used on the same turn (this skill is not considered a normal skill).\nYanhua Slash: Deal Fire damage to all foes equal to 127.4%/140.4%/135.2%/148.2% of Attack, and can activate Fire Technicals. When Fireburn is activated, the damage increase effect becomes 20%.",
        descTh:"รับเอฟเฟกต์ Flaming Sword Dance: เพิ่มความเสียหาย 34.3%/37.8%/36.4%/39.9% และเปลี่ยน melee attack เป็น Yanhua Slash หลังจากใช้ Yanhua Slash หรือสิ้นสุดเทิร์น เอฟเฟกต์นี้จะถูกยกเลิก\nสกิลนี้มี cooldown 1 เทิร์น และหลังจากใช้แล้วสามารถใช้สกิลอื่นในเทิร์นเดียวกันได้ (ไม่ถือว่าเป็นสกิลปกติ)\nYanhua Slash: สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 127.4%/140.4%/135.2%/148.2% ของ Attack และสามารถเปิดใช้ Fire Technicals ได้ เมื่อ Fireburn ถูกเปิดใช้ เอฟเฟกต์เพิ่มความเสียหายจะกลายเป็น 20%"},
      {name:'HIGHLIGHT',            type:'Skill',   element:'Fire', sp:0,
        desc:"Deal Fire damage to all foes equal to 226.5%/249.7%/240.5%/263.7% of Attack.\nIncrease Firecracker Yaoling's Attack by 19.5%/21.5%/20.7%/22.7%, and damage dealt by Yanhua Slash by 19.5%/21.5%/20.7%/22.7% for 2 turns.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 226.5%/249.7%/240.5%/263.7% ของ Attack\nเพิ่ม Attack ของ Firecracker Yaoling 19.5%/21.5%/20.7%/22.7% และความเสียหายของ Yanhua Slash 19.5%/21.5%/20.7%/22.7% เป็นเวลา 2 เทิร์น"},
      {name:'Prosperity in Red',    type:'Passive', element:'-',    sp:0,
        desc:"Increase damage to foes inflicted with Burn by 36.0%.",
        descTh:"เพิ่มความเสียหายต่อศัตรูที่ติด Burn 36.0%"},
      {name:'Happy New Year!',      type:'Passive', element:'-',    sp:0,
        desc:"At the start of battle, increase Attack by 42.0% for 2 turns. When Firecracker Yaoling or allies activate a Technical, this effect's duration is reset, and the increase effect becomes 51.0%.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ เพิ่ม Attack 42.0% เป็นเวลา 2 เทิร์น เมื่อ Firecracker Yaoling หรือพันธมิตรเปิดใช้ Technical ระยะเวลาของเอฟเฟกต์นี้จะถูกรีเซ็ต และเอฟเฟกต์เพิ่มจะกลายเป็น 51.0%"},
    ],
    awareness:[
      {name:"New Year's Blast",
        desc:"Firecracker Yaoling's melee attack can evolve to Yanhua Slash. When evolved, deal heavy Fire damage to targets, and can activate Fire Technical. Also, when Fireburn is activated, the damage increase effect becomes 20%.",
        descTh:"melee attack ของ Firecracker Yaoling สามารถพัฒนาเป็น Yanhua Slash ได้ เมื่อพัฒนาแล้ว สร้างความเสียหายธาตุไฟสูงให้เป้าหมาย และสามารถเปิดใช้ Fire Technical ได้ นอกจากนี้ เมื่อ Fireburn ถูกเปิดใช้ เอฟเฟกต์เพิ่มความเสียหายจะกลายเป็น 20%"},
      {name:"Lunar Lanterns",
        desc:"Reduce the first cooldown time for Orange Blossom Blade by 1 turn. Also, extend the duration of Flaming Sword Dance by 1 turn, and Yanhua Slash can be activated up to 2 times. Also, when Flaming Sword Dance is active, enhance Scarlet Surprise and Firework Finale.\nScarlet Surprise: When enhanced, increase the critical damage of Yanhua Slash by 40% more.\nFirework Finale: When enhanced, Yanhua Slash inflicts 1 more Year-End Flames stack.",
        descTh:"ลด cooldown แรกของ Orange Blossom Blade ลง 1 เทิร์น นอกจากนี้ ขยายระยะเวลาของ Flaming Sword Dance 1 เทิร์น และสามารถเปิดใช้ Yanhua Slash ได้สูงสุด 2 ครั้ง เมื่อ Flaming Sword Dance ทำงาน จะ enhance Scarlet Surprise และ Firework Finale\nScarlet Surprise: เมื่อ enhance เพิ่ม CRIT DMG ของ Yanhua Slash อีก 40%\nFirework Finale: เมื่อ enhance Yanhua Slash จะสะสม Year-End Flames เพิ่มอีก 1 stack"},
      {name:"Festival Colors",
        desc:"When Firecracker Yaoling is present, for each foe that appears, permanently inflict 1 special limit-breaking Burn stack. When this Burn is removed, 1 more stack is immediately inflicted. This effect's cooldown time is 2 turns, calculated individually for each foe.\nDuring battle, when 1 foe is inflicted with Burn, increase Firecracker Yaoling's critical rate by 10%. Also, for each additional foe inflicted with Burn, increase by 3% more (up to a maximum of 16%).",
        descTh:"เมื่อ Firecracker Yaoling อยู่ในปาร์ตี้ สำหรับแต่ละศัตรูที่ปรากฏ จะทำให้ติด Burn stack พิเศษ 1 ครั้งถาวร เมื่อ Burn นี้ถูกลบ จะสะสมอีก 1 stack ทันที cooldown ของเอฟเฟกต์นี้คือ 2 เทิร์น คำนวณแยกกันสำหรับแต่ละศัตรู\nระหว่างการต่อสู้ เมื่อศัตรู 1 ตัวติด Burn เพิ่ม CRIT Rate ของ Firecracker Yaoling 10% และสำหรับแต่ละศัตรูที่ติด Burn เพิ่มขึ้นอีก 3% (สูงสุด 16%)"},
      {name:"Cleansing Blaze",
        desc:"Increase the skill levels of Firework Finale and Orange Blossom Blade by 3.",
        descTh:"เพิ่มระดับสกิล Firework Finale และ Orange Blossom Blade ขึ้น 3"},
      {name:"Grand Lion Dance",
        desc:"Highlight Enhanced: Increase Firecracker Yaoling's critical damage by 15% more for 2 turns. Also, extend the duration of all buffs gained from this Highlight by 2 turns.",
        descTh:"Highlight Enhanced: เพิ่ม CRIT DMG ของ Firecracker Yaoling อีก 15% เป็นเวลา 2 เทิร์น นอกจากนี้ ขยายระยะเวลาของ buff ทั้งหมดที่ได้รับจาก Highlight นี้ 2 เทิร์น"},
      {name:"Lucky Red",
        desc:"Increase the skill levels of Scarlet Surprise and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Scarlet Surprise และ Thief Tactics ขึ้น 3"},
      {name:"Sky Lantern Festival",
        desc:"Flaming Sword Dance becomes permanent. Yanhua Slash evolves to Liuxing Slash, increasing damage dealt by 80%. Flaming Sword Dance is not removed even after Liuxing Slash is activated.\nAlso, Scarlet Surprise permanently maintains the critical rate increase and enhanced effects on Liuxing Slash. The duration of Firework Finale's Burn and enhanced effects on Liuxing Slash are extended by 1 turn.",
        descTh:"Flaming Sword Dance กลายเป็นถาวร Yanhua Slash พัฒนาเป็น Liuxing Slash เพิ่มความเสียหาย 80% และ Flaming Sword Dance จะไม่ถูกยกเลิกแม้หลังจากใช้ Liuxing Slash\nนอกจากนี้ Scarlet Surprise จะรักษาเอฟเฟกต์เพิ่ม CRIT Rate และ enhance บน Liuxing Slash อย่างถาวร ระยะเวลาของ Burn และ enhance ของ Firework Finale บน Liuxing Slash จะขยายออก 1 เทิร์น"},
    ],
    baseStats:     {hp:301, atk:106, def:52, spd:95},
    baseStatsLv80: [
      {hp:3390, atk:1200, def:593, spd:95},
      {hp:3451, atk:1222, def:604, spd:95},
      {hp:3512, atk:1243, def:615, spd:95},
      {hp:3573, atk:1265, def:625, spd:95},
      {hp:3634, atk:1286, def:636, spd:95},
      {hp:3695, atk:1308, def:647, spd:95},
      {hp:3756, atk:1330, def:657, spd:95},
    ],
    hiddenAbility: 'ATK +29%',
    weapons:[
      {
        name: "New Year's Light", stars:5,
        hp: 2240, atk: 793, def: 392,
        bonusStats: {atk:30, crit:16},
        abilityName: "New Year's Light",
        ability: [
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When Flaming Sword Dance is active, increase critical rate by 16.0%/21.0%/21.0%/26.0%/26.0%/31.0%/31.0%.',
          'When a Fire Technical is activated, increase that damage by 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0%.',],
        abilityTh: [
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อ Flaming Sword Dance ทำงาน เพิ่ม CRIT Rate 16.0%/21.0%/21.0%/26.0%/26.0%/31.0%/31.0%',
          'เมื่อเปิดใช้ Fire Technical เพิ่มความเสียหายของ Technical นั้น 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0%',
        ],
      },
      {
        name: 'Cleansing Blade', stars:4,
        hp: 1792, atk: 634, def: 314,
        bonusStats: {atk:12},
        abilityName: 'Cleansing Blade',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When using Yanhua Slash, increase Attack by 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0%.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อใช้ Yanhua Slash เพิ่ม Attack 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0%',
        ],
      },
    ],
  },
  {name:'Kiyoshi Kurotani',   codename:'KEY',            role:'Sweeper',    element:'Fire',           rarity:5, cards:['Courage 4pc','Triumph 2pc'],      weapon:'Best HP/Fire DMG weapon',                       statPrio:['HP%','Fire DMG%','ATK%'],                        note:'HP-scaling Fire Sweeper. Damage scales off max HP — stack HP% over ATK%.',
    mechanics: "ดาเมจทักษะทั้งหมดของ Kiyoshi สเกลตาม max HP แทน ATK — สะสม HP% ในทุก card slot และ weapon Chosen One stack (จากการโจมตีศัตรูที่ Burned) เพิ่ม Fire และ elemental ailment damage ถาวร Sacred Flame ติด reactive DoT บนศัตรูตาม max HP และสถานะ Burn — DoT เปิดทุกครั้งที่ศัตรูที่ติดรับดาเมจ Fire เหมาะคู่กับ Fire unit ที่ติด Burn ได้สม่ำเสมอ (Panther, Howler) เพื่อรักษา Sacred Flame uptime และสะสม Chosen One",
    rotation: [
      "เทิร์น 1 → ใช้ Fire skill ที่สเกล HP เพื่อเริ่มสร้างดาเมจ (สเกลตาม max HP ไม่ใช่ ATK)",
      "เทิร์น 2 → Sacred Flame เมื่อศัตรูมี Burn (ติด HP-scaling DoT; เปิดเมื่อรับดาเมจ Fire)",
      "สะสม Chosen One โดยโจมตีเป้าที่ Burned ซ้ำๆ — เพิ่ม Fire DMG ถาวร",
      "รักษา Burn uptime บนเป้าหลักเพื่อ Sacred Flame DoT และสะสม Chosen One",
      "ใช้ Highlight เมื่อพร้อม → Fire burst HP-scaling สูง + บัฟ ATK ตัวเอง",
      "คู่กับ Fire Saboteur (Howler) สำหรับ DEF down; Panther/Howler รักษา Burn บนศัตรู",
    ],
    realName:'Kiyoshi Kurotani', persona:'Syke',
    weakRes:{ Fire:'res', Ice:'normal', Electric:'normal', Wind:'wk', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Ring of Fire',      type:'Skill',   element:'Fire', sp:18,
        desc:"Deal Fire damage to 1 foe equal to 26.2%/28.8%/27.2%/29.9% of Kurotani's max HP and inflict Burn.\nIf the target is Burning, gain 1 Chosen One stack, change target to all foes, decrease damage dealt by half, and inflict Burn.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 26.2%/28.8%/27.2%/29.9% ของ HP สูงสุดของ Kurotani และทำให้ติด Burn\nหากเป้าหมายติด Burn อยู่แล้ว รับ Chosen One 1 stack เปลี่ยนเป้าหมายเป็นศัตรูทุกตัว ลดความเสียหายลงครึ่งหนึ่ง และทำให้ติด Burn"},
      {name:'Crimson Summon',    type:'Skill',   element:'Fire', sp:22,
        desc:"Deal Fire damage to all foes equal to 20.2%/22.3%/21.0%/23.1% of Kurotani's max HP, and activate a Fire Technical. After the attack, based on the number of foes that were inflicted with Burn, gain 2 Chosen One stacks.\nInflict Sacred Flame on Burning foes for 2 turns.\nSacred Flame: When a foe takes an action, deal Fire damage equal to 24.8%/27.3%/25.8%/28.3% of Kurotani's max HP.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรูทุกตัว เท่ากับ 20.2%/22.3%/21.0%/23.1% ของ HP สูงสุดของ Kurotani และเปิดใช้ Fire Technical หลังจากโจมตี รับ Chosen One 2 stack ตามจำนวนศัตรูที่ติด Burn\nทำให้ศัตรูที่ติด Burn ได้รับ Sacred Flame เป็นเวลา 2 เทิร์น\nSacred Flame: เมื่อศัตรูกระทำ สร้างความเสียหายธาตุไฟ เท่ากับ 24.8%/27.3%/25.8%/28.3% ของ HP สูงสุดของ Kurotani"},
      {name:'Cleansing Flame',   type:'Skill',   element:'Fire', sp:22,
        desc:"Deal Fire damage to 1 foe equal to 58.6%/64.6%/61.0%/67.0% of Kurotani's max HP and activate Fire Technical. When main target has Sacred Flame, activate a Technical and increase damage by 30%.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 58.6%/64.6%/61.0%/67.0% ของ HP สูงสุดของ Kurotani และเปิดใช้ Fire Technical เมื่อเป้าหมายหลักมี Sacred Flame เปิดใช้ Technical เพิ่มเติมและเพิ่มความเสียหาย 30%"},
      {name:'HIGHLIGHT',         type:'Skill',   element:'Fire', sp:0,
        desc:"Increase all foes' Fire damage taken by 30.1%/33.1%/31.3%/34.4%, and deal Fire damage equal to 41.5%/45.7%/43.2%/47.4% of Kurotani's max HP. Also inflict Burn on the foes for 2 turns.",
        descTh:"เพิ่มความเสียหายธาตุไฟที่ศัตรูทุกตัวรับ 30.1%/33.1%/31.3%/34.4% และสร้างความเสียหายธาตุไฟ เท่ากับ 41.5%/45.7%/43.2%/47.4% ของ HP สูงสุดของ Kurotani รวมถึงทำให้ศัตรูทุกตัวติด Burn เป็นเวลา 2 เทิร์น"},
      {name:'Uplifting Embers',  type:'Passive', element:'-',    sp:0,
        desc:"Increase Fire damage and elemental ailment damage dealt to foes with Sacred Flame by 6.0%, based on the number of Chosen One stacks.",
        descTh:"เพิ่มความเสียหายธาตุไฟและความเสียหายจาก elemental ailment ต่อศัตรูที่มี Sacred Flame 6.0% ต่อจำนวน Chosen One stack"},
      {name:'Hot to the Touch',  type:'Passive', element:'-',    sp:0,
        desc:"Increase Fire damage based on max HP. Increase by 1% for every 300 HP (up to 9000).",
        descTh:"เพิ่มความเสียหายธาตุไฟตาม HP สูงสุด เพิ่ม 1% ทุกๆ 300 HP (สูงสุดที่ 9000 HP)"},
    ],
    awareness:[
      {name:'Make Sparks Fly',
        desc:"When using a skill, gain 1 Chosen One stack.\nChosen One: Increase the party's Fire damage by 5%. When Kurotani uses a skill, deal damage to Kurotani equal to 4% of his current HP. Lasts 2 turns and stacks up to 5 times.\nThe duration of Chosen One is handled individually for each stack.\nWhile active, change Kurotani's ranged attacks to Fire.",
        descTh:"เมื่อใช้สกิล รับ Chosen One 1 stack\nChosen One: เพิ่มความเสียหายธาตุไฟของปาร์ตี้ 5% เมื่อ Kurotani ใช้สกิล รับความเสียหายเท่ากับ 4% ของ HP ปัจจุบัน คงอยู่ 2 เทิร์น สะสมสูงสุด 5 ครั้ง\nระยะเวลาของ Chosen One นับแยกกันในแต่ละ stack\nขณะที่ทำงาน เปลี่ยนการโจมตีระยะไกลของ Kurotani เป็นธาตุไฟ"},
      {name:'Uncontrollable Power',
        desc:"On Kurotani's action, for each stack of Chosen One, 12% chance to inflict Burn on 1 random foe.",
        descTh:"ในเทิร์นของ Kurotani ต่อ Chosen One stack มีโอกาส 12% ทำให้ศัตรูแบบสุ่ม 1 ตัวติด Burn"},
      {name:'Flaming Phenomenon',
        desc:"On Kurotani's action, for each Burning foe, increase Kurotani's damage by 8% for 1 turn. Counts up to 3 foes.",
        descTh:"ในเทิร์นของ Kurotani ต่อศัตรูที่ติด Burn 1 ตัว เพิ่มความเสียหายของ Kurotani 8% เป็นเวลา 1 เทิร์น นับสูงสุด 3 ตัว"},
      {name:'Repent, Sinner',
        desc:"Increase the skill levels of Ring of Fire and Cleansing Flame by 2.",
        descTh:"เพิ่มระดับสกิล Ring of Fire และ Cleansing Flame ขึ้น 2"},
      {name:'Untold Story',
        desc:"Highlight Enhanced: Increase all foes' Fire damage taken by 30.8%.",
        descTh:"Highlight Enhanced: เพิ่มความเสียหายธาตุไฟที่ศัตรูทุกตัวรับ 30.8%"},
      {name:'Exorcism',
        desc:"Increase the skill levels of Crimson Summon and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Crimson Summon และ Thief Tactics ขึ้น 2"},
      {name:'Contagious Passion',
        desc:"Increase the party's Fire damage by 30% for every 10 Chosen One stacks gained for 2 turns.",
        descTh:"เพิ่มความเสียหายธาตุไฟของปาร์ตี้ 30% ต่อการสะสม Chosen One ทุกๆ 10 stack เป็นเวลา 2 เทิร์น"},
    ],
    baseStats:     {hp:284, atk:60, def:40, spd:99},
    baseStatsLv80: [
      {hp:3195, atk:675, def:450, spd:99},
      {hp:3232, atk:683, def:455, spd:99},
      {hp:3269, atk:691, def:460, spd:99},
      {hp:3306, atk:699, def:465, spd:99},
      {hp:3343, atk:707, def:471, spd:99},
      {hp:3379, atk:715, def:476, spd:99},
      {hp:3416, atk:722, def:481, spd:99},
    ],
    hiddenAbility: 'HP% +21.8%',
    weapons:[
      {
        name: 'Baptism by Fire', stars:5,
        hp: 2814, atk: 595, def: 396,
        bonusStats: {hp:30},
        abilityName: 'Baptism by Fire',
        ability: [
          'Increase max HP by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'When inflicting Burn on a foe, increase target\'s damage taken by 18.0%/23.0%/23.0%/28.0%/28.0%/33.0%/33.0% for 2 turns.',
          'For each Chosen One stack, increase Kurotani\'s damage by 6.0%/7.5%/7.5%/9.0%/9.0%/10.5%/10.5%.',],
        abilityTh: [
          'เพิ่ม HP สูงสุด 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เมื่อทำให้ศัตรูติด Burn เพิ่มความเสียหายที่เป้าหมายรับ 18.0%/23.0%/23.0%/28.0%/28.0%/33.0%/33.0% เป็นเวลา 2 เทิร์น',
          'ต่อ Chosen One stack เพิ่มความเสียหายของ Kurotani 6.0%/7.5%/7.5%/9.0%/9.0%/10.5%/10.5%',
        ],
      },
      {
        name: 'Death Stinger', stars:4,
        hp: 2252, atk: 476, def: 317,
        bonusStats: {hp:12},
        abilityName: 'Death Stinger',
        ability:[
          "Increase max HP by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "Increase Sacred Flame damage by 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0%.",
        ],
        abilityTh: [
          'เพิ่ม HP สูงสุด 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เพิ่มความเสียหายของ Sacred Flame 34.0%/44.0%/44.0%/54.0%/54.0%/64.0%/64.0%',
        ],
      },
    ],
  },
  {name:'Mont (Frostgale)',   codename:'mont-frostgale', role:'Assassin',   element:'Wind',           element2:'Ice', rarity:5, cards:['Courage 4pc','Triumph 2pc'], weapon:'Best Wind/Ice ATK weapon',               statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Dual-element Wind/Ice Assassin variant. Unique frostgale mechanics merge both elements.',
    mechanics: "Frostgale Kotone สลับระหว่าง Spring (Wind) และ Winter (Ice) modes สลับได้ขณะไม่มี Edge active การใช้ Ailes au Vent/Frozen Wings เปิด Spring's/Winter's Edge 1 เทิร์น — ระหว่าง Edge ทุก ally Wind/Ice skill ให้ 1 Vestige stack และโบนัส Edge เฉพาะ (Spring: follow-up Wind hit; Winter: shield ปาร์ตี้) เมื่อ Edge หมด Vestige ทั้งหมดยิงเป็น Resonance burst แต่ละ Vestige ที่ได้เพิ่ม ATK +5% ถาวร (สูงสุด 7 stack = +35%) Swan's Gaze M2: ระหว่าง Edge ศัตรู DEF -40% (Spring) หรือปาร์ตี้ Ice DMG +30% (Winter) — เปิด Edge ก่อนเทิร์น DPS",
    rotation: [
      "Spring mode: Éclat de Vent → Zephyr (AoE, +2 Vestige) → Ailes au Vent (เปิด Spring's Edge → Wind hit ของ ally สะสม Vestige → Resonance burst สิ้นสุด Edge)",
      "Winter mode: Iceburst → Sapphire Storm (AoE Ice) → Frozen Wings (เปิด Winter's Edge → shield + Vestige → Resonance burst)",
      "สลับ mode ตาม party: Ice ally มากกว่า → Winter; Wind ally มากกว่า → Spring",
      "ระหว่าง Spring's Edge: Wind hit ทุก ally สะสม Vestige stack → Resonance burst ใหญ่ขึ้น",
      "ระหว่าง Winter's Edge: Glacial Heart shield ปาร์ตี้ขณะสะสม Vestige stack",
      "Highlight: ใน Edge mode ได้ Vestige เพิ่ม; นอก Edge สร้างดาเมจ bonus +20/35% แทน",
    ],
    realName:'Frostgale Kotone', persona:'Terpsichore',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'res', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'wk' },
    skills:[
      {name:'Éclat de Vent / Iceburst',   type:'Skill',   element:'Wind', sp:24,
        desc:"[Spring] Deal Wind damage to 1 foe equal to 73.8%/81.3%/78.3%/85.9% of Attack (3 hits), with a 30% chance to inflict Windswept. When Spring's Edge is active, also gain 1 Spring's Vestige stack and inflict Spiral Sequence for 2 turns. When Frostgale Kotone attacks a foe with Spiral Sequence, increase critical damage by 29.3%/29.3%/31.1%/31.1%.\n[Winter] Deal Ice damage to 1 foe equal to 152.7%/168.4%/162.1%/177.8% of Attack, with a 97.6%/97.6%/103.6%/103.6% chance to inflict Freeze. If the target is already Frozen, inflict On Ice for 2 turns. Increase Ice damage taken by 13.7%/13.7%/14.5%/14.5% for foes with On Ice.",
        descTh:"[Spring] สร้างความเสียหายธาตุลมให้ศัตรู 1 ตัว เท่ากับ 73.8%/81.3%/78.3%/85.9% ของ Attack (3 ครั้ง) โอกาส 30% ทำให้ติด Windswept เมื่อ Spring's Edge ทำงาน รับ Spring's Vestige 1 stack และทำให้ติด Spiral Sequence 2 เทิร์น เมื่อ Frostgale Kotone โจมตีศัตรูที่มี Spiral Sequence เพิ่ม CRIT DMG 29.3%/29.3%/31.1%/31.1%\n[Winter] สร้างความเสียหายธาตุน้ำแข็งให้ศัตรู 1 ตัว เท่ากับ 152.7%/168.4%/162.1%/177.8% ของ Attack โอกาส 97.6%/97.6%/103.6%/103.6% ทำให้ติด Freeze หากเป้าหมายติด Freeze อยู่แล้ว ทำให้ติด On Ice 2 เทิร์น เพิ่มความเสียหายธาตุน้ำแข็งที่ศัตรูที่ติด On Ice รับ 13.7%/13.7%/14.5%/14.5%"},
      {name:'Zephyr / Sapphire Storm',    type:'Skill',   element:'Wind', sp:24,
        desc:"[Spring] Deal Wind damage to all foes equal to 31.3%/34.5%/33.3%/36.5% of Attack (3 hits). When Spring's Edge is active, also gain 2 Spring's Vestige stacks.\n[Winter] Deal Ice damage to all foes equal to 83.8%/92.4%/89.0%/97.6% of Attack, with a 48.8%/48.8%/51.8%/51.8% chance to inflict Freeze. When Winter's Edge is active, increase this skill's damage by 20%.",
        descTh:"[Spring] สร้างความเสียหายธาตุลมให้ศัตรูทุกตัว เท่ากับ 31.3%/34.5%/33.3%/36.5% ของ Attack (3 ครั้ง) เมื่อ Spring's Edge ทำงาน รับ Spring's Vestige 2 stack\n[Winter] สร้างความเสียหายธาตุน้ำแข็งให้ศัตรูทุกตัว เท่ากับ 83.8%/92.4%/89.0%/97.6% ของ Attack โอกาส 48.8%/48.8%/51.8%/51.8% ทำให้ติด Freeze เมื่อ Winter's Edge ทำงาน เพิ่มความเสียหายของสกิลนี้ 20%"},
      {name:"Ailes au Vent / Frozen Wings", type:'Skill', element:'Wind', sp:28,
        desc:"[Spring] Activate Spring's Edge for 1 turn, and deal Wind damage to 1 foe equal to 92.8%/102.3%/98.5%/108.0% of Attack (3 hits). While Spring's Edge is active, when allies deal Wind damage with a skill, Highlight, Theurgy or Resonance, deal Wind damage to the selected target equal to 20% of Frostgale Kotone's Attack, and gain 1 Spring's Vestige stack. When Spring's Edge ends, spend all Spring's Vestige stacks, and deal Wind damage to the target equal to (stacks + 4) × 36.4%/40.1%/38.6%/42.3% of Attack. This damage is counted as a Resonance.\n[Winter] Activate Winter's Edge for 1 turn, and deal Ice damage to 1 foe equal to 229.0%/252.5%/243.1%/266.5% of Attack. While Winter's Edge is active, when an ally takes an attack, grant Glacial Heart to all allies for 2 turns, protecting them from up to 1301/1301/1380/1380 damage (up to 2 times). Also, when allies deal Ice damage with a skill, Highlight, Theurgy, or Resonance, gain 1 Winter's Vestige stack. When Winter's Edge ends, spend all Winter's Vestige stacks, and deal Ice damage to the target equal to (stacks + 4) × 27.9%/30.8%/29.6%/32.5% of Attack. This damage is counted as a Resonance.",
        descTh:"[Spring] เปิดใช้ Spring's Edge 1 เทิร์น และสร้างความเสียหายธาตุลมให้ศัตรู 1 ตัว เท่ากับ 92.8%/102.3%/98.5%/108.0% ของ Attack (3 ครั้ง) ขณะ Spring's Edge ทำงาน เมื่อพันธมิตรสร้างความเสียหายลมด้วยสกิล/Highlight/Theurgy/Resonance สร้างความเสียหายลมให้เป้าหมาย 20% ของ Attack และรับ Spring's Vestige 1 stack เมื่อ Spring's Edge สิ้นสุด ใช้ stack ทั้งหมด สร้างความเสียหายลม (stack+4) × 36.4%/40.1%/38.6%/42.3% ของ Attack นับเป็น Resonance\n[Winter] เปิดใช้ Winter's Edge 1 เทิร์น และสร้างความเสียหายธาตุน้ำแข็งให้ศัตรู 1 ตัว เท่ากับ 229.0%/252.5%/243.1%/266.5% ของ Attack ขณะ Winter's Edge ทำงาน เมื่อพันธมิตรถูกโจมตี ให้ Glacial Heart แก่พันธมิตรทุกคน 2 เทิร์น ป้องกันความเสียหายสูงสุด 1301/1301/1380/1380 (สูงสุด 2 ครั้ง) นอกจากนี้ เมื่อพันธมิตรสร้างความเสียหายน้ำแข็งด้วยสกิล/Highlight/Theurgy/Resonance รับ Winter's Vestige 1 stack เมื่อ Winter's Edge สิ้นสุด ใช้ stack ทั้งหมด สร้างความเสียหายน้ำแข็ง (stack+4) × 27.9%/30.8%/29.6%/32.5% ของ Attack นับเป็น Resonance"},
      {name:'Highlight',                  type:'Skill',   element:'Wind', sp:0,
        desc:"[Spring] Deal Wind damage to 1 foe equal to 212.5%/234.2%/225.5%/247.3% of Attack (3 hits). When Spring's Edge is active, gain 1 more Spring's Vestige stack (can exceed maximum). If Spring's Edge is not active, deal 1 more hit of Wind damage to selected target.\n[Winter] Deal Ice damage to 1 foe equal to 380.6%/419.6%/404.0%/443.0% of Attack, with a 68.3%/68.3%/72.5%/72.5% chance to inflict Icebound. When Winter's Edge is active, increase chance to inflict Icebound by 29.3%/29.3%/31.1%/31.1%. If Winter's Edge is not active, increase Highlight damage by 20%.",
        descTh:"[Spring] สร้างความเสียหายธาตุลมให้ศัตรู 1 ตัว เท่ากับ 212.5%/234.2%/225.5%/247.3% ของ Attack (3 ครั้ง) เมื่อ Spring's Edge ทำงาน รับ Spring's Vestige เพิ่ม 1 stack (สามารถเกินจำนวนสูงสุดได้) หาก Spring's Edge ไม่ทำงาน สร้างความเสียหายลมเพิ่มอีก 1 ครั้งต่อเป้าหมาย\n[Winter] สร้างความเสียหายธาตุน้ำแข็งให้ศัตรู 1 ตัว เท่ากับ 380.6%/419.6%/404.0%/443.0% ของ Attack โอกาส 68.3%/68.3%/72.5%/72.5% ทำให้ติด Icebound เมื่อ Winter's Edge ทำงาน เพิ่มโอกาส Icebound 29.3%/29.3%/31.1%/31.1% หาก Winter's Edge ไม่ทำงาน เพิ่มความเสียหาย Highlight 20%"},
      {name:'Performance Scoring',        type:'Passive', element:'-',    sp:0,
        desc:"[Spring] At the start of battle, if a Wind ally is in the party, increase Frostgale Kotone's Wind damage by 33.0%.\n[Winter] At the start of battle, if an Ice ally is in the party, increase Frostgale Kotone's Ice damage by 33.0%.",
        descTh:"[Spring] เมื่อเริ่มต้นการต่อสู้ หากมีพันธมิตรธาตุลมในปาร์ตี้ เพิ่มความเสียหายธาตุลมของ Frostgale Kotone 33.0%\n[Winter] เมื่อเริ่มต้นการต่อสู้ หากมีพันธมิตรธาตุน้ำแข็งในปาร์ตี้ เพิ่มความเสียหายธาตุน้ำแข็งของ Frostgale Kotone 33.0%"},
      {name:'Technical Scoring',          type:'Passive', element:'-',    sp:0,
        desc:"[Spring] While in Spring mode, each time an ally attacks with the Wind attribute, increase party's Attack by 8.1% for 2 turns. Stacks up to 5 times.\n[Winter] While in Winter mode, each time Frostgale Kotone gains a shield, increase party's Defense by 9.0% for 2 turns. Stacks up to 4 times.",
        descTh:"[Spring] ขณะอยู่ใน Spring mode ทุกครั้งที่พันธมิตรโจมตีด้วยธาตุลม เพิ่ม Attack ของปาร์ตี้ 8.1% เป็นเวลา 2 เทิร์น สะสมสูงสุด 5 ครั้ง\n[Winter] ขณะอยู่ใน Winter mode ทุกครั้งที่ Frostgale Kotone ได้รับ shield เพิ่ม DEF ของปาร์ตี้ 9.0% เป็นเวลา 2 เทิร์น สะสมสูงสุด 4 ครั้ง"},
    ],
    awareness:[
      {name:'Swan on the Ice',
        desc:"Frostgale Kotone has 2 modes: Spring and Winter. During battle, she can freely change between modes while Spring's/Winter's Edge is not active. At the start of battle, she will be in Spring mode, but if there are more Ice allies than Wind allies in the party, she will be in Winter mode.\nFor every 1 Spring's Vestige or Winter's Vestige stack gained, permanently increase Attack by 5% (stacks up to 7 times).",
        descTh:"Frostgale Kotone มี 2 mode: Spring และ Winter สามารถเปลี่ยน mode ได้อิสระระหว่างการต่อสู้ขณะที่ Spring's/Winter's Edge ไม่ทำงาน เริ่มต้นในโหมด Spring แต่หากมีพันธมิตรธาตุน้ำแข็งมากกว่าลมในปาร์ตี้ จะเริ่มใน Winter mode\nต่อ Spring's Vestige หรือ Winter's Vestige stack ที่ได้รับ 1 stack เพิ่ม Attack ถาวร 5% สะสมสูงสุด 7 ครั้ง"},
      {name:'Etched in Ice',
        desc:"[Spring] Each time Spring's Edge is activated, gain 1 Spring's Vestige stack. When Spring's Edge ends, increase Resonance damage by 8% for each Spring's Vestige stack (up to 40%).\n[Winter] Each time Winter's Edge is activated, gain 1 Winter's Vestige stack. When Winter's Edge ends, increase Resonance damage by 8% for each Winter's Vestige stack (up to 40%).",
        descTh:"[Spring] ทุกครั้งที่เปิดใช้ Spring's Edge รับ Spring's Vestige 1 stack เมื่อ Spring's Edge สิ้นสุด เพิ่มความเสียหาย Resonance 8% ต่อ Spring's Vestige stack (สูงสุด 40%)\n[Winter] ทุกครั้งที่เปิดใช้ Winter's Edge รับ Winter's Vestige 1 stack เมื่อ Winter's Edge สิ้นสุด เพิ่มความเสียหาย Resonance 8% ต่อ Winter's Vestige stack (สูงสุด 40%)"},
      {name:"Swan's Gaze",
        desc:"[Spring] While Spring's Edge is active, decrease all foes' Defense by 40%, and decrease party's SP costs for skills by 25%.\n[Winter] While Winter's Edge is active, increase party's Ice damage by 30%, and decrease SP costs for skills by 25%.",
        descTh:"[Spring] ขณะ Spring's Edge ทำงาน ลด DEF ของศัตรูทุกตัว 40% และลดค่า SP ของสกิลปาร์ตี้ 25%\n[Winter] ขณะ Winter's Edge ทำงาน เพิ่มความเสียหายธาตุน้ำแข็งของปาร์ตี้ 30% และลดค่า SP ของสกิล 25%"},
      {name:'Triple Axel',
        desc:"Increase the skill levels of Zephyr / Sapphire Storm and Ailes au Vent / Frozen Wings by 3.",
        descTh:"เพิ่มระดับสกิล Zephyr/Sapphire Storm และ Ailes au Vent/Frozen Wings ขึ้น 3"},
      {name:'Queen of Ice and Wind',
        desc:"[Spring] When activating a Highlight, if Spring's Edge is active, gain 1 more Spring's Vestige stack (can exceed maximum). If Spring's Edge is not active, increase Highlight damage by 35%.\n[Winter] When activating a Highlight, if Winter's Edge is active, gain 1 more Winter's Vestige stack (can exceed maximum). If Winter's Edge is not active, increase Highlight damage by 35%.",
        descTh:"[Spring] เมื่อเปิดใช้ Highlight หาก Spring's Edge ทำงาน รับ Spring's Vestige เพิ่ม 1 stack (เกินสูงสุดได้) หาก Spring's Edge ไม่ทำงาน เพิ่มความเสียหาย Highlight 35%\n[Winter] เมื่อเปิดใช้ Highlight หาก Winter's Edge ทำงาน รับ Winter's Vestige เพิ่ม 1 stack (เกินสูงสุดได้) หาก Winter's Edge ไม่ทำงาน เพิ่มความเสียหาย Highlight 35%"},
      {name:'Seasonal Highlight',
        desc:"Increase the skill levels of Éclat de Vent / Iceburst and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Éclat de Vent/Iceburst และ Thief Tactics ขึ้น 3"},
      {name:'Dance of Love',
        desc:"[Spring] After activating the Resonance when Spring's Edge ends, extend the duration of Spring's Edge by 1 turn. Regain up to 2 spent Spring's Vestige stacks, and regain up to 2 stacks that exceeded the maximum limit. Afterwards, the Resonance can be activated again (duration cannot be extended again). Also increase Resonance pierce rate by 4% for each Spring's Vestige stack (up to 20%).\n[Winter] After activating the Resonance when Winter's Edge ends, extend the duration of Winter's Edge by 1 turn. Regain up to 2 spent Winter's Vestige stacks, and regain up to 2 stacks that exceeded the maximum limit. Afterwards, the Resonance can be activated again. Also increase Resonance pierce rate by 4% for each Winter's Vestige stack (up to 20%).",
        descTh:"[Spring] หลังจากเปิดใช้ Resonance เมื่อ Spring's Edge สิ้นสุด ขยาย Spring's Edge อีก 1 เทิร์น คืน Spring's Vestige stack ที่ใช้ไปสูงสุด 2 stack และคืน stack ที่เกินสูงสุดสูงสุด 2 stack จากนั้น Resonance สามารถเปิดใช้ได้อีกครั้ง (ไม่สามารถขยายซ้ำได้) เพิ่ม pierce rate ของ Resonance 4% ต่อ Spring's Vestige stack (สูงสุด 20%)\n[Winter] หลังจากเปิดใช้ Resonance เมื่อ Winter's Edge สิ้นสุด ขยาย Winter's Edge อีก 1 เทิร์น คืน Winter's Vestige stack ที่ใช้ไปสูงสุด 2 stack และคืน stack ที่เกินสูงสุดสูงสุด 2 stack จากนั้น Resonance สามารถเปิดใช้ได้อีกครั้ง เพิ่ม pierce rate ของ Resonance 4% ต่อ Winter's Vestige stack (สูงสุด 20%)"},
    ],
    baseStats:     {hp:309, atk:102, def:50, spd:98},
    baseStatsLv80: [
      {hp:3480, atk:1150, def:567, spd:98},
      {hp:3542, atk:1171, def:577, spd:98},
      {hp:3606, atk:1192, def:587, spd:98},
      {hp:3668, atk:1212, def:597, spd:98},
      {hp:3730, atk:1233, def:607, spd:98},
      {hp:3794, atk:1253, def:618, spd:98},
      {hp:3856, atk:1274, def:628, spd:98},
    ],
    hiddenAbility: 'CRIT DMG +184.9%',
    weapons:[
      {
        name: "Lame de l'Amour", stars:5,
        hp: 2299, atk: 760, def: 374,
        bonusStats: {atk:30},
        abilityName: "Lame de l'Amour",
        ability: [
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          "Each time Frostgale Kotone gains a Spring's Vestige or Winter's Vestige stack, increase critical rate by 5.4%/7.0%/7.0%/8.6%/8.6%/10.2%/10.2% for 2 turns. This effect can stack up to 3 times.",
          "When activating Spring's Edge or Winter's Edge, increase Wind or Ice damage by 27.0%/35.0%/35.0%/43.0%/43.0%/51.0%/51.0% for 2 turns.",],
        abilityTh: [
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          "ทุกครั้งที่ Frostgale Kotone ได้รับ Spring's Vestige หรือ Winter's Vestige stack เพิ่ม CRIT Rate 5.4%/7.0%/7.0%/8.6%/8.6%/10.2%/10.2% เป็นเวลา 2 เทิร์น สะสมสูงสุด 3 ครั้ง",
          "เมื่อเปิดใช้ Spring's Edge หรือ Winter's Edge เพิ่มความเสียหายธาตุลมหรือน้ำแข็ง 27.0%/35.0%/35.0%/43.0%/43.0%/51.0%/51.0% เป็นเวลา 2 เทิร์น",
        ],
      },
      {
        name: "Lame de l'Aube", stars:4,
        hp: 1839, atk: 608, def: 299,
        bonusStats: {atk:12},
        abilityName: "Lame de l'Aube",
        ability: [
          'Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.',
          "Each time Frostgale Kotone gains a Spring's Vestige or Winter's Vestige stack, permanently increase Attack by 1.8%/2.3%/2.3%/2.8%/2.8%/3.3%/3.3%. This effect can stack up to 10 times.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          "ทุกครั้งที่ Frostgale Kotone ได้รับ Spring's Vestige หรือ Winter's Vestige stack เพิ่ม Attack ถาวร 1.8%/2.3%/2.3%/2.8%/2.8%/3.3%/3.3% สะสมสูงสุด 10 ครั้ง",
        ],
      },
    ],
  },
  {name:'Wind (Tempest)', codename:'wind-tempest', role:'Strategist', element:'Wind', rarity:5,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:'Best CRIT DMG/Support weapon (Windplum Dance)',
    statPrio:['CRIT DMG%','CRIT Rate%','SPD'], note:'Wind Strategist. CRIT DMG-scaling buffs — all party ATK/CRIT DMG buffs scale with her own CRIT multiplier. SP management unlocks full Blossoming Season potential.',
    mechanics: "ATK buff และ CRIT DMG buff ทั้งหมดของ Riko สเกลตาม CRIT multiplier ของตัวเองที่เกิน 100% — ทุก 10% CRIT DMG ที่เกิน คูณค่าบัฟทุกอย่าง Blossoming Season ใช้ SP ทั้งหมด (ต่ำสุด 50, สูงสุด 200+) เพื่อผล tier: SP 50+ ให้ ATK buff, SP 100+ เพิ่ม CRIT DMG buff, SP 150+ เพิ่ม CRIT DMG อีก — ยิ่งใช้ SP มากยิ่งแรง SP ฟื้นจาก Storm of Petals (+16 SP) และ passive ของ Arrival of Spring (+12 SP ต่อ ally damage action ขณะ active) สะสม CRIT DMG% ในทุก slot เพื่อเพิ่มทุก buff",
    rotation: [
      "เทิร์น 1 → Arrival of Spring (ATK up ปาร์ตี้สเกลตาม CRIT DMG; ฟื้น SP ของ Riko ขณะ active)",
      "เทิร์น 2 → Storm of Petals (Wind DMG + Windswept/Falling Petals; ฟื้น SP ของ Riko 16)",
      "สะสม SP ถึง 150+ → Blossoming Season สำหรับ ATK+CRIT DMG buff tier สูงสุดให้ DPS หลัก",
      "ทำวงจรฟื้น SP ซ้ำระหว่างการใช้ Blossoming Season",
      "ใช้ Highlight → CRIT Rate buff ปาร์ตี้ (สเกลตาม CRIT DMG multiplier); ใช้ก่อนช่วง burst ของ DPS",
      "เป้าหมาย CRIT DMG: 400%+ เพื่อ scaling สูงสุด — ทุก 10% CRIT DMG เกิน 100% คูณค่าบัฟทั้งหมด",
    ],
    realName:'Tempest Riko', persona:'Chiyome',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'res', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'wk' },
    skills:[
      {name:'Storm of Petals', type:'Skill', element:'Wind', sp:0,
        desc:"Deal Wind damage to 1 foe equal to 183.0%/201.8%/194.2%/213.0% of Attack. Inflict Windswept and Falling Petals for 2 turns. Falling Petals: when taking Wind damage, increase Attack by 18.3% of Riko's crit multiplier exceeding 100% (up to 388%/418%/418%/448% of crit multiplier). Restores Riko's SP by 16.",
        descTh:"ดีลดาเมจลมต่อศัตรู 1 ตัว 183.0%/201.8%/194.2%/213.0% ของ Attack ทำให้ติด Windswept และ Falling Petals 2 เทิร์น Falling Petals: เมื่อรับดาเมจลม เพิ่ม Attack 18.3% ของ crit multiplier ของ Riko ที่เกิน 100% (สูงสุด 388%/418%/418%/448% ของ crit multiplier) คืน SP ของ Riko 16"},
      {name:'Arrival of Spring', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's Attack for 2 turns (12.8% of Riko's crit multiplier exceeding 100%, up to 388%/418%/418%/448%). Restore party's SP by 4. Once while active: when an ally deals damage with a skill/Resonance/Highlight/Theurgy, restore Riko's SP by 12.",
        descTh:"เพิ่ม Attack ของปาร์ตี้ 2 เทิร์น (12.8% ของ crit multiplier ของ Riko ที่เกิน 100% สูงสุด 388%/418%/418%/448%) คืน SP ปาร์ตี้ 4 ครั้งเดียวขณะผลทำงาน: เมื่อพันธมิตรดีลดาเมจด้วยสกิล/Resonance/Highlight/Theurgy คืน SP ของ Riko 12"},
      {name:'Blossoming Season', type:'Skill', element:'-', sp:50, isBuff:true,
        desc:"Spend all SP (min 50, max 200+). Increase 1 ally's CRIT Rate by 16.0%/17.0%/17.0%/18.0% for 2 turns (+1% per 2 SP spent). Per SP spent — 50+ SP: ATK +2.4 per 1% crit over 100%; 100+ SP: CRIT DMG +12% of crit over 100%; 150+ SP: CRIT DMG +6% more of crit over 100%. Cap: 388%/418%/418%/448% of crit multiplier.",
        descTh:"ใช้ SP ทั้งหมด (ขั้นต่ำ 50 สูงสุด 200+) เพิ่ม CRIT Rate ของพันธมิตร 1 คน 16.0%/17.0%/17.0%/18.0% เป็นเวลา 2 เทิร์น (+1% ต่อ SP 2 หน่วย) ต่อ SP ที่ใช้: 50+ SP: ATK +2.4 ต่อ 1% crit เกิน 100%; 100+ SP: CRIT DMG +12% ของ crit เกิน 100%; 150+ SP: CRIT DMG +6% เพิ่มเติม สูงสุด 388%/418%/418%/448% ของ crit multiplier"},
      {name:'HIGHLIGHT', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase 1 ally's Attack (per 1% crit over 100% → +2.5, cap 388%/418%/418%/448%) and CRIT DMG by 24.4%/26.9%/25.9%/28.4% for 2 turns. Restore 20 SP to all allies besides Riko. [4-turn cooldown]",
        descTh:"เพิ่ม Attack ของพันธมิตร 1 คน (ต่อ 1% crit เกิน 100% → +2.5 สูงสุด 388%/418%/418%/448%) และ CRIT DMG 24.4%/26.9%/25.9%/28.4% เป็นเวลา 2 เทิร์น คืน SP 20 ให้พันธมิตรทั้งหมดยกเว้น Riko [Cooldown: 4 เทิร์น]"},
      {name:'Vernal Splendor', type:'Passive', element:'-', sp:0,
        desc:"After Blossoming Season, grant Unravel to target for 2 turns. Unravel: each skill damage → 1 Blossom stack. Blossom: +30 ATK for 3 turns (up to 10 stacks). At 5 stacks: ATK +8% and CRIT DMG +5% of Riko's crit over 100%. At 10 stacks: CRIT DMG +5% more of crit over 100%.",
        descTh:"หลัง Blossoming Season ให้ Unravel แก่เป้าหมาย 2 เทิร์น Unravel: ทุกดาเมจสกิล → Blossom 1 stack Blossom: +30 ATK 3 เทิร์น (สูงสุด 10 stack) ที่ 5 stack: ATK +8% และ CRIT DMG +5% ของ crit Riko เกิน 100% ที่ 10 stack: CRIT DMG +5% เพิ่มเติม"},
      {name:'Sun-kissed Blooms', type:'Passive', element:'-', sp:0,
        desc:"During battle, increase CRIT DMG and HP based on Riko's SP Recovery. At max 450% SP Recovery: CRIT DMG +84%, HP +1800.",
        descTh:"ระหว่างการต่อสู้ เพิ่ม CRIT DMG และ HP ตาม SP Recovery ของ Riko ที่ SP Recovery สูงสุด 450%: CRIT DMG +84%, HP +1800"},
    ],
    awareness:[
      {name:'Fragrant Gale',
        desc:"Increase Riko's max SP to 200 and SP Recovery by 60%. When using a skill to restore own SP, the amount is affected by SP Recovery.",
        descTh:"เพิ่ม SP สูงสุดของ Riko เป็น 200 และ SP Recovery +60% เมื่อใช้สกิลเพื่อคืน SP ตัวเอง ปริมาณที่ได้รับจะถูกคูณด้วย SP Recovery"},
      {name:'Colors of Dawn',
        desc:"Falling Petals now triggers on any damage (not just Wind). Target's CRIT DMG taken +30%. Arrival of Spring gives Sweeper allies 25% more ATK.",
        descTh:"Falling Petals ตอนนี้เปิดใช้กับดาเมจทุกธาตุ (ไม่ใช่แค่ลม) เป้าหมายรับ CRIT DMG +30% Arrival of Spring เพิ่ม ATK ให้พันธมิตร Sweeper 25% เพิ่มเติม"},
      {name:'East Wind',
        desc:"Increase Riko's max SP by 50 (also increases Blossoming Season cap). After Blossoming Season, immediately recover 50 SP. Vernal Splendor enhanced: double the CRIT DMG increase at 5 and 10 Blossom stacks.",
        descTh:"เพิ่ม SP สูงสุดของ Riko อีก 50 (เพิ่มขีดจำกัด Blossoming Season ด้วย) หลัง Blossoming Season คืน SP 50 ทันที Vernal Splendor เสริม: เพิ่ม CRIT DMG เป็น 2 เท่าที่ 5 และ 10 Blossom stack"},
      {name:'Swaying Boughs',
        desc:"Increase the skill levels of Arrival of Spring and Blossoming Season by 3.",
        descTh:"เพิ่มระดับสกิล Arrival of Spring และ Blossoming Season ขึ้น 3 ระดับ"},
      {name:'Sea Breeze',
        desc:"Highlight Enhanced: buff now applies to all allies besides Riko. Main target's CRIT DMG +12% more. Restore 32 SP to all allies besides Riko.",
        descTh:"Highlight เสริม: buff ตอนนี้ใช้กับพันธมิตรทุกคนยกเว้น Riko CRIT DMG ของเป้าหมายหลัก +12% เพิ่มเติม คืน SP 32 ให้พันธมิตรทั้งหมดยกเว้น Riko"},
      {name:'Rage of Spring',
        desc:"Increase the skill levels of Storm of Petals and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Storm of Petals และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Full Blossom',
        desc:"Blossoming Season affects all allies besides Riko. When main target uses a skill, immediately activate Storm of Petals once (once per Blossoming Season). Falling Petals duration +1 turn. While Riko is on field: for every 1% CRIT Rate over 100% on any ally, increase that damage's CRIT DMG by 2%.",
        descTh:"Blossoming Season ส่งผลต่อพันธมิตรทั้งหมดยกเว้น Riko เมื่อเป้าหมายหลักใช้สกิล เปิดใช้ Storm of Petals 1 ครั้งทันที (1 ครั้งต่อการใช้ Blossoming Season) Falling Petals ยาวขึ้น 1 เทิร์น ขณะ Riko อยู่ในสนาม: ต่อ CRIT Rate 1% เกิน 100% ของพันธมิตรใดก็ตาม เพิ่ม CRIT DMG ของดาเมจนั้น 2%"},
    ],
    baseStats: {hp:323, atk:87, def:56, spd:104},
    baseStatsLv80: [
      {hp:3630, atk:980, def:640, spd:0},
      {hp:3696, atk:998, def:651, spd:0},
      {hp:3760, atk:1015, def:663, spd:0},
      {hp:3826, atk:1033, def:674, spd:0},
      {hp:3892, atk:1050, def:686, spd:0},
      {hp:3956, atk:1068, def:698, spd:0},
      {hp:4022, atk:1086, def:709, spd:0},
    ],
    hiddenAbility: 'SP Recovery +188.5%',
    weapons:[
      {name:'Windplum Dance', stars:5,
        hp:2398, atk:647, def:423,
        bonusStats:{},
        abilityName:'Windplum Dance',
        ability:[
          'Increase critical damage by 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%.',
          "After using a skill on an ally, increase all allies' CRIT DMG (besides Riko) by 13.2%/17.2%/17.2%/21.2%/21.2%/25.2%/25.2% for 2 turns.",
          'When main target deals damage with a skill, increase damage by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% per 50 SP spent for 2 turns.',],
        abilityTh:[
          'เพิ่ม CRIT DMG 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%',
          'หลังใช้สกิลบนพันธมิตร เพิ่ม CRIT DMG ของพันธมิตรทุกคน (ยกเว้น Riko) 13.2%/17.2%/17.2%/21.2%/21.2%/25.2%/25.2% เป็นเวลา 2 เทิร์น',
          'เมื่อเป้าหมายหลักดีลดาเมจด้วยสกิล เพิ่มดาเมจ 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% ต่อ SP 50 หน่วยที่ใช้ เป็นเวลา 2 เทิร์น',
        ]},
      {name:"Sparrow's Leap", stars:4,
        hp:1918, atk:518, def:338,
        bonusStats:{atk:24},
        abilityName:"Sparrow's Leap",
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When Riko restores SP with a skill, increase CRIT DMG by 8.7%/11.3%/11.3%/13.9%/13.9%/16.5%/16.5% for 2 turns. Stacks up to 2 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อ Riko คืน SP ด้วยสกิล เพิ่ม CRIT DMG 8.7%/11.3%/11.3%/13.9%/13.9%/16.5%/16.5% เป็นเวลา 2 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ]},
    ],
  },
  {name:'Moko (Seaside)', codename:'moko-seaside', role:'Medic', element:'Psychokinesis', rarity:5,
    cards:['Love 4pc','Opulence 2pc'], weapon:'Best Healing/Psy weapon (Bubble Babies)',
    statPrio:['ATK%','Healing Bonus%','HP%'], note:'Psy Medic. Sparks → Summer Reminiscence Resonance cycles heal and debuff simultaneously. ATK scales all healing; Power of Memories grants Psy DMG and HP from healing output.',
    mechanics: "Sparks สะสมบนศัตรู (สูงสุด 5) ทุกครั้งที่ ally ใช้ทักษะโจมตีศัตรูนั้น เมื่อครบ 5 Sparks → Summer Reminiscence Resonance เปิดอัตโนมัติ — ฮีลปาร์ตี้และลด DEF/DMG taken ของเป้าพร้อมกัน ATK สเกลค่าฮีลทั้งหมด (ไม่ใช่ HP) Power of Memories แปลงผลฮีลเป็น Psy DMG บนเป้านั้นและให้ max HP แก่ผู้รับการฮีล วงจรฮีล+debuff ทำให้ Moko เป็น support DPS ในตัวเอง",
    rotation: [
      "ใช้ทักษะโจมตีเป้าหลักบ่อยๆ เพื่อสะสม Sparks ถึง 5 เร็วขึ้น (Resonance ยิงอัตโนมัติ)",
      "Summer Reminiscence Resonance ที่ 5 Sparks: ฮีลปาร์ตี้ + DEF down เป้า + DMG taken up พร้อมกัน",
      "เทิร์น 1 → Psy skill (สะสม Sparks + สร้างดาเมจสเกลตาม ATK)",
      "เทิร์น 2 → ทักษะฮีล (สะสม Sparks + ฮีล; ATK สเกลทั้งการฮีลและ Psy DMG ผ่าน Power of Memories)",
      "ใช้ Highlight เมื่อพร้อม → Psy DMG ใหญ่ + ฮีลปาร์ตี้ + max HP เพิ่ม",
      "สะสม ATK% เป็นหลัก — ATK สเกลทั้งดาเมจและค่าฮีลทุกอย่างเท่าเทียมกัน",
    ],
    realName:'Seaside Tomoko', persona:'Prosymna',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'wk', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'res' },
    skills:[
      {name:'Have a Cold Drink', type:'Skill', element:'Psychokinesis', sp:23,
        desc:"Deal Psy damage to foes equal to 77.6%/85.5%/82.4%/90.3% of Attack (4 hits). From 2nd hit, prioritize new targets, inflict 1 Sparks per hit, 30% damage for same target. Passive: increases Summer Reminiscence skill damage and healing by 51.7%/51.7%/60.0%/60.0%.",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรู 77.6%/85.5%/82.4%/90.3% ของ Attack (4 ครั้ง) ตั้งแต่ครั้งที่ 2 ให้ความสำคัญกับเป้าหมายใหม่ ทำให้ติด Sparks 1 stack ต่อครั้ง ดาเมจ 30% สำหรับเป้าหมายเดิม Passive: เพิ่มตัวคูณดาเมจและการรักษา Summer Reminiscence 51.7%/51.7%/60.0%/60.0%"},
      {name:'Hale Summer Days', type:'Skill', element:'-', sp:27, isBuff:true,
        desc:"Restore 1 ally's HP by 22.4%/22.4%/23.8%/23.8% of Tomoko's Attack + 1437/1748/1767/2078. For 2 turns: target ATK +14.6%/14.6%/15.5%/15.5%, ailment accuracy +58.6%/58.6%/62.2%/62.2%, damage +30%, and ATK +25% of target's ailment accuracy (up to 22.5%). Inflict 1 Sparks per skill damage hit to foes (up to 5 stacks).",
        descTh:"ฟื้นฟู HP พันธมิตร 1 คน 22.4%/22.4%/23.8%/23.8% ของ Attack Tomoko + 1437/1748/1767/2078 เป็นเวลา 2 เทิร์น: ATK +14.6%/14.6%/15.5%/15.5%, ailment accuracy +58.6%/58.6%/62.2%/62.2%, ดาเมจ +30% และ ATK +25% ของ ailment accuracy เป้าหมาย (สูงสุด 22.5%) ทำให้ศัตรูติด Sparks 1 stack ต่อการโจมตีด้วยสกิล (สูงสุด 5 stack)"},
      {name:'Sparkling Memories', type:'Skill', element:'Psychokinesis', sp:25,
        desc:"Deal Psy damage to all foes equal to 61.0%/67.2%/64.8%/71.0% of Attack. For 2 turns: increase foes' damage taken by 19.5%/19.5%/20.7%/20.7% and inflict 1 Sparks when foes take skill damage. Duration decreases at start of Tomoko's turn. Sparks up to 5 stacks (not inflicted by this skill's own damage).",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูทุกตัว 61.0%/67.2%/64.8%/71.0% ของ Attack เป็นเวลา 2 เทิร์น: เพิ่มดาเมจที่รับของศัตรู 19.5%/19.5%/20.7%/20.7% และทำให้ติด Sparks 1 stack เมื่อศัตรูรับดาเมจสกิล ระยะเวลาลดลงต้นเทิร์น Tomoko Sparks สูงสุด 5 stack (ไม่ติดจากดาเมจสกิลนี้)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Psychokinesis', sp:0,
        desc:"Deal Psy damage to random foes equal to 82.4%/90.8%/87.4%/95.9% of Attack (3 hits). Prioritize unhit foes, inflict 1 Sparks per hit, 30% damage for repeated hits. [4-turn cooldown]",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูสุ่ม 82.4%/90.8%/87.4%/95.9% ของ Attack (3 ครั้ง) ให้ความสำคัญกับศัตรูที่ยังไม่ถูกโจมตี ทำให้ติด Sparks 1 stack ต่อครั้ง ดาเมจ 30% สำหรับการโจมตีซ้ำ [Cooldown: 4 เทิร์น]"},
      {name:'Power of Memories', type:'Passive', element:'-', sp:0,
        desc:"During battle, increase Psy damage and max HP based on HP recovery. At max 42% HP recovery: Psy damage +70%, max HP +2100.",
        descTh:"ระหว่างการต่อสู้ เพิ่มดาเมจพลังจิตและ HP สูงสุดตามการฟื้นฟู HP ที่ HP recovery สูงสุด 42%: ดาเมจพลังจิต +70%, HP สูงสุด +2100"},
      {name:'Soothing Waves', type:'Passive', element:'-', sp:0,
        desc:"When activating Hale Summer Days, increase main target's max HP by 1800 for 2 turns. Restore lowest HP ally's HP equal to 60% of skill healing.",
        descTh:"เมื่อเปิดใช้ Hale Summer Days เพิ่ม HP สูงสุดของเป้าหมายหลัก 1800 เป็นเวลา 2 เทิร์น ฟื้นฟู HP ของพันธมิตรที่มี HP ต่ำสุด 60% ของการรักษาจากสกิล"},
    ],
    awareness:[
      {name:'Summer Reminiscence',
        desc:"After an ally acts, if any foe has 3+ Sparks stacks, activate Resonance: for every 3 Sparks on all foes, deal Psy = 19% ATK to all, decrease target damage -30% for 1 turn, heal party = 9% ATK + 300/600/900 (Lv.1/50/70+). Up to 5 rounds. Damage scales: 150%/120%/100% for 1/2/3+ foes. No Down Point damage. Defeated foe's Sparks pass to random foes.",
        descTh:"หลังพันธมิตรใช้แอ็คชัน หากศัตรูมี Sparks 3+ stack เปิดใช้ Resonance: ต่อ Sparks 3 stack บนศัตรูทุกตัว ดีลดาเมจพลังจิต 19% ของ ATK ต่อทุกตัว ลดดาเมจเป้าหมาย -30% 1 เทิร์น ฮีลปาร์ตี้ 9% ATK + 300/600/900 (Lv.1/50/70+) สูงสุด 5 รอบ ดาเมจ: 150%/120%/100% สำหรับ 1/2/3+ ตัว ไม่มี Down Point ศัตรูที่ตายส่ง Sparks ต่อแบบสุ่ม"},
      {name:'Flash of Summer',
        desc:"Each SR effect on a foe → DEF -15% for 3 turns (stacks 3). Hale Summer Days healing now applies to all allies.",
        descTh:"ทุก SR effect บนศัตรู → DEF -15% 3 เทิร์น (สะสม 3) Hale Summer Days ฮีลพันธมิตรทุกคนแทน"},
      {name:'Gentle Sunbeams',
        desc:"Every 2 SR activations → 1 Sparks on random foe. Each Sparks inflicted → party ATK permanently +2% (up to 15 stacks).",
        descTh:"ทุก 2 ครั้งที่ SR เปิดใช้ → Sparks 1 stack บนศัตรูสุ่ม ทุกครั้งที่ทำให้ติด Sparks → ATK ปาร์ตี้ถาวร +2% (สูงสุด 15 stack)"},
      {name:'Sentimental Seabreeze',
        desc:"Increase the skill levels of Have a Cold Drink and Hale Summer Days by 3.",
        descTh:"เพิ่มระดับสกิล Have a Cold Drink และ Hale Summer Days ขึ้น 3 ระดับ"},
      {name:'Sparkling Summer Night',
        desc:"Highlight Enhanced: Deal bonus damage (2 hits) and inflict 1 Sparks stack per hit.",
        descTh:"Highlight เสริม: ดีลดาเมจโบนัส (2 ครั้ง) และทำให้ติด Sparks 1 stack ต่อครั้ง"},
      {name:'Lingering Glow',
        desc:"Increase the skill levels of Sparkling Memories and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Sparkling Memories และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Heartfelt Days',
        desc:"Summer Reminiscence gains: CRIT Rate +35% when dealing SR damage. Each SR effect on a foe → permanently +5% damage taken (stacks 3). At max stacks: CRIT DMG taken +20% more.",
        descTh:"Summer Reminiscence เพิ่ม: CRIT Rate +35% เมื่อดีลดาเมจ SR ทุก SR effect บนศัตรู → ดาเมจที่รับถาวร +5% (สะสม 3) ที่ stack สูงสุด: CRIT DMG ที่รับ +20% เพิ่มเติม"},
    ],
    baseStats: {hp:315, atk:97, def:51, spd:103},
    baseStatsLv80: [
      {hp:3540, atk:1090, def:580, spd:0},
      {hp:3604, atk:1110, def:590, spd:0},
      {hp:3667, atk:1129, def:601, spd:0},
      {hp:3731, atk:1149, def:611, spd:0},
      {hp:3795, atk:1168, def:622, spd:0},
      {hp:3858, atk:1188, def:632, spd:0},
      {hp:3922, atk:1208, def:642, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Bubble Babies', stars:5,
        hp:2339, atk:720, def:383,
        bonusStats:{heal:22},
        abilityName:'Bubble Babies',
        ability:[
          'Increase healing by 22.0%/22.0%/28.5%/28.5%/35.0%/35.0%/41.5%.',
          'Increase Summer Reminiscence damage multiplier and healing by 18.5%/24.0%/24.0%/29.5%/29.5%/35.0%/35.0%.',
          'When activating Summer Reminiscence, increase target\'s damage taken by 8.5%/11.0%/11.0%/13.5%/13.5%/16.0%/16.0% for 3 turns (stacks 2). Decrease target\'s DEF and ailment resistance by 12% for 3 turns.',],
        abilityTh:[
          'เพิ่มการรักษา 22.0%/22.0%/28.5%/28.5%/35.0%/35.0%/41.5%',
          'เพิ่มตัวคูณดาเมจและการรักษา Summer Reminiscence 18.5%/24.0%/24.0%/29.5%/29.5%/35.0%/35.0%',
          "เมื่อเปิดใช้ Summer Reminiscence เพิ่มดาเมจที่รับของเป้าหมาย 8.5%/11.0%/11.0%/13.5%/13.5%/16.0%/16.0% 3 เทิร์น (สะสม 2) ลด DEF และ ailment resistance เป้าหมาย 12% 3 เทิร์น",
        ]},
      {name:"Ocean's Tidings", stars:4,
        hp:1871, atk:576, def:306,
        bonusStats:{atk:24},
        abilityName:"Ocean's Tidings",
        ability:[
          'Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.',
          "When activating Summer Reminiscence, increase Tomoko's healing by 13.0%/16.9%/16.9%/20.9%/20.9%/24.8%/24.8% for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          "เมื่อเปิดใช้ Summer Reminiscence เพิ่มการรักษาของ Tomoko 13.0%/16.9%/16.9%/20.9%/20.9%/24.8%/24.8% เป็นเวลา 2 เทิร์น",
        ]},
    ],
  },
  // ─── 4-Star ─────────────────────────────────────────────────────────────
  {name:'Morgana', codename:'Mona', role:'Medic', element:'Wind', rarity:5,
    cards:['Peace 4pc','Opulence 2pc'], weapon:'Best ATK/CRIT weapon (Golden Legacy)',
    statPrio:['ATK%','CRIT Rate%','HP%'], note:'Only character who can revive allies mid-battle. Highlight revives 1 KO\'d ally with 20% HP. ATK scales healing; Chivalry mechanic provides bonus healing on crits.',
    mechanics: "Morgana เป็นตัวละครเดียวที่ฟื้น ally ได้กลางการต่อสู้ — Highlight ฟื้น ally ที่ KO 1 คนที่ HP 20% Chivalry stack สะสมจากการ crit ของทักษะและการฮีล; เมื่อ stack สูง ฮีลจะแรงขึ้นและ CRIT DMG ของเทิร์นนั้นเพิ่ม Masked Gentleman passive เปิดการฮีลเพิ่มเติมทุกครั้งที่การโจมตีของ Morgana crit บนศัตรู ATK สเกลค่าฮีลทั้งหมด (ไม่ใช่ HP) รักษา HP ปาร์ตี้ให้สูงเพื่อป้องกัน KO แต่เซฟ Highlight ไว้ฟื้นในจังหวะสำคัญ",
    rotation: [
      "เทิร์น 1 → ทักษะฮีล (ฟื้น HP ปาร์ตี้; สะสม Chivalry stack จาก crit และการฮีล)",
      "เทิร์น 2 → ทักษะฮีลหรือ Psy/Almighty (สร้างดาเมจพร้อมสะสม Chivalry stack ผ่าน crit)",
      "รักษา HP ปาร์ตี้เกิน 50% — Morgana ฮีลไม่มีประสิทธิภาพเมื่อทุกคน HP เต็ม",
      "เซฟ Highlight ไว้ฟื้น ally ที่ KO (ฟื้นที่ HP 20%; reactive turn ที่ทรงพลังที่สุดในเกม)",
      "ถ้าไม่ต้องฟื้น ใช้ Highlight proactive เพื่อฮีลปาร์ตี้ + บัฟ CRIT DMG ตัวเอง",
      "สะสม CRIT Rate — Masked Gentleman ยิงฮีลโบนัสทุก crit ทำให้ crit มีประโยชน์สองทาง",
    ],
    realName:'Morgana', persona:'Zorro',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'wk', Wind:'res', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Missile Whirlwind', type:'Skill', element:'Wind', sp:22,
        desc:"Deal Wind damage to 1 foe equal to 146.4%/161.4%/155.4%/170.4% of Attack. Inflict Windswept for 2 turns. Chance to gain 1 Chivalry stack equal to current critical rate.",
        descTh:"ดีลดาเมจลมต่อศัตรู 1 ตัว 146.4%/161.4%/155.4%/170.4% ของ Attack ทำให้ติด Windswept 2 เทิร์น มีโอกาสรับ Chivalry 1 stack เท่ากับ CRIT Rate ปัจจุบัน"},
      {name:'Healing Breeze', type:'Skill', element:'-', sp:33, isBuff:true,
        desc:"Restore party's HP by 37.6%/37.6%/39.9%/39.9% of Morgana's Attack + 1069/1300/1315/1546, and heal 1 elemental ailment. When healing an ailment, gain 1 Chivalry stack.",
        descTh:"ฟื้นฟู HP ของปาร์ตี้ 37.6%/37.6%/39.9%/39.9% ของ Attack Morgana + 1069/1300/1315/1546 และรักษาสภาวะธาตุ 1 ชนิด เมื่อรักษาสภาวะ รับ Chivalry 1 stack"},
      {name:'Gentle Fist', type:'Skill', element:'Physical', sp:0,
        desc:"Decrease accuracy by 20%, increase critical rate by 30%, and deal Physical damage to 1 foe equal to 128.9%/142.1%/136.9%/150.1% of Attack. On a critical hit, gain 1 Chivalry stack. [HP Cost: 12%]",
        descTh:"ลด accuracy 20% เพิ่ม CRIT Rate 30% และดีลดาเมจกายภาพต่อศัตรู 1 ตัว 128.9%/142.1%/136.9%/150.1% ของ Attack เมื่อ CRIT รับ Chivalry 1 stack [ค่าใช้จ่าย HP: 12%]"},
      {name:'HIGHLIGHT', type:'Skill', element:'Wind', sp:0,
        desc:"Deal Wind damage to 1 foe equal to 227.8%/251.1%/241.8%/265.1% of Attack, and revive 1 KO'd ally with 20% HP. [4-turn cooldown]",
        descTh:"ดีลดาเมจลมต่อศัตรู 1 ตัว 227.8%/251.1%/241.8%/265.1% ของ Attack และฟื้นฟูพันธมิตรที่ KO 1 คน ด้วย HP 20% [Cooldown: 4 เทิร์น]"},
      {name:'Masked Gentleman', type:'Passive', element:'-', sp:0,
        desc:"When healing with Chivalry, increase critical rate by 30.0%. When inflicting a critical hit, increase Chivalry's healing effect by 24.0% of Morgana's Attack + 720.",
        descTh:"เมื่อฮีลด้วย Chivalry เพิ่ม CRIT Rate 30.0% เมื่อ CRIT เพิ่มผลการรักษาของ Chivalry 24.0% ของ Attack Morgana + 720"},
      {name:"Morgana's Method", type:'Passive', element:'-', sp:0,
        desc:"Decrease party's SP cost by 15.0%.",
        descTh:"ลดค่า SP ของปาร์ตี้ 15.0%"},
    ],
    awareness:[
      {name:"Morgana's Favor",
        desc:"When using a different skill than the previous one, gain 1 Chivalry stack (up to 3). When an ally with <70% HP uses a skill/Highlight/Theurgy, activate Resonance: spend 1 Chivalry to heal party by 10% of Morgana's Attack + 150/225/300 (changes at Lv.1/50/70).",
        descTh:"เมื่อใช้สกิลต่างจากครั้งก่อน รับ Chivalry 1 stack (สูงสุด 3) เมื่อพันธมิตรที่มี HP <70% ใช้สกิล/Highlight/Theurgy เปิดใช้ Resonance: ใช้ Chivalry 1 stack ฮีลปาร์ตี้ 10% ของ Attack Morgana + 150/225/300 (เปลี่ยนที่ Lv.1/50/70)"},
      {name:'Marvelous Pride',
        desc:"Chivalry also restores HP to allies with less than 50% HP remaining by 30% of Morgana's Attack.",
        descTh:"Chivalry ยังฟื้นฟู HP ให้พันธมิตรที่มี HP <50% อีก 30% ของ Attack Morgana"},
      {name:'Black Cat Charm',
        desc:"When using Healing Breeze, increase HP recovery for the main target by 33%.",
        descTh:"เมื่อใช้ Healing Breeze เพิ่มการฟื้นฟู HP ของเป้าหมายหลัก 33%"},
      {name:'Grooming',
        desc:"Increase the skill levels of Healing Breeze and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Healing Breeze และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Aftercare',
        desc:"Highlight Enhanced: When a KO'd ally is revived, restore bonus HP equal to 60% of Morgana's Attack + 800.",
        descTh:"Highlight เสริม: เมื่อพันธมิตรที่ KO ถูกฟื้นฟู คืน HP โบนัส 60% ของ Attack Morgana + 800"},
      {name:'Airplane Ears Mode',
        desc:"Increase the skill levels of Missile Whirlwind and Gentle Fist by 3.",
        descTh:"เพิ่มระดับสกิล Missile Whirlwind และ Gentle Fist ขึ้น 3 ระดับ"},
      {name:'Look, Treasure!',
        desc:"Remove Gentle Fist's decreased accuracy effect. Increase target's damage taken by 15% for 2 turns.",
        descTh:"ลบผลลด accuracy ของ Gentle Fist ออก เพิ่มดาเมจที่รับของเป้าหมาย 15% เป็นเวลา 2 เทิร์น"},
    ],
    baseStats: {hp:293, atk:97, def:57, spd:100},
    baseStatsLv80: [
      {hp:3300, atk:1100, def:647, spd:0},
      {hp:3359, atk:1120, def:659, spd:0},
      {hp:3419, atk:1140, def:670, spd:0},
      {hp:3478, atk:1159, def:682, spd:0},
      {hp:3538, atk:1179, def:693, spd:0},
      {hp:3597, atk:1199, def:705, spd:0},
      {hp:3657, atk:1219, def:716, spd:0},
    ],
    hiddenAbility: 'CRIT Rate +22.4%',
    weapons:[
      {name:'Golden Legacy', stars:5,
        hp:2180, atk:727, def:427,
        bonusStats:{},
        abilityName:'Golden Legacy',
        ability:[
          'Increase critical rate by 18.0%/18.0%/23.4%/23.4%/28.8%/28.8%/34.2%.',
          'If a foe is critically hit with a skill, deal 10.0%/13.3%/13.3%/16.7%/16.7%/20.0%/20.0% of max HP as bonus damage (up to 100.0%/133.3%/133.3%/166.7%/166.7%/200.0%/200.0% of Attack).',
          'When using a healing skill, restore 9.0%/11.8%/11.8%/14.6%/14.6%/17.4%/17.4% of the target\'s max HP.',
          'If a skill misses, immediately gain Chivalry.',],
        abilityTh:[
          'เพิ่ม CRIT Rate 18.0%/18.0%/23.4%/23.4%/28.8%/28.8%/34.2%',
          'หากสกิล CRIT ต่อศัตรู ดีลดาเมจโบนัส 10.0%/13.3%/13.3%/16.7%/16.7%/20.0%/20.0% ของ HP สูงสุด (สูงสุด 100%/133.3%/.../200% ของ Attack)',
          'เมื่อใช้สกิลฮีล ฟื้นฟู HP เป้าหมาย 9.0%/11.8%/11.8%/14.6%/14.6%/17.4%/17.4% ของ HP สูงสุด',
          'หากสกิลพลาด รับ Chivalry ทันที',
        ]},
      {name:'Shamshir', stars:4,
        hp:1744, atk:581, def:341,
        bonusStats:{atk:24},
        abilityName:'Shamshir',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When healing an ally with 80% or more HP, grant Moonlight. Moonlight: HP +10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% and ATK +4.0%/5.3%/5.3%/6.7%/6.7%/8.0%/8.0% for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อฮีลพันธมิตรที่มี HP 80%+ ให้ Moonlight Moonlight: HP +10%/13%/.../19% และ ATK +4%/5.3%/.../8% เป็นเวลา 2 เทิร์น',
        ]},
      {name:'Headhunter Ladle', stars:4,
        hp:1903, atk:539, def:341,
        bonusStats:{},
        abilityName:'Headhunter Ladle',
        ability:[
          "Increase critical rate by 5.9%/5.9%/7.6%/7.6%/9.3%/9.3%/11.0%.",
          "When attacking with a skill, restore HP equal to 6.3%/8.0%/8.0%/9.7%/9.7%/11.4%/11.4% of Attack to the ally with the lowest HP.",
          "2.0%/3.0%/3.0%/4.0%/4.0%/5.0%/5.0% chance to inflict Forget on target foe for 1 turn.",
        ],
        abilityTh:[
          'เพิ่ม CRIT Rate 5.9%/5.9%/7.6%/7.6%/9.3%/9.3%/11.0%',
          'เมื่อโจมตีด้วยสกิล ฟื้นฟู HP ให้พันธมิตรที่มี HP ต่ำสุด 6.3%/8.0%/8.0%/9.7%/9.7%/11.4%/11.4% ของ Attack',
          'โอกาส 2.0%/3.0%/3.0%/4.0%/4.0%/5.0%/5.0% ทำให้ศัตรูเป้าหมายติด Forget 1 เทิร์น',
        ]},
    ],
  },
  {name:'Yui', codename:'Bui', role:'Sweeper', element:'Electric', rarity:5,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best follow-up/Electric weapon (Cyber Jammers)',
    statPrio:['CRIT Rate%','ATK%','CRIT DMG%'], note:'Electric Sweeper. Follow-up attack specialist — Player 2 mechanic grants ally follow-ups, Jolly Cooperation Resonance procs on every ally skill use.',
    mechanics: "Player 2 ให้ความสามารถ follow-up attack แก่ ally เป้าหมาย Jolly Cooperation Resonance proc บน ally ทุกคนที่ใช้ทักษะ (โอกาส 35%) — ยิง Electric follow-up และเพิ่ม Electric DMG taken ของศัตรูเป้า +15% เป็นเวลา 1 เทิร์น สร้าง passive Electric amplification loop ที่ทำงานแม้ในเทิร์นของ DPS อื่น สะสม CRIT Rate และ ATK เพื่อ maximize ดาเมจ follow-up ของ Yui และมูลค่า proc ของ Jolly Cooperation",
    rotation: [
      "เทิร์น 1 → Player 2 บน DPS หลัก (ให้ follow-up capability; พวกเขา proc follow-up บนทักษะตัวเอง)",
      "เทิร์น 2 → Electric skill (AoE หรือ ST; แพร่ Shock เพื่อโอกาส Technical)",
      "Jolly Cooperation proc อัตโนมัติบน ally skill — รักษา Yui ในสนามเพื่อ Electric amplification passive",
      "เมื่อเป้ามี Shock → ให้ความสำคัญ Electric DPS skill บนเป้านั้นเพื่อ Technical bonus",
      "ใช้ Highlight เมื่อพร้อม → Electric burst + บัฟ ตัวเอง + ช่วง follow-up ปาร์ตี้ขยาย",
      "สะสม CRIT Rate% เพื่อ maximize crit ของ Jolly Cooperation follow-up และการโจมตีของ Yui",
    ],
    realName:'Yui', persona:'Apseudes',
    weakRes:{ Fire:'normal', Ice:'wk', Electric:'res', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Electric Bomb', type:'Skill', element:'Electric', sp:20,
        desc:"Deal Electric damage to 1 foe equal to 185.4%/204.4%/196.8%/215.8% of Attack. If the foe is not Shocked, 68.3%/68.3%/72.5%/72.5% chance to inflict Shock for 2 turns. If the foe is already Shocked, increase damage by 30%.",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรู 1 ตัว 185.4%/204.4%/196.8%/215.8% ของ Attack หากศัตรูไม่ติด Shock มีโอกาส 68.3%/68.3%/72.5%/72.5% ทำให้ติด Shock 2 เทิร์น หากติด Shock แล้ว เพิ่มดาเมจ 30%"},
      {name:'Meta Dynamite', type:'Skill', element:'Electric', sp:20,
        desc:"Deal Electric damage to all foes equal to 59.6%/65.7%/63.3%/69.4% of Attack. Increase damage to main target by 25%.",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรูทุกตัว 59.6%/65.7%/63.3%/69.4% ของ Attack เพิ่มดาเมจต่อเป้าหมายหลัก 25%"},
      {name:'Sparky Surprise', type:'Skill', element:'-', sp:25, isBuff:true,
        desc:"Grant Player 2 to 1 ally for 2 turns and increase Yui's Attack by 39.0%/43.0%/41.4%/45.4%. For 2 turns, when an ally with Player 2 uses a skill to damage a foe, perform a follow-up dealing Electric damage equal to 132.9%/146.6%/141.1%/154.7% of Attack (max 2 times). Increase Jolly Cooperation activation chance by 10% for 2 turns. Cooldown: 1 turn.",
        descTh:"ให้ Player 2 แก่พันธมิตร 1 คน เป็นเวลา 2 เทิร์น และเพิ่ม Attack ของ Yui 39.0%/43.0%/41.4%/45.4% เป็นเวลา 2 เทิร์น เมื่อพันธมิตรที่มี Player 2 ใช้สกิลดาเมจ ดีลดาเมจไฟฟ้าตาม 132.9%/146.6%/141.1%/154.7% ของ Attack (สูงสุด 2 ครั้ง) เพิ่มโอกาสเปิดใช้ Jolly Cooperation 10% เป็นเวลา 2 เทิร์น Cooldown: 1 เทิร์น"},
      {name:'HIGHLIGHT', type:'Skill', element:'Electric', sp:0,
        desc:"Increase Attack by 34.2%/37.7%/36.3%/39.8% and follow-up damage by 24.4%/26.9%/25.9%/28.4% of Attack for 2 turns. Activate follow-up attacks when allies deal damage with skills for 2 turns. [4-turn cooldown]",
        descTh:"เพิ่ม Attack 34.2%/37.7%/36.3%/39.8% และดาเมจ follow-up 24.4%/26.9%/25.9%/28.4% ของ Attack เป็นเวลา 2 เทิร์น เปิดใช้ follow-up เมื่อพันธมิตรดีลดาเมจด้วยสกิล 2 เทิร์น [Cooldown: 4 เทิร์น]"},
      {name:'Virtual Landowner', type:'Passive', element:'-', sp:0,
        desc:"Increase follow-up damage to Shocked foes by 36.0%.",
        descTh:"เพิ่มดาเมจ follow-up ต่อศัตรูที่ติด Shock 36.0%"},
      {name:"Let's Go Together", type:'Passive', element:'-', sp:0,
        desc:"When an ally has Player 2, increase that ally and Yui's critical rate by 12.0% and Attack by 12.0%.",
        descTh:"เมื่อพันธมิตรมี Player 2 เพิ่ม CRIT Rate ของพันธมิตรนั้นและ Yui 12.0% และ Attack 12.0%"},
    ],
    awareness:[
      {name:'Jolly Cooperation',
        desc:"When an ally deals damage with a skill, 35% chance to activate a Resonance dealing Electric follow-up damage equal to 80% of Attack. After a follow-up, increase target's next Electric damage taken by 15% for 2 turns.",
        descTh:"เมื่อพันธมิตรดีลดาเมจด้วยสกิล มีโอกาส 35% เปิดใช้ Resonance ดีลดาเมจไฟฟ้า follow-up 80% ของ Attack หลัง follow-up เพิ่มดาเมจไฟฟ้าที่รับของเป้าหมาย 15% เป็นเวลา 2 เทิร์น"},
      {name:'Payappa',
        desc:"Increase critical rate of follow-up attacks by 20%. Increase critical rate by 10% after landing a follow-up on Shocked foes.",
        descTh:"เพิ่ม CRIT Rate ของ follow-up attack 20% เพิ่ม CRIT Rate 10% หลัง follow-up โจมตีศัตรูที่ติด Shock"},
      {name:'Welcome Rain',
        desc:"After performing a follow-up attack on a foe, increase Attack of Yui and allies with Player 2 by 10% for 2 turns. Stacks up to 3 times.",
        descTh:"หลัง follow-up โจมตีศัตรู เพิ่ม Attack ของ Yui และพันธมิตรที่มี Player 2 ขึ้น 10% เป็นเวลา 2 เทิร์น สะสมสูงสุด 3 ครั้ง"},
      {name:'Rainbow Maker',
        desc:"Increase the skill levels of Sparky Surprise and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Sparky Surprise และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Virtual Fertilizer',
        desc:"Highlight Enhanced: Increase critical damage of follow-up attacks by 40% for 2 turns.",
        descTh:"Highlight เสริม: เพิ่ม CRIT DMG ของ follow-up attack 40% เป็นเวลา 2 เทิร์น"},
      {name:'Flower Garden',
        desc:"Increase the skill levels of Electric Bomb and Meta Dynamite by 3.",
        descTh:"เพิ่มระดับสกิล Electric Bomb และ Meta Dynamite ขึ้น 3 ระดับ"},
      {name:'Humongously Huge Harvest',
        desc:"If only 1 foe is present, increase Yui's follow-up attack by 110% of Attack. Follow-up attacks also deal 25% of Attack damage to all other foes.",
        descTh:"หากมีศัตรูเพียง 1 ตัว เพิ่ม follow-up attack ของ Yui 110% ของ Attack follow-up attack ยังดีลดาเมจ 25% ของ Attack ต่อศัตรูอื่นทุกตัวด้วย"},
    ],
    baseStats: {hp:304, atk:102, def:50, spd:103},
    baseStatsLv80: [
      {hp:3420, atk:1150, def:567, spd:0},
      {hp:3482, atk:1171, def:577, spd:0},
      {hp:3543, atk:1192, def:587, spd:0},
      {hp:3605, atk:1212, def:597, spd:0},
      {hp:3666, atk:1233, def:607, spd:0},
      {hp:3728, atk:1253, def:618, spd:0},
      {hp:3790, atk:1274, def:628, spd:0},
    ],
    hiddenAbility: 'CRIT Rate +22.4%',
    weapons:[
      {name:'Cyber Jammers', stars:5,
        hp:2259, atk:760, def:374,
        bonusStats:{},
        abilityName:'Cyber Jammers',
        ability:[
          'Increase critical rate by 18.1%/18.1%/23.5%/23.5%/28.9%/28.9%/34.3%.',
          'Increase follow-up damage by 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0%.',
          'When a follow-up is activated by an ally with Player 2, or by an ally dealing Electric damage with a skill, increase follow-up damage by 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0% more.',],
        abilityTh:[
          'เพิ่ม CRIT Rate 18.1%/18.1%/23.5%/23.5%/28.9%/28.9%/34.3%',
          'เพิ่มดาเมจ follow-up 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0%',
          'เมื่อ follow-up ถูกเปิดใช้โดยพันธมิตรที่มี Player 2 หรือพันธมิตรที่ดีลดาเมจไฟฟ้าด้วยสกิล เพิ่มดาเมจ follow-up 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0% เพิ่มเติม',
        ]},
      {name:'Meta Directors', stars:4,
        hp:1808, atk:608, def:299,
        bonusStats:{},
        abilityName:'Meta Directors',
        ability:[
          "Increase critical rate by 7.3%/7.3%/9.5%/9.5%/11.7%/11.7%/13.9%.",
          "When performing a follow-up attack, increase Electric damage by 9.7%/12.6%/12.6%/15.5%/15.5%/18.4%/18.4% for 1 turn. Stacks up to 2 times.",
        ],
        abilityTh:[
          'เพิ่ม CRIT Rate 7.3%/7.3%/9.5%/9.5%/11.7%/11.7%/13.9%',
          'เมื่อดีล follow-up attack เพิ่มดาเมจไฟฟ้า 9.7%/12.6%/12.6%/15.5%/15.5%/18.4%/18.4% เป็นเวลา 1 เทิร์น สะสมสูงสุด 2 ครั้ง',
        ]},
    ],
  },
  {name:'Vino', codename:'Vino', role:'Saboteur', element:'Nuclear', rarity:4,
    cards:['Hindrance 4pc','Strife 2pc'], weapon:'Best ailment accuracy weapon (Jolting Pulse)',
    statPrio:['Ailment Accuracy%','ATK%','SPD'], note:'Nuclear Saboteur. All DEF-shred and damage-taken debuffs scale with ailment accuracy. Radiation + elemental ailment combos amplify party Nuclear damage. Perfect Timing converts ailment accuracy into raw ATK.',
    mechanics: "DEF shred และ damage-taken debuff ทั้งหมดของ Riddle สเกลตาม ailment accuracy — ailment accuracy สูงกว่า = debuff แรงกว่า ไม่มี cap นอกจากที่ระบุในค่าสูงสุด Radiation ที่ติดจากทักษะ stack กับ elemental ailment (Burn/Freeze/Shock) เพื่อเปิด Nuclear Amplification — ศัตรูที่มี Radiation + elemental ailment รับดาเมจ Nuclear สูงขึ้นจาก ally ทุกคน Perfect Timing แปลง ailment accuracy เป็น ATK โดยตรง รักษา ailment accuracy สูงสุดเพื่อ triple scaling: debuff แรงกว่า, Radiation amplification และ ATK conversion",
    rotation: [
      "เทิร์น 1 → DEF shred skill (สเกลตาม ailment accuracy → DEF ลดมหาศาลบนทุกศัตรู)",
      "เทิร์น 2 → ติด Radiation + elemental ailment (เตรียม Nuclear Amplification ให้ Nuclear DPS)",
      "รักษา Radiation + elemental ailment ให้ทับซ้อนกันเพื่อ Nuclear Amplification uptime เต็ม",
      "Perfect Timing passive: ailment accuracy แปลงเป็น ATK — maximize ailment accuracy เพื่อทั้งสองผล",
      "ใช้ Highlight เมื่อพร้อม → AoE DMG taken debuff + แพร่ Radiation",
      "คู่กับ Nuclear DPS (Makoto/Queen) ที่ได้ประโยชน์สูงสุดจาก Radiation + elemental ailment combo",
    ],
    realName:'Chizuko Nagao', persona:'Ampelos',
    weakRes:{ Fire:'wk', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'res',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Diving Ray', type:'Skill', element:'Nuclear', sp:20,
        desc:"Deal Nuclear damage to 1 foe equal to 170.8%/188.3%/177.8%/195.3% of Attack. For 2 turns, decrease the target's Defense by 22.5% of Chizuko's ailment accuracy (up to 37.3%/37.3%/38.8%/38.8%) and inflict a random elemental ailment that the target does not already have.",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 1 ตัว 170.8%/188.3%/177.8%/195.3% ของ Attack เป็นเวลา 2 เทิร์น ลด DEF เป้าหมาย 22.5% ของ ailment accuracy Chizuko (สูงสุด 37.3%/37.3%/38.8%/38.8%) และทำให้ติดสภาวะธาตุสุ่มที่ยังไม่มี"},
      {name:'Blunt Edge', type:'Skill', element:'Nuclear', sp:22,
        desc:"Deal Nuclear damage to all foes equal to 91.5%/100.9%/95.2%/104.6% of Attack. Has a 40% chance to inflict a random elemental ailment that the foe does not already have.",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรูทุกตัว 91.5%/100.9%/95.2%/104.6% ของ Attack มีโอกาส 40% ทำให้ติดสภาวะธาตุสุ่มที่ยังไม่มี"},
      {name:'Bullseye Bomber', type:'Skill', element:'Nuclear', sp:24,
        desc:"Deal Nuclear damage to 1 foe equal to 195.2%/215.2%/203.2%/223.2% of Attack. Increase the target's damage taken by 11.3% of Chizuko's ailment accuracy (up to 18.7%/20.7%/19.5%/21.4%) for 2 turns, based on the number of unique elemental ailments they have. [1-turn cooldown]",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 1 ตัว 195.2%/215.2%/203.2%/223.2% ของ Attack เพิ่มดาเมจที่รับของเป้าหมาย 11.3% ของ ailment accuracy Chizuko (สูงสุด 18.7%/20.7%/19.5%/21.4%) 2 เทิร์น ตามจำนวนสภาวะธาตุต่างชนิดบนเป้าหมาย [Cooldown: 1 เทิร์น]"},
      {name:'HIGHLIGHT', type:'Skill', element:'Nuclear', sp:0,
        desc:"Deal Nuclear damage to 1 foe equal to 324.5%/357.8%/337.8%/371.1% of Attack. Has a 75% chance to inflict 2 random elemental ailments that the foe does not already have. [4-turn cooldown]",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 1 ตัว 324.5%/357.8%/337.8%/371.1% ของ Attack มีโอกาส 75% ทำให้ติดสภาวะธาตุสุ่ม 2 ชนิดที่ยังไม่มี [Cooldown: 4 เทิร์น]"},
      {name:'Eagle Eye', type:'Passive', element:'-', sp:0,
        desc:"Increase Nuclear damage taken by foes with Radiation by 15.0%. Lasts for 2 turns.",
        descTh:"เพิ่มดาเมจนิวเคลียร์ที่รับของศัตรูที่มี Radiation 15.0% มีอายุ 2 เทิร์น"},
      {name:'Perfect Timing', type:'Passive', element:'-', sp:0,
        desc:"Increase Attack by 45.0% of ailment accuracy.",
        descTh:"เพิ่ม Attack 45.0% ของ ailment accuracy"},
    ],
    awareness:[
      {name:'Veteran Technique',
        desc:"Inflict Radiation on foes with elemental ailments for 2 turns. Radiation: Increase damage taken by 15%. Radiation counts as an elemental ailment.",
        descTh:"ทำให้ศัตรูที่มีสภาวะธาตุติด Radiation 2 เทิร์น Radiation: เพิ่มดาเมจที่รับ 15% Radiation นับเป็นสภาวะธาตุ"},
      {name:'Grandmotherly Care',
        desc:"When foes with Radiation are also inflicted with Burn, Shock, Freeze, or Windswept, increase corresponding Fire, Electric, Ice, or Wind damage taken by 15%.",
        descTh:"เมื่อศัตรูที่มี Radiation ยังติด Burn, Shock, Freeze หรือ Windswept เพิ่มดาเมจ Fire, Electric, Ice หรือ Wind ที่รับตามลำดับ 15%"},
      {name:'From Now On',
        desc:"When an ally inflicts an elemental ailment, increase Chizuko's ailment accuracy by 10% for 2 turns. Stacks up to 3 times.",
        descTh:"เมื่อพันธมิตรทำให้ศัตรูติดสภาวะธาตุ เพิ่ม ailment accuracy ของ Chizuko 10% 2 เทิร์น สะสมสูงสุด 3 ครั้ง"},
      {name:'Jazz Session',
        desc:"Increase the skill levels of Diving Ray and Blunt Edge by 2.",
        descTh:"เพิ่มระดับสกิล Diving Ray และ Blunt Edge ขึ้น 2 ระดับ"},
      {name:'The Older, the Wiser',
        desc:"Highlight Enhanced: Increase foes' Nuclear damage taken by 35.2% for 2 turns.",
        descTh:"Highlight เสริม: เพิ่มดาเมจนิวเคลียร์ที่รับของศัตรู 35.2% เป็นเวลา 2 เทิร์น"},
      {name:'Long-time Player',
        desc:"Increase the skill levels of Bullseye Bomber and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Bullseye Bomber และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Unending',
        desc:"When an ally attacks a foe with Radiation, activate effects based on unique elemental ailments on the foe (effects stack): 1+: ATK +10%. 2+: Nuclear damage +10%. 3+: Pierce rate +8%.",
        descTh:"เมื่อพันธมิตรโจมตีศัตรูที่มี Radiation เปิดใช้เอฟเฟกต์ตามสภาวะธาตุต่างชนิดบนศัตรู (เอฟเฟกต์สะสม): 1+: ATK +10% 2+: ดาเมจนิวเคลียร์ +10% 3+: pierce rate +8%"},
    ],
    baseStats: {hp:220, atk:70, def:44, spd:103},
    baseStatsLv80: [
      {hp:2475, atk:788, def:505, spd:0},
      {hp:2504, atk:797, def:511, spd:0},
      {hp:2532, atk:806, def:517, spd:0},
      {hp:2561, atk:815, def:523, spd:0},
      {hp:2590, atk:824, def:529, spd:0},
      {hp:2618, atk:833, def:534, spd:0},
      {hp:2647, atk:842, def:541, spd:0},
    ],
    hiddenAbility: 'Ailment Accuracy +26.1%',
    weapons:[
      {name:'Jolting Pulse', stars:5,
        hp:2180, atk:694, def:445,
        bonusStats:{},
        abilityName:'Shakedown',
        ability:[
          'Increase ailment accuracy by 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%.',
          'After inflicting an elemental ailment on a foe, decrease the target\'s Defense by 33.0%/43.0%/43.0%/53.0%/53.0%/63.0%/63.0% for 2 turns. This effect does not stack.',
          'Every 2 turns, at the start of Chizuko\'s action, 80.0%/95.0%/95.0%/110.0%/110.0%/125.0%/125.0% base chance to inflict 1 foe with a random elemental ailment that it does not have.',],
        abilityTh:[
          'เพิ่ม ailment accuracy 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%',
          'หลังทำให้ศัตรูติดสภาวะธาตุ ลด DEF เป้าหมาย 33.0%/43.0%/43.0%/53.0%/53.0%/63.0%/63.0% 2 เทิร์น เอฟเฟกต์นี้ไม่สะสม',
          'ทุก 2 เทิร์น ต้นแอ็คชัน Chizuko มีโอกาสฐาน 80.0%/95.0%/95.0%/110.0%/110.0%/125.0%/125.0% ทำให้ศัตรู 1 ตัวติดสภาวะธาตุสุ่มที่ยังไม่มี',
        ]},
      {name:'Gravitational Force', stars:4,
        hp:1744, atk:555, def:356,
        bonusStats:{atk:24},
        abilityName:'Quantum Radiation',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When a foe with an elemental ailment is present, decrease that foe\'s Defense by 9.6%/12.4%/12.4%/15.2%/15.2%/18.0%/18.0%. Also, when inflicted with Radiation, decrease Defense by 9.6%/12.4%/12.4%/15.2%/15.2%/18.0%/18.0% more.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อมีศัตรูที่มีสภาวะธาตุ ลด DEF ศัตรูนั้น 9.6%/12.4%/12.4%/15.2%/15.2%/18.0%/18.0% เมื่อมี Radiation ด้วย ลด DEF เพิ่มอีก 9.6%/12.4%/12.4%/15.2%/15.2%/18.0%/18.0%',
        ]},
    ],
  },
  {name:'Riddle', codename:'Riddle', role:'Strategist', element:'Psychokinesis', rarity:5,
    cards:['Reconciliation 4pc','Opulence 2pc'], weapon:'Best Psy ATK support weapon',
    statPrio:['ATK%','SPD','HP%'], note:'Psy Strategist. Childish Heart stacks → Off to Treasure Hunt ATK buff. Surprise Squad grants Affection enabling party follow-up CH generation. Mystery stacks amplify Highlight damage.',
    mechanics: "Childish Heart stack มาจากทักษะของ Haruna เองและจาก Affection — เมื่อ party มี Affection ดาเมจทักษะของพวกเขาให้ Childish Heart แก่ Haruna 1 stack Surprise Squad มอบ Affection ให้ทุก ally ในปาร์ตี้ ทำให้ Childish Heart สะสมทุกครั้งที่พวกเขาใช้ทักษะ Off to Treasure Hunt ใช้ Childish Heart stack เพื่อบัฟ ATK ทุก ally (scaling) Mystery stack (ได้ต่อ Childish Heart ที่ได้) เพิ่มดาเมจ Highlight +7.8% ต่อ stack Safety in Numbers ให้โบนัส +24% เมื่อใช้ 3+ stack พร้อมกัน",
    rotation: [
      "เทิร์น 1 → Surprise Squad (มอบ Affection ทุก ally → ปาร์ตี้สะสม Childish Heart ทุก skill action)",
      "เทิร์น 2 → Off to Treasure Hunt (ใช้ Childish Heart stack ทั้งหมด → ATK buff ปาร์ตี้; 3+ = Safety in Numbers bonus)",
      "ระหว่างนั้น: ใช้ Psy skill สร้างดาเมจและสะสม Mystery stack เพื่อ Highlight ทรงพลัง",
      "เมื่อ Mystery stack สูง → Highlight สำหรับ Psy burst คูณ Mystery bonus",
      "ต่ออายุ Surprise Squad เมื่อ Affection หมด เพื่อรักษาการสะสม Childish Heart passive",
      "กับ M5: เมื่อ Affection active การสะสม stack ต่อเนื่อง — Off to Treasure Hunt กลายเป็น ATK buff ทรงพลังซ้ำๆ",
    ],
    realName:'Haruna Nishimori', persona:'Diaera',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'wk', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'res' },
    skills:[
      {name:'Surprise Squad', type:'Skill', element:'Psychokinesis', sp:20,
        desc:"Deal Psychokinesis damage to 1 foe equal to 146.4%/161.4%/155.4%/170.4% of Attack, and grant Affection to party for 1 turn. Affection: When dealing damage with a skill, grant Haruna 1 Childish Heart stack.",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรู 1 ตัว 146.4%/161.4%/155.4%/170.4% ของ Attack และมอบ Affection ให้ปาร์ตี้ 1 เทิร์น Affection: เมื่อดีลดาเมจด้วยสกิล มอบ Childish Heart 1 stack ให้ Haruna"},
      {name:'Ready for Adventure', type:'Skill', element:'-', sp:22, isBuff:true,
        desc:"Increase party's healing received and shield received by 17.6%/19.4%/18.6%/20.4%, and Defense by 34.2%/37.7%/36.3%/39.8% for 2 turns. If Haruna does not have Childish Heart, gain 2 Childish Heart stacks.",
        descTh:"เพิ่ม healing received และ shield received ของปาร์ตี้ 17.6%/19.4%/18.6%/20.4% และ DEF 34.2%/37.7%/36.3%/39.8% เป็นเวลา 2 เทิร์น หาก Haruna ไม่มี Childish Heart รับ Childish Heart 2 stack"},
      {name:'Courageous Campaign', type:'Skill', element:'-', sp:24, isBuff:true,
        desc:"Requires Childish Heart. Increase party's Attack by 10% for 2 turns. At 2 or more stacks of Childish Heart, also increase party's damage by 1% for every 100 of Haruna's Attack, up to 48.8%/53.8%/51.8%/56.8%.",
        descTh:"ต้องมี Childish Heart เพิ่ม ATK ปาร์ตี้ 10% เป็นเวลา 2 เทิร์น ที่ Childish Heart 2+ stack เพิ่มดาเมจปาร์ตี้ 1% ต่อ ATK ทุก 100 สูงสุด 48.8%/53.8%/51.8%/56.8%"},
      {name:'HIGHLIGHT', type:'Skill', element:'Psychokinesis', sp:0,
        desc:"Deal Psychokinesis damage to 1 foe equal to 366.0%/403.5%/388.5%/426.0% of Attack. Increase party's damage by 7.8%/8.6%/8.3%/9.1% for each stack of Mystery for 1 turn. [4-turn cooldown]",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรู 1 ตัว 366.0%/403.5%/388.5%/426.0% ของ Attack เพิ่มดาเมจปาร์ตี้ 7.8%/8.6%/8.3%/9.1% ต่อ Mystery stack เป็นเวลา 1 เทิร์น [Cooldown: 4 เทิร์น]"},
      {name:"Let's Hold Hands", type:'Passive', element:'-', sp:0,
        desc:"Each time an ally with Affection deals damage, 40.0% chance to gain 1 Childish Heart stack.",
        descTh:"ทุกครั้งที่พันธมิตรที่มี Affection ดีลดาเมจ มีโอกาส 40.0% รับ Childish Heart 1 stack"},
      {name:'Safety in Numbers', type:'Passive', element:'-', sp:0,
        desc:"When spending 3 or more Childish Heart stacks at once, increase effects of Off to Treasure Hunt by 24.0% more.",
        descTh:"เมื่อใช้ Childish Heart 3 stack ขึ้นไปพร้อมกัน เพิ่มผล Off to Treasure Hunt อีก 24.0%"},
    ],
    awareness:[
      {name:'Off to Treasure Hunt',
        desc:"When using a skill, spend all Childish Heart stacks to increase party's Attack by 8% for each Childish Heart stack spent for 2 turns (max 5 stacks). When Haruna gains Childish Heart stacks, gain the same number of Mystery stacks. Mystery stacks are lost when Haruna uses a Highlight or after 2 turns, stacking up to 5 times.",
        descTh:"เมื่อใช้สกิล ใช้ Childish Heart ทั้งหมดเพื่อเพิ่ม ATK ปาร์ตี้ 8% ต่อ stack ที่ใช้ 2 เทิร์น (สูงสุด 5 stack) เมื่อ Haruna รับ Childish Heart ให้ได้รับ Mystery stack เท่ากัน Mystery stack หายเมื่อ Haruna ใช้ Highlight หรือหลัง 2 เทิร์น สะสมสูงสุด 5 stack"},
      {name:"Let's Go, Everyone!",
        desc:"When an ally deals damage with a skill, increase Haruna's Attack by 20% (stacks up to 3 times). This effect ends when Haruna uses a skill. When Haruna's Attack is increased 2 times, increase party's damage by 15% for 1 turn.",
        descTh:"เมื่อพันธมิตรดีลดาเมจด้วยสกิล เพิ่ม ATK Haruna 20% (สะสมสูงสุด 3 ครั้ง) ผลนี้สิ้นสุดเมื่อ Haruna ใช้สกิล เมื่อ ATK Haruna เพิ่มขึ้น 2 ครั้ง เพิ่มดาเมจปาร์ตี้ 15% 1 เทิร์น"},
      {name:'Here to Help',
        desc:"Let's Hold Hands increases the chance of gaining Childish Heart by 20%. When using Courageous Campaign and Childish Heart stacks are at maximum, increase Attack and critical damage by 24% for 2 turns.",
        descTh:"Let's Hold Hands เพิ่มโอกาสรับ Childish Heart 20% เมื่อใช้ Courageous Campaign และ Childish Heart เต็ม stack เพิ่ม ATK และ CRIT DMG 24% 2 เทิร์น"},
      {name:'Still Growing',
        desc:"Increase the skill levels of Courageous Campaign and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Courageous Campaign และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Give It to Them',
        desc:"Highlight Enhanced: Extend damage increase duration by 2 turns.",
        descTh:"Highlight เสริม: ขยายระยะเวลาเพิ่มดาเมจออกไป 2 เทิร์น"},
      {name:'A Little Maintenance',
        desc:"Increase the skill levels of Surprise Squad and Ready for Adventure by 3.",
        descTh:"เพิ่มระดับสกิล Surprise Squad และ Ready for Adventure ขึ้น 3 ระดับ"},
      {name:'Puzzle Solver',
        desc:"When Childish Heart reaches 5 stacks, gain Curiosity. Curiosity: When Haruna deals damage with a skill, increase damage by 75%. This effect ends after dealing skill damage to foes.",
        descTh:"เมื่อ Childish Heart ถึง 5 stack รับ Curiosity Curiosity: เมื่อ Haruna ดีลดาเมจด้วยสกิล เพิ่มดาเมจ 75% ผลนี้สิ้นสุดหลังดีลดาเมจสกิลต่อศัตรู"},
    ],
    baseStats: {hp:315, atk:89, def:58, spd:101},
    baseStatsLv80: [
      {hp:3540, atk:1010, def:660, spd:0},
      {hp:3604, atk:1028, def:672, spd:0},
      {hp:3667, atk:1046, def:684, spd:0},
      {hp:3731, atk:1064, def:696, spd:0},
      {hp:3795, atk:1083, def:707, spd:0},
      {hp:3858, atk:1101, def:719, spd:0},
      {hp:3922, atk:1119, def:731, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Sweet Pickaxe', stars:5,
        hp:2339, atk:667, def:436,
        bonusStats:{atk:30},
        abilityName:'Sweet Pickaxe',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'After spending Childish Heart, gain Whimsy based on number of stacks spent: When Haruna has Whimsy, increase Attack by 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0%.',
          'When allies deal damage with skills, spend 1 Whimsy, and increase the damage by 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0%. Whimsy lasts for 2 turns.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'หลังใช้ Childish Heart รับ Whimsy ตามจำนวน stack ที่ใช้ เมื่อ Haruna มี Whimsy เพิ่ม Attack 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0%',
          'เมื่อพันธมิตรดีลดาเมจด้วยสกิล ใช้ Whimsy 1 stack และเพิ่มดาเมจ 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0% Whimsy มีอายุ 2 เทิร์น',
        ]},
      {name:'Chirpy Pickaxe', stars:4,
        hp:1871, atk:534, def:349,
        bonusStats:{atk:24},
        abilityName:'Chirpy Pickaxe',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "After using a skill on an ally, for each Attack buff on the ally, increase Attack by 2.4%/3.1%/3.1%/3.8%/3.8%/4.5%/4.5% for 2 turns. Stacks up to 3 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังใช้สกิลต่อพันธมิตร ต่อ ATK buff บนพันธมิตร เพิ่ม Attack 2.4%/3.1%/3.1%/3.8%/3.8%/4.5%/4.5% 2 เทิร์น สะสมสูงสุด 3 ครั้ง',
        ]},
    ],
  },
  {name:'Cattle',             codename:'Cattle',         role:'Medic',      element:'Fire',           rarity:4, cards:['Love 4pc','Peace 2pc'],     weapon:'Best Healing weapon',                           statPrio:['HP%','Healing Bonus%','DEF%'],                   note:'4★ Fire Healer. Provides consistent HP recovery for the party.',
    mechanics: "Lufel เป็นฮีลเลอร์แบบตรงไปตรงมา ทั้ง single-target และ AoE ซึ่งการฮีลสเกลตาม HP% และ Healing Bonus% Owl Fire ติด Burn บนเป้าและลด healing received (debuff role) Owl Green ฮีล ally เดี่ยวและให้ damage bonus เมื่อ ally นั้น HP ต่ำกว่า 50% Highlight ฮีลปาร์ตี้ทั้งหมดและให้ ATK buff ชั่วคราว ในฐานะฮีลเลอร์ 4★ บทบาทหลักของ Lufel คือฮีล HP ปาร์ตี้ต่อเนื่องในเนื้อหาที่ยังไม่มีฮีลเลอร์ 5★ ที่ดีกว่า",
    rotation: [
      "เทิร์น 1 → Owl Green (ฮีล single-target บน ally HP ต่ำสุด; +DMG bonus ถ้า HP < 50%)",
      "เทิร์น 2 → Owl Fire (สร้าง Fire DMG + ติด Burn + ลด healing ที่ศัตรูรับ)",
      "ใช้ Highlight เมื่อพร้อม → ฮีลปาร์ตี้ทั้งหมด + ATK buff ปาร์ตี้ 2 เทิร์น",
      "ให้ความสำคัญ Owl Green บน ally ที่ HP วิกฤตก่อนใช้ทักษะโจมตี",
      "สะสม HP% เพื่อ scaling ค่าฮีล; Healing Bonus% เพิ่มทุกการฮีลตามสัดส่วน",
      "ใช้เป็น budget healer — สเกลได้ดีด้วยการลงทุน HP แม้จะเป็นยูนิต 4★",
    ],
    realName:'Lufel', persona:'Robroy',
    weakRes:{ Fire:'res', Ice:'normal', Electric:'normal', Wind:'wk', Nuclear:'normal', Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Owl Fire',          type:'Skill',   element:'Fire', sp:22,
        desc:"Deal Fire damage to 1 foe equal to 113.2%/124.8%/117.9%/129.5% of Attack, inflict Burn for 2 turns, and decrease healing received by 30%.",
        descTh:"สร้างความเสียหายธาตุไฟให้ศัตรู 1 ตัว เท่ากับ 113.2%/124.8%/117.9%/129.5% ของ Attack ทำให้ติด Burn 2 เทิร์น และลดการรับการฟื้นฟูของเป้าหมาย 30%"},
      {name:'Owl Green',         type:'Skill',   element:'-',    sp:24, isBuff:true,
        desc:"Restore 1 ally's HP by 67.4%/67.4%/70.2%/70.2% of Lufel's Attack + 1920/2334/2209/2623. If target's HP is below 50%, increase healing effect by 19%/19%/20%/20%.",
        descTh:"ฟื้นฟู HP ของพันธมิตร 1 คน 67.4%/67.4%/70.2%/70.2% ของ Attack ของ Lufel + 1920/2334/2209/2623 หาก HP ของเป้าหมายต่ำกว่า 50% เพิ่มประสิทธิภาพการฟื้นฟู 19%/19%/20%/20%"},
      {name:'Healing Satellite', type:'Skill',   element:'-',    sp:31, isBuff:true,
        desc:"Restore party's HP by 42.1%/42.1%/43.8%/43.8% of Lufel's Attack + 1197/1456/1378/1636. Increase healing effect on the main target by 24%/24%/25%/25%.",
        descTh:"ฟื้นฟู HP ของปาร์ตี้ 42.1%/42.1%/43.8%/43.8% ของ Attack ของ Lufel + 1197/1456/1378/1636 เพิ่มประสิทธิภาพการฟื้นฟูต่อเป้าหมายหลัก 24%/24%/25%/25%"},
      {name:'Highlight',         type:'Skill',   element:'-',    sp:0,  isBuff:true,
        desc:"Restore party's HP by 59.7%/59.7%/62.2%/62.2% of Lufel's Attack + 1700/2067/1956/2323. Increase party's Attack by 33.2%/33.2%/34.5%/34.5% for 1 turn.",
        descTh:"ฟื้นฟู HP ของปาร์ตี้ 59.7%/59.7%/62.2%/62.2% ของ Attack ของ Lufel + 1700/2067/1956/2323 เพิ่ม Attack ของปาร์ตี้ 33.2%/33.2%/34.5%/34.5% เป็นเวลา 1 เทิร์น"},
      {name:'Forest Sage',       type:'Passive', element:'-',    sp:0,
        desc:"After attacking with a skill, grant Starfire to up to 3 allies.",
        descTh:"หลังจากโจมตีด้วยสกิล ให้ Starfire แก่พันธมิตรสูงสุด 3 คน"},
      {name:'Sparks of Support', type:'Passive', element:'-',    sp:0,
        desc:"Increase healing effect based on Lufel's max HP. The effect is maximized at 12000 HP, and healing effect will increase by 42.0%.",
        descTh:"เพิ่มประสิทธิภาพการฟื้นฟูตาม HP สูงสุดของ Lufel เอฟเฟกต์สูงสุดที่ 12000 HP และจะเพิ่มประสิทธิภาพการฟื้นฟู 42.0%"},
    ],
    awareness:[
      {name:'Redheaded Hero',
        desc:"When using healing skills, grant Starfire I to the main target for 1 turn. After Starfire I ends, grant Starfire II for 1 turn.\nStarfire I: Increase Attack by 4% of Lufel's Attack (up to 160).\nStarfire II: Increase Attack by 8% of Lufel's Attack (up to 320).\n*Starfire does not stack, and only 1 stack is granted.",
        descTh:"เมื่อใช้สกิลฟื้นฟู ให้ Starfire I แก่เป้าหมายหลัก 1 เทิร์น หลังจาก Starfire I สิ้นสุด ให้ Starfire II 1 เทิร์น\nStarfire I: เพิ่ม Attack 4% ของ Attack ของ Lufel (สูงสุด 160)\nStarfire II: เพิ่ม Attack 8% ของ Attack ของ Lufel (สูงสุด 320)\n*Starfire ไม่สะสม และให้ได้เพียง 1 stack เท่านั้น"},
      {name:'Owl Eyes',
        desc:"At the start of battle, inflict Burn on the foe with the highest remaining HP. Also, increase allies' elemental ailment accuracy by 33% when they have Starfire.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ ทำให้ศัตรูที่มี HP เหลือมากที่สุดติด Burn นอกจากนี้ เพิ่ม elemental ailment accuracy ของพันธมิตรที่มี Starfire 33%"},
      {name:'Nocturnal',
        desc:"When healing an ally who has Starfire II, increase healing effect by 10%.",
        descTh:"เมื่อฟื้นฟู HP ให้พันธมิตรที่มี Starfire II เพิ่มประสิทธิภาพการฟื้นฟู 10%"},
      {name:'Soaring Bird of Prey',
        desc:"Increase the skill levels of Owl Fire and Owl Green by 2.",
        descTh:"เพิ่มระดับสกิล Owl Fire และ Owl Green ขึ้น 2"},
      {name:'Sheltering Wings of Light',
        desc:"Highlight Enhanced: Increase party's Fire damage by 32% for 1 turn.",
        descTh:"Highlight Enhanced: เพิ่มความเสียหายธาตุไฟของปาร์ตี้ 32% เป็นเวลา 1 เทิร์น"},
      {name:'Preening',
        desc:"Increase the skill levels of Healing Satellite and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Healing Satellite และ Thief Tactics ขึ้น 2"},
      {name:'Midnight Bonfire',
        desc:"After Starfire II ends, gain Starfire III for 1 turn.\nStarfire III: Increase Attack by 8% of Lufel's Attack, increase Fire damage by 20%, and increase healing received by 10%.",
        descTh:"หลังจาก Starfire II สิ้นสุด รับ Starfire III 1 เทิร์น\nStarfire III: เพิ่ม Attack 8% ของ Attack ของ Lufel เพิ่มความเสียหายธาตุไฟ 20% และเพิ่มการรับการฟื้นฟู 10%"},
    ],
    baseStats:     {hp:250, atk:70, def:42, spd:95},
    baseStatsLv80: [
      {hp:2812, atk:788, def:475, spd:95},
      {hp:2845, atk:797, def:481, spd:95},
      {hp:2877, atk:806, def:487, spd:95},
      {hp:2910, atk:815, def:492, spd:95},
      {hp:2942, atk:824, def:497, spd:95},
      {hp:2975, atk:833, def:503, spd:95},
      {hp:3007, atk:842, def:508, spd:95},
    ],
    hiddenAbility: 'HP% +21.8%',
    weapons:[
      {
        name: 'Fallen Angel Wing', stars:5,
        hp: 2478, atk: 694, def: 418,
        bonusStats: {heal:22},
        abilityName: 'Fallen Angel Wing',
        ability: [
          'Increase healing effect by 22.0%/22.0%/28.5%/28.5%/35.0%/35.0%/41.5%.',
          'For each Starfire stack on allies, increase healing received by 4.5%/5.9%/5.9%/7.3%/7.3%/8.7%/8.7%, and increase Attack by 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0%.',],
        abilityTh: [
          'เพิ่มประสิทธิภาพการฟื้นฟู 22.0%/22.0%/28.5%/28.5%/35.0%/35.0%/41.5%',
          'ต่อ Starfire stack ที่พันธมิตรมี เพิ่มการรับการฟื้นฟู 4.5%/5.9%/5.9%/7.3%/7.3%/8.7%/8.7% และเพิ่ม Attack 22.0%/29.0%/29.0%/36.0%/36.0%/43.0%/43.0%',
        ],
      },
      {
        name: 'Lava Flame', stars:4,
        hp: 1982, atk: 555, def: 335,
        bonusStats: {atk:12},
        abilityName: 'Lava Flame',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "If Starfire is active, increase healing effect by 6.9%/9.0%/9.0%/11.1%/11.1%/13.2%/13.2% per stack of Starfire.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หาก Starfire ทำงานอยู่ เพิ่มประสิทธิภาพการฟื้นฟู 6.9%/9.0%/9.0%/11.1%/11.1%/13.2%/13.2% ต่อ Starfire stack',
        ],
      },
    ],
  },
  {name:'Leon', codename:'Leon', role:'Guardian', element:'Nuclear', rarity:4,
    cards:['Peace 4pc','Triumph 2pc'], weapon:'Best ATK support weapon (Final Buster)',
    statPrio:['ATK%','HP%','DEF%'], note:'Nuclear Guardian/buffer. Power of Friendship stacks amplify ally ATK and CRIT DMG. Justice Barrier converts ally HP into a shield; Energy Recharge returns that HP when the shield expires. ATK scales all shield/buff values.',
    mechanics: "Power of Friendship stack สะสมจากทักษะและ action ของ ally (สูงสุด 4-5) แต่ละ stack เพิ่ม ATK และ CRIT DMG ของ ally ถาวร Justice Barrier แปลง HP ของ ally ที่เลือกเป็น shield ขนาดใหญ่ — Energy Recharge ฟื้น HP ที่เสียไปนั้นเมื่อ shield หมดหรือถูกทำลาย ATK สเกลค่า shield และโบนัสบัฟทั้งหมด ในฐานะ Nuclear Guardian Leon ให้ offensive support (ATK/CRIT DMG buffs) พร้อมรักษา survivability ปาร์ตี้ผ่าน shield ที่ HP ฟื้นได้",
    rotation: [
      "เทิร์น 1 → Power of Friendship skill (สะสม stack; แต่ละ stack ATK + CRIT DMG ของ ally เพิ่มถาวร)",
      "เทิร์น 2 → Justice Barrier บน ally ที่เปราะบางหรือดาเมจสูงสุด (แปลง HP เป็น shield ใหญ่; Energy Recharge ฟื้น HP ทีหลัง)",
      "สะสม Power of Friendship ถึง max (4-5 stack) เร็วๆ เพื่อ party buffs ถาวร",
      "Atomic Smash เมื่อศัตรู Down → Nuclear Technical สำหรับดาเมจโบนัส + Down Point exploitation",
      "ใช้ Highlight เมื่อพร้อม → Nuclear burst + เสริม party buff",
      "สะสม ATK% เพื่อทั้ง shield scaling และ Power of Friendship buff — ATK สเกลทุกอย่าง",
    ],
    realName:'Leo Kamiyama', persona:'Erytheia',
    weakRes:{ Fire:'wk', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'res',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Atomic Smash', type:'Skill', element:'Nuclear', sp:20,
        desc:"Deal Nuclear damage to 1 foe equal to 170.8%/188.3%/177.8%/195.3% of Attack. For each stack of Power of Friendship the party has, increase damage by 10%.",
        descTh:"ดีลดาเมจนิวเคลียร์ต่อศัตรู 1 ตัว 170.8%/188.3%/177.8%/195.3% ของ Attack ต่อ Power of Friendship stack ที่ปาร์ตี้มี เพิ่มดาเมจ 10%"},
      {name:'Justice Barrier', type:'Skill', element:'-', sp:20, isBuff:true,
        desc:"Spend 30% of 1 other ally's remaining HP to grant them a shield equal to 80% of HP spent + 31.6%/31.6%/32.9%/32.9% of Kamiyama's Attack + 900/1095/1035/1230 for 2 turns. Also grant 1 Power of Friendship stack.",
        descTh:"ใช้ HP ที่เหลือ 30% ของพันธมิตรอีก 1 คนเพื่อมอบ shield เท่ากับ HP ที่ใช้ 80% + 31.6%/31.6%/32.9%/32.9% ของ Attack Kamiyama + 900/1095/1035/1230 เป็นเวลา 2 เทิร์น และมอบ Power of Friendship 1 stack"},
      {name:'Ultima Booster', type:'Skill', element:'-', sp:24, isBuff:true,
        desc:"Increase 1 ally's Attack by 19.5%/19.5%/20.3%/20.3% for 2 turns (other than Kamiyama). For each stack of Power of Friendship the target has, increase Attack by 20% of Kamiyama's Attack more (up to 1516.7/1672.1/1578.9/1734.3).",
        descTh:"เพิ่ม Attack ของพันธมิตร 1 คน (ยกเว้น Kamiyama) 19.5%/19.5%/20.3%/20.3% 2 เทิร์น ต่อ Power of Friendship stack ที่เป้าหมายมี เพิ่ม Attack อีก 20% ของ Attack Kamiyama (สูงสุด 1516.7/1672.1/1578.9/1734.3)"},
      {name:'HIGHLIGHT', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Grant the maximum number of Power of Friendship stacks to 1 ally (other than Kamiyama) for 2 turns. If the target's HP is below 60%, restore their HP up to 60% (healing capped at 200% of Kamiyama's Attack). Increase Attack by 15% of Kamiyama's Attack (up to 585.6/645.6/609.6/669.6) for 2 turns. [4-turn cooldown]",
        descTh:"มอบ Power of Friendship stack สูงสุดให้พันธมิตร 1 คน (ยกเว้น Kamiyama) 2 เทิร์น หาก HP เป้าหมายต่ำกว่า 60% ฟื้นฟู HP ขึ้นถึง 60% (จำกัดที่ 200% ของ Attack Kamiyama) เพิ่ม Attack 15% ของ Attack Kamiyama (สูงสุด 585.6/645.6/609.6/669.6) 2 เทิร์น [Cooldown: 4 เทิร์น]"},
      {name:'Energy Recharge', type:'Passive', element:'-', sp:0,
        desc:"When Justice Barrier ends, restore HP equal to 100.0% of remaining shield.",
        descTh:"เมื่อ Justice Barrier สิ้นสุด ฟื้นฟู HP เท่ากับ 100.0% ของ shield ที่เหลือ"},
      {name:'Full Power: Start!', type:'Passive', element:'-', sp:0,
        desc:"Increase allies' critical damage by 45.0% when they have 2 Power of Friendship stacks.",
        descTh:"เพิ่ม CRIT DMG ของพันธมิตร 45.0% เมื่อมี Power of Friendship 2 stack"},
    ],
    awareness:[
      {name:'Hyper Hero Time!',
        desc:"Grant 1 Power of Friendship stack to allies when their HP falls to 75% or less. Stacks up to 2 times. When allies have Power of Friendship, increase Attack by 6% of Kamiyama's Attack (up to 120/180/240 at Lv.1/50/70) for 1 turn.",
        descTh:"มอบ Power of Friendship 1 stack ให้พันธมิตรเมื่อ HP ลดลงถึง 75% หรือต่ำกว่า สะสมสูงสุด 2 ครั้ง เมื่อพันธมิตรมี Power of Friendship เพิ่ม Attack 6% ของ Attack Kamiyama (สูงสุด 120/180/240 ที่ Lv.1/50/70) 1 เทิร์น"},
      {name:'Intense Link',
        desc:"Increase allies' Defense by 10% when they have Power of Friendship.",
        descTh:"เพิ่ม DEF ของพันธมิตร 10% เมื่อมี Power of Friendship"},
      {name:'Undying Justice',
        desc:"After using skills on allies, increase own Attack by 25%.",
        descTh:"หลังใช้สกิลต่อพันธมิตร เพิ่ม Attack ของตัวเอง 25%"},
      {name:'Serious Action',
        desc:"Increase the skill levels of Atomic Smash and Justice Barrier by 2.",
        descTh:"เพิ่มระดับสกิล Atomic Smash และ Justice Barrier ขึ้น 2 ระดับ"},
      {name:"Hero's Journey Home",
        desc:"Highlight Enhanced: Increase target's critical damage by 25% for 2 turns.",
        descTh:"Highlight เสริม: เพิ่ม CRIT DMG ของเป้าหมาย 25% 2 เทิร์น"},
      {name:'Self-Discipline',
        desc:"Increase the skill levels of Ultima Booster and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Ultima Booster และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Turning the Tables',
        desc:"When using a skill on an ally with HP below 60%, increase critical damage by 25% for 1 turn.",
        descTh:"เมื่อใช้สกิลต่อพันธมิตรที่มี HP ต่ำกว่า 60% เพิ่ม CRIT DMG 25% 1 เทิร์น"},
    ],
    baseStats: {hp:232, atk:69, def:43, spd:100},
    baseStatsLv80: [
      {hp:2610, atk:780, def:490, spd:0},
      {hp:2640, atk:789, def:496, spd:0},
      {hp:2670, atk:798, def:501, spd:0},
      {hp:2700, atk:807, def:507, spd:0},
      {hp:2731, atk:816, def:512, spd:0},
      {hp:2760, atk:825, def:518, spd:0},
      {hp:2791, atk:834, def:524, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Final Buster', stars:5,
        hp:2299, atk:687, def:432,
        bonusStats:{atk:30},
        abilityName:'Final Buster',
        ability:[
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'After using a skill on an ally, grant target 1 of the following buffs: Increase Attack by 16.0%/21.0%/21.0%/26.0%/26.0%/31.0%/31.0% (1 turn). Increase critical damage by 16.0%/21.0%/21.0%/26.0%/26.0%/31.0%/31.0% (1 turn).',
          'If target has 2 or more Power of Friendship stacks, grant both buffs, and increase shield effects Kamiyama grants by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% more for 1 turn.',],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'หลังใช้สกิลต่อพันธมิตร มอบ 1 ใน buff ต่อไปนี้ให้เป้าหมาย: เพิ่ม Attack 16.0%/21.0%/21.0%/26.0%/26.0%/31.0%/31.0% (1 เทิร์น) หรือเพิ่ม CRIT DMG 16.0%/21.0%/21.0%/26.0%/26.0%/31.0%/31.0% (1 เทิร์น)',
          'หากเป้าหมายมี Power of Friendship 2+ stack มอบ buff ทั้งคู่ และเพิ่ม shield ที่ Kamiyama มอบ 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% 1 เทิร์น',
        ]},
      {name:'Justice Lance', stars:4,
        hp:1839, atk:550, def:346,
        bonusStats:{},
        abilityName:'Justice Lance',
        ability:[
          "Increase shield by 8.8%/8.8%/11.4%/11.4%/14.0%/14.0%/16.6%.",
          "After using a skill on an ally, increase Attack by 9.0%/11.7%/11.7%/14.4%/14.4%/17.1%/17.1% for 1 turn.",
          "For every 20% HP the target loses, increase Attack by 20%.",
        ],
        abilityTh:[
          'เพิ่ม shield 8.8%/8.8%/11.4%/11.4%/14.0%/14.0%/16.6%',
          'หลังใช้สกิลต่อพันธมิตร เพิ่ม Attack 9.0%/11.7%/11.7%/14.4%/14.4%/17.1%/17.1% 1 เทิร์น',
          'ต่อ HP ที่สูญเสียทุก 20% ของเป้าหมาย เพิ่ม Attack 20%',
        ]},
    ],
  },
  {name:'Closer', codename:'Closer', role:'Sweeper', element:'Electric', rarity:4,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best Electric DMG weapon (Quasar)',
    statPrio:['ATK%','Electric DMG%','CRIT Rate%'], note:'4★ Electric Sweeper. Shock-focused AoE DPS — spreads Shock, exploits Technicals, and stacks Electric damage debuffs on enemies.',
    mechanics: "Closer เป็น Electric AoE DPS ที่เน้น Shock Line Drive passive สะสม Electric DMG taken บนศัตรูทุกครั้งที่โจมตีด้วย Electric (stack สูงสุด = amplification ขนาดใหญ่) Electroshark เปิดใช้งานเมื่อเป้าติด Shock — เปิด Electric Technical เพื่อดาเมจโบนัส การแพร่ Shock ไปหลายศัตรูผ่านทักษะ AoE ทำให้ Line Drive stack สะสมพร้อมกันในทุกเป้า",
    rotation: [
      "เทิร์น 1 → AoE Electric skill (แพร่ Shock ทุกศัตรู; เริ่มสะสม Line Drive stack)",
      "เทิร์น 2 → Electroshark บนเป้าหลัก (Shock + Electric Technical เพื่อ single-target burst สูงสุด)",
      "รักษา Shock บนเป้าหลัก → Electroshark Technical ยิงทุกครั้งที่ใช้ทักษะ",
      "AoE Electric skill สะสม Line Drive stack passive บนทุกศัตรูพร้อมกัน",
      "ใช้ Highlight เมื่อพร้อม → AoE Electric ใหญ่ + ติด Shock + Line Drive amplification",
      "สะสม ATK% และ Electric DMG% — Line Drive stack เพิ่ม Electric damage ที่บัฟแล้วให้สูงขึ้นอีก",
    ],
    realName:'Motoha Arai', persona:'Awilda',
    weakRes:{ Fire:'normal', Ice:'wk', Electric:'res', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Wrathful Thunder', type:'Skill', element:'Electric', sp:20,
        desc:"Deal Electric damage to foes equal to 76.7%/84.6%/79.9%/87.7% of Attack (4 hits). From the 2nd hit, prioritize new targets and deal 10% damage when hitting the same target. Main target attack is guaranteed. Inflict Shock on main target for 2 turns.",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรู 76.7%/84.6%/79.9%/87.7% ของ Attack (4 ครั้ง) ตั้งแต่ครั้งที่ 2 ให้ความสำคัญกับเป้าหมายใหม่ก่อน และดีลดาเมจ 10% เมื่อโจมตีเป้าหมายเดิม การโจมตีเป้าหมายหลักรับประกัน ทำให้เป้าหมายหลักติด Shock 2 เทิร์น"},
      {name:'Blitz Mine', type:'Skill', element:'Electric', sp:18,
        desc:"Deal Electric damage to 1 foe equal to 157.1%/173.2%/163.6%/179.7% of Attack. Increase party's Electric damage by 11.7%/11.7%/12.2%/12.2% for 2 turns.",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรู 1 ตัว 157.1%/173.2%/163.6%/179.7% ของ Attack เพิ่มดาเมจไฟฟ้าของปาร์ตี้ 11.7%/11.7%/12.2%/12.2% เป็นเวลา 2 เทิร์น"},
      {name:'Electroshark', type:'Skill', element:'Electric', sp:24,
        desc:"Deal Electric damage to all foes equal to 79.3%/87.4%/82.5%/90.6% of Attack. If a foe is Shocked, activate a Technical and deal bonus Electric damage equal to 42.7%/47.1%/44.5%/48.9% of Attack.",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรูทุกตัว 79.3%/87.4%/82.5%/90.6% ของ Attack หากศัตรูติด Shock เปิดใช้ Technical และดีลดาเมจไฟฟ้าโบนัส 42.7%/47.1%/44.5%/48.9% ของ Attack"},
      {name:'HIGHLIGHT', type:'Skill', element:'Electric', sp:0,
        desc:"Deal Electric damage to all foes equal to 162.4%/179.0%/169.1%/185.7% of Attack. For 2 turns, inflict Shock on main target and increase Electric damage taken by 10%. [4-turn cooldown]",
        descTh:"ดีลดาเมจไฟฟ้าต่อศัตรูทุกตัว 162.4%/179.0%/169.1%/185.7% ของ Attack เป็นเวลา 2 เทิร์น ทำให้เป้าหมายหลักติด Shock และเพิ่มดาเมจไฟฟ้าที่รับ 10% [Cooldown: 4 เทิร์น]"},
      {name:'Extra Inning', type:'Passive', element:'-', sp:0,
        desc:"When inflicting Shock on foes, 66.0% chance to extend effect duration by 1 turn.",
        descTh:"เมื่อทำให้ศัตรูติด Shock มีโอกาส 66.0% ที่จะขยายระยะเวลาผล 1 เทิร์น"},
      {name:'Line Drive to Pitcher', type:'Passive', element:'-', sp:0,
        desc:"Increase Electric damage taken by the main target of Motoha's skill by 20.0% for 2 turns. Stacks up to 2 times.",
        descTh:"เพิ่มดาเมจไฟฟ้าที่รับของเป้าหมายหลักจากสกิล Motoha 20.0% เป็นเวลา 2 เทิร์น สะสมสูงสุด 2 ครั้ง"},
    ],
    awareness:[
      {name:'Strike Zone',
        desc:"When Motoha deals Electric damage, 15% chance to inflict Shock on the target. When dealing damage to Shocked foes, increase Attack by 30%.",
        descTh:"เมื่อ Motoha ดีลดาเมจไฟฟ้า มีโอกาส 15% ที่จะทำให้ศัตรูติด Shock เมื่อดีลดาเมจต่อศัตรูที่ติด Shock เพิ่ม Attack 30%"},
      {name:'Shocking Double Play',
        desc:"Wrathful Thunder deals 1 more hit. Damage to same foe reduced to 15%.",
        descTh:"Wrathful Thunder ดีลเพิ่ม 1 ครั้ง ดาเมจต่อศัตรูตัวเดิมลดเหลือ 15%"},
      {name:'Innings Change',
        desc:"Decrease damage taken from Shocked foes by 20%.",
        descTh:"ลดดาเมจที่รับจากศัตรูที่ติด Shock 20%"},
      {name:'Cheerful and Considerate',
        desc:"Increase the skill levels of Wrathful Thunder and Blitz Mine by 2.",
        descTh:"เพิ่มระดับสกิล Wrathful Thunder และ Blitz Mine ขึ้น 2 ระดับ"},
      {name:'Extra Run',
        desc:"Highlight Enhanced: Increase all foes' Electric damage taken by 20% for 2 turns.",
        descTh:"Highlight เสริม: เพิ่มดาเมจไฟฟ้าที่รับของศัตรูทุกตัว 20% เป็นเวลา 2 เทิร์น"},
      {name:'Past Dreams',
        desc:"Increase the skill levels of Electroshark and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Electroshark และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Key to Victory',
        desc:"Increase Shocked foes' Electric damage taken by 20%, and increase Electric critical damage taken by 20%.",
        descTh:"เพิ่มดาเมจไฟฟ้าที่รับของศัตรูที่ติด Shock 20% และเพิ่ม CRIT DMG ไฟฟ้าที่รับ 20%"},
    ],
    baseStats: {hp:216, atk:73, def:45, spd:98},
    baseStatsLv80: [
      {hp:2430, atk:825, def:515, spd:0},
      {hp:2458, atk:835, def:521, spd:0},
      {hp:2486, atk:845, def:527, spd:0},
      {hp:2514, atk:854, def:533, spd:0},
      {hp:2542, atk:864, def:539, spd:0},
      {hp:2570, atk:873, def:545, spd:0},
      {hp:2598, atk:882, def:551, spd:0},
    ],
    hiddenAbility: 'ATK% +21.8%',
    weapons:[
      {name:'Quasar', stars:5,
        hp:2141, atk:727, def:454,
        bonusStats:{edm:24},
        abilityName:'Quasar',
        ability:[
          'Increase Electric damage by 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%.',
          'After using a skill, gain 1 Thundercloud stack: increase own Attack by 11.0%/16.0%/16.0%/21.0%/21.0%/26.0%/26.0% for 2 turns (+1 stack if any Shocked foes, up to 3 stacks).',
          'When Thundercloud is at max stacks, increase party\'s Electric damage by 10.0%/14.6%/14.6%/19.2%/19.2%/23.8%/23.8%.',],
        abilityTh:[
          'เพิ่มดาเมจไฟฟ้า 24.2%/24.2%/31.5%/31.5%/38.8%/38.8%/46.1%',
          'หลังใช้สกิล รับ Thundercloud 1 stack: เพิ่ม Attack ตัวเอง 11.0%/16.0%/16.0%/21.0%/21.0%/26.0%/26.0% เป็นเวลา 2 เทิร์น (+1 stack หากมีศัตรูติด Shock สูงสุด 3 stack)',
          'เมื่อ Thundercloud ครบสูงสุด เพิ่มดาเมจไฟฟ้าของปาร์ตี้ 10.0%/14.6%/14.6%/19.2%/19.2%/23.8%/23.8%',
        ]},
      {name:'Crime and Punishment', stars:4,
        hp:1712, atk:581, def:363,
        bonusStats:{atk:24},
        abilityName:'Crime and Punishment',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "If there are any Shocked foes, increase Attack by 20%/26%/26%/32%/32%/38%/38%.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หากมีศัตรูติด Shock เพิ่ม Attack 20%/26%/26%/32%/32%/38%/38%',
        ]},
    ],
  },
  {name:'Mont', codename:'Mont', role:'Assassin', element:'Ice', rarity:4,
    cards:['Courage 4pc','Triumph 2pc'], weapon:'Best Ice ATK weapon',
    statPrio:['ATK%','CRIT Rate%','CRIT DMG%'], note:'4★ Ice Assassin. Ice Crystal mechanic with Resonance follow-up attacks and execute damage.',
    mechanics: "Ice Crystal stack สะสมจากทักษะ Ice (แต่ละ hit = 1 stack) เมื่อครบ 10 stack → Resonance ยิงอัตโนมัติ (follow-up attack critical รับประกัน) Parhelion buff (จากทักษะ Frost Lily/Winter Storm) เพิ่มดาเมจและ CRIT Rate ของ Mont สำหรับการโจมตีถัดไป Durandal of Ice เป็นทักษะ execute ที่ดาเมจสูงมากต่อศัตรูที่ HP ต่ำกว่า threshold เหมาะสุดกับเนื้อหา single-boss ที่ Ice Crystal stack สะสมเร็วจากทักษะ multi-hit",
    rotation: [
      "เทิร์น 1 → Frost Lily (Ice hit + สะสม Ice Crystal + เปิด Parhelion buff)",
      "เทิร์น 2 → Winter Storm (AoE Ice hit + สะสม Ice Crystal เร็วขึ้น)",
      "ครบ 10 Ice Crystal → Resonance ยิงอัตโนมัติ (critical follow-up รับประกัน; รีเซ็ต stack)",
      "เมื่อ HP ศัตรูต่ำ → Durandal of Ice (execute skill; ดาเมจโบนัสมหาศาลเมื่อ HP ต่ำกว่า threshold)",
      "ใช้ Highlight เมื่อพร้อม → Ice burst สูง + Parhelion buff + สะสม Crystal เร็วขึ้น",
      "สะสม CRIT Rate% และ CRIT DMG% — Resonance critical รับประกันเมื่อ stack เต็ม = burst น่าเชื่อถือ",
    ],
    realName:'Montagne Kotone', persona:'Terpsichore',
    weakRes:{ Fire:'normal', Ice:'res', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'wk' },
    skills:[
      {name:'Frost Lily', type:'Skill', element:'Ice', sp:20,
        desc:"Deal Ice damage to all foes equal to 87.1%/96.0%/90.6%/99.5% of Attack. 29.3%/29.3%/30.5%/30.5% chance to inflict Freeze.",
        descTh:"ดีลดาเมจน้ำแข็งต่อศัตรูทุกตัว เท่ากับ 87.1%/96.0%/90.6%/99.5% ของ Attack มีโอกาส 29.3%/29.3%/30.5%/30.5% ที่จะทำให้ Freeze"},
      {name:'Winter Storm', type:'Skill', element:'Ice', sp:20,
        desc:"Deal Ice damage to 1 foe equal to 160.4%/176.8%/166.9%/183.4% of Attack. Gain 4 Ice Crystal stacks.",
        descTh:"ดีลดาเมจน้ำแข็งต่อศัตรู 1 ตัว เท่ากับ 160.4%/176.8%/166.9%/183.4% ของ Attack รับ Ice Crystal 4 stack"},
      {name:'Durandal of Ice', type:'Skill', element:'Ice', sp:24,
        desc:"Deal Ice damage to 1 foe equal to 179.7%/198.1%/187.0%/205.5% of Attack. When Kotone has Parhelion or 10+ Ice Crystal stacks, increase damage based on foe's missing HP (up to 29.3%/29.3%/30.5%/30.5%). When Blade Dancer is activated, increase damage based on foe's missing HP (up to 29.3%/29.3%/30.5%/30.5%).",
        descTh:"ดีลดาเมจน้ำแข็งต่อศัตรู 1 ตัว เท่ากับ 179.7%/198.1%/187.0%/205.5% ของ Attack เมื่อ Kotone มี Parhelion หรือ Ice Crystal 10+ stack เพิ่มดาเมจตาม HP ที่หายของศัตรู (สูงสุด 29.3%/29.3%/30.5%/30.5%) เมื่อ Blade Dancer ทำงาน เพิ่มดาเมจตาม HP ที่หายของศัตรู (สูงสุด 29.3%/29.3%/30.5%/30.5%)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Ice', sp:0,
        desc:"Deal Ice damage to 1 foe equal to 292.8%/322.8%/304.8%/334.8% of Attack. Increase damage based on foe's missing HP. When foe's HP is below 20%, increase by up to 30%. [4-turn cooldown]",
        descTh:"ดีลดาเมจน้ำแข็งต่อศัตรู 1 ตัว เท่ากับ 292.8%/322.8%/304.8%/334.8% ของ Attack เพิ่มดาเมจตาม HP ที่หายของศัตรู เมื่อ HP ศัตรูต่ำกว่า 20% เพิ่มสูงสุด 30% [Cooldown: 4 เทิร์น]"},
      {name:'Frozen in Time', type:'Passive', element:'-', sp:0,
        desc:"When damaging foes with Blade Dancer, 100.0% chance to inflict Freeze.",
        descTh:"เมื่อสร้างดาเมจต่อศัตรูด้วย Blade Dancer มีโอกาส 100% ที่จะทำให้ Freeze"},
      {name:'State of Selflessness', type:'Passive', element:'-', sp:0,
        desc:"When Kotone defeats a foe, gain 4 Ice Crystal stacks.",
        descTh:"เมื่อ Kotone กำจัดศัตรู รับ Ice Crystal 4 stack"},
    ],
    awareness:[
      {name:'Blade Dancer',
        desc:"On ally's action, gain 1 Ice Crystal stack (up to 12). After using a skill, when Ice Crystal reaches 10 stacks, activate a Resonance spending 10 stacks to deal 65% follow-up Ice damage to the main target (guaranteed crit). When using Frost Lily or Winter Storm, if Resonance activates, gain Parhelion. Parhelion strengthens Durandal of Ice.",
        descTh:"เมื่อพันธมิตรใช้แอ็คชัน รับ Ice Crystal 1 stack (สูงสุด 12) หลังใช้สกิล เมื่อ Ice Crystal ครบ 10 stack เปิดใช้ Resonance ใช้ 10 stack สร้างดาเมจน้ำแข็งตาม 65% ของ Attack ต่อเป้าหมาย (CRIT แน่นอน) เมื่อใช้ Frost Lily หรือ Winter Storm หาก Resonance ทำงาน รับ Parhelion ซึ่งเสริม Durandal of Ice"},
      {name:'Camel Spin',
        desc:"At the end of Kotone's turn, gain a shield equal to 15% of Attack for 1 turn.",
        descTh:"เมื่อสิ้นสุดเทิร์น Kotone รับ shield เท่ากับ 15% ของ Attack เป็นเวลา 1 เทิร์น"},
      {name:'Ice Princess',
        desc:"Increase Resonance damage based on foe's missing HP (up to 50%).",
        descTh:"เพิ่มดาเมจ Resonance ตาม HP ที่หายของศัตรู (สูงสุด 50%)"},
      {name:'Heart of Ice',
        desc:"Increase the skill levels of Frost Lily and Winter Storm by 2.",
        descTh:"เพิ่มระดับสกิล Frost Lily และ Winter Storm ขึ้น 2 ระดับ"},
      {name:'Resilience',
        desc:"Highlight Enhanced: Increase Highlight damage up to 60%.",
        descTh:"Highlight เสริม: เพิ่มดาเมจ Highlight สูงสุด 60%"},
      {name:'Axel Jump',
        desc:"Increase the skill levels of Durandal of Ice and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Durandal of Ice และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Opening Ceremony',
        desc:"At the start of battle, gain 4 Ice Crystal stacks. Increase the maximum number of Ice Crystal stacks to 15.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ รับ Ice Crystal 4 stack และเพิ่มจำนวน stack สูงสุดของ Ice Crystal เป็น 15"},
    ],
    baseStats: {hp:218, atk:76, def:41, spd:99},
    baseStatsLv80: [
      {hp:2452, atk:862, def:465, spd:0},
      {hp:2480, atk:872, def:471, spd:0},
      {hp:2509, atk:882, def:476, spd:0},
      {hp:2537, atk:892, def:481, spd:0},
      {hp:2565, atk:902, def:487, spd:0},
      {hp:2594, atk:912, def:493, spd:0},
      {hp:2622, atk:922, def:497, spd:0},
    ],
    hiddenAbility: 'ATK% +21.8%',
    weapons:[
      {name:'Queen of Winter', stars:5,
        hp:2160, atk:760, def:410,
        bonusStats:{atk:30},
        abilityName:'Hiver Éternel',
        ability:[
          'Increase critical damage by 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%.',
          'Activate Blade Dancer at 8+ Ice Crystal stacks and increase its damage by 46.0%/68.0%/68.0%/90.0%/90.0%/112.0%/112.0%.',
          'Increase the power of Durandal of Ice at 8+ Ice Crystal stacks.',],
        abilityTh:[
          'เพิ่ม CRIT DMG 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%',
          'เปิดใช้ Blade Dancer เมื่อมี Ice Crystal 8+ stack และเพิ่มดาเมจ 46.0%/68.0%/68.0%/90.0%/90.0%/112.0%/112.0%',
          'เพิ่มพลังของ Durandal of Ice เมื่อมี Ice Crystal 8+ stack',
        ]},
      {name:'Edelweiss', stars:4,
        hp:1729, atk:608, def:328,
        bonusStats:{atk:24},
        abilityName:'Don Glacial',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "Each time Kotone gains Ice Crystal stacks, increase Ice damage by 2.4%/3.1%/3.1%/3.8%/3.8%/4.5%/4.5% for 1 turn. Stacks up to 10 times.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'ทุกครั้งที่ Kotone ได้รับ Ice Crystal stack เพิ่มความเสียหายธาตุน้ำแข็ง 2.4%/3.1%/3.1%/3.8%/3.8%/4.5%/4.5% เป็นเวลา 1 เทิร์น สะสมสูงสุด 10 ครั้ง',
        ]},
    ],
  },
  {name:'Soy', codename:'Soy', role:'Guardian', element:'Ice', rarity:4,
    cards:['Love 4pc','Virtue 2pc'], weapon:'Best HP/Ice Guardian weapon',
    statPrio:['HP%','Healing Bonus%','DEF%'], note:'4★ Ice Guardian. HP-scaling tank with party HP buff and mitigation via Desperado.',
    mechanics: "Soy เป็น Ice Guardian ที่สเกล HP เน้นรับดาเมจและบัฟ HP ปาร์ตี้ Desperado ให้ mitigation หลักของปาร์ตี้และบัฟ HP ปาร์ตี้ที่สเกลตาม max HP ของ Soy ในฐานะ tank บทบาทหลักของ Soy คือรับการโจมตีของศัตรู (ดึง aggro) และให้ mitigation เพื่อให้ DPS ดาเมจได้โดยไม่ตาย สะสม HP% เพื่อเพิ่ม survivability และค่าบัฟ HP-scaling ทั้งหมด",
    rotation: [
      "เทิร์น 1 → Desperado (mitigation ปาร์ตี้ active + HP buff สเกลตาม max HP ของ Soy)",
      "เทิร์น 2 → Ice skill บนเป้าหลัก (สร้างดาเมจ; รักษาแรงกดดัน Ice เพื่อ weakness exploitation)",
      "รักษา taunt/aggro เพื่อปกป้อง ally ที่ DEF ต่ำจากการถูกโจมตีตรง",
      "ใช้ Highlight เมื่อพร้อม → ฟื้น HP ปาร์ตี้ + Ice DMG + ต่ออายุ mitigation",
      "สะสม HP% และ DEF% เพื่อ tanking; HP% ยังสเกล HP buff ของ Desperado ให้ปาร์ตี้",
      "คู่กับ Ice DPS (Fox, Matoi) เพื่อ Ice resonance stacking และ Ice Technical combos",
    ],
    realName:'Shun Kano', persona:'Mandrin',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'res', Bless:'wk', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Icicle Hatchet', type:'Skill', element:'Ice', sp:20,
        desc:"Deal Ice damage to 1 foe equal to 55.6%/61.3%/57.9%/63.6% of Shun's max HP. 70% chance to inflict Freeze.",
        descTh:"ดีลดาเมจน้ำแข็งต่อศัตรู 1 ตัว เท่ากับ 55.6%/61.3%/57.9%/63.6% ของ HP สูงสุดของ Shun มีโอกาส 70% ที่จะทำให้ Freeze"},
      {name:'Smash Hit', type:'Skill', element:'Physical', sp:0,
        desc:"Deal Physical damage to 1 foe equal to 56.9%/62.7%/59.2%/65.1% of Shun's max HP. Decrease Defense by 30.0%/30.0%/31.2%/31.2% for 2 turns. When Desperado is active, increase effect by 59.9%/59.9%/62.4%/62.4%. [HP Cost: 6%]",
        descTh:"ดีลดาเมจกายภาพต่อศัตรู 1 ตัว เท่ากับ 56.9%/62.7%/59.2%/65.1% ของ HP สูงสุดของ Shun ลด DEF ศัตรู 30.0%/30.0%/31.2%/31.2% เป็นเวลา 2 เทิร์น เมื่อ Desperado ใช้งานอยู่ เพิ่มผลกระทบ 59.9%/59.9%/62.4%/62.4% [ค่าใช้จ่าย HP: 6%]"},
      {name:'Icy Defense', type:'Skill', element:'-', sp:24, isBuff:true,
        desc:"Increase party's max HP by 15% of Shun's max HP (up to 14100/14100/15600/15600) for 2 turns. Also, restore party's HP by 16.5%/18.2%/17.2%/18.9% of Shun's max HP. Greatly increase Shun's chance of being targeted by attacks for 2 turns. Cooldown: 1 turn.",
        descTh:"เพิ่ม HP สูงสุดของปาร์ตี้ 15% ของ HP สูงสุดของ Shun (สูงสุด 14100/14100/15600/15600) เป็นเวลา 2 เทิร์น ฟื้นฟู HP ปาร์ตี้ 16.5%/18.2%/17.2%/18.9% ของ HP สูงสุดของ Shun เพิ่มโอกาสที่ Shun จะถูกโจมตีอย่างมากเป็นเวลา 2 เทิร์น Cooldown: 1 เทิร์น"},
      {name:'HIGHLIGHT', type:'Skill', element:'Ice', sp:0,
        desc:"Increase party's max HP by 10.3% of Shun's max HP for 2 turns (up to 14100/14100/15600/15600) and restore party's HP by 10.1%/11.1%/10.5%/11.5% of Shun's max HP. Deal Ice damage to 1 foe equal to 75.3%/83.1%/78.4%/86.2% of Shun's max HP. [4-turn cooldown]",
        descTh:"เพิ่ม HP สูงสุดของปาร์ตี้ 10.3% ของ HP สูงสุดของ Shun เป็นเวลา 2 เทิร์น (สูงสุด 14100/14100/15600/15600) และฟื้นฟู HP ปาร์ตี้ 10.1%/11.1%/10.5%/11.5% ของ HP สูงสุด ดีลดาเมจน้ำแข็งต่อศัตรู 1 ตัว 75.3%/83.1%/78.4%/86.2% ของ HP สูงสุดของ Shun [Cooldown: 4 เทิร์น]"},
      {name:'Daunting Firepower', type:'Passive', element:'-', sp:0,
        desc:"Increase ammo for ranged attacks by 18. When attacking foes with ranged attacks, 10.0% chance to deal bonus damage equal to 9% of Shun's max HP, and decrease foe's Defense by 35% for 3 turns. Consecutive ranged attacks against the same foe will deal decreased damage.",
        descTh:"เพิ่มกระสุนสำหรับโจมตีระยะไกล 18 หน่วย เมื่อโจมตีด้วยอาวุธระยะไกล มีโอกาส 10% ดีลดาเมจโบนัส 9% ของ HP สูงสุดของ Shun และลด DEF ศัตรู 35% เป็นเวลา 3 เทิร์น การโจมตีซ้ำต่อศัตรูตัวเดิมจะลดดาเมจลง"},
      {name:'For Your Benefit', type:'Passive', element:'-', sp:0,
        desc:"When Shun is attacked while Icy Defense is active, 30.0% chance to activate Desperado.",
        descTh:"เมื่อ Shun ถูกโจมตีขณะ Icy Defense ใช้งานอยู่ มีโอกาส 30% ที่จะเปิดใช้งาน Desperado"},
    ],
    awareness:[
      {name:'Wild Runner', desc:"Increase chance of being targeted by attacks, and when attacked, activate Desperado. At the end of Shun's turn, Desperado ends, and he restores 30% HP.", descTh:"เพิ่มโอกาสที่จะถูกโจมตี เมื่อถูกโจมตีจะเปิดใช้งาน Desperado ในตอนท้ายเทิร์น Shun Desperado สิ้นสุดลงและฟื้นฟู HP 30%"},
      {name:'Steely Endurance', desc:"When Desperado is active, decrease damage taken by 8%.", descTh:"เมื่อ Desperado ใช้งานอยู่ ลดดาเมจที่รับ 8%"},
      {name:'Bloodspray', desc:"When remaining HP is below 50%, increase healing effect by 25%.", descTh:"เมื่อ HP เหลือต่ำกว่า 50% เพิ่มผลการรักษา 25%"},
      {name:'Man of Integrity', desc:"Increase the skill levels of Icicle Hatchet and Smash Hit by 2.", descTh:"เพิ่มระดับสกิล Icicle Hatchet และ Smash Hit ขึ้น 2 ระดับ"},
      {name:"A Man's Back", desc:"Highlight Enhanced: Decrease party's damage taken by 16% for 2 turns.", descTh:"Highlight เสริม: ลดดาเมจที่ปาร์ตี้รับ 16% เป็นเวลา 2 เทิร์น"},
      {name:'Masterful Cutting Skills', desc:"Increase the skill levels of Icy Defense and Thief Tactics by 2.", descTh:"เพิ่มระดับสกิล Icy Defense และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Robbing and Smuggling', desc:"When attacking a foe while Desperado is active, deal bonus damage equal to 10% of Shun's max HP, and restore HP equal to damage dealt.", descTh:"เมื่อโจมตีศัตรูขณะ Desperado ใช้งานอยู่ ดีลดาเมจโบนัส 10% ของ HP สูงสุดของ Shun และฟื้นฟู HP เท่ากับดาเมจที่ดีล"},
    ],
    baseStats: {hp:290, atk:56, def:38, spd:102},
    baseStatsLv80: [
      {hp:3262, atk:638, def:435, spd:0},
      {hp:3300, atk:645, def:440, spd:0},
      {hp:3337, atk:652, def:446, spd:0},
      {hp:3375, atk:660, def:451, spd:0},
      {hp:3413, atk:667, def:455, spd:0},
      {hp:3450, atk:674, def:460, spd:0},
      {hp:3488, atk:682, def:466, spd:0},
    ],
    hiddenAbility: 'HP% +21.8%',
    weapons:[
      {name:'Permafrost', stars:5,
        hp:2874, atk:562, def:383,
        bonusStats:{hp:30},
        abilityName:'Permafrost',
        ability:[
          'Increase max HP by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          "When activating Desperado's healing effect, 52.0%/68.0%/68.0%/84.0%/84.0%/100.0%/100.0% chance to grant the same effect to the ally with the lowest remaining HP.",
          "When taking an attack, decrease the attacker's Defense by 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0% for 1 turn.",],
        abilityTh:[
          'เพิ่ม HP สูงสุด 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          "เมื่อเปิดใช้งานการรักษาของ Desperado มีโอกาส 52.0%/68.0%/68.0%/84.0%/84.0%/100.0%/100.0% ที่จะมอบผลเดียวกันให้พันธมิตรที่ HP เหลือน้อยที่สุด",
          "เมื่อถูกโจมตี ลด DEF ของผู้โจมตี 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0% เป็นเวลา 1 เทิร์น",
        ]},
      {name:"Demon's Bite", stars:4,
        hp:2299, atk:449, def:306,
        bonusStats:{hp:24},
        abilityName:"Demon's Bite",
        ability:[
          "Increase max HP by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "While Desperado is active, increase max HP by 11.0%/14.3%/14.3%/17.7%/17.7%/21.0%/21.0% more, Defense by 11.0%/14.3%/14.3%/17.7%/17.7%/21.0%/21.0%, and ailment resistance by 11.0%/14.3%/14.3%/17.7%/17.7%/21.0%/21.0%.",
        ],
        abilityTh:[
          'เพิ่ม HP สูงสุด 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'ขณะ Desperado ใช้งานอยู่ เพิ่ม HP สูงสุดเพิ่มเติม 11.0%/14.3%/14.3%/17.7%/17.7%/21.0%/21.0%, DEF 11.0%/14.3%/14.3%/17.7%/17.7%/21.0%/21.0% และต้านทานสภาวะแปรปรวน 11.0%/14.3%/14.3%/17.7%/17.7%/21.0%/21.0%',
        ]},
    ],
  },
  {name:'Yuki', codename:'Yuki', role:'Guardian', element:'Bless', rarity:4,
    cards:['Triumph 4pc','Courage 2pc'], weapon:'Best DEF% Bless weapon (Karmic Cycle)',
    statPrio:['DEF%','HP%','SPD'], note:'Bless Guardian. All damage and shields scale with DEF. Oath grants shields, DEF buffs, and enables Gavel stacks from Blessing. Cross-Examination converts DEF into party damage bonus.',
    mechanics: "ดาเมจและ shield ทั้งหมดของ Yuki สเกลตาม DEF — สะสม DEF% ในทุก card slot Oath ให้ shield ปาร์ตี้, DEF buffs และเปิด Gavel stack เมื่อ ally ได้รับ Blessing effects Cross-Examination แปลง DEF ของ Yuki เป็น damage bonus ปาร์ตี้: DEF สูงขึ้น = ปาร์ตี้ดาเมจโบนัสมากขึ้น Yuki จึงเป็น tank หายากที่เพิ่มดาเมจปาร์ตี้ผ่านการสะสม DEF",
    rotation: [
      "เทิร์น 1 → Oath (shield ปาร์ตี้, DEF buff, เปิด Gavel stack จาก Blessing)",
      "เทิร์น 2 → Cross-Examination (party DMG bonus จาก DEF ของ Yuki; สร้าง Bless DMG สเกลตาม DEF)",
      "รักษา shield uptime ผ่าน Oath; shield เปิด Gavel stack เมื่อมี Blessing active ด้วย",
      "Bless DMG skill สร้างดาเมจที่สเกลตาม DEF ล้วนๆ — ไม่ต้องลงทุน ATK",
      "ใช้ Highlight เมื่อพร้อม → shield ปาร์ตี้ทั้งหมด + Bless DMG burst สเกลตาม DEF",
      "สะสม DEF% สูงสุด — DEF สเกล shield, ดาเมจ และ Cross-Examination party DMG bonus",
    ],
    realName:'Yukimi Fujikawa', persona:'Stix',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'wk',
      Curse:'normal', Bless:'res', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Sword of Condemnation', type:'Skill', element:'Bless', sp:19,
        desc:"Deal Bless damage to all foes equal to 88.0%/97.1%/91.6%/100.7% of Yukimi's Defense. Grant 1 Blessing stack to Yukimi and allies with Oath.",
        descTh:"ดีลดาเมจแสงต่อศัตรูทุกตัว 88.0%/97.1%/91.6%/100.7% ของ DEF Yukimi มอบ Blessing 1 stack ให้ Yukimi และพันธมิตรที่มี Oath"},
      {name:'Sacral Glow', type:'Skill', element:'-', sp:20, isBuff:true,
        desc:"Grant a shield to 1 ally besides self equal to 47.2%/47.2%/49.2%/49.2% of Yukimi's Defense + 1344/1635/1547/1838, and increase target's Defense by 35% of Yukimi's Defense (up to 1112/1226/1158/1272). Decrease target's damage taken by 20% once. Grant 2 Blessing stacks and grant Oath to target for 2 turns. Lasts 2 turns.",
        descTh:"มอบ shield ให้พันธมิตร 1 คน (ยกเว้นตัวเอง) 47.2%/47.2%/49.2%/49.2% ของ DEF Yukimi + 1344/1635/1547/1838 และเพิ่ม DEF เป้าหมาย 35% ของ DEF Yukimi (สูงสุด 1112/1226/1158/1272) ลดดาเมจที่รับของเป้าหมาย 20% ครั้งหนึ่ง มอบ Blessing 2 stack และมอบ Oath ให้เป้าหมาย 2 เทิร์น"},
      {name:'Absolute Judgment', type:'Skill', element:'Bless', sp:25,
        desc:"Deal Bless damage to 1 foe equal to 117.1%/129.1%/121.9%/133.9% of Yukimi's Defense. When Yukimi or an Oath ally gains Blessing stacks, gain 1 Gavel stack. When used with 2+ Gavel stacks, spend all stacks: each stack spent increases party's damage by 4.9%/5.4%/5.1%/5.6% for 1 turn and grants party a shield equal to 14.9%/16.5%/15.5%/17.1% of Yukimi's Defense for 2 turns.",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 117.1%/129.1%/121.9%/133.9% ของ DEF Yukimi เมื่อ Yukimi หรือพันธมิตรที่มี Oath ได้รับ Blessing stack รับ Gavel 1 stack เมื่อใช้สกิลนี้ที่ Gavel 2+ stack ใช้ stack ทั้งหมด: ต่อ stack ที่ใช้ เพิ่มดาเมจปาร์ตี้ 4.9%/5.4%/5.1%/5.6% 1 เทิร์น และมอบ shield ให้ปาร์ตี้ 14.9%/16.5%/15.5%/17.1% ของ DEF Yukimi 2 เทิร์น"},
      {name:'HIGHLIGHT', type:'Skill', element:'Bless', sp:0,
        desc:"Deal Bless damage to 1 foe equal to 284.1%/313.2%/295.8%/324.9% of Yukimi's Defense. Increase party's Defense by 20% of Yukimi's Defense (up to 657/725/684/752) for 2 turns. [4-turn cooldown]",
        descTh:"ดีลดาเมจแสงต่อศัตรู 1 ตัว 284.1%/313.2%/295.8%/324.9% ของ DEF Yukimi เพิ่ม DEF ของปาร์ตี้ 20% ของ DEF Yukimi (สูงสุด 657/725/684/752) 2 เทิร์น [Cooldown: 4 เทิร์น]"},
      {name:'Cross-Examination', type:'Passive', element:'-', sp:0,
        desc:"When an ally has Oath, increase their damage by 7% for every 1500 of Yukimi's Defense (up to 21%).",
        descTh:"เมื่อพันธมิตรมี Oath เพิ่มดาเมจ 7% ต่อ DEF ของ Yukimi ทุก 1500 (สูงสุด 21%)"},
      {name:'Urgent Matter', type:'Passive', element:'-', sp:0,
        desc:"At the end of Yukimi's action, grant a shield equal to 69.0% of Yukimi's Defense to allies below 30% HP, and grant 1 Blessing stack. Blessing lasts 2 turns. Activates once per battle.",
        descTh:"เมื่อสิ้นสุดแอ็คชันของ Yukimi มอบ shield 69.0% ของ DEF Yukimi ให้พันธมิตรที่มี HP ต่ำกว่า 30% และมอบ Blessing 1 stack Blessing คงอยู่ 2 เทิร์น เปิดใช้ได้ครั้งเดียวต่อการต่อสู้"},
    ],
    awareness:[
      {name:'Scales of Fairness',
        desc:"At the start of battle, grant Oath to 1 random ally. At the end of Yukimi's action, grant a shield equal to 24% of Yukimi's Defense to an ally with Oath. Only 1 ally can have Oath at a time.",
        descTh:"เมื่อเริ่มต้นการต่อสู้ มอบ Oath ให้พันธมิตรสุ่ม 1 คน เมื่อสิ้นสุดแอ็คชันของ Yukimi มอบ shield 24% ของ DEF Yukimi ให้พันธมิตรที่มี Oath พันธมิตรมี Oath ได้ครั้งละ 1 คนเท่านั้น"},
      {name:'Legal Proceedings',
        desc:"When an ally has Oath, increase their Defense by 15%.",
        descTh:"เมื่อพันธมิตรมี Oath เพิ่ม DEF 15%"},
      {name:'Law-Abiding Spirit',
        desc:"When an ally with Oath takes an action, gain 1 Blessing stack.",
        descTh:"เมื่อพันธมิตรที่มี Oath ใช้แอ็คชัน รับ Blessing 1 stack"},
      {name:'Right Person Right Place',
        desc:"Increase the skill levels of Sword of Condemnation and Sacral Glow by 2.",
        descTh:"เพิ่มระดับสกิล Sword of Condemnation และ Sacral Glow ขึ้น 2 ระดับ"},
      {name:'Legal Qualifications',
        desc:"Highlight Enhanced: Grant 2 Blessing stacks to all allies.",
        descTh:"Highlight เสริม: มอบ Blessing 2 stack ให้พันธมิตรทุกคน"},
      {name:'Execution of Justice',
        desc:"Increase the skill levels of Absolute Judgment and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Absolute Judgment และ Thief Tactics ขึ้น 2 ระดับ"},
      {name:'Extenuating Circumstances',
        desc:"Increase damage by 10% for Yukimi and allies with Oath. Increase Bless damage by 2% for each Blessing stack on Yukimi and allies with Oath (up to 20%).",
        descTh:"เพิ่มดาเมจ 10% สำหรับ Yukimi และพันธมิตรที่มี Oath เพิ่มดาเมจแสง 2% ต่อ Blessing stack บน Yukimi และพันธมิตรที่มี Oath (สูงสุด 20%)"},
    ],
    baseStats: {hp:236, atk:56, def:52, spd:104},
    baseStatsLv80: [
      {hp:2655, atk:638, def:595, spd:0},
      {hp:2686, atk:645, def:603, spd:0},
      {hp:2717, atk:652, def:609, spd:0},
      {hp:2747, atk:660, def:616, spd:0},
      {hp:2778, atk:667, def:623, spd:0},
      {hp:2808, atk:674, def:630, spd:0},
      {hp:2839, atk:682, def:637, spd:0},
    ],
    hiddenAbility: 'DEF% +32.6%',
    weapons:[
      {name:'Karmic Cycle', stars:5,
        hp:2339, atk:562, def:524,
        bonusStats:{def:45},
        abilityName:'Karmic Cycle',
        ability:[
          'Increase Defense by 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%.',
          'When spending Gavel stacks with Absolute Judgment, add 1 to number of stacks spent.',
          'Also steal 13.0%/20.0%/20.0%/27.0%/27.0%/34.0%/34.0% of target\'s Defense for 2 turns based on own Defense (up to 520/800/800/1080/1080/1360/1360).',],
        abilityTh:[
          'เพิ่ม DEF 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%',
          'เมื่อใช้ Gavel stack ด้วย Absolute Judgment เพิ่มจำนวน stack ที่ใช้ 1',
          'ขโมย DEF เป้าหมาย 13.0%/20.0%/20.0%/27.0%/27.0%/34.0%/34.0% ตาม DEF ของตัวเอง 2 เทิร์น (สูงสุด 520/800/800/1080/1080/1360/1360)',
        ]},
      {name:'Heavy Metal Pain', stars:4,
        hp:1871, atk:449, def:419,
        bonusStats:{def:35},
        abilityName:'Heavy Metal Pain',
        ability:[
          "Increase Defense by 18.0%/18.0%/23.5%/23.5%/29.0%/29.0%/34.5%.",
          "When granting a shield to an ally with less than 50% HP, increase shield by 16.3%/21.2%/21.2%/26.1%/26.1%/31.0%/31.0%.",
        ],
        abilityTh:[
          'เพิ่ม DEF 18.0%/18.0%/23.5%/23.5%/29.0%/29.0%/34.5%',
          'เมื่อมอบ shield ให้พันธมิตรที่มี HP ต่ำกว่า 50% เพิ่ม shield 16.3%/21.2%/21.2%/26.1%/26.1%/31.0%/31.0%',
        ]},
    ],
  },
  {name:'Key',                codename:'Key',            role:'Saboteur',   element:'Fire',           rarity:4, cards:['Hindrance 4pc','Strife 2pc'],    weapon:'Best Fire debuff weapon',                       statPrio:['ATK%','SPD','DEF%'],                             note:'4★ Fire Saboteur. Applies debuffs to reduce enemy Fire resistance.'},
  {name:'Moko', codename:'Moko', role:'Medic', element:'Psychokinesis', rarity:4,
    cards:['Love 4pc','Opulence 2pc'], weapon:'Best Healing/Psy weapon (Bubble Babies)',
    statPrio:['ATK%','Healing Bonus%','HP%'], note:'Psy Medic. Sparks → Summer Reminiscence Resonance cycles heal and debuff simultaneously. ATK scales all healing; Power of Memories grants Psy DMG and HP from healing output.',
    mechanics: "รุ่น 4★ ของ Moko ใช้วงจร Sparks → Summer Reminiscence Resonance เดียวกับรุ่น 5★ แต่ตัวคูณต่ำกว่า Sparks สะสมบนศัตรูจากดาเมจทักษะของ ally (สูงสุด 5 stack); ครบ 5 stack → Summer Reminiscence Resonance ยิงอัตโนมัติ — ฮีลปาร์ตี้และ debuff ศัตรูพร้อมกัน Power of Memories แปลงผลฮีลเป็น Psy DMG และ max HP เพิ่ม สะสม ATK% เป็นหลัก — ATK สเกลทั้ง Psy attack ของ Moko และค่าฮีลทุกอย่าง",
    rotation: [
      "เทิร์น 1 → Psy skill บนเป้าหลัก (สร้างดาเมจ + สะสม Sparks บนเป้า)",
      "เทิร์น 2 → ทักษะฮีล (ฟื้น HP + สะสม Sparks; ทั้งคู่นับสู่ threshold 5 Sparks)",
      "ครบ 5 Sparks → Summer Reminiscence Resonance ยิงอัตโนมัติ (ฮีลปาร์ตี้ + debuff เป้า)",
      "Power of Memories: ผลฮีลแปลงเป็น Psy DMG — ATK สูงขึ้น = ฮีลมากขึ้น = Psy damage มากขึ้น",
      "ใช้ Highlight เมื่อพร้อม → Psy burst ใหญ่ + ฮีลปาร์ตี้ + max HP เพิ่ม",
      "สะสม ATK% เพื่อสเกลทั้งการฮีลและ Psy damage พร้อมกัน",
    ],
    realName:'Tomoko Noge', persona:'Prosymna',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'wk', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'res' },
    skills:[
      {name:'Have a Cold Drink', type:'Skill', element:'Psychokinesis', sp:23,
        desc:"Deal Psy damage to foes equal to 77.6%/85.5%/82.4%/90.3% of Attack (4 hits). From 2nd hit, prioritize new targets, inflict 1 Sparks per hit, 30% damage for same target. Passive: increases Summer Reminiscence skill damage and healing by 51.7%/51.7%/60.0%/60.0%.",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรู 77.6%/85.5%/82.4%/90.3% ของ Attack (4 ครั้ง) ตั้งแต่ครั้งที่ 2 ให้ความสำคัญกับเป้าหมายใหม่ ทำให้ติด Sparks 1 stack ต่อครั้ง ดาเมจ 30% สำหรับเป้าหมายเดิม Passive: เพิ่มตัวคูณดาเมจและการรักษา Summer Reminiscence 51.7%/51.7%/60.0%/60.0%"},
      {name:'Hale Summer Days', type:'Skill', element:'-', sp:27, isBuff:true,
        desc:"Restore 1 ally's HP by 22.4%/22.4%/23.8%/23.8% of Tomoko's Attack + 1437/1748/1767/2078. For 2 turns: target ATK +14.6%/14.6%/15.5%/15.5%, ailment accuracy +58.6%/58.6%/62.2%/62.2%, damage +30%, and ATK +25% of target's ailment accuracy (up to 22.5%). Inflict 1 Sparks per skill damage hit to foes (up to 5 stacks).",
        descTh:"ฟื้นฟู HP พันธมิตร 1 คน 22.4%/22.4%/23.8%/23.8% ของ Attack Tomoko + 1437/1748/1767/2078 เป็นเวลา 2 เทิร์น: ATK +14.6%/14.6%/15.5%/15.5%, ailment accuracy +58.6%/58.6%/62.2%/62.2%, ดาเมจ +30% และ ATK +25% ของ ailment accuracy เป้าหมาย (สูงสุด 22.5%) ทำให้ศัตรูติด Sparks 1 stack ต่อการโจมตีด้วยสกิล (สูงสุด 5 stack)"},
      {name:'Sparkling Memories', type:'Skill', element:'Psychokinesis', sp:25,
        desc:"Deal Psy damage to all foes equal to 61.0%/67.2%/64.8%/71.0% of Attack. For 2 turns: increase foes' damage taken by 19.5%/19.5%/20.7%/20.7% and inflict 1 Sparks when foes take skill damage. Duration decreases at start of Tomoko's turn. Sparks up to 5 stacks (not inflicted by this skill's own damage).",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูทุกตัว 61.0%/67.2%/64.8%/71.0% ของ Attack เป็นเวลา 2 เทิร์น: เพิ่มดาเมจที่รับของศัตรู 19.5%/19.5%/20.7%/20.7% และทำให้ติด Sparks 1 stack เมื่อศัตรูรับดาเมจสกิล ระยะเวลาลดลงต้นเทิร์น Tomoko Sparks สูงสุด 5 stack (ไม่ติดจากดาเมจสกิลนี้)"},
      {name:'HIGHLIGHT', type:'Skill', element:'Psychokinesis', sp:0,
        desc:"Deal Psy damage to random foes equal to 82.4%/90.8%/87.4%/95.9% of Attack (3 hits). Prioritize unhit foes, inflict 1 Sparks per hit, 30% damage for repeated hits. [4-turn cooldown]",
        descTh:"ดีลดาเมจพลังจิตต่อศัตรูสุ่ม 82.4%/90.8%/87.4%/95.9% ของ Attack (3 ครั้ง) ให้ความสำคัญกับศัตรูที่ยังไม่ถูกโจมตี ทำให้ติด Sparks 1 stack ต่อครั้ง ดาเมจ 30% สำหรับการโจมตีซ้ำ [Cooldown: 4 เทิร์น]"},
      {name:'Power of Memories', type:'Passive', element:'-', sp:0,
        desc:"During battle, increase Psy damage and max HP based on HP recovery. At max 42% HP recovery: Psy damage +70%, max HP +2100.",
        descTh:"ระหว่างการต่อสู้ เพิ่มดาเมจพลังจิตและ HP สูงสุดตามการฟื้นฟู HP ที่ HP recovery สูงสุด 42%: ดาเมจพลังจิต +70%, HP สูงสุด +2100"},
      {name:'Soothing Waves', type:'Passive', element:'-', sp:0,
        desc:"When activating Hale Summer Days, increase main target's max HP by 1800 for 2 turns. Restore lowest HP ally's HP equal to 60% of skill healing.",
        descTh:"เมื่อเปิดใช้ Hale Summer Days เพิ่ม HP สูงสุดของเป้าหมายหลัก 1800 เป็นเวลา 2 เทิร์น ฟื้นฟู HP ของพันธมิตรที่มี HP ต่ำสุด 60% ของการรักษาจากสกิล"},
    ],
    awareness:[
      {name:'Summer Reminiscence',
        desc:"After an ally acts, if any foe has 3+ Sparks stacks, activate Resonance: for every 3 Sparks on all foes, deal Psy = 19% ATK to all, decrease target damage -30% for 1 turn, heal party = 9% ATK + 300/600/900 (Lv.1/50/70+). Up to 5 rounds. Damage scales: 150%/120%/100% for 1/2/3+ foes. No Down Point damage. Defeated foe's Sparks pass to random foes.",
        descTh:"หลังพันธมิตรใช้แอ็คชัน หากศัตรูมี Sparks 3+ stack เปิดใช้ Resonance: ต่อ Sparks 3 stack บนศัตรูทุกตัว ดีลดาเมจพลังจิต 19% ของ ATK ต่อทุกตัว ลดดาเมจเป้าหมาย -30% 1 เทิร์น ฮีลปาร์ตี้ 9% ATK + 300/600/900 (Lv.1/50/70+) สูงสุด 5 รอบ ดาเมจ: 150%/120%/100% สำหรับ 1/2/3+ ตัว ไม่มี Down Point ศัตรูที่ตายส่ง Sparks ต่อแบบสุ่ม"},
      {name:'Flash of Summer',
        desc:"Each SR effect on a foe → DEF -15% for 3 turns (stacks 3). Hale Summer Days healing now applies to all allies.",
        descTh:"ทุก SR effect บนศัตรู → DEF -15% 3 เทิร์น (สะสม 3) Hale Summer Days ฮีลพันธมิตรทุกคนแทน"},
      {name:'Gentle Sunbeams',
        desc:"Every 2 SR activations → 1 Sparks on random foe. Each Sparks inflicted → party ATK permanently +2% (up to 15 stacks).",
        descTh:"ทุก 2 ครั้งที่ SR เปิดใช้ → Sparks 1 stack บนศัตรูสุ่ม ทุกครั้งที่ทำให้ติด Sparks → ATK ปาร์ตี้ถาวร +2% (สูงสุด 15 stack)"},
      {name:'Sentimental Seabreeze',
        desc:"Increase the skill levels of Have a Cold Drink and Hale Summer Days by 3.",
        descTh:"เพิ่มระดับสกิล Have a Cold Drink และ Hale Summer Days ขึ้น 3 ระดับ"},
      {name:'Sparkling Summer Night',
        desc:"Highlight Enhanced: Deal bonus damage (2 hits) and inflict 1 Sparks stack per hit.",
        descTh:"Highlight เสริม: ดีลดาเมจโบนัส (2 ครั้ง) และทำให้ติด Sparks 1 stack ต่อครั้ง"},
      {name:'Lingering Glow',
        desc:"Increase the skill levels of Sparkling Memories and Thief Tactics by 3.",
        descTh:"เพิ่มระดับสกิล Sparkling Memories และ Thief Tactics ขึ้น 3 ระดับ"},
      {name:'Heartfelt Days',
        desc:"Summer Reminiscence gains: CRIT Rate +35% when dealing SR damage. Each SR effect on a foe → permanently +5% damage taken (stacks 3). At max stacks: CRIT DMG taken +20% more.",
        descTh:"Summer Reminiscence เพิ่ม: CRIT Rate +35% เมื่อดีลดาเมจ SR ทุก SR effect บนศัตรู → ดาเมจที่รับถาวร +5% (สะสม 3) ที่ stack สูงสุด: CRIT DMG ที่รับ +20% เพิ่มเติม"},
    ],
    baseStats: {hp:315, atk:97, def:51, spd:103},
    baseStatsLv80: [
      {hp:3540, atk:1090, def:580, spd:0},
      {hp:3604, atk:1110, def:590, spd:0},
      {hp:3667, atk:1129, def:601, spd:0},
      {hp:3731, atk:1149, def:611, spd:0},
      {hp:3795, atk:1168, def:622, spd:0},
      {hp:3858, atk:1188, def:632, spd:0},
      {hp:3922, atk:1208, def:642, spd:0},
    ],
    hiddenAbility: 'ATK% +29%',
    weapons:[
      {name:'Bubble Babies', stars:5,
        hp:2339, atk:720, def:383,
        bonusStats:{heal:22},
        abilityName:'Bubble Babies',
        ability:[
          'Increase healing by 22.0%/22.0%/28.5%/28.5%/35.0%/35.0%/41.5%.',
          'Increase Summer Reminiscence damage multiplier and healing by 18.5%/24.0%/24.0%/29.5%/29.5%/35.0%/35.0%.',
          'When activating Summer Reminiscence, increase target\'s damage taken by 8.5%/11.0%/11.0%/13.5%/13.5%/16.0%/16.0% for 3 turns (stacks 2). Decrease target\'s DEF and ailment resistance by 12% for 3 turns.',],
        abilityTh:[
          'เพิ่มการรักษา 22.0%/22.0%/28.5%/28.5%/35.0%/35.0%/41.5%',
          'เพิ่มตัวคูณดาเมจและการรักษา Summer Reminiscence 18.5%/24.0%/24.0%/29.5%/29.5%/35.0%/35.0%',
          "เมื่อเปิดใช้ Summer Reminiscence เพิ่มดาเมจที่รับของเป้าหมาย 8.5%/11.0%/11.0%/13.5%/13.5%/16.0%/16.0% 3 เทิร์น (สะสม 2) ลด DEF และ ailment resistance เป้าหมาย 12% 3 เทิร์น",
        ]},
      {name:"Ocean's Tidings", stars:4,
        hp:1871, atk:576, def:306,
        bonusStats:{atk:24},
        abilityName:"Ocean's Tidings",
        ability:[
          'Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.',
          "When activating Summer Reminiscence, increase Tomoko's healing by 13.0%/16.9%/16.9%/20.9%/20.9%/24.8%/24.8% for 2 turns.",
        ],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          "เมื่อเปิดใช้ Summer Reminiscence เพิ่มการรักษาของ Tomoko 13.0%/16.9%/16.9%/20.9%/20.9%/24.8%/24.8% เป็นเวลา 2 เทิร์น",
        ]},
    ],
  },
  {name:'Sepia',              codename:'Sepia',          role:'Assassin',   element:'Curse',          rarity:4, cards:['Reconciliation 4pc','Opulence 2pc'],  weapon:'Best Curse ATK weapon',                         statPrio:['ATK%','SPD','HP%'],                              note:'4★ Curse Assassin. High-speed burst damage with Curse element.',
    mechanics: "Sepia มี Verse 3 ประเภท (Hate/Healing/Passion) ที่สะสมจากทักษะต่างกัน Sonnet of Fate Resonance ใช้ Verse stack และเปิด secondary effect เฉพาะต่อประเภท: Hate = ติด Curse, Healing = ฟื้น HP, Passion = ดาเมจ Almighty โบนัส This Beautiful Woman passive เพิ่มดาเมจ Sonnet +10% ต่อ Verse stack ที่ใช้ SPD สูงเร่ง Verse generation ทำให้วงจร Resonance เร็วขึ้น ในฐานะ Curse Assassin 4★ Sepia แลก burst potential กับ high-speed cycling ที่สม่ำเสมอ",
    rotation: [
      "เทิร์น 1 → Hate Verse skill (Curse DMG + สะสม Hate stack สำหรับ Resonance ติด Curse)",
      "เทิร์น 2 → Passion Verse skill (สะสม Passion stack สำหรับ Resonance burst Almighty โบนัส)",
      "ครบ Verse stack สูงสุด → Sonnet of Fate Resonance (ดาเมจหลัก; สเกล +10% ต่อ stack ที่ใช้)",
      "ผสม Verse ตามสถานการณ์: Passion Resonance สำหรับ burst; Hate Resonance สำหรับ ailment; Healing สำหรับ sustain",
      "ใช้ Highlight เมื่อพร้อม → Curse burst ใหญ่ + Verse bonus พิเศษ",
      "สะสม ATK% และ SPD — SPD เร่งการสะสม Verse และวงจร Resonance ต่อการต่อสู้",
    ],
    realName:'Toshiya Sumi', persona:'Gorgyra',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'wk', Wind:'normal', Nuclear:'normal', Curse:'res', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Unexpected Tragedy',    type:'Skill',   element:'Curse', sp:22,
        desc:"Deal Curse damage to 1 foe equal to 58.6%/64.6%/61.0%/67.0% of Attack (3 hits), and gain 3 Verse of Hate stacks.\nThe next time Verse stacks are gained, 25% chance to change to Verse of Hate (max 2).\nWhen spending Verse of Hate stacks to deal damage with Sonnet of Fate, 30% chance to inflict Curse for each Verse of Hate spent.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรู 1 ตัว เท่ากับ 58.6%/64.6%/61.0%/67.0% ของ Attack (3 ครั้ง) และรับ Verse of Hate 3 stack\nครั้งถัดไปที่ได้รับ Verse stack มีโอกาส 25% เปลี่ยนเป็น Verse of Hate (สูงสุด 2)\nเมื่อใช้ Verse of Hate stack เพื่อสร้างความเสียหายด้วย Sonnet of Fate โอกาส 30% ทำให้ติด Curse ต่อ Verse of Hate stack ที่ใช้"},
      {name:'Absurd Comedy',         type:'Skill',   element:'Curse', sp:20,
        desc:"Deal Curse damage to all foes equal to 35.7%/39.3%/37.1%/40.8% of Attack (2 hits), and gain 2 Verse of Healing stacks.\nThe next time Verse stacks are gained, 25% chance to change to Verse of Healing (max 2).\nWhen spending Verse of Healing stacks to deal damage with Sonnet of Fate, restore HP to the ally with the lowest remaining HP by 7.5% of Sumi's Attack for each Verse of Healing spent.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรูทุกตัว เท่ากับ 35.7%/39.3%/37.1%/40.8% ของ Attack (2 ครั้ง) และรับ Verse of Healing 2 stack\nครั้งถัดไปที่ได้รับ Verse stack มีโอกาส 25% เปลี่ยนเป็น Verse of Healing (สูงสุด 2)\nเมื่อใช้ Verse of Healing stack ด้วย Sonnet of Fate ฟื้นฟู HP ให้พันธมิตรที่มี HP เหลือน้อยที่สุด 7.5% ของ Attack ของ Sumi ต่อ Verse of Healing stack ที่ใช้"},
      {name:'Tragicomedy of Love',   type:'Skill',   element:'Curse', sp:22,
        desc:"Deal Curse damage to 1 foe equal to 41.5%/45.7%/43.2%/47.4% of Attack (5 hits), and gain 5 Verse of Passion stacks.\nThe next time Verse stacks are gained, 25% chance to change to Verse of Passion (max 2).\nWhen spending Verse of Passion stacks to deal damage with Sonnet of Fate, deal bonus Almighty damage equal to 7% of Attack for each Verse of Passion spent.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรู 1 ตัว เท่ากับ 41.5%/45.7%/43.2%/47.4% ของ Attack (5 ครั้ง) และรับ Verse of Passion 5 stack\nครั้งถัดไปที่ได้รับ Verse stack มีโอกาส 25% เปลี่ยนเป็น Verse of Passion (สูงสุด 2)\nเมื่อใช้ Verse of Passion stack ด้วย Sonnet of Fate สร้างความเสียหาย Almighty เพิ่มเติม 7% ของ Attack ต่อ Verse of Passion stack ที่ใช้"},
      {name:'Highlight',             type:'Skill',   element:'Curse', sp:0,
        desc:"Deal Curse damage to 1 foe equal to 96.8%/106.7%/100.8%/110.7% of Attack (3 hits). Increase Sumi's Attack for Sonnet of Fate by 50.6%/55.7%/52.6%/57.8% up to 2 times.",
        descTh:"สร้างความเสียหาย Curse ให้ศัตรู 1 ตัว เท่ากับ 96.8%/106.7%/100.8%/110.7% ของ Attack (3 ครั้ง) เพิ่ม Attack ของ Sumi สำหรับ Sonnet of Fate 50.6%/55.7%/52.6%/57.8% สูงสุด 2 ครั้ง"},
      {name:'The Other Prison',      type:'Passive', element:'-',     sp:0,
        desc:"Increase damage of Sonnet of Fate on foes with Curse by 50.0%.",
        descTh:"เพิ่มความเสียหายของ Sonnet of Fate ต่อศัตรูที่ติด Curse 50.0%"},
      {name:'This Beautiful Woman',  type:'Passive', element:'-',     sp:0,
        desc:"For each Verse of Hate, Verse of Healing, or Verse of Passion stack spent, increase damage of Sonnet of Fate by 10.0%.",
        descTh:"ต่อ Verse of Hate, Verse of Healing หรือ Verse of Passion stack ที่ใช้ เพิ่มความเสียหายของ Sonnet of Fate 10.0%"},
    ],
    awareness:[
      {name:'Sonnet of Fate',
        desc:"Each time an ally deals damage, gain 1 Verse stack.\nAt 14+ Verse stacks, activate a Resonance and spend 14 Verse stacks to deal follow-up Curse damage to the last foe Sumi targeted, equal to 65%/98%/130% of Attack (effect changes at Lv. 1/50/70, respectively).\n*Verse of Hate, Verse of Healing, and Verse of Passion all also count as Verse stacks.",
        descTh:"ทุกครั้งที่พันธมิตรสร้างความเสียหาย รับ 1 Verse stack\nเมื่อมี Verse stack 14 ขึ้นไป เปิดใช้ Resonance และใช้ 14 stack เพื่อสร้างความเสียหาย Curse ตาม ศัตรูตัวล่าสุดที่ Sumi โจมตี เท่ากับ 65%/98%/130% ของ Attack (เปลี่ยนที่ Lv. 1/50/70)\n*Verse of Hate, Verse of Healing และ Verse of Passion นับเป็น Verse stack ด้วย"},
      {name:'Fishing Pond Master',
        desc:"After using a skill, increase damage of the next Sonnet of Fate by 40%.",
        descTh:"หลังจากใช้สกิล เพิ่มความเสียหายของ Sonnet of Fate ครั้งถัดไป 40%"},
      {name:'Flight and Conflict',
        desc:"Increase Attack of Sonnet of Fate by 50%, and inflict Curse on foes hit.",
        descTh:"เพิ่ม Attack ของ Sonnet of Fate 50% และทำให้ศัตรูที่โดนโจมตีติด Curse"},
      {name:'Passion for Creation',
        desc:"Increase the skill levels of Unexpected Tragedy and Absurd Comedy by 2.",
        descTh:"เพิ่มระดับสกิล Unexpected Tragedy และ Absurd Comedy ขึ้น 2"},
      {name:'Scream from the Soul',
        desc:"Highlight Enhanced: Increase damage of Sonnet of Fate the next 4 times.",
        descTh:"Highlight Enhanced: เพิ่มความเสียหายของ Sonnet of Fate 4 ครั้งถัดไป"},
      {name:'Throes of Creation',
        desc:"Increase the skill levels of Tragicomedy of Love and Thief Tactics by 2.",
        descTh:"เพิ่มระดับสกิล Tragicomedy of Love และ Thief Tactics ขึ้น 2"},
      {name:'Life Advice',
        desc:"After using a skill, the Verse of Hate, Verse of Healing, or Verse of Passion gained activates 3 more times next turn.\nIf 2 or more different types of Verses are stacked, increase Sonnet of Fate damage by 67%.",
        descTh:"หลังจากใช้สกิล Verse of Hate, Verse of Healing หรือ Verse of Passion ที่ได้รับจะทำงานเพิ่มอีก 3 ครั้งในเทิร์นถัดไป\nหาก Verse ต่างประเภท 2 ชนิดขึ้นไปสะสมอยู่ เพิ่มความเสียหายของ Sonnet of Fate 67%"},
    ],
    baseStats:     {hp:228, atk:74, def:41, spd:98},
    baseStatsLv80: [
      {hp:2565, atk:840, def:470, spd:98},
      {hp:2595, atk:850, def:476, spd:98},
      {hp:2625, atk:859, def:481, spd:98},
      {hp:2654, atk:869, def:486, spd:98},
      {hp:2684, atk:878, def:492, spd:98},
      {hp:2713, atk:889, def:497, spd:98},
      {hp:2743, atk:898, def:503, spd:98},
    ],
    hiddenAbility: 'ATK% +21.8%',
    weapons:[
      {
        name: "Babel's Verdict", stars:5,
        hp: 2259, atk: 740, def: 414,
        bonusStats: {atk:30},
        abilityName: "Babel's Verdict",
        ability: [
          'Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.',
          'Increase damage of Sonnet of Fate by 33.0%/43.0%/43.0%/53.0%/53.0%/63.0%/63.0%.',
          'After gaining a Verse, 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% chance to gain Verse of Zenith.\nVerse of Zenith has all the effects of Verse of Hate, Verse of Healing, and Verse of Passion.',],
        abilityTh: [
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'เพิ่มความเสียหายของ Sonnet of Fate 33.0%/43.0%/43.0%/53.0%/53.0%/63.0%/63.0%',
          'หลังจากได้รับ Verse มีโอกาส 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% รับ Verse of Zenith\nVerse of Zenith มีเอฟเฟกต์ทั้งหมดของ Verse of Hate, Verse of Healing และ Verse of Passion',
        ],
      },
      {
        name: 'Scarlet Scepter', stars:4,
        hp: 1808, atk: 592, def: 331,
        bonusStats: {atk:12},
        abilityName: 'Scarlet Scepter',
        ability:[
          "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.",
          "When gaining Verse of Hate, Verse of Healing, or Verse of Passion, increase damage by 2.0%/2.6%/2.6%/3.2%/3.2%/3.8%/3.8% based on the number of current Verses for 1 turn.",
        ],
        abilityTh: [
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'เมื่อได้รับ Verse of Hate, Verse of Healing หรือ Verse of Passion เพิ่มความเสียหาย 2.0%/2.6%/2.6%/3.2%/3.2%/3.8%/3.8% ตามจำนวน Verse ปัจจุบัน เป็นเวลา 1 เทิร์น',
        ],
      },
    ],
  },
  {name:'Puppet', codename:'Puppet', role:'Elucidator', element:'-', rarity:4,
    cards:['Love 4pc','Peace 2pc'], weapon:'Best DEF/HP support weapon',
    statPrio:['DEF%','HP%','SPD'], note:"Elucidator. Seashell stack system: granting shields adds Seashell stacks, which amplify future shields (Whispering Waves) and boost allies' DEF (I'll Protect You!). Stat Buff shares 15% of Phantom Thief's stats. Tide of Dreams grants damage up at 4+ Seashell stacks.",
    mechanics: "Puppet (Miyu) ใช้ระบบ Seashell stack ที่ทุกครั้งที่มอบ shield ให้ปาร์ตี้จะเพิ่ม stack (สูงสุด 6-8) Seashell stack เพิ่มพลัง shield ในอนาคตผ่าน Whispering Waves (+1% shield ต่อ stack) Milestone bonus เปิดที่ 2/4/6 stack: DEF+8%, ATK+8%, DEF+12% ตามลำดับ Guardian of the Sea เพิ่ม Seashell stack อัตโนมัติทุกครั้งที่มอบ shield ในฐานะ Elucidator 4★ Miyu support ด้วย shield ที่เพิ่มขึ้นเรื่อยๆ และแชร์ stat ผ่าน Stat Buff",
    rotation: [
      "เทิร์น 1 → Shield skill (มอบ shield ปาร์ตี้; เปิด Seashell stack + auto-Seashell จาก Guardian of the Sea)",
      "เทิร์น 2 → Support buff skill (ATK หรือ DMG amplification ปาร์ตี้ สเกลตาม stat ของ Miyu)",
      "สะสม Seashell stack เร็วๆ เพื่อปลดล็อก milestone: 2=DEF+8%, 4=ATK+8%, 6=DEF+12%",
      "ครบ 6 Seashell stack → shield ในอนาคตแรงขึ้น 6% — รักษา shield cycling uptime",
      "Stat Buff passive แชร์ 15% ของ stat ของ Miyu ให้ทุก ally — รักษา ATK/DEF ของ Miyu สูงสุด",
      "ใช้ Highlight เมื่อพร้อม → shield burst ปาร์ตี้ + stat boost",
    ],
    realName:'Miyu Sahara', persona:'Nemertes',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:"Little Mermaid's Song", type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Grant a shield to party equal to 29.3%/29.3%/31.6%/31.6% of Miyu's Defense + 1110/1330/1437/1657 for 2 turns, and restore 4 SP. When an ally's shield is broken, decrease cooldown by 1.\nCooldown Time: 8 ally actions.",
        descTh:"มอบ shield ให้ปาร์ตี้ เท่ากับ 29.3%/29.3%/31.6%/31.6% ของ Defense ของ Miyu + 1110/1330/1437/1657 เป็นเวลา 2 เทิร์น และฟื้นฟู 4 SP เมื่อ shield ของพันธมิตรถูกทำลาย ลดเวลาคูลดาวน์ 1\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร"},
      {name:"Poseidon's Blessing", type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"For 2 turns, grant a shield to 1 ally equal to 67.2%/67.2%/72.6%/72.6% of Miyu's Defense + 2542/3042/3290/3790 and decrease weakness damage taken by 20%/20%/20%/20%. Grant 2 Down Points and 2 Seashell stacks.\nCooldown Time: 8 ally actions.",
        descTh:"มอบ shield ให้พันธมิตร 1 คน เท่ากับ 67.2%/67.2%/72.6%/72.6% ของ Defense ของ Miyu + 2542/3042/3290/3790 เป็นเวลา 2 เทิร์น และลดดาเมจ weakness ที่รับ 20% มอบ Down Points 2 และ Seashell 2 stack\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร"},
      {name:'Tide of Dreams', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Grant a shield to all allies equal to 33.2%/33.2%/35.9%/35.9% of Miyu's Defense + 1259/1509/1629/1879 + number of Seashell stacks on party × (6.9%/6.9%/7.5%/7.5% of Miyu's Defense + 260/260/336/336) for 3 turns.\nIf an ally has 4 or more Seashell stacks, increase damage by 2.0%/2.0%/2.2%/2.2% for each stack. The damage increase effect lasts for 3 turns or until shield is broken, then lose 2 Seashell stacks.\nCooldown Time: 12 ally actions.",
        descTh:"มอบ shield ให้พันธมิตรทุกคน เท่ากับ 33.2%/33.2%/35.9%/35.9% ของ Defense ของ Miyu + 1259/1509/1629/1879 + จำนวน Seashell stacks ของปาร์ตี้ × (6.9%/6.9%/7.5%/7.5% ของ Defense ของ Miyu + 260/260/336/336) เป็นเวลา 3 เทิร์น\nหากพันธมิตรมี Seashell 4 stack หรือมากกว่า เพิ่มดาเมจ 2.0%/2.0%/2.2%/2.2% ต่อ stack เอฟเฟกต์นี้คงอยู่ 3 เทิร์น หรือจนกว่า shield จะถูกทำลาย แล้วสูญเสีย Seashell 2 stack\nเวลาคูลดาวน์: 12 การกระทำของพันธมิตร"},
      {name:'Stat Buff', type:'Passive', element:'-', sp:0,
        desc:"Increase all allies' corresponding attribute stats by 15% of Phantom Thief's respective attributes.",
        descTh:"เพิ่มสถิติที่สอดคล้องของพันธมิตรทุกคน 15% ของสถิติของ Phantom Thief"},
      {name:'Whispering Waves', type:'Passive', element:'-', sp:0,
        desc:"Increase shield effect by number of party's Seashell stacks × 1.0%.",
        descTh:"เพิ่มเอฟเฟกต์ shield ตามจำนวน Seashell stacks ของปาร์ตี้ × 1.0%"},
      {name:"I'll Protect You!", type:'Passive', element:'-', sp:0,
        desc:"Increase ally's Defense by 3.6% for each Seashell stack.",
        descTh:"เพิ่ม Defense ของพันธมิตร 3.6% ต่อ Seashell stack"},
    ],
    awareness:[
      {name:'Guardian of the Sea',
        desc:"When Miyu grants a shield, grant 1 Seashell stack to that ally, up to 6. When gaining a Seashell stack, increase shield received by 1% for each stack.\nWhenever reaching 2/4/6 stacks (based on Miyu's level 1/50/70+):\n2 stacks: Increase Defense by 8%/12%/16%.\n4 stacks: Increase Attack by 8%/12%/16%.\n6 stacks: Increase Defense by 12%/18%/24%.",
        descTh:"เมื่อ Miyu มอบ shield ให้พันธมิตรนั้น 1 Seashell stack (สูงสุด 6) เมื่อได้รับ Seashell stack เพิ่ม shield ที่รับ 1% ต่อ stack\nเมื่อถึง 2/4/6 stack (ตามระดับของ Miyu 1/50/70+):\n2 stack: เพิ่ม Defense 8%/12%/16%\n4 stack: เพิ่ม Attack 8%/12%/16%\n6 stack: เพิ่ม Defense 12%/18%/24%"},
      {name:'Marionette Dance',
        desc:"At the start of battle, grant party 1 Seashell stack.",
        descTh:"ในช่วงเริ่มต้นการต่อสู้ มอบ Seashell 1 stack ให้ปาร์ตี้"},
      {name:'For My Big Bro!',
        desc:"When an ally's remaining HP is below 30%, grant them a shield equal to 28% of Miyu's Defense + 660 for 2 turns. This effect can be activated once per battle.",
        descTh:"เมื่อ HP ที่เหลือของพันธมิตรต่ำกว่า 30% มอบ shield เท่ากับ 28% ของ Defense ของ Miyu + 660 เป็นเวลา 2 เทิร์น เอฟเฟกต์นี้สามารถใช้งานได้ครั้งเดียวต่อการต่อสู้"},
      {name:'Self-Reliance',
        desc:"Increase the skill levels of Little Mermaid's Song and Poseidon's Blessing by 2.",
        descTh:"เพิ่มระดับสกิลของ Little Mermaid's Song และ Poseidon's Blessing 2 ระดับ"},
      {name:'Chasing Dreams',
        desc:"When an ally uses a Highlight or Theurgy, grant that ally a shield equal to 16% of Miyu's Defense + 480 for 2 turns.",
        descTh:"เมื่อพันธมิตรใช้ Highlight หรือ Theurgy มอบ shield เท่ากับ 16% ของ Defense ของ Miyu + 480 เป็นเวลา 2 เทิร์น"},
      {name:'Street Performer',
        desc:"Increase the skill level of Tide of Dreams by 2.",
        descTh:"เพิ่มระดับสกิลของ Tide of Dreams 2 ระดับ"},
      {name:'Runaway',
        desc:"Increase maximum number of Seashell stacks to 8. When Seashell reaches 8 stacks, increase damage by 20%.",
        descTh:"เพิ่มจำนวน Seashell stacks สูงสุดเป็น 8 เมื่อ Seashell ถึง 8 stack เพิ่มดาเมจ 20%"},
    ],
    baseStats:{hp:236, atk:64, def:48, spd:100},
    baseStatsLv80:[
      {hp:2655, atk:728, def:540, spd:0},
      {hp:2686, atk:736, def:546, spd:0},
      {hp:2717, atk:745, def:553, spd:0},
      {hp:2747, atk:753, def:558, spd:0},
      {hp:2778, atk:761, def:565, spd:0},
      {hp:2808, atk:769, def:571, spd:0},
      {hp:2839, atk:778, def:578, spd:0},
    ],
    hiddenAbility:'DEF% +32.6%',
    weapons:[
      {name:'Ephemerality', stars:5, hp:2339, atk:641, def:476, bonusStats:{def:45},
        abilityName:'Ephemerality',
        ability:["Increase Defense by 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%. After using a skill, grant 1 Seashell stack to the main target. For every stack of Seashell granted, increase Attack by 3.0%/4.0%/4.0%/5.0%/5.0%/6.0%/6.0% and Defense by 3.0%/4.0%/4.0%/5.0%/5.0%/6.0%/6.0% for 2 turns."],
        abilityTh:[
          'เพิ่ม Defense 45.0%/45.0%/59.0%/59.0%/73.0%/73.0%/87.0%',
          'หลังใช้สกิล มอบ Seashell 1 stack ให้เป้าหมายหลัก ต่อ Seashell 1 stack ที่มอบให้ เพิ่ม Attack 3.0%/4.0%/4.0%/5.0%/5.0%/6.0%/6.0% และ Defense 3.0%/4.0%/4.0%/5.0%/5.0%/6.0%/6.0% เป็นเวลา 2 เทิร์น',]},
      {name:'Submarine Sonar', stars:4, hp:1871, atk:513, def:381, bonusStats:{},
        abilityName:'Submarine Sonar',
        ability:["Increase shield by 8.7%/8.7%/11.3%/11.3%/13.9%/13.9%/16.5%. Increase Defense of shielded allies by 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%."],
        abilityTh:[
          'เพิ่ม shield 8.7%/8.7%/11.3%/11.3%/13.9%/13.9%/16.5%',
          'เพิ่ม Defense ของพันธมิตรที่มี shield 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%',
        ]},
    ],
  },
  {name:'Okyann', codename:'Okyann', role:'Elucidator', element:'-', rarity:4,
    cards:['Opulence 4pc','Reconciliation 2pc'], weapon:'Best ATK support weapon (Retro Disco Style)',
    statPrio:['ATK%','SPD','HP%'], note:"Elucidator. Beat stack system triggers Resonance (Pulsating Rhythm ATK/DEF/ailment accuracy buff). Retro Dance Number amplifies damage dealt to ailment-inflicted foes ×1.5. Stat Buff shares 15% of Phantom Thief's stats.",
    mechanics: "Okyann สะสม Beat stack passive (จากดาเมจทักษะของปาร์ตี้และ Retro Dance Number) เมื่อครบ 4+ Beat stack → Pulsating Rhythm Resonance ยิง — ให้ ATK/DEF/ailment accuracy buff ปาร์ตี้ที่สเกลตาม stat ของ Okyann เอง (buff เพิ่มขึ้นที่ Lv 50 และ 70 ของตัวละคร) Retro Dance Number คูณดาเมจปาร์ตี้ 1.5× ต่อศัตรูที่ติด ailment Stat Buff แชร์ 15% ของ stat ของ Okyann ให้ทุก ally ในฐานะ Elucidator 4★ Okyann โดดเด่นใน composition ที่เน้น ailment",
    rotation: [
      "เทิร์น 1 → ทักษะที่สะสม Beat stack (passive จาก party action หรือ stack generation โดยตรง)",
      "ครบ 4+ Beat → Pulsating Rhythm Resonance (ATK+DEF+ailment accuracy buff ปาร์ตี้)",
      "Retro Dance Number: เปิดก่อนเทิร์น DPS ต่อศัตรูที่ติด ailment เพื่อ DMG 1.5×",
      "Stat Buff passive: รักษา ATK และ ailment accuracy ของ Okyann สูงสุดเพื่อแชร์ stat ปาร์ตี้",
      "ใช้ Highlight เมื่อพร้อม → buff ปาร์ตี้ + ติด ailment เพื่อ Retro Dance Number synergy",
      "คู่กับ ailment specialist (Rin, Howler, Riddle) เพื่อให้ Retro Dance Number ใช้ได้เสมอ",
    ],
    realName:'Kayo Tomiyama', persona:'Cleodora',
    weakRes:{ Fire:'normal', Ice:'normal', Electric:'normal', Wind:'normal', Nuclear:'normal',
      Curse:'normal', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
    skills:[
      {name:'Club Okyann', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's Attack by 12% of Tomiyama's Attack for 1 turn (up to 4500/4950/5400/5850 of Attack), increase ailment accuracy by 35.0%/38.5%/37.8%/41.3%, and gain 1 Beat stack.\nCooldown Time: 4 ally actions.",
        descTh:"เพิ่ม Attack ของปาร์ตี้ 12% ของ Attack ของ Tomiyama 1 เทิร์น (สูงสุด 4500/4950/5400/5850 ATK) เพิ่ม ailment accuracy 35.0%/38.5%/37.8%/41.3% และได้รับ Beat 1 stack\nเวลาคูลดาวน์: 4 การกระทำของพันธมิตร"},
      {name:'Intermission', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Restore party's SP by 22/27/26/31, and grant 3 Beat stacks.\nCooldown Time: 8 ally actions.",
        descTh:"ฟื้นฟู SP ของปาร์ตี้ 22/27/26/31 และมอบ Beat 3 stack\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร"},
      {name:'Retro Dance Number', type:'Skill', element:'-', sp:0, isBuff:true,
        desc:"Increase party's damage by 10.0%/11.0%/10.8%/11.8% for 3 turns. Increase damage by 1% for every 225 of Tomiyama's Attack (up to 4500/4950/5400/5850 of Attack). Also increase damage dealt to foes with an elemental ailment by 1.5 times and gain 2 Beat stacks.\nCooldown Time: 8 ally actions.",
        descTh:"เพิ่มดาเมจของปาร์ตี้ 10.0%/11.0%/10.8%/11.8% 3 เทิร์น เพิ่มดาเมจ 1% ต่อ Attack ของ Tomiyama ทุก 225 (สูงสุด 4500/4950/5400/5850 ATK)\nนอกจากนี้ เพิ่มดาเมจต่อศัตรูที่มี elemental ailment เป็น 1.5 เท่า และได้รับ Beat 2 stack\nเวลาคูลดาวน์: 8 การกระทำของพันธมิตร"},
      {name:'Stat Buff', type:'Passive', element:'-', sp:0,
        desc:"Increase all allies' corresponding attribute stats by 15% of Phantom Thief's respective attributes.",
        descTh:"เพิ่มสถิติที่สอดคล้องของพันธมิตรทุกคน 15% ของสถิติของ Phantom Thief"},
      {name:'Toe-Tapping', type:'Passive', element:'-', sp:0,
        desc:"For every 4 Beat stacks gained, inflict 1 random elemental ailment on the foe with the highest remaining HP.",
        descTh:"ต่อ Beat 4 stack ที่ได้รับ ทำให้ศัตรูที่มี HP เหลืออยู่มากที่สุดติด elemental ailment สุ่ม 1 รายการ"},
      {name:'Outdated Slang', type:'Passive', element:'-', sp:0,
        desc:"When an ally inflicts an elemental ailment on a foe, increase that ally's damage by 15% for 2 turns. Also, 21% chance to grant 1 Beat stack.",
        descTh:"เมื่อพันธมิตรทำให้ศัตรูติด elemental ailment เพิ่มดาเมจของพันธมิตรนั้น 15% 2 เทิร์น นอกจากนี้ โอกาส 21% ที่จะได้รับ Beat 1 stack"},
    ],
    awareness:[
      {name:'Fever Time',
        desc:"When using a skill, gain Beat stacks. When Beat stacks reach 4 or more, activate a Resonance, spending 4 Beat stacks to grant 1 Pulsating Rhythm stack to all allies.\nWhen allies have Pulsating Rhythm, increase Attack by 10%/15%/20%, Defense by 10%/15%/20% and ailment accuracy by 5%/7.5%/10% based on Tomiyama's level (effect increases at level 1/50/70). Lasts for 2 turns. Stacks up to 3 times, and effects increase based on number of stacks.",
        descTh:"เมื่อใช้สกิล รับ Beat stacks เมื่อ Beat stacks ถึง 4 หรือมากกว่า ใช้งาน Resonance โดยใช้ Beat 4 stack เพื่อมอบ Pulsating Rhythm 1 stack ให้พันธมิตรทุกคน\nเมื่อพันธมิตรมี Pulsating Rhythm เพิ่ม Attack 10%/15%/20%, Defense 10%/15%/20% และ ailment accuracy 5%/7.5%/10% ตามระดับของ Tomiyama (เพิ่มที่ระดับ 1/50/70) คงอยู่ 2 เทิร์น สะสมสูงสุด 3 ครั้ง เอฟเฟกต์เพิ่มขึ้นตามจำนวน stack"},
      {name:'Finish with a Smile',
        desc:"At the start of battle, gain 2 Beat stacks, and increase party's ailment accuracy by 35% for 1 turn.",
        descTh:"ในช่วงเริ่มต้นการต่อสู้ รับ Beat 2 stack และเพิ่ม ailment accuracy ของปาร์ตี้ 35% 1 เทิร์น"},
      {name:'Disco Ball',
        desc:"After granting Pulsating Rhythm, 20% chance to gain 1 Beat stack.",
        descTh:"หลังมอบ Pulsating Rhythm โอกาส 20% ที่จะได้รับ Beat 1 stack"},
      {name:'Pop and Show It',
        desc:"Increase the skill levels of Club Okyann and Intermission by 2.",
        descTh:"เพิ่มระดับสกิลของ Club Okyann และ Intermission 2 ระดับ"},
      {name:'Queen of the Stage',
        desc:"When an ally uses a Highlight or Theurgy, 67% chance to gain 1 Beat stack.",
        descTh:"เมื่อพันธมิตรใช้ Highlight หรือ Theurgy โอกาส 67% ที่จะได้รับ Beat 1 stack"},
      {name:'Raise the Roof',
        desc:"Increase the skill level of Retro Dance Number by 2.",
        descTh:"เพิ่มระดับสกิลของ Retro Dance Number 2 ระดับ"},
      {name:'Hey, DJ!',
        desc:"After activating Pulsating Rhythm, 25% chance to activate Encore, granting 1 additional Pulsating Rhythm. Encore will not activate consecutively.",
        descTh:"หลังใช้งาน Pulsating Rhythm โอกาส 25% ที่จะใช้งาน Encore มอบ Pulsating Rhythm เพิ่มเติม 1 ครั้ง Encore ไม่สามารถใช้งานซ้ำกันได้"},
    ],
    baseStats:{hp:236, atk:70, def:42, spd:100},
    baseStatsLv80:[
      {hp:2655, atk:788, def:480, spd:0},
      {hp:2686, atk:797, def:486, spd:0},
      {hp:2717, atk:806, def:491, spd:0},
      {hp:2747, atk:815, def:497, spd:0},
      {hp:2778, atk:824, def:502, spd:0},
      {hp:2808, atk:833, def:508, spd:0},
      {hp:2839, atk:842, def:514, spd:0},
    ],
    hiddenAbility:'ATK% +21.8%',
    weapons:[
      {name:'Retro Disco Style', stars:5, hp:2339, atk:694, def:423, bonusStats:{atk:30},
        abilityName:'Retro Disco Style',
        ability:["Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%. After granting Pulsating Rhythm, 41.0%/54.0%/54.0%/67.0%/67.0%/80.0%/80.0% chance to gain 1 Beat stack. Increase buffs from Pulsating Rhythm by 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0% more."],
        abilityTh:[
          'เพิ่ม Attack 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%',
          'หลังมอบ Pulsating Rhythm โอกาส 41.0%/54.0%/54.0%/67.0%/67.0%/80.0%/80.0% ที่จะได้รับ Beat 1 stack เพิ่ม buff จาก Pulsating Rhythm 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0%',]},
      {name:'Emerald Charmer', stars:4, hp:1871, atk:555, def:338, bonusStats:{atk:24},
        abilityName:'Emerald Charmer',
        ability:["Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. After using a support skill, 43.0%/56.0%/56.0%/69.0%/69.0%/82.0%/82.0% chance to gain 1 Beat stack."],
        abilityTh:[
          'เพิ่ม Attack 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%',
          'หลังใช้สกิล support โอกาส 43.0%/56.0%/56.0%/69.0%/69.0%/82.0%/82.0% ที่จะได้รับ Beat 1 stack',
        ]},
    ],
  },
]

const SKILL_TYPE_IMG = { Passive: import.meta.env.BASE_URL + 'p5x/elements/passive.webp' }

const BASE = import.meta.env.BASE_URL + 'p5x/roles/'
const ROLE_IMG = {
  Sweeper:    BASE + 'sweeper.webp',
  Assassin:   BASE + 'assassin.webp',
  Strategist: BASE + 'strategist.webp',
  Saboteur:   BASE + 'saboteur.webp',
  Guardian:   BASE + 'guardian.webp',
  Medic:      BASE + 'medic.webp',
  Elucidator: BASE + 'elucidator.webp',
  Virtuoso:   BASE + 'virtuoso.webp',
}
const BASE_ELEM = import.meta.env.BASE_URL + 'p5x/elements/'
const ELEM_IMG = {
  Fire:     BASE_ELEM + 'fire.webp',
  Ice:      BASE_ELEM + 'ice.webp',
  Electric: BASE_ELEM + 'electric.webp',
  Wind:     BASE_ELEM + 'wind.webp',
  Nuclear:  BASE_ELEM + 'nuclear.webp',
  Curse:    BASE_ELEM + 'curse.webp',
  Bless:    BASE_ELEM + 'bless.webp',
  Physical: BASE_ELEM + 'physical.webp',
  Almighty:       BASE_ELEM + 'almighty.webp',
  Psychokinesis:  BASE_ELEM + 'psychokinesis.webp',
  '-':            BASE_ELEM + 'none.svg',
}
const BASE_PORTRAITS = import.meta.env.BASE_URL + 'p5x/portraits/'
const PORTRAITS = {
  'Ren Amamiya':      BASE_PORTRAITS + 'joker.webp',
  'Ann Takamaki':     BASE_PORTRAITS + 'panther.webp',
  'Ryuji Sakamoto':   BASE_PORTRAITS + 'skull.webp',
  'Kasumi Yoshizawa': BASE_PORTRAITS + 'violet.webp',
  'Futaba Sakura':    BASE_PORTRAITS + 'oracle.webp',
  'Ayaka Sakai':      BASE_PORTRAITS + 'chord.webp',
  'Tempest Riko':     BASE_PORTRAITS + 'wind.webp',
  'Yaoling Li':       BASE_PORTRAITS + 'rin.webp',
  'Seiji Shiratori':  BASE_PORTRAITS + 'fleuret.webp',
  'Manaka Nagao':     BASE_PORTRAITS + 'ange.webp',
  'Yusuke Kitagawa':  BASE_PORTRAITS + 'fox.webp',
  'Makoto Niijima':   BASE_PORTRAITS + 'queen.webp',
  'Goro Akechi':      BASE_PORTRAITS + 'crow.webp',
  'Luce':             BASE_PORTRAITS + 'luce.webp',
  'Turbo':            BASE_PORTRAITS + 'turbo.webp',
  'Matoi':            BASE_PORTRAITS + 'matoi.webp',
  'Howler':           BASE_PORTRAITS + 'howler.webp',
  'J&C':              BASE_PORTRAITS + 'j-c.webp',
  'Noir':             BASE_PORTRAITS + 'noir.webp',
  'Cherish':          BASE_PORTRAITS + 'cherish.webp',
  'Messa':            BASE_PORTRAITS + 'messa.webp',
  'Phoebe':           BASE_PORTRAITS + 'phoebe.webp',
  'Marian':           BASE_PORTRAITS + 'marian.webp',
  'Morgana':          BASE_PORTRAITS + 'mona.webp',
  'Yui':              BASE_PORTRAITS + 'bui.webp',
  'Vino':             BASE_PORTRAITS + 'vino.webp',
  'Riddle':           BASE_PORTRAITS + 'riddle.webp',
  'Cattle':           BASE_PORTRAITS + 'cattle.webp',
  'Leon':             BASE_PORTRAITS + 'leon.webp',
  'Closer':           BASE_PORTRAITS + 'closer.webp',
  'Mont':             BASE_PORTRAITS + 'mont.webp',
  'Soy':              BASE_PORTRAITS + 'soy.webp',
  'Yuki':             BASE_PORTRAITS + 'yuki.webp',
  'Key':              BASE_PORTRAITS + 'key.webp',
  'Kiyoshi Kurotani': BASE_PORTRAITS + 'key.webp',
  'Moko':             BASE_PORTRAITS + 'moko.webp',
  'Sepia':            BASE_PORTRAITS + 'sepia.webp',
  'Puppet':           BASE_PORTRAITS + 'puppet.webp',
  'Okyann':           BASE_PORTRAITS + 'okyann.webp',
  'Makoto':           BASE_PORTRAITS + 'makoto.webp',
  'Closer (Tropical)':BASE_PORTRAITS + 'closer-tropical.webp',
  'Rin (Firecracker)':BASE_PORTRAITS + 'rin-firecracker.webp',
  'Mont (Frostgale)': BASE_PORTRAITS + 'mont-frostgale.webp',
  'Riko Tanemura':    BASE_PORTRAITS + 'wind.webp',
  'Wind (Tempest)':   BASE_PORTRAITS + 'wind-tempest.webp',
  'Moko (Seaside)':   BASE_PORTRAITS + 'moko-seaside.webp',
}
const RAINBOW_CHARS = new Set(['Violet','Oracle','Chord','Ange','Queen','Crow','Matoi','J&C','Noir','Messa','makoto','closer-tropical','rin-firecracker','mont-frostgale','wind-tempest','moko-seaside'])
const ROLE_ICONS = {Sweeper:'🌊', Assassin:'⚔️', Medic:'💚', Guardian:'🛡️', Saboteur:'🎯', Strategist:'🎵', Elucidator:'📡', Virtuoso:'✨'}
const ELEM_COLORS = {Fire:'#ff4422',Ice:'#44aaff',Electric:'#ffee00',Wind:'#44ffaa',Nuclear:'#ff8800',Curse:'#aa44ff',Bless:'#ffcc44',Physical:'#ff8866',Almighty:'#ffffff',Psychokinesis:'#dd44ff','-':'#888888'}
const ROLE_COLORS = {Sweeper:'#40c8ff', Assassin:'#ff6030', Medic:'#40ff80', Guardian:'#8080ff', Saboteur:'#ffcc40', Strategist:'#b060ff', Elucidator:'#40ffcc', Virtuoso:'#ff88ff'}

const BOSS_PRESETS = [
  { name: 'Custom',              def: null,   addDef: null  },
  { name: 'Dominion (LV82)',     def: 363.2,  addDef: 158.4 },
  { name: 'Atavaka (LV82)',      def: 1279.9, addDef: 158.4 },
  { name: 'Vishnu (LV82)',       def: 820.7,  addDef: 158.4 },
  { name: 'Mini Vishnu (LV82)', def: 363.2,  addDef: 158.4 },
  { name: 'Yatsufusa (LV82)',    def: 1279.9, addDef: 205.9 },
  { name: 'Sea of Souls 8★',    def: 400,    addDef: 163.2 },
]

const STAT_TARGETS = {
  dps:      {atk:[120,25], crit:[70,20], cdmg:[200,20], edm:[60,15], hp:[0,0],   def:[0,0],  heal:[0,0],  spd:[0,0]},
  support:  {atk:[60,10],  crit:[30,5],  cdmg:[0,0],    edm:[0,0],   hp:[80,20], def:[0,0],  heal:[0,0],  spd:[80,25]},
  medic:    {atk:[20,5],   crit:[0,0],   cdmg:[0,0],    edm:[0,0],   hp:[100,30],def:[40,15],heal:[60,30],spd:[30,10]},
  saboteur: {atk:[80,20],  crit:[30,10], cdmg:[0,0],    edm:[0,0],   hp:[0,0],   def:[20,5], heal:[0,0],  spd:[70,25]},
}

// Endgame stat targets keyed by character codename
const CHAR_STAT_TARGETS = {
  // Values = total bonus from ALL sources (computeStats set+weapon + userStats card mains+subs+hidden)
  // Calibrated to realistic endgame: ~2.5 sub rolls/card at tier 2, good main stat choices
  // ── SWEEPER / ASSASSIN ──
  'Joker':           {atk:[120,25], crit:[40,18], cdmg:[80,22], edm:[35,12], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Panther':         {atk:[110,20], crit:[40,18], cdmg:[65,15], edm:[50,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Skull':           {atk:[110,22], crit:[42,20], cdmg:[260,22], edm:[30,12], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Violet':          {atk:[110,22], crit:[45,22], cdmg:[85,22], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Fox':             {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[40,18], hp:[80,18], def:[160,25],heal:[0,0],  spd:[0,0]},
  'Queen':           {atk:[110,25], crit:[38,15], cdmg:[0,0],   edm:[55,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Crow':            {atk:[110,22], crit:[42,20], cdmg:[90,22], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Howler':          {atk:[110,20], crit:[40,18], cdmg:[65,15], edm:[50,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'J&C':             {atk:[110,22], crit:[38,18], cdmg:[85,22], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Noir':            {atk:[110,22], crit:[38,18], cdmg:[80,22], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Messa':           {atk:[100,22], crit:[35,18], cdmg:[0,0],   edm:[50,20], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'makoto':          {atk:[110,22], crit:[42,20], cdmg:[80,22], edm:[35,12], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'closer-tropical': {atk:[70,15],  crit:[25,12], cdmg:[0,0],   edm:[0,0],   hp:[110,25],def:[0,0],   heal:[0,0],  spd:[0,0]},
  'rin-firecracker': {atk:[110,20], crit:[40,18], cdmg:[65,15], edm:[50,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'KEY':             {atk:[50,12],  crit:[0,0],   cdmg:[0,0],   edm:[55,20], hp:[110,25],def:[0,0],   heal:[0,0],  spd:[0,0]},
  'mont-frostgale':  {atk:[110,22], crit:[42,20], cdmg:[260,22], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Bui':             {atk:[100,22], crit:[45,25], cdmg:[75,22], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Closer':          {atk:[85,22],  crit:[32,15], cdmg:[0,0],   edm:[45,15], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Mont':            {atk:[85,22],  crit:[38,18], cdmg:[70,20], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Sepia':           {atk:[80,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[30,18]},
  'Fleuret':         {atk:[85,22],  crit:[38,18], cdmg:[75,20], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  // ── ELUCIDATOR ──
  'Oracle':          {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Wind':            {atk:[75,18],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Ange':            {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Phoebe':          {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Okyann':          {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[28,20]},
  'Puppet':          {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[100,22],def:[85,25], heal:[0,0],  spd:[28,15]},
  // ── STRATEGIST ──
  'Chord':           {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'wind-tempest':    {atk:[0,0],    crit:[42,20], cdmg:[80,25], edm:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[28,18]},
  'Turbo':           {atk:[65,15],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[155,25]},
  'Riddle':          {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[32,22]},
  'Luce':            {atk:[65,18],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[55,12], def:[0,0],   heal:[0,0],  spd:[28,20]},
  // ── SABOTEUR ──
  'Rin':             {atk:[85,20],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[0,0],   def:[45,15], heal:[0,0],  spd:[155,25]},
  'Matoi':           {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[100,25],def:[75,20], heal:[0,0],  spd:[28,20]},
  'Vino':            {atk:[65,18],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[55,12], def:[0,0],   heal:[0,0],  spd:[28,20]},
  'Key':             {atk:[65,20],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[0,0],   def:[38,12], heal:[0,0],  spd:[28,20]},
  // ── MEDIC ──
  'Marian':          {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[110,28],def:[55,15], heal:[47,25],spd:[0,0]},
  'Moko':            {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[24,22],spd:[0,0]},
  'moko-seaside':    {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[75,15], def:[0,0],   heal:[24,22],spd:[0,0]},
  'Mona':            {atk:[85,22],  crit:[32,12], cdmg:[0,0],   edm:[0,0],   hp:[70,15], def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Cattle':          {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[100,25],def:[45,15], heal:[26,25],spd:[0,0]},
  // ── GUARDIAN ──
  'Cherish':         {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[110,25],def:[140,20],heal:[23,15],spd:[0,0]},
  'Leon':            {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[85,18], def:[45,15], heal:[0,0],  spd:[0,0]},
  'Soy':             {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[100,25],def:[65,18], heal:[23,18],spd:[0,0]},
  'Yuki':            {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   edm:[0,0],   hp:[85,20], def:[95,25], heal:[0,0],  spd:[28,15]},
}

// Maps a Space card's passive name → which stats it benefits and by how much
const PASSIVE_STAT_MAP = {
  'Power':          {atk:15},
  'Ruin':           {atk:10, edm:8},
  'Tenacity':       {atk:8},
  'Courage':        {cdmg:15, edm:10},
  'Triumph':        {crit:15},
  'Love':           {heal:15},
  'Reconciliation': {spd:10},
  'Oppression':     {atk:10, edm:10},
  'Pleasure':       {edm:12},
  'Strife':         {edm:12, atk:8},
  'Renewal':        {edm:12},
  'Opulence':       {edm:12},
  'Victory':        {edm:10},
  'Truth':          {edm:10},
  'Hindrance':      {edm:8},
  'Virtue':         {crit:10, edm:8},
  'Control':        {def:8,   hp:5},
  'Labor':          {hp:8,    atk:5, def:5},
  'Peace':          {def:12},
  'Futility':       {},
  'Prosperity':     {},
  'Disappointment': {},
  'Transformation': {},
  'Prudence':       {atk:8},
  'Defeat':         {edm:8},
  'Worry':          {},
}

// Sub stat label → internal stat key (null = not tracked in score yet)
const SUB_STAT_KEY = {
  'CRIT Rate%':   'crit',
  'CRIT DMG%':    'cdmg',
  'ATK%':         'atk',
  'ATK':          'atk',
  'HP%':          'hp',
  'HP':           'hp',
  'DEF%':         'def',
  'DEF':          'def',
  'Elem DMG%':    'edm',
  'Ailment Acc%': 'ailm',
  'Pierce Rate%': 'pierce',
  'SP Recovery%': 'spr',
  'Speed':        'spd',
}

function scoreSpaceCard(card, charTargets, charCards) {
  if (!charTargets) return 0
  let score = 0
  const usedSets = (charCards || []).map(cs => {
    const m = cs.match(/^(.+?)\s+(2|4)pc$/i)
    return m ? m[1].trim() : null
  }).filter(Boolean)
  card.passives.forEach(p => {
    const weights = PASSIVE_STAT_MAP[p.name] || {}
    Object.entries(weights).forEach(([k, w]) => {
      const target = charTargets[k]
      if (target && target[1] > 0) score += (target[1] / 25) * w
    })
    if (usedSets.includes(p.name)) score += 8
  })
  return score
}

function getSubStatPriority(charTargets, slotId) {
  const pool = CARD_SUB_STATS[slotId] || CARD_SUB_STATS._other
  return Object.entries(pool)
    .map(([label, tiers]) => {
      const key = SUB_STAT_KEY[label]
      const weight = key && charTargets?.[key] ? charTargets[key][1] : 0
      return { label, key, weight, best: tiers[0] }
    })
    .filter(s => s.weight > 0)
    .sort((a, b) => b.weight - a.weight)
}

function getRoleArchetype(role) {
  if (role === 'Saboteur') return 'saboteur'
  if (role === 'Medic') return 'medic'
  if (role === 'Sweeper' || role === 'Assassin') return 'dps'
  return 'support'
}

const statMap = {'ATK%':'atk','CRIT Rate%':'crit','CRIT DMG%':'cdmg','HP%':'hp','DEF%':'def','Healing Bonus%':'heal','SPD':'spd'}
const statLabels = {atk:'ATK%',crit:'CRIT Rate%',cdmg:'CRIT DMG%',edm:'Elem DMG%',hp:'HP%',def:'DEF%',heal:'Healing%',spd:'SPD'}

function parseHiddenAbility(str) {
  if (!str) return {}
  const s = {}
  const n = (re) => { const m = str.match(re); return m ? parseFloat(m[1]) : 0 }
  const atk  = n(/ATK%?\s*\+(\d+\.?\d*)/)
  const crit  = n(/CRIT\s*Rate\s*\+(\d+\.?\d*)/i)
  const cdmg  = n(/CRIT\s*(?:DMG|Multiplier)\s*\+(\d+\.?\d*)/i)
  const hp    = n(/HP%\s*\+(\d+\.?\d*)/)
  const def   = n(/DEF%\s*\+(\d+\.?\d*)/)
  const heal  = n(/Healing\s*Effect\s*\+(\d+\.?\d*)/i)
  const spd   = n(/SPD?\s*\+(\d+\.?\d*)/)
  if (atk)  s.atk  = atk
  if (crit) s.crit = crit
  if (cdmg) s.cdmg = cdmg
  if (hp)   s.hp   = hp
  if (def)  s.def  = def
  if (heal) s.heal = heal
  if (spd)  s.spd  = spd
  return s
}

function parseWeaponBonusAtRefine(weapon, refine) {
  if (!weapon?.bonusStats) return {}
  if (!weapon.ability || refine === 0) return weapon.bonusStats
  const result = {}
  const lines = Array.isArray(weapon.ability) ? weapon.ability : [weapon.ability]
  for (const [k, base] of Object.entries(weapon.bonusStats)) {
    let scaled = base
    for (const line of lines) {
      if (scaled !== base) break
      const clean = line.replace(/%/g, '')
      for (const m of clean.matchAll(/(\d+\.?\d*)(\/\d+\.?\d*){4,}/g)) {
        const vals = m[0].split('/').map(parseFloat)
        if (vals.length >= 5 && Math.abs(vals[0] - base) < 2) {
          scaled = vals[Math.min(refine, vals.length - 1)]
          break
        }
      }
    }
    result[k] = scaled
  }
  return result
}

function computeStats(char, weaponIdx, refine = 0) {
  const s = {atk:0, crit:0, cdmg:0, hp:0, def:0, edm:0, heal:0, spd:0}
  if (!char) return s
  char.cards.forEach(cardStr => {
    const m = cardStr.match(/^(.+?)\s+(2|4)pc$/i)
    if (!m) return
    const setName = m[1].trim()
    const pc = parseInt(m[2])
    const setData = CARD_SETS.find(cs => cs.name.toLowerCase() === setName.toLowerCase())
    if (!setData) return
    if (setData.stats2) Object.entries(setData.stats2).forEach(([k,v]) => { s[k] = (s[k]||0)+v })
    if (pc >= 4 && setData.stats4) Object.entries(setData.stats4).forEach(([k,v]) => { s[k] = (s[k]||0)+v })
  })
  const wIdx = weaponIdx ?? 0
  const weaponBonus = parseWeaponBonusAtRefine(char.weapons?.[wIdx], refine)
  Object.entries(weaponBonus).forEach(([k,v]) => { s[k] = (s[k]||0)+v })
  // Hidden ability (character-level passive stat bonus)
  const hidden = parseHiddenAbility(char.hiddenAbility)
  Object.entries(hidden).forEach(([k,v]) => { s[k] = (s[k]||0)+v })
  return s
}

export default function P5XPage() {
  const [filter, setFilter] = useState('all')
  const [elemFilter, setElemFilter] = useState('all')
  const [charName, setCharName] = useState('')
  const [legendOpen, setLegendOpen] = useState(false)
  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(null)
  const [weaponRefine, setWeaponRefine] = useState(6)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copyOk, setCopyOk] = useState(false)
  const [charTab, setCharTab] = useState('build')
  const [ascension, setAscension] = useState(6)
  const [lang, setLang] = useState('th')
  const [dmg, setDmg] = useState({
    extraAtk:0, atkConst:0, extraCritRate:0, extraCritDmg:0,
    dmgMult:0, extraEdm:0, dmgTaken:0,
    enemyDef:363.2, addDefCoeff:158.4, pierce:0, defReduction:0, windswept:false,
    skillCoeff:100, weakness:'normal', finalDmgBonus:0, otherCoeff:100,
  })
  const [mobileTab, setMobileTab] = useState('chars')
  const [userStats, setUserStats] = useState({atk:0, crit:0, cdmg:0, edm:0, hp:0, def:0, heal:0, spd:0})
  const [skillLevel, setSkillLevel] = useState(3)
  useEffect(() => { if (charName) setMobileTab('detail') }, [charName])
  useEffect(() => { setUserStats({atk:0, crit:0, cdmg:0, edm:0, hp:0, def:0, heal:0, spd:0}) }, [charName])

  const currentChar = CHARACTERS.find(c => c.name === charName) || null
  const currentEc = currentChar ? (ELEM_COLORS[currentChar.element] || '#888') : 'var(--persona)'
  const stats = computeStats(currentChar, selectedWeaponIdx, weaponRefine)
  const totalStats = Object.fromEntries(
    Object.keys(stats).map(k => [k, (stats[k]||0) + (userStats[k]||0)])
  )
  const effHp = ((1 + totalStats.hp / 100) * (1 + totalStats.def / 100) * 100 - 100).toFixed(1)

  const lv80arr = currentChar?.baseStatsLv80
  const lv80all = lv80arr ? (Array.isArray(lv80arr) ? lv80arr : [lv80arr]) : null
  const lv80 = lv80all ? lv80all[Math.min(ascension, lv80all.length - 1)] : null
  const selWeapon = currentChar?.weapons?.[selectedWeaponIdx ?? 0]
  const wAtk = selWeapon?.atk || 0
  const wHp  = selWeapon?.hp  || 0
  const wDef = selWeapon?.def || 0
  const finalAtk = lv80 ? Math.round((lv80.atk + wAtk) * (1 + totalStats.atk / 100)) : null
  const finalHp  = lv80 ? Math.round((lv80.hp  + wHp)  * (1 + totalStats.hp  / 100)) : null
  const finalDef = lv80 ? Math.round((lv80.def + wDef)  * (1 + totalStats.def / 100)) : null

  const filtered = CHARACTERS.filter(c =>
    (filter === 'all' || c.role === filter) &&
    (elemFilter === 'all' || c.element === elemFilter || c.element2 === elemFilter)
  )

  const grouped5rainbow = filtered.filter(c => c.rarity === 5 && RAINBOW_CHARS.has(c.codename))
  const grouped5gold    = filtered.filter(c => c.rarity === 5 && !RAINBOW_CHARS.has(c.codename))
  const grouped4 = filtered.filter(c => c.rarity === 4)
  const grouped3 = filtered.filter(c => c.rarity <= 3)

  // Skill level labels: [LV10, LV10+Minds.5, LV13, LV13+Minds.5]
  const SKILL_LEVEL_LABELS = ['LV10', 'LV10+M5', 'LV13', 'LV13+M5']
  function resolveSkillLevel(text) {
    if (!text) return text
    return text.replace(/(\d+\.?\d*%?)(?:\/(\d+\.?\d*%?)){2,}/g, match => {
      const parts = match.split('/')
      return parts[Math.min(skillLevel, parts.length - 1)]
    })
  }

  function resolveRefine(text) {
    return text.replace(/([\d.]+%?)(?:\/([\d.]+%?)){6}/g, match => {
      const parts = match.split('/')
      return parts[weaponRefine] ?? match
    })
  }

  function setDmgField(key, val) {
    setDmg(prev => ({ ...prev, [key]: key === 'windswept' ? Boolean(val) : (Number(val) || 0) }))
  }
  function pickBossPreset(idx) {
    const b = BOSS_PRESETS[idx]
    if (b.def !== null) setDmg(prev => ({ ...prev, enemyDef: b.def, addDefCoeff: b.addDef }))
  }

  // Damage calc
  const dmgCharAtk   = lv80?.atk ?? 0
  const dmgWeaponAtk = currentChar?.weapons?.[selectedWeaponIdx ?? 0]?.atk ?? 0
  const totalAtkPct  = stats.atk + dmg.extraAtk
  const totalCritR   = Math.min((5 + stats.crit + dmg.extraCritRate) / 100, 1)
  const totalCritD   = (150 + stats.cdmg + dmg.extraCritDmg) / 100
  const dmgA = (dmgCharAtk + dmgWeaponAtk) * (1 + totalAtkPct / 100) + dmg.atkConst
  const dmgB = 1 + dmg.dmgMult / 100 + (stats.edm + dmg.extraEdm) / 100 + dmg.dmgTaken / 100
  const rawDefCoeff = (1 + dmg.addDefCoeff / 100) * (1 - dmg.pierce / 100) - dmg.defReduction / 100
  const defCoeff = Math.max(rawDefCoeff, 0)
  const windFactor = dmg.windswept ? 0.88 : 1
  const defNum = dmg.enemyDef * defCoeff * windFactor
  const dmgC = defNum > 0 ? 1 - defNum / (defNum + 1400) : 1
  const dmgD = 1 + totalCritR * (totalCritD - 1)
  const dmgE = dmg.skillCoeff / 100
  const dmgF = { res: 0.5, normal: 1.0, weak: 1.2 }[dmg.weakness]
  const dmgG = 1 + dmg.finalDmgBonus / 100
  const dmgH = dmg.otherCoeff / 100
  const dmgBase = dmgA * dmgB * dmgC * dmgD * dmgE * dmgF * dmgG * dmgH
  const dmgMin = Math.round(dmgBase * 0.95)
  const dmgMax = Math.round(dmgBase * 1.05)


  // Build score
  let scoreData = null
  if (currentChar) {
    const arch = getRoleArchetype(currentChar.role)
    const charTargets = CHAR_STAT_TARGETS[currentChar.codename]
    const targets = charTargets || STAT_TARGETS[arch]
    const prioKeys = charTargets ? [] : currentChar.statPrio.map(p => {
      if (p.includes('DMG%') && !p.includes('CRIT')) return 'edm'
      return statMap[p] || null
    }).filter(Boolean)

    let totalWeight = 0, earnedScore = 0
    const breakdown = []
    const statKeys = ['atk','crit','cdmg','edm','hp','def','heal','spd']
    statKeys.forEach(key => {
      let [ideal, weight] = targets[key]
      if (weight === 0) return
      if (prioKeys.includes(key)) weight = Math.round(weight * 1.4)
      totalWeight += weight
      const val = (stats[key] || 0) + (userStats[key] || 0)
      const ratio = ideal > 0 ? Math.min(val / ideal, 1.0) : 0
      earnedScore += ratio * weight
      breakdown.push({ label: statLabels[key], val: key==='spd'?Math.round(val):val.toFixed(1)+'%', ratio, ideal: key==='spd'?Math.round(ideal):ideal+'%' })
    })
    const scorePct = totalWeight > 0 ? Math.round(earnedScore / totalWeight * 100) : 0
    let grade, gradeColor
    if (scorePct >= 90) { grade='S+'; gradeColor='#e0aaff' }
    else if (scorePct >= 80) { grade='S'; gradeColor='var(--persona)' }
    else if (scorePct >= 65) { grade='A'; gradeColor='var(--green)' }
    else if (scorePct >= 50) { grade='B'; gradeColor='var(--blue)' }
    else if (scorePct >= 35) { grade='C'; gradeColor='var(--orange)' }
    else if (scorePct >= 20) { grade='D'; gradeColor='var(--p5x-muted)' }
    else { grade='F'; gradeColor='var(--red)' }
    const gradeNotes = {'S+':'Build สมบูรณ์แบบ!','S':'ยอดเยี่ยม ใกล้ Optimal มาก','A':'ดีมาก มีที่ปรับปรุงเล็กน้อย','B':'พอใช้ได้ ควรเสริม stats หลัก','C':'ปานกลาง stats ยังขาดอีกมาก','D':'ต้องปรับปรุงเยอะ','F':'Stats ยังไม่ตรง role เลย'}
    scoreData = { scorePct, grade, gradeColor, gradeNote: gradeNotes[grade], breakdown }
  }

  const exportJson = JSON.stringify({ version:1, character: charName||null, stats }, null, 2)

  function copyExport() {
    navigator.clipboard.writeText(exportJson).catch(() => {})
    setCopyOk(true)
    setTimeout(() => setCopyOk(false), 2500)
  }

  function doImport() {
    try {
      const d = JSON.parse(importText)
      if (d.character) setCharName(d.character)
      setShowImport(false)
      setImportError('')
    } catch (e) {
      setImportError('❌ JSON ไม่ถูกต้อง: ' + e.message)
    }
  }

  function CharCard({ c }) {
    const ec  = ELEM_COLORS[c.element]  || '#888'
    const ec2 = c.element2 ? (ELEM_COLORS[c.element2] || '#888') : null
    const isActive = charName === c.name
    const isRainbow = RAINBOW_CHARS.has(c.codename)
    const starColor = c.rarity === 4 ? '#ccaa22' : c.rarity <= 3 ? '#aa8811' : '#ffcc44'
    const avatarBg = ec2
      ? `linear-gradient(to right, ${ec}55 0%, ${ec}44 46%, ${ec2}44 54%, ${ec2}55 100%)`
      : `radial-gradient(circle at 50% 38%, ${ec}44, #0a0818)`
    const avatarShadow = ec2
      ? `0 0 10px ${ec}55, 0 0 10px ${ec2}55`
      : `0 0 10px ${ec}66, 0 0 20px ${ec}22`
    return (
      <div className={'char-card' + (isActive ? ' selected' : '')}
        onClick={() => { setCharName(isActive ? '' : c.name); setSelectedWeaponIdx(null) }}>
        <div className="char-avatar-wrap">
          {ELEM_IMG[c.element] && (
            <div className={`char-elem-badge${c.element2 ? ' has-elem2' : ''}`}>
              <img src={ELEM_IMG[c.element]} alt={c.element}
                style={{ filter: `drop-shadow(0 0 2px ${ec})` }} />
            </div>
          )}
          {c.element2 && ELEM_IMG[c.element2] && (
            <div className="char-elem-badge2">
              <img src={ELEM_IMG[c.element2]} alt={c.element2}
                style={{ filter: `drop-shadow(0 0 2px ${ELEM_COLORS[c.element2] || '#888'})` }} />
            </div>
          )}
          <div className="char-avatar" style={{ background: avatarBg, borderColor: ec, boxShadow: avatarShadow }}>
            {PORTRAITS[c.name]
              ? <img src={PORTRAITS[c.name]} alt={c.codename} className="portrait"
                  style={{ filter: 'brightness(1.1) contrast(1.05)', transform: 'scale(0.9)' }}
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
              : null}
            <span style={{ color: ec, fontWeight:700, display: PORTRAITS[c.name] ? 'none' : 'flex' }}>
              {c.codename.slice(0,3)}
            </span>
          </div>
          {ROLE_IMG[c.role] && (
            <div className="char-role-badge">
              <img src={ROLE_IMG[c.role]} alt={c.role} />
            </div>
          )}
        </div>
        <div className="char-card-name">{c.codename}</div>
        {isRainbow
          ? <div className="char-card-stars stars-rainbow">★★★★★</div>
          : <div className="char-card-stars" style={{ color: starColor }}>{'★'.repeat(c.rarity)}</div>
        }
      </div>
    )
  }

  function StatRow({ label, statKey, maxRange, unit = '%' }) {
    const base = stats[statKey] || 0
    const extra = userStats[statKey] || 0
    const total = base + extra
    const pct = Math.min(total / maxRange, 1) * 100
    const basePct = Math.min(base / maxRange, 1) * 100
    const step = unit === '' ? 1 : 0.1
    return (
      <div className="p5x-stat-row">
        <label className="sr-label">{label}</label>
        <div className="sr-controls">
          {base > 0 && <span className="sr-base">+{unit===''?Math.round(base):base.toFixed(1)}{unit} set</span>}
          <input type="number" min={0} max={maxRange} step={step}
            className="sr-input"
            value={extra === 0 ? '' : extra}
            onChange={e => setUserStats(p => ({...p, [statKey]: parseFloat(e.target.value)||0}))}
            placeholder="0" />
          <span className="sr-total">{unit===''?Math.round(total):total.toFixed(1)}{unit}</span>
        </div>
        <div className="stat-bar-track">
          <div className="stat-bar-base" style={{ width: basePct + '%' }} />
          <div className="stat-bar-fill" style={{ width: pct + '%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="p5x-page">
      <header className="p5x-header">
        <h1>🃏 P5X Build Optimizer</h1>
        <p>Persona 5: The Phantom X — Character Build Reference &amp; Stat Calculator</p>
        <div className="edit-note">✏️ แก้ไข CHARACTERS และ CARD_SETS ใน P5XPage.jsx เพื่ออัพเดตข้อมูล</div>
      </header>

      <div className="p5x-mobile-tabs">
        <button className={'pmtab'+(mobileTab==='chars'?' active':'')} onClick={()=>setMobileTab('chars')}>
          🎭 Characters
        </button>
        <button className={'pmtab'+(mobileTab==='detail'?' active':'')} onClick={()=>setMobileTab('detail')}>
          📋 {currentChar ? currentChar.codename : 'Detail'}
        </button>
      </div>

      <div className="p5x-container">
        {/* LEFT: filters + char grid */}
        <div className={'p5x-left'+(mobileTab!=='chars'?' pmhide':'')}>
        <div className="section-box">
          <div className="section-title">📖 BUILD REFERENCE</div>

          <div className="filter-group-label">Role</div>
          <div className="filter-row">
            {['all','Sweeper','Assassin','Strategist','Saboteur','Guardian','Medic','Elucidator','Virtuoso'].map(f => (
              <button key={f} className={'filter-btn' + (filter===f?' active':'')} onClick={() => { setFilter(f); setCharName('') }}>
                {f === 'all' ? 'All' : (
                  <>
                    {ROLE_IMG[f] && <img src={ROLE_IMG[f]} alt={f} className="filter-role-icon" />}
                    {f}
                  </>
                )}
              </button>
            ))}
          </div>
          <div className="filter-group-label" style={{ marginTop: 8 }}>Element</div>
          <div className="filter-row">
            {['all','Fire','Ice','Electric','Wind','Nuclear','Curse','Bless','Physical','Almighty','Psychokinesis','-'].map(e => {
              const ec = ELEM_COLORS[e] || '#888'
              const isActive = elemFilter === e
              const label = {Fire:'Fire',Ice:'Ice',Electric:'Elec',Wind:'Wind',Nuclear:'Nuclear',Curse:'Curse',Bless:'Bless',Physical:'Phys',Almighty:'Almighty',Psychokinesis:'Psy','-':'None'}[e] || e
              return (
                <button key={e}
                  className={'filter-btn' + (isActive ? ' active' : '')}
                  style={isActive && e !== 'all'
                    ? { borderColor: ec, color: ec, background: ec + '22', boxShadow: `0 0 10px ${ec}55` }
                    : e !== 'all' ? { borderColor: ec + '66', color: ec + 'cc' } : {}}
                  onClick={() => { setElemFilter(e); setCharName('') }}>
                  {e === 'all' ? 'All' : (
                    <>
                      <img src={ELEM_IMG[e]} alt={e} className="filter-role-icon"
                        style={{ filter: isActive ? `drop-shadow(0 0 3px ${ec})` : `drop-shadow(0 0 1px ${ec}88)` }} />
                      {label}
                    </>
                  )}
                </button>
              )
            })}
          </div>

          <div className="char-grid-wrap">
            {grouped5rainbow.length > 0 && <div className="char-grid-label label-rainbow">★★★★★ 5-Star</div>}
            <div className="char-grid">
              {grouped5rainbow.map(c => <CharCard key={c.name} c={c} />)}
            </div>
            {grouped5gold.length > 0 && <div className="char-grid-label" style={{ marginTop:8, color:'#ffcc44' }}>★★★★★ 5-Star</div>}
            <div className="char-grid">
              {grouped5gold.map(c => <CharCard key={c.name} c={c} />)}
            </div>
            {grouped4.length > 0 && <div className="char-grid-label" style={{ marginTop:8 }}>⭐⭐⭐⭐ 4-Star</div>}
            <div className="char-grid">
              {grouped4.map(c => <CharCard key={c.name} c={c} />)}
            </div>
            {grouped3.length > 0 && <div className="char-grid-label" style={{ marginTop:8 }}>⭐⭐⭐ 3-Star</div>}
            <div className="char-grid">
              {grouped3.map(c => <CharCard key={c.name} c={c} />)}
            </div>
          </div>
        </div>{/* /section-box */}
        </div>{/* /p5x-left */}

        {/* RIGHT: sticky detail + stat calc */}
        <div className={'p5x-right'+(mobileTab!=='detail'?' pmhide':'')}>
        <div className="char-detail-sticky">
          {currentChar ? (
            <div className="char-info">
              <div className="char-header" style={{ borderColor: currentEc, background: `linear-gradient(135deg,${currentEc}18,#0d0d0d)`, boxShadow: `0 0 20px ${currentEc}22` }}>
                <div className="char-header-portrait" style={{ borderColor: currentEc, background: `${currentEc}11` }}>
                  {PORTRAITS[currentChar.name]
                    ? <img src={PORTRAITS[currentChar.name]} alt={currentChar.codename} onError={e => e.target.style.display='none'} />
                    : <span>{ROLE_ICONS[currentChar.role]||'❓'}</span>}
                </div>
                <div className="char-title">
                  <div className="char-name">{currentChar.realName || currentChar.name}</div>
                  <div className="char-codename" style={{ color: currentEc }}>{currentChar.realName ? currentChar.name : currentChar.codename}</div>
                  <div className="char-badges">
                    {RAINBOW_CHARS.has(currentChar.codename)
                      ? <span className="cbadge stars-rainbow">{'★'.repeat(currentChar.rarity)} {currentChar.rarity}-Star</span>
                      : <span className={`cbadge rarity${currentChar.rarity}`}>{'★'.repeat(currentChar.rarity)} {currentChar.rarity}-Star</span>
                    }
                    <span className="cbadge role" style={{ borderColor: ROLE_COLORS[currentChar.role], color: ROLE_COLORS[currentChar.role] }}>{currentChar.role}</span>
                    <span className={`elem-${currentChar.element === '-' ? 'dash' : currentChar.element}`}>
                      {currentChar.element === '-' ? 'No Element' : currentChar.element}
                    </span>
                  </div>
                  {(currentChar.affiliation || currentChar.persona) && (
                    <div className="char-lore-row">
                      {currentChar.affiliation && <span className="char-affil">{currentChar.affiliation}</span>}
                      {currentChar.persona && <span className="char-persona-label">⚡ Persona: {currentChar.persona}</span>}
                    </div>
                  )}
                </div>
              </div>

              {currentChar.weakRes && (
                <div className="elem-affinity-bar">
                  {Object.entries(currentChar.weakRes).map(([elem, val]) => (
                    <div key={elem} className={`ea-cell ea-${val}`}>
                      <img src={ELEM_IMG[elem]} alt={elem} className="ea-icon"
                        style={{ filter: val === 'null' ? 'grayscale(0.5) opacity(0.6)' : `drop-shadow(0 0 2px ${ELEM_COLORS[elem]||'#888'})` }} />
                      {val !== 'normal' && (
                        <span className="ea-label">
                          {val === 'wk' ? 'Wk' : val === 'res' ? 'Res' : val === 'null' ? 'Null' : 'Abs'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="char-tab-bar">
                <button className={'char-tab-btn' + (charTab === 'build' ? ' active' : '')} onClick={() => setCharTab('build')}>🃏 Build</button>
                <button className={'char-tab-btn' + (charTab === 'kit'   ? ' active' : '')} onClick={() => setCharTab('kit')}>⚔️ Kit</button>
                <button className={'char-tab-btn' + (charTab === 'dmg'   ? ' active' : '')} onClick={() => setCharTab('dmg')}>💥 DMG</button>
                <div className="lang-toggle">
                  <button className={'lang-btn' + (lang === 'en' ? ' active' : '')} onClick={() => setLang('en')}>EN</button>
                  <button className={'lang-btn' + (lang === 'th' ? ' active' : '')} onClick={() => setLang('th')}>TH</button>
                </div>
              </div>

              {charTab === 'kit' && (
                <div className="kit-section">
                  {/* SKILLS */}
                  <div className="kit-block">
                    <div className="kit-block-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                      <span>Skills</span>
                      <div className="slv-picker">
                        {SKILL_LEVEL_LABELS.map((l, i) => (
                          <button key={i} className={'slv-btn'+(skillLevel===i?' active':'')} onClick={()=>setSkillLevel(i)} title={['Skill LV10','LV10 + Mindscape 5','Skill LV13','LV13 + Mindscape 5'][i]}>{l}</button>
                        ))}
                      </div>
                    </div>
                    {(currentChar.skills || []).length === 0
                      ? <div className="kit-empty">— ยังไม่มีข้อมูล</div>
                      : <div className="skill-grid">
                          {(currentChar.skills || []).map((sk, i) => {
                            const rawDesc = lang === 'th' && sk.descTh ? sk.descTh : sk.desc
                            const desc = resolveSkillLevel(rawDesc)
                            return (
                            <div key={i} className="skill-card">
                              <div className="skill-card-header">
                                <div className="skill-header-left">
                                  <span className={`skill-type ${sk.isBuff ? 'skill-type-support' : `skill-type-${sk.type.toLowerCase()}`}`}>
                                    {sk.isBuff ? 'SUPPORT' : sk.type}
                                  </span>
                                  {SKILL_TYPE_IMG[sk.type] && (
                                    <img src={SKILL_TYPE_IMG[sk.type]} alt={sk.type} className="skill-type-icon"
                                      onError={e => e.target.style.display='none'} />
                                  )}
                                  {sk.element && sk.element !== '-' && ELEM_IMG[sk.element] && (
                                    <img src={ELEM_IMG[sk.element]} alt={sk.element} className="skill-elem-icon"
                                      style={{ filter: `drop-shadow(0 0 2px ${ELEM_COLORS[sk.element]||'#888'})` }} />
                                  )}
                                  {sk.isBuff && <img src={import.meta.env.BASE_URL + 'p5x/elements/buff.webp'} alt="buff" className="skill-buff-icon" onError={e => e.target.style.display='none'} />}
                                </div>
                                <div className="skill-header-right">
                                  {sk.sp > 0 && <span className="skill-sp">SP {sk.sp}</span>}
                                </div>
                              </div>
                              <div className="skill-name">{sk.name}</div>
                              <div className="skill-desc">{desc}</div>
                            </div>
                            )
                          })}
                        </div>
                    }
                  </div>

                  {/* BASE STATS */}
                  <div className="kit-block">
                    <div className="kit-block-title">Base Stats</div>
                    {(!currentChar.baseStats && !currentChar.baseStatsLv80)
                      ? <div className="kit-empty">— ยังไม่มีข้อมูล</div>
                      : (() => {
                          const rows = Array.isArray(currentChar.baseStatsLv80) ? currentChar.baseStatsLv80 : currentChar.baseStatsLv80 ? [currentChar.baseStatsLv80] : []
                          return (
                            <div className="stats-table-wrap">
                              <table className="stats-table">
                                <thead>
                                  <tr>
                                    <th rowSpan={2}>Stat</th>
                                    <th rowSpan={2}>Base</th>
                                    {rows.length > 0 && <th colSpan={rows.length} className="stat-lv80-header">LV 80</th>}
                                  </tr>
                                  <tr>
                                    {rows.map((_, i) => <th key={i} className={i === rows.length-1 ? 'stat-lv80' : ''}>A{i}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[['HP','hp'],['ATK','atk'],['DEF','def'],['SPD','spd']].map(([label, key]) => (
                                    <tr key={key}>
                                      <td>{label}</td>
                                      <td>{currentChar.baseStats?.[key] ?? '—'}</td>
                                      {rows.map((r, i) => <td key={i} className={i === rows.length-1 ? 'stat-lv80' : ''}>{r[key] ?? '—'}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        })()
                    }
                  </div>

                  {/* HIDDEN ABILITY LV7 */}
                  <div className="kit-block">
                    <div className="kit-block-title">Hidden Ability <span className="ha-lv">LV 7</span></div>
                    {!currentChar.hiddenAbility
                      ? <div className="kit-empty">— ยังไม่มีข้อมูล</div>
                      : <div className="hidden-ability-box">{currentChar.hiddenAbility}</div>
                    }
                  </div>

                  {/* AWARENESS */}
                  <div className="kit-block">
                    <div className="kit-block-title">Awareness</div>
                    {(currentChar.awareness || []).length === 0
                      ? <div className="kit-empty">— ยังไม่มีข้อมูล</div>
                      : <div className="awareness-list">
                          {(currentChar.awareness || []).map((aw, i) => (
                            <div key={i} className="awareness-row">
                              <div className="aw-header">
                                <span className="aw-stage">{aw.stage ?? i}</span>
                                <span className="aw-name">{aw.name || aw.bonus || ''}</span>
                              </div>
                              {aw.desc && <div className="aw-desc">{resolveSkillLevel(lang === 'th' && aw.descTh ? aw.descTh : aw.desc)}</div>}
                            </div>
                          ))}
                        </div>
                    }
                  </div>

                  {/* ELEMENT AFFINITIES */}
                </div>
              )}

              {charTab === 'dmg' && (
                <div className="dmg-calc">

                  {/* Auto section */}
                  <div className="dmg-section">
                    <div className="dmg-section-title">⚔️ Attack Power (จาก Build)</div>
                    <div className="dmg-auto-grid">
                      <div className="dmg-auto-row"><span>Char ATK</span><span className="dmg-auto-val">{dmgCharAtk.toLocaleString()}</span></div>
                      <div className="dmg-auto-row"><span>Weapon ATK</span><span className="dmg-auto-val">{dmgWeaponAtk.toLocaleString()}</span></div>
                      <div className="dmg-auto-row"><span>ATK% (Build)</span><span className="dmg-auto-val">{stats.atk.toFixed(1)}%</span></div>
                      <div className="dmg-auto-row"><span>CRIT Rate (5+build)</span><span className="dmg-auto-val">{(5+stats.crit).toFixed(1)}%</span></div>
                      <div className="dmg-auto-row"><span>CRIT DMG (150+build)</span><span className="dmg-auto-val">{(150+stats.cdmg).toFixed(1)}%</span></div>
                      <div className="dmg-auto-row"><span>Elem DMG (Build)</span><span className="dmg-auto-val">{stats.edm.toFixed(1)}%</span></div>
                    </div>
                  </div>

                  {/* Battle buffs */}
                  <div className="dmg-section">
                    <div className="dmg-section-title">💥 Battle Buffs (เพิ่มเติมในสนาม)</div>
                    <div className="dmg-field-grid">
                      <div className="dmg-field"><label>Extra ATK%</label><input className="dmg-input" type="number" value={dmg.extraAtk} min="0" onChange={e=>setDmgField('extraAtk',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>ATK Constant</label><input className="dmg-input" type="number" value={dmg.atkConst} min="0" onChange={e=>setDmgField('atkConst',e.target.value)}/></div>
                      <div className="dmg-field"><label>Extra CRIT Rate%</label><input className="dmg-input" type="number" value={dmg.extraCritRate} min="0" onChange={e=>setDmgField('extraCritRate',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>Extra CRIT DMG%</label><input className="dmg-input" type="number" value={dmg.extraCritDmg} min="0" onChange={e=>setDmgField('extraCritDmg',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>DMG Mult%</label><input className="dmg-input" type="number" value={dmg.dmgMult} min="0" onChange={e=>setDmgField('dmgMult',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>Extra Elem DMG%</label><input className="dmg-input" type="number" value={dmg.extraEdm} min="0" onChange={e=>setDmgField('extraEdm',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>DMG Taken (Enemy)</label><input className="dmg-input" type="number" value={dmg.dmgTaken} min="0" onChange={e=>setDmgField('dmgTaken',e.target.value)}/><span className="dmg-unit">%</span></div>
                    </div>
                  </div>

                  {/* Skill */}
                  <div className="dmg-section">
                    <div className="dmg-section-title">🃏 Skill Setup</div>
                    <div className="dmg-field-grid">
                      <div className="dmg-field"><label>Skill Coefficient%</label><input className="dmg-input" type="number" value={dmg.skillCoeff} min="0" onChange={e=>setDmgField('skillCoeff',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field dmg-field-wide">
                        <label>Weakness</label>
                        <div className="dmg-weakness-btns">
                          {[['res','Res ×0.5'],['normal','Normal ×1.0'],['weak','Weak ×1.2']].map(([v,l])=>(
                            <button key={v} className={'dmg-weakness-btn dmg-wk-'+v+(dmg.weakness===v?' active':'')} onClick={()=>setDmg(p=>({...p,weakness:v}))}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div className="dmg-field"><label>Final DMG Bonus%</label><input className="dmg-input" type="number" value={dmg.finalDmgBonus} min="0" onChange={e=>setDmgField('finalDmgBonus',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>Other Coefficients%</label><input className="dmg-input" type="number" value={dmg.otherCoeff} min="1" onChange={e=>setDmgField('otherCoeff',e.target.value)}/><span className="dmg-unit">%</span></div>
                    </div>
                  </div>

                  {/* Enemy */}
                  <div className="dmg-section">
                    <div className="dmg-section-title">🛡️ Enemy Defense</div>
                    <div className="dmg-field-grid">
                      <div className="dmg-field dmg-field-wide">
                        <label>Boss Preset</label>
                        <select className="dmg-select" onChange={e=>pickBossPreset(Number(e.target.value))}>
                          {BOSS_PRESETS.map((b,i)=><option key={i} value={i}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="dmg-field"><label>Enemy DEF</label><input className="dmg-input" type="number" value={dmg.enemyDef} min="0" step="0.1" onChange={e=>setDmgField('enemyDef',e.target.value)}/></div>
                      <div className="dmg-field"><label>Add. DEF Coeff%</label><input className="dmg-input" type="number" value={dmg.addDefCoeff} min="0" step="0.1" onChange={e=>setDmgField('addDefCoeff',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>Pierce%</label><input className="dmg-input" type="number" value={dmg.pierce} min="0" max="100" onChange={e=>setDmgField('pierce',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field"><label>DEF Reduction%</label><input className="dmg-input" type="number" value={dmg.defReduction} min="0" onChange={e=>setDmgField('defReduction',e.target.value)}/><span className="dmg-unit">%</span></div>
                      <div className="dmg-field dmg-check-row">
                        <label>Windswept ×0.88</label>
                        <input type="checkbox" className="dmg-checkbox" checked={dmg.windswept} onChange={e=>setDmgField('windswept',e.target.checked)}/>
                      </div>
                    </div>
                  </div>

                  {/* Formula breakdown */}
                  <div className="dmg-section dmg-result-section">
                    <div className="dmg-section-title">📈 Result</div>
                    <div className="dmg-formula-rows">
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓐ ATK Power</span><span className="dmg-fr-val">{Math.round(dmgA).toLocaleString()}</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓑ DMG Bonus</span><span className="dmg-fr-val">×{dmgB.toFixed(3)}</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓒ DEF Factor</span><span className="dmg-fr-val">×{dmgC.toFixed(4)}</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓓ CRIT (Exp.)</span><span className="dmg-fr-val">×{dmgD.toFixed(3)} ({(totalCritR*100).toFixed(1)}% rate / {(totalCritD*100).toFixed(0)}% dmg)</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓔ Skill Coeff</span><span className="dmg-fr-val">×{dmgE.toFixed(2)}</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓕ Weakness</span><span className="dmg-fr-val">×{dmgF.toFixed(1)}</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓖ Final Bonus</span><span className="dmg-fr-val">×{dmgG.toFixed(2)}</span></div>
                      <div className="dmg-fr"><span className="dmg-fr-label">ⓗ Others</span><span className="dmg-fr-val">×{dmgH.toFixed(2)}</span></div>
                    </div>
                    <div className="dmg-output">
                      <div className="dmg-output-row">
                        <span className="dmg-label-min">MIN</span>
                        <span className="dmg-val-min">{dmgMin.toLocaleString()}</span>
                      </div>
                      <div className="dmg-output-sep">~</div>
                      <div className="dmg-output-row">
                        <span className="dmg-label-max">MAX</span>
                        <span className="dmg-val-max">{dmgMax.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="dmg-avg">AVG: {Math.round(dmgBase).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {charTab === 'build' && <div className="info-grid">
                <div className="info-panel">
                  <div className="info-label">🃏 Revelation Card Sets (แนะนำ)</div>
                  <span className="cs-toggle" onClick={() => setLegendOpen(v => !v)}>
                    📋 ดู Card Set Bonuses ทั้งหมด {legendOpen ? '▴' : '▾'}
                  </span>
                  {legendOpen && (
                    <div className="cs-legend open">
                      {CARD_SETS.map(cs => (
                        <div key={cs.name} className="csl-row">
                          <div className="csl-name">{cs.name}</div>
                          <div className="csl-bonuses">
                            <span style={{ color: 'var(--persona)' }}>2pc:</span> {cs.bonus2}
                            &nbsp;|&nbsp;
                            <span style={{ color: 'var(--persona3)' }}>4pc:</span> {cs.bonus4}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="card-set-row">
                    {currentChar.cards.map((cs, idx) => {
                      const match = cs.match(/^(.+?)\s+(2|4)pc$/i)
                      if (!match) return <div key={idx} className="card-set-item"><span className="cs-pc">?pc</span><div className="cs-name">{cs}</div></div>
                      const setName = match[1].trim()
                      const pc = match[2]
                      const setData = CARD_SETS.find(s => s.name.toLowerCase() === setName.toLowerCase())
                      return (
                        <div key={idx} className="card-set-item">
                          <span className="cs-pc">{pc}pc</span>
                          <div>
                            <div className="cs-name">{setName}</div>
                            {setData && pc === '4' ? (
                              <>
                                <div className="cs-bonus"><span style={{color:'var(--p5x-muted)',fontSize:11}}>2pc</span> {setData.bonus2}</div>
                                <div className="cs-bonus"><span style={{color:'var(--persona3)',fontSize:11}}>4pc</span> {setData.bonus4}</div>
                              </>
                            ) : (
                              <div className="cs-bonus">{setData ? setData.bonus2 : '?'}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="info-panel">
                  <div className="info-label">🎴 Revelation Card — Main Stats แนะนำ</div>
                  <div className="slot-guide">
                    {CARD_SLOTS.map(slot => {
                      const charTgt = CHAR_STAT_TARGETS[currentChar.codename]
                      let bestLabel = null, bestWeight = -1
                      slot.mainStats.forEach(({label, key}) => {
                        if (!key || !charTgt) return
                        const w = (charTgt[key] || [0,0])[1]
                        if (w > bestWeight) { bestWeight = w; bestLabel = label }
                      })
                      return (
                        <div key={slot.id} className="slot-row">
                          <span className="slot-name">{slot.id}</span>
                          <div className="slot-options">
                            {bestLabel
                              ? slot.mainStats.filter(({label}) => label === bestLabel).map(({label, max, unit}) => (
                                <span key={label} className="slot-opt slot-rec">
                                  {label} ★{max != null && <span className="slot-range">{max}{unit}</span>}
                                </span>
                              ))
                              : <span style={{color:'var(--p5x-muted)',fontSize:13}}>-</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── SPACE CARD RECOMMENDER ────────────────────────────────── */}
                <div className="info-panel">
                  <div className="info-label">🃏 Space Card แนะนำ (จาก Passive)</div>
                  {(() => {
                    const charTgt = CHAR_STAT_TARGETS[currentChar.codename]
                    const ranked = REVELATION_CARDS.Space
                      .map(card => ({ card, score: scoreSpaceCard(card, charTgt, currentChar.cards) }))
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 3)
                    return (
                      <div className="rec-cards-list">
                        {ranked.map(({card, score}, ri) => {
                          const medals = ['🥇','🥈','🥉']
                          return (
                            <div key={card.name} className={'rec-card-item' + (ri === 0 ? ' rec-top' : '')}>
                              <div className="rec-card-header">
                                <span className="rec-medal">{medals[ri]}</span>
                                <span className="rec-card-name">{card.name}</span>
                                {score > 0 && <span className="rec-score">{score.toFixed(0)}pt</span>}
                              </div>
                              <div className="rec-passives">
                                {card.passives.map(p => {
                                  const pw = PASSIVE_STAT_MAP[p.name] || {}
                                  const usedSets = (currentChar.cards || []).map(cs => { const m = cs.match(/^(.+?)\s+(2|4)pc$/i); return m ? m[1].trim() : null }).filter(Boolean)
                                  const relevant = charTgt && (Object.keys(pw).some(k => charTgt[k]?.[1] > 0) || usedSets.includes(p.name))
                                  return (
                                    <span key={p.name} className={'rec-passive' + (relevant ? ' rec-passive-hit' : '')}>
                                      {p.name}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* ── SUB STAT PRIORITY ─────────────────────────────────────── */}
                <div className="info-panel">
                  <div className="info-label">📋 Sub Stat Priority (Space / Sun·Moon·Star·Sky)</div>
                  {(() => {
                    const charTgt = CHAR_STAT_TARGETS[currentChar.codename]
                    const spaceRanked = getSubStatPriority(charTgt, 'Space')
                    const otherRanked = getSubStatPriority(charTgt, 'Sun')
                    if (!spaceRanked.length && !otherRanked.length) return (
                      <div style={{color:'var(--p5x-muted)',fontSize:13}}>ไม่มีข้อมูล stat priority สำหรับตัวละครนี้</div>
                    )
                    return (
                      <div className="sub-prio-wrap">
                        {[{label:'Space (주)', items: spaceRanked}, {label:'Sun·Moon·Star·Sky', items: otherRanked}].map(({label, items}) => (
                          <div key={label} className="sub-prio-col">
                            <div className="sub-prio-title">{label}</div>
                            {items.length === 0
                              ? <div style={{color:'var(--p5x-muted)',fontSize:12}}>—</div>
                              : items.slice(0, 5).map((s, i) => (
                                <div key={s.label} className={'sub-prio-row' + (i === 0 ? ' sub-prio-top' : '')}>
                                  <span className="sub-prio-rank">#{i+1}</span>
                                  <span className="sub-prio-label">{s.label}</span>
                                  <span className="sub-prio-val">max {s.best}/roll</span>
                                </div>
                              ))
                            }
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* ── STAT REQUIREMENTS FROM CARDS ─────────────────────────── */}
                {(() => {
                  const charTgt = CHAR_STAT_TARGETS[currentChar.codename]
                  if (!charTgt) return null
                  const entries = Object.entries(charTgt).filter(([,[,w]]) => w > 0)
                  if (!entries.length) return null
                  const STAT_LABELS = {
                    atk:'ATK%', crit:'CRIT Rate%', cdmg:'CRIT DMG%',
                    edm:'Elem DMG%', hp:'HP%', def:'DEF%',
                    heal:'Healing%', spd:'Speed', spr:'SP Recovery%',
                    ailm:'Ailment Acc%', pierce:'Pierce Rate%'
                  }
                  const selW = currentChar.weapons?.[selectedWeaponIdx ?? 0]
                  const base0 = computeStats(currentChar, selectedWeaponIdx ?? 0, 0)
                  const base6 = computeStats(currentChar, selectedWeaponIdx ?? 0, 6)
                  const lv80all2 = Array.isArray(currentChar.baseStatsLv80)
                    ? currentChar.baseStatsLv80
                    : currentChar.baseStatsLv80 ? [currentChar.baseStatsLv80] : []
                  const lv80_A0 = lv80all2[0]
                  const lv80_A6 = lv80all2[lv80all2.length - 1]
                  const scalesDiff = entries.some(([k]) => {
                    const b0 = base0[k] || 0; const b6 = base6[k] || 0
                    return Math.abs(b6 - b0) >= 1
                  })
                  return (
                    <div className="info-panel">
                      <div className="info-label">📊 Card Requirements (need from cards)</div>
                      <div className="req-table">
                        <div className="req-row req-hdr">
                          <span>Stat</span>
                          <span>Target</span>
                          <span>Base</span>
                          <span>Need 0★</span>
                          {scalesDiff && <span>Need 6★</span>}
                        </div>
                        {entries.map(([k,[ideal]]) => {
                          const b0 = base0[k] || 0
                          const b6 = base6[k] || 0
                          const need0 = Math.max(0, ideal - b0)
                          const need6 = Math.max(0, ideal - b6)
                          const isFlat = ['atk','hp','def'].includes(k)
                          const fmt = v => k === 'spd' ? Math.round(v) : v.toFixed(0) + '%'
                          // Per-ascension note for ATK/HP/DEF
                          let a6Tgt = null
                          if (isFlat && lv80_A0 && lv80_A6 && lv80_A0[k] !== lv80_A6[k]) {
                            const wFlat = k==='atk'?(selW?.atk||0):k==='hp'?(selW?.hp||0):(selW?.def||0)
                            const idealFinal = (lv80_A0[k] + wFlat) * (1 + ideal / 100)
                            const pctA6 = Math.max(0, (idealFinal / (lv80_A6[k] + wFlat) - 1) * 100)
                            if (ideal - pctA6 > 3) a6Tgt = pctA6.toFixed(0) + '%'
                          }
                          const cls0 = need0===0?'req-met':need0<30?'req-close':'req-far'
                          const cls6 = need6===0?'req-met':need6<30?'req-close':'req-far'
                          return (
                            <div key={k} className="req-row">
                              <span className="req-c-stat">{STAT_LABELS[k]||k}</span>
                              <span className="req-c-tgt">
                                {fmt(ideal)}
                                {a6Tgt && <span className="req-a6-tgt">A6:{a6Tgt}</span>}
                              </span>
                              <span className="req-c-base">{fmt(b0)}</span>
                              <span className={`req-c-need ${cls0}`}>{fmt(need0)}</span>
                              {scalesDiff && <span className={`req-c-need ${cls6}`}>{fmt(need6)}</span>}
                            </div>
                          )
                        })}
                      </div>
                      <div className="req-note">Base = set bonuses + hidden ability. Need = target − base. 0★/6★ = weapon refine scaling.</div>
                    </div>
                  )
                })()}

                <div className="info-panel">
                  <div className="info-label" style={{display:'flex',alignItems:'center',gap:8}}>
                    <span>⚔️ Recommended Weapon</span>
                    <div className="refine-picker">
                      {[0,1,2,3,4,5,6].map(r => (
                        <button key={r} className={'refine-btn'+(weaponRefine===r?' active':'')} onClick={()=>setWeaponRefine(r)}>{r}★</button>
                      ))}
                    </div>
                  </div>
                  {currentChar.weapons ? (
                    <div className="weapon-list">
                      {currentChar.weapons.map((w, wi) => {
                        const isWSelected = (selectedWeaponIdx ?? 0) === wi
                        return (
                        <div key={wi} className={`weapon-card rarity${w.stars ?? w.rarity}${isWSelected ? ' weapon-selected' : ''}`}
                          onClick={() => setSelectedWeaponIdx(wi)}
                          style={{ cursor:'pointer' }}>
                          <div className="weapon-card-top">
                            <img src={import.meta.env.BASE_URL + w.img} alt={w.name} className="weapon-img" onError={e => e.target.style.display='none'} />
                            <div className="weapon-card-info">
                              <div className="weapon-name">{w.name}</div>
                              <div className={`weapon-stars rarity${w.stars ?? w.rarity}-star`}>{'★'.repeat(w.stars ?? w.rarity)}</div>
                              <div className="weapon-stats-row">
                                <span className="wstat"><span className="wstat-label">HP</span>{w.hp}</span>
                                <span className="wstat"><span className="wstat-label">ATK</span>{w.atk}</span>
                                <span className="wstat"><span className="wstat-label">DEF</span>{w.def}</span>
                              </div>
                            </div>
                          </div>
                          <div className="weapon-ability-name">{w.abilityName}</div>
                          {(lang === 'th' && w.abilityTh ? w.abilityTh : Array.isArray(w.ability) ? w.ability : (w.ability||'').split('\n').filter(Boolean)).map((line, li) => (
                            <div key={li} className="weapon-ability-line">{resolveRefine(line)}</div>
                          ))}
                          {isWSelected && <div className="weapon-selected-badge">✓ Selected</div>}
                        </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="weapon-box">{currentChar.weapon}</div>
                  )}
                </div>

                <div className="info-panel">
                  <div className="info-label">📊 Stat Priority (สำคัญที่สุด → น้อยสุด)</div>
                  <div className="stat-prio-row">
                    {currentChar.statPrio.map((s, i) => (
                      <span key={i} className={'stat-chip' + (i === 0 ? ' top' : '')}>
                        {['①','②','③','④','⑤'][i] || i+1} {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="info-panel">
                  <div className="info-label">💡 Playstyle Note</div>
                  <div className="note-box">{currentChar.note}</div>
                </div>

                {currentChar.mechanics && (
                  <div className="info-panel">
                    <div className="info-label">⚙️ Core Mechanics</div>
                    <div className="note-box mech-text">{currentChar.mechanics}</div>
                  </div>
                )}

                {currentChar.rotation && currentChar.rotation.length > 0 && (
                  <div className="info-panel">
                    <div className="info-label">🔄 Skill Rotation</div>
                    <ol className="rotation-list">
                      {currentChar.rotation.map((step, i) => (
                        <li key={i} className="rotation-step">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>}
            </div>
          ) : (
            <div className="char-empty-state">
              <div className="char-empty-icon">🃏</div>
              <p>เลือกตัวละครจากแท็บ Characters</p>
            </div>
          )}

          {/* STAT CALCULATOR — inside sticky panel to prevent overlap */}
          <div style={{ borderTop: '1px solid var(--p5x-border)', marginTop: 12, paddingTop: 12 }}>
            <div className="section-title">🧮 STAT CALCULATOR</div>
            <div style={{fontSize:'0.62rem',color:'var(--p5x-muted)',marginBottom:8}}>
              ใส่ค่า stat เพิ่มจากการ์ด (main stat + sub roll) + hidden ability — ค่าจาก set/weapon คำนวณอัตโนมัติ
            </div>

            {lv80all && (
              <div className="asc-selector">
                <span className="asc-label">Ascension LV80</span>
                <div className="asc-btns">
                  {lv80all.map((_, i) => (
                    <button key={i} className={'asc-btn' + (ascension === i ? ' active' : '')} onClick={() => setAscension(i)}>A{i}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="p5x-stat-grid">
              <StatRow label="ATK%"           statKey="atk"  maxRange={160} />
              <StatRow label="CRIT Rate%"     statKey="crit" maxRange={75} />
              <StatRow label="CRIT DMG%"      statKey="cdmg" maxRange={150} />
              <StatRow label="HP%"            statKey="hp"   maxRange={200} />
              <StatRow label="DEF%"           statKey="def"  maxRange={220} />
              <StatRow label="Element DMG%"   statKey="edm"  maxRange={100} />
              <StatRow label="Healing Bonus%" statKey="heal" maxRange={35} />
              <StatRow label="SPD (Speed)"    statKey="spd"  maxRange={50} unit="" />
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>📊 สถิติรวม</div>
              {lv80 && (
                <div className="final-stats-row">
                  <div className="final-stat"><span className="fs-label">ATK</span><span className="fs-val">{finalAtk?.toLocaleString()}</span></div>
                  <div className="final-stat"><span className="fs-label">HP</span><span className="fs-val">{finalHp?.toLocaleString()}</span></div>
                  <div className="final-stat"><span className="fs-label">DEF</span><span className="fs-val">{finalDef?.toLocaleString()}</span></div>
                  <div className="final-stat"><span className="fs-label">SPD</span><span className="fs-val">{lv80.spd ?? currentChar?.baseStats?.spd ?? '—'}</span></div>
                </div>
              )}
              <div className="summary-grid">
                <div className="sum-box"><div className="sum-val">{totalStats.atk.toFixed(1)}%</div><div className="sum-lbl">ATK%</div></div>
                <div className="sum-box"><div className="sum-val">{Math.min(totalStats.crit, 100).toFixed(1)}%</div><div className="sum-lbl">CRIT Rate</div></div>
                <div className="sum-box"><div className="sum-val">{totalStats.cdmg.toFixed(1)}%</div><div className="sum-lbl">CRIT DMG</div></div>
                <div className="sum-box"><div className="sum-val">{totalStats.edm.toFixed(1)}%</div><div className="sum-lbl">Elem DMG</div></div>
                <div className="sum-box"><div className="sum-val">+{effHp}%</div><div className="sum-lbl">Eff.HP%</div></div>
                <div className="sum-box"><div className="sum-val">{Math.round(totalStats.spd)}</div><div className="sum-lbl">SPD</div></div>
              </div>

              {scoreData && (
                <div className="stat-target-card">
                  <div className="stat-target-title">🎯 Stats เป้าหมาย (Endgame)</div>
                  <div className="stat-target-chips">
                    {scoreData.breakdown.map((b, i) => (
                      <div key={i} className={'stat-chip' + (b.ratio >= 1 ? ' met' : b.ratio >= 0.75 ? ' close' : ' missing')}>
                        {b.label} ≥ {b.ideal}{b.ratio >= 1 ? ' ✓' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="score-wrap">
                <div className="score-title">📊 Build Score</div>
                {scoreData ? <>
                  <div className="score-number" style={{ color: scoreData.gradeColor }}>{scoreData.scorePct}%</div>
                  <div className="score-label" style={{ color: scoreData.gradeColor }}>เกรด {scoreData.grade} — {scoreData.gradeNote}</div>
                  <div className="score-bar-outer"><div className="score-bar-inner" style={{ width: scoreData.scorePct + '%' }} /></div>
                  <div className="score-tiers"><span>0</span><span>D</span><span>C</span><span>B</span><span>A</span><span>S</span><span>S+</span></div>
                  <div className="score-breakdown">
                    {scoreData.breakdown.map((b, i) => (
                      <div key={i} className="score-item">
                        <span className="si-label">{b.label}</span>
                        <div className="si-bar">
                          <div className="si-fill" style={{ width: b.ratio * 100 + '%', background: b.ratio >= 0.8 ? 'var(--gem)' : b.ratio >= 0.5 ? 'var(--persona)' : 'var(--p5x-muted)' }} />
                        </div>
                        <span className="si-val">{b.val} / {b.ideal}</span>
                      </div>
                    ))}
                  </div>
                </> : <>
                  <div className="score-number" style={{ color: 'var(--persona)' }}>—</div>
                  <div className="score-label" style={{ color: 'var(--p5x-muted)' }}>เลือกตัวละครก่อนเพื่อดู Score</div>
                  <div className="score-bar-outer"><div className="score-bar-inner" style={{ width: '0%' }} /></div>
                  <div className="score-tiers"><span>0</span><span>D</span><span>C</span><span>B</span><span>A</span><span>S</span><span>S+</span></div>
                </>}
              </div>

              <div className="p5x-btn-row">
                <button className="btn-p5x btn-p5x-export" onClick={() => setShowExport(true)}>📤 Export JSON</button>
                <button className="btn-p5x btn-p5x-import" onClick={() => setShowImport(true)}>📥 Import JSON</button>
              </div>
            </div>
          </div>
        </div>{/* /char-detail-sticky */}
        </div>{/* /p5x-right */}
      </div>{/* /p5x-container */}

      {/* Export Modal */}
      {showExport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExport(false)}>
          <div className="modal-box p5x-modal">
            <div className="modal-title">📤 Export Build Data</div>
            <textarea readOnly value={exportJson} />
            <div className="modal-btns">
              <button className="modal-btn primary-p5x" onClick={copyExport}>📋 Copy</button>
              <button className="modal-btn secondary" onClick={() => setShowExport(false)}>ปิด</button>
            </div>
            {copyOk && <div className="copy-ok-msg">✅ Copied to clipboard!</div>}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowImport(false)}>
          <div className="modal-box p5x-modal">
            <div className="modal-title">📥 Import Build Data</div>
            <textarea placeholder="วาง JSON ที่นี่..." value={importText} onChange={e => setImportText(e.target.value)} />
            {importError && <div className="import-err-msg">{importError}</div>}
            <div className="modal-btns">
              <button className="modal-btn primary-p5x" onClick={doImport}>✅ Import</button>
              <button className="modal-btn secondary" onClick={() => setShowImport(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
