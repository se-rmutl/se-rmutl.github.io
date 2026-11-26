/**
 * ENGSE207 · สคริปต์ของชีตผู้สอน (ใช้ไฟล์เดียวกันทุก SEC วางในชีตผู้สอนของแต่ละ SEC)
 * ปรับจาก engse601-teacher.gs · SEC อ่านจากแท็บ ตั้งค่า ช่อง B4
 *
 * ทำ 5 อย่าง:
 *   1. สร้าง "แบบลงทะเบียนทีม" ของ SEC นี้ (Google Form) ตัวเลือกสมาชิกมาจากแท็บ รายชื่อ
 *   2. ซิงก์คำตอบเป็นรายทีม รหัส S<SEC>-T01, S<SEC>-T02, ... ลงแท็บ ทีม (ชื่อทีม สมาชิก repo)
 *      และเติม GitHub เครื่องที่ใช้ ผล Docker และ Gmail ของแต่ละคนในแท็บ รายชื่อ
 *   3. เว็บแอปส่ง "กำหนดการและสิ่งที่ต้องส่ง" จากแท็บ กำหนดการ ให้หน้าเว็บรายวิชา (JSON ไม่มีรายชื่อหรือคะแนน)
 *   4. ตรวจว่าแต่ละทีมส่งงานตาม path ใน repo แล้วหรือยัง ผ่าน GitHub API (อ่านอย่างเดียว)
 *      งานเดี่ยวที่มี {ID} ใน path ตรวจไฟล์ของสมาชิกทุกคน หน้าเว็บเห็นรหัสนักศึกษาแบบปิดบางส่วน
 *   5. เผยแพร่ "ไฟล์สถานะทีม" ทีมละไฟล์ แชร์แบบดูอย่างเดียวให้ Gmail ของสมาชิกทีมนั้น
 *      คะแนนทีมแสดงเฉพาะงานที่ติ๊กเผยแพร่ในแท็บ ตั้งค่า (A38:B42) ไม่มีคะแนนรายคนหรือข้อมูลทีมอื่น
 *
 * ติดตั้งครั้งเดียวต่อ SEC (จากบัญชี software.rmutl@gmail.com):
 *   1. เปิดชีตผู้สอนของ SEC นั้น > ส่วนขยาย > Apps Script วางไฟล์นี้ทั้งไฟล์ บันทึก แล้วรีเฟรชชีต จะมีเมนู ENGSE207
 *   2. ENGSE207 > สร้างแบบลงทะเบียนทีม (ครั้งแรกขอสิทธิ์ Forms, Sheets, Drive)
 *      ลิงก์สำหรับนักศึกษาอยู่แท็บ ภาพรวม ช่อง B24 นำไปใส่ secs["<SEC>"].formUrl ใน engse207/data.js
 *      แก้ข้อความฟอร์มภายหลัง: วางสคริปต์ฉบับใหม่ แล้วสั่ง ENGSE207 > ปรับข้อความในฟอร์มตามสคริปต์ (ลิงก์และคำตอบเดิมอยู่ครบ)
 *   3. ENGSE207 > ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม (ซิงก์แล้วเผยแพร่ไฟล์สถานะทีมให้ทันที ทีมรู้รหัสจากชื่อไฟล์ที่แชร์เข้า Gmail)
 *      แนะนำ: เปิดฟอร์ม > Settings > Responses > Send responders a copy of their response: Always (อีเมลสำเนามีลิงก์แก้ไขคำตอบ)
 *   4. Deploy > New deployment > Web app · Execute as: Me · Who has access: Anyone
 *      คัดลอก URL ลงท้าย /exec ไปใส่ secs["<SEC>"].scheduleUrl ใน data.js (และวางไว้ที่ ภาพรวม B30 เพื่อจำ)
 *   5. ENGSE207 > ตั้ง GitHub token: personal access token (classic) ของ tkeatkaew scope repo หมดอายุหลังจบภาค
 *      (fine-grained token เปิด repo ของคนอื่นที่เราเป็น collaborator ไม่ได้) สคริปต์รับคำเชิญ collaborator ของ repo ชื่อ engse207-* ให้เองทุกชั่วโมง
 *      แล้ว ENGSE207 > ตั้งตรวจการส่งงานอัตโนมัติทุกชั่วโมง
 *   6. ENGSE207 > เผยแพร่สถานะทีมตอนนี้ (หรือตั้งเผยแพร่อัตโนมัติทุกคืน)
 *   แก้สคริปต์ภายหลัง: Deploy > Manage deployments > ไอคอนดินสอ > Version: New version (URL เดิมใช้ต่อได้)
 *
 * repo ทีมเป็น private: สคริปต์เรียก GitHub ด้วย token ของบัญชี tkeatkaew ซึ่งทีมเพิ่มเป็น collaborator (รับคำเชิญให้อัตโนมัติ)
 * รหัสทีมที่ออกแล้วไม่นำกลับมาใช้ซ้ำ คำตอบที่เลือกสมาชิกชุดเดียวกันถือเป็นทีมเดิม (ใช้คำตอบล่าสุด)
 * แท็บ ทีม มี 9 ช่อง (S?-T01 ถึง T09) ทีมละ 4 แถว ถ้าเกิน 9 ทีมให้เพิ่มแถวในแท็บ ทีม แล้วแก้ TEAM.blocks
 *
 * ฉบับ 1.1 (26 พ.ย. 2569): ชื่อทีมภาษาอังกฤษ ชื่อ repo ตามชื่อทีม ลิงก์ repo เป็นช่องบังคับ เมนูปรับข้อความในฟอร์มเดิม
 */

var COURSE = 'ENGSE207', TERM = '2/2569';
var SITE_URL = 'https://se-rmutl.github.io/engse207/';
var TEMPLATE_REPO = 'se-rmutl/engse207-team-template';
var TEACHER_GITHUB = 'tkeatkaew';
var FOLDER_EDITORS = ['tkeatkaew@gmail.com'];

var SH = { summary: 'ภาพรวม', roster: 'รายชื่อ', team: 'ทีม', attend: 'เช็คชื่อ', scoreTeam: 'คะแนนทีม', settings: 'ตั้งค่า',
  sched: 'กำหนดการ', sync: 'ข้อมูลซิงก์' };
// แท็บภาพรวม แถว 22–30: ป้ายในคอลัมน์ A ค่าในคอลัมน์ B
var SUMHEAD = 22;
var SUMCELL = { formEdit: 23, formPublic: 24, lastSync: 25, syncNote: 26, lastCheck: 27, lastPub: 28, pubNote: 29, webapp: 30 };
var SUM_LABELS = { 23: 'แบบลงทะเบียนทีม ลิงก์แก้ไข (ผู้สอน)', 24: 'แบบลงทะเบียนทีม ลิงก์สำหรับนักศึกษา', 25: 'ซิงก์ทีมล่าสุด', 26: 'ผลซิงก์',
  27: 'ตรวจการส่งงานใน repo ล่าสุด', 28: 'เผยแพร่ไฟล์สถานะทีมล่าสุด', 29: 'ผลเผยแพร่', 30: 'เว็บแอป (URL ลงท้าย /exec ผู้สอนวางเอง)' };
// แท็บรายชื่อ: B รหัส C ชื่อ D ทีม E อีเมลมหาวิทยาลัย F GitHub G เครื่อง H Docker I Gmail J หมายเหตุ
var ROSTER = { first: 5, last: 31, c: { id: 2, name: 3, team: 4, github: 6, machine: 7, docker: 8, gmail: 9, note: 10 } };
// แท็บทีม: ทีมละ 4 แถว เริ่มแถว 5 · A รหัส B ชื่อทีม D สมาชิก E รหัส K repo L ไฟล์สถานะ M ข้อความถึงทีม N เผยแพร่ล่าสุด
var TEAM = { first: 5, blocks: 9, size: 4, width: 14, c: { id: 1, name: 2, member: 4, sid: 5, repo: 11, file: 12, msg: 13, pub: 14 } };
// แท็บเช็คชื่อ: B รหัส S มา T สาย W บันทึกแล้ว X ร้อยละ
var ATTEND = { first: 5, last: 31, id: 2, came: 19, late: 20, rec: 23, pct: 24 };
var SETTING = { sec: 'B4', minAttend: 'B6', pubFirstRow: 38, pubRows: 5 };
// แท็บคะแนนทีม แถว 6–14 = ทีม 01–09 · คอลัมน์คะแนนของแต่ละงาน (เริ่มที่ 1) และคะแนนเต็ม
var SCORE_TEAM = { first: 6, rows: 9, items: [
  { id: 'A5a', cols: [4, 5], max: 5 }, { id: 'A5b', cols: [6, 7], max: 10 }, { id: 'A6', cols: [12], max: 10 },
  { id: 'A7', cols: [17], max: 10 }, { id: 'A8', cols: [20], max: 5 }] };

var PROP = { items: 'engse207.itemIds', maxTeam: 'engse207.maxTeam', folder: 'engse207.statusFolder', book: 'engse207.bookId' };
var ID_RE = /([0-9]{11}-[0-9])/;
var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
var SYNC_ROWS = 40;

// แท็บกำหนดการ: หาตารางจากข้อความหัวตารางในคอลัมน์ A
var SCHED = { sheet: 'กำหนดการ', settings: 'ค่าเริ่มต้น', sessions: 'คาบเรียน', items: 'สิ่งที่ต้องส่ง',
  scanRows: 300, width: 13, cacheKey: 'engse207.schedule.v1', cacheSec: 300 };
var SCHED_SETTINGS = [['วันเรียน', 'day'], ['เวลาเริ่ม', 'start'], ['เวลาเลิก', 'end'], ['ห้อง', 'room'],
  ['เวลาส่งจุดตรวจ', 'cpTime'], ['ลิงก์แบบประเมินเพื่อน', 'peerUrl'], ['รับลงทะเบียนทีมใหม่', 'regOpen']];
var SESS_COLS = ['id', 'label', 'week', 'date', 'start', 'end', 'room', 'status', 'topic', 'note', 'link'];
var ITEM_COLS = ['id', 'title', 'scope', 'kind', 'session', 'override', 'due', 'weight', 'where', 'link', 'note', 'show', 'check'];

