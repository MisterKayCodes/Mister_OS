import { BASE_URL } from './config';

const KNOWLEDGE_BASE = `${BASE_URL}/api/knowledge`;

export const ingestYouTubeApi = async (url, token) => {
  const res = await fetch(`${KNOWLEDGE_BASE}/youtube`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Token": token
    },
    body: JSON.stringify({ url })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to ingest YouTube video");
  }
  return await res.json();
};

export const getTranscriptsApi = async (token) => {
  const res = await fetch(`${KNOWLEDGE_BASE}/transcripts`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch transcripts");
  return await res.json();
};
