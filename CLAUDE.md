# NOR-CHOR / ENJ-EXCAVATOR — Claude Guidelines

## วิธีเลือก Card Set

### กฎเหล็ก (ห้ามข้าม)
1. **ห้ามเลือก card set โดยไม่ตรวจ stat target ของตัวละครก่อน**
2. **ห้ามเลือก 4pc set ก่อนแล้วค่อยหา Space card** — ลำดับผิด จะได้ผลผิดเสมอ
3. **ต้องตรวจว่า 4pc effect apply กับตัวละครนี้จริงไหม** (element / role / condition check)
4. **Space card ต้องมี passive ชื่อตรงกับ 4pc set name เท่านั้น** — Space card อื่นที่ไม่มี passive นั้น = ไม่เกี่ยว แม้จะให้ stat ที่ต้องการ

### ลำดับที่ถูกต้อง

**Step 1 — หา stat target จาก skill analysis**
- อ่านสกิลทุกตัว หา mechanic cap / scaling / condition
- ห้ามใส่ stat ที่ไม่มี skill รองรับ

**Step 2 — เลือก 4pc set ที่ให้ stat นั้น**
- ดู stats2 + stats4 ของแต่ละ set
- ตรวจ 4pc effect: มีเงื่อนไข element/role ไหม? conditional uptime เป็นเท่าไหร่?
- เลือก set ที่ผลรวมจริง (2pc + 4pc ที่ apply) สูงสุด

**Step 3 — หา Space card ที่มี passive ชื่อตรงกับ set นั้น**
- passive name = 4pc set name → Space passive activate
- ถ้ามีหลาย Space card ที่มี passive นั้น → เลือกตัวที่ passive อื่นๆ เป็นประโยชน์ที่สุด
- passive ให้ stat อะไร? ต้องตรงกับ stat target จริง ไม่ใช่แค่ชื่อตรง

**Step 4 — ยืนยัน**
- format: `cards: ['[SetName] 4pc']` เสมอ
- 4pc set name = passive name ใน Space card → ครบ pair

### กฎ 2pc vs 4pc
- **4pc → 2pc effect + 4pc effect + Space passive activate** ← ดีที่สุด
- **2pc+2pc → ได้แค่ 2pc ของแต่ละ set, Space passive ไม่ activate**
- ใช้ 2pc+2pc เฉพาะเมื่อไม่มี 4pc set ที่ดีพอ

### Checklist ก่อน commit card data
```
[ ] stat ที่ 4pc set ให้ตรงกับ stat target ของตัวละคร
[ ] 4pc effect ไม่มีเงื่อนไข element/role ที่ตัวละครนี้ทำไม่ได้
[ ] Space card มี passive ชื่อตรงกับ 4pc set name
[ ] Space passive ให้ stat ที่ตัวละครต้องการ (ไม่ใช่แค่ชื่อตรง)
[ ] cards array: ['[SetName] 4pc']
```

### ตัวอย่างที่ผิด (Matoi)
- ❌ Peace 4pc + Opulence 2pc — ไม่มาจาก skill analysis เลย
- ❌ Defeat 4pc — 2pc ให้ ailm ดูดี แต่ 4pc effect = "Fire DMG" → Matoi เป็น Ice ใช้ไม่ได้
- ✅ Futility 4pc — 4pc ให้ ailm +30% หลัง Technical; Matoi trigger Technical ทุก ~2 round → high uptime; Space card Faith มี Futility passive → activate

## ลำดับการวิเคราะห์ตัวละคร

**ห้ามอ่าน rotation ก่อนแล้วใช้เป็นเหตุผลเลือก stat** — rotation เป็นผลลัพธ์ของการวิเคราะห์ ไม่ใช่ source of reasoning

ลำดับที่ถูกต้อง:
1. **อ่านสกิลทุกตัว** — ดู mechanic, scaling, cap, condition
2. **แปลสกิลเป็น playstyle** — สกิลไหนต้อง cast บ่อย? สกิลไหน dump? สกิลไหนเป็น engine?
3. **เลือก stat** จาก playstyle ที่ได้ — stat ไหน scale สกิลที่ใช้บ่อย?
4. **เลือก main/sub stat** จาก stat target
5. **เขียน rotation** จาก playstyle — เป็นผลลัพธ์สุดท้าย

