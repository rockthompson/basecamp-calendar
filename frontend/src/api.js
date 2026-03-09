const API = "";

export async function fetchMe() {
  const res = await fetch(`${API}/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API}/api/projects`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function fetchTodolists(projectId) {
  const res = await fetch(`${API}/api/projects/${projectId}/todolists`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch todolists");
  return res.json();
}

export async function fetchCalendarTodos() {
  const res = await fetch(`${API}/api/calendar`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch calendar");
  return res.json();
}

export async function saveSelections(selections) {
  const res = await fetch(`${API}/api/selections`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selections),
  });
  if (!res.ok) throw new Error("Failed to save selections");
  return res.json();
}

export async function fetchSelections() {
  const res = await fetch(`${API}/api/selections`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch selections");
  return res.json();
}

export function loginUrl() {
  return `${API}/auth/login`;
}
