const http = require('http');
const fs = require('fs');
const path = require('path');


const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');


/**
 * Helper to parse the movies DB into an array.
 * @returns {Array} An array of movie objects with metadata
 */
function parseMovies() {
  const filePath = path.join(__dirname, '/private/movies.csv');
  let data;

  // get the db
  try {
    data = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Failed to read movies.csv:', err);
    return [];
  }

  const lines = data.trim().split(/\r?\n/);
  // remove header
  lines.shift();
  const movies = [];
  for (const line of lines) {
    // split by delimiter
    const parts = line.split('|');

    // in case bad line
    if (parts.length < 6) {
      console.error('Invalid line:', line);
      continue;
    }

    const [title, descriptionRaw, releaseYear, rating, genre, cover] = parts;
    // sometimes has quotes, so remove them
    const description = descriptionRaw.replace(/^"|"$/g, '');
    movies.push({
      title: title.trim(),
      description: description.trim(),
      releaseYear: releaseYear.trim(),
      rating: rating.trim(),
      genre: genre.trim(),
      coverImage: cover.trim(),
    });
  }
  return movies;
}

/**
 * Helper to parse the users DB into an array.
 * @returns {Array} An array of user objects with metadata
 */
function parseUsers() {
  const filePath = path.join(__dirname, '/private/users.csv');
  let data;

  // get the file
  try {
    data = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Failed to read users.csv:', err);
    return [];
  }

  // remove header
  const lines = data.trim().split(/\r?\n/);
  lines.shift();

  // add to array
  const users = [];
  for (const line of lines) {
    const [username, password, accountType] = line.split(',');
    users.push({
      username: username.trim(),
      password: password.trim(),
      accountType: accountType.trim(),
    });
  }
  return users;
}

// GET /api/movies
function handleApiMovies(res) {
  const movies = parseMovies();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(movies));
}

// POST /api/login
function handleApiLogin(req, res) {
  let body = '';
  // receive
  req.on('data', (chunk) => {
    body += chunk.toString();

    // if large, prvent abuse
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on('end', () => {
    try {
      // get creds from the body
      const creds = JSON.parse(body); 
      const { username, password } = creds;
      const users = parseUsers();
      // find a matching user in db
      const matched = users.find(
        (u) => u.username === username && u.password === password
      );

      if (matched) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ success: true, accountType: matched.accountType })
        );
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ success: false, message: 'Invalid credentials' })
        );
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Bad request' }));
    }
  });
}

// Serves static files from the public dir
function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  // prevent searching through parent directories
  reqPath = reqPath.replace(/\.\./g, '');

  let filePath;
  if (reqPath === '/' || reqPath === '') {
    filePath = path.join(publicDir, 'index.html'); // send them to home page if no page request
  } else {
    filePath = path.join(publicDir, reqPath);
  }

  // find the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.json': 'application/json',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Request listener
const server = http.createServer((req, res) => {
  if (req.url === '/api/movies' && req.method === 'GET') {
    handleApiMovies(res);
    return;
  }
  if (req.url === '/api/login' && req.method === 'POST') {
    handleApiLogin(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});