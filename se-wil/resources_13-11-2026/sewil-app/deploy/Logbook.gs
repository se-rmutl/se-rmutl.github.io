/**
 * Logbook.gs — ส่วนที่ 2: บันทึกรายวัน แท็ก 305/304 สรุปรายสัปดาห์ และการรับรองของผู้นิเทศงาน
 */

var ENTRY_FIELDS_ = ['date', 'start', 'end', 'break_min', 'course', 'work_mode', 'activity', 'kind', 'absence_reason', 'absence_note', 'link_url', 'problems', 'learned'];
/** รูปหลักฐานใน logbook: 1 รูปต่อรายการ เก็บในโฟลเดอร์ของรายวิชา เปิดได้เฉพาะนักศึกษา อาจารย์นิเทศ ผู้ดูแล และผู้นิเทศงาน */
var LOG_PHOTO_SPEC_ = { folderKey: 'LOG_PHOTO_FOLDER_ID', folderName: 'รูป logbook' };
var LOG_PHOTO_MIMES_ = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function openPlacementOf_(email) {
  var p = placementOf_(email);
  if (!p) throw userError_('ยังไม่มีข้อมูลที่ฝึก กรุณากรอกและส่งข้อมูลที่ฝึกก่อน');
  if (LOGBOOK_OPEN_STATUSES.indexOf(p.status) < 0) throw userError_('บันทึก logbook ได้หลังหลักสูตรอนุมัติข้อมูลที่ฝึกแล้ว');
  return p;
}

function entriesOf_(email) {
  email = normEmail_(email);
  return readAll_('Logbook').filter(function (e) { return normEmail_(e.student_email) === email; });
}

function entryOut_(e) {
  var o = publicRow_(e, ['photo_file_id']);
  o.hours = Number(o.hours || 0);
  o.course = String(o.course);
  o.kind = e.kind === 'absence' ? 'absence' : 'work';
  o.has_photo = !!e.photo_file_id;
  return o;
}

/* ---------- นักศึกษา ---------- */

function api_logList(session) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var p = placementOf_(u.email);
    var entries = entriesOf_(u.email).sort(function (a, b) {
      return a.date === b.date ? String(a.start).localeCompare(String(b.start)) : (a.date < b.date ? 1 : -1);
    });
    var sem = semesterPayload_();
    var batches = readAll_('CertBatches').filter(function (b) { return normEmail_(b.student_email) === u.email; });
    var lastManual = batches.reduce(function (m, b) { return String(b.created_at) > m ? String(b.created_at) : m; }, '');
    return {
      ok: true, me: profile_(u), semester: sem,
      open: !!p && LOGBOOK_OPEN_STATUSES.indexOf(p.status) >= 0,
      placement: p ? { status: p.status, company_name: p.company_name, supervisor_name: p.supervisor_name, work_mode: p.work_mode } : null,
      entries: entries.map(entryOut_), summary: summarizeHours_(entries),
      expected: {
        '305': expectedHours_(sem.today, sem.start, sem.weekly305, sem.target305),
        '304': expectedHours_(sem.today, sem.start, sem.weekly304, sem.target304)
      },
      lastBatchAt: lastManual
    };
  });
}

