import { useState } from 'react'

const CARD_SETS = [
  {name:'Courage',   bonus2:'Physical/Electric DMG +12%',        bonus4:'ถ้าเผชิญศัตรูเดี่ยว: Physical/Electric DMG +24% เพิ่ม'},
  {name:'Valor',     bonus2:'Physical/Electric DMG +12%',        bonus4:'Physical/Electric DMG +12%; ศัตรูเดี่ยว: +24%'},
  {name:'Power',     bonus2:'ATK พาร์ตี้ธาตุเดียวกัน +10%',     bonus4:'ATK พาร์ตี้ธาตุเดียวกัน +10% (ไม่สะสม)'},
  {name:'Peace',     bonus2:'DEF +20%',                          bonus4:'Shield effectiveness +18%'},
  {name:'Opulence',  bonus2:'HP +12%',                           bonus4:'Allies gain Life/Offense/Defense +8%'},
  {name:'Strife',    bonus2:'Curse DMG +10%',                    bonus4:'ATK +8% ต่อศัตรู 1 ตัว (สูงสุด +40%)'},
  {name:'Truth',     bonus2:'Nuclear DMG +10%',                  bonus4:'ATK +30% เมื่อโจมตีศัตรูที่ถูก debuff'},
  {name:'Hindrance', bonus2:'Curse DMG +10%',                    bonus4:'Curse DMG +20% vs ศัตรูที่ถูก debuff'},
  {name:'Victory',   bonus2:'ศัตรูรับ DMG +12% เป็น 2 เทิร์น',  bonus4:'เหมือน 2pc'},
  {name:'Resolve',   bonus2:'CRIT Rate +10%',                    bonus4:'CRIT DMG +20% เมื่อ CRIT Rate >70%'},
  {name:'Integrity', bonus2:'SPD +5%',                           bonus4:'ATK +15% หลังใช้ Support Skill'},
  {name:'Virtue',    bonus2:'Bless DMG +10%',                    bonus4:'Bless CRIT Rate +12%'},
  {name:'Abundance', bonus2:'Healing +15%',                      bonus4:'ทีม DMG +8% เป็น 2 เทิร์น เมื่อผู้ใส่ฮีล'},
  {name:'Creation',  bonus2:'ATK +10%',                          bonus4:'Special conditions apply'},
  {name:'Labor',     bonus2:'Physical DMG +10%',                 bonus4:'Additional Physical effects'},
]

