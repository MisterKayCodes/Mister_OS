// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { ChevronLeft, Wand2 } from 'lucide-react';
import { generateTitleApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Editor({ content, setContent, title, setTitle, activeNote, onBack, token }) {
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const { showToast } = useToast();

  const handleGenerateTitle = async () => {
    if (!content.trim()) return;
    setIsGeneratingTitle(true);
    try {
      const generated = await generateTitleApi(content, token);
      setTitle(generated);
      showToast("Title generated!", "success");
    } catch (err) {
      showToast("Couldn't generate title: " + err.message, "error");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
        <button onClick={onBack} className="md:hidden flex items-center gap-1 text-gray-500 hover:text-black">
          <ChevronLeft size={20} /> Back
        </button>
        <div className="ml-auto flex items-center gap-2">
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-8 py-6 flex flex-col overflow-y-auto gap-3">
        {/* Title Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="flex-1 text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
          />
          <button
            onClick={handleGenerateTitle}
            disabled={isGeneratingTitle}
            title="Auto-generate title with AI"
            className="shrink-0 p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 transition disabled:opacity-40"
          >
            <Wand2 size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          {new Date(activeNote.updated_at).toLocaleString()}
        </p>

        <textarea
          className="w-full flex-1 text-base leading-relaxed text-gray-800 resize-none focus:outline-none bg-transparent min-h-[300px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your Telegram chat log here, or start typing your thoughts..."
        />
      </div>
    </div>
  );
}