function api_logSave(session, input) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    input = input || {};
    return withLock_(function () {
      var p = openPlacementOf_(u.email);
      var all = entriesOf_(u.email);
      var existing = null;
      if (input.entry_id) {
        existing = all.filter(function (e) { return e.entry_id === input.entry_id; })[0];
        if (!existing) return { ok: false, error: 'ไม่พบรายการ' };
        if (existing.status !== 'draft' && existing.status !== 'returned') return { ok: false, error: 'รายการที่ส่งรับรองแล้วแก้ไขไม่ได้' };
      }
      var absence = input.kind === 'absence';
      var e = {
        entry_id: existing ? existing.entry_id : '', kind: absence ? 'absence' : 'work',
        date: clip_(input.date, 10), start: absence ? '' : clip_(input.start, 5), end: absence ? '' : clip_(input.end, 5),
        break_min: absence ? 0 : Number(input.break_min || 0), course: absence ? '' : clip_(input.course, 3),
        work_mode: absence ? '' : clip_(input.work_mode, 10), activity: absence ? '' : clip_(input.activity, 1000),
        absence_reason: absence ? clip_(input.absence_reason, 10) : '', absence_note: absence ? clip_(input.absence_note, 200) : '',
        link_url: absence ? '' : splitLinks_(clip_(input.link_url, 1000)).join(' '),
        problems: absence ? '' : clip_(input.problems, 600), learned: absence ? '' : clip_(input.learned, 600)
      };
      var c = cfg_();
      var check = validateEntry_(e, {
        semesterStart: c.SEMESTER_START, semesterEnd: c.SEMESTER_END, today: todayStr_(),
        maxHoursPerDay: cfgNum_('MAX_HOURS_PER_DAY') || 12,
        sameDay: all.filter(function (o) { return o.date === e.date; }).map(function (o) { return Object.assign({}, o, { kind: o.kind === 'absence' ? 'absence' : 'work' }); })
      });
      if (!check.ok) return { ok: false, errors: check.errors, error: check.errors.join('\n') };
      ensureColumns_('Logbook');
      var now = nowIso_();
      var fields = {
        date: e.date, start: e.start, end: e.end, break_min: e.break_min, hours: check.hours, course: e.course,
        work_mode: e.work_mode, activity: e.activity, kind: e.kind, absence_reason: e.absence_reason, absence_note: e.absence_note,
        link_url: e.link_url, problems: e.problems, learned: e.learned, status: 'draft', batch_id: '', return_comment: '', updated_at: now
      };
      if (existing) {
        if (absence && existing.photo_file_id) {
          try { DriveApp.getFileById(existing.photo_file_id).setTrashed(true); } catch (x) { /* ไม่มีไฟล์แล้ว */ }
          fields.photo_file_id = '';
        }
        update_('Logbook', existing._row, fields);
      } else {
        e.entry_id = shortId_('E', 10);
        insert_('Logbook', Object.assign({ entry_id: e.entry_id, placement_id: p.placement_id, student_email: u.email, created_at: now, photo_file_id: '' }, fields));
      }
      return { ok: true, entry_id: e.entry_id, hours: check.hours, kind: e.kind };
    });
  });
}

function api_logDelete(session, entryId) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    return withLock_(function () {
      var e = findOne_('Logbook', function (r) { return r.entry_id === entryId && normEmail_(r.student_email) === u.email; });
      if (!e) return { ok: false, error: 'ไม่พบรายการ' };
      if (e.status !== 'draft' && e.status !== 'returned') return { ok: false, error: 'รายการที่ส่งรับรองแล้วลบไม่ได้' };
      if (e.photo_file_id) { try { DriveApp.getFileById(e.photo_file_id).setTrashed(true); } catch (x) { /* ไม่มีไฟล์แล้ว */ } }
      deleteRow_('Logbook', e._row);
      return { ok: true };
    });
  });
}

/* ---------- รูปหลักฐานใน logbook ---------- */

function ownEditableEntry_(u, entryId) {
  var e = findOne_('Logbook', function (r) { return r.entry_id === entryId && normEmail_(r.student_email) === u.email; });
  if (!e) throw userError_('ไม่พบรายการ');
  if (e.status !== 'draft' && e.status !== 'returned') throw userError_('รายการที่ส่งรับรองแล้วแก้ไขไม่ได้');
  if (e.kind === 'absence') throw userError_('รายการไม่ได้ปฏิบัติงานแนบรูปไม่ได้');
  return e;
}

