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
 *      วันกำหนดส่ง CP1–CP5 ในไฟล์ใช้แผ่น "กำหนดการ" (ถ้าไม่มีแผ่นนี้ ใช้วันเรียนครั้งที่ 1 + สัปดาห์ในแผ่นภาพรวม)
 *   4. เป็นเว็บแอปส่ง "กำหนดการและสิ่งที่ต้องส่ง" จากแผ่น "กำหนดการ" ให้หน้าเว็บรายวิชาแบบ JSON
 *      ส่งเฉพาะแผ่นกำหนดการ (วัน เวลา ห้อง งาน ที่ส่งใน repo) ไม่มีรายชื่อ คะแนน หรือข้อมูลทีม
 *      แถวที่ไม่ได้ติ๊ก "แสดงบนเว็บ" ไม่ถูกส่ง · แคช 5 นาที และล้างเองเมื่อแก้แผ่นกำหนดการ
 *   5. ตรวจว่าแต่ละทีมส่งงานตาม path ใน repo แล้วหรือยัง (อ่านอย่างเดียวผ่าน GitHub API ด้วย token แบบ public read-only)
 *      ผลลงแผ่น "การส่งงาน" และส่งให้หน้าเว็บสถานะการส่ง (รหัสทีมกับสถานะเท่านั้น)
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
 *   เผยแพร่: ตรวจวันที่ในแผ่นกำหนดการ แล้วสั่ง ENGSE601 > เผยแพร่สถานะทีมตอนนี้
 *
 * เว็บแอปกำหนดการ (ทำครั้งเดียว หลังวางสคริปต์ฉบับ 1.3):
 *   1. ในหน้า Apps Script กด Deploy > New deployment > เลือกชนิด Web app
 *   2. Execute as: Me (software.rmutl@gmail.com) · Who has access: Anyone แล้วกด Deploy และอนุญาตสิทธิ์
 *   3. คัดลอก Web app URL (ลงท้าย /exec) ไปใส่ schedule.url ใน engse601/data.js
 *   4. ENGSE601 > ตรวจข้อมูลหน้าเว็บกำหนดการ เพื่อดูว่าหน้าเว็บจะเห็นกี่รายการ และงานใดยังไม่มีกำหนดส่ง
 *   แก้สคริปต์ภายหลัง: Deploy > Manage deployments > แก้ deployment เดิม > Version: New version
 *   (URL เดิมใช้ต่อได้ ถ้าสร้าง deployment ใหม่จะได้ URL ใหม่)
 *
 * ฉบับ 1.5.2 (26 พ.ย. 2569): แผ่นการส่งงานและแผ่นข้อมูลการส่งเขียนใหม่เฉพาะเมื่อผลตรวจเปลี่ยน (ประวัติเวอร์ชันไม่รก)
 *   เวลาตรวจล่าสุดเก็บใน Script Properties · แผ่นทีม: ติ๊ก V&V Profile (G) = ส่งแล้ว และใบงานครั้งที่ 1 (Q) เมื่อพบไฟล์ใน repo
 *   ไม่แตะช่องที่อาจารย์ใส่ค่าอื่นไว้ เช่น "ต้องแก้" และไม่ลบค่าที่ติ๊กแล้ว · ต้อง deploy ใหม่ (New version)
 * ฉบับ 1.5.1 (26 พ.ย. 2569): เมนู "ลิงก์แก้ไขคำตอบของทีม" สำหรับทีมที่ทำลิงก์แก้ไขหาย
 *   และช่องติ๊ก "รับลงทะเบียนทีมใหม่" ในแผ่นกำหนดการ (ค่าเริ่มต้น) หน้าลงทะเบียนเปิดหรือปิดตามช่องนี้
 *   ฟอร์มยังเปิดรับคำตอบไว้เสมอ เพราะถ้าปิดฟอร์ม ลิงก์แก้ไขคำตอบจะใช้ไม่ได้
 *   ต้อง deploy ใหม่: Deploy > Manage deployments > ไอคอนดินสอ > Version: New version (URL เดิม)
 * ฉบับ 1.5 (26 พ.ย. 2569): ตรวจการส่งงานใน repo ของทุกทีมผ่าน GitHub API ผลอยู่ในแผ่น "การส่งงาน"
 *   และหน้าเว็บ submissions.html (doGet?what=submissions) กติกาการตรวจอยู่ในแผ่นกำหนดการ คอลัมน์ M
 *   ตั้งครั้งเดียว: ENGSE601 > ตั้ง GitHub token แล้ว ENGSE601 > ตั้งตรวจการส่งงานอัตโนมัติทุกชั่วโมง
 *   ต้อง deploy ใหม่ (New version) และอนุญาตสิทธิ์เพิ่ม "เชื่อมต่อบริการภายนอก" ครั้งแรกที่สั่ง
 * ฉบับ 1.4 (25 พ.ย. 2569): คอลัมน์ K "ลิงก์เรียนออนไลน์" ของตารางคาบเรียน (รับเฉพาะ https) ส่งให้หน้าเว็บ
 *   ต้อง deploy ใหม่: Deploy > Manage deployments > ไอคอนดินสอ > Version: New version > Deploy (URL เดิมใช้ต่อได้)
 * ฉบับ 1.3.1 (25 พ.ย. 2569): เมนูตรวจข้อมูลหน้าเว็บไม่แสดง URL จาก ScriptApp.getService() เพราะไม่ใช่ URL ของ deployment
 *   (แก้เฉพาะข้อความเมนู วางทับแล้วบันทึกก็พอ ไม่ต้อง deploy ใหม่)
 * ฉบับ 1.3 (25 พ.ย. 2569): แผ่นกำหนดการ เว็บแอปกำหนดการ และวันส่ง CP ในไฟล์สถานะทีมตามแผ่นกำหนดการ
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
var PROP = { items: 'engse601.itemIds', maxTeam: 'engse601.maxTeam', folder: 'engse601.statusFolder', book: 'engse601.bookId' };
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
var SITE_URL = 'https://se-rmutl.github.io/engse601/';

// แผ่นกำหนดการ: หาตารางจากข้อความหัวตารางในคอลัมน์ A จึงแทรกแถวคาบเรียนหรืองานเพิ่มได้
var SCHED = { sheet: 'กำหนดการ', settings: 'ค่าเริ่มต้น', sessions: 'คาบเรียน', items: 'สิ่งที่ต้องส่ง',
  scanRows: 300, width: 13, cacheKey: 'engse601.schedule.v1', cacheSec: 300 };
var SCHED_SETTINGS = [['วันเรียน', 'day'], ['เวลาเริ่ม', 'start'], ['เวลาเลิก', 'end'], ['ห้อง', 'room'],
  ['เวลาส่งจุดตรวจ', 'cpTime'], ['ลิงก์แบบประเมินเพื่อน', 'peerUrl'], ['รับลงทะเบียนทีมใหม่', 'regOpen']];
