/**
 * ENGSE300 · สคริปต์สำหรับ Google Sheet ของอาจารย์ (บันทึกการเรียนและผลประเมิน)
 *
 * ทำ 2 อย่าง:
 *   1. สร้างแบบทดสอบ A1 เป็น Google Form จากคลังข้อสอบบนเว็บรายวิชา (data.js → quizA1)
 *      คำตอบลงแผ่นใหม่ในชีตนี้ และเก็บลิงก์ฟอร์มไว้ที่แผ่น "ภาพรวม"
 *   2. ซิงก์: อ่านคะแนน A1 จากฟอร์ม และอ่านสมุดงาน A2/A5 ของนักศึกษาแต่ละคน
 *      แล้วเขียนลงแผ่น "ข้อมูลซิงก์" (แผ่น "กิจกรรม" ดึงค่าไปแสดงเอง)
 *
 * ติดตั้งครั้งเดียว:
 *   1. เปิดชีตของอาจารย์ > ส่วนขยาย > Apps Script แล้ววางไฟล์นี้ทั้งไฟล์ บันทึก
 *   2. กลับมาที่ชีต รีเฟรช จะมีเมนู ENGSE300
 *   3. ENGSE300 > สร้างแบบทดสอบ A1 (ครั้งแรกจะขอสิทธิ์ Forms, Sheets, Drive, External requests)
 *   4. นำ "ลิงก์ฟอร์ม A1 สำหรับนักศึกษา" ในแผ่นภาพรวมไปใส่ quizA1.formUrl ใน data.js
 *   5. ENGSE300 > ตั้งซิงก์อัตโนมัติทุกคืน (หรือกดซิงก์เองเมื่อต้องการ)
 *
 * นักศึกษาต้องแชร์สมุดงานให้บัญชีที่รันสคริปต์นี้ (สิทธิ์ผู้แสดงความคิดเห็นก็พอ)
 * และสมุดงานต้องเป็นไฟล์ Google Sheets ไม่ใช่ .xlsx ที่อัปโหลดไว้เฉยๆ
 * สคริปต์อ่านสมุดงานอย่างเดียว ไม่แก้ไฟล์ของนักศึกษา
 */

var DATA_URL = 'https://se-rmutl.github.io/engse300/data.js';

var SHEET = { summary: 'ภาพรวม', acts: 'กิจกรรม', sync: 'ข้อมูลซิงก์' };
var CELL = { formEdit: 'B9', formPublic: 'B10', lastSync: 'B11', syncNote: 'B12' };
var ACT = { firstRow: 6, idCol: 2, linkCol: 4 };          // แผ่นกิจกรรม: แถวแรกของนักศึกษา, คอลัมน์ B รหัส, D ลิงก์ที่อาจารย์ใส่เอง
var A5_ROUNDS = 3;                                         // รอบสรุป A5: สัปดาห์ 8, 10, 12

// ตำแหน่งในสมุดงานนักศึกษา (แม่แบบ ENGSE300-A2-A5-workbook)
var WB = {
  info:    { sheet: 'วิธีใช้', range: 'B5:B8' },                       // รหัส, ชื่อ, อีเมล, กลุ่ม
  self:    { sheet: 'A2 วิเคราะห์ตนเอง', range: 'B5:B6' },             // ตำแหน่ง 1, 2
  targets: { sheet: 'A2 บริษัทเป้าหมาย', range: 'B6:B15' },            // ชื่อบริษัท 10 แถว
  log:     { sheet: 'A5 บันทึกการสมัคร', range: 'A6:L35' },             // C บริษัท, G สถานะ
  rounds:  { sheet: 'A5 สรุปทุก 2 สัปดาห์', range: 'C18:G20' }        // C วันที่อัปเดต, E สิ่งที่ทำ
};

var Q_ID = 'รหัสนักศึกษา';
var Q_LINK = 'ลิงก์สมุดงาน A2/A5 (Google Sheets)';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ENGSE300')
    .addItem('ซิงก์ข้อมูลตอนนี้', 'syncAll')
    .addSeparator()
    .addItem('สร้างแบบทดสอบ A1', 'createA1Quiz')
    .addItem('ตั้งซิงก์อัตโนมัติทุกคืน', 'installNightlySync')
    .addItem('ยกเลิกซิงก์อัตโนมัติ', 'removeNightlySync')
    .addToUi();
}

/* ------------------------------------------------------------------ A1 form */

