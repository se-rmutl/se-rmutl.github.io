# Student Guide — สร้าง GitHub Learning Portfolio แบบ Step-by-Step
## Workshop 1 ชั่วโมง 30 นาที สำหรับนักศึกษาใหม่วิศวกรรมซอฟต์แวร์
### ใช้ Windows + VS Code สำหรับแก้ไขไฟล์ + Git Command Line ผ่าน CMD

---

## 0. ผลปลายทางที่เราจะทำให้ได้

หลังจบ workshop นี้ นักศึกษาจะมี GitHub repository ของตนเองชื่อประมาณนี้

```text
https://github.com/USERNAME/se-bootcamp-portfolio
```

และเมื่อเปิด repository จะเห็นหน้า `README.md` เป็น **GitHub Learning Portfolio** ที่มีเนื้อหาประมาณนี้

- About Me
- Why I Study Software Engineering
- What I Learned in SE Bootcamp
- My Flowgorithm Labs
- AI Usage Note
- Developer Tools I Used
- My First Git Workflow
- Portfolio Checklist
- Learning Goals
- Reflection
- Repository Link

> เป้าหมายของวันนี้ไม่ใช่ทำให้สวยที่สุด แต่ทำให้ “เริ่มต้นถูกทาง” และเข้าใจ workflow ของนักพัฒนาซอฟต์แวร์จริง

---

## 1. แนวคิดก่อนเริ่ม

วันนี้เราจะใช้เครื่องมือ 3 อย่าง แต่แยกหน้าที่ให้ชัดเจน

| เครื่องมือ | ใช้ทำอะไรใน workshop นี้ |
|---|---|
| Visual Studio Code | เปิดโฟลเดอร์ แก้ไข `README.md` และบันทึกไฟล์ |
| Command Prompt / CMD | ใช้สั่งคำสั่ง Git เช่น `git init`, `git add`, `git commit`, `git push` |
| GitHub Website | สร้าง repository และดูผลงานที่ push ขึ้นไป |

ยังไม่เชื่อม VS Code เข้ากับ GitHub ใน workshop นี้ เพราะเราต้องการให้เห็นว่า Git ทำงานอย่างไรผ่าน command line ก่อน

---

## 2. คำศัพท์ที่ต้องรู้แบบง่าย

| คำศัพท์ | ความหมาย |
|---|---|
| Git | เครื่องมือเก็บประวัติการเปลี่ยนแปลงของไฟล์ในเครื่องเรา |
| GitHub | เว็บไซต์สำหรับเก็บ repository ออนไลน์และแสดงผลงาน |
| Repository / repo | โฟลเดอร์ project ที่ Git ติดตามการเปลี่ยนแปลง |
| README.md | ไฟล์แนะนำ project ที่ GitHub แสดงเป็นหน้าแรก |
| Markdown | รูปแบบเขียนเอกสารที่อ่านง่ายและแสดงผลสวยบน GitHub |
| Commit | การบันทึก snapshot ของงาน ณ จุดหนึ่ง |
| Remote | repository ปลายทางบน GitHub |
| Push | ส่ง commit จากเครื่องเราขึ้น GitHub |
| Status | ตรวจว่าไฟล์มีการเปลี่ยนแปลงอะไรบ้าง |

---

## 3. Checklist ก่อนลงมือ

ให้นักศึกษาตรวจ 4 ข้อนี้ก่อน

| รายการ | วิธีตรวจ | สถานะ |
|---|---|---|
| มี GitHub account | login ที่ github.com ได้ | ☐ |
| มี Git for Windows | CMD: `git --version` | ☐ |
| มี VS Code | เปิด Visual Studio Code ได้ | ☐ |
| มี internet | เปิด GitHub ได้ | ☐ |

---

# Part A — เตรียมเครื่องและตั้งค่า Git

## Step 1 — เปิด Command Prompt

1. กดปุ่ม Start
2. พิมพ์ `cmd`
3. เปิดโปรแกรม **Command Prompt**

เราจะใช้ CMD เพื่อสั่ง Git command ทั้งหมดใน workshop นี้

