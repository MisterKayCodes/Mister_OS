import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, Trash2, Loader2, ArrowUpRight, Pencil } from 'lucide-react';
import { createLoanApi, payLoanApi, deleteLoanApi, updateLoanApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';
import { X } from 'lucide-react';

function LoanFormModal({ wallets, onClose, onSubmit, initial = null }) {
  const isEdit = !!initial;
  const [loading, setLoading] = useState(false);

  const defaultInstallment = { amount_due: '', due_date: new Date().toISOString().split('T')[0] };

  const getInitialInstallments = () => {
    if (initial?.installments?.length > 0) {
      return initial.installments.map(i => ({
        amount_due: i.amount_due,
        due_date: i.due_date ? new Date(i.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    }
    return [{ ...defaultInstallment }];
  };

  const [form, setForm] = useState({
    title: initial?.title || '',
    principal_amount: initial?.principal_amount || '',
    repayment_amount: initial?.repayment_amount || '',
    payment_type: initial?.payment_type || 'one-time',
    wallet_id: initial?.wallet_id || (wallets.length > 0 ? wallets[0].id : '')
  });

  const [installments, setInstallments] = useState(getInitialInstallments);

  const handleInstallmentChange = (idx, field, value) => {
    const newInst = [...installments];
    newInst[idx][field] = value;
    setInstallments(newInst);
  };

  const addInstallment = () => {
    setInstallments([...installments, { ...defaultInstallment }]);
  };

  const removeInstallment = (idx) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const parsedInstallments = installments.map(i => ({
      amount_due: parseInt(i.amount_due) || 0,
      due_date: new Date(i.due_date).toISOString()
    }));

    const repAmt = parseInt(form.repayment_amount);

    if (form.payment_type === 'installments') {
      const total = parsedInstallments.reduce((acc, curr) => acc + curr.amount_due, 0);
      if (total !== repAmt) {
        alert(`Installment amounts (₦${total.toLocaleString()}) must add up to total repayment (₦${repAmt.toLocaleString()})`);
        setLoading(false);
        return;
      }
    }

    await onSubmit({
      ...form,
      principal_amount: parseInt(form.principal_amount),
      repayment_amount: repAmt,
      wallet_id: parseInt(form.wallet_id) || null,
      installments: form.payment_type === 'installments' ? parsedInstallments : [parsedInstallments[0]]
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Loan' : 'Add Loan / Liability'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. PalmPay Loan" className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
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

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Deposit Into Wallet</label>
            <select value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none">
              <option value="">None</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {['one-time', 'installments'].map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, payment_type: t })} className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition ${form.payment_type === t ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>{t}</button>
            ))}
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
            {form.payment_type === 'installments' ? (
              <>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-gray-500">Installments Schedule</label>
                  <button type="button" onClick={addInstallment} className="text-xs font-bold text-blue-500 flex items-center gap-1"><Plus size={12}/> Add Row</button>
                </div>
                {form.repayment_amount && (
                  <p className="text-xs text-gray-400">
                    Remaining to allocate: ₦{(parseInt(form.repayment_amount) - installments.reduce((a,i) => a + (parseInt(i.amount_due)||0), 0)).toLocaleString()}
                  </p>
                )}
                {installments.map((inst, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                    <input type="date" required value={inst.due_date} onChange={e => handleInstallmentChange(idx, 'due_date', e.target.value)} className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-xs outline-none" />
                    <input type="number" required placeholder="Amount ₦" value={inst.amount_due} onChange={e => handleInstallmentChange(idx, 'amount_due', e.target.value)} className="w-28 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-xs outline-none" />
                    {installments.length > 1 && (
                      <button type="button" onClick={() => removeInstallment(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Due Date</label>
                <input type="date" required value={installments[0]?.due_date || ''} onChange={e => handleInstallmentChange(0, 'due_date', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none" />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg text-sm font-bold mt-2 flex justify-center items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />} {isEdit ? 'Save Changes' : 'Save Loan'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoansTab({ loans = [], wallets = [], formatNGN, token, fetchAll }) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
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

  const handleEditLoan = async (data) => {
    try {
      await updateLoanApi(editingLoan.id, data, token);
      showToast("Loan updated successfully", "success");
      setEditingLoan(null);
      if (fetchAll) await fetchAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handlePay = async (id, installmentId = null) => {
    try {
      const actId = installmentId ? `pay-${id}-${installmentId}` : `pay-${id}`;
      setActionId(actId);
      await payLoanApi(id, installmentId, token);
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
              const hasInstallments = Array.isArray(loan.installments) && loan.installments.length > 0;
              const firstDue = hasInstallments ? loan.installments[0].due_date : null;

              return (
                <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{loan.title}</h4>
                      {loan.payment_type === 'one-time' && firstDue && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={12}/> Due: {new Date(firstDue).toLocaleDateString()}
                        </p>
                      )}
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
                    <span>{loan.payment_type === 'installments' ? `${hasInstallments ? loan.installments.length : 0} Installments` : 'One-time'}</span>
                  </div>

                  {loan.payment_type === 'installments' && (
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Installment Schedule</p>
                      {hasInstallments ? (
                        <div className="space-y-2">
                          {loan.installments.map((inst, idx) => {
                            const isPayingInst = actionId === `pay-${loan.id}-${inst.id}`;
                            return (
                              <div key={inst.id || idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                  {inst.status === 'paid' ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-orange-400" />}
                                  <span className={inst.status === 'paid' ? 'text-gray-400 line-through text-xs' : 'text-gray-700 dark:text-gray-300 text-xs'}>
                                    {new Date(inst.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-sm">{formatNGN(inst.amount_due)}</span>
                                  {inst.status !== 'paid' && (
                                    <button disabled={isPayingInst} onClick={() => handlePay(loan.id, inst.id)} className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded hover:bg-orange-200 transition flex items-center gap-1">
                                      {isPayingInst ? <Loader2 size={12} className="animate-spin" /> : 'Pay'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-orange-400 italic">No installments set — click Edit to add them.</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2 justify-end">
                    <button onClick={() => setEditingLoan(loan)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button disabled={isDeleting} onClick={() => handleDelete(loan.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                    {loan.payment_type !== 'installments' && (
                      <button disabled={isPaying} onClick={() => handlePay(loan.id)} className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition text-sm">
                        {isPaying ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />} Make Payment
                      </button>
                    )}
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

      {showAddModal && <LoanFormModal wallets={wallets} onClose={() => setShowAddModal(false)} onSubmit={handleAddLoan} />}
      {editingLoan && <LoanFormModal wallets={wallets} onClose={() => setEditingLoan(null)} onSubmit={handleEditLoan} initial={editingLoan} />}
    </div>
  );
}
