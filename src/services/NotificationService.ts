import { store } from '../store';
import { addNotification } from '../store/uiSlice';
import { Shift } from '../types';
import { combineDateAndTime } from '../utils/dateUtils';

class NotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private processedShiftReminders: Set<string> = new Set(); // Track which shifts have had reminders sent
  private unsubscribe: (() => void) | null = null; // Store unsubscribe function for Redux store

  // Initialize the notification service
  public initialize(): void {
    // Clear any existing intervals and subscriptions
    this.stop();
    
    // Clean up any outdated processed reminders
    this.cleanupProcessedReminders();
    
    // Check for notifications every minute
    this.checkInterval = setInterval(() => {
      console.log('NotificationService: Running scheduled check for upcoming shifts');
      this.checkUpcomingShifts();
    }, 60 * 1000);
    
    // Subscribe to store changes to detect new shifts being added
    let previousShiftsLength = store.getState().shifts.shifts.length;
    
    this.unsubscribe = store.subscribe(() => {
      // Get current state of shifts
      const state = store.getState();
      const currentShiftsLength = state.shifts.shifts.length;
      
      // Only perform a check if the number of shifts has changed
      // This will help reduce unnecessary checks
      if (currentShiftsLength !== previousShiftsLength) {
        console.log(`NotificationService: Shifts count changed from ${previousShiftsLength} to ${currentShiftsLength}, checking for reminders`);
        previousShiftsLength = currentShiftsLength;
        this.checkUpcomingShifts();
      }
    });
    
    // Do an immediate check on initialization
    console.log('NotificationService: Performing initial check for upcoming shifts');
    this.checkUpcomingShifts();
    
    console.log('NotificationService initialized');
  }

  // Stop the notification service
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Clean up processed reminders for shifts that have already passed
  private cleanupProcessedReminders(): void {
    const state = store.getState();
    const { shifts } = state.shifts;
    const now = new Date();
    const todayStr = this.formatDate(now);
    
    // Get all shift IDs
    const currentShiftIds = new Set(shifts.map(shift => shift.id));
    
    // Create a new set to hold valid reminders
    const validReminders = new Set<string>();
    
    // Check each processed reminder - convert Set to Array to avoid iteration issues
    Array.from(this.processedShiftReminders).forEach(reminderId => {
      // Extract the shift ID from the reminder ID (format: "reminder-{shiftId}")
      const shiftId = reminderId.split('-')[1];
      
      // If the shift no longer exists, skip it
      if (!currentShiftIds.has(shiftId)) {
        return;
      }
      
      // Find the shift
      const shift = shifts.find(s => s.id === shiftId);
      
      // If the shift is in the past, skip it
      if (shift && shift.date < todayStr) {
        return;
      }
      
      // If the shift exists and is today or in the future, keep the reminder
      validReminders.add(reminderId);
    });
    
    // Replace the processed reminders with the valid ones
    this.processedShiftReminders = validReminders;
    console.log(`NotificationService: Cleaned up processed reminders. ${this.processedShiftReminders.size} valid reminders remain.`);
  }

  // Check for upcoming shifts and send reminders
  private checkUpcomingShifts(): void {
    const state = store.getState();
    const { shifts } = state.shifts;
    const { notificationPreferences } = state.ui;
    
    console.log(`NotificationService: Checking ${shifts.length} shifts for potential reminders`);

    // If notifications are disabled or reminders specifically are disabled, don't proceed
    if (!notificationPreferences.enabled) {
      console.log('NotificationService: Notifications are disabled in preferences');
      return;
    }
    
    if (!notificationPreferences.types.reminders) {
      console.log('NotificationService: Reminder notifications specifically are disabled in preferences');
      return;
    }

    const now = new Date();
    const todayStr = this.formatDate(now);
    console.log(`NotificationService: Current date is ${todayStr}, current time is ${now.toLocaleTimeString()}`);

    // If no shifts, log that information
    if (shifts.length === 0) {
      console.log('NotificationService: No shifts found to check');
      return;
    }

    // Check each shift
    let processedCount = 0;
    let skippedCount = 0;
    let potentialReminders = 0;
    
    shifts.forEach(shift => {
      // Create a reminder ID to track if we've already sent a reminder for this shift
      const reminderId = `reminder-${shift.id}`;
      
      // Output the date we're checking
      console.log(`NotificationService: Checking shift on ${shift.date} at ${shift.startTime} (ID: ${shift.id})`);
      
      // Skip if we've already processed this shift
      if (this.processedShiftReminders.has(reminderId)) {
        console.log(`NotificationService: Skipping shift ${shift.id} - reminder already sent`);
        skippedCount++;
        return;
      }
      
      potentialReminders++;
      
      // Check if it's time to send a reminder based on the user's lead time preference
      if (this.shouldSendReminder(shift, notificationPreferences.timing.reminderLeadTime)) {
        // Send the reminder notification
        console.log(`NotificationService: ✓ Sending reminder for shift ${shift.id}`);
        this.sendShiftReminder(shift);
        
        // Mark this shift as processed so we don't send duplicate reminders
        this.processedShiftReminders.add(reminderId);
        processedCount++;
      } else {
        console.log(`NotificationService: ✗ No reminder needed yet for shift ${shift.id}`);
      }
    });
    
    console.log(`NotificationService: Check complete - ${skippedCount} shifts already notified, ${processedCount} new reminders sent, ${potentialReminders} potential future reminders`);
  }

  // Check if a specific shift needs a reminder
  public checkShiftReminder(shift: Shift): void {
    const state = store.getState();
    const { notificationPreferences } = state.ui;
    
    console.log(`NotificationService: Manually checking shift ${shift.id} for reminder`);
    
    // If notifications are disabled or reminders specifically are disabled, don't proceed
    if (!notificationPreferences.enabled || !notificationPreferences.types.reminders) {
      console.log('NotificationService: Notifications or reminders are disabled in preferences');
      return;
    }
    
    const reminderId = `reminder-${shift.id}`;
    
    // Skip if we've already processed this shift
    if (this.processedShiftReminders.has(reminderId)) {
      console.log(`NotificationService: Skipping shift ${shift.id} - reminder already sent`);
      return;
    }
    
    // Check if it's time to send a reminder
    if (this.shouldSendReminder(shift, notificationPreferences.timing.reminderLeadTime)) {
      console.log(`NotificationService: ✓ Sending reminder for shift ${shift.id}`);
      this.sendShiftReminder(shift);
      this.processedShiftReminders.add(reminderId);
    } else {
      console.log(`NotificationService: ✗ No reminder needed yet for shift ${shift.id}`);
    }
  }

  // Determine if it's time to send a reminder based on lead time preference
  private shouldSendReminder(shift: Shift, leadTime: string): boolean {
    const now = new Date();
    // Use the helper to combine date and time in local time
    const shiftDate = combineDateAndTime(shift.date, shift.startTime);
    // Log date calculations for debugging
    console.log(`NotificationService: Current time: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
    console.log(`NotificationService: Shift date: ${shiftDate.toLocaleDateString()} ${shiftDate.toLocaleTimeString()}`);
    // Calculate the time difference in milliseconds
    const timeDiff = shiftDate.getTime() - now.getTime();
    // Convert to hours
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    console.log(`NotificationService: Time until shift: ${hoursDiff.toFixed(2)} hours (${Math.floor(hoursDiff * 60)} minutes)`);
    // Convert lead time setting to hours for comparison
    let leadTimeHours = 0;
    switch (leadTime) {
      case '1hour':
        leadTimeHours = 1;
        break;
      case '3hours':
        leadTimeHours = 3;
        break;
      case '12hours':
        leadTimeHours = 12;
        break;
      case '24hours':
        leadTimeHours = 24;
        break;
    }
    // Check if the time difference is within the lead time window
    const shouldSend = hoursDiff > 0 && hoursDiff <= leadTimeHours;
    console.log(`NotificationService: Lead time preference: ${leadTime} (${leadTimeHours} hours), should send reminder: ${shouldSend}`);
    return shouldSend;
  }

  // Send a shift reminder notification
  private sendShiftReminder(shift: Shift): void {
    const message = `Reminder: You have a shift as ${shift.role} starting at ${shift.startTime} (${this.formatTimeFromNow(shift)})`;
    
    store.dispatch(addNotification({
      message,
      type: 'info',
      category: 'reminders'
    }));
    
    console.log('NotificationService: Shift reminder sent:', message);
  }

  // Format the date in YYYY-MM-DD format
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format a human-readable time from now string
  private formatTimeFromNow(shift: Shift): string {
    const now = new Date();
    const shiftDate = combineDateAndTime(shift.date, shift.startTime);
    // Calculate the time difference in minutes
    const minutesDiff = Math.floor((shiftDate.getTime() - now.getTime()) / (1000 * 60));
    if (minutesDiff < 60) {
      return `in ${minutesDiff} minutes`;
    } else {
      const hoursDiff = Math.floor(minutesDiff / 60);
      const remainingMinutes = minutesDiff % 60;
      if (remainingMinutes === 0) {
        return `in ${hoursDiff} hour${hoursDiff > 1 ? 's' : ''}`;
      } else {
        return `in ${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      }
    }
  }

  // Debug function to manually trigger a reminder for a test shift
  public debugTestReminder(): void {
    const state = store.getState();
    const { notificationPreferences } = state.ui;
    
    console.log('----- DEBUG: NOTIFICATION SERVICE TEST -----');
    console.log('Notification preferences:', notificationPreferences);
    console.log('Notifications enabled:', notificationPreferences.enabled);
    console.log('Reminder notifications enabled:', notificationPreferences.types.reminders);
    console.log('Reminder lead time setting:', notificationPreferences.timing.reminderLeadTime);
    
    // Create a test shift that is 55 minutes from now (should trigger 1 hour reminder)
    const now = new Date();
    const shiftTime = new Date(now.getTime() + 55 * 60 * 1000); // 55 minutes from now
    
    const hours = shiftTime.getHours();
    const minutes = shiftTime.getMinutes();
    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const endTime = `${(hours + 5).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const testShift: Shift = {
      id: `test-${Date.now()}`,
      date: this.formatDate(shiftTime),
      startTime,
      endTime,
      timeRange: `${startTime} - ${endTime}`,
      employeeName: 'Test Employee',
      role: 'Test Role',
      color: 'bg-blue-500',
      status: 'Confirmed'
    };
    
    console.log('Created test shift:', testShift);
    console.log('Current time:', now.toISOString());
    console.log('Current time (formatted):', now.toLocaleTimeString());
    console.log('Shift time:', shiftTime.toISOString());
    console.log('Shift time (formatted):', shiftTime.toLocaleTimeString());
    
    // Calculate time difference in minutes for clearer debugging
    const timeDiffMs = shiftTime.getTime() - now.getTime();
    const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
    const timeDiffHours = timeDiffMinutes / 60;
    
    console.log(`Time until shift: ${timeDiffMinutes} minutes (${timeDiffHours.toFixed(2)} hours)`);
    console.log(`Current reminder lead time setting: ${notificationPreferences.timing.reminderLeadTime}`);
    
    // Manually check if reminder should be sent
    const shouldSend = this.shouldSendReminder(testShift, notificationPreferences.timing.reminderLeadTime);
    console.log('Should send reminder based on current settings:', shouldSend);
    
    // Send the test reminder
    if (shouldSend) {
      console.log('✅ Sending test reminder notification');
      this.sendShiftReminder(testShift);
    } else {
      console.log('⚠️ Test reminder not sent - conditions not met');
      
      // Force send a notification for testing anyway
      console.log('🔔 Forcing test notification...');
      store.dispatch(addNotification({
        message: `TEST NOTIFICATION: Shift scheduled at ${startTime} (in ${timeDiffMinutes} minutes)`,
        type: 'info',
        category: 'reminders'
      }));
    }
    
    console.log('----- END DEBUG TEST -----');
  }

  // Reset processed reminders - useful for testing
  public resetProcessedReminders(): void {
    console.log(`NotificationService: Resetting processed reminders. Was tracking ${this.processedShiftReminders.size} reminders.`);
    this.processedShiftReminders.clear();
    console.log('NotificationService: All processed reminders have been cleared.');
    
    // Force a check for upcoming shifts
    this.checkUpcomingShifts();
  }
}

// Create a singleton instance
export const notificationService = new NotificationService(); 