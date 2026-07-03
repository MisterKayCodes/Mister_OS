import { LEADS_BASE } from './config';
const getLeadsBase = () => LEADS_BASE;

export const fetchLeadsApi = async (token) => {
  const res = await fetch(`${getLeadsBase()}/`, { 
    headers: { "X-Master-Token": token } 
  });
  if (!res.ok) throw new Error("Failed to fetch leads");
  return await res.json();
};

export const createLeadApi = async (username, token) => {
  const res = await fetch(`${getLeadsBase()}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ username, status: 'Pitching' })
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return await res.json();
};

export const updateLeadApi = async (id, data, token) => {
  const res = await fetch(`${getLeadsBase()}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return await res.json();
};