ตัวอย่าง wind-tempest Moon slot:
- Storm of Petals: deal damage (183% ATK) + restore SP → เป็น SP engine หลัก → ต้อง cast ซ้ำๆ เพื่อเติม SP
- เนื่องจาก cast บ่อยโดย design ของ kit → ATK scale ทุกครั้ง → ATK% มี impact สม่ำเสมอ
- จึงเลือก Moon→ATK% จากการวิเคราะห์สกิล ไม่ใช่จากการอ่าน rotation

## วิธีเลือก Rotation

1. ตรวจสอบสิ่งที่ใช้ได้ตั้งแต่ R1 — SP เต็มตั้งแต่เริ่มเกม, Highlight gauge = 0%
2. ระบุ SP engine หลักคือสกิลอะไร (สูตร SP = base + SP Recovery%)
3. ระบุ dump skill คือสกิลอะไร ต้องการ SP เท่าไหร่ถึงได้ tier สูงสุด
4. ตัดสกิลที่ไม่คุ้มออก — ถ้า ATK buff overlap กับทีม หรือ contribution น้อย ไม่ต้องใส่ใน rotation
5. Highlight เป็น mechanic ของทีม (shared gauge) ไม่ใส่ใน rotation ของตัวละครคนเดียว
6. เขียนเป็น round-by-round: R1 กดอะไร, R2 กดอะไร — ห้ามบอกให้ "รอ" หรือ "สะสม"

## วิธีเลือก Recommended Stats

1. ดึง target จากสกิลจริงเท่านั้น — ห้ามตั้งเองโดยไม่มีที่มาจาก skill description
2. ดู skill cap / passive cap → ใช้เป็น target (เช่น Blossoming Season CRIT mult cap → cdmg target, Sun-kissed Blooms passive cap 450% → spr target)
3. Stage = skill level (LV10/LV13) + Mindscape level (M5 = Mindscape LV5)
4. Mindscape bonus คิดแยกต่างหาก ไม่รวมในค่า base

### กฎ: stat target คือ total value รวม baseStats

**ค่า base ที่ทุกตัวละครมีอยู่แล้วก่อนใส่ card/weapon:**
- `crit` = 5%
- `cdmg` = 150%
- `spd` = ตาม role (Dealer ~94–102, Support ~100–106)

**กฎเหล็ก:**
- target ใน `statTargets` / `CHAR_STAT_TARGETS` คือ **total รวม baseStats** — ไม่ใช่ bonus บน base
- **ห้ามตั้ง cdmg target ต่ำกว่า 150** — ทุกตัวมี cdmg 150% อยู่แล้ว target ต่ำกว่านี้ = meaningless
- **ห้ามตั้ง crit target ต่ำกว่า 5** — ทุกตัวมี crit 5% อยู่แล้ว
- ตรวจสอบ: `need = target − computeStats(base)` ถ้า need < 0 → target ผิด ต้องแก้

**ค่า cdmg target ที่สมเหตุสมผล:**
- Primary (Star → Crit Mult): ~220–260% (base 150 + Star main 37.6 + subs ~30%)
- Secondary (Star → Crit Rate, cdmg จาก sub เท่านั้น): ~185% (base 150 + subs ~35%)
- ไม่สำคัญ: [0,0]

## หลักการ Min vs Max ของ stat target

stat target แต่ละตัวมีสองขอบ — ต้องระบุทั้งคู่:

**Min (floor)** = ค่าต่ำสุดที่ทำให้ passive/mechanic ทำงานเต็มที่
- ดูจาก: passive cap, buff tier threshold, condition ที่สกิลระบุไว้
- ตัวอย่าง: Sun-kissed Blooms cap 450% → SPR 450% คือ min ที่ CRIT DMG passive เต็ม

**Max (ceiling)** = ค่าสูงสุดที่ยังมีประโยชน์ — เกินนี้ไม่เพิ่มอะไร
- ดูจาก: resource cap (SP cap, stack cap, turn cap) ที่ mechanic ถูกจำกัดด้วย
- ตัวอย่าง: SP cap 200 + Storm of Petals 2 casts → SPR 525% คือ max ที่ยังได้ SP เต็ม

**วิธีหา max จาก SP engine:**
```
max SPR = (SP ที่ต้องการต่อ cycle / จำนวน cast × base SP per cast - 1) × 100
ตัวอย่าง: (200 / 2×16 - 1) × 100 = 525%
หมายเหตุ: ถ้ามี SP recovery หลัง skill (เช่น A2 +50 SP) ให้หักออกจาก SP ที่ต้องการก่อน
```

