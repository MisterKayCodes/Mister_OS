import { useState, useEffect, useCallback } from 'react';
import { fetchNotesApi, createNoteApi, saveNoteApi, deleteNotesApi, getFoldersApi, createFolderApi, deleteFolderApi, moveNotesBulkApi, fetchTokenStatsApi, cacheNotes, cacheFolders, getCachedNotes, getCachedFolders } from '../../utils/api';
import { flush, getPendingCount } from '../../utils/offlineQueue';
import { useToast } from '../../context/ToastContext';

export default function useHomeState() {
  const [token, setToken] = useState(localStorage.getItem("master_token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [viewMode, setViewMode] = useState('editor');
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [showSecurity, setShowSecurity] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [tokenStats, setTokenStats] = useState(null);
  const { showToast } = useToast();

  // --- Online/Offline Detection ---
  useEffect(() => {
    const goOnline = async () => {
      setIsOffline(false);
      showToast("Back online! Syncing...", "success");
      const synced = await flush(token);
      if (synced > 0) {
        showToast(`Synced ${synced} offline change(s)`, "success");
        fetchNotes();
      }
    };
    const goOffline = () => {
      setIsOffline(true);
      showToast("You're offline — viewing cached data", "info");
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [token]);

  useEffect(() => { 
    if (isAuthenticated) {
      fetchNotes(); 
      fetchTokenData();
      const interval = setInterval(fetchTokenData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchTokenData = async () => {
    try {
      const stats = await fetchTokenStatsApi(token);
      setTokenStats(stats);
    } catch (err) {
      console.warn("Could not fetch token stats", err);
    }
  };

  const fetchNotes = async () => {
    try {
      const [notesData, foldersData] = await Promise.all([
        fetchNotesApi(token),
        getFoldersApi(token)
      ]);
      setNotes(notesData);
      setFolders(foldersData);
      // Cache fresh data for offline use
      cacheNotes(notesData);
      cacheFolders(foldersData);
      if (notesData.length > 0 && !activeNote) selectNote(notesData[0]);
    } catch (err) {
      if (err.message === "Invalid Master Token") {
        setIsAuthenticated(false);
        localStorage.removeItem("master_token");
        return;
      }
      // Network error — fall back to cache
      const cachedNotesData = getCachedNotes();
      const cachedFoldersData = getCachedFolders();
      if (cachedNotesData) {
        setNotes(cachedNotesData);
        setFolders(cachedFoldersData || []);
        if (cachedNotesData.length > 0 && !activeNote) selectNote(cachedNotesData[0]);
        setIsOffline(true);
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleLogin = (newToken) => {
    localStorage.setItem("master_token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const createNote = async (folderId = null) => {
    try {
      const newNote = await createNoteApi(token, folderId);
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (err) {
      showToast("Failed to create note: " + err.message, "error");
    }
  };

  const handleCreateFolder = async (name) => {
    try {
      const newFolder = await createFolderApi(name, token);
      setFolders([...folders, newFolder]);
      showToast("Folder created", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await deleteFolderApi(id, token);
      setFolders(folders.filter(f => f.id !== id));
      fetchNotes();
      showToast("Folder deleted", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleMoveNotes = async (noteIds, folderId) => {
    try {
      await moveNotesBulkApi(noteIds, folderId, token);
      fetchNotes();
      showToast(`Moved ${noteIds.length} note(s)`, "success");
    } catch (err) {
      showToast("Move failed: " + err.message, "error");
    }
  };

  const selectNote = (note) => {
    setActiveNote(note);
    setContent(note.content);
    setTitle(note.title || "");
    setViewMode('editor');
  };

  useEffect(() => {
    if (!activeNote) return;
    const timer = setTimeout(() => {
      if (content !== activeNote.content || title !== activeNote.title) {
        saveNoteApi(activeNote.id, content, token, title, activeNote.folder_id).then(fetchNotes);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, title]);

  const viewFinance = () => {
    setViewMode('finance');
    setActiveNote(null);
  };

  const viewWarRoom = () => {
    setViewMode('warroom');
    setActiveNote(null);
  };

  const handleDeleteNotes = async (ids) => {
    try {
      await deleteNotesApi(ids, token);
      showToast(`${ids.length} note(s) deleted`, "success");
      if (activeNote && ids.includes(activeNote.id)) {
        setActiveNote(null);
        setContent("");
        setTitle("");
      }
      fetchNotes();
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  };

  const goBack = () => { setActiveNote(null); setViewMode('editor'); };

  return {
    token, isAuthenticated, notes, folders, activeNote, setActiveNote, viewMode, setViewMode,
    content, setContent, title, setTitle, showSecurity, setShowSecurity, isOffline, tokenStats,
    handleLogin, createNote, handleCreateFolder, handleDeleteFolder, handleMoveNotes,
    selectNote, viewFinance, viewWarRoom, handleDeleteNotes, goBack
  };
}
