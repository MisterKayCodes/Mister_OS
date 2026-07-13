import { fetchApi } from '../apiClient';
import { API_BASE } from './config';

export const fetchExpensesApi = (token) => fetchApi(`${API_BASE}/expenses/all`, { token });