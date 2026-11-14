/* ตัวอย่างลิงก์หนังสือแนะนำและแบบตอบรับฉบับมีข้อมูล จากข้อมูลสมมติ (ไม่ใช่ข้อมูลจริง)
 * Run: node test/letter_demo.js [portalBase]   พิมพ์ลิงก์ 3 แบบ: single (ข้อความยาวสุด), bulk (มีข้อมูล 2 + เปล่า 1), blank
 */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const SRC = path.join(__dirname, '..', 'src');
const base = process.argv[2] || 'http://localhost:8765/se-wil/';
const signed = (b) => Array.from(b).map(x => (x > 127 ? x - 256 : x));
const ctx = { console, Date, Math, JSON, Object, Array, String, Number, Error, RegExp, Utilities: {
  formatDate: (d, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d),
  newBlob: (s) => ({ getBytes: () => signed(Buffer.from(s, 'utf8')) }),
  gzip: (b) => { const z = zlib.gzipSync(Buffer.from(b.getBytes().map(x => (x + 256) % 256))); return { getBytes: () => signed(z) }; },
  base64EncodeWebSafe: (bytes) => Buffer.from(bytes.map(x => (x + 256) % 256)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
} };
vm.createContext(ctx);
['Config.gs', 'Logic.gs', 'Db.gs', 'Letter.gs'].forEach(f => vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f }));
ctx.cfg_ = () => ({ PORTAL_URL: base });
const long = (s, n) => (s + ' ').repeat(Math.ceil(n / (s.length + 1))).slice(0, n);
const P = (o) => Object.assign({ status: 'submitted', company_name: 'บริษัท ล้านนาซอฟต์ จำกัด', company_address: '99 หมู่ 1 ถ.ห้วยแก้ว ต.สุเทพ อ.เมืองเชียงใหม่', province: 'เชียงใหม่',
  supervisor_name: 'คุณสมชาย ตัวอย่าง', supervisor_position: 'Tech Lead', supervisor_email: 'somchai@example.co.th', supervisor_phone: '',
  coadvisor_same: 'yes', position_title: 'Junior Software Developer', job_description: 'พัฒนาและทดสอบระบบเว็บของลูกค้า เขียน API และหน้าจอ ทำงานร่วมกับทีม QA',
  problem1_title: 'ระบบติดตามงานซ่อมบำรุงสำหรับทีมช่าง', problem2_title: '', work_mode: 'hybrid', schedule_305: 'จันทร์–ศุกร์ 08:00–12:00', schedule_304: 'พฤหัสบดี–ศุกร์ 14:00–17:00',
  ip_owner: 'joint', compensation: 'ไม่มี' }, o);
const rec = (u, p) => vm.runInContext('letterRecord_', ctx)(u, p);
const url = (recs) => vm.runInContext('letterUrl_', ctx)(recs);
const worst = P({ company_name: long('บริษัท ดอยคลาวด์ เทคโนโลยี แอนด์ ดิจิทัลโซลูชัน (ประเทศไทย) จำกัด (สำนักงานใหญ่)', 200), company_address: long('เลขที่ 123/45 อาคารสมมติ ชั้น 7 ถนนนิมมานเหมินท์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่', 400),
  supervisor_name: long('นางสาวพิมพ์ชนก ตัวอย่างยาวมากเป็นพิเศษ', 120), supervisor_position: long('Senior Software Engineering Manager', 120), supervisor_email: 'pimchanok.longname@example-company.co.th', supervisor_phone: '081-000-0000',
  coadvisor_same: 'no', coadvisor_name: 'คุณวีรภัทร ที่ปรึกษาร่วม', coadvisor_position: 'Product Owner', coadvisor_email: 'weerapat@example-company.co.th',
  position_title: long('Full-stack Developer และผู้ช่วยดูแลระบบคลาวด์', 200), job_description: long('ออกแบบ พัฒนา ทดสอบ และดูแลระบบบริหารจัดการคำสั่งซื้อ ทั้งส่วนหน้าเว็บ API และฐานข้อมูล', 1500),
  problem1_title: long('ระบบแนะนำสินค้าด้วยข้อมูลการสั่งซื้อย้อนหลังสำหรับร้านค้าออนไลน์ขนาดเล็ก', 200), problem2_title: long('ระบบแจ้งเตือนสต็อกต่ำผ่าน LINE สำหรับคลังสินค้า', 200),
  work_mode: 'onsite', schedule_305: long('จันทร์–ศุกร์ 08:30–12:30 และเสาร์เว้นเสาร์', 200), schedule_304: long('พฤหัสบดี–ศุกร์ 13:30–16:30', 200), ip_owner: 'company', compensation: 'เบี้ยเลี้ยงวันละ 300 บาท' });
const out = {
  single: url([rec({ name: 'นายกิตติพัฒน์ ใจดี', student_id: '66543206101' }, worst)]),
  bulk: url([rec({ name: 'นายกิตติพัฒน์ ใจดี', student_id: '66543206101' }, worst), rec({ name: 'นางสาวชนิดา แสงทอง', student_id: '66543206102' }, P({})),
    rec({ name: 'นายธนกร มีสุข', student_id: '66543206103' }, null)]),
  blank: url([rec({ name: 'นายธนกร มีสุข', student_id: '66543206103' }, P({ status: 'draft' }))]),
  sample: url([rec({ name: 'นางสาวชนิดา แสงทอง', student_id: '66543206102' }, P({})),
    rec({ name: 'นายภูริภัทร ศรีเมือง', student_id: '66543206105' }, P({ company_name: 'บริษัท นครพิงค์ ดิจิทัล จำกัด', supervisor_name: 'คุณวิภาวี ตัวอย่าง', supervisor_position: 'Project Manager',
      supervisor_email: 'wipawee@example.co.th', coadvisor_same: 'no', coadvisor_name: 'คุณอนุชา ตัวอย่าง', coadvisor_position: 'Senior Developer', coadvisor_email: 'anucha@example.co.th',
      position_title: 'QA Engineer', job_description: 'ทดสอบระบบทั้งแบบมือและอัตโนมัติ เขียนกรณีทดสอบ รายงานข้อบกพร่อง', problem1_title: 'ชุดทดสอบอัตโนมัติสำหรับแอปจองคิวคลินิก',
      problem2_title: 'แดชบอร์ดคุณภาพซอฟต์แวร์จากผลการทดสอบ', work_mode: 'onsite', ip_owner: 'company', compensation: 'เบี้ยเลี้ยงวันละ 200 บาท' })),
    rec({ name: 'นายธนกร มีสุข', student_id: '66543206103' }, null)])
};
console.log(JSON.stringify(out));
