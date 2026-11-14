/**
 * Agreement.gs — แม่แบบและการสร้างข้อตกลง SE-WIL01 (Google Docs -> PDF)
 */

/** โฟลเดอร์ของรายวิชา: ROOT_FOLDER_ID หรือโฟลเดอร์ที่เก็บชีตฐานข้อมูล */
function rootFolder_() {
  var id = cfg_().ROOT_FOLDER_ID;
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* หาใหม่ */ }
  }
  try {
    var sid = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    var parents = DriveApp.getFileById(sid).getParents();
    if (parents.hasNext()) {
      var f = parents.next();
      setConfig_('ROOT_FOLDER_ID', f.getId());
      return f;
    }
  } catch (e) { /* ใช้ My Drive */ }
  return DriveApp.getRootFolder();
}

/** โฟลเดอร์ย่อยเก็บข้อตกลงรายคน (Google Docs และ PDF) */
function outputFolder_() {
  var id = cfg_().OUTPUT_FOLDER_ID;
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* สร้างใหม่ */ }
  }
  var folder = rootFolder_().createFolder('ข้อตกลง SE-WIL01 ' + String(cfg_().SEMESTER_LABEL || '').replace('/', '-'));
  setConfig_('OUTPUT_FOLDER_ID', folder.getId());
  return folder;
}

function templateDoc_() {
  var id = cfg_().TEMPLATE_DOC_ID;
  if (id) {
    try { DriveApp.getFileById(id); return id; } catch (e) { /* สร้างใหม่ */ }
  }
  return buildTemplate_();
}

