import React, { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import SelectModeBar from './SelectModeBar';
import NoteItem from './NoteItem';
import FolderItem from './FolderItem';
import FolderModal from './FolderModal';
import TokenGauge from './TokenGauge';
import useSelectMode from './useSelectMode';
import useDragDrop from './useDragDrop';
import useFolderExpansion from './useFolderExpansion';

export default function Sidebar({ 
  notes, 
  folders = [], 
  activeNoteId, 
  onSelectNote, 
  onCreateNote, 
  onViewExpenses, 
  onOpenOmniBrain, 
  onOpenWarRoom, 
  onOpenSecurity, 
  onDeleteNotes, 
  onBack, 
  showBack, 
  onCreateFolder, 
  onDeleteFolder, 
  onMoveNotes, 
  tokenStats 
}) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  
  const { 
    selectMode, 
    setSelectMode,
    selected, 
    setSelected,
    toggleSelect, 
    selectAll, 
    clearSelect, 
    handleDelete, 
    handleMoveBulk 
  } = useSelectMode(notes, onDeleteNotes, onMoveNotes);
  
  const { expandedFolders, toggleFolder } = useFolderExpansion();
  
  const { 
    dragHoverId, 
    handleDragStart, 
    handleDrop, 
    handleDragOver, 
    handleDragLeave 
  } = useDragDrop(onMoveNotes);

  const rootNotes = notes.filter(n => !n.folder_id);

  return (
    <div className="w-full bg-[#f3f3f3] md:border-r border-[#e0e0e0] flex flex-col h-full relative">
      <SidebarHeader 
        showBack={showBack}
        onBack={onBack}
        onOpenSecurity={onOpenSecurity}
        onOpenOmniBrain={onOpenOmniBrain}
        onViewExpenses={onViewExpenses}
        onOpenWarRoom={onOpenWarRoom}
        setShowFolderModal={setShowFolderModal}
        onCreateNote={onCreateNote}
        selectMode={selectMode}
        setSelectMode={setSelectMode}
        setSelected={setSelected}
      />

      {selectMode && (
        <SelectModeBar 
          selected={selected}
          onSelectAll={selectAll}
          onClear={clearSelect}
          onDelete={handleDelete}
          onMove={handleMoveBulk}
          folders={folders}
        />
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        <div 
          onDrop={(e) => handleDrop(e, null)}
          onDragOver={(e) => handleDragOver(e, 'root')}
          onDragLeave={handleDragLeave}
          className={`${dragHoverId === 'root' ? 'bg-blue-50' : ''} transition-colors min-h-[50px]`}
        >
          {rootNotes.map(note => (
            <NoteItem 
              key={note.id}
              note={note}
              activeNoteId={activeNoteId}
              selectMode={selectMode}
              selected={selected}
              onSelectNote={onSelectNote}
              toggleSelect={toggleSelect}
              onDragStart={handleDragStart}
            />
          ))}
          {rootNotes.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 italic">No notes in root</div>
          )}
        </div>
        
        {folders.map(folder => (
          <FolderItem 
            key={folder.id}
            folder={folder}
            notes={notes}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            activeNoteId={activeNoteId}
            selectMode={selectMode}
            selected={selected}
            onSelectNote={onSelectNote}
            toggleSelect={toggleSelect}
            onCreateNote={onCreateNote}
            onDeleteFolder={onDeleteFolder}
            onDragStart={handleDragStart}
            dragHoverId={dragHoverId}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
          />
        ))}
      </div>

      {tokenStats && <TokenGauge stats={tokenStats} />}
      
      <FolderModal 
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={onCreateFolder}
      />
    </div>
  );
}