/**
 * Placement.gs — ส่วนที่ 1: ทะเบียนที่ฝึก ข้อตกลง SE-WIL01 การอนุมัติ และการยอมรับของสถานประกอบการ
 */

/** ช่องที่นักศึกษากรอกได้ และความยาวสูงสุด */
var PLACEMENT_FIELDS_ = {
  student_phone: 40,
  company_name: 200, company_type: 60, company_address: 400, province: 80,
  company_phone: 40, company_website: 300, company_map_url: 500,
  same_as_301: 3, change_reason: 600,
  supervisor_name: 120, supervisor_position: 120, supervisor_email: 120, supervisor_phone: 40,
  coadvisor_same: 3, coadvisor_name: 120, coadvisor_position: 120, coadvisor_email: 120, coadvisor_phone: 40,
  position_title: 200, job_description: 1500,
  problem1_title: 200, problem1_detail: 1500, problem2_title: 200, problem2_detail: 1500,
  work_mode: 10, schedule_305: 200, schedule_304: 200, ip_owner: 10, compensation: 200
};

var PLACEMENT_DEFAULTS_ = {
  same_as_301: 'yes', coadvisor_same: 'yes', work_mode: 'onsite', ip_owner: 'company',
  schedule_305: 'จันทร์–ศุกร์ 08:00–12:00 (ไม่น้อยกว่า 20 ชั่วโมงต่อสัปดาห์)',
  schedule_304: 'พฤหัสบดี–ศุกร์ 14:00–17:00 (ไม่น้อยกว่า 6 ชั่วโมงต่อสัปดาห์)',
  compensation: 'ไม่มี'
};

var STATUS_TH_ = {
  draft: 'ร่าง', submitted: 'รอหลักสูตรตรวจ', returned: 'ส่งกลับให้แก้ไข',
  agreement_sent: 'ส่งข้อตกลงให้สถานประกอบการแล้ว', signed: 'สถานประกอบการยืนยันแล้ว'
};

function placementOf_(email) {
  email = normEmail_(email);
  return findOne_('Placements', function (r) { return normEmail_(r.student_email) === email; });
}

function placementById_(id) {
  return findOne_('Placements', function (r) { return String(r.placement_id) === String(id); });
}

function optionsPayload_() {
  return { companyTypes: COMPANY_TYPES, workModes: WORK_MODES, ipOwners: IP_OWNERS, statusTh: STATUS_TH_ };
}

function semesterPayload_() {
  var c = cfg_();
  return {
    label: c.SEMESTER_LABEL, start: c.SEMESTER_START, end: c.SEMESTER_END, today: todayStr_(),
    week: weekIndex_(todayStr_(), c.SEMESTER_START),
    target305: cfgNum_('TARGET_305'), target304: cfgNum_('TARGET_304'),
    weekly305: cfgNum_('WEEKLY_305'), weekly304: cfgNum_('WEEKLY_304'),
    maxHoursPerDay: cfgNum_('MAX_HOURS_PER_DAY'), programShort: c.PROGRAM_SHORT
  };
}

/* ---------- นักศึกษา ---------- */

function api_placementGet(session) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var p = placementOf_(u.email);
    var data = p ? placementOut_(p, ['agreement_doc_id', 'agreement_pdf_id', 'agreement_pdf_url']) : null;
    var defaults = Object.assign({}, PLACEMENT_DEFAULTS_, { student_phone: String(u.phone || '') });
    return {
      ok: true, me: profile_(u), placement: data, defaults: defaults,
      editable: !p || p.status === 'draft' || p.status === 'returned',
      logbookOpen: !!p && LOGBOOK_OPEN_STATUSES.indexOf(p.status) >= 0,
      advisor: contactOf_(u.advisor_email), coordinator: coordinator_(), head: programHead_(),
      uploads: { cvRequired: String(cfg_().CV_REQUIRED).toUpperCase() === 'TRUE', maxMb: cfgNum_('MAX_UPLOAD_MB') || 5 },
      todo: studentTodo_(u, p, entriesOf_(u.email)),
      options: optionsPayload_(), semester: semesterPayload_()
    };
  });
}

