import { LEADS_BASE } from './config';
const getLeadsBase = () => LEADS_BASE;

export const fetchTranscriptsApi = async (token) => {
  const res = await fetch(`${getLeadsBase()}/transcripts`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch chat transcripts");
  return await res.json();
};

export const fetchAnalysisApi = async (token) => {
  const res = await fetch(`${getLeadsBase()}/analysis`, {
    headers: { "X-Master-Token": token }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch analysis");
  return await res.json();
};

export const runAnalysisApi = async (token) => {
  const res = await fetch(`${getLeadsBase()}/analyse`, {
    method: "POST",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to run analysis");
  }
  return await res.json();
};