---

## Step 2 — ตรวจว่า Git ใช้งานได้

พิมพ์คำสั่งนี้ใน CMD

```cmd
git --version
```

ผลลัพธ์ที่คาดหวัง เช่น

```cmd
git version 2.xx.x.windows.x
```

ถ้าเห็น version แปลว่า Git พร้อมใช้งาน

ถ้าขึ้นข้อความประมาณนี้

```cmd
'git' is not recognized as an internal or external command
```

ให้แจ้งผู้สอน เพราะเครื่องอาจยังไม่ได้ติดตั้ง Git หรือ PATH ยังไม่ถูกต้อง

---

## Step 3 — ตั้งค่า Git ครั้งแรก

Git ต้องรู้ว่า commit นี้เป็นของใคร ให้ตั้งชื่อและ email ดังนี้

```cmd
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
git config --global init.defaultBranch main
```

ตัวอย่าง

```cmd
git config --global user.name "Somchai Software"
git config --global user.email "somchai@example.com"
git config --global init.defaultBranch main
```

ตรวจค่าที่ตั้งไว้

```cmd
git config user.name
git config user.email
```

### ทำไมต้องตั้งค่านี้

เมื่อเราสร้าง commit Git จะบันทึกชื่อและ email ไว้ในประวัติ เพื่อให้รู้ว่าใครเป็นคนเปลี่ยนแปลงงาน

---

# Part B — สร้าง Portfolio ในเครื่อง

## Step 4 — สร้างโฟลเดอร์ project

ใน CMD พิมพ์

```cmd
cd %USERPROFILE%\Documents
mkdir se-bootcamp-portfolio
cd se-bootcamp-portfolio
```

ตรวจว่าอยู่ในโฟลเดอร์ถูกต้อง

```cmd
cd
```

ควรเห็น path ประมาณนี้

```cmd
C:\Users\YourName\Documents\se-bootcamp-portfolio
```

---

## Step 5 — เปิดโฟลเดอร์ด้วย VS Code

ถ้าคำสั่ง `code` ใช้ได้ ให้พิมพ์ใน CMD

```cmd
code .
```

ถ้าใช้ไม่ได้ ให้เปิด VS Code เอง

1. เปิด Visual Studio Code
2. ไปที่เมนู `File`
3. เลือก `Open Folder...`
4. เลือกโฟลเดอร์ `Documents\se-bootcamp-portfolio`
5. กด `Select Folder`

> VS Code ใช้เปิดและแก้ไฟล์เท่านั้น วันนี้ยังไม่ใช้ Source Control panel ของ VS Code

---

## Step 6 — สร้างไฟล์ README.md

ใน VS Code

1. ที่แถบ Explorer ด้านซ้าย คลิกขวาที่พื้นที่ว่าง
2. เลือก `New File`
3. ตั้งชื่อไฟล์ว่า

```text
README.md
```

4. กด Enter
5. เปิดไฟล์ `README.md`
6. คัดลอก template ใน Step 7 ไปวาง
7. กด `Ctrl + S` เพื่อบันทึก

---

## Step 7 — คัดลอก Portfolio Template

คัดลอกข้อความด้านล่างไปใส่ใน `README.md` แล้วแก้ข้อมูลให้เป็นของตนเอง

````markdown
# My SE Bootcamp Learning Portfolio

> Portfolio สำหรับเก็บหลักฐานการเรียนรู้ของฉันในกิจกรรม SE Bootcamp 2569

---

## 👋 About Me

| รายการ | ข้อมูลของฉัน |
|---|---|
| Name | |
| Nickname | |
| Program | Software Engineering, RMUTL |
| Background | |
| Interest | Web / Mobile / AI / Game / IoT / Data / UX/UI / ยังไม่แน่ใจ |
| Goal | |

---

## 🎯 Why I Study Software Engineering

เขียนสั้น ๆ ว่าทำไมถึงสนใจเรียนวิศวกรรมซอฟต์แวร์

---

## 📚 What I Learned

### Day 01: Digital Foundation
- 

