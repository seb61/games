const { useState, useEffect } = React;

/**
 * Docs:
 * - https://react.dev/reference/react/hooks
 */

// star rating system
function StarRating({ rating, onRate }) {
  const [hoverValue, setHoverValue] = useState(0);
  return React.createElement(
    'div',
    { className: 'rating' },
    [1, 2, 3, 4, 5].map((value) => {
      // determine if star should be highlighted
      const isActive = value <= (hoverValue || rating);
      return React.createElement(
        'span',
        {
          key: value,
          className: 'star' + (isActive ? ' selected' : ''),
          onMouseEnter: () => setHoverValue(value),
          onMouseLeave: () => setHoverValue(0),
          onClick: () => onRate(value),
        },
        '★'
      );
    })
  );
}

// MovieCard renders a single movie card including its metadata.
function MovieCard({ movie, onRate }) {
  return React.createElement(
    'div',
    { className: 'movie-card' },
    [
      React.createElement('img', {
        key: 'img',
        src: movie.poster || '',
        alt: `Poster for ${movie.title}`,
      }),
      React.createElement(
        'h2',
        { key: 'title', className: 'movie-title' },
        movie.title
      ),
      React.createElement(
        'p',
        { key: 'desc', className: 'movie-description' },
        movie.description
      ),
      React.createElement(StarRating, {
        key: 'rating',
        rating: movie.rating,
        onRate: (value) => onRate(movie.id, value),
      }),
    ]
  );
}

