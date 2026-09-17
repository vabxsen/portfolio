import urllib.request, urllib.error, json, copy, time
from pathlib import Path
BASE='http://localhost:5174'
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
  if ': ' in line:k,v=line.split(': ',1);hs[k.lower()]=v
 return status,raw,hs

def check(name,condition):
 assert condition,name
 print('PASS:',name)
status,_,login_headers=call('/api/auth/login/',{'email':'seedy@sites.test','password':'Local-owner-test!6'})
check('password login succeeds',status==200)
OWNER={'Cookie':login_headers['set-cookie'].split(';')[0]}
check('logout succeeds',call('/api/auth/logout/',{},headers=OWNER)[0]==200)
check('logged-out session rejected',call('/api/admin/content/',headers=OWNER)[0]==401)
call('/')
status,_,login_headers=call('/api/auth/login/',{'email':'seedy@sites.test','password':'Local-owner-test!6'})
check('fresh login succeeds',status==200)
expired_cookie=login_headers['set-cookie'].split(';')[0]
import hashlib
session_hash=hashlib.sha256(expired_cookie.split('=',1)[1].encode()).hexdigest()
session_file=Path('.local-data/auth/sessions/'+session_hash+'.json')
session=json.loads(session_file.read_text())
session['expires_at']=0
session_file.write_text(json.dumps(session))
changed=session_file.exists()
check('local session expiry fixture applied',changed)
check('expired session rejected',call('/api/admin/content/',headers={'Cookie':expired_cookie})[0]==401)
for i in range(5):
 call('/')
 check('incorrect attempt rejected '+str(i+1),call('/api/auth/login/',{'email':'seedy@sites.test','password':'invalid'})[0]==401)
call('/')
check('sixth attempt is rate-limited',call('/api/auth/login/',{'email':'seedy@sites.test','password':'invalid'})[0]==429)
check('spoofed Cloudflare IP header does not reset the limit',call('/api/auth/login/',{'email':'seedy@sites.test','password':'invalid'},headers={'CF-Connecting-IP':'203.0.113.7'})[0]==429)
check('blocked attempts do not count toward the shared limit',json.loads(Path('.local-data/auth/login-limits.json').read_text())['all']['attempts']==5)
Path('.local-data/auth/login-limits.json').unlink(missing_ok=True)
call('/')
check('cross-origin login rejected',call('/api/auth/login/',{'email':'seedy@sites.test','password':'Local-owner-test!6'},headers={'Origin':'https://attacker.example'})[0]==403)
print('Password session lifecycle and rate-limit checks passed against local storage.')
