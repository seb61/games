/**
 * Docs:
 *  - https://www.geeksforgeeks.org/reactjs/create-a-modal-component-using-react-hooks/
 */


// MovieCard renders a movie's poster, and its metadata
function MovieCard({ movie, onRate, onEdit, isAdmin = false, isGlobalView = false, onDelete }) {
  // note overlay states
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  // description expansion state
  const [expanded, setExpanded] = useState(false);
  const desc = movie.description || "";
  const maxLength = 200;
  const isLong = desc.length > maxLength;
  const displayedDesc = !expanded && isLong ? desc.slice(0, maxLength) + "..." : desc;

  // renders a small svg icon
  const Icon = ({ path }) =>
    React.createElement(
      "svg",
      {
        width: 14,
        height: 14,
        viewBox: "0 0 16 16",
        fill: "currentColor",
        xmlns: "http://www.w3.org/2000/svg",
      },
      [React.createElement("path", { key: "p", d: path })],
    );

  // icons
  const calendarPath =
    "M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5h16V4H0V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5";
  const starPath =
    "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z";

  return React.createElement("div", { className: "movie-card" }, [
    // edit/delete button
    isGlobalView && isAdmin // only show if admin and in global view
      ? React.createElement(
          "button",
          {
            key: "delete",
            className: "edit-icon-button",
            title: "Remove movie",
            "aria-label": "Remove movie",
            onClick: () => onDelete && onDelete(movie.title),
          },
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
              React.createElement("line", {
                key: "l1",
                x1: 4,
                y1: 4,
                x2: 20,
                y2: 20,
                stroke: "currentColor",
                strokeWidth: 2,
              }),
              React.createElement("line", {
                key: "l2",
                x1: 20,
                y1: 4,
                x2: 4,
                y2: 20,
                stroke: "currentColor",
                strokeWidth: 2,
              }),
            ],
          ),
        )
      : onEdit
      ? React.createElement( // edit button at top right of card
          "button",
          {
            key: "edit",
            className: "edit-icon-button",
            title: "Edit",
            "aria-label": "Edit movie",
            onClick: () => onEdit && onEdit(movie.id),
          },
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
        )
      : null,
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
    // metadata
    React.createElement(
      "div",
      { key: "meta", className: "movie-meta" },
      [
        // release year
        React.createElement(
          "span",
          { key: "year", className: "meta-item" },
          [
            React.createElement(Icon, { key: "icon", path: calendarPath }),
            React.createElement(
              "span",
              { key: "text", className: "meta-text" },
              movie.releaseYear || "N/A",
            ),
          ],
        ),
        // rating
        React.createElement(
          "span",
          { key: "imdb", className: "meta-item imdb-rating" },
          [
            React.createElement(Icon, { key: "icon", path: starPath }),
            React.createElement(
              "span",
              { key: "text", className: "meta-text" },
              movie.imdbRating ? String(movie.imdbRating) : "N/A",
            ),
          ],
        ),
        // my rating
        React.createElement(
          "span",
          { key: "my", className: "meta-item my-rating" },
          [
            React.createElement(Icon, { key: "icon", path: starPath }),
            React.createElement(
              "span",
              { key: "text", className: "meta-text" },
              movie.rating ? String(movie.rating) : "N/A",
            ),
          ],
        ),
      ],
    ),
    // movie description
    React.createElement(
      "p",
      { key: "desc", className: "movie-description" },
      [
        displayedDesc,
        isLong
          ? React.createElement(
              "button",
              {
                key: "toggle",
                className: "show-more-btn",
                type: "button",
                onClick: () => setExpanded(!expanded),
              },
              expanded ? " Show less" : " Show more",
            )
          : null,
      ],
    ),
    // see notes button
    React.createElement(
      "button",
      {
        key: "notesBtn",
        className: "notes-icon-button",
        type: "button",
        onClick: () => setShowNotes(true),
        title: "See your notes",
        "aria-label": "See your notes",
      },
      [
        // icon
        React.createElement(
          "svg",
          {
            key: "icon",
            width: 16,
            height: 16,
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
          },
          [
            React.createElement("rect", {
              key: "r1",
              x: 4,
              y: 4,
              width: 16,
              height: 16,
              stroke: "currentColor",
              fill: "none",
              rx: 2,
            }),
            React.createElement("line", {
              key: "l1",
              x1: 6,
              y1: 8,
              x2: 18,
              y2: 8,
              stroke: "currentColor",
              strokeWidth: 2,
            }),
            React.createElement("line", {
              key: "l2",
              x1: 6,
              y1: 12,
              x2: 18,
              y2: 12,
              stroke: "currentColor",
              strokeWidth: 2,
            }),
            React.createElement("line", {
              key: "l3",
              x1: 6,
              y1: 16,
              x2: 18,
              y2: 16,
              stroke: "currentColor",
              strokeWidth: 2,
            }),
          ],
        ),
        React.createElement("span", { key: "lbl" }, "My Notes"),
      ],
    ),
    // rating component
    React.createElement(window.StarRating, {
      key: "rating",
      rating: movie.rating,
      onRate: (value) => onRate && onRate(movie.id, value),
    }),
    // notes overlay
    showNotes
      ? React.createElement(
          "div",
          { key: "notesOverlay", className: "model-overlay" },
          React.createElement("div", { className: "model" }, [
            React.createElement(
              "h3",
              { key: "h" },
              `My Notes for ${movie.title}`,
            ),
            React.createElement("textarea", {
              key: "ta",
              className: "notes-textarea",
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: "Enter your notes here...",
            }),
            React.createElement(
              "div",
              { key: "actions", className: "model-actions" },
              [
                React.createElement(
                  "button",
                  {
                    key: "close",
                    type: "button",
                    className: "btn btn-confirm",
                    onClick: () => setShowNotes(false),
                  },
                  "Close",
                ),
              ],
            ),
          ]),
        )
      : null,
  ]);
}

// expose component globally
window.MovieCard = MovieCard;
