// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Save, Trash2, Loader2 } from 'lucide-react';
import { deleteTransactionApi } from '../../../utils/financeApi';
import { useToast } from '../../../context/ToastContext';

export default function TransactionsTab({ transactions, formatNGN, token, fetchAll }) {
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteTransactionApi(id, token);
      showToast("Transaction deleted successfully", "success");
      if (fetchAll) await fetchAll(); // Refresh overview and transactions
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return <div className="text-gray-400 text-sm p-4 bg-white rounded-xl border border-gray-100">No transactions logged yet. Use /spend, /income, or /save in your notes!</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {transactions.map((tx, idx) => {
        const isExpense = tx.type === 'expense';
        const isIncome = tx.type === 'income';
        const isSave = tx.type === 'save';
        
        return (
          <div key={tx.id} className={`flex items-center justify-between p-4 ${idx !== transactions.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isIncome ? 'bg-green-100 text-green-600' : isExpense ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {isIncome ? <ArrowDownRight size={18} /> : isExpense ? <ArrowUpRight size={18} /> : <Save size={18} />}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
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
                <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : isExpense ? 'text-red-600' : 'text-blue-600'}`}>
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
                className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition disabled:opacity-50"
                title="Delete transaction"
              >
                {deletingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