**วิธีตัดสินว่า cap ของ passive คือ min หรือ max:**
- มี mechanic อื่นที่ยังได้ประโยชน์จากค่าสูงกว่า cap นั้นไหม?
  - ใช่ → cap คือ **min** (floor ของ passive นั้น แต่ยังมี ceiling สูงกว่าจาก mechanic อื่น)
  - ไม่ → cap คือ **true max** (ไม่มีอะไรได้จากการเพิ่มอีก)
- ตัวอย่าง SPR wind-tempest: Sun-kissed Blooms cap 450% = min เพราะ Storm of Petals SP engine ยังได้ประโยชน์ถึง 525%
- ตัวอย่าง true max: passive ที่บอก "เมื่อ stat ≥ X ได้ผล Y" และไม่มี mechanic อื่นใช้ stat นั้น → X คือ max จริง

**กฎ:**
- ต่ำกว่า min → mechanic ทำงานไม่เต็ม → ลงทุนก่อน
- ระหว่าง min–max → เพิ่มได้ถ้า budget เหลือหลัง stat อื่นครบ
- เกิน max → ไม่มีประโยชน์เพิ่ม → ย้าย budget ไป stat อื่น

## วิธีเลือก Main Stat vs Sub Stat

### ค่า Main Stat (LV25 max) ต่อ slot

| Slot  | ตัวเลือก                                    | Max value |
|-------|---------------------------------------------|-----------|
| Space | Attack (flat) / Defense (flat)              | 359       |
| Sun   | HP (flat)                                   | 1080      |
| Moon  | ATK% / DMG Mult / HP% / DEF% / Heal Effect | 31.4% / 25.1% / 31.5% / 47.1% / 22.6% |
| Star  | Crit Rate / Crit Mult / ATK% / HP% / DEF% / Ailment Acc | 18.8% / 37.6% / 31.4% / 31.5% / 47.1% / 37.6% |
| Sky   | ATK% / DEF% / HP% / Speed / SP Recovery    | 31.4% / 47.1% / 31.5% / 20.3 / 90.4% |

### ค่า Sub Stat (tier 1 ต่อ 1 roll, max 4 rolls ต่อ card)

| Stat           | Space (tier 1) | Sun/Moon/Star/Sky (tier 1) | 4 rolls (Space) | 4 rolls (other) |
|----------------|---------------|---------------------------|----------------|----------------|
| Crit Rate      | 2.6%          | 2.0%                      | 10.4%          | 8.0%           |
| Crit Mult      | 5.2%          | 4.1%                      | 20.8%          | 16.4%          |
| ATK%           | 4.3%          | 3.5%                      | 17.2%          | 14.0%          |
| DMG Mult       | 3.5%          | 2.8%                      | 14.0%          | 11.2%          |
| SP Recovery    | 12.5%         | 10.0%                     | 50.0%          | 40.0%          |
| Ailment Acc    | 5.2%          | 4.1%                      | 20.8%          | 16.4%          |
| Speed (flat)   | 2.8           | 2.2                       | 11.2           | 8.8            |
| HP%            | 4.4%          | 3.6%                      | 17.6%          | 14.4%          |

### อัลกอริทึมการเลือก Main Stat Slot

**หลักการ: exclusive stat ได้ slot ก่อน, shared stat เติมช่องที่เหลือ**

Stat แต่ละตัวมีจำนวน slot ที่รองรับ (slotCount):
| Stat | Slot ที่มี | slotCount |
|---|---|---|
| DMG Mult | Moon เท่านั้น | 1 |
| Heal Effect | Moon เท่านั้น | 1 |
| Crit Rate | Star เท่านั้น | 1 |
| Crit Mult | Star เท่านั้น | 1 |
| Ailment Acc | Star เท่านั้น | 1 |
| SP Recovery | Sky เท่านั้น | 1 |
| Speed | Sky เท่านั้น | 1 |
| ATK% | Moon + Star + Sky | 3 |
| HP% | Moon + Star + Sky | 3 |
| DEF% | Moon + Star + Sky | 3 |

**ลำดับการกำหนด slot:**
1. ตัด stat ที่ weight = 0 ออกจากการแข่งขัน (ไม่เกี่ยวกับตัวละครนี้)
2. คำนวณ score = weight / slotCount สำหรับแต่ละ option ในแต่ละ slot
3. ใน slot นั้น เลือก option ที่ score สูงสุด

