import React, { useState, useEffect, useMemo } from "react";
import { fetchCalendarTodos } from "../api";
import TaskModal from "./TaskModal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PROJECT_COLORS = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", dot: "#3b82f6" },
  { bg: "#fce7f3", border: "#ec4899", text: "#9d174d", dot: "#ec4899" },
  { bg: "#d1fae5", border: "#10b981", text: "#065f46", dot: "#10b981" },
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", dot: "#f59e0b" },
  { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6", dot: "#8b5cf6" },
  { bg: "#ffedd5", border: "#f97316", text: "#9a3412", dot: "#f97316" },
  { bg: "#e0f2fe", border: "#0ea5e9", text: "#075985", dot: "#0ea5e9" },
  { bg: "#fce4ec", border: "#e91e63", text: "#880e4f", dot: "#e91e63" },
  { bg: "#e8f5e9", border: "#4caf50", text: "#1b5e20", dot: "#4caf50" },
  { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8", dot: "#a855f7" },
];

const PROJECT_COLORS_DARK = [
  { bg: "rgba(59,130,246,0.18)",  border: "#60a5fa", text: "#93c5fd", dot: "#60a5fa" },
  { bg: "rgba(236,72,153,0.18)",  border: "#f472b6", text: "#f9a8d4", dot: "#f472b6" },
  { bg: "rgba(16,185,129,0.18)",  border: "#34d399", text: "#6ee7b7", dot: "#34d399" },
  { bg: "rgba(245,158,11,0.18)",  border: "#fbbf24", text: "#fcd34d", dot: "#fbbf24" },
  { bg: "rgba(139,92,246,0.18)",  border: "#a78bfa", text: "#c4b5fd", dot: "#a78bfa" },
  { bg: "rgba(249,115,22,0.18)",  border: "#fb923c", text: "#fdba74", dot: "#fb923c" },
  { bg: "rgba(14,165,233,0.18)",  border: "#38bdf8", text: "#7dd3fc", dot: "#38bdf8" },
  { bg: "rgba(233,30,99,0.18)",   border: "#f06292", text: "#f48fb1", dot: "#f06292" },
  { bg: "rgba(76,175,80,0.18)",   border: "#66bb6a", text: "#a5d6a7", dot: "#66bb6a" },
  { bg: "rgba(168,85,247,0.18)",  border: "#c084fc", text: "#d8b4fe", dot: "#c084fc" },
];

function getProjectColor(projectId, dark) {
  const colors = dark ? PROJECT_COLORS_DARK : PROJECT_COLORS;
  const idx = Math.abs(hashCode(String(projectId))) % colors.length;
  return colors[idx];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function useIsDark() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}

const MAX_VISIBLE_BARS = 4;

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTodo, setModalTodo] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [hiddenProjects, setHiddenProjects] = useState(new Set());
  const [showCompleted, setShowCompleted] = useState(true);
  const isDark = useIsDark();

  useEffect(() => {
    setLoading(true);
    fetchCalendarTodos()
      .then(setTodos)
      .finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setExpandedWeek(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setExpandedWeek(null);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setExpandedWeek(null);
  }

  function handleStatusChange(todoId, newCompleted) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, completed: newCompleted } : t
      )
    );
  }

  function toggleProject(pid) {
    setHiddenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }

  // Filtered todos
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      if (hiddenProjects.has(t.project_id)) return false;
      if (!showCompleted && t.completed) return false;
      return true;
    });
  }, [todos, hiddenProjects, showCompleted]);

  // Todos visible in the current month
  const monthTodos = useMemo(() => {
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = getDaysInMonth(year, month);
    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return todos.filter(
      (t) => t.starts_on <= monthEnd && t.due_on >= monthStart
    );
  }, [todos, year, month]);

  // Projects with per-project stats, scoped to current month
  const projects = useMemo(() => {
    const todayS = toDateStr(today);
    const map = new Map();
    for (const t of monthTodos) {
      if (!map.has(t.project_id)) {
        map.set(t.project_id, {
          id: t.project_id,
          name: t.project_name,
          color: getProjectColor(t.project_id, isDark),
          upcoming: 0,
          overdue: 0,
          completed: 0,
        });
      }
      const p = map.get(t.project_id);
      if (t.completed) p.completed++;
      else if (t.due_on < todayS) p.overdue++;
      else p.upcoming++;
    }
    return Array.from(map.values());
  }, [monthTodos, isDark]);

  // Build weeks
  const weeks = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const result = [];
    let week = [];
    for (let i = 0; i < firstDay; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(new Date(year, month, d));
      if (week.length === 7) { result.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [year, month]);

  // Assign tasks to lanes within each week
  const weekData = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week.find((d) => d !== null);
      const weekEnd = week.filter((d) => d !== null).pop();
      if (!weekStart || !weekEnd) return { week, lanes: [] };

      const ws = toDateStr(weekStart);
      const we = toDateStr(weekEnd);

      const overlapping = filteredTodos.filter(
        (t) => t.starts_on <= we && t.due_on >= ws
      );

      // Pre-compute columns for sorting
      const items = overlapping.map((task) => {
        const taskStart = task.starts_on < ws ? ws : task.starts_on;
        const taskEnd = task.due_on > we ? we : task.due_on;
        const startCol = week.findIndex(
          (d) => d && toDateStr(d) === taskStart
        );
        const endCol = week.findIndex((d) => d && toDateStr(d) === taskEnd);
        return {
          task, startCol, endCol,
          isStart: task.starts_on >= ws,
          isEnd: task.due_on <= we,
        };
      }).filter((item) => item.startCol !== -1 && item.endCol !== -1);

      // Sort: start column first, then longer spans first (fills top-left to right)
      items.sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        const aSpan = a.endCol - a.startCol;
        const bSpan = b.endCol - b.startCol;
        return bSpan - aSpan;
      });

      const lanes = [];
      for (const item of items) {
        let placed = false;
        for (let l = 0; l < lanes.length; l++) {
          const conflict = lanes[l].some(
            (existing) =>
              !(item.endCol < existing.startCol || item.startCol > existing.endCol)
          );
          if (!conflict) {
            lanes[l].push(item);
            placed = true;
            break;
          }
        }
        if (!placed) {
          lanes.push([item]);
        }
      }

      return { week, lanes };
    });
  }, [weeks, filteredTodos]);

  const todayStr = toDateStr(today);

  if (loading) return <div className="loading">Loading calendar</div>;

  return (
    <div className="cal-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="cal-sidebar">
        {/* Filters */}
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Filters</h3>
          <label className="sidebar-toggle">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            Show completed
          </label>
        </div>

        {/* Project legend with per-project stats */}
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Projects</h3>
          <div className="sidebar-projects">
            {projects.map((p) => {
              const isHidden = hiddenProjects.has(p.id);
              return (
                <div key={p.id} className={`sidebar-project-card${isHidden ? " hidden-project" : ""}`}>
                  <div className="sidebar-project-header">
                    <span
                      className="project-dot"
                      style={{ background: isHidden ? "var(--border)" : p.color.dot }}
                    />
                    <span className="project-label">{p.name}</span>
                    <label className="project-toggle" title={isHidden ? `Show ${p.name}` : `Hide ${p.name}`}>
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleProject(p.id)}
                      />
                      <span className="project-toggle-track" style={{
                        background: isHidden ? undefined : p.color.dot,
                      }}>
                        <span className="project-toggle-thumb" />
                      </span>
                    </label>
                  </div>
                  <div className="project-stats">
                    <span className="project-stat">
                      <span className="project-stat-num">{p.upcoming}</span> upcoming
                    </span>
                    {p.overdue > 0 && (
                      <span className="project-stat project-stat-overdue">
                        <span className="project-stat-num">{p.overdue}</span> overdue
                      </span>
                    )}
                    <span className="project-stat project-stat-done">
                      <span className="project-stat-num">{p.completed}</span> done
                    </span>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="sidebar-empty">No tasks this month</p>
            )}
          </div>
        </div>
      </aside>

      {/* ===== CALENDAR ===== */}
      <div className="calendar-container">
        <div className="calendar-nav">
          <h2>
            {MONTHS[month]} {year}
          </h2>
          <div className="nav-buttons">
            <button className="btn btn-secondary today-btn" onClick={goToday}>
              Today
            </button>
            <button className="btn-icon" onClick={prevMonth} title="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button className="btn-icon" onClick={nextMonth} title="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="cal-table">
          <div className="cal-header-row">
            {DAYS.map((d) => (
              <div key={d} className="cal-header-cell">{d}</div>
            ))}
          </div>

          {weekData.map(({ week, lanes }, wi) => {
            const isExpanded = expandedWeek === wi;
            const visibleLanes = isExpanded
              ? lanes
              : lanes.slice(0, MAX_VISIBLE_BARS);
            const hiddenCount = lanes.length - MAX_VISIBLE_BARS;

            return (
              <div key={wi} className="cal-week">
                <div className="cal-day-row">
                  {week.map((d, di) => {
                    if (!d)
                      return <div key={`e-${di}`} className="cal-day-cell empty" />;
                    const ds = toDateStr(d);
                    const isToday = ds === todayStr;
                    return (
                      <div
                        key={ds}
                        className={`cal-day-cell${isToday ? " today" : ""}`}
                      >
                        <span className={`cal-day-num${isToday ? " today-num" : ""}`}>
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="cal-bar-area" style={(() => {
                    const todayCol = week.findIndex(
                      (d) => d && toDateStr(d) === todayStr
                    );
                    if (todayCol === -1) return undefined;
                    const left = (todayCol * 100 / 7).toFixed(4);
                    const right = ((todayCol + 1) * 100 / 7).toFixed(4);
                    return {
                      background: `linear-gradient(to right, var(--surface) ${left}%, var(--accent-light) ${left}%, var(--accent-light) ${right}%, var(--surface) ${right}%)`,
                    };
                  })()}>
                  {visibleLanes.map((lane, li) => (
                    <div key={li} className="cal-lane">
                      {lane.map((item) => {
                        const color = getProjectColor(item.task.project_id, isDark);
                        const span = item.endCol - item.startCol + 1;
                        const radiusL = item.isStart ? "5px" : "0";
                        const radiusR = item.isEnd ? "5px" : "0";
                        const contClasses = [
                          "cal-bar",
                          item.task.completed ? "cal-bar-done" : "",
                          !item.isEnd ? "continues-right" : "",
                          !item.isStart ? "continues-left" : "",
                        ].filter(Boolean).join(" ");

                        return (
                          <div
                            key={item.task.id}
                            className={contClasses}
                            style={{
                              gridColumn: `${item.startCol + 1} / span ${span}`,
                              background: color.bg,
                              borderLeft: item.isStart
                                ? `3px solid ${color.border}`
                                : `none`,
                              borderRadius: `${radiusL} ${radiusR} ${radiusR} ${radiusL}`,
                              color: color.text,
                            }}
                            onClick={() => setModalTodo(item.task)}
                            title={item.task.title}
                          >
                            {item.isStart ? (
                              <span className="cal-bar-label">
                                {item.task.title}
                              </span>
                            ) : (
                              <span className="cal-bar-label cont-label">
                                {item.task.title}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {!isExpanded && hiddenCount > 0 && (
                    <button
                      className="cal-more-btn"
                      onClick={() => setExpandedWeek(wi)}
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                  {isExpanded && hiddenCount > 0 && (
                    <button
                      className="cal-more-btn"
                      onClick={() => setExpandedWeek(null)}
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalTodo && (
        <TaskModal
          todo={modalTodo}
          onClose={() => setModalTodo(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
