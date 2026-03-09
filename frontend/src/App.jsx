import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import TodoListPicker from "./components/TodoListPicker";
import Calendar from "./components/Calendar";
import { fetchMe, fetchSelections } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("calendar"); // "calendar" | "settings"
  const [selections, setSelections] = useState([]);

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

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Login />;

  const hasSelections = selections.length > 0;

  return (
    <div className="app">
      <header className="header">
        <h1>Basecamp Calendar</h1>
        <div className="header-right">
          <span className="user-name">{user.name}</span>
          <button
            className="btn btn-secondary"
            onClick={() =>
              setView(view === "calendar" ? "settings" : "calendar")
            }
          >
            {view === "calendar" ? "Settings" : "Back to Calendar"}
          </button>
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
