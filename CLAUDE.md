# NOR-CHOR / ENJ-EXCAVATOR — Claude Guidelines

## วิธีเลือก Card Set

### กฎเหล็ก
- **ห้ามเลือก 4pc set ก่อนแล้วค่อยหา Space card** — ลำดับผิด จะได้ผลผิดเสมอ
- **ห้ามเลือก card set โดยไม่ตรวจ stat target ของตัวละครก่อน**
- **ต้องตรวจว่า 4pc effect apply กับตัวละครนี้จริงไหม** (element check / condition check)

### ลำดับที่ถูกต้อง

**Step 1 — หา stat target ก่อน (จาก skill analysis)**
- stat target คืออะไร? มาจากสกิล cap / mechanic ของตัวละคร
- ห้ามใส่ stat ที่ไม่มี skill รองรับ (เช่น DEF ถ้าไม่มีสกิลที่ scale DEF)

**Step 2 — หา card set ที่ให้ stat นั้นผ่าน 2pc หรือ 4pc**
- ดู CARD_SETS ทีละตัว: stats2 และ stats4 ให้อะไร?
- **ตรวจ 4pc effect ว่า apply กับตัวละครนี้จริงไหม:**
  - มีเงื่อนไข element? (เช่น "Fire DMG" → ไม่ใช้กับ Ice character)
  - มีเงื่อนไข role? (เช่น "Navigator Thieves only")
  - conditional หรือ permanent? conditional ต้อง estimate uptime จาก kit
- เปรียบระหว่าง set ต่างๆ: ผลรวม stat ที่ได้จริง (2pc + 4pc ที่ apply) ตัวไหนสูงกว่า

**Step 3 — หา Space card ที่มี passive ตรงกับ set นั้น**
- ดู REVELATION_CARDS.Space: Space card ไหนมี passive ชื่อเดียวกับ 4pc set ที่เลือก?
- passive นั้นให้ stat อะไร? ตรงกับ stat target ของตัวละครไหม?
- ถ้า Space card ที่มี passive นั้นมีหลายตัว ให้เลือกตัวที่ passive อื่นๆ เป็นประโยชน์ที่สุดด้วย

**Step 4 — ยืนยัน pair**
- 4pc set name ต้องตรงกับ passive name ใน Space card → Space passive activate
- format: `cards: ['[SetName] 4pc']` เสมอ (ไม่ใช่ 2pc+2pc)

### กฎ 2pc vs 4pc
- **2pc+2pc → ได้แค่ผล 2pc ของแต่ละ set, Space passive ไม่ activate**
- **4pc → ได้ผล 2pc + 4pc + Space passive activate**
- ใช้ 2pc+2pc เฉพาะเมื่อ: ไม่มี 4pc set ที่ดีพอ และ Space passive ไม่จำเป็น

### Checklist ก่อน commit card data
```
[ ] stat ที่ 4pc set ให้ตรงกับ stat target ของตัวละครจริง
[ ] 4pc effect ไม่มีเงื่อนไข element/role ที่ตัวละครนี้ทำไม่ได้
[ ] Space card มี passive ชื่อตรงกับ 4pc set name
[ ] Space passive ให้ stat ที่ตัวละครต้องการ (ไม่ใช่แค่ชื่อตรง)
[ ] cards array format: ['[SetName] 4pc'] ถูกต้อง
```

### ตัวอย่างที่ผิด (Matoi)
- ❌ เลือก Peace 4pc + Opulence 2pc โดยไม่มาจาก skill → Opulence ให้ Ice dmgMulti ซึ่ง Matoi ไม่ต้องการ
- ❌ เลือก Defeat 4pc เพราะ 2pc ให้ ailm — แต่ไม่ตรวจ 4pc effect ("Fire DMG") → Matoi เป็น Ice ใช้ไม่ได้
- ✅ Futility 4pc: 4pc ให้ ailm +30% หลัง Technical — Matoi trigger Technical ทุก ~2 round → high uptime → ตรง mechanic โดยตรง

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

### กฎ slot ที่ไม่มี stat target

