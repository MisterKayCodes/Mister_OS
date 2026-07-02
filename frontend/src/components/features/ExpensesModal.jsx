// Rule: Max 200 lines per file — split if exceeded
import React from 'react';
import { DollarSign, X } from 'lucide-react';

export default function ExpensesModal({ expenses, onClose }) {
  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-semibold text-lg flex items-center gap-2"><DollarSign size={20}/> Expense Tracker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20}/></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center">No expenses tracked yet. Type `/spend 100 Item` in a note.</p>
          ) : (
            <div className="space-y-4">
              {expenses.map((exp, i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{exp.description}</p>
                    <p className="text-xs text-gray-500">From: {exp.note_title}</p>
                  </div>
                  <div className="font-semibold text-lg text-red-600">
                    ₦{exp.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center font-bold text-lg">
          <span>Total Spend:</span>
          <span className="text-red-600">₦{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
