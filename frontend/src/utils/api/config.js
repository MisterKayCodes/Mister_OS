import { enqueue } from '../offlineQueue';

const fallbackBase = `http://${window.location.hostname || "localhost"}:8011`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackBase;

export const API_BASE = `${BASE_URL}/api/notes`;
export const AI_BASE = `${BASE_URL}/api/ai`;
export const LEADS_BASE = `${BASE_URL}/api/leads`;
export const AUTH_BASE = `${BASE_URL}/api/auth`;

export const NOTES_CACHE_KEY = 'mister_notes_cache';
export const FOLDERS_CACHE_KEY = 'mister_folders_cache';

export const cacheNotes = (notes) => localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notes));
export const cacheFolders = (folders) => localStorage.setItem(FOLDERS_CACHE_KEY, JSON.stringify(folders));
export const getCachedNotes = () => { 
  try { return JSON.parse(localStorage.getItem(NOTES_CACHE_KEY) || 'null'); } 
  catch { return null; } 
};
export const getCachedFolders = () => { 
  try { return JSON.parse(localStorage.getItem(FOLDERS_CACHE_KEY) || 'null'); } 
  catch { return null; } 
};