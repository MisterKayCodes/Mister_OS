// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { Sparkles, Send, BrainCircuit, Loader } from 'lucide-react';
import { getFinanceInsightsApi, canIAffordApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';

export default function InsightsTab({ token }) {
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [affordQuery, setAffordQuery] = useState('');
  const [affordAnswer, setAffordAnswer] = useState('');
  const [loadingAfford, setLoadingAfford] = useState(false);
  const { showToast } = useToast();

  const fetchInsights = async () => {
    setLoadingInsights(true);
    setInsights('');
    try {
      const data = await getFinanceInsightsApi(token);
      setInsights(data.insights);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAfford = async (e) => {
    e.preventDefault();
    if (!affordQuery.trim()) return;
    setLoadingAfford(true);
    setAffordAnswer('');
    try {
      const data = await canIAffordApi(affordQuery, token);
      setAffordAnswer(data.answer);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoadingAfford(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BrainCircuit size={18} className="text-purple-600" />
              Mister's Monthly Analysis
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">AI-powered insights based on your last 30 days</p>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loadingInsights}
            className="flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loadingInsights ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loadingInsights ? 'Analysing...' : 'Run Analysis'}
          </button>
        </div>

        <div className="p-5">
          {!insights && !loadingInsights && (
            <p className="text-sm text-gray-400 text-center py-6">
              Click "Run Analysis" and Mister will review your finances and give you actionable advice.
            </p>
          )}
          {insights && <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words w-full overflow-hidden">{insights}</div>}
        </div>
      </div>

      {/* Can I Afford Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <h3 className="font-semibold text-gray-800">💬 Can I Afford This?</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ask Mister anything about your spending capacity</p>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleAfford} className="flex gap-2">
            <input
              value={affordQuery}
              onChange={e => setAffordQuery(e.target.value)}
              placeholder='e.g. "Can I afford new AirPods this month?"'
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              disabled={loadingAfford}
            />
            <button
              type="submit"
              disabled={loadingAfford || !affordQuery.trim()}
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition disabled:opacity-40 flex items-center gap-1"
            >
              {loadingAfford ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>

          {affordAnswer && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-gray-700">
              <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">Mister's Verdict</p>
              {affordAnswer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
