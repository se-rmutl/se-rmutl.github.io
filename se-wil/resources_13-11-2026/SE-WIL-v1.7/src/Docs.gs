/**
 * เอกสารขอแต่งตั้งอาจารย์นิเทศและอาจารย์ที่ปรึกษาโครงงาน (v1.6, v1.7 ตัดร่างคำสั่งออก เพราะคณะออกคำสั่งเอง)
 *  - memo  : บันทึกข้อความเสนอขออนุมัติ (หัวหน้าหลักสูตร → ผ่านหัวหน้าสาขา → คณบดี)
 *            + สิ่งที่ส่งมาด้วย บัญชีรายชื่อ และสรุปรายอาจารย์นิเทศ
 * ข้อมูลมาจากชีต Users (นักศึกษา อาจารย์นิเทศ) และ Placements (สถานประกอบการ จังหวัด)
 * ออกได้สองรูปแบบจากโมเดลเดียวกัน
 *  - docx : เขียน OOXML เอง ฟอนต์ TH Sarabun New ตามระเบียบงานสารบรรณ แก้ต่อใน Word ได้
 *  - pdf  : สร้าง Google Doc ชั่วคราวด้วยฟอนต์ Sarabun แล้วแปลงเป็น PDF (ฟอนต์ที่ Google มี)
 */

var TH_DIGITS_ = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
function thd_(s) { return String(s === undefined || s === null ? '' : s).replace(/[0-9]/g, function (d) { return TH_DIGITS_[+d]; }); }

/** วันที่ไทยเต็มจาก ISO เป็นเลขไทย เช่น ๑๘ พฤศจิกายน ๒๕๖๙ */
function thDateThd_(iso) { return thd_(thDateLong_(iso)); }

