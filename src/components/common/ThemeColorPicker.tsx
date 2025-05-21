import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { ThemeColor, themeColors, setThemeColor } from '../../store/uiSlice';
import { applyThemeColor } from '../../utils/colorUtils';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const ThemeColorPicker: React.FC = () => {
  const dispatch = useDispatch();
  const currentThemeColor = useSelector((state: RootState) => state.ui.themeColor);
  const { playSound } = useSoundEffects();

  const handleColorSelect = (color: ThemeColor) => {
    if (color.id !== currentThemeColor.id) {
      // Apply theme color immediately
      applyThemeColor(color.value);
      
      // Update Redux state
      dispatch(setThemeColor(color));
      playSound('toggle');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme Color
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Choose your preferred accent color
        </p>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
        {themeColors.map((color) => (
          <div key={color.id} className="flex flex-col items-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleColorSelect(color)}
              className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-shadow flex items-center justify-center ${
                currentThemeColor.id === color.id ? 'ring-2 ring-offset-2 ring-gray-700 dark:ring-white' : ''
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name} theme`}
            >
              {currentThemeColor.id === color.id && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </motion.button>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
              {color.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeColorPicker; 