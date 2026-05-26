import { useState, useEffect } from 'react'
import { CARD_SETS, CARD_SLOTS, CARD_SUB_STATS, REVELATION_CARDS } from '../../data/p5x-cards.js'
import { SUB_STAT_KEY } from '../../data/p5x-targets.js'
import { computeStats, getSpacePassiveBonus, statLabels, parseHiddenAbility } from '../../utils/p5x-stats.js'

export default function CardSimulator({
  charTgt,
  currentChar,
  charStage,
  selectedWeaponIdx,
  weaponRefine,
  subAlloc,
  setSubAlloc,
  mainStatSel,
  setMainStatSel,
  simCardSet,
  setSimCardSet,
  simAwarenessLevel = 0,
}) {
  // subSlots[cardSlotId] = [statKey|null, statKey|null, statKey|null, statKey|null]
  const [subSlots, setSubSlots] = useState({})
  const [expandedStats, setExpandedStats] = useState({})
  const [simSpaceCard, setSimSpaceCard] = useState(null)
  const [subEditing, setSubEditing] = useState({})
  const [inclCombatBuff, setInclCombatBuff] = useState(false)

  useEffect(() => {
    if (Object.keys(subAlloc).length === 0) setSubEditing({})
  }, [subAlloc])

  if (!charTgt) return null
  const simEntries = Object.entries(charTgt).filter(([,[,w]]) => w > 0)
  if (!simEntries.length) return null

  const msBonus = (charStage?.includes('M5') && currentChar?.mindscapeBonus) ? currentChar.mindscapeBonus : {}
  const charDefaultSet = (currentChar.cards||[]).find(c => c.includes('4pc'))?.replace(' 4pc','') || null
  const activeSet = simCardSet || charDefaultSet
  const charForSim = activeSet && activeSet !== charDefaultSet
    ? {...currentChar, cards: [activeSet + ' 4pc']}
    : currentChar
  const base0 = (() => {
    const s = computeStats(charForSim, selectedWeaponIdx ?? 0, weaponRefine)
    const all = {...s}
    Object.keys(msBonus).forEach(k => { all[k] = (all[k]||0) + msBonus[k] })
    for (let i = 1; i <= (simAwarenessLevel ?? 0); i++) {
      const awStats = charForSim.awareness?.[i]?.stats || {}
      Object.entries(awStats).forEach(([k,v]) => { all[k] = (all[k]||0)+v })
    }
    return all
  })()
  const baseNoWeapon = (() => {
    const s = computeStats(charForSim, -1, 0)
    const all = {...s}
    Object.keys(msBonus).forEach(k => { all[k] = (all[k]||0) + msBonus[k] })
    for (let i = 1; i <= (simAwarenessLevel ?? 0); i++) {
      const awStats = charForSim.awareness?.[i]?.stats || {}
      Object.entries(awStats).forEach(([k,v]) => { all[k] = (all[k]||0)+v })
    }
    return all
  })()

  const SLOT_IDS = ['Space','Sun','Moon','Star','Sky']
  const subUnit = (lbl) => (lbl==='HP'||lbl==='Attack'||lbl==='Defense'||lbl==='Speed') ? '' : '%'

  const totalRollsForSlot = (alloc, slotId) =>
    Object.values(alloc).reduce((s, perSlot) => s + (perSlot[slotId] || 0), 0)

  const bump = (k, slotId, delta) =>
    setSubAlloc(prev => {
      const cur = prev[k] || {}
      const curRolls = cur[slotId] || 0
      if (delta > 0 && totalRollsForSlot(prev, slotId) >= 4) return prev
      return {...prev, [k]: {...cur, [slotId]: Math.max(0, curRolls + delta)}}
    })

  const setPct = (k, slotId, pctStr, tier1) =>
    setSubAlloc(prev => {
      const cur = prev[k] || {}
      const curRolls = cur[slotId] || 0
      const otherRolls = totalRollsForSlot(prev, slotId) - curRolls
      const maxRolls = 4 - otherRolls
      const newRolls = Math.max(0, Math.min(maxRolls, Math.round((parseFloat(pctStr) || 0) / tier1)))
      return {...prev, [k]: {...cur, [slotId]: newRolls}}
    })

  const getCardSlots = (slotId) => subSlots[slotId] || [null, null, null, null]

  const setSlotStat = (cardSlotId, slotIdx, newKey) => {
    const current = getCardSlots(cardSlotId)
    const oldKey = current[slotIdx]

    if (oldKey && oldKey !== newKey) {
      setSubAlloc(prev => ({...prev, [oldKey]: {...(prev[oldKey]||{}), [cardSlotId]: 0}}))
    }

    const newSlots = [...current]
    if (newKey) {
      const dupIdx = current.findIndex((k, i) => k === newKey && i !== slotIdx)
      if (dupIdx !== -1) newSlots[dupIdx] = null
    }
    newSlots[slotIdx] = newKey || null
    setSubSlots(prev => ({...prev, [cardSlotId]: newSlots}))
  }

  const mainFromSel = {}
  Object.entries(mainStatSel).forEach(([slotId, label]) => {
    if (!label) return
    const slot = CARD_SLOTS.find(s => s.id === slotId)
    const ms = slot?.mainStats.find(m => m.label === label)
    if (ms?.key) mainFromSel[ms.key] = (mainFromSel[ms.key]||0) + ms.max
  })

  const subFromAlloc = {}
  simEntries.forEach(([k]) => {
    subFromAlloc[k] = SLOT_IDS.reduce((sum, slotId) => {
      const rolls = (subAlloc[k]||{})[slotId] || 0
      const pool = slotId==='Space' ? CARD_SUB_STATS.Space : CARD_SUB_STATS._other
      const t1 = Object.entries(pool).find(([l]) => SUB_STAT_KEY[l]===k)?.[1]?.[0] || 0
      return sum + t1 * rolls
    }, 0)
  })

  const fmt = (k, v) => k === 'spd' ? Math.floor(v) : Math.floor(v) + '%'

  const totalSpr = (base0.spr||0) + (mainFromSel.spr||0) + (subFromAlloc.spr||0)
  const spPerCast = 16 * (1 + totalSpr / 100)
  const sp2Round = spPerCast * 2
  const hasSunKissed = currentChar?.skills?.some(s => s.name === 'Sun-kissed Blooms')
  const sunKissedCdmg = hasSunKissed ? parseFloat((84 * Math.min(totalSpr, 450) / 450).toFixed(1)) : 0
  const simSpacePassive = getSpacePassiveBonus(charForSim, {spr: totalSpr})
  const spacePassiveName = (charForSim?.cards||[])
    .map(c => { const m = c.match(/^(.+?)\s+4pc$/i); return m ? m[1].trim() : null })
    .find(Boolean) || 'passive'

  // Combat buff logic for summary section
  const cbTypes = new Set((currentChar?.combatBuffs||[]).map(b => b.type).filter(Boolean))
  const hasCombatBuffs = (currentChar?.combatBuffs||[]).length > 0

  // Static combat buffs (no .type, has .stats) — only applied when toggled
  const staticCombatBuffStats = {}
  if (inclCombatBuff) {
    ;(currentChar?.combatBuffs||[]).forEach(b => {
      if (!b.type && b.stats) {
        Object.entries(b.stats).forEach(([k,v]) => { staticCombatBuffStats[k] = (staticCombatBuffStats[k]||0) + v })
      }
    })
  }

  return (
    <div className="info-panel">
      <div className="info-label">🎛️ จำลอง Card Stats</div>

      {/* Per-card blocks */}
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {CARD_SLOTS.map(slot => {
          const pool = slot.id==='Space' ? CARD_SUB_STATS.Space : CARD_SUB_STATS._other
          const usedRolls = totalRollsForSlot(subAlloc, slot.id)
          const full = usedRolls >= 4
          const cardSlots = getCardSlots(slot.id)

          const poolOptions = Object.entries(pool).map(([label, tiers]) => ({
            key: SUB_STAT_KEY[label],
            label,
            t1: tiers[0],
            unit: subUnit(label),
          })).filter(o => o.key)

          return (
            <div key={slot.id} className="sim-card-block">
              <div className="sim-card-header">
                <span className="sim-card-name">{slot.id}</span>
                <span className={full ? 'sim-card-sub-count full' : 'sim-card-sub-count'}>{usedRolls}/4 rolls</span>
              </div>

              {/* Card Set selector — Space only */}
              {slot.id === 'Space' && (() => {
                const defaultSpaceCard = REVELATION_CARDS.Space.find(sc =>
                  sc.passives.some(p => p.name === charDefaultSet)
                )?.name || null
                const activeSpaceCardName = simSpaceCard || defaultSpaceCard
                const activeSpaceCard = REVELATION_CARDS.Space.find(sc => sc.name === activeSpaceCardName)
                return (
                  <div style={{marginBottom:8, display:'flex', flexDirection:'column', gap:4}}>
                    <div>
                      <div style={{fontSize:'0.6rem', color:'#fff', marginBottom:3}}>Space Card</div>
                      <select className="sim-sub-select"
                        value={activeSpaceCardName || ''}
                        onChange={e => {
                          setSimSpaceCard(e.target.value || null)
                          setSimCardSet(null)
                        }}
                      >
                        <option value="">— เลือก Space Card —</option>
                        {REVELATION_CARDS.Space.map(sc => (
                          <option key={sc.name} value={sc.name}>
                            {sc.name}{sc.name === defaultSpaceCard ? ' (default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {activeSpaceCard && (
                      <div>
                        <div style={{fontSize:'0.6rem', color:'#fff', marginBottom:3}}>Passive (4pc)</div>
                        <select className="sim-sub-select"
                          value={simCardSet || (activeSpaceCard.passives.some(p => p.name === charDefaultSet) ? charDefaultSet : '') || ''}
                          onChange={e => setSimCardSet(e.target.value || null)}
                        >
                          <option value="">— เลือก passive —</option>
                          {activeSpaceCard.passives.map(p => (
                            <option key={p.name} value={p.name}>
                              {p.name}{p.name === charDefaultSet ? ' (default)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Main stat — hide for Space/Sun (key:null = fixed flat stats) */}
              {slot.mainStats.some(ms => ms.key !== null) && (
                <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:8}}>
                  <button className={'refine-btn' + (!mainStatSel[slot.id] ? ' active' : '')}
                    onClick={() => setMainStatSel(p => ({...p, [slot.id]: null}))}>—</button>
                  {slot.mainStats.map(ms => (
                    <button key={ms.label}
                      className={'refine-btn' + (mainStatSel[slot.id]===ms.label ? ' active' : '')}
                      onClick={() => setMainStatSel(p => ({...p, [slot.id]: ms.label}))}>
                      {ms.label} +{ms.max}{ms.unit}
                    </button>
                  ))}
                </div>
              )}

              {/* Sub stats — 4 dropdown rows */}
              <div style={{display:'flex', flexDirection:'column', gap:3}}>
                {[0,1,2,3].map(i => {
                  const selKey = cardSlots[i]
                  const opt = selKey ? poolOptions.find(o => o.key === selKey) : null
                  const rolls = selKey ? ((subAlloc[selKey]||{})[slot.id] || 0) : 0
                  const editKey = selKey ? `${selKey}-${slot.id}` : null
                  const curPct = opt ? +(rolls * opt.t1).toFixed(1) : 0
                  const displayVal = editKey && editKey in subEditing ? subEditing[editKey] : curPct
                  return (
                    <div key={i} className={'sim-sub-row' + (selKey ? ' locked' : '')}>
                      <select
                        className="sim-sub-select"
                        value={selKey || ''}
                        onChange={e => setSlotStat(slot.id, i, e.target.value || null)}
                      >
                        <option value="">—</option>
                        {poolOptions.map(o => (
                          <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                      </select>
                      {selKey && opt ? (
                        <>
                          <button className="alloc-btn" onClick={() => bump(selKey, slot.id, -1)} disabled={rolls===0}>−</button>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="alloc-num-input"
                            value={displayVal}
                            onChange={e => setSubEditing(prev => ({...prev, [editKey]: e.target.value}))}
                            onBlur={e => {
                              setPct(selKey, slot.id, e.target.value, opt.t1)
                              setSubEditing(prev => { const n={...prev}; delete n[editKey]; return n })
                            }}
                          />
                          <span className="alloc-unit">{opt.unit || ''}</span>
                          <button className="alloc-btn" onClick={() => bump(selKey, slot.id, +1)} disabled={full && rolls===0}>+</button>
                          <span className="alloc-hint">/{opt.t1}{opt.unit}</span>
                        </>
                      ) : (
                        <span className="alloc-hint" style={{marginLeft:4}}>เลือก sub stat</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div style={{marginTop:12, borderTop:'1px solid #333', paddingTop:8}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
          <div className="alloc-section-label" style={{margin:0}}>สรุป</div>
          {hasCombatBuffs && (
            <button
              className={'refine-btn'+(inclCombatBuff?' active':'')}
              onClick={() => setInclCombatBuff(v => !v)}
              style={{fontSize:'0.6rem'}}>
              + Combat Buff
            </button>
          )}
        </div>
        {simEntries.map(([k, [ideal]]) => {
          const simSpacePassiveVal = simSpacePassive[k] || 0
          const sunKissedVal_raw = (k==='cdmg' && hasSunKissed) ? sunKissedCdmg : 0
          // Typed combat buffs: only include when toggled
          const spacePassiveVal = cbTypes.has('spacePassiveB') ? (inclCombatBuff ? simSpacePassiveVal : 0) : simSpacePassiveVal
          const sunKissedVal    = cbTypes.has('sunKissedB')    ? (inclCombatBuff ? sunKissedVal_raw   : 0) : sunKissedVal_raw
          const staticBuffVal   = staticCombatBuffStats[k] || 0
          const subVal  = subFromAlloc[k] || 0
          const mainVal = mainFromSel[k] || 0
          const baseVal = base0[k] || 0
          const total = baseVal + mainVal + subVal + spacePassiveVal + sunKissedVal + staticBuffVal
          const reach = total >= ideal

          const weaponVal = baseVal - (baseNoWeapon[k] || 0)
          const charParts = []
          const baseStatV = charForSim.baseStats?.[k] || 0
          if (baseStatV !== 0) charParts.push({label:'base', val:baseStatV, color:'#aaaaaa'})
          charForSim.cards.forEach(cardStr => {
            const m = cardStr.match(/^(.+?)\s+(2|4)pc$/i)
            if (!m) return
            const sn = m[1].trim(), pc = parseInt(m[2])
            const sd = CARD_SETS.find(cs => cs.name.toLowerCase() === sn.toLowerCase())
            if (!sd) return
            let v = 0
            if (sd.stats2?.[k]) v += sd.stats2[k]
            if (pc >= 4 && sd.stats4?.[k]) v += sd.stats4[k]
            if (v !== 0) charParts.push({label:`${sn} ${pc}pc`, val:v, color:'#88ffcc'})
          })
          const hiddenV = parseHiddenAbility(charForSim.hiddenAbility)?.[k] || 0
          if (hiddenV) charParts.push({label:'Hidden ability', val:hiddenV, color:'#cc88ff'})
          const a0Stats = charForSim.awareness?.[0]?.stats || {}
          if (a0Stats[k]) charParts.push({label:`A0: ${charForSim.awareness[0].name}`, val:a0Stats[k], color:'#ffcc88'})
          for (let awI = 1; awI <= (simAwarenessLevel ?? 0); awI++) {
            const aw = charForSim.awareness?.[awI]
            if (aw?.stats?.[k]) charParts.push({label:`A${aw.stage??awI}: ${aw.name}`, val:aw.stats[k], color:'#ffcc88'})
          }
          const msV = msBonus[k] || 0
          if (msV) charParts.push({label:'Mindscape M5', val:msV, color:'#ff88ff'})
          const staticBuffParts = inclCombatBuff
            ? (currentChar?.combatBuffs||[]).filter(b => !b.type && b.stats && b.stats[k]).map(b => ({
                label: b.name, val: b.stats[k], color: '#ff88aa', show: true
              }))
            : []
          const parts = [
            ...charParts.map(p => ({...p, show: true})),
            {label: 'อาวุธ',          val: weaponVal,       color: '#ffaa66', show: weaponVal !== 0},
            {label: 'main stat',      val: mainVal,         color: '#8888ff', show: mainVal > 0},
            {label: 'sub stat',       val: subVal,          color: '#88ccff', show: subVal > 0},
            {label: spacePassiveName, val: spacePassiveVal,  color: '#88ffcc', show: spacePassiveVal > 0},
            {label: 'Sun-kissed',     val: sunKissedVal,     color: '#ffcc44', show: sunKissedVal > 0},
            ...staticBuffParts,
          ]

          const isExpanded = expandedStats[k]
          const visibleParts = parts.filter(p => p.show !== false)
          return (
            <div key={k} style={{marginBottom:6}}>
              <div
                style={{display:'flex', alignItems:'center', gap:4, cursor:'pointer', userSelect:'none'}}
                onClick={() => setExpandedStats(prev => ({...prev, [k]: !prev[k]}))}
              >
                <span className="alloc-stat" style={{minWidth:80}}>{statLabels[k]||k}</span>
                <span style={{fontSize:'0.6rem', color:'#666', marginLeft:2}}>{isExpanded ? '▲' : '▼'}</span>
                <span style={{color: reach?'#00ff88':'#ff7a8a', fontWeight:700, fontSize:'0.85rem', marginLeft:'auto'}}>{fmt(k,total)}</span>
                <span style={{color:'#fff', fontSize:'0.68rem', minWidth:44, textAlign:'right'}}>/{fmt(k,ideal)}</span>
              </div>
              {isExpanded && (
                <div style={{display:'flex', flexDirection:'column', gap:2, paddingLeft:4, marginTop:3, borderLeft:'2px solid #333'}}>
                  {visibleParts.map(p => (
                    <span key={p.label} style={{fontSize:'0.65rem'}}>
                      <span style={{color:'#888'}}>{p.label}</span>
                      <span style={{color: p.color, fontWeight:600, marginLeft:4}}>{fmt(k, p.val)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* SPR & Sun-kissed summaries */}
      {charTgt?.spr && (
        <div className="alloc-spr-summary" style={{marginTop:8}}>
          <span>SP Recovery {Math.floor(totalSpr)}%</span>
          <span className="alloc-spr-arrow">→</span>
          <span>SP/cast {spPerCast.toFixed(1)}</span>
          <span className="alloc-spr-arrow">→</span>
          <span className={sp2Round>=200?'alloc-spr-ok':sp2Round>=150?'alloc-spr-warn':'alloc-spr-bad'}>
            2 round = {sp2Round.toFixed(1)} SP {sp2Round>=200?'✓ (tier 150+)':sp2Round>=150?'✓ (tier 150+)':sp2Round>=100?'△ (tier 100+)':'✗'}
          </span>
        </div>
      )}
      {hasSunKissed && (
        <div className="alloc-spr-summary" style={{marginTop:4}}>
          <span>Sun-kissed Blooms</span>
          <span className="alloc-spr-arrow">→</span>
          <span className={totalSpr>=450?'alloc-spr-ok':'alloc-spr-warn'}>
            CRIT DMG +{sunKissedCdmg}% {totalSpr>=450?'✓ (cap 450%)':`(${Math.floor(totalSpr)}/450%)`}
          </span>
        </div>
      )}
      <div className="req-note" style={{marginTop:6}}>tier 1 · max 4 rolls/card · เลือก sub stat แล้วกด + เพื่อตั้ง roll</div>
    </div>
  )
}