/** นักศึกษาแนบหรือเปลี่ยนรูป 1 รูปต่อรายการ (หน้าเว็บย่อรูปก่อนส่ง) */
function api_logPhotoUpload(session, entryId, base64) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var maxMb = cfgNum_('MAX_UPLOAD_MB') || 5;
    base64 = String(base64 || '').replace(/^data:[^,]*,/, '');
    if (!base64) return { ok: false, error: 'ไม่พบไฟล์' };
    if (base64.length * 0.75 > maxMb * 1048576 + 4) return { ok: false, error: 'รูปใหญ่เกิน ' + maxMb + ' MB' };
    var bytes;
    try { bytes = Utilities.base64Decode(base64); } catch (x) { return { ok: false, error: 'อ่านไฟล์ไม่ได้' }; }
    var mime = sniffMime_(bytes);
    if (!LOG_PHOTO_MIMES_[mime]) return { ok: false, error: 'รูปต้องเป็นไฟล์ JPG PNG หรือ WebP' };
    return withLock_(function () {
      var e = ownEditableEntry_(u, String(entryId || ''));
      ensureColumns_('Logbook');
      var name = safeFileName_(String(u.student_id || 'student') + '_' + e.date + '_' + e.entry_id) + '.' + LOG_PHOTO_MIMES_[mime];
      var file = uploadFolder_(LOG_PHOTO_SPEC_).createFile(Utilities.newBlob(bytes, mime, name));
      if (e.photo_file_id) { try { DriveApp.getFileById(e.photo_file_id).setTrashed(true); } catch (x) { /* ไม่มีไฟล์แล้ว */ } }
      update_('Logbook', e._row, { photo_file_id: file.getId(), updated_at: nowIso_() });
      audit_(u.email, 'log_photo', e.entry_id, bytes.length + ' bytes');
      return { ok: true };
    });
  });
}

function api_logPhotoRemove(session, entryId) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    return withLock_(function () {
      var e = ownEditableEntry_(u, String(entryId || ''));
      if (!e.photo_file_id) return { ok: true };
      try { DriveApp.getFileById(e.photo_file_id).setTrashed(true); } catch (x) { /* ไม่มีไฟล์แล้ว */ }
      update_('Logbook', e._row, { photo_file_id: '', updated_at: nowIso_() });
      return { ok: true };
    });
  });
}

/** นักศึกษาเปิดรูปของตนเอง */
function api_logPhoto(session, entryId) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var e = findOne_('Logbook', function (r) { return r.entry_id === entryId && normEmail_(r.student_email) === u.email; });
    if (!e || !e.photo_file_id) return { ok: false, error: 'ไม่มีรูป' };
    return fileOut_(e.photo_file_id);
  });
}

/** อาจารย์นิเทศของนักศึกษาคนนั้นหรือผู้ดูแลเปิดรูป */
function api_adminLogPhoto(session, entryId) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    var e = findOne_('Logbook', function (r) { return r.entry_id === entryId; });
    if (!e || !canSeeStudent_(me, findUser_(e.student_email))) return { ok: false, error: 'ท่านไม่ได้เป็นอาจารย์นิเทศของนักศึกษาคนนี้' };
    if (!e.photo_file_id) return { ok: false, error: 'ไม่มีรูป' };
    return fileOut_(e.photo_file_id);
  });
}

/** ผู้นิเทศงานเปิดรูปของนักศึกษาที่ตนดูแล */
function api_svLogPhoto(k, entryId) {
  return safe_(function () {
    var sv = requireSupervisor_(k);
    var e = findOne_('Logbook', function (r) { return r.entry_id === entryId; });
    var p = e ? placementById_(e.placement_id) : null;
    if (!p || normEmail_(p.supervisor_email) !== sv.email) return { ok: false, error: 'ไม่พบรายการนี้ในความรับผิดชอบของท่าน' };
    if (!e.photo_file_id) return { ok: false, error: 'ไม่มีรูป' };
    return fileOut_(e.photo_file_id);
  });
}

