import React from 'react';
import { Shield, Edit2 } from 'lucide-react';

export default function BossAlertSetting({ settings, editBoss, setEditBoss, bossUsername, setBossUsername, saveBossUsername }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-500" />
          <h3 className="font-semibold text-gray-800 text-sm">Boss Alert Account</h3>
        </div>
        <button onClick={() => setEditBoss(!editBoss)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
          <Edit2 size={12} /> Edit
        </button>
      </div>
      {editBoss ? (
        <div className="flex gap-2">
          <input value={bossUsername} onChange={e => setBossUsername(e.target.value)} placeholder="e.g. opozdal96"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
          <button onClick={saveBossUsername} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">Save</button>
        </div>
      ) : (
        <p className="text-sm font-bold text-gray-800">@{settings?.boss_alert_username || 'Not set'}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">Handoff alerts and buy signals are forwarded to this account.</p>
    </div>
  );
}