/** สร้างแม่แบบ SE-WIL01 ใน Google Docs ผู้ดูแลแก้ข้อความได้ แต่ต้องคง {{ช่อง}} ไว้ */
function buildTemplate_() {
  var doc = DocumentApp.create('SE-WIL01 แม่แบบข้อตกลง (ห้ามลบ ช่อง {{...}} จะถูกแทนค่า)');
  var body = doc.getBody();
  body.setMarginTop(54).setMarginBottom(54).setMarginLeft(72).setMarginRight(54);
  function h(text) {
    var p = body.appendParagraph(text);
    p.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    return p;
  }
  function para(text) { return body.appendParagraph(text); }

  var t = body.getParagraphs()[0];
  t.setText('ข้อตกลงการฝึกภาคการศึกษาที่ {{SEMESTER}} (SE-WIL01)');
  t.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  para('รายวิชา ENGSE305 การฝึกเฉพาะตำแหน่ง และ ENGSE304 ปัญหาพิเศษจากสถานประกอบการ').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  para('{{PROGRAM_NAME}}').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  para('เลขที่ข้อตกลง {{AGREEMENT_NO}}    ระยะเวลาฝึก {{PERIOD}}').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  h('1. คู่ข้อตกลง');
  body.appendTable([
    ['นักศึกษา', '{{STUDENT_NAME}} รหัสนักศึกษา {{STUDENT_ID}} อีเมล {{STUDENT_EMAIL}} โทร {{STUDENT_PHONE}}'],
    ['อาจารย์นิเทศ/ที่ปรึกษาโครงงาน', '{{ADVISOR}}'],
    ['ผู้ประสานงานหลักสูตร (ติดต่อหลัก)', '{{COORDINATOR}}'],
    ['หัวหน้าหลักสูตร', '{{PROGRAM_HEAD}}'],
    ['สถานประกอบการ', '{{COMPANY_NAME}} ({{COMPANY_TYPE}}) โทร {{COMPANY_PHONE}} เว็บไซต์ {{COMPANY_WEBSITE}}'],
    ['ที่อยู่', '{{COMPANY_ADDRESS}}'],
    ['แผนที่', '{{COMPANY_MAP}}'],
    ['ผู้นิเทศงาน (ENGSE305)', '{{SUPERVISOR_NAME}} ตำแหน่ง {{SUPERVISOR_POSITION}} อีเมล {{SUPERVISOR_EMAIL}} โทร {{SUPERVISOR_PHONE}}'],
    ['ที่ปรึกษาร่วม (ENGSE304)', '{{COADVISOR}}']
  ]);

  h('2. ENGSE305 การฝึกเฉพาะตำแหน่ง');
  body.appendTable([
    ['ตำแหน่งงาน', '{{POSITION_TITLE}}'],
    ['ลักษณะงาน', '{{JOB_DESCRIPTION}}'],
    ['ตารางเวลา', '{{SCHEDULE_305}}'],
    ['ชั่วโมงฝึกขั้นต่ำ', '{{TARGET_305}} ชั่วโมงตลอดภาคการศึกษา']
  ]);

  h('3. ENGSE304 ปัญหาพิเศษจากสถานประกอบการ');
  body.appendTable([
    ['โจทย์ที่ 1', '{{PROBLEM1_TITLE}}: {{PROBLEM1_DETAIL}}'],
    ['โจทย์ที่ 2 (ถ้ามี)', '{{PROBLEM2}}'],
    ['ตารางเวลา', '{{SCHEDULE_304}}'],
    ['ชั่วโมงทำโครงงานขั้นต่ำ', '{{TARGET_304}} ชั่วโมง (รวมเวลาศึกษาด้วยตนเองที่บันทึกไว้)']
  ]);

  h('4. รูปแบบการทำงาน');
  para('{{WORK_MODE}} วันที่ทำงานทางไกลนับเป็นชั่วโมงฝึกเมื่อผู้นิเทศงานรับรองบันทึกการปฏิบัติงานรายสัปดาห์ และหลักสูตรจะนิเทศ ณ สถานประกอบการหรือผ่านวิดีโอแบบเวลาจริงอย่างน้อย 1 ครั้ง');

  h('5. ข้อตกลงทั่วไป');
  [
    '5.1 นักศึกษาปฏิบัติตามระเบียบและข้อบังคับของสถานประกอบการตลอดระยะเวลาการฝึก การลาต้องได้รับอนุมัติจากผู้นิเทศงานและอาจารย์ และวันลาไม่นับเป็นชั่วโมงฝึก',
    '5.2 นักศึกษาบันทึกการปฏิบัติงานรายวันในระบบออนไลน์ของหลักสูตร โดยแยกชั่วโมงของ ENGSE305 และ ENGSE304 ผู้นิเทศงานรับรองบันทึกรายสัปดาห์ผ่านลิงก์ที่ระบบส่งทางอีเมล และประเมินผลการปฏิบัติงานกลางภาคและปลายภาค',
    '5.3 ทรัพย์สินทางปัญญา: {{IP_OWNER}} ทั้งนี้นักศึกษามีสิทธิ์ได้รับการระบุชื่อเป็นผู้พัฒนา และหลักสูตรมีสิทธิ์เข้าถึงหลักฐานเท่าที่จำเป็นต่อการประเมินผล โดยอาจเป็นการสาธิตแบบปิดหรือผลงานที่ปิดข้อมูลลับแล้ว',
    '5.4 การรักษาความลับและข้อมูลส่วนบุคคล: นักศึกษาจะไม่นำข้อมูลลับหรือข้อมูลส่วนบุคคลของลูกค้าออกนอกสถานประกอบการ รายงานและการสาธิตใช้ข้อมูลทดสอบสังเคราะห์ และสถานประกอบการตรวจเนื้อหาลับก่อนอนุญาตให้เผยแพร่รายงาน',
    '5.5 ค่าตอบแทนหรือสวัสดิการ: {{COMPENSATION}}',
    '5.6 สถานประกอบการแนะนำแนวปฏิบัติด้านความปลอดภัยในการทำงานแก่นักศึกษาตั้งแต่สัปดาห์แรก',
    '5.7 หากฝ่ายใดประสงค์จะยุติหรือเปลี่ยนแปลงการฝึก ให้แจ้งหลักสูตรล่วงหน้าเพื่อดำเนินการตามแบบคำร้อง SE-WIL02'
  ].forEach(para);

  h('6. การยืนยัน');
  para('สถานประกอบการยืนยันข้อตกลงนี้ได้ทางออนไลน์ผ่านลิงก์ในอีเมล หรือลงนามในเอกสารฉบับนี้');
  body.appendTable([
    ['ลงชื่อ ....................................................\nผู้แทนสถานประกอบการ\nวันที่ ........................', 'ลงชื่อ ....................................................\nนักศึกษา\nวันที่ ........................', 'ลงชื่อ ....................................................\nหัวหน้าหลักสูตร\nวันที่ ........................']
  ]);
  para('สร้างโดยระบบ SE-WIL เมื่อ {{GENERATED_AT}}').setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  body.editAsText().setFontFamily('Sarabun').setFontSize(12);
  body.getParagraphs()[0].editAsText().setFontSize(16).setBold(true);
  doc.saveAndClose();

  var file = DriveApp.getFileById(doc.getId());
  try { file.moveTo(rootFolder_()); } catch (e) { rootFolder_().addFile(file); }
  setConfig_('TEMPLATE_DOC_ID', doc.getId());
  return doc.getId();
}