// คอลัมน์ A, B, C, ... ของตารางคาบเรียน และตารางสิ่งที่ต้องส่ง
var SESS_COLS = ['id', 'label', 'week', 'date', 'start', 'end', 'room', 'status', 'topic', 'note', 'link'];
var ITEM_COLS = ['id', 'title', 'scope', 'kind', 'session', 'override', 'due', 'weight', 'where', 'link', 'note', 'show', 'check'];

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
    .addItem('ตรวจข้อมูลหน้าเว็บกำหนดการ', 'previewSchedule')
    .addItem('ตรวจการส่งงานใน repo ตอนนี้', 'checkSubmissions')
    .addSeparator()
    .addItem('สร้างแบบลงทะเบียนทีม', 'createTeamForm')
    .addItem('เพิ่มคำถามอีเมลสมาชิกในฟอร์มเดิม', 'addEmailQuestion')
    .addItem('ปรับรายชื่อในฟอร์มตามแผ่นคะแนน', 'updateFormRoster')
    .addItem('ลิงก์แก้ไขคำตอบของทีม', 'teamEditLink')
    .addSeparator()
    .addItem('ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม', 'installSubmitTrigger')
    .addItem('ยกเลิกซิงก์อัตโนมัติ', 'removeSubmitTrigger')
    .addItem('ตั้งเผยแพร่สถานะทีมอัตโนมัติทุกคืน', 'installNightlyPublish')
    .addItem('ยกเลิกเผยแพร่อัตโนมัติ', 'removeNightlyPublish')
    .addItem('ตั้งตรวจการส่งงานอัตโนมัติทุกชั่วโมง', 'installSubmissionTrigger')
    .addItem('ยกเลิกตรวจการส่งงานอัตโนมัติ', 'removeSubmissionTrigger')
    .addSeparator()
    .addItem('ตั้ง GitHub token', 'setGithubToken')
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
  var sched = scheduleCps_(readSchedule_(ss), cps, tz);
  var first = sum.getRange(PUB.firstClass).getValue();
  first = isDate_(first) ? dayOnly_(first) : null;
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
    (sched ? (sched.pending.length ? ' · ' + sched.pending.join(', ') + ' ยังไม่มีกำหนดส่งในแผ่นกำหนดการ' : '') :
      first ? '' : ' · ยังไม่ได้กรอกวันที่เรียนครั้งที่ 1 จึงไม่แสดงวันกำหนดส่ง'));
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
    // วันส่งจากแผ่นกำหนดการ (cp.due เป็น null ได้ถ้ายังรอกำหนด) ถ้าไม่มีแผ่นนั้น คิดจากวันเรียนครั้งที่ 1 + สัปดาห์
    var due = cp.due !== undefined ? cp.due : first ? new Date(first.getTime() + (cp.week - 1) * 7 * 864e5) : null;
    var days = due ? Math.round((dayOnly_(due) - today) / 864e5) : null;
    var row = { cp: cp.id + ' ' + cp.title, due: cp.when || (due ? thaiDate_(due) + ' (สัปดาห์ ' + cp.week + ')' : 'สัปดาห์ ' + cp.week),
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
    if (!next && !cp.pub && (days === null || days >= 0)) next = cp.id + ' · ' + (cp.short || (due ? thaiDate_(due) : 'สัปดาห์ ' + cp.week));
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
  line('งานที่ต้องส่งทั้งภาคและกำหนดส่ง: ' + SITE_URL + 'deliverables.html', 9, false, '#597087');
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
var TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
function thaiDate_(d) { return d.getDate() + ' ' + TH_MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543); }
/** วันที่ภาษาไทยตามเขตเวลาของชีต เช่น อา. 13 ธ.ค. 2569 */
function thaiDateTz_(d, tz) {
  var p = Utilities.formatDate(d, tz, 'u d M yyyy').split(' ').map(Number);
  return TH_DAYS[p[0] % 7] + ' ' + p[1] + ' ' + TH_MONTHS[p[2] - 1] + ' ' + (p[3] + 543);
}
function isDate_(x) { return Object.prototype.toString.call(x) === '[object Date]' && !isNaN(x); }
function str_(x) { return x === null || x === undefined ? '' : String(x).trim(); }
function dayOnly_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function fmtNum_(n) { n = Number(n); return Math.round(n * 100) / 100 + ''; }

/* ------------------------------------------------------------------ schedule */

/** อ่านแผ่นกำหนดการ คืน null ถ้าไม่มีแผ่นนี้
 *  เวลา (เริ่ม เลิก เวลาส่ง) อ่านจากค่าที่แสดง เพราะค่าเวลาล้วนในชีตเป็นวันที่ปี 1899 ซึ่งเขตเวลาเก่าคลาดหลายนาที */
function readSchedule_(ss) {
  var sh = ss.getSheetByName(SCHED.sheet);
  if (!sh) return null;
  var n = Math.min(sh.getMaxRows(), SCHED.scanRows);
  var rng = sh.getRange(1, 1, n, SCHED.width), v = rng.getValues(), dv = rng.getDisplayValues();
  var find = function (label) { for (var i = 0; i < n; i++) if (str_(v[i][0]) === label) return i; return -1; };
  var iSet = find(SCHED.settings), iSess = find(SCHED.sessions), iItem = find(SCHED.items);
  if (iSess < 0 || iItem < 0 || iItem < iSess)
    throw new Error('แผ่น "' + SCHED.sheet + '" ต้องมีหัวตาราง "' + SCHED.sessions + '" แล้วตามด้วย "' + SCHED.items + '" ในคอลัมน์ A');
  var settings = {}, sessions = [], items = [], i;
  for (i = iSet + 1; iSet >= 0 && i < iSess; i++) {
    var label = str_(v[i][0]);
    SCHED_SETTINGS.forEach(function (s) { if (label && label.indexOf(s[0]) === 0) settings[s[1]] = { v: v[i][1], d: str_(dv[i][1]) }; });
  }
  var rowObj = function (cols, i) {
    var o = {};
    cols.forEach(function (k, j) { o[k] = v[i][j]; o['_' + k] = str_(dv[i][j]); });
    o.id = str_(v[i][0]);
    return o;
  };
  for (i = iSess + 2; i < iItem; i++) if (str_(v[i][0])) sessions.push(rowObj(SESS_COLS, i));
  for (i = iItem + 2; i < n; i++) if (str_(v[i][0])) items.push(rowObj(ITEM_COLS, i));
  return { tz: ss.getSpreadsheetTimeZone(), settings: settings, sessions: sessions, items: items };
}

/** ใส่วันส่ง CP1–CP5 จากแผ่นกำหนดการให้ cps (ใช้ในไฟล์สถานะทีม) คืน null ถ้าไม่มีแผ่นกำหนดการ */
function scheduleCps_(sc, cps, tz) {
  if (!sc) return null;
  var label = {}, pending = [];
  sc.sessions.forEach(function (s) { label[s.id] = str_(s.label); });
  cps.forEach(function (cp) {
    var it = sc.items.filter(function (x) { return x.id === cp.id; })[0];
    if (!it) return;
    cp.due = isDate_(it.due) ? it.due : null;
    if (!cp.due) { pending.push(cp.id); cp.when = 'รอกำหนดวัน'; cp.short = 'รอกำหนดวัน'; return; }
    cp.short = thaiDateTz_(cp.due, tz);
    cp.when = cp.short + ' ' + Utilities.formatDate(cp.due, tz, 'HH:mm') + ' น.' + (label[it.session] ? ' (หลัง' + label[it.session] + ')' : '');
  });
  return { pending: pending };
}

