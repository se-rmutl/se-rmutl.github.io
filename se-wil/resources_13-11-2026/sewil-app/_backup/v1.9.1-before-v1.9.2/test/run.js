/* Node test harness: loads all .gs files into one vm context with in-memory mocks of
 * SpreadsheetApp, Utilities, MailApp, LockService, PropertiesService, Session, ScriptApp.
 * Run: node test/run.js
 */
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = path.join(__dirname, '..', 'src');
let pass = 0, failN = 0;
function ok(cond, msg) { if (cond) { pass++; } else { failN++; console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

/* ---------- Sheets mock (emulates auto-conversion of typed strings) ---------- */
function conv(v) {
  if (typeof v === 'string') {
    if (v.startsWith("'")) return v.slice(1);
    if (v.startsWith('=')) return '#FORMULA!';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00+07:00');
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v);
    if (/^\d{1,2}:\d{2}$/.test(v)) return new Date('1899-12-30T' + v.padStart(5, '0') + ':00+07:00');
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  }
  return v;
}
class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr: nr || 1, nc: nc || 1 }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = this.sh.data[this.r - 1 + i] || [];
      const o = [];
      for (let j = 0; j < this.nc; j++) { const v = row[this.c - 1 + j]; o.push(v === undefined ? '' : v); }
      out.push(o);
    }
    return out;
  }
  setValues(vals) {
    vals.forEach((row, i) => {
      const rr = this.r - 1 + i;
      while (this.sh.data.length <= rr) this.sh.data.push([]);
      row.forEach((v, j) => { this.sh.data[rr][this.c - 1 + j] = conv(v); });
    });
    return this;
  }
  setFontWeight() { return this; }
}
class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  getLastRow() { return this.data.length; }
  getLastColumn() { return this.data.reduce((m, r) => Math.max(m, r.length), 0); }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr, nc); }
  appendRow(row) { this.data.push(row.map(conv)); }
  deleteRow(r) { this.data.splice(r - 1, 1); }
  setFrozenRows() { }
}
const book = { sheets: {}, getId: () => 'SS1', getSheetByName(n) { return this.sheets[n] || null; }, insertSheet(n) { return (this.sheets[n] = new Sheet(n)); } };

/* ---------- other mocks ---------- */
const props = {};
const outbox = [];
const driveFiles = {};
let fileSeq = 0;
let activeUser = 'owner@gmail.com';
/** Utilities.zip mock: writes the parts to a temp dir and zips them with the system zip (real archive, so tests can read it back) */
const os = require('os');
const { execFileSync } = require('child_process');
const toBuf = (b) => typeof b === 'string' ? Buffer.from(b, 'utf8') : Buffer.from(b.map(x => (x + 256) % 256));
function realZip(blobs, name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-'));
  blobs.forEach(b => { const f = path.join(dir, b.getName()); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, toBuf(b.getBytes())); });
  const out = path.join(dir, '..', path.basename(dir) + '.zip');
  execFileSync('zip', ['-X', '-D', '-q', '-r', out, '.'], { cwd: dir });
  const bytes = Array.from(fs.readFileSync(out)).map(x => (x > 127 ? x - 256 : x));
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(out, { force: true });
  let mime = 'application/zip';
  return { getBytes: () => bytes, getName: () => name, getContentType: () => mime, setContentType(m) { mime = m; return this; }, _dir: blobs.map(b => b.getName()) };
}
/** DocumentApp mock: every method chains, records calls */
const docCalls = [];
function chain(tag) {
  return new Proxy(function () { }, {
    get(t, p) {
      if (p === 'getId') return () => 'GDOC1';
      if (p === 'then' || typeof p === 'symbol') return undefined;
      return (...a) => { docCalls.push(tag + '.' + String(p) + (typeof a[0] === 'string' ? ':' + a[0] : '')); return chain(tag); };
    }
  });
}
function formatDate(d, tz, fmt) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    .formatToParts(d).forEach(p => { parts[p.type] = p.value; });
  if (parts.hour === '24') parts.hour = '00';
  return fmt.replace(/'([^']*)'|yyyy|MM|dd|HH|mm|ss/g, (m, lit) => lit !== undefined ? lit :
    ({ yyyy: parts.year, MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second })[m]);
}
const ctx = {
  console, Date, Math, JSON, Object, Array, String, Number, Error, RegExp, Promise, encodeURIComponent, parseInt, isNaN,
  SpreadsheetApp: { openById: () => book, getActiveSpreadsheet: () => book, getUi: () => { throw new Error('no ui'); } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); } }) },
  LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(String(s), 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)),
    DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
    base64Decode: s => { if (!/^[A-Za-z0-9+/=\s]*$/.test(s)) throw new Error('bad b64'); return Array.from(Buffer.from(s, 'base64')).map(b => (b > 127 ? b - 256 : b)); },
    base64Encode: bytes => Buffer.from(bytes.map(b => (b + 256) % 256)).toString('base64'),
    newBlob: (bytes, mime, name) => ({ getBytes: () => bytes, getContentType: () => mime, getName: () => name }),
    zip: (blobs, name) => realZip(blobs, name),
    gzip: (blob) => { const b = require('zlib').gzipSync(toBuf(blob.getBytes())); const bytes = Array.from(b).map(x => (x > 127 ? x - 256 : x)); return { getBytes: () => bytes, getName: () => 'x.gz', getContentType: () => 'application/x-gzip' }; },
    base64EncodeWebSafe: bytes => Buffer.from(bytes.map(b => (b + 256) % 256)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    formatDate
  },
  MailApp: { sendEmail: o => outbox.push(o), getRemainingDailyQuota: () => 100 },
  Session: { getActiveUser: () => ({ getEmail: () => activeUser }), getEffectiveUser: () => ({ getEmail: () => 'owner@gmail.com' }) },
  ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' }) },
  DriveApp: {
    getFileById: id => { if (!driveFiles[id]) throw new Error('no file ' + id); return driveFiles[id]; }
  }, DocumentApp: {
    create: n => { docCalls.push('create:' + n); return chain('doc'); },
    HorizontalAlignment: { CENTER: 'C', RIGHT: 'R', JUSTIFY: 'J', LEFT: 'L' }, ElementType: { PARAGRAPH: 'P' }
  }, HtmlService: {}, Buffer
};
vm.createContext(ctx);
for (const f of ['Config.gs', 'Logic.gs', 'Db.gs', 'Auth.gs', 'Mail.gs', 'Placement.gs', 'Agreement.gs', 'Files.gs', 'Logbook.gs', 'Assign.gs', 'Todo.gs', 'Setup.gs', 'Code.gs', 'Krut.gs', 'Docs.gs', 'Letter.gs', 'Reset.gs']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f });
}
// stub Drive/Docs-dependent functions
ctx.outputFolder_ = () => ({ getId: () => 'FOLDER' });
ctx.rootFolder_ = () => ({ getId: () => 'ROOT', getName: () => 'SE-WIL' });
ctx.uploadFolder_ = () => ({ createFile: blob => { const id = 'FILE' + (++fileSeq); driveFiles[id] = { trashed: false, setTrashed(v) { this.trashed = v; }, getBlob: () => blob }; return { getId: () => id }; } });
ctx.templateDoc_ = () => 'TEMPLATE';
const savedDocs = [];
ctx.docsFolder_ = () => ({ createFile: b => { savedDocs.push(b.getName()); } });
driveFiles.GDOC1 = { trashed: false, setTrashed(v) { this.trashed = v; }, getAs: mime => { let n = ''; return { setName(x) { n = x; return this; }, getName: () => n, getContentType: () => mime, getBytes: () => [37, 80, 68, 70] }; } };
let genCalls = 0;
ctx.generateAgreement_ = (p) => { genCalls++; return { docId: 'DOC' + genCalls, pdfId: 'PDF' + genCalls, pdfUrl: 'https://drive.google.com/file/d/PDF' + genCalls, blob: { name: p.agreement_no + '.pdf' } }; };

const run = (code) => vm.runInContext(code, ctx);
const tokenFrom = (mail, key) => { const m = new RegExp(key + '=([a-zA-Z0-9]+)').exec(mail.htmlBody); return m && m[1]; };
const lastMailTo = (to) => outbox.filter(m => m.to === to).slice(-1)[0];

/* ---------- 1. pure logic ---------- */
console.log('1. Logic');
eq(run("weekIndex_('2026-11-18','2026-11-18')"), 1, 'week of opening day');
eq(run("weekIndex_('2026-11-16','2026-11-18')"), 1, 'Monday of opening week');
eq(run("weekIndex_('2026-11-22','2026-11-18')"), 1, 'Sunday of opening week');
eq(run("weekIndex_('2026-11-23','2026-11-18')"), 2, 'next Monday');
eq(run("weekIndex_('2027-03-09','2026-11-18')"), 17, 'last day (Tue) in calendar week 17');
eq(run("computeHours_('08:00','12:00',0)"), 4, '4 hours');
eq(run("computeHours_('08:30','17:00',60)"), 7.5, 'with lunch');
eq(run("computeHours_('12:00','08:00',0)"), null, 'end before start');
eq(run("computeHours_('08:00','08:30',45)"), null, 'break longer than span');
eq(run("cellOut_('2026-11-20')"), "'2026-11-20", 'date string protected');
eq(run("cellOut_('08:00')"), "'08:00", 'time string protected');
eq(run("cellOut_('=1+1')"), "'=1+1", 'formula protected');
eq(run("cellOut_('+66 81 234 5678')"), "'+66 81 234 5678", 'phone protected');
eq(run("cellOut_('ข้อความ')"), 'ข้อความ', 'Thai text unchanged');
eq(run("cellOut_(4.5)"), 4.5, 'number unchanged');
eq(run("expectedHours_('2026-11-30','2026-11-18',20,300)"), 40, 'expected after 2 weeks');
eq(run("expectedHours_('2027-06-01','2026-11-18',20,300)"), 300, 'expected capped');
const v1 = run("validateEntry_({entry_id:'',date:'2026-11-20',start:'09:00',end:'11:00',break_min:0,course:'305',work_mode:'onsite',activity:'ทดสอบงานยาวพอสมควร'},{semesterStart:'2026-11-18',semesterEnd:'2027-03-09',today:'2026-11-25',maxHoursPerDay:12,sameDay:[{entry_id:'E1',start:'08:00',end:'10:00',hours:2}]})");
ok(!v1.ok && v1.errors.join().indexOf('ซ้อน') >= 0, 'overlap detected');
eq(run("canTransition_('submitted','agreement_sent')"), true, 'transition submitted->agreement_sent');
eq(run("canTransition_('signed','returned')"), false, 'signed is final');

/* ---------- 2. security surface ---------- */
console.log('2. Public functions');
const allow = /^(doGet|onOpen|setup|installTriggers|runDigestNow|rebuildTemplate|showMailQuota|purgePersonalData|job_weeklyDigest|api_[a-zA-Z]+)$/;
fs.readdirSync(SRC).filter(f => f.endsWith('.gs')).forEach(f => {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  (src.match(/^function\s+([A-Za-z0-9_]+)/gm) || []).map(s => s.split(/\s+/)[1]).forEach(name => {
    if (!name.endsWith('_')) ok(allow.test(name), f + ': public function "' + name + '" not in allowlist');
  });
});

