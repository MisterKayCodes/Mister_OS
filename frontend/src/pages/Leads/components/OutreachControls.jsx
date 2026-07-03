import React from 'react';
import { Zap } from 'lucide-react';

export default function OutreachControls({ stats, settings, templates, handleStart, handleStop }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-md transition-colors ${stats?.outreach_active ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-700 to-gray-900'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Zap size={20} className={stats?.outreach_active ? "text-yellow-300" : "text-gray-400"} />
            {stats?.outreach_active ? "Outreach is RUNNING" : "Outreach is STOPPED"}
          </h3>
          {stats?.outreach_active && stats?.next_run ? (
            <p className="text-green-100 text-xs mt-1">Next message sending around {new Date(stats.next_run).toLocaleTimeString()}</p>
          ) : (
            <p className="text-gray-300 text-xs mt-1">Random delay: {settings?.min_delay_minutes}–{settings?.max_delay_minutes} min between messages</p>
          )}
        </div>
        <div>
          {stats?.outreach_active ? (
            <button onClick={handleStop} className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 shadow-sm transition">Stop Worker</button>
          ) : (
            <button onClick={handleStart} disabled={templates.length === 0} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-400 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">▶ Start</button>
          )}
        </div>
      </div>
    </div>
  );
}
