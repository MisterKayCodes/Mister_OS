import { useState } from 'react';

export default function useDragDrop(onMoveNotes) {
  const [dragHoverId, setDragHoverId] = useState(null);

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

  const handleDragLeave = () => {
    setDragHoverId(null);
  };

  return {
    dragHoverId,
    handleDragStart,
    handleDrop,
    handleDragOver,
    handleDragLeave
  };
}