// คำถามในฟอร์ม (หัวคอลัมน์แท็บข้อมูลซิงก์ใช้ชื่อเดียวกัน)
var FIELDS = [
  { key: 'p_team', type: 'page', title: 'ทีม', help: 'ตัวแทนทีมกรอกคนเดียว ทีมละ 3–4 คนจากกลุ่มเรียนเดียวกัน สร้าง repo ของทีมให้เสร็จก่อน (ขั้นที่ 3 ในหน้าลงทะเบียนทีม) ส่งแล้วแก้ได้จากลิงก์ "แก้ไขคำตอบ"' },
  { key: 'leader', type: 'text', title: 'รหัสนักศึกษาของผู้กรอก', required: true, help: 'เช่น 68543210000-0' },
  { key: 'members', type: 'checkbox', title: 'สมาชิกทีม', required: true, help: 'เลือกให้ครบทุกคน รวมตัวเองด้วย ทีมละ 3–4 คน', choices: 'ROSTER' },
  { key: 'teamName', type: 'text', title: 'ชื่อทีม (ภาษาอังกฤษ)', required: true,
    help: 'ชื่อเดียวกับที่ใช้ในชื่อ repo ตัวอักษรอังกฤษ ตัวเลข หรือขีด ไม่มีเว้นวรรค 2–30 ตัว เช่น cloudcats รหัสทีมระบบตั้งให้เอง' },
  { key: 'github', type: 'paragraph', title: 'GitHub username ของสมาชิกแต่ละคน', required: true,
    help: 'บรรทัดละคน: รหัสนักศึกษา · GitHub username เช่น 68543210000-0 · somchai-dev' },
  { key: 'emails', type: 'paragraph', title: 'Gmail ของสมาชิกแต่ละคน', required: true,
    help: 'บรรทัดละคน: รหัสนักศึกษา · Gmail เช่น 68543210000-0 · somchai.dev@gmail.com ใช้แชร์ไฟล์สถานะทีม อีเมล @rmutl.ac.th เปิดไฟล์ Google ไม่ได้' },
  { key: 'machines', type: 'paragraph', title: 'เครื่องของสมาชิกแต่ละคนและผล check-docker.sh จาก T01', required: true,
    help: 'บรรทัดละคน: รหัสนักศึกษา · Windows หรือ Mac ชิป M หรือ Mac Intel · ผ่าน หรือ ยังไม่ผ่าน เช่น 68543210000-0 · Windows · ผ่าน ' +
      'ถ้าไม่มีเครื่องส่วนตัว พิมพ์ ไม่มีเครื่อง' },
  { key: 'p_repo', type: 'page', title: 'Repository ของทีม', help: 'สร้างจาก ' + TEMPLATE_REPO + ' ชื่อ engse207-2569-s{SEC}-<ชื่อทีม> แบบ Private และเพิ่ม ' + TEACHER_GITHUB + ' เป็น collaborator ก่อนกรอกส่วนนี้' },
  { key: 'repo', type: 'url', title: 'ลิงก์ repo ของทีม', required: true,
    help: 'คัดลอกจากแถบที่อยู่ของเบราว์เซอร์ที่หน้าแรกของ repo เช่น https://github.com/somchai-dev/engse207-2569-s{SEC}-cloudcats' },
  { key: 'access', type: 'mc', title: 'เพิ่ม ' + TEACHER_GITHUB + ' เป็น collaborator ของ repo แล้วหรือยัง', required: true,
    help: 'GitHub > Settings > Collaborators > Add people > ' + TEACHER_GITHUB, choices: ['เพิ่มแล้ว', 'ยัง จะเพิ่มก่อนเริ่ม T02'] },
  { key: 'concern', type: 'paragraph', title: 'เรื่องที่อยากให้อาจารย์รู้ (ถ้ามี)', help: 'เช่น เครื่องของใครยังรัน Docker ไม่ได้ หรือยังขาดสมาชิก' }
];
var SYNC_COLS = ['team', 'keys', 'ts', 'email', 'note', 'teamName', 'memberIds', 'memberNames', 'leader', 'github', 'emails', 'machines', 'repo', 'access', 'concern'];
var SYNC_TITLES = ['รหัสทีม', 'คีย์คำตอบ', 'ส่งล่าสุด', 'อีเมลผู้กรอก', 'หมายเหตุจากการซิงก์', 'ชื่อทีม', 'รหัสสมาชิก', 'ชื่อสมาชิก', 'ผู้กรอก',
  'GitHub', 'Gmail', 'เครื่องและ Docker', 'repo', 'เพิ่มอาจารย์แล้วหรือยัง', 'เรื่องที่อยากให้อาจารย์รู้'];

function onOpen() {
  var sec = '';
  try { sec = secNo_(SpreadsheetApp.getActiveSpreadsheet()); } catch (e) { sec = '?'; }
  SpreadsheetApp.getUi().createMenu(COURSE + ' SEC' + sec)
    .addItem('ซิงก์ทีมตอนนี้', 'syncTeams')
    .addItem('ตรวจการส่งงานใน repo ตอนนี้', 'checkSubmissions')
    .addItem('เผยแพร่สถานะทีมตอนนี้', 'publishTeamStatus')
    .addItem('ตรวจข้อมูลหน้าเว็บกำหนดการ', 'previewSchedule')
    .addSeparator()
    .addItem('สร้างแบบลงทะเบียนทีม', 'createTeamForm')
    .addItem('ปรับข้อความในฟอร์มตามสคริปต์', 'updateFormText')
    .addItem('ปรับรายชื่อในฟอร์มตามแท็บรายชื่อ', 'updateFormRoster')
    .addItem('ลิงก์แก้ไขคำตอบของทีม', 'teamEditLink')
    .addSeparator()
    .addItem('ตั้งซิงก์อัตโนมัติเมื่อมีคนส่งฟอร์ม', 'installSubmitTrigger')
    .addItem('ยกเลิกซิงก์อัตโนมัติ', 'removeSubmitTrigger')
    .addItem('ตั้งตรวจการส่งงานอัตโนมัติทุกชั่วโมง', 'installSubmissionTrigger')
    .addItem('ยกเลิกตรวจการส่งงานอัตโนมัติ', 'removeSubmissionTrigger')
    .addItem('ตั้งเผยแพร่สถานะทีมอัตโนมัติทุกคืน', 'installNightlyPublish')
    .addItem('ยกเลิกเผยแพร่อัตโนมัติ', 'removeNightlyPublish')
    .addSeparator()
    .addItem('ตั้ง GitHub token', 'setGithubToken')
    .addToUi();
}

/* ------------------------------------------------------------------ ภาพรวม */

function secNo_(ss) {
  var v = str_(sheetOrStop_(ss, SH.settings).getRange(SETTING.sec).getValue());
  if (!/^[1-9]$/.test(v)) throw new Error('ใส่เลขกลุ่มเรียน (1, 2 หรือ 3) ที่แท็บ ตั้งค่า ช่อง ' + SETTING.sec);
  return v;
}
function teamCode_(sec, n) { return 'S' + sec + '-T' + ('0' + n).slice(-2); }
function teamNo_(t) { var m = String(t).match(/-T(\d+)$/); return m ? Number(m[1]) : 0; }

/** ช่องค่าในแท็บภาพรวม (คอลัมน์ B) ใส่ป้ายในคอลัมน์ A ให้ถ้ายังไม่มี */
function sumCell_(ss, key) {
  var sh = sheetOrStop_(ss, SH.summary), row = SUMCELL[key];
  if (sh.getMaxRows() < row) sh.insertRowsAfter(sh.getMaxRows(), row - sh.getMaxRows());
  var head = sh.getRange(SUMHEAD, 1);
  if (!str_(head.getValue())) head.setValue('ระบบอัตโนมัติ (สคริปต์เติม)').setFontWeight('bold');
  var lab = sh.getRange(row, 1);
  if (!str_(lab.getValue())) lab.setValue(SUM_LABELS[row]);
  return sh.getRange(row, 2);
}

/* ------------------------------------------------------------------ form */

function formDescription_(sec) {
  return [
    COURSE + ' สถาปัตยกรรมซอฟต์แวร์ กลุ่มเรียน SEC' + sec + ' · ตัวแทนทีมกรอกคนเดียว ใช้เวลาประมาณ 10 นาที',
    'ก่อนกรอก: ทุกคนตรวจเครื่องด้วย check-docker.sh แล้ว และตัวแทนทีมสร้าง repo จากแม่แบบเสร็จแล้ว (ต้องใช้ลิงก์ repo)',
    'ขั้นตอนทั้งหมด: ' + SITE_URL + 'register.html?sec=' + sec
  ].join('\n');
}
function formConfirmation_(sec) {
  return 'ลงทะเบียนทีมแล้ว · 1) คัดลอกลิงก์ "แก้ไขคำตอบ" ในหน้านี้ไปใส่ใน README ของ repo ทีม ใช้เมื่อต้องแก้ ไม่ต้องส่งใหม่ · ' +
    '2) ภายในไม่กี่นาที สมาชิกทุกคนจะได้อีเมลแชร์ไฟล์ "' + COURSE + ' ' + TERM + ' · สถานะทีม S' + sec + '-Txx" เลข Txx คือรหัสทีม ' +
    'ใส่รหัสทีมและลิงก์ไฟล์นั้นใน README ด้วย';
}
function secText_(s, sec) { return String(s || '').replace(/\{SEC\}/g, sec); }

function createTeamForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sec = secNo_(ss);
  sheetOrStop_(ss, SH.team);
  if (str_(sumCell_(ss, 'formEdit').getValue())) {
    var ui = ui_();
    if (!ui) { Logger.log('มีแบบลงทะเบียนทีมอยู่แล้ว'); return; }
    if (ui.alert('มีแบบลงทะเบียนทีมอยู่แล้ว', 'สร้างฟอร์มใหม่แทนลิงก์เดิมหรือไม่ (ฟอร์มเดิมยังอยู่ใน Drive แต่สคริปต์จะซิงก์จากฟอร์มใหม่เท่านั้น)\n' +
      'ถ้าแค่ต้องการแก้ข้อความ ใช้เมนู ปรับข้อความในฟอร์มตามสคริปต์ แทน', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  }
  var roster = readRoster_(ss);
  if (!roster.length) throw new Error('ไม่พบรายชื่อในแท็บ รายชื่อ คอลัมน์ B–C');
  var form = FormApp.create(COURSE + ' SEC' + sec + ' ลงทะเบียนทีม Term Project · ภาค ' + TERM);
  form.setDescription(formDescription_(sec));
  form.setCollectEmail(true);
  form.setAllowResponseEdits(true);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setConfirmationMessage(formConfirmation_(sec));
  var ids = {}, first = true;
  FIELDS.forEach(function (f) {
    if (f.type === 'page') {
      var head = first ? form.addSectionHeaderItem() : form.addPageBreakItem();
      first = false;
      head.setTitle(f.title);
      if (f.help) head.setHelpText(secText_(f.help, sec));
      return;
    }
    ids[f.key] = addItem_(form, f, roster, sec).getId();
  });
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  PropertiesService.getDocumentProperties().setProperty(PROP.items, JSON.stringify(ids));
  sumCell_(ss, 'formEdit').setValue(form.getEditUrl());
  sumCell_(ss, 'formPublic').setValue(form.getPublishedUrl());
  ensureSyncSheet_(ss);
  alert_('สร้างแบบลงทะเบียนทีมแล้ว', 'ลิงก์สำหรับนักศึกษาอยู่ที่แท็บ ภาพรวม ช่อง B24\nนำไปใส่ secs["' + sec + '"].formUrl ใน engse207/data.js แล้วตั้งซิงก์อัตโนมัติ\n' +
    'แท็บคำตอบของฟอร์มที่เพิ่มขึ้นมา ซ่อนได้ ห้ามลบ');
}

function addItem_(form, f, roster, sec) {
  var item;
  if (f.type === 'paragraph') item = form.addParagraphTextItem();
  else if (f.type === 'mc') item = form.addMultipleChoiceItem();
  else if (f.type === 'checkbox') item = form.addCheckboxItem();
  else item = form.addTextItem();
  configItem_(item, f, roster, sec);
  return item;
}

/** ตั้งชื่อ คำอธิบาย ช่องบังคับ ตัวเลือก และการตรวจค่า ของคำถามหนึ่งข้อ (ใช้ทั้งตอนสร้างและตอนปรับฟอร์มเดิม) */
function configItem_(item, f, roster, sec) {
  item.setTitle(f.title).setRequired(!!f.required);
  item.setHelpText(secText_(f.help, sec));
  if (f.choices) item.setChoiceValues(f.choices === 'ROSTER' ? rosterChoices_(roster) : f.choices);
  if (f.type === 'url') item.setValidation(FormApp.createTextValidation()
    .setHelpText('ใส่ลิงก์หน้าแรกของ repo ขึ้นต้นด้วย https://github.com/ เช่น https://github.com/somchai-dev/engse207-2569-s' + sec + '-cloudcats')
    .requireTextMatchesPattern('^https://github\\.com/[A-Za-z0-9-]+/[A-Za-z0-9._-]+/?$').build());
  if (f.key === 'teamName') item.setValidation(FormApp.createTextValidation()
    .setHelpText('ตัวอักษรอังกฤษ ตัวเลข หรือขีด ขึ้นต้นด้วยตัวอักษร ไม่มีเว้นวรรค 2–30 ตัว เช่น cloudcats')
    .requireTextMatchesPattern('^[A-Za-z][A-Za-z0-9-]{1,29}$').build());
  if (f.key === 'leader') item.setValidation(FormApp.createTextValidation().setHelpText('รหัสนักศึกษา 11 หลัก ขีด และเลขท้าย เช่น 68543210000-0')
    .requireTextMatchesPattern('^[0-9]{11}-[0-9]$').build());
  if (f.key === 'emails' || f.key === 'github' || f.key === 'machines') item.setValidation(FormApp.createParagraphTextValidation()
    .setHelpText('ใส่รหัสนักศึกษาของทุกคน บรรทัดละคน').requireTextContainsPattern('[0-9]{11}-[0-9]').build());
  return item;
}

/** ปรับฟอร์มเดิมให้ข้อความ ช่องบังคับ และการตรวจค่าตรงกับสคริปต์ฉบับนี้ ลิงก์ฟอร์มและคำตอบเดิมอยู่ครบ */
function updateFormText() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sec = secNo_(ss), form = openForm_(ss);
  if (!form) return;
  var roster = readRoster_(ss), map = itemKeyMap_(form), byKey = {}, done = [], miss = [];
  FIELDS.forEach(function (f) { byKey[f.key] = f; });
  var T = FormApp.ItemType, pages = FIELDS.filter(function (f) { return f.type === 'page'; }), pi = 0;
  form.getItems().forEach(function (it) {
    var t = it.getType();
    if (t === T.SECTION_HEADER || t === T.PAGE_BREAK) {
      var pg = pages[pi++];
      if (!pg) return;
      var h = t === T.SECTION_HEADER ? it.asSectionHeaderItem() : it.asPageBreakItem();
      h.setTitle(pg.title); h.setHelpText(secText_(pg.help, sec));
      return;
    }
    var f = byKey[map[it.getId()]];
    if (!f) return;
    var typed = t === T.PARAGRAPH_TEXT ? it.asParagraphTextItem() : t === T.MULTIPLE_CHOICE ? it.asMultipleChoiceItem() :
      t === T.CHECKBOX ? it.asCheckboxItem() : t === T.TEXT ? it.asTextItem() : null;
    if (!typed) return;
    configItem_(typed, f, roster, sec);
    done.push(f.key);
  });
  FIELDS.forEach(function (f) { if (f.type !== 'page' && done.indexOf(f.key) < 0) miss.push(f.title); });
  form.setDescription(formDescription_(sec));
  form.setConfirmationMessage(formConfirmation_(sec));
  alert_('ปรับฟอร์มแล้ว', 'ปรับ ' + done.length + ' คำถาม คำอธิบายฟอร์ม และข้อความหลังส่ง ลิงก์ฟอร์มเดิมใช้ต่อได้' +
    (miss.length ? '\nหาคำถามเหล่านี้ไม่พบ: ' + miss.join(', ') : ''));
}

