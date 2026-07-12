// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Save, Trash2, Loader2, Plus, Zap } from 'lucide-react';
import { deleteTransactionApi, createTransactionApi, getTransactionTemplates, createTransactionTemplateApi, deleteTransactionTemplateApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';
import AddTransactionModal from './AddTransactionModal';
import AddTransactionTemplateModal from './AddTransactionTemplateModal';
import InsufficientFundsModal from './InsufficientFundsModal';

export default function TransactionsTab({ transactions, wallets, formatNGN, token, fetchAll }) {
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [insufficientFundsError, setInsufficientFundsError] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await getTransactionTemplates(token);
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddTemplate = async (data) => {
    try {
      await createTransactionTemplateApi(data, token);
      showToast("Template saved!", "success");
      setShowTemplateModal(false);
      loadTemplates();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation();
    try {
      setDeletingTemplateId(id);
      await deleteTransactionTemplateApi(id, token);
      showToast("Template deleted", "success");
      loadTemplates();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const applyTemplate = async (tmpl) => {
    try {
      const data = {
        type: tmpl.type,
        amount_naira: tmpl.amount_naira,
        description: tmpl.description,
        category: tmpl.category,
        tags: tmpl.tags || "",
        wallet_id: tmpl.wallet_id || (wallets.length > 0 ? wallets[0].id : null),
        date: new Date().toISOString()
      };
      if (!data.wallet_id) throw new Error("No wallet available to log this transaction");
      
      await handleAddTransaction(data);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteTransactionApi(id, token);
      showToast("Transaction deleted successfully", "success");
      if (fetchAll) await fetchAll();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddTransaction = async (data) => {
    try {
      await createTransactionApi(data, token);
      showToast("Transaction logged!", "success");
      setShowAddModal(false);
      if (fetchAll) await fetchAll();
    } catch (err) {
      if (err.status === 400 && err.data?.error === "insufficient_funds") {
        setPendingTransaction(data);
        setInsufficientFundsError(err.data);
      } else {
        showToast(err.data?.detail || err.message || "Failed to log transaction", "error");
      }
    }
  };

  const handleAlternativeWalletSelect = async (walletId) => {
    if (!pendingTransaction) return;
    const newData = { ...pendingTransaction, wallet_id: walletId };
    setInsufficientFundsError(null);
    await handleAddTransaction(newData);
  };

  const handleEditTransaction = async (data) => {
    try {
      // We need updateTransactionApi from financeApi
      const { updateTransactionApi } = await import('../../../utils/financeApi');
      await updateTransactionApi(editingTransaction.id, data, token);
      showToast("Transaction updated!", "success");
      setEditingTransaction(null);
      if (fetchAll) await fetchAll();
    } catch (err) {
      showToast(err.data?.detail || err.message || "Failed to update transaction", "error");
    }
  };

  // 1. Sort transactions by date descending
  const sortedTxs = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 2. Group by Month-Year and calculate totals
  const grouped = sortedTxs.reduce((acc, tx) => {
    const d = new Date(tx.date);
    const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        label: monthYear,
        transactions: [],
        moneyIn: 0,
        moneyOut: 0
      };
    }
    
    acc[monthYear].transactions.push(tx);
    if (tx.type === 'income') acc[monthYear].moneyIn += tx.amount_naira;
    if (tx.type === 'expense') acc[monthYear].moneyOut += tx.amount_naira;
    // Note: 'save' type just moves money to savings, not necessarily "out" of net worth, but leaving it neutral here as requested
    
    return acc;
  }, {});

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Zap size={16} /> New Quick Action
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition"
          >
            <Plus size={16} /> Add 
          </button>
        </div>
      </div>

      {templates.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {templates.map(tmpl => {
            const isExpense = tmpl.type === 'expense';
            const isIncome = tmpl.type === 'income';
            
            return (
              <button
                key={tmpl.id}
                onClick={() => applyTemplate(tmpl)}
                className={`relative flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border transition-all text-left group hover:scale-105 active:scale-95 ${
                  isExpense ? 'bg-red-50/50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20' 
                  : isIncome ? 'bg-green-50/50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20'
                  : 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isIncome ? 'bg-green-100 dark:bg-green-500/30 text-green-600 dark:text-green-400' 
                  : isExpense ? 'bg-red-100 dark:bg-red-500/30 text-red-600 dark:text-red-400' 
                  : 'bg-blue-100 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400'
                }`}>
                  <Zap size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{tmpl.title}</p>
                  <p className={`text-xs font-medium ${isExpense ? 'text-red-600 dark:text-red-400' : isIncome ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {isIncome ? '+' : '-'}{formatNGN(tmpl.amount_naira)}
                  </p>
                </div>
                <div 
                  onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                  className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 cursor-pointer"
                >
                  {deletingTemplateId === tmpl.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-gray-400 text-sm p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">No transactions logged yet.</div>
      ) : (
        Object.values(grouped).map((group, gIdx) => (
          <div key={group.label} className="flex flex-col gap-3">
            {/* Month Header */}
            <div className="px-1">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{group.label}</h3>
              <div className="flex gap-4 mt-1 text-xs font-medium">
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><ArrowDownRight size={14}/> Money in: {formatNGN(group.moneyIn)}</span>
                <span className="text-red-500 dark:text-red-400 flex items-center gap-1"><ArrowUpRight size={14}/> Money out: {formatNGN(group.moneyOut)}</span>
              </div>
            </div>
            
            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {group.transactions.map((tx, idx) => {
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                const isSave = tx.type === 'save';
                
                return (
                  <div key={tx.id} className={`flex items-center justify-between p-4 ${idx !== group.transactions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : isExpense ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isIncome ? <ArrowDownRight size={18} /> : isExpense ? <ArrowUpRight size={18} /> : <Save size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.category && tx.category !== 'uncategorized' && (
                            <span className="text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">
                              #{tx.category}
                            </span>
                          )}
                          {tx.tags && tx.tags.split(',').map(tag => (
                            <span key={tag} className="text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-opacity-80">
                              #{tag.trim()}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400 ml-1">
                            {new Date(tx.date).toLocaleDateString('en-GB')} {tx.time && <span className="ml-1 text-[10px]">{tx.time}</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center justify-end gap-3">
                      <div>
                        <p className={`font-bold text-sm ${isIncome ? 'text-green-600 dark:text-green-400' : isExpense ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {isIncome ? '+' : '-'}{formatNGN(tx.amount_naira)}
                        </p>
                        {tx.original_currency !== 'NGN' && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            ({tx.original_amount} {tx.original_currency} @ ₦{tx.exchange_rate})
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => setEditingTransaction(tx)} 
                        className="p-1.5 text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition"
                        title="Edit transaction"
                      >
                        <ArrowUpRight size={16} className="rotate-45" /> {/* Using as edit icon placeholder, or import Pencil */}
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)} 
                        disabled={deletingId === tx.id}
                        className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition disabled:opacity-50"
                        title="Delete transaction"
                      >
                        {deletingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showAddModal && (
        <AddTransactionModal 
          wallets={wallets}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTransaction}
        />
      )}

      {showTemplateModal && (
        <AddTransactionTemplateModal
          wallets={wallets}
          onClose={() => setShowTemplateModal(false)}
          onSubmit={handleAddTemplate}
        />
      )}

      {editingTransaction && (
        <AddTransactionModal 
          wallets={wallets}
          onClose={() => setEditingTransaction(null)}
          onSubmit={handleEditTransaction}
          initial={editingTransaction}
        />
      )}

      {insufficientFundsError && (
        <InsufficientFundsModal 
          errorData={insufficientFundsError}
          onClose={() => setInsufficientFundsError(null)}
          onSelectAlternative={handleAlternativeWalletSelect}
        />
      )}
    </div>
  );
}
