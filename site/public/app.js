const { useState } = React;

// swap to db
const initialMovies = [
  {
    id: 1,
    title: 'Inception',
    description:
      'A thief who steals corporate secrets through dream‑sharing technology is offered a chance at redemption if he can plant an idea in a target’s mind.',
    poster: 'img/inception.jpeg',
    rating: 0,
  },
  {
    id: 2,
    title: 'Interstellar',
    description:
      'With Earth dying, a team of explorers travels through a wormhole in search of a habitable planet to ensure humanity’s survival.',
    poster: 'img/interstellar.jpeg',
    rating: 0,
  },
  {
    id: 3,
    title: 'The Dark Knight',
    description:
      'Batman confronts the Joker, a criminal mastermind whose chaotic schemes threaten to plunge Gotham City into anarchy.',
    poster: 'img/darkknight.jpeg',
    rating: 0,
  },
  {
    id: 4,
    title: 'The Shawshank Redemption',
    description:
      'Wrongly convicted of murder, banker Andy Dufresne befriends fellow inmate Red and finds hope while plotting a daring prison escape.',
    poster: 'img/shawshank.jpeg',
    rating: 0,
  },
  {
    id: 5,
    title: 'The Matrix',
    description:
      'A hacker learns that the world he knows is a simulated reality and joins a rebellion to free humanity from the machines.',
    poster: 'img/matrix.jpeg',
    rating: 0,
  },
];

// star rating system
function StarRating({ rating, onRate }) {
  const [hoverValue, setHoverValue] = useState(0);
  return React.createElement(
    'div',
    { className: 'rating' },
    [1, 2, 3, 4, 5].map((value) => {
      // determine if this star should be highlighted
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

// MovieCard renders a single movie card including its components.
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
        onRate: (value) => onRate(movie.id, value), // used for updating the rating
      }),
    ]
  );
}

// App manages the catalogue and overlays.
function App() {
  const [movies, setMovies] = useState(initialMovies);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // update a movie's rating in state (change to db)
  const handleRate = (id, value) => {
    setMovies((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, rating: value } : movie // creates a new array with the updated movie rating
      )
    );
  };

  // add a new movie when the form is submitted (change to db)
  const handleAddMovie = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    const desc = newDesc.trim();
    if (!title || !desc) return;
    const newMovie = {
      id: Date.now(),
      title: title,
      description: desc,
      poster: '',
      rating: 0,
    };
    setMovies((prev) => [...prev, newMovie]);
    setNewTitle('');
    setNewDesc('');
    setShowModal(false);
  };

  // remove the last movie from the list (change to db)
  const handleRemoveMovie = () => {
    setMovies((prev) => prev.slice(0, -1));
  };

  return React.createElement(
    'div',
    { className: 'app-container' },
    [
      // header with site name and buttons
      React.createElement(
        'header',
        { key: 'header', className: 'top-bar' },
        [
          // site name
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
                  onClick: () => setShowModal(true),
                },
                '+ Add Movie'
              ),
              React.createElement(
                'button',
                {
                  key: 'removeBtn',
                  className: 'btn btn-remove',
                  onClick: handleRemoveMovie,
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
                },
                // login icon
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
      // catalogue grid
      React.createElement(
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
          // always show add card at the end
          React.createElement(
            'div',
            { key: 'addCard', className: 'movie-card add-card' },
            React.createElement(
              'button',
              {
                className: 'add-card-button',
                onClick: () => setShowModal(true),
              },
              '+ Add Movie'
            )
          ),
        ]
      ),
      // adding a movie overlay (fix naming)
      showModal
        ? React.createElement(
            'div',
            { key: 'modal', className: 'model-overlay' },
            React.createElement(
              'div',
              { className: 'model' },
              [
                React.createElement(
                  'h2',
                  { key: 'modalTitle' },
                  'Add a Movie'
                ),
                React.createElement(
                  'form',
                  {
                    key: 'form',
                    className: 'movie-form',
                    onSubmit: handleAddMovie,
                  },
                  [
                    // poster upload (not working)
                    React.createElement(
                      'label',
                      { key: 'posterLabel' },
                      [
                        React.createElement(
                          'span',
                          { key: 'label' },
                          'Poster Image (optional)'
                        ),
                        React.createElement('input', {
                          key: 'posterInput',
                          type: 'file',
                          disabled: true,
                        }),
                      ]
                    ),
                    React.createElement(
                      'label',
                      { key: 'titleLabel' },
                      [
                        React.createElement(
                          'span',
                          { key: 'label' },
                          'Movie Name'
                        ),
                        React.createElement('input', {
                          key: 'titleInput',
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
                        React.createElement(
                          'span',
                          { key: 'label' },
                          'Description'
                        ),
                        React.createElement('textarea', {
                          key: 'descInput',
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
                            key: 'submitBtn',
                            type: 'submit',
                            className: 'btn btn-confirm',
                          },
                          'Add'
                        ),
                        React.createElement(
                          'button',
                          {
                            key: 'cancelBtn',
                            type: 'button',
                            className: 'btn btn-cancel',
                            onClick: () => setShowModal(false),
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

// mount the app to the DOM
ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);