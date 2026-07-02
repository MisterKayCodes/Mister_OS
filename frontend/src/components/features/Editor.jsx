// Rule: Max 200 lines per file — split if exceeded
import React from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';

export default function Editor({ content, setContent, activeNote, onAnalyze, isAnalyzing, onBack }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
        <button onClick={onBack} className="md:hidden flex items-center gap-1 text-gray-500 hover:text-black">
          <ChevronLeft size={20} /> Back
        </button>
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 text-sm font-medium bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-800 transition disabled:opacity-50"
        >
          <Sparkles size={16} />
          {isAnalyzing ? "Analyzing..." : "Analyze Pitch"}
        </button>
      </div>
      
      <div className="flex-1 p-8 flex flex-col overflow-y-auto">
        <p className="text-xs text-gray-400 mb-4 text-center">
          {new Date(activeNote.updated_at).toLocaleString()}
        </p>
        <textarea 
          className="w-full flex-1 text-lg leading-relaxed text-gray-800 resize-none focus:outline-none bg-transparent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your Telegram chat log here, or start typing your thoughts..."
        />
      </div>
    </div>
  );
}