/** ข้อมูลที่หน้าเว็บได้รับ: ค่าเริ่มต้น คาบเรียน และงานที่ติ๊ก "แสดงบนเว็บ" เท่านั้น */
function scheduleJson_(sc, now) {
  var tz = sc.tz, off = Utilities.formatDate(now, tz, 'Z');
  off = off.slice(0, 3) + ':' + off.slice(3);
  var day = function (x) { return isDate_(x) ? Utilities.formatDate(x, tz, 'yyyy-MM-dd') : ''; };
  var iso = function (x) { return isDate_(x) ? Utilities.formatDate(x, tz, "yyyy-MM-dd'T'HH:mm:ss") + off : ''; };
  var hm = function (s) { var m = String(s || '').match(/^(\d{1,2}):(\d{2})/); return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : ''; };
  var set = function (k) { return sc.settings[k] || { v: '', d: '' }; };
  return {
    ok: true, version: 1, updated: iso(now), offset: off,
    settings: { day: set('day').d, start: hm(set('start').d), end: hm(set('end').d), room: set('room').d,
      cpTime: hm(set('cpTime').d), peerUrl: /^https:\/\//.test(set('peerUrl').d) ? set('peerUrl').d : '',
      regOpen: set('regOpen').v === true ? true : set('regOpen').v === false ? false : null },
    sessions: sc.sessions.map(function (r) {
      return { id: r.id, label: r._label, week: Number(r.week) || null, date: day(r.date), start: hm(r._start), end: hm(r._end),
        room: r._room, status: r._status, topic: r._topic, note: r._note, link: /^https:\/\/\S+$/.test(r._link) ? r._link : '' };
    }),
    items: sc.items.filter(function (r) { return r.show === true; }).map(function (r) {
      return { id: r.id, title: r._title, scope: r._scope, kind: r._kind, session: r._session, due: iso(r.due),
        weight: Number(r.weight) || null, where: r._where, link: r._link, note: r._note };
    })
  };
}

/** เว็บแอป: GET คืน JSON ของแผ่นกำหนดการ (ใส่ ?callback=ชื่อฟังก์ชัน เพื่อรับแบบ JSONP ได้) */
function doGet(e) {
  var p = (e && e.parameter) || {}, cache = null, body = null;
  if (p.what === 'submissions') return jsonOut_(submissionsGet_(p), p.callback);
  try { cache = CacheService.getScriptCache(); body = cache.get(SCHED.cacheKey); } catch (err) { cache = null; }
  if (!body) {
    var out;
    try {
      var sc = readSchedule_(scheduleBook_());
      out = sc ? scheduleJson_(sc, new Date()) : { ok: false, error: 'ไม่พบแผ่น ' + SCHED.sheet };
    } catch (err) { out = { ok: false, error: String(err && err.message || err) }; }
    body = JSON.stringify(out);
    if (out.ok && cache) { try { cache.put(SCHED.cacheKey, body, SCHED.cacheSec); } catch (err) { /* ข้อมูลใหญ่เกินแคช */ } }
  }
  return jsonOut_(body, p.callback);
}

/** ส่ง JSON หรือ JSONP (ชื่อ callback ต้องเป็นชื่อฟังก์ชันธรรมดา) */
function jsonOut_(body, callback) {
  var cb = String(callback || '');
  if (/^[A-Za-z_$][\w$.]{0,60}$/.test(cb))
    return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/** ชีตที่ผูกกับสคริปต์ (เว็บแอปของสคริปต์ที่ผูกกับชีตใช้ getActiveSpreadsheet ได้ ถ้าไม่ได้ ใช้รหัสที่บันทึกไว้) */
function scheduleBook_() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty(PROP.book);
  if (!id) throw new Error('ยังไม่ได้บันทึกรหัสชีต เปิดชีตแล้วสั่ง ENGSE601 > ตรวจข้อมูลหน้าเว็บกำหนดการ ครั้งหนึ่ง');
  return SpreadsheetApp.openById(id);
}

/** ทริกเกอร์อย่างง่าย: แก้แผ่นกำหนดการแล้วล้างแคช หน้าเว็บเห็นค่าใหม่ทันที */
function onEdit(e) {
  try {
    if (e && e.range && e.range.getSheet().getName() === SCHED.sheet) { var c = CacheService.getScriptCache(); c.remove(SCHED.cacheKey); c.remove(SUB.cacheKey); }
  } catch (err) { /* ไม่มีสิทธิ์ใช้แคช */ }
}

/** เมนู: สรุปสิ่งที่หน้าเว็บจะได้รับ บันทึกรหัสชีตให้เว็บแอป และล้างแคช */
function previewSchedule() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty(PROP.book, ss.getId());
  try { CacheService.getScriptCache().remove(SCHED.cacheKey); } catch (e) { /* ไม่มีแคช */ }
  var sc = readSchedule_(ss);
  if (!sc) { alert_('ไม่พบแผ่นกำหนดการ', 'สร้างแผ่นชื่อ "' + SCHED.sheet + '" ก่อน'); return; }
  var j = scheduleJson_(sc, new Date());
  var waiting = j.sessions.filter(function (s) { return !s.date && s.status !== 'งด'; }).map(function (s) { return s.id; });
  var pending = j.items.filter(function (x) { return !x.due && x.kind !== 'ทุกคาบ'; }).map(function (x) { return x.id; });
  var hidden = sc.items.length - j.items.length;
  alert_('ข้อมูลหน้าเว็บกำหนดการ', 'คาบเรียน ' + j.sessions.length + ' แถว · งานที่แสดงบนเว็บ ' + j.items.length + ' รายการ' +
    (hidden ? ' (ซ่อน ' + hidden + ')' : '') +
    (waiting.length ? '\nคาบที่ยังไม่มีวันที่: ' + waiting.join(', ') : '') +
    (pending.length ? '\nงานที่ยังไม่มีกำหนดส่ง: ' + pending.join(', ') : '') +
    '\n\nURL ของเว็บแอปดูที่ Deploy > Manage deployments (ลงท้าย /exec) แล้วใส่ใน schedule.url ของ engse601/data.js' +
    '\nล้างแคชแล้ว หน้าเว็บจะเห็นข้อมูลใหม่เมื่อเปิดหน้าอีกครั้ง');
}

