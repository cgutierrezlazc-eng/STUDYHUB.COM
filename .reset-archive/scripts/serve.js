const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filename = 'sidebar-proposals.html';
  if (req.url === '/certificates') filename = 'certificate-options.html';
  if (req.url === '/signatures') filename = 'signature-options.html';
  if (req.url === '/cert') { filename = '.claude/cert-preview.html'; }
  if (req.url === '/sidebar') filename = 'sidebar-proposals.html';
  const file = path.join(process.cwd(), filename);
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(8080);
