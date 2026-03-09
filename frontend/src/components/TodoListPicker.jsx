import React, { useState, useEffect } from "react";
import { fetchProjects, fetchTodolists, saveSelections } from "../api";

export default function TodoListPicker({ selections, onSave }) {
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState(null); // project id
  const [todolists, setTodolists] = useState({}); // { projectId: [...] }
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

  async function handleSave() {
    setSaving(true);
    const list = Object.values(selected);
    await saveSelections(list);
    setSaving(false);
    onSave(list);
  }

  if (loadingProjects) return <div className="loading">Loading projects...</div>;

  return (
    <div className="picker">
      <h2>Select To-Do Lists to Track</h2>
      <p className="picker-hint">
        Pick the to-do lists that contain your communication tasks (emails,
        social posts, etc). Expand a project to see its lists.
      </p>

      <div className="project-list">
        {projects.map((p) => (
          <div key={p.id} className="project-item">
            <button
              className="project-header"
              onClick={() => toggleProject(p)}
            >
              <span className="expand-icon">
                {expanded === p.id ? "▼" : "▶"}
              </span>
              {p.name}
            </button>

            {expanded === p.id && (
              <div className="todolist-list">
                {loadingLists ? (
                  <div className="loading-small">Loading lists...</div>
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
        ))}
      </div>

      <button
        className="btn btn-primary save-btn"
        onClick={handleSave}
        disabled={saving || Object.keys(selected).length === 0}
      >
        {saving ? "Saving..." : `Save (${Object.keys(selected).length} selected)`}
      </button>
    </div>
  );
}
