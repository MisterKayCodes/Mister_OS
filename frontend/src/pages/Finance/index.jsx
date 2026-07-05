// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Sun, Moon } from 'lucide-react';
import { getFinanceOverview, getTransactions, getWallets, getGoals, getSubscriptionsApi } from '../../utils/financeApi';
import TransactionsTab from './components/TransactionsTab';
import WalletsTab from './components/WalletsTab';
import GoalsTab from './components/GoalsTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import InsightsTab from './components/InsightsTab';
import PriceDbTab from './components/PriceDbTab';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

const TABS = ['overview', 'transactions', 'wallets', 'goals', 'subscriptions', 'price-db', 'insights'];

export default function FinanceApp({ token, onBack }) {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('finance_activeTab') || 'overview');
  useEffect(() => { sessionStorage.setItem('finance_activeTab', activeTab); }, [activeTab]);
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, txs, ws, gs, subs] = await Promise.all([
        getFinanceOverview(token),
        getTransactions(token),
        getWallets(token),
        getGoals(token),
        getSubscriptionsApi(token)
      ]);
      setOverview(ov);
      setTransactions(txs);
      setWallets(ws);
      setGoals(gs);
      setSubscriptions(subs);
    } catch (err) {
      showToast('Error loading finance data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatNGN = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"><ChevronLeft size={22} /></button>
          <h2 className="font-semibold text-gray-800 dark:text-white text-lg">Mister Finance</h2>
        </div>
        <button onClick={toggleTheme} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Tabs Nav */}
      <div className="bg-white dark:bg-gray-800 px-4 md:px-6 border-b border-gray-200 dark:border-gray-700 flex flex-wrap md:flex-nowrap gap-2 md:gap-5 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap capitalize ${
              activeTab === tab ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="text-gray-400 text-sm text-center pt-10">Loading your finances...</div>
        ) : (
          <>
            {activeTab === 'overview' && overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Net Worth card */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 rounded-2xl shadow-sm md:col-span-2">
                  <p className="text-purple-200 text-sm font-medium mb-1">Total Net Worth</p>
                  <h3 className="text-4xl font-extrabold tracking-tight">{formatNGN(overview.net_worth)}</h3>
                  <p className="text-purple-300 text-xs mt-2">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} tracked</p>
                </div>
                {/* Daily Income */}
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0"><ArrowDownRight size={20} /></div>
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider">Today's Income</p>
                    <p className="text-lg md:text-xl font-bold text-green-600">{formatNGN(overview.today_income)}</p>
                  </div>
                </div>
                {/* Daily Expenses */}
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0"><ArrowUpRight size={20} /></div>
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider">Today's Expenses</p>
                    <p className="text-lg md:text-xl font-bold text-red-600">{formatNGN(overview.today_expenses)}</p>
                  </div>
                </div>
                {/* Monthly Income */}
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><ArrowDownRight size={22} /></div>
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider">Month Income</p>
                    <p className="text-lg md:text-xl font-bold text-green-600">{formatNGN(overview.month_income)}</p>
                  </div>
                </div>
                {/* Monthly Expenses */}
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><ArrowUpRight size={22} /></div>
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider">Month Expenses</p>
                    <p className="text-lg md:text-xl font-bold text-red-600">{formatNGN(overview.month_expenses)}</p>
                  </div>
                </div>
                {/* Savings Rate */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Savings Rate</p>
                    <span className={`text-sm font-bold ${overview.savings_rate >= 20 ? 'text-green-600' : overview.savings_rate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                      {overview.savings_rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${overview.savings_rate >= 20 ? 'bg-green-500' : overview.savings_rate >= 10 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(overview.savings_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatNGN(overview.month_saved)} saved this month</p>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && <TransactionsTab transactions={transactions} formatNGN={formatNGN} token={token} fetchAll={fetchAll} />}
            {activeTab === 'wallets' && <WalletsTab wallets={wallets} setWallets={setWallets} formatNGN={formatNGN} token={token} />}
            {activeTab === 'goals' && <GoalsTab goals={goals} setGoals={setGoals} wallets={wallets} formatNGN={formatNGN} token={token} />}
            {activeTab === 'subscriptions' && <SubscriptionsTab subscriptions={subscriptions} setSubscriptions={setSubscriptions} token={token} formatNGN={formatNGN} />}
            {activeTab === 'price-db' && <PriceDbTab token={token} formatNGN={formatNGN} />}
            {activeTab === 'insights' && <InsightsTab token={token} />}
          </>
        )}
      </div>
    </div>
  );
}
