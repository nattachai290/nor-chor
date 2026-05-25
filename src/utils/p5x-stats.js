import { CARD_SETS, CARD_SUB_STATS } from '../data/p5x-cards.js'
import { PASSIVE_STAT_MAP, SUB_STAT_KEY, SPACE_PASSIVE_RULES } from '../data/p5x-targets.js'

export const statLabels = {atk:'Attack %',crit:'Crit Rate',cdmg:'Crit Mult.',dmgMulti:'Damage Mult',hp:'HP %',def:'Defense %',heal:'Healing Effect',spd:'Speed',spr:'SP Recovery',ailm:'Ailment Accuracy',pierce:'Pierce Rate',dmgred:'Damage Reduction',dmgDown:'Damage Down'}
export const statFlat = new Set(['spd'])

export function parseHiddenAbility(str) {
  if (!str) return {}
  const s = {}
  const n = (re) => { const m = str.match(re); return m ? parseFloat(m[1]) : 0 }
  const atk  = n(/(?:Attack\s*%|ATK)\s*\+(\d+\.?\d*)/)
  const crit  = n(/Crit\s*Rate\s*\+(\d+\.?\d*)/i)
  const cdmg  = n(/Crit\s*Mult\.?\s*\+(\d+\.?\d*)/i)
  const hp    = n(/HP\s*%?\s*\+(\d+\.?\d*)/)
  const def   = n(/Defense\s*%\s*\+(\d+\.?\d*)/i)
  const heal  = n(/Healing\s*Effect\s*\+(\d+\.?\d*)/i)
  const spd   = n(/(?:Speed|SPD)\s*\+(\d+\.?\d*)/i)
  const ailm  = n(/Ailment\s*Accuracy\s*\+(\d+\.?\d*)/i)
  const spr   = n(/SP\s*Recovery\s*\+(\d+\.?\d*)/i)
  if (atk)  s.atk  = atk
  if (crit) s.crit = crit
  if (cdmg) s.cdmg = cdmg
  if (hp)   s.hp   = hp
  if (def)  s.def  = def
  if (heal) s.heal = heal
  if (spd)  s.spd  = spd
  if (ailm) s.ailm = ailm
  if (spr)  s.spr  = spr
  return s
}

export function parseWeaponBonusAtRefine(weapon, refine) {
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

export function computeStats(char, weaponIdx, refine = 0) {
  const s = {atk:0, crit: char?.baseStats?.crit || 0, cdmg: char?.baseStats?.cdmg || 0, hp:0, def:0, dmgMulti: char?.baseStats?.dmgMulti || 0, heal: char?.baseStats?.heal || 0, spd: char?.baseStats?.spd || 0, ailm: char?.baseStats?.ailm || 0, dmgred: char?.baseStats?.dmgred || 0, dmgDown: char?.baseStats?.dmgDown || 0}
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
  // A0 awareness stats (always active)
  const a0Stats = char.awareness?.[0]?.stats || {}
  Object.entries(a0Stats).forEach(([k,v]) => { s[k] = (s[k]||0)+v })
  return s
}

export function getSpacePassiveBonus(char, stats) {
  const fourPc = (char?.cards||[]).map(c => { const m=c.match(/^(.+?)\s+4pc$/i); return m?m[1].trim():null }).find(Boolean)
  const fn = SPACE_PASSIVE_RULES[fourPc]
  if (!fn) return {}
  const raw = fn(stats)
  return Object.fromEntries(Object.entries(raw).filter(([,v]) => v > 0))
}

export function scoreSpaceCard(card, charTargets, charCards, charElement, charElement2) {
  if (!charTargets) return 0
  let score = 0
  const charElements = [charElement, charElement2].filter(Boolean)
  const usedSets = (charCards || []).map(cs => {
    const m = cs.match(/^(.+?)\s+(2|4)pc$/i)
    return m ? m[1].trim() : null
  }).filter(Boolean)
  card.passives.forEach(p => {
    const { elements, ...statWeights } = PASSIVE_STAT_MAP[p.name] || {}
    if (elements && charElements.length > 0 && !elements.some(e => charElements.includes(e))) return
    Object.entries(statWeights).forEach(([k, w]) => {
      const target = charTargets[k]
      if (target && target[1] > 0) score += (target[1] / 25) * w
    })
    if (usedSets.includes(p.name)) score += 8
  })
  return score
}

export function getSubStatPriority(charTargets, slotId) {
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
