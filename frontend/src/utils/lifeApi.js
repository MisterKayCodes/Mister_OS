import { fetchApi } from './apiClient';

const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;
const API_BASE = `${BASE_URL}/api`;

export const getLifeProgress = (token) => fetchApi(`${API_BASE}/life/progress`, { token });

export const getLifeTaskDefs = (token) => fetchApi(`${API_BASE}/life/tasks/defs`, { token });

export const createLifeTaskDef = (data, token) => fetchApi(`${API_BASE}/life/tasks/defs`, { method: 'POST', body: data, token });

export const updateLifeTaskDef = (id, data, token) => fetchApi(`${API_BASE}/life/tasks/defs/${id}`, { method: 'PUT', body: data, token });

export const deleteLifeTaskDef = (id, token) => fetchApi(`${API_BASE}/life/tasks/defs/${id}`, { method: 'DELETE', token });

export const logLifeTaskSession = (data, token) => fetchApi(`${API_BASE}/life/tasks/session`, { method: 'POST', body: data, token });

// REWARDS
export const getLifeRewards = (token) => fetchApi(`${API_BASE}/life/rewards`, { token });

export const createLifeReward = (rewardData, token) => fetchApi(`${API_BASE}/life/rewards`, { method: 'POST', body: rewardData, token });

export const deleteLifeReward = (rewardId, token) => fetchApi(`${API_BASE}/life/rewards/${rewardId}`, { method: 'DELETE', token });

export const unlockLifeReward = (data, token) => fetchApi(`${API_BASE}/life/rewards/unlock`, { method: 'POST', body: data, token });

// SESSIONS / HISTORY
export const getTaskSessions = (token) => fetchApi(`${API_BASE}/life/tasks/sessions`, { token });
