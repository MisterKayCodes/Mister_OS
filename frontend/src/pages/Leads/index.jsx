import React, { useState, useEffect, useCallback } from 'react';
import {
  Target, Search, ChevronLeft, Bot, MessageSquare, Check, X,
  AlertTriangle, Users, Crosshair, Send, Clock, BarChart2,
  RefreshCw, Plus, Edit2, Trash2, Settings, Zap, Shield
} from 'lucide-react';
import {
  fetchLeadsApi, createLeadApi, updateLeadApi,
  fetchPendingDraftsApi, approveDraftApi, deleteDraftApi
} from '../../utils/api';
import {
  fetchHuntsApi, fetchOutreachStatsApi, fetchCrmSettingsApi, updateCrmSettingsApi, updateAdminLeadApi,
  fetchTemplatesApi, createTemplateApi, deleteTemplateApi, startOutreachApi, stopOutreachApi, generateTemplatesApi
} from '../../utils/huntsApi';

// ─── Sub-components ───────────────────────────────────────────────

function HuntsTab({ token }) {
  const [channels, setChannels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('admins'); // admins | channels

  useEffect(() => {
    fetchHuntsApi(token).then(data => {
      setChannels(data.channels || []);
      setAdmins(data.admins || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleStatusChange = async (admin, newStatus) => {
    try {
      const updated = await updateAdminLeadApi(admin.id, { status: newStatus }, token);
      setAdmins(admins.map(a => a.id === admin.id ? updated : a));
    } catch (e) { alert(e.message); }
  };

  const freshAdmins = admins.filter(a => a.status === 'fresh');
  const manualAdmins = admins.filter(a => a.status === 'manual_review');
  const sentAdmins = admins.filter(a => a.status === 'outreach_sent');

  if (loading) return <div className="text-gray-400 text-sm text-center pt-16">Loading hunt data...</div>;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Sub tab */}
      <div className="flex gap-3 border-b border-gray-100 pb-0">
        {[['admins', 'Admin Usernames'], ['channels', 'Scraped Channels']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium border-b-2 transition ${tab === key ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'admins' && (
        <>
          {/* Fresh Admins Table */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Crosshair size={14} className="text-red-500" /> Fresh Admins ({freshAdmins.length})
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {freshAdmins.length === 0 ? (
                <p className="text-xs text-gray-400 p-4 text-center">No fresh admin leads. Run the Hunt worker to populate.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <tr><th className="p-3 text-left">Username</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Actions</th></tr>
                  </thead>
                  <tbody>
                    {freshAdmins.map(admin => (
                      <tr key={admin.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">@{admin.username}</td>
                        <td className="p-3 text-gray-500 text-xs capitalize">{admin.source}</td>
                        <td className="p-3">
                          <button onClick={() => handleStatusChange(admin, 'dead')}
                            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition">
                            Mark Dead
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Outreach Sent */}
          {sentAdmins.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Send size={14} className="text-blue-400" /> Outreach Sent ({sentAdmins.length})
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <tr><th className="p-3 text-left">Username</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Contacted</th></tr>
                  </thead>
                  <tbody>
                    {sentAdmins.map(admin => (
                      <tr key={admin.id} className="border-t border-gray-100">
                        <td className="p-3 text-gray-700">@{admin.username}</td>
                        <td className="p-3 text-gray-500 text-xs capitalize">{admin.source}</td>
                        <td className="p-3 text-gray-400 text-xs">{admin.contacted_at ? new Date(admin.contacted_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manual Review */}
          {manualAdmins.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Manual Review ({manualAdmins.length})
              </h3>
              <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-100 text-xs text-amber-700 font-medium">
                    <tr><th className="p-3 text-left">Channel</th><th className="p-3 text-left">Actions</th></tr>
                  </thead>
                  <tbody>
                    {manualAdmins.map(admin => (
                      <tr key={admin.id} className="border-t border-amber-100">
                        <td className="p-3 text-amber-900 font-medium">{admin.username.replace('MANUAL:', '')}</td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => handleStatusChange(admin, 'dead')}
                            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Dead</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'channels' && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Users size={14} className="text-blue-500" /> Scraped Channels ({channels.length})
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {channels.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 text-center">No channels scraped yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                  <tr><th className="p-3 text-left">Channel</th><th className="p-3 text-left">Members</th><th className="p-3 text-left">Status</th></tr>
                </thead>
                <tbody>
                  {channels.map(ch => (
                    <tr key={ch.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">@{ch.username || ch.tg_id}</td>
                      <td className="p-3 text-gray-500 text-xs">{ch.members_count?.toLocaleString() || '—'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ch.status === 'scanned' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {ch.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OutreachTab({ token }) {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [editBoss, setEditBoss] = useState(false);
  const [bossUsername, setBossUsername] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([fetchOutreachStatsApi(token), fetchCrmSettingsApi(token), fetchTemplatesApi(token)]).then(([s, cfg, tpls]) => {
      setStats(s); setSettings(cfg); setTemplates(tpls);
      setBossUsername(cfg.boss_alert_username || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);
  
  // Polling for stats and next_run when active
  useEffect(() => {
    if (stats?.outreach_active) {
      const interval = setInterval(() => {
        fetchOutreachStatsApi(token).then(setStats);
      }, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [stats?.outreach_active, token]);

  const saveBossUsername = async () => {
    try {
      const updated = await updateCrmSettingsApi({ boss_alert_username: bossUsername.replace('@', '') }, token);
      setSettings(updated);
      setEditBoss(false);
    } catch (e) { alert(e.message); }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.trim()) return;
    try {
      const tpl = await createTemplateApi(newTemplate.trim(), token);
      setTemplates([tpl, ...templates]);
      setNewTemplate('');
    } catch (err) { alert(err.message); }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await deleteTemplateApi(id, token);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleStart = async () => {
    try {
      if (templates.length === 0) return alert("Please add at least one template first!");
      await startOutreachApi();
      setStats(prev => ({ ...prev, outreach_active: true }));
    } catch (err) { alert(err.message); }
  };

  const handleGenerateTemplates = async (e) => {
    e.preventDefault();
    if (!aiTranscript.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateTemplatesApi(aiTranscript.trim(), token);
      setTemplates([...generated, ...templates]);
      setAiTranscript('');
      alert("Generated 5 new high-converting templates!");
    } catch (err) {
      alert("Failed to generate: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopOutreachApi();
      setStats(prev => ({ ...prev, outreach_active: false }));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="text-gray-400 text-sm text-center pt-16">Loading outreach data...</div>;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-gray-900">{stats?.sent_today ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Sent Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-gray-900">{stats?.sent_this_week ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">This Week</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-green-700">{stats?.total_fresh ?? 0}</p>
          <p className="text-xs text-green-600 mt-1">Ready to Send</p>
        </div>
      </div>

      {/* Start Outreach Banner */}
      <div className={`rounded-2xl p-5 text-white shadow-md transition-colors ${stats?.outreach_active ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-700 to-gray-900'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Zap size={20} className={stats?.outreach_active ? "text-yellow-300" : "text-gray-400"} />
              {stats?.outreach_active ? "Outreach is RUNNING" : "Outreach is STOPPED"}
            </h3>
            {stats?.outreach_active && stats?.next_run ? (
              <p className="text-green-100 text-xs mt-1">
                Next message sending around {new Date(stats.next_run).toLocaleTimeString()}
              </p>
            ) : (
              <p className="text-gray-300 text-xs mt-1">Random delay: {settings?.min_delay_minutes}–{settings?.max_delay_minutes} min between messages</p>
            )}
          </div>
          <div>
            {stats?.outreach_active ? (
              <button onClick={handleStop} className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 shadow-sm transition">
                Stop Worker
              </button>
            ) : (
              <button onClick={handleStart} disabled={templates.length === 0} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-400 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                ▶ Start
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Boss Alert Setting */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-purple-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Boss Alert Account</h3>
          </div>
          <button onClick={() => setEditBoss(!editBoss)}
            className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Edit2 size={12} /> Edit
          </button>
        </div>
        {editBoss ? (
          <div className="flex gap-2">
            <input
              value={bossUsername}
              onChange={e => setBossUsername(e.target.value)}
              placeholder="e.g. opozdal96"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
            <button onClick={saveBossUsername}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
              Save
            </button>
          </div>
        ) : (
          <p className="text-sm font-bold text-gray-800">@{settings?.boss_alert_username || 'Not set'}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">Handoff alerts and buy signals are forwarded to this account.</p>
      </div>

      {/* AI Template Generator */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 shadow-md text-white">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <Bot size={20} className="text-purple-200" /> AI Template Generator
        </h3>
        <p className="text-xs text-purple-100 mb-4">Paste the transcript of your absolute best closing conversations below (1-3 short chats). The AI will analyze your style and generate 5 high-converting templates instantly.</p>
        
        <form onSubmit={handleGenerateTemplates} className="flex flex-col gap-3">
          <textarea
            value={aiTranscript}
            onChange={e => setAiTranscript(e.target.value)}
            placeholder="Paste your past chats here..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-200 focus:outline-none focus:bg-white/20 min-h-[80px] resize-none"
            disabled={isGenerating || stats?.outreach_active}
          />
          <button type="submit" disabled={!aiTranscript.trim() || isGenerating || stats?.outreach_active}
            className="self-end bg-white text-purple-700 px-5 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Bot size={16} />}
            {isGenerating ? 'Analyzing & Crafting...' : 'Generate Templates'}
          </button>
        </form>
      </div>

      {/* Templates Editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-500" /> Outreach Templates ({templates.length})
        </h3>
        <p className="text-xs text-gray-500 mb-4">Add templates for the worker to use. Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to insert their username. The worker will pick one randomly for each lead.</p>
        
        <form onSubmit={handleAddTemplate} className="flex gap-2 mb-4">
          <textarea
            value={newTemplate}
            onChange={e => setNewTemplate(e.target.value)}
            placeholder="Hey {name}, I help channel admins monetize..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-h-[60px] resize-none"
          />
          <button type="submit" disabled={!newTemplate.trim() || stats?.outreach_active}
            className="bg-blue-600 text-white px-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1">
            <Plus size={16} /> Add
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {templates.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4 bg-gray-50 rounded-lg">No templates added yet.</div>
          ) : (
            templates.map((t, i) => (
              <div key={t.id} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 flex justify-between items-start gap-4">
                <div className="flex-1 whitespace-pre-wrap"><span className="font-bold text-gray-400 mr-2 text-xs">#{templates.length - i}</span>{t.content}</div>
                <button onClick={() => handleDeleteTemplate(t.id)} disabled={stats?.outreach_active} className="text-gray-400 hover:text-red-500 transition disabled:opacity-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveTab({ leads, drafts, token, onLeadsUpdate, onDraftsUpdate }) {
  const columns = ['Cold', 'Warm', 'Hot', 'Closed', 'Dead'];

  const handleUpdateStatus = async (id, status) => {
    try {
      const updated = await updateLeadApi(id, { status }, token);
      onLeadsUpdate(leads.map(l => l.id === id ? updated : l));
    } catch (err) { alert(err.message); }
  };

  const toggleAutoPilot = async (id, current) => {
    try {
      const updated = await updateLeadApi(id, { auto_pilot: !current }, token);
      onLeadsUpdate(leads.map(l => l.id === id ? updated : l));
    } catch (err) { alert(err.message); }
  };

  const handleApproveDraft = async (id) => {
    try {
      await approveDraftApi(id, token);
      onDraftsUpdate(drafts.filter(d => d.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleRejectDraft = async (id) => {
    try {
      await deleteDraftApi(id, token);
      onDraftsUpdate(drafts.filter(d => d.id !== id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex flex-1 overflow-x-auto overflow-y-hidden p-4 gap-4 min-h-0">
      {columns.map(status => (
        <div key={status} className="flex flex-col w-64 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">{status}</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
              {leads.filter(l => l.status === status).length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {leads.filter(l => l.status === status).map(lead => (
              <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-red-300 transition">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">@{lead.username}</h4>
                  {!lead.auto_pilot && status !== 'Closed' && status !== 'Dead' && (
                    <div title="Handoff Alert"><AlertTriangle size={13} className="text-red-500" /></div>
                  )}
                </div>
                {lead.channel_username && (
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Users size={11} /> {lead.channel_username}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => toggleAutoPilot(lead.id, lead.auto_pilot)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition ${lead.auto_pilot ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    <Bot size={11} /> {lead.auto_pilot ? 'AUTO' : 'MANUAL'}
                  </button>
                  <select value={lead.status} onChange={e => handleUpdateStatus(lead.id, e.target.value)}
                    className="text-xs bg-transparent text-gray-500 cursor-pointer focus:outline-none">
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Approval Inbox */}
      {drafts.length > 0 && (
        <div className="flex flex-col w-72 shrink-0 bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden">
          <div className="p-3 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
            <h3 className="font-semibold text-purple-800 text-sm flex items-center gap-2">
              <MessageSquare size={15} /> Approval Inbox
            </h3>
            <span className="text-xs font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full">{drafts.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {drafts.map(draft => {
              const lead = leads.find(l => l.id === draft.lead_id);
              return (
                <div key={draft.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">@{lead?.username || 'Unknown'}</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 whitespace-pre-wrap">{draft.content}</div>
                  <div className="flex justify-between">
                    <button onClick={() => handleRejectDraft(draft.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><X size={15} /></button>
                    <button onClick={() => handleApproveDraft(draft.id)}
                      className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-600">
                      <Check size={13} /> Approve & Send
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main War Room Component ──────────────────────────────────────
export default function LeadsApp({ token, onBack }) {
  const [activeTab, setActiveTab] = useState('active');
  const [leads, setLeads] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [newLeadUsername, setNewLeadUsername] = useState('');
  const [huntChannel, setHuntChannel] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const handleHunt = () => {
    if (!huntChannel.trim()) return;
    alert(`Run: python telegram_service/hunt_worker.py --seed ${huntChannel.trim()} --limit 10`);
    setHuntChannel('');
  };

  const TABS = [
    { key: 'hunts', label: 'Hunts', icon: <Crosshair size={14} /> },
    { key: 'outreach', label: 'Outreach', icon: <Send size={14} /> },
    { key: 'active', label: 'Active Pipeline', icon: <BarChart2 size={14} /> },
  ];

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
          <button onClick={handleHunt}
            className="shrink-0 flex items-center gap-1.5 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">
            <Search size={14} /> Hunt
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
            {activeTab === 'hunts' && <HuntsTab token={token} />}
            {activeTab === 'outreach' && <OutreachTab token={token} />}
            {activeTab === 'active' && (
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
