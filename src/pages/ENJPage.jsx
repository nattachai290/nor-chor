import { useState, useEffect, useRef } from 'react'

// ── Google Drive config ──────────────────────────────────────────────────────
// สร้าง Client ID ที่ https://console.cloud.google.com → APIs & Services → Credentials
// เพิ่ม Authorized JS origins: https://nattachai290.github.io
// เพิ่ม Authorized redirect URIs: https://nattachai290.github.io/nor-chor/oauth-callback.html
const DRIVE_CLIENT_ID = '45222114320-a9vtesr80s6publ5q3okffv6tsa36at8.apps.googleusercontent.com'
const DRIVE_FILE = 'enj-excavator-data.json'
// ────────────────────────────────────────────────────────────────────────────

const G = [
  {name:'Aeonclipse',  gpm:30,    bc:20,        bu:10},
  {name:'Archspire',   gpm:75,    bc:50,        bu:25},
  {name:'Oindrasdain', gpm:150,   bc:100,       bu:50},
  {name:'Wanderer',    gpm:300,   bc:300,       bu:150},
  {name:'Epochrome',   gpm:600,   bc:500,       bu:250},
  {name:'Tramyarus',   gpm:900,   bc:2000,      bu:1000},
  {name:'Pegasoid',    gpm:1200,  bc:5000,      bu:2500},
  {name:'Forgehammer', gpm:1800,  bc:20000,     bu:10000},
  {name:'Mike',        gpm:3600,  bc:40000,     bu:20000},
  {name:'Stormwall',   gpm:5000,  bc:150000,    bu:75000},
  {name:'Masked',      gpm:7500,  bc:300000,    bu:150000},
  {name:'Soulshift',   gpm:10000, bc:1000000,   bu:500000},
  {name:'Starbow',     gpm:15000, bc:2000000,   bu:1000000},
  {name:'APG',         gpm:20000, bc:10000000,  bu:5000000},
  {name:'Shadowsong',  gpm:30000, bc:20000000,  bu:10000000},
  {name:'Eternal',     gpm:60000, bc:100000000, bu:25000000},
  {name:'Seafoam',     gpm:60000, bc:100000000, bu:25000000},
  {name:'Windstruck',  gpm:60000, bc:100000000, bu:25000000},
  {name:'Bedrock',     gpm:60000, bc:100000000, bu:25000000},
]

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K'
  return Math.round(n).toString()
}

