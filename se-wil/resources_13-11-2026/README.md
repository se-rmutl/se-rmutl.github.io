# resources (เก็บในเครื่องเท่านั้น ไม่ขึ้น git)

โฟลเดอร์นี้ถูกกันด้วยกฎ `resources/` ใน `.gitignore` ของ repo `se-rmutl.github.io`
GitHub Pages จึงไม่เผยแพร่ไฟล์ใดในนี้ กฎนี้มีผลกับทุกโฟลเดอร์ชื่อ `resources` ใน repo

| โฟลเดอร์ | เก็บอะไร |
|---|---|
| `sewil-app/` | ซอร์สโค้ดระบบ SE-WIL (Google Apps Script) ชุดทดสอบ และขั้นตอน deploy `DEPLOY-2-2569.md` |
| `sewil-app/deploy/` | สร้างตอนรัน `clasp create` เก็บ `.clasp.json` ที่ผูกกับโปรเจกต์ |
| `data/` | ข้อมูลส่วนบุคคลและค่าลับ เช่น รายชื่อนักศึกษา URL และ Deployment ID |

ข้อควรระวัง
- ไฟล์ในนี้ไม่มีสำเนาบน GitHub ให้สำรองไว้ที่โฟลเดอร์ Drive "SE-WIL" หรือ Time Machine
- อย่าย้ายข้อมูลรายคนออกไปไว้ที่อื่นใน `se-wil/` เพราะไฟล์นอก `resources/` จะถูกเผยแพร่เมื่อ commit
- ตรวจได้ว่ากันจริงด้วย `git check-ignore -v se-wil/resources/data/x` (ต้องแสดงบรรทัด `.gitignore:1:resources/`)
