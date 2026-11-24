/**
 * ENGSE601 · สคริปต์สำหรับ Google Sheet ของอาจารย์ (บันทึกการเรียนและผลประเมิน)
 *
 * ทำ 2 อย่าง:
 *   1. สร้าง "แบบลงทะเบียนทีมโครงงาน" เป็น Google Form
 *      ช่องเลือกสมาชิกใช้รายชื่อจากแผ่น "คะแนน" คำตอบลงแผ่นใหม่ในชีตนี้ และเก็บลิงก์ไว้ที่แผ่น "ภาพรวม"
 *   2. ซิงก์คำตอบเป็นรายทีม (T01, T02, ...) ลงแผ่น "ข้อมูลซิงก์"
 *      แผ่นคะแนนและแผ่นทีมดึงรหัสทีม ชื่อโครงงาน ที่ปรึกษา และ repo ไปแสดงเอง
 *   3. เผยแพร่ "ไฟล์สถานะทีม" ทีมละ 1 ไฟล์ แชร์แบบดูอย่างเดียวให้อีเมล Gmail ของสมาชิกทีมนั้น
 *      ไฟล์มีแต่ค่า ไม่มีสูตรหรือลิงก์กลับมาชีตนี้ แสดงคะแนนทีมเฉพาะจุดตรวจที่ติ๊ก "เผยแพร่ผลให้นักศึกษา"
 *      ในแผ่นภาพรวม ไม่แสดงคะแนนรายคน ผลประเมินเพื่อน คะแนนสอบ หรือข้อมูลของทีมอื่น
 *
 * ทีมของ ENGSE601 คือทีมโครงงาน ENGSE212 ทีมเดียวกัน ตัวแทนทีมกรอก 1 คนต่อทีม แก้คำตอบภายหลังได้
 *
 * ติดตั้งครั้งเดียว:
 *   1. เปิดชีตของอาจารย์ > ส่วนขยาย > Apps Script แล้ววางไฟล์นี้ทั้งไฟล์ บันทึก
 *   2. กลับมาที่ชีต รีเฟรช จะมีเมนู ENGSE601
 *   3. ENGSE601 > สร้างแบบลงทะเบียนทีม (ครั้งแรกจะขอสิทธิ์ Forms และ Sheets)
 *   4. นำ "ลิงก์แบบลงทะเบียนทีมสำหรับนักศึกษา" ในแผ่นภาพรวมไปใส่ register.formUrl ใน data.js
 *   5. ENGSE601 > ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม (หรือกดซิงก์เองเมื่อต้องการ)
 *   ฟอร์มที่สร้างก่อนฉบับ 1.1: สั่ง ENGSE601 > เพิ่มคำถามอีเมลสมาชิกในฟอร์มเดิม ครั้งเดียว
 *   เผยแพร่: กรอกวันที่เรียนครั้งที่ 1 ในแผ่นภาพรวม แล้วสั่ง ENGSE601 > เผยแพร่สถานะทีมตอนนี้
 *
 * ฉบับ 1.2 (24 พ.ย. 2569): ถอนสิทธิ์อีเมลเดิมเมื่อทีมแก้อีเมล และแจ้งอีเมลที่ไม่ใช่ Gmail เป็นปัญหาที่ต้องแก้
 * ฉบับ 1.1 (24 พ.ย. 2569): คำถามอีเมล Gmail ของสมาชิก และไฟล์สถานะทีม · ฉบับ 1.0: แบบลงทะเบียนทีมและซิงก์
 *
 * ติดตั้งและสั่งจากบัญชี software.rmutl@gmail.com (บัญชีที่เปิด Advanced Protection รันสคริปต์ไม่ได้)
 * ถ้าเบราว์เซอร์ล็อกอินหลายบัญชี ให้ใช้หน้าต่างไม่ระบุตัวตนที่ล็อกอินบัญชีนี้บัญชีเดียว
 *
 * รหัสทีมที่ออกแล้วไม่นำกลับมาใช้ซ้ำ เพราะคะแนน CP ในแผ่นทีมผูกกับรหัสทีม
 * คำตอบที่เลือกสมาชิกชุดเดียวกันทุกคนถือเป็นทีมเดิม (คำตอบล่าสุดแทนของเดิม)
 * ถ้านักศึกษาคนเดียวอยู่หลายทีม สคริปต์ไม่รวมให้เอง แต่เขียนหมายเหตุไว้ ให้อาจารย์ลบคำตอบที่ผิดในฟอร์ม
 * หรือพิมพ์รหัสทีมที่ถูกในแผ่นคะแนน คอลัมน์ E
 */

var SHEET = { summary: 'ภาพรวม', scores: 'คะแนน', sync: 'ข้อมูลซิงก์' };
var CELL = { formEdit: 'B9', formPublic: 'B10', lastSync: 'B11', syncNote: 'B12' };
var ROSTER = { firstRow: 6, lastRow: 45, idCol: 2, nameCol: 3 };   // แผ่นคะแนน: B รหัส C ชื่อ
var MAX_TEAMS = 20;                                                 // แผ่นทีมมีแถว T01–T20
var SYNC_ROWS = 60;
var PROP = { items: 'engse601.itemIds', maxTeam: 'engse601.maxTeam', folder: 'engse601.statusFolder' };
var ID_RE = /([0-9]{11}-[0-9])/;
var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// แผ่นภาพรวม: ช่องตั้งค่าที่ใช้ตอนเผยแพร่ และตารางสัดส่วนคะแนน (หาแถว CP1–CP5 จากข้อความคอลัมน์ A)
var PUB = { minAttend: 'B6', firstClass: 'B13', lastPub: 'B14', pubNote: 'B15', cpScanFrom: 16, cpScanRows: 20 };
// แผ่นทีม แถว T01–T20 และตำแหน่งคอลัมน์ (เริ่มที่ 1)
var TEAM = { firstRow: 6, rows: 20, width: 24,
  c: { id: 1, title: 2, count: 5, repo: 6, profile: 7, cp: 8, note: 16, worksheet: 17, fb: 18, file: 23, pub: 24 } };
// แผ่นคะแนน: B รหัส C ชื่อ D ทีม G เวลาเรียน
var SCORE = { width: 7, id: 2, name: 3, team: 4, attend: 7 };
var STATUS_FILE = 'ENGSE601 2/2569 · สถานะทีม ';
var FOLDER_NAME = 'ENGSE601 2/2569 · ไฟล์สถานะทีม';
var FOLDER_EDITORS = ['tkeatkaew@gmail.com'];   // ให้บัญชีที่ Claude ใช้ตรวจไฟล์ได้