### Day 02: Logic & Flowgorithm Lab 1
- 

### Day 03: Flowgorithm Lab 2–3
- 

### Day 04: AI, Web Technology and Network
- 

### Day 05: GitHub and Developer Tools
- 

---

## 🧪 My Flowgorithm Labs

| Lab | What I Learned | Status |
|---|---|---|
| Pass / Fail | | ☐ |
| Grade Calculator | | ☐ |
| Average Score | | ☐ |
| Loop Practice | | ☐ |

---

## 🤖 AI Usage Note

### วันนี้ฉันใช้ AI ช่วยเรื่องอะไร
- 

### Prompt ที่ฉันใช้
```text

```

### ฉันตรวจสอบคำตอบของ AI อย่างไร
- 

### สิ่งที่ฉันยังต้องเรียนรู้เอง
- 

---

## 🧰 Developer Tools I Used

| Tool | Used for | Confidence |
|---|---|---|
| VS Code | แก้ไข README.md | ⭐ |
| Command Prompt | ใช้ Git command | ⭐ |
| Git | บันทึก commit | ⭐ |
| GitHub | แสดง portfolio ออนไลน์ | ⭐ |
| Markdown | จัดรูปแบบ README | ⭐ |

---

## 📝 My First Git Commands

```cmd
git init
git add README.md
git commit -m "Add initial learning portfolio"
git remote add origin https://github.com/USERNAME/se-bootcamp-portfolio.git
git push -u origin main
```

---

## ✅ Portfolio Checklist

| รายการ | สถานะ |
|---|---|
| สร้าง GitHub account ได้ | ☐ |
| สร้าง repository ได้ | ☐ |
| สร้าง README.md ได้ | ☐ |
| ใช้ Markdown ได้ | ☐ |
| commit งานแรกได้ | ☐ |
| push ขึ้น GitHub ได้ | ☐ |
| เปิด repository แล้วเห็น README ได้ | ☐ |
| มีเป้าหมายการเรียนต่อ | ☐ |

---

## 🌱 My Learning Goals

### เป้าหมายใน 1 สัปดาห์
- 

### เป้าหมายใน 1 เดือนแรก
- 

---

## 💬 Reflection

### สิ่งที่ฉันได้เรียนรู้มากที่สุด
- 

### เรื่องที่ยังไม่เข้าใจ
- 

### สิ่งที่ฉันจะฝึกต่อ
- 

---

## 🔗 Repository Link

```text
https://github.com/USERNAME/se-bootcamp-portfolio
```
````

---

## Step 8 — Preview Markdown ใน VS Code

ให้เปิด preview เพื่อดูว่า README แสดงผลอย่างไร

วิธีที่ 1

```text
Ctrl + Shift + V
```

วิธีที่ 2

1. คลิกขวาในไฟล์ `README.md`
2. เลือก `Open Preview`

ตรวจว่า

- หัวข้อแสดงถูกต้อง
- ตารางไม่พัง
- bullet list อ่านง่าย
- code block แสดงถูกต้อง
- ไม่มีข้อความติดกันจนอ่านยาก

---

# Part C — ใช้ Git ในเครื่อง

## Step 9 — เริ่ม Git repository

กลับไปที่ CMD แล้วให้แน่ใจว่าอยู่ในโฟลเดอร์ project

```cmd
cd %USERPROFILE%\Documents\se-bootcamp-portfolio
```

เริ่ม Git repository

```cmd
git init
```

คำสั่งนี้ทำให้โฟลเดอร์นี้กลายเป็น repository ที่ Git เริ่มติดตามประวัติการเปลี่ยนแปลงได้

---

## Step 10 — ตรวจสถานะด้วย git status

พิมพ์

```cmd
git status
```

ควรเห็นว่า `README.md` เป็นไฟล์ใหม่ที่ยังไม่ถูก track

แนวคิดที่ต้องเข้าใจ

```text
Working folder  →  Staging area  →  Commit history
```

ตอนนี้ README อยู่ใน working folder แต่ยังไม่ได้ถูกเตรียม commit

