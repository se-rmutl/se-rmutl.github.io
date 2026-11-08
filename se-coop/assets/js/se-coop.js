/* SE-COOP portal: ส่วนหัว ส่วนท้าย และส่วนที่คำนวณจากวันที่ (ไม่ต้องแก้ไฟล์นี้ แก้ข้อมูลที่ config.js)
   คัดลอกจาก se-wil.js แล้วปรับเป็นภาคสหกิจที่เริ่มทำงานตั้งแต่สัปดาห์ที่ 1 (ไม่มีสัปดาห์เตรียมการ) */
(function () {
  'use strict';
  var C = window.SECOOP;
  var body = document.body;
  var ROOT = body.getAttribute('data-root') || '';
  var PAGE = body.getAttribute('data-page') || 'home';
  var SECTION = body.getAttribute('data-section') || PAGE;
  if (!C) { console.error('config.js ไม่ถูกโหลด'); return; }

  /* ---------- เครื่องมือ ---------- */
  var M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var MF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  var DAY = 864e5;
  var ROLE = { student: 'นักศึกษา', teacher: 'อาจารย์', company: 'สถานประกอบการ' };
  function h(tag, attrs) {
    var el = document.createElement(tag); attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function D(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return Date.UTC(+m[1], +m[2] - 1, +m[3]); }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function th(s, style) {
    var d = new Date(D(s)), y = d.getUTCFullYear() + 543;
    if (style === 'full') return d.getUTCDate() + ' ' + MF[d.getUTCMonth()] + ' ' + y;
    if (style === 'short') return d.getUTCDate() + ' ' + M[d.getUTCMonth()];
    return d.getUTCDate() + ' ' + M[d.getUTCMonth()] + ' ' + String(y).slice(2);
  }
  function todayStr() {
    var q = /[?&]today=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    if (q) return q[1];
    if (window.__SECOOP_TODAY__) return window.__SECOOP_TODAY__;
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return iso(Date.now()); }
  }
  function url(u) { if (!u) return ''; return /^(https?:|mailto:|#)/.test(u) ? u : ROOT + u; }
  function linkOf(key) { for (var i = 0; i < C.links.length; i++) if (C.links[i].key === key) return C.links[i]; return null; }
  function hasRole(item, role) { return !role || role === 'all' || !item.roles || item.roles.indexOf(role) >= 0; }
  function external(u) { return /^https?:/.test(u) && u.indexOf(location.host) < 0; }

  var ICON = {
    login: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4"/><path d="M14 12H4"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h1M4 12h1M4 18h1"/>',
    book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    student: '<path d="M2.5 9L12 5l9.5 4L12 13z"/><path d="M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11"/><path d="M21.5 9v5"/>',
    teacher: '<circle cx="9" cy="7" r="3"/><path d="M3.5 20v-2.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V20"/><path d="M15 5h6v7h-4"/>',
    company: '<path d="M4 20V6l7-3v17"/><path d="M11 9h9v11"/><path d="M2.5 20h19"/><path d="M7 8h1M7 12h1M7 16h1M14.5 12h2M14.5 16h2"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  function icon(name, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true'); if (cls) s.setAttribute('class', cls);
    s.innerHTML = ICON[name] || ICON.link; return s;
  }

  /* ---------- สถานะของภาค ---------- */
  var T = C.term, today = todayStr(), tMs = D(today), sMs = D(T.start), eMs = D(T.end);
  function mondayMs(ms) { var d = new Date(ms).getUTCDay(); return ms - ((d + 6) % 7) * DAY; }
  var NW = Math.floor((mondayMs(eMs) - mondayMs(sMs)) / (7 * DAY)) + 1; // จำนวนสัปดาห์ของการฝึก
  var before = tMs < sMs, ended = tMs > eMs;
  var week = before ? 0 : Math.min(NW, Math.floor((mondayMs(tMs) - mondayMs(sMs)) / (7 * DAY)) + 1);
  var curWeek = ended ? NW : Math.max(1, week);
  function weekRange(n) { var a = mondayMs(sMs) + (n - 1) * 7 * DAY; return { a: iso(Math.max(a, sMs)), b: iso(Math.min(a + 6 * DAY, eMs)) }; }
  function weekItem(n) { for (var i = 0; i < C.weeks.length; i++) if (n >= C.weeks[i].from && n <= C.weeks[i].to) return C.weeks[i]; return null; }
  function daysTo(s) { return Math.round((D(s) - tMs) / DAY); }
  function leftText(s) { var n = daysTo(s); return n < 0 ? 'ผ่านมาแล้ว' : n === 0 ? 'วันนี้' : n === 1 ? 'พรุ่งนี้' : 'อีก ' + n + ' วัน'; }
  function weekState(n) { if (before) return 'future'; if (ended) return 'past'; return n < week ? 'past' : n === week ? 'cur' : 'future'; }
  function upcoming(role) { return C.deadlines.filter(function (d) { return hasRole(d, role) && daysTo(d.date) >= 0; }); }
  function nowLabel() {
    if (before) return 'ยังไม่เริ่มการฝึก';
    if (ended) return 'สิ้นสุดการฝึกแล้ว';
    return 'สัปดาห์ที่ ' + week + ' จาก ' + NW + ' ของการฝึก';
  }
  function nowSub() {
    if (before) return 'เริ่มปฏิบัติงาน ' + th(T.start, 'full') + ' (' + leftText(T.start) + ')';
    if (ended) return 'สิ้นสุดเมื่อ ' + th(T.end, 'full');
    var r = weekRange(week); return 'วันนี้ ' + th(today, 'full') + ' สัปดาห์นี้ ' + th(r.a) + ' ถึง ' + th(r.b);
  }

  /* ---------- ส่วนหัว ---------- */
  function secoopBtn(cls) {
    var l = linkOf('secoop'), u = l && url(l.url);
    if (u) return h('a', { class: 'btn btn-primary ' + (cls || ''), href: u, target: '_blank', rel: 'noopener' }, icon('login'), 'เข้าระบบ SE-COOP');
    return h('span', { class: 'btn ' + (cls || ''), 'aria-disabled': 'true', title: 'ระบบจะเปิดเร็ว ๆ นี้' }, icon('login'), 'ระบบ SE-COOP เปิดเร็ว ๆ นี้');
  }
  function navLink(id, href, label, ico) {
    var a = h('a', { href: ROOT + href }, ico ? icon(ico, 'role-ico') : null, label);
    if (SECTION === id) a.setAttribute('aria-current', 'page');
    return a;
  }
  var head = document.getElementById('site-header');
  if (head) {
    var nav = h('nav', { class: 'mainnav', id: 'mainnav', 'aria-label': 'เมนูหลัก' }, h('div', { class: 'wrap' },
      navLink('home', 'index.html', 'หน้าหลัก'),
      navLink('student', 'student/index.html', 'นักศึกษา', 'student'),
      navLink('teacher', 'teacher/index.html', 'อาจารย์', 'teacher'),
      navLink('company', 'company/index.html', 'สถานประกอบการ', 'company'),
      h('span', { class: 'sep', 'aria-hidden': 'true' }),
      navLink('help', 'help/index.html', 'ช่วยเหลือและผู้ติดต่อ'),
      h('div', { class: 'mob-cta', style: 'padding:10px 8px 4px' }, secoopBtn())));
    var menuBtn = h('button', { class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'mainnav' },
      h('span', { 'aria-hidden': 'true', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' }), 'เมนู');
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    add(head, [
      h('a', { class: 'skip', href: '#main' }, 'ข้ามไปที่เนื้อหา'),
      h('div', { class: 'gov' }, h('div', { class: 'wrap' },
        h('span', { class: 'org' }, h('a', { href: 'https://www.rmutl.ac.th/', target: '_blank', rel: 'noopener' }, 'มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา'), '  /  คณะวิศวกรรมศาสตร์  /  สาขาวิชาวิศวกรรมซอฟต์แวร์'),
        h('span', { class: 'right' },
          h('span', { class: 'wil' }, 'หา SE-WIL (ENGSE304–305)? ', h('a', { href: 'https://se-rmutl.github.io/se-wil/' }, 'ไปพอร์ทัล SE-WIL')),
          h('span', { class: 'term' }, 'สหกิจ ' + T.label)))),
      h('div', { class: 'masthead' }, h('div', { class: 'wrap' },
        h('a', { class: 'brand', href: ROOT + 'index.html', 'aria-label': 'SE-COOP หน้าหลัก' },
          h('span', { class: 'logos' },
            h('img', { src: ROOT + 'assets/img/rmutl-logo.jpg', alt: 'ตรามหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา', width: '34', height: '62' }),
            h('span', { class: 'div', 'aria-hidden': 'true' }),
            h('img', { src: ROOT + 'assets/img/se-logo.jpg', alt: 'ตราสาขาวิชาวิศวกรรมซอฟต์แวร์ RMUTL', width: '70', height: '62' })),
          h('span', { class: 'name' }, h('b', {}, 'SE-COOP สหกิจศึกษา', h('span', { class: 'tag' }, 'COOP')),
            h('span', {}, 'ENGSE300 และ ENGSE301 สาขาวิชาวิศวกรรมซอฟต์แวร์'))),
        h('div', { class: 'actions' }, secoopBtn()),
        menuBtn)),
      nav
    ]);
  }

  /* ---------- ส่วนท้าย ---------- */
  var foot = document.getElementById('site-footer');
  if (foot) {
    foot.className = 'foot';
    add(foot, h('div', { class: 'wrap' },
      h('div', { class: 'cols' },
        h('div', { class: 'org' },
          h('span', { class: 'plate' }, h('img', { src: ROOT + 'assets/img/rmutl-logo.jpg', alt: '', width: '26', height: '48' }), h('img', { src: ROOT + 'assets/img/se-logo.jpg', alt: '', width: '54', height: '48' })),
          h('div', {}, h('b', {}, 'สาขาวิชาวิศวกรรมซอฟต์แวร์'), h('div', {}, 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา'),
            h('div', { style: 'margin-top:8px' }, 'หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์ สหกิจศึกษาไม่น้อยกว่า 15 สัปดาห์ ทุกภาคการศึกษา'))),
        h('div', {}, h('h2', {}, 'สำหรับ'), h('ul', {},
          h('li', {}, h('a', { href: ROOT + 'student/index.html' }, 'นักศึกษา')),
          h('li', {}, h('a', { href: ROOT + 'teacher/index.html' }, 'อาจารย์')),
          h('li', {}, h('a', { href: ROOT + 'company/index.html' }, 'สถานประกอบการและผู้นิเทศงาน')))),
        h('div', {}, h('h2', {}, 'ข้อมูลเพิ่มเติม'), h('ul', {},
          h('li', {}, h('a', { href: 'https://coop-eng.rmutl.ac.th/', target: '_blank', rel: 'noopener' }, 'ระบบ COOP Engineering ของคณะ')),
          h('li', {}, h('a', { href: ROOT + 'help/index.html' }, 'คำถามพบบ่อยและผู้ติดต่อ')),
          h('li', {}, h('a', { href: ROOT + 'help/privacy.html' }, 'การคุ้มครองข้อมูลส่วนบุคคล'))))),
      (function () {
        var pc = (C.contacts || []).filter(function (c) { return c.primary && (c.name || c.email); })[0];
        return pc ? h('p', { class: 'contact-line' }, h('b', {}, 'ติดต่อ: '), pc.role.replace(/\s*\(.*\)$/, '') + ' ' + (pc.name || ''),
          pc.email ? [' ', h('a', { href: 'mailto:' + pc.email }, pc.email)] : null) : null;
      })(),
      h('div', { class: 'base' },
        h('span', {}, 'ปรับปรุงล่าสุด ' + th(C.updated, 'full')),
        h('span', {}, C.version),
        h('span', {}, 'วันที่ในเว็บเป็นค่าโดยประมาณ ให้ยึดประกาศของหลักสูตรเป็นหลัก'))));
  }

  /* ---------- ส่วนประกอบตาม data-c ---------- */
  var R = {};

  R.termbar = function (el) {
    var role = el.getAttribute('data-role');
    var nx = upcoming(role)[0];
    var panel = h('div', { class: 'panel' });
    add(panel, h('div', { class: 'top' },
      h('div', {}, h('div', { class: 'now' }, nowLabel()), h('div', { class: 'sub' }, nowSub())),
      nx ? h('div', { class: 'next' }, 'กำหนดถัดไป ', h('b', {}, th(nx.date, 'short')), ' (' + leftText(nx.date) + ')', h('br'), nx.title) : null));
    var ms = {}; C.milestones.forEach(function (m) { ms[m.week] = m; });
    var track = h('div', { class: 'track', role: 'img', 'aria-label': 'แถบการฝึก ' + NW + ' สัปดาห์ ' + nowLabel() });
    var labels = h('div', { class: 'track-labels', 'aria-hidden': 'true' });
    for (var n = 1; n <= NW; n++) {
      var st = weekState(n), cls = 'wk' + (st === 'past' ? ' past' : st === 'cur' ? ' cur' : '') + ((T.holidays || []).indexOf(n) >= 0 ? ' holiday' : '');
      var m = ms[n];
      add(track, h('div', { class: cls, title: 'สัปดาห์ที่ ' + n + ' ' + th(weekRange(n).a) + ' ถึง ' + th(weekRange(n).b) + (m ? ' ' + m.label : '') },
        String(n), m ? h('span', { class: 'ms ' + (m.kind === 'visit' ? 'mvisit' : 'mall') }) : null));
      add(labels, h('span', {}, n % 2 === 1 ? th(weekRange(n).a, 'short') : ''));
    }
    add(panel, [track, labels,
      h('div', { class: 'track-key' },
        h('span', {}, h('i', { class: 'k-cur' }), 'สัปดาห์ปัจจุบัน'),
        h('span', {}, h('i', { style: 'background:var(--gold-rule)' }), 'จุดสำคัญ'),
        h('span', {}, h('i', { style: 'background:var(--teal)' }), 'ช่วงนิเทศ'),
        h('span', {}, h('i', { style: 'background:repeating-linear-gradient(135deg,var(--sky) 0 3px,#fff 3px 5px);border-radius:2px' }), 'ช่วงวันหยุดปีใหม่'))]);
    if (el.getAttribute('data-milestones') !== 'false') {
      add(panel, h('ul', { class: 'milestones' }, C.milestones.map(function (m) {
        var done = !before && (ended || m.week < week);
        return h('li', { class: done ? 'done' : '' }, h('b', {}, 'สัปดาห์ ' + m.week), m.label);
      })));
    }
    add(el, panel);
  };

  R.week = function (el) {
    var role = el.getAttribute('data-role') || 'all';
    var n = curWeek, cur = weekItem(n);
    if (!cur) return;
    var nxt = cur.to < NW ? weekItem(cur.to + 1) : null;
    var title = ended ? 'สิ้นสุดการฝึกแล้ว' : before ? 'ก่อนเริ่มการฝึก' : 'สัปดาห์ที่ ' + n + ' ต้องทำอะไร';
    var rng = (cur.from === cur.to ? 'สัปดาห์ที่ ' + cur.from : 'สัปดาห์ที่ ' + cur.from + '–' + cur.to) + ' ระหว่าง ' + th(weekRange(cur.from).a) + ' ถึง ' + th(weekRange(cur.to).b);
    var box = h('div', { class: 'week-box' + (role === 'all' ? ' all' : '') },
      h('div', { class: 'wk-title' }, h('h3', {}, title), h('span', { class: 'wk-range' }, rng)),
      h('div', { class: 'tracks' }, h('div', { class: 'one' }, h('span', { class: 'tag coop' }, 'ช่วงนี้'), h('span', {}, cur.summary))));
    function todo(items) { return h('ul', { class: 'todo' }, items.map(function (t) { return h('li', {}, t); })); }
    if (role === 'all') {
      add(box, h('div', { class: 'cols' }, ['student', 'teacher', 'company'].map(function (r) {
        return h('div', {}, h('h4', {}, ROLE[r]), todo(cur[r] || []));
      })));
    } else {
      add(box, todo(cur[role] || []));
      if (nxt && !ended) add(box, h('p', { class: 'nextwk' }, h('b', {}, 'ช่วงถัดไป (สัปดาห์ ' + (nxt.from === nxt.to ? nxt.from : nxt.from + '–' + nxt.to) + '): '), (nxt[role] || []).join(' และ ')));
    }
    add(el, box);
  };

  function dateItem(d, showWho) {
    var dd = new Date(D(d.date)), n = daysTo(d.date);
    return h('li', { class: n < 0 ? 'past' : '' },
      h('span', { class: 'day', 'aria-hidden': 'true' }, h('b', {}, String(dd.getUTCDate())), h('span', {}, M[dd.getUTCMonth()])),
      h('div', {}, h('div', { class: 't' }, d.title),
        h('div', { class: 'w' }, th(d.date, 'full'), showWho ? ' สำหรับ' + d.roles.map(function (r) { return ROLE[r]; }).join(' ') : '')),
      h('span', { class: 'left' + (n >= 0 && n <= 7 ? ' soon' : '') }, leftText(d.date)));
  }
  R.deadlines = function (el) {
    var role = el.getAttribute('data-role'), limit = +el.getAttribute('data-limit') || 0, all = el.getAttribute('data-show') === 'all';
    var list = all ? C.deadlines.filter(function (d) { return hasRole(d, role); }) : upcoming(role);
    if (limit) list = list.slice(0, limit);
    var ul = h('ul', { class: 'dates' });
    if (!list.length) add(ul, h('li', {}, h('span', { class: 'empty' }, 'ไม่มีกำหนดส่งที่เหลือในภาคนี้')));
    add(ul, list.map(function (d) { return dateItem(d, !role); }));
    add(el, ul);
  };

  R.notices = function (el) {
    var role = el.getAttribute('data-role'), limit = +el.getAttribute('data-limit') || 0;
    var list = C.announcements.filter(function (a) { return hasRole(a, role); }).sort(function (a, b) { return a.date !== b.date ? (a.date < b.date ? 1 : -1) : (b.important ? 1 : 0) - (a.important ? 1 : 0); });
    if (limit) list = list.slice(0, limit);
    add(el, list.map(function (a) {
      return h('article', { class: 'notice' }, h('div', { class: 'meta' }, h('time', { datetime: a.date }, th(a.date, 'full')), a.important ? h('span', { class: 'tag hot' }, 'สำคัญ') : null),
        h('h3', {}, a.title), h('p', {}, a.body));
    }));
  };

  R.links = function (el) {
    var role = el.getAttribute('data-role'), keys = el.getAttribute('data-keys');
    var list = keys ? keys.split(',').map(function (k) { return linkOf(k.trim()); }).filter(Boolean) : C.links.filter(function (l) { return hasRole(l, role); });
    var ul = h('ul', { class: 'res' + (el.getAttribute('data-variant') === 'grid' ? ' grid' : '') });
    add(ul, list.map(function (l) {
      var u = url(l.url), inner = [h('span', { class: 'ico' }, icon(l.icon)), h('span', {}, h('span', { class: 't' }, l.title), h('span', { class: 'd' }, l.desc))];
      if (!u) return h('li', {}, h('div', { class: 'off', 'aria-disabled': 'true' }, inner, h('span', { class: 'st' }, h('span', { class: 'tag soon' }, 'เร็ว ๆ นี้'))));
      var ext = external(u);
      return h('li', {}, h('a', ext ? { href: u, target: '_blank', rel: 'noopener' } : { href: u }, inner, h('span', { class: 'st', style: 'color:var(--muted)' }, ext ? icon('ext') : null)));
    }));
    add(el, ul);
  };

  function filterBar(el, onPick, opts) {
    var bar = h('div', { class: 'filters', role: 'group', 'aria-label': 'กรองตามบทบาท' });
    opts.forEach(function (o, i) {
      var b = h('button', { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false' }, o[1]);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(bar.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); onPick(o[0]);
      });
      add(bar, b);
    });
    add(el, bar);
  }
  var ROLE_OPTS = [['all', 'ทั้งหมด'], ['student', 'นักศึกษา'], ['teacher', 'อาจารย์'], ['company', 'สถานประกอบการ']];

  R.faq = function (el) {
    var role = el.getAttribute('data-role');
    var wrap = h('div', { class: 'faq' });
    function draw(r) {
      wrap.innerHTML = '';
      add(wrap, C.faq.filter(function (f) { return hasRole(f, r); }).map(function (f) {
        return h('details', {}, h('summary', {}, f.q), h('div', {}, h('p', {}, f.a),
          !role ? h('p', { class: 'small muted', style: 'margin:0' }, 'เกี่ยวข้องกับ' + f.roles.map(function (x) { return ROLE[x]; }).join(' ')) : null));
      }));
    }
    if (el.getAttribute('data-filter') === 'true') filterBar(el, draw, ROLE_OPTS);
    add(el, wrap); draw(role || 'all');
  };

  R.contacts = function (el) {
    var role = el.getAttribute('data-role'), compact = el.getAttribute('data-variant') === 'compact';
    var list = C.contacts.filter(function (c) { return hasRole(c, role); });
    if (compact) {
      add(el, h('ul', { class: 'res' }, list.map(function (c) {
        return h('li', {}, h('div', { class: 'off', style: 'color:inherit' }, h('span', { class: 'ico' }, icon('teacher')),
          h('span', {}, h('span', { class: 't', style: 'color:var(--navy)' }, c.role), h('span', { class: 'd' }, c.name ? c.name + (c.email ? ' ' : '') : (c.hint || 'รอประกาศรายชื่อ'), c.email ? h('a', { href: 'mailto:' + c.email }, c.email) : null)), h('span', {})));
      })));
      return;
    }
    add(el, h('div', { class: 'table' }, h('table', {},
      h('thead', {}, h('tr', {}, ['บทบาท', 'ชื่อ', 'อีเมล', 'ติดต่อเรื่อง'].map(function (t) { return h('th', { scope: 'col' }, t); }))),
      h('tbody', {}, list.map(function (c) {
        return h('tr', {}, h('td', {}, h('b', { style: 'font-family:var(--head);font-weight:600' }, c.role)), h('td', {}, c.name || h('span', { class: 'muted' }, c.hint || 'รอประกาศ')),
          h('td', {}, c.email ? h('a', { href: 'mailto:' + c.email }, c.email) : h('span', { class: 'muted' }, '–')), h('td', {}, c.topic));
      })))));
  };

  R.secoop = function (el) { add(el, secoopBtn()); };
  R.today = function (el) { el.textContent = th(today, 'full'); };
  R.nowlabel = function (el) { el.textContent = nowLabel(); };

  Array.prototype.forEach.call(document.querySelectorAll('[data-c]'), function (el) {
    var f = R[el.getAttribute('data-c')];
    if (f) { try { f(el); } catch (e) { console.error(e); } }
  });

  /* ลิงก์ในเนื้อหาที่อ้างถึง key ใน config: <a data-link="concept">...</a> */
  Array.prototype.forEach.call(document.querySelectorAll('a[data-link]'), function (a) {
    var l = linkOf(a.getAttribute('data-link')), u = l && url(l.url);
    if (u) { a.href = u; if (external(u)) { a.target = '_blank'; a.rel = 'noopener'; } }
    else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.title = 'ลิงก์จะเปิดเร็ว ๆ นี้'; a.classList.add('muted'); }
  });

  /* ไม่ตัดบรรทัดกลางรหัส เช่น SE-COOP ENGSE301 หรือ สก.วศ.04 */
  var re = /(SE-COOP|ENGSE30\d|สก\.วศ\.04)/g, walker = document.createTreeWalker(document.getElementById('main') || body, NodeFilter.SHOW_TEXT), nodes = [], nd;
  while ((nd = walker.nextNode())) { var pn = nd.parentNode.nodeName; if (pn !== 'SCRIPT' && pn !== 'STYLE' && pn !== 'OPTION' && re.test(nd.nodeValue)) nodes.push(nd); re.lastIndex = 0; }
  nodes.forEach(function (t) {
    var frag = document.createDocumentFragment(), last = 0, m, v = t.nodeValue; re.lastIndex = 0;
    while ((m = re.exec(v))) {
      if (m.index > last) frag.appendChild(document.createTextNode(v.slice(last, m.index)));
      frag.appendChild(h('span', { class: 'nw' }, m[0])); last = m.index + m[0].length;
    }
    if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
    t.parentNode.replaceChild(frag, t);
  });
})();