/* ---------- 3. setup ---------- */
console.log('3. Setup');
activeUser = '';
let threw = false; try { run('setup()'); } catch (e) { threw = /เจ้าของ/.test(e.message); }
ok(threw, 'setup refused for anonymous caller');
threw = false; try { run('purgePersonalData()'); } catch (e) { threw = /เจ้าของ/.test(e.message); }
ok(threw, 'purge refused for anonymous caller');
activeUser = 'owner@gmail.com';
run('setup()');
ok(book.sheets.Users && book.sheets.Logbook && book.sheets.Config, 'sheets created');
eq(run("readAll_('Users').length"), 2, 'owner and coordinator seeded');
eq(run("readAll_('Users').filter(function(u){return u.role==='admin';}).map(function(u){return u.email;}).sort().join(',')"), 'owner@gmail.com,thanit@rmutl.ac.th', 'owner and coordinator are admins');
run('setup()');
eq(run("readAll_('Users').length"), 2, 'setup re-run does not duplicate rows');
// test semester: started 10 days ago
const today = run('todayStr_()');
const start = new Date(Date.parse(today + 'T00:00:00Z') - 10 * 864e5).toISOString().slice(0, 10);
const dayBefore = (n) => new Date(Date.parse(today + 'T00:00:00Z') - n * 864e5).toISOString().slice(0, 10);
run(`(function(){ var r=findOne_('Config',function(x){return x.key==='SEMESTER_START';}); update_('Config', r._row, {value:'${start}'}); resetConfigCache_(); })()`);
eq(run('cfg_().SEMESTER_START'), start, 'config updated and read back as string');
run(`insert_('Users',{email:'s1@live.rmutl.ac.th',role:'student',student_id:'66543206001',name:'นายทดสอบ ระบบ',section:'ซว4ก',advisor_email:'t1@rmutl.ac.th',active:'TRUE'})`);
run(`insert_('Users',{email:'t1@rmutl.ac.th',role:'teacher',student_id:'',name:'อ.ที่ปรึกษา',phone:'053-000111',section:'',advisor_email:'',active:'TRUE'})`);
run("setConfig_('PROGRAM_HEAD_NAME', 'หัวหน้าหลักสูตร ทดสอบ'); setConfig_('PROGRAM_HEAD_EMAIL', 'head@rmutl.ac.th'); setConfig_('PROGRAM_HEAD_PHONE', '053-999888'); setConfig_('COORDINATOR_PHONE', '053-777666')");
run(`insert_('Users',{email:'a1@rmutl.ac.th',role:'admin',student_id:'',name:'หัวหน้าหลักสูตร',section:'',advisor_email:'',active:'TRUE'})`);
eq(run("findUser_('S1@LIVE.rmutl.ac.th').student_id"), '66543206001', 'student id stays text (no number conversion)');

/* ---------- 4. login ---------- */
console.log('4. Login');
function login(email) {
  const r = run(`api_requestLogin(${JSON.stringify(email)})`);
  ok(r.ok, 'requestLogin ok for ' + email);
  const t = tokenFrom(lastMailTo(email.trim().toLowerCase()), 't');
  ok(!!t, 'login mail has token');
  const x = run(`api_exchange('${t}')`);
  ok(x.ok, 'exchange ok');
  return { s: x.session, t };
}
const n0 = outbox.length;
eq(run("api_requestLogin('nobody@example.com').ok"), true, 'unknown email returns ok');
eq(outbox.length, n0, 'no mail to unknown email');
eq(run("api_requestLogin('bad').ok"), false, 'invalid email rejected');
const st = login(' S1@live.rmutl.ac.th ');
eq(run(`api_exchange('${st.t}').ok`), false, 'login link single use');
eq(run(`api_me('${st.s}').me.role`), 'student', 'me = student');
eq(run(`api_me('x'.repeat(64)).auth`), true, 'bad session -> auth error');
const ad = login('a1@rmutl.ac.th');
const te = login('t1@rmutl.ac.th');

/* ---------- 5. placement ---------- */
console.log('5. Placement');
let r = run(`api_placementGet('${st.s}')`);
ok(r.ok && r.placement === null && r.editable, 'empty placement editable');
const data = {
  company_name: '=HYPERLINK("http://x")', company_type: 'เอกชน', company_address: '99 ถ.ห้วยแก้ว', province: 'เชียงใหม่',
  same_as_301: 'yes', supervisor_name: 'คุณผู้นิเทศ', supervisor_position: 'Tech Lead', supervisor_email: 'Sup@Company.co.th', supervisor_phone: '081-234-5678',
  coadvisor_same: 'yes', position_title: 'Junior Developer', job_description: 'พัฒนา API และแก้บั๊ก',
  student_phone: '089-111-2222', company_phone: '053-123456', company_website: 'https://www.example.co.th',
  company_map_url: 'https://maps.app.goo.gl/AbCdEf123',
  problem1_title: 'ระบบติดตามงานซ่อม', problem1_detail: 'ลดเวลาติดตามงานซ่อมด้วยเว็บแอป', work_mode: 'hybrid',
  schedule_305: 'จ–ศ 08:00–12:00', schedule_304: 'พฤ–ศ 14:00–17:00', ip_owner: 'company', compensation: 'ไม่มี', pdpa_consent: true
};
r = run(`api_placementSave('${st.s}', {company_name:'บริษัท ก'}, false)`);
ok(r.ok, 'save partial draft');
r = run(`api_placementSave('${st.s}', {company_name:'บริษัท ก'}, true)`);
ok(!r.ok && r.errors.length > 5, 'submit with missing fields rejected');
/* v1.2: ข้อมูลติดต่อและไฟล์แนบ */
const PDF_B64 = Buffer.from('%PDF-1.4\n%test cv\n').toString('base64');
const PNG_B64 = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]).toString('base64');
r = run(`api_placementSave('${st.s}', ${JSON.stringify(Object.assign({}, data, { student_phone: '', company_phone: '', company_map_url: '' }))}, true)`);
ok(!r.ok && r.errors.length === 1 && /Google Maps/.test(r.errors[0]), 'map required on submit, phones optional');
r = run(`api_placementSave('${st.s}', ${JSON.stringify(Object.assign({}, data, { student_phone: '12', company_website: 'www.x.com', company_map_url: 'https://evil.example.com/maps' }))}, false)`);
ok(!r.ok && r.errors.length === 3, 'bad phone, website and map link rejected even for draft');
eq(run("isMapRef_('18.7953, 98.9529')"), true, 'map accepts coordinates');
eq(run("isMapRef_('https://www.google.com/maps/place/RMUTL')"), true, 'map accepts google maps link');
eq(run("mapHref_('18.7953, 98.9529')"), 'https://www.google.com/maps/search/?api=1&query=18.7953%2C98.9529', 'coordinates -> maps link');
eq(run("isPhone_('+66 81 234 5678')"), true, 'international phone ok');
r = run(`api_placementUpload('${st.s}', 'cv', 'my cv.pdf', '${PNG_B64}')`);
ok(!r.ok && /PDF/.test(r.error), 'cv must be real PDF (magic bytes)');
r = run(`api_placementUpload('${st.s}', 'cv', 'my cv.pdf', 'data:application/pdf;base64,${PDF_B64}')`);
ok(r.ok && r.name === 'my cv.pdf', 'upload cv (data URL accepted)');
const cvId1 = run("placementOf_('s1@live.rmutl.ac.th').cv_file_id");
r = run(`api_placementUpload('${st.s}', 'cv', 'cv2.pdf', '${PDF_B64}')`);
ok(r.ok && driveFiles[cvId1].trashed === true, 'replacing cv trashes old file');
r = run(`api_placementUpload('${st.s}', 'photo', 'front.png', '${PNG_B64}')`);
ok(r.ok, 'upload company photo');
eq(run(`api_placementUpload('${st.s}', 'exe', 'x', '${PDF_B64}').ok`), false, 'unknown upload kind rejected');
run("setConfig_('MAX_UPLOAD_MB', '0.00001')");
eq(run(`api_placementUpload('${st.s}', 'cv', 'big.pdf', '${PDF_B64}').ok`), false, 'oversize upload rejected');
run("setConfig_('MAX_UPLOAD_MB', '5')");
r = run(`api_placementGet('${st.s}')`);
ok(r.placement.has_cv && r.placement.has_photo && !('cv_file_id' in r.placement) && !('company_photo_id' in r.placement), 'file ids hidden, flags shown');
ok(r.advisor && r.advisor.phone === '053-000111', 'student sees advisor phone');
eq(run(`api_placementFile('${st.s}', 'cv').ok`), true, 'student opens own cv');
r = run(`api_placementSave('${st.s}', ${JSON.stringify(data)}, true)`);
ok(r.ok && r.status === 'submitted', 'submit full placement');
let p = run("placementOf_('s1@live.rmutl.ac.th')");
eq(p.company_name, data.company_name, 'formula-like text stored as text');
eq(p.supervisor_phone, '081-234-5678', 'phone stored as text');
eq(p.supervisor_email, 'sup@company.co.th', 'supervisor email normalized');
ok(!!p.pdpa_consent_at, 'consent timestamp');
eq(run(`api_placementSave('${st.s}', ${JSON.stringify(data)}, false).ok`), false, 'submitted placement locked');
eq(run(`api_adminApprove('${te.s}', '${p.placement_id}', '').error`), 'ไม่มีสิทธิ์ใช้งานส่วนนี้', 'teacher cannot approve');
r = run(`api_adminOverview('${te.s}')`);
ok(r.ok && r.counts.submitted === 1, 'overview counts submitted');
eq(run(`api_adminReturn('${ad.s}', '${p.placement_id}', 'สั้น').ok`), false, 'return needs reason');
r = run(`api_adminReturn('${ad.s}', '${p.placement_id}', 'กรุณาแก้ชื่อบริษัทให้ถูกต้อง')`);
ok(r.ok, 'return ok');
ok(/ส่งกลับ/.test(lastMailTo('s1@live.rmutl.ac.th').subject), 'student notified of return');
r = run(`api_placementSave('${st.s}', ${JSON.stringify(Object.assign({}, data, { company_name: 'บริษัท ซอฟต์แวร์ล้านนา จำกัด' }))}, true)`);
ok(r.ok, 'resubmit after return');
p = run("placementOf_('s1@live.rmutl.ac.th')");
eq(run(`api_logSave('${st.s}', {date:'${today}',start:'08:00',end:'12:00',break_min:0,course:'305',work_mode:'onsite',activity:'ทดสอบก่อนอนุมัติ'}).ok`), false, 'logbook closed before approval');
const mailsBefore = outbox.length;
r = run(`api_adminApprove('${ad.s}', '${p.placement_id}', 'ผ่าน')`);
ok(r.ok && /^SE-WIL01\/2569-001$/.test(r.agreement_no), 'approve -> agreement no ' + r.agreement_no);
eq(outbox.length - mailsBefore, 2, 'two agreement emails (supervisor + student)');
const svMail = lastMailTo('sup@company.co.th');
ok(svMail && svMail.attachments && svMail.attachments.length === 1, 'supervisor mail has PDF attachment');
ok(/16 พฤศจิกายน 2569/.test(svMail.htmlBody), 'supervisor mail states agreement due date');
ok(svMail.htmlBody.indexOf('https://se-rmutl.github.io/se-wil/company/supervisor.html') >= 0, 'supervisor mail links to supervisor guide');
ok(svMail.htmlBody.indexOf('se-rmutl.github.io/se-wil') >= 0 && /คู่มือ ปฏิทิน/.test(svMail.htmlBody), 'mail footer links to portal');
ok(/089-111-2222/.test(svMail.htmlBody) && /053-000111/.test(svMail.htmlBody) && /053-777666/.test(svMail.htmlBody), 'supervisor mail lists coordinator, student and advisor phones');
ok(svMail.htmlBody.indexOf('ผู้ประสานงานหลักสูตร (ติดต่อหลัก)') >= 0 && svMail.htmlBody.indexOf('ผู้ประสานงานหลักสูตร (ติดต่อหลัก)') < svMail.htmlBody.indexOf('089-111-2222'), 'coordinator listed first in supervisor mail');
ok(!/053-999888/.test(svMail.htmlBody) && !/head@rmutl/.test(svMail.htmlBody), 'program head not in supervisor mail');
eq(svMail.replyTo, 'thanit@rmutl.ac.th', 'reply-to falls back to coordinator email');
const k = tokenFrom(svMail, 'k');
{
  const sg = run(`api_svGet('${k}')`);
  const a0 = sg.agreements[0];
  ok(a0.student_phone === '089-111-2222' && a0.has_cv && a0.advisor.phone === '053-000111' && sg.head.phone === '053-999888', 'supervisor sees contacts and cv flag');
  ok(sg.coordinator && sg.coordinator.email === 'thanit@rmutl.ac.th' && sg.coordinator.phone === '053-777666' && /ธนิต/.test(sg.coordinator.name), 'supervisor page has coordinator contact');
  const f = run(`api_svFile('${k}', '${a0.placement_id}', 'cv')`);
  ok(f.ok && Buffer.from(f.data, 'base64').toString().startsWith('%PDF'), 'supervisor downloads cv');
  eq(run(`api_svFile('${k}', '${a0.placement_id}', 'photo').ok`), false, 'supervisor cannot open photo');
  const kOther = run("getOrCreateSupervisor_('other@company.co.th','อื่น').token");
  eq(run(`api_svFile('${kOther}', '${a0.placement_id}', 'cv').ok`), false, 'other supervisor cannot open cv');
  eq(run(`api_adminFile('${te.s}', '${a0.placement_id}', 'photo').ok`), true, 'teacher opens company photo');
  eq(run(`api_adminFile('${st.s}', '${a0.placement_id}', 'cv').ok`), false, 'student cannot use admin file api');
  const av = run(`agreementValues_(placementOf_('s1@live.rmutl.ac.th'), findUser_('s1@live.rmutl.ac.th'), findUser_('t1@rmutl.ac.th'))`);
  ok(av.STUDENT_PHONE === '089-111-2222' && /053-000111/.test(av.ADVISOR) && av.COMPANY_PHONE === '053-123456' && /maps\.app\.goo\.gl/.test(av.COMPANY_MAP), 'agreement values include contacts');
  ok(/ธนิต/.test(av.COORDINATOR) && /thanit@rmutl\.ac\.th/.test(av.COORDINATOR) && /053-777666/.test(av.COORDINATOR), 'agreement lists coordinator with phone');
  ok(/head@rmutl\.ac\.th/.test(av.PROGRAM_HEAD) && !/053-999888/.test(av.PROGRAM_HEAD), 'agreement lists head by name and email only');
}
ok(!!k, 'supervisor link token');
p = run("placementOf_('s1@live.rmutl.ac.th')");
eq(p.status, 'agreement_sent', 'status agreement_sent');

