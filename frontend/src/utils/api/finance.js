import { API_BASE } from './config';

export const fetchExpensesApi = async (token) => {
  const res = await fetch(`${API_BASE}/expenses/all`, { 
    headers: { "X-Master-Token": token } 
  });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return await res.json();
};