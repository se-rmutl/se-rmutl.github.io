/**
 * Files.gs — ไฟล์แนบ: CV ของนักศึกษา (PDF) รูปสถานประกอบการ (JPG PNG WebP)
 * และแบบตอบรับ SE-WIL00 ที่สถานประกอบการลงนามแล้ว (PDF หรือรูป, v1.7)
 *
 * ไฟล์เก็บในโฟลเดอร์ย่อยของโฟลเดอร์รายวิชาและไม่แชร์ให้ใคร
 * ผู้มีสิทธิ์ดาวน์โหลดผ่านระบบเท่านั้น:
 *   CV        -> นักศึกษาเจ้าของ อาจารย์นิเทศ ผู้ดูแล ผู้นิเทศงานและที่ปรึกษาร่วมของนักศึกษาคนนั้น
 *   รูป และแบบตอบรับ -> นักศึกษาเจ้าของ อาจารย์นิเทศ ผู้ดูแล
 */

var UPLOAD_KINDS_ = {
  cv: {
    idField: 'cv_file_id', nameField: 'cv_file_name', atField: 'cv_uploaded_at',
    mimes: { 'application/pdf': 'pdf' }, folderKey: 'CV_FOLDER_ID', folderName: 'CV นักศึกษา', label: 'CV'
  },
  photo: {
    idField: 'company_photo_id', nameField: '', atField: '',
    mimes: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }, folderKey: 'PHOTO_FOLDER_ID', folderName: 'รูปสถานประกอบการ', label: 'รูปสถานประกอบการ'
  },
  reply: {
    idField: 'reply_file_id', nameField: 'reply_file_name', atField: 'reply_uploaded_at',
    mimes: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }, folderKey: 'REPLY_FOLDER_ID', folderName: 'แบบตอบรับที่ลงนาม', label: 'แบบตอบรับที่ลงนาม'
  }
};
var UPLOAD_MIME_ERROR_ = { cv: 'CV ต้องเป็นไฟล์ PDF', photo: 'รูปต้องเป็นไฟล์ JPG PNG หรือ WebP', reply: 'แบบตอบรับต้องเป็นไฟล์ PDF หรือรูป JPG PNG WebP' };

/** เพิ่มคอลัมน์ที่ SCHEMA มีแต่ชีตยังไม่มี (กรณีอัปเดตโค้ดแล้วยังไม่ได้รันตั้งค่าระบบซ้ำ) */
function ensureColumns_(name) {
  var sh = sheet_(name), cur = header_(sh);
  var missing = (SCHEMA[name] || []).filter(function (h) { return cur.indexOf(h) < 0; });
  if (missing.length) sh.getRange(1, cur.length + 1, 1, missing.length).setValues([missing]);
}

function uploadFolder_(spec) {
  var id = cfg_()[spec.folderKey];
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* สร้างใหม่ */ }
  }
  var f = rootFolder_().createFolder(spec.folderName + ' ' + String(cfg_().SEMESTER_LABEL || '').replace('/', '-'));
  setConfig_(spec.folderKey, f.getId());
  return f;
}

