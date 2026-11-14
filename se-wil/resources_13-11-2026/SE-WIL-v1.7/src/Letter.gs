/**
 * Letter.gs — หนังสือแนะนำรายวิชาและแบบตอบรับ SE-WIL00 ฉบับมีข้อมูล (v1.7)
 *
 * ใช้หน้าแบบฟอร์มเดิมในพอร์ทัล (forms/intro-letter.html) ระบบส่งข้อมูลไปกับลิงก์ส่วนหลัง # ซึ่งเบราว์เซอร์
 * ไม่ส่งไปที่เซิร์ฟเวอร์ของพอร์ทัล หน้าเว็บเติมข้อมูลลงช่องแล้วพิมพ์ ข้อมูลเป็น JSON ที่ gzip แล้วเข้ารหัส base64url
 *   #z=<gzip base64url>   { v:1, issued:'yyyy-MM-dd', r:[record...] }
 * record: n ชื่อ, id รหัส, f = 1 ถ้ามีข้อมูลที่ฝึก (ถ้าไม่มี f พิมพ์เป็นฟอร์มเปล่าที่ใส่ชื่อนักศึกษา)
 *   c บริษัท, a ที่อยู่, p จังหวัด, sn sp se st ผู้นิเทศงาน, co same|other, cn cp ce ที่ปรึกษาร่วม,
 *   pt ตำแหน่ง, jd ลักษณะงาน, p1 p2 โจทย์, wm onsite|hybrid|remote, s5 s4 ตารางเวลา, ip company|joint|student, cm ค่าตอบแทน
 * ไม่มีเบอร์โทรหรืออีเมลของนักศึกษาในข้อมูล (แบบตอบรับไม่ได้ใช้)
 */

/** สถานะที่ถือว่าข้อมูลที่ฝึกผ่านการตรวจความครบถ้วนแล้ว พิมพ์ฉบับมีข้อมูลได้ */
var LETTER_FILLED_STATUSES_ = ['submitted', 'returned', 'agreement_sent', 'signed'];

function clip_(s, n) {
  s = String(s === undefined || s === null ? '' : s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
}

function letterRecord_(u, p) {
  var r = { n: String(u.name || u.email), id: String(u.student_id || '') };
  if (!p || LETTER_FILLED_STATUSES_.indexOf(String(p.status)) < 0) return r;
  r.f = 1;
  r.c = clip_(p.company_name, 120); r.a = clip_(p.company_address, 140); r.p = clip_(p.province, 40);
  r.sn = clip_(p.supervisor_name, 80); r.sp = clip_(p.supervisor_position, 80);
  r.se = clip_(p.supervisor_email, 80); r.st = clip_(p.supervisor_phone, 30);
  r.co = p.coadvisor_same === 'no' ? 'other' : 'same';
  if (r.co === 'other') { r.cn = clip_(p.coadvisor_name, 60); r.cp = clip_(p.coadvisor_position, 40); r.ce = clip_(p.coadvisor_email, 60); }
  r.pt = clip_(p.position_title, 100); r.jd = clip_(p.job_description, 230);
  r.p1 = clip_(p.problem1_title, 110); r.p2 = clip_(p.problem2_title, 110);
  r.wm = String(p.work_mode || ''); r.s5 = clip_(p.schedule_305, 60); r.s4 = clip_(p.schedule_304, 60);
  r.ip = String(p.ip_owner || ''); r.cm = clip_(p.compensation, 60);
  return r;
}

/** ลิงก์หน้าแบบฟอร์มในพอร์ทัลพร้อมข้อมูล (ว่าง = ยังไม่ได้ตั้ง PORTAL_URL) */
function letterUrl_(records) {
  var base = portalUrl_('forms/intro-letter.html');
  if (!base) return '';
  var json = JSON.stringify({ v: 1, issued: todayStr_(), r: records });
  var gz = Utilities.gzip(Utilities.newBlob(json, 'application/json', 'letter.json'));
  return base + '#z=' + Utilities.base64EncodeWebSafe(gz.getBytes()).replace(/=+$/, '');
}

function letterOut_(records, actor, target) {
  var url = letterUrl_(records);
  if (!url) return { ok: false, error: 'ยังไม่ได้ตั้ง PORTAL_URL ในชีต Config' };
  audit_(actor, 'letter_link', target, records.length + ' record(s)');
  return { ok: true, url: url, count: records.length, filled: records.filter(function (r) { return r.f; }).length };
}

/** นักศึกษา: ลิงก์หนังสือแนะนำและแบบตอบรับของตนเอง (มีข้อมูลเมื่อส่งให้หลักสูตรตรวจแล้ว) */
function api_letterLink(session) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    return letterOut_([letterRecord_(u, placementOf_(u.email))], u.email, u.email);
  });
}

/** อาจารย์นิเทศของนักศึกษาคนนั้นหรือผู้ดูแล: ลิงก์รายคน */
function api_adminLetterLink(session, email) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    var u = findUser_(normEmail_(email));
    if (!u || u.role !== 'student' || !canSeeStudent_(me, u)) return { ok: false, error: 'ไม่พบนักศึกษา หรือท่านไม่ได้เป็นอาจารย์นิเทศของนักศึกษาคนนี้' };
    return letterOut_([letterRecord_(u, placementOf_(u.email))], me.email, u.email);
  });
}

/** กลุ่มนักศึกษาสำหรับพิมพ์รวม which = filled | noreply | blank */
function letterGroups_() {
  var placements = {};
  readAll_('Placements').forEach(function (p) { placements[normEmail_(p.student_email)] = p; });
  var g = { filled: [], noreply: [], blank: [] };
  activeStudents_().slice().sort(function (a, b) { return (a.section + a.student_id).localeCompare(b.section + b.student_id); }).forEach(function (u) {
    var p = placements[u.email] || null;
    var rec = letterRecord_(u, p);
    if (rec.f) {
      g.filled.push(rec);
      if (!p.reply_file_id) g.noreply.push(rec);
    } else g.blank.push(rec);
  });
  return g;
}

/** ผู้ดูแล: ลิงก์พิมพ์รวมหลายคน ให้หัวหน้าหลักสูตรลงนามหน้า 1 ครั้งเดียว */
function api_adminLettersAll(session, which) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    var g = letterGroups_();
    if (!g[which]) return { ok: false, error: 'กลุ่มไม่ถูกต้อง' };
    if (!g[which].length) return { ok: false, error: 'ไม่มีนักศึกษาในกลุ่มนี้' };
    return letterOut_(g[which], me.email, 'all:' + which);
  });
}
