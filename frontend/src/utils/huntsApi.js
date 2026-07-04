// Hunts & Outreach API utilities
const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;
const HUNTS_BASE = `${BASE_URL}/api/hunts`;

export const fetchHuntsApi = async (token) => {
  const [channelsRes, adminsRes] = await Promise.all([
    fetch(`${HUNTS_BASE}/channels`, { headers: { "X-Master-Token": token } }),
    fetch(`${HUNTS_BASE}/admins`, { headers: { "X-Master-Token": token } }),
  ]);
  const channels = channelsRes.ok ? await channelsRes.json() : [];
  const admins = adminsRes.ok ? await adminsRes.json() : [];
  return { channels, admins };
};

export const fetchOutreachStatsApi = async (token) => {
  const res = await fetch(`${HUNTS_BASE}/outreach/stats`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch outreach stats");
  return await res.json();
};

export const fetchCrmSettingsApi = async (token) => {
  const res = await fetch(`${HUNTS_BASE}/settings`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch CRM settings");
  return await res.json();
};

export const updateCrmSettingsApi = async (data, token) => {
  const res = await fetch(`${HUNTS_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update CRM settings");
  return await res.json();
};

export const updateAdminLeadApi = async (id, data, token) => {
  const res = await fetch(`${HUNTS_BASE}/admins/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update admin lead");
  return await res.json();
};

export const createAdminLeadApi = async (username, token) => {
  const res = await fetch(`${HUNTS_BASE}/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ username, source: "manual" }),
  });
  if (!res.ok) throw new Error("Failed to create admin lead");
  return await res.json();
};

// --- Templates ---
export const fetchTemplatesApi = async (token) => {
  const res = await fetch(`${HUNTS_BASE}/templates`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch templates");
  return await res.json();
};

export const createTemplateApi = async (content, token) => {
  const res = await fetch(`${HUNTS_BASE}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to create template");
  return await res.json();
};

export const deleteTemplateApi = async (id, token) => {
  const res = await fetch(`${HUNTS_BASE}/templates/${id}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete template");
  return await res.json();
};

export const generateTemplatesApi = async (transcript, token) => {
  const res = await fetch(`${HUNTS_BASE}/templates/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ chat_transcript: transcript }),
  });
  if (!res.ok) throw new Error("Failed to generate templates");
  return await res.json();
};

// --- Outreach Worker Control (Hits Microservice Port 8001) ---
const fallbackMicroservice = `http://${window.location.hostname || "localhost"}:8001`;
const MICROSERVICE_BASE = `${import.meta.env.VITE_MICROSERVICE_BASE_URL || fallbackMicroservice}/api/outreach`;

export const startOutreachApi = async () => {
  const res = await fetch(`${MICROSERVICE_BASE}/start`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start outreach");
  return await res.json();
};

export const stopOutreachApi = async () => {
  const res = await fetch(`${MICROSERVICE_BASE}/stop`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to stop outreach");
  return await res.json();
};

export const runHuntWorkerApi = async (seed, limit, token) => {
  const res = await fetch(`${HUNTS_BASE}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ seed, limit }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to start hunt worker");
  }
  return await res.json();
};

export const fetchHuntLogsApi = async (token) => {
  const res = await fetch(`${HUNTS_BASE}/run/logs`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch logs");
  return await res.json();
};
