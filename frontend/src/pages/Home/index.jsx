import React from 'react';
import { Edit2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import AuthScreen from '../../components/layout/AuthScreen';
import Editor from '../../components/features/Editor';

import FinanceApp from '../../pages/Finance';
import LeadsApp from '../../pages/Leads';
import OmniChat from '../../components/features/OmniChat';
import SecurityModal from '../../components/features/SecurityModal';
import useHomeState from './useHomeState';

export default function Home() {
  const state = useHomeState();

  if (!state.isAuthenticated) return <AuthScreen onLogin={state.handleLogin} />;

  const showSidebar = !state.activeNote && state.viewMode !== 'omnichat' && state.viewMode !== 'finance' && state.viewMode !== 'warroom';

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 bg-[#f9f9f9] relative flex-col">
      {/* Offline Banner */}
      {state.isOffline && (
        <div className="w-full bg-amber-500 text-white text-xs text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 z-50">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block"></span>
          You're offline — showing cached data. Changes will sync when you reconnect.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className={`w-full md:w-72 shrink-0 ${showSidebar ? 'flex' : 'hidden md:flex'} flex-col h-full`}>
          <Sidebar
            notes={state.notes}
            folders={state.folders}
            activeNoteId={state.activeNote?.id}
            onSelectNote={state.selectNote}
            onCreateNote={state.createNote}
            onCreateFolder={state.handleCreateFolder}
            onDeleteFolder={state.handleDeleteFolder}
            onMoveNotes={state.handleMoveNotes}
            onViewExpenses={state.viewFinance}
            onOpenOmniBrain={() => { state.setViewMode('omnichat'); state.setActiveNote(null); }}
            onOpenWarRoom={state.viewWarRoom}
            onOpenSecurity={() => state.setShowSecurity(true)}
            onDeleteNotes={state.handleDeleteNotes}
          />
        </div>

        <div className={`flex-1 flex bg-white relative overflow-hidden ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
          {state.viewMode === 'omnichat' ? (
            <OmniChat token={state.token} onBack={state.goBack} />
          ) : state.viewMode === 'finance' ? (
            <FinanceApp token={state.token} onBack={state.goBack} />
          ) : state.viewMode === 'warroom' ? (
            <LeadsApp token={state.token} onBack={state.goBack} />
          ) : state.activeNote ? (
            <>
              <Editor
                content={state.content}
                setContent={state.setContent}
                title={state.title}
                setTitle={state.setTitle}
                activeNote={state.activeNote}
                onBack={state.goBack}
                token={state.token}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
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
