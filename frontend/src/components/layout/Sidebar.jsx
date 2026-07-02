// Rule: Max 200 lines per file — split if exceeded
import React from 'react';
import { Edit2, DollarSign, Bot } from 'lucide-react';

export default function Sidebar({ notes, activeNoteId, onSelectNote, onCreateNote, onViewExpenses, onOpenOmniBrain }) {
  return (
    <div className="w-full bg-[#f3f3f3] md:border-r border-[#e0e0e0] flex flex-col h-full">
      <div className="p-4 flex justify-between items-center border-b border-[#e0e0e0]">
        <h1 className="font-semibold text-lg text-gray-700">Mister OS</h1>
        <div className="flex gap-2">
          <button onClick={onOpenOmniBrain} className="text-purple-600 hover:bg-purple-100 transition p-1 rounded" title="Omni-Brain">
            <Bot size={18} />
          </button>
          <button onClick={onViewExpenses} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="View Expenses">
            <DollarSign size={18} />
          </button>
          <button onClick={onCreateNote} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="New Note">
            <Edit2 size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notes.map(note => (
          <div 
            key={note.id} 
            onClick={() => onSelectNote(note)}
            className={`p-4 cursor-pointer border-b border-[#e0e0e0] transition ${activeNoteId === note.id ? 'bg-[#ffe0b2]' : 'hover:bg-[#e8e8e8]'}`}
          >
            <h3 className="font-medium text-sm truncate">{note.title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.updated_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
