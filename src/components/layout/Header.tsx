import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <div className="flex items-center">
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