import React, { useState } from 'react';
import { Lock, Unlock, Star, Award, Zap, Clock, Plus, Settings2 } from 'lucide-react';
import EditRewardModal from './EditRewardModal';

// Simple built-in confetti — no external package needed
function ConfettiBurst() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    color: ['#f43f5e','#a855f7','#3b82f6','#10b981','#f59e0b','#ec4899'][Math.floor(Math.random() * 6)],
    size: Math.random() * 8 + 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall 2.5s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function RewardShop({ rewards, progress, onUnlock, token, onRewardsChanged }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [unlockingId, setUnlockingId] = useState(null);
  
  // Modal state
  const [editingReward, setEditingReward] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleBuy = async (reward) => {
    setUnlockingId(reward.id);
    try {
      await onUnlock(reward, reward.key_type);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } finally {
      setUnlockingId(null);
    }
  };

  const getAffordability = (keyType, cost) => {
    if (!progress) return false;
    if (keyType === 'Platinum') return progress.platinum_keys >= cost;
    if (keyType === 'Gold') return progress.gold_keys >= cost;
    if (keyType === 'Silver') return progress.silver_keys >= cost;
    return false;
  };

  const getKeyIcon = (keyType) => {
    if (keyType === 'Platinum') return <Zap size={16} className="text-indigo-500" />;
    if (keyType === 'Gold') return <Award size={16} className="text-amber-500" />;
    return <Star size={16} className="text-gray-500" />;
  };

  const getKeyColorClass = (keyType) => {
    if (keyType === 'Platinum') return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30';
    if (keyType === 'Gold') return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  };

  return (
    <div className="space-y-4">
      {showConfetti && <ConfettiBurst />}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Sporadic Rewards</h2>
        <button 
          onClick={() => { setEditingReward(null); setShowEditModal(true); }}
          className="flex items-center gap-1 text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
        >
          <Plus size={16} /> Add Reward
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map(reward => {
          const canAfford = getAffordability(reward.key_type, reward.cost_keys);
          const isUnlocking = unlockingId === reward.id;

          return (
            <div
              key={reward.id}
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col group ${
                canAfford
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:scale-[1.02]'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 opacity-75 grayscale-[0.5]'
              }`}
            >
              <div className="flex justify-between items-start mb-4 relative">
                <h3 className={`font-black text-lg ${canAfford ? 'text-gray-900 dark:text-white' : 'text-gray-500'} flex items-center gap-2`}>
                  {reward.name}
                  <button 
                    onClick={() => { setEditingReward(reward); setShowEditModal(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Edit reward"
                  >
                    <Settings2 size={14} />
                  </button>
                </h3>
                <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold border ${getKeyColorClass(reward.key_type)}`}>
                  {getKeyIcon(reward.key_type)}
                  {reward.cost_keys} {reward.key_type}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-6">
                <Clock size={16} />
                <span>{reward.session_minutes} Minutes Session</span>
              </div>

              <button
                disabled={!canAfford || isUnlocking}
                onClick={() => handleBuy(reward)}
                className={`mt-auto w-full py-3 rounded-2xl flex justify-center items-center gap-2 font-bold transition-all ${
                  canAfford
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-200 shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isUnlocking ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : canAfford ? (
                  <><Unlock size={18} /> Unlock Session</>
                ) : (
                  <><Lock size={18} /> Need Keys</>
                )}
              </button>
            </div>
          );
        })}

        {rewards.length === 0 && (
          <div className="col-span-full p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No rewards configured yet. Click "Add Reward" to create some.</p>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditRewardModal 
          reward={editingReward}
          token={token}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            if (onRewardsChanged) onRewardsChanged();
          }}
        />
      )}
    </div>
  );
}
