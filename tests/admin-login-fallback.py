import re
import subprocess
import urllib.parse

BASE = 'http://127.0.0.1:5174'


def call(path, body=None, headers=None):
    args = ['curl.exe', '--noproxy', '*', '--max-time', '15', '-sS', '-i', BASE + path]
    for key, value in (headers or {}).items():
        args += ['-H', key + ': ' + value]
    if body is not None:
        args += ['--data-binary', '@-']
    result = subprocess.run(args, input=body, capture_output=True, check=True)
    head, raw = result.stdout.split(b'\r\n\r\n', 1)
    status = int(head.split(b' ')[1])
    response_headers = {}
    for line in head.decode().split('\r\n')[1:]:
        if ': ' in line:
            key, value = line.split(': ', 1)
            response_headers[key.lower()] = value
    return status, raw, response_headers


def check(name, condition):
    assert condition, name
    print('PASS:', name)


status, html, _ = call('/admin/')
form = re.search(rb'<form[^>]*>.*?</form>', html, re.DOTALL)
check('admin login page renders', status == 200 and form is not None)
check('server-rendered form submits with POST', b'method="post"' in form.group(0))
check('server-rendered form targets the login endpoint', b'action="/api/auth/login/"' in form.group(0))
check('server-rendered email field matches the endpoint schema', b'name="email"' in form.group(0))
check('server-rendered password field is submitted', b'name="password"' in form.group(0))

invalid_body = urllib.parse.urlencode(
    {'email': 'fallback-test@example.test', 'password': 'invalid-test-value'}
).encode()
status, _, response_headers = call(
    '/api/auth/login/',
    invalid_body,
    {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': BASE,
    },
)
location = response_headers.get('location', '')
check('native invalid login returns a safe redirect', status == 303 and location.endswith('/admin/?login=invalid'))
check('native invalid login never reflects credentials', 'fallback-test' not in location and 'invalid-test-value' not in location)

status, _, response_headers = call(
    '/api/auth/login/',
    invalid_body,
    {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://attacker.example',
    },
)
check('cross-origin native login is rejected', status == 403 and 'location' not in response_headers)

status, error_html, _ = call('/admin/?login=invalid')
check('native login error renders safely', status == 200 and b'Incorrect email or password.' in error_html)
check('native login error contains no submitted credentials', b'fallback-test' not in error_html and b'invalid-test-value' not in error_html)

status, _, _ = call(
    '/api/auth/login/',
    b'{"email":"owner@example.test","password":"' + (b'x' * 2100) + b'"}',
    {
        'Content-Type': 'application/json',
        'Origin': BASE,
    },
)
check('oversized JSON login keeps its 413 response', status == 413)

valid_body = urllib.parse.urlencode(
    {'email': 'seedy@sites.test', 'password': 'Local-owner-test!6'}
).encode()
status, _, response_headers = call(
    '/api/auth/login/',
    valid_body,
    {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': BASE,
    },
)
check('native valid login redirects to the console', status == 303 and response_headers.get('location', '').endswith('/admin/'))
check('native valid login creates a secure session', 'httponly' in response_headers.get('set-cookie', '').lower())

status, _, response_headers = call('/admin/?username=old%40example.test&password=old-secret')
check('legacy credential query is cleaned immediately', status in (307, 308) and response_headers.get('location', '').endswith('/admin/'))

print('Admin login progressive-enhancement checks passed.')