/** แทนค่า {{KEY}} แบบตัวอักษรตรงตัว (ไม่ตีความ regex ในค่า) */
function replacePlaceholder_(body, key, value) {
  var pattern = '\\{\\{' + key + '\\}\\}';
  var text = String(value === undefined || value === null || value === '' ? '-' : value).replace(/\r?\n+/g, ' / ');
  var r, guard = 0;
  while ((r = body.findText(pattern)) !== null && guard++ < 50) {
    var el = r.getElement().asText();
    var s = r.getStartOffset(), e = r.getEndOffsetInclusive();
    el.deleteText(s, e);
    el.insertText(s, text);
  }
}

function agreementValues_(p, student, advisor) {
  var c = cfg_();
  var co = p.coadvisor_same === 'yes'
    ? 'บุคคลเดียวกับผู้นิเทศงาน'
    : (p.coadvisor_name + ' ตำแหน่ง ' + p.coadvisor_position + ' อีเมล ' + p.coadvisor_email + (p.coadvisor_phone ? ' โทร ' + p.coadvisor_phone : ''));
  return {
    SEMESTER: c.SEMESTER_LABEL, PROGRAM_NAME: c.PROGRAM_NAME, AGREEMENT_NO: p.agreement_no, PERIOD: c.PERIOD_TEXT,
    STUDENT_NAME: p.student_name || (student && student.name), STUDENT_ID: p.student_id || (student && student.student_id),
    STUDENT_EMAIL: p.student_email,
    STUDENT_PHONE: p.student_phone || '-', // เฉพาะเบอร์ที่นักศึกษากรอกเอง
    ADVISOR: advisor ? (advisor.name + ' อีเมล ' + advisor.email + (advisor.phone ? ' โทร ' + advisor.phone : '')) : 'หลักสูตรจะแจ้งให้ทราบ',
    COORDINATOR: (function () { var co = coordinator_(); return co ? co.name + (co.email ? ' อีเมล ' + co.email : '') + (co.phone ? ' โทร ' + co.phone : '') : '-'; })(),
    // หัวหน้าหลักสูตร: ชื่อและอีเมลเท่านั้น เบอร์โทรแสดงเฉพาะในระบบ (ข้อตกลงถูกส่งต่อและเก็บนาน)
    PROGRAM_HEAD: (function () { var hd = programHead_(); return hd ? hd.name + (hd.email ? ' อีเมล ' + hd.email : '') : '-'; })(),
    COMPANY_NAME: p.company_name, COMPANY_TYPE: p.company_type, COMPANY_ADDRESS: p.company_address + ' จังหวัด' + p.province,
    COMPANY_PHONE: p.company_phone || '-', COMPANY_WEBSITE: p.company_website || '-', COMPANY_MAP: mapHref_(p.company_map_url) || '-',
    SUPERVISOR_NAME: p.supervisor_name, SUPERVISOR_POSITION: p.supervisor_position,
    SUPERVISOR_EMAIL: p.supervisor_email, SUPERVISOR_PHONE: p.supervisor_phone, COADVISOR: co,
    POSITION_TITLE: p.position_title, JOB_DESCRIPTION: p.job_description, SCHEDULE_305: p.schedule_305,
    TARGET_305: c.TARGET_305, PROBLEM1_TITLE: p.problem1_title, PROBLEM1_DETAIL: p.problem1_detail,
    PROBLEM2: p.problem2_title ? (p.problem2_title + (p.problem2_detail ? ': ' + p.problem2_detail : '')) : '-',
    SCHEDULE_304: p.schedule_304, TARGET_304: c.TARGET_304,
    WORK_MODE: WORK_MODES[p.work_mode] || p.work_mode, IP_OWNER: IP_OWNERS[p.ip_owner] || p.ip_owner,
    COMPENSATION: p.compensation || 'ไม่มี',
    GENERATED_AT: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm')
  };
}

/** สร้างข้อตกลงของนักศึกษาหนึ่งคน คืน {docId, pdfId, pdfUrl, blob} */
function generateAgreement_(p, student, advisor) {
  var folder = outputFolder_();
  var templateId = templateDoc_();
  var name = (p.agreement_no || 'SE-WIL01') + ' ' + (p.student_id || '') + ' ' + (p.student_name || '');
  var copy = DriveApp.getFileById(templateId).makeCopy(name, folder);
  var doc = DocumentApp.openById(copy.getId());
  var body = doc.getBody();
  var values = agreementValues_(p, student, advisor);
  Object.keys(values).forEach(function (k) { replacePlaceholder_(body, k, values[k]); });
  doc.setName(name);
  doc.saveAndClose();
  var blob = DriveApp.getFileById(copy.getId()).getAs('application/pdf').setName(name.replace(/[\/\\]/g, '-') + '.pdf');
  var pdf = folder.createFile(blob);
  return { docId: copy.getId(), pdfId: pdf.getId(), pdfUrl: pdf.getUrl(), blob: blob };
}
