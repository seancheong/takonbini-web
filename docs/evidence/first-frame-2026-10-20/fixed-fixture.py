from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
import urllib.request,re,json,time
import sys
root=Path(sys.argv[1]);root.mkdir(exist_ok=True)
host='https://takonbini-ad0msa2cd-sean-cheong-zhen-xiongs-projects.vercel.app'
url=host+'/products/0d41fc1137e1762b66b05d4539990c2b?lang=en'
html=urllib.request.urlopen(url,timeout=30).read().decode()
html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S|re.I)
csspath=re.search(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"',html).group(1)
css=urllib.request.urlopen(host+csspath,timeout=30).read();(root/'style.css').write_bytes(css)
source=json.load(open(sys.argv[2]))['images'][0]
from urllib.parse import urlencode
image=urllib.request.urlopen(host+'/api/image?'+urlencode({'url':source,'w':960}),timeout=30).read();(root/'image.webp').write_bytes(image)
html=re.sub(r'<link\b[^>]*>',lambda m:'<link rel="stylesheet" href="/style.css">' if 'rel="stylesheet"' in m.group() else '',html)
html=re.sub(r'<img\b[^>]*>',lambda m:re.sub(r'\s(?:src|srcSet|srcset)="[^"]*"','',m.group()).replace('<img','<img src="/image.webp"',1),html)
(root/'page.html').write_text(html)
minimal='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:20px;font:16px system-ui}img{display:block;width:330px;height:330px;object-fit:contain}</style></head><body><h1>Fixed product photo</h1><img src="/image.webp" width="330" height="330" fetchpriority="high" alt="Product photo"></body></html>'
(root/'minimal.html').write_text(minimal)
class H(BaseHTTPRequestHandler):
 def do_GET(self):
  path=self.path.split('?')[0]
  name={'/full':'page.html','/minimal':'minimal.html','/style.css':'style.css','/image.webp':'image.webp'}.get(path)
  if not name:self.send_response(404);self.end_headers();return
  time.sleep(.25 if name.endswith('.html') else .05)
  self.send_response(200);self.send_header('Content-Type',{'html':'text/html; charset=utf-8','css':'text/css','webp':'image/webp'}[name.split('.')[-1]]);self.send_header('Cache-Control','no-store');self.send_header('Content-Security-Policy',"script-src 'none'; connect-src 'none'");self.end_headers();self.wfile.write((root/name).read_bytes())
 def log_message(self,*args):pass
print('Fixed script-free SSR and minimal fixtures, only local image/CSS requests, port3044',flush=True)
ThreadingHTTPServer(('127.0.0.1',3044),H).serve_forever()
