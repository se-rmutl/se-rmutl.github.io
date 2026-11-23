/**
 * ENGSE300 · สร้าง Google Form แบบทดสอบ A1 จากคลังข้อสอบบนเว็บรายวิชา
 *
 * ข้อสอบมาจาก https://se-rmutl.github.io/engse300/data.js (quizA1) ชุดเดียวกับหน้าแบบฝึก
 * แก้ข้อสอบที่ data.js แล้วรันสคริปต์นี้ใหม่เพื่อสร้างฟอร์มรอบใหม่
 *
 * วิธีใช้ (ครั้งเดียว ใช้บัญชีที่จะเป็นเจ้าของฟอร์ม):
 *   1. เปิด https://script.google.com > New project แล้ววางไฟล์นี้ทั้งไฟล์
 *   2. เลือกฟังก์ชัน createA1Quiz แล้วกด Run และอนุญาตสิทธิ์ Forms, Sheets, External requests
 *   3. ดู Execution log: ได้ลิงก์แก้ไขฟอร์ม ลิงก์ให้นักศึกษา และชีตคำตอบ
 *   4. นำลิงก์ให้นักศึกษาไปใส่ quizA1.formUrl ใน data.js เพื่อให้ปุ่มบนหน้าแบบฝึกชี้ไปที่ฟอร์มจริง
 *
 * ฟอร์มที่ได้: โหมดแบบทดสอบ ข้อละ 1 คะแนน ทุกข้อบังคับตอบ เก็บอีเมล ส่งซ้ำได้ (ทำซ้ำจนผ่าน)
 * ให้คะแนนและคำอธิบายหลังส่ง (ค่าเริ่มต้นของ Google Forms: แสดงคะแนนทันทีหลังส่ง)
 * ตัวเลือกที่ควรเปิดเองในหน้าตั้งค่าฟอร์ม: Shuffle option order ของแต่ละข้อ (Apps Script ตั้งค่านี้ไม่ได้)
 */

var DATA_URL = 'https://se-rmutl.github.io/engse300/data.js';

function createA1Quiz() {
  var Q = loadQuiz_();

  var form = FormApp.create(Q.formTitle);
  form.setDescription(Q.formDescription);
  form.setIsQuiz(true);
  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('ส่งคำตอบแล้ว ดูคะแนนได้จากปุ่ม "ดูคะแนน" ถ้ายังไม่ถึง ' + Q.passScore + ' คะแนน อ่านคำอธิบายแล้วทำใหม่ได้');

  form.addSectionHeaderItem().setTitle('ข้อมูลนักศึกษา');
  form.addTextItem().setTitle('รหัสนักศึกษา').setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('กรอกรหัสนักศึกษาเป็นตัวเลข มีขีดได้')
      .requireTextMatchesPattern('^[0-9-]{8,15}$').build());
  form.addTextItem().setTitle('ชื่อ-นามสกุล').setRequired(true);
  form.addMultipleChoiceItem().setTitle('กลุ่ม').setRequired(true)
    .setChoiceValues(['ภาคปกติ (ม.6 หรือ ปวช.)', 'เทียบโอน (ปวส.)']);

  form.addPageBreakItem().setTitle('แบบทดสอบ ' + Q.questions.length + ' ข้อ')
    .setHelpText('ผ่านเมื่อได้อย่างน้อย ' + Q.passScore + ' คะแนน');

  Q.questions.forEach(function (q, n) {
    var item = form.addMultipleChoiceItem();
    item.setTitle((n + 1) + '. ' + q.q)
      .setHelpText(q.topic)
      .setPoints(1)
      .setRequired(true)
      .setChoices(q.choices.map(function (c, k) { return item.createChoice(c, k === q.answer); }))
      .setFeedbackForCorrect(FormApp.createFeedback().setText(q.explain).build())
      .setFeedbackForIncorrect(FormApp.createFeedback().setText(q.explain).build());
  });

  var sheet = SpreadsheetApp.create(Q.formTitle + ' (คำตอบ)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('แก้ไขฟอร์ม: ' + form.getEditUrl());
  Logger.log('ลิงก์ให้นักศึกษา (ใส่ใน data.js → quizA1.formUrl): ' + form.getPublishedUrl());
  Logger.log('ชีตคำตอบ: ' + sheet.getUrl());
}

/** อ่าน quizA1 จาก data.js บนเว็บรายวิชา */
function loadQuiz_() {
  var src = UrlFetchApp.fetch(DATA_URL + '?t=' + Date.now()).getContentText('UTF-8');
  var sandbox = {};
  new Function('window', src)(sandbox);
  var Q = sandbox.ENGSE300 && sandbox.ENGSE300.quizA1;
  if (!Q || !Q.questions || !Q.questions.length) throw new Error('ไม่พบ quizA1 ใน ' + DATA_URL);
  Q.questions.forEach(function (q, n) {
    if (!q.choices || q.answer < 0 || q.answer >= q.choices.length) throw new Error('ข้อที่ ' + (n + 1) + ' เฉลยไม่ถูกต้อง');
  });
  return Q;
}