export default function ENJPage() {
  const [counts, setCounts] = useState(G.map(() => 0))
  const [usteps, setUsteps] = useState(G.map(() => 0))
  const [dragon, setDragon] = useState(98)
  const [boost, setBoost] = useState(38.1)
  const [countdown, setCountdown] = useState('--:--:--:--')
  const [cdThai, setCdThai] = useState('')
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copyOk, setCopyOk] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const detailRef = useRef(null)
  const [driveToken, setDriveToken] = useState(null)
  const [driveUser, setDriveUser] = useState(null)
  const [driveStatus, setDriveStatus] = useState('')
  const [driveMsg, setDriveMsg] = useState('')

  const totalBoost = boost + Math.min(dragon * 0.025, 50)
  const dragonPct = Math.min(dragon * 0.025, 50)

  const nc1 = (i) => G[i].bc * Math.pow(2, counts[i])
  const nu1 = (i) => G[i].bu * Math.pow(2, usteps[i])
  const geff = (i) => G[i].gpm * (1 + totalBoost / 100) / nc1(i)
  const ueff = (i) => {
    if (counts[i] === 0) return 0
    return counts[i] * G[i].gpm * 0.10 * (1 + totalBoost / 100) / nu1(i)
  }

  let tgpm = 0, tcnt = 0
  G.forEach((g, i) => { tgpm += counts[i] * g.gpm; tcnt += counts[i] })
  const totalGpm = tgpm * (1 + totalBoost / 100)

  let bgEff = -1, bgIdx = 0
  G.forEach((_, i) => { const e = geff(i); if (e > bgEff) { bgEff = e; bgIdx = i } })

  let buEff = -1, buIdx = -1
  G.forEach((_, i) => { const e = ueff(i); if (e > 0 && e > buEff) { buEff = e; buIdx = i } })

  let bestEff = -1, bestIdx = 0, bestType = 'g'
  G.forEach((_, i) => {
    const ge = geff(i), ue = ueff(i)
    if (ge > bestEff) { bestEff = ge; bestIdx = i; bestType = 'g' }
    if (ue > bestEff) { bestEff = ue; bestIdx = i; bestType = 'u' }
  })

  const maxGeff = Math.max(...G.map((_, i) => geff(i)))
  const maxUeff = Math.max(...G.map((_, i) => ueff(i)))

  const allActions = []
  G.forEach((g, i) => {
    allActions.push({ name: g.name, type: 'ตัว', eff: geff(i), cost: nc1(i), gain: g.gpm * (1 + totalBoost / 100), idx: i })
    if (counts[i] > 0) allActions.push({ name: g.name, type: '%+10', eff: ueff(i), cost: nu1(i), gain: counts[i] * g.gpm * 0.1 * (1 + totalBoost / 100), idx: i })
  })
  allActions.sort((a, b) => b.eff - a.eff)

  useEffect(() => {
    function tick() {
      const now = new Date()
      const day = now.getUTCDay()
      let daysUntilTue = (2 - day + 7) % 7
      if (daysUntilTue === 0 && (now.getUTCHours() > 12 || (now.getUTCHours() === 12 && now.getUTCMinutes() > 0))) daysUntilTue = 7
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilTue, 12, 0, 0))
      const diff = next - now
      if (diff <= 0) { setCountdown('🔴 Season จบแล้ว!'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
      const thaiStr = next.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      setCdThai('📅 จบ ' + thaiStr + ' น.')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Google Drive ────────────────────────────────────────────────────────────
  function connectDrive() {
    if (!DRIVE_CLIENT_ID) {
      setDriveMsg('⚠️ ยังไม่ได้ตั้งค่า Google Client ID ใน ENJPage.jsx')
      setTimeout(() => setDriveMsg(''), 4000)
      return
    }
    const callbackUrl = window.location.origin + import.meta.env.BASE_URL + 'oauth-callback.html'
    const params = new URLSearchParams({
      client_id: DRIVE_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: 'token',
      scope: 'https://www.googleapis.com/auth/drive.appdata email profile',
      prompt: 'select_account',
    })
    const popup = window.open(
      'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString(),
      'googleAuth',
      'width=520,height=640,resizable=yes,scrollbars=yes'
    )
    function onMessage(e) {
      if (e.origin !== window.location.origin) return
      if (!e.data?.access_token) return
      window.removeEventListener('message', onMessage)
      clearInterval(checkClosed)
      const token = e.data.access_token
      setDriveToken(token)
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(info => {
        setDriveUser({ name: info.name, email: info.email, pic: info.picture })
        setDriveStatus('connected')
        setDriveMsg('')
      }).catch(() => { setDriveStatus('connected'); setDriveMsg('') })
    }
    window.addEventListener('message', onMessage)
    const checkClosed = setInterval(() => {
      if (popup?.closed) { clearInterval(checkClosed); window.removeEventListener('message', onMessage) }
    }, 1000)
  }

  function disconnectDrive() {
    setDriveToken(null); setDriveUser(null); setDriveStatus(''); setDriveMsg('')
  }

  async function driveSearch(token) {
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE}'&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const d = await r.json()
    return d.files?.[0] || null
  }

  async function saveToDrive() {
    if (!driveToken) return
    setDriveStatus('saving')
    try {
      const data = JSON.stringify({ version: 1, dragon, boost, counts, usteps })
      const existing = await driveSearch(driveToken)
      let resp
      if (existing) {
        resp = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${driveToken}`, 'Content-Type': 'application/json' },
          body: data,
        })
      } else {
        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify({ name: DRIVE_FILE, parents: ['appDataFolder'] })], { type: 'application/json' }))
        form.append('file', new Blob([data], { type: 'application/json' }))
        resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST', headers: { Authorization: `Bearer ${driveToken}` }, body: form,
        })
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error?.message || `HTTP ${resp.status}`)
      }
      setDriveStatus('connected'); setDriveMsg('✅ บันทึกแล้ว')
    } catch (e) { setDriveStatus('error'); setDriveMsg(`❌ บันทึกไม่สำเร็จ: ${e.message}`) }
    setTimeout(() => setDriveMsg(''), 4000)
  }

  async function loadFromDrive() {
    if (!driveToken) return
    setDriveStatus('loading')
    try {
      const file = await driveSearch(driveToken)
      if (!file) { setDriveStatus('connected'); setDriveMsg('⚠️ ไม่พบข้อมูลใน Drive'); setTimeout(() => setDriveMsg(''), 3000); return }
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${driveToken}` }
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error?.message || `HTTP ${resp.status}`)
      }
      const d = await resp.json()
      if (d.counts) setCounts(d.counts.slice(0, G.length).map(v => Number(v) || 0))
      if (d.usteps) setUsteps(d.usteps.slice(0, G.length).map(v => Number(v) || 0))
      if (d.dragon !== undefined) setDragon(Number(d.dragon) || 0)
      if (d.boost !== undefined) setBoost(Number(d.boost) || 0)
      setDriveStatus('connected'); setDriveMsg('✅ โหลดแล้ว')
    } catch (e) { setDriveStatus('error'); setDriveMsg(`❌ โหลดไม่สำเร็จ: ${e.message}`) }
    setTimeout(() => setDriveMsg(''), 2500)
  }
  // ──────────────────────────────────────────────────────────────────────────

  function changeCount(i, d) {
    setCounts(prev => { const n = [...prev]; n[i] = Math.max(0, n[i] + d); return n })
  }
  function changeUstep(i, d) {
    setUsteps(prev => { const n = [...prev]; n[i] = Math.max(0, n[i] + d); return n })
  }

  const exportJson = JSON.stringify({ dragon, boost, counts, usteps })

  function copyExport() {
    navigator.clipboard.writeText(exportJson).catch(() => {})
    setCopyOk(true)
    setTimeout(() => setCopyOk(false), 2000)
  }

  function doImport() {
    try {
      const d = JSON.parse(importText)
      if (!d.counts || !d.usteps) throw new Error('ข้อมูลไม่ถูกต้อง')
      setDragon(Number(d.dragon) || 0)
      setBoost(Number(d.boost) || 0)
      setCounts(d.counts.slice(0, G.length).map(v => Number(v) || 0))
      setUsteps(d.usteps.slice(0, G.length).map(v => Number(v) || 0))
      setShowImport(false)
      setImportError('')
    } catch (e) {
      setImportError('❌ JSON ไม่ถูกต้อง: ' + e.message)
    }
  }

  useEffect(() => {
    if (showDetail && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [showDetail])

  const em = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

  return (
    <div className="enj-page">
      <header className="enj-header">
        <h1>💎 ENJ Excavators Calc</h1>
        <p>เปรียบเทียบ +ตัว vs +% ทุก Goblin ในหน้าเดียว</p>
      </header>

      <div className="container">
        {/* Countdown */}
        <div className="countdown-box">
          <div className="cd-title">⏳ Season จบใน (วันอังคาร 19:00 น. ไทย)</div>
          <div className="cd-time">{countdown}</div>
          <div className="cd-thai">{cdThai}</div>
        </div>

        {/* Boost */}
        <div className="boost-section">
          <div className="boost-item">
            <label>🐉 Dragon Power</label>
            <input type="number" value={dragon} min="0"
              onChange={e => setDragon(parseInt(e.target.value) || 0)} />
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>ตัว</span>
            <span className="pct-display">= {dragonPct.toFixed(2)}%</span>
          </div>
          <div className="boost-item">
            <label>✨ Primythical</label>
            <input type="number" value={boost} min="0" step="0.1"
              onChange={e => setBoost(parseFloat(e.target.value) || 0)} />
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>%</span>
          </div>
          <div className="total-boost">💫 {totalBoost.toFixed(2)}%</div>
        </div>

        {/* Save/Load + Drive buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button className="btn-calc"
            style={{ background: 'linear-gradient(135deg,#0d3b1f,#1a6b35)', color: 'var(--green)', flex: 1 }}
            onClick={() => setShowExport(true)}>
            📤 Save (Export)
          </button>
          <button className="btn-calc"
            style={{ background: 'linear-gradient(135deg,#0d1a3b,#1a3565)', color: 'var(--blue)', flex: 1 }}
            onClick={() => setShowImport(true)}>
            📥 Load (Import)
          </button>
        </div>
        {/* Google Drive row */}
        <div style={{ marginBottom: 10 }}>
          {!driveToken ? (
            <>
            <button className="btn-calc drive-connect-btn"
              onClick={connectDrive}
              style={{ width: '100%', background: 'linear-gradient(135deg,#1a0a2e,#2a1255)', border: '1px solid #4285f4', color: '#8ab4f8' }}>
              <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" alt="Drive" style={{ width: 18, verticalAlign: 'middle', marginRight: 6 }} />
              🔗 Connect Google Drive
            </button>
            {driveMsg && <div style={{ marginTop: 5, fontSize: '0.75rem', color: 'var(--orange)' }}>{driveMsg}</div>}
            </>
          ) : (
            <div style={{ background: '#0d1a0d', border: '1px solid #2a6b35', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {driveUser?.pic && <img src={driveUser.pic} referrerPolicy="no-referrer" alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                <span style={{ fontSize: '0.78rem', color: 'var(--gem)', flex: 1 }}>☁️ {driveUser?.email || 'Connected'}</span>
                <button onClick={disconnectDrive} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-calc" onClick={saveToDrive} disabled={driveStatus === 'saving'}
                  style={{ flex: 1, background: 'linear-gradient(135deg,#0d3b1f,#1a6b35)', color: 'var(--green)', fontSize: '0.78rem', padding: '6px 8px' }}>
                  {driveStatus === 'saving' ? '⏳ กำลังบันทึก...' : '☁️ บันทึกลง Drive'}
                </button>
                <button className="btn-calc" onClick={loadFromDrive} disabled={driveStatus === 'loading'}
                  style={{ flex: 1, background: 'linear-gradient(135deg,#0d1a3b,#1a3565)', color: 'var(--blue)', fontSize: '0.78rem', padding: '6px 8px' }}>
                  {driveStatus === 'loading' ? '⏳ กำลังโหลด...' : '☁️ โหลดจาก Drive'}
                </button>
              </div>
              {driveMsg && <div style={{ marginTop: 5, fontSize: '0.75rem', color: driveMsg.startsWith('✅') ? 'var(--gem)' : 'var(--orange)' }}>{driveMsg}</div>}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat-box"><div className="val">{fmt(totalGpm)}</div><div className="lbl">💎 Gems/min</div></div>
          <div className="stat-box"><div className="val">{tcnt}</div><div className="lbl">👺 Goblins</div></div>
          <div className="stat-box"><div className="val">{G[bgIdx].name}</div><div className="lbl">🏆 ควร +ตัว</div></div>
          <div className="stat-box"><div className="val">{buIdx >= 0 ? G[buIdx].name : '-'}</div><div className="lbl">⬆️ ควร +%</div></div>
          <div className="stat-box"><div className="val">{G[bestIdx].name + (bestType === 'g' ? ' +ตัว' : ' +%')}</div><div className="lbl">🎯 คุ้มสุด</div></div>
        </div>

        {/* Recommendation */}
        <div className="recommend">
          <div className="rec-top">
            {['🥇', '🥈', '🥉'].map((em, idx) => {
              const a = allActions[idx]
              if (!a) return null
              return (
                <div key={idx} className="rec-item">
                  <div className="rec-label">{em} อันดับ {idx + 1}</div>
                  <div className="rec-val">
                    {a.name} {a.type === 'ตัว'
                      ? <span style={{ color: 'var(--gold)' }}>+ตัว</span>
                      : <span style={{ color: 'var(--gem)' }}>+10%</span>}
                  </div>
                  <div className="rec-sub">ราคา {fmt(a.cost)} 💎 · +{fmt(a.gain)}gpm</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allActions.slice(0, 5).map((a, i) => {
            const isG = a.type === 'ตัว'
            const color = isG ? 'var(--gold)' : 'var(--gem)'
            const label = em[i]
            return (
              <button key={i} onClick={() => isG ? changeCount(a.idx, 1) : changeUstep(a.idx, 1)}
                style={{
                  width: '100%', padding: '9px 14px', borderRadius: 9,
                  border: `1px solid ${color}33`, background: '#0a1a0f', color,
                  fontFamily: "'Exo 2',sans-serif", fontSize: '0.82rem', fontWeight: 700,
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8
                }}>
                <span>{label}</span>
                <span style={{ flex: 1 }}>
                  {a.name} <span style={{ opacity: 0.7 }}>{isG ? '+1 ตัว' : '+10%'}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginLeft: 4 }}>
                    ({isG ? `มี ${counts[a.idx]} ตัว` : `อัพแล้ว ${usteps[a.idx] * 10}%`})
                  </span>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>💎 {fmt(a.cost)}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--green)' }}>+{fmt(a.gain)}</span>
              </button>
            )
          })}
        </div>

        {/* Goblin Cards */}
        <div className="goblin-list">
          {G.map((g, i) => {
            const ge = geff(i)
            const ue = ueff(i)
            const isBestG = i === bgIdx
            const isBestU = buIdx >= 0 && i === buIdx
            const cardCls = 'g-card' + (isBestG && isBestU ? ' best-both' : isBestG ? ' best-g' : isBestU ? ' best-u' : '')
            const geColor = ge >= maxGeff * 0.7 ? 'good' : ge >= maxGeff * 0.3 ? 'ok' : 'bad'
            const ueColor = ue >= maxUeff * 0.7 ? 'good' : ue >= maxUeff * 0.3 ? 'ok' : 'bad'
            return (
              <div key={i} className={cardCls}>
                <div className="g-head">
                  <div className="g-name">
                    {g.name} <span style={{ color: 'var(--blue)', fontSize: '0.7rem' }}>{fmt(g.gpm)} gpm/ตัว</span>
                  </div>
                  <div className="badges">
                    {isBestG && isBestU
                      ? <span className="badge bb">🎯 คุ้มสุดทุกอย่าง</span>
                      : <>
                        {isBestG && <span className="badge bg">🏆 +ตัวดีสุด</span>}
                        {isBestU && <span className="badge bu">⬆️ +%ดีสุด</span>}
                      </>}
                  </div>
                </div>
                <div className="g-rows">
                  <div className="g-row">
                    <div className="row-label" style={{ color: 'var(--gold)' }}>+ตัว</div>
                    <div className="counter">
                      <button className="cnt-btn minus" onClick={() => changeCount(i, -1)}>−</button>
                      <div className="cnt-val">{counts[i]}</div>
                      <button className="cnt-btn plus" onClick={() => changeCount(i, 1)}>+</button>
                    </div>
                    <div className="g-meta">
                      <div className="g-cost">💎 {fmt(nc1(i))}</div>
                      <div className="g-eff">eff: <span className={`eff-val ${geColor}`}>{ge.toFixed(4)}</span> gpm/gem</div>
                      <div className="eff-bar-wrap"><div className="eff-bar-g" style={{ width: (maxGeff > 0 ? ge / maxGeff * 100 : 0) + '%' }} /></div>
                    </div>
                  </div>
                  <div className="enj-divider" />
                  <div className="g-row">
                    <div className="row-label" style={{ color: 'var(--gem)' }}>+%</div>
                    <div className="counter">
                      <button className="cnt-btn minus" onClick={() => changeUstep(i, -1)}>−</button>
                      <div className="cnt-val pct">{usteps[i] * 10}%</div>
                      <button className="cnt-btn plus" onClick={() => changeUstep(i, 1)}>+</button>
                    </div>
                    <div className="g-meta">
                      <div className="g-cost">💎 {fmt(nu1(i))}</div>
                      {counts[i] === 0
                        ? <div className="g-eff"><span className="eff-val bad">ต้องมีตัวก่อน</span></div>
                        : <div className="g-eff">eff: <span className={`eff-val ${ueColor}`}>{ue.toFixed(4)}</span> gpm/gem</div>}
                      <div className="eff-bar-wrap"><div className="eff-bar-u" style={{ width: counts[i] === 0 ? '0%' : (maxUeff > 0 ? ue / maxUeff * 100 : 0) + '%' }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail button */}
        <button className="btn-calc" onClick={() => setShowDetail(v => !v)}>
          🔍 {showDetail ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียดเต็ม'}
        </button>

        {/* Detail area */}
        {showDetail && (
          <div ref={detailRef} style={{
            background: 'linear-gradient(135deg,#061a0c,#050f08)', border: '1px solid var(--gem)',
            borderRadius: 14, padding: 14, marginTop: 10
          }}>
            <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: '0.82rem', color: 'var(--gold)', marginBottom: 10 }}>
              🎯 ทุก Action เรียงตามความคุ้ม
            </div>
            {allActions.map((a, i) => {
              const isG = a.type === 'ตัว'
              const bdrColor = i === 0 ? 'var(--gold)' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--border)'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 9, marginBottom: 5, background: '#050f08', borderLeft: `3px solid ${bdrColor}`
                }}>
                  <div style={{ fontSize: '0.95rem', width: 22 }}>{em[i] || i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isG ? 'var(--gold)' : 'var(--gem)' }}>
                      {a.name} <span style={{ fontSize: '0.72rem' }}>{isG ? '➕ตัว' : '⬆️+10%'}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>ราคา {fmt(a.cost)} 💎 · ได้ +{fmt(a.gain)} gpm</div>
                  </div>
                  <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.78rem', textAlign: 'right' }}>
                    {a.eff.toFixed(5)}<br /><span style={{ color: 'var(--muted)', fontSize: '0.62rem' }}>gpm/gem</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExport(false)}>
          <div className="modal-box">
            <div className="modal-title">📤 Export Data</div>
            <textarea readOnly value={exportJson} />
            <div className="modal-btns">
              <button className="modal-btn primary-enj" onClick={copyExport}>📋 Copy</button>
              <button className="modal-btn secondary" onClick={() => setShowExport(false)}>ปิด</button>
            </div>
            {copyOk && <div className="copy-ok-msg">✅ Copied!</div>}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowImport(false)}>
          <div className="modal-box">
            <div className="modal-title">📥 Import Data</div>
            <textarea placeholder="วาง JSON ที่นี่..." value={importText}
              onChange={e => setImportText(e.target.value)} />
            {importError && <div className="import-err-msg">{importError}</div>}
            <div className="modal-btns">
              <button className="modal-btn primary-enj" onClick={doImport}>✅ Import</button>
              <button className="modal-btn secondary" onClick={() => setShowImport(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
