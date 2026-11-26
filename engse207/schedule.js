/*
 * ENGSE207 · กำหนดการและสิ่งที่ต้องส่ง แยกตามกลุ่มเรียน (ใช้ร่วมกันในทุกหน้าของรายวิชา)
 * ปรับจาก engse601/schedule.js
 *
 * กลุ่มเรียน: ?sec=1 ท้าย URL หรือค่าที่เลือกไว้ในเครื่องนี้ (localStorage "engse207.sec")
 * ที่มาของข้อมูลของแต่ละ SEC:
 *   1. เว็บแอปของชีตผู้สอน SEC นั้น (แผ่น "กำหนดการ") ตาม secs[n].scheduleUrl ใน data.js
 *   2. ข้อมูลที่โหลดได้ครั้งล่าสุดในเครื่องนี้ (localStorage แยกตาม SEC)
 *   3. ข้อมูลสำรองใน schedule-data.js (window.ENGSE207_SCHEDULE.S1, .S2)
 * แสดงข้อมูลที่มีในเครื่องก่อน แล้วอัปเดตเมื่อเว็บแอปตอบกลับ
 * รายละเอียดของงาน (สั่งเมื่อ ทำเพื่ออะไร ขั้นตอน) อยู่ใน tasks.js
 *
 * ทดสอบวันอื่น: เติม ?now=2026-12-09T10:00 ท้าย URL (เวลาไทย)
 */
