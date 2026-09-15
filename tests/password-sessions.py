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
import sqlite3,hashlib
session_hash=hashlib.sha256(expired_cookie.split('=',1)[1].encode()).hexdigest()
changed=False
for file in Path('.wrangler/state/v3/d1').rglob('*.sqlite'):
 connection=sqlite3.connect(file)
 if connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_sessions'").fetchone():
  rows=connection.execute('UPDATE admin_sessions SET expires_at=0 WHERE token_hash=?',(session_hash,)).rowcount
  connection.commit();changed=changed or rows==1
 connection.close()
check('local session expiry fixture applied',changed)
check('expired session rejected',call('/api/admin/content/',headers={'Cookie':expired_cookie})[0]==401)
for i in range(5):
 call('/')
 check('incorrect attempt rejected '+str(i+1),call('/api/auth/login/',{'email':'seedy@sites.test','password':'invalid'})[0]==401)
call('/')
check('sixth attempt is rate-limited',call('/api/auth/login/',{'email':'seedy@sites.test','password':'invalid'})[0]==429)
for file in Path('.wrangler/state/v3/d1').rglob('*.sqlite'):
 connection=sqlite3.connect(file)
 if connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_login_limits'").fetchone():connection.execute('DELETE FROM admin_login_limits');connection.commit()
 connection.close()
call('/')
check('cross-origin login rejected',call('/api/auth/login/',{'email':'seedy@sites.test','password':'Local-owner-test!6'},headers={'Origin':'https://attacker.example'})[0]==403)
print('Password session lifecycle and rate-limit checks passed against local D1/R2.')
