import React, { useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

// Define props interface for ConfettiPiece
interface ConfettiPieceProps {
  color: string;
  x: number;
  delay: number;
}

// Simple confetti piece component
const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ color, x, delay }) => (
  <motion.div
    className="absolute"
    initial={{ x, y: -20, rotate: 0, opacity: 0 }}
    animate={{
      x: [x, x + (Math.random() * 300 - 150)],
      y: [0, window.innerHeight],
      rotate: [0, Math.random() * 360],
      opacity: [0, 1, 0.8, 0],
    }}
    transition={{
      duration: 2.5,
      delay,
      ease: "easeOut"
    }}
    style={{ 
      width: '12px', 
      height: '12px', 
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? '50%' : '0',
    }}
  />
);

const ConfettiCelebration = forwardRef<HTMLDivElement, ConfettiCelebrationProps>(({ show, onComplete }, ref) => {
  console.log('ConfettiCelebration render, show =', show);
  
  // Handle completion
  useEffect(() => {
    console.log('ConfettiCelebration - show state changed to:', show);
    
    if (show && onComplete) {
      console.log('Setting up completion timeout');
      const timer = setTimeout(() => {
        console.log('Animation complete timer fired');
        onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  // Generate confetti pieces
  const renderConfetti = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#7161EF'];
    const pieces = [];
    
    for (let i = 0; i < 150; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = Math.random() * window.innerWidth;
      const delay = Math.random() * 0.5;
      
      pieces.push(
        <ConfettiPiece key={i} color={color} x={x} delay={delay} />
      );
    }
    
    return pieces;
  };

  return (
    <div ref={ref}>
      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderConfetti()}
            
            <motion.div
              className="absolute top-[40%] left-[40%] transform -translate-x-1/2 -translate-y-1/2 bg-success-500 text-white px-8 py-6 rounded-lg shadow-xl text-center z-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-2">Schedule Published!</h2>
              <p className="text-lg">All team members have been notified</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ConfettiCelebration.displayName = 'ConfettiCelebration';
export default ConfettiCelebration; 