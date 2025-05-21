import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setModalOpen } from '../../store/uiSlice';
import BrandedSpinner from './BrandedSpinner';
import Tooltip from './Tooltip';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const FloatingActionButton: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { playSound } = useSoundEffects();

  const handleAddShift = () => {
    // Play sound
    playSound('click');
    
    // Show processing animation
    setIsProcessing(true);
    
    // If not on the calendar page, navigate to it first
    if (location.pathname !== '/') {
      navigate('/');
      // Extra delay when navigating
      setTimeout(() => {
        setIsProcessing(false);
        dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
      }, 1000);
    } else {
      // Shorter delay when already on the right page
      setTimeout(() => {
        setIsProcessing(false);
        dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
      }, 600);
    }
  };

  return (
    <Tooltip content="Add new shift" shortcut="shift+n" position="left">
      <motion.button
        onClick={handleAddShift}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-10 right-10 bg-primary-600 hover:bg-primary-700 text-white rounded-full w-20 h-20 shadow-2xl z-[9999] hidden lg:flex items-center justify-center"
        aria-label="Add Shift"
        style={{ boxShadow: isHovered ? '0 0 20px rgba(59, 130, 246, 0.8)' : '0 0 15px rgba(59, 130, 246, 0.5)' }}
        disabled={isProcessing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {isProcessing ? (
          <BrandedSpinner color="white" size="medium" />
        ) : (
          <svg className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
      </motion.button>
    </Tooltip>
  );
};

export default FloatingActionButton; 