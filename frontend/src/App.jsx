import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import TodoListPicker from "./components/TodoListPicker";
import Calendar from "./components/Calendar";
import { fetchMe, fetchSelections, logout } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("calendar"); // "calendar" | "settings"
  const [selections, setSelections] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        if (u) {
          fetchSelections().then(setSelections);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading</div>;
  if (!user) return <Login />;

  const hasSelections = selections.length > 0;
  const displayName = user.name || user.email || "";
  const initials = displayName
    ? (displayName.includes("@")
        ? displayName[0].toUpperCase()
        : displayName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2))
    : "?";

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1>The Partnership Marketing Communications Calendar</h1>
        </div>
        <div className="header-right">
          <button
            className="btn-icon"
            onClick={() =>
              setView(view === "calendar" ? "settings" : "calendar")
            }
            title={view === "calendar" ? "Settings" : "Back to Calendar"}
          >
            {view === "calendar" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
          </button>
          <div className="avatar-wrapper">
            <button
              className="user-avatar"
              onClick={() => setShowMenu(!showMenu)}
              title={user.name}
            >
              {initials}
            </button>
            {showMenu && (
              <div className="avatar-menu">
                <div className="avatar-menu-name">{displayName}</div>
                {user.email && user.email !== displayName && (
                  <div className="avatar-menu-email">{user.email}</div>
                )}
                <button
                  className="avatar-menu-item"
                  onClick={async () => {
                    await logout();
                    setUser(null);
                    setShowMenu(false);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {view === "settings" || !hasSelections ? (
          <TodoListPicker
            selections={selections}
            onSave={(s) => {
              setSelections(s);
              setView("calendar");
            }}
          />
        ) : (
          <Calendar />
        )}
      </main>
    </div>
  );
}
