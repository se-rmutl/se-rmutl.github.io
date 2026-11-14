/**
 * Assign.gs — จับคู่อาจารย์นิเทศ
 * อาจารย์ (teacher/admin) เห็นรายชื่อนักศึกษาทุกคนแบบย่อ แล้วเลือกนักศึกษาที่จะดูแลเอง
 * เมื่อยืนยันแล้ว อาจารย์ท่านอื่นเลือกนักศึกษาคนนั้นไม่ได้ ผู้ที่ยืนยันยกเลิกได้เอง และ admin กำหนดหรือเปลี่ยนให้ใครก็ได้
 * รายการนี้แสดงเฉพาะชื่อ รหัส sec สถานประกอบการ จังหวัด และสถานะ ไม่มีเบอร์โทร CV หรือ logbook (เข้าถึงเท่าที่จำเป็น)
 */

function selfAssignOpen_() { return String(cfg_().ADVISOR_SELF_ASSIGN).toUpperCase() !== 'FALSE'; }

/** 0 = ไม่จำกัด */
function advisorMax_() { return Math.max(0, cfgNum_('ADVISOR_MAX')); }

function isStaff_(u) { return u && u.active && (u.role === 'teacher' || u.role === 'admin'); }

/** อาจารย์และผู้ดูแลที่ยังใช้งาน [{email, name, role}] */
function staffList_() {
  return readAll_('Users').map(function (r) { return findUserFromRow_(r); })
    .filter(isStaff_)
    .map(function (u) { return { email: u.email, name: String(u.name || u.email), role: u.role }; });
}

function findUserFromRow_(r) {
  return {
    email: normEmail_(r.email), role: String(r.role || '').trim().toLowerCase(), name: String(r.name || ''),
    student_id: String(r.student_id || ''), section: String(r.section || ''), advisor_email: normEmail_(r.advisor_email),
    advisor_set_by: normEmail_(r.advisor_set_by), advisor_set_at: String(r.advisor_set_at || ''),
    active: String(r.active).toUpperCase() !== 'FALSE', _row: r._row
  };
}

/** นักศึกษาที่ใช้งานทุกคน พร้อมอาจารย์นิเทศปัจจุบัน */
function activeStudents_() {
  return readAll_('Users').map(findUserFromRow_).filter(function (u) { return u.active && u.role === 'student'; });
}

function assignRows_(me) {
  var users = readAll_('Users').map(findUserFromRow_);
  var names = {};
  users.forEach(function (u) { if (u.email) names[u.email] = u.name || u.email; });
  var placements = {};
  readAll_('Placements').forEach(function (p) { placements[normEmail_(p.student_email)] = p; });
  return users.filter(function (u) { return u.active && u.role === 'student'; }).map(function (u) {
    var p = placements[u.email];
    return {
      email: u.email, name: u.name, student_id: u.student_id, section: u.section,
      company_name: p ? String(p.company_name || '') : '', province: p ? String(p.province || '') : '',
      status: p ? p.status : 'none',
      advisor_email: u.advisor_email, advisor_name: u.advisor_email ? (names[u.advisor_email] || u.advisor_email) : '',
      set_by_name: u.advisor_set_by ? (names[u.advisor_set_by] || u.advisor_set_by) : '', set_at: u.advisor_set_at,
      mine: !!u.advisor_email && u.advisor_email === me.email
    };
  }).sort(function (a, b) {
    return (a.section + a.student_id).localeCompare(b.section + b.student_id);
  });
}

function api_assignList(session) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    var rows = assignRows_(me);
    var counts = {};
    rows.forEach(function (r) { if (r.advisor_email) counts[r.advisor_email] = (counts[r.advisor_email] || 0) + 1; });
    return {
      ok: true, me: profile_(me), rows: rows,
      staff: staffList_().map(function (s) { s.count = counts[s.email] || 0; return s; }),
      selfOpen: selfAssignOpen_(), max: advisorMax_(), myCount: counts[me.email] || 0,
      unassigned: rows.filter(function (r) { return !r.advisor_email; }).length
    };
  });
}

