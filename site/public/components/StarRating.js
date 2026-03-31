// star rating system
const { useState } = React;

function StarRating({ rating, onRate }) {
  const [hoverValue, setHoverValue] = useState(0);
  return React.createElement(
    "div",
    { className: "rating" },
    [1, 2, 3, 4, 5].map((value) => {
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

// makes it global
window.StarRating = StarRating;
