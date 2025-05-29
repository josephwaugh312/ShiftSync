import { useCallback, useEffect, useState, useRef } from 'react';

// Define sound effect types
export type SoundEffectType = 'success' | 'error' | 'click' | 'notification' | 'complete' | 'toggle' | 'delete';

export const useSoundEffects = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Initialize from localStorage if available
    try {
      const savedPreference = localStorage.getItem('soundEffectsEnabled');
      return savedPreference !== null ? savedPreference === 'true' : true;
    } catch (error) {
      console.error('Error reading sound preference from localStorage:', error);
      return true; // Default fallback
    }
  });
  
  // Store AudioContext in a ref to avoid recreation
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize Web Audio API
  useEffect(() => {
    // Only create the AudioContext when the user interacts with the page
    const handleFirstInteraction = () => {
      if (!audioContextRef.current) {
        try {
          // Create new AudioContext
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('AudioContext initialized successfully');
        } catch (error) {
          console.error('Failed to create AudioContext:', error);
        }
      }
      
      // Remove the listener after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    // Add event listeners for first interaction
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      // Cleanup event listeners
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      
      // Close AudioContext if exists
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(error => {
          console.error('Error closing AudioContext:', error);
        });
      }
    };
  }, []);
  
  // Update localStorage when sound preference changes
  useEffect(() => {
    try {
      localStorage.setItem('soundEffectsEnabled', soundEnabled.toString());
    } catch (error) {
      console.error('Error saving sound preference to localStorage:', error);
    }
  }, [soundEnabled]);
  
  // Function to generate different types of sounds
  const generateSound = useCallback((type: SoundEffectType, volume = 0.5) => {
    if (!audioContextRef.current) {
      // Create context on demand if needed
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create AudioContext on demand:', error);
        return;
      }
    }
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Connect the oscillator to the gain node and the gain node to the output
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Set volume
    gainNode.gain.value = volume;
    
    // Configure oscillator based on sound type
    switch (type) {
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, context.currentTime);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
        break;
        
      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.2);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);
        break;
        
      case 'error':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.2);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);
        break;
        
      case 'notification':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, context.currentTime + 0.05);
        oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        break;
        
      case 'complete':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        
        // Add a second note for a pleasant arpeggio effect
        setTimeout(() => {
          const oscillator2 = context.createOscillator();
          const gainNode2 = context.createGain();
          oscillator2.connect(gainNode2);
          gainNode2.connect(context.destination);
          oscillator2.type = 'sine';
          oscillator2.frequency.setValueAtTime(1200, context.currentTime);
          gainNode2.gain.setValueAtTime(volume, context.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
          oscillator2.start();
          oscillator2.stop(context.currentTime + 0.2);
        }, 100);
        break;
        
      case 'toggle':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
        break;
        
      case 'delete':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.2);
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);
        break;
    }
  }, []);
  
  // Function to play a sound effect
  const playSound = useCallback((type: SoundEffectType, volume = 0.5) => {
    if (!soundEnabled) return;
    
    try {
      console.log(`Playing sound: ${type}`);
      generateSound(type, volume);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled, generateSound]);
  
  // Toggle sound effects on/off
  const toggleSoundEffects = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);
  
  return {
    soundEnabled,
    toggleSoundEffects,
    playSound,
  };
}; 