---

## Step 11 — เพิ่ม README.md เข้า staging area

พิมพ์

```cmd
git add README.md
```

ตรวจอีกครั้ง

```cmd
git status
```

ตอนนี้ Git ควรบอกว่า `README.md` พร้อมจะ commit แล้ว

### อธิบายง่าย ๆ

`git add` ไม่ได้แปลว่า upload ขึ้น GitHub แต่แปลว่า “เลือกไฟล์นี้ไว้สำหรับ commit รอบต่อไป”

---

## Step 12 — สร้าง commit แรก

พิมพ์

```cmd
git commit -m "Add initial learning portfolio"
```

ตรวจ commit

```cmd
git log --oneline
```

ควรเห็น commit 1 รายการ เช่น

```cmd
a1b2c3d Add initial learning portfolio
```

### Commit คืออะไร

Commit คือจุดบันทึกประวัติงาน เช่น save point ในเกม เมื่อย้อนดูทีหลังจะรู้ว่าเราเปลี่ยนอะไรไว้เมื่อใด

---

# Part D — สร้าง Repository บน GitHub

## Step 13 — สร้าง repo บน GitHub Website

ใน browser

1. เข้า GitHub และ login
2. กดปุ่ม `+` มุมขวาบน
3. เลือก `New repository`
4. ตั้งชื่อ repository ว่า

```text
se-bootcamp-portfolio
```

5. Description ใส่ เช่น

```text
My first Software Engineering learning portfolio
```

6. เลือก Public หรือ Private ตามที่อาจารย์กำหนด
7. **ห้ามเลือก Add a README file**
8. ไม่ต้องเลือก `.gitignore`
9. ไม่ต้องเลือก license
10. กด `Create repository`

### ทำไมไม่เลือก Add README

เพราะเราสร้าง `README.md` ในเครื่องแล้ว ถ้า GitHub สร้าง README ให้ด้วย จะเกิด commit อยู่บน GitHub ก่อน และทำให้ push ครั้งแรกซับซ้อนขึ้นสำหรับผู้เริ่มต้น

---

## Step 14 — เชื่อม local repo กับ GitHub

หลังสร้าง repository GitHub จะแสดง URL ประมาณนี้

```text
https://github.com/USERNAME/se-bootcamp-portfolio.git
```

ให้คัดลอก URL ของตนเอง แล้วกลับไป CMD

พิมพ์คำสั่ง โดยเปลี่ยน `USERNAME` เป็น username ของตนเอง

```cmd
git remote add origin https://github.com/USERNAME/se-bootcamp-portfolio.git
git branch -M main
git push -u origin main
```

ระหว่าง push อาจมีหน้าต่างให้ login GitHub หรือเปิด browser ให้ยืนยันตัวตน ให้ทำตามขั้นตอนบนหน้าจอ

---

## Step 15 — ตรวจผลบน GitHub

หลัง push สำเร็จ

1. กลับไปหน้า repository บน GitHub
2. Refresh หน้าเว็บ
3. ต้องเห็นไฟล์ `README.md`
4. ต้องเห็นเนื้อหา portfolio แสดงที่หน้าแรก
5. Copy URL ส่งให้อาจารย์

ตัวอย่าง URL

```text
https://github.com/USERNAME/se-bootcamp-portfolio
```

---

# Part E — ปรับ Portfolio ให้ดีขึ้นและ commit รอบที่ 2

## Step 16 — แก้ README ใน VS Code

กลับไปที่ VS Code แล้วเติมข้อมูลให้ละเอียดขึ้น เช่น

- About Me
- Interest
- What I Learned แต่ละวัน
- My Flowgorithm Labs
- AI Usage Note
- Learning Goals
- Reflection

กด `Ctrl + S` เพื่อบันทึก

---

## Step 17 — ตรวจว่า Git เห็นการแก้ไขหรือไม่

ใน CMD พิมพ์

```cmd
git status
```

ควรเห็นว่า `README.md` ถูกแก้ไข

---

## Step 18 — commit และ push รอบที่ 2

