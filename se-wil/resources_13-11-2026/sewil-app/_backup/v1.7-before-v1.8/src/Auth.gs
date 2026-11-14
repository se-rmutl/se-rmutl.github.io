/**
 * Auth.gs — เข้าระบบด้วยลิงก์ทางอีเมล (ไม่ต้องมีบัญชี Google) และลิงก์เฉพาะคนของผู้นิเทศงาน
 */

function newToken_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function hash_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function findUser_(email) {
  email = normEmail_(email);
  var u = findOne_('Users', function (r) { return normEmail_(r.email) === email; });
  if (!u) return null;
  u.email = email;
  u.role = String(u.role || '').trim().toLowerCase();
  u.active = String(u.active).toUpperCase() !== 'FALSE';
  return u;
}

function profile_(u) {
  return {
    email: u.email, role: u.role, name: String(u.name || ''), student_id: String(u.student_id || ''),
    phone: String(u.phone || ''), section: String(u.section || ''), advisor_email: normEmail_(u.advisor_email)
  };
}

/** ข้อมูลติดต่อของผู้ใช้ในชีต Users (ไม่รวมข้อมูลอื่น) */
function contactOf_(email) {
  var u = email ? findUser_(email) : null;
  return u ? { name: String(u.name || ''), email: u.email, phone: String(u.phone || '') } : null;
}

/**
 * หลักเข้าถึงเท่าที่จำเป็น: admin (ผู้ประสานงาน SE-WIL และผู้ดูแลระบบ) เห็นนักศึกษาทุกคน
 * teacher เห็นเฉพาะนักศึกษาที่ตนเป็นอาจารย์นิเทศ (advisor_email ตรงกับอีเมลของตน)
 */
function canSeeStudent_(me, studentUser) {
  if (!me || !studentUser) return false;
  if (me.role === 'admin') return true;
  return me.role === 'teacher' && normEmail_(studentUser.advisor_email) === me.email;
}

/** ผู้ประสานงาน SE-WIL (ติดต่อหลักของนักศึกษาและสถานประกอบการ) จากชีต Config */
function coordinator_() {
  var c = cfg_();
  if (!c.COORDINATOR_NAME && !c.COORDINATOR_EMAIL) return null;
  return { name: c.COORDINATOR_NAME || 'ผู้ประสานงาน SE-WIL', email: normEmail_(c.COORDINATOR_EMAIL), phone: c.COORDINATOR_PHONE || '' };
}

/** หัวหน้าหลักสูตรจากชีต Config (ผู้ติดต่อกรณีจำเป็น) */
function programHead_() {
  var c = cfg_();
  if (!c.PROGRAM_HEAD_NAME && !c.PROGRAM_HEAD_EMAIL && !c.PROGRAM_HEAD_PHONE) return null;
  return { name: c.PROGRAM_HEAD_NAME || 'หัวหน้าหลักสูตร', email: normEmail_(c.PROGRAM_HEAD_EMAIL), phone: c.PROGRAM_HEAD_PHONE || '' };
}

