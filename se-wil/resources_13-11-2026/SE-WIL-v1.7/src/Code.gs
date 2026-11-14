/**
 * Code.gs — จุดเข้าเว็บแอป
 *
 * ?page=auth&t=...  ลิงก์เข้าระบบจากอีเมล (นักศึกษา อาจารย์ ผู้ดูแล)
 * ?page=sv&k=...    ลิงก์เฉพาะคนของผู้นิเทศงาน
 * (ไม่มีพารามิเตอร์)  หน้าเข้าระบบ หรือหน้าหลักถ้าเคยเข้าระบบในเครื่องนี้แล้ว
 *
 * หมายเหตุความปลอดภัย: ฟังก์ชันระดับบนสุดที่ไม่ลงท้ายด้วย _ ถูกเรียกจากเบราว์เซอร์ได้
 * ทุกฟังก์ชัน api_* จึงตรวจ session หรือลิงก์ของผู้นิเทศงานก่อนเสมอ
 */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var c = cfg_();
  var boot = {
    page: String(p.page || '').slice(0, 10),
    t: String(p.t || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 100),
    k: String(p.k || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 100),
    programShort: c.PROGRAM_SHORT || '',
    semester: c.SEMESTER_LABEL || '',
    portal: portalUrl_(''),
    privacy: portalUrl_('help/privacy.html'),
    // หน้าเข้าระบบเป็นหน้าสาธารณะ: แสดงเฉพาะชื่อและอีเมลงานของผู้ประสานงาน ไม่แสดงเบอร์โทร
    coordinator: (function () { var co = coordinator_(); return co ? co.name + (co.email ? ' (' + co.email + ')' : '') : ''; })(),
    placementDue: thDateLong_(c.PLACEMENT_DUE),
    agreementDue: thDateLong_(c.AGREEMENT_DUE)
  };
  var t = HtmlService.createTemplateFromFile('Index');
  t.bootJson = JSON.stringify(boot).replace(/</g, '\\u003c');
  var out = t.evaluate()
    .setTitle('SE-WIL ระบบฝึกภาค ' + boot.semester)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  if (boot.portal) {
    try { out.setFaviconUrl(boot.portal + 'assets/img/favicon.png'); } catch (e) { /* ไม่มีไอคอนก็ใช้งานได้ */ }
  }
  return out;
}

/** ใช้ใน template: <?!= include_('Styles') ?> */
function include_(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