/* ---------- 6. logbook ---------- */
console.log('6. Logbook');
const d1 = dayBefore(3), d2 = dayBefore(2);
const save = (o) => run(`api_logSave('${st.s}', ${JSON.stringify(o)})`);
r = save({ date: d1, start: '08:00', end: '12:00', break_min: 0, course: '305', work_mode: 'onsite', activity: 'พัฒนา REST API สำหรับลูกค้า ทดสอบด้วย Postman ผ่านทั้งหมด' });
ok(r.ok && r.hours === 4, 'entry 305 saved 4h');
const e1 = r.entry_id;
r = save({ date: d1, start: '11:00', end: '13:00', break_min: 0, course: '304', work_mode: 'onsite', activity: 'เก็บความต้องการโครงงานจากหัวหน้าฝ่ายซ่อมบำรุง' });
ok(!r.ok && /ซ้อน/.test(r.error), 'overlap rejected');
r = save({ date: d1, start: '14:00', end: '17:00', break_min: 0, course: '304', work_mode: 'remote', activity: 'เก็บความต้องการโครงงานกับผู้ใช้ 3 คน สรุปเป็น user story' });
ok(r.ok && r.hours === 3, 'entry 304 saved 3h');
const e2 = r.entry_id;
r = save({ date: d2, start: '08:00', end: '12:00', break_min: 0, course: '305', work_mode: 'onsite', activity: 'สั้น' });
ok(!r.ok, 'short activity rejected');
r = save({ date: dayBefore(-1), start: '08:00', end: '12:00', break_min: 0, course: '305', work_mode: 'onsite', activity: 'บันทึกล่วงหน้าไม่ได้ ระบบต้องปฏิเสธรายการนี้ทันที' });
ok(!r.ok && /ล่วงหน้า/.test(r.error), 'future date rejected');
r = save({ date: dayBefore(20), start: '08:00', end: '12:00', break_min: 0, course: '305', work_mode: 'onsite', activity: 'ก่อนเปิดภาคไม่ได้ ระบบต้องปฏิเสธรายการนี้ทันที' });
ok(!r.ok && /ก่อนวันเปิดภาค/.test(r.error), 'before semester rejected');
r = save({ date: d2, start: '08:00', end: '12:00', break_min: 0, course: '999', work_mode: 'onsite', activity: 'รหัสวิชาผิดต้องไม่ผ่าน ระบบต้องปฏิเสธรายการนี้' });
ok(!r.ok, 'bad course rejected');
r = run(`api_logList('${st.s}')`);
ok(r.ok && r.entries.length === 2, 'two entries listed');
const stored = r.entries.filter(e => e.entry_id === e1)[0];
eq(stored.date, d1, 'date read back as text');
eq(stored.start, '08:00', 'time read back as text');
eq(stored.course, '305', 'course read back as text');
eq(r.summary.draft['305'], 4, 'draft 305 = 4');

r = run(`api_logSendNow('${st.s}')`);
ok(r.ok, 'send now creates batch');
const batchId = r.batch_id;
ok(/รอรับรอง/.test(lastMailTo('sup@company.co.th').subject), 'digest mail to supervisor');
eq(run(`api_logSendNow('${st.s}').ok`), false, 'send now rate-limited');
eq(run(`api_logSave('${st.s}', {entry_id:'${e1}',date:'${d1}',start:'08:00',end:'11:00',break_min:0,course:'305',work_mode:'onsite',activity:'แก้ไขรายการที่ส่งแล้ว ระบบต้องไม่ยอมให้แก้ไขรายการ'}).ok`), false, 'pending entry locked');
eq(run(`api_logDelete('${st.s}', '${e1}').ok`), false, 'pending entry cannot be deleted');

/* ---------- 7. supervisor ---------- */
console.log('7. Supervisor');
eq(run(`api_svGet('${'x'.repeat(64)}').ok`), false, 'bad supervisor token rejected');
r = run(`api_svGet('${k}')`);
ok(r.ok && r.agreements.length === 1 && r.pending.length === 1 && r.pending[0].entries.length === 2, 'supervisor sees agreement and batch');
eq(run(`api_svAcceptAgreement('${k}', '${p.placement_id}', 'คุณผู้นิเทศ', false).ok`), false, 'accept requires checkbox');
r = run(`api_svAcceptAgreement('${k}', '${p.placement_id}', 'คุณผู้นิเทศ ใจดี', true)`);
ok(r.ok, 'accept agreement online');
eq(run("placementOf_('s1@live.rmutl.ac.th').status"), 'signed', 'placement signed');
eq(run(`api_svDecide('${k}', '${batchId}', ['${e1}'], [], '').ok`), false, 'decision must cover all entries');
eq(run(`api_svDecide('${k}', '${batchId}', ['${e1}'], ['${e2}'], '').ok`), false, 'return needs reason');
r = run(`api_svDecide('${k}', '${batchId}', ['${e1}'], ['${e2}'], 'กรุณาระบุรายละเอียดผู้ใช้ที่สัมภาษณ์')`);
ok(r.ok && r.status === 'partial', 'partial certification');
ok(/ส่งกลับ/.test(lastMailTo('s1@live.rmutl.ac.th').subject), 'student notified of returned entries');
eq(run(`api_svDecide('${k}', '${batchId}', ['${e1}'], ['${e2}'], 'ซ้ำ').ok`), false, 'batch cannot be decided twice');
r = run(`api_logList('${st.s}')`);
eq(r.summary.certified['305'], 4, 'certified 305 = 4');
eq(r.summary.returned['304'], 3, 'returned 304 = 3');
r = save({ entry_id: e2, date: d1, start: '14:00', end: '17:30', break_min: 0, course: '304', work_mode: 'remote', activity: 'สัมภาษณ์ผู้ใช้ 3 คน ฝ่ายซ่อมบำรุง สรุปปัญหาเป็นตาราง' });
ok(r.ok && r.hours === 3.5, 'returned entry edited -> draft');
eq(run(`api_logDelete('${st.s}', '${e1}').ok`), false, 'certified entry cannot be deleted');

/* ---------- 8. weekly digest ---------- */
console.log('8. Digest');
props.LAST_DIGEST_AT = new Date(Date.now() - 3600e3).toISOString();
r = run('job_weeklyDigest()');
ok(r.batches === 1 && r.emails === 1, 'digest created 1 batch and 1 email');
ok(run('job_weeklyDigest()').skipped, 'digest rate-limited');
eq(run(`api_adminRunDigest('${te.s}').ok`), false, 'teacher cannot run digest');
r = run(`api_adminStudent('${te.s}', 's1@live.rmutl.ac.th')`);
ok(r.ok && r.entries.length === 2 && r.batches.length === 2, 'teacher sees student detail');
r = run(`api_adminOverview('${ad.s}')`);
eq(r.counts.signed, 1, 'overview counts signed');
// fixtures for UI preview
fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify({
  me: run(`api_me('${st.s}')`), placementGet: run(`api_placementGet('${st.s}')`), logList: run(`api_logList('${st.s}')`),
  adminMe: run(`api_me('${ad.s}')`), adminOverview: run(`api_adminOverview('${ad.s}')`), adminStudent: run(`api_adminStudent('${ad.s}', 's1@live.rmutl.ac.th')`),
  svGet: run(`api_svGet('${k}')`)
}, null, 1));
r = run(`api_logout('${st.s}')`);
eq(run(`api_me('${st.s}').ok`), false, 'logout invalidates session');

