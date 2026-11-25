/*
 * ENGSE601 · กำหนดการและสิ่งที่ต้องส่ง (ใช้ร่วมกันใน index.html และ deliverables.html)
 *
 * ที่มาของข้อมูล:
 *   1. เว็บแอปของชีตอาจารย์ (แผ่น "กำหนดการ") ตาม schedule.url ใน data.js ใช้ข้อมูลนี้เมื่อเรียกได้
 *   2. ข้อมูลที่โหลดได้ครั้งล่าสุดในเครื่องนี้ (localStorage)
 *   3. ข้อมูลสำรองใน schedule-data.js (สำเนาจากชีต ณ วันที่ในไฟล์)
 * แสดงข้อมูลที่มีในเครื่องก่อน แล้วอัปเดตเมื่อเว็บแอปตอบกลับ
 *
 * ทดสอบวันอื่น: เติม ?now=2026-12-09T10:00 ท้าย URL (เวลาไทย)
 */
(function () {
  "use strict";
  var KEY = "engse601.schedule.v1";
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
  function load(url, cb) {
    var fb = window.ENGSE601_SCHEDULE, cached = null, first = null;
    try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { cached = null; }
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
        try { localStorage.setItem(KEY, JSON.stringify({ data: d, at: Date.now() })); } catch (e) { /* โหมดส่วนตัว */ }
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
      return copy(s, { idx: i, start: start, end: end, timed: timed, teach: /^S\d+$/.test(s.id),
        off: s.status === "งด", exam: s.status === "สอบ", pending: !s.date && s.status !== "งด" });
    });
    var byId = {};
    sessions.forEach(function (s) { byId[s.id] = s; });
    var nextDatedAfter = function (s) {
      for (var i = s.idx + 1; i < sessions.length; i++) if (sessions[i].start && !sessions[i].off) return sessions[i];
      return null;
    };
    var items = data.items.map(function (it, i) {
      var due = it.due ? new Date(it.due) : null, s = byId[it.session] || null;
      var dateOnly = it.kind === "สอบ" || (s && s.exam && due && !s.timed);
      var deadline = due ? (dateOnly ? new Date(+due + DAY) : due) : null;
      var pending = !due && !!s && s.pending && it.kind !== "ทุกคาบ";
      var after = pending ? nextDatedAfter(s) : null;
      return copy(it, { idx: i, sess: s, dueDate: due, deadline: deadline, dateOnly: dateOnly, pending: pending,
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
    var offSoon = sessions.filter(function (s) { return s.off && s.end && s.end > t && (!next || s.start < next.start); });
    var pendingSess = sessions.filter(function (s) { return s.pending && s.teach; });
    var upcoming = items.filter(function (x) { return x.kind !== "ทุกคาบ" && !x.past && (x.dueDate || x.pending); })
      .sort(function (a, b) { return a.key - b.key || a.idx - b.idx; });
    return { data: data, t: t, offMs: offMs, sessions: sessions, byId: byId, items: items, teachTotal: teach.length, done: done,
      current: current, next: next, week: week, before: firstDay ? t < firstDay : false, after: lastEnd ? t >= lastEnd : false,
      offSoon: offSoon, pendingSess: pendingSess, upcoming: upcoming, settings: data.settings || {} };
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
    var site = opt.site || "https://se-rmutl.github.io/engse601/deliverables.html";
    var stamp = icsUtc(new Date());
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SE RMUTL//ENGSE601 2-2569//TH", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:ENGSE601 ภาค 2/2569", "X-WR-TIMEZONE:Asia/Bangkok"];
    var ev = function (uid, summary, when, desc, loc, alarm) {
      L.push("BEGIN:VEVENT", "UID:engse601-2569-2-" + uid + "@se-rmutl.github.io", "DTSTAMP:" + stamp);
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
      ev("class-" + s.id.toLowerCase(), "ENGSE601 " + (s.exam ? s.label : s.label + " · " + s.topic), when, s.note || s.topic, s.exam ? "" : s.room, false);
    });
    M.items.forEach(function (it) {
      if (!it.dueDate || it.kind === "สอบ") return;
      var when = ["DTSTART:" + icsUtc(new Date(+it.dueDate - 30 * 6e4)), "DTEND:" + icsUtc(it.dueDate)];
      var desc = [it.kindInfo.label + " · งาน" + it.scope, it.where ? "ส่งที่ " + it.where : "", it.note].filter(Boolean).join("\n");
      ev("due-" + it.id.toLowerCase(), "ครบกำหนด " + it.id + " · " + it.title, when, desc, "", true);
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
    if (/^cache/.test(source)) return { text: "ข้อมูลที่โหลดไว้ ณ " + up + (/offline/.test(source) ? " · เชื่อมต่อกำหนดการของอาจารย์ไม่ได้" : ""), cls: "cache" };
    return { text: "ข้อมูลสำรอง ณ " + up + (/offline/.test(source) ? " · เชื่อมต่อกำหนดการของอาจารย์ไม่ได้" : "") + " ถ้าวันไม่ตรงกับที่อาจารย์แจ้ง ให้ยึดตามที่แจ้งในห้อง", cls: "fallback" };
  }

  window.ENGSE601Schedule = { load: load, model: model, now: now, date: date, shortDate: shortDate, time: time, due: due,
    sessWhen: sessWhen, countdown: countdown, safeLink: safeLink, ics: ics, download: download, sourceText: sourceText, KIND: KIND };
})();
