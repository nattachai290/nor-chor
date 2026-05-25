# NOR-CHOR / ENJ-EXCAVATOR — Claude Guidelines

## วิธีเลือก Card Set

1. ดู Space card ที่ใช้ → passive มีอะไรบ้าง (เช่น Creation → Worry/Reconciliation/Tenacity passive)
2. วิเคราะห์ mechanic ตัวละคร → stat หลักที่ต้องการคืออะไร
3. เลือก 4pc set ที่ activate passive ของ Space card ที่ดีที่สุด พร้อมให้ stat ที่ต้องการ
4. **2pc+2pc → ได้แค่ผล 2pc ของแต่ละ set, Space passive ไม่ activate**
5. **4pc → ได้ผล 2pc + 4pc + Space passive activate**
6. format ที่ถูกต้อง: Space 1 ใบ + 4pc เสมอ (ถ้าต้องการ Space passive)

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

### ลำดับความสำคัญ slot ตามประเภทตัวละคร

- **DPS (Assassin/Sweeper):** Star → Crit Mult, Sky → ATK% หรือ SPR ตามสกิล, Moon → ATK% หรือ DMG Mult
- **Buffer (Strategist):** Star → Crit Mult (ถ้า scale buff), Sky → SPR, Moon → ATK% หรือตามสกิล
- **Medic:** Moon → Heal Effect, Star → ATK% หรือ Ailment Acc, Sky → HP% หรือ SPR
- **Speed สำหรับทุกบทบาท:** ใส่ใน sub stat ถ้าต้องการแค่ turn order — ไม่ต้องเสีย Sky slot ยกเว้นต้องการมาก

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