function api_placementSave(session, data, submit) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    data = data || {};
    return withLock_(function () {
      var p = placementOf_(u.email);
      if (p && p.status !== 'draft' && p.status !== 'returned') {
        return { ok: false, error: 'ส่งข้อมูลแล้ว แก้ไขไม่ได้ ถ้าต้องการเปลี่ยนกรุณาติดต่อผู้ประสานงาน SE-WIL' };
      }
      var clean = {};
      Object.keys(PLACEMENT_FIELDS_).forEach(function (k) { clean[k] = clip_(data[k], PLACEMENT_FIELDS_[k]); });
      clean.supervisor_email = normEmail_(clean.supervisor_email);
      clean.coadvisor_email = normEmail_(clean.coadvisor_email);
      if (clean.coadvisor_same === 'yes') {
        clean.coadvisor_name = ''; clean.coadvisor_position = ''; clean.coadvisor_email = ''; clean.coadvisor_phone = '';
      }
      if (clean.same_as_301 === 'yes') clean.change_reason = '';
      if (COMPANY_TYPES.indexOf(clean.company_type) < 0) clean.company_type = '';
      var consent = data.pdpa_consent === true || data.pdpa_consent === 'true';
      var cvRequired = String(cfg_().CV_REQUIRED).toUpperCase() === 'TRUE';
      var check = validatePlacement_(Object.assign({ pdpa_consent: consent, cv_required: cvRequired, has_cv: !!(p && p.cv_file_id) }, clean), !!submit);
      if (!check.ok) return { ok: false, errors: check.errors, error: check.errors.join('\n') };

      var now = nowIso_();
      clean.updated_at = now;
      if (consent && !(p && p.pdpa_consent_at)) clean.pdpa_consent_at = now;
      if (!consent) clean.pdpa_consent_at = '';
      var status = p ? p.status : 'draft';
      if (submit) {
        if (!canTransition_(status, 'submitted')) return { ok: false, error: 'สถานะปัจจุบันส่งไม่ได้' };
        clean.status = 'submitted';
        clean.submitted_at = now;
      }
      if (p) {
        // ชื่อและรหัสตามชีต Users ล่าสุด (ผู้ดูแลอาจเติมชื่อหลังนักศึกษาบันทึกร่างครั้งแรก)
        if (u.name) clean.student_name = String(u.name);
        if (u.student_id) clean.student_id = String(u.student_id);
        update_('Placements', p._row, clean);
      } else {
        clean.placement_id = shortId_('PL', 8);
        clean.student_email = u.email;
        clean.student_id = String(u.student_id || '');
        clean.student_name = String(u.name || '');
        clean.status = clean.status || 'draft';
        clean.created_at = now;
        insert_('Placements', clean);
      }
      audit_(u.email, submit ? 'placement_submit' : 'placement_save', '', '');
      return { ok: true, status: clean.status || status };
    });
  });
}

/** นักศึกษาแก้หรือลบเบอร์มือถือของตนเองได้ทุกสถานะ (สิทธิ์แก้ไขและถอนความยินยอม) */
function api_placementPhone(session, phone) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    phone = clip_(phone, 40);
    if (phone && !isPhone_(phone)) return { ok: false, error: 'เบอร์โทรไม่ถูกต้อง (ตัวเลขอย่างน้อย 9 หลัก) หรือเว้นว่างเพื่อลบ' };
    return withLock_(function () {
      var p = placementOf_(u.email);
      if (!p) return { ok: false, error: 'ยังไม่มีข้อมูลที่ฝึก' };
      update_('Placements', p._row, { student_phone: phone, updated_at: nowIso_() });
      audit_(u.email, phone ? 'phone_update' : 'phone_remove', p.placement_id, '');
      return { ok: true, phone: phone };
    });
  });
}