console.log('8b. Link rotation');
run(`(function(){ var r=findOne_('Supervisors',function(x){return x.email==='sup@company.co.th';}); update_('Supervisors', r._row, {token:''}); })()`);
eq(run(`api_svGet('${k}').ok`), false, 'revoked supervisor link rejected');
const k2 = run(`getOrCreateSupervisor_('sup@company.co.th','').token`);
ok(k2 && k2.length >= 32 && k2 !== k, 'new supervisor token issued');
eq(run(`api_svGet('${k2}').ok`), true, 'new link works');

/* ---------- 9. audit and sheet hygiene ---------- */
console.log('9. Hygiene');
const anyDateObjects = Object.values(book.sheets).filter(s => ['Logbook', 'Placements', 'CertBatches'].indexOf(s.name) >= 0)
  .some(s => s.data.slice(1).some(row => row.some(v => v instanceof Date)));
ok(!anyDateObjects, 'no auto-converted Date cells in data sheets');
const anyFormula = Object.values(book.sheets).some(s => s.data.some(row => row.some(v => v === '#FORMULA!')));
ok(!anyFormula, 'no formula injection');
ok(book.sheets.Audit.data.length > 10, 'audit trail written');

/* ---------- 9b. CV required ---------- */
console.log('9b. CV required');
run(`insert_('Users',{email:'s2@live.rmutl.ac.th',role:'student',student_id:'66543206002',name:'นักศึกษา สอง',section:'ซว4ก',advisor_email:'t1@rmutl.ac.th',active:'TRUE'})`);
run("setConfig_('CV_REQUIRED', 'TRUE')");
const st2 = login('s2@live.rmutl.ac.th');
r = run(`api_placementSave('${st2.s}', ${JSON.stringify(data)}, true)`);
ok(!r.ok && r.errors.some(e => /CV/.test(e)), 'CV_REQUIRED blocks submit without cv');
eq(run(`api_placementSave('${st2.s}', ${JSON.stringify(data)}, false).ok`), true, 'save draft first');
eq(run(`api_placementUpload('${st2.s}', 'cv', 'cv.pdf', '${PDF_B64}').ok`), true, 'upload after draft saved');
eq(run(`api_placementSave('${st2.s}', ${JSON.stringify(data)}, true).ok`), true, 'submit ok once cv attached');
run("setConfig_('CV_REQUIRED', 'FALSE')");

/* ---------- 9c. PDPA: need-to-know and retention ---------- */
console.log('9c. PDPA');
run(`insert_('Users',{email:'t2@rmutl.ac.th',role:'teacher',student_id:'',name:'อ.อื่น',phone:'053-222333',section:'',advisor_email:'',active:'TRUE'})`);
run(`insert_('Users',{email:'s3@live.rmutl.ac.th',role:'student',student_id:'66543206003',name:'นักศึกษา สาม',section:'ซว4ก',advisor_email:'t2@rmutl.ac.th',active:'TRUE'})`);
const t2 = login('t2@rmutl.ac.th');
r = run(`api_adminOverview('${t2.s}')`);
ok(r.ok && r.scope === 'advisees' && r.rows.length === 1 && r.rows[0].email === 's3@live.rmutl.ac.th', 'teacher sees only own advisees');
r = run(`api_adminOverview('${te.s}')`);
ok(r.rows.every(x => x.advisor_email === 't1@rmutl.ac.th') && r.rows.length === 2, 'advisor t1 sees s1 and s2 only');
r = run(`api_adminOverview('${ad.s}')`);
ok(r.scope === 'all' && r.rows.length === 3, 'admin sees all students');
eq(run(`api_adminStudent('${t2.s}', 's1@live.rmutl.ac.th').ok`), false, 'other teacher cannot open student detail');
eq(run(`api_adminStudent('${t2.s}', 't1@rmutl.ac.th').ok`), false, 'detail api refuses non-student accounts');
const pid1 = run("placementOf_('s1@live.rmutl.ac.th').placement_id");
eq(run(`api_adminFile('${t2.s}', '${pid1}', 'cv').ok`), false, 'other teacher cannot open cv');
eq(run(`api_adminFile('${ad.s}', '${pid1}', 'cv').ok`), true, 'admin opens cv');
const cvBefore = run("placementOf_('s1@live.rmutl.ac.th').cv_file_id");
const n = run('purgePersonalData_()');
ok(n.cv >= 1 && n.photo >= 1 && n.phone >= 1, 'purge counts ' + JSON.stringify(n));
const pp = run("placementOf_('s1@live.rmutl.ac.th')");
ok(!pp.cv_file_id && !pp.company_photo_id && !pp.student_phone && driveFiles[cvBefore].trashed, 'purge removes cv, photo, phone');
ok(pp.agreement_no && pp.supervisor_phone, 'purge keeps agreement record');

/* ---------- 9d. phones optional and editable ---------- */
console.log('9d. Phones optional');
run(`insert_('Users',{email:'s4@live.rmutl.ac.th',role:'student',student_id:'66543206004',name:'นักศึกษา สี่',section:'ซว4ก',advisor_email:'t1@rmutl.ac.th',active:'TRUE'})`);
const st4 = login('s4@live.rmutl.ac.th');
r = run(`api_placementSave('${st4.s}', ${JSON.stringify(Object.assign({}, data, { student_phone: '', company_phone: '', supervisor_phone: '', supervisor_email: 'sv4@company.co.th' }))}, true)`);
ok(r.ok, 'submit with no phones at all');
eq(run(`api_placementPhone('${st4.s}', '12').ok`), false, 'invalid phone rejected by phone editor');
eq(run(`api_placementPhone('${st4.s}', '081-555-6666').ok`), true, 'student adds phone after submit');
eq(run("placementOf_('s4@live.rmutl.ac.th').student_phone"), '081-555-6666', 'phone saved');
eq(run(`api_placementPhone('${st4.s}', '').ok`), true, 'student removes phone (withdraw)');
eq(run("placementOf_('s4@live.rmutl.ac.th').student_phone"), '', 'phone removed');
{
  const p4 = run("placementOf_('s4@live.rmutl.ac.th')");
  const av4 = run(`agreementValues_(placementOf_('s4@live.rmutl.ac.th'), findUser_('s4@live.rmutl.ac.th'), findUser_('t1@rmutl.ac.th'))`);
  ok(av4.STUDENT_PHONE === '-' && av4.SUPERVISOR_PHONE === '' && p4.status === 'submitted', 'agreement shows dash for missing phones');
  const html = run(`contactsHtml_(placementOf_('s4@live.rmutl.ac.th'), findUser_('s4@live.rmutl.ac.th'))`);
  ok(!/โทร\s*</.test(html) && /s4@live/.test(html), 'contacts table omits empty phone');
}

/* ---------- 9e. coordinator ---------- */
console.log('9e. Coordinator');
{
  const co = run('coordinator_()');
  ok(co && co.email === 'thanit@rmutl.ac.th' && co.name === 'อาจารย์ธนิต เกตุแก้ว', 'coordinator defaults');
  const g = run(`api_placementGet('${st4.s}')`);
  ok(g.coordinator && g.coordinator.email === 'thanit@rmutl.ac.th' && g.head && g.head.email === 'head@rmutl.ac.th', 'student sees coordinator and head');
  const mailHtml = run("mailLayout_('x','<p>y</p>')");
  ok(/ผู้ประสานงาน SE-WIL อาจารย์ธนิต เกตุแก้ว/.test(mailHtml) && /thanit@rmutl\.ac\.th/.test(mailHtml) && !/053-777666/.test(mailHtml), 'mail footer names coordinator without phone');
  // advisor is the coordinator: one merged line, not two
  run(`insert_('Users',{email:'s5@live.rmutl.ac.th',role:'student',student_id:'66543206005',name:'นักศึกษา ห้า',section:'ซว4ก',advisor_email:'thanit@rmutl.ac.th',active:'TRUE'})`);
  const merged = run(`contactsHtml_({student_name:'นักศึกษา ห้า',student_email:'s5@live.rmutl.ac.th'}, findUser_('s5@live.rmutl.ac.th'))`);
  eq((merged.match(/thanit@rmutl\.ac\.th/g) || []).length, 2, 'coordinator who is also advisor appears once (href + text)');
  ok(/และอาจารย์นิเทศ/.test(merged), 'merged role label');
  run("setConfig_('PROGRAM_EMAIL', 'se-wil@rmutl.ac.th')");
  run("sendMail_('x@y.z','t','<p>b</p>')");
  eq(outbox.slice(-1)[0].replyTo, 'se-wil@rmutl.ac.th', 'PROGRAM_EMAIL overrides reply-to');
  // seedConfig_ refreshes notes but never values
  run(`(function(){ var r=findOne_('Config',function(x){return x.key==='PROGRAM_EMAIL';}); update_('Config', r._row, {note:'old note'}); })()`);
  run('seedConfig_(); resetConfigCache_()');
  const pe = run("findOne_('Config',function(x){return x.key==='PROGRAM_EMAIL';})");
  ok(pe.value === 'se-wil@rmutl.ac.th' && /ผู้ประสานงาน/.test(pe.note), 'seedConfig_ refreshes note, keeps value');
  run("setConfig_('PROGRAM_EMAIL', '')");
  // every placeholder in the template has a value
  const agSrc = fs.readFileSync(path.join(SRC, 'Agreement.gs'), 'utf8');
  const tpl = agSrc.slice(agSrc.indexOf('function buildTemplate_'), agSrc.indexOf('function replacePlaceholder_'));
  const keys = [...new Set((tpl.match(/\{\{([A-Z0-9_]+)\}\}/g) || []).map(s => s.slice(2, -2)))];
  const vals = run(`agreementValues_(placementOf_('s1@live.rmutl.ac.th'), findUser_('s1@live.rmutl.ac.th'), findUser_('t1@rmutl.ac.th'))`);
  const missing = keys.filter(k2 => k2 !== 'KEY' && !(k2 in vals));
  ok(keys.indexOf('COORDINATOR') >= 0 && missing.length === 0, 'template placeholders all filled' + (missing.length ? ': ' + missing.join(',') : ''));
}

