/**
 * Reset.gs — เครื่องมือรีเซ็ตเพื่อทดสอบ (v1.9) ผู้ดูแล (admin) ทำให้นักศึกษา ผู้นิเทศงาน หรืออาจารย์นิเทศ
 * กลับไปเหมือนเพิ่งเข้าระบบครั้งแรก ใช้ทดลองแต่ละบทบาท
 *
 * ความปลอดภัย
 *  - เปิดใช้เมื่อ Config RESET_ENABLED = TRUE (ปิดเมื่อเริ่มใช้จริง กล่องสิ่งที่ต้องทำเตือนหลังวันเปิดภาค)
 *  - ต้องพิมพ์อีเมลของผู้ถูกรีเซ็ตซ้ำเพื่อยืนยัน และทำภายใต้ lock
 *  - ทุกแถวที่ลบหรือแก้เก็บสำเนา JSON ไว้ในชีต Trash ไฟล์ใน Drive ย้ายไปถังขยะ (กู้คืนได้ 30 วัน) และบันทึกใน Audit
 *
 * นักศึกษา: ลบข้อมูลที่ฝึก ไฟล์แนบ ข้อตกลง logbook (รวมรูป) ชุดรับรอง และการเข้าระบบ ล้างอาจารย์นิเทศได้ (เลือก)
 * ผู้นิเทศงาน: ลบลิงก์เฉพาะคน (ได้ลิงก์ใหม่เมื่อระบบส่งอีเมลครั้งถัดไป) ข้อตกลงที่ยืนยันแล้วกลับเป็นรอยืนยัน
 *             ชุดรับรองถูกลบ และรายการ logbook ที่ส่งรับรองแล้วกลับเป็นร่าง
 * อาจารย์นิเทศ: ล้างการจับคู่นักศึกษาทั้งหมดของท่าน และการเข้าระบบ
 */

var TRASH_HEADERS_ = ['ts', 'actor', 'reason', 'sheet', 'row_json'];

function resetEnabled_() { return String(cfg_().RESET_ENABLED || '').toUpperCase() === 'TRUE'; }

function trashSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName('Trash');
  if (!sh) sh = ss.insertSheet('Trash');
  if (sh.getLastRow() < 1) sh.getRange(1, 1, 1, TRASH_HEADERS_.length).setValues([TRASH_HEADERS_]);
  return sh;
}

/** เก็บสำเนาแถวไว้ในชีต Trash ก่อนลบหรือแก้ */
function archiveRows_(sheetName, rows, actor, reason) {
  if (!rows.length) return;
  var sh = trashSheet_(), now = nowIso_();
  rows.forEach(function (r) {
    var o = {};
    Object.keys(r).forEach(function (k) { if (k !== '_row') o[k] = r[k]; });
    sh.appendRow([now, actor, reason, sheetName, "'" + JSON.stringify(o)]);
  });
}

/** ลบแถวจากล่างขึ้นบน เลขแถวที่เหลือจะไม่เลื่อน */
function deleteRowsDesc_(sheetName, rows) {
  rows.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
    .forEach(function (n) { deleteRow_(sheetName, n); });
}

function trashFile_(id) {
  if (!id) return 0;
  try { DriveApp.getFileById(id).setTrashed(true); return 1; } catch (e) { return 0; }
}

/** แผนการรีเซ็ต: คืนแถวที่จะถูกลบหรือแก้ โดยยังไม่แตะข้อมูล */
function resetPlan_(kind, email) {
  email = normEmail_(email);
  var plan = { kind: kind, email: email, name: '', counts: {}, ok: true, error: '' };
  if (kind === 'student') {
    var u = findUser_(email);
    if (!u || u.role !== 'student') return { ok: false, error: 'ไม่พบนักศึกษาอีเมลนี้ในชีต Users' };
    plan.name = u.name || email;
    plan.placements = readAll_('Placements').filter(function (p) { return normEmail_(p.student_email) === email; });
    plan.entries = readAll_('Logbook').filter(function (e) { return normEmail_(e.student_email) === email; });
    plan.batches = readAll_('CertBatches').filter(function (b) { return normEmail_(b.student_email) === email; });
    plan.sessions = readAll_('Sessions').filter(function (s) { return normEmail_(s.email) === email; });
    plan.advisor = u.advisor_email || '';
    var files = 0;
    plan.placements.forEach(function (p) { ['cv_file_id', 'company_photo_id', 'reply_file_id', 'agreement_doc_id', 'agreement_pdf_id'].forEach(function (k) { if (p[k]) files++; }); });
    plan.entries.forEach(function (e) { if (e.photo_file_id) files++; });
    plan.counts = { placement: plan.placements.length, status: plan.placements[0] ? plan.placements[0].status : 'none', entries: plan.entries.length, batches: plan.batches.length, files: files, sessions: plan.sessions.length, advisor: plan.advisor };
    plan.warnings = studentResetWarnings_(plan);
  } else if (kind === 'supervisor') {
    plan.svRows = readAll_('Supervisors').filter(function (s) { return normEmail_(s.email) === email; });
    plan.placements = readAll_('Placements').filter(function (p) { return normEmail_(p.supervisor_email) === email; });
    if (!plan.svRows.length && !plan.placements.length) return { ok: false, error: 'ไม่พบผู้นิเทศงานอีเมลนี้' };
    plan.name = (plan.svRows[0] && plan.svRows[0].name) || (plan.placements[0] && plan.placements[0].supervisor_name) || email;
    var ids = plan.placements.map(function (p) { return p.placement_id; });
    plan.signed = plan.placements.filter(function (p) { return p.status === 'signed'; });
    plan.batches = readAll_('CertBatches').filter(function (b) { return ids.indexOf(b.placement_id) >= 0; });
    plan.entries = readAll_('Logbook').filter(function (e) { return ids.indexOf(e.placement_id) >= 0 && e.status !== 'draft'; });
    plan.counts = { link: plan.svRows.length, students: plan.placements.length, signed: plan.signed.length, batches: plan.batches.length, entries: plan.entries.length };
  } else if (kind === 'teacher') {
    var t = findUser_(email);
    if (!t || !isStaff_(t)) return { ok: false, error: 'ไม่พบอาจารย์อีเมลนี้ในชีต Users' };
    plan.name = t.name || email;
    plan.advisees = readAll_('Users').filter(function (r) { return normEmail_(r.advisor_email) === email; });
    plan.sessions = readAll_('Sessions').filter(function (s) { return normEmail_(s.email) === email; });
    plan.counts = { advisees: plan.advisees.length, sessions: plan.sessions.length };
  } else return { ok: false, error: 'ชนิดไม่ถูกต้อง' };
  return plan;
}

