import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  category?: 'shifts' | 'scheduleChanges' | 'reminders' | 'timeOff' | 'publication' | 'shiftSwap' | 'general';
  read?: boolean;
}

export interface ThemeColor {
  name: string;
  value: string;
  id: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: {
    enabled: boolean;
    volume: number; // 0.0 to 1.0
    type: 'default' | 'subtle' | 'distinct';
  };
  types: {
    shifts: boolean;      // For shift assignments and updates
    scheduleChanges: boolean;  // For schedule modifications
    reminders: boolean;    // For shift reminders
    timeOff: boolean;     // For time off requests
    publication: boolean;  // For schedule publications
    shiftSwap: boolean;   // For shift swap requests
    general: boolean;     // For all other notifications not related to shifts/schedule
  };
  visual: {
    style: 'standard' | 'minimal' | 'prominent';
    duration: number; // in milliseconds
    showBadges: boolean;
    colorCoded: boolean;
  };
  timing: {
    reminderLeadTime: '1hour' | '3hours' | '12hours' | '24hours';
    nonUrgentDeliveryTime: string; // 24-hour format, e.g., "09:00"
    deliveryFormat: 'immediate' | 'digest';
  };
}

interface UiState {
  darkMode: boolean;
  highContrastMode: boolean;
  dyslexicFontMode: boolean;
  themeColor: ThemeColor;
  sidebarOpen: boolean;
  modalOpen: {
    addShift: boolean;
    editShift: boolean;
    deleteConfirm: boolean;
    copyShift: boolean;
    insights: boolean;
    templates: boolean;
    addTemplate: boolean;
    editTemplate: boolean;
    savedViews: boolean;
  };
  currentView: 'daily' | 'weekly' | 'staff' | 'list';
  notifications: Notification[];
  selectedShiftId: string | null;
  selectedTemplateId: string | null;
  notificationPreferences: NotificationPreferences;
}

export const themeColors: ThemeColor[] = [
  { name: 'Blue', value: '#4d82ff', id: 'blue' },
  { name: 'Purple', value: '#8B5CF6', id: 'purple' },
  { name: 'Green', value: '#10B981', id: 'green' },
  { name: 'Red', value: '#EF4444', id: 'red' },
  { name: 'Amber', value: '#F59E0B', id: 'amber' },
  { name: 'Pink', value: '#EC4899', id: 'pink' },
  { name: 'Teal', value: '#14B8A6', id: 'teal' },
  { name: 'Indigo', value: '#6366F1', id: 'indigo' },
];

// Try to get saved theme color from localStorage
const savedThemeColorId = localStorage.getItem('themeColorId');
const savedThemeColor = savedThemeColorId 
  ? themeColors.find(color => color.id === savedThemeColorId) 
  : null;

// Try to get saved notification preferences from localStorage
const savedNotificationPrefs = localStorage.getItem('notificationPreferences');
const parsedNotificationPrefs = savedNotificationPrefs ? JSON.parse(savedNotificationPrefs) : null;

