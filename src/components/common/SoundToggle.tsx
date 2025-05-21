import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface SoundToggleProps {
  className?: string;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ className = '' }) => {
  const { soundEnabled, toggleSoundEffects, playSound } = useSoundEffects();
  const [isPressed, setIsPressed] = useState(false);

  const handleToggle = () => {
    // Try to play sound before toggling
    if (soundEnabled) {
      playSound('toggle');
    }
    
    // Toggle sound state
    toggleSoundEffects();
    
    // If we're enabling sounds, play a sound after a short delay
    if (!soundEnabled) {
      setTimeout(() => playSound('toggle'), 100);
    }
  };

  return (
    <motion.button
      className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        soundEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
      } ${className}`}
      role="switch"
      aria-checked={soundEnabled}
      onClick={handleToggle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileTap={{ scale: 0.95 }}
      style={{ width: '54px', height: '28px' }}
    >
      <span className="sr-only">{soundEnabled ? 'Sound on' : 'Sound off'}</span>
      <motion.span
        className={`flex items-center justify-center rounded-full ${
          soundEnabled ? 'bg-white text-primary-500' : 'bg-white text-gray-500 dark:text-dark-500'
        }`}
        animate={{
          x: soundEnabled ? 28 : 4,
          scale: isPressed ? 0.9 : 1
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30,
          scale: {
            duration: 0.1
          }
        }}
        style={{ width: '20px', height: '20px' }}
      >
        {soundEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
            <path d="M18.44 4.52l-.813.812c-.03.03-.787.784-1.99 1.987l-4.85 4.85-4.848 4.848c-1.202 1.202-1.958 1.956-1.988 1.986l-.812.812a.75.75 0 101.06 1.06l.813-.812c.03-.03.787-.784 1.99-1.987l4.849-4.85 4.848-4.848c1.202-1.203 1.957-1.958 1.987-1.988l.812-.812a.75.75 0 10-1.06-1.06z" strokeWidth="1.5" stroke="currentColor" fill="none" />
          </svg>
        )}
      </motion.span>
      
      {/* Background animation for toggle */}
      <motion.span 
        className="absolute inset-0 rounded-full"
        animate={{ 
          backgroundColor: soundEnabled 
            ? ['rgba(79, 70, 229, 0.2)', 'rgba(79, 70, 229, 0)'] 
            : ['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0)']
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
};

export default SoundToggle; 