import { fetchApi } from '../apiClient';
import { LEADS_BASE } from './config';

export const fetchLeadsApi = (token) => fetchApi(`${LEADS_BASE}/`, { token });

export const createLeadApi = (username, token) => fetchApi(`${LEADS_BASE}/`, { method: 'POST', body: { username, status: 'Pitching' }, token });

export const updateLeadApi = (id, data, token) => fetchApi(`${LEADS_BASE}/${id}`, { method: 'PUT', body: data, token });