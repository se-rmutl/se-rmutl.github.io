# ENGSE203 Week 02 — Interactive Teaching Sandbox

สื่อการสอนเชิงปฏิบัติสำหรับรายวิชา **ENGSE203 การเขียนโปรแกรมสำหรับวิศวกรซอฟต์แวร์** สัปดาห์ที่ 2

## วิธีใช้งาน

1. แตกไฟล์ ZIP
2. เปิด `index.html` ด้วย Chrome, Edge, Safari หรือ Firefox รุ่นปัจจุบัน
3. ใช้เมนูด้านซ้ายเพื่อเลือกหัวข้อการสอน
4. ใช้ปุ่ม `A− / A+` เพื่อปรับตัวอักษร และปุ่ม `เต็มจอ` สำหรับการสอนหน้าห้อง

> ไฟล์นี้ทำงานแบบออฟไลน์ ไม่ต้องติดตั้ง Node.js และไม่ต้องเชื่อมต่ออินเทอร์เน็ต

## หัวข้อใน Sandbox

- ES6+ Data Lab: const/let, destructuring, spread/rest, arrow function, map/filter/reduce
- ES Modules Lab: ความรับผิดชอบของ api.js, utils.js, ui.js และ main.js
- Async/Await Lab: loading, success, error, `response.ok`, `try/catch/finally`
- Learning Dashboard: ตัวอย่าง mini app ที่ค้นหา/กรอง/สรุปข้อมูลได้จริง
- npm Scripts Lab: virtual terminal สำหรับ `dev`, `check`, `build`, `preview`
- Git Workflow Lab: feature branch, meaningful commit, pull request, merge
- GitHub Pages Lab: base path, build ไปยัง `docs/`, ตรวจ URL deploy
- LAB 2 Path: ขั้นตอนปฏิบัติ, checklist และ rubric

## หมายเหตุสำหรับผู้สอน

- ใช้สื่อเสริมจาก slide หลัก โดยคลิกแท็บและให้ผู้เรียนกด/แก้/ทดลองตามทีละหัวข้อ
- ตัวอย่าง “Run code” เป็น JavaScript ฝั่งเบราว์เซอร์เพื่อให้เห็นผลลัพธ์ทันที
- Virtual terminal และ GitHub Pages เป็นการจำลอง workflow เพื่อทำความเข้าใจ ก่อนให้นักศึกษาใช้ VS Code, Git และ GitHub จริง

## Revision note
- Updated `images/module-architecture.svg`: reorganized the ES Modules diagram into a clear horizontal data-flow layout; connector arrows now remain in the gaps between module cards and the return-flow route is below the cards to avoid visual overlap.
