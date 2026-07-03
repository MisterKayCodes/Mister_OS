import { LEADS_BASE } from './config';
const getLeadsBase = () => LEADS_BASE;

export const fetchPendingDraftsApi = async (token) => {
  const res = await fetch(`${getLeadsBase()}/drafts/pending`, { 
    headers: { "X-Master-Token": token } 
  });
  if (!res.ok) throw new Error("Failed to fetch drafts");
  return await res.json();
};

export const approveDraftApi = async (id, token) => {
  const res = await fetch(`${getLeadsBase()}/drafts/${id}/approve`, {
    method: "POST",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to approve draft");
  return await res.json();
};

export const updateDraftApi = async (id, content, token) => {
  const res = await fetch(`${getLeadsBase()}/drafts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content, role: "assistant", lead_id: 0 })
  });
  if (!res.ok) throw new Error("Failed to update draft");
  return await res.json();
};

export const deleteDraftApi = async (id, token) => {
  const res = await fetch(`${getLeadsBase()}/drafts/${id}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete draft");
  return await res.json();
};