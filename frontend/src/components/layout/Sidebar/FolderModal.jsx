import React, { useState } from 'react';

export default function FolderModal({ isOpen, onClose, onSubmit }) {
  const [newFolderName, setNewFolderName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onSubmit(newFolderName.trim());
      setNewFolderName("");
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] md:max-w-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Create New Folder</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
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
              onClick={() => { setNewFolderName(""); onClose(); }}
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
  );
}