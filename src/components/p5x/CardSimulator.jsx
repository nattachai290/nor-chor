import { CARD_SETS, CARD_SLOTS, CARD_SUB_STATS } from '../../data/p5x-cards.js'
import { SUB_STAT_KEY } from '../../data/p5x-targets.js'
import { computeStats, getSpacePassiveBonus, statLabels } from '../../utils/p5x-stats.js'

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
  simLockedSubs,
  setSimLockedSubs,
}) {
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

  // main stat contributions
  const mainFromSel = {}
  Object.entries(mainStatSel).forEach(([slotId, label]) => {
    if (!label) return
    const slot = CARD_SLOTS.find(s => s.id === slotId)
    const ms = slot?.mainStats.find(m => m.label === label)
    if (ms?.key) mainFromSel[ms.key] = (mainFromSel[ms.key]||0) + ms.max
  })

  // sub contributions
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

  return (
    <div className="info-panel">
      <div className="info-label">🎛️ จำลอง Card Stats</div>

      {/* Card set selector */}
      <div style={{marginBottom:10}}>
        <div className="alloc-section-label">Card Set (4pc)</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
          {charDefaultSet && (
            <button className={'refine-btn' + (!simCardSet ? ' active' : '')}
              onClick={() => setSimCardSet(null)}>
              {charDefaultSet} (default)
            </button>
          )}
          {CARD_SETS.filter(cs => cs.name !== charDefaultSet).map(cs => (
            <button key={cs.name}
              className={'refine-btn' + (simCardSet === cs.name ? ' active' : '')}
              onClick={() => setSimCardSet(cs.name)}>
              {cs.name}
            </button>
          ))}
        </div>
      </div>

      {/* Per-card blocks */}
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {CARD_SLOTS.map(slot => {
          const pool = slot.id==='Space' ? CARD_SUB_STATS.Space : CARD_SUB_STATS._other
          const usedRolls = totalRollsForSlot(subAlloc, slot.id)
          const full = usedRolls >= 4
          return (
            <div key={slot.id} className="sim-card-block">
              <div className="sim-card-header">
                <span className="sim-card-name">{slot.id}</span>
                <span className={full ? 'sim-card-sub-count full' : 'sim-card-sub-count'}>{usedRolls}/4 rolls</span>
              </div>
              {/* Main stat */}
              <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:6}}>
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
              {/* Sub stats */}
              <div style={{display:'flex', flexDirection:'column', gap:2}}>
                {Object.entries(pool).map(([subLabel, tiers]) => {
                  const k = SUB_STAT_KEY[subLabel]
                  const rolls = k ? ((subAlloc[k]||{})[slot.id] || 0) : 0
                  const t1 = tiers[0]
                  const unit = subUnit(subLabel)
                  return (
                    <div key={subLabel} className={'sim-sub-row' + (rolls > 0 ? ' locked' : '')}>
                      <span className="sim-sub-label">{subLabel}</span>
                      <button className="alloc-btn" onClick={() => bump(k, slot.id, -1)} disabled={rolls===0}>−</button>
                      <span className="alloc-num">{rolls}</span>
                      <button className="alloc-btn" onClick={() => bump(k, slot.id, +1)} disabled={full}>+</button>
                      <span className="alloc-hint">+{t1}{unit}/roll</span>
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
        <div className="alloc-section-label">สรุป</div>
        {simEntries.map(([k, [ideal]]) => {
          const spacePassiveVal = simSpacePassive[k] || 0
          const sunKissedVal = (k==='cdmg' && hasSunKissed) ? sunKissedCdmg : 0
          const subVal = subFromAlloc[k] || 0
          const total = (base0[k]||0) + (mainFromSel[k]||0) + subVal + spacePassiveVal + sunKissedVal
          const reach = total >= ideal
          return (
            <div key={k} className="alloc-stat-header" style={{marginBottom:4}}>
              <span className="alloc-stat">{statLabels[k]||k}</span>
              <span style={{color:'#555', fontSize:'0.62rem', flex:1, marginLeft:6}}>
                {fmt(k, base0[k]||0)}
                {mainFromSel[k] ? ` +main ${fmt(k, mainFromSel[k])}` : ''}
                {subVal>0 ? ` +sub ${fmt(k, subVal)}` : ''}
                {spacePassiveVal>0 ? ` +passive ${fmt(k, spacePassiveVal)}` : ''}
                {sunKissedVal>0 ? ` +☀️ ${fmt(k, sunKissedVal)}` : ''}
              </span>
              <span style={{color:reach?'#00ff88':'#ff7a8a', fontWeight:700, fontSize:'0.8rem', minWidth:50, textAlign:'right'}}>{fmt(k,total)}</span>
              <span style={{color:'#444', fontSize:'0.68rem', minWidth:40, textAlign:'right'}}>/{fmt(k,ideal)}</span>
            </div>
          )
        })}
      </div>

      {/* SPR & Sun-kissed summaries */}
      {charTgt?.spr && (
        <div className="alloc-spr-summary" style={{marginTop:8}}>
          <span>SPR {Math.floor(totalSpr)}%</span>
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
      <div className="req-note" style={{marginTop:6}}>tier 1 · lock sub ที่ต้องการ (max 4/card) · กด +/− เพื่อตั้ง roll</div>
    </div>
  )
}
