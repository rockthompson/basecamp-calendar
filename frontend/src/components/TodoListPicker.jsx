import React, { useState, useEffect } from "react";
import { fetchProjects, fetchTodolists, saveSelections } from "../api";

export default function TodoListPicker({ selections, onSave }) {
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [todolists, setTodolists] = useState({});
  const [selected, setSelected] = useState(() => {
    const map = {};
    for (const s of selections) {
      map[`${s.project_id}-${s.todolist_id}`] = s;
    }
    return map;
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .finally(() => setLoadingProjects(false));
  }, []);

  async function toggleProject(project) {
    if (expanded === project.id) {
      setExpanded(null);
      return;
    }
    setExpanded(project.id);
    if (!todolists[project.id]) {
      setLoadingLists(true);
      const lists = await fetchTodolists(project.id);
      setTodolists((prev) => ({ ...prev, [project.id]: lists }));
      setLoadingLists(false);
    }
  }

  function toggleSelection(project, todolist) {
    const key = `${project.id}-${todolist.id}`;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          project_id: project.id,
          project_name: project.name,
          todolist_id: todolist.id,
          todolist_name: todolist.title,
        };
      }
      return next;
    });
  }

  function selectedCountForProject(projectId) {
    return Object.keys(selected).filter((k) =>
      k.startsWith(`${projectId}-`)
    ).length;
  }

  async function handleSave() {
    setSaving(true);
    const list = Object.values(selected);
    await saveSelections(list);
    setSaving(false);
    onSave(list);
  }

  const totalSelected = Object.keys(selected).length;

  if (loadingProjects) return <div className="loading">Loading projects</div>;

  return (
    <div className="picker">
      <div className="picker-header">
        <h2>Select To-Do Lists</h2>
        <p className="picker-hint">
          Choose which to-do lists to show on your calendar. Expand a project to
          see its lists.
        </p>
      </div>

      <div className="project-list">
        {projects.map((p) => {
          const count = selectedCountForProject(p.id);
          const isExpanded = expanded === p.id;

          return (
            <div
              key={p.id}
              className={`project-item${isExpanded ? " expanded" : ""}`}
            >
              <button
                className="project-header"
                onClick={() => toggleProject(p)}
              >
                <span className="expand-icon">
                  {isExpanded ? "−" : "+"}
                </span>
                {p.name}
                {count > 0 && (
                  <span className="project-count has-selected">
                    {count} selected
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="todolist-list">
                  {loadingLists ? (
                    <div className="loading-small">Loading lists</div>
                  ) : (
                    (todolists[p.id] || []).map((tl) => {
                      const key = `${p.id}-${tl.id}`;
                      return (
                        <label key={tl.id} className="todolist-item">
                          <input
                            type="checkbox"
                            checked={!!selected[key]}
                            onChange={() => toggleSelection(p, tl)}
                          />
                          {tl.title}
                        </label>
                      );
                    })
                  )}
                  {!loadingLists && (todolists[p.id] || []).length === 0 && (
                    <div className="empty">No to-do lists in this project</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalSelected > 0 && (
        <div className="save-bar">
          <span className="selection-count">
            <strong>{totalSelected}</strong> list{totalSelected !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save & View Calendar"}
          </button>
        </div>
      )}
    </div>
  );
}
