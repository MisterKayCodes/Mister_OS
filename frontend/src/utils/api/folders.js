import { API_BASE } from './config';
import { fetchApi } from '../apiClient';

export const getFoldersApi = (token) => fetchApi(`${API_BASE}/folders`, { token });

export const createFolderApi = (name, token) => fetchApi(`${API_BASE}/folders`, { method: 'POST', body: { name }, token });

export const deleteFolderApi = (folderId, token) => fetchApi(`${API_BASE}/folders/${folderId}`, { method: 'DELETE', token });