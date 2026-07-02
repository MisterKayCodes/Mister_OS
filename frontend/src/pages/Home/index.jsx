// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import AuthScreen from '../../components/layout/AuthScreen';
import Editor from '../../components/features/Editor';
import ChatAnalyzer from '../../components/features/ChatAnalyzer';
import FinanceApp from '../../pages/Finance';
import OmniChat from '../../components/features/OmniChat';
import { fetchNotesApi, createNoteApi, saveNoteApi, analyzeChatApi, deleteNotesApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Home() {
  const [token, setToken] = useState(localStorage.getItem("master_token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [viewMode, setViewMode] = useState('editor');
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const { showToast } = useToast();

  useEffect(() => { if (isAuthenticated) fetchNotes(); }, [isAuthenticated]);

  const fetchNotes = async () => {
    try {
      const data = await fetchNotesApi(token);
      setNotes(data);
      if (data.length > 0 && !activeNote) selectNote(data[0]);
    } catch (err) {
      if (err.message === "Invalid Master Token") {
        setIsAuthenticated(false);
        localStorage.removeItem("master_token");
      }
      showToast(err.message, "error");
    }
  };

  const handleLogin = (newToken) => {
    localStorage.setItem("master_token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const createNote = async () => {
    try {
      const newNote = await createNoteApi(token);
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (err) {
      showToast("Failed to create note: " + err.message, "error");
    }
  };

  const selectNote = (note) => {
    setActiveNote(note);
    setContent(note.content);
    setTitle(note.title || "");
    setAnalysisResult(null);
    setViewMode('editor');
  };

  // Auto-save content
  useEffect(() => {
    if (!activeNote) return;
    const timer = setTimeout(() => {
      if (content !== activeNote.content || title !== activeNote.title) {
        saveNoteApi(activeNote.id, content, token, title).then(fetchNotes);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, title]);

  const analyzeChat = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeChatApi(content, token);
      setAnalysisResult(result);
      showToast("Pitch analyzed!", "success");
    } catch (err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const viewFinance = () => {
    setViewMode('finance');
    setActiveNote(null);
  };

  const handleDeleteNotes = async (ids) => {
    try {
      await deleteNotesApi(ids, token);
      showToast(`${ids.length} note(s) deleted`, "success");
      if (activeNote && ids.includes(activeNote.id)) {
        setActiveNote(null);
        setContent("");
        setTitle("");
      }
      fetchNotes();
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  };

  const goBack = () => { setActiveNote(null); setViewMode('editor'); };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

  const showSidebar = !activeNote && viewMode !== 'omnichat' && viewMode !== 'finance';

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 bg-[#f9f9f9] relative">
      <div className={`w-full md:w-72 shrink-0 ${showSidebar ? 'flex' : 'hidden md:flex'} flex-col h-full`}>
        <Sidebar
          notes={notes}
          activeNoteId={activeNote?.id}
          onSelectNote={selectNote}
          onCreateNote={createNote}
          onViewExpenses={viewFinance}
          onOpenOmniBrain={() => { setViewMode('omnichat'); setActiveNote(null); }}
          onDeleteNotes={handleDeleteNotes}
        />
      </div>

      <div className={`flex-1 flex bg-white relative overflow-hidden ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
        {viewMode === 'omnichat' ? (
          <OmniChat token={token} onBack={goBack} />
        ) : viewMode === 'finance' ? (
          <FinanceApp token={token} onBack={goBack} />
        ) : activeNote ? (
          <>
            <Editor
              content={content}
              setContent={setContent}
              title={title}
              setTitle={setTitle}
              activeNote={activeNote}
              onAnalyze={analyzeChat}
              isAnalyzing={isAnalyzing}
              onBack={goBack}
              token={token}
            />
            <div className="hidden md:block">
              <ChatAnalyzer result={analysisResult} onClose={() => setAnalysisResult(null)} />
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
        <ChatAnalyzer result={analysisResult} onClose={() => setAnalysisResult(null)} />
      </div>
    </div>
  );
}
