/**
 * Mail.gs — อีเมลทั้งหมดของระบบ (ใช้โควตา MailApp ของบัญชีที่ Deploy)
 */

function esc_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mailLayout_(title, inner) {
  var c = cfg_();
  return '<div style="font-family:Sarabun,Tahoma,sans-serif;font-size:15px;line-height:1.6;color:#1a2330;max-width:620px">' +
    '<div style="border-top:4px solid #13294b;border-bottom:2px solid #d9a032;padding:14px 0 8px;margin-bottom:6px"><b style="font-size:17px;color:#13294b">' + esc_(title) + '</b></div>' +
    inner +
    '<p style="color:#576377;font-size:13px;margin-top:24px;border-top:1px solid #d8e0ea;padding-top:10px">' +
    esc_(c.PROGRAM_SHORT) + ' ระบบ SE-WIL ภาคการศึกษาที่ ' + esc_(c.SEMESTER_LABEL) +
    (portalUrl_('') ? '<br>คู่มือ ปฏิทิน และคำถามพบบ่อย: <a href="' + esc_(portalUrl_('')) + '" style="color:#2459a6">' + esc_(portalUrl_('').replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a>' +
      ' การคุ้มครองข้อมูลส่วนบุคคล: <a href="' + esc_(portalUrl_('help/privacy.html')) + '" style="color:#2459a6">อ่านประกาศ</a>' : '') +
    '<br>อีเมลนี้ส่งโดยระบบอัตโนมัติ หากมีคำถามกรุณาตอบกลับอีเมลนี้' +
    (function () {
      var co = coordinator_();
      return co ? ' หรือติดต่อผู้ประสานงาน SE-WIL ' + esc_(co.name) + (co.email ? ' <a href="mailto:' + esc_(co.email) + '" style="color:#2459a6">' + esc_(co.email) + '</a>' : '') : '';
    })() + '</p></div>';
}

function button_(url, label) {
  return '<p style="margin:18px 0"><a href="' + esc_(url) + '" style="background:#2459a6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block">' +
    esc_(label) + '</a></p><p style="font-size:12px;color:#576377">ถ้ากดปุ่มไม่ได้ ให้คัดลอกลิงก์นี้ไปเปิด: ' + esc_(url) + '</p>';
}

function sendMail_(to, subject, html, attachments) {
  if (!to) return false;
  var quota = MailApp.getRemainingDailyQuota();
  if (quota < 1) {
    audit_('system', 'mail_quota_exhausted', to, subject);
    throw userError_('โควตาอีเมลของวันนี้หมดแล้ว กรุณาลองใหม่พรุ่งนี้ หรือติดต่อผู้ประสานงาน SE-WIL');
  }
  var c = cfg_();
  var opt = { to: to, subject: '[SE-WIL] ' + subject, htmlBody: html, name: 'ระบบ SE-WIL ' + (c.PROGRAM_SHORT || '') };
  var replyTo = c.PROGRAM_EMAIL || c.COORDINATOR_EMAIL;
  if (replyTo) opt.replyTo = replyTo;
  if (attachments && attachments.length) opt.attachments = attachments;
  MailApp.sendEmail(opt);
  return true;
}

function sendLoginEmail_(user, token, mins) {
  var url = appUrl_() + '?page=auth&t=' + encodeURIComponent(token);
  var html = mailLayout_('ลิงก์เข้าระบบ SE-WIL',
    '<p>เรียน ' + esc_(user.name || user.email) + '</p>' +
    '<p>กดปุ่มด้านล่างเพื่อเข้าระบบ ลิงก์ใช้ได้ครั้งเดียวภายใน ' + mins + ' นาที หลังเข้าระบบแล้วเครื่องนี้จะจำการเข้าระบบไว้ ' + (cfgNum_('SESSION_DAYS') || 14) + ' วัน</p>' +
    button_(url, 'เข้าระบบ SE-WIL') +
    '<p style="font-size:13px;color:#5a6472">ถ้าท่านไม่ได้ขอลิงก์นี้ ไม่ต้องทำอะไร</p>');
  sendMail_(user.email, 'ลิงก์เข้าระบบ (ใช้ได้ ' + mins + ' นาที)', html);
}

function svUrl_(sv) { return appUrl_() + '?page=sv&k=' + encodeURIComponent(sv.token); }

function sendAgreementEmails_(p, student, sv, blob, isResend) {
  var c = cfg_();
  var att = blob ? [blob] : [];
  var svHtml = mailLayout_('ขอความร่วมมือยืนยันข้อตกลงการฝึก ' + (p.agreement_no || ''),
    '<p>เรียน คุณ' + esc_(p.supervisor_name) + '</p>' +
    '<p>' + esc_(c.PROGRAM_SHORT) + ' ขอขอบพระคุณที่รับ <b>' + esc_(p.student_name) + '</b> (รหัส ' + esc_(p.student_id) + ') ' +
    'ฝึกในภาคการศึกษาที่ ' + esc_(c.SEMESTER_LABEL) + ' ช่วง ' + esc_(c.PERIOD_TEXT) + ' ในรายวิชา ENGSE305 การฝึกเฉพาะตำแหน่ง และ ENGSE304 ปัญหาพิเศษจากสถานประกอบการ</p>' +
    '<p>ข้อตกลง SE-WIL01 แนบมากับอีเมลนี้ กรุณาตรวจรายละเอียด แล้วยืนยันทางออนไลน์ที่ลิงก์ด้านล่าง ลิงก์เดียวกันนี้ใช้รับรองบันทึกการปฏิบัติงานรายสัปดาห์ของนักศึกษาตลอดภาคการศึกษา กรุณาเก็บอีเมลนี้ไว้</p>' +
    (c.AGREEMENT_DUE && !isResend ? '<p><b>กรุณายืนยันภายในวันที่ ' + esc_(thDateLong_(c.AGREEMENT_DUE)) + '</b></p>' : '') +
    contactsHtml_(p, student) +
    button_(svUrl_(sv), 'ตรวจและยืนยันข้อตกลง') +
    '<p>ทุกวัน' + dayTh_(c.DIGEST_DAY) + ' ระบบจะส่งสรุปบันทึกของนักศึกษาให้ท่านรับรองทางอีเมล</p>' +
    (portalUrl_('') ? '<p>คู่มือผู้นิเทศงานและที่ปรึกษาร่วม (บทบาท กำหนดการ และแบบประเมิน): <a href="' + esc_(portalUrl_('company/supervisor.html')) + '">' + esc_(portalUrl_('company/supervisor.html')) + '</a></p>' : '') +
    '<p style="font-size:13px;color:#576377">ข้อมูลของท่าน: นักศึกษาให้ชื่อ ตำแหน่ง อีเมล และเบอร์โทร (ถ้ามี) ของท่านแก่หลักสูตรเพื่อใช้ติดต่อเรื่องการฝึกเท่านั้น ' +
    'ไม่เผยแพร่ต่อบุคคลอื่น หากต้องการแก้ไขหรือลบเบอร์โทร หรือต้องการให้ติดต่อทางอีเมลอย่างเดียว ตอบกลับอีเมลนี้ได้' +
    (portalUrl_('') ? ' <a href="' + esc_(portalUrl_('help/privacy.html')) + '">อ่านประกาศการคุ้มครองข้อมูลส่วนบุคคล</a>' : '') + '</p>');
  sendMail_(p.supervisor_email, (isResend ? '(ส่งซ้ำ) ' : '') + 'ยืนยันข้อตกลงการฝึกของ ' + p.student_name, svHtml, att);

  if (!isResend && student) {
    var stHtml = mailLayout_('ข้อตกลง SE-WIL01 ของคุณถูกส่งให้สถานประกอบการแล้ว',
      '<p>เรียน ' + esc_(student.name) + '</p>' +
      '<p>หลักสูตรอนุมัติข้อมูลที่ฝึกของคุณแล้ว และส่งข้อตกลงเลขที่ ' + esc_(p.agreement_no) + ' ให้ผู้นิเทศงาน (' + esc_(p.supervisor_name) + ') ยืนยัน สำเนาข้อตกลงแนบมากับอีเมลนี้</p>' +
      '<p>ตั้งแต่วันนี้คุณบันทึก logbook ในระบบได้แล้ว อย่าลืมแท็กชั่วโมงเป็น 305 หรือ 304 ทุกรายการ</p>' +
      button_(appUrl_(), 'เปิดระบบ SE-WIL'));
    sendMail_(student.email, 'ข้อตกลง ' + p.agreement_no + ' ถูกส่งให้สถานประกอบการแล้ว', stHtml, att);
  }
}

function sendPlacementReturnedEmail_(p, comment) {
  var html = mailLayout_('ข้อมูลที่ฝึกถูกส่งกลับให้แก้ไข',
    '<p>เรียน ' + esc_(p.student_name) + '</p><p>อาจารย์ส่งข้อมูลที่ฝึกกลับให้แก้ไข ด้วยเหตุผลต่อไปนี้</p>' +
    '<blockquote style="border-left:3px solid #8e1f16;margin:0;padding:6px 12px;background:#f8ecea">' + esc_(comment) + '</blockquote>' +
    button_(appUrl_(), 'แก้ไขข้อมูลที่ฝึก'));
  sendMail_(p.student_email, 'ข้อมูลที่ฝึกถูกส่งกลับให้แก้ไข', html);
}

/** ตารางผู้ติดต่อในอีเมลถึงสถานประกอบการ */
function contactsHtml_(p, student) {
  var rows = [];
  function row(role, c) {
    if (!c || !(c.name || c.email || c.phone)) return;
    rows.push('<tr><td style="padding:4px 10px 4px 0;color:#576377;white-space:nowrap">' + esc_(role) + '</td><td style="padding:4px 0">' +
      esc_(c.name || '') + (c.phone ? ' โทร ' + esc_(c.phone) : '') + (c.email ? ' <a href="mailto:' + esc_(c.email) + '">' + esc_(c.email) + '</a>' : '') + '</td></tr>');
  }
  var co = coordinator_(), adv = student ? contactOf_(student.advisor_email) : null;
  var same = co && adv && co.email && co.email === adv.email;
  row(same ? 'ผู้ประสานงานหลักสูตร (ติดต่อหลัก) และอาจารย์นิเทศ' : 'ผู้ประสานงานหลักสูตร (ติดต่อหลัก)', co);
  row('นักศึกษา', { name: p.student_name || (student && student.name), email: p.student_email, phone: p.student_phone }); // เบอร์เฉพาะที่นักศึกษากรอกเอง
  if (!same) row('อาจารย์นิเทศ', adv);
  if (!rows.length) return '';
  return '<p style="margin-bottom:4px"><b>ผู้ติดต่อ</b></p><table style="border-collapse:collapse;font-size:14px">' + rows.join('') + '</table>';
}

function dayTh_(d) {
  return ({ MONDAY: 'จันทร์', TUESDAY: 'อังคาร', WEDNESDAY: 'พุธ', THURSDAY: 'พฤหัสบดี', FRIDAY: 'ศุกร์', SATURDAY: 'เสาร์', SUNDAY: 'อาทิตย์' })[String(d || '').toUpperCase()] || 'ศุกร์';
}

/** สรุปรายสัปดาห์ถึงผู้นิเทศงานหนึ่งคน items = [{student_name, student_id, hours_305, hours_304, count, created_at}] */
function sendDigestEmail_(sv, items) {
  var rows = items.map(function (it) {
    return '<tr><td style="padding:6px 8px;border-bottom:1px solid #d6dbd3">' + esc_(it.student_name) + '<br><span style="color:#5a6472;font-size:13px">' + esc_(it.student_id) + '</span></td>' +
      '<td style="padding:6px 8px;border-bottom:1px solid #d6dbd3;text-align:right">' + it.count + '</td>' +
      '<td style="padding:6px 8px;border-bottom:1px solid #d6dbd3;text-align:right">' + it.hours_305 + '</td>' +
      '<td style="padding:6px 8px;border-bottom:1px solid #d6dbd3;text-align:right">' + it.hours_304 + '</td></tr>';
  }).join('');
  var html = mailLayout_('บันทึกการปฏิบัติงานที่รอท่านรับรอง',
    '<p>เรียน คุณ' + esc_(sv.name || '') + '</p><p>มีบันทึกการปฏิบัติงานของนักศึกษาที่รอท่านรับรองดังนี้</p>' +
    '<table style="border-collapse:collapse;font-size:14px"><tr style="color:#5a6472"><th style="text-align:left;padding:6px 8px">นักศึกษา</th><th style="padding:6px 8px">รายการ</th><th style="padding:6px 8px">ชม. 305</th><th style="padding:6px 8px">ชม. 304</th></tr>' + rows + '</table>' +
    '<p>ชั่วโมงจะนับเป็นชั่วโมงฝึกเมื่อท่านรับรองแล้วเท่านั้น หากรายการใดไม่ถูกต้อง ท่านส่งกลับให้นักศึกษาแก้ไขได้</p>' +
    button_(svUrl_(sv), 'ตรวจและรับรองบันทึก') +
    (portalUrl_('') ? '<p style="font-size:13px">สิ่งที่ควรตรวจในแต่ละรายการ: <a href="' + esc_(portalUrl_('company/supervisor.html')) + '">คู่มือผู้นิเทศงาน</a></p>' : ''));
  sendMail_(sv.email, 'บันทึกรอรับรอง ' + items.length + ' คน', html);
}

function sendEntriesReturnedEmail_(studentEmail, studentName, svName, count, comment) {
  var html = mailLayout_('ผู้นิเทศงานส่งบันทึกกลับให้แก้ไข',
    '<p>เรียน ' + esc_(studentName) + '</p><p>คุณ' + esc_(svName) + ' ส่งบันทึก ' + count + ' รายการกลับให้แก้ไข</p>' +
    (comment ? '<blockquote style="border-left:3px solid #c98a12;margin:0;padding:6px 12px;background:#fbf3e2">' + esc_(comment) + '</blockquote>' : '') +
    '<p>แก้ไขรายการที่มีสถานะ "ส่งกลับ" แล้วระบบจะส่งให้รับรองอีกครั้งในรอบถัดไป</p>' + button_(appUrl_(), 'แก้ไข logbook'));
  sendMail_(studentEmail, 'บันทึกถูกส่งกลับให้แก้ไข ' + count + ' รายการ', html);
}
