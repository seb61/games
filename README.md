# FTS Movie Catalogue

## Server (`server.js`)

The backend uses Node's built in [`http` module](https://nodejs.org/api/http.html) to create a server. Rather than exposing CSV files directly to the client, the server defines two REST-style endpoints:

- **`GET /api/movies`** – reads `private/movies.csv and returns an array of movie objects as JSON.  Each row is parsed into an object containing a title, description, release year, rating, genre, and cover image path.
- **`POST /api/login`** – parses JSON credentials from the request body, compares them against records in `private/users.csv`, and returns a success flag. If the username/password match, the server responds with `{success: true}`; otherwise it returns a `401 Unauthorized` error.

All other requests are handled by a static file server that serves the HTML, CSS, JS, and image assets from the `public` dir.

## React Front-End (`public/app.js`)

The front-end is built using **React** loaded via a CDN. With the following components:
 + Star Rating System, renders five stars and manages their state.
 + Movie Card, a single movie card including its poster and metadata.

## Building the catalogue
1. Install dependencies if required (see `package.json`)
2. From the project root, start the server `npm start`. The server will listen on port 3000 by default.
3. Visit `http://localhost:3000` in your browser.

## Running tests
1. Install dependencies if required (see `package.json`)
2. 
In `app.js`, uncomment these (for tests only): 
```
const React = require('react');
const ReactDOM = require('react-dom');
```
and comment this out (for tests only):
```
ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);
```
3. `npm test` from `site`.