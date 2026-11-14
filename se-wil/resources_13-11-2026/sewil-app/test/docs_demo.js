/* ตัวอย่างเอกสารแต่งตั้งอาจารย์นิเทศจากข้อมูลสมมติ (ไม่ใช่ข้อมูลจริง)
 * Run: node test/docs_demo.js <outdir>   → <outdir>/memo.docx
 *   และ memo-sarabun.docx (จำลองฉบับ PDF จาก Google Docs: ฟอนต์ Sarabun ขนาด ×0.75)
 */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const SRC = path.join(__dirname, '..', 'src');
const out = process.argv[2] || '/tmp/docs-demo';
fs.mkdirSync(out, { recursive: true });

const students = [
  ['66543206101', 'นายกิตติพัฒน์ ใจดี', 'บริษัท ล้านนาซอฟต์ จำกัด', 'เชียงใหม่', 'adv1'],
  ['66543206102', 'นางสาวชนิดา แสงทอง', 'บริษัท ล้านนาซอฟต์ จำกัด', 'เชียงใหม่', 'adv1'],
  ['66543206103', 'นายธนกร มีสุข', 'บริษัท ดอยคลาวด์ เทคโนโลยี จำกัด', 'เชียงใหม่', 'adv1'],
  ['66543206104', 'นางสาวพิมพ์ชนก วงศ์คำ', 'สำนักงานพัฒนาดิจิทัลภาคเหนือ (สมมติ)', 'ลำปาง', 'adv2'],
  ['66543206105', 'นายภูริภัทร ศรีเมือง', 'บริษัท นครพิงค์ ดิจิทัล จำกัด', 'เชียงใหม่', 'adv2'],
  ['66543206106', 'นายวีรภัทร คำมา', 'บริษัท สยามเว็บเวิร์กส์ จำกัด', 'กรุงเทพมหานคร', 'adv3'],
  ['66543206107', 'นางสาวอรอุมา ทองดี', 'บริษัท สยามเว็บเวิร์กส์ จำกัด', 'กรุงเทพมหานคร', 'adv3'],
  ['66543206108', 'นายณัฐวุฒิ ปัญญา', 'บริษัท ลำพูนอินโนเวชัน จำกัด', 'ลำพูน', 'adv3'],
  ['66543206109', 'นางสาวศิริพร อินต๊ะ', 'บริษัท เชียงรายสมาร์ทฟาร์ม จำกัด', 'เชียงราย', 'adv4'],
  ['66543206110', 'นายอนุชา บุญมา', 'บริษัท ดอยคลาวด์ เทคโนโลยี จำกัด', 'เชียงใหม่', 'adv4']
];
const teachers = { adv1: 'อาจารย์สมชาย ตัวอย่าง', adv2: 'ผู้ช่วยศาสตราจารย์สมหญิง ตัวอย่าง', adv3: 'อาจารย์สมศักดิ์ ตัวอย่าง', adv4: 'อาจารย์สมใจ ตัวอย่าง' };
const users = Object.keys(teachers).map(k => ({ email: k + '@example.ac.th', role: 'teacher', name: teachers[k], active: 'TRUE' }))
  .concat(students.map((s, i) => ({ email: 's' + i + '@example.ac.th', role: 'student', student_id: s[0], name: s[1], advisor_email: s[4] + '@example.ac.th', active: 'TRUE' })));
const placements = students.map((s, i) => ({ student_email: 's' + i + '@example.ac.th', company_name: s[2], province: s[3], status: i === 9 ? 'submitted' : 'signed' }));

const ctx = { console, Date, Math, JSON, Object, Array, String, Number, Error, RegExp, Utilities: {
  formatDate: (d, tz, fmt) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
} };
vm.createContext(ctx);
['Config.gs', 'Logic.gs', 'Assign.gs', 'Krut.gs', 'Docs.gs'].forEach(f => vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f }));
const cfg = {};
vm.runInContext('CONFIG_DEFAULTS', ctx).forEach(r => { cfg[r[0]] = r[1]; });
Object.assign(cfg, { PROGRAM_HEAD_NAME: 'ผู้ช่วยศาสตราจารย์ตัวอย่าง หัวหน้าหลักสูตร', DEPT_HEAD_NAME: 'ผู้ช่วยศาสตราจารย์ตัวอย่าง หัวหน้าสาขา' });
ctx.cfg_ = () => cfg;
ctx.readAll_ = n => ({ Users: users, Placements: placements })[n] || [];

const b64 = vm.runInContext('KRUT_PNG_B64_', ctx);
const variants = [['memo', ''], ['memo', '-sarabun', "{font:'Sarabun',scale:0.75}"]];
variants.forEach(([kind, suffix, opts]) => {
  const parts = vm.runInContext(`docxParts_(appointmentModel_('${kind}', appointmentData_()), ${opts || 'null'})`, ctx);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-'));
  Object.keys(parts).forEach(p => { const f = path.join(dir, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, parts[p]); });
  fs.mkdirSync(path.join(dir, 'word/media'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'word/media/krut.png'), Buffer.from(b64, 'base64'));
  const target = path.join(path.resolve(out), kind + suffix + '.docx');
  fs.rmSync(target, { force: true });
  execFileSync('zip', ['-X', '-D', '-q', '-r', target, '.'], { cwd: dir });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('wrote', target);
});
