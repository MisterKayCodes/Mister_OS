import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ children }) {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e) => {
    if (window.scrollY <= 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling) return;
    const y = e.touches[0].clientY;
    const distance = y - startY;
    
    // Only pull down
    if (distance > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(distance, 120)); 
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      // Trigger refresh
      window.location.reload(true);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    // Prevent the browser's default pull-to-refresh on mobile so our custom one works
    document.body.style.overscrollBehaviorY = 'contain';
    return () => {
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, []);

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full flex flex-col relative"
    >
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center z-50 pointer-events-none transition-all"
        style={{ 
          height: isPulling ? `${pullDistance}px` : '0px', 
          opacity: pullDistance / 80 
        }}
      >
        <div className={`bg-white shadow-lg rounded-full p-2 flex items-center justify-center text-purple-600 transition-transform ${pullDistance > 80 ? 'scale-110' : ''}`}>
          <RefreshCw size={24} className={pullDistance > 80 ? "animate-spin" : ""} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
        </div>
      </div>
      
      <div 
        className="flex-1 w-full h-full transition-transform"
        style={{ 
          transform: isPulling ? `translateY(${pullDistance * 0.4}px)` : 'translateY(0px)',
          transitionDuration: isPulling ? '0ms' : '300ms'
        }}
      >
        {children}
      </div>
    </div>
  );
}
