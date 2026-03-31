// settings card
function SettingsCard({ title, children }) {
  return React.createElement("div", { className: "settings-card" }, [
    title
      ? React.createElement(
          "h3",
          { key: "title", className: "settings-card-title" },
          title,
        )
      : null,
    React.createElement(
      "div",
      { key: "body", className: "settings-card-body" },
      children,
    ),
  ]);
}

// global
window.SettingsCard = SettingsCard;