/** อ่านแถวนักศึกษาใหม่ภายใน lock เสมอ เพื่อกันอาจารย์สองคนกดพร้อมกัน */
function studentForAssign_(email) {
  email = normEmail_(email);
  var row = findOne_('Users', function (r) { return normEmail_(r.email) === email; });
  var u = row ? findUserFromRow_(row) : null;
  if (!u || u.role !== 'student' || !u.active) throw userError_('ไม่พบนักศึกษาคนนี้ในรายชื่อที่ใช้งาน');
  return u;
}

function setAdvisor_(u, teacherEmail, actor) {
  update_('Users', u._row, {
    advisor_email: teacherEmail || '', advisor_set_by: teacherEmail ? actor : '', advisor_set_at: teacherEmail ? nowIso_() : ''
  });
  audit_(actor, teacherEmail ? 'advisor_set' : 'advisor_cleared', u.email, (u.advisor_email || '-') + ' -> ' + (teacherEmail || '-'));
}

function staffName_(email) {
  var u = email ? findUser_(email) : null;
  return u ? String(u.name || u.email) : String(email || '');
}

/** อาจารย์ยืนยันรับนักศึกษาเป็นผู้ดูแลเอง */
function api_assignClaim(session, studentEmail) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    var isAdmin = me.role === 'admin';
    if (!isAdmin && !selfAssignOpen_()) return { ok: false, error: 'ปิดการเลือกนักศึกษาเองแล้ว กรุณาติดต่อผู้ประสานงาน SE-WIL' };
    return withLock_(function () {
      var u = studentForAssign_(studentEmail);
      if (u.advisor_email === me.email) return { ok: true, already: true };
      if (u.advisor_email) {
        return { ok: false, error: 'นักศึกษาคนนี้มีอาจารย์นิเทศแล้ว (' + staffName_(u.advisor_email) + ') ถ้าต้องการเปลี่ยน กรุณาติดต่ออาจารย์ท่านนั้นหรือผู้ประสานงาน SE-WIL' };
      }
      var max = advisorMax_();
      if (!isAdmin && max > 0) {
        var n = activeStudents_().filter(function (s) { return s.advisor_email === me.email; }).length;
        if (n >= max) return { ok: false, error: 'ท่านเลือกครบ ' + max + ' คนแล้ว ถ้าต้องการดูแลเพิ่ม กรุณาติดต่อผู้ประสานงาน SE-WIL' };
      }
      setAdvisor_(u, me.email, me.email);
      return { ok: true };
    });
  });
}

/** ยกเลิก: อาจารย์ยกเลิกได้เฉพาะนักศึกษาที่ตนยืนยันไว้ admin ยกเลิกได้ทุกคน */
function api_assignRelease(session, studentEmail) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    return withLock_(function () {
      var u = studentForAssign_(studentEmail);
      if (!u.advisor_email) return { ok: true, already: true };
      if (u.advisor_email !== me.email && me.role !== 'admin') return { ok: false, error: 'ยกเลิกได้เฉพาะนักศึกษาที่ท่านเป็นอาจารย์นิเทศ' };
      setAdvisor_(u, '', me.email);
      return { ok: true };
    });
  });
}

/** admin กำหนดหรือเปลี่ยนอาจารย์นิเทศให้นักศึกษา (teacherEmail ว่าง = ยกเลิก) */
function api_assignSet(session, studentEmail, teacherEmail) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    teacherEmail = normEmail_(teacherEmail);
    if (teacherEmail && !isStaff_(findUser_(teacherEmail))) return { ok: false, error: 'อีเมลนี้ไม่ใช่อาจารย์ที่ใช้งานในชีต Users' };
    return withLock_(function () {
      var u = studentForAssign_(studentEmail);
      if (u.advisor_email === teacherEmail) return { ok: true, already: true };
      setAdvisor_(u, teacherEmail, me.email);
      return { ok: true };
    });
  });
}
