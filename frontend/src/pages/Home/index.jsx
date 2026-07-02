// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import AuthScreen from '../../components/layout/AuthScreen';
import Editor from '../../components/features/Editor';
import ChatAnalyzer from '../../components/features/ChatAnalyzer';
import ExpensesModal from '../../components/features/ExpensesModal';
import OmniChat from '../../components/features/OmniChat';
import { fetchNotesApi, createNoteApi, saveNoteApi, fetchExpensesApi, analyzeChatApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Home() {
  const [token, setToken] = useState(localStorage.getItem("master_token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'omnichat'
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showExpenses, setShowExpenses] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) fetchNotes();
  }, [isAuthenticated]);

  const fetchNotes = async () => {
    try {
      const data = await fetchNotesApi(token);
      setNotes(data);
      if (data.length > 0 && !activeNote) selectNote(data[0]);
    } catch (err) {
      if (err.message === "Invalid Master Token") {
        setIsAuthenticated(false);
        localStorage.removeItem("master_token");
        showToast(err.message, "error");
      } else {
        showToast("Failed to fetch notes: " + err.message, "error");
        console.error("Failed to fetch notes", err);
      }
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
      console.error(err);
    }
  };

  const selectNote = (note) => {
    setActiveNote(note);
    setContent(note.content);
    setAnalysisResult(null);
    setViewMode('editor');
  };

  useEffect(() => {
    if (!activeNote) return;
    const timer = setTimeout(() => {
      if (content !== activeNote.content) {
        saveNoteApi(activeNote.id, content, token).then(fetchNotes);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  const analyzeChat = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeChatApi(content, token);
      setAnalysisResult(result);
      showToast("Pitch analyzed successfully!", "success");
    } catch (err) {
      showToast("Error analyzing chat: " + err.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const viewExpenses = async () => {
    try {
      const data = await fetchExpensesApi(token);
      setExpenses(data);
      setShowExpenses(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 bg-[#f9f9f9] relative">
      <div className={`w-full md:w-72 shrink-0 ${activeNote || viewMode === 'omnichat' ? 'hidden md:flex' : 'flex'} flex-col h-full`}>
        <Sidebar 
          notes={notes} 
          activeNoteId={activeNote?.id} 
          onSelectNote={selectNote} 
          onCreateNote={createNote} 
          onViewExpenses={viewExpenses} 
          onOpenOmniBrain={() => { setViewMode('omnichat'); setActiveNote(null); }}
        />
      </div>

      <div className={`flex-1 flex bg-white relative overflow-hidden ${!activeNote && viewMode !== 'omnichat' ? 'hidden md:flex' : 'flex'}`}>
        {viewMode === 'omnichat' ? (
          <OmniChat token={token} />
        ) : activeNote ? (
          <>
            <Editor 
              content={content} 
              setContent={setContent} 
              activeNote={activeNote} 
              onAnalyze={analyzeChat} 
              isAnalyzing={isAnalyzing} 
              onBack={() => setActiveNote(null)}
            />
            <div className="hidden md:block">
              <ChatAnalyzer 
                result={analysisResult} 
                onClose={() => setAnalysisResult(null)} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
             <Edit2 size={48} className="opacity-20" />
             <p>Select or create a note.</p>
          </div>
        )}
      </div>

      {/* Mobile Chat Analyzer Overlay */}
      <div className="md:hidden">
        <ChatAnalyzer 
          result={analysisResult} 
          onClose={() => setAnalysisResult(null)} 
        />
      </div>

      {showExpenses && (
        <ExpensesModal expenses={expenses} onClose={() => setShowExpenses(false)} />
      )}
    </div>
  );
}
