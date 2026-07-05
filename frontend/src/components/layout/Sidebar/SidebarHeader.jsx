import React from 'react';
import { Edit2, DollarSign, Bot, CheckSquare, ChevronLeft, Shield, FolderPlus, Target, BookOpen } from 'lucide-react';

export default function SidebarHeader({
  showBack,
  onBack,
  onOpenSecurity,
  onOpenOmniBrain,
  onViewExpenses,
  onOpenWarRoom,
  setShowFolderModal,
  onCreateNote,
  selectMode,
  setSelectMode,
  setSelected,
  onOpenKnowledge
}) {
  return (
    <div className="p-4 flex justify-between items-center border-b border-[#e0e0e0]">
      {showBack ? (
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-black text-sm font-medium">
          <ChevronLeft size={18} /> Back
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 tracking-tight">Mister OS</span>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onOpenSecurity} className="text-gray-500 hover:text-red-600 transition p-1 rounded hover:bg-red-50" title="Security & Devices">
          <Shield size={18} />
        </button>
        <button onClick={onOpenOmniBrain} className="text-purple-600 hover:bg-purple-100 transition p-1 rounded" title="Omni-Brain">
          <Bot size={18} />
        </button>
        <button onClick={onViewExpenses} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="View Expenses">
          <DollarSign size={18} />
        </button>
        <button onClick={onOpenWarRoom} className="text-red-500 hover:bg-red-50 transition p-1 rounded" title="War Room">
          <Target size={18} />
        </button>
        <button onClick={onOpenKnowledge} className="text-blue-500 hover:bg-blue-50 transition p-1 rounded" title="Knowledge Base">
          <BookOpen size={18} />
        </button>
        <button 
          onClick={() => { setSelectMode(s => !s); setSelected([]); }} 
          className={`p-1 rounded transition ${selectMode ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-200'}`} 
          title="Select Notes"
        >
          <CheckSquare size={18} />
        </button>
        <button onClick={() => setShowFolderModal(true)} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="New Folder">
          <FolderPlus size={18} />
        </button>
        <button onClick={() => onCreateNote(null)} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="New Note">
          <Edit2 size={18} />
        </button>
      </div>
    </div>
  );
}