var FORM_TITLE = 'ENGSE601 ลงทะเบียนทีมโครงงาน · ภาค 2/2569';
var FORM_DESC = [
  'ทีมใน ENGSE601 คือทีมโครงงาน ENGSE212 ทีมเดียวกัน ให้ตัวแทนทีมกรอก 1 คนต่อทีม ใช้เวลาประมาณ 10 นาที',
  'เตรียมก่อนกรอก: รายชื่อสมาชิก · บัญชี GitHub ของทุกคน · ลิงก์ repository · ลิงก์ SRS ฉบับล่าสุด (ถ้ามี)',
  'ส่งแล้วแก้ได้ภายหลังจากลิงก์ "แก้ไขคำตอบ" ไม่ต้องส่งใหม่',
  'ไม่ต้องใส่ข้อมูลส่วนบุคคลของผู้ใช้ระบบ เช่น ชื่อ เบอร์โทร ของลูกค้า'
].join('\n');

var TEACHER_GITHUB = "tkeatkaew";

// คำถามในฟอร์ม (สร้างจาก fields.py ชุดเดียวกับหัวคอลัมน์ในแผ่นข้อมูลซิงก์)
var FIELDS = [
  {"key": "p_team", "type": "page", "title": "ทีม", "help": "ทีมใน ENGSE601 คือทีมโครงงาน ENGSE212 ทีมเดียวกัน ให้ตัวแทนทีมกรอก 1 คนต่อทีม"},
  {"key": "leader", "type": "text", "title": "รหัสนักศึกษาของผู้กรอก", "required": true, "help": "เช่น 67543210003-9"},
  {"key": "members", "type": "checkbox", "title": "สมาชิกทีมที่เรียน ENGSE601 กลุ่มนี้", "required": true, "help": "เลือกให้ครบทุกคน รวมตัวเองด้วย", "choices": "ROSTER"},
  {"key": "outside", "type": "paragraph", "title": "สมาชิกทีมที่ไม่ได้เรียน ENGSE601 กลุ่มนี้ (ถ้ามี)", "help": "รหัส ชื่อ และเหตุผล เช่น ลงวิชานี้ภาคอื่น"},
  {"key": "github", "type": "paragraph", "title": "บัญชี GitHub และส่วนที่รับผิดชอบของสมาชิกแต่ละคน", "required": true, "help": "บรรทัดละคน: รหัสนักศึกษา · ชื่อบัญชี GitHub · ส่วนที่รับผิดชอบ เช่น 67543210003-9 · pran-dev · backend และฐานข้อมูล"},
  {"key": "emails", "type": "paragraph", "title": "อีเมล Gmail ของสมาชิกแต่ละคน", "required": true, "help": "บรรทัดละคน: รหัสนักศึกษา · อีเมล Gmail เช่น 67543210003-9 · pran.m@gmail.com ใช้แชร์ไฟล์สถานะทีมให้ทุกคน ต้องเป็นบัญชี Google อีเมล @rmutl.ac.th เปิดไฟล์ Google ไม่ได้"},
  {"key": "p_project", "type": "page", "title": "โครงงาน", "help": "ข้อมูลเดียวกับที่ใช้ใน ENGSE212"},
  {"key": "titleTh", "type": "text", "title": "ชื่อโครงงาน (ภาษาไทย)", "required": true},
  {"key": "titleEn", "type": "text", "title": "ชื่อโครงงาน (ภาษาอังกฤษ)", "required": true},
  {"key": "advisor", "type": "text", "title": "อาจารย์ที่ปรึกษาโครงงาน (ENGSE212)", "required": true},
  {"key": "coadvisor", "type": "text", "title": "อาจารย์ที่ปรึกษาร่วม (ถ้ามี)"},
  {"key": "summary", "type": "paragraph", "title": "ระบบทำอะไร ให้ใครใช้", "required": true, "help": "2–3 ประโยค"},
  {"key": "type", "type": "checkbox", "title": "ประเภทระบบ", "required": true, "help": "เลือกได้หลายข้อ", "choices": ["เว็บแอปพลิเคชัน", "แอปบนมือถือ", "API หรือบริการหลังบ้าน", "IoT หรือระบบฝังตัว", "AI หรือ Machine Learning", "เกม"], "other": true},
  {"key": "stack", "type": "text", "title": "เทคโนโลยีหลัก", "required": true, "help": "ภาษา เฟรมเวิร์ก ฐานข้อมูล เช่น React · Node.js · PostgreSQL"},
  {"key": "uat", "type": "mc", "title": "ผู้ใช้จริงที่จะชวนมาทดลองใช้ระบบ (สำหรับการทดสอบการยอมรับ สัปดาห์ 12–13)", "required": true, "choices": ["มี และติดต่อแล้ว", "มี แต่ยังไม่ได้ติดต่อ", "ยังไม่มี"]},
  {"key": "uatOrg", "type": "text", "title": "หน่วยงานหรือกลุ่มผู้ใช้", "help": "เช่น ร้านค้าในชุมชน นักศึกษาชั้นปี 1 ไม่ต้องใส่ชื่อบุคคล"},
  {"key": "p_risk", "type": "page", "title": "ความเสี่ยงของระบบ", "help": "ใช้ในครั้งที่ 2 เพื่อกำหนดระดับความสำคัญของระบบ (integrity level) ตาม IEEE 1012"},
  {"key": "pdpa", "type": "mc", "title": "ระบบเก็บหรือใช้ข้อมูลส่วนบุคคลหรือไม่", "required": true, "choices": ["ไม่มี", "มีข้อมูลทั่วไป เช่น ชื่อ อีเมล เบอร์โทร", "มีข้อมูลอ่อนไหว เช่น สุขภาพ การเงิน ตำแหน่งที่อยู่"]},
  {"key": "impact", "type": "mc", "title": "ถ้าระบบทำงานผิด ผลเสียร้ายแรงที่สุดที่เป็นไปได้คืออะไร", "required": true, "choices": ["ผู้ใช้ไม่สะดวก ต้องทำซ้ำ", "งานล่าช้า หรือได้ข้อมูลผิด", "เสียเงิน หรือข้อมูลส่วนบุคคลรั่วไหล", "กระทบความปลอดภัยของคน"]},
  {"key": "p_repo", "type": "page", "title": "Repository และเครื่องมือ"},
  {"key": "repo", "type": "url", "title": "ลิงก์ repository ของโครงงาน", "required": true, "help": "เช่น https://github.com/ชื่อทีม/ชื่อโครงงาน"},
  {"key": "access", "type": "mc", "title": "เพิ่มบัญชี GitHub ของอาจารย์ (tkeatkaew) เป็นผู้มีสิทธิ์อ่าน repo แล้วหรือยัง", "required": true, "help": "GitHub > Settings > Collaborators > Add people > tkeatkaew สิทธิ์ Read", "choices": ["เพิ่มแล้ว", "repo เป็น public อยู่แล้ว", "ยัง จะเพิ่มก่อนครั้งที่ 2"]},
  {"key": "tracker", "type": "mc", "title": "ระบบติดตามงาน", "required": true, "choices": ["GitHub Issues หรือ Projects", "Jira", "Trello", "ยังไม่ใช้"], "other": true},
  {"key": "ci", "type": "mc", "title": "CI (ทดสอบหรือ build อัตโนมัติเมื่อ push)", "required": true, "choices": ["ใช้ GitHub Actions แล้ว", "ใช้เครื่องมืออื่น", "ยังไม่ใช้"]},
  {"key": "tests", "type": "mc", "title": "automated test ที่มีอยู่ตอนนี้", "required": true, "choices": ["ยังไม่มี", "มี unit test บางส่วน", "มีหลายระดับ เช่น unit และ integration"]},
  {"key": "p_status", "type": "page", "title": "สถานะงานและเอกสาร"},
  {"key": "docs", "type": "checkbox", "title": "เอกสารที่มีแล้ว", "help": "เลือกเฉพาะที่มีจริงตอนนี้", "choices": ["ข้อเสนอโครงงาน (ENGSE211) ที่ผ่านแล้ว", "SRS หรือเอกสารความต้องการ", "Use case หรือ User story", "RTM (ตารางสอบย้อนความต้องการ)", "เอกสารออกแบบ (สถาปัตยกรรม ฐานข้อมูล)", "UI prototype", "แผน Sprint หรือ Product backlog"]},
  {"key": "srs", "type": "url", "title": "ลิงก์ SRS ฉบับล่าสุด", "help": "ใน repo หรือ Google Drive ที่อาจารย์เปิดได้ ใช้ทบทวนในครั้งที่ 3"},
  {"key": "progress", "type": "mc", "title": "ความคืบหน้าการพัฒนาโดยประมาณ", "required": true, "choices": ["ยังไม่เริ่มเขียนโค้ด", "1–25%", "26–50%", "51–75%", "มากกว่า 75%"]},
  {"key": "milestones", "type": "paragraph", "title": "กำหนดการสำคัญของ ENGSE212 ที่ทีมทราบ", "help": "เช่น สอบความก้าวหน้า สอบจบ ส่งเล่ม"},
  {"key": "wish", "type": "paragraph", "title": "อยากให้วิชานี้ช่วยตรวจหรือทดสอบส่วนไหนของโครงงานเป็นพิเศษ"}
];