const CHARACTERS = [
  // ─── 5-Star ─────────────────────────────────────────────────────────────
  {name:'Ren Amamiya',        codename:'Joker',          role:'Sweeper',    element:'Curse',          rarity:5, cards:['Strife 4pc','Courage 2pc'],    weapon:'Best Curse ATK weapon (Exclusive recommended)', statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Curse DMG%'],   note:'Best Curse DPS — AoE specialist. Strife 4pc scales ATK with enemy count.'},
  {name:'Ann Takamaki',       codename:'Panther',        role:'Sweeper',    element:'Fire',           rarity:5, cards:['Power 4pc','Courage 2pc'],      weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],     note:'Top Fire AoE DPS. Power 4pc boosts party ATK when stacked with Fire sub-DPS.'},
  {name:'Ryuji Sakamoto',     codename:'Skull',          role:'Assassin',   element:'Physical',       rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Physical ATK weapon',                      statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Physical DMG%'], note:'High single-target DPS. Gets even stronger at low HP. Solo-enemy Courage 4pc is devastating.'},
  {name:'Kasumi Yoshizawa',   codename:'Violet',         role:'Assassin',   element:'Bless',          rarity:5, cards:['Courage 4pc','Resolve 2pc'],    weapon:'Best Bless ATK weapon',                         statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Top-tier Assassin. Resolve 2pc gives CRIT Rate synergy for massive CRIT DMG bursts.'},
  {name:'Futaba Sakura',      codename:'Oracle',         role:'Elucidator', element:'-',              rarity:5, cards:['Abundance 4pc','Peace 2pc'],    weapon:'Best Support / HP scaling weapon',              statPrio:['HP%','DEF%','SPD'],                              note:'Best Navigator. Unique ability to inflict elemental weakness on any enemy.'},
  {name:'Ayaka Sakai',        codename:'Chord',          role:'Strategist', element:'Electric',       rarity:5, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best Electric SPD/Support weapon',              statPrio:['HP%','SPD','ATK%'],                              note:'Top-tier Strategist — Highlight mechanic grants team-wide buffs and ATK amplification.'},
  {name:'Tempest Riko',       codename:'Wind',           role:'Elucidator', element:'-',              rarity:4, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best SPD/ATK Support weapon',                   statPrio:['ATK%','SPD','CRIT Rate%'],                       note:'Elite offensive Strategist for CRIT teams. Integrity 2pc keeps SPD high for frequent actions.'},
  {name:'Yaoling Li',         codename:'Rin',            role:'Saboteur',   element:'Curse',          rarity:5, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Curse / SPD weapon',                       statPrio:['ATK%','SPD','DEF%'],                             note:'Best enemy debuffer — reduces enemy DEF. Hindrance 4pc amplifies debuffed targets.'},
  {name:'Seiji Shiratori',    codename:'Fleuret',        role:'Assassin',   element:'Wind',           rarity:4, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Wind ATK weapon',                          statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Wind-element Assassin. Courage 4pc solo-enemy bonus is core to his kit.'},
  {name:'Manaka Nagao',       codename:'Ange',           role:'Elucidator', element:'-',              rarity:5, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best SPD/Support weapon',                       statPrio:['ATK%','SPD','HP%'],                              note:'Provides ATK%, DMG%, and pierce buffs to allies. Integrity 2pc enables more support actions.'},
  {name:'Yusuke Kitagawa',    codename:'Fox',            role:'Sweeper',    element:'Ice',            rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best Ice ATK weapon',                           statPrio:['ATK%','Ice DMG%','CRIT Rate%'],                  note:'Ice AoE DPS. Truth 4pc punishes debuffed targets — pair with Saboteur for maximum output.'},
  {name:'Makoto Niijima',     codename:'Queen',          role:'Assassin',   element:'Nuclear',        rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best Nuclear ATK weapon',                       statPrio:['ATK%','Nuclear DMG%','CRIT Rate%'],              note:'Nuclear Assassin. Truth 4pc synergises with Nuclear\'s natural debuff/meltdown mechanic.'},
  {name:'Goro Akechi',        codename:'Crow',           role:'Sweeper',    element:'Almighty',       rarity:5, cards:['Courage 4pc','Resolve 2pc'],    weapon:'Best Almighty ATK weapon',                      statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Almighty Sweeper. Almighty bypasses resistances. CRIT-focused kit synergises with Resolve 2pc.'},
  {name:'Luce',               codename:'Luce',           role:'Strategist', element:'Bless',          rarity:4, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best Bless Support weapon',                     statPrio:['HP%','SPD','DEF%'],                              note:'Bless Strategist. Provides intel buffs and elemental resonance to the team.'},
  {name:'Turbo',              codename:'Turbo',          role:'Strategist', element:'Physical',       rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Physical/SPD weapon',                      statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Physical Strategist. High hit-count attacks make Courage 4pc very effective.'},
  {name:'Matoi',              codename:'Matoi',          role:'Saboteur',   element:'Ice',            rarity:5, cards:['Peace 4pc','Opulence 2pc'],     weapon:'Best Ice Saboteur weapon',                      statPrio:['HP%','DEF%','SPD'],                              note:'Ice Saboteur. Provides party-wide damage mitigation and debuffs.'},
  {name:'Howler',             codename:'Howler',         role:'Saboteur',   element:'Fire',           rarity:5, cards:['Power 4pc','Strife 2pc'],       weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],     note:'Fire Saboteur with strong AoE coverage. Power 4pc amplifies team damage.'},
  {name:'J&C',                codename:'J&C',            role:'Virtuoso',   element:'Almighty',       rarity:5, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Almighty / debuff weapon',                 statPrio:['ATK%','SPD','DEF%'],                             note:'Dual-persona Virtuoso. Almighty element bypasses resistances. Unique performance mechanics alternate between two fighting styles.'},
  {name:'Noir',               codename:'Noir',           role:'Sweeper',    element:'Psychokinesis',  rarity:5, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best Psychokinesis ATK weapon',                 statPrio:['ATK%','SPD','HP%'],                              note:'Psychokinesis Sweeper. Unique psy mechanics enabling high team damage output.'},
  {name:'Cherish',            codename:'Cherish',        role:'Guardian',   element:'Ice',            rarity:5, cards:['Peace 4pc','Virtue 2pc'],       weapon:'Best HP/Shield weapon',                         statPrio:['HP%','DEF%','Healing Bonus%'],                   note:'Ice Guardian specialising in shields and party protection.'},
  {name:'Messa',              codename:'Messa',          role:'Assassin',   element:'Physical',       rarity:5, cards:['Peace 4pc','Opulence 2pc'],     weapon:'Best Physical Assassin weapon',                 statPrio:['HP%','DEF%','SPD'],                              note:'Physical Assassin. Tanks damage while inflicting Physical weakness for DPS follow-ups.'},
  {name:'Phoebe',             codename:'Phoebe',         role:'Elucidator', element:'-',              rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best Ice ATK weapon',                           statPrio:['ATK%','Ice DMG%','CRIT Rate%','CRIT DMG%'],      note:'Ice Sweeper with crowd-control. Truth 4pc rewards pairing with a Saboteur.'},
  {name:'Marian',             codename:'Marian',         role:'Medic',      element:'Bless',          rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Bless Healing weapon',                     statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Bless Medic with precise healing burst. Valor 2pc sustains high output.'},
  {name:'Makoto',             codename:'makoto',         role:'Assassin',   element:'Fire',           rarity:5, cards:['Courage 4pc','Resolve 2pc'],    weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Fire DMG%'],     note:'Fire Assassin variant. Moon Phase stacks → Scarlet Hades burst. Dual Theurgy (Ardhanari + Cadenza). Strong with ally buff support.',
    realName:'Makoto Yuki', affiliation:'S.E.E.S.', persona:'Orpheus',
    weakRes:{ Fire:'res', Ice:'wk', Electric:'normal', Wind:'normal', Nuclear:'normal', Curse:'null', Bless:'normal', Physical:'normal', Almighty:'normal', Psychokinesis:'normal' },
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
      {stage:0, name:'Pathfinder',
        desc:'Makoto has 2 Theurgy: Cadenza and Ardhanari. At the start of battle, if Makoto\'s Theurgy Gauge is below 35, fill up to 35.\nWhen receiving buff, healing, or shield skill effects from an ally (excluding effects that also target foes), gain 1 Moon Phase stack (up to 1 stack per turn). This effect lasts for 2 turns, and stacks up to 4 times.\nWith Moon Phase, increase pierce rate by 4%/8%/12% (effect changes at Lv. 1/50/70, respectively).',
        descTh:'Makoto มี Theurgy 2 แบบ: Cadenza และ Ardhanari เมื่อเริ่มต้นการต่อสู้ หาก Theurgy Gauge ของ Makoto ต่ำกว่า 35 ให้เติมจนถึง 35\nเมื่อได้รับเอฟเฟกต์ buff, การฟื้นฟู หรือ shield จากพันธมิตร (ยกเว้นเอฟเฟกต์ที่มีผลต่อศัตรูด้วย) รับ Moon Phase 1 stack (สูงสุด 1 stack ต่อเทิร์น) เอฟเฟกต์นี้คงอยู่ 2 เทิร์น สะสมสูงสุด 4 ครั้ง\nเมื่อมี Moon Phase เพิ่มอัตรา pierce 4%/8%/12% (เปลี่ยนที่ Lv. 1/50/70)'},
      {stage:1, name:'Result of Coincidence',
        desc:'Additional effects are added to the following skills.\nMelody of Flames: This skill deals 1 more hit of Fire damage.\nNocturne of Battle: Increase party\'s pierce rate by 10% for 2 turns.\nScarlet Hades: When this skill is activated with 4 Moon Phase stacks, increase Makoto\'s critical rate by 16%.',
        descTh:'เพิ่มเอฟเฟกต์ให้กับสกิลต่อไปนี้\nMelody of Flames: สกิลนี้โจมตีธาตุไฟเพิ่มอีก 1 ครั้ง\nNocturne of Battle: เพิ่มอัตรา pierce ของปาร์ตี้ 10% เป็นเวลา 2 เทิร์น\nScarlet Hades: เมื่อใช้สกิลนี้ด้วย Moon Phase stack 4 อัน เพิ่ม CRIT Rate ของ Makoto 16%'},
      {stage:2, name:'Immovable Soul',
        desc:'When Makoto has 4 Moon Phase stacks on his action, automatically activate Nocturne of Battle 1 time.\nCooldown time: 1 turn.',
        descTh:'เมื่อ Makoto มี Moon Phase stack 4 อันในเทิร์นของตน จะเปิดใช้ Nocturne of Battle อัตโนมัติ 1 ครั้ง\nCooldown: 1 เทิร์น'},
      {stage:3, name:'Under the Full Moon',
        desc:'Increase the skill levels of Scarlet Hades and Combat Tactics by 3.',
        descTh:'เพิ่มระดับสกิล Scarlet Hades และ Combat Tactics ขึ้น 3'},
      {stage:4, name:'Thorny Path',
        desc:'Additional effects are added to the following Theurgy.\nCadenza: Increase party\'s damage by 10% more for 2 turns.\nArdhanari: This skill deals 2 more hits of Fire damage.',
        descTh:'เพิ่มเอฟเฟกต์ให้กับ Theurgy ต่อไปนี้\nCadenza: เพิ่มความเสียหายของปาร์ตี้ 10% เพิ่มเติมเป็นเวลา 2 เทิร์น\nArdhanari: สกิลนี้โจมตีธาตุไฟเพิ่มอีก 2 ครั้ง'},
      {stage:5, name:'Soul Flames',
        desc:'Increase the skill levels of Melody of Flames and Nocturne of Battle by 3.',
        descTh:'เพิ่มระดับสกิล Melody of Flames และ Nocturne of Battle ขึ้น 3'},
      {stage:6, name:'Burn My Dread',
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
  },
  {name:'Closer (Tropical)',  codename:'closer-tropical',role:'Sweeper',    element:'Bless',          rarity:5, cards:['Courage 4pc','Virtue 2pc'],     weapon:'Best Bless ATK weapon',                         statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Bless Sweeper variant. Tropical-themed alternate version of Closer.'},
  {name:'Rin (Firecracker)',  codename:'rin-firecracker',role:'Sweeper',    element:'Fire',           rarity:5, cards:['Power 4pc','Courage 2pc'],      weapon:'Best Fire ATK weapon',                          statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],     note:'Fire Sweeper variant. Festive alternate version of Rin.'},
  {name:'Mont (Frostgale)',   codename:'mont-frostgale', role:'Assassin',   element:'Wind',           element2:'Ice', rarity:5, cards:['Courage 4pc','Valor 2pc'], weapon:'Best Wind/Ice ATK weapon',               statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'Dual-element Wind/Ice Assassin variant. Unique frostgale mechanics merge both elements.'},
  {name:'Wind (Tempest)',     codename:'wind-tempest',   role:'Strategist', element:'Wind',           rarity:5, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best Wind SPD/Support weapon',                  statPrio:['ATK%','SPD','CRIT Rate%'],                       note:'Wind Strategist variant. Tempest-themed alternate version with enhanced Wind mechanics.'},
  {name:'Moko (Seaside)',     codename:'moko-seaside',   role:'Medic',      element:'Psychokinesis',  rarity:5, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best Psy Healing weapon',                       statPrio:['HP%','SPD','DEF%'],                              note:'Psychokinesis Medic variant. Seaside-themed alternate version of Moko.'},
  // ─── 4-Star ─────────────────────────────────────────────────────────────
  {name:'Morgana',            codename:'Mona',           role:'Medic',      element:'Wind',           rarity:5, cards:['Peace 4pc','Opulence 2pc'],     weapon:'Best Healing / HP weapon',                      statPrio:['HP%','Healing Bonus%','DEF%'],                   note:'Only character who can revive allies mid-battle. Prioritise HP% for better revive threshold.'},
  {name:'Minami Miyashita',   codename:'Bui',            role:'Assassin',   element:'Electric',       rarity:5, cards:['Peace 4pc','Virtue 2pc'],       weapon:'Best Electric ATK weapon',                      statPrio:['HP%','Healing Bonus%','DEF%'],                   note:'Electric Assassin. High output damage with precise targeting.'},
  {name:'Vino',               codename:'Vino',           role:'Saboteur',   element:'Nuclear',        rarity:4, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Nuclear debuff weapon',                    statPrio:['ATK%','SPD','DEF%'],                             note:'4★ Nuclear Saboteur. Applies Nuclear debuffs to boost team output.'},
  {name:'Riddle',             codename:'Riddle',         role:'Strategist', element:'Psychokinesis',  rarity:5, cards:['Integrity 4pc','Opulence 2pc'], weapon:'Best Psy support weapon',                       statPrio:['ATK%','SPD','HP%'],                              note:'4★ Psy Strategist. Integrity 4pc sustains high action frequency.'},
  {name:'Cattle',             codename:'Cattle',         role:'Medic',      element:'Fire',           rarity:4, cards:['Abundance 4pc','Peace 2pc'],     weapon:'Best Healing weapon',                           statPrio:['HP%','Healing Bonus%','DEF%'],                   note:'4★ Fire Healer. Provides consistent HP recovery for the party.'},
  {name:'Leon',               codename:'Leon',           role:'Strategist', element:'Nuclear',        rarity:4, cards:['Peace 4pc','Valor 2pc'],         weapon:'Best Nuclear support weapon',                   statPrio:['HP%','DEF%','SPD'],                              note:'4★ Nuclear Strategist. Reliable frontline support, good for early-game progression.'},
  {name:'Closer',             codename:'Closer',         role:'Sweeper',    element:'Electric',       rarity:4, cards:['Courage 4pc','Valor 2pc'],       weapon:'Best Electric weapon',                          statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                 note:'4★ Electric Sweeper. Focuses on finishing weakened enemies.'},
  {name:'Mont',               codename:'Mont',           role:'Assassin',   element:'Ice',            rarity:4, cards:['Peace 4pc','Opulence 2pc'],      weapon:'Best Ice ATK weapon',                           statPrio:['HP%','DEF%','SPD'],                              note:'4★ Ice Assassin. Ice-element burst damage.'},
  {name:'Soy',                codename:'Soy',            role:'Guardian',   element:'Ice',            rarity:4, cards:['Abundance 4pc','Virtue 2pc'],    weapon:'Best Ice Guardian weapon',                      statPrio:['HP%','Healing Bonus%','DEF%'],                   note:'4★ Ice Guardian. Ice-element tank with party mitigation.'},
  {name:'Yuki',               codename:'Yuki',           role:'Guardian',   element:'Bless',          rarity:4, cards:['Courage 4pc','Valor 2pc'],       weapon:'Best Bless weapon',                             statPrio:['ATK%','CRIT Rate%'],                             note:'4★ Bless Guardian. Solid frontline protection for Bless teams.'},
  {name:'Key',                codename:'Key',            role:'Saboteur',   element:'Fire',           rarity:4, cards:['Hindrance 4pc','Strife 2pc'],    weapon:'Best Fire debuff weapon',                       statPrio:['ATK%','SPD','DEF%'],                             note:'4★ Fire Saboteur. Applies debuffs to reduce enemy Fire resistance.'},
  {name:'Moko',               codename:'Moko',           role:'Strategist', element:'Psychokinesis',  rarity:4, cards:['Abundance 4pc','Opulence 2pc'],  weapon:'Best Psy support weapon',                       statPrio:['HP%','SPD','DEF%'],                              note:'4★ Psy Strategist. Provides intel support and team utility.'},
  {name:'Sepia',              codename:'Sepia',          role:'Assassin',   element:'Curse',          rarity:4, cards:['Integrity 4pc','Opulence 2pc'],  weapon:'Best Curse ATK weapon',                         statPrio:['ATK%','SPD','HP%'],                              note:'4★ Curse Assassin. High-speed burst damage with Curse element.'},
  {name:'Puppet',             codename:'Puppet',         role:'Elucidator', element:'-',              rarity:4, cards:['Abundance 4pc','Peace 2pc'],      weapon:'Best Support weapon',                           statPrio:['HP%','SPD','DEF%'],                              note:'4★ Elucidator. Navigator support with unique debuff mechanics.'},
  {name:'Okyann',             codename:'Okyann',         role:'Elucidator', element:'-',              rarity:4, cards:['Abundance 4pc','Opulence 2pc'],   weapon:'Best Support weapon',                           statPrio:['HP%','SPD','DEF%'],                              note:'4★ Elucidator. Provides elemental resonance and damage amplification.'},
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
  'Minami Miyashita': BASE_PORTRAITS + 'bui.webp',
  'Vino':             BASE_PORTRAITS + 'vino.webp',
  'Riddle':           BASE_PORTRAITS + 'riddle.webp',
  'Cattle':           BASE_PORTRAITS + 'cattle.webp',
  'Leon':             BASE_PORTRAITS + 'leon.webp',
  'Closer':           BASE_PORTRAITS + 'closer.webp',
  'Mont':             BASE_PORTRAITS + 'mont.webp',
  'Soy':              BASE_PORTRAITS + 'soy.webp',
  'Yuki':             BASE_PORTRAITS + 'yuki.webp',
  'Key':              BASE_PORTRAITS + 'key.webp',
  'Moko':             BASE_PORTRAITS + 'moko.webp',
  'Sepia':            BASE_PORTRAITS + 'sepia.webp',
  'Puppet':           BASE_PORTRAITS + 'puppet.webp',
  'Okyann':           BASE_PORTRAITS + 'okyann.webp',
  'Makoto':           BASE_PORTRAITS + 'makoto.webp',
  'Closer (Tropical)':BASE_PORTRAITS + 'closer-tropical.webp',
  'Rin (Firecracker)':BASE_PORTRAITS + 'rin-firecracker.webp',
  'Mont (Frostgale)': BASE_PORTRAITS + 'mont-frostgale.webp',
  'Wind (Tempest)':   BASE_PORTRAITS + 'wind-tempest.webp',
  'Moko (Seaside)':   BASE_PORTRAITS + 'moko-seaside.webp',
}
const RAINBOW_CHARS = new Set(['Violet','Oracle','Chord','Ange','Queen','Crow','Matoi','J&C','Noir','Messa','makoto','closer-tropical','rin-firecracker','mont-frostgale','wind-tempest','moko-seaside'])
const ROLE_ICONS = {Sweeper:'🌊', Assassin:'⚔️', Medic:'💚', Guardian:'🛡️', Saboteur:'🎯', Strategist:'🎵', Elucidator:'📡', Virtuoso:'✨'}
const ELEM_COLORS = {Fire:'#ff4422',Ice:'#44aaff',Electric:'#ffee00',Wind:'#44ffaa',Nuclear:'#ff8800',Curse:'#aa44ff',Bless:'#ffcc44',Physical:'#ff8866',Almighty:'#ffffff',Psychokinesis:'#dd44ff','-':'#888888'}
const ROLE_COLORS = {Sweeper:'#40c8ff', Assassin:'#ff6030', Medic:'#40ff80', Guardian:'#8080ff', Saboteur:'#ffcc40', Strategist:'#b060ff', Elucidator:'#40ffcc', Virtuoso:'#ff88ff'}

const STAT_TARGETS = {
  dps:      {atk:[120,25], crit:[70,20], cdmg:[200,20], edm:[60,15], hp:[0,0], def:[0,0], heal:[0,0], spd:[0,0]},
  support:  {atk:[60,10],  crit:[30,5],  cdmg:[0,0],    edm:[0,0],   hp:[80,20],def:[0,0],heal:[0,0], spd:[80,25]},
  medic:    {atk:[20,5],   crit:[0,0],   cdmg:[0,0],    edm:[0,0],   hp:[100,30],def:[40,15],heal:[60,30],spd:[30,10]},
  saboteur: {atk:[80,20],  crit:[30,10], cdmg:[0,0],    edm:[0,0],   hp:[0,0],  def:[20,5], heal:[0,0], spd:[70,25]},
}

function getRoleArchetype(role) {
  if (role === 'Saboteur') return 'saboteur'
  if (role === 'Medic') return 'medic'
  if (role === 'Sweeper' || role === 'Assassin') return 'dps'
  return 'support'
}

const statMap = {'ATK%':'atk','CRIT Rate%':'crit','CRIT DMG%':'cdmg','HP%':'hp','DEF%':'def','Healing Bonus%':'heal','SPD':'spd'}
const statLabels = {atk:'ATK%',crit:'CRIT Rate%',cdmg:'CRIT DMG%',edm:'Elem DMG%',hp:'HP%',def:'DEF%',heal:'Healing%',spd:'SPD'}

export default function P5XPage() {
  const [filter, setFilter] = useState('all')
  const [elemFilter, setElemFilter] = useState('all')
  const [charName, setCharName] = useState('')
  const [legendOpen, setLegendOpen] = useState(false)
  const [stats, setStats] = useState({atk:0,crit:0,cdmg:0,hp:0,def:0,edm:0,heal:0,spd:0})
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copyOk, setCopyOk] = useState(false)
  const [charTab, setCharTab] = useState('build')
  const [ascension, setAscension] = useState(6)
  const [lang, setLang] = useState('en')

  const currentChar = CHARACTERS.find(c => c.name === charName) || null
  const currentEc = currentChar ? (ELEM_COLORS[currentChar.element] || '#888') : 'var(--persona)'

  const lv80arr = currentChar?.baseStatsLv80
  const lv80all = lv80arr ? (Array.isArray(lv80arr) ? lv80arr : [lv80arr]) : null
  const lv80 = lv80all ? lv80all[Math.min(ascension, lv80all.length - 1)] : null
  const finalAtk = lv80 ? Math.round(lv80.atk * (1 + stats.atk / 100)) : null
  const finalHp  = lv80 ? Math.round(lv80.hp  * (1 + stats.hp  / 100)) : null
  const finalDef = lv80 ? Math.round(lv80.def * (1 + stats.def / 100)) : null

  const filtered = CHARACTERS.filter(c =>
    (filter === 'all' || c.role === filter) &&
    (elemFilter === 'all' || c.element === elemFilter || c.element2 === elemFilter)
  )

  const grouped5rainbow = filtered.filter(c => c.rarity === 5 && RAINBOW_CHARS.has(c.codename))
  const grouped5gold    = filtered.filter(c => c.rarity === 5 && !RAINBOW_CHARS.has(c.codename))
  const grouped4 = filtered.filter(c => c.rarity === 4)
  const grouped3 = filtered.filter(c => c.rarity <= 3)

  function setStat(key, val) {
    setStats(prev => ({ ...prev, [key]: Number(val) || 0 }))
  }

  // Effective HP
  const effHp = ((1 + stats.hp / 100) * (1 + stats.def / 100) * 100 - 100).toFixed(1)

  // Build score
  let scoreData = null
  if (currentChar) {
    const arch = getRoleArchetype(currentChar.role)
    const targets = STAT_TARGETS[arch]
    const prioKeys = currentChar.statPrio.map(p => {
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
      const val = stats[key]
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
      if (!d.stats) throw new Error('ไม่พบ stats')
      const s = d.stats
      setStats({ atk:s.atk||0, crit:s.crit||0, cdmg:s.cdmg||0, hp:s.hp||0, def:s.def||0, edm:s.edm||0, heal:s.heal||0, spd:s.spd||0 })
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
        onClick={() => setCharName(isActive ? '' : c.name)}>
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

  function StatRow({ label, statKey, max, maxRange, unit = '%' }) {
    return (
      <div className="p5x-stat-row">
        <label>{label}</label>
        <input type="number" value={stats[statKey]} min="0" max={max} step={unit === '' ? 1 : 0.1}
          onChange={e => setStat(statKey, e.target.value)} />
        <input type="range" min="0" max={maxRange} step={unit === '' ? 1 : 0.5} value={stats[statKey]}
          onChange={e => setStat(statKey, e.target.value)} />
        <span className="stat-unit">{unit}</span>
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

      <div className="p5x-container">
        {/* LEFT: filters + char grid */}
        <div className="p5x-left">
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
        <div className="p5x-right">
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
                  <div className="char-name">{currentChar.name}</div>
                  <div className="char-codename" style={{ color: currentEc }}>{currentChar.realName || currentChar.codename}</div>
                  <div className="char-badges">
                    <span className={`cbadge rarity${currentChar.rarity}`}>{'★'.repeat(currentChar.rarity)} {currentChar.rarity}-Star</span>
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

              <div className="char-tab-bar">
                <button className={'char-tab-btn' + (charTab === 'build' ? ' active' : '')} onClick={() => setCharTab('build')}>🃏 Build</button>
                <button className={'char-tab-btn' + (charTab === 'kit'   ? ' active' : '')} onClick={() => setCharTab('kit')}>⚔️ Kit</button>
                <div className="lang-toggle">
                  <button className={'lang-btn' + (lang === 'en' ? ' active' : '')} onClick={() => setLang('en')}>EN</button>
                  <button className={'lang-btn' + (lang === 'th' ? ' active' : '')} onClick={() => setLang('th')}>TH</button>
                </div>
              </div>

              {charTab === 'kit' && (
                <div className="kit-section">
                  {/* SKILLS */}
                  <div className="kit-block">
                    <div className="kit-block-title">Skills</div>
                    {(currentChar.skills || []).length === 0
                      ? <div className="kit-empty">— ยังไม่มีข้อมูล</div>
                      : <div className="skill-grid">
                          {(currentChar.skills || []).map((sk, i) => (
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
                                </div>
                                <div className="skill-header-right">
                                  {sk.sp > 0 && <span className="skill-sp">SP {sk.sp}</span>}
                                  {sk.isBuff && <img src={import.meta.env.BASE_URL + 'p5x/elements/buff.webp'} alt="buff" className="skill-buff-icon" onError={e => e.target.style.display='none'} />}
                                </div>
                              </div>
                              <div className="skill-name">{sk.name}</div>
                              <div className="skill-desc">{lang === 'th' && sk.descTh ? sk.descTh : sk.desc}</div>
                            </div>
                          ))}
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
                                <span className="aw-stage">{aw.stage}</span>
                                <span className="aw-name">{aw.name || aw.bonus || ''}</span>
                              </div>
                              {aw.desc && <div className="aw-desc">{lang === 'th' && aw.descTh ? aw.descTh : aw.desc}</div>}
                            </div>
                          ))}
                        </div>
                    }
                  </div>

                  {/* ELEMENT AFFINITIES */}
                  {currentChar.weakRes && (
                    <div className="kit-block">
                      <div className="kit-block-title">Element Affinities</div>
                      <div className="elem-affinity-row">
                        {Object.entries(currentChar.weakRes).map(([elem, val]) => (
                          <div key={elem} className={`ea-cell ea-${val}`}>
                            <img src={ELEM_IMG[elem]} alt={elem} className="ea-icon"
                              style={{ filter: val === 'null' ? 'grayscale(1) opacity(0.35)' : `drop-shadow(0 0 2px ${ELEM_COLORS[elem]||'#888'})` }} />
                            {val !== 'normal' && (
                              <span className="ea-label">
                                {val === 'wk' ? 'Wk' : val === 'res' ? 'Res' : val === 'null' ? 'Null' : 'Abs'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                      const bonus = setData ? (pc === '4' ? setData.bonus4 : setData.bonus2) : '?'
                      return (
                        <div key={idx} className="card-set-item">
                          <span className="cs-pc">{pc}pc</span>
                          <div><div className="cs-name">{setName}</div><div className="cs-bonus">{bonus}</div></div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="info-panel">
                  <div className="info-label">⚔️ Recommended Weapon</div>
                  <div className="weapon-box">{currentChar.weapon}</div>
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
              </div>}
            </div>
          ) : (
            <div className="char-empty-state">
              <div className="char-empty-icon">🃏</div>
              <p>เลือกตัวละครเพื่อดูข้อมูล</p>
            </div>
          )}

          {/* STAT CALCULATOR — inside sticky panel to prevent overlap */}
          <div style={{ borderTop: '1px solid var(--p5x-border)', marginTop: 12, paddingTop: 12 }}>
            <div className="section-title">🧮 STAT CALCULATOR</div>

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
              <StatRow label="ATK%"           statKey="atk"  max={300} maxRange={150} />
              <StatRow label="CRIT Rate%"     statKey="crit" max={100} maxRange={100} />
              <StatRow label="CRIT DMG%"      statKey="cdmg" max={400} maxRange={250} />
              <StatRow label="HP%"            statKey="hp"   max={200} maxRange={150} />
              <StatRow label="DEF%"           statKey="def"  max={200} maxRange={150} />
              <StatRow label="Element DMG%"   statKey="edm"  max={200} maxRange={120} />
              <StatRow label="Healing Bonus%" statKey="heal" max={150} maxRange={100} />
              <StatRow label="SPD (Speed)"    statKey="spd"  max={500} maxRange={400} unit="" />
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
                <div className="sum-box"><div className="sum-val">{stats.atk.toFixed(1)}%</div><div className="sum-lbl">ATK%</div></div>
                <div className="sum-box"><div className="sum-val">{Math.min(stats.crit, 100).toFixed(1)}%</div><div className="sum-lbl">CRIT Rate</div></div>
                <div className="sum-box"><div className="sum-val">{stats.cdmg.toFixed(1)}%</div><div className="sum-lbl">CRIT DMG</div></div>
                <div className="sum-box"><div className="sum-val">{stats.edm.toFixed(1)}%</div><div className="sum-lbl">Elem DMG</div></div>
                <div className="sum-box"><div className="sum-val">+{effHp}%</div><div className="sum-lbl">Eff.HP%</div></div>
                <div className="sum-box"><div className="sum-val">{Math.round(stats.spd)}</div><div className="sum-lbl">SPD</div></div>
              </div>

              <div className="score-wrap">
                <div className="score-title">🎯 Build Score (เทียบกับ Build ที่แนะนำ)</div>
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
