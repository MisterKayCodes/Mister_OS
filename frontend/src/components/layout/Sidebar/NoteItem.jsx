import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

export default function NoteItem({ 
  note, 
  activeNoteId, 
  selectMode, 
  selected, 
  onSelectNote, 
  toggleSelect, 
  onDragStart 
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, note.id)}
      onClick={() => selectMode ? toggleSelect(note.id) : onSelectNote(note)}
      className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-b border-[#e0e0e0] transition ${
        activeNoteId === note.id && !selectMode ? 'bg-[#ffe0b2]' : 'hover:bg-[#e8e8e8]'
      } ${selected.includes(note.id) ? 'bg-red-50' : ''}`}
    >
      {selectMode && (
        <div className="text-red-500 shrink-0">
          {selected.includes(note.id) ? <CheckSquare size={16} /> : <Square size={16} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{note.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(note.updated_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}