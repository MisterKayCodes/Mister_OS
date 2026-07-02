// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { Target, Plus, Trophy, Trash2, CheckCircle } from 'lucide-react';
import { createGoalApi, deleteGoalApi, achieveGoalApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';

export default function GoalsTab({ goals, setGoals, wallets, formatNGN, token }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price_min: '', price_max: '', wallet_id: '' });
  const { showToast } = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        price_min: parseInt(form.price_min),
        price_max: form.price_max ? parseInt(form.price_max) : null,
        wallet_id: form.wallet_id ? parseInt(form.wallet_id) : null,
      };
      const g = await createGoalApi(payload, token);
      setGoals([...goals, g]);
      setForm({ name: '', price_min: '', price_max: '', wallet_id: '' });
      setShowForm(false);
      showToast('Goal added!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleAchieve = async (id) => {
    try {
      await achieveGoalApi(id, token);
      setGoals(goals.map(g => g.id === id ? { ...g, achieved: true } : g));
      showToast('🎉 Goal achieved!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGoalApi(id, token);
      setGoals(goals.filter(g => g.id !== id));
      showToast('Goal removed', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const getProgress = (goal) => {
    if (!goal.wallet_id) return 0;
    const wallet = wallets.find(w => w.id === goal.wallet_id);
    if (!wallet) return 0;
    return Math.min(100, Math.round((wallet.balance / goal.price_min) * 100));
  };

  const getLinkedWallet = (goal) => wallets.find(w => w.id === goal.wallet_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Your Goals</h3>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition">
          <Plus size={14} /> Add Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="What do you want? (e.g. iPhone 16 Pro)" className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          <div className="flex gap-2">
            <input required type="number" value={form.price_min} onChange={e => setForm({...form, price_min: e.target.value})} placeholder="Min price ₦" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <input type="number" value={form.price_max} onChange={e => setForm({...form, price_max: e.target.value})} placeholder="Max price ₦ (optional)" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <select value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})} className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black text-gray-500">
            <option value="">Link a wallet to track progress (optional)</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name} — {w.type}</option>)}
          </select>
          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Save Goal</button>
        </form>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <Target size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No goals yet. Add something you're working towards!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => {
          const progress = getProgress(goal);
          const linkedWallet = getLinkedWallet(goal);
          return (
            <div key={goal.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${goal.achieved ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-800 flex items-center gap-2">
                    {goal.achieved && <Trophy size={15} className="text-amber-500" />}
                    {goal.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatNGN(goal.price_min)}{goal.price_max ? ` – ${formatNGN(goal.price_max)}` : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!goal.achieved && (
                    <button onClick={() => handleAchieve(goal.id)} title="Mark achieved" className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition"><CheckCircle size={16} /></button>
                  )}
                  <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                </div>
              </div>

              {linkedWallet && !goal.achieved && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{linkedWallet.name}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 70 ? 'bg-amber-400' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatNGN(linkedWallet.balance)} saved so far</p>
                </div>
              )}
              {goal.achieved && <p className="text-xs text-green-600 font-medium">✓ Achieved</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
