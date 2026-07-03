import { useState } from 'react';

export default function useSelectMode(notes, onDeleteNotes, onMoveNotes) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelected(notes.map(n => n.id));
  
  const clearSelect = () => {
    setSelected([]);
    setSelectMode(false);
  };

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
    e.target.value = "";
  };

  return {
    selectMode,
    setSelectMode,
    selected,
    setSelected,
    toggleSelect,
    selectAll,
    clearSelect,
    handleDelete,
    handleMoveBulk
  };
}