/* ---------- อาจารย์ / ผู้ดูแล ---------- */

function api_adminOverview(session) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    var sem = semesterPayload_();
    var students = readAll_('Users').filter(function (u) {
      return String(u.role).trim().toLowerCase() === 'student' && String(u.active).toUpperCase() !== 'FALSE' &&
        (me.role === 'admin' || normEmail_(u.advisor_email) === me.email);
    });
    var placements = {};
    readAll_('Placements').forEach(function (p) { placements[normEmail_(p.student_email)] = p; });
    var byStudent = {};
    readAll_('Logbook').forEach(function (e) {
      var k = normEmail_(e.student_email);
      (byStudent[k] = byStudent[k] || []).push(e);
    });
    var exp305 = expectedHours_(sem.today, sem.start, sem.weekly305, sem.target305);
    var exp304 = expectedHours_(sem.today, sem.start, sem.weekly304, sem.target304);
    var counts = { none: 0, draft: 0, submitted: 0, returned: 0, agreement_sent: 0, signed: 0 };
    var rows = students.map(function (u) {
      var email = normEmail_(u.email);
      var p = placements[email];
      var entries = byStudent[email] || [];
      var sum = summarizeHours_(entries);
      var last = entries.reduce(function (m, e) { return e.date > m ? e.date : m; }, '');
      var status = p ? p.status : 'none';
      counts[status] = (counts[status] || 0) + 1;
      var flags = [];
      var open = p && LOGBOOK_OPEN_STATUSES.indexOf(p.status) >= 0;
      if (open && exp305 > 0 && sum.certified['305'] + sum.pending['305'] < 0.8 * exp305) flags.push('ชั่วโมง 305 ต่ำกว่าเป้า');
      if (open && exp304 > 0 && sum.certified['304'] + sum.pending['304'] < 0.8 * exp304) flags.push('ชั่วโมง 304 ต่ำกว่าเป้า');
      if (sum.returned['305'] + sum.returned['304'] > 0) flags.push('มีรายการถูกส่งกลับ');
      return {
        email: email, name: String(u.name || ''), student_id: String(u.student_id || ''), section: String(u.section || ''),
        advisor_email: normEmail_(u.advisor_email), status: status,
        placement_id: p ? p.placement_id : '', company_name: p ? p.company_name : '',
        supervisor_name: p ? p.supervisor_name : '', has_reply: !!(p && p.reply_file_id), reply_uploaded_at: p ? String(p.reply_uploaded_at || '') : '',
        hours: sum, last_entry: last, flags: flags
      };
    });
    return {
      ok: true, me: profile_(me), scope: me.role === 'admin' ? 'all' : 'advisees', semester: sem, expected: { '305': exp305, '304': exp304 },
      counts: counts, rows: rows, todo: staffTodo_(me, rows), selfAssign: selfAssignOpen_(), options: optionsPayload_()
    };
  });
}

function api_adminStudent(session, email) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    email = normEmail_(email);
    var u = findUser_(email);
    if (!u || u.role !== 'student' || !canSeeStudent_(me, u)) return { ok: false, error: 'ไม่พบนักศึกษา หรือท่านไม่ได้เป็นอาจารย์นิเทศของนักศึกษาคนนี้' };
    var p = placementOf_(email);
    var entries = readAll_('Logbook').filter(function (e) { return normEmail_(e.student_email) === email; })
      .map(function (e) { return publicRow_(e); });
    var batches = readAll_('CertBatches').filter(function (b) { return normEmail_(b.student_email) === email; })
      .map(function (b) { return publicRow_(b); });
    return {
      ok: true, student: profile_(u), placement: p ? placementOut_(p, ['agreement_doc_id']) : null,
      advisor: contactOf_(u.advisor_email), coordinator: coordinator_(), head: programHead_(),
      entries: entries, batches: batches, summary: summarizeHours_(entries),
      options: optionsPayload_(), semester: semesterPayload_()
    };
  });
}

