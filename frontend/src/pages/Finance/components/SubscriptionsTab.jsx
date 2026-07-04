import React, { useState } from 'react';
import { Calendar, Plus, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { createSubscriptionApi, deleteSubscriptionApi, paySubscriptionApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';

export default function SubscriptionsTab({ subscriptions, setSubscriptions, formatNGN, token }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', cycle: 'monthly', next_due_date: '' });
  const { showToast } = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        amount: parseInt(form.amount),
        cycle: form.cycle,
        next_due_date: new Date(form.next_due_date).toISOString(),
        wallet_id: null,
        auto_deduct: false
      };
      const sub = await createSubscriptionApi(payload, token);
      setSubscriptions([...subscriptions, sub].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)));
      setForm({ name: '', amount: '', cycle: 'monthly', next_due_date: '' });
      setShowForm(false);
      showToast('Subscription added!', 'success');
    } catch (err) { 
      showToast(err.message, 'error'); 
    }
  };

  const handlePay = async (id) => {
    try {
      const updatedSub = await paySubscriptionApi(id, token);
      setSubscriptions(subscriptions.map(s => s.id === id ? updatedSub : s).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)));
      showToast('Marked as paid! Next due date updated.', 'success');
    } catch (err) { 
      showToast(err.message, 'error'); 
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubscriptionApi(id, token);
      setSubscriptions(subscriptions.filter(s => s.id !== id));
      showToast('Subscription removed', 'success');
    } catch (err) { 
      showToast(err.message, 'error'); 
    }
  };

  const getDaysUntilDue = (dateString) => {
    const due = new Date(dateString);
    const now = new Date();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Subscriptions & Recurring Bills</h3>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition">
          <Plus size={14} /> Add Bill
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Bill Name (e.g. Netflix, Airtel Data)" className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          <div className="flex gap-2">
            <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount ₦" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <select value={form.cycle} onChange={e => setForm({...form, cycle: e.target.value})} className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 ml-1">Next Due Date</label>
            <input required type="date" value={form.next_due_date} onChange={e => setForm({...form, next_due_date: e.target.value})} className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition mt-2">Save Bill</button>
        </form>
      )}

      {subscriptions.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No subscriptions added. Track your recurring expenses here!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscriptions.map(sub => {
          const daysUntil = getDaysUntilDue(sub.next_due_date);
          const isOverdue = daysUntil < 0;
          const isDueSoon = daysUntil >= 0 && daysUntil <= 3;
          
          return (
            <div key={sub.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-red-300 bg-red-50/20' : isDueSoon ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-800 text-lg">{sub.name}</p>
                  <p className="text-sm text-gray-500 font-medium">
                    {formatNGN(sub.amount)} <span className="text-xs font-normal text-gray-400 capitalize">/ {sub.cycle}</span>
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex justify-between items-end mt-2 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className={isOverdue ? "text-red-500" : isDueSoon ? "text-amber-500" : "text-blue-400"} />
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold ${isOverdue ? "text-red-500" : isDueSoon ? "text-amber-500" : "text-gray-500"}`}>
                      {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : daysUntil === 0 ? "Due Today" : `Due in ${daysUntil} days`}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(sub.next_due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handlePay(sub.id)} 
                  className="text-xs bg-gray-100 hover:bg-black hover:text-white text-gray-700 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
                >
                  <CheckCircle size={14} /> Mark Paid
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
