import React, { useState, useEffect, ReactNode } from 'react';

interface GestureDetectorProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  enableHaptic?: boolean;
}

const GestureDetector: React.FC<GestureDetectorProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  enableHaptic = true
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Haptic feedback function (if available)
  const triggerHapticFeedback = () => {
    if (enableHaptic && navigator.vibrate) {
      navigator.vibrate(15); // Short vibration for feedback
    }
  };

  // Reset touchEnd if touchStart changes
  useEffect(() => {
    if (touchStart) {
      setTouchEnd(null);
    }
  }, [touchStart]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance && onSwipeLeft) {
        triggerHapticFeedback();
        onSwipeLeft();
      } else if (distanceX < -minSwipeDistance && onSwipeRight) {
        triggerHapticFeedback();
        onSwipeRight();
      }
    } else {
      if (distanceY > minSwipeDistance && onSwipeUp) {
        triggerHapticFeedback();
        onSwipeUp();
      } else if (distanceY < -minSwipeDistance && onSwipeDown) {
        triggerHapticFeedback();
        onSwipeDown();
      }
    }

    // Reset
    setTouchEnd(null);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};

export default GestureDetector;
