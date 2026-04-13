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
In `app.js`, uncomment these 3 (for tests only): 
```
const React = require('react');
const ReactDOM = require('react-dom');
const { useEffect, useState } = React;
```
and comment these out (for tests only):
```
const { useEffect } = React;
```
and
```
ReactDOM.render(React.createElement(App), document.getElementById("root"));
```

Also in `StarRating.js`, uncomment these 2 (for tests only):
```
const React = require('react');
const ReactDOM = require('react-dom');
```
3. `npm test app` from `site`.

## User In/Out Application

This section is a simple explanation for an end-user, as to how to access and use the FTS Movie Catalogue

### Running the system
1. Install dependencies if required (see `package.json`)
2. Change directory to `site/`
3. Start the server with `npm start`. The server will listen on port 3000 by default.
4. Visit `http://localhost:3000` in your browser.

### Login
1. Enter your chosen username and password into the login screen
2. If wrong login credentials are given, then an error message will pop up

### Registration
1. Click on "Register" on the login screen
2. Entering chosen username and password
3. Your account has successfully been registered, and from now on, you may access it through the login screen instead

### Features
- Search Bar/Filter
- Main Catalogue of all movies
- Personal Movie Catalogue
- Changing Password
- Logging Out

### Adding Movies to Home Catalogue
1. In the bottom right, there is a `+` button. Click it.
2. Type in the movie name into the allocated slot
3. A drop down list will appear, where multiple movies will pop up. Select the movie you had in mind
4. Press `Add` and the movie will be available on the movie catalogue

### Adding Movies to Personal Catalogue
1. Press the folder icon in the top right
2. In the middle, there is a dotted outline with a `+` in the middle. Click it.
3. Type in the movie name into the allocated slot
4. A drop down list will appear, where multiple movies will pop up. Select the movie you had in mind
5. Press `Add` and the movie will be available on the personal catalogue

### Changing Password
1. In the top right, click your username
2. A dropdown menu appears. Click settings
3. Enter the new password into New Password and Confirm Password

### Logging Out
1. In the top right, click your username
2. A dropdown menu appars. Click logout
