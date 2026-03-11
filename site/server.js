const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// MIME https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // use index when root is requested
  let filePath = req.url === '/' ? 'index.html' : req.url;
  // sanitize
  filePath = filePath.split('?')[0];
  filePath = path.join(publicDir, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // file not found or other error
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});