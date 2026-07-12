import React from 'react';
import { Flame, Star, Award, Zap } from 'lucide-react';

export default function LifeDashboard({ progress }) {
  if (!progress) return null;

  // Calculate progress to next milestone
  // Milestones: 60 (Silver), 120 (Gold), 240 (Platinum)
  const currentXp = progress.total_xp;
  const nextMilestone = Math.ceil((currentXp + 0.1) / 60) * 60; 
  const prevMilestone = Math.floor(currentXp / 60) * 60;
  
  const percentage = ((currentXp - prevMilestone) / 60) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Experience</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{currentXp.toFixed(1)}</span>
            <span className="text-lg font-bold text-gray-500">XP</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-500/20">
          <Flame size={18} className="text-orange-500" />
          <span className="font-bold text-orange-600 dark:text-orange-400">{progress.current_streak} Day Streak</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
          <span>{prevMilestone} XP</span>
          <span>{nextMilestone} XP</span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
        <p className="text-center text-xs text-gray-400 mt-2 font-medium">
          {(nextMilestone - currentXp).toFixed(1)} XP to next Key!
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Star size={20} className="text-gray-500" />
          </div>
          <span className="text-xl font-black">{progress.silver_keys}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-1">Silver</span>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl flex flex-col items-center justify-center border border-amber-100 dark:border-amber-500/20">
          <div className="w-10 h-10 bg-amber-200 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Award size={20} className="text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{progress.gold_keys}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 mt-1">Gold</span>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
          <div className="w-10 h-10 bg-indigo-200 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Zap size={20} className="text-indigo-500" />
          </div>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{progress.platinum_keys}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 mt-1">Platinum</span>
        </div>
      </div>
    </div>
  );
}