/** นักศึกษาขอส่งรับรองทันที (วันละครั้ง) */
function api_logSendNow(session) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    return withLock_(function () {
      var p = openPlacementOf_(u.email);
      var dayAgo = new Date(Date.now() - 20 * 3600000).toISOString();
      var recent = readAll_('CertBatches').filter(function (b) {
        return normEmail_(b.student_email) === u.email && String(b.created_at) > dayAgo;
      });
      if (recent.length) return { ok: false, error: 'ส่งรับรองได้วันละครั้ง ระบบจะส่งรอบปกติทุกวัน' + dayTh_(cfg_().DIGEST_DAY) };
      var b = createBatchFor_(p, todayStr_());
      if (!b) return { ok: false, error: 'ไม่มีรายการร่างที่รอส่ง' };
      notifySupervisors_([normEmail_(p.supervisor_email)]);
      audit_(u.email, 'batch_send_now', b.batch_id, '');
      return { ok: true, batch_id: b.batch_id };
    });
  });
}

/* ---------- การสร้างชุดรับรองและสรุปรายสัปดาห์ ---------- */

/** รวมรายการร่างที่วันที่ไม่เกิน upToDate ของ placement เป็นชุดรับรองหนึ่งชุด */
function createBatchFor_(p, upToDate) {
  var email = normEmail_(p.student_email);
  var drafts = readAll_('Logbook').filter(function (e) {
    return normEmail_(e.student_email) === email && e.status === 'draft' && e.date <= upToDate;
  });
  if (!drafts.length) return null;
  var sum = summarizeHours_(drafts.map(function (e) { return { status: 'pending', course: e.course, hours: e.hours }; }));
  var batch = {
    batch_id: shortId_('B', 8), placement_id: p.placement_id, student_email: email,
    supervisor_email: normEmail_(p.supervisor_email), created_at: nowIso_(),
    entry_ids: drafts.map(function (e) { return e.entry_id; }).join(','),
    hours_305: sum.pending['305'], hours_304: sum.pending['304'], status: 'pending',
    decided_at: '', decided_by_name: '', comment: ''
  };
  insert_('CertBatches', batch);
  drafts.forEach(function (e) { update_('Logbook', e._row, { status: 'pending', batch_id: batch.batch_id, updated_at: nowIso_() }); });
  return batch;
}

/** ส่งอีเมลสรุปถึงผู้นิเทศงานที่มีชุดรอรับรอง (เฉพาะรายชื่อที่ให้มา หรือทั้งหมดถ้าไม่ระบุ) */
function notifySupervisors_(onlyEmails) {
  var pending = readAll_('CertBatches').filter(function (b) { return b.status === 'pending'; });
  var absentIds = {};
  readAll_('Logbook').forEach(function (e) { if (e.kind === 'absence') absentIds[e.entry_id] = true; });
  var placements = {};
  readAll_('Placements').forEach(function (p) { placements[p.placement_id] = p; });
  var bySv = {};
  pending.forEach(function (b) {
    var p = placements[b.placement_id];
    if (!p) return;
    var sv = normEmail_(p.supervisor_email);
    if (onlyEmails && onlyEmails.indexOf(sv) < 0) return;
    var key = normEmail_(b.student_email);
    bySv[sv] = bySv[sv] || {};
    var it = bySv[sv][key] = bySv[sv][key] || { student_name: p.student_name, student_id: p.student_id, hours_305: 0, hours_304: 0, count: 0, absences: 0 };
    it.hours_305 = round2_(it.hours_305 + Number(b.hours_305 || 0));
    it.hours_304 = round2_(it.hours_304 + Number(b.hours_304 || 0));
    String(b.entry_ids || '').split(',').filter(String).forEach(function (id) { if (absentIds[id]) it.absences++; else it.count++; });
  });
  var sent = 0;
  Object.keys(bySv).forEach(function (svEmail) {
    var anyP = null;
    Object.keys(placements).some(function (id) { if (normEmail_(placements[id].supervisor_email) === svEmail) { anyP = placements[id]; return true; } return false; });
    var sv = getOrCreateSupervisor_(svEmail, anyP ? anyP.supervisor_name : '');
    var items = Object.keys(bySv[svEmail]).map(function (k) { return bySv[svEmail][k]; });
    try { sendDigestEmail_(sv, items); sent++; } catch (e) { audit_('system', 'digest_mail_failed', svEmail, e.message); }
  });
  return sent;
}

