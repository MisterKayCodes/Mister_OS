// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { Wallet, Plus, Trash2, ArrowDownCircle, X } from 'lucide-react';
import { createWalletApi, deleteWalletApi, depositToWalletApi } from '../../utils/financeApi';
import { useToast } from '../../context/ToastContext';

const TYPE_STYLES = {
  liquid:     { badge: 'bg-green-100 text-green-700', border: 'border-green-200' },
  locked:     { badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  investment: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
};

const WALLET_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];

export default function WalletsTab({ wallets, setWallets, formatNGN, token }) {
  const [showForm, setShowForm] = useState(false);
  const [depositTarget, setDepositTarget] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [form, setForm] = useState({ name: '', type: 'liquid', color: WALLET_COLORS[0], balance: '' });
  const { showToast } = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const w = await createWalletApi({ ...form, balance: parseInt(form.balance) || 0 }, token);
      setWallets([...wallets, w]);
      setForm({ name: '', type: 'liquid', color: WALLET_COLORS[0], balance: '' });
      setShowForm(false);
      showToast('Wallet created!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWalletApi(id, token);
      setWallets(wallets.filter(w => w.id !== id));
      showToast('Wallet removed', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositTarget) return;
    try {
      const res = await depositToWalletApi(depositTarget.id, parseInt(depositAmount), token);
      setWallets(wallets.map(w => w.id === depositTarget.id ? { ...w, balance: res.balance } : w));
      setDepositTarget(null);
      setDepositAmount('');
      showToast('Balance updated!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Your Wallets & Pots</h3>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition">
          <Plus size={14} /> Add Wallet
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Wallet name (e.g. Emergency Fund)" className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="liquid">Liquid (Spendable)</option>
              <option value="locked">Locked (CowryRise etc.)</option>
              <option value="investment">Investment</option>
            </select>
            <input type="number" value={form.balance} onChange={e => setForm({...form, balance: e.target.value})} placeholder="Opening balance ₦" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Color:</span>
            {WALLET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm({...form, color: c})} className={`w-6 h-6 rounded-full border-2 transition ${form.color === c ? 'border-black scale-110' : 'border-transparent'}`} style={{ background: c }} />
            ))}
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Create Wallet</button>
        </form>
      )}

      {wallets.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <Wallet size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No wallets yet. Create your first pot!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map(w => {
          const styles = TYPE_STYLES[w.type] || TYPE_STYLES.liquid;
          return (
            <div key={w.id} className={`bg-white rounded-2xl border p-5 shadow-sm relative overflow-hidden ${styles.border}`}>
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: w.color }} />
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-800">{w.name}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}>{w.type}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setDepositTarget(w)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition" title="Update balance"><ArrowDownCircle size={16} /></button>
                  <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatNGN(w.balance)}</p>
            </div>
          );
        })}
      </div>

      {depositTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Update Balance: {depositTarget.name}</h3>
              <button onClick={() => setDepositTarget(null)}><X size={18} /></button>
            </div>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Enter amount (₦)" className="w-full border border-gray-200 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            <button onClick={handleDeposit} className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Update Balance</button>
          </div>
        </div>
      )}
    </div>
  );
}