// คอลัมน์ในแผ่นข้อมูลซิงก์ ตามลำดับ A, B, C, ...
var SYNC_COLS = ["team", "keys", "ts", "email", "note", "titleTh", "memberIds", "memberNames", "leader", "outside", "github", "titleEn", "advisor", "coadvisor", "summary", "type", "stack", "uat", "uatOrg", "pdpa", "impact", "repo", "access", "tracker", "ci", "tests", "docs", "srs", "progress", "milestones", "wish", "emails", "memberEmails"];
var SYNC_TITLES = ["รหัสทีม", "คีย์คำตอบ", "ส่งล่าสุด", "อีเมลผู้กรอก", "หมายเหตุจากการซิงก์", "ชื่อโครงงาน (ภาษาไทย)", "รหัสสมาชิกในกลุ่มนี้", "ชื่อสมาชิกในกลุ่มนี้", "รหัสนักศึกษาของผู้กรอก", "สมาชิกทีมที่ไม่ได้เรียน ENGSE601 กลุ่มนี้ (ถ้ามี)", "บัญชี GitHub และส่วนที่รับผิดชอบของสมาชิกแต่ละคน", "ชื่อโครงงาน (ภาษาอังกฤษ)", "อาจารย์ที่ปรึกษาโครงงาน (ENGSE212)", "อาจารย์ที่ปรึกษาร่วม (ถ้ามี)", "ระบบทำอะไร ให้ใครใช้", "ประเภทระบบ", "เทคโนโลยีหลัก", "ผู้ใช้จริงที่จะชวนมาทดลองใช้ระบบ (สำหรับการทดสอบการยอมรับ สัปดาห์ 12–13)", "หน่วยงานหรือกลุ่มผู้ใช้", "ระบบเก็บหรือใช้ข้อมูลส่วนบุคคลหรือไม่", "ถ้าระบบทำงานผิด ผลเสียร้ายแรงที่สุดที่เป็นไปได้คืออะไร", "ลิงก์ repository ของโครงงาน", "เพิ่มบัญชี GitHub ของอาจารย์ (tkeatkaew) เป็นผู้มีสิทธิ์อ่าน repo แล้วหรือยัง", "ระบบติดตามงาน", "CI (ทดสอบหรือ build อัตโนมัติเมื่อ push)", "automated test ที่มีอยู่ตอนนี้", "เอกสารที่มีแล้ว", "ลิงก์ SRS ฉบับล่าสุด", "ความคืบหน้าการพัฒนาโดยประมาณ", "กำหนดการสำคัญของ ENGSE212 ที่ทีมทราบ", "อยากให้วิชานี้ช่วยตรวจหรือทดสอบส่วนไหนของโครงงานเป็นพิเศษ", "อีเมล Gmail ของสมาชิกแต่ละคน", "อีเมลตามรหัสสมาชิก"];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ENGSE601')
    .addItem('ซิงก์ทีมตอนนี้', 'syncTeams')
    .addSeparator()
    .addItem('เผยแพร่สถานะทีมตอนนี้', 'publishTeamStatus')
    .addSeparator()
    .addItem('สร้างแบบลงทะเบียนทีม', 'createTeamForm')
    .addItem('เพิ่มคำถามอีเมลสมาชิกในฟอร์มเดิม', 'addEmailQuestion')
    .addItem('ปรับรายชื่อในฟอร์มตามแผ่นคะแนน', 'updateFormRoster')
    .addSeparator()
    .addItem('ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม', 'installSubmitTrigger')
    .addItem('ยกเลิกซิงก์อัตโนมัติ', 'removeSubmitTrigger')
    .addItem('ตั้งเผยแพร่สถานะทีมอัตโนมัติทุกคืน', 'installNightlyPublish')
    .addItem('ยกเลิกเผยแพร่อัตโนมัติ', 'removeNightlyPublish')
    .addToUi();
}

/* ------------------------------------------------------------------ form */

function createTeamForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sum = sheetOrStop_(ss, SHEET.summary);
  sheetOrStop_(ss, SHEET.sync);
  if (sum.getRange(CELL.formEdit).getValue()) {
    var ui = ui_();
    if (!ui) { Logger.log('มีแบบลงทะเบียนทีมอยู่แล้ว ถ้าต้องการสร้างใหม่ให้สั่งจากเมนู ENGSE601 ในชีต'); return; }
    var ok = ui.alert('มีแบบลงทะเบียนทีมอยู่แล้ว',
      'สร้างฟอร์มใหม่แทนลิงก์เดิมหรือไม่ (ฟอร์มเดิมยังอยู่ใน Drive แต่สคริปต์จะซิงก์จากฟอร์มใหม่เท่านั้น)', ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) return;
  }
  var roster = readRoster_(ss);
  if (!roster.length) throw new Error('ไม่พบรายชื่อในแผ่น "' + SHEET.scores + '" คอลัมน์ B–C แถว ' + ROSTER.firstRow + ' เป็นต้นไป');

  var form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESC);
  form.setCollectEmail(true);
  form.setAllowResponseEdits(true);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('ลงทะเบียนทีมแล้ว ถ้าต้องแก้ ใช้ลิงก์ "แก้ไขคำตอบ" ไม่ต้องส่งใหม่ ' +
    'ก่อนครั้งที่ 2 อย่าลืมเพิ่ม ' + TEACHER_GITHUB + ' ใน repo และสร้าง docs/vv/00-vv-profile.md');

  var ids = {}, firstPage = true;
  FIELDS.forEach(function (f) {
    if (f.type === 'page') {
      var head = firstPage ? form.addSectionHeaderItem() : form.addPageBreakItem();
      firstPage = false;
      head.setTitle(f.title);
      if (f.help) head.setHelpText(f.help);
      return;
    }
    ids[f.key] = addItem_(form, f, roster).getId();
  });

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var props = PropertiesService.getDocumentProperties();
  props.setProperty(PROP.items, JSON.stringify(ids));
  sum.getRange(CELL.formEdit).setValue(form.getEditUrl());
  sum.getRange(CELL.formPublic).setValue(form.getPublishedUrl());
  alert_('สร้างแบบลงทะเบียนทีมแล้ว',
    'ลิงก์สำหรับนักศึกษาอยู่ที่แผ่น "ภาพรวม" ช่อง ' + CELL.formPublic + '\nนำไปใส่ register.formUrl ใน data.js แล้วตั้งซิงก์อัตโนมัติ');
}

function addItem_(form, f, roster) {
  var item;
  if (f.type === 'paragraph') item = form.addParagraphTextItem();
  else if (f.type === 'mc') item = form.addMultipleChoiceItem();
  else if (f.type === 'checkbox') item = form.addCheckboxItem();
  else item = form.addTextItem();
  item.setTitle(f.title).setRequired(!!f.required);
  if (f.help) item.setHelpText(f.help);
  if (f.choices) {
    item.setChoiceValues(f.choices === 'ROSTER' ? rosterChoices_(roster) : f.choices);
    if (f.other) item.showOtherOption(true);
  }
  if (f.type === 'url') {
    item.setValidation(FormApp.createTextValidation().setHelpText('ใส่ลิงก์เต็ม ขึ้นต้นด้วย https://').requireTextIsUrl().build());
  }
  if (f.key === 'leader') {
    item.setValidation(FormApp.createTextValidation().setHelpText('รหัสนักศึกษา 11 หลัก ขีด และเลขท้าย เช่น 67543210003-9')
      .requireTextMatchesPattern('^[0-9]{11}-[0-9]$').build());
  }
  if (f.key === 'emails') {
    item.setValidation(FormApp.createParagraphTextValidation().setHelpText('ใส่รหัสนักศึกษาและอีเมลของทุกคน บรรทัดละคน')
      .requireTextContainsPattern('[0-9]{11}-[0-9].*@').build());
  }
  return item;
}

/** ฟอร์มที่สร้างด้วยสคริปต์ฉบับ 1.0 ยังไม่มีคำถามอีเมล: เพิ่มต่อจากคำถาม GitHub ครั้งเดียว
 *  ทีมที่ส่งแล้วกด "แก้ไขคำตอบ" เพื่อกรอกเพิ่ม ส่วนทีมที่ยังไม่ส่งจะเห็นคำถามนี้เลย */
function addEmailQuestion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = openForm_(ss);
  if (!form) return;
  if (findItem_(form, 'emails')) { alert_('มีคำถามอีเมลอยู่แล้ว', 'ไม่ต้องเพิ่มซ้ำ'); return; }
  var f = FIELDS.filter(function (x) { return x.key === 'emails'; })[0];
  var item = addItem_(form, f, []);
  var gh = findItem_(form, 'github');
  if (gh) form.moveItem(item.getIndex(), gh.getIndex() + 1);
  var props = PropertiesService.getDocumentProperties();
  var ids = {};
  try { ids = JSON.parse(props.getProperty(PROP.items) || '{}'); } catch (e) { ids = {}; }
  ids.emails = item.getId();
  props.setProperty(PROP.items, JSON.stringify(ids));
  itemKeyMap_.cache = null;
  alert_('เพิ่มคำถามอีเมลแล้ว', 'คำถาม "' + f.title + '" อยู่ต่อจากคำถาม GitHub ลิงก์ฟอร์มเดิมใช้ได้ต่อ');
}

/** ปรับตัวเลือกสมาชิกในฟอร์มให้ตรงกับรายชื่อในแผ่นคะแนน (ใช้เมื่อมีนักศึกษาเพิ่มหรือถอน) */
function updateFormRoster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = openForm_(ss);
  if (!form) return;
  var item = findItem_(form, 'members');
  if (!item) throw new Error('ไม่พบคำถามเลือกสมาชิกในฟอร์ม');
  var roster = readRoster_(ss);
  item.asCheckboxItem().setChoiceValues(rosterChoices_(roster));
  alert_('ปรับรายชื่อในฟอร์มแล้ว', 'ตัวเลือกสมาชิก ' + roster.length + ' คน ตามแผ่น "' + SHEET.scores + '"');
}

/* ------------------------------------------------------------------ sync */

