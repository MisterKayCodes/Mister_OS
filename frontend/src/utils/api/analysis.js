import { fetchApi } from '../apiClient';
import { LEADS_BASE } from './config';

export const fetchTranscriptsApi = (token) => fetchApi(`${LEADS_BASE}/transcripts`, { token });

export const fetchAnalysisApi = async (token) => {
  try {
    return await fetchApi(`${LEADS_BASE}/analysis`, { token });
  } catch (err) {
    if (err.message.includes('404') || err.message.toLowerCase().includes('not found')) return null;
    throw err;
  }
};

export const runAnalysisApi = (token) => fetchApi(`${LEADS_BASE}/analyse`, { method: 'POST', token });