import { AUTH_BASE } from './config';
import { fetchApi } from '../apiClient';

export const loginApi = (password, deviceName) => fetchApi(`${AUTH_BASE}/login`, { method: 'POST', body: { password, device_name: deviceName } });

export const getSessionsApi = (token) => fetchApi(`${AUTH_BASE}/sessions`, { token });

export const deleteSessionApi = (sessionId, token) => fetchApi(`${AUTH_BASE}/sessions/${sessionId}`, { method: 'DELETE', token });