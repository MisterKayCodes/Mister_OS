// Rule: Max 200 lines per file — split if exceeded
const hostname = window.location.hostname || "localhost";
const API_BASE = `http://${hostname}:8011/api/finance`;

export const getFinanceOverview = async (token) => {
  const res = await fetch(`${API_BASE}/overview`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch finance overview");
  return await res.json();
};

export const getTransactions = async (token) => {
  const res = await fetch(`${API_BASE}/transactions`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return await res.json();
};

export const getWallets = async (token) => {
  const res = await fetch(`${API_BASE}/wallets`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch wallets");
  return await res.json();
};

export const getGoals = async (token) => {
  const res = await fetch(`${API_BASE}/goals`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch goals");
  return await res.json();
};