**กฎเหล็ก: Moon / Star / Sky ห้ามแสดง "-" เด็ดขาด**
- แม้ base stats จะเกิน target แล้ว (need ≤ 0) ก็ยังต้องแนะนำ main stat
- Player ต้องใส่ main stat ในทุก slot อยู่ดี — "-" ทำให้ไม่รู้ว่าต้องใส่อะไร
- **ห้ามใช้ fallback default** — "-" หมายความว่าข้อมูล stat weight ผิด ต้องแก้ที่ data ไม่ใช่ UI

**เงื่อนไขที่ต้องมี weight > 0 อย่างน้อยหนึ่งตัวต่อ slot:**
- Moon ต้องมี: atk / dmgMulti / hp / def / heal อย่างน้อยหนึ่งตัว weight > 0
- Star ต้องมี: crit / cdmg / atk / hp / def / ailm อย่างน้อยหนึ่งตัว weight > 0
- Sky ต้องมี: atk / def / hp / spd / spr อย่างน้อยหนึ่งตัว weight > 0

**ผลลัพธ์ที่ตามมา:**
- DMG Mult ใน charTgt → Moon → DMG Mult เสมอ (score = weight/1 ชนะ ATK% ที่ weight/3)
- SPR ใน charTgt → Sky → SPR เสมอ
- ATK% ได้ slot เมื่อ exclusive stat ใน slot นั้น weight = 0

### กฎการเลือก Main vs Sub

**ใช้ Main stat เมื่อ:**
- stat นั้นมี slot รองรับ และค่า main >> sub อย่างชัดเจน
- Crit Mult: main Star = 37.6% vs sub max = 16–20% → **main ให้เกือบ 2x เสมอ**
- SPR: main Sky = 90.4% vs sub max = 40–50% → **main ให้เกือบ 2x เสมอ**
- Crit Rate: main Star = 18.8% vs sub max = 8–10% → **main ให้ 2x**

**ใช้ Sub stat เมื่อ:**
- ไม่มี slot ว่างสำหรับ stat นั้น (slot ถูกใช้ไปกับ stat ที่สำคัญกว่า)
- ปริมาณที่ต้องการน้อย — ตัวอย่าง Speed wind-tempest ต้องการแค่ ~28 จาก card → sub 3–4 rolls เพียงพอ ไม่ต้องเสีย Sky slot
- stat นั้นไม่มี slot (Speed มีแค่ Sky — ถ้า Sky ใช้ SPR แทนได้มากกว่า → ยัด Speed ใน sub)

### Template วิเคราะห์ต่อ stat

```
stat: [ชื่อ]
ที่มา target: [สกิลหรือ passive ที่กำหนด cap/requirement]
target value: [ตัวเลข]
base (computeStats): [ตัวเลข]
ต้องการจาก card: target − base = [ตัวเลข]
main stat option: [slot → ค่า]
sub stat option: [rolls × tier1 = ค่า โดยใช้กี่ roll]
การตัดสิน: main / sub / mix
เหตุผล: [เปรียบ efficiency + opportunity cost ของ slot ที่ต้องเสีย]
```

### Checklist ก่อน commit statTargets

```
[ ] target ทุกตัวมาจากสกิล/passive — ไม่ได้ตั้งเองโดยไม่มีที่มา
[ ] cdmg target > 150 (base) หรือ [0,0] — ห้าม < 150
[ ] crit target > 5 (base) หรือ [0,0] — ห้าม < 5
[ ] Elucidator: crit และ cdmg ต้องเป็น [0,0] เสมอ
[ ] sum ของ roll demand ≤ 20r หลังหัก main stat แล้ว
[ ] main stat assignment สมเหตุสมผล (exclusive stat ได้ slot ที่ถูกต้อง)
[ ] weight ของ primary stat ≥ 15, secondary stat ≤ 12
[ ] ถ้ามี statTargets หลาย stage — LV13+M5 ต้องสูงกว่าหรือเท่ากับ LV10 เสมอ
```

### กฎ stat weight

**Primary stat** — มีที่มาจาก skill cap / mechanic โดยตรง → weight (15–25)

| ตัวอย่าง | เหตุผล |
|---|---|
| ailm Matoi weight 25 | skill cap ระบุชัด → mechanic หยุดขยายที่ค่านั้น |
| spr wind-tempest weight 25 | SP engine cap คำนวณได้ → ต้องถึงเพื่อไม่เสีย SP |
| crit ทุก DPS weight 18–20 | ต้องการสูงแต่ไม่มี cap ชัด → primary แต่ weight ต่ำกว่า cap stat |

**Secondary stat** — skill scale จากสถิตินั้นจริง แต่ไม่มี cap specific → weight (8–12)

