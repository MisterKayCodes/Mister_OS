import React from 'react';
import { Bot, RefreshCw } from 'lucide-react';

export default function TemplateGenerator({ stats, isGenerating, aiTranscript, setAiTranscript, handleGenerateTemplates }) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 shadow-md text-white">
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
        <Bot size={20} className="text-purple-200" /> AI Template Generator
      </h3>
      <p className="text-xs text-purple-100 mb-4">Paste the transcript of your absolute best closing conversations below (1-3 short chats). The AI will analyze your style and generate 5 high-converting templates instantly.</p>
      <form onSubmit={handleGenerateTemplates} className="flex flex-col gap-3">
        <textarea value={aiTranscript} onChange={e => setAiTranscript(e.target.value)} placeholder="Paste your past chats here..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-200 focus:outline-none focus:bg-white/20 min-h-[80px] resize-none"
          disabled={isGenerating || stats?.outreach_active} />
        <button type="submit" disabled={!aiTranscript.trim() || isGenerating || stats?.outreach_active}
          className="self-end bg-white text-purple-700 px-5 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
          {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Bot size={16} />}
          {isGenerating ? 'Analyzing & Crafting...' : 'Generate Templates'}
        </button>
      </form>
    </div>
  );
}
