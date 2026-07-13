import React, { useState } from 'react';
import { X, Trash2, Loader2, Save } from 'lucide-react';
import { createLifeReward, deleteLifeReward } from '../../../utils/lifeApi';
import { useToast } from '../../../context/ToastContext';

export default function EditRewardModal({ reward, token, onClose, onSaved }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(reward || {
    name: '',
    key_type: 'Silver',
    cost_keys: 1,
    session_minutes: 30
  });

  const keyTypes = ['Silver', 'Gold', 'Platinum'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...form,
        cost_keys: parseInt(form.cost_keys),
        session_minutes: parseInt(form.session_minutes)
      };

      if (reward?.id) {
        // Update is not implemented yet in backend, but we can do it later if needed.
        // For now we just create/delete. To update, user can delete and recreate.
        showToast("Updates not supported yet. Delete and recreate.", "info");
      } else {
        await createLifeReward(payload, token);
        showToast("Reward created!", "success");
        onSaved();
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reward?")) return;
    try {
      setDeleting(true);
      await deleteLifeReward(reward.id, token);
      showToast("Reward deleted", "success");
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
            {reward ? 'Edit Reward' : 'New Reward'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Reward Name</label>
            <input 
              required
              type="text" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:focus:border-rose-500 transition"
              placeholder="e.g. Play God of War"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Key Type Needed</label>
            <select 
              value={form.key_type}
              onChange={e => setForm({...form, key_type: e.target.value})}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:focus:border-rose-500 transition appearance-none"
            >
              {keyTypes.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cost (Keys)</label>
              <input 
                type="number" 
                required
                min="1"
                value={form.cost_keys}
                onChange={e => setForm({...form, cost_keys: e.target.value})}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 transition font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Session Minutes</label>
              <input 
                type="number" 
                required
                min="1"
                value={form.session_minutes}
                onChange={e => setForm({...form, session_minutes: e.target.value})}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 transition font-bold"
                placeholder="e.g. 60"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            {reward?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="p-3 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition"
              >
                {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              </button>
            ) : <div />}
            
            {!reward?.id && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold transition shadow-md"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Create Reward
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
