/**
 * Docs:
 * - https://react.dev/reference/react/createElement
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 */

// displays a grid of movies
function CataloguePage({
  movies = [],
  view = "global",
  accountType = "",
  onRate,
  onEdit,
  onDelete,
  onAdd,
}) {
  const cards = [];
  // map movies to MovieCard format
  movies.forEach((movie) => {
    cards.push(
      React.createElement(window.MovieCard, {
        key: movie.id,
        movie: movie,
        onRate: onRate,
        onEdit: view === "my" ? onEdit : undefined,
        isAdmin: accountType === "admin",
        isGlobalView: view === "global",
        onDelete: accountType === "admin" ? onDelete : undefined,
      }),
    );
  });
  // add movie card
  if (view === "my") {
    cards.push(
      React.createElement(
        "div",
        {
          key: "add",
          className: "movie-card add-card",
        },
        React.createElement(
          "button",
          {
            className: "add-card-button",
            onClick: () => onAdd && onAdd(),
            title: "Add movie",
            "aria-label": "Add movie",
          },
          "+",
        ),
      ),
    );
  }
  return React.createElement("div", { className: "movies-grid" }, cards);
}

// global
window.CataloguePage = CataloguePage;