/** ปรับตัวเลือกสมาชิกในฟอร์มให้ตรงกับแท็บรายชื่อ (เมื่อมีนักศึกษาเพิ่มหรือถอน) */
function updateFormRoster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), form = openForm_(ss);
  if (!form) return;
  var item = findItem_(form, 'members');
  if (!item) throw new Error('ไม่พบคำถามเลือกสมาชิกในฟอร์ม');
  var roster = readRoster_(ss);
  item.asCheckboxItem().setChoiceValues(rosterChoices_(roster));
  alert_('ปรับรายชื่อในฟอร์มแล้ว', 'ตัวเลือกสมาชิก ' + roster.length + ' คน');
}

/** ลิงก์แก้ไขคำตอบของทีม (ให้ทีมที่ทำลิงก์หาย) */
function teamEditLink() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), form = openForm_(ss), ui = ui_();
  if (!form || !ui) return;
  var r = ui.prompt('ลิงก์แก้ไขคำตอบของทีม', 'พิมพ์รหัสทีม เช่น ' + teamCode_(secNo_(ss), 3), ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var t = r.getResponseText().trim().toUpperCase();
  var keys = readSyncKeys_(ss)[t];
  if (!keys || !keys.length) { alert_('ไม่พบทีม ' + t, 'ซิงก์ทีมก่อน แล้วตรวจรหัสทีมในแท็บ ทีม'); return; }
  var resp = form.getResponse(keys[keys.length - 1]);
  alert_('ลิงก์แก้ไขคำตอบของ ' + t, resp.getEditResponseUrl() + '\n\nส่งลิงก์นี้ให้ตัวแทนทีมทางแชตส่วนตัวเท่านั้น');
}

/* ------------------------------------------------------------------ sync */

/** e มีค่าเมื่อเรียกจากทริกเกอร์ส่งฟอร์ม: ซิงก์แล้วเผยแพร่ไฟล์สถานะทีมต่อทันที
 *  เพื่อให้สมาชิกได้รับไฟล์ "สถานะทีม S?-Txx" ใน Gmail และรู้รหัสทีมภายในไม่กี่นาที */
function syncTeams(e) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(120000)) { Logger.log('ซิงก์อื่นกำลังทำงาน ข้ามรอบนี้'); return; }
  try {
    syncTeams_();
    if (e && (e.namedValues || e.values || e.response)) publishTeamStatus(true);
  } finally { lock.releaseLock(); }
}

function syncTeams_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sec = secNo_(ss);
  var form = openForm_(ss);
  if (!form) return;
  var out = ensureSyncSheet_(ss), tz = ss.getSpreadsheetTimeZone(), now = new Date();
  var props = PropertiesService.getDocumentProperties();
  var roster = readRoster_(ss), byId = {};
  roster.forEach(function (s) { byId[s.id] = s; });

  // รหัสทีมที่ออกแล้วจากการซิงก์ครั้งก่อน
  var keyToTeam = {}, maxTeam = Number(props.getProperty(PROP.maxTeam) || 0), old = readSyncKeys_(ss);
  Object.keys(old).forEach(function (t) { maxTeam = Math.max(maxTeam, teamNo_(t)); old[t].forEach(function (k) { keyToTeam[k] = t; }); });

  var resps = form.getResponses().map(function (r) { return parseResponse_(form, r); }).sort(function (a, b) { return a.ts - b.ts; });
  var teams = {};
  resps.forEach(function (r) {
    var t = keyToTeam[r.key] || sameMembers_(teams, r.members);
    if (!t) { maxTeam++; t = teamCode_(sec, maxTeam); }
    var tm = teams[t] || (teams[t] = { keys: [], notes: [], info: [] });
    if (tm.resp) tm.info = ['ส่งซ้ำ ' + (tm.keys.length + 1) + ' ครั้ง ใช้คำตอบล่าสุด'];
    tm.keys.push(r.key);
    tm.resp = r;
  });
  props.setProperty(PROP.maxTeam, String(maxTeam));

  var where = {};
  Object.keys(teams).forEach(function (t) {
    var tm = teams[t], r = tm.resp;
    r.members.forEach(function (id) { (where[id] = where[id] || []).push(t); });
    var unknown = r.members.filter(function (id) { return !byId[id]; });
    if (unknown.length) tm.notes.push('ไม่อยู่ในแท็บรายชื่อ: ' + unknown.join(', '));
    if (r.v.leader && r.members.indexOf(normId_(r.v.leader)) < 0) tm.notes.push('ผู้กรอก ' + r.v.leader + ' ไม่ได้เลือกตัวเองเป็นสมาชิก');
    if (r.members.length < 3 || r.members.length > 4) tm.notes.push('สมาชิก ' + r.members.length + ' คน (ปกติ 3–4 คน)');
    if (teamNo_(t) > TEAM.blocks) tm.notes.push('เกิน ' + teamCode_(sec, TEAM.blocks) + ' ต้องเพิ่มช่องในแท็บทีม');
    tm.mails = parseLines_(r.v.emails, 'email');
    tm.gh = parseLines_(r.v.github, 'github');
    tm.mach = parseLines_(r.v.machines, 'text');
    var noMail = r.members.filter(function (id) { return !tm.mails[id]; });
    if (noMail.length) tm.notes.push('ยังไม่มี Gmail ของ ' + noMail.join(', '));
    var notGmail = r.members.filter(function (id) { return tm.mails[id] && !/@gmail\.com$/i.test(tm.mails[id]); });
    if (notGmail.length) tm.notes.push('อีเมลไม่ใช่ Gmail ให้ทีมแก้คำตอบ: ' + notGmail.join(', '));
    var noGh = r.members.filter(function (id) { return !tm.gh[id]; });
    if (noGh.length) tm.notes.push('ยังไม่มี GitHub ของ ' + noGh.join(', '));
    if (!str_(r.v.repo)) tm.notes.push('ยังไม่มีลิงก์ repo');
    else if (!new RegExp('github\\.com/[^/]+/engse207-2569-s' + sec + '-', 'i').test(r.v.repo)) tm.notes.push('ชื่อ repo ไม่ตรงรูปแบบ engse207-2569-s' + sec + '-<ชื่อทีม> (ใช้ต่อได้ ระบบตรวจจากลิงก์)');
  });
  Object.keys(where).forEach(function (id) {
    if (where[id].length < 2) return;
    where[id].forEach(function (t) { teams[t].notes.push(id + ' อยู่หลายทีม (' + where[id].join(', ') + ') ลบคำตอบที่ผิดในฟอร์ม'); });
  });

  // แท็บข้อมูลซิงก์
  var codes = Object.keys(teams).sort(function (a, b) { return teamNo_(a) - teamNo_(b); });
  var rows = codes.map(function (t) {
    var tm = teams[t], r = tm.resp;
    return SYNC_COLS.map(function (k) {
      switch (k) {
        case 'team': return t;
        case 'keys': return tm.keys.join(',');
        case 'ts': return Utilities.formatDate(r.ts, tz, 'd/M/yyyy HH:mm');
        case 'email': return r.email;
        case 'note': return tm.notes.concat(tm.info).join(' · ');
        case 'memberIds': return r.members.join(', ');
        case 'memberNames': return r.members.map(function (id) { return byId[id] ? byId[id].name : id; }).join(', ');
        default: return r.v[k] === undefined ? '' : r.v[k];
      }
    });
  });
  if (rows.length > SYNC_ROWS) throw new Error('ทีมมากกว่า ' + SYNC_ROWS + ' ทีม');
  out.getRange(2, 1, SYNC_ROWS, SYNC_COLS.length).clearContent();
  if (rows.length) out.getRange(2, 1, rows.length, SYNC_COLS.length).setNumberFormat('@').setValues(rows);

  // แท็บทีม: ชื่อทีม สมาชิก repo ของทีมที่ลงทะเบียน (ช่องที่ไม่เคยซิงก์ไม่แตะ ผู้สอนกรอกเองได้)
  // ทีมที่เคยซิงก์แต่ไม่มีคำตอบในฟอร์มแล้ว (ผู้สอนลบคำตอบ) ล้างชื่อทีม สมาชิก และ repo ให้ บทบาทและข้อความถึงทีมคงไว้
  var tsh = sheetOrStop_(ss, SH.team), gone = Object.keys(old).filter(function (t) { return !teams[t]; });
  gone.forEach(function (t) {
    var n = teamNo_(t);
    if (n < 1 || n > TEAM.blocks) return;
    var r0 = TEAM.first + (n - 1) * TEAM.size;
    tsh.getRange(r0, TEAM.c.name).setValue('');
    tsh.getRange(r0, TEAM.c.member, TEAM.size, 1).setValues([[''], [''], [''], ['']].slice(0, TEAM.size));
    tsh.getRange(r0, TEAM.c.repo).setValue('');
  });
  codes.forEach(function (t) {
    var n = teamNo_(t);
    if (n < 1 || n > TEAM.blocks) return;
    var tm = teams[t], r0 = TEAM.first + (n - 1) * TEAM.size;
    var names = tm.resp.members.filter(function (id) { return byId[id]; }).map(function (id) { return byId[id].name; }).slice(0, TEAM.size);
    while (names.length < TEAM.size) names.push('');
    tsh.getRange(r0, TEAM.c.name).setValue(str_(tm.resp.v.teamName));
    tsh.getRange(r0, TEAM.c.member, TEAM.size, 1).setValues(names.map(function (x) { return [x]; }));
    tsh.getRange(r0, TEAM.c.repo).setValue(str_(tm.resp.v.repo));
  });

  // แท็บรายชื่อ: GitHub เครื่อง Docker Gmail ของแต่ละคน
  var rsh = sheetOrStop_(ss, SH.roster), n = ROSTER.last - ROSTER.first + 1;
  var rv = rsh.getRange(ROSTER.first, 1, n, ROSTER.c.gmail).getValues();
  var upd = rv.map(function (row) {
    var id = normId_(row[ROSTER.c.id - 1]), t = id && where[id] ? teams[where[id][0]] : null;
    var cur = [row[ROSTER.c.github - 1], row[ROSTER.c.machine - 1], row[ROSTER.c.docker - 1], row[ROSTER.c.gmail - 1]];
    if (!t) return cur;
    var m = t.mach[id] || '';
    return [t.gh[id] || cur[0], osOf_(m) || cur[1], dockerOf_(m) || cur[2], t.mails[id] || cur[3]];
  });
  rsh.getRange(ROSTER.first, ROSTER.c.github, n, 4).setValues(upd);

  var placed = roster.filter(function (s) { return where[s.id]; }).length;
  var problems = codes.filter(function (t) { return teams[t].notes.length; }).length;
  sumCell_(ss, 'lastSync').setValue(Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
  sumCell_(ss, 'syncNote').setValue('ทีม ' + codes.length + ' · มีทีม ' + placed + '/' + roster.length + ' คน' +
    (problems ? ' · ต้องตรวจ ' + problems + ' ทีม (ดูหมายเหตุในแท็บ ' + SH.sync + ')' : '') +
    (gone.length ? ' · ล้างช่อง ' + gone.join(', ') + ' เพราะไม่มีคำตอบในฟอร์มแล้ว' : ''));
}