/** ขอลิงก์เข้าระบบ ตอบเหมือนกันทุกกรณีเพื่อไม่ให้เดาได้ว่าอีเมลใดอยู่ในระบบ */
function api_requestLogin(email) {
  email = normEmail_(email);
  if (!isEmail_(email)) return { ok: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' };
  return withLock_(function () {
    var user = findUser_(email);
    if (user && user.active && ['student', 'teacher', 'admin'].indexOf(user.role) >= 0) {
      var hourAgo = Date.now() - 3600000;
      var recent = readAll_('Sessions').filter(function (s) {
        return s.email === email && s.kind === 'login' && Date.parse(s.created_at) > hourAgo;
      });
      if (recent.length < 3) {
        var t = newToken_();
        var mins = cfgNum_('LOGIN_LINK_MINUTES') || 30;
        insert_('Sessions', {
          token_hash: hash_(t), email: email, kind: 'login',
          expires_at: new Date(Date.now() + mins * 60000).toISOString(), used: '', created_at: nowIso_()
        });
        sendLoginEmail_(user, t, mins);
        audit_(email, 'login_link_sent', '', '');
      } else {
        audit_(email, 'login_rate_limited', '', '');
      }
    } else {
      audit_(email, 'login_unknown_email', '', '');
    }
    return { ok: true };
  });
}

/** แลกลิงก์เข้าระบบเป็น session */
function api_exchange(t) {
  if (!t || String(t).length < 32) return { ok: false, error: 'ลิงก์ไม่ถูกต้อง' };
  return withLock_(function () {
    var h = hash_(t);
    var row = findOne_('Sessions', function (s) { return s.token_hash === h && s.kind === 'login'; });
    if (!row) return { ok: false, error: 'ลิงก์ไม่ถูกต้อง' };
    if (String(row.used)) return { ok: false, error: 'ลิงก์นี้ถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่' };
    if (Date.parse(row.expires_at) < Date.now()) return { ok: false, error: 'ลิงก์หมดอายุ กรุณาขอลิงก์ใหม่' };
    update_('Sessions', row._row, { used: nowIso_() });
    var user = findUser_(row.email);
    if (!user || !user.active) return { ok: false, error: 'บัญชีนี้ไม่ได้เปิดใช้งาน' };
    var s = newToken_();
    var days = cfgNum_('SESSION_DAYS') || 14;
    insert_('Sessions', {
      token_hash: hash_(s), email: user.email, kind: 'session',
      expires_at: new Date(Date.now() + days * DAY_MS_).toISOString(), used: '', created_at: nowIso_()
    });
    audit_(user.email, 'login', '', '');
    return { ok: true, session: s, me: profile_(user) };
  });
}

/** ตรวจ session และบทบาท คืนผู้ใช้ หรือโยน error */
function requireUser_(session, roles) {
  if (!session) throw new Error('AUTH: กรุณาเข้าระบบ');
  var h = hash_(session);
  var row = findOne_('Sessions', function (s) { return s.token_hash === h && s.kind === 'session'; });
  if (!row || Date.parse(row.expires_at) < Date.now()) throw new Error('AUTH: การเข้าระบบหมดอายุ กรุณาเข้าระบบใหม่');
  var user = findUser_(row.email);
  if (!user || !user.active) throw new Error('AUTH: บัญชีนี้ไม่ได้เปิดใช้งาน');
  if (roles && roles.indexOf(user.role) < 0) throw userError_('ไม่มีสิทธิ์ใช้งานส่วนนี้');
  return user;
}

function api_me(session) {
  return safe_(function () { return { ok: true, me: profile_(requireUser_(session)) }; });
}

function api_logout(session) {
  return safe_(function () {
    if (!session) return { ok: true };
    var h = hash_(session);
    withLock_(function () {
      var row = findOne_('Sessions', function (s) { return s.token_hash === h; });
      if (row) update_('Sessions', row._row, { expires_at: new Date(Date.now() - 1000).toISOString() });
    });
    return { ok: true };
  });
}

/** ผู้นิเทศงาน/ที่ปรึกษาร่วม: สร้างหรือคืนแถวพร้อม token */
function getOrCreateSupervisor_(email, name) {
  email = normEmail_(email);
  var row = findOne_('Supervisors', function (r) { return normEmail_(r.email) === email; });
  if (row) {
    var patch = {};
    if (name && !row.name) patch.name = name;
    if (String(row.token || '').length < 32) { row.token = newToken_(); patch.token = row.token; } // ผู้ดูแลลบ token เพื่อยกเลิกลิงก์เดิม
    if (Object.keys(patch).length) update_('Supervisors', row._row, patch);
    return row;
  }
  var obj = { email: email, name: name || '', token: newToken_(), created_at: nowIso_(), last_access_at: '' };
  insert_('Supervisors', obj);
  return obj;
}

function requireSupervisor_(k) {
  if (!k || String(k).length < 32) throw new Error('AUTH: ลิงก์ไม่ถูกต้อง');
  var row = findOne_('Supervisors', function (r) { return String(r.token) === String(k); });
  if (!row) throw new Error('AUTH: ลิงก์ไม่ถูกต้องหรือถูกยกเลิกแล้ว กรุณาติดต่อหลักสูตร');
  update_('Supervisors', row._row, { last_access_at: nowIso_() });
  row.email = normEmail_(row.email);
  return row;
}

/** ห่อ API ให้คืน {ok:false,error} แทนการโยน error ไปที่เบราว์เซอร์ */
function safe_(fn) {
  try {
    return fn();
  } catch (e) {
    var msg = String(e && e.message || e);
    var auth = msg.indexOf('AUTH:') === 0;
    if (!auth && !(e && e.user)) console.error(e && e.stack || msg);
    return { ok: false, auth: auth, error: msg.replace(/^AUTH:\s*/, '') };
  }
}

/** ข้อผิดพลาดที่เกิดจากการใช้งาน (ไม่ใช่บั๊ก) จะไม่ถูกบันทึกเป็น error ใน log */
function userError_(msg) {
  var e = new Error(msg);
  e.user = true;
  return e;
}

/** ใช้กับฟังก์ชันผู้ดูแลที่รันจากเมนูหรือ editor เท่านั้น */
function assertOwner_() {
  var active = '', eff = '';
  try { active = Session.getActiveUser().getEmail(); } catch (e) { }
  try { eff = Session.getEffectiveUser().getEmail(); } catch (e) { }
  if (!active || active !== eff) throw new Error('ฟังก์ชันนี้ต้องรันโดยเจ้าของระบบจากเมนู SE-WIL หรือ editor เท่านั้น');
}