// App manages auth, movie data, and overlays.
function App() {
  const [movies, setMovies] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  // overlay state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  // form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  // login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [nextId, setNextId] = useState(1); // for unique ids
  // tmdb states
  const [posterOptions, setPosterOptions] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState('');

  // fetch movies on login
  useEffect(() => {
    if (!loggedIn) return; // if state isnt true
    fetch('/api/movies')
      .then((res) => res.json())
      .then((data) => {
        // maps to MovieCard format
        const transformed = data.map((movie, index) => ({
          id: index + 1,
          title: movie.title,
          description: movie.description,
          poster: movie.coverImage || '',
          rating: Number(movie.rating) || 0,
        }));
        setMovies(transformed);
        setNextId(transformed.length + 1);
      })
      .catch((err) => {
        console.error('Failed to fetch movies:', err);
      });
  }, [loggedIn]);

  // search posters from TMDB
  useEffect(() => {
    if (!newTitle) { // wait for title change
      setPosterOptions([]);
      setSelectedPoster('');
      return;
    }
    // calls API after user stops typing for 0.8s
    const handler = setTimeout(() => {
      const apiKey = '8e8e6903634e4456e06bdd740af13ca6';
      const query = encodeURIComponent(newTitle);
      // call the search API
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            // build image
            const options = data.results
              .filter((item) => item.poster_path)
              .slice(0, 5)
              .map((item) => `https://image.tmdb.org/t/p/w500${item.poster_path}`);
            setPosterOptions(options);
            setSelectedPoster(options[0] || '');
          }
        })
        .catch(() => {
          // ignore for now
        });
    }, 800);
    return () => clearTimeout(handler);
  }, [newTitle]);

  // handle login form
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername, password: loginPassword }),
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        if (data.success) {
          // change states
          setLoggedIn(true);
          setShowLoginModal(false);
          // clear fields
          setLoginUsername('');
          setLoginPassword('');
        } else {
          setLoginError(data.message || 'Invalid username or password.');
        }
      })
      .catch(() => {
        setLoginError('Invalid username or password.');
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
      poster: selectedPoster || '',
      rating: 0,
    };

    setMovies((prev) => [...prev, newMovie]);
    setNextId((id) => id + 1);
    setNewTitle('');
    setNewDesc('');
    setSelectedPoster('');
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
      prev.map((m) => (m.id === id ? { ...m, rating: value } : m))
    );
  };

  // build DOM
  return React.createElement(
    'div',
    { className: 'app-container' },
    [
      // header
      React.createElement(
        'header',
        { key: 'header', className: 'top-bar' },
        [
          React.createElement(
            'h1',
            { key: 'site', className: 'site-name' },
            'FTS Movie Catalogue'
          ),
          React.createElement(
            'div',
            { key: 'actions', className: 'actions' },
            [
              React.createElement(
                'button',
                {
                  key: 'addBtn',
                  className: 'btn btn-add',
                  onClick: () => setShowAddModal(true),
                  disabled: !loggedIn,
                },
                '+ Add Movie'
              ),
              React.createElement(
                'button',
                {
                  key: 'removeBtn',
                  className: 'btn btn-remove',
                  onClick: handleRemoveMovie,
                  disabled: !loggedIn || movies.length === 0,
                },
                'Remove Movie'
              ),
              React.createElement(
                'button',
                {
                  key: 'loginBtn',
                  className: 'login-icon-button',
                  title: 'Login',
                  'aria-label': 'Login',
                  onClick: () => setShowLoginModal(true),
                },
                // svg icon for user
                React.createElement(
                  'svg',
                  {
                    width: 24,
                    height: 24,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    xmlns: 'http://www.w3.org/2000/svg',
                  },
                  [
                    React.createElement('circle', {
                      key: 'c',
                      cx: 12,
                      cy: 8,
                      r: 4,
                      stroke: 'currentColor',
                      'stroke-width': 2,
                    }),
                    React.createElement('path', {
                      key: 'p',
                      d: 'M4 21c0-4 4-6 8-6s8 2 8 6v1H4v-1z',
                      stroke: 'currentColor',
                      'stroke-width': 2,
                    }),
                  ]
                )
              ),
            ]
          ),
        ]
      ),
      // movie grid when logged in
      loggedIn
        ? React.createElement(
            'main',
            { key: 'main', className: 'movies-grid' },
            [
              // for each movie, render a card
              ...movies.map((movie) =>
                React.createElement(MovieCard, {
                  key: movie.id,
                  movie: movie,
                  onRate: handleRate,
                })
              ),
              React.createElement(
                'div',
                { key: 'addCard', className: 'movie-card add-card' },
                React.createElement(
                  'button',
                  {
                    className: 'add-card-button',
                    onClick: () => setShowAddModal(true),
                    disabled: !loggedIn,
                  },
                  '+ Add Movie'
                )
              ),
            ]
          )
        : null,
      // add movie overlay
      showAddModal
        ? React.createElement(
            'div',
            { key: 'addModal', className: 'model-overlay' },
            React.createElement(
              'div',
              { className: 'model' },
              [
                React.createElement('h2', { key: 'title' }, 'Add a Movie'),
                React.createElement(
                  'form',
                  {
                    key: 'form',
                    className: 'movie-form',
                    onSubmit: handleAddMovie,
                  },
                  [
                    React.createElement(
                      'label',
                      { key: 'nameLabel' },
                      [
                        React.createElement('span', { key: 's' }, 'Movie Name'),
                        React.createElement('input', {
                          key: 'name',
                          type: 'text',
                          value: newTitle,
                          onChange: (e) => setNewTitle(e.target.value),
                          placeholder: 'Enter title',
                        }),
                      ]
                    ),
                    React.createElement(
                      'label',
                      { key: 'descLabel' },
                      [
                        React.createElement('span', { key: 's' }, 'Description'),
                        React.createElement('textarea', {
                          key: 'desc',
                          value: newDesc,
                          onChange: (e) => setNewDesc(e.target.value),
                          placeholder: 'Enter a short description',
                        }),
                      ]
                    ),
                    // show TMDB poster slider
                    posterOptions.length > 0
                      ? React.createElement(
                          'div',
                          { key: 'posterSection' },
                          [
                            React.createElement('span', { key: 'label' }, 'Select Poster'),
                            React.createElement(
                              'div',
                              { className: 'poster-slider', key: 'slider' },
                              posterOptions.map((url, idx) =>
                                React.createElement(
                                  'div',
                                  {
                                    key: idx,
                                    className:
                                      'poster-option' +
                                      (selectedPoster === url ? ' selected' : ''),
                                    onClick: () => setSelectedPoster(url),
                                  },
                                  React.createElement('img', {
                                    src: url,
                                    alt: 'Poster option',
                                  })
                                )
                              )
                            ),
                          ]
                        )
                      : null,
                    React.createElement(
                      'div',
                      { key: 'actions', className: 'model-actions' },
                      [
                        React.createElement(
                          'button',
                          {
                            key: 'submit',
                            type: 'submit',
                            className: 'btn btn-confirm',
                          },
                          'Add'
                        ),
                        React.createElement(
                          'button',
                          {
                            key: 'cancel',
                            type: 'button',
                            className: 'btn btn-cancel',
                            onClick: () => {
                              setShowAddModal(false);
                              // reset poster state when canceling
                              setPosterOptions([]);
                              setSelectedPoster('');
                            },
                          },
                          'Cancel'
                        ),
                      ]
                    ),
                  ]
                ),
              ]
            )
          )
        : null,
      // login overlay
      showLoginModal
        ? React.createElement(
            'div',
            { key: 'loginModal', className: 'model-overlay' },
            React.createElement(
              'div',
              { className: 'model' },
              [
                React.createElement('h2', { key: 'header' }, 'Login'),
                // login form handles username/password and submission
                React.createElement(
                  'form',
                  {
                    key: 'form',
                    className: 'login-form',
                    onSubmit: handleLogin,
                  },
                  [
                    // username field
                    React.createElement(
                      'label',
                      { key: 'userLabel' },
                      [
                        React.createElement('span', { key: 's' }, 'Username'),
                        React.createElement('input', {
                          key: 'user',
                          type: 'text',
                          value: loginUsername,
                          onChange: (e) => setLoginUsername(e.target.value),
                          placeholder: 'Input username',
                          required: true,
                        }),
                      ]
                    ),
                    // password field
                    React.createElement(
                      'label',
                      { key: 'passLabel' },
                      [
                        React.createElement('span', { key: 's' }, 'Password'),
                        React.createElement('input', {
                          key: 'pass',
                          type: 'password',
                          value: loginPassword,
                          onChange: (e) => setLoginPassword(e.target.value),
                          placeholder: 'Input password',
                          required: true,
                        }),
                      ]
                    ),
                    // error message
                    loginError
                      ? React.createElement(
                          'div',
                          { key: 'error', className: 'login-error' },
                          loginError
                        )
                      : null,
                    // actions for submit/cancel
                    React.createElement(
                      'div',
                      { key: 'actions', className: 'model-actions' },
                      [
                        React.createElement(
                          'button',
                          {
                            key: 'loginSubmit',
                            type: 'submit',
                            className: 'btn btn-confirm',
                          },
                          'Login'
                        ),
                        React.createElement(
                          'button',
                          {
                            key: 'loginCancel',
                            type: 'button',
                            className: 'btn btn-cancel',
                            onClick: () => {
                              setShowLoginModal(false);
                              setLoginError('');
                            },
                          },
                          'Cancel'
                        ),
                      ]
                    ),
                  ]
                ),
                // registration (not don)
                React.createElement(
                  'div',
                  { key: 'registerPlaceholder', className: 'register-placeholder' },
                  [
                    React.createElement('span', { key: 'text' }, "Don't have an account? "),
                    React.createElement(
                      'a',
                      {
                        key: 'link',
                        href: '#',
                        onClick: (e) => {
                          e.preventDefault();
                          // TODO: implement
                          alert('not implemented');
                        },
                      },
                      'Register'
                    ),
                  ]
                ),
              ]
            )
          )
        : null,
    ]
  );
}

// render the DOM
ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);