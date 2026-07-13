import { fetchApi } from '../apiClient';
import { API_BASE } from './config';

export const fetchNotesApi = (token) => fetchApi(`${API_BASE}/`, { token });

export const fetchNotesCountApi = (token) => fetchApi(`${API_BASE}/count`, { token });

export const createNoteApi = (token, folderId = null) => fetchApi(`${API_BASE}/`, { 
  method: 'POST', 
  body: { 
    content: "New Note\n\n(Tip: Type /spend 500 Coffee to log an expense!)", 
    title: "Untitled Note", 
    folder_id: folderId 
  }, 
  token 
});

export const saveNoteApi = (id, content, token, title, folderId = null) => fetchApi(`${API_BASE}/${id}`, { 
  method: 'PUT', 
  body: { content, title, folder_id: folderId }, 
  token 
});

export const deleteNoteApi = (noteId, token) => fetchApi(`${API_BASE}/${noteId}`, { method: 'DELETE', token });

export const deleteNotesApi = (noteIds, token) => fetchApi(`${API_BASE}/delete-bulk`, { method: 'POST', body: { note_ids: noteIds }, token });

export const moveNotesBulkApi = (noteIds, folderId, token) => fetchApi(`${API_BASE}/move-bulk`, { method: 'POST', body: { note_ids: noteIds, folder_id: folderId }, token });