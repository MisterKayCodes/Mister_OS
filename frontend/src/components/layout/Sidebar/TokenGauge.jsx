import React from 'react';

export default function TokenGauge({ stats }) {
  if (!stats) return null;

  return (
    <div className="px-4 py-3 border-t border-[#e0e0e0] bg-white shrink-0 group relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
          Token Budget
        </span>
        <span className="text-[10px] font-medium text-gray-600">{stats.percent_used}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            stats.percent_used > 80 ? 'bg-red-500' : stats.percent_used > 50 ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(stats.percent_used, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-gray-400 text-center">
        {Math.round(stats.daily_total / 1000)}k / {Math.round(stats.daily_limit / 1000)}k today
      </div>

      {stats.by_task?.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="font-medium mb-1 border-b border-gray-700 pb-1">Usage Breakdown</div>
          {stats.by_task.slice(0, 4).map(t => (
            <div key={t.task} className="flex justify-between py-0.5">
              <span className="text-gray-300">{t.task}</span>
              <span>{t.tokens.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}