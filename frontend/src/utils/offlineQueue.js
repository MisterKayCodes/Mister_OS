/**
 * 🧬 Offline Sync Queue — The Nervous System for offline actions.
 * When a network request fails, actions are stored here and retried
 * automatically when the user comes back online.
 */

const QUEUE_KEY = 'mister_offline_queue';

export function enqueue(action) {
  const queue = getQueue();
  const item = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...action
  };
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  console.log('[OfflineQueue] Queued action:', item.type);
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.setItem(QUEUE_KEY, '[]');
}

export function getPendingCount() {
  return getQueue().length;
}

export async function flush(token) {
  const queue = getQueue();
  if (queue.length === 0) return;

  console.log(`[OfflineQueue] Flushing ${queue.length} pending actions...`);
  const failed = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method || 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Token': token
        },
        body: JSON.stringify(item.body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log(`[OfflineQueue] Synced: ${item.type}`);
    } catch (err) {
      console.warn(`[OfflineQueue] Failed to sync: ${item.type}`, err);
      failed.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  return queue.length - failed.length; // number successfully synced
}
