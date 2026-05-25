import { useState, useEffect } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────
import { CHARACTERS, RAINBOW_CHARS, PORTRAITS, SKILL_TYPE_IMG, ROLE_IMG, ELEM_IMG } from '../data/p5x-characters.js'
import { CARD_SETS, CARD_SLOTS, CARD_SUB_STATS, REVELATION_CARDS } from '../data/p5x-cards.js'
import {
  CHAR_STAT_TARGETS, PASSIVE_STAT_MAP, SUB_STAT_KEY,
  ROLE_ICONS, ELEM_COLORS, ROLE_COLORS,
  BOSS_PRESETS, STAT_TARGETS,
} from '../data/p5x-targets.js'
// ── Utils ─────────────────────────────────────────────────────────────────────
import {
  statLabels, statFlat,
  parseHiddenAbility, parseWeaponBonusAtRefine,
  computeStats, getSpacePassiveBonus, scoreSpaceCard, getSubStatPriority,
} from '../utils/p5x-stats.js'
// ── Components ────────────────────────────────────────────────────────────────
import CardSimulator from '../components/p5x/CardSimulator.jsx'
import WeaponPanel from '../components/p5x/WeaponPanel.jsx'

const statMap = {'Attack %':'atk','Crit Rate':'crit','Crit Mult.':'cdmg','HP %':'hp','Defense %':'def','Healing Effect':'heal','Speed':'spd','Damage Mult':'dmgMulti','Ailment Accuracy':'ailm'}

