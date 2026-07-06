import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, Check, Trash2, Play, Square, Brain, 
  Sparkles, Save, FastForward, Clock, History, AlertTriangle, HelpCircle
} from 'lucide-react';
import { 
  fetchOutreachStatsApi, fetchCrmSettingsApi, updateCrmSettingsApi,
  startOutreachApi, stopOutreachApi, forceOutreachApi
} from '../../../utils/huntsApi';
import { 
  fetchBrainApi, updateBrainApi, fetchQueueApi, fillQueueApi, 
  updateQueueItemApi, approveAllQueueApi, fetchSentHistoryApi 
} from '../../../utils/outreachQueueApi';

export default function OutreachTab({ token }) {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [brain, setBrain] = useState(null);
  const [queue, setQueue] = useState([]);
  const [sentHistory, setSentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filling, setFilling] = useState(false);
  const [savingBrain, setSavingBrain] = useState(false);
  const [bossUsername, setBossUsername] = useState('');
  const [editBoss, setEditBoss] = useState(false);
  
  // Local state for editing messages in queue
  const [editedMessages, setEditedMessages] = useState({});
  // Local state for editing brain fields
  const [adviceText, setAdviceText] = useState('');
  const [systemPromptText, setSystemPromptText] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [s, cfg, brn, q, hist] = await Promise.all([
        fetchOutreachStatsApi(token),
        fetchCrmSettingsApi(token),
        fetchBrainApi(token),
        fetchQueueApi('pending,approved', token),
        fetchSentHistoryApi(token)
      ]);
      setStats(s);
      setSettings(cfg);
      setBrain(brn);
      setAdviceText(brn.advice_text || '');
      setSystemPromptText(brn.system_prompt || '');
      setQueue(q);
      setSentHistory(hist);
      setBossUsername(cfg.boss_alert_username || '');
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for stats and queue when outreach is active
  useEffect(() => {
    if (stats?.outreach_active) {
      const interval = setInterval(() => {
        fetchOutreachStatsApi(token).then(setStats).catch(() => {});
        fetchQueueApi('pending,approved', token).then(setQueue).catch(() => {});
        fetchSentHistoryApi(token).then(setSentHistory).catch(() => {});
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [stats?.outreach_active, token]);

  const handleStart = async () => {
    try {
      // Check if we have approved items
      const approvedCount = queue.filter(item => item.status === 'approved').length;
      const totalApproved = stats?.total_fresh || 0; // fallback / estimation
      
      // Let's check the database approved count
      const approvedQueue = await fetchQueueApi('approved', token);
      if (approvedQueue.length === 0) {
        return alert("Please approve at least one generated message in the queue before starting outreach!");
      }
      
      await startOutreachApi();
      setStats(prev => ({ ...prev, outreach_active: true }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStop = async () => {
    try {
      await stopOutreachApi();
      setStats(prev => ({ ...prev, outreach_active: false }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelayModeChange = async (mode) => {
    try {
      const updated = await updateCrmSettingsApi({ delay_mode: mode }, token);
      setSettings(updated);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleFillQueue = async () => {
    setFilling(true);
    try {
      const res = await fillQueueApi(10, token);
      if (res.generated === 0) {
        alert("No fresh admins available to fill the queue. Scan some channels first!");
      } else {
        const q = await fetchQueueApi('pending,approved', token);
        setQueue(q);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setFilling(false);
    }
  };

  const handleQueueMessageChange = (id, val) => {
    setEditedMessages(prev => ({ ...prev, [id]: val }));
  };

  const handleSaveAndApprove = async (item) => {
    const finalMsg = editedMessages[item.id] !== undefined ? editedMessages[item.id] : (item.edited_message || item.generated_message);
    try {
      await updateQueueItemApi(item.id, { 
        edited_message: finalMsg,
        status: 'approved'
      }, token);
      // Update locally to approved so it stays in UI
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, edited_message: finalMsg, status: 'approved' } : i));
      // Refresh stats
      const s = await fetchOutreachStatsApi(token);
      setStats(s);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSkip = async (id) => {
    try {
      await updateQueueItemApi(id, { status: 'skipped' }, token);
      setQueue(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleApproveAll = async () => {
    try {
      await approveAllQueueApi(token);
      setQueue([]);
      const s = await fetchOutreachStatsApi(token);
      setStats(s);
      alert("All pending queue items approved!");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSaveBrain = async () => {
    setSavingBrain(true);
    try {
      const updated = await updateBrainApi({ system_prompt: systemPromptText, advice_text: adviceText }, token);
      setBrain(updated);
      alert("AI Outreach Brain updated successfully!");
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingBrain(false);
    }
  };

  const saveBossUsername = async () => {
    try {
      const updated = await updateCrmSettingsApi({ boss_alert_username: bossUsername.replace('@', '') }, token);
      setSettings(updated);
      setEditBoss(false);
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="text-gray-400 text-sm text-center pt-16">Loading outreach engine...</div>;

  return (
    <div className="flex flex-col gap-6 p-4">
      
      {/* ─── SECTION A: STATUS & QUICK STATS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status card */}
        <div className={`rounded-xl p-4 text-white shadow-sm flex flex-col justify-between h-28 transition-all ${stats?.outreach_active ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Outreach Service</h4>
            <div className={`w-2 h-2 rounded-full ${stats?.outreach_active ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-lg font-black tracking-tight">{stats?.outreach_active ? 'RUNNING' : 'STOPPED'}</p>
              {stats?.outreach_active && stats?.next_run && (
                <p className="text-[10px] text-green-100 flex items-center gap-1 mt-1">
                  <Clock size={10} /> {new Date(stats.next_run).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div>
              {stats?.outreach_active ? (
                <button onClick={handleStop} className="bg-white text-green-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-green-50 transition shadow-sm">
                  Stop
                </button>
              ) : (
                <button onClick={handleStart} className="bg-green-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-green-500 transition shadow-sm border border-green-400">
                  Start
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center flex flex-col justify-center h-28 shadow-sm">
          <p className="text-3xl font-extrabold text-gray-900">{stats?.sent_today ?? 0}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Sent Today</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center flex flex-col justify-center h-28 shadow-sm">
          <p className="text-3xl font-extrabold text-gray-900">{stats?.sent_this_week ?? 0}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Sent This Week</p>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center flex flex-col justify-center h-28 shadow-sm">
          <p className="text-3xl font-extrabold text-emerald-700">{queue.length}</p>
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mt-1">Pending Review</p>
        </div>
      </div>

      {/* ─── NEXT UP PREVIEW ─── */}
      {stats?.outreach_active && (() => {
        const nextApproved = queue.find(i => i.status === 'approved');
        const nextRun = stats?.next_run ? new Date(stats.next_run) : null;
        const now = new Date();
        const minsUntil = nextRun ? Math.max(0, Math.round((nextRun - now) / 60000)) : null;

        if (!nextApproved) return (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Queue is empty — Outreach is paused!</p>
              <p className="text-xs text-amber-700 mt-1">The bot is running but has no approved messages to send. Click <strong>Generate Next 10</strong> below and approve some messages to resume sending.</p>
            </div>
          </div>
        );

        return (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Next message sending to</p>
                <p className="text-sm font-extrabold text-gray-900">@{nextApproved.admin_username}</p>
                {nextApproved.channel_name && <p className="text-xs text-gray-500">from {nextApproved.channel_name}</p>}
              </div>
            </div>
            <div className="text-right shrink-0">
              {minsUntil !== null ? (
                <>
                  <p className="text-2xl font-black text-emerald-700">{minsUntil}m</p>
                  <p className="text-[10px] text-emerald-500">until send</p>
                </>
              ) : (
                <p className="text-xs text-emerald-600 font-bold">Sending soon</p>
              )}
              <button 
                onClick={async () => {
                  try {
                    await forceOutreachApi();
                    alert("Forced! Bot will skip the remaining wait time.");
                    const s = await fetchOutreachStatsApi(token);
                    setStats(s);
                  } catch(e) { alert(e.message); }
                }}
                className="mt-1 bg-emerald-600 text-white hover:bg-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm transition"
              >
                ⚡ Force Send Now
              </button>
            </div>
            <div className="max-w-xs hidden md:block">
              <p className="text-[11px] text-gray-500 italic line-clamp-2">"{nextApproved.edited_message || nextApproved.generated_message}"</p>
            </div>
          </div>
        );
      })()}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" /> Humanized Delay Modes
        </h3>
        <p className="text-xs text-gray-500 mb-4">To prevent Telegram bans, the bot randomizes the delay between messages. Wide intervals ensure natural, human-like activity.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { mode: 'safe', title: '🐢 Safe & Slow', desc: '45 mins to 3 hours delay', color: 'border-green-500 text-green-700 bg-green-50/30' },
            { mode: 'balanced', title: '⚡ Balanced', desc: '20 mins to 90 mins delay', color: 'border-blue-500 text-blue-700 bg-blue-50/30' },
            { mode: 'aggressive', title: '🔥 Aggressive', desc: '10 mins to 45 mins delay', color: 'border-red-500 text-red-700 bg-red-50/30' }
          ].map(d => {
            const isSelected = settings?.delay_mode === d.mode;
            return (
              <button 
                key={d.mode}
                onClick={() => handleDelayModeChange(d.mode)}
                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  isSelected ? `${d.color} shadow-sm ring-1 ring-offset-0` : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-sm font-bold text-gray-800">{d.title}</span>
                <span className="text-xs text-gray-500 mt-1">{d.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION C: PREVIEW QUEUE (MAIN ACTION) ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 animate-pulse" /> AI-Generated Opener Queue
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Edit AI's personalized message drafts and approve them to enter the sending queue.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleFillQueue}
              disabled={filling}
              className="bg-blue-600 text-white hover:bg-blue-700 transition px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1 shadow-sm"
            >
              {filling ? 'Generating...' : '⚡ Generate Next 10'}
            </button>
            {queue.length > 0 && (
              <button 
                onClick={handleApproveAll}
                className="bg-emerald-600 text-white hover:bg-emerald-700 transition px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <FastForward size={12} /> Approve All
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {queue.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <HelpCircle className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm font-semibold text-gray-700">Queue is Empty</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Click "Generate Next 10" above to have the AI write personalized openers for your fresh admin leads.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {queue.map(item => {
                const userVal = editedMessages[item.id] !== undefined ? editedMessages[item.id] : (item.edited_message || item.generated_message);
                const isEdited = userVal !== item.generated_message;

                return (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-all flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-extrabold text-gray-900">
                          @{item.admin_username}
                          {item.status === 'approved' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                              APPROVED
                            </span>
                          )}
                        </span>
                        {item.channel_name && (
                          <span className="text-xs text-blue-600 font-medium ml-2">from {item.channel_name}</span>
                        )}
                      </div>
                      {isEdited && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          ✏️ Edited (AI will learn)
                        </span>
                      )}
                    </div>
                    
                    <textarea
                      value={userVal}
                      onChange={e => handleQueueMessageChange(item.id, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-400 min-h-[60px] resize-none"
                    />

                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleSkip(item.id)}
                        className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Skip Lead
                      </button>
                      <button 
                        onClick={() => handleSaveAndApprove(item)}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 transition px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Check size={12} /> Approve & Queue
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── OUTREACH BRAIN ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Brain size={16} className="text-purple-500 animate-pulse" /> The Outreach Brain
          </h3>
          <p className="text-xs text-gray-400">Two editable layers that control what the AI generates. Save both together.</p>
        </div>

        {/* System Prompt */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">🤖 System Prompt <span className="font-normal text-gray-400">(Core AI persona &amp; rules)</span></label>
          <p className="text-xs text-gray-400 mb-2">This defines who the AI is and the hard rules it must follow every time. Edit this to change the pitch angle, tone, or core strategy.</p>
          <textarea
            value={systemPromptText}
            onChange={e => setSystemPromptText(e.target.value)}
            className="w-full border border-purple-200 rounded-lg p-4 text-xs font-mono text-gray-800 bg-purple-50/30 focus:outline-none focus:border-purple-500 min-h-[160px]"
            placeholder="Describe the AI's role and hard rules here..."
          />
        </div>

        {/* Sales Advice */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">📊 Sales Intelligence <span className="font-normal text-gray-400">(Conversion data &amp; patterns)</span></label>
          <p className="text-xs text-gray-400 mb-2">What's working, what's killing conversions, and the best opener patterns. The AI reads this before every message it writes.</p>
          <textarea
            value={adviceText}
            onChange={e => setAdviceText(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-4 text-xs font-mono text-gray-800 bg-gray-50/50 focus:outline-none focus:border-purple-400 min-h-[160px]"
            placeholder="Paste your green/red/pain point analysis here..."
          />
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSaveBrain}
            disabled={savingBrain}
            className="bg-purple-600 text-white hover:bg-purple-700 transition px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save size={14} /> {savingBrain ? 'Saving...' : 'Save AI Brain'}
          </button>
        </div>
      </div>

      {/* ─── BOSS ALERT SETTINGS ─── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3">🚨 Boss Handoff Alert</h3>
        <div className="flex items-center gap-3">
          {editBoss ? (
            <div className="flex gap-2 w-full max-w-md">
              <input
                type="text"
                value={bossUsername}
                onChange={e => setBossUsername(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 flex-1 text-gray-800"
                placeholder="Telegram Username"
              />
              <button onClick={saveBossUsername} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-700">Save</button>
              <button onClick={() => setEditBoss(false)} className="text-gray-400 text-xs px-2">Cancel</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-600">Handoff Alerts send to: <strong className="text-gray-900 font-bold">@{settings?.boss_alert_username || 'None'}</strong></p>
              <button onClick={() => setEditBoss(true)} className="text-xs text-blue-600 hover:underline">Change</button>
            </>
          )}
        </div>
      </div>

      {/* ─── SECTION D: SENT HISTORY ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <History size={16} className="text-gray-500" /> Sent History (Last 50)
          </h3>
        </div>
        <div className="p-5">
          {sentHistory.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No outreach messages sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Prospect</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Sent Message</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sentHistory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">@{item.admin_username}</td>
                      <td className="p-3 text-gray-500">{item.channel_name || '—'}</td>
                      <td className="p-3 text-gray-600 whitespace-pre-wrap max-w-md">{item.edited_message || item.generated_message}</td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full text-[9px]">
                          SENT
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
