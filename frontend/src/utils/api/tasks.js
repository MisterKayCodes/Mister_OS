import { BASE_URL } from './config';

// ✅ CHANGED: 'Authorization': `Bearer ${token}` → 'X-Master-Token': token
export const getTasksApi = async (token) => {
  const res = await fetch(`${BASE_URL}/api/tasks/`, {
    headers: { 'X-Master-Token': token }
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

// ✅ CHANGED: 'Authorization': `Bearer ${token}` → 'X-Master-Token': token
export const createTaskApi = async (title, token) => {
  const res = await fetch(`${BASE_URL}/api/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Master-Token': token },
    body: JSON.stringify({ title, description: "" })
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
};

// ✅ CHANGED: 'Authorization': `Bearer ${token}` → 'X-Master-Token': token
export const updateTaskApi = async (id, data, token) => {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Token': token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
};

// ✅ CHANGED: 'Authorization': `Bearer ${token}` → 'X-Master-Token': token
export const deleteTaskApi = async (id, token) => {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
    method: 'DELETE',
    headers: { 'X-Master-Token': token }
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
};