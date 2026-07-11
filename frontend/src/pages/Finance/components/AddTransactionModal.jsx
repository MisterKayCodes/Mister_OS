import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function AddTransactionModal({ wallets, onClose, onSubmit, initial = null }) {
  const isEdit = !!initial;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: initial?.type || 'expense',
    amount_naira: initial?.amount_naira || '',
    description: initial?.description || '',
    category: initial?.category || '',
    tags: initial?.tags || '',
    time: initial?.time || '',
    wallet_id: initial?.wallet_id || (wallets.length > 0 ? wallets[0].id : ''),
    date: initial?.date ? new Date(initial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      ...form,
      amount_naira: parseInt(form.amount_naira),
      category: form.category || 'uncategorized',
      date: new Date(form.date).toISOString()
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type segmented control */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {['expense', 'income', 'save'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition ${
                  form.type === t ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-[2]">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Amount (₦)</label>
              <input 
                type="number" required min="1"
                value={form.amount_naira} onChange={e => setForm({...form, amount_naira: e.target.value})}
                placeholder="e.g. 5000"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Time</label>
              <input 
                type="text"
                value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                placeholder="3:45 PM"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Description</label>
            <input 
              required
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="What was this for?"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Hashtags (comma separated)</label>
            <input 
              value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
              placeholder="e.g. food, outing"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Wallet</label>
              <select 
                required
                value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">Select...</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
              <input 
                type="date" required
                value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Log Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
