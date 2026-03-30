// MovieCard renders a movie's poster, and its metadata
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
    React.createElement(window.StarRating, {
      key: "rating",
      rating: movie.rating,
      onRate: (value) => onRate && onRate(movie.id, value),
    }),
  ]);
}

// makes it global
window.MovieCard = MovieCard;