| ตัวอย่าง | เหตุผล |
|---|---|
| cdmg DPS ทั่วไป weight 15 | scale ดาเมจ แต่ไม่มี mechanic cap |
| atk Matoi weight 8 | skill scale ATK แต่ ailm สำคัญกว่ามาก |
| dmgMulti Joker weight 12 | scale ดาเมจ แต่ set/weapon ให้มาบางส่วนแล้ว |

**ไม่เกี่ยว** — ไม่มีสกิลรองรับ → weight = 0

กฎ:
- **Survive เป็นหน้าที่ Medic/Guardian** — HP%/DEF% ใส่ได้เฉพาะตัวละครที่ skill scale จาก HP/DEF โดยตรง
- ห้าม fallback เป็น HP%/DEF% เพื่อ "อยู่รอด" สำหรับ Saboteur/Assassin/Sweeper
- **weight ต้องสะท้อน priority จริง** — ถ้า Star ควรไป Crit Rate ไม่ใช่ Crit Mult → cdmg weight ต้องต่ำกว่า crit weight

### กฎเลือก Sky slot

| ตัวเลือก | ใส่เมื่อ |
|---|---|
| **ATK%** | default สำหรับ DPS/Saboteur ที่ไม่มี speed problem |
| **SP Recovery** | SPR อยู่ใน stat target จาก skill (มี SP engine mechanic) |
| **Speed** | base speed ไม่รับประกัน turn order ที่ถูกต้อง |
| **DEF% / HP%** | skill scale จาก DEF/HP โดยตรงเท่านั้น |

**Speed note:** Saboteur/Strategist base speed > 100, Dealer < 100 → ออกก่อน dealer ตามธรรมชาติ → Speed main sky ไม่จำเป็นสำหรับ Saboteur/Strategist ส่วนใหญ่ ถ้าต้องการ speed นิดเดียว → ใส่ใน sub stat แทน

### กฎเลือก Moon slot (ATK% vs DMG Mult)

**ขั้นที่ 1 — exclusivity check:**
- ถ้า DMG Mult need > 0 → Moon → DMG Mult เสมอ (exclusive slot, ไม่ต้องคำนวณ multiplier)
- ถ้า Heal Effect need > 0 → Moon → Heal Effect เสมอ

**ขั้นที่ 2 — ถ้า DMG Mult need = 0** (Moon ว่าง) ค่อยเปรียบ multiplier:

สมการ: `BaseATK × (1+ATK%) × skill% × (1+DMGMult%)`
→ **เลือก stat ที่ multiplier ต่ำกว่าเสมอ** (return สูงกว่า)

1. รวม ATK% ทั้งหมด (base + weapon + set + Sky main)
2. รวม DMGMult% ทั้งหมด (base + weapon + set)
3. (1+ATK%) > (1+DMGMult%) → Moon → ATK% ไม่คุ้ม, ใช้ DMG Mult แทน

**กรณีทั่วไป:** Sky ใส่ ATK% +31.4% อยู่แล้ว → ATK% ฝั่งสูงขึ้น → **Moon → DMG Mult** เกือบทุกกรณีถ้า DMG Mult ยังขาดอยู่

### กฎเลือก Star slot (Crit Rate vs Crit Mult vs Ailment)

Star มี 3 stat exclusive ที่ไม่มี slot อื่น: Crit Rate, Crit Mult, Ailment Acc

**ลำดับความสำคัญ:**
1. คำนวณ `need` ของแต่ละ stat (target − base)
2. stat ที่ need > 0 เท่านั้นที่แข่งกัน — need = 0 ตัดออกทันที
3. เปรียบ weight: ตัวที่ weight สูงกว่าได้ Star

**กรณีที่พบบ่อย:**
- Crit Rate need > 0, Crit Mult need = 0 → Star → **Crit Rate**
- Crit Mult need > 0, Crit Rate need = 0 → Star → **Crit Mult**
- ทั้งคู่ need > 0: ดู weight — ถ้า cdmg weight < crit weight → Star → **Crit Rate**, cdmg จาก sub
- Ailment need > 0 และ weight สูงกว่า → Star → **Ailment**

**หมายเหตุ cdmg:** เนื่องจาก base cdmg = 150% อยู่แล้ว ตัวละครส่วนใหญ่มี cdmg need ต่ำกว่า crit need → Star → Crit Rate มักถูกต้องกว่า Star → Crit Mult สำหรับ DPS ทั่วไป

### กฎ Roll Budget

