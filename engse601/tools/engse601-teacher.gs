/**
 * ENGSE601 · สคริปต์สำหรับ Google Sheet ของอาจารย์ (บันทึกการเรียนและผลประเมิน)
 *
 * ทำ 2 อย่าง:
 *   1. สร้าง "แบบลงทะเบียนทีมโครงงาน" เป็น Google Form
 *      ช่องเลือกสมาชิกใช้รายชื่อจากแผ่น "คะแนน" คำตอบลงแผ่นใหม่ในชีตนี้ และเก็บลิงก์ไว้ที่แผ่น "ภาพรวม"
 *   2. ซิงก์คำตอบเป็นรายทีม (T01, T02, ...) ลงแผ่น "ข้อมูลซิงก์"
 *      แผ่นคะแนนและแผ่นทีมดึงรหัสทีม ชื่อโครงงาน ที่ปรึกษา และ repo ไปแสดงเอง
 *
 * ทีมของ ENGSE601 คือทีมโครงงาน ENGSE212 ทีมเดียวกัน ตัวแทนทีมกรอก 1 คนต่อทีม แก้คำตอบภายหลังได้
 *
 * ติดตั้งครั้งเดียว:
 *   1. เปิดชีตของอาจารย์ > ส่วนขยาย > Apps Script แล้ววางไฟล์นี้ทั้งไฟล์ บันทึก
 *   2. กลับมาที่ชีต รีเฟรช จะมีเมนู ENGSE601
 *   3. ENGSE601 > สร้างแบบลงทะเบียนทีม (ครั้งแรกจะขอสิทธิ์ Forms และ Sheets)
 *   4. นำ "ลิงก์แบบลงทะเบียนทีมสำหรับนักศึกษา" ในแผ่นภาพรวมไปใส่ register.formUrl ใน data.js
 *   5. ENGSE601 > ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม (หรือกดซิงก์เองเมื่อต้องการ)
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
var PROP = { items: 'engse601.itemIds', maxTeam: 'engse601.maxTeam' };
var ID_RE = /([0-9]{11}-[0-9])/;

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
var SYNC_COLS = ["team", "keys", "ts", "email", "note", "titleTh", "memberIds", "memberNames", "leader", "outside", "github", "titleEn", "advisor", "coadvisor", "summary", "type", "stack", "uat", "uatOrg", "pdpa", "impact", "repo", "access", "tracker", "ci", "tests", "docs", "srs", "progress", "milestones", "wish"];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ENGSE601')
    .addItem('ซิงก์ทีมตอนนี้', 'syncTeams')
    .addSeparator()
    .addItem('สร้างแบบลงทะเบียนทีม', 'createTeamForm')
    .addItem('ปรับรายชื่อในฟอร์มตามแผ่นคะแนน', 'updateFormRoster')
    .addItem('ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม', 'installSubmitTrigger')
    .addItem('ยกเลิกซิงก์อัตโนมัติ', 'removeSubmitTrigger')
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
    var item;
    if (f.type === 'page') {
      item = firstPage ? form.addSectionHeaderItem() : form.addPageBreakItem();
      firstPage = false;
      item.setTitle(f.title);
      if (f.help) item.setHelpText(f.help);
      return;
    }
    if (f.type === 'paragraph') item = form.addParagraphTextItem();
    else if (f.type === 'mc') item = form.addMultipleChoiceItem();
    else if (f.type === 'checkbox') item = form.addCheckboxItem();
    else item = form.addTextItem();
    item.setTitle(f.title).setRequired(!!f.required);
    if (f.help) item.setHelpText(f.help);
    if (f.choices) {
      var values = f.choices === 'ROSTER' ? rosterChoices_(roster) : f.choices;
      item.setChoiceValues(values);
      if (f.other) item.showOtherOption(true);
    }
    if (f.type === 'url') {
      item.setValidation(FormApp.createTextValidation().setHelpText('ใส่ลิงก์เต็ม ขึ้นต้นด้วย https://').requireTextIsUrl().build());
    }
    if (f.key === 'leader') {
      item.setValidation(FormApp.createTextValidation().setHelpText('รหัสนักศึกษา 11 หลัก ขีด และเลขท้าย เช่น 67543210003-9')
        .requireTextMatchesPattern('^[0-9]{11}-[0-9]$').build());
    }
    ids[f.key] = item.getId();
  });

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var props = PropertiesService.getDocumentProperties();
  props.setProperty(PROP.items, JSON.stringify(ids));
  sum.getRange(CELL.formEdit).setValue(form.getEditUrl());
  sum.getRange(CELL.formPublic).setValue(form.getPublishedUrl());
  alert_('สร้างแบบลงทะเบียนทีมแล้ว',
    'ลิงก์สำหรับนักศึกษาอยู่ที่แผ่น "ภาพรวม" ช่อง ' + CELL.formPublic + '\nนำไปใส่ register.formUrl ใน data.js แล้วตั้งซิงก์อัตโนมัติ');
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
        default: return r.v[key] === undefined ? '' : r.v[key];
      }
    });
  });

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

function sameMembers_(teams, members) {
  var sig = members.join(','), hit = null;
  Object.keys(teams).forEach(function (t) { if (teams[t].resp.members.join(',') === sig && sig) hit = t; });
  return hit;
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

function removeSubmitTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncTeams') ScriptApp.deleteTrigger(t);
  });
}
