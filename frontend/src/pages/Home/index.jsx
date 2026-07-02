import React from 'react';
import { Edit2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import AuthScreen from '../../components/layout/AuthScreen';
import Editor from '../../components/features/Editor';
import ChatAnalyzer from '../../components/features/ChatAnalyzer';
import FinanceApp from '../../pages/Finance';
import OmniChat from '../../components/features/OmniChat';
import SecurityModal from '../../components/features/SecurityModal';
import useHomeState from './components/useHomeState';

export default function Home() {
  const state = useHomeState();

  if (!state.isAuthenticated) return <AuthScreen onLogin={state.handleLogin} />;

  const showSidebar = !state.activeNote && state.viewMode !== 'omnichat' && state.viewMode !== 'finance';

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 bg-[#f9f9f9] relative">
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
          onOpenSecurity={() => state.setShowSecurity(true)}
          onDeleteNotes={state.handleDeleteNotes}
        />
      </div>

      <div className={`flex-1 flex bg-white relative overflow-hidden ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
        {state.viewMode === 'omnichat' ? (
          <OmniChat token={state.token} onBack={state.goBack} />
        ) : state.viewMode === 'finance' ? (
          <FinanceApp token={state.token} onBack={state.goBack} />
        ) : state.activeNote ? (
          <>
            <Editor
              content={state.content}
              setContent={state.setContent}
              title={state.title}
              setTitle={state.setTitle}
              activeNote={state.activeNote}
              onAnalyze={state.analyzeChat}
              isAnalyzing={state.isAnalyzing}
              onBack={state.goBack}
              token={state.token}
            />
            <div className="hidden md:block">
              <ChatAnalyzer result={state.analysisResult} onClose={() => state.setAnalysisResult(null)} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
            <Edit2 size={48} className="opacity-20" />
            <p>Select or create a note.</p>
          </div>
        )}
      </div>

      <div className="md:hidden">
        <ChatAnalyzer result={state.analysisResult} onClose={() => state.setAnalysisResult(null)} />
      </div>

      {state.showSecurity && <SecurityModal token={state.token} onClose={() => state.setShowSecurity(false)} />}
    </div>
  );
}
