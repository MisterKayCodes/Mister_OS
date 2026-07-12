import React from 'react';
import { Play, Check, Settings2 } from 'lucide-react';

export default function TaskBoard({ taskDefs, onStartTimer, onEditTask, onQuickComplete }) {
  // Group tasks by category
  const grouped = taskDefs.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});

  const categories = ['Body Floor', 'Work Gate', 'Important', 'Rotation', 'Prospect'];

  return (
    <div className="space-y-6">
      {categories.map(cat => {
        const tasks = grouped[cat];
        if (!tasks || tasks.length === 0) return null;

        const isBodyFloor = cat === 'Body Floor';
        const isWorkGate = cat === 'Work Gate';

        return (
          <div key={cat} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className={`px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center ${
              isBodyFloor ? 'bg-blue-50/50 dark:bg-blue-500/5' : 
              isWorkGate ? 'bg-rose-50/50 dark:bg-rose-500/5' : 'bg-gray-50/50 dark:bg-gray-900/50'
            }`}>
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {cat}
              </h3>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {task.name}
                      <button 
                        onClick={() => onEditTask(task)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="Edit task"
                      >
                        <Settings2 size={14} />
                      </button>
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                      {task.is_timed && task.target_minutes ? (
                        <span>⏱️ {task.target_minutes} min</span>
                      ) : null}
                      <span className="text-rose-500 dark:text-rose-400">💎 {task.base_xp} XP</span>
                      {task.fast_bonus_xp > 0 && (
                        <span className="text-green-500">+ {task.fast_bonus_xp} XP Fast Bonus</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.is_timed ? (
                      <button 
                        onClick={() => onStartTimer(task)}
                        className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 transition shadow-sm border border-rose-100 dark:border-rose-500/20"
                        title="Start Timer"
                      >
                        <Play size={18} className="ml-1" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => onQuickComplete(task)}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-green-500 hover:text-white dark:hover:bg-green-500 transition shadow-sm border border-gray-200 dark:border-gray-600"
                        title="Mark Done"
                      >
                        <Check size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
