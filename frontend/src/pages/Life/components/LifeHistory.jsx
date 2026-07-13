import React from 'react';
import { Calendar, Clock, Star, Zap, Award } from 'lucide-react';

export default function LifeHistory({ sessions, taskDefs }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Calendar size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No History Yet</h3>
        <p className="text-gray-500 max-w-sm">Complete your first habit on the Life Board to start building your personal work diary.</p>
      </div>
    );
  }

  // Group sessions by date string (e.g. "Thu Jul 13 2026")
  const grouped = sessions.reduce((acc, session) => {
    const d = new Date(session.date_logged);
    const dateStr = d.toDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(session);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-8">
      {dates.map(dateStr => {
        const daySessions = grouped[dateStr];
        const isToday = dateStr === new Date().toDateString();
        
        // Calculate total XP for the day
        const dayXp = daySessions.reduce((sum, s) => sum + s.xp_earned, 0);

        return (
          <div key={dateStr} className="relative pl-6 md:pl-8">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 left-[11px] md:left-[15px] w-0.5 bg-gray-200 dark:bg-gray-800"></div>
            
            <div className="relative z-10 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="absolute -left-6 md:-left-8 w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-500/20 border-4 border-white dark:border-gray-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isToday ? "Today" : dateStr}
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg">
                  {dayXp.toFixed(1)} XP
                </span>
              </div>

              <div className="space-y-3">
                {daySessions.map(session => {
                  const tDef = session.task_def || taskDefs.find(t => t.id === session.task_def_id);
                  if (!tDef) return null;

                  const timeStr = new Date(session.date_logged).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={session.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {tDef.category === 'Work Gate' ? <Zap size={16} className="text-indigo-500" /> :
                           tDef.category === 'Body Floor' ? <Star size={16} className="text-blue-500" /> :
                           <Award size={16} className="text-orange-500" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{tDef.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                            <span>{tDef.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {timeStr}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end md:self-auto">
                        {session.duration_minutes > 0 && (
                          <span className="text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                            {session.duration_minutes} min
                          </span>
                        )}
                        <span className="text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">
                          +{session.xp_earned} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
