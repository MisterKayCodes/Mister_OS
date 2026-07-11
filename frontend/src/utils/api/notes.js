import { API_BASE } from './config';
import { enqueue } from '../offlineQueue';

export const fetchNotesApi = async (token) => {
  const res = await fetch(`${API_BASE}/`, { headers: { "X-Master-Token": token } });
  if (res.status === 403) throw new Error("Invalid Master Token");
  return await res.json();
};

export const fetchNotesCountApi = async (token) => {
  const res = await fetch(`${API_BASE}/count`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch count");
  return await res.json();
};

export const createNoteApi = async (token, folderId = null) => {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ 
      content: "New Note\n\n(Tip: Type /spend 500 Coffee to log an expense!)", 
      title: "Untitled Note", 
      folder_id: folderId 
    })
  });
  return await res.json();
};

export const saveNoteApi = async (id, content, token, title, folderId = null) => {
  try {
    await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Token": token },
      body: JSON.stringify({ content, title, folder_id: folderId })
    });
  } catch (err) {
    enqueue({ 
      type: 'save_note', 
      url: `${API_BASE}/${id}`, 
      method: 'PUT', 
      body: { content, title, folder_id: folderId } 
    });
  }
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

export const moveNotesBulkApi = async (noteIds, folderId, token) => {
  const res = await fetch(`${API_BASE}/move-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ note_ids: noteIds, folder_id: folderId })
  });
  if (!res.ok) throw new Error("Bulk move failed");
  return await res.json();
};