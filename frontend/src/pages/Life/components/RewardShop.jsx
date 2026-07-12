import React, { useState } from 'react';
import { ShoppingBag, Lock, Unlock, Play, Star, Award, Zap } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import Confetti from 'react-confetti';

export default function RewardShop({ rewards, progress, onUnlock }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [unlockingId, setUnlockingId] = useState(null);

  const handleBuy = async (reward) => {
    setUnlockingId(reward.id);
    try {
      await onUnlock(reward, reward.key_type);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
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
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.15} />}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Sporadic Rewards</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map(reward => {
          const canAfford = getAffordability(reward.key_type, reward.cost_keys);
          const isUnlocking = unlockingId === reward.id;

          return (
            <div 
              key={reward.id} 
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col ${
                canAfford 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:scale-[1.02]' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 opacity-75 grayscale-[0.5]'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className={`font-black text-lg ${canAfford ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                  {reward.name}
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
                  <>
                    <Unlock size={18} /> Unlock Session
                  </>
                ) : (
                  <>
                    <Lock size={18} /> Need Keys
                  </>
                )}
              </button>
            </div>
          );
        })}
        {rewards.length === 0 && (
          <div className="col-span-full p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No rewards configured yet. Add them in settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