/* ---------- 9f. names and phones from Users ---------- */
console.log('9f. Users name refresh and phone source');
{
  // student registered with a phone but no name yet
  run(`insert_('Users',{email:'s6@live.rmutl.ac.th',role:'student',student_id:'66543206006',name:'',phone:'081-999-0000',section:'',advisor_email:'t1@rmutl.ac.th',active:'TRUE'})`);
  const st6 = login('s6@live.rmutl.ac.th');
  eq(run(`api_placementGet('${st6.s}')`).defaults.student_phone, '081-999-0000', 'form prefilled with phone from Users');
  const d6 = Object.assign({}, data, { student_phone: '', supervisor_email: 'sv6@company.co.th' });
  ok(run(`api_placementSave('${st6.s}', ${JSON.stringify(d6)}, false)`).ok, 'draft saved without name in Users');
  eq(run("placementOf_('s6@live.rmutl.ac.th').student_name"), '', 'name blank at first save');
  ok(run(`api_placementSave('${st6.s}', ${JSON.stringify(d6)}, true)`).ok, 'submitted with phone removed');
  const p6 = run("placementOf_('s6@live.rmutl.ac.th')");
  const r6 = run(`api_adminApprove('${ad.s}', '${p6.placement_id}', '')`);
  ok(!r6.ok && /name/.test(r6.error), 'approve refused while name blank');
  eq(run("placementOf_('s6@live.rmutl.ac.th').status"), 'submitted', 'status unchanged after refusal');
  run(`(function(){ var r=findOne_('Users',function(x){return x.email==='s6@live.rmutl.ac.th';}); update_('Users', r._row, {name:'นักศึกษา หก'}); })()`);
  const before = outbox.length;
  ok(run(`api_adminApprove('${ad.s}', '${p6.placement_id}', '')`).ok, 'approve after name added');
  eq(run("placementOf_('s6@live.rmutl.ac.th').student_name"), 'นักศึกษา หก', 'placement name refreshed from Users at approval');
  const m6 = outbox.slice(before).filter(m => m.to === 'sv6@company.co.th')[0];
  ok(m6 && /นักศึกษา หก/.test(m6.htmlBody) && !/081-999-0000/.test(m6.htmlBody), 'supervisor mail has name, not the Users phone');
  const av6 = run(`agreementValues_(placementOf_('s6@live.rmutl.ac.th'), findUser_('s6@live.rmutl.ac.th'), findUser_('t1@rmutl.ac.th'))`);
  eq(av6.STUDENT_PHONE, '-', 'agreement omits Users phone the student removed');
  const k6 = tokenFrom(m6, 'k');
  const a6 = run(`api_svGet('${k6}')`).agreements[0];
  eq(a6.student_phone, '', 'supervisor page omits Users phone the student removed');
  // name refreshed on a later save too
  run(`insert_('Users',{email:'s7@live.rmutl.ac.th',role:'student',student_id:'66543206007',name:'',section:'',advisor_email:'',active:'TRUE'})`);
  const st7 = login('s7@live.rmutl.ac.th');
  run(`api_placementSave('${st7.s}', ${JSON.stringify(Object.assign({}, data, { supervisor_email: 'sv7@company.co.th' }))}, false)`);
  run(`(function(){ var r=findOne_('Users',function(x){return x.email==='s7@live.rmutl.ac.th';}); update_('Users', r._row, {name:'นักศึกษา เจ็ด'}); })()`);
  run(`api_placementSave('${st7.s}', ${JSON.stringify(Object.assign({}, data, { supervisor_email: 'sv7@company.co.th' }))}, false)`);
  eq(run("placementOf_('s7@live.rmutl.ac.th').student_name"), 'นักศึกษา เจ็ด', 'name refreshed on later save');
}

/* ---------- 9g. advisor assignment ---------- */
console.log('9g. Advisor assignment');
{
  eq(run("header_(sheet_('Users')).indexOf('advisor_set_by') >= 0 && header_(sheet_('Users')).indexOf('advisor_set_at') >= 0"), true, 'Users has advisor_set_by/at columns');
  run(`insert_('Users',{email:'t5@rmutl.ac.th',role:'teacher',student_id:'',name:'อ.ห้า',section:'',advisor_email:'',active:'TRUE'})`);
  run(`insert_('Users',{email:'s8@live.rmutl.ac.th',role:'student',student_id:'66543206008',name:'นักศึกษา แปด',section:'sec2',advisor_email:'',active:'TRUE'})`);
  run(`insert_('Users',{email:'s9@live.rmutl.ac.th',role:'student',student_id:'66543206009',name:'นักศึกษา เก้า',section:'sec2',advisor_email:'',active:'TRUE'})`);
  const t5 = login('t5@rmutl.ac.th');
  const L = run(`api_assignList('${t5.s}')`);
  ok(L.ok && L.rows.length >= 8 && L.selfOpen === true && L.max === 8, 'teacher sees all students in assignment list');
  const r8 = L.rows.filter(x => x.email === 's8@live.rmutl.ac.th')[0];
  ok(r8 && !r8.advisor_email && !('phone' in r8) && !('student_phone' in r8), 'assignment row is minimal (no phone)');
  ok(L.staff.some(s => s.email === 't1@rmutl.ac.th') && L.staff.some(s => s.email === 'thanit@rmutl.ac.th'), 'staff list has teachers and admins');
  eq(run(`api_adminStudent('${t5.s}', 's8@live.rmutl.ac.th').ok`), false, 'teacher cannot open unassigned student detail');
  ok(run(`api_assignClaim('${t5.s}', 's8@live.rmutl.ac.th')`).ok, 'teacher claims unassigned student');
  const u8 = run("findUser_('s8@live.rmutl.ac.th')");
  ok(u8.advisor_email === 't5@rmutl.ac.th' && run("findOne_('Users',function(r){return r.email==='s8@live.rmutl.ac.th';}).advisor_set_by") === 't5@rmutl.ac.th', 'advisor and set_by saved');
  eq(run(`api_adminStudent('${t5.s}', 's8@live.rmutl.ac.th').ok`), true, 'claimer now opens student detail');
  const c2 = run(`api_assignClaim('${te.s}', 's8@live.rmutl.ac.th')`);
  ok(!c2.ok && /อ\.ห้า/.test(c2.error), 'other teacher cannot claim a claimed student: ');
  ok(!run(`api_assignRelease('${te.s}', 's8@live.rmutl.ac.th')`).ok, 'other teacher cannot release');
  ok(run(`api_assignRelease('${t5.s}', 's8@live.rmutl.ac.th')`).ok, 'claimer releases');
  eq(run("findUser_('s8@live.rmutl.ac.th').advisor_email"), '', 'released student has no advisor');
  ok(run(`api_assignClaim('${te.s}', 's8@live.rmutl.ac.th')`).ok, 'another teacher claims after release');
  ok(run(`api_assignSet('${ad.s}', 's8@live.rmutl.ac.th', 't5@rmutl.ac.th')`).ok, 'admin reassigns');
  eq(run("findUser_('s8@live.rmutl.ac.th').advisor_email"), 't5@rmutl.ac.th', 'admin reassignment saved');
  eq(run(`api_assignSet('${te.s}', 's8@live.rmutl.ac.th', 't1@rmutl.ac.th').ok`), false, 'teacher cannot use admin set');
  eq(run(`api_assignSet('${ad.s}', 's8@live.rmutl.ac.th', 'stranger@x.com').ok`), false, 'admin cannot assign a non-staff email');
  const st9 = login('s1@live.rmutl.ac.th');
  const sc = run(`api_assignClaim('${st9.s}', 's9@live.rmutl.ac.th')`);
  ok(!sc.ok && !sc.auth && /สิทธิ์/.test(sc.error), 'student cannot claim');
  // max per teacher
  run("setConfig_('ADVISOR_MAX', '1')");
  const m = run(`api_assignClaim('${t5.s}', 's9@live.rmutl.ac.th')`);
  ok(!m.ok && /ครบ 1 คน/.test(m.error), 'max per teacher enforced');
  ok(run(`api_assignClaim('${ad.s}', 's9@live.rmutl.ac.th')`).ok, 'admin may exceed max');
  run("setConfig_('ADVISOR_MAX', '8')");
  ok(run(`api_assignRelease('${ad.s}', 's9@live.rmutl.ac.th')`).ok, 'admin releases anyone');
  // self-assign closed
  run("setConfig_('ADVISOR_SELF_ASSIGN', 'FALSE')");
  ok(!run(`api_assignClaim('${t5.s}', 's9@live.rmutl.ac.th')`).ok, 'claim refused when self-assign closed');
  ok(run(`api_assignSet('${ad.s}', 's9@live.rmutl.ac.th', 't5@rmutl.ac.th')`).ok, 'admin still assigns when closed');
  run("setConfig_('ADVISOR_SELF_ASSIGN', 'TRUE')");
  ok(run("readAll_('Audit').filter(function(a){return a.action==='advisor_set';}).length") >= 4, 'assignments audited');
  // inactive students are not assignable
  run(`(function(){ var r=findOne_('Users',function(x){return x.email==='s9@live.rmutl.ac.th';}); update_('Users', r._row, {active:'FALSE'}); })()`);
  ok(!run(`api_assignRelease('${t5.s}', 's9@live.rmutl.ac.th')`).ok, 'inactive student rejected');
  ok(!run(`api_assignList('${t5.s}')`).rows.some(x => x.email === 's9@live.rmutl.ac.th'), 'inactive student hidden from list');
}

/* ---------- 9h. to-do lists ---------- */
console.log('9h. To-do lists');
{
  const plan = run("planFor_('admin').map(function(x){return x.title;}).join('|')");
  ok(/อนุมัติ/.test(plan) && /นัดพบ/.test(plan), 'admin plan includes teacher items');
  eq(run("planFor_('student').filter(function(x){return /ส่งข้อมูลที่ฝึก/.test(x.title);})[0].date"), run('cfg_().PLACEMENT_DUE'), 'plan uses Config dates');
  const up = run(`upcoming_('student', '2026-11-20', 3)`);
  ok(up.length === 3 && up[0].date >= '2026-11-20' && up[0].date <= up[1].date, 'upcoming sorted and from today');
  // student without placement
  run(`insert_('Users',{email:'s10@live.rmutl.ac.th',role:'student',student_id:'66543206010',name:'นักศึกษา สิบ',section:'',advisor_email:'',active:'TRUE'})`);
  const s10 = login('s10@live.rmutl.ac.th');
  const g10 = run(`api_placementGet('${s10.s}')`);
  ok(g10.todo && g10.todo.now.some(x => /กรอกข้อมูลที่ฝึก/.test(x.text) && x.go === 'place'), 'student to-do: fill placement');
  ok(g10.todo.next.length > 0, 'student has upcoming items');
  // student with returned logbook entries
  const stFresh = login('s1@live.rmutl.ac.th');
  const g1 = run(`api_placementGet('${stFresh.s}')`);
  ok(Array.isArray(g1.todo.now) && g1.todo.now.length > 0, 'student with placement has to-do');
  // teacher without advisees is asked to pick
  run(`insert_('Users',{email:'t3@rmutl.ac.th',role:'teacher',student_id:'',name:'อ.สาม',section:'',advisor_email:'',active:'TRUE'})`);
  const t3 = login('t3@rmutl.ac.th');
  const o3 = run(`api_adminOverview('${t3.s}')`);
  ok(o3.todo.now.some(x => x.go === 'assign'), 'teacher to-do: pick students');
  eq(o3.rows.length, 0, 'teacher without advisees sees no rows');
  // admin sees unassigned and approvals
  const oa = run(`api_adminOverview('${ad.s}')`);
  ok(oa.todo.now.some(x => /ยังไม่มีอาจารย์นิเทศ/.test(x.text) && x.go === 'assign'), 'admin to-do: unassigned students');
  ok(oa.todo.next.length > 0 && oa.selfAssign === true, 'admin overview has upcoming and self-assign flag');
  // supervisor to-do
  const svT = run(`api_svGet(getOrCreateSupervisor_('sv6@company.co.th','').token)`).todo;
  ok(svT && svT.now.length > 0 && svT.next.length > 0, 'supervisor has to-do and upcoming');
}

