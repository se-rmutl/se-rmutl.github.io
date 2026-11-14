/**
 * Config.gs — ค่าคงที่ โครงสร้างชีต และการอ่านค่าตั้งค่า
 * ระบบ SE-WIL (ENGSE304/ENGSE305) หลักสูตรวิศวกรรมซอฟต์แวร์ มทร.ล้านนา
 */

var TZ = 'Asia/Bangkok';

/** โครงสร้างแต่ละชีต (แถวที่ 1 คือหัวคอลัมน์) */
var SCHEMA = {
  Config: ['key', 'value', 'note'],
  Users: ['email', 'role', 'student_id', 'name', 'phone', 'section', 'advisor_email', 'active', 'advisor_set_by', 'advisor_set_at'],
  Placements: [
    'placement_id', 'student_email', 'student_id', 'student_name', 'student_phone', 'status', 'agreement_no',
    'company_name', 'company_type', 'company_address', 'province', 'company_phone', 'company_website', 'company_map_url',
    'company_photo_id', 'cv_file_id', 'cv_file_name', 'cv_uploaded_at', 'same_as_301', 'change_reason',
    'supervisor_name', 'supervisor_position', 'supervisor_email', 'supervisor_phone',
    'coadvisor_same', 'coadvisor_name', 'coadvisor_position', 'coadvisor_email', 'coadvisor_phone',
    'position_title', 'job_description', 'problem1_title', 'problem1_detail', 'problem2_title', 'problem2_detail',
    'work_mode', 'schedule_305', 'schedule_304', 'ip_owner', 'compensation', 'pdpa_consent_at',
    'reply_file_id', 'reply_file_name', 'reply_uploaded_at',
    'submitted_at', 'reviewed_by', 'reviewed_at', 'review_comment',
    'agreement_doc_id', 'agreement_pdf_id', 'agreement_pdf_url', 'agreement_generated_at',
    'accepted_by_name', 'accepted_at', 'accepted_via', 'created_at', 'updated_at'
  ],
  Supervisors: ['email', 'name', 'token', 'created_at', 'last_access_at'],
  Logbook: [
    'entry_id', 'placement_id', 'student_email', 'date', 'start', 'end', 'break_min', 'hours',
    'course', 'work_mode', 'activity', 'status', 'batch_id', 'return_comment', 'created_at', 'updated_at',
    'kind', 'absence_reason', 'absence_note', 'link_url', 'problems', 'learned', 'photo_file_id'
  ],
  CertBatches: [
    'batch_id', 'placement_id', 'student_email', 'supervisor_email', 'created_at', 'entry_ids',
    'hours_305', 'hours_304', 'status', 'decided_at', 'decided_by_name', 'comment'
  ],
  Sessions: ['token_hash', 'email', 'kind', 'expires_at', 'used', 'created_at'],
  Audit: ['ts', 'actor', 'action', 'target', 'detail'],
  Trash: ['ts', 'actor', 'reason', 'sheet', 'row_json']
};

