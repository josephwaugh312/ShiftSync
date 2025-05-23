import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode, toggleHighContrastMode, toggleDyslexicFontMode, addNotification } from '../../store/uiSlice';
import { RootState } from '../../store';
import CustomToggle from './CustomToggle';
import CustomFocusButton from './CustomFocusButton';
import ThemeColorPicker from './ThemeColorPicker';
import NotificationPreferences from './NotificationPreferences';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { darkMode, highContrastMode, dyslexicFontMode } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();
  
  const [settings, setSettings] = useState({
    language: 'en',
    timezone: 'America/New_York',
  });
  
  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
    playSound('toggle');
  };
  
  const handleToggleHighContrast = () => {
    dispatch(toggleHighContrastMode());
    playSound('toggle');
  };
  
  const handleToggleDyslexicFont = () => {
    dispatch(toggleDyslexicFontMode());
    playSound('toggle');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setSettings({
      ...settings,
      [name]: value,
    });
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Play success sound
    playSound('success');
    
    // In a real app, you would save these settings to an API or localStorage
    localStorage.setItem('settings', JSON.stringify(settings));
    
    dispatch(addNotification({
      message: 'Settings saved successfully',
      type: 'success',
      category: 'general'
    }));
  };
  
  return (
    <div className="max-w-3xl mx-auto pb-28">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <form onSubmit={handleSave}>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance & Accessibility</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dark Mode
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <CustomToggle
                    checked={darkMode}
                    onChange={handleToggleDarkMode}
                    id="darkMode"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      High Contrast Mode
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <CustomToggle
                    checked={highContrastMode}
                    onChange={handleToggleHighContrast}
                    id="highContrastMode"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dyslexia-Friendly Font
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use a font that improves readability
                    </p>
                  </div>
                  <CustomToggle
                    checked={dyslexicFontMode}
                    onChange={handleToggleDyslexicFont}
                    id="dyslexicFontMode"
                  />
                </div>
                
                {/* Theme Color Picker */}
                <div className="pt-2">
                  <ThemeColorPicker />
                </div>
              </div>
            </div>
            
            {/* Notification Preferences Component */}
            <NotificationPreferences />
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Regional Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-dark-600 flex justify-end">
              <CustomFocusButton
                type="submit"
                variant="primary"
                sound="success"
              >
                Save Settings
              </CustomFocusButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 