import React, { useState, useEffect } from 'react';
import { BookOpen, DollarSign, Target, Sparkles, CheckSquare, Settings, LogOut, Clock, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getTasksApi, fetchNotesCountApi } from '../../utils/api';
import { getTransactions } from '../../utils/financeApi';

export default function Dashboard({ onNavigate, onLogout, token }) {
  const { isDarkMode, toggleTheme } = useTheme();

  // Dynamic metrics fetched from APIs
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [todayTxsCount, setTodayTxsCount] = useState(0);
  const [totalNotesCount, setTotalNotesCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    // Fetch pending tasks
    getTasksApi(token)
      .then(tasks => {
        if (Array.isArray(tasks)) {
          const pending = tasks.filter(t => t.status !== 'done').length;
          setPendingTasksCount(pending);
        }
      })
      .catch(err => console.error("Error fetching tasks for dashboard:", err));

    // Fetch total notes count
    fetchNotesCountApi(token)
      .then(data => {
        if (data && typeof data.count === 'number') {
          setTotalNotesCount(data.count);
        }
      })
      .catch(err => console.error("Error fetching notes for dashboard:", err));

    // Fetch today's transactions
    getTransactions(token)
      .then(txs => {
        if (Array.isArray(txs)) {
          const todayStr = new Date().toDateString();
          const todayCount = txs.filter(t => new Date(t.date).toDateString() === todayStr).length;
          setTodayTxsCount(todayCount);
        }
      })
      .catch(err => console.error("Error fetching transactions for dashboard:", err));
  }, [token]);

  const quickLinks = [
    { name: "Notes & Editor", icon: BookOpen, color: "from-blue-500 to-cyan-400", bgLight: "bg-blue-50", textLight: "text-blue-600", onClick: () => onNavigate('notes') },
    { name: "Finance Hub", icon: DollarSign, color: "from-emerald-500 to-teal-400", bgLight: "bg-emerald-50", textLight: "text-emerald-600", onClick: () => onNavigate('finance') },
    { name: "War Room (Leads)", icon: Target, color: "from-orange-500 to-amber-400", bgLight: "bg-orange-50", textLight: "text-orange-600", onClick: () => onNavigate('warroom') },
    { name: "Knowledge Base", icon: Sparkles, color: "from-purple-500 to-pink-500", bgLight: "bg-purple-50", textLight: "text-purple-600", onClick: () => onNavigate('knowledge') },
    { name: "Task Center", icon: CheckSquare, color: "from-indigo-500 to-violet-500", bgLight: "bg-indigo-50", textLight: "text-indigo-600", onClick: () => onNavigate('tasks') },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white relative">
      {/* Background Mesh Gradient */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-60 dark:opacity-40 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-200 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-60 dark:opacity-40 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-teal-200 dark:bg-teal-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-50 dark:opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 shrink-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base font-medium">Mister OS is ready. What's the focus for today?</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-3 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full shadow-sm backdrop-blur-md transition border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={onLogout} className="p-3 bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-white/10 rounded-full shadow-sm backdrop-blur-md transition border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Top Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 shrink-0">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:border-indigo-300 dark:hover:bg-white/10 transition cursor-pointer shadow-sm dark:shadow-none" onClick={() => onNavigate('tasks')}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CheckSquare size={26} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Pending Tasks</p>
              <h3 className="text-3xl font-black mt-1 text-gray-800 dark:text-white">{pendingTasksCount}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:border-emerald-300 dark:hover:bg-white/10 transition cursor-pointer shadow-sm dark:shadow-none" onClick={() => onNavigate('finance')}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign size={26} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Today's Transactions</p>
              <h3 className="text-3xl font-black mt-1 text-gray-800 dark:text-white">{todayTxsCount}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:border-blue-300 dark:hover:bg-white/10 transition cursor-pointer shadow-sm dark:shadow-none" onClick={() => onNavigate('notes')}>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen size={26} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Total Notes</p>
              <h3 className="text-3xl font-black mt-1 text-gray-800 dark:text-white">{totalNotesCount}</h3>
            </div>
          </div>
        </div>

        {/* Main Grid Apps */}
        <div className="flex-1 min-h-0 relative">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Apps & Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-12">
            
            {/* OmniBrain large tile */}
            <div 
              onClick={() => onNavigate('omnichat')}
              className="col-span-2 md:col-span-2 row-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-white/10 dark:to-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-8 rounded-3xl cursor-pointer group hover:border-purple-400 dark:hover:border-purple-500/50 transition relative overflow-hidden shadow-md dark:shadow-none"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 dark:bg-purple-500/20 rounded-full filter blur-[80px] -mr-20 -mt-20 group-hover:bg-purple-300 dark:group-hover:bg-purple-500/30 transition-colors"></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/30">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-4xl font-extrabold mb-3 text-gray-900 dark:text-white tracking-tight">OmniBrain</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm text-lg leading-relaxed font-medium">Your AI assistant. Manage tasks, write notes, analyze leads, and chat with your personalized LLM.</p>
                </div>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mt-8 group-hover:translate-x-2 transition-transform text-lg">
                  Launch AI Assistant <ArrowRight size={20} />
                </div>
              </div>
            </div>

            {/* Other Modules */}
            {quickLinks.map((link, i) => (
              <div 
                key={i} 
                onClick={link.onClick}
                className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-8 rounded-3xl cursor-pointer group hover:border-gray-300 dark:hover:bg-white/10 dark:hover:border-white/20 transition flex flex-col items-center justify-center text-center gap-5 shadow-sm dark:shadow-none"
              >
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white shadow-lg shadow-gray-200 dark:shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <link.icon size={36} strokeWidth={2} />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">{link.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
