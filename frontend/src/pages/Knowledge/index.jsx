import React, { useState, useEffect } from 'react';
import { ChevronLeft, Youtube, Search, BookOpen, Trash2, ExternalLink } from 'lucide-react';
import { ingestYouTubeApi, getTranscriptsApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function KnowledgeApp({ token, onBack }) {
  const [url, setUrl] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const data = await getTranscriptsApi(token);
      setTranscripts(data);
    } catch (err) {
      showToast("Error loading transcripts: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      showToast("Please enter a valid YouTube URL", "error");
      return;
    }

    setIsIngesting(true);
    try {
      const result = await ingestYouTubeApi(url, token);
      showToast(`Successfully ingested: ${result.title}`, "success");
      setUrl("");
      fetchTranscripts();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f9]">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shrink-0 gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-black">
          <ChevronLeft size={22} />
        </button>
        <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <BookOpen size={18} className="text-purple-500" /> Knowledge Base
        </h2>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* Ingest Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <Youtube size={18} className="text-red-500" />
            Ingest YouTube Video
          </h3>
          <p className="text-xs text-gray-500 mb-4">Paste a YouTube link. We will fetch the transcript, chunk it, and save it to your OmniBrain.</p>
          
          <form onSubmit={handleIngest} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="url" 
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={isIngesting || !url}
              className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center min-w-[120px]"
            >
              {isIngesting ? (
                <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Fetching...</span>
              ) : "Fetch Transcript"}
            </button>
          </form>
        </div>

        {/* Transcript Library */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Transcript Library</h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading transcripts...</div>
          ) : transcripts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
              <Youtube size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No transcripts ingested yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map(note => (
                <div key={note.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/30 transition group">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">{note.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{note.word_count.toLocaleString()} words</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-600 font-medium">
                      Available in OmniChat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
