import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, ChevronLeft, MessageSquare, Plus, Loader } from 'lucide-react';
import { sendOmniChatApi, getChatSessionsApi, getChatMessagesApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function OmniChat({ token, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello! I am Mister. I have full access to your notebook and expenses. What would you like to know?" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const { showToast } = useToast();
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await getChatSessionsApi(token);
      setSessions(data);
      if (data.length > 0 && !sessionId) {
        loadSession(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSession = async (id) => {
    setIsLoading(true);
    setSessionId(id);
    try {
      const data = await getChatMessagesApi(id, token);
      if (data.length > 0) {
        setMessages(data);
      } else {
        setMessages([{ role: "assistant", content: "Hello! I am Mister." }]);
      }
      setShowHistory(false);
      isInitialMount.current = true;
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([{ role: "assistant", content: "Hello! I am Mister. I have full access to your notebook and expenses. What would you like to know?" }]);
    setShowHistory(false);
    isInitialMount.current = true;
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendOmniChatApi(userMessage, sessionId, token);
      setMessages(prev => [...prev, { role: "assistant", content: response.content }]);
      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
        fetchSessions(); // refresh history
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-white relative overflow-hidden">
      {/* History Sidebar */}
      <div className={`${showHistory ? 'absolute z-20 translate-x-0' : 'absolute z-20 -translate-x-full md:relative md:translate-x-0'} transition-transform w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-gray-200">
          <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium text-sm">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <button key={s.id} onClick={() => loadSession(s.id)} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 transition text-sm ${sessionId === s.id ? 'bg-purple-100 text-purple-900 font-medium' : 'hover:bg-gray-200 text-gray-700'}`}>
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Header */}
        <div className="h-14 border-b border-gray-100 flex items-center px-4 shrink-0 bg-purple-50 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="md:hidden text-purple-700 hover:text-purple-900">
              <ChevronLeft size={22} />
            </button>
            <h2 className="font-semibold text-purple-800 flex items-center gap-2">
              <Bot size={20} /> Omni-Brain
            </h2>
          </div>
          <button onClick={() => setShowHistory(s => !s)} className="md:hidden text-purple-700 p-2">
            <MessageSquare size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-purple-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-white shadow-sm border border-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white shadow-sm border border-gray-200 text-gray-500 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mister anything about your notes..."
              className="flex-1 bg-gray-100 rounded-full pl-6 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-50"
            >
              <Send size={14} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>
      {/* Overlay for mobile sidebar */}
      {showHistory && (
        <div className="absolute inset-0 bg-black/20 z-10 md:hidden" onClick={() => setShowHistory(false)} />
      )}
    </div>
  );
}
