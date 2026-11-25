/*
 * ENGSE601 · ข้อมูลสำรองของกำหนดการและสิ่งที่ต้องส่ง
 * สำเนาจากแผ่น "กำหนดการ" ในชีตอาจารย์ ณ 2026-11-25T11:30:00+07:00 รูปแบบเดียวกับที่เว็บแอปของชีตส่ง
 * หน้าเว็บใช้ไฟล์นี้เมื่อยังไม่ได้ตั้ง schedule.url ใน data.js หรือเรียกเว็บแอปไม่ได้
 * แก้วันหรืองาน: แก้ในชีต ไม่ต้องแก้ไฟล์นี้ (อัปเดตไฟล์นี้เป็นครั้งคราวเพื่อให้ข้อมูลสำรองไม่เก่าเกินไป)
 */
window.ENGSE601_SCHEDULE = {
  "ok": true,
  "version": 1,
  "updated": "2026-11-25T11:30:00+07:00",
  "offset": "+07:00",
  "settings": {"day":"อังคาร","start":"13:00","end":"16:00","room":"C3-404","cpTime":"23:59","peerUrl":""},
  "sessions": [
    {"id":"S1","label":"ครั้งที่ 1","week":1,"date":"2026-11-24","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"ปฐมนิเทศและพื้นฐานการทดสอบ","note":""},
    {"id":"H1","label":"งดเรียน","week":2,"date":"2026-12-01","start":"","end":"","room":"","status":"งด","topic":"หยุดตามประกาศมหาวิทยาลัย","note":""},
    {"id":"S2","label":"ครั้งที่ 2","week":null,"date":"","start":"13:00","end":"16:00","room":"C3-404","status":"รอกำหนด","topic":"V&V และแบบจำลองกระบวนการทดสอบ","note":"เดิม 1 ธ.ค. 2569 รอกำหนดวันชดเชย"},
    {"id":"S3","label":"ครั้งที่ 3","week":3,"date":"2026-12-08","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"เทคนิคการทบทวน","note":""},
    {"id":"S4","label":"ครั้งที่ 4","week":4,"date":"2026-12-15","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"ทบทวนการออกแบบ โค้ด และ static analysis","note":""},
    {"id":"S5","label":"ครั้งที่ 5","week":5,"date":"2026-12-22","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"วางแผนและประมาณการทดสอบ","note":""},
    {"id":"S6","label":"ครั้งที่ 6","week":6,"date":"2026-12-29","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"ออกแบบกรณีทดสอบ I: black-box","note":""},
    {"id":"S7","label":"ครั้งที่ 7","week":7,"date":"2027-01-05","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"ออกแบบกรณีทดสอบ II","note":""},
    {"id":"S8","label":"ครั้งที่ 8","week":8,"date":"2027-01-12","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"Component testing และ white-box","note":""},
    {"id":"MID","label":"สอบกลางภาค","week":9,"date":"2027-01-19","start":"","end":"","room":"","status":"สอบ","topic":"สอบกลางภาค","note":"วันเวลาตามตารางสอบของมหาวิทยาลัย"},
    {"id":"S9","label":"ครั้งที่ 9","week":10,"date":"2027-01-26","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"สร้างและตรวจสอบข้อมูลทดสอบ","note":""},
    {"id":"S10","label":"ครั้งที่ 10","week":11,"date":"2027-02-02","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"Integration testing และการรายงานข้อบกพร่อง","note":""},
    {"id":"S11","label":"ครั้งที่ 11","week":12,"date":"2027-02-09","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"System, regression และ acceptance testing","note":""},
    {"id":"S12","label":"ครั้งที่ 12","week":13,"date":"2027-02-16","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"การทดสอบเชิงไม่เป็นฟังก์ชัน","note":""},
    {"id":"S13","label":"ครั้งที่ 13","week":14,"date":"2027-02-23","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"เครื่องมือและระบบอัตโนมัติในการทดสอบ","note":""},
    {"id":"S14","label":"ครั้งที่ 14","week":15,"date":"2027-03-02","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"ติดตาม ควบคุม และวิเคราะห์ปัญหา","note":""},
    {"id":"S15","label":"ครั้งที่ 15","week":16,"date":"2027-03-09","start":"13:00","end":"16:00","room":"C3-404","status":"ปกติ","topic":"รายงานสรุปผลและ V&V Showcase","note":""},
    {"id":"FIN","label":"สอบปลายภาค","week":17,"date":"2027-03-16","start":"","end":"","room":"","status":"สอบ","topic":"สอบปลายภาค","note":"วันเวลาตามตารางสอบของมหาวิทยาลัย"}
  ],
  "items": [
    {"id":"REG","title":"ลงทะเบียนทีมโครงงาน","scope":"กลุ่ม","kind":"ในคาบ","session":"S1","due":"2026-11-24T13:00:00+07:00","weight":null,"where":"แบบลงทะเบียนทีม (Google Form)","link":"register.html","note":""},
    {"id":"W1","title":"ใบงานครั้งที่ 1 วิเคราะห์กรณีซอฟต์แวร์ล้มเหลว","scope":"เดี่ยว","kind":"ในคาบ","session":"S1","due":"2026-11-24T13:00:00+07:00","weight":null,"where":"ส่งในคาบ","link":"handouts/session-01-worksheet.html","note":"นับในคะแนนกิจกรรมในคาบ"},
    {"id":"D01","title":"เพิ่ม tkeatkaew เป็นผู้มีสิทธิ์อ่าน repo","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S2","due":"","weight":null,"where":"GitHub > Settings > Collaborators","link":"register.html","note":"repo ที่เป็น public ข้ามข้อนี้ได้"},
    {"id":"D02","title":"V&V Profile","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S2","due":"","weight":null,"where":"docs/vv/00-vv-profile.md","link":"handouts/vv-profile-template.md","note":""},
    {"id":"D03","title":"ใบงานครั้งที่ 1 ฉบับ PDF ของทีม","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S2","due":"","weight":null,"where":"docs/vv/01-case-analysis.pdf","link":"","note":""},
    {"id":"D04","title":"เปิด issue tracker และสร้างป้าย type:defect, severity:critical / major / minor","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S2","due":"","weight":null,"where":"GitHub > Issues > Labels","link":"","note":""},
    {"id":"D05","title":"แบบเสนอโครงงาน หรือ SRS เดิม","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S2","due":"","weight":null,"where":"docs/srs/proposal.pdf","link":"srs-guide.html","note":""},
    {"id":"D06","title":"V&V Strategy 1 หน้า","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S3","due":"2026-12-08T13:00:00+07:00","weight":null,"where":"docs/vv/02-vv-strategy.md","link":"","note":""},
    {"id":"D07","title":"SRS ฉบับ 1.0 และ RTM","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S3","due":"2026-12-08T13:00:00+07:00","weight":null,"where":"docs/srs/SRS-Txx.docx และ .pdf · tag srs-v1.0","link":"srs-guide.html","note":"ใช้ทบทวนไขว้ทีมในครั้งที่ 3"},
    {"id":"CP1","title":"CP1 บันทึกผลการทบทวน SRS และ SRS ฉบับแก้","scope":"กลุ่ม","kind":"จุดตรวจ","session":"S3","due":"2026-12-13T23:59:00+07:00","weight":5,"where":"docs/vv/cp1/ · SRS ฉบับ 1.1 ใน docs/srs/","link":"srs-guide.html#checklist","note":"README.md ในโฟลเดอร์ระบุผู้รับผิดชอบรายส่วน"},
    {"id":"D08","title":"เอกสารออกแบบฉบับ 1.0","scope":"กลุ่ม","kind":"ก่อนคาบ","session":"S4","due":"2026-12-15T13:00:00+07:00","weight":null,"where":"docs/design/SDD-Txx.docx และ .pdf · docs/design/openapi.yaml · tag sdd-v1.0","link":"srs-guide.html#design","note":"ใช้ทบทวนการออกแบบในครั้งที่ 4"},
    {"id":"D09","title":"ตั้ง linter และใช้ PR review ทุก Sprint","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S5","due":"2026-12-22T13:00:00+07:00","weight":null,"where":".github/workflows/ · pull request ที่มีผู้รีวิว","link":"","note":"ตรวจรวมใน CP2"},
    {"id":"CP2","title":"CP2 Master Test Plan v1.0","scope":"กลุ่ม","kind":"จุดตรวจ","session":"S5","due":"2026-12-27T23:59:00+07:00","weight":5,"where":"docs/vv/cp2/","link":"","note":"แผนการทดสอบหลัก ทะเบียนความเสี่ยง และการประมาณการ"},
    {"id":"PE1","title":"ประเมินเพื่อนรอบที่ 1 (หลัง CP2)","scope":"เดี่ยว","kind":"ประเมินเพื่อน","session":"S5","due":"2027-01-03T23:59:00+07:00","weight":null,"where":"แบบประเมินเพื่อน","link":"","note":"ใช้ปรับคะแนน CP1–CP2 รายคน"},
    {"id":"D10","title":"กรณีทดสอบฟังก์ชันหลัก และ Test Case ID ใน RTM","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S7","due":"2027-01-05T13:00:00+07:00","weight":null,"where":"docs/vv/test-cases/ · RTM ใน SRS","link":"","note":"ตรวจรวมใน CP3"},
    {"id":"D11","title":"acceptance criteria ของ Sprint ถัดไป และ state diagram","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S8","due":"2027-01-12T13:00:00+07:00","weight":null,"where":"docs/vv/test-cases/","link":"","note":"ตรวจรวมใน CP3"},
    {"id":"CP3","title":"CP3 Test Design Specification","scope":"กลุ่ม","kind":"จุดตรวจ","session":"S8","due":"2027-01-17T23:59:00+07:00","weight":7,"where":"docs/vv/cp3/ · tests/","link":"","note":"กรณีทดสอบ unit test RTM ฉบับขยาย และรายงาน coverage"},
    {"id":"MID","title":"สอบกลางภาค","scope":"เดี่ยว","kind":"สอบ","session":"MID","due":"2027-01-19T00:00:00+07:00","weight":25,"where":"ห้องสอบตามตารางสอบ","link":"","note":""},
    {"id":"D12","title":"test data plan และ seed script","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S10","due":"2027-02-02T13:00:00+07:00","weight":null,"where":"docs/vv/test-data-plan.md · seed script ใน repo","link":"","note":"ตรวจรวมใน CP4"},
    {"id":"D13","title":"integration และ API test และบันทึกข้อบกพร่องใน issue tracker","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S11","due":"2027-02-09T13:00:00+07:00","weight":null,"where":"tests/integration/ · GitHub Issues","link":"","note":"ตรวจรวมใน CP4"},
    {"id":"D14","title":"system test cases จาก RTM และแผน UAT","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S12","due":"2027-02-16T13:00:00+07:00","weight":null,"where":"docs/vv/uat-plan.md","link":"","note":"ตรวจรวมใน CP4"},
    {"id":"CP4","title":"CP4 ผลการทดสอบ integration, system, UAT และ NFR","scope":"กลุ่ม","kind":"จุดตรวจ","session":"S12","due":"2027-02-21T23:59:00+07:00","weight":7,"where":"docs/vv/cp4/","link":"","note":"ผลทดสอบ NFR อย่างน้อย 2 คุณลักษณะ"},
    {"id":"D15","title":"ชุดทดสอบอัตโนมัติรันใน CI ทุก PR","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S14","due":"2027-03-02T13:00:00+07:00","weight":null,"where":".github/workflows/","link":"","note":"ตรวจรวมใน CP5"},
    {"id":"D16","title":"V&V dashboard และ RCA ของข้อบกพร่องรุนแรงสุด 3 รายการ","scope":"กลุ่ม","kind":"ต่อเนื่อง","session":"S15","due":"2027-03-09T13:00:00+07:00","weight":null,"where":"docs/vv/rca.md","link":"","note":"ตรวจรวมใน CP5"},
    {"id":"SHOW","title":"V&V Showcase","scope":"กลุ่ม","kind":"ในคาบ","session":"S15","due":"2027-03-09T13:00:00+07:00","weight":5,"where":"docs/vv/showcase/slides.pdf","link":"","note":"นำเสนอในคาบ ทีม + รายบุคคล"},
    {"id":"CP5","title":"CP5 Test Completion Report","scope":"กลุ่ม","kind":"จุดตรวจ","session":"S15","due":"2027-03-14T23:59:00+07:00","weight":6,"where":"docs/vv/cp5/","link":"","note":"รายงานสรุปผลการทดสอบ และการวิเคราะห์สาเหตุข้อบกพร่อง"},
    {"id":"PE2","title":"ประเมินเพื่อนรอบที่ 2 (หลัง CP5)","scope":"เดี่ยว","kind":"ประเมินเพื่อน","session":"S15","due":"2027-03-21T23:59:00+07:00","weight":null,"where":"แบบประเมินเพื่อน","link":"","note":"ใช้ปรับคะแนน CP3–CP5 รายคน"},
    {"id":"FIN","title":"สอบปลายภาค","scope":"เดี่ยว","kind":"สอบ","session":"FIN","due":"2027-03-16T00:00:00+07:00","weight":30,"where":"ห้องสอบตามตารางสอบ","link":"","note":""},
    {"id":"ACT","title":"การมีส่วนร่วมในกิจกรรมห้องเรียน","scope":"เดี่ยว","kind":"ทุกคาบ","session":"","due":"","weight":10,"where":"ในคาบ","link":"","note":"inspection ไขว้ทีม แบบฝึกออกแบบ และใบงาน"}
  ]
};