function getRoleArchetype(role) {
  if (role === 'Saboteur') return 'saboteur'
  if (role === 'Medic') return 'medic'
  if (role === 'Sweeper' || role === 'Assassin') return 'dps'
  return 'support'
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
  const [userStats, setUserStats] = useState({atk:0, crit:0, cdmg:0, dmgMulti:0, hp:0, def:0, heal:0, spd:0})
  const [skillLevel, setSkillLevel] = useState(3)
  const [skillMode, setSkillMode] = useState('both')
  const [charStage, setCharStage] = useState(null)
  const [openSpaceCard, setOpenSpaceCard] = useState(null)
  const [subAlloc, setSubAlloc] = useState({})
  const [mainStatSel, setMainStatSel] = useState({})
  const [simCardSet, setSimCardSet] = useState(null)
  const [simAwarenessLevel, setSimAwarenessLevel] = useState(0)

  useEffect(() => { if (charName) setMobileTab('detail') }, [charName])
  useEffect(() => { setUserStats({atk:0, crit:0, cdmg:0, dmgMulti:0, hp:0, def:0, heal:0, spd:0}); setCharStage(null); setOpenSpaceCard(null); setSubAlloc({}); setMainStatSel({}); setSimCardSet(null); setSimAwarenessLevel(0) }, [charName])

  const currentChar = CHARACTERS.find(c => c.name === charName) || null
  const charTgt = (() => {
    if (!currentChar) return null
    if (charStage && currentChar.statTargets?.[charStage]) return currentChar.statTargets[charStage]
    return CHAR_STAT_TARGETS[currentChar.codename] || null
  })()
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

  function filterSkillMode(text, mode) {
    if (!text || mode === 'both') return text
    const sections = text.split(/(?=\[(?:Spring|Winter)\])/g)
    if (sections.length <= 1) return text
    const tag = mode === 'spring' ? '[Spring]' : '[Winter]'
    const match = sections.find(s => s.startsWith(tag))
    return match ? match.replace(tag, '').trim() : text
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
  const dmgB = 1 + dmg.dmgMult / 100 + (stats.dmgMulti + dmg.extraEdm) / 100 + dmg.dmgTaken / 100
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
    const charTargets = charTgt
    const targets = charTargets || STAT_TARGETS[arch]
    const prioKeys = charTargets ? [] : currentChar.statPrio.map(p => {
      if (p.includes('DMG%') && !p.includes('CRIT')) return 'dmgMulti'
      return statMap[p] || null
    }).filter(Boolean)

    let totalWeight = 0, earnedScore = 0
    const breakdown = []
    const statKeys = ['atk','crit','cdmg','dmgMulti','hp','def','heal','spd','spr','ailm']
    statKeys.forEach(key => {
      const entry = targets[key]; if (!entry) return
      let [ideal, weight] = entry
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
                <button className={'char-tab-btn' + (charTab === 'sim'   ? ' active' : '')} onClick={() => setCharTab('sim')}>🎛️ Simulation</button>

                <div className="lang-toggle">
                  <button className={'lang-btn' + (lang === 'en' ? ' active' : '')} onClick={() => setLang('en')}>EN</button>
                  <button className={'lang-btn' + (lang === 'th' ? ' active' : '')} onClick={() => setLang('th')}>TH</button>
                </div>
              </div>

              {charTab === 'kit' && (
                <div className="kit-section">
                  {/* SKILLS */}
                  <div className="kit-block">
                    <div className="kit-block-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span>Skills</span>
                      <div className="slv-picker">
                        {SKILL_LEVEL_LABELS.map((l, i) => (
                          <button key={i} className={'slv-btn'+(skillLevel===i?' active':'')} onClick={()=>setSkillLevel(i)} title={['Skill LV10','LV10 + Mindscape 5','Skill LV13','LV13 + Mindscape 5'][i]}>{l}</button>
                        ))}
                      </div>
                    </div>
                    {(currentChar.skills||[]).some(sk => (sk.descTh||sk.desc||'').includes('[Spring]')) && (
                      <div style={{marginBottom:8}}>
                        <div className="slv-picker">
                          {[['both','All'],['spring','🌿 Spring'],['winter','❄️ Winter']].map(([v,l]) => (
                            <button key={v} className={'slv-btn'+(skillMode===v?' active':'')} onClick={()=>setSkillMode(v)}>{l}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {(currentChar.skills || []).length === 0
                      ? <div className="kit-empty">— ยังไม่มีข้อมูล</div>
                      : <div className="skill-grid">
                          {(currentChar.skills || []).map((sk, i) => {
                            const rawDesc = lang === 'th' && sk.descTh ? sk.descTh : sk.desc
                            const desc = filterSkillMode(resolveSkillLevel(rawDesc), skillMode)
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

                  {/* MINDSCAPE LV5 */}
                  {currentChar.mindscapeBonus && (
                    <div className="kit-block">
                      <div className="kit-block-title">Mindscape <span className="ha-lv">LV 5</span></div>
                      <div className="hidden-ability-box">
                        {Object.entries(currentChar.mindscapeBonus).map(([key, val]) => (
                          <div key={key}>{statLabels[key] || key} +{val}{statFlat.has(key) ? '' : '%'}</div>
                        ))}
                      </div>
                    </div>
                  )}

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

              {charTab === 'sim' && (
                <div className="kit-section">
                  {/* Simulation controls */}
                  <div className="info-panel" style={{marginBottom:8}}>
                    {/* Weapon */}
                    {currentChar.weapons && (
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:'0.7rem', color:'#aaa', marginBottom:4}}>⚔️ อาวุธ</div>
                        <select className="sim-sub-select"
                          value={selectedWeaponIdx ?? 0}
                          onChange={e => setSelectedWeaponIdx(parseInt(e.target.value) >= 0 ? parseInt(e.target.value) : -1)}>
                          <option value={-1}>— ไม่ใช้อาวุธ —</option>
                          {currentChar.weapons.map((w, i) => (
                            <option key={i} value={i}>{w.name}</option>
                          ))}
                        </select>
                        {(selectedWeaponIdx ?? 0) >= 0 && (
                          <div style={{display:'flex', gap:4, flexWrap:'wrap', marginTop:4}}>
                            {[1,2,3,4,5,6].map(r => (
                              <button key={r} className={'refine-btn'+(weaponRefine===r?' active':'')} onClick={() => setWeaponRefine(r)}>★{r}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Skill Level / charStage */}
                    <div style={{marginBottom: currentChar.awareness?.length ? 10 : 0}}>
                      <div style={{fontSize:'0.7rem', color:'#aaa', marginBottom:4}}>📊 Skill Level</div>
                      <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                        {(currentChar.statTargets ? Object.keys(currentChar.statTargets) : SKILL_LEVEL_LABELS).map((stage, i) => (
                          <button key={stage} className={'refine-btn'+((charStage===stage || (!charStage && i===0)) ? ' active':'')} onClick={() => setCharStage(stage)}>{stage}</button>
                        ))}
                      </div>
                    </div>
                    {/* Awareness level */}
                    {(currentChar.awareness||[]).length > 0 && (
                      <div>
                        <div style={{fontSize:'0.7rem', color:'#aaa', marginBottom:4}}>🧬 Awareness (A)</div>
                        <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                          {(currentChar.awareness||[]).map((aw, i) => (
                            <button key={i} className={'refine-btn'+(simAwarenessLevel===i?' active':'')}
                              onClick={() => setSimAwarenessLevel(i)}>
                              A{aw.stage ?? i}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <CardSimulator
                    charTgt={charTgt}
                    currentChar={currentChar}
                    charStage={charStage}
                    selectedWeaponIdx={selectedWeaponIdx}
                    weaponRefine={weaponRefine}
                    subAlloc={subAlloc}
                    setSubAlloc={setSubAlloc}
                    mainStatSel={mainStatSel}
                    setMainStatSel={setMainStatSel}
                    simCardSet={simCardSet}
                    setSimCardSet={setSimCardSet}
                    simAwarenessLevel={simAwarenessLevel}
                  />
                  <div className="info-panel" style={{marginTop:8}}>
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
                      <div className="sum-box"><div className="sum-val">{totalStats.atk.toFixed(1)}%</div><div className="sum-lbl">Attack %</div></div>
                      <div className="sum-box"><div className="sum-val">{Math.min(totalStats.crit, 100).toFixed(1)}%</div><div className="sum-lbl">CRIT Rate</div></div>
                      <div className="sum-box"><div className="sum-val">{totalStats.cdmg.toFixed(1)}%</div><div className="sum-lbl">CRIT DMG</div></div>
                      <div className="sum-box"><div className="sum-val">{totalStats.dmgMulti.toFixed(1)}%</div><div className="sum-lbl">Damage Mult</div></div>
                      <div className="sum-box"><div className="sum-val">+{effHp}%</div><div className="sum-lbl">Eff.HP %</div></div>
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
                  </div>
                </div>
              )}

              {charTab === 'build' && <div className="info-grid">
                <div className="info-panel">
                  <div className="info-label">🎴 Revelation Card — Main Stats แนะนำ</div>
                  <div className="slot-guide">
                    {CARD_SLOTS.filter(slot => slot.mainStats.some(({key}) => key !== null)).map(slot => {
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
                    const ranked = REVELATION_CARDS.Space
                      .map(card => ({ card, score: scoreSpaceCard(card, charTgt, currentChar.cards, currentChar.element, currentChar.element2, currentChar.role) }))
                      .sort((a, b) => b.score - a.score)
                      .filter((item, i) => i === 0 || item.score > 0)
                      .slice(0, 3)
                    return (
                      <div className="rec-cards-list">
                        {ranked.map(({card}, ri) => {
                          const medals = ['🥇','🥈','🥉']
                          const isOpen = openSpaceCard === card.name
                          const usedSets = (currentChar.cards || []).map(cs => { const m = cs.match(/^(.+?)\s+(2|4)pc$/i); return m ? m[1].trim() : null }).filter(Boolean)
                          const usedSetsPc = Object.fromEntries((currentChar.cards || []).map(cs => { const m = cs.match(/^(.+?)\s+(2|4)pc$/i); return m ? [m[1].trim(), parseInt(m[2])] : null }).filter(Boolean))
                          const charElements = [currentChar.element, currentChar.element2].filter(Boolean)
                          return (
                            <div key={card.name} className={'rec-card-item' + (ri === 0 ? ' rec-top' : '')}>
                              <div className="rec-card-header" style={{cursor:'pointer'}} onClick={() => setOpenSpaceCard(isOpen ? null : card.name)}>
                                <span className="rec-medal">{medals[ri]}</span>
                                <span className="rec-card-name">{card.name}</span>
                                <div className="rec-passives" style={{flex:1}}>
                                  {card.passives.map(p => {
                                    const { elements: pElements, ...pStatWeights } = PASSIVE_STAT_MAP[p.name] || {}
                                    const elementOk = !pElements || charElements.length === 0 || pElements.some(e => charElements.includes(e))
                                    const relevant = charTgt && elementOk && (Object.keys(pStatWeights).some(k => charTgt[k]?.[1] > 0) || usedSets.includes(p.name))
                                    return (
                                      <span key={p.name} className={'rec-passive' + (relevant ? ' rec-passive-hit' : '')}>
                                        {p.name}
                                      </span>
                                    )
                                  })}
                                </div>
                                <span className="rec-toggle-arrow">{isOpen ? '▲' : '▼'}</span>
                              </div>
                              {isOpen && (
                                <div className="rec-card-detail">
                                  {card.passives.map(p => {
                                    const { elements: pElements, ...pStatWeights } = PASSIVE_STAT_MAP[p.name] || {}
                                    const elementOk = !pElements || charElements.length === 0 || pElements.some(e => charElements.includes(e))
                                    const relevant = charTgt && elementOk && (Object.keys(pStatWeights).some(k => charTgt[k]?.[1] > 0) || usedSets.includes(p.name))
                                    const setData = CARD_SETS.find(cs => cs.name.toLowerCase() === p.name.toLowerCase())
                                    const whyReasons = []
                                    if (usedSets.includes(p.name)) whyReasons.push(`มี ${p.name} ${usedSetsPc[p.name]}pc ในบิลด์`)
                                    if (charTgt && elementOk) {
                                      const matchedStats = Object.keys(pStatWeights).filter(k => charTgt[k]?.[1] > 0)
                                      if (matchedStats.length) whyReasons.push(`เพิ่ม ${matchedStats.map(k => statLabels[k]||k).join(', ')}`)
                                    }
                                    return (
                                      <div key={p.name} className={'rec-detail-row' + (relevant ? ' rec-detail-hit' : '')}>
                                        <span className="rec-detail-name">{p.name}</span>
                                        {relevant && whyReasons.length > 0 && (
                                          <span className="rec-detail-why">{whyReasons.join(' · ')}</span>
                                        )}
                                        <span className="rec-detail-desc">{lang === 'th' && p.descTh ? p.descTh : p.desc}</span>
                                        {setData && (
                                          <div className="rec-detail-set">
                                            <div className={'rec-detail-set-line' + ((usedSetsPc[p.name] ?? 0) >= 2 ? ' rec-detail-set-active' : '')}>
                                              <span className="rec-detail-set-badge">2pc</span>{setData.bonus2}
                                            </div>
                                            {setData.bonus4 && (
                                              <div className={'rec-detail-set-line' + ((usedSetsPc[p.name] ?? 0) >= 4 ? ' rec-detail-set-active rec-detail-set-4pc-active' : '')}>
                                                <span className={'rec-detail-set-badge rec-detail-set-4pc'}>4pc</span>{setData.bonus4}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>


                {/* ── STAT REQUIREMENTS FROM CARDS ─────────────────────────── */}
                {(() => {
                  if (!charTgt) return null
                  const entries = Object.entries(charTgt).filter(([,[,w]]) => w > 0)
                  if (!entries.length) return null
                  const STAT_LABELS = {
                    atk:'Attack %', crit:'Crit Rate', cdmg:'Crit Mult.',
                    dmgMulti:'Damage Mult', hp:'HP %', def:'Defense %',
                    heal:'Healing Effect', spd:'Speed', spr:'SP Recovery',
                    ailm:'Ailment Accuracy', pierce:'Pierce Rate'
                  }
                  const selW = currentChar.weapons?.[selectedWeaponIdx ?? 0]
                  const msBonus = (charStage?.includes('M5') && currentChar.mindscapeBonus) ? currentChar.mindscapeBonus : {}
                  const applyMs = (raw) => {
                    const all = {...raw}
                    Object.keys(msBonus).forEach(k => { all[k] = (all[k]||0) + msBonus[k] })
                    return all
                  }
                  const base0raw = applyMs(computeStats(currentChar, selectedWeaponIdx ?? 0, weaponRefine))
                  const spacePassiveB = getSpacePassiveBonus(currentChar, base0raw)
                  const sunKissedB = (() => {
                    if (!currentChar?.skills?.some(s => s.name === 'Sun-kissed Blooms')) return {}
                    const spr = base0raw.spr || 0
                    const v = parseFloat((84 * Math.min(spr, 450) / 450).toFixed(1))
                    return v > 0 ? { cdmg: v } : {}
                  })()
                  const base0 = {...base0raw}
                  Object.entries(spacePassiveB).forEach(([k,v]) => { base0[k] = (base0[k]||0)+v })
                  Object.entries(sunKissedB).forEach(([k,v]) => { base0[k] = (base0[k]||0)+v })
                  return (
                    <div className="info-panel">
                      <div className="info-label" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <span>📊 Stat Requirements</span>
                        {currentChar.statTargets && (
                          <div className="refine-picker" style={{flexWrap:'wrap',gap:4}}>
                            <button className={'refine-btn'+(!charStage?' active':'')} onClick={() => setCharStage(null)}>Default</button>
                            {Object.keys(currentChar.statTargets).map(stage => (
                              <button key={stage} className={'refine-btn'+(charStage===stage?' active':'')} onClick={() => setCharStage(stage)}>{stage}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="req-table">
                        <div className="req-row req-hdr">
                          <span>Stat</span>
                          <span>เป้าหมาย</span>
                          <span>มีแล้ว</span>
                          <span>ต้องการจาก card</span>
                        </div>
                        {entries.map(([k,[ideal]]) => {
                          const b0 = base0[k] || 0
                          const need = Math.max(0, ideal - b0)
                          const fmt = v => k === 'spd' ? Math.round(v) : Math.floor(v) + '%'
                          const cls = need===0?'req-met':need<30?'req-close':'req-far'
                          const floor = currentChar.statFloor?.[k]
                          return (
                            <div key={k} className="req-row">
                              <span className="req-c-stat">{STAT_LABELS[k]||k}</span>
                              <span className="req-c-tgt">
                                {floor ? <>{fmt(floor)}<span style={{color:'#666',margin:'0 2px'}}>→</span>{fmt(ideal)}</> : fmt(ideal)}
                              </span>
                              <span className="req-c-base">{fmt(b0)}</span>
                              <span className={`req-c-need ${cls}`}>{fmt(need)}</span>
                            </div>
                          )
                        })}
                      </div>
                      {(() => {
                        const fmtStat = (k, v) => k === 'spd' ? `+${Math.round(v)}` : `+${(Math.floor(v*10)/10).toFixed(1)}%`
                        const trackedKeys = new Set(entries.map(([k]) => k))
                        const sources = []
                        currentChar.cards.forEach(cardStr => {
                          const m = cardStr.match(/^(.+?)\s+(2|4)pc$/i)
                          if (!m) return
                          const setName = m[1].trim(), pc = parseInt(m[2])
                          const setData = CARD_SETS.find(cs => cs.name.toLowerCase() === setName.toLowerCase())
                          if (!setData) return
                          const contrib = {}
                          if (setData.stats2) Object.entries(setData.stats2).forEach(([k,v]) => { if (trackedKeys.has(k)) contrib[k] = (contrib[k]||0)+v })
                          if (pc >= 4 && setData.stats4) Object.entries(setData.stats4).forEach(([k,v]) => { if (trackedKeys.has(k)) contrib[k] = (contrib[k]||0)+v })
                          if (Object.keys(contrib).length) sources.push({ label:`${setName} ${pc}pc`, contrib })
                        })
                        const wStats = parseWeaponBonusAtRefine(currentChar.weapons?.[selectedWeaponIdx ?? 0], weaponRefine)
                        const wContrib = Object.fromEntries(Object.entries(wStats).filter(([k]) => trackedKeys.has(k)))
                        const wName = currentChar.weapons?.[selectedWeaponIdx ?? 0]?.name
                        if (wName && Object.keys(wContrib).length) sources.push({ label:`${wName} ${weaponRefine}★`, contrib:wContrib })
                        const hStats = parseHiddenAbility(currentChar.hiddenAbility)
                        const hContrib = Object.fromEntries(Object.entries(hStats).filter(([k]) => trackedKeys.has(k)))
                        if (Object.keys(hContrib).length) sources.push({ label:'Hidden ability', contrib:hContrib })
                        const a0Stats = currentChar.awareness?.[0]?.stats || {}
                        const a0Contrib = Object.fromEntries(Object.entries(a0Stats).filter(([k]) => trackedKeys.has(k)))
                        const a0Name = currentChar.awareness?.[0]?.name
                        if (a0Name && Object.keys(a0Contrib).length) sources.push({ label:`A0: ${a0Name}`, contrib:a0Contrib })
                        if (Object.keys(msBonus).length) {
                          const mContrib = Object.fromEntries(Object.entries(msBonus).filter(([k]) => trackedKeys.has(k)))
                          if (Object.keys(mContrib).length) sources.push({ label:'Mindscape (M5)', contrib:mContrib })
                        }
                        const spContrib = Object.fromEntries(Object.entries(spacePassiveB).filter(([k]) => trackedKeys.has(k)))
                        if (Object.keys(spContrib).length) {
                          const fourPcName = (currentChar.cards||[]).map(c=>{const m=c.match(/^(.+?)\s+4pc$/i);return m?m[1].trim():null}).find(Boolean)
                          sources.push({ label:`${fourPcName} Space passive`, contrib:spContrib })
                        }
                        const skContrib = Object.fromEntries(Object.entries(sunKissedB).filter(([k]) => trackedKeys.has(k)))
                        if (Object.keys(skContrib).length) sources.push({ label:'Sun-kissed Blooms', contrib:skContrib })
                        if (!sources.length) return null
                        // Group by stat key
                        const byKey = {}
                        sources.forEach(({ label, contrib }) => {
                          Object.entries(contrib).forEach(([k, v]) => {
                            if (!byKey[k]) byKey[k] = []
                            byKey[k].push({ label, v })
                          })
                        })
                        return (
                          <div className="req-sources">
                            <div className="req-sources-title">แหล่งที่มาของ "มีแล้ว" (set bonus + weapon + hidden — ไม่รวม base stat)</div>
                            {entries.filter(([k]) => byKey[k]).map(([k]) => (
                              <div key={k} className="req-source-row">
                                <span className="req-source-label">{STAT_LABELS[k]||k}</span>
                                <span className="req-source-vals">
                                  {byKey[k].map(({label, v}) => `${label} ${fmtStat(k,v)}`).join('  ·  ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )
                })()}

                <WeaponPanel
                  currentChar={currentChar}
                  selectedWeaponIdx={selectedWeaponIdx}
                  setSelectedWeaponIdx={setSelectedWeaponIdx}
                  weaponRefine={weaponRefine}
                  setWeaponRefine={setWeaponRefine}
                  lang={lang}
                />

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
                  <div className="note-box">{lang === 'th' && currentChar.mechanics ? currentChar.mechanics : currentChar.note}</div>
                </div>

                {lang === 'en' && currentChar.mechanics && (
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

          {/* Export / Import */}
          <div style={{ borderTop: '1px solid var(--p5x-border)', marginTop: 12, paddingTop: 12 }}>
            <div className="p5x-btn-row">
              <button className="btn-p5x btn-p5x-export" onClick={() => setShowExport(true)}>📤 Export JSON</button>
              <button className="btn-p5x btn-p5x-import" onClick={() => setShowImport(true)}>📥 Import JSON</button>
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
