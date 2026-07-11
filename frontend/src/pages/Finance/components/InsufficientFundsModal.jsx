import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function InsufficientFundsModal({ errorData, onClose, onSelectAlternative }) {
  if (!errorData) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-red-100 dark:border-red-900/30">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-lg leading-tight">Insufficient Funds</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          You only have <strong className="text-gray-900 dark:text-white">₦{errorData.available?.toLocaleString()}</strong> available in 
          <strong className="text-gray-900 dark:text-white"> {errorData.wallet_name}</strong>.
        </p>

        {errorData.other_wallets && errorData.other_wallets.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Spend from elsewhere?</p>
            <div className="space-y-2">
              {errorData.other_wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => onSelectAlternative(w.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left group"
                >
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{w.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">₦{w.balance.toLocaleString()} available</p>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-black dark:group-hover:text-white transition">Use this</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No other wallets have enough funds for this transaction.</p>
          </div>
        )}
      </div>
    </div>
  );
}
