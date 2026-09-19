const http = require('http');
const fs = require('fs');
const path = require('path');
const port = Number(process.env.PORT || 3000);
const root = __dirname;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') {
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify({ok:true, app:'parte-accidente-allzone'}));
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const body = fs.readFileSync(path.join(root, 'index.html'));
    res.writeHead(200, {
      'content-type':'text/html; charset=utf-8',
      'cache-control':'public, max-age=60, must-revalidate',
      'x-content-type-options':'nosniff',
      'referrer-policy':'strict-origin-when-cross-origin'
    });
    return res.end(body);
  }
  res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
  res.end('No encontrado');
});
server.listen(port, '0.0.0.0', () => console.log(`Parte Accidente listening on ${port}`));
