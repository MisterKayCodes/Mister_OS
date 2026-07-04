// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect, useRef } from 'react';
import { Target, Plus, Trophy, Trash2, CheckCircle } from 'lucide-react';
import { createGoalApi, deleteGoalApi, achieveGoalApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';

// ── Confetti Piece ─────────────────────────────────────────────────────────
function ConfettiPiece({ color, left, delay, duration, size }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-10px',
        left: `${left}%`,
        width: size,
        height: size,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        animation: `confettiFall ${duration}s ${delay}s ease-in forwards`,
        zIndex: 999,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Confetti Burst ─────────────────────────────────────────────────────────
function ConfettiBurst({ active }) {
  const pieces = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444'][i % 6],
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 1,
      size: `${6 + Math.random() * 8}px`,
    }))
  );

  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.current.map(p => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </div>
  );
}

// ── Milestone label ────────────────────────────────────────────────────────
function getMilestone(progress) {
  if (progress >= 100) return { label: '🎉 Goal Reached! You crushed it!', color: 'text-green-600' };
  if (progress >= 75) return { label: '🔥 Almost there! Final stretch!', color: 'text-amber-600' };
  if (progress >= 50) return { label: '💪 Halfway there! Keep going!', color: 'text-blue-600' };
  if (progress >= 25) return { label: '🚀 Great start! Momentum building!', color: 'text-purple-600' };
  return { label: '✨ Journey started. First step done!', color: 'text-gray-500' };
}

// ── Bar color based on progress ────────────────────────────────────────────
function getBarColor(progress) {
  if (progress >= 100) return 'from-green-400 to-emerald-500';
  if (progress >= 75) return 'from-amber-400 to-orange-500';
  if (progress >= 50) return 'from-blue-400 to-indigo-500';
  return 'from-purple-400 to-violet-500';
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function GoalsTab({ goals, setGoals, wallets, formatNGN, token }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price_min: '', price_max: '', wallet_id: '' });
  const [celebratingId, setCelebratingId] = useState(null);
  const { showToast } = useToast();

  // Inject CSS keyframes once
  useEffect(() => {
    const styleId = 'confetti-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(350px) rotate(720deg); opacity: 0; }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
        @keyframes goalCardPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
      showToast('Goal added! Let's get it 🎯', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleAchieve = async (id) => {
    try {
      await achieveGoalApi(id, token);
      setGoals(goals.map(g => g.id === id ? { ...g, achieved: true } : g));
      setCelebratingId(id);
      setTimeout(() => setCelebratingId(null), 2500);
      showToast('🎉 Goal achieved! You're a legend, Boss!', 'success');
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
            <input required type="number" value={form.price_min} onChange={e => setForm({...form, price_min: e.target.value})} placeholder="Target Price ₦" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
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
          const milestone = getMilestone(progress);
          const barColor = getBarColor(progress);
          const isCelebrating = celebratingId === goal.id;

          return (
            <div
              key={goal.id}
              style={{ animation: isCelebrating ? 'goalCardPop 0.4s ease' : undefined }}
              className={`relative bg-white rounded-2xl border p-5 shadow-sm overflow-hidden transition-all hover:shadow-lg ${
                goal.achieved ? 'border-green-300 bg-gradient-to-br from-green-50/50 to-emerald-50/50' :
                progress >= 75 ? 'border-amber-200' :
                'border-gray-200'
              }`}
            >
              {/* Confetti burst on achievement */}
              <ConfettiBurst active={isCelebrating} />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-800 text-base flex items-center gap-2">
                    {goal.achieved && <Trophy size={16} className="text-amber-500" />}
                    {goal.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatNGN(goal.price_min)}{goal.price_max ? ` – ${formatNGN(goal.price_max)}` : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!goal.achieved && (
                    <button onClick={() => handleAchieve(goal.id)} title="Mark achieved" className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition">
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {linkedWallet && !goal.achieved && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span className="font-medium">{linkedWallet.name}</span>
                    <span className="font-bold text-gray-700">{progress}%</span>
                  </div>

                  {/* Premium animated progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${barColor} shadow-md`}
                      style={{
                        width: `${progress}%`,
                        animation: 'progressFill 1s ease-out forwards',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>

                  {/* Milestone label */}
                  <p className={`text-xs mt-2 font-medium ${milestone.color}`}>{milestone.label}</p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatNGN(linkedWallet.balance)} saved · {formatNGN(Math.max(0, goal.price_min - linkedWallet.balance))} to go
                  </p>
                </div>
              )}

              {goal.achieved && (
                <div className="flex items-center gap-2 mt-2">
                  <Trophy size={14} className="text-amber-500" />
                  <p className="text-xs text-green-600 font-semibold">Achieved! Well done, Boss 🔥</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