function syncTeams() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sum = sheetOrStop_(ss, SHEET.summary);
  var out = sheetOrStop_(ss, SHEET.sync);
  var form = openForm_(ss);
  if (!form) return;
  var tz = ss.getSpreadsheetTimeZone();
  var props = PropertiesService.getDocumentProperties();
  var now = new Date();

  var roster = readRoster_(ss), byId = {};
  roster.forEach(function (s) { byId[s.id] = s.name; });

  // รหัสทีมที่ออกไปแล้วจากการซิงก์ครั้งก่อน: คีย์คำตอบ -> รหัสทีม
  var keyToTeam = {}, maxTeam = Number(props.getProperty(PROP.maxTeam) || 0);
  var old = out.getRange(2, 1, SYNC_ROWS, 2).getValues();
  old.forEach(function (r) {
    var t = String(r[0]).trim();
    if (!t) return;
    maxTeam = Math.max(maxTeam, teamNo_(t));
    String(r[1]).split(',').forEach(function (k) { if (k.trim()) keyToTeam[k.trim()] = t; });
  });

  var resps = form.getResponses().map(function (r) { return parseResponse_(form, r); })
    .sort(function (a, b) { return a.ts - b.ts; });

  var teams = {};
  resps.forEach(function (r) {
    var t = keyToTeam[r.key];
    if (!t) t = sameMembers_(teams, r.members);           // ทีมเดิมส่งซ้ำด้วยสมาชิกชุดเดียวกัน
    if (!t) { maxTeam++; t = 'T' + ('0' + maxTeam).slice(-2); }
    var team = teams[t] || (teams[t] = { keys: [], notes: [], info: [] });
    if (team.resp) team.info = ['ส่งซ้ำ ' + (team.keys.length + 1) + ' ครั้ง ใช้คำตอบล่าสุด'];
    team.keys.push(r.key);
    team.resp = r;
  });
  props.setProperty(PROP.maxTeam, String(maxTeam));

  // ตรวจความถูกต้องของแต่ละทีม
  var where = {};
  Object.keys(teams).forEach(function (t) {
    var tm = teams[t], r = tm.resp;
    r.members.forEach(function (id) { (where[id] = where[id] || []).push(t); });
    var unknown = r.members.filter(function (id) { return !byId[id]; });
    if (unknown.length) tm.notes.push('ไม่อยู่ในรายชื่อแผ่นคะแนน: ' + unknown.join(', '));
    if (r.v.leader && r.members.indexOf(normId_(r.v.leader)) < 0) tm.notes.push('ผู้กรอก ' + r.v.leader + ' ไม่ได้เลือกตัวเองเป็นสมาชิก');
    if (teamNo_(t) > MAX_TEAMS) tm.notes.push('เกิน T' + MAX_TEAMS + ' ต้องเพิ่มแถวในแผ่นทีม');
    var mails = parseEmails_(r.v.emails);
    tm.mails = mails;
    var noMail = r.members.filter(function (id) { return !mails[id]; });
    if (noMail.length) tm.notes.push('ยังไม่มีอีเมลของ ' + noMail.join(', '));
    var notGmail = r.members.filter(function (id) { return mails[id] && !/@gmail\.com$/i.test(mails[id]); });
    if (notGmail.length) tm.notes.push('อีเมลไม่ใช่ Gmail ให้ทีมแก้คำตอบ: ' + notGmail.map(function (id) {
      return id + (/@rmutl\.ac\.th$/i.test(mails[id]) ? ' (อีเมลมหาวิทยาลัยเปิดไฟล์ Google ไม่ได้)' : ' (' + mails[id] + ')');
    }).join(', '));
  });
  Object.keys(where).forEach(function (id) {
    if (where[id].length < 2) return;
    where[id].forEach(function (t) {
      teams[t].notes.push(id + ' อยู่หลายทีม (' + where[id].join(', ') + ') ลบคำตอบที่ผิดในฟอร์ม หรือพิมพ์ทีมเองในแผ่นคะแนน');
    });
  });

  var rows = Object.keys(teams).sort(function (a, b) { return teamNo_(a) - teamNo_(b); }).map(function (t) {
    var tm = teams[t], r = tm.resp;
    return SYNC_COLS.map(function (key) {
      switch (key) {
        case 'team': return t;
        case 'keys': return tm.keys.join(',');
        case 'ts': return Utilities.formatDate(r.ts, tz, 'd/M/yyyy HH:mm');
        case 'email': return r.email;
        case 'note': return tm.notes.concat(tm.info).join(' · ');
        case 'memberIds': return r.members.join(', ');
        case 'memberNames': return r.members.map(function (id) { return byId[id] || id; }).join(', ');
        case 'memberEmails': return r.members.map(function (id) { return id + ' ' + (tm.mails[id] || '-'); }).join(', ');
        default: return r.v[key] === undefined ? '' : r.v[key];
      }
    });
  });

  if (out.getMaxColumns() < SYNC_COLS.length) out.insertColumnsAfter(out.getMaxColumns(), SYNC_COLS.length - out.getMaxColumns());
  out.getRange(1, 1, 1, SYNC_COLS.length).setValues([SYNC_TITLES]);
  out.getRange(2, 1, SYNC_ROWS, SYNC_COLS.length).clearContent();
  if (rows.length > SYNC_ROWS) throw new Error('ทีมมากกว่า ' + SYNC_ROWS + ' แถว');
  if (rows.length) {
    out.getRange(2, 1, rows.length, SYNC_COLS.length).setNumberFormat('@').setValues(rows);
  }

  var placed = roster.filter(function (s) { return where[s.id]; }).length;
  var problems = Object.keys(teams).filter(function (t) { return teams[t].notes.length; }).length;
  sum.getRange(CELL.lastSync).setValue(Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
  sum.getRange(CELL.syncNote).setValue('ทีม ' + rows.length + ' · มีทีม ' + placed + '/' + roster.length + ' คน' +
    (problems ? ' · ต้องตรวจ ' + problems + ' ทีม (ดูหมายเหตุในแผ่นข้อมูลซิงก์)' : ''));
}

/** แปลงคำตอบ 1 ชุดเป็น { key, ts, email, members[], v{key: ข้อความ} } */
function parseResponse_(form, r) {
  var keyOf = itemKeyMap_(form), v = {}, members = [];
  r.getItemResponses().forEach(function (ir) {
    var k = keyOf[ir.getItem().getId()];
    if (!k) return;
    var a = ir.getResponse();
    if (k === 'members') {
      (Array.isArray(a) ? a : [a]).forEach(function (c) {
        var m = String(c).match(ID_RE);
        if (m && members.indexOf(m[1]) < 0) members.push(m[1]);
      });
      return;
    }
    v[k] = Array.isArray(a) ? a.join(', ') : String(a === null || a === undefined ? '' : a).trim();
  });
  members.sort();
  return { key: r.getId(), ts: r.getTimestamp(), email: r.getRespondentEmail() || '', members: members, v: v };
}

/** item id -> key: ใช้ id ที่บันทึกตอนสร้างฟอร์ม ถ้าไม่มี (เช่นสร้างฟอร์มเอง) เทียบจากชื่อคำถาม */
function itemKeyMap_(form) {
  if (itemKeyMap_.cache) return itemKeyMap_.cache;
  var map = {}, saved = {};
  try { saved = JSON.parse(PropertiesService.getDocumentProperties().getProperty(PROP.items) || '{}'); } catch (e) { saved = {}; }
  Object.keys(saved).forEach(function (k) { map[saved[k]] = k; });
  var byTitle = {};
  FIELDS.forEach(function (f) { byTitle[f.title] = f.key; });
  form.getItems().forEach(function (it) {
    if (!map[it.getId()] && byTitle[it.getTitle()]) map[it.getId()] = byTitle[it.getTitle()];
  });
  itemKeyMap_.cache = map;
  return map;
}

function findItem_(form, key) {
  var map = itemKeyMap_(form), found = null;
  form.getItems().forEach(function (it) { if (map[it.getId()] === key) found = it; });
  return found;
}

