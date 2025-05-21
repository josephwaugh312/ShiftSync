import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleSidebar } from '../../store/uiSlice';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import CustomFocusButton from '../common/CustomFocusButton';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { playSound } = useSoundEffects();

  const handleSidebarToggle = () => {
    playSound('click');
    dispatch(toggleSidebar());
  };

  return (
    <div className="flex items-center">
      <CustomFocusButton
        onClick={handleSidebarToggle}
        className="md:hidden p-2 text-gray-500 dark:text-gray-400"
        variant="outline"
        sound="click"
        aria-label="Toggle sidebar"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </CustomFocusButton>
      <Link to="/" className="flex-shrink-0 flex items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-dark-900 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-orange-500"></div>
            </div>
          </div>
          <span className="ml-2 text-xl font-bold text-primary-900 dark:text-white">ShiftSync</span>
        </div>
      </Link>
    </div>
  );
};

export default Header; 