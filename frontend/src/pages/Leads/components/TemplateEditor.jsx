import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

export default function TemplateEditor({ stats, templates, newTemplate, setNewTemplate, handleAddTemplate, handleDeleteTemplate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
        <MessageSquare size={14} className="text-blue-500" /> Outreach Templates ({templates.length})
      </h3>
      <p className="text-xs text-gray-500 mb-4">Add templates for the worker to use. Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to insert their username. The worker will pick one randomly for each lead.</p>
      <form onSubmit={handleAddTemplate} className="flex gap-2 mb-4">
        <textarea value={newTemplate} onChange={e => setNewTemplate(e.target.value)} placeholder="Hey {name}, I help channel admins monetize..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-h-[60px] resize-none" />
        <button type="submit" disabled={!newTemplate.trim() || stats?.outreach_active}
          className="bg-blue-600 text-white px-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1">
          <Plus size={16} /> Add
        </button>
      </form>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {templates.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-4 bg-gray-50 rounded-lg">No templates added yet.</div>
        ) : (
          templates.map((t, i) => (
            <div key={t.id} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 flex justify-between items-start gap-4">
              <div className="flex-1 whitespace-pre-wrap"><span className="font-bold text-gray-400 mr-2 text-xs">#{templates.length - i}</span>{t.content}</div>
              <button onClick={() => handleDeleteTemplate(t.id)} disabled={stats?.outreach_active} className="text-gray-400 hover:text-red-500 transition disabled:opacity-50">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
