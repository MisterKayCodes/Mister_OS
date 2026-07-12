import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Square, CheckCircle } from 'lucide-react';

export default function TaskTimerModal({ task, onClose, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(task.target_minutes ? task.target_minutes * 60 : 25 * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const wakeLockRef = useRef(null);

  // Request Wake Lock to keep screen on (Desk Clock mode)
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log("Wake Lock API not supported or denied.");
      }
    };
    
    if (isRunning) requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, [isRunning]);

  // Request Notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Timer tick
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleFinish = () => {
    // Send standard web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("Task Completed!", {
        body: `You finished ${task.name}. Tap to claim your XP!`,
        icon: "/favicon.ico"
      });
    }
    // Automatically complete
    finishAndClaim();
  };

  const finishAndClaim = () => {
    // If they stop early, calculate proportional XP. 
    // If they finish the whole target, give full XP + fast bonus (if fast bonus applies).
    const elapsedMinutes = timeElapsed / 60;
    const targetMinutes = task.target_minutes || 25;
    
    let xpToGive = 0;
    
    if (timeElapsed >= targetMinutes * 60) {
      // Completed full time
      xpToGive = task.base_xp;
      // Fast bonus logic: if time boxed, fast bonus usually means finishing EARLY.
      // But in this simple logic, if it's a speed bonus task and they click finish early, we give it.
    } else {
      // Stopped early
      const percentage = elapsedMinutes / targetMinutes;
      xpToGive = Math.round(task.base_xp * percentage);
      
      // If it's a task that rewards speed (like editing youtube in 45m instead of 60m)
      if (task.fast_bonus_xp > 0 && elapsedMinutes > 0) {
        xpToGive = task.base_xp + task.fast_bonus_xp;
      }
    }
    
    // Ensure we don't give 0 XP if they worked for a bit
    if (elapsedMinutes >= 1 && xpToGive < 1) xpToGive = 1;

    onComplete(Math.round(elapsedMinutes), xpToGive);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="absolute top-6 right-6">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-8 w-full max-w-lg">
        <p className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-4">Focus Session</p>
        <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">{task.name}</h2>
        
        <div className="text-[100px] md:text-[140px] font-black text-white tracking-tighter tabular-nums leading-none mb-16 drop-shadow-2xl">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-6">
          {isRunning ? (
            <button 
              onClick={() => setIsRunning(false)}
              className="w-20 h-20 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition shadow-lg hover:scale-105 active:scale-95"
            >
              <Pause size={32} />
            </button>
          ) : (
            <button 
              onClick={() => setIsRunning(true)}
              className="w-20 h-20 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition shadow-lg hover:scale-105 active:scale-95"
            >
              <Play size={32} className="ml-2" />
            </button>
          )}

          <button 
            onClick={finishAndClaim}
            className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shadow-lg hover:scale-105 active:scale-95"
          >
            <CheckCircle size={32} />
          </button>
        </div>
        
        <p className="text-gray-400 mt-12 text-sm text-center">
          Put phone face down. <br/> Screen will stay awake.
        </p>
      </div>
    </div>
  );
}
