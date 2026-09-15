import urllib.request, urllib.error, json, copy, time
from pathlib import Path
BASE='http://127.0.0.1:5174'
OWNER={}
OTHER={'oai-authenticated-user-id':'other-user','oai-authenticated-user-email':'other@example.test'}
def call(path,body=None,headers=None,method=None,retry=True):
 import subprocess
 h=dict(headers or {})
 if body is not None and not isinstance(body,bytes):body=json.dumps(body).encode();h['Content-Type']='application/json'
 if body is not None:h.setdefault('Origin',BASE)
 args=['curl.exe','--noproxy','*','--max-time','15','-sS','-i',BASE+path]
 for k,v in h.items():args+=['-H',k+': '+v]
 if body is not None:args+=['--data-binary','@-']
 if method:args+=['-X',method]
 result=subprocess.run(args,input=body,capture_output=True)
 if result.returncode and body is None:
  import time;time.sleep(0.2)
  result=subprocess.run(args,input=body,capture_output=True)
 if result.returncode:raise RuntimeError(result.stderr.decode())
 head,raw=result.stdout.split(b'\r\n\r\n',1)
 status=int(head.split(b' ')[1]);hs={}
 for line in head.decode().split('\r\n')[1:]:
  if ': ' in line:k,v=line.split(': ',1);hs[k]=v
 return status,raw,hs

def check(name,condition):
 assert condition,name
 print('PASS:',name)
check('anonymous content rejected',call('/api/admin/content/')[0]==401)
check('platform identity alone does not grant access',call('/api/admin/content/',headers=OTHER)[0]==401)
check('password login form renders',b'admin-password' in call('/admin/')[1])
call('/')
check('incorrect password rejected',call('/api/auth/login/',{'email':'seedy@sites.test','password':'wrong-password'})[0]==401)
call('/')
status,raw,login_headers=call('/api/auth/login/',{'email':'seedy@sites.test','password':'Local-owner-test!6'})
check('correct credentials accepted',status==200)
cookie=login_headers['Set-Cookie']
check('session cookie has secure attributes',all(value in cookie for value in ['HttpOnly','Secure','SameSite=Strict','Path=/']))
OWNER={'Cookie':cookie.split(';')[0]}
status,raw,headers=call('/api/admin/content/',headers=OWNER)
check('owner can load draft',status==200)
s=json.loads(raw);original=copy.deepcopy(s['content']);version=s['version']
check('admin API is not cached','no-store' in headers.get('Cache-Control',''))
check('forged session rejected',call('/api/admin/content/',headers={'Cookie':'__Host-portfolio_admin='+'a'*64})[0]==401)
bad=copy.deepcopy(original);bad['projects'][0]['demo']='javascript:alert(1)'
check('unsafe project URL rejected',call('/api/admin/save/',{'content':bad,'version':version},headers=OWNER)[0]==400)
updated=copy.deepcopy(original);updated['profile']['name']='Local draft verification'
status,raw,_=call('/api/admin/save/',{'content':updated,'version':version},headers=OWNER)
check('draft saves persistently',status==200);newversion=json.loads(raw)['version']
check('concurrent stale save rejected',call('/api/admin/save/',{'content':original,'version':version},headers=OWNER)[0]==409)
status,html,_=call('/')
Path('work/admin-public-before.html').write_bytes(html)
check('public HTML renders original content before publish',status==200 and b'Vaibhav Sen' in html and b'Local draft verification' not in html)
check('owner preview renders saved draft',b'Local draft verification' in call('/admin/preview/',headers=OWNER)[1])
check('anonymous preview has no draft content',b'Local draft verification' not in call('/admin/preview/')[1])
check('publish succeeds',call('/api/admin/publish/',{'version':newversion},headers=OWNER)[0]==200)
check('public server rendering updates after publish',b'Local draft verification' in call('/')[1])
check('non-image upload rejected',call('/api/admin/upload/',b'<script>alert(1)</script>',headers=OWNER)[0]==400)
status,raw,_=call('/api/admin/upload/',Path('public/projects/budgie-home.jpg').read_bytes(),headers={**OWNER,'X-File-Name':'budgie-test.jpg'})
check('owner image upload succeeds',status==200);upload=json.loads(raw)
check('uploaded image persists and is served',call(upload['url'])[1]==Path('public/projects/budgie-home.jpg').read_bytes())
status,raw,_=call('/api/admin/history/',headers=OWNER);history=json.loads(raw)
check('publication recorded in history',status==200 and len(history)>0)
status,raw,_=call('/api/admin/save/',{'content':original,'version':newversion},headers=OWNER);version=json.loads(raw)['version']
check('restore revision into draft',call('/api/admin/restore/',{'id':history[0]['id'],'version':version},headers=OWNER)[0]==200)
state=json.loads(call('/api/admin/content/',headers=OWNER)[1]);check('restore persisted',state['content']['profile']['name']=='Local draft verification')
status,raw,_=call('/api/admin/save/',{'content':original,'version':state['version']},headers=OWNER)
check('test content reset',status==200)
check('test publication reset',call('/api/admin/publish/',{'version':json.loads(raw)['version']},headers=OWNER)[0]==200)
status,adminhtml,head=call('/admin/',headers=OWNER);Path('work/admin-dashboard.html').write_bytes(adminhtml)
check('owner dashboard renders',status==200 and b'Your publishing flow' in adminhtml)
check('admin page is not cached','no-store' in head.get('Cache-Control',''))




cross=call('/api/admin/save/',{},headers={**OWNER,'Origin':'https://attacker.example'});print('Cross-origin response:',cross[0],cross[1][:300]);check('cross-origin write rejected',cross[0]==403)
call('/') # Separate local proxy authentication contexts.
check('anonymous save rejected',call('/api/admin/save/',{'content':original,'version':version})[0]==401)

call('/')
print('Password login and portfolio editing integration checks passed.')