/**
 * สิ่งที่ออกไปนอกระบบแล้วและการรีเซ็ตตามไปแก้ไม่ได้ (v1.9.1) แสดงในหน้าดูสิ่งที่จะถูกล้าง
 * ผู้ประสานงานต้องแจ้งหรือแก้เอง
 */
function studentResetWarnings_(plan) {
  var w = [], p = plan.placements[0], email = plan.email;
  if (p && p.agreement_no) {
    w.push('ข้อตกลง ' + p.agreement_no + (p.status === 'signed' ? ' ซึ่งผู้นิเทศงานยืนยันแล้ว' : '') + ' ส่งอีเมลถึงผู้นิเทศงาน ' +
      (p.supervisor_email || '') + ' และนักศึกษาไปแล้ว ลิงก์ PDF ในอีเมลนั้นจะเปิดไม่ได้ เมื่ออนุมัติใหม่ระบบออกเลขใหม่ (ไม่ใช้เลขเดิมซ้ำ) ควรแจ้งผู้นิเทศงานว่าจะได้ฉบับใหม่');
  }
  if (plan.batches.length) {
    w.push('ลิงก์รับรอง logbook ' + plan.batches.length + ' ชุดในอีเมลของผู้นิเทศงานจะขึ้นว่าไม่พบชุดรายการ');
  }
  if (p) {
    var letters = [];
    try {
      letters = readAll_('Audit').filter(function (a) {
        return a.action === 'letter_link' && (normEmail_(a.target) === email || a.target === 'all:filled' || a.target === 'all:noreply');
      });
    } catch (e) { }
    if (letters.length) w.push('เคยสร้างลิงก์หรือพิมพ์แบบตอบรับ SE-WIL00 ที่มีข้อมูลแล้ว ใบที่พิมพ์และลงนามไปแล้วยังเป็นข้อมูลเดิม ถ้าเปลี่ยนที่ฝึกต้องพิมพ์และลงนามใหม่');
  }
  var memo = docMemoAt_();
  if (memo && (p || plan.advisor)) {
    w.push('ออกบันทึกขออนุมัติแต่งตั้งอาจารย์นิเทศไปแล้วเมื่อ ' + String(memo).slice(0, 10) + ' ถ้าส่งคณะแล้ว ชื่ออาจารย์นิเทศและสถานประกอบการของนักศึกษาคนนี้ในฉบับนั้นไม่เปลี่ยนตาม ต้องแจ้งแก้ไขเอง');
  }
  return w;
}