/** ค่าเริ่มต้นของชีต Config: [key, value, note] */
var CONFIG_DEFAULTS = [
  ['PROGRAM_NAME', 'หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา', 'ชื่อเต็มในเอกสาร'],
  ['PROGRAM_SHORT', 'หลักสูตรวิศวกรรมซอฟต์แวร์ มทร.ล้านนา', 'ชื่อย่อในอีเมล'],
  ['PROGRAM_EMAIL', '', 'อีเมลสำหรับตอบกลับ (reply-to) ปกติใช้อีเมลผู้ประสานงาน SE-WIL เว้นว่างได้ ระบบจะใช้ COORDINATOR_EMAIL'],
  ['COORDINATOR_NAME', 'อาจารย์ธนิต เกตุแก้ว', 'ผู้ประสานงาน SE-WIL ผู้ติดต่อหลักของนักศึกษาและสถานประกอบการ แสดงเป็นรายชื่อแรกในระบบ อีเมล และข้อตกลง'],
  ['COORDINATOR_EMAIL', 'thanit@rmutl.ac.th', 'อีเมลผู้ประสานงาน SE-WIL (อีเมลงาน)'],
  ['COORDINATOR_PHONE', '', 'ไม่บังคับ ใส่เฉพาะเบอร์ที่เจ้าตัวยินยอม แสดงเฉพาะผู้เกี่ยวข้องกับการฝึกแต่ละราย (ในระบบ อีเมลถึงผู้นิเทศงาน และข้อตกลง) ไม่แสดงในพอร์ทัลสาธารณะ'],
  ['PROGRAM_HEAD_NAME', '', 'ชื่อหัวหน้าหลักสูตร แสดงในระบบเป็นผู้ติดต่อกรณีจำเป็น และในข้อตกลง (ชื่อและอีเมล)'],
  ['PROGRAM_HEAD_EMAIL', '', 'อีเมลหัวหน้าหลักสูตร'],
  ['PROGRAM_HEAD_PHONE', '', 'ไม่บังคับ ใส่เฉพาะเบอร์ที่เจ้าตัวยินยอม แสดงเฉพาะในระบบแก่ผู้เกี่ยวข้อง ไม่แสดงในข้อตกลง อีเมล หรือพอร์ทัล'],
  ['SEMESTER_LABEL', '2/2569', ''],
  ['SEMESTER_START', '2026-11-18', 'วันเปิดภาค รูปแบบ ค.ศ. yyyy-MM-dd'],
  ['SEMESTER_END', '2027-03-09', 'วันสุดท้ายที่บันทึกชั่วโมงได้'],
  ['PERIOD_TEXT', '18 พฤศจิกายน 2569 ถึง 9 มีนาคม 2570', 'ข้อความช่วงเวลาฝึกในข้อตกลง'],
  ['TARGET_305', '300', 'ชั่วโมงขั้นต่ำ ENGSE305'],
  ['TARGET_304', '135', 'ชั่วโมงขั้นต่ำ ENGSE304'],
  ['WEEKLY_305', '20', 'ชั่วโมงต่อสัปดาห์ที่คาดหวัง ENGSE305'],
  ['WEEKLY_304', '9', 'ชั่วโมงต่อสัปดาห์ที่คาดหวัง ENGSE304 (6 ณ สถานประกอบการ + 3 ศึกษาเอง)'],
  ['DIGEST_DAY', 'FRIDAY', 'วันที่ส่งสรุปให้ผู้นิเทศงาน (MONDAY–SUNDAY)'],
  ['DIGEST_HOUR', '15', 'ชั่วโมงที่ส่งสรุป (0–23)'],
  ['SESSION_DAYS', '14', 'อายุการเข้าระบบ (วัน)'],
  ['LOGIN_LINK_MINUTES', '30', 'อายุลิงก์เข้าระบบในอีเมล (นาที)'],
  ['MAX_HOURS_PER_DAY', '12', 'ชั่วโมงสูงสุดต่อวัน'],
  ['ADVISOR_SELF_ASSIGN', 'TRUE', 'TRUE = อาจารย์เลือกนักศึกษาที่จะดูแลเองในแท็บ "จับคู่อาจารย์นิเทศ" FALSE = ปิด เหลือเฉพาะ admin กำหนด'],
  ['ADVISOR_MAX', '8', 'จำนวนนักศึกษาสูงสุดที่อาจารย์หนึ่งคนเลือกเองได้ (admin กำหนดเกินได้) 0 = ไม่จำกัด'],
  ['CV_REQUIRED', 'FALSE', 'TRUE = ต้องแนบ CV ก่อนส่งข้อมูลที่ฝึก'],
  ['MAX_UPLOAD_MB', '5', 'ขนาดไฟล์สูงสุดที่แนบได้ (CV และรูปสถานประกอบการ)'],
  ['APP_URL', '', 'URL ของเว็บแอปที่ลงท้ายด้วย /exec ใส่หลัง Deploy'],
  ['PORTAL_URL', 'https://se-rmutl.github.io/se-wil/', 'พอร์ทัลรายวิชา ใช้เป็นลิงก์คู่มือในหน้าเว็บแอปและในอีเมล'],
  ['PLACEMENT_DUE', '2026-11-13', 'วันสุดท้ายที่นักศึกษาส่งข้อมูลที่ฝึก (ต้องตรงกับพอร์ทัล)'],
  ['AGREEMENT_DUE', '2026-11-16', 'วันสุดท้ายที่สถานประกอบการยืนยันข้อตกลง SE-WIL01 (ต้องตรงกับพอร์ทัล)'],
  ['VISIT_FROM', '2026-12-16', 'เริ่มช่วงนิเทศครั้งที่ 1 (สัปดาห์ที่ 5) ใช้ในบันทึกขออนุมัติแต่งตั้งอาจารย์นิเทศ'],
  ['VISIT_TO', '2027-01-05', 'สิ้นสุดช่วงนิเทศครั้งที่ 1 (สัปดาห์ที่ 7)'],
  ['VISIT2_BY', '2027-02-09', 'นิเทศครั้งที่ 2 ตามความจำเป็น ภายในวันนี้'],
  ['DOC_OFFICE', 'สาขาวิศวกรรมไฟฟ้า คณะวิศวกรรมศาสตร์', 'บรรทัด "ส่วนราชการ" ในบันทึกข้อความขออนุมัติแต่งตั้งอาจารย์นิเทศ'],
  ['DOC_PHONE', '', 'เบอร์ภายในของสาขาในบรรทัดส่วนราชการ เว้นว่างได้'],
  ['DOC_NO_PREFIX', 'อว ๐๖๕๔.๐๔/ฟฟ', 'เลขที่หนังสือส่วนหน้า ระบบเว้นเลขลำดับไว้ให้งานธุรการลงรับ ตรวจกับธุรการสาขาก่อนใช้'],
  ['DOC_TO', 'คณบดีคณะวิศวกรรมศาสตร์', 'บรรทัด "เรียน" ในบันทึกข้อความ'],
  ['DOC_VIA', 'หัวหน้าสาขาวิศวกรรมไฟฟ้า', 'เสนอผ่าน (ตำแหน่ง) เว้นว่างถ้าเสนอตรง'],
  ['DEPT_HEAD_NAME', '', 'ชื่อหัวหน้าสาขาพร้อมตำแหน่งทางวิชาการ ใช้ในช่องความเห็นท้ายบันทึก เว้นว่างได้ ระบบเว้นเส้นประไว้'],
  ['DEAN_TITLE', 'คณบดีคณะวิศวกรรมศาสตร์', 'ตำแหน่งผู้อนุมัติในช่องท้ายบันทึกขออนุมัติแต่งตั้งอาจารย์นิเทศ'],
  ['RESET_ENABLED', 'TRUE', 'TRUE = เปิดแท็บ "รีเซ็ตเพื่อทดสอบ" ให้ admin ทำให้นักศึกษา ผู้นิเทศงาน หรืออาจารย์นิเทศกลับไปเหมือนเพิ่งเข้าใหม่ ตั้งเป็น FALSE เมื่อเริ่มใช้จริง'],
  ['ROOT_FOLDER_ID', '', 'โฟลเดอร์ Google Drive ของรายวิชา เว้นว่างได้ setup() จะใช้โฟลเดอร์ที่เก็บชีตนี้'],
  ['TEMPLATE_DOC_ID', '', 'สร้างอัตโนมัติโดย setup()'],
  ['OUTPUT_FOLDER_ID', '', 'สร้างอัตโนมัติโดย setup()']
];