พิมพ์

```cmd
git add README.md
git commit -m "Improve README learning portfolio"
git push
```

กลับไป GitHub แล้ว refresh เพื่อดูว่า README เปลี่ยนแล้วหรือไม่

---

# Part F — ตรวจผลงานสุดท้าย

## Portfolio Completion Checklist

| รายการ | ต้องมี | สถานะ |
|---|---|---|
| Repository เปิดดูได้ | URL เปิดได้ | ☐ |
| README แสดงผล | GitHub แสดงหน้า README | ☐ |
| About Me | มีข้อมูลแนะนำตัว | ☐ |
| What I Learned | สรุป Day 01–05 | ☐ |
| Flowgorithm Labs | มีตาราง lab | ☐ |
| AI Usage Note | อธิบายว่าใช้ AI อย่างไร | ☐ |
| Git Commands | มีคำสั่ง Git ที่ใช้ | ☐ |
| Learning Goals | มีเป้าหมาย 1 สัปดาห์/1 เดือน | ☐ |
| Reflection | สะท้อนสิ่งที่เรียนรู้และสิ่งที่ต้องฝึกต่อ | ☐ |
| Commit อย่างน้อย 2 ครั้ง | initial + improve | ☐ |

---

# Part G — Troubleshooting

## ปัญหา 1: git ไม่ทำงาน

อาการ

```cmd
'git' is not recognized as an internal or external command
```

แนวทางแก้

- แจ้งผู้สอน
- ตรวจว่า Git for Windows ติดตั้งแล้วหรือไม่
- ปิด CMD แล้วเปิดใหม่

---

## ปัญหา 2: commit ไม่ได้เพราะยังไม่ตั้งชื่อ/email

แก้ด้วย

```cmd
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

แล้วลอง commit อีกครั้ง

---

## ปัญหา 3: remote origin already exists

ตรวจ remote

```cmd
git remote -v
```

แก้ URL ใหม่

```cmd
git remote set-url origin https://github.com/USERNAME/se-bootcamp-portfolio.git
```

---

## ปัญหา 4: push ไม่ผ่านเพราะ GitHub มี README อยู่แล้ว

สาเหตุที่พบบ่อยคือ ตอนสร้าง repository บน GitHub นักศึกษาเลือก `Add a README file`

วิธีแก้ที่ง่ายที่สุดสำหรับ workshop แรก

1. ลบ repository เดิม หรือสร้าง repository ใหม่
2. ตอนสร้างใหม่ ห้ามเลือก Add README
3. ลอง `git remote set-url origin ...` ให้ถูก
4. push ใหม่

ถ้าเวลาไม่พอ ให้ส่งไฟล์ `README.md` ให้อาจารย์ก่อน แล้วค่อยแก้เรื่อง Git ภายหลัง

---

## ปัญหา 5: ลืมว่าตอนนี้อยู่โฟลเดอร์ไหน

ใช้คำสั่ง

```cmd
cd
```

หรือดูไฟล์ในโฟลเดอร์

```cmd
dir
```

ถ้าไม่เห็น `README.md` แปลว่าอาจอยู่ผิดโฟลเดอร์

---

# Part H — Challenge 2 ข้อสำหรับค้นคว้าทำเอง

## Challenge 1 — เพิ่มโฟลเดอร์ Labs และเชื่อม link ใน README

### เป้าหมาย

ทำให้ portfolio ไม่ได้มีแค่ README แต่เริ่มมีโครงสร้างเหมือน repository ของนักพัฒนาจริง

### สิ่งที่ต้องทำ

1. สร้างโฟลเดอร์ชื่อ `labs`
2. ในโฟลเดอร์ `labs` สร้างไฟล์ `flowgorithm-labs.md`
3. เขียนสรุป lab อย่างน้อย 3 งาน เช่น
   - Pass / Fail
   - Grade Calculator
   - Average Score
4. กลับไปแก้ `README.md` แล้วเพิ่ม link ไปยังไฟล์นี้

ตัวอย่าง link ใน README

```markdown
## My Lab Notes
- [Flowgorithm Labs](labs/flowgorithm-labs.md)
```

### คำสั่งที่อาจใช้

```cmd
mkdir labs
```

หลังแก้ไฟล์แล้ว commit

```cmd
git status
git add README.md labs/flowgorithm-labs.md
git commit -m "Add Flowgorithm lab notes"
git push
```

### สิ่งที่ต้องค้นคว้าเอง

- Markdown relative link คืออะไร
- GitHub แสดงไฟล์ `.md` ในโฟลเดอร์ย่อยอย่างไร
- การจัดโฟลเดอร์ใน repository ที่ดีควรทำอย่างไร

---

## Challenge 2 — ทำ README ให้อ่านง่ายและดูเป็น Portfolio มากขึ้น

### เป้าหมาย

ปรับ README ให้ดูดีขึ้นโดยใช้ Markdown เพิ่มเติม แต่ยังต้องอ่านง่าย ไม่รก และไม่ copy โดยไม่เข้าใจ

### เลือกทำอย่างน้อย 2 อย่าง

1. เพิ่มสารบัญด้วย link ภายในหน้า
2. เพิ่ม checklist แบบ GitHub task list
3. เพิ่มส่วน `<details>` เพื่อซ่อน/แสดงเนื้อหายาว
4. เพิ่ม badge ง่าย ๆ เช่น `Learning`, `GitHub`, `Markdown`
5. เพิ่มตาราง Learning Goals ที่ชัดขึ้น
6. เพิ่ม section “Next Project Ideas”

### ตัวอย่าง task list

```markdown
## Progress
- [x] Create GitHub account
- [x] Create first repository
- [x] Add README.md
- [ ] Add lab notes
- [ ] Improve portfolio design
```

### ตัวอย่าง details

```markdown
<details>
<summary>Click to view my Git commands</summary>

