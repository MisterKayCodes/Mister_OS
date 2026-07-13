import { fetchApi } from '../apiClient';
import { AI_BASE } from './config';

export const sendOmniChatApi = (message, sessionId, token) => fetchApi(`${AI_BASE}/omni-chat`, { method: 'POST', body: { message, session_id: sessionId }, token });

export const getChatSessionsApi = (token) => fetchApi(`${AI_BASE}/chat-sessions`, { token });

export const getChatMessagesApi = (sessionId, token) => fetchApi(`${AI_BASE}/chat-sessions/${sessionId}`, { token });

export const generateTitleApi = async (content, token) => {
  const data = await fetchApi(`${AI_BASE}/generate-title`, { method: 'POST', body: { content }, token });
  return data.title;
};