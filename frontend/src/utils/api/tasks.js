import { BASE_URL } from './config';
import { fetchApi } from '../apiClient';

export const getTasksApi = (token) => fetchApi(`${BASE_URL}/api/tasks/`, { token });

export const createTaskApi = (title, token) => fetchApi(`${BASE_URL}/api/tasks/`, { method: 'POST', body: { title, description: "" }, token });

export const updateTaskApi = (id, data, token) => fetchApi(`${BASE_URL}/api/tasks/${id}`, { method: 'PUT', body: data, token });

export const deleteTaskApi = (id, token) => fetchApi(`${BASE_URL}/api/tasks/${id}`, { method: 'DELETE', token });