/**
 * กำหนดการทั้งภาคสำหรับรายการ "สิ่งที่ต้องทำ" และ "กำหนดการถัดไป" ของแต่ละบทบาท (ต้องตรงกับ deadlines ใน se-wil/config.js ของพอร์ทัล)
 * roles: student teacher admin company · cfg = ใช้วันที่จากชีต Config แทน date
 */
var TERM_PLAN = [
  { cfg: 'PLACEMENT_DUE', date: '2026-11-13', roles: ['student'], title: 'ส่งข้อมูลที่ฝึกในระบบ SE-WIL' },
  { date: '2026-11-14', roles: ['teacher'], title: 'เลือกนักศึกษาที่จะดูแลในแท็บ "จับคู่อาจารย์นิเทศ"' },
  { date: '2026-11-14', roles: ['admin'], title: 'อนุมัติข้อมูลที่ฝึกครบทุกคน และนักศึกษาทุกคนมีอาจารย์นิเทศ' },
  { cfg: 'AGREEMENT_DUE', date: '2026-11-16', roles: ['company'], title: 'ยืนยันข้อตกลง SE-WIL01' },
  { cfg: 'AGREEMENT_DUE', date: '2026-11-16', roles: ['student'], title: 'แนบแบบตอบรับ SE-WIL00 ที่สถานประกอบการลงนามในระบบ' },
  { date: '2026-11-17', roles: ['admin'], title: 'ตรวจหน่วยกิต ประกันอุบัติเหตุ และขอคำสั่งแต่งตั้งอาจารย์' },
  { cfg: 'SEMESTER_START', date: '2026-11-18', roles: ['student', 'teacher', 'company'], title: 'เปิดภาค รายงานตัว เริ่มบันทึก logbook' },
  { date: '2026-11-20', roles: ['company'], title: 'รับรอง logbook ครั้งแรก (ต่อจากนั้นทุกวันศุกร์)' },
  { date: '2026-11-27', roles: ['teacher'], title: 'นัดพบนักศึกษาที่ดูแลครั้งแรก' },
  { date: '2026-12-01', roles: ['student', 'company'], title: 'ส่งรายงานตัวและแผนงาน 15 สัปดาห์ (SE-WIL03)' },
  { date: '2026-12-08', roles: ['student', 'company'], title: 'ส่งข้อเสนอโครงงาน (SE-WIL05)' },
  { date: '2026-12-15', roles: ['teacher', 'student'], title: 'แจ้งผลพิจารณาข้อเสนอโครงงาน' },
  { date: '2027-01-05', roles: ['teacher', 'company', 'student'], title: 'นิเทศครั้งที่ 1 และประชุมสามฝ่ายครบทุกคน' },
  { date: '2027-01-12', roles: ['company', 'teacher', 'student'], title: 'ประเมินสมรรถนะกลางภาค และทบทวนความก้าวหน้าโครงงาน' },
  { date: '2027-01-26', roles: ['student'], title: 'ส่งรายงานความก้าวหน้าโครงงาน (SE-WIL07)' },
  { date: '2027-02-09', roles: ['student', 'teacher'], title: 'วันสุดท้ายของการถอนรายวิชาโดยได้ W' },
  { date: '2027-02-16', roles: ['student', 'company'], title: 'ส่งร่างรายงานโครงงานและรายงานการทดสอบ' },
  { date: '2027-02-23', roles: ['student', 'company', 'teacher'], title: 'ประเมินปลายภาค รายงานสะท้อนการเรียนรู้ และสาธิตผลงาน' },
  { date: '2027-03-02', roles: ['student', 'teacher', 'company'], title: 'นำเสนอแฟ้มผลงาน สอบปากเปล่า ส่งรายงานฉบับสมบูรณ์' },
  { date: '2027-03-09', roles: ['teacher'], title: 'สรุปคะแนนและส่งผลการเรียน' }
];

