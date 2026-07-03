import React from 'react';

export default function StatsCards({ stats }) {
  return (
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
  );
}