function api_adminApprove(session, placementId, comment) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    return withLock_(function () {
      var p = placementById_(placementId);
      if (!p) return { ok: false, error: 'ไม่พบข้อมูลที่ฝึก' };
      if (!canTransition_(p.status, 'agreement_sent')) return { ok: false, error: 'อนุมัติได้เฉพาะรายการที่รอหลักสูตรตรวจ' };
      var student = findUser_(p.student_email);
      if (student && student.name) p.student_name = String(student.name);
      if (student && student.student_id) p.student_id = String(student.student_id);
      if (!String(p.student_name || '').trim()) return { ok: false, error: 'ยังไม่มีชื่อนักศึกษาในชีต Users (คอลัมน์ name) กรุณาใส่ชื่อก่อนอนุมัติ เพราะชื่อจะพิมพ์ลงข้อตกลง' };
      var no = p.agreement_no || nextAgreementNo_();
      p.agreement_no = no;
      var advisor = student && student.advisor_email ? findUser_(student.advisor_email) : null;
      var gen = generateAgreement_(p, student, advisor);
      var sv = getOrCreateSupervisor_(p.supervisor_email, p.supervisor_name);
      if (p.coadvisor_same !== 'yes' && p.coadvisor_email) getOrCreateSupervisor_(p.coadvisor_email, p.coadvisor_name);
      var now = nowIso_();
      update_('Placements', p._row, {
        status: 'agreement_sent', agreement_no: no, student_name: p.student_name, student_id: p.student_id, reviewed_by: me.email, reviewed_at: now,
        review_comment: clip_(comment, 600), agreement_doc_id: gen.docId, agreement_pdf_id: gen.pdfId,
        agreement_pdf_url: gen.pdfUrl, agreement_generated_at: now, updated_at: now
      });
      sendAgreementEmails_(p, student, sv, gen.blob);
      audit_(me.email, 'placement_approve', p.placement_id, no);
      return { ok: true, agreement_no: no };
    });
  });
}

function nextAgreementNo_() {
  var c = cfg_();
  var year = String(c.SEMESTER_LABEL || '').split('/').pop() || '';
  var n = readAll_('Placements').filter(function (r) { return String(r.agreement_no || ''); }).length + 1;
  return 'SE-WIL01/' + year + '-' + ('000' + n).slice(-3);
}

function api_adminReturn(session, placementId, comment) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    comment = clip_(comment, 600);
    if (comment.length < 5) return { ok: false, error: 'กรุณาระบุเหตุผลที่ส่งกลับ' };
    return withLock_(function () {
      var p = placementById_(placementId);
      if (!p) return { ok: false, error: 'ไม่พบข้อมูลที่ฝึก' };
      if (!canTransition_(p.status, 'returned')) return { ok: false, error: 'ส่งกลับไม่ได้ในสถานะนี้' };
      update_('Placements', p._row, { status: 'returned', review_comment: comment, reviewed_by: me.email, reviewed_at: nowIso_(), updated_at: nowIso_() });
      sendPlacementReturnedEmail_(p, comment);
      audit_(me.email, 'placement_return', p.placement_id, comment);
      return { ok: true };
    });
  });
}

function api_adminMarkSigned(session, placementId, note) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    return withLock_(function () {
      var p = placementById_(placementId);
      if (!p) return { ok: false, error: 'ไม่พบข้อมูลที่ฝึก' };
      if (!canTransition_(p.status, 'signed')) return { ok: false, error: 'บันทึกการลงนามได้เฉพาะรายการที่ส่งข้อตกลงแล้ว' };
      update_('Placements', p._row, {
        status: 'signed', accepted_via: 'paper', accepted_by_name: clip_(note, 200) || ('บันทึกโดย ' + me.email),
        accepted_at: nowIso_(), updated_at: nowIso_()
      });
      audit_(me.email, 'placement_signed_paper', p.placement_id, note);
      return { ok: true };
    });
  });
}