(function () {
  "use strict";
  var KEY = "engse207.schedule.v1.";
  var SEC_KEY = "engse207.sec";
  var DAY = 864e5;
  var TH_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  var TH_DAYS_LONG = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  var TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  var KIND = {
    "ก่อนคาบ": { label: "ส่งก่อนคาบ", cls: "k-pre" },
    "ในคาบ": { label: "ทำในคาบ", cls: "k-in" },
    "จุดตรวจ": { label: "จุดตรวจ", cls: "k-cp" },
    "สอบ": { label: "สอบ", cls: "k-exam" },
    "ประเมินเพื่อน": { label: "ประเมินเพื่อน", cls: "k-peer" },
    "ต่อเนื่อง": { label: "งานต่อเนื่อง", cls: "k-cont" },
    "ทุกคาบ": { label: "ทุกคาบ", cls: "k-all" }
  };

  function valid(d) { return !!(d && d.ok && Array.isArray(d.sessions) && Array.isArray(d.items)); }
  function copy(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function offsetMin(s) { var m = /^([+-])(\d{2}):?(\d{2})$/.exec(s || "+07:00"); return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 420; }

  /** เวลา "ตอนนี้" (หรือค่าจาก ?now= สำหรับทดสอบ) */
  function now() {
    var m = /[?&]now=(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(location.search);
    if (m) { var d = new Date(m[1] + "T" + (m[2] || "12:00") + ":00+07:00"); if (!isNaN(d)) return d; }
    return new Date();
  }

  /** โหลดข้อมูล เรียก cb(data, source) หนึ่งหรือสองครั้ง source: live | cache | fallback | none (+ "-offline" ถ้าเว็บแอปไม่ตอบ) */
  function load(sec, cb) {
    var conf = secInfo(sec) || {}, url = conf.scheduleUrl || "", key = KEY + "S" + sec;
    var fb = (window.ENGSE207_SCHEDULE || {})["S" + sec], cached = null, first = null;
    try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { cached = null; }
    if (cached && valid(cached.data) && (!valid(fb) || String(cached.data.updated) >= String(fb.updated))) first = { d: cached.data, s: "cache" };
    else if (valid(fb)) first = { d: fb, s: "fallback" };
    if (first) cb(first.d, first.s);
    if (!url || !window.fetch) { if (!first) cb(null, "none"); return; }
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    fetch(url, { cache: "no-store", credentials: "omit", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        clearTimeout(timer);
        if (!valid(d)) throw new Error("bad data");
        try { localStorage.setItem(key, JSON.stringify({ data: d, at: Date.now() })); } catch (e) { /* โหมดส่วนตัว */ }
        cb(d, "live");
      })
      .catch(function () { clearTimeout(timer); cb(first ? first.d : null, first ? first.s + "-offline" : "none"); });
  }

  /** แปลงข้อมูลดิบเป็นโมเดลที่หน้าเว็บใช้ */
  function model(data, t) {
    var off = offsetMin(data.offset), offMs = off * 6e4;
    var at = function (date, hm) { return new Date(date + "T" + (hm || "00:00") + ":00" + (data.offset || "+07:00")); };
    var sessions = data.sessions.map(function (s, i) {
      var timed = !!(s.date && s.start);
      var start = s.date ? at(s.date, timed ? s.start : "00:00") : null;
      var end = s.date ? (timed && s.end ? at(s.date, s.end) : new Date(+at(s.date, "00:00") + DAY)) : null;
      var link = /^https:\/\/[^\s"'<>]+$/.test(s.link || "") ? s.link : "";
      return copy(s, { idx: i, start: start, end: end, timed: timed, teach: /^T\d+$/.test(s.id), link: link,
        online: !!link || /ออนไลน์|online|teams|zoom|meet/i.test(s.room || ""),
        off: s.status === "งด", exam: s.status === "สอบ", pending: !s.date && s.status !== "งด" });
    });
    // วันงดเรียนที่มีคาบอื่น (เช่น คาบชดเชยออนไลน์) วันเดียวกัน ไม่ถือเป็นประกาศงดเรียน
    sessions.forEach(function (o) {
      if (!o.off || !o.date) return;
      o.replacedBy = sessions.filter(function (x) { return !x.off && x.date === o.date; })[0] || null;
    });
    var byId = {};
    sessions.forEach(function (s) { byId[s.id] = s; });
    var nextDatedAfter = function (s) {
      for (var i = s.idx + 1; i < sessions.length; i++) if (sessions[i].start && !sessions[i].off) return sessions[i];
      return null;
    };
    var T = (window.ENGSE207_TASKS && window.ENGSE207_TASKS.items) || {};
    var items = data.items.map(function (it, i) {
      var due = it.due ? new Date(it.due) : null, s = byId[it.session] || null;
      var brief = T[it.id] || null, asg = brief && brief.assigned ? byId[brief.assigned] || null : null;
      var dateOnly = it.kind === "สอบ" || (s && s.exam && due && !s.timed);
      var deadline = due ? (dateOnly ? new Date(+due + DAY) : due) : null;
      var pending = !due && !!s && s.pending && it.kind !== "ทุกคาบ";
      var after = pending ? nextDatedAfter(s) : null;
      return copy(it, { idx: i, sess: s, dueDate: due, deadline: deadline, dateOnly: dateOnly, pending: pending, brief: brief, assignedSess: asg,
        homework: !!asg && !(it.session === asg.id && it.kind === "ในคาบ"),
        past: deadline ? deadline <= t : false, key: due ? +due : after ? +after.start - 1 : Infinity,
        kindInfo: KIND[it.kind] || { label: it.kind || "งาน", cls: "k-in" } });
    });
    var teach = sessions.filter(function (s) { return s.teach; });
    var done = teach.filter(function (s) { return s.end && s.end <= t; }).length;
    var current = sessions.filter(function (s) { return s.start && !s.off && s.start <= t && t < s.end; })[0] || null;
    var dated = sessions.filter(function (s) { return s.start && !s.off; }).sort(function (a, b) { return a.start - b.start; });
    var next = dated.filter(function (s) { return s.start > t; })[0] || null;
    var firstDay = dated.length ? dated[0].start : null, lastEnd = dated.length ? dated[dated.length - 1].end : null;
    var dayNo = function (d) { return Math.floor((+d + offMs) / DAY); };
    var week = firstDay ? Math.floor((dayNo(t) - dayNo(firstDay)) / 7) + 1 : null;
    var offSoon = sessions.filter(function (s) { return s.off && !s.replacedBy && s.end && s.end > t && (!next || s.start < next.start); });
    var pendingSess = sessions.filter(function (s) { return s.pending && s.teach; });
    var upcoming = items.filter(function (x) { return x.kind !== "ทุกคาบ" && !x.past && (x.dueDate || x.pending); })
      .sort(function (a, b) { return a.key - b.key || a.idx - b.idx; });
    return { data: data, t: t, offMs: offMs, sessions: sessions, byId: byId, items: items, teachTotal: teach.length, done: done,
      current: current, next: next, week: week, before: firstDay ? t < firstDay : false, after: lastEnd ? t >= lastEnd : false,
      offSoon: offSoon, pendingSess: pendingSess, upcoming: upcoming, settings: data.settings || {}, sec: String(data.sec || "") };
  }

  /* ---------- การแสดงวันเวลา (คิดตามเขตเวลาของข้อมูล ไม่ขึ้นกับเครื่องผู้ชม) */
  function parts(M, d) {
    var x = new Date(+d + M.offMs);
    return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate(), w: x.getUTCDay(), h: x.getUTCHours(), mi: x.getUTCMinutes() };
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function date(M, d, long) {
    var p = parts(M, d);
    return (long ? TH_DAYS_LONG[p.w] : TH_DAYS[p.w]) + " " + p.d + " " + TH_MONTHS[p.m] + " " + (p.y + 543);
  }
  function shortDate(M, d) { var p = parts(M, d); return TH_DAYS[p.w] + " " + p.d + " " + TH_MONTHS[p.m]; }
  function time(M, d) { var p = parts(M, d); return pad(p.h) + ":" + pad(p.mi); }
  function due(M, it, long) {
    if (it.pending) return "รอกำหนดวัน";
    if (!it.dueDate) return it.kind === "ทุกคาบ" ? "ทุกคาบตลอดภาค" : "ตามที่อาจารย์แจ้ง";
    return (long ? date(M, it.dueDate) : shortDate(M, it.dueDate)) + (it.dateOnly ? "" : " " + time(M, it.dueDate) + " น.");
  }
  function sessWhen(M, s) {
    if (!s) return "";
    if (s.pending) return "รอกำหนดวัน";
    if (!s.start) return "";
    return date(M, s.start) + (s.timed ? " · " + time(M, s.start) + "–" + time(M, s.end) + " น." : "");
  }
  /** นับถอยหลังเป็นวันตามปฏิทิน: { text, level: hot | soon | later | past | wait } */
  function countdown(M, it) {
    if (it.pending) return { text: "รอกำหนดวัน", level: "wait" };
    if (!it.dueDate) return { text: "", level: "later" };
    if (it.past) return { text: "ครบกำหนดแล้ว", level: "past" };
    var dn = function (d) { return Math.floor((+d + M.offMs) / DAY); };
    var n = dn(it.dueDate) - dn(M.t);
    if (n <= 0) return { text: it.dateOnly ? "วันนี้" : "วันนี้ " + time(M, it.dueDate) + " น.", level: "hot" };
    if (n === 1) return { text: "พรุ่งนี้", level: "hot" };
    return { text: "อีก " + n + " วัน", level: n <= 7 ? "soon" : "later" };
  }
  /** ที่เรียน: ห้อง หรือออนไลน์ พร้อมลิงก์ (ถ้ามี) */
  function place(s) {
    if (!s || s.off || s.exam) return { text: "", link: "", online: false };
    return { text: s.room || "", link: s.link, online: s.online };
  }
  /** คาบถัดไปหลังคาบ s ตามวันที่ (หรือคาบที่รอกำหนดวันที่อยู่ถัดไปในแผน) */
  function nextAfter(M, s) {
    var later = M.sessions.filter(function (x) { return !x.off && x.idx > s.idx; });
    var dated = later.filter(function (x) { return x.start && (!s.start || x.start > s.start); }).sort(function (a, b) { return a.start - b.start; });
    var pend = later.filter(function (x) { return x.pending; })[0];
    return pend && (!dated[0] || pend.idx < dated[0].idx) ? pend : dated[0] || null;
  }
  /** ข้อความงานหลังเรียนของคาบ s สำหรับวางในกลุ่ม LINE */
  function lineText(M, s, site) {
    var hw = M.items.filter(function (it) { return it.homework && it.assignedSess === s; });
    var whenOf = function (it) {
      if (it.pending && it.sess) return (it.kind === "ก่อนคาบ" ? "ก่อนเริ่ม " : "") + it.sess.label + " (วันแจ้งภายหลัง)";
      return (it.kind === "ก่อนคาบ" && it.sess ? "ก่อนเริ่ม " + it.sess.label + " · " : "") + due(M, it, true);
    };
    var groups = [], seen = {};
    hw.forEach(function (it) { var k = whenOf(it); if (!seen[k]) { seen[k] = []; groups.push(k); } seen[k].push(it); });
    var L = ["ENGSE207 SEC" + M.sec + " · งานหลังเรียน " + s.label + (s.start ? " (" + date(M, s.start) + ")" : "")];
    groups.forEach(function (k) {
      L.push("", "ส่ง " + k);
      seen[k].forEach(function (it) { L.push("• " + it.id + " " + it.title + " [งาน" + it.scope + "]"); });
    });
    var n = nextAfter(M, s);
    if (n) {
      var p = place(n);
      L.push("", "ครั้งถัดไป: " + n.label + (n.topic && !n.exam ? " " + n.topic : "") + " · " + sessWhen(M, n) + (p.text ? " · ห้อง " + p.text : ""));
      if (p.link) L.push("เข้าเรียนออนไลน์: " + p.link);
      else if (p.online) L.push("ลิงก์เข้าเรียนแจ้งในกลุ่มนี้");
    }
    L.push("", "วิธีทำและเหตุผลของแต่ละงาน: " + site + "?sec=" + M.sec + "#after-" + s.id.toLowerCase());
    return L.join("\n");
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? ok() : fail(new Error("copy")); } catch (e) { fail(e); }
      ta.remove();
    });
  }
  /** ลิงก์จากชีต: รับเฉพาะ https หรือ path ในเว็บนี้ */
  function safeLink(u) {
    u = String(u || "").trim();
    return /^https:\/\/[^\s"'<>]+$/.test(u) || /^[A-Za-z0-9][\w\-./]*(#[\w\-]+)?$/.test(u) ? u : "";
  }

  /* ---------- ไฟล์ปฏิทิน .ics */
  function icsText(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function icsUtc(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function icsDate(M, d) { var p = parts(M, d); return p.y + pad(p.m + 1) + pad(p.d); }
  function fold(line) {
    // แบ่งบรรทัดไม่เกิน 75 ไบต์ (UTF-8) ตาม RFC 5545 โดยไม่ตัดกลางตัวอักษร
    var out = [], cur = "", n = 0;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i], c = line.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < line.length) { ch += line[++i]; }
      var b = ch.length > 1 ? 4 : c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
      if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; }
      cur += ch; n += b;
    }
    out.push(cur);
    return out.join("\r\n ");
  }
  function ics(M, opt) {
    opt = opt || {};
    var site = (opt.site || "https://se-rmutl.github.io/engse207/deliverables.html") + "?sec=" + M.sec, tag = "ENGSE207 SEC" + M.sec;
    var stamp = icsUtc(new Date());
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SE RMUTL//ENGSE207 2-2569//TH", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:" + tag + " ภาค 2/2569", "X-WR-TIMEZONE:Asia/Bangkok"];
    var ev = function (uid, summary, when, desc, loc, alarm) {
      L.push("BEGIN:VEVENT", "UID:engse207-2569-2-s" + M.sec + "-" + uid + "@se-rmutl.github.io", "DTSTAMP:" + stamp);
      L.push.apply(L, when);
      L.push("SUMMARY:" + icsText(summary));
      if (loc) L.push("LOCATION:" + icsText(loc));
      L.push("DESCRIPTION:" + icsText(desc + "\n" + site), "URL:" + site);
      if (alarm) L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(summary), "TRIGGER:-P1D", "END:VALARM");
      L.push("END:VEVENT");
    };
    if (opt.classes !== false) M.sessions.forEach(function (s) {
      if (!s.start || s.off) return;
      var when = s.timed ? ["DTSTART:" + icsUtc(s.start), "DTEND:" + icsUtc(s.end)]
        : ["DTSTART;VALUE=DATE:" + icsDate(M, s.start), "DTEND;VALUE=DATE:" + icsDate(M, s.end)];
      ev("class-" + s.id.toLowerCase(), tag + " " + (s.exam ? s.label : s.label + " · " + s.topic), when,
        [s.note || s.topic, s.link ? "เข้าเรียนออนไลน์: " + s.link : ""].filter(Boolean).join("\n"), s.exam ? "" : s.room, false);
    });
    M.items.forEach(function (it) {
      if (!it.dueDate || it.kind === "สอบ") return;
      var when = ["DTSTART:" + icsUtc(new Date(+it.dueDate - 30 * 6e4)), "DTEND:" + icsUtc(it.dueDate)];
      var desc = [it.kindInfo.label + " · งาน" + it.scope, it.where ? "ส่งที่ " + it.where : "", it.note].filter(Boolean).join("\n");
      ev("due-" + it.id.toLowerCase(), "ENGSE207 ครบกำหนด " + it.id + " · " + it.title, when, desc, "", true);
    });
    L.push("END:VCALENDAR");
    return L.map(fold).join("\r\n") + "\r\n";
  }
  function download(name, text) {
    var blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function sourceText(M, source) {
    var up = M.data.updated ? date(M, new Date(M.data.updated)) + " " + time(M, new Date(M.data.updated)) + " น." : "";
    if (source === "live") return { text: "ข้อมูลล่าสุดจากกำหนดการของอาจารย์", cls: "live" };
    if (source === "none") return { text: "ยังไม่มีกำหนดการของกลุ่มเรียนนี้", cls: "fallback" };
    if (/^cache/.test(source)) return { text: "ข้อมูลที่โหลดไว้ ณ " + up + (/offline/.test(source) ? " · เชื่อมต่อกำหนดการของอาจารย์ไม่ได้" : ""), cls: "cache" };
    return { text: "ข้อมูลสำรอง ณ " + up + (/offline/.test(source) ? " · เชื่อมต่อกำหนดการของอาจารย์ไม่ได้" : "") + " ถ้าวันไม่ตรงกับที่อาจารย์แจ้ง ให้ยึดตามที่แจ้งในห้อง", cls: "fallback" };
  }

  /* ---------- กลุ่มเรียน */
  function secInfo(n) { var D = window.ENGSE207 || {}; return (D.secs || {})[String(n)] || null; }
  function getSec() {
    var m = /[?&]sec=(\d)/.exec(location.search);
    if (m && secInfo(m[1])) return m[1];
    try { var v = localStorage.getItem(SEC_KEY); if (v && secInfo(v)) return v; } catch (e) { /* โหมดส่วนตัว */ }
    return "";
  }
  function setSec(n) {
    n = String(n || "");
    try { if (n) localStorage.setItem(SEC_KEY, n); else localStorage.removeItem(SEC_KEY); } catch (e) { /* โหมดส่วนตัว */ }
    if (window.history && history.replaceState) {
      var q = location.search.replace(/([?&])sec=\d&?/, "$1").replace(/[?&]$/, "");
      q = n ? (q ? q + "&" : "?") + "sec=" + n : q;
      history.replaceState(null, "", location.pathname + q + location.hash);
    }
    return n;
  }
  /** แถบเลือก SEC: el เป็นกล่องที่มีปุ่ม [data-sec] หรือว่าง (สร้างให้) · onChange(sec) */
  function secSwitch(el, onChange) {
    var D = window.ENGSE207 || {}, cur = getSec();
    if (!el) return cur;
    if (!el.querySelector("[data-sec]")) {
      el.innerHTML = Object.keys(D.secs || {}).map(function (k) {
        return '<button type="button" data-sec="' + k + '">' + D.secs[k].label + "</button>";
      }).join("");
    }
    var mark = function (v) {
      Array.prototype.forEach.call(el.querySelectorAll("[data-sec]"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.sec === v)); });
    };
    mark(cur);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sec]");
      if (!b) return;
      cur = setSec(b.dataset.sec); mark(cur);
      if (onChange) onChange(cur);
    });
    return cur;
  }
  /** ลิงก์ในเว็บนี้ที่ต่อ ?sec= ให้ */
  function withSec(href, sec) {
    if (!sec || /^https?:/.test(href)) return href;
    var h = href.split("#");
    return h[0] + (h[0].indexOf("?") < 0 ? "?" : "&") + "sec=" + sec + (h[1] ? "#" + h[1] : "");
  }

  /** ปรับลิงก์ทุกอันที่มี data-keep-sec ให้ต่อ ?sec= ของกลุ่มเรียนที่เลือก (คง #hash เดิม) */
  function keepSec(sec, root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("a[data-keep-sec]"), function (a) {
      var h = a.getAttribute("href") || "", i = h.indexOf("#"), hash = i >= 0 ? h.slice(i) : "";
      a.setAttribute("href", withSec(h.split("#")[0].split("?")[0] + hash, sec));
    });
  }

  /** กล่องเลือกกลุ่มเรียน (ใช้ทุกหน้า) และป้าย SEC ที่ header
   *  o.box กล่องว่าง · o.chip ลิงก์ป้ายที่ header · o.hint ข้อความใต้คำถาม · o.onChange(sec, extraEl)
   *  ยังไม่เลือก: แสดงปุ่ม 3 กลุ่ม · เลือกแล้ว: แถบ [SEC n] วันเวลา ห้อง [เปลี่ยนกลุ่ม] และช่อง extra ให้หน้านั้นเติม
   *  คืน { sec, extra } */
  function secUI(o) {
    var D = window.ENGSE207 || {}, secs = D.secs || {}, box = o.box, chip = o.chip, cur = getSec();
    var e = function (v) { return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    box.className = "secbox"; box.setAttribute("aria-label", "กลุ่มเรียนของคุณ");
    box.innerHTML = '<div class="secbox-pick"><p class="secbox-q"><span class="dot" aria-hidden="true"></span><span class="secbox-title"></span></p>' +
      '<p class="secbox-hint">' + e(o.hint || "เลือกครั้งเดียว เครื่องนี้จำไว้") + '</p><div class="secbox-opts" role="group" aria-label="กลุ่มเรียน">' +
      Object.keys(secs).map(function (k) {
        var i = secs[k];
        return '<button type="button" class="sec-opt s' + k + '" data-sec="' + k + '"><b>' + e(i.label) + "</b><span>" + e(i.block ? "Block course" : "วัน" + i.day) +
          "</span><small>" + e(i.block ? "กำหนดการประกาศภายหลัง" : i.time + " น. · ห้อง " + i.room) + "</small></button>";
      }).join("") + '</div><button type="button" class="secbox-cancel" hidden>ยกเลิก ใช้กลุ่มเดิม</button></div>' +
      '<div class="secbox-mine" hidden><div class="secbox-head"><span class="sec-badge"></span><span class="sec-when"></span>' +
      '<button type="button" class="sec-change">เปลี่ยนกลุ่ม</button></div><div class="secbox-extra" aria-live="polite"></div></div>';
    var q = function (c) { return box.querySelector(c); }, pickEl = q(".secbox-pick"), mineEl = q(".secbox-mine"), extra = q(".secbox-extra");
    function paintChip() {
      if (!chip) return;
      var info = secInfo(cur);
      chip.className = "sec-chip" + (info ? " on s" + cur : "");
      chip.textContent = info ? info.label : "เลือก SEC";
      chip.setAttribute("aria-label", info ? "กำลังดู " + info.label + " แตะเพื่อเปลี่ยนกลุ่มเรียน" : "เลือกกลุ่มเรียน");
    }
    function showPick(changing) {
      pickEl.hidden = false; mineEl.hidden = true;
      q(".secbox-cancel").hidden = !changing;
      q(".secbox-title").textContent = changing ? "เปลี่ยนเป็นกลุ่มไหน" : "คุณเรียนกลุ่มไหน";
      box.className = "secbox picking";
      Array.prototype.forEach.call(box.querySelectorAll(".sec-opt"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.sec === cur)); });
    }
    function showMine() {
      var info = secInfo(cur);
      if (!info) { showPick(false); return; }
      pickEl.hidden = true; mineEl.hidden = false;
      box.className = "secbox s" + cur;
      q(".sec-badge").textContent = info.label;
      q(".sec-when").textContent = info.block ? "Block course · กำหนดการประกาศภายหลัง" : "วัน" + info.day + " " + info.time + " น. · ห้อง " + info.room;
    }
    q(".secbox-opts").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-sec]");
      if (!b) return;
      var changed = b.dataset.sec !== cur;
      cur = setSec(b.dataset.sec); keepSec(cur); paintChip(); showMine();
      if (changed || !extra.innerHTML) o.onChange(cur, extra);
    });
    q(".sec-change").addEventListener("click", function () { showPick(true); q(".sec-opt").focus(); });
    q(".secbox-cancel").addEventListener("click", showMine);
    if (chip) chip.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (secInfo(cur)) showPick(true);
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    keepSec(cur); paintChip(); showMine();
    return { sec: cur, extra: extra };
  }

  /** เมนูมือถือ: ปุ่ม .menu-btn ใน header เปิด/ปิด .menu-panel */
  function initMenu() {
    var top = document.querySelector(".top"), btn = top && top.querySelector(".menu-btn");
    if (!btn) return;
    var set = function (open) { top.classList.toggle("menu-open", open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", function (ev) { ev.stopPropagation(); set(!top.classList.contains("menu-open")); });
    top.querySelector(".menu-panel").addEventListener("click", function (ev) { if (ev.target.closest("a")) set(false); });
    document.addEventListener("click", function (ev) { if (!top.contains(ev.target)) set(false); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && top.classList.contains("menu-open")) { set(false); btn.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 800) set(false); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMenu); else initMenu();

  window.ENGSE207Schedule = { load: load, getSec: getSec, setSec: setSec, secSwitch: secSwitch, secUI: secUI, secInfo: secInfo, withSec: withSec, keepSec: keepSec, model: model, now: now, date: date, shortDate: shortDate, time: time, due: due,
    sessWhen: sessWhen, countdown: countdown, safeLink: safeLink, ics: ics, download: download, sourceText: sourceText, KIND: KIND,
    place: place, nextAfter: nextAfter, lineText: lineText, copyText: copyText };
})();
