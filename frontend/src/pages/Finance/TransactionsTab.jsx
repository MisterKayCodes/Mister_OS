// Rule: Max 200 lines per file — split if exceeded
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Save } from 'lucide-react';

export default function TransactionsTab({ transactions, formatNGN }) {
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
            
            <div className="text-right">
              <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : isExpense ? 'text-red-600' : 'text-blue-600'}`}>
                {isIncome ? '+' : '-'}{formatNGN(tx.amount_naira)}
              </p>
              {tx.original_currency !== 'NGN' && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  ({tx.original_amount} {tx.original_currency} @ ₦{tx.exchange_rate})
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
