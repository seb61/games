const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const {
  getUserCatalogPath,
  readUserCatalogue,
  writeUserCatalogue,
  readGlobalCatalogue,
  parseUsers,
  hashPassword,
} = require("./helpers");

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


const userCatalogDir = path.join(__dirname, "private", "catalogues");

/**
 * GET /api/my-catalogue?username=...
 * returns the logged in users personal movie catalogue
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleApiMyCatalogue(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const username = urlObj.searchParams.get("username");

  if (!username) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "Username parameter required",
      }),
    );
    return;
  }

  const movies = readUserCatalogue(username);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, movies: movies }));
}

/**
 * GET /api/global-catalogue
 * returns the combined catalogue from all users, with average ratings
 * @param {http.ServerResponse} res
 */
function handleApiGlobalCatalogue(res) {
  const list = readGlobalCatalogue();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, movies: list }));
}

/**
 * POST /api/save-catalogue?username=...
 * saves the provided movie list as the users personal catalogue
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleApiSaveCatalogue(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const username = urlObj.searchParams.get("username");

  if (!username) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "Username parameter required",
      }),
    );
    return;
  }

  // read body
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    let payload;

    try {
      payload = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Invalid JSON body" }));
      return;
    }

    if (!payload || !Array.isArray(payload.movies)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Missing movies array" }),
      );
      return;
    }

    const ok = writeUserCatalogue(username, payload.movies);
    if (!ok) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Failed to save catalogue" }),
      );
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
  });
}

/**
 * DELETE /api/delete-movie?title=...
 * deletes all entries of a movie with the given title from all user catalogues
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleApiDeleteMovie(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const titleParam = urlObj.searchParams.get("title");

  if (!titleParam) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ success: false, message: "Title parameter required" }),
    );
    return;
  }

  const key = titleParam.trim().toLowerCase();
  let files;

  try {
    files = fs.readdirSync(userCatalogDir);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ success: false, message: "Failed to list catalogues" }),
    );
    return;
  }

  try {
    for (const file of files) {
      if (!file.endsWith(".csv")) continue;
      const username = file.replace(/\.csv$/, ""); // get username from filename
      const movies = readUserCatalogue(username);

      // filter out entries with matching title
      const filtered = movies.filter(
        (m) => m.title.trim().toLowerCase() !== key,
      );
      if (filtered.length !== movies.length) {
        writeUserCatalogue(username, filtered);
      }
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ success: false, message: "Failed to delete movie" }),
    );
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true }));
}

/**
 * GET /api/users
 * returns a list of all users with their account types *ADMIN*
 * @param {http.ServerResponse} res
 */
function handleApiUsers(res) {
  const users = parseUsers();

  if (!users) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "Failed to load users database",
      }),
    );
    return;
  }

  // strip password before returning
  const list = users.map((u) => ({
    username: u.username,
    accountType: u.accountType,
  }));
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, users: list }));
}

/**
 * POST /api/update-user
 * updates a users information
 * responses:
 * - 400 for missing or invalid payload
 * - 404 if the target user does not exist
 * - 409 if the new username is already taken
 * - 500 on read/write errors
 * - 200 on success
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleApiUpdateUser(req, res) {
  let body = "";

  // prevent abuse
  req.on("data", (chunk) => {
    body += chunk.toString();
    if (body.length > 1e6) req.destroy();
  });

  req.on("end", () => {
    let payload;

    try {
      payload = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
      return;
    }

    const { targetUsername, newUsername, newPassword, newAccountType } =
      payload || {};
    if (!targetUsername) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "targetUsername is required",
        }),
      );
      return;
    }

    // load users
    const users = parseUsers();
    if (!users) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Failed to load users database",
        }),
      );
      return;
    }

    // find index
    const idx = users.findIndex((u) => u.username === targetUsername);
    if (idx === -1) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "User not found" }));
      return;
    }

    // duplicate check if changing username
    if (newUsername && newUsername !== targetUsername) {
      const duplicate = users.some((u) => u.username === newUsername);
      if (duplicate) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "Username already exists",
          }),
        );
        return;
      }
    }

    // update user object
    let updatedUsername = targetUsername;
    if (newUsername && newUsername !== targetUsername) {
      updatedUsername = newUsername;
      users[idx].username = newUsername;
      // rename catalogue file
      try {
        const oldPath = getUserCatalogPath(targetUsername);
        const newPath = getUserCatalogPath(newUsername);
        // if old file exists and new doesnt exist, rename
        if (fs.existsSync(oldPath)) {
          if (oldPath !== newPath) {
            fs.renameSync(oldPath, newPath);
          }
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "Failed to rename catalogue",
          }),
        );
        return;
      }
    }

    // update password if provided
    if (newPassword) {
      users[idx].password = hashPassword(newPassword);
    }
    // update account type if provided
    if (newAccountType) {
      users[idx].accountType = newAccountType;
    }
    // write updated users file
    const lines = [
      "username,password,account-type",
      ...users.map((u) => `${u.username},${u.password},${u.accountType}`),
    ];
    try {
      const filePath = path.join(__dirname, "private/users.csv");
      fs.writeFileSync(filePath, lines.join("\n"), "utf8");
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Failed to update users database",
        }),
      );
      return;
    }
    // success
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, username: updatedUsername }));
  });
}

const PORT = process.env.PORT || 3000;
// public dir
const publicDir = path.join(__dirname, "public");

/**
 * helper to parse the movies DB into an array
 * @returns {Array} an array of movie objects
 */
