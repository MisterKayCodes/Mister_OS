// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Wallet, Target } from 'lucide-react';
import { getFinanceOverview, getTransactions } from '../../utils/financeApi';
import TransactionsTab from './TransactionsTab';
import { useToast } from '../../context/ToastContext';

export default function FinanceApp({ token, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovData, txData] = await Promise.all([
        getFinanceOverview(token),
        getTransactions(token)
      ]);
      setOverview(ovData);
      setTransactions(txData);
    } catch (err) {
      showToast("Error loading finance data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const formatNGN = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f9]">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shrink-0 gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-black">
          <ChevronLeft size={22} />
        </button>
        <h2 className="font-semibold text-gray-800 text-lg">Mister Finance</h2>
      </div>

      {/* Tabs Nav */}
      <div className="bg-white px-4 md:px-6 border-b border-gray-200 flex gap-6 overflow-x-auto">
        {['overview', 'transactions', 'wallets', 'goals', 'insights'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="text-gray-400 text-sm">Loading financial data...</div>
        ) : (
          <>
            {activeTab === 'overview' && overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 text-sm font-medium mb-1">Net Worth</p>
                  <h3 className="text-3xl font-bold text-gray-900">{formatNGN(overview.net_worth)}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      {overview.savings_rate}% Saved
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <ArrowDownRight size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">In</p>
                        <p className="font-semibold text-sm">{formatNGN(overview.month_income)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <ArrowUpRight size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Out</p>
                        <p className="font-semibold text-sm">{formatNGN(overview.month_expenses)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab transactions={transactions} formatNGN={formatNGN} />
            )}
            
            {['wallets', 'goals', 'insights'].includes(activeTab) && (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500">
                <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                <p>The {activeTab} tab is under construction.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
