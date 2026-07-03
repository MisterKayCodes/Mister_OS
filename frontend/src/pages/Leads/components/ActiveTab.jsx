import React from 'react';
import { Bot, MessageSquare, Check, X, AlertTriangle, Users } from 'lucide-react';
import { updateLeadApi, approveDraftApi, deleteDraftApi } from '../../../utils/api';

const COLUMNS = ['Fresh', 'Pitching', 'Follow-up', 'Hot', 'Dead'];

export default function ActiveTab({ leads, drafts, token, onLeadsUpdate, onDraftsUpdate }) {
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
      {COLUMNS.map(status => (
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
                  <div className="flex items-center gap-1">
                    {lead.read_receipt_seen && <span title="Read" className="text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">READ</span>}
                    {lead.follow_up_sent && <span title="Follow-up sent" className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">BUMPED</span>}
                    {!lead.auto_pilot && lead.status !== 'Dead' && (
                      <div title="Handoff Alert"><AlertTriangle size={13} className="text-red-500" /></div>
                    )}
                  </div>
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
                    {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
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
