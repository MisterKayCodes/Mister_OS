import React from 'react';
import { Edit2, ChevronLeft, Shield, FolderPlus, CheckSquare, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export default function SidebarHeader({
  onBack,
  onOpenSecurity,
  setShowFolderModal,
  onCreateNote,
  selectMode,
  setSelectMode,
  setSelected,
}) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm font-medium mr-1" title="Back to Dashboard">
            <LayoutDashboard size={16} /> Dashboard
          </button>
        )}
        {!onBack && <span className="font-bold text-gray-800 dark:text-white tracking-tight">Notes</span>}
      </div>
      <div className="flex gap-1">
        <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Toggle theme">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={onOpenSecurity} className="text-gray-500 dark:text-gray-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Security & Devices">
          <Shield size={18} />
        </button>
        <button 
          onClick={() => { setSelectMode(s => !s); setSelected([]); }} 
          className={`p-1 rounded transition ${selectMode ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`} 
          title="Select Notes"
        >
          <CheckSquare size={18} />
        </button>
        <button onClick={() => setShowFolderModal(true)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="New Folder">
          <FolderPlus size={18} />
        </button>
        <button onClick={() => onCreateNote(null)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="New Note">
          <Edit2 size={18} />
        </button>
      </div>
    </div>
  );
}