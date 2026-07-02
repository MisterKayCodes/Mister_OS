// Rule: Max 200 lines per file — split if exceeded
const hostname = window.location.hostname || "localhost";
const API_BASE = `http://${hostname}:8011/api/finance`;
const AI_BASE = `http://${hostname}:8011/api/ai`;

export const getFinanceOverview = async (token) => {
  const res = await fetch(`${API_BASE}/overview`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch overview");
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

export const createWalletApi = async (wallet, token) => {
  const res = await fetch(`${API_BASE}/wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(wallet)
  });
  if (!res.ok) throw new Error("Failed to create wallet");
  return await res.json();
};

export const depositToWalletApi = async (walletId, amount, token) => {
  const res = await fetch(`${API_BASE}/wallets/${walletId}/deposit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ amount })
  });
  if (!res.ok) throw new Error("Failed to update balance");
  return await res.json();
};

export const deleteWalletApi = async (walletId, token) => {
  const res = await fetch(`${API_BASE}/wallets/${walletId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete wallet");
  return await res.json();
};

export const getGoals = async (token) => {
  const res = await fetch(`${API_BASE}/goals`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch goals");
  return await res.json();
};

export const createGoalApi = async (goal, token) => {
  const res = await fetch(`${API_BASE}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(goal)
  });
  if (!res.ok) throw new Error("Failed to create goal");
  return await res.json();
};

export const achieveGoalApi = async (goalId, token) => {
  const res = await fetch(`${API_BASE}/goals/${goalId}/achieve`, { method: "PUT", headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to achieve goal");
  return await res.json();
};

export const deleteGoalApi = async (goalId, token) => {
  const res = await fetch(`${API_BASE}/goals/${goalId}`, { method: "DELETE", headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to delete goal");
  return await res.json();
};

export const getDebts = async (token) => {
  const res = await fetch(`${API_BASE}/debts`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch debts");
  return await res.json();
};

export const createDebtApi = async (debt, token) => {
  const res = await fetch(`${API_BASE}/debts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(debt)
  });
  if (!res.ok) throw new Error("Failed to log debt");
  return await res.json();
};

export const settleDebtApi = async (debtId, token) => {
  const res = await fetch(`${API_BASE}/debts/${debtId}/settle`, { method: "PUT", headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to settle debt");
  return await res.json();
};

export const getFinanceInsightsApi = async (token) => {
  const res = await fetch(`${AI_BASE}/finance-insights`, { method: "POST", headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to get insights");
  return await res.json();
};

export const canIAffordApi = async (query, token) => {
  const res = await fetch(`${AI_BASE}/can-i-afford`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error("Failed to get affordability check");
  return await res.json();
};
