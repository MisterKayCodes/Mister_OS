import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Bot, RefreshCw, Shield, X, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchTranscriptsApi, fetchAnalysisApi, runAnalysisApi } from '../../../utils/api';

const RULES = [
  { stage: 'Fresh',     color: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400',   desc: "Scraped from a hunted channel. No message sent yet. Waiting for the Outreach Worker to fire the first pitch." },
  { stage: 'Pitching',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', desc: "First message sent. Holding pattern — watching to see if they open it or reply. No action needed yet." },
  { stage: 'Follow-up', color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500',  desc: "Triggered when: (A) they read it but ignored for 24–72 hrs, or (B) they haven't opened it after 3–5 days. One bump sent. Never chase twice." },
  { stage: 'Hot',       color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', desc: 'They replied anything — even "hmm". Any response = Hot. You get an alert and take over manually to close the deal.' },
  { stage: 'Dead',      color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    desc: "Three paths: (1) They said Not Interested. (2) Ignored the follow-up for 5+ days. (3) They blocked you. Never messaged again. Ever." },
];

const statusStyle = (s) => {
  if (s === 'Hot')       return 'bg-orange-100 text-orange-700';
  if (s === 'Dead')      return 'bg-red-100 text-red-700';
  if (s === 'Follow-up') return 'bg-amber-100 text-amber-700';
  if (s === 'Pitching')  return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-600';
};

export default function ChatLibraryTab({ token }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    Promise.all([fetchTranscriptsApi(token), fetchAnalysisApi(token)])
      .then(([tData, aData]) => { setTranscripts(tData); setAnalysis(aData); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, [token]);

  const handleAnalyse = async () => {
    try {
      setAnalysing(true);
      const data = await runAnalysisApi(token);
      setAnalysis(data);
    } catch (e) {
      alert("Analysis failed: " + e.message);
    } finally {
      setAnalysing(false);
    }
  };

  const filtered = transcripts.filter(t =>
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.profile_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare size={20} className="text-purple-600"/> Chat Library
          </h2>
          <p className="text-sm text-gray-500">All scraped back-and-forth conversations.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>
          <button onClick={() => setShowRules(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 whitespace-nowrap border border-gray-200">
            <Shield size={14} /> Rules
          </button>
          <button onClick={handleAnalyse} disabled={analysing || transcripts.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 whitespace-nowrap">
            {analysing ? <RefreshCw className="animate-spin" size={16} /> : <Bot size={16} />}
            {analysing ? "Analysing..." : "Analyse All"}
          </button>
        </div>
      </div>

      {/* Analysis Dashboard */}
      {analysis && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
            <h3 className="font-bold text-green-700 flex items-center gap-2 mb-2">🟢 What's Working</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: analysis.working_patterns.replace(/\n/g, '<br/>') }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
            <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2">🔴 What's Killing Conversions</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: analysis.killing_patterns.replace(/\n/g, '<br/>') }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
            <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2">🎯 Pain Point Analysis</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: analysis.pain_points.replace(/\n/g, '<br/>') }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-4">
            <h3 className="font-bold text-purple-700 flex items-center gap-2 mb-2">📩 Top Opener Patterns</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: analysis.top_openers.replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={18} className="text-purple-600" /> Pipeline Classification Rules
              </h2>
              <button onClick={() => setShowRules(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {RULES.map(r => (
                <div key={r.stage} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${r.dot}`} />
                  <div>
                    <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-1 ${r.color}`}>{r.stage}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center">One follow-up. Never chase twice. Dead means dead.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><RefreshCw className="animate-spin text-purple-500" size={24} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
          <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No chat transcripts found.</p>
          <p className="text-sm text-gray-400 mt-1">Run the folder scraper script to import chats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:border-purple-300 transition-colors">
              <div
                className="p-4 border-b border-gray-100 cursor-pointer flex justify-between items-center bg-gray-50/50 hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div>
                  <h3 className="font-bold text-gray-800 line-clamp-1">{t.profile_name}</h3>
                  <p className="text-xs text-gray-500 font-mono">@{t.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${statusStyle(t.status)}`}>
                    {t.status}
                  </span>
                  {expandedId === t.id ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                </div>
              </div>
              {expandedId === t.id && (
                <div className="p-4 bg-gray-900 text-gray-300 font-mono text-xs overflow-y-auto max-h-[400px] whitespace-pre-wrap leading-relaxed shadow-inner">
                  {t.transcript}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
