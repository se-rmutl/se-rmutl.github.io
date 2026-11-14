/**
 * Db.gs — อ่าน/เขียน Google Sheets แบบตาราง (แถว 1 = หัวคอลัมน์)
 */

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบชีต "' + name + '" กรุณารันเมนู SE-WIL > ตั้งค่าระบบ');
  return sh;
}

function header_(sh) {
  var lastCol = sh.getLastColumn();
  if (lastCol < 1) return [];
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
}

function cellIn_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    var hasTime = v.getHours() || v.getMinutes() || v.getSeconds();
    return Utilities.formatDate(v, TZ, hasTime ? "yyyy-MM-dd'T'HH:mm:ss" : 'yyyy-MM-dd');
  }
  return v;
}

/** อ่านทุกแถวเป็น array ของ object พร้อม _row (เลขแถวจริงในชีต) */
function readAll_(name) {
  var sh = sheet_(name);
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var header = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (r.join('') === '') continue;
    var o = { _row: i + 1 };
    for (var j = 0; j < header.length; j++) if (header[j]) o[header[j]] = cellIn_(r[j]);
    rows.push(o);
  }
  return rows;
}

function insert_(name, obj) {
  var sh = sheet_(name);
  var header = header_(sh);
  sh.appendRow(header.map(function (h) { return cellOut_(obj[h]); }));
  return obj;
}

/** แก้ไขบางคอลัมน์ของแถว rowNum */
function update_(name, rowNum, patch) {
  var sh = sheet_(name);
  var header = header_(sh);
  var range = sh.getRange(rowNum, 1, 1, header.length);
  var row = range.getValues()[0];
  var out = header.map(function (h, i) {
    return Object.prototype.hasOwnProperty.call(patch, h) ? cellOut_(patch[h]) : cellOut_(cellIn_(row[i]));
  });
  range.setValues([out]);
}

/** แก้ไขหลายแถวในครั้งเดียว: items = [{row, patch}] */
function updateMany_(name, items) {
  items.forEach(function (it) { update_(name, it.row, it.patch); });
}

function deleteRow_(name, rowNum) { sheet_(name).deleteRow(rowNum); }

function findOne_(name, pred) {
  var rows = readAll_(name);
  for (var i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i];
  return null;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function nowIso_() { return new Date().toISOString(); }

function todayStr_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }

function shortId_(prefix, n) {
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, n || 10).toUpperCase();
}

function audit_(actor, action, target, detail) {
  try {
    insert_('Audit', { ts: nowIso_(), actor: actor || '', action: action, target: target || '', detail: String(detail || '').slice(0, 500) });
  } catch (e) { /* ไม่ให้ audit ทำให้งานหลักล้ม */ }
}

/** ตัด _row และคอลัมน์ภายในออกก่อนส่งให้เบราว์เซอร์ */
function publicRow_(o, hide) {
  var out = {};
  Object.keys(o).forEach(function (k) {
    if (k === '_row') return;
    if (hide && hide.indexOf(k) >= 0) return;
    out[k] = o[k];
  });
  return out;
}
