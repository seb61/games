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
      // determine if start should be highlighted
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [nextId, setNextId] = useState(1);

  // fetch movies on login
  useEffect(() => {
    if (!loggedIn) return; // if state isnt true
    fetch('/api/movies')
      .then((res) => res.json())
      .then((data) => {
        // maps it to MovieCard format
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

  // handle login form
  const handleLogin = (e) => {
    e.preventDefault(); // prevent form submission
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
          // clear creds field
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

  // handles movie addition (locally) (need to move to server to save per user & ratings)
  const handleAddMovie = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    const desc = newDesc.trim();
    if (!title || !desc) return; // if missing title and desc

    const newMovie = {
      id: nextId,
      title: title,
      description: desc,
      poster: '',
      rating: 0,
    };

    setMovies((prev) => [...prev, newMovie]);
    setNextId((id) => id + 1);
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  // remove last movie from list
  const handleRemoveMovie = () => {
    setMovies((prev) => prev.slice(0, -1));
  };

  // update rating by movie id
  const handleRate = (id, value) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rating: value } : m))
    );
  };

  // DOM
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
            'FTS Movie Catalogue' // header title
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
      // movie grid shown when logged in
      loggedIn
        ? React.createElement(
            'main',
            { key: 'main', className: 'movies-grid' },
            [
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
                      { key: 'posterLabel' },
                      [
                        React.createElement('span', { key: 's' }, 'Poster Image (optional)'),
                        React.createElement('input', {
                          key: 'poster',
                          type: 'file',
                          disabled: true,
                        }),
                      ]
                    ),
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
                            onClick: () => setShowAddModal(false),
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
                React.createElement(
                  'form',
                  {
                    key: 'form',
                    className: 'login-form',
                    onSubmit: handleLogin,
                  },
                  [
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
                    loginError
                      ? React.createElement(
                          'div',
                          { key: 'error', className: 'login-error' },
                          loginError
                        )
                      : null,
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