const initialState: UiState = {
  darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  highContrastMode: false,
  dyslexicFontMode: false,
  themeColor: savedThemeColor || themeColors[0], // Use saved color or default to blue theme
  sidebarOpen: false,
  modalOpen: {
    addShift: false,
    editShift: false,
    deleteConfirm: false,
    copyShift: false,
    insights: false,
    templates: false,
    addTemplate: false,
    editTemplate: false,
    savedViews: false,
  },
  currentView: 'weekly',
  notifications: [],
  selectedShiftId: null,
  selectedTemplateId: null,
  notificationPreferences: parsedNotificationPrefs || {
    enabled: true,
    sound: {
      enabled: true,
      volume: 0.7,
      type: 'default',
    },
    types: {
      shifts: true,
      scheduleChanges: true,
      reminders: true,
      timeOff: true,
      publication: true,
      shiftSwap: true,
      general: true,
    },
    visual: {
      style: 'standard',
      duration: 5000, // 5 seconds
      showBadges: true,
      colorCoded: true,
    },
    timing: {
      reminderLeadTime: '12hours',
      nonUrgentDeliveryTime: '09:00',
      deliveryFormat: 'immediate',
    },
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    toggleHighContrastMode: (state) => {
      state.highContrastMode = !state.highContrastMode;
    },
    toggleDyslexicFontMode: (state) => {
      state.dyslexicFontMode = !state.dyslexicFontMode;
    },
    setThemeColor: (state, action: PayloadAction<ThemeColor>) => {
      state.themeColor = action.payload;
      // Save to localStorage
      localStorage.setItem('themeColorId', action.payload.id);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setModalOpen: (state, action: PayloadAction<{ modal: keyof UiState['modalOpen']; isOpen: boolean }>) => {
      const { modal, isOpen } = action.payload;
      state.modalOpen[modal] = isOpen;
    },
    setCurrentView: (state, action: PayloadAction<UiState['currentView']>) => {
      state.currentView = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const { category } = action.payload;
      // If the notification has a category and that category is disabled, do not add it
      if (category && state.notificationPreferences.types[category] === false) {
        return;
      }
      const id = Date.now().toString();
      state.notifications.push({ 
        ...action.payload, 
        id,
        read: false // Add read status
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(notification => notification.id !== action.payload);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setSelectedShiftId: (state, action: PayloadAction<string | null>) => {
      state.selectedShiftId = action.payload;
    },
    setSelectedTemplateId: (state, action: PayloadAction<string | null>) => {
      state.selectedTemplateId = action.payload;
    },
    
    // Notification preferences
    toggleNotifications: (state) => {
      state.notificationPreferences.enabled = !state.notificationPreferences.enabled;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    toggleNotificationSound: (state) => {
      state.notificationPreferences.sound.enabled = !state.notificationPreferences.sound.enabled;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setNotificationSoundVolume: (state, action: PayloadAction<number>) => {
      state.notificationPreferences.sound.volume = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setNotificationSoundType: (state, action: PayloadAction<'default' | 'subtle' | 'distinct'>) => {
      state.notificationPreferences.sound.type = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    toggleNotificationType: (state, action: PayloadAction<keyof NotificationPreferences['types']>) => {
      const type = action.payload;
      state.notificationPreferences.types[type] = !state.notificationPreferences.types[type];
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setNotificationStyle: (state, action: PayloadAction<'standard' | 'minimal' | 'prominent'>) => {
      state.notificationPreferences.visual.style = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setNotificationDuration: (state, action: PayloadAction<number>) => {
      state.notificationPreferences.visual.duration = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    toggleNotificationBadges: (state) => {
      state.notificationPreferences.visual.showBadges = !state.notificationPreferences.visual.showBadges;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    toggleNotificationColorCoding: (state) => {
      state.notificationPreferences.visual.colorCoded = !state.notificationPreferences.visual.colorCoded;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setReminderLeadTime: (state, action: PayloadAction<'1hour' | '3hours' | '12hours' | '24hours'>) => {
      state.notificationPreferences.timing.reminderLeadTime = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setNonUrgentDeliveryTime: (state, action: PayloadAction<string>) => {
      state.notificationPreferences.timing.nonUrgentDeliveryTime = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    setDeliveryFormat: (state, action: PayloadAction<'immediate' | 'digest'>) => {
      state.notificationPreferences.timing.deliveryFormat = action.payload;
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
    updateNotificationPreferences: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.notificationPreferences = {
        ...state.notificationPreferences,
        ...action.payload
      };
      localStorage.setItem('notificationPreferences', JSON.stringify(state.notificationPreferences));
    },
  },
});

export const {
  toggleDarkMode,
  toggleHighContrastMode,
  toggleDyslexicFontMode,
  setThemeColor,
  toggleSidebar,
  setModalOpen,
  setCurrentView,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  clearAllNotifications,
  setSelectedShiftId,
  setSelectedTemplateId,
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
  setDeliveryFormat,
  updateNotificationPreferences,
} = uiSlice.actions;

export default uiSlice.reducer; 