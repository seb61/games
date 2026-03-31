const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

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
 * - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
 * - https://jasonwatmore.com/post/2021/10/09/fetch-error-handling-for-failed-http-responses-and-network-errors
 * - https://nodejs.org/api/crypto.html
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
      return null; // for api
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
      return null; // for api
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

/**
 * hashes a password using sha-256
 * @param {string} password plain text password
 * @returns {string} sha-256 hash of the password
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// GET /api/movies
function handleApiMovies(res) {
  const movies = parseMovies();
  // if null return 500
  if (movies === null) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "Failed to load movies database",
      }),
    );
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(movies));
}

// GET /api/tmdb-search?query=...&limit=...
function handleApiTmdbSearch(req, res) {
  // parse the URL to extract query and limit parameters
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const queryParam = urlObj.searchParams.get("query");
  const limitParam = parseInt(urlObj.searchParams.get("limit"), 10);
  const limit = isNaN(limitParam) ? 5 : Math.max(1, limitParam);

  // reject if no query provided
  if (!queryParam) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ success: false, message: "Query parameter required" }),
    );
    return;
  }

  // ensure an API key is available
  const apiKey = process.env.TMDB_API_KEY || "8e8e6903634e4456e06bdd740af13ca6"; // hardcode cuz y not
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "TMDb API key not configured",
      }),
    );
    return;
  }

  // build the TMDB url
  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(queryParam)}`;

  // send the request
  https
    .get(tmdbUrl, (apiRes) => {
      let data = "";
      // response
      apiRes.on("data", (chunk) => {
        data += chunk.toString();
      });
      apiRes.on("end", () => {
        try {
          const json = JSON.parse(data);
          const results = Array.isArray(json.results) ? json.results : []; // check if array
          // collect poster URls
          const posters = results
            .filter((item) => item.poster_path)
            .slice(0, limit)
            .map(
              (item) => `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, posters: posters }));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              message: "Failed to parse TMDb response",
            }),
          );
        }
      });
    })
    .on("error", (err) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Error communicating with TMDb",
        }),
      );
    });
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
    let creds;

    // parse, if invalid return 400
    try {
      creds = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
      return;
    }

    const { username, password } = creds || {};
    // validate
    if (!username || !password) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Username and password required",
        }),
      );
      return;
    }

    // check user db
    const users = parseUsers();
    if (users === null) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Failed to load users database",
        }),
      );
      return;
    }

    // find matching user
    const hashedInput = hashPassword(password);
    const matched = users.find(
      (u) =>
        u.username === username &&
        (u.password === hashedInput || u.password === password), // can still be plain text
    );

    if (matched) {
      // success
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: true, accountType: matched.accountType }),
      );
    } else {
      // fail
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
      );
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
    let payload;

    // parse
    try {
      payload = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
      return;
    }

    const { username, password, confirmPassword } = payload || {};
    // validate
    if (!username || !password || !confirmPassword) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "All fields are required" }),
      );
      return;
    }

    // check confirm password
    if (password !== confirmPassword) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Passwords do not match" }),
      );
      return;
    }

    // check user db
    const users = parseUsers();
    if (users === null) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Failed to load users database",
        }),
      );
      return;
    }

    // check if exists
    const exists = users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );

    if (exists) {
      // if does not exist
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Username already exists" }),
      );
      return;
    }

    // save to db
    const hashed = hashPassword(password);
    let filePath = path.join(__dirname, "private/users.csv");
    
    const line = `\n${username},${hashed},user`;

    // if fail, return 500
    try {
      fs.appendFileSync(filePath, line);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Failed to save user" }),
      );
      return;
    }

    // success
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, username: username }));
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
  if (req.url.startsWith("/api/tmdb-search") && req.method === "GET") {
    handleApiTmdbSearch(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
