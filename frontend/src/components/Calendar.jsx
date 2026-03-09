import React, { useState, useEffect } from "react";
import { fetchCalendarTodos } from "../api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchCalendarTodos()
      .then(setTodos)
      .finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  }

  // Group todos by date
  const todosByDate = {};
  for (const t of todos) {
    const d = t.due_on;
    if (!todosByDate[d]) todosByDate[d] = [];
    todosByDate[d].push(t);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Get todos for selected day
  const selectedTodos = selectedDay ? todosByDate[dateStr(selectedDay)] || [] : [];

  if (loading) return <div className="loading">Loading calendar...</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-nav">
        <button className="btn btn-secondary" onClick={prevMonth}>
          ← Prev
        </button>
        <h2>
          {MONTHS[month]} {year}
        </h2>
        <button className="btn btn-secondary" onClick={nextMonth}>
          Next →
        </button>
      </div>

      <div className="calendar-grid">
        {DAYS.map((d) => (
          <div key={d} className="calendar-header-cell">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null)
            return <div key={`empty-${i}`} className="calendar-cell empty" />;

          const ds = dateStr(day);
          const dayTodos = todosByDate[ds] || [];
          const isToday = ds === todayStr;
          const isSelected = selectedDay === day;

          return (
            <div
              key={day}
              className={`calendar-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}${dayTodos.length ? " has-todos" : ""}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="day-number">{day}</span>
              {dayTodos.length > 0 && (
                <span className="todo-count">{dayTodos.length}</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="day-detail">
          <h3>
            {MONTHS[month]} {selectedDay}, {year}
          </h3>
          {selectedTodos.length === 0 ? (
            <p className="empty">No to-dos due this day</p>
          ) : (
            <ul className="todo-list">
              {selectedTodos.map((t) => (
                <li key={t.id} className={`todo-item${t.completed ? " completed" : ""}`}>
                  <div className="todo-title">
                    <a href={t.url} target="_blank" rel="noopener noreferrer">
                      {t.title}
                    </a>
                  </div>
                  <div className="todo-meta">
                    <span className="project-tag">{t.project_name}</span>
                    <span className="list-tag">{t.todolist_name}</span>
                    {t.assignees.length > 0 && (
                      <span className="assignees">
                        {t.assignees.join(", ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