/** เดือนและปีปัจจุบัน สำหรับช่องวันที่ที่เว้นวันไว้ให้ลงเอง */
function thMonthYearNow_() {
  var d = new Date(Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd') + 'T00:00:00Z');
  return TH_MONTHS_[d.getUTCMonth()] + ' ' + thd_(d.getUTCFullYear() + 543);
}

/* ---------------- ข้อมูล ---------------- */

/** แถวสำหรับเอกสาร เรียงตามอาจารย์นิเทศ แล้วตามสถานประกอบการ */
function appointmentData_() {
  var users = readAll_('Users').map(findUserFromRow_);
  var byEmail = {};
  users.forEach(function (u) { if (u.email) byEmail[u.email] = u; });
  var placements = {};
  readAll_('Placements').forEach(function (p) { placements[normEmail_(p.student_email)] = p; });
  var rows = users.filter(function (u) { return u.active && u.role === 'student'; }).map(function (u) {
    var p = placements[u.email] || null;
    var adv = u.advisor_email ? byEmail[u.advisor_email] : null;
    return {
      email: u.email, name: u.name || u.email, student_id: u.student_id || '', section: u.section || '',
      company: p && p.company_name ? String(p.company_name) : '', province: p && p.province ? String(p.province) : '',
      status: p ? String(p.status || 'draft') : 'none',
      advisor_email: u.advisor_email || '', advisor: adv ? (adv.name || adv.email) : ''
    };
  });
  rows.sort(function (a, b) {
    var x = (a.advisor || '￿').localeCompare(b.advisor || '￿', 'th');
    if (x) return x;
    x = (a.company || '￿').localeCompare(b.company || '￿', 'th');
    return x || a.student_id.localeCompare(b.student_id);
  });
  var advisors = [], seen = {}, companies = {};
  rows.forEach(function (r) {
    if (r.advisor && !seen[r.advisor_email]) { seen[r.advisor_email] = true; advisors.push({ email: r.advisor_email, name: r.advisor }); }
    if (r.company) companies[r.company.trim().toLowerCase()] = true;
  });
  return {
    rows: rows, advisors: advisors, companyCount: Object.keys(companies).length,
    missingAdvisor: rows.filter(function (r) { return !r.advisor; }).map(function (r) { return r.name; }),
    missingPlacement: rows.filter(function (r) { return !r.company; }).map(function (r) { return r.name; }),
    notApproved: rows.filter(function (r) { return r.company && ['agreement_sent', 'signed'].indexOf(r.status) < 0; }).map(function (r) { return r.name; })
  };
}

/* ---------------- โมเดลเอกสาร ----------------
 * บล็อก: { t:'p', runs:[{text,b,size,hl}], align, indent, left, before, after, tabs:[{pos,align,leader}] }
 *        { t:'table', widths:[twip], header:[...], rows:[[...]], size, borders:true|false, cells: [[block...]] (ไม่บังคับ) }
 *        { t:'memoHead' } { t:'krut', cm } { t:'pagebreak' }
 * ขนาดตัวอักษรเป็น pt ตาม TH Sarabun New (pdf แปลงเป็น Sarabun ×0.75)
 */
function P_(text, opt) {
  opt = opt || {};
  var runs = Array.isArray(text) ? text : [{ text: text, b: opt.b, size: opt.size, hl: opt.hl }];
  return { t: 'p', runs: runs, align: opt.align || 'left', indent: opt.indent || 0, left: opt.left || 0, before: opt.before || 0, after: opt.after || 0, tabs: opt.tabs || null, keep: !!opt.keep };
}
var DOC_TEXT_W_ = 9071;   // ความกว้างพื้นที่พิมพ์ A4 ขอบซ้าย 3 ซม. ขวา 2 ซม. (twip)
var DOC_INDENT_ = 1418;   // ย่อหน้า 2.5 ซม.
var DOC_SIGN_LEFT_ = 4253; // บล็อกลงนามเริ่มที่ 7.5 ซม.

function appointmentCtx_(d) {
  var c = cfg_();
  var sem = String(c.SEMESTER_LABEL || '');
  // รหัสวิชาใช้เลขอารบิก เพื่อไม่ให้ถูกตัดบรรทัดกลางรหัส
  var courses = 'ENGSE305 การฝึกเฉพาะตำแหน่ง และ ENGSE304 ปัญหาพิเศษจากสถานประกอบการ';
  return {
    c: c, sem: thd_(sem), courses: courses,
    office: String(c.DOC_OFFICE || ''), phone: thd_(c.DOC_PHONE || ''), noPrefix: thd_(c.DOC_NO_PREFIX || ''),
    to: String(c.DOC_TO || 'คณบดีคณะวิศวกรรมศาสตร์'), via: String(c.DOC_VIA || ''), deptHead: String(c.DEPT_HEAD_NAME || ''),
    dean: String(c.DEAN_TITLE || 'คณบดีคณะวิศวกรรมศาสตร์'), head: String(c.PROGRAM_HEAD_NAME || ''),
    start: thDateThd_(c.SEMESTER_START), end: thDateThd_(c.SEMESTER_END),
    visitFrom: thDateThd_(c.VISIT_FROM), visitTo: thDateThd_(c.VISIT_TO), visit2By: thDateThd_(c.VISIT2_BY),
    monthYear: thMonthYearNow_(), year: thd_(String(new Date().getFullYear() + 543)),
    n: thd_(d.rows.length), m: thd_(d.companyCount), k: thd_(d.advisors.length)
  };
}

/** ตารางบัญชีรายชื่อ ใช้ทั้งในบันทึกและแนบท้ายคำสั่ง */
function appointmentTable_(d) {
  return {
    t: 'table', size: 14, borders: true,
    widths: [650, 1850, 1800, 2200, 1050, 1521],
    header: ['ลำดับ', 'ชื่อ-สกุลนักศึกษา', 'รหัสนักศึกษา', 'สถานประกอบการ', 'จังหวัด', 'อาจารย์นิเทศ/ ที่ปรึกษาโครงงาน'],
    align: ['center', 'left', 'center', 'left', 'left', 'left'],
    rows: d.rows.map(function (r, i) {
      return [thd_(i + 1), r.name, thd_(r.student_id), r.company || '(ยังไม่ส่งข้อมูลที่ฝึก)', r.province || '-', r.advisor || '(ยังไม่กำหนด)'];
    })
  };
}

function appointmentModel_(kind, d) {
  var x = appointmentCtx_(d), B = [];
  if (kind !== 'memo') throw new Error('ชนิดเอกสารไม่ถูกต้อง');
  var subject = 'แต่งตั้งอาจารย์นิเทศและอาจารย์ที่ปรึกษาโครงงาน รายวิชา ' + x.courses + ' ภาคการศึกษาที่ ' + x.sem;
  if (kind === 'memo') {
    B.push({ t: 'memoHead' });
    B.push(P_([{ text: 'ส่วนราชการ', b: true, size: 20 }, { text: '  ' + x.office + (x.phone ? '  โทร. ' + x.phone : '') }, { tab: true }], { tabs: [{ pos: DOC_TEXT_W_, align: 'right', leader: 'dot' }] }));
    B.push(P_([{ text: 'ที่', b: true, size: 20 }, { text: '  ' + x.noPrefix + '/' }, { tab: true }, { text: 'วันที่', b: true, size: 20 }, { text: '       ' + x.monthYear }, { tab: true }],
      { tabs: [{ pos: 4535, align: 'left', leader: 'dot' }, { pos: DOC_TEXT_W_, align: 'right', leader: 'dot' }] }));
    B.push(P_([{ text: 'เรื่อง', b: true, size: 20 }, { text: '  ขออนุมัติ' + subject }], { after: 60 }));
    B.push(P_([{ text: 'เรียน', b: true }, { text: '  ' + x.to + (x.via ? ' (ผ่าน' + x.via + ')' : '') }], { after: 60 }));
    B.push(P_([{ text: 'สิ่งที่ส่งมาด้วย', b: true }, { text: '  บัญชีรายชื่อนักศึกษา สถานประกอบการ และอาจารย์นิเทศ  จำนวน ๑ ชุด' }], { after: 120 }));
    B.push(P_('ด้วยหลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์ จัดการเรียนการสอนรายวิชา ' + x.courses +
      ' ภาคการศึกษาที่ ' + x.sem + ' โดยนักศึกษาชั้นปีที่ ๔ จำนวน ' + x.n + ' คน ปฏิบัติงาน ณ สถานประกอบการ ' + x.m +
      ' แห่ง ระหว่างวันที่ ' + x.start + ' ถึงวันที่ ' + x.end + ' และมีอาจารย์ประจำหลักสูตรเป็นอาจารย์นิเทศและอาจารย์ที่ปรึกษาโครงงาน',
      { align: 'thai', indent: DOC_INDENT_, after: 60 }));
    B.push(P_('ในการนี้ หลักสูตรวิศวกรรมซอฟต์แวร์จึงขออนุมัติ ดังนี้', { align: 'thai', indent: DOC_INDENT_ }));
    B.push(P_('๑. แต่งตั้งอาจารย์นิเทศและอาจารย์ที่ปรึกษาโครงงาน จำนวน ' + x.k + ' คน ตามบัญชีรายชื่อที่ส่งมาด้วย', { align: 'thai', indent: DOC_INDENT_ }));
    B.push(P_('๒. ให้อาจารย์นิเทศเดินทางไปนิเทศนักศึกษา ณ สถานประกอบการ อย่างน้อยคนละ ๑ ครั้ง ในช่วงวันที่ ' + x.visitFrom + ' ถึงวันที่ ' + x.visitTo +
      ' และครั้งที่ ๒ ตามความจำเป็น ภายในวันที่ ' + x.visit2By + ' โดยเบิกค่าใช้จ่ายในการเดินทางไปราชการตามระเบียบของมหาวิทยาลัย', { align: 'thai', indent: DOC_INDENT_ }));
    B.push(P_('๓. ให้งานพัฒนาทักษะวิชาชีพนักศึกษา ออกหนังสือขอเข้านิเทศถึงสถานประกอบการ', { align: 'thai', indent: DOC_INDENT_, after: 60 }));
    B.push(P_('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ', { indent: DOC_INDENT_, after: 480 }));
    B.push(P_('(' + (x.head || '..............................................') + ')', { align: 'center', left: DOC_SIGN_LEFT_ }));
    B.push(P_('หัวหน้าหลักสูตรวิศวกรรมซอฟต์แวร์', { align: 'center', left: DOC_SIGN_LEFT_, after: 120 }));
    // ช่องความเห็นผู้เสนอผ่าน (ซ้าย) และช่องสั่งการของคณบดี (ขวา)
    var dots = '..............................................';
    var deanCol = [P_('☐ อนุมัติ    ☐ ไม่อนุมัติ', { align: 'center', after: 420 }), P_('(' + dots + ')', { align: 'center' }), P_(x.dean, { align: 'center' })];
    var viaCol = x.via ? [P_('เรียน ' + x.to), P_('เพื่อโปรดพิจารณาอนุมัติ', { left: 425, after: 300 }), P_('(' + (x.deptHead || dots) + ')', { align: 'center' }),
      P_(x.via, { align: 'center' })] : [P_('')];
    B.push({ t: 'table', borders: false, widths: [DOC_TEXT_W_ / 2, DOC_TEXT_W_ / 2], cells: [[viaCol, deanCol]], keep: true });
    B.push({ t: 'pagebreak' });
    B.push(P_('สิ่งที่ส่งมาด้วย', { b: true, align: 'right' }));
    B.push(P_('บัญชีรายชื่อนักศึกษา สถานประกอบการ และอาจารย์นิเทศ', { b: true, align: 'center' }));
    B.push(P_('รายวิชา ' + x.courses + ' ภาคการศึกษาที่ ' + x.sem, { b: true, align: 'center', after: 120 }));
    B.push(appointmentTable_(d));
    B.push(P_('สรุปรายอาจารย์นิเทศ', { b: true, before: 240, after: 60 }));
    d.advisors.forEach(function (a, i) {
      var mine = d.rows.filter(function (r) { return r.advisor_email === a.email; });
      var comp = {}, prov = {};
      mine.forEach(function (r) { if (r.company) comp[r.company] = true; if (r.province) prov[r.province] = true; });
      B.push(P_([{ text: thd_(i + 1) + '. ' + a.name, b: true }, { text: '  นักศึกษา ' + thd_(mine.length) + ' คน สถานประกอบการ ' + thd_(Object.keys(comp).length) + ' แห่ง' + (Object.keys(prov).length ? ' (จังหวัด' + Object.keys(prov).join(' ') + ')' : '') }], { before: 60, keep: true }));
      mine.forEach(function (r, j) {
        B.push(P_(thd_(i + 1) + '.' + thd_(j + 1) + ' ' + r.name + ' (' + thd_(r.student_id) + ') ' + (r.company || '(ยังไม่ส่งข้อมูลที่ฝึก)') + (r.province ? ' จังหวัด' + r.province : ''), { left: 709, size: 14 }));
      });
    });
    if (d.missingAdvisor.length) {
      B.push(P_('นักศึกษาที่ยังไม่มีอาจารย์นิเทศ ' + thd_(d.missingAdvisor.length) + ' คน: ' + d.missingAdvisor.join(', '), { before: 120, hl: true }));
    }
  }
  return B;
}

/* ---------------- DOCX (OOXML) ---------------- */

function xmlEsc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
var EMU_PER_CM_ = 360000;

function docxRun_(r, base) {
  if (r.tab) return '<w:r><w:tab/></w:r>';
  if (r.image) return docxImage_(r.image);
  var sz = Math.round((r.size || base.size || 16) * DOCX_SCALE_ * 2);
  var F = DOCX_FONT_;
  var pr = '<w:rPr><w:rFonts w:ascii="' + F + '" w:hAnsi="' + F + '" w:cs="' + F + '" w:eastAsia="' + F + '"/>' +
    ((r.b || base.b) ? '<w:b/><w:bCs/>' : '') + '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/>' +
    ((r.hl || base.hl) ? '<w:highlight w:val="yellow"/>' : '') + '<w:lang w:bidi="th-TH"/></w:rPr>';
  return String(r.text).split('\n').map(function (part, i) {
    return (i ? '<w:r>' + pr + '<w:br/></w:r>' : '') + '<w:r>' + pr + '<w:t xml:space="preserve">' + xmlEsc_(part) + '</w:t></w:r>';
  }).join('');
}

var DOCX_SPACER_ = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:sz w:val="8"/><w:szCs w:val="8"/></w:rPr></w:pPr></w:p>';
var DOCX_IMG_SEQ_ = 1;
function docxImage_(img) {
  var cy = Math.round(img.cm * EMU_PER_CM_), cx = Math.round(cy * KRUT_W_ / KRUT_H_), id = DOCX_IMG_SEQ_++;
  return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
    '<wp:docPr id="' + id + '" name="ครุฑ ' + id + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>' +
    '<pic:nvPicPr><pic:cNvPr id="' + id + '" name="krut.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
    '<pic:blipFill><a:blip r:embed="rIdKrut"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}

function docxPara_(p, cellAlign) {
  var jc = { left: 'left', center: 'center', right: 'right', thai: 'thaiDistribute' }[cellAlign || p.align] || 'left';
  var ppr = '<w:pPr>' + (p.keep ? '<w:keepNext/>' : '') +
    (p.tabs ? '<w:tabs>' + p.tabs.map(function (t) { return '<w:tab w:val="' + t.align + '" w:leader="' + (t.leader || 'none') + '" w:pos="' + t.pos + '"/>'; }).join('') + '</w:tabs>' : '') +
    '<w:spacing w:before="' + (p.before || 0) + '" w:after="' + (p.after || 0) + '" w:line="240" w:lineRule="auto"/>' +
    ((p.indent || p.left) ? '<w:ind w:left="' + (p.left || 0) + '" w:firstLine="' + (p.indent || 0) + '"/>' : '') +
    '<w:jc w:val="' + jc + '"/></w:pPr>';
  var base = { size: p.runs.length === 1 ? p.runs[0].size : null, b: false, hl: false };
  return '<w:p>' + ppr + p.runs.map(function (r) { return docxRun_(r, base); }).join('') + '</w:p>';
}

function docxTable_(t) {
  var border = t.borders ? 'single' : 'nil';
  var b = function (side) { return '<w:' + side + ' w:val="' + border + '" w:sz="4" w:space="0" w:color="000000"/>'; };
  var head = '<w:tblPr><w:tblW w:w="' + t.widths.reduce(function (a, x) { return a + x; }, 0) + '" w:type="dxa"/>' +
    '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b).join('') + '</w:tblBorders>' +
    '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
    '<w:tblGrid>' + t.widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
  function cell(content, i, isHead) {
    var w = t.widths[i];
    var paras = Array.isArray(content) ? content : [P_(String(content), { size: t.size, b: isHead })];
    return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (isHead ? '<w:shd w:val="clear" w:color="auto" w:fill="E7ECF3"/>' : '') +
      '<w:vAlign w:val="' + (isHead ? 'center' : 'top') + '"/></w:tcPr>' +
      paras.map(function (p) {
        if (p.t !== 'p') return docxBlock_(p);
        return docxPara_(p, isHead ? 'center' : (t.align ? t.align[i] : null));
      }).join('') + '</w:tc>';
  }
  var rows = [];
  if (t.header) rows.push('<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' + t.header.map(function (h, i) { return cell(h, i, true); }).join('') + '</w:tr>');
  (t.cells || t.rows).forEach(function (r) { rows.push('<w:tr><w:trPr><w:cantSplit/></w:trPr>' + r.map(function (c, i) { return cell(c, i, false); }).join('') + '</w:tr>'); });
  return '<w:tbl>' + head + rows.join('') + '</w:tbl>';
}

function docxBlock_(b) {
  if (b.t === 'p') return docxPara_(b);
  if (b.t === 'table') return docxTable_(b) + DOCX_SPACER_;
  if (b.t === 'pagebreak') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  if (b.t === 'krut') return docxPara_({ runs: [{ image: { cm: b.cm } }], align: 'center' });
  if (b.t === 'memoHead') {
    // ตารางไร้เส้น: ครุฑ ๑.๕ ซม. ชิดซ้าย | "บันทึกข้อความ" กึ่งกลาง
    var krutW = Math.round(1.5 * KRUT_W_ / KRUT_H_ * 567) + 140;
    return docxTable_({
      borders: false, widths: [krutW, DOC_TEXT_W_ - 2 * krutW, krutW],
      cells: [[[{ t: 'p', runs: [{ image: { cm: 1.5 } }], align: 'left' }],
        [P_('บันทึกข้อความ', { b: true, size: 29, align: 'center', before: 200 })], [P_('')]]]
    });
  }
  return '';
}

var DOCX_FONT_ = 'TH Sarabun New', DOCX_SCALE_ = 1;

/** คืน { 'path': string } ของไฟล์ XML ทั้งหมด (ไฟล์ครุฑแยกต่างหาก)
 *  opts.font/opts.scale ใช้ตรวจหน้าตาฉบับ PDF (Sarabun ×0.75) บนเครื่องทดสอบเท่านั้น */
function docxParts_(blocks, opts) {
  DOCX_IMG_SEQ_ = 1;
  DOCX_FONT_ = (opts && opts.font) || 'TH Sarabun New'; DOCX_SCALE_ = (opts && opts.scale) || 1;
  var ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  var body = blocks.map(docxBlock_).join('');
  var F = DOCX_FONT_, dsz = Math.round(32 * DOCX_SCALE_);
  var sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="851" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>';
  var decl = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return {
    '[Content_Types].xml': decl + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>',
    '_rels/.rels': decl + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/_rels/document.xml.rels': decl + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
      '<Relationship Id="rIdKrut" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/krut.png"/></Relationships>',
    'word/settings.xml': decl + '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/>' +
      '<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat><w:themeFontLang w:val="en-US" w:bidi="th-TH"/></w:settings>',
    'word/styles.xml': decl + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>' +
      '<w:rFonts w:ascii="' + F + '" w:hAnsi="' + F + '" w:cs="' + F + '" w:eastAsia="' + F + '"/><w:sz w:val="' + dsz + '"/><w:szCs w:val="' + dsz + '"/>' +
      '<w:lang w:val="th-TH" w:eastAsia="en-US" w:bidi="th-TH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/>' +
      '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>',
    'word/document.xml': decl + '<w:document ' + ns + '><w:body>' + body + sect + '</w:body></w:document>'
  };
}

function docxBlob_(blocks, name) {
  var parts = docxParts_(blocks);
  var blobs = Object.keys(parts).map(function (p) { return Utilities.newBlob(parts[p], 'application/xml', p); });
  blobs.push(Utilities.newBlob(Utilities.base64Decode(KRUT_PNG_B64_), 'image/png', 'word/media/krut.png'));
  return Utilities.zip(blobs, name).setContentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/* ---------------- PDF ผ่าน Google Doc ---------------- */

var GDOC_SCALE_ = 0.75; // TH Sarabun New 16 pt ≈ Sarabun 12 pt
var TWIP_TO_PT_ = 1 / 20;

function gdocAlign_(a) {
  var H = DocumentApp.HorizontalAlignment;
  return { center: H.CENTER, right: H.RIGHT, thai: H.JUSTIFY, left: H.LEFT }[a] || H.LEFT;
}
function gdocKrut_(para, cm) {
  var img = para.appendInlineImage(Utilities.newBlob(Utilities.base64Decode(KRUT_PNG_B64_), 'image/png', 'krut.png'));
  var hPt = cm / 2.54 * 72;
  img.setHeight(hPt).setWidth(hPt * KRUT_W_ / KRUT_H_);
}
/** เติมข้อความลงย่อหน้าตามรายการ run */
function gdocFillPara_(para, p, base) {
  para.setAlignment(gdocAlign_(p.align));
  para.setSpacingBefore((p.before || 0) * TWIP_TO_PT_).setSpacingAfter((p.after || 0) * TWIP_TO_PT_).setLineSpacing(1);
  if (p.left || p.indent) para.setIndentStart((p.left || 0) * TWIP_TO_PT_).setIndentFirstLine(((p.left || 0) + (p.indent || 0)) * TWIP_TO_PT_);
  var any = false;
  p.runs.forEach(function (r) {
    if (r.image) { gdocKrut_(para, r.image.cm); return; }
    var s = r.tab ? '    ' : String(r.text).replace(/\n/g, '\r');
    if (!s) return;
    var t = para.appendText(s);
    t.setFontFamily('Sarabun').setFontSize(Math.round((r.size || p.runs.length === 1 && p.runs[0].size || (base && base.size) || 16) * GDOC_SCALE_ * 2) / 2)
      .setBold(!!(r.b || (base && base.b)));
    if (r.hl || (base && base.hl)) t.setBackgroundColor('#FFF2A8');
    any = true;
  });
  return any;
}
function gdocTable_(body, t) {
  var head = t.header ? [t.header] : [];
  var data = (t.cells || t.rows).map(function (r) { return r.map(function () { return ''; }); });
  var table = body.appendTable(head.map(function (r) { return r.map(function () { return ''; }); }).concat(data));
  table.setBorderWidth(t.borders ? 0.5 : 0);
  t.widths.forEach(function (w, i) { table.setColumnWidth(i, w * TWIP_TO_PT_); });
  var all = head.concat(t.cells || t.rows);
  all.forEach(function (row, ri) {
    var isHead = t.header && ri === 0;
    row.forEach(function (content, ci) {
      var cell = table.getCell(ri, ci);
      cell.setPaddingLeft(3).setPaddingRight(3).setPaddingTop(1).setPaddingBottom(1);
      if (isHead) cell.setBackgroundColor('#E7ECF3');
      var paras = Array.isArray(content) ? content : [P_(String(content), { size: t.size, b: isHead, align: isHead ? 'center' : (t.align ? t.align[ci] : 'left') })];
      var first = cell.getChild(0).asParagraph();
      paras.forEach(function (p, pi) {
        var para = pi === 0 ? first : cell.appendParagraph('');
        gdocFillPara_(para, p, { size: t.size });
      });
    });
  });
  return table;
}

function gdocPdfBlob_(blocks, name) {
  var doc = DocumentApp.create(name);
  var body = doc.getBody();
  body.setMarginTop(851 * TWIP_TO_PT_).setMarginBottom(1134 * TWIP_TO_PT_).setMarginLeft(1701 * TWIP_TO_PT_).setMarginRight(1134 * TWIP_TO_PT_);
  blocks.forEach(function (b) {
    if (b.t === 'p') gdocFillPara_(body.appendParagraph(''), b);
    else if (b.t === 'table') gdocTable_(body, b);
    else if (b.t === 'pagebreak') body.appendPageBreak();
    else if (b.t === 'krut') { var kp = body.appendParagraph(''); kp.setAlignment(DocumentApp.HorizontalAlignment.CENTER); gdocKrut_(kp, b.cm); }
    else if (b.t === 'memoHead') {
      var krutW = Math.round(1.5 * KRUT_W_ / KRUT_H_ * 567) + 140;
      gdocTable_(body, { borders: false, widths: [krutW, DOC_TEXT_W_ - 2 * krutW, krutW],
        cells: [[[{ t: 'p', runs: [{ image: { cm: 1.5 } }], align: 'left' }], [P_('บันทึกข้อความ', { b: true, size: 29, align: 'center', before: 200 })], [P_('')]]] });
    }
  });
  // ย่อหน้าว่างแรกที่ Google Docs ใส่มาเอง
  var first = body.getChild(0);
  if (first && first.getType() === DocumentApp.ElementType.PARAGRAPH && !first.asParagraph().getText() && body.getNumChildren() > 1) {
    try { first.removeFromParent(); } catch (e) { /* ย่อหน้าสุดท้ายลบไม่ได้ */ }
  }
  doc.saveAndClose();
  var file = DriveApp.getFileById(doc.getId());
  var pdf = file.getAs('application/pdf').setName(name + '.pdf');
  file.setTrashed(true);
  return pdf;
}

/* ---------------- API ---------------- */

/** วันที่สร้างบันทึกขออนุมัติครั้งแรกของภาค (ว่าง = ยังไม่สร้าง) */
function docMemoKey_() { return 'DOC_MEMO_AT_' + String(cfg_().SEMESTER_LABEL || '').replace(/\W/g, '_'); }
function docMemoAt_() {
  try { return PropertiesService.getScriptProperties().getProperty(docMemoKey_()) || ''; } catch (e) { return ''; }
}
/** กำหนดขอคำสั่งแต่งตั้งจาก TERM_PLAN (รายการของ admin ที่พูดถึงคำสั่งแต่งตั้ง) */
function appointmentDocDue_() {
  var x = TERM_PLAN.filter(function (t) { return t.roles.indexOf('admin') >= 0 && /คำสั่งแต่งตั้ง/.test(t.title); })[0];
  return x ? x.date : '';
}

/** โฟลเดอร์เก็บเอกสารคำสั่งของภาค */
function docsFolder_() {
  var name = 'เอกสารคำสั่ง ' + String(cfg_().SEMESTER_LABEL || '').replace('/', '-');
  var root = rootFolder_();
  var it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

var DOC_KINDS_ = {
  memo: 'บันทึกขออนุมัติแต่งตั้งอาจารย์นิเทศ'
};

/** สถานะความพร้อมก่อนออกเอกสาร (admin) */
function api_docsStatus(session) {
  return safe_(function () {
    requireUser_(session, ['admin']);
    var d = appointmentData_(), c = cfg_();
    var g = letterGroups_();
    return {
      ok: true, letters: { filled: g.filled.length, noreply: g.noreply.length, blank: g.blank.length },
      students: d.rows.length, advisors: d.advisors.map(function (a) {
        return { name: a.name, count: d.rows.filter(function (r) { return r.advisor_email === a.email; }).length };
      }), companies: d.companyCount, missingAdvisor: d.missingAdvisor, missingPlacement: d.missingPlacement, notApproved: d.notApproved,
      config: { office: c.DOC_OFFICE, to: c.DOC_TO, via: c.DOC_VIA, deptHead: c.DEPT_HEAD_NAME, head: c.PROGRAM_HEAD_NAME,
        visitFrom: c.VISIT_FROM, visitTo: c.VISIT_TO, visit2By: c.VISIT2_BY }
    };
  });
}

/** ออกเอกสาร kind = 'memo' format = 'docx' | 'pdf' (admin) */
function api_docAppointment(session, kind, format) {
  return safe_(function () {
    var me = requireUser_(session, ['admin']);
    if (!DOC_KINDS_[kind]) return { ok: false, error: 'ชนิดเอกสารไม่ถูกต้อง' };
    if (format !== 'docx' && format !== 'pdf') return { ok: false, error: 'รูปแบบไฟล์ไม่ถูกต้อง' };
    var d = appointmentData_();
    if (!d.rows.length) return { ok: false, error: 'ยังไม่มีนักศึกษาในระบบ' };
    var stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd-HHmm');
    var name = DOC_KINDS_[kind] + ' ' + String(cfg_().SEMESTER_LABEL || '').replace('/', '-') + ' ' + stamp;
    var blocks = appointmentModel_(kind, d);
    var blob = format === 'docx' ? docxBlob_(blocks, name + '.docx') : gdocPdfBlob_(blocks, name);
    try { docsFolder_().createFile(blob); } catch (e) { /* เก็บสำเนาไม่ได้ ยังส่งไฟล์ให้ดาวน์โหลด */ }
    if (kind === 'memo' && !docMemoAt_()) { try { PropertiesService.getScriptProperties().setProperty(docMemoKey_(), nowIso_()); } catch (e) { } }
    audit_(me.email, 'doc_' + kind + '_' + format, '', d.rows.length + ' students');
    return { ok: true, name: blob.getName(), mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
  });
}
