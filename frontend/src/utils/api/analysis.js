import { fetchApi } from '../apiClient';
import { LEADS_BASE } from './config';
const getLeadsBase = () => LEADS_BASE;

export const fetchTranscriptsApi = (token) => fetchApi(`${getLeadsBase()}/transcripts`, { token });

export const fetchAnalysisApi = async (token) => {
  try {
    return await fetchApi(`${getLeadsBase()}/analysis`, { token });
  } catch (err) {
    if (err.message.includes('404') || err.message.toLowerCase().includes('not found')) return null;
    throw err;
  }
};

export const runAnalysisApi = (token) => fetchApi(`${getLeadsBase()}/analyse`, { method: 'POST', token });