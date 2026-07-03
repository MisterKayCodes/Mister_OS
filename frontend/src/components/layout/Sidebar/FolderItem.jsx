import React from 'react';
import { Folder, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import NoteItem from './NoteItem';

export default function FolderItem({
  folder,
  notes,
  expandedFolders,
  toggleFolder,
  activeNoteId,
  selectMode,
  selected,
  onSelectNote,
  toggleSelect,
  onCreateNote,
  onDeleteFolder,
  onDragStart,
  dragHoverId,
  handleDrop,
  handleDragOver,
  handleDragLeave
}) {
  const folderNotes = notes.filter(n => n.folder_id === folder.id);
  const isExpanded = expandedFolders[folder.id];
  const isHovered = dragHoverId === folder.id;

  return (
    <div
      key={folder.id}
      className={`border-b border-[#e0e0e0] ${isHovered ? 'bg-blue-50' : ''}`}
      onDrop={(e) => handleDrop(e, folder.id)}
      onDragOver={(e) => handleDragOver(e, folder.id)}
      onDragLeave={handleDragLeave}
    >
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
            className="p-1 text-gray-400 hover:text-black rounded"
            title="New Note in Folder"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete folder and move its notes to root?")) {
                onDeleteFolder(folder.id);
              }
            }}
            className="p-1 text-gray-400 hover:text-red-500 rounded"
            title="Delete Folder"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="pl-4 bg-[#f9f9f9] min-h-[40px]">
          {folderNotes.length === 0 ? (
            <div className="p-4 text-xs text-gray-400">Empty Folder</div>
          ) : (
            folderNotes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                activeNoteId={activeNoteId}
                selectMode={selectMode}
                selected={selected}
                onSelectNote={onSelectNote}
                toggleSelect={toggleSelect}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}