import React, { useState, useEffect } from "react";
import { fetchTodoDetail, completeTodo, uncompleteTodo } from "../api";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TaskModal({ todo, onClose, onStatusChange }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [completed, setCompleted] = useState(todo.completed);

  useEffect(() => {
    setLoading(true);
    fetchTodoDetail(todo.project_id, todo.id)
      .then((d) => {
        setDetail(d);
        setCompleted(d.completed);
      })
      .finally(() => setLoading(false));
  }, [todo.id, todo.project_id]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function toggleComplete() {
    setToggling(true);
    const newState = !completed;
    try {
      if (newState) {
        await completeTodo(todo.project_id, todo.id);
      } else {
        await uncompleteTodo(todo.project_id, todo.id);
      }
      setCompleted(newState);
      onStatusChange(todo.id, newState);
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-project-tag">{todo.project_name}</span>
            <span className="modal-list-tag">{todo.todolist_name}</span>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="modal-spinner" />
              Loading task details...
            </div>
          ) : (
            <>
              {/* Title + completion toggle */}
              <div className="modal-title-row">
                <button
                  className={`modal-check${completed ? " checked" : ""}`}
                  onClick={toggleComplete}
                  disabled={toggling}
                  title={completed ? "Mark incomplete" : "Mark complete"}
                >
                  {completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <h2 className={completed ? "completed-title" : ""}>
                  {todo.title}
                </h2>
              </div>

              {/* Meta info */}
              <div className="modal-meta">
                {todo.due_on && (
                  <div className="modal-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Due {formatDate(todo.due_on)}</span>
                  </div>
                )}
                {detail?.creator && (
                  <div className="modal-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Created by {detail.creator}</span>
                  </div>
                )}
                {detail?.assignees?.length > 0 && (
                  <div className="modal-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{detail.assignees.map((a) => a.name).join(", ")}</span>
                  </div>
                )}
                {completed && detail?.completed_at && (
                  <div className="modal-meta-item completed-meta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Completed {formatDateTime(detail.completed_at)}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {detail?.description && (
                <div className="modal-section">
                  <h4>Notes</h4>
                  <div
                    className="modal-description"
                    dangerouslySetInnerHTML={{ __html: detail.description }}
                  />
                </div>
              )}

              {/* Comments */}
              {detail?.comments?.length > 0 && (
                <div className="modal-section">
                  <h4>Comments ({detail.comments.length})</h4>
                  <div className="modal-comments">
                    {detail.comments.map((c) => (
                      <div key={c.id} className="modal-comment">
                        <div className="comment-header">
                          <span className="comment-author">{c.creator}</span>
                          <span className="comment-date">
                            {formatDateTime(c.created_at)}
                          </span>
                        </div>
                        <div
                          className="comment-body"
                          dangerouslySetInnerHTML={{ __html: c.content }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <a
            href={todo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open in Basecamp
          </a>
        </div>
      </div>
    </div>
  );
}