function createA1Quiz() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sum = ss.getSheetByName(SHEET.summary);
  if (sum.getRange(CELL.formEdit).getValue()) {
    var ui = SpreadsheetApp.getUi();
    var ok = ui.alert('มีฟอร์ม A1 อยู่แล้ว', 'สร้างฟอร์มใหม่แทนลิงก์เดิมหรือไม่ (ฟอร์มเดิมยังอยู่ใน Drive)', ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) return;
  }
  var Q = loadQuiz_();
  var form = FormApp.create(Q.formTitle);
  form.setDescription(Q.formDescription);
  form.setIsQuiz(true);
  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('ส่งคำตอบแล้ว ดูคะแนนได้จากปุ่ม "ดูคะแนน" ถ้ายังไม่ถึง ' + Q.passScore + ' คะแนน อ่านคำอธิบายแล้วทำใหม่ได้');

  form.addSectionHeaderItem().setTitle('ข้อมูลนักศึกษา');
  form.addTextItem().setTitle(Q_ID).setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('กรอกรหัสนักศึกษา เช่น 67543210003-9')
      .requireTextMatchesPattern('^[0-9-]{8,15}$').build());
  form.addTextItem().setTitle('ชื่อ-นามสกุล').setRequired(true);
  form.addMultipleChoiceItem().setTitle('กลุ่ม').setRequired(true)
    .setChoiceValues(['ภาคปกติ (ม.6 หรือ ปวช.)', 'เทียบโอน (ปวส.)']);
  form.addTextItem().setTitle(Q_LINK)
    .setHelpText('ลิงก์ไฟล์ Google Sheets ที่ทำสำเนาจากแม่แบบและแชร์ให้อาจารย์แล้ว ใส่ครั้งแรกครั้งเดียว ทำแบบทดสอบซ้ำเว้นว่างได้')
    .setValidation(FormApp.createTextValidation().requireTextIsUrl().build());

  form.addPageBreakItem().setTitle('แบบทดสอบ ' + Q.questions.length + ' ข้อ')
    .setHelpText('ผ่านเมื่อได้อย่างน้อย ' + Q.passScore + ' คะแนน');
  Q.questions.forEach(function (q, n) {
    var item = form.addMultipleChoiceItem();
    item.setTitle((n + 1) + '. ' + q.q)
      .setHelpText(q.topic)
      .setPoints(1)
      .setRequired(true)
      .setChoices(q.choices.map(function (c, k) { return item.createChoice(c, k === q.answer); }))
      .setFeedbackForCorrect(FormApp.createFeedback().setText(q.explain).build())
      .setFeedbackForIncorrect(FormApp.createFeedback().setText(q.explain).build());
  });

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  sum.getRange(CELL.formEdit).setValue(form.getEditUrl());
  sum.getRange(CELL.formPublic).setValue(form.getPublishedUrl());
  SpreadsheetApp.getUi().alert('สร้างฟอร์ม A1 แล้ว',
    'ลิงก์สำหรับนักศึกษาอยู่ที่แผ่น "ภาพรวม" ช่อง ' + CELL.formPublic + '\nนำไปใส่ quizA1.formUrl ใน data.js', SpreadsheetApp.getUi().ButtonSet.OK);
}

function loadQuiz_() {
  var src = UrlFetchApp.fetch(DATA_URL + '?t=' + Date.now()).getContentText('UTF-8');
  var sandbox = {};
  new Function('window', src)(sandbox);
  var Q = sandbox.ENGSE300 && sandbox.ENGSE300.quizA1;
  if (!Q || !Q.questions || !Q.questions.length) throw new Error('ไม่พบ quizA1 ใน ' + DATA_URL);
  Q.questions.forEach(function (q, n) {
    if (!q.choices || q.answer < 0 || q.answer >= q.choices.length) throw new Error('ข้อที่ ' + (n + 1) + ' เฉลยไม่ถูกต้อง');
  });
  return Q;
}

/* ------------------------------------------------------------------ sync */

function syncAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sum = ss.getSheetByName(SHEET.summary);
  var acts = ss.getSheetByName(SHEET.acts);
  var out = ss.getSheetByName(SHEET.sync);
  var tz = ss.getSpreadsheetTimeZone();
  var now = new Date();

  var last = acts.getLastRow();
  var roster = last < ACT.firstRow ? [] : acts.getRange(ACT.firstRow, 1, last - ACT.firstRow + 1, 4).getValues()
    .map(function (r) { return { id: String(r[ACT.idCol - 1]).trim(), manual: String(r[ACT.linkCol - 1]).trim() }; })
    .filter(function (s) { return s.id; });

  var a1 = readA1_(sum.getRange(CELL.formEdit).getValue());
  var rows = [], opened = 0;
  roster.forEach(function (s) {
    var k = key_(s.id);
    var q = a1[k] || {};
    var link = s.manual || q.link || '';
    var w = link ? readWorkbook_(link, k) : { status: 'ยังไม่ส่งลิงก์' };
    if (/^เปิดได้/.test(w.status)) opened++;
    rows.push([
      "'" + s.id, link, w.status, w.id || '', w.group || '', w.pos1 || '', w.pos2 || '',
      num_(w.targets), num_(w.applied), num_(w.interview), num_(w.accepted), num_(w.confirmed),
      w.company || '', w.latest || '', w.rounds === undefined ? '' : w.rounds + '/' + A5_ROUNDS,
      w.a2 || '', w.a5 || '',
      q.best === undefined ? '' : q.best, q.tries || '', q.last ? Utilities.formatDate(q.last, tz, 'd/M/yyyy HH:mm') : '',
      q.email || '', Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm')
    ]);
  });

  var width = 22;
  if (out.getLastRow() > 1) out.getRange(2, 1, out.getLastRow() - 1, width).clearContent();
  if (rows.length) out.getRange(2, 1, rows.length, width).setValues(rows);

  var responses = Object.keys(a1).reduce(function (n, k) { return n + (a1[k].tries || 0); }, 0);
  sum.getRange(CELL.lastSync).setValue(Utilities.formatDate(now, tz, 'd/M/yyyy HH:mm'));
  sum.getRange(CELL.syncNote).setValue('เปิดสมุดงานได้ ' + opened + '/' + roster.length + ' · คำตอบ A1 ' + responses + ' ครั้ง');
}

