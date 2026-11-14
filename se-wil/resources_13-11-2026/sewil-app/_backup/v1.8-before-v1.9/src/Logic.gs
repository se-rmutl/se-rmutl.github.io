/**
 * Logic.gs — ฟังก์ชันล้วน (ไม่เรียกบริการของ Google) ทดสอบได้ด้วย Node
 * ทุกฟังก์ชันลงท้ายด้วย _ เพื่อไม่ให้ฝั่งเบราว์เซอร์เรียกผ่าน google.script.run ได้
 */

var DAY_MS_ = 86400000;

function parseDate_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  var y = +m[1], mo = +m[2] - 1, d = +m[3];
  var dt = new Date(Date.UTC(y, mo, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
  return dt;
}

function fmtDate_(d) { return d.toISOString().slice(0, 10); }

/** 'HH:mm' -> นาทีนับจากเที่ยงคืน */
function parseTime_(s) {
  var m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(s || '').trim());
  return m ? (+m[1]) * 60 + (+m[2]) : null;
}

function mondayOf_(d) {
  var diff = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - diff * DAY_MS_);
}

/** สัปดาห์ที่ (จันทร์–อาทิตย์) นับจากสัปดาห์ที่มีวันเปิดภาค = 1 */
function weekIndex_(dateStr, semesterStartStr) {
  var d = parseDate_(dateStr), s = parseDate_(semesterStartStr);
  if (!d || !s) return null;
  return Math.floor((mondayOf_(d).getTime() - mondayOf_(s).getTime()) / (7 * DAY_MS_)) + 1;
}

function weekRange_(n, semesterStartStr) {
  var s = mondayOf_(parseDate_(semesterStartStr));
  var a = new Date(s.getTime() + (n - 1) * 7 * DAY_MS_);
  var b = new Date(a.getTime() + 6 * DAY_MS_);
  return { start: fmtDate_(a), end: fmtDate_(b) };
}

/** ชั่วโมงทำงาน = (เลิก − เริ่ม − พัก) ปัดทศนิยม 2 ตำแหน่ง หรือ null ถ้าไม่ถูกต้อง */
function computeHours_(start, end, breakMin) {
  var a = parseTime_(start), b = parseTime_(end);
  var br = Number(breakMin === '' || breakMin === undefined || breakMin === null ? 0 : breakMin);
  if (a === null || b === null || !(b > a) || isNaN(br) || br < 0) return null;
  var mins = b - a - br;
  if (mins <= 0) return null;
  return Math.round(mins / 60 * 100) / 100;
}

function round2_(x) { return Math.round(Number(x || 0) * 100) / 100; }

function normEmail_(e) { return String(e || '').trim().toLowerCase(); }

function isEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '')); }
function isPhone_(s) { s = String(s || '').trim(); return /^[0-9+\-\s().#]{9,25}$/.test(s) && s.replace(/\D/g, '').length >= 9; }
function isWebUrl_(s) { return /^https?:\/\/[^\s\/]+\.[^\s]+$/i.test(String(s || '').trim()); }
/** ลิงก์ Google Maps หรือพิกัด lat,lng */
function isMapRef_(s) {
  s = String(s || '').trim();
  if (/^-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(s)) return true;
  return /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(s);
}
/** ทำลิงก์เปิดแผนที่จากค่าที่กรอก */
function mapHref_(s) {
  s = String(s || '').trim();
  if (!s) return '';
  return /^https:/i.test(s) ? s : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.replace(/\s+/g, ''));
}

function clip_(s, n) { return String(s === undefined || s === null ? '' : s).trim().slice(0, n); }

/**
 * ตรวจรายการ logbook
 * ctx: { semesterStart, semesterEnd, today, maxHoursPerDay, sameDay: [{entry_id,start,end,hours}] }
 */
/** เหตุที่ไม่ได้ปฏิบัติงาน (รายการ kind = absence ไม่นับชั่วโมง ผู้นิเทศงานรับทราบในชุดรับรองรายสัปดาห์) */
var ABSENCE_REASONS = { sick: 'ป่วย', personal: 'ลากิจ', closed: 'บริษัทหยุดหรือวันหยุด', other: 'อื่นๆ' };
var MIN_ACTIVITY_CHARS = 30;
var MAX_LINKS = 3;

/** ลิงก์หลักฐาน: คั่นด้วยช่องว่างหรือขึ้นบรรทัดใหม่ ไม่เกิน 3 ลิงก์ ต้องขึ้นต้นด้วย http:// หรือ https:// */
function splitLinks_(s) { return String(s || '').split(/\s+/).filter(String); }

function validateEntry_(e, ctx) {
  var errors = [];
  var d = parseDate_(e.date);
  if (!d) errors.push('วันที่ไม่ถูกต้อง');
  else {
    if (e.date < ctx.semesterStart) errors.push('วันที่อยู่ก่อนวันเปิดภาค (' + ctx.semesterStart + ')');
    if (e.date > ctx.semesterEnd) errors.push('วันที่เลยวันสิ้นสุดการฝึก (' + ctx.semesterEnd + ')');
    if (e.date > ctx.today) errors.push('บันทึกล่วงหน้าไม่ได้');
  }
  if (e.kind === 'absence') {
    if (!ABSENCE_REASONS[e.absence_reason]) errors.push('ต้องเลือกเหตุที่ไม่ได้ปฏิบัติงาน');
    if (e.absence_reason === 'other' && String(e.absence_note || '').trim().length < 3) errors.push('กรุณาระบุเหตุที่ไม่ได้ปฏิบัติงาน');
    if ((ctx.sameDay || []).some(function (o) { return o.entry_id !== e.entry_id && o.kind === 'absence'; })) errors.push('วันนี้บันทึกเหตุที่ไม่ได้ปฏิบัติงานไว้แล้ว');
    return { ok: errors.length === 0, errors: errors, hours: 0 };
  }
  if (e.course !== '305' && e.course !== '304') errors.push('ต้องเลือกรายวิชา 305 หรือ 304');
  if (!WORK_MODE_KEYS_[e.work_mode]) errors.push('ต้องเลือกรูปแบบการทำงานของวันนั้น');
  var act = String(e.activity || '').trim();
  if (act.length < MIN_ACTIVITY_CHARS) errors.push('รายละเอียดงานต้องยาวอย่างน้อย ' + MIN_ACTIVITY_CHARS + ' ตัวอักษร: บอกว่าทำอะไร ได้ผลอะไร ใช้เครื่องมืออะไร');
  if (act.length > 1000) errors.push('รายละเอียดงานยาวเกิน 1,000 ตัวอักษร');
  var links = splitLinks_(e.link_url);
  if (links.length > MAX_LINKS) errors.push('ใส่ลิงก์ได้ไม่เกิน ' + MAX_LINKS + ' ลิงก์');
  if (links.some(function (u) { return !/^https?:\/\/[^\s<>"]+$/i.test(u) || u.length > 300; })) errors.push('ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://');
  if (String(e.problems || '').length > 500) errors.push('ปัญหาและอุปสรรคยาวเกิน 500 ตัวอักษร');
  if (String(e.learned || '').length > 500) errors.push('สิ่งที่ได้เรียนรู้ยาวเกิน 500 ตัวอักษร');
  var hours = computeHours_(e.start, e.end, e.break_min);
  if (hours === null) errors.push('เวลาเริ่ม เวลาเลิก หรือเวลาพักไม่ถูกต้อง');
  else {
    var a = parseTime_(e.start), b = parseTime_(e.end);
    var total = hours;
    (ctx.sameDay || []).forEach(function (o) {
      if (o.entry_id === e.entry_id) return;
      total += Number(o.hours || 0);
      var oa = parseTime_(o.start), ob = parseTime_(o.end);
      if (oa !== null && ob !== null && a < ob && oa < b) errors.push('ช่วงเวลาซ้อนกับรายการ ' + o.start + '–' + o.end);
    });
    if (total > ctx.maxHoursPerDay) errors.push('รวมทั้งวันเกิน ' + ctx.maxHoursPerDay + ' ชั่วโมง');
  }
  return { ok: errors.length === 0, errors: errors, hours: hours };
}

var WORK_MODE_KEYS_ = { onsite: 1, hybrid: 1, remote: 1 };

/** สรุปชั่วโมงตามสถานะและรายวิชา */
function summarizeHours_(entries) {
  var z = function () { return { '305': 0, '304': 0 }; };
  var out = { certified: z(), pending: z(), draft: z(), returned: z() };
  entries.forEach(function (e) {
    var st = out[e.status] ? e.status : 'draft';
    var c = String(e.course);
    if (c !== '305' && c !== '304') return;
    out[st][c] = round2_(out[st][c] + Number(e.hours || 0));
  });
  return out;
}

/** ชั่วโมงที่ควรมี ณ วันนี้ (นับสัปดาห์ที่ผ่านไปครบแล้ว) */
function expectedHours_(todayStr, semesterStartStr, perWeek, target) {
  var w = weekIndex_(todayStr, semesterStartStr);
  if (w === null || w <= 1) return 0;
  return Math.min(target, (w - 1) * perWeek);
}

/** ตรวจข้อมูลที่ฝึก ถ้า forSubmit จะตรวจช่องบังคับ */
function validatePlacement_(p, forSubmit) {
  var errors = [];
  function req(k, label) { if (!String(p[k] || '').trim()) errors.push('กรุณากรอก ' + label); }
  if (p.supervisor_email && !isEmail_(p.supervisor_email)) errors.push('อีเมลผู้นิเทศงานไม่ถูกต้อง');
  if (p.coadvisor_email && !isEmail_(p.coadvisor_email)) errors.push('อีเมลที่ปรึกษาร่วมไม่ถูกต้อง');
  [['student_phone', 'โทรศัพท์นักศึกษา'], ['company_phone', 'โทรศัพท์สถานประกอบการ'], ['supervisor_phone', 'โทรศัพท์ผู้นิเทศงาน'], ['coadvisor_phone', 'โทรศัพท์ที่ปรึกษาร่วม']]
    .forEach(function (f) { if (String(p[f[0]] || '').trim() && !isPhone_(p[f[0]])) errors.push(f[1] + ' ไม่ถูกต้อง (ตัวเลขอย่างน้อย 9 หลัก)'); });
  if (String(p.company_website || '').trim() && !isWebUrl_(p.company_website)) errors.push('เว็บไซต์ต้องขึ้นต้นด้วย https:// หรือ http://');
  if (String(p.company_map_url || '').trim() && !isMapRef_(p.company_map_url)) errors.push('ตำแหน่งบนแผนที่ต้องเป็นลิงก์จาก Google Maps หรือพิกัด เช่น 18.7953, 98.9529');
  if (!forSubmit) return { ok: errors.length === 0, errors: errors };
  req('company_name', 'ชื่อสถานประกอบการ');
  req('company_type', 'ประเภทสถานประกอบการ');
  req('company_address', 'ที่อยู่สถานประกอบการ');
  req('province', 'จังหวัด');
  req('company_map_url', 'ตำแหน่งสถานประกอบการบน Google Maps');
  if (p.cv_required && !p.has_cv) errors.push('กรุณาแนบ CV (PDF) ก่อนส่ง ถ้ายังไม่มีช่องแนบ ให้กด "บันทึกร่าง" ก่อน');
  if (p.same_as_301 !== 'yes' && p.same_as_301 !== 'no') errors.push('กรุณาระบุว่าเป็นที่ฝึกเดิมจาก ENGSE301 หรือไม่');
  if (p.same_as_301 === 'no') req('change_reason', 'เหตุผลที่เปลี่ยนสถานประกอบการ');
  req('supervisor_name', 'ชื่อผู้นิเทศงาน');
  req('supervisor_position', 'ตำแหน่งผู้นิเทศงาน');
  req('supervisor_email', 'อีเมลผู้นิเทศงาน');
  if (p.coadvisor_same !== 'yes') {
    req('coadvisor_name', 'ชื่อที่ปรึกษาร่วม');
    req('coadvisor_position', 'ตำแหน่งที่ปรึกษาร่วม');
    req('coadvisor_email', 'อีเมลที่ปรึกษาร่วม');
  }
  req('position_title', 'ชื่อตำแหน่งงาน (ENGSE305)');
  req('job_description', 'ลักษณะงานตามตำแหน่ง (ENGSE305)');
  req('problem1_title', 'หัวข้อโจทย์ที่ 1 (ENGSE304)');
  req('problem1_detail', 'รายละเอียดโจทย์ที่ 1 (ENGSE304)');
  if (!WORK_MODE_KEYS_[p.work_mode]) errors.push('กรุณาเลือกรูปแบบการทำงาน');
  req('schedule_305', 'ตารางเวลา ENGSE305');
  req('schedule_304', 'ตารางเวลา ENGSE304');
  if (!IP_OWNER_KEYS_[p.ip_owner]) errors.push('กรุณาเลือกความเป็นเจ้าของผลงาน');
  if (!p.pdpa_consent) errors.push('กรุณายินยอมการใช้ข้อมูลส่วนบุคคล');
  return { ok: errors.length === 0, errors: errors };
}

var IP_OWNER_KEYS_ = { company: 1, joint: 1, student: 1 };

/** การเปลี่ยนสถานะที่อนุญาตของข้อมูลที่ฝึก */
var PLACEMENT_TRANSITIONS_ = {
  draft: ['submitted'],
  returned: ['submitted'],
  submitted: ['agreement_sent', 'returned'],
  agreement_sent: ['signed', 'returned'],
  signed: []
};

function canTransition_(from, to) {
  return (PLACEMENT_TRANSITIONS_[from || 'draft'] || []).indexOf(to) >= 0;
}

/** ค่าที่จะเขียนลงชีต: กันสูตร (= + - @) และกัน Sheets แปลงวันที่/ตัวเลขเอง */
function cellOut_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean' || v instanceof Date) return v;
  var s = String(v);
  if (s === '') return '';
  if (/^[=+\-@]/.test(s) || /^[\d\s.:\/\-T+Z]+$/.test(s)) return "'" + s;
  return s;
}
