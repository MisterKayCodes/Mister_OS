import React from 'react';
import { BookOpen, DollarSign, Target, Sparkles, CheckSquare, Settings, LogOut, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard({
  onOpenMenu,
  onOpenFinance,
  onOpenWarRoom,
  onOpenKnowledge,
  onOpenTasks,
  onOpenOmniBrain,
  tokenStats,
  onLogout
}) {
  // Placeholder metrics
  const pendingTasks = 3;
  const todayTxs = 5;
  const recentNotes = 12;

  const quickLinks = [
    { name: "Notes & Editor", icon: BookOpen, color: "from-blue-500 to-cyan-400", onClick: onOpenMenu },
    { name: "Finance Hub", icon: DollarSign, color: "from-emerald-500 to-teal-400", onClick: onOpenFinance },
    { name: "War Room (Leads)", icon: Target, color: "from-orange-500 to-amber-400", onClick: onOpenWarRoom },
    { name: "Knowledge Base", icon: Sparkles, color: "from-purple-500 to-pink-500", onClick: onOpenKnowledge },
    { name: "Task Center", icon: CheckSquare, color: "from-indigo-500 to-violet-500", onClick: onOpenTasks },
  ];

  return (
    <div className="flex-1 w-full h-full bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Mesh Gradient (CSS via Tailwind arbitrary values) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-teal-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-6xl px-6 py-8 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 shrink-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Welcome back
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">Mister OS is ready. What's the focus for today?</p>
          </div>
          <button onClick={onLogout} className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition border border-white/10 text-gray-400 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>

        {/* Top Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 shrink-0">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition cursor-pointer" onClick={onOpenTasks}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <CheckSquare size={26} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Pending Tasks</p>
              <h3 className="text-3xl font-bold mt-1">{pendingTasks}</h3>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition cursor-pointer" onClick={onOpenFinance}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign size={26} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Today's Transactions</p>
              <h3 className="text-3xl font-bold mt-1">{todayTxs}</h3>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition cursor-pointer" onClick={onOpenMenu}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen size={26} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Total Notes</p>
              <h3 className="text-3xl font-bold mt-1">{recentNotes}</h3>
            </div>
          </div>
        </div>

        {/* Main Grid Apps */}
        <div className="flex-1 min-h-0 relative">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-6">Apps & Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-6">
            
            {/* OmniBrain large tile */}
            <div 
              onClick={onOpenOmniBrain}
              className="col-span-2 md:col-span-2 row-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer group hover:border-purple-500/50 transition relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full filter blur-[80px] -mr-20 -mt-20 group-hover:bg-purple-500/30 transition-colors"></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">OmniBrain</h3>
                  <p className="text-gray-400 max-w-sm">Your AI assistant. Manage tasks, write notes, analyze leads, and chat with your personalized LLM.</p>
                </div>
                <div className="flex items-center gap-2 text-purple-400 font-medium mt-8 group-hover:translate-x-2 transition-transform">
                  Launch AI Assistant <ArrowRight size={18} />
                </div>
              </div>
            </div>

            {/* Other Modules */}
            {quickLinks.map((link, i) => (
              <div 
                key={i} 
                onClick={link.onClick}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl cursor-pointer group hover:bg-white/10 hover:border-white/20 transition flex flex-col items-center justify-center text-center gap-4"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <link.icon size={28} strokeWidth={2} />
                </div>
                <span className="font-semibold text-gray-200">{link.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
