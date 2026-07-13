import { fetchApi } from './apiClient';
// Rule: Max 200 lines per file — split if exceeded
const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;
const API_BASE = `${BASE_URL}/api/finance`;
const AI_BASE = `${BASE_URL}/api/ai`;

export const getFinanceOverview = (token) => fetchApi(`${API_BASE}/overview`, { token });

export const getTransactions = (token) => fetchApi(`${API_BASE}/transactions`, { token });

export const createTransactionApi = (data, token) => fetchApi(`${API_BASE}/transactions`, { method: 'POST', body: data, token });

export const updateTransactionApi = (id, data, token) => fetchApi(`${API_BASE}/transactions/${id}`, { method: 'PUT', body: data, token });

export const getTransactionTemplates = (token) => fetchApi(`${API_BASE}/transactions/templates`, { token });

export const createTransactionTemplateApi = (data, token) => fetchApi(`${API_BASE}/transactions/templates`, { method: 'POST', body: data, token });

export const deleteTransactionTemplateApi = (id, token) => fetchApi(`${API_BASE}/transactions/templates/${id}`, { method: 'DELETE', token });

export const deleteTransactionApi = (txId, token) => fetchApi(`${API_BASE}/transactions/${txId}`, { method: 'DELETE', token });

export const getWallets = (token) => fetchApi(`${API_BASE}/wallets`, { token });

export const createWalletApi = (wallet, token) => fetchApi(`${API_BASE}/wallets`, { method: 'POST', body: wallet, token });

export const depositToWalletApi = (walletId, amount, token) => fetchApi(`${API_BASE}/wallets/${walletId}/deposit`, { method: 'PUT', body: { amount }, token });

export const transferWalletApi = (fromWalletId, toWalletId, amount, token) => fetchApi(`${API_BASE}/wallets/transfer`, { method: 'POST', body: { from_wallet_id: fromWalletId, to_wallet_id: toWalletId, amount }, token });

export const updateWalletApi = (walletId, data, token) => fetchApi(`${API_BASE}/wallets/${walletId}`, { method: 'PUT', body: data, token });

export const deleteWalletApi = (walletId, token) => fetchApi(`${API_BASE}/wallets/${walletId}`, { method: 'DELETE', token });

export const getFinanceSettingsApi = (token) => fetchApi(`${API_BASE}/settings`, { token });

export const setDefaultWalletApi = (walletId, token) => fetchApi(`${API_BASE}/settings/default-wallet`, { method: 'PUT', body: { wallet_id: walletId }, token });

export const getGoals = (token) => fetchApi(`${API_BASE}/goals`, { token });

export const createGoalApi = (goal, token) => fetchApi(`${API_BASE}/goals`, { method: 'POST', body: goal, token });

export const achieveGoalApi = (goalId, token) => fetchApi(`${API_BASE}/goals/${goalId}/achieve`, { method: 'PUT', token });

export const deleteGoalApi = (goalId, token) => fetchApi(`${API_BASE}/goals/${goalId}`, { method: 'DELETE', token });

export const getDebts = (token) => fetchApi(`${API_BASE}/debts`, { token });

export const createDebtApi = (debt, token) => fetchApi(`${API_BASE}/debts`, { method: 'POST', body: debt, token });

export const settleDebtApi = (debtId, token) => fetchApi(`${API_BASE}/debts/${debtId}/settle`, { method: 'PUT', token });

export const getFinanceInsightsApi = (token) => fetchApi(`${AI_BASE}/finance-insights`, { method: 'POST', token });

export const canIAffordApi = (query, token) => fetchApi(`${AI_BASE}/can-i-afford`, { method: 'POST', body: { query }, token });

export const getPriceDbApi = (token) => fetchApi(`${API_BASE}/price-db`, { token });

export const createVendorApi = (vendor, token) => fetchApi(`${API_BASE}/vendors`, { method: 'POST', body: vendor, token });

export const createProductApi = (product, token) => fetchApi(`${API_BASE}/products`, { method: 'POST', body: product, token });

export const createPriceLogApi = (priceLog, token) => fetchApi(`${API_BASE}/price-logs`, { method: 'POST', body: priceLog, token });

export const getSubscriptionsApi = (token) => fetchApi(`${API_BASE}/subscriptions`, { token });

export const createSubscriptionApi = (data, token) => fetchApi(`${API_BASE}/subscriptions`, { method: 'POST', body: data, token });

export const deleteSubscriptionApi = (id, token) => fetchApi(`${API_BASE}/subscriptions/${id}`, { method: 'DELETE', token });

export const paySubscriptionApi = (id, token) => fetchApi(`${API_BASE}/subscriptions/${id}/pay`, { method: 'POST', token });

// --- Loans ---

export const getLoansApi = (token) => fetchApi(`${API_BASE}/loans`, { token });

export const createLoanApi = (data, token) => fetchApi(`${API_BASE}/loans`, { method: 'POST', body: data, token });

export const payLoanApi = (id, installmentId = null, token) => {
  const url = installmentId
    ? `${API_BASE}/loans/${id}/pay?installment_id=${installmentId}`
    : `${API_BASE}/loans/${id}/pay`;
  return fetchApi(url, { method: 'PUT', token });
};

export const updateLoanApi = (id, data, token) => fetchApi(`${API_BASE}/loans/${id}`, { method: 'PUT', body: data, token });

export const deleteLoanApi = (id, token) => fetchApi(`${API_BASE}/loans/${id}`, { method: 'DELETE', token });