/** ข้อความ "รหัส · อีเมล" หลายบรรทัด -> { รหัส: อีเมล } */
function parseEmails_(text) {
  var map = {};
  String(text || '').split(/\r?\n|;/).forEach(function (line) {
    var id = line.match(ID_RE), em = line.match(EMAIL_RE);
    if (id && em) map[id[1]] = em[0].toLowerCase();
  });
  return map;
}

function sameMembers_(teams, members) {
  var sig = members.join(','), hit = null;
  Object.keys(teams).forEach(function (t) { if (teams[t].resp.members.join(',') === sig && sig) hit = t; });
  return hit;
}

/* ------------------------------------------------------------------ publish */

/** สร้างหรืออัปเดตไฟล์สถานะของทุกทีมที่มีสมาชิกในกลุ่มนี้ แล้วแชร์ให้อีเมลสมาชิกแบบดูอย่างเดียว */
function publishTeamStatus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sum = sheetOrStop_(ss, SHEET.summary);
  var tsh = sheetOrStop_(ss, 'ทีม');
  var tz = ss.getSpreadsheetTimeZone();
  var now = new Date();
  var cps = readCps_(sum);
  var first = sum.getRange(PUB.firstClass).getValue();
  first = Object.prototype.toString.call(first) === '[object Date]' && !isNaN(first) ? dayOnly_(first) : null;
  var minAttend = Number(sum.getRange(PUB.minAttend).getValue()) || 0.8;

  // นักศึกษา: ทีมตามแผ่นคะแนน (รวมที่อาจารย์แก้เอง) ชื่อ และเวลาเรียน
  var students = sheetOrStop_(ss, SHEET.scores).getRange(ROSTER.firstRow, 1, ROSTER.lastRow - ROSTER.firstRow + 1, SCORE.width).getValues()
    .map(function (r) { return { id: normId_(r[SCORE.id - 1]), name: String(r[SCORE.name - 1]).replace(/\s+/g, ' ').trim(),
      team: String(r[SCORE.team - 1]).trim(), attend: r[SCORE.attend - 1] }; })
    .filter(function (s) { return s.id; });

  // จากข้อมูลซิงก์: อีเมลรายคน และคำตอบเรื่องสิทธิ์ repo ของแต่ละทีม
  var out = sheetOrStop_(ss, SHEET.sync), mails = {}, access = {};
  var sv = out.getRange(2, 1, SYNC_ROWS, Math.min(out.getMaxColumns(), SYNC_COLS.length)).getValues();
  var ci = function (k) { return SYNC_COLS.indexOf(k); };
  sv.forEach(function (r) {
    if (!String(r[0]).trim()) return;
    access[String(r[0]).trim()] = String(r[ci('access')] || '');
    var m = ci('memberEmails') >= 0 ? String(r[ci('memberEmails')] || '') : '';
    m.split(',').forEach(function (p) {
      var id = p.match(ID_RE), em = p.match(EMAIL_RE);
      if (id && em) mails[id[1]] = em[0].toLowerCase();
    });
  });
  var knownMails = Object.keys(mails).map(function (k) { return mails[k]; });

  var folder = statusFolder_();
  var rows = tsh.getRange(TEAM.firstRow, 1, TEAM.rows, TEAM.width).getValues();
  var made = 0, shared = 0, missing = [];
  rows.forEach(function (r, i) {
    var t = String(r[TEAM.c.id - 1]).trim();
    var members = students.filter(function (s) { return s.team === t; });
    if (!t || !members.length) return;
    var d = teamData_(t, r, members, cps, first, minAttend, access[t], now);
    var link = String(r[TEAM.c.file - 1] || '');
    var file = openOrCreateStatus_(link, folder, t, d.title);
    writeStatus_(file.getSheets()[0], d, Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
    var res = shareStatus_(file.getId(), members, mails, knownMails);
    made++;
    if (!res.missing.length && !res.failed.length) shared++;
    missing = missing.concat(res.missing);
    tsh.getRange(TEAM.firstRow + i, TEAM.c.file, 1, 2).setValues([[file.getUrl(),
      'เผยแพร่ ' + Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm') + ' · แชร์ ' + res.ok + '/' + members.length + ' คน' +
      (res.missing.length ? ' · ยังไม่มีอีเมล: ' + res.missing.join(', ') : '') + (res.failed.length ? ' · แชร์ไม่ได้: ' + res.failed.join(', ') : '')]]);
  });
  sum.getRange(PUB.lastPub).setValue(Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
  sum.getRange(PUB.pubNote).setValue('ไฟล์ทีม ' + made + ' · แชร์ครบ ' + shared + ' ทีม' +
    (missing.length ? ' · ยังไม่มีอีเมล ' + missing.length + ' คน (ดูแผ่นทีม คอลัมน์ X)' : '') +
    (first ? '' : ' · ยังไม่ได้กรอกวันที่เรียนครั้งที่ 1 จึงไม่แสดงวันกำหนดส่ง'));
}

/** แถว CP1–CP5 ในตารางสัดส่วนคะแนนของแผ่นภาพรวม: ชื่อ คะแนนเต็ม สัปดาห์ และช่องเผยแพร่ผล (คอลัมน์ E) */
function readCps_(sum) {
  var cps = [];
  sum.getRange(PUB.cpScanFrom, 1, PUB.cpScanRows, 5).getValues().forEach(function (r) {
    var m = String(r[0]).match(/^CP([1-5])\s+(.+)$/);
    if (m) cps[Number(m[1]) - 1] = { id: 'CP' + m[1], title: m[2].trim(), max: Number(r[1]) || 0, week: Number(r[3]) || 0, pub: r[4] === true };
  });
  if (cps.filter(Boolean).length !== 5) throw new Error('หาแถว CP1–CP5 ในแผ่นภาพรวมไม่ครบ');
  return cps;
}

/** ข้อมูลที่จะแสดงในไฟล์ของทีม (เฉพาะค่าที่อนุญาตให้นักศึกษาเห็น) */
function teamData_(t, r, members, cps, first, minAttend, accessAnswer, now) {
  var today = dayOnly_(now);
  var title = String(r[TEAM.c.title - 1] || '').trim();
  var done = 0, got = 0, full = 0, next = null;
  var cpRows = cps.map(function (cp, k) {
    var score = r[TEAM.c.cp - 1 + k], has = score !== '' && score !== null && !isNaN(Number(score));
    var due = first ? new Date(first.getTime() + (cp.week - 1) * 7 * 864e5) : null;
    var days = due ? Math.round((due - today) / 864e5) : null;
    var row = { cp: cp.id + ' ' + cp.title, due: due ? thaiDate_(due) + ' (สัปดาห์ ' + cp.week + ')' : 'สัปดาห์ ' + cp.week,
      status: '', tone: 'na', score: '–', fb: '' };
    if (cp.pub && has) {
      row.status = 'ตรวจแล้ว'; row.tone = 'ok'; row.score = fmtNum_(score) + ' / ' + cp.max;
      row.fb = String(r[TEAM.c.fb - 1 + k] || '').trim();
      done++; got += Number(score); full += cp.max;
    } else if (cp.pub) {
      row.status = 'ยังไม่มีคะแนน ติดต่ออาจารย์'; row.tone = 'no';
    } else if (days === null) {
      row.status = 'ตามกำหนด';
    } else if (days < 0) {
      row.status = 'รอผลตรวจ';
    } else if (days === 0) {
      row.status = 'ส่งวันนี้'; row.tone = 'wa';
    } else if (days <= 14) {
      row.status = 'อีก ' + days + ' วัน'; row.tone = 'wa';
    } else {
      row.status = 'ยังไม่ถึงกำหนด';
    }
    if (!next && !cp.pub && (days === null || days >= 0)) next = cp.id + ' · ' + (due ? thaiDate_(due) : 'สัปดาห์ ' + cp.week);
    return row;
  });
  var prof = String(r[TEAM.c.profile - 1] || '').trim();
  var repoOk = /^(เพิ่มแล้ว|repo เป็น public)/.test(accessAnswer || '');
  var checks = [
    ['ลงทะเบียนทีม', accessAnswer !== undefined, accessAnswer !== undefined ? 'แล้ว' : 'ยังไม่พบ'],
    ['V&V Profile (docs/vv/00-vv-profile.md)', prof === 'ส่งแล้ว', prof || 'ยังไม่ได้ตรวจ', prof === 'ต้องแก้' ? 'wa' : null],
    ['อาจารย์เข้า repo ได้', repoOk, repoOk ? 'แจ้งว่าเพิ่มแล้ว' : 'ยังไม่ได้เพิ่ม'],
    ['ใบงานครั้งที่ 1 (docs/vv/01-case-analysis.pdf)', r[TEAM.c.worksheet - 1] === true, r[TEAM.c.worksheet - 1] === true ? 'ส่งแล้ว' : 'ยังไม่พบ']
  ];
  var people = members.map(function (s) {
    var a = s.attend, st, tone;
    if (a === '' || a === null || isNaN(Number(a))) { st = 'ยังไม่มีข้อมูล'; tone = 'na'; }
    else if (Number(a) < minAttend) { st = 'ต่ำกว่าเกณฑ์ ' + Math.round(minAttend * 100) + '%'; tone = 'no'; }
    else if (Number(a) < minAttend + 0.1) { st = 'ใกล้เกณฑ์ ' + Math.round(minAttend * 100) + '%'; tone = 'wa'; }
    else { st = 'ปกติ'; tone = 'ok'; }
    return { name: s.name, status: st, tone: tone };
  });
  return { team: t, title: title, members: members.map(function (s) { return s.name; }), done: done, got: got, full: full,
    next: next || 'ครบทุกจุดตรวจ', cps: cpRows, note: String(r[TEAM.c.note - 1] || '').trim(), checks: checks, people: people };
}

var TONE = { ok: ['#d8efe0', '#1e5b35'], wa: ['#fceac6', '#7a510a'], no: ['#f7d6d3', '#9b2b21'], na: ['#edf2f4', '#3f5972'] };

/** เขียนไฟล์สถานะทีมใหม่ทั้งแผ่น (ค่าอย่างเดียว) */
function writeStatus_(sh, d, stamp) {
  sh.clear();
  sh.getRange(1, 1, sh.getMaxRows(), Math.min(sh.getMaxColumns(), 26)).breakApart();
  sh.setName('สถานะทีม');
  sh.setHiddenGridlines(true);
  [230, 150, 150, 90, 330].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  var all = sh.getRange(1, 1, 60, 5);
  all.setFontFamily('Tahoma').setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  var row = 1;
  function line(text, size, bold, color) {
    sh.getRange(row, 1, 1, 5).merge().setValue(text).setFontSize(size).setFontWeight(bold ? 'bold' : 'normal').setFontColor(color || '#0f263f');
    row++;
  }
  function head(labels) {
    sh.getRange(row, 1, 1, labels.length).setValues([labels]).setBackground('#0f263f').setFontColor('#ffffff').setFontWeight('bold');
    row++;
  }
  function tone(range, t) { var c = TONE[t || 'na']; range.setBackground(c[0]).setFontColor(c[1]); }

  line('ENGSE601 การตรวจสอบความสมเหตุสมผลและการทวนสอบซอฟต์แวร์ · ภาค 2/2569 · สถานะทีม', 9, false, '#597087');
  line(d.team + (d.title ? ' · ' + d.title : ''), 16, true);
  line('สมาชิก: ' + d.members.join(' · '), 10, false, '#3f5972');
  line('เผยแพร่ล่าสุด ' + stamp + ' · ไฟล์นี้ดูได้อย่างเดียว อาจารย์อัปเดตหลังตรวจงาน', 9, false, '#597087');
  row++;
  sh.getRange(row, 1, 1, 3).setValues([['จุดตรวจที่ได้ผลแล้ว', 'คะแนนทีมจากที่ตรวจแล้ว', 'งานถัดไป']]).setFontColor('#597087').setFontSize(9);
  row++;
  sh.getRange(row, 1, 1, 3).setValues([[d.done + ' / 5', d.full ? fmtNum_(d.got) + ' / ' + d.full : '–', d.next]])
    .setFontSize(14).setFontWeight('bold').setBackground('#edf2f4').setFontColor('#0f263f');
  sh.setRowHeight(row, 34);
  row += 2;

  head(['จุดตรวจ', 'กำหนด', 'สถานะ', 'คะแนนทีม', 'ข้อเสนอแนะจากอาจารย์']);
  d.cps.forEach(function (c) {
    sh.getRange(row, 1, 1, 5).setValues([[c.cp, c.due, c.status, c.score, c.fb]]);
    tone(sh.getRange(row, 3), c.tone);
    sh.getRange(row, 4).setHorizontalAlignment('center');
    row++;
  });
  if (d.note) {
    row++;
    line('ข้อความจากอาจารย์', 11, true);
    sh.getRange(row, 1, 1, 5).merge().setValue(d.note).setBackground('#fff4cc');
    row++;
  }
  row++;
  line('สิ่งที่ต้องมีใน repo', 11, true);
  d.checks.forEach(function (c) {
    sh.getRange(row, 1, 1, 2).setValues([[c[0], (c[1] ? '✓ ' : '✗ ') + c[2]]]);
    tone(sh.getRange(row, 2), c[3] || (c[1] ? 'ok' : 'no'));
    row++;
  });
  row++;
  line('เวลาเรียนรายคน (แสดงเป็นสถานะ เกณฑ์มีสิทธิ์สอบปลายภาคตามแผ่นภาพรวมของอาจารย์)', 11, true);
  d.people.forEach(function (p) {
    sh.getRange(row, 1, 1, 2).setValues([[p.name, p.status]]);
    tone(sh.getRange(row, 2), p.tone);
    row++;
  });
  row++;
  line('คะแนนจุดตรวจเป็นคะแนนทีม คะแนนรายคนปรับด้วยการประเมินเพื่อนไม่เกิน ±20% และไม่แสดงในไฟล์นี้ · ข้อมูลไม่ตรง แจ้งอาจารย์ในคาบ', 9, false, '#597087');
}

function statusFolder_() {
  var props = PropertiesService.getDocumentProperties();
  var id = props.getProperty(PROP.folder), folder = null;
  if (id) { try { folder = DriveApp.getFolderById(id); if (folder.isTrashed()) folder = null; } catch (e) { folder = null; } }
  if (!folder) {
    folder = DriveApp.createFolder(FOLDER_NAME);
    FOLDER_EDITORS.forEach(function (em) { try { folder.addEditor(em); } catch (e) { Logger.log('เพิ่มผู้แก้ไขโฟลเดอร์ไม่ได้: ' + em); } });
    props.setProperty(PROP.folder, folder.getId());
  }
  return folder;
}

function openOrCreateStatus_(link, folder, t, title) {
  var m = String(link).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (m) {
    try { var f = DriveApp.getFileById(m[1]); if (!f.isTrashed()) return SpreadsheetApp.openById(m[1]); } catch (e) { /* สร้างใหม่ */ }
  }
  var book = SpreadsheetApp.create(STATUS_FILE + t);
  DriveApp.getFileById(book.getId()).moveTo(folder);
  return book;
}

/** แชร์แบบดูอย่างเดียวให้สมาชิกที่มีอีเมล และถอนสิทธิ์อีเมลที่สคริปต์เคยแชร์แต่ไม่ใช่สมาชิกแล้ว
 *  (ย้ายทีม หรือทีมแก้อีเมลที่กรอกผิด) ผู้ที่อาจารย์เพิ่มเองในไฟล์ไม่ถูกถอน */
function shareStatus_(fileId, members, mails, knownMails) {
  var file = DriveApp.getFileById(fileId);
  var props = PropertiesService.getDocumentProperties(), pkey = 'engse601.shared.' + fileId, managed = [];
  try { managed = JSON.parse(props.getProperty(pkey) || '[]'); } catch (e) { managed = []; }
  var want = {}, res = { ok: 0, missing: [], failed: [] }, kept = [];
  members.forEach(function (s) { if (mails[s.id]) want[mails[s.id]] = s.id; else res.missing.push(s.id); });
  var have = {};
  file.getViewers().forEach(function (u) { have[String(u.getEmail()).toLowerCase()] = true; });
  Object.keys(want).forEach(function (em) {
    if (have[em]) { res.ok++; kept.push(em); return; }
    try { file.addViewer(em); res.ok++; kept.push(em); } catch (e) { res.failed.push(want[em]); }
  });
  var drop = {};
  Object.keys(have).concat(managed).forEach(function (em) {
    if (!want[em] && (managed.indexOf(em) >= 0 || knownMails.indexOf(em) >= 0)) drop[em] = true;
  });
  Object.keys(drop).forEach(function (em) { try { file.removeViewer(em); } catch (e) { /* ไม่มีสิทธิ์อยู่แล้ว */ } });
  props.setProperty(pkey, JSON.stringify(kept));
  return res;
}

var TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function thaiDate_(d) { return d.getDate() + ' ' + TH_MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543); }
function dayOnly_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function fmtNum_(n) { n = Number(n); return Math.round(n * 100) / 100 + ''; }

