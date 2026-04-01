/**
 * Docs:
 * - https://react.dev/reference/react/createElement
 * - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
 */

function SettingsPage({
  accountType = "",
  settingsError = "",
  settingsUsername = "",
  settingsPassword = "",
  settingsConfirmPassword = "",
  settingsUsers = [],
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSaveCurrent,
  updateUserField,
  saveUser,
}) {
  // determine if current user is admin
  const isAdmin = accountType === "admin";

  // personal settings card
  const personalSection = React.createElement(
    window.SettingsCard,
    { key: "personal", title: "Account Settings" },
    [
      settingsError && !Array.isArray(settingsError)
        ? React.createElement(
            "div",
            { key: "err", className: "settings-error" },
            settingsError,
          )
        : null,
      React.createElement("label", { key: "uLabel" }, [
        React.createElement("span", { key: "s" }, "Username"),
        React.createElement("input", {
          key: "uInput",
          type: "text",
          value: settingsUsername,
          onChange: (e) => onUsernameChange && onUsernameChange(e.target.value),
        }),
      ]),
      React.createElement("label", { key: "pLabel" }, [
        React.createElement("span", { key: "s" }, "New Password"),
        React.createElement("input", {
          key: "pInput",
          type: "password",
          value: settingsPassword,
          onChange: (e) => onPasswordChange && onPasswordChange(e.target.value),
          placeholder: "Enter new password",
        }),
      ]),
      React.createElement("label", { key: "cpLabel" }, [
        React.createElement("span", { key: "s" }, "Confirm Password"),
        React.createElement("input", {
          key: "cpInput",
          type: "password",
          value: settingsConfirmPassword,
          onChange: (e) =>
            onConfirmPasswordChange &&
            onConfirmPasswordChange(e.target.value),
          placeholder: "Re-enter new password",
        }),
      ]),
      React.createElement(
        "button",
        {
          key: "saveBtn",
          className: "btn btn-confirm",
          onClick: () => onSaveCurrent && onSaveCurrent(),
        },
        "Save",
      ),
    ],
  );

  // admin user management table
  const adminTable = React.createElement(
    window.SettingsCard,
    { key: "userManagement", title: "User Management" },
    [
      settingsError && Array.isArray(settingsError)
        ? React.createElement(
            "div",
            { key: "err", className: "settings-error" },
            settingsError,
          )
        : null,
      React.createElement(
        "table",
        { key: "table", className: "settings-table" },
        [
          React.createElement(
            "thead",
            { key: "thead" },
            React.createElement("tr", { key: "tr" }, [
              React.createElement("th", { key: "u" }, "Username"),
              React.createElement("th", { key: "r" }, "Role"),
              React.createElement("th", { key: "p" }, "New Password"),
              React.createElement("th", { key: "cp" }, "Confirm Password"),
              React.createElement("th", { key: "a" }, "Action"),
            ]),
          ),
          React.createElement(
            "tbody",
            { key: "tbody" },
            settingsUsers.map((u, idx) =>
              React.createElement("tr", { key: idx }, [
                React.createElement(
                  "td",
                  { key: "u" },
                  React.createElement("input", {
                    type: "text",
                    value: u.newUsername,
                    onChange: (e) =>
                      updateUserField &&
                      updateUserField(idx, "newUsername", e.target.value),
                  }),
                ),
                React.createElement(
                  "td",
                  { key: "r" },
                  React.createElement(
                    "select",
                    {
                      value: u.newAccountType,
                      onChange: (e) =>
                        updateUserField &&
                        updateUserField(idx, "newAccountType", e.target.value),
                    },
                    [
                      React.createElement(
                        "option",
                        { key: "user", value: "user" },
                        "user",
                      ),
                      React.createElement(
                        "option",
                        { key: "admin", value: "admin" },
                        "admin",
                      ),
                    ],
                  ),
                ),
                React.createElement(
                  "td",
                  { key: "p" },
                  React.createElement("input", {
                    type: "password",
                    value: u.newPassword,
                    onChange: (e) =>
                      updateUserField &&
                      updateUserField(idx, "newPassword", e.target.value),
                    placeholder: "Enter new password",
                  }),
                ),
                React.createElement(
                  "td",
                  { key: "cp" },
                  React.createElement("input", {
                    type: "password",
                    value: u.newConfirmPassword,
                    onChange: (e) =>
                      updateUserField &&
                      updateUserField(
                        idx,
                        "newConfirmPassword",
                        e.target.value,
                      ),
                    placeholder: "Re-enter new password",
                  }),
                ),
                React.createElement(
                  "td",
                  { key: "a" },
                  React.createElement(
                    "button",
                    {
                      className: "btn btn-confirm",
                      onClick: () => saveUser && saveUser(idx),
                    },
                    "Save",
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    ],
  );

  return React.createElement(
    "main",
    { className: "settings-page" },
    isAdmin ? [personalSection, adminTable] : [personalSection],
  );
}

// global
window.SettingsPage = SettingsPage;