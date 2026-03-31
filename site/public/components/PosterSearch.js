// for searching and selecting movie posters
const { createElement } = React;

/**
 * PosterSearch
 * 
 * isOpen: whether the overlay should be visible
 * query: search value
 * onQueryChange: update search value
 * results: array of tmdb's poster urls
 * onSelect: when a poster is selected
 * onClose: when the overlay should be closed
 */
function PosterSearchOverlay({
  isOpen,
  query,
  onQueryChange,
  results,
  onSelect,
  onClose,
}) {
  // hide if not open
  if (!isOpen) {
    return null;
  }

  return createElement(
    "div",
    { className: "model-overlay poster-search-modal" },
    createElement("div", { className: "model" }, [
      createElement("h2", { key: "header" }, "Search Media"),
      // search input
      createElement("input", {
        key: "searchInput",
        type: "text",
        className: "poster-search-input",
        value: query,
        onChange: (e) => onQueryChange && onQueryChange(e.target.value), // query update
        placeholder: "Search movie title",
      }),
      // results array
      createElement(
        "div",
        { key: "results", className: "poster-search-results" },
        results.map((url, idx) =>
          createElement(
            "div",
            {
              key: idx,
              className: "poster-search-option",
              onClick: () => onSelect && onSelect(url), // if it exists, call
            },
            createElement("img", {
              src: url,
              alt: "Poster option",
            }),
          ),
        ),
      ),
      // close button
      createElement(
        "div",
        { key: "actions", className: "model-actions" },
        [
          createElement(
            "button",
            {
              key: "closeBtn",
              type: "button",
              className: "btn btn-cancel",
              onClick: () => onClose && onClose(), // if it exists, call
            },
            "Close",
          ),
        ],
      ),
    ]),
  );
}

// global
window.PosterSearchOverlay = PosterSearchOverlay;