**Sub stat budget = 5 cards × 4 rolls = 20r สูงสุด**

เมื่อตั้ง stat target ให้ตรวจ:
```
sum ของ ceil(need_i / sub_tier1_i) ≤ 20r (รวม main stat แล้ว)
```
- ถ้า sum > 20r แม้หลังหัก main stat → target ไม่สามารถบรรลุทั้งหมดพร้อมกัน → ลด target หรือลด weight ของ secondary stat
- budget ควรมีเหลือสำหรับ stat อื่น — ไม่ใช่ทุก roll ต้องไปที่ stat เดียว

### ลำดับ slot ตามบทบาท

| บทบาท | Star | Sky | Moon |
|---|---|---|---|
| Assassin/Sweeper | Crit Rate\* | ATK% (หรือ SPR) | DMG Mult† |
| Saboteur | Ailment Acc (ถ้า target) | ATK% | DMG Mult† |
| Strategist | Crit Mult (ถ้า scale buff) | SPR | ATK%/ตามสกิล |
| Elucidator | **ห้าม Crit/CDmg** — ATK% ถ้า scale | SPD หรือ ATK% | ATK% |
| Medic | ATK%/Ailment Acc | HP%/SPR | Heal Effect |
| Guardian | — | DEF%/HP% | — |

\*ดูกฎ Star slot ข้างบน — Crit Mult ชนะถ้า cdmg need สูงกว่าและ weight สูงกว่า  
†ดูสูตร ATK% vs DMGMult ก่อนเสมอ — Speed ให้ใส่ sub stat ถ้าต้องการแค่ turn order

**Elucidator — กฎพิเศษ:**
- `crit` และ `cdmg` ต้อง `[0,0]` เสมอ — Elucidator ไม่ deal damage แบบ DPS ไม่ scale จาก crit
- Star slot → ATK% (ถ้า skill scale ATK) หรือ ไม่ใช้ถ้าไม่มี stat ที่เหมาะ
- ถ้าพบ Elucidator มี crit/cdmg weight > 0 → ผิดแน่นอน ต้องแก้ทันที

## ระบบ P5X ที่ต้องรู้

### Awareness vs Mindscape
- **Awareness** = เปิดตัวละคร (copy) — A0 = copy แรก = awareness ability ตัวแรก
- **Mindscape** = ระบบ stat bonus แยกต่างหาก — M5 = Mindscape LV5 ให้ stat เพิ่ม
- สองระบบนี้ไม่เกี่ยวกัน

### Highlight Gauge
- Shared gauge ของทั้งทีม — ทุก Thief action ชาร์จ 17% (hit weakness = 21%)
- เมื่อครบ 100% เลือกได้ว่าจะให้ใครในทีมใช้ Highlight ของตัวเอง
- Highlight ไม่นับเป็น action ปกติ
- หลังใช้ Highlight ตัวละครนั้นต้อง action อีก 4 ครั้งถึงจะใช้ได้อีก

### SP
- SP เต็มตั้งแต่เริ่มเกม
- สูตร SP จากสกิล: base SP + SP Recovery%

### Speed และ Turn Order
- ลำดับ action กำหนดโดย Speed — ยิ่งสูงยิ่งออกก่อน
- Dealer (Assassin/Sweeper) มี base Speed < 100, Buffer/Debuffer (Strategist/Saboteur) มี base Speed > 100 → dealer ออกหลัง buffer ตามธรรมชาติ
- **ควรให้ dealer อยู่ลำดับที่ 4** เพื่อรับ buff จากทุกคนก่อน action
- Speed จาก Revelation Card (card bonus) เป็น flat ค่า — target speed ที่ถูกต้องคือ **total = base + card** ไม่ใช่แค่ card contribution
- สูตรใน UI: `computeStats.spd` เริ่มจาก `char.baseStats.spd` + card bonus → "มีแล้ว" แสดง total
- ปรับ Speed ผ่าน: Revelation Card, Wonder Persona skill (Speed Master / Ironclad Resolve, ปรับได้ทีละ 3)

### Team Composition
- ทีม: Wonder + Buff + Buff/Debuff + Main Dealer + Elucidator
- ดู enemy จำนวน/weakness → เลือก Sweeper (AoE) หรือ Assassin (single)
- ลด DEF ศัตรูให้ใกล้ 0 → damage เพิ่ม ~2.6x
- CRIT Rate ให้ใกล้ 100% — หายาก ต้องวางแผนทั้งทีม
- ATK buff overlap แล้วได้ผลน้อยลง
