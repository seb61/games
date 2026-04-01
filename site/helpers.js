const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Docs:
 * - https://dev.to/michaelishri/dont-expose-your-database-to-the-world-3fke
 * - https://nodejs.org/api/crypto.html
 * - https://nodejs.org/api/fs.html
 * - https://nodejs.org/api/path.html
 */

// directory to store user catalogues
const userCatalogDir = path.join(__dirname, "private", "catalogues");
// ensure directory exists
if (!fs.existsSync(userCatalogDir)) {
  fs.mkdirSync(userCatalogDir, { recursive: true });
}

/**
 * sanitizes a username so it is safe to use as a filename
 * @param {string} username the account username
 * @returns {string} a safe string to use as a filename
 */
function sanitizeUsername(username) {
  if (typeof username !== "string") return "user";
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  return safe || "user";
}

/**
 * builds the full path to a users catalogue file
 * @param {string} username the account username
 * @returns {string} the full path to the catalogue CSV
 */
function getUserCatalogPath(username) {
  const safeName = sanitizeUsername(username);
  const filename = `${safeName}.csv`;
  const fullPath = path.join(userCatalogDir, filename);

  // create file with header if missing
  if (!fs.existsSync(fullPath)) {
    try {
      fs.writeFileSync(
        fullPath,
        "title|description|releaseYear|rating|genre|coverImage\n",
        "utf8",
      );
    } catch (err) {
      console.error("Failed to create user catalogue file:", err);
    }
  }
  return fullPath;
}

/**
 * reads a user's catalogue from disk
 * @param {string} username the account username
 * @returns {Array} an array of movie objects
 */
function readUserCatalogue(username) {
  const filePath = getUserCatalogPath(username);
  let content;

  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Failed to read catalogue for", username, err);
    return [];
  }

  const lines = content.trim().split(/\r?\n/);
  // remove header
  lines.shift();
  const movies = [];
  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split("|");
    if (parts.length < 6) continue;

    const [title, descriptionRaw, releaseYear, rating, genre, cover] = parts;
    // remove quotes from description
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
 * writes a users catalogue to disk
 * @param {string} username the account username
 * @param {Array} movies the movies array to persist
 * @returns {boolean} true = success
 */
function writeUserCatalogue(username, movies) {
  const filePath = getUserCatalogPath(username);
  const lines = [
    "title|description|releaseYear|rating|genre|coverImage",
    ...movies.map((m) => {
      // escape pipes
      let desc = m.description || "";
      desc = desc.replace(/\|/g, " ");

      // wrap in quotes if contains commas or newlines
      if (/[,\n]/.test(desc)) {
        desc = `"${desc.replace(/"/g, '"')}"`;
      }
      return [
        m.title || "",
        desc,
        m.releaseYear || "",
        m.rating || "",
        m.genre || "",
        m.coverImage || "",
      ].join("|");
    }),
  ];
  try {
    fs.writeFileSync(filePath, lines.join("\n"), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write catalogue for", username, err);
    return false;
  }
}

/**
 * reads all user catalogues and merges them into a single list
 * @returns {Array} a list of movies for the global catalogue
 */
function readGlobalCatalogue() {
  let files;

  try {
    files = fs.readdirSync(userCatalogDir);
  } catch (err) {
    console.error("Failed to list user catalogues", err);
    return [];
  }

  const map = new Map();
  for (const file of files) {
    if (!file.endsWith(".csv")) continue;

    const username = file.replace(/\.csv$/, "");
    const movies = readUserCatalogue(username);
    for (const movie of movies) {
      const key = movie.title.trim().toLowerCase();
      if (!key) continue;

      const ratingNum = parseFloat(movie.rating);
      const validRating = !isNaN(ratingNum) ? ratingNum : null;
      if (map.has(key)) {
        const agg = map.get(key);
        if (validRating !== null) agg.ratings.push(validRating);
      } else {
        map.set(key, {
          title: movie.title,
          description: movie.description,
          releaseYear: movie.releaseYear,
          coverImage: movie.coverImage,
          ratings: validRating !== null ? [validRating] : [],
        });
      }
    }
  }
  const result = [];
  // average ratings
  for (const [, value] of map) {
    const avg =
      value.ratings.length > 0
        ? value.ratings.reduce((a, b) => a + b, 0) / value.ratings.length
        : 0;
    const ftsRating = avg ? avg.toFixed(1) : "";
    result.push({
      title: value.title,
      description: value.description,
      releaseYear: value.releaseYear,
      coverImage: value.coverImage,
      ftsRating: ftsRating,
    });
  }
  return result;
}

/**
 * parses the users.csv file into an array of user objects
 * @returns {Array|null} an array of user objects or null on error
 */
function parseUsers() {
  let filePath = path.join(__dirname, "private/users.csv");
  let data;

  try {
    data = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    try {
      filePath = path.join(__dirname, "users.csv");
      data = fs.readFileSync(filePath, "utf8");
    } catch (err2) {
      console.error("Failed to read users.csv:", err2);
      return null;
    }
  }

  const lines = data.trim().split(/\r?\n/); // remove header
  lines.shift();
  const users = [];
  for (const line of lines) {
    if (!line) continue;
    const parts = line.split(",");
    const usernameRaw = parts[0];
    const passwordRaw = parts.length > 1 ? parts[1] : "";
    const accountTypeRaw = parts.length > 2 ? parts[2] : "";
    const username = usernameRaw ? usernameRaw.trim() : "";
    const password = passwordRaw ? passwordRaw.trim() : "";
    const accountType = accountTypeRaw ? accountTypeRaw.trim() : "";
    users.push({ username, password, accountType });
  }
  return users;
}

/**
 * hashes a password using sha-256
 * @param {string} password the plain text password
 * @returns {string} the hex hash of the password
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

module.exports = {
  sanitizeUsername,
  getUserCatalogPath,
  readUserCatalogue,
  writeUserCatalogue,
  readGlobalCatalogue,
  parseUsers,
  hashPassword,
};