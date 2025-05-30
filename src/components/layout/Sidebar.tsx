import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { setModalOpen } from '../../store/uiSlice';
import { RootState } from '../../store';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  const handleAddShift = () => {
    // If not on the calendar page, navigate to it first
    if (location.pathname !== '/') {
      navigate('/');
    }
    
    // Then open the add shift modal
    dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
  };

  return (
    <div className={`sidebar bg-white dark:bg-dark-700 shadow-md h-screen overflow-y-auto sticky top-0 w-64`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex-grow">
          <div className="space-y-2 mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navigation</h2>
            <nav className="flex flex-col space-y-1">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }
                end
              >
                <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </NavLink>
              
              <NavLink 
                to="/employees" 
                className={({ isActive }) => 
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }
              >
                <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Employees
              </NavLink>
              
              <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }
              >
                <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
          
        <div className="mt-auto">
          <button
            onClick={handleAddShift}
            className="btn-primary w-full"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 