import { fetchApi } from '../apiClient';
import { LEADS_BASE } from './config';
const getLeadsBase = () => LEADS_BASE;

export const fetchPendingDraftsApi = (token) => fetchApi(`${getLeadsBase()}/drafts/pending`, { token });

export const approveDraftApi = (id, editedContent, token) => fetchApi(`${getLeadsBase()}/drafts/${id}/approve`, { method: 'POST', body: { edited_content: editedContent }, token });

export const updateDraftApi = (id, content, token) => fetchApi(`${getLeadsBase()}/drafts/${id}`, { method: 'PUT', body: { content, role: "assistant", lead_id: 0 }, token });

export const deleteDraftApi = (id, token) => fetchApi(`${getLeadsBase()}/drafts/${id}`, { method: 'DELETE', token });

export const generateFollowupsApi = (token) => fetchApi(`${getLeadsBase()}/generate-followups`, { method: 'POST', token });