function ensureSyncSheet_(ss) {
  var sh = ss.getSheetByName(SH.sync);
  if (!sh) {
    sh = ss.insertSheet(SH.sync);
    sh.getRange(1, 1, 1, SYNC_COLS.length).setValues([SYNC_TITLES]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

/** { รหัสทีม: [คีย์คำตอบ] } จากแท็บข้อมูลซิงก์ */
function readSyncKeys_(ss) {
  var sh = ensureSyncSheet_(ss), out = {};
  sh.getRange(2, 1, SYNC_ROWS, 2).getValues().forEach(function (r) {
    var t = str_(r[0]);
    if (t) out[t] = String(r[1]).split(',').map(function (k) { return k.trim(); }).filter(String);
  });
  return out;
}

function parseResponse_(form, r) {
  var keyOf = itemKeyMap_(form), v = {}, members = [];
  r.getItemResponses().forEach(function (ir) {
    var k = keyOf[ir.getItem().getId()];
    if (!k) return;
    var a = ir.getResponse();
    if (k === 'members') {
      (Array.isArray(a) ? a : [a]).forEach(function (c) { var m = String(c).match(ID_RE); if (m && members.indexOf(m[1]) < 0) members.push(m[1]); });
      return;
    }
    v[k] = Array.isArray(a) ? a.join(', ') : String(a === null || a === undefined ? '' : a).trim();
  });
  members.sort();
  return { key: r.getId(), ts: r.getTimestamp(), email: r.getRespondentEmail() || '', members: members, v: v };
}

function itemKeyMap_(form) {
  if (itemKeyMap_.cache) return itemKeyMap_.cache;
  var map = {}, saved = {};
  try { saved = JSON.parse(PropertiesService.getDocumentProperties().getProperty(PROP.items) || '{}'); } catch (e) { saved = {}; }
  Object.keys(saved).forEach(function (k) { map[saved[k]] = k; });
  var byTitle = {};
  FIELDS.forEach(function (f) { byTitle[f.title] = f.key; });
  form.getItems().forEach(function (it) { if (!map[it.getId()] && byTitle[it.getTitle()]) map[it.getId()] = byTitle[it.getTitle()]; });
  itemKeyMap_.cache = map;
  return map;
}
function findItem_(form, key) {
  var map = itemKeyMap_(form), found = null;
  form.getItems().forEach(function (it) { if (map[it.getId()] === key) found = it; });
  return found;
}

/** ข้อความหลายบรรทัด "รหัส · ค่า" -> { รหัส: ค่า } · kind: email | github | text */
function parseLines_(text, kind) {
  var map = {};
  String(text || '').split(/\r?\n|;/).forEach(function (line) {
    var id = line.match(ID_RE);
    if (!id) return;
    var rest = line.replace(id[0], ' ').replace(/^[\s·:,|\-–—]+|[\s·:,|]+$/g, '').trim();
    if (kind === 'email') { var em = line.match(EMAIL_RE); if (em) map[id[1]] = em[0].toLowerCase(); return; }
    if (kind === 'github') {
      var u = rest.replace(/https?:\/\/(www\.)?github\.com\//i, '').replace(/^@/, '').split(/[\s·,|:\/]+/).filter(String)[0] || '';
      if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(u)) map[id[1]] = u;
      return;
    }
    if (rest) map[id[1]] = rest;
  });
  return map;
}
/** ค่าตามตัวเลือกในแท็บรายชื่อ คอลัมน์ G และ H */
function osOf_(s) {
  s = String(s || '');
  if (/mac|แมค/i.test(s)) return /intel|อินเทล/i.test(s) ? 'macOS (Intel)' : 'macOS (Apple silicon)';
  if (/win|วินโดว์/i.test(s)) return 'Windows (WSL 2)';
  if (/linux|ubuntu|chrome ?os/i.test(s)) return 'อื่น ๆ';
  return '';
}
function dockerOf_(s) {
  s = String(s || '');
  if (/ไม่มีเครื่อง/.test(s)) return 'ไม่มีเครื่องส่วนตัว';
  if (/ไม่ผ่าน|ยังไม่|fail|ไม่ได้/i.test(s)) return 'ยังไม่ผ่าน';
  if (/ผ่าน|pass|\bok\b/i.test(s)) return 'ผ่าน';
  return '';
}
function sameMembers_(teams, members) {
  var sig = members.join(','), hit = null;
  Object.keys(teams).forEach(function (t) { if (sig && teams[t].resp.members.join(',') === sig) hit = t; });
  return hit;
}

/* ------------------------------------------------------------------ schedule (เว็บแอป) */

/** อ่านแท็บกำหนดการ (เวลาอ่านจากค่าที่แสดง เพราะค่าเวลาล้วนเป็นวันที่ปี 1899 ซึ่งเขตเวลาเก่าคลาดหลายนาที) */
function readSchedule_(ss) {
  var sh = ss.getSheetByName(SCHED.sheet);
  if (!sh) return null;
  var n = Math.min(sh.getMaxRows(), SCHED.scanRows);
  var rng = sh.getRange(1, 1, n, SCHED.width), v = rng.getValues(), dv = rng.getDisplayValues();
  var find = function (label) { for (var i = 0; i < n; i++) if (str_(v[i][0]) === label) return i; return -1; };
  var iSet = find(SCHED.settings), iSess = find(SCHED.sessions), iItem = find(SCHED.items);
  if (iSess < 0 || iItem < 0 || iItem < iSess) throw new Error('แท็บ ' + SCHED.sheet + ' ต้องมีหัวตาราง "' + SCHED.sessions + '" แล้วตามด้วย "' + SCHED.items + '" ในคอลัมน์ A');
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
  return { tz: ss.getSpreadsheetTimeZone(), sec: secNo_(ss), settings: settings, sessions: sessions, items: items };
}

function scheduleJson_(sc, now) {
  var tz = sc.tz, off = Utilities.formatDate(now, tz, 'Z');
  off = off.slice(0, 3) + ':' + off.slice(3);
  var day = function (x) { return isDate_(x) ? Utilities.formatDate(x, tz, 'yyyy-MM-dd') : ''; };
  var iso = function (x) { return isDate_(x) ? Utilities.formatDate(x, tz, "yyyy-MM-dd'T'HH:mm:ss") + off : ''; };
  var hm = function (s) { var m = String(s || '').match(/^(\d{1,2}):(\d{2})/); return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : ''; };
  var set = function (k) { return sc.settings[k] || { v: '', d: '' }; };
  return {
    ok: true, version: 1, sec: sc.sec, updated: iso(now), offset: off,
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

/** เว็บแอป: GET คืน JSON ของแท็บกำหนดการ · ?what=submissions คืนสถานะการส่ง */
function doGet(e) {
  var p = (e && e.parameter) || {}, cache = null, body = null;
  if (p.what === 'submissions') return jsonOut_(submissionsGet_(p), p.callback);
  try { cache = CacheService.getScriptCache(); body = cache.get(SCHED.cacheKey); } catch (err) { cache = null; }
  if (!body) {
    var out;
    try { var sc = readSchedule_(scheduleBook_()); out = sc ? scheduleJson_(sc, new Date()) : { ok: false, error: 'ไม่พบแท็บ ' + SCHED.sheet }; }
    catch (err) { out = { ok: false, error: String(err && err.message || err) }; }
    body = JSON.stringify(out);
    if (out.ok && cache) { try { cache.put(SCHED.cacheKey, body, SCHED.cacheSec); } catch (err) { /* ใหญ่เกินแคช */ } }
  }
  return jsonOut_(body, p.callback);
}

function jsonOut_(body, callback) {
  var cb = String(callback || '');
  if (/^[A-Za-z_$][\w$.]{0,60}$/.test(cb)) return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function scheduleBook_() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty(PROP.book);
  if (!id) throw new Error('ยังไม่ได้บันทึกรหัสชีต สั่งเมนู ตรวจข้อมูลหน้าเว็บกำหนดการ ครั้งหนึ่ง');
  return SpreadsheetApp.openById(id);
}

/** แก้แท็บกำหนดการแล้วล้างแคช หน้าเว็บเห็นค่าใหม่ทันที */
function onEdit(e) {
  try {
    if (e && e.range && e.range.getSheet().getName() === SCHED.sheet) {
      var c = CacheService.getScriptCache(); c.remove(SCHED.cacheKey); c.remove(SUB.cacheKey);
    }
  } catch (err) { /* ไม่มีสิทธิ์ใช้แคช */ }
}

function previewSchedule() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty(PROP.book, ss.getId());
  try { CacheService.getScriptCache().remove(SCHED.cacheKey); } catch (e) { /* ไม่มีแคช */ }
  var sc = readSchedule_(ss);
  if (!sc) { alert_('ไม่พบแท็บกำหนดการ', 'สร้างแท็บชื่อ "' + SCHED.sheet + '" ก่อน'); return; }
  var j = scheduleJson_(sc, new Date());
  var waiting = j.sessions.filter(function (s) { return !s.date && s.status !== 'งด'; }).map(function (s) { return s.id; });
  var pending = j.items.filter(function (x) { return !x.due && x.kind !== 'ทุกคาบ'; }).map(function (x) { return x.id; });
  alert_('ข้อมูลหน้าเว็บกำหนดการ SEC' + sc.sec, 'คาบเรียน ' + j.sessions.length + ' แถว · งานที่แสดงบนเว็บ ' + j.items.length + ' รายการ' +
    (waiting.length ? '\nคาบที่ยังไม่มีวันที่: ' + waiting.join(', ') : '') +
    (pending.length ? '\nงานที่ยังไม่มีกำหนดส่ง: ' + pending.join(', ') : '') +
    '\nรับลงทะเบียนทีมใหม่: ' + (j.settings.regOpen ? 'เปิด' : 'ปิด') +
    '\n\nURL เว็บแอปดูที่ Deploy > Manage deployments (ลงท้าย /exec)');
}

/* ------------------------------------------------------------------ ตรวจการส่งงานใน repo
 * กติกาในแท็บกำหนดการ คอลัมน์ M บรรทัดละข้อ (หรือคั่นด้วย ;)
 *   access                 เปิด repo ได้
 *   file:path              มีไฟล์นี้ใน branch หลัก ({T} = รหัสทีม, {ID} = รหัสสมาชิกแต่ละคน)
 *   dir:path/              มีไฟล์อย่างน้อยหนึ่งไฟล์ในโฟลเดอร์นี้
 *   prefix:path            มีไฟล์ที่ path ขึ้นต้นแบบนี้ เช่น prefix:docs/arch-03-adr/ADR-001-
 *   tag:name               มี tag นี้บน GitHub
 *   file:path ~คำ,คำ       คำที่ใช้หาไฟล์ชื่อคล้ายเพื่อแนะนำให้ย้าย
 */
var INVITE_RE = /engse207/i;
var SUB = { sheet: 'การส่งงาน', store: 'ข้อมูลการส่ง', tokenProp: 'engse207.githubToken',
  sigProp: 'engse207.submissions.sig', checkedProp: 'engse207.submissions.checked',
  cacheKey: 'engse207.submissions.v1', cacheSec: 300, recheckSec: 300, aheadDays: 14, maxBranches: 6,
  api: 'https://api.github.com' };

var NO_SCHED = 'SEC นี้ยังไม่มีแท็บ "' + SCHED.sheet + '" จึงยังไม่มีงานให้ตรวจ ข้ามรอบนี้ (ไม่ใช่ข้อผิดพลาด) · เพิ่มแท็บกำหนดการเมื่อกำหนดวันเรียนแล้ว';

function checkSubmissions() {
  var r = runSubmissionCheck_(SpreadsheetApp.getActiveSpreadsheet(), null);
  if (r.skipped) { alert_('ยังไม่ตรวจการส่งงาน', NO_SCHED); return; }
  alert_('ตรวจการส่งงานแล้ว', r.summary + '\nดูผลในแท็บ "' + SUB.sheet + '"' + (r.warn ? '\n\n' + r.warn : ''));
}
function checkSubmissionsAuto() { runSubmissionCheck_(scheduleBook_(), null); }

function runSubmissionCheck_(ss, onlyTeams) {
  var now = new Date(), sc = readSchedule_(ss);
  if (!sc) return { skipped: true, summary: NO_SCHED, warn: '' };
  var items = subItems_(sc);
  var teams = subTeams_(ss).filter(function (t) { return !onlyTeams || onlyTeams.indexOf(t.id) >= 0; });
  var store = subStoreRead_(ss), gh = ghClient_(), before = subStoreSig_(store);
  var accepted = acceptInvites_(gh);
  var res = subCheckTeams_(gh, teams, items, store, now);
  subCheckedSave_(teams, store, now);
  if (subStoreSig_(store) !== before) subStoreWrite_(ss, store);
  subRender_(ss, sc, items, store, now, gh);
  try { CacheService.getScriptCache().remove(SUB.cacheKey); } catch (e) { /* ไม่มีแคช */ }
  try { sumCell_(ss, 'lastCheck').setValue(Utilities.formatDate(now, sc.tz, 'd/M/yyyy HH:mm') + ' · ' + res.checked + ' ทีม'); } catch (e) { /* ไม่มีหน้าจอ */ }
  var warn = gh.token ? '' : 'ยังไม่ได้ตั้ง GitHub token: repo ที่เป็น private จะเปิดไม่ได้ (เมนู ตั้ง GitHub token)';
  if (gh.limited) warn = (warn ? warn + '\n' : '') + 'GitHub จำกัดการเรียกระหว่างตรวจ บางทีมยังไม่ได้ตรวจรอบนี้';
  return { summary: 'ตรวจ ' + res.checked + ' ทีม · เรียก GitHub ' + gh.calls + ' ครั้ง' + (accepted ? ' · รับคำเชิญ collaborator ' + accepted + ' repo' : ''), warn: warn };
}

/** รับคำเชิญ collaborator ที่ค้างอยู่ของบัญชีเจ้าของ token เฉพาะ repo ที่ชื่อมี engse207
 *  (repo ส่วนตัวต้องกดรับคำเชิญก่อนจึงอ่านได้ และคำเชิญหมดอายุใน 7 วัน) */
function acceptInvites_(gh) {
  if (!gh.token || gh.limited) return 0;
  var list = ghFetchAll_(gh, ['/user/repository_invitations?per_page=100'])[0], n = 0;
  if (list.code !== 200 || !Array.isArray(list.json)) return 0;
  list.json.forEach(function (inv) {
    var name = inv.repository && inv.repository.name || '';
    if (!INVITE_RE.test(name) || inv.expired) return;
    var r = UrlFetchApp.fetch(SUB.api + '/user/repository_invitations/' + inv.id, { method: 'patch', muteHttpExceptions: true,
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + gh.token } });
    gh.calls++;
    if (r.getResponseCode() === 204) n++;
    else Logger.log('รับคำเชิญ ' + inv.repository.full_name + ' ไม่ได้: ' + r.getResponseCode());
  });
  return n;
}

function subItems_(sc) {
  return sc.items.filter(function (r) { return str_(r.check) && isDate_(r.due); }).map(function (r) {
    return { id: r.id, title: r._title, scope: r._scope, due: r.due, where: r._where, rules: parseRules_(str_(r.check)) };
  }).sort(function (a, b) { return a.due - b.due; });
}

function parseRules_(s) {
  return String(s).split(/[;\n]/).map(function (p) { return p.trim(); }).filter(String).map(function (p) {
    if (p === 'access') return { k: 'access' };
    var m = p.match(/^(file|dir|prefix|tag):(.+)$/);
    if (!m) return { k: 'bad', v: p };
    var v = m[2].trim(), hints = [], t = v.indexOf('~');
    if (t >= 0) { hints = v.slice(t + 1).split(',').map(function (h) { return h.trim().toLowerCase(); }).filter(String); v = v.slice(0, t).trim(); }
    if (m[1] === 'dir' && !/\/$/.test(v)) v += '/';
    return { k: m[1], v: v, hints: hints };
  });
}

/** ทีมจากแท็บทีม: รหัส repo และรหัสสมาชิก (ข้ามช่องที่ยังไม่มีสมาชิกและ repo) */
function subTeams_(ss) {
  var sh = sheetOrStop_(ss, SH.team), out = [];
  var v = sh.getRange(TEAM.first, 1, TEAM.blocks * TEAM.size, TEAM.width).getValues();
  for (var b = 0; b < TEAM.blocks; b++) {
    var r0 = b * TEAM.size, id = str_(v[r0][TEAM.c.id - 1]), url = str_(v[r0][TEAM.c.repo - 1]), members = [];
    for (var k = 0; k < TEAM.size; k++) { var sid = normId_(v[r0 + k][TEAM.c.sid - 1]); if (sid) members.push(sid); }
    if (!id || (!members.length && !url)) continue;
    var m = url.match(/github\.com[\/:]([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?:[\/#?].*)?$/);
    out.push({ id: id, owner: m ? m[1] : '', repo: m ? m[2] : '', members: members, row: TEAM.first + r0 });
  }
  return out;
}

/* ---------- GitHub client */

function ghClient_() { return { token: PropertiesService.getScriptProperties().getProperty(SUB.tokenProp) || '', calls: 0, limited: false }; }

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
    if (r.code === 200 && r.json) { c.st.access = 'ok'; c.st.def = r.json.default_branch || ''; }
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
  // 3) tree ของแต่ละ branch
  var q3 = [], map3 = [];
  live.forEach(function (c, ci) {
    c.trees = {};
    c.branches.forEach(function (b) { q3.push('/repos/' + c.t.owner + '/' + c.t.repo + '/git/trees/' + b.sha + '?recursive=1'); map3.push([ci, b.name]); });
  });
  ghFetchAll_(gh, q3).forEach(function (r, k) {
    var c = live[map3[k][0]];
    if (r.code === 0) c.failed = true;
    c.trees[map3[k][1]] = (r.code === 200 && r.json && r.json.tree) ? r.json.tree.filter(function (x) { return x.type === 'blob'; }).map(function (x) { return x.path; }) : [];
  });
  // 4) ประเมินแต่ละงาน หาวันที่ commit แรกเฉพาะส่วนที่ยังไม่เคยบันทึก
  var q4 = [], map4 = [];
  live.forEach(function (c) {
    if (c.failed) return;
    items.forEach(function (it) {
      var cell = subEval_(c, it);
      c.st.cells[it.id] = cell;
      cell.parts.forEach(function (p, pi) {
        if (!p.found || p.kind === 'access') return;
        var prev = c.st.old[it.id] && c.st.old[it.id].pf && c.st.old[it.id].pf[pi];
        if (p.kind !== 'tag' && prev && prev.p === p.key && prev.f) { p.f = prev.f; return; }
        var base = '/repos/' + c.t.owner + '/' + c.t.repo;
        if (p.kind === 'tag') q4.push(base + '/commits/' + enc_(p.ref));
        else q4.push(base + '/commits?sha=' + encodeURIComponent(p.branch) + '&path=' + encodeURIComponent(p.hit.replace(/\/$/, '')) + '&per_page=100');
        map4.push(p); p.owner = c;
      });
    });
  });
  ghFetchAll_(gh, q4).forEach(function (r, k) {
    var p = map4[k], d = null;
    if (r.code === 0) { p.owner.failed = true; return; }
    if (p.kind === 'tag' && r.code !== 200) { p.found = false; p.f = 0; return; }
    if (r.code === 200 && r.json) {
      var cm = Array.isArray(r.json) ? r.json[r.json.length - 1] : r.json;
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
        ok: all ? (main ? 1 : 2) : 0,
        f: all && fs.length ? Math.max.apply(null, fs) : 0,
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

/** แตกกติกาที่มี {ID} เป็นหนึ่งส่วนต่อสมาชิก แล้วประเมินจาก tree ที่ดึงมาแล้ว */
function subEval_(c, it) {
  var tid = c.t.id, hints = [], parts = [];
  it.rules.forEach(function (r) {
    if (r.k === 'access') { parts.push({ kind: 'access', key: 'access', found: true, label: 'เปิด repo ได้' }); return; }
    if (r.k === 'bad') { parts.push({ kind: 'bad', key: 'bad', found: false, label: 'กติกาผิด: ' + r.v }); return; }
    var perId = /\{ID\}/.test(r.v);
    (perId ? (c.t.members.length ? c.t.members : ['?']) : ['']).forEach(function (sid) {
      var v = r.v.replace(/\{ID\}/g, sid).replace(/\{T\}/g, tid);
      if (r.k === 'tag') { parts.push({ kind: 'tag', key: 'tag:' + v, ref: v, found: true, label: 'tag ' + v }); return; }
      var test = r.k === 'dir' || r.k === 'prefix'
        ? function (f) { return f.indexOf(v) === 0; }
        : function (f) { return f === v || f.toLowerCase() === v.toLowerCase(); };
      var hitB = null, hit = '';
      c.branches.forEach(function (b) {
        if (hitB) return;
        var f = (c.trees[b.name] || []).filter(test)[0];
        if (f) { hitB = b.name; hit = r.k === 'dir' ? v : f; }
      });
      var p = { kind: r.k, key: r.k + ':' + v, path: v, hit: hit, label: r.k === 'prefix' ? v + '…' : v, found: !!hitB, branch: hitB || '', other: !!hitB && hitB !== c.st.def };
      if (!hitB && r.k === 'file') {
        var ext = v.split('.').pop().toLowerCase(), like;
        if (perId) {
          // ไฟล์ของคนนี้ที่ตั้งชื่อเพี้ยน: ชื่อมีรหัส (มีหรือไม่มีขีด) และส่วนที่เหลือตรงกับแม่แบบ เช่น t01_<รหัส>.md
          var norm = function (x) { return String(x).toLowerCase().replace(/[^a-z0-9]/g, ''); };
          var stem = norm(r.v.split('/').pop().replace(/\.[^.]+$/, '').replace(/\{ID\}/g, ''));
          like = function (base) {
            var b0 = base.replace(/\.[^.]+$/, ''), b1 = b0.split(sid).join('').split(sid.replace('-', '')).join('');
            return b1 !== b0 && norm(b1) === stem;
          };
        } else {
          var words = (r.hints.length ? r.hints : [v.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase()])
            .filter(function (w) { return w.length >= 4 && ['readme', 'index', 'main'].indexOf(w) < 0; });
          like = function (base) { return words.some(function (w) { return base.indexOf(w) >= 0; }); };
        }
        (c.trees[c.st.def] || []).forEach(function (f) {
          var base = f.split('/').pop().toLowerCase();
          if (base.split('.').pop() === ext && like(base) && hints.indexOf(f) < 0) hints.push(f);
        });
      }
      parts.push(p);
    });
  });
  return { parts: parts, hints: hints };
}

/* ---------- store */

function subStoreSig_(st) {
  return JSON.stringify(Object.keys(st).sort().map(function (k) { var o = st[k]; return [k, o.access, o.def, o.cells, !!o.stale]; }));
}
function subCheckedRead_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(SUB.checkedProp) || '{}'); } catch (e) { return {}; } }
function subCheckedSave_(teams, store, now) {
  var m = subCheckedRead_(), t = Math.floor(now.getTime() / 1000);
  teams.forEach(function (x) { if (store[x.id] && !store[x.id].stale) m[x.id] = t; });
  PropertiesService.getScriptProperties().setProperty(SUB.checkedProp, JSON.stringify(m));
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
  var sh = subStoreSheet_(ss), ids = Object.keys(st).sort(function (a, b) { return teamNo_(a) - teamNo_(b); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
  if (ids.length) sh.getRange(2, 1, ids.length, 2).setValues(ids.map(function (id) { return [id, JSON.stringify(st[id])]; }));
}

/* ---------- สถานะสำหรับแสดงผล */

/** ok ตรงเวลา · late ส่งช้า · branch อยู่ branch อื่น · due ยังไม่ส่ง ยังไม่ถึงกำหนด · miss เลยกำหนดแล้ว · na เปิด repo ไม่ได้ */
function subState_(team, it, nowS) {
  var dueS = Math.floor(it.due.getTime() / 1000);
  if (!team || team.access === 'noaccess' || team.access === 'norepo') return { s: 'na' };
  if (it.rules.every(function (r) { return r.k === 'access'; })) return { s: 'ok' };
  var c = (team.cells || {})[it.id];
  if (!c || !c.ok) return { s: nowS > dueS ? 'miss' : 'due', miss: c ? c.miss : [], hint: c ? c.hint : [] };
  if (c.ok === 2) return { s: 'branch', at: c.f, br: c.br };
  return { s: c.f && c.f > dueS ? 'late' : 'ok', at: c.f };
}
function subVisibleItems_(items, store, nowS) {
  return items.filter(function (it) {
    if (it.due.getTime() / 1000 <= nowS + SUB.aheadDays * 86400) return true;
    return Object.keys(store).some(function (t) { var c = (store[t].cells || {})[it.id]; return c && c.ok; });
  });
}
var SUB_MARK = { ok: '✓', late: '✓ ช้า', branch: '⚠ branch', due: '–', miss: '✗', na: '?' };
var TONE = { ok: ['#d8efe0', '#1e5b35'], wa: ['#fceac6', '#7a510a'], no: ['#f7d6d3', '#9b2b21'], na: ['#edf2f4', '#3f5972'] };
function subFmt_(s, tz) { return s ? Utilities.formatDate(new Date(s * 1000), tz, 'd/M HH:mm') : ''; }

/** แท็บการส่งงาน (ผู้สอนดู เขียนใหม่เฉพาะเมื่อผลเปลี่ยน) */
function subRender_(ss, sc, items, store, now, gh) {
  var tz = sc.tz, nowS = Math.floor(now.getTime() / 1000);
  var vis = subVisibleItems_(items, store, nowS), teams = subTeams_(ss);
  var sh = ss.getSheetByName(SUB.sheet) || ss.insertSheet(SUB.sheet);
  var W = 2 + vis.length + 3;
  var head = ['ทีม', 'repo'].concat(vis.map(function (it) { return it.id + '\n' + it.title + '\nส่ง ' + Utilities.formatDate(it.due, tz, 'd/M HH:mm'); }))
    .concat(['ยังขาด', 'ข้อสังเกต', 'ข้อความเตือน (คัดลอกไป LINE)']);
  var rows = [], tones = [];
  teams.forEach(function (t) {
    var st = store[t.id];
    var repo = !t.owner ? 'ไม่มีลิงก์ repo' : !st ? 'ยังไม่ได้ตรวจ' : st.access === 'ok' ? 'เปิดได้ · ' + st.def :
      st.access === 'empty' ? 'เปิดได้ · ยังว่าง' : 'เปิดไม่ได้ (ยังไม่เพิ่ม ' + TEACHER_GITHUB + ' หรือลิงก์ผิด)';
    var lack = [], notes = [], row = [t.id, repo], tone = ['', st && st.access === 'ok' ? '' : st && st.access === 'empty' ? 'wa' : 'na'];
    vis.forEach(function (it) {
      var x = subState_(st, it, nowS), v = SUB_MARK[x.s];
      if (x.at) v += ' ' + subFmt_(x.at, tz);
      if (x.s === 'branch') { v = '⚠ ' + x.br + (x.at ? ' ' + subFmt_(x.at, tz) : ''); notes.push(it.id + ' อยู่ใน branch ' + x.br + ' ยังไม่ merge เข้า ' + st.def); }
      if (x.s === 'due' || x.s === 'miss') {
        if (it.due.getTime() / 1000 <= nowS + SUB.aheadDays * 86400) lack.push(it.id);
        if (x.miss && x.miss.length) notes.push(it.id + ' ยังขาด ' + x.miss.join(', '));
        if (x.hint && x.hint.length) notes.push(it.id + ' พบ ' + x.hint.join(', ') + ' ให้ย้ายหรือเปลี่ยนชื่อ');
      }
      row.push(v);
      tone.push({ ok: 'ok', late: 'wa', branch: 'wa', due: '', miss: 'no', na: 'na' }[x.s]);
    });
    var msg = '';
    if (!st || st.access === 'noaccess' || st.access === 'norepo') msg = t.id + ': อาจารย์ยังเปิด repo ไม่ได้ เพิ่ม ' + TEACHER_GITHUB + ' เป็น collaborator และใส่ลิงก์ repo ในแบบลงทะเบียน';
    else if (lack.length || notes.length) msg = t.id + (lack.length ? ': ยังขาด ' + lack.map(function (id) {
      var it = vis.filter(function (x) { return x.id === id; })[0];
      return id + ' (ส่ง ' + Utilities.formatDate(it.due, tz, 'd/M HH:mm') + ')';
    }).join(', ') : ':') + ' · ดูสถานะที่ ' + SITE_URL + 'submissions.html?sec=' + sc.sec;
    rows.push(row.concat([lack.join(' ') || (st && st.access === 'ok' ? 'ครบ' : ''), notes.join(' · '), msg]));
    tones.push(tone.concat(['', '', '']));
  });
  var sig = JSON.stringify([head, rows, tones, !!gh.token]), props = PropertiesService.getScriptProperties();
  var dig = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, sig, Utilities.Charset.UTF_8));
  if (props.getProperty(SUB.sigProp) === dig && sh.getRange(4, 1).getValue() === 'ทีม') return;
  props.setProperty(SUB.sigProp, dig);
  sh.clear();
  if (sh.getMaxColumns() < W) sh.insertColumnsAfter(sh.getMaxColumns(), W - sh.getMaxColumns());
  sh.getRange(1, 1).setValue('การส่งงานใน repo ของแต่ละทีม · SEC' + sc.sec).setFontWeight('bold').setFontSize(14);
  sh.getRange(2, 1).setValue('ผลเปลี่ยนล่าสุด ' + Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm') + ' น. · ✓ มีไฟล์ตาม path (เวลา commit) · ✓ ช้า ส่งหลังกำหนด · ⚠ อยู่ใน branch อื่น · – ยังไม่ถึงกำหนด · ✗ เลยกำหนดแล้วยังไม่ส่ง · ? เปิด repo ไม่ได้' +
    (gh.token ? '' : ' · ยังไม่ได้ตั้ง GitHub token') + ' · กติกาอยู่ในแท็บกำหนดการ คอลัมน์ M · สคริปต์เขียนแท็บนี้ใหม่ทุกครั้ง อย่าพิมพ์ในแท็บนี้')
    .setFontSize(9).setFontColor('#5d6878');
  if (!rows.length) return;
  sh.getRange(4, 1, 1, W).setValues([head]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#13294b').setWrap(true).setVerticalAlignment('middle');
  var body = sh.getRange(5, 1, rows.length, W);
  body.setValues(rows).setVerticalAlignment('top').setWrap(true).setFontSize(10);
  body.setBackgrounds(tones.map(function (r) { return r.map(function (k) { return k ? TONE[k][0] : null; }); }))
    .setFontColors(tones.map(function (r) { return r.map(function (k) { return k ? TONE[k][1] : '#1a2330'; }); }));
  if (vis.length) sh.getRange(5, 3, rows.length, vis.length).setHorizontalAlignment('center');
  sh.setFrozenRows(4); sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 70); sh.setColumnWidth(2, 150);
  for (var k = 0; k < vis.length; k++) sh.setColumnWidth(3 + k, 104);
  sh.setColumnWidth(3 + vis.length, 90); sh.setColumnWidth(4 + vis.length, 300); sh.setColumnWidth(5 + vis.length, 380);
  sh.setRowHeight(4, 66);
}

/* ---------- เว็บแอป: สถานะการส่ง (รหัสทีมกับสถานะ รหัสนักศึกษาปิดบางส่วน) */

function maskIds_(s) { return String(s).replace(/([0-9]{7})([0-9]{4}-[0-9])/g, '•••••••$2'); }

function submissionsJson_(ss, now) {
  var sc = readSchedule_(ss);
  if (!sc) return { ok: false, error: 'ไม่พบแท็บ ' + SCHED.sheet };
  var tz = sc.tz, nowS = Math.floor(now.getTime() / 1000);
  var off = Utilities.formatDate(now, tz, 'Z'); off = off.slice(0, 3) + ':' + off.slice(3);
  var iso = function (d) { return Utilities.formatDate(d, tz, "yyyy-MM-dd'T'HH:mm:ss") + off; };
  var items = subItems_(sc), store = subStoreRead_(ss), last = 0, chk = subCheckedRead_();
  var teams = subTeams_(ss).map(function (t) {
    var st = store[t.id], ck = chk[t.id] || 0;
    if (ck > last) last = ck;
    var cells = {};
    items.forEach(function (it) {
      var x = subState_(st, it, nowS), o = { s: x.s };
      if (x.at) o.at = iso(new Date(x.at * 1000));
      if (x.br) o.br = x.br;
      if (x.miss && x.miss.length) o.miss = x.miss.map(maskIds_);
      if (x.hint && x.hint.length) o.hint = x.hint.map(maskIds_);
      cells[it.id] = o;
    });
    return { id: t.id, access: st ? st.access : 'unchecked', def: st && st.access === 'ok' ? st.def : '',
      checked: ck ? iso(new Date(ck * 1000)) : '', cells: cells };
  });
  return {
    ok: true, version: 1, sec: sc.sec, now: iso(now), checked: last ? iso(new Date(last * 1000)) : '',
    recheckSec: SUB.recheckSec, aheadDays: SUB.aheadDays, site: SITE_URL,
    items: items.map(function (it) {
      return { id: it.id, title: it.title, scope: it.scope, due: iso(it.due),
        paths: it.rules.filter(function (r) { return r.k === 'file' || r.k === 'dir' || r.k === 'prefix'; }).map(function (r) { return r.k === 'prefix' ? r.v + '…' : r.v; }),
        tags: it.rules.filter(function (r) { return r.k === 'tag'; }).map(function (r) { return r.v; }) };
    }),
    teams: teams
  };
}

/** doGet?what=submissions[&recheck=S1-T04] */
function submissionsGet_(p) {
  var ss = scheduleBook_(), cache = null, info = null;
  try { cache = CacheService.getScriptCache(); } catch (e) { cache = null; }
  var team = String(p.recheck || '').toUpperCase();
  if (/^S\d-T\d{2}$/.test(team)) {
    var key = 'engse207.recheck.' + team, waitTo = cache ? Number(cache.get(key) || 0) : 0, nowMs = Date.now();
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

function setGithubToken() {
  var ui = ui_();
  if (!ui) throw new Error('สั่งจากเมนูในชีต');
  var r = ui.prompt('ตั้ง GitHub token',
    'วาง personal access token (classic) ของบัญชี ' + TEACHER_GITHUB + ' ที่เลือก scope: repo และตั้งวันหมดอายุหลังจบภาค\n' +
    '(fine-grained token เปิด repo ที่เราเป็น collaborator ไม่ได้) สคริปต์ใช้อ่านไฟล์และรับคำเชิญ collaborator ของ repo ที่ชื่อมี engse207 เท่านั้น\n' +
    'token เก็บใน Script Properties ไม่อยู่ในชีต · เว้นว่างแล้วกด OK เพื่อลบ token', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var t = r.getResponseText().trim(), props = PropertiesService.getScriptProperties();
  if (!t) { props.deleteProperty(SUB.tokenProp); alert_('ลบ token แล้ว', 'repo ที่เป็น private จะตรวจไม่ได้'); return; }
  if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) { alert_('รูปแบบ token ไม่ถูก', 'token ของ GitHub ขึ้นต้นด้วย github_pat_ หรือ ghp_'); return; }
  props.setProperty(SUB.tokenProp, t);
  var gh = ghClient_(), r1 = ghFetchAll_(gh, ['/rate_limit'])[0], lim = r1.json && r1.json.resources && r1.json.resources.core;
  alert_(r1.code === 200 ? 'บันทึก token แล้ว' : 'บันทึกแล้ว แต่ GitHub ตอบ ' + r1.code,
    r1.code === 200 ? 'เรียกได้ ' + (lim ? lim.limit : '?') + ' ครั้งต่อชั่วโมง · ต่อไปสั่ง ตรวจการส่งงานใน repo ตอนนี้' : 'ตรวจว่าคัดลอก token ครบ และยังไม่หมดอายุ');
}

/* ------------------------------------------------------------------ ไฟล์สถานะทีม */

function publishTeamStatus(auto) {
  auto = auto === true;
  var ss = SpreadsheetApp.getActiveSpreadsheet() || scheduleBook_(), sec = secNo_(ss), tz = ss.getSpreadsheetTimeZone(), now = new Date();
  var roster = readRoster_(ss), byId = {};
  roster.forEach(function (s) { byId[s.id] = s; });
  // เวลาเรียน
  var minAttend = Number(sheetOrStop_(ss, SH.settings).getRange(SETTING.minAttend).getValue()) || 0.8;
  var att = {};
  sheetOrStop_(ss, SH.attend).getRange(ATTEND.first, 1, ATTEND.last - ATTEND.first + 1, ATTEND.pct).getValues().forEach(function (r) {
    var id = normId_(r[ATTEND.id - 1]);
    if (id) att[id] = { came: Number(r[ATTEND.came - 1]) || 0, late: Number(r[ATTEND.late - 1]) || 0, rec: Number(r[ATTEND.rec - 1]) || 0, pct: r[ATTEND.pct - 1] };
  });
  // คะแนนทีมที่เผยแพร่
  var pub = {};
  sheetOrStop_(ss, SH.settings).getRange(SETTING.pubFirstRow, 1, SETTING.pubRows, 2).getValues().forEach(function (r) { pub[str_(r[0])] = r[1] === true; });
  var scoreRows = {};
  sheetOrStop_(ss, SH.scoreTeam).getRange(SCORE_TEAM.first, 1, SCORE_TEAM.rows, 21).getValues().forEach(function (r) { scoreRows[str_(r[0])] = r; });
  // กำหนดการ และผลตรวจ repo
  var sc = readSchedule_(ss), items = sc ? subItems_(sc) : [], store = subStoreRead_(ss), nowS = Math.floor(now.getTime() / 1000);
  var due = {};
  if (sc) sc.items.forEach(function (r) { due[r.id] = isDate_(r.due) ? r.due : null; });

  var tsh = sheetOrStop_(ss, SH.team), folder = statusFolder_(sec);
  var v = tsh.getRange(TEAM.first, 1, TEAM.blocks * TEAM.size, TEAM.width).getValues();
  var made = 0, shared = 0, missing = 0;
  for (var b = 0; b < TEAM.blocks; b++) {
    var r0 = b * TEAM.size, t = str_(v[r0][TEAM.c.id - 1]), members = [];
    for (var k = 0; k < TEAM.size; k++) { var id = normId_(v[r0 + k][TEAM.c.sid - 1]); if (id && byId[id]) members.push(byId[id]); }
    if (!t || !members.length) continue;
    var st = store[t], sr = scoreRows[t] || [];
    var d = {
      team: t, name: str_(v[r0][TEAM.c.name - 1]), sec: sec, msg: str_(v[r0][TEAM.c.msg - 1]),
      members: members.map(function (s) { return s.name; }),
      cps: SCORE_TEAM.items.map(function (x) {
        var vals = x.cols.map(function (c) { return sr[c - 1]; }), nums = vals.filter(function (n) { return typeof n === 'number'; });
        var it = items.filter(function (y) { return y.id === x.id; })[0];
        var s = it ? subState_(st, it, nowS) : null;
        return { id: x.id, due: due[x.id] ? thaiDateTz_(due[x.id], tz) + ' ' + Utilities.formatDate(due[x.id], tz, 'HH:mm') + ' น.' : 'รอกำหนดวัน',
          sub: s ? { ok: 'ส่งแล้ว', late: 'ส่งหลังกำหนด', branch: 'อยู่ใน branch อื่น', due: 'ยังไม่ส่ง', miss: 'เลยกำหนดแล้วยังไม่ส่ง', na: 'เปิด repo ไม่ได้' }[s.s] : '–',
          tone: s ? { ok: 'ok', late: 'wa', branch: 'wa', due: '', miss: 'no', na: 'na' }[s.s] : '',
          score: pub[x.id] ? (nums.length === vals.length ? fmtNum_(nums.reduce(function (a, n) { return a + n; }, 0)) + ' / ' + x.max : 'ยังไม่ได้ตรวจ') : 'รอประกาศ' };
      }),
      checks: items.filter(function (it) { return it.due.getTime() / 1000 <= nowS + SUB.aheadDays * 86400; }).map(function (it) {
        var s = subState_(st, it, nowS);
        return [it.id + ' ' + it.title, Utilities.formatDate(it.due, tz, 'd/M HH:mm'),
          { ok: '✓ ส่งแล้ว', late: '✓ ส่งหลังกำหนด', branch: '⚠ อยู่ใน branch อื่น', due: '– ยังไม่ส่ง', miss: '✗ เลยกำหนดแล้ว', na: '? เปิด repo ไม่ได้' }[s.s] +
            (s.miss && s.miss.length ? ' · ยังขาด ' + s.miss.join(', ') : '') +
            (s.hint && s.hint.length ? ' · พบ ' + s.hint.join(', ') + ' ให้เปลี่ยนชื่อหรือย้ายให้ตรง path' : '') +
            (s.s === 'branch' ? ' ' + s.br + ' ยังไม่ merge' : ''),
          { ok: 'ok', late: 'wa', branch: 'wa', due: '', miss: 'no', na: 'na' }[s.s]];
      }),
      people: members.map(function (s) {
        var a = att[s.id], p = a && a.pct;
        if (!a || !a.rec || typeof p !== 'number') return { name: s.name, status: 'ยังไม่มีข้อมูลเวลาเรียน', tone: 'na' };
        return { name: s.name, tone: p < minAttend ? 'no' : 'ok',
          status: 'มา ' + (a.came + a.late) + ' จาก ' + a.rec + ' ครั้งที่บันทึก · ' + Math.round(p * 100) + '%' +
            (a.late ? ' (สาย ' + a.late + ')' : '') + (p < minAttend ? ' · ต่ำกว่าเกณฑ์ ' + Math.round(minAttend * 100) + '%' : '') };
      })
    };
    var file = openOrCreateStatus_(str_(v[r0][TEAM.c.file - 1]), folder, t);
    writeStatus_(file.getSheets()[0], d, Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
    var mails = {};
    members.forEach(function (s) { if (s.gmail) mails[s.id] = s.gmail; });
    var res = shareStatus_(file.getId(), members, mails);
    made++; if (!res.missing.length && !res.failed.length) shared++; missing += res.missing.length;
    tsh.getRange(TEAM.first + r0, TEAM.c.file).setValue(file.getUrl());
    tsh.getRange(TEAM.first + r0, TEAM.c.pub).setValue(Utilities.formatDate(now, tz, 'd/M HH:mm') + ' · แชร์ ' + res.ok + '/' + members.length +
      (res.missing.length ? ' · ยังไม่มี Gmail: ' + res.missing.join(', ') : '') + (res.failed.length ? ' · แชร์ไม่ได้: ' + res.failed.join(', ') : ''));
  }
  sumCell_(ss, 'lastPub').setValue(Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
  var note = 'ไฟล์ทีม ' + made + ' · แชร์ครบ ' + shared + ' ทีม' + (missing ? ' · ยังไม่มี Gmail ' + missing + ' คน' : '');
  sumCell_(ss, 'pubNote').setValue(note);
  if (!auto) alert_('เผยแพร่สถานะทีมแล้ว', note + '\nลิงก์ไฟล์ของแต่ละทีมอยู่ในแท็บ ทีม คอลัมน์ L');
}

function writeStatus_(sh, d, stamp) {
  sh.clear();
  sh.getRange(1, 1, sh.getMaxRows(), Math.min(sh.getMaxColumns(), 26)).breakApart();
  sh.setName('สถานะทีม');
  sh.setHiddenGridlines(true);
  [260, 170, 170, 110, 300].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(1, 1, 80, 5).setFontFamily('Tahoma').setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  var row = 1;
  function line(text, size, bold, color) { sh.getRange(row, 1, 1, 5).merge().setValue(text).setFontSize(size).setFontWeight(bold ? 'bold' : 'normal').setFontColor(color || '#101b2e'); row++; }
  function head(labels) { sh.getRange(row, 1, 1, labels.length).setValues([labels]).setBackground('#101b2e').setFontColor('#ffffff').setFontWeight('bold'); row++; }
  function tone(range, t) { var c = TONE[t || 'na']; range.setBackground(c[0]).setFontColor(c[1]); }
  line(COURSE + ' สถาปัตยกรรมซอฟต์แวร์ · SEC' + d.sec + ' · ภาค ' + TERM + ' · สถานะทีม', 9, false, '#4e5f74');
  line(d.team + (d.name ? ' · ' + d.name : ''), 16, true);
  line('สมาชิก: ' + d.members.join(' · '), 10, false, '#4e5f74');
  line('เผยแพร่ล่าสุด ' + stamp + ' · ไฟล์นี้ดูได้อย่างเดียว อาจารย์อัปเดตหลังตรวจงาน', 9, false, '#4e5f74');
  line('กำหนดส่งทั้งภาค: ' + SITE_URL + 'deliverables.html?sec=' + d.sec + ' · สถานะไฟล์ใน repo: ' + SITE_URL + 'submissions.html?sec=' + d.sec, 9, false, '#4e5f74');
  row++;
  head(['งานทีมที่มีคะแนน', 'กำหนด', 'สถานะการส่ง', 'คะแนนทีม', '']);
  d.cps.forEach(function (c) {
    sh.getRange(row, 1, 1, 4).setValues([[c.id, c.due, c.sub, c.score]]);
    if (c.tone) tone(sh.getRange(row, 3), c.tone);
    sh.getRange(row, 4).setHorizontalAlignment('center');
    row++;
  });
  if (d.msg) { row++; line('ข้อความจากอาจารย์', 11, true); sh.getRange(row, 1, 1, 5).merge().setValue(d.msg).setBackground('#fff4cc'); row++; }
  row++;
  line('ไฟล์ใน repo ของงานที่ครบกำหนดภายใน 14 วัน', 11, true);
  if (!d.checks.length) line('ยังไม่มีงานในช่วงนี้ หรือยังไม่ได้ตรวจ repo', 10, false, '#4e5f74');
  d.checks.forEach(function (c) {
    sh.getRange(row, 1, 1, 3).setValues([[c[0], c[1], c[2]]]);
    if (c[3]) tone(sh.getRange(row, 3), c[3]);
    row++;
  });
  row++;
  line('เวลาเรียนรายคน', 11, true);
  d.people.forEach(function (p) { sh.getRange(row, 1, 1, 2).setValues([[p.name, p.status]]); tone(sh.getRange(row, 2), p.tone); row++; });
  row++;
  line('คะแนนในไฟล์นี้เป็นคะแนนทีม แสดงเมื่ออาจารย์ประกาศ คะแนนรายคนและคะแนนสอบไม่แสดงในไฟล์นี้ · ข้อมูลไม่ตรง แจ้งอาจารย์ในคาบ', 9, false, '#4e5f74');
}

function statusFolder_(sec) {
  var props = PropertiesService.getDocumentProperties(), id = props.getProperty(PROP.folder), folder = null;
  if (id) { try { folder = DriveApp.getFolderById(id); if (folder.isTrashed()) folder = null; } catch (e) { folder = null; } }
  if (!folder) {
    folder = DriveApp.createFolder(COURSE + ' ' + TERM + ' · SEC' + sec + ' · ไฟล์สถานะทีม');
    FOLDER_EDITORS.forEach(function (em) { try { folder.addEditor(em); } catch (e) { Logger.log('เพิ่มผู้แก้ไขโฟลเดอร์ไม่ได้: ' + em); } });
    props.setProperty(PROP.folder, folder.getId());
  }
  return folder;
}

function openOrCreateStatus_(link, folder, t) {
  var m = String(link).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (m) { try { var f = DriveApp.getFileById(m[1]); if (!f.isTrashed()) return SpreadsheetApp.openById(m[1]); } catch (e) { /* สร้างใหม่ */ } }
  var book = SpreadsheetApp.create(COURSE + ' ' + TERM + ' · สถานะทีม ' + t);
  DriveApp.getFileById(book.getId()).moveTo(folder);
  return book;
}

/** แชร์ดูอย่างเดียวให้สมาชิก และถอนสิทธิ์อีเมลที่สคริปต์เคยแชร์แต่ไม่ใช่สมาชิกแล้ว (ผู้ที่ผู้สอนเพิ่มเองไม่ถูกถอน) */
function shareStatus_(fileId, members, mails) {
  var file = DriveApp.getFileById(fileId), props = PropertiesService.getDocumentProperties(), pkey = 'engse207.shared.' + fileId, managed = [];
  try { managed = JSON.parse(props.getProperty(pkey) || '[]'); } catch (e) { managed = []; }
  var want = {}, res = { ok: 0, missing: [], failed: [] }, kept = [], have = {};
  members.forEach(function (s) { if (mails[s.id]) want[mails[s.id]] = s.id; else res.missing.push(s.id); });
  file.getViewers().forEach(function (u) { have[String(u.getEmail()).toLowerCase()] = true; });
  Object.keys(want).forEach(function (em) {
    if (have[em]) { res.ok++; kept.push(em); return; }
    try { file.addViewer(em); res.ok++; kept.push(em); } catch (e) { res.failed.push(want[em]); }
  });
  managed.forEach(function (em) { if (!want[em]) { try { file.removeViewer(em); } catch (e) { /* ไม่มีสิทธิ์อยู่แล้ว */ } } });
  props.setProperty(pkey, JSON.stringify(kept));
  return res;
}

/* ------------------------------------------------------------------ helpers */

/** รายชื่อจากแท็บรายชื่อ: { id, name, gmail }
 * name เก็บตามที่พิมพ์ในชีต (รวมช่องว่างสองช่องระหว่างชื่อกับนามสกุล) เพราะแท็บทีมคอลัมน์ D จับคู่ชื่อแบบตรงทุกตัวอักษร */
function readRoster_(ss) {
  var sh = sheetOrStop_(ss, SH.roster), n = ROSTER.last - ROSTER.first + 1;
  return sh.getRange(ROSTER.first, 1, n, ROSTER.c.gmail).getValues().map(function (r) {
    return { id: normId_(r[ROSTER.c.id - 1]), name: String(r[ROSTER.c.name - 1]),
      gmail: (String(r[ROSTER.c.gmail - 1]).match(EMAIL_RE) || [''])[0].toLowerCase() };
  }).filter(function (s) { return s.id && s.name.trim(); });
}
function rosterChoices_(roster) { return roster.map(function (s) { return s.id + ' ' + s.name.replace(/\s+/g, ' ').trim(); }); }
function normId_(s) { var m = String(s || '').match(ID_RE); return m ? m[1] : ''; }
function openForm_(ss) {
  var url = str_(sumCell_(ss, 'formEdit').getValue());
  if (!url) { alert_('ยังไม่มีแบบลงทะเบียนทีม', 'สั่งเมนู สร้างแบบลงทะเบียนทีม ก่อน'); return null; }
  return FormApp.openByUrl(url);
}
function sheetOrStop_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแท็บ "' + name + '" สคริปต์นี้ใช้กับชีตผู้สอน ' + COURSE + ' เท่านั้น ตรวจว่าเปิดไฟล์ถูก');
  return sh;
}
function ui_() { try { return SpreadsheetApp.getUi(); } catch (e) { return null; } }
function alert_(title, msg) { var ui = ui_(); if (ui) ui.alert(title, msg, ui.ButtonSet.OK); else Logger.log(title + ': ' + msg); }
var TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
var TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
function thaiDateTz_(d, tz) {
  var p = Utilities.formatDate(d, tz, 'u d M yyyy').split(' ').map(Number);
  return TH_DAYS[p[0] % 7] + ' ' + p[1] + ' ' + TH_MONTHS[p[2] - 1] + ' ' + (p[3] + 543);
}
function isDate_(x) { return Object.prototype.toString.call(x) === '[object Date]' && !isNaN(x); }
function str_(x) { return x === null || x === undefined ? '' : String(x).trim(); }
function fmtNum_(n) { n = Number(n); return Math.round(n * 100) / 100 + ''; }

/* ------------------------------------------------------------------ triggers */

function installSubmitTrigger() {
  removeSubmitTrigger();
  ScriptApp.newTrigger('syncTeams').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onFormSubmit().create();
  syncTeams();
  alert_('ตั้งซิงก์อัตโนมัติแล้ว', 'ทุกครั้งที่มีคนส่งหรือแก้คำตอบ แท็บทีมและรายชื่อจะอัปเดตเอง แล้วเผยแพร่ไฟล์สถานะทีมให้สมาชิกทันที');
}
function removeSubmitTrigger() { ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'syncTeams') ScriptApp.deleteTrigger(t); }); }
function installSubmissionTrigger() {
  removeSubmissionTrigger();
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SCHED.sheet)) {
    alert_('ยังไม่ตั้งตรวจอัตโนมัติ', NO_SCHED + '\nเพิ่มแท็บแล้วค่อยสั่งเมนูนี้อีกครั้ง');
    return;
  }
  PropertiesService.getScriptProperties().setProperty(PROP.book, SpreadsheetApp.getActiveSpreadsheet().getId());
  ScriptApp.newTrigger('checkSubmissionsAuto').timeBased().everyHours(1).create();
  checkSubmissions();
}
function removeSubmissionTrigger() { ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'checkSubmissionsAuto') ScriptApp.deleteTrigger(t); }); }
function installNightlyPublish() {
  removeNightlyPublish();
  PropertiesService.getScriptProperties().setProperty(PROP.book, SpreadsheetApp.getActiveSpreadsheet().getId());
  ScriptApp.newTrigger('publishTeamStatusAuto').timeBased().everyDays(1).atHour(2).create();
  alert_('ตั้งเผยแพร่อัตโนมัติแล้ว', 'ทุกคืนประมาณ 02:00–03:00 น. คะแนนทีมแสดงเฉพาะงานที่ติ๊กเผยแพร่ในแท็บ ตั้งค่า');
}
function publishTeamStatusAuto() { publishTeamStatus(true); }
function removeNightlyPublish() { ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'publishTeamStatusAuto') ScriptApp.deleteTrigger(t); }); }
