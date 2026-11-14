import json, sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'; fx = json.loads((root/'test'/'fixtures.json').read_text(encoding='utf-8'))
idx = (src/'Index.html').read_text(encoding='utf-8')
styles = (src/'Styles.html').read_text(encoding='utf-8'); app = (src/'App.html').read_text(encoding='utf-8')
def page(boot, session, handlers):
    shim = """<script>
var FX = %s; try{ %s }catch(e){}
var google = { script: { history: { replace: function(){} }, run: (function(){
  function R(ok, fail){ this.ok=ok; this.fail=fail; }
  var make = function(ok, fail){ return new Proxy({}, { get: function(_, name){
    if (name==='withSuccessHandler') return function(f){ return make(f, fail); };
    if (name==='withFailureHandler') return function(f){ return make(ok, f); };
    return function(){ var h = FX.handlers[name]; setTimeout(function(){ ok && ok(h ? FX[h] : {ok:true}); }, 10); };
  }}); };
  return make(null, null); })() } };
</script>""" % (json.dumps(dict(fx, handlers=handlers), ensure_ascii=False), "localStorage.setItem('sewil_session', %s);" % json.dumps(session) if session else "localStorage.removeItem('sewil_session');")
    html = idx.replace("<?!= include_('Styles') ?>", styles).replace("<?!= include_('App') ?>", app).replace("<?!= bootJson ?>", json.dumps(boot, ensure_ascii=False))
    return html.replace('<head>', '<head>' + shim, 1)
views = {
 'login': (dict(page='', t='', k='', programShort='SE', semester='2/2569', portal='http://localhost:8765/se-wil/', placementDue='13 พฤศจิกายน 2569', agreementDue='16 พฤศจิกายน 2569', coordinator='อาจารย์ธนิต เกตุแก้ว (thanit@rmutl.ac.th)'), None, {}),
 'student': (dict(page='', t='', k='', programShort='SE', semester='2/2569', portal='http://localhost:8765/se-wil/', placementDue='13 พฤศจิกายน 2569', agreementDue='16 พฤศจิกายน 2569', coordinator='อาจารย์ธนิต เกตุแก้ว (thanit@rmutl.ac.th)'), 'S', {'api_me':'me','api_placementGet':'placementGet','api_logList':'logList'}),
 'admin': (dict(page='', t='', k='', programShort='SE', semester='2/2569', portal='http://localhost:8765/se-wil/', placementDue='13 พฤศจิกายน 2569', agreementDue='16 พฤศจิกายน 2569', coordinator='อาจารย์ธนิต เกตุแก้ว (thanit@rmutl.ac.th)'), 'A', {'api_me':'adminMe','api_adminOverview':'adminOverview','api_adminStudent':'adminStudent'}),
 'teacher': (dict(page='', t='', k='', programShort='SE', semester='2/2569', portal='http://localhost:8765/se-wil/', placementDue='13 พฤศจิกายน 2569', agreementDue='16 พฤศจิกายน 2569', coordinator='อาจารย์ธนิต เกตุแก้ว (thanit@rmutl.ac.th)'), 'T', {'api_me':'teacherMe','api_adminOverview':'teacherOverview','api_assignList':'assignTeacher'}),
 'admin_assign': (dict(page='', t='', k='', programShort='SE', semester='2/2569', portal='http://localhost:8765/se-wil/', placementDue='13 พฤศจิกายน 2569', agreementDue='16 พฤศจิกายน 2569', coordinator='อาจารย์ธนิต เกตุแก้ว (thanit@rmutl.ac.th)'), 'A', {'api_me':'adminMe','api_adminOverview':'adminOverview','api_assignList':'assignAdmin'}),
 'supervisor': (dict(page='sv', t='', k='K'*40, programShort='SE', semester='2/2569', portal='http://localhost:8765/se-wil/', placementDue='13 พฤศจิกายน 2569', agreementDue='16 พฤศจิกายน 2569', coordinator='อาจารย์ธนิต เกตุแก้ว (thanit@rmutl.ac.th)'), None, {'api_svGet':'svGet'}),
}
out = root/'test'/'shots'; out.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for name,(boot,sess,hd) in views.items():
        f = out/(name+'.html'); f.write_text(page(boot,sess,hd), encoding='utf-8')
        pg = b.new_page(viewport={'width':1100,'height':900}); errs=[]
        pg.on('console', lambda m, errs=errs: errs.append(m.text) if m.type=='error' else None)
        pg.on('pageerror', lambda e, errs=errs: errs.append(str(e)))
        pg.goto(f.as_uri()); pg.wait_for_timeout(600)
        pg.screenshot(path=str(out/(name+'.png')), full_page=True)
        print(name, 'errors:', [e for e in errs if 'fonts.g' not in e and 'ERR_' not in e])
    b.close()
