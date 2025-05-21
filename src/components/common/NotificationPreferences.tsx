import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  toggleNotifications,
  toggleNotificationSound,
  setNotificationSoundVolume,
  setNotificationSoundType,
  toggleNotificationType,
  setNotificationStyle,
  setNotificationDuration,
  toggleNotificationBadges,
  toggleNotificationColorCoding,
  setReminderLeadTime,
  setNonUrgentDeliveryTime,
  setDeliveryFormat
} from '../../store/uiSlice';
import CustomToggle from './CustomToggle';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const NotificationPreferences: React.FC = () => {
  const dispatch = useDispatch();
  const { notificationPreferences } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    dispatch(setNotificationSoundVolume(volume));
    // Play a sample sound at the new volume
    playSound('notification', volume);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const duration = parseInt(e.target.value, 10);
    dispatch(setNotificationDuration(duration));
    playSound('click');
  };

  const handleSoundTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setNotificationSoundType(e.target.value as any));
    playSound('click');
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setNotificationStyle(e.target.value as any));
    playSound('click');
  };

  const handleLeadTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setReminderLeadTime(e.target.value as any));
    playSound('click');
  };

  const handleDeliveryFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setDeliveryFormat(e.target.value as any));
    playSound('click');
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setNonUrgentDeliveryTime(e.target.value));
    playSound('click');
  };

  const notificationTypes = [
    { 
      id: 'shifts', 
      label: 'Shift Assignments', 
      description: 'Notifications for shift assignments, updates, and modifications' 
    },
    { 
      id: 'scheduleChanges', 
      label: 'Schedule Changes', 
      description: 'Notifications when the overall schedule is modified' 
    },
    { 
      id: 'reminders', 
      label: 'Shift Reminders', 
      description: 'Reminders before your shifts start' 
    },
    { 
      id: 'timeOff', 
      label: 'Time Off Requests', 
      description: 'Updates on time off requests and approvals' 
    },
    { 
      id: 'publication', 
      label: 'Schedule Publications', 
      description: 'Notifications when a new schedule is published' 
    },
    { 
      id: 'shiftSwap', 
      label: 'Shift Swaps', 
      description: 'Shift swap requests and their status updates' 
    },
    { 
      id: 'general', 
      label: 'General Updates', 
      description: 'Other notifications not related to shifts or schedule changes' 
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
      
      <div className="space-y-6">
        {/* Main notification toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Notifications
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Turn all notifications on or off
            </p>
          </div>
          <CustomToggle
            checked={notificationPreferences.enabled}
            onChange={() => dispatch(toggleNotifications())}
            id="enableNotifications"
          />
        </div>
        
        {notificationPreferences.enabled && (
          <>
            {/* Sound Settings */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-600">
              <h3 className="text-md font-medium text-gray-800 dark:text-white mb-4">Sound Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notification Sounds
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Play sounds for notifications
                    </p>
                  </div>
                  <CustomToggle
                    checked={notificationPreferences.sound.enabled}
                    onChange={() => dispatch(toggleNotificationSound())}
                    id="notificationSound"
                  />
                </div>
                
                {notificationPreferences.sound.enabled && (
                  <>
                    <div>
                      <label htmlFor="soundType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sound Type
                      </label>
                      <select
                        id="soundType"
                        value={notificationPreferences.sound.type}
                        onChange={handleSoundTypeChange}
                        className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="default">Default</option>
                        <option value="subtle">Subtle</option>
                        <option value="distinct">Distinct</option>
                      </select>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="volume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Volume
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(notificationPreferences.sound.volume * 100)}%
                        </span>
                      </div>
                      <input
                        id="volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={notificationPreferences.sound.volume}
                        onChange={handleVolumeChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-dark-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Off</span>
                        <span>Max</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Notification Types */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-600">
              <h3 className="text-md font-medium text-gray-800 dark:text-white mb-4">Notification Types</h3>
              
              <div className="space-y-3">
                {notificationTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {type.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                    <CustomToggle
                      checked={notificationPreferences.types[type.id as keyof typeof notificationPreferences.types]}
                      onChange={() => dispatch(toggleNotificationType(type.id as any))}
                      id={`notif-${type.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual Preferences */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-600">
              <h3 className="text-md font-medium text-gray-800 dark:text-white mb-4">Visual Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="notificationStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notification Style
                  </label>
                  <select
                    id="notificationStyle"
                    value={notificationPreferences.visual.style}
                    onChange={handleStyleChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="prominent">Prominent</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="notificationDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notification Duration
                  </label>
                  <select
                    id="notificationDuration"
                    value={notificationPreferences.visual.duration}
                    onChange={handleDurationChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="3000">Brief (3 seconds)</option>
                    <option value="5000">Default (5 seconds)</option>
                    <option value="10000">Extended (10 seconds)</option>
                    <option value="0">Manual dismiss only</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Badge Indicators
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Display badges for unread notifications
                    </p>
                  </div>
                  <CustomToggle
                    checked={notificationPreferences.visual.showBadges}
                    onChange={() => dispatch(toggleNotificationBadges())}
                    id="showBadges"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Color-Coded Notifications
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use different colors for different notification types
                    </p>
                  </div>
                  <CustomToggle
                    checked={notificationPreferences.visual.colorCoded}
                    onChange={() => dispatch(toggleNotificationColorCoding())}
                    id="colorCoded"
                  />
                </div>
              </div>
            </div>
            
            {/* Timing Preferences */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-600">
              <h3 className="text-md font-medium text-gray-800 dark:text-white mb-4">Timing Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="reminderLeadTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shift Reminder Lead Time
                  </label>
                  <select
                    id="reminderLeadTime"
                    value={notificationPreferences.timing.reminderLeadTime}
                    onChange={handleLeadTimeChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="1hour">1 hour before shift</option>
                    <option value="3hours">3 hours before shift</option>
                    <option value="12hours">12 hours before shift</option>
                    <option value="24hours">24 hours before shift</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="nonUrgentTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Time for Non-urgent Notifications
                  </label>
                  <input
                    id="nonUrgentTime"
                    type="time"
                    value={notificationPreferences.timing.nonUrgentDeliveryTime}
                    onChange={handleTimeChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Non-urgent notifications will be delivered at this time
                  </p>
                </div>
                
                <div>
                  <label htmlFor="deliveryFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Format
                  </label>
                  <select
                    id="deliveryFormat"
                    value={notificationPreferences.timing.deliveryFormat}
                    onChange={handleDeliveryFormatChange}
                    className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="immediate">Immediate (as they happen)</option>
                    <option value="digest">Daily digest</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPreferences; 