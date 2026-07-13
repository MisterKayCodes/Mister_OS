import { saveNoteApi } from '../utils/api/notes';
import { enqueue } from '../utils/offlineQueue';
import { API_BASE } from '../utils/api/config';

export const saveNote = async (id, content, token, title, folderId = null) => {
  try {
    // (We try the raw API call first)
    await saveNoteApi(id, content, token, title, folderId);
  } catch (err) {
    // [Added so offline edits aren't lost — we catch the failure and queue it up]
    enqueue({ 
      type: 'save_note', 
      url: `${API_BASE}/${id}`, 
      method: 'PUT', 
      body: { content, title, folder_id: folderId } 
    });
  }
};
