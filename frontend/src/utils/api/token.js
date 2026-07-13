import { fetchApi } from '../apiClient';
import { AI_BASE } from './config';

export const fetchTokenStatsApi = (token) => fetchApi(`${AI_BASE}/token-stats`, { token });