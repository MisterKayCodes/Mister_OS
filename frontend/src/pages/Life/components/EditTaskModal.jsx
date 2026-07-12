import React, { useState } from 'react';
import { X, Trash2, Loader2, Save } from 'lucide-react';
import { createLifeTaskDef, updateLifeTaskDef, deleteLifeTaskDef } from '../../../utils/lifeApi';
import { useToast } from '../../../context/ToastContext';

export default function EditTaskModal({ task, token, onClose, onSaved }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(task || {
    name: '',
    category: 'Work Gate',
    base_xp: 25,
    target_minutes: 25,
    is_timed: true,
    fast_bonus_xp: 0
  });

  const categories = ['Body Floor', 'Work Gate', 'Important', 'Rotation', 'Prospect'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...form,
        base_xp: parseFloat(form.base_xp),
        target_minutes: form.is_timed ? parseInt(form.target_minutes) : null,
        fast_bonus_xp: parseFloat(form.fast_bonus_xp || 0)
      };

      if (task?.id) {
        await updateLifeTaskDef(task.id, payload, token);
        showToast("Task updated", "success");
      } else {
        await createLifeTaskDef(payload, token);
        showToast("Task created", "success");
      }
      onSaved();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? XP earned from it stays.")) return;
    try {
      setDeleting(true);
      await deleteLifeTaskDef(task.id, token);
      showToast("Task deleted", "success");
      onSaved();
    } catch (err) {
      showToast(err.message, "error");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
            <input 
              required
              type="text" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:focus:border-rose-500 transition"
              placeholder="e.g. Code big win"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select 
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:focus:border-rose-500 transition appearance-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <input 
              type="checkbox" 
              id="isTimed"
              checked={form.is_timed}
              onChange={e => setForm({...form, is_timed: e.target.checked})}
              className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
            />
            <label htmlFor="isTimed" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Uses Timer (Has target minutes)
            </label>
          </div>

          {form.is_timed && (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Target Minutes</label>
              <input 
                type="number" 
                required
                min="1"
                value={form.target_minutes}
                onChange={e => setForm({...form, target_minutes: e.target.value})}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:focus:border-rose-500 transition"
                placeholder="e.g. 25"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">Base XP</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.1"
                value={form.base_xp}
                onChange={e => setForm({...form, base_xp: e.target.value})}
                className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 transition text-rose-700 dark:text-rose-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-green-600 dark:text-green-400 mb-1">Fast Bonus XP</label>
              <input 
                type="number" 
                min="0"
                step="0.1"
                value={form.fast_bonus_xp}
                onChange={e => setForm({...form, fast_bonus_xp: e.target.value})}
                className="w-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-2.5 outline-none focus:border-green-500 transition text-green-700 dark:text-green-300 font-bold"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            {task?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="p-3 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition"
              >
                {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              </button>
            ) : <div />}
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold transition shadow-md"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
