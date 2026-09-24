(function(){
  var C = window.ENGSE601 || {open:{}, due:{}};
  var names = {s1:'ครั้งที่ 1 วางแผนก่อนทดสอบ', s2:'ครั้งที่ 2 ออกแบบกรณีทดสอบ', s3:'ครั้งที่ 3 ลงมือทดสอบ', s4:'ครั้งที่ 4 รายงานผลและตัดสินการส่งมอบ'};
  var root = document.querySelector('script[src$="assets/portal.js"]').getAttribute('src').replace('assets/portal.js','');
  document.querySelectorAll('[data-release]').forEach(function(a){
    var k = a.getAttribute('data-release'), b = a.querySelector('.rel-badge');
    if (C.open[k]) { if (b) b.textContent = ''; return; }
    a.removeAttribute('href'); a.classList.add('locked'); a.setAttribute('aria-disabled','true');
    if (b) { b.textContent = ' ยังไม่เปิด'; b.className = 'rel-badge ml-2 text-xs font-medium text-amber-600'; }
  });
  document.querySelectorAll('[data-status]').forEach(function(el){
    var k = el.getAttribute('data-status');
    if (C.current === k) { el.textContent = 'กำลังเรียน'; el.className += ' text-amber-600 font-semibold'; }
    else if (C.open[k]) { el.textContent = 'เปิดแล้ว'; el.className += ' text-emerald-600'; }
    else { el.textContent = 'ยังไม่เปิด'; el.className += ' text-slate-400'; }
  });
  document.querySelectorAll('[data-due]').forEach(function(el){ el.textContent = C.due[el.getAttribute('data-due')] || 'ผู้สอนจะแจ้ง'; });
  var card = document.getElementById('now-card');
  if (card && C.current && names[C.current]) {
    card.classList.remove('hidden');
    document.getElementById('now-title').textContent = names[C.current];
    document.getElementById('now-due').textContent = C.due[C.current] || '';
    document.getElementById('now-link').setAttribute('href', root + 'sessions/' + C.current + '.html');
    var c = document.querySelector('[data-card="' + C.current + '"]'); if (c) c.classList.add('ring-4','ring-amber-400');
  }
})();
