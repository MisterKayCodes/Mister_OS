import { fetchApi } from '../apiClient';
import { TASKS_BASE } from './config';

export const getTasksApi = (token) => fetchApi(`${TASKS_BASE}/`, { token });

export const createTaskApi = (title, token) => fetchApi(`${TASKS_BASE}/`, { method: 'POST', body: { title, description: "" }, token });

export const updateTaskApi = (id, data, token) => fetchApi(`${TASKS_BASE}/${id}`, { method: 'PUT', body: data, token });

export const deleteTaskApi = (id, token) => fetchApi(`${TASKS_BASE}/${id}`, { method: 'DELETE', token });