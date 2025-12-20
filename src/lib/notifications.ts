import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for the scheduled reminder notification
const SCAN_REMINDER_ID_KEY = '@clearskin_scan_reminder_id';
const TWO_WEEKS_IN_SECONDS = 14 * 24 * 60 * 60; // 14 days

// Configure notification handler (how notifications appear when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 * @returns true if permissions granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification for scan completion
 * @param scanId - The ID of the completed scan
 * @param success - Whether the scan was successful
 */
export async function notifyScanComplete(scanId: string, success: boolean): Promise<void> {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permissions not granted, skipping notification');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: success ? '✨ Skin Analysis Complete!' : '❌ Analysis Failed',
      body: success 
        ? 'Your skin analysis is ready. Tap to view your results!'
        : 'Something went wrong with your analysis. Tap to try again.',
      data: { scanId, success, type: 'scan_complete' },
      sound: true,
      ...(Platform.OS === 'android' && {
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#10B981',
      }),
    },
    trigger: null, // null means send immediately
  });
}

/**
 * Add a notification response listener
 * @param callback - Function to call when user taps notification
 * @returns Subscription that should be removed on cleanup
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add a notification received listener (when notification arrives while app is open)
 * @param callback - Function to call when notification is received
 * @returns Subscription that should be removed on cleanup
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Schedule a bi-weekly reminder to scan skin
 * Cancels any existing reminder before scheduling a new one
 */
export async function scheduleScanReminder(): Promise<void> {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permissions not granted, skipping reminder scheduling');
    return;
  }

  // Cancel any existing reminder first
  await cancelScanReminder();

  // Schedule new reminder for 2 weeks from now
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📸 Time for a Skin Check!',
      body: "It's been 2 weeks since your last scan. Track your skin's progress with a new analysis!",
      data: { type: 'scan_reminder' },
      sound: true,
      ...(Platform.OS === 'android' && {
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        color: '#10B981',
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TWO_WEEKS_IN_SECONDS,
    },
  });

  // Store the notification ID so we can cancel it later
  await AsyncStorage.setItem(SCAN_REMINDER_ID_KEY, notificationId);
  console.log(`Scan reminder scheduled for 2 weeks from now (ID: ${notificationId})`);
}

/**
 * Cancel any existing scan reminder notification
 */
export async function cancelScanReminder(): Promise<void> {
  try {
    const existingReminderId = await AsyncStorage.getItem(SCAN_REMINDER_ID_KEY);
    if (existingReminderId) {
      await Notifications.cancelScheduledNotificationAsync(existingReminderId);
      await AsyncStorage.removeItem(SCAN_REMINDER_ID_KEY);
      console.log(`Cancelled existing scan reminder (ID: ${existingReminderId})`);
    }
  } catch (error) {
    console.error('Error cancelling scan reminder:', error);
  }
}

/**
 * Get all scheduled notifications (useful for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
