import { fetchApi } from '../apiClient';
import { LEADS_BASE } from './config';

export const fetchPendingDraftsApi = (token) => fetchApi(`${LEADS_BASE}/drafts/pending`, { token });

export const approveDraftApi = (id, editedContent, token) => fetchApi(`${LEADS_BASE}/drafts/${id}/approve`, { method: 'POST', body: { edited_content: editedContent }, token });

export const updateDraftApi = (id, content, token) => fetchApi(`${LEADS_BASE}/drafts/${id}`, { method: 'PUT', body: { content, role: "assistant", lead_id: 0 }, token });

export const deleteDraftApi = (id, token) => fetchApi(`${LEADS_BASE}/drafts/${id}`, { method: 'DELETE', token });

export const generateFollowupsApi = (token) => fetchApi(`${LEADS_BASE}/generate-followups`, { method: 'POST', token });