function runReset_(plan, actor, opts) {
  var reason = 'reset_' + plan.kind + ':' + plan.email, now = nowIso_(), done = {};
  if (plan.kind === 'student') {
    archiveRows_('Placements', plan.placements, actor, reason);
    archiveRows_('Logbook', plan.entries, actor, reason);
    archiveRows_('CertBatches', plan.batches, actor, reason);
    var files = 0;
    plan.placements.forEach(function (p) { ['cv_file_id', 'company_photo_id', 'reply_file_id', 'agreement_doc_id', 'agreement_pdf_id'].forEach(function (k) { files += trashFile_(p[k]); }); });
    plan.entries.forEach(function (e) { files += trashFile_(e.photo_file_id); });
    deleteRowsDesc_('Logbook', plan.entries);
    deleteRowsDesc_('CertBatches', plan.batches);
    deleteRowsDesc_('Placements', plan.placements);
    deleteRowsDesc_('Sessions', plan.sessions);
    if (opts && opts.clearAdvisor && plan.advisor) {
      var row = findOne_('Users', function (r) { return normEmail_(r.email) === plan.email; });
      if (row) { archiveRows_('Users', [row], actor, reason); update_('Users', row._row, { advisor_email: '', advisor_set_by: '', advisor_set_at: '' }); }
    }
    done = { placement: plan.placements.length, entries: plan.entries.length, batches: plan.batches.length, files: files, advisorCleared: !!(opts && opts.clearAdvisor && plan.advisor) };
  } else if (plan.kind === 'supervisor') {
    archiveRows_('Supervisors', plan.svRows, actor, reason);
    archiveRows_('Placements', plan.signed, actor, reason);
    archiveRows_('CertBatches', plan.batches, actor, reason);
    archiveRows_('Logbook', plan.entries, actor, reason);
    plan.signed.forEach(function (p) {
      update_('Placements', p._row, { status: 'agreement_sent', accepted_by_name: '', accepted_at: '', accepted_via: '', updated_at: now });
    });
    plan.entries.forEach(function (e) { update_('Logbook', e._row, { status: 'draft', batch_id: '', return_comment: '', updated_at: now }); });
    deleteRowsDesc_('CertBatches', plan.batches);
    deleteRowsDesc_('Supervisors', plan.svRows);
    done = { link: plan.svRows.length, unsigned: plan.signed.length, batches: plan.batches.length, entriesToDraft: plan.entries.length };
  } else if (plan.kind === 'teacher') {
    archiveRows_('Users', plan.advisees, actor, reason);
    plan.advisees.forEach(function (r) { update_('Users', r._row, { advisor_email: '', advisor_set_by: '', advisor_set_at: '' }); });
    deleteRowsDesc_('Sessions', plan.sessions);
    done = { advisees: plan.advisees.length };
  }
  audit_(actor, 'reset_' + plan.kind, plan.email, JSON.stringify(done));
  return done;
}

/** รายชื่อสำหรับเลือกรีเซ็ต (admin) */
function api_resetTargets(session) {
  return safe_(function () {
    requireUser_(session, ['admin']);
    if (!resetEnabled_()) return { ok: true, enabled: false };
    var placements = {};
    readAll_('Placements').forEach(function (p) { placements[normEmail_(p.student_email)] = p; });
    var users = readAll_('Users').map(findUserFromRow_);
    var students = users.filter(function (u) { return u.role === 'student'; }).map(function (u) {
      var p = placements[u.email];
      return { email: u.email, name: u.name, student_id: u.student_id, active: u.active, status: p ? p.status : 'none' };
    });
    var count = {};
    readAll_('Placements').forEach(function (p) { var k = normEmail_(p.supervisor_email); if (k) count[k] = (count[k] || 0) + 1; });
    var svNames = {};
    readAll_('Supervisors').forEach(function (s) { svNames[normEmail_(s.email)] = s.name || ''; });
    var supervisors = Object.keys(count).concat(Object.keys(svNames).filter(function (k) { return !count[k]; })).map(function (k) {
      return { email: k, name: svNames[k] || '', students: count[k] || 0 };
    });
    var adv = {};
    users.forEach(function (u) { if (u.advisor_email) adv[u.advisor_email] = (adv[u.advisor_email] || 0) + 1; });
    var teachers = users.filter(isStaff_).map(function (u) { return { email: u.email, name: u.name, role: u.role, advisees: adv[u.email] || 0 }; });
    return { ok: true, enabled: true, students: students, supervisors: supervisors, teachers: teachers };
  });
}

/** ดูก่อนว่าจะล้างอะไร (admin) */
function api_resetPreview(session, kind, email) {
  return safe_(function () {
    requireUser_(session, ['admin']);
    if (!resetEnabled_()) return { ok: false, error: 'เครื่องมือรีเซ็ตปิดอยู่ (Config RESET_ENABLED)' };
    var plan = resetPlan_(kind, email);
    if (!plan.ok) return { ok: false, error: plan.error };
    return { ok: true, kind: plan.kind, email: plan.email, name: plan.name, counts: plan.counts, warnings: plan.warnings || [] };
  });
}

/** รีเซ็ต (admin) confirmEmail ต้องตรงกับ email opts = { clearAdvisor: true|false } */
function api_resetRole(session, kind, email, confirmEmail, opts) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    if (!resetEnabled_()) return { ok: false, error: 'เครื่องมือรีเซ็ตปิดอยู่ (Config RESET_ENABLED)' };
    email = normEmail_(email);
    if (!email || normEmail_(confirmEmail) !== email) return { ok: false, error: 'พิมพ์อีเมลยืนยันให้ตรงกับผู้ที่จะรีเซ็ต' };
    return withLock_(function () {
      var plan = resetPlan_(kind, email);
      if (!plan.ok) return { ok: false, error: plan.error };
      if (email === me.email) plan.sessions = []; // รีเซ็ตบทบาทอาจารย์ของตัวเอง: ไม่ตัดการเข้าระบบที่กำลังใช้
      var done = runReset_(plan, me.email, opts || {});
      return { ok: true, kind: kind, email: email, done: done };
    });
  });
}
