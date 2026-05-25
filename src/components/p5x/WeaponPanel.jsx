export default function WeaponPanel({
  currentChar,
  selectedWeaponIdx,
  setSelectedWeaponIdx,
  weaponRefine,
  setWeaponRefine,
  lang,
}) {
  function resolveRefine(text) {
    return text.replace(/([\d.]+%?)(?:\/([\d.]+%?)){6}/g, match => {
      const parts = match.split('/')
      return parts[weaponRefine] ?? match
    })
  }

  return (
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
  )
}
