import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
  variant?: 'confetti' | 'checkmark' | 'celebration';
  className?: string;
  role?: string;
  'aria-live'?: 'assertive' | 'polite' | 'off';
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  delay: number;
  shape: 'circle' | 'square' | 'rectangle';
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  message = 'Success!',
  duration = 2000,
  onComplete,
  variant = 'checkmark',
  className = '',
  role = 'status',
  'aria-live': ariaLive = 'assertive'
}) => {
  const { playSound } = useSoundEffects();
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (show) {
      // Play appropriate sound based on variant
      if (variant === 'confetti' || variant === 'celebration') {
        playSound('complete');
      } else {
        playSound('success');
      }
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete, playSound, variant]);

  // Generate confetti particles if variant is confetti
  useEffect(() => {
    if (show && variant === 'confetti') {
      // More vibrant colors for confetti
      const colors = [
        '#4F46E5', // Indigo
        '#06B6D4', // Cyan
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#EC4899', // Pink
        '#8B5CF6', // Violet
        '#06D6A0', // Teal
        '#FFD166', // Yellow
      ];
      
      // Create 150 particles
      const particles: ConfettiParticle[] = Array.from({ length: 150 }).map(() => {
        const shape: ('circle' | 'square' | 'rectangle') = 
          Math.random() < 0.33 ? 'circle' : 
          Math.random() < 0.66 ? 'square' : 'rectangle';
        
        return {
          x: 40 + Math.random() * 20, // Concentrate particles more toward center
          y: Math.random() * 20, // Start from top
          size: Math.random() * 10 + 4, 
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15, // Random rotation speed
          delay: Math.random() * 0.5, // Stagger the animation
          shape
        };
      });
      
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [show, variant]);

  return (
    <AnimatePresence>
      {show && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${className}`} role={role} aria-live={ariaLive}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />
          
          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-white dark:bg-dark-700 rounded-lg shadow-xl p-8 flex flex-col items-center max-w-md w-full mx-4"
          >
            {/* Animation based on variant */}
            {variant === 'checkmark' && (
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4"
              >
                <svg
                  className="w-16 h-16 text-primary-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    d="M20 6L9 17l-5-5"
                  />
                </svg>
              </motion.div>
            )}
            
            {variant === 'celebration' && (
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4"
              >
                <svg
                  className="w-16 h-16 text-primary-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </motion.div>
            )}
            
            {variant === 'confetti' && (
              <div className="relative w-full h-56 mb-6 overflow-hidden">
                {/* Confetti particles */}
                {confetti.map((particle, index) => {
                  // Determine shape
                  const isCircle = particle.shape === 'circle';
                  const isRectangle = particle.shape === 'rectangle';
                  
                  return (
                    <motion.div
                      key={index}
                      className={`absolute ${isCircle ? 'rounded-full' : 'rounded-sm'}`}
                      style={{
                        left: `${particle.x}%`,
                        top: 0,
                        width: isRectangle ? particle.size * 2 : particle.size,
                        height: particle.size,
                        background: particle.color,
                        transformOrigin: 'center',
                      }}
                      initial={{ 
                        y: 0, 
                        opacity: 1, 
                        rotate: particle.rotation 
                      }}
                      animate={{
                        y: 300,
                        x: `calc(${particle.x}% + ${(Math.random() - 0.5) * 200}px)`,
                        opacity: [1, 1, 0],
                        rotate: particle.rotation + (particle.rotationSpeed * 360)
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        ease: "easeOut",
                        delay: particle.delay,
                      }}
                      aria-hidden="true"
                    />
                  );
                })}
                
                {/* Centered checkmark container */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center" style={{ marginBottom: "20px" }}>
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 1], y: [20, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center"
                  >
                    <svg className="w-16 h-16 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </svg>
                  </motion.div>
                </div>
              </div>
            )}
            
            {/* Success message */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center"
            >
              {message}
            </motion.h2>
            
            {/* Additional message for context */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 dark:text-gray-300 text-center"
            >
              {variant === 'confetti' && "Your changes have been saved successfully."}
            </motion.p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation; 