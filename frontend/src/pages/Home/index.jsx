import React, { useEffect } from 'react';
import { Edit2, ChevronLeft } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Editor from '../../components/features/Editor';
import SecurityModal from '../../components/features/SecurityModal';
import useHomeState from './useHomeState';

export default function NotesApp({ onBack, token }) {
  const state = useHomeState();

  // Override token from props if necessary, but useHomeState uses the master_token anyway
  useEffect(() => {
    // If we wanted to sync token from props, we could, but useHomeState is self-contained
  }, [token]);

  return (
    <div className="flex h-screen w-full overflow-hidden text-gray-800 dark:text-gray-100 bg-[#f9f9f9] dark:bg-gray-900 relative flex-col transition-colors duration-200">
      {/* Offline Banner */}
      {state.isOffline && (
        <div className="w-full bg-amber-500 text-white text-xs text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 z-50">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block"></span>
          You're offline — showing cached data. Changes will sync when you reconnect.
        </div>
      )}

      {/* Top Header Mobile Back Button */}
      <div className="md:hidden flex items-center p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
         <button onClick={onBack} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white flex items-center gap-1 font-medium">
           <ChevronLeft size={20} /> Dashboard
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`w-full md:w-72 shrink-0 ${!state.activeNote ? 'flex' : 'hidden md:flex'} flex-col h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors`}>
              <Sidebar 
                notes={state.notes} 
                folders={state.folders}
                activeNoteId={state.activeNote?.id} 
                onSelectNote={state.selectNote} 
                onCreateNote={state.createNote}
                onCreateFolder={state.handleCreateFolder}
                onDeleteFolder={state.handleDeleteFolder}
                onViewExpenses={null} // Removed quick links from sidebar since dashboard handles it
                onOpenWarRoom={null}
                onOpenKnowledge={null}
                onOpenOmniBrain={null}
                onOpenSecurity={() => state.setShowSecurity(true)}
                onDeleteNotes={state.handleDeleteNotes}
                onMoveNotes={state.handleMoveNotes}
                tokenStats={state.tokenStats}
                onBack={onBack}
              />
        </div>

        {/* Editor Area */}
        <div className={`flex-1 flex bg-white dark:bg-gray-900 relative overflow-hidden ${!state.activeNote ? 'hidden md:flex' : 'flex'}`}>
          {state.activeNote ? (
            <Editor
              content={state.content}
              setContent={state.setContent}
              title={state.title}
              setTitle={state.setTitle}
              activeNote={state.activeNote}
              onBack={() => state.setActiveNote(null)}
              token={state.token}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600 flex-col gap-4">
              <Edit2 size={48} className="opacity-20" />
              <p>Select or create a note.</p>
            </div>
          )}
        </div>
      </div>

      {state.showSecurity && <SecurityModal token={state.token} onClose={() => state.setShowSecurity(false)} />}
    </div>
  );
}
