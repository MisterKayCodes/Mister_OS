import { AI_BASE } from './config';

export const fetchTokenStatsApi = async (token) => {
  const res = await fetch(`${AI_BASE}/token-stats`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch token stats");
  return await res.json();
};