function parseMovies() {
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

/**
 * GET /api/tmdb-details?query=...
 * returns basic metadata for the movie matching the query
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleApiTmdbDetails(req, res) {
  // parse
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const queryParam = urlObj.searchParams.get("query");

  if (!queryParam) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "Query parameter required",
      }),
    );
    return;
  }

  // ensure API key exists
  const apiKey = process.env.TMDB_API_KEY || "8e8e6903634e4456e06bdd740af13ca6";
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "TMDB API key not configured",
      }),
    );
    return;
  }

  // call TMDB search API
  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
    queryParam,
  )}`;
  https
    .get(tmdbUrl, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => {
        data += chunk.toString();
      });

      apiRes.on("end", () => {
        try {
          const json = JSON.parse(data);
          const results = Array.isArray(json.results) ? json.results : [];

          if (results.length === 0) {
            // no matches found
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: false,
                message: "No matching movie found",
              }),
            );
            return;
          }

          // pick the first result
          const first = results[0];
          let releaseYear = "";
          if (first.release_date) {
            // extract year
            const year = first.release_date.split("-")[0];
            releaseYear = year;
          }

          // vote_average
          const imdbRating =
            typeof first.vote_average === "number"
              ? String(first.vote_average)
              : "";

          // movie description
          const description =
            typeof first.overview === "string" && first.overview.trim().length
              ? first.overview.trim()
              : "";

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              releaseYear: releaseYear,
              imdbRating: imdbRating,
              description: description,
            }),
          );
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              message: "Failed to parse TMDB response",
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
          message: "Failed to fetch data from TMDB",
        }),
      );
    });
}

/**
 * GET /api/tmdb-suggestions?query=...&limit=...
 * returns an array of movie suggestions matching the query
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleApiTmdbSuggestions(req, res) {
  // parse
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const queryParam = urlObj.searchParams.get("query");
  const limitParam = parseInt(urlObj.searchParams.get("limit"), 10);
  const limit = isNaN(limitParam) ? 5 : Math.max(1, limitParam);

  // require a search query
  if (!queryParam) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ success: false, message: "Query parameter required" }),
    );
    return;
  }
  // ensure API key exists
  const apiKey = process.env.TMDB_API_KEY || "8e8e6903634e4456e06bdd740af13ca6";
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "TMDB API key not configured",
      }),
    );
    return;
  }
  // call TMDB search API
  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
    queryParam,
  )}`;
  https
    .get(tmdbUrl, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => {
        data += chunk.toString();
      });

      apiRes.on("end", () => {
        try {
          const json = JSON.parse(data);
          const results = Array.isArray(json.results) ? json.results : []; // check if results is array

          if (results.length === 0) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: false,
                message: "No matching movie found",
              }),
            );
            return;
          }

          // build suggestions array
          const suggestions = results.slice(0, limit).map((item) => {
            // extract year
            let releaseYear = "";
            if (item.release_date) {
              releaseYear = item.release_date.split("-")[0];
            }

            const imdbRating =
              typeof item.vote_average === "number"
                ? String(item.vote_average)
                : "";

            const description =
              typeof item.overview === "string" && item.overview.trim().length
                ? item.overview.trim()
                : "";

            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : "";

            return {
              title: item.title || item.original_title || "",
              releaseYear,
              imdbRating,
              description,
              poster,
            };
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, results: suggestions }));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              message: "Failed to parse TMDB response",
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
          message: "Failed to fetch TMDB data",
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

// serves static files
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
  if (req.url.startsWith("/api/tmdb-suggestions") && req.method === "GET") {
    handleApiTmdbSuggestions(req, res);
    return;
  }
  if (req.url.startsWith("/api/tmdb-details") && req.method === "GET") {
    handleApiTmdbDetails(req, res);
    return;
  }
  if (req.url.startsWith("/api/my-catalogue") && req.method === "GET") {
    handleApiMyCatalogue(req, res);
    return;
  }
  if (req.url.startsWith("/api/global-catalogue") && req.method === "GET") {
    handleApiGlobalCatalogue(res);
    return;
  }
  if (req.url.startsWith("/api/save-catalogue") && req.method === "POST") {
    handleApiSaveCatalogue(req, res);
    return;
  }
  if (req.url.startsWith("/api/delete-movie") && req.method === "DELETE") {
    handleApiDeleteMovie(req, res);
    return;
  }
  if (req.url === "/api/users" && req.method === "GET") {
    handleApiUsers(res);
    return;
  }
  if (req.url === "/api/update-user" && req.method === "POST") {
    handleApiUpdateUser(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