function runDigest_() {
  return withLock_(function () {
    var today = todayStr_();
    var created = 0;
    readAll_('Placements').forEach(function (p) {
      if (LOGBOOK_OPEN_STATUSES.indexOf(p.status) < 0) return;
      if (createBatchFor_(p, today)) created++;
    });
    var sent = notifySupervisors_(null);
    cleanupSessions_();
    PropertiesService.getScriptProperties().setProperty('LAST_DIGEST_AT', nowIso_());
    audit_('system', 'digest', '', 'batches=' + created + ' emails=' + sent);
    return { batches: created, emails: sent };
  });
}

/** ตัวจัดเวลารายสัปดาห์เรียกฟังก์ชันนี้ (กันการเรียกถี่: ห่างกันอย่างน้อย 30 นาที) */
function job_weeklyDigest() {
  var active = '';
  try { active = Session.getActiveUser().getEmail(); } catch (e) { }
  var eff = '';
  try { eff = Session.getEffectiveUser().getEmail(); } catch (e) { }
  if (active && active !== eff) throw new Error('ไม่อนุญาต');
  var last = PropertiesService.getScriptProperties().getProperty('LAST_DIGEST_AT');
  if (last && Date.now() - Date.parse(last) < 30 * 60000) return { skipped: true };
  return runDigest_();
}

function api_adminRunDigest(session) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    var last = PropertiesService.getScriptProperties().getProperty('LAST_DIGEST_AT');
    if (last && Date.now() - Date.parse(last) < 10 * 60000) return { ok: false, error: 'เพิ่งส่งสรุปไปเมื่อไม่ถึง 10 นาทีที่แล้ว' };
    var r = runDigest_();
    audit_(me.email, 'digest_manual', '', JSON.stringify(r));
    return { ok: true, result: r };
  });
}

function cleanupSessions_() {
  var cutoff = Date.now() - 30 * DAY_MS_;
  var rows = readAll_('Sessions').filter(function (s) { return Date.parse(s.expires_at) < cutoff; });
  rows.sort(function (a, b) { return b._row - a._row; }).forEach(function (s) { deleteRow_('Sessions', s._row); });
}

/* ---------- ผู้นิเทศงาน ---------- */

function api_svGet(k) {
  return safe_(function () {
    var sv = requireSupervisor_(k);
    var mine = readAll_('Placements').filter(function (p) {
      return normEmail_(p.supervisor_email) === sv.email && ['agreement_sent', 'signed'].indexOf(p.status) >= 0;
    });
    var coOf = readAll_('Placements').filter(function (p) {
      return p.coadvisor_same !== 'yes' && normEmail_(p.coadvisor_email) === sv.email && ['agreement_sent', 'signed'].indexOf(p.status) >= 0;
    });
    var ids = mine.map(function (p) { return p.placement_id; });
    var batches = readAll_('CertBatches').filter(function (b) { return ids.indexOf(b.placement_id) >= 0; });
    var entries = {};
    readAll_('Logbook').forEach(function (e) { if (ids.indexOf(e.placement_id) >= 0) entries[e.entry_id] = entryOut_(e); });
    var pending = batches.filter(function (b) { return b.status === 'pending'; }).map(function (b) {
      var o = publicRow_(b);
      o.entries = String(b.entry_ids || '').split(',').filter(String).map(function (id) { return entries[id]; }).filter(Boolean)
        .sort(function (a, c) { return a.date === c.date ? String(a.start).localeCompare(String(c.start)) : (a.date < c.date ? -1 : 1); });
      var p = mine.filter(function (x) { return x.placement_id === b.placement_id; })[0];
      o.student_name = p ? p.student_name : ''; o.student_id = p ? p.student_id : '';
      return o;
    });
    var recent = batches.filter(function (b) { return b.status !== 'pending'; })
      .sort(function (a, b) { return String(b.decided_at).localeCompare(String(a.decided_at)); }).slice(0, 10)
      .map(function (b) {
        var o = publicRow_(b);
        var p = mine.filter(function (x) { return x.placement_id === b.placement_id; })[0];
        o.student_name = p ? p.student_name : '';
        return o;
      });
    var totals = mine.map(function (p) {
      var es = Object.keys(entries).map(function (id) { return entries[id]; }).filter(function (e) { return e.placement_id === p.placement_id; });
      var s = summarizeHours_(es);
      return { placement_id: p.placement_id, student_name: p.student_name, certified: s.certified, pending: s.pending };
    });
    return {
      ok: true, supervisor: { name: sv.name, email: sv.email }, coordinator: coordinator_(), head: programHead_(),
      agreements: mine.map(placementForSupervisor_), coadvisorOf: coOf.map(placementForSupervisor_),
      pending: pending, recent: recent, totals: totals, semester: semesterPayload_(), dayTh: dayTh_(cfg_().DIGEST_DAY),
      todo: supervisorTodo_(mine, pending)
    };
  });
}

