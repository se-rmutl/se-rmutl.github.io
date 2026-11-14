/**
 * Setup.gs — ตั้งค่าครั้งแรก เมนูในชีต และตัวจัดเวลา
 * ฟังก์ชันที่ไม่ลงท้ายด้วย _ ในไฟล์นี้รันได้เฉพาะเจ้าของระบบ (assertOwner_)
 */

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('SE-WIL')
      .addItem('1) ตั้งค่าระบบ (สร้างชีตและแม่แบบ)', 'setup')
      .addItem('2) ติดตั้งตัวจัดเวลาส่งสรุปรายสัปดาห์', 'installTriggers')
      .addSeparator()
      .addItem('ส่งสรุปรายสัปดาห์ตอนนี้', 'runDigestNow')
      .addItem('สร้างแม่แบบ SE-WIL01 ใหม่', 'rebuildTemplate')
      .addItem('ตรวจโควตาอีเมลวันนี้', 'showMailQuota')
      .addSeparator()
      .addItem('หลังส่งผลการเรียน: ลบ CV รูป และเบอร์มือถือนักศึกษา', 'purgePersonalData')
      .addToUi();
  } catch (e) { /* เรียกนอกชีต */ }
}

function setup() {
  assertOwner_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('ต้องรันจากสคริปต์ที่ผูกกับ Google Sheet (Extensions > Apps Script)');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  Object.keys(SCHEMA).forEach(function (name) { ensureSheet_(ss, name, SCHEMA[name]); });
  seedConfig_();
  resetConfigCache_();
  var me = Session.getEffectiveUser().getEmail();
  if (!findOne_('Users', function (u) { return String(u.role).toLowerCase() === 'admin'; })) {
    insert_('Users', { email: normEmail_(me), role: 'admin', student_id: '', name: 'ผู้ดูแลระบบ', section: '', advisor_email: '', active: 'TRUE' });
  }
  var co = coordinator_();
  if (co && co.email && !findOne_('Users', function (u) { return normEmail_(u.email) === co.email; })) {
    insert_('Users', { email: co.email, role: 'admin', student_id: '', name: co.name, section: '', advisor_email: '', active: 'TRUE' });
  }
  outputFolder_();
  templateDoc_();
  var msg = 'ตั้งค่าเสร็จแล้ว แม่แบบ SE-WIL01 และโฟลเดอร์ข้อตกลงอยู่ในโฟลเดอร์ "' + rootFolder_().getName() + '" ขั้นต่อไป: 1) ใส่รายชื่อในชีต Users 2) Deploy เป็นเว็บแอป 3) ใส่ URL ใน Config > APP_URL 4) ติดตั้งตัวจัดเวลา';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { }
  return msg;
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var current = sh.getLastColumn() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
  var missing = headers.filter(function (h) { return current.indexOf(h) < 0; });
  if (current.length === 0 || current.join('') === '') {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else if (missing.length) {
    sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
  sh.setFrozenRows(1);
  try { sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold'); } catch (e) { }
  return sh;
}

function seedConfig_() {
  var have = {};
  readAll_('Config').forEach(function (r) { have[String(r.key).trim()] = r; });
  CONFIG_DEFAULTS.forEach(function (r) {
    var cur = have[r[0]];
    if (!cur) insert_('Config', { key: r[0], value: r[1], note: r[2] });
    else if (r[2] && String(cur.note || '') !== r[2]) update_('Config', cur._row, { note: r[2] }); // ปรับคำอธิบาย ไม่แตะค่า
  });
}


function setConfig_(key, value) {
  var row = findOne_('Config', function (r) { return String(r.key).trim() === key; });
  if (row) update_('Config', row._row, { value: value });
  else insert_('Config', { key: key, value: value, note: '' });
  resetConfigCache_();
}

function installTriggers() {
  assertOwner_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'job_weeklyDigest') ScriptApp.deleteTrigger(t);
  });
  var day = String(cfg_().DIGEST_DAY || 'FRIDAY').toUpperCase();
  var hour = Math.max(0, Math.min(23, cfgNum_('DIGEST_HOUR') || 15));
  ScriptApp.newTrigger('job_weeklyDigest').timeBased().onWeekDay(ScriptApp.WeekDay[day]).atHour(hour).create();
  var msg = 'ติดตั้งแล้ว: ส่งสรุปทุกวัน' + dayTh_(day) + ' ประมาณ ' + hour + ':00 น.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { }
  return msg;
}

function runDigestNow() {
  assertOwner_();
  var r = runDigest_();
  var msg = 'สร้างชุดรับรอง ' + r.batches + ' ชุด ส่งอีเมล ' + r.emails + ' ฉบับ';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { }
  return msg;
}

function rebuildTemplate() {
  assertOwner_();
  var ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { }
  if (ui && ui.alert('สร้างแม่แบบ SE-WIL01 ใหม่', 'ระบบจะสร้างแม่แบบใหม่ตามโครงล่าสุด (ผู้ประสานงาน หัวหน้าหลักสูตร เบอร์โทร เว็บไซต์ และแผนที่) ' +
      'แม่แบบเดิมจะเปลี่ยนชื่อขึ้นต้นด้วย [เลิกใช้] และยังอยู่ในไดรฟ์ ถ้าเคยแก้ข้อความในแม่แบบเดิม ต้องแก้ซ้ำในแม่แบบใหม่ ข้อตกลงที่ออกไปแล้วไม่เปลี่ยน ดำเนินการต่อหรือไม่', ui.ButtonSet.YES_NO) !== ui.Button.YES) return 'ยกเลิก';
  var oldId = cfg_().TEMPLATE_DOC_ID;
  if (oldId) {
    try { var f = DriveApp.getFileById(oldId); if (f.getName().indexOf('[เลิกใช้]') !== 0) f.setName('[เลิกใช้] ' + f.getName()); } catch (e) { }
  }
  setConfig_('TEMPLATE_DOC_ID', '');
  var id = buildTemplate_();
  audit_(Session.getEffectiveUser().getEmail(), 'template_rebuilt', id, oldId || '');
  var msg = 'สร้างแม่แบบใหม่แล้ว: https://docs.google.com/document/d/' + id + '/edit';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { }
  return msg;
}

function purgePersonalData() {
  assertOwner_();
  var ui = SpreadsheetApp.getUi();
  var ans = ui.alert('ลบข้อมูลส่วนบุคคลหลังจบภาค',
    'ระบบจะย้ายไฟล์ CV และรูปสถานประกอบการทั้งหมดไปถังขยะ และลบเบอร์มือถือนักศึกษาในชีต Placements ' +
    'ข้อตกลง SE-WIL01 และ logbook ยังเก็บไว้ ทำเมื่อส่งผลการเรียนและพ้นช่วงอุทธรณ์แล้วเท่านั้น ดำเนินการต่อหรือไม่', ui.ButtonSet.YES_NO);
  if (ans !== ui.Button.YES) return 'ยกเลิก';
  var n = purgePersonalData_();
  var msg = 'ลบแล้ว: CV ' + n.cv + ' ไฟล์ รูป ' + n.photo + ' ไฟล์ เบอร์มือถือ ' + n.phone + ' รายการ ไฟล์อยู่ในถังขยะของ Drive 30 วัน';
  ui.alert(msg);
  return msg;
}

function showMailQuota() {
  assertOwner_();
  var msg = 'โควตาอีเมลที่เหลือวันนี้: ' + MailApp.getRemainingDailyQuota() + ' ผู้รับ';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { }
  return msg;
}