/** เมนู: ลิงก์แก้ไขคำตอบล่าสุดของทีม สำหรับส่งให้ตัวแทนทีมที่ทำลิงก์หาย (ส่งทางแชตส่วนตัว ใครมีลิงก์ก็แก้คำตอบได้) */
function teamEditLink() {
  var ui = ui_();
  if (!ui) throw new Error('สั่งจากเมนูในชีต');
  var r = ui.prompt('ลิงก์แก้ไขคำตอบของทีม', 'พิมพ์รหัสทีม เช่น T04', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var t = r.getResponseText().trim().toUpperCase();
  if (/^T\d$/.test(t)) t = 'T0' + t.slice(1);
  var ss = SpreadsheetApp.getActiveSpreadsheet(), out = sheetOrStop_(ss, SHEET.sync);
  var rows = out.getRange(2, 1, SYNC_ROWS, 2).getValues().filter(function (x) { return str_(x[0]) === t; });
  if (!rows.length) { alert_('ไม่พบทีม ' + t, 'ดูรหัสทีมในแผ่นข้อมูลซิงก์ คอลัมน์ A'); return; }
  var keys = str_(rows[0][1]).split(',').map(function (k) { return k.trim(); }).filter(String);
  var form = openForm_(ss);
  if (!form || !keys.length) return;
  var resp = null;
  try { resp = form.getResponse(keys[keys.length - 1]); } catch (e) { resp = null; }
  if (!resp) { alert_('ไม่พบคำตอบของ ' + t, 'คำตอบอาจถูกลบจากฟอร์ม สั่ง ENGSE601 > ซิงก์ทีมตอนนี้ แล้วลองใหม่'); return; }
  var html = HtmlService.createHtmlOutput('<div style="font:14px sans-serif">' +
    '<p>ลิงก์แก้ไขคำตอบล่าสุดของ <b>' + t + '</b> ส่งให้ตัวแทนทีมทางแชตส่วนตัวเท่านั้น (ใครมีลิงก์นี้ก็แก้คำตอบของทีมได้)</p>' +
    '<textarea style="width:100%;height:90px" readonly onclick="this.select()">' + resp.getEditResponseUrl() + '</textarea>' +
    '<p style="color:#5d6878">แก้แล้วแผ่นข้อมูลซิงก์อัปเดตเอง (ถ้าตั้งซิงก์อัตโนมัติไว้) รหัสทีมเหมือนเดิมเมื่อเลือกสมาชิกชุดเดิม</p></div>')
    .setWidth(520).setHeight(250);
  ui.showModalDialog(html, 'ลิงก์แก้ไขคำตอบ ' + t);
}

/* ------------------------------------------------------------------ submissions (ฉบับ 1.5)
 * ตรวจการส่งงานจาก repo ของแต่ละทีมผ่าน GitHub API (อ่านอย่างเดียว ไม่แก้อะไรใน repo)
 * กติกาการตรวจอยู่ในแผ่นกำหนดการ คอลัมน์ M "ตรวจใน repo" ของตารางสิ่งที่ต้องส่ง คั่นหลายส่วนด้วย ;
 *   access                 อาจารย์เปิด repo ได้ (repo เป็น public)
 *   file:PATH~คำ1,คำ2      มีไฟล์ตาม path ({T} = รหัสทีม) คำหลัง ~ ใช้หาไฟล์ที่วางผิดที่เพื่อบอกทีม
 *   dir:PATH/              มีไฟล์อย่างน้อย 1 ไฟล์ในโฟลเดอร์
 *   tag:NAME               มี tag ชื่อนี้
 *   labels:a,b,c           มีป้าย issue ครบทุกชื่อ
 * ผลเก็บในแผ่นซ่อน "ข้อมูลการส่ง" (ทีมละแถว) แล้วเขียนแผ่น "การส่งงาน" ใหม่ทุกครั้ง
 * หน้าเว็บอ่านผลจาก doGet?what=submissions (มีแต่รหัสทีมและสถานะ ไม่มีชื่อ อีเมล หรือคะแนน)
 */
var SUB = { sheet: 'การส่งงาน', store: 'ข้อมูลการส่ง', tokenProp: 'engse601.githubToken',
  sigProp: 'engse601.submissions.sig', checkedProp: 'engse601.submissions.checked',
  cacheKey: 'engse601.submissions.v1', cacheSec: 300, recheckSec: 300, aheadDays: 14, maxBranches: 6,
  api: 'https://api.github.com' };

/** เมนู: ตรวจทุกทีมตอนนี้ */
function checkSubmissions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r = runSubmissionCheck_(ss, null);
  alert_('ตรวจการส่งงานแล้ว', r.summary + '\nดูผลในแผ่น "' + SUB.sheet + '"' + (r.warn ? '\n\n' + r.warn : ''));
}

/** ทริกเกอร์รายชั่วโมง (ไม่มีหน้าจอ) */
function checkSubmissionsAuto() {
  runSubmissionCheck_(scheduleBook_(), null);
}

/** ตรวจทีมที่ระบุ (null = ทุกทีม) บันทึกผล และเขียนแผ่นการส่งงานใหม่ */
function runSubmissionCheck_(ss, onlyTeams) {
  var now = new Date();
  var sc = readSchedule_(ss);
  if (!sc) throw new Error('ไม่พบแผ่น ' + SCHED.sheet);
  var items = subItems_(sc);
  var teams = subTeams_(ss).filter(function (t) { return !onlyTeams || onlyTeams.indexOf(t.id) >= 0; });
  var store = subStoreRead_(ss);
  var gh = ghClient_();
  var before = subStoreSig_(store);
  var res = subCheckTeams_(gh, teams, items, store, now);
  subCheckedSave_(teams, store, now);
  if (subStoreSig_(store) !== before) subStoreWrite_(ss, store);   // ไม่เขียนถ้าผลไม่เปลี่ยน ประวัติเวอร์ชันจะไม่รก
  subRender_(ss, sc, items, store, now, gh);
  var filled = subFillTeamSheet_(ss, items, store, now);
  try { CacheService.getScriptCache().remove(SUB.cacheKey); } catch (e) { /* ไม่มีแคช */ }
  var warn = gh.token ? '' : 'ยังไม่ได้ตั้ง GitHub token: GitHub จำกัดการเรียกเมื่อไม่มี token ผลอาจไม่ครบ (เมนู ENGSE601 > ตั้ง GitHub token)';
  if (gh.limited) warn = (warn ? warn + '\n' : '') + 'GitHub จำกัดการเรียกระหว่างตรวจ บางทีมยังไม่ได้ตรวจรอบนี้ ลองใหม่ภายหลัง';
  return { summary: 'ตรวจ ' + res.checked + ' ทีม · เรียก GitHub ' + gh.calls + ' ครั้ง' + (filled ? ' · ติ๊กส่งแล้วในแผ่นทีม ' + filled + ' ช่อง' : ''), warn: warn };
}

/** งานที่มีกติกาตรวจและมีกำหนดส่ง เรียงตามกำหนดส่ง */
function subItems_(sc) {
  return sc.items.filter(function (r) { return str_(r.check) && isDate_(r.due); }).map(function (r) {
    return { id: r.id, title: r._title, due: r.due, where: r._where, rules: parseRules_(str_(r.check)) };
  }).sort(function (a, b) { return a.due - b.due; });
}

function parseRules_(s) {
  return s.split(';').map(function (p) { return p.trim(); }).filter(String).map(function (p) {
    if (p === 'access') return { k: 'access' };
    var m = p.match(/^(file|dir|tag|labels):(.+)$/);
    if (!m) return { k: 'bad', v: p };
    var v = m[2].trim(), hints = [];
    var t = v.indexOf('~');
    if (t >= 0) { hints = v.slice(t + 1).split(',').map(function (h) { return h.trim().toLowerCase(); }).filter(String); v = v.slice(0, t).trim(); }
    if (m[1] === 'labels') return { k: 'labels', v: v.split(',').map(function (x) { return x.trim(); }).filter(String) };
    if (m[1] === 'dir' && !/\/$/.test(v)) v += '/';
    return { k: m[1], v: v, hints: hints };
  });
}