/* ------------------------------------------------------------------ helpers */

function readRoster_(ss) {
  var sh = sheetOrStop_(ss, SHEET.scores);
  var n = ROSTER.lastRow - ROSTER.firstRow + 1;
  return sh.getRange(ROSTER.firstRow, ROSTER.idCol, n, 2).getDisplayValues()
    .map(function (r) { return { id: normId_(r[0]), name: String(r[1]).replace(/\s+/g, ' ').trim() }; })
    .filter(function (s) { return s.id; });
}

function rosterChoices_(roster) { return roster.map(function (s) { return s.id + ' ' + s.name; }); }

function normId_(s) { var m = String(s || '').match(ID_RE); return m ? m[1] : ''; }
function teamNo_(t) { var m = String(t).match(/^T(\d+)$/); return m ? Number(m[1]) : 0; }

function openForm_(ss) {
  var url = sheetOrStop_(ss, SHEET.summary).getRange(CELL.formEdit).getValue();
  if (!url) { alert_('ยังไม่มีแบบลงทะเบียนทีม', 'สั่ง ENGSE601 > สร้างแบบลงทะเบียนทีม ก่อน'); return null; }
  return FormApp.openByUrl(url);
}

/** แผ่นที่สคริปต์ต้องใช้ ถ้าไม่มีแปลว่าติดตั้งผิดไฟล์ */
function sheetOrStop_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแผ่น "' + name + '" สคริปต์นี้ใช้กับชีตอาจารย์ ENGSE601 เท่านั้น ตรวจว่าเปิดไฟล์ถูก');
  return sh;
}

