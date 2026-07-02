// Rule: Max 200 lines per file — split if exceeded
import React from 'react';
import { Edit2, DollarSign, Bot, CheckSquare, Trash2, Square, ChevronLeft } from 'lucide-react';

export default function Sidebar({ notes, activeNoteId, onSelectNote, onCreateNote, onViewExpenses, onOpenOmniBrain, onDeleteNotes, onBack, showBack }) {
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState([]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelected(notes.map(n => n.id));
  const clearSelect = () => { setSelected([]); setSelectMode(false); };

  const handleDelete = () => {
    if (selected.length === 0) return;
    onDeleteNotes(selected);
    clearSelect();
  };

  return (
    <div className="w-full bg-[#f3f3f3] md:border-r border-[#e0e0e0] flex flex-col h-full">
      <div className="p-4 flex justify-between items-center border-b border-[#e0e0e0]">
        {showBack ? (
          <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-black text-sm font-medium">
            <ChevronLeft size={18} /> Back
          </button>
        ) : (
          <h1 className="font-semibold text-lg text-gray-700">Mister OS</h1>
        )}
        <div className="flex gap-2">
          <button onClick={onOpenOmniBrain} className="text-purple-600 hover:bg-purple-100 transition p-1 rounded" title="Omni-Brain">
            <Bot size={18} />
          </button>
          <button onClick={onViewExpenses} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="View Expenses">
            <DollarSign size={18} />
          </button>
          <button onClick={() => { setSelectMode(s => !s); setSelected([]); }} className={`p-1 rounded transition ${selectMode ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-200'}`} title="Select Notes">
            <CheckSquare size={18} />
          </button>
          <button onClick={onCreateNote} className="text-gray-500 hover:text-black transition p-1 rounded hover:bg-gray-200" title="New Note">
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100">
          <button onClick={selectAll} className="text-xs text-red-600 font-medium hover:underline">Select All</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{selected.length} selected</span>
            <button onClick={handleDelete} disabled={selected.length === 0} className="flex items-center gap-1 text-xs font-medium bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 disabled:opacity-40 transition">
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={clearSelect} className="text-xs text-gray-500 hover:underline">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {notes.map(note => (
          <div
            key={note.id}
            onClick={() => selectMode ? toggleSelect(note.id) : onSelectNote(note)}
            className={`flex items-center gap-2 p-4 cursor-pointer border-b border-[#e0e0e0] transition ${activeNoteId === note.id && !selectMode ? 'bg-[#ffe0b2]' : 'hover:bg-[#e8e8e8]'} ${selected.includes(note.id) ? 'bg-red-50' : ''}`}
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
        ))}
      </div>
    </div>
  );
}
