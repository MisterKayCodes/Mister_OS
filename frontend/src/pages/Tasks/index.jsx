import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, CheckCircle2, Circle, Clock, Trash2, Sun, Moon, Flame, Star, Award, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { getTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../../utils/api';
import { getLifeProgress, getLifeTaskDefs, getLifeRewards, logLifeTaskSession, unlockLifeReward } from '../../utils/lifeApi';
import LifeDashboard from '../Life/components/LifeDashboard';
import TaskBoard from '../Life/components/TaskBoard';
import RewardShop from '../Life/components/RewardShop';
import TaskTimerModal from '../Life/components/TaskTimerModal';
import EditTaskModal from '../Life/components/EditTaskModal';

export default function TasksApp({ token, onBack }) {
  const { showToast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();

  // Tab state: 'life' = XP Board, 'tasks' = One-off Tasks, 'rewards' = Shop
  const [activeTab, setActiveTab] = useState('life');

  // --- Life Board state ---
  const [progress, setProgress] = useState(null);
  const [taskDefs, setTaskDefs] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [lifeLoading, setLifeLoading] = useState(true);
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const [editingLifeTask, setEditingLifeTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // --- One-off Tasks state ---
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // ========================
  //  FETCH FUNCTIONS
  // ========================
  const fetchLifeData = async () => {
    try {
      setLifeLoading(true);
      const [prog, tDefs, rews] = await Promise.all([
        getLifeProgress(token),
        getLifeTaskDefs(token),
        getLifeRewards(token)
      ]);
      setProgress(prog);
      setTaskDefs(tDefs);
      setRewards(rews);
    } catch (err) {
      showToast('Failed to load Life Board data', 'error');
    } finally {
      setLifeLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await getTasksApi(token);
      setTasks(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchLifeData();
    fetchTasks();
  }, [token]);

  // ========================
  //  LIFE BOARD HANDLERS
  // ========================
  const handleTaskComplete = async (taskDef, durationMinutes, xpEarned) => {
    try {
      const updatedProgress = await logLifeTaskSession({
        task_def_id: taskDef.id,
        duration_minutes: durationMinutes,
        xp_earned: xpEarned,
        is_completed: true
      }, token);
      setProgress(updatedProgress);
      showToast(`+${xpEarned} XP earned!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUnlockReward = async (reward, keyType) => {
    try {
      const updatedProgress = await unlockLifeReward({
        reward_id: reward.id,
        key_type_spent: keyType,
        keys_spent: reward.cost_keys
      }, token);
      setProgress(updatedProgress);
      showToast(`Unlocked: ${reward.name}!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ========================
  //  ONE-OFF TASK HANDLERS
  // ========================
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const newT = await createTaskApi(newTaskTitle, token);
      setTasks([newT, ...tasks]);
      setNewTaskTitle('');
      showToast('Task created', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      await updateTaskApi(id, { status: newStatus }, token);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteTaskApi(id, token);
      setTasks(tasks.filter(t => t.id !== id));
      showToast('Task deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const pending = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');

  const tabs = [
    { id: 'life', label: 'Life Board' },
    { id: 'tasks', label: 'One-off' },
    { id: 'rewards', label: 'Rewards' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white p-1">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Task Center</h1>
          </div>
          <button onClick={toggleTheme} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white p-1">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* === LIFE BOARD TAB === */}
          {activeTab === 'life' && (
            lifeLoading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>
            ) : (
              <>
                <LifeDashboard progress={progress} />
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">Today's Habits</h2>
                  <button
                    onClick={() => { setEditingLifeTask(null); setShowEditModal(true); }}
                    className="flex items-center gap-1 text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
                  >
                    <Plus size={16} /> Add Habit
                  </button>
                </div>
                <TaskBoard
                  taskDefs={taskDefs}
                  onStartTimer={setActiveTimerTask}
                  onEditTask={(task) => { setEditingLifeTask(task); setShowEditModal(true); }}
                  onQuickComplete={(task) => handleTaskComplete(task, 0, task.base_xp)}
                />
              </>
            )
          )}

          {/* === ONE-OFF TASKS TAB === */}
          {activeTab === 'tasks' && (
            <>
              <form onSubmit={handleCreate} className="flex gap-3 bg-white dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <input
                  type="text"
                  placeholder="Add a one-off task..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="flex-1 pl-4 pr-2 py-2 text-sm bg-transparent focus:outline-none text-gray-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-50"
                >
                  <Plus size={20} />
                </button>
              </form>

              {tasksLoading ? (
                <div className="text-center text-gray-400 py-10">Loading tasks...</div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                      <Clock size={16} /> Pending ({pending.length})
                    </h3>
                    <div className="space-y-2">
                      {pending.length === 0 ? (
                        <p className="text-sm text-gray-400 italic bg-white dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                          No pending tasks. You're all caught up!
                        </p>
                      ) : (
                        pending.map(task => (
                          <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <button onClick={() => toggleTask(task.id, task.status)} className="text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                <Circle size={24} />
                              </button>
                              <span className="text-gray-800 dark:text-gray-200 font-medium">{task.title}</span>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {done.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Completed ({done.length})
                      </h3>
                      <div className="space-y-2">
                        {done.map(task => (
                          <div key={task.id} className="bg-transparent p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between opacity-60">
                            <div className="flex items-center gap-4">
                              <button onClick={() => toggleTask(task.id, task.status)} className="text-green-500 hover:text-gray-400 transition">
                                <CheckCircle2 size={24} />
                              </button>
                              <span className="text-gray-500 dark:text-gray-400 line-through">{task.title}</span>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 transition p-2">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* === REWARDS TAB === */}
          {activeTab === 'rewards' && (
            <RewardShop
              rewards={rewards}
              progress={progress}
              onUnlock={handleUnlockReward}
            />
          )}

        </div>
      </div>

      {/* Timer full-screen overlay */}
      {activeTimerTask && (
        <TaskTimerModal
          task={activeTimerTask}
          onClose={() => setActiveTimerTask(null)}
          onComplete={(duration, xp) => {
            handleTaskComplete(activeTimerTask, duration, xp);
            setActiveTimerTask(null);
          }}
        />
      )}

      {/* Edit / Create Habit modal */}
      {showEditModal && (
        <EditTaskModal
          task={editingLifeTask}
          token={token}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); fetchLifeData(); }}
        />
      )}
    </div>
  );
}
