const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // sanitize
  let safePath = req.url.split('?')[0];
  safePath = safePath.replace(/\.\./g, '');

  // default to index
  let filePath = path.join(__dirname, 'public', safePath);
  if (safePath === '/' || safePath === '') {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  // determine content type/ext
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream'; // default

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});