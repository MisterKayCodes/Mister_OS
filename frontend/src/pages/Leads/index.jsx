import React, { useState, useEffect } from 'react';
import { Target, Search, ChevronLeft, BarChart2, Send, Crosshair, MessageSquare } from 'lucide-react';
import { fetchLeadsApi, createLeadApi, fetchPendingDraftsApi } from '../../utils/api';
import { runHuntWorkerApi } from '../../utils/huntsApi';
// ─── Tab Components ──────────────────────────────────────────────────
import ActiveTab from './components/ActiveTab.jsx';
import ChatLibraryTab from './components/ChatLibraryTab.jsx';
import HuntsTab from './components/HuntsTab.jsx';
import OutreachTab from './components/OutreachTab.jsx';

const TABS = [
  { key: 'hunts',        label: 'Hunts',           icon: <Crosshair size={14} /> },
  { key: 'outreach',     label: 'Outreach',         icon: <Send size={14} /> },
  { key: 'active',       label: 'Active Pipeline',  icon: <BarChart2 size={14} /> },
  { key: 'chat_library', label: 'Chat Library',     icon: <MessageSquare size={14} /> },
];

export default function LeadsApp({ token, onBack }) {
  const [activeTab, setActiveTab]         = useState('active');
  const [leads, setLeads]                 = useState([]);
  const [drafts, setDrafts]               = useState([]);
  const [newLeadUsername, setNewLeadUsername] = useState('');
  const [huntChannel, setHuntChannel]     = useState('');
  const [huntLimit, setHuntLimit]         = useState(10);
  const [isHunting, setIsHunting]         = useState(false);
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    Promise.all([fetchLeadsApi(token), fetchPendingDraftsApi(token)])
      .then(([l, d]) => { setLeads(l); setDrafts(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [token]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLeadUsername.trim()) return;
    try {
      const lead = await createLeadApi(newLeadUsername.trim().replace('@', ''), token);
      setLeads([lead, ...leads]);
      setNewLeadUsername('');
    } catch (err) { alert(err.message); }
  };

  const handleHunt = async () => {
    if (!huntChannel.trim() || isHunting) return;
    setIsHunting(true);
    try {
      await runHuntWorkerApi(huntChannel.trim(), huntLimit, token);
      alert(`Hunt started for ${huntChannel.trim()}! Check the Active Pipeline or Hunts tab in a few minutes.`);
      setHuntChannel('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f3f3] w-full overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-[#e0e0e0] shrink-0">
        {/* Row 1: Title + Back */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Target size={18} className="text-red-500" /> War Room
            </h1>
            <p className="text-xs text-gray-400">Autonomous Sales Pipeline</p>
          </div>
        </div>

        {/* Row 2: Hunt input */}
        <div className="px-4 pb-3 flex gap-2">
          <input
            id="hunt-channel-input"
            type="text"
            placeholder="Seed channel (e.g. @forex_ng)"
            value={huntChannel}
            onChange={e => setHuntChannel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleHunt()}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 transition"
          />
          <input
            id="hunt-limit-input"
            type="number"
            min="1"
            max="100"
            value={huntLimit}
            onChange={e => setHuntLimit(parseInt(e.target.value) || 10)}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 transition"
            title="Channel Scan Limit"
          />
          <button onClick={handleHunt} disabled={isHunting}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isHunting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white`}>
            {isHunting ? <span className="animate-pulse">Starting...</span> : <><Search size={14} /> Hunt</>}
          </button>
        </div>

        {/* Row 3: Tab Nav */}
        <div className="flex border-t border-gray-100">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${activeTab === t.key ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="text-gray-400 text-sm text-center pt-16">Loading War Room...</div>
        ) : (
          <>
            {activeTab === 'hunts'        && <HuntsTab token={token} />}
            {activeTab === 'outreach'     && <OutreachTab token={token} />}
            {activeTab === 'chat_library' && <ChatLibraryTab token={token} />}
            {activeTab === 'active'       && (
              <div className="flex flex-col h-full min-h-0">
                {/* Quick Add Lead */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <form onSubmit={handleAddLead} className="flex gap-2">
                    <input
                      id="new-lead-input"
                      type="text"
                      placeholder="+ Add lead @username"
                      value={newLeadUsername}
                      onChange={e => setNewLeadUsername(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition"
                    />
                    <button type="submit"
                      className="shrink-0 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                      Add
                    </button>
                  </form>
                </div>
                <ActiveTab
                  leads={leads} drafts={drafts} token={token}
                  onLeadsUpdate={setLeads} onDraftsUpdate={setDrafts}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
