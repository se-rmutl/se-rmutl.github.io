# ENGSE203 Week 03 Interactive Teaching Sandbox — v4 Stable Live Server

เวอร์ชันนี้แก้ปัญหา Code Playground และ Live Server โดยเฉพาะ

## สิ่งที่แก้ไข

- แก้ `Uncaught SyntaxError: Unexpected end of input`
- แก้ปัญหาการฝัง JavaScript ใน `iframe srcdoc`
- เอา `allow-same-origin` ออกจาก iframe sandbox เพื่อลด warning เรื่อง sandbox escape
- เปลี่ยนจาก `frame.contentWindow.eval()` เป็นการรัน script ภายใน iframe โดยตรง
- เพิ่มระบบส่งผล Run/ Error กลับมายังหน้าหลักด้วย `postMessage`
- ยังเปิดผ่าน VS Code Live Server ได้ตามปกติ

## วิธีใช้งาน

เปิด `index.html` ด้วย VS Code Live Server หรือ double click ก็ได้ แต่แนะนำ Live Server สำหรับการสอน

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
