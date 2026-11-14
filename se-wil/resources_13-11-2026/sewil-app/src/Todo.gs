/**
 * Todo.gs — "สิ่งที่ต้องทำ" และ "กำหนดการถัดไป" ของแต่ละบทบาท
 * kind: do = ต้องทำ, late = เลยกำหนด, wait = รอฝ่ายอื่น, ok = เรียบร้อย
 * go: แท็บที่ปุ่ม "ไปทำ" พาไป (place, log, assign, docs, overview)
 */

function todoItem_(kind, text, opt) {
  var o = { kind: kind, text: text };
  if (opt) Object.keys(opt).forEach(function (k) { if (opt[k] !== undefined && opt[k] !== '') o[k] = opt[k]; });
  return o;
}

function addDays_(iso, n) {
  var d = parseDate_(iso);
  return d ? fmtDate_(new Date(d.getTime() + n * DAY_MS_)) : iso;
}

/** กำหนดการของบทบาท (admin เห็นของ teacher ด้วย) วันที่จาก Config ถ้ารายการระบุ cfg */
function planFor_(role) {
  var c = cfg_();
  return TERM_PLAN.filter(function (x) {
    return x.roles.indexOf(role) >= 0 || (role === 'admin' && x.roles.indexOf('teacher') >= 0);
  }).map(function (x) {
    return { date: (x.cfg && /^\d{4}-\d{2}-\d{2}$/.test(String(c[x.cfg] || ''))) ? String(c[x.cfg]) : x.date, title: x.title };
  });
}

function upcoming_(role, today, n) {
  return planFor_(role).filter(function (x) { return x.date >= today; })
    .sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); })
    .slice(0, n || 4);
}

function approvalDue_() {
  var it = TERM_PLAN.filter(function (x) { return x.roles.indexOf('admin') >= 0 && /อนุมัติ/.test(x.title); })[0];
  return it ? it.date : '';
}

/** นักศึกษา: p = แถว Placements หรือ null, entries = logbook ของนักศึกษา */
function studentTodo_(u, p, entries) {
  var c = cfg_(), today = todayStr_(), now = [];
  var st = p ? p.status : 'none';
  var due = c.PLACEMENT_DUE, adue = c.AGREEMENT_DUE;
  if (st === 'none' || st === 'draft') {
    now.push(todoItem_(due && today > due ? 'late' : 'do',
      (st === 'none' ? 'กรอกข้อมูลที่ฝึก' : 'กรอกข้อมูลที่ฝึกให้ครบ') + ' แจ้งผู้นิเทศงานก่อนกรอกชื่อและอีเมลของท่าน แล้วกด "ส่งให้หลักสูตรตรวจ"', { due: due, go: 'place' }));
  }
  if (st === 'returned') now.push(todoItem_('do', 'แก้ข้อมูลที่ฝึกตามความเห็นของอาจารย์ แล้วส่งอีกครั้ง', { go: 'place' }));
  if (st === 'submitted') now.push(todoItem_('wait', 'รอหลักสูตรตรวจข้อมูลที่ฝึก'));
  if (st === 'agreement_sent') {
    var late = adue && today > adue;
    now.push(todoItem_(late ? 'late' : 'wait', late ? 'ผู้นิเทศงานยังไม่ยืนยันข้อตกลง กรุณาเตือนท่านให้เปิดลิงก์ในอีเมลจากระบบ' : 'รอผู้นิเทศงานยืนยันข้อตกลงทางอีเมล', { due: adue }));
  }
  if (p && LETTER_FILLED_STATUSES_.indexOf(st) >= 0 && !p.reply_file_id) {
    now.push(todoItem_(adue && today > adue ? 'late' : 'do', 'พิมพ์หนังสือแนะนำและแบบตอบรับ (มีข้อมูลแล้ว) ให้หัวหน้าหลักสูตรและสถานประกอบการลงนาม แล้วแนบแบบตอบรับที่ลงนามในระบบ', { due: adue, go: 'place' }));
  }
  if (p && st !== 'draft' && st !== 'none' && !normEmail_(u.advisor_email)) now.push(todoItem_('wait', 'หลักสูตรกำลังจัดอาจารย์นิเทศ ชื่อจะแสดงที่นี่เมื่อจัดแล้ว'));
  if (p && LOGBOOK_OPEN_STATUSES.indexOf(st) >= 0) {
    var returned = entries.filter(function (e) { return e.status === 'returned'; }).length;
    if (returned) now.push(todoItem_('do', 'แก้รายการ logbook ที่ผู้นิเทศงานส่งกลับ ' + returned + ' รายการ', { go: 'log' }));
    if (today < c.SEMESTER_START) {
      now.push(todoItem_('ok', 'บันทึก logbook ได้ตั้งแต่วันเปิดภาค ' + thDateLong_(c.SEMESTER_START)));
    } else if (today <= c.SEMESTER_END) {
      var since = addDays_(today, -6);
      if (!entries.some(function (e) { return e.date >= since; })) now.push(todoItem_('do', 'บันทึก logbook ของสัปดาห์นี้ (ยังไม่มีรายการใน 7 วันที่ผ่านมา)', { go: 'log' }));
      var sum = summarizeHours_(entries);
      [['305', 'WEEKLY_305', 'TARGET_305'], ['304', 'WEEKLY_304', 'TARGET_304']].forEach(function (k) {
        var exp = expectedHours_(today, c.SEMESTER_START, cfgNum_(k[1]), cfgNum_(k[2]));
        var have = sum.certified[k[0]] + sum.pending[k[0]] + sum.draft[k[0]];
        if (exp > 0 && have < 0.8 * exp) now.push(todoItem_('do', 'ชั่วโมง ENGSE' + k[0] + ' มี ' + have + ' ชม. ต่ำกว่าที่ควรมี (' + exp + ' ชม.) ณ สิ้นสัปดาห์ที่แล้ว', { go: 'log' }));
      });
    }
  }
  if (!now.length && st === 'signed') now.push(todoItem_('ok', 'ไม่มีงานค้าง บันทึก logbook ต่อเนื่องทุกวัน'));
  return { now: now, next: upcoming_('student', today, 4) };
}