/** ทีมและ repo จากแผ่นทีม */
function subTeams_(ss) {
  var sh = sheetOrStop_(ss, 'ทีม');
  return sh.getRange(TEAM.firstRow, 1, TEAM.rows, TEAM.width).getValues().map(function (r) {
    var id = str_(r[TEAM.c.id - 1]), url = str_(r[TEAM.c.repo - 1]);
    var m = url.match(/github\.com[\/:]([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?:[\/#?].*)?$/);
    return { id: id, owner: m ? m[1] : '', repo: m ? m[2] : '' };
  }).filter(function (t) { return /^T\d+$/.test(t.id); });
}

/* ---------- GitHub client */

function ghClient_() {
  var token = PropertiesService.getScriptProperties().getProperty(SUB.tokenProp) || '';
  return { token: token, calls: 0, limited: false };
}

/** เรียกหลาย URL พร้อมกัน คืน [{code, json}] */
function ghFetchAll_(gh, paths) {
  if (!paths.length) return [];
  if (gh.limited) return paths.map(function () { return { code: 0, json: null }; });
  var headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (gh.token) headers.Authorization = 'Bearer ' + gh.token;
  var reqs = paths.map(function (p) { return { url: SUB.api + p, method: 'get', headers: headers, muteHttpExceptions: true }; });
  var out = [];
  for (var i = 0; i < reqs.length; i += 40) {
    var chunk = UrlFetchApp.fetchAll(reqs.slice(i, i + 40));
    gh.calls += chunk.length;
    chunk.forEach(function (resp) {
      var code = resp.getResponseCode(), json = null;
      try { json = JSON.parse(resp.getContentText()); } catch (e) { json = null; }
      if ((code === 403 || code === 429) && /rate limit/i.test(String(json && json.message))) { gh.limited = true; code = 0; }
      out.push({ code: code, json: json });
    });
  }
  return out;
}

function enc_(s) { return String(s).split('/').map(encodeURIComponent).join('/'); }

/* ---------- ตรวจ */

/** ตรวจทีมทั้งหมดในรายการ ทีละขั้นแบบขนานข้ามทีม แล้วเขียนผลลง store */
function subCheckTeams_(gh, teams, items, store, now) {
  var nowS = Math.floor(now.getTime() / 1000);
  var ctx = teams.map(function (t) {
    var old = store[t.id] || {};
    return { t: t, st: { checked: nowS, access: 'norepo', def: '', cells: {}, old: old.cells || {} } };
  });
  var live = ctx.filter(function (c) { return c.t.owner; });
  // 1) repo
  var r1 = ghFetchAll_(gh, live.map(function (c) { return '/repos/' + c.t.owner + '/' + c.t.repo; }));
  live.forEach(function (c, i) {
    var r = r1[i];
    if (r.code === 200 && r.json) { c.st.access = 'ok'; c.st.def = r.json.default_branch || ''; c.st.priv = !!r.json.private; }
    else if (r.code === 0) { c.st.access = 'skip'; c.failed = true; }
    else c.st.access = 'noaccess';
  });
  live = live.filter(function (c) { return c.st.access === 'ok'; });
  // 2) branches
  var r2 = ghFetchAll_(gh, live.map(function (c) { return '/repos/' + c.t.owner + '/' + c.t.repo + '/branches?per_page=100'; }));
  live.forEach(function (c, i) {
    if (r2[i].code === 0) c.failed = true;
    var list = (r2[i].code === 200 && Array.isArray(r2[i].json)) ? r2[i].json : [];
    list.sort(function (a, b) { return (a.name === c.st.def ? -1 : 0) - (b.name === c.st.def ? -1 : 0); });
    c.branches = list.slice(0, SUB.maxBranches).map(function (b) { return { name: b.name, sha: b.commit && b.commit.sha }; });
    if (!c.branches.length) c.st.access = 'empty';
  });
  live = live.filter(function (c) { return c.st.access === 'ok'; });
  // 3) tree ของแต่ละ branch (+ labels ถ้ามีกติกา labels)
  var needLabels = items.some(function (it) { return it.rules.some(function (r) { return r.k === 'labels'; }); });
  var q3 = [], map3 = [];
  live.forEach(function (c, ci) {
    c.trees = {};
    c.branches.forEach(function (b) { q3.push('/repos/' + c.t.owner + '/' + c.t.repo + '/git/trees/' + b.sha + '?recursive=1'); map3.push([ci, 'tree', b.name]); });
    if (needLabels) { q3.push('/repos/' + c.t.owner + '/' + c.t.repo + '/labels?per_page=100'); map3.push([ci, 'labels']); }
  });
  ghFetchAll_(gh, q3).forEach(function (r, k) {
    var c = live[map3[k][0]];
    if (r.code === 0) c.failed = true;
    if (map3[k][1] === 'tree') c.trees[map3[k][2]] = (r.code === 200 && r.json && r.json.tree) ? r.json.tree.filter(function (x) { return x.type === 'blob'; }).map(function (x) { return x.path; }) : [];
    else c.labels = (r.code === 200 && Array.isArray(r.json)) ? r.json.map(function (l) { return String(l.name).toLowerCase(); }) : [];
  });
  // 4) ประเมินแต่ละงาน หาวันที่ commit แรกเฉพาะที่ยังไม่เคยบันทึก
  var q4 = [], map4 = [];
  live.forEach(function (c, ci) {
    if (c.failed) return;
    items.forEach(function (it) {
      var cell = subEval_(c, it);
      c.st.cells[it.id] = cell;
      cell.parts.forEach(function (p, pi) {
        if (!p.found || p.kind === 'labels' || p.kind === 'access') return;
        var prev = c.st.old[it.id] && c.st.old[it.id].pf && c.st.old[it.id].pf[pi];
        if (p.kind !== 'tag' && prev && prev.p === p.key && prev.f) { p.f = prev.f; return; }
        var base = '/repos/' + c.t.owner + '/' + c.t.repo;
        if (p.kind === 'tag') q4.push(base + '/commits/' + enc_(p.ref));
        else q4.push(base + '/commits?sha=' + encodeURIComponent(p.branch) + '&path=' + encodeURIComponent(p.path.replace(/\/$/, '')) + '&per_page=100');
        map4.push(p); p.owner = c;
      });
    });
  });
  ghFetchAll_(gh, q4).forEach(function (r, k) {
    var p = map4[k], d = null;
    if (r.code === 0) { p.owner.failed = true; return; }
    if (p.kind === 'tag' && r.code !== 200) { p.found = false; p.f = 0; return; }
    if (r.code === 200 && r.json) {
      var cm = Array.isArray(r.json) ? r.json[r.json.length - 1] : r.json;   // รายการเรียงใหม่ไปเก่า ตัวท้ายคือครั้งแรก
      d = cm && cm.commit && (cm.commit.committer || cm.commit.author) && (cm.commit.committer || cm.commit.author).date;
    }
    p.f = d ? Math.floor(new Date(d).getTime() / 1000) : 0;
  });
  // 5) สรุปลง store
  ctx.forEach(function (c) {
    var out = { access: c.st.access, def: c.st.def, cells: {} };
    if (c.failed) { if (store[c.t.id]) store[c.t.id].stale = true; return; }
    Object.keys(c.st.cells).forEach(function (id) {
      var cell = c.st.cells[id];
      var all = cell.parts.every(function (p) { return p.found; });
      var main = cell.parts.every(function (p) { return p.found && !p.other; });
      var fs = cell.parts.map(function (p) { return p.f || 0; }).filter(Boolean);
      out.cells[id] = {
        ok: all ? (main ? 1 : 2) : 0,                       // 1 ครบใน branch หลัก · 2 มีแต่อยู่ branch อื่น · 0 ยังไม่ครบ
        f: all && fs.length ? Math.max.apply(null, fs) : 0,  // ครบเมื่อส่วนสุดท้ายเข้ามา
        miss: cell.parts.filter(function (p) { return !p.found; }).map(function (p) { return p.label; }),
        br: cell.parts.filter(function (p) { return p.other; }).map(function (p) { return p.branch; })[0] || '',
        hint: cell.hints.slice(0, 2),
        pf: cell.parts.map(function (p) { return { p: p.key, f: p.f || 0 }; })
      };
    });
    store[c.t.id] = out;
  });
  return { checked: ctx.length };
}

/** ประเมินงาน 1 ชิ้นของทีม 1 ทีม จาก tree ที่ดึงมาแล้ว */
function subEval_(c, it) {
  var tid = c.t.id, hints = [];
  var parts = it.rules.map(function (r) {
    if (r.k === 'access') return { kind: 'access', key: 'access', found: true, label: 'เปิด repo ได้' };
    if (r.k === 'labels') {
      var have = c.labels || [];
      var miss = r.v.filter(function (x) { return have.indexOf(x.toLowerCase()) < 0; });
      return { kind: 'labels', key: 'labels', found: !miss.length, label: 'ป้าย ' + miss.join(', ') };
    }
    if (r.k === 'tag') {
      var tg = r.v.replace(/\{T\}/g, tid);
      // ดูจาก tree ไม่ได้ ใช้การเรียก commits/{tag} ในขั้นถัดไป ถือว่าพบก่อน ถ้าไม่พบจะได้ f = 0 แล้วแก้เป็นไม่พบ
      return { kind: 'tag', key: 'tag:' + tg, ref: tg, found: true, label: 'tag ' + tg };
    }
    if (r.k === 'bad') return { kind: 'bad', key: 'bad', found: false, label: 'กติกาผิด: ' + r.v };
    var path = r.v.replace(/\{T\}/g, tid);
    var test = r.k === 'dir'
      ? function (f) { return f.indexOf(path) === 0; }
      : function (f) { return f === path || f.toLowerCase() === path.toLowerCase(); };
    var hitB = null;
    c.branches.forEach(function (b) { if (!hitB && (c.trees[b.name] || []).some(test)) hitB = b.name; });
    var p = { kind: r.k, key: r.k + ':' + path, path: path, label: path, found: !!hitB, branch: hitB || '', other: !!hitB && hitB !== c.st.def };
    if (!hitB && r.k === 'file') {
      var words = r.hints.length ? r.hints : [path.split('/').pop().replace(/^\d+-/, '').replace(/\.[^.]+$/, '').toLowerCase()]
        .filter(function (w) { return w.length >= 4 && ['readme', 'index', 'main'].indexOf(w) < 0; });
      var tree = c.trees[c.st.def] || [];
      tree.forEach(function (f) {
        var base = f.split('/').pop().toLowerCase(), ext = path.split('.').pop().toLowerCase();
        if (base.split('.').pop() !== ext) return;
        if (words.some(function (w) { return base.indexOf(w) >= 0; }) && hints.indexOf(f) < 0) hints.push(f);
      });
    }
    return p;
  });
  return { parts: parts, hints: hints };
}

/* ---------- store */

/** ลายเซ็นของผลตรวจ (ไม่รวมเวลาตรวจ) ใช้ตัดสินว่าต้องเขียนแผ่นใหม่ไหม */
function subStoreSig_(st) {
  return JSON.stringify(Object.keys(st).sort().map(function (k) { var o = st[k]; return [k, o.access, o.def, o.cells, !!o.stale]; }));
}

/** เวลาตรวจล่าสุดรายทีม เก็บใน Script Properties (ไม่เขียนลงชีตทุกชั่วโมง) */
function subCheckedRead_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(SUB.checkedProp) || '{}'); } catch (e) { return {}; }
}
function subCheckedSave_(teams, store, now) {
  var m = subCheckedRead_(), t = Math.floor(now.getTime() / 1000);
  teams.forEach(function (x) { if (store[x.id] && !store[x.id].stale) m[x.id] = t; });
  PropertiesService.getScriptProperties().setProperty(SUB.checkedProp, JSON.stringify(m));
}

/** แผ่นทีม: ติ๊กว่าส่งแล้วเมื่อพบไฟล์ใน branch หลัก ไม่แตะช่องที่อาจารย์ใส่ค่าอื่นไว้ (เช่น "ต้องแก้") และไม่ลบค่าที่ติ๊กแล้ว */
var SUB_TEAMCOLS = [
  { item: 'D02', col: function () { return TEAM.c.profile; }, empty: ['', 'ยังไม่ส่ง'], val: 'ส่งแล้ว' },
  { item: 'D03', col: function () { return TEAM.c.worksheet; }, empty: ['', false, 'FALSE'], val: true }
];
function subFillTeamSheet_(ss, items, store, now) {
  var sh = ss.getSheetByName('ทีม');
  if (!sh) return 0;
  var nowS = Math.floor(now.getTime() / 1000), n = 0;
  var byId = {}; items.forEach(function (it) { byId[it.id] = it; });
  var rows = sh.getRange(TEAM.firstRow, 1, TEAM.rows, TEAM.width).getValues();
  rows.forEach(function (r, i) {
    var t = str_(r[TEAM.c.id - 1]), st = store[t];
    if (!st) return;
    SUB_TEAMCOLS.forEach(function (m) {
      var it = byId[m.item];
      if (!it) return;
      var x = subState_(st, it, nowS), cur = r[m.col() - 1];
      if ((x.s === 'ok' || x.s === 'late') && m.empty.indexOf(cur) >= 0) { sh.getRange(TEAM.firstRow + i, m.col()).setValue(m.val); n++; }
    });
  });
  return n;
}

function subStoreSheet_(ss) {
  var sh = ss.getSheetByName(SUB.store);
  if (!sh) { sh = ss.insertSheet(SUB.store); sh.getRange(1, 1, 1, 2).setValues([['ทีม', 'ผลตรวจล่าสุด (JSON) สคริปต์เขียน อย่าแก้']]); sh.hideSheet(); }
  return sh;
}

function subStoreRead_(ss) {
  var sh = subStoreSheet_(ss), n = Math.max(sh.getLastRow() - 1, 0), st = {};
  if (!n) return st;
  sh.getRange(2, 1, n, 2).getValues().forEach(function (r) {
    var id = str_(r[0]);
    if (!id) return;
    try { st[id] = JSON.parse(r[1]); } catch (e) { /* ข้าม */ }
  });
  return st;
}

function subStoreWrite_(ss, st) {
  var sh = subStoreSheet_(ss);
  var ids = Object.keys(st).sort(function (a, b) { return teamNo_(a) - teamNo_(b); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
  if (ids.length) sh.getRange(2, 1, ids.length, 2).setValues(ids.map(function (id) { return [id, JSON.stringify(st[id])]; }));
}

/* ---------- สถานะสำหรับแสดงผล */

/** สถานะของช่อง: ok ตรงเวลา · late ส่งช้า · branch อยู่ branch อื่น · due ยังไม่ส่งแต่ยังไม่ถึงกำหนด · miss เลยกำหนดแล้วยังไม่ส่ง · na เปิด repo ไม่ได้ */
function subState_(team, it, nowS) {
  var dueS = Math.floor(it.due.getTime() / 1000);
  if (!team || team.access === 'noaccess' || team.access === 'norepo') return { s: 'na' };
  if (it.rules.every(function (r) { return r.k === 'access'; })) return { s: 'ok' };   // D01: repo เปิดได้ (รวม repo ที่ยังว่าง)
  var c = (team.cells || {})[it.id];
  if (!c || !c.ok) {
    var miss = c ? c.miss : [];
    return { s: nowS > dueS ? 'miss' : 'due', miss: miss, hint: c ? c.hint : [] };
  }
  if (c.ok === 2) return { s: 'branch', at: c.f, br: c.br };
  return { s: c.f && c.f > dueS ? 'late' : 'ok', at: c.f };
}

/** งานที่แสดง: กำหนดส่งไม่เกิน aheadDays วันข้างหน้า หรือมีทีมส่งแล้ว */
function subVisibleItems_(items, store, nowS) {
  return items.filter(function (it) {
    if (it.due.getTime() / 1000 <= nowS + SUB.aheadDays * 86400) return true;
    return Object.keys(store).some(function (t) { var c = (store[t].cells || {})[it.id]; return c && c.ok; });
  });
}

var SUB_MARK = { ok: '✓', late: '✓ ช้า', branch: '⚠ branch', due: '–', miss: '✗', na: '?' };

function subFmt_(s, tz) { return s ? Utilities.formatDate(new Date(s * 1000), tz, 'd/M HH:mm') : ''; }

/** เขียนแผ่นการส่งงานใหม่ทั้งแผ่น */
function subRender_(ss, sc, items, store, now, gh) {
  var tz = sc.tz, nowS = Math.floor(now.getTime() / 1000);
  var vis = subVisibleItems_(items, store, nowS);
  var teams = subTeams_(ss);
  var sh = ss.getSheetByName(SUB.sheet) || ss.insertSheet(SUB.sheet);
  var W = 2 + vis.length + 3;
  var head = ['ทีม', 'repo'].concat(vis.map(function (it) {
    return it.id + '\n' + it.title + '\nส่ง ' + Utilities.formatDate(it.due, tz, 'd/M HH:mm');
  })).concat(['ยังขาด', 'ข้อสังเกต', 'ข้อความเตือน (คัดลอกไป LINE)']);
  var rows = [], tones = [];
  teams.forEach(function (t) {
    var st = store[t.id];
    var repo = !t.owner ? 'ไม่มีลิงก์ repo' : !st ? 'ยังไม่ได้ตรวจ' : st.access === 'ok' ? 'public · ' + st.def :
      st.access === 'empty' ? 'public · ยังว่าง' : 'เปิดไม่ได้ (private หรือลิงก์ผิด)';
    var lack = [], notes = [], row = [t.id, repo], tone = ['', st && st.access === 'ok' ? '' : st && st.access === 'empty' ? 'wa' : 'na'];
    vis.forEach(function (it) {
      var x = subState_(st, it, nowS), v = SUB_MARK[x.s];
      if (x.at) v += ' ' + subFmt_(x.at, tz);
      if (x.s === 'branch') { v = '⚠ ' + x.br + (x.at ? ' ' + subFmt_(x.at, tz) : ''); notes.push(it.id + ' อยู่ใน branch ' + x.br + ' ยังไม่ merge เข้า ' + st.def); }
      if (x.s === 'due' || x.s === 'miss') {
        if (it.due.getTime() / 1000 <= nowS + SUB.aheadDays * 86400) lack.push(it.id);
        if (x.miss && x.miss.length && x.miss.length < it.rules.length) notes.push(it.id + ' ยังขาด ' + x.miss.join(', '));
        if (x.hint && x.hint.length) notes.push(it.id + ' พบ ' + x.hint.join(', ') + ' ให้ย้ายหรือเปลี่ยนชื่อเป็น ' + (it.rules[0].v || '').replace(/\{T\}/g, t.id));
      }
      row.push(v);
      tone.push({ ok: 'ok', late: 'wa', branch: 'wa', due: '', miss: 'no', na: 'na' }[x.s]);
    });
    var msg = '';
    if (!st || st.access === 'noaccess' || st.access === 'norepo')
      msg = t.id + ': อาจารย์ยังเปิด repo ไม่ได้ ตรวจว่าเป็น public และลิงก์ในแบบลงทะเบียนถูกต้อง';
    else if (lack.length || notes.length)
      msg = t.id + (lack.length ? ': ยังขาด ' + lack.map(function (id) {
        var it = vis.filter(function (x) { return x.id === id; })[0];
        return id + ' (ส่ง ' + Utilities.formatDate(it.due, tz, 'd/M HH:mm') + ')';
      }).join(', ') : ':') + (notes.length ? ' · ' + notes.join(' · ') : '') + ' · ดูสถานะที่ ' + SITE_URL + 'submissions.html';
    rows.push(row.concat([lack.join(' ') || (st && st.access === 'ok' ? 'ครบ' : ''), notes.join(' · '), msg]));
    tones.push(tone.concat(['', '', '']));
  });
  var sig = JSON.stringify([head, rows, tones, !!gh.token]), props = PropertiesService.getScriptProperties();
  if (props.getProperty(SUB.sigProp) === sig && sh.getRange(4, 1).getValue() === 'ทีม') return;   // ผลเหมือนเดิม ไม่เขียนแผ่น
  props.setProperty(SUB.sigProp, sig.length > 8000 ? Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, sig, Utilities.Charset.UTF_8)) : sig);
  sh.clear();
  sh.setConditionalFormatRules([]);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
  if (sh.getMaxColumns() < W) sh.insertColumnsAfter(sh.getMaxColumns(), W - sh.getMaxColumns());
  var stamp = Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm');
  sh.getRange(1, 1).setValue('การส่งงานใน repo ของแต่ละทีม').setFontWeight('bold').setFontSize(14);
  sh.getRange(2, 1).setValue('ผลเปลี่ยนล่าสุด ' + stamp + ' น. (ระบบตรวจทุกชั่วโมง แผ่นนี้เขียนใหม่เฉพาะเมื่อผลเปลี่ยน · เวลาตรวจล่าสุดดูที่หน้าสถานะการส่ง) · ✓ มีไฟล์ตาม path (เวลา commit) · ✓ ช้า ส่งหลังกำหนด · ⚠ อยู่ใน branch อื่น · – ยังไม่ส่ง ยังไม่ถึงกำหนด · ✗ เลยกำหนดแล้วยังไม่ส่ง · ? เปิด repo ไม่ได้' +
    (gh.token ? '' : ' · ยังไม่ได้ตั้ง GitHub token') + ' · กติกาการตรวจอยู่ในแผ่นกำหนดการ คอลัมน์ M · แผ่นนี้สคริปต์เขียนใหม่ทุกครั้ง อย่าพิมพ์ในแผ่นนี้')
    .setFontSize(9).setFontColor('#5d6878');
  if (!rows.length) return;
  sh.getRange(4, 1, 1, W).setValues([head]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#13294b')
    .setWrap(true).setVerticalAlignment('middle');
  var body = sh.getRange(5, 1, rows.length, W);
  body.setValues(rows).setVerticalAlignment('top').setWrap(true).setFontSize(10);
  var bg = tones.map(function (r) { return r.map(function (k) { return k ? TONE[k][0] : null; }); });
  var fg = tones.map(function (r) { return r.map(function (k) { return k ? TONE[k][1] : '#1a2330'; }); });
  body.setBackgrounds(bg).setFontColors(fg);
  sh.getRange(5, 3, rows.length, vis.length || 1).setHorizontalAlignment('center');
  sh.setFrozenRows(4); sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 56); sh.setColumnWidth(2, 140);
  for (var k = 0; k < vis.length; k++) sh.setColumnWidth(3 + k, 104);
  sh.setColumnWidth(3 + vis.length, 90); sh.setColumnWidth(4 + vis.length, 280); sh.setColumnWidth(5 + vis.length, 380);
  sh.setRowHeight(4, 66);
}

/* ---------- เว็บแอป */

/** JSON สำหรับหน้าเว็บ: รหัสทีม สถานะ และคำแนะนำ ไม่มีชื่อ อีเมล ลิงก์ repo หรือคะแนน */
function submissionsJson_(ss, now) {
  var sc = readSchedule_(ss), tz = sc.tz, nowS = Math.floor(now.getTime() / 1000);
  var off = Utilities.formatDate(now, tz, 'Z'); off = off.slice(0, 3) + ':' + off.slice(3);
  var iso = function (d) { return Utilities.formatDate(d, tz, "yyyy-MM-dd'T'HH:mm:ss") + off; };
  var items = subItems_(sc), store = subStoreRead_(ss);
  var last = 0, chk = subCheckedRead_();
  var teams = subTeams_(ss).map(function (t) {
    var st = store[t.id], ck = chk[t.id] || (st && st.checked) || 0;
    if (ck > last) last = ck;
    var cells = {};
    items.forEach(function (it) {
      var x = subState_(st, it, nowS), o = { s: x.s };
      if (x.at) o.at = iso(new Date(x.at * 1000));
      if (x.br) o.br = x.br;
      if (x.miss && x.miss.length && x.miss.length < it.rules.length) o.miss = x.miss;
      if (x.hint && x.hint.length) o.hint = x.hint;
      cells[it.id] = o;
    });
    return { id: t.id, access: st ? st.access : 'unchecked', def: st && st.access === 'ok' ? st.def : '',
      checked: ck ? iso(new Date(ck * 1000)) : '', cells: cells };
  });
  return {
    ok: true, version: 1, now: iso(now), checked: last ? iso(new Date(last * 1000)) : '', recheckSec: SUB.recheckSec,
    aheadDays: SUB.aheadDays, site: SITE_URL,
    items: items.map(function (it) {
      return { id: it.id, title: it.title, due: iso(it.due), where: it.where,
        paths: it.rules.filter(function (r) { return r.k === 'file' || r.k === 'dir' || r.k === 'tag'; }).map(function (r) { return (r.k === 'tag' ? 'tag ' : '') + r.v; }),
        labels: (it.rules.filter(function (r) { return r.k === 'labels'; })[0] || {}).v || [] };
    }),
    teams: teams
  };
}

/** doGet?what=submissions[&recheck=T04] */
function submissionsGet_(p) {
  var ss = scheduleBook_(), cache = null, info = null;
  try { cache = CacheService.getScriptCache(); } catch (e) { cache = null; }
  var team = String(p.recheck || '').toUpperCase();
  if (/^T\d{1,2}$/.test(team)) {
    var key = 'engse601.recheck.' + team, waitTo = cache ? Number(cache.get(key) || 0) : 0, nowMs = Date.now();
    if (waitTo > nowMs) info = { team: team, done: false, wait: Math.ceil((waitTo - nowMs) / 1000) };
    else {
      var lock = LockService.getScriptLock();
      if (lock.tryLock(20000)) {
        try {
          if (cache) cache.put(key, String(nowMs + SUB.recheckSec * 1000), SUB.recheckSec);
          runSubmissionCheck_(ss, [team]);
          info = { team: team, done: true };
        } catch (err) { info = { team: team, done: false, error: String(err && err.message || err) }; }
        finally { lock.releaseLock(); }
      } else info = { team: team, done: false, wait: 30 };
    }
  }
  var body = cache && !info ? cache.get(SUB.cacheKey) : null, out;
  if (!body) {
    try { out = submissionsJson_(ss, new Date()); } catch (err) { out = { ok: false, error: String(err && err.message || err) }; }
    body = JSON.stringify(out);
    if (out.ok && cache) { try { cache.put(SUB.cacheKey, body, SUB.cacheSec); } catch (err) { /* ใหญ่เกินแคช */ } }
  }
  if (info) { out = JSON.parse(body); out.recheck = info; body = JSON.stringify(out); }
  return body;
}

/* ---------- ตั้งค่า */

function setGithubToken() {
  var ui = ui_();
  if (!ui) throw new Error('สั่งจากเมนูในชีต');
  var r = ui.prompt('ตั้ง GitHub token',
    'วาง fine-grained token ที่เลือก Repository access: Public repositories (read-only)\n' +
    'token เก็บใน Script Properties ของสคริปต์นี้ ไม่อยู่ในชีต · เว้นว่างแล้วกด OK เพื่อลบ token', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var t = r.getResponseText().trim(), props = PropertiesService.getScriptProperties();
  if (!t) { props.deleteProperty(SUB.tokenProp); alert_('ลบ token แล้ว', 'การตรวจจะเรียก GitHub แบบไม่มี token'); return; }
  if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) { alert_('รูปแบบ token ไม่ถูก', 'token ของ GitHub ขึ้นต้นด้วย github_pat_ หรือ ghp_'); return; }
  props.setProperty(SUB.tokenProp, t);
  var gh = ghClient_(), r1 = ghFetchAll_(gh, ['/rate_limit'])[0];
  var lim = r1.json && r1.json.resources && r1.json.resources.core;
  alert_(r1.code === 200 ? 'บันทึก token แล้ว' : 'บันทึกแล้ว แต่ GitHub ตอบ ' + r1.code,
    r1.code === 200 ? 'เรียกได้ ' + (lim ? lim.limit : '?') + ' ครั้งต่อชั่วโมง · ต่อไปสั่ง ENGSE601 > ตรวจการส่งงานใน repo ตอนนี้' :
      'ตรวจว่าคัดลอก token ครบ และยังไม่หมดอายุ');
}

function installSubmissionTrigger() {
  removeSubmissionTrigger();
  ScriptApp.newTrigger('checkSubmissionsAuto').timeBased().everyHours(1).create();
  checkSubmissions();
  alert_('ตั้งตรวจอัตโนมัติแล้ว', 'ตรวจการส่งงานทุกชั่วโมง แผ่นการส่งงานและหน้าเว็บสถานะการส่งอัปเดตเอง');
}

function removeSubmissionTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkSubmissionsAuto') ScriptApp.deleteTrigger(t);
  });
}

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