function api_adminResendAgreement(session, placementId) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    var p = placementById_(placementId);
    if (!p) return { ok: false, error: 'ไม่พบข้อมูลที่ฝึก' };
    if (p.status !== 'agreement_sent') return { ok: false, error: 'ส่งซ้ำได้เฉพาะรายการที่รอสถานประกอบการยืนยัน' };
    var blob = p.agreement_pdf_id ? DriveApp.getFileById(p.agreement_pdf_id).getBlob() : null;
    var sv = getOrCreateSupervisor_(p.supervisor_email, p.supervisor_name);
    sendAgreementEmails_(p, findUser_(p.student_email), sv, blob, true);
    audit_(me.email, 'agreement_resend', p.placement_id, '');
    return { ok: true };
  });
}

/** ข้อมูลที่ฝึกที่ส่งให้หน้าเว็บ: ซ่อนรหัสไฟล์ใน Drive แล้วบอกเพียงว่ามีไฟล์หรือไม่ */
function placementOut_(p, hide) {
  var o = publicRow_(p, (hide || []).concat(['company_photo_id', 'cv_file_id', 'reply_file_id']));
  o.has_photo = !!p.company_photo_id;
  o.has_cv = !!p.cv_file_id;
  o.has_reply = !!p.reply_file_id;
  o.map_href = mapHref_(p.company_map_url);
  return o;
}

/* ---------- ผู้นิเทศงาน (ลิงก์เฉพาะคน) ---------- */

function placementForSupervisor_(p) {
  var student = findUser_(p.student_email);
  return {
    placement_id: p.placement_id, agreement_no: p.agreement_no, status: p.status,
    student_name: p.student_name, student_id: p.student_id, student_email: p.student_email,
    student_phone: p.student_phone || '', has_cv: !!p.cv_file_id, // เฉพาะเบอร์ที่นักศึกษากรอกเอง ไม่ใช้เบอร์ในชีต Users
    advisor: student ? contactOf_(student.advisor_email) : null,
    supervisor: { name: p.supervisor_name, email: p.supervisor_email, phone: p.supervisor_phone },
    coadvisor: p.coadvisor_same === 'yes' ? null : { name: p.coadvisor_name, email: p.coadvisor_email, phone: p.coadvisor_phone },
    company_name: p.company_name, position_title: p.position_title, job_description: p.job_description,
    problem1_title: p.problem1_title, problem1_detail: p.problem1_detail, problem2_title: p.problem2_title,
    work_mode: WORK_MODES[p.work_mode] || p.work_mode, schedule_305: p.schedule_305, schedule_304: p.schedule_304,
    ip_owner: IP_OWNERS[p.ip_owner] || p.ip_owner, compensation: p.compensation,
    accepted_by_name: p.accepted_by_name, accepted_at: p.accepted_at
  };
}

function api_svAcceptAgreement(k, placementId, name, agree) {
  return safe_(function () {
    var sv = requireSupervisor_(k);
    name = clip_(name, 200);
    if (agree !== true) return { ok: false, error: 'กรุณาทำเครื่องหมายยอมรับข้อตกลง' };
    if (name.length < 4) return { ok: false, error: 'กรุณาพิมพ์ชื่อ-นามสกุลของผู้ยืนยัน' };
    return withLock_(function () {
      var p = placementById_(placementId);
      if (!p || normEmail_(p.supervisor_email) !== sv.email) return { ok: false, error: 'ไม่พบข้อตกลงนี้ในความรับผิดชอบของท่าน' };
      if (p.status !== 'agreement_sent') return { ok: false, error: 'ข้อตกลงนี้ไม่ได้อยู่ในสถานะรอยืนยัน' };
      update_('Placements', p._row, { status: 'signed', accepted_via: 'online', accepted_by_name: name, accepted_at: nowIso_(), updated_at: nowIso_() });
      audit_(sv.email, 'agreement_accept_online', p.placement_id, name);
      return { ok: true };
    });
  });
}
