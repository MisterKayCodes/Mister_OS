const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;
const API_BASE = `${BASE_URL}/api`;

export const getLifeProgress = async (token) => {
  const res = await fetch(`${API_BASE}/life/progress`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch life progress");
  return await res.json();
};

export const getLifeTaskDefs = async (token) => {
  const res = await fetch(`${API_BASE}/life/tasks/defs`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch task defs");
  return await res.json();
};

export const createLifeTaskDef = async (data, token) => {
  const res = await fetch(`${API_BASE}/life/tasks/defs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create task def");
  return await res.json();
};

export const updateLifeTaskDef = async (id, data, token) => {
  const res = await fetch(`${API_BASE}/life/tasks/defs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update task def");
  return await res.json();
};

export const deleteLifeTaskDef = async (id, token) => {
  const res = await fetch(`${API_BASE}/life/tasks/defs/${id}`, {
    method: "DELETE",
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete task def");
  return await res.json();
};

export const logLifeTaskSession = async (data, token) => {
  const res = await fetch(`${API_BASE}/life/tasks/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to log session");
  return await res.json();
};

// REWARDS
export const getLifeRewards = async (token) => {
  const res = await fetch(`${API_BASE}/life/rewards`, { headers: { "X-Master-Token": token } });
  if (!res.ok) throw new Error("Failed to fetch life rewards");
  return await res.json();
};

export const createLifeReward = async (rewardData, token) => {
  const res = await fetch(`${API_BASE}/life/rewards`, {
    method: 'POST',
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(rewardData)
  });
  if (!res.ok) throw new Error("Failed to create reward");
  return await res.json();
};

export const deleteLifeReward = async (rewardId, token) => {
  const res = await fetch(`${API_BASE}/life/rewards/${rewardId}`, {
    method: 'DELETE',
    headers: { "X-Master-Token": token }
  });
  if (!res.ok) throw new Error("Failed to delete reward");
  return await res.json();
};

export const unlockLifeReward = async (data, token) => {
  const res = await fetch(`${API_BASE}/life/rewards/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Master-Token": token },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to unlock reward");
  }
  return await res.json();
};
