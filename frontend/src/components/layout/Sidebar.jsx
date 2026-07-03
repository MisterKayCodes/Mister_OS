import React, { useState } from 'react';
import { Edit2, DollarSign, Bot, CheckSquare, Trash2, Square, ChevronLeft, Shield, FolderPlus, Folder, ChevronDown, ChevronRight, Target } from 'lucide-react';

export default function Sidebar({ notes, folders = [], activeNoteId, onSelectNote, onCreateNote, onViewExpenses, onOpenOmniBrain, onOpenWarRoom, onOpenSecurity, onDeleteNotes, onBack, showBack, onCreateFolder, onDeleteFolder, onMoveNotes }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragHoverId, setDragHoverId] = useState(null);

  const handleCreateFolderSubmit = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setShowFolderModal(false);
      setNewFolderName("");
    }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(notes.map(n => n.id));
  const clearSelect = () => { setSelected([]); setSelectMode(false); };

  const handleDelete = () => {
    if (selected.length === 0) return;
    onDeleteNotes(selected);
    clearSelect();
  };

  const handleMoveBulk = (e) => {
    const val = e.target.value;
    if (!val || selected.length === 0) return;
    const targetFolderId = val === "root" ? null : parseInt(val);
    onMoveNotes(selected, targetFolderId);
    clearSelect();
    e.target.value = ""; // reset select
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleDragStart = (e, noteId) => {
    e.dataTransfer.setData("noteId", noteId);
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    setDragHoverId(null);
    const noteId = e.dataTransfer.getData("noteId");
    if (noteId) {
      onMoveNotes([parseInt(noteId)], folderId);
    }
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragHoverId(id);
  };
  
  const handleDragLeave = (e) => {
    setDragHoverId(null);
  };

  const rootNotes = notes.filter(n => !n.folder_id);

  const NoteItem = ({ note }) => (
    <div
      key={note.id}
      draggable
      onDragStart={(e) => handleDragStart(e, note.id)}
      onClick={() => selectMode ? toggleSelect(note.id) : onSelectNote(note)}
      className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-b border-[#e0e0e0] transition ${activeNoteId === note.id && !selectMode ? 'bg-[#ffe0b2]' : 'hover:bg-[#e8e8e8]'} ${selected.includes(note.id) ? 'bg-red-50' : ''}`}
    >
      {selectMode && (
        <div className="text-red-500 shrink-0">
          {selected.includes(note.id) ? <CheckSquare size={16} /> : <Square size={16} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{note.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{new Date(note.updated_at).toLocaleDateString()}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#f3f3f3] md:border-r border-[#e0e0e0] flex flex-col h-full relative">
      <div className="p-4 flex justify-between items-center border-b border-[#e0e0e0]">
        {showBack ? (
          <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-black text-sm font-medium">
            <ChevronLeft size={18} /> Back
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Logo removed to save space */}
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
          <button onClick={() => { setSelectMode(s => !s); setSelected([]); }} className={`p-1 rounded transition ${selectMode ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-200'}`} title="Select Notes">
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

      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100 flex-wrap gap-2">
          <button onClick={selectAll} className="text-xs text-red-600 font-medium hover:underline">Select All</button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">{selected.length} selected</span>
            
            <select 
              onChange={handleMoveBulk}
              disabled={selected.length === 0}
              className="text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none disabled:opacity-40 max-w-[100px]"
            >
              <option value="">Move to...</option>
              <option value="root">Root</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <button onClick={handleDelete} disabled={selected.length === 0} className="flex items-center gap-1 text-xs font-medium bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-40 transition">
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={clearSelect} className="text-xs text-gray-500 hover:underline">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        <div 
          onDrop={(e) => handleDrop(e, null)}
          onDragOver={(e) => handleDragOver(e, 'root')}
          onDragLeave={handleDragLeave}
          className={`${dragHoverId === 'root' ? 'bg-blue-50' : ''} transition-colors min-h-[50px]`}
        >
          {rootNotes.map(note => <NoteItem key={note.id} note={note} />)}
          {rootNotes.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 italic">No notes in root</div>
          )}
        </div>
        
        {folders.map(folder => {
          const folderNotes = notes.filter(n => n.folder_id === folder.id);
          const isExpanded = expandedFolders[folder.id];
          const isHovered = dragHoverId === folder.id;
          return (
            <div key={folder.id} className={`border-b border-[#e0e0e0] ${isHovered ? 'bg-blue-50' : ''}`}
                 onDrop={(e) => handleDrop(e, folder.id)}
                 onDragOver={(e) => handleDragOver(e, folder.id)}
                 onDragLeave={handleDragLeave}>
              <div 
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center justify-between p-3 bg-gray-100 cursor-pointer hover:bg-gray-200 transition"
              >
                <div className="flex items-center gap-2 text-gray-700 font-medium text-sm pointer-events-none">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Folder size={16} className="text-blue-500" />
                  {folder.name} <span className="text-xs text-gray-400 font-normal">({folderNotes.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCreateNote(folder.id); }} 
                    className="p-1 text-gray-400 hover:text-black rounded" title="New Note in Folder">
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm("Delete folder and move its notes to root?")) onDeleteFolder(folder.id); }} 
                    className="p-1 text-gray-400 hover:text-red-500 rounded" title="Delete Folder">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="pl-4 bg-[#f9f9f9] min-h-[40px]">
                  {folderNotes.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400">Empty Folder</div>
                  ) : (
                    folderNotes.map(note => <NoteItem key={note.id} note={note} />)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showFolderModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] md:max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Create New Folder</h3>
            </div>
            <form onSubmit={handleCreateFolderSubmit} className="p-4 flex flex-col gap-4">
              <input
                autoFocus
                type="text"
                placeholder="Folder Name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowFolderModal(false); setNewFolderName(""); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
