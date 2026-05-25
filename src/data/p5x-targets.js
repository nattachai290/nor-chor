export const ROLE_ICONS = {Sweeper:'🌊', Assassin:'⚔️', Medic:'💚', Guardian:'🛡️', Saboteur:'🎯', Strategist:'🎵', Elucidator:'📡', Virtuoso:'✨'}
export const ELEM_COLORS = {Fire:'#ff4422',Ice:'#44aaff',Electric:'#ffee00',Wind:'#44ffaa',Nuclear:'#ff8800',Curse:'#aa44ff',Bless:'#ffcc44',Physical:'#ff8866',Almighty:'#ffffff',Psychokinesis:'#dd44ff','-':'#888888'}
export const ROLE_COLORS = {Sweeper:'#40c8ff', Assassin:'#ff6030', Medic:'#40ff80', Guardian:'#8080ff', Saboteur:'#ffcc40', Strategist:'#b060ff', Elucidator:'#40ffcc', Virtuoso:'#ff88ff'}

export const BOSS_PRESETS = [
  { name: 'Custom',              def: null,   addDef: null  },
  { name: 'Dominion (LV82)',     def: 363.2,  addDef: 158.4 },
  { name: 'Atavaka (LV82)',      def: 1279.9, addDef: 158.4 },
  { name: 'Vishnu (LV82)',       def: 820.7,  addDef: 158.4 },
  { name: 'Mini Vishnu (LV82)', def: 363.2,  addDef: 158.4 },
  { name: 'Yatsufusa (LV82)',    def: 1279.9, addDef: 205.9 },
  { name: 'Sea of Souls 8★',    def: 400,    addDef: 163.2 },
]

export const STAT_TARGETS = {
  dps:      {atk:[120,25], crit:[70,20], cdmg:[200,20], dmgMulti:[60,15], hp:[0,0],   def:[0,0],  heal:[0,0],  spd:[0,0]},
  support:  {atk:[60,10],  crit:[30,5],  cdmg:[0,0],    dmgMulti:[0,0],   hp:[80,20], def:[0,0],  heal:[0,0],  spd:[80,25]},
  medic:    {atk:[20,5],   crit:[0,0],   cdmg:[0,0],    dmgMulti:[0,0],   hp:[100,30],def:[40,15],heal:[60,30],spd:[30,10]},
  saboteur: {atk:[80,20],  crit:[30,10], cdmg:[0,0],    dmgMulti:[0,0],   hp:[0,0],   def:[20,5], heal:[0,0],  spd:[70,25]},
}


