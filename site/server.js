const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
// public dir
const publicDir = path.join(__dirname, "public");

/**
 * Docs:
 * - https://dev.to/michaelishri/dont-expose-your-database-to-the-world-3fke (sceuring db)
 * - https://nodejs.org/api/http.html#class-httpclientrequest (node server setup)
 * - https://developer.mozilla.org/en-US/docs/Glossary/REST & https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API (setting up api's)
 * - https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework (static serving)
 * - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication (auth)
 */

/**
 * Helper to parse the movies DB into an array.
 * @returns {Array} An array of movie objects with metadata
 */
function parseMovies() {
  // try reading from private/movies.csv; if missing fall back to movies.csv
  let filePath = path.join(__dirname, "private/movies.csv");
  let data;

  // get the db
  try {
    data = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    // fallback
    try {
      filePath = path.join(__dirname, "movies.csv");
      data = fs.readFileSync(filePath, "utf8");
    } catch (err2) {
      console.error("Failed to read movies.csv:", err2);
      return [];
    }
  }

  const lines = data.trim().split(/\r?\n/);
  // remove header
  lines.shift();
  const movies = [];

  for (const line of lines) {
    const parts = line.split("|"); // delimiter

    // incase bad line
    if (parts.length < 6) {
      console.error("Invalid line:", line);
      continue;
    }

    const [title, descriptionRaw, releaseYear, rating, genre, cover] = parts;
    // check for quotes around the desc
    const description = descriptionRaw.replace(/^"|"$/g, "");
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
  let filePath = path.join(__dirname, "private/users.csv");
  let data;

  // get the file
  try {
    data = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    // fallback
    try {
      filePath = path.join(__dirname, "users.csv");
      data = fs.readFileSync(filePath, "utf8");
    } catch (err2) {
      console.error("Failed to read users.csv:", err2);
      return [];
    }
  }

  // remove header
  const lines = data.trim().split(/\r?\n/);
  lines.shift();
  const users = [];
  for (const line of lines) {
    const [username, password, accountType] = line.split(",");
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
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(movies));
}

// POST /api/login
function handleApiLogin(req, res) {
  let body = "";
  // receive
  req.on("data", (chunk) => {
    body += chunk.toString();

    // if large, prvent abuse (https://forums.meteor.com/t/picker-how-to-get-post-params/23699)
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on("end", () => {
    try {
      // get creds from body
      const creds = JSON.parse(body);
      const { username, password } = creds;
      const users = parseUsers();
      // find matching user
      const matched = users.find(
        (u) => u.username === username && u.password === password,
      );

      if (matched) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: true, accountType: matched.accountType }),
        );
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, message: "Invalid credentials" }),
        );
      }
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Bad request" }));
    }
  });
}

// POST /api/register
function handleApiRegister(req, res) {
  let body = "";

  // receive
  req.on("data", (chunk) => {
    body += chunk.toString();
    // prevent abuse if large
    if (body.length > 1e6) req.connection.destroy();
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body);
      const { username, password, confirmPassword } = data;
      // validation
      if (!username || !password || !confirmPassword) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "All fields are required",
          }),
        );
        return;
      }
      if (password !== confirmPassword) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, message: "Passwords do not match" }),
        );
        return;
      }
      // check if user exists
      const users = parseUsers();
      const exists = users.some(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );
      if (exists) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "Username already exists",
          }),
        );
        return;
      }
      // save to db
      let filePath = path.join(__dirname, "private/users.csv");
      const line = `\n${username},${password},user`;

      try {
        fs.appendFileSync(filePath, line);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, message: "Failed to save user" }),
        );
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, username: username }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Bad request" }));
    }
  });
}

// Serves static files from the public dir
function serveStatic(req, res) {
  let reqPath = req.url.split("?")[0];
  // prevent searching through dirs
  reqPath = reqPath.replace(/\.\./g, "");

  let filePath;
  if (reqPath === "/" || reqPath === "") {
    filePath = path.join(publicDir, "index.html");
  } else {
    filePath = path.join(publicDir, reqPath);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types
    const mimeTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".json": "application/json",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// Listener
const server = http.createServer((req, res) => {
  if (req.url === "/api/movies" && req.method === "GET") {
    handleApiMovies(res);
    return;
  }
  if (req.url === "/api/login" && req.method === "POST") {
    handleApiLogin(req, res);
    return;
  }
  if (req.url === "/api/register" && req.method === "POST") {
    handleApiRegister(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
