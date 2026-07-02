// Rule: Max 200 lines per file — split if exceeded
// Use the actual device IP to allow mobile connections
const hostname = window.location.hostname || "localhost";
const API_BASE = `http://${hostname}:8011/api/notes`;
const AI_BASE = `http://${hostname}:8011/api/ai`;

export const fetchNotesApi = async (token) => {
  const res = await fetch(`${API_BASE}/`, { headers: { "X-Master-Token": token } });
  if (res.status === 403) throw new Error("Invalid Master Token");
  return await res.json();
};

export const createNoteApi = async (token, folderId = null) => {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content: "New Note\n\n(Tip: Type /spend 500 Coffee to log an expense!)", title: "Untitled Note", folder_id: folderId })
  });
  return await res.json();
};

export const saveNoteApi = async (id, content, token, title, folderId = null) => {
  await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content, title, folder_id: folderId })
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

export const sendOmniChatApi = async (message, sessionId, token) => {
  const res = await fetch(`${AI_BASE}/omni-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ message, session_id: sessionId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Omni-Chat request failed");
  }
  return await res.json();
};

export const generateTitleApi = async (content, token) => {
  const res = await fetch(`${AI_BASE}/generate-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error("Title generation failed");
  const data = await res.json();
  return data.title;
};

export const deleteNoteApi = async (noteId, token) => {
  const res = await fetch(`${API_BASE}/${noteId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete note");
  return await res.json();
};

export const deleteNotesApi = async (noteIds, token) => {
  const res = await fetch(`${API_BASE}/delete-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ note_ids: noteIds })
  });
  if (!res.ok) throw new Error("Bulk delete failed");
  return await res.json();
};

export const loginApi = async (password, deviceName) => {
  const res = await fetch(`http://${hostname}:8011/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, device_name: deviceName })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  return await res.json();
};

export const getSessionsApi = async (token) => {
  const res = await fetch(`http://${hostname}:8011/api/auth/sessions`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return await res.json();
};

export const deleteSessionApi = async (sessionId, token) => {
  const res = await fetch(`http://${hostname}:8011/api/auth/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return await res.json();
};

export const getFoldersApi = async (token) => {
  const res = await fetch(`${API_BASE}/folders`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch folders");
  return await res.json();
};

export const createFolderApi = async (name, token) => {
  const res = await fetch(`${API_BASE}/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error("Failed to create folder");
  return await res.json();
};

export const deleteFolderApi = async (folderId, token) => {
  const res = await fetch(`${API_BASE}/folders/${folderId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete folder");
  return await res.json();
};

export const getChatSessionsApi = async (token) => {
  const res = await fetch(`${AI_BASE}/chat-sessions`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch chat sessions");
  return await res.json();
};

export const getChatMessagesApi = async (sessionId, token) => {
  const res = await fetch(`${AI_BASE}/chat-sessions/${sessionId}`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch chat messages");
  return await res.json();
};
