// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Save, Trash2, Loader2, Plus } from 'lucide-react';
import { deleteTransactionApi, createTransactionApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';
import AddTransactionModal from './AddTransactionModal';
import InsufficientFundsModal from './InsufficientFundsModal';

export default function TransactionsTab({ transactions, wallets, formatNGN, token, fetchAll }) {
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [insufficientFundsError, setInsufficientFundsError] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);

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
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition"
        >
          <Plus size={16} /> Add Transaction
        </button>
      </div>

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
                          <span className="text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">
                            #{tx.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(tx.date).toLocaleDateString()}
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
