import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import { createLoanApi, payLoanApi, deleteLoanApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';
import { X } from 'lucide-react';

function AddLoanModal({ wallets, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    principal_amount: '',
    repayment_amount: '',
    payment_type: 'one-time',
    installments_count: 1,
    due_date: new Date().toISOString().split('T')[0],
    wallet_id: wallets.length > 0 ? wallets[0].id : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      ...form,
      principal_amount: parseInt(form.principal_amount),
      repayment_amount: parseInt(form.repayment_amount),
      installments_count: parseInt(form.installments_count),
      date: new Date(form.due_date).toISOString()
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white">Add Loan / Liability</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Car Loan, Owe John" className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Principal (Received) ₦</label>
              <input type="number" required min="0" value={form.principal_amount} onChange={e => setForm({...form, principal_amount: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Repayment (Total) ₦</label>
              <input type="number" required min="1" value={form.repayment_amount} onChange={e => setForm({...form, repayment_amount: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {['one-time', 'installments'].map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, payment_type: t })} className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition ${form.payment_type === t ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>{t}</button>
            ))}
          </div>

          {form.payment_type === 'installments' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Number of Installments</label>
              <input type="number" required min="2" value={form.installments_count} onChange={e => setForm({...form, installments_count: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Deposit Into Wallet</label>
              <select required value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none">
                <option value="">Select...</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Due Date</label>
              <input type="date" required value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg text-sm font-bold mt-2 flex justify-center items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />} Save Loan
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoansTab({ loans = [], wallets = [], formatNGN, token, fetchAll }) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionId, setActionId] = useState(null);

  const activeLoans = loans.filter(l => !l.settled);
  const settledLoans = loans.filter(l => l.settled);

  const handleAddLoan = async (data) => {
    try {
      await createLoanApi(data, token);
      showToast("Loan created successfully", "success");
      setShowAddModal(false);
      if (fetchAll) await fetchAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handlePay = async (id) => {
    try {
      setActionId(`pay-${id}`);
      await payLoanApi(id, token);
      showToast("Payment recorded successfully", "success");
      if (fetchAll) await fetchAll();
    } catch (err) {
      showToast(err.message || "Failed to process payment", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionId(`del-${id}`);
      await deleteLoanApi(id, token);
      showToast("Loan deleted", "success");
      if (fetchAll) await fetchAll();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition">
          <Plus size={16} /> Add Loan
        </button>
      </div>

      {activeLoans.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-3">Active Loans</h3>
          <div className="grid gap-4">
            {activeLoans.map(loan => {
              const progress = Math.min((loan.amount_paid / loan.repayment_amount) * 100, 100);
              const isPaying = actionId === `pay-${loan.id}`;
              const isDeleting = actionId === `del-${loan.id}`;
              
              return (
                <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{loan.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> Due: {new Date(loan.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 dark:text-orange-500">{formatNGN(loan.repayment_amount - loan.amount_paid)} left</p>
                      <p className="text-[10px] text-gray-400">Total: {formatNGN(loan.repayment_amount)}</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                    <span>{formatNGN(loan.amount_paid)} paid</span>
                    <span>{loan.payment_type === 'installments' ? `${loan.installments_count} Installments` : 'One-time'}</span>
                  </div>
                  
                  <div className="mt-5 flex gap-2 justify-end">
                    <button disabled={isDeleting} onClick={() => handleDelete(loan.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                    <button disabled={isPaying} onClick={() => handlePay(loan.id)} className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition text-sm">
                      {isPaying ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />} Make Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {settledLoans.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-3">Settled</h3>
          <div className="grid gap-3 opacity-70">
            {settledLoans.map(loan => (
              <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex justify-center items-center"><CheckCircle size={16}/></div>
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{loan.title}</p>
                    <p className="text-xs text-gray-500">{formatNGN(loan.repayment_amount)} paid in full</p>
                  </div>
                </div>
                <button disabled={actionId === `del-${loan.id}`} onClick={() => handleDelete(loan.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loans.length === 0 && (
        <div className="text-gray-400 text-sm p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">No loans or liabilities tracked.</div>
      )}

      {showAddModal && <AddLoanModal wallets={wallets} onClose={() => setShowAddModal(false)} onSubmit={handleAddLoan} />}
    </div>
  );
}