/** กล่องข้อความในชีต (สั่งจากหน้า Apps Script หรือทริกเกอร์จะไม่มีหน้าจอ จึงบันทึกลง log แทน) */
function ui_() { try { return SpreadsheetApp.getUi(); } catch (e) { return null; } }
function alert_(title, msg) {
  var ui = ui_();
  if (ui) ui.alert(title, msg, ui.ButtonSet.OK); else Logger.log(title + ': ' + msg);
}

/* ------------------------------------------------------------------ triggers */

function installSubmitTrigger() {
  removeSubmitTrigger();
  ScriptApp.newTrigger('syncTeams').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onFormSubmit().create();
  syncTeams();
  alert_('ตั้งซิงก์อัตโนมัติแล้ว', 'ทุกครั้งที่มีคนส่งหรือแก้คำตอบ แผ่นข้อมูลซิงก์จะอัปเดตเอง');
}

function installNightlyPublish() {
  removeNightlyPublish();
  ScriptApp.newTrigger('publishTeamStatus').timeBased().everyDays(1).atHour(2).create();
  alert_('ตั้งเผยแพร่อัตโนมัติแล้ว', 'ทุกคืนประมาณ 02:00–03:00 น. คะแนน CP แสดงเฉพาะจุดตรวจที่ติ๊กเผยแพร่ผลแล้ว');
}

function removeNightlyPublish() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'publishTeamStatus') ScriptApp.deleteTrigger(t);
  });
}

function removeSubmitTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncTeams') ScriptApp.deleteTrigger(t);
  });
}
