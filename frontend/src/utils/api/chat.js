import { AI_BASE } from './config';

export const sendOmniChatApi = async (message, sessionId, token) => {
  const res = await fetch(`${AI_BASE}/omni-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ message, session_id: sessionId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Omni-Chat request failed");
  }
  return await res.json();
};

export const getChatSessionsApi = async (token) => {
  const res = await fetch(`${AI_BASE}/chat-sessions`, { 
    headers: { "X-Master-Token": token } 
  });
  if (!res.ok) throw new Error("Failed to fetch chat sessions");
  return await res.json();
};

export const getChatMessagesApi = async (sessionId, token) => {
  const res = await fetch(`${AI_BASE}/chat-sessions/${sessionId}`, { 
    headers: { "X-Master-Token": token } 
  });
  if (!res.ok) throw new Error("Failed to fetch chat messages");
  return await res.json();
};

export const generateTitleApi = async (content, token) => {
  const res = await fetch(`${AI_BASE}/generate-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error("Title generation failed");
  const data = await res.json();
  return data.title;
};