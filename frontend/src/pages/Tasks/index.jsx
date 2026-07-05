import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../../utils/api';

export default function TasksApp({ token, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasksApi(token);
      setTasks(res);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const newT = await createTaskApi(newTaskTitle, token);
      setTasks([newT, ...tasks]);
      setNewTaskTitle("");
      showToast("Task created", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      await updateTaskApi(id, { status: newStatus }, token);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteTaskApi(id, token);
      setTasks(tasks.filter(t => t.id !== id));
      showToast("Task deleted", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const pending = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f9]">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shrink-0 gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-black"><ChevronLeft size={22} /></button>
        <h2 className="font-semibold text-gray-800 text-lg">Task Center</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        {/* Create Task */}
        <form onSubmit={handleCreate} className="mb-8 flex gap-3 bg-white p-2 rounded-full border border-gray-200 shadow-sm">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            className="flex-1 pl-4 pr-2 py-2 text-sm bg-transparent focus:outline-none text-gray-800"
          />
          <button type="submit" disabled={!newTaskTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-50">
            <Plus size={20} />
          </button>
        </form>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading tasks...</div>
        ) : (
          <div className="space-y-8">
            {/* Pending Tasks */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <Clock size={16} /> In Progress / Pending ({pending.length})
              </h3>
              <div className="space-y-2">
                {pending.length === 0 ? (
                  <p className="text-sm text-gray-400 italic bg-white p-4 rounded-xl border border-dashed border-gray-200 text-center">No pending tasks. You're all caught up!</p>
                ) : (
                  pending.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleTask(task.id, task.status)} className="text-gray-300 hover:text-indigo-600 transition">
                          <Circle size={24} />
                        </button>
                        <span className="text-gray-800 font-medium">{task.title}</span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Tasks */}
            {done.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Completed ({done.length})
                </h3>
                <div className="space-y-2">
                  {done.map(task => (
                    <div key={task.id} className="bg-transparent p-4 rounded-xl border border-gray-200 flex items-center justify-between opacity-60">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleTask(task.id, task.status)} className="text-green-500 hover:text-gray-400 transition">
                          <CheckCircle2 size={24} />
                        </button>
                        <span className="text-gray-500 line-through">{task.title}</span>
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
      </div>
    </div>
  );
}