/** ตรวจชนิดไฟล์จากไบต์แรกของไฟล์ ไม่เชื่อนามสกุลที่เบราว์เซอร์ส่งมา */
function sniffMime_(bytes) {
  function b(i) { return (bytes[i] + 256) % 256; }
  var n = bytes ? bytes.length : 0;
  if (n > 4 && b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return 'application/pdf';
  if (n > 3 && b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return 'image/jpeg';
  if (n > 8 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) return 'image/png';
  if (n > 12 && b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'image/webp';
  return '';
}

/** ลบข้อมูลส่วนบุคคลที่ไม่จำเป็นหลังจบภาค: ไฟล์ CV รูปสถานประกอบการ และเบอร์มือถือนักศึกษา
 *  เก็บข้อตกลง SE-WIL01 และ logbook ไว้เป็นหลักฐานการจัดการศึกษา */
function purgePersonalData_() {
  var n = { cv: 0, photo: 0, phone: 0 };
  readAll_('Placements').forEach(function (p) {
    var patch = {};
    if (p.cv_file_id) {
      try { DriveApp.getFileById(p.cv_file_id).setTrashed(true); } catch (e) { /* ไม่มีไฟล์แล้ว */ }
      patch.cv_file_id = ''; patch.cv_file_name = ''; patch.cv_uploaded_at = ''; n.cv++;
    }
    if (p.company_photo_id) {
      try { DriveApp.getFileById(p.company_photo_id).setTrashed(true); } catch (e) { /* ไม่มีไฟล์แล้ว */ }
      patch.company_photo_id = ''; n.photo++;
    }
    if (p.student_phone) { patch.student_phone = ''; n.phone++; }
    if (Object.keys(patch).length) { patch.updated_at = nowIso_(); update_('Placements', p._row, patch); }
  });
  audit_('system', 'purge_personal_data', '', JSON.stringify(n));
  return n;
}

function safeFileName_(s) {
  return String(s || '').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'file';
}

function fileOut_(fileId) {
  var blob = DriveApp.getFileById(fileId).getBlob();
  return { ok: true, name: blob.getName(), mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/** นักศึกษาแนบหรือเปลี่ยนไฟล์ kind = 'cv' | 'photo' | 'reply' ข้อมูลเป็น base64 (รับรูปแบบ data URL ได้) */
function api_placementUpload(session, kind, fileName, base64) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var spec = UPLOAD_KINDS_[kind];
    if (!spec) return { ok: false, error: 'ชนิดไฟล์ไม่ถูกต้อง' };
    var maxMb = cfgNum_('MAX_UPLOAD_MB') || 5;
    base64 = String(base64 || '').replace(/^data:[^,]*,/, '');
    if (!base64) return { ok: false, error: 'ไม่พบไฟล์' };
    if (base64.length * 0.75 > maxMb * 1048576 + 4) return { ok: false, error: 'ไฟล์ใหญ่เกิน ' + maxMb + ' MB' };
    var bytes;
    try { bytes = Utilities.base64Decode(base64); } catch (e) { return { ok: false, error: 'อ่านไฟล์ไม่ได้' }; }
    var mime = sniffMime_(bytes);
    if (!spec.mimes[mime]) return { ok: false, error: UPLOAD_MIME_ERROR_[kind] };
    return withLock_(function () {
      var p = placementOf_(u.email);
      if (!p) return { ok: false, error: 'กรุณากด "บันทึกร่าง" ข้อมูลที่ฝึกก่อนแนบไฟล์' };
      var sid = String(p.student_id || u.student_id || 'student');
      var base = kind === 'cv' ? sid + '_CV' : (kind === 'reply' ? sid + '_แบบตอบรับ_' + p.company_name : p.placement_id + '_' + p.company_name);
      if (spec.atField) ensureColumns_('Placements');
      var name = safeFileName_(base) + '.' + spec.mimes[mime];
      var file = uploadFolder_(spec).createFile(Utilities.newBlob(bytes, mime, name));
      var old = p[spec.idField];
      if (old) {
        try { DriveApp.getFileById(old).setTrashed(true); } catch (e) { /* ไฟล์เดิมถูกลบไปแล้ว */ }
      }
      var now = nowIso_();
      var patch = { updated_at: now };
      patch[spec.idField] = file.getId();
      if (spec.nameField) patch[spec.nameField] = safeFileName_(fileName);
      if (spec.atField) patch[spec.atField] = now;
      update_('Placements', p._row, patch);
      audit_(u.email, 'upload_' + kind, p.placement_id, name + ' ' + bytes.length + ' bytes');
      return { ok: true, name: spec.nameField ? patch[spec.nameField] : name };
    });
  });
}

/** นักศึกษาลบไฟล์แนบ */
function api_placementRemoveFile(session, kind) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var spec = UPLOAD_KINDS_[kind];
    if (!spec) return { ok: false, error: 'ชนิดไฟล์ไม่ถูกต้อง' };
    return withLock_(function () {
      var p = placementOf_(u.email);
      if (!p || !p[spec.idField]) return { ok: true };
      try { DriveApp.getFileById(p[spec.idField]).setTrashed(true); } catch (e) { /* ไม่มีไฟล์แล้ว */ }
      var patch = { updated_at: nowIso_() };
      patch[spec.idField] = '';
      if (spec.nameField) patch[spec.nameField] = '';
      if (spec.atField) patch[spec.atField] = '';
      update_('Placements', p._row, patch);
      audit_(u.email, 'remove_' + kind, p.placement_id, '');
      return { ok: true };
    });
  });
}

/** นักศึกษาเปิดไฟล์ของตนเอง */
function api_placementFile(session, kind) {
  return safe_(function () {
    var u = requireUser_(session, ['student']);
    var spec = UPLOAD_KINDS_[kind];
    var p = placementOf_(u.email);
    if (!spec || !p || !p[spec.idField]) return { ok: false, error: 'ยังไม่มีไฟล์' };
    return fileOut_(p[spec.idField]);
  });
}

/** อาจารย์และผู้ดูแลเปิดไฟล์ของนักศึกษา */
function api_adminFile(session, placementId, kind) {
  return safe_(function () {
    var me = requireUser_(session, ['teacher', 'admin']);
    var spec = UPLOAD_KINDS_[kind];
    var p = placementById_(placementId);
    if (!p || !canSeeStudent_(me, findUser_(p.student_email))) return { ok: false, error: 'ท่านไม่ได้เป็นอาจารย์นิเทศของนักศึกษาคนนี้' };
    if (!spec || !p[spec.idField]) return { ok: false, error: 'ยังไม่มีไฟล์' };
    audit_(me.email, 'view_' + kind, p.placement_id, '');
    return fileOut_(p[spec.idField]);
  });
}

/** ผู้นิเทศงานหรือที่ปรึกษาร่วมเปิด CV ของนักศึกษาที่ตนดูแล (เปิดรูปไม่ได้) */
function api_svFile(k, placementId, kind) {
  return safe_(function () {
    var sv = requireSupervisor_(k);
    if (kind !== 'cv') return { ok: false, error: 'ไม่มีสิทธิ์เปิดไฟล์นี้' };
    var p = placementById_(placementId);
    var mine = p && (normEmail_(p.supervisor_email) === sv.email || (p.coadvisor_same !== 'yes' && normEmail_(p.coadvisor_email) === sv.email));
    if (!mine || ['agreement_sent', 'signed'].indexOf(p.status) < 0) return { ok: false, error: 'ไม่พบนักศึกษาคนนี้ในความรับผิดชอบของท่าน' };
    if (!p.cv_file_id) return { ok: false, error: 'นักศึกษายังไม่ได้แนบ CV' };
    audit_(sv.email, 'view_cv', p.placement_id, '');
    return fileOut_(p.cv_file_id);
  });
}
