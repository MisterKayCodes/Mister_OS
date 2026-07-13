import { fetchApi } from '../apiClient';
import { KNOWLEDGE_BASE } from './config';

export const ingestYouTubeApi = (url, token) => fetchApi(`${KNOWLEDGE_BASE}/youtube`, { method: 'POST', body: { url }, token });

export const getTranscriptsApi = (token) => fetchApi(`${KNOWLEDGE_BASE}/transcripts`, { token });
