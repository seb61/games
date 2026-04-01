// UNCOMMENT THESE 2 ONLY FOR TESTS
// const React = require('react');
// const ReactDOM = require('react-dom');

const { useEffect } = React;

/**
 * Docs:
 * - https://react.dev/reference/react/hooks
 * - https://developer.themoviedb.org/reference/search-movie
 * - https://www.geeksforgeeks.org/reactjs/how-to-hide-your-api-keys-from-public-in-reactjs/
 * - https://dzone.com/articles/hide-your-api-keys-with-an-api-proxy-server
 * - https://www.geeksforgeeks.org/software-engineering/dont-repeat-yourselfdry-in-software-development/
 */

// helper func to search for posters
function searchPosters(title, limit = 5) {
  const query = encodeURIComponent(title);
  return fetch(`/api/tmdb-search?query=${query}&limit=${limit}`)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.success && Array.isArray(data.posters)) {
        return data.posters;
      }
      return [];
    })
    .catch(() => []);
}

// App manages auth, movie data, and overlays.
function App({ initialLoggedIn = false }) {
  const [movies, setMovies] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
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
  // user session states
  const [currentUser, setCurrentUser] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // registration
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [registerError, setRegisterError] = useState("");
  // admin or user
  const [accountType, setAccountType] = useState("");
  // account dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);
  // seach query state
  const [searchQuery, setSearchQuery] = useState("");
  // poster search overlay states
  const [showPosterSearchModal, setShowPosterSearchModal] = useState(false);
  const [posterSearchInput, setPosterSearchInput] = useState("");
  const [posterSearchResults, setPosterSearchResults] = useState([]);
  const [posterSearchContext, setPosterSearchContext] = useState("");
  // metadata states
  const [autoReleaseYear, setAutoReleaseYear] = useState("");
  const [autoImdbRating, setAutoImdbRating] = useState("");
  const [editReleaseYear, setEditReleaseYear] = useState(""); // if editing
  const [editImdbRating, setEditImdbRating] = useState("");
  // moviecard suggestions states
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [editTitleSuggestions, setEditTitleSuggestions] = useState([]);
  // admin settings states
  const [settingsUsers, setSettingsUsers] = useState([]);
  // settings form states
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  // currently displayed page
  const [view, setView] = useState("global");
  // personal and global catalogues
  const [myMovies, setMyMovies] = useState([]);
  const [globalMovies, setGlobalMovies] = useState([]);

  // cookie check
  useEffect(() => {
    // parse cookies into a map
    const cookieMap = {};
    // get key pairs
    document.cookie.split(";").forEach((c) => {
      const [name, ...rest] = c.trim().split("=");
      if (!name) return;
      cookieMap[name] = decodeURIComponent(rest.join("="));
    });

    // log in the user if cookie exists
    const savedUser = cookieMap["fts_user"];
    if (savedUser) {
      setCurrentUser(savedUser);
      const savedType = cookieMap["fts_type"] || "";
      setAccountType(savedType);
      setLoggedIn(true);
      setShowLoginModal(false);
      // refresh catalogues and default to global view
      fetchMyCatalogue();
      fetchGlobalCatalogue();
      setView("global");
    }
  }, []);

  // switch between global and personal catalogues
  useEffect(() => {
    if (view === "global") {
      setMovies(globalMovies);
    } else {
      setMovies(myMovies);
    }
  }, [view, globalMovies, myMovies]); // update

  // init data fetch on login
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    // fetch personal catalogue
    fetchMyCatalogue();
    // fetch global catalogue
    fetchGlobalCatalogue();
    // show global catalogue by default
    setView("global");
  }, [loggedIn, currentUser]);

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
      // fetch
      searchPosters(newTitle, 5).then((options) => {
        setPosterOptions(options);
        setSelectedPoster(options[0] || "");
      });
    }, 800);
    return () => clearTimeout(handler);
  }, [newTitle]);

  // fetch possible movies matching input
  useEffect(() => {
    // if input is empty, clear suggestions
    if (!newTitle) {
      setTitleSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      fetch(
        `/api/tmdb-suggestions?query=${encodeURIComponent(newTitle)}&limit=5`,
      )
        .then(async (res) => {
          let data = {};

          try {
            data = await res.json();
          } catch (err) {
            data = {};
          }

          // only update if response is ok and data is valid
          if (res.ok && data && data.success && Array.isArray(data.results)) {
            setTitleSuggestions(data.results);
          } else {
            setTitleSuggestions([]);
          }
        })
        .catch(() => {
          setTitleSuggestions([]);
        });
    }, 800);
    return () => clearTimeout(handler);
  }, [newTitle]);

  // fetch movie metadata
  useEffect(() => {
    // if title is empty, reset metadata fields and wait for input
    if (!newTitle) {
      setAutoReleaseYear("");
      setAutoImdbRating("");
      return;
    }

    const handler = setTimeout(() => {
      fetch(`/api/tmdb-details?query=${encodeURIComponent(newTitle)}`)
        .then(async (res) => {
          let details = {};

          try {
            details = await res.json();
          } catch (err) {
            details = {};
          }

          if (res.ok && details && details.success) {
            if (details.releaseYear) setAutoReleaseYear(details.releaseYear);
            if (details.imdbRating) setAutoImdbRating(details.imdbRating);
            // auto fill desc
            if (details.description) {
              setNewDesc(details.description);
            }
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
      // fetch
      searchPosters(editTitle, 5).then((options) => {
        setEditPosterOptions(options);
        setEditSelectedPoster(options[0] || "");
      });
    }, 800);
    return () => clearTimeout(handler);
  }, [editTitle, showEditModal]);

  // load settings when switching view
  useEffect(() => {
    if (view !== "settings" || !loggedIn) return;

    if (accountType === "admin") {
      // load users and info
      fetchUsersList();
      setSettingsUsername(currentUser);
      setSettingsPassword("");
      setSettingsConfirmPassword("");
    } else {
      // load current user info only
      setSettingsUsername(currentUser);
      setSettingsPassword("");
      setSettingsConfirmPassword("");
    }
    // reset any previous error message
    setSettingsError("");
  }, [view, loggedIn, accountType]);

  // fetch metadata for editing
  useEffect(() => {
    if (!showEditModal || !editTitle) {
      setEditReleaseYear("");
      setEditImdbRating("");
      return;
    }

    const handler = setTimeout(() => {
      fetch(`/api/tmdb-details?query=${encodeURIComponent(editTitle)}`)
        .then(async (res) => {
          let details = {};

          try {
            details = await res.json();
          } catch (err) {
            details = {};
          }

          // auto fill
          if (res.ok && details && details.success) {
            if (details.releaseYear) setEditReleaseYear(details.releaseYear);
            if (details.imdbRating) setEditImdbRating(details.imdbRating);
            if (details.description) setEditDesc(details.description);
          }
        })
        .catch(() => {
          // ignore
        });
    }, 800);
    return () => clearTimeout(handler);
  }, [editTitle, showEditModal]);

  // poster search overlay
  useEffect(() => {
    // only run when the search overlay is visible
    if (!showPosterSearchModal) return;
    // if the input is empty, clear results
    if (!posterSearchInput) {
      setPosterSearchResults([]);
      return;
    }
    const handler = setTimeout(() => {
      // fetch
      searchPosters(posterSearchInput, 10).then((options) => {
        setPosterSearchResults(options);
      });
    }, 800);
    return () => clearTimeout(handler);
  }, [posterSearchInput, showPosterSearchModal]);

  // fetch title suggestions for editing
  useEffect(() => {
    if (!showEditModal || !editTitle) {
      setEditTitleSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      fetch(
        `/api/tmdb-suggestions?query=${encodeURIComponent(editTitle)}&limit=5`,
      )
        .then(async (res) => {
          let data = {};

          try {
            data = await res.json();
          } catch (err) {
            data = {};
          }

          // update
          if (res.ok && data && data.success && Array.isArray(data.results)) {
            setEditTitleSuggestions(data.results);
          } else {
            setEditTitleSuggestions([]);
          }
        })
        .catch(() => {
          setEditTitleSuggestions([]); // on error, clear suggestions
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
      .then(async (res) => {
        // parse
        let data = {};

        try {
          data = await res.json();
        } catch (err) {
          data = {};
        }

        // change states
        if (res.ok && data && data.success) {
          // successful login
          setLoggedIn(true);
          setShowLoginModal(false);
          // store logged in user for display
          setCurrentUser(loginUsername);
          // store account type
          setAccountType(data.accountType || "");
          // session cookies 1 week
          document.cookie =
            "fts_user=" +
            encodeURIComponent(loginUsername) +
            "; path=/; max-age=" +
            7 * 24 * 60 * 60; // 7 days in secs
          document.cookie =
            "fts_type=" +
            encodeURIComponent(data.accountType || "") +
            "; path=/; max-age=" +
            7 * 24 * 60 * 60;
          // clear fields
          setLoginUsername("");
          setLoginPassword("");
        } else {
          // error handle
          const status = res.status;
          let message = (data && data.message) || "Login failed";
          if (status === 401) message = data.message || "Invalid credentials";
          else if (status === 400) message = data.message || "Bad request";
          else if (status === 500) message = data.message || "Server error";
          setLoginError(message);
        }
      })
      .catch(() => {
        // network error
        setLoginError("Network error.");
      });
  };

  // handle adding a movie
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
      releaseYear: autoReleaseYear || "",
      imdbRating: autoImdbRating || "",
    };

    const updatedList = [...myMovies, newMovie]; // update  movie list
    setMyMovies(updatedList);
    setNextId((id) => id + 1); // next movie
    // save to db
    saveMyCatalogue(updatedList);
    // reset form fields
    setNewTitle("");
    setNewDesc("");
    setSelectedPoster("");
    setPosterOptions([]);
    setAutoReleaseYear("");
    setAutoImdbRating("");
    setTitleSuggestions([]);
    setShowAddModal(false);
  };

  // update rating by id
  const handleRate = (id, value) => {
    // update personal catalogue rating
    const updatedList = myMovies.map((m) =>
      m.id === id ? { ...m, rating: value } : m,
    );
    setMyMovies(updatedList);
    // save to db
    saveMyCatalogue(updatedList);
  };

  // open edit modal with selected movie
  const handleEditClick = (id) => {
    // find movie in personal catalogue
    const movie = myMovies.find((m) => m.id === id);
    if (!movie) return;

    setEditMovieId(id);
    setEditTitle(movie.title);
    setEditDesc(movie.description);
    // init with current poster if exist
    setEditSelectedPoster(movie.poster || "");
    setEditPosterOptions(movie.poster ? [movie.poster] : []);
    // load existing metadata into edit state
    setEditReleaseYear(movie.releaseYear || "");
    setEditImdbRating(movie.imdbRating || "");
    setShowEditModal(true);
  };

  // save edits
  const handleSaveEdit = (e) => {
    e.preventDefault(); // prevent submission
    const title = editTitle.trim();
    const desc = editDesc.trim();
    if (!title || !desc) return;

    // update the movie in the personal catalogue
    const updatedList = myMovies.map((m) => {
      if (m.id !== editMovieId) return m;
      return {
        ...m,
        title: title,
        description: desc,
        poster: editSelectedPoster || m.poster,
        releaseYear: editReleaseYear || m.releaseYear,
        imdbRating: editImdbRating || m.imdbRating,
      };
    });
    setMyMovies(updatedList);
    // save to db
    saveMyCatalogue(updatedList);
    // reset states
    setShowEditModal(false);
    setEditMovieId(null);
    setEditTitle("");
    setEditDesc("");
    setEditPosterOptions([]);
    setEditSelectedPoster("");
    setEditTitleSuggestions([]);
  };

  // delete a movie from personal catalogue
  const deleteMyMovie = (id) => {
    if (id == null) return;
    const updatedList = myMovies.filter((m) => m.id !== id);
    setMyMovies(updatedList);
    saveMyCatalogue(updatedList);
  };

  /**
   * Deletes a movie site wide based *ADMIN*
   * @param {string} title the movie title to remove
   */
  const deleteMovie = async (title) => {
    if (!title) return;
    try {
      await fetch(`/api/delete-movie?title=${encodeURIComponent(title)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete movie", err);
    }
    // refresh both catalogues
    fetchMyCatalogue();
    fetchGlobalCatalogue();
  };

  // register a new account
  const handleRegister = (e) => {
    e.preventDefault(); // prevent form submission
    setRegisterError("");
    const uname = registerUsername.trim();
    const pwd = registerPassword;
    const confirm = registerConfirm;
    if (!uname || !pwd || !confirm) {
      setRegisterError("All fields are required.");
      return;
    }
    if (pwd !== confirm) {
      setRegisterError("Passwords do not match.");
      return;
    }

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: uname,
        password: pwd,
        confirmPassword: confirm,
      }),
    })
      .then(async (res) => {
        let data = {};
        // parse
        try {
          data = await res.json();
        } catch (err) {
          data = {};
        }

        if (res.ok && data && data.success) {
          // register success
          setShowRegisterModal(false);
          setShowLoginModal(true);
          // clear fields
          setRegisterUsername("");
          setRegisterPassword("");
          setRegisterConfirm("");
        } else {
          // error handle
          const status = res.status;
          let message = (data && data.message) || "Registration failed";
          if (status === 409)
            message = data.message || "Username already exists";
          else if (status === 400) message = data.message || "Bad request";
          else if (status === 500) message = data.message || "Server error";
          setRegisterError(message);
        }
      })
      .catch(() => {
        setRegisterError("Network error.");
      });
  };

  // logout the current user
  const handleLogout = () => {
    // clear states
    setLoggedIn(false);
    setCurrentUser("");
    setAccountType("");
    setMovies([]);
    setMyMovies([]);
    setGlobalMovies([]);
    setView("global");
    setNextId(1);
    setShowAddModal(false);
    setShowEditModal(false);
    setShowUserMenu(false);
    // show login modal again
    setShowLoginModal(true);

    // remove login cookies
    document.cookie = "fts_user=; path=/; max-age=0";
    document.cookie = "fts_type=; path=/; max-age=0";
  };

  // open the extended search.
  // context determines whether its add/edit form
  const openPosterSearch = (context) => {
    setPosterSearchContext(context);
    setPosterSearchInput("");
    setPosterSearchResults([]);
    setShowPosterSearchModal(true);
  };

  // handles poster selection in extended overlay
  const handlePosterSelectFromSearch = (url) => {
    if (posterSearchContext === "add") {
      setSelectedPoster(url);
      setPosterOptions([url]);
    } else if (posterSearchContext === "edit") {
      setEditSelectedPoster(url);
      setEditPosterOptions([url]);
    }
    setShowPosterSearchModal(false);
  };

  /**
   * Helper for title suggestions, copies metadata from suggestion to form
   * @param {Object} suggestion suggested movie returned from API
   */
  const handleTitleSuggestionClick = (suggestion) => {
    setNewTitle(suggestion.title || "");
    setNewDesc(suggestion.description || "");
    setAutoReleaseYear(suggestion.releaseYear || "");
    setAutoImdbRating(suggestion.imdbRating || "");

    if (suggestion.poster) {
      setSelectedPoster(suggestion.poster);
      setPosterOptions([suggestion.poster]);
    }
    setTitleSuggestions([]);
  };

  /**
   * Helper for title suggestions in the edit form
   * @param {Object} suggestion suggested movie returned from API
   */
  const handleEditTitleSuggestionClick = (suggestion) => {
    setEditTitle(suggestion.title || "");
    setEditDesc(suggestion.description || "");
    setEditReleaseYear(suggestion.releaseYear || "");
    setEditImdbRating(suggestion.imdbRating || "");

    if (suggestion.poster) {
      setEditSelectedPoster(suggestion.poster);
      setEditPosterOptions([suggestion.poster]);
    }
    setEditTitleSuggestions([]);
  };

  // handle search bar
  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // fetches and populates the users personal catalogue
  const fetchMyCatalogue = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(
        `/api/my-catalogue?username=${encodeURIComponent(currentUser)}`,
      );
      // response
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }

      // validate
      if (!res.ok || !data || !Array.isArray(data.movies)) {
        return;
      }

      // maps to MovieCard format
      const tempList = data.movies.map((movie, idx) => ({
        id: idx + 1,
        title: movie.title,
        description: movie.description,
        poster: movie.coverImage || "",
        rating: Number(movie.rating) || 0,
        releaseYear: movie.releaseYear || "",
        imdbRating: "",
      }));

      // fill missing metadata from tmdb
      const updated = await Promise.all(
        tempList.map(async (m) => {
          const updatedMovie = { ...m };
          if (!m.releaseYear || !m.imdbRating) {
            try {
              const resDetails = await fetch(
                `/api/tmdb-details?query=${encodeURIComponent(m.title)}`,
              );

              // response
              let details = {};
              try {
                details = await resDetails.json();
              } catch (err) {
                details = {};
              }

              // update only if missing
              if (resDetails.ok && details && details.success) {
                if (!m.releaseYear && details.releaseYear) {
                  updatedMovie.releaseYear = details.releaseYear;
                }
                if (!m.imdbRating && details.imdbRating) {
                  updatedMovie.imdbRating = details.imdbRating;
                }
                if (details.description && !updatedMovie.description) {
                  updatedMovie.description = details.description;
                }
              }
            } catch (err) {
              // ignore
            }
          }
          return updatedMovie;
        }),
      );
      setMyMovies(updated);
      setNextId(updated.length + 1); // blank space
    } catch (err) {
      console.error("Failed to fetch my catalogue", err);
    }
  };

  // fetches and populates the global catalogue
  const fetchGlobalCatalogue = async () => {
    try {
      const res = await fetch(`/api/global-catalogue`);

      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }

      if (!res.ok || !data || !Array.isArray(data.movies)) return;

      const tempList = data.movies.map((movie, idx) => ({
        // map to format
        id: idx + 1,
        title: movie.title,
        description: movie.description,
        poster: movie.coverImage || "",
        rating: movie.ftsRating ? Number(movie.ftsRating) : 0,
        releaseYear: movie.releaseYear || "",
        imdbRating: "",
      }));

      // fill missing metadata from tmdb
      const updated = await Promise.all(
        tempList.map(async (m) => {
          const updatedMovie = { ...m };
          if (!m.releaseYear || !m.imdbRating) {
            try {
              const resDetails = await fetch(
                `/api/tmdb-details?query=${encodeURIComponent(m.title)}`,
              );

              let details = {};
              try {
                details = await resDetails.json();
              } catch (err) {
                details = {};
              }

              // update only if missing
              if (resDetails.ok && details && details.success) {
                if (!m.releaseYear && details.releaseYear) {
                  updatedMovie.releaseYear = details.releaseYear;
                }
                if (!m.imdbRating && details.imdbRating) {
                  updatedMovie.imdbRating = details.imdbRating;
                }
                if (details.description && !updatedMovie.description) {
                  updatedMovie.description = details.description;
                }
              }
            } catch (err) {
              // ignore
            }
          }
          return updatedMovie;
        }),
      );
      setGlobalMovies(updated);
    } catch (err) {
      console.error("Failed to fetch global catalogue", err);
    }
  };

  // fetch and populate the users list for admin settings page
  const fetchUsersList = async () => {
    try {
      const res = await fetch("/api/users");

      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }

      if (res.ok && data && data.success && Array.isArray(data.users)) {
        // expanded with editable fields
        const expanded = data.users.map((u) => ({
          username: u.username,
          accountType: u.accountType,
          newUsername: u.username,
          newPassword: "",
          newAccountType: u.accountType,
          newConfirmPassword: "",
        }));
        setSettingsUsers(expanded);
      } else {
        setSettingsUsers([]);
      }
    } catch (err) {
      setSettingsUsers([]);
    }
  };

  /**
   * Helper to update a specific field for a user in the settings page
   * @param {number} index index of the user in settingsUsers
   * @param {string} field field to update
   * @param {string} value new value
   */
  const updateSettingsUserField = (index, field, value) => {
    setSettingsUsers((prev) => {
      const arr = [...prev];
      // only update if index is valid
      if (index >= 0 && index < arr.length) {
        arr[index] = { ...arr[index], [field]: value };
      }
      return arr;
    });
  };

  /**
   * saves changes to a specific user in the settings page *ADMIN*
   * @param {number} index index of the user
   */
  const saveSettingsUser = async (index) => {
    const user = settingsUsers[index];

    if (!user) return;

    const payload = { targetUsername: user.username };
    if (user.newUsername && user.newUsername !== user.username) {
      // validate username
      payload.newUsername = user.newUsername;
    }

    if (user.newPassword && user.newPassword.trim() !== "") {
      // validate password
      if (
        !user.newConfirmPassword ||
        user.newPassword !== user.newConfirmPassword
      ) {
        setSettingsError("Passwords do not match.");
        return;
      }
      payload.newPassword = user.newPassword;
    }

    if (user.newAccountType && user.newAccountType !== user.accountType) {
      // if type changed
      payload.newAccountType = user.newAccountType;
    }
    try {
      const res = await fetch("/api/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // response
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }

      if (res.ok && data && data.success) {
        // if the current user updated themselves and changed username
        if (user.username === currentUser && payload.newUsername) {
          const newU = payload.newUsername;
          setCurrentUser(newU);
          // update cookies
          document.cookie =
            "fts_user=" +
            encodeURIComponent(newU) +
            "; path=/; max-age=" +
            7 * 24 * 60 * 60; // 7days in sec
        }
      } else {
        const msg = (data && data.message) || "Failed to update user";
        setSettingsError(msg);
      }
    } catch (err) {
      setSettingsError("Network error while updating user");
    }

    // refresh list after save
    if (accountType === "admin") {
      fetchUsersList();
    } else {
      // refresh personal fields for user
      setSettingsUsername(currentUser);
      setSettingsPassword("");
    }
    // refresh catalogues
    fetchMyCatalogue();
    fetchGlobalCatalogue();
  };

  // user settings save handler
  const saveCurrentUserSettings = async () => {
    const payload = { targetUsername: currentUser };
    if (settingsUsername && settingsUsername !== currentUser) {
      // validate username
      payload.newUsername = settingsUsername;
    }

    if (settingsPassword && settingsPassword.trim() !== "") {
      // validate password
      if (
        !settingsConfirmPassword ||
        settingsPassword !== settingsConfirmPassword
      ) {
        setSettingsError("Passwords do not match.");
        return;
      }
      payload.newPassword = settingsPassword;
    }

    try {
      const res = await fetch("/api/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }

      if (res.ok && data && data.success) {
        // update current user and cookies if username changed
        if (payload.newUsername) {
          setCurrentUser(payload.newUsername);
          document.cookie =
            "fts_user=" +
            encodeURIComponent(payload.newUsername) +
            "; path=/; max-age=" +
            7 * 24 * 60 * 60;
        }
        // clear password field
        setSettingsPassword("");
        setSettingsError("");
      } else {
        const msg = (data && data.message) || "Failed to update settings";
        setSettingsError(msg);
      }
    } catch (err) {
      setSettingsError("Network error while updating settings");
    }
    // refresh catalogues
    fetchMyCatalogue();
    fetchGlobalCatalogue();
  };

  /**
   * saves the users personal catalogue to the database
   * @param {Array} list the list of movies to save
   */
  const saveMyCatalogue = async (list) => {
    if (!currentUser) return;

    // payload
    const payload = list.map((m) => ({
      title: m.title,
      description: m.description,
      releaseYear: m.releaseYear || "",
      rating: m.rating != null ? String(m.rating) : "",
      genre: "",
      coverImage: m.poster || "",
    }));

    try {
      const res = await fetch(
        `/api/save-catalogue?username=${encodeURIComponent(currentUser)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movies: payload }),
        },
      );
    } catch (err) {
      console.error("Failed to save catalogue", err);
    }
    // refresh
    fetchGlobalCatalogue();
  };

  // build DOM
  return React.createElement("div", { className: "app-container" }, [
    // header
    React.createElement("header", { key: "header", className: "top-bar" }, [
      React.createElement(
        "h1",
        { key: "site", className: "site-name" },
        "FTS: MC", // title header
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
        // nav icons
        loggedIn
          ? React.createElement(
              "button",
              {
                key: "homeBtn",
                className:
                  "nav-icon-button home-btn" +
                  (view === "global" ? " active" : ""),
                title: "All Movies",
                "aria-label": "Global catalogue",
                onClick: () => {
                  // switch to global view
                  setView("global");
                  fetchGlobalCatalogue();
                },
              },
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
                  React.createElement("path", {
                    key: "p1",
                    d: "M3 11l9-7 9 7v10a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V11z",
                    stroke: "currentColor",
                    strokeWidth: 2,
                    fill: "none",
                  }),
                ],
              ),
            )
          : null,

        loggedIn
          ? React.createElement(
              "button",
              {
                key: "myCatBtn",
                className:
                  "nav-icon-button my-cat-btn" +
                  (view === "my" ? " active" : ""),
                title: "My Catalogue",
                "aria-label": "My catalogue",
                onClick: () => {
                  // switch to personal view
                  setView("my");
                  fetchMyCatalogue();
                },
              },
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
                  React.createElement("path", {
                    key: "p1",
                    d: "M3 7h6l2 2h10v11H3z",
                    stroke: "currentColor",
                    strokeWidth: 2,
                    fill: "none",
                  }),
                ],
              ),
            )
          : null,

        // current page label
        loggedIn
          ? React.createElement(
              "span",
              {
                key: "pageLabel",
                className: "nav-label",
              },
              view === "global"
                ? "All"
                : view === "my"
                  ? "My Catalogue"
                  : view === "settings"
                    ? "Settings"
                    : "",
            )
          : null,

        // user dropdown
        React.createElement(
          "div",
          { key: "userMenu", className: "user-menu-container" },
          [
            React.createElement(
              "button",
              {
                key: "toggle",
                className: "user-menu-toggle",
                onClick: () => {
                  if (loggedIn) {
                    setShowUserMenu(!showUserMenu);
                  } else {
                    setShowLoginModal(true);
                  }
                },
              },
              [
                currentUser || "Guest",
                React.createElement(
                  "svg",
                  {
                    key: "arrow",
                    width: 16,
                    height: 16,
                    viewBox: "0 0 24 24",
                    fill: "none",
                    xmlns: "http://www.w3.org/2000/svg",
                    className: "user-menu-arrow",
                  },
                  [
                    React.createElement("path", {
                      key: "p",
                      d: "M6 9l6 6 6-6",
                      stroke: "currentColor",
                      strokeWidth: 2,
                      fill: "none",
                    }),
                  ],
                ),
              ],
            ),
            loggedIn && showUserMenu
              ? React.createElement(
                  "div",
                  { key: "menu", className: "user-dropdown" },
                  [
                    // settings option
                    React.createElement(
                      "div",
                      {
                        key: "settings",
                        className: "user-dropdown-item",
                        onClick: () => {
                          setShowUserMenu(false);
                          // switch to settings view
                          setView("settings");
                        },
                      },
                      "Settings",
                    ),
                    React.createElement(
                      "div",
                      {
                        key: "logout",
                        className: "user-dropdown-item",
                        onClick: () => {
                          setShowUserMenu(false);
                          handleLogout();
                        },
                      },
                      "Logout",
                    ),
                  ],
                )
              : null,
          ],
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
                // poster extended search
                React.createElement(
                  "button",
                  {
                    key: "mediaCheckBtnAdd",
                    type: "button",
                    className: "btn-check-media",
                    onClick: () => openPosterSearch("add"),
                  },
                  "Don't see your media? Check Here",
                ),
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
                // extended poster search - edit form
                React.createElement(
                  "button",
                  {
                    key: "mediaCheckBtnEdit",
                    type: "button",
                    className: "btn-check-media",
                    onClick: () => openPosterSearch("edit"),
                  },
                  "Don't see your media? Check Here",
                ),
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
            // login form
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
            // registration
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
                      setShowLoginModal(false);
                      setShowRegisterModal(true);
                      setLoginError("");
                    },
                  },
                  "Register",
                ),
              ],
            ),
          ]),
        )
      : null,

    // registration overlay
    showRegisterModal
      ? React.createElement(
          "div",
          { key: "registerModal", className: "model-overlay" },
          React.createElement("div", { className: "model" }, [
            React.createElement("h2", { key: "header" }, "Register"),
            React.createElement(
              "form",
              {
                key: "form",
                className: "register-form",
                onSubmit: handleRegister,
              },
              [
                React.createElement("label", { key: "userLabel" }, [
                  React.createElement("span", { key: "s" }, "Username"),
                  React.createElement("input", {
                    key: "user",
                    type: "text",
                    value: registerUsername,
                    onChange: (e) => setRegisterUsername(e.target.value),
                    placeholder: "Choose a username",
                    required: true,
                  }),
                ]),
                React.createElement("label", { key: "passLabel" }, [
                  React.createElement("span", { key: "s" }, "Password"),
                  React.createElement("input", {
                    key: "pass",
                    type: "password",
                    value: registerPassword,
                    onChange: (e) => setRegisterPassword(e.target.value),
                    placeholder: "Enter password",
                    required: true,
                  }),
                ]),
                React.createElement("label", { key: "confirmLabel" }, [
                  React.createElement("span", { key: "s" }, "Confirm Password"),
                  React.createElement("input", {
                    key: "confirm",
                    type: "password",
                    value: registerConfirm,
                    onChange: (e) => setRegisterConfirm(e.target.value),
                    placeholder: "Confirm password",
                    required: true,
                  }),
                ]),
                registerError
                  ? React.createElement(
                      "div",
                      { key: "rError", className: "login-error" },
                      registerError,
                    )
                  : null,
                React.createElement(
                  "div",
                  { key: "actions", className: "model-actions" },
                  [
                    React.createElement(
                      "button",
                      {
                        key: "registerSubmit",
                        type: "submit",
                        className: "btn btn-confirm",
                      },
                      "Register",
                    ),
                    React.createElement(
                      "button",
                      {
                        key: "registerCancel",
                        type: "button",
                        className: "btn btn-cancel",
                        onClick: () => {
                          setShowRegisterModal(false);
                          setShowLoginModal(true);
                          setRegisterError("");
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

    // extended poster search overlay
    React.createElement(PosterSearchOverlay, {
      key: "posterOverlay",
      isOpen: showPosterSearchModal,
      query: posterSearchInput,
      onQueryChange: (val) => setPosterSearchInput(val),
      results: posterSearchResults,
      onSelect: handlePosterSelectFromSearch,
      onClose: () => setShowPosterSearchModal(false),
    }),

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
// const { createRoot } = require("react-dom/client");

// if (typeof document !== "undefined") {
//   const rootEl = document.getElementById("root");
//   if (rootEl) {
//     const root = createRoot(rootEl);
//     root.render(React.createElement(App));
//   }
// }

// export app to avoid auto render issues
// module.exports = App;
