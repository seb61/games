// UNCOMMENT THESE 2 ONLY FOR TESTS
// const React = require('react');
// const ReactDOM = require('react-dom');

const { useState, useEffect } = React;

/**
 * Docs:
 * - https://react.dev/reference/react/hooks
 * - https://developer.themoviedb.org/reference/search-movie
 */

// star rating system
function StarRating({ rating, onRate }) {
  const [hoverValue, setHoverValue] = useState(0);
  return React.createElement(
    "div",
    { className: "rating" },
    [1, 2, 3, 4, 5].map((value) => {
      // determine if star should be highlighted
      const isActive = value <= (hoverValue || rating);
      return React.createElement(
        "span",
        {
          key: value,
          className: "star" + (isActive ? " selected" : ""),
          onMouseEnter: () => setHoverValue(value),
          onMouseLeave: () => setHoverValue(0),
          onClick: () => onRate(value),
        },
        "★",
      );
    }),
  );
}

// MovieCard renders a single movie card including its metadata.
function MovieCard({ movie, onRate, onEdit }) {
  return React.createElement("div", { className: "movie-card" }, [
    // edit button at top right of card
    React.createElement(
      "button",
      {
        key: "edit",
        className: "edit-icon-button",
        title: "Edit",
        "aria-label": "Edit movie",
        onClick: () => onEdit && onEdit(movie.id),
      },
      // pencil icon
      React.createElement(
        "svg",
        {
          width: 20,
          height: 20,
          viewBox: "0 0 24 24",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg",
        },
        [
          React.createElement("path", {
            key: "p1",
            d: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z",
            fill: "currentColor",
          }),
          React.createElement("path", {
            key: "p2",
            d: "M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
            fill: "currentColor",
          }),
        ],
      ),
    ),
    // movie image
    React.createElement("img", {
      key: "img",
      src: movie.poster || "",
      alt: `Poster for ${movie.title}`,
    }),
    // movie title
    React.createElement(
      "h2",
      { key: "title", className: "movie-title" },
      movie.title,
    ),
    // movie description
    React.createElement(
      "p",
      { key: "desc", className: "movie-description" },
      movie.description,
    ),
    // rating component
    React.createElement(StarRating, {
      key: "rating",
      rating: movie.rating,
      onRate: (value) => onRate && onRate(movie.id, value),
    }),
  ]);
}