/** ผู้นิเทศงานรับรองหรือส่งกลับรายการในชุด certifyIds + returnIds ต้องครบทุกรายการในชุด */
function api_svDecide(k, batchId, certifyIds, returnIds, comment) {
  return safe_(function () {
    var sv = requireSupervisor_(k);
    certifyIds = (certifyIds || []).map(String);
    returnIds = (returnIds || []).map(String);
    comment = clip_(comment, 600);
    if (returnIds.length && comment.length < 5) return { ok: false, error: 'กรุณาระบุเหตุผลที่ส่งกลับให้นักศึกษาแก้ไข' };
    return withLock_(function () {
      var b = findOne_('CertBatches', function (r) { return r.batch_id === batchId; });
      if (!b) return { ok: false, error: 'ไม่พบชุดรายการ' };
      var p = placementById_(b.placement_id);
      if (!p || normEmail_(p.supervisor_email) !== sv.email) return { ok: false, error: 'รายการนี้ไม่ได้อยู่ในความรับผิดชอบของท่าน' };
      if (b.status !== 'pending') return { ok: false, error: 'ชุดนี้ได้รับการพิจารณาแล้ว' };
      var ids = String(b.entry_ids || '').split(',').filter(String);
      var all = certifyIds.concat(returnIds);
      var overlap = certifyIds.some(function (id) { return returnIds.indexOf(id) >= 0; });
      var complete = ids.every(function (id) { return all.indexOf(id) >= 0; }) && all.every(function (id) { return ids.indexOf(id) >= 0; });
      if (overlap || !complete) return { ok: false, error: 'กรุณาเลือกให้ครบทุกรายการ (รับรองหรือส่งกลับ)' };
      var now = nowIso_();
      readAll_('Logbook').forEach(function (e) {
        if (ids.indexOf(e.entry_id) < 0) return;
        if (certifyIds.indexOf(e.entry_id) >= 0) update_('Logbook', e._row, { status: 'certified', updated_at: now });
        else update_('Logbook', e._row, { status: 'returned', return_comment: comment, updated_at: now });
      });
      var status = returnIds.length === 0 ? 'certified' : (certifyIds.length === 0 ? 'returned' : 'partial');
      update_('CertBatches', b._row, { status: status, decided_at: now, decided_by_name: sv.name || sv.email, comment: comment });
      if (returnIds.length) {
        try { sendEntriesReturnedEmail_(p.student_email, p.student_name, sv.name || sv.email, returnIds.length, comment); }
        catch (e) { audit_('system', 'return_mail_failed', p.student_email, e.message); }
      }
      audit_(sv.email, 'batch_' + status, b.batch_id, 'certified=' + certifyIds.length + ' returned=' + returnIds.length);
      return { ok: true, status: status };
    });
  });
}
