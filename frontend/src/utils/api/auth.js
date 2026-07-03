import { AUTH_BASE } from './config';

export const loginApi = async (password, deviceName) => {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, device_name: deviceName })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  return await res.json();
};

export const getSessionsApi = async (token) => {
  const res = await fetch(`${AUTH_BASE}/sessions`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return await res.json();
};

export const deleteSessionApi = async (sessionId, token) => {
  const res = await fetch(`${AUTH_BASE}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return await res.json();
};