/** สถานะที่นักศึกษาบันทึก logbook ได้ */
var LOGBOOK_OPEN_STATUSES = ['agreement_sent', 'signed'];

var COMPANY_TYPES = ['เอกชน', 'รัฐวิสาหกิจ', 'หน่วยงานราชการ', 'ชุมชนหรือองค์กรไม่แสวงหากำไร'];
var WORK_MODES = { onsite: 'ปฏิบัติงาน ณ สถานประกอบการ', hybrid: 'แบบผสม (ณ สถานประกอบการและทางไกล)', remote: 'ทางไกลทั้งหมด' };
var IP_OWNERS = {
  company: 'สถานประกอบการเป็นเจ้าของผลงาน',
  joint: 'สถานประกอบการและนักศึกษา/มหาวิทยาลัยเป็นเจ้าของร่วมกัน',
  student: 'นักศึกษาและมหาวิทยาลัยเป็นเจ้าของผลงาน'
};

var _configCache = null;

/** อ่านค่าตั้งค่าทั้งหมดเป็น object (แคชต่อการเรียกหนึ่งครั้ง) */
function cfg_() {
  if (_configCache) return _configCache;
  var out = {};
  CONFIG_DEFAULTS.forEach(function (r) { out[r[0]] = r[1]; });
  try {
    readAll_('Config').forEach(function (r) {
      if (r.key) out[String(r.key).trim()] = String(r.value === undefined ? '' : r.value).trim();
    });
  } catch (e) { /* ยังไม่ได้ setup */ }
  _configCache = out;
  return out;
}

function cfgNum_(key) {
  var v = Number(cfg_()[key]);
  return isNaN(v) ? 0 : v;
}

function resetConfigCache_() { _configCache = null; }

var TH_MONTHS_ = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/** '2026-11-13' -> '13 พฤศจิกายน 2569' (ค่าว่างหรือรูปแบบอื่นคืนค่าเดิม) */
function thDateLong_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return String(iso || '');
  return Number(m[3]) + ' ' + TH_MONTHS_[Number(m[2]) - 1] + ' ' + (Number(m[1]) + 543);
}

/** URL ของพอร์ทัลรายวิชา ต่อท้ายด้วย path ได้ เช่น portalUrl_('company/supervisor.html') */
function portalUrl_(path) {
  var base = String(cfg_().PORTAL_URL || '').trim();
  if (!base) return '';
  if (base.slice(-1) !== '/') base += '/';
  return base + (path || '');
}

/** URL ของเว็บแอป */
function appUrl_() {
  var u = cfg_().APP_URL;
  if (u) return u;
  try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; }
}