/** อาจารย์และผู้ดูแล: rows = แถวในหน้าภาพรวมตามสิทธิ์ของผู้ใช้ */
function staffTodo_(me, rows) {
  var c = cfg_(), today = todayStr_(), now = [];
  var isAdmin = me.role === 'admin';
  var students = activeStudents_();
  var mine = students.filter(function (s) { return s.advisor_email === me.email; });
  var unassigned = students.filter(function (s) { return !s.advisor_email; });
  if (!isAdmin && selfAssignOpen_() && !mine.length) {
    now.push(todoItem_('do', 'เลือกนักศึกษาที่ท่านจะเป็นอาจารย์นิเทศ' + (unassigned.length ? ' (ยังว่าง ' + unassigned.length + ' คน)' : ''), { go: 'assign', due: approvalDue_() }));
  }
  if (isAdmin) {
    var cnt = function (st) { return rows.filter(function (r) { return r.status === st; }).length; };
    var sub = cnt('submitted');
    if (sub) now.push(todoItem_('do', 'ตรวจและอนุมัติข้อมูลที่ฝึก ' + sub + ' รายการ', { go: 'overview', due: approvalDue_() }));
    if (unassigned.length) now.push(todoItem_(approvalDue_() && today > approvalDue_() ? 'late' : 'do', 'นักศึกษา ' + unassigned.length + ' คนยังไม่มีอาจารย์นิเทศ', { go: 'assign' }));
    var notSent = rows.filter(function (r) { return r.status === 'none' || r.status === 'draft'; }).length;
    if (notSent) now.push(todoItem_(c.PLACEMENT_DUE && today > c.PLACEMENT_DUE ? 'late' : 'wait', 'นักศึกษา ' + notSent + ' คนยังไม่ส่งข้อมูลที่ฝึก', { due: c.PLACEMENT_DUE, go: 'overview' }));
    var noReply = rows.filter(function (r) { return LETTER_FILLED_STATUSES_.indexOf(r.status) >= 0 && !r.has_reply; }).length;
    if (noReply) now.push(todoItem_(c.AGREEMENT_DUE && today > c.AGREEMENT_DUE ? 'late' : 'wait', 'นักศึกษา ' + noReply + ' คนยังไม่แนบแบบตอบรับที่สถานประกอบการลงนาม', { due: c.AGREEMENT_DUE, go: 'overview' }));
    var ret = cnt('returned');
    if (ret) now.push(todoItem_('wait', 'รอนักศึกษาแก้ข้อมูลที่ส่งกลับ ' + ret + ' รายการ'));
    var pendA = cnt('agreement_sent');
    if (pendA) {
      var lateA = c.AGREEMENT_DUE && today > c.AGREEMENT_DUE;
      now.push(todoItem_(lateA ? 'late' : 'wait', lateA ? pendA + ' รายการยังไม่ยืนยันข้อตกลง เปิดรายคนแล้วกด "ส่งข้อตกลงซ้ำ" หรือบันทึกการลงนามในเอกสาร' : 'รอสถานประกอบการยืนยันข้อตกลง ' + pendA + ' รายการ', { due: c.AGREEMENT_DUE, go: 'overview' }));
    }
    // บันทึกขออนุมัติแต่งตั้งอาจารย์นิเทศ: เตือนหลังหมดเขตส่งข้อมูลที่ฝึก จนกว่าจะสร้างบันทึกครั้งแรกของภาค
    if (c.PLACEMENT_DUE && today >= c.PLACEMENT_DUE && today <= c.SEMESTER_END && !docMemoAt_()) {
      var docDue = appointmentDocDue_();
      now.push(todoItem_(docDue && today > docDue ? 'late' : 'do', 'ออกบันทึกขออนุมัติแต่งตั้งอาจารย์นิเทศ เสนอคณะออกคำสั่ง (ใช้ทำงบเบิกและหนังสือขอเข้านิเทศ)', { due: docDue, go: 'docs' }));
    }
    if (resetEnabled_() && c.SEMESTER_START && today >= c.SEMESTER_START) {
      now.push(todoItem_('do', 'เปิดภาคแล้ว ควรปิดเครื่องมือรีเซ็ตเพื่อทดสอบ: ชีต Config ตั้ง RESET_ENABLED = FALSE', { go: 'reset' }));
    }
    var week = weekIndex_(today, c.SEMESTER_START);
    if (week >= 2 && today <= c.SEMESTER_END) {
      var last = '';
      try { last = PropertiesService.getScriptProperties().getProperty('LAST_DIGEST_AT') || ''; } catch (e) { }
      if (!last || Date.now() - Date.parse(last) > 8 * DAY_MS_) now.push(todoItem_('late', 'สรุปรายสัปดาห์ถึงผู้นิเทศงานไม่ได้ส่งเกิน 8 วัน ตรวจตัวจัดเวลาใน Apps Script หรือกด "ส่งสรุปให้ผู้นิเทศงานตอนนี้"'));
    }
  }
  var scope = isAdmin ? rows : rows.filter(function (r) { return r.advisor_email === me.email; });
  if (today >= c.SEMESTER_START && today <= c.SEMESTER_END) {
    var since = addDays_(today, -7);
    var stale = scope.filter(function (r) { return (r.status === 'agreement_sent' || r.status === 'signed') && (!r.last_entry || r.last_entry < since); }).length;
    if (stale) now.push(todoItem_('do', 'ติดตามนักศึกษา ' + stale + ' คนที่ไม่ได้บันทึก logbook เกิน 7 วัน', { go: 'overview' }));
  }
  var flagged = scope.filter(function (r) { return r.flags && r.flags.length; }).length;
  if (flagged) now.push(todoItem_('do', 'ดูนักศึกษา ' + flagged + ' คนที่มีข้อสังเกต (คอลัมน์ขวาสุดของตาราง)', { go: 'overview' }));
  if (!now.length) now.push(todoItem_('ok', 'ไม่มีงานค้างตอนนี้'));
  return { now: now, next: upcoming_(me.role, today, 4) };
}

/** ผู้นิเทศงาน/ที่ปรึกษาร่วม */
function supervisorTodo_(agreements, pending) {
  var c = cfg_(), today = todayStr_(), now = [];
  var pendA = agreements.filter(function (a) { return a.status === 'agreement_sent'; }).length;
  if (pendA) now.push(todoItem_(c.AGREEMENT_DUE && today > c.AGREEMENT_DUE ? 'late' : 'do', 'ยืนยันข้อตกลง SE-WIL01 ' + pendA + ' ฉบับ (ด้านล่าง)', { due: c.AGREEMENT_DUE }));
  if (pending.length) now.push(todoItem_('do', 'รับรองหรือส่งกลับบันทึกการปฏิบัติงาน ' + pending.length + ' ชุด (ด้านล่าง)'));
  if (!now.length) now.push(todoItem_('ok', 'ไม่มีรายการรอท่าน ระบบจะส่งอีเมลเมื่อมีรายการใหม่ทุกวัน' + dayTh_(c.DIGEST_DAY)));
  return { now: now, next: upcoming_('company', today, 3) };
}