// Endgame stat targets keyed by character codename
export const CHAR_STAT_TARGETS = {
  // Values = total bonus from ALL sources (computeStats set+weapon + userStats card mains+subs+hidden)
  // Calibrated to realistic endgame: ~2.5 sub rolls/card at tier 2, good main stat choices
  // ── SWEEPER / ASSASSIN ──
  'Joker':           {atk:[120,25], crit:[40,18], cdmg:[80,22], dmgMulti:[35,12], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Panther':         {atk:[110,20], crit:[40,18], cdmg:[65,15], dmgMulti:[50,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Skull':           {atk:[110,22], crit:[42,20], cdmg:[260,22], dmgMulti:[30,12], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Violet':          {atk:[110,22], crit:[45,22], cdmg:[85,22], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Fox':             {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[40,18], hp:[80,18], def:[160,25],heal:[0,0],  spd:[0,0]},
  'Queen':           {atk:[110,25], crit:[38,15], cdmg:[0,0],   dmgMulti:[55,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Crow':            {atk:[110,22], crit:[42,20], cdmg:[90,22], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Howler':          {atk:[110,20], crit:[40,18], cdmg:[65,15], dmgMulti:[50,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'J&C':             {atk:[110,22], crit:[38,18], cdmg:[85,22], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Noir':            {atk:[110,22], crit:[38,18], cdmg:[80,22], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Messa':           {atk:[100,22], crit:[35,18], cdmg:[0,0],   dmgMulti:[50,20], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'makoto':          {atk:[110,22], crit:[42,20], cdmg:[80,22], dmgMulti:[35,12], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'closer-tropical': {atk:[70,15],  crit:[25,12], cdmg:[0,0],   dmgMulti:[0,0],   hp:[110,25],def:[0,0],   heal:[0,0],  spd:[0,0]},
  'rin-firecracker': {atk:[110,20], crit:[40,18], cdmg:[65,15], dmgMulti:[50,22], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'KEY':             {atk:[50,12],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[55,20], hp:[110,25],def:[0,0],   heal:[0,0],  spd:[0,0]},
  'mont-frostgale':  {atk:[110,22], crit:[42,20], cdmg:[260,22], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Bui':             {atk:[100,22], crit:[45,25], cdmg:[75,22], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Closer':          {atk:[85,22],  crit:[32,15], cdmg:[0,0],   dmgMulti:[45,15], hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Mont':            {atk:[85,22],  crit:[38,18], cdmg:[70,20], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Sepia':           {atk:[80,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[30,18]},
  'Fleuret':         {atk:[85,22],  crit:[38,18], cdmg:[75,20], dmgMulti:[0,0],   hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[0,0]},
  // ── ELUCIDATOR ──
  'Oracle':          {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Wind':            {atk:[75,18],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Ange':            {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Phoebe':          {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'Okyann':          {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[28,20]},
  'Puppet':          {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[100,22],def:[85,25], heal:[0,0],  spd:[28,15]},
  // ── STRATEGIST ──
  'Chord':           {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[0,0],  spd:[35,25]},
  'wind-tempest':    {atk:[0,0],    crit:[42,20], cdmg:[388,25], dmgMulti:[0,0],  hp:[0,0],   def:[0,0],   heal:[0,0],  spd:[132,8],  spr:[525,22], ailm:[0,0]},
  'Turbo':           {atk:[65,15],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[155,25]},
  'Riddle':          {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[65,15], def:[0,0],   heal:[0,0],  spd:[32,22]},
  'Luce':            {atk:[65,18],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[55,12], def:[0,0],   heal:[0,0],  spd:[28,20],  ailm:[50,25]},
  // ── SABOTEUR ──
  'Rin':             {atk:[85,20],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[0,0],   def:[45,15], heal:[0,0],  spd:[155,25]},
  'Matoi':           {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[100,25],def:[75,20], heal:[0,0],  spd:[28,20]},
  'Vino':            {atk:[65,18],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[55,12], def:[0,0],   heal:[0,0],  spd:[28,20],  ailm:[50,25]},
  'Key':             {atk:[65,20],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[0,0],   def:[38,12], heal:[0,0],  spd:[28,20]},
  // ── MEDIC ──
  'Marian':          {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[110,28],def:[55,15], heal:[47,25],spd:[0,0]},
  'Moko':            {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[24,22],spd:[0,0]},
  'moko-seaside':    {atk:[75,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[75,15], def:[0,0],   heal:[24,22],spd:[0,0]},
  'Mona':            {atk:[85,22],  crit:[32,12], cdmg:[0,0],   dmgMulti:[0,0],   hp:[70,15], def:[0,0],   heal:[0,0],  spd:[0,0]},
  'Cattle':          {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[100,25],def:[45,15], heal:[26,25],spd:[0,0]},
  // ── GUARDIAN ──
  'Cherish':         {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[110,25],def:[140,20],heal:[23,15],spd:[0,0]},
  'Leon':            {atk:[85,22],  crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[85,18], def:[45,15], heal:[0,0],  spd:[0,0]},
  'Soy':             {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[100,25],def:[65,18], heal:[23,18],spd:[0,0]},
  'Yuki':            {atk:[0,0],    crit:[0,0],   cdmg:[0,0],   dmgMulti:[0,0],   hp:[85,20], def:[95,25], heal:[0,0],  spd:[28,15]},
}

// Maps a Space card's passive name → which stats it benefits and by how much
export const PASSIVE_STAT_MAP = {
  'Power':          {atk:15},
  'Ruin':           {atk:10, dmgMulti:8},
  'Tenacity':       {atk:8},
  'Courage':        {dmgMulti:12, elements:['Physical','Electric']},
  'Triumph':        {crit:15, roles:['Sweeper','Assassin','Virtuoso','Saboteur']},
  'Love':           {heal:15},
  'Reconciliation': {spd:10},
  'Oppression':     {atk:10, dmgMulti:10},
  'Pleasure':       {dmgMulti:12},
  'Strife':         {dmgMulti:12, atk:8},
  'Renewal':        {dmgMulti:12},
  'Opulence':       {dmgMulti:12},
  'Victory':        {dmgMulti:10},
  'Truth':          {dmgMulti:10},
  'Hindrance':      {dmgMulti:8},
  'Virtue':         {crit:10, dmgMulti:8, roles:['Sweeper','Assassin','Virtuoso','Saboteur']},
  'Control':        {def:8,   hp:5},
  'Labor':          {hp:8,    atk:5, def:5},
  'Peace':          {def:12},
  'Futility':       {},
  'Prosperity':     {},
  'Disappointment': {atk:10, crit:8, elements:['Almighty']},
  'Transformation': {},
  'Prudence':       {atk:8},
  'Defeat':         {dmgMulti:8},
  'Worry':          {cdmg:12},
}

// Sub stat label → internal stat key (null = not tracked in score yet)
export const SUB_STAT_KEY = {
  'Crit Rate':   'crit',
  'Crit Mult.':    'cdmg',
  'Attack %':      'atk',
  'Attack':        'atk',
  'HP %':          'hp',
  'HP':           'hp',
  'Defense %':     'def',
  'Defense':       'def',
  'Damage Mult':    'dmgMulti',
  'Ailment Accuracy': 'ailm',
  'Pierce Rate': 'pierce',
  'SP Recovery': 'spr',
  'Speed':        'spd',
}

// Space card conditional passives — return stat bonus object given current stats
export const SPACE_PASSIVE_RULES = {
  'Worry': ({spr=0}={}) => ({ cdmg: spr>=200?45 : spr>=150?30 : spr>=100?15 : 0 }),
}
