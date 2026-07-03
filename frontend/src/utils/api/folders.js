import { API_BASE } from './config';

export const getFoldersApi = async (token) => {
  const res = await fetch(`${API_BASE}/folders`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch folders");
  return await res.json();
};

export const createFolderApi = async (name, token) => {
  const res = await fetch(`${API_BASE}/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error("Failed to create folder");
  return await res.json();
};

export const deleteFolderApi = async (folderId, token) => {
  const res = await fetch(`${API_BASE}/folders/${folderId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete folder");
  return await res.json();
};