/* ---------- 9i. appointment documents ---------- */
console.log('9i. Appointment documents');
{
  eq(run("thd_('2/2569 โทร. 1224')"), '๒/๒๕๖๙ โทร. ๑๒๒๔', 'Thai digits');
  eq(run("thDateThd_('2026-12-16')"), '๑๖ ธันวาคม ๒๕๖๙', 'Thai long date with Thai digits');
  const tS = login('t1@rmutl.ac.th');
  eq(run(`api_docsStatus('${tS.s}').ok`), false, 'teacher cannot open docs status');
  eq(run(`api_docAppointment('${tS.s}', 'memo', 'docx').ok`), false, 'teacher cannot create appointment docs');
  const aS = login('a1@rmutl.ac.th');
  const ds = run(`api_docsStatus('${aS.s}')`);
  ok(ds.ok && ds.students === run('activeStudents_().length') && ds.advisors.length >= 2, 'docs status counts active students and advisors');
  ok(ds.config.to === 'คณบดีคณะวิศวกรรมศาสตร์' && ds.config.visitFrom === '2026-12-16', 'docs status shows document config');
  ok(Array.isArray(ds.missingPlacement) && ds.missingPlacement.indexOf('นักศึกษา สิบ') >= 0, 'missing placement listed');
  const D = run('appointmentData_()');
  const advOrder = D.rows.map(x => x.advisor || '\uffff');
  ok(advOrder.every((a, i) => !i || advOrder[i - 1].localeCompare(a, 'th') <= 0), 'rows sorted by advisor');
  ok(D.rows.every(x => !('phone' in x) && !('supervisor_email' in x)), 'rows carry no phone or supervisor contact');
  run("setConfig_('PLACEMENT_DUE', todayStr_())");
  ok(run(`api_adminOverview('${aS.s}')`).todo.now.some(x => x.go === 'docs' && /แต่งตั้งอาจารย์นิเทศ/.test(x.text)), 'admin to-do: appointment memo');
  ok(!run(`api_adminOverview('${tS.s}')`).todo.now.some(x => x.go === 'docs'), 'teacher has no docs to-do');
  eq(run(`api_docAppointment('${aS.s}', 'x', 'docx').ok`), false, 'bad kind rejected');
  eq(run(`api_docAppointment('${aS.s}', 'order', 'docx').ok`), false, 'draft order removed (faculty issues the order)');
  eq(run(`api_docAppointment('${aS.s}', 'memo', 'exe').ok`), false, 'bad format rejected');
  const outDir = process.env.DOCS_OUT;
  ['memo'].forEach(kind => {
    const x = run(`api_docAppointment('${aS.s}', '${kind}', 'docx')`);
    ok(x.ok && /\.docx$/.test(x.name) && x.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', kind + ' docx created');
    const buf = Buffer.from(x.data, 'base64');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-'));
    fs.writeFileSync(path.join(tmp, 'a.docx'), buf);
    execFileSync('unzip', ['-q', 'a.docx', '-d', 'x'], { cwd: tmp });
    const xml = fs.readFileSync(path.join(tmp, 'x/word/document.xml'), 'utf8');
    ok(fs.existsSync(path.join(tmp, 'x/word/media/krut.png')) && fs.existsSync(path.join(tmp, 'x/[Content_Types].xml')), kind + ' docx has Garuda image and content types');
    ok(/TH Sarabun New/.test(xml) && /แต่งตั้งอาจารย์นิเทศ/.test(xml) && /นายทดสอบ ระบบ/.test(xml) && /อ\.ที่ปรึกษา/.test(xml), kind + ' docx has subject, student and advisor');
    ok(!/053-|081-|@/.test(xml), kind + ' docx has no phone numbers or emails');
    ok(/๖๖๕๔๓๒๐๖๐๐๑/.test(xml), kind + ' student id in Thai digits');
    try { execFileSync('python3', ['-c', 'import sys,xml.dom.minidom as m;[m.parse(f) for f in sys.argv[1:]]', ...['word/document.xml', 'word/styles.xml', '[Content_Types].xml', 'word/_rels/document.xml.rels'].map(f => path.join(tmp, 'x', f))]); ok(true, ''); }
    catch (e) { ok(false, kind + ' docx XML well-formed: ' + String(e.stderr || e.message).slice(0, 200)); }
    ok(/ผ่านหัวหน้าสาขาวิศวกรรมไฟฟ้า/.test(xml) && /หัวหน้าหลักสูตร ทดสอบ/.test(xml) && /สรุปรายอาจารย์นิเทศ/.test(xml), 'memo has via, head name from Config and per-advisor summary');
    ok(!/ร่างคำสั่ง/.test(xml), 'memo no longer lists a draft order');
    if (outDir) { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, kind + '.docx'), buf); }
    fs.rmSync(tmp, { recursive: true, force: true });
  });
  docCalls.length = 0;
  const pdf = run(`api_docAppointment('${aS.s}', 'memo', 'pdf')`);
  ok(pdf.ok && pdf.mime === 'application/pdf' && /\.pdf$/.test(pdf.name), 'memo pdf created via Google Doc');
  ok(docCalls.some(c => /setFontFamily:Sarabun/.test(c)) && docCalls.some(c => /appendTable/.test(c)) && docCalls.some(c => /appendInlineImage/.test(c)), 'pdf doc uses Sarabun, table and Garuda');
  ok(driveFiles.GDOC1.trashed, 'temporary Google Doc trashed');
  ok(savedDocs.length === 2, 'copies saved to Drive folder');
  ok(run("readAll_('Audit').filter(function(a){return /^doc_memo_/.test(a.action);}).length") === 2, 'document creation audited');
  ok(!run(`api_adminOverview('${aS.s}')`).todo.now.some(x => x.go === 'docs'), 'docs to-do cleared after memo created');
  run("setConfig_('PLACEMENT_DUE', '2026-11-13')");
}

/* ---------- 9j. intro letter links and signed reply ---------- */
console.log('9j. Intro letter and reply form');
{
  // login ผ่านอีเมลจำกัด 3 ครั้งต่อชั่วโมง ส่วนนี้สร้าง session ตรงในชีตแทน
  const login = (email) => ({ s: run(`(function(){ var t=newToken_(); insert_('Sessions',{token_hash:hash_(t),email:${JSON.stringify(email)},kind:'session',expires_at:new Date(Date.now()+864e5).toISOString(),used:'',created_at:nowIso_()}); return t; })()`) });
  const decode = (url) => {
    const m = /#z=([A-Za-z0-9_-]+)$/.exec(url); if (!m) return null;
    return JSON.parse(require('zlib').gunzipSync(Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8'));
  };
  const s1 = login('s1@live.rmutl.ac.th');
  const st1 = run("placementOf_('s1@live.rmutl.ac.th').status");
  ok(['submitted', 'returned', 'agreement_sent', 'signed'].indexOf(st1) >= 0, 's1 has submitted placement (' + st1 + ')');
  const L1 = run(`api_letterLink('${s1.s}')`);
  ok(L1.ok && L1.url.indexOf(run("portalUrl_('forms/intro-letter.html')") + '#z=') === 0, 'student letter link points to portal form with hash payload');
  const d1 = decode(L1.url);
  ok(d1 && d1.v === 1 && d1.r.length === 1 && d1.r[0].f === 1 && d1.r[0].id === '66543206001', 'payload has filled record for the student');
  ok(d1.r[0].sn === 'คุณผู้นิเทศ' && d1.r[0].se === 'sup@company.co.th' && d1.r[0].p === 'เชียงใหม่' && ['company', 'joint', 'student'].indexOf(d1.r[0].ip) >= 0, 'payload has supervisor, province and IP owner');
  const raw1 = JSON.stringify(d1);
  ok(raw1.indexOf('live.rmutl') < 0 && raw1.indexOf('053-') < 0 && !('student_phone' in d1.r[0]), 'payload has no student email or phone');
  ok(d1.r[0].jd.length <= 230 && (d1.r[0].p1 || '').length <= 110, 'long text clipped to fit 2 pages');
  const s10b = login('s10@live.rmutl.ac.th');
  const d10 = decode(run(`api_letterLink('${s10b.s}')`).url);
  ok(d10.r[0].n === 'นักศึกษา สิบ' && !d10.r[0].f && !d10.r[0].c, 'student without submitted data gets blank form with name');
  const t1 = login('t1@rmutl.ac.th'), t5b = login('t5@rmutl.ac.th');
  ok(run(`api_adminLetterLink('${t1.s}', 's1@live.rmutl.ac.th')`).ok, 'advisor prints letter for own student');
  eq(run(`api_adminLetterLink('${t5b.s}', 's1@live.rmutl.ac.th')`).ok, false, 'other teacher cannot print the letter');
  eq(run(`api_adminLettersAll('${t1.s}', 'filled')`).ok, false, 'teacher cannot bulk print');
  const a1 = login('a1@rmutl.ac.th');
  const ds = run(`api_docsStatus('${a1.s}')`);
  const all = run(`api_adminLettersAll('${a1.s}', 'filled')`);
  ok(all.ok && all.count === ds.letters.filled && decode(all.url).r.every(x => x.f === 1), 'bulk filled letters match count');
  const bl = run(`api_adminLettersAll('${a1.s}', 'blank')`);
  ok(bl.ok && bl.count === ds.letters.blank && decode(bl.url).r.every(x => !x.f), 'bulk blank letters with names');
  eq(run(`api_adminLettersAll('${a1.s}', 'x')`).ok, false, 'bad group rejected');
  ok(run("readAll_('Audit').filter(function(a){return a.action==='letter_link';}).length") >= 4, 'letter links audited');
  // signed reply upload
  const todo0 = run(`api_placementGet('${s1.s}')`).todo.now;
  ok(todo0.some(x => /แบบตอบรับ/.test(x.text) && x.go === 'place'), 'student to-do: print and attach signed reply');
  ok(run(`api_adminOverview('${a1.s}')`).todo.now.some(x => /ยังไม่แนบแบบตอบรับ/.test(x.text)), 'admin to-do: replies not attached');
  const bad = run(`api_placementUpload('${s1.s}', 'reply', 'x.txt', '${Buffer.from('hello world').toString('base64')}')`);
  ok(!bad.ok && /แบบตอบรับ/.test(bad.error), 'reply upload rejects non PDF/image');
  const pdfB64 = Buffer.from('%PDF-1.4 signed reply').toString('base64');
  const up = run(`api_placementUpload('${s1.s}', 'reply', 'ตอบรับ.pdf', '${pdfB64}')`);
  ok(up.ok, 'student uploads signed reply');
  const pr = run("placementOf_('s1@live.rmutl.ac.th')");
  ok(pr.reply_file_id && pr.reply_uploaded_at && pr.reply_file_name === 'ตอบรับ.pdf', 'reply file saved on placement');
  const pg = run(`api_placementGet('${s1.s}')`);
  ok(pg.placement.has_reply === true && !('reply_file_id' in pg.placement), 'student sees has_reply, not the Drive id');
  ok(!pg.todo.now.some(x => /แนบแบบตอบรับ/.test(x.text)), 'reply to-do cleared after upload');
  const ov = run(`api_adminOverview('${a1.s}')`);
  ok(ov.rows.filter(x => x.email === 's1@live.rmutl.ac.th')[0].has_reply === true, 'overview row shows reply attached');
  ok(run(`api_adminFile('${t1.s}', '${pr.placement_id}', 'reply')`).ok, 'advisor opens signed reply');
  eq(run(`api_adminFile('${t5b.s}', '${pr.placement_id}', 'reply')`).ok, false, 'other teacher cannot open signed reply');
  eq(run(`api_docsStatus('${a1.s}')`).letters.noreply, ds.letters.noreply - 1, 'noreply count drops after upload');
}

/* ---------- 9k. logbook v1.8: evidence, absences, photos ---------- */
console.log('9k. Logbook evidence, absences, photos');
{
  // ชื่อฟังก์ชันระดับบนสุดห้ามซ้ำข้ามไฟล์ (Apps Script ใช้ global scope เดียว ไฟล์ที่โหลดทีหลังทับของเดิม)
  const names = {};
  fs.readdirSync(SRC).filter(f => f.endsWith('.gs')).forEach(f => {
    (fs.readFileSync(path.join(SRC, f), 'utf8').match(/^function\s+([A-Za-z0-9_$]+)/gm) || []).forEach(m => {
      const n = m.replace(/^function\s+/, ''); (names[n] = names[n] || []).push(f);
    });
  });
  const dups = Object.keys(names).filter(n => names[n].length > 1).map(n => n + ' in ' + names[n].join(','));
  ok(dups.length === 0, 'no duplicate top-level function names' + (dups.length ? ': ' + dups.join('; ') : ''));
  eq(run("clip_('บรรทัด 1\\nบรรทัด 2', 100)"), 'บรรทัด 1\nบรรทัด 2', 'clip_ keeps line breaks');

  const ctxV = "{semesterStart:'2026-11-18',semesterEnd:'2027-03-09',today:'2026-11-25',maxHoursPerDay:12,sameDay:[]}";
  const base = "entry_id:'',date:'2026-11-20',start:'09:00',end:'11:00',break_min:0,course:'305',work_mode:'onsite'";
  const v = (extra) => run(`validateEntry_({${base},${extra}},${ctxV})`);
  ok(!v(`activity:'${'ก'.repeat(29)}'`).ok && v(`activity:'${'ก'.repeat(30)}'`).ok, 'activity needs at least 30 characters');
  const act30 = `activity:'${'ก'.repeat(30)}'`;
  ok(v(`${act30},link_url:'https://git.example.com/mr/1 http://intra.example/doc'`).ok, 'two http(s) links accepted');
  ok(!v(`${act30},link_url:'ftp://x.example/file'`).ok, 'non-http link rejected');
  ok(!v(`${act30},link_url:'https://a.b/1 https://a.b/2 https://a.b/3 https://a.b/4'`).ok, 'more than 3 links rejected');
  ok(!v(`${act30},problems:'${'x'.repeat(501)}'`).ok, 'problems over 500 rejected');
  const absV = (extra, same) => run(`validateEntry_({entry_id:'',kind:'absence',date:'2026-11-20',${extra}},{semesterStart:'2026-11-18',semesterEnd:'2027-03-09',today:'2026-11-25',maxHoursPerDay:12,sameDay:${same || '[]'}})`);
  ok(absV("absence_reason:'sick'").ok && absV("absence_reason:'sick'").hours === 0, 'absence needs no time and counts 0 hours');
  ok(!absV("absence_reason:'x'").ok, 'unknown absence reason rejected');
  ok(!absV("absence_reason:'other',absence_note:''").ok && absV("absence_reason:'other',absence_note:'สอบ'").ok, 'other reason needs a note');
  ok(!absV("absence_reason:'sick'", "[{entry_id:'E9',kind:'absence'}]").ok, 'second absence on the same day rejected');

  const ss = (email) => run(`(function(){ var t=newToken_(); insert_('Sessions',{token_hash:hash_(t),email:${JSON.stringify(email)},kind:'session',expires_at:new Date(Date.now()+864e5).toISOString(),used:'',created_at:nowIso_()}); return t; })()`);
  const s1 = ss('s1@live.rmutl.ac.th');
  const dA = dayBefore(3);
  const ab = run(`api_logSave('${s1}', {kind:'absence', date:'${dA}', absence_reason:'sick', absence_note:'', start:'08:00', end:'12:00', course:'305', activity:'x'})`);
  ok(ab.ok && ab.kind === 'absence' && ab.hours === 0, 'student saves an absence day');
  const abRow = run(`findOne_('Logbook', function(r){ return r.entry_id === '${ab.entry_id}'; })`);
  ok(abRow.kind === 'absence' && abRow.start === '' && abRow.course === '' && Number(abRow.hours) === 0 && abRow.absence_reason === 'sick', 'absence stored without time or course');
  eq(run(`api_logSave('${s1}', {kind:'absence', date:'${dA}', absence_reason:'personal'}).ok`), false, 'duplicate absence on the same day rejected');
  const wk = run(`api_logSave('${s1}', {date:'${dA}', start:'18:00', end:'20:00', break_min:0, course:'304', work_mode:'onsite', activity:'ออกแบบหน้าจอรายงานซ่อมบำรุง 3 หน้า ใช้ Figma', link_url:'https://figma.example.com/f/1', problems:'ยังไม่ได้ข้อมูลจริง', learned:'การทำ wireframe'})`);
  ok(wk.ok && wk.hours === 2, 'half-day work entry allowed on an absence day' + (wk.ok ? '' : ': ' + wk.error));
  const list = run(`api_logList('${s1}')`);
  const wOut = list.entries.filter(x => x.entry_id === wk.entry_id)[0];
  ok(wOut && wOut.link_url === 'https://figma.example.com/f/1' && wOut.problems && wOut.learned && wOut.kind === 'work' && wOut.has_photo === false && !('photo_file_id' in wOut), 'log list returns evidence fields and hides Drive ids');
  ok(list.summary.draft['304'] >= 2 && !Number.isNaN(list.summary.draft['305']), 'absence does not break hour totals');
  // photos
  const jpg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 4, 5]).toString('base64');
  ok(run(`api_logPhotoUpload('${s1}', '${wk.entry_id}', 'data:image/jpeg;base64,${jpg}')`).ok, 'student attaches a photo to a work entry');
  eq(run(`api_logPhotoUpload('${s1}', '${ab.entry_id}', '${jpg}')`).ok, false, 'absence entry cannot have a photo');
  eq(run(`api_logPhotoUpload('${s1}', '${wk.entry_id}', '${Buffer.from('%PDF-1.4').toString('base64')}')`).ok, false, 'photo must be an image');
  const pid = run(`findOne_('Logbook', function(r){ return r.entry_id === '${wk.entry_id}'; }).photo_file_id`);
  ok(!!pid && run(`api_logList('${s1}')`).entries.filter(x => x.entry_id === wk.entry_id)[0].has_photo === true, 'photo id saved, list shows has_photo');
  ok(run(`api_logPhoto('${s1}', '${wk.entry_id}')`).ok, 'student opens own photo');
  const tAdv = ss('t1@rmutl.ac.th'), tOther = ss('t5@rmutl.ac.th');
  ok(run(`api_adminLogPhoto('${tAdv}', '${wk.entry_id}')`).ok, 'advisor opens the photo');
  eq(run(`api_adminLogPhoto('${tOther}', '${wk.entry_id}')`).ok, false, 'other teacher cannot open the photo');
  const det = run(`api_adminStudent('${tAdv}', 's1@live.rmutl.ac.th')`);
  ok(det.entries.some(x => x.kind === 'absence') && det.entries.every(x => !('photo_file_id' in x)), 'advisor detail shows absences without Drive ids');
  // batch, supervisor, digest
  const p1 = run("placementOf_('s1@live.rmutl.ac.th')");
  const svTok = run(`getOrCreateSupervisor_('${p1.supervisor_email}', '').token`);
  const nOut = outbox.length;
  // ส่งเองได้วันละครั้ง (ส่วนก่อนหน้าใช้ไปแล้ว) จึงสร้างชุดแบบเดียวกับรอบวันศุกร์
  const bt = run(`(function(){ var b = createBatchFor_(placementOf_('s1@live.rmutl.ac.th'), todayStr_()); notifySupervisors_([normEmail_(placementOf_('s1@live.rmutl.ac.th').supervisor_email)]); return b; })()`);
  const sent = bt ? { ok: true, batch_id: bt.batch_id } : { ok: false, error: 'no batch' };
  if (sent.ok) {
    const svg = run(`api_svGet('${svTok}')`);
    const b = svg.pending.filter(x => x.batch_id === sent.batch_id)[0];
    ok(b && b.entries.some(x => x.kind === 'absence' && x.absence_reason === 'sick') && b.entries.some(x => x.entry_id === wk.entry_id && x.has_photo), 'supervisor sees absence and evidence in the batch');
    ok(run(`api_svLogPhoto('${svTok}', '${wk.entry_id}')`).ok, 'supervisor opens the photo');
    eq(run(`api_svLogPhoto('${run("getOrCreateSupervisor_('other-sv@x.co.th','').token")}', '${wk.entry_id}')`).ok, false, 'another supervisor cannot open the photo');
    const mail = outbox.slice(nOut).filter(m => m.to === p1.supervisor_email.toLowerCase()).slice(-1)[0];
    ok(mail && /ไม่ได้ปฏิบัติงาน 1 วัน/.test(mail.htmlBody), 'digest email shows absence days');
    const ids = b.entries.map(x => x.entry_id);
    ok(run(`api_svDecide('${svTok}', '${b.batch_id}', ${JSON.stringify(ids)}, [], '')`).ok, 'supervisor certifies batch including absence');
    eq(run(`findOne_('Logbook', function(r){ return r.entry_id === '${ab.entry_id}'; }).status`), 'certified', 'absence acknowledged (certified, 0 hours)');
    eq(run(`api_logPhotoRemove('${s1}', '${wk.entry_id}')`).ok, false, 'certified entry photo cannot be removed');
  } else ok(false, 'send now failed: ' + sent.error);
  // delete trashes photo
  const wk2 = run(`api_logSave('${s1}', {date:'${dayBefore(4)}', start:'13:00', end:'14:00', break_min:0, course:'305', work_mode:'onsite', activity:'ประชุมทีมประจำสัปดาห์ สรุปงานค้างและแบ่งงานใหม่'})`);
  run(`api_logPhotoUpload('${s1}', '${wk2.entry_id}', '${jpg}')`);
  const pid2 = run(`findOne_('Logbook', function(r){ return r.entry_id === '${wk2.entry_id}'; }).photo_file_id`);
  ok(run(`api_logDelete('${s1}', '${wk2.entry_id}')`).ok && driveFiles[pid2] && driveFiles[pid2].trashed, 'deleting an entry trashes its photo');
}

/* ---------- 10. portal consistency ---------- */
console.log('10. Portal consistency');
eq(run("thDateLong_('2026-11-13')"), '13 พฤศจิกายน 2569', 'Thai long date');
eq(run("thDateLong_('')"), '', 'Thai long date blank');
eq(run("portalUrl_('help/index.html')"), 'https://se-rmutl.github.io/se-wil/help/index.html', 'portal url join');
eq(run("cfg_().PLACEMENT_DUE"), '2026-11-13', 'placement due matches portal');
eq(run("cfg_().AGREEMENT_DUE"), '2026-11-16', 'agreement due matches portal');
eq(run("cfg_().DIGEST_DAY + ' ' + cfg_().DIGEST_HOUR"), 'FRIDAY 15', 'digest Friday 15:00 as on portal');
eq(run("cfg_().TARGET_305 + '/' + cfg_().TARGET_304 + '/' + cfg_().MAX_HOURS_PER_DAY + '/' + cfg_().LOGIN_LINK_MINUTES"), '300/135/12/30', 'targets and limits match portal');
eq(run("(function(){var d={};CONFIG_DEFAULTS.forEach(function(r){d[r[0]]=r[1];});return d.SEMESTER_START+'..'+d.SEMESTER_END;})()"), '2026-11-18..2027-03-09', 'default term dates match portal');

// more fixtures for UI preview (teacher view and assignment tab)
{
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));
  const tf = login('t5@rmutl.ac.th'), af = login('a1@rmutl.ac.th');
  const sFx = run(`(function(){ var t=newToken_(); insert_('Sessions',{token_hash:hash_(t),email:'s1@live.rmutl.ac.th',kind:'session',expires_at:new Date(Date.now()+864e5).toISOString(),used:'',created_at:nowIso_()}); return t; })()`);
  Object.assign(fx, {
    teacherMe: run(`api_me('${tf.s}')`), teacherOverview: run(`api_adminOverview('${tf.s}')`), assignTeacher: run(`api_assignList('${tf.s}')`),
    adminOverview: run(`api_adminOverview('${af.s}')`), assignAdmin: run(`api_assignList('${af.s}')`), docsStatus: run(`api_docsStatus('${af.s}')`),
    logList: run(`api_logList('${sFx}')`), adminStudent: run(`api_adminStudent('${af.s}', 's1@live.rmutl.ac.th')`),
    resetTargets: run(`api_resetTargets('${af.s}')`), resetPreview: run(`api_resetPreview('${af.s}', 'student', 's1@live.rmutl.ac.th')`)
  });
  fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify(fx, null, 1));
}

// TERM_PLAN ต้องตรงกับ deadlines ในพอร์ทัล (ตรวจเมื่อหาไฟล์ config.js ของพอร์ทัลเจอ)
{
  const cands = [process.env.PORTAL_CONFIG, path.join(__dirname, '..', '..', '..', 'config.js'), '/home/claude/se-rmutl.github.io/se-wil/config.js'].filter(Boolean);
  const pc = cands.filter(f => fs.existsSync(f))[0];
  if (pc) {
    const box = {}; vm.runInNewContext(fs.readFileSync(pc, 'utf8').replace(/^\s*window\.SEWIL\s*=/m, 'SEWIL ='), box);
    const portal = new Set(box.SEWIL.deadlines.map(d => d.date));
    const missing = run("TERM_PLAN.map(function(x){return x.date;})").filter(d => !portal.has(d));
    ok(missing.length === 0, 'every TERM_PLAN date is a portal deadline' + (missing.length ? ': ' + missing.join(',') : ''));
  } else console.log('  (skip portal deadline check: config.js not found)');
}

/* ---------- 11. reset for testing (after fixtures are written) ---------- */
console.log('11. Reset for testing');
{
  const ss = (email) => run(`(function(){ var t=newToken_(); insert_('Sessions',{token_hash:hash_(t),email:${JSON.stringify(email)},kind:'session',expires_at:new Date(Date.now()+864e5).toISOString(),used:'',created_at:nowIso_()}); return t; })()`);
  const a = ss('a1@rmutl.ac.th'), t1s = ss('t1@rmutl.ac.th');
  eq(run(`api_resetTargets('${t1s}').ok`), false, 'teacher cannot open reset tool');
  const tg = run(`api_resetTargets('${a}')`);
  ok(tg.ok && tg.enabled && tg.students.some(x => x.email === 's1@live.rmutl.ac.th') && tg.supervisors.length > 0 && tg.teachers.some(x => x.email === 't5@rmutl.ac.th'), 'reset targets list students, supervisors and teachers');
  run("setConfig_('RESET_ENABLED', 'FALSE')");
  ok(run(`api_resetTargets('${a}')`).enabled === false && !run(`api_resetPreview('${a}', 'student', 's1@live.rmutl.ac.th')`).ok, 'reset disabled by Config');
  run("setConfig_('RESET_ENABLED', 'TRUE')");
  ok(run(`api_adminOverview('${a}')`).todo.now.some(x => x.go === 'reset'), 'admin reminded to turn reset off after semester start');
  // supervisor
  const p1 = run("placementOf_('s1@live.rmutl.ac.th')");
  const svEmail = String(p1.supervisor_email).toLowerCase();
  const oldTok = run(`getOrCreateSupervisor_('${svEmail}', '').token`);
  const pvS = run(`api_resetPreview('${a}', 'supervisor', '${svEmail}')`);
  ok(pvS.ok && pvS.counts.students >= 1 && pvS.counts.link === 1, 'supervisor reset preview');
  eq(run(`api_resetRole('${a}', 'supervisor', '${svEmail}', 'wrong@x.com', {})`).ok, false, 'reset needs matching confirmation email');
  const rS = run(`api_resetRole('${a}', 'supervisor', '${svEmail}', '${svEmail.toUpperCase()}', {})`);
  ok(rS.ok && rS.done.link === 1, 'supervisor reset done');
  eq(run(`api_svGet('${oldTok}').ok`), false, 'old supervisor link no longer works');
  ok(run(`readAll_('Placements').filter(function(p){ return normEmail_(p.supervisor_email) === '${svEmail}'; }).every(function(p){ return p.status !== 'signed' && !p.accepted_at; })`), 'confirmed agreements back to awaiting confirmation');
  ok(run(`readAll_('Logbook').filter(function(e){ return e.placement_id === '${p1.placement_id}'; }).every(function(e){ return e.status === 'draft' && !e.batch_id; })`), 'logbook entries back to draft');
  eq(run(`readAll_('CertBatches').filter(function(b){ return b.placement_id === '${p1.placement_id}'; }).length`), 0, 'certification batches removed');
  ok(run("readAll_('Trash').some(function(r){ return r.sheet === 'Supervisors' && /reset_supervisor/.test(r.reason) && JSON.parse(r.row_json).token; })"), 'supervisor row archived in Trash');
  // student
  const pid = run("(readAll_('Logbook').filter(function(e){ return e.student_email === 's1@live.rmutl.ac.th' && e.photo_file_id; })[0] || {}).photo_file_id") || '';
  const replyId = run("placementOf_('s1@live.rmutl.ac.th').reply_file_id");
  const s1 = ss('s1@live.rmutl.ac.th');
  const pv = run(`api_resetPreview('${a}', 'student', 's1@live.rmutl.ac.th')`);
  ok(pv.ok && pv.counts.placement === 1 && pv.counts.entries > 0 && pv.counts.files >= 1 && pv.counts.sessions >= 1, 'student reset preview counts');
  const s1No = run("placementOf_('s1@live.rmutl.ac.th').agreement_no");
  const issuedBefore = run("readAll_('Placements').map(function(p){ return String(p.agreement_no || ''); }).filter(String)");
  ok(!!s1No && pv.warnings.some(t => t.indexOf(s1No) >= 0), 'reset preview warns that agreement ' + s1No + ' was already emailed');
  ok(pv.warnings.some(t => /SE-WIL00/.test(t)) && pv.warnings.some(t => /บันทึกขออนุมัติ/.test(t)) && pv.warnings.some(t => /ลิงก์รับรอง logbook/.test(t)) === pv.counts.batches > 0, 'reset preview warns about printed letters, the memo and logbook links');
  const before = run("readAll_('Trash').length");
  const rs = run(`api_resetRole('${a}', 'student', 's1@live.rmutl.ac.th', 's1@live.rmutl.ac.th', {clearAdvisor:true})`);
  ok(rs.ok && rs.done.placement === 1 && rs.done.advisorCleared, 'student reset done');
  ok(run("placementOf_('s1@live.rmutl.ac.th')") === null && run("readAll_('Logbook').filter(function(e){ return e.student_email === 's1@live.rmutl.ac.th'; }).length") === 0 && run("readAll_('CertBatches').filter(function(b){ return b.student_email === 's1@live.rmutl.ac.th'; }).length") === 0, 'placement, logbook and batches removed');
  eq(run("findUser_('s1@live.rmutl.ac.th').advisor_email"), '', 'advisor cleared');
  ok(!!findUserCheck(), 'student stays in Users');
  function findUserCheck() { return run("findUser_('s1@live.rmutl.ac.th')"); }
  eq(run(`api_me('${s1}').ok`), false, 'student sessions removed');
  ok((!pid || driveFiles[pid].trashed) && (!replyId || driveFiles[replyId].trashed), 'student files moved to Drive trash');
  ok(run("readAll_('Trash').length") > before, 'student rows archived in Trash');
  // v1.9.1: เลขข้อตกลงที่ออกไปแล้วต้องไม่ถูกใช้ซ้ำหลังลบแถว
  const nextNo = run('nextAgreementNo_()');
  const maxBefore = Math.max.apply(null, issuedBefore.map(x => parseInt(x.split('-').pop(), 10)));
  ok(issuedBefore.indexOf(nextNo) < 0 && parseInt(nextNo.split('-').pop(), 10) === maxBefore + 1, 'next agreement no ' + nextNo + ' is not reused after reset (issued ' + issuedBefore.length + ', max ' + maxBefore + ')');
  run("(function(){ var t = readAll_('Audit').filter(function(r){ return r.action === 'placement_approve'; }); t.forEach(function(r){ update_('Audit', r._row, { detail: '' }); }); })()");
  eq(run('nextAgreementNo_()'), nextNo, 'number still unique from Trash copy when Audit lacks it');
  const s1n = ss('s1@live.rmutl.ac.th');
  const g = run(`api_placementGet('${s1n}')`);
  ok(g.ok && g.placement === null && g.editable && g.todo.now.some(x => /กรอกข้อมูลที่ฝึก/.test(x.text)), 'student starts fresh like a new user');
  // teacher
  run(`setAdvisor_(studentForAssign_('s8@live.rmutl.ac.th'), 't5@rmutl.ac.th', 'a1@rmutl.ac.th')`);
  const pvT = run(`api_resetPreview('${a}', 'teacher', 't5@rmutl.ac.th')`);
  ok(pvT.ok && pvT.counts.advisees >= 1, 'teacher reset preview');
  ok(run(`api_resetRole('${a}', 'teacher', 't5@rmutl.ac.th', 't5@rmutl.ac.th', {})`).ok, 'teacher reset done');
  eq(run("readAll_('Users').filter(function(r){ return normEmail_(r.advisor_email) === 't5@rmutl.ac.th'; }).length"), 0, 'teacher has no advisees after reset');
  ok(run(`api_resetRole('${a}', 'teacher', 'a1@rmutl.ac.th', 'a1@rmutl.ac.th', {})`).ok && run(`api_me('${a}').ok`), 'admin resetting own teacher role keeps own session');
  ok(run("readAll_('Audit').filter(function(x){ return /^reset_/.test(x.action); }).length") >= 4, 'resets audited');
  eq(run(`api_resetRole('${a}', 'student', 'nobody@x.com', 'nobody@x.com', {}).ok`), false, 'unknown student rejected');
}

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
