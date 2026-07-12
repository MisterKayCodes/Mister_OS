import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Target, Sparkles, Plus, Settings } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getLifeProgress, getLifeTaskDefs, getLifeRewards, logLifeTaskSession, unlockLifeReward } from '../../utils/lifeApi';
import LifeDashboard from './components/LifeDashboard';
import TaskBoard from './components/TaskBoard';
import RewardShop from './components/RewardShop';
import TaskTimerModal from './components/TaskTimerModal';
import EditTaskModal from './components/EditTaskModal';

export default function LifeApp({ onBack, token }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('board'); // 'board', 'shop', 'settings'
  const [progress, setProgress] = useState(null);
  const [taskDefs, setTaskDefs] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timer state
  const [activeTask, setActiveTask] = useState(null); // The task currently being timed

  // Edit/Settings state
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [prog, tDefs, rews] = await Promise.all([
        getLifeProgress(token),
        getLifeTaskDefs(token),
        getLifeRewards(token)
      ]);
      setProgress(prog);
      setTaskDefs(tDefs);
      setRewards(rews);
    } catch (err) {
      showToast("Failed to load Life data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  const handleTaskComplete = async (taskDef, durationMinutes, xpEarned) => {
    try {
      const updatedProgress = await logLifeTaskSession({
        task_def_id: taskDef.id,
        duration_minutes: durationMinutes,
        xp_earned: xpEarned,
        is_completed: true
      }, token);
      setProgress(updatedProgress);
      showToast(`Earned ${xpEarned} XP!`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleStartTimer = (taskDef) => {
    setActiveTask(taskDef);
  };

  const handleCloseTimer = () => {
    setActiveTask(null);
  };

  const handleUnlockReward = async (reward, keyType) => {
    try {
      const updatedProgress = await unlockLifeReward({
        reward_id: reward.id,
        key_type_spent: keyType,
        keys_spent: reward.cost_keys
      }, token);
      setProgress(updatedProgress);
      showToast(`Unlocked ${reward.name}!`, "success");
      // Optionally start a reward timer here if needed
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500 flex items-center gap-2">
            <Clock size={22} className="text-rose-500" /> Life Balance
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('board')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${activeTab === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
          >
            Board
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${activeTab === 'shop' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
          >
            Rewards
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <LifeDashboard progress={progress} />

          {activeTab === 'board' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Today's Tasks</h2>
                <button 
                  onClick={() => { setEditingTask(null); setShowEditModal(true); }}
                  className="flex items-center gap-1 text-sm font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg"
                >
                  <Plus size={16} /> Add Task
                </button>
              </div>
              <TaskBoard 
                taskDefs={taskDefs} 
                onStartTimer={handleStartTimer} 
                onEditTask={(task) => { setEditingTask(task); setShowEditModal(true); }}
                onQuickComplete={(task) => handleTaskComplete(task, 0, task.base_xp)} 
              />
            </div>
          )}

          {activeTab === 'shop' && (
            <RewardShop 
              rewards={rewards} 
              progress={progress}
              onUnlock={handleUnlockReward}
            />
          )}

        </div>
      </div>

      {activeTask && (
        <TaskTimerModal 
          task={activeTask} 
          onClose={handleCloseTimer} 
          onComplete={(duration, xp) => {
            handleTaskComplete(activeTask, duration, xp);
            handleCloseTimer();
          }} 
        />
      )}

      {showEditModal && (
        <EditTaskModal 
          task={editingTask} 
          token={token}
          onClose={() => setShowEditModal(false)} 
          onSaved={() => {
            setShowEditModal(false);
            fetchAll();
          }} 
        />
      )}
    </div>
  );
}
