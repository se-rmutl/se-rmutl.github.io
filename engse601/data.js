/*
 * ENGSE601 การตรวจสอบความสมเหตุสมผลและการทวนสอบซอฟต์แวร์
 * ข้อมูลทั้งหมดของหน้า index.html อยู่ในไฟล์นี้
 * ภาคถัดไป: แก้ meta / course / sessions ในไฟล์นี้ไฟล์เดียว
 * แหล่งข้อมูล: เล่มหลักสูตร วศ.บ. วิศวกรรมซอฟต์แวร์ (คำอธิบายรายวิชา, PLO),
 *             ร่างแผนการสอน ENGSE601 บูรณาการกับ ENGSE212 (24 พ.ย. 2569), SE2014 หมวด VAV
 */
window.ENGSE601 = {
  meta: {
    version: "1.1",
    term: "2/2569",
    updated: "24 พฤศจิกายน 2569",
    scheduleNote: "วันและเวลาเรียนตามตารางสอนของมหาวิทยาลัย สัปดาห์ในแผนนับจากสัปดาห์แรกของภาค",
    history: [
      { v: "1.1", date: "24 พ.ย. 2569", note: "เพิ่มสไลด์ครั้งที่ 1 (3 ชุด) ใบงาน การ์ดกรณีศึกษา และแม่แบบ V&V Profile" },
      { v: "1.0", date: "24 พ.ย. 2569", note: "หน้ารายวิชาฉบับแรกตามแผนการสอนที่บูรณาการกับ ENGSE212" }
    ]
  },

  course: {
    code: "ENGSE601",
    th: "การตรวจสอบความสมเหตุสมผลและการทวนสอบซอฟต์แวร์",
    en: "Software Validation and Verification",
    credits: "3(3-0-6)",
    pair: "ENGSE212",
    year: "ปี 3",
    instructor: "อ.ธนิต เกตุแก้ว",
    summary: "ใช้โครงงาน ENGSE212 ของทีมเป็นระบบที่นำมาทวนสอบตลอดภาค ทบทวน SRS วางแผนและออกแบบการทดสอบ ไล่ทดสอบตั้งแต่ระดับส่วนประกอบจนถึงการยอมรับของผู้ใช้ แล้วสรุปผลเป็นหลักฐานที่ใส่ในเล่มปริญญานิพนธ์ได้ทันที",
    description: "ศึกษาแนวคิดพื้นฐานเกี่ยวกับการทดสอบซอฟต์แวร์ กระบวนการและแบบจำลองสำหรับการทดสอบซอฟต์แวร์ การตรวจสอบและการยืนยันความถูกต้องของซอฟต์แวร์ การทดสอบระดับส่วนประกอบ การทดสอบการรวมส่วนประกอบของซอฟต์แวร์ การทดสอบระบบ และทดสอบการยอมรับของผู้ใช้ การทดสอบเชิงไม่เป็นฟังก์ชัน เทคนิคการทบทวน การประมาณการทดสอบ เทคนิคการสร้างและตรวจสอบข้อมูลการทดสอบ เทคนิคการดูแลและควบคุมการทดสอบ เครื่องมือที่ใช้ในการทดสอบซอฟต์แวร์ การวางแผนการทดสอบ การวิเคราะห์ปัญหาและการจัดทำรายงาน รวมถึงการใช้เทคนิคต่าง ๆ ในการทดสอบเพื่อให้แน่ใจว่าส่วนประกอบของซอฟต์แวร์หรือระบบตอบสนองความต้องการของผู้ออกแบบ และตรงตามความคาดหวังของผู้มีส่วนได้ส่วนเสีย"
  },

  /* ---------- เรียนคู่ ENGSE212 ---------- */
  vmodel: [
    { left: { t: "ความต้องการ (SRS)", d: "inspection ไขว้ทีม", w: "สัปดาห์ 3 · CP1" }, link: "validation",
      right: { t: "การทดสอบระบบและการยอมรับ", d: "system, regression, NFR, UAT", w: "สัปดาห์ 12–13 · CP4" } },
    { left: { t: "การออกแบบ (สถาปัตยกรรม, API)", d: "design review, walkthrough", w: "สัปดาห์ 4" }, link: "verification",
      right: { t: "การทดสอบการรวม", d: "API, contract, บันทึกข้อบกพร่อง", w: "สัปดาห์ 11" } },
    { left: { t: "โค้ดรายโมดูล", d: "PR review, static analysis", w: "สัปดาห์ 4 แล้วใช้ทุก Sprint" }, link: "verification",
      right: { t: "การทดสอบระดับส่วนประกอบ", d: "unit test, coverage, test double", w: "สัปดาห์ 8 · CP3" } }
  ],
  vbase: { t: "พัฒนาใน Sprint ของ ENGSE212", d: "ระบบภายใต้การทดสอบ (system under test)" },

  principles: [
    { t: "ทวนสอบตั้งแต่ต้น", d: "สัปดาห์แรก ๆ ทบทวน SRS และการออกแบบที่มีอยู่แล้วจาก ENGSE211 ไม่ต้องรอโค้ด" },
    { t: "เนื้อหาเดินคู่กับโครงงาน", d: "ไล่ระดับการทดสอบจาก component สู่ integration, system และ acceptance ตามความคืบหน้าของ Sprint" },
    { t: "ชิ้นงานเดียว ประเมินสองมุม", d: "ENGSE601 ให้คะแนนความถูกต้องของเทคนิค V&V ส่วน ENGSE212 ให้คะแนนผลิตภัณฑ์และเล่ม ใช้เกณฑ์คนละชุด" },
    { t: "ติดตามผ่าน repo ของทีม", d: "จุดตรวจ CP1–CP5 และข้อบกพร่องใน issue tracker ทำให้เห็นความคืบหน้าและคุณภาพการทวนสอบตลอดภาค" }
  ],

  artifacts: [
    { a: "บันทึกผลการทบทวน SRS และการออกแบบ", std: "IEEE 1028", dest: "ภาคผนวก" },
    { a: "แผนการทดสอบหลัก (Master Test Plan)", std: "ISO/IEC/IEEE 29119-3", dest: "บทการทดสอบ (สรุป) + ภาคผนวก" },
    { a: "ข้อกำหนดการออกแบบการทดสอบและกรณีทดสอบ", std: "ISO/IEC/IEEE 29119-3, 29119-4", dest: "ภาคผนวก" },
    { a: "RTM ฉบับขยาย: ความต้องการ ↔ กรณีทดสอบ ↔ ผล", std: "ISO/IEC/IEEE 29148", dest: "ภาคผนวก (ต่อจาก RTM เดิมของทีม)" },
    { a: "รายงานข้อบกพร่องและการวิเคราะห์สาเหตุ", std: "IEEE 1044, 29119-3", dest: "บทการทดสอบ (สถิติและข้อค้นพบ)" },
    { a: "รายงานสรุปผลการทดสอบ (Test Completion Report)", std: "ISO/IEC/IEEE 29119-3", dest: "บทการทดสอบและบทสรุป" }
  ],

  /* ---------- แผน 17 สัปดาห์ ---------- */
  phases: [
    { id: "p1", weeks: "สัปดาห์ 1–8", name: "ทวนสอบเอกสาร วางแผน และออกแบบการทดสอบ",
      goal: "ทบทวนสิ่งที่โครงงานมีอยู่แล้ว วางแผนการทดสอบตามความเสี่ยง และออกแบบกรณีทดสอบที่สอบย้อนกลับถึงความต้องการได้",
      sessions: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "MID"] },
    { id: "p2", weeks: "สัปดาห์ 10–16", name: "ไล่ระดับการทดสอบ ติดตาม และรายงานผล",
      goal: "ทดสอบการรวม ระบบ การยอมรับ และคุณภาพที่ไม่ใช่ฟังก์ชัน แล้ววิเคราะห์ข้อมูลข้อบกพร่องจริงของทีมเพื่อสรุปความพร้อมส่งมอบ",
      sessions: ["S9", "S10", "S11", "S12", "S13", "S14", "S15", "FIN"] }
  ],
  weekbar: [
    { name: "ช่วง 1", sub: "สัปดาห์ 1–8", fr: 8, c: "var(--p1)" },
    { name: "สอบ", sub: "สัปดาห์ 9", fr: 1.6, c: "var(--px)", exam: true },
    { name: "ช่วง 2", sub: "สัปดาห์ 10–16", fr: 7, c: "var(--p2)" },
    { name: "สอบ", sub: "สัปดาห์ 17", fr: 1.6, c: "var(--px)", exam: true }
  ],

  sessions: {
    S1: { no: "ครั้งที่ 1", week: "สัปดาห์ 1", hours: 3, title: "ปฐมนิเทศและพื้นฐานการทดสอบ",
      topics: ["ทำไมต้องทดสอบ และต้นทุนของข้อบกพร่องที่พบช้า", "error · defect · failure ต่างกันอย่างไร", "หลัก 7 ข้อของการทดสอบ", "testing กับ debugging และ QA · QC · testing"],
      inClass: "วิเคราะห์กรณีซอฟต์แวร์ล้มเหลวจริง", project: "ส่ง V&V Profile ของทีม", clo: ["CLO1"], desc: ["d1"],
      links: [
        { label: "สไลด์ 1 แนะนำรายวิชา", href: "slides/session-01-intro.html" },
        { label: "สไลด์ 2 พื้นฐานการทดสอบ", href: "slides/session-01-fundamentals.html" },
        { label: "สไลด์ 3 กิจกรรม", href: "slides/session-01-activity.html" },
        { label: "ใบงาน", href: "handouts/session-01-worksheet.html" },
        { label: "การ์ดกรณีศึกษา (PDF)", href: "handouts/ENGSE601-session-01-cases.pdf" },
        { label: "แม่แบบ V&V Profile", href: "handouts/vv-profile-template.md" }
      ] },
    S2: { no: "ครั้งที่ 2", week: "สัปดาห์ 2", hours: 3, title: "V&V และแบบจำลองกระบวนการทดสอบ",
      topics: ["verification กับ validation", "IEEE 1012 และระดับความสำคัญของระบบ (integrity level)", "กระบวนการทดสอบตาม ISO/IEC/IEEE 29119-2", "V-model, Agile testing quadrants และ test pyramid", "ระดับและชนิดของการทดสอบ"],
      inClass: "จับคู่ Sprint ของโครงงานกับระดับการทดสอบ", project: "ร่าง V&V Strategy 1 หน้า", clo: ["CLO1"], desc: ["d2", "d3"] },
    S3: { no: "ครั้งที่ 3", week: "สัปดาห์ 3", hours: 3, title: "เทคนิคการทบทวน",
      topics: ["ประเภทการทบทวนตาม IEEE 1028: technical review, walkthrough, inspection, audit", "บทบาทและขั้นตอนของ inspection", "checklist คุณภาพความต้องการตาม ISO/IEC/IEEE 29148"],
      inClass: "inspection ไขว้ทีม: ตรวจ SRS ของทีมอื่น", project: "แก้ SRS ตามผลการทบทวน", cp: "CP1", clo: ["CLO2", "CLO6"], desc: ["d9"] },
    S4: { no: "ครั้งที่ 4", week: "สัปดาห์ 4", hours: 3, title: "ทบทวนการออกแบบ โค้ด และ static analysis",
      topics: ["design review: สถาปัตยกรรม ER และ API spec", "code review ผ่าน pull request", "static analysis: linter, cyclomatic complexity, quality gate"],
      inClass: "walkthrough การออกแบบ และสาธิตเครื่องมือ", project: "ตั้ง linter และใช้ PR review ทุก Sprint", tools: "ESLint, SonarQube", clo: ["CLO2"], desc: ["d9", "d13"] },
    S5: { no: "ครั้งที่ 5", week: "สัปดาห์ 5", hours: 3, title: "วางแผนและประมาณการทดสอบ",
      topics: ["โครงแผนการทดสอบตาม ISO/IEC/IEEE 29119-3", "risk-based testing: likelihood × impact", "entry และ exit criteria", "ประมาณการแบบ metrics-based, Wideband Delphi, three-point"],
      inClass: "ประเมินความเสี่ยงของโครงงานตัวเอง", project: "Master Test Plan v1.0", cp: "CP2", clo: ["CLO4"], desc: ["d10", "d14"] },
    S6: { no: "ครั้งที่ 6", week: "สัปดาห์ 6", hours: 3, title: "ออกแบบกรณีทดสอบ I: black-box",
      topics: ["equivalence partitioning", "boundary value analysis", "decision table", "องค์ประกอบของกรณีทดสอบและการสอบย้อนกลับ"],
      inClass: "ออกแบบจากความต้องการ 3–5 ข้อของโครงงาน", project: "กรณีทดสอบฟังก์ชันหลัก และ Test Case ID ใน RTM", clo: ["CLO3"], desc: ["d11", "d16"] },
    S7: { no: "ครั้งที่ 7", week: "สัปดาห์ 7", hours: 3, title: "ออกแบบกรณีทดสอบ II",
      topics: ["state transition testing", "use case และ user story: Given–When–Then", "pairwise testing", "experience-based: error guessing, exploratory, checklist"],
      inClass: "เขียน acceptance criteria ของ backlog", project: "acceptance criteria ของ Sprint ถัดไป และ state diagram", clo: ["CLO3"], desc: ["d16"] },
    S8: { no: "ครั้งที่ 8", week: "สัปดาห์ 8", hours: 3, title: "Component testing และ white-box",
      topics: ["statement และ branch coverage", "basis path และ cyclomatic complexity", "test double: stub, mock, fake", "TDD และข้อจำกัดของ coverage", "ทบทวนก่อนสอบกลางภาค"],
      inClass: "คำนวณ basis path จากโค้ดตัวอย่าง", project: "unit test โมดูล backend และรายงาน coverage", tools: "Jest, JUnit หรือ pytest", cp: "CP3", clo: ["CLO3"], desc: ["d4"] },
    MID: { no: "สอบ", week: "สัปดาห์ 9", exam: true, title: "สอบกลางภาค",
      topics: ["เนื้อหาครั้งที่ 1–8", "วัด CLO1–CLO3"], clo: [], desc: [] },
    S9: { no: "ครั้งที่ 9", week: "สัปดาห์ 10", hours: 3, title: "สร้างและตรวจสอบข้อมูลทดสอบ",
      topics: ["ข้อมูลทดสอบจาก EP/BVA และ synthetic data", "seed และ fixture", "data masking ตาม PDPA", "ความครบถ้วน ความสอดคล้อง และ referential integrity", "test oracle"],
      inClass: "ออกแบบชุดข้อมูลที่ไม่ใช้ข้อมูลส่วนบุคคลจริง", project: "test data plan และ seed script", tools: "Faker", clo: ["CLO3", "CLO6"], desc: ["d11"] },
    S10: { no: "ครั้งที่ 10", week: "สัปดาห์ 11", hours: 3, title: "Integration testing และการรายงานข้อบกพร่อง",
      topics: ["big-bang, top-down, bottom-up, sandwich", "API testing จาก OpenAPI spec และ contract testing", "stub และ service virtualization", "วงจรชีวิตข้อบกพร่อง severity กับ priority"],
      inClass: "ออกแบบลำดับการรวมและกรณีทดสอบ API", project: "integration/API test และเริ่มบันทึกข้อบกพร่องใน issue tracker", tools: "Postman/Newman", clo: ["CLO3", "CLO4"], desc: ["d5", "d15"] },
    S11: { no: "ครั้งที่ 11", week: "สัปดาห์ 12", hours: 3, title: "System, regression และ acceptance testing",
      topics: ["system test จาก SRS และ end-to-end", "smoke และการเลือกชุด regression", "operational profile", "UAT, alpha, beta และการ validate กับผู้มีส่วนได้ส่วนเสีย"],
      inClass: "วางแผน UAT กับผู้ใช้จริงของโครงงาน", project: "system test cases จาก RTM และแผน UAT", tools: "Playwright", clo: ["CLO4", "CLO5"], desc: ["d6", "d7", "d16"] },
    S12: { no: "ครั้งที่ 12", week: "สัปดาห์ 13", hours: 3, title: "การทดสอบเชิงไม่เป็นฟังก์ชัน",
      topics: ["ISO/IEC 25010:2023 คุณลักษณะคุณภาพ 9 ด้าน", "performance: load, stress, spike, soak", "security: OWASP Top 10", "usability (SUS) และ accessibility (WCAG)"],
      inClass: "แปลง NFR ของโครงงานเป็นเกณฑ์ที่วัดได้", project: "ผลทดสอบ NFR อย่างน้อย 2 คุณลักษณะ", tools: "k6, OWASP ZAP, Lighthouse", cp: "CP4", clo: ["CLO4"], desc: ["d8"] },
    S13: { no: "ครั้งที่ 13", week: "สัปดาห์ 14", hours: 3, title: "เครื่องมือและระบบอัตโนมัติในการทดสอบ",
      topics: ["ประเภทและเกณฑ์เลือกเครื่องมือ", "automation pyramid และ CI/CD", "flaky test และความเสี่ยงของเครื่องมือ", "AI ช่วยออกแบบการทดสอบ: ทำอะไรได้ และต้องตรวจอะไร"],
      inClass: "เปรียบเทียบ tool stack ของแต่ละทีม", project: "ชุดทดสอบอัตโนมัติรันใน CI ทุก PR", clo: ["CLO4"], desc: ["d13"] },
    S14: { no: "ครั้งที่ 14", week: "สัปดาห์ 15", hours: 3, title: "ติดตาม ควบคุม และวิเคราะห์ปัญหา",
      topics: ["ตัวชี้วัด: ความคืบหน้า coverage และ defect trend", "การตัดสินใจควบคุมและ exit criteria", "configuration management ของ testware", "จำแนกข้อบกพร่องตาม IEEE 1044", "fault isolation และ root cause analysis"],
      inClass: "วิเคราะห์ข้อมูลจริงจาก issue tracker ของทีม", project: "V&V dashboard และ RCA ของข้อบกพร่องรุนแรงสุด 3 รายการ", tools: "GitHub Issues/Projects", clo: ["CLO5"], desc: ["d12", "d15"] },
    S15: { no: "ครั้งที่ 15", week: "สัปดาห์ 16", hours: 3, title: "รายงานสรุปผลและ V&V Showcase",
      topics: ["test completion report ตาม 29119-3", "ตัดสิน go/no-go จากหลักฐาน", "สรุปบทเรียนทั้งภาค"],
      inClass: "ทีมนำเสนอ 8–10 นาที และตอบคำถามรายคน", project: "Test Completion Report (ใช้ในเล่ม ENGSE212)", cp: "CP5", clo: ["CLO5", "CLO6"], desc: ["d15"] },
    FIN: { no: "สอบ", week: "สัปดาห์ 17", exam: true, title: "สอบปลายภาค",
      topics: ["เนื้อหาครั้งที่ 9–15 และโจทย์บูรณาการ", "วัด CLO1, CLO3–CLO5"], clo: [], desc: [] }
  },

  hours: { lecture: 45, self: 90 },

  /* ---------- จุดตรวจจากโครงงาน ---------- */
  prep: [
    "เปิดสิทธิ์อ่าน repo ของทีมให้อาจารย์ผู้สอน (แจ้งบัญชี GitHub ในครั้งที่ 1)",
    "SRS ฉบับล่าสุดจาก ENGSE211 และ RTM ของทีม",
    "เปิดใช้ issue tracker และสร้างป้าย type:defect กับ severity:critical / major / minor",
    "สร้างโฟลเดอร์ docs/vv/ ใน repo สำหรับเก็บชิ้นงานทุกจุดตรวจ"
  ],
  checkpoints: [
    { id: "CP1", week: "สัปดาห์ 3", weight: 5, title: "บันทึกผลการทบทวน SRS",
      deliver: "บันทึกผลการทบทวน defect log และ SRS ฉบับแก้",
      check: "ใช้ checklist ถูกต้อง ข้อบกพร่องระบุตำแหน่งและความรุนแรง เจ้าของแก้ครบ", clo: ["CLO2", "CLO6"] },
    { id: "CP2", week: "สัปดาห์ 5", weight: 5, title: "Master Test Plan v1.0",
      deliver: "แผนการทดสอบหลัก ทะเบียนความเสี่ยง และการประมาณการ",
      check: "ขอบเขตชัด ลำดับตามความเสี่ยง entry/exit criteria วัดได้ ตัวเลขประมาณการมีที่มา", clo: ["CLO4"] },
    { id: "CP3", week: "สัปดาห์ 8", weight: 7, title: "Test Design Specification",
      deliver: "กรณีทดสอบ black-box และ unit test, RTM ฉบับขยาย, รายงาน coverage",
      check: "เลือกเทคนิคเหมาะกับความต้องการ สอบย้อนกลับได้ครบ coverage ถึงเป้าที่ตั้งใน CP2", clo: ["CLO3"] },
    { id: "CP4", week: "สัปดาห์ 13", weight: 7, title: "ผลการทดสอบ integration, system และ UAT",
      deliver: "ผลทดสอบพร้อมหลักฐาน และผลทดสอบ NFR อย่างน้อย 2 คุณลักษณะ",
      check: "มีหลักฐาน (CI log, แบบบันทึก UAT) เกณฑ์ NFR เป็นตัวเลข ข้อบกพร่องถูกบันทึกครบ", clo: ["CLO4", "CLO5"] },
    { id: "CP5", week: "สัปดาห์ 16", weight: 6, title: "Test Completion Report",
      deliver: "รายงานสรุปผลการทดสอบ และการวิเคราะห์สาเหตุข้อบกพร่อง",
      check: "ประเมินตาม exit criteria ข้อสรุปตรงกับหลักฐาน บอกความเสี่ยงที่เหลือ", clo: ["CLO5"] }
  ],
  rules: [
    "ทุกจุดตรวจระบุชื่อผู้รับผิดชอบรายโมดูลหรือรายฟีเจอร์ คะแนนทีมปรับรายคนด้วย peer evaluation ไม่เกิน ±20%",
    "ประเมินคุณภาพของการทวนสอบ ไม่ใช่ความสมบูรณ์ของผลิตภัณฑ์ ระบบยังไม่เสร็จก็ทดสอบเท่าที่มี และรายงานส่วนที่ยังไม่ผ่านตามจริง",
    "นักศึกษาที่ไม่ได้ลง ENGSE212 ภาคนี้ ใช้ระบบอ้างอิงที่อาจารย์จัดให้ และส่งจุดตรวจชุดเดียวกัน"
  ],

  /* ---------- การวัดผล ---------- */
  assessment: [
    { what: "การมีส่วนร่วมในกิจกรรมห้องเรียน", note: "inspection ไขว้ทีม แบบฝึกออกแบบ", pct: 10, who: "รายบุคคล", when: "ตลอดภาค", clo: "CLO2, CLO6" },
    { what: "V&V Portfolio (CP1–CP5)", note: "ชิ้นงานบนโครงงาน ENGSE212", pct: 30, who: "ทีม ปรับด้วย peer evaluation", when: "สัปดาห์ 3, 5, 8, 13, 16", clo: "CLO2–CLO5" },
    { what: "V&V Showcase", note: "นำเสนอและตอบคำถาม", pct: 5, who: "ทีม + รายบุคคล", when: "สัปดาห์ 16", clo: "CLO5, CLO6" },
    { what: "สอบกลางภาค", note: "", pct: 25, who: "รายบุคคล", when: "สัปดาห์ 9", clo: "CLO1–CLO3" },
    { what: "สอบปลายภาค", note: "", pct: 30, who: "รายบุคคล", when: "สัปดาห์ 17", clo: "CLO1, CLO3–CLO5" }
  ],
  examNote: "ข้อสอบใช้กรณีศึกษากลางที่ทุกคนเห็นเหมือนกัน ไม่ใช่โครงงานของตัวเอง เน้นออกแบบกรณีทดสอบ คำนวณ coverage วิเคราะห์ความเสี่ยง และตีความตัวชี้วัด มากกว่าการท่องจำนิยาม",

  /* ---------- ผลลัพธ์การเรียนรู้ ---------- */
  clo: [
    { id: "CLO1", text: "อธิบายแนวคิด ศัพท์ และแบบจำลองกระบวนการของการทดสอบและ V&V ได้ถูกต้อง", bloom: "เข้าใจ", plo: ["PLO1"] },
    { id: "CLO2", text: "ประยุกต์เทคนิคการทบทวนและ static analysis เพื่อหาข้อบกพร่องในเอกสารความต้องการ การออกแบบ และโค้ด", bloom: "ประยุกต์", plo: ["PLO1", "PLO2"] },
    { id: "CLO3", text: "ออกแบบกรณีทดสอบและข้อมูลทดสอบด้วยเทคนิค black-box, white-box และ experience-based ที่สอบย้อนกลับถึงความต้องการได้", bloom: "ประยุกต์–วิเคราะห์", plo: ["PLO2"] },
    { id: "CLO4", text: "วางแผน ประมาณการ และเลือกระดับ ชนิด และเครื่องมือทดสอบ รวมถึง non-functional ให้เหมาะกับความเสี่ยงของระบบ", bloom: "ประเมิน", plo: ["PLO2", "PLO3"] },
    { id: "CLO5", text: "ติดตาม ควบคุม วิเคราะห์สาเหตุข้อบกพร่อง และรายงานผล เพื่อตัดสินว่าซอฟต์แวร์ตรงตามความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสียหรือไม่", bloom: "วิเคราะห์–ประเมิน", plo: ["PLO1", "PLO3"] },
    { id: "CLO6", text: "ร่วมทบทวนงานของทีมอื่นอย่างสร้างสรรค์ รับผิดชอบงานตามบทบาท และใช้ข้อมูลทดสอบตามหลัก PDPA", bloom: "จริยธรรม / ลักษณะบุคคล", plo: ["PLO1", "PLO5"] }
  ],
  examClo: { mid: ["CLO1", "CLO2", "CLO3"], fin: ["CLO1", "CLO3", "CLO4", "CLO5"] },
  plo: {
    PLO1: "วิเคราะห์และประยุกต์ใช้หลักการและทฤษฎีที่สำคัญของวิศวกรรมซอฟต์แวร์ในการแก้ปัญหา",
    PLO2: "ประยุกต์ใช้กระบวนการวิเคราะห์ ออกแบบ พัฒนา และใช้งานซอฟต์แวร์ โดยคำนึงถึงสถาปัตยกรรมที่เหมาะสม",
    PLO3: "พัฒนาซอฟต์แวร์ในงานอุตสาหกรรม",
    PLO5: "ทำงานเป็นทีมพัฒนาซอฟต์แวร์ในตำแหน่งต่าง ๆ อย่างเป็นระบบเหมือนสภาพแวดล้อมจริง และแสวงหาความรู้เพื่อพัฒนาตนเองและงานตลอดชีวิต"
  },
  /* หัวข้อตามลำดับในคำอธิบายรายวิชา */
  descTopics: {
    d1: "แนวคิดพื้นฐานเกี่ยวกับการทดสอบซอฟต์แวร์",
    d2: "กระบวนการและแบบจำลองสำหรับการทดสอบซอฟต์แวร์",
    d3: "การตรวจสอบและการยืนยันความถูกต้องของซอฟต์แวร์",
    d4: "การทดสอบระดับส่วนประกอบ",
    d5: "การทดสอบการรวมส่วนประกอบของซอฟต์แวร์",
    d6: "การทดสอบระบบ",
    d7: "การทดสอบการยอมรับของผู้ใช้",
    d8: "การทดสอบเชิงไม่เป็นฟังก์ชัน",
    d9: "เทคนิคการทบทวน",
    d10: "การประมาณการทดสอบ",
    d11: "เทคนิคการสร้างและตรวจสอบข้อมูลการทดสอบ",
    d12: "เทคนิคการดูแลและควบคุมการทดสอบ",
    d13: "เครื่องมือที่ใช้ในการทดสอบซอฟต์แวร์",
    d14: "การวางแผนการทดสอบ",
    d15: "การวิเคราะห์ปัญหาและการจัดทำรายงาน",
    d16: "เทคนิคเพื่อให้ตรงความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย"
  },

  /* ---------- คำถาม ติดต่อ อ้างอิง ---------- */
  faq: [
    { q: "งานของวิชานี้ซ้ำกับ ENGSE212 หรือไม่", a: "ไม่ซ้ำ เป็นชิ้นงานเดียวกันที่ใส่ในเล่มปริญญานิพนธ์ได้ทันที ENGSE601 ประเมินความถูกต้องของเทคนิคการทวนสอบ ส่วน ENGSE212 ประเมินผลิตภัณฑ์และความครบถ้วนของเล่ม" },
    { q: "ระบบของทีมยังไม่เสร็จ จะทำจุดตรวจได้อย่างไร", a: "ช่วงแรกทวนสอบเอกสารที่มีอยู่แล้ว ส่วนช่วงหลังให้ทดสอบเท่าที่ระบบมี และรายงานส่วนที่ยังไม่ผ่านตามจริง คะแนนวัดคุณภาพของการทวนสอบ ไม่ใช่ความสมบูรณ์ของระบบ" },
    { q: "ภาคนี้ไม่ได้ลง ENGSE212 ต้องทำอย่างไร", a: "อาจารย์จะจัดระบบอ้างอิงให้ใช้แทนโครงงาน และส่งจุดตรวจชุดเดียวกับเพื่อน แจ้งอาจารย์ในครั้งที่ 1" },
    { q: "ใช้ AI ช่วยเขียนกรณีทดสอบได้หรือไม่", a: "ใช้ได้ แต่ต้องระบุว่าใช้ในส่วนใด และทีมต้องตรวจทานทุกกรณีเอง ตอน Showcase ทุกคนต้องอธิบายกรณีทดสอบในส่วนที่ตนรับผิดชอบได้" },
    { q: "ต้องซื้อเครื่องมือหรือไม่", a: "ไม่ต้อง ใช้เครื่องมือฟรีหรือโอเพนซอร์สที่เข้ากับ tech stack ของทีม ชื่อเครื่องมือในแผนเป็นตัวอย่างที่อาจารย์ใช้สาธิต" },
    { q: "คะแนนงานทีมแบ่งให้แต่ละคนอย่างไร", a: "ทุกจุดตรวจระบุผู้รับผิดชอบรายส่วน แล้วปรับคะแนนรายคนด้วย peer evaluation ไม่เกิน ±20% และ 65% ของคะแนนรวมเป็นงานรายบุคคล" }
  ],
  contacts: {
    teacher: { name: "อาจารย์ธนิต เกตุแก้ว", role: "อาจารย์ผู้สอน ENGSE601", email: "thanit@rmutl.ac.th" },
    program: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์ คณะวิศวกรรมศาสตร์ มทร.ล้านนา",
    address: "ตึก C3 ชั้น 4 มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา เชียงใหม่ (ดอยสะเก็ด)"
  },
  references: [
    { t: "ISTQB. (2024). Certified Tester Foundation Level syllabus (v4.0.1)", u: "https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf" },
    { t: "IEEE Std 1012-2024 System, software, and hardware verification and validation", u: "https://standards.ieee.org/ieee/1012/7324" },
    { t: "ISO/IEC 25010:2023 Product quality model", u: "https://www.iso.org/standard/78176.html" },
    { t: "ISO/IEC/IEEE 29119 Software testing (Parts 1–4)" },
    { t: "IEEE Std 1028-2008 Software reviews and audits · IEEE Std 1044-2009 Classification for software anomalies" },
    { t: "SWEBOK Guide v4.0 (2024): Software Testing และ Software Quality · SE2014 หมวด VAV" },
    { t: "Ammann, P., & Offutt, J. (2016). Introduction to software testing (2nd ed.). Cambridge University Press." },
    { t: "Jorgensen, P. C., & DeVries, B. (2021). Software testing: A craftsman's approach (5th ed.). CRC Press." }
  ]
};
