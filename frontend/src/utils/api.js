// Rule: Max 200 lines per file — split if exceeded
const API_BASE = "http://localhost:8011/api/notes";
const AI_BASE = "http://localhost:8011/api/ai";

export const fetchNotesApi = async (token) => {
  const res = await fetch(`${API_BASE}/`, { headers: { "X-Master-Token": token } });
  if (res.status === 403) throw new Error("Invalid Master Token");
  return await res.json();
};

export const createNoteApi = async (token) => {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content: "New Note\n\n(Tip: Type /spend 500 Coffee to log an expense!)", title: "Untitled Note" })
  });
  return await res.json();
};

export const saveNoteApi = async (id, content, token) => {
  await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content })
  });
};

export const fetchExpensesApi = async (token) => {
  const res = await fetch(`${API_BASE}/expenses/all`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return await res.json();
};

export const analyzeChatApi = async (content, token) => {
  const res = await fetch(`${AI_BASE}/analyze-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ chat_log: content })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Analysis failed");
  }
  const data = await res.json();
  return data.analysis;
};
