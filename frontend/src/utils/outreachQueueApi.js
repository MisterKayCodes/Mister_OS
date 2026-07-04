const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;
const OUTREACH_BASE = `${BASE_URL}/api/outreach`;

export const fetchBrainApi = async (token) => {
  const res = await fetch(`${OUTREACH_BASE}/brain`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch brain");
  return await res.json();
};

export const updateBrainApi = async (data, token) => {
  const res = await fetch(`${OUTREACH_BASE}/brain`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update brain");
  return await res.json();
};

export const logCorrectionApi = async (data, token) => {
  const res = await fetch(`${OUTREACH_BASE}/brain/log-correction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to log correction");
  return await res.json();
};

export const fetchQueueApi = async (status = "pending", token) => {
  const res = await fetch(`${OUTREACH_BASE}/queue?status=${status}`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch queue");
  return await res.json();
};

export const fillQueueApi = async (count = 10, token) => {
  const res = await fetch(`${OUTREACH_BASE}/queue/fill`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify({ count })
  });
  if (!res.ok) throw new Error("Failed to fill queue");
  return await res.json();
};

export const updateQueueItemApi = async (id, data, token) => {
  const res = await fetch(`${OUTREACH_BASE}/queue/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update queue item");
  return await res.json();
};

export const approveAllQueueApi = async (token) => {
  const res = await fetch(`${OUTREACH_BASE}/queue/approve-all`, {
    method: "POST",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to approve all in queue");
  return await res.json();
};

export const fetchSentHistoryApi = async (token) => {
  const res = await fetch(`${OUTREACH_BASE}/queue/sent`, {
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch sent history");
  return await res.json();
};