**ถ้า slot ไม่มี stat ที่มาจาก skill → แสดง "-" เท่านั้น ห้าม fallback เอง**

เหตุผล:
- **Survive เป็นหน้าที่ Medic/Guardian** ไม่ใช่ Saboteur/Assassin/Sweeper
- HP%/DEF% ใส่ได้เฉพาะตัวละครที่ **skill scale จาก HP/DEF โดยตรง** (เช่น shield strength, heal scaling)
- ถ้าใส่ DEF% ให้ Saboteur โดยไม่มีที่มาจาก skill = ทำผิด rule "ห้ามตั้งเองโดยไม่มีที่มาจาก skill"

**HP% / DEF% main stat ใส่ได้เมื่อ:**
- skill/passive ระบุ scaling จาก HP หรือ DEF โดยตรง
- ตัวละครนั้นเป็น Guardian หรือ Medic ที่ต้องรับ damage แทนทีม และ kit scale จาก DEF/HP

### กฎเลือก Sky slot

Sky มี 5 ตัวเลือก: ATK% / DEF% / HP% / Speed / SP Recovery

**ATK%** — default สำหรับ Assassin/Sweeper/Saboteur ที่ personal damage มีความหมาย และไม่มี speed problem

**Speed** — ใส่ได้เฉพาะเมื่อ base speed ไม่รับประกัน turn order ที่ถูกต้อง
- Saboteur/Strategist มี base speed > 100, Dealer มี base speed < 100 → ออกก่อน dealer ตามธรรมชาติ → **Speed บน Sky ไม่จำเป็นสำหรับ Saboteur/Strategist ส่วนใหญ่**
- Speed main บน Sky (20.3) มีความหมายเมื่อต้องการ outspeed ตัวละคร support คนอื่นในทีมเท่านั้น
- ถ้าต้องการ speed แค่นิดเดียว → ใส่ใน sub stat แทน ไม่ต้องเสีย Sky slot

**SP Recovery** — ใส่เมื่อ SPR อยู่ใน stat target จาก skill เท่านั้น (ตัวละครที่มี SP engine mechanic เช่น wind-tempest)

**DEF% / HP%** — ตาม rule เดิม: skill ต้อง scale จาก DEF/HP โดยตรง

### กฎเลือก Moon slot (ATK% vs DMG Mult)

สมการดาเมจ: `BaseATK × (1+ATK%) × skill% × (1+DMGMult%) × ...`

**marginal return เท่ากันเมื่อ (1+ATK%) = (1+DMGMult%)** → เลือก stat ที่ต่ำกว่าเสมอ

**ขั้นตอน:**
1. รวม ATK% ทั้งหมดที่มีอยู่แล้ว (base stat + weapon + set + **Sky**)
2. รวม DMGMult% ทั้งหมดที่มีอยู่แล้ว
3. เปรียบ (1+ATK%) vs (1+DMGMult%) → Moon → stat ที่ต่ำกว่า

**กรณีทั่วไป:** Sky บังคับ ATK% (+31.4%) อยู่แล้ว → ATK% ฝั่งสูงขึ้น → **Moon → DMG Mult** มักจะดีกว่า ATK% ซ้ำ

### ลำดับความสำคัญ slot ตามประเภทตัวละคร

- **DPS (Assassin/Sweeper):** Star → Crit Mult, Sky → ATK% (หรือ SPR ถ้า skill target), Moon → DMG Mult (ดูสูตรก่อน)
- **Buffer (Strategist):** Star → Crit Mult (ถ้า scale buff), Sky → SPR, Moon → ATK% หรือตามสกิล
- **Saboteur:** Star → Ailment Acc (ถ้า target), Sky → ATK%, Moon → DMG Mult (ดูสูตรก่อน)
- **Medic:** Moon → Heal Effect, Star → ATK% หรือ Ailment Acc, Sky → HP% หรือ SPR
- **Speed สำหรับทุกบทบาท:** ใส่ใน sub stat ถ้าต้องการแค่ turn order — ไม่ต้องเสีย Sky slot

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