/** คะแนน A1 รายคน: คะแนนสูงสุด จำนวนครั้ง ครั้งล่าสุด อีเมล และลิงก์สมุดงานล่าสุดที่ส่งมา */
function readA1_(editUrl) {
  var by = {};
  if (!editUrl) return by;
  var form = FormApp.openByUrl(editUrl);
  form.getResponses().forEach(function (r) {
    var id = '', link = '';
    r.getItemResponses().forEach(function (ir) {
      var t = ir.getItem().getTitle();
      if (t === Q_ID) id = String(ir.getResponse()).trim();
      if (t === Q_LINK) link = String(ir.getResponse() || '').trim();
    });
    if (!id) return;
    var score = r.getGradableItemResponses().reduce(function (n, g) { return n + (Number(g.getScore()) || 0); }, 0);
    var k = key_(id), s = by[k] || (by[k] = { tries: 0 });
    s.tries++;
    if (s.best === undefined || score > s.best) s.best = score;
    var ts = r.getTimestamp();
    if (!s.last || ts > s.last) { s.last = ts; s.email = r.getRespondentEmail(); }
    if (link && (!s.linkTs || ts > s.linkTs)) { s.link = link; s.linkTs = ts; }
  });
  return by;
}

/** อ่านสมุดงานของนักศึกษา 1 คน (อ่านอย่างเดียว) */
function readWorkbook_(link, rosterKey) {
  var m = String(link).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (!m) return { status: 'เปิดไม่ได้: ลิงก์ไม่ใช่ Google Sheets' };
  var book;
  try { book = SpreadsheetApp.openById(m[1]); }
  catch (e) { return { status: 'เปิดไม่ได้: ยังไม่แชร์ให้อาจารย์ หรือยังเป็นไฟล์ .xlsx' }; }
  function get(part) {
    var sh = book.getSheetByName(part.sheet);
    if (!sh) throw new Error('ไม่พบแผ่น ' + part.sheet);
    return sh.getRange(part.range).getDisplayValues();
  }
  try {
    var info = get(WB.info), self = get(WB.self), targets = get(WB.targets), log = get(WB.log), rounds = get(WB.rounds);
  } catch (e) {
    return { status: 'เปิดได้แต่ไม่ใช่แม่แบบ ENGSE300 (' + e.message + ')' };
  }
  var w = { id: info[0][0].trim(), group: info[3][0].trim(), pos1: self[0][0].trim(), pos2: self[1][0].trim() };
  w.targets = targets.filter(function (r) { return r[0].trim(); }).length;
  var apps = log.filter(function (r) { return r[2].trim(); });               // C บริษัท
  var st = function (r) { return r[6].trim(); };                               // G สถานะ
  w.applied = apps.length;
  w.interview = apps.filter(function (r) { return /^(นัดสัมภาษณ์|สัมภาษณ์แล้ว)/.test(st(r)); }).length;
  w.accepted = apps.filter(function (r) { return st(r) === 'ได้รับการตอบรับ'; }).length;
  var conf = apps.filter(function (r) { return st(r) === 'ยืนยันที่ฝึกแล้ว'; });
  w.confirmed = conf.length;
  w.company = conf.length ? conf[0][2].trim() : '';
  w.latest = apps.length ? st(apps[apps.length - 1]) : '';
  w.rounds = rounds.filter(function (r) { return r[0].trim() || r[2].trim(); }).length;   // C วันที่ หรือ E สิ่งที่ทำ
  w.status = (w.id && key_(w.id) !== rosterKey) ? 'เปิดได้ (รหัสในไฟล์ไม่ตรง)' : 'เปิดได้';
  w.a2 = (w.pos1 || 'ยังไม่ระบุตำแหน่ง') + ' · ' + w.targets + ' บริษัท';
  w.a5 = 'สมัคร ' + w.applied + ' · สัมภาษณ์ ' + w.interview + ' · รอบ ' + w.rounds + '/' + A5_ROUNDS + (w.latest ? ' · ล่าสุด: ' + w.latest : '');
  return w;
}

function key_(id) { return String(id).replace(/\D/g, ''); }
function num_(n) { return n === undefined ? '' : n; }

/* ------------------------------------------------------------------ triggers */

function installNightlySync() {
  removeNightlySync();
  ScriptApp.newTrigger('syncAll').timeBased().everyDays(1).atHour(1).create();
  SpreadsheetApp.getUi().alert('ตั้งซิงก์อัตโนมัติแล้ว: ทุกคืนประมาณ 01:00–02:00 น.');
}

function removeNightlySync() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(t);
  });
}
