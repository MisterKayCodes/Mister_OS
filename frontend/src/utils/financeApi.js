// Rule: Max 200 lines per file — split if exceeded
const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;
const API_BASE = `${BASE_URL}/api/finance`;
const AI_BASE = `${BASE_URL}/api/ai`;

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

export const deleteTransactionApi = async (txId, token) => {
  const res = await fetch(`${API_BASE}/transactions/${txId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
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

export const transferWalletApi = async (fromWalletId, toWalletId, amount, token) => {
  const res = await fetch(`${API_BASE}/wallets/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ from_wallet_id: fromWalletId, to_wallet_id: toWalletId, amount })
  });
  if (!res.ok) throw new Error("Failed to transfer funds");
  return await res.json();
};

export const updateWalletApi = async (walletId, data, token) => {
  const res = await fetch(`${API_BASE}/wallets/${walletId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update wallet");
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

export const getFinanceSettingsApi = async (token) => {
  const res = await fetch(`${API_BASE}/settings`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return await res.json();
};

export const setDefaultWalletApi = async (walletId, token) => {
  const res = await fetch(`${API_BASE}/settings/default-wallet`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ wallet_id: walletId })
  });
  if (!res.ok) throw new Error("Failed to update default wallet");
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

export const getPriceDbApi = async (token) => {
  const res = await fetch(`${API_BASE}/price-db`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch price DB");
  return await res.json();
};

export const createVendorApi = async (vendor, token) => {
  const res = await fetch(`${API_BASE}/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(vendor)
  });
  if (!res.ok) throw new Error("Failed to create vendor");
  return await res.json();
};

export const createProductApi = async (product, token) => {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error("Failed to create product");
  return await res.json();
};

export const createPriceLogApi = async (priceLog, token) => {
  const res = await fetch(`${API_BASE}/price-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(priceLog)
  });
  if (!res.ok) throw new Error("Failed to log price");
  return await res.json();
};

export const getSubscriptionsApi = async (token) => {
  const res = await fetch(`${API_BASE}/subscriptions`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch subscriptions");
  return await res.json();
};

export const createSubscriptionApi = async (data, token) => {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create subscription");
  return await res.json();
};

export const deleteSubscriptionApi = async (id, token) => {
  const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete subscription");
  return await res.json();
};

export const paySubscriptionApi = async (id, token) => {
  const res = await fetch(`${API_BASE}/subscriptions/${id}/pay`, {
    method: "POST",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to mark subscription as paid");
  return await res.json();
};
