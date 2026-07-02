// Rule: Max 200 lines per file — split if exceeded
import React from 'react';
import { Sparkles, X } from 'lucide-react';

export default function ChatAnalyzer({ result, onClose }) {
  if (!result) return null;

  return (
    <div className="absolute inset-0 md:relative md:inset-auto md:w-1/3 bg-gray-50 md:border-l border-gray-200 flex flex-col z-40">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-600" /> AI Insights
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-black">
          <X size={18} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1 prose prose-sm">
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {result}
        </div>
      </div>
    </div>
  );
}
