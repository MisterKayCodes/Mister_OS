import { fetchApi } from '../apiClient';
import { LEADS_BASE } from './config';
const getLeadsBase = () => LEADS_BASE;

export const fetchLeadsApi = (token) => fetchApi(`${getLeadsBase()}/`, { token });

export const createLeadApi = (username, token) => fetchApi(`${getLeadsBase()}/`, { method: 'POST', body: { username, status: 'Pitching' }, token });

export const updateLeadApi = (id, data, token) => fetchApi(`${getLeadsBase()}/${id}`, { method: 'PUT', body: data, token });