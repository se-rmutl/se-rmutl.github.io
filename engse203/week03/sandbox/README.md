# ENGSE203 Week 03 Interactive Teaching Sandbox — v5 GitHub Pages Safe

เวอร์ชันนี้จัดทำต่อจาก v4 โดยตรวจซ้ำสำหรับการเปิดผ่าน VS Code Live Server และ GitHub Pages

## สิ่งที่ตรวจและแก้ไข

- ไม่มี `allow-same-origin` ใน `iframe sandbox`
- ไม่มี `frame.contentWindow.eval()`
- ใช้ `iframe srcdoc` พร้อม `postMessage` สำหรับ Code Playground
- ตรวจ outer JavaScript syntax ผ่าน `node --check` จาก script block แล้ว
- ใช้ได้กับ GitHub Pages และ VS Code Live Server
- ข้อความ `Live reload enabled` เป็นข้อความปกติจาก VS Code Live Server ไม่ใช่ error

## หมายเหตุเรื่อง warning ของ iframe

ถ้ายังเห็นข้อความ

```text
An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing.
```

ให้ตรวจว่าไม่ได้เปิดไฟล์จาก v3 หรือ cache เก่าของ browser เพราะ v5 ไม่มี `allow-same-origin` แล้ว แนะนำ hard refresh ด้วย `Ctrl+F5` หรือเปิด Incognito แล้วทดสอบใหม่

## วิธีใช้งาน

เปิด `index.html` ด้วย VS Code Live Server หรือ deploy ขึ้น GitHub Pages ได้ทันที

## หัวข้อที่ครอบคลุม

- Web UI / UX / Interaction
- Separation of Concerns: HTML / CSS / JavaScript
- Semantic HTML
- CSS Layout: Box Model / Grid / Flexbox
- Responsive Layout
- Event-driven Programming
- FormData / Validation / Feedback
- Code Playground
- LAB 3 Checklist
