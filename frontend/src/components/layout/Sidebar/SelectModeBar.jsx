import React from 'react';
import { Trash2 } from 'lucide-react';

export default function SelectModeBar({
  selected,
  onSelectAll,
  onClear,
  onDelete,
  onMove,
  folders
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100 flex-wrap gap-2">
      <button onClick={onSelectAll} className="text-xs text-red-600 font-medium hover:underline">
        Select All
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">{selected.length} selected</span>
        
        <select
          onChange={onMove}
          disabled={selected.length === 0}
          className="text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none disabled:opacity-40 max-w-[100px]"
        >
          <option value="">Move to...</option>
          <option value="root">Root</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <button
          onClick={onDelete}
          disabled={selected.length === 0}
          className="flex items-center gap-1 text-xs font-medium bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-40 transition"
        >
          <Trash2 size={12} /> Delete
        </button>
        <button onClick={onClear} className="text-xs text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}