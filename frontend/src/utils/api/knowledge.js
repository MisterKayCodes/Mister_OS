import { fetchApi } from '../apiClient';
import { BASE_URL } from './config';

const KNOWLEDGE_BASE = `${BASE_URL}/api/knowledge`;

export const ingestYouTubeApi = (url, token) => fetchApi(`${KNOWLEDGE_BASE}/youtube`, { method: 'POST', body: { url }, token });

export const getTranscriptsApi = (token) => fetchApi(`${KNOWLEDGE_BASE}/transcripts`, { token });
