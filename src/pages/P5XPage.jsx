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
  {name:'Ren Amamiya',     codename:'Joker',   role:'Sweeper',    element:'Curse',    rarity:5, cards:['Strife 4pc','Courage 2pc'],    weapon:'Best Curse ATK weapon (Exclusive recommended)', statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Curse DMG%'],    note:'Best Curse DPS — AoE specialist. Strife 4pc scales ATK with enemy count.'},
  {name:'Ann Takamaki',    codename:'Panther', role:'Sweeper',    element:'Fire',     rarity:5, cards:['Power 4pc','Courage 2pc'],      weapon:'Best Fire ATK weapon',                           statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],      note:'Top Fire AoE DPS. Power 4pc boosts party ATK when stacked with Fire sub-DPS.'},
  {name:'Ryuji Sakamoto',  codename:'Skull',   role:'Assassin',   element:'Physical', rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Physical ATK weapon',                       statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Physical DMG%'],  note:'High single-target DPS. Gets even stronger at low HP. Solo-enemy Courage 4pc is devastating.'},
  {name:'Kasumi Yoshizawa',codename:'Violet',  role:'Assassin',   element:'Physical', rarity:5, cards:['Courage 4pc','Resolve 2pc'],    weapon:'Exclusive weapon strongly recommended',           statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                  note:'Top-tier Assassin. Resolve 2pc gives CRIT Rate synergy for massive CRIT DMG bursts.'},
  {name:'Futaba Sakura',   codename:'Oracle',  role:'Elucidator', element:'-',        rarity:5, cards:['Abundance 4pc','Peace 2pc'],    weapon:'Best Support / HP scaling weapon',               statPrio:['HP%','DEF%','SPD'],                               note:'Best Navigator. Unique ability to inflict elemental weakness on any enemy.'},
  {name:'Ayaka Sakai',     codename:'Chord',   role:'Strategist', element:'-',        rarity:5, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best SPD/Support weapon',                        statPrio:['HP%','SPD','ATK%'],                               note:'Top-tier Strategist — Highlight mechanic grants team-wide buffs and ATK amplification.'},
  {name:'Tempest Riko',    codename:'Wind',    role:'Strategist', element:'-',        rarity:5, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best SPD/ATK Support weapon',                    statPrio:['ATK%','SPD','CRIT Rate%'],                        note:'Elite offensive Strategist for CRIT teams. Integrity 2pc keeps SPD high for frequent actions.'},
  {name:'Yaoling Li',      codename:'Rin',     role:'Saboteur',   element:'Curse',    rarity:5, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Curse / SPD weapon',                        statPrio:['ATK%','SPD','DEF%'],                              note:'Best enemy debuffer — reduces enemy DEF. Hindrance 4pc amplifies debuffed targets.'},
  {name:'Seiji Shiratori', codename:'Fleuret', role:'Assassin',   element:'Physical', rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Exclusive weapon recommended',                   statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                  note:'Pure Physical single-target DPS. Courage 4pc solo-enemy bonus is core to his kit.'},
  {name:'Manaka Nagao',    codename:'Ange',    role:'Strategist', element:'-',        rarity:5, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best SPD/Support weapon',                        statPrio:['ATK%','SPD','HP%'],                               note:'Provides ATK%, DMG%, and pierce buffs to allies. Integrity 2pc enables more support actions.'},
  {name:'Yusuke Kitagawa', codename:'Fox',     role:'Sweeper',    element:'Ice',      rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best Ice ATK weapon',                            statPrio:['ATK%','Ice DMG%','CRIT Rate%'],                   note:'Ice AoE DPS. Truth 4pc punishes debuffed targets — pair with Saboteur for maximum output.'},
  {name:'Makoto Niijima',  codename:'Queen',   role:'Sweeper',    element:'Nuclear',  rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best Nuclear ATK weapon',                        statPrio:['ATK%','Nuclear DMG%','CRIT Rate%'],               note:'Nuclear AoE damage. Truth 4pc synergises with Nuclear\'s natural debuff/meltdown mechanic.'},
  {name:'Goro Akechi',     codename:'Crow',    role:'Assassin',   element:'Bless',    rarity:5, cards:['Courage 4pc','Resolve 2pc'],    weapon:'Best Bless ATK weapon',                          statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Bless DMG%'],    note:'High-powered Bless single-target DPS. CRIT-focused kit synergises with Resolve 2pc.'},
  {name:'Luce',            codename:'Luce',    role:'Elucidator', element:'-',        rarity:5, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best Support weapon',                            statPrio:['HP%','SPD','DEF%'],                              note:'Support Navigator. Provides intel buffs and elemental resonance to the team.'},
  {name:'Turbo',           codename:'Turbo',   role:'Sweeper',    element:'Electric', rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Electric ATK weapon',                       statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Electric DMG%'], note:'Fast Electric Sweeper. High hit-count attacks make Courage 4pc very effective.'},
  {name:'Matoi',           codename:'Matoi',   role:'Guardian',   element:'Wind',     rarity:5, cards:['Peace 4pc','Opulence 2pc'],    weapon:'Best HP/DEF tanking weapon',                     statPrio:['HP%','DEF%','SPD'],                               note:'Wind-element Guardian. Provides party-wide damage mitigation and taunts.'},
  {name:'Howler',          codename:'Howler',  role:'Sweeper',    element:'Fire',     rarity:5, cards:['Power 4pc','Strife 2pc'],       weapon:'Best Fire ATK weapon',                           statPrio:['ATK%','Fire DMG%','CRIT Rate%','CRIT DMG%'],      note:'Aggressive Fire Sweeper with strong AoE coverage. Power 4pc amplifies team damage.'},
  {name:'J&C',             codename:'J&C',     role:'Saboteur',   element:'Curse',    rarity:5, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Curse / debuff weapon',                     statPrio:['ATK%','SPD','DEF%'],                              note:'Dual-persona Saboteur. Curses and debilitates enemies, synergises with Curse DPS.'},
  {name:'Noir',            codename:'Noir',    role:'Strategist', element:'-',        rarity:5, cards:['Opulence 4pc','Integrity 2pc'], weapon:'Best SPD/Support weapon',                        statPrio:['ATK%','SPD','HP%'],                               note:'Elegant Strategist. Buffs party ATK and applies pierce, enabling high team damage output.'},
  {name:'Cherish',         codename:'Cherish', role:'Guardian',   element:'Bless',    rarity:5, cards:['Peace 4pc','Virtue 2pc'],      weapon:'Best HP/Shield weapon',                          statPrio:['HP%','DEF%','Healing Bonus%'],                    note:'Bless Guardian specialising in shields and party protection. Virtue 2pc enhances Bless synergy.'},
  {name:'Messa',           codename:'Messa',   role:'Guardian',   element:'Nuclear',  rarity:5, cards:['Peace 4pc','Opulence 2pc'],    weapon:'Best Nuclear tank weapon',                       statPrio:['HP%','DEF%','SPD'],                               note:'Nuclear Guardian. Tanks damage while inflicting Nuclear weakness for DPS follow-ups.'},
  {name:'Phoebe',          codename:'Phoebe',  role:'Sweeper',    element:'Ice',      rarity:5, cards:['Truth 4pc','Courage 2pc'],      weapon:'Best Ice ATK weapon',                            statPrio:['ATK%','Ice DMG%','CRIT Rate%','CRIT DMG%'],       note:'Ice Sweeper with crowd-control. Truth 4pc rewards pairing with a Saboteur.'},
  {name:'Marian',          codename:'Marian',  role:'Assassin',   element:'Fire',     rarity:5, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Fire ATK weapon',                           statPrio:['ATK%','CRIT Rate%','CRIT DMG%','Fire DMG%'],      note:'Fire Assassin with precise single-target burst. Valor 2pc sustains high Physical output.'},
  // ─── 4-Star ─────────────────────────────────────────────────────────────
  {name:'Morgana',         codename:'Mona',    role:'Medic',      element:'Wind',     rarity:4, cards:['Peace 4pc','Opulence 2pc'],    weapon:'Best Healing / HP weapon',                       statPrio:['HP%','Healing Bonus%','DEF%'],                    note:'Only character who can revive allies mid-battle. Prioritise HP% for better revive threshold.'},
  {name:'Minami Miyashita',codename:'Bui',     role:'Medic',      element:'Bless',    rarity:4, cards:['Peace 4pc','Virtue 2pc'],      weapon:'Best Healing weapon',                            statPrio:['HP%','Healing Bonus%','DEF%'],                    note:'Top healer — removes all status effects from the party.'},
  {name:'Lufel',           codename:'Lufel',   role:'Medic',      element:'Fire',     rarity:4, cards:['Peace 4pc','Victory 2pc'],     weapon:'Best Healing / ATK scaling weapon',              statPrio:['HP%','Healing Bonus%','ATK%'],                    note:'Best 4-star support. Heals scale with ATK so ATK% investment is worthwhile alongside HP%.'},
  {name:'Yui Yoshida',     codename:'Yui',     role:'Assassin',   element:'Electric', rarity:4, cards:['Courage 4pc','Valor 2pc'],     weapon:'Best Electric ATK weapon',                       statPrio:['ATK%','CRIT Rate%','Electric DMG%'],              note:'Single-target Electric DPS. Courage 4pc excels vs solo bosses.'},
  {name:'Vino',            codename:'Vino',    role:'Saboteur',   element:'Curse',    rarity:4, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best Curse debuff weapon',                       statPrio:['ATK%','SPD','DEF%'],                              note:'4★ Saboteur. Applies Curse debuffs to boost Curse DPS team output.'},
  {name:'Riddle',          codename:'Riddle',  role:'Strategist', element:'-',        rarity:4, cards:['Integrity 4pc','Opulence 2pc'], weapon:'Best SPD support weapon',                        statPrio:['ATK%','SPD','HP%'],                               note:'Speedster Strategist. Integrity 4pc sustains high action frequency.'},
  {name:'Cattle',          codename:'Cattle',  role:'Medic',      element:'Wind',     rarity:4, cards:['Abundance 4pc','Peace 2pc'],    weapon:'Best Healing weapon',                            statPrio:['HP%','Healing Bonus%','DEF%'],                    note:'Steady 4★ Healer. Provides consistent HP recovery for the party.'},
  {name:'Leon',            codename:'Leon',    role:'Guardian',   element:'Physical', rarity:4, cards:['Peace 4pc','Valor 2pc'],        weapon:'Best DEF weapon',                                statPrio:['HP%','DEF%','SPD'],                               note:'4★ Guardian. Reliable frontline tank, good for early-game progression.'},
  {name:'Closer',          codename:'Closer',  role:'Assassin',   element:'Physical', rarity:4, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Physical weapon',                           statPrio:['ATK%','CRIT Rate%','CRIT DMG%'],                  note:'4★ Physical Assassin. Focuses on finishing weakened enemies.'},
  {name:'Mont',            codename:'Mont',    role:'Guardian',   element:'Ice',      rarity:4, cards:['Peace 4pc','Opulence 2pc'],    weapon:'Best HP/DEF weapon',                             statPrio:['HP%','DEF%','SPD'],                               note:'4★ Ice Guardian. Ice-element tank with party mitigation.'},
  {name:'Soy',             codename:'Soy',     role:'Medic',      element:'Bless',    rarity:4, cards:['Abundance 4pc','Virtue 2pc'],   weapon:'Best Healing weapon',                            statPrio:['HP%','Healing Bonus%','DEF%'],                    note:'4★ Medic. Bless-element healer with team sustain capabilities.'},
  {name:'Yuki',            codename:'Yuki',    role:'Assassin',   element:'Electric', rarity:4, cards:['Courage 4pc','Valor 2pc'],      weapon:'Best Electric weapon',                           statPrio:['ATK%','CRIT Rate%','Electric DMG%'],              note:'4★ Electric Assassin. Solid single-target damage for Electric teams.'},
  {name:'Key',             codename:'Key',     role:'Saboteur',   element:'-',        rarity:4, cards:['Hindrance 4pc','Strife 2pc'],   weapon:'Best debuff weapon',                             statPrio:['ATK%','SPD','DEF%'],                              note:'4★ Saboteur. Applies debuffs to reduce enemy resistances.'},
  {name:'Moko',            codename:'Moko',    role:'Elucidator', element:'-',        rarity:4, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best Support weapon',                            statPrio:['HP%','SPD','DEF%'],                              note:'4★ Elucidator. Provides intel support and team utility.'},
  {name:'Sepia',           codename:'Sepia',   role:'Strategist', element:'-',        rarity:4, cards:['Integrity 4pc','Opulence 2pc'], weapon:'Best SPD support weapon',                        statPrio:['ATK%','SPD','HP%'],                               note:'4★ Strategist. Speed-based support that boosts team action frequency.'},
  {name:'Puppet',          codename:'Puppet',  role:'Elucidator', element:'-',        rarity:4, cards:['Abundance 4pc','Peace 2pc'],    weapon:'Best Support weapon',                            statPrio:['HP%','SPD','DEF%'],                              note:'4★ Elucidator. Navigator support with unique debuff mechanics.'},
  {name:'Okyann',          codename:'Okyann',  role:'Elucidator', element:'-',        rarity:4, cards:['Abundance 4pc','Opulence 2pc'], weapon:'Best Support weapon',                            statPrio:['HP%','SPD','DEF%'],                              note:'4★ Elucidator. Provides elemental resonance and damage amplification.'},
]

const BASE = 'https://lufel.net/apps/guides/data/assets/make-party/'
const ROLE_IMG = {
  Sweeper:    BASE + 'pasted-1772094048970.png',
  Assassin:   BASE + 'pasted-1772094055909.png',
  Strategist: BASE + 'pasted-1772094061413.png',
  Saboteur:   BASE + 'pasted-1772094196652.png',
  Guardian:   BASE + 'pasted-1772094066423.png',
  Medic:      BASE + 'pasted-1772094075911.png',
  Elucidator: BASE + 'pasted-1772094090247.png',
}
const BASE_PORTRAITS = import.meta.env.BASE_URL + 'portraits/'
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
  'Makoto Niijima':   BASE_PORTRAITS + 'makoto.webp',
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
  'Lufel':            BASE_PORTRAITS + 'lufel.webp',
  'Yui Yoshida':      BASE_PORTRAITS + 'yui.webp',
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
}
const ROLE_ICONS = {Sweeper:'🌊', Assassin:'⚔️', Medic:'💚', Guardian:'🛡️', Saboteur:'🎯', Strategist:'🎵', Elucidator:'📡', Virtuoso:'✨'}
const ELEM_COLORS = {Fire:'#ff4422',Ice:'#44aaff',Electric:'#ffee00',Wind:'#44ffaa',Nuclear:'#ff8800',Curse:'#aa44ff',Bless:'#ffcc44',Physical:'#ff8866','-':'#888888'}
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
  const [charName, setCharName] = useState('')
  const [legendOpen, setLegendOpen] = useState(false)
  const [stats, setStats] = useState({atk:0,crit:0,cdmg:0,hp:0,def:0,edm:0,heal:0,spd:0})
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copyOk, setCopyOk] = useState(false)

  const currentChar = CHARACTERS.find(c => c.name === charName) || null

  const filtered = CHARACTERS.filter(c => filter === 'all' || c.role === filter)

  const grouped5 = filtered.filter(c => c.rarity === 5)
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
    const ec = ELEM_COLORS[c.element] || '#888'
    const isActive = charName === c.name
    const starColor = c.rarity === 5 ? '#ffcc44' : c.rarity === 4 ? '#ccaa22' : '#aa8811'
    return (
      <div className={'char-card' + (isActive ? ' selected' : '')}
        onClick={() => setCharName(isActive ? '' : c.name)}>
        <div className="char-avatar-wrap">
          <div className="char-avatar" style={{ background: ec + '22', borderColor: ec }}>
            {PORTRAITS[c.name]
              ? <img src={PORTRAITS[c.name]} alt={c.codename} className="portrait"
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
        <div className="char-card-stars" style={{ color: starColor }}>{'★'.repeat(c.rarity)}</div>
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
        {/* BUILD REFERENCE */}
        <div className="section-box">
          <div className="section-title">📖 BUILD REFERENCE</div>

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

          <div className="char-grid-wrap">
            {grouped5.length > 0 && <div className="char-grid-label">⭐⭐⭐⭐⭐ 5-Star</div>}
            <div className="char-grid">
              {grouped5.map(c => <CharCard key={c.name} c={c} />)}
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

          {currentChar && (
            <div className="char-info active">
              <div className="char-header">
                <div className="char-header-portrait">
                  {PORTRAITS[currentChar.name]
                    ? <img src={PORTRAITS[currentChar.name]} alt={currentChar.codename} onError={e => e.target.style.display='none'} />
                    : <span>{ROLE_ICONS[currentChar.role]||'❓'}</span>}
                </div>
                <div className="char-title">
                  <div className="char-name">{currentChar.name}</div>
                  <div className="char-codename">{currentChar.codename}</div>
                  <div className="char-badges">
                    <span className={`cbadge rarity${currentChar.rarity}`}>{'★'.repeat(currentChar.rarity)} {currentChar.rarity}-Star</span>
                    <span className="cbadge role" style={{ borderColor: ROLE_COLORS[currentChar.role], color: ROLE_COLORS[currentChar.role] }}>{currentChar.role}</span>
                    <span className={`elem-${currentChar.element === '-' ? 'dash' : currentChar.element}`}>
                      {currentChar.element === '-' ? 'No Element' : currentChar.element}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-grid">
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
              </div>
            </div>
          )}
        </div>

        {/* STAT CALCULATOR */}
        <div className="section-box">
          <div className="section-title">🧮 STAT CALCULATOR</div>
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
      </div>

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