// App manages auth, movie data, and overlays.
function App({ initialLoggedIn = false }) {
  const [movies, setMovies] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  // current user state
  const [currentUser, setCurrentUser] = useState("");
  // overlay state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  // form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  // login states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [nextId, setNextId] = useState(1); // for unique ids
  // tmdb states
  const [posterOptions, setPosterOptions] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState("");
  // editing states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMovieId, setEditMovieId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPosterOptions, setEditPosterOptions] = useState([]);
  const [editSelectedPoster, setEditSelectedPoster] = useState("");

  // search query state for filtering movies
  const [searchQuery, setSearchQuery] = useState("");

  // fetch movies on login
  useEffect(() => {
    if (!loggedIn) return; // if state isnt true
    fetch("/api/movies")
      .then((res) => res.json())
      .then((data) => {
        // maps to MovieCard format
        const transformed = data.map((movie, index) => ({
          id: index + 1,
          title: movie.title,
          description: movie.description,
          poster: movie.coverImage || "",
          rating: Number(movie.rating) || 0,
        }));
        setMovies(transformed);
        setNextId(transformed.length + 1);
      })
      .catch((err) => {
        console.error("Failed to fetch movies:", err);
      });
  }, [loggedIn]);

  // search posters from TMDB
  useEffect(() => {
    if (!newTitle) {
      // wait for title change
      setPosterOptions([]);
      setSelectedPoster("");
      return;
    }
    // calls API after user stops typing for 0.8s
    const handler = setTimeout(() => {
      const apiKey = "8e8e6903634e4456e06bdd740af13ca6";
      const query = encodeURIComponent(newTitle);
      // call the search API
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            // build image
            const options = data.results
              .filter((item) => item.poster_path)
              .slice(0, 5)
              .map(
                (item) => `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              );
            setPosterOptions(options);
            setSelectedPoster(options[0] || "");
          }
        })
        .catch(() => {
          // ignore for now
        });
    }, 800);
    return () => clearTimeout(handler);
  }, [newTitle]);

  // search posters for editing from TMDB
  useEffect(() => {
    if (!showEditModal || !editTitle) {
      // reset when modal closed or no title
      setEditPosterOptions([]);
      setEditSelectedPoster("");
      return;
    }
    // calls API after user stops typing for 0.8s
    const handler = setTimeout(() => {
      const apiKey = "8e8e6903634e4456e06bdd740af13ca6";
      const query = encodeURIComponent(editTitle);
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            const options = data.results
              .filter((item) => item.poster_path)
              .slice(0, 5)
              .map(
                (item) => `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              );
            setEditPosterOptions(options);
            setEditSelectedPoster(options[0] || ""); // default to first option
          }
        })
        .catch(() => {
          // ignore errors for now
        });
    }, 800);
    return () => clearTimeout(handler);
  }, [editTitle, showEditModal]);

  // handle login form
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword,
      }),
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        throw new Error("Unauthorized");
      })
      .then((data) => {
        if (data.success) {
          // change states
          setLoggedIn(true);
          setShowLoginModal(false);
          // store the user for display
          setCurrentUser(data.username || loginUsername);
          // clear fields
          setLoginUsername("");
          setLoginPassword("");
        } else {
          setLoginError(data.message || "Invalid username or password.");
        }
      })
      .catch(() => {
        setLoginError("Invalid username or password.");
      });
  };

  // handle adding a movie (locally)
  const handleAddMovie = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    const desc = newDesc.trim();
    if (!title || !desc) return;

    const newMovie = {
      id: nextId,
      title: title,
      description: desc,
      poster: selectedPoster || "",
      rating: 0,
    };

    setMovies((prev) => [...prev, newMovie]);
    setNextId((id) => id + 1);
    setNewTitle("");
    setNewDesc("");
    setSelectedPoster("");
    setPosterOptions([]);
    setShowAddModal(false);
  };

  // remove last movie
  const handleRemoveMovie = () => {
    setMovies((prev) => prev.slice(0, -1));
  };

  // update rating by id
  const handleRate = (id, value) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rating: value } : m)),
    );
  };

  // open edit modal with selected movie
  const handleEditClick = (id) => {
    const movie = movies.find((m) => m.id === id); // find by id
    if (!movie) return;

    setEditMovieId(id);
    setEditTitle(movie.title);
    setEditDesc(movie.description);
    // init with current poster if exist
    setEditSelectedPoster(movie.poster || "");
    setEditPosterOptions(movie.poster ? [movie.poster] : []);
    setShowEditModal(true);
  };

  // save edits
  const handleSaveEdit = (e) => {
    e.preventDefault();
    const title = editTitle.trim();
    const desc = editDesc.trim();
    if (!title || !desc) return;
    setMovies((prev) =>
      prev.map((m) =>
        m.id === editMovieId
          ? {
              ...m,
              title: title,
              description: desc,
              poster: editSelectedPoster || m.poster,
            }
          : m,
      ),
    );
    // reset states
    setShowEditModal(false);
    setEditMovieId(null);
    setEditTitle("");
    setEditDesc("");
    setEditPosterOptions([]);
    setEditSelectedPoster("");
  };
  // // handle search bar
  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // build DOM
  return React.createElement("div", { className: "app-container" }, [
    // header
    React.createElement("header", { key: "header", className: "top-bar" }, [
      React.createElement(
        "h1",
        { key: "site", className: "site-name" },
        "FTS Movie Catalogue",
      ),
      React.createElement("div", { key: "actions", className: "actions" }, [
        React.createElement("input", {
          key: "searchBar",
          type: "text",
          className: "search-bar",
          placeholder: "Search Movie",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          disabled: !loggedIn,
        }),
        React.createElement(
          "button",
          {
            key: "loginBtn",
            className: "login-icon-button",
            title: "Login",
            "aria-label": "Login",
            onClick: () => setShowLoginModal(true),
          },
          // svg icon for user
          React.createElement(
            "svg",
            {
              width: 24,
              height: 24,
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
            },
            [
              React.createElement("circle", {
                key: "c",
                cx: 12,
                cy: 8,
                r: 4,
                stroke: "currentColor",
                strokeWidth: 2,
              }),
              React.createElement("path", {
                key: "p",
                d: "M4 21c0-4 4-6 8-6s8 2 8 6v1H4v-1z",
                stroke: "currentColor",
                strokeWidth: 2,
              }),
            ],
          ),
        ),
        // username display
        React.createElement(
          "span",
          {
            key: "userDisplay",
            className: "user-display",
          },
          currentUser || "Guest",
        ),
      ]),
    ]),
    // movie grid when logged in
    loggedIn
      ? React.createElement("main", { key: "main", className: "movies-grid" }, [
          // for each movie, render a card
          ...filteredMovies.map((movie) =>
            React.createElement(MovieCard, {
              key: movie.id,
              movie: movie,
              onRate: handleRate,
              onEdit: handleEditClick,
            }),
          ),
          React.createElement(
            "div",
            { key: "addCard", className: "movie-card add-card" },
            React.createElement(
              "button",
              {
                className: "add-card-button",
                onClick: () => setShowAddModal(true),
                disabled: !loggedIn,
              },
              "+ Add Movie",
            ),
          ),
        ])
      : null,
    // add movie overlay
    showAddModal
      ? React.createElement(
          "div",
          { key: "addModal", className: "model-overlay" },
          React.createElement("div", { className: "model" }, [
            React.createElement("h2", { key: "title" }, "Add a Movie"),
            React.createElement(
              "form",
              {
                key: "form",
                className: "movie-form",
                onSubmit: handleAddMovie,
              },
              [
                React.createElement("label", { key: "nameLabel" }, [
                  React.createElement("span", { key: "s" }, "Movie Name"),
                  React.createElement("input", {
                    key: "name",
                    type: "text",
                    value: newTitle,
                    onChange: (e) => setNewTitle(e.target.value),
                    placeholder: "Enter title",
                  }),
                ]),
                React.createElement("label", { key: "descLabel" }, [
                  React.createElement("span", { key: "s" }, "Description"),
                  React.createElement("textarea", {
                    key: "desc",
                    value: newDesc,
                    onChange: (e) => setNewDesc(e.target.value),
                    placeholder: "Enter a short description",
                  }),
                ]),
                // show TMDB poster slider
                posterOptions.length > 0
                  ? React.createElement("div", { key: "posterSection" }, [
                      React.createElement(
                        "span",
                        { key: "label" },
                        "Select Poster",
                      ),
                      React.createElement(
                        "div",
                        { className: "poster-slider", key: "slider" },
                        posterOptions.map((url, idx) =>
                          React.createElement(
                            "div",
                            {
                              key: idx,
                              className:
                                "poster-option" +
                                (selectedPoster === url ? " selected" : ""),
                              onClick: () => setSelectedPoster(url),
                            },
                            React.createElement("img", {
                              src: url,
                              alt: "Poster option",
                            }),
                          ),
                        ),
                      ),
                    ])
                  : null,
                React.createElement(
                  "div",
                  { key: "actions", className: "model-actions" },
                  [
                    React.createElement(
                      "button",
                      {
                        key: "submit",
                        type: "submit",
                        className: "btn btn-confirm",
                      },
                      "Add",
                    ),
                    React.createElement(
                      "button",
                      {
                        key: "cancel",
                        type: "button",
                        className: "btn btn-cancel",
                        onClick: () => {
                          setShowAddModal(false);
                          // reset poster state when canceling
                          setPosterOptions([]);
                          setSelectedPoster("");
                        },
                      },
                      "Cancel",
                    ),
                  ],
                ),
              ],
            ),
          ]),
        )
      : null,
    // edit movie overlay
    showEditModal
      ? React.createElement(
          "div",
          { key: "editModal", className: "model-overlay" },
          React.createElement("div", { className: "model" }, [
            React.createElement("h2", { key: "title" }, "Edit Movie"),
            React.createElement(
              "form",
              {
                key: "form",
                className: "movie-form",
                onSubmit: handleSaveEdit,
              },
              [
                React.createElement("label", { key: "nameLabel" }, [
                  React.createElement("span", { key: "s" }, "Movie Name"),
                  React.createElement("input", {
                    key: "name",
                    type: "text",
                    value: editTitle,
                    onChange: (e) => setEditTitle(e.target.value),
                    placeholder: "Enter title",
                  }),
                ]),
                React.createElement("label", { key: "descLabel" }, [
                  React.createElement("span", { key: "s" }, "Description"),
                  React.createElement("textarea", {
                    key: "desc",
                    value: editDesc,
                    onChange: (e) => setEditDesc(e.target.value),
                    placeholder: "Enter a short description",
                  }),
                ]),
                editPosterOptions.length > 0
                  ? React.createElement("div", { key: "posterSection" }, [
                      React.createElement(
                        "span",
                        { key: "label" },
                        "Select Poster",
                      ),
                      React.createElement(
                        "div",
                        { className: "poster-slider", key: "slider" },
                        editPosterOptions.map((url, idx) =>
                          React.createElement(
                            "div",
                            {
                              key: idx,
                              className:
                                "poster-option" +
                                (editSelectedPoster === url ? " selected" : ""),
                              onClick: () => setEditSelectedPoster(url),
                            },
                            React.createElement("img", {
                              src: url,
                              alt: "Poster option",
                            }),
                          ),
                        ),
                      ),
                    ])
                  : null,
                React.createElement(
                  "div",
                  { key: "actions", className: "model-actions" },
                  [
                    React.createElement(
                      "button",
                      {
                        key: "submit",
                        type: "submit",
                        className: "btn btn-confirm",
                      },
                      "Save",
                    ),
                    React.createElement(
                      "button",
                      {
                        key: "cancel",
                        type: "button",
                        className: "btn btn-cancel",
                        onClick: () => {
                          setShowEditModal(false);
                          setEditMovieId(null);
                          setEditTitle("");
                          setEditDesc("");
                          setEditPosterOptions([]);
                          setEditSelectedPoster("");
                        },
                      },
                      "Cancel",
                    ),
                  ],
                ),
              ],
            ),
          ]),
        )
      : null,
    // login overlay
    showLoginModal
      ? React.createElement(
          "div",
          { key: "loginModal", className: "model-overlay" },
          React.createElement("div", { className: "model" }, [
            React.createElement("h2", { key: "header" }, "Login"),
            // login form handles username/password and submission
            React.createElement(
              "form",
              {
                key: "form",
                className: "login-form",
                onSubmit: handleLogin,
              },
              [
                // username field
                React.createElement("label", { key: "userLabel" }, [
                  React.createElement("span", { key: "s" }, "Username"),
                  React.createElement("input", {
                    key: "user",
                    type: "text",
                    value: loginUsername,
                    onChange: (e) => setLoginUsername(e.target.value),
                    placeholder: "Input username",
                    required: true,
                  }),
                ]),
                // password field
                React.createElement("label", { key: "passLabel" }, [
                  React.createElement("span", { key: "s" }, "Password"),
                  React.createElement("input", {
                    key: "pass",
                    type: "password",
                    value: loginPassword,
                    onChange: (e) => setLoginPassword(e.target.value),
                    placeholder: "Input password",
                    required: true,
                  }),
                ]),
                // error message
                loginError
                  ? React.createElement(
                      "div",
                      { key: "error", className: "login-error" },
                      loginError,
                    )
                  : null,
                // actions for submit/cancel
                React.createElement(
                  "div",
                  { key: "actions", className: "model-actions" },
                  [
                    React.createElement(
                      "button",
                      {
                        key: "loginSubmit",
                        type: "submit",
                        className: "btn btn-confirm",
                      },
                      "Login",
                    ),
                    React.createElement(
                      "button",
                      {
                        key: "loginCancel",
                        type: "button",
                        className: "btn btn-cancel",
                        onClick: () => {
                          setShowLoginModal(false);
                          setLoginError("");
                        },
                      },
                      "Cancel",
                    ),
                  ],
                ),
              ],
            ),
            // registration (not don)
            React.createElement(
              "div",
              { key: "registerPlaceholder", className: "register-placeholder" },
              [
                React.createElement(
                  "span",
                  { key: "text" },
                  "Don't have an account? ",
                ),
                React.createElement(
                  "a",
                  {
                    key: "link",
                    href: "#",
                    onClick: (e) => {
                      e.preventDefault();
                      // TODO: implement
                      alert("not implemented");
                    },
                  },
                  "Register",
                ),
              ],
            ),
          ]),
        )
      : null,

    // floating add button
    loggedIn
      ? React.createElement(
          "button",
          {
            key: "floatingAddBtn",
            className: "floating-add-button",
            onClick: () => setShowAddModal(true),
            title: "Add movie",
            "aria-label": "Add movie",
          },
          "+",
        )
      : null,
  ]);
}

// render the DOM
// COMMENT THIS ONLY FOR TESTS
ReactDOM.render(React.createElement(App), document.getElementById("root"));

// fixed to use React 18 syntax
const { createRoot } = require("react-dom/client");

if (typeof document !== "undefined") {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    const root = createRoot(rootEl);
    root.render(React.createElement(App));
  }
}

// export app to avoid auto render issues
module.exports = App;
