# ENGSE203 Week 03 Interactive Teaching Sandbox v2 Checked

สื่อการสอนเชิงปฏิบัติแบบ Single Page HTML สำหรับสัปดาห์ที่ 3 เรื่อง Web UI, Responsive Layout, Event และ Form

## วิธีใช้งาน

1. แตกไฟล์ ZIP
2. เปิด `index.html` ด้วย Chrome, Edge หรือ Safari
3. ใช้เมนูด้านซ้ายเพื่อเรียนทีละหัวข้อ
4. ใช้ปุ่ม `A-`, `A`, `A+` เพื่อปรับขนาดตัวอักษร และ `Full screen` เพื่อฉาย projector
5. ในหัวข้อ Code Playground สามารถแก้ HTML/CSS/JavaScript แล้วกด Run ได้ทันที

## สิ่งที่ตรวจแล้ว

- ไม่มี dependency ภายนอก
- รูปอยู่ในโฟลเดอร์ `images/`
- JavaScript syntax ตรวจผ่าน
- ไม่มี duplicate id
- Code Playground ใช้ `iframe srcdoc` แยกจากหน้าหลัก
- รองรับ mobile/tablet/desktop



## v3 Syntax Fixed

แก้ปัญหา Console error ที่พบในเวอร์ชัน v2:

- `Uncaught SyntaxError: Unexpected end of input`
- `Uncaught SyntaxError: Unexpected token '{'`

สาเหตุหลักมาจาก Code Playground สร้าง `<script>` ลงใน `iframe srcdoc` โดยตรง ทำให้บาง browser / live server ตีความ source ของ preview เป็น script ซ้อนกันได้ไม่เสถียร

การแก้ไขใน v3:

1. เปลี่ยน `runCode()` ให้สร้าง HTML/CSS ใน iframe ก่อน แล้วจึงรัน JavaScript ผ่าน `frame.contentWindow.eval(js)` หลัง iframe โหลดเสร็จ
2. เลี่ยงการฝัง `<script>...</script>` แบบตรง ๆ ใน string ของ parent page
3. ปรับปุ่ม Copy combined HTML ให้ประกอบ `<script>` ด้วย `'<scr' + 'ipt>'` และ `'</scr' + 'ipt>'` เพื่อไม่ให้ HTML parser ปิด script ผิดจุด
4. ตรวจ JavaScript syntax ด้วย `node --check`
5. ตรวจว่ารูปภาพในโฟลเดอร์ `images/` ถูกอ้างอิงครบ

เปิดใช้งานโดยเปิด `index.html` ผ่าน Live Server หรือเว็บเซิร์ฟเวอร์ local เช่น `http://127.0.0.1:5502/.../index.html`