```cmd
git status
git add README.md
git commit -m "Update README"
git push
```

</details>
```

### สิ่งที่ต้องค้นคว้าเอง

- GitHub Flavored Markdown คืออะไร
- Markdown task list ทำอย่างไร
- `<details>` และ `<summary>` ใช้ใน README ได้อย่างไร
- README ที่ดีควรยาวแค่ไหนและจัดหัวข้ออย่างไร

---

# Part I — ส่งงานให้อาจารย์

ให้นักศึกษาส่ง

1. GitHub repository URL
2. Screenshot หน้า repository ที่เห็น README
3. บอกจำนวน commit ที่ทำได้
4. ตอบ Exit Ticket 3 ข้อ

## Exit Ticket

1. วันนี้ฉันเข้าใจคำว่า commit ว่าอย่างไร
2. คำสั่ง Git ที่ฉันยังไม่มั่นใจคืออะไร
3. ฉันจะปรับ portfolio ของตัวเองต่ออย่างไร

---

# Part J — สรุปท้าย Workshop

สิ่งที่นักศึกษาทำได้ในวันนี้

- สร้าง README.md
- เขียน Markdown เบื้องต้น
- ใช้ VS Code แก้ไขไฟล์
- ใช้ CMD สั่ง Git
- สร้าง commit แรก
- สร้าง repository บน GitHub
- push งานขึ้น GitHub
- ได้ portfolio เริ่มต้นของตนเอง

ข้อความสำคัญ

> Every developer starts with a first commit. วันนี้อาจเป็นเพียง README แรก แต่คือจุดเริ่มต้นของ portfolio วิศวกรซอฟต์แวร์ในอนาคต

---

# References สำหรับผู้สอน

- Git official documentation: https://git-scm.com/
- Pro Git Book — First-Time Git Setup: https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup
- GitHub Docs — Quickstart for repositories: https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories
- GitHub Docs — Creating a new repository: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
- GitHub Docs — Managing remote repositories: https://docs.github.com/en/get-started/git-basics/managing-remote-repositories
- GitHub Docs — Basic writing and formatting syntax: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
- VS Code Docs — Markdown and Visual Studio Code: https://code.visualstudio.